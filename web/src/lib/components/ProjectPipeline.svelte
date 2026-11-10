<script>
	/* A simplified Pipeline Explorer over 15 of the real demo's nodes, opening on its best result. */
	import nodes from '$lib/data/ancestree-nodes.json';

	const TONE = { 'raw data': 'azure', scaling: 'violet', embedding: 'amber', clustering: 'mint' };
	const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
	const childrenOf = (id) => nodes.filter((n) => n.parent === id);
	const leaves = nodes.filter((n) => n.level === 3);
	const best = leaves.reduce((a, b) => (b.score > a.score ? b : a));

	/* SVG and layout units, in px: the drawing is measured, so these can't be CSS tokens. */
	const NODE = { ring: 11, inner: 7.5, leaf: 5.5, labelGap: 13, leafGap: 11, baseline: 3.5 };
	const INSET = { left: 34, labels: 92 };
	const PANEL = { minHost: 400, max: 216, share: 0.34 };

	let width = $state(0);
	let height = $state(0);

	const lineage = [];
	for (let n = best; n; n = byId[n.parent]) lineage.unshift(n);
	const path = new Set(lineage.map((n) => n.id));

	/* The panel only earns its width once the graph still has room left beside it. */
	let panel = $derived(width < PANEL.minHost ? 0 : Math.min(PANEL.max, width * PANEL.share));
	let graph = $derived(width - panel);

	let points = $derived.by(() => {
		const at = {};
		let leaf = 0;
		const place = (n) => {
			const x = INSET.left + ((graph - INSET.left - INSET.labels) * n.level) / 3;
			const kids = childrenOf(n.id);
			kids.forEach(place);
			at[n.id] = { x, y: kids.length ? (at[kids[0].id].y + at[kids.at(-1).id].y) / 2 : ((leaf++ + 0.5) / leaves.length) * height };
		};
		place(nodes[0]);
		return at;
	});

	const curve = (a, b) => `M${a.x} ${a.y}C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`;
	const label = (n) => (n.level === 3 ? `${n.value} ${Math.round(n.score)}` : n.value || n.step);
</script>

<div class="pipeline" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width && height}
		<svg viewBox="0 0 {graph} {height}" style:width="{graph}px" aria-hidden="true">
			{#each nodes.filter((n) => n.parent) as n (n.id)}
				<path class:on={path.has(n.id)} d={curve(points[n.parent], points[n.id])} />
			{/each}
			{#each nodes as n (n.id)}
				{@const p = points[n.id]}
				<g class={TONE[n.step]} class:on={path.has(n.id)} class:sel={n === best}>
					<circle class="ring" cx={p.x} cy={p.y} r={NODE.ring} />
					<circle class="dot" cx={p.x} cy={p.y} r={n.level === 3 ? NODE.leaf : NODE.inner} />
					{#if path.has(n.id)}
						<text x={n.level === 3 ? p.x + NODE.leafGap : p.x} y={n.level === 3 ? p.y + NODE.baseline : p.y - NODE.labelGap} text-anchor={n.level === 3 ? 'start' : 'middle'}>{label(n)}</text>
					{/if}
				</g>
			{/each}
		</svg>

		{#if panel}
			<aside style:width="{panel}px">
				<h4>What produced {best.id}</h4>
				<ol>
					{#each lineage as n (n.id)}
						<li class={TONE[n.step]}><i></i><span>{n.step}</span><b>{n.value || n.id}</b></li>
					{/each}
				</ol>
				<p><strong>{Math.round(best.score)}</strong> CH score, best</p>
			</aside>
		{/if}
	{/if}
</div>

<style>
	.pipeline {
		position: relative;
		height: 100%;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.25;
	}

	.azure { --tone: var(--azure); }
	.violet { --tone: var(--violet); }
	.amber { --tone: var(--amber); }
	.mint { --tone: var(--mint); }

	svg {
		display: block;
		height: 100%;
	}

	path {
		fill: none;
		stroke: var(--color-border);
		stroke-width: 1.2;
	}

	path.on {
		stroke: var(--mint);
		stroke-width: 2.4;
	}

	.dot {
		fill: color-mix(in srgb, var(--tone) 28%, var(--color-background));
		stroke: var(--tone);
		stroke-width: 1.4;
	}

	.on .dot {
		fill: var(--tone);
	}

	.ring {
		fill: transparent;
		stroke: none;
	}

	.sel {
		filter: drop-shadow(0 0 var(--space-xs) var(--mint));
	}

	.sel .ring {
		stroke: var(--mint);
		stroke-width: 1.6;
	}

	text {
		fill: var(--color-foreground);
	}

	aside {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		padding: var(--space-sm);
		border-left: var(--rule);
		background: var(--surface);
	}

	h4 {
		margin: 0 0 var(--space-xs);
		color: var(--text-dim);
		font-size: inherit;
		font-weight: 500;
	}

	ol {
		display: grid;
		gap: var(--space-xs);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: var(--space-sm) minmax(0, 1fr) auto;
		gap: var(--space-xs);
		align-items: center;
	}

	li i {
		width: var(--space-sm);
		height: var(--space-sm);
		border-radius: 50%;
		background: var(--tone);
	}

	li span {
		color: var(--text-dim);
	}

	li b {
		font-weight: 500;
	}

	aside p {
		margin: auto 0 0;
		color: var(--text-dim);
	}

	strong {
		display: block;
		color: var(--mint);
		font-family: var(--font-sans);
		font-size: var(--fs-subhead);
		font-weight: 700;
		letter-spacing: -0.03em;
	}
</style>
