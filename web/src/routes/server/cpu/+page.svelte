<script>
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { degrees, pct } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { server } from '$lib/server.svelte.js';
	import { bucket, last, mean, percentile } from '$lib/stats.js';

	/* Columns in the heatmap. The series is 24h at five-minute steps, so this is
	   about a quarter-hour a cell — fine enough to see a spike, coarse enough
	   that a cell is still a cell rather than a hairline. */
	const HEAT_COLUMNS = 72;

	let series = $derived(server.series);

	/* Per-core utilisation as a map: one row a core, one cell a bucket, straight
	   off the same 0-100% scale the trace is drawn against. */
	let cores = $derived(
		Object.entries(series?.cpuPerCorePercent ?? {})
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([id, points]) => ({
				id: `C${id}`,
				now: pct(last(points)),
				cells: bucket(points, HEAT_COLUMNS)
			}))
	);

	/* Five figures over the window a series covers: the shape a reading took,
	   not just where it stands now. Every formatter already writes a
	   non-finite number as an em dash, so an empty series needs no guard of
	   its own here -- min/max of nothing is +-Infinity, mean and percentile of
	   nothing are NaN, and all three print the same dash the rest of the page
	   uses for "no history yet". */
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

	let cpuStats = $derived([
		{ label: 'Usage (%)', tone: 'var(--mint)', row: statsRow(series?.cpuPercent, pct) },
		{ label: 'Pressure (%)', tone: 'var(--coral)', row: statsRow(series?.cpuPressurePercent, pct) },
		{
			label: 'Temperature (°C)',
			tone: 'var(--amber)',
			row: statsRow(series?.cpuTemperatureC, degrees)
		}
	]);
</script>

<svelte:head>
	<title>CPU — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<!-- Top-left 2x2: Usage, swapped up from row 4 — .fill is what actually
	     stretches the trace down to the box's full height rather than leaving
	     the bottom of a 2x2 blank under a chart sized for a single row. -->
	<div class="box fill" style={gridArea({ col: 1, row: 1, w: 2, h: 2 })}>
		<Panel label="CPU Usage (%)">
			<Trace
				lines={[{ id: 'usage', points: series?.cpuPercent, tone: 'var(--mint)' }]}
				domain={[0, 100]}
				format={pct}
			/>
		</Panel>
	</div>

	<!-- Top-right, upper half: Temperature, dropped from 2x2 to 2x1 — Pressure
	     now takes the half of that square this left behind, so the two long
	     horizontal boxes read as a stack rather than the square they used to
	     share. -->
	<div class="box" style={gridArea({ col: 3, row: 1, w: 2 })}>
		<!-- Not zero-based like usage and pressure: nothing here runs near an
		     ambient 0°C, so the bottom 40° of the axis would be empty and the
		     trace flat against the top of it. -->
		<Panel label="CPU Temperature (°C)">
			<Trace
				lines={[{ id: 'temperature', points: series?.cpuTemperatureC, tone: 'var(--amber)' }]}
				domain={[40, 100]}
				format={degrees}
				marks={[60, 80]}
			/>
		</Panel>
	</div>

	<!-- Top-right, lower half: Pressure, moved up from row 3 into the 2x1
	     Temperature's shrink just opened. -->
	<div class="box" style={gridArea({ col: 3, row: 2, w: 2 })}>
		<!-- Sustained pressure is the reading that matters rather than any one
		     spike, so the rules are the two levels worth seeing a trace cross. -->
		<Panel label="CPU Pressure (%)">
			<Trace
				lines={[{ id: 'pressure', points: series?.cpuPressurePercent, tone: 'var(--coral)' }]}
				domain={[0, 100]}
				format={pct}
				marks={[25, 50]}
			/>
		</Panel>
	</div>

	<!-- Bottom-left 2x2: Per Core Usage, up from a 2x1 in row 4 — .fill
	     stretches the map to the full box the same way Usage already fills
	     its own 2x2 above it. -->
	<div class="box fill" style={gridArea({ col: 1, row: 3, w: 2, h: 2 })}>
		<Panel label="Per Core Usage">
			<Heatmap rows={cores} format={pct} note="no per-core history yet" />
		</Panel>
	</div>

	<!-- Bottom-right 2x2: unchanged. -->
	<StatsTable rows={cpuStats} col={3} row={3} w={2} h={2} />
</div>
