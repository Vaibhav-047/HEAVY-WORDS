<script lang="ts">
	import { base } from '$app/paths';
	import HeroTitle from '$lib/components/HeroTitle.svelte';
	import WeightedLine from '$lib/components/WeightedLine.svelte';
	import Ticker from '$lib/components/Ticker.svelte';
	import Story from '$lib/components/Story.svelte';
	import { HERO, STORY } from '$lib/samples';
	import { fmt } from '$lib/math/perplexity';
	import { settle } from '$lib/actions';

	const top = HERO.tokens.reduce((b, t) => (t.h > b.h ? t : b));
</script>

<svelte:head>
	<title>HEAVY WORDS — a Perplexity Explorer</title>
</svelte:head>

<section class="wrap hero-sec">
	<div class="meta grid">
		<span class="label c1">FIG. 00 — Perplexity explorer</span>
		<span class="label c2">Models run in your browser · no API · no key</span>
	</div>
	<HeroTitle />
	<div class="grid below">
		<p class="tagline" use:settle style:--fw="760">Some words weigh more than others.</p>
		<div class="sample">
			<span class="label">A sentence, already weighed — PPL {fmt(HERO.perplexity, 3)} · Qwen2.5-0.5B</span>
			<WeightedLine tokens={HERO.tokens} size="clamp(22px, 6.2cqi, 64px)" stagger={70} label="Sample sentence: {HERO.text}" />
			<p class="note">
				The heaviest word is <b class="mono">“{top.token.trim()}”</b> at P = {fmt(top.p, 2)}: the model least expected it.
			</p>
		</div>
		<a class="cta" href="{base}/read">Weigh a sentence <span aria-hidden="true">→</span></a>
	</div>
</section>

<Ticker />

<Story s={STORY} />

<Ticker reverse />

<section class="wrap grid outro">
	<h2 class="h2 c-l" use:settle style:--fw="900">Try your own words — or build a sentence by hand.</h2>
	<div class="c-r">
		<a class="link big" href="{base}/read">Read → the real model</a>
		<a class="link big" href="{base}/lab">Lab → simulated probabilities</a>
		<a class="link big" href="{base}/about">About → how it works</a>
	</div>
</section>

<style>
	.hero-sec {
		padding-block: 28px 56px;
	}
	.meta {
		margin-bottom: 18px;
	}
	.c1 {
		grid-column: 1 / span 6;
	}
	.c2 {
		grid-column: 7 / -1;
		text-align: right;
	}
	.below {
		margin-top: 40px;
		row-gap: 32px;
		align-items: end;
	}
	.tagline {
		grid-column: 1 / span 4;
		font-size: clamp(28px, 3vw, 46px);
		line-height: 1;
		margin: 0;
		align-self: start;
	}
	.sample {
		grid-column: 5 / -1;
		/* the sentence is sized from this column (cqi), so it wraps to ~2 lines instead of overflowing */
		container-type: inline-size;
		min-width: 0;
		display: grid;
		gap: 10px;
		border-top: 1.5px solid var(--ink);
		padding-top: 12px;
	}
	.note {
		margin: 0;
		color: var(--ink-2);
	}
	.note b {
		font-weight: 700;
		color: var(--ink);
	}
	.cta {
		grid-column: 5 / -1;
		justify-self: start;
		text-decoration: none;
		font-size: clamp(36px, 5vw, 84px);
		line-height: 1;
		padding: 0.25em 0.5em 0.3em;
		border: 2px solid var(--ink);
		background: var(--ink);
		color: var(--paper);
		font-variation-settings: 'wght' 350, 'wdth' 90;
		transition:
			font-variation-settings 0.45s var(--ease),
			background-color 0.25s,
			color 0.25s;
	}
	.cta:hover,
	.cta:focus-visible {
		font-variation-settings: 'wght' 1000, 'wdth' 140;
		background: var(--hi);
		color: var(--hi-ink);
		border-color: var(--hi-ink);
	}
	.outro {
		padding-block: 120px 40px;
		row-gap: 32px;
	}
	.c-l {
		grid-column: 1 / span 7;
	}
	.c-r {
		grid-column: 9 / -1;
		display: grid;
		gap: 12px;
		align-content: end;
	}
	.big {
		font-size: 24px;
		justify-self: start;
	}
	@media (max-width: 767px) {
		.c1,
		.c2,
		.tagline,
		.sample,
		.cta,
		.c-l,
		.c-r {
			grid-column: 1 / -1;
			text-align: left;
		}
	}
</style>
