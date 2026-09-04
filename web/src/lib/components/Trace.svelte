<script>
	import { area, chart, headroom, markY, VIEW } from '$lib/chart.js';
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* One or more series on one scale. `lines` is [{ id, points, tone, label,
	   dashed }]. `domain` is [lo, hi] and never moves with the data — for a fixed
	   scale like 0-100% CPU; without one it's the series' own range, which a
	   reading in hundredths of a percent needs (a fixed 0-100 axis would flatline
	   it). `marks` are levels worth crossing, drawn as grey rules. `format` turns a value into its label. */
	let { lines = [], domain = null, format, marks = [] } = $props();

	/* Resolved once, shared by drawing and labels — a label can't name a height the trace wasn't drawn at. */
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

	/* Top to bottom: domain head, marks, floor — same projection as the rules, so labels can't drift from the lines they name. */
	let scale = $derived(
		[scaleTo[1], ...marks, scaleTo[0]].map((value) => ({
			label: format(value),
			offset: (markY(value, scaleTo) / VIEW.height) * 100
		}))
	);

	/* Only a chart with more than one line has to say which is which. */
	let named = $derived(traces.length > 1 && traces.some((trace) => trace.label));
</script>

{#if traces.length}
	<div class="plot">
		<!-- Own gutter beside the plot, so no label is ever painted over its trace. -->
		<div class="axis">
			{#each scale as { label, offset } (label + offset)}
				<span class="tick" style="top: {offset}%">{label}</span>
			{/each}
		</div>

		<div class="canvas">
			<!-- The levels worth seeing the trace cross. -->
			{#each marks as mark}
				<i class="gridline" style="top: {(markY(mark, scaleTo) / VIEW.height) * 100}%"></i>
			{/each}

			<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
				{#each traces as trace (trace.id)}
					{#if trace.area !== false}
						<path class="trace area" d={area(trace.d)} style:color={trace.tone} />
					{/if}
					<path
						class="trace"
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
	/* Fixed box for a fixed scale — floor and domain head, nothing between. Dotted like every measuring line; solid lines divide sections instead. */
	.canvas {
		color: var(--color-border);
		background-image: var(--dot-row), var(--dot-row);
		background-position: 0 0, 0 100%;
		background-repeat: no-repeat;
		background-size: 100% 1px;
	}

	.key {
		display: flex;
		gap: 1rem;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.key span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: currentcolor;
	}

	/* A length of the line, not a colour block — the only swatch that can show the dash. */
	.key i {
		width: 0.9rem;
		border-top: 2px solid currentcolor;
	}

	.key i.dashed {
		border-top-style: dashed;
	}
</style>
