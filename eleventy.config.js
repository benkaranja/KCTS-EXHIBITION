import summit from "./src/_data/summit.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const config = JSON.parse(readFileSync("./project.config.json", "utf8"));

export default function (eleventyConfig) {
  // Assets are copied verbatim; nothing is bundled. The shipped site is
  // HTML + CSS + vanilla JS, per ADR-003.
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/video": "video" });
  // Published documents. Source of truth is src/, not public/ — public/ is
  // wiped by `npm run clean` on every build. Validator rule 8 resolves
  // /files/* against this directory.
  eleventyConfig.addPassthroughCopy({ "src/static-files": "files" });
  // robots.txt and sitemap.xml are generated (src/robots.njk, src/sitemap.njk)
  // so they always carry the current origin — see ADR-010.
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  // Edge redirects for the pages folded in V3. Must be copied verbatim to the
  // output root or Cloudflare Pages never sees it.
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());

  // Turnstile's site key is public and belongs in markup — but only a REAL one.
  // Empty means the widget is omitted entirely rather than shipping the test key
  // 1x00000000000000000000AA, which criterion B6 forbids.
  eleventyConfig.addGlobalData("turnstileSiteKey", config.turnstile?.siteKey || "");

  // --- collections -------------------------------------------------------
  // Ordered explicitly rather than by filename so content authors don't have
  // to encode ordering in slugs.
  const byOrder = (a, b) => (a.data.order ?? 999) - (b.data.order ?? 999);

  eleventyConfig.addCollection("speakers", (c) =>
    c.getFilteredByGlob("src/speakers/*.md").sort(byOrder),
  );
  eleventyConfig.addCollection("featuredSpeakers", (c) =>
    c.getFilteredByGlob("src/speakers/*.md").filter((s) => s.data.featured).sort(byOrder),
  );
  eleventyConfig.addCollection("sessions", (c) =>
    c.getFilteredByGlob("src/sessions/*.md").sort((a, b) => {
      const d = (a.data.day ?? 0) - (b.data.day ?? 0);
      return d !== 0 ? d : String(a.data.startTime ?? "").localeCompare(String(b.data.startTime ?? ""));
    }),
  );
  eleventyConfig.addCollection("sponsors", (c) =>
    c.getFilteredByGlob("src/sponsors/*.md").sort(byOrder),
  );
  eleventyConfig.addCollection("downloads", (c) =>
    c.getFilteredByGlob("src/downloads/*.md").sort((a, b) => {
      const k = String(a.data.category).localeCompare(String(b.data.category));
      return k !== 0 ? k : String(a.data.title).localeCompare(String(b.data.title));
    }),
  );
  eleventyConfig.addCollection("news", (c) =>
    c.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date),
  );

  // --- filters -----------------------------------------------------------
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  );

  // Absolute URL for canonical/OG/sitemap. Everything authored uses root-relative
  // paths; only this filter knows the production origin.
  eleventyConfig.addFilter("absoluteUrl", (path) => new URL(path, summit.url).href);

  // 24h "09:30" -> "9:30 am". Agenda times are authored as strings, not Dates,
  // because they are wall-clock times in Nairobi, not instants.
  eleventyConfig.addFilter("clockTime", (t) => {
    if (!t) return "";
    const [h, m] = String(t).split(":").map(Number);
    const suffix = h < 12 ? "am" : "pm";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  });

  // Nunjucks' own `selectattr` looks the attribute up with obj[attr], so it
  // cannot walk "data.category" — it silently matched nothing and the
  // downloads page rendered empty. This does the walk.
  eleventyConfig.addFilter("byCategory", (items, category) =>
    (items ?? []).filter((i) => i.data.category === category),
  );

  // News posts paginate over locales with addAllPagesToCollections: true, so
  // collections.news holds BOTH the English and the Chinese build of every
  // post. Rendering it unfiltered listed each post twice on every index — the
  // /zh/ copy sitting under the English one. Nunjucks' own selectattr looks
  // the attribute up with obj[attr] and cannot walk "data.locale", which is
  // the same reason byCategory above exists.
  eleventyConfig.addFilter("byLocale", (items, locale) =>
    (items ?? []).filter((i) => i.data.locale === locale),
  );

  // Is this nav item the current page, or the parent of it?
  //
  // Written as a filter because the obvious Nunjucks one-liner is wrong:
  // Nunjucks has no `equalto` test (that is Jinja), so
  // `children | selectattr("url", "equalto", basePath)` silently degrades to a
  // truthiness check on `url` and matches EVERY child. The result was
  // aria-current="page" sitting on Exhibit on every page of the site.
  eleventyConfig.addFilter(
    "inSection",
    (item, basePath) =>
      item.url === basePath ||
      (item.children ?? []).some((c) => c.url === basePath),
  );

  eleventyConfig.addFilter("speakersFor", (speakers, sessionSlug) =>
    speakers.filter((s) => (s.data.sessions ?? []).includes(sessionSlug)),
  );

  // Whole days from build time to an ISO date. Rendered server-side so the
  // number is present with JS disabled; hero.js corrects it on load.
  eleventyConfig.addFilter("daysUntil", (iso) => {
    const ms = new Date(`${iso}T00:00:00Z`) - new Date();
    return Math.max(0, Math.ceil(ms / 86400000));
  });

  // --- transforms --------------------------------------------------------
  // Order matters: i18n runs first so localeLinks can rewrite any hrefs that
  // survive inside translated fragments.
  //
  // Applies the machine translations produced by scripts/translate.js. Keyed
  // by the source fragment, so a page can be re-ordered or re-worded without
  // silently pairing Chinese text with the wrong English block — a changed
  // fragment simply misses and stays English until re-translated.
  const ZH_DIR = "src/_data/i18n/zh";
  const zhStrings = new Map();
  if (existsSync(ZH_DIR)) {
    for (const f of readdirSync(ZH_DIR).filter((n) => n.endsWith(".json"))) {
      const { strings } = JSON.parse(readFileSync(`${ZH_DIR}/${f}`, "utf8"));
      for (const [en, zh] of Object.entries(strings ?? {})) zhStrings.set(en, zh);
    }
  }
  // Must stay in step with BLOCKS in scripts/translate.js — extraction and
  // application have to see the same fragments or nothing matches.
  //
  // `legend` was added 2026-08-24. A <label> is translated today only because
  // the field markup wraps it in a <p>, which IS matched; a <legend> is a
  // direct child of <fieldset> and had nothing around it, so
  // "Participation type" shipped in English on the Chinese registration form.
  // Found while reviewing the exhibition branch, which hit the same wall with
  // its hall filter.
  //
  // `span` is deliberately NOT here. The pattern is non-greedy, so on nested
  // spans it would close at the inner </span> and translate a fragment of the
  // markup. Anything needing translation must use a listed element.
  const BLOCKS =
    /<(h1|h2|h3|p|li|dt|dd|figcaption|caption|title|button|legend)\b[^>]*>([\s\S]*?)<\/\1>|<a\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  eleventyConfig.addTransform("i18n", function (content) {
    if (typeof this.page.outputPath !== "string") return content;
    if (!this.page.url?.startsWith("/zh/") || !zhStrings.size) return content;
    return content.replace(BLOCKS, (whole, _tag, inner, btnInner) => {
      const text = inner ?? btnInner ?? "";
      const hit = zhStrings.get(text.trim());
      return hit ? whole.replace(text, hit) : whole;
    });
  });

  // Every internal href in the templates is authored root-relative and
  // English ("/about/"). On a /zh/ page that sends the reader straight back
  // to the English site on the first click, which makes the Chinese edition
  // useless. Rewriting them at the source would mean threading a locale
  // through ~60 hardcoded links in 18 templates; one transform over the
  // finished HTML catches all of them, including links inside page content.
  //
  // Skipped: asset directories (they are not localised) and any anchor
  // carrying data-nolocale, which is the language switcher itself.
  const ASSET_DIRS = /^\/(zh\/|files\/|img\/|css\/|js\/|video\/|fonts\/)/;
  eleventyConfig.addTransform("localeLinks", function (content) {
    // outputPath is `false`, not a string, for permalink:false documents
    // (the downloads collection) — hence the typeof rather than optional chaining.
    if (typeof this.page.outputPath !== "string") return content;
    if (!this.page.outputPath.endsWith(".html")) return content;
    if (!this.page.url?.startsWith("/zh/")) return content;
    return content.replace(/<a\b[^>]*>/g, (tag) => {
      if (tag.includes("data-nolocale")) return tag;
      return tag.replace(/href="(\/[^"]*)"/, (m, path) =>
        ASSET_DIRS.test(path) ? m : `href="/zh${path}"`,
      );
    });
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
    // Markdown and HTML both run through Nunjucks so components are available
    // everywhere without a second syntax to remember.
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
  };
}
