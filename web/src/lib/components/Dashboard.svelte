<script>
	import Placeholder from './Placeholder.svelte';

	/* The shell every dashboard-style page wears: a sticky rail of sections down
	   the left, the sections themselves down the right, both off one list so
	   neither can drift from the other. `body` is what goes in a section, rendered
	   with the section it belongs to; `rail` is extra content stood under the
	   nav list, if the caller has any; `foot` is the note pinned to the foot of
	   the rail, if it has one, and `max` is how wide the whole thing is allowed
	   to get — `none` for a page that runs to the width of the window. */
	let { title, sections, body, rail, foot, max = '82rem' } = $props();

	/* The rail is fixed rather than laid out in a grid column, so its own left
	   edge has to be worked out rather than handed to it: this is the same
	   length `max-width` resolves to, just readable from a custom property so
	   .rail's `left` calc can centre against it too. `none` has no width to
	   measure against — 100vw stands for "the page's own full width" instead,
	   which collapses that calc to the gutter alone. */
	let dashMax = $derived(max === 'none' ? '100vw' : max);

	/* The first stop until an observer says otherwise, which is where the page
	   opens. */
	let marked = $state(null);
	let current = $derived(marked ?? sections[0].id);

	/* Which section the rail marks. An observer on the section itself, rather than
	   scroll maths or a document lookup: it is the platform's own answer to "what
	   is on screen". Top-biased margin so the mark flips when a heading reaches
	   the upper third, which is where the eye is, not when the section is half
	   gone. */
	const spy = (id) => (element) => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) marked = id;
			},
			{ rootMargin: '-20% 0px -70% 0px' }
		);

		observer.observe(element);
		return () => observer.disconnect();
	};

	/* Sections sharing a `row` land in the same box-to-box line instead of one under
	   the other — CPU beside Memory rather than CPU above Memory. Everything else
	   about a grouped section (its own box, heading, rail stop) stays exactly what
	   it is on its own; only which line it falls on changes. */
	let rows = $derived.by(() => {
		const groups = [];
		for (const section of sections) {
			const last = groups.at(-1);
			if (section.row && last?.[0].row === section.row) last.push(section);
			else groups.push([section]);
		}
		return groups;
	});
</script>

<div class="dash" style="max-width: {max}; --dash-max: {dashMax}">
	<aside class="rail" aria-label="Page sections">
		<div class="rail-art" aria-hidden="true">
			<Placeholder note="ascii" lines={6} />
		</div>

		<nav>
			{#each sections as section, i (section.id)}
				<a
					class="eyebrow"
					href="#{section.id}"
					aria-current={current === section.id ? 'location' : undefined}
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

	<div class="body">
		<!-- The page's own heading. The sections carry the titling now, so this is
		     for the outline rather than the eye: without it the document starts at
		     h2 and the sections are under nothing. -->
		<h1>{title}</h1>

		<!-- Every line is a row, whatever is on it: a row of one lays out exactly as
		     a lone section did, so the sections are written once rather than once
		     per branch. -->
		{#each rows as group (group[0].id)}
			<div class="row">
				{#each group as section (section.id)}
					<section
						id={section.id}
						class:bare={section.bare}
						class:hide-title={section.hideTitle}
						{@attach spy(section.id)}
					>
						<h2>{section.label}</h2>
						{@render body(section)}
					</section>
				{/each}
			</div>
		{/each}

		{#if foot}
			<!-- The rail becomes the horizontal bar at this width, and there is no
			     room in it for a foot of its own — so the note reads from here
			     instead, below the last section, rather than going unread. -->
			<div class="body-foot">{@render foot()}</div>
		{/if}
	</div>
</div>

<style>
	.dash {
		/* The rail is a fixed column and the page takes the rest. Centred like
		   .page; the cap on it is the caller's, since a dashboard and a page of
		   prose do not want the same one. */
		--rail: 13rem;
		--dash-gap: clamp(1.5rem, 3vw, 3rem);
		--row-gap: clamp(2rem, 6vh, 3.5rem);
		--dash-pad-top: clamp(1.5rem, 4vh, 2.5rem);
		/* Where the rail sits, fixed to the viewport: under the site header and
		   this box's own top padding, same as it would land in normal flow —
		   fixed positioning does not care about flow, so this is worked out by
		   hand instead of inherited from it. */
		--stick: calc(var(--header-height) + var(--dash-pad-top));

		margin-inline: auto;
		padding: var(--dash-pad-top) var(--gutter) clamp(3rem, 10vh, 6rem);

		/* The line dividing the rail from the page, drawn down the page rather than
		   down the rail: the rail is fixed and only as tall as the viewport, so its
		   own border would stop short of a page taller than one screen. Measured on
		   the content box, so it starts level with the title and ends with the last
		   section rather than running out into the page's padding. */
		background: linear-gradient(var(--color-border), var(--color-border)) no-repeat;
		background-origin: content-box;
		background-position: var(--rail) 0;
		background-size: 1px 100%;
	}

	/* Fixed, not sticky: a sticky rail only holds its position while its own
	   containing block (here, as tall as the page's every section) has room
	   left to be stuck in, and runs out of it — and starts visibly scrolling —
	   in the last screen of a page this long. Fixed has no such range to run
	   out of. Its left edge is worked out by hand to land where the grid
	   column it replaced used to: half of whatever space is left over past
	   --dash-max, plus the page's own gutter. */
	.rail {
		position: fixed;
		top: var(--stick);
		left: calc(max(0px, (100vw - min(100vw, var(--dash-max))) / 2) + var(--gutter));
		width: var(--rail);
		height: calc(100vh - var(--stick) - 1rem);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-right: 1.25rem;
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
		font-size: 0.7rem;
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
		font-size: 0.65rem;
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

	/* The page's own foot, under the last section rather than under the rail: the
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

	/* Read out, never drawn: the sections do the titling, and this is only here so
	   the document has something to start its outline at. */
	h1 {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* A section is one box, divided rather than filled with smaller ones: the parts
	   inside wear no frame of their own and are separated by a rule instead, drawn a
	   shade under the box's own border so the box stays the strongest line on the
	   page.

	   Every rule runs the full width or height of what it divides — wall to wall, not
	   inset by the padding — which it does by bleeding out by --pad and putting the
	   same back as padding. --divide is the air either side of a rule, and the gap of
	   whatever lays the parts out, so the two cannot drift apart. */
	section {
		--pad: clamp(1rem, 2.5vw, 1.75rem);
		/* The colour on its own as well as the border it is usually written as: a
		   lattice drawn with grid gaps needs the one, everything else the other, and
		   a rule is a rule wherever it turns up. */
		--rule-color: color-mix(in srgb, var(--color-border) 75%, transparent);
		--rule: 1px solid var(--rule-color);
		--divide: clamp(1rem, 2vw, 1.5rem);

		/* No panel in here is a heading of its own — the section's own h2 is that —
		   so every one of their titles is turned down to a label. */
		--title-size: 0.68rem;
		--title-color: var(--text-faint);

		display: grid;
		gap: var(--divide);
		padding: var(--pad);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--surface);
		/* Clears the sticky rail when a link jumps here. */
		scroll-margin-top: var(--stick);
	}

	/* One line of the page. A box on it keeps its own border and heading, so all
	   the row owns is how the boxes divide the width and what follows the line —
	   which is why no section carries a margin of its own. Equal shares, so a box
	   shrinks with the line rather than however wide its own content wants to
	   run. Positioned for the seam tick below: a row's own left edge sits
	   --dash-gap clear of the rail's divider, which is what that tick reaches
	   back across to touch it. */
	.row {
		position: relative;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		/* Grid's own default stretches every item to the row's tallest box, which
		   inflates a shorter section's heading to eat the slack — a box keeps
		   whatever height its own contents ask for instead. */
		align-items: start;
		gap: clamp(1.5rem, 3vw, 3rem);
		margin-bottom: var(--row-gap);
	}

	/* Nothing follows the last one, and the gap it would leave is what the column's
	   divider would have to run past. */
	.row:last-child {
		margin-bottom: 0;
	}

	/* A tick off the rail's own divider, one per seam between sections: the same
	   line that separates the rail from the page, echoed all the way across the
	   boxes below at each place one section ends and the next begins. Full row
	   width plus the gap back to the divider — it stops at the row's own right
	   edge, short of the viewport by the page's own gutter, the same margin
	   every box already keeps. */
	.row + .row::before {
		content: '';
		position: absolute;
		left: calc(-1 * var(--dash-gap));
		top: calc(-1 * var(--row-gap) / 2);
		width: calc(100% + var(--dash-gap));
		height: 1px;
		background: var(--color-border);
	}

	/* The heading is separated from the section's contents by the same rule that
	   divides them from each other. */
	h2 {
		margin: 0 calc(-1 * var(--pad));
		padding: 0 var(--pad) var(--divide);
		border-bottom: var(--rule);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	/* A section that builds its own boxes in its own content rather than wearing
	   the generic frame every other section does — every section now, each with
	   its own headline band and its own graph boxes. No border, no background,
	   and no padding either: nothing here has a border left to inset from, and
	   each piece inside (.headline, .grid) already carries its own padding —
	   left in, this would only push everything off the edges the rail's art,
	   the divider, and the seam tick all line up on. */
	section.bare {
		border: 0;
		background: none;
		padding: 0;
	}

	/* Dropped to screen-reader-only: the body supplies its own visible title
	   (cpu's headline band names itself), so the generic heading would only
	   double it up. Same technique as the page's own hidden h1. */
	section.hide-title h2 {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* How a section is divided, wherever the parts themselves are written: the
	   markup inside a section belongs to the page rather than to this file, so the
	   vocabulary it is laid out with has to reach out of this scope to meet it. */

	/* A standalone card: bordered and given its own background, set apart from
	   whatever holds it by a gap — each graph gets its own frame rather than
	   sharing one. */
	.body :global(.box) {
		padding: var(--pad);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--surface);
	}

	/* A row of .box cards, `--cells` dividing it the way it divides any grid on
	   the page — equal shares by default. */
	.body :global(.grid) {
		display: grid;
		grid-template-columns: var(--cells, repeat(auto-fit, minmax(0, 1fr)));
		gap: var(--divide);
	}

	/* Under this the rail cannot hold its column and its labels at once. It goes
	   horizontal along the top instead — sticky rather than fixed, since a bar
	   this short never runs the risk of running out of room to stick in, and
	   sticky is what leaves it out of the way of a link jumping into a section
	   underneath it, which is what scroll-margin-top is measured against. */
	@media (max-width: 52rem) {
		.dash {
			/* One column, nothing to divide. */
			background: none;
		}

		.body {
			margin-left: 0;
		}

		/* Nothing for the tick to reach back to at this width — the divider
		   itself is gone (.dash's own background, above), so the echo of it
		   goes too. */
		.row + .row::before {
			display: none;
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
			border-bottom: 1px solid var(--color-border);
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
		   with its neighbour. */
		.body :global(.grid) {
			grid-template-columns: minmax(0, 1fr);
		}

		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
		}
	}
</style>
