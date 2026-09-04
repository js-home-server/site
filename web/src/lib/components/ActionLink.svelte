<script>
	/* The one place the arrow convention lives: site (still on the page),
	   external (off it), download (a file, not a page), back (no nav of its own). */
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

	/* One flex row so the hover underline below has one box to paint under — separate text/arrow decorations left a gap between them. */
	.content {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

	.arrow {
		display: inline-block;
		/* Explicit colour — some arrow glyphs fall back to a font that won't inherit it. Sized up since 1em reads smaller for a glyph mostly whitespace. */
		color: currentcolor;
		font-size: 1.3em;
		line-height: 1;
		transition: transform 160ms ease;
	}

	/* Quiet until reached for, then lit like a rail stop — not underlined like an inline reference. */
	.action-link.back {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	.action-link.back:hover,
	.action-link.back:focus-visible {
		color: var(--focus-ring);
	}

	/* Plain: an inline reference — inherits ambient colour, underlines on hover. */
	.action-link.plain {
		color: inherit;
		font-family: var(--font-mono);
		/* --link-size not a bare var(--fs-sm) — a page overriding font-size directly loses the specificity fight against this rule's two classes. */
		font-size: var(--link-size, var(--fs-sm));
	}

	/* box-shadow, not text-decoration — it follows .content's box so it reaches under the larger arrow glyph too, at one height. */
	.action-link.plain:hover .content,
	.action-link.plain:focus-visible .content,
	.action-link.cta:hover .content,
	.action-link.cta:focus-visible .content {
		box-shadow: 0 1px currentcolor;
	}

	/* Button: the one solid CTA style — bordered box, soft-fill on hover/focus,
	   like Contact's Send button. currentcolor throughout so a caller sets the
	   accent once (ambient `color`) and border/fill/text all follow it. */
	.action-link.button {
		display: block;
		overflow: hidden;
		color: inherit;
		border: 1px solid currentcolor;
		border-radius: var(--radius-control);
		transition: background-color 160ms ease;
	}

	.action-link.button .content {
		display: flex;
		justify-content: center;
		padding: 0.6rem 0.8rem;
		font-family: var(--font-mono);
		font-size: var(--fs-base);
		font-weight: 500;
	}

	.action-link.button:hover,
	.action-link.button:focus-visible {
		background: color-mix(in srgb, currentcolor 12%, transparent);
	}

	/* Cta: mint, mono, small caps — every standalone action on the site. Arrow carries the hover since the label is already mint. */
	.action-link.cta {
		color: var(--mint);
		font-family: var(--font-mono);
		/* --cta-size not a bare var(--fs-sm) — overriding font-size directly loses the specificity fight against this rule. */
		font-size: var(--cta-size, var(--fs-sm));
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* Keyed on direction, not variant — plain/cta/back links all get the same arrow nudge for free. */
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
