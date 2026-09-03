<script>
	import AsciiOwlCompare from '$lib/components/AsciiOwlCompare.svelte';
	import OrderflowEquityChart from '$lib/components/OrderflowEquityChart.svelte';
	import ServerMiniDashboard from '$lib/components/ServerMiniDashboard.svelte';
	import StudyBrief from '$lib/components/StudyBrief.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';
	import { briefs } from '$lib/data/briefs.js';

	/* The work worth showing. `tools` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here. `route` is its
	   full case study, on a page of its own — the full write-ups ran 10-14k
	   characters and buried the comparison this list exists for.

	   What the fold opens onto instead is that project's executive brief
	   (`brief`, keyed into data/briefs.js): one sheet, read in twenty seconds,
	   with the case study a link away for anyone who wants the rest. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			year: 2026,
			blurb:
				'Ten variations in, you are looking at final_v2_REAL.csv with no record of what produced it. Ancestree puts a pipeline’s DAG, metadata and artifact bytes in one SQLite file, no server needed. It stores 3.93× less and reruns 136× faster, across 975 tests.',
			tools: ['Python', 'SQL', 'Git'],
			url: 'https://github.com/JS195/ancestree',
			pypi: 'https://pypi.org/project/ancestree-track/',
			docs: 'https://js195.github.io/ancestree/',
			route: '/projects/ancestree/',
			brief: 'ancestree'
		},
		{
			name: 'This server',
			year: 2026,
			blurb:
				'A machine publishing a live feed about itself is publishing facts about a house. This one runs Debian behind an outbound tunnel, where what reaches the public API is a checked-in list rather than whatever the exporters expose. It draws 3.0 W and opens no ports.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server/',
			route: '/projects/server/',
			brief: 'server'
		},
		{
			name: 'Crypto orderflow',
			year: 2026,
			blurb:
				'Order flow cannot be backfilled, and the vendors that sell it retain days rather than years. So I built the collector: 11.5M rows a day off ten venue feeds, folded to 108 MB of Parquet, and the cross-sectional strategy study that reads it back.',
			tools: ['Python', 'Docker', 'Polars', 'NumPy'],
			liveBadge: true,
			route: '/projects/orderflow/',
			brief: 'orderflow'
		},
		{
			name: 'ascii-art',
			year: 2025,
			blurb:
				'A photograph is a grid of pixels and a terminal is a grid of characters. A C11 renderer converts one to the other, with sampling, tone curve, glyph selection and encoding as separately tested stages. It runs in 13 ms and draws every image on this site.',
			tools: ['C++', 'Git'],
			url: 'https://github.com/JS195/asciiArt',
			route: '/projects/ascii-art/',
			brief: 'ascii'
		}
	];

	/* A plain accordion: click a title to open it, click the open one to shut
	   it. Nothing opens on its own — not on load, not from a link elsewhere on
	   the site — a reader opens exactly the ones they ask to see. Scroll does
	   not drive this either: animating four sheets open and shut on every
	   scroll tick was the source of this section's lag. */
	let open = $state(-1);

	const toggle = (i) => (open = open === i ? -1 : i);
</script>

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="section-title">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, year, blurb, tools, url, live, pypi, docs, demo, liveBadge, route, brief }, i (name)}
				<article id={brief} class="card" class:open={i === open}>
					<!-- Three columns, top-aligned as one row. The title and blurb are
					     plain text now — the only thing that opens a card is the pill
					     on the right, so a reader skimming names and links never
					     triggers the fold by accident. -->
					<div class="head-row">
						<div class="head-col">
							<h3>
								{name}
								{#if live || liveBadge}
									<span class="callout live">
										<i class="dot" aria-hidden="true"></i>Live
									</span>
								{/if}
							</h3>

							<div class="tools-row"><ToolPills {tools} /></div>

							<div class="links">
								<a href={route}>Read case study →</a>
								{#if demo}
									<a href={demo} target="_blank" rel="noopener noreferrer">Interactive demo ↗</a>
								{/if}
								{#if url}
									<a href={url} target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>
								{/if}
								{#if pypi}
									<a href={pypi} target="_blank" rel="noopener noreferrer">View on PyPI ↗</a>
								{/if}
								{#if docs}
									<a href={docs} target="_blank" rel="noopener noreferrer">View docs ↗</a>
								{/if}
								{#if live}
									<a href={live}>Open dashboard →</a>
								{/if}
							</div>
						</div>

						<div class="summary">
							<p class="blurb">{blurb}</p>
						</div>

						<div class="stat">
							<span class="year">{year}</span>
							<button type="button" class="expand" aria-expanded={i === open} onclick={() => toggle(i)}>
								{i === open ? 'Collapse' : 'Expand'}
								<!-- The fold's own state, said again rather than left to the shape
								     of the row: a collapsed row and an open one look enough alike
								     from a glance that the mark is what actually answers "which is
								     this." -->
								<span class="chevron" aria-hidden="true"></span>
							</button>
						</div>
					</div>

					<!-- The fold is a grid row taken from 0fr to 1fr, which is the one
					     way a sheet of copy can be animated open without being told a
					     height it does not have. `inert` because a collapsed project is
					     only clipped, and its links would otherwise still be tabbed to. -->
					<div class="fold" inert={i !== open}>
						<div class="fold-inner">
							{#if brief === 'ascii'}
								<!-- The one project that can be shown as itself: source,
								     mono, gray and color side by side is the demonstration,
								     text in the page rather than a picture of text. -->
								<StudyBrief brief={briefs[brief]}>
									{#snippet figure()}<AsciiOwlCompare />{/snippet}
								</StudyBrief>
							{:else if brief === 'server'}
								<!-- Likewise the real thing rather than a chart of it: the same
								     live telemetry grid the full case study shows. -->
								<StudyBrief brief={briefs[brief]}>
									{#snippet figure()}<ServerMiniDashboard />{/snippet}
								</StudyBrief>
							{:else if brief === 'orderflow'}
								<!-- The strategy the archive was built for, not the archive's own
								     uptime: the same equity curve the full case study plots. -->
								<StudyBrief brief={briefs[brief]}>
									{#snippet figure()}<OrderflowEquityChart />{/snippet}
								</StudyBrief>
							{:else}
								<StudyBrief brief={briefs[brief]} />
							{/if}
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

	.projects .section-title {
		display: block;
		margin-bottom: var(--pad);
	}

	/* The box painted the other way up. The theme's light values live in app.css
	   but are shadowed by .dark on the document, so the section restates them for
	   itself: everything inside — the placeholders, the rules, the quiet text — is
	   written in tokens and follows without being told. --focus-ring goes with
	   them: plain --mint measures 1.6:1 on this background, same as every other
	   accent this section shadows to its -ink form. */
	.projects {
		--color-foreground: #0b0b0b;
		--color-border: #c9c8c0;
		--text-dim: #55544f;
		--text-faint: #6b6a64;
		--focus-ring: var(--mint-ink);

		/* An open card's white content runs flush to the surface-box's own
		   edge, and .surface-box rounds its corners without clipping to
		   them — so without this, that white box squares off past the
		   rounded corner instead of following it. */
		overflow: hidden;
		border-color: #e1e0d9;
		background: #f9f9f7;
		color: var(--color-foreground);
	}

	/* The project stack reaches the surface border. The heading keeps the
	   surface padding; the title bars and opened drawings do not. */
	.cards {
		display: grid;
		margin: 0 calc(var(--pad) * -1) calc(var(--pad) * -1);
	}

	.card h3 {
		margin: 0;
		font-size: var(--fs-lg);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* Its own row rather than run into the title — ToolPills renders a link
	   for any tool with a website, and a link can't nest inside a button. */
	.tools-row {
		margin-top: 0.4rem;
	}

	/* One block a reader takes in at a glance: the problem, the thing built for
	   it, and the number it runs at. Capped in ch like the about page's lede,
	   since a row is the full width of the box and that is past what a line
	   of prose can be read across. */
	.blurb {
		margin: 0;
		max-width: 62ch;
		color: var(--text-dim);
		font-size: var(--fs-sm);
		line-height: 1.7;
	}

	/* Each project is one title row followed by its optional blueprint. */
	.card {
		display: grid;
	}

	/* 0fr to 1fr, which is the one way a box of copy animates open without being
	   handed a height it does not have. The gap goes with it, so a closed
	   project takes exactly its own rows. */
	.fold {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transition:
			grid-template-rows 380ms ease,
			opacity 260ms ease;
	}

	.card.open .fold {
		grid-template-rows: 1fr;
		opacity: 1;
	}

	/* The drawing is clipped only for the height animation. Its own background
	   runs flush to both sides of the project surface. */
	.fold-inner {
		min-height: 0;
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.fold {
			transition: none;
		}
	}

	/* A row, under the paragraph they belong to. */
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		margin-top: 0.75rem;
	}

	.links a {
		color: currentcolor;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	/* Every title row ends in one full-width dividing line. */
	.head-row {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) auto;
		gap: 1.25rem;
		align-items: start;
		padding: var(--pad);
		background: #f9f9f7;
		border-bottom: 1px solid #c9c8c0;
	}

	/* The open title casts a simple full-width shadow onto the blueprint below. */
	.card.open .head-row {
		box-shadow: 0 0.6rem 0.7rem -0.55rem rgb(18 35 60 / 38%);
	}

	/* The title and the links under it, stacked as the row's left column. Plain
	   text now — nothing here toggles the fold, so a click on the name or a
	   pill scrolled past doesn't surprise-open a card. */
	.head-col {
		display: grid;
	}

	.head-col h3 {
		color: var(--color-foreground);
	}

	.summary {
		padding-top: 0.15rem;
	}

	/* The year and the one control that opens the card, on the far right of
	   the row. */
	.stat {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.1rem;
	}

	.year {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	/* The sole way to open a card: a pill rather than the bare year-and-mark
	   this used to be, so it reads as a control rather than a label a reader
	   might mistake the rest of the row for sharing. */
	.expand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.8rem 0.35rem 0.9rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.02em;
		white-space: nowrap;
		background: #fff;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		cursor: pointer;
		transition:
			color 160ms ease,
			border-color 160ms ease;
	}

	.expand:hover {
		color: var(--color-foreground);
		border-color: var(--color-foreground);
	}

	.card.open .expand {
		color: var(--color-foreground);
	}

	/* Two strokes rotated into a V, turned through 180° when the fold opens —
	   a drawn mark rather than a glyph, so it rotates about its own centre
	   instead of about a font's baseline. */
	.chevron {
		width: 0.6rem;
		height: 0.6rem;
		border-right: 1.5px solid currentcolor;
		border-bottom: 1.5px solid currentcolor;
		transform: translateY(-15%) rotate(45deg);
		transition: transform 380ms ease;
	}

	.card.open .chevron {
		transform: translateY(10%) rotate(225deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.chevron {
			transition: none;
		}
	}

	/* Beside the title, so a live project is flagged on the index itself
	   rather than only once its case study is open. Plain text and a dot,
	   not a pill: nothing here is clickable, and a bordered badge implied
	   otherwise. */
	.callout {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-left: 0.6rem;
		vertical-align: middle;
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	/* The same mint every other live indicator wears (StatusBar's own dot,
	   the dashboard's). -ink rather than the plain accent: on this card's
	   white background, plain --mint measures 1.6:1, under the 4.5:1 text
	   needs. */
	.callout.live {
		color: var(--mint-ink);
	}

	.callout .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: currentcolor;
		box-shadow: 0 0 0.5rem currentcolor;
	}

	/* --- narrow ---------------------------------------------------------- */

	@media (max-width: 40rem) {
		.head-row {
			grid-template-columns: minmax(0, 1fr);
		}

		.summary {
			padding-top: 0;
		}
	}
</style>
