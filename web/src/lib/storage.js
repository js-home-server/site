/* What the dashboard knows about a volume, worked out from the series the API
   carries: where it stands now, which way it is going, and when that runs out.
   The capacity boxes and the horizon chart are two views of this one shape. */
import { slope } from './stats.js';

const DAY = 86_400;

const last = (points) => (points?.length ? points.at(-1)[1] : null);

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
