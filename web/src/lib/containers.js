/* What the dashboard knows about the containers, worked out from the list the
   snapshot carries: the fleet in three numbers, and each container as its name,
   its state, and the resources it is drawn against. Written out here rather than
   in the page for the same reason memory and the volumes are — the markup's job
   is the shape of the box, not what goes in it. */
import { bytes, duration, pct } from './format.js';

/* Docker's own words for a container that is doing its job. Anything else —
   exited, restarting, unhealthy — is not. */
const operational = (status) => status === 'healthy' || status === 'running';

/* A limit nobody set is not a limit of zero: the container may have the whole
   machine. It says so, and the bar under it stays empty, because there is no
   share to draw of an unbounded allowance. */
const allocation = (value, format) => (Number.isFinite(value) ? format(value) : 'Unlimited');

const cores = (value) =>
	`${Number.isInteger(value) ? value : value.toFixed(1)} ${value === 1 ? 'core' : 'cores'}`;

const fill = (value, limit) =>
	Number.isFinite(value) && Number.isFinite(limit) && limit > 0
		? Math.min(100, Math.max(0, (value / limit) * 100))
		: 0;

export function fleet(containers = []) {
	const running = containers.filter((container) => operational(container.status)).length;
	const used = containers.reduce((total, container) => total + (container.memoryBytes ?? 0), 0);

	return {
		running,
		unhealthy: containers.length - running,
		/* Joined by a narrow no-break space, so the figure and its unit stay one
		   reading in a cell too tight to hold them on one line otherwise. */
		memory: bytes(used).replace(' ', ' '),
		slots: containers.map((container) => ({
			name: container.name,
			status: container.status,
			healthy: operational(container.status),
			uptime: duration(container.uptimeSeconds),
			resources: [
				{
					id: 'cpu',
					label: 'CPU',
					tone: 'var(--mint)',
					value: pct(container.cpuPercent),
					limit: allocation(container.cpuLimitCores, cores),
					fill: fill(container.cpuPercent, (container.cpuLimitCores ?? 0) * 100)
				},
				{
					id: 'memory',
					label: 'Memory',
					tone: 'var(--violet)',
					value: bytes(container.memoryBytes),
					limit: allocation(container.memoryLimitBytes, bytes),
					fill: fill(container.memoryBytes, container.memoryLimitBytes)
				}
			]
		}))
	};
}
