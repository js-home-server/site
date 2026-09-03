<script>
	import { page } from '$app/state';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import TimeAxis from '$lib/components/TimeAxis.svelte';
	import { stamp } from '$lib/format.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { bucket, outages } from '$lib/stats.js';

	let { children } = $props();

	/* One entry per stop on the rail, in the order they are read down it, and
	   one per route under this layout. */
	const SECTIONS = [
		{ label: 'Overview', href: '/server/' },
		{ label: 'CPU', href: '/server/cpu/' },
		{ label: 'Memory', href: '/server/memory/' },
		{ label: 'NVMe', href: '/server/nvme/' },
		{ label: 'SSD', href: '/server/ssd/' },
		{ label: 'Network', href: '/server/network/' },
		{ label: 'Time', href: '/server/time/' },
		{ label: 'Containers', href: '/server/containers/' }
	];

	/* Bars in the rail's uptime strip: a much narrower box than any dashboard
	   heatmap, so fewer of them read clean. */
	const UPTIME_BARS = 48;

	/* Polled here rather than in any one route, so paging between them doesn't
	   restart the fetch cycle — the layout outlives every child page under it. */
	$effect(watch);

	let snapshot = $derived(server.snapshot);
	let online = $derived(snapshot?.availability.server_status === 'online');

	/* The status series is 1 for a poll the machine answered and 0 for one it did
	   not: bucketed into bars for the rail's strip, and counted outright for the
	   incident line above it. */
	let uptime = $derived(server.series?.availability.status ?? []);
	let incidents = $derived(outages(uptime));
	let uptimeBars = $derived(
		bucket(uptime, UPTIME_BARS).map((v) => (v === null ? 'unknown' : v < 1 ? 'down' : 'up'))
	);

	/* The span the strip actually covers, the same way StatusBar works it out
	   for its own copy of this bar: less than `RANGE` until the API has been
	   collecting that long, so the label can never claim more than the data
	   behind it does. Feeds the strip's own aria-label below — a sighted reader
	   never sees "24 hours", but a screen reader was being told that regardless
	   of the real window. */
	let spanSeconds = $derived(uptime.length > 1 ? uptime.at(-1)[0] - uptime[0][0] : 0);
	let spanLabel = $derived(
		spanSeconds >= 3600
			? `${Math.round(spanSeconds / 3600)} hours`
			: spanSeconds > 0
				? `${Math.round(spanSeconds / 60)} minutes`
				: null
	);
	let uptimeLabel = $derived(
		uptimeBars.length && spanLabel
			? `Server uptime over the last ${spanLabel}: ${uptimeBars.filter((s) => s === 'up').length} of ${uptimeBars.length} intervals up`
			: 'Server uptime history unavailable'
	);
</script>

<Dashboard title="Server" sections={SECTIONS} current={page.url.pathname} max="88rem">
	{@render children()}

	{#snippet rail()}
		<div class="rail-box status">
			<!-- Not a heading: this rail renders inside <aside>, ahead of the
			     page's own <h1> (Dashboard.svelte) in source order, so an <h2>
			     here put a heading before the document's first one. A caption on
			     a readout, same as .rail-box .note below it and every other
			     .eyebrow label on the site that isn't titling a section. -->
			<p class="eyebrow">Status</p>
			<!-- role="status"/aria-live: a state flip is worth announcing, and it
			     only fires on a real flip — online and incidents both come off a
			     5-minute-stepped series, not the 30s snapshot poll. -->
			<p class="figure verdict" class:down={!online} role="status" aria-live="polite">
				<i class="dot" aria-hidden="true"></i>{online ? 'Healthy' : 'Unreachable'}
			</p>
			<p class="note">
				{incidents ? `${incidents} incident${incidents > 1 ? 's' : ''}` : 'Nothing to report'}
			</p>
		</div>

		<div class="rail-box uptime">
			<p class="eyebrow">Uptime</p>
			<p class="figure">
				{online && Number.isFinite(snapshot.availability.uptime_seconds)
					? Math.floor(snapshot.availability.uptime_seconds / 3600)
					: '—'}<span class="unit">{online && Number.isFinite(snapshot.availability.uptime_seconds) ? 'h' : ''}</span>
			</p>
			<p class="stats">
				{uptime.length
					? incidents
						? `${incidents} incident${incidents > 1 ? 's' : ''}`
						: 'No incidents'
					: 'No history yet'}
			</p>
			<div class="strip" role="img" aria-label={uptimeLabel}>
				{#each uptimeBars as state}<i class={state}></i>{/each}
			</div>
			<TimeAxis />
		</div>
	{/snippet}

	{#snippet foot()}
		<span class="eyebrow">Last updated</span>
		<!-- The stamp the snapshot came with, not the clock: this says how fresh
		     the numbers above are, which is not the same as what time it is. -->
		<span class="mono">{stamp(snapshot?.generated_at)}</span>
		<!-- Off the site's nav, so this is the only way back to it. -->
		<a class="mono back" href="/">← joshuasmith</a>
	{/snippet}
</Dashboard>

<style>
	.mono {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	/* Same mono note as the stamp above it, stood off by a line and lit on hover
	   the way the rail's own stops are. */
	.back {
		margin-top: 0.5rem;
		text-decoration: none;
	}

	.back:hover,
	.back:focus-visible {
		color: var(--mint);
	}

	/* The two readings stood above the rail's nav: the same card vocabulary
	   every route's own boxes wear, sized for the rail's own width rather
	   than the page's. */
	.rail-box {
		padding: 0.9rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}

	.rail-box .eyebrow {
		display: block;
		margin-bottom: 0.5rem;
	}

	.rail-box .figure {
		margin: 0;
		font-size: var(--fs-lg);
	}

	.status .verdict {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--mint);
	}

	.status .verdict.down {
		color: var(--coral);
	}

	/* The same lit dot the rail marks the current stop with. */
	.status .dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background: currentcolor;
		box-shadow: 0 0 0.6em currentcolor;
	}

	.status .note {
		margin: 0.35rem 0 0;
		color: var(--text-dim);
		font-size: var(--fs-xs);
	}

	.uptime .unit {
		margin-left: 0.15em;
		color: var(--text-dim);
		font-size: 0.6em;
		font-weight: 500;
	}

	.uptime .stats {
		margin: 0.3rem 0 0.7rem;
		color: var(--text-dim);
		font-size: var(--fs-2xs);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* One bar a bucket, the same vocabulary the dashboard's own heatmaps draw
	   cells with: mint where the machine answered, coral where it did not. */
	.strip {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 1px;
		height: 1.6rem;
		margin-bottom: 0.5rem;
	}

	.strip i {
		border-radius: 1px;
		/* The bare bar is unknown, not down: dim enough to read as "no data"
		   beside the mint, and never mistakable for an outage. */
		background: color-mix(in srgb, var(--mint) 12%, var(--color-background));
	}

	.strip i.up {
		background: var(--mint);
	}

	.strip i.down {
		background: var(--coral);
	}
</style>
