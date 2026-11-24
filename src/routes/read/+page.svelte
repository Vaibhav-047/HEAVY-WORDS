<script lang="ts">
	import { base } from '$app/paths';
	import { engine, MODEL_INFO } from '$lib/stores/engine.svelte';
	import { fmt } from '$lib/math/perplexity';
	import { fvsFor } from '$lib/type/axes';
	import { settle } from '$lib/actions';
	import WeightedLine, { visible } from '$lib/components/WeightedLine.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Wheel from '$lib/components/Wheel.svelte';
	import Odometer from '$lib/components/Odometer.svelte';
	import Equation from '$lib/components/Equation.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import NextBars from '$lib/components/NextBars.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import Compare from '$lib/components/Compare.svelte';
	import DownloadState from '$lib/components/DownloadState.svelte';
	import type { ScoreResult } from '$lib/types';

	const CHIPS = ['I love Python', 'Python love I', 'The capital of France is Paris'];

	let text = $state('The capital of France is Paris');
	let result = $state<ScoreResult | null>(null);
	let mode = $state<'text' | 'tokens'>('text');
	let hover = $state(-1);
	let open = $state(-1);
	let gen = $state<{ token: string; p: number; h: number }[]>([]);
	let generating = $state(false);
	let cmp = $state<{ a: ScoreResult; b: ScoreResult } | null>(null);
	let err = $state<string | null>(null);

	const stats = $derived.by(() => {
		if (!result) return null;
		const t = result.tokens;
		const hi = t.reduce((b, x) => (x.h > b.h ? x : b));
		const lo = t.reduce((b, x) => (x.h < b.h ? x : b));
		return { hi, lo };
	});
	const insp = $derived(result && hover >= 0 ? result.tokens[hover] : null);

	async function guard<T>(fn: () => Promise<T>) {
		if (engine.busy) return;
		err = null;
		try {
			return await fn();
		} catch (e) {
			err = e instanceof Error ? e.message : String(e);
		}
	}
	const run = () =>
		guard(async () => {
			gen = [];
			hover = -1;
			result = await engine.score(text);
		});
	const cont = () =>
		guard(async () => {
			gen = [];
			generating = true;
			try {
				await engine.continueText(text, (token, p) => (gen = [...gen, { token, p, h: -Math.log(p) }]));
			} finally {
				generating = false;
			}
		});
	const compare = () =>
		guard(async () => {
			const a = await engine.score(text, 'fast');
			const b = await engine.score(text, 'accurate');
			cmp = { a, b };
			result = engine.choice === 'fast' ? a : b;
		});
	function reset() {
		result = null;
		cmp = null;
		gen = [];
		text = '';
		err = null;
		hover = -1;
	}
	function key(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			run();
		}
	}
	const errMsg = $derived(err ?? engine.error);
</script>

<svelte:head>
	<title>Read — HEAVY WORDS</title>
</svelte:head>

<section class="wrap band grid">
	<div class="head">
		<span class="label">FIG. 02 — Read · a real model, in your browser</span>
		<h1 class="h2" use:settle style:--fw="900">Weigh a sentence</h1>
	</div>

	<div class="input">
		<label class="sr-only" for="sentence">Sentence to weigh</label>
		<textarea id="sentence" rows="2" bind:value={text} onkeydown={key} placeholder="TYPE A SENTENCE — ENTER TO WEIGH IT" spellcheck="false" maxlength="2000"></textarea>
		<div class="chips">
			<span class="label">Try</span>
			{#each CHIPS as c (c)}
				<button class="chip" type="button" onclick={() => ((text = c), run())} disabled={engine.busy}>{c}</button>
			{/each}
		</div>
	</div>

	<div class="controls">
		<div class="row">
			<span class="label">Model</span>
			<Switch label="Use the accurate model" off="Fast" on="Accurate" checked={engine.choice === 'accurate'} disabled={engine.busy} onchange={(v) => engine.setChoice(v ? 'accurate' : 'fast')} />
		</div>
		<p class="mono small">{MODEL_INFO[engine.choice].name} · {MODEL_INFO[engine.choice].size}{engine.status[engine.choice] === 'ready' ? ' · loaded' : ' · loads on first run'}</p>
		<div class="row btns">
			<button class="btn solid" type="button" onclick={run} disabled={engine.busy || !text.trim()}>Run</button>
			<button class="btn" type="button" onclick={cont} disabled={engine.busy || !text.trim()}>Continue</button>
			<button class="btn" type="button" onclick={compare} disabled={engine.busy || !text.trim()}>Compare models</button>
			<button class="btn" type="button" onclick={reset} disabled={engine.busy}>Reset</button>
		</div>
	</div>
</section>

{#if !engine.supported}
	<section class="wrap"><div class="msg" role="alert">
		<b>This browser can't run the model</b> (it needs Web Workers and WebAssembly). The <a class="link" href="{base}/lab">Lab</a> works everywhere — type your own probabilities there.
	</div></section>
{/if}

{#if engine.loadingModel}
	<div class="wrap"><DownloadState /></div>
{/if}

{#if errMsg}
	<section class="wrap"><div class="msg" role="alert">
		<b>Something went wrong:</b> <span class="mono">{errMsg}</span><br />
		If the model can't load here, try the Fast model, or use the <a class="link" href="{base}/lab">Lab</a>, which always works.
	</div></section>
{/if}

<section class="wrap grid stage-sec">
	<div class="stage">
		<div class="bar">
			<span class="label">FIG. 03 — Weight {result ? `· ${result.model.toUpperCase()} · ${result.backend.toUpperCase()}` : ''}</span>
			<Switch label="Show as tokens" off="As text" on="As tokens" checked={mode === 'tokens'} onchange={(v) => (mode = v ? 'tokens' : 'text')} />
		</div>

		{#if result}
			<WeightedLine tokens={result.tokens} {mode} interactive selected={open} onpick={(i) => (open = i)} onhover={(i) => (hover = i)} label="Weighted sentence: {result.text}" />
			{#if gen.length || generating}
				<div class="gen" aria-live="polite">
					<span class="label">Continue — the model's own next {gen.length} tokens (greedy), each weighted by its P</span>
					<p class="gen-line">
						{#each gen as g, i (i)}<span style:font-variation-settings={fvsFor(g.h)} title="P = {fmt(g.p, 3)}">{mode === 'tokens' ? visible(g.token) : g.token}</span>{/each}{#if generating}<span class="caret" aria-hidden="true">▍</span>{/if}
					</p>
				</div>
			{/if}
			<p class="insp mono" aria-live="polite">
				{#if insp}
					<span>“{visible(insp.token)}”</span><span>P {fmt(insp.p, 4)}</span><span>1/P {fmt(1 / insp.p, 4)}</span><span>−ln P {fmt(insp.h, 4)}</span><span class="hint">Enter / click → candidates</span>
				{:else}
					Hover or Tab through the tokens. Enter opens the candidates.
				{/if}
			</p>
		{:else}
			<p class="empty">Nothing weighed yet. Type a sentence and press <b>Run</b>. The first run downloads the model once ({MODEL_INFO[engine.choice].size}).</p>
			{#if gen.length || generating}
				<p class="gen-line">{#each gen as g, i (i)}<span style:font-variation-settings={fvsFor(g.h)}>{g.token}</span>{/each}</p>
			{/if}
		{/if}
	</div>

	<aside class="rail" aria-label="Readouts">
		<span class="label">Perplexity</span>
		<div class="ppl">
			{#if result}{#key result}<Odometer value={result.perplexity} />{/key}{:else}<span aria-label="No result">—</span>{/if}
		</div>
		{#if result && stats}
			<dl class="stats mono">
				<div><dt>Mean surprisal</dt><dd>{fmt(result.meanSurprisal, 4)} nats</dd></div>
				<div><dt>Tokens</dt><dd>{result.tokens.length}</dd></div>
				<div><dt>Heaviest</dt><dd><span class="hw" style:font-variation-settings={fvsFor(stats.hi.h)}>{visible(stats.hi.token)}</span> {fmt(stats.hi.p, 2)}</dd></div>
				<div><dt>Lightest</dt><dd><span class="hw" style:font-variation-settings={fvsFor(stats.lo.h)}>{visible(stats.lo.token)}</span> {fmt(stats.lo.p, 2)}</dd></div>
				<div><dt>Run time</dt><dd>{result.ms.toFixed(0)} ms</dd></div>
				<div><dt>Backend</dt><dd>{result.backend.toUpperCase()}</dd></div>
			</dl>
			<Wheel ppl={result.perplexity} />
		{/if}
		{#if engine.history.length}
			<div class="hist">
				<span class="label">This session</span>
				<ol>
					{#each engine.history as h, i (h)}
						<li>
							<button type="button" class="hbtn" onclick={() => ((result = h), (text = h.text), (gen = []))} aria-label="Show run {engine.history.length - i}: {h.text}, perplexity {fmt(h.perplexity, 3)}">
								<WeightedLine tokens={h.tokens} showP={false} size="20px" stagger={0} label={h.text} />
								<span class="mono small">PPL {fmt(h.perplexity, 3)} · {h.model.toUpperCase()}</span>
							</button>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	</aside>
</section>

{#if result}
	<section class="wrap grid sec rule-t">
		<div class="c7">
			<span class="label">FIG. 04 — The worked calculation</span>
			<Equation ps={result.tokens.map((t) => t.p)} />
		</div>
		<div class="c5">
			<span class="label">FIG. 05 — What the model expected next, after the whole sentence</span>
			<NextBars cands={result.next8} />
		</div>
	</section>

	<section class="wrap sec rule-t">
		<span class="label">FIG. 06 — Data</span>
		<DataTable tokens={result.tokens} />
	</section>
{/if}

{#if cmp}
	<section class="wrap sec rule-t">
		<span class="label">FIG. 07 — Compare · same sentence, two models</span>
		<Compare a={cmp.a} b={cmp.b} />
	</section>
{/if}

<Drawer tok={result && open >= 0 ? result.tokens[open] : null} index={open} onclose={() => (open = -1)} />

<style>
	.band {
		padding-block: 32px 24px;
		row-gap: 24px;
		border-bottom: 1px solid var(--rule);
	}
	.head {
		grid-column: 1 / -1;
		display: grid;
		gap: 10px;
	}
	.input {
		grid-column: 1 / span 8;
		display: grid;
		gap: 14px;
	}
	textarea {
		width: 100%;
		resize: vertical;
		border: 0;
		border-bottom: 4px solid var(--ink);
		background: transparent;
		font-family: var(--display);
		font-size: clamp(26px, 3vw, 44px);
		font-variation-settings: 'wght' 350, 'wdth' 95;
		line-height: 1.15;
		padding: 8px 0;
		border-radius: 0;
	}
	textarea::placeholder {
		font-family: var(--mono);
		font-size: 14px;
		letter-spacing: 0.12em;
		color: var(--ink-3);
		font-variation-settings: normal;
	}
	textarea:focus-visible {
		outline: none;
		border-bottom-color: var(--hi);
		box-shadow: 0 4px 0 var(--ink);
	}
	.chips {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
	.controls {
		grid-column: 9 / -1;
		display: grid;
		gap: 12px;
		align-content: start;
	}
	.row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}
	.btns .btn {
		flex: 1 1 auto;
	}
	.small {
		font-size: 12px;
		margin: 0;
		color: var(--ink-2);
	}
	.msg {
		margin-top: 20px;
		border: 1.5px solid var(--fault);
		border-left-width: 8px;
		padding: 14px 18px;
		background: var(--paper-2);
	}
	.stage-sec {
		padding-block: 32px;
		row-gap: 40px;
	}
	.stage {
		grid-column: 1 / span 8;
		min-width: 0;
	}
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		border-bottom: 1.5px solid var(--ink);
		padding-bottom: 10px;
		margin-bottom: 28px;
	}
	.empty {
		font-size: clamp(24px, 2.8vw, 40px);
		line-height: 1.15;
		color: var(--ink-2);
		font-variation-settings: 'wght' 250, 'wdth' 90;
		max-width: 26ch;
	}
	.empty b {
		font-weight: normal;
		font-variation-settings: 'wght' 900, 'wdth' 100;
		color: var(--ink);
	}
	.gen {
		margin-top: 16px;
		border-top: 1px dashed var(--ink-3);
		padding-top: 10px;
	}
	.gen-line {
		font-size: clamp(24px, 3vw, 44px);
		line-height: 1.3;
		white-space: pre-wrap;
		color: var(--ink-2);
		margin: 8px 0 0;
	}
	.caret {
		animation: blink 1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	.insp {
		margin-top: 28px;
		font-size: 13px;
		display: flex;
		gap: 18px;
		flex-wrap: wrap;
		min-height: 1.5em;
		color: var(--ink-2);
		border-top: 1px solid var(--rule);
		padding-top: 10px;
	}
	.insp span:first-child {
		color: var(--ink);
		font-weight: 700;
	}
	.hint {
		margin-left: auto;
	}
	.rail {
		grid-column: 9 / -1;
		display: grid;
		gap: 18px;
		align-content: start;
		border-left: 1px solid var(--rule);
		padding-left: var(--gutter);
		min-width: 0;
	}
	.ppl {
		font-size: clamp(80px, 9.5vw, 190px);
		font-variation-settings: 'wght' 1000, 'wdth' 70;
		letter-spacing: -0.04em;
		line-height: 0.9;
		margin-top: -10px;
	}
	.stats {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		font-size: 13px;
		border-top: 1.5px solid var(--ink);
	}
	.stats div {
		border-bottom: 1px solid var(--rule);
		padding: 8px 0;
	}
	dt {
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	dd {
		margin: 0;
	}
	.hw {
		font-family: var(--display);
		font-size: 22px;
		white-space: pre;
	}
	.hist ol {
		list-style: none;
		margin: 8px 0 0;
		padding: 0;
		display: grid;
		gap: 4px;
	}
	.hbtn {
		all: unset;
		display: grid;
		gap: 2px;
		width: 100%;
		padding: 8px 0;
		border-bottom: 1px solid var(--rule);
		cursor: pointer;
	}
	.hbtn:focus-visible {
		outline: 2px solid var(--ink);
	}
	.sec {
		padding-block: 40px;
		display: grid;
		row-gap: 24px;
	}
	.c7 {
		grid-column: 1 / span 7;
		display: grid;
		gap: 16px;
		align-content: start;
	}
	.c5 {
		grid-column: 8 / -1;
		display: grid;
		gap: 16px;
		align-content: start;
	}
	@media (max-width: 1023px) {
		.input,
		.controls,
		.stage,
		.rail,
		.c7,
		.c5 {
			grid-column: 1 / -1;
		}
		.rail {
			border-left: 0;
			padding-left: 0;
			border-top: 1.5px solid var(--ink);
			padding-top: 16px;
		}
	}
</style>
