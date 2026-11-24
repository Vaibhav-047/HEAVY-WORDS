import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	worker: { format: 'es' },
	optimizeDeps: { exclude: ['@huggingface/transformers'] },
	test: { include: ['src/**/*.test.ts'] }
});
