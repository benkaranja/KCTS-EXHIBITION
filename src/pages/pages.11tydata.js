// Renders every page in this directory once per locale. Pages declare
// `basePath: /about/`; the permalink is computed from it, so adding a locale
// never means touching 18 files again.
export default {
  pagination: {
    data: "locales",
    size: 1,
    alias: "locale",
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    permalink: (data) =>
      data.locale === "en" ? data.basePath : `/zh${data.basePath}`,
    lang: (data) => (data.locale === "zh" ? "zh-Hans" : "en"),
    // Machine translation is noindex until a human reviews it. Setting
    // `translationStatus: reviewed` in a page's front matter releases it.
    translationStatus: (data) =>
      data.locale === "en" ? "source" : data.translationStatus || "machine",
  },
};
