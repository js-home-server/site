<script>
	import { onMount } from 'svelte';

	const HISTORY_HOURS = 24;
	const SEGMENT_MINUTES = 15; /* the target bar: one per quarter hour, 96 in all */
	const SEGMENTS = (HISTORY_HOURS * 60) / SEGMENT_MINUTES;
	const BAR_PITCH = 2; /* px a bar needs to read as one: its ink and its gap */
	const HOUR_MS = 3600_000;
	const WINDOW_MS = HISTORY_HOURS * HOUR_MS;
	const STORE_KEY = 'status-history-v1';

	let snapshot = $state(null);
	/* Samples the page has actually seen. The API returns a point-in-time
	   snapshot with no history, so a 24h chart has to be accumulated here and
	   kept across visits. Replace this with the server's own series the moment
	   /api/status can return one. */
	let history = $state([]);
	let fetching = false;

	const withinWindow = (points) => {
		const cutoff = Date.now() - WINDOW_MS;
		return points.filter((p) => p?.t >= cutoff);
	};

	const formatUptime = (seconds) => `${Math.floor(seconds / 3600)}h`;
	const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

	const percentile = (values, p) => {
		const sorted = [...values].sort((a, b) => a - b);
		return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
	};

	let online = $derived(snapshot?.server === 'online');

	/* Quarter-hour bars where there is room for them. A phone card is narrower
	   than 96 bars and their gaps, and grid answers that by shrinking every bar
	   to nothing, so take the finest bucket the strip can actually draw. */
	let stripWidth = $state(0);
	let segmentCount = $derived(
		stripWidth ? Math.max(12, Math.min(SEGMENTS, Math.floor(stripWidth / BAR_PITCH))) : SEGMENTS
	);

	/* The only thing a lone snapshot says about the past is how far back the
	   current boot reaches: time inside uptimeSeconds was up, anything older is
	   unknown rather than down. */
	let segments = $derived(
		Array.from(
			{ length: segmentCount },
			(_, i) =>
				online &&
				snapshot.uptimeSeconds >= ((segmentCount - i) / segmentCount) * HISTORY_HOURS * 3600
		)
	);

	/* An SVG path over the readings themselves: one step per sample, evenly
	   spaced, joined straight. Clock time cannot drive x here — the samples only
	   cover the minutes the tab has been open, so on a 24h axis a whole session
	   lands in the last half-percent of the card and draws as a vertical spike.
	   y is scaled to the series' own range with a little headroom, so a flat
	   trace still shows its shape and spikes still have somewhere to go. */
	function chart(values) {
		if (values.length < 2) return '';

		const min = Math.min(...values);
		const max = Math.max(...values);
		const pad = (max - min) * 0.15 || 1;
		const lo = min - pad;
		const span = max + pad - lo;
		const step = 100 / (values.length - 1);

		return values
			.map((v, i) => {
				const y = 30 - ((v - lo) / span) * 30;
				return `${i ? 'L' : 'M'}${(i * step).toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}

	const seriesOf = (key) => history.map((p) => p[key]).filter((v) => typeof v === 'number');

	let temps = $derived(seriesOf('temp'));
	let latencies = $derived(seriesOf('latency'));

	/* One entry per chart card. Everything the markup needs is settled here, so
	   the template stays a list of cards rather than a pile of ternaries. */
	let cards = $derived([
		{
			label: 'CPU Temp',
			value: snapshot ? `${Math.round(snapshot.cpuTemperatureC)}°` : '—',
			unit: '',
			tone: 'amber',
			stats: temps.length
				? `Min ${Math.round(Math.min(...temps))}° · Max ${Math.round(Math.max(...temps))}°`
				: 'No history yet',
			path: chart(temps)
		},
		{
			label: 'Latency',
			value: snapshot ? Math.round(snapshot.latencyMs) : '—',
			unit: snapshot ? 'ms' : '',
			tone: 'pink',
			stats: latencies.length
				? `Avg ${Math.round(mean(latencies))} · P95 ${Math.round(percentile(latencies, 0.95))}`
				: 'No history yet',
			path: chart(latencies)
		}
	]);

	let uptimeLabel = $derived(
		`Uptime over the last ${HISTORY_HOURS} hours: ${Math.round((segments.filter(Boolean).length / segments.length) * HISTORY_HOURS)} of ${HISTORY_HOURS} hours confirmed up`
	);

	function record(sample) {
		history = [
			...withinWindow(history),
			{ t: Date.now(), temp: sample.cpuTemperatureC, latency: sample.latencyMs }
		];
		try {
			localStorage.setItem(STORE_KEY, JSON.stringify(history));
		} catch {
			/* Private mode or a full quota: the chart just stays session-only. */
		}
	}

	async function loadStatus() {
		if (fetching) return;
		fetching = true;

		try {
			const response = await fetch('/api/status');
			if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
			snapshot = await response.json();
			record(snapshot);
		} catch {
			/* Keep the last good snapshot on the wire dropping out; the next
			   poll picks it back up. */
		} finally {
			fetching = false;
		}
	}

	onMount(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
			if (Array.isArray(stored)) history = withinWindow(stored);
		} catch {
			/* Unreadable store: start a fresh window. */
		}

		loadStatus();
		const timer = window.setInterval(() => {
			if (!document.hidden) loadStatus();
		}, 30_000);
		const handleVisibility = () => {
			if (!document.hidden) loadStatus();
		};

		document.addEventListener('visibilitychange', handleVisibility);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

{#snippet chartCard({ label, value, unit, tone, stats, path })}
	<div class="metric">
		<span class="label">{label}</span>
		<strong class="value {tone}">
			{value}{#if unit}<span class="unit">{unit}</span>{/if}
		</strong>
		<span class="stats">{stats}</span>
		<div class="chart {tone}">
			{#if path}
				<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
					<path d={path} vector-effect="non-scaling-stroke" />
				</svg>
			{/if}
		</div>
	</div>
{/snippet}

<aside class="status-bar" aria-label="Live server status">
	<div class="metrics">
		<div class="metric status">
			<span class="label">Status</span>
			<strong class="state" class:mint={online}>
				{online ? 'Online' : 'Unavailable'}
			</strong>
			<span class="stats">
				Uptime {snapshot ? formatUptime(snapshot.uptimeSeconds) : '—'}
			</span>
			<div
				class="history"
				bind:clientWidth={stripWidth}
				role="img"
				aria-label={uptimeLabel}
			>
				{#each segments as up}
					<i class:up></i>
				{/each}
			</div>
		</div>

		{#each cards as card (card.label)}
			{@render chartCard(card)}
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
		/* Standalone boxes need to clear the bottom edge; the outer edges stay
		   flush so the row still measures tip to tip. */
		margin: 0 auto 1rem;
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
		min-height: 4.5rem;
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

	.state {
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.history {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 1px;
	}

	.history i {
		border-radius: 1px;
		/* Unknown, not down: dim enough to read as "no data" beside the mint. */
		background: color-mix(in srgb, var(--mint) 12%, var(--color-background));
	}

	.history i.up {
		background: var(--mint);
	}

	/* Online reads at the same size and weight as the numbers beside it. */
	.value,
	.state {
		color: var(--color-foreground);
		font-size: clamp(1.15rem, 1.65vw, 1.6rem);
		font-weight: 700;
		line-height: 1;
	}

	.value {
		letter-spacing: -0.02em;
	}

	.unit {
		margin-left: 0.15em;
		font-size: 0.45em;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.stats {
		color: var(--text-dim);
		font-size: 0.62rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
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
			min-height: 5rem;
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
