<script>
	import { bucket, spanSeconds } from '$lib/stats.js';
	import { span } from '$lib/format.js';

	/* One strip, two fits. `barCount` pins the count to fixed equal CSS-grid
	   columns — a rail this narrow never needs more precision than that.
	   Leaving it unset measures the box in device pixels instead and hands
	   each bar an explicit whole-pixel width: the hero card is wide and busy
	   enough that flex's fractional rounding bands visibly (see
	   MIN_BAR_DEVICE_PX below), which a fixed low bar count never hits. */
	let { uptime, barCount, height = '1.6rem', class: extraClass = '' } = $props();

	/* Device pixels a bar needs before it reads as one width rather than a coin
	   flip between two: a bar under this is thin enough that the ±1 device-pixel
	   spread every sub-pixel layout leaves somewhere in a long row of bars reads
	   as one bar doubling in size instead of the rounding noise it actually is.
	   Counted in device pixels, not CSS ones, so a retina screen earns the extra
	   bars its sharper grid can actually draw crisply, and a plain one gets fewer,
	   fatter bars instead of the same count rendered illegibly thin. */
	const MIN_BAR_DEVICE_PX = 6;
	const GAP = 1; /* CSS px between bars */
	const MAX_SEGMENTS = 96;

	/* One bar per bucket of the strip's own window, at the finest pitch it can
	   draw: a phone card is narrower than 96 bars and their gaps, and this shrinks
	   the count rather than every bar. Never more bars than samples either, or the
	   empty buckets between them read as outages. Only measured when the caller
	   hasn't pinned a count of its own. */
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

	/* Every bar's width in whole device pixels, not CSS pixels handed to the
	   browser to round. With many fractional-width bars in a row, layout accumulates
	   sub-pixel position error across the strip and has to snap an edge here and
	   there at paint time — giving every <i> the same width doesn't stop that,
	   since each edge still gets rounded on its own. Working the boundaries out
	   ourselves as integers, then dividing back by the pixel ratio, means every
	   edge already sits on the device grid and there is nothing left to round.
	   Only needed in the responsive fit — a fixed count's CSS-grid columns divide
	   the box themselves. */
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

	/* Any failed poll in the bucket makes it an outage, not most of them: a bar is
	   a slice of the window, and asking for the average of one is what let a short
	   outage come out as a clean bar. A bucket the API had nothing for is unknown,
	   which is not the same as down and must not be drawn as if it were. */
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
