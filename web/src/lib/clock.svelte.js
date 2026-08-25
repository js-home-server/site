/* A clock that ticks. Built with whatever `new Date()` says at the time — on
   the server that is the render, with nothing to keep it up to date, so the
   real time takes over on its own once this runs in a browser.

   `every` is how often to look again: a display showing seconds needs a second,
   one showing only hours and minutes does not and should not wake up for one.
   The interval is cleared with the effect that started it, so a page that
   navigates away stops ticking with it. */
export function ticking(every) {
	let now = $state(new Date());

	$effect(() => {
		const id = setInterval(() => (now = new Date()), every);
		return () => clearInterval(id);
	});

	return {
		get now() {
			return now;
		}
	};
}
