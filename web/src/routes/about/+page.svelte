<script>
	import Dashboard from '$lib/components/Dashboard.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';

	/* Wireframe. One entry per section of the page and per stop on the rail, and
	   the panels it will hold: a label, and roughly how tall the real thing is in
	   text lines. `stack` is a section read down rather than across — a list of
	   entries rather than a row of columns. */
	const SECTIONS = [
		{ id: 'summary', label: 'Summary', panels: [['Who I am', 6], ['At a glance', 6]] },
		{
			id: 'stack',
			label: 'Stack',
			panels: [['Languages', 5], ['Infrastructure', 5], ['Tooling', 5]]
		},
		{
			id: 'experience',
			label: 'Experience',
			stack: true,
			panels: [['Current role', 4], ['Previous role', 4], ['Before that', 4]]
		},
		{ id: 'projects', label: 'Projects', panels: [['Project', 6], ['Project', 6], ['Project', 6]] }
	];
</script>

<svelte:head>
	<title>About — Joshua Smith</title>
</svelte:head>

<Dashboard title="About" sections={SECTIONS} max="none">
	{#snippet body(section)}
		<div class={section.stack ? 'stack' : 'band bleed'}>
			{#each section.panels as [label, lines], i (i)}
				<Panel {label}>
					<Placeholder note="wireframe" {lines} />
				</Panel>
			{/each}
		</div>
	{/snippet}
</Dashboard>
