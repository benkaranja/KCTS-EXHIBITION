// Icon paths are hand-maintained data, and a broken one fails silently: the
// SVG still renders, it just draws a scribble. This walks every path the way a
// renderer would and asserts it traces something sane inside the 24-grid.
//
// Caught during the V3 icon work, when a first pass flagged 19 of 24 icons as
// broken — the check was treating relative deltas as absolute coordinates.
// The real defect rate was zero. A checker that cries wolf is worse than none,
// so this one tracks the current point properly and expands arcs by their
// radii rather than pretending an arc is a line between its endpoints.

import { test } from "node:test";
import assert from "node:assert/strict";
import icons from "../src/_data/icons.js";

const ARGS = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

export function traceBBox(d) {
  const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  let x = 0, y = 0, sx = 0, sy = 0, cmd = null, i = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const errors = [];
  const hit = (px, py) => {
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  };

  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) { cmd = toks[i]; i++; }
    if (!cmd) { errors.push("does not start with a command"); break; }
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    const n = ARGS[up];
    if (n === undefined) { errors.push(`unknown command ${cmd}`); break; }
    if (up === "Z") { x = sx; y = sy; continue; }

    const a = [];
    for (let k = 0; k < n; k++) {
      const t = toks[i++];
      if (t === undefined || /[A-Za-z]/.test(t)) { errors.push(`${cmd} is missing arguments`); return { errors }; }
      a.push(Number(t));
    }

    if (up === "H") x = rel ? x + a[0] : a[0];
    else if (up === "V") y = rel ? y + a[0] : a[0];
    else if (up === "A") {
      // An arc bulges PERPENDICULAR to its chord, not in both axes. Two
      // earlier attempts got this wrong and each produced a confident false
      // positive: expanding by the full radius flagged `savings`, expanding
      // isotropically by the sagitta flagged the `language` globe, whose
      // semicircle spans exactly 2r along the chord and bulges only sideways.
      //
      // So: find the chord, compute the sagitta, and offset the midpoint along
      // the chord normal in both directions — sweep direction is irrelevant
      // when you take both, and taking both is the safe over-estimate.
      const [rxRaw, ryRaw, , largeArc, , ex, ey] = a;
      const nx = rel ? x + ex : ex;
      const ny = rel ? y + ey : ey;
      const r = Math.max(Math.abs(rxRaw), Math.abs(ryRaw));
      const dx = nx - x, dy = ny - y;
      const L = Math.hypot(dx, dy);
      if (L > 0 && r > 0) {
        const half = Math.min(L / 2, r);
        const h = Math.sqrt(Math.max(0, r * r - half * half));
        const sag = largeArc ? r + h : r - h;
        const mx = (x + nx) / 2, my = (y + ny) / 2;
        const px = -dy / L, py = dx / L;
        hit(mx + px * sag, my + py * sag);
        hit(mx - px * sag, my - py * sag);
      }
      hit(x, y);
      hit(nx, ny);
      x = nx; y = ny;
    } else {
      for (let k = 0; k < n; k += 2) {
        const px = rel ? x + a[k] : a[k];
        const py = rel ? y + a[k + 1] : a[k + 1];
        hit(px, py);
        if (k === n - 2) { x = px; y = py; }
      }
    }
    hit(x, y);
    // A moveto's trailing pairs are implicit linetos, not more movetos.
    if (up === "M") { sx = x; sy = y; cmd = rel ? "l" : "L"; }
  }
  return { minX, minY, maxX, maxY, errors };
}

test("every icon path parses and traces inside the 24 grid", () => {
  const names = Object.keys(icons);
  assert.ok(names.length > 0, "icon set is empty");

  for (const name of names) {
    const { path } = icons[name];
    assert.ok(typeof path === "string" && path.length > 20, `${name}: path missing or too short`);

    const b = traceBBox(path);
    assert.deepEqual(b.errors, [], `${name}: ${b.errors.join("; ")}`);

    // A little slack: strokes are centred on the path, so 1.5px of stroke
    // legitimately overhangs by 0.75 either side.
    assert.ok(b.minX >= -2 && b.minY >= -2, `${name}: starts outside the grid at ${b.minX},${b.minY}`);
    assert.ok(b.maxX <= 26 && b.maxY <= 26, `${name}: extends past the grid to ${b.maxX},${b.maxY}`);

    // A degenerate path still renders, it just renders as a scribble.
    assert.ok(b.maxX - b.minX >= 6, `${name}: only ${(b.maxX - b.minX).toFixed(1)} wide`);
    assert.ok(b.maxY - b.minY >= 6, `${name}: only ${(b.maxY - b.minY).toFixed(1)} tall`);
  }
});

test("every icon referenced by summit.js exists in the set", async () => {
  const summit = (await import("../src/_data/summit.js")).default;
  const referenced = [
    ...summit.objectives.map((o) => o.icon),
    ...summit.exhibition.categories.map((c) => c.icon),
    ...summit.registrationCategories.map((c) => c.icon),
  ].filter(Boolean);

  assert.ok(referenced.length >= 19, `expected the data to reference icons, found ${referenced.length}`);
  for (const name of referenced) {
    assert.ok(icons[name], `summit.js references icon "${name}", which is not in icons.js`);
  }
});
