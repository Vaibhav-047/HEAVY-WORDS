<script lang="ts">
	import { engine, MODEL_INFO } from '$lib/stores/engine.svelte';

	const pr = $derived(engine.progress);
	const mb = (b: number) => (b / 1048576).toFixed(1);
	const model = $derived(engine.loadingModel ?? engine.choice);
	const wght = $derived(100 + 900 * pr.frac);
</script>

<section class="dl" aria-live="polite" aria-busy="true">
	<div class="rule" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(pr.frac * 100)} aria-label="Model download">
		<span style:transform="scaleX({pr.frac})"></span>
	</div>
	<p class="head" style:font-variation-settings={`"wght" ${wght.toFixed(0)}, "wdth" ${(60 + 91 * pr.frac).toFixed(0)}`}>
		Loading the model… {Math.round(pr.frac * 100)}%
	</p>
	<p class="mono read">
		{mb(pr.loaded)} / {pr.total ? mb(pr.total) : '…'} MB · {pr.current || 'preparing'} · {MODEL_INFO[model].name} · {engine.backend?.toUpperCase() ?? 'DETECTING'}
	</p>
	<p class="label">First run only — the browser caches the files after this.</p>
</section>

<style>
	.dl {
		display: grid;
		gap: 12px;
		padding-block: 24px;
	}
	.rule {
		height: 3px;
		background: var(--rule);
		width: calc(100% + 2 * var(--margin));
		margin-inline: calc(-1 * var(--margin));
	}
	.rule span {
		display: block;
		height: 100%;
		background: var(--ink);
		transform-origin: left;
		transition: transform 0.3s linear;
	}
	.head {
		margin: 0;
		font-size: clamp(36px, 6vw, 96px);
		line-height: 0.95;
		transition: font-variation-settings 0.4s var(--ease);
	}
	.read {
		margin: 0;
		font-size: 13px;
		overflow-wrap: anywhere;
	}
</style>
