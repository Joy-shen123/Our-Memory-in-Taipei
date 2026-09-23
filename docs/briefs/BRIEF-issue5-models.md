# Brief: issue #5, detailed stylized models (branch `issue-5-models`)

You are a build agent in a git worktree of `Joy-shen123/Our-Memory-in-Taipei`, a scroll-driven three.js page (r149 UMD, no build step, no CDN). Read `HANDOFF.md` in full first: chapters, files, the `window.SCENE` API, the test recipe, and the real-building reference tables you must keep to. Then GitHub issue #5 (`gh issue view 5 --repo Joy-shen123/Our-Memory-in-Taipei`, the text is also copied below). The lead reads your pane and your screenshots. CJ decides when anything is pushed.

## Goal

The street stops being boxes. Hero buildings, repeated street elements and the girl become detailed stylized models built by Blender scripts committed in the repo, and the page still runs at 60+ fps.

## Done when

Step 1 only, then stop and report: `asset/blender/red-house.py`, `asset/models/red-house.glb`, `GLTFLoader.js` (three r149) in the repo, `scene-red.js` loading the glb in place of the primitive Red House, a screenshot at the Red House keyframe beside the current one in `~/Desktop/issue5-models/step1-redhouse-before.png` and `-after.png`, fps at the three standard fractions, console empty over http. One commit. The lead shows CJ and says go before steps 2 to 5.

## CJ's words

- 2026-09-23: 「still the 3d model supposed to be more detailed」
- 2026-09-23: 「dont like low poly」— rounded bevelled edges, no visible facets.
- 2026-09-22: 「the color pallete is close but textue andthe model itself doesnt qualified」
- 2026-09-20: 「THE BUILDING NEED TO REFERENCE REAL BUILDING」— every model keeps its reference from HANDOFF's tables.
- 2026-09-20: 「CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY」
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— chapter 1 stays low.

## The look

Stylized 3D as in bruno-simon.com's landing shot (`research/bruno-simon/shots/02-first-frame.png`, and `research/bruno-simon/README.md` section 4): rounded bevelled edges, real detail (window frames, cornices, tiles, railings, signage geometry), dense small props, flat palette colours. No visible facets, no photo textures, no UV-mapped image textures. Colour comes from vertex colours or per-material flat colours taken from the palette in `data.js`, so the issue #3 lighting (on branch `issue-3-texture`, not merged yet; do not depend on it) applies unchanged later.

## Tooling, verified by the lead

- Blender 5.2.0 LTS at `/Applications/Blender.app/Contents/MacOS/Blender`. Build models headless: `Blender --background --python asset/blender/red-house.py -- --out asset/models/red-house.glb`. The script uses bpy and bmesh only, builds from primitives with bevel modifiers and boolean cuts, assigns flat-colour materials, applies transforms, and exports glTF binary with `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB', export_apply=True)`. Commit both the script and the glb.
- three.js r149 has no add-ons in `three.min.js`. Fetch `https://unpkg.com/three@0.149.0/examples/js/loaders/GLTFLoader.js` once into the repo root as `GLTFLoader.js` and load it after `three.min.js` in `index.html`. Verify it attaches `THREE.GLTFLoader`.
- Chrome blocks file:// fetches, so test over http: `python3 -m http.server 8000` in the worktree, then `http://localhost:8000/index.html`. Write that line into `README.md` and the HANDOFF "Open it" line in the final docs commit. Kill the server when done.
- Scale: the scene uses metres, the Red House octagon is about 16 m across; check `scene-red.js` for its position (16.6, -70) and the current primitive's height so the glb lands in the same place at the same size. Front faces +Z before rotation.
- The engine tweens object heights per era through `part()`/`instSet()`; a loaded glb is a plain Object3D, so gate its visibility with `libGroup(eras)` like the library assets do, and set `anchors.redhouse.top` for the label.

## Issue #5, copied

Step 1: pipeline proven on 西門紅樓 (the octagon, arched openings at street level, paired windows above, pale string courses and corner quoins, the eight-sided slate roof with a lantern, the one-storey cross wing with gable roofs behind it), bevelled edges, exported to glb, loaded in `scene-red.js`, screenshot beside the current one, fps at the cap. Stop and show.
Step 2: hero buildings 霞海城隍廟, 台北101, 永樂市場, one 中華商場 block, 樂聲戲院.
Step 3: repeated street elements, instanced: one Dihua Street bay per crest style, a 年貨大街 stall, a Ximending shopfront body, lamp, bollard, tree, and dense small props.
Step 4: 張君雅小妹妹 as a character model with a two-frame run.
Step 5: total `asset/models/` under 6 MB, 60+ fps headed, console empty; a commit per step with screenshots at 0.05 / 0.44 / 0.78.

## Method for step 1

1. Read `scene-red.js`'s Red House build to get position, footprint, heights and which eras show it.
2. Write `asset/blender/red-house.py`. Keep it readable: one function per part (octagon walls, arches, windows, string courses, roof, lantern, cross wing), a `PALETTE` dict at the top with the hexes from `data.js`, bevel width about 0.05 m with 2 segments, subdivision only where a curve needs it. Target under 30k triangles for the whole building.
3. Render to glb, load it, and if a material or scale is wrong fix the script, never the glb.
4. Screenshots with agent-browser session `models`, headless 1440x900, over http, at the Red House keyframe (find the fraction in `data.js` `CAM` and `window.__fog.jumpToYear`) before and after. Mute nothing, there is no audio on this branch. Close the session after each check. Sessions of other agents (`issue3`, `music4`, `brunostyle`) are not yours.
5. Commit: `feat(models): step 1, Blender-scripted 西門紅樓 glb and GLTFLoader pipeline`, including this brief.

## Do not touch

- The main checkout and the other worktrees under `~/Documents/CJ-project-vault/_worktrees/`.
- `app.js` except to register the loader if `scene-red.js` cannot do it alone; `data.js` copy and camera; `style.css`; `asset/3d/` library files.
- GitHub: no push, no PR, no comment.

## Deliverable

- Step 1 commit on `issue-5-models`, the two screenshots, fps line.
- Reply with only: the commit hash, triangle count and glb size, fps at 0.2 / 0.44 / 0.78, and one line on what in the Red House you could not model from the script and why.
