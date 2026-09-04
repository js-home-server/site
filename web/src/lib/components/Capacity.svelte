<script>
	import { pct, share } from '$lib/format.js';

	/* Reading + bar, compact enough to stand alone or paired in the overview card. Label is read out only — the caller already shows the drive name. */
	let { label, percent, tone } = $props();

	let filled = $derived(share(percent));
	let reading = $derived(pct(filled));
</script>

<div class="capacity" style:color={tone}>
	<strong class="reading">{reading}</strong>

	<!-- Full width always — dashes are the room left, not just what's gone. -->
	<div class="bar" role="img" aria-label="{label}: {filled === null ? 'unknown' : `${reading} used`}">
		<i style="width: {filled ?? 0}%"></i>
	</div>
</div>

<style>
	.capacity {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 6rem;
	}

	.reading {
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
	}

	.bar {
		position: relative;
		height: 0.4rem;
	}

	/* Dotted in the fill's own tone, so it reads as one bar, not a bar on a track. */
	.bar::before {
		position: absolute;
		inset: 0;
		background-image: var(--dot-row);
		content: '';
		opacity: 0.55;
	}

	.bar i {
		position: absolute;
		inset: 0 auto 0 0;
		background: currentcolor;
		border-radius: 1px;
	}
</style>
