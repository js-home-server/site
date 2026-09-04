<script>
	import Spark from './Spark.svelte';
	import TimeAxis from './TimeAxis.svelte';
	import ActionLink from './ActionLink.svelte';
	import UptimeStrip from './UptimeStrip.svelte';
	import LoadingDots from './LoadingDots.svelte';
	import { degrees, ms, span, stamp, uptimeHours } from '$lib/format.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { mean, minMax, outages, percentile, spanSeconds, values } from '$lib/stats.js';

	$effect(watch);

	let snapshot = $derived(server.snapshot);
	/* [unixSeconds, value] pairs. status is 1 up, 0 down, fractional mid-bucket. */
	let series = $derived(server.series);

	/* Only trust the snapshot's own verdict while the request that fetched it is
	   still the current one — once it's 'stale' the snapshot is just the last
	   thing we heard, not a live reading, so it doesn't get to claim online. */
	let online = $derived(server.status.snapshot === 'ok' && snapshot?.availability.server_status === 'online');
	/* A null snapshot means "haven't checked yet", not "down" — only a completed
	   request gets to claim online or offline. 'stale' outranks both: we have a
	   snapshot, but the request that would confirm it still holds just failed. */
	let statusState = $derived(
		server.status.snapshot === 'stale'
			? 'stale'
			: snapshot
				? (online ? 'online' : 'offline')
				: server.status.snapshot === 'error'
					? 'error'
					: 'loading'
	);

	/* How long ago the snapshot we're still showing was actually current — only
	   meaningful once it's stale, so callers gate on that themselves. */
	let staleFor = $derived(
		snapshot ? span((Date.now() - Date.parse(snapshot.generated_at)) / 1000) : null
	);

	/* Live region goes armed only once the first request has settled, one tick
	   after that first render — so a screen reader hears a real status flip
	   later, not the "Checking…" → first reading transition every page load makes. */
	let announceStatus = $state(false);
	$effect(() => {
		if (statusState !== 'loading' && !announceStatus) queueMicrotask(() => (announceStatus = true));
	});

	let temps = $derived(series?.cpu.temperature_c ?? []);
	let latencies = $derived(series?.availability.latency_ms ?? []);
	let uptime = $derived(series?.availability.status ?? []);

	/* Labelled from the data, not `range` — so the caption can't overstate what the traces actually cover. */
	let spanLabel = $derived(span(spanSeconds(uptime), { short: true }));

	/* Counted off the raw series, not UptimeStrip's bars — a bar averages a slice, so one bad poll inside it can vanish.
	   "Affected intervals", not "incidents" — each point is already a 5-minute bucket, so a run of them is a count
	   of aggregated readings, not a promise that it maps one-to-one onto a real-world outage. */
	let incidents = $derived(outages(uptime));

	/* Everything settled here so the template stays a list of readings, not a pile of ternaries. */
	let hours = $derived(online ? uptimeHours(snapshot?.availability.uptime_seconds) : null);

	let cards = $derived([
		{
			label: 'Uptime',
			value: hours ?? '—',
			unit: hours !== null ? 'h' : '',
			tone: 'mint',
			/* Silence ≠ a clean record — no series means the strip can't say either way. */
			stats: uptime.length > 1
				? incidents
					? `${incidents} AFFECTED INTERVAL${incidents > 1 ? 'S' : ''}`
					: 'NO INCIDENTS'
				: 'NO HISTORY YET',
			strip: true
		},
		{
			label: 'CPU Temp',
			value: Number.isFinite(snapshot?.cpu.temperature_c) ? Math.round(snapshot.cpu.temperature_c) : '—',
			/* Degrees hug their number; word units take a space. */
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
			/* Average + tail, not floor/ceiling — the best a link ever managed says nothing about right now. */
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
			<!-- Same live dot as the contact page — mint when answering, coral when proven down, dim while unknown
			     (loading, or stale: a last reading we can no longer vouch for isn't a verdict either way). -->
			<span class="dot" class:down={statusState === 'offline'} class:pending={statusState !== 'online' && statusState !== 'offline'} aria-hidden="true"></span>
			Home server
		</h2>

		<!-- Live-region attributes withheld until the first request settles (see announceStatus) — a screen reader shouldn't hear ordinary hydration as a status alert. -->
		<p class="claim" role={announceStatus ? 'status' : undefined} aria-live={announceStatus ? 'polite' : undefined}>
			Site served from a box under my stairs.
			{#if statusState === 'loading'}
				Checking live status <LoadingDots />
			{:else if statusState === 'error'}
				Live status unavailable.
			{:else if statusState === 'stale'}
				Live status unavailable — showing the last known reading.
			{:else if statusState === 'online'}
				It seems to be working.
			{:else}
				It isn't answering right now.
			{/if}
		</p>

		{#if statusState === 'stale'}
			<!-- No live connection right now, so this reads as an age, not a fresh reading — the wording itself is the disclosure. -->
			<p class="updated">
				<span class="eyebrow">Last known status</span>
				<span class="mono">updated {staleFor ?? 'a while'} ago</span>
			</p>
		{:else}
			<!-- Same reading as the dashboard's rail-foot, stamp() and all — never a different age for the same snapshot. -->
			<p class="updated">
				<span class="eyebrow">Last updated</span>
				<span class="mono">{stamp(snapshot?.generated_at)}</span>
			</p>
		{/if}

		<ActionLink variant="cta" direction="site" href="/server/" class="lede-link">
			About this server
		</ActionLink>
	</div>

	<div class="metrics">
		{#each cards as card (card.label)}
			{@render metricCard(card)}
		{/each}
	</div>
</aside>

<style>
	/* One box, not three — left/right split by a single rule. --py/--px live on
	   the columns so the rule runs wall to wall without negative margins. */
	.status-bar {
		/* Same vertical inset the three old cards carried, so this stands the same height as the row it replaced. */
		--py: 0.75rem;
		--px: 1.1rem;

		/* Has to stay in front of the bull behind it, whatever its paint order does. */
		position: relative;
		z-index: 1;
		display: grid;
		/* Claim is two sentences, so its column is wide enough for two lines. */
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 2.45fr);
		/* Width from the parent grid column; capped only so it can't run off a narrow viewport. */
		width: 100%;
		max-width: calc(100vw - 2 * var(--gutter));
		/* Same section gap as the rest of the page (.page, app.css). */
		margin: 0 auto clamp(0.75rem, 1.5vh, 1.25rem);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		/* Opaque — the bull sits right behind this and a chart over its texture is unreadable. */
		background: var(--color-background);
	}

	h2,
	h3 {
		margin: 0;
	}

	/* Link pushed to the floor so it lands level with the graphics beside it, whatever the claim above wraps to. */
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

	/* Unproven either way — no glow, so it can't be mistaken for a verdict. */
	.lede .dot.pending {
		background: var(--text-faint);
		box-shadow: none;
	}

	/* A claim, not a reading — the box's usual mono would file it as one. */
	.claim {
		margin: 0;
		color: var(--color-foreground);
		font-size: var(--fs-base);
		font-weight: 700;
		letter-spacing: -0.015em;
		line-height: 1.3;
		/* Balanced so a two-line break falls evenly rather than leaving an orphan. */
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
		/* Equal cells whatever the width or reading count — the scroll container keeps this from widening its parent. */
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 1.25rem;
		padding: var(--py) var(--px);
		/* The divider, and the only rule inside the box. */
		border-left: 1px solid var(--color-border);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	/* No frame of its own — the box around all three is the frame. */
	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		/* Room for the graphic and its caption. */
		min-height: 5.4rem;
		/* So TimeAxis's own narrow-width query can see this box's width, not the viewport's. */
		container-type: inline-size;
	}

	/* Pinned to the foot via auto margin, so cards stay level even when one's stats line wraps and another's doesn't. */
	:global(.history) {
		margin-top: auto;
	}

	/* Smaller than a dashboard figure — three of these share the bull's width. */
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

	/* Cased by hand, not text-transform — °C and ms are wrong in any other case. */
	.stats {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.1em;
	}

	/* One tone class per metric — the trace beside it gets the same token, so they can't drift apart. */
	.mint {
		color: var(--mint);
	}

	.amber {
		color: var(--amber);
	}

	.azure {
		color: var(--azure);
	}

	/* A phone's width can't give the three graphs room to read — drop them and keep just the claim. */
	@media (max-width: 48rem) {
		.status-bar {
			grid-template-columns: minmax(0, 1fr);
		}

		.metrics {
			display: none;
		}

		.eyebrow {
			letter-spacing: 0.08em;
		}
	}
</style>
