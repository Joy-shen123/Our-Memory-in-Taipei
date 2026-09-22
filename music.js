// music.js — the decade music player (issue #4). Loaded after app.js and the scene files.
//
// Four loops under asset/music/, one per decade. The scroll year (window.__fog.year) picks the
// decade; when it crosses a decade line the player crossfades over 1.5 s between two <audio>
// elements. The tower chapter (2020 onward) keeps the 2010s loop. Browsers block audio until the
// visitor clicks, taps or presses a key, so the player is silent until that first gesture and the
// control reads "Click for sound" until then. Mute and a manual decade choice survive a reload
// through localStorage. A manual choice holds until the scroll moves into a decade other than the
// chosen one, then the scroll takes over again. Nothing here touches the 3D scene.
(function () {
  'use strict';

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

  // ── two players, alternating ────────────────────────────────────────────────
  const players = [0, 1].map(() => { const a = document.createElement('audio'); a.preload = 'auto'; a.loop = true; a.volume = 0; a.setAttribute('aria-hidden', 'true'); return a; });
  let active = 0;                       // index into players of the one fading in / playing
  let cur = -1;                         // decade index currently chosen for playback
  let manual = null;                    // { decade } while a button choice holds
  let unlocked = false, playing = false;
  let muted = store.get(LS_MUTE) === '1';
  let fade = null;                      // { from, to, t0 } during a crossfade
  let lastScrollDecade = -1;

  players.forEach(p => { p.muted = muted; p.addEventListener('error', () => { /* a missing file only means silence */ }); });

  function load(p, d) { if (p.dataset.decade !== DECADES[d].key) { p.dataset.decade = DECADES[d].key; p.src = DECADES[d].src; p.load(); } }
  function tryPlay(p) { const r = p.play(); if (r && r.catch) r.catch(() => { }); }

  // switch playback to decade d, crossfading from whatever plays now
  function goTo(d, instant) {
    if (d === cur) return;
    const from = players[active], to = players[1 - active];
    load(to, d);
    if (unlocked) { to.currentTime = 0; tryPlay(to); }
    cur = d; active = 1 - active;
    if (instant || !unlocked) { to.volume = unlocked ? VOLUME : 0; from.volume = 0; from.pause(); fade = null; }
    else fade = { from, to, t0: performance.now() };
    render();
  }

  function stepFade() {
    if (!fade) return;
    const k = Math.max(0, Math.min(1, (performance.now() - fade.t0) / FADE_MS));
    fade.to.volume = VOLUME * Math.sin(k * Math.PI / 2);          // equal-power
    fade.from.volume = VOLUME * Math.cos(k * Math.PI / 2);
    if (k >= 1) { fade.from.pause(); fade.from.volume = 0; fade = null; }
  }

  // ── the gesture gate ────────────────────────────────────────────────────────
  let justUnlocked = false;            // true for a moment after the unlocking gesture, so the click that unlocked does not also mute
  function unlock() {
    if (unlocked) return;
    unlocked = true; justUnlocked = true; setTimeout(() => { justUnlocked = false; }, 500);
    const p = players[active];
    p.volume = VOLUME;
    const r = p.play();
    if (r && r.catch) r.catch(() => { unlocked = false; p.volume = 0; render(); });   // the browser still refused: stay locked
    // prime the other element inside the same gesture so a later crossfade may start it (iOS)
    const o = players[1 - active]; if (o.src) { tryPlay(o); o.pause(); o.volume = 0; }
    render();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { passive: true, capture: true }));

  // ── public actions ──────────────────────────────────────────────────────────
  function setMuted(m) { muted = !!m; players.forEach(p => { p.muted = muted; }); store.set(LS_MUTE, muted ? '1' : '0'); render(); }
  function toggleMute() { setMuted(!muted); }
  function setDecade(key) {
    const d = typeof key === 'number' ? key : decadeIndex(String(key));
    if (d < 0) return false;
    manual = { decade: d };
    store.set(LS_DECADE, DECADES[d].key);
    goTo(d, false);
    return true;
  }
  function currentYear() { const f = window.__fog; const y = f && typeof f.year === 'number' ? f.year : -1; return y < 0 ? 1985 : y; }

  window.addEventListener('keydown', ev => { if ((ev.key === 'm' || ev.key === 'M') && !ev.repeat && !ev.metaKey && !ev.ctrlKey && !ev.altKey) toggleMute(); });

  // a stored manual choice from the last visit holds the same way a fresh one does
  const storedDecade = store.get(LS_DECADE);
  if (storedDecade && decadeIndex(storedDecade) >= 0) manual = { decade: decadeIndex(storedDecade) };

  // ── the control (optional: the player runs without it) ──────────────────────
  const el = {
    root: document.getElementById('music'), mute: document.getElementById('musMute'), decade: document.getElementById('musDecade'),
    track: document.getElementById('musTrack'), buttons: Array.from(document.querySelectorAll('#music [data-decade]')),
  };
  if (el.mute) el.mute.addEventListener('click', ev => { ev.stopPropagation(); if (justUnlocked) { justUnlocked = false; setMuted(false); } else toggleMute(); });
  el.buttons.forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); setDecade(b.dataset.decade); }));

  function render() {
    const d = DECADES[cur >= 0 ? cur : decadeOfYear(currentYear())];
    if (el.decade) el.decade.textContent = d.label;
    if (el.track) el.track.innerHTML = '';
    if (el.track) { el.track.appendChild(document.createTextNode(d.title)); const s = document.createElement('span'); s.textContent = ' · ' + CREDIT; el.track.appendChild(s); }
    if (el.mute) {
      el.mute.textContent = !unlocked ? 'Click for sound' : muted ? 'Sound off' : 'Sound on';
      el.mute.setAttribute('aria-pressed', unlocked && !muted ? 'true' : 'false');
    }
    el.buttons.forEach(b => b.classList.toggle('on', b.dataset.decade === d.key));
    if (el.root) { el.root.classList.toggle('locked', !unlocked); el.root.classList.toggle('muted', muted); }
  }

  // ── per-frame: follow the scroll year ───────────────────────────────────────
  function frame() {
    const y = currentYear(), sd = decadeOfYear(y);
    // a manual choice holds until the scroll enters a decade other than the chosen one; then the scroll takes over
    if (manual && lastScrollDecade >= 0 && sd !== lastScrollDecade && sd !== manual.decade) { manual = null; store.set(LS_DECADE, null); }
    const want = manual ? manual.decade : sd;
    if (want !== cur) goTo(want, cur < 0);
    lastScrollDecade = sd;
    stepFade();
    const p = players[active];
    playing = unlocked && !p.paused && !p.ended;
    requestAnimationFrame(frame);
  }
  goTo(manual ? manual.decade : decadeOfYear(currentYear()), true);
  requestAnimationFrame(frame);

  // ── probe ───────────────────────────────────────────────────────────────────
  window.__music = {
    get decade() { return DECADES[cur].key; }, get track() { return DECADES[cur].title; }, get src() { return DECADES[cur].src; },
    get playing() { return playing; }, get muted() { return muted; }, get unlocked() { return unlocked; },
    get manual() { return manual ? DECADES[manual.decade].key : null; }, get scrollDecade() { return DECADES[lastScrollDecade < 0 ? 0 : lastScrollDecade].key; },
    get fading() { return !!fade; }, get volumes() { return players.map(p => +p.volume.toFixed(2)); }, get active() { return active; },
    setDecade, toggleMute, setMuted, unlock, DECADES,
  };
})();
