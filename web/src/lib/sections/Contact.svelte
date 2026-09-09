<script>
	// Generated: `make site` in ../asciiArt rewrites AsciiRadioDish.svelte.
	import AsciiRadioDish from '$lib/components/AsciiRadioDish.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import ActionLink from '$lib/components/ActionLink.svelte';
	import LoadingDots from '$lib/components/LoadingDots.svelte';
	import { PUBLIC_WEB3FORMS_KEY } from '$env/static/public';
	import { ticking } from '$lib/clock.svelte.js';
	import { fetchWithTimeout } from '$lib/http.js';

	/* Measured, not guessed — the dish crops to whatever height .intro actually
	   renders at, same technique as the astronaut portrait (About.svelte). */
	let introHeight = $state(0);

	const EMAIL = 'js-195@outlook.com';
	/* Long enough that a slow but working submission isn't cut off, short enough
	   that "Sending…" can't hang forever on a stalled dependency. */
	const SUBMIT_TIMEOUT_MS = 25_000;

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
			label: EMAIL,
			href: `mailto:${EMAIL}`
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
	let status = $state('idle'); // idle | sending | sent | timeout | error

	/* A real edit, not our own post-send reset — bind:value assignments don't
	   dispatch input events, only the user typing does. Stale sent/error/timeout
	   feedback from a previous message shouldn't linger over a new draft. */
	function onDraftEdit() {
		if (status === 'sent' || status === 'error' || status === 'timeout') status = 'idle';
	}

	/* Web3Forms' zero-config hCaptcha (script in svelte:head) renders into the .h-captcha
	   div and drops a same-named hidden field for a plain HTML form to pick up on its own —
	   we post JSON ourselves, so it has to be read and forwarded by hand instead. */
	const captchaResponse = () => document.querySelector('[name="h-captcha-response"]')?.value ?? '';

	async function sendMessage(event) {
		event.preventDefault();
		status = 'sending';
		try {
			const response = await fetchWithTimeout(
				'https://api.web3forms.com/submit',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					body: JSON.stringify({
						access_key: PUBLIC_WEB3FORMS_KEY,
						subject: `New message from ${name} via js195.co.uk`,
						name,
						email,
						message,
						botcheck: honeypot,
						'h-captcha-response': captchaResponse()
					})
				},
				SUBMIT_TIMEOUT_MS
			);
			const result = await response.json();
			if (!result.success) throw new Error(result.message);
			status = 'sent';
			name = '';
			email = '';
			message = '';
		} catch (err) {
			/* Aborted on our own deadline, not a real answer either way — Web3Forms may
			   still have received it, so this can't promise the send failed. Values stay
			   put either way: only a confirmed 'sent' clears the form. */
			status = err.name === 'AbortError' ? 'timeout' : 'error';
		} finally {
			/* A solved challenge is single-use — Web3Forms' script exposes the same
			   window.hcaptcha global the real widget does, so a retry needs a fresh one. */
			window.hcaptcha?.reset();
		}
	}
</script>

<svelte:head>
	<script src="https://web3forms.com/client/script.js" async defer></script>
</svelte:head>

<section id="contact" class="page contact">
	<section class="surface-box panel">
		<div class="intro" bind:clientHeight={introHeight}>
			<h2 class="section-title">Contact</h2>

			<p class="headline">What's on your radar?</p>
			<p class="lede">
				Whether it's an opportunity, an interesting problem, or a question: get in contact.
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
						{#if channel.href.startsWith('mailto:')}
							<a class="value" href={channel.href}>
								<span class="icon"><Logo name={channel.icon} /></span>
								{channel.label}
							</a>
						{:else}
							<ActionLink
								variant="plain"
								direction={channel.download ? 'download' : 'external'}
								href={channel.href}
								download={channel.download}
								class="value"
							>
								<span class="icon"><Logo name={channel.icon} /></span>
								{channel.label}
							</ActionLink>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="rule"></div>

			<form onsubmit={sendMessage} oninput={onDraftEdit}>
				<h3 class="eyebrow">Or send a message</h3>
				<p class="form-note">All fields are required.</p>

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
					<input
						id="name"
						type="text"
						required
						autocomplete="name"
						readonly={status === 'sending'}
						bind:value={name}
					/>
				</div>

				<div class="field">
					<label for="email">Email</label>
					<input
						id="email"
						type="email"
						required
						autocomplete="email"
						readonly={status === 'sending'}
						bind:value={email}
					/>
				</div>

				<div class="field">
					<label for="message">Message</label>
					<!-- Read-only, not disabled, while sending — a value in flight can still be seen and
					     selected, it just can't be edited out from under the request that's carrying it. -->
					<textarea id="message" rows="4" required readonly={status === 'sending'} bind:value={message}
					></textarea>
				</div>

				<!-- Zero-config Web3Forms hCaptcha — their own site key, nothing to sign up for or hold a secret for.
				     Normal, not compact: compact is the squarer, taller layout — this is the wide, short one,
				     and it already carries its own dark card, so it isn't boxed again on top. -->
				<div class="h-captcha" data-captcha="true" data-theme="dark"></div>

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
						{:else if status === 'timeout'}
							<!-- Genuinely unknown whether this arrived — never claim a failure we can't back up. -->
							<p class="feedback err">
								Taking too long to confirm — it may still have gone through. Try again, or
								<a href="mailto:{EMAIL}">email me directly</a>.
							</p>
						{:else if status === 'error'}
							<p class="feedback err">
								Something went wrong — try again, or <a href="mailto:{EMAIL}">email me directly</a>.
							</p>
						{/if}
					</div>
				</div>
			</form>
		</div>

		<!-- Decorative: the copy beside it carries the meaning. Pinned to .intro's own
		     measured height, not left to stretch — same reason as About.svelte's .visual:
		     an unmeasured box would size itself off the art's own aspect ratio instead of
		     the column beside it, and cover/crop needs a definite height to crop against. -->
		<div class="bracket-frame" aria-hidden="true" style:height={introHeight ? `${introHeight}px` : 'auto'}>
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
		font-size: var(--fs-base);
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
		/* Between the timeline list's tight rhythm (0.4rem) and the rule's own
		   section-level spacing above — the touch target below is invisible now,
		   so the row's visible height no longer forces this gap wider on its own. */
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Icon lives inside the anchor now (not a sibling) so the whole row —
	   icon included — is one tap target, not just the label text. */
	a.value,
	.channels :global(.value) {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--color-foreground);
		font-family: var(--font-mono);
		font-size: var(--fs-base);
		text-decoration: none;
	}

	/* Invisible hit area, not real padding — same technique as the nav links and
	   ActionLink's own cta/back variants, so a ~44px touch target doesn't inflate
	   the visible row (and so the list above) past its natural text height. */
	a.value::before,
	.channels :global(.value)::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: max(100%, 2.75rem);
		transform: translateY(-50%);
	}

	.channels .icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 1.35rem;
		height: 1.35rem;
		color: var(--text-dim);
	}

	/* GitHub/LinkedIn/CV rows are ActionLink, not <a> — a.value's font-size can't reach them, so --link-size does the job instead. */
	.channels :global(.value) {
		--link-size: var(--fs-base);
	}

	a.value:hover {
		text-decoration: underline;
	}

	/* .bracket-frame is pinned to .intro's measured height (see style:height above) — the
	   frame's own overflow:hidden crops whatever the art doesn't fit into that box. */
	.bracket-frame {
		overflow: hidden;
	}

	.visual {
		display: grid;
		height: 100%;
	}

	/* cover + bottom: the dish is anchored to the frame's floor and cropped from the
	   top down, same treatment as the astronaut portrait (About.svelte). */
	.visual :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: bottom;
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

	.form-note {
		margin: 0;
		color: var(--text-faint);
		font-size: var(--fs-sm);
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

	/* Locked for the length of the request, not merely disabled-looking — still legible, just not editable. */
	input:read-only,
	textarea:read-only {
		color: var(--text-dim);
		cursor: default;
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

	.feedback a {
		color: inherit;
		text-decoration: underline;
	}

	@media (max-width: 60rem) {
		.panel {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* Dish needs real width to read — drop it rather than crop it further on a phone. */
	@media (max-width: 40rem) {
		.bracket-frame {
			display: none;
		}
	}
</style>
