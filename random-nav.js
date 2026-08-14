// Makes the "random" nav link jump to a random project page.
// Add a new page's filename here when it's added.
(function () {
  const PAGES = [
    'adult-swim.html',
    'eastpak.html',
    'wwjd.html',
    'sunglasses.html',
    'claymation.html',
    'shokz.html',
    'water.html',
    'loop.html',
    'snc.html',
    'illustration-work.html',
    'graphic-design.html',
  ];

  const VISITED_KEY = 'randomVisited';

  const link = document.querySelector('nav a.random-link');
  if (!link) return;

  function getVisited() {
    try {
      return JSON.parse(sessionStorage.getItem(VISITED_KEY)) || [];
    } catch {
      return [];
    }
  }

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const current = location.pathname.split('/').pop();
    let visited = getVisited();

    // Every page (besides the current one) has already come up this cycle —
    // start a fresh cycle.
    let choices = PAGES.filter((p) => p !== current && !visited.includes(p));
    if (choices.length === 0) {
      visited = [];
      choices = PAGES.filter((p) => p !== current);
    }

    const pick = choices[Math.floor(Math.random() * choices.length)];
    visited.push(pick);
    sessionStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    location.href = pick;
  });
})();
