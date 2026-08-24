/* The dashboard's own grid, in the units it's actually thought about in: a
   4x4 board of quarter-cells (12 real grid columns under it, 3 apiece), not
   raw line numbers. Any box that isn't just "the next quarter" — a merge like
   the cpu page's 2x2 stats table — reaches this once rather than every page
   working the column arithmetic out by hand and re-solving the same
   cross-component specificity problem a class-based version of this ran into
   (see StatsTable's history): the result is an inline style, which always
   wins over a stylesheet rule regardless of which component rendered the
   element or which order the stylesheets loaded in.

   `col`/`row` are 1-4, the quarter-cell to start the box at — omit either (or
   both) to auto-flow into the next open slot, the same as every plain
   `.span-*` box already does. `w`/`h` are how many quarter-cells to span, 1-4
   apiece. A box that isn't merging anything just needs `w`; that's still the
   common case, and .span-3/6/12 remain there for it when a class is enough. */
export function gridArea({ col, row, w = 1, h = 1 } = {}) {
	const column = col ? `${(col - 1) * 3 + 1} / span ${w * 3}` : `span ${w * 3}`;
	const line = row ? `${row} / span ${h}` : h > 1 ? `span ${h}` : null;

	return [`grid-column: ${column};`, line && `grid-row: ${line};`].filter(Boolean).join(' ');
}
