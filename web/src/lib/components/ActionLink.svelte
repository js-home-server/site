<script>
	/* The one place the site's arrow convention is decided: site for anywhere
	   still on the page — another route or a scroll to a stop on this one —
	   external for off it, download for a file handed over rather than a page
	   gone to, back for the one way off a page with no nav of its own.
	   Everything that used to pick its own glyph (and, in two places, picked
	   the wrong one for a download) points here instead. */
	const ARROWS = { site: '→', external: '↗', download: '↓', back: '←' };

	let {
		direction,
		variant = 'plain',
		href,
		download,
		class: extraClass = '',
		children,
		...rest
	} = $props();
</script>

<a
	{href}
	class="action-link {direction === 'back' ? '' : variant} {direction} {extraClass}"
	target={direction === 'external' ? '_blank' : undefined}
	rel={direction === 'external' ? 'noopener noreferrer' : undefined}
	download={direction === 'download' ? (download ?? true) : undefined}
	{...rest}
>
	{#if direction === 'back'}
		<span class="arrow" aria-hidden="true">{ARROWS[direction]}</span>
	{/if}
	{@render children()}
	{#if direction !== 'back'}
		<span class="arrow" aria-hidden="true">{ARROWS[direction]}</span>
	{/if}
</a>

<style>
	.action-link {
		display: inline-block;
		text-decoration: none;
	}

	.arrow {
		display: inline-block;
		/* Explicit rather than assumed: a couple of these glyphs have no matching
		   letterform in the mono face, and the fallback font a browser picks for
		   a bare symbol does not always agree to size and colour itself off the
		   text around it the way a normal character does. Sized up from the text
		   itself — at 1em an arrow reads smaller than the letters beside it, since
		   most of its glyph box is whitespace a normal character doesn't carry. */
		color: currentcolor;
		font-size: 1.3em;
		line-height: 1;
		transition: transform 160ms ease;
	}

	/* → and ← alone have no vertical stroke of their own to sit level on the
	   baseline with — at this size that reads as sunk below the text beside
	   them, so these are the glyphs centred on the line rather than set on
	   their baseline. */
	.action-link.site .arrow,
	.action-link.back .arrow {
		vertical-align: middle;
	}

	.action-link.back .arrow {
		margin-right: 0.35em;
	}

	/* Back: the one way off a page with no nav of its own — quiet until it's
	   reached for, then lit the way the rail's own stops are, rather than
	   underlined like an inline reference. */
	.action-link.back {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.action-link.back:hover,
	.action-link.back:focus-visible {
		color: var(--focus-ring);
	}

	/* Plain: an inline reference among body text — inherits whatever color it
	   sits in (matches the --color-foreground every ancestor already reads),
	   underlines on interaction, and the arrow just travels with the label. */
	.action-link.plain {
		color: inherit;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	.action-link.plain:hover,
	.action-link.plain:focus-visible {
		text-decoration: underline;
	}

	/* Cta: the shape every standalone action on the site wears — mint, mono,
	   small caps — with the arrow carrying the hover on its own since the
	   label is already mint and has no colour left to change to. */
	.action-link.cta {
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.action-link.cta.download:hover .arrow,
	.action-link.cta.download:focus-visible .arrow {
		transform: translateY(2px);
	}

	.action-link.cta.site:hover .arrow,
	.action-link.cta.site:focus-visible .arrow {
		transform: translateX(2px);
	}

	.action-link.cta.external:hover .arrow,
	.action-link.cta.external:focus-visible .arrow {
		transform: translate(2px, -2px);
	}
</style>
