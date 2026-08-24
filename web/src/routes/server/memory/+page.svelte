<script>
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Stack from '$lib/components/Stack.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { pct } from '$lib/format.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { mean, percentile } from '$lib/stats.js';

	let series = $derived(server.series);

	/* How the machine's memory is divided, as three shares of the whole. */
	let ram = $derived(memoryBands(series));

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

	/* The three bands History stacks, read the same way as any other share, plus
	   the two lines Pressure draws -- one row a series, same as CPU's table. */
	let memoryStats = $derived([
		{
			label: 'Used (%)',
			tone: 'var(--mint)',
			row: statsRow(ram.find((band) => band.id === 'used')?.points, pct)
		},
		{
			label: 'Cache (%)',
			tone: 'var(--violet)',
			row: statsRow(ram.find((band) => band.id === 'cache')?.points, pct)
		},
		{
			label: 'Free (%)',
			tone: 'var(--azure)',
			row: statsRow(ram.find((band) => band.id === 'free')?.points, pct)
		},
		{
			label: 'Pressure Some (%)',
			tone: 'var(--amber)',
			row: statsRow(series?.memoryPressureSomePercent, pct)
		},
		{
			label: 'Pressure Full (%)',
			tone: 'var(--coral)',
			row: statsRow(series?.memoryPressureFullPercent, pct)
		}
	]);
</script>

<svelte:head>
	<title>Memory — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box span-3">
		<!-- Used, cache and free, which is how the memory is actually divided: the
		     cache is the part the machine would give back under pressure. -->
		<Panel label="Memory History">
			<Stack bands={ram} note="no memory history yet" />
		</Panel>
	</div>

	<div class="box span-3">
		<!-- No domain: this reading lives in hundredths of a percent, so the scale
		     is the range it covered rather than the 0-100 a share could take. Some
		     is any task waiting on memory, full is every task waiting at once —
		     the second is the one that means the machine stopped. -->
		<Panel label="Memory Pressure (%)">
			<Trace
				lines={[
					{ id: 'some', points: series?.memoryPressureSomePercent, tone: 'var(--amber)', label: 'Some' },
					{ id: 'full', points: series?.memoryPressureFullPercent, tone: 'var(--coral)', label: 'Full', dashed: true }
				]}
				format={pct}
			/>
		</Panel>
	</div>

	<StatsTable rows={memoryStats} />

	{#each Array(13) as _, i (i)}
		<div class="box span-3"><Placeholder note="—" lines={6} /></div>
	{/each}
</div>
