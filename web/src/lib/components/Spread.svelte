<script>
	import Placeholder from './Placeholder.svelte';

	/* A set of readings of one quantity, on one signed axis, each with the width it
	   admits it could be wrong by.

	   `rows` is [{ id, label, note, tone, value, error }]. The axis is centred on
	   zero rather than on the data: these are readings of how far out something is,
	   so nought is the thing they are all being compared against and it has to sit
	   in the middle whatever the numbers do. */
	let { rows = [], format, note = 'no readings yet' } = $props();

	let drawable = $derived(rows.filter((row) => Number.isFinite(row.value)));

	/* The standing of each reading, where the caller gives one. Colour says it too,
	   but colour on its own is not a label. */
	let noted = $derived(drawable.some((row) => row.note));

	/* Symmetric, and wide enough for the loosest bound on the list with a little
	   air past it. */
	let limit = $derived(
		Math.max(...drawable.map((row) => Math.abs(row.value) + (row.error ?? 0)), 0) * 1.08 || 1
	);

	const share = (value) => 50 + (value / limit) * 50;

	let bars = $derived(
		drawable.map((row) => ({
			...row,
			left: share(row.value - (row.error ?? 0)),
			right: 100 - share(row.value + (row.error ?? 0)),
			at: share(row.value)
		}))
	);
</script>

{#if bars.length}
	<div class="spread" class:noted>
		<div class="rows">
			<!-- What every reading is measured against, and the only line on the chart
			     that means a number rather than a division. -->
			<i class="zero"></i>

			{#each bars as bar (bar.id)}
				<span class="name tick">{bar.label}</span>

				<div
					class="lane"
					style:color={bar.tone}
					role="img"
					aria-label="{bar.label}: {format(bar.value)}, uncertain by {format(bar.error)}"
				>
					<i class="bar" style="left: {bar.left}%; right: {bar.right}%"></i>
					<i class="dot" style="left: {bar.at}%"></i>
				</div>

				<span class="reading tick" style:color={bar.tone}>{format(bar.value)}</span>

				{#if noted}<span class="note eyebrow">{bar.note ?? ''}</span>{/if}
			{/each}
		</div>

		<div class="scale">
			<span class="tick">{format(-limit)}</span>
			<span class="tick at-zero">0</span>
			<span class="tick">{format(limit)}</span>
		</div>

	</div>
{:else}
	<Placeholder {note} lines={8} />
{/if}

<style>
	.spread.noted {
		--note-w: 4.2rem;
	}

	.spread {
		/* The three columns the lanes and the scale under them both keep to, so the
		   axis and the readings it labels cannot drift apart. The readings are mono
		   and all the same length, so that column is a fixed width rather than a
		   guess. */
		--gap: 0.6rem;
		--read-w: 4rem;
		--note-w: 0rem;
		/* Everything to the right of the lane, which the zero line and the scale both
		   have to stop short of. */
		--tail: calc(var(--read-w) + var(--note-w) + var(--gap));

		/* 1fr for .rows, auto for .scale under it: when something outside stretches
		   .spread taller than its own content needs (a box .fill has grown past a
		   single row), the extra space has somewhere defined to go — into .rows,
		   whose own grid-auto-rows: minmax(1.1rem, 1fr) is what turns a taller .rows
		   into evenly taller lanes rather than the same lanes with blank space left
		   under .scale. Content-sized contexts are unaffected: an indefinite height
		   resolves 1fr the same as auto. */
		display: grid;
		grid-template-rows: 1fr auto;
		gap: 0.5rem;
	}

	/* Name, the lane it is drawn in, and the reading written out. The lanes divide
	   the height between them, so the block stands as tall as whatever is beside
	   it. */
	.rows {
		position: relative;
		display: grid;
		grid-template-columns: var(--name-w, 8.5rem) minmax(0, 1fr) var(--read-w) var(--note-w);
		grid-auto-rows: minmax(1.1rem, 1fr);
		gap: 0.15rem var(--gap);
		align-items: center;
		min-height: var(--graph-min, 6rem);
	}

	/* Wide enough for the longest name these carry ("Cloudflare anycast 4" comes to
	   113px at this size); anything longer than the column is cut rather than
	   allowed to eat the lane. */
	.name {
		overflow: hidden;
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.reading {
		text-align: right;
	}

	.note {
		overflow: hidden;
		font-size: 0.54rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lane {
		position: relative;
		height: 100%;
	}

	/* The bound, drawn as the width it is: a reading whose bar is short is one that
	   can be believed. */
	.bar {
		position: absolute;
		top: 50%;
		height: 1px;
		background: currentcolor;
		opacity: 0.55;
		transform: translateY(-50%);
	}

	/* The ends of the bound, so a short bar is still a bar rather than a dash. */
	.bar::before,
	.bar::after {
		position: absolute;
		top: -2px;
		width: 1px;
		height: 5px;
		background: currentcolor;
		content: '';
	}

	.bar::before {
		left: 0;
	}

	.bar::after {
		right: 0;
	}

	.dot {
		position: absolute;
		top: 50%;
		width: 0.34rem;
		height: 0.34rem;
		border-radius: 50%;
		background: currentcolor;
		transform: translate(-50%, -50%);
	}

	/* Spans the lane column exactly, and carries the line down its middle — which is
	   where nought is, since the axis is symmetric about it. */
	.zero {
		position: absolute;
		top: 0;
		right: calc(var(--tail) + var(--gap));
		bottom: 0;
		left: calc(var(--name-w, 8.5rem) + var(--gap));
	}

	.zero::before {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
		color: var(--text-faint);
		background-image: var(--dot-column);
		content: '';
	}

	/* The two ends of the axis and its middle, under the lanes they measure. */
	.scale {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		margin-right: calc(var(--tail) + var(--gap));
		margin-left: calc(var(--name-w, 8.5rem) + var(--gap));
	}

	.scale .at-zero {
		color: var(--text-dim);
		text-align: center;
	}

	.scale span:last-child {
		text-align: right;
	}

	/* There is no lane worth drawing at this width — eight bounds overlapping in
	   seventy pixels say nothing, and squeezing one in is what pushed the columns
	   either side of it off the page. The drawing goes and the readings it was
	   drawing take the room, which is the same information in the one form that
	   fits. */
	@media (max-width: 52rem) {
		.rows {
			grid-template-columns: minmax(0, 1fr) var(--read-w) var(--note-w);
		}

		.name {
			text-align: left;
		}

		.lane,
		.zero,
		.scale {
			display: none;
		}
	}
</style>
