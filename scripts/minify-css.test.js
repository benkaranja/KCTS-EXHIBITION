import { test } from "node:test";
import assert from "node:assert/strict";
import { minifyCss } from "./minify-css.js";

test("double space inside a content: string survives unchanged", () => {
  const out = minifyCss('.a::before { content: "a,  b"; }');
  assert.equal(out, '.a::before{content:"a,  b"}');
});

test("colon and comma inside a quoted string keep their spacing", () => {
  const out = minifyCss('.a::before { content: "left:  right"; }');
  assert.equal(out, '.a::before{content:"left:  right"}');
});

test("comments outside strings are stripped", () => {
  const out = minifyCss("/* header */ .a { color: red; } /* trailing */");
  assert.equal(out, ".a{color:red}");
});

test("a /* ... */ sequence inside a quoted string is not stripped", () => {
  const out = minifyCss('.a::before { content: "/* not a comment */"; }');
  assert.equal(out, '.a::before{content:"/* not a comment */"}');
});

test("url() with a quoted path survives intact", () => {
  const out = minifyCss('.a { background: url("/img/x.svg"); }');
  assert.equal(out, '.a{background:url("/img/x.svg")}');
});

test("whitespace outside strings is still collapsed", () => {
  const out = minifyCss(`.a {
    color:   red;
    margin:  0   10px ;
  }`);
  assert.equal(out, ".a{color:red;margin:0 10px}");
});

test("an empty file processes without throwing", () => {
  assert.equal(minifyCss(""), "");
});

test("a comment-free file processes without throwing", () => {
  const out = minifyCss(".a{color:red}");
  assert.equal(out, ".a{color:red}");
});
