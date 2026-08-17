/* How readings are written down. One place, so the same quantity is never
   spelled two ways on the same page. Every one of these answers an em dash for a
   number it has not got, so a caller never has to guard a reading before writing
   it down. */

/* Whole percentages, except under one: pressure runs in hundredths of a percent,
   and rounding every reading of it to 0% would print the same figure for a machine
   that is stalling and one that is idle. Zero stays zero. */
export const pct = (v) => {
	if (!Number.isFinite(v)) return '—';
	return v !== 0 && Math.abs(v) < 1 ? `${v.toFixed(2)}%` : `${Math.round(v)}%`;
};

export const degrees = (v) => (Number.isFinite(v) ? `${Math.round(v)}°C` : '—');

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
