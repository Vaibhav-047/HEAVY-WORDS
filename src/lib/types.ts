export type ModelKey = 'fast' | 'accurate';
export type Backend = 'webgpu' | 'wasm';

export interface Cand {
	token: string;
	p: number;
}
export interface TokenScore {
	token: string;
	id: number;
	p: number;
	h: number;
	top8: Cand[];
}
export interface ScoreResult {
	text: string;
	model: ModelKey;
	backend: Backend;
	tokens: TokenScore[];
	next8: Cand[];
	perplexity: number;
	meanSurprisal: number;
	ms: number;
}

export type ToWorker =
	| { type: 'load'; model: ModelKey }
	| { type: 'score'; id: number; model: ModelKey; text: string }
	| { type: 'continue'; id: number; model: ModelKey; text: string };

export interface FileProgress {
	file: string;
	loaded: number;
	total: number;
	done: boolean;
}

export type FromWorker =
	| { type: 'progress'; model: ModelKey; backend: Backend; file: string; loaded: number; total: number; done: boolean }
	| { type: 'ready'; model: ModelKey; backend: Backend }
	| { type: 'result'; id: number; result: ScoreResult }
	| { type: 'gen-token'; id: number; token: string; p: number }
	| { type: 'gen-done'; id: number }
	| { type: 'error'; id?: number; model?: ModelKey; message: string };
