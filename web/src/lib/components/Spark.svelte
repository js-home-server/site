<script>
	import { area, chart, VIEW } from '$lib/chart.js';

	/* A series at thumbnail size: no scale, no axis, no reading — the shape of the
	   window under a figure that gives the number. `domain` is [lo, hi] where the
	   reading means something against a fixed scale; without one the trace is
	   scaled to its own range, which is what a flat series needs to show anything
	   at all. Nothing is drawn for a series too short to have a shape.

	   `fill` is the shading under the line, which is what gives a trace its body —
	   off for a series that lives at the top of its scale, where the shading is the
	   whole box and the reading stops being a line. */
	let { points, domain = null, tone, fill = true } = $props();

	let d = $derived(chart(points, domain));
</script>

<div class="spark" style:color={tone}>
	{#if d}
		<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
			{#if fill}<path class="trace area" d={area(d)} />{/if}
			<path class="trace" d={d} vector-effect="non-scaling-stroke" />
		</svg>
	{/if}
</div>

<style>
	/* Pinned to the foot of whatever holds it, so a row of these lines up however
	   the type above them wraps. --spark is the height, for a caller that wants
	   them shallower than the default. */
	.spark {
		height: var(--spark, 1.85rem);
		margin-top: auto;
	}

	/* The one part not shared with the charts on the dashboard: this svg is the
	   whole component rather than a drawing laid inside a `.plot`, so it takes its
	   box directly. The paths in it wear the same `.trace` every other series
	   does. */
	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
