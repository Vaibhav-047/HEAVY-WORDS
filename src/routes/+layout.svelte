<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Cursor from '$lib/components/Cursor.svelte';
	import PageWipe from '$lib/components/PageWipe.svelte';
	import Switch from '$lib/components/Switch.svelte';

	let { children } = $props();

	const links = [
		{ href: '/read', label: 'Read' },
		{ href: '/lab', label: 'Lab' },
		{ href: '/about', label: 'About' }
	];
	const here = (href: string) => page.url.pathname.replace(/\/$/, '') === base + href;

	onMount(() => {
		const vis = () => document.documentElement.classList.toggle('tab-hidden', document.hidden);
		document.addEventListener('visibilitychange', vis);
		return () => document.removeEventListener('visibilitychange', vis);
	});

	// Smooth scroll, wired into GSAP's ticker so ScrollTrigger scenes stay in sync.
	$effect(() => {
		if (ui.reduced) return;
		let stop = () => {};
		let dead = false;
		Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
			if (dead) return;
			gsap.registerPlugin(ScrollTrigger);
			const lenis = new Lenis({ lerp: 0.12 });
			lenis.on('scroll', ScrollTrigger.update);
			const raf = (t: number) => lenis.raf(t * 1000);
			gsap.ticker.add(raf);
			gsap.ticker.lagSmoothing(0);
			stop = () => {
				gsap.ticker.remove(raf);
				lenis.destroy();
			};
		});
		return () => {
			dead = true;
			stop();
		};
	});
</script>

<svelte:head>
	<title>HEAVY WORDS — a Perplexity Explorer</title>
</svelte:head>

<a class="skip mono" href="#main">Skip to content</a>
<div class="paper" aria-hidden="true"></div>
<div class="hairlines wrap grid" aria-hidden="true">
	{#each Array(12) as _, i (i)}<span style:--i={i}></span>{/each}
</div>

<header class="top wrap">
	<a class="brand link" href="{base}/" aria-current={here('') ? 'page' : undefined}>HEAVY&nbsp;WORDS</a>
	<span class="label tag">A perplexity explorer</span>
	<nav aria-label="Main">
		{#each links as l (l.href)}
			<a class="link" href="{base}{l.href}" aria-current={here(l.href) ? 'page' : undefined}>{l.label}</a>
		{/each}
	</nav>
	<Switch label="Dark mode" off="Light" on="Dark" checked={ui.theme === 'dark'} onchange={(v) => ui.setTheme(v ? 'dark' : 'light')} />
</header>

<main id="main">
	{@render children()}
</main>

<footer class="wrap foot rule-t">
	<span class="label">HEAVY WORDS — Some words weigh more than others.</span>
	<span class="label">Runs on your device · no text leaves your browser</span>
</footer>

<PageWipe />
<Cursor />

<style>
	.skip {
		position: absolute;
		left: 8px;
		top: -40px;
		z-index: 2000;
		background: var(--ink);
		color: var(--paper);
		padding: 8px 12px;
	}
	.skip:focus {
		top: 8px;
	}
	.paper {
		position: fixed;
		inset: 0;
		z-index: 800;
		pointer-events: none;
		opacity: 0.03;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	:global([data-theme='dark']) .paper {
		opacity: 0.05;
	}
	.hairlines {
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
	.hairlines span {
		border-left: 1px solid var(--rule);
		opacity: 0.55;
		transform-origin: top;
		animation: draw 1.4s var(--ease) both;
		animation-delay: calc(var(--i) * 60ms);
	}
	.hairlines span:last-child {
		border-right: 1px solid var(--rule);
	}
	@keyframes draw {
		from {
			transform: scaleY(0);
		}
	}
	@media (max-width: 767px) {
		.hairlines span:nth-child(n + 5) {
			display: none;
		}
		.hairlines span:nth-child(4) {
			border-right: 1px solid var(--rule);
		}
	}
	.top {
		display: flex;
		align-items: center;
		gap: 16px 28px;
		padding-block: 18px;
		border-bottom: 1px solid var(--rule);
		flex-wrap: wrap;
		position: relative;
		z-index: 10;
	}
	.brand {
		font-size: 20px;
		--lw: 900;
		letter-spacing: -0.01em;
	}
	.tag {
		margin-right: auto;
	}
	nav {
		display: flex;
		gap: 24px;
		font-size: 18px;
	}
	main {
		min-height: 70vh;
	}
	.foot {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding-block: 28px 40px;
		margin-top: 96px;
	}
	@media (max-width: 767px) {
		.tag {
			display: none;
		}
		.brand {
			margin-right: auto;
		}
	}
</style>
