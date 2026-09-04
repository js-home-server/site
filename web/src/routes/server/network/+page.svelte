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

	/* Tail of the window — says whether the link is reliable, not just where it is now. */
	let latencyP95 = $derived(ms(percentile(values(series?.availability.latency_ms), 0.95)));

	/* Same tones as the Throughput trace above. */
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
	/* Same face/size as every dashboard headline (.figure, app.css) — azure matches the trace under it. */
	.latency-reading strong {
		color: var(--azure);
		font-size: var(--fs-h2);
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
		font-size: var(--fs-xs);
	}
</style>
