<script lang="ts">
	import { axes, fvs } from '$lib/type/axes';
	import { fmt } from '$lib/math/perplexity';
	import { MODEL_INFO } from '$lib/stores/engine.svelte';
	import { visible } from './WeightedLine.svelte';
	import type { ScoreResult } from '$lib/types';

	let { a, b }: { a: ScoreResult; b: ScoreResult } = $props();

	const ends = (r: ScoreResult) => {
		let pos = 0;
		return r.tokens.map((t) => (pos += t.token.length));
	};

	// Group tokens into columns that end at the same character offset in both tokenizations,
	// so tokens covering the same text line up vertically.
	const cols = $derived.by(() => {
		const ea = ends(a);
		const eb = ends(b);
		const out: { ia: number[]; ib: number[] }[] = [];
		let i = 0;
		let j = 0;
		while (i < ea.length || j < eb.length) {
			const ia: number[] = [];
			const ib: number[] = [];
			let pa = -1;
			let pb = -1;
			do {
				if ((pa <= pb && i < ea.length) || j >= eb.length) {
					ia.push(i);
					pa = ea[i++];
				} else {
					ib.push(j);
					pb = eb[j++];
				}
			} while (pa !== pb && (i < ea.length || j < eb.length));
			out.push({ ia, ib });
		}
		return out;
	});
	const rows = $derived([
		{ r: a, key: 'ia' as const },
		{ r: b, key: 'ib' as const }
	]);
</script>

<div class="cmp">
	<div class="legend">
		{#each rows as row (row.key)}
			<div>
				<span class="label">{row.r.model === 'fast' ? 'FAST' : 'ACCURATE'} — {MODEL_INFO[row.r.model].name}</span>
				<span class="mono">PPL {fmt(row.r.perplexity, 4)} · {row.r.tokens.length} tokens</span>
			</div>
		{/each}
	</div>
	<div class="cols" role="table" aria-label="Both models' token probabilities, aligned by text">
		<div class="col lab" role="rowgroup" aria-hidden="true">
			{#each rows as row (row.key)}<div class="cell label">{row.r.model === 'fast' ? 'FAST' : 'ACC.'}</div>{/each}
		</div>
		{#each cols as c, ci (ci)}
			<div class="col" role="rowgroup">
				{#each rows as row (row.key)}
					<div class="cell" role="row">
						{#each c[row.key] as k (k)}
							{@const t = row.r.tokens[k]}
							{@const ax = axes(t.h)}
							<span class="tok" role="cell" style:--mo={ax.mark} style:--mh={ax.markH * 0.9} data-cursor="token">
								<span class="w" style:font-variation-settings={fvs(ax.wght, ax.wdth)}>{visible(t.token)}</span>
								<span class="mono p">{fmt(t.p, 2)}</span>
							</span>
						{/each}
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<p class="note">
		Note: the two models split text into tokens differently (SmolLM2 and Qwen2.5 use different vocabularies), so a word can be one
		token for one model and two for the other. Columns group tokens that cover the same stretch of text.
	</p>
</div>

<style>
	.legend {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gutter);
		margin-bottom: 16px;
	}
	.legend div {
		display: grid;
		gap: 4px;
	}
	.cols {
		display: flex;
		flex-wrap: wrap;
		row-gap: 18px;
		font-size: clamp(22px, 2.6vw, 40px);
	}
	.col {
		display: grid;
		grid-template-rows: 1fr 1fr;
		border-left: 1px solid var(--rule);
		padding-inline: 0.08em;
	}
	.cell {
		display: flex;
		padding-block: 4px;
	}
	.lab {
		border-left: 0;
		padding-right: 10px;
	}
	.lab .cell {
		align-items: center;
		font-size: 11px;
	}
	.cell + .cell {
		border-top: 1px dashed var(--rule);
	}
	.tok {
		position: relative;
		display: inline-grid;
		white-space: pre;
		line-height: 1.1;
		padding-bottom: 2px;
		background: linear-gradient(
			to top,
			transparent 0.35em,
			rgb(from var(--hi) r g b / var(--mo)) 0.35em,
			rgb(from var(--hi) r g b / var(--mo)) calc(0.35em + var(--mh) * 0.9em),
			transparent calc(0.35em + var(--mh) * 0.9em)
		);
	}
	.p {
		font-size: 10px;
		color: var(--ink-2);
	}
	.note {
		margin-top: 18px;
		color: var(--ink-2);
		max-width: 70ch;
		font-size: 15px;
	}
</style>
