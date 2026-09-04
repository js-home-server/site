<script>
	import Spark from './Spark.svelte';
	import TimeAxis from './TimeAxis.svelte';
	import ActionLink from './ActionLink.svelte';
	import UptimeStrip from './UptimeStrip.svelte';
	import { degrees, ms, span, stamp, uptimeHours } from '$lib/format.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { mean, minMax, outages, percentile, spanSeconds, values } from '$lib/stats.js';

	/* StatusBar only ever renders on the homepage, alongside the project card
	   this points at, so there is nowhere to navigate to — the card is already
	   on the page. Centred rather than jumped to the top the way an anchor
	   normally lands: this is a look, not a click the reader asked for. */
	function scrollToServerCard(event) {
		const card = document.getElementById('server');
		if (!card) return;
		event.preventDefault();
		card.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

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
	let spanLabel = $derived(span(spanSeconds(uptime), { short: true }));

	/* Counted off the series itself rather than the bars UptimeStrip draws from
	   it: a bar is a slice of the window averaged, so a single failed poll inside
	   one leaves it above the half and the strip has nothing to show. The strip
	   is a picture of the window; this is the count, and the dashboard reads it
	   the same way. */
	let incidents = $derived(outages(uptime));

	/* One entry per reading. Everything the markup needs is settled here, so the
	   template stays a list of readings rather than a pile of ternaries. The whole
	   bar is one box now, and the one link in it is the lede's — so these no longer
	   carry a section of the dashboard to point at. */
	let hours = $derived(online ? uptimeHours(snapshot?.availability.uptime_seconds) : null);

	let cards = $derived([
		{
			label: 'Uptime',
			value: hours ?? '—',
			unit: hours !== null ? 'h' : '',
			tone: 'mint',
			/* Silence is not the same as a clean record: with no series behind it
			   the strip cannot say anything about incidents either way. */
			stats: uptime.length > 1
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
</script>

{#snippet metricCard({ label, value, unit, tight, tone, stats, points, strip })}
	<div class="metric">
		<h3 class="eyebrow">{label}</h3>
		<strong class="figure value {tone}">
			{value}{#if unit}<span class="unit" class:tight>{unit}</span>{/if}
		</strong>
		<span class="stats">{stats}</span>
		{#if strip}
			<UptimeStrip {uptime} height="1.85rem" class="history" />
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

		<!-- role="status"/aria-live so a state flip is announced without a
		     visitor having to go find the dot — polite, and safe against spam,
		     since the text only changes value when `online` actually flips, not
		     on every 30s poll that leaves it the same. The wording itself is the
		     other half of the fix the comment above already claimed: colour
		     alone was carrying "down" before this, with the sentence still
		     insisting it was working. -->
		<p class="claim" role="status" aria-live="polite">
			Site served from a box under my stairs.
			{online ? "It seems to be working." : "It isn't answering right now."}
		</p>

		<!-- Same reading the dashboard's own rail-foot ends on (server/+layout.svelte)
		     — stamp() and all — so the two never say a different age for the same
		     snapshot. -->
		<p class="updated">
			<span class="eyebrow">Last updated</span>
			<span class="mono">{stamp(snapshot?.generated_at)}</span>
		</p>

		<ActionLink variant="cta" direction="site" href="#server" onclick={scrollToServerCard} class="lede-link">
			View project
		</ActionLink>
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
		/* The same gap every section on the site keeps from the one after it
		   (.page, app.css) — this box is the landing page's own first "card",
		   so it closes the same distance to Projects that Projects keeps to
		   About. The outer edges stay flush so it still measures tip to tip
		   with the art. */
		margin: 0 auto clamp(0.75rem, 1.5vh, 1.25rem);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
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
		font-size: var(--fs-base);
		font-weight: 700;
		letter-spacing: -0.015em;
		line-height: 1.3;
		/* Balanced: at two lines this is a heading's problem, not a paragraph's —
		   the sentence break wants to fall evenly rather than leave an orphan. */
		text-wrap: balance;
	}

	.updated {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: baseline;
		margin: 0;
	}

	.updated .mono {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	/* ActionLink's own .cta carries the look and size (--fs-sm, its default);
	   this is just the layout slot. */
	:global(.lede-link) {
		margin-top: auto;
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
	/* UptimeStrip's own layout and bar colours; this is only the card's slot for
	   it — level with Spark's own margin-top: auto in the card beside it. */
	:global(.history) {
		margin-top: auto;
	}

	/* Smaller than a figure on the dashboard: three of these share the width of
	   the bull rather than a section of their own. */
	.value {
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		letter-spacing: -0.02em;
	}

	.unit {
		margin-left: 0.3em;
		font-size: var(--fs-xs);
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
		font-size: var(--fs-xs);
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
			font-size: var(--fs-xs);
			letter-spacing: 0.05em;
		}

		.eyebrow {
			letter-spacing: 0.08em;
		}
	}
</style>
