# HANDOFF — Our Memory in Taipei

Scroll-driven three.js page for Claude Code Build Day. Repo: https://github.com/Joy-shen123/claude_code_build_day (branch `main`). Local clone: `~/Documents/CJ-project-vault/shidaimiwu-proto`. Last updated 2026-09-21.

## What it is

One page, one verb: scroll. A street runs away from the camera. Scrolling moves the camera down the street and forward in time through three chapters. A girl in a red dress runs down the middle of the road ahead of the camera. Big words surface as you scroll. It ends on a man climbing Taipei 101 with the line "Where we go, we don't know. We only know we need to climb higher."

| Chapter | key | years | z range | what is there |
|---|---|---|---|---|
| When We Were Young | `red` | 1985–1999 | +60 … -140 | Ximending: the asset library (中華商場, 樂聲, record shop, comic rental, arcade, phone booth), the Red House octagon, market stalls, crowd |
| Spring Festival | `dadao` | 2000–2019 | -140 … -290 | Dadaocheng: Dihua Street brick arcades, 霞海城隍廟, lantern strings, 恭喜發財 banners, stalls, crowd |
| The Future | `tower` | 2020– | -290 … -460 | Xinyi: glass Taipei 101, lit office towers, the climbing man, the closing line |

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

`index.html` loads, in this order: `three.min.js` (r149, UMD, global `THREE`) → `asset/3d/assets-core.js` + `assets-ximen-*.js` (teammate's library, global `NOSTALGIA_ASSETS`) → `data.js` (all content, global `DATA`) → `app.js` (engine) → `scene-red.js`, `scene-dadao.js`, `scene-tower.js` (per-chapter detail, written by workflow agents).

- `data.js` — palette, eras, anchors with captions, generic lots, camera keyframes (`CAM`, 6 keyframes, z must keep decreasing), `WORDS`, `CLOSING`. Change copy here.
- `app.js` — renderer, custom fog (currently disabled by setting the frontier to -1e5), camera rig on a Catmull-Rom curve, year/era from scroll progress with boundaries pinned where the camera crosses each road marking, the `part()`/`instSet()` system that tweens every object's height per era over 500 ms, anchors built from primitives, the asset-library street, the girl, the climbing man, the words, the post pass (grain and vignette only now; `uPrint` is 0 everywhere).
- `scene-*.js` — use `window.SCENE` API only: `part(x,y,z,w,d,lookByEra,rotY?,geo?)`, `instSet(geo,mat,items,{colors})`, `only(eras,h,col)`, `C(name)`. Items absent in an era have height 0 and are sunk underground by the engine.
- `asset/` — teammate's texts (`*.md`) and 3D library (`asset/3d/`). `asset/3d/preview.html` previews the library. **Not yet placed: `asset/3d/assets-dadaocheng-*.js`** (pushed 2026-09-21).
- `README.md` — the original note that this was a throwaway prototype. Out of date: this is now the entry.

## How to test (what has worked every time)

```
export AGENT_BROWSER_SESSION=memtaipei
agent-browser --headed open "file://$PWD/index.html"; agent-browser set viewport 1440 900
# scroll to a fraction F (0..1) and wait 80 frames:
agent-browser eval -b "$(printf 'new Promise(r=>{window.scrollTo(0,%s*(document.documentElement.scrollHeight-innerHeight));let n=0;(function t(){if(++n<80)requestAnimationFrame(t);else r("ok")})()})' 0.45 | base64)"
agent-browser screenshot /tmp/f.png; agent-browser console; agent-browser close
```

Chapter fractions: red 0.08–0.3, dadao 0.4–0.55, tower 0.75–1.0. `window.__fog` exposes `progress`, `year`, `era`, `camZ`, `BOUNDS`, `jumpToYear(y)`. Syntax-check any file with `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`. Last measured: 101 fps at 1440x900 pixel ratio 1, console empty.

Headed Chrome throttles animation frames when the window is not focused. On stage: click once in the page before scrolling.

## Open items

1. Place `asset/3d/assets-dadaocheng-*.js` along the Spring Festival chapter the way `app.js` places the Ximending set (search `nostalgia` in `app.js`; rotate front to face the road, alternate sides, `unfog` every material).
2. At the 101 base shot (fraction ~0.78) a dark mall roof from `scene-tower.js` fills the lower half of the frame. Lower it or move it.
3. The era label (bottom-left) and the anchor label can overlap the top-right title on narrow screens. Labels are clamped to y ≥ 110 px; check 390x844 again after any HUD change.
4. `README.md` still says "throwaway prototype". Rewrite as the project readme.
5. Mobile: last checked 390x844 before the asset library was added. Re-check.

## Not done on purpose

- No sound, no free camera, no menu, no save state, no framework, no CDN.
- No bloom. No fog. No traffic.
- 二二八 (1947, 天馬茶房) deliberately left out of the story, per the original brief.
