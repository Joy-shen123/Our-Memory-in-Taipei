# Brief: issue #3, surface texture pass (branch `issue-3-texture`)

You are a build agent in a git worktree of `Joy-shen123/Our-Memory-in-Taipei`, a scroll-driven three.js page (r149 UMD, no build, no server, no network, double-click `index.html`). The lead session reads your pane and your screenshots, not a report. CJ decides when anything is pushed. Everything about the page is in `HANDOFF.md`; read it in full first, then GitHub issue #3 (the text is copied below so you need no network to start).

## Goal

Every wall, roof and road reads as a material under light (brick, plaster, concrete, wood, glass) instead of one flat colour under a hemisphere light, with nothing but procedural canvas textures, and the page still bright, still 60 fps, still double-clickable.

## Done when

- Four commits on `issue-3-texture`, one per step below, each with a conventional-commit message, each syntax-checked and screenshotted before the next step starts.
- Screenshots in `~/Desktop/issue3-texture/` named `step<N>-<fraction>.png` for N = 1..4 and fraction = 0.05, 0.44, 0.78, headless 1440x900. Plus `step0-<fraction>.png` taken on the untouched branch before step 1, so the lead can compare.
- After step 4: fps measured headed, alone, at 0.2 / 0.44 / 0.78 / 0.9, written into `~/Desktop/issue3-texture/fps.txt`. 60+ is the bar.
- Console empty and zero page errors on a fresh agent-browser session at the end of every step.
- The second rubric scoring, written into `RUBRIC.md` as a new section and drafted as `~/Desktop/issue3-texture/rubric-2-comment.md`. Do not post it to GitHub; the lead posts after CJ says.
- Nothing pushed.

## CJ's words

- 2026-09-22: 「work GitHub issue #3 … one commit and screenshots per step, no push until I say.」
- 2026-09-20: 「CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY」— daylight palette, fog off. Tone mapping and shadows must not make it darker or greyer overall; if a step reads darker at 0.05, raise exposure or light intensity until the road and shop walls sit as bright as `step0-0.05.png`.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— nothing tall goes into chapter 1; do not change any height.
- 2026-09-20: 「THE BUILDING NEED TO REFERENCE REAL BUILDING」— do not replace any building; this issue changes surfaces and light only.
- 2026-09-20: 「REMOVE MOVE MOVING OBEJECT ON THE ROAD」— traffic stays off.

## Issue #3, copied

Goal: every wall, roof and road on the street reads as a material under light: brick, plaster, concrete, wood, glass. Today each surface is one flat colour under a hemisphere light. Nothing in this issue needs an image or model file; the rule set from #1 stays (r149 UMD, no build, no network, double-click `index.html`).

Steps, each its own commit with screenshots at 0.05 / 0.44 / 0.78:

1. **Tone mapping and environment light.** ACES filmic on the renderer; a canvas-drawn sky as the scene environment so tops are sky-lit and the 101 glass reflects something. About 1 hour.
2. **Procedural colour and normal maps** for brick, plaster, concrete, wood and asphalt, generated once at load in `asset/3d/assets-core.js` (`C.mat`) and used by the engine's materials in `app.js` and `scene-*.js` too, so every model gets them without per-asset edits. Seeded, so it looks the same every load. About half a day.
3. **One shadow-casting sun** whose shadow camera follows the scroll camera down the 460-unit street. Soft shadows, resolution chosen so a phone holds fps. About half a day.
4. **Ambient occlusion** baked per vertex at build time for the library models and the engine's parts, darkening under eaves, inside arcades and where walls meet the road. About half a day.

Rules: procedural only (canvas textures, no PNG, no GLB). Keep 60 fps. Daylight stays bright: no fog, no night, no bloom. Do not change the opening's height. Keep each map's pattern subtle: this is a memory, not a photo.

Not in this issue: Blender models and a GLB loader.

## What is here

- `HANDOFF.md` — the whole project: chapters, files and load order, the `window.SCENE` API, the test recipe, the real-building references. Read-only for you until the final docs commit (see Deliverable).
- `RUBRIC.md` — the seven criteria, the 1–5 scale, the first scoring. You append the second scoring.
- `app.js` — renderer (line ~67: `antialias: false`, `outputEncoding = LinearEncoding`, gamma applied at the end of the custom post pass), lights (line ~79: one HemisphereLight, one DirectionalLight `key`), the `part()`/`instSet()` engine, ground planes (`MeshLambertMaterial` via `withFog`), the post pass. Most of steps 1, 3 and 4 land here.
- `asset/3d/assets-core.js` — `C.mat(color, opts)` at line ~57 returns a `MeshStandardMaterial`; every library item and `C.box` goes through it. Step 2's maps hook in here, keyed by a material name or by colour family, so no per-asset edit is needed.
- `scene-red.js`, `scene-dadao.js`, `scene-tower.js` — one chapter each, built on `window.SCENE`. Touch only where a material must be named (brick vs plaster vs glass).
- `data.js` — palette and copy. Do not change copy or camera keyframes.
- `research/render-styles/` and `research/ivress/README.md` — the 15 style tests and the IVRESS teardown; the shadow-cost and clay-AO measurements are there. Read-only.
- `asset/3d/preview.html` — previews the library alone; useful to check step 2 on a single model.

## Method

0. `git log --oneline -3` should show `52a575b` at the top. Take `step0-*.png` before touching anything (recipe below).
1. Per step: implement, `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"` on every file you edited, screenshot at the three fractions on a fresh session, check console, commit. Commit message shape: `feat(texture): step 1, ACES tone mapping and canvas sky environment`.
2. Step 1 caveat: the scene renders into a render target for the post pass, and in r149 the renderer's `toneMapping` may not apply on render-target draws. Check; if it does not, put the ACES curve in the post shader before the gamma line. Either way exposure is a single knob you tune against `step0-0.05.png`.
3. Step 2: seeded PRNG (a 10-line mulberry32 is fine), one canvas per material family, normal map derived from a height canvas by finite differences, `CanvasTexture` with `RepeatWrapping`; `roughnessMap` from the same canvas is welcome but optional. Set `map.repeat` from the mesh's world size where the engine knows it (`part()` knows w, h, d), otherwise a fixed world-scale repeat. Subtle: at 0.44 the bricks should be visible on the arcade columns and shophouse walls but not shout.
4. Step 3: one `DirectionalLight` with `castShadow`, shadow camera an orthographic box of about 120 × 120 units re-centred on the scroll camera every frame (set `target`, update its matrices), `PCFSoftShadowMap`, map size 2048 desktop / 1024 phone (`IS_PHONE` already exists). Only meshes above ~1 unit cast; the road and ground planes receive. Watch shadow acne on the flat walls; bias and normalBias are the knobs.
5. Step 4: per-vertex AO as vertex colours (`vertexColors: true`) computed at build time: for `part()` boxes a cheap rule (bottom ring of vertices darker, faces under an overhang darker) is acceptable; for the library models a short ray-free heuristic (height above ground, distance to the nearest neighbour box in the same group) is acceptable. Instanced sets share geometry, so they get the height rule only. Keep it subtle: 0.75 at the darkest.
6. After step 4: headed fps run, alone, click once in the page first, into `fps.txt`. Then the second rubric scoring from twelve fresh screenshots (four per chapter, same fractions as the first scoring in `RUBRIC.md`).

Test recipe, from `HANDOFF.md`, with a session name of your own:

```
export AGENT_BROWSER_SESSION=issue3
agent-browser open "file://$PWD/index.html"; agent-browser set viewport 1440 900
# wait ~40 frames after open, then scroll to fraction F and wait 80 frames:
agent-browser eval -b "$(printf 'new Promise(r=>{window.scrollTo(0,%s*(document.documentElement.scrollHeight-innerHeight));let n=0;(function t(){if(++n<80)requestAnimationFrame(t);else r("ok")})()})' 0.44 | base64)"
agent-browser screenshot ~/Desktop/issue3-texture/step1-0.44.png; agent-browser console; agent-browser close
```

If `open` returns "os error 35", close that session, remove only its files under `~/.agent-browser/`, and use a new session name. Never `pkill` the daemon.

## Do not touch

- The main checkout at `~/Documents/CJ-project-vault/Our-Memory-in-Taipei` — that is CJ's. Work only in this worktree.
- `data.js` copy, `WORDS`, `CLOSING`, `CAM` keyframes, any building's height or position, `style.css`.
- `three.min.js` (either copy). No new dependencies, no image files, no model files, no CDN.
- GitHub: no push, no PR, no issue comment. Drafts go to `~/Desktop/issue3-texture/`.

## Deliverable

- Four step commits on `issue-3-texture`, then one docs commit that updates `HANDOFF.md` (a "Surface texture pass (issue #3)" section in the shape of the IVRESS borrows table, open items 1 and 5 closed, the fps line refreshed) and `RUBRIC.md` (second scoring). Include this brief in the step 1 commit.
- `~/Desktop/issue3-texture/`: `step0..4-<fraction>.png`, `fps.txt`, `rubric-2-comment.md`, and the twelve rubric screenshots under `rubric-2/`.
- Reply with only: the five commit hashes with one line each, the fps numbers, and one line on anything you could not do or had to decide alone.

## Notes from the first pass (2026-09-22, lead)

A first agent on Opus 5 got partway into step 1 before the lead restarted the job on Fable. Its work is the uncommitted diff in `app.js` and `scene-tower.js` plus `step0-*.png` and `step1-*.png` on the Desktop. Review the diff with `git diff` before writing anything; keep what is right, redo what is not, and retake the step 1 screenshots yourself. Two facts it verified in this `three.min.js` build, so do not re-derive them:

- `renderer.toneMapping` applies on the offscreen post-pass draw too (only `outputEncoding` is gated on the render target), so the ACES setting on the renderer is enough; no hand-rolled curve in the post shader. The step 1 caveat above is withdrawn.
- `scene.environment` reaches only `MeshStandardMaterial` in r149. Every engine surface (`part()`, `instSet()`, the ground planes, both scene files' `lam()`) is `MeshLambertMaterial`, so the canvas sky lights the asset library and nothing else until those are converted to Standard. That conversion is also what step 2's normal maps need; do it in step 1 and measure the fps cost.
