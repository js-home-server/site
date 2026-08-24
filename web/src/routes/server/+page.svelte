<script>
	import Placeholder from '$lib/components/Placeholder.svelte';
</script>

<svelte:head>
	<title>Server — Joshua Smith</title>
</svelte:head>

<div class="grid">
	{#each Array(16) as _, i (i)}
		<div class="box span-3"><Placeholder note="—" lines={6} /></div>
	{/each}
</div>
