<script lang="ts">
	import { axes, fvs } from '$lib/type/axes';
	import { fmt } from '$lib/math/perplexity';
	import Wheel from './Wheel.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import type { Sample } from '$lib/samples';

	// t1..t4: progress of each step, 0–1.
	let { s, t1, t2, t3, t4 }: { s: Sample; t1: number; t2: number; t3: number; t4: number } = $props();
	const heaviest = $derived(s.tokens.reduce((b, t, i) => (t.h > s.tokens[b].h ? i : b), 0));
</script>

<div class="frame">
	<div class="toks" style:opacity={1 - t4 * 0.85} style:transform="translateY({-t4 * 30}px) scale({1 - t4 * 0.2})">
		{#each s.tokens as t, i (i)}
			{@const a = axes(t.h)}
			<span class="tok" class:top={i === heaviest} class:odd={i % 2 === 1} class:solid={ui.theme === 'dark' && a.s >= 0.45 && t3 > 0.6} style:margin-right="{t1 * 0.14}em" style:--b={t1}><span class="p mono" style:opacity={t2} style:transform="translateY({(1 - t2) * 8}px)">{fmt(t.p, 2)}</span><span class="mark" style:opacity={a.mark * (i === heaviest ? 1.15 : 1)} style:transform="skewX(-10deg) scaleY({ui.theme === 'dark' && a.s >= 0.45 ? 1 : a.markH}) scaleX({t3})"></span><span class="w" style:font-variation-settings={fvs(100 + (a.wght - 100) * t3, 60 + (a.wdth - 60) * t3)}>{t.token}</span></span>
		{/each}
	</div>
	{#if t4 > 0.02}
		<div class="collapse" style:opacity={t4} style:transform="translateY({(1 - t4) * 40}px)">
			<div class="big tnum">{fmt(s.perplexity, 3)}</div>
			<div class="wheel"><Wheel ppl={s.perplexity} caption={false} /></div>
			<p class="label">Perplexity — one number for the whole sentence. A {Math.round(s.perplexity)}-slice wheel.</p>
		</div>
	{/if}
</div>

<style>
	.frame {
		position: relative;
		min-height: 50vh;
		display: grid;
		align-content: center;
	}
	.toks {
		font-size: clamp(32px, 5.6vw, 96px);
		line-height: 1.6;
		transform-origin: left center;
	}
	.tok {
		position: relative;
		display: inline-block;
		white-space: pre;
		isolation: isolate;
		border-left: 1px solid rgb(from var(--ink) r g b / calc(var(--b) * 0.4));
		padding-left: 0.05em;
	}
	.w {
		position: relative;
		z-index: 1;
	}
	.mark {
		position: absolute;
		z-index: 0;
		inset: auto -0.04em 0.18em;
		height: 0.9em;
		background: var(--hi);
		transform-origin: left bottom;
	}
	.odd .p {
		top: -1.25em;
	}
	.solid .w {
		color: var(--hi-ink);
	}
	.top .mark {
		background: var(--hi);
		box-shadow: 0 -3px 0 var(--verm);
	}
	.p {
		position: absolute;
		left: 0.15em;
		top: -0.55em;
		font-size: max(11px, 0.17em);
		color: var(--ink-2);
		line-height: 1;
	}
	.collapse {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 24px;
		background: var(--paper);
	}
	.big {
		font-size: clamp(120px, 22vw, 340px);
		line-height: 0.8;
		letter-spacing: -0.04em;
		font-variation-settings: 'wght' 1000, 'wdth' 120;
	}
	.wheel {
		width: clamp(160px, 22vw, 320px);
	}
	.label {
		grid-column: 1 / -1;
	}
	@media (max-width: 767px) {
		.collapse {
			position: static;
			grid-template-columns: 1fr;
		}
	}
</style>
