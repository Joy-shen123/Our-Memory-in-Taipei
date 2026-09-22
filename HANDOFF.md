# HANDOFF — Our Memory in Taipei

Scroll-driven three.js page for Claude Code Build Day. Repo: https://github.com/Joy-shen123/Our-Memory-in-Taipei (formerly claude_code_build_day, branch `main`). Live: https://joy-shen123.github.io/Our-Memory-in-Taipei/ (GitHub Pages, deploys from `main` on every push). Local clone: `~/Documents/CJ-project-vault/Our-Memory-in-Taipei` (renamed from `shidaimiwu-proto` 2026-09-22 to match the repo). Worktrees go in `~/Documents/CJ-project-vault/_worktrees/Our-Memory-in-Taipei/<branch>`. Issue #1 merged as PR #2 on 2026-09-22; its worktree is removed. Last updated 2026-09-23 (issue #3, the surface texture pass, branch `issue-3-texture`, not pushed).

## What it is

One page, one verb: scroll. A street runs away from the camera. Scrolling moves the camera down the street and forward in time through three chapters. 張君雅小妹妹 (bowl cut, white shirt, dark skirt, a bowl of noodles in both hands) runs down the middle of the road ahead of the camera; she is the viewer's memory, so she runs every chapter. Big words surface as you scroll. It ends on a man climbing Taipei 101 with the line "Where we go, we don't know. We only know we need to climb higher."

| Chapter | key | years | z range | what is there |
|---|---|---|---|---|
| When We Were Young | `red` | 1985–1999 | +60 … -140 | Ximending: the eight 中華商場 blocks with rooftop neon, 樂聲戲院 billboards, the Red House octagon with its cross wing, 萬年大樓, the 1999 pedestrian zone and 西門町 gate, the asset library's shopfronts, stalls, crowd |
| Spring Festival | `dadao` | 2000–2019 | -140 … -290 | Dadaocheng: the 年貨大街 archway, Dihua Street's narrow arcade bays with 閩南 / 洋樓 / 巴洛克 crests, 霞海城隍廟 with a swallowtail ridge, 永樂市場, the wharf through a side-street gap, lantern strings, banners, stalls with price boards, crowd |
| The Future | `tower` | 2020– | -290 … -460 | Xinyi: Taipei 101 with its real profile (tapered pedestal, coins, eight flared segments with 如意, crown, spire), 新光三越 A11, the skywalk, City Hall on the horizon, lit office towers, the climbing man, the closing line |

Open it: double-click `index.html`. No build step, no server, no network. `index.html?year=2010` jumps to any year.

## CJ's decisions (quoted, so nobody re-litigates them)

- 2026-09-20: "first 1 to ximen red house, second be dadaocheng, third taipei 101, all in english" — three chapters, English copy, Chinese only as the small secondary name.
- 2026-09-20: "FIRST THE MEMORY OF OUR CHILDHOOD, WE FEEL HAPPINESS, WE FEEL NOSTALGIA … SECOND PART, DAODACHENG SPRING FESTIVAL, WE GROW OLDER, WE HAVE RESPONSIBILITY, WE BUILD THING, THIRD PART THE FUTURE, WHERE WE GO" — the word list in `data.js` `WORDS` follows this.
- 2026-09-20: "ALSO NEED A GIRL RUNNING IN THE CENTER WHEN I SCROLLING" — the girl runs when you scroll and slows to a walk when you stop.
- 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY" — fog veil is off, daylight palette. The original five-colour woodblock-print direction from the brief is abandoned. Do not bring it back.
- 2026-09-20: "THE BUILDING NEED TO REFERENCE REAL BUILDING" — use the teammate's asset library in `asset/3d/` first; build from primitives only when no asset exists.
- 2026-09-20: "REMOVE MOVE MOVING OBEJECT ON THE ROAD" — traffic is switched off. Only the girl moves on the road.
- 2026-09-21: "opneing frame title child hood change to when we were young, Memory in us change to Our Memory IN Taipei" — done.
- 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」— the opening stays low; nothing tall goes into chapter 1.
- 2026-09-21: 「all」— go on Part 3 (the rubric) and the whole IVRESS borrow list. Done this session; see the borrows table below.

## Files and load order

`index.html` loads, in this order: `three.min.js` (r149, UMD, global `THREE`) → `asset/3d/assets-core.js` + `assets-ximen-*.js` + `assets-dadaocheng-*.js` (teammate's library, global `NOSTALGIA_ASSETS`) → `data.js` (all content, global `DATA`) → `app.js` (engine) → `scene-red.js`, `scene-dadao.js`, `scene-tower.js` (one chapter each; they build the anchors too).

- `data.js` — palette, eras, anchors with captions (position and label only; the buildings are in the scene files), generic lots (Xinyi stretch only now), camera keyframes (`CAM`, 6 keyframes, z must keep decreasing), `WORDS`, `CLOSING`. Change copy here.
- `app.js` — renderer (ACES on luminance as a CustomToneMapping, the canvas-sky environment map, the shadow-casting sun that follows the scroll, `lit()` / `lam()` / `aoBake()`, see the surface texture pass below), custom fog (currently disabled by setting the frontier to -1e5), camera rig on a Catmull-Rom curve, year/era from scroll progress with boundaries pinned where the camera crosses each road marking, the `part()`/`instSet()` system that tweens every object's height per era over 500 ms, the street furniture (lamps, trees, crowd, hanging signs, distant city), the asset-library placer, the girl, the climbing man, the words (per-glyph reveal), the two particle systems, the render warm-up, the post pass (luminance-aware grain, vignette and the chapter-cut flash; `uPrint` is 0 everywhere), mouse parallax along the camera axes, and the robustness block (pixel-ratio cap, clock reset on tab return, keyboard and touch scroll). No street trees on Dihua Street (z -138 … -292) or near the 101 base shot.
- `style.css` — the HUD: chapter column top-left (`.hud-chapter`), site title top-right (bottom-right under 480 px), year bottom-right (bottom-left under 480 px), the words with their glyph transitions, anchor labels, the closing line at 24vh.
- `scene-*.js` — use `window.SCENE` API only: `part(x,y,z,w,d,lookByEra,rotY?,geo?)` (one draw call each), `instSet(geo,mat,items,{colors})`, `only(eras,h,col)`, `C(name)`, `lit(params)` (the engine's MeshStandardMaterial; `surface: 'brick'|'plaster'|'concrete'|'wood'|'asphalt'`), `lam(col, extra?)` (`lit()` by palette key, family chosen from the key), `aoBake(geo)`, `libGroup(eras)` (a group visible only in those eras), `asset(id, group, x, z, rotY, scale?)` (builds one library item into it; front faces +Z before rotation, so `-π/2` on the east side and `+π/2` on the west), `findAsset(id)`, `anchors`, `TOWER`. Items absent in an era have height 0 and are dropped underground by the engine. Each scene file sets `anchors.<id>.top` for its labels; `scene-tower.js` sets `TOWER.h` (crown top) and `TOWER.faceX(y)` (west-face x at height y) so the climbing man stays on the glass.
- `asset/` — teammate's texts (`*.md`) and 3D library (`asset/3d/`). `asset/3d/preview.html` previews the library. `assets-core.js` now also owns the five procedural surface families (`C.surface`, `C.surfaceOf`, `C.fitSurface`, `C.TILE`), which `C.mat` attaches by colour. All six era sets are placed: Ximending items along the childhood chapter (`scene-red.js`, visible in the red era), Dadaocheng items along Spring Festival (`scene-dadao.js`, visible in red and dadao so nothing pops in at the flip). The library's own `red-house`, `chunghwa-market` and `xiahai-temple` are not used: the rebuilds below replace them.
- `README.md` — the original note that this was a throwaway prototype. Out of date: this is now the entry.

## How to test (what has worked every time)

```
export AGENT_BROWSER_SESSION=memtaipei
agent-browser open "file://$PWD/index.html"; agent-browser set viewport 1440 900   # headless; add --headed only to measure fps
# scroll to a fraction F (0..1) and wait 80 frames:
agent-browser eval -b "$(printf 'new Promise(r=>{window.scrollTo(0,%s*(document.documentElement.scrollHeight-innerHeight));let n=0;(function t(){if(++n<80)requestAnimationFrame(t);else r("ok")})()})' 0.45 | base64)"
agent-browser screenshot /tmp/f.png; agent-browser console; agent-browser close
```

Chapter fractions: red 0.02–0.347, dadao 0.347–0.582, tower 0.582–1.0 (the exact boundaries are `window.__fog.BOUNDS`; the flash and the parallax fade key on them). `window.__fog` exposes `progress`, `year`, `era`, `camZ`, `BOUNDS`, `jumpToYear(y)`, `drift` (parallax x, y, fade), `warm` (warm-up ms, programs, textures) and `hitch` (longest frame gap since load, for measuring). `index.html?nowarm=1` skips the warm-up. Syntax-check any file with `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`. Last measured 2026-09-23 after issue #3: 100.6 / 100.6 / 100.5 / 100.6 fps headed at 0.2 / 0.44 / 0.78 / 0.9 (display cap; the light stream is on at 0.9), 1440x900 pixel ratio 1, 1333 meshes, console empty, zero page errors; warm-up 331 ms for 30 programs and 261 textures, and the load frame is about 1.9 s before any scroll. `window.__fog.shadow` reports the shadow flags and the sun's box.

The frame loop starts on `DOMContentLoaded`, not at the end of `app.js`: the parser can yield to a frame between two script tags, and the first frame's one-time work (shadow flags, warm-up) must see the finished scene. Headless notes: wait ~40 frames after `open` before scrolling (the first frames carry the shader compiles); `agent-browser errors --json` accumulates for the life of a session, so judge "console empty" on a fresh session; CSS transitions only advance with the frame clock, so a mid-transition screenshot needs a short frame wait (about 26 frames for the word reveal), not a long one. If `open` returns "Resource temporarily unavailable (os error 35)", that session's daemon is wedged: `agent-browser close` it, remove only that session's files under `~/.agent-browser/`, and use a new session name; never `pkill` the daemon binary, other sessions on this machine share it.

Headed Chrome throttles animation frames when the window is not focused, so a second headed session on the same machine stalls the first one's `requestAnimationFrame` wait. For screenshots drop `--headed` (headless does not throttle); measure fps headed, alone. On stage: click once in the page before scrolling.

## Real-building references (issue #1, Part 1)

Every item below is procedural (primitives, canvas text, the palette) or from the asset library; no image or model files. The reference is what the shape was taken from.

**When We Were Young — Ximending (`scene-red.js`)**

| Item | Where | Reference |
|---|---|---|
| 西門紅樓 octagon + 十字樓 | east, centre (16.6, -70) | Kondo Juro's 1908 market: two-storey red-brick octagon (~16 m across, eight arched openings at street level, paired windows above, pale string courses and corner quoins, eight-sided slate roof with a lantern) and the one-storey cross-shaped hall with gable roofs behind it. Walls are one canvas texture on an 8-sided cylinder. |
| 中華商場, eight blocks | west, z 46 … -46 | The 1961–1992 blocks 忠孝仁愛信義和平 along 中華路: arcade of shops at street level, two floors of small balcony windows above, flat roofs with the steel-framed 國際牌 / 黑松 / 三洋 / 聲寶 … signs. Name plates 忠棟 … 平棟 on the road corner. Red era only (demolished 1992 = z -45 in scroll time). |
| 樂聲戲院 | west, z -66 | Lux Theatre on 武昌街 electric street: a plain five-storey block whose street face is covered by hand-painted billboards (英雄本色 1986, 倩女幽魂 1987, 楚留香), marquee canopy over the doors, poster cases, vertical 樂聲戲院 neon on the corner. |
| 萬年大樓 | west, z -124 | 萬年商業大樓 (1973) on 西寧南路: ten-storey slab with a tight window grid, rooftop rink hall, 萬年商業大樓 on the roof, vertical 萬年 sign, a wall of small vertical shop signs (電玩 冰宮 唱片 …). |
| 1999 pedestrian zone | road, z -96 … -144 | 西門町行人徒步區 (1999): patterned pavers replacing the asphalt, bollards at the entry, the arched red 西門町 gateway with its sign. The camera reaches it in 1996 scroll-time, so the zone is in place by 1999. |
| Shopfronts between | both sides | Teammate's Ximending library (record shop, comic rental, phone booth, 野狼 125, 淘兒 yellow front, arcade cabinet, gashapon, BB Call standee, photo-sticker booth, internet café, phone shop, F4 wall, 張君雅 shelf, concert stage), each with a windowed building body behind it. |

**Spring Festival — Dadaocheng (`scene-dadao.js`)**

| Item | Where | Reference |
|---|---|---|
| 迪化街 shophouse row | east, z -150 … -262 (24 bays); west bays around the library fronts | Dihua Street Section 1: 4.6 m frontages (real 4–5 m), 騎樓 arcade over the sidewalk with columns at the kerb and the shop wall at the back, two tall windows per bay between pilasters, three crest styles cycling: 閩南 red-brick low parapet, 洋樓 red brick with round-arched windows and balustrade, 巴洛克 plaster curved gable with medallion (屈臣氏大藥房 / 林五湖 style). All instanced. |
| 霞海城隍廟 | west, (-11, -240) | One of Taipei's smallest temples (~150 m²): a single hall facing the street, brick side walls, dark carved front wall with red doors, two thick red porch columns, gabled brick-orange roof with an ink 燕尾脊 swallowtail ridge, name board on the eave, two big red lanterns, incense burner on the forecourt, the 月老 queue along the sidewalk (tower era). |
| 永樂市場 | west, z -263 … -285 | The 1982 concrete market: pale block, floors 2–5 with horizontal window bands, floors 6–7 stepped back, open shaded ground floor with columns and cloth bolts on stall tables, red vertical 永樂市場 sign, 永樂布業商場 board, rooftop sign. |
| 年貨大街 | road, z -150 … -262 | The Lunar New Year market (since 1996): the library's entrance archway spanning the road at z -150, eight lantern strings, 年貨大街 / 恭喜發財 banners, 30 stall tables with canopies, red paper price boards (一斤100, 大特價, 試吃, 烏魚子, 開心果, 肉乾, 香菇, 年菜) on the tables nearest the keyframe, 春聯 strips on every shop wall. |
| 大稻埕碼頭 | west, through the 民生西路 gap at z -204 … -220 | The Tamsui riverside wharf: flood wall with the 5號水門 gate (red steel frame), promenade plaza with two embankment steps down to the water, bike-path stripe (2000s), tall lamp posts, leaned bicycles, a ferry pier with a white Blue-Highway ferry (dadao/tower). The junks are gone (wrong century). Only seen peripherally as the camera passes; no keyframe frames it. |
| Shopfronts between | west | Teammate's Dadaocheng library: red-brick arcade, 南北貨行, 旗袍布莊, 波麗路, 柑仔店, creative café, 中藥行 counter, 巴洛克山牆 townhouse (east row), 三輪車, 藍色小貨車, 廟埕茶桌, 月老參拜區, 年貨攤位 ×2, 永樂布行攤位 ×2, wharf corner. |

**The Future — Xinyi (`scene-tower.js`)**

| Item | Where | Reference |
|---|---|---|
| 台北101 | (0, -420) | C.Y. Lee's elevation: mall podium; a tapering pedestal for floors 1–25 (square frustum, wider at the bottom); the four 古錢 coin ornaments just under the 26th floor, one per face; eight 斗-shaped segments of eight floors, each flaring 7° outward so its top overhangs the next base (節節高升); a 如意 ornament at each bottom corner of every segment (32, one instSet); tapering crown for floors 91–101, mechanical box, mast and spire. Glass is the palette `glass` with a lit-window grid. `TOWER.faceX(y)` follows this profile so the climbing man stays on the west face. |
| 新光三越 A11 | east, z -403 … -385 | Shin Kong Mitsukoshi Xinyi Place A11 (松壽路): twelve-storey block with the big rounded corner toward the road and the 101 podium, LED wall screens (新光三越, A11), red square logo near the top, entrance canopy. |
| 信義空橋 | crossing the road at z -392; along the mall fronts A11 → next mall | The Xinyi elevated walkway system: deck at 6.5 m with glass railings and handrails, pillars on each sidewalk, stair ramps down. The second crossing at z -352 was cut: its deck filled the top of the frame as the camera passed under. |
| 台北市政府 outline | horizon, (-46, -505) | Taipei City Hall's symmetrical stepped massing at the end of 仁愛路: centre block, two wings, two end pavilions, roof block, unlit haze so it reads as distance. Visible left of the tower in the approach shot; the office ring west of z -360 was lowered so it shows. |
| Base shot cleanup | fraction ~0.78 | The dark roof in the base shot was the engine's street-tree crown beside the camera; app.js now plants no trees within 45 of z -405. |

## IVRESS borrows (issue #1 Part 3 session, 2026-09-21)

The eight cheap effects from `research/ivress/README.md`, one commit each, screenshots in `~/Desktop/issue1-part1/part3/`. All inside the constraints: r149 UMD, no build, no network, no image or model files, daylight, no fog.

| Item | Where | What it does | Screenshot |
|---|---|---|---|
| a. Chapter-cut flash | `app.js` post pass, `updateFlash` | white flash at the 2000 marking, warm gold at 2020, elliptical mask from the centre, keyed on progress within 0.012 of the boundary, 500 ms hold then a 1.2 s fade | `a-chapter-cut-flash-0.347.png`, `-0.582.png` |
| b. Letter-by-letter words | `updateWords`, `.word-big .w span` | per-glyph spans with a 38 ms transition-delay step; `.show` toggles when the word is near; words kept whole so lines break between words | `b-letter-reveal-0.12-mid.png`, `-0.12.png` |
| c. Chapter column | `.hud-chapter`, `swapEraLabel` | "01/03 · WHEN WE WERE YOUNG · 1985–1999 · Ximending" top-left, Chinese name vertical; replaced the bottom-left era block | `c-chapter-column-0.05.png` |
| d. Luminance-aware grain | post pass | `grain *= mix(1, 1 − luma, 0.85)`, stepped at 30 Hz, amplitude 0.06 at black | `d-luminance-grain-0.44.png` |
| e. FOV ramp | `data.js` CAM[5] | closing keyframe fov 82, so the view opens from 62 to 82 over the climb | `e-fov-ramp-0.97.png` |
| f. Mouse parallax | `placeCamera`, `parallaxFade` | damped drift along the camera's right and up (0.6 / 0.3), applied after lookAt, fading to 0 within 0.04 of each cut and the end | `f-mouse-parallax-0.44.png` (pointer at 200,150) |
| g. Curve particles | `sparks`, `stream`, `updateParticles` | 500 lantern sparks rising off a curve through the eight strings (dadao), 900 points spiralling up a curve on `TOWER.faceX` (tower); a 12-line point shader, CPU-updated | `g-curve-particles-sparks-0.5.png`, `-stream-0.9.png` |
| h. Render warm-up | `warmUp` | first frame: everything visible, `renderer.compile`, one offscreen draw, restore; 50 ms, 16 programs, 165 textures. The crossing hitch was 12 ms with or without it on the M4 Max, so this is insurance for a slower laptop | `h-render-warmup-0.0.png` |
| Robustness | `IS_PHONE`, `resetClocks`, keydown, touchmove | pixel ratio 2 desktop / 1.5 phone; dt ≤ 50 ms and clocks reset on tab return; arrows, page keys, space, home, end; touch fallback if a swipe does not move `scrollY` | `robust-390x844-0.05.png`, `-0.44.png`, `-0.97.png` |

## Surface texture pass (issue #3, 2026-09-22 to 23, branch `issue-3-texture`)

CJ, 2026-09-22: 「work GitHub issue #3 … one commit and screenshots per step, no push until I say.」 Four step commits and this docs commit, screenshots in `~/Desktop/issue3-texture/` (`step0..4-<fraction>.png` at 0.05 / 0.44 / 0.78, `fps.txt`, `rubric-2/`, `rubric-2-comment.md`). Every wall, roof and road now reads as a material under one sun; procedural only, no image or model file, daylight, no fog, no bloom, no height changed. Brightness was held against `step0-0.05.png` at every step (CJ 2026-09-20, bright, not greyer): whole-frame luminance 193 / 184 / 187 vs 193 / 186 / 183 at the three fractions, saturation 0.136 vs 0.144, clipped-white pixels 3% → 0.

| Step | Where | What it does | Screenshot |
|---|---|---|---|
| 1. Tone mapping and environment | `app.js` renderer block, `skyEnv`, `lit()` | The ACES filmic curve on the renderer, applied to luminance only as a `CustomToneMapping` (`colour × curve(Y)/Y`): stock `ACESFilmicToneMapping` lost 30% of the frame's saturation through its RRT matrices, which is the greyer page CJ ruled out. Exposure 0.85. A canvas-drawn sky (two gradients and a sun disc placed where the key light is) PMREM'd into `scene.environment`. Every engine surface converted from Lambert to `MeshStandardMaterial` via `lit()` so the environment reaches it (r149 lights Standard only). Light budget re-balanced: hemisphere 0.65 + environment 0.35 (both tweened per era, `ERA_MIX.env`), sun 1.3. The 101 glass: roughness 0.35, metalness 0.4, env 0.7. | `step1-0.05.png`, `-0.44`, `-0.78` |
| 2. Procedural colour and normal maps | `asset/3d/assets-core.js` `C.surface`, `C.mat`; `app.js` `lit()` / `lam()`, `part()`, `instSet()`, `roadTexture()`; `scene-dadao.js` `brickSplit` | Five seeded families, brick / plaster / concrete / wood / asphalt: a 512 px near-white colour multiplier and a normal map from a wrapped height field, one tile = `C.TILE` = 3 units, mulberry32 with fixed seeds. The library picks the family from the colour (`C.surfaceOf`) and fits the repeat to the box size (`C.fitSurface`); the engine picks it from the palette key (bone plaster, walk and haze concrete, brick brick), re-fits each part's repeat to its tweened height every frame, and fits one repeat per instanced set from the median item. A caller's own map always wins; the normal map goes under it. Dihua's mixed sets are split so the brick items carry brick. One strength knob, `C.SURFACE_STRENGTH` in `assets-core.js`, scales the colour-map contrast and the normal relief together; the recipes' own values are 1 (brick tone ±8%, plaster ±4%), and it ships at 3 after CJ, 2026-09-23: 「i dont feel texture in these 3d model」. Walls that carry their own map (the 中華商場 window strips, the lit-window facades) get the relief only, so they stay fainter. | `step2-*.png`, `fix-dihua-bay.png`, `fix-ximen-shopfront.png` |
| 3. Shadow-casting sun | `app.js` `sunFollow`, `enableShadows` | PCF soft shadow map, 2048 desktop / 1024 phone, an orthographic box 120 units square re-centred every frame 45 units down the road from the scroll camera. Every lit opaque mesh casts and receives; bias −0.0004, normalBias 0.05, no acne on the plaster. Found and fixed on the way: the first frame ran before the scene files had built (48 of 1333 meshes flagged), so the loop now starts on `DOMContentLoaded`. | `step3-*.png` |
| 4. Per-vertex ambient occlusion | `app.js` `aoBake`, `aoBakeAsset`, `enableShadows`, the road strips | Baked into vertex colours at build time, darkest 0.75, no screen-space pass. `lit()` reads vertex colours, and three.js draws a vertex-colour material over a geometry with no colour attribute black (no default outside ShaderMaterial), so the first-frame pass bakes the height rule into any such geometry it finds (CJ, 2026-09-23: 「the character all black」, the girl; `__fog.shadow.uncoloured` must read 0). Engine geometries: bottom ring 0.75, top 1, any down-facing face 0.75 (eaves, canopies, the skywalk deck); instanced sets get the height rule. The road is eight strips so its outer 2.5 units darken toward the kerbs. Library items: height above the base over 1.2 units, and again under any box of the same item hanging over within 1.5 units. | `step4-*.png` |

Cost: fps unchanged at the display cap (100.5–100.6 at 0.2 / 0.44 / 0.78 / 0.9, was 100.8). Load is heavier: warm-up 331 ms for 30 programs (was 50 ms for 16). Not measured on a phone.

## Open items

1. ~~Issue #3, surface texture pass~~ — done above, on `issue-3-texture`, not pushed; CJ decides the push.
2. **Ship kit** (not filed yet; proposed as #4): README first line carries the Pages link (the current link still points at the old repo name and 404s); a `submission/` folder with a one-paragraph pitch, five screenshots (one per chapter, the 101 base, the climb) and a 60-second scroll recording.
3. **Waiting on CJ, from the rubric:** gate the 1980s / 1990s / 2000s Ximending sets by scroll year (about an hour in `scene-red.js`, thins the 1985 street) or keep all three on for density. A 1989 frame currently shows a NOKIA sign.
4. **Waiting on CJ:** Blender. Modelling hero buildings (Red House, temple, 101) in Blender and loading GLB files breaks the no-model-files and double-click rules and needs a served page plus a loader. Everything in #3 carries over if that comes; decided after Build Day unless CJ says otherwise.
5. ~~Second rubric scoring after #3~~ — done, `RUBRIC.md` scoring 2 (2026-09-23): ch02 story beat 2 → 3 and ch03 density 2 → 3 on the flash and the particles; Palette and light stays 4 in every chapter with the same named weak spots. The comment draft is `~/Desktop/issue3-texture/rubric-2-comment.md`; the lead posts it after CJ says.
6. The base-shot keyframe (CAM[4] in `data.js`, camera y 3 at z -372 looking at y 50) puts the 101 podium below the frame. Lower the target (y 40) or move the camera back (z -380) if the podium should show.
7. The wharf is only seen peripherally. A keyframe that glances west at z ≈ -200 would show it.
8. Mobile: 390x844 checked 2026-09-21 in headless Chrome. Not yet checked on a real phone: the touch fallback and the 1.5 pixel-ratio cap.
9. `research/` (untracked on main as of 2026-09-22): the three.js survey, the IVRESS teardown and the 15 render-style test pages with shots. `research/README.md` indexes it and links the two shareable artifacts. Commit it or leave it local; nothing on the page loads from it.

## Not done on purpose

- No sound, no free camera, no menu, no save state, no framework, no CDN.
- No bloom. No fog. No traffic.
- 二二八 (1947, 天馬茶房) deliberately left out of the story, per the original brief.
