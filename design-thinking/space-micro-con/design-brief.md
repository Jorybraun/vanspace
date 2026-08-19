# Design brief — Vancouver Space Micro-Conference

**Mode trail:** Empathize → Define → Ideate → Prototype (packet)  
**Diamond:** Discover → Define | Develop → Deliver (plan)  
**Date:** 2026-08-05  
**Workspace:** `/Users/hans/Code/CONFERENCE`

---

## Frame

| Field | Value |
| --- | --- |
| **Topic** | Brand, plan, and land a micro-conference in Vancouver (venue open: Space Centre *or* Science World) with Cognition/Devin as lead sponsor and Kent C. Dodds as keynote |
| **Stakeholder** | You (organizer / community lead) |
| **Timebox** | Design pass now; build after approval |
| **In scope** | Brand system, marketing site concept, agentic brand moment, ops checklist, tickets path, outreach templates, sponsor deck structure, phased delivery plan |
| **Out of scope (this pass)** | Final legal contracts, paid ads spend, speaker contracts beyond naming Kent, full multi-track CFP platform |
| **Known constraints** | Venue **not locked** — Space Centre (original) vs Science World under consideration (`ops/venue.md`); Devin design assets in `brand/devin-assets`; aesthetic targets = Cursor Victoria layout + Kindolphin monochrome pointillism + science-destination architecture; Cognition/Devin main sponsor |
| **Done means** | Approved recommendation + `implementation-plan.md` ready for `/plan` / build |

---

## 1. Discover — evidence notes

### 1.1 People

| Role | Who | Jobs |
| --- | --- | --- |
| **Primary attendee** | Vancouver / lower-mainland software engineers, AI builders, community organizers | Learn from a headliner, meet peers, feel “this city has gravity,” leave with one sharp idea |
| **Secondary attendee** | Students, early-career, founders evaluating agent tooling | Network up, resume signal, free/cheap access |
| **Sponsor buyer** | DevRel / marketing / community at tool companies | Pipeline + brand in a high-signal room; measurable ROI |
| **Venue partner** | Space Centre and/or Science World rentals | Revenue, mission-aligned programming, clean ops |
| **Flagship target** | Cognition / Devin | Community presence, product narrative, engineer trust |

### 1.2 Context (observed + inferred)

- **Venue (open, 2026-08-06):** Original plan = H.R. MacMillan Space Centre (saucer, planetarium). **Also considering Science World** (TELUS World of Science, False Creek dome). Decision + compare table: `ops/venue.md`. Space Centre rentals still on spacecentre.ca; Science World facility rentals on scienceworld.ca. [`observed` — organizer preference update]
- **Venue A detail:** Space Centre — iconic “saucer,” capacities roughly ~40–230 depending on room. [`observed` — spacecentre.ca]
- **Layout reference:** [cursorvictoria.com](https://www.cursorvictoria.com/?utm_source=luma) (“Cursor · Codechella”) — single-day event marketing site: tight hero, schedule, social proof, ticket CTA, warm neutral palette. [`observed`]
- **Aesthetic reference:** Kindolphin ([ac-bu.info/kindolphin](https://ac-bu.info/kindolphin/)) — monochromatic cream field, single muted color mass, heavy pointillist / stipple sky, quiet serif wordmark. [`observed` from provided screenshot]
- **Hero photo reference:** Night shot of Space Centre saucer + metal sculpture, “A Space Adventure” treatment. [`observed` — user Image #1]
- **Sponsor brand:** Devin design system — monochrome-first (ink `#191919`, beige `#f7f6f5`), blue accent `#317cff`, NB International / Plex Mono, square CTAs, engineer-to-engineer voice. Assets copied to `brand/devin-assets/`. [`observed`]
- **Prior local motion:** Devin Hackathon Vancouver notes exist (venue shopping, ~$2–2.5k budgets, 60–100 pax). [`observed` — Downloads notes] → this event is a **micro-conference**, not a full-day hackathon (`inferred` upgrade in ambition).
- **Keynote lock:** Kent C. Dodds. [`observed` — user]
- **Flagship target:** Cognition / Devin for the $10k Flagship tier (tier ≠ company name). [`observed` — user]

### 1.3 Current journey (organizer)

```text
Idea → scramble venue → beg speakers → Luma link → post in Slack/Discord
  → partial sponsor deck in a Google Doc → day-of chaos → no reusable brand
```

**Pains:** no coherent brand, weak sponsor story, tickets feel like a Meetup, site is not memorable, no checklist system.  
**Cost:** empty seats, undervalued sponsorship, burnout, one-off assets.

### 1.4 Competitive / adjacent patterns

| Pattern | Example | Takeaway |
| --- | --- | --- |
| Brand-led one-pager | Cursor Codechella | One scroll sells date + place + people + ticket |
| Tool meetup | Typical Luma | Fast but commodity; hard to upsell sponsors |
| Big conf | React Summit / etc. | Overkill for micro; multi-track ops debt |

### 1.5 Constraints (hard)

1. Physical venue identity must feel like the Space Centre (not a generic WeWork).
2. Devin/Cognition must read as **lead sponsor**, not “the whole conference is a product launch” (unless you choose that later).
3. Monochrome + single accent (Kindolphin-adjacent), not rainbow SaaS.
4. Signature interaction requested: **pointillist building → click/scroll morph into orbiting universe graph**.

---

## 2. Define

### 2.1 JTBD

**Attendee**  
> When I see yet another “AI meetup” on Luma, I want a **one-day, high-signal micro-conference** with a real keynote and a venue that feels like an event, so I can **spend a Saturday becoming sharper and more connected without wasting a weekend on fluff**.

**Sponsor**  
> When my budget for community is thin, I want a **tight, branded room of builders** with clear deliverables, so I can **buy attention that doesn’t feel like a booth farm**.

**Organizer**  
> When I’m running this alone / with a small crew, I want a **brand + site + ops kit that compounds**, so I can **sell tickets and sponsorships without reinventing the wheel every week**.

### 2.2 POV

> **Vancouver builders** need a **micro-conference that feels inevitable and beautiful**, because **generic Luma nights don’t create lore, and without lore you can’t recruit headliners or serious sponsors**.

### 2.3 Problem statement

```text
For Vancouver software builders and AI practitioners,
who currently bounce between ad-hoc meetups and big remote conferences,
the problem is there is no intimate, brand-grade, agent-era micro-conference
with a memorable place and a clear ticket/sponsor machine,
which matters because without it community energy dissipates and sponsors default to noise channels.

Success looks like:
  - 80–150 tickets sold (capacity-dependent) before day-of
  - ≥1 lead sponsor (Devin) + ≥2 supporting sponsors closed
  - Site conversion: visit → ticket intent ≥ industry-good for event pages
  - People screenshot the hero and share it unprompted
  - Checklist completes with zero “we forgot X” day-of fires
```

### 2.4 Success metrics

| Metric | Target (assumed, calibrate later) |
| --- | --- |
| Tickets sold | 80% of hard cap 14 days pre-event |
| Sponsor revenue | Covers venue + F&B + AV + 20% contingency |
| Brand | Unprompted shares of hero / orbit graphic |
| Ops | Day-of run-of-show with ≤2 severity-1 incidents |
| Post-event | ≥40% of attendees opt into community list |

### 2.5 Non-goals (this pass / v1)

- Multi-city franchise
- Full multi-track CFP platform
- Building a custom ticketing backend (use Luma / Eventbrite / Tito)
- Turning the conference into a Devin product launch only
- Photoreal 3D game engine for the hero (canvas/WebGL particle system is enough)

### 2.6 Riskiest assumptions (test first)

| # | Assumption | Tag | How to test |
| --- | --- | --- | --- |
| R1 | Space Centre can be booked for our date/format at affordable cost | `unresolved` | Rental inquiry this week |
| R2 | Kent C. Dodds date is confirmable / already soft-locked | `unresolved` | Confirm hold in writing |
| R3 | “Pointillism → orbit graph” is delightful, not gimmicky | `assumed` | 10s silent clip test with 5 builders |
| R4 | Sponsors will pay $3–15k for a micro room with this brand | `assumed` | 5 warm outreach emails with deck |
| R5 | Name + monochrome look won’t be confused with Devin product | `assumed` | Show brand board to 3 non-Devin people |

---

## 3. Develop — concepts (≥3)

### Concept A — “Codechella clone + logo swap”
- **One-liner:** Faithful Cursor Victoria layout; Space Centre photo; Devin logos in sponsor row.
- **Experience:** Static hero image, schedule, speakers, Get tickets.
- **Mechanism:** Next/Astro static site + Luma embed.
- **D/F/V:** D3 · F5 · V3  
- **Risks:** Forgettable; doesn’t justify Space Centre premium.  
- **Doesn’t do:** Signature motion, agentic brand, Kindolphin depth.

### Concept B — “Orbit” (recommended hybrid)
- **One-liner:** Kindolphin monochrome pointillism as the brand language; Space Centre saucer as living particle system that dissolves into a solar-system graph of people, talks, and agents.
- **Experience:** Land on quiet cream field → saucer resolves from stipple → scroll/click → building becomes n-body universe (planets = keynote, sessions, sponsors; moons = community). Site chrome follows Codechella information architecture.
- **Mechanism:** Canvas/WebGL particles (or high-quality 2D canvas); content sections below; Luma tickets; agentic “Mission Control” companion (chat or guided planner) as brand layer, not core booking.
- **D/F/V:** D5 · F4 · V4  
- **Risks:** Motion overruns schedule; need art direction discipline.  
- **Doesn’t do:** Full multiplayer game, custom payment rails.

### Concept C — “All-in Devin product conference”
- **One-liner:** Devin brand system end-to-end; Space Centre is just a cool room for a Devin field event.
- **Experience:** Looks like a satellite of devin.ai.
- **D/F/V:** D3 · F5 · V2 (for independent community lore) / V4 (for Cognition internal)  
- **Risks:** Other sponsors choke; community feels owned.  
- **Doesn’t do:** Ownable city brand independent of one vendor.

### Concept D — “Planetarium night school” (ambitious)
- **One-liner:** Full-dome keynote + exhibits takeover; the site is a mini mission briefing.
- **D/F/V:** D5 · F2 · V2  
- **Risks:** Venue package cost/complexity explodes.  
- **Doesn’t do:** Ship fast.

### Concept scoring summary

| Concept | Desirability | Feasibility | Viability | Notes |
| --- | --- | --- | --- | --- |
| A Codechella clone | 3 | 5 | 3 | Safe floor |
| **B Orbit hybrid** | **5** | **4** | **4** | **Recommended** |
| C Devin product event | 3 | 5 | 2–4 | Only if Cognition owns fully |
| D Dome takeover | 5 | 2 | 2 | Later if budget allows |

**Why B wins:** Maximum lore-per-dollar, respects Devin as lead sponsor without swallowing the event, matches both visual refs, and the agentic orbit graph *is* the brand (not a bolted-on chatbot).

---

## 4. Recommendation — brand, plan, land

### 4.1 Working brand name options

Pick one in founder decisions; design works for any.

| Name | Why it works | Risk |
| --- | --- | --- |
| **Ground Station** | Literal Space Centre room name energy; “agents on the ground” | Could sound military |
| **Apogee** | Peak of the orbit; craft metaphor | Needs subtitle |
| **Orbit Vancouver** | Clear, shareable, matches hero interaction | Slightly generic |
| **Fleet** | Devin fleets of agents + constellation | Too Devin-owned |
| **Hohmann** | Transfer orbit; deeply nerd-coded | Pronounceability |

**Provisional recommendation:** **Orbit** (event) / tagline **“A micro-conference for builders at the edge of the stack.”**  
Full lockup example: **Orbit · Vancouver** · *at the MacMillan Space Centre*

### 4.2 Visual system (Kindolphin × Space × Devin restraint)

| Token | Value | Role |
| --- | --- | --- |
| `--ground` | `#F4F0E8` (warm cream) | Page canvas (Kindolphin) |
| `--ink` | `#1A1A1A` | Primary type |
| `--mist` | `#8B8499` dusty lilac-slate | **Single brand color** — pointillism, silhouettes, links |
| `--mist-deep` | `#5C5668` | Hover / secondary mass |
| `--hairline` | `rgba(26,26,26,0.08)` | Rules |
| `--sponsor-blue` | `#317CFF` | **Only** for Devin/Cognition official marks & approved sponsor accents — not general UI |
| Type display | NB International Pro **or** a quiet serif for wordmark (Kindolphin energy) + Plex Mono labels | Headlines / eyebrows |
| Type body | IBM Plex Sans / Inter | Reading |
| Shape | Mostly square CTAs (Devin marketing DNA); soft only in particle field | |
| Texture | **Stipple / pointillism as brand material** — not gradients, not glass | |

**Logo direction:** Wordmark in quiet serif or NB; optional mark = abstract orbit (two ellipses + focus) built from dots, never a cartoon rocket.

### 4.3 Signature site interaction — “Saucer → Cosmos”

**Storyboard**

1. **Idle:** Cream field. Sparse mist-colored dots drift. Silhouette of Space Centre saucer slowly resolves from denser stipple (pointillism). Wordmark top-center: `Orbit`.
2. **Engage (scroll or click “Enter”):** Particles that formed the building scatter with a soft shockwave.
3. **Reform:** Particles re-cluster into an n-body system:
   - **Star (center):** Keynote — Kent C. Dodds
   - **Planets:** Sessions / tracks (e.g. Agents, DX, Community)
   - **Moons:** Sponsors (Devin largest moon or co-orbital)
   - **Comets:** Ticket CTA / schedule anchors
4. **Hover a body:** Pull label + one-line; click smooth-scrolls to that section.
5. **Reduced motion:** Static pointillist saucer + skip-to-content; no forced animation.

**Technical sketch (feasibility):** 2D canvas particle system (5–12k points) from a preprocessed silhouette mask of the Space Centre photo; force simulation (d3-force or custom) for orbit state. Mobile: lower particle count + static fallback image.

### 4.4 Agentic brand layer (cool, not gimmick)

**Name:** **Mission Control** (on-site brand voice for the agent).

| Surface | Behavior |
| --- | --- |
| Site companion | Lightweight agent that answers agenda, accessibility, “who should I meet if I care about X,” built on a small FAQ + schedule knowledge base |
| Social | Mission Control posts countdown, speaker drops, orbit map teases |
| Day-of | Printed QR → Mission Control “what’s next” + room wayfinding |
| Sponsor demo slot (optional) | Devin live: “Mission Control was co-built with agents” — meta but earned |

**Principle:** The orbit graph *is* the agentic metaphor (systems of bodies coordinating). Chat is optional seasoning; the graph is the meal.

### 4.5 Site IA (Codechella-shaped)

```text
[ sticky: small mark or wordmark · Schedule · Speakers · Venue · Get tickets ]

1. Hero (CENTER STAGE) — **spacebar wordmark** (van [space] .dev) dead-center
     · optional pointillist saucer / cosmos field *behind* or *around* the logo (not replacing it)
     · date · place · one-line under logo · primary CTA (tickets only)
2. Proof strip — “Keynote · Kent C. Dodds” · “Flagship sponsor — [Company]” when sold
3. About — 2–3 sentences micro-conference thesis
4. Schedule — timeline (Codechella density)
5. Speakers — Kent featured large; others as grid fills
6. Venue — Space Centre story + map + transit
7. Sponsors (public) — logo wall ONLY for confirmed sponsors
8. FAQ — tickets, refunds, code of conduct, accessibility
9. Footer — spacebar mark + hello@vanspace.dev
```

**Hero rule:** The **logo is the centerpiece**, not a photo of the building with a corner logo. Space Centre art supports the mark (pointillism / particles), it doesn’t bury it.

**Hard rule — sponsors on the marketing site vs deck**

| On the **public site** | In the **private sponsor deck** (PDF / Notion / link, not linked from nav as “pricing”) |
| --- | --- |
| Confirmed sponsor **logos** | Full tiers: $10k / $7k / $5k / $2k |
| “Flagship sponsor — [Company]” if locked | Value props, deliverables matrix, exclusivity |
| Optional: `sponsors@[domain]` or mailto | One-pager, SOW, invoice process |
| **Never** dollar amounts, slot counts, or package menus | Outreach templates + CRM |

Tickets: **Luma** (fast, social) or **Tito** (stronger for paid + discounts). Link from every CTA; do not custom-build checkout in v1.  
Sponsor sales: **deck-only** — share link in email after interest, not as a public `/sponsors` pricing page.

### 4.6 Full system map — brand · plan · land

```text
                    ┌─────────────────┐
                    │  BRAND SYSTEM   │  name, color, type, voice, orbit mark
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           v                 v                 v
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │ MARKETING  │    │ SPONSORS   │    │  OPS       │
    │ site       │    │ deck       │    │ checklist  │
    │ social     │    │ one-pager  │    │ run-of-show│
    │ email      │    │ outreach   │    │ day-of     │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                 │
          └────────────┬────┴─────────────────┘
                       v
                 ┌──────────┐
                 │  TICKETS │  Luma/Tito → list → day-of check-in
                 └──────────┘
```

---

## 5. Prototype specs (enough to build against)

### 5.1 Content blocks (copy starters)

**Hero**  
> Orbit · Vancouver  
> A micro-conference for builders.  
> One keynote. One room that looks like the future. Zero fluff.  
> **MacMillan Space Centre** · *Date TBD*  
> [ Get tickets ]

**About**  
> Vancouver doesn’t need another panel about “the future of AI.”  
> It needs a day where practitioners get sharp together — under a real planetarium dome’s neighbor, with a keynote worth the ferry, and a room small enough that conversations stick.

**Keynote**  
> Kent C. Dodds — [title TBD with speaker]  
> Why he matters here: teaching craft that scales; the anti-hype engineer’s engineer.

### 5.2 State matrix (hero)

| State | Visual | Input | Next |
| --- | --- | --- | --- |
| `boot` | Cream + sparse dots | auto | `saucer` |
| `saucer` | Pointillist building resolved | scroll/click | `scatter` |
| `scatter` | Shockwave dissolve (400–700ms) | auto | `cosmos` |
| `cosmos` | Orbit graph interactive | hover/click bodies | section anchors |
| `reduced-motion` | Static saucer PNG + content | — | skip anim |
| `error` (WebGL fail) | Static hero image + CTAs | — | full page usable |

### 5.3 Empty / loading / recovery

| Surface | Empty | Loading | Error |
| --- | --- | --- | --- |
| Speakers (only Kent) | “More speakers announcing soon” with orbit placeholders | Skeleton cards | Hide grid, keep Kent |
| Sponsors (public) | Confirmed logos only; if none yet, omit section or “Flagship sponsor — [Company]” when sold | Logo shimmer | Hide section |
| Tickets | Sold out waitlist form | Button spinner | Fallback email register |
| Mission Control | “Offline — see FAQ” | Typing indicator | Graceful degrade to FAQ anchors |

### 5.4 Voice

- Sentence case. Short. Engineer-to-engineer (aligned with Devin voice guidelines, but **event-owned**).
- No rocket emoji spam. One deliberate cosmic metaphor max per block.
- Periods on short lines. Almost no exclamation marks.

---

## 6. Ops system (plan)

### 6.1 Phase timeline (generic; bind dates when known)

| Phase | Window | Outcomes |
| --- | --- | --- |
| **0 Foundations** | Week 0–1 | Venue quote, Kent hold, name lock, brand board |
| **1 Sell the room** | Week 1–3 | Site live, Luma live, lead sponsor assets, soft announce |
| **2 Fill gravity** | Week 3–6 | Speakers 2–4, sponsor tier closes, community blitz |
| **3 Final approach** | Week −2–0 | Run-of-show, AV, catering, check-in, Mission Control freeze |
| **4 Re-entry** | Week +1 | Recap, photos, sponsor report, list nurture, “Orbit 2?” |

### 6.2 Master checklist (condensed — full in `ops/checklist.md`)

- [ ] Venue hold + insurance + AV list  
- [ ] Speaker agreements + travel  
- [ ] Sponsor contracts + invoice + logo kit  
- [ ] Site live + analytics + OG image  
- [ ] Tickets live + promo codes  
- [ ] Code of conduct + accessibility note  
- [ ] Run-of-show + roles (host, check-in, AV, floating)  
- [ ] Day-of kit (badges optional, tape, batteries, backups)  
- [ ] Post-event survey + sponsor report  

### 6.3 Ticket strategy

| Tier | Price band (CAD, assumed) | Purpose |
| --- | --- | --- |
| Early bird | $29–49 | Velocity |
| Standard | $59–89 | Default |
| Student / community | $15–25 | Access |
| Sponsor comp | $0 | Allocation in packages |

Hard cap from venue layout (assume 100–150 until confirmed). Waitlist after sellout.

### 6.4 Sponsor structure (deck spine)

| Tier | Price (assumed CAD) | Deliverables |
| --- | --- | --- |
| **Flagship** (1) | **$10,000** | Flagship Keynote + panel + top brand line + 12–15 comps + exclusivity (target buyer: Devin; tier ≠ company name) |
| **Gold** (2–3) | **$7,000** | Fireside 30m + table + 8 comps |
| **Silver** (1) | **$5,000** | Panel or lightning + table + 5 comps |
| **Bronze** (3–5) | **$2,000** | Logo + 2 comps · no stage |

Full narrative + outreach lives in `ops/sponsor-deck-outline.md` and `ops/outreach-templates.md`.

---

## 7. Open questions (founder decisions)

1. **Name lock:** Orbit / Ground Station / Apogee / other?  
2. **Date:** Target month? Weekend vs evening?  
3. **Format length:** Half-day talks vs full-day with workshops?  
4. **Ticket price ceiling** and comp policy?  
5. **Cognition lead ask locked at $10k** — CAD or USD invoicing? Payment timing vs venue deposit?  
6. **Kent status:** Soft hold vs signed? Talk title?  
7. **Domain:** **`vanspace.dev` owned** (Cloudflare). Align event name with VanSpace.  
8. **Single accent color:** Dusty lilac-slate (Kindolphin) vs deep space indigo vs pure ink-only?

---

## 8. Test plan (before heavy build)

| Test | Method | Pass criteria |
| --- | --- | --- |
| Hero delight | 10s silent video to 5 builders | ≥3 say “I’d share this” |
| Name clarity | 3 outsiders: “what is this?” | “tech conference in Vancouver / space centre” |
| Sponsor deck | 2 warm intros | 1 meeting booked |
| Ticket CTA | Fake door “Get tickets” → waitlist | ≥20 signups in 72h after soft launch |
| A11y | prefers-reduced-motion + keyboard | All content reachable |

---

## 9. Evidence tag legend used

- `observed` — primary sources, assets, sites, user statements  
- `inferred` — reasonable implications  
- `assumed` — working defaults to validate  
- `unresolved` — must be answered before hard spend  

---

## Recommendation (one paragraph)

**Yes — we can brand, plan, and land this.** Ship **Orbit · Vancouver** (or your locked name) as a Kindolphin-monochrome micro-conference brand with the MacMillan Space Centre saucer as a **pointillist organism that becomes an orbit graph**, Codechella-grade site IA, Devin/Cognition as lead sponsor in restrained blue, Kent C. Dodds as gravity well, Luma/Tito for tickets, and a full ops + sponsor + outreach kit so the event is a system—not a one-off poster. First delivery slice is brand lock + static site shell + waitlist; the particle cosmos and Mission Control agent follow once name/date/venue are real.

**Next:** Approve (or amend) this recommendation → run **`/plan`** against `implementation-plan.md`. No production build until that plan is accepted.
