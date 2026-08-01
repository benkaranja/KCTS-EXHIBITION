import summit from "./src/_data/summit.js";

export default function (eleventyConfig) {
  // Assets are copied verbatim; nothing is bundled. The shipped site is
  // HTML + CSS + vanilla JS, per ADR-003.
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "fonts" });
  // robots.txt and sitemap.xml are generated (src/robots.njk, src/sitemap.njk)
  // so they always carry the current origin — see ADR-010.
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });

  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());

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

  eleventyConfig.addFilter("speakersFor", (speakers, sessionSlug) =>
    speakers.filter((s) => (s.data.sessions ?? []).includes(sessionSlug)),
  );

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
