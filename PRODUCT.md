# PRODUCT — Kenya-China Tea Summit 2027

Product truth only. No visual decisions live here — those belong in DESIGN.md.
Derived from `docs/PRD.md`, `website_content/FACTS.md` and `project.config.json`
rather than re-interviewing the client.

## What it is

The public website for a three-day international tea trade summit in Nairobi,
**21–23 April 2027**, convened by the Kenya-China Tea Summit Secretariat
(Orbitline Events & Ushers Ltd). Theme: *Brewing Strategic Partnerships for
Sustainable Tea Trade, Investment and Innovation*. Tagline: *Connecting Tea,
Cultures & Opportunities*.

## Who it is for

Two populations who do not currently meet, and the site has to feel credible to
both at once:

- **Chinese importers, buyers and investors** deciding whether an unfamiliar African summit justifies a flight and a delegation. They are assessing seriousness before anything else.
- **Kenyan exporters, producers, processors and agri-tech vendors** who want access to those buyers and need to know what a stand costs and how B2B works.

Plus: government and trade-policy officials (legitimacy), media (facts and
assets), researchers and students (programme substance).

## The job to be done

The summit is nine months out and has **no public presence**. Prices, speakers,
venue and contact details do not exist yet. So the site is not selling tickets.
Its job is to **exist, read as serious, and capture intent** from every audience
while the secretariat firms up details.

Primary conversion: **registration expression-of-interest**, six categories, one
click from every page. Secondary: sponsorship enquiry, exhibitor enquiry, speaker
application, newsletter.

## Non-negotiable product constraints

- **`website_content/FACTS.md` is binding.** §1 is the only publishable claim set. §2 is a do-not-invent list: no prices, no speakers, no venue address, no delegate statistics, no government endorsement, no partner logos.
- **No fabricated photography of people, premises, or past editions.** There has never been a previous edition. Any image implying one is a lie.
- The client's logo is fixed and supplied. The palette derives from it.
- Static output, zero runtime framework, <15 KB JS, <30 KB CSS, Lighthouse 100s.

## What "credible" has to overcome

This is the real design problem, and it is not decoration:

A first-edition summit with no speakers, no prices and no venue has every
external signal of vapourware. Most event sites in this position paper over the
gap with stock photography and invented statistics. This one cannot — it is
constrained to honesty. **So credibility has to be carried by the design itself:
by typographic authority, material specificity, and evident care.** A page that
looks templated confirms the visitor's suspicion. That is why the current
implementation fails.

## Mode

**Persuade.** The visitor decides and acts; the design is the product.
