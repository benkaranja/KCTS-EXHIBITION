# Benchmark evaluation — three reference sites against ours

**Prepared 23 August 2026** · for the V3 content and layout work

Sites reviewed at the client's request:

- `hktdc.com` — Hong Kong Trade Development Council, and its Food Expo event site
- `worldteacoffeeexpo.com` — World Tea & Coffee Expo, India
- `etp-global.org/events/etp-india-forum/` — Ethical Tea Partnership India Forum

## Method and its limits

Structure, navigation, word counts and image counts were measured from the live
HTML. **The visual designs could not be rendered** — HKTDC returns an
empty shell without its full JavaScript environment, and both it and
`worldteacoffeeexpo.com` failed to load stylesheets in the available browser
tools. So this document compares **information architecture, content strategy
and length**, which is where the client's actual complaints live, and does not
make claims about their colour, type or layout.

---

## 1. The headline finding

The client's instinct is half right, and the half that is wrong matters.

**Right:** our site is far too long. Measured:

| Site | Homepage / landing words |
|---|---|
| HKTDC Food Expo | 585, and most of that is navigation labels |
| World Tea & Coffee Expo | 520 |
| ETP India Forum | ~700, and that is the *entire event site* |
| **Kenya-China Tea Summit** | **1,569** |

Our whole site is 16,693 words across 19 pages. ETP runs a comparable
international tea event off a **single page**.

**Wrong:** the benchmarks are not better *written*. World Tea & Coffee Expo's
homepage contains "brewing a new wave", "they want velocity", "isn't here to
tick boxes", "the tea and coffee ecosystem", "unlock new markets" and "a dynamic
meeting ground" — in 520 words. ETP's opening paragraph uses "foster dialogue",
"key stakeholders" and "immersive, on-the-ground field experiences".

Our prose is already more disciplined than either. So the fix is **not** "write
more like them." It is: cut the length, restructure the navigation, and remove
the specific artificiality in our own copy. Those are three separate jobs and
only the third is about sentences.

---

## 2. What HKTDC does that we should copy

Its event-site navigation is the most valuable thing in this review. Top level:

```
Fair · Exhibit · Visit · Press · Travel Info · Enquiries
```

**Organised by who you are, not by what the topic is.** Under those:

| Section | Contains |
|---|---|
| Fair | Fair at a Glance, Exhibitor List, Product List, Guide Map, Success Stories |
| Exhibit | **Apply Booth**, Participation Fee & Format, Advertising, Resources Centre |
| Visit | Ticketing, eNews, Visitor's Rules |
| Press | Press Releases, **Photo Gallery**, **Video Gallery**, Media Centre |
| Travel Info | Visa/Permit, Travel to Fairground, Public Parking, Explore Hong Kong |

Five things worth taking:

**2.1 The site is a set of tools, not a set of essays.** Exhibitor List, Product
List, Guide Map, Fair at a Glance. Almost no prose at all. Our site explains the
summit at length; theirs lets you *do* things. This is the deepest structural
difference and it is the real cause of our word count.

**2.2 "Apply Booth" is a top-level navigation item.** Not buried inside an
exhibition page. The single highest-value exhibitor action gets a permanent
slot. This directly validates the portal floor-plan work — and says the entry
point belongs in the main navigation, not three clicks down.

**2.3 Photo Gallery and Video Gallery are first-class sections.** World Tea &
Coffee Expo does the same thing under the name "Glimpses", with a separate
"Glimpses 2022" archive. This is exactly the people-centred visual content the
client is asking for, and both benchmarks treat it as a destination rather than
decoration.

**2.4 Travel Info is a whole section, not a page.** Visa and permit guidance,
getting to the fairground, parking, and "Explore Hong Kong" — which is precisely
the tea-attractions page the client wants at item 7. Confirms that request is
industry-standard rather than a nice-to-have.

**2.5 Three languages, including Simplified Chinese**, switchable in the
header. We already have EN and zh, so we match here.

## 3. What World Tea & Coffee Expo does

Same audience-first pattern, more explicit:

```
Home · Exhibitors (Why Exhibit / Exhibitor Profile / FAQs / Visa Application)
     · Visitors (Why Visit / Visitor Profile / How to Reach)
     · Media · Glimpses · Webinars · Past edition · Contact
```

**"Why Exhibit" and "Why Visit" as named pages.** The persuasive argument gets
its own address, aimed at one audience, instead of being spread thinly across
every page. Ours is diffused everywhere, which is part of why every page is long.

**"Visa Application Form" sits in the exhibitor menu.** For a summit expecting
Chinese delegates in Nairobi, visa guidance is a genuine conversion blocker.
We currently have none.

**15 images on the homepage.** Ours is text-dominant by comparison.

**Weakness worth noting:** the site openly states "Details of the upcoming
edition, including dates, will be announced shortly" — an event site with no
dates. We have confirmed dates and a confirmed venue. That is a real advantage
over this benchmark and the V3 homepage should use it.

## 4. What ETP does

The whole forum lives on **one page**: overview, full two-day agenda with times,
pre-event estate visits, hotel block, and a single mailto call to action. No
forms, no portal, no separate pages.

Not a model to copy — it is a members' organisation informing people who already
belong, not a commercial event selling stands. But it is a useful corrective:
**every page we add has to earn itself.** ETP publishes a full agenda down to
"11:05 – Tea break" and still comes in under our homepage's word count, because
it spends its words on *specifics* rather than on framing.

That is the lesson. Their agenda is concrete and reads faster than our abstract
prose, despite being denser.

---

## 5. Where we are stronger

Worth stating plainly, because the V3 rewrite should not throw these away.

| | Us | Benchmarks |
|---|---|---|
| Confirmed dates and venue | Yes — 21–23 April 2027, KICC | WTC has neither |
| Bilingual EN/zh | Yes | HKTDC yes, others no |
| Accessibility | Measured contrast gate, 15 pairs, in the build | Not evident |
| Privacy posture | No cookies, no third-party trackers, strict CSP | All three carry trackers |
| Performance | Static, budgeted, no framework | WordPress and heavy JS stacks |
| Prose discipline | Better than both, as §1 shows | Buzzword-dense |
| Legal pages | Privacy, terms, code of conduct all present | Thin or absent |

## 6. Where we are weaker

| Gap | Benchmark evidence | Fix |
|---|---|---|
| **Topic-first navigation** | HKTDC and WTC both organise by audience | Restructure to Exhibit / Visit / Partner |
| **3× too long** | 1,569 vs 520–585 words | Budgets in the `summit-voice` skill |
| **No booth application entry point** | HKTDC has "Apply Booth" top-level | Portal phase 3, linked from main nav |
| **No photo or video gallery** | Both benchmarks treat this as a section | Add; also serves the people-first ask |
| **No visa guidance** | WTC puts it in the exhibitor menu | Add to Travel |
| **No exhibitor or product list** | HKTDC has both | Portal phase 4 |
| **No past-edition proof** | "Glimpses", "Success Stories" | Not available — first edition |
| **Text-dominant** | WTC has 15 homepage images | People-first imagery work |
| **Explanation over tools** | HKTDC is almost pure utility | The core V3 restructure |

---

## 7. Recommendations for V3

**7.1 Restructure the navigation around audience.** The most consequential
change in this document, and it is free — navigation is data in
`src/_data/navigation.js`.

```
Proposed:  About · Programme · Exhibit ▾ · Visit ▾ · Partner · News     [Register]
           Exhibit ▾  → Why exhibit · Stands and rates · Apply for a stand · Exhibitor pack
           Visit   ▾  → Why attend · Venue · Travel and visas · Tea attractions
```

This replaces topic labels (Expo, B2B, Travel) with the two questions every
visitor actually arrives with: *am I selling, or am I attending?*

**7.2 Turn pages into tools wherever a tool is possible.** Exhibitor list,
product categories, guide map, "at a glance" summary. Every one of these
replaces prose with something a buyer can use, and each cuts words as a side
effect.

**7.3 Give "Why exhibit" and "Why attend" their own pages.** Concentrate the
persuasion in two places, then strip it out of the other fifteen. This is the
main mechanism for hitting the word budgets without losing the sell.

**7.4 Add a gallery.** Even before the first edition, Orbitline's photography
from past events supports it — and it is the direct answer to the client's
people-first request.

**7.5 Add visa guidance to Travel.** Chinese delegates need Kenyan visa
information and it is currently absent. WTC treats this as an exhibitor-menu
item, which tells you how much it matters commercially.

**7.6 Use the dates.** WTC cannot say when its next edition is. We can. That
belongs in the first viewport, above everything else.
