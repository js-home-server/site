<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { fleet } from '$lib/containers.js';
	import { degrees, gigabytes, microseconds, ms, pct } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { minMax } from '$lib/stats.js';
	import { DISKS, volume } from '$lib/storage.js';
	import { clockOffset, clockOffsetHistory } from '$lib/time.js';

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month ?? server.series);

	/* The one band of the three Memory History stacks that reads as "RAM usage"
	   on its own — the other two, cache and free, are how the rest of it is
	   spent rather than how much of it is. */
	let ramUsed = $derived(memoryBands(series).find((band) => band.id === 'used')?.points ?? []);

	/* Both drives at their current share and size. The pages under nvme and ssd
	   read the same volumes for their own history; only the headline is wanted
	   here. */
	let volumes = $derived(
		DISKS.map((disk) =>
			volume({
				...disk,
				used: month?.storage[disk.id].used_bytes,
				available: month?.storage[disk.id].available_bytes,
				percent: month?.storage[disk.id].used_percent
			})
		)
	);

	let containers = $derived(fleet(snapshot?.containers.items));
	let clockHistory = $derived(clockOffsetHistory(series));
</script>

<svelte:head>
	<title>Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<div class="box">
		<Panel label="Temperature">
			<div class="center">
				<div class="reading">
					<strong class="figure" style:color="var(--amber)">
						{degrees(snapshot?.cpu.temperature_c)}
					</strong>
					<span class="range">{minMax(series?.cpu.temperature_c, degrees)}</span>
				</div>
			</div>
		</Panel>
	</div>

	<div class="box">
		<Panel label="Latency">
			<div class="center">
				<div class="reading">
					<strong class="figure" style:color="var(--azure)">{ms(snapshot?.availability.latency_ms)}</strong>
					<span class="range">{minMax(series?.availability.latency_ms, ms)}</span>
				</div>
			</div>
		</Panel>
	</div>

	<div class="box" style={gridArea({ col: 3, row: 1, w: 2 })}>
		<Panel label="Containers">
			<div class="center">
				<div class="reading">
					<strong class="figure">{containers.running}</strong>
					<span class="eyebrow">Running</span>
				</div>
				<div class="reading" style:color={containers.unhealthy ? 'var(--coral)' : undefined}>
					<strong class="figure">{containers.unhealthy}</strong>
					<span class="eyebrow">Unhealthy</span>
				</div>
			</div>
		</Panel>
	</div>

	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 4, h: 2 })}>
		<Panel label="CPU & RAM Usage (%)">
			<Trace
				lines={[
					{ id: 'cpu', points: series?.cpu.percent, tone: 'var(--mint)', label: 'CPU' },
					{ id: 'ram', points: ramUsed, tone: 'var(--violet)', label: 'RAM' }
				]}
				domain={[0, 100]}
				format={pct}
			/>
		</Panel>
	</div>

	<!-- Both drives at a glance; the pages under nvme and ssd carry the history
	     each of these is a single reading from. -->
	<div class="box fill" style={gridArea({ col: 1, row: 4, w: 2 })}>
		<Panel label="Storage Overview">
			<div class="volumes">
				{#each volumes as vol (vol.id)}
					<div class="volume">
						<div class="volume-name">
							<strong>{vol.label}</strong>
							<span class="eyebrow">
								{gigabytes(vol.usedNow)} / {gigabytes(vol.totalNow)} GB
							</span>
						</div>
						<Capacity
							label={vol.label}
							percent={vol.percentNow ?? snapshot?.storage[vol.id].used_percent}
							tone={vol.tone}
						/>
					</div>
				{/each}
			</div>
		</Panel>
	</div>

	<div class="box">
		<Panel label="Time Offset">
			<div class="center">
				<div class="reading">
					<strong class="figure" style:color="var(--azure)">
						{microseconds(clockOffset(snapshot?.time))}
					</strong>
					<span class="range">{minMax(clockHistory, microseconds)}</span>
				</div>
			</div>
		</Panel>
	</div>

</div>

<style>
	/* Whatever a headline box holds, centred in the room the panel's title
	   leaves it. More than one reading spreads across that room instead. */
	.center {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 1.75rem;
		min-height: 0;
	}

	/* A figure and the label or range under it, as one stack. */
	.reading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	/* Set in the reading's own case rather than the page's small caps: °C, ms
	   and µs are unit symbols and are wrong in any other. */
	.range {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.08em;
	}

	/* .box.fill (Dashboard.svelte) stretches the panel to the box; this is the
	   next link in that chain, so the drives space out down the room they are
	   given rather than stacking at a fixed gap that only fits a tall box. */
	.volumes {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		min-height: 0;
	}

	.volume {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.volume-name {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
</style>
