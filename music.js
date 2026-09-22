// music.js — the decade music player (issue #4). Loaded after app.js and the scene files.
//
// One YouTube IFrame player sits inside the bottom-left control as a small MV box (YouTube's terms
// want it visible, 200 px or larger, so it is never hidden while it plays). Each decade maps to a
// list of videos (table below); the scroll year (window.__fog.year) picks the decade, a decade change
// loads that decade's current video with a hard cut, and pressing the button of the decade already
// playing advances to its next video. A video that ends or errors moves on to the next in its list.
// The tower chapter (2020 onward) keeps the 2010s list. A manual choice holds until the scroll moves
// into a decade other than the chosen one, then the scroll takes over again.
//
// Fallback: when the YouTube API cannot load (offline), or YouTube refuses to play (it answers error
// 153 to a double-clicked file:// page, which sends no HTTP referrer), the four synthesised loops
// under asset/music/ (CC0) play instead, crossfading 1.5 s between two <audio> elements, and the
// control says so. Browsers block sound until the visitor clicks, taps or presses a key: the first
// click on the page starts the video (or the loop); the player's own play button works too.
// Nothing here touches the 3D scene.
(function () {
  'use strict';

  // ── the videos, one list per decade, played in order. Swap entries freely: id is the v= of the watch link ──
  const YT_VIDEOS = {
    '1980s': [
      { id: 'CRqwLPDSTkA', title: '望春風', artist: '鄧麗君', year: 1980, channel: 'Henry Chen (fan upload, may be taken down)' },
      { id: 'ZGRrJY7VELU', title: '台北的天空', artist: '王芷蕾', year: 1985, channel: 'Timeless Music (official lyric video)' },
      { id: 'lTxZmhAoSGU', title: '我的未來不是夢', artist: '張雨生', year: 1988, channel: '滾石唱片 ROCK RECORDS' },
      { id: 'ZYkxIi8H13w', title: '大約在冬季', artist: '齊秦', year: 1987, channel: '齊秦經典 Classic Chyi Chin', fallback: true },
    ],
    '1990s': [
      { id: 'L3xC-dlVS5c', title: '吻別', artist: '張學友', year: 1993, channel: '張學友 Jacky Cheung (Topic)' },
      { id: 'ZSWeurc1yMw', title: '心太軟', artist: '任賢齊', year: 1996, channel: '滾石唱片 ROCK RECORDS', fallback: true },
    ],
    '2000s': [
      { id: 'Bbp9ZaJD_eA', title: '七里香', artist: '周杰倫', year: 2004, channel: '周杰倫 Jay Chou' },
    ],
    '2010s': [
      { id: 'pd3eV-SG23E', title: '後來的我們', artist: '五月天', year: 2016, channel: '相信音樂BinMusic' },
    ],
  };
  const YT_API = 'https://www.youtube.com/iframe_api';
  const YT_TIMEOUT_MS = 8000;           // no player by then: offline, fall back to the local loops

  // scroll years and the local fallback loops (asset/music/CREDITS.md)
  const DECADES = [
    { key: '1980s', label: '1980s', from: -Infinity, to: 1990, src: 'asset/music/1980s.mp3', title: 'Neon Arcade' },
    { key: '1990s', label: '1990s', from: 1990, to: 2000, src: 'asset/music/1990s.mp3', title: 'Letters Home' },
    { key: '2000s', label: '2000s', from: 2000, to: 2010, src: 'asset/music/2000s.mp3', title: 'Night Market Slow Jam' },
    { key: '2010s', label: '2010s', from: 2010, to: Infinity, src: 'asset/music/2010s.mp3', title: 'Skyline Pulse' },
  ];
  DECADES.forEach(d => { d.vi = 0; d.videos = YT_VIDEOS[d.key] || []; });
  const CREDIT = 'synthesised for this page · CC0';
  const FADE_MS = 1500, VOLUME = 0.55, LS_MUTE = 'omit.music.muted', LS_DECADE = 'omit.music.decade';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode, file:// quirks */ } },
  };
  const decadeOfYear = y => { for (let i = DECADES.length - 1; i >= 0; i--) if (y >= DECADES[i].from) return i; return 0; };
  const decadeIndex = key => DECADES.findIndex(d => d.key === key);
  const videoOf = d => DECADES[d].videos[DECADES[d].vi];
  function currentYear() { const f = window.__fog; const y = f && typeof f.year === 'number' ? f.year : -1; return y < 0 ? 1985 : y; }
  const isPhone = () => window.matchMedia && window.matchMedia('(max-width: 480px)').matches;

  // ── shared state ────────────────────────────────────────────────────────────
  let mode = 'pending';                 // 'pending' → 'youtube' | 'local'
  let why = '';                         // for local mode: 'offline', 'referrer' (file:// page, YouTube error 153) or 'refused' (every video errors, e.g. a browser YouTube treats as a bot)
  let cur = -1;                         // decade index currently chosen for playback
  let manual = null;                    // { decade } while a button choice holds
  let gestured = false;                 // the page has had its first click, tap or key
  let muted = store.get(LS_MUTE) === '1';
  let lastScrollDecade = -1;

  // ── the control ─────────────────────────────────────────────────────────────
  const el = {
    root: document.getElementById('music'), toggle: document.getElementById('musMute'), decade: document.getElementById('musDecade'),
    track: document.getElementById('musTrack'), status: document.getElementById('musStatus'), box: document.getElementById('musBox'), embed: document.getElementById('musEmbed'),
    buttons: Array.from(document.querySelectorAll('#music [data-decade]')),
  };

  // ── YouTube ─────────────────────────────────────────────────────────────────
  let yt = null, ytReady = false, ytState = -1, ytTimer = 0, ytLoadedId = '';
  const failed = {};                    // video ids YouTube refused (gone, or embedding disabled): skipped from then on
  let ytPlayedOnce = false;             // any video reached cued / playing: YouTube is talking to us
  function youtubeFailed(reason) {
    if (mode === 'local') return;
    clearTimeout(ytTimer); mode = 'local'; why = reason || 'offline';
    if (yt && yt.destroy) { try { yt.destroy(); } catch (e) { /* already gone */ } yt = null; }
    localStart();
    render();
  }
  function loadYouTube() {
    if (!el.embed || !el.box) { youtubeFailed('offline'); return; }
    if (location.protocol === 'file:') { youtubeFailed('referrer'); return; }   // a double-clicked page sends no referrer and YouTube answers error 153: straight to the loops
    window.onYouTubeIframeAPIReady = () => {
      const d = cur >= 0 ? cur : decadeOfYear(currentYear()), v = videoOf(d);
      try {
        yt = new YT.Player(el.embed, {
          width: '100%', height: '100%', videoId: v ? v.id : undefined,
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3 },
          events: {
            onReady: () => {
              clearTimeout(ytTimer); ytReady = true; mode = 'youtube'; ytLoadedId = v ? v.id : '';
              if (muted) yt.mute(); else yt.unMute();
              if (cur >= 0 && videoOf(cur) && videoOf(cur).id !== ytLoadedId) youtubeGo(cur);
              else if (gestured && !(muted && isPhone())) yt.playVideo();
              render();
            },
            onStateChange: e => {
              ytState = e.data;
              if (ytState === 1 || ytState === 5 || ytState === 3) ytPlayedOnce = true;
              if (ytState === 1 && !gestured) gestured = true;          // the visitor pressed the player's own play button
              if (ytState === 0) nextVideo(cur);                         // ended: the next in the list
              render();
            },
            onError: e => {
              const code = e && e.data;
              if (code === 153 || code === 5) { youtubeFailed('referrer'); return; }   // no valid referrer (file://) or player failure
              if (!ytLoadedId || failed[ytLoadedId]) return;                            // YouTube repeats the event; act once per video
              failed[ytLoadedId] = code;                                                // 100 / 101 / 150: gone or not embeddable, skip it for good
              if (!ytPlayedOnce && Object.keys(failed).length >= 3) { youtubeFailed('refused'); return; }   // nothing ever played and three refusals: YouTube is refusing this browser
              const D = DECADES[cur];
              if (D && D.videos.some(v => !failed[v.id])) nextVideo(cur);
            },
          },
        });
      } catch (e) { youtubeFailed('offline'); }
    };
    const s = document.createElement('script'); s.async = true;
    s.src = new URLSearchParams(location.search).has('noyoutube') ? 'https://offline.invalid/' : YT_API;   // ?noyoutube=1 rehearses the offline fallback
    s.onerror = () => youtubeFailed('offline');
    document.head.appendChild(s);
    ytTimer = setTimeout(() => youtubeFailed('offline'), YT_TIMEOUT_MS);
  }
  // play decade d's current video: a hard cut. Before the first gesture only cue it, autoplay would be refused
  function youtubeGo(d) {
    if (!ytReady) return;
    const v = videoOf(d); if (!v) return;
    ytLoadedId = v.id;
    if (gestured && !(muted && isPhone())) yt.loadVideoById(v.id); else yt.cueVideoById(v.id);
  }

  // ── local fallback: two <audio> loops, alternating ──────────────────────────
  const players = [0, 1].map(() => { const a = document.createElement('audio'); a.preload = 'none'; a.loop = true; a.volume = 0; a.setAttribute('aria-hidden', 'true'); return a; });
  let active = 0, unlocked = false, playing = false, fade = null;
  players.forEach(p => { p.muted = muted; p.addEventListener('error', () => { /* a missing file only means silence */ }); });

  function load(p, d) { if (p.dataset.decade !== DECADES[d].key) { p.dataset.decade = DECADES[d].key; p.src = DECADES[d].src; p.load(); } }
  function tryPlay(p) { const r = p.play(); if (r && r.catch) r.catch(() => { }); }
  function localStart() { load(players[active], cur >= 0 ? cur : decadeOfYear(currentYear())); if (gestured) unlock(); }
  // switch the local loops to decade d, crossfading from whatever plays now
  function localGo(d, instant) {
    const from = players[active], to = players[1 - active];
    load(to, d);
    if (unlocked) { to.currentTime = 0; tryPlay(to); }
    active = 1 - active;
    if (instant || !unlocked) { to.volume = unlocked ? VOLUME : 0; from.volume = 0; from.pause(); fade = null; }
    else fade = { from, to, t0: performance.now() };
  }
  function stepFade() {
    if (!fade) return;
    const k = Math.max(0, Math.min(1, (performance.now() - fade.t0) / FADE_MS));
    fade.to.volume = VOLUME * Math.sin(k * Math.PI / 2);          // equal-power
    fade.from.volume = VOLUME * Math.cos(k * Math.PI / 2);
    if (k >= 1) { fade.from.pause(); fade.from.volume = 0; fade = null; }
  }
  function unlock() {
    if (unlocked || mode !== 'local') return;
    unlocked = true;
    const p = players[active]; load(p, cur);
    p.volume = VOLUME;
    const r = p.play();
    if (r && r.catch) r.catch(() => { unlocked = false; p.volume = 0; render(); });   // the browser refused (no gesture yet): stay locked
    const o = players[1 - active]; if (o.src) { tryPlay(o); o.pause(); o.volume = 0; }   // prime the other element inside the gesture (iOS)
    render();
  }

  // ── the gesture gate ────────────────────────────────────────────────────────
  let justGestured = false;             // true for a moment after the first gesture, so the click that started sound does not also stop it
  function gesture() {
    if (gestured) return;
    gestured = true; justGestured = true; setTimeout(() => { justGestured = false; }, 500);
    if (mode === 'youtube' && ytReady && !(muted && isPhone())) { if (videoOf(cur) && videoOf(cur).id !== ytLoadedId) youtubeGo(cur); else yt.playVideo(); }
    else if (mode === 'local') unlock();
    render();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, gesture, { passive: true, capture: true }));

  // ── actions ─────────────────────────────────────────────────────────────────
  function goTo(d, instant) {
    if (d === cur) return;
    cur = d;
    if (mode === 'youtube') youtubeGo(d);
    else if (mode === 'local') localGo(d, instant);
    render();
  }
  // a decade button: switch to that decade and hold it; pressed again on the decade already playing, step to its next video
  function setDecade(key) {
    const d = typeof key === 'number' ? key : decadeIndex(String(key));
    if (d < 0) return false;
    if (d === cur) { nextVideo(d); return true; }
    manual = { decade: d };
    store.set(LS_DECADE, DECADES[d].key);
    goTo(d, false);
    return true;
  }
  function nextVideo(d) {
    const D = DECADES[d]; if (!D || D.videos.length < 1) return;
    for (let k = 0; k < D.videos.length; k++) { D.vi = (D.vi + 1) % D.videos.length; if (!failed[D.videos[D.vi].id]) break; }   // the next one YouTube will play
    if (d === cur && mode === 'youtube') youtubeGo(d);
    render();
  }
  // the toggle: sound on / off. On YouTube it mutes the player; on a phone muting also hides the MV box and pauses it
  function setMuted(m) {
    muted = !!m; store.set(LS_MUTE, muted ? '1' : '0');
    players.forEach(p => { p.muted = muted; });
    if (mode === 'youtube' && ytReady) {
      if (muted) { yt.mute(); if (isPhone()) yt.pauseVideo(); }
      else { yt.unMute(); if (gestured) yt.playVideo(); }
    }
    render();
  }
  function toggle() {
    if (mode === 'local' && !unlocked) unlock(); else setMuted(!muted);
  }
  window.addEventListener('keydown', ev => { if ((ev.key === 'm' || ev.key === 'M') && !ev.repeat && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !justGestured) toggle(); });
  if (el.toggle) el.toggle.addEventListener('click', ev => { ev.stopPropagation(); if (justGestured) { justGestured = false; if (muted) setMuted(false); return; } toggle(); });
  el.buttons.forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setDecade(b.dataset.decade); }));

  function render() {
    const di = cur >= 0 ? cur : decadeOfYear(currentYear()), d = DECADES[di], v = videoOf(di);
    const onYT = mode === 'youtube';
    if (el.decade) el.decade.textContent = d.label + (onYT && d.videos.length > 1 ? ' · ' + (d.vi + 1) + '/' + d.videos.length : '');
    if (el.track) el.track.textContent = onYT && v ? v.title + ' · ' + v.artist + ' · ' + v.year : mode === 'local' ? d.title + ' · ' + CREDIT : '';
    if (el.status) el.status.textContent = onYT ? 'YouTube · ' + (v ? v.channel : '') : mode === 'local' ? (why === 'referrer' ? 'local loops · YouTube needs http' : why === 'refused' ? 'local loops · YouTube refused to embed' : 'offline: local loops') : 'connecting to YouTube…';
    if (el.toggle) {
      const started = onYT ? gestured : unlocked;
      el.toggle.textContent = !started ? (onYT ? 'Click to play' : 'Click for sound') : muted ? 'Sound off' : 'Sound on';
      el.toggle.setAttribute('aria-pressed', started && !muted ? 'true' : 'false');
    }
    el.buttons.forEach(b => { const on = b.dataset.decade === d.key; b.classList.toggle('on', on); b.title = on && d.videos.length > 1 ? 'Next video' : ''; });
    if (el.root) { el.root.dataset.mode = mode; el.root.classList.toggle('muted', muted); el.root.classList.toggle('locked', onYT ? !gestured : mode === 'local' && !unlocked); }
  }

  // ── per-frame: follow the scroll year ───────────────────────────────────────
  function frame() {
    const sd = decadeOfYear(currentYear());
    // a manual choice holds until the scroll enters a decade other than the chosen one; then the scroll takes over
    if (manual && lastScrollDecade >= 0 && sd !== lastScrollDecade && sd !== manual.decade) { manual = null; store.set(LS_DECADE, null); }
    const want = manual ? manual.decade : sd;
    if (want !== cur) goTo(want, cur < 0);
    lastScrollDecade = sd;
    if (mode === 'local') { stepFade(); const p = players[active]; playing = unlocked && !p.paused && !p.ended; }
    else playing = mode === 'youtube' && ytState === 1;
    requestAnimationFrame(frame);
  }
  const storedDecade = store.get(LS_DECADE);                      // a stored manual choice holds the same way a fresh one does
  if (storedDecade && decadeIndex(storedDecade) >= 0) manual = { decade: decadeIndex(storedDecade) };
  cur = manual ? manual.decade : decadeOfYear(currentYear());
  render();
  loadYouTube();
  requestAnimationFrame(frame);

  // ── probe ───────────────────────────────────────────────────────────────────
  window.__music = {
    get mode() { return mode; }, get why() { return why; }, get decade() { return DECADES[cur].key; }, get video() { return videoOf(cur) || null; }, get loadedId() { return ytLoadedId; },
    get index() { return DECADES[cur].vi; }, get count() { return DECADES[cur].videos.length; },
    get track() { return mode === 'local' ? DECADES[cur].title : (videoOf(cur) || {}).title; },
    get playing() { return playing; }, get ytState() { return ytState; }, get muted() { return muted; }, get gestured() { return gestured; },
    get unlocked() { return mode === 'youtube' ? gestured : unlocked; },
    get manual() { return manual ? DECADES[manual.decade].key : null; }, get scrollDecade() { return DECADES[lastScrollDecade < 0 ? 0 : lastScrollDecade].key; },
    get fading() { return !!fade; }, get volumes() { return players.map(p => +p.volume.toFixed(2)); }, get failed() { return failed; },
    get embed() { const f = document.querySelector('#music iframe'); return f ? { src: f.src.slice(0, 60), w: f.clientWidth, h: f.clientHeight } : null; },
    setDecade, nextVideo, toggle, setMuted, YT_VIDEOS, DECADES,
  };
})();
