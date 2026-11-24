import { describe, expect, it } from 'vitest';
import { axes } from './axes';

describe('axes', () => {
	it('h = 0 gives the lightest values', () => {
		const a = axes(0);
		expect(a).toMatchObject({ s: 0, wght: 100, wdth: 60, mark: 0 });
	});
	it('h >= 8 gives the heaviest values', () => {
		for (const h of [8, 12, Infinity]) {
			const a = axes(h);
			expect(a.s).toBe(1);
			expect(a.wght).toBe(1000);
			expect(a.wdth).toBe(151);
			expect(a.mark).toBeCloseTo(0.9);
		}
	});
	it('is monotonic in between', () => {
		let prev = axes(0);
		for (let h = 0.1; h <= 8; h += 0.1) {
			const a = axes(h);
			expect(a.wght).toBeGreaterThan(prev.wght);
			expect(a.wdth).toBeGreaterThan(prev.wdth);
			expect(a.markH).toBeGreaterThan(prev.markH);
			expect(a.mark).toBeGreaterThanOrEqual(prev.mark);
			prev = a;
		}
	});
	it('clamps negative surprisal to lightest', () => {
		expect(axes(-1).wght).toBe(100);
	});
});
