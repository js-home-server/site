<script>
	import AsciiClock from '$lib/components/AsciiClock.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spread from '$lib/components/Spread.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { microseconds } from '$lib/format.js';
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
	<div class="box span-3">
		<!-- The bar is what each source admits it could be wrong by, so a short
		     one is a source worth following. They agree on the offset to a
		     fraction of a millisecond and differ sevenfold on their confidence,
		     which is the whole reading. -->
		<Panel label="Source Offsets">
			<Spread rows={offsets} format={microseconds} note="no time sources reported" />
		</Panel>
	</div>

	<div class="box span-3">
		<!-- Decorative: the figures beside it above already say what time it is,
		     down to the microsecond this page is all about. -->
		<Panel label="UTC">
			<div class="clock-box" aria-hidden="true"><AsciiClock /></div>
		</Panel>
	</div>

	<div class="box span-3">
		<Panel label="Offset History">
			<Trace
				lines={[{ id: 'offset', points: clockHistory, tone: 'var(--azure)', area: false }]}
				domain={[-clockLimit, clockLimit]}
				marks={[0]}
				format={microseconds}
			/>
		</Panel>
	</div>

	<StatsTable rows={timeStats} />

	{#each Array(12) as _, i (i)}
		<div class="box span-3"><Placeholder note="—" lines={6} /></div>
	{/each}
</div>

<style>
	/* Centred vertically in its panel rather than pinned to the top, the way
	   Spread's rows fill theirs beside it -- but full width, not centred on
	   that axis too: AsciiClock sizes its own digits off this box's width, so
	   shrinking it to its content would leave the width it measures against
	   circular. */
	.clock-box {
		display: grid;
		flex: 1;
		align-items: center;
		min-height: 7rem;
	}
</style>
