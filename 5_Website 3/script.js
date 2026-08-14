// ─── VIMEO PLACEHOLDERS ──────────────────────────────────────────────────────
// To swap a video: change data-vimeo-id="XXXXXXX" in works.html.
document.querySelectorAll('[data-vimeo-id]').forEach(el => {
  const id = el.dataset.vimeoId;
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${id}?background=1&dnt=1`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  el.appendChild(iframe);
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── YOUTUBE PLACEHOLDERS ────────────────────────────────────────────────────
// To swap a video: change data-youtube-id="XXXXXXXXXXX" in works.html.
document.querySelectorAll('[data-youtube-id]').forEach(el => {
  const id = el.dataset.youtubeId;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  el.appendChild(iframe);
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── CARD TILT ───────────────────────────────────────────────────────────────
const TILT = {
  maxRotate:   8,     // max tilt angle in degrees
  lift:        14,    // px the card floats upward
  hoverScale:  1.05,  // scale factor on hover (1.05 = 5% larger)
  perspective: 700,   // smaller = more dramatic perspective
  returnSpeed: '0.55s ease',
};

// narrowest card width, used as the baseline for effect scaling
// cached on first hover, reset on resize so it stays accurate
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
    // wider cards get proportionally less effect
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
// ─────────────────────────────────────────────────────────────────────────────

// ─── HOVER LABELS ────────────────────────────────────────────────────────────
document.querySelectorAll('.grid-item').forEach(card => {
  const img = card.querySelector('img');

  // Photos: label is derived from the image's folder name.
  // Videos: label comes from alt="..." on the .grid-item (edit it directly in works.html).
  const name = img
    ? img.getAttribute('src').split('/')[1] // "images/eastpak/01.png" → "eastpak"
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
// ─────────────────────────────────────────────────────────────────────────────

// ─── GRID LAYOUT ─────────────────────────────────────────────────────────────
// Each row is a list of column widths. Numbers represent units out of 4.
//
//   1 = ¼ of row width
//   2 = ½ of row width
//   3 = ¾ of row width
//   4 = full row width
//   0 = a blank (1-unit) gap — doesn't consume a photo
//
//   [1, 1, 1, 1]  →  four equal columns
//   [1, 2, 1]     →  narrow · wide · narrow
//   [2, 2]        →  two halves
//   [3, 1]        →  one large + one small
//   [4]           →  single full-width item
//   [1, 0, 1]     →  narrow · blank gap · narrow
//   [0]           →  one blank gap, with the rest of the row left empty too
//
// If a row's numbers don't add up to 4, the leftover space at the end of
// that row is left blank instead of being filled by the next item.
//
// If there are more items than rows defined, the pattern repeats from the top.
const GRID_LAYOUT = [
  [1, 2, 1],
  [2, 2],
  [1,3],
  [4],
  [2,2],
  [0, 2,1],
  [2, 1, 0],
  [1, 2, 1]
];
// ─────────────────────────────────────────────────────────────────────────────

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
      // width * 3 converts 4-column units into the 12-column CSS grid
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
