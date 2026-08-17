/* Geometry for the traces. Everything here is drawn into one 100 x 30 viewBox,
   stretched to whatever box it is given, so a caller only ever deals in the
   series' own units. */

/* The viewBox the paths below are written in. */
export const VIEW = { width: 100, height: 30 };

/* Where a value sits vertically, in viewBox units. Used for the reference rules
   and for the scale labels beside them, so a label and its line cannot drift. */
export const markY = (value, [lo, hi]) =>
	VIEW.height - ((value - lo) / (hi - lo || 1)) * VIEW.height;

/* An SVG path over a [unixSeconds, value] series, x by timestamp so a gap in
   collection reads as a gap rather than being closed up. Empty string for
   anything too short to draw, which the callers use as "nothing to show".

   `domain` is [lo, hi] in the series' own units — pass it wherever the reading
   means something against a fixed scale (0-100% of a CPU) so the trace's height
   is that reading rather than a shape normalised out of it. Without one, y is
   scaled to the series' own range with a little headroom, which is what a
   thumbnail sparkline wants: a flat trace still shows its shape and spikes still
   have somewhere to go. */
/* The series' own range with a little air above and below it, for a sparkline
   with no scale of its own to be drawn against. */
function headroom(values) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	const pad = (max - min) * 0.15 || 1;
	return [min - pad, max + pad];
}

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
