<script>
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spread from '$lib/components/Spread.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { microseconds } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { server } from '$lib/server.svelte.js';
	import { mean, percentile } from '$lib/stats.js';
	import { spread } from '$lib/time.js';

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);

	/* The clock, and every source it listens to as a reading with a bound. */
	let clock = $derived(snapshot?.time);
	let offsets = $derived(spread(clock));

	/* Chrony reports the correction needed to reach NTP: a negative correction
	   means this machine is fast. Flip it here so positive reads naturally as
	   PHOBOS ahead and negative as PHOBOS behind. */
	let clockHistory = $derived(
		(series?.timeSystemOffsetSeconds ?? []).map(([time, offset]) => [time, -offset])
	);
	let clockLimit = $derived.by(() => {
		const greatest = Math.max(50e-6, ...clockHistory.map((point) => Math.abs(point[1])));
		return Math.ceil((greatest * 1.15) / 50e-6) * 50e-6;
	});

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

	/* Just the one line Offset History draws: Source Offsets beside it is a
	   snapshot of each source's own register, not a series, so it has no window
	   to summarise. */
	let timeStats = $derived([
		{ label: 'Offset', tone: 'var(--azure)', row: statsRow(clockHistory, microseconds) }
	]);
</script>

<svelte:head>
	<title>Time — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<!-- Left column, row 1: blank, standing over Offsets the way History's
	     own 2x3 used to run the full height beside it. -->
	<div class="box" style={gridArea({ col: 1, row: 1, w: 2 })}>
		<Placeholder note="—" lines={6} />
	</div>

	<!-- Left column, rows 2-3: Source Offsets, shrunk from a 2x3 to a 2x2 to
	     make room for the blank above it — .fill stretches Spread's own rows
	     down the box's full height. -->
	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
		<!-- The bar is what each source admits it could be wrong by, so a short
		     one is a source worth following. They agree on the offset to a
		     fraction of a millisecond and differ sevenfold on their confidence,
		     which is the whole reading. -->
		<Panel label="Source Offsets">
			<Spread rows={offsets} format={microseconds} note="no time sources reported" />
		</Panel>
	</div>

	<!-- Right 2x3: Offset History, the same. -->
	<div class="box fill" style={gridArea({ col: 3, row: 1, w: 2, h: 3 })}>
		<Panel label="Offset History">
			<Trace
				lines={[{ id: 'offset', points: clockHistory, tone: 'var(--azure)', area: false }]}
				domain={[-clockLimit, clockLimit]}
				marks={[0]}
				format={microseconds}
			/>
		</Panel>
	</div>

	<!-- Row 4, full width: Stats. -->
	<StatsTable rows={timeStats} col={1} row={4} w={4} />
</div>
