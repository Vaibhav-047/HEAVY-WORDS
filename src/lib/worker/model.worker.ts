/// <reference lib="webworker" />
import {
	AutoModelForCausalLM,
	AutoTokenizer,
	BaseStreamer,
	LogitsProcessor,
	Tensor,
	env,
	type PreTrainedModel,
	type PreTrainedTokenizer
} from '@huggingface/transformers';
import { logSumExp, topK } from '../math/perplexity';
import type { Backend, Cand, FromWorker, ModelKey, ScoreResult, ToWorker, TokenScore } from '../types';

env.allowLocalModels = false;

// dtype: q4 (4-bit weights, fp32 activations) for both models. Measured in this repo, the brief's choices were wrong:
// - int8 quantizes activations per tensor over the whole sequence, so later tokens change earlier P's
//   (P("The") differed between "The cat" and "The dog sat"), and on WebGPU it returned P = 0 everywhere.
// - Qwen2.5 q4f16 on WebGPU returns an all-zero logits row at the start-token position (fp16 overflow),
//   so the first token always got the uniform 1/151936.
const MODELS: Record<ModelKey, { repo: string; pick: (gpu: Backend) => { dtype: 'q4'; device: Backend } }> = {
	// 135M is fast enough on CPU; WASM is the tested path.
	fast: { repo: 'HuggingFaceTB/SmolLM2-135M-Instruct', pick: () => ({ dtype: 'q4', device: 'wasm' }) },
	accurate: { repo: 'onnx-community/Qwen2.5-0.5B', pick: (b) => ({ dtype: 'q4', device: b }) }
};
const MAX_TOKENS = 512;

const post = (m: FromWorker) => self.postMessage(m);

let backendP: Promise<Backend> | null = null;
function detectBackend(): Promise<Backend> {
	return (backendP ??= (async () => {
		try {
			const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
			if (gpu && (await gpu.requestAdapter())) return 'webgpu';
		} catch {
			/* fall through */
		}
		return 'wasm';
	})());
}

interface Loaded {
	tokenizer: PreTrainedTokenizer;
	model: PreTrainedModel;
	startId: number;
	backend: Backend;
}
const loaded = new Map<ModelKey, Promise<Loaded>>();

function load(key: ModelKey): Promise<Loaded> {
	let p = loaded.get(key);
	if (!p) {
		p = (async () => {
			const { repo, pick } = MODELS[key];
			const { dtype, device: backend } = pick(await detectBackend());
			const progress_callback = (e: { status: string; file?: string; loaded?: number; total?: number }) => {
				if (!e.file) return;
				if (e.status === 'progress' || e.status === 'done' || e.status === 'initiate')
					post({
						type: 'progress',
						model: key,
						backend,
						file: e.file,
						loaded: e.loaded ?? 0,
						total: e.total ?? 0,
						done: e.status === 'done'
					});
			};
			const tokenizer = await AutoTokenizer.from_pretrained(repo, { progress_callback });
			const model = await AutoModelForCausalLM.from_pretrained(repo, {
				dtype,
				device: backend,
				progress_callback
			});
			// Start token: bos_token_id if the tokenizer defines one, otherwise <|endoftext|>.
			// SmolLM2-Instruct: bos = <|im_start|>. Qwen2.5 base: bos = null -> <|endoftext|>.
			const t = tokenizer as unknown as { bos_token_id?: number; model: { tokens_to_ids: Map<string, number> } };
			const startId = t.bos_token_id ?? t.model.tokens_to_ids.get('<|endoftext|>');
			if (startId === undefined) throw new Error('Tokenizer has no start token');
			post({ type: 'ready', model: key, backend });
			return { tokenizer, model, startId, backend };
		})();
		p.catch(() => loaded.delete(key)); // allow a retry after a failed download
		loaded.set(key, p);
	}
	return p;
}

/** Logits may come back as fp16 bits (Uint16Array) where Float16Array is missing. */
function f16(h: number): number {
	const s = h & 0x8000 ? -1 : 1;
	const e = (h >> 10) & 0x1f;
	const f = h & 0x3ff;
	if (e === 0) return s * 2 ** -14 * (f / 1024);
	if (e === 31) return f ? NaN : s * Infinity;
	return s * 2 ** (e - 15) * (1 + f / 1024);
}
function row(data: ArrayLike<number>, t: number, V: number): Float32Array {
	const out = new Float32Array(V);
	const off = t * V;
	if (data instanceof Uint16Array) for (let i = 0; i < V; i++) out[i] = f16(data[off + i]);
	else for (let i = 0; i < V; i++) out[i] = data[off + i];
	return out;
}

/** A flat or non-finite logits row means the backend broke (fp16 overflow etc.); never report it as a probability. */
function check(r: Float32Array, lse: number, pos: number) {
	let flat = true;
	for (let i = 1; i < r.length && flat; i++) flat = r[i] === r[0];
	if (flat || !Number.isFinite(lse))
		throw new Error(`The model returned an invalid distribution at position ${pos}. Try the other model or backend.`);
}

function encode(m: Loaded, text: string): number[] {
	if (!text.trim()) throw new Error('Type a sentence first.');
	const ids = m.tokenizer.encode(text, { add_special_tokens: false });
	if (ids.length === 0) throw new Error('Nothing to weigh.');
	if (ids.length > MAX_TOKENS) throw new Error(`Too long: ${ids.length} tokens (max ${MAX_TOKENS}).`);
	return [m.startId, ...ids];
}
const int64 = (ids: number[]) => new Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]);
const dec = (m: Loaded, id: number) => m.tokenizer.decode([id], { skip_special_tokens: false });
const cands = (m: Loaded, r: Float32Array, lse: number): Cand[] =>
	topK(r, 8, lse).map(({ id, p }) => ({ token: dec(m, id), p }));

async function score(key: ModelKey, text: string): Promise<ScoreResult> {
	const m = await load(key);
	const ids = encode(m, text);
	const t0 = performance.now();
	const out = (await m.model({
		input_ids: int64(ids),
		attention_mask: new Tensor('int64', new BigInt64Array(ids.length).fill(1n), [1, ids.length])
	})) as { logits: Tensor };
	const [, T, V] = out.logits.dims;
	const data = out.logits.data as ArrayLike<number>;

	const tokens: TokenScore[] = [];
	let hSum = 0;
	for (let i = 1; i < T; i++) {
		// P(token i | tokens < i) = log-softmax of logits at position i-1
		const r = row(data, i - 1, V);
		const lse = logSumExp(r);
		check(r, lse, i - 1);
		const lp = r[ids[i]] - lse;
		const h = -lp;
		hSum += h;
		tokens.push({ token: dec(m, ids[i]), id: ids[i], p: Math.exp(lp), h, top8: cands(m, r, lse) });
	}
	const last = row(data, T - 1, V);
	const mean = hSum / tokens.length;
	return {
		text,
		model: key,
		backend: m.backend,
		tokens,
		next8: cands(m, last, logSumExp(last)),
		meanSurprisal: mean,
		perplexity: Math.exp(mean), // log space: exp(mean surprisal)
		ms: performance.now() - t0
	};
}

/** Records the (processed) logits of each generation step so the streamer can report P(chosen token). */
class Recorder extends LogitsProcessor {
	last: Float32Array | null = null;
	_call(_ids: bigint[][], logits: Tensor) {
		const d = logits.data as ArrayLike<number>;
		this.last = row(d, 0, logits.dims.at(-1)!);
		return logits;
	}
}

class ProbStreamer extends BaseStreamer {
	private first = true;
	private ids: number[] = [];
	private text = '';
	constructor(
		private m: Loaded,
		private rec: Recorder,
		private id: number
	) {
		super();
	}
	put(value: bigint[][]) {
		if (this.first) return void (this.first = false); // first call is the prompt
		const tok = Number(value[0][0]);
		const r = this.rec.last!;
		const p = Math.exp(r[tok] - logSumExp(r));
		this.ids.push(tok);
		// Decode the whole run so multi-byte characters split over tokens come out right.
		const full = this.m.tokenizer.decode(this.ids, { skip_special_tokens: true });
		const token = full.slice(this.text.length);
		this.text = full;
		post({ type: 'gen-token', id: this.id, token, p });
	}
	end() {}
}

async function cont(key: ModelKey, text: string, id: number) {
	const m = await load(key);
	const ids = encode(m, text);
	const rec = new Recorder();
	await m.model.generate({
		inputs: int64(ids),
		attention_mask: new Tensor('int64', new BigInt64Array(ids.length).fill(1n), [1, ids.length]),
		max_new_tokens: 30,
		do_sample: false,
		repetition_penalty: 1.0,
		logits_processor: [rec],
		streamer: new ProbStreamer(m, rec, id)
	} as unknown as Parameters<PreTrainedModel["generate"]>[0]); // an array is what extend() spreads at runtime
	post({ type: 'gen-done', id });
}

// One job at a time: the session is not re-entrant.
let queue: Promise<unknown> = Promise.resolve();
self.onmessage = (e: MessageEvent<ToWorker>) => {
	const msg = e.data;
	queue = queue.then(async () => {
		try {
			if (msg.type === 'load') await load(msg.model);
			else if (msg.type === 'score') post({ type: 'result', id: msg.id, result: await score(msg.model, msg.text) });
			else if (msg.type === 'continue') await cont(msg.model, msg.text, msg.id);
		} catch (err) {
			post({
				type: 'error',
				id: 'id' in msg ? msg.id : undefined,
				model: msg.model,
				message: err instanceof Error ? err.message : String(err)
			});
		}
	});
};
