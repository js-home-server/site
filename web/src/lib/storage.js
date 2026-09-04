/* What the dashboard knows about a volume: where it stands, where it's going,
   when it runs out. The capacity boxes and horizon chart are two views of this one shape. */
import { last, slope } from './stats.js';

const DAY = 86_400;

/* Declared once so a drive is never drawn in two different colours across its own page, the overview box, or a chart. */
export const DISKS = [
	{ id: 'nvme', label: 'NVMe', tone: 'var(--violet)' },
	{ id: 'ssd', label: 'SSD', tone: 'var(--azure)' }
];

/* One drive by id, for a page that is only about that drive. */
export const disk = (id) => DISKS.find((d) => d.id === id);

/* Everything derived is null where the series can't support it — a freshly-watched volume says so, rather than projecting off two samples. */
export function volume({ id, label, tone, used, available, percent }) {
	const usedNow = last(used);
	const availableNow = last(available);
	const totalNow = usedNow === null || availableNow === null ? null : usedNow + availableNow;

	/* From the whole window, not the last two samples — a backup landing overnight shouldn't read as a trend. */
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
