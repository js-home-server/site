<!-- Always on while the viewport is phone-width (app.css's breakpoint scale) —
     no dismiss, so it stays visible for the whole visit rather than being
     swiped away once and forgotten. Sticky above the site's own nav bar
     (+layout.svelte, (site)), which is sticky itself, so this pins higher
     and neither one covers the other while scrolling. -->
<div class="mobile-notice" role="status">
	<p>This site is designed for a larger screen — some things may not look right here.</p>
</div>

<style>
	.mobile-notice {
		display: none;
	}

	@media (max-width: 48rem) {
		.mobile-notice {
			position: sticky;
			top: 0;
			z-index: 3;
			display: flex;
			padding: 0.5rem var(--gutter);
			border-bottom: 1px solid var(--color-border);
			background: color-mix(in srgb, var(--amber) 12%, var(--color-background));
			color: var(--amber-ink);
			font-size: var(--fs-xs);
			text-align: center;
		}
	}

	p {
		flex: 1;
		margin: 0;
		line-height: 1.4;
	}
</style>
