/* What the dashboard knows about memory: what's spoken for, what's cache it'd give up, and what's free. */
import { last } from './stats.js';

/* Cache sits inside available, not beside it — node_exporter counts reclaimable
   page cache as available, so used+cache+available overcounts. Free = available minus cache. */
export function memoryBands(history) {
	const total = history?.memory.total_bytes;
	const used = history?.memory.used_bytes;
	const cache = history?.memory.cached_bytes;

	/* Stacked by index — only valid when all three came from the same response. */
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
