<script>
	import { PERCENT_GRID } from '$lib/chart.js';
	import { bytes, pct, perDay, untilFull } from '$lib/format.js';
	import { MONTH_RANGE } from '$lib/server.svelte.js';
	import { bucket } from '$lib/stats.js';
	import Placeholder from './Placeholder.svelte';

	/* Where the volumes have been and where that puts them. `volumes` are shaped
	   by $lib/storage.js: each carries its own percent series, its current size,
	   and the rate it is filling. */
	let { volumes = [] } = $props();

	const DAY = 86_400;
	const MONTH = 30.44 * DAY;

	/* Each half of the axis, back and forward alike: the divider sits in the
	   middle and a slope reads the same either side of it. */
	const SPAN = 12 * MONTH;

	/* One dot per bucket rather than per sample: the series steps every two hours,
	   which is more marks than a line this wide can show apart. */
	const HISTORY_POINTS = 24;

	let drawable = $derived(volumes.filter((v) => v.points.length > 1));

	/* Everything is measured from the last reading the API returned, not from the
	   clock: that is where the history ends and the projection starts. */
	let now = $derived(Math.max(...drawable.map((v) => v.points.at(-1)[0]), 0));

	/* The chart is drawn at the size it is rendered, so a dot is round and a dash
	   is the same length wherever it falls. */
	let width = $state(0);
	let height = $state(0);

	const PAD = { top: 6, right: 8, bottom: 4, left: 4 };
	let plot = $derived({
		width: Math.max(0, width - PAD.left - PAD.right),
		height: Math.max(0, height - PAD.top - PAD.bottom)
	});

	/* Seconds either side of now, to a fraction of the axis and then to pixels.
	   Now is the middle; anything past the ends of the window sits on them. */
	const along = (seconds) => 0.5 * (1 + Math.max(-1, Math.min(1, seconds / SPAN)));

	/* The volume that runs out first: the headline is its date. */
	let soonest = $derived(
		drawable
			.filter((v) => v.daysToFull !== null)
			.sort((a, b) => a.daysToFull - b.daysToFull)[0] ?? null
	);

	let x = $derived((seconds) => PAD.left + along(seconds) * plot.width);
	let y = $derived((percent) => PAD.top + (1 - Math.min(100, Math.max(0, percent)) / 100) * plot.height);

	/* The past, thinned to a readable number of marks, and the line that joins
	   them. */
	let traces = $derived(
		drawable.map((v) => {
			const t0 = Math.max(v.points[0][0], now - SPAN);
			const inWindow = v.points.filter(([t]) => t >= t0);
			const step = (now - t0) / Math.max(1, Math.min(HISTORY_POINTS, inWindow.length) - 1);

			const marks = bucket(inWindow, HISTORY_POINTS)
				.map((value, i) => (value === null ? null : { x: x(t0 - now + i * step), y: y(value) }))
				.filter(Boolean);

			/* Straight on from where it is at the rate it has been filling, stopping
			   at the ceiling rather than running along it: where it meets 100% is
			   when the volume is full. A volume that is not filling gets no line at
			   all — flat dots to the horizon would claim it stays exactly as it is,
			   which is not what the numbers say. */
			const end = Math.min(SPAN, (v.daysToFull ?? Infinity) * DAY);
			const projection =
				v.growthPerDay > 0 && v.totalNow
					? `M${x(0).toFixed(1)},${y(v.percentNow).toFixed(1)} ` +
						`L${x(end).toFixed(1)},${y(((v.usedNow + (v.growthPerDay * end) / DAY) / v.totalNow) * 100).toFixed(1)}`
					: '';

			return {
				...v,
				marks,
				line: marks.map((m, i) => `${i ? 'L' : 'M'}${m.x.toFixed(1)},${m.y.toFixed(1)}`).join(' '),
				projection
			};
		})
	);

	/* The same marks either side of now, so the two halves can be read against
	   each other. Years once a count of months stops being a length anyone
	   pictures. */
	const TICK_MONTHS = 3;

	const monthLabel = (months) => (months >= 12 ? `${months / 12}y` : `${months}m`);

	/* Counted out from the divider, so the two halves are each other's mirror
	   whatever the span is set to. */
	const steps = Array.from(
		{ length: Math.floor(SPAN / MONTH / TICK_MONTHS) },
		(_, i) => (i + 1) * TICK_MONTHS
	);

	const ticks = [
		...[...steps].reverse().map((m) => ({ at: -m * MONTH, label: `-${monthLabel(m)}` })),
		{ at: 0, label: 'Now', divider: true },
		...steps.map((m) => ({ at: m * MONTH, label: `+${monthLabel(m)}` }))
	];

</script>

{#if traces.length}
	<div class="horizon">
		<div class="head">
			<!-- The window the series was asked for, read from the request itself, so
			     the caption cannot claim a history that was never fetched. -->
			<h3 class="caption eyebrow">{MONTH_RANGE} used space history &amp; projection</h3>
			{#if soonest}
				<!-- The rate behind this date is the one on that volume's legend row,
				     so it is not quoted twice. -->
				<strong class="figure" style:color={soonest.tone}>{untilFull(soonest.daysToFull)} to full</strong>
			{:else}
				<strong class="figure steady">No growth to project</strong>
			{/if}
		</div>

		<div class="plot">
			<div class="scale">
				{#each [...PERCENT_GRID].reverse() as level (level)}
					<span class="tick">{pct(level)}</span>
				{/each}
			</div>

			<div class="canvas" bind:clientWidth={width} bind:clientHeight={height}>
				{#each PERCENT_GRID as level (level)}
					<i class="gridline" style="top: {y(level)}px; left: {PAD.left}px; right: {PAD.right}px"></i>
				{/each}

				<i class="divider" style="left: {x(0)}px; top: {PAD.top}px; bottom: {PAD.bottom}px"></i>

				<svg viewBox="0 0 {width} {height}" aria-hidden="true">
					{#each traces as trace (trace.id)}
						<g style:color={trace.tone}>
							<path class="history" d={trace.line} />
							{#if trace.projection}
								<path class="projection" d={trace.projection} />
							{/if}
							{#each trace.marks as mark}
								<circle cx={mark.x} cy={mark.y} r="1.8" />
							{/each}
						</g>
					{/each}
				</svg>
			</div>

			<div class="ticks">
				{#each ticks as tick (tick.label)}
					<span class="tick" style="left: {x(tick.at)}px" class:at-now={tick.divider}>{tick.label}</span>
				{/each}
			</div>
		</div>

		<dl class="legend">
			{#each traces as trace (trace.id)}
				<div>
					<dt class="eyebrow" style:color={trace.tone}><i></i>{trace.label}</dt>
					<dd>{bytes(trace.usedNow)} / {bytes(trace.totalNow)}</dd>
					<dd>{perDay(trace.growthPerDay)}</dd>
				</div>
			{/each}
		</dl>
	</div>
{:else}
	<Placeholder note="capacity horizon — no used-space history yet" lines={11} />
{/if}

<style>
	.horizon {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 0.5rem;
		height: 100%;
	}

	.head {
		display: grid;
		gap: 0.3rem;
	}

	/* A footnote to the number under it rather than a label on the box, so it is
	   set a step down from the small caps elsewhere. */
	.caption {
		margin: 0;
		font-size: 0.58rem;
		letter-spacing: 0.12em;
	}

	.head strong {
		font-size: clamp(1.3rem, 2.4vw, 1.9rem);
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	.steady {
		color: var(--text-dim);
	}

	/* The same gutter and floor every other graph keeps, with a row under the
	   drawing for the time axis. */
	.plot {
		grid-template-rows: minmax(4rem, 1fr) auto;
	}

	.canvas {
		position: relative;
		min-height: 0;
	}

	svg {
		position: absolute;
		display: block;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* Where the measured part ends and the guess begins. Brighter than the grid it
	   crosses rather than a heavier dash, so every dotted line keeps the one
	   rhythm. */
	.divider {
		position: absolute;
		width: 1px;
		color: var(--text-faint);
		background-image: var(--dot-column);
	}

	.history {
		fill: none;
		stroke: currentcolor;
		stroke-linejoin: round;
		stroke-width: 1.5;
	}

	/* Dotted, because it has not happened. */
	.projection {
		fill: none;
		stroke: currentcolor;
		stroke-dasharray: 1 4;
		stroke-linecap: round;
		stroke-width: 1.5;
	}

	circle {
		fill: currentcolor;
	}

	.ticks {
		position: relative;
		grid-column: 2;
		height: 0.8rem;
	}

	.ticks span {
		position: absolute;
		top: 0;
		text-transform: uppercase;
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.ticks .at-now {
		color: var(--text-dim);
	}

	.legend {
		display: grid;
		gap: 0.2rem;
		margin: 0;
	}

	.legend div {
		display: grid;
		grid-template-columns: minmax(4.5rem, auto) 1fr auto;
		gap: 0.75rem;
		align-items: baseline;
	}

</style>
