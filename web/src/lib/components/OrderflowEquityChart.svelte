<script>
	import { chart, VIEW } from '$lib/chart.js';
	import equity from '$lib/data/xsflow-equity.json';

	/* The strategy's own equity curve — pulled out of OrderflowStudy.svelte's
	   "The strategy" section so the project card's FIG. 01 can show the actual
	   result the archive was built for, rather than the collector's own
	   uptime chart. Same source: the backtest's hourly net P&L, compounded
	   and sampled weekly (340 points), first book against the re-engineered
	   one that replaced it. */

	const WEEK = 7 * 86400;
	const points = (key) => equity[key].map((v, i) => [equity.start + i * WEEK, Math.log10(v)]);

	/* Log, and said so under the chart. A compounding curve on a linear axis is
	   a picture of the last year and a flat line for the first five. */
	const DOMAIN = [0, Math.log10(20)];
	const TICKS = [1, 2, 5, 10, 20];

	/* Dashed as well as grey for the first book, solid violet for the one that
	   replaced it: the two curves sit on top of each other for four of the six
	   years, and colour alone would not separate them for everyone. */
	const curves = [
		{ id: 'xsflow', label: 'XSFLOW', tone: 'var(--text-faint)', dashed: true, d: chart(points('xsflow'), DOMAIN) },
		{ id: 'xsflowR', label: 'XSFLOW-R', tone: 'var(--violet-ink)', d: chart(points('xsflowR'), DOMAIN) }
	];

	const span = { from: equity.start, to: equity.start + (equity.xsflow.length - 1) * WEEK };
	const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
	const atYear = (y) => ((Date.UTC(y, 0, 1) / 1000 - span.from) / (span.to - span.from)) * 100;
	const atValue = (v) => (1 - (Math.log10(v) - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * 100;
</script>

<div class="chart">
	<div class="plot">
		<div class="ygutter">
			{#each TICKS as tick (tick)}
				<span class="ytick" style="top: {atValue(tick)}%">{tick}×</span>
			{/each}
		</div>

		<div class="canvas">
			{#each TICKS as tick (tick)}
				<i class="gridline" style="top: {atValue(tick)}%"></i>
			{/each}
			{#each YEARS as year (year)}
				<i class="vline" style="left: {atYear(year)}%"></i>
			{/each}

			<svg viewBox="0 0 {VIEW.width} {VIEW.height}" preserveAspectRatio="none" aria-hidden="true">
				{#each curves as curve (curve.id)}
					<path
						d={curve.d}
						class:dashed={curve.dashed}
						style:color={curve.tone}
						vector-effect="non-scaling-stroke"
					/>
				{/each}
			</svg>
		</div>

		<div class="xaxis">
			{#each YEARS as year (year)}
				<span style="left: {atYear(year)}%">{year}</span>
			{/each}
		</div>
	</div>

	<div class="key">
		{#each curves as curve (curve.id)}
			<span style:color={curve.tone}><i class:dashed={curve.dashed}></i>{curve.label}</span>
		{/each}
		<span class="note">equity, log scale · weekly · walk-forward Sharpe 1.08, net of costs at $10m</span>
	</div>
</div>

<style>
	.chart {
		display: grid;
		gap: 0.5rem;
		width: 100%;
	}

	.plot {
		display: grid;
		grid-template-columns: 1.9rem minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.25rem;
	}

	/* The scale in its own gutter, so no label is ever painted over the curve
	   it belongs to. */
	.ygutter {
		position: relative;
		grid-row: 1;
	}

	.ytick {
		position: absolute;
		right: 0;
		transform: translateY(-50%);
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.canvas {
		position: relative;
		grid-row: 1;
		height: 13rem;
	}

	.canvas svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.canvas path {
		fill: none;
		stroke: currentcolor;
		stroke-width: 1.6px;
		stroke-linejoin: round;
	}

	.canvas path.dashed {
		stroke-width: 1.2px;
		stroke-dasharray: 4 3;
	}

	.gridline,
	.vline {
		position: absolute;
		background: color-mix(in srgb, var(--color-border) 65%, transparent);
	}

	.gridline {
		left: 0;
		right: 0;
		height: 1px;
	}

	.vline {
		top: 0;
		bottom: 0;
		width: 1px;
	}

	.xaxis {
		position: relative;
		grid-column: 2;
		height: 0.8rem;
	}

	.xaxis span {
		position: absolute;
		transform: translateX(-50%);
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.key {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 1rem;
		padding-left: 2.15rem;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.key span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.key i {
		width: 0.9rem;
		border-top: 2px solid currentcolor;
	}

	.key i.dashed {
		border-top-style: dashed;
	}

	.note {
		display: block;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.5;
	}

	@media (max-width: 60rem) {
		.canvas {
			height: 10rem;
		}
	}
</style>
