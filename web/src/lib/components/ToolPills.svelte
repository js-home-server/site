<script>
	import Logo from './Logo.svelte';
	import { brandColors, websites } from '$lib/logos.js';

	/* What a piece of work was built with, one pill each. Lives here rather than
	   in a page because the same row is now read in three places — under a
	   milestone, under a project, and anywhere else the question is "with what".
	   Everything is written in tokens, so the row follows the box it stands in:
	   the projects box paints itself light and the pills come with it. */
	let { tools } = $props();
</script>

<ul class="pills">
	{#each tools as tool (tool)}
		<li style="--brand: {brandColors[tool] ?? 'currentcolor'}">
			{#if websites[tool]}
				<a href={websites[tool]} target="_blank" rel="noopener noreferrer">
					<Logo name={tool} />
					{tool}
				</a>
			{:else}
				<Logo name={tool} />
				{tool}
			{/if}
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
		position: relative;
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

	/* `display: contents` lays the icon and the name out as if they were direct
	   children of the pill; the `::after` is what actually catches the click,
	   stretched over the whole pill rather than just the text and icon. */
	li > :global(a) {
		display: contents;
		color: inherit;
		text-decoration: none;
	}

	li > :global(a::after) {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	li:has(a):hover {
		border-color: var(--brand);
		color: var(--color-foreground);
	}

	li:has(a):hover :global(svg) {
		fill: var(--brand);
	}
</style>
