/** Surprisal (nats) at which a token reaches full weight. */
export const H_MAX = 8;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : Number.isFinite(x) ? x : 1);

/** Normalised surprise s = clamp(h / 8, 0, 1). */
export const surprise = (h: number) => clamp01(h / H_MAX);

export interface Axes {
	s: number;
	wght: number;
	wdth: number;
	/** highlighter opacity, 0.35–0.9 (0 when s is ~0, so expected words stay quiet) */
	mark: number;
	/** highlighter height as a fraction of the line box */
	markH: number;
}

export function axes(h: number): Axes {
	const s = surprise(h);
	return {
		s,
		wght: 100 + 900 * s,
		wdth: 60 + 91 * s,
		mark: s < 0.05 ? 0 : 0.35 + 0.55 * s,
		markH: 0.18 + 0.5 * s
	};
}

export const fvs = (wght: number, wdth: number) => `"wght" ${wght.toFixed(0)}, "wdth" ${wdth.toFixed(1)}`;
export const fvsFor = (h: number) => {
	const a = axes(h);
	return fvs(a.wght, a.wdth);
};
/** Thinnest setting — the starting pose before a token "puts on weight". */
export const THIN = fvs(100, 60);
