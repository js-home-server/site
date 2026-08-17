/* What the dashboard knows about memory, worked out from the series the API
   carries. The bands are what a machine's memory is actually doing: what is
   spoken for, what is holding a cache it would give up, and what is free either
   way. */
import { last } from './stats.js';

/* Cache sits inside available, not beside it: node_exporter counts the
   reclaimable page cache as memory you can have, so used + cache + available
   comes to more than the machine has. Free is therefore available less the
   cache, and the three bands add up to the whole. */
export function memoryBands(history) {
	const total = history?.memoryTotalBytes;
	const used = history?.memoryUsedBytes;
	const cache = history?.memoryCachedBytes;

	/* Stacked by index, so the three have to be the same series read three ways —
	   which they are when they came from one response, and are not worth guessing
	   at when they did not. */
	if (!total?.length || used?.length !== total.length || cache?.length !== total.length) return [];

	const share = (series, i) => (series[i][1] / total[i][1]) * 100;
	const band = (id, label, tone, at, nowBytes) => ({
		id,
		label,
		tone,
		nowBytes,
		points: total.map(([t], i) => [t, at(i)])
	});

	const totalNow = last(total);

	return [
		band('used', 'Used', 'var(--mint)', (i) => share(used, i), last(used)),
		band('cache', 'Cache', 'var(--violet)', (i) => share(cache, i), last(cache)),
		band(
			'free',
			'Free',
			'var(--azure)',
			(i) => 100 - share(used, i) - share(cache, i),
			totalNow === null ? null : totalNow - last(used) - last(cache)
		)
	];
}
