/* Where a box sits on a dashboard section's own 4x4 board.

   `col`/`row` are 1-4, the cell to start at; omit them to let the box flow into
   the next open slot, which is what most boxes do. `w`/`h` are how many cells
   to span, 1-4 apiece.

   The result is an inline style rather than a class because these land on boxes
   that other components render — StatsTable owns its own <div>, so a stylesheet
   rule written on the page would be scoped to the wrong component and lose to
   the grid's own default besides. Inline wins outright either way. */
export function gridArea({ col, row, w = 1, h = 1 } = {}) {
	return [
		`grid-column: ${col ? `${col} / span ${w}` : `span ${w}`};`,
		`grid-row: ${row ? `${row} / span ${h}` : `span ${h}`};`
	].join(' ');
}
