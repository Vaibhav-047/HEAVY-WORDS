import data from './samples.json';

export interface Sample {
	text: string;
	perplexity: number;
	tokens: { token: string; p: number; h: number }[];
}

/**
 * Real scores, not invented: produced by this site's own worker (onnx-community/Qwen2.5-0.5B, q4, WebGPU)
 * on 2026-11-24. Re-run any of them on /read to compare; WASM numbers can differ in the last digits.
 */
export const ALL: Sample[] = data;
export const byText = (t: string) => ALL.find((s) => s.text === t)!;
export const HERO = byText('My grandmother knits sweaters for submarines.');
export const STORY = byText('To be or not to be, that is the question.');
export const SAMPLES = ALL.filter((s) => s !== HERO && s !== STORY);
