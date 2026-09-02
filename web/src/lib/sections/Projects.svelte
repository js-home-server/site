<script>
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';
	import AncestreeStudy from './AncestreeStudy.svelte';
	import AsciiStudy from './AsciiStudy.svelte';
	import OrderflowStudy from './OrderflowStudy.svelte';
	import ServerStudy from './ServerStudy.svelte';

	/* The work worth showing. `tools` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here.

	   The case-study fields below `blurb` — facts, architecture, decisions,
	   reliability, tradeoffs, metrics — are the long form each card opens onto.
	   Every one of them is optional: a project that has not been written up yet
	   renders the same frame with a placeholder in the slot, so the shape of what
	   is still owed is visible rather than hidden. */
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
			demo: 'https://js195.github.io/ancestree/demo/',
			study: 'ancestree'
		},
		{
			name: 'This server',
			year: 2026,
			blurb:
				'A machine publishing a live feed about itself is publishing facts about a house. This one runs Debian behind an outbound tunnel, where what reaches the public API is a checked-in list rather than whatever the exporters expose. It draws 3.0 W and opens no ports.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server'
		},
		{
			name: 'Crypto orderflow',
			year: 2026,
			blurb:
				'Order flow cannot be backfilled, and the vendors that sell it retain days rather than years. So I built the collector: 11.5M rows a day off ten venue feeds, folded to 108 MB of Parquet, and the cross-sectional strategy study that reads it back.',
			tools: ['Python', 'Docker', 'Polars', 'NumPy'],
			liveBadge: true,
			study: 'orderflow'
		},
		{
			name: 'ascii-art',
			year: 2025,
			blurb:
				'A photograph is a grid of pixels and a terminal is a grid of characters. A C11 renderer converts one to the other, with sampling, tone curve, glyph selection and encoding as separately tested stages. It runs in 13 ms and draws every image on this site.',
			tools: ['C++', 'Git'],
			url: 'https://github.com/JS195/asciiArt',
			study: 'ascii'
		}
	];

	/* A plain accordion: click a title to open it, click the open one to shut
	   it. Scroll no longer drives this — the embed and the server preview
	   inside "This server" are heavy enough that animating them open and shut
	   on every scroll tick (as the reading line crossed each card) was the
	   source of the section's lag, not just a cosmetic flourish worth keeping. */
	let open = $state(PROJECTS.findIndex((project) => project.name === 'Ancestree'));

	function toggle(i) {
		open = open === i ? -1 : i;
	}

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

<!-- One of the four boxes across the top of a study: a label and a sentence, or
     the dashed slot where that sentence still has to be written. -->
{#snippet fact(label, text)}
	<div class="box">
		<Panel {label} level={4}>
			{#if text}
				<p class="prose">{text}</p>
			{:else}
				<Placeholder note="not written up" lines={3} />
			{/if}
		</Panel>
	</div>
{/snippet}

<!-- The three reasoning boxes down the right of a study. All three are the same
     shape — a bolded term and the clause that earns it — so they are one
     snippet rather than three copies of a list. -->
{#snippet bullets(label, items, note)}
	<div class="box">
		<Panel {label} level={4}>
			{#if items}
				<ul class="reasons">
					{#each items as { term, text } (term)}
						<li><strong>{term}:</strong> {text}</li>
					{/each}
				</ul>
			{:else}
				<Placeholder {note} lines={4} />
			{/if}
		</Panel>
	</div>
{/snippet}

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="section-title">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, year, blurb, tools, url, live, pypi, docs, demo, image, liveBadge, study, facts, architecture, decisions, reliability, tradeoffs, metrics, metricNote, outcome }, i (name)}
				<article class="card" class:open={i === open}>
					<!-- Three columns, top-aligned as one row. Two buttons, not one — a
					     link can't nest inside a button, and the links under the pills
					     are real ones — so the row is opened either from the title on
					     the left or the year/mark on the right, both calling the same
					     toggle. ToolPills is a row of links too and sits under the
					     button for the same reason: a button may not contain other
					     interactive content, which an anchor is regardless of what
					     wraps it. -->
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

							<!-- Under the pills rather than under the blurb: its own row,
							     not inside .head above, since a link can't nest inside a
							     button. Arrows say where each goes: ↗ off the site, → on it. -->
							<div class="links">
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
							<span class="toggle" aria-hidden="true">{i === open ? '−' : '+'}</span>
						</button>
					</div>

					<!-- The fold is a grid row taken from 0fr to 1fr, which is the one
					     way a box of copy can be animated open without being told a
					     height it does not have. `inert` because a collapsed project is
					     only clipped, and its links would otherwise still be tabbed to. -->
					<div class="fold" inert={i !== open}>
						<div class="fold-inner">
							<!-- "This server" is a system rather than a piece of software, so it
							     gets its own study — the two paths through it, what operating it
							     involves, and the live box proving the machine is up — rather than
							     the problem/solution/decisions frame the rest take. -->
							{#if live === '/server'}
								<ServerStudy />
							{:else if study === 'ascii'}
								<!-- The one project that can be shown as itself: the renders in
								     its study are the tool's own HTML output, text in the page
								     rather than a picture of text. -->
								<AsciiStudy />
							{:else if study === 'ancestree'}
								<!-- A published library rather than a system: its study is a
								     datasheet — what it does, what it costs, what it was
								     measured at, and what it is not for. -->
								<AncestreeStudy />
							{:else if study === 'orderflow'}
								<!-- The archive and the research that reads it: one project in two
								     halves, with its own study rather than the generic frame. -->
								<OrderflowStudy open={i === open} />
							{:else}

								<!-- The two questions the rest of the study answers in detail:
								     what was wrong, and what was built about it. -->
								<div class="facts">
									{@render fact('Problem', facts?.problem)}
									{@render fact('Solution', facts?.solution)}
								</div>

								<!-- The visual, and the path through the thing it shows beside
								     it. They pair on shape as well as on sense: the flow is five
								     stacked stages, which is about as tall as a screenshot. -->
								<div class="split">
									<div class="visual">
										{#if image}
											<!-- Lazy and async: a shut fold is clipped, not absent, so
											     without this every card's screenshot is fetched and
											     decoded on load — and the decode lands on the main
											     thread mid-animation when the fold opens. -->
											<img
												class="screenshot"
												src={image}
												alt="{name} dashboard"
												loading="lazy"
												decoding="async"
											/>
										{:else}
											<Placeholder note="{name.toUpperCase().replace(/\s+/g, '-')}.PNG" lines={16} />
										{/if}
									</div>

									<div class="box">
										<Panel label="Architecture" level={4}>
											{#if architecture}
												<p class="prose">{architecture.text}</p>

												<!-- The path a byte takes through it, named stage by stage,
												     read top to bottom. Vertical rather than across: laid out
												     in a row the stages wrapped, and an arrow is its own box,
												     so the one before a wrapped stage was stranded at the end
												     of the line above it. A column cannot wrap. -->
												<div class="flow">
													{#each architecture.flow as stage, s (stage.name)}
														{#if s}<span class="arrow" aria-hidden="true">↓</span>{/if}
														<div class="stage">
															<strong>{stage.name}</strong>
															<span>{stage.detail}</span>
														</div>
													{/each}
												</div>
											{:else}
												<Placeholder note="architecture" lines={6} />
											{/if}
										</Panel>
									</div>
								</div>

								<!-- What I chose, and what happens when it breaks. The wider half
								     is the one with three arguments in it. -->
								<div class="split">
									{@render bullets('Key decisions & why', decisions, 'decisions')}
									{@render bullets('Reliability & failure', reliability, 'failure behaviour')}
								</div>

								<!-- Across the full width, because four figures in a row is what the
								     tiles are for. The numbers go here only once measured by
								     something someone else could re-run — a placeholder is the
								     honest reading until then. -->
								<div class="box">
									<Panel label="Measurable proof" level={4}>
										{#if metrics}
											<div class="tiles">
												{#each metrics as metric (metric.label)}
													<div class="tile">
														<span class="eyebrow">{metric.label}</span>
														<strong class="figure">
															{metric.value}{#if metric.unit}<span class="unit">{metric.unit}</span>{/if}
														</strong>
														<span class="note">{metric.note}</span>
													</div>
												{/each}
											</div>

											<!-- Where the numbers came from, at the foot of the numbers
											     themselves: a benchmark without its machine and its
											     method is a number without a claim. -->
											{#if metricNote}<p class="metric-note">{metricNote}</p>{/if}
										{:else}
											<Placeholder note="not measured yet" lines={6} />
										{/if}
									</Panel>
								</div>

								<!-- Where it stops, and what came of it anyway. Last row, and the
								     one thing worth keeping if nothing above it is read. -->
								<div class="split">
									{@render bullets('Limitations', tradeoffs, 'limitations')}

									<div class="box">
										<Panel label="Outcome" level={4}>
											{#if outcome}
												<p class="prose">{outcome}</p>
											{:else}
												<Placeholder note="not written up" lines={2} />
											{/if}
										</Panel>
									</div>
								</div>
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

		border-color: #e1e0d9;
		background: #f9f9f7;
		color: var(--color-foreground);
	}

	/* One project a row, top to bottom. --pad above and below every dividing
	   rule, so the list is read as separated entries rather than a block. */
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

	/* The pills, aligned under the title the same way .links (below) is: the
	   icon column's width plus the gap beside it (.head-col's --icon-col), so
	   the row starts under the title rather than the icon above it. Its own
	   row rather than inside .head — ToolPills renders a link for any tool
	   with a website, and a link can't nest inside a button. */
	.tools-row {
		margin-top: 0.4rem;
		margin-left: calc(var(--icon-col) + 0.75rem);
	}

	/* One block a reader takes in at a glance, whether or not they open the
	   fold: the problem, the thing built for it, and the number it runs at.
	   Capped in ch like the about page's lede, since a row is the full width of
	   the box and that is past what a line of prose can be read across. */
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
	   is its content, which would hold the row open at its full height.

	   Panel's title is sized from here rather than per box, so every label in a
	   study — the four facts, the four reasoning boxes, the two at the foot —
	   is the same eyebrow the rest of the site labels things with. */
	.fold-inner {
		--title-size: 0.62rem;
		--title-color: var(--text-faint);

		display: grid;
		gap: 1rem;
		min-height: 0;
		overflow: hidden;
	}

	/* What a study is made of. One vocabulary for every box in it, so the four
	   across the top, the four down the right and the two at the foot are read as
	   one thing divided rather than three different treatments. */
	.box {
		padding: 0.9rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: #fff;
	}

	/* Every sentence inside a box, at the one size they are all set in. */
	.prose {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		line-height: 1.65;
	}

	/* The quiet line under a figure, a link, or a visual's own title. */
	.note {
		margin: 0;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		line-height: 1.5;
	}

	/* Pills on the left, the paragraph they belong to on the right. */
	/* Problem, role, constraints, outcome — four across, because they are read as
	   a row of answers to the same question rather than as a list. */
	.facts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	/* A bolded term and the clause that earns it, marked in the gutter the way
	   the about page's own points are. */
	.reasons {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.reasons li {
		position: relative;
		padding-left: 0.95rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		line-height: 1.6;
	}

	.reasons li::before {
		position: absolute;
		left: 0;
		/* -ink, not the plain accent: this box is on the light ground (.projects,
		   below) and plain --mint measures 1.6:1 on it. */
		color: var(--mint-ink);
		content: '—';
	}

	.reasons strong {
		color: var(--color-foreground);
		font-weight: 600;
	}

	/* The stages a byte passes through, read down. One column, so a stage is
	   never split off from the arrow that leads to it. */
	.flow {
		display: grid;
		gap: 0.3rem;
	}

	.stage {
		display: grid;
		gap: 0.1rem;
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		text-align: center;
	}

	.stage strong {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		font-weight: 600;
	}

	.stage span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.56rem;
	}

	.arrow {
		justify-self: center;
		color: var(--text-faint);
		font-size: 0.7rem;
		line-height: 1;
	}

	/* One tile per measurement, across the study's full width. */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		gap: 0.6rem;
	}

	.tile {
		display: grid;
		gap: 0.2rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
	}

	/* Smaller than a figure on the dashboard: four of these share half a card.
	   -ink, not the plain accent: the tile is on the light ground (.projects,
	   below) and plain --violet measures 1.78:1 on it — these are the study's
	   own headline numbers, not a decoration. */
	.tile .figure {
		color: var(--violet-ink);
		font-size: 1.35rem;
	}

	.tile .unit {
		margin-left: 0.15em;
		font-size: 0.5em;
		font-weight: 500;
	}

	/* The machine and the method, under the numbers they qualify. */
	.metric-note {
		margin: 0.75rem 0 0;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		line-height: 1.6;
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
	/* The button and the summary beside it, top-aligned as one row: the summary
	   reads level with the title and pills rather than under them. */
	.head-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) auto;
		gap: 1.25rem;
		align-items: start;
	}

	/* The button and the links under it, stacked as the row's left column. */
	.head-col {
		/* Shared with .head and .links below, so the links row's left edge
		   lands exactly under the title rather than the icon above it. */
		--icon-col: 1.6rem;

		display: grid;
	}

	.summary {
		padding-top: 0.15rem;
	}

	/* A button, so it is reachable and pressable as the control it is, but
	   wearing none of a button's clothes: the shared reset every clickable part
	   of the row — this one and .stat below — wears. */
	.head,
	.stat {
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.head {
		display: grid;
		grid-template-columns: var(--icon-col) minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
		width: 100%;
		padding: 0;
	}

	/* The year and the fold's own mark, on the far right of the row: its own
	   button rather than folded into .head, since the summary between them
	   holds real links a button cannot contain. Both call the same toggle. */
	.stat {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.1rem 0 0;
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

	/* The other end of the line from .icon, in the same quiet mono. */
	.year {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	.toggle {
		width: 1rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.95rem;
		text-align: center;
		transition: color 260ms ease;
	}

	.card.open .toggle,
	.stat:hover .toggle,
	.stat:focus-visible .toggle {
		color: var(--color-foreground);
	}

	/* Every divided row in a study, at the one ratio they all share: the heavier
	   half takes two thirds. Used three times — demo beside architecture,
	   decisions beside reliability, limitations beside outcome — so the whole
	   fold reads as one rhythm rather than three different splits. Each pairing
	   is by weight: the wider box is the one with more in it. */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
	}

	/* Every visual in here used to be `height: 100%` of the fold's grid row, and
	   that row is what the open/shut transition animates (0fr to 1fr, below). So
	   the animation did not reveal the visual — it resized it, every frame: the
	   iframe's embedded document re-laid-out ~23 times a toggle, the mini
	   dashboard's grid recomputed and took every Spark and Trace SVG with it, and
	   the screenshot re-scaled. A definite height instead means nothing inside
	   changes size at all; the row grows and .fold-inner's overflow clip is the
	   only thing doing any work. One knob, since the boxes are meant to match. */
	.visual {
		--visual-h: 30rem;
	}

	.visual :global(.placeholder) {
		height: var(--visual-h);
	}

	/* Beside the title rather than on the fold, so it reads shut as well as
	   open — a card worth flagging as interactive before there's any reason
	   to open it. Its own fixed colour, not the dimmed grey a shut title
	   wears, so it stays legible either way. */
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

	/* A real screenshot rather than a live embed: same box, contained rather
	   than cropped so the chart's own axes and panels stay whole whatever
	   shape the box ends up. */
	.screenshot {
		display: block;
		width: 100%;
		height: var(--visual-h);
		object-fit: contain;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: #fff;
	}

	/* --- narrow ---------------------------------------------------------- */

	/* Three facts across will not divide a laptop's half-width. */
	@media (max-width: 60rem) {
		.facts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 40rem) {
		.head-row,
		.split,
		.facts {
			grid-template-columns: minmax(0, 1fr);
		}

		.summary {
			padding-top: 0;
		}
	}

	/* A click still opens the row — it just snaps open rather than growing
	   into place. */
	@media (prefers-reduced-motion: reduce) {
		.fold,
		.head h3 {
			transition: none;
		}
	}
</style>
