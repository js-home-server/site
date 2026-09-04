<script>
	import Logo from './Logo.svelte';

	/* One pill per tool. Lives here, not in a page, since the same row shows up under a milestone, a project, and anywhere else. All tokens, so it follows its box's theme. */
	let { tools } = $props();
</script>

<ul class="pills">
	{#each tools as tool (tool)}
		<li>
			<Logo name={tool} />
			{tool}
		</li>
	{/each}
</ul>

<style>
	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		padding: 0.25rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		letter-spacing: 0.02em;
	}
</style>
