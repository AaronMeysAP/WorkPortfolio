// Periodically flashes a small arrow pointing at the "contact" nav link,
// as a gentle nudge. This script isn't included on contact.html, so the
// arrow never appears on the page it points to.
(function () {
  const nudge = document.querySelector('.contact-nudge');
  if (!nudge) return;

  const SHOW_MS = 6000;
  const CYCLE_MS = 30000;

  function pulse() {
    nudge.classList.add('is-visible');
    setTimeout(() => nudge.classList.remove('is-visible'), SHOW_MS);
  }

  setTimeout(pulse, CYCLE_MS);
  setInterval(pulse, CYCLE_MS);
})();
