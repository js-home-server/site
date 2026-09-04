/* The fleet in three numbers, each container as name/state/resources. Kept out
   of the page for the same reason memory and volumes are — markup's job is the box shape, not what fills it. */
import { bytes, duration, pct } from './format.js';

/* Docker's own words for a container that is doing its job. Anything else —
   exited, restarting, unhealthy — is not. */
const operational = (status) => status === 'healthy' || status === 'running';

/* No limit set ≠ a limit of zero — says "Unlimited" and leaves the bar empty, since there's no share to draw of an unbounded allowance. */
const allocation = (value, format) => (Number.isFinite(value) ? format(value) : 'Unlimited');

const cores = (value) =>
	`${Number.isInteger(value) ? value : value.toFixed(1)} ${value === 1 ? 'core' : 'cores'}`;

const fill = (value, limit) =>
	Number.isFinite(value) && Number.isFinite(limit) && limit > 0
		? Math.min(100, Math.max(0, (value / limit) * 100))
		: 0;

export function fleet(containers = []) {
	const running = containers.filter((container) => operational(container.status)).length;
	const used = containers.reduce((total, container) => total + (container.memory_bytes ?? 0), 0);

	return {
		running,
		unhealthy: containers.length - running,
		/* No-break space so the figure and unit stay one reading in a tight cell. */
		memory: bytes(used).replace(' ', ' '),
		slots: containers.map((container) => ({
			name: container.name,
			status: container.status,
			healthy: operational(container.status),
			uptime: duration(container.uptime_seconds),
			/* Table column order — each entry is a reading + its allowance, filling two cells. */
			resources: [
				{
					id: 'cpu',
					tone: 'var(--mint)',
					value: pct(container.cpu_percent),
					limit: allocation(container.cpu_limit_cores, cores),
					fill: fill(container.cpu_percent, (container.cpu_limit_cores ?? 0) * 100)
				},
				{
					id: 'memory',
					tone: 'var(--violet)',
					value: bytes(container.memory_bytes),
					limit: allocation(container.memory_limit_bytes, bytes),
					fill: fill(container.memory_bytes, container.memory_limit_bytes)
				}
			]
		}))
	};
}
