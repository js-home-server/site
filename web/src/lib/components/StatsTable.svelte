<script>
	import Panel from './Panel.svelte';
	import { gridArea } from '$lib/grid.js';
	import { STAT_COLUMNS } from '$lib/stats.js';

	/* One row per metric, `row` = statsRow()'s figures in STAT_COLUMNS order. col/row/w/h place the box — see $lib/grid.js. */
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
	/* .fill (Dashboard.svelte) stretches this chain down to .fleet — height lets a table's own layout mode grow rows evenly instead of leaving blank space. */
	table {
		width: 100%;
		height: 100%;
	}
</style>
