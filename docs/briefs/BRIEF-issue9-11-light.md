# Brief: issues #9 and #11 — the sky, and light and shadow

"Our Memory in Taipei" is a scroll-driven three.js page built for Claude Code Build Day, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. Issue #3 gave it a tone curve, a canvas sky that lights the scene but is never shown, one shadow sun and per-vertex occlusion. Issue #5 replaced the buildings with Blender-built glb models. The research in `research/plan-6/README.md` looked at what is left and found a bug nobody asked for. Read `HANDOFF.md` in full before you touch anything.

These two issues share `app.js`'s lighting block, so they are one branch and one agent. Keep them as separate commits.

## Goal

The sky is part of the picture and it is bright in every chapter, and the models sit in real light with real shadow.

## Done when

Branch `issue-9-11-light`, four commits, not pushed.

**Commit 1 — the night-creep bug (#9).** The research found the sky darkening across the scroll, which nobody asked for and which contradicts a standing instruction. Find it, pin night at 0, and prove with a before/after pair at the fraction where it was worst. This one is not a judgement call: it is a regression against CJ's own words below.

**Commit 2 — the sky shown, tinted per chapter (#9).** Today the background is one flat colour behind procedural mountains while the canvas sky lights the scene invisibly. Retune the existing gradient dome to a bright per-chapter accent tint keyed to the scroll year, per `research/plan-6/README.md` section 1 and the five `sky-*.png` comparisons in `research/plan-6/shots/`. **Do not show the raw environment map** — the research is explicit that it reads wrong. Daylight in all three chapters.

**Commit 3 — prove or disprove the shadow claim (#11).** The research claims issue #5's models neither cast nor receive shadow, because `lambertize()` falls outside `enableShadows()`'s Standard-material gate. **The lead read the code and does not believe it**: `models.js:39` sets `o.castShadow = o.receiveShadow = true` on every glb mesh, and `enableShadows()` only adds flags, it never removes them. Your first step is a runtime check, not a code read — put the sun where a shadow would be obvious, screenshot a model with and without, and say which way it went. If the models already cast, say so plainly and this commit is the evidence, not a fix.

**Commit 4 — coloured shadow tint (#11).** The bruno-simon teardown's one-line move: a tinted shadow instead of flat grey. `research/bruno-simon/README.md` has the method. **No day cycle** — the research rules it out on cost and CJ has never asked for one.

Then: screenshots at 0.02 / 0.2 / 0.36 / 0.44 / 0.58 / 0.66 / 0.78 / 0.97 into `~/Desktop/issue9-11-light/`, fps at the display cap at 0.2 / 0.44 / 0.78, console empty, all three scene files re-run clean inside try/catch.

## CJ's words

- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — **this is the instruction the night-creep violates.** No fog, no night, no bloom. Bright daylight in every chapter, at every fraction.
- 2026-09-23: 「下次要做天空」 and 「搞光影」— issues #9 and #11.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— chapter 1 stays low; do not raise anything to catch light.

## The one thing you must not decide

CJ has **not** given a reference image for a painted sky dome, and it stays out of this branch. Build the bright per-chapter tint on the gradient dome that already exists. If you think a painted dome is the only way to hit the look, say so in your reply and stop — do not invent one.

## What is here

- `HANDOFF.md` — read in full. `app.js`'s renderer section describes the tone map, the canvas-sky environment, the shadow sun that follows the scroll, `lit()` / `lam()` / `aoBake()`.
- `research/plan-6/README.md` sections 1 and 3, plus `shots/sky-today-early-ximen.png`, `sky-today-late-ximen.png`, `sky-shown-ximen.png`, `sky-bright-early-ximen.png`, `sky-bright-late-ximen.png`. Open all five before you start.
- `research/bruno-simon/README.md` section 6b — the sky-per-chapter method and the coloured shadow.
- `research/blind-score-2026-09-24/README.md` — chapter 02 scored 2 on palette and light. Its `shots/dadao-0.58.png` is the worst frame on the page. Note that `fable-issue13` is separately thinning `HAZE_DENSITY` on branch `issue-13-polish`; **do not touch `HAZE_DENSITY`**, it is theirs.
- `app.js` — the lighting block, `enableShadows()` around line 189, the environment canvas around line 200.
- `models.js` — `lambertize()` at line 34.

## Method

1. Read `HANDOFF.md`, then the two research sections, then open the five sky comparisons.
2. One commit per numbered item above, in order. The bug first: it is the only one that is a regression rather than an improvement.
3. Test as `HANDOFF.md`'s "How to test" says. Your own port; never `pkill` by pattern, other agents' servers are running. **Mute the browser right after opening it** — the page plays music through the speakers and CJ is in the room. Close the session after each check.
4. A page-load exception is NOT captured by the browser session. Re-run each scene file in the page inside try/catch after the screenshots.
5. If any change costs fps below the display cap, revert it and say so. Bright is required; slow is not acceptable.
6. Update `HANDOFF.md` on the last commit.

## Do not touch

- `HAZE_DENSITY` in `app.js` — `fable-issue13` owns it on `issue-13-polish`.
- `scene-tower.js` crowd code — same agent.
- `asset/blender/`, `asset/models/` — `opus-issue15` owns those on `issue-15-detail`.
- `style.css` and `asset/fonts/` — `fable-issue10` owns those on `issue-10-fonts`.
- The climbing man and the closing words — issue #12, not yet dispatched.
- **Do not push, do not open a PR.** CJ decides the push.

## Deliverable

- Branch `issue-9-11-light`, four commits, not pushed.
- `~/Desktop/issue9-11-light/` with the screenshots, including the before/after pair for the night-creep and the shadow proof.

Reply with only: the four commit hashes, which way the shadow check went, the fps triple, and one line on anything you could not do.
