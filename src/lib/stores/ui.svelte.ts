import { browser } from '$app/environment';

const mq = (q: string) => (browser ? matchMedia(q) : null);

class UI {
	reduced = $state(false);
	phone = $state(false);
	finePointer = $state(false);
	theme = $state<'light' | 'dark'>('light');

	constructor() {
		if (!browser) return;
		const bind = (q: string, set: (v: boolean) => void) => {
			const m = mq(q)!;
			set(m.matches);
			m.addEventListener('change', () => set(m.matches));
		};
		bind('(prefers-reduced-motion: reduce)', (v) => (this.reduced = v));
		bind('(max-width: 767px)', (v) => (this.phone = v));
		bind('(hover: hover) and (pointer: fine)', (v) => (this.finePointer = v));
		this.theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		mq('(prefers-color-scheme: dark)')!.addEventListener('change', (e) => {
			if (!localStorage.getItem('hw-theme')) this.setTheme(e.matches ? 'dark' : 'light', false);
		});
	}

	setTheme(t: 'light' | 'dark', remember = true) {
		this.theme = t;
		document.documentElement.dataset.theme = t;
		if (remember) localStorage.setItem('hw-theme', t);
	}
}

export const ui = new UI();
