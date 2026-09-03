/* The executive brief behind each project card, drawn by StudyBrief.svelte as
   an engineering sheet. Everything here is compressed out of that project's own
   study — the long write-ups at /projects/<name> — and no figure appears here
   that is not measured there. If a number changes in a study, it changes here.

   The bands are fixed by the component: premise (Problem, What I built) and
   title block, FIG. 01 with its design points, and the achievements. */

export const briefs = {
	ancestree: {
		drawing: '00',
		premise: [
			{
				kicker: 'Problem',
				title: 'The file survived. The reasoning behind it did not.',
				text: 'Ten variations in, you are looking at final_v2_REAL.csv with no record of what produced it. Outputs are easy to keep; the code, inputs, run history and failed attempts that explain them are not.'
			},
			{
				kicker: 'What I built',
				title: 'Store the history with the result.',
				text: 'A zero-dependency Python library that models a pipeline as a DAG and puts nodes, metadata, lineage and artifact bytes in one SQLite file. No server, and no experiment ontology to translate your work into.'
			}
		],
		figure: {
			caption: 'Interactive explorer',
			/* The real thing: `store.export_graph()`'s own output, one
			   self-contained static page, running in the sheet. */
			embed: 'https://js195.github.io/ancestree/assets/demo/interactive_pipeline.html',
			unit: 'Live · exported store · click a node',
			note: 'A real exported store, laid out by generation and coloured by step type. Click any node for what was recorded when it ran: identity hash, parent lineage, run metadata, the chunks it reuses and its verified artifact. Provenance is captured without being asked for — user, Python, platform, git commit, branch, and whether the worktree was dirty.'
		},
		notes: [
			{
				icon: 'hexagon',
				term: 'Reuse',
				text: 'A rerun whose type, parents, metadata and bytes all match rebinds onto the node that already exists — 136× faster than a cold write.'
			},
			{
				icon: 'adjustments',
				term: 'Chunk size',
				text: 'At 32 KiB a delta base sat exactly on zlib’s dictionary window, blinding every delta. Halving it to 16 KiB stores 14% less and ingests 22% faster.'
			},
			{
				icon: 'shield',
				term: 'Backup bug',
				text: '“Copy the file” backed up nothing under WAL journalling — the committed data lived in a file the docs never named. Fixed with SQLite’s own online backup API.'
			},
			{
				icon: 'wrench',
				term: 'Rewrite',
				text: '0.2 deleted 0.1’s hand-rolled index, journal, reconcile pass and background packer, and let SQLite be the index instead.'
			}
		],
		mechanismsLabel: 'Achievements',
		mechanisms: [
			{
				figure: '136×',
				text: 'faster on an identical rerun. A step whose type, parents, metadata and bytes all match rebinds onto the node that already exists — 5.3 ms against a 720 ms cold write.'
			},
			{
				figure: '8 MB',
				text: 'is what ten 8 MB copies cost to store. Artifacts split into content-defined chunks addressed by SHA-256, so a chunk already in the pool is a lookup rather than a write.'
			},
			{
				figure: '3.93×',
				text: 'less stored on a mixed corpus. A chunk resembling one already stored is kept as a zlib delta against it, found through a resemblance index rather than a full comparison.'
			}
		],
		block: [
			{ label: 'Drwg. no.', value: '00' },
			{ label: 'System', value: 'ancestree 0.2.0' },
			{ label: 'Runtime', value: 'Py 3.9–3.14' }
		]
	},

	server: {
		drawing: '01',
		premise: [
			{
				kicker: 'Problem',
				title: 'A live feed about a machine is a feed about a house.',
				text: 'The interesting problem is not that a box runs containers. It is that this one serves an unauthenticated public feed about its own internals, and every number in it is a fact about a machine in somebody’s home.'
			},
			{
				kicker: 'What I built',
				title: 'Publish a checked-in list, not whatever is exposed.',
				text: 'Debian behind one outbound Cloudflare tunnel — the router forwards nothing. Two small collectors write a fixed set of counters to a textfile the exporter mounts read-only; the API reads Prometheus and answers three routes.'
			}
		],
		figure: {
			caption: 'Live from the host'
		},
		notes: [
			{
				icon: 'shield',
				term: 'Boundary',
				text: 'The public surface is a checked-in inventory the collectors enforce, not whatever the exporters expose — a container needs a monitoring.public label, and an unrecognised name makes the renderer raise rather than pass it through.'
			},
			{
				icon: 'globe',
				term: 'Ingress',
				text: 'Nothing on the box listens to the internet — no forwarded port, no public SSH. A tunnel daemon dials out and holds the connection open from the inside.'
			},
			{
				icon: 'adjustments',
				term: 'Isolation',
				text: 'The archive is pinned to cores 0–1 by cpuset rather than given a CPU quota — a quota caps CPU-seconds but still lets the scheduler jitter all four cores.'
			},
			{
				icon: 'warning',
				term: 'Gap',
				text: 'Nothing alerts. A dead collector ran for six days in August: visible on a dashboard, announced to nobody.'
			}
		],
		mechanismsLabel: 'Achievements',
		mechanisms: [
			{
				figure: '0',
				text: 'ports open on the host. The router forwards nothing — a tunnel daemon dials out and holds the connection open from the inside, so the only reachable surface is one hostname on somebody else’s edge.'
			},
			{
				figure: '60s · 15s',
				text: 'write cadence and scrape interval. Two collectors write counters to a textfile the exporter mounts read-only; Prometheus pulls from it, so nothing on the box ever holds a socket open.'
			},
			{
				figure: '30 s',
				text: 'to answer, or roll back. The deploy script refuses to run against a dirty tree, and a failed health check restores the previous commit’s stack and the crontab it replaced.'
			}
		],
		block: [
			{ label: 'Drwg. no.', value: '01' },
			{ label: 'Host', value: 'i5-6600T · 8 GB' },
			{ label: 'Stack', value: 'Debian 13' }
		]
	},

	orderflow: {
		drawing: '02',
		premise: [
			{
				kicker: 'Problem',
				title: 'Order flow cannot be backfilled.',
				text: 'A trade tape only exists if somebody was listening at the time. The vendors that sell it retain days rather than years, and the research that needs it needs years. The data has to be collected before the question can be asked.'
			},
			{
				kicker: 'What I built',
				title: 'Collect it, fold it, and turn it into a strategy.',
				text: 'Ten venue feeds across six exchanges land in a transient tape at roughly 16 GB a day. A daily job folds that to volume-at-price per minute and writes Parquet at zstd-19 — the archive a market-neutral, walk-forward validated strategy is built and tested against.'
			}
		],
		figure: {
			caption: 'Equity, walk-forward validated'
		},
		notes: [
			{
				icon: 'database',
				term: 'Contract',
				text: 'One UTC axis from the venue’s own event time, not receipt time, and every price and size an integer on a 1e-8 grid — never a float.'
			},
			{
				icon: 'shield',
				term: 'Fail closed',
				text: 'The collector refuses to write rows it cannot timestamp against a clock sample newer than 60 seconds. That is why a gap in August lasted six days rather than filling with data of unknown time quality.'
			}
		],
		mechanismsLabel: 'Achievements',
		mechanisms: [
			{
				figure: '1.0 ms',
				text: 'writer lag across 583 streams. One event loop per shard writes JSONL straight to disk, so the write path never waits on compaction or disk IO.'
			},
			{
				figure: '108 MB',
				text: 'of permanent Parquet a day, folded from ≈16 GB of raw tape by a daily compaction job at zstd-19 — about 39 GB a year, keeping the shape OHLCV can’t express at all.'
			},
			{
				figure: '2.39',
				text: 'net Sharpe, 1.08 walk-forward. Shuffling the signal kills it, deliberate lookahead inflates it, and filling a day late barely moves it — the result behaves the way a real edge should.'
			}
		],
		block: [
			{ label: 'Drwg. no.', value: '02' },
			{ label: 'Feeds', value: '6 exchanges' },
			{ label: 'Stack', value: 'Polars · Parquet' }
		]
	},

	ascii: {
		drawing: '03',
		premise: [
			{
				kicker: 'Problem',
				title: 'A photograph is a grid of pixels. A terminal is a grid of characters.',
				text: 'The conversion is one honest question repeated a few thousand times: what does this rectangle weigh, and which character weighs the same? Most converters answer it in one tangled loop, which makes the answer impossible to test.'
			},
			{
				kicker: 'What I built',
				title: 'Separate the stages, then test each one.',
				text: 'A C11 command-line renderer in seven modules. Block-averaged sampling, tone curve, glyph selection and encoding are separable stages with their own files and their own assertions — image in, grid of cells out.'
			}
		],
		figure: {
			caption: 'Source, mono, greyscale, colour',
			unit: '--mode mono --charset simple --invert --width 100',
			note: 'This is the program’s HTML encoder writing text into the page, which is the whole argument for the format existing. Ink is glyph coverage and nothing else: ten steps of ramp, no colour anywhere. The gray and color modes express tone twice — as coverage and again as foreground brightness — and the two layers multiplying is where the apparent range comes from.'
		},
		notes: [
			{
				icon: 'window',
				term: 'Aspect',
				text: 'A terminal cell is about 0.5 wide over tall; the emitted web CSS measures 0.83. The HTML default is derived from the same constants that generate that CSS, so the two can’t drift apart.'
			},
			{
				icon: 'warning',
				term: 'Ceiling',
				text: 'The measured glyph-density table is still NULL, so glyphs are assumed evenly spaced. The hook and its test exist; the measurement does not.'
			}
		],
		mechanismsLabel: 'Achievements',
		mechanisms: [
			{
				figure: '13 ms',
				text: 'for a full render. Each cell averages every pixel of its source rectangle rather than reading one, so a downscale is a full weighing rather than a guess.'
			},
			{
				figure: '168',
				text: 'assertions across 1,300 lines. Sampling, tone curve, glyph selection and encoding are separate, tested stages rather than one tangled loop nothing can be checked against.'
			},
			{
				figure: '5 → 1',
				text: 'components, one make target. It regenerates every render on this site straight into the paths the pages import, byte-identical every time unless the flags changed.'
			}
		],
		block: [
			{ label: 'Drwg. no.', value: '03' },
			{ label: 'System', value: 'ascii-art · C11' },
			{ label: 'Deps', value: 'stb_image' }
		]
	}
};
