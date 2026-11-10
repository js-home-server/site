<script>
	/* A quant tearsheet over the real weekly backtest, built from the site's own chart parts
	   (.plot, .axis, .tick, .gridline, .trace in app.css): equity on a log axis, drawdown
	   under it, the headline figures beside it. Figures are XSFLOW-R, from orderflow-alpha's
	   intraday/results/xsflow_r.txt. */
	import equity from '$lib/data/xsflow-equity.json';

	const STATS = [
		['Net Sharpe', '2.39'],
		['OOS Sharpe', '2.66'],
		['t-stat', '6.10'],
		['Return/yr', '43.5%'],
		['Max DD', '−16.7%'],
		['Turnover/yr', '27.7×']
	];
	const MULTIPLES = [2, 4, 8, 16];
	const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

	/* The top of the log axis, just above the last multiple. */
	const TOP = Math.log10(17);

	const last = equity.xsflowR.length - 1;
	const step = equity.stepDays * 86_400;
	const x = (i) => (i / last) * 100;
	const y = (multiple) => (1 - Math.log10(Math.max(multiple, 1)) / TOP) * 100;
	const yearAt = (year) => x((Date.UTC(year, 0, 1) / 1000 - equity.start) / step);

	let peak = 1;
	const drawdown = equity.xsflowR.map((v) => {
		peak = Math.max(peak, v);
		return 1 - v / peak;
	});
	/* Weekly points miss the intraday trough, so the band is scaled to what it plots and the
	   true worst (hourly) is the Max DD figure beside it. */
	const deepest = Math.max(...drawdown);

	const curve = equity.xsflowR.map((v, i) => `${x(i)},${y(v)}`).join(' ');
	const underwater = `0,0 ${drawdown.map((d, i) => `${x(i)},${(d / deepest) * 100}`).join(' ')} 100,0`;
</script>

<div class="tear">
	<div class="plot">
		<div class="axis">
			{#each MULTIPLES as multiple (multiple)}
				<span class="tick" style:top="{y(multiple)}%">{multiple}×</span>
			{/each}
		</div>
		<div class="canvas">
			{#each MULTIPLES as multiple (multiple)}
				<i class="gridline" style:top="{y(multiple)}%"></i>
			{/each}
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
				<polyline class="trace" points={curve} />
			</svg>
		</div>
		<div class="canvas under">
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={underwater} /></svg>
			<span class="tick">drawdown</span>
		</div>
		<div class="foot">
			{#each YEARS as year (year)}
				<span class="tick" style:left="{yearAt(year)}%">{year}</span>
			{/each}
		</div>
	</div>

	<dl>
		{#each STATS as [label, value] (label)}
			<div>
				<dt class="eyebrow">{label}</dt>
				<dd>{value}</dd>
			</div>
		{/each}
	</dl>
</div>

<style>
	.tear {
		--rail: 10rem;

		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--rail);
		grid-template-rows: minmax(0, 1fr);
		height: 100%;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.25;
		white-space: nowrap;
	}

	/* app.css's .plot, given a drawdown band and a year row under the equity canvas. */
	.plot {
		grid-template-rows: minmax(0, 2.4fr) minmax(0, 1fr) auto;
		min-height: 0;
		padding: var(--space-sm) var(--space-sm) var(--space-xs) 0;
	}

	.trace {
		color: var(--violet);
		vector-effect: non-scaling-stroke;
	}

	/* A solid rule, not dots: it divides the two drawings rather than measuring either. */
	.under {
		grid-row: 2;
		border-top: var(--rule);
	}

	polygon {
		fill: color-mix(in srgb, var(--coral) 55%, transparent);
	}

	.under .tick {
		position: absolute;
		right: 0;
		bottom: 0;
	}

	.foot {
		position: relative;
		height: 1.25em;
	}

	.foot .tick {
		position: absolute;
		transform: translateX(-50%);
	}

	/* Read like the dashboard's tables: a quiet label, the reading, a rule between rows. */
	dl {
		display: grid;
		grid-auto-rows: minmax(0, 1fr);
		min-height: 0;
		margin: 0;
		padding: 0 var(--space-sm);
		border-left: var(--rule);
		background: var(--surface);
	}

	dl div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	dl div + div {
		border-top: var(--rule);
	}

	dd {
		margin: 0;
	}

	/* The figures only earn their width once the plots still have room beside them. */
	@container (max-width: 25rem) {
		.tear {
			grid-template-columns: minmax(0, 1fr);
		}

		dl {
			display: none;
		}
	}
</style>
