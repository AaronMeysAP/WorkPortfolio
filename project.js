(function () {
  document.querySelectorAll('.proj-img:not(.proj-img--static)').forEach(initImgHover);

  const SMALL_SCALE = 0.4;
  const GROWN_SCALE = 1.1;

  function initImgHover(panel) {
    const img = panel.querySelector('img');
    if (!img) return;

    let active = false;

    function inSmallHitbox(x, y, rect) {
      const w = rect.width * SMALL_SCALE;
      const h = rect.height * SMALL_SCALE;
      const x0 = (rect.width - w) / 2;
      const y0 = (rect.height - h) / 2;
      return x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;
    }

    function inGrownBounds(x, y, rect) {
      const marginX = rect.width * (GROWN_SCALE - 1) / 2;
      const marginY = rect.height * (GROWN_SCALE - 1) / 2;
      return x >= -marginX && x <= rect.width + marginX &&
             y >= -marginY && y <= rect.height + marginY;
    }

    function setOffset(x, y, rect) {
      const relX = Math.min(1, Math.max(0, x / rect.width));
      const relY = Math.min(1, Math.max(0, y / rect.height));
      panel.style.setProperty('--img-x', (-(relX - 0.5) * 20) + '%');
      panel.style.setProperty('--img-y', (-(relY - 0.5) * 20) + '%');
    }

    function activate() {
      active = true;
      panel.classList.add('is-active');
      document.addEventListener('mousemove', handleDocMove);
      document.addEventListener('mouseout', handleDocOut);
    }

    function deactivate() {
      active = false;
      panel.classList.remove('is-active');
      panel.style.setProperty('--img-x', '0%');
      panel.style.setProperty('--img-y', '0%');
      document.removeEventListener('mousemove', handleDocMove);
      document.removeEventListener('mouseout', handleDocOut);
    }

    function handlePanelMove(e) {
      if (active) return;
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!inSmallHitbox(x, y, rect)) return;
      activate();
      setOffset(x, y, rect);
    }

    function handleDocMove(e) {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!inGrownBounds(x, y, rect)) {
        deactivate();
        return;
      }
      setOffset(x, y, rect);
    }

    function handleDocOut(e) {
      if (!e.relatedTarget) deactivate();
    }

    panel.addEventListener('mouseenter', handlePanelMove);
    panel.addEventListener('mousemove', handlePanelMove);
  }
})();

(function () {
  function initFilm(film) {
    const iframe = film.querySelector('iframe[data-vimeo-id], iframe[data-youtube-id]');
    if (!iframe) return;

    const playerWrap = film.querySelector('.proj-player-ratio');

    let adapter;
    if (iframe.dataset.youtubeId) {
      adapter = createYouTubeAdapter(iframe, film);
    } else if (iframe.dataset.vimeoId) {
      if (typeof Vimeo === 'undefined') return;
      adapter = createVimeoAdapter(iframe, film);
    } else {
      return;
    }

    wireControls(film, playerWrap, adapter);
  }

  function requestFS(el) {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen ||
               el.mozRequestFullScreen || el.msRequestFullscreen;
    if (fn) fn.call(el);
  }

  function createVimeoAdapter(iframe, film) {
    const vimeoId = iframe.dataset.vimeoId;
    iframe.src = `https://player.vimeo.com/video/${vimeoId}?controls=0&title=0&byline=0&portrait=0`;

    const player = new Vimeo.Player(iframe);

    return {
      whenReady(cb) { player.ready().then(cb); },
      getDuration: () => player.getDuration(),
      getVideoSize: () => Promise.all([player.getVideoWidth(), player.getVideoHeight()])
        .then(([vw, vh]) => (vw && vh) ? [vw, vh] : null),
      play:  () => player.play(),
      pause: () => player.pause(),
      setMuted:      m    => player.setMuted(m),
      setVolume:     frac => player.setVolume(frac),
      setCurrentTime: s   => player.setCurrentTime(s),
      requestFullscreen() { requestFS(film); },
      onPlay:       cb => player.on('play', cb),
      onPause:      cb => player.on('pause', cb),
      onEnded:      cb => player.on('ended', cb),
      onTimeUpdate: cb => player.on('timeupdate', ({ seconds }) => cb(seconds)),
    };
  }

  let ytApiPromise = null;
  function loadYouTubeAPI(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    if (!ytApiPromise) {
      ytApiPromise = new Promise(resolve => {
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          if (typeof prevReady === 'function') prevReady();
          resolve();
        };
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
      });
    }
    ytApiPromise.then(cb);
  }

  function createYouTubeAdapter(iframe, film) {
    const videoId = iframe.dataset.youtubeId;
    iframe.src = 'https://www.youtube.com/embed/' + videoId +
      '?enablejsapi=1&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3' +
      '&origin=' + encodeURIComponent(window.location.origin);

    let player  = null;
    let ready   = false;
    let pollId  = null;
    const readyCbs = [];
    const playCbs  = [];
    const pauseCbs = [];
    const endedCbs = [];
    const timeCbs  = [];
    const pending  = [];

    function runOrQueue(fn) {
      player ? fn() : pending.push(fn);
    }

    function startPoll() {
      stopPoll();
      pollId = setInterval(() => {
        const t = player.getCurrentTime();
        timeCbs.forEach(cb => cb(t));
      }, 250);
    }

    function stopPoll() {
      if (pollId) { clearInterval(pollId); pollId = null; }
    }

    loadYouTubeAPI(() => {
      player = new YT.Player(iframe, {
        events: {
          onReady() {
            pending.forEach(fn => fn());
            pending.length = 0;
            ready = true;
            readyCbs.forEach(cb => cb());
          },
          onStateChange(e) {
            if (e.data === YT.PlayerState.PLAYING) {
              playCbs.forEach(cb => cb());
              startPoll();
            } else if (e.data === YT.PlayerState.PAUSED) {
              pauseCbs.forEach(cb => cb());
              stopPoll();
            } else if (e.data === YT.PlayerState.ENDED) {
              endedCbs.forEach(cb => cb());
              stopPoll();
            }
          },
        },
      });
    });

    return {
      whenReady(cb) { ready ? cb() : readyCbs.push(cb); },
      getDuration() {
        return new Promise(resolve => {
          this.whenReady(() => resolve(player.getDuration() || 0));
        });
      },
      getVideoSize: null,
      play:  () => runOrQueue(() => player.playVideo()),
      pause: () => runOrQueue(() => player.pauseVideo()),
      setMuted:      m    => runOrQueue(() => (m ? player.mute() : player.unMute())),
      setVolume:     frac => runOrQueue(() => player.setVolume(Math.round(frac * 100))),
      setCurrentTime: s   => runOrQueue(() => player.seekTo(s, true)),
      requestFullscreen() { requestFS(film); },
      onPlay:       cb => playCbs.push(cb),
      onPause:      cb => pauseCbs.push(cb),
      onEnded:      cb => endedCbs.push(cb),
      onTimeUpdate: cb => timeCbs.push(cb),
    };
  }

  function wireControls(film, playerWrap, adapter) {
    const controls     = film.querySelector('.proj-controls');
    const overlayPlay  = film.querySelector('.proj-overlay-play');
    const directBtns   = controls.querySelectorAll(':scope > .proj-ctrl');
    const playPauseBtn = directBtns[0];
    const fsBtn        = directBtns[directBtns.length - 1];
    const muteBtn      = controls.querySelector('.proj-vol .proj-ctrl');
    const volRange     = controls.querySelector('.proj-vol-slider input[type="range"]');
    const prog         = controls.querySelector('.proj-prog');
    const progFill     = controls.querySelector('.proj-prog-fill');
    const timeDsp      = controls.querySelector('.proj-time');

    let dur        = 0;
    let playing    = false;
    let muted      = false;
    let lastVolume = 100;

    function fmt(s) {
      s = Math.max(0, Math.floor(s));
      return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function setPlaying(state) {
      playing = state;
      playPauseBtn.querySelector('.i-play').style.display  = state ? 'none' : '';
      playPauseBtn.querySelector('.i-pause').style.display = state ? ''     : 'none';
      overlayPlay.classList.toggle('hidden', state);
      if (state) wakeControls();
      else       showControls();
    }

    let idleTimer = null;

    function showControls() {
      clearTimeout(idleTimer);
      controls.classList.remove('is-idle');
    }

    function wakeControls() {
      showControls();
      idleTimer = setTimeout(() => {
        if (playing) controls.classList.add('is-idle');
      }, 2200);
    }

    film.addEventListener('mousemove', wakeControls);
    film.addEventListener('mouseleave', () => { if (playing) controls.classList.add('is-idle'); clearTimeout(idleTimer); });
    controls.addEventListener('mouseenter', showControls);
    controls.addEventListener('mouseleave', wakeControls);

    adapter.getDuration().then(d => { dur = d; });
    adapter.whenReady(() => adapter.getDuration().then(d => { dur = d; }));

    function syncControlsWidth() {
      controls.style.width = playerWrap.getBoundingClientRect().width + 'px';
    }

    function matchVideoAspectRatio() {
      if (!adapter.getVideoSize) { syncControlsWidth(); return; }
      adapter.getVideoSize().then(size => {
        if (!size) { syncControlsWidth(); return; }
        const [vw, vh]   = size;
        const baseHeight = playerWrap.getBoundingClientRect().height;
        playerWrap.style.width       = 'auto';
        playerWrap.style.height      = baseHeight + 'px';
        playerWrap.style.aspectRatio = vw + ' / ' + vh;
        syncControlsWidth();
      });
    }

    matchVideoAspectRatio();
    adapter.whenReady(matchVideoAspectRatio);
    window.addEventListener('resize', syncControlsWidth);

    adapter.onPlay(()  => setPlaying(true));
    adapter.onPause(() => setPlaying(false));
    adapter.onEnded(() => setPlaying(false));

    adapter.onTimeUpdate(seconds => {
      const pct = dur ? (seconds / dur) * 100 : 0;
      progFill.style.width = pct + '%';
      timeDsp.textContent  = fmt(seconds) + ' / ' + fmt(dur);
    });

    function togglePlay() {
      playing ? adapter.pause() : adapter.play();
    }

    overlayPlay.addEventListener('click',  togglePlay);
    playPauseBtn.addEventListener('click', togglePlay);

    function updateVolIcon() {
      muteBtn.querySelector('.i-vol').style.display  = muted ? 'none' : '';
      muteBtn.querySelector('.i-mute').style.display = muted ? ''     : 'none';
    }

    muteBtn.addEventListener('click', () => {
      muted = !muted;
      adapter.setMuted(muted);
      if (muted) {
        lastVolume = Number(volRange.value) || lastVolume;
        volRange.value = 0;
      } else {
        volRange.value = lastVolume || 100;
        adapter.setVolume((lastVolume || 100) / 100);
      }
      updateVolIcon();
    });

    volRange.addEventListener('input', () => {
      const v = Number(volRange.value);
      adapter.setVolume(v / 100);
      if (v === 0) {
        muted = true;
        adapter.setMuted(true);
      } else {
        lastVolume = v;
        if (muted) {
          muted = false;
          adapter.setMuted(false);
        }
      }
      updateVolIcon();
    });

    fsBtn.addEventListener('click', () => adapter.requestFullscreen());

    prog.addEventListener('click', e => {
      if (!dur) return;
      const rect = prog.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      adapter.setCurrentTime(dur * pct);
    });
  }

  document.querySelectorAll('.proj-film').forEach(film => {
    try {
      initFilm(film);
    } catch (e) {
      console.error('proj-film init failed', e);
    }
  });
})();
