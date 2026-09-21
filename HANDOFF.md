# HANDOFF — Our Memory in Taipei

Scroll-driven three.js page for Claude Code Build Day. Repo: https://github.com/Joy-shen123/claude_code_build_day (branch `main`). Local clone: `~/Documents/CJ-project-vault/shidaimiwu-proto`. Last updated 2026-09-21 (issue #1 Part 1, branch `issue-1-part-1`).

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

## Files and load order

`index.html` loads, in this order: `three.min.js` (r149, UMD, global `THREE`) → `asset/3d/assets-core.js` + `assets-ximen-*.js` + `assets-dadaocheng-*.js` (teammate's library, global `NOSTALGIA_ASSETS`) → `data.js` (all content, global `DATA`) → `app.js` (engine) → `scene-red.js`, `scene-dadao.js`, `scene-tower.js` (one chapter each; they build the anchors too).

- `data.js` — palette, eras, anchors with captions (position and label only; the buildings are in the scene files), generic lots (Xinyi stretch only now), camera keyframes (`CAM`, 6 keyframes, z must keep decreasing), `WORDS`, `CLOSING`. Change copy here.
- `app.js` — renderer, custom fog (currently disabled by setting the frontier to -1e5), camera rig on a Catmull-Rom curve, year/era from scroll progress with boundaries pinned where the camera crosses each road marking, the `part()`/`instSet()` system that tweens every object's height per era over 500 ms, the street furniture (lamps, trees, crowd, hanging signs, distant city), the asset-library placer, the girl, the climbing man, the words, the post pass (grain and vignette only now; `uPrint` is 0 everywhere). No street trees on Dihua Street (z -138 … -292) or near the 101 base shot.
- `scene-*.js` — use `window.SCENE` API only: `part(x,y,z,w,d,lookByEra,rotY?,geo?)` (one draw call each), `instSet(geo,mat,items,{colors})`, `only(eras,h,col)`, `C(name)`, `libGroup(eras)` (a group visible only in those eras), `asset(id, group, x, z, rotY, scale?)` (builds one library item into it; front faces +Z before rotation, so `-π/2` on the east side and `+π/2` on the west), `findAsset(id)`, `anchors`, `TOWER`. Items absent in an era have height 0 and are dropped underground by the engine. Each scene file sets `anchors.<id>.top` for its labels; `scene-tower.js` sets `TOWER.h` (crown top) and `TOWER.faceX(y)` (west-face x at height y) so the climbing man stays on the glass.
- `asset/` — teammate's texts (`*.md`) and 3D library (`asset/3d/`). `asset/3d/preview.html` previews the library. All six era sets are placed: Ximending items along the childhood chapter (`scene-red.js`, visible in the red era), Dadaocheng items along Spring Festival (`scene-dadao.js`, visible in red and dadao so nothing pops in at the flip). The library's own `red-house`, `chunghwa-market` and `xiahai-temple` are not used: the rebuilds below replace them.
- `README.md` — the original note that this was a throwaway prototype. Out of date: this is now the entry.

## How to test (what has worked every time)

```
export AGENT_BROWSER_SESSION=memtaipei
agent-browser open "file://$PWD/index.html"; agent-browser set viewport 1440 900   # headless; add --headed only to measure fps
# scroll to a fraction F (0..1) and wait 80 frames:
agent-browser eval -b "$(printf 'new Promise(r=>{window.scrollTo(0,%s*(document.documentElement.scrollHeight-innerHeight));let n=0;(function t(){if(++n<80)requestAnimationFrame(t);else r("ok")})()})' 0.45 | base64)"
agent-browser screenshot /tmp/f.png; agent-browser console; agent-browser close
```

Chapter fractions: red 0.02–0.33, dadao 0.38–0.56, tower 0.62–1.0. `window.__fog` exposes `progress`, `year`, `era`, `camZ`, `BOUNDS`, `jumpToYear(y)`. Syntax-check any file with `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`. Last measured 2026-09-21 after Part 1: 101 fps (display cap) at every chapter, 1440x900 pixel ratio 1, 1111 meshes + 57 instanced sets, console empty.

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

## Open items

1. Issue #1 Part 2 done 2026-09-21: the runner is 張君雅小妹妹 (`girl`, `updateGirl` in `app.js`, names kept). Suggested with primitives, not the trademark artwork.
2. Issue #1 Part 3: write `RUBRIC.md`, score each chapter once, post the scores and the three lowest items to the issue thread.
3. The base-shot keyframe (CAM[4] in `data.js`, camera y 3 at z -372 looking at y 50) puts the frame bottom at ~13° elevation, so the 101 podium is below the frame in that shot. Lower the target (y 40) or move the camera back (z -380) if the podium should show.
4. The wharf is only seen peripherally (the target curve looks east through Dadaocheng). A keyframe that glances west at z ≈ -200 would show it.
5. The era label (bottom-left) and the anchor label can overlap the top-right title on narrow screens. Labels are clamped to y ≥ 110 px; check 390x844 again after any HUD change.
6. `README.md` still says "throwaway prototype". Rewrite as the project readme.
7. Mobile: last checked 390x844 before the asset library was added. Re-check.

## Not done on purpose

- No sound, no free camera, no menu, no save state, no framework, no CDN.
- No bloom. No fog. No traffic.
- 二二八 (1947, 天馬茶房) deliberately left out of the story, per the original brief.
