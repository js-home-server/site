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
	<span class="content">
		{#if direction === 'back'}
			<span class="arrow" aria-hidden="true">{ARROWS[direction]}</span>
		{/if}
		{@render children()}
		{#if direction !== 'back'}
			<span class="arrow" aria-hidden="true">{ARROWS[direction]}</span>
		{/if}
	</span>
</a>

<style>
	.action-link {
		display: inline-block;
		text-decoration: none;
	}

	/* Everything the link shows — label and arrow — lives in one flex row, so
	   the hover underline below has one box to paint under rather than a run
	   of inline text next to an atomic arrow glyph of a different size: a
	   text-decoration drawn by the anchor stops at that glyph's own font
	   metrics and never reaches it cleanly, which is what left a gap between
	   the word's underline and the arrow's. Centred here once, this is also
	   what every consumer's own row/column layout (Projects.svelte's card
	   links, its case-study button) no longer has to set up itself. */
	.content {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
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
		/* --link-size, not a bare var(--fs-sm) — same reason .cta reads
		   --cta-size: a page overriding font-size directly on its own one-class
		   hook loses the specificity fight against this rule's two classes. */
		font-size: var(--link-size, var(--fs-sm));
	}

	/* A painted line under .content, not text-decoration on the anchor: a
	   box-shadow follows .content's own box regardless of the arrow's larger
	   font-size, so it reaches under the arrow the same way it does the word
	   instead of two decorations at two different heights. Doesn't affect
	   layout on hover the way a border would. */
	.action-link.plain:hover .content,
	.action-link.plain:focus-visible .content,
	.action-link.cta:hover .content,
	.action-link.cta:focus-visible .content {
		box-shadow: 0 1px currentcolor;
	}

	/* Cta: the shape every standalone action on the site wears — mint, mono,
	   small caps — with the arrow carrying the hover on its own since the
	   label is already mint and has no colour left to change to. */
	.action-link.cta {
		color: var(--mint);
		font-family: var(--font-mono);
		/* A custom property, not a bare var(--fs-sm): a page wanting this one
		   button bigger has to win a specificity fight against this rule's two
		   classes to override font-size directly, and a single extra class never
		   does — it was losing silently. Setting --cta-size instead, on however
		   little that page scopes it to, always reaches the one font-size
		   declaration that actually reads it. */
		font-size: var(--cta-size, var(--fs-sm));
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* One hover nudge per direction, not per variant: every link already
	   carries its direction as a class regardless of variant, so keying off
	   that alone is what makes plain, cta and back links all move the same
	   arrow the same way instead of each variant needing its own copy. */
	.action-link.download:hover .arrow,
	.action-link.download:focus-visible .arrow {
		transform: translateY(2px);
	}

	.action-link.site:hover .arrow,
	.action-link.site:focus-visible .arrow {
		transform: translateX(2px);
	}

	.action-link.external:hover .arrow,
	.action-link.external:focus-visible .arrow {
		transform: translate(2px, -2px);
	}

	.action-link.back:hover .arrow,
	.action-link.back:focus-visible .arrow {
		transform: translateX(-2px);
	}
</style>
