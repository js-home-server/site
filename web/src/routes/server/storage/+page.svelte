<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Horizon from '$lib/components/Horizon.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import StatsTable from '$lib/components/StatsTable.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { degrees, pct, rate } from '$lib/format.js';
	import { server } from '$lib/server.svelte.js';
	import { bucket, last, mean, percentile } from '$lib/stats.js';
	import { volume } from '$lib/storage.js';

	/* The two drives. One entry each: the id is the prefix every one of their
	   series is named with, and the tone is theirs wherever they appear — capacity
	   box, horizon, io lane. */
	const DISKS = [
		{ id: 'nvme', label: 'NVMe', tone: 'var(--violet)' },
		{ id: 'ssd', label: 'SSD', tone: 'var(--azure)' }
	];

	/* Columns in the heatmaps. The series is 24h at five-minute steps, so this is
	   about a quarter-hour a cell — fine enough to see a spike, coarse enough that
	   a cell is still a cell rather than a hairline. */
	const HEAT_COLUMNS = 72;

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month);

	/* Each volume worked out from its own 30-day series: where it is, which way it
	   is going, and when that runs out. The capacity boxes and the horizon are the
	   same objects seen two ways. */
	let volumes = $derived(
		DISKS.map((disk) =>
			volume({
				...disk,
				used: month?.[`${disk.id}UsedBytes`],
				available: month?.[`${disk.id}AvailableBytes`],
				percent: month?.[`${disk.id}Percent`]
			})
		)
	);

	/* Read and write on each disk, a lane of that disk's own pulse map — the two
	   sit orders of magnitude apart on the same drive, so the map normalises per
	   row: a lane says when that stream was busy, not how it compares to the one
	   under it. Keyed by disk, since each draws in its own column rather than
	   sharing one map between both drives. */
	let ioByDisk = $derived(
		Object.fromEntries(
			DISKS.map(({ id, tone }) => [
				id,
				['Read', 'Write']
					.map((direction) => {
						const points = series?.[`${id}${direction}BytesPerSecond`];
						return {
							id: direction,
							tone,
							now: rate(last(points)),
							cells: bucket(points, HEAT_COLUMNS)
						};
					})
					.filter((lane) => lane.cells.length)
			])
		)
	);

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

	/* One table a drive, the same split the temperature trace and the io pulse
	   beside it already draw: how full it ran, how hot, and its two lanes. */
	let storageStats = $derived(
		Object.fromEntries(
			volumes.map((vol) => [
				vol.id,
				[
					{ label: 'Used (%)', tone: vol.tone, row: statsRow(series?.[`${vol.id}Percent`], pct) },
					{
						label: 'Temperature (°C)',
						tone: vol.tone,
						row: statsRow(series?.[`${vol.id}TemperatureC`], degrees)
					},
					{
						label: 'Read',
						tone: vol.tone,
						row: statsRow(series?.[`${vol.id}ReadBytesPerSecond`], rate)
					},
					{
						label: 'Write',
						tone: vol.tone,
						row: statsRow(series?.[`${vol.id}WriteBytesPerSecond`], rate)
					}
				]
			])
		)
	);
</script>

<svelte:head>
	<title>Storage — Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	{#each volumes as vol (vol.id)}
		<div class="box span-3">
			<Panel label="{vol.label} Capacity">
				<Capacity
					label={vol.label}
					percent={vol.percentNow ?? snapshot?.[`${vol.id}Percent`]}
					tone={vol.tone}
				/>
			</Panel>
		</div>
	{/each}

	{#each volumes as vol (vol.id)}
		<div class="box span-3">
			<!-- Bounded to this disk's own floor and year-out projection rather
			     than a fixed 0-100%, so the two columns read their own slope
			     instead of each fighting the whole drive for room. Fills its box
			     (Horizon's own height: 100%) the same as every other box on the
			     page now stretches to the grid row's height. -->
			<Horizon volume={vol} label="{vol.label} Used Space History &amp; Projection" />
		</div>
	{/each}

	{#each volumes as vol (vol.id)}
		<div class="box span-3">
			<!-- Same fixed floor as the CPU's temperature trace: nothing here
			     runs near ambient either. -->
			<Panel label="{vol.label} Temperature (°C)">
				<Trace
					lines={[{ id: 'temperature', points: series?.[`${vol.id}TemperatureC`], tone: vol.tone }]}
					domain={[20, 90]}
					format={degrees}
					marks={[50, 70]}
				/>
			</Panel>
		</div>
	{/each}

	{#each volumes as vol (vol.id)}
		<div class="box span-3">
			<Panel label="{vol.label} I/O Pulse">
				<!-- Read and write, stretched to this disk's own busiest quarter-hour,
				     so the key quotes that lane's own floor and ceiling in bytes a
				     second. -->
				<Heatmap rows={ioByDisk[vol.id]} normalise="row" format={rate} note="no io history yet" />
			</Panel>
		</div>
	{/each}

	{#each volumes as vol (vol.id)}
		<StatsTable rows={storageStats[vol.id]} />
	{/each}

	{#each Array(6) as _, i (i)}
		<div class="box span-3"><Placeholder note="—" lines={6} /></div>
	{/each}
</div>
