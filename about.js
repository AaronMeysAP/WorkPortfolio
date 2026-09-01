(function () {
  const letters = document.querySelectorAll('.about-heading .letter');
  const n = letters.length;
  if (!n) return;

  const SWEEP_MS = 1200;
  const CYCLE_MS = 10000;

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

(function () {
  const button = document.querySelector('.about-cta-button');
  if (!button) return;

  const phrases = ["Contact me", "Reach out", "Let's work together"];
  button.textContent = phrases[Math.floor(Math.random() * phrases.length)];

  button.addEventListener('mouseenter', () => {
    button.classList.remove('is-shining');
    void button.offsetWidth;
    button.classList.add('is-shining');
  });
})();
