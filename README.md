# HEAVY WORDS — a Perplexity Explorer

*Some words weigh more than others.*

A static website that shows how a real language model gives a probability to every token of a sentence, and how those probabilities become one number: perplexity. The models run entirely in the visitor's browser (Transformers.js in a Web Worker). There is no API, no key and no backend.

- `/` — home and the scroll story ("How a sentence is weighed")
- `/read` — the main tool: weigh a sentence with a real model
- `/lab` — **simulated**: type probabilities yourself (works in every browser)
- `/about` — how it works, credits, privacy

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test

```bash
npm test           # Vitest: perplexity math + surprise→font-axes mapping
npm run check      # svelte-check (TypeScript)
```

## Build and deploy

```bash
npm run build      # static site in ./build
npm run preview    # serve the build locally
```

No environment variables are needed.

- **Vercel / Netlify:** build command `npm run build`, output directory `build`.
- **GitHub Pages:** the site is served from `/<repo>`, so build with `BASE_PATH=/<repo> npm run build` and publish `build/`. Add an empty `build/.nojekyll` so the `_app` folder is served.

The first run on `/read` downloads the model from the Hugging Face Hub (Fast ≈ 182 MB, Accurate ≈ 786 MB). After that the browser serves it from its cache.

## Layout

```
src/lib/worker/model.worker.ts   model loading, forward pass, log-softmax, generation
src/lib/math/perplexity.ts       surprisal, perplexity (log space), log-sum-exp, top-k, number format  (+ tests)
src/lib/type/axes.ts             surprise → wght / wdth / highlighter                                  (+ tests)
src/lib/stores/                  engine (worker client, model choice, history), ui (theme, reduced motion)
src/lib/components/              WeightedLine, Wheel, Odometer, Drawer (slot reel), Equation, DataTable,
                                 NextBars, Compare, Story, HeroTitle, Ticker, Cursor, PageWipe, ...
src/lib/samples.json             real scores used on the home page (see below)
```

## Notes on choices

- **Model dtype is `q4` for both models, not the int8 / q4f16 from the brief.** I measured the brief's settings in this repo and they give wrong probabilities:
  - *int8* (both models): these ONNX files quantize activations per tensor across the whole sequence, so later tokens change the probabilities of earlier ones. P("The") came out different for "The cat" and "The dog sat", which a causal model can't do. For Qwen this made P(" Paris" | "The capital of France is") ≈ 0.0002. On WebGPU, int8 SmolLM2 returned P = 0 for every token.
  - *q4f16* (Qwen on WebGPU): the logits row at the start-token position came back all zeros (fp16 overflow), so the first token always got the uniform 1/151936.
  - *q4* (4-bit weights, fp32 activations) is causal and sensible: P(" Paris") = 0.73, P("ill" | "…windows") = 0.98. It costs more download: 182 MB and 786 MB instead of 137 MB and 483/512 MB. The dtype is one line per model in `model.worker.ts` if you want to change it back.
- **Fast always runs on WASM.** A 135M model is quick on the CPU (~100 ms per sentence here), and WASM is the path I tested. Accurate uses WebGPU when the browser has an adapter, otherwise WASM.
- **Guard against broken backends.** If any logits row is flat or non-finite, the worker raises an error instead of reporting a fake probability.
- **Start token.** As specified: `bos_token_id` if the tokenizer defines one, otherwise `<|endoftext|>`. For SmolLM2-*Instruct* the BOS is `<|im_start|>`, a chat-turn marker, so the first one or two tokens are scored as if a chat role should follow. They look very surprising for that reason. Qwen2.5 base has no BOS and uses `<|endoftext|>`.
- **The brief's second test value was off.** For `[0.5, 0.8, 0.2]` the perplexity is (1 / 0.08)^(1/3) = 12.5^(1/3) ≈ **2.32**, not 2.92. The test asserts the correct value.
- **"Continue"** uses `model.generate` (greedy, 30 tokens). A tiny `LogitsProcessor` records each step's logits, and a streamer reports P(chosen token) as each token arrives. A base 0.5B model often loops ("It is the capital of France. It is…"). That is the model, not a bug.
- **Home-page samples are real.** They were scored with this site's own worker (Qwen2.5-0.5B, q4, WebGPU). They are stored in `samples.json` so the home page loads without downloading a model. Re-run any of them on `/read`. WASM can differ in the last digits.
- **Weight mapping** is exactly `s = clamp(h/8, 0, 1)`, `wght = 100 + 900s`, `wdth = 60 + 91s`. With that mapping, P = 0.01 (h ≈ 4.6) is clearly bold (≈ wght 620) but not ultra-bold. Full weight needs P < e⁻⁸ ≈ 0.00034.
- **Dark-mode contrast.** Light text on a yellow highlighter fails contrast. In dark mode, tokens with s ≥ 0.45 get a full-height mark with dark text. Quieter marks stay faint under light text.
- **Token view** shows spaces as ␣ and newlines as ↵. Sub-word tokens are kept together so lines only break between words.
- **ONNX Runtime's WASM binary (~21 MB)** ships in `build/` and is fetched only when a model loads. The pages don't need it. Without cross-origin isolation headers it runs single-threaded. That is fine for these sizes.
- Motion uses CSS transitions on `transform`, `opacity` and `font-variation-settings`, plus Svelte `Spring`/`Tween`. GSAP ScrollTrigger drives only the pinned story, and Lenis provides smooth scroll. Reduced motion turns off Lenis, pinning, pointer-reactive letters, reel and wheel spins and page wipes, and tokens render at their final weight.

## Not verified

- Real phones (only checked with a 375 px emulated viewport in a desktop Chromium engine).
- Safari and Firefox. WebGPU availability and `Float16Array` differ there, and the WASM fallback for the Accurate model (q4 on CPU) was not run in a browser.
- Lighthouse score (target ≥ 90): not measured.
- Slow laptops / low-memory devices: the 786 MB model may fail to load. The UI then shows an error and points to the Fast model and the Lab.
- Reduced-motion mode was checked by reading the code paths, not with an emulated `prefers-reduced-motion` setting.
- Page-wipe timing and the custom cursor were only spot-checked (the test browser pane was often in the background, which throttles timers).
- Screen readers: labels are in place (`'quietly', probability 0.01, most surprising`; the wheel has a text alternative) but were not tested with VoiceOver/NVDA.
