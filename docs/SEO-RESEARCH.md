# SEO research — Kenya-China Tea Summit 2027

**Researched:** 2026-08-01 · **Method:** `reference/seo-playbook.md` (Benrgy method)
**Instrument:** WebSearch. **`last30days` was not run** — it requires a one-time
interactive setup (browser-cookie extraction, CLI installs) that has not been
approved, and it is a community-listening tool whose Reddit/X/TikTok signal is
thin for a B2B trade summit nine months out with no public presence. Recorded
here rather than hidden; see HANDOFF.md.

**No volume or difficulty figures appear in this document.** An LLM cannot
source them and inventing them produces confident fiction. Real volume data
needs a human with Search Console or Ahrefs — see BLOCKERS.md if the client
wants it.

---

## 1. The competitive picture

Searching the obvious category terms returns **aggregator listings, not events**:
`10times.com`, `expolume.com`, `eventseye.com`, `expoassist.net`, `cantonfair.net`.
The only substantial first-party event sites in the space are
`worldteaexpo.com` (US) and the China International Tea Industry Expo (Hangzhou,
21–25 May 2026).

Three consequences:

1. **The head term is uncontested.** No existing event occupies "Kenya China tea summit" or any close variant. Once indexed, this site owns it outright. That is a rare position and it means head-term effort is nearly free — the work belongs on the commercial terms instead.
2. **The aggregators are a distribution channel, not a competitor.** Fighting `10times.com` for "tea expo 2027" is unwinnable and pointless. Getting *listed* on all five is a marketing task, not an SEO one. Added to HANDOFF as a client action.
3. **There is no Africa-China tea event to compete with.** The category exists (China↔Africa trade shows, the CIIE African pavilion) but nothing tea-specific. The gap is genuine, not manufactured.

## 2. The angle every ranking page misses

This is the finding that should shape the copy.

Kenya's problem in this trade is **not volume — it is value capture**, and China
is where that gap is sharpest. The dated evidence:

| Finding | Source | Dated |
|---|---|---|
| Kenya's Q1 2026 tea exports to China fell **51%** to 1.22 M kg | [The Kenyan Wall Street](https://kenyanwallstreet.com/tea-exports-q1-2026) | Q1 2026 |
| China was Kenya's **10th** export destination at 12.42 M kg; Pakistan led with 206.27 M kg (34.7%) | [African Business](https://african.business/2025/08/resources/kenyas-tea-exports-soar-amid-renewed-focus-on-value-addition) | 2024 data |
| Kenya exports **more tea by volume** than China and Sri Lanka but **earns less revenue** — bulk sales, narrow product range, limited market diversity | [Ecofin Agency](https://www.ecofinagency.com/news-agriculture/0107-47500-kenya-leads-in-tea-exports-but-trails-in-revenues-compared-to-china-and-sri-lanka) | 2026 |
| Kenya targets ~**200 M kg** of green and orthodox tea by 2030, diversifying beyond bulk black | [China Daily](https://www.chinadaily.com.cn/a/202607/21/WS6a5ec8f3a310986e2b466594.html) | 2026-07-21 |
| China's **zero-tariff** policy is the stated lever; Tea Board of Kenya is working with Chinese partners on processing machinery and an online auction platform | [China Daily](https://www.chinadaily.com.cn/a/202607/21/WS6a5ec8f3a310986e2b466594.html) · [Nairobi Business Monthly](https://nairobibusinessmonthly.com/zero-tariffs-drive-kenyas-push-for-bigger-tea-exports-to-china/) | 2026 |
| Kenyan tea averaged **US$2.28/kg** across the first 24 auctions of 2026; farmers earned KES 55 bn (US$424 M) Jan–Jun | [Food Business MEA](https://www.foodbusinessmea.com/kenya-tea-farmers-earn-us424m-from-exports/) | H1 2026 |
| Mombasa auction handles 200–250 M kg/yr, second globally after Kolkata | [Tea Trade UK](https://teatrade.co.uk/learning/mombasa-tea-auction-explained.html) | — |

**The editorial thesis this gives the site:** a 51% collapse in the China lane,
against a stated national policy of growing it and a zero-tariff door standing
open, is exactly the conditions under which a convening exists. The summit
doesn't need to *claim* importance — the trade data argues for it. No aggregator
listing can reproduce that, and it is the entire basis of the News/insights
pillar.

**Handling rule.** Every figure above is **industry context, not a summit
claim** (`FACTS.md` §3). Each ships with its source link and its date, and none
may be phrased as something the summit itself asserts or promises. "Kenya's
exports to China fell 51% in Q1 2026 (Kenyan Wall Street)" is publishable.
"The summit will reverse a 51% decline" is not.

## 3. Intent split

The category terms and the commercial terms want different pages. Conflating
them is the classic event-site error.

- **Informational / category** — "tea expo 2027", "international tea conference", "tea trade shows Africa". Aggregator-dominated, low conversion. Served by Home and News; not worth dedicated pages.
- **Commercial investigation** — "tea exhibition stand Kenya", "Kenya tea suppliers for China market", "tea sourcing Kenya", "tea industry sponsorship Africa". **This is where the value is.** Served by Exhibition, Sponsorship, B2B.
- **Transactional** — "Kenya China tea summit registration", "tea summit Nairobi tickets". Owned outright once indexed. Served by Registration.
- **Navigational** — "Kenya China tea summit", "kenyachinateasummit". Brand. Owned.

## 4. GEO / AI Overviews

Event queries surface `Event` structured data and AI Overviews cite specific,
attributable facts. Actions:

- `ConferenceEvent` JSON-LD is **already live and parsing** (verified in AUDIT.md). Extend with `Offers` only when pricing exists — never with placeholder offers.
- Every page answers its question in the **first 40–60 words**. The homepage currently opens with a positioning h1 and then the particulars block, which satisfies this.
- **One question per H2**, phrased as a person would ask. Current homepage H2s ("What is being convened", "Three days", "Six ways to attend") are close; FAQ needs real PAA-shaped questions.
- **FAQ page needs `FAQPage` JSON-LD.** The questions must come from real client enquiries once they arrive — inventing FAQ questions to farm the schema is exactly the thin-content failure the playbook names.
- Tables and lists get extracted; the manifest and class rows are already in that shape.

## 5. E-E-A-T with no author byline

No named expert exists for this summit. Trust is signalled structurally:

- **`Organization` JSON-LD sitewide** naming Orbitline Events & Ushers Ltd — **not yet implemented**, currently only `ConferenceEvent`. Added to the page map as a build task.
- Real legal entity in the footer — done.
- **No phone, email or physical address yet** (`FACTS.md` §2). This is a genuine E-E-A-T weakness and the single highest-value thing the client can supply. Raised in BLOCKERS.
- Outbound links to primary sources (Tea Board of Kenya, trade press) on News pieces, not to aggregators.
- No stock-photo team pages. The engraved vignettes are decorative and depict no people.

## 6. Open, needs a human

- **Real volume/difficulty data.** Needs Search Console or Ahrefs. Not approximable.
- **Chinese-language search.** Half the audience searches in Chinese, on Baidu. This research covers Google/English only. A `/zh/` edition (ADR-009) is a separate research job.
- **`last30days` setup**, if community sentiment is wanted later — likelier to pay off after the summit is announced and there is actually chatter to listen to.
