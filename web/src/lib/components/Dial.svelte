<script>
	import { pct, share } from '$lib/format.js';
	import Panel from './Panel.svelte';

	/* A share of something, as a ring with the reading in the middle. The ring is
	   what makes it legible from across the room; the figure is what makes it a
	   number. `detail` is the sizes behind the share, an em dash until there are
	   any, so the box does not change shape when it gets them. */
	let { label, percent, tone, detail = '—' } = $props();

	let filled = $derived(share(percent));
</script>

<Panel {label} {tone}>
	<div class="gauge">
		<!-- The ring is its own element because it is masked: a hole punched through
		     this box would take the figure with it. -->
		<div class="ring" style="--v: {filled ?? 0}" role="img" aria-label="{label}: {pct(filled)}">
		</div>
		<strong class="figure">{pct(filled)}</strong>
	</div>

	<p class="readout"><span class="eyebrow">Used</span><span>{detail}</span></p>
</Panel>

<style>
	/* Square, centred, and as big as the box allows up to a size that still leaves
	   the reading room to sit inside it. */
	.gauge {
		/* The ring is positioned against this box, not the page. */
		position: relative;
		display: grid;
		place-items: center;
		place-self: center;
		width: min(100%, 9rem);
		margin-block: auto;
		aspect-ratio: 1;
	}

	/* The share as a sweep from twelve o'clock, on a track of the same faint grey an
	   empty heatmap cell uses. The mask is what makes it a ring rather than a pie. */
	.ring {
		position: absolute;
		width: 100%;
		border-radius: 50%;
		aspect-ratio: 1;
		background: conic-gradient(
			currentcolor calc(var(--v) * 1%),
			color-mix(in srgb, var(--color-foreground) 8%, transparent) 0
		);
		mask: radial-gradient(closest-side, transparent 67%, black 68%);
	}

</style>
