<script>
	import { chart, markY, VIEW } from '$lib/chart.js';
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* One series against a fixed scale.

	   `domain` is [lo, hi] in the series' own units and never moves with the data:
	   the height of the trace is the reading. `marks` are the levels worth seeing
	   it cross, drawn as grey rules and labelled in the gutter. `format` turns a
	   number in those units into its label, so a percentage and a temperature take
	   the same code path. */
	let { points, domain, format, marks = [], tone } = $props();

	let path = $derived(chart(points, domain));

	/* The scale, top to bottom: the head of the domain, whatever is marked in
	   between, then its floor. Everything is placed off the same projection the
	   rules use, so a label cannot drift from the line it names. */
	let scale = $derived(
		[domain[1], ...marks, domain[0]].map((value) => ({
			value,
			label: format(value),
			offset: (markY(value, domain) / VIEW.height) * 100
		}))
	);
</script>

{#if path}
	<div class="plot" style:color={tone}>
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
					{@const y = markY(mark, domain)}
					<line class="rule" x1="0" x2={VIEW.width} y1={y} y2={y} vector-effect="non-scaling-stroke" />
				{/each}
				<path d={path} vector-effect="non-scaling-stroke" />
			</svg>
		</div>

		<div class="foot"><TimeAxis /></div>
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

	.rule {
		stroke: var(--text-faint);
		stroke-dasharray: 2 3;
		stroke-width: 1;
		opacity: 0.45;
	}
</style>
