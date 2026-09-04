<script>
	import { area, chart, VIEW } from '$lib/chart.js';

	/* Thumbnail: no scale, no axis, just shape under a figure. `domain` fixes the
	   scale; without one it's scaled to its own range so a flat series still
	   shows something. `fill` off for a series near the top of its scale, where the shading would swallow the line. */
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
	/* Pinned to the foot, so a row of these lines up whatever the type above wraps to. */
	.spark {
		height: var(--spark, 1.85rem);
		margin-top: auto;
	}

	/* Unlike the dashboard charts, this svg IS the component, not a drawing inside a `.plot`. */
	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
