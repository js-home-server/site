<script>
	import Panel from './Panel.svelte';
	import { gridArea } from '$lib/grid.js';
	import { STAT_COLUMNS } from '$lib/stats.js';

	/* One row a metric, `row` being the figures statsRow() worked out for it in
	   the order STAT_COLUMNS names them. `col`/`row`/`w`/`h` place the box on
	   the section's own board — see $lib/grid.js. */
	let { rows, col, row, w = 1, h = 1 } = $props();
</script>

<div class="box fill" style={gridArea({ col, row, w, h })}>
	<Panel label="24H Statistics">
		<div class="fleet">
			<table>
				<thead>
					<tr>
						<th class="eyebrow" scope="col">Metric</th>
						{#each STAT_COLUMNS as column (column)}
							<th class="eyebrow" scope="col">{column}</th>
						{/each}
					</tr>
				</thead>

				<tbody>
					{#each rows as { label, tone, row } (label)}
						<tr style:color={tone}>
							<th scope="row">{label}</th>
							{#each row as value, i (i)}<td>{value}</td>{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Panel>
</div>

<style>
	/* .fill (Dashboard.svelte) stretches the chain above down to .fleet, whose
	   flex row would otherwise size the table to its own min-content box on
	   both axes. Width is what it always stretched to; height is what reaches
	   for the rest of a taller box — a table's own layout mode is what turns
	   that into evenly taller rows rather than blank space under the last. */
	table {
		width: 100%;
		height: 100%;
	}
</style>
