<script>
	import { bucket, spanSeconds } from '$lib/stats.js';
	import { span } from '$lib/format.js';

	/* Two fits. `barCount` pins fixed equal CSS-grid columns — fine for a narrow
	   rail. Unset measures the box in device pixels and gives each bar a whole-pixel
	   width instead, since the wide, busy hero card visibly bands under flex's fractional rounding. */
	let { uptime, barCount, height = '1.6rem', class: extraClass = '' } = $props();

	/* Below this many device pixels a bar's rounding noise reads as it doubling
	   in size, not noise. Counted in device px so retina screens get more, crisper bars. */
	const MIN_BAR_DEVICE_PX = 6;
	const GAP = 1; /* CSS px between bars */
	const MAX_SEGMENTS = 96;

	/* Finest pitch the strip can draw — shrinks the bar count on a narrow phone
	   card rather than each bar. Never more bars than samples. Only used when barCount isn't pinned. */
	let stripWidth = $state(0);
	let responsiveCount = $derived.by(() => {
		if (!stripWidth) return MAX_SEGMENTS;
		const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
		const gapDevice = Math.max(1, Math.round(GAP * dpr));
		const pitchDevice = MIN_BAR_DEVICE_PX + gapDevice;
		const fit = Math.floor((stripWidth * dpr + gapDevice) / pitchDevice);
		return Math.max(12, Math.min(MAX_SEGMENTS, fit));
	});

	let segmentCount = $derived(barCount ?? responsiveCount);

	/* Widths worked out as whole device pixels ourselves, not left for the browser
	   to round per-bar — that accumulates sub-pixel error across the strip. Only
	   needed for the responsive fit; a fixed count's grid columns divide themselves. */
	let barWidths = $derived.by(() => {
		if (barCount || !stripWidth) return [];
		const n = segmentCount;
		const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
		const gapDevice = Math.max(1, Math.round(GAP * dpr));
		const totalDevice = Math.round(stripWidth * dpr) - (n - 1) * gapDevice;
		const widths = [];
		let prevEdge = 0;
		for (let i = 1; i <= n; i++) {
			const edge = Math.round((totalDevice * i) / n);
			widths.push(Math.max(0, edge - prevEdge) / dpr);
			prevEdge = edge;
		}
		return widths;
	});

	/* Any failed poll marks a bucket down, not most of them — averaging let a short outage look clean. Unknown (nothing collected) ≠ down. */
	let segments = $derived(
		bucket(uptime, segmentCount).map((v) => (v === null ? 'unknown' : v < 1 ? 'down' : 'up'))
	);

	let windowSeconds = $derived(spanSeconds(uptime));
	let uptimeLabel = $derived(
		segments.length && windowSeconds
			? `Server uptime over the last ${span(windowSeconds)}: ${segments.filter((s) => s === 'up').length} of ${segments.length} intervals up`
			: 'Server uptime history unavailable'
	);
</script>

<div
	class="uptime-strip {extraClass}"
	class:fixed={barCount != null}
	style="height: {height}"
	bind:clientWidth={stripWidth}
	role="img"
	aria-label={uptimeLabel}
>
	{#each segments as state, i}
		<i class={state} style={barCount == null ? `width: ${barWidths[i]}px` : undefined}></i>
	{/each}
</div>

<style>
	.uptime-strip {
		display: flex;
		gap: 1px;
	}

	.uptime-strip.fixed {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
	}

	.uptime-strip i {
		flex: none;
		border-radius: 1px;
		background: color-mix(in srgb, var(--mint) 12%, var(--color-background));
	}

	.uptime-strip i.up {
		background: var(--mint);
	}

	.uptime-strip i.down {
		background: var(--coral);
	}
</style>
