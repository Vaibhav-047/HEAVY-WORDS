<script lang="ts">
	import { fmt } from '$lib/math/perplexity';
	import { visible } from './WeightedLine.svelte';

	let { tokens }: { tokens: { token: string; p: number; h: number }[] } = $props();
	const heaviest = $derived(tokens.reduce((b, t, i) => (t.h > tokens[b].h ? i : b), 0));
</script>

<div class="scroll">
	<table class="mono">
		<thead>
			<tr><th>#</th><th>Token</th><th>P</th><th>1/P</th><th>−ln P</th></tr>
		</thead>
		<tbody>
			{#each tokens as t, i (i)}
				<tr class:top={i === heaviest}>
					<td>{i + 1}</td>
					<td class="tk">{visible(t.token)}</td>
					<td>{fmt(t.p, 4)}</td>
					<td>{fmt(1 / t.p, 4)}</td>
					<td>{fmt(t.h, 4)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th {
		text-align: right;
		font-weight: 500;
		letter-spacing: 0.12em;
		color: var(--ink-2);
		font-size: 11px;
		border-bottom: 1.5px solid var(--ink);
		padding: 6px 8px;
	}
	td {
		text-align: right;
		padding: 6px 8px;
		border-bottom: 1px solid var(--rule);
		white-space: pre;
	}
	th:nth-child(2),
	td.tk {
		text-align: left;
	}
	tr.top td {
		background: color-mix(in srgb, var(--hi) 55%, transparent);
		color: var(--hi-ink);
	}
	tr.top td:first-child {
		box-shadow: inset 3px 0 0 var(--verm);
	}
</style>
