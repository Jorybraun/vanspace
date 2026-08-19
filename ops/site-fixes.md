# BIOS SPHERE site — fix list

Living list. Add anything that looks wrong on vanspace.dev.
Status: `[ ]` todo · `[~]` in progress · `[x]` done

Source of truth for facts: `ops/checklist.md` locked facts.

---

## Open

_Add the next one here._

---

## In this pass (2026-08-13)

- [x] **Invented schedule** — session-by-session times were placeholder nonsense. Public schedule is now “Coming soon.” Keep date/venue/hours only.
- [x] **Back to line-up is easy to miss** — small ghost button sat under the title. Moved to bottom left and inverted (white on blue) so you can actually find it. Same treatment on the mobile overlay.
- [x] **“Kent C. Dodds · ?” copy** — question marks and a fake theme list. Line-up copy now leads with the confirmed keynote and says the rest is still landing. Second-keynote card is “Second keynote / Announcing soon,” not “?”.
- [x] **Ticket prices + Get tickets** — prices hidden, tiles not clickable. Nav / hero / BIOS “Get tickets” was a dead link to About. Now “Tickets soon,” not a fake checkout.
- [x] **Ticket window chrome doesn’t close** — `_ □ ×` were decorative. `×` and the back arrow close the dialog; backdrop and Escape do too.
- [x] **Sponsor copy** — dropped “helping builders meet, learn, and ship.” Lead with Cognition as lead sponsor; supporting places still open.
- [x] **Footer** — removed the leftover “Other slots open” strip (duplicate of the orbit sponsors chapter). Footer is name + email + CoC.
- [x] **Top header** — cream `vanspace` / tickets bar on the landing page. Gone. About/events keep a nav so you can get back.
- [x] **Drag-to-rotate died** — orbit code was fine; venue/sponsor windows sat on top and ate the pointer. Drag the field again (sponsor chapter is the main grab). Cards/buttons still click.

---

## Notes

- Do not publish a run-of-show until names and times are real.
- Speaker grid slots can stay as empty/soon cards. Do not use “?” as a name.
- Flip `TICKETS_LIVE` in `site/orbit-hero.js` and restore the CTAs when Luma is actually selling.
