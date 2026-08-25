<script>
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spread from '$lib/components/Spread.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { microseconds } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { server } from '$lib/server.svelte.js';
	import { statsRow, values } from '$lib/stats.js';
	import { clockOffsetHistory, spread } from '$lib/time.js';

	/* The smallest offset worth drawing a scale to, and the room left past the
	   largest one: a clock sitting still would otherwise be drawn against a
	   domain of nothing, and one at its limit would touch the frame. */
	const FLOOR = 50e-6;
	const HEADROOM = 1.15;

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);

	/* Every source the clock listens to, as a reading with a bound. */
	let offsets = $derived(spread(snapshot?.time));
	let history = $derived(clockOffsetHistory(series));

	/* Symmetric about zero and rounded up to a whole number of floors, so the
	   axis keeps the same ticks as it grows rather than relabelling every poll. */
	let limit = $derived(
		Math.ceil((Math.max(FLOOR, ...values(history).map(Math.abs)) * HEADROOM) / FLOOR) * FLOOR
	);

	/* Just the one line Offset History draws: Source Offsets beside it is a
	   snapshot of each source's own register, not a series, so it has no window
	   to summarise. */
	let timeStats = $derived([
		{ label: 'Offset', tone: 'var(--azure)', row: statsRow(history, microseconds) }
	]);
</script>

<svelte:head>
	<title>Time — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box" style={gridArea({ col: 1, row: 1, w: 2 })}>
		<Placeholder note="—" lines={6} />
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
		<!-- The bar is what each source admits it could be wrong by, so a short
		     one is a source worth following. They agree on the offset to a
		     fraction of a millisecond and differ sevenfold on their confidence,
		     which is the whole reading. -->
		<Panel label="Source Offsets">
			<Spread rows={offsets} format={microseconds} note="no time sources reported" />
		</Panel>
	</div>

	<div class="box fill" style={gridArea({ col: 3, row: 1, w: 2, h: 3 })}>
		<Panel label="Offset History">
			<Trace
				lines={[{ id: 'offset', points: history, tone: 'var(--azure)', area: false }]}
				domain={[-limit, limit]}
				marks={[0]}
				format={microseconds}
			/>
		</Panel>
	</div>

	<StatsTable rows={timeStats} col={1} row={4} w={4} />
</div>
