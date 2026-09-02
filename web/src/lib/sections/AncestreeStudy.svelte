<script>
	import Icon from '$lib/components/Icon.svelte';

	/* Ancestree's own study. This one is a published library rather than a
	   system or a piece of research, so it is written as a datasheet: what it
	   is, what it costs, what it was measured at, and what it is not for. Every
	   figure comes from `docs/benchmarks/RESULTS.md` in the repo, which is the
	   output of two notebooks that run end to end in a temp directory — so any
	   number here can be re-run rather than taken on trust.

	   Measured on ancestree 0.2.0, Python 3.12.12, macOS arm64. Absolute times
	   are machine-specific; the ratios are what transfer. */

	const DEMO = 'https://js195.github.io/ancestree/assets/demo/interactive_pipeline.html';

	/* The line at the top of the page that says what this is in one command. */
	const SPEC = [
		{ label: 'version', value: '0.2.0' },
		{ label: 'python', value: '3.9 – 3.14' },
		{ label: 'dependencies', value: 'none' },
		{ label: 'license', value: 'MIT' },
		{ label: 'source', value: '4,700 lines' }
	];

	const HEADLINE = [
		{ figure: '3.93', unit: '×', note: 'less stored on a mixed 70 MB corpus, or 3.13× counting the whole database file' },
		{ figure: '136', unit: '×', note: 'faster on an identical rerun: 5.3 ms against a 720 ms cold write' },
		{ figure: '0.02', unit: 'ms', note: 'selective query, flat from 250 to 3,000 nodes' },
		{ figure: '975', unit: 'tests', note: '169 unit and 806 adversarial, written against the docs as a spec' }
	];

	/* What happens between your `with` block ending and the transaction
	   committing. The ms are per 4 MB of CSV, from the timing notebook. */
	const STAGES = [
		{ name: 'chunk', detail: 'Gear rolling hash finds content-defined boundaries', ms: 148.965 },
		{ name: 'compress', detail: 'zlib-6 on every chunk; a chunk that does not shrink is kept verbatim', ms: 147.81 },
		{ name: 'fingerprint', detail: 'super-features, so a delta base can be found without comparing every chunk to every other', ms: 17.15 },
		{ name: 'hash', detail: 'SHA-256 of each chunk’s plaintext, which is the content address', ms: 1.467 },
		{ name: 'delta', detail: 'zlib with the base chunk as preset dictionary, when it beats plain compression', ms: 0.806 }
	];

	/* Three layers, each catching what the one above it missed. */
	const LAYERS = [
		{
			name: 'Node reuse',
			scope: 'the whole step',
			text: 'A rerun whose step type, parents, metadata and artifact bytes are all identical rebinds onto the node that already exists. Nothing is stored and nothing is inserted.',
			figure: '136× faster',
			detail: '5.3 ms against a 720 ms cold write'
		},
		{
			name: 'Exact chunk dedup',
			scope: 'bytes, across artifacts',
			text: 'Artifacts are split into content-defined chunks addressed by SHA-256. A chunk already in the pool is a lookup rather than a write, so copying a dataset into three branches stores it once.',
			figure: '10 copies = 1',
			detail: 'ten 8 MB writes cost 8 MB, even on incompressible data'
		},
		{
			name: 'Delta storage',
			scope: 'near-duplicates',
			text: 'A chunk resembling one already stored is kept as a zlib delta against it, found through the resemblance index. Depth is capped at one, and a delta is only kept when it beats plain compression by a margin.',
			figure: '2.15× less',
			detail: 'for 1.15× the ingest time, which is why it defaults to on'
		}
	];

	/* The same 1% of bytes edited, in four different places. This is the spread
	   that a single headline ratio hides. */
	const PATTERNS = [
		{ name: 'insert', ratio: 23.19 },
		{ name: 'delete', ratio: 26.27 },
		{ name: 'append', ratio: 25.14 },
		{ name: 'scattered overwrite', ratio: 3.94 }
	];

	/* Three orders of magnitude apart, which is the only thing a caller has to
	   know to place a call correctly. */
	const COSTS = [
		{
			tier: 'Microseconds',
			note: 'put them anywhere',
			rows: [
				{ op: 'get(node_id)', ms: '0.011' },
				{ op: 'find(run_id=…) selective', ms: '0.020' },
				{ op: 'lineage(node)', ms: '0.103' }
			]
		},
		{
			tier: 'Milliseconds',
			note: 'fine per step, not per row',
			rows: [
				{ op: 'create_node, metadata only', ms: '8.4' },
				{ op: 'of which git provenance', ms: '7.3' },
				{ op: 'find() over 3,000 nodes', ms: '27.2' }
			]
		},
		{
			tier: 'Scales with your data',
			note: 'budget for it',
			rows: [
				{ op: 'ingest 4 MB of CSV', ms: '352' },
				{ op: 'export_metadata(), 3,000 nodes', ms: '515' },
				{ op: 'ingest a 48 MB artifact', ms: '5,009' }
			]
		}
	];

	/* The parts a data engineer would ask about before putting a store in a
	   pipeline: what is guaranteed, what is checked, and what runs on every
	   push. Coverage and the matrix are from the repo's own CI. */
	const SHIPPING = [
		{
			icon: 'shield',
			term: 'The contract is the format version',
			points: [
				'Every store stamps its format version at creation. Open checks it and refuses anything ancestree did not write, without touching the file.',
				'Ten structural keys are reserved, among them node_id, generation, healthy and content_hash, and add_meta raises rather than shadowing a fact lineage depends on.'
			]
		},
		{
			icon: 'adjustments',
			term: 'Quality is checked on the way out',
			points: [
				'Every chunk is re-hashed against its digest on read and every artifact against its own SHA-256, so silent corruption surfaces as an error rather than as data.',
				'Partial work is evidence. A step that raises is committed and flagged healthy=False, searchable with find(healthy=False).'
			]
		},
		{
			icon: 'cube',
			term: 'Every push, six Pythons',
			points: [
				'ruff, mypy --strict and pytest across 3.9 to 3.14, with 92.97% line coverage reported to Codecov.',
				'ruff is pinned to an exact version, because its default rule set widens between releases and would turn CI red without a code change.'
			]
		}
	];

	/* The defects an independent suite found by reading the documentation as a
	   specification. Two of them could lose data. */
	const DEFECTS = [
		{
			severity: 'High',
			term: 'compact() reclaimed one 4 KiB page per call',
			text: 'SQLite runs `incremental_vacuum` as a stepped statement and the cursor was never consumed, so CPython finalised it after a single step. No error, and an emptied store needed about 319 calls to release its space. Checkpointing the WAL first and then driving the pragma to exhaustion took 1,417,216 bytes on disk down to 114,688.'
		},
		{
			severity: 'High',
			term: '“Back it up by copying one file” silently backed up nothing',
			text: 'Under WAL journalling a live store is three files, and the committed data sat in the one the docs did not name. Copying `ancestree.db` out of an open store produced a valid, openable, empty store. Fixed with `store.backup()` on SQLite’s online backup API, counting the WAL in `stats()`, and correcting the documentation.'
		},
		{
			severity: 'Medium',
			term: 'Opening a store could delete another session’s in-flight node',
			text: 'The orphan-scratch sweep that runs on every open treated an unseeded directory as litter, and a node was created before it was seeded. The concurrent-write test hit it naturally. Each node is now assembled in a staging directory and renamed into place atomically, after which four processes can write with no coordination.'
		},
		{
			severity: 'Low',
			term: 'find(parent_id=…) matched nothing for a bare id',
			text: 'The value was iterated, so an 8-character node id became a list of eight characters and matched no node, returning an empty result rather than an error. Every other node-accepting method already resolved ids, records and handles interchangeably.'
		}
	];

	/* 0.1 was a directory per node with a hand-rolled index beside it. */
	const REWRITE = [
		{ change: 'Hand-rolled index, journal and reconcile pass', before: 'deleted', after: 'SQLite is the index' },
		{ change: 'Background packer and its fork handling', before: 'deleted', after: 'packed at block exit' },
		{ change: 'Average chunk size', before: '32 KiB', after: '16 KiB, 14% less stored and 22% faster' },
		{ change: 'Provenance capture', before: '3 git subprocesses', after: '2, concurrent, nodes 2.2× faster' },
		{ change: 'Chunker hot loop', before: '16.6 MB/s', after: '26.8 MB/s, boundaries identical' },
		{ change: 'Selective find over 3,000 nodes', before: '0.40 ms', after: '0.04 ms' }
	];

	const LIMITS = [
		{ term: 'Megabyte-scale', text: 'a 16 KiB artifact is roughly three times bigger in the store than as a plain file, because a database has pages and indexes whether you use them or not. The two ratios converge by a few megabytes.' },
		{ term: 'One writer', text: 'many readers, one writer, local disk only. SQLite locking over NFS is unreliable, and heavy parallel writing is not what this is for.' },
		{ term: 'No migrations, by design', text: 'a store records its format version and ancestree refuses anything it did not write. To read an old store, keep the version that wrote it. Every version stays on PyPI.' },
		{ term: 'One file is the whole store', text: 'there is no side index to rebuild, so a corrupt database is real data loss. WAL journalling, an integrity check and `meta.json` sidecars are the mitigations.' },
		{ term: 'Above 64 MiB', text: 'the chunker cuts at fixed offsets to keep huge ingests at C speed. Exact dedup survives, shift-resilience does not.' }
	];

	/* The bar chart's own scale: the widest stage is the full width, and every
	   other bar is read against it. */
	const slowest = Math.max(...STAGES.map((stage) => stage.ms));
	const widest = Math.max(...PATTERNS.map((pattern) => pattern.ratio));
</script>

<!-- A section's name, in the rail down the left of the study. A word rather
     than a number: this is a datasheet, and the sections are its headings. -->
{#snippet head(kicker, title, lede)}
	<div class="lede">
		<span class="kicker">{kicker}</span>
		<h4>{title}</h4>
		{#if lede}<p class="prose">{lede}</p>{/if}
	</div>
{/snippet}

<div class="study">
	<!-- What it is, in one command and four numbers. -->
	<section class="box banner">
		<div class="intro">
			<p class="thesis">
				Ten variations in, you are looking at <code>final_v2_REAL.csv</code> with no
				record of what produced it. MLflow solves this for ML teams willing to run a
				server. Outside that, the options are thin.
			</p>
			<p class="prose">
				Ancestree models a pipeline as a directed acyclic graph and puts nodes, metadata,
				lineage and artifact bytes in one SQLite file. No server, no dependencies, and no
				ontology of runs and experiments to translate your work into.
			</p>

			<code class="install">pip install ancestree-track</code>

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

	<!-- The API, which is the whole of the user-facing design. -->
	<section class="box row">
		<div>
			{@render head('interface', 'Four lines of yours, everything else recorded')}
			<p class="prose">
				Your code writes files at native speed into a scratch directory. At block exit the
				artifact is chunked, hashed, compressed and committed in one transaction. A step
				that raises keeps its partial output flagged <code>healthy=False</code>, a step
				that wrote nothing is discarded with a warning, and a run killed outright is
				adopted as an unhealthy node the next time the store opens.
			</p>
			<p class="foot-note">
				Rules are optional and enforced at creation rather than logged afterwards. Declare
				<code>rules={'{'}"model": ["clean"]{'}'}</code> and an illegal transition raises
				when it happens.
			</p>
		</div>

		<pre class="code"><code>{`store = ancestree.LineageStore(
    root="./my_project",
    rules={"clean": ["ingest"], "model": ["clean"]},
)

with store.create_node(step_type="ingest") as node:
    df = do_process()
    df.to_csv(node / "raw.csv")
    node.add_meta("rows", len(df))

store.find(accuracy=lambda a: a and a > 0.9)
store.lineage(best_model)      # full ancestry, oldest first
store.serve_graph()            # the explorer, on localhost`}</code></pre>
	</section>

	<!-- The ingest path, and where its time actually goes. -->
	<section class="box row">
		<div>
			{@render head(
				'ingest',
				'Where the time goes',
				'Five things happen to an artifact at block exit. Two of them are the entire budget.'
			)}
			<p class="foot-note">
				Chunking and compression are the whole budget, and hashing is free. The parameter
				that matters is average chunk size. At 32 KiB a delta base sits exactly on zlib’s
				32,256-byte dictionary window, so it cannot be seen in full and the tail of every
				delta degenerates to literals. Halving it to 16 KiB stores 14% less <em>and</em>
				ingests 22% faster.
			</p>
		</div>

		<div class="bars">
			<span class="bars-head">per 4 MB of CSV</span>
			{#each STAGES as stage (stage.name)}
				<div class="bar">
					<span class="bar-name">{stage.name}</span>
					<span class="bar-track"><i style="width: {(stage.ms / slowest) * 100}%"></i></span>
					<span class="bar-value">{stage.ms.toFixed(1)} ms</span>
					<span class="bar-detail">{stage.detail}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- The three layers, and the spread a single ratio hides. -->
	<section class="box">
		{@render head(
			'storage',
			'Three ways of not storing it twice',
			'Each layer catches what the one above it missed. The top one is free, and the bottom one is the only part that costs anything.'
		)}

		<div class="layers">
			{#each LAYERS as layer, i (layer.name)}
				<div class="layer">
					<span class="layer-index" aria-hidden="true">{i + 1}</span>
					<div class="layer-body">
						<strong>{layer.name}</strong>
						<span class="scope">{layer.scope}</span>
						<p class="prose">{layer.text}</p>
					</div>
					<div class="layer-figure">
						<strong>{layer.figure}</strong>
						<span class="note">{layer.detail}</span>
					</div>
				</div>
			{/each}
		</div>

		<div class="spread">
			<div>
				<h5>The same 1% of bytes, edited in four places</h5>
				<p class="prose">
					Twelve revisions of one 4 MB CSV. Insert, delete and append concentrate the
					edit at a point, so the boundary algorithm re-syncs within a chunk or two and
					everything after it hashes identically. That is what content-defined chunking
					buys and what a fixed-block scheme cannot do. Scattered overwrites leave
					almost every chunk differing by a byte or two, so the ratio has to be earned
					by deltas instead.
				</p>
				<p class="foot-note">
					The headline 3.93× is therefore the ratio for one corpus rather than a
					guarantee. The same edit budget swings it from 3.9× to 26× depending on where
					the edits land, and <code>store.stats()</code> reports it on your own data.
				</p>
			</div>

			<div class="patterns">
				{#each PATTERNS as pattern (pattern.name)}
					<div class="pattern">
						<span class="pattern-name">{pattern.name}</span>
						<span class="bar-track"><i style="width: {(pattern.ratio / widest) * 100}%"></i></span>
						<span class="pattern-value">{pattern.ratio.toFixed(2)}×</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- The thing itself, running. -->
	<section class="box">
		{@render head(
			'explorer',
			'Every node, and everything recorded about it',
			'A real exported store, laid out by generation and coloured by step type. Click a node for what was recorded when it ran.'
		)}

		<div class="demo">
			<!-- The snapshot is a fully self-contained static page (no
			     X-Frame-Options, no external assets), so it embeds directly. -->
			<iframe
				class="embed"
				src={DEMO}
				title="Ancestree interactive pipeline explorer"
				loading="lazy"
				sandbox="allow-scripts"
			></iframe>

			<p class="foot-note">
				This is the static snapshot (<code>store.export_graph()</code>), one
				self-contained HTML file. The live explorer adds search, node diffs and a sortable
				runs table, all answered by SQL. Provenance is captured on every node without
				being asked for: user, Python, platform, git commit, branch, and whether the
				worktree was dirty.
			</p>
		</div>
	</section>

	<!-- What it costs to call, in the only unit that matters. -->
	<section class="box">
		{@render head(
			'measured',
			'Three cost classes, three orders of magnitude',
			'The write path is the only thing that scales with data volume, and it is paid at block exit rather than while your code runs. Everything on the query side is indexed.'
		)}

		<div class="costs">
			{#each COSTS as cost (cost.tier)}
				<div class="cost">
					<strong>{cost.tier}</strong>
					<span class="scope">{cost.note}</span>
					<table>
						<tbody>
							{#each cost.rows as row (row.op)}
								<tr><th scope="row">{row.op}</th><td>{row.ms}</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/each}
		</div>

		<p class="foot-note">
			Times in milliseconds, medians of repeated runs after a warm-up. The numbers that do
			not flatter it are in the same table in the repo: ingest runs at roughly 11 MB/s, so a
			hundred-megabyte artifact belongs at a step boundary rather than inside a loop.
		</p>
	</section>

	<!-- What a reader has to trust before putting it in a pipeline. -->
	<section class="box">
		{@render head(
			'shipping',
			'Guarantees, checks, and what runs on every push',
			'A lineage store holds somebody else’s work, so what matters is what it promises across versions and what it verifies rather than assumes.'
		)}

		<div class="cards">
			{#each SHIPPING as card (card.term)}
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

	<!-- What an adversarial read of the documentation turned up. -->
	<section class="box">
		{@render head(
			'audit',
			'Audited against its own documentation',
			'806 tests in 14 modules, written by treating every falsifiable sentence in the docs as an assertion, then adding hostile inputs, seeded property tests, real SIGKILLs, multi-process concurrency and 1,000-node scale runs.'
		)}

		<div class="defects">
			{#each DEFECTS as defect (defect.term)}
				<div class="defect">
					<div class="defect-head">
						<span class="severity" class:high={defect.severity === 'High'}>{defect.severity}</span>
						<strong>{defect.term}</strong>
						<span class="closed">fixed</span>
					</div>
					<p class="prose">{defect.text}</p>
				</div>
			{/each}
		</div>

		<p class="foot-note">
			Nothing turned up in the lineage DAG, the metadata envelope, the chunker or either
			deduplication layer. All four defects were in the operational plumbing, and two of
			them could lose data. 36 of 40 documented claims held exactly as written when audited,
			and all 40 hold now. Tests that pinned the broken behaviour were inverted rather than
			deleted, so a regression fails loudly.
		</p>
	</section>

	<!-- What the rewrite bought, and what it cost. -->
	<section class="box row">
		<div>
			{@render head(
				'rewrite',
				'0.1 was a directory per node',
				'It worked, and it carried a hand-rolled index to make it work: a snapshot, a journal, a reconcile pass, a background packer with fork handling, and a GC lock file. 0.2 deletes all of it and lets SQLite be the index.'
			)}
			<p class="foot-note">
				The break is deliberate and total. There is no migration, and a 0.1 store is
				refused rather than half-read.
			</p>
		</div>

		<table class="rewrite">
			<thead>
				<tr><th scope="col"></th><th scope="col">0.1</th><th scope="col">0.2</th></tr>
			</thead>
			<tbody>
				{#each REWRITE as row (row.change)}
					<tr>
						<th scope="row">{row.change}</th>
						<td class="before">{row.before}</td>
						<td class="after">{row.after}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<!-- Where it is the wrong tool. -->
	<section class="box row">
		<div>
			{@render head('limits', 'What it is not for')}
			<p class="prose">
				A single SQLite file buys simplicity and crash safety. These are the consequences,
				and they are in the shipped documentation rather than only here.
			</p>
		</div>

		<ul class="limits">
			{#each LIMITS as limit (limit.term)}
				<li>
					<span class="mark"><Icon name="warning" /></span>
					<span><strong>{limit.term}:</strong> {limit.text}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	/* A datasheet rather than a case study: a spec strip, then sections named
	   in a rail down the left, then the measurements. */
	.study {
		/* The study's own accent, dark enough to read on the white card — the
		   site's amber is set for a black page. */
		/* The shared light-ground amber (app.css) under this file's old local
		   name — was its own one-off mix before, at 3.17:1 on this ground,
		   which clears 3:1 but not the 4.5:1 the kicker's small text needs. */
		--ink: var(--amber-ink);

		display: grid;
		gap: 0.75rem;
	}

	.box {
		display: grid;
		gap: 0.9rem;
		padding: 1rem 1.15rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: #fff;
	}

	.row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		gap: 1.5rem;
		align-items: start;
	}

	.row > div {
		display: grid;
		align-content: start;
		gap: 0.6rem;
	}

	.lede {
		display: grid;
		gap: 0.35rem;
	}

	.lede h4 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	/* The rail's word. A datasheet's sections are named, not numbered. */
	.kicker {
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.55rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.prose {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		line-height: 1.65;
	}

	.foot-note {
		margin: 0;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		line-height: 1.6;
	}

	.note {
		display: block;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		line-height: 1.5;
	}

	.prose code,
	.foot-note code {
		padding: 0.05rem 0.25rem;
		border-radius: 0.2rem;
		background: color-mix(in srgb, var(--color-foreground) 5%, transparent);
		font-size: 0.95em;
	}

	.mark {
		display: inline-flex;
		flex: none;
		/* -ink: this icon is on the study's light ground and plain --amber
		   measures 1.75:1 there. */
		color: var(--amber-ink);
		font-size: 0.9rem;
		line-height: 1;
	}

	/* --- the spec strip --------------------------------------------------- */

	.banner {
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 1.75rem;
		align-items: start;
	}

	.intro {
		display: grid;
		gap: 0.7rem;
	}

	.thesis {
		margin: 0;
		max-width: 62ch;
		font-size: 0.92rem;
		font-weight: 500;
		line-height: 1.55;
	}

	.thesis code {
		font-size: 0.9em;
	}

	/* The one line a reader might actually run. */
	.install {
		justify-self: start;
		padding: 0.45rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		background: color-mix(in srgb, var(--color-foreground) 3%, #fff);
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	/* Version, Python, dependencies — the header of a datasheet, read across. */
	.spec {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1.4rem;
		margin: 0;
	}

	.spec div {
		display: grid;
		gap: 0.1rem;
	}

	.spec dt {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.spec dd {
		margin: 0;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		font-weight: 600;
	}

	.headline {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.figure {
		display: grid;
		gap: 0.15rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
	}

	.figure strong {
		color: var(--color-foreground);
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.figure .unit {
		margin-left: 0.12em;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.36em;
		font-weight: 500;
		letter-spacing: 0;
	}

	/* --- the code sample -------------------------------------------------- */

	/* The API is the design, so it is quoted rather than described — dark, like
	   the terminal it would be typed into. */
	.code {
		margin: 0;
		padding: 0.9rem 1rem;
		overflow-x: auto;
		border-radius: 0.35rem;
		background: var(--color-background);
		color: #d6d5cf;
		font-family: var(--font-mono);
		font-size: 0.64rem;
		line-height: 1.75;
		tab-size: 4;
	}

	/* --- the ingest bars -------------------------------------------------- */

	.bars {
		display: grid;
		gap: 0.65rem;
	}

	.bars-head {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	/* Name and figure on one line, the bar between them, the sentence under —
	   so the five stages are read as one scale rather than five boxes. */
	.bar {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr) 4rem;
		gap: 0.2rem 0.6rem;
		align-items: center;
	}

	.bar-name {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.66rem;
		font-weight: 600;
	}

	.bar-track {
		height: 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-foreground) 6%, transparent);
	}

	.bar-track i {
		display: block;
		height: 100%;
		min-width: 2px;
		border-radius: inherit;
		background: var(--ink);
	}

	.bar-value {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		text-align: right;
	}

	.bar-detail {
		grid-column: 2 / -1;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		line-height: 1.5;
	}

	/* --- the three layers ------------------------------------------------- */

	.layers {
		display: grid;
		gap: 0.5rem;
	}

	/* Read as a stack: each row is a layer, and the number says how far down
	   the bytes had to fall before something caught them. */
	.layer {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) minmax(0, 12.5rem);
		gap: 0.9rem;
		align-items: start;
		padding: 0.75rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
	}

	.layer-index {
		display: grid;
		place-items: center;
		width: 1.4rem;
		height: 1.4rem;
		border: 1px solid var(--ink);
		border-radius: 50%;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.6rem;
	}

	.layer-body {
		display: grid;
		gap: 0.25rem;
	}

	.layer-body strong {
		color: var(--color-foreground);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.scope {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.56rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.layer-figure {
		display: grid;
		gap: 0.15rem;
		justify-items: end;
		text-align: right;
	}

	.layer-figure strong {
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 700;
	}

	/* --- the edit-pattern spread ------------------------------------------ */

	.spread {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: center;
		padding-top: 0.3rem;
	}

	.spread > div:first-child {
		display: grid;
		gap: 0.5rem;
	}

	.spread h5 {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.patterns {
		display: grid;
		gap: 0.45rem;
	}

	.pattern {
		display: grid;
		grid-template-columns: 8.5rem minmax(0, 1fr) 3rem;
		gap: 0.6rem;
		align-items: center;
	}

	.pattern-name,
	.pattern-value {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.6rem;
	}

	.pattern-value {
		color: var(--color-foreground);
		text-align: right;
	}

	/* --- the demo --------------------------------------------------------- */

	/* The explorer is a graph with a legend and a detail panel: it takes the
	   card's whole width, and the note about the live version sits under it. */
	.demo {
		display: grid;
		gap: 0.6rem;
	}

	.embed {
		display: block;
		width: 100%;
		height: 32rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: #fff;
	}

	/* --- the cost classes ------------------------------------------------- */

	.costs {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.cost {
		display: grid;
		align-content: start;
		gap: 0.3rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
	}

	.cost strong {
		color: var(--color-foreground);
		font-size: 0.76rem;
		font-weight: 700;
	}

	.cost table {
		width: 100%;
		margin-top: 0.3rem;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.62rem;
	}

	.cost th,
	.cost td {
		padding: 0.3rem 0 0.3rem 0;
		font-weight: 400;
		text-align: left;
		vertical-align: top;
	}

	.cost th {
		color: var(--text-dim);
	}

	.cost td {
		color: var(--color-foreground);
		font-weight: 600;
		text-align: right;
		white-space: nowrap;
	}

	.cost tr + tr th,
	.cost tr + tr td {
		border-top: var(--rule);
	}

	/* --- the shipping cards ----------------------------------------------- */

	.cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.card-item {
		display: grid;
		align-content: start;
		gap: 0.45rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
	}

	.card-item strong {
		color: var(--color-foreground);
		font-size: 0.74rem;
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
		font-size: 0.62rem;
		line-height: 1.55;
	}

	.card-item li::before {
		position: absolute;
		left: 0;
		color: var(--ink);
		content: '—';
	}

	.card-item .mark {
		color: var(--ink);
	}

	/* --- the defects ------------------------------------------------------ */

	.defects {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.defect {
		display: grid;
		align-content: start;
		gap: 0.45rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
	}

	.defect-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.5rem;
	}

	.defect-head strong {
		color: var(--color-foreground);
		font-size: 0.74rem;
		font-weight: 700;
		line-height: 1.4;
	}

	/* `closed`, not `fixed`: Tailwind ships a bare `.fixed` utility
	   (position: fixed), and a component class of the same name loses to it —
	   which stacked both chips into one box. */
	.severity,
	.closed {
		flex: none;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.52rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.severity {
		border: 1px solid var(--color-border);
		color: var(--text-dim);
	}

	.severity.high {
		border-color: color-mix(in srgb, var(--coral) 70%, #0b0b0b);
		color: color-mix(in srgb, var(--coral) 30%, #0b0b0b);
	}

	.closed {
		border: 1px solid color-mix(in srgb, var(--mint) 70%, #0b0b0b);
		color: color-mix(in srgb, var(--mint) 30%, #0b0b0b);
	}

	/* --- the rewrite table ------------------------------------------------ */

	.rewrite {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 0.62rem;
	}

	.rewrite th,
	.rewrite td {
		padding: 0.4rem 0.6rem 0.4rem 0;
		font-weight: 400;
		text-align: left;
		vertical-align: top;
	}

	.rewrite thead th {
		padding-top: 0;
		color: var(--text-faint);
		font-size: 0.55rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-bottom: 1px solid var(--color-border);
	}

	.rewrite tbody th {
		color: var(--color-foreground);
		font-weight: 600;
	}

	.rewrite tbody tr + tr th,
	.rewrite tbody tr + tr td {
		border-top: var(--rule);
	}

	.before {
		color: var(--text-faint);
		text-decoration: line-through;
	}

	.after {
		color: var(--ink);
	}

	/* --- limits ----------------------------------------------------------- */

	.limits {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.limits li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.5rem;
		align-items: baseline;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.64rem;
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
		.spread,
		.demo,
		.costs,
		.cards,
		.defects {
			grid-template-columns: minmax(0, 1fr);
		}

		.layer {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.layer-figure {
			grid-column: 2;
			justify-items: start;
			text-align: left;
		}

		.embed {
			height: 20rem;
		}
	}
</style>
