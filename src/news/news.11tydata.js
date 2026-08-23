// News posts are localised routes like every other page, but they live outside
// src/pages/ so they do not inherit pages.11tydata.js. Without this a post
// renders with basePath undefined and emits hreflang links pointing at
// /undefined — see ADR-014 for the locale contract this mirrors.
export default {
  layout: "layouts/page.njk",
  // Every post shares one hero. A per-post image would need art direction for
  // each and would be the first thing to go stale; the band's job here is to
  // say "news", not to illustrate the article.
  hero: "news",
  pagination: {
    data: "locales",
    size: 1,
    alias: "locale",
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    // Slug comes from the filename; basePath is what hreflang and the language
    // switcher both read.
    basePath: (data) => `/news/${data.page.fileSlug}/`,
    permalink: (data) =>
      data.locale === "en"
        ? `/news/${data.page.fileSlug}/`
        : `/zh/news/${data.page.fileSlug}/`,
    lang: (data) => (data.locale === "zh" ? "zh-Hans" : "en"),
    translationStatus: (data) =>
      data.locale === "en" ? "source" : data.translationStatus || "machine",
  },
};
