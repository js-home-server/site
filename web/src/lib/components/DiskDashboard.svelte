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

	/* One drive's whole page. nvme and ssd are the same shape twice over, so
	   they pass their entry from $lib/storage.js's DISKS in rather than each
	   writing this out: `id` is the prefix the drive's own series are named
	   with, `tone` the colour it is drawn in. */
	let { id, label, tone } = $props();

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month);

	/* Where the drive stands, which way it is going, and when that runs out.
	   The capacity box and the horizon are the same object seen two ways. */
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

	/* Read and write, a lane apiece. The two sit orders of magnitude apart, so
	   the map normalises per row: a lane says when that stream was busy, not how
	   it compares to the one under it. */
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
		<!-- Bounded to this drive's own floor and year-out projection rather than
		     a fixed 0-100%, so the chart reads its own slope rather than fighting
		     the whole drive for room. Fills its box on its own. -->
		<Horizon volume={vol} label="Used Space History &amp; Projection" />
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
		<!-- Same fixed floor as the CPU's temperature trace: nothing here runs
		     near ambient either. -->
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
			<!-- Stretched to this drive's own busiest quarter-hour, so the key
			     quotes that lane's own floor and ceiling in bytes a second. -->
			<Heatmap rows={io} normalise="row" format={rate} note="no io history yet" />
		</Panel>
	</div>
</div>
