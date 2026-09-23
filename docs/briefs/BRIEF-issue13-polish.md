# Brief: issue #13, the polish pass — the crowd and the haze

"Our Memory in Taipei" is a scroll-driven three.js page, live at https://joy-shen123.github.io/Our-Memory-in-Taipei/, built for Claude Code Build Day. Four passes have shipped. A blind rubric score by an agent that did not build any of them came back at 71/105, and it found two things worth a branch. You are fixing exactly those two. Read `HANDOFF.md` in full before you touch anything — it is the project's whole memory, including how to test.

## Goal

The street has people on it, and no frame on the page is washed out by haze.

## Done when

Two commits on branch `issue-13-polish`, not pushed, and a re-score shows the three "density and life" cells and the chapter-02 "palette and light" cell all at 4 or above.

1. **The crowd.** One reusable pedestrian instance set, built once and used in all three chapters. Build it into `scene-tower.js` first — chapter 03 scores 1, the lowest cell on the page, and it is the chapter visitors end on — then reuse the same system in `scene-red.js` and `scene-dadao.js`. It must go through `instSet()` so the engine's per-era height tween still applies, and it must respect each chapter's era visibility.
2. **The haze.** `app.js:11`, `HAZE_DENSITY = 0.0022`. At fraction 0.58 it washes the frame to near-white — see `research/blind-score-2026-09-24/shots/dadao-0.58.png` on main, and open it before you change anything. Thin it or gate it so no frame reads as fog, without flattening the sense of distance when looking down the street. Then re-check every one of the twelve fractions, not just 0.58.
3. Screenshots at the twelve fractions the blind score used (red 0.02/0.10/0.20/0.30, dadao 0.36/0.44/0.52/0.58, tower 0.66/0.78/0.90/0.97) into `~/Desktop/issue13-polish/`, fps at the display cap at 0.2 / 0.44 / 0.78, console empty, all three scene files re-run clean in the page inside try/catch.

## CJ's words

- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — this is the instruction the haze still violates. The directional fog was switched off; `HAZE_DENSITY` never was. No fog, no night, no bloom.
- 2026-09-20: "REMOVE MOVE MOVING OBEJECT ON THE ROAD" — **traffic is off. The crowd goes on the sidewalks and the plaza, never on the road.** Only the girl moves on the road. Do not add cars, scooters or bikes in motion.
- 2026-09-23: 「還有精修」— this pass.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— chapter 1 stays low.

## What is here

- `HANDOFF.md` — read in full. "How to test" has the browser method, the chapter fractions and the `window.__fog` handles.
- `research/blind-score-2026-09-24/README.md` — the score and the evidence per cell. Read the three density entries and the chapter-02 palette entry.
- `app.js` — the engine. `HAZE_DENSITY` at line 11. The `part()` / `instSet()` system, the existing crowd placer for the asset library, the girl. There is already crowd-like placement code for the library items; read it before writing a new system.
- `scene-red.js`, `scene-dadao.js`, `scene-tower.js` — `window.SCENE` API only. `instSet(geo, mat, items, {colors})`, `libGroup(eras)`, `only(eras,h,col)`, `lam(col)`.
- `asset/blender/girl.py` and `asset/models/girl.glb` — the girl's build, if you want a simpler figure from the same pipeline. **Do not edit either**; `opus-issue15` is rebuilding `asset/blender/` and `asset/models/` on branch `issue-15-detail` right now.

## Method

1. Read `HANDOFF.md`, then the blind score report, then open `shots/dadao-0.58.png` and the four `tower-*.png` so you can see both faults yourself.
2. Crowd first, tower chapter first. One commit when it is in all three chapters and the fps still reads at the cap.
3. Haze second, its own commit.
4. Test exactly as `HANDOFF.md` says. Your own port; never `pkill` by pattern, other agents' servers are running. **Mute the browser right after opening it** — the page plays music through the speakers and CJ is in the room. Close the session after each check.
5. A page-load exception is NOT captured by the browser session. After the screenshots, re-run each scene file in the page inside try/catch, per `HANDOFF.md`. A previous issue found `scene-red.js` silently dead for four commits this way.
6. If the crowd costs fps below the display cap, cut the instance count rather than shipping a slow page. Say the count you landed on.
7. Update `HANDOFF.md` with the crowd system and the haze value on your last commit.

## Do not touch

- `asset/blender/`, `asset/models/` — `opus-issue15` owns those on another branch.
- `research/plan-6/` — `sonnet-plan6` is writing there.
- `data.js` copy, `music.js`, the fonts, the sky, the climbing man — those are #8's plan and issues #9 to #12.
- `asset/music/private/` — CJ's private songs, gitignored.
- **Do not push, do not open a PR, do not merge.** CJ decides the push.

## Deliverable

- Branch `issue-13-polish`, two commits, not pushed.
- `~/Desktop/issue13-polish/` with twelve screenshots.
- `HANDOFF.md` updated.

Reply with only: the two commit hashes, the crowd instance count per chapter, the haze value you landed on, the fps triple, and one line on anything you could not do.
