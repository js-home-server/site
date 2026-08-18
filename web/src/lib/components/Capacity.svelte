<script>
	import { pct, share } from '$lib/format.js';

	/* How full a volume is: the share as a number, as a bar, and the sizes behind
	   it. `detail` is an em dash where those are not available yet, so a volume
	   that gains them later does not change the shape of the box. */
	let { label, percent, tone, detail = '—' } = $props();

	let filled = $derived(share(percent));
	let reading = $derived(pct(filled));
</script>

<div class="meter" style:color={tone}>
	<h3 class="eyebrow">{label}</h3>
	<strong class="figure">{reading}</strong>

	<!-- The bar runs the full width whatever the reading: the dashes are the space
	     that is left, so the box says how much room there is, not just how much is
	     gone. -->
	<div
		class="bar"
		role="img"
		aria-label="{label}: {filled === null ? 'unknown' : `${reading} used`}"
	>
		<i style="width: {filled ?? 0}%"></i>
	</div>

	<p class="readout"><span class="eyebrow">Used</span><span>{detail}</span></p>
</div>

<style>
	.bar {
		position: relative;
		height: 0.55rem;
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
	}

</style>
