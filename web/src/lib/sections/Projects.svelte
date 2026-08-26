<script>
	import Placeholder from '$lib/components/Placeholder.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';

	/* The work worth showing. `tools` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			blurb:
				'Zero-dependency Python package that models a data pipeline as a directed acyclic graph, with content-defined chunking over a SQL backend. Published on PyPI and in use by researchers internally.',
			tools: ['Python', 'SQL', 'Git'],
			url: 'https://github.com/JS195/ancestree'
		},
		{
			name: 'Orderflow analysis',
			blurb:
				'Pipeline for Binance futures and spot data, with a dynamic feature registry covering OHLC aggregation, open interest, funding rate and CVD, read back through a multi-panel plotting framework.',
			tools: ['Python', 'Pandas', 'Polars', 'Plotly', 'NumPy']
		},
		{
			name: 'This server',
			blurb:
				'The machine this site is served from, and the site itself: metrics scraped off the box, cached behind a small API, and read back live on the server page.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server'
		},
		{
			name: 'ascii-art',
			blurb:
				'C11 CLI that converts raster images into ASCII art for the terminal or the web: block-averaged sampling, tone curve and glyph selection as separable, individually tested stages. Generates the art on this site, including the astronaut on the about page.',
			tools: ['C++', 'Git'],
			url: 'https://github.com/JS195/asciiArt'
		}
	];

	/* The open project is whichever one the reading line is standing on, and the
	   box stays in the flow of the page while that happens — so it keeps its own
	   distance from the boxes either side and nothing is held anywhere.

	   The whole trick is to work in the layout the list has when it is shut. A
	   project's row sits at `first + i * pitch`, and both of those hold still
	   whatever is open: the first row's top is fixed by the page above it, and
	   every row before the open one is a flat line of the same height. Measuring
	   live positions instead is what oscillates — opening a row moves the rows
	   under it, which changes the answer, which moves them back.

	   Because the same sum decides the answer and places the row, the project
	   that opens is the one already at the line: it does not travel there, it is
	   there. The rows below it shift down by the fold as it opens, which is the
	   list making room rather than the page moving. */
	const LINE = 0.42; /* the reading line, as a share of the screen — a hair
	                      above centre, since a fold opens downwards */

	let rows = $state([]);
	let open = $state(0);
	let queued = false;

	/* Row height plus the gap, read off the first adjacent pair that are both
	   shut — between those two there is no fold to inflate it. With one row open
	   out of four there is always such a pair. */
	function pitch() {
		const tops = rows.map((el) => el.getBoundingClientRect().top);
		for (let j = 0; j < rows.length - 1; j++) {
			if (j !== open && j + 1 !== open) return tops[j + 1] - tops[j];
		}
		return tops[1] - tops[0];
	}

	function onScroll() {
		/* getBoundingClientRect forces layout, and a scroll fires far more often
		   than the screen paints. */
		if (queued || rows.length < 2) return;
		queued = true;
		requestAnimationFrame(() => {
			queued = false;
			const first = rows[0].getBoundingClientRect().top;
			const into = window.innerHeight * LINE - first;
			open = Math.min(PROJECTS.length - 1, Math.max(0, Math.floor(into / pitch())));
		});
	}

	/* A shut title is still a thing to click: it scrolls that row onto the line,
	   rather than setting `open` behind the scroll's back for the next scroll
	   event to undo. */
	function stepTo(i) {
		const first = rows[0].getBoundingClientRect().top;
		const wanted = window.innerHeight * LINE - i * pitch();
		window.scrollTo({ top: window.scrollY + first - wanted });
	}

	/* Settle on load rather than waiting for the first scroll: the page can open
	   part-way down it, at /#projects or on a refresh. */
	$effect(() => {
		if (rows.length) onScroll();
	});
</script>

<svelte:window onscroll={onScroll} />

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="eyebrow">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, blurb, tools, url, live }, i (name)}
				<article class="card" class:open={i === open} bind:this={rows[i]}>
					<!-- The whole title line is the control: a collapsed project is a
					     line that opens, and that is all it does. -->
					<button type="button" class="head" aria-expanded={i === open} onclick={() => stepTo(i)}>
						<span class="icon">{String(i).padStart(2, '0')}</span>
						<h3>{name}</h3>
					</button>

					<!-- The fold is a grid row taken from 0fr to 1fr, which is the one
					     way a box of copy can be animated open without being told a
					     height it does not have. `inert` because a collapsed project is
					     only clipped, and its links would otherwise still be tabbed to. -->
					<div class="fold" inert={i !== open}>
						<div class="fold-inner">
							<div class="body">
								<p class="blurb">{blurb}</p>

								<ToolPills {tools} />
							</div>

							<div class="links">
								{#if url}
									<a href={url} target="_blank" rel="noopener noreferrer">View project ↗</a>
								{:else}
									<!-- Nothing to point at yet. -->
									<div class="slot"><Placeholder note="view project" lines={1} /></div>
								{/if}

								<!-- On this site rather than off it: the dashboard is its own
								     app, and this is the only door to it. -->
								{#if live}
									<a href={live}>Open dashboard →</a>
								{/if}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>
</section>

<style>
	/* The same centred column the other content pages take, at the width they
	   all share. The gap is this page's own, for whatever stands beside the one
	   box once there is more here than the cards. */
	.projects-page {
		gap: clamp(0.75rem, 1.5vh, 1.25rem);
	}

	.projects .eyebrow {
		display: block;
		margin-bottom: var(--pad);
	}

	/* The box painted the other way up. The theme's light values live in app.css
	   but are shadowed by .dark on the document, so the section restates them for
	   itself: everything inside — the placeholders, the rules, the quiet text — is
	   written in tokens and follows without being told. */
	.projects {
		--color-foreground: #0b0b0b;
		--color-border: #c9c8c0;
		--text-dim: #55544f;
		--text-faint: #6b6a64;
		/* How far the body's rule stands off its text. */
		--divide: 0.9rem;

		border-color: #e1e0d9;
		background: #f9f9f7;
		color: var(--color-foreground);
	}

	/* One project a row, top to bottom. --pad above and below every dividing
	   rule, so the list is read as separated entries rather than a block.

	   The gap is also the scroll a project gets: a row's turn on the reading line
	   lasts exactly as long as it takes the next row to reach it, which is this
	   plus the row's own height. Tight rows would deal the whole list out in one
	   flick of the wheel, so the shut list is set open rather than dense. */
	.cards {
		display: grid;
		gap: calc(var(--pad) * 1.6);
	}

	.card h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* Capped in ch like the about page's lede: a row is the full width of the
	   box now, which is far past what a line of prose can be read across. */
	.blurb {
		margin: 0;
		max-width: 84ch;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.7;
	}

	/* A card is a row of the list, divided from the next by a rule rather than
	   given a frame of its own. Closed it is only its title line; the gap under
	   that line belongs to the fold, or three flat lines would sit a full row
	   apart with nothing between them. */
	.card {
		display: grid;
	}

	/* 0fr to 1fr, which is the one way a box of copy animates open without being
	   handed a height it does not have — its own is whatever the blurb wraps to.
	   The gap goes with it, so a closed project takes exactly its line. */
	.fold {
		display: grid;
		grid-template-rows: 0fr;
		padding-top: 0;
		transition:
			grid-template-rows 380ms ease,
			padding-top 380ms ease,
			opacity 260ms ease;
		opacity: 0;
	}

	.card.open .fold {
		grid-template-rows: 1fr;
		padding-top: 1rem;
		opacity: 1;
	}

	/* The row is the clip: min-height: 0 because a grid item's automatic minimum
	   is its content, which would hold the row open at its full height. */
	.fold-inner {
		display: grid;
		gap: 1rem;
		min-height: 0;
		overflow: hidden;
	}

	/* Rows past the first take their own --pad, and the rule sits halfway up the
	   grid's gap above it — so the air reads the same either side of the line. */
	.card:nth-child(n + 2) {
		position: relative;
		padding-top: var(--pad);
	}

	.card:nth-child(n + 2)::before {
		content: '';
		position: absolute;
		/* Half the gap above the row, so the air reads the same either side of
		   the line however wide the gap is set. */
		top: calc(var(--pad) * -0.8);
		left: 0;
		right: 0;
		border-top: var(--rule);
	}

	/* A button, so it is reachable and pressable as the control it is, but wearing
	   none of a button's clothes: the line is the affordance. */
	.head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	/* Only the open one is at full strength; the flat lines below it are a list
	   of what is coming, not four titles competing. */
	.head h3 {
		color: var(--text-dim);
		transition: color 260ms ease;
	}

	.card.open .head h3 {
		color: var(--color-foreground);
	}

	.head:hover h3,
	.head:focus-visible h3 {
		color: var(--color-foreground);
	}

	/* The card's index rather than an icon: 00, 01, 02 — a count of the work,
	   not an illustration of it. */
	.icon {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	/* The summary and its pills stand off the left, the way the drawing rules them
	   in against a line. */
	.body {
		display: grid;
		gap: 0.75rem;
		align-content: start;
		padding-left: var(--divide);
		border-left: var(--rule);
	}

	/* A row, for the one card that has two links. */
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
	}

	.links a {
		color: currentcolor;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	/* An empty slot stands a link's width, so the feet all line up anyway. */
	.slot {
		width: min(100%, 9rem);
	}

	/* The open one still changes with the scroll — it just changes at once
	   rather than growing into place. */
	@media (prefers-reduced-motion: reduce) {
		.fold,
		.head h3 {
			transition: none;
		}
	}
</style>
