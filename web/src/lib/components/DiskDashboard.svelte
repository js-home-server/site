<script>
	import Capacity from './Capacity.svelte';
	import Heatmap from './Heatmap.svelte';
	import Horizon from './Horizon.svelte';
	import Panel from './Panel.svelte';
	import StatsTable from './StatsTable.svelte';
	import Trace from './Trace.svelte';
	import { degrees, pct, rate } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { server } from '$lib/server.svelte.js';
	import { bucket, last, mean, percentile } from '$lib/stats.js';
	import { volume } from '$lib/storage.js';

	/* One drive's whole tab: nvme and ssd are two routes rendering this same
	   shape rather than each writing it out — the id is the prefix every one
	   of the drive's own series is named with, tone is its colour everywhere
	   it turns up. */
	let { id, label, tone } = $props();

	/* Columns in the heatmap. The series is 24h at five-minute steps, so this is
	   about a quarter-hour a cell — fine enough to see a spike, coarse enough
	   that a cell is still a cell rather than a hairline. */
	const HEAT_COLUMNS = 72;

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
			used: month?.[`${id}UsedBytes`],
			available: month?.[`${id}AvailableBytes`],
			percent: month?.[`${id}Percent`]
		})
	);

	/* Read and write, a lane apiece of the drive's own pulse map — the two sit
	   orders of magnitude apart, so the map normalises per row: a lane says
	   when that stream was busy, not how it compares to the one under it. */
	let io = $derived(
		['Read', 'Write']
			.map((direction) => {
				const points = series?.[`${id}${direction}BytesPerSecond`];
				return {
					id: direction,
					tone,
					now: rate(last(points)),
					cells: bucket(points, HEAT_COLUMNS)
				};
			})
			.filter((lane) => lane.cells.length)
	);

	const statsRow = (points, format) => {
		const values = (points ?? []).map((p) => p[1]);
		return [
			format(Math.min(...values)),
			format(percentile(values, 0.5)),
			format(mean(values)),
			format(percentile(values, 0.95)),
			format(Math.max(...values))
		];
	};

	/* How full it ran, how hot, and its two lanes — the same split the
	   temperature trace and the io pulse beside it already draw. */
	let stats = $derived([
		{ label: 'Used (%)', tone, row: statsRow(series?.[`${id}Percent`], pct) },
		{ label: 'Temperature (°C)', tone, row: statsRow(series?.[`${id}TemperatureC`], degrees) },
		{ label: 'Read', tone, row: statsRow(series?.[`${id}ReadBytesPerSecond`], rate) },
		{ label: 'Write', tone, row: statsRow(series?.[`${id}WriteBytesPerSecond`], rate) }
	]);
</script>

<div class="grid">
	<!-- Top-left quadrant, upper half: Capacity, unchanged. -->
	<div class="box" style={gridArea({ col: 1, row: 1, w: 2 })}>
		<Panel label="Capacity">
			<Capacity {label} percent={vol.percentNow ?? snapshot?.[`${id}Percent`]} {tone} />
		</Panel>
	</div>

	<!-- Top-right 2x2: Horizon/Projection, swapped up from the left 2x2 —
	     already fills its own box (Horizon's own height: 100%) without
	     needing .fill. -->
	<div class="box" style={gridArea({ col: 3, row: 1, w: 2, h: 2 })}>
		<!-- Bounded to this disk's own floor and year-out projection rather than
		     a fixed 0-100%, so the chart reads its own slope rather than fighting
		     the whole drive for room. -->
		<Horizon volume={vol} label="Used Space History &amp; Projection" />
	</div>

	<!-- Left 2x2, rows 2-3: Temperature, swapped down from the top-right —
	     .fill for the same reason Usage needs it on the cpu page: a
	     Panel-wrapped Trace doesn't stretch to its box on its own. -->
	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
		<!-- Same fixed floor as the CPU's temperature trace: nothing here runs
		     near ambient either. -->
		<Panel label="Temperature (°C)">
			<Trace
				lines={[{ id: 'temperature', points: series?.[`${id}TemperatureC`], tone }]}
				domain={[20, 90]}
				format={degrees}
				marks={[50, 70]}
			/>
		</Panel>
	</div>

	<!-- Bottom-right corner, 2x2: Stats, unchanged. -->
	<StatsTable rows={stats} col={3} row={3} w={2} h={2} />

	<!-- Row 4, left half: I/O Pulse, shrunk from the 2x2 it shared this
	     quadrant with Horizon to make room for Horizon's own return to 2x2. -->
	<div class="box" style={gridArea({ col: 1, row: 4, w: 2 })}>
		<Panel label="I/O Pulse">
			<!-- Read and write, stretched to this disk's own busiest quarter-hour,
			     so the key quotes that lane's own floor and ceiling in bytes a
			     second. -->
			<Heatmap rows={io} normalise="row" format={rate} note="no io history yet" />
		</Panel>
	</div>
</div>
