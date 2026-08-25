/* The live server data, in one place: the landing page's status bar and the
   dashboard both read it, and neither owns it. Exported as an object because a
   reassigned `let` cannot carry its reactivity across a module boundary —
   properties of a $state object can. */

/* The window the history endpoint is asked for. Anything labelling an x axis
   reads this, so no chart can claim a span the request did not make. */
export const RANGE = '24h';

/* Cells across a heatmap drawn over that window. At the step below it comes to
   about a quarter-hour a cell: fine enough to see a spike, coarse enough that a
   cell is still a cell rather than a hairline. */
export const HEAT_COLUMNS = 72;

/* The window the capacity history is asked for: used space moves over weeks, not
   minutes, so it is a second request with a step to match. */
export const MONTH_RANGE = '30d';

const API = import.meta.env.DEV ? '/api' : 'https://status-api.js195.co.uk/api/v1';
const SNAPSHOT_MS = 30_000;
/* The series' own step: asking faster returns the same points. */
const HISTORY_MS = 300_000;
const MONTH_MS = 1_800_000;
const MONTH_DELAY_MS = 10_000;

export const server = $state({
	snapshot: null,
	series: null,
	month: null
});

const inFlight = new Set();

async function load(key, url) {
	if (inFlight.has(key)) return;
	inFlight.add(key);

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${key} request failed: ${response.status}`);
		server[key] = await response.json();
	} catch {
		/* Keep the last good data on the wire dropping out; the next poll picks it
		   back up. */
	} finally {
		inFlight.delete(key);
	}
}

const loadSnapshot = () => load('snapshot', `${API}/system`);
const loadSeries = () => load('series', `${API}/history?window=${RANGE}`);
const loadMonth = () => load('month', `${API}/history?window=${MONTH_RANGE}`);

/* Poll for as long as the caller lives — `$effect(watch)` in a component, whose
   teardown is the returned function. The headline numbers move every poll; the
   series only gains a point every step, so the two are not fetched at one rate.
   Nothing is fetched into a hidden tab, and everything is on the way back. */
export function watch() {
	let monthTimer;
	const refresh = () => {
		if (document.hidden) return;
		loadSnapshot();
		loadSeries();
		clearTimeout(monthTimer);
		monthTimer = setTimeout(() => !document.hidden && loadMonth(), MONTH_DELAY_MS);
	};

	refresh();
	const timers = [
		setInterval(() => !document.hidden && loadSnapshot(), SNAPSHOT_MS),
		setInterval(() => !document.hidden && loadSeries(), HISTORY_MS),
		setInterval(() => !document.hidden && loadMonth(), MONTH_MS + MONTH_DELAY_MS)
	];

	document.addEventListener('visibilitychange', refresh);

	return () => {
		clearTimeout(monthTimer);
		timers.forEach(clearInterval);
		document.removeEventListener('visibilitychange', refresh);
	};
}
