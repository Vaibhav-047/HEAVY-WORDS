/** Surprisal in nats: h = -ln p. */
export function surprisal(p: number): number {
	assertProb(p);
	return -Math.log(p);
}

export function assertProb(p: number): void {
	if (!(p > 0 && p <= 1)) throw new RangeError(`Probability must be in (0, 1], got ${p}`);
}

/** Mean surprisal (nats) of a list of probabilities. */
export function meanSurprisal(ps: readonly number[]): number {
	if (ps.length === 0) throw new RangeError('Need at least one probability');
	let sum = 0;
	for (const p of ps) sum += surprisal(p);
	return sum / ps.length;
}

/** Perplexity = exp(mean -ln p), computed in log space so long inputs never overflow. */
export function perplexity(ps: readonly number[]): number {
	return Math.exp(meanSurprisal(ps));
}

/** Perplexity straight from surprisals (what the worker already has). */
export function perplexityFromSurprisal(hs: readonly number[]): number {
	if (hs.length === 0) throw new RangeError('Need at least one surprisal');
	return Math.exp(hs.reduce((a, b) => a + b, 0) / hs.length);
}

/**
 * Stable log-softmax of one logits row, evaluated at a single index.
 * Returns ln P(index). Subtract the max, then log-sum-exp.
 */
export function logSoftmaxAt(row: ArrayLike<number>, index: number, lse = logSumExp(row)): number {
	return row[index] - lse;
}

export function logSumExp(row: ArrayLike<number>): number {
	let max = -Infinity;
	for (let i = 0; i < row.length; i++) if (row[i] > max) max = row[i];
	let sum = 0;
	for (let i = 0; i < row.length; i++) sum += Math.exp(row[i] - max);
	return max + Math.log(sum);
}

/** Indices and probabilities of the k largest entries in a logits row. */
export function topK(row: ArrayLike<number>, k: number, lse = logSumExp(row)): { id: number; p: number }[] {
	const ids: number[] = [];
	const vals: number[] = [];
	for (let i = 0; i < row.length; i++) {
		const v = row[i];
		if (ids.length < k || v > vals[vals.length - 1]) {
			let j = vals.length < k ? vals.length : k - 1;
			while (j > 0 && vals[j - 1] < v) {
				vals[j] = vals[j - 1];
				ids[j] = ids[j - 1];
				j--;
			}
			vals[j] = v;
			ids[j] = i;
		}
	}
	return ids.map((id, i) => ({ id, p: Math.exp(vals[i] - lse) }));
}

/** Format a number for tables: scientific below 0.001 or above 1e6, else up to `digits` significant. */
export function fmt(x: number, digits = 3): string {
	if (!Number.isFinite(x)) return '∞';
	const a = Math.abs(x);
	if (a !== 0 && (a < 0.001 || a > 1e6)) return x.toExponential(2).replace('e+', 'e');
	return Number(x.toPrecision(digits)).toString();
}
