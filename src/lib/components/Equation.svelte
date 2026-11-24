<script lang="ts">
	import { fmt } from '$lib/math/perplexity';

	let { ps }: { ps: number[] } = $props();
	const N = $derived(ps.length);
	const hs = $derived(ps.map((p) => -Math.log(p)));
	const sumH = $derived(hs.reduce((a, b) => a + b, 0));
	const ppl = $derived(Math.exp(sumH / N));
	// The product of 1/P can be astronomically large: show it from log space.
	const product = $derived(Math.exp(sumH));
	const shown = $derived(ps.slice(0, 10));
</script>

<div class="eq" role="group" aria-label="Worked calculation of perplexity">
	<div class="step">
		<span class="label">Step 1 — multiply the 1/P values</span>
		<p class="math">
			{#each shown as p, i (i)}{#if i}<span class="op"> × </span>{/if}<span class="frac"><span>1</span><span>{fmt(p, 3)}</span></span>{/each}{#if N > 10}<span class="op"> × …</span>{/if}
			<span class="op"> = </span><span class="res tnum">{fmt(product, 4)}</span>
		</p>
	</div>
	<div class="step">
		<span class="label">Step 2 — count the tokens</span>
		<p class="math"><i>N</i><span class="op"> = </span><span class="res tnum">{N}</span></p>
	</div>
	<div class="step">
		<span class="label">Step 3 — take the N-th root</span>
		<p class="math">
			<span class="root"><sup>{N}</sup>√<span class="under tnum">{fmt(product, 4)}</span></span>
			<span class="op"> = </span><span class="res big tnum">{fmt(ppl, 4)}</span>
		</p>
	</div>
	<div class="step log">
		<span class="label">Same thing, in log space (how the code does it)</span>
		<p class="math">
			<i>e</i><sup class="exp">(−ln P₁ + … + −ln P<sub>{N}</sub>) / {N} = {fmt(sumH, 4)} / {N} = {fmt(sumH / N, 4)}</sup>
			<span class="op"> = </span><span class="res tnum">{fmt(ppl, 4)}</span>
		</p>
	</div>
</div>

<style>
	.eq {
		display: grid;
		gap: 28px;
	}
	.step {
		display: grid;
		gap: 10px;
		border-top: 1px solid var(--rule);
		padding-top: 14px;
	}
	.math {
		margin: 0;
		font-family: var(--display);
		font-size: clamp(22px, 2.4vw, 36px);
		font-variation-settings: 'wght' 300, 'wdth' 90;
		line-height: 1.6;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.1em;
	}
	i {
		font-style: italic;
	}
	.op {
		color: var(--ink-3);
		white-space: pre;
	}
	.frac {
		display: inline-grid;
		text-align: center;
		font-size: 0.62em;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}
	.frac span:first-child {
		border-bottom: 1.5px solid var(--ink);
		padding: 0 0.2em;
	}
	.res {
		font-variation-settings: 'wght' 800, 'wdth' 100;
	}
	.big {
		font-size: 1.5em;
		background: linear-gradient(transparent 55%, var(--hi) 55%, var(--hi) 90%, transparent 90%);
		color: var(--ink);
		padding: 0 0.1em;
	}
	:global([data-theme='dark']) .big {
		color: var(--hi-ink);
		background: var(--hi);
	}
	.root sup {
		font-size: 0.5em;
		margin-right: -0.25em;
		vertical-align: 0.9em;
	}
	.under {
		border-top: 1.5px solid var(--ink);
		padding: 0 0.15em;
	}
	.exp {
		font-size: 0.5em;
		vertical-align: 1.1em;
		font-family: var(--mono);
		font-variation-settings: normal;
	}
</style>
