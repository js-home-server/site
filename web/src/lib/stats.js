/* Summaries over a [unixSeconds, value] series. Nothing here knows what any of
   the numbers mean; the few that hand back finished text take the formatter
   that does as an argument. */

/* A series stripped to its readings, which is what everything below works on.
   An absent series is an empty one, so nothing has to guard before summarising.
   The rest of this file takes those readings rather than the series itself, and
   calls them `readings` so nothing shadows this. */
export const values = (points) => (points ?? []).map((point) => point[1]);

export const mean = (readings) => readings.reduce((sum, v) => sum + v, 0) / readings.length;

/* The reading at the end of a series: what it says now. Null where there is no
   series yet, which every formatter in $lib/format.js writes as an em dash. */
export const last = (points) => (points?.length ? points.at(-1)[1] : null);

/* Runs of downtime, not readings of it: an outage lasting four polls is one
   incident, not four. The status series is 1 for a poll the machine answered and
   0 for one it did not, so anything under a half is down. */
export const outages = (points) =>
	(points ?? []).reduce(
		(n, [, v], i, all) => n + (v < 0.5 && !(i && all[i - 1][1] < 0.5) ? 1 : 0),
		0
	);

/* How far a series' first reading sits behind its last, in seconds — the
   window every trace off the same series is actually labelled with, since an
   API that has not been collecting long only ever returns that much. */
export const spanSeconds = (points) => (points?.length > 1 ? points.at(-1)[0] - points[0][0] : 0);

export const percentile = (readings, p) => {
	const sorted = [...readings].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
};

/* The series' own window, cut into `count` equal buckets, each the mean of the
   samples that fall in it. A bucket nothing was collected for comes back null,
   not zero: unknown is not the same as idle, or down, and the callers draw the
   difference. Never more buckets than samples, or the empty ones between them
   read as real. */
export function bucket(points, count) {
	if (!Array.isArray(points) || points.length < 2) return [];

	const t0 = points[0][0];
	const dt = points.at(-1)[0] - t0 || 1;
	const n = Math.min(count, points.length);
	const buckets = Array.from({ length: n }, () => []);

	for (const [t, v] of points) {
		buckets[Math.min(n - 1, Math.floor(((t - t0) / dt) * n))].push(v);
	}

	return buckets.map((b) => (b.length ? mean(b) : null));
}

/* The columns a 24h statistics table is read across, and the figures under
   them, in one place: StatsTable renders the first and every page fills the
   second, so a column can never end up naming a figure from a different slot.

   An empty series needs no guard: min/max of nothing is ±Infinity, mean and
   percentile of nothing are NaN, and every formatter writes all three as the
   same em dash the rest of the page uses for "no history yet" — so a card that
   gains its data later keeps its shape until it does. */
export const STAT_COLUMNS = ['Min', 'Median', 'Avg', 'P95', 'Max'];

export function statsRow(points, format) {
	const readings = values(points);

	return [
		format(Math.min(...readings)),
		format(percentile(readings, 0.5)),
		format(mean(readings)),
		format(percentile(readings, 0.95)),
		format(Math.max(...readings))
	];
}

/* The window's floor and ceiling as one line, for a card that shows a live
   figure and wants the range behind it. Cased by hand: the reading keeps
   whatever case its own unit takes (°C, ms, µs), and only the two words around
   it are the page's own small caps. */
export const minMax = (points, format) => {
	const readings = values(points);
	return readings.length
		? `MIN ${format(Math.min(...readings))} · MAX ${format(Math.max(...readings))}`
		: 'NO HISTORY YET';
};

/* Least-squares slope over a [unixSeconds, value] series: the rate it is moving,
   in value units per second. Null when there is not enough of it to say — two
   points is a line, one is a rumour. */
export function slope(points) {
	if (!Array.isArray(points) || points.length < 2) return null;

	const t0 = points[0][0];
	let st = 0;
	let sv = 0;
	let stt = 0;
	let stv = 0;

	for (const [t, v] of points) {
		const x = t - t0;
		st += x;
		sv += v;
		stt += x * x;
		stv += x * v;
	}

	const denominator = points.length * stt - st * st;
	return denominator ? (points.length * stv - st * sv) / denominator : 0;
}
