<script>
	/* How full a volume is: the share as a number, as a bar, and the sizes behind
	   it. `detail` is an em dash where those are not available yet, so a volume
	   that gains them later does not change the shape of the box. */
	let { label, percent, tone, detail = '—' } = $props();

	let filled = $derived(typeof percent === 'number' ? Math.min(100, Math.max(0, percent)) : null);
	let reading = $derived(filled === null ? '—' : `${Math.round(filled)}%`);
</script>

<div class="capacity card" style:color={tone}>
	<span class="eyebrow">{label}</span>
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

	<p class="used"><span class="eyebrow">Used</span><span>{detail}</span></p>
</div>

<style>
	.capacity {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.bar {
		position: relative;
		height: 0.55rem;
	}

	/* The empty part of the volume, dashed in the same tone as the fill so the two
	   read as one bar rather than a bar on a track. */
	.bar::before {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			90deg,
			currentcolor 0 2px,
			transparent 2px 6px
		);
		content: '';
		opacity: 0.4;
	}

	.bar i {
		position: absolute;
		inset: 0 auto 0 0;
		background: currentcolor;
	}

	.used {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin: 0.15rem 0 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.66rem;
		line-height: 1.5;
	}

	/* The label keeps the sans face the rest of the small caps are set in. */
	.used .eyebrow {
		font-family: var(--font-sans);
		font-size: 0.56rem;
		letter-spacing: 0.12em;
	}
</style>
