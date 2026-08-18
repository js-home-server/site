<script>
	import { area, chart, VIEW } from '$lib/chart.js';
	import TimeAxis from './TimeAxis.svelte';
	import { server, watch } from '$lib/server.svelte.js';
	import { bucket, mean, outages, percentile } from '$lib/stats.js';

	const BAR_PITCH = 2; /* px a bar needs to read as one: its ink and its gap */
	const MAX_SEGMENTS = 96;

	$effect(watch);

	let snapshot = $derived(server.snapshot);
	/* The API's own history, each series a list of [unixSeconds, value]. status is
	   1 for up, 0 for down, fractional for part of a bucket. */
	let series = $derived(server.series);

	let online = $derived(snapshot?.server === 'online');

	const pointsOf = (key) => (Array.isArray(series?.[key]) ? series[key] : []);
	/* The readings on their own, which is all the summaries below need. */
	const valuesOf = (points) => points.map((p) => p[1]);

	let temps = $derived(pointsOf('cpuTemperatureC'));
	let latencies = $derived(pointsOf('latencyMs'));
	let uptime = $derived(pointsOf('status'));

	/* All three graphics share one x axis: the span the API actually returned,
	   which is at most `range` but less until it has been collecting that long.
	   Labelling the window from the data means the caption can never overstate
	   what the traces cover, and it grows into 24H on its own. */
	let spanSeconds = $derived(uptime.length > 1 ? uptime.at(-1)[0] - uptime[0][0] : 0);
	let spanLabel = $derived(
		spanSeconds >= 3600
			? `${Math.round(spanSeconds / 3600)}H`
			: spanSeconds > 0
				? `${Math.round(spanSeconds / 60)}M`
				: '—'
	);

	/* One bar per bucket of that same window, at the finest pitch the strip can
	   draw: a phone card is narrower than 96 bars and their gaps, and grid
	   answers that by shrinking every bar to nothing. Never more bars than
	   samples either, or the empty buckets between them read as outages. */
	let stripWidth = $state(0);
	let segmentCount = $derived(
		stripWidth ? Math.max(12, Math.min(MAX_SEGMENTS, Math.floor(stripWidth / BAR_PITCH))) : MAX_SEGMENTS
	);

	/* Any failed poll in the bucket makes it an outage, not most of them: a bar is
	   a quarter of an hour, and asking for the average of one is what let a
	   five-minute outage come out as a clean bar. A bucket the API had nothing for
	   is unknown, which is not the same as down and must not be drawn as if it
	   were. */
	let segments = $derived(
		bucket(uptime, segmentCount).map((v) => (v === null ? 'unknown' : v < 1 ? 'down' : 'up'))
	);

	/* Counted off the series itself rather than the bars drawn from it: a bar is a
	   quarter of an hour averaged, so a single failed poll inside one leaves it
	   above the half and the strip has nothing to show. The strip is a picture of
	   the window; this is the count, and the dashboard reads it the same way. */
	let incidents = $derived(outages(uptime));

	/* One entry per card. Everything the markup needs is settled here, so the
	   template stays a list of cards rather than a pile of ternaries.

	   `href` is the section of the dashboard that carries the same reading in full,
	   which for latency is the network section: this is the probe's round trip, and
	   that is where the rest of the link's readings are. */
	let cards = $derived([
		{
			label: 'Uptime',
			href: '/server#uptime',
			value: online ? Math.floor(snapshot.uptimeSeconds / 3600) : '—',
			unit: online ? 'h' : '',
			tone: 'mint',
			/* Silence is not the same as a clean record: with no series behind it
			   the strip cannot say anything about incidents either way. */
			stats: segments.length
				? incidents
					? `${incidents} INCIDENT${incidents > 1 ? 'S' : ''}`
					: 'NO INCIDENTS'
				: 'NO HISTORY YET',
			strip: true
		},
		{
			label: 'CPU Temp',
			href: '/server#cpu',
			value: snapshot ? Math.round(snapshot.cpuTemperatureC) : '—',
			/* Degrees hug their number, word units take a space. Both carry the
			   unit at every mention, headline and stats alike. */
			unit: snapshot ? '°C' : '',
			tight: true,
			tone: 'amber',
			stats: temps.length
				? `MIN ${Math.round(Math.min(...valuesOf(temps)))}°C · MAX ${Math.round(Math.max(...valuesOf(temps)))}°C`
				: 'NO HISTORY YET',
			path: chart(temps)
		},
		{
			label: 'Latency',
			href: '/server#network',
			value: snapshot ? Math.round(snapshot.latencyMs) : '—',
			unit: snapshot ? 'ms' : '',
			tone: 'azure',
			stats: latencies.length
				? `AVG ${Math.round(mean(valuesOf(latencies)))} ms · P95 ${Math.round(percentile(valuesOf(latencies), 0.95))} ms`
				: 'NO HISTORY YET',
			path: chart(latencies)
		}
	]);

	let uptimeLabel = $derived(
		segments.length
			? `Server uptime over the last ${spanLabel}: ${segments.filter((s) => s === 'up').length} of ${segments.length} intervals up`
			: 'Server uptime history unavailable'
	);
</script>

{#snippet metricCard({ label, value, unit, tight, tone, stats, path, strip })}
	<div class="metric">
		<h2 class="eyebrow">{label}</h2>
		<strong class="figure value {tone}">
			{value}{#if unit}<span class="unit" class:tight>{unit}</span>{/if}
		</strong>
		<span class="stats">{stats}</span>
		{#if strip}
			<div class="history" bind:clientWidth={stripWidth} role="img" aria-label={uptimeLabel}>
				{#each segments as state}
					<i class={state}></i>
				{/each}
			</div>
		{:else}
			<div class="chart {tone}">
				{#if path}
					<svg
						viewBox="0 0 {VIEW.width} {VIEW.height}"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path class="area" d={area(path)} />
						<path d={path} vector-effect="non-scaling-stroke" />
					</svg>
				{/if}
			</div>
		{/if}
		<TimeAxis range={spanLabel} />
	</div>
{/snippet}

<aside class="status-bar" aria-label="Live server status">
	<div class="metrics">
		{#each cards as card (card.label)}
			{@render metricCard(card)}
		{/each}
	</div>
</aside>

<style>
	.status-bar {
		/* The cards overlap the bull and have to stay in front of it whatever the
		   art's paint order turns out to be — a mask or a filter on it would
		   otherwise lift it above plain blocks like this one. */
		position: relative;
		z-index: 1;
		/* Width comes from the parent (the bull's grid column on the landing
		   page); only cap it so it never runs off a narrow viewport. */
		width: 100%;
		max-width: calc(100vw - 2 * var(--gutter));
		/* The cards sit off the bottom edge by exactly what the nav sits off the
		   top — same token, so the page is framed evenly however the header's
		   own padding resolves. The outer edges stay flush so the row still
		   measures tip to tip. */
		margin: 0 auto var(--nav-pad-top);
	}

	h2 {
		margin: 0;
	}

	.metrics {
		display: grid;
		/* Equal cells that divide the bar exactly, however wide it is and however
		   many metrics there are. The scroll container is what keeps this off the
		   parent's intrinsic width, so the bar can never widen the column it is
		   measured from. */
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 0.75rem;
		overflow-x: auto;
		scrollbar-width: thin;
	}

	/* These are the one place on the site that is still a card: they stand on the
	   bull rather than inside a box, so the frame is what makes each one a card
	   rather than three columns of loose text. */
	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		/* Room for the graphic and the window caption beneath it. */
		min-height: 5.4rem;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		/* Opaque: the bull sits directly behind these and a chart drawn over its
		   texture is unreadable. The gaps between boxes still show it. */
		background: var(--color-background);
	}

	/* Every card ends in a graphic of the same height, pinned to the foot of the
	   box. The auto margin is what keeps them level when one card's stats line
	   wraps and another's does not. */
	.chart,
	.history {
		height: 1.85rem;
		margin-top: auto;
	}

	/* Every bar the full height of the box, which is the height of the traces in the
	   cards beside it: this is a band of colour across the window, not a chart with
	   a reading to stand at. */
	.history {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 1px;
	}

	.history i {
		border-radius: 1px;
		/* The bare bar is unknown, not down: dim enough to read as "no data"
		   beside the mint, and never mistakable for an outage. */
		background: color-mix(in srgb, var(--mint) 12%, var(--color-background));
	}

	.history i.up {
		background: var(--mint);
	}

	.history i.down {
		background: var(--coral);
	}

	/* Smaller than a figure on the dashboard: three of these share the width of
	   the bull rather than a section of their own. */
	.value {
		color: var(--color-foreground);
		font-size: clamp(1.15rem, 1.65vw, 1.6rem);
		letter-spacing: -0.02em;
	}

	.unit {
		margin-left: 0.3em;
		font-size: 0.5em;
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	/* A degree sign belongs to its number; ms is a word and keeps its space. */
	.unit.tight {
		margin-left: 0.06em;
	}

	/* Cased by hand rather than by text-transform: the labels want small caps but
	   °C and ms are unit symbols and are wrong in any other case. */
	.stats {
		color: var(--text-dim);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.1em;
	}

	.chart {
		position: relative;
	}

	.chart svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.chart path {
		fill: none;
		stroke: currentcolor;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}

	/* The same shading the dashboard's traces carry: enough to give the line a
	   body, not enough to read as a colour of its own. */
	.chart path.area {
		fill: currentcolor;
		stroke: none;
		opacity: 0.12;
	}

	/* One tone class per metric, worn by both the value and its trace: the
	   stroke is currentcolor, so the two can never drift apart. */
	.mint {
		color: var(--mint);
	}

	.amber {
		color: var(--amber);
	}

	.azure {
		color: var(--azure);
	}

	@media (max-width: 48rem) {
		/* Three cells still divide a phone, but only if the frame around the
		   type gives way first: a card half off the edge reads as broken, a
		   tighter one does not. */
		.metrics {
			gap: 0.5rem;
		}

		.metric {
			min-height: 5.9rem;
			padding: 0.7rem 0.6rem;
		}

		.stats {
			font-size: 0.58rem;
			letter-spacing: 0.05em;
		}

		.eyebrow {
			letter-spacing: 0.08em;
		}
	}
</style>
