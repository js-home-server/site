/* Geometry for the traces. Everything draws into one 100x30 viewBox, stretched
   to whatever box it's given, so a caller only ever deals in the series' own units. */

/* The viewBox the paths below are written in. */
export const VIEW = { width: 100, height: 30 };

/* Value's vertical position, in viewBox units. Shared by rules and their labels so the two can't drift. */
export const markY = (value, [lo, hi]) =>
	VIEW.height - ((value - lo) / (hi - lo || 1)) * VIEW.height;

/* Closes a trace down to the floor and back — the shading under it, sharing the same path so fill can't drift from the line. */
export const area = (d) => (d ? `${d} L${VIEW.width},${VIEW.height} L0,${VIEW.height} Z` : '');

/* Series' own range plus a little air, for a chart with no fixed scale. Floor holds at zero if the series never goes negative — a negative percentage means nothing. */
export function headroom(values) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	const pad = (max - min) * 0.15 || 1;
	const lo = min - pad;

	return [min >= 0 && lo < 0 ? 0 : lo, max + pad];
}

/* SVG path over a [unixSeconds, value] series, x by timestamp so a collection
   gap reads as a gap. Empty string ("nothing to show") if too short to draw.
   `domain` is [lo, hi] for a fixed scale (0-100% CPU); without one, y scales via
   headroom() — what a sparkline wants, so a flat trace still shows shape. */
export function chart(points, domain) {
	if (!Array.isArray(points) || points.length < 2) return '';

	const [lo, hi] = domain ?? headroom(points.map((p) => p[1]));
	const t0 = points[0][0];
	const dt = points.at(-1)[0] - t0 || 1;

	return points
		.map(([t, v], i) => {
			const x = ((t - t0) / dt) * VIEW.width;
			/* Clamped, so a reading past the ends of a fixed domain rides the edge of
			   the box instead of painting outside it. */
			const y = Math.min(VIEW.height, Math.max(0, markY(v, [lo, hi])));
			return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(' ');
}
