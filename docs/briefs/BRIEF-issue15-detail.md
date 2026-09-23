# Brief: issue #15, model detail pass on the hero buildings

This is the scroll-driven three.js page "Our Memory in Taipei" (Claude Code Build Day). Issue #5 replaced procedural primitives with real glb models built by Blender scripts in `asset/blender/`; that work is merged and live at https://joy-shen123.github.io/Our-Memory-in-Taipei/. CJ has now looked at it twice and said the same thing both times: the models are still not detailed enough. You are closing exactly the detail gaps that issue #5 itself wrote down in `HANDOFF.md` under "Models". Read `HANDOFF.md` in full before you touch anything — it is the project's whole memory and it tells you how to test, what the palette is, and what every file does.

The reader of your result is the lead session, which reports to CJ. The lead verifies your screenshots and your diff, not your summary.

## Goal

The six things the camera actually frames — 霞海城隍廟, 西門紅樓, the 迪化街 bays, 樂聲戲院, 台北101, and the girl 張君雅小妹妹 — hold up when a viewer looks straight at them, with no visible facets and no flat stand-in surfaces, at the same frame rate as today.

## Done when

All seven steps of GitHub issue #15 are committed on branch `issue-15-detail`, each as its own commit with three screenshots, and the final measurement shows:

- fps at the display cap at scroll fractions 0.2 / 0.44 / 0.78, headed, 1440x900, pixel ratio 1 (today: 100.4 / 100.4 / 100.4)
- console empty on a fresh browser session
- all three `scene-*.js` re-run clean inside try/catch in the page
- `asset/models/` total under 6 MB (2.3 MB today), whole set under 120k triangles
- nothing pushed

Read the issue for the per-step list: `gh issue view 15`.

## CJ's words

- 2026-09-22: 「the color pallete is close but textue andthe model itself doesnt qualified」
- 2026-09-23: 「still the 3d model supposed to be more detailed」
- 2026-09-23: 「dont like low poly」
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — daylight palette, no fog veil, and the five-colour woodblock direction is dead. Do not bring it back.
- 2026-09-20: "THE BUILDING NEED TO REFERENCE REAL BUILDING" — detail you add must come from the real building, not from invention.
- 2026-09-24, on this dispatch: "send opus to work on model, make it more detailed"

## What is here

- `HANDOFF.md` — read in full first. The Models section lists the pipeline, the per-model triangle counts, and the explicit list of what the models dropped. That dropped list is your work.
- `asset/blender/*.py` — one script per model. `stylized.py` holds the shared builders, palette materials, bevel rules, boolean cutters, join and glb export. `dihua_common.py` holds the shared Dihua bay. **Fix the script, never the glb.**
- `asset/models/*.glb` — the output. Rebuilt by running the script.
- `models.js` — `MODELS.load` / `lambertize` / `instance`. Read it before changing how a model is built; a primitive rename breaks `opts.colorPrim` and `opts.emissive`.
- `scene-red.js`, `scene-dadao.js`, `scene-tower.js` — one chapter each, `window.SCENE` API only.
- `app.js` — the engine. The girl lives here and swaps her primitive build for the glb frames.
- `docs/RUBRIC.md` — the blind scoring rubric. Step 7 needs a blind score.

Rebuild a model with:

```
/Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/<name>.py -- --out asset/models/<name>.glb --stats --preview /tmp/x.png
```

Blender 5.2 LTS. Each script's header comment carries the lead's triangle budget for that part.

## Method

1. Read `HANDOFF.md` in full, then `gh issue view 15`, then `stylized.py`. Do not start modelling before you know what `stylized.py` already gives you — most of what you need is a builder that exists.
2. Do the seven steps of issue #15 in order. **One commit per step**, message in conventional commit format, scoped `feat(models):` or `fix(models):`.
3. After each step: rebuild that glb, check `--stats` against the triangle budget, and take three screenshots at 0.2 / 0.44 / 0.78 into `~/Desktop/issue15-detail/step<N>-<fraction>.png`. Plus one close preview render of the model you just changed, into the same folder.
4. Test the page exactly as `HANDOFF.md`'s "How to test" section says. Use your own port, never `pkill` by pattern — other agents' servers are running. Mute the browser right after opening it; this page plays audio through the speakers and CJ is in the room. Close the session after each check.
5. A page-load exception is NOT captured by the browser session. After the screenshots, re-run each scene file in the page inside try/catch, per `HANDOFF.md`. Issue #5 found `scene-red.js` silently dead for four commits this way.
6. Measure fps headed and alone at the end of each step. **If a step costs fps below the display cap, revert that step's geometry and find a cheaper way to the same silhouette.** Detail that costs frames does not ship.
7. Last step: a blind rubric score against `docs/RUBRIC.md`, written into the commit body.
8. Update the `HANDOFF.md` Models table — triangle counts, KB, and the "what the models dropped" paragraph — so the next agent is not hunting for something you already fixed.

## Do not touch

- Nothing outside this worktree. `~/Documents/CJ-project-vault/Our-Memory-in-Taipei` is CJ's own checkout; another agent may be in it.
- `data.js`, `style.css`, `music.js` — copy, HUD and the music player are other issues.
- Sky, fonts, light and shadow, the climbing man, the closing words — those are issues #9 to #13 and are blocked on #8's research. If a model change would be easier with a lighting change, say so in your reply; do not make it.
- `asset/music/private/` — CJ's private song files, gitignored. Leave them alone and never commit them.
- `_worktrees/blender-redhouse` — not ours, not to be touched or removed.
- **Do not push. Do not open a PR. Do not merge.** CJ decides the push.

## Deliverable

- Branch `issue-15-detail` in this worktree, 7 commits, not pushed.
- `~/Desktop/issue15-detail/` with three scroll screenshots plus one close preview per step.
- `HANDOFF.md` Models section updated on the last commit.

Reply with only: the commit hashes one per step, the final fps triple, the final `asset/models/` total size and triangle count, the blind rubric score, and one line naming anything you could not do.
