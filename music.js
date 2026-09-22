// music.js — the decade music player (issue #4). Loaded after app.js and the scene files.
//
// One Spotify embed player sits inside the bottom-left control. Each decade maps to a public Spotify
// playlist (table below); the scroll year (window.__fog.year) picks the decade, and when it crosses a
// decade line the player loads that decade's playlist and plays. The tower chapter (2020 onward)
// keeps the 2010s playlist. The four decade buttons switch playlists by hand; a manual choice holds
// until the scroll moves into a decade other than the chosen one, then the scroll takes over again.
//
// Fallback: when the Spotify iFrame API cannot load (offline, or a browser that blocks it from a
// double-clicked file:// page), the four synthesised loops under asset/music/ (CC0) play instead,
// crossfading 1.5 s between two <audio> elements, and the control reads "offline: local loops".
//
// Browsers block sound until the visitor clicks, taps or presses a key. The first click on the page
// starts the Spotify player (or, in fallback, the local loop); a click on the embed's own play button
// works too. Nothing here touches the 3D scene.
(function () {
  'use strict';

  // ── the Spotify playlists, one per decade. Swap in your own: spotify:playlist:<id> from the share link ──
  const SPOTIFY = {
    '1980s': { uri: 'spotify:playlist:37i9dQZF1DX1sUunABTZ4W', name: '80 年代華語經典', by: 'Spotify' },
    '1990s': { uri: 'spotify:playlist:37i9dQZF1DX7zXqDWRZPD1', name: '90年代華語精選', by: 'Spotify' },
    '2000s': { uri: 'spotify:playlist:37i9dQZF1DWVUmQhB7PvFH', name: '2000年代華語金曲', by: 'Spotify' },
    '2010s': { uri: 'spotify:playlist:37i9dQZF1DXe3opFF4aPDr', name: '2010年代華語最流行', by: 'Spotify' },
  };
  const SPOTIFY_API = 'https://open.spotify.com/embed/iframe-api/v1';
  const SPOTIFY_TIMEOUT_MS = 8000;      // no player by then: offline, fall back to the local loops

  // scroll years and the local fallback loops (asset/music/CREDITS.md)
  const DECADES = [
    { key: '1980s', label: '1980s', from: -Infinity, to: 1990, src: 'asset/music/1980s.mp3', title: 'Neon Arcade' },
    { key: '1990s', label: '1990s', from: 1990, to: 2000, src: 'asset/music/1990s.mp3', title: 'Letters Home' },
    { key: '2000s', label: '2000s', from: 2000, to: 2010, src: 'asset/music/2000s.mp3', title: 'Night Market Slow Jam' },
    { key: '2010s', label: '2010s', from: 2010, to: Infinity, src: 'asset/music/2010s.mp3', title: 'Skyline Pulse' },
  ];
  const CREDIT = 'synthesised for this page · CC0';
  const FADE_MS = 1500, VOLUME = 0.55, LS_MUTE = 'omit.music.muted', LS_DECADE = 'omit.music.decade';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode, file:// quirks */ } },
  };
  const decadeOfYear = y => { for (let i = DECADES.length - 1; i >= 0; i--) if (y >= DECADES[i].from) return i; return 0; };
  const decadeIndex = key => DECADES.findIndex(d => d.key === key);
  function currentYear() { const f = window.__fog; const y = f && typeof f.year === 'number' ? f.year : -1; return y < 0 ? 1985 : y; }

  // ── shared state ────────────────────────────────────────────────────────────
  let mode = 'pending';                 // 'pending' → 'spotify' | 'local'
  let cur = -1;                         // decade index currently chosen for playback
  let manual = null;                    // { decade } while a button choice holds
  let gestured = false;                 // the page has had its first click, tap or key
  let lastScrollDecade = -1;

  // ── the control ─────────────────────────────────────────────────────────────
  const el = {
    root: document.getElementById('music'), toggle: document.getElementById('musMute'), decade: document.getElementById('musDecade'),
    track: document.getElementById('musTrack'), status: document.getElementById('musStatus'), embed: document.getElementById('musEmbed'),
    buttons: Array.from(document.querySelectorAll('#music [data-decade]')),
  };

  // ── Spotify ─────────────────────────────────────────────────────────────────
  let sp = null, spPaused = true, spTimer = 0, spLoadedUri = '';
  function spotifyFailed() {
    if (mode !== 'pending') return;
    clearTimeout(spTimer); mode = 'local';
    if (el.embed) el.embed.hidden = true;
    localStart();
    render();
  }
  function loadSpotify() {
    if (!el.embed) { spotifyFailed(); return; }
    window.onSpotifyIframeApiReady = api => {
      const d = DECADES[cur >= 0 ? cur : decadeOfYear(currentYear())];
      try {
        api.createController(el.embed, { uri: SPOTIFY[d.key].uri, width: '100%', height: 80 }, ctrl => {
          sp = ctrl; spLoadedUri = SPOTIFY[d.key].uri;
          ctrl.addListener('ready', () => {
            clearTimeout(spTimer); mode = 'spotify';
            if (cur >= 0 && SPOTIFY[DECADES[cur].key].uri !== spLoadedUri) spotifyGo(cur);
            else if (gestured) sp.play();
            render();
          });
          ctrl.addListener('playback_update', e => { const p = e && e.data ? !!e.data.isPaused : true; if (p !== spPaused) { spPaused = p; render(); } });
        });
      } catch (e) { spotifyFailed(); }
    };
    const s = document.createElement('script'); s.async = true;
    s.src = new URLSearchParams(location.search).has('nospotify') ? 'https://offline.invalid/' : SPOTIFY_API;   // ?nospotify=1 rehearses the offline fallback
    s.onerror = spotifyFailed;
    document.head.appendChild(s);
    spTimer = setTimeout(spotifyFailed, SPOTIFY_TIMEOUT_MS);
  }
  function spotifyGo(d) {
    if (!sp) return;
    const uri = SPOTIFY[DECADES[d].key].uri;
    if (uri !== spLoadedUri) { spLoadedUri = uri; sp.loadUri(uri); }
    if (gestured) sp.play();
  }

  // ── local fallback: two <audio> loops, alternating ──────────────────────────
  const players = [0, 1].map(() => { const a = document.createElement('audio'); a.preload = 'none'; a.loop = true; a.volume = 0; a.setAttribute('aria-hidden', 'true'); return a; });
  let active = 0, unlocked = false, playing = false, fade = null;
  let muted = store.get(LS_MUTE) === '1';
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
  function setMuted(m) { muted = !!m; players.forEach(p => { p.muted = muted; }); store.set(LS_MUTE, muted ? '1' : '0'); render(); }

  // ── the gesture gate ────────────────────────────────────────────────────────
  let justGestured = false;             // true for a moment after the first gesture, so the click that started sound does not also stop it
  function gesture() {
    if (gestured) return;
    gestured = true; justGestured = true; setTimeout(() => { justGestured = false; }, 500);
    if (mode === 'spotify' && sp) sp.play();
    else if (mode === 'local') unlock();
    render();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, gesture, { passive: true, capture: true }));

  // ── actions ─────────────────────────────────────────────────────────────────
  // switch playback to decade d
  function goTo(d, instant) {
    if (d === cur) return;
    cur = d;
    if (mode === 'spotify') spotifyGo(d);
    else if (mode === 'local') localGo(d, instant);
    render();
  }
  function setDecade(key) {
    const d = typeof key === 'number' ? key : decadeIndex(String(key));
    if (d < 0) return false;
    manual = { decade: d };
    store.set(LS_DECADE, DECADES[d].key);
    goTo(d, false);
    return true;
  }
  // the toggle: play / pause on Spotify; sound on / off on the local loops
  function toggle() {
    if (mode === 'spotify' && sp) sp.togglePlay();
    else if (mode === 'local') { if (!unlocked) unlock(); else setMuted(!muted); }
    render();
  }
  window.addEventListener('keydown', ev => { if ((ev.key === 'm' || ev.key === 'M') && !ev.repeat && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !justGestured) toggle(); });
  if (el.toggle) el.toggle.addEventListener('click', ev => { ev.stopPropagation(); if (justGestured) { justGestured = false; if (mode === 'local' && muted) setMuted(false); return; } toggle(); });
  el.buttons.forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setDecade(b.dataset.decade); }));

  function render() {
    const d = DECADES[cur >= 0 ? cur : decadeOfYear(currentYear())], pl = SPOTIFY[d.key];
    if (el.decade) el.decade.textContent = d.label;
    if (el.track) el.track.textContent = mode === 'local' ? d.title + ' · ' + CREDIT : pl.name + ' · ' + pl.by;
    if (el.status) el.status.textContent = mode === 'spotify' ? 'Spotify playlist' : mode === 'local' ? 'offline: local loops' : 'connecting to Spotify…';
    if (el.toggle) {
      const label = mode === 'spotify' ? (spPaused ? (gestured ? 'Play' : 'Click to play') : 'Pause')
                  : mode === 'local' ? (!unlocked ? 'Click for sound' : muted ? 'Sound off' : 'Sound on') : 'Click to play';
      el.toggle.textContent = label;
      el.toggle.setAttribute('aria-pressed', (mode === 'spotify' && !spPaused) || (mode === 'local' && unlocked && !muted) ? 'true' : 'false');
    }
    el.buttons.forEach(b => b.classList.toggle('on', b.dataset.decade === d.key));
    if (el.root) { el.root.dataset.mode = mode; el.root.classList.toggle('locked', mode === 'local' ? !unlocked : spPaused); }
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
    else playing = mode === 'spotify' && !spPaused;
    requestAnimationFrame(frame);
  }
  const storedDecade = store.get(LS_DECADE);                      // a stored manual choice holds the same way a fresh one does
  if (storedDecade && decadeIndex(storedDecade) >= 0) manual = { decade: decadeIndex(storedDecade) };
  cur = manual ? manual.decade : decadeOfYear(currentYear());
  render();
  loadSpotify();
  requestAnimationFrame(frame);

  // ── probe ───────────────────────────────────────────────────────────────────
  window.__music = {
    get mode() { return mode; }, get decade() { return DECADES[cur].key; }, get playlist() { return SPOTIFY[DECADES[cur].key]; },
    get track() { return mode === 'local' ? DECADES[cur].title : SPOTIFY[DECADES[cur].key].name; }, get loadedUri() { return spLoadedUri; },
    get playing() { return playing; }, get paused() { return mode === 'spotify' ? spPaused : !playing; }, get muted() { return muted; },
    get unlocked() { return mode === 'spotify' ? gestured : unlocked; }, get gestured() { return gestured; },
    get manual() { return manual ? DECADES[manual.decade].key : null; }, get scrollDecade() { return DECADES[lastScrollDecade < 0 ? 0 : lastScrollDecade].key; },
    get fading() { return !!fade; }, get volumes() { return players.map(p => +p.volume.toFixed(2)); },
    get embed() { const f = el.embed && (el.embed.tagName === 'IFRAME' ? el.embed : document.querySelector('#music iframe')); return f ? { src: f.src, w: f.clientWidth, h: f.clientHeight } : null; },
    setDecade, toggle, setMuted, SPOTIFY, DECADES,
  };
})();
