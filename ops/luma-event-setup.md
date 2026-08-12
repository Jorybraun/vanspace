# Luma Event Setup — VanSpace / BIOS Sphere

Everything needed to create the Luma event. Cover art is the `LUMA COVER 1080` frame
on the **Luma** page of the *VanSpace — Sponsor Prospectus* Figma file
(`bt1kFppHZNg6tQ7lJDsfmq`). Export at **1080×1080 PNG, 2x**.

Luma's own guidance: cover images should be **square (1:1), minimum 800×800px**.
Correctly sized covers are a requirement for being considered for Luma's featured
events. Do not upload a wide/banner crop.

---

## 1. Core event fields

| Field | Value |
| --- | --- |
| **Event name** | BIOS SPHERE |
| **Date** | Monday 2 November 2026 |
| **Start** | 13:00 PT |
| **End** | 19:00 PT |
| **Timezone** | America/Vancouver |
| **Location type** | In person |
| **Venue name** | Science World |
| **Address** | 1455 Quebec Street, Vancouver, BC V6A 3Z7 |
| **Capacity** | 200 |
| **Visibility** | Public |
| **URL slug** | `vanspace-2026-11-02` (already referenced on the site) |
| **Cover** | `LUMA COVER 1080` export |
| **Host** | VanSpace |

**Registration behaviour**

- Require approval: **off** for paid tickets (payment is the filter)
- Waitlist when sold out: **on**
- Guests can invite friends: **off** (capacity is tight at 200)
- Collect: name, email, company, role, dietary needs, accessibility needs
- Ask "How did you hear about us?" — you will want this for sponsor reporting

---

## 2. Event description

Luma descriptions support light formatting. Paste as-is.

> **A micro-conference with big-conference energy.**
>
> One day, one track, 200 seats inside Science World.
>
> VanSpace brings well-known speakers to Vancouver at a price local developers can
> actually pay. Single track, so there is no choosing between rooms and nobody misses
> the talk they came for.
>
> **Keynote: Kent C. Dodds**
> Kent is one of the most widely followed educators in web development. He created
> Testing Library, which is how a large share of the JavaScript world writes tests, and
> he has taught hundreds of thousands of developers through EpicReact.dev and
> EpicWeb.dev. If you have shipped a React app in the last five years, you have
> probably used something he built or learned from something he wrote.
>
> Vancouver does not usually get to see people like this without booking a flight.
> That is the whole reason this event exists.
>
> **Early bird: 25 tickets at $99**
> Seeing a speaker of this calibre normally means travelling. React Summit US runs in
> New York on 17 to 20 November 2026, one week after us, and early bird there is
> 735 USD before flights and a hotel. JSConf North America tickets have ranged from
> 200 to 1,449 USD.
>
> Ours is $99 CAD for the first 25 seats, in a 200 seat room, ten minutes from
> downtown Vancouver. When those 25 are gone the price goes to $160.
>
> React Summit US: https://reactsummit.us
>
> **More to be announced**
> A second keynote, a closing session, and the rest of the day's talks are still to
> come. We are building the programme through the year and ticket holders hear first.
>
> **After the talks: TBA**
> We are working on a networking reception to close out the day. More info to be
> announced, and ticket holders hear first.
>
> **Included**
> Full day access and every session. Talks are recorded and published afterwards.
>
> Doors 13:00. Wraps 19:00.
> Science World, 1455 Quebec Street, Vancouver.
>
> Presented with support from Cognition.

**Tone check:** no exclamation marks, no em dashes, no "join us for an unforgettable
experience", and nothing negative about other events. The sponsor deck can argue that
the local scene needs shaking up; a public Luma page should not. Other organizers read
these, and attendees do not care about the comparison. Matches `brand/voice.md`.

### Price comparison: sources and one caveat

Verified 2026 figures, in USD:

| Event | Price | Notes |
| --- | --- | --- |
| React Summit US 2026 | **735 USD** early bird | 17–20 Nov 2026, New York. `reactsummit.us` |
| React Summit + JSNation combo | **1,120 USD** early bird | Same week |
| JSConf North America | **200–1,449 USD** | Range across tiers |

**The caveat, so nobody calls you out.** React Summit is a multi-day conference with a
full lineup; VanSpace is one afternoon with one confirmed keynote. The honest claim is
*"seeing speakers of this calibre normally costs this much and requires a flight"* —
not *"we are the same product for less"*. The copy above is written to stay on the
right side of that line. If you push it further, someone in the replies will do the
comparison for you.

Do not convert the USD figures to CAD in the copy. Exchange rates move and a stale
number reads as sloppy. Naming the currency and letting the reader do the maths is
both safer and more persuasive, because the gap is obvious either way.

---

## 3. Ticket pricing

Create three ticket types. Currency **CAD**. Prices match `site/bios/index.html`.

| Ticket | Price | Quantity | Notes |
| --- | --- | --- | --- |
| **Early bird** | $99 | 25 | Sells first, then auto-closes |
| **Student** | $99 | Set a cap (see below) | Requires student ID at door |
| **Standard** | $160 | Remainder | Opens once early bird sells out |

**Setup order matters.** Luma shows ticket types in the order you create them, so
create Early bird first.

**Early bird**
- Quantity: 25
- Description: "First 25 tickets at the best price. Full day access to keynotes and
  sessions."
- Leave no end date. Selling out is what closes it, which is cleaner than a date you
  might want to move.

**Student**
- Price: $99
- Description: "Full day access at a discounted rate. Bring valid student ID to the
  door."
- **Set an explicit cap.** Without one, students can absorb the whole room at $99 and
  the standard tier never earns. A cap in the 30–50 range is a reasonable start given
  the BCIT relationship and the student-access story in the sponsor deck.
- Add a required checkbox: "I will bring valid student ID." Enforce at the door.

**Standard**
- Price: $160
- Description: "Full day access to all keynotes and sessions."
- Quantity: capacity minus the other two, minus any held seats (see below).

**Hold seats back.** Do not sell all 200. Reserve roughly 25–35 for:
sponsor comp tickets (top tiers include 10, 6 and 2 in the current deck), speakers
and their guests, volunteers, and press or partner invites. Selling seats you have
already promised to a sponsor is the one mistake here that costs money.

**Sponsor comps:** create a hidden/secret ticket type at $0 and share that link
privately. Do not make it a discount code, since codes leak.

---

## 4. Inviting people from past events

Luma keeps a contact list across events under **your host profile → People**. It also
lets you invite by uploading a CSV.

**Steps**

1. Open each past event → **Guests** → export CSV.
2. Combine into one list. De-duplicate on email address.
3. Segment before sending. These groups deserve different messages:
   - **Design-a-thon attendees** (75 attended)
   - **Design-a-thon registrants who did not attend** (150 signed up)
   - **BCIT / student group contacts** — send them the student ticket
   - **Speakers, mentors and judges** from past events
   - **Sponsor and industry contacts** — these should get the prospectus, not a
     ticket link
4. In the new event → **Invite Guests** → paste or upload the segment.
5. Send in batches, not one blast, so you can compare open rates and adjust.

**Consent, and this one matters.** Under CASL, a Canadian anti-spam law, you need
consent to send commercial email. Someone registering for a past VanSpace event gives
you implied consent, but it expires — generally two years after the transaction or
enquiry. So:

- Design-a-thon attendees from within the last two years: fine to email.
- Anyone older, or scraped from somewhere else: do not bulk-email. Invite them
  personally or reach them through the community channels they already follow.
- Every send needs a working unsubscribe and your real mailing address. Luma handles
  unsubscribe, but check the footer shows a valid address.

**Early-bird advantage.** Give past attendees the early-bird link a few days before
you announce publicly. 25 tickets will not last long, and rewarding the people who
already showed up is the right way to spend that scarcity.

---

## 5. Before you publish

- [ ] Cover exported at 1080×1080 and uploaded
- [ ] Slug is `vanspace-2026-11-02` so existing site links resolve
- [ ] All three ticket types created, in order, in CAD
- [ ] Student cap set
- [ ] Held seats subtracted from Standard quantity
- [ ] Hidden $0 sponsor comp ticket created
- [ ] Waitlist enabled
- [ ] Registration questions include dietary and accessibility needs
- [ ] Test purchase on each tier, then refund it
- [ ] Confirmation email reviewed — it is the most-read email you will send
- [ ] Calendar invite shows the correct timezone
- [ ] Past-attendee segments built and consent-checked

---

## Open questions

1. **Student cap** — needs a number. 30–50 suggested, not decided.
2. **Exact hold-back count** — depends on how many sponsor comps are actually sold.
3. **Refund policy** — Luma requires one. Not yet written.
4. **Recording consent** — attendees should be told they may appear in footage.
   Usually a line in the description plus signage at the door.
5. **Networking reception is sponsor-dependent** — it is listed as TBA because it only
   happens if the lobby/networking sponsorship sells. Two consequences:
   - Do not list it as an included benefit on any ticket until it is funded.
   - It is a clean, concrete sponsor ask. "This hour does not exist unless someone
     underwrites it" is easier to sell than generic brand placement.
6. **Alcohol and age, once the reception is confirmed** — legal drinking age in BC is
   19, and the student tier plus BCIT outreach means some attendees may be younger.
   Needs: confirmation Science World's licence covers the hour, wristbands or ID at
   the bar, and non-alcoholic options actually stocked. Do not advertise drinks before
   the licence is confirmed.
6. **Programme announcement cadence** — the description promises ticket holders hear
   about new speakers first. That is a commitment to actually email them when a
   speaker is confirmed. Worth deciding who owns that.
