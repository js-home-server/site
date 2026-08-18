/* How readings are written down. One place, so the same quantity is never
   spelled two ways on the same page. Every one of these answers an em dash for a
   number it has not got, so a caller never has to guard a reading before writing
   it down. */

/* A percentage as a share of a whole: between nothing and all of it, or nothing at
   all where there is no reading. What is drawn as a ring or a bar has to be one of
   those, whatever the API says. */
export const share = (v) => (Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null);

/* Whole percentages, except under one: pressure runs in hundredths of a percent,
   and rounding every reading of it to 0% would print the same figure for a machine
   that is stalling and one that is idle. Zero stays zero. */
export const pct = (v) => {
	if (!Number.isFinite(v)) return '—';
	if (v !== 0 && Math.abs(v) < 0.01) return '<0.01%';
	return v !== 0 && Math.abs(v) < 1 ? `${v.toFixed(2)}%` : `${Math.round(v)}%`;
};

export const degrees = (v) => (Number.isFinite(v) ? `${Math.round(v)}°C` : '—');

/* A clock offset, at the precision a clock is actually disciplined to:
   microseconds. Always signed, because which side of the reference it sits on is
   half the reading. */
export const microseconds = (v) =>
	Number.isFinite(v) ? `${v < 0 ? '−' : '+'}${Math.round(Math.abs(v) * 1e6)} µs` : '—';

/* The same quantity unsigned, for the ones that have no side to be on — a
   dispersion or a delay is a width, not a direction. In the same unit as the
   offsets, because the whole point of reading them together is that a path a
   hundred times the machine's own error is a path worth noticing. */
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

/* How long, in the two units that read at that distance: a machine up for a
   fortnight is not read in minutes, and one up for an hour is not read in days.
   The smaller unit is padded so a column of these does not jump about as it
   crosses ten. */
export function duration(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return '—';

	const pad = (n) => String(n).padStart(2, '0');
	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor(seconds / 3600) % 24;

	if (days) return `${days}d ${pad(hours)}h`;
	return hours ? `${hours}h ${pad(Math.floor(seconds / 60) % 60)}m` : `${Math.floor(seconds / 60)}m`;
}

const GB = 2 ** 30;
const TB = 2 ** 40;

/* Sizes to the precision the number deserves: two decimals once a figure is
   small enough for them to mean something, one below that. */
export function bytes(n) {
	if (!Number.isFinite(n)) return '—';
	if (n >= TB) return `${(n / TB).toFixed(2)} TB`;
	if (n >= GB) return `${(n / GB).toFixed(1)} GB`;
	return `${(n / 2 ** 20).toFixed(0)} MB`;
}

/* A rate, signed: a volume that is emptying is as much a fact as one filling.
   Small rates drop to MB, because a headline made of this figure has to be
   checkable against it — 0.1577 GB/day printed as 0.2 puts the date it implies
   eight months out. */
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

/* When a reading was taken, as the API stamped it. UTC, because that is the
   clock the server keeps: a page read from another zone would otherwise show a
   time the logs do not use. */
export function stamp(iso) {
	const at = new Date(iso ?? NaN);
	return Number.isNaN(+at) ? '—' : `${at.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

/* How long until it is full, in the unit that reads best at that distance. A
   volume that is not filling has no answer, and says so rather than quoting an
   infinity. */
export function untilFull(days) {
	if (!Number.isFinite(days) || days <= 0) return null;
	const months = days / 30.44;
	if (months < 1) return `${Math.round(days)} days`;
	if (months < 24) return `${Math.round(months)} months`;
	return `${(months / 12).toFixed(1)} years`;
}
