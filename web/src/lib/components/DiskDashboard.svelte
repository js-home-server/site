<script>
	import Capacity from './Capacity.svelte';
	import Heatmap from './Heatmap.svelte';
	import Horizon from './Horizon.svelte';
	import Panel from './Panel.svelte';
	import StatsTable from './StatsTable.svelte';
	import Trace from './Trace.svelte';
	import { degrees, pct, rate } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { HEAT_COLUMNS, server } from '$lib/server.svelte.js';
	import { bucket, last, statsRow } from '$lib/stats.js';
	import { volume } from '$lib/storage.js';

	/* One drive's page. nvme and ssd both pass their DISKS entry in rather than duplicating this. */
	let { id, label, tone } = $props();

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month);

	/* Capacity box and horizon are the same object, seen two ways. */
	let vol = $derived(
		volume({
			id,
			label,
			tone,
			used: month?.storage[id].used_bytes,
			available: month?.storage[id].available_bytes,
			percent: month?.storage[id].used_percent
		})
	);

	/* Read/write sit orders of magnitude apart, so the map normalises per row — busy vs. idle, not read vs. write. */
	let io = $derived(
		['Read', 'Write']
			.map((direction) => ({
				id: direction,
				tone,
				now: rate(last(series?.storage[id][`${direction.toLowerCase()}_bytes_per_second`])),
				cells: bucket(series?.storage[id][`${direction.toLowerCase()}_bytes_per_second`], HEAT_COLUMNS)
			}))
			.filter((lane) => lane.cells.length)
	);

	/* How full it ran, how hot, and its two lanes — the same split the charts
	   above the table already draw. */
	let stats = $derived([
		{ label: 'Used (%)', tone, row: statsRow(series?.storage[id].used_percent, pct) },
		{ label: 'Temperature (°C)', tone, row: statsRow(series?.storage[id].temperature_c, degrees) },
		{ label: 'Read', tone, row: statsRow(series?.storage[id].read_bytes_per_second, rate) },
		{ label: 'Write', tone, row: statsRow(series?.storage[id].write_bytes_per_second, rate) }
	]);
</script>

<div class="grid">
	<div class="box" style={gridArea({ col: 1, row: 1, w: 2 })}>
		<Panel label="Capacity">
			<Capacity {label} percent={vol.percentNow ?? snapshot?.storage[id].used_percent} {tone} />
		</Panel>
	</div>

	<div class="box" style={gridArea({ col: 3, row: 1, w: 2, h: 2 })}>
		<!-- Bounded to this drive's own floor/projection, not a fixed 0-100% — reads its own slope instead of fighting for room. -->
		<Horizon volume={vol} label="Used Space History &amp; Projection" />
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
		<!-- Same fixed floor as the CPU's trace — nothing here runs near ambient either. -->
		<Panel label="Temperature (°C)">
			<Trace
				lines={[{ id: 'temperature', points: series?.storage[id].temperature_c, tone }]}
				domain={[20, 90]}
				format={degrees}
				marks={[50, 70]}
			/>
		</Panel>
	</div>

	<StatsTable rows={stats} col={3} row={3} w={2} h={2} />

	<div class="box" style={gridArea({ col: 1, row: 4, w: 2 })}>
		<Panel label="I/O Pulse">
			<!-- Stretched to this drive's busiest quarter-hour — the key quotes that lane's own floor/ceiling. -->
			<Heatmap rows={io} normalise="row" format={rate} note="no io history yet" />
		</Panel>
	</div>
</div>
