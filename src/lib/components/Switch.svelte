<script lang="ts">
	let {
		label,
		off,
		on,
		checked,
		onchange,
		disabled = false
	}: { label: string; off: string; on: string; checked: boolean; onchange: (v: boolean) => void; disabled?: boolean } = $props();
</script>

<button type="button" role="switch" aria-checked={checked} aria-label={label} class="sw" {disabled} onclick={() => onchange(!checked)}>
	<span class:act={!checked}>{off}</span><span class:act={checked}>{on}</span>
</button>

<style>
	.sw {
		appearance: none;
		display: inline-flex;
		border: 1.5px solid var(--ink);
		background: transparent;
		padding: 2px;
		cursor: pointer;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		border-radius: 0;
		font-variation-settings: normal;
	}
	.sw:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	span {
		padding: 0.45em 0.7em;
		color: var(--ink-2);
		transition:
			background-color 0.2s,
			color 0.2s;
	}
	.act {
		background: var(--ink);
		color: var(--paper);
		font-weight: 700;
	}
</style>
