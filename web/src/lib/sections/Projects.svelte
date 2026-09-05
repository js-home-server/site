<script>
	import ToolPills from '$lib/components/ToolPills.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import LoadingDots from '$lib/components/LoadingDots.svelte';
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
				"Ten variations in, you are looking at final_v2_REAL.csv with no record of what produced it. Writen in pure python with no dependancies, Ancestree offers a lightweight and simple way to keep track of every result and its lineage, natively on your machine. Deduplication means it stores 3.93× less on a mixed corpus. Identical reruns bypass execution to fetch the data in milliseconds instead.",
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
				"I run my own home server: it's currently hosting this webiste! In addition to supporting other personal projects, it also runs an API publishing live data about itself. The box is designed around security, it sits behind a cloudflare tunnel and opens no ports.",
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
				"Vendors selling granular multi-platform, mulit-asset cryptocurrency data charge a lot of money. So I built my own collector, it stores ~11.5M rows a day across ten venues in Parquet. The archive backs a market-neutral strategy with a 2.39 net Sharpe over 6.5 years.",
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
				"Ascii art is cool, so I built a beefed up generator for myself. Written in C, it turns an image into ascii characters with black and white, greyscale, or full colour modes. It turns a 667×667 photo into 132800 characters in ~13 ms, and drew every image on this site.",
			tools: ['C', 'Make'],
			url: 'https://github.com/JS195/asciiArt',
			proofLabel: 'In use',
			proof: 'Generated every image on this site',
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
									{#if server.status.month === 'stale'}
										{retainedDays} retained days as of the last check
									{:else if retainedDays !== null}
										{retainedDays} retained days with no dropped rows
									{:else if server.status.month === 'error'}
										Live data unavailable
									{:else}
										Checking retained history <LoadingDots />
									{/if}
								{:else if live}
									{#if server.status.snapshot === 'stale'}
										{runningContainers} containers as of the last check
									{:else if runningContainers !== null}
										{runningContainers} containers currently running
									{:else if server.status.snapshot === 'error'}
										Live data unavailable
									{:else}
										Checking the running containers <LoadingDots />
									{/if}
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
		font-size: var(--fs-h2);
	}

	.cards {
		display: grid;
		margin: 0 calc(var(--pad) * -1) calc(var(--pad) * -1);
	}

	.card {
		position: relative;
		display: grid;
		grid-template-columns: minmax(11rem, 0.7fr) minmax(18rem, 1.4fr) minmax(11rem, 0.7fr);
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
		font-size: var(--fs-sm);
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
		font-size: var(--fs-sm);
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
