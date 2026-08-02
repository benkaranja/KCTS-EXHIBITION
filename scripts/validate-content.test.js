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
