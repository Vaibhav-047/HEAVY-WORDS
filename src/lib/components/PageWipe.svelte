<script lang="ts">
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { ui } from '$lib/stores/ui.svelte';

	const TITLES: Record<string, string> = { '': 'HEAVY WORDS', read: 'READ', lab: 'LAB', about: 'ABOUT' };
	let phase = $state<'idle' | 'in' | 'out'>('idle');
	let title = $state('');

	onNavigate((nav) => {
		if (ui.reduced || !nav.to || nav.to.url.pathname === nav.from?.url.pathname) return;
		const seg = nav.to.url.pathname.replace(/\/$/, '').split('/').pop() ?? '';
		title = TITLES[seg] ?? seg.toUpperCase();
		phase = 'in';
		return new Promise((r) => setTimeout(r, 520));
	});
	afterNavigate(() => {
		if (phase !== 'in') return;
		setTimeout(() => (phase = 'out'), 160);
		setTimeout(() => (phase = 'idle'), 900);
	});
</script>

<div class="wipe {phase}" aria-hidden="true">
	<span>{title}</span>
</div>

<style>
	.wipe {
		position: fixed;
		inset: 0;
		z-index: 900;
		background: #0d0d0d;
		color: #f2f0e9;
		display: flex;
		align-items: flex-end;
		padding: var(--margin);
		pointer-events: none;
		transform: translateX(-101%);
		visibility: hidden;
	}
	.wipe.in {
		visibility: visible;
		transform: translateX(0);
		transition: transform 0.5s cubic-bezier(0.7, 0, 0.2, 1);
	}
	.wipe.out {
		visibility: visible;
		transform: translateX(101%);
		transition: transform 0.7s cubic-bezier(0.7, 0, 0.2, 1);
	}
	span {
		font-family: var(--display);
		font-size: clamp(64px, 17vw, 300px);
		line-height: 0.82;
		letter-spacing: -0.03em;
		font-variation-settings: 'wght' 1000, 'wdth' 140;
	}
	span::after {
		content: '';
		display: block;
		height: 0.12em;
		background: #e4ff3a;
		margin-top: 0.08em;
		width: 30%;
	}
</style>
