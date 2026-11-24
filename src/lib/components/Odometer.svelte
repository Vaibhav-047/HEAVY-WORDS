<script lang="ts">
	import { onMount } from 'svelte';
	import { fmt } from '$lib/math/perplexity';

	let { value, decimals = 2, label = 'Perplexity' }: { value: number; decimals?: number; label?: string } = $props();

	const str = $derived(value >= 1e6 || (value > 0 && value < 0.001) ? fmt(value) : value.toFixed(decimals));
	let mounted = $state(false);
	onMount(() => requestAnimationFrame(() => (mounted = true)));
	const chars = $derived(str.split(''));
</script>

<span class="odo tnum" aria-label="{label} {str}" role="img" style:font-size="{Math.min(1, 5 / chars.length)}em">
	{#each chars as c, i (chars.length - i)}
		{#if c >= '0' && c <= '9'}
			<span class="col" aria-hidden="true">
				<span class="strip" style:transform="translateY({mounted ? -Number(c) * 10 : 0}%)" style:transition-delay="{(chars.length - i) * 70}ms">
					{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as d (d)}<span>{d}</span>{/each}
				</span>
			</span>
		{:else}
			<span aria-hidden="true">{c}</span>
		{/if}
	{/each}
</span>

<style>
	.odo {
		display: inline-flex;
		line-height: 1;
		overflow: hidden;
		height: 1em;
	}
	.col {
		display: inline-block;
		height: 1em;
		overflow: hidden;
	}
	.strip {
		display: flex;
		flex-direction: column;
		transition: transform 1.4s cubic-bezier(0.2, 0.8, 0.1, 1);
	}
	.strip span {
		height: 1em;
		display: block;
	}
</style>
