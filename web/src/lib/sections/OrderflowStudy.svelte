<script>
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import OrderflowEquityChart from '$lib/components/OrderflowEquityChart.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';

	/* The combined study for the crypto work. It was two cards — the collector
	   and the research that reads it — and they were never two projects: one
	   exists because the other needed data nobody sells, and the research is
	   what says whether the collecting was worth it. So one card, in two parts,
	   with the seam between them named rather than hidden.

	   Every figure below is measured rather than claimed. The archive numbers
	   are read off the running box (`ssh phobos`, 2026-09-01, 18 retained days);
	   the strategy numbers are from `intraday/REPORT.md` and the equity curve is
	   the backtest's own hourly P&L, resampled weekly — see the note under it. */

	/* The card is mounted whether or not it is open — a shut fold is clipped,
	   not unmounted — so the live tape needs to be told, or it holds a socket
	   open for a card nobody is reading. */
	let { open = false } = $props();

	/* Whichever number a reader takes away, it should be one of these four. */
	const HEADLINE = [
		{ figure: '11.5M', unit: 'rows/day', note: 'archived off 10 venue feeds since August 2026' },
		{ figure: '583', unit: 'streams', note: '100 base assets, 6 exchanges, spot, perp and options' },
		{ figure: '2.39', unit: 'net Sharpe', note: '6.5y backtest net of a size-dependent cost model. Walk-forward is 1.08' },
		{ figure: '15.2', unit: '× equity', note: '2020-01 to 2026-06, with a −16.7% worst drawdown' }
	];

	/* The path a trade takes from a socket to a research panel. Five stages
	   because that is how many there are — each is a separate process with its
	   own failure mode, and the figure under each is what it costs. */
	const PIPELINE = [
		{
			name: 'Venues',
			icon: 'globe',
			detail: '10 feeds, 6 exchanges',
			figure: 'Binance UM and spot, Bybit, OKX, Coinbase, Hyperliquid, Deribit. Perp, spot and option chains'
		},
		{
			name: 'Capture',
			icon: 'cubes',
			detail: 'websockets, 2 shards',
			figure: 'One event loop per shard over disjoint venues; REST pollers for open interest. Writes JSONL and never blocks on the archive'
		},
		{
			name: 'WAL',
			icon: 'database',
			detail: '~16 GB/day, transient',
			figure: 'One file per stream per UTC hour on NVMe. 98% of it is the raw trade tape'
		},
		{
			name: 'Compact',
			icon: 'adjustments',
			detail: '→ ~108 MB/day, permanent',
			figure: 'Daily job folds the tape to a footprint and writes Parquet at zstd-19. Its own container, pinned so it cannot stall a socket'
		},
		{
			name: 'Read back',
			icon: 'chart',
			detail: 'Polars + FastAPI',
			figure: 'Panels straight off Parquet: price, OI, funding, spot and futures CVD, liquidations, options OI, aggregated across any subset of venues'
		}
	];

	/* Rows/day are the 18 retained days divided out, not a design target. */
	const STREAMS = [
		{ name: 'footprint', what: 'the trade tape, folded to volume-at-price per minute', rows: '10.1M' },
		{ name: 'mark', what: 'mark / index price and funding, sampled to the minute', rows: '460k' },
		{ name: 'oi', what: 'open interest, polled every minute', rows: '454k' },
		{ name: 'bar', what: '1-minute klines, as the venue publishes them', rows: '449k' },
		{ name: 'liq', what: 'forced liquidations, per event', rows: '26k' },
		{ name: 'optrade / opt / optoi', what: 'option prints, surface and open interest', rows: '40k' },
		{ name: 'clock / conn / error', what: 'chrony offset, socket lifecycle, every failure', rows: '9k' }
	];

	/* The three claims an engineer would want evidence for before believing any
	   of the numbers above. */
	const ENGINEERING = [
		{
			icon: 'shield',
			term: 'Correctness is checked, not assumed',
			points: [
				'70 offline tests plus 10 stress scenarios: kill the compactor mid-write, replay a venue, drift the clock.',
				'Every price, size and OI sits on one 1e-8 integer grid, and the footprint sums back to the venue’s own published minute volume (21.24 against 21.27 BTC).'
			]
		},
		{
			icon: 'pulse',
			term: 'It is operated, not just deployed',
			points: [
				'Blue/green rollout: the new colour must produce a row on every feed before the old one is stopped.',
				'Across 18 retained days, 1,064 socket drops and 10,190 DNS failures were absorbed without losing a row. The failure that did stop collection was a different kind, and it has its own section below.'
			]
		},
		{
			icon: 'adjustments',
			term: 'It fits the hardware it runs on',
			points: [
				'A second-hand i5-6600T with 4 cores and 8 GB, shared with everything else on the box.',
				'Capture is one event loop, so it is bounded by one core. The ceiling moves by adding a shard, and collectors are pinned to cores 0 and 1 by cpuset.'
			]
		}
	];

	/* The book that came out of it, against the one it started as. */
	const RESULTS = [
		{ label: 'Net annual', base: '32.6%', now: '43.5%' },
		{ label: 'Net Sharpe', base: '1.93', now: '2.39' },
		{ label: 'Max drawdown', base: '−21.2%', now: '−16.7%' },
		{ label: 'Calmar', base: '1.54', now: '2.60' },
		{ label: 'Turnover', base: '55×/yr', now: '27.7×/yr' },
		{ label: 'Equity, 6.5y', base: '7.59×', now: '15.16×' }
	];

	/* The tests that would have caught a fake result. Every one was run on the
	   final configuration, not on the version that happened to pass. */
	const FALSIFICATION = [
		{ test: 'Shuffle the signal across names', value: '−0.39', reading: 'the edge is the signal, not the weighting' },
		{ test: 'Deliberate lookahead', value: '8.73', reading: 'time alignment is correct' },
		{ test: 'Fill a full day late', value: '2.29', reading: 'no dependence on execution speed' },
		{ test: 'Survivors only', value: '2.22', reading: 'worse, so no survivorship inflation' },
		{ test: 'Inverted signal', value: '−2.74', reading: 'mirrors symmetrically' },
		{ test: 'Out-of-sample, 2024+', value: '4.22', reading: 'Calmar, against 2.32 in-sample' }
	];

	/* The negative results. They are here because they are the part of the work
	   that decides whether the positive one is believable. */
	const REJECTED = [
		{
			term: 'Funding-dispersion carry',
			verdict: 'dead',
			text: 'Long the cheapest funding, short the dearest. Sharpe 0.65 full-sample, but that is 2020–21 in disguise, and −1.13 since 2025. The long leg collects 188% annualised to hold names falling 238%, which is textbook adverse selection.'
		},
		{
			term: '8h cross-sectional reversal',
			verdict: 'not tradeable',
			text: 'Rank IC +3.5 at t = 15, and a dollar long-short spread of t = −0.83. The top and bottom 1% of name-bars own +733% and −519% of the leg’s P&L, so the signal ranks the median correctly while P&L pays the mean.'
		},
		{
			term: 'Fast unpriced-flow variants',
			verdict: 'arbitraged away',
			text: 'Gross Sharpe 1.49 full-sample at 6h formation, and entirely 2021. Gross −0.28 across 2024–25.'
		},
		{
			term: 'Six conventional risk overlays',
			verdict: 'rejected on measurement',
			text: 'Vol targeting, a trend overlay, dispersion gating, a de-grossing cap, a drawdown circuit breaker. Five of six lowered Calmar, because they cut drawdown by cutting the strategy. What worked instead was structural: hold twice as long, ensemble the formation window, drop inverse-vol weighting.'
		}
	];

	const LIMITS = [
		{ term: 'No alerting', text: 'Prometheus scrapes every 15 seconds and holds no alert rules, so a stopped stream is visible rather than announced. That is how the August gap ran to six days. The dead-man switch restarts a silently dead container, but nothing pages a human when the host-side dependency is what died.' },
		{ term: 'One box, no replica', text: 'the permanent Parquet is 108 MB a day, and the only off-box copy is one snapshot taken by hand. It is the irreplaceable half, and the next thing to fix.' },
		{ term: 'The backtest is single-venue', text: 'Binance only. The archive is the fix in progress, but it holds weeks of history rather than years, so it cannot backtest anything yet.' },
		{ term: 'The edge has thinned', text: '2021 Sharpe 2.99 against 0.99 across 2024–25. The planning number is the walk-forward 1.08, not the headline.' },
		{ term: 'No live track record', text: 'a paper-trading harness exists, with five books from $1k to $1m and no API keys anywhere, but it has not run long enough to mean anything. Impact is modelled with a square-root law rather than measured, so capacity beyond about $50m is an estimate.' }
	];

	/* Measured over 149,059 samples taken every 10 seconds by `archive.cli
	   watch` — 23 days of the running box, not a benchmark run for the
	   occasion. p99 is the number that decides whether a machine copes. */
	const MEASURED = [
		{ metric: 'Ingest rate', p50: '635 rows/s', p95: '1,664', p99: '2,801', note: 'across 583 venue-symbol streams' },
		{ metric: 'Wire delay', p50: '142 ms', p95: '166', p99: '237', note: 'venue timestamp to local receipt, clock-corrected' },
		{ metric: 'Writer lag', p50: '1.0 ms', p95: '1.3', p99: '1.9', note: 'the socket path never waits on the disk' },
		{ metric: 'WAL growth', p50: '164 KB/s', p95: '432', p99: '729', note: 'about 14 GB a day of raw tape' },
		{ metric: 'Collector RSS', p50: '343 MB', p95: '472', p99: '477', note: 'both shards, against a 512 MB limit each' }
	];

	/* What one day of one stream looks like on disk, and what the file is made
	   of. Both read off the running store. */
	/* The rules an adapter has to satisfy before its rows are allowed in. */
	const CONTRACT = [
		{ term: 'One time axis', text: '`ts_exchange` in UTC milliseconds is canonical, taken from the venue’s own event time rather than the receipt time. `recv_delay_ms` carries the difference, which delta-encodes to about two bytes.' },
		{ term: 'Never floats', text: 'price is an integer count of 1e-8 units on a fixed global scale. Quantity is an integer count of the instrument’s own stepSize, resolved from a registry, so a tick-size change is a registry event rather than an archive migration.' },
		{ term: 'Normalised enums', text: 'aggressor side, liquidation status and stream names are the archive’s vocabulary, not each venue’s. A venue’s spelling of a base asset is resolved from its instrument listing at connect time.' },
		{ term: 'Keys, and where there are none', text: 'each stream declares the natural key two collectors would agree on, so the blue/green overlap deduplicates exactly. `liq` declares none, because it carries no id and two liquidations can legitimately share every field, so both copies are kept. A duplicate is recoverable and a dropped row is not.' }
	];

	/* The partition list is the incident report: 08-17 to 08-22 is simply not
	   there, and no amount of later work can put it back. */
	const DAYS = [
		{ day: '08-08', rows: 12.0 }, { day: '09', rows: 13.2 }, { day: '10', rows: 12.4 },
		{ day: '11', rows: 10.2 }, { day: '12', rows: 9.4 }, { day: '13', rows: 9.4 },
		{ day: '14', rows: 10.8 }, { day: '15', rows: 7.9 }, { day: '16', rows: 6.4 },
		{ day: '17', rows: 0 }, { day: '18', rows: 0 }, { day: '19', rows: 0 },
		{ day: '20', rows: 0 }, { day: '21', rows: 0 }, { day: '22', rows: 0 },
		{ day: '23', rows: 4.9 }, { day: '24', rows: 15.2 }, { day: '25', rows: 12.9 },
		{ day: '26', rows: 10.4 }, { day: '27', rows: 11.1 }, { day: '28', rows: 10.9 },
		{ day: '29', rows: 7.0 }, { day: '30', rows: 8.2 }, { day: '31', rows: 9.2 }
	];

	/* What the whole thing costs to run, in the two currencies that matter. */
	const COST = [
		{ label: 'Permanent storage', value: '≈ 39 GB/yr', note: '108 MB a day. The unfolded tape would be ~5.8 TB a year' },
		{ label: 'Same year on S3 Standard', value: '$0.90/mo', note: 'against about $134/mo for the raw tape, at $0.023/GB-month. The fold is the cost decision' },
		{ label: 'Processor draw', value: '3.1 W', note: 'package plus DRAM, 7-day average by RAPL, 14.3 W at peak' },
		{ label: 'Cloud bill', value: '£0', note: 'one second-hand desktop, and an NVMe with 32 days of tape headroom if compaction ever stopped' }
	];

	/* --- the live tape ---------------------------------------------------- */

	/* A real public trade feed, read straight from the browser. Not a claim that
	   this is the archive's own tape: that one is on a box at home and is not
	   served publicly, and this is the same shape of row arriving at the same
	   rate. Connected only while the card is open. */
	const TICKER_SYMBOLS = [
		'btc', 'eth', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'trx', 'avax', 'dot',
		'link', 'matic', 'ton', 'shib', 'ltc', 'bch', 'uni', 'atom', 'xlm', 'etc',
		'fil', 'apt', 'arb', 'op', 'near', 'vet', 'icp', 'hbar', 'inj', 'rune',
		'algo', 'sand', 'mana', 'aave', 'grt', 'eos', 'ftm', 'xtz', 'theta', 'axs',
		'egld', 'flow', 'chz', 'kava', 'zec', 'enj', 'dash', 'comp', 'snx', 'crv'
	];
	const TICKER_STREAM = `wss://stream.binance.com:9443/stream?streams=${TICKER_SYMBOLS.map(
		(symbol) => `${symbol}usdt@trade`
	).join('/')}`;

	let ticks = $state([]);

	/* The connection's own state, read by the tag's dot and the live region
	   below it — separate from `ticks`, which only says whether a trade has
	   arrived yet, not why one hasn't. 'failed' is reachable now: Binance is
	   blocked on a fair number of corporate and institutional networks, and a
	   box that retries forever looks identical to one that is simply broken. */
	let connection = $state('connecting'); // 'connecting' | 'open' | 'failed'
	const MAX_ATTEMPTS = 4;

	$effect(() => {
		if (!open) return;

		let socket;
		let torndown = false;
		let attempts = 0;
		connection = 'connecting';

		const connect = () => {
			socket = new WebSocket(TICKER_STREAM);
			socket.onopen = () => {
				attempts = 0;
				connection = 'open';
			};
			socket.onmessage = (event) => {
				const { data } = JSON.parse(event.data);
				ticks = [
					{
						id: `${data.s}-${data.t}`,
						symbol: data.s.replace('USDT', '/USDT'),
						side: data.m ? 'sell' : 'buy',
						price: Number(data.p),
						qty: Number(data.q),
						time: data.T
					},
					...ticks
				].slice(0, 14);
			};
			/* The feed drops a connection now and then; reconnect a few times
			   rather than leaving a shut-looking box up for the rest of the
			   visit — but not forever, or a genuinely blocked network never
			   learns it's blocked and keeps waiting on a box that says
			   "connecting…" until the visitor leaves the page. */
			socket.onclose = () => {
				if (torndown) return;
				attempts += 1;
				if (attempts >= MAX_ATTEMPTS) {
					connection = 'failed';
					return;
				}
				setTimeout(connect, 3000);
			};
		};
		connect();

		return () => {
			torndown = true;
			socket.close();
			ticks = [];
			connection = 'connecting';
		};
	});
</script>

<!-- The heading of a block: which half of the project it belongs to, and what
     it is. The part tag is the study's own navigation — there are two tracks
     here and a reader should always know which one they are on. -->
{#snippet head(part, title, lede)}
	<div class="lede">
		<span class="track" class:research={part === 'alpha'}>{part}</span>
		<h4>{title}</h4>
		{#if lede}<p class="prose">{lede}</p>{/if}
	</div>
{/snippet}

<div class="study">
	<!-- The thesis, and the four figures that stand behind it. -->
	<section class="box banner">
		<div>
			<p class="thesis">
				Order flow cannot be backfilled. A trade print, a liquidation or an
				open-interest tick exists only if something was listening at the time, and the
				vendors that sell them retain days rather than years. So I built the thing that
				listens, and the research that reads it back.
			</p>
			<p class="prose">
				Two halves of one machine. A multi-venue collector has been running on my own
				hardware since August 2026, with one six-day gap that has its own section below.
				A cross-sectional strategy study on 6.5 years of Binance history decides whether
				any of it is worth trading, and it is why the collector exists.
			</p>
		</div>

		<div class="headline">
			{#each HEADLINE as item (item.unit)}
				<div class="figure">
					<strong>{item.figure}<span class="unit">{item.unit}</span></strong>
					<span class="note">{item.note}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- PART ONE — the collector. -->
	<section class="box">
		{@render head(
			'archive',
			'The pipeline',
			'A socket to a research panel, in five processes. Each stage is separate so that none can stall the one in front of it, because the tape has to be written whatever compaction is doing.'
		)}

		<div class="pipeline">
			{#each PIPELINE as stage, s (stage.name)}
				{#if s}<span class="arrow" aria-hidden="true">⟶</span>{/if}
				<div class="stage">
					<span class="mark"><Icon name={stage.icon} /></span>
					<strong>{stage.name}</strong>
					<span class="stage-detail">{stage.detail}</span>
					<span class="note">{stage.figure}</span>
				</div>
			{/each}
		</div>

		<p class="foot-note">
			The raw tape is about 150× the size of what is kept. Folding it to a per-minute
			footprint, with volume-at-price and buys and sells separated, holds the shape OHLCV
			cannot express at all. It costs the individual print sizes and their ordering, which
			is the one deliberate loss in the archive, and Binance publishes the full tape if it
			is ever wanted back.
		</p>

		<div class="costs">
			{#each COST as item (item.label)}
				<div class="cost">
					<span class="scope">{item.label}</span>
					<strong>{item.value}</strong>
					<span class="note">{item.note}</span>
				</div>
			{/each}
		</div>

		<p class="foot-note">
			The S3 line is arithmetic on the published rate rather than a bill I pay, since the
			archive lives on the box. It is the clearest way to say what the fold is worth: a
			day I keep costs about three pence a year to store, and the same day unfolded would
			cost four pounds.
		</p>
	</section>

	<!-- What arrives, and what it looks like arriving. -->
	<section class="box row">
		<div class="capture">
			{@render head('archive', 'What it captures', null)}

			<table class="streams">
				<thead>
					<tr><th scope="col">Stream</th><th scope="col">What it is</th><th scope="col">Rows/day</th></tr>
				</thead>
				<tbody>
					{#each STREAMS as stream (stream.name)}
						<tr>
							<th scope="row">{stream.name}</th>
							<td>{stream.what}</td>
							<td class="rows">{stream.rows}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<p class="foot-note">
				Collection is deliberately broad and mechanical. 100 base assets, with every
				venue’s own spelling of them resolved from its instrument listing at connect
				time. What to trade is a question you answer by querying the archive afterwards,
				rather than by filtering what gets written.
			</p>
		</div>

		<div class="tape">
			<span class="tag"><i class="dot" class:down={connection !== 'open'} aria-hidden="true"></i>Live trades · public feed</span>

			<!-- Announced once, on a real state change — not per trade, which
			     arrives several times a second and would spam a screen reader.
			     The table below carries no aria-live for the same reason: it is
			     not meant to be read out row by row as it scrolls. -->
			<p class="sr-only" role="status" aria-live="polite">
				{connection === 'open'
					? 'Connected. Live trades below.'
					: connection === 'failed'
						? "Binance's public feed is unreachable from this network — it's blocked in some regions and on many corporate networks."
						: 'Connecting to the public trade feed…'}
			</p>

			{#if ticks.length}
				<table class="tape-table">
					<thead>
						<tr><th>Symbol</th><th>Side</th><th>Price</th><th>Size</th><th>Time</th></tr>
					</thead>
					<tbody>
						{#each ticks as tick (tick.id)}
							<tr>
								<td class="tsymbol">{tick.symbol}</td>
								<td class="tside" class:sell={tick.side === 'sell'}>{tick.side}</td>
								<td class="tprice" class:sell={tick.side === 'sell'}>{tick.price.toFixed(2)}</td>
								<td>{tick.qty.toFixed(4)}</td>
								<td>{new Date(tick.time).toLocaleTimeString()}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if connection === 'failed'}
				<Placeholder note="feed unreachable from this network" lines={6} />
			{:else}
				<Placeholder note="connecting…" lines={6} />
			{/if}
			<p class="note">
				A public Binance feed, read straight from your browser. The archive’s own tape is
				not served publicly, but this is the same shape of row at the same rate: about
				16 GB a day across 583 streams.
			</p>
		</div>
	</section>

	<!-- Why the numbers above should be believed. -->
	<section class="box">
		{@render head('archive', 'Running it is the hard part', 'Collecting for an hour is a script. Collecting for months, unattended, on hardware that is also doing something else, is the engineering.')}

		<div class="cards">
			{#each ENGINEERING as card (card.term)}
				<div class="card-item">
					<span class="mark"><Icon name={card.icon} /></span>
					<strong>{card.term}</strong>
					<ul>
						{#each card.points as point (point)}<li>{point}</li>{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- The claims above, with their measurements. -->
	<section class="box">
		{@render head(
			'archive',
			'What it actually does, measured',
			'Every ten seconds a watcher writes a row of throughput, wire delay, writer lag, memory and disk. This is 149,059 of those rows, covering 23 days of the running box. Percentiles rather than averages, because the p99 decides whether a machine copes.'
		)}

		<table class="measured">
			<thead>
				<tr>
					<th scope="col"></th><th scope="col">p50</th><th scope="col">p95</th><th scope="col">p99</th><th scope="col"></th>
				</tr>
			</thead>
			<tbody>
				{#each MEASURED as row (row.metric)}
					<tr>
						<th scope="row">{row.metric}</th>
						<td class="num">{row.p50}</td>
						<td class="num">{row.p95}</td>
						<td class="num">{row.p99}</td>
						<td class="reading">{row.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<p class="foot-note">
			The lag row is the one that matters structurally. Capture writes JSONL and never
			blocks on the archive, so the p99 wait between a row arriving and being written is
			1.9 ms and IO pressure sits at zero. CPU says the same thing from the other side: the
			two pinned cores run at 28% and 32% while the two the archive cannot touch run at 3%.
		</p>
	</section>

	<!-- Where the rows go, and what an adapter has to satisfy to write one. -->
	<section class="box row">
		<div>
			{@render head('archive', 'The write contract', 'Eleven streams, one Parquet file per stream per UTC day in Hive-style date partitions at zstd-19. Before any of its rows are allowed in, a venue adapter has to satisfy four rules.')}
			<p class="foot-note">
				A day of footprint is 7.0M to 15.2M rows and 37 to 116 MB. Partition keys live in
				the path rather than as columns, so nothing pays to store the stream and the date
				a second time on every row.
			</p>
		</div>

		<dl class="terms contract">
			{#each CONTRACT as item (item.term)}
				<div><dt>{item.term}</dt><dd>{item.text}</dd></div>
			{/each}
		</dl>
	</section>

	<!-- The gap, and why it is still there. -->
	<section class="box">
		{@render head(
			'archive',
			'The six days that are missing',
			'Live capture is the one kind of data engineering with no backfill. The research half can re-download six and a half years from a public archive whenever it likes. This half has exactly what it was listening for at the time.'
		)}

		<div class="days">
			{#each DAYS as day (day.day)}
				<div class="day" class:empty={!day.rows}>
					<span class="day-bar"><i style="height: {(day.rows / 15.2) * 100}%"></i></span>
					<span class="day-label">{day.day}</span>
				</div>
			{/each}
		</div>
		<span class="days-caption">footprint rows per daily partition, millions · August 2026</span>

		<div class="incident">
			<div>
				<span class="scope">what happened</span>
				<p class="prose">
					The box rebooted on 17 August. The chrony sampler that feeds the archive its
					clock stream runs on the host rather than in the container, because chronyd
					binds loopback in the host namespace. It is a systemd <em>user</em> unit, and
					those do not come back after a reboot unless lingering is enabled for the
					account. It did not come back.
				</p>
			</div>
			<div>
				<span class="scope">what the collector did</span>
				<p class="prose">
					Refused to start. It will not write rows it cannot timestamp against a clock
					sample newer than 60 seconds, so it failed closed rather than filling the
					archive with data of unknown time quality. I would choose that again. The cost
					is a hole, and the alternative is a subtly wrong archive that looks complete.
				</p>
			</div>
			<div>
				<span class="scope">why it lasted six days</span>
				<p class="prose">
					Nothing was watching the watcher. Prometheus scrapes the host every 15 seconds
					and holds no alert rules, so the dead stream sat visible on a dashboard nobody
					was looking at. Enabling lingering on 23 August fixed it, and the sampler has
					been up since. The alerting gap is named in the limits below rather than
					quietly closed.
				</p>
			</div>
		</div>
	</section>

	<!-- Read back: the archive as a chart, and the pipeline it fed first. -->
	<section class="box">
		<div>
			{@render head('archive', 'Read back', 'Every pane is built from captured rows and aggregated across whichever venues are ticked. It is the same view a commercial terminal sells, off my own data.')}
			<p class="foot-note">
				Below it, the earlier bar-level pipeline this grew out of: five exchanges
				aggregated in one call, with CVD reconstructed as a continuous series and funding
				smoothed from the premium index rather than shown as delayed settlement steps. The
				second image is the pane-by-pane comparison against velo.xyz.
			</p>
		</div>

		<div class="shots">
			<figure>
				<img src="/projects/orderflow.png" alt="Order-flow viewer reading the archive" loading="lazy" decoding="async" />
				<figcaption>Price, OI, funding, spot and futures CVD, liquidations and options OI, per venue, off Parquet</figcaption>
			</figure>
			<figure>
				<img src="/projects/orderflow-velo.png" alt="Four-exchange aggregation against velo.xyz" loading="lazy" decoding="async" />
				<figcaption>Mine on the left against velo.xyz on the right, four exchanges aggregated over the same window</figcaption>
			</figure>
		</div>
	</section>

	<!-- PART TWO — the research. -->
	<section class="box">
		{@render head(
			'alpha',
			'The strategy',
			'A market-neutral cross-sectional book on Binance perpetuals. The signal is exchange-reported taker-buy share, so aggressive flow is measured rather than inferred from a tick rule. Averaged over a week, held for two.'
		)}

		<div class="research">
			<OrderflowEquityChart />

			<table class="results">
				<thead>
					<tr>
						<th scope="col"></th>
						<th scope="col">First book</th>
						<th scope="col">Re-engineered</th>
					</tr>
				</thead>
				<tbody>
					{#each RESULTS as row (row.label)}
						<tr>
							<th scope="row">{row.label}</th>
							<td>{row.base}</td>
							<td class="now">{row.now}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="foot-note">
			The second column is not a risk overlay bolted onto the first. Holding 336h instead
			of 168h halves turnover while the impulse response is still positive, ensembling the
			formation window removes a parameter choice, and equal weighting stops the book
			spending risk on low-volatility names that earn nothing here. Positive in every one
			of seven calendar years, at +0.08 correlation to BTC.
		</p>
	</section>

	<!-- The part that decides whether any of the above is real. -->
	<section class="box row">
		<div>
			{@render head('alpha', 'How it was falsified', 'Each of these is a way the result could have been an artifact. All were run on the final configuration, not on the version that happened to survive them.')}
			<p class="foot-note">
				The delayed fill matters most. A strategy whose edge disappears when you fill a
				day late is measuring bid-ask bounce rather than information, and this one is
				unchanged. Three more sit behind the table: a deflated Sharpe against 500 trials
				(p = 0.9998), a block bootstrap with a 90% CI of [1.24, 2.65], and a delisting
				shock forcing all 144 delisted names to −90% on their final bar, which moved
				Sharpe from 1.930 to 1.917.
			</p>
		</div>

		<table class="falsify">
			<tbody>
				{#each FALSIFICATION as row (row.test)}
					<tr>
						<th scope="row">{row.test}</th>
						<td class="value" class:negative={row.value.startsWith('−')}>{row.value}</td>
						<td class="reading">{row.reading}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<!-- The negative results, which are most of the work. -->
	<section class="box">
		{@render head('alpha', 'What was killed, and by what', 'Four hypotheses that looked good enough to build. Each was rejected by a specific measurement rather than abandoned.')}

		<div class="rejected">
			{#each REJECTED as item (item.term)}
				<div class="reject">
					<div class="reject-head">
						<strong>{item.term}</strong>
						<span class="verdict">{item.verdict}</span>
					</div>
					<p class="prose">{item.text}</p>
				</div>
			{/each}
		</div>

		<p class="foot-note">
			The lesson that cost the most time is that rank IC and dollar P&L can disagree in
			sign. A signal with t = 22 on rank IC produced a portfolio with t = −0.8. Any
			research process that stops at IC will ship strategies that lose money.
		</p>
	</section>

	<!-- Where it actually stands. -->
	<section class="box row">
		<div>
			{@render head('alpha', 'Status and limits', null)}
			<p class="prose">
				The archive has been live since 2026-08-04. The research is at the end of its
				validation phase: the book is specified, falsified and packaged for paper trading,
				and it has no live track record. These are the things I would want asked about it.
			</p>
		</div>

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

<style>
	/* .study, .box, .lede, .thesis, .prose, .foot-note, .arrow, .row, .intro,
	   .spec, .limits, .card-item, .scope, .mark, .headline and .figure are
	   shared across all four studies (app.css) — this file only keeps its
	   own tracks' colours and each shared part's local delta. */
	.study {
		/* Mixed dark enough to be read as text on the white card: the site's
		   own violet and azure are set for a black page and are a wash on
		   this one. Clears 4.5:1 on this ground, which plain --violet
		   (3.44:1) did not. */
		--ink-azure: var(--azure-ink);
		--ink-violet: var(--violet-ink);
	}

	/* A column of a split row holds a heading and whatever qualifies it, and
	   they are not one block: without this the foot-note runs straight on from
	   the paragraph above it. */
	.row > div {
		display: grid;
		align-content: start;
		gap: 0.6rem;
	}

	/* A hair wider than the shared gap: this study's ledes carry more text. */
	.lede {
		gap: 0.4rem;
	}

	/* Which half of the project a block belongs to. The study has two tracks
	   running through it and the tag is how a reader keeps their place — the
	   collector in one colour, the research it feeds in the other. */
	.track {
		justify-self: start;
		padding: 0.15rem 0.5rem;
		border: 1px solid currentcolor;
		border-radius: 999px;
		color: var(--ink-azure);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.track.research {
		color: var(--ink-violet);
	}

	.note {
		display: block;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.5;
	}

	.mark {
		font-size: var(--fs-xl);
	}

	.mark.warn {
		/* -ink: this icon is on the study's light ground and plain --amber
		   measures 1.75:1 there. */
		color: var(--amber-ink);
		font-size: var(--fs-base);
	}

	/* --- the banner ------------------------------------------------------- */

	.banner {
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 1.75rem;
		align-items: center;
	}

	.banner > div:first-child {
		display: grid;
		gap: 0.6rem;
	}

	.figure strong {
		color: var(--color-foreground);
		font-size: var(--fs-lg);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.figure .unit {
		margin-left: 0.3em;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.34em;
		font-weight: 500;
		letter-spacing: 0;
	}

	/* --- the pipeline ----------------------------------------------------- */

	/* Left to right, never wrapped — an arrow is its own box, so a wrapped row
	   strands the arrow that led to the stage below it. */
	.pipeline {
		display: flex;
		flex-wrap: nowrap;
		align-items: stretch;
		gap: 0.5rem;
		overflow-x: auto;
	}

	/* Wider than the shared card: this pipeline's stage names run longer. */
	.stage {
		min-width: 8.5rem;
	}

	.stage-detail {
		color: var(--ink-azure);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	/* --- what it captures ------------------------------------------------- */

	.capture {
		display: grid;
		gap: 0.8rem;
	}

	.streams,
	.falsify,
	.results {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	.streams th,
	.streams td,
	.falsify th,
	.falsify td,
	.results th,
	.results td {
		padding: 0.4rem 0.6rem 0.4rem 0;
		font-weight: 400;
		text-align: left;
		vertical-align: top;
	}

	.streams thead th,
	.results thead th {
		padding-top: 0;
		color: var(--text-faint);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-size: var(--fs-3xs);
		border-bottom: 1px solid var(--color-border);
	}

	.streams tbody th,
	.falsify tbody th,
	.results tbody th {
		color: var(--color-foreground);
		font-weight: 600;
	}

	.streams tbody td,
	.falsify .reading {
		color: var(--text-dim);
	}

	.streams tbody tr + tr th,
	.streams tbody tr + tr td,
	.falsify tr + tr th,
	.falsify tr + tr td,
	.results tbody tr + tr th,
	.results tbody tr + tr td {
		border-top: var(--rule);
	}

	.rows {
		text-align: right;
		white-space: nowrap;
		color: var(--color-foreground);
	}

	/* --- the live tape ---------------------------------------------------- */

	/* A window into a real feed, dark like the instrument it is, rather than a
	   panel of this card. */
	.tape {
		display: grid;
		align-content: start;
		gap: 0.55rem;
		padding: 0.85rem;
		border-radius: var(--radius-panel);
		background: var(--color-background);
	}

	.tape .tag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: #a09f98;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.tape .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--mint);
		box-shadow: 0 0 0.5rem var(--mint);
	}

	/* Connecting or failed both read as "not lit" — the live region above and
	   the placeholder below already say which. */
	.tape .dot.down {
		background: var(--coral);
		box-shadow: 0 0 0.5rem var(--coral);
	}

	.tape-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	.tape-table th,
	.tape-table td {
		padding: 0.25rem 0.5rem 0.25rem 0;
		font-weight: 400;
		text-align: left;
	}

	.tape-table thead th {
		padding-top: 0;
		padding-bottom: 0.35rem;
		color: #a09f98;
		font-weight: 500;
		border-bottom: 1px solid var(--border);
	}

	.tape-table tbody tr + tr td {
		border-top: 1px solid var(--border);
	}

	.tsymbol {
		color: var(--foreground);
		font-weight: 500;
	}

	.tside,
	.tprice {
		color: var(--mint);
	}

	.tside.sell,
	.tprice.sell {
		color: var(--coral);
	}

	.tside {
		text-transform: capitalize;
	}

	/* --- the engineering cards -------------------------------------------- */

	.cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.card-item strong {
		color: var(--color-foreground);
		font-size: var(--fs-xs);
		font-weight: 700;
		line-height: 1.4;
	}

	.card-item ul {
		display: grid;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card-item li {
		position: relative;
		padding-left: 0.85rem;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.55;
	}

	.card-item li::before {
		position: absolute;
		left: 0;
		/* -ink: this bullet is on the study's light ground and plain --mint
		   measures 1.68:1 there. */
		color: var(--mint-ink);
		content: '—';
	}

	/* --- the screenshots -------------------------------------------------- */

	.shots {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.9rem;
		align-items: start;
	}

	.shots figure {
		margin: 0;
	}

	.shots img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.shots figcaption {
		margin-top: 0.35rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.5;
	}

	/* --- the equity curve ------------------------------------------------- */

	.research {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	.results .now {
		color: var(--ink-violet);
		font-weight: 600;
	}

	.results td {
		text-align: right;
		white-space: nowrap;
	}

	.results thead th:not(:first-child) {
		text-align: right;
	}

	/* --- the measured table ------------------------------------------------ */

	.measured {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	.measured th,
	.measured td {
		padding: 0.4rem 0.6rem 0.4rem 0;
		font-weight: 400;
		text-align: left;
		vertical-align: top;
	}

	.measured thead th {
		padding-top: 0;
		color: var(--text-faint);
		font-size: var(--fs-3xs);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-align: right;
		border-bottom: 1px solid var(--color-border);
	}

	.measured thead th:first-child,
	.measured thead th:last-child {
		text-align: left;
	}

	.measured tbody th {
		color: var(--color-foreground);
		font-weight: 600;
		white-space: nowrap;
	}

	/* The three percentile columns are read down as one figure, so they are
	   right-aligned against each other rather than against their headings. */
	.measured .num {
		color: var(--color-foreground);
		text-align: right;
		white-space: nowrap;
	}

	.measured .reading {
		padding-left: 1.2rem;
		color: var(--text-dim);
	}

	.measured tbody tr + tr th,
	.measured tbody tr + tr td {
		border-top: var(--rule);
	}

	/* --- term lists ------------------------------------------------------- */

	/* A rule and its clause. Used for the partition layout and the contract,
	   which are the same shape of statement. */
	.terms {
		display: grid;
		gap: 0.55rem;
		margin: 0;
	}

	.terms div {
		display: grid;
		gap: 0.15rem;
	}

	.terms dt {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: 600;
	}

	.terms dd {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.6;
	}

	/* The contract is the stricter half, so it stands in a box of its own. */
	.contract {
		padding: 0.85rem 0.95rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
		background: color-mix(in srgb, var(--color-foreground) 2%, #fff);
	}

	/* --- the daily partitions --------------------------------------------- */

	/* One bar per daily partition. The six missing days are drawn as the empty
	   slots they are rather than closed up, because that is what the archive
	   looks like from the inside. */
	.days {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 0.25rem;
		align-items: end;
		height: 5rem;
	}

	.day {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.3rem;
		height: 100%;
	}

	.day-bar {
		display: flex;
		align-items: flex-end;
		height: 100%;
		border-bottom: 1px solid var(--color-border);
	}

	.day-bar i {
		display: block;
		width: 100%;
		background: var(--ink-azure);
	}

	.day.empty .day-bar {
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 3px,
			color-mix(in srgb, var(--coral) 35%, transparent) 3px,
			color-mix(in srgb, var(--coral) 35%, transparent) 4px
		);
	}

	.day-label {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		text-align: center;
	}

	.days-caption {
		display: block;
		margin-top: -0.4rem;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
	}

	/* Three columns of one story: what happened, what the software did about
	   it, and why it still took six days to notice. */
	.incident {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.incident > div {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	/* --- cost ------------------------------------------------------------- */

	.costs {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.cost {
		display: grid;
		align-content: start;
		gap: 0.2rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.cost strong {
		color: var(--color-foreground);
		font-size: var(--fs-lg);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	/* --- falsification ---------------------------------------------------- */

	.falsify .value {
		text-align: right;
		white-space: nowrap;
		color: color-mix(in srgb, var(--mint) 45%, #0b0b0b);
		font-weight: 600;
	}

	.falsify .value.negative {
		color: var(--text-dim);
	}

	/* --- the dead ends ---------------------------------------------------- */

	.rejected {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.reject {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-panel);
	}

	.reject-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}

	.reject-head strong {
		color: var(--color-foreground);
		font-size: var(--fs-xs);
		font-weight: 700;
	}

	/* The verdict, not the title: struck through the way the hypothesis was.
	   Both border and text read -ink, not plain --coral: this is the shared
	   light-ground token (app.css) now, same formula this file already had for
	   the text alone — the border was still plain coral, at 1.8:1 on white. */
	.verdict {
		padding: 0.1rem 0.45rem;
		border: 1px solid var(--coral-ink);
		border-radius: 999px;
		color: var(--coral-ink);
		font-family: var(--font-mono);
		font-size: var(--fs-3xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	/* --- limits ----------------------------------------------------------- */

	.limits li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.5rem;
		align-items: baseline;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-2xs);
		line-height: 1.6;
	}

	.limits strong {
		color: var(--color-foreground);
		font-weight: 600;
	}

	/* --- narrow ----------------------------------------------------------- */

	@media (max-width: 60rem) {
		.row,
		.banner,
		.research,
		.cards,
		.shots,
		.rejected,
		.incident,
		.costs {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Twenty-four bars will not divide a phone; the labels go and the
		   shape stays. */
		.day-label {
			display: none;
		}
	}
</style>
