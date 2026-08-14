// Cycles the "Designer" heading through its letters, showing exactly one
// in an alternate font at a time. Widths never change (see about.css) so
// this never causes layout shift. Every CYCLE_MS, a wave sweeps once
// left to right through the letters (always exactly one letter — or
// none, at the very start/end — in the alt font), the whole sweep
// finishing in SWEEP_MS.
(function () {
  const letters = document.querySelectorAll('.about-heading .letter');
  const n = letters.length;
  if (!n) return;

  const SWEEP_MS = 1200;
  const CYCLE_MS = 10000;

  // n+1 events, evenly spaced: one "light letter k" per letter, plus a
  // final event that just unlights the last letter.
  const times = [];
  for (let k = 0; k <= n; k++) times.push((SWEEP_MS * k) / n);

  function sweep() {
    let prev = null;
    for (let k = 0; k <= n; k++) {
      setTimeout(() => {
        if (prev !== null) letters[prev].classList.remove('is-alt');
        if (k < n) {
          letters[k].classList.add('is-alt');
          prev = k;
        }
      }, times[k]);
    }
  }

  sweep();
  setInterval(sweep, CYCLE_MS);
})();

// Picks one of a few CTA phrases at random for the big contact button,
// and fires the button's one-shot shine sweep on every hover-in.
(function () {
  const button = document.querySelector('.about-cta-button');
  if (!button) return;

  const phrases = ["Contact me", "Reach out", "Let's work together"];
  button.textContent = phrases[Math.floor(Math.random() * phrases.length)];

  button.addEventListener('mouseenter', () => {
    button.classList.remove('is-shining');
    // Force a reflow so re-adding the class restarts the animation even
    // when hovering again before the previous sweep finished.
    void button.offsetWidth;
    button.classList.add('is-shining');
  });
})();
