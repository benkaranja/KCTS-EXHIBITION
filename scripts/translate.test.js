// parseLoose is the only part of translate.js worth pinning: it exists
// because the model emits JSON that JSON.parse rejects, and a regression here
// looks like "translation silently stayed English" rather than a crash.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLoose, tagShape } from "./translate.js";
import { attrStrings, blockStrings, applyTranslations } from "./i18n.js";

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

// --- attribute extraction ----------------------------------------------------
// Every aria-label and alt on the site shipped English to Chinese readers until
// the transform learned to look at attributes as well as element content.

test("pulls prose out of aria-label and alt", () => {
  const html = '<a aria-label="Summit on LinkedIn"><img alt="Tea fields at dawn."></a>';
  assert.deepStrictEqual(attrStrings(html), ["Summit on LinkedIn", "Tea fields at dawn."]);
});

test("skips addresses, empties and values with no words", () => {
  const html =
    '<img alt=""><input placeholder="https://"><a title="/about/"><a title="mailto:x@y.z">' +
    '<span aria-label="2027"><i aria-label="&amp;">';
  assert.deepStrictEqual(attrStrings(html), []);
});

test("does not rewrite body prose that merely quotes an attribute", () => {
  // The pattern is scoped to the inside of a tag. Without that, this paragraph
  // would be extracted and then silently translated in place.
  const html = '<p>Write alt="a description of the photograph" on every image.</p>';
  assert.deepStrictEqual(attrStrings(html), []);
});

test("reads several attributes on one element", () => {
  const html = '<img alt="A tea bud." title="Close view">';
  assert.deepStrictEqual(attrStrings(html), ["A tea bud.", "Close view"]);
});

// --- applying a translation --------------------------------------------------

test("translates element content and attribute values in one pass", () => {
  const dict = new Map([
    ["Registration", "\u767b\u8bb0"],
    ["Summit on LinkedIn", "\u9886\u82f1\u4e0a\u7684\u5cf0\u4f1a"],
  ]);
  const out = applyTranslations(
    '<h1>Registration</h1><a aria-label="Summit on LinkedIn">x</a>',
    dict,
  );
  assert.match(out, /<h1>\u767b\u8bb0<\/h1>/);
  assert.match(out, /aria-label="\u9886\u82f1\u4e0a\u7684\u5cf0\u4f1a"/);
});

test("a miss leaves the English untouched", () => {
  const out = applyTranslations('<p>Not in the dictionary</p>', new Map());
  assert.strictEqual(out, '<p>Not in the dictionary</p>');
});

test("a translation containing a double quote is refused, not shipped broken", () => {
  // It would close the attribute early and corrupt every tag after it.
  const dict = new Map([["Close panel", 'guan\u95ed "mian ban"']]);
  const out = applyTranslations('<button aria-label="Close panel">x</button>', dict);
  assert.match(out, /aria-label="Close panel"/);
});

test("legend is translatable — it was not, and shipped English on the zh form", () => {
  assert.deepStrictEqual(blockStrings("<legend>Participation type</legend>"), [
    "Participation type",
  ]);
});
