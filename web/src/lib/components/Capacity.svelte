<script>
	import { pct, share } from '$lib/format.js';

	/* How full a volume is, compact enough to stand as one figure in a strip of
	   others: the reading, and a bar showing the same share, in the place a
	   plain number or a Dial sits in every other headline band. The label is
	   read here rather than shown, since the caller sets it as the .eyebrow
	   beside this the same way it does for every other stat. */
	let { label, percent, tone } = $props();

	let filled = $derived(share(percent));
	let reading = $derived(pct(filled));
</script>

<div class="capacity" style:color={tone}>
	<strong class="reading">{reading}</strong>

	<!-- The bar runs the full width whatever the reading: the dashes are the
	     space that is left, so the box says how much room there is, not just
	     how much is gone. -->
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
		font-size: 1.3rem;
	}

	.bar {
		position: relative;
		height: 0.4rem;
	}

	/* The empty part of the volume, dotted in the same tone as the fill so the two
	   read as one bar rather than a bar on a track — the dots take their colour from
	   the volume, like every other mark in this box. */
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
