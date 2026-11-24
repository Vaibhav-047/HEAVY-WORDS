<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fmt } from '$lib/math/perplexity';
	import { ui } from '$lib/stores/ui.svelte';

	let { ppl, caption = true }: { ppl: number; caption?: boolean } = $props();

	const n = $derived(Math.max(1, Math.round(ppl)));
	const fine = $derived(n > 64);
	const R = 100;

	const rot = new Tween(0, { duration: 2800, easing: cubicOut });
	$effect(() => {
		// Spin a few turns and stop with slice 0 (the word that actually came next) under the pointer.
		const target = -180 / n;
		const reduced = ui.reduced;
		untrack(() => {
			const base = rot.target;
			const turns = reduced ? 0 : 3 + Math.floor(Math.random() * 2);
			const next = base - ((((base - target) % 360) + 360) % 360) + 360 * turns;
			rot.set(next, reduced ? { duration: 0 } : undefined);
		});
	});

	const pt = (deg: number, r = R) => {
		const a = ((deg - 90) * Math.PI) / 180;
		return `${(r * Math.cos(a)).toFixed(3)} ${(r * Math.sin(a)).toFixed(3)}`;
	};
	const slices = $derived(
		fine || n === 1
			? []
			: Array.from({ length: n }, (_, i) => {
					const a0 = (360 / n) * i;
					const a1 = (360 / n) * (i + 1);
					return `M0 0 L${pt(a0)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)} Z`;
				})
	);
	const ticks = $derived.by(() => {
		if (!fine) return '';
		const count = Math.min(n, 720);
		let d = '';
		for (let i = 0; i < count; i++) {
			const a = (360 / count) * i;
			d += `M${pt(a, R)} L${pt(a, i % 10 === 0 ? R - 16 : R - 9)} `;
		}
		return d;
	});
	const label = $derived(
		`Perplexity wheel: ${n} equal slice${n === 1 ? '' : 's'}. On average, the model was as unsure as spinning a ${n}-slice wheel.`
	);
</script>

<figure class="wheel">
	<svg viewBox="-112 -122 224 234" role="img" aria-label={label}>
		<g style:transform="rotate({rot.current}deg)">
			{#if fine}
				<circle r={R} fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.2" />
				<path d={ticks} stroke="var(--ink)" stroke-width="0.5" />
				<path d="M0 0 L{pt(0)} A{R} {R} 0 0 1 {pt(360 / n)} Z" fill="var(--hi)" />
			{:else if n === 1}
				<circle r={R} fill="var(--hi)" stroke="var(--ink)" stroke-width="1.2" />
			{:else}
				{#each slices as d, i (i)}
					<path {d} fill={i === 0 ? 'var(--hi)' : i % 2 ? 'var(--paper-2)' : 'var(--paper)'} stroke="var(--ink)" stroke-width="0.8" />
				{/each}
			{/if}
		</g>
		<circle r={fine ? 44 : 22} fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" />
		<text class="num" y={fine ? 9 : 6} text-anchor="middle" font-size={fine ? 26 : 17}>{fine ? fmt(ppl, 4) : n}</text>
		<path d="M-8 -118 L8 -118 L0 -100 Z" fill="var(--verm)" stroke="var(--ink)" stroke-width="1" />
	</svg>
	{#if caption}
		<figcaption>
			<span class="label">FIG. — The wheel you'd have to spin</span>
			<span class="cap">On average, the model was as unsure as spinning a <b>{n}-slice</b> wheel.</span>
		</figcaption>
	{/if}
</figure>

<style>
	.wheel {
		margin: 0;
	}
	svg {
		width: 100%;
		max-width: 340px;
		display: block;
		overflow: visible;
	}
	g {
		will-change: transform;
	}
	.num {
		font-family: var(--mono);
		font-weight: 700;
		fill: var(--ink);
	}
	figcaption {
		display: grid;
		gap: 6px;
		margin-top: 14px;
	}
	.cap {
		font-size: 17px;
		line-height: 1.3;
	}
	b {
		font-variation-settings: 'wght' 900, 'wdth' 110;
		font-weight: normal;
	}
</style>
