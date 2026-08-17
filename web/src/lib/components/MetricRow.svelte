<script>
	/* One reading: what it is, what it says now, how it has behaved, and a graph.
	   The graph is whatever the caller renders — a trace, a map — so this owns the
	   shape of a row and nothing about what is being measured. */
	let { label, value, tone, stats = [], children } = $props();
</script>

<div class="row card">
	<div class="figures">
		<h3 class="name eyebrow">{label}</h3>
		<strong class="figure" style:color={tone}>{value}</strong>
		<dl class="summary">
			{#each stats as [name, reading] (name)}
				<div><dt>{name}</dt><dd>{reading}</dd></div>
			{/each}
		</dl>
	</div>

	{@render children()}
</div>

<style>
	/* Numbers a third, graph the rest. A box of its own, framed like every other
	   card on the dashboard: the panel around it is what says these readings
	   belong to one thing. */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		gap: 0.3rem 1.25rem;
		align-items: stretch;
	}

	.figures {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	/* A shade brighter than the labels on the boxes around it: this one names the
	   reading under it, not the card. A heading like the panels', so the readings
	   are stops for anyone navigating by them. */
	.name {
		margin: 0;
		color: var(--text-dim);
		letter-spacing: 0.12em;
	}

	/* One under the other, filling the height the graph beside it sets: a column of
	   ruled pairs reads down as a list, and it is what lets the reading above be
	   set as large as it is. */
	.summary {
		display: grid;
		gap: 0;
		margin: 0.35rem 0 0;
	}

	.summary div {
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
		line-height: 1.35;
	}

	.summary dt {
		color: var(--text-faint);
		font-size: 0.56rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.summary dd {
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 0.66rem;
	}

	/* Neither column is worth much at this width: the numbers go above the graph
	   rather than beside it, and the summary spreads along instead of down. */
	@media (max-width: 52rem) {
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.5rem;
		}

		.summary {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		/* Four pairs across a phone leave no room between a name and its number:
		   the number goes under the name instead of beside it. */
		.summary div {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}
	}
</style>
