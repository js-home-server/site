/* One place readings get written down, so a quantity is never spelled two ways.
   Every function here returns an em dash for missing data — no caller has to guard. */

/* Clamped 0-100, or null with no reading — whatever a ring or bar draws has to be one of those. */
export const share = (v) => (Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null);

/* Whole percentages, except under 1% — pressure runs in hundredths, and rounding to 0% would hide a stalling machine. */
export const pct = (v) => {
	if (!Number.isFinite(v)) return '—';
	if (v !== 0 && Math.abs(v) < 0.01) return '<0.01%';
	return v !== 0 && Math.abs(v) < 1 ? `${v.toFixed(2)}%` : `${Math.round(v)}%`;
};

export const degrees = (v) => (Number.isFinite(v) ? `${Math.round(v)}°C` : '—');

/* Whole ms — the probe isn't accurate to fractions anyway. Narrow no-break space so "161 ms" can't wrap between the two. */
export const ms = (v) => (Number.isFinite(v) ? `${Math.round(v)} ms` : '—');

/* Signed — which side of the reference it's on is half the reading. */
export const microseconds = (v) =>
	Number.isFinite(v) ? `${v < 0 ? '−' : '+'}${Math.round(Math.abs(v) * 1e6)} µs` : '—';

/* Unsigned — a dispersion or delay is a width, not a direction. Same unit as microseconds() so the two compare directly. */
export const microspan = (v) =>
	Number.isFinite(v) ? `${Math.round(Math.abs(v) * 1e6)} µs` : '—';

export const clockPosition = (v) => {
	if (!Number.isFinite(v)) return '—';
	const distance = Math.round(Math.abs(v) * 1e6);
	return distance ? `${distance} µs ${v > 0 ? 'ahead' : 'behind'}` : 'On reference';
};

/* Parts per million, how fast a clock runs rather than where it is. */
export const ppm = (v) =>
	Number.isFinite(v) ? `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(3)} ppm` : '—';

/* Two units at whatever scale reads best — a fortnight isn't read in minutes. Padded so a column doesn't jump crossing ten. */
export function duration(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return '—';

	const pad = (n) => String(n).padStart(2, '0');
	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor(seconds / 3600) % 24;

	if (days) return `${days}d ${pad(hours)}h`;
	return hours ? `${hours}h ${pad(Math.floor(seconds / 60) % 60)}m` : `${Math.floor(seconds / 60)}m`;
}

/* Split from its unit so a caller can size them differently. */
export const uptimeHours = (seconds) => (Number.isFinite(seconds) ? Math.floor(seconds / 3600) : null);

/* Short form for a value ("24H"), long for a screen reader ("24 hours"). No
   history reads as an em dash short, or null long (the caller has its own fallback sentence). */
export function span(seconds, { short = false } = {}) {
	if (seconds >= 3600) {
		const hours = Math.round(seconds / 3600);
		return short ? `${hours}H` : `${hours} hours`;
	}
	if (seconds > 0) {
		const minutes = Math.round(seconds / 60);
		return short ? `${minutes}M` : `${minutes} minutes`;
	}
	return short ? '—' : null;
}

const GB = 2 ** 30;
const TB = 2 ** 40;

/* Two decimals once a figure is small enough for them to mean something, one below that. */
export function bytes(n) {
	if (!Number.isFinite(n)) return '—';
	if (n >= TB) return `${(n / TB).toFixed(2)} TB`;
	if (n >= GB) return `${(n / GB).toFixed(1)} GB`;
	return `${(n / 2 ** 20).toFixed(0)} MB`;
}

/* Pinned to one unit for ratio pairs ("58.4 / 468.4 GB") — bytes() would scale each side independently and break the comparison. */
export const gigabytes = (n) => (Number.isFinite(n) ? (n / GB).toFixed(1) : '—');

/* Signed — emptying is as much a fact as filling. Drops to MB for small rates, since 0.1577 GB/day rounded to 0.2 misdates a projection by months. */
export function perDay(bytesPerDay) {
	if (!Number.isFinite(bytesPerDay)) return '—';

	const sign = bytesPerDay < 0 ? '−' : '+';
	const size = Math.abs(bytesPerDay);

	return size < GB
		? `${sign}${(size / 2 ** 20).toFixed(0)} MB/day`
		: `${sign}${(size / GB).toFixed(1)} GB/day`;
}

/* A throughput, at the size the number lands in. */
export function rate(bytesPerSecond) {
	if (!Number.isFinite(bytesPerSecond)) return '—';
	if (bytesPerSecond >= GB) return `${(bytesPerSecond / GB).toFixed(1)} GB/s`;
	if (bytesPerSecond >= 2 ** 20) return `${(bytesPerSecond / 2 ** 20).toFixed(1)} MB/s`;
	if (bytesPerSecond >= 1024) return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
	return `${Math.round(bytesPerSecond)} B/s`;
}

/* UTC — that's the clock the server keeps, so this matches the logs. */
export function stamp(iso) {
	const at = new Date(iso ?? NaN);
	return Number.isNaN(+at) ? '—' : `${at.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

/* Best unit for the distance. A volume that isn't filling gets null, not an infinity. */
export function untilFull(days) {
	if (!Number.isFinite(days) || days <= 0) return null;
	const months = days / 30.44;
	if (months < 1) return `${Math.round(days)} days`;
	if (months < 24) return `${Math.round(months)} months`;
	return `${(months / 12).toFixed(1)} years`;
}
