function loadVimeoThumb(el) {
  const id = el.dataset.vimeoId;
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${id}?background=1&dnt=1`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  el.appendChild(iframe);
}

function loadYouTubeThumb(el) {
  const id = el.dataset.youtubeId;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  el.appendChild(iframe);
}

const thumbObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.vimeoId) loadVimeoThumb(el);
    else if (el.dataset.youtubeId) loadYouTubeThumb(el);
    observer.unobserve(el);
  });
}, { rootMargin: '200px' });

document.querySelectorAll('[data-vimeo-id], [data-youtube-id]').forEach(el => {
  thumbObserver.observe(el);
});

const TILT = {
  maxRotate:   8,
  lift:        14,
  hoverScale:  1.05,
  perspective: 700,
  returnSpeed: '0.55s ease',
};

let _minCardWidth = 0;
window.addEventListener('resize', () => { _minCardWidth = 0; });

document.querySelectorAll('.grid-item').forEach(card => {
  if (card.dataset.ratio === '21x9') return;

  let trackingTimer = null;
  let scale = 1;

  card.addEventListener('mouseenter', () => {
    if (!_minCardWidth) {
      _minCardWidth = Math.min(
        ...Array.from(document.querySelectorAll('.grid-item'))
          .map(el => el.getBoundingClientRect().width)
      );
    }
    scale = _minCardWidth / card.getBoundingClientRect().width;

    card.style.zIndex     = '10';
    card.style.transition = 'transform 0.15s ease';

    trackingTimer = setTimeout(() => {
      card.style.transition = 'transform 0.06s ease';
    }, 150);
  });

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)  / r.width  - 0.5;
    const y = (e.clientY - r.top)   / r.height - 0.5;

    card.style.transform = [
      `perspective(${TILT.perspective}px)`,
      `rotateX(${-y * TILT.maxRotate * 2 * scale}deg)`,
      `rotateY(${ x * TILT.maxRotate * 2 * scale}deg)`,
      `translateY(-${TILT.lift * scale}px)`,
      `scale(${TILT.hoverScale})`,
    ].join(' ');
  });

  card.addEventListener('mouseleave', () => {
    clearTimeout(trackingTimer);
    card.style.transition = `transform ${TILT.returnSpeed}`;
    card.style.transform  = '';
    card.style.zIndex     = '';
  });
});

document.querySelectorAll('.grid-item').forEach(card => {
  const img = card.querySelector('img');

  const name = img
    ? img.getAttribute('src').split('/')[1]
    : card.getAttribute('alt');

  if (!name) return;

  const label    = document.createElement('div');
  const textSpan = document.createElement('span');
  const cursor   = document.createElement('span');

  label.className    = 'label';
  cursor.className   = 'label-cursor';
  cursor.textContent = '|';

  label.appendChild(textSpan);
  label.appendChild(cursor);
  card.appendChild(label);

  let timer = null;
  let pos   = 0;

  card.addEventListener('mouseenter', () => {
    clearInterval(timer);
    label.classList.add('active');
    timer = setInterval(() => {
      if (pos < name.length) {
        textSpan.textContent = name.slice(0, ++pos);
      } else {
        clearInterval(timer);
      }
    }, 15);
  });

  card.addEventListener('mouseleave', () => {
    clearInterval(timer);
    timer = setInterval(() => {
      if (pos > 0) {
        textSpan.textContent = name.slice(0, --pos);
      } else {
        clearInterval(timer);
        label.classList.remove('active');
      }
    }, 18);
  });
});

const GRID_LAYOUT = [
  [1, 2, 1],
  [2, 2],
  [1,3],
  [4],
  [2,2],
  [0, 2,1],
  [2, 1, 0],
  [1, 2, 1],
  [1, 2, 1],
  [3,1]
];

(function applyGridLayout() {
  const grid  = document.querySelector('.grid');
  const items = Array.from(document.querySelectorAll('.grid-item'));
  let itemIdx = 0;

  function makeBlank(units) {
    const blank = document.createElement('div');
    blank.className = 'grid-blank';
    blank.style.gridColumn = `span ${units * 3}`;
    return blank;
  }

  const ordered = [];

  for (let rowIdx = 0; itemIdx < items.length; rowIdx++) {
    const row = GRID_LAYOUT[rowIdx % GRID_LAYOUT.length];
    let used = 0;

    for (const width of row) {
      if (width === 0) {
        ordered.push(makeBlank(1));
        used += 1;
        continue;
      }
      if (itemIdx >= items.length) break;
      items[itemIdx].style.gridColumn = `span ${width * 3}`;
      ordered.push(items[itemIdx]);
      itemIdx++;
      used += width;
    }

    if (used > 0 && used < 4) {
      ordered.push(makeBlank(4 - used));
    }
  }

  ordered.forEach(el => grid.appendChild(el));
})();
