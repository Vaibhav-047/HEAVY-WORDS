<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { ui } from '$lib/stores/ui.svelte';

	const lines = ['HEAVY', 'WORDS'];
	const letters = lines.flatMap((l, li) => l.split('').map((c, ci) => ({ c, li, ci })));
	const springs = letters.map(() => new Spring(0, { stiffness: 0.09, damping: 0.4 }));
	let els: HTMLSpanElement[] = [];
	let scroll = $state(0);

	$effect(() => {
		if (ui.reduced) return;
		const onMove = (e: PointerEvent) => {
			const R = Math.max(innerWidth * 0.22, 160);
			els.forEach((el, i) => {
				const r = el.getBoundingClientRect();
				const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
				springs[i].target = Math.exp(-((d / R) ** 2));
			});
		};
		const onLeave = () => springs.forEach((s) => (s.target = 0));
		const onScroll = () => (scroll = Math.min(1, scrollY / (innerHeight * 0.7)));
		addEventListener('pointermove', onMove, { passive: true });
		document.addEventListener('pointerleave', onLeave);
		addEventListener('scroll', onScroll, { passive: true });
		return () => {
			removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerleave', onLeave);
			removeEventListener('scroll', onScroll);
		};
	});

	function style(i: number) {
		const k = ui.reduced ? 0.6 : scroll * 0.75 + (1 - scroll * 0.75) * springs[i].current;
		return `"wght" ${(100 + 900 * k).toFixed(0)}, "wdth" ${(60 + 91 * k).toFixed(1)}`;
	}
</script>

<h1 class="hero" aria-label="Heavy words">
	{#each lines as l, li (li)}
		<span class="ln" aria-hidden="true">
			{#each letters as L, i (i)}
				{#if L.li === li}<span bind:this={els[i]} style:font-variation-settings={style(i)}>{L.c}</span>{/if}
			{/each}
		</span>
	{/each}
</h1>

<style>
	.hero {
		font-family: var(--display);
		font-size: clamp(88px, 22vw, 400px);
		line-height: 0.8;
		letter-spacing: -0.035em;
		margin: 0;
		display: grid;
		user-select: none;
	}
	.ln {
		display: flex;
		justify-content: space-between;
		white-space: nowrap;
	}
	.ln span {
		display: inline-block;
		will-change: font-variation-settings;
	}
</style>
