/* Summaries over a [unixSeconds, value] series. Nothing here knows what the
   numbers are or how they are drawn. */

export const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

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

export const percentile = (values, p) => {
	const sorted = [...values].sort((a, b) => a - b);
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

/* The four numbers a metric is read by, formatted and ready to render. An empty
   series needs no guard here: every formatter writes a number it has not got as
   an em dash, so a card that gains its data later keeps its shape until it
   does. */
export function summarise(points, format) {
	const values = points?.map((p) => p[1]) ?? [];

	return [
		['Min', format(Math.min(...values))],
		['Med', format(percentile(values, 0.5))],
		['P95', format(percentile(values, 0.95))],
		['Max', format(Math.max(...values))]
	];
}

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
