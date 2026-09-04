/* Where a box sits on the 4x4 dashboard board. col/row (1-4) is the start
   cell — omit to flow into the next open slot. w/h (1-4) is the span.
   Inline style, not a class — these land on boxes other components render (e.g. StatsTable owns its own div), so a page-scoped class would miss. */
export function gridArea({ col, row, w = 1, h = 1 } = {}) {
	return [
		`grid-column: ${col ? `${col} / span ${w}` : `span ${w}`};`,
		`grid-row: ${row ? `${row} / span ${h}` : `span ${h}`};`
	].join(' ');
}
