# Livestream & recording — VanSpace

**Why:** Kent’s rider asks for **recording + YouTube promptly**, and **live stream if possible** (family / remote fans). Sponsors get clips. You get marketing for next year.

**Do not assume** Space Centre or Science World “has livestream.”  
Most venues have **projection + house sound**. Full **multi-cam YouTube Live** is usually **your kit or a hired AV vendor** on top of the room.

---

## Goal (pick one)

| Level | What you ship | Audience | Cost class (CAD, ballpark) |
| --- | --- | --- | --- |
| **A. Record only** | Clean capture → edit → YouTube VOD in 1–2 weeks | Kent contract + archive | **$0–800** DIY · **$1.5–3k** vendor |
| **B. Live + VOD** (recommended) | YouTube Live (or Vimeo) for main stage · VOD after | Kent family + remote · FOMO | **$500–1.5k** lean · **$2.5–5k** pro day |
| **C. Hybrid multi-cam** | 2–3 cameras, lower thirds, sponsor bugs | Polished brand | **$4–8k+** production house |

**VanSpace default:** **B** — single primary camera on speaker + slides, live to **YouTube**, record master, publish VODs after.

**Stream what:** Opening (Kent), mid-day Platinum, Wes, closing speech, maybe 1–2 Gold sessions.  
**Optional skip live:** pure networking / lunch (camera off or ambient).

---

## How it works (architecture)

```text
[Speaker laptop] ──HDMI──► [Switch / capture]
[Camera on speaker] ──────► [Switch / capture] ──► [Encoder laptop]
[House mic / board] ──────► [Audio interface]  ──►        │
                                                          ▼
                                              YouTube Live (RTMP)
                                              + local SSD record
```

### Simple stack (works in almost any room)

| Piece | Role | Lean option | Better option |
| --- | --- | --- | --- |
| **Camera** | Speaker + stage | 1× mirrorless / good webcam on tripod | 2× cams (wide + tight) |
| **Slides** | Clean feed | HDMI from speaker laptop to capture | Same + confidence monitor |
| **Audio** | Most important | **House mic → board → USB interface** (not camera mic alone) | Wireless lav + room mic into mixer |
| **Encode** | Push to internet | Laptop + **OBS** or **StreamYard** | Hardware encoder (ATEM Mini + laptop) |
| **Platform** | Watch URL | **YouTube Live** unlisted or public | Same + embed on vanspace.dev |
| **Backup** | Never lose Kent | Record to SSD *and* stream | Second camera recording ISO |
| **Internet** | Upload | Venue wired ethernet to encoder | Bonded LTE (LiveU / phone hotspot backup) |

**Rule:** Bad video is OK. **Bad audio is not.** Budget audio first.

---

## Venue reality check

### Science World (current lean — day $3.5k)

| Likely | Confirm in writing |
| --- | --- |
| **Science Theatre** (if that’s the room) is built for keynotes / film — projection + sound exist | Exact room name + seated capacity |
| “AV capabilities” on rental pages ≠ dedicated livestream team | **Is livestream included?** Almost always **no** |
| Daytime may share building / network load | **Dedicated ethernet** for stream PC? Bandwidth test? |
| | Can we patch **house mix** to our interface? |
| | Power for tripods / table at back of house |
| | Lighting dimmable / front-light for face (not only house blue) |

**Contact:** facility rentals — ask for **AV package + external production allowed?**  
`facilityrentals@scienceworld.ca` (from their rentals site).

### Space Centre

| Likely | Confirm in writing |
| --- | --- |
| Auditorium / Star Theatre style spaces for presentations | Room + hourly AV add-ons |
| Hourly room rates published; **stream not listed as included** | Same questions as above |
| Iconic room; lighting can be dim for “space” look | **Face light** for camera |

**Neither venue is a TV studio.** Plan **bring-your-own stream** or **hire local AV**.

### Questions to email venue (copy-paste)

```text
For our single-track conference day (~80–150 seated):

1) What AV is included in the rental (projector, mics, lectern, tech staff)?
2) Can an external AV / livestream vendor work in the room?
3) Can we take a feed from the house soundboard for recording/stream?
4) Is dedicated wired ethernet available at FOH / back of house for a stream laptop?
5) Approximate upload bandwidth on that drop (or can we run a speed test on a site visit)?
6) Lighting control — can we keep speaker face-lit for camera?
7) Any restrictions on cameras, tripods, YouTube Live, or recording?
8) Cost for venue tech staff hours if required?
```

---

## Three ways to staff it

### 1) DIY lean (~$500–1.5k gear/rental)

- You or a volunteer runs **OBS**  
- 1 camera + HDMI capture + lav/board feed  
- YouTube Live unlisted link for remote VIPs  
- **Risk:** one person fails = stream dies; not ideal for Kent alone  

**Only if:** you have someone who has streamed before and a full rehearsal.

### 2) Local AV vendor day-rate (recommended)

- Vancouver production / AV company: **1 operator**, 1–2 cameras, switcher, stream encode, multitrack or program record  
- You provide YouTube account + run-of-show  
- **~$2.5–5k CAD** typical for a day micro-con (get 3 quotes)

**Ask for:** program record master (ProRes or high-bitrate MP4), live YouTube, backup local.

### 3) StreamYard / Riverside “software first”

- Speakers join from stage laptop via StreamYard *or* you capture camera into StreamYard Studio  
- Easier lower-thirds and multi-guest  
- Still need **good room audio** and camera  
- Fine for hybrid; slightly less “cinematic”

---

## Platform & product

| Decision | Recommendation |
| --- | --- |
| **Live** | YouTube Live on **VanSpace** channel (create one) |
| **Visibility** | **Unlisted** during event (link to VIPs / Kent family) *or* public if you want marketing |
| **VOD** | Same channel: Kent / Wes / closing as separate videos within 7–14 days |
| **Site** | vanspace.dev “Watch” only if public; else post after |
| **Chat** | YouTube chat moderated (CoC); or disable chat |
| **Clips** | 30–60s for X/LinkedIn week after |

**Kent:** send him the **live link** before doors + promise VOD URL when up.

---

## Run-of-show (stream ops)

| Time | Action |
| --- | --- |
| **T−14 days** | Book AV vendor or lock DIY kit; create YouTube channel; test RTMP |
| **T−7** | Site visit: ethernet speed test, power, camera positions, light |
| **T−1** | Full rehearsal: laptop HDMI, mic levels, stream 10 min to unlisted |
| **Doors −90** | Cable, white balance, slate “VanSpace TEST” |
| **Doors −30** | Go live unlisted “waiting room” slate |
| **Each talk −5** | Lower third name/title; check audio |
| **Talk start** | Countdown clock in room; stream shows speaker + slides (PiP or switch) |
| **Between talks** | Lower music bed / slate “Up next”; don’t stream empty hallway noise |
| **End of day** | Stop stream; pull SSD masters; dual backup |
| **+48h** | Rough cut of Kent live if needed; full VOD edit queue |
| **+14d** | All VODs public (or unlisted per speaker OK) |

---

## Budget (plug into `budget.md`)

| Line | Lean | Mid (target) | Pro |
| --- | --- | --- | --- |
| Cameras / switcher rental | 200 | 600 | incl. vendor |
| Audio interface / lav | 100 | 300 | incl. |
| Operator (day) | 0 (you) | **1,500–2,500** | 3,000+ |
| Internet backup (LTE) | 50 | 150 | 300 |
| Post / YouTube edit | 0–300 | **400–800** | 1,500 |
| **Total stream day** | **~$500** | **~$2.5–4.5k** | **$5–8k** |

Old mid budget had **AV ~$1.2k** — that is **room mics + projector help**, not a full live team.  
**Add a separate line: Livestream / record $2.5–4k** if you want B solidly.

---

## Legal / speaker OK

- [ ] **Kent / Wes / Cognition / Gold speakers:** recording + YouTube + stream in confirmation email  
- [ ] Attendee badge or door sign: “Sessions may be recorded / livestreamed”  
- [ ] Sponsor stage talks: OK to stream (usually yes — confirm)  
- [ ] No recording workshops without Kent approval (rider)  
- [ ] CoC applies in chat  

---

## Decision for you

| Question | Options |
| --- | --- |
| **Must-have** | Record for YouTube (Kent) |
| **Nice-to-have** | Live day-of |
| **Who runs it** | Hire Vancouver AV (recommended) vs DIY |
| **Public vs unlisted** | Unlisted live + public VOD is safest for first year |

**Recommended package for VanSpace day at Science World (or Space Centre):**

1. Email venue the AV/stream questions above **this week**  
2. Get **2 quotes** from local AV (“single cam + board feed + YouTube Live + master record, 8-hour day”)  
3. Budget **~$3k mid** for stream+record on top of room  
4. Create **YouTube @vanspace**  
5. Put stream URL in run-of-show + Kent packet  

---

## Next actions

- [ ] Confirm room (Science World Science Theatre vs other)  
- [ ] Send venue AV/stream questionnaire  
- [ ] Shortlist 2–3 Vancouver AV vendors  
- [ ] Add **Livestream** line to budget spreadsheet  
- [ ] Speaker agreements: “recorded + may be livestreamed”  
- [ ] Dry-run on site 1 week before  

When venue answers 1–8, we can lock gear list and a single vendor brief.
