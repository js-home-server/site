<script>
	import { bytes, pct, perDay, untilFull } from '$lib/format.js';
	import { MONTH_RANGE } from '$lib/server.svelte.js';
	import { bucket } from '$lib/stats.js';
	import Panel from './Panel.svelte';
	import Placeholder from './Placeholder.svelte';

	/* Where one volume has been and where that puts it. `volume` is shaped by
	   $lib/storage.js: it carries its own percent series, its current size, and the
	   rate it is filling.

	   One volume and not a list of them, because both axes are narrowed to its own
	   range: a second trace drawn against a scale fitted to the first would be
	   somewhere it does not belong. Two drives compared is the pair of these the
	   storage section stands side by side. `label` names which one, since a box
	   standing apart from the other has to say that itself. */
	let { volume = null, label = `${MONTH_RANGE} used space history & projection` } = $props();

	const DAY = 86_400;
	const MONTH = 30.44 * DAY;

	/* Each half of the axis, back and forward alike: the divider sits in the
	   middle and a slope reads the same either side of it. */
	const SPAN = 12 * MONTH;

	/* One dot per bucket rather than per sample: the series steps every two hours,
	   which is more marks than a line this wide can show apart. */
	const HISTORY_POINTS = 24;

	/* The projection is straight in time but the axis is not: sampled rather than
	   drawn end to end, or a line that should curve upward toward the ceiling
	   would cut the corner as a chord instead. */
	const PROJECTION_POINTS = 24;

	/* Nothing is drawn from a single reading: one point is a position, not a
	   history, and it has no slope to carry forward. */
	let disk = $derived(volume?.points?.length > 1 ? volume : null);

	/* Everything is measured from the last reading the API returned, not from the
	   clock: that is where the history ends and the projection starts. */
	let now = $derived(disk ? disk.points.at(-1)[0] : 0);

	/* The chart is drawn at the size it is rendered, so a dot is round and a dash
	   is the same length wherever it falls. */
	let width = $state(0);
	let height = $state(0);

	const PAD = { top: 6, right: 8, bottom: 4, left: 4 };
	let plot = $derived({
		width: Math.max(0, width - PAD.left - PAD.right),
		height: Math.max(0, height - PAD.top - PAD.bottom)
	});

	/* Where the axis stops reading as a ruler and starts reading as a horizon: inside
	   this many seconds of now, a day costs roughly its own width; beyond it, a day
	   costs less the further out it falls. The history is a month, so a knee of a
	   few days leaves that month legible without giving the distant projection the
	   same width a mostly-empty year would otherwise get. */
	const LOG_KNEE = 4 * DAY;
	const LOG_SPAN = Math.log1p(SPAN / LOG_KNEE);

	/* Seconds either side of now, to a fraction of the axis and then to pixels. Now
	   is the middle; anything past the ends of the window sits on them. Symmetric
	   log rather than linear, so the run of history and the near end of a
	   projection sit where the resolution is, and a slow drive's ceiling years out
	   still lands on the chart instead of running off the scale needed to show it. */
	const along = (seconds) => {
		const clamped = Math.max(-SPAN, Math.min(SPAN, seconds));
		const reach = Math.log1p(Math.abs(clamped) / LOG_KNEE) / LOG_SPAN;
		return 0.5 * (1 + Math.sign(clamped) * reach);
	};

	let x = $derived((seconds) => PAD.left + along(seconds) * plot.width);

	/* Where the volume is headed, as a share of itself, so many seconds out. The
	   ceiling of the y axis and the dotted line that reaches it are the same
	   extrapolation and are worked out once. Null for a volume that is not filling,
	   or does not yet know how big it is: there is no line to draw, and flat dots
	   to the horizon would claim it stays exactly as it is, which is not what the
	   numbers say. */
	let project = $derived(
		disk?.growthPerDay > 0 && disk.totalNow
			? (seconds) => ((disk.usedNow + (disk.growthPerDay * seconds) / DAY) / disk.totalNow) * 100
			: null
	);

	/* The low and high the axis is drawn against: the floor the data has actually
	   touched, and where a year of the current rate puts it — both with a tenth of
	   headroom so a trace never sits flush on the frame. A volume with nothing to
	   project has no year-out point to reach for, so the ceiling falls back to the
	   highest the history itself has touched — still the volume's own range rather
	   than a single repeated reading. */
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

	/* The past, thinned to a readable number of marks, the line that joins them,
	   and the projection carrying on from the last of them. The projection stops at
	   the ceiling rather than running along it: where it meets 100% is when the
	   volume is full. */
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

	/* A fixed interval in time bunches up under a log axis the further it runs from
	   now, so past a point two labels land closer than either is wide. Dropped
	   rather than shrunk or rotated: a tick with nothing to say is better than one
	   nobody can read. */
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

	/* The gutter's own rules: an even five-way split of `yDomain`, the same way the
	   fixed 0-100% scale every other percent chart on the page draws was always
	   just an even split of its own (fixed) domain. */
	let yTicks = $derived.by(() => {
		const [lo, hi] = yDomain;
		return Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
	});
</script>

{#if trace}
	<div class="horizon">
		<!-- The window the series was asked for, read from the request itself, so
		     the title cannot claim a history that was never fetched. -->
		<Panel {label}>
			{#if disk.daysToFull}
				<!-- The rate behind this date is the one on the legend row below, so it
				     is not quoted twice. -->
				<strong class="figure" style:color={disk.tone}>{untilFull(disk.daysToFull)} to full</strong>
			{:else}
				<strong class="figure steady">No growth to project</strong>
			{/if}
		</Panel>

		<div class="plot">
			<!-- Placed rather than spread: `yDomain` moves with the volume, so a label
			     has to sit level with the rule it names. -->
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
					<!-- Unkeyed: two buckets can land on the same pixel at the far end of
					     a log axis, so a mark's position is not an identity. -->
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

	/* The one place a figure is a sentence rather than a number, so it is the one
	   that takes the small caps the section headings are set in. */
	.horizon strong {
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

	/* Where the measured part ends and the guess begins. Brighter than the grid it
	   crosses rather than a heavier dash, so every dotted line keeps the one
	   rhythm. */
	.divider {
		position: absolute;
		width: 1px;
		color: var(--text-faint);
		background-image: var(--dot-column);
	}

	/* Heavier than the traces on the graphs above: this one is a month of history
	   read at a glance rather than a line in a stack of them. */
	.trace {
		stroke-width: 1.5;
	}

	/* Dotted, because it has not happened. Its own rhythm rather than the shared
	   dash, which is there to tell two lines apart — this is one line saying that
	   half of it is a guess. */
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
