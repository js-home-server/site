<script>
	import AsciiClock from './AsciiClock.svelte';

	/* The shared dashboard shell: a fixed rail of route links on the left, the
	   current route's content on the right. Rail and heading read off the same
	   `sections` list so they can't disagree about which page you're on. */
	let { title, sections, current, rail, foot, max = '82rem', children } = $props();

	let currentLabel = $derived(sections.find((section) => section.href === current)?.label ?? title);
</script>

<!-- --dash-max mirrors max-width so the fixed rail's `left` calc can centre against it. -->
<div class="dash" style="max-width: {max}; --dash-max: {max}">
	<aside class="rail" aria-label="Page sections">
		<!-- Decorative — the nav already names the page, this is just ascii art. -->
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
		<!-- For the outline, not the eye — without it the doc starts at h2 with nothing above it. -->
		<h1 class="sr-only">{title}</h1>

		<section class="surface-box">
			<h2>{currentLabel}</h2>
			{@render children()}
		</section>

		{#if foot}
			<!-- Narrow width: the rail becomes a bar with no room for its own foot, so it reads here instead. -->
			<div class="body-foot">{@render foot()}</div>
		{/if}
	</main>
</div>

<style>
	.dash {
		/* Rail is a fixed column, page takes the rest. Cap is the caller's — a dashboard and prose don't want the same one. */
		--rail: 13rem;
		--dash-gap: clamp(1.5rem, 3vw, 3rem);
		--dash-pad-top: clamp(1.5rem, 4vh, 2.5rem);

		margin-inline: auto;
		/* Same top/bottom token as the header, so the page ends as far off the fold as it began. */
		padding: var(--dash-pad-top) var(--gutter) var(--nav-pad-top);
	}

	/* Fixed not sticky: every route is capped at one screen, so there's no long
	   page for a sticky rail to run out of room in. Left edge is calc'd by hand
	   to land where a grid column would; top is its own padding since fixed
	   positioning doesn't inherit any. */
	.rail {
		position: fixed;
		top: var(--dash-pad-top);
		left: calc(max(0px, (100vw - min(100vw, var(--dash-max))) / 2) + var(--gutter));
		width: var(--rail);
		/* Same --nav-pad-top the header text sits off the top by, so the rail frames the same way. */
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

	/* Pushed clear of the fixed rail by hand — no grid track holding that width open anymore. */
	.body {
		margin-left: calc(var(--rail) + var(--dash-gap));
		min-width: 0;
	}

	/* Caller-supplied content, pushed to the foot of the rail so it and .rail-foot sit together at the bottom. */
	.rail-status {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: auto;
	}

	nav {
		display: flex;
		flex-direction: column;
		/* min-height: 0 lets the list scroll instead of pushing the rail past its cap — art and footer stay put. */
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	/* Same small caps as every label on the page, a size up since this is nav not a caption. */
	nav a {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.6rem;
		align-items: center;
		padding: 0.55rem 0;
		font-family: var(--font-mono);
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

	/* Same note as .rail-status, just at the page's end instead of the nav's. Lands at the panel foot via margin-top: auto above it. */
	.rail-foot {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Only shown when the rail has nowhere to put its own foot (narrow width). */
	.body-foot {
		display: none;
	}

	/* .surface-box (app.css) draws the card; --pad/--divide below keep every rule
	   bleeding wall-to-wall instead of inset by the padding. */
	section {
		/* 24px card padding, inherited by every .box below. */
		--pad: 1.5rem;
		--radius: var(--radius-panel);
		/* Colour on its own too, for lattices drawn with grid gaps rather than borders. */
		--rule-color: color-mix(in srgb, var(--color-border) 75%, transparent);
		--rule: 1px solid var(--rule-color);
		--divide: 1.5rem;

		/* Route's own h2 is the real heading, so panel titles here are downgraded to labels. */
		--title-size: var(--fs-xs);
		--title-color: var(--text-faint);

		box-sizing: border-box;
		display: grid;
		/* minmax(0, 1fr) not bare 1fr: a bare 1fr floors at min-content height, which defeats the stretch this row needs. */
		grid-template-rows: auto minmax(0, 1fr);
		align-content: start;
		gap: var(--divide);
		/* Exactly one screen — a route is a fresh page load, never a long scroll. Same --nav-pad-top the rail keeps off the fold. */
		height: calc(100vh - var(--dash-pad-top) - var(--nav-pad-top));
		/* Cut, not scrolled — overflow is the cue to trim the page, not a bug to work around. */
		overflow: hidden;
	}

	/* Just the first line in the shared box, not a card of its own. */
	h2 {
		margin: 0;
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* A standalone card, bordered with its own background — each graph gets its own frame rather than sharing one. */
	.body :global(.box) {
		/* Height comes from the grid row it fills, not its content — cut, same as the section around it. */
		overflow: hidden;
		padding: var(--pad);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}

	/* Opt-in for a box spanning more than one cell: without it, content just sits
	   at its natural height and leaves the rest of a tall box blank. .fill turns
	   the chain (panel → .plot/.spread/.fleet) into a flex column so each link stretches. */
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

	/* The 4x4 board every card sits on. One cell unless $lib/grid.js's gridArea() says otherwise. */
	.body :global(.grid) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		/* minmax(0, ...) not auto — a tall box gets cropped by its own overflow: hidden, never stretches the row. */
		grid-auto-rows: minmax(0, 1fr);
		/* Dense: a hand-placed card leaves a gap in reading order; dense back-fills it. */
		grid-auto-flow: dense;
		height: 100%;
		gap: 1.5rem;
	}

	.body :global(.grid > *) {
		grid-column: span 1;
	}

	/* A row reads across, never wraps — under min width, the table keeps shape and the box scrolls instead. */
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

	/* No wrap — a reading split over two lines stops being one reading. Gutter right, section padding on the outer edges. */
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

	/* Small caps not mono — a label, not a reading. */
	.body :global(.fleet thead th) {
		padding-top: var(--divide);
		padding-bottom: 0.5rem;
		border-bottom: var(--rule);
	}

	.body :global(.fleet tbody tr + tr th),
	.body :global(.fleet tbody tr + tr td) {
		border-top: var(--rule);
	}

	/* Rail can't hold its column + labels below this width — goes horizontal along the top, sticky not fixed. */
	@media (max-width: 52rem) {
		.body {
			margin-left: 0;
		}

		/* The one-screen height assumed a fixed sidebar; here the rail sits above the section, so that height would just clip it. */
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

		/* One column — a box never placed by hand already spans it; only gridArea()'s manual placements need undoing. */
		.body :global(.grid) {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Matched by the inline style itself, not a marker class, so no page needs its own mobile hook. !important beats the inline style. */
		.body :global(.grid > .box[style*='grid-column']) {
			grid-column: 1 / -1 !important;
			grid-row: auto !important;
		}
	}
</style>
