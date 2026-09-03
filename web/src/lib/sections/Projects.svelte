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
	   it. Scroll does not drive this — animating four sheets open and shut on
	   every scroll tick was the source of this section's lag. */
	let open = $state(PROJECTS.findIndex((project) => project.name === 'Ancestree'));

	const toggle = (i) => (open = open === i ? -1 : i);

	/* Elsewhere on the site — the hero's "View my work" and the status bar's
	   "View project" — links open a specific card rather than just scrolling
	   here, by name rather than index so those links don't have to know the
	   list's order. */
	const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

	function openProject(event) {
		const index = PROJECTS.findIndex((project) => slug(project.name) === event.detail);
		if (index !== -1) open = index;
	}
</script>

<svelte:window onopenproject={openProject} />

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="section-title">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, year, blurb, tools, url, live, pypi, docs, demo, liveBadge, route, brief }, i (name)}
				<article class="card" class:open={i === open}>
					<!-- Three columns, top-aligned as one row. Two buttons, not one — a
					     link can't nest inside a button, and the links under the pills
					     are real ones — so the row is opened either from the title on
					     the left or the year and chevron on the right, both calling the
					     same toggle. ToolPills is a row of links too and sits under the
					     button for the same reason. -->
					<div class="head-row">
						<div class="head-col">
							<button type="button" class="head" aria-expanded={i === open} onclick={() => toggle(i)}>
								<span class="icon">{String(i).padStart(2, '0')}</span>
								<h3>
									{name}
									{#if live || liveBadge}
										<span class="callout live">
											<i class="dot" aria-hidden="true"></i>Live
										</span>
									{/if}
								</h3>
							</button>

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

						<button type="button" class="stat" aria-expanded={i === open} onclick={() => toggle(i)}>
							<span class="year">{year}</span>
							<!-- The fold's own state, said again rather than left to the shape
							     of the row: a collapsed row and an open one look enough alike
							     from a glance that the mark is what actually answers "which is
							     this." -->
							<span class="chevron" aria-hidden="true"></span>
						</button>
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
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* The pills, aligned under the title the same way .links (below) is: the
	   icon column's width plus the gap beside it (.head-col's --icon-col), so
	   the row starts under the title rather than the icon above it. Its own
	   row rather than inside .head — ToolPills renders a link for any tool
	   with a website, and a link can't nest inside a button. */
	.tools-row {
		margin-top: 0.4rem;
		margin-left: calc(var(--icon-col) + 0.75rem);
	}

	/* One block a reader takes in at a glance: the problem, the thing built for
	   it, and the number it runs at. Capped in ch like the about page's lede,
	   since a row is the full width of the box and that is past what a line
	   of prose can be read across. */
	.blurb {
		margin: 0;
		max-width: 84ch;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.72rem;
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
		/* The icon column's width plus the gap beside it (.head, above) — so
		   this row starts exactly under the title, not under the icon. */
		margin-left: calc(var(--icon-col) + 0.75rem);
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

	/* The title and the links under it, stacked as the row's left column. */
	.head-col {
		/* Shared with .head and .links below, so the links row's left edge
		   lands exactly under the title rather than the icon above it. */
		--icon-col: 1.6rem;

		display: grid;
	}

	.summary {
		padding-top: 0.15rem;
	}

	/* Both toggles are plain buttons wearing the row's own type: no chrome of
	   their own, since what they look like is the header bar. */
	.head,
	.stat {
		padding: 0;
		text-align: left;
		background: none;
		border: 0;
		cursor: pointer;
	}

	.head {
		display: grid;
		grid-template-columns: var(--icon-col) minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
	}

	/* The year and the fold's mark, on the far right of the row. */
	.stat {
		display: flex;
		gap: 0.85rem;
		align-items: baseline;
		padding: 0.1rem 0 0;
	}

	.head h3 {
		color: var(--color-foreground);
	}

	/* The card's index rather than an icon: 00, 01, 02 — a count of the work,
	   not an illustration of it. */
	.icon {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	/* The other end of the line from .icon, in the same quiet mono. */
	.year {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	/* Two strokes rotated into a V, turned through 180° when the fold opens —
	   a drawn mark rather than a glyph, so it rotates about its own centre
	   instead of about a font's baseline. */
	.chevron {
		align-self: center;
		width: 0.6rem;
		height: 0.6rem;
		border-right: 1.5px solid var(--text-faint);
		border-bottom: 1.5px solid var(--text-faint);
		transform: translateY(-25%) rotate(45deg);
		transition: transform 380ms ease;
	}

	.card.open .chevron {
		transform: translateY(15%) rotate(225deg);
	}

	.stat:hover .chevron {
		border-color: var(--color-foreground);
	}

	@media (prefers-reduced-motion: reduce) {
		.chevron {
			transition: none;
		}
	}

	/* Beside the title, so a live project is flagged on the index itself
	   rather than only once its case study is open. */
	.callout {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-left: 0.6rem;
		padding: 0.25rem 0.7rem;
		vertical-align: middle;
		white-space: nowrap;
		/* -ink, not the plain accent: on this badge's own white background,
		   plain --violet measures 1.78:1 for the text and the same for the
		   border it also draws — well under the 4.5:1 text / 3:1 UI floors. */
		color: var(--violet-ink);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		background: #fff;
		border: 1.5px solid var(--violet-ink);
		border-radius: 999px;
	}

	/* The site's other colour for "carry on regardless" — the same mint every
	   other live indicator wears (StatusBar's own dot, the dashboard's). */
	.callout.live {
		color: var(--mint-ink);
		border-color: var(--mint-ink);
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
