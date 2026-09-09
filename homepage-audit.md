# Local Homepage Audit

**Reviewed:** 9 September 2026  
**Homepage:** http://127.0.0.1:5201/  
**Viewports:** 1280 × 720, 390 × 844 and 320 × 740

## Overall assessment

The homepage presents a technically capable engineer with substantial projects and unusually concrete professional achievements. I would investigate your work further. However, it currently makes your engineering ability easier to recognise than your suitability for a particular role.

The biggest weaknesses are **unsupported or ambiguous numerical claims, buried employment evidence and CV access, and a contact layout that clips on narrow phones**. The writing generally uses correct British English; precision and credibility need more attention than spelling.

I reviewed the rendered homepage at the viewport sizes above, then completed a second pass. I inspected homepage implementation where needed to verify findings. I did not visit the online homepage or audit other pages. External destinations and message delivery were not tested; no message was submitted. No site implementation files were changed.

## Issues found

### Issue 2 — The mobile hero delays useful evidence

**Location:** First screen at 390 × 844; bull artwork above “Joshua Smith”.

**Type:** Layout / UX  
**Severity:** Medium

**Problem:** Subjective visual recommendation. Your name begins roughly 520 px down the screen. The large artwork and space above it delay the professional introduction, and no project or employment evidence appears in the first screenful.

**Why it matters:** The most valuable mobile space establishes atmosphere before it establishes relevance.

**Recommended change:** Reduce the artwork and upper whitespace on mobile, bringing your name, proposition and first evidence closer to the top. Retain the bull as a distinctive visual.

**Suggested copy:** Not applicable.

### Issue 3 — CV access is buried at the end

**Location:** Contact: “Download CV”.

**Type:** CTA / UX  
**Severity:** High

**Problem:** Editorial recommendation. The CV appears only after four project summaries and the full experience section. It is also below GitHub and LinkedIn within Contact.

**Why it matters:** Downloading a CV is a primary hiring task, yet it takes considerable scrolling or prior knowledge of where to look.

**Recommended change:** Add a secondary CV link beside “View my work”, retaining the existing contact link.

**Suggested copy:**

> Download CV (PDF)

### Issue 4 — The server status wording undersells the engineering

**Location:** Hero status: “Site served from a box under my stairs. It seems to be working.”

**Type:** Content / Credibility  
**Severity:** Medium

**Problem:** Subjective recommendation. The first sentence has personality; “seems to be working” expresses uncertainty despite the component reporting an explicit online state.

**Why it matters:** It makes a functioning observability project sound less dependable than the evidence suggests.

**Recommended change:** Keep the personal detail, but describe the observed status precisely.

**Suggested copy:**

> My home server lives under the stairs. Latest status check: online.

### Issue 5 — Dashboard measurements lack sufficient scope

**Location:** Hero status: “UPTIME 17 d”, “NO INCIDENTS”, “LATENCY”, “P95”.

**Type:** Clarity / Credibility  
**Severity:** Medium

**Problem:** Definite ambiguity. The 17-day figure sits beside a 24-hour history, while “NO INCIDENTS” does not explicitly name its reporting window. “Latency” does not identify the request or measurement path. “P95” assumes specialist knowledge.

**Why it matters:** Readers can mistake a short monitoring window for a longer reliability record or assume latency describes their own page load.

**Recommended change:** Name each metric and its observation window. Identify the monitored endpoint and measurement origin once verified. Describe the absence of observed failures rather than implying comprehensive incident tracking.

**Suggested copy:**

> Uptime: 17 days
>
> No failed checks recorded in the last 24 hours
>
> 95th-percentile latency

The latency label also needs the actual measurement target; the homepage does not establish it.

### Issue 7 — Ancestree takes too long to define itself

**Location:** Projects → Ancestree: “Ten variations in…” and “a lightweight and simple way…”

**Type:** Content / Clarity  
**Severity:** Medium

**Problem:** Editorial recommendation. The opening scenario is recognisable, but the description postpones a straightforward definition. “Lightweight and simple” repeats a general benefit, while “natively on your machine” is awkward.

**Why it matters:** A visitor should quickly understand what the software is, who it helps and what it does.

**Recommended change:** Define the tool first, then explain provenance tracking and reuse.

**Suggested copy:**

> Ancestree is a dependency-free Python tool for tracking results and how they were produced. It runs locally, deduplicates stored data and reuses cached results for identical reruns.

### Issue 8 — “3.93× less” is mathematically ambiguous

**Location:** Ancestree: “Deduplication means it stores 3.93× less on a mixed corpus.”

**Type:** Clarity / Credibility  
**Severity:** Medium

**Problem:** Definite wording problem. Multiplicative “less” is ambiguous. “Stores less” also fails to distinguish reduced storage consumption from retaining less information. The comparison baseline is absent.

**Why it matters:** A performance claim should be easier to interpret than the implementation it summarises.

**Recommended change:** State storage usage as a proportion or percentage of a named baseline.

**Suggested copy:** If 3.93 is the baseline-to-deduplicated storage ratio:

> On the mixed benchmark dataset, deduplication used approximately 25% of the storage required without deduplication.

Verify that baseline before using this wording.

### Issue 9 — The demo is labelled as documentation

**Location:** Ancestree: “Interactive demo in the docs”; separate “Docs” link.

**Type:** CTA / UX  
**Severity:** Medium

**Problem:** Definite label mismatch. The inline “docs” link points directly to the demo, while another “Docs” link points to documentation. “TRY IT” itself is a non-interactive label.

**Why it matters:** The same word describes two different destinations, and the strongest proof of usability is presented as small supporting text.

**Recommended change:** Give the demo an explicit action label and place it with the other project actions.

**Suggested copy:**

> Try the interactive demo
>
> Read the documentation

### Issue 10 — Hosting claims are inaccurate in the local rendering

**Location:** Status and server project: “Site served from a box under my stairs” and “it’s currently hosting this website!”

**Type:** Consistency / Clarity  
**Severity:** Low

**Problem:** Definite, local-only discrepancy. This reviewed page was served by the local Vite process. The statements describe the production deployment.

**Why it matters:** In a development preview, the wording conflates the current page host with the remote server being monitored.

**Recommended change:** Describe the production deployment explicitly, or make the wording environment-aware. This is not evidence of a production hosting fault.

**Suggested copy:**

> The public website runs on my home server, which also supports my personal projects and publishes live telemetry through an API.

### Issue 12 — The collector badge does not measure what it claims

**Location:** Crypto orderflow: “25 retained days with no dropped rows”.

**Type:** Credibility / Content  
**Severity:** High

**Problem:** Definite implementation-backed issue. The number is derived from the time span of SSD-used-bytes telemetry. The displayed condition does not inspect retained market-data coverage or dropped-row counters.

**Why it matters:** This is presented as live evidence of collector reliability, but its underlying measurement cannot support that conclusion.

**Recommended change:** Remove the claim until the badge uses collector-specific retention and loss measurements. Disk-monitoring history should not be labelled as collection integrity.

**Suggested copy:** If retaining the current data source:

> 25 days of disk-usage telemetry available.

Prefer removing this badge from the collector summary until relevant measurements exist.

### Issue 13 — The Sharpe claim leaves the central research question unanswered

**Location:** Crypto orderflow: “The archive backs a market-neutral strategy with a 2.39 net Sharpe over 6.5 years.”

**Type:** Credibility / Clarity  
**Severity:** High

**Problem:** Definite missing context. The homepage does not say whether this is a backtest, paper trading or live performance; what “net” includes; or what dates were evaluated. The nearby 25-day claim makes the relationship to 6.5 years especially unclear.

**Why it matters:** A quantitative hiring manager will immediately question data provenance, evaluation design and costs.

**Recommended change:** Separate the live collector from the historical strategy evaluation. Name the result type, period, data source and relevant cost assumptions.

**Suggested copy:** Safe interim wording that removes the unexplained performance result:

> I built a cryptocurrency market-data collector that stores approximately 11.5 million rows a day across ten venues in Parquet.

Restore the research result once its context can be stated accurately.

### Issue 16 — The experience introduction blurs employment and personal work

**Location:** Under “Graduate Engineer, AWE”: “whether the source is sensors, radar, simulations or markets.”

**Type:** Content / Consistency  
**Severity:** Medium

**Problem:** Probable interpretation problem. Because this sentence belongs to the AWE entry, “markets” reads as part of that employment. The homepage otherwise presents market work as a personal project.

**Why it matters:** Readers should not have to infer which work was professional and which was independent.

**Recommended change:** Keep the AWE introduction specific to the work described beneath it, or move the broader statement above the employment timeline.

**Suggested copy:**

> At AWE, I work on signal processing, navigation and optimisation, turning noisy data and expensive simulations into useful estimates.

### Issue 17 — Important terminology assumes too much prior knowledge

**Location:** Experience: “AWE”, “RF sensors”, “TDOA cross-correlation”, “ML-assisted”.

**Type:** Clarity / Accessibility  
**Severity:** Medium

**Problem:** Definite unexplained terminology. The project and experience summaries assume both technical and organisational knowledge.

**Why it matters:** Recruiters and engineers from adjacent disciplines may understand the outcomes without understanding why the methods matter.

**Recommended change:** Explain specialised abbreviations on first use. Add a short factual description of AWE using your preferred public wording.

**Suggested copy:**

> Synchronised nine geographically distributed radio-frequency sensors…
>
> …used time-difference-of-arrival analysis to estimate signal locations…
>
> …built a machine-learning-assisted optimisation solver…

### Issue 19 — “7.5× fewer simulations” is an avoidable mathematical ambiguity

**Location:** Experience achievement heading.

**Type:** Clarity  
**Severity:** Medium

**Problem:** Definite wording problem. As with “3.93× less”, “7.5× fewer” is less clear than the actual before-and-after figures already provided.

**Why it matters:** This is one of your strongest achievements; the heading should communicate it without interpretation.

**Recommended change:** Use the direct reduction.

**Suggested copy:**

> Reduced simulation runs from 150,000 to 20,000

### Issue 21 — The experience section becomes a dense reading task on mobile

**Location:** Experience at 390 × 844.

**Type:** Layout / Content  
**Severity:** Medium

**Problem:** Observed visual issue with an editorial recommendation. Tool badges precede the achievements, and each achievement becomes a long paragraph in the narrow timeline column. The strongest evidence spans multiple screens.

**Why it matters:** A visitor scanning for outcomes must read through methods and implementation detail.

**Recommended change:** Keep the result headings, shorten the first explanatory sentence beneath each, and move tools after the achievements. Reduce unnecessary timeline indentation on small screens.

**Suggested copy:** For the first achievement:

> Synchronised nine distributed radio-frequency sensors to microsecond precision, then combined denoising and signal-timing analysis to achieve a median localisation error of 3 km.

### Issue 23 — The contact form is clipped at 320 px

**Location:** Contact at 320 × 740.

**Type:** Layout / UX / Accessibility  
**Severity:** High

**Problem:** Definite, reproduced defect. The form and inputs measure 302 px wide but begin at x = 33 px, extending to x = 335 px in a 320 px viewport. The right sides of the fields and CAPTCHA are clipped. The contact text also exceeds its intended panel width.

**Why it matters:** Some controls cannot be seen in full on narrow screens. The page does not provide horizontal scrolling to reveal the clipped content.

**Recommended change:** Allow the contact grid child and form to shrink, and use a CAPTCHA presentation that fits the available width. Retest at 320 px. The 390 px rendering fitted correctly.

**Suggested copy:** Not applicable.

### Issue 24 — Form boundaries are difficult to distinguish

**Location:** Contact: Name, Email and Message fields.

**Type:** Accessibility / Layout  
**Severity:** Medium

**Problem:** Observed presentation concern. The fields have an almost-black fill and a very dark border. The CAPTCHA has a much stronger outline, so the verification widget is easier to distinguish than the actual form controls.

**Why it matters:** Visitors with reduced contrast sensitivity may struggle to identify the input areas quickly.

**Recommended change:** Increase the contrast of field boundaries or their fill relative to the panel. Preserve a clear keyboard focus state.

**Suggested copy:** Not applicable. This is a visual finding, not a formal WCAG conformance verdict.

### Issue 26 — Repeated link names lose meaning outside their visual rows

**Location:** Four “Read case study” links and repeated “GitHub” links.

**Type:** Accessibility / CTA  
**Severity:** Low

**Problem:** Definite repetition; usability improvement rather than a claimed compliance failure. The links make sense visually beside each project, but their accessible names do not independently identify the project. The surrounding labelled groups help some navigation modes, but not every links-list presentation.

**Why it matters:** Users navigating by links may encounter several indistinguishable destinations.

**Recommended change:** Include the project name in each accessible link name, retaining concise visible labels if desired.

**Suggested copy:**

> Read the Ancestree case study
>
> View Ancestree on GitHub

Apply the same pattern to the remaining projects.

## Content gaps

### Genuine gaps that would materially improve the homepage

- **A concise professional proposition supported by current experience.** Your employer, relevant specialisms and target roles should connect immediately.
- **Research-result provenance.** The strategy result needs an evaluation type, date range, data source and cost definition.
- **Valid collector reliability evidence.** Retention and dropped-data claims need measurements from the collector or archive.
- **Evaluation context for engineering achievements.** Briefly distinguish simulation, recorded-data testing and operational use; identify important comparison baselines.
- **Clear contribution and adoption statements.** Explain what you designed and what others used, rather than relying on code percentage or broad deployment wording.
- **An explanation of AWE for unfamiliar readers.** A short descriptor is sufficient.

### Useful but optional

- Preferred working location and willingness to relocate, beyond “UK-based”.
- Availability or notice period, if you want recruiters to know it.
- Project dates or maintenance status.
- A brief explanation of the 2023–2024 interval, if there is relevant experience to include. The gap itself is not a defect.
- A concise form data-handling explanation. The CAPTCHA’s privacy link describes its provider, not your handling of enquiries.

You do not need testimonials, a personal photograph or invented business-impact figures to make this homepage credible.

## Strongest parts

- **The underlying experience is substantial.** Sensor synchronisation, navigation and simulation optimisation give a technical reviewer concrete subjects to investigate.
- **The projects offer visible routes to evidence.** Case studies, repositories, documentation, a package and a demo are more persuasive than a standalone skills list.
- **The ASCII artwork demonstrates your work directly.** It gives the site a recognisable identity and connects to an actual project.
- **The main navigation is clear and works.** Home, Projects, Experience and Contact use understandable labels. Tested section jumps positioned their targets correctly; “About this server” also reached the homepage summary.
- **The desktop project rows are organised consistently.** Project identity, explanation and actions are easy to distinguish.
- **The heading structure is coherent.** One H1, section H2s and subordinate H3s form a sensible hierarchy. Decorative illustrations are excluded from the accessibility tree appropriately.
- **British spelling is generally correct.** “Synchronised”, “localisation”, “optimisation”, “modelling”, “greyscale” and “colour” are appropriate. The serial commas are not American-English errors.
- **Contact options are explicit.** The email address is visible, and the CV link has a download attribute and a corresponding local PDF file. That establishes the intended behaviour, though I did not audit the PDF.

## Priority fixes

1. **Remove or replace “no dropped rows”.** Its current measurement does not support the claim.
2. **Qualify the Sharpe result.** Distinguish historical evaluation from live collection and name the evaluation assumptions.
3. **Fix the 320 px contact overflow.** The form and CAPTCHA are visibly clipped.
4. **Strengthen the hero proposition.** Put your current engineering work and relevant expertise beside your target roles.
5. **Expose the CV near the hero.** Make the primary hiring action immediately available.
6. **Clarify the experience metrics.** Use median-error terminology, explicit test settings and meaningful performance baselines.
7. **Replace “3.93× less” and “7.5× fewer”.** State proportions or before-and-after figures unambiguously.
8. **Shorten project and experience summaries for scanning.** Define each project promptly and prioritise outcomes on mobile.
9. **Make the Ancestree demo an explicit action.** “Try the interactive demo” describes the destination accurately.
10. **Polish the contact form.** Correct the invitation’s punctuation, strengthen field boundaries and identify required fields.
