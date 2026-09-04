<script>
	import { bytes, pct, perDay, untilFull } from '$lib/format.js';
	import { MONTH_RANGE } from '$lib/server.svelte.js';
	import { bucket } from '$lib/stats.js';
	import Panel from './Panel.svelte';
	import Placeholder from './Placeholder.svelte';

	/* One volume, not a list: both axes fit its own range, so a second trace on
	   the same scale would sit somewhere it doesn't belong. Compare two drives
	   by standing two of these side by side instead. `volume` is shaped by $lib/storage.js. */
	let { volume = null, label = `${MONTH_RANGE} used space history & projection` } = $props();

	const DAY = 86_400;
	const MONTH = 30.44 * DAY;

	/* Same span back and forward — divider sits in the middle, a slope reads the same either side. */
	const SPAN = 12 * MONTH;

	/* One dot per bucket, not per sample — the series steps every two hours, too many marks for this width. */
	const HISTORY_POINTS = 24;

	/* Sampled, not drawn end to end — the axis isn't linear, so a straight projection needs points to curve through. */
	const PROJECTION_POINTS = 24;

	/* One point is a position, not a history — no slope to carry forward. */
	let disk = $derived(volume?.points?.length > 1 ? volume : null);

	/* Measured from the API's last reading, not the clock — that's where history ends and projection starts. */
	let now = $derived(disk ? disk.points.at(-1)[0] : 0);

	/* Drawn at render size, so a dot stays round and a dash stays constant length. */
	let width = $state(0);
	let height = $state(0);

	const PAD = { top: 6, right: 8, bottom: 4, left: 4 };
	let plot = $derived({
		width: Math.max(0, width - PAD.left - PAD.right),
		height: Math.max(0, height - PAD.top - PAD.bottom)
	});

	/* Inside this many seconds of now a day costs its own width; beyond it, less
	   the further out — keeps the month of real history legible without wasting
	   width on a mostly-empty year. */
	const LOG_KNEE = 4 * DAY;
	const LOG_SPAN = Math.log1p(SPAN / LOG_KNEE);

	/* Symmetric log, not linear — near-now stays legible and a slow drive's distant ceiling still fits on the chart. */
	const along = (seconds) => {
		const clamped = Math.max(-SPAN, Math.min(SPAN, seconds));
		const reach = Math.log1p(Math.abs(clamped) / LOG_KNEE) / LOG_SPAN;
		return 0.5 * (1 + Math.sign(clamped) * reach);
	};

	let x = $derived((seconds) => PAD.left + along(seconds) * plot.width);

	/* Null when a volume isn't filling or doesn't know its size yet — better no line than a flat one implying it stays put. */
	let project = $derived(
		disk?.growthPerDay > 0 && disk.totalNow
			? (seconds) => ((disk.usedNow + (disk.growthPerDay * seconds) / DAY) / disk.totalNow) * 100
			: null
	);

	/* Floor = lowest touched, ceiling = a year out at the current rate (or the history's own high if there's nothing to project). 10% headroom either way. */
	let yDomain = $derived.by(() => {
		if (!disk) return [0, 100];

		const seen = disk.points.map(([, p]) => p).filter(Number.isFinite);
		const values = seen.length ? seen : [disk.percentNow ?? 0];
		const lo = Math.min(...values);
		const hi = project ? project(SPAN) : Math.max(...values, disk.percentNow ?? lo);

		return [lo * 1.1, hi * 1.1];
	});

	let y = $derived((percent) => {
		const [lo, hi] = yDomain;
		const level = Math.min(100, Math.max(0, percent));
		return PAD.top + (1 - (level - lo) / (hi - lo || 1)) * plot.height;
	});

	/* Projection stops at 100%, not the axis ceiling — that's the moment the volume is actually full. */
	let trace = $derived.by(() => {
		if (!disk) return null;

		const t0 = Math.max(disk.points[0][0], now - SPAN);
		const inWindow = disk.points.filter(([t]) => t >= t0);
		const step = (now - t0) / Math.max(1, Math.min(HISTORY_POINTS, inWindow.length) - 1);

		const marks = bucket(inWindow, HISTORY_POINTS)
			.map((value, i) => (value === null ? null : { x: x(t0 - now + i * step), y: y(value) }))
			.filter(Boolean);

		const end = Math.min(SPAN, (disk.daysToFull ?? Infinity) * DAY);

		return {
			marks,
			line: marks.map((m, i) => `${i ? 'L' : 'M'}${m.x.toFixed(1)},${m.y.toFixed(1)}`).join(' '),
			projection: project
				? Array.from({ length: PROJECTION_POINTS + 1 }, (_, i) => {
						const t = (end * i) / PROJECTION_POINTS;
						return `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(project(t)).toFixed(1)}`;
					}).join(' ')
				: ''
		};
	});

	/* Same marks either side of now, so the two halves compare directly. Switches to years once months stop being picturable. */
	const TICK_MONTHS = 3;

	const monthLabel = (months) => (months >= 12 ? `${months / 12}y` : `${months}m`);

	/* Counted out from the divider, so the halves mirror each other whatever SPAN is. */
	const steps = Array.from(
		{ length: Math.floor(SPAN / MONTH / TICK_MONTHS) },
		(_, i) => (i + 1) * TICK_MONTHS
	);

	/* Fixed intervals bunch up on a log axis — dropped rather than shrunk, since an unreadable tick says nothing anyway. */
	const MIN_TICK_GAP = 34;

	let kept = $derived.by(() => {
		const out = [];
		let last = x(0);
		for (const m of steps) {
			const at = x(m * MONTH);
			if (at - last < MIN_TICK_GAP) continue;
			out.push(m);
			last = at;
		}
		return out;
	});

	let ticks = $derived([
		...[...kept].reverse().map((m) => ({ at: -m * MONTH, label: `-${monthLabel(m)}` })),
		{ at: 0, label: 'Now', divider: true },
		...kept.map((m) => ({ at: m * MONTH, label: `+${monthLabel(m)}` }))
	]);

	/* Even five-way split of `yDomain`, same idea as every fixed 0-100% chart's gridlines, just against a domain that moves. */
	let yTicks = $derived.by(() => {
		const [lo, hi] = yDomain;
		return Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
	});
</script>

{#if trace}
	<div class="horizon">
		<!-- Read from the request itself, so the title can't claim history that was never fetched. -->
		<Panel {label}>
			{#if disk.daysToFull}
				<!-- The rate is on the legend row below — not quoted twice. -->
				<strong class="figure" style:color={disk.tone}>{untilFull(disk.daysToFull)} to full</strong>
			{:else}
				<strong class="figure steady">No growth to project</strong>
			{/if}
		</Panel>

		<div class="plot">
			<!-- Placed, not spread — `yDomain` moves, so a label must sit level with the rule it names. -->
			<div class="axis">
				{#each yTicks as level (level)}
					<span class="tick" style="top: {y(level)}px">{pct(level)}</span>
				{/each}
			</div>

			<div class="canvas" bind:clientWidth={width} bind:clientHeight={height}>
				{#each yTicks as level (level)}
					<i class="gridline" style="top: {y(level)}px; left: {PAD.left}px; right: {PAD.right}px"></i>
				{/each}

				<i class="divider" style="left: {x(0)}px; top: {PAD.top}px; bottom: {PAD.bottom}px"></i>

				<svg viewBox="0 0 {width} {height}" aria-hidden="true" style:color={disk.tone}>
					<path class="trace" d={trace.line} />
					{#if trace.projection}
						<path class="trace projection" d={trace.projection} />
					{/if}
					<!-- Unkeyed — two buckets can share a pixel at the far end of a log axis. -->
					{#each trace.marks as mark}
						<circle cx={mark.x} cy={mark.y} r="1.8" />
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
			<div>
				<dt class="eyebrow" style:color={disk.tone}><i></i>{disk.label}</dt>
				<dd>{bytes(disk.usedNow)} / {bytes(disk.totalNow)}</dd>
				<dd>{perDay(disk.growthPerDay)}</dd>
			</div>
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

	/* The one figure that's a sentence, not a number — gets the heading's small caps. */
	.horizon strong {
		text-transform: uppercase;
	}

	.steady {
		color: var(--text-dim);
	}

	/* Same gutter/floor as every other graph, plus a row for the time axis. */
	.plot {
		grid-template-rows: minmax(4rem, 1fr) auto;
	}

	/* Where measured ends and guessed begins. Brighter than the grid, not a heavier dash, so dotted lines keep one rhythm. */
	.divider {
		position: absolute;
		width: 1px;
		color: var(--text-faint);
		background-image: var(--dot-column);
	}

	/* Heavier than other graphs' traces — a month of history read at a glance, not a line in a stack. */
	.trace {
		stroke-width: 1.5;
	}

	/* Dotted because it hasn't happened yet — one line saying half of it is a guess. */
	.projection {
		stroke-dasharray: 1 4;
		stroke-linecap: round;
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
		font-family: var(--font-mono);
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
