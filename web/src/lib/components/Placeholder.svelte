<script>
	/* An unfilled slot. `lines` is roughly how tall the real thing will be, in
	   text lines, so a wireframe holds the shape of the page it is standing in
	   for. Dashed, so nothing here can be mistaken for finished work. */
	let { note, lines = 1 } = $props();
</script>

<div class="placeholder" style="--lines: {lines}"><span>{note}</span></div>

<style>
	.placeholder {
		display: grid;
		place-items: center;
		min-height: calc(var(--lines) * 1.4rem);
		border: 1px dashed var(--color-border);
		border-radius: 0.25rem;
		background: color-mix(in srgb, var(--color-foreground) 2%, transparent);
	}

	span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		opacity: 0.7;
	}
</style>
