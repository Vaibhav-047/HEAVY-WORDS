<script lang="ts">
	import { ui } from '$lib/stores/ui.svelte';
	import { settle } from '$lib/actions';
	import StoryFrame from './StoryFrame.svelte';
	import type { Sample } from '$lib/samples';

	let { s }: { s: Sample } = $props();

	const STEPS = [
		['Split', 'The sentence is cut into tokens — the pieces the model actually reads. Often whole words, sometimes fragments.'],
		['Guess', 'Before each token, the model guesses what comes next. The small number is the probability it gave to the token that really came.'],
		['Weigh', 'Low probability means high surprise. Surprise becomes weight: the less expected the token, the heavier and wider it is set.'],
		['Collapse', 'Average the surprise and turn it back into a count: perplexity. It is the number of equal slices on the wheel you would have to spin.']
	];

	const clamp = (x: number) => Math.max(0, Math.min(1, x));
	let prog = $state(0);
	let sec = $state<HTMLElement>();
	let pin = $state<HTMLElement>();
	const pinned = $derived(!ui.reduced && !ui.phone);
	const step = $derived(Math.min(3, Math.floor(prog * 4.0001)));

	$effect(() => {
		if (!pinned || !sec || !pin) return;
		let kill = () => {};
		let dead = false;
		Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
			if (dead) return;
			gsap.registerPlugin(ScrollTrigger);
			const st = ScrollTrigger.create({
				trigger: sec,
				start: 'top top',
				end: '+=320%',
				pin,
				scrub: true,
				onUpdate: (self) => (prog = self.progress)
			});
			kill = () => st.kill();
		});
		return () => {
			dead = true;
			kill();
		};
	});
	const frames = [
		[1, 0, 0, 0],
		[1, 1, 0, 0],
		[1, 1, 1, 0],
		[1, 1, 1, 1]
	];
</script>

<section class="story" bind:this={sec} aria-labelledby="story-h">
	<div class="wrap" class:pin-box={pinned} bind:this={pin}>
		<header class="head">
			<span class="label">FIG. 01 — Story</span>
			<h2 id="story-h" class="h2" use:settle style:--fw="850">How a sentence is weighed</h2>
		</header>

		{#if pinned}
			<StoryFrame {s} t1={clamp(prog * 6)} t2={clamp((prog - 0.22) * 5)} t3={clamp((prog - 0.45) * 4.5)} t4={clamp((prog - 0.74) * 5)} />
			<ol class="caps">
				{#each STEPS as [title, body], i (i)}
					<li class:on={i === step}>
						<span class="n mono">0{i + 1}</span>
						<b>{title}</b>
						<span>{body}</span>
					</li>
				{/each}
			</ol>
		{:else}
			{#each STEPS as [title, body], i (i)}
				<div class="static rule-t">
					<p class="cap"><span class="n mono">0{i + 1}</span> <b>{title}.</b> {body}</p>
					<StoryFrame {s} t1={frames[i][0]} t2={frames[i][1]} t3={frames[i][2]} t4={frames[i][3]} />
				</div>
			{/each}
		{/if}
	</div>
</section>

<style>
	.story {
		position: relative;
	}
	.pin-box {
		height: 100vh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		padding-block: 32px;
	}
	.head {
		display: grid;
		gap: 10px;
		padding-top: 48px;
	}
	.caps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--gutter);
		border-top: 1.5px solid var(--ink);
	}
	.caps li {
		display: grid;
		gap: 6px;
		align-content: start;
		padding-top: 12px;
		color: var(--ink-3);
		transition: color 0.3s;
		font-size: 15px;
		line-height: 1.4;
	}
	.caps li.on {
		color: var(--ink);
	}
	.caps b,
	.cap b {
		font-weight: normal;
		font-variation-settings: 'wght' 850, 'wdth' 110;
		font-size: 22px;
	}
	.n {
		font-size: 12px;
		letter-spacing: 0.1em;
	}
	.on .n {
		background: var(--hi);
		color: var(--hi-ink);
		justify-self: start;
		padding: 0 4px;
	}
	.static {
		padding-block: 28px;
		margin-top: 24px;
	}
	.static :global(.frame) {
		min-height: 0;
		padding-block: 28px 8px;
	}
	.cap {
		max-width: 60ch;
		font-size: 17px;
	}
</style>
