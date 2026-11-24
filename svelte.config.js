import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		// GitHub Pages serves from /<repo>; set BASE_PATH at build time there (optional, no env needed elsewhere).
		paths: { base: process.env.BASE_PATH ?? '' }
	}
};
