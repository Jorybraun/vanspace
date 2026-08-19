# Implementation plan — Orbit micro-conference system

**Source brief:** [design-brief.md](./design-brief.md)  
**Status:** Awaiting approval  
**Policy:** Implement only the accepted slice. Do not expand scope mid-build.

---

## 1. Link back to design

| Item | Decision |
| --- | --- |
| Problem | Vancouver lacks a brand-grade micro-conference machine (lore + tickets + sponsors) |
| Recommendation | **Concept B — Orbit hybrid**: Kindolphin monochrome + Space Centre pointillism→cosmos + Codechella IA + Flagship/Gold/Silver/Bronze ladder |
| Non-goals | Custom ticketing, multi-city, dome takeover, full Devin product-site clone |

---

## 2. Slice 0 — first shippable (build this first)

**Goal:** Something real you can soft-launch: brand-locked landing + waitlist + sponsor one-pager PDF skeleton + ops checklist you can run.

### Acceptance checks (slice 0)

- [ ] **Brand board** committed: name (or `Orbit` provisional), color tokens, type pairing, voice 5-liner, logo wordmark draft (SVG)
- [ ] **Marketing site shell** live locally (and optionally Pages/Vercel): hero static pointillist Space Centre (can be CSS/canvas still image), Codechella-like sections, CTAs
- [ ] **Waitlist / tickets**: Luma event draft **or** email waitlist form working end-to-end
- [ ] **OG image** 1200×630 with wordmark + saucer silhouette
- [ ] **ops/checklist.md** usable as day-to-day tracker
- [ ] **ops/outreach-templates.md** ready to send (speaker + sponsor + community)
- [ ] **ops/sponsor-deck-outline.md** filled enough to paste into slides (content complete; design polish can be slice 1)
- [ ] **Devin/Cognition** lead-sponsor placement correct (logo from `brand/devin-assets`, not recolored illegally)
- [ ] **Kent C. Dodds** keynote block present with honest “title TBA” if needed
- [ ] `prefers-reduced-motion` respected if any animation ships
- [ ] README for the repo explains how to run site + where assets live

### Slice 0 write set (expected)

```text
brand/
  tokens.css
  voice.md
  logo-wordmark.svg          # draft
  space-centre-hero-ref.png  # already present
  kindolphin-aesthetic-ref.png
  devin-assets/              # already present
ops/
  checklist.md
  outreach-templates.md
  sponsor-deck-outline.md
  run-of-show-template.md
site/                        # or apps/web — pick one stack in build
  ... marketing site
README.md
```

### Stack recommendation (slice 0)

| Choice | Why |
| --- | --- |
| **Astro** or **Next static** | Event site is mostly static; fast OG; easy deploy |
| **Canvas 2D** for hero later | Enough for particles; skip Three.js until needed |
| **Luma** embed/link | Tickets without backend |
| **Cloudflare Pages / Vercel** | Free tier fine |

---

## 3. Later slices (ordered backlog — do not expand slice 0)

| Slice | Name | Outcome |
| --- | --- | --- |
| **1** | Saucer → Cosmos hero | Interactive pointillism dissolve + orbit graph; section deep-links |
| **2** | Sponsor deck designed | Polished PDF/PPTX from outline; tier one-pager |
| **3** | Mission Control agent | FAQ/schedule RAG or scripted agent; degrade to FAQ |
| **4** | Full speaker grid + schedule CMS | MD/JSON content pipeline; easy updates |
| **5** | Day-of kit | Check-in sheet, print assets, slide templates, badge optional |
| **6** | Post-event | Recap page, photo grid, sponsor report template |

---

## 4. Policy locks (every PR must preserve)

1. **Monochrome spine** — cream ground + ink + single mist accent; no rainbow UI.
2. **Devin blue `#317CFF` only** for official Cognition/Devin marks / approved sponsor callouts — not general buttons.
3. **Event ≠ product site** — conference has its own name and lore; sponsor tiers are Flagship/Gold/Silver/Bronze (not named after buyers).
4. **Tickets not custom** — external provider until explicitly reopened.
5. **Accessibility** — reduced motion, keyboard, contrast on cream.
6. **Asset respect** — use provided Devin SVGs/PNGs; don’t stretch lockups; clear space.
7. **Sponsor commercial terms stay off the marketing site** — no public $10k/$7k/$5k/$2k menu, no package comparison page. Site may show confirmed logos + optional inquiry email only. Full packages live in `ops/` deck materials shared privately.

---

## 5. How to start (human)

1. Answer open questions in the brief (name, date, format, Kent status, budget).
2. Approve this plan (or comment deltas).
3. Run **`/plan`** (or say “implement slice 0”) against this file.
4. Build only slice 0 acceptance checks until green.

---

## 6. Open founder decisions (block hard spend)

| ID | Decision | Blocks |
| --- | --- | --- |
| D1 | Event name | Logo, domain, Luma title |
| D2 | Date + timebox | Venue, Kent, tickets |
| D3 | Venue room package | Capacity, ticket cap, budget |
| D4 | Kent confirmation | Marketing claims |
| D5 | Cognition deal shape | Deck pricing, site copy |
| D6 | Domain | Site deploy URL |

---

## 7. Risk tests during slice 0

- Soft-launch waitlist before building particle system (validates R4/desire cheaply).
- Send 2 sponsor emails from templates before polishing deck design.
- Venue email this week (R1).
