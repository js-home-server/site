<script>
	import Panel from '$lib/components/Panel.svelte';
	import Stack from '$lib/components/Stack.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { pct } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { statsRow } from '$lib/stats.js';

	let series = $derived(server.series);

	/* How the machine's memory is divided, as three shares of the whole. */
	let ram = $derived(memoryBands(series));

	const band = (id) => ram.find((b) => b.id === id)?.points;

	/* One row per series, same shape as CPU's table. */
	let memoryStats = $derived([
		{ label: 'Used (%)', tone: 'var(--mint)', row: statsRow(band('used'), pct) },
		{ label: 'Cache (%)', tone: 'var(--violet)', row: statsRow(band('cache'), pct) },
		{ label: 'Free (%)', tone: 'var(--azure)', row: statsRow(band('free'), pct) },
		{
			label: 'Pressure Some (%)',
			tone: 'var(--amber)',
			row: statsRow(series?.memory.pressure_some_percent, pct)
		},
		{
			label: 'Pressure Full (%)',
			tone: 'var(--coral)',
			row: statsRow(series?.memory.pressure_full_percent, pct)
		}
	]);
</script>

<svelte:head>
	<title>Memory — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box fill" style={gridArea({ col: 1, row: 1, w: 4, h: 2 })}>
		<!-- Cache is the part the machine would give back under pressure. -->
		<Panel label="Memory History">
			<Stack bands={ram} note="no memory history yet" />
		</Panel>
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 3, w: 2, h: 2 })}>
		<!-- No domain — lives in hundredths of a percent, so scale is the range covered, not 0-100. "Full" (every task waiting) is the one that means the machine stopped. -->
		<Panel label="Memory Pressure (%)">
			<Trace
				lines={[
					{
						id: 'some',
						points: series?.memory.pressure_some_percent,
						tone: 'var(--amber)',
						label: 'Some'
					},
					{
						id: 'full',
						points: series?.memory.pressure_full_percent,
						tone: 'var(--coral)',
						label: 'Full',
						dashed: true
					}
				]}
				format={pct}
			/>
		</Panel>
	</div>

	<StatsTable rows={memoryStats} col={3} row={3} w={2} h={2} />
</div>
