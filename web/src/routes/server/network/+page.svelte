<script>
	import Panel from '$lib/components/Panel.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { ms, rate } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { server } from '$lib/server.svelte.js';
	import { percentile, statsRow, values } from '$lib/stats.js';

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);

	let rx = $derived(series?.network.receive_bytes_per_second ?? []);
	let tx = $derived(series?.network.transmit_bytes_per_second ?? []);

	/* The tail of the probe's own window, which is the reading that says whether
	   the link is reliable — the headline beside it only says where it is now. */
	let latencyP95 = $derived(ms(percentile(values(series?.availability.latency_ms), 0.95)));

	/* The two lines Throughput draws, plus the probe latency beside it — rx and
	   tx keep the same tones they draw in up there. */
	let networkStats = $derived([
		{ label: 'RX', tone: 'var(--azure)', row: statsRow(rx, rate) },
		{ label: 'TX', tone: 'var(--violet)', row: statsRow(tx, rate) },
		{ label: 'Latency', tone: 'var(--azure)', row: statsRow(series?.availability.latency_ms, ms) }
	]);
</script>

<svelte:head>
	<title>Network — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box fill" style={gridArea({ col: 1, row: 1, w: 2, h: 2 })}>
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

	<div class="box fill" style={gridArea({ col: 3, row: 1, w: 2, h: 2 })}>
		<Panel label="HTTP Probe Latency">
			<p class="latency-reading">
				<strong>{ms(snapshot?.availability.latency_ms)}</strong><span>P95 {latencyP95}</span>
			</p>
			<Trace
				lines={[{ id: 'latency', points: series?.availability.latency_ms, tone: 'var(--azure)' }]}
				format={ms}
			/>
		</Panel>
	</div>

	<StatsTable rows={networkStats} col={1} row={3} w={4} h={2} />
</div>

<style>
	/* Set apart from the rest of the panel's own type: this is a live reading,
	   not a label, so it wears the mono face every figure on the page does — and
	   the azure the trace under it and the Latency row beside it are drawn in. */
	.latency-reading strong {
		color: var(--azure);
		font-family: var(--font-mono);
		font-size: 1.45rem;
	}

	/* The tail figure belongs to the reading, so it sits on its baseline rather
	   than under it. */
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
