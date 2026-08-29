<script>
	import Capacity from '$lib/components/Capacity.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Spark from '$lib/components/Spark.svelte';
	import ToolPills from '$lib/components/ToolPills.svelte';
	import Trace from '$lib/components/Trace.svelte';
	import { fleet } from '$lib/containers.js';
	import { degrees, gigabytes, microseconds, ms, pct, rate } from '$lib/format.js';
	import { memoryBands } from '$lib/memory.js';
	import { server } from '$lib/server.svelte.js';
	import { last, mean, minMax, values } from '$lib/stats.js';
	import { DISKS, volume } from '$lib/storage.js';
	import { clockOffset, clockOffsetHistory } from '$lib/time.js';

	/* The three systems "This server" actually runs, for the card that opens
	   under it. Not a fourth entry in PROJECTS: these are not separate work,
	   they are the one project's own anatomy, numbered under it rather than
	   standing beside it in the list. */
	const SYSTEMS = [
		{ title: 'Crypto Data Gatherer', icon: 'Signal' },
		{ title: 'This Server', icon: 'Server' },
		{ title: 'This Website', icon: 'Globe', here: true }
	];

	/* The work worth showing. `tools` are what each is actually built with; `url`
	   is where the source is, on the ones that are public; `live` is where it
	   actually runs on this site, on the one that runs here. */
	const PROJECTS = [
		{
			name: 'Ancestree',
			year: 2026,
			blurb:
				'Zero-dependency Python package that models a data pipeline as a directed acyclic graph, with content-defined chunking over a SQL backend. Published on PyPI and in use by researchers internally.',
			tools: ['Python', 'SQL', 'Git'],
			url: 'https://github.com/JS195/ancestree'
		},
		{
			name: 'Orderflow analysis',
			year: 2026,
			blurb:
				'Pipeline for Binance futures and spot data, with a dynamic feature registry covering OHLC aggregation, open interest, funding rate and CVD, read back through a multi-panel plotting framework.',
			tools: ['Python', 'Pandas', 'Polars', 'Plotly', 'NumPy']
		},
		{
			name: 'This server',
			year: 2026,
			blurb:
				'The machine this site is served from, and the site itself: metrics scraped off the box, cached behind a small API, and read back live on the server page.',
			tools: ['Svelte', 'JavaScript', 'Docker', 'Linux', 'Python'],
			url: 'https://github.com/js-home-server',
			live: '/server'
		},
		{
			name: 'ascii-art',
			year: 2025,
			blurb:
				'C11 CLI that converts raster images into ASCII art for the terminal or the web: block-averaged sampling, tone curve and glyph selection as separable, individually tested stages. Generates the art on this site, including the astronaut on the about page.',
			tools: ['C++', 'Git'],
			url: 'https://github.com/JS195/asciiArt'
		}
	];

	/* This server's own live reading, the same shape /server's overview page
	   works out for itself (routes/server/+page.svelte) — a smaller copy of it
	   stands under this one card. Reading `server` straight rather than calling
	   `watch()` again: the landing page's StatusBar already polls it for the box
	   above this one, and a second poller would only double the requests for
	   the same numbers. */
	let snapshot = $derived(server.snapshot);
	let series = $derived(server.series);
	let month = $derived(server.month ?? server.series);

	let online = $derived(snapshot?.availability.server_status === 'online');

	let cpuPoints = $derived(series?.cpu.percent ?? []);
	let ramPoints = $derived(memoryBands(series).find((band) => band.id === 'used')?.points ?? []);

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

	let rxPoints = $derived(series?.network.receive_bytes_per_second ?? []);
	let txPoints = $derived(series?.network.transmit_bytes_per_second ?? []);

	/* Days and the hours/minutes left over, rather than the hour count the rest
	   of the site quotes this same figure as: a box up long enough to show here
	   is up long enough that hours stop being the unit worth leading with. */
	let uptimeSeconds = $derived(snapshot?.availability.uptime_seconds);
	let uptimeDays = $derived(Number.isFinite(uptimeSeconds) ? Math.floor(uptimeSeconds / 86400) : null);
	let uptimeRest = $derived(
		Number.isFinite(uptimeSeconds)
			? `${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`
			: null
	);
	/* The status series is 1 for a poll the machine answered, 0 for one it did
	   not — its mean over the window is the same share of uptime the rail's own
	   incident count is read off, just as a percentage instead. */
	let uptimeShare = $derived(values(series?.availability.status).length
		? pct(mean(values(series?.availability.status)) * 100)
		: null);

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

	/* Row height plus the gap — except row 0 to row 1, which is shorter: only
	   .card:nth-child(n + 2) carries the padding the divider rule stands in,
	   so the first row is shut-shorter than every row after it. Reading an
	   adjacent shut pair off the DOM used to get this wrong whenever the only
	   available pair was (0, 1) — with four rows, that's whenever row 2 is
	   open, and there is no other pair to fall back to. Measured straight off
	   the parts instead: the head's own height and the grid gap never change
	   with fold state, and the extra padding is a fixed style read off any
	   row past the first. */
	function metrics() {
		const gap = parseFloat(getComputedStyle(rows[0].parentElement).rowGap) || 0;
		const head = rows[0].querySelector('.head').getBoundingClientRect().height;
		const extra = rows.length > 1 ? parseFloat(getComputedStyle(rows[1]).paddingTop) : 0;
		return { base: gap + head, step: gap + head + extra };
	}

	/* Row i's shut-layout offset from row 0's top. */
	function offsetFor(i, { base, step }) {
		return i === 0 ? 0 : base + (i - 1) * step;
	}

	function onScroll() {
		/* getBoundingClientRect forces layout, and a scroll fires far more often
		   than the screen paints. */
		if (queued || rows.length < 2) return;
		queued = true;
		requestAnimationFrame(() => {
			queued = false;
			const { base, step } = metrics();
			const first = rows[0].getBoundingClientRect().top;
			const into = window.innerHeight * LINE - first;
			open =
				into < base
					? 0
					: Math.min(PROJECTS.length - 1, 1 + Math.floor((into - base) / step));
		});
	}

	/* A shut title is still a thing to click: it scrolls that row onto the line,
	   rather than setting `open` behind the scroll's back for the next scroll
	   event to undo. */
	function stepTo(i) {
		const first = rows[0].getBoundingClientRect().top;
		/* Landing exactly on the line puts `into` exactly on a bucket boundary,
		   and window.scrollTo rounds to a device pixel — which can round down
		   onto the row above and leave the click reopening the wrong card. One
		   pixel past the line keeps it inside row i regardless. */
		const wanted = window.innerHeight * LINE - offsetFor(i, metrics()) - 1;
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
			{#each PROJECTS as { name, year, blurb, tools, url, live }, i (name)}
				<article class="card" class:open={i === open} bind:this={rows[i]}>
					<!-- The whole title line is the control: a collapsed project is a
					     line that opens, and that is all it does. -->
					<button type="button" class="head" aria-expanded={i === open} onclick={() => stepTo(i)}>
						<span class="icon">{String(i).padStart(2, '0')}</span>
						<h3>
							{name}
							{#if live === '/server'}
								<span class="live" class:down={!online}>
									<i class="dot" aria-hidden="true"></i>Live
								</span>
							{/if}
						</h3>
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

							{#if live === '/server'}
								<!-- A window into the actual (dark) dashboard rather than a
								     description of it, so this stands apart from the box's own
								     light paint job: --color-foreground/--color-border are
								     re-shadowed back to the page's real (dark) tokens, the same
								     trick .projects used to go light in the first place, just run
								     the other way — see the rule below for what that undoes. -->
								<div class="server-detail">
									<div class="subsection">
										<h4>
											<span class="tag">{String(i).padStart(2, '0')}.2</span>
											Projects in this server
										</h4>
										<p class="sub-lede">The three systems that power this website.</p>

										<div class="systems">
											{#each SYSTEMS as system, j (system.title)}
												<div class="scard">
													<div class="scard-head">
														<Logo name={system.icon} />
														<div class="scard-title">
															<span class="tag">
																{String(i).padStart(2, '0')}.2.{j + 1}
															</span>
															<h5>
																{system.title}
																{#if system.here}<span class="here">(You're here)</span>{/if}
																<span class="live" class:down={!online}>
																	<i class="dot" aria-hidden="true"></i>Live
																</span>
															</h5>
														</div>
													</div>

													<!-- Not written up individually yet: this is the one
													     project's own anatomy rather than three of its own,
													     and nothing here should read as a claim before it is. -->
													<Placeholder note="description" lines={2} />
													<Placeholder note="highlights" lines={3} />
												</div>
											{/each}
										</div>
									</div>

									<div class="subsection">
										<h4>
											<span class="tag">{String(i).padStart(2, '0')}.3</span>
											Live metrics overview
										</h4>
										<p class="sub-lede">Real-time metrics from the server.</p>

										<div class="metrics">
											<div class="obox">
												<Panel label="01 Temperature">
													<strong class="ofigure" style:color="var(--amber)">
														{degrees(snapshot?.cpu.temperature_c)}
													</strong>
													<span class="ostat">{minMax(series?.cpu.temperature_c, degrees)}</span>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="02 Latency">
													<strong class="ofigure" style:color="var(--azure)">
														{ms(snapshot?.availability.latency_ms)}
													</strong>
													<span class="ostat">{minMax(series?.availability.latency_ms, ms)}</span>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="03 Containers">
													<div class="opair">
														<span>
															<strong class="ofigure">{containers.running}</strong>
															<span class="ostat">Running</span>
														</span>
														<span class:unhealthy={containers.unhealthy}>
															<strong class="ofigure">{containers.unhealthy}</strong>
															<span class="ostat">Unhealthy</span>
														</span>
													</div>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="04 CPU Usage">
													<strong class="ofigure" style:color="var(--mint)">
														{pct(last(cpuPoints))}
													</strong>
													<span class="ostat">{minMax(cpuPoints, pct)}</span>
													<Spark points={cpuPoints} tone="var(--mint)" />
												</Panel>
											</div>

											<div class="obox">
												<Panel label="05 RAM Usage">
													<strong class="ofigure" style:color="var(--violet)">
														{pct(last(ramPoints))}
													</strong>
													<span class="ostat">{minMax(ramPoints, pct)}</span>
													<Spark points={ramPoints} tone="var(--violet)" />
												</Panel>
											</div>

											<div class="obox span2">
												<Panel label="06 CPU & RAM Usage (%)">
													<Trace
														lines={[
															{ id: 'cpu', points: cpuPoints, tone: 'var(--mint)', label: 'CPU' },
															{ id: 'ram', points: ramPoints, tone: 'var(--violet)', label: 'RAM' }
														]}
														domain={[0, 100]}
														format={pct}
													/>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="07 Uptime">
													<strong class="ofigure" style:color="var(--mint)">
														{uptimeDays === null ? '—' : `${uptimeDays}d`}
													</strong>
													<span class="ostat">
														{uptimeRest === null ? 'NO HISTORY YET' : `${uptimeRest} · ${uptimeShare}`}
													</span>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="08 Load Average">
													<!-- Nothing the status endpoint carries yet — the same
													     honesty the real dashboard's own Processes panel
													     holds to (routes/server/+page.svelte). -->
													<Placeholder note="—" lines={3} />
												</Panel>
											</div>

											<div class="obox">
												<Panel label="09 Storage Overview">
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

											<div class="obox">
												<Panel label="10 Time Offset">
													<strong class="ofigure" style:color="var(--azure)">
														{microseconds(clockOffset(snapshot?.time))}
													</strong>
													<span class="ostat">{minMax(clockHistory, microseconds)}</span>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="11 Network I/O">
													<div class="opair">
														<span>
															<strong class="ofigure" style:color="var(--azure)">
																{rate(last(rxPoints))}
															</strong>
															<span class="ostat">↓ In</span>
															<Spark points={rxPoints} tone="var(--azure)" fill={false} />
														</span>
														<span>
															<strong class="ofigure" style:color="var(--violet)">
																{rate(last(txPoints))}
															</strong>
															<span class="ostat">↑ Out</span>
															<Spark points={txPoints} tone="var(--violet)" fill={false} />
														</span>
													</div>
												</Panel>
											</div>

											<div class="obox">
												<Panel label="12 Processes">
													<!-- Not wired up on the full dashboard either — see
													     routes/server/+page.svelte's own copy of this. -->
													<Placeholder note="—" lines={3} />
												</Panel>
											</div>
										</div>

										<div class="status-footer">
											<div class="stat">
												<span class="tag">Server status</span>
												<span class="sval">
													<i class="dot" class:down={!online} aria-hidden="true"></i>
													{online ? 'Online' : 'Offline'}
												</span>
											</div>
											<!-- Not carried by the status endpoint yet. -->
											<div class="stat">
												<span class="tag">Location</span>
												<span class="sval">—</span>
											</div>
											<div class="stat">
												<span class="tag">IP address</span>
												<span class="sval">—</span>
											</div>
											<div class="stat">
												<span class="tag">OS</span>
												<span class="sval">—</span>
											</div>
											<div class="stat">
												<span class="tag">Kernel</span>
												<span class="sval">—</span>
											</div>
											<div class="stat">
												<span class="tag">Last reboot</span>
												<span class="sval">—</span>
											</div>
										</div>
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

	/* A live status inline with a title, in the box's own small caps rather than
	   leading a card of its own — the same dot StatusBar's status line wears
	   (components/StatusBar.svelte), just small enough to sit beside a name. */
	.live {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-left: 0.6rem;
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		vertical-align: middle;
	}

	.live .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: currentcolor;
		box-shadow: 0 0 0.5rem currentcolor;
	}

	.live.down {
		color: var(--coral);
	}

	/* --- server detail -------------------------------------------------
	   Everything under "This server" once it opens: the systems it runs and a
	   compact copy of its own live dashboard, on the box's own light paint —
	   the numbering, the headings, the sub-ledes below all read .projects'
	   ordinary (light) tokens like everything else in it. Only the three dark
	   boxes (.scard, .obox, .status-footer, further down) read as a window
	   into the real dashboard instead, and shadow the tokens back to it. */
	.server-detail {
		display: grid;
		gap: 1.75rem;
	}

	.subsection {
		padding-top: 1.25rem;
		border-top: var(--rule);
	}

	.subsection h4 {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin: 0;
		color: var(--color-foreground);
		font-size: 0.92rem;
		font-weight: 700;
	}

	.sub-lede {
		margin: 0.3rem 0 1rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.7rem;
	}

	/* The section's own numbering and the footer's field names: the eyebrow
	   voice every label on the site is set in, but not .eyebrow itself — that
	   class is shadowed above (.projects .eyebrow) for the box's one real
	   heading, block and stood off by --pad, which is wrong for a run of
	   inline tags and a row of footer labels. */
	.tag {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* --- the three systems ----------------------------------------------- */
	.systems {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	/* A window into the real (dark) dashboard rather than a description of it,
	   so — unlike everything else in .projects — this reads in the site's
	   actual dark tokens: --foreground/--border are those tokens untouched,
	   since .projects only ever shadowed their --color-* aliases, and
	   --color-background was never touched either, so it is already the
	   page's real dark surface. Declared fresh on the box itself (not an
	   ancestor) so every var() a child resolves — its own, or one buried in
	   Panel/Capacity/Trace — reads it from here down, not from whatever
	   .projects' light values had already been baked into further up. */
	.scard {
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--color-background);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
	}

	.scard-head {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}

	.scard-head :global(svg) {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		margin-top: 0.15rem;
		color: var(--text-faint);
	}

	.scard-title {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
	}

	.scard-title h5 {
		margin: 0;
		color: var(--color-foreground);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.here {
		margin-left: 0.4rem;
		color: var(--text-faint);
		font-size: 0.68rem;
		font-weight: 500;
	}

	/* --- live metrics ------------------------------------------------------
	   /server's own overview (routes/server/+page.svelte) at card scale: the
	   same panels — bar Load Average, which nothing has ever wired up, same as
	   Processes there — a tighter grid, and every size turned down a step.
	   Scoped here rather than shared with Dashboard.svelte's .box/.grid on
	   purpose: those read from a .body ancestor this card does not have, and
	   are sized for a full screen rather than a card. */
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.6rem;
		margin-bottom: 0.75rem;
		/* Panel (components/Panel.svelte) reads its size from here; its colour
		   is set on .obox below instead, alongside the rest of the tokens it
		   has to be resolved against .obox's own dark reshadow, not read stale
		   off .metrics' — see .scard just above for the reasoning in full. */
		--title-size: 0.58rem;
		/* .plot (app.css) reads both from its own ancestors the same way. */
		--axis-w: 2.1rem;
		--graph-min: 4.5rem;
	}

	.obox {
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		background: var(--color-background);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
		--title-color: var(--text-faint);
	}

	.obox.span2 {
		grid-column: span 2;
	}

	.ofigure {
		display: block;
		color: var(--color-foreground);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.ostat {
		display: block;
		margin-top: 0.2rem;
		color: var(--text-dim);
		font-size: 0.56rem;
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	/* Two readings side by side: Containers' running/unhealthy pair and
	   Network I/O's in/out pair share this shape. */
	.opair {
		display: flex;
		gap: 1rem;
		/* Read by Spark (components/Spark.svelte) — the network tiles' own
		   sparklines run shallower than the card's other, taller ones. */
		--spark: 1.1rem;
	}

	.opair > span {
		display: grid;
		gap: 0.2rem;
	}

	.opair .ostat {
		margin-top: 0;
	}

	.opair .unhealthy .ofigure {
		color: var(--coral);
	}

	.ovolumes {
		display: grid;
		gap: 0.5rem;
	}

	.ovolume {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.ovolume-name {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.72rem;
	}

	.ovolume-name .ostat {
		margin-top: 0;
	}

	/* Capacity (components/Capacity.svelte) sets its own reading size, tuned
	   for the full dashboard; turned down the same way Dashboard.svelte
	   reaches into a page's own markup — :global(), since a scoped rule here
	   cannot cross into another component. */
	.ovolumes :global(.capacity .reading) {
		font-size: 0.85rem;
	}

	/* --- status footer ------------------------------------------------- */
	.status-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem 2rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.3rem;
		background: var(--color-background);
		color: var(--foreground);
		--color-foreground: var(--foreground);
		--color-border: var(--border);
		--text-dim: #a09f98;
		--text-faint: #8a8a84;
	}

	.stat {
		display: grid;
		gap: 0.3rem;
	}

	.sval {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.78rem;
	}

	.sval .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--mint);
		box-shadow: 0 0 0.5rem var(--mint);
	}

	.sval .dot.down {
		background: var(--coral);
		box-shadow: 0 0 0.5rem var(--coral);
	}

	/* Under this the systems stack, and the metrics grid halves — the wide
	   trace tile stays wide either way, since span 2 of 2 is the full row. */
	@media (max-width: 60rem) {
		.systems {
			grid-template-columns: minmax(0, 1fr);
		}

		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Narrower still, one column flat — the trace tile's span has to be undone
	   here or it would claim a second column that no longer exists. */
	@media (max-width: 30rem) {
		.metrics {
			grid-template-columns: minmax(0, 1fr);
		}

		.obox.span2 {
			grid-column: span 1;
		}
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
