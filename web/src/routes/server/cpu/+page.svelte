<script>
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { degrees, pct } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { HEAT_COLUMNS, server } from '$lib/server.svelte.js';
	import { bucket, last, statsRow } from '$lib/stats.js';

	let series = $derived(server.series);

	/* Per-core utilisation as a map: one row a core, one cell a bucket, straight
	   off the same 0-100% scale the traces are drawn against. */
	let cores = $derived(
		Object.entries(series?.cpu.per_core_percent ?? {})
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([id, points]) => ({
				id: `C${id}`,
				now: pct(last(points)),
				cells: bucket(points, HEAT_COLUMNS)
			}))
	);

	let cpuStats = $derived([
		{ label: 'Usage (%)', tone: 'var(--mint)', row: statsRow(series?.cpu.percent, pct) },
		{ label: 'Pressure (%)', tone: 'var(--coral)', row: statsRow(series?.cpu.pressure_percent, pct) },
		{
			label: 'Temperature (°C)',
			tone: 'var(--amber)',
			row: statsRow(series?.cpu.temperature_c, degrees)
		}
	]);
</script>

<svelte:head>
	<title>CPU — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box fill" style={gridArea({ col: 1, row: 1, w: 2, h: 2 })}>
		<Panel label="CPU Usage (%)">
			<Trace
				lines={[{ id: 'usage', points: series?.cpu.percent, tone: 'var(--mint)' }]}
				domain={[0, 100]}
				format={pct}
			/>
		</Panel>
	</div>

	<div class="box" style={gridArea({ col: 3, row: 1, w: 2 })}>
		<!-- Not zero-based like usage and pressure: nothing here runs near an
		     ambient 0°C, so the bottom 40° of the axis would be empty and the
		     trace flat against the top of it. -->
		<Panel label="CPU Temperature (°C)">
			<Trace
				lines={[{ id: 'temperature', points: series?.cpu.temperature_c, tone: 'var(--amber)' }]}
				domain={[40, 100]}
				format={degrees}
				marks={[60, 80]}
			/>
		</Panel>
	</div>

	<div class="box" style={gridArea({ col: 3, row: 2, w: 2 })}>
		<!-- Sustained pressure is the reading that matters rather than any one
		     spike, so the rules are the two levels worth seeing a trace cross. -->
		<Panel label="CPU Pressure (%)">
			<Trace
				lines={[{ id: 'pressure', points: series?.cpu.pressure_percent, tone: 'var(--coral)' }]}
				domain={[0, 100]}
				format={pct}
				marks={[25, 50]}
			/>
		</Panel>
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 3, w: 2, h: 2 })}>
		<Panel label="Per Core Usage">
			<Heatmap rows={cores} format={pct} note="no per-core history yet" />
		</Panel>
	</div>

	<StatsTable rows={cpuStats} col={3} row={3} w={2} h={2} />
</div>
