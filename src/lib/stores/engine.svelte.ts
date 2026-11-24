import { browser } from '$app/environment';
import type { Backend, FileProgress, FromWorker, ModelKey, ScoreResult, ToWorker } from '$lib/types';

export const MODEL_INFO: Record<ModelKey, { name: string; repo: string; size: string }> = {
	fast: { name: 'SmolLM2-135M-Instruct', repo: 'HuggingFaceTB/SmolLM2-135M-Instruct', size: '~182 MB' },
	accurate: { name: 'Qwen2.5-0.5B', repo: 'onnx-community/Qwen2.5-0.5B', size: '~786 MB' }
};

type Status = 'idle' | 'loading' | 'ready' | 'error';

class Engine {
	choice = $state<ModelKey>('accurate');
	status = $state<Record<ModelKey, Status>>({ fast: 'idle', accurate: 'idle' });
	files = $state<Record<string, FileProgress>>({});
	loadingModel = $state<ModelKey | null>(null);
	backend = $state<Backend | null>(null);
	busy = $state(false);
	error = $state<string | null>(null);
	history = $state<ScoreResult[]>([]);
	readonly supported = browser && typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';

	private worker: Worker | null = null;
	private seq = 0;
	private pending = new Map<number, { resolve: (r: ScoreResult | void) => void; reject: (e: Error) => void; onToken?: (t: string, p: number) => void }>();

	constructor() {
		if (!browser) return;
		const saved = localStorage.getItem('hw-model');
		if (saved === 'fast' || saved === 'accurate') this.choice = saved;
	}

	setChoice(m: ModelKey) {
		this.choice = m;
		localStorage.setItem('hw-model', m);
	}

	get progress() {
		let loaded = 0;
		let total = 0;
		let current = '';
		for (const f of Object.values(this.files)) {
			loaded += f.done ? f.total || f.loaded : f.loaded;
			total += f.total;
			if (!f.done && f.total) current = f.file;
		}
		return { loaded, total, frac: total ? loaded / total : 0, current };
	}

	private w(): Worker {
		if (this.worker) return this.worker;
		const w = new Worker(new URL('../worker/model.worker.ts', import.meta.url), { type: 'module' });
		w.onmessage = (e: MessageEvent<FromWorker>) => this.onMessage(e.data);
		w.onerror = (e) => this.fail(e.message || 'The model worker crashed.');
		return (this.worker = w);
	}

	private fail(message: string, id?: number, model?: ModelKey) {
		this.error = message;
		if (model && this.status[model] === 'loading') this.status[model] = 'error';
		this.loadingModel = null;
		const targets = id !== undefined ? [id] : [...this.pending.keys()];
		for (const k of targets) {
			this.pending.get(k)?.reject(new Error(message));
			this.pending.delete(k);
		}
		this.busy = this.pending.size > 0;
	}

	private onMessage(m: FromWorker) {
		if (m.type === 'progress') {
			this.backend = m.backend;
			if (this.status[m.model] !== 'ready') {
				this.status[m.model] = 'loading';
				this.loadingModel = m.model;
			}
			this.files[`${m.model}/${m.file}`] = { file: m.file, loaded: m.loaded, total: m.total, done: m.done };
		} else if (m.type === 'ready') {
			this.status[m.model] = 'ready';
			this.backend = m.backend;
			this.loadingModel = null;
			this.files = {};
		} else if (m.type === 'result') {
			this.history = [m.result, ...this.history].slice(0, 12);
			this.settle(m.id, m.result);
		} else if (m.type === 'gen-token') {
			this.pending.get(m.id)?.onToken?.(m.token, m.p);
		} else if (m.type === 'gen-done') {
			this.settle(m.id);
		} else if (m.type === 'error') {
			this.fail(m.message, m.id, m.model);
		}
	}

	private settle(id: number, r?: ScoreResult) {
		this.pending.get(id)?.resolve(r);
		this.pending.delete(id);
		this.busy = this.pending.size > 0;
	}

	private send<T>(msg: Omit<Extract<ToWorker, { id: number }>, 'id'>, onToken?: (t: string, p: number) => void) {
		this.error = null;
		this.busy = true;
		const id = ++this.seq;
		if (this.status[msg.model] !== 'ready') this.status[msg.model] = 'loading';
		const p = new Promise<T>((resolve, reject) =>
			this.pending.set(id, { resolve: resolve as (r: ScoreResult | void) => void, reject, onToken })
		);
		this.w().postMessage({ ...msg, id } as ToWorker);
		return p;
	}

	score(text: string, model: ModelKey = this.choice) {
		return this.send<ScoreResult>({ type: 'score', model, text });
	}

	continueText(text: string, onToken: (t: string, p: number) => void, model: ModelKey = this.choice) {
		return this.send<void>({ type: 'continue', model, text }, onToken);
	}
}

export const engine = new Engine();
