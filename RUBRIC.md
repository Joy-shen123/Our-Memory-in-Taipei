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
