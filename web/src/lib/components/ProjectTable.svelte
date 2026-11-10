<script>
	/* The terminal table inside a project visual. Rows stretch to fill whatever box it's given.
	   A cell is its text, or { text, tone } when that column carries a colour. */
	let { head, rows } = $props();
</script>

<table>
	<thead>
		<tr>
			{#each head as { label, right } (label)}
				<th class:right>{label}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each rows as { key, cells, tone, depth, selected } (key)}
			<tr class={tone} class:selected style:--depth={depth}>
				{#each cells as cell, i (i)}
					<td class={cell.tone} class:right={head[i].right}>{cell.text ?? cell}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		height: 100%;
		border-collapse: collapse;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.25;
		white-space: nowrap;
	}

	th {
		height: 1.25em;
		background: var(--mint);
		color: var(--color-background);
		font-weight: 600;
		text-align: left;
	}

	th,
	td {
		padding: 0 var(--space-sm);
	}

	.right {
		text-align: right;
	}

	/* Green buys, red sells, as on any tape, in the site's own pastels. Deeper fill = bigger trade. */
	.buy {
		background: color-mix(in srgb, var(--mint) calc(var(--depth) * 60%), transparent);
	}

	.sell {
		background: color-mix(in srgb, var(--coral) calc(var(--depth) * 60%), transparent);
	}

	.selected {
		background: var(--azure);
		color: var(--color-background);
	}

	.selected td {
		color: inherit;
	}

	.group td {
		color: var(--violet);
		font-weight: 600;
	}

	.mint {
		color: var(--mint);
	}

	.azure {
		color: var(--azure);
	}

	.hot {
		color: var(--amber);
		font-weight: 600;
	}

	.faint {
		color: var(--text-faint);
	}
</style>
