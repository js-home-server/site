<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spark from '$lib/components/Spark.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { fleet } from '$lib/containers.js';
	import { degrees, gigabytes, microseconds, ms, pct, stamp } from '$lib/format.js';
	import { gridArea } from '$lib/grid.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { minMax } from '$lib/stats.js';
	import { DISKS, volume } from '$lib/storage.js';
	import { clockOffset, clockOffsetHistory } from '$lib/time.js';

	/* The work worth showing. `tools` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			year: 2026,
			tagline: 'Data lineage, content-addressed.',
			blurb:
				'Zero-dependency Python package that models a data pipeline as a directed acyclic graph, with content-defined chunking over a SQL backend. Published on PyPI and in use by researchers internally.',
			tools: ['Python', 'SQL', 'Git'],
			url: 'https://github.com/JS195/ancestree',
			pypi: 'https://pypi.org/project/ancestree-track/',
			embed: 'https://js195.github.io/ancestree/assets/demo/interactive_pipeline.html'
		},
		{
			name: 'Orderflow analysis',
			year: 2026,
			tagline: 'Reading the tape at scale.',
			blurb:
				'Pipeline for Binance futures and spot data, with a dynamic feature registry covering OHLC aggregation, open interest, funding rate and CVD, read back through a multi-panel plotting framework.',
			tools: ['Python', 'Pandas', 'Polars', 'Plotly', 'NumPy'],
			image: '/projects/orderflow.png'
		},
		{
			name: 'This server',
			year: 2026,
			tagline: 'The box, and the site it runs.',
			blurb:
				'The machine this site is served from, and the site itself: metrics scraped off the box, cached behind a small API, and read back live on the server page.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server'
		},
		{
			name: 'ascii-art',
			year: 2025,
			tagline: 'Pixels, rendered as text.',
			blurb:
				'C11 CLI that converts raster images into ASCII art for the terminal or the web: block-averaged sampling, tone curve and glyph selection as separable, individually tested stages. Generates the art on this site, including the astronaut on the about page.',
			tools: ['C++', 'Git'],
			url: 'https://github.com/JS195/asciiArt',
			gallery: [
				{ src: '/projects/ship-original.png', label: 'Original' },
				{ src: '/projects/ship-grayscale.png', label: 'Greyscale' },
				{ src: '/projects/ship-color.png', label: 'Color' }
			]
		},
		{
			name: 'crypto-archive',
			year: 2026,
			tagline: 'Every tick, from six exchanges.',
			blurb:
				'Gathers and aggregates my own tick-level trade and order-book data from six exchanges, running continuously — 24/7, 365 — to build a self-owned historical archive rather than relying on any one provider\'s retention.',
			tools: ['Python', 'Docker', 'Parquet'],
			liveBadge: true
		}
	];

	/* A copy of /server's own overview grid (routes/server/+page.svelte), scaled
	   down into "This server"'s visual box rather than imported — so trimming or
	   dropping this preview later never touches the real page. */
	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month ?? server.series);

	let ramUsed = $derived(memoryBands(series).find((band) => band.id === 'used')?.points ?? []);

	let volumes = $derived(
		DISKS.map((disk) =>
			volume({
				...disk,
				used: month?.storage[disk.id].used_bytes,
				available: month?.storage[disk.id].available_bytes,
				percent: month?.storage[disk.id].used_percent
			})
		)
	);

	let containers = $derived(fleet(snapshot?.containers.items));
	let clockHistory = $derived(clockOffsetHistory(series));

	/* Days and the hours/minutes left over, rather than the hour count the rest
	   of the site quotes this same figure as: a box this small is still up long
	   enough that hours stop being the unit worth leading with. */
	let uptimeSeconds = $derived(snapshot?.availability.uptime_seconds);
	let uptimeDays = $derived(Number.isFinite(uptimeSeconds) ? Math.floor(uptimeSeconds / 86400) : null);
	let uptimeRest = $derived(
		Number.isFinite(uptimeSeconds)
			? `${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
			: null
	);

	/* A plain accordion: click a title to open it, click the open one to shut
	   it. Scroll no longer drives this — the embed and the server preview
	   inside "This server" are heavy enough that animating them open and shut
	   on every scroll tick (as the reading line crossed each card) was the
	   source of the section's lag, not just a cosmetic flourish worth keeping. */
	let open = $state(0);

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

<section id="projects" class="page projects-page">
	<section class="surface-box projects">
		<h2 class="eyebrow">My projects</h2>

		<div class="cards">
			{#each PROJECTS as { name, year, tagline, blurb, tools, url, live, embed, pypi, image, liveBadge, gallery }, i (name)}
				<article class="card" class:open={i === open}>
					<!-- The whole title line is the control: a collapsed project is a
					     line that opens, and that is all it does. The tagline sits
					     here rather than in the fold, so it reads even shut. -->
					<button type="button" class="head" aria-expanded={i === open} onclick={() => toggle(i)}>
						<span class="icon">{String(i).padStart(2, '0')}</span>
						<div class="title-group">
							<h3>
								{name}
								{#if embed}
									<!-- Next to the title so it reads shut, not just once the
									     fold opens onto the thing it's pointing at. -->
									<span class="callout">
										I'm interactive — play with me <span aria-hidden="true">▾</span>
									</span>
								{/if}
								{#if live || liveBadge}
									<span class="callout live">
										<i class="dot" aria-hidden="true"></i>Live
									</span>
								{/if}
							</h3>
							<p class="tagline">{tagline}</p>
						</div>
						<span class="year">{year}</span>
						<!-- The fold's own state, said again rather than left to the shape
						     of the row: a collapsed row and an open one look enough alike
						     from a glance that the mark is what actually answers "which is
						     this." -->
						<span class="toggle" aria-hidden="true">{i === open ? '−' : '+'}</span>
					</button>

					<!-- The fold is a grid row taken from 0fr to 1fr, which is the one
					     way a box of copy can be animated open without being told a
					     height it does not have. `inert` because a collapsed project is
					     only clipped, and its links would otherwise still be tabbed to. -->
					<div class="fold" inert={i !== open}>
						<div class="fold-inner">
							<div class="content" class:wide-visual={embed || live === '/server' || image || gallery}>
								<div class="visual">
									{#if embed}
										<!-- The demo is a fully self-contained static page (no
										     X-Frame-Options/CSP, no external assets), so it embeds
										     directly rather than needing a screenshot stand-in. -->
										<iframe
											class="embed"
											src={embed}
											title="{name} interactive demo"
											loading="lazy"
											sandbox="allow-scripts"
										></iframe>
									{:else if live === '/server'}
										<div class="mini-dashboard">
											<div class="mgrid">
												<div class="obox" style={gridArea({ col: 1, row: 1 })}>
													<Panel label="Uptime">
														<strong class="ofigure" style:color="var(--mint)">
															{uptimeDays === null ? '—' : `${uptimeDays}d ${uptimeRest}`}
														</strong>
														<span class="mupdated">Last updated {stamp(snapshot?.generated_at)}</span>
													</Panel>
												</div>

												<div class="obox" style={gridArea({ col: 2, row: 1 })}>
													<Panel label="Temperature">
														<strong class="ofigure" style:color="var(--amber)">
															{degrees(snapshot?.cpu.temperature_c)}
														</strong>
														<span class="ostat">{minMax(series?.cpu.temperature_c, degrees)}</span>
														<Spark points={series?.cpu.temperature_c} tone="var(--amber)" />
													</Panel>
												</div>

												<div class="obox fill" style={gridArea({ col: 3, row: 1, w: 2, h: 3 })}>
													<Panel label="Containers">
														{#if containers.slots.length}
															<div class="mfleet">
																<table>
																	<thead>
																		<tr>
																			<th scope="col">Container</th>
																			<th scope="col">Status</th>
																			<th scope="col">Uptime</th>
																			<th scope="col">CPU</th>
																			<th scope="col">CPU limit</th>
																			<th scope="col">Memory</th>
																			<th scope="col">Memory limit</th>
																		</tr>
																	</thead>

																	<tbody>
																		{#each containers.slots as slot (slot.name)}
																			<tr>
																				<th class="mname" scope="row">{slot.name}</th>
																				<td class="mstate" class:warning={!slot.healthy}>
																					<i aria-hidden="true"></i>{slot.status}
																				</td>
																				<td>{slot.uptime}</td>

																				{#each slot.resources as resource (resource.id)}
																					<td class="musage" style:color={resource.tone}>
																						{resource.value}
																						<i class="resource-bar"><i style:width="{resource.fill}%"></i></i>
																					</td>
																					<td class="mlimit">{resource.limit}</td>
																				{/each}
																			</tr>
																		{/each}
																	</tbody>
																</table>
															</div>
														{:else}
															<Placeholder note="no container data" lines={4} />
														{/if}
													</Panel>
												</div>

												<div class="obox fill" style={gridArea({ col: 1, row: 2, w: 2, h: 2 })}>
													<Panel label="CPU & RAM Usage (%)">
														<Trace
															lines={[
																{ id: 'cpu', points: series?.cpu.percent, tone: 'var(--mint)', label: 'CPU' },
																{ id: 'ram', points: ramUsed, tone: 'var(--violet)', label: 'RAM' }
															]}
															domain={[0, 100]}
															format={pct}
														/>
													</Panel>
												</div>

												<div class="obox" style={gridArea({ col: 1, row: 4, w: 2 })}>
													<Panel label="Storage Overview">
														<div class="ovolumes">
															{#each volumes as vol (vol.id)}
																<div class="ovolume">
																	<div class="ovolume-name">
																		<strong>{vol.label}</strong>
																		<span class="ostat">
																			{gigabytes(vol.usedNow)} / {gigabytes(vol.totalNow)} GB
																		</span>
																	</div>
																	<Capacity
																		label={vol.label}
																		percent={vol.percentNow ?? snapshot?.storage[vol.id].used_percent}
																		tone={vol.tone}
																	/>
																</div>
															{/each}
														</div>
													</Panel>
												</div>

												<div class="obox" style={gridArea({ col: 3, row: 4 })}>
													<Panel label="Time Offset">
														<strong class="ofigure" style:color="var(--azure)">
															{microseconds(clockOffset(snapshot?.time))}
														</strong>
														<span class="ostat">{minMax(clockHistory, microseconds)}</span>
														<Spark points={clockHistory} tone="var(--azure)" />
													</Panel>
												</div>

												<div class="obox" style={gridArea({ col: 4, row: 4 })}>
													<Panel label="Latency">
														<strong class="ofigure" style:color="var(--azure)">
															{ms(snapshot?.availability.latency_ms)}
														</strong>
														<span class="ostat">{minMax(series?.availability.latency_ms, ms)}</span>
														<Spark points={series?.availability.latency_ms} tone="var(--azure)" />
													</Panel>
												</div>
											</div>
										</div>
									{:else if image}
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
									{:else if gallery}
										<!-- The tool's own output, not a mockup of it: the source
										     photo and what --mode gray/color actually do to it,
										     side by side rather than described. -->
										<div class="gallery">
											{#each gallery as shot (shot.src)}
												<figure>
													<img
														src={shot.src}
														alt="{name}: {shot.label}"
														loading="lazy"
														decoding="async"
													/>
													<figcaption>{shot.label}</figcaption>
												</figure>
											{/each}
										</div>
									{:else}
										<Placeholder note="{name.toUpperCase().replace(/\s+/g, '-')}.PNG" lines={16} />
									{/if}
								</div>

								<div class="body">
									<p class="blurb">{blurb}</p>

									<ToolPills {tools} />

									<div class="links">
										{#if url}
											<a href={url} target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>
										{:else}
											<!-- Nothing to point at yet. -->
											<div class="slot"><Placeholder note="view on github" lines={1} /></div>
										{/if}

										<!-- On this site rather than off it: the dashboard is its
										     own app, and this is the only door to it. -->
										{#if live}
											<a href={live}>Open dashboard →</a>
										{/if}

										{#if pypi}
											<a href={pypi} target="_blank" rel="noopener noreferrer">View on PyPI ↗</a>
										{/if}
									</div>
								</div>
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

	/* Title and tagline stacked in the head's one flexible column, so the
	   tagline reads under the title in both fold states. */
	.title-group {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
	}

	.tagline {
		margin: 0;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.72rem;
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
		grid-template-columns: auto minmax(0, 1fr) auto auto;
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
	.head:hover .toggle,
	.head:focus-visible .toggle {
		color: var(--color-foreground);
	}

	/* The visual anchors the left, the summary and its pills fill the right. */
	.content {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1.75rem;
	}

	/* A real demo or dashboard preview earns more of the row than a placeholder
	   does — the text beside it only has to hold a blurb and pills, not carry
	   equal weight. */
	.content.wide-visual {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
	}

	/* Stacked rather than side by side, in the same visual column every other
	   embed/preview here uses (.content.wide-visual) — the same width as the
	   server grid's own box and Ancestree's iframe, not a width of its own. */
	.gallery {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.gallery figure {
		margin: 0;
		text-align: center;
	}

	.gallery img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: #000;
	}

	.gallery figcaption {
		margin-top: 0.4rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
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

	/* The one real embed among the visuals: same box, a solid border rather
	   than Placeholder's dashed one since there's finished work inside it. */
	.embed {
		display: block;
		width: 100%;
		height: var(--visual-h);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: #fff;
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
		color: var(--violet);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		background: #fff;
		border: 1.5px solid var(--violet);
		border-radius: 999px;
	}

	/* The site's other colour for "carry on regardless" — the same mint every
	   other live indicator wears (StatusBar's own dot, the dashboard's). */
	.callout.live {
		color: var(--mint);
		border-color: var(--mint);
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

	/* "This server"'s visual: /server's own overview grid (routes/server/
	   +page.svelte), copied and scaled down rather than embedded live. Not a
	   box of its own — just the frame the individual .obox tiles read their
	   dark tokens from, the way .projects itself shadows them light for
	   everything else in it (see .projects further up), just run the other
	   way. Its own background would have been the exact tone every .obox
	   already paints itself, which is what read as one big panel wrapping
	   the tiles rather than the tiles standing on their own. */
	.mini-dashboard {
		box-sizing: border-box;
		width: 100%;
		height: var(--visual-h);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
		--title-size: 0.55rem;
		--title-color: var(--text-faint);
		--axis-w: 1.7rem;
		--graph-min: 3rem;
	}

	.mgrid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-rows: minmax(0, 1fr);
		grid-auto-flow: dense;
		gap: 0.6rem;
		height: 100%;
	}

	.obox {
		overflow: hidden;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		background: var(--color-background);
	}

	/* Opt-in, same as the real dashboard's own .box.fill (Dashboard.svelte):
	   a panel given more than one row is otherwise however tall its content
	   needs, which is what left the CPU & RAM trace a squashed line at the
	   top of a box mostly empty underneath it. This stretches the chain down
	   to the drawing instead. */
	.obox.fill {
		display: flex;
		flex-direction: column;
	}

	.obox.fill :global(.panel),
	.obox.fill :global(.plot),
	.obox.fill .mfleet {
		flex: 1;
		min-height: 0;
	}

	.ofigure {
		display: block;
		color: var(--color-foreground);
		font-size: 0.92rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.ostat {
		display: block;
		margin-top: 0.15rem;
		color: var(--text-dim);
		font-size: 0.48rem;
		font-weight: 500;
		letter-spacing: 0.03em;
	}

	/* When the snapshot behind every other reading in this box was taken. */
	.mupdated {
		display: block;
		margin-top: 0.35rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.02em;
	}

	/* The containers table (routes/server/containers/+page.svelte), copied at
	   card scale the same way the overview grid above it is: a real table
	   rather than the running/unhealthy count it replaces, scrolling
	   sideways in its own two-column box rather than dropping columns. */
	.mfleet {
		height: 100%;
		overflow: auto;
	}

	.mfleet table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.56rem;
		white-space: nowrap;
	}

	.mfleet th,
	.mfleet td {
		padding: 0.3rem 0.6rem 0.3rem 0;
		font-weight: 400;
		text-align: left;
	}

	.mfleet thead th {
		padding-top: 0;
		padding-bottom: 0.4rem;
		color: var(--text-dim);
		font-weight: 500;
		letter-spacing: 0.03em;
		border-bottom: 1px solid var(--color-border);
	}

	.mfleet tbody tr + tr th,
	.mfleet tbody tr + tr td {
		border-top: 1px solid var(--color-border);
	}

	.mname {
		color: var(--color-foreground);
		font-weight: 500;
	}

	/* A square of the state's own colour, and the word beside it — the colour
	   is never the only thing saying which way a row reads. */
	.mstate {
		color: var(--mint);
		text-transform: capitalize;
	}

	.mstate i {
		display: inline-block;
		width: 0.4rem;
		height: 0.4rem;
		margin-right: 0.4rem;
		background: currentcolor;
	}

	.mstate.warning {
		color: var(--coral);
	}

	.mlimit {
		color: var(--text-dim);
	}

	.musage {
		min-width: 3.5rem;
	}

	.resource-bar {
		display: block;
		height: 2px;
		margin-top: 0.3rem;
		background: var(--color-border);
	}

	.resource-bar i {
		display: block;
		height: 100%;
		min-width: 0;
		background: currentcolor;
	}

	.ovolumes {
		display: grid;
		gap: 0.35rem;
	}

	.ovolume {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.ovolume-name {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.6rem;
	}

	.ovolume-name .ostat {
		margin-top: 0;
	}

	.ovolumes :global(.capacity .reading) {
		font-size: 0.7rem;
	}

	.body {
		display: grid;
		gap: 0.75rem;
		align-content: start;
	}

	@media (max-width: 40rem) {
		.content {
			grid-template-columns: minmax(0, 1fr);
		}
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

	/* A click still opens the row — it just snaps open rather than growing
	   into place. */
	@media (prefers-reduced-motion: reduce) {
		.fold,
		.head h3 {
			transition: none;
		}
	}
</style>
