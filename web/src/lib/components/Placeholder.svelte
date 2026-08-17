<script>
	/* An unfilled slot. `lines` is roughly how tall the real thing will be, in
	   text lines, so a wireframe holds the shape of the page it is standing in
	   for. Dashed, so nothing here can be mistaken for finished work. */
	let { note, lines = 1 } = $props();
</script>

<div class="placeholder" style="--lines: {lines}"><span>{note}</span></div>

<style>
	/* Four dotted edges rather than a dotted border, for the same reason the charts
	   draw their own: a 1px dotted border reads as a line. */
	.placeholder {
		display: grid;
		place-items: center;
		min-height: calc(var(--lines) * 1.4rem);
		color: var(--color-border);
		background-color: color-mix(in srgb, var(--color-foreground) 2%, transparent);
		background-image: var(--dot-row), var(--dot-row), var(--dot-column), var(--dot-column);
		background-position: 0 0, 0 100%, 0 0, 100% 0;
		background-repeat: no-repeat;
		background-size: 100% 1px, 100% 1px, 1px 100%, 1px 100%;
	}

	/* No opacity on top of the grey: --text-faint clears AA on its own, and dimming
	   it further is what would take it under. */
	span {
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.1em;
	}
</style>
