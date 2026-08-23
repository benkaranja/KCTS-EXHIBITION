// Progressive-enhancement form handler.
// Without JS the form still POSTs natively; this upgrades it to a fetch with an
// accessible live-region status so the page never reloads under the user.
//
// ponytail: one handler bound to every .form on the page. No per-form config,
// no framework, no validation library.
//
// It does three things the browser does not do well on its own:
//   1. normalises the phone field to a single E.164 value,
//   2. replaces native validation bubbles with persistent inline errors,
//   3. reports failures by naming the problem AND the recovery.
(() => {
  const forms = document.querySelectorAll("form.form");
  if (!forms.length) return;

  // --- inline validation ---------------------------------------------------
  // The browser's own bubbles show one error at a time, vanish on blur, and are
  // announced inconsistently across screen readers. These are real DOM nodes,
  // wired with aria-describedby and aria-invalid, so they persist and are read.
  const messageFor = (field) => {
    const v = field.validity;
    const label =
      field.closest(".form__row")?.querySelector(".label")?.textContent.replace("*", "").trim() ||
      "This field";
    if (v.valueMissing) return `${label} is required.`;
    if (v.typeMismatch && field.type === "email") return "Enter an email address, including the @.";
    if (v.typeMismatch && field.type === "url") return "Enter a full web address, starting with https://";
    if (v.tooShort) return `${label} is too short.`;
    if (v.tooLong) return `${label} is too long.`;
    if (v.patternMismatch) return `${label} is not in the expected format.`;
    return field.validationMessage;
  };

  const clearError = (field) => {
    field.removeAttribute("aria-invalid");
    const row = field.closest(".form__row");
    row?.querySelector(".form__error")?.remove();
    // aria-describedby may also point at a hint, so remove only our id.
    const described = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter((id) => id && id !== `${field.id}-error`)
      .join(" ");
    if (described) field.setAttribute("aria-describedby", described);
    else field.removeAttribute("aria-describedby");
  };

  const showError = (field, msg) => {
    const row = field.closest(".form__row");
    if (!row) return;
    clearError(field);
    const el = document.createElement("span");
    el.className = "form__error";
    el.id = `${field.id}-error`;
    el.textContent = msg;
    row.appendChild(el);
    field.setAttribute("aria-invalid", "true");
    const existing = field.getAttribute("aria-describedby");
    field.setAttribute("aria-describedby", existing ? `${existing} ${el.id}` : el.id);
  };

  const validate = (form) => {
    const bad = [];
    for (const field of form.querySelectorAll("input, select, textarea")) {
      if (field.type === "hidden" || field.closest(".hp")) continue;
      if (field.checkValidity()) clearError(field);
      else {
        showError(field, messageFor(field));
        bad.push(field);
      }
    }
    return bad;
  };

  for (const form of forms) {
    // Stamp render time so the Function can reject submissions that arrive
    // impossibly fast. Set here, not server-side, because a cached HTML page
    // would otherwise carry a stale timestamp.
    const stamp = form.querySelector('input[name="renderedAt"]');
    if (stamp) stamp.value = String(Date.now());

    const status = form.querySelector(".form__status");
    const button = form.querySelector('button[type="submit"]');

    // Clear a field's error as soon as it becomes valid. Waiting for the next
    // submit leaves a corrected field still showing red.
    form.addEventListener("input", (e) => {
      const f = e.target;
      if (f.getAttribute("aria-invalid") === "true" && f.checkValidity()) clearError(f);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const bad = validate(form);
      if (bad.length) {
        bad[0].focus();
        if (status) {
          status.textContent =
            bad.length === 1
              ? "One field needs attention."
              : `${bad.length} fields need attention.`;
          status.dataset.kind = "error";
        }
        return;
      }

      const say = (msg, kind) => {
        if (!status) return;
        status.textContent = msg;
        status.dataset.kind = kind;
      };

      button.disabled = true;
      const label = button.textContent;
      button.textContent = "Sending…";
      say("Sending your details.", "pending");

      const data = Object.fromEntries(new FormData(form).entries());

      // Checkboxes sharing a name collapse to the last value under
      // Object.fromEntries. Participation type allows both, so read it properly.
      const participation = new FormData(form).getAll("participation");
      if (participation.length) data.participation = participation;

      // Join the split phone field into one E.164 value. The two controls
      // are a UI concern; the backend and the D1 ledger store one string.
      // A leading zero is a national trunk prefix and is wrong after a country
      // code, which is exactly what the hint warns about and exactly what
      // people type anyway.
      if (data.phone !== undefined) {
        const national = String(data.phone).replace(/[^\d]/g, "").replace(/^0+/, "");
        const cc = String(data.phoneCountry || "").replace(/[^\d+]/g, "");
        data.phone = national ? `${cc}${national}` : "";
        delete data.phoneCountry;
      }

      data.timeElapsed = Date.now() - Number(data.renderedAt || Date.now());

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          // The form STAYS. It used to be hidden and replaced by a panel,
          // which meant a delegate who wanted to register a colleague had to
          // reload, and anyone who mistyped a field lost everything they had
          // entered. Values are kept too, for the same reason.
          say(
            "Recorded. The Secretariat has your details and a confirmation is on its way. " +
              "If it does not arrive within a few minutes, check your spam folder before resubmitting.",
            "ok",
          );
          // Move focus to the message rather than scrolling silently: a screen
          // reader gets it from the live region, everyone else needs to be
          // taken to it, and the submit button is now above it.
          status?.focus?.();
          status?.scrollIntoView?.({ block: "center", behavior: "smooth" });
          return;
        }

        // Name the problem AND the recovery, per the craft floor.
        if (res.status === 429) {
          say("Too many submissions from this connection. Wait a minute and try again.", "error");
        } else if (res.status === 400) {
          say("Something in the form was rejected. Check your email address and try again.", "error");
        } else {
          say("The server could not record that. Try again in a moment, or email the Secretariat.", "error");
        }
      } catch {
        say("No connection. Check your network and try again — nothing was sent.", "error");
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  }
})();
