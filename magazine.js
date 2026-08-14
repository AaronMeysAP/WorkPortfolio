// Drives the flip-through magazine(s) on graphic-design.html. Each
// leaf is a real element with two faces (see magazine.css); this
// just decides, for the current spread, which leaves are flipped and
// how they're stacked. A page can have more than one book, so every
// .magazine gets its own independent instance below — its own leaf
// count, current page, and button/dot elements.
//
// The stacking can't be a fixed z-index per leaf: the pile of pages
// still to come needs its *lowest*-index leaf on top (so page 1 is
// what you see before opening the book), while the pile of pages
// already turned needs its *highest*-index leaf on top (the most
// recently turned page sits closest to the reader). Those are
// opposite orderings of the same list, so z-index has to be
// recomputed every time the spread changes.
//
// Raising a leaf's z-index the instant it starts flipping forward is
// fine — it's already the topmost thing, so jumping straight to the
// flipped tier keeps it on top of its own turn with no visible
// change. Lowering a leaf's z-index the instant it starts flipping
// backward is not fine: if another still-flipped leaf rests in the
// same spot with a higher z-index, the turning page would sink
// behind it immediately, before the rotation has even started, then
// pop back into view mid-animation once it rotates clear. So a
// leaf's z-index only drops into the unflipped tier once its own
// turn has actually finished (FLIP_MS, kept in sync with the
// transform transition duration in magazine.css).
(function () {
  const FLIP_MS = 1000;

  function initMagazine(magazine) {
    const leaves = Array.from(magazine.querySelectorAll('.magazine-leaf'));
    const prevBtn = magazine.querySelector('.magazine-arrow-prev');
    const nextBtn = magazine.querySelector('.magazine-arrow-next');
    const dots = Array.from(magazine.querySelectorAll('.magazine-dot'));
    if (!leaves.length || !prevBtn || !nextBtn) return;

    const leafCount = leaves.length;
    let spread = 0; // 0 = closed (cover only) .. leafCount = fully flipped

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
          // Flipped pile: later index = turned more recently = on top.
          leaf.style.zIndex = String(100 + i);
        } else if (wasFlipped) {
          // Mid-turn backward — hold the old (high) z-index until the
          // rotation completes.
          leaf._zTimer = setTimeout(() => {
            leaf.style.zIndex = String(50 - i);
            leaf._zTimer = null;
          }, FLIP_MS);
        } else {
          // Unflipped pile: earlier index = comes first = on top.
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
