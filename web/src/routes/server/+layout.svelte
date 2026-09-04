<script>
	import { page } from '$app/state';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import TimeAxis from '$lib/components/TimeAxis.svelte';
	import UptimeStrip from '$lib/components/UptimeStrip.svelte';
	import { span, stamp, uptimeHours } from '$lib/format.js';
	import { server, watch } from '$lib/server.svelte.js';
	import { outages } from '$lib/stats.js';

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

	/* Fewer bars than a dashboard heatmap — the rail is a much narrower box. */
	const UPTIME_BARS = 48;

	/* Polled here, not per-route, so paging between routes doesn't restart the fetch cycle. */
	$effect(watch);

	let snapshot = $derived(server.snapshot);
	/* Gated on the request, not just the data — a snapshot the latest poll couldn't
	   refresh doesn't get to keep claiming online (see server.svelte.js). */
	let online = $derived(server.status.snapshot === 'ok' && snapshot?.availability.server_status === 'online');
	let stale = $derived(server.status.snapshot === 'stale');
	let staleFor = $derived(
		snapshot ? span((Date.now() - Date.parse(snapshot.generated_at)) / 1000) : null
	);

	/* 1 = answered, 0 = didn't, fractional mid-bucket. UptimeStrip buckets it into bars; this counts runs
	   of the same under-1 readings for the line below — "affected intervals", since each point is already
	   an aggregate, not a guarantee that a run maps one-to-one onto a real-world outage. */
	let uptime = $derived(server.series?.availability.status ?? []);
	let incidents = $derived(outages(uptime));
	let hours = $derived(online ? uptimeHours(snapshot?.availability.uptime_seconds) : null);
</script>

<Dashboard title="Server" sections={SECTIONS} current={page.url.pathname} max="88rem">
	{@render children()}

	{#snippet rail()}
		<div class="rail-box status">
			<!-- Not a heading — this renders ahead of the page's own <h1> in source order, so an <h2> here would jump the doc outline. -->
			<p class="eyebrow">Status</p>
			<!-- aria-live fires only on a real flip — online/incidents come off a 5-min-stepped series, not the 30s poll. -->
			<p class="figure verdict" class:down={!stale && !online} class:stale role="status" aria-live="polite">
				<i class="dot" aria-hidden="true"></i>{stale ? 'Unconfirmed' : online ? 'Healthy' : 'Unreachable'}
			</p>
			<p class="note">
				{incidents ? `${incidents} affected interval${incidents > 1 ? 's' : ''}` : 'Nothing to report'}
			</p>
		</div>

		<div class="rail-box uptime">
			<p class="eyebrow">Uptime</p>
			<p class="figure">
				{hours ?? '—'}<span class="unit">{hours !== null ? 'h' : ''}</span>
			</p>
			<p class="stats">
				{uptime.length
					? incidents
						? `${incidents} affected interval${incidents > 1 ? 's' : ''}`
						: 'No incidents'
					: 'No history yet'}
			</p>
			<UptimeStrip {uptime} barCount={UPTIME_BARS} height="1.6rem" class="strip" />
			<TimeAxis />
		</div>
	{/snippet}

	{#snippet foot()}
		{#if stale}
			<span class="eyebrow">Last known status</span>
			<span class="mono">updated {staleFor ?? 'a while'} ago</span>
		{:else}
			<span class="eyebrow">Last updated</span>
			<!-- The snapshot's own stamp, not the clock — how fresh the numbers are, not what time it is. -->
			<span class="mono">{stamp(snapshot?.generated_at)}</span>
		{/if}
		<!-- Off the site nav — the only way back. -->
		<ActionLink direction="back" href="/">joshuasmith</ActionLink>
	{/snippet}
</Dashboard>

<style>
	.mono {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	/* ActionLink's own hover/focus reads --focus-ring, --mint on this dark
	   ground. */
	:global(.action-link.back) {
		margin-top: 0.5rem;
	}

	/* Same card vocabulary as every route's boxes, sized for the rail's width instead. */
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
		font-size: var(--fs-subhead);
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

	/* Unproven either way, not a verdict — same dim treatment as the home-page status bar. */
	.status .verdict.stale {
		color: var(--text-faint);
	}

	.status .verdict.stale .dot {
		box-shadow: none;
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
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.uptime .unit {
		margin-left: 0.15em;
		color: var(--text-dim);
		font-size: var(--fs-xs);
		font-weight: 500;
	}

	.uptime .stats {
		margin: 0.3rem 0 0.7rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* UptimeStrip's own layout and bar colours; this is only the rail's slot for
	   it. */
	:global(.strip) {
		margin-bottom: 0.5rem;
	}
</style>
