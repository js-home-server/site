<script>
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ServerMiniDashboard from '$lib/components/ServerMiniDashboard.svelte';
	import StudyHead from '$lib/components/StudyHead.svelte';
	import { brandColors } from '$lib/logos.js';

	/* Same shape as the other three studies, but the angle here is the boundary:
	   a box in a house publishing a live, unauthenticated feed about itself.
	   `mini-dashboard` is a scaled-down copy of /server's overview grid, not an
	   import — so this preview can change without touching the real page. */

	/* Read across like a datasheet header, same as the other studies. */
	const SPEC = [
		{ label: 'host', value: 'i5-6600T, 4 cores, 8 GB' },
		{ label: 'disks', value: '224 GB SSD + 512 GB NVMe' },
		{ label: 'os', value: 'Debian 13, kernel 6.12' },
		{ label: 'runtime', value: '8 containers, Compose' },
		{ label: 'api', value: 'FastAPI, Python 3.13' },
		{ label: 'code', value: '1,470 lines, 248 of them tests' }
	];

	const HEADLINE = [
		{ figure: '3.0', unit: 'W', note: 'median processor draw over 30 days, 15 W at the peak' },
		{ figure: '0', unit: 'open ports', note: 'nothing on the box listens; ingress is one outbound tunnel' },
		{ figure: '229', unit: 'lines', note: 'the two collectors that replaced cAdvisor' },
		{ figure: '4', unit: 'states', note: 'live, stale, partial or unavailable, per group, in every response' }
	];

	/* Two columns — the right one is what the collectors refuse to write, which is the half that matters. */
	const SURFACE = [
		{
			title: 'Published',
			icon: 'globe',
			items: [
				'Host counters: CPU, memory, temperature, RAPL power, disk usage and IO',
				'Per container: status, uptime, CPU and memory against their own limits, for the eight on the list',
				'Clock offset and stratum, with each upstream peer as a city-level label',
				'Uptime, and probe latency to the public origin'
			]
		},
		{
			title: 'Never written',
			icon: 'shield',
			items: [
				'Process lists, command lines, environment, filenames, anything about what the archive holds',
				'Container IDs, image digests, internal addresses, the name of any container not on the list',
				'Upstream time-source addresses, turned into labels before the metric exists',
				'Precise location. The host is published at the middle of the country, flagged approximate'
			]
		}
	];

	/* Three paths, one snippet. `brand` = simple-icons (logos.js), `icon` = outline (icons.js). */
	const INGRESS = {
		title: 'How a request gets in',
		stages: [
			{ name: 'Internet', icon: 'globe' },
			{ name: 'Cloudflare', brand: 'Cloudflare', detail: 'Edge + tunnel' },
			{ name: 'Reverse proxy', icon: 'cube', detail: 'Caddy' },
			{ name: 'Site + API', icon: 'cubes', detail: 'Svelte, FastAPI' }
		],
		note: 'The router forwards nothing. The tunnel daemon dials out, so the only reachable surface is one hostname on somebody else’s edge.'
	};

	const COLLECT = {
		title: 'How a number gets out',
		stages: [
			{ name: 'Host + Docker', icon: 'machine', detail: 'chronyc, inspect' },
			{ name: 'Collectors', brand: 'Python', detail: 'cron, 60 s' },
			{ name: 'Textfile', icon: 'exporters', detail: 'atomic rename' },
			{ name: 'node_exporter', icon: 'hexagon', detail: 'read-only mount' },
			{ name: 'Prometheus', brand: 'Prometheus', detail: '15 s scrape' },
			{ name: 'Status API', icon: 'code', detail: 'cached, capped' }
		],
		note: 'The two processes meet through a directory the exporter mounts read-only. Nothing pushes, and nothing holds a socket open.'
	};

	const DEPLOY = {
		title: 'One deploy, start to finish',
		stages: [
			{ name: 'Clean tree', brand: 'Git', detail: 'or it refuses' },
			{ name: 'Build', brand: 'Docker', detail: 'tagged @commit' },
			{ name: 'Compose up', icon: 'cube', detail: 'config first' },
			{ name: 'Health poll', icon: 'pulse', detail: '30 s to answer' },
			{ name: 'Cron rewritten', icon: 'clock', detail: 'collectors last' }
		],
		note: 'Any failure restores the previous commit’s stack and the crontab it replaced.'
	};

	/* What the API promises about itself, as numbers. */
	const GUARDS = [
		{
			label: 'Routes',
			value: '3',
			note: 'health, system, history. Anything else is a 404, anything but GET a 405, an unexpected query parameter a 422'
		},
		{
			label: 'Cache',
			value: '15 / 300 s',
			note: 'snapshot and history. One Prometheus round trip per window, however many people are reading'
		},
		{
			label: 'Freshness',
			value: '60 / 180 s',
			note: 'per source. Past its threshold a group is marked stale rather than dropped or guessed at'
		},
		{
			label: 'Ceilings',
			value: '64 / 128k',
			note: 'series and samples, with 4 MB on the upstream read and 8 MB on the response. Over the cap is a 503'
		}
	];

	/* The archive is pinned to cores 0-1 by cpuset — the 7-day means show it. */
	const CORES = [
		{ id: 0, percent: 27.9, detail: 'archive + compaction, pinned' },
		{ id: 1, percent: 31.7, detail: 'archive + compaction, pinned' },
		{ id: 2, percent: 3.3, detail: 'everything else' },
		{ id: 3, percent: 3.3, detail: 'everything else' }
	];

	/* Read off Prometheus and node_exporter on 2026-09-02, not asserted. */
	const MEASURED = [
		{
			label: 'Processor draw',
			value: '3.0 / 15.0 W',
			note: 'p50 and peak over 30 days, package plus DRAM by RAPL'
		},
		{
			label: 'CPU temperature',
			value: '42 / 45 °C',
			note: 'now and p99 over 30 days, on passive airflow in a cupboard'
		},
		{
			label: 'Written per day',
			value: '18.7 / 2.7 GB',
			note: 'NVMe and SSD, 7-day means. The NVMe takes the write-ahead tape so the SSD does not'
		},
		{
			label: 'Network moved',
			value: '603 GiB',
			note: 'in August. About 3 Mbit/s average, or 0.35% of the link'
		},
		{
			label: 'Metrics on disk',
			value: '226 MB',
			note: 'Prometheus after a month at 15-second scrapes, across two targets'
		},
		{
			label: 'Public probe',
			value: '0 in 7 d',
			note: 'the blackbox check has not seen a 2xx, because the site is not served at that origin yet'
		}
	];

	/* What running it involves, as opposed to what building it did. */
	const OPERATING = [
		{
			icon: 'pulse',
			term: 'Health',
			text: 'Containers restart unless stopped. The collector’s check is a dead-man switch that fails if a gating feed goes quiet, so a hung process gets replaced instead of sitting there silent.'
		},
		{
			icon: 'adjustments',
			term: 'Isolation',
			text: 'Memory, CPU and PID limits on all eight. The archive is pinned by cpuset rather than given a quota, because a quota caps CPU-seconds but still lets the scheduler jitter all four cores.'
		},
		{
			icon: 'shield',
			term: 'Updates',
			text: 'Security updates apply unattended. Every image is pinned by digest, so nothing moves underneath me until I move it.'
		},
		{
			icon: 'clock',
			term: 'Time',
			text: 'chrony against four peers, holding about 100 µs RMS offset. The archive’s timestamps are worth what this is worth, so it is sampled every minute.'
		},
		{
			icon: 'database',
			term: 'Backups',
			text: 'The irreplaceable part is small enough to copy nightly and is not being copied nightly. One manual snapshot exists. That is the open gap.'
		}
	];

	const LIMITS = [
		{
			term: 'Nothing alerts',
			text: 'metrics get collected, stored and drawn, and no one is paged. That is how a dead collector ran for six days in August: visible on a dashboard, announced to nobody.'
		},
		{
			term: 'Prometheus does not watch itself',
			text: 'two scrape targets, neither of them the monitoring stack. If Prometheus degrades, the only thing that notices is a container healthcheck.'
		},
		{
			term: 'Ten-year retention is a config line',
			text: '226 MB after a month says nothing about year three, and nothing downsamples.'
		},
		{
			term: 'The probe has never gone green',
			text: 'it watches an origin that does not serve the site yet. The check is right and the dashboard says so, which is correct behaviour and still a red light.'
		},
		{
			term: 'One host',
			text: 'one power supply, one uplink, one pair of disks, no failover. A reboot is an outage, and for the capture a hole in the data.'
		}
	];

	/* Bar scale, rounded up off the busiest core so the pinned pair don't max out. */
	const CORE_SCALE = 40;
</script>

<!-- A stage of a path: a mark over a name, with detail underneath. -->
{#snippet mark(stage)}
	{#if stage.brand}
		<span class="mark" style:color={brandColors[stage.brand] ?? 'currentcolor'}>
			<Logo name={stage.brand} />
		</span>
	{:else}
		<span class="mark"><Icon name={stage.icon} /></span>
	{/if}
{/snippet}

<!-- One path, left to right, with the one thing worth saying beside it. -->
{#snippet path(flow)}
	<div class="flow">
		<h3>{flow.title}</h3>
		<div class="flow-body">
			<div class="stages">
				{#each flow.stages as stage, s (stage.name)}
					{#if s}<span class="arrow" aria-hidden="true">⟶</span>{/if}
					<div class="stage">
						{@render mark(stage)}
						<strong>{stage.name}</strong>
						{#if stage.detail}<span>{stage.detail}</span>{/if}
					</div>
				{/each}
			</div>
			<p class="aside">{flow.note}</p>
		</div>
	</div>
{/snippet}

<div class="study">
	<!-- What it is, and the four numbers that place it. -->
	<section class="box banner">
		<div class="intro">
			<p class="thesis">
				This box publishes a live, unauthenticated feed about itself to the internet. Every
				number in that feed is a fact about a machine in a house, so the design problem here
				is not uptime. It is the boundary.
			</p>
			<p class="prose">
				What is public is a written inventory that the code enforces on the way out, rather
				than whatever the exporters happen to expose. The dashboard on this site is the
				client, and everything it draws crossed that boundary on purpose.
			</p>

			<dl class="spec">
				{#each SPEC as item (item.label)}
					<div><dt>{item.label}</dt><dd>{item.value}</dd></div>
				{/each}
			</dl>
		</div>

		<div class="headline">
			{#each HEADLINE as item (item.note)}
				<div class="figure">
					<strong>{item.figure}<span class="unit">{item.unit}</span></strong>
					<span class="note">{item.note}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- The boundary, which is the whole argument. -->
	<section class="box row">
		<div>
			<StudyHead label="boundary" title="What is public is a list, not a side effect" lede="The usual answer is to point Grafana at node_exporter and put a password on it. That publishes whatever the exporter exposes, and an exporter’s job is to expose everything." />
			<p class="prose">
				Instead the public surface is a checked-in inventory, and the collectors enforce it
				in the direction that fails safe. A container appears only if it carries a
				<code>monitoring.public</code> label. The renderer raises on a name, a status or a
				count it does not recognise, rather than passing it through. Adding a number to the
				public API is a commit against that inventory.
			</p>
			<p class="foot-note">
				A collector that raises writes no file at all, the exporter keeps serving the last
				good one, and the API marks the group stale. Time sources show the pattern most
				clearly: peer addresses become city labels before the metric is written, so there is
				no version of the file with an address in it to leak.
			</p>
		</div>

		<div class="surface">
			{#each SURFACE as column (column.title)}
				<div class="tray">
					<h3><span class="mark small"><Icon name={column.icon} /></span>{column.title}</h3>
					<ul>
						{#each column.items as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- Ingress: nothing listens. -->
	<section class="box row">
		<div>
			<StudyHead label="ingress" title="Nothing on the box listens to the internet" lede="There is no port forwarding and no public SSH to find. A tunnel daemon dials out and holds the connection open from the inside." />
			<p class="prose">
				Two services bind a host port at all, and both bind loopback only. Everything else
				talks over a private Docker network. Containers drop all capabilities and run with
				<code>no-new-privileges</code>; the API also runs as an unprivileged uid on a
				read-only root filesystem, with a 16 MB <code>noexec,nosuid</code> tmpfs as the only
				writable thing it can see.
			</p>
			<p class="foot-note">
				Administration goes over a private mesh rather than the public internet. Security
				patches apply unattended and SMART watches both disks, which is most of what decides
				whether a box like this is still healthy in a year.
			</p>
		</div>

		<div class="flows">{@render path(INGRESS)}</div>
	</section>

	<!-- Egress: 229 lines instead of a daemon. -->
	<section class="box row">
		<div>
			<StudyHead label="collect" title="229 lines instead of cAdvisor" lede="cAdvisor publishes several hundred series per container. This site draws five of them." />
			<p class="prose">
				Two scripts read <code>docker inspect</code>, <code>docker stats</code> and
				<code>chronyc</code>, then write five numbers per container and twenty about the
				clock. Each writes a temp file and renames it, so the exporter can never read half a
				file, and the directory is mounted read-only into the exporter.
			</p>
			<p class="foot-note">
				The clock sampler has to run on the host, because chronyd binds loopback in the host
				namespace and its socket directory is root-only. I first ran it as a user unit
				without lingering enabled, so it died with the login session and the metric stopped
				without anything going red.
			</p>
		</div>

		<div class="flows">{@render path(COLLECT)}</div>
	</section>

	<!-- The API, and the fact that degradation is a type. -->
	<section class="box row">
		<div>
			<StudyHead label="serve" title="Degradation is a type, not an exception" lede="This page is the client, so its failure modes had to be designed rather than discovered." />
			<p class="prose">
				Each group in the response carries its own state: live, stale, partial or
				unavailable. The cache only overwrites itself with a response it trusts, so if
				Prometheus disappears mid-scrape the API keeps serving the last good snapshot with
				the affected groups marked, and the dashboard draws dashes in those tiles instead of
				a spinner that never resolves.
			</p>
			<p class="foot-note">
				The ceilings sit on the read rather than the write. A metric store answering slowly,
				or answering with a million points, is the realistic way a read-only API becomes a
				denial of service against its own host.
			</p>
		</div>

		<div class="readings">
			{#each GUARDS as item (item.label)}
				<div class="reading">
					<span class="rlabel">{item.label}</span>
					<strong>{item.value}</strong>
					<span class="rnote">{item.note}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- The machine itself, up and answering while the study is read. -->
	<section class="box row">
		<div>
			<StudyHead label="live" title="The box, while you read about it" lede="Current telemetry from this machine, through the API described above. A dash means the degradation path is doing its job, not that the tile is broken." />
		</div>

		<ServerMiniDashboard />
	</section>

	<!-- The same box, read off its own instruments rather than described. -->
	<section class="box row">
		<div>
			<StudyHead label="measured" title="What it costs to run" lede="Read off Prometheus and node_exporter on 2026-09-02." />

			<div class="cores">
				<span class="cores-head">7-day mean busy, per core</span>
				{#each CORES as core (core.id)}
					<div class="core">
						<span class="core-name">core {core.id}</span>
						<span class="core-track">
							<i
								class:pinned={core.id < 2}
								style="width: {(core.percent / CORE_SCALE) * 100}%"
							></i>
						</span>
						<span class="core-value">{core.percent}%</span>
						<span class="core-detail">{core.detail}</span>
					</div>
				{/each}
			</div>

			<p class="foot-note">
				The gap is the cpuset rather than luck. Capture and compaction are confined to two
				cores by the kernel, so the half of the box that serves this page cannot be starved
				by the half that writes the archive.
			</p>
		</div>

		<div class="readings">
			{#each MEASURED as item (item.label)}
				<div class="reading">
					<span class="rlabel">{item.label}</span>
					<strong>{item.value}</strong>
					<span class="rnote">{item.note}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Shipping, which on a single box is mostly about how to undo it. -->
	<section class="box row">
		<div>
			<StudyHead label="shipping" title="Deploys are commit-only" lede="The script refuses to run against a dirty tree and tags the image with the commit SHA, so whatever is running has a name in the history." />
			<p class="prose">
				A rollback trap is armed before anything changes. Its target defaults to the parent
				commit and can be named explicitly, which matters the one time you need to skip back
				over a bad one. The crontab that drives the collectors is captured before it is
				rewritten and restored with everything else, because a half-rolled-back deploy that
				leaves new cron lines behind is the failure that would actually have bitten.
			</p>
		</div>

		<div class="flows">{@render path(DEPLOY)}</div>
	</section>

	<div class="pair">
		<!-- What running it involves, as opposed to what building it did. -->
		<section class="box">
			<StudyHead label="operate" title="Day to day" />

			<div class="ops">
				{#each OPERATING as op (op.term)}
					<div class="op">
						<span class="mark"><Icon name={op.icon} /></span>
						<strong>{op.term}</strong>
						<p class="prose">{op.text}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Where it stops. One host is one host. -->
		<section class="box">
			<StudyHead label="limits" title="Where it stops" />

			<ul class="limits">
				{#each LIMITS as limit (limit.term)}
					<li>
						<span class="mark warn"><Icon name="warning" /></span>
						<span><strong>{limit.term}:</strong> {limit.text}</span>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>

<style>
	/* Most classes here live in app.css (shared across all four studies) — this
	   file just keeps its accent and its own layout quirks. */
	.study {
		--ink: var(--amber-ink);
	}

	/* Fixed label column so every section lines up regardless of content. */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 21rem) minmax(0, 1fr);
		gap: 1.75rem;
		align-items: start;
	}

	.prose + .foot-note {
		margin-top: 0.55rem;
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--color-foreground);
	}

	/* One size for every mark, brand or generic, so rows read the same. */
	.mark {
		font-size: var(--fs-h2);
	}

	.mark.small {
		font-size: var(--fs-sm);
	}

	.mark.warn {
		/* -ink: plain --amber is 1.75:1 on this light ground, under the 3:1 an icon needs. */
		color: var(--amber-ink);
		font-size: var(--fs-base);
	}

	/* --- the banner ------------------------------------------------------- */

	.banner {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 1.75rem;
		align-items: start;
	}

	/* Host, disks, OS — the header of a datasheet, read across. */
	.spec div {
		display: grid;
		gap: 0.1rem;
	}




	.figure .unit {
		margin-left: 0.12em;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0;
	}


	/* --- the boundary ----------------------------------------------------- */

	/* Same shape on purpose — the "never written" list is as deliberate as the other. */
	.surface {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.tray {
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: color-mix(in srgb, var(--color-foreground) 2%, #fff);
	}

	.tray h3 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0 0 0.55rem;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 600;
	}

	.tray ul {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tray li {
		position: relative;
		padding-left: 0.85rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.55;
	}

	.tray li::before {
		content: '';
		position: absolute;
		top: 0.5em;
		left: 0;
		width: 0.3rem;
		height: 1px;
		background: var(--text-faint);
	}

	/* --- the paths -------------------------------------------------------- */

	.flows {
		display: grid;
		gap: 0.6rem;
	}

	/* One shade off the card it sits on, so it reads as a diagram not more copy. */
	.flow {
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: color-mix(in srgb, var(--color-foreground) 2%, #fff);
	}

	.flow h3 {
		margin: 0 0 0.6rem;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 600;
	}

	.flow-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 12rem);
		gap: 1.25rem;
		align-items: center;
	}

	/* No wrap — an arrow is its own box and would strand mid-path. Scrolls instead. */
	.stages {
		display: flex;
		flex-wrap: nowrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		overflow-x: auto;
	}

	/* .flow is already the card — reset the shared .stage so it's not a box in a box. */
	.stage {
		flex: initial;
		justify-items: center;
		min-width: 4.5rem;
		padding: 0;
		border: none;
		background: none;
		text-align: center;
	}

	.stage strong {
		line-height: 1.35;
	}

	.stage span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.35;
	}

	/* .mark is a span too, so `.stage span` above wins on specificity without this. */
	.stage .mark {
		color: inherit;
		font-size: var(--fs-subhead);
	}

	/* A caption on the diagram, not a paragraph after it. */
	.aside {
		margin: 0;
		padding: 0.6rem 0.7rem;
		border-radius: var(--radius-control);
		background: color-mix(in srgb, var(--color-foreground) 5%, #fff);
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.6;
	}

	/* --- the cores -------------------------------------------------------- */

	/* Four bars, one scale. The pinned pair are the point, so they get the colour. */
	.cores {
		display: grid;
		gap: 0.4rem;
		margin: 0.15rem 0 0.7rem;
	}

	.cores-head {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.core {
		display: grid;
		grid-template-columns: 3rem minmax(0, 1fr) 2.4rem;
		gap: 0.1rem 0.5rem;
		align-items: center;
	}

	.core-name,
	.core-value {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 600;
	}

	.core-value {
		text-align: right;
	}

	.core-track {
		height: 0.4rem;
		border-radius: var(--radius-control);
		background: color-mix(in srgb, var(--color-foreground) 8%, #fff);
	}

	.core-track i {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: color-mix(in srgb, var(--color-foreground) 25%, #fff);
	}

	.core-track i.pinned {
		/* -ink: plain --mint is 1.68:1 on this light ground. */
		background: var(--mint-ink);
	}

	.core-detail {
		grid-column: 2 / -1;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	/* --- readings, ops, limits -------------------------------------------- */

	/* Label, figure, note — read across, not down. One instrument panel. */
	.readings {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
	}

	.reading {
		display: grid;
		gap: 0.1rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-control);
	}

	.rlabel {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.reading strong {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 700;
	}

	.rnote {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		line-height: 1.5;
	}

	.ops {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}

	.op {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		padding: 0 0.7rem;
	}

	.op + .op {
		border-left: var(--rule);
	}

	.op strong {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		font-weight: 600;
	}

	.op .prose {
		font-size: var(--fs-sm);
	}


	.limits strong {
		color: var(--color-foreground);
		font-weight: 600;
	}

	/* Wider half holds the five boxes. */
	.pair {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
	}

	/* --- narrow ---------------------------------------------------------- */

	/* Label column goes first — a title reads fine over its content too. */
	@media (max-width: 60rem) {
		.row,
		.banner,
		.pair,
		.surface,
		.flow-body {
			grid-template-columns: minmax(0, 1fr);
		}

		.ops,
		.readings {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.op + .op {
			border-left: 0;
		}
	}
</style>
