<script>
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { rate } from '$lib/format.js';
	import { server } from '$lib/server.svelte.js';
	import { mean, percentile, summarise } from '$lib/stats.js';

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);

	const reading = (key, format) => format(snapshot?.[key]);
	const ms = (v) => (Number.isFinite(v) ? `${Math.round(v)} ms` : '—');

	let rx = $derived(series?.networkReceiveBytesPerSecond ?? []);
	let tx = $derived(series?.networkTransmitBytesPerSecond ?? []);

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

	/* The two lines Throughput draws, plus the probe latency beside it -- rx and
	   tx keep the same tones they draw in up there. */
	let networkStats = $derived([
		{ label: 'RX', tone: 'var(--azure)', row: statsRow(rx, rate) },
		{ label: 'TX', tone: 'var(--violet)', row: statsRow(tx, rate) },
		{ label: 'Latency', tone: 'var(--azure)', row: statsRow(series?.latencyMs, ms) }
	]);
</script>

<svelte:head>
	<title>Network — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box span-3">
		<Panel label="Throughput">
			<Trace
				lines={[
					{ id: 'rx', points: rx, tone: 'var(--azure)', label: 'RX' },
					{ id: 'tx', points: tx, tone: 'var(--violet)', label: 'TX' }
				]}
				format={rate}
			/>
		</Panel>
	</div>

	<div class="box span-3">
		<Panel label="HTTP Probe Latency">
			<p class="latency-reading">
				<strong>{reading('latencyMs', ms)}</strong><span>P95 {summarise(series?.latencyMs, ms)[2][1]}</span>
			</p>
			<Trace lines={[{ id: 'latency', points: series?.latencyMs, tone: 'var(--azure)' }]} format={ms} />
		</Panel>
	</div>

	<StatsTable rows={networkStats} />

	{#each Array(13) as _, i (i)}
		<div class="box span-3"><Placeholder note="—" lines={6} /></div>
	{/each}
</div>

<style>
	/* Set apart from the rest of the panel's own type: this is a live reading,
	   not a label, so it wears the mono face every figure on the page does. */
	.latency-reading strong {
		font-family: var(--font-mono);
		font-size: 1.45rem;
		color: var(--violet);
	}

	/* The unit belongs to the number, so it sits on its baseline rather than
	   under it. */
	.latency-reading {
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
		margin: 0;
	}

	.latency-reading span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.6rem;
	}
</style>
