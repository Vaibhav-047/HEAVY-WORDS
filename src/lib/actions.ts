/** Kinetic headings: thin until they enter the viewport, then settle to their final weight (CSS in app.css). */
export function settle(node: HTMLElement) {
	node.dataset.settle = '';
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries)
				if (e.isIntersecting) {
					node.classList.add('in');
					io.disconnect();
				}
		},
		{ threshold: 0.3 }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}
