import { describe, expect, it } from 'vitest';
import { fmt, logSoftmaxAt, logSumExp, meanSurprisal, perplexity, topK } from './perplexity';

describe('perplexity', () => {
	it('eight tokens at 0.125 -> 8', () => {
		expect(perplexity(Array(8).fill(0.125))).toBeCloseTo(8, 10);
	});
	// The brief said ≈ 2.92; the exact value is (1 / (0.5·0.8·0.2))^(1/3) = 12.5^(1/3) ≈ 2.3208.
	it('[0.5, 0.8, 0.2] -> 12.5^(1/3) ≈ 2.32', () => {
		expect(perplexity([0.5, 0.8, 0.2])).toBeCloseTo(Math.cbrt(12.5), 12);
		expect(perplexity([0.5, 0.8, 0.2])).toBeCloseTo(2.3208, 4);
	});
	it('rejects an empty list', () => {
		expect(() => perplexity([])).toThrow();
	});
	it('rejects p <= 0', () => {
		expect(() => perplexity([0.5, 0])).toThrow();
		expect(() => perplexity([-0.1])).toThrow();
	});
	it('rejects p > 1 and NaN', () => {
		expect(() => perplexity([1.2])).toThrow();
		expect(() => perplexity([NaN])).toThrow();
	});
	it('does not overflow on long, surprising inputs', () => {
		const ps = Array(5000).fill(1e-6);
		expect(perplexity(ps)).toBeCloseTo(1e6, 0);
		expect(meanSurprisal(ps)).toBeCloseTo(Math.log(1e6), 8);
	});
});

describe('log-softmax', () => {
	it('is stable for huge logits and sums to 1', () => {
		const row = [1000, 1001, 1002];
		const lse = logSumExp(row);
		const total = row.reduce((s, _, i) => s + Math.exp(logSoftmaxAt(row, i, lse)), 0);
		expect(total).toBeCloseTo(1, 12);
		expect(Math.exp(logSoftmaxAt(row, 2, lse))).toBeCloseTo(0.6652, 4);
	});
	it('topK returns the largest entries in order', () => {
		const top = topK([0, 5, 1, 4, 3, 2], 3);
		expect(top.map((t) => t.id)).toEqual([1, 3, 4]);
		expect(top[0].p).toBeGreaterThan(top[1].p);
	});
});

describe('fmt', () => {
	it('uses scientific notation outside [0.001, 1e6]', () => {
		expect(fmt(0.0001)).toBe('1.00e-4');
		expect(fmt(2e7)).toBe('2.00e7');
		expect(fmt(0.125)).toBe('0.125');
	});
});
