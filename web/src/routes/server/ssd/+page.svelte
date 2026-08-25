<script>
	import DiskDashboard from '$lib/components/DiskDashboard.svelte';
	import { disk } from '$lib/storage.js';
</script>

<svelte:head>
	<title>SSD — Server — Joshua Smith</title>
</svelte:head>

<DiskDashboard {...disk('ssd')} />
