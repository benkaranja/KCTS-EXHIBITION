// Mobile nav toggle. The only JS the shell needs.
// ponytail: no framework, no delegation helper — one button, one list.
(() => {
  const toggle = document.querySelector(".site-nav__toggle");
  const list = document.getElementById("primary-nav");
  if (!toggle || !list) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    list.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Escape closes and returns focus to the button, so keyboard users are not
  // stranded inside an open menu.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
})();
