<script>
	import LoadingDots from './LoadingDots.svelte';
	import ProjectTable from './ProjectTable.svelte';
	import { bytes, duration } from '$lib/format.js';
	import { server } from '$lib/server.svelte.js';

	const HEAD = [{ label: 'S' }, { label: 'CPU%', right: true }, { label: 'MEM%', right: true }, { label: 'RES', right: true }, { label: 'UP', right: true }, { label: 'Command' }];
	const KEYS = ['Help', 'Setup', 'Search', 'Filter', 'Tree'];

	/* ponytail: anything that isn't the collector counts as monitoring. Add a stack here if another gets listed. */
	const isCollector = (c) => /collector|compactor/.test(c.name);
	const STACKS = [
		['collector', isCollector],
		['monitoring', (c) => !isCollector(c)]
	];

	const cpuTone = (cpu) => (cpu > 30 ? 'hot' : cpu < 0.5 ? 'faint' : undefined);

	let rows = $derived.by(() => {
		const total = server.snapshot?.memory?.total_bytes;
		const items = [...(server.snapshot?.containers?.items ?? [])].sort((a, b) => b.cpu_percent - a.cpu_percent);
		const out = STACKS.flatMap(([stack, belongs]) => {
			const members = items.filter(belongs);
			if (!members.length) return [];
			return [
				{ key: stack, tone: 'group', cells: ['', '', '', '', '', `${stack}/`] },
				...members.map((c, i) => ({
					key: c.name,
					cells: [
						c.cpu_percent > 1 ? { text: 'R', tone: 'mint' } : { text: 'S', tone: 'faint' },
						{ text: c.cpu_percent.toFixed(1), tone: cpuTone(c.cpu_percent) },
						((c.memory_bytes / total) * 100).toFixed(1),
						{ text: bytes(c.memory_bytes).replace(/ (.)B$/, '$1'), tone: 'azure' },
						{ text: duration(c.uptime_seconds).split(' ')[0], tone: 'faint' },
						`${i === members.length - 1 ? '└─' : '├─'} ${c.name}`
					]
				}))
			];
		});
		if (out.length) out[1].selected = true;
		return out;
	});
</script>

{#if rows.length}
	<div class="htop">
		<ProjectTable head={HEAD} {rows} />
		<div class="keys" aria-hidden="true">
			{#each KEYS as key, i (key)}<span><b>F{i + 1}</b>{key}</span>{/each}
		</div>
	</div>
{:else}
	<p>
		{#if server.status.snapshot === 'error'}Live data unavailable{:else}Checking the containers <LoadingDots />{/if}
	</p>
{/if}

<style>
	.htop {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		height: 100%;
	}

	.keys {
		display: flex;
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		line-height: 1.25;
		white-space: pre;
	}

	.keys span {
		padding-right: var(--space-lg);
		background: color-mix(in srgb, var(--azure) 45%, var(--color-background));
		color: var(--color-background);
	}

	.keys b {
		background: var(--color-background);
		color: var(--color-foreground);
		font-weight: 400;
	}

	p {
		margin: 0;
		padding: var(--space-sm);
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}
</style>
