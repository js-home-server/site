<script>
	import AsciiClock from './AsciiClock.svelte';

	/* The shell every dashboard-style page wears: a fixed rail of stops down the
	   left, one stop's own content down the right. Each stop is its own route,
	   so `sections` is [{ label, href }] and `current` is the path of the one
	   being shown — the rail marks it and the heading names it off the same
	   list, which is what stops the two disagreeing. `children` is that route's
	   content, `rail` is extra content stood under the nav list if the caller
	   has any, `foot` is the note pinned to the foot of the rail, and `max` is
	   how wide the whole thing is allowed to get. */
	let { title, sections, current, rail, foot, max = '82rem', children } = $props();

	let currentLabel = $derived(sections.find((section) => section.href === current)?.label ?? title);
</script>

<!-- --dash-max is the same length as max-width, read back as a custom property
     so the fixed rail's own `left` calc can centre against it too. -->
<div class="dash" style="max-width: {max}; --dash-max: {max}">
	<aside class="rail" aria-label="Page sections">
		<!-- Decorative: the rail's own nav already names the page you're on, and
		     the digits are ascii art rather than a reading to a screen reader. -->
		<div class="rail-art" aria-hidden="true">
			<AsciiClock />
		</div>

		<nav aria-label="Dashboard sections">
			{#each sections as section, i (section.href)}
				<a
					class="eyebrow"
					href={section.href}
					aria-current={current === section.href ? 'page' : undefined}
				>
					<span class="idx">{String(i).padStart(2, '0')}</span>
					<span>{section.label}</span>
					<span class="dot" aria-hidden="true"></span>
				</a>
			{/each}
		</nav>

		{#if rail}
			<div class="rail-status">{@render rail()}</div>
		{/if}

		{#if foot}
			<div class="rail-foot">{@render foot()}</div>
		{/if}
	</aside>

	<main class="body">
		<!-- The page's own heading. The section carries the titling now, so this is
		     for the outline rather than the eye: without it the document starts at
		     h2 and the section is under nothing. -->
		<h1 class="sr-only">{title}</h1>

		<section class="surface-box">
			<h2>{currentLabel}</h2>
			{@render children()}
		</section>

		{#if foot}
			<!-- The rail becomes the horizontal bar at this width, and there is no
			     room in it for a foot of its own — so the note reads from here
			     instead, below the section, rather than going unread. -->
			<div class="body-foot">{@render foot()}</div>
		{/if}
	</main>
</div>

<style>
	.dash {
		/* The rail is a fixed column and the page takes the rest. Centred like
		   .page; the cap on it is the caller's, since a dashboard and a page of
		   prose do not want the same one. */
		--rail: 13rem;
		--dash-gap: clamp(1.5rem, 3vw, 3rem);
		--dash-pad-top: clamp(1.5rem, 4vh, 2.5rem);

		margin-inline: auto;
		/* Same token top and bottom as the header's own padding, so the page ends
		   exactly as far off the fold as it began — this is what keeps the box
		   below from having to guess how much room is left past its own height. */
		padding: var(--dash-pad-top) var(--gutter) var(--nav-pad-top);
	}

	/* Fixed, not sticky, and the same on every route: this shell is never asked
	   to hold more than one screen's worth of section, so there is no long page
	   underneath it for a sticky rail to run out of room in — fixed is just the
	   simpler of the two ways to get the same picture. Its left edge is worked
	   out by hand to land where a grid column would have: half of whatever
	   space is left over past --dash-max, plus the page's own gutter; its top
	   is this box's own padding, since fixed positioning does not inherit it. */
	.rail {
		position: fixed;
		top: var(--dash-pad-top);
		left: calc(max(0px, (100vw - min(100vw, var(--dash-max))) / 2) + var(--gutter));
		width: var(--rail);
		/* Bottom edge held off the fold by --nav-pad-top — the same distance the
		   nav's own text sits off the top, so the rail is framed the way the
		   header is rather than by an unrelated fixed inset. */
		height: calc(100vh - var(--dash-pad-top) - var(--nav-pad-top));
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}

	/* The page's own column: pushed clear of the fixed rail beside it by hand,
	   since the rail no longer holds that width open in a grid track. */
	.body {
		margin-left: calc(var(--rail) + var(--dash-gap));
		min-width: 0;
	}

	/* Whatever the caller stands under the nav — a page-specific reading or two,
	   stacked the same way the rail's other parts are. The boxes themselves are
	   the caller's own styling, carried in from wherever the snippet is written.
	   Pushed to the foot of the rail's own (viewport-capped) box, so it and the
	   foot below it sit together at the bottom of the panel rather than
	   trailing straight under the nav's own short list. */
	.rail-status {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: auto;
	}

	nav {
		display: flex;
		flex-direction: column;
		/* The list is the only part allowed to scroll if the sections ever outgrow
		   the viewport; the art and the footer stay put. min-height: 0 overrides
		   a flex column's default of never shrinking a child under its content
		   size, which is what lets this scroll instead of just pushing the
		   capped rail taller than its own max-height. */
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	/* The stops on the rail: the same small caps every label on the page is set
	   in, a size up because this list is navigation rather than a caption. */
	nav a {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.6rem;
		align-items: center;
		padding: 0.55rem 0;
		font-size: var(--fs-xs);
		text-decoration: none;
		transition: color 160ms ease;
	}

	nav a:hover,
	nav a:focus-visible {
		color: var(--color-foreground);
	}

	nav a[aria-current] {
		color: var(--mint);
	}

	.idx {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.08em;
	}

	.dot {
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		background: currentcolor;
		opacity: 0.35;
	}

	nav a[aria-current] .dot {
		box-shadow: 0 0 0.7rem currentcolor;
		opacity: 1;
	}

	/* The page's own foot, under the section rather than under the rail: the
	   same small note, just read at the end of the page instead of at the end of
	   the column that navigates it. No sticky trick of its own needed now — the
	   rail itself is the fixed box, so sitting last in it (after .rail-status'
	   own margin-top: auto) is enough to land at the panel's foot and stay
	   there. */
	.rail-foot {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* The rail's own copy is the one read at this width and above; this one only
	   exists for when the rail has nowhere to put it. */
	.body-foot {
		display: none;
	}

	/* The one box every route wears — .surface-box (app.css) draws it; this is
	   the tighter of the two sizes it comes in, and everything the parts inside
	   divide themselves with.

	   Every rule runs the full width of what it divides — wall to wall, not
	   inset by the padding — which it does by bleeding out by --pad and putting
	   the same back as padding. --divide is the air either side of a rule, and
	   the gap of whatever lays the parts out, so the two cannot drift apart. */
	section {
		/* 24px, the standard card padding — every .box below inherits the same
		   figure, since it reads this custom property off its nearest section. */
		--pad: 1.5rem;
		--radius: var(--radius-panel);
		/* The colour on its own as well as the border it is usually written as: a
		   lattice drawn with grid gaps needs the one, everything else the other, and
		   a rule is a rule wherever it turns up. */
		--rule-color: color-mix(in srgb, var(--color-border) 75%, transparent);
		--rule: 1px solid var(--rule-color);
		--divide: 1.5rem;

		/* No panel in here is a heading of its own — the section's own h2 is that —
		   so every one of their titles is turned down to a label. */
		--title-size: var(--fs-xs);
		--title-color: var(--text-faint);

		box-sizing: border-box;
		display: grid;
		/* Two rows, not an implicit stack of auto ones: the name takes whatever it
		   needs, and the grid below it — the route's own single top-level child —
		   is handed everything left over rather than only what its own content
		   asks for, which is what lets that grid's rows stretch to fill it.
		   minmax(0, 1fr), not a bare 1fr: a bare 1fr is minmax(auto, 1fr), whose
		   auto floor is the content's own min-content height — exactly the size
		   this row is meant to be freed from. */
		grid-template-rows: auto minmax(0, 1fr);
		align-content: start;
		gap: var(--divide);
		/* A page to a screen, exactly — not a floor a page is free to run past.
		   There is no scroll to carry anything out of view (a stop on the rail is
		   a fresh page load, not a jump down one long one), so this is what the
		   box's own top padding actually leaves. Held back from the bottom edge
		   by --nav-pad-top, the same token the landing page's own status-bar
		   cards keep off it and the rail now keeps too — so the three ends line
		   up rather than this one running past the fold. */
		height: calc(100vh - var(--dash-pad-top) - var(--nav-pad-top));
		/* Cut, not scrolled: a route with more in it than one screen holds loses
		   whatever doesn't fit rather than growing a scrollbar of its own or
		   pushing the page past the fold. The wireframe is still catching up to
		   this — what's cut here is the cue to trim it, not a bug to route
		   around. */
		overflow: hidden;
	}

	/* The route's own name, sitting directly in the section — not a card of its
	   own, just the first line in the same box everything else stands in. */
	h2 {
		margin: 0;
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* How a section is divided, wherever the parts themselves are written: the
	   markup inside one belongs to the page rather than to this file, so the
	   vocabulary it is laid out with has to reach out of this scope to meet it. */

	/* A standalone card: bordered and given its own background, set apart from
	   whatever holds it by a gap — each graph gets its own frame rather than
	   sharing one. */
	.body :global(.box) {
		/* A box takes its height from the grid row it stretches to fill (below),
		   not from what's inside it — cut rather than let out, the same rule the
		   section around it already keeps. */
		overflow: hidden;
		padding: var(--pad);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}

	/* Opt-in, on any box given more than a single cell: a panel's own height is
	   otherwise however tall its content needs, which leaves the rest of a
	   taller box blank under a chart that only ever asked for one row.

	   .fill turns the whole chain down to the drawing into a flex column, so
	   each link stretches to the one above it — the panel, then whichever of
	   .plot (Trace and Heatmap both render one), .spread (Spread's) or .fleet
	   (a table) it holds. The last of those needs to be a flex parent itself
	   for the table inside it to have anything to stretch against. */
	.body :global(.box.fill) {
		display: flex;
		flex-direction: column;
	}

	.body :global(.box.fill .panel),
	.body :global(.box.fill .plot),
	.body :global(.box.fill .spread),
	.body :global(.box.fill .fleet) {
		flex: 1;
		min-height: 0;
	}

	.body :global(.box.fill .fleet) {
		display: flex;
	}

	/* The one board every card on the page is placed on: a 4x4 of equal cells,
	   24px apart. A card takes one cell unless it says otherwise, and says so
	   through $lib/grid.js's gridArea() — one vocabulary for both how big a box
	   is and where it sits, so no two pages divide the same grid a different
	   way. */
	.body :global(.grid) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		/* Every row the same height, dividing up whatever the section (above)
		   handed this grid rather than each row taking its own content's height
		   — that's what makes a page of one-cell boxes all come out the same
		   size. minmax(0, …), not auto: a box with more in it than its row is
		   tall isn't allowed to stretch the row to fit, it's cropped by the
		   box's own overflow: hidden instead. */
		grid-auto-rows: minmax(0, 1fr);
		/* Dense, not the default sparse flow: a card placed by hand at a later
		   cell leaves a gap in the normal reading order behind it, and dense is
		   what lets the boxes after it in the markup back-fill that gap rather
		   than leaving it empty. */
		grid-auto-flow: dense;
		height: 100%;
		gap: 1.5rem;
	}

	.body :global(.grid > *) {
		grid-column: span 1;
	}

	/* A row is read across, so it is never broken up to fit: under the width
	   the columns need, the table keeps its shape and the box scrolls instead.
	   Shared by the 24h stats table every route ends on and the containers
	   route's own fleet table. */
	.body :global(.fleet) {
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.body :global(.fleet table) {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}

	/* Left, like everything else on the page, and never wrapped: a reading broken
	   over two lines stops being one. The gutter is on the right of every cell, and
	   the section's own padding on the two outside ones, so the rules still run wall
	   to wall. */
	.body :global(.fleet th),
	.body :global(.fleet td) {
		padding: 0.65rem 1.5rem 0.65rem 0;
		font-weight: 400;
		text-align: left;
		white-space: nowrap;
	}

	.body :global(.fleet tr > :first-child) {
		padding-left: var(--pad);
	}

	.body :global(.fleet tr > :last-child) {
		padding-right: var(--pad);
	}

	/* The header names the columns once. It is the one row set in the page's small
	   caps rather than mono: it is a label, not a reading. */
	.body :global(.fleet thead th) {
		padding-top: var(--divide);
		padding-bottom: 0.5rem;
		border-bottom: var(--rule);
	}

	.body :global(.fleet tbody tr + tr th),
	.body :global(.fleet tbody tr + tr td) {
		border-top: var(--rule);
	}

	/* Under this the rail cannot hold its column and its labels at once. It goes
	   horizontal along the top instead — sticky rather than fixed, since a bar
	   this short never runs the risk of running out of room to stick in. */
	@media (max-width: 52rem) {
		.body {
			margin-left: 0;
		}

		/* The one-screen height is measured against the fixed sidebar beside it;
		   the bar this width folds the rail into sits above the section instead,
		   so holding the section to that same figure here would just clip it. */
		section {
			height: auto;
			overflow-y: visible;
		}

		.rail {
			position: sticky;
			top: 0;
			left: auto;
			width: auto;
			z-index: 2;
			height: auto;
			flex-direction: row;
			align-items: center;
			gap: 1rem;
			padding: 0.5rem 0;
			border: 0;
			border-bottom: 1px solid var(--color-border);
			border-radius: 0;
			background: var(--color-background);
		}

		.rail-art,
		.rail-status,
		.rail-foot {
			display: none;
		}

		.body-foot {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 0.25rem;
			margin-top: clamp(2rem, 6vh, 3.5rem);
		}

		nav {
			flex-direction: row;
			gap: 1.25rem;
			overflow-x: auto;
		}

		nav a {
			padding: 0.25rem 0;
			white-space: nowrap;
		}

		/* One column, so a graph keeps its own width instead of splitting it
		   with three neighbours. Collapsing the board itself is what does it:
		   a box that never asked to be placed already spans its one column,
		   and only the ones gridArea() put somewhere by hand need undoing. */
		.body :global(.grid) {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Any box gridArea() placed, on any page — matched by the inline style
		   itself rather than a marker class, so a page never has to remember a
		   mobile hook of its own. !important because an inline style is the one
		   thing a stylesheet rule cannot otherwise outrank. */
		.body :global(.grid > .box[style*='grid-column']) {
			grid-column: 1 / -1 !important;
			grid-row: auto !important;
		}
	}
</style>
