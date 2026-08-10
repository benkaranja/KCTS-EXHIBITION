// Rule 8 is the only validator rule that touches the filesystem outside src/,
// so it is the one worth pinning: a downloads page listing a 404 is worse than
// no downloads page at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const run = () => {
  try {
    execFileSync("node", ["scripts/validate-content.js"], { encoding: "utf8" });
    return { code: 0, out: "" };
  } catch (e) {
    return { code: e.status, out: e.stdout + e.stderr };
  }
};

test("rule 8: a download whose file is missing fails the build", () => {
  mkdirSync("src/downloads", { recursive: true });
  writeFileSync(
    "src/downloads/__fixture.md",
    `---\ntitle: Fixture\ncategory: report\nfile: /files/does-not-exist.pdf\nbytes: 123\nformat: PDF\n---\n`,
  );
  const { code, out } = run();
  rmSync("src/downloads/__fixture.md");
  assert.equal(code, 1, "validator should exit 1");
  assert.match(out, /does-not-exist\.pdf/, "error should name the missing file");
});

test("rule 8: a download whose bytes mismatch fails the build", () => {
  mkdirSync("src/static-files", { recursive: true });
  writeFileSync("src/static-files/__fixture.pdf", "x".repeat(500));
  writeFileSync(
    "src/downloads/__fixture.md",
    `---\ntitle: Fixture\ncategory: report\nfile: /files/__fixture.pdf\nbytes: 999\nformat: PDF\n---\n`,
  );
  const { code, out } = run();
  rmSync("src/downloads/__fixture.md");
  rmSync("src/static-files/__fixture.pdf");
  assert.equal(code, 1);
  assert.match(out, /bytes/i);
});

test("rule 8: a download whose bytes match passes", () => {
  mkdirSync("src/static-files", { recursive: true });
  writeFileSync("src/static-files/__fixture.pdf", "x".repeat(500));
  writeFileSync(
    "src/downloads/__fixture.md",
    `---\ntitle: Fixture\ncategory: report\nfile: /files/__fixture.pdf\nbytes: 500\nformat: PDF\n---\n`,
  );
  const { code, out } = run();
  rmSync("src/downloads/__fixture.md");
  rmSync("src/static-files/__fixture.pdf");
  assert.equal(code, 0, out);
});

test("rule 9: a page that opts out of localisation fails the build", () => {
  writeFileSync(
    "src/pages/__orphan.njk",
    `---\nlayout: layouts/page.njk\nbasePath: /orphan/\ntitle: Orphan\ndescription: x\nnoLocale: true\n---\nbody\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__orphan.njk");
  assert.equal(code, 1);
  assert.match(out, /orphan/i);
});

test("rule 9: a page missing basePath fails the build", () => {
  writeFileSync(
    "src/pages/__nobase.njk",
    `---\nlayout: layouts/page.njk\ntitle: No base\ndescription: x\n---\nbody\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__nobase.njk");
  assert.equal(code, 1);
  assert.match(out, /basePath/);
});

test("rule 10: a bracketed approval marker fails the build", () => {
  writeFileSync(
    "src/pages/__marker.njk",
    `---\nlayout: layouts/page.njk\nbasePath: /marker/\ntitle: Marker\ndescription: x\n---\n<p>Fees are [Confirm whether a student rate applies].</p>\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__marker.njk");
  assert.equal(code, 1, "validator should exit 1");
  assert.match(out, /__marker\.njk/, "error should name the file");
});

test("rule 10: the retired 'to be entered' wording fails the build", () => {
  writeFileSync(
    "src/pages/__retired.njk",
    `---\nlayout: layouts/page.njk\nbasePath: /retired/\ntitle: Retired\ndescription: x\n---\n<p>Venue: to be entered.</p>\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__retired.njk");
  assert.equal(code, 1);
  assert.match(out, /to be announced/i, "error should name the replacement wording");
});

test("rule 10: an approved page with no markers passes", () => {
  writeFileSync(
    "src/pages/__ok.njk",
    `---\nlayout: layouts/page.njk\nbasePath: /ok/\ntitle: Ok\ndescription: x\n---\n<p>Venue: To be announced.</p>\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__ok.njk");
  assert.equal(code, 0, out);
});

test("rule 9: a news post without basePath fails the build", () => {
  mkdirSync("src/news", { recursive: true });
  writeFileSync(
    "src/news/__nobase.md",
    `---\nlayout: layouts/page.njk\ntitle: No base\ndescription: x\n---\nbody\n`,
  );
  const { code, out } = run();
  rmSync("src/news/__nobase.md");
  assert.equal(code, 1);
  assert.match(out, /basePath/);
});
