/* Live server data, in one place — read by both the status bar and the
   dashboard, owned by neither. An object, not a `let`, since only its properties survive as $state across a module boundary. */

import { fetchWithTimeout } from '$lib/http.js';

/* Anything labelling an x axis reads this, so no chart can claim a span the request didn't make. */
export const RANGE = '24h';

/* ~15 min per cell at the step below — fine enough for a spike, coarse enough to still be a cell. */
export const HEAT_COLUMNS = 72;

/* Used space moves over weeks, not minutes — a second request with its own step. */
export const MONTH_RANGE = '30d';

const API = import.meta.env.DEV ? '/api' : 'https://status-api.js195.co.uk/api/v1';
const SNAPSHOT_MS = 30_000;
/* The series' own step: asking faster returns the same points. */
const HISTORY_MS = 300_000;
const MONTH_MS = 1_800_000;
const MONTH_DELAY_MS = 10_000;
/* Below the 30s poll interval, so a hung request can't still be in flight when
   the next one would otherwise fire — it fails and frees the `inFlight` guard first. */
const REQUEST_TIMEOUT_MS = 15_000;

export const server = $state({
	snapshot: null,
	series: null,
	month: null,
	/* Per-key 'pending' | 'ok' | 'stale' | 'error'. A card needs to tell "still
	   loading" from "tried and failed" instead of reading null forever as
	   "Checking…" — and, once it has data, tell "this reading is current" from
	   "this is the last one we got, we can't currently confirm it still holds". */
	status: { snapshot: 'pending', series: 'pending', month: 'pending' }
});

const inFlight = new Set();

async function load(key, url) {
	if (inFlight.has(key)) return;
	inFlight.add(key);

	try {
		const response = await fetchWithTimeout(url, {}, REQUEST_TIMEOUT_MS);
		if (!response.ok) throw new Error(`${key} request failed: ${response.status}`);
		server[key] = await response.json();
		server.status[key] = 'ok';
	} catch {
		/* Keep the last good data on the wire dropping out; the next poll picks it
		   back up. But the request state has to say so — 'stale' data beats no
		   data, it doesn't beat honesty about how current it is. 'error' only
		   when we never got any. */
		server.status[key] = server[key] === null ? 'error' : 'stale';
	} finally {
		inFlight.delete(key);
	}
}

const loadSnapshot = () => load('snapshot', `${API}/system`);
const loadSeries = () => load('series', `${API}/history?window=${RANGE}`);
const loadMonth = () => load('month', `${API}/history?window=${MONTH_RANGE}`);

/* Lives as long as `$effect(watch)` does. Headlines poll fast, series polls at
   its own step — different rates. Nothing fetches while the tab is hidden; refreshes on return. */
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
