<script>
	import { VIEW } from '$lib/chart.js';
	import { bytes, pct } from '$lib/format.js';
	import Placeholder from './Placeholder.svelte';

	/* Shares of one whole over time, stacked from the floor up.

	   `bands` is [{ id, label, tone, nowBytes, points }] where a point is
	   [unixSeconds, percent] and the bands of a moment add up to 100. They are
	   stacked in the order given and read against a fixed 0-100 scale, because the
	   question this chart answers — how the whole is divided — is only a question
	   about that scale. */
	let { bands = [], ticks = [], note = 'no history yet' } = $props();

	const GRID = [0, 25, 50, 75, 100];

	const y = (percent) =>
		VIEW.height - (Math.min(100, Math.max(0, percent)) / 100) * VIEW.height;

	/* One filled area per band: along its own top edge, then back along the top of
	   whatever it sits on. The bands share a clock, so the x of a point is its
	   index's own timestamp and the running total is by index. */
	let areas = $derived.by(() => {
		const clock = bands[0]?.points;
		if (!clock?.length || bands.some((band) => band.points.length !== clock.length)) return [];

		const t0 = clock[0][0];
		const dt = clock.at(-1)[0] - t0 || 1;
		const x = (i) => (((clock[i][0] - t0) / dt) * VIEW.width).toFixed(2);
		const at = (i, percent) => `${x(i)},${y(percent).toFixed(2)}`;

		let floor = clock.map(() => 0);

		return bands.map((band) => {
			const top = band.points.map(([, percent], i) => floor[i] + percent);
			const up = top.map((percent, i) => `${i ? 'L' : 'M'}${at(i, percent)}`);
			const back = floor.map((percent, i) => `L${at(i, percent)}`).reverse();

			floor = top;
			return { ...band, d: `${up.join(' ')} ${back.join(' ')} Z` };
		});
	});
</script>

{#if areas.length}
	<div class="plot">
		<div class="scale">
			{#each [...GRID].reverse() as level (level)}
				<span class="tick">{pct(level)}</span>
			{/each}
		</div>

		<div class="canvas">
			<!-- Decorative: the legend under it carries the same three numbers in
			     words. -->
			<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
				{#each GRID as level (level)}
					<line class="grid" x1="0" x2={VIEW.width} y1={y(level)} y2={y(level)} />
				{/each}

				{#each areas as area (area.id)}
					<path d={area.d} style:color={area.tone} />
				{/each}
			</svg>
		</div>

		{#if ticks.length}
			<div class="ticks foot">
				{#each ticks as tick (tick)}
					<span class="tick">{tick}</span>
				{/each}
			</div>
		{/if}

		<dl class="legend">
			{#each areas as area (area.id)}
				<div>
					<dt class="eyebrow" style:color={area.tone}><i></i>{area.label}</dt>
					<dd>{bytes(area.nowBytes)}</dd>
				</div>
			{/each}
		</dl>
	</div>
{:else}
	<Placeholder {note} lines={8} />
{/if}

<style>
	/* The drawing takes the height, the axis and the key take what they need. */
	.plot {
		grid-template-rows: minmax(4rem, 1fr) auto auto;
	}

	.canvas {
		position: relative;
		grid-column: 2;
		min-height: 0;
	}

	/* Out of flow: left in, the svg would claim a height from its own aspect ratio
	   and set how tall the row is. */
	svg {
		position: absolute;
		display: block;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	path {
		fill: currentcolor;
		fill-opacity: 0.75;
		stroke: currentcolor;
		stroke-width: 0.5;
		vector-effect: non-scaling-stroke;
	}

	/* Under the bands, since they are painted over it: the rules are there to read
	   a level off, not to divide the chart. */
	.grid {
		stroke: var(--color-border);
		stroke-dasharray: 1 4;
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	/* Spread across the drawing, since the ends of the row are the ends of the
	   window. */
	.ticks {
		display: flex;
		justify-content: space-between;
		text-transform: uppercase;
	}

	/* One entry a band, along the foot of the chart: what it is, and what it comes
	   to now. */
	.legend {
		display: grid;
		grid-column: 2;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 0.75rem;
		margin: 0.15rem 0 0;
	}

	.legend div {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: baseline;
	}

	/* The swatch sits with the name, so the pair is read as that band's. */
	.legend dt {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.58rem;
		letter-spacing: 0.12em;
	}

	.legend dt i {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 1px;
		background: currentcolor;
	}

	.legend dd {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.62rem;
	}

	/* No room for three across a phone: one band to a line. */
	@media (max-width: 52rem) {
		.legend {
			grid-auto-flow: row;
			gap: 0.2rem;
		}
	}
</style>
