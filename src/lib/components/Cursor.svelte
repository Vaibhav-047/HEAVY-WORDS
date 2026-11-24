<script lang="ts">
	import { ui } from '$lib/stores/ui.svelte';

	let el = $state<HTMLDivElement>();
	let mode = $state<'dot' | 'token' | 'button' | 'hidden'>('hidden');

	$effect(() => {
		if (!ui.finePointer || !el) return;
		document.documentElement.classList.add('custom-cursor');
		let x = -100,
			y = -100,
			raf = 0;
		const move = (e: PointerEvent) => {
			x = e.clientX;
			y = e.clientY;
			const t = e.target as Element | null;
			mode = t?.closest('input, textarea, select, [contenteditable]')
				? 'hidden'
				: t?.closest('[data-cursor="token"]')
					? 'token'
					: t?.closest('a, button, [role="switch"], label, input[type="range"]')
						? 'button'
						: 'dot';
			if (!raf) raf = requestAnimationFrame(() => {
				raf = 0;
				el!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
			});
		};
		const leave = () => (mode = 'hidden');
		addEventListener('pointermove', move, { passive: true });
		document.addEventListener('pointerleave', leave);
		return () => {
			document.documentElement.classList.remove('custom-cursor');
			removeEventListener('pointermove', move);
			document.removeEventListener('pointerleave', leave);
			cancelAnimationFrame(raf);
		};
	});
</script>

{#if ui.finePointer}
	<div class="cursor {mode}" bind:this={el} aria-hidden="true"><span></span></div>
{/if}

<style>
	:global(html.custom-cursor),
	:global(html.custom-cursor *) {
		cursor: none !important;
	}
	:global(html.custom-cursor input:not([type='range'])),
	:global(html.custom-cursor textarea) {
		cursor: text !important;
	}
	.cursor {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 1000;
		pointer-events: none;
	}
	span {
		display: block;
		width: 12px;
		height: 12px;
		margin: -6px 0 0 -6px;
		background: var(--ink);
		border-radius: 50%;
		transition:
			transform 0.25s var(--ease),
			opacity 0.2s,
			border-radius 0.25s,
			background-color 0.2s;
	}
	.token span {
		border-radius: 1px;
		background: var(--hi);
		outline: 1.5px solid var(--hi-ink);
		transform: scale(2.6, 0.9) skewX(-12deg);
	}
	.button span {
		transform: scale(3.4);
		opacity: 0.85;
	}
	.hidden span {
		opacity: 0;
	}
</style>
