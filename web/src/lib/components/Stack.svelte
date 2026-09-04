<script>
	import { markY, VIEW } from '$lib/chart.js';
	import { bytes, pct } from '$lib/format.js';
	import Placeholder from './Placeholder.svelte';
	import TimeAxis from './TimeAxis.svelte';

	/* Shares of one whole over time, stacked from the floor up. `bands` is
	   [{ id, label, tone, nowBytes, points }], points are [unixSeconds, percent]
	   summing to 100 at any moment, stacked in order against a fixed 0-100 scale. */
	let { bands = [], note = 'no history yet' } = $props();

	/* Quarters — as fine as a scale can be labelled at these heights and still read. */
	const GRID = [0, 25, 50, 75, 100];

	const y = (percent) => markY(Math.min(100, Math.max(0, percent)), [0, 100]);

	/* One filled area per band, along its top edge then back along whatever it
	   sits on. Bands share a clock, so x is by index's own timestamp. */
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
			<!-- Under the bands, and a level to read them against. -->
			{#each GRID as level (level)}
				<i class="gridline" style="top: {100 - level}%"></i>
			{/each}

			<!-- Decorative: the legend under it carries the same three numbers in
			     words. -->
			<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
				{#each areas as area (area.id)}
					<path d={area.d} style:color={area.tone} />
				{/each}
			</svg>
		</div>

		<div class="foot"><TimeAxis /></div>

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

	path {
		fill: currentcolor;
		fill-opacity: 0.75;
		stroke: currentcolor;
		stroke-width: 0.5;
		vector-effect: non-scaling-stroke;
	}

	/* One entry per band: what it is, what it comes to now. */
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

	/* No room for three across a phone: one band to a line. */
	@media (max-width: 52rem) {
		.legend {
			grid-auto-flow: row;
			gap: 0.2rem;
		}
	}
</style>
