<script>
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* A row per series, a column per bucket of the window, brightness by value.

	   `rows` is [{ id, now, cells, tone, group }] where a cell is a value in the
	   series' own units, or null for a bucket nothing was collected for.

	   `ticks` replaces the plain window label with a scale of its own, above the
	   map rather than below it, for a chart read across a day. */
	let {
		rows = [],
		note = 'no history yet',
		ticks = null,
		/* 'map' stretches one ramp across every row; 'row' gives each row its own. */
		normalise = 'map',
		/* Spells out the range the colours were stretched to, in the caller's own
		   units. Without one the key is labelled in words, for a map whose cells
		   have no unit worth quoting. */
		format = null
	} = $props();

	const KEY_STEPS = [0, 0.25, 0.5, 0.75, 1];

	let readings = $derived(rows.some((row) => row.now));

	/* The map is painted across the range the data actually covers, not across the
	   scale it was measured on: a box that idles between 3% and 30% is all but
	   black on an absolute ramp, and the point of the map is the difference
	   between one bucket and the next.

	   Over every row at once where the rows are the same quantity, so the rows stay
	   comparable — cores against cores. Per row where they are not: a read stream
	   at bytes a second beside a write stream at hundreds of kilobytes would leave
	   the reads black on a shared ramp, which says nothing about when they ran. */
	const rangeOf = (values) =>
		values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];

	let extent = $derived(
		rangeOf(rows.flatMap((row) => row.cells.filter((cell) => cell !== null)))
	);

	let extents = $derived(rows.map((row) => rangeOf(row.cells.filter((cell) => cell !== null))));

	/* Mid-ramp when there is no range at all: a flat series is neither idle nor
	   peak, and painting it as either would be a claim the data does not make. */
	const shade = (cell, row) => {
		const [lo, hi] = normalise === 'row' ? extents[row] : extent;
		return hi === lo ? 0.5 : (cell - lo) / (hi - lo);
	};

	/* The ends of a ramp: the readings its colours were stretched between where the
	   caller can write them down, and the words they stand for where it cannot. */
	const ends = ([lo, hi]) => (format ? [format(lo), format(hi)] : ['Idle', 'Peak']);

	/* The range a given row's own shades cover, which is the map's unless the rows
	   were each stretched on their own scale. */
	const rowEnds = (index) => ends(normalise === 'row' ? extents[index] : extent);

	/* One entry per ramp in the map, each spelling out the range its own colours
	   cover. Rows stretched on their own scale get one each — the same shade means
	   a different reading one lane down, so a single key would be a claim about
	   lanes it does not cover. Rows sharing the map's scale collapse into one entry
	   per colour, named by the group they belong to. */
	let ramps = $derived(
		normalise === 'row'
			? rows.map((row, index) => ({
					id: row.id,
					tone: row.tone ?? 'var(--mint)',
					label: row.id,
					ends: ends(extents[index])
				}))
			: rows.reduce((list, row) => {
					const tone = row.tone ?? 'var(--mint)';
					if (!list.some((ramp) => ramp.tone === tone)) {
						list.push({ id: tone, tone, label: row.group, ends: ends(extent) });
					}
					return list;
				}, [])
	);
</script>

{#if rows.length}
	<div class="plot" class:with-ticks={ticks}>
		{#if ticks}
			<div class="ticks tick">
				{#each ticks as tick (tick)}
					<span>{tick}</span>
				{/each}
			</div>
		{/if}

		<!-- Two columns or three, depending on whether the rows carry a reading:
		     rows that emit fewer cells than the grid has columns wrap into the wrong
		     ones. -->
		<div class="map" class:bare={!readings}>
			{#each rows as row, index (row.id)}
				<span class="row-id tick">{row.id}</span>
				<!-- The lane in words, the way the uptime strip and the capacity bars
				     are: the id and the current reading either side of it are already
				     text, but the shades between them are not. -->
				{@const [lo, hi] = rowEnds(index)}
				<div
					class="cells"
					style:color={row.tone ?? 'var(--mint)'}
					role="img"
					aria-label="{row.id} over the window, {lo} to {hi}"
				>
					{#each row.cells as cell}
						<i
							class:unknown={cell === null}
							style="--v: {cell === null ? 0 : shade(cell, index)}"
						></i>
					{/each}
				</div>
				{#if readings}<span class="row-now tick">{row.now ?? ''}</span>{/if}
			{/each}
		</div>

		{#if !ticks}
			<div class="foot"><TimeAxis /></div>
		{/if}

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
	/* The scale is a line of text and the map takes what is left. Without this the
	   ticks land in the flexible row and the height goes above the cells. */
	.plot.with-ticks {
		grid-template-rows: auto minmax(0, 1fr);
	}

	/* Spread across the map, since a cell is a bucket and the ends of the row are
	   the ends of the window. */
	.ticks {
		display: flex;
		justify-content: space-between;
		grid-column: 2;
		text-transform: uppercase;
	}

	.map {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: var(--axis-w) minmax(0, 1fr) auto;
		/* Whatever the row count, they divide the block between them, so the map
		   stands as tall as the traces above and below it. */
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

	/* The ramp: the accent mixed into an empty cell, so idle is a dark square
	   rather than a hole in the row. */
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
		font-size: 0.58rem;
		text-align: right;
	}

	/* The key is a footnote to the map and drops below it, in the map's column. */
	/* Two to a line, so the ramps pair up the way the lanes above them do: a
	   device's read and its write on one row, the next device under it. */
	.key {
		display: grid;
		grid-column: 2;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.3rem 1.5rem;
		font-size: 0.55rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.ramp {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* The ends are quiet; the ramp between them carries the colour. Unit symbols
	   are wrong in any case but their own, so these are left as they were written
	   while the names beside them take the small caps. */
	.ramp .end {
		color: var(--text-faint);
		font-family: var(--font-mono);
		text-transform: none;
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
