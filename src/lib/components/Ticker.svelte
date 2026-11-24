<script lang="ts">
	import { fvsFor } from '$lib/type/axes';
	import { fmt } from '$lib/math/perplexity';
	import { SAMPLES } from '$lib/samples';

	let { reverse = false }: { reverse?: boolean } = $props();
</script>

<div class="ticker rule-t rule-b" class:reverse aria-hidden="true">
	<div class="track">
		{#each [0, 1] as copy (copy)}
			<div class="set">
				{#each SAMPLES as s (s.text)}
					<span class="phrase">
						{#each s.tokens as t, i (i)}<span style:font-variation-settings={fvsFor(t.h)}>{t.token}</span>{/each}
						<span class="mono ppl">PPL {fmt(s.perplexity, 3)}</span>
					</span>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.ticker {
		overflow: hidden;
		padding-block: 14px;
		background: var(--paper);
		contain: paint;
	}
	.track {
		display: flex;
		width: max-content;
		animation: marquee 80s linear infinite;
	}
	.reverse .track {
		animation-direction: reverse;
	}
	.set {
		display: flex;
	}
	.phrase {
		font-size: clamp(28px, 3.4vw, 52px);
		white-space: pre;
		padding-right: 1.2em;
		line-height: 1.1;
	}
	.phrase::after {
		content: '✶';
		font-variation-settings: normal;
		margin-left: 1.2em;
		color: var(--ink-3);
	}
	.ppl {
		font-size: 12px;
		letter-spacing: 0.1em;
		vertical-align: super;
		margin-left: 0.6em;
		color: var(--ink-2);
	}
	@keyframes marquee {
		to {
			transform: translateX(-50%);
		}
	}
</style>
