// parseLoose is the only part of translate.js worth pinning: it exists
// because the model emits JSON that JSON.parse rejects, and a regression here
// looks like "translation silently stayed English" rather than a crash.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLoose, tagShape } from "./translate.js";

test("parses well-formed JSON, fenced or bare", () => {
  assert.deepEqual(parseLoose('```json\n{"s0": "你好"}\n```'), { s0: "你好" });
  assert.deepEqual(parseLoose('{"s0": "你好"}'), { s0: "你好" });
});

test("recovers values containing unescaped ASCII quotes", () => {
  const raw = '{\n  "s0": "标注"待确定"的字段",\n  "s1": "第三方链接"\n}';
  assert.throws(() => JSON.parse(raw), "fixture must actually be invalid JSON");
  assert.deepEqual(parseLoose(raw), { s0: '标注"待确定"的字段', s1: "第三方链接" });
});

test("returns null when there is no object at all", () => {
  assert.equal(parseLoose("I cannot help with that."), null);
});

test("tagShape ignores attributes but not structure", () => {
  assert.equal(tagShape('<a href="/a/">x</a>'), tagShape('<a href="/b/">y</a>'));
  assert.notEqual(tagShape("<a>x</a>"), tagShape("x"));
  assert.notEqual(tagShape("<strong>x</strong>"), tagShape("<em>x</em>"));
});
