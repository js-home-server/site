<script>
	import AsciiOwlColor from '$lib/components/AsciiOwlColor.svelte';
	import AsciiOwlGray from '$lib/components/AsciiOwlGray.svelte';
	import AsciiOwlMono from '$lib/components/AsciiOwlMono.svelte';

	/* The demonstration itself, for the project card: the source photograph
	   and what the renderer does with it at each fidelity, side by side.
	   Mono, gray and color are pre-rendered static fragments — their own
	   files, at a fixed native pixel size — rather than components taking a
	   size prop, so each is scaled down with a measured CSS transform
	   instead of a parameter. Measured (getBoundingClientRect) against a
	   14rem target height:
	     mono   208.8 × 284.6 px native → scale 0.787, 10.3 rem wide
	     gray   209.2 × 288.9 px native → scale 0.775, 10.15 rem wide
	     color  209.2 × 288.9 px native → scale 0.775, 10.15 rem wide */
	const ART = [
		{ id: 'mono', label: 'Pure ASCII', w: 10.3, scale: 0.787 },
		{ id: 'gray', label: 'Greyscale', w: 10.15, scale: 0.775 },
		{ id: 'color', label: 'Colour', w: 10.15, scale: 0.775 }
	];
</script>

<div class="compare">
	<figure class="item">
		<div class="frame">
			<img src="/projects/owl-source.jpg" alt="Source photograph" loading="lazy" decoding="async" />
		</div>
		<figcaption>Source</figcaption>
	</figure>

	{#each ART as art (art.id)}
		<figure class="item">
			<div class="frame">
				<div class="scaler" style="width: {art.w}rem; height: 14rem;">
					<div class="scaled" style="transform: scale({art.scale});">
						{#if art.id === 'mono'}<AsciiOwlMono />{/if}
						{#if art.id === 'gray'}<AsciiOwlGray />{/if}
						{#if art.id === 'color'}<AsciiOwlColor />{/if}
					</div>
				</div>
			</div>
			<figcaption>{art.label}</figcaption>
		</figure>
	{/each}
</div>

<style>
	.compare {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.item {
		display: grid;
		justify-items: center;
		gap: 0.45rem;
		margin: 0;
	}

	.frame {
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-control);
	}

	/* Cropped to the same footprint the ascii renders land in (10.2rem is
	   their average width) rather than shown at its own full square — so the
	   source is the owl at the size it was actually rendered at, not the
	   photograph around it. */
	.frame img {
		display: block;
		width: 10.2rem;
		height: 14rem;
		object-fit: cover;
	}

	/* Reserves exactly the post-scale footprint, so the transform below
	   paints into a box the layout already accounts for rather than one
	   sized to the render's own much larger native pixels. */
	.scaler {
		overflow: hidden;
	}

	.scaled {
		transform-origin: top left;
	}

	figcaption {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
