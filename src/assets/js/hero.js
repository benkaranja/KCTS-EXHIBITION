// Hero: corrects the build-time countdown, and attaches the background video
// only where it is wanted. Both degrade to the server-rendered state.
(() => {
  // --- countdown ---------------------------------------------------------
  for (const el of document.querySelectorAll("[data-countdown]")) {
    const ms = new Date(`${el.dataset.countdown}T00:00:00Z`) - new Date();
    const days = Math.max(0, Math.ceil(ms / 86400000));
    el.textContent = String(days);
  }

  // --- background video --------------------------------------------------
  const mount = document.querySelector("[data-hero-video]");
  if (!mount) return;

  const small = window.matchMedia("(max-width: 768px)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Respect an explicit data-saver signal too; poster is a complete experience.
  const saveData = navigator.connection?.saveData === true;
  if (small || calm || saveData) return;

  const video = document.createElement("video");
  video.className = "hero__video";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.setAttribute("tabindex", "-1");

  for (const [src, type] of [[mount.dataset.webm, "video/webm"], [mount.dataset.mp4, "video/mp4"]]) {
    if (!src) continue;
    const s = document.createElement("source");
    s.src = src;
    s.type = type;
    video.appendChild(s);
  }

  video.addEventListener("canplay", () => {
    mount.classList.add("is-playing");
    video.play().catch(() => mount.classList.remove("is-playing"));
  }, { once: true });

  mount.appendChild(video);
})();
