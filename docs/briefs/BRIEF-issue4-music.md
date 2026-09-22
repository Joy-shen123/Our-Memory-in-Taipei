# Brief: issue #4, decade music player (branch `issue-music-player`)

You are a build agent in a git worktree of `Joy-shen123/Our-Memory-in-Taipei`, a scroll-driven three.js page (r149 UMD, no build, no server, no network, double-click `index.html`). Read `HANDOFF.md` in full first; it explains the chapters, the files, the `window.__fog` API and the test recipe. GitHub issue #4 is the spec and is copied below. The lead reads your pane and your screenshots. CJ decides when anything is pushed.

## Goal

Music that changes with the decade as the visitor scrolls, with a small HUD control to mute and to switch decades, shipped with tracks that are legal to publish, and a separate list of real hit songs for CJ to decide on.

## Done when

- Commits on `issue-music-player`, one per step below, each screenshotted before the next starts.
- Screenshots in `~/Desktop/issue-music/`: `control-0.05.png`, `control-0.44.png`, `control-0.78.png`, `control-390x844.png`, plus `switch-1990s.png` after clicking the 1990s button at fraction 0.05.
- `~/Desktop/issue-music/fps.txt`: headed fps at 0.2 / 0.44 / 0.78 with music playing, against the same three numbers on `main` (`52a575b`) measured the same way. The bar is no drop.
- Console empty and zero page errors on a fresh agent-browser session at the end.
- `research/music/README.md` with the real-song list (below).
- Nothing pushed, no PR, no issue comment.

## CJ's words

- 2026-09-22: 「i want music for different section can you find 1980s 1990s 2000s 2010s music and make a music player system, i can switch when i am in that decade」
- 2026-09-20: 「CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY」— the control matches the bright HUD, not a dark media-player look.
- 2026-09-20: 「REMOVE MOVE MOVING OBEJECT ON THE ROAD」— nothing new moves in the 3D scene because of this issue.

## Issue #4, copied

Goal: as the visitor scrolls from 1985 to today, a track for the 1980s, 1990s, 2000s and 2010s plays under the street, and crossfades to the next one when the scroll year crosses a decade line. A small player control shows the decade, the track name and a mute toggle, and the visitor can switch decades from it directly. This overrides "No sound" in HANDOFF's not-done list.

Done when:

1. **Player system.** A `music.js` module loaded after `app.js`: a decade table (1980s / 1990s / 2000s / 2010s) with year ranges, one track each, a 1.5 s crossfade between two `<audio>` elements when `window.__fog.year` crosses a decade line, and the tower chapter (2020 onward) continuing the 2010s track. Starts on the first click, tap or key press, because browsers block autoplay without a gesture. Sound off by default until that gesture; the state survives a reload through `localStorage`.
2. **Player control** in the HUD, matching `style.css`: decade label, track title, a mute toggle, and four decade buttons that jump the track without moving the camera. On a phone it collapses to the mute toggle.
3. **Tracks that can ship.** Four era-styled tracks under `asset/music/`, each under 2 MB, each with a licence that allows publishing on a public GitHub Pages site (CC0, CC BY with credit, or a synthesised track generated in the repo). Credits in `asset/music/CREDITS.md` and on the control.
4. **The real-song list, as a decision for CJ**, not in the page: `research/music/README.md` with 5 candidate hit songs per decade that a Taipei visitor would recognise, the year, the artist, and what licensing them would take. CJ picks; nothing copyrighted goes into the repo.
5. Screenshots of the control at fractions 0.05 / 0.44 / 0.78 and on 390x844, console empty, fps unchanged from the branch base.

Rules: double-click `index.html` still works: no build step, no network, no CDN, no streaming embed. Audio files are the one new file type allowed; keep the total under 8 MB. Do not touch `app.js` beyond one hook if `window.__fog.year` is not enough. Do not touch `data.js` copy, the camera, or any building. Not in this issue: licensed commercial songs, sound effects, volume automation tied to the camera.

## What is here

- `HANDOFF.md` — the project. Read-only until your final docs commit.
- `index.html` — script load order at lines 38 to 50; `music.js` goes after `scene-tower.js`.
- `app.js` line ~938 — `window.__fog` exposes `year`, `era`, `progress`, `jumpToYear(y)`. Poll `year` once per animation frame from `music.js`; do not edit `app.js` unless `year` is not enough, and then one hook only.
- `style.css` — the HUD: `.hud-chapter` top-left, site title top-right, year bottom-right. The control goes bottom-left on desktop (that corner is free above 480 px) and next to the year on phones; read the existing media queries before adding one.
- `data.js` — `ERAS`, palette. Read-only.
- `research/render-styles/`, `research/ivress/` — unrelated, read-only.

## Method

1. **Tracks first, because they gate everything.** Two routes, pick per decade and say which in `CREDITS.md`:
   - **Synthesise in the repo.** A Node script `asset/music/gen/make-tracks.js` that writes four 60 to 90 s WAV or OGG loops with era signatures: 1980s gated-reverb drum machine, DX7-style FM bells, city-pop chords; 1990s piano ballad shape with a shaker groove; 2000s R&B-flavoured beat with a plucked synth; 2010s four-on-the-floor EDM-pop with a side-chain pump. Seeded, so it renders the same every time. Commit the rendered files, not just the script, so double-click still works. `ffmpeg` is likely on this machine for OGG or MP3 conversion; check with `which ffmpeg` before relying on it.
   - **Licensed free tracks.** Free Music Archive, Pixabay Music, ccMixter, Incompetech: pick CC0 or CC BY tracks whose sound says the decade. Save the licence page URL and the attribution text with each file. Reject anything "free for personal use" or with a no-derivatives clause.
   Real hit songs (鄧麗君, 小虎隊, 張雨生, 周杰倫, 蔡依林, 五月天 …) go in the research list only, never in the repo.
2. **`music.js`.** Two `<audio>` elements alternating, `preload="auto"`, loop on. Decade from `window.__fog.year`: 1980s < 1990, 1990s < 2000, 2000s < 2010, 2010s from 2010 including the tower chapter. Crossfade 1.5 s by ramping `volume` in `requestAnimationFrame`. Gesture gate: the first `pointerdown`, `keydown` or `touchstart` unlocks audio, and until then the control shows "Click for sound". Mute state and the last decade choice in `localStorage` (wrap in try/catch). A manual decade choice from the buttons holds until the scroll year enters a different decade than the one chosen, then scroll takes over again.
3. **Control.** Plain HTML in `index.html` plus `style.css`, no framework. Decade label, track title with a short attribution, mute toggle, four decade buttons. Under 480 px only the mute toggle shows. Keyboard: `m` toggles mute.
4. **Test.** The HANDOFF recipe with session name `music`. Headless cannot play audio for you to hear, so verify state through `window.__music` (expose `decade`, `track`, `playing`, `muted`, `unlocked`, `setDecade(d)`), and assert it changes at fractions 0.05, 0.4, 0.55 and 0.7. fps headed, alone, click first.
5. **Docs commit.** `HANDOFF.md`: replace "No sound" in the not-done list with a "Music (issue #4)" section: the decade table, the files, the gesture gate, how to swap a track. `README.md` untouched.

Test recipe reminder:

```
export AGENT_BROWSER_SESSION=music
agent-browser open "file://$PWD/index.html"; agent-browser set viewport 1440 900
agent-browser eval -b "$(printf 'new Promise(r=>{window.scrollTo(0,%s*(document.documentElement.scrollHeight-innerHeight));let n=0;(function t(){if(++n<80)requestAnimationFrame(t);else r("ok")})()})' 0.44 | base64)"
agent-browser screenshot ~/Desktop/issue-music/control-0.44.png; agent-browser console; agent-browser close
```

If `open` returns "os error 35", close that session, remove only its files under `~/.agent-browser/`, and use a new session name. Never `pkill` the daemon. Sessions `issue3` and `bruno` belong to other agents; do not touch them.

## Do not touch

- The main checkout at `~/Documents/CJ-project-vault/Our-Memory-in-Taipei` and the worktree `issue-3-texture`. Work only here.
- `app.js` (one hook at most, only if `window.__fog.year` is not enough), `asset/3d/`, `scene-*.js`, `data.js`, `three.min.js`, the camera, any building.
- GitHub: no push, no PR, no comment.

## Deliverable

- Commits on `issue-music-player`: tracks and credits, `music.js`, the control, the docs commit. Include this brief in the first commit.
- `~/Desktop/issue-music/`: the five screenshots and `fps.txt`.
- `research/music/README.md`: the real-song decision list, 5 per decade.
- Reply with only: the commit hashes with one line each, which route each decade's track took, total audio size, the fps numbers, and one line on anything you could not do or had to decide alone.
