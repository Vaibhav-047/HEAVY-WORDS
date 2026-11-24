<script lang="ts">
	import { fmt, perplexity } from '$lib/math/perplexity';
	import { fvsFor } from '$lib/type/axes';
	import { settle } from '$lib/actions';
	import WeightedLine from '$lib/components/WeightedLine.svelte';
	import Wheel from '$lib/components/Wheel.svelte';
	import Odometer from '$lib/components/Odometer.svelte';
	import Equation from '$lib/components/Equation.svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	interface Row {
		id: number;
		token: string;
		p: number;
	}
	let uid = 0;
	const mk = (pairs: [string, number][]): Row[] => pairs.map(([token, p]) => ({ id: ++uid, token, p }));
	const PRESETS: Record<string, () => Row[]> = {
		'I love Python': () => mk([['I', 0.5], [' love', 0.8], [' Python', 0.2]]),
		'All 1/8': () => mk(['A', ' B', ' C', ' D', ' E', ' F', ' G', ' H'].map((t) => [t, 0.125] as [string, number])),
		'One surprising word': () => mk([['The', 0.9], [' cat', 0.9], [' sat', 0.9], [' quietly', 0.01]])
	};

	let rows = $state<Row[]>(PRESETS['I love Python']());
	const valid = (p: number) => Number.isFinite(p) && p > 0 && p <= 1;
	const ok = $derived(rows.length > 0 && rows.every((r) => valid(r.p)));
	const tokens = $derived(rows.map((r) => ({ token: r.token, p: r.p, h: valid(r.p) ? -Math.log(r.p) : 0 })));
	const ppl = $derived(ok ? perplexity(rows.map((r) => r.p)) : NaN);

	const H_SLIDER = 9.2; // −ln(0.0001)
	const add = () => (rows = [...rows, { id: ++uid, token: ' word', p: 0.5 }]);
	const remove = (id: number) => (rows = rows.filter((r) => r.id !== id));
</script>

<svelte:head>
	<title>Lab — HEAVY WORDS</title>
</svelte:head>

<section class="wrap grid band">
	<div class="head">
		<span class="stamp">SIMULATED — not from the model</span>
		<h1 class="h2" use:settle style:--fw="900">Lab</h1>
		<p class="lede">Set the probabilities yourself and watch the weights, the wheel and the perplexity follow. Nothing here touches a model, so it works in every browser.</p>
	</div>
	<div class="presets">
		<span class="label">Presets</span>
		{#each Object.keys(PRESETS) as name (name)}
			<button class="chip" type="button" onclick={() => (rows = PRESETS[name]())}>{name}</button>
		{/each}
	</div>
</section>

<section class="wrap grid main">
	<div class="stage">
		<span class="label">FIG. L1 — Weight (simulated)</span>
		{#if ok}
			<WeightedLine {tokens} label="Simulated sentence" />
		{:else}
			<p class="msg" role="alert">Every probability must be greater than 0 and at most 1{rows.length ? '' : ', and you need at least one token'}.</p>
		{/if}

		<div class="scroll"><table class="rows">
			<caption class="label">Tokens and probabilities — type a value or drag its weight</caption>
			<thead><tr><th>#</th><th>Token</th><th>P</th><th>Weight (−ln P)</th><th><span class="sr-only">Remove</span></th></tr></thead>
			<tbody>
				{#each rows as r, i (r.id)}
					<tr class:bad={!valid(r.p)}>
						<td class="mono">{i + 1}</td>
						<td><input class="tok" style:font-variation-settings={fvsFor(valid(r.p) ? -Math.log(r.p) : 0)} aria-label="Token {i + 1}" bind:value={r.token} /></td>
						<td>
							<input class="mono num" type="number" min="0.0001" max="1" step="0.001" aria-label="Probability of token {i + 1}" aria-invalid={!valid(r.p)} bind:value={r.p} />
						</td>
						<td>
							<input
								type="range"
								min="0"
								max={H_SLIDER}
								step="0.01"
								aria-label="Weight of token {i + 1}"
								aria-valuetext="probability {fmt(r.p, 3)}"
								value={valid(r.p) ? Math.min(H_SLIDER, -Math.log(r.p)) : 0}
								oninput={(e) => (r.p = Number(Math.exp(-Number(e.currentTarget.value)).toPrecision(4)))}
							/>
						</td>
						<td><button class="btn x" type="button" onclick={() => remove(r.id)} aria-label="Remove token {i + 1}">−</button></td>
					</tr>
				{/each}
			</tbody>
		</table></div>
		<button class="btn" type="button" onclick={add}>+ Add token</button>
	</div>

	<aside class="rail" aria-label="Readouts">
		<span class="label">Perplexity (simulated)</span>
		<div class="ppl">{#if ok}<Odometer value={ppl} />{:else}—{/if}</div>
		{#if ok}<Wheel {ppl} />{/if}
	</aside>
</section>

{#if ok}
	<section class="wrap sec rule-t">
		<span class="label">FIG. L2 — The worked calculation</span>
		<Equation ps={rows.map((r) => r.p)} />
	</section>
	<section class="wrap sec rule-t">
		<span class="label">FIG. L3 — Data</span>
		<DataTable {tokens} />
	</section>
{/if}

<style>
	.band {
		padding-block: 32px 24px;
		row-gap: 20px;
		border-bottom: 1px solid var(--rule);
	}
	.head {
		grid-column: 1 / span 8;
		display: grid;
		gap: 16px;
		justify-items: start;
	}
	.lede {
		max-width: 56ch;
		color: var(--ink-2);
		margin: 0;
	}
	.presets {
		grid-column: 9 / -1;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-content: end;
		align-items: center;
	}
	.main {
		padding-block: 32px;
		row-gap: 40px;
	}
	.stage {
		grid-column: 1 / span 8;
		display: grid;
		gap: 20px;
		align-content: start;
		justify-items: start;
		min-width: 0;
	}
	.stage > :global(.line) {
		justify-self: stretch;
	}
	.msg {
		border-left: 8px solid var(--fault);
		padding: 10px 14px;
		background: var(--paper-2);
	}
	.rows {
		width: 100%;
		border-collapse: collapse;
	}
	caption {
		text-align: left;
		padding-bottom: 8px;
	}
	th {
		text-align: left;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		font-weight: 500;
		color: var(--ink-2);
		border-bottom: 1.5px solid var(--ink);
		padding: 6px;
	}
	td {
		padding: 6px;
		border-bottom: 1px solid var(--rule);
	}
	tr.bad td {
		background: color-mix(in srgb, var(--fault) 12%, transparent);
	}
	input.tok,
	input.num {
		width: 100%;
		border: 0;
		border-bottom: 1.5px solid var(--ink-3);
		background: transparent;
		padding: 4px 0;
		border-radius: 0;
	}
	input.tok {
		font-family: var(--display);
		font-size: 26px;
		white-space: pre;
		min-width: 6ch;
	}
	input.num {
		font-size: 15px;
		max-width: 9ch;
	}
	input:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	input[type='range'] {
		width: 100%;
		min-width: 120px;
		accent-color: var(--ink);
	}
	.x {
		padding: 0.3em 0.7em;
	}
	.rail {
		grid-column: 9 / -1;
		display: grid;
		gap: 18px;
		align-content: start;
		border-left: 1px solid var(--rule);
		padding-left: var(--gutter);
	}
	.ppl {
		font-size: clamp(80px, 9.5vw, 190px);
		font-variation-settings: 'wght' 1000, 'wdth' 70;
		letter-spacing: -0.04em;
		line-height: 0.9;
	}
	.sec {
		padding-block: 40px;
		display: grid;
		gap: 16px;
	}
	@media (max-width: 1023px) {
		.head,
		.presets,
		.stage,
		.rail {
			grid-column: 1 / -1;
		}
		.rail {
			border-left: 0;
			padding-left: 0;
			border-top: 1.5px solid var(--ink);
			padding-top: 16px;
		}
	}
	.scroll {
		width: 100%;
		overflow-x: auto;
	}
</style>
