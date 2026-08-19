# VanSpace visual theme — working draft (not perfection)

> **Direction log:** see `brand/DIRECTION.md` for pivots (Codechella deck, Science World, no workshops, Luma card without line-up).

**Vibe:** Windows **BSOD blue** + **nicotine-yellow keyboard** + soft **2000s anime web** (not full weeb cosplay).  
**Energy:** Builder desk at 2am · spacebar logo · micro-conf that feels like a site you used to love.  
**Bar:** Good enough to ship a deck and site — not a brand bible.

---

## Palette (v0.2)

| Token | Hex | Role |
| --- | --- | --- |
| **bsod** | `#003399` → site deep `#170073` / `#0600a8` | Titles, hero type (BSOD blue) |
| **black** | `#0A0A0A` | **Hard contrast** — primary buttons, poster frame, nav rule (like Cognition mark) |
| **key-cream** | `#E5E0CF` / `#F4F0E8` | Page ground |
| **key-stain** | `#E8D9A8` / `#D4C48A` | Warm yellowed plastic — cards, swag |
| **mist** | `#8B8499` / `#75699C` | Meta / mono labels |
| **devin** | `#317CFF` | **Sponsor marks only** |

**Rule of thumb:** cream ground · **blue for type** · **black for chrome/CTAs** (Cognition contrast) · stain sparingly.

---

## Imagery brainstorm (generate / commission / Figma)

### A. Hero / cover (prospectus page 1)
| Idea | Notes |
| --- | --- |
| **Science World dome as pencil sketch** | Codechella move — landmark = lore |
| **Dome + CRT bezel** | Sketch dome inside a thick 90s monitor frame |
| **Spacebar key as architecture** | Giant keycap landscape; city in the reflection |
| **BSOD as sky** | Cream building, sky is soft `#003399` with white terminal error text *very* faint |
| **Yellowed keyboard aerial** | Keys as city blocks; one key is `space` |

### B. Proof / atmosphere (page 2)
| Idea | Notes |
| --- | --- |
| Real photos of builders if you have them | Codechella path — authenticity wins |
| Desk still life | Coffee ring, yellowed keycaps, laptop, badge |
| “Forum signature” strip | Pixel divider, tiny 88×31 badges (VanSpace only) |
| IRC / status bar | Fake window chrome: `_ VanSpace - Conference _` |

### C. Merch / swag (page 4)
| Idea | Notes |
| --- | --- |
| Cap + tote flat lay on cream | Codechella merch plate |
| Sticker sheet | Wordmark, spacebar, tiny BSOD square, dome |
| Lanyard as USB cable | Optional joke — don’t force it |

### D. Don’t
- Full anime characters as “the brand” (licencing + dates badly)
- Literal blue-screen of death full page (reads as error, not event)
- Rainbow cyberpunk / matrix rain
- Devin-blue UI chrome

---

## Type

| Use | Face |
| --- | --- |
| Display / titles | IBM Plex Sans or system grotesk — **uppercase OK** on hero |
| Body | Plex Sans / Inter |
| Meta / UI chrome | **IBM Plex Mono** — terminal, captions, tier labels |
| Optional nostalgia | “Fixedsys-ish” only for one tiny BSOD joke line |

---

## Motion / web (site)
- Spacebar depress on hover  
- Soft CRT scanline on BSOD overlay  
- Particle saucer → **BSOD blue** (`#0000AA`) orbit phase  
- **Boot / BSOD typewriter** as cream dies (`#orbit-bsod` in `orbit-hero.js`) — terminal joke, then fades so orbit remains  
- Not a full sad Windows error page forever — a beat, then the day-as-system

---

## Figma file structure (you own the edits)

```text
VanSpace
├── 00 Cover
├── 01 Proof / letter
├── 02 Who + what we need
├── 03 Marketing + swag
├── 04 Tier matrix + contact
├── Components
│   ├── Logo / wordmark
│   ├── Buttons
│   ├── Tier chips
│   └── Photo frames
└── Tokens (colour styles + text styles)
```

**Import into Figma (no MCP required):**
1. New file “VanSpace Sponsor Prospectus”
2. Page size **A4** or **Letter** (Codechella is A4)
3. Drag in: `ops/refs-codechella-sponsor-prospectus.pdf` (reference page)
4. Drag in: `brand/logo-wordmark.svg`, sketch JPGs, `tokens` as colour styles
5. Duplicate Codechella page structure with empty frames — fill with VanSpace copy from `ops/sponsor-package-v2-brief.md`

---

## Asset backlog (good enough list)

- [ ] Cover illustration (dome or keyboard-space) — 1 hero  
- [ ] 2–4 proof photos (or placeholder frames)  
- [ ] Wordmark already done  
- [ ] Sticker sheet 1-pager (optional)  
- [ ] Merch flat (optional for deck)  
- [ ] Colour styles in Figma matching table above  

---

*Not final. Steal, rough in, ship.*
