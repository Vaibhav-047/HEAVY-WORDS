<script lang="ts">
	import { base } from '$app/paths';
	import { settle } from '$lib/actions';
	import { MODEL_INFO } from '$lib/stores/engine.svelte';
</script>

<svelte:head>
	<title>About — HEAVY WORDS</title>
</svelte:head>

<article class="wrap grid essay">
	<header class="head">
		<span class="label">FIG. 08 — About</span>
		<h1 class="h2" use:settle style:--fw="900">How the words get their weight</h1>
	</header>

	<div class="body">
		<p class="first">
			A language model reads a sentence one token at a time. Before each token it makes a guess, a probability for every token in its
			vocabulary of tens of thousands. Then it sees the token that actually came next. That probability, <i>P</i>, is all this site needs.
		</p>
		<p>
			A token the model saw coming gets a high <i>P</i>, close to 1. A token it did not expect gets a tiny one. We turn that into
			<b>surprisal</b>, <span class="mono">−ln P</span>: zero for a certain token, and larger the less likely it was. Surprisal is what
			you see. It sets the weight and width of the type, and the opacity and height of the highlighter behind it.
		</p>

		<blockquote use:settle style:--fw="1000" style:--fwd="120">Expected words are light. Surprising words are heavy.</blockquote>

		<p>
			Averaging surprisal over a whole sentence and turning it back with <span class="mono">e<sup>x</sup></span> gives
			<b>perplexity</b>. Perplexity has a plain meaning: it is the number of equally likely options the model was choosing between, on
			average. A perplexity of 8 means the model was, on average, as unsure as someone spinning an 8-slice wheel. A perplexity of 1 means
			it was never unsure at all.
		</p>
		<p>
			We compute it in log space, as <span class="mono">exp(mean(−ln P))</span>, rather than multiplying all the 1/P values and taking a
			root. The two are equal, but the product overflows for long sentences and the logs never do.
		</p>

		<blockquote use:settle style:--fw="1000" style:--fwd="120">Perplexity is the wheel you'd have to spin.</blockquote>

		<p>
			One technical detail matters. The first word has nothing before it, so the model needs something to condition on. We put the
			model's start token in front of the sentence: its <span class="mono">bos_token</span> if it has one, otherwise
			<span class="mono">&lt;|endoftext|&gt;</span>. One forward pass then gives the probabilities of every token at once: the logits at
			position <i>i−1</i>, put through a numerically stable log-softmax, give the probability of token <i>i</i>.
		</p>
		<p>
			Numbers depend on the model. The two models here cut text into different tokens and have read different things, so they weigh the
			same sentence differently. Use <a class="link" href="{base}/read">Compare</a> on the Read page to see both, or the
			<a class="link" href="{base}/lab">Lab</a> to set probabilities by hand.
		</p>
	</div>

	<aside class="side">
		<section>
			<span class="label">Privacy</span>
			<p class="priv" use:settle style:--fw="850">Runs on your device — no text leaves your browser.</p>
			<p class="small">
				The model files are downloaded once from the Hugging Face Hub and cached by your browser. Your sentences are processed in a Web
				Worker on this page. Nothing is sent to a server, and there are no analytics.
			</p>
		</section>
		<section>
			<span class="label">Models</span>
			<ul class="credits">
				{#each Object.entries(MODEL_INFO) as [k, m] (k)}
					<li>
						<b>{k === 'fast' ? 'FAST' : 'ACCURATE'}</b>
						<a class="link" href="https://huggingface.co/{m.repo}" rel="noopener noreferrer">{m.repo}</a>
						<span class="mono small">{m.size}</span>
					</li>
				{/each}
			</ul>
			<p class="small">
				SmolLM2 by Hugging Face (Apache-2.0). Qwen2.5 by the Qwen team, Alibaba Cloud (Apache-2.0); ONNX export by onnx-community. Runs
				with Transformers.js and ONNX Runtime Web. Type: Roboto Flex and JetBrains Mono (SIL OFL).
			</p>
		</section>
	</aside>
</article>

<style>
	.essay {
		padding-block: 32px 40px;
		row-gap: 40px;
	}
	.head {
		grid-column: 1 / -1;
		display: grid;
		gap: 10px;
		border-bottom: 1px solid var(--rule);
		padding-bottom: 24px;
	}
	.body {
		grid-column: 1 / span 7;
		font-size: 20px;
		line-height: 1.55;
		font-variation-settings: 'wght' 360, 'wdth' 100;
		max-width: 64ch;
	}
	.first::first-line {
		font-variation-settings: 'wght' 700, 'wdth' 100;
	}
	b {
		font-weight: normal;
		font-variation-settings: 'wght' 850, 'wdth' 105;
	}
	.mono {
		font-size: 0.85em;
	}
	blockquote {
		margin: 48px 0;
		padding: 20px 0;
		border-block: 1.5px solid var(--ink);
		font-size: clamp(36px, 4.6vw, 76px);
		line-height: 0.95;
		letter-spacing: -0.02em;
	}
	.side {
		grid-column: 9 / -1;
		display: grid;
		gap: 40px;
		align-content: start;
	}
	.side section {
		display: grid;
		gap: 12px;
		border-top: 1.5px solid var(--ink);
		padding-top: 12px;
	}
	.priv {
		font-size: 32px;
		line-height: 1;
		margin: 0;
		background: linear-gradient(transparent 60%, var(--hi) 60%);
		color: var(--ink);
	}
	:global([data-theme='dark']) .priv {
		background: none;
	}
	.small {
		font-size: 14px;
		color: var(--ink-2);
		margin: 0;
	}
	.credits {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 12px;
	}
	.credits li {
		display: grid;
		gap: 2px;
	}
	.credits b {
		font-family: var(--mono);
		font-variation-settings: normal;
		font-weight: 700;
		font-size: 12px;
		letter-spacing: 0.12em;
	}
	.credits .link {
		overflow-wrap: anywhere;
	}
	@media (max-width: 1023px) {
		.body,
		.side {
			grid-column: 1 / -1;
		}
	}
</style>
