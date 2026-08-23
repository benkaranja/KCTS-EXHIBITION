/**
 * Exhibition 2D Floor Plan — SVG renderer
 *
 * Generates an accessible, interactive SVG floor plan from the booth manifest.
 * Each booth is a focusable DOM node with role="button", aria-label carrying
 * the booth id, zone and status, and a data-status attribute that CSS uses
 * to colour it.
 *
 * No three.js, no framework, no literal colours. Colour comes from CSS via
 * data-status attributes. Geometry (x, y, width, height) stays as SVG
 * attributes because it is data.
 *
 * Public API (called by the portal on feat/portal):
 *   renderPlan(root, manifest, options)
 *   setStatus(boothId, status)
 *   Events: "booth:select" dispatched on root with { detail: { id } }
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** @type {Map<string, SVGRectElement>} */
const boothElements = new Map();

/** @type {HTMLElement|null} */
let rootElement = null;

/** @type {object|null} */
let manifestData = null;

/** @type {string} */
let activeHall = "all";

/** @type {Record<string, string>} */
let t = {};

function initStrings() {
  t = Object.fromEntries(
    [...document.querySelectorAll("#plan-strings li")].map((el) => [
      el.dataset.key,
      el.textContent,
    ])
  );
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Render the 2D SVG floor plan into a container.
 * @param {HTMLElement} root  — container element
 * @param {object} manifest  — the booths.json data
 * @param {object} [options] — { hall: "all"|"A"|"B" }
 */
export function renderPlan(root, manifest, options = {}) {
  rootElement = root;
  manifestData = manifest;
  activeHall = options.hall || "all";
  if (Object.keys(t).length === 0) initStrings();
  generateSVG();
}

/**
 * Update a single booth's status. CSS colours it via data-status.
 * @param {string} boothId
 * @param {string} status — "available"|"held"|"booked"|"blocked"
 */
export function setStatus(boothId, status) {
  const rect = boothElements.get(boothId);
  if (!rect) return;
  rect.dataset.status = status;
  // Update aria-label to reflect the new status
  const booth = findBooth(boothId);
  if (booth) {
    const standWord = t.stand || "Stand";
    const statusLabel = t[status] || status;
    rect.setAttribute(
      "aria-label",
      `${standWord} ${booth.id}, ${booth.zone}, ${statusLabel}`
    );
  }
}

// ── Internal ────────────────────────────────────────────────────────────

function findBooth(id) {
  if (!manifestData) return null;
  for (const hall of manifestData.halls) {
    const b = hall.booths.find((b) => b.id === id);
    if (b) return { ...b, hallId: hall.id };
  }
  return null;
}

function generateSVG() {
  const container = document.getElementById("plan-container");
  if (!container || !manifestData) return;

  boothElements.clear();

  // Collect all halls to render
  const halls = manifestData.halls.filter(
    (h) => activeHall === "all" || h.id === activeHall
  );

  // Compute bounding box from all booths across filtered halls
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const hall of halls) {
    for (const b of hall.booths) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }
  }

  const padding = 4;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxW = maxX - minX + padding * 2;
  const viewBoxH = maxY - minY + padding * 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute(
    "viewBox",
    `${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`
  );
  svg.setAttribute("class", "plan-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", t.planLabel || "Exhibition floor plan");

  // Hatch pattern for blocked booths (survives greyscale)
  const defs = document.createElementNS(SVG_NS, "defs");
  const hatchPattern = document.createElementNS(SVG_NS, "pattern");
  hatchPattern.setAttribute("id", "hatch-blocked");
  hatchPattern.setAttribute("patternUnits", "userSpaceOnUse");
  hatchPattern.setAttribute("width", "1");
  hatchPattern.setAttribute("height", "1");
  hatchPattern.setAttribute("patternTransform", "rotate(45)");

  const hatchLine = document.createElementNS(SVG_NS, "line");
  hatchLine.setAttribute("x1", "0");
  hatchLine.setAttribute("y1", "0");
  hatchLine.setAttribute("x2", "0");
  hatchLine.setAttribute("y2", "1");
  hatchLine.setAttribute("class", "hatch-line");
  hatchPattern.appendChild(hatchLine);
  defs.appendChild(hatchPattern);

  // Cross-hatch pattern for held booths (distinguishable from plain fill)
  const heldPattern = document.createElementNS(SVG_NS, "pattern");
  heldPattern.setAttribute("id", "hatch-held");
  heldPattern.setAttribute("patternUnits", "userSpaceOnUse");
  heldPattern.setAttribute("width", "1.2");
  heldPattern.setAttribute("height", "1.2");

  const heldDot = document.createElementNS(SVG_NS, "circle");
  heldDot.setAttribute("cx", "0.6");
  heldDot.setAttribute("cy", "0.6");
  heldDot.setAttribute("r", "0.15");
  heldDot.setAttribute("class", "held-dot");
  heldPattern.appendChild(heldDot);
  defs.appendChild(heldPattern);

  // Diagonal fill for booked booths (second pattern cue)
  const bookedPattern = document.createElementNS(SVG_NS, "pattern");
  bookedPattern.setAttribute("id", "hatch-booked");
  bookedPattern.setAttribute("patternUnits", "userSpaceOnUse");
  bookedPattern.setAttribute("width", "1.5");
  bookedPattern.setAttribute("height", "1.5");
  bookedPattern.setAttribute("patternTransform", "rotate(-45)");

  const bookedLine = document.createElementNS(SVG_NS, "line");
  bookedLine.setAttribute("x1", "0");
  bookedLine.setAttribute("y1", "0");
  bookedLine.setAttribute("x2", "0");
  bookedLine.setAttribute("y2", "1.5");
  bookedLine.setAttribute("class", "booked-line");
  bookedPattern.appendChild(bookedLine);
  defs.appendChild(bookedPattern);

  svg.appendChild(defs);

  // Render each hall
  for (const hall of halls) {
    const hallGroup = document.createElementNS(SVG_NS, "g");
    hallGroup.setAttribute("class", "plan-hall");
    hallGroup.setAttribute("data-hall", hall.id);

    // Hall outline
    const hallBg = document.createElementNS(SVG_NS, "rect");
    // Use the hall's own dimensions for the outline
    const hallMinX = Math.min(...hall.booths.map((b) => b.x)) - 1;
    const hallMinY = Math.min(...hall.booths.map((b) => b.y)) - 3;
    const hallMaxX = Math.max(...hall.booths.map((b) => b.x + b.w)) + 1;
    const hallMaxY = Math.max(...hall.booths.map((b) => b.y + b.h)) + 1;

    hallBg.setAttribute("x", hallMinX);
    hallBg.setAttribute("y", hallMinY);
    hallBg.setAttribute("width", hallMaxX - hallMinX);
    hallBg.setAttribute("height", hallMaxY - hallMinY);
    hallBg.setAttribute("class", "plan-hall__bg");
    hallGroup.appendChild(hallBg);

    // Hall label
    const hallLabel = document.createElementNS(SVG_NS, "text");
    hallLabel.setAttribute("x", (hallMinX + hallMaxX) / 2);
    hallLabel.setAttribute("y", hallMinY + 1.5);
    hallLabel.setAttribute("class", "plan-hall__label");
    hallLabel.textContent = hall.name;
    hallGroup.appendChild(hallLabel);

    // Booths
    for (const booth of hall.booths) {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "booth");

      const standWord = t.stand || "Stand";
      const statusLabel = t[booth.status] || booth.status;

      // Base fill rect
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", booth.x);
      rect.setAttribute("y", booth.y);
      rect.setAttribute("width", booth.w);
      rect.setAttribute("height", booth.h);
      rect.setAttribute("class", "booth__fill");
      rect.dataset.status = booth.status;
      rect.dataset.boothId = booth.id;
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute(
        "aria-label",
        `${standWord} ${booth.id}, ${booth.zone}, ${statusLabel}`
      );

      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${standWord} ${booth.id} (${booth.zone}), ${statusLabel}`;
      rect.appendChild(title);

      g.appendChild(rect);

      // Pattern overlay for held/booked/blocked (WCAG 1.4.1: not colour alone)
      if (
        booth.status === "held" ||
        booth.status === "booked" ||
        booth.status === "blocked"
      ) {
        const overlay = document.createElementNS(SVG_NS, "rect");
        overlay.setAttribute("x", booth.x);
        overlay.setAttribute("y", booth.y);
        overlay.setAttribute("width", booth.w);
        overlay.setAttribute("height", booth.h);
        overlay.setAttribute("class", "booth__pattern");
        overlay.dataset.status = booth.status;
        g.appendChild(overlay);
      }

      // Label text
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", booth.x + booth.w / 2);
      text.setAttribute("y", booth.y + booth.h / 2);
      text.setAttribute("class", "booth__label");
      // Extract just the number from "A-001" for display
      text.textContent = booth.id.split("-")[1]?.replace(/^0+/, "") || booth.id;
      g.appendChild(text);

      hallGroup.appendChild(g);
      boothElements.set(booth.id, rect);
    }

    svg.appendChild(hallGroup);
  }

  container.innerHTML = "";
  container.appendChild(svg);
  attachEvents(svg);
}

function attachEvents(svg) {
  // Click
  svg.addEventListener("click", (e) => {
    const rect = e.target.closest(".booth__fill");
    if (!rect) return;
    const boothId = rect.dataset.boothId;
    if (boothId) dispatchSelect(boothId);
  });

  // Keyboard
  svg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const rect = e.target.closest(".booth__fill");
      if (!rect) return;
      e.preventDefault();
      const boothId = rect.dataset.boothId;
      if (boothId) dispatchSelect(boothId);
    }
  });
}

function dispatchSelect(boothId) {
  if (!rootElement) return;
  rootElement.dispatchEvent(
    new CustomEvent("booth:select", { detail: { id: boothId }, bubbles: true })
  );
}

// ── Page bootstrap ──────────────────────────────────────────────────────
// Runs when loaded as a <script type="module"> on the exhibition-plan page.

function init() {
  initStrings();

  const root = document.getElementById("exhibition-root");
  const container = document.getElementById("plan-container");
  if (!root || !container) return;

  // Read manifest from the DOM — the Eleventy template embeds it as
  // application/json, which is inert (not executed) and CSP-safe.
  const manifestEl = document.getElementById("booth-manifest");
  if (!manifestEl) {
    container.textContent = t.loadError || "The floor plan could not be loaded.";
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestEl.textContent);
  } catch (err) {
    console.error("Exhibition plan: invalid manifest", err);
    container.textContent = t.loadError || "The floor plan could not be loaded.";
    return;
  }

  renderPlan(root, manifest);

  // Hall filter buttons
  const btns = document.querySelectorAll("[data-hall]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) =>
        b.classList.remove("plan-controls__btn--active")
      );
      btn.classList.add("plan-controls__btn--active");
      activeHall = btn.dataset.hall;
      generateSVG();
    });
  });

  // Booth selection → show panel
  root.addEventListener("booth:select", (e) => {
    const booth = findBooth(e.detail.id);
    if (!booth) return;
    showPanel(booth);
  });

  // 3D view button — wired in step 3
  const btn3d = document.getElementById("btn-3d-view");
  if (btn3d) {
    btn3d.addEventListener("click", async () => {
      // Dynamic import — wired in step 3 of the port
      // await import("/js/exhibition/three-view.js");
    });
  }
}

function showPanel(booth) {
  const panel = document.getElementById("booth-panel");
  if (!panel) return;
  panel.hidden = false;

  const title = document.getElementById("panel-title");
  const zone = document.getElementById("panel-zone");
  const size = document.getElementById("panel-size");
  const status = document.getElementById("panel-status");

  const standWord = t.stand || "Stand";
  const statusLabel = t[booth.status] || booth.status;

  if (title) title.textContent = `${standWord} ${booth.id}`;
  if (zone) zone.textContent = booth.zone;
  if (size) size.textContent = `${booth.w}m × ${booth.h}m`;
  if (status) status.textContent = statusLabel;
}

function hidePanel() {
  const panel = document.getElementById("booth-panel");
  if (panel) panel.hidden = true;
}

// Close panel
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("panel-close");
  if (closeBtn) closeBtn.addEventListener("click", hidePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hidePanel();
  });
});

// Boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
