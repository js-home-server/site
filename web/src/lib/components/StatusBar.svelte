<script>
	import { onMount } from 'svelte';

	const HISTORY_RANGE = '24h';
	const STATUS_URL = '/api/status';
	const HISTORY_URL = `/api/history?range=${HISTORY_RANGE}`;
	const SNAPSHOT_MS = 30_000;
	const HISTORY_MS = 300_000; /* the series' own step: asking faster returns the same points */
	const BAR_PITCH = 2; /* px a bar needs to read as one: its ink and its gap */
	const MAX_SEGMENTS = 96;

	let snapshot = $state(null);
	/* The API's own history: { generatedAt, range, stepSeconds, status,
	   cpuTemperatureC, latencyMs }, each series a list of [unixSeconds, value].
	   status is 1 for up, 0 for down, fractional for part of a bucket. */
	let series = $state(null);

	const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

	const percentile = (values, p) => {
		const sorted = [...values].sort((a, b) => a - b);
		return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
	};

	let online = $derived(snapshot?.server === 'online');

	const pointsOf = (key) => (Array.isArray(series?.[key]) ? series[key] : []);

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

	/* An SVG path over the series, x by timestamp so a gap in collection reads as
	   a gap rather than being closed up. y is scaled to the series' own range
	   with a little headroom, so a flat trace still shows its shape and spikes
	   still have somewhere to go. */
	function chart(points) {
		if (points.length < 2) return '';

		const values = points.map((p) => p[1]);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = (max - min) * 0.15 || 1;
		const lo = min - pad;
		const span = max + pad - lo;
		const t0 = points[0][0];
		const dt = points.at(-1)[0] - t0 || 1;

		return points
			.map(([t, v], i) => {
				const x = ((t - t0) / dt) * 100;
				const y = 30 - ((v - lo) / span) * 30;
				return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}

	/* One bar per bucket of that same window, at the finest pitch the strip can
	   draw: a phone card is narrower than 96 bars and their gaps, and grid
	   answers that by shrinking every bar to nothing. Never more bars than
	   samples either, or the empty buckets between them read as outages. */
	let stripWidth = $state(0);
	let segmentCount = $derived(
		stripWidth ? Math.max(12, Math.min(MAX_SEGMENTS, Math.floor(stripWidth / BAR_PITCH))) : MAX_SEGMENTS
	);

	let segments = $derived.by(() => {
		if (uptime.length < 2) return [];

		const t0 = uptime[0][0];
		const dt = uptime.at(-1)[0] - t0 || 1;
		const count = Math.min(segmentCount, uptime.length);
		const buckets = Array.from({ length: count }, () => []);

		for (const [t, v] of uptime) {
			buckets[Math.min(count - 1, Math.floor(((t - t0) / dt) * count))].push(v);
		}

		/* A bucket the API had nothing for is unknown, which is not the same as
		   down and must not be drawn as if it were. */
		return buckets.map((b) => (b.length ? (mean(b) >= 0.5 ? 'up' : 'down') : 'unknown'));
	});

	/* Runs of down buckets, not down buckets: a two-hour outage is one incident,
	   however many bars it happens to cover. */
	let incidents = $derived(
		segments.reduce((n, s, i) => n + (s === 'down' && segments[i - 1] !== 'down' ? 1 : 0), 0)
	);

	/* One entry per card. Everything the markup needs is settled here, so the
	   template stays a list of cards rather than a pile of ternaries. */
	let cards = $derived([
		{
			label: 'Uptime',
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
			value: snapshot ? Math.round(snapshot.cpuTemperatureC) : '—',
			/* Degrees hug their number, word units take a space. Both carry the
			   unit at every mention, headline and stats alike. */
			unit: snapshot ? '°C' : '',
			tight: true,
			tone: 'amber',
			stats: temps.length
				? `MIN ${Math.round(Math.min(...temps.map((p) => p[1])))}°C · MAX ${Math.round(Math.max(...temps.map((p) => p[1])))}°C`
				: 'NO HISTORY YET',
			path: chart(temps)
		},
		{
			label: 'Latency',
			value: snapshot ? Math.round(snapshot.latencyMs) : '—',
			unit: snapshot ? 'ms' : '',
			tone: 'pink',
			stats: latencies.length
				? `AVG ${Math.round(mean(latencies.map((p) => p[1])))} ms · P95 ${Math.round(percentile(latencies.map((p) => p[1]), 0.95))} ms`
				: 'NO HISTORY YET',
			path: chart(latencies)
		}
	]);

	let uptimeLabel = $derived(
		segments.length
			? `Server uptime over the last ${spanLabel}: ${segments.filter((s) => s === 'up').length} of ${segments.length} intervals up`
			: 'Server uptime history unavailable'
	);

	const inFlight = new Set();

	async function load(key, url, apply) {
		if (inFlight.has(key)) return;
		inFlight.add(key);

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`${key} request failed: ${response.status}`);
			apply(await response.json());
		} catch {
			/* Keep the last good data on the wire dropping out; the next poll
			   picks it back up. */
		} finally {
			inFlight.delete(key);
		}
	}

	const loadSnapshot = () => load('status', STATUS_URL, (data) => (snapshot = data));
	const loadHistory = () => load('history', HISTORY_URL, (data) => (series = data));

	onMount(() => {
		const refresh = () => {
			if (document.hidden) return;
			loadSnapshot();
			loadHistory();
		};

		refresh();
		/* The headline numbers move every poll; the series only gains a point
		   every stepSeconds, so it is not worth re-fetching at the same rate. */
		const timers = [
			window.setInterval(() => !document.hidden && loadSnapshot(), SNAPSHOT_MS),
			window.setInterval(() => !document.hidden && loadHistory(), HISTORY_MS)
		];

		document.addEventListener('visibilitychange', refresh);
		return () => {
			timers.forEach(window.clearInterval);
			document.removeEventListener('visibilitychange', refresh);
		};
	});
</script>

{#snippet metricCard({ label, value, unit, tight, tone, stats, path, strip })}
	<div class="metric">
		<span class="label">{label}</span>
		<strong class="value {tone}">
			{value}{#if unit}<span class="unit" class:tight>{unit}</span>{/if}
		</strong>
		<span class="stats">{stats}</span>
		{#if strip}
			<div class="history" bind:clientWidth={stripWidth} role="img" aria-label={uptimeLabel}>
				{#each segments as state, i (i)}
					<i class={state}></i>
				{/each}
			</div>
		{:else}
			<div class="chart {tone}">
				{#if path}
					<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
						<path d={path} vector-effect="non-scaling-stroke" />
					</svg>
				{/if}
			</div>
		{/if}
		<span class="window"><span>{spanLabel}</span><span>NOW</span></span>
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

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		/* Room for the graphic and the window caption beneath it. */
		min-height: 5.4rem;
		/* The row is anchored at the foot of the page, so this is also what sets
		   where the top edge of the cards lands. */
		padding: 0.7rem 0.9rem;
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

	/* The traces carry no axis, so this is one: the span they cover on the left,
	   the present on the right, which is also the direction they are read in. */
	.window {
		display: flex;
		justify-content: space-between;
		margin-top: -0.1rem;
		color: var(--text-faint);
		font-size: 0.55rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1;
	}

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
		background: var(--pink);
	}

	.value {
		color: var(--color-foreground);
		font-size: clamp(1.15rem, 1.65vw, 1.6rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1;
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

	.label {
		color: var(--text-faint);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	/* One tone class per metric, worn by both the value and its trace: the
	   stroke is currentcolor, so the two can never drift apart. */
	.mint {
		color: var(--mint);
	}

	.amber {
		color: var(--amber);
	}

	.pink {
		color: var(--pink);
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

		.label {
			letter-spacing: 0.08em;
		}
	}
</style>
