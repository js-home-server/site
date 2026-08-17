/* The live server data, in one place: the landing page's status bar and the
   dashboard both read it, and neither owns it. Exported as an object because a
   reassigned `let` cannot carry its reactivity across a module boundary —
   properties of a $state object can. */

/* The window the history endpoint is asked for. Anything labelling an x axis
   reads this, so no chart can claim a span the request did not make. */
export const RANGE = '24h';

/* The window the capacity history is asked for: used space moves over weeks, not
   minutes, so it is a second request with a step to match. */
export const MONTH_RANGE = '30d';

const SNAPSHOT_MS = 30_000;
/* The series' own step: asking faster returns the same points. */
const HISTORY_MS = 300_000;
const MONTH_MS = 1_800_000;

export const server = $state({
	/* { server, uptimeSeconds, cpuPercent, cpuPressurePercent, memoryPercent,
	   cpuTemperatureC, latencyMs, ... } */
	snapshot: null,
	/* { generatedAt, range, stepSeconds, ...series }, each series a list of
	   [unixSeconds, value] — bar cpuPerCorePercent, which is one such list per
	   core id. */
	series: null,
	/* The same shape at 30d, which is the only range carrying the volumes'
	   used and available bytes. */
	month: null
});

const inFlight = new Set();

async function load(key, url, apply) {
	if (inFlight.has(key)) return;
	inFlight.add(key);

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${key} request failed: ${response.status}`);
		apply(await response.json());
	} catch {
		/* Keep the last good data on the wire dropping out; the next poll picks it
		   back up. */
	} finally {
		inFlight.delete(key);
	}
}

const loadSnapshot = () => load('snapshot', '/api/status', (data) => (server.snapshot = data));

const loadSeries = () =>
	load('series', `/api/history?range=${RANGE}`, (data) => (server.series = data));

const loadMonth = () =>
	load('month', `/api/history?range=${MONTH_RANGE}`, (data) => (server.month = data));

/* Poll for as long as the caller lives — `$effect(watch)` in a component, whose
   teardown is the returned function. The headline numbers move every poll; the
   series only gains a point every step, so the two are not fetched at one rate.
   Nothing is fetched into a hidden tab, and everything is on the way back. */
export function watch() {
	const refresh = () => {
		if (document.hidden) return;
		loadSnapshot();
		loadSeries();
		loadMonth();
	};

	refresh();
	const timers = [
		setInterval(() => !document.hidden && loadSnapshot(), SNAPSHOT_MS),
		setInterval(() => !document.hidden && loadSeries(), HISTORY_MS),
		setInterval(() => !document.hidden && loadMonth(), MONTH_MS)
	];

	document.addEventListener('visibilitychange', refresh);

	return () => {
		timers.forEach(clearInterval);
		document.removeEventListener('visibilitychange', refresh);
	};
}
