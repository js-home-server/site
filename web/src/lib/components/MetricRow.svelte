<script>
	import Panel from './Panel.svelte';

	/* One reading: what it is, what it says now, how it has behaved, and a graph.
	   The graph is whatever the caller renders — a trace, a map — so this owns the
	   shape of a row and nothing about what is being measured. */
	let { label, value, tone, stats = [], children } = $props();
</script>

<div class="row">
	<Panel {label} {tone}>
		<strong class="figure">{value}</strong>
		<dl class="summary">
			{#each stats as [name, reading] (name)}
				<div class="readout ruled"><dt class="eyebrow">{name}</dt><dd>{reading}</dd></div>
			{/each}
		</dl>
	</Panel>

	{@render children()}
</div>

<style>
	/* Numbers a third, graph the rest. No frame of its own: the section it sits in
	   is the box, and the rule above it is what separates one reading from the
	   next. */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		gap: 0.3rem 1.25rem;
		align-items: stretch;
	}

	/* One under the other, filling the height the graph beside it sets: a column of
	   ruled pairs reads down as a list, and it is what lets the reading above be
	   set as large as it is. */
	.summary {
		display: grid;
		gap: 0;
		margin: 0;
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
		.summary :global(.readout) {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}
	}
</style>
