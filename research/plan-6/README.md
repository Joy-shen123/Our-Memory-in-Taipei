# Plan 6 research — sky, font, light and shadow, the climb, polish, closing words

Research pass for issue #8. Written 2026-09-24, against `main` at the commit that merged PR #14 (issue #5, models). No file outside `research/plan-6/` was touched. Every "what the page does today" claim below was checked by reading the named file and line, or by rendering the live page and screenshotting it (`research/plan-6/shots-src/` holds the test pages; `research/plan-6/shots/` holds the pictures; method for both in `HANDOFF.md`'s "How to test").

Two things turned up while reading the code that are not one of issue #8's six items, but sit underneath two of them and are worth fixing regardless of which option CJ picks:

- **The sky already has an unauthorised night creep.** `app.js`'s `ERA_MIX.tower.night = 0.45` tweens the sky, the mountains and a moon toward dusk by the last chapter — CJ ruled this out on 2026-09-20 ("CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY … no fog, no night, no bloom") and it is in the code anyway. See the Sky section.
- **The issue #5 models never cast or receive the shadow map.** `app.js`'s `enableShadows()` only touches `MeshStandardMaterial`; `models.js`'s `MODELS.lambertize()` converts every loaded glb to `MeshLambertMaterial`. Since PR #14, the Red House, the 101, the temple, 永樂市場, 樂聲戲院, every Dihua bay, every stall and shopfront, the lamps, the girl and the climbing man are Lambert — none of them appear in `enableShadows()`'s `scene.traverse` at all. They cast no shadow and receive none, even though `HANDOFF.md`'s issue #3 writeup says "every lit, opaque mesh casts and receives." See Light and shadow.

## 1. Sky

**What the page does today.** Two independent systems, both real, easy to confuse (`app.js:200-227` and `app.js:318-345`):

1. A small (512×256) canvas gradient + sun disc, PMREM'd once at load into `scene.environment` (`skyEnv`, `app.js:205-227`). This lights every Standard-material surface's reflections and ambient term. It is never drawn on screen — the issue text's "the canvas sky from #3 … is never shown" is this one, and it is still true.
2. A large sphere (radius 520, `BackSide`) with its own two-stop vertical-gradient shader (`skyMat`, `app.js:319-327`), plus 26 instanced cone "mountains" (`app.js:332-345`) and a moon that fades in. This one *is* shown — it is the actual background, tweened every era by `updateWorld()` (`app.js:840-849`). The issue's "one flat colour behind procedural mountains" undersells it: it is a two-tone gradient, and it already moves — `night` climbs from 0 at the opening to 0.45 by the tower chapter, pulling the dome toward ink, the mountains toward ink, and fading a moon in past `night > 0.3`.

`shots/sky-today-early-ximen.png` and `shots/sky-today-late-ximen.png` show this on our own street (the render-styles asset-library rig, not the live page's 101 — see the note at the end of this section): identical bright blue dome at the opening, visibly duskier grey-blue by the point the code reaches `night = 0.45`. `shots/bruno-cycle.jpg` and `shots/tw80-cycle.jpg` in `research/render-styles/shots/` already show what a *deliberate* four-preset day cycle looks like (`research/bruno-simon/README.md` §6b) — do not redo that render, it exists.

**Options**

| Option | What it costs | Risk |
|---|---|---|
| Show the drawn env-map sky directly (`scene.background = skyEnv`) | Free — the texture already exists | Worse, not better. `shots/sky-shown-ximen.png`: flatter, no mountains (nothing else reads the canvas texture as geometry), and the sun disc is barely visible from a street-level camera. It was drawn to be sampled for reflections at grazing angles, not to fill the frame. |
| Keep the gradient dome + mountains, pin `night` at 0 always (the bug fix) | Near-free — delete the `night` term from three colour lerps and the moon's opacity line | None. `shots/sky-bright-early-ximen.png` and `shots/sky-bright-late-ximen.png` are pixel-identical, which is the point: the sky stops drifting toward dusk no matter how far you scroll. |
| Sky per chapter, bright (bruno 6b adapted, no true night) | Small — the tween machinery already exists (`ERA_MIX`, `updateWorld`); replace the `night` axis with a per-era accent tint, e.g. horizon nudged toward each chapter's `palette.accent` (`data.js`: verm / lamp / verm) instead of toward ink | Low. Needs a design pass so the three moods stay "bright and pretty" — a five-minute mistake here is CJ's rule getting broken a second way after the first was found by accident. |
| A painted sky dome | Unknown — depends entirely on the reference | `(unknown — needs CJ)`: HANDOFF's open items already flag this ("a painted sky dome (needs a reference picture from CJ)"). Nobody should scope this until a reference exists. |

**Recommendation.** Fix the night creep first (it is currently shipping a rule violation), then move to the per-chapter bright tint — it reuses the exact machinery that is already wrongly wired to `night`, so it is barely more work than the fix alone, and it is the one option that actually answers the issue's "sky per chapter keyed to the scroll year." Do not show the raw env-map. The painted dome is `(unknown — needs CJ: send a reference image)`.

*Rendering note:* these five shots are on the render-styles rig (`research/render-styles/print.html`'s ximen/dadao asset-library street), the same one `research/render-styles/README.md` used, because it is the only "our own street" that does not require touching `app.js`. It has no 101 and no era system, so the `night` values above (0 and 0.45) are the literal numbers `ERA_MIX` uses for the opening and the tower chapter, applied by hand to the same shader — the colours are exact, the street around them is Ximending standing in for all three chapters.

## 2. Font

**What the page does today.** `style.css:11`: the system sans stack (`-apple-system, "PingFang TC", "Noto Sans TC", "Helvetica Neue", Helvetica, Arial, sans-serif`) for everything — the big words, the HUD chapter column, the closing line, the Chinese secondary names. No web font, `asset/fonts/` does not exist yet.

**What the site actually needs, character for character.** Every Chinese string that reaches the DOM (not the canvas-drawn shop signs, which are their own texture and need no web font) is in `data.js`'s `zh:` fields and hero `name.zh` fields — 18 unique hanzi, plus a middle dot: 化北台城埕大廟樓海町稻紅街西迪門隍霞. That number matters below.

**Three pairings, self-hosted, OFL 1.1, `display: block`** (bruno-simon's own choice, `research/bruno-simon/README.md` §5 — invisible until the font is ready, not a flash of the fallback):

| Pairing | Big words | HUD / labels / closing | Chinese secondary name | Total |
|---|---|---|---|---|
| 1. Bruno-direct | Amatic SC 700 | Nunito 400/700/900 | Noto Sans TC | 64.5 KB |
| 2. Warm serif | Fraunces 600/800 (variable) | Work Sans 400/600/800 | Noto Serif TC | 125.3 KB |
| 3. Rounded street | Baloo 2 600/800 (variable) | Inter 400/600/800 (variable) | Chiron GoRound TC | 92.8 KB |

`shots/fonts-compare.png` renders all three, plus today's system sans, across the four roles that matter: the big word ("Our Memory in Taipei"), the HUD chapter column (02/03 · SPRING FESTIVAL · 2000–2019 · 大稻埕 · Dadaocheng, vertical), and the closing line, at the actual clamp()'d sizes from `style.css`.

**The Chinese-font number is the one worth double-checking.** Google serves Traditional Chinese split into ~13-34 codepoint-range files even for a handful of characters — downloading "the blocks that happen to contain your 18 hanzi" the naive way costs 0.8–3.7 MB per family (measured, not estimated). The 8.2–13.2 KB numbers in the table above are a true exact-glyph subset: Google Fonts' `css2?...&text=<your string>` endpoint (or `pyftsubset --text=` offline, same result, no network needed at ship time) builds a font containing only the glyphs actually used. That is the only sane way to self-host a CJK face under this page's no-network rule — worth writing into whatever issue implements this, because the difference is two orders of magnitude and it is easy to grab the wrong number by just downloading "the Chinese subset" Google's CSS points at.

**Recommendation.** Pairing 1 (Amatic SC + Nunito + Noto Sans TC) is the cheapest, closest to the bruno-simon precedent CJ already asked to be researched, and its hand-written big-word feel matches "our memory" better than a straight sans. Its risk: Amatic SC is a single weight, all caps at small sizes reads a little twee, and it has no bold — worth checking against the actual "Our Memory in Taipei" wordmark full-size before committing. Pairing 2 (Fraunces + Work Sans + Noto Serif TC) is the safer literary choice if Amatic SC reads too playful next to "we only know we need to climb higher" — a warm serif carries that line's weight better. Pairing 3 is the weakest fit: Baloo 2's roundness fights the site's straight-edged, palette-flat buildings. `(unknown — needs CJ)`: final pick between 1 and 2, ideally judged against the real wordmark, not this mockup's smaller sample.

## 3. Light and shadow

**What the page does today**, in the order issue #3 built it (`HANDOFF.md`'s surface-texture-pass table, `app.js:150-198`): ACES tone mapping on luminance only, hemisphere + one directional sun (`KEY = 1.3`, tweened per era by `ERA_MIX.lamp`), the canvas-sky environment map for reflections, a 2048/1024px PCF soft shadow map that re-centres on the scroll camera every frame, and per-vertex baked occlusion for procedural geometry (`aoBake`).

**Two things are not what `HANDOFF.md` says they are, both found reading `enableShadows()` (`app.js:189-198`) against `models.js:34-38`:**

- The shadow map does not reach any issue #5 model. `enableShadows()` gates on `m.isMeshStandardMaterial`; `MODELS.lambertize()` hands every loaded glb a plain `MeshLambertMaterial`. The Red House, the 101, 永樂市場, 樂聲戲院, every Dihua bay and stall and shopfront, the lamps, the girl, the climbing man — none of them cast or receive the sun's shadow. This is a regression against issue #3's own "every lit, opaque mesh casts and receives," introduced silently by issue #5, and it is invisible in a quick look because the models still shade correctly under the hemisphere/sun lighting — they just never show a cast shadow or sit in one.
- Because those same meshes have no `color` vertex attribute and are not `vertexColors: true` materials, `aoBake` never runs on them either (the same gate that skips shadow-enabling also skips the AO-bake fallback). So the issue's "baked occlusion from Blender for the #5 models" is not merely undone — it is currently impossible for the engine to add on its own; it has to come from `asset/blender/stylized.py` at export time, or the models need to go back through `lit()`/Standard materials so the engine's existing machinery can reach them.

**The three options from the issue, plus the fix above**

| Option | Cost | fps risk | Note |
|---|---|---|---|
| Fix: make the #5 models cast/receive shadow again | Small — either widen `enableShadows()`'s gate to include Lambert, or stop downgrading hero buildings to Lambert in `lambertize()` and keep them Standard (heavier per-material but correct) | None measured yet; shadow map cost is already paid, this only adds receivers/casters to an existing pass | Not one of the issue's three options, but every one of them is judged by eye against a scene that currently has no shadows on its own buildings. Fix this before anything else in this section is scored. |
| Coloured shadow tint (bruno-style, purple/magenta instead of grey) | Near-free — `research/bruno-simon/README.md` §4/§8: "you can approximate it in r149 by tinting your ambient/hemisphere light purple rather than grey, which would cost you one line" | None | Bruno's own reasoning: "a coloured shadow instead of a dark one … is why the site looks like an illustration." Works with any of the sky options above; does not need the day-cycle machinery, just the hemisphere's ground colour. |
| A day cycle | Whatever the sky per-chapter work above costs, plus keeping light intensity in sync | Low, it is a few more uniform writes per frame | **Do not build a true day cycle.** CJ ruled out night explicitly. The per-chapter *bright* tint recommended in Sky is the compatible version of this idea; a real day/night cycle is the same mistake as the night-creep bug, done on purpose. |
| Baked occlusion from Blender for the #5 models | Moderate — touches `asset/blender/stylized.py` (the shared bevel/material/export pipeline) and re-exports all 13 model scripts | None (baked at build time, free at runtime) | Biggest visual return at close range (the Red House's brick reveals, the 101's segment overhangs) but the largest of the four to schedule — one shared pipeline change, then 13 re-exports and 13 size/fps re-checks. |

**Recommendation, in order:** fix the shadow gap (it's a bug, not a feature — do it regardless of anything else picked here), then the coloured shadow tint (one line, matches "bright and pretty" better than grey ever did), then baked AO on the models when there's a day free for it. No day cycle.

## 4. The climb

**What the page does today** (`app.js:296-316`, `scene-tower.js:77-106`). `TOWER.h = CROWN_Y1 = 106` — the top of the tapering crown, floor ~101, before the mechanical box, mast and spire. `SPIRE_TOP = 129` (crown + mech 3 + mast 2 + spire 18) is never referenced by anything the engine climbs to. The man's height is `climb = 6 + f^1.4 * (TOWER.h - 20)`, so at `f = 1` (scroll fraction 1.0) he reaches **y = 92** — 14 units short of the crown (106), 37 short of the spire tip (129). `shots/closing-A-replaces.png` (a real screenshot of the live page at fraction 0.97, `TOWER.faceX` puts him on the west face around the fifth of eight segments) shows exactly this: he is climbing, visibly not near the top.

The camera's last keyframe (`CAM[5]`, `data.js:125`) looks at `y: 86` from `y: 70`, which roughly tracks the man's height at `f≈1` today — so the frame already reads as "looking at him," it just isn't looking at him near the crown.

**Options**

| Option | Cost | Risk |
|---|---|---|
| Raise the climb ceiling to `TOWER.h` (106, the crown) | Tiny — change `20` to a smaller offset or rescale the exponent so `f=1 → climb=106` | None geometrically; `TOWER.faceX(106)` is defined (it's inside the crown segment, `hw` computed from `CROWN_HB`/`CROWN_HT`) |
| Raise it past the crown into the mechanical/mast/spire (up to 129) | Tiny, same formula | The spire is a thin mast, not a walkable surface reference-wise — Taipei 101's real spire has no external walkway. Climbing "into" it reads wrong against the "REFERENCE REAL BUILDING" rule (`HANDOFF.md`, CJ 2026-09-20) |
| Camera follows past the crown | Tiny — move `CAM[5].t` from `y: 86` toward `y: 100–105` | None; it's one keyframe number, already fov-ramping via the IVRESS borrow |

**Recommendation.** End the climb at the crown (`y = 106`), not the spire — it is the real building's own top of occupiable structure, it is where the engine already places the aircraft-warning lights (`scene-tower.js:329`, "aircraft-warning lights on the spire top and crown corners"), and it keeps the man on a surface `TOWER.faceX` actually models as a wall rather than inside the mast. Raise `CAM[5]`'s look-target to sit closer to that height so the final frame reads as "arrived," not "still climbing." This is a two-number change (the climb formula's ceiling, one camera keyframe field) — no new geometry, no fps cost, should be one of the cheapest items on the whole list to execute once picked.

## 5. Polish

**What "polish" means right now is stale.** The rubric was last scored (`docs/RUBRIC.md`, "Scoring 2") on 2026-09-23 at the issue #3 commit — before issue #5 put real models in. Recognition, period, composition and density and life can all have moved since (the Red House and 101 are no longer boxes-with-labels; the girl no longer has a primitive body). **Recommend re-running the rubric on current `main` before picking anything below** — otherwise the picks are being made against a scene that no longer exists.

**Scoring 2's three lowest, carried forward until that re-score happens:**

1. Chapter 01 period (3) — `(unknown — needs CJ)`, unchanged since Scoring 1: gate the 1980s/1990s/2000s Ximending asset sets by scroll year, or keep all three visible for density. `docs/RUBRIC.md` "Scoring 1 — evidence": a 1989 frame shows a NOKIA · Sony Ericsson sign (a 2001 brand) because all three decades are switched on for the whole chapter.
2. Chapter 01 composition (3) — agent fix, cheap: the 中華商場 rooftop sign slab at fraction 0.02 fills the top third of the frame and sits under the title; move it back from the road edge in `scene-red.js` (camera stays).
3. Chapter 02 density and life (3) — agent fix, cheap: fraction 0.58 (still chapter 2, year 2020) is an empty road with trees and grey boxes; needs dressing in `scene-dadao.js`.

**What issue #5 honestly dropped**, from `HANDOFF.md`'s Models section, ranked by how often the viewer sees it (not by build effort):

| Gap | Seen | Priority reasoning |
|---|---|---|
| Dihua bays are all two floors (the `floors: 3` / `tall:` options are ignored) | Every frame of chapter 2, 24 instanced bays | Highest — it's the whole street, every time |
| The girl's bowl cut has seams (cap, back block, side flaps, fringe) | Every frame, every chapter — she runs in all three | Highest — closest, most-looked-at object on the page |
| 101 has no lit-window emissive grid (geometry mullions instead) | Chapter 3 only | Low right now — CJ's daylight rule makes lit windows a mixed signal anyway (RUBRIC scoring 2 already flags this as chapter 3's one off-note); fix this *if* a day-cycle-adjacent option ever ships, not before |
| Lux has two poster cases, not six | Ximending only, one building | Low — small and local |
| Temple has no carved relief / ridge dragons | Dadaocheng only, one building, and mostly seen only via its label (no keyframe frames it, per `HANDOFF.md`) | Low |
| Tree canopy faintly polygonal up close | Every street, but only noticeable close to camera path, which street trees rarely are | Low |

**Recommendation.** Re-score first. Of Scoring 2's three lowest, #1 is `(unknown — needs CJ)`; #2 and #3 are cheap agent fixes, do them regardless of the re-score's outcome since they're near-certainly still true. Of the honest-gap list, Dihua's floor count and the girl's hair seams are the two with real per-frame visibility; everything else is a smaller, more local fix that can wait.

## 6. Closing words

**What the page does today.** `data.js:54-57`: `CLOSING.line = 'Where we go, we don't know. We only know we need to climb higher.'`, fading in from `showFrom: 0.9` — the last 10% of scroll, the same window the man is visible in (`style.css:164-175`, `.hud-closing`, top 24vh, left-aligned, same column as the chapter block).

CJ wants "Just like the man on Taipei 101" (issue #8, quoting his 2026-09-23 message) added to that beat. Two ways to do it, shown as frames, not prose, both composited over a real screenshot of the live page at fraction 0.97 (`shots-src/closing-bg.png`) so the type sits at true size against the true background — this is a mockup of layout and tone, not a code change to `data.js`:

- **`shots/closing-A-replaces.png`** — the new line replaces the old one outright.
- **`shots/closing-B-follows.png`** — the old line stays, the new one follows as a second beat underneath.

**Recommendation.** A: replace, not follow. The current line ends on uncertainty ("we don't know … "); the new line is a resolved simile answering it. Stacking them (B) puts a confident answer directly under an unresolved question with no room to breathe — the whole reveal window is 10% of scroll, which is not enough runway for "two beats" to read as two beats rather than one crowded paragraph, and `closing-B-follows.png` shows exactly that crowding even with generous spacing. If CJ wants both ideas on screen, the honest way to do it is to widen `CLOSING.showFrom` so the old line gets its own dwell time before the new one arrives, not to print both at once — that's a bigger change than this issue's scope and its own decision. **`(unknown — needs CJ)`: A vs. B is explicitly his call per the issue text — these two frames are for him to pick from, not a recommendation to execute blind.**

## Recommended order across the six

1. **Light and shadow** — fix the shadow gap first (it's a live bug), then the coloured tint. Cheapest, and every other visual judgement in this list (polish, the climb's final frame, even the sky's mood) is made by eye against whatever lighting is on screen, so getting it right first means not re-judging everything twice.
2. **Sky** — fix the night-creep bug, then the per-chapter bright tint. Also cheap, also currently violating a stated rule, and it reuses the exact era-tween machinery the light section touches.
3. **The climb** — two numbers, fully isolated from everything else, no reason to wait.
4. **Closing words** — needs CJ's A/B pick first; once picked, the `data.js` change is trivial.
5. **Font** — self-contained, cosmetic, no dependency on the other five; needs CJ's pairing pick.
6. **Polish** — needs a fresh rubric score (itself needs nothing from 1-5, but its results should be read against whatever lighting/sky are current by the time it's scored, so scoring it last against the final look avoids a third re-score).

**Do these two first: light and shadow, then sky.** Both are the cheapest items on the list, both are fixing something that is already wrong (not adding something new), and both sit underneath every other decision — polish gets scored by eye, the climb's final frame gets judged by eye, even the font pairing gets picked by eye, and eye judgements made under the wrong lighting or an accidentally-dusky sky are judgements that have to be redone.

## Everything marked `(unknown — needs CJ)`

- Sky: the painted sky dome option — needs a reference image before it can be scoped at all.
- Font: pairing 1 vs. pairing 2 (Bruno-direct vs. warm serif) — recommendation given, final call is a taste call against the real wordmark.
- Polish: gate the Ximending 1980s/1990s/2000s asset sets by scroll year, or keep all three on — unchanged from Scoring 1, still open.
- Closing words: replace the current line (A) or follow it as a second beat (B) — recommendation given (A), issue #8 names this explicitly as CJ's call.
