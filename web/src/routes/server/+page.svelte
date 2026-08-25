<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { degrees, microseconds, pct } from '$lib/format.js';
	import { fleet } from '$lib/containers.js';
	import { gridArea } from '$lib/grid.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { volume } from '$lib/storage.js';

	/* The two drives, the same pair the nvme and ssd pages themselves own —
	   just their current share and size here, not the history those go into. */
	const DISKS = [
		{ id: 'nvme', label: 'NVMe', tone: 'var(--violet)' },
		{ id: 'ssd', label: 'SSD', tone: 'var(--azure)' }
	];

	const GB = 2 ** 30;

	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month);

	const reading = (key, format) => format(snapshot?.[key]);
	const ms = (v) => (Number.isFinite(v) ? `${Math.round(v)} ms` : '—');

	/* The window's own floor and ceiling, the same pair the landing page's
	   status bar reads off its own CPU temp card — not the average, since a
	   glance at "now" already has that in the figure above it. */
	const minMax = (points, format) => {
		const values = (points ?? []).map((p) => p[1]);
		return values.length
			? `MIN ${format(Math.min(...values))} · MAX ${format(Math.max(...values))}`
			: 'NO HISTORY YET';
	};

	/* The one band of the three History stacks elsewhere that reads as "RAM
	   usage" on its own — the other two (cache, free) are how the rest of it
	   is spent, not how much of it is spent. */
	let ramUsed = $derived(memoryBands(series).find((band) => band.id === 'used')?.points ?? []);

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

	/* GB throughout rather than format.js's own adaptive bytes(): the two
	   figures in "55.8 / 468.4 GB" have to share one unit to read as a ratio,
	   which an independently-scaled MB/GB/TB pick per side wouldn't. */
	const gb = (n) => (Number.isFinite(n) ? (n / GB).toFixed(1) : '—');

	/* The containers as the fleet and its slots, the same shape the containers
	   page itself reads — only the counts are wanted here. */
	let containerFleet = $derived(fleet(snapshot?.containers));

	/* Chrony reports the correction needed to reach NTP: a negative correction
	   means this machine is fast. Flipped, the same way the time page's own
	   headline and history read it, so positive is ahead everywhere it turns up. */
	let currentClockOffset = $derived(
		Number.isFinite(snapshot?.time?.systemOffsetSeconds) ? -snapshot.time.systemOffsetSeconds : null
	);
	let clockHistory = $derived(
		(series?.timeSystemOffsetSeconds ?? []).map(([t, offset]) => [t, -offset])
	);
</script>

<svelte:head>
	<title>Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	<!-- Row 1: Temperature and Latency, moved up above the graph. -->
	<div class="box" style={gridArea({ col: 1, row: 1 })}>
		<Panel label="Temperature">
			<div class="center">
				<div class="reading-block">
					<strong class="figure" style:color="var(--amber)">{reading('cpuTemperatureC', degrees)}</strong>
					<span class="stats">{minMax(series?.cpuTemperatureC, degrees)}</span>
				</div>
			</div>
		</Panel>
	</div>

	<div class="box" style={gridArea({ col: 2, row: 1 })}>
		<Panel label="Latency">
			<div class="center">
				<div class="reading-block">
					<strong class="figure" style:color="var(--azure)">{reading('latencyMs', ms)}</strong>
					<span class="stats">{minMax(series?.latencyMs, ms)}</span>
				</div>
			</div>
		</Panel>
	</div>

	<!-- Row 1, right half: Containers, the same 2x1 it already was. -->
	<div class="box" style={gridArea({ col: 3, row: 1, w: 2 })}>
		<Panel label="Containers">
			<div class="center">
				<div class="stat-item">
					<strong class="figure">{containerFleet.running}</strong>
					<span class="eyebrow">Running</span>
				</div>
				<div class="stat-item" style:color={containerFleet.unhealthy > 0 ? 'var(--coral)' : undefined}>
					<strong class="figure">{containerFleet.unhealthy}</strong>
					<span class="eyebrow">Unhealthy</span>
				</div>
			</div>
		</Panel>
	</div>

	<!-- Middle 4x2: CPU and RAM usage over the last 24h, dropped below the row
	     Temperature, Latency and Containers now own — .fill stretches the
	     trace down the box's full height. -->
	<div class="box fill" style={gridArea({ col: 1, row: 2, w: 4, h: 2 })}>
		<Panel label="CPU & RAM Usage (%)">
			<Trace
				lines={[
					{ id: 'cpu', points: series?.cpuPercent, tone: 'var(--mint)', label: 'CPU' },
					{ id: 'ram', points: ramUsed, tone: 'var(--violet)', label: 'RAM' }
				]}
				domain={[0, 100]}
				format={pct}
			/>
		</Panel>
	</div>

	<!-- Row 4, left half: Storage Overview, the two bottom-left quarter-cells
	     merged into one — a compact version of the capacity reading the nvme
	     and ssd pages each give a full 2x2 of their own to. -->
	<div class="box fill" style={gridArea({ col: 1, row: 4, w: 2 })}>
		<Panel label="Storage Overview">
			<div class="storage-rows">
				{#each volumes as vol (vol.id)}
					<div class="storage-row">
						<div class="storage-info">
							<strong>{vol.label}</strong>
							<span class="eyebrow">{gb(vol.usedNow)} / {gb(vol.totalNow)} GB</span>
						</div>
						<Capacity label={vol.label} percent={vol.percentNow ?? snapshot?.[`${vol.id}Percent`]} tone={vol.tone} />
					</div>
				{/each}
			</div>
		</Panel>
	</div>

	<div class="box span-3">
		<Panel label="Time Offset">
			<div class="center">
				<div class="reading-block">
					<strong class="figure" style:color="var(--azure)">{microseconds(currentClockOffset)}</strong>
					<span class="stats">{minMax(clockHistory, microseconds)}</span>
				</div>
			</div>
		</Panel>
	</div>

	<!-- Row 4, right corner: Processes, dropped down from row 3. -->
	<div class="box span-3">
		<Panel label="Processes">
			<!-- Not wired up: nothing in the API this reads carries a process
			     count yet, so this holds the shape of it rather than a number. -->
			<Placeholder note="—" lines={4} />
		</Panel>
	</div>
</div>

<style>
	.center {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 1.75rem;
		min-height: 0;
	}

	/* Running and Unhealthy, the two readings Containers puts side by side in
	   the same .center a lone Dial or figure sits centred in on its own. */
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	/* The figure and the min/max under it, stacked in the same .center a bare
	   figure sits centred in on its own. */
	.reading-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	/* Cased by hand rather than by text-transform: a formatted reading (°C, ms)
	   is wrong in any case but its own, and MIN/MAX are the words that want it. */
	.stats {
		color: var(--text-dim);
		font-size: 0.6rem;
		font-weight: 500;
		letter-spacing: 0.08em;
	}

	/* .box.fill's own chain (Dashboard.svelte) stretches .panel to the box's
	   full height; this is the next link, so the two rows space out across
	   that instead of stacking at a fixed gap that only fits if the box
	   happens to be tall enough. */
	.storage-rows {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		min-height: 0;
	}

	.storage-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.storage-info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
</style>
