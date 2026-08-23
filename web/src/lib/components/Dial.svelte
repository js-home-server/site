<script>
	import { pct, share } from '$lib/format.js';

	/* A share of something, as a small ring with the reading in the middle —
	   compact enough to stand as one figure in a strip of others, the same
	   place a plain number sits in every other headline band. The label is
	   read here rather than shown, since the caller sets it as the .eyebrow
	   beside this the same way it does for every other stat. */
	let { label, percent, tone } = $props();

	let filled = $derived(share(percent));
</script>

<div class="gauge" style:color={tone}>
	<!-- The ring is its own element because it is masked: a hole punched through
	     this box would take the figure with it. -->
	<div class="ring" style="--v: {filled ?? 0}" role="img" aria-label="{label}: {pct(filled)}"></div>
	<strong class="reading">{pct(filled)}</strong>
</div>

<style>
	.gauge {
		position: relative;
		display: grid;
		place-items: center;
		width: 5.5rem;
		aspect-ratio: 1;
		flex-shrink: 0;
	}

	/* The share as a sweep from twelve o'clock, on a track of the same faint grey an
	   empty heatmap cell uses. The mask is what makes it a ring rather than a pie —
	   thinner than the dial this was cut down from, since a stroke this size reads
	   fine at a glance without wanting the width a tile could give it. */
	.ring {
		position: absolute;
		width: 100%;
		border-radius: 50%;
		aspect-ratio: 1;
		background: conic-gradient(
			currentcolor calc(var(--v) * 1%),
			color-mix(in srgb, var(--color-foreground) 8%, transparent) 0
		);
		mask: radial-gradient(closest-side, transparent 78%, black 80%);
	}

	.reading {
		position: relative;
		color: var(--color-foreground);
		font-size: 1.05rem;
		font-weight: 700;
	}
</style>
