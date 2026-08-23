// Keeps the phone field's flag and dial display in step with its native
// <select>. Everything else about the control is native: the select handles
// keyboard, typeahead and the mobile wheel picker on its own.
//
// ponytail: no combobox implementation, no focus management, no ARIA state to
// keep in sync. The one thing the platform cannot do is show a flag, so that
// is the only thing here.
(() => {
  for (const wrap of document.querySelectorAll("[data-phone-country]")) {
    const select = wrap.querySelector("select");
    const flag = wrap.querySelector(".flag");
    const dial = wrap.querySelector("[data-phone-dial]");
    if (!select || !flag || !dial) continue;

    // Row height in the sprite, at display scale. Must match CELL_H / 2 in
    // scripts/make-flags.js.
    const ROW = 15;

    const sync = () => {
      const opt = select.selectedOptions[0];
      if (!opt) return;
      const row = Number(opt.dataset.row);
      if (Number.isFinite(row)) {
        // CSSOM, not a style attribute: the CSP forbids the latter.
        flag.style.backgroundPosition = `0 ${-row * ROW}px`;
      }
      dial.textContent = opt.value;
      // The visible display is aria-hidden, so the select carries the accessible
      // name and it has to say which country is chosen, not just "dialling code".
      select.setAttribute("aria-label", `Country dialling code: ${opt.textContent.trim()}`);
    };

    select.addEventListener("change", sync);
    sync();
  }
})();
