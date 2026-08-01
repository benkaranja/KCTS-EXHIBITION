// Progressive-enhancement form handler.
// Without JS the form still POSTs natively; this upgrades it to a fetch with an
// accessible live-region status so the page never reloads under the user.
//
// ponytail: one handler bound to every .form on the page. No per-form config,
// no framework, no validation library — the browser already validates.
(() => {
  const forms = document.querySelectorAll("form.form");
  if (!forms.length) return;

  for (const form of forms) {
    // Stamp render time so the Function can reject submissions that arrive
    // impossibly fast. Set here, not server-side, because a cached HTML page
    // would otherwise carry a stale timestamp.
    const stamp = form.querySelector('input[name="renderedAt"]');
    if (stamp) stamp.value = String(Date.now());

    const status = form.querySelector(".form__status");
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
      if (!form.reportValidity()) return; // let the browser show its own errors
      e.preventDefault();

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
      data.timeElapsed = Date.now() - Number(data.renderedAt || Date.now());

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          form.hidden = true;
          const done = document.createElement("div");
          done.className = "form__done sheet";
          done.setAttribute("role", "status");
          done.innerHTML =
            "<h2>Recorded</h2><p>The secretariat has your details and a confirmation is on its way. " +
            "If it does not arrive within a few minutes, check your spam folder before resubmitting.</p>";
          form.parentNode.insertBefore(done, form);
          done.focus?.();
          return;
        }

        // Name the problem AND the recovery, per the craft floor.
        if (res.status === 429) {
          say("Too many submissions from this connection. Wait a minute and try again.", "error");
        } else if (res.status === 400) {
          say("Something in the form was rejected. Check your email address and try again.", "error");
        } else {
          say("The server could not record that. Try again in a moment, or email the secretariat.", "error");
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
