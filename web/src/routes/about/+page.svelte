<script>
	import Dashboard from '$lib/components/Dashboard.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';

	/* Wireframe. One entry per section of the page and per stop on the rail, and
	   the panels it will hold: a label, and roughly how tall the real thing is in
	   text lines. `stack` is a section read down rather than across — a list of
	   entries rather than a row of columns. Summary carries no panels of its own:
	   it has its own snippet below, standing in the shape it will keep once it is
	   written rather than a generic wireframe grid. */
	const SECTIONS = [
		{ id: 'summary', label: 'Summary' },
		{
			id: 'stack',
			label: 'Stack',
			panels: [['Languages', 5], ['Infrastructure', 5], ['Tooling', 5]]
		},
		{
			id: 'experience',
			label: 'Experience',
			stack: true,
			panels: [['Current role', 4], ['Previous role', 4], ['Before that', 4]]
		},
		{ id: 'projects', label: 'Projects', panels: [['Project', 6], ['Project', 6], ['Project', 6]] }
	];

	/* The one live reading in the strip: the clock where I actually am, not a
	   fixed "UTC+1" that would go stale the day the UK falls back to GMT. Ticked
	   every second, since the display carries them. */
	let now = $state(new Date());
	$effect(() => {
		const id = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(id);
	});

	/* DD/MM/YYYY HH:MM:SS and the zone's own current offset, all read off the same
	   timestamp so none of them can disagree — Intl already knows when the UK is
	   on summer time and when it is not. */
	let ukClock = $derived.by(() => {
		const parts = new Intl.DateTimeFormat('en-GB', {
			timeZone: 'Europe/London',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
			timeZoneName: 'shortOffset'
		}).formatToParts(now);

		const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
		const offset = get('timeZoneName').replace('GMT', 'UTC') || 'UTC';
		const date = `${get('day')}/${get('month')}/${get('year')}`;
		const time = `${get('hour')}:${get('minute')}:${get('second')}`;
		return `${date} ${time} ${offset === 'UTC' ? 'UTC+0' : offset}`;
	});

	/* Placeholder copy for the rest of the strip, in the shape the real figures
	   will keep: a label, the headline reading, and the line under it. */
	let STATS = $derived([
		['Location', 'UK', ukClock],
		['Focus', 'Data Systems', 'ML · Infra · Tools'],
		['Experience', '5+ years', '2019 → Present'],
		['Status', 'Open to new problems', 'Build · Ship · Repeat']
	]);
</script>

<svelte:head>
	<title>About — Joshua Smith</title>
</svelte:head>

{#snippet summary()}
	<div class="hero">
		<div class="intro">
			<p class="name">Joshua Smith</p>
			<p class="bio">
				I am a data science and machine learning engineer at AWE. Outside of work
				I work on a mixture of projects. I also stand up a home server (if you can
				read this page it's currently up and running). Please get in contact with
				me to collaborate. Currently seeking a new role.
			</p>
		</div>

		<!-- Decorative once it is a portrait rather than a wireframe box: the name
		     above already carries what a screen reader needs. -->
		<div class="portrait" aria-hidden="true">
			<Placeholder note="portrait" lines={14} />
		</div>
	</div>

	<div class="band bleed stats">
		{#each STATS as [label, value, detail] (label)}
			<Panel {label}>
				<strong>{value}</strong>
				<span class="detail">{detail}</span>
			</Panel>
		{/each}
	</div>
{/snippet}

<Dashboard title="About" sections={SECTIONS} max="none">
	{#snippet body(section)}
		{#if section.id === 'summary'}
			{@render summary()}
		{:else}
			<div class={section.stack ? 'stack' : 'band bleed'}>
				{#each section.panels as [label, lines], i (i)}
					<Panel {label}>
						<Placeholder note="wireframe" {lines} />
					</Panel>
				{/each}
			</div>
		{/if}
	{/snippet}
</Dashboard>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(12rem, 28%);
		gap: clamp(1.5rem, 4vw, 3rem);
	}

	.intro {
		display: grid;
		align-content: center;
		gap: 0.75rem;
	}

	/* The one place on the page a name is the reading: bigger than a section's own
	   figure and set like the mono headlines elsewhere on the dashboard, since this
	   is the page's own headline rather than a number in a box. A name, not a
	   label, so it keeps its own case rather than the small caps everything else
	   on the dashboard is written in. */
	.name {
		margin: 0;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: clamp(1.8rem, 3.4vw, 2.75rem);
		font-weight: 700;
	}

	.bio {
		margin: 0;
		max-width: 44ch;
		color: var(--text-dim);
		font-size: 0.92rem;
		line-height: 1.6;
	}

	/* The same shape the overview tiles on the server page read in: a label, the
	   reading, and the line under it. */
	.stats strong {
		display: block;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: 1.15rem;
	}

	.stats .detail {
		color: var(--text-dim);
		font-size: 0.68rem;
	}

	/* Where the rail drops out of the way, the portrait has nowhere to stand
	   beside the text — it goes under it instead. */
	@media (max-width: 52rem) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
