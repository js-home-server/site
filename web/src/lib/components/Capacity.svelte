<script>
	import { pct, share } from '$lib/format.js';

	/* How full a volume is: the reading, and a bar showing the same share under
	   it. Compact enough to stand either on its own — the drive pages give it a
	   box — or as one of a pair in the overview's storage card. The label is
	   read out rather than shown, since whatever holds this already names the
	   drive beside it. */
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
