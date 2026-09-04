<script>
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* A row per series, a column per bucket, brightness by value. `rows` is
	   [{ id, now, cells, tone, group }] — a cell is null when nothing was collected. */
	let {
		rows = [],
		note = 'no history yet',
		/* 'map' stretches one ramp across every row; 'row' gives each row its own. */
		normalise = 'map',
		/* Formats the ramp's range in the caller's units; without one the key just says Idle/Peak. */
		format = null
	} = $props();

	const KEY_STEPS = [0, 0.25, 0.5, 0.75, 1];

	let readings = $derived(rows.some((row) => row.now));

	const collected = (row) => row.cells.filter((cell) => cell !== null);
	const rangeOf = (values) => (values.length ? [Math.min(...values), Math.max(...values)] : [0, 1]);

	/* Scale = the data's actual range, not its theoretical one — a box idling
	   3-30% would be all-black on an absolute ramp. Shared when rows are the
	   same quantity (cores vs cores); per-row when they're not (reads vs writes
	   at wildly different magnitudes would otherwise wash one out). */
	let lanes = $derived.by(() => {
		const shared = rangeOf(rows.flatMap(collected));

		return rows.map((row) => ({
			...row,
			tone: row.tone ?? 'var(--mint)',
			scale: normalise === 'row' ? rangeOf(collected(row)) : shared
		}));
	});

	/* Mid-ramp for zero range — a flat series is neither idle nor peak. */
	const shade = (cell, [lo, hi]) => (hi === lo ? 0.5 : (cell - lo) / (hi - lo));

	const ends = ([lo, hi]) => (format ? [format(lo), format(hi)] : ['Idle', 'Peak']);

	/* One key entry per ramp. Per-row scales each get their own entry (same
	   shade means different things per lane); shared-scale rows collapse to one entry per colour. */
	let ramps = $derived(
		normalise === 'row'
			? lanes.map((lane) => ({ ...lane, label: lane.id, ends: ends(lane.scale) }))
			: lanes
					.filter((lane, i) => lanes.findIndex((first) => first.tone === lane.tone) === i)
					.map((lane) => ({ ...lane, id: lane.tone, label: lane.group, ends: ends(lane.scale) }))
	);
</script>

{#if rows.length}
	<div class="plot">
		<!-- 2 or 3 columns depending on whether rows carry a reading — fewer cells than columns would wrap into the wrong ones. -->
		<div class="map" class:bare={!readings}>
			{#each lanes as lane (lane.id)}
				<span class="row-id tick">{lane.id}</span>
				<!-- The lane in words — id and reading are already text, the shades between them aren't. -->
				{@const [lo, hi] = ends(lane.scale)}
				<div
					class="cells"
					style:color={lane.tone}
					role="img"
					aria-label="{lane.id} over the window, {lo} to {hi}"
				>
					{#each lane.cells as cell}
						<i
							class:unknown={cell === null}
							style="--v: {cell === null ? 0 : shade(cell, lane.scale)}"
						></i>
					{/each}
				</div>
				{#if readings}<span class="row-now tick">{lane.now ?? ''}</span>{/if}
			{/each}
		</div>

		<div class="foot"><TimeAxis /></div>

		<div class="key">
			{#each ramps as ramp (ramp.id)}
				<span class="ramp" style:color={ramp.tone}>
					{#if ramp.label}<b>{ramp.label}</b>{/if}
					<span class="end">{ramp.ends[0]}</span>
					{#each KEY_STEPS as step}
						<i style="--v: {step}"></i>
					{/each}
					<span class="end">{ramp.ends[1]}</span>
				</span>
			{/each}
		</div>
	</div>
{:else}
	<Placeholder {note} lines={2} />
{/if}

<style>
	.map {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: var(--axis-w) minmax(0, 1fr) auto;
		/* Rows divide the block between them, whatever the count, so the map stands as tall as the traces around it. */
		grid-auto-rows: minmax(0, 1fr);
		gap: 2px 0.45rem;
		align-items: stretch;
	}

	.map.bare {
		grid-template-columns: var(--axis-w) minmax(0, 1fr);
	}

	.cells {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 2px;
		height: 100%;
	}

	/* Accent mixed into an empty cell — idle is a dark square, not a hole. */
	i {
		background: color-mix(
			in srgb,
			currentcolor calc(var(--v) * 100%),
			color-mix(in srgb, var(--color-foreground) 7%, transparent)
		);
	}

	/* A bucket nothing was collected for, which is not the same as an idle one. */
	i.unknown {
		background: none;
	}

	.row-id,
	.row-now {
		align-self: center;
		font-size: var(--fs-xs);
		text-align: right;
	}

	/* A footnote below the map, two ramps to a line to mirror read/write pairs above. Not small-capped — that'd read as a second name for the same lane. */
	.key {
		display: grid;
		grid-column: 2;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.3rem 1.5rem;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.1em;
	}

	.ramp {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* The ends are quiet; the ramp between them carries the colour. */
	.ramp .end {
		color: var(--text-faint);
		font-family: var(--font-mono);
	}

	.ramp b {
		color: currentcolor;
		font-weight: 500;
	}

	.key i {
		width: 0.85rem;
		height: 0.4rem;
	}

	/* No room for a pair at this width: one ramp to a line. */
	@media (max-width: 52rem) {
		.key {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
