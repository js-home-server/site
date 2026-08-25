/* What the dashboard knows about a volume, worked out from the series the API
   carries: where it stands now, which way it is going, and when that runs out.
   The capacity boxes and the horizon chart are two views of this one shape. */
import { last, slope } from './stats.js';

const DAY = 86_400;

/* The machine's two drives. The id is the prefix every one of that drive's own
   series is named with, and the tone is the colour it is drawn in wherever it
   turns up — its own page, the overview's storage box, either chart. Declared
   once so those can never name the same drive two different colours. */
export const DISKS = [
	{ id: 'nvme', label: 'NVMe', tone: 'var(--violet)' },
	{ id: 'ssd', label: 'SSD', tone: 'var(--azure)' }
];

/* One drive by id, for a page that is only about that drive. */
export const disk = (id) => DISKS.find((d) => d.id === id);

/* `used`, `available` and `percent` are the volume's own series. Everything
   derived is null where the series cannot support it, so a volume the collector
   has only just started watching says so instead of quoting a projection made
   from two samples. */
export function volume({ id, label, tone, used, available, percent }) {
	const usedNow = last(used);
	const availableNow = last(available);
	const totalNow = usedNow === null || availableNow === null ? null : usedNow + availableNow;

	/* Bytes a day, from the whole window rather than the last two samples: a
	   backup landing overnight should not read as a trend. */
	const perSecond = slope(used);
	const growthPerDay = perSecond === null ? null : perSecond * DAY;

	/* Only a volume that is actually filling has a date with its ceiling. */
	const daysToFull =
		growthPerDay > 0 && availableNow !== null ? availableNow / growthPerDay : null;

	return {
		id,
		label,
		tone,
		points: percent ?? [],
		usedNow,
		totalNow,
		percentNow: last(percent),
		growthPerDay,
		daysToFull
	};
}
