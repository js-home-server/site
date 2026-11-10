<script>
	import ToolPills from '$lib/components/ToolPills.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import AsciiShipCard from '$lib/components/AsciiShipCard.svelte';
	import ProjectTable from '$lib/components/ProjectTable.svelte';
	import ProjectHtop from '$lib/components/ProjectHtop.svelte';
	import ProjectPipeline from '$lib/components/ProjectPipeline.svelte';
	import ProjectTearsheet from '$lib/components/ProjectTearsheet.svelte';
	import tape from '$lib/data/btc-tape.json';
	import ancestreeNodes from '$lib/data/ancestree-nodes.json';
	import { server } from '$lib/server.svelte.js';

	const TAPE_TOP = Math.max(...tape.map((row) => row[4]));
	const usd = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`);

	const tapeTable = {
		head: [{ label: 'Time' }, { label: 'Venue' }, { label: 'Side' }, { label: 'Price', right: true }, { label: 'Notional', right: true }],
		rows: tape.map(([venue, ts, side, price, notional]) => ({
			key: `${venue}-${ts}-${side}`,
			tone: side ? 'sell' : 'buy',
			depth: 0.12 + 0.62 * Math.max(0, Math.log(notional / 1500) / Math.log(TAPE_TOP / 1500)),
			cells: [new Date(ts).toISOString().slice(11, 19), venue, side ? 'SELL' : 'BUY', price.toLocaleString('en-GB', { minimumFractionDigits: 1 }), usd(notional)]
		}))
	};

	const running = () => server.snapshot?.containers?.items?.length;
	const upDays = () => Math.floor((server.snapshot?.availability?.uptime_seconds ?? 0) / 86_400);

	/* One entry is one block: nothing below branches on which project it's drawing.
	   `url` = public source, `live` = where it actually runs, `route` = its full case study,
	   `visual` = what fills the picture slot, with the props and title bar it wears. */
	const PROJECTS = [
		{
			name: 'Market data archive',
			blurb: 'Market data is expensive, so I record my own. A metal server at home and a cloud VM capture every trade on seven exchanges. Over a billion rows.',
			tools: ['Python', 'asyncio', 'PyArrow'],
			route: '/projects/orderflow/',
			brief: 'orderflow',
			visual: { component: ProjectTable, props: tapeTable, title: 'BTC aggregated tape', meta: '8 Nov 2026, 7 venues' }
		},
		{
			name: 'Market-neutral strategy',
			blurb: 'A market-neutral, cross-sectional strategy: rank 100 coins by net taker flow, long the top, short the bottom, beta-hedged. Net Sharpe: 2.39.',
			tools: ['Python', 'NumPy', 'Pandas'],
			url: 'https://github.com/JS195/orderflow-alpha',
			route: '/projects/orderflow/',
			brief: 'strategy',
			visual: { component: ProjectTearsheet, title: 'Backtest tearsheet', meta: '2020 to 2026, 15.2×' }
		},
		{
			name: 'This server',
			blurb: 'My home server runs this website, served via Cloudflare. Prometheus logs metrics and an API serves them.',
			tools: ['Svelte', 'JavaScript', 'Python', 'Docker', 'Linux'],
			url: 'https://github.com/js-home-server',
			live: '/server/',
			route: '/projects/server/',
			brief: 'server',
			visual: { component: ProjectHtop, title: 'Running right now', meta: () => (running() ? `${running()} containers, up ${upDays()} days` : '') }
		},
		{
			name: 'Ancestree',
			blurb: 'No more final_v2_REAL.csv. Every step is a node in a graph, so you can see what produced each result. Pure Python, no dependencies, no server.',
			tools: ['Python', 'SQL'],
			url: 'https://github.com/JS195/ancestree',
			pypi: 'https://pypi.org/project/ancestree-track/',
			docs: 'https://js195.github.io/ancestree/',
			route: '/projects/ancestree/',
			brief: 'ancestree',
			visual: { component: ProjectPipeline, title: 'Pipeline Explorer', meta: `${ancestreeNodes.length} of 31 nodes` }
		},
		{
			name: 'ascii-art',
			blurb: 'ASCII art is cool, so I wrote my own renderer in C. A photo becomes text in around 13 ms, and it drew the art across this site.',
			tools: ['C', 'Make'],
			url: 'https://github.com/JS195/asciiArt',
			route: '/projects/ascii-art/',
			brief: 'ascii',
			visual: { component: AsciiShipCard, title: 'Photo rendered as text', meta: '79×14' }
		}
	];
</script>

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="section-title">Projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, blurb, tools, url, live, pypi, docs, route, brief, visual } (name)}
				<article id={brief} class="card">
					<div class="identity">
						<h3>{name}</h3>
						<p class="blurb">{blurb}</p>
						<div class="tools-row"><ToolPills {tools} /></div>
					</div>

					<figure class="visual">
						<figcaption>
							<b>{visual.title}</b>
							<span>{typeof visual.meta === 'function' ? visual.meta() : visual.meta}</span>
						</figcaption>
						<div class="visual-body"><visual.component {...visual.props} /></div>
					</figure>

					<div class="actions">
						<ActionLink variant="button" direction="site" href={route}>Read case study</ActionLink>
						{#if url || pypi || docs || live}
							<nav class="links" aria-label={`${name} links`}>
								{#if url}<ActionLink direction="external" href={url}><span class="link-label"><Logo name="GitHub" />GitHub</span></ActionLink>{/if}
								{#if pypi}<ActionLink direction="external" href={pypi}><span class="link-label"><Icon name="cube" />PyPI</span></ActionLink>{/if}
								{#if docs}<ActionLink direction="external" href={docs}><span class="link-label"><Icon name="book" />Docs</span></ActionLink>{/if}
								{#if live}<ActionLink direction="site" href={live}><span class="link-label"><Icon name="chart" />Open dashboard</span></ActionLink>{/if}
							</nav>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>
</section>

<style>
	/* Paper shadow itself is app.css's .projects — this just bleeds the card grid into the box's own padding. */
	.projects {
		overflow: hidden;
	}

	.projects .section-title {
		display: block;
		margin-bottom: 0;
	}

	.cards {
		display: grid;
		margin: 0 calc(var(--pad) * -1) calc(var(--pad) * -1);
	}

	/* The picture's height sets the row's, so every block is exactly the same height. */
	.card {
		--visual-height: 12rem;
		--side-min: 18rem;
		--ship-digit: 9.55px;

		position: relative;
		display: grid;
		grid-template-columns: minmax(var(--side-min), 0.8fr) minmax(0, 1.2fr) minmax(var(--side-min), 0.8fr);
		grid-template-rows: var(--visual-height);
		gap: var(--pad) calc(var(--pad) * 1.7);
		align-items: start;
		height: calc(var(--visual-height) + 2 * var(--pad));
		padding: var(--pad);
	}

	.card + .card {
		margin-top: 1px;
	}

	.card + .card::before {
		position: absolute;
		inset: -1px var(--pad) auto;
		height: 1px;
		background: var(--color-border);
		content: '';
	}

	.identity h3 {
		margin: 0;
		font-size: var(--fs-subhead);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1;
	}

	.tools-row {
		margin-top: var(--space-md);
	}

	.blurb {
		margin: var(--space-md) 0 0;
		max-width: 56ch;
		color: var(--color-foreground);
		font-size: var(--fs-base);
		line-height: 1.75;
	}

	.visual {
		display: flex;
		flex-direction: column;
		height: var(--visual-height);
		margin: 0;
		overflow: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: var(--color-background);
	}

	figcaption {
		display: flex;
		flex: 0 0 var(--space-xl);
		align-items: center;
		justify-content: space-between;
		gap: var(--space-lg);
		padding: 0 var(--space-sm);
		overflow: hidden;
		border-bottom: var(--rule);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		white-space: nowrap;
	}

	figcaption b {
		flex: none;
	}

	/* In a narrow slot the title stays whole and the note beside it gives way. */
	figcaption span {
		min-width: 0;
		overflow: hidden;
		color: var(--text-dim);
		text-overflow: ellipsis;
	}

	.visual-body {
		position: relative;
		flex: 1;
		min-height: 0;
		container-type: inline-size;
		pointer-events: none;
	}

	.visual-body :global(.ascii-art) {
		display: grid;
		height: 100%;
		place-items: center;
	}

	/* A rasterised image, sized in cells like the bull on the landing page: the ship is
	   79 columns of a 0.6021em digit, and --ship-digit is the bull's 9.55px (see asciiArt's
	   Makefile). A slot narrower than that shrinks it to fit rather than cropping the bow. */
	.visual-body :global(.ascii-art img) {
		display: block;
		max-width: 100%;
		width: calc(79 * 0.6021 * var(--ship-digit));
		height: auto;
	}

	.actions {
		display: grid;
		gap: var(--space-sm);
		color: var(--mint);
	}

	.links {
		display: grid;
	}

	.links :global(.action-link) {
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-xs);
		border-bottom: var(--rule);
		color: var(--color-foreground);
		--link-size: var(--fs-base);
	}

	.links :global(.action-link:last-child) {
		border-bottom: 0;
	}

	.link-label {
		display: inline-flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.link-label :global(svg),
	.link-label :global(.icon) {
		font-size: 1.25em;
	}

	@media (max-width: 60rem) {
		.card {
			grid-template-columns: var(--side-min) minmax(0, 1fr);
			grid-template-rows: auto;
			height: auto;
		}

		.actions {
			grid-column: 2;
		}
	}

	@media (max-width: 40rem) {
		.card {
			grid-template-columns: minmax(0, 1fr);
		}

		.actions {
			grid-column: auto;
		}
	}
</style>
