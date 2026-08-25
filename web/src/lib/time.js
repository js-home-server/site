/* What the dashboard knows about the machine's clock, worked out from the time
   block the API carries. */

/* A source's standing, in the colour it is drawn in wherever it appears. */
const TONE = {
	selected: 'var(--mint)',
	candidate: 'var(--azure)',
	unusable: 'var(--text-faint)'
};

/* Which state wins when the sources are put in order: the one the clock is
   actually following, then the ones it could fall back to, then the rest. */
const RANK = { selected: 3, candidate: 2, unusable: 1 };

/* Chrony reports the correction needed to reach NTP, so a negative reading
   means this machine is running fast. Both of these flip that, once, so every
   page reads a positive offset as the machine being ahead — the headline
   figure and the history behind it can never disagree on which way is which. */
export const clockOffset = (time) =>
	Number.isFinite(time?.systemOffsetSeconds) ? -time.systemOffsetSeconds : null;

export const clockOffsetHistory = (series) =>
	(series?.timeSystemOffsetSeconds ?? []).map(([at, offset]) => [at, -offset]);

/* Every source as one reading with an uncertainty: where it says the clock is,
   and how far out it admits that could be.

   The bar is chrony's own error bound, not its jitter. The bound is what says
   whether a source can be believed — it is the offset plus everything the path
   to it could be hiding — and it is the reading that actually separates these
   sources, which agree on the offset to a fraction of a millisecond but differ
   by a factor of seven on how sure they are of it. */
export const spread = (time) =>
	[...(time?.sources ?? [])]
		.sort((a, b) => RANK[b.state] - RANK[a.state] || a.errorSeconds - b.errorSeconds)
		.map((source) => ({
			id: source.name,
			label: source.name,
			note: source.state,
			tone: TONE[source.state] ?? TONE.unusable,
			value: source.offsetSeconds,
			error: source.errorSeconds
		}));
