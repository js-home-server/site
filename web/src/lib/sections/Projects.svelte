<script>
	import ToolPills from '$lib/components/ToolPills.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { fleet } from '$lib/containers.js';
	import { server } from '$lib/server.svelte.js';
	import { spanSeconds } from '$lib/stats.js';

	let runningContainers = $derived(
		server.snapshot ? fleet(server.snapshot.containers?.items).running : null
	);
	let retainedDays = $derived(
		server.month?.storage?.ssd?.used_bytes?.length > 1
			? Math.floor(spanSeconds(server.month.storage.ssd.used_bytes) / 86_400)
			: null
	);

	/* `url` = public source, `live` = where it actually runs, `route` = its full
	   case study. The index stays light — enough to choose a project, then one route to the full work. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			blurb:
				'Ten variations in, you are looking at final_v2_REAL.csv with no record of what produced it. Ancestree puts a pipeline’s DAG, metadata and artifact bytes in one SQLite file, no server needed. It stores 3.93× less and reruns 136× faster, across 975 tests. It ships on PyPI as a zero-dependency MIT library supporting Python 3.9–3.14. Every push runs Ruff, strict mypy and pytest across six Python releases, with 92.97% line coverage.',
			tools: ['Python', 'SQL'],
			url: 'https://github.com/JS195/ancestree',
			pypi: 'https://pypi.org/project/ancestree-track/',
			docs: 'https://js195.github.io/ancestree/',
			proofLabel: 'Try it',
			proof: null,
			route: '/projects/ancestree/',
			brief: 'ancestree'
		},
		{
			name: 'This server',
			blurb:
				'A machine publishing a live feed about itself is publishing facts about a house. This one runs Debian behind an outbound tunnel, where what reaches the public API is a checked-in list rather than whatever the exporters expose. It draws 3.0 W and opens no ports. Eight containers run on a four-core, 8 GB Debian 13 host, and the public API exposes three GET-only routes. Commit-tagged deploys health-check for 30 seconds and roll back both the stack and crontab on failure.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server/',
			proofLabel: 'Live',
			proof: null,
			route: '/projects/server/',
			brief: 'server'
		},
		{
			name: 'Crypto orderflow',
			blurb:
				'A cross-sectional strategy needs order flow aggregated across many assets at once, and the vendors that sell it retain days rather than years of something that cannot be backfilled after the fact. That need for a longer, wider archive is what led me to build the collector myself: 11.5M rows a day off ten venue feeds, folded to 108 MB of Parquet. Its 583 streams cover 100 base assets across six exchanges with 1.0 ms median writer lag. The archive now backs a market-neutral strategy with 2.39 net Sharpe over 6.5 years and 1.08 walk-forward; shuffled-signal and lookahead checks test the result.',
			tools: ['Python', 'Docker', 'Polars', 'NumPy'],
			url: 'https://github.com/JS195/orderflow-alpha',
			proofLabel: 'Live',
			proof: null,
			route: '/projects/orderflow/',
			brief: 'orderflow'
		},
		{
			name: 'ascii-art',
			blurb:
				'A photograph is a grid of pixels and a terminal is a grid of characters. A C renderer converts one to the other, with sampling, tone curve, glyph selection and encoding as separately tested stages. It runs in 13 ms and draws every image on this site. Its seven modules comprise 1,300 lines of C, with one vendored dependency and clean builds under -Wall, -Wextra and -Wpedantic. Seventeen tests and 168 assertions cover the pipeline and output geometry; one Make target regenerates five site components byte-identically.',
			tools: ['C'],
			url: 'https://github.com/JS195/asciiArt',
			proofLabel: 'In use',
			proof: '13 ms to generate every image on this site',
			route: '/projects/ascii-art/',
			brief: 'ascii'
		}
	];

</script>

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="section-title">Projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, blurb, tools, url, live, pypi, docs, demo, proofLabel, proof, route, brief } (name)}
				<article id={brief} class="card">
					<div class="identity">
						<h3>{name}</h3>
						<div class="proof">
							<p class="proof-label">{proofLabel}</p>
							<p>
								{#if brief === 'ancestree'}
									Interactive demo in the <ActionLink direction="external" href="https://js195.github.io/ancestree/demo/">docs</ActionLink>
								{:else if brief === 'orderflow'}
									{retainedDays !== null
										? `${retainedDays} retained days with no dropped rows`
										: server.status.month === 'error'
										? 'Live data unavailable'
										: 'Checking retained history…'}
								{:else if live}
									{runningContainers !== null
										? `${runningContainers} containers currently running`
										: server.status.snapshot === 'error'
										? 'Live data unavailable'
										: 'Checking the running containers…'}
								{:else}
									{proof}
								{/if}
							</p>
						</div>
						<div class="tools-row"><ToolPills {tools} /></div>
					</div>

					<p class="blurb">{blurb}</p>

					<div class="actions">
						<ActionLink variant="button" direction="site" href={route}>Read case study</ActionLink>
						{#if demo || url || pypi || docs || live}
							<nav class="links" aria-label={`${name} links`}>
								{#if demo}<ActionLink direction="external" href={demo}><span class="link-label"><Icon name="external" />Interactive demo</span></ActionLink>{/if}
								{#if url}<ActionLink direction="external" href={url}><span class="link-label"><Logo name="GitHub" />GitHub</span></ActionLink>{/if}
								{#if pypi}<ActionLink direction="external" href={pypi}><span class="link-label"><Icon name="cube" />PyPI</span></ActionLink>{/if}
								{#if docs}<ActionLink direction="external" href={docs}><span class="link-label"><Icon name="book" />Docs</span></ActionLink>{/if}
								{#if live}<ActionLink direction="site" href={live}><span class="link-label"><Icon name="external" />Open dashboard</span></ActionLink>{/if}
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
		font-size: var(--fs-h2);
	}

	.cards {
		display: grid;
		margin: 0 calc(var(--pad) * -1) calc(var(--pad) * -1);
	}

	.card {
		position: relative;
		display: grid;
		grid-template-columns: minmax(11rem, 0.9fr) minmax(18rem, 1.2fr) minmax(11rem, 0.7fr);
		gap: var(--pad);
		align-items: start;
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

	.proof {
		font-family: var(--font-mono);
		margin-top: 0.75rem;
		padding-left: 0.75rem;
		border-left: 2px solid var(--text-faint);
		color: var(--text-faint);
		font-size: var(--fs-xs);
		line-height: 1.5;
	}

	.proof p {
		margin: 0;
	}

	/* Demo link reads as an action, not faint prose like the rest of the line. */
	.proof :global(.action-link) {
		color: var(--mint-ink);
	}

	.proof-label {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.tools-row {
		margin-top: 0.75rem;
	}

	.blurb {
		margin: 0;
		max-width: 56ch;
		color: var(--color-foreground);
		font-size: var(--fs-base);
		line-height: 1.75;
	}

	.actions {
		display: grid;
		gap: 0.5rem;
		color: var(--mint-ink);
	}

	.links {
		display: grid;
	}

	.links :global(.action-link) {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.2rem;
		border-bottom: var(--rule);
		color: var(--color-foreground);
		--link-size: var(--fs-base);
	}

	.links :global(.action-link:last-child) {
		border-bottom: 0;
	}

	.link-label {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
	}

	.link-label :global(svg),
	.link-label :global(.icon) {
		font-size: 1.25em;
	}

	@media (max-width: 60rem) {
		.card {
			grid-template-columns: minmax(10rem, 0.8fr) minmax(0, 1.4fr);
		}

		.actions {
			grid-column: 2;
		}
	}

	@media (max-width: 40rem) {
		.card {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--pad);
		}

		.actions {
			grid-column: auto;
		}

	}
</style>
