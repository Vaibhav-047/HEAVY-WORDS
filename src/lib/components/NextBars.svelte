<script lang="ts">
	import { fvsFor } from '$lib/type/axes';
	import { visible } from './WeightedLine.svelte';
	import type { Cand } from '$lib/types';

	let { cands, actual }: { cands: Cand[]; actual?: string } = $props();
	const max = $derived(Math.max(...cands.map((c) => c.p), 1e-9));
</script>

<ol class="bars">
	{#each cands as c, i (i)}
		<li class:hit={actual !== undefined && c.token === actual}>
			<span class="word" style:font-variation-settings={fvsFor(-Math.log(c.p))}>{visible(c.token)}</span>
			<span class="bar" aria-hidden="true"><span style:transform="scaleX({c.p / max})"></span></span>
			<span class="mono pct">{(c.p * 100).toFixed(c.p < 0.01 ? 2 : 1)}%</span>
		</li>
	{/each}
</ol>

<style>
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	li {
		display: grid;
		grid-template-columns: minmax(5em, 12em) 1fr 5.5em;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--rule);
		padding-bottom: 6px;
	}
	.word {
		font-size: 24px;
		line-height: 1.1;
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.bar {
		height: 12px;
		background: var(--paper-2);
		display: block;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink);
		transform-origin: left;
		transition: transform 0.8s var(--ease);
	}
	.hit .bar span {
		background: var(--hi);
		outline: 1px solid var(--ink);
	}
	.hit .word::after {
		content: ' ←';
		font-family: var(--mono);
		font-size: 12px;
		font-variation-settings: normal;
	}
	.pct {
		font-size: 13px;
		text-align: right;
	}
</style>
