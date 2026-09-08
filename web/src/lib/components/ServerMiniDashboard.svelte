<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spark from '$lib/components/Spark.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { fleet } from '$lib/containers.js';
	import { degrees, gigabytes, microseconds, ms, pct, stamp } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { memoryBands } from '$lib/memory.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { minMax } from '$lib/stats.js';
	import { DISKS, volume } from '$lib/storage.js';
	import { clockOffset, clockOffsetHistory } from '$lib/time.js';

	/* /server's overview grid, scaled down for the project card's FIG. 01 so it
	   shows the real thing, not a static chart. `server` is a module-level
	   singleton, so this reads whatever's already polling (or starts its own —
	   the in-flight guard collapses two watchers into one fetch). */
	$effect(watch);

	let snapshot = $derived(server.snapshot);
	/* The tag downgrades only once a poll has actually failed — 'pending' (initial,
	   pre-fetch) keeps the optimistic label so the prerender doesn't flash "not live". */
	let lost = $derived(server.status.snapshot === 'stale' || server.status.snapshot === 'error');
	let feedLabel = $derived(
		server.status.snapshot === 'stale' ? 'Last known — not live'
			: server.status.snapshot === 'error' ? 'Status unavailable'
				: 'Live from the host'
	);
	let series = $derived(server.series);
	let month = $derived(server.month ?? server.series);

	let ramUsed = $derived(memoryBands(series).find((band) => band.id === 'used')?.points ?? []);

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

	/* Days + leftover hours, not the hour count the rest of the site uses — this box stays up long enough that hours alone stop being useful. */
	let uptimeSeconds = $derived(snapshot?.availability.uptime_seconds);
	let uptimeDays = $derived(Number.isFinite(uptimeSeconds) ? Math.floor(uptimeSeconds / 86400) : null);
	let uptimeRest = $derived(
		Number.isFinite(uptimeSeconds)
			? `${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
			: null
	);
</script>

<div class="proof">
	<span class="tag" class:stale={lost}><i class="dot" aria-hidden="true"></i>{feedLabel}</span>
	<div class="mini-dashboard">
		<div class="mgrid">
			<div class="obox" style={gridArea({ col: 1, row: 1 })}>
				<Panel label="Uptime" level={3}>
					<strong class="ofigure" style:color="var(--mint)">
						{uptimeDays === null ? '—' : `${uptimeDays}d ${uptimeRest}`}
					</strong>
					<span class="mupdated">Last updated {stamp(snapshot?.generated_at)}</span>
				</Panel>
			</div>

			<div class="obox" style={gridArea({ col: 2, row: 1 })}>
				<Panel label="Temperature" level={3}>
					<strong class="ofigure" style:color="var(--amber)">
						{degrees(snapshot?.cpu.temperature_c)}
					</strong>
					<span class="ostat">{minMax(series?.cpu.temperature_c, degrees)}</span>
					<Spark points={series?.cpu.temperature_c} tone="var(--amber)" />
				</Panel>
			</div>

			<div class="obox fill" style={gridArea({ col: 3, row: 1, w: 2, h: 3 })}>
				<Panel label="Containers" level={3}>
					{#if containers.slots.length}
						<div class="mfleet">
							<table>
								<thead>
									<tr>
										<th scope="col">Container</th>
										<th scope="col">Status</th>
										<th scope="col">Uptime</th>
										<th scope="col">CPU</th>
										<th scope="col">CPU limit</th>
										<th scope="col">Memory</th>
										<th scope="col">Memory limit</th>
									</tr>
								</thead>

								<tbody>
									{#each containers.slots as slot (slot.name)}
										<tr>
											<th class="mname" scope="row">{slot.name}</th>
											<td class="mstate" class:warning={!slot.healthy}>
												<i aria-hidden="true"></i>{slot.status}
											</td>
											<td>{slot.uptime}</td>

											{#each slot.resources as resource (resource.id)}
												<td class="musage" style:color={resource.tone}>
													{resource.value}
													<i class="resource-bar"><i style:width="{resource.fill}%"></i></i>
												</td>
												<td class="mlimit">{resource.limit}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<Placeholder note="no container data" lines={4} />
					{/if}
				</Panel>
			</div>

			<div class="obox fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
				<Panel label="CPU & RAM Usage (%)" level={3}>
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

			<div class="obox" style={gridArea({ col: 1, row: 4, w: 2 })}>
				<Panel label="Storage Overview" level={3}>
					<div class="ovolumes">
						{#each volumes as vol (vol.id)}
							<div class="ovolume">
								<div class="ovolume-name">
									<strong>{vol.label}</strong>
									<span class="ostat">
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

			<div class="obox" style={gridArea({ col: 3, row: 4 })}>
				<Panel label="Time Offset" level={3}>
					<strong class="ofigure" style:color="var(--azure)">
						{microseconds(clockOffset(snapshot?.time))}
					</strong>
					<span class="ostat">{minMax(clockHistory, microseconds)}</span>
					<Spark points={clockHistory} tone="var(--azure)" />
				</Panel>
			</div>

			<div class="obox" style={gridArea({ col: 4, row: 4 })}>
				<Panel label="Latency" level={3}>
					<strong class="ofigure" style:color="var(--azure)">
						{ms(snapshot?.availability.latency_ms)}
					</strong>
					<span class="ostat">{minMax(series?.availability.latency_ms, ms)}</span>
					<Spark points={series?.availability.latency_ms} tone="var(--azure)" />
				</Panel>
			</div>
		</div>
	</div>
</div>

<style>
	/* Tagged like the crypto study's tape — a window into a real feed, not just another card panel. */
	.proof {
		--visual-h: 32rem;

		display: grid;
		gap: 0.6rem;
		padding: 0.85rem;
		border-radius: var(--radius-panel);
		background: var(--color-background);
	}

	.proof .tag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: #a09f98;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.proof .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--mint);
		box-shadow: 0 0 0.5rem var(--mint);
	}

	/* Snapshot poll stale/errored: the tag stops claiming a live feed and the dot drops its glow. */
	.proof .tag.stale {
		color: #8a8a84;
	}

	.proof .tag.stale .dot {
		background: #8a8a84;
		box-shadow: none;
	}

	/* Not a box of its own — just the frame the .obox tiles read their dark tokens from. */
	.mini-dashboard {
		box-sizing: border-box;
		width: 100%;
		height: var(--visual-h);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
		--title-size: var(--fs-xs);
		--title-color: var(--text-faint);
		--axis-w: 1.7rem;
		--graph-min: 3rem;
	}

	.mgrid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		grid-auto-flow: dense;
		gap: 0.6rem;
		height: 100%;
	}

	.obox {
		overflow: hidden;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-control);
		background: var(--color-background);
	}

	/* Opt-in, same as Dashboard.svelte's .box.fill — without it a multi-row panel
	   sits at content height, squashing the CPU & RAM trace at the top of empty space. */
	.obox.fill {
		display: flex;
		flex-direction: column;
	}

	.obox.fill :global(.panel),
	.obox.fill :global(.plot),
	.obox.fill .mfleet {
		flex: 1;
		min-height: 0;
	}

	.ofigure {
		display: block;
		color: var(--color-foreground);
		font-size: var(--fs-base);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.ostat {
		display: block;
		margin-top: 0.15rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.03em;
	}

	/* When the snapshot behind every other reading in this box was taken. */
	.mupdated {
		display: block;
		margin-top: 0.35rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.02em;
	}

	/* Real table, not a running/unhealthy count — scrolls sideways rather than dropping columns. */
	.mfleet {
		height: 100%;
		overflow: auto;
	}

	.mfleet table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		white-space: nowrap;
	}

	.mfleet th,
	.mfleet td {
		padding: 0.3rem 0.6rem 0.3rem 0;
		font-weight: 400;
		text-align: left;
	}

	.mfleet thead th {
		padding-top: 0;
		padding-bottom: 0.4rem;
		color: var(--text-dim);
		font-weight: 500;
		letter-spacing: 0.03em;
		border-bottom: 1px solid var(--color-border);
	}

	.mfleet tbody tr + tr th,
	.mfleet tbody tr + tr td {
		border-top: 1px solid var(--color-border);
	}

	.mname {
		color: var(--color-foreground);
		font-weight: 500;
	}

	/* Colour square + word — colour is never the only signal. */
	.mstate {
		color: var(--mint);
		text-transform: capitalize;
	}

	.mstate i {
		display: inline-block;
		width: 0.4rem;
		height: 0.4rem;
		margin-right: 0.4rem;
		background: currentcolor;
	}

	.mstate.warning {
		color: var(--coral);
	}

	.mlimit {
		color: var(--text-dim);
	}

	.musage {
		min-width: 3.5rem;
	}

	.resource-bar {
		display: block;
		height: 2px;
		margin-top: 0.3rem;
		background: var(--color-border);
	}

	.resource-bar i {
		display: block;
		height: 100%;
		min-width: 0;
		background: currentcolor;
	}

	.ovolumes {
		display: grid;
		gap: 0.35rem;
	}

	.ovolume {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.ovolume-name {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: var(--fs-xs);
	}

	.ovolume-name .ostat {
		margin-top: 0;
	}

	.ovolumes :global(.capacity .reading) {
		font-size: var(--fs-xs);
	}
</style>
