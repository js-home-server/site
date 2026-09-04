<script>
	// Generated: `make site` in ../asciiArt rewrites AsciiRadioDish.svelte.
	import AsciiRadioDish from '$lib/components/AsciiRadioDish.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import LoadingDots from '$lib/components/LoadingDots.svelte';
	import { PUBLIC_WEB3FORMS_KEY } from '$env/static/public';
	import { ticking } from '$lib/clock.svelte.js';

	/* Kept live, not stamped at build time. Intl's own tz database handles BST/GMT — no manual DST rule to forget. */
	const TIME_ZONE = 'Europe/London';
	const timeFormat = new Intl.DateTimeFormat('en-GB', {
		timeZone: TIME_ZONE,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	const zoneFormat = new Intl.DateTimeFormat('en-GB', {
		timeZone: TIME_ZONE,
		timeZoneName: 'short'
	});
	const offsetFormat = new Intl.DateTimeFormat('en-GB', {
		timeZone: TIME_ZONE,
		timeZoneName: 'shortOffset'
	});
	const zonePart = (formatted) => formatted.find((part) => part.type === 'timeZoneName').value;

	/* Every half minute — only hours/minutes shown, so nothing faster would change. */
	const clock = ticking(30_000);

	let localTime = $derived(timeFormat.format(clock.now));
	let localZone = $derived(zonePart(zoneFormat.formatToParts(clock.now)));
	let localOffset = $derived(zonePart(offsetFormat.formatToParts(clock.now)).replace('GMT', 'UTC'));

	/* In the order I'd rather be reached. `icon` is the mark $lib/logos.js draws. */
	const CHANNELS = [
		{
			key: 'email',
			icon: 'Email',
			label: 'js-195@outlook.com',
			href: 'mailto:js-195@outlook.com'
		},
		{
			key: 'github',
			icon: 'GitHub',
			label: 'github.com/JS195',
			href: 'https://github.com/JS195'
		},
		{
			key: 'linkedin',
			icon: 'LinkedIn',
			label: 'LinkedIn',
			href: 'https://www.linkedin.com/in/joshua-smith-487846181/'
		},
		{
			key: 'cv',
			icon: 'CV',
			label: 'Download CV',
			href: '/cv.pdf',
			download: 'joshua-smith-cv.pdf'
		}
	];

	/* Posted straight to Web3Forms — this site is static, no server route of its
	   own. Honeypot: a real visitor never sees it; Web3Forms drops non-empty submissions. */
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let honeypot = $state('');
	let status = $state('idle'); // idle | sending | sent | error

	async function sendMessage(event) {
		event.preventDefault();
		status = 'sending';
		try {
			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({
					access_key: PUBLIC_WEB3FORMS_KEY,
					subject: `New message from ${name} via js195.co.uk`,
					name,
					email,
					message,
					botcheck: honeypot
				})
			});
			const result = await response.json();
			if (!result.success) throw new Error(result.message);
			status = 'sent';
			name = '';
			email = '';
			message = '';
		} catch {
			status = 'error';
		}
	}
</script>

<section id="contact" class="page contact">
	<section class="surface-box panel">
		<div class="intro">
			<h2 class="section-title">Contact</h2>

			<p class="headline">What's on your radar?</p>
			<p class="lede">
				Whether it's an opportunity, an interesting problem, or a question: get in contact,
				I'd love to connect.
			</p>

			<p class="clock">
				<span class="dot" aria-hidden="true"></span>
				UK-based · {localTime} {localZone}
				<span class="offset">({localOffset})</span>
			</p>

			<div class="rule"></div>

			<ul class="channels">
				{#each CHANNELS as channel (channel.key)}
					<li>
						<div class="icon"><Logo name={channel.icon} /></div>
						{#if channel.href.startsWith('mailto:')}
							<a class="value" href={channel.href}>{channel.label}</a>
						{:else}
							<ActionLink
								variant="plain"
								direction={channel.download ? 'download' : 'external'}
								href={channel.href}
								download={channel.download}
								class="value"
							>
								{channel.label}
							</ActionLink>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="rule"></div>

			<form onsubmit={sendMessage}>
				<h3 class="eyebrow">Or send a message</h3>

				<!-- Off-screen not display:none — some bots skip fields known to be inert. aria-hidden too, since tabindex="-1" alone still lets browse mode land on it. -->
				<input
					type="text"
					name="botcheck"
					class="botcheck"
					tabindex="-1"
					aria-hidden="true"
					autocomplete="off"
					bind:value={honeypot}
				/>

				<div class="field">
					<label for="name">Name</label>
					<input id="name" type="text" required autocomplete="name" bind:value={name} />
				</div>

				<div class="field">
					<label for="email">Email</label>
					<input id="email" type="email" required autocomplete="email" bind:value={email} />
				</div>

				<div class="field">
					<label for="message">Message</label>
					<textarea id="message" rows="4" required bind:value={message}></textarea>
				</div>

				<div class="actions">
					<button type="submit" disabled={status === 'sending'}>
						{#if status === 'sending'}
							Sending <LoadingDots />
						{:else}
							Send message
						{/if}
					</button>
					<!-- role="status"/aria-live so a screen reader announces the result unprompted, the way a sighted user just sees it appear. Polite, not assertive. -->
					<div role="status" aria-live="polite">
						{#if status === 'sent'}
							<p class="feedback ok">Sent — thanks, I'll get back to you.</p>
						{:else if status === 'error'}
							<p class="feedback err">
								Something went wrong — try again, or email me directly instead.
							</p>
						{/if}
					</div>
				</div>
			</form>
		</div>

		<!-- Decorative: the copy beside it carries the meaning. -->
		<div class="bracket-frame" aria-hidden="true">
			<div class="visual"><AsciiRadioDish /></div>
		</div>
	</section>
</section>

<style>
	.contact {
		gap: clamp(1.5rem, 3vh, 2rem);
	}

	/* Copy + channels left, form + dish right. Box itself is .surface-box (app.css) — this is just the split. */
	.panel {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr);
		gap: clamp(1.5rem, 4vw, 3rem);
	}

	.intro {
		display: grid;
		gap: 1rem;
		align-content: start;
	}

	/* Same voice as the hero's tagline — a claim, not a label, so body face + bold rather than mono. */
	.headline {
		margin: -0.5rem 0 0;
		color: var(--color-foreground);
		font-size: var(--fs-subhead);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.lede {
		margin: 0;
		max-width: 62ch;
		color: var(--text-dim);
		font-size: var(--fs-sm);
		line-height: 1.6;
	}

	.rule {
		height: 1px;
		margin: 0.5rem 0;
		background: var(--color-border);
	}

	.clock {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		letter-spacing: 0.02em;
	}

	.clock .dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: var(--mint);
		box-shadow: 0 0 0.5rem var(--mint);
	}

	.clock .offset {
		color: var(--text-faint);
	}

	.channels {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.channels li {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: center;
	}

	.channels .icon {
		display: grid;
		place-items: center;
		justify-self: center;
		width: 1.35rem;
		height: 1.35rem;
		color: var(--text-dim);
	}

	a.value {
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-base);
		text-decoration: none;
	}

	/* GitHub/LinkedIn/CV rows are ActionLink, not <a> — a.value's font-size can't reach them, so --link-size does the job instead. */
	.channels :global(.value) {
		--link-size: var(--fs-base);
	}

	a.value:hover {
		text-decoration: underline;
	}

	/* Rasterised now (F11) — no cell grid to size by, just fills the box at its own baked-in 137:104 aspect ratio. */
	.visual {
		display: grid;
	}

	.visual :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}

	/* Stacked, not two-up — this lives in the .intro column, under half the box's width. */
	form {
		display: grid;
		gap: 1rem;
	}

	form .eyebrow {
		display: block;
		margin-bottom: -0.25rem;
		font-size: var(--fs-base);
	}

	.field {
		display: grid;
		gap: 0.4rem;
	}

	label {
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	input,
	textarea {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-control);
		background: var(--color-background);
		color: var(--color-foreground);
		font: inherit;
		font-family: var(--font-sans);
		font-size: var(--fs-base);
		padding: 0.6rem 0.7rem;
	}

	textarea {
		resize: vertical;
	}

	/* On top of the global :focus-visible ring (app.css) — same border-colour swap every focused control gets. */
	input:focus-visible,
	textarea:focus-visible {
		border-color: var(--mint);
	}

	/* Off-screen, not display:none/visibility:hidden — some bots skip those but still find this. */
	.botcheck {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	button {
		border: 1px solid var(--mint);
		border-radius: var(--radius-control);
		background: none;
		color: var(--mint);
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		padding: 0.7rem 1.1rem;
		cursor: pointer;
		transition: background-color 160ms ease;
	}

	button:hover:not(:disabled),
	button:focus-visible:not(:disabled) {
		background: color-mix(in srgb, var(--mint) 12%, transparent);
	}

	button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.feedback {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
	}

	.feedback.ok {
		color: var(--mint);
	}

	.feedback.err {
		color: var(--coral);
	}

	@media (max-width: 60rem) {
		.panel {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
