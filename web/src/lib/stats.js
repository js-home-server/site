/* Summaries over a [unixSeconds, value] series. Nothing here knows what the
   numbers mean — callers that need finished text pass in a formatter. */

/* Strips a series to its readings — an absent series is just empty, no guard needed. */
export const values = (points) => (points ?? []).map((point) => point[1]);

export const mean = (readings) => readings.reduce((sum, v) => sum + v, 0) / readings.length;

/* What the series says now. Null with no data — format.js writes that as an em dash. */
export const last = (points) => (points?.length ? points.at(-1)[1] : null);

/* Runs, not readings — a four-poll outage is one incident, not four. */
export const outages = (points) =>
	(points ?? []).reduce(
		(n, [, v], i, all) => n + (v < 0.5 && !(i && all[i - 1][1] < 0.5) ? 1 : 0),
		0
	);

/* First-to-last span in seconds — the actual window an API that hasn't been collecting long can return. */
export const spanSeconds = (points) => (points?.length > 1 ? points.at(-1)[0] - points[0][0] : 0);

export const percentile = (readings, p) => {
	const sorted = [...readings].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
};

/* `count` equal buckets, each the mean of its samples. Empty bucket = null, not
   zero — unknown isn't idle or down. Never more buckets than samples. */
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

/* Columns + figures in one place, so a column can never name a figure from the
   wrong slot. Empty series needs no guard — min/max/percentile of nothing all format to the same em dash. */
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

/* Floor and ceiling as one line. Cased by hand — units (°C, ms, µs) keep their own case, only "MIN"/"MAX" are small caps. */
export const minMax = (points, format) => {
	const readings = values(points);
	return readings.length
		? `MIN ${format(Math.min(...readings))} · MAX ${format(Math.max(...readings))}`
		: 'NO HISTORY YET';
};

/* Least-squares slope, value units per second. Null under two points — one point is a rumour, not a rate. */
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
