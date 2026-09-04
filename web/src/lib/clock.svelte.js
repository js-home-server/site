/* Starts at render time (stale on the server, real once in a browser). `every`
   is how often to re-check — seconds displays need one, hour/minute ones don't.
   Interval clears with the effect, so navigating away stops the tick. */
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
