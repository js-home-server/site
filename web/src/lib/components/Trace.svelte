<script>
	import { chart, headroom, markY, VIEW } from '$lib/chart.js';
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* One or more series on one scale.

	   `lines` is [{ id, points, tone, label, dashed }]: the series, the colour it is
	   drawn in, and a name where the chart carries more than one and has to say
	   which is which. `domain` is [lo, hi] in the series' own units and never moves
	   with the data, for a reading that means something against a fixed scale — 0
	   to 100% of a CPU. Without one the scale is the range the series covered, which
	   is what a reading that lives in hundredths of a percent needs: a fixed 0-100
	   axis would draw every one of them flat along the floor. `marks` are the levels
	   worth seeing a trace cross, drawn as grey rules and labelled in the gutter.
	   `format` turns a number in those units into its label, so a percentage and a
	   temperature take the same code path. */
	let { lines = [], domain = null, format, marks = [] } = $props();

	/* Resolved once and used for both the drawing and its labels, so a label cannot
	   name a height the trace was not drawn at. */
	let scaleTo = $derived.by(() => {
		if (domain) return domain;
		const values = lines.flatMap((line) => (line.points ?? []).map((point) => point[1]));
		return values.length ? headroom(values) : [0, 1];
	});

	let traces = $derived(
		lines
			.map((line) => ({ ...line, d: chart(line.points, scaleTo) }))
			.filter((line) => line.d)
	);

	/* The scale, top to bottom: the head of the domain, whatever is marked in
	   between, then its floor. Everything is placed off the same projection the
	   rules use, so a label cannot drift from the line it names. */
	let scale = $derived(
		[scaleTo[1], ...marks, scaleTo[0]].map((value) => ({
			value,
			label: format(value),
			offset: (markY(value, scaleTo) / VIEW.height) * 100
		}))
	);

	/* Only a chart with more than one line has to say which is which. */
	let named = $derived(traces.length > 1 && traces.some((trace) => trace.label));
</script>

{#if traces.length}
	<div class="plot">
		<!-- The scale sits in its own gutter beside the plot, so no label is ever
		     painted over the trace it belongs to. -->
		<div class="axis">
			{#each scale as { value, label, offset } (value)}
				<span class="tick" style="top: {offset}%">{label}</span>
			{/each}
		</div>

		<div class="chart">
			<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
				{#each marks as mark (mark)}
					{@const y = markY(mark, scaleTo)}
					<line class="rule" x1="0" x2={VIEW.width} y1={y} y2={y} vector-effect="non-scaling-stroke" />
				{/each}

				{#each traces as trace (trace.id)}
					<path
						d={trace.d}
						class:dashed={trace.dashed}
						style:color={trace.tone}
						vector-effect="non-scaling-stroke"
					/>
				{/each}
			</svg>
		</div>

		<div class="foot"><TimeAxis /></div>

		{#if named}
			<!-- Dash as well as colour, so the two lines are still two lines to anyone
			     who cannot tell the tones apart. -->
			<div class="key foot">
				{#each traces as trace (trace.id)}
					<span class="eyebrow" style:color={trace.tone}>
						<i class:dashed={trace.dashed}></i>{trace.label}
					</span>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<Placeholder note="no history yet" lines={2} />
{/if}

<style>
	.axis {
		position: relative;
		grid-row: 1;
		grid-column: 1;
	}

	/* Each label hangs off the height its value sits at, centred on it. The two
	   ends overhang the plot by half a line, which is what puts them level with the
	   top and bottom of the box rather than inside it. */
	.axis span {
		position: absolute;
		right: 0;
		transform: translateY(-50%);
	}

	/* The trace is drawn against a fixed scale, so the box has to be a fixed box:
	   a border on the floor and the head of the domain, nothing in between. */
	.chart {
		position: relative;
		grid-column: 2;
		border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
		border-bottom: 1px solid var(--color-border);
	}

	/* Out of flow: left in, the svg would claim a height from its own aspect ratio
	   and set how tall the row is. */
	svg {
		position: absolute;
		display: block;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	path {
		fill: none;
		stroke: currentcolor;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}

	path.dashed {
		stroke-dasharray: 4 3;
	}

	.rule {
		stroke: var(--text-faint);
		stroke-dasharray: 2 3;
		stroke-width: 1;
		opacity: 0.45;
	}

	.key {
		display: flex;
		gap: 1rem;
		font-size: 0.55rem;
	}

	.key span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: currentcolor;
	}

	/* A length of the line itself rather than a block of its colour: it is the only
	   swatch that can show the dash. */
	.key i {
		width: 0.9rem;
		border-top: 2px solid currentcolor;
	}

	.key i.dashed {
		border-top-style: dashed;
	}
</style>
