<script lang="ts" module>
	export interface Tok {
		token: string;
		p: number;
		h: number;
	}
	/** Show whitespace the way the token view needs it. */
	export const visible = (t: string) => t.replace(/ /g, '␣').replace(/\n/g, '↵');
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { axes, fvs, THIN } from '$lib/type/axes';
	import { fmt } from '$lib/math/perplexity';
	import { ui } from '$lib/stores/ui.svelte';

	let {
		tokens,
		mode = 'text',
		showP = true,
		size = 'clamp(34px, 5.4vw, 92px)',
		interactive = false,
		stagger = 45,
		selected = -1,
		onpick,
		onhover,
		label = 'Weighted sentence'
	}: {
		tokens: Tok[];
		mode?: 'text' | 'tokens';
		showP?: boolean;
		size?: string;
		interactive?: boolean;
		stagger?: number;
		selected?: number;
		onpick?: (i: number) => void;
		onhover?: (i: number) => void;
		label?: string;
	} = $props();

	// Tokens that continue a word (no leading whitespace) stay glued to it, so lines only break between words.
	const words = $derived.by(() => {
		const out: number[][] = [];
		tokens.forEach((t, i) => {
			if (i === 0 || /^\s/.test(t.token) || /\s$/.test(tokens[i - 1].token)) out.push([i]);
			else out[out.length - 1].push(i);
		});
		return out;
	});
	const heaviest = $derived(tokens.reduce((b, t, i) => (t.h > tokens[b].h ? i : b), 0));
	const lightest = $derived(tokens.reduce((b, t, i) => (t.h < tokens[b].h ? i : b), 0));

	// Each new result starts thin and "puts on weight" in reading order.
	let settled = $state(false);
	$effect(() => {
		void tokens;
		if (ui.reduced) {
			settled = true;
			return;
		}
		settled = false;
		let raf = 0;
		tick().then(() => (raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => (settled = true))))));
		return () => cancelAnimationFrame(raf);
	});

	// Compact P for the tiny label under each token; exact values live in the inspector and table.
	const short = (p: number) => (p < 0.001 ? p.toExponential(0).replace('e-', 'e−') : fmt(p, 2));

	function srLabel(t: Tok, i: number) {
		let s = `'${t.token.trim() || (t.token.includes('\n') ? 'newline' : 'space')}', probability ${fmt(t.p, 2)}`;
		if (tokens.length > 1 && i === heaviest) s += ', most surprising';
		else if (tokens.length > 1 && i === lightest) s += ', least surprising';
		return s;
	}
	// Rough-edged highlighter: a fixed jagged polygon per token, varied by index.
	function rough(i: number) {
		const j = (k: number) => (((i * 7919 + k * 104729) % 97) / 97) * 6;
		return `polygon(0% ${j(1)}%, 25% ${j(2)}%, 50% ${j(3) * 0.6}%, 75% ${j(4)}%, 100% ${j(5)}%, ${100 - j(6) * 0.4}% 50%, 100% ${100 - j(7)}%, 70% ${100 - j(8) * 0.7}%, 40% ${100 - j(9)}%, 0% ${100 - j(10)}%, ${j(11) * 0.4}% 50%)`;
	}
</script>

<div
	class="line"
	class:settled
	class:tokens={mode === 'tokens'}
	class:interactive
	class:np={!showP}
	style:--size={size}
	role="group"
	aria-label={label}
>
	{#each words as w, wi (wi)}<span class="word">{#each w as i (i)}{@const t = tokens[i]}
		{@const a = axes(t.h)}
		{@const text = mode === 'tokens' ? visible(t.token) : t.token}
		<svelte:element
			this={interactive ? 'button' : 'span'}
			type={interactive ? 'button' : undefined}
			class="tok"
			class:top={i === heaviest && tokens.length > 1}
			class:sel={i === selected}
			class:odd={i % 2 === 1}
			class:solid={ui.theme === 'dark' && a.s >= 0.45}
			data-cursor="token"
			style:--fvs={fvs(a.wght, a.wdth)}
			style:--thin={THIN}
			style:--d="{i * stagger}ms"
			style:--mo={a.mark}
			style:--mh={a.markH}
			style:--clip={rough(i)}
			onclick={interactive ? () => onpick?.(i) : undefined}
			onmouseenter={onhover ? () => onhover(i) : undefined}
			onfocus={onhover ? () => onhover(i) : undefined}
			role={interactive ? undefined : 'text'}
		>
			<!-- no whitespace between children: the line is white-space: pre-wrap --><span class="mark" aria-hidden="true"></span><span class="w" aria-hidden="true">{text}</span>{#if showP}<span class="p mono" aria-hidden="true">{short(t.p)}</span>{/if}<span class="sr-only">{srLabel(t, i)}</span></svelte:element
		>
	{/each}</span>{/each}
</div>

<style>
	.line {
		font-family: var(--display);
		font-size: var(--size);
		line-height: 1.32;
		letter-spacing: -0.01em;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.word {
		white-space: nowrap;
	}
	.tok {
		all: unset;
		position: relative;
		display: inline-block;
		white-space: pre;
		padding-bottom: calc(0.1em + 24px);
		margin-bottom: 0.05em;
		isolation: isolate;
		vertical-align: top;
		cursor: default;
	}
	.interactive .tok {
		cursor: pointer;
	}
	.w {
		position: relative;
		z-index: 1;
		display: inline-block;
		font-variation-settings: var(--thin);
		transition: font-variation-settings 0.9s var(--ease) var(--d);
	}
	.settled .w {
		font-variation-settings: var(--fvs);
	}
	.mark {
		position: absolute;
		z-index: 0;
		left: -0.04em;
		right: -0.04em;
		bottom: calc(0.18em + 24px);
		height: 0.9em;
		background: var(--hi);
		opacity: var(--mo);
		clip-path: var(--clip);
		transform-origin: left bottom;
		transform: skewX(-10deg) scaleY(var(--mh)) scaleX(0);
		transition: transform 0.55s var(--ease) calc(var(--d) + 0.35s);
	}
	.settled .mark {
		transform: skewX(-10deg) scaleY(var(--mh)) scaleX(1);
	}
	.top .mark {
		opacity: 0.9;
	}
	.top .w {
		color: var(--ink);
	}
	/* The single most surprising token also gets the vermilion signal. */
	.top::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: -0.06em;
		height: 3px;
		background: var(--verm);
		transform-origin: left;
		transform: scaleX(0);
		transition: transform 0.5s var(--ease) calc(var(--d) + 0.6s);
	}
	.settled .top::before {
		transform: scaleX(1);
	}
	/* two staggered rows of P labels so narrow neighbours never collide */
	.p {
		position: absolute;
		left: 0;
		bottom: 12px;
		font-size: max(10px, 0.15em);
		line-height: 1;
		letter-spacing: 0.02em;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.np .tok {
		padding-bottom: 0.1em;
	}
	.np .mark {
		bottom: 0.18em;
	}
	.odd .p {
		bottom: 0;
	}
	.top .p {
		color: var(--ink);
		font-weight: 700;
	}
	.tokens .tok {
		border-left: 1px solid var(--rule);
		padding-inline: 0.06em;
		margin-right: 0.04em;
	}
	.tokens .tok:last-child {
		border-right: 1px solid var(--rule);
	}
	.tokens .p {
		left: 0.15em;
	}
	.tok:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.sel {
		outline: 2px dashed var(--ink);
		outline-offset: 2px;
	}
	/* Dark mode contrast: quiet marks stay faint under light text; heavy ones become a solid
	   full-height block with dark text on top. */
	:global([data-theme='dark']) .mark {
		opacity: calc(var(--mo) * 0.85);
	}
	.solid .mark {
		opacity: 0.92;
		bottom: calc(0.08em + 24px);
		height: 1.05em;
		transform: skewX(-10deg) scaleY(1) scaleX(0);
	}
	.settled.line .solid .mark {
		transform: skewX(-10deg) scaleY(1) scaleX(1);
	}
	.settled .solid .w {
		color: var(--hi-ink);
	}
	.solid .w {
		transition:
			font-variation-settings 0.9s var(--ease) var(--d),
			color 0.3s calc(var(--d) + 0.35s);
	}
</style>
