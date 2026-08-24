<script>
	import Panel from './Panel.svelte';
	import { gridArea } from '$lib/grid.js';

	/* `col`/`row`/`w`/`h` place this on the dashboard's quarter grid — see
	   $lib/grid.js. Left at their defaults this is one quarter-cell, auto-flowed
	   like any other box; the cpu page's own 2x2 merge is `col={3} row={3}
	   w={2} h={2}`. */
	let { rows, col, row, w = 1, h = 1 } = $props();
</script>

<div class="box" style={gridArea({ col, row, w, h })}>
	<Panel label="24H Statistics">
		<div class="fleet">
			<table>
				<thead>
					<tr>
						<th class="eyebrow" scope="col">Metric</th>
						{#each ['Min', 'Median', 'Avg', 'P95', 'Max'] as column (column)}
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
	/* Whatever this box grows to — a quarter cell most places, 2x2 wherever a
	   page has merged it into a bigger one — the table fills it rather than
	   sitting pinned to the top with the rest of the box left blank. */
	.box {
		display: flex;
		flex-direction: column;
	}

	.box :global(.panel) {
		flex: 1;
		min-height: 0;
	}

	.fleet {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	/* .fleet's own flex row would otherwise size the table to its content's
	   min-content box on both axes; width: 100% is what it always stretched to,
	   and height: 100% now reaches for the rest of a taller box too — a table's
	   own layout mode is what turns that into evenly taller rows rather than
	   the row heights just being pinned and the extra space going nowhere. */
	table {
		width: 100%;
		height: 100%;
	}
</style>
