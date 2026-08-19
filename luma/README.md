# VanSpace — Luma cards

Built from the **Devin Community Meetup** template layout (1080×1080 mark watermark + city graphic + big city name + mono date line), swapped for VanSpace.

## Files

| File | Size | Use |
| --- | --- | --- |
| `card-square-light.html` | 1080×1080 | Primary social / Luma square (**no line-up** — art + meta only) |
| `card-square-dark.html` | 1080×1080 | Dark variant |
| `card-square-flagship.html` | 1080×1080 | With Devin lockup as Flagship |
| `cover-landscape.html` | 1920×1080 | Wide event cover |
| `exports/*.png` | PNG | Upload to Luma |

## Upload to Luma

1. Create event on [lu.ma](https://lu.ma)
2. Cover image → use `exports/cover-landscape.png` (or square if Luma crops that way)
3. Title: **VanSpace**
4. Location: Science World, Vancouver (or final locked venue)
5. Description: keep short; full line-up on site, not forced on the cover card
6. Website field: `https://vanspace.dev`

## Edit date later

Open the HTML, change `Date TBA` → real date, re-export with:

```bash
./export-cards.sh
```

## Notes

- Light card direction (2026-08): **like** saucer + spacebar composition; **drop line-up list** so the art breathes (`brand/DIRECTION.md`).
- Beige `#f5f4f1`, Plex Mono meta, sketch skyline + wordmark overlay.
- Devin/Cognition lockup only on Flagship variant if needed — not on primary light card.
- Re-export after HTML edits: `./export-cards.sh`
