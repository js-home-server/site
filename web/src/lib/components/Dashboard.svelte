<script>
	import Placeholder from './Placeholder.svelte';

	/* The shell every dashboard-style page wears: a sticky rail of sections down
	   the left, the sections themselves down the right, both off one list so
	   neither can drift from the other. `body` is what goes in a section, rendered
	   with the section it belongs to; `foot` is the note pinned to the foot of the
	   rail, if it has one, and `max` is how wide the whole thing is allowed to get
	   — `none` for a page that runs to the width of the window. */
	let { title, sections, body, foot, max = '82rem' } = $props();

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

<div class="dash" style:max-width={max}>
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
					<section id={section.id} {@attach spy(section.id)}>
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
		--stick: calc(var(--nav-pad-top) + 0.5rem);

		display: grid;
		grid-template-columns: var(--rail) minmax(0, 1fr);
		gap: clamp(1.5rem, 3vw, 3rem);
		margin-inline: auto;
		padding: clamp(1.5rem, 4vh, 2.5rem) var(--gutter) clamp(3rem, 10vh, 6rem);

		/* The line dividing the two columns, drawn down the page rather than down the
		   rail: the rail is sticky and only as tall as its own contents, so its
		   border would stop partway. Measured on the content box, so it starts level
		   with the title and ends with the last section rather than running out into
		   the page's padding. */
		background: linear-gradient(var(--color-border), var(--color-border)) no-repeat;
		background-origin: content-box;
		background-position: var(--rail) 0;
		background-size: 1px 100%;
	}

	/* Sticky, not fixed: it stays with the column it belongs to at any width, and
	   the shell's overflow: clip does not make a scrollport, so this resolves
	   against the viewport as intended. */
	.rail {
		position: sticky;
		top: var(--stick);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		/* No align-self: start here — the rail stretches to the grid row's height
		   (the page's, since body is the tall one) rather than shrinking to its own
		   content, so there is a box tall enough for .rail-foot's own stickiness,
		   below, to have anywhere to stick to. */
		padding-right: 1.25rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		/* The list is the only part allowed to scroll if the sections ever outgrow
		   the viewport; the art and the footer stay put. */
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
	   the column that navigates it. */
	/* Sticky on its own account, not just carried by the rail's: margin-top: auto
	   floats it to the bottom of the rail's (page-tall) box at rest, and its own
	   stickiness holds it there against the viewport once you scroll — rather than
	   the rail's top offset (which shortens once it stops trailing the header)
	   dragging it back up with it. */
	.rail-foot {
		position: sticky;
		bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: auto;
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
	   run. */
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		/* Grid's own default stretches every item to the row's tallest box, which
		   inflates a shorter section's heading to eat the slack — a box keeps
		   whatever height its own contents ask for instead. */
		align-items: start;
		gap: clamp(1.5rem, 3vw, 3rem);
		margin-bottom: clamp(2rem, 6vh, 3.5rem);
	}

	/* Nothing follows the last one, and the gap it would leave is what the column's
	   divider would have to run past. */
	.row:last-child {
		margin-bottom: 0;
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

	/* How a section is divided, wherever the parts themselves are written: the
	   markup inside a section belongs to the page rather than to this file, so the
	   vocabulary it is laid out with has to reach out of this scope to meet it.

	   A band is cells side by side, a rule between them and one over the lot;
	   `--cells` is how they divide, the default being equal shares. Nest one in a
	   cell of another to divide it again — the inner band is the division, not a
	   second row, so it drops the rule and the padding it would otherwise wear. */
	.body :global(.band) {
		display: grid;
		grid-template-columns: var(--cells, repeat(auto-fit, minmax(0, 1fr)));
		border-top: var(--rule);
	}

	.body :global(.band > *) {
		padding: var(--divide) var(--pad);
	}

	.body :global(.band > * + *) {
		border-left: var(--rule);
	}

	/* A band that opens a section: the rule under the heading is its top rule, so it
	   neither draws a second one nor stands a gap below the first. */
	.body :global(h2 + .band) {
		margin-top: calc(-1 * var(--divide));
		border-top: 0;
	}

	.body :global(.band.nested) {
		padding: 0;
		border-top: 0;
	}

	/* Out to the section's own edges, which is where a band's rules have to end,
	   and down to the bottom one, which the section's padding would otherwise hold
	   it off. */
	.body :global(.bleed) {
		margin-inline: calc(-1 * var(--pad));
		margin-bottom: calc(-1 * var(--pad));
	}

	/* Readings one under the other with a line between them, run out to the edges
	   of whatever holds them — the section itself for a column of metric rows, a
	   band's cell for the volumes, which is the same distance either way. */
	.body :global(.stack) {
		display: grid;
		gap: var(--divide);
		align-content: start;
	}

	.body :global(.stack > * + *) {
		margin-inline: calc(-1 * var(--pad));
		padding-top: var(--divide);
		padding-inline: var(--pad);
		border-top: var(--rule);
	}

	/* Under this the rail cannot hold its column and its labels at once. It goes
	   horizontal along the top instead, still sticky, still the way through the
	   page. */
	@media (max-width: 52rem) {
		.dash {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
			/* One column, nothing to divide. */
			background: none;
		}

		.rail {
			z-index: 2;
			flex-direction: row;
			align-items: center;
			gap: 1rem;
			padding: 0.5rem 0;
			border-bottom: 1px solid var(--color-border);
			background: var(--color-background);
		}

		.rail-art,
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

		.body :global(.stack) {
			--graph-min: 5rem;
		}

		/* No band holds its cells side by side at this width: they stack, and the
		   rule between them lies down with them. */
		.body :global(.band) {
			grid-template-columns: minmax(0, 1fr);
		}

		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
		}

		.body :global(.band > * + *) {
			border-top: var(--rule);
			border-left: 0;
		}
	}
</style>
