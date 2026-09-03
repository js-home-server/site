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

	/* /server's own overview grid (routes/server/+page.svelte), scaled down —
	   the same live box ServerStudy.svelte shows under "The box, while you
	   read about it", pulled out so the project card's FIG. 01 can show the
	   real thing instead of a static chart. `server` is a module-level
	   singleton, so wherever this mounts it reads whatever is already polling
	   (StatusBar's, on the homepage accordion) or starts its own — the store's
	   in-flight guard collapses two watchers into one fetch either way. */
	$effect(watch);

	let snapshot = $derived(server.snapshot);
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

	/* Days and the hours left over, rather than the hour count the rest of the
	   site quotes this same figure as: a box this small is still up long enough
	   that hours stop being the unit worth leading with. */
	let uptimeSeconds = $derived(snapshot?.availability.uptime_seconds);
	let uptimeDays = $derived(Number.isFinite(uptimeSeconds) ? Math.floor(uptimeSeconds / 86400) : null);
	let uptimeRest = $derived(
		Number.isFinite(uptimeSeconds)
			? `${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
			: null
	);
</script>

<div class="proof">
	<span class="tag"><i class="dot" aria-hidden="true"></i>Live from the host</span>
	<div class="mini-dashboard">
		<div class="mgrid">
			<div class="obox" style={gridArea({ col: 1, row: 1 })}>
				<Panel label="Uptime" level={5}>
					<strong class="ofigure" style:color="var(--mint)">
						{uptimeDays === null ? '—' : `${uptimeDays}d ${uptimeRest}`}
					</strong>
					<span class="mupdated">Last updated {stamp(snapshot?.generated_at)}</span>
				</Panel>
			</div>

			<div class="obox" style={gridArea({ col: 2, row: 1 })}>
				<Panel label="Temperature" level={5}>
					<strong class="ofigure" style:color="var(--amber)">
						{degrees(snapshot?.cpu.temperature_c)}
					</strong>
					<span class="ostat">{minMax(series?.cpu.temperature_c, degrees)}</span>
					<Spark points={series?.cpu.temperature_c} tone="var(--amber)" />
				</Panel>
			</div>

			<div class="obox fill" style={gridArea({ col: 3, row: 1, w: 2, h: 3 })}>
				<Panel label="Containers" level={5}>
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
				<Panel label="CPU & RAM Usage (%)" level={5}>
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
				<Panel label="Storage Overview" level={5}>
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
				<Panel label="Time Offset" level={5}>
					<strong class="ofigure" style:color="var(--azure)">
						{microseconds(clockOffset(snapshot?.time))}
					</strong>
					<span class="ostat">{minMax(clockHistory, microseconds)}</span>
					<Spark points={clockHistory} tone="var(--azure)" />
				</Panel>
			</div>

			<div class="obox" style={gridArea({ col: 4, row: 4 })}>
				<Panel label="Latency" level={5}>
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
	/* The dark box the live grid stands in, tagged the way the crypto study's
	   tape is: a window into a real feed, not a panel of whatever card it sits
	   in. */
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
		font-size: 0.6rem;
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

	/* /server's own overview grid (routes/server/+page.svelte), copied and
	   scaled down rather than embedded live. Not a box of its own — just the
	   frame the individual .obox tiles read their dark tokens from. */
	.mini-dashboard {
		box-sizing: border-box;
		width: 100%;
		height: var(--visual-h);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
		--title-size: 0.55rem;
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

	/* Opt-in, same as the real dashboard's own .box.fill (Dashboard.svelte):
	   a panel given more than one row is otherwise however tall its content
	   needs, which is what left the CPU & RAM trace a squashed line at the
	   top of a box mostly empty underneath it. This stretches the chain down
	   to the drawing instead. */
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
		font-size: 0.92rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.ostat {
		display: block;
		margin-top: 0.15rem;
		color: var(--text-dim);
		font-size: 0.48rem;
		font-weight: 500;
		letter-spacing: 0.03em;
	}

	/* When the snapshot behind every other reading in this box was taken. */
	.mupdated {
		display: block;
		margin-top: 0.35rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.02em;
	}

	/* The containers table (routes/server/containers/+page.svelte), copied at
	   card scale the same way the overview grid above it is: a real table
	   rather than the running/unhealthy count it replaces, scrolling
	   sideways in its own two-column box rather than dropping columns. */
	.mfleet {
		height: 100%;
		overflow: auto;
	}

	.mfleet table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.56rem;
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

	/* A square of the state's own colour, and the word beside it — the colour
	   is never the only thing saying which way a row reads. */
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
		font-size: 0.6rem;
	}

	.ovolume-name .ostat {
		margin-top: 0;
	}

	.ovolumes :global(.capacity .reading) {
		font-size: 0.7rem;
	}
</style>
