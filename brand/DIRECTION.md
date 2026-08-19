# VanSpace — direction notes (living)

**Updated:** 2026-08-07  
**Purpose:** Capture intentional pivots so we don’t thrash or re-litigate every session.

---

## 1. Event (ops)

| Topic | Direction |
| --- | --- |
| Venue | **Science World** strong lean (day ~$3.5k) over Space Centre; access + price |
| Date | Weekday daytime · **Mon 2 Nov 2026** (locked) |
| Format | Single-track micro-con · ~150 · no workshop pitch in v1 sponsor package |
| Tickets | Luma · early-bird ~75% · student 30–40% · referrals |
| Stream | Record + live preferred · don’t assume venue includes it (`ops/livestream.md`) |

---

## 2. Sponsor deck

| Topic | Direction |
| --- | --- |
| **Pattern** | **Codechella prospectus** is the model (5 calm pages, cover art, proof, ask, marketing/swag, matrix). Not VancouverMade lime neon. |
| Ref file | `ops/refs-codechella-sponsor-prospectus.pdf` |
| Content | Selly value props · **no agenda/schedule** · **no workshops** · location once · swag bag insert rights |
| Editable | `ops/sponsor-package-v2-brief.md` → design → PDF |
| Figma | **You own edits** in Figma. MCP: see §7 below (official remote may need OAuth / client allowlist; Framelink API fallback) |

---

## 3. Brand / visual theme

| Topic | Direction |
| --- | --- |
| Working vibe | **BSOD blue** + cream + soft anime-web wink |
| Ground | Cream `#E5E0CF` / `#F4F0E8` |
| Blue | Hero titles + **orbit phase** classic BSOD `#0000AA` |
| **BSOD beat** | On scroll-to-blue: mono **typewriter prompt** (boot + fake STOP), then fade into orbit map |
| **Black** | Optional chrome; CTAs can stay blue; section titles black |
| Warm | Stained key `#E8D9A8` optional |
| Logo | **Spacebar wordmark** remains primary |
| Bar | Good enough to ship · not brand perfection |
| Detail | `brand/THEME.md` |

**Not the direction:** pure Kindolphin monochrome forever, or “Orbit sci-fi trailer,” or full BSOD error screens as the whole identity.

---

## 4. Luma / social card

| Topic | Direction |
| --- | --- |
| **Liked** | Light square card — saucer sketch + spacebar wordmark + cream field (e.g. `card-square-light` / Slack `card-square-light_2.png`) |
| **Change** | **Drop the line-up block** on the card (Kent / Wes / roles). Keep meta (date · venue) + art + logo. Line-up lives on site / later materials. |
| Cognition | Optional small lockup top — revisit so card doesn’t over-promise Flagship lock |

Source HTML: `luma/card-square-light.html`  
Export: `luma/exports/card-square-light.png`

---

## 5. Site

| Topic | Direction |
| --- | --- |
| Live | Coming soon / interactive orbit on branches — iterate without blocking sponsor deck |
| Hero line | “A micro-conference with big-conference energy” |
| Theme | Align over time with `THEME.md` (BSOD + stain), not overnight redesign |

---

## 6. Explicitly later

- Workshop sponsor products  
- Full anime character system  
- Perfect brand book  

---

## 7. Figma MCP (2026-08-07)

| Path | Config | Status |
| --- | --- | --- |
| **Official remote** | `~/.grok/config.toml` → `[mcp_servers.figma]` → `https://mcp.figma.com/mcp` | Configured · needs **OAuth** in Grok (`/mcps` → Connect / Authenticate). Figma may **403** non-catalog clients (Cursor/Claude/VS Code preferred). |
| **Framelink (API)** | `figma-api` via `npx figma-developer-mcp` + `FIGMA_API_KEY` | Optional read-context fallback — create PAT at Figma → Settings → Security |
| **Desktop local** | `http://127.0.0.1:3845/mcp` after enabling MCP in Figma desktop Dev Mode | Use if remote blocked |

**Workflow without full write access:** You layout in Figma; paste frame links here; agent reads context when MCP is healthy.

---

*When something big changes, add a dated bullet here — don’t rewrite history silently.*
