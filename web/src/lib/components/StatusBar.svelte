<script>
	import Spark from './Spark.svelte';
	import TimeAxis from './TimeAxis.svelte';
	import { degrees, ms } from '$lib/format.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { bucket, mean, minMax, outages, percentile, values } from '$lib/stats.js';

	const BAR_PITCH = 2; /* px a bar needs to read as one: its ink and its gap */
	const MAX_SEGMENTS = 96;

	$effect(watch);

	let snapshot = $derived(server.snapshot);
	/* The API's own history, each series a list of [unixSeconds, value]. status is
	   1 for up, 0 for down, fractional for part of a bucket. */
	let series = $derived(server.series);

	let online = $derived(snapshot?.availability.server_status === 'online');

	let temps = $derived(series?.cpu.temperature_c ?? []);
	let latencies = $derived(series?.availability.latency_ms ?? []);
	let uptime = $derived(series?.availability.status ?? []);

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

	/* One entry per reading. Everything the markup needs is settled here, so the
	   template stays a list of readings rather than a pile of ternaries. The whole
	   bar is one box now, and the one link in it is the lede's — so these no longer
	   carry a section of the dashboard to point at. */
	let cards = $derived([
		{
			label: 'Uptime',
			value: online && Number.isFinite(snapshot.availability.uptime_seconds)
				? Math.floor(snapshot.availability.uptime_seconds / 3600)
				: '—',
			unit: online && Number.isFinite(snapshot.availability.uptime_seconds) ? 'h' : '',
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
			value: Number.isFinite(snapshot?.cpu.temperature_c) ? Math.round(snapshot.cpu.temperature_c) : '—',
			/* Degrees hug their number, word units take a space. Both carry the
			   unit at every mention, headline and stats alike. */
			unit: Number.isFinite(snapshot?.cpu.temperature_c) ? '°C' : '',
			tight: true,
			tone: 'amber',
			stats: minMax(temps, degrees),
			points: temps
		},
		{
			label: 'Latency',
			value: Number.isFinite(snapshot?.availability.latency_ms)
				? Math.round(snapshot.availability.latency_ms)
				: '—',
			unit: Number.isFinite(snapshot?.availability.latency_ms) ? 'ms' : '',
			tone: 'azure',
			/* Average and tail rather than the floor and ceiling the card beside
			   it shows: a slow probe is a slow probe, and the best case a link
			   ever managed says nothing about the one you are on. */
			stats: latencies.length
				? `AVG ${ms(mean(values(latencies)))} · P95 ${ms(percentile(values(latencies), 0.95))}`
				: 'NO HISTORY YET',
			points: latencies
		}
	]);

	let uptimeLabel = $derived(
		segments.length
			? `Server uptime over the last ${spanLabel}: ${segments.filter((s) => s === 'up').length} of ${segments.length} intervals up`
			: 'Server uptime history unavailable'
	);
</script>

{#snippet metricCard({ label, value, unit, tight, tone, stats, points, strip })}
	<div class="metric">
		<h3 class="eyebrow">{label}</h3>
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
			<Spark {points} tone="var(--{tone})" />
		{/if}
		<TimeAxis range={spanLabel} />
	</div>
{/snippet}

<aside class="status-bar" aria-label="Live server status">
	<div class="lede">
		<h2 class="eyebrow">
			<!-- The same live dot the contact page wears, in the colour the box is
			     currently reading: mint while the probe is answering, coral when it
			     is not, so the claim below is never made by a bar that is down. -->
			<span class="dot" class:down={!online} aria-hidden="true"></span>
			Home server
		</h2>

		<p class="claim">Served from a box under my stairs. It seems to be working.</p>

		<a href="/server">View project <span aria-hidden="true">→</span></a>
	</div>

	<div class="metrics">
		{#each cards as card (card.label)}
			{@render metricCard(card)}
		{/each}
	</div>
</aside>

<style>
	/* One box now, not three: what it says on the left, what it is reading on the
	   right, divided by a single rule. --py/--px are carried by the two columns
	   rather than by the box, which is what runs that rule wall to wall without
	   the negative margins it would otherwise take to undo the padding. */
	.status-bar {
		/* The vertical inset the three separate cards each carried, kept exactly,
		   so the one box stands the same height on the page as the row it
		   replaces. */
		--py: 0.75rem;
		--px: 1.1rem;

		/* The box overlaps the bull and has to stay in front of it whatever the
		   art's paint order turns out to be — a mask or a filter on it would
		   otherwise lift it above plain blocks like this one. */
		position: relative;
		z-index: 1;
		display: grid;
		/* The claim is two sentences, so the column carrying it takes a bigger
		   share than a label would need: wide enough to set it in two lines, which
		   is what holds the box to the height of the row it replaced. */
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 2.45fr);
		/* Width comes from the parent (the bull's grid column on the landing
		   page); only cap it so it never runs off a narrow viewport. */
		width: 100%;
		max-width: calc(100vw - 2 * var(--gutter));
		/* The box sits off the bottom edge by exactly what the nav sits off the
		   top — same token, so the page is framed evenly however the header's
		   own padding resolves. The outer edges stay flush so it still measures
		   tip to tip with the art. */
		margin: 0 auto var(--nav-pad-top);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		/* Opaque: the bull sits directly behind this and a chart drawn over its
		   texture is unreadable. */
		background: var(--color-background);
	}

	h2,
	h3 {
		margin: 0;
	}

	/* What the box is, what that means, and where to go for the rest of it. The
	   link is pushed to the floor so it lands level with the graphics beside it
	   however the claim above it wraps. */
	.lede {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: var(--py) var(--px);
	}

	.lede .dot {
		display: inline-block;
		width: 0.4rem;
		height: 0.4rem;
		margin-right: 0.35rem;
		border-radius: 50%;
		background: var(--mint);
		box-shadow: 0 0 0.5rem var(--mint);
	}

	.lede .dot.down {
		background: var(--coral);
		box-shadow: 0 0 0.5rem var(--coral);
	}

	/* The one line of prose in the hero, set in the face the name above it is —
	   this is a claim, not a reading, and the mono the rest of the box is written
	   in would file it as one. */
	.claim {
		margin: 0;
		color: var(--color-foreground);
		font-size: clamp(0.82rem, 1.05vw, 1.05rem);
		font-weight: 700;
		letter-spacing: -0.015em;
		line-height: 1.3;
		/* Balanced: at two lines this is a heading's problem, not a paragraph's —
		   the sentence break wants to fall evenly rather than leave an orphan. */
		text-wrap: balance;
	}

	.lede a {
		margin-top: auto;
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-decoration: none;
		text-transform: uppercase;
	}

	.lede a:hover span,
	.lede a:focus-visible span {
		display: inline-block;
		transform: translateX(2px);
	}

	.metrics {
		display: grid;
		/* Equal cells that divide the space exactly, however wide it is and
		   however many readings there are. The scroll container is what keeps
		   this off the parent's intrinsic width, so the box can never widen the
		   column it is measured from. */
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 1.25rem;
		padding: var(--py) var(--px);
		/* The divider, and the only rule inside the box. */
		border-left: 1px solid var(--color-border);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	/* No frame of its own any more — the box around all three is the frame, and
	   these are columns of type standing in it. */
	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		/* Room for the graphic and the window caption beneath it. */
		min-height: 5.4rem;
	}

	/* Every card ends in a graphic of the same height, pinned to the foot of the
	   box. The auto margin is what keeps them level when one card's stats line
	   wraps and another's does not — Spark carries the same pair for the two cards
	   that end in a trace.

	   Every bar takes that full height, which is the height of those traces: this is
	   a band of colour across the window, not a chart with a reading to stand at. */
	.history {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 1px;
		height: 1.85rem;
		margin-top: auto;
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

	/* One tone class per metric, worn by the value; the trace beside it is passed
	   the same token, so the two can never drift apart. */
	.mint {
		color: var(--mint);
	}

	.amber {
		color: var(--amber);
	}

	.azure {
		color: var(--azure);
	}

	/* Two columns will not divide a phone: the claim goes above the readings it
	   introduces, and the rule that divided them turns to lie between them. */
	@media (max-width: 48rem) {
		.status-bar {
			grid-template-columns: minmax(0, 1fr);
		}

		.metrics {
			gap: 0.5rem;
			border-top: 1px solid var(--color-border);
			border-left: 0;
		}

		.metric {
			min-height: 5.9rem;
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
