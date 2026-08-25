<script>
	import Placeholder from '$lib/components/Placeholder.svelte';

	/* The work worth showing. `tags` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			blurb:
				'Zero-dependency Python package that models a data pipeline as a directed acyclic graph, with content-defined chunking over a SQL backend. Published on PyPI and in use by researchers internally.',
			tags: ['Python', 'SQLite', 'DAGs', 'PyPI'],
			url: 'https://github.com/JS195/ancestree'
		},
		{
			name: 'Orderflow analysis',
			blurb:
				'Pipeline for Binance futures and spot data, with a dynamic feature registry covering OHLC aggregation, open interest, funding rate and CVD, read back through a multi-panel plotting framework.',
			tags: ['Python', 'Pandas', 'Plotly', 'Binance API']
		},
		{
			name: 'This server',
			blurb:
				'The machine this site is served from, and the site itself: metrics scraped off the box, cached behind a small API, and read back live on the server page.',
			tags: ['SvelteKit', 'Docker', 'Prometheus', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server'
		},
		{
			name: 'ascii-art',
			blurb:
				'C11 CLI that converts raster images into ASCII art for the terminal or the web: block-averaged sampling, tone curve and glyph selection as separable, individually tested stages. Generates the art on this site, including the astronaut on the about page.',
			tags: ['C', 'stb_image', 'HTML/ANSI/TXT'],
			url: 'https://github.com/JS195/asciiArt'
		}
	];
</script>

<svelte:head>
	<title>Projects — Joshua Smith</title>
</svelte:head>

<div class="page projects-page">
	<!-- Read out, never drawn: the box carries the titling, and this is only here
	     so the document outline starts somewhere. -->
	<h1 class="sr-only">Projects</h1>

	<section class="surface-box projects">
		<h2 class="eyebrow">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, blurb, tags, url, live }, i (name)}
				<article class="card">
					<div class="head">
						<div class="icon">{String(i).padStart(2, '0')}</div>
						<h3>{name}</h3>
					</div>

					<div class="body">
						<p class="blurb">{blurb}</p>

						<ul class="tags">
							{#each tags as tag (tag)}<li>{tag}</li>{/each}
						</ul>
					</div>

					<div class="links">
						{#if url}
							<a href={url} target="_blank" rel="noopener noreferrer">View project ↗</a>
						{:else}
							<!-- Nothing to point at yet. -->
							<div class="slot"><Placeholder note="view project" lines={1} /></div>
						{/if}

						<!-- On this site rather than off it: the dashboard is its own app,
						     and this is the only door to it. -->
						{#if live}
							<a href={live}>Open dashboard →</a>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>

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
		/* How far the body's rule stands off its text; reused below the row
		   divider so both gaps read as the same unit of air. */
		--divide: 0.9rem;

		border-color: #e1e0d9;
		background: #f9f9f7;
		color: var(--color-foreground);
	}

	/* Two up, wrapping into as many rows as there are projects. */
	.cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--divide) 0;
	}

	.card h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.blurb {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.7;
	}

	/* What it is built with, one pill each, wrapping onto as many lines as the
	   card is wide enough for. */
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tags li {
		padding: 0.2rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.04em;
	}

	/* A card is a column of the row, divided from the next by a rule rather than
	   given a frame of its own. */
	.card {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 1rem;
		padding: 0 var(--pad);
	}

	.card:nth-child(odd) {
		padding-left: 0;
		border-left: 0;
	}

	.card:nth-child(even) {
		padding-right: 0;
	}

	/* Rows past the first are divided from the one above by a rule, centred in
	   the full gap between the row above and this one — the grid's own
	   row-gap plus the padding-top this rule reserves for itself — not just
	   dropped at the top of the padding. */
	.card:nth-child(n + 3) {
		position: relative;
		padding-top: var(--pad);
	}

	.card:nth-child(n + 3)::before {
		content: '';
		position: absolute;
		top: calc((var(--pad) - var(--divide)) / 2);
		left: 0;
		right: 0;
		border-top: var(--rule);
	}

	.head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.75rem;
		align-items: center;
	}

	/* The card's index rather than an icon: 00, 01, 02 — a count of the work,
	   not an illustration of it. */
	.icon {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	/* The summary and its tags stand off the left, the way the drawing rules them
	   in against a line. */
	.body {
		display: grid;
		gap: 0.75rem;
		align-content: start;
		padding-left: var(--divide);
		border-left: var(--rule);
	}

	/* Pinned to the foot of the card, so the four cards end on one line however
	   long the summaries above them run. A row, for the one with two links. */
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		align-self: end;
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

	/* An empty slot stands a link's width, so the four feet line up anyway. */
	.slot {
		width: min(100%, 9rem);
	}

	/* --- narrow ---------------------------------------------------------- */

	@media (max-width: 40rem) {
		.cards {
			grid-template-columns: minmax(0, 1fr);
		}

		.card {
			padding-inline: 0;
			border-left: 0;
		}

		.card:nth-child(n + 2) {
			position: relative;
			padding-top: var(--pad);
		}

		.card:nth-child(n + 2)::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			border-top: var(--rule);
		}
	}
</style>
