<script lang="ts">
	import { fmt } from '$lib/math/perplexity';
	import { fvsFor } from '$lib/type/axes';
	import { ui } from '$lib/stores/ui.svelte';
	import NextBars from './NextBars.svelte';
	import { visible } from './WeightedLine.svelte';
	import type { TokenScore } from '$lib/types';

	let { tok, index, onclose }: { tok: TokenScore | null; index: number; onclose: () => void } = $props();

	let dialog: HTMLDialogElement;
	let spun = $state(false);

	// Reel rows: the top-8, plus the real token if the model didn't rank it there.
	const rows = $derived.by(() => {
		if (!tok) return [];
		const list = [...tok.top8];
		if (!list.some((c) => c.token === tok.token)) list.push({ token: tok.token, p: tok.p });
		return list;
	});
	const realIdx = $derived(rows.findIndex((c) => tok && c.token === tok.token));
	const LAPS = 3;
	const reel = $derived(Array.from({ length: LAPS }, () => rows).flat());
	const stop = $derived((LAPS - 1) * rows.length + realIdx);
	const rank = $derived(tok ? tok.top8.findIndex((c) => c.token === tok.token) : -1);

	$effect(() => {
		if (tok) {
			if (!dialog.open) dialog.showModal();
			spun = false;
			if (ui.reduced) spun = true;
			else requestAnimationFrame(() => requestAnimationFrame(() => (spun = true)));
		} else if (dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} class="drawer" onclose={onclose} aria-labelledby="drawer-title">
	{#if tok}
		<header>
			<span class="label">FIG. 03 — Position {index + 1} · the slot reel</span>
			<button class="btn" type="button" onclick={() => dialog.close()}>Close ✕</button>
		</header>
		<h2 id="drawer-title" class="sr-only">Candidates for token {index + 1}: {tok.token}</h2>

		<div class="reel" aria-hidden="true">
			<div class="strip" class:spun style:--stop={stop}>
				{#each reel as c, i (i)}
					<div class="row" class:real={i === stop} style:font-variation-settings={fvsFor(-Math.log(c.p))}>
						{visible(c.token)}
					</div>
				{/each}
			</div>
			<div class="window"></div>
		</div>

		<p class="verdict">
			The reel stops on <b>{visible(tok.token)}</b> — the model gave it
			<span class="mono">P = {fmt(tok.p, 3)}</span>{#if rank >= 0}, its #{rank + 1} guess{:else}, outside its top 8{/if}.
		</p>
		<dl class="mono stats">
			<div><dt>P</dt><dd>{fmt(tok.p, 4)}</dd></div>
			<div><dt>1/P</dt><dd>{fmt(1 / tok.p, 4)}</dd></div>
			<div><dt>−ln P</dt><dd>{fmt(tok.h, 4)}</dd></div>
		</dl>
		<span class="label">Top 8 candidates, each in its would-be weight</span>
		<NextBars cands={rows} actual={tok.token} />
	{/if}
</dialog>

<style>
	.drawer {
		margin: 0 0 0 auto;
		height: 100dvh;
		max-height: none;
		width: min(560px, 100vw);
		border: 0;
		border-left: 1.5px solid var(--ink);
		background: var(--paper);
		color: var(--ink);
		padding: 24px clamp(16px, 3vw, 36px);
		overflow-y: auto;
	}
	.drawer[open] {
		animation: slide 0.45s var(--ease);
	}
	.drawer::backdrop {
		background: rgb(13 13 13 / 0.45);
	}
	@keyframes slide {
		from {
			transform: translateX(100%);
		}
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
	}
	.reel {
		--rh: 84px;
		position: relative;
		height: calc(var(--rh) * 3);
		overflow: hidden;
		border-block: 1.5px solid var(--ink);
		mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent);
	}
	.strip {
		transform: translateY(var(--rh));
	}
	.strip.spun {
		transform: translateY(calc(var(--rh) * (1 - var(--stop))));
		transition: transform 2.2s cubic-bezier(0.15, 0.6, 0.1, 1);
	}
	.row {
		height: var(--rh);
		display: flex;
		align-items: center;
		font-size: 52px;
		white-space: pre;
		overflow: hidden;
	}
	.window {
		position: absolute;
		inset: var(--rh) 0 auto;
		height: var(--rh);
		border-block: 1px dashed var(--ink-3);
		pointer-events: none;
	}
	.real {
		text-decoration: underline 3px var(--verm);
		text-underline-offset: 8px;
	}
	.verdict {
		font-size: 20px;
		margin: 20px 0;
	}
	b {
		font-weight: normal;
		font-variation-settings: 'wght' 900, 'wdth' 110;
		background: var(--hi);
		color: var(--hi-ink);
		padding: 0 0.15em;
		white-space: pre;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin: 0 0 24px;
		border-top: 1px solid var(--rule);
	}
	.stats div {
		padding: 10px 0;
	}
	dt {
		font-size: 11px;
		color: var(--ink-2);
		letter-spacing: 0.12em;
	}
	dd {
		margin: 0;
		font-size: 22px;
	}
</style>
