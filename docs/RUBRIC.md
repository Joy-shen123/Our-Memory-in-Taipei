# RUBRIC — does this chapter look good and feel like Taipei?

Seven criteria, each scored 1–5 per chapter. A chapter ships at 4+ on every line. Scored from screenshots and a headed fps run, never from memory; every score carries one line of evidence naming the scroll fraction it was seen at. A 2 with evidence beats a 4 without. Source: GitHub issue #1, Part 3.

## The scale

| Criterion | 1 | 5 |
|---|---|---|
| Recognition | boxes with labels | a Taipei person names the place without reading |
| Period | could be any decade | one glance tells the decade (signs, vehicles, props from the `asset/*.md` lists) |
| Composition | camera arrives at a frame | each keyframe is a composed shot with a foreground, subject, background |
| Density and life | empty street | people, goods, signs at every scroll fraction, none blocking the camera |
| Palette and light | mixed, muddy | bright, consistent, the chapter's own mix of the site palette |
| Story beat | nothing changes | crossing the chapter boundary visibly changes the world in one scroll |
| Performance | under 50 fps | 60 fps on a laptop, console empty |

Reading the middle: 3 = the thing is there but a fraction of the chapter fails it; 4 = holds at every fraction with one named weak spot; 2 = fails at most fractions.

## How to score

1. Headless screenshots at 1440x900 with the recipe in `HANDOFF.md`, at least four fractions per chapter: red 0.02, 0.10, 0.20, 0.30; dadao 0.36, 0.44, 0.52, 0.58; tower 0.66, 0.78, 0.90, 0.97.
2. Fps headed and alone (a second headed window throttles the first), 2 s of `requestAnimationFrame` at 0.2, 0.44, 0.78, then `agent-browser console`.
3. Story beat is scored on the boundary the chapter is entered through: the opening for chapter 1, the `2000` road marking for chapter 2, the `2020` marking for chapter 3.
4. Write the score and one line of evidence per cell. Ties in the lowest three break toward the item whose fix changes the most frames.

## Scoring 1 — 2026-09-21, branch `issue-1-part-1` at 2b99a17 (after Parts 1 and 2)

| Chapter | Recognition | Period | Composition | Density and life | Palette and light | Story beat | Performance |
|---|---|---|---|---|---|---|---|
| 01 When We Were Young (Ximending) | 4 | 3 | 3 | 3 | 4 | 3 | 5 |
| 02 Spring Festival (Dadaocheng) | 4 | 3 | 3 | 3 | 4 | 2 | 5 |
| 03 The Future (Xinyi) | 4 | 3 | 4 | 2 | 4 | 4 | 5 |

### 01 When We Were Young — evidence

- Recognition 4: at 0.20 the Red House octagon, the vertical 樂聲戲院 sign and the 西門町 gate are all in one frame and readable without the label; at 0.30 the right side is plain grey window-grid blocks that could be any city.
- Period 3: 小虎隊 and 佳佳唱片 say late 80s at 0.10, but the same frame in 1989 shows a NOKIA · Sony Ericsson sign (2001 brand) because all three Ximending asset decades are switched on for the whole chapter; one glance says "Taiwan, 80s to 2000s", not which decade.
- Composition 3: 0.20 is a composed shot (樂聲 sign foreground, Red House subject, gate background); at 0.02 the 中華商場 rooftop sign slab fills the top third of the frame as the camera passes under it and the title sits on it.
- Density and life 3: signs and stalls at every fraction, but the crowd is dark-headed boxes with no goods in hand, and the 0.02 slab counts as blocking the camera.
- Palette and light 4: bone, vermilion and lamp on a blue sky at every fraction, no muddy frame; the yellow-green 淘兒 front at 0.20 is the only off-palette block.
- Story beat 3: the opening descends from y 7 to street level while the first two words surface, so something moves, but nothing in the world changes as you enter the chapter.
- Performance 5: 100.9 fps headed at 0.20 (display cap), 1269 meshes + 59 instanced sets, console empty.

### 02 Spring Festival — evidence

- Recognition 4: at 0.36 the arcade columns, the pilastered bays, the 巴洛克 crests and the 年貨大街 banner read as Dihua Street; 霞海城隍廟 is west of the road and no keyframe frames it, so the temple is known only from its label.
- Period 3: lanterns and 年貨大街 say Lunar New Year since 1996, but the 三輪車 and blue 小貨車 at 0.36 are 1980s props in a 2001 frame, and nothing in 2010–2019 differs from 2001.
- Composition 3: 0.44 has stalls in the foreground, the shophouse rows and lantern strings above; at 0.44 the 霞海城隍廟 label sits on top of the "Spring Festival." word, and at 0.52 the nearest lantern string covers the top quarter of the frame.
- Density and life 3: 30 stalls, banners and crowd at 0.44, but the goods on the tables are white boxes, and 0.58 (still this chapter, year 2020) is an empty road with trees and grey boxes.
- Palette and light 4: brick, bone, vermilion and lamp, consistent at every fraction; the Xinyi generic lots at 0.58 are grey against green ground, the chapter's one dull frame.
- Story beat 2: the Dadaocheng library items are visible in the red era too (deliberately, so nothing pops), so crossing the 2000 marking changes only the trees, lamp density and road texture; a viewer does not see the world change.
- Performance 5: 100.9 fps headed at 0.44, console empty.

### 03 The Future — evidence

- Recognition 4: the 101 profile (pedestal, coins, eight flared segments, spire) is named on sight at 0.66, 0.78 and 0.90; every other tower in the frame is a generic lit box, and the City Hall outline is not in any of the four frames.
- Period 3: lit curtain walls and the skywalk say 2010s or later; nothing separates 2020 from 2039 (no YouBike, no LED walls with content, no MRT).
- Composition 4: 0.66 (flanking towers, 101 centred, XINYI sign) and 0.97 (man near the crown, closing line left, mountains behind) are composed shots; at 0.78 the near office blocks warp under the 62° fov and the podium is below the frame.
- Density and life 2: 0.90 and 0.97 are the tower and sky; at 0.66 and 0.78 the road has only the girl, the sidewalk crowd is too small to read, and there are no goods or people on the plaza.
- Palette and light 4: glass green, bone and lamp windows, bright and consistent; lit windows in daylight are the one mixed signal.
- Story beat 4: crossing the 2020 marking the tower grows from the ground over 500 ms, the skyline rises and the windows light; the 0.58 to 0.66 stretch before it is empty road.
- Performance 5: 100.8 fps headed at 0.78, console empty.

### The three lowest, and who takes each

1. Chapter 02 story beat (2) — agent. A chapter-cut flash at the 2000 and 2020 markings (IVRESS borrow list, item a) makes the boundary visible without switching the Dadaocheng items to dadao-only.
2. Chapter 03 density and life (2) — agent. A light stream up the tower and more crowd on the 101 plaza and the A11 entrance; particles are borrow item g.
3. Chapter 01 period (3) — CJ decision. Should the 1980s, 1990s and 2000s Ximending asset sets appear by scroll year (1986 has no Nokia sign, 1998 has the internet café) or stay all on as now? Gating by year is an hour of work in `scene-red.js`; it also thins the street at 1985, which pulls against "density and life".

## Scoring 2 — 2026-09-23, branch `issue-3-texture` at 86e1e8f (after issue #3, the surface texture pass)

Twelve fresh headless screenshots at 1440x900 in `~/Desktop/issue3-texture/rubric-2/` (same twelve fractions as scoring 1, plus `cut-0.347.png` and `cut-0.582.png` taken 45 frames after landing on each boundary, for the story beat). Fps headed and alone, 2 s of `requestAnimationFrame`, in `~/Desktop/issue3-texture/fps.txt`. Issue #3 changed surfaces and light only, so recognition, period, composition and density move only where the IVRESS borrows (the chapter-cut flash and the particles, added after scoring 1 and never re-scored) moved them.

| Chapter | Recognition | Period | Composition | Density and life | Palette and light | Story beat | Performance |
|---|---|---|---|---|---|---|---|
| 01 When We Were Young (Ximending) | 4 | 3 | 3 | 3 | 4 | 3 | 5 |
| 02 Spring Festival (Dadaocheng) | 4 | 3 | 3 | 3 | 4 | 3 | 5 |
| 03 The Future (Xinyi) | 4 | 3 | 4 | 3 | 4 | 4 | 5 |

### 01 When We Were Young — evidence

- Recognition 4: at 0.20 the Red House octagon, the vertical 樂聲戲院 sign and the 西門町 gate read without the label, and the octagon's brick now sits under a real sun with its forecourt in shade; at 0.30 the right side is still plain window-grid blocks, plaster-textured now but no more Taipei than before.
- Period 3: unchanged. 0.10 shows 小虎隊 and a NOKIA · Sony Ericsson sign in the same 1989 frame (CJ decision, `HANDOFF.md` open item 3).
- Composition 3: 0.20 is the composed shot (樂聲 sign, Red House, gate); at 0.02 the 中華商場 rooftop sign slab still fills the top third and the title sits on it.
- Density and life 3: unchanged. Signs and stalls at every fraction, the crowd is dark-headed boxes, and the 0.02 slab still counts as blocking the camera.
- Palette and light 4: bone, vermilion and lamp on a blue sky at every fraction. From this pass the walls take the sun: the west row's shadow lies across the road at 0.10, the 中華商場 arcade darkens inside at 0.02, the plaster reads as plaster at 0.30. Nothing clips to white any more (3.3% of the 0.05 frame did; now 0) and saturation is held at the step 0 level (0.144 → 0.136). The yellow-green 淘兒 front at 0.20 is still the one off-palette block, so 4 not 5.
- Story beat 3: unchanged. The opening descends from y 7 while the first words surface; nothing in the world changes on entering.
- Performance 5: 100.6 fps headed at 0.2 with the shadow map on, 1333 meshes, console empty.

### 02 Spring Festival — evidence

- Recognition 4: at 0.36 the arcade columns are brick courses, the bays' pilasters plaster, the 巴洛克 crests and the 年貨大街 banner read as Dihua Street; the temple is still known only from its label, no keyframe frames it.
- Period 3: unchanged. The 三輪車 and blue 小貨車 at 0.36 in a 2001 frame; nothing in 2010–2019 differs from 2001.
- Composition 3: 0.44 has stalls in the foreground under the lantern strings and the shophouse rows above; the "Dihua Street" label now sits top right, clear of the word; at 0.52 the nearest lantern string still covers the top quarter of the frame.
- Density and life 3: 30 stalls, banners and crowd at 0.44; the goods are white boxes; 0.58 (still this chapter, year 2020) is an empty road with trees and grey boxes.
- Palette and light 4: brick, bone, vermilion and lamp, consistent at every fraction. The east row's arcade sits in the sun's shadow at 0.36 and 0.44 while the west row is lit, the first time the two sides of the street differ, and the bricks are visible on the columns without shouting. 0.58 is the chapter's one dull frame: hazy, grey boxes on green.
- Story beat 3 (was 2): crossing the 2000 marking fires the white chapter-cut flash (`cut-0.347.png`: the 年貨大街 archway and the 2000 digits under it) and the trees, lamps and road texture change in the same scroll; the Dadaocheng items were already on in the red era, so the street itself does not transform.
- Performance 5: 100.6 fps headed at 0.44, console empty.

### 03 The Future — evidence

- Recognition 4: the 101 profile is named on sight at 0.66, 0.78 and 0.90, and its glass now carries the sky and a sun highlight up the west face at 0.78; every other tower is a generic lit box and City Hall is still in none of the four frames.
- Period 3: unchanged. Lit curtain walls and the skywalk say 2010s or later; nothing separates 2020 from 2039.
- Composition 4: 0.66 (flanking towers, 101 centred, XINYI sign) and 0.97 (man near the crown, closing line left) are composed; at 0.78 the near blocks warp under the 62° fov and the podium is below the frame.
- Density and life 3 (was 2): the light stream spirals up the tower at 0.90 and 0.97, and at 0.78 the office towers throw shadows on one another, which reads as a city; at 0.66 the road still has only the girl and the plaza has no people.
- Palette and light 4: glass green, bone and lamp windows, bright and consistent; the office walls are concrete with a faint grain and darker bases at 0.78. Lit windows in daylight remain the one mixed signal.
- Story beat 4: the 2020 marking fires the gold flash (`cut-0.582.png`) and the tower grows from the ground; the 0.58 to 0.66 stretch before it is empty road.
- Performance 5: 100.5 fps headed at 0.78, 100.6 at 0.9 with the light stream on, console empty.

### What issue #3 moved, and the three lowest now

The pass shows up under Palette and light in every chapter (sun, shade, materials, no clipping) without lifting any of those cells to 5, because each chapter's named weak spot on that line is a colour or a frame, not a surface. The two cells that rose, ch02 story beat and ch03 density, rose on the flash and the particles from the issue #1 Part 3 session, scored here for the first time.

1. Chapter 01 period (3) — CJ decision, unchanged from scoring 1: gate the Ximending sets by scroll year or keep all three on.
2. Chapter 01 composition (3) — agent, in `scene-red.js`: the 中華商場 rooftop slab at 0.02 is the first frame everyone sees; moving the slab back from the road edge (not the camera, `CAM` stays) clears the title.
3. Chapter 02 density and life (3) — agent, in `scene-dadao.js`: dress the 2020 stretch at 0.58 (the last frame of the chapter) so the chapter does not end on an empty road.

## Scoring 3 — 2026-09-24, branch `issue-15-detail` at step 7 (after issue #15, the model detail pass)

Fourteen fresh headless screenshots at 1440x900 in `~/Desktop/issue15-detail/rubric-3/` (the twelve fractions above, plus `cut-0.347.png` and `cut-0.582.png` taken 45 frames after landing on each boundary). Fps headed and alone, 2.5 s of `requestAnimationFrame`, at 0.2 / 0.44 / 0.78. Issue #15 changed six models and the Dihua bay instancing and nothing else: no light, no copy, no camera, no placement except the per-bay floor count.

**This machine's display caps at 60 Hz, not the 100 Hz the first two scorings were measured on.** 60.4 fps is the cap here; a baseline run with the pre-#15 models on the same machine, same recipe, measured 60.4 / 60.4 / 60.4 as well. Read the number against the cap, not against 100.

| Chapter | Recognition | Period | Composition | Density and life | Palette and light | Story beat | Performance |
|---|---|---|---|---|---|---|---|
| 01 When We Were Young (Ximending) | 4 | 3 | 3 | 3 | 4 | 3 | 5 |
| 02 Spring Festival (Dadaocheng) | 4 | 3 | 3 | 3 | 4 | 3 | 5 |
| 03 The Future (Xinyi) | 4 | 3 | 4 | 3 | 4 | 4 | 5 |

**No cell moved.** That is the honest result and it is worth saying plainly: the pass put a great deal more building on the screen and none of it crossed a threshold, because every cell that was already 4 is held there by its named weak spot, and none of those weak spots is a model. Recognition is held by the plain window-grid blocks at 0.30, by the temple that no keyframe frames, and by the generic lit boxes around the 101 — a street-furniture problem, a camera problem and a scene problem. Density is held by people and goods. Period is a CJ decision. The evidence inside the cells is much stronger than it was; the scores are the same.

### 01 When We Were Young — evidence

- Recognition 4: at 0.20 the Red House octagon now shows real fanlights in its eight arches, a banded string course over a corbel row, a dentil row under the cornice and a louvred lantern on the roof, and it is nameable without the label; at 0.30 the right side is still plain window-grid blocks that could be any city.
- Period 3: unchanged, and a CJ decision. 0.10 still shows 小虎隊 and a NOKIA · Sony Ericsson sign in the same 1989 frame.
- Composition 3: 0.20 is the composed shot (樂聲 neon cage foreground, Red House subject, 西門町 gate background); at 0.02 the 中華商場 rooftop sign slab still fills the top third and the title sits on it.
- Density and life 3: unchanged. The crowd is dark-headed boxes; the 0.02 slab still blocks the camera.
- Palette and light 4: unchanged mix, more of it. The Red House's pale trim now catches the sun against its brick at 0.20 where the wall was flatter before. The yellow-green 淘兒 front at 0.20 is still the one off-palette block.
- Story beat 3: unchanged.
- Performance 5: 60.4 fps headed at 0.20 (the display cap), console empty on a fresh session, all three scene files re-run clean.

### 02 Spring Festival — evidence

- Recognition 4: at 0.36 the 騎樓 columns have plinths, chamfered shafts and capitals, the bays run two and three floors, and each crest style has its own parapet — the row reads as Dihua Street rather than as one bay repeated. 霞海城隍廟 has its carved 堵 panels, its 斗拱 and its ridge dragons now, and is still known only from its label, because no keyframe frames it.
- Period 3: unchanged. The 三輪車 and blue 小貨車 at 0.36 in a 2001 frame.
- Composition 3: 0.44 has stalls in the foreground under the lantern strings; at 0.52 the nearest lantern string still covers the top quarter of the frame.
- Density and life 3: the varied roof line at 0.36 and 0.44 reads as more street, but the goods are still white boxes and 0.58 is still the chapter ending on an empty road.
- Palette and light 4: unchanged. The deeper arcade columns throw a longer shadow line down the east row at 0.36, which is the clearest the two sides of the street have looked.
- Story beat 3: unchanged. `cut-0.347.png` fires the white flash on the 2000 marking.
- Performance 5: 60.4 fps headed at 0.44, console empty.

### 03 The Future — evidence

- Recognition 4: the 101 now carries a mullion grid standing proud of the glass on all eight segments, a two-ring floor edge, and 32 modelled 如意 at the segment corners; at 0.90 and 0.97 the grid is what makes it read as the real curtain wall. Every other tower is still a generic lit box and City Hall is still in none of the four frames.
- Period 3: unchanged. Nothing separates 2020 from 2039.
- Composition 4: 0.66 and 0.97 are composed; at 0.78 the near blocks still warp under the 62° fov and the podium is still below the frame (`HANDOFF.md` open item 6).
- Density and life 3: unchanged. At 0.66 the road has only the girl and the plaza has no people. The podium's new fin grid fills the face the camera looks straight at, but a wall is not life.
- Palette and light 4: unchanged. Lit windows in daylight remain the one mixed signal.
- Story beat 4: unchanged.
- Performance 5: 60.4 fps headed at 0.78, console empty.

### The three lowest, and who takes each

Unchanged from scoring 2, because issue #15 could not touch any of them:

1. Chapter 01 period (3) — CJ decision, open since scoring 1: gate the Ximending sets by scroll year or keep all three on.
2. Chapter 01 composition (3) — agent, in `scene-red.js`: move the 中華商場 rooftop slab back from the road edge so it clears the title at 0.02.
3. Chapter 02 density and life (3) — agent, in `scene-dadao.js`: dress the 2020 stretch at 0.58 so the chapter does not end on an empty road.

Next after those, and new from this pass: nothing on the rubric will move again from model work until a keyframe frames 霞海城隍廟 and 樂聲戲院. Both are now the most detailed things in their chapters and the camera passes both hard against the frame edge.
