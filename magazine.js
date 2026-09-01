(function () {
  const FLIP_MS = 1000;

  function initMagazine(magazine) {
    const leaves = Array.from(magazine.querySelectorAll('.magazine-leaf'));
    const prevBtn = magazine.querySelector('.magazine-arrow-prev');
    const nextBtn = magazine.querySelector('.magazine-arrow-next');
    const dots = Array.from(magazine.querySelectorAll('.magazine-dot'));
    if (!leaves.length || !prevBtn || !nextBtn) return;

    const leafCount = leaves.length;
    let spread = 0;

    function render() {
      leaves.forEach((leaf, i) => {
        const flipped = i < spread;
        const wasFlipped = leaf.classList.contains('is-flipped');

        if (leaf._zTimer) {
          clearTimeout(leaf._zTimer);
          leaf._zTimer = null;
        }

        leaf.classList.toggle('is-flipped', flipped);

        if (flipped) {
          leaf.style.zIndex = String(100 + i);
        } else if (wasFlipped) {
          leaf._zTimer = setTimeout(() => {
            leaf.style.zIndex = String(50 - i);
            leaf._zTimer = null;
          }, FLIP_MS);
        } else {
          leaf.style.zIndex = String(50 - i);
        }
      });

      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === spread));

      prevBtn.classList.toggle('is-hidden', spread === 0);
      nextBtn.classList.toggle('is-hidden', spread === leafCount);
    }

    prevBtn.addEventListener('click', () => {
      if (spread === 0) return;
      spread -= 1;
      render();
    });

    nextBtn.addEventListener('click', () => {
      if (spread === leafCount) return;
      spread += 1;
      render();
    });

    render();
  }

  document.querySelectorAll('.magazine').forEach(initMagazine);
})();
