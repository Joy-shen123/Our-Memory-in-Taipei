# How brand.ivress.co.jp is rendered

Teardown of https://brand.ivress.co.jp/ ("SPIN A TALE"), 2026-09-21, headed Chrome 1440x900. Screenshots in `shots/` (`c0.NN.png` = page scrolled to fraction NN). Sources: the page's bundles at `https://brand.ivress.co.jp/_astro/` (`vendor.Cx1SL1k6.js`, `renderer.Dk_eIqLY.js`, `site.DMvZoV3I.js`, `loader.BiFgeG7z.js`, `CommonScripts…lnE5Pcs2.js`) read pretty-printed, plus live values read from the page's exported store.

## One-paragraph answer

It is a **film that plays itself**, not a street you walk down. Six scenes were built and lit in Blender, each exported as a GLB (a binary 3D model file) plus a second GLB holding an **animated camera**. Scrolling does not move a camera along a path in code; it sets the **playhead** of that Blender camera animation: the page is 23 screens tall, each scene owns 3 (the last owns 8), and scene progress 0→1 becomes `action.time = progress × clip duration`. Everything else that looks cinematic is one post-processing shader chain: per-scene coloured fog, a white/black/gold flash at every chapter cut, film grain, and a spiral warp at the end. It runs on three.js **r182 WebGPURenderer** with **TSL** shaders, which our r149 UMD build cannot run.

## Stack (glossary inline)

| Thing | What IVRESS uses | Evidence |
|---|---|---|
| Site generator | Astro (static HTML + hashed `_astro/` bundles), no framework | `index.html` |
| three.js | **r182** (`window.__THREE__ = "182"`) | live page |
| Backend | **WebGPU** when `navigator.gpu` exists and the device is not a weak phone (≤4 cores); else the same renderer with `forceWebGL: true` → WebGL2. Measured: WebGPU | `CommonScripts` ~848; live `backend.isWebGPUBackend` |
| Shaders | **TSL** (Three Shading Language: shaders written as JavaScript node graphs, compiled to WGSL or GLSL). No GLSL strings | `renderer.js` `FilmHDNode`, `SpaceTravelNode` |
| Post-processing | three's `PostProcessing` + `pass()` + `bloom()` nodes, one output graph | `renderer.js` `updatePostProcessing()` |
| Scroll | **Lenis 1.3.17** (smooth scroll library, `lerp 0.1`) plus a custom **autoscroll**: the page advances by itself (50 s per section desktop, 25 s mobile); wheel sets direction and adds speed, mouse-down slows to 0.2×, arrows nudge; at the end it loops to the top | `CommonScripts` ~2320–2660 |
| Timeline | GSAP 3.13 ticker drives the frame loop; tweens only for the "hold" interaction | `gsapVersions`, `holdTween` |
| Camera path | **Blender-animated camera + look-at target in `sceneN_cam.glb`**, scrubbed through `AnimationMixer` | `site.js` `scrubTo()` ~1855 |
| Characters | Unlit black silhouettes (`MeshBasicMaterial({color:0})` on anything named `hero`); the scene-2 runner is a **baked vertex animation** (per-frame positions in an EXR image + JSON), no skeleton | `site.js` ~4640, `loader.js` `scene2_bake` |
| Text sync | Six `position:fixed` DOM sections; each glyph is `<span class="letter" data-delay="0-9">`; a `show` class toggles when section progress enters `ui.from…ui.to`; CSS transitions (opacity 1.4 s, blur 1.9 s, scale 1 s) staggered 0.05 s per delay step | `index.html`, `index.DwO6Foij.css` |
| Audio | Howler; 3 music parts + 8 SFX in Opus, convolution reverb | network log |
| Instancing / LOD | 5 `InstancedMesh` (castle, planets); particles are GPU compute buffers. No LOD: 2,178 meshes, ~3.46 M triangles resident, all 6 scenes loaded before "Click to start" | live traverse |
| Pixel ratio | **Forced to 1** (`Math.min(1, devicePixelRatio)`) | `CommonScripts` ~450 |
| Renderer params | `antialias: true` (4× MSAA), `alpha: true`, `high-performance`, `shadowMap` **PCFSoft**, renderer `toneMapping = None` but the post graph applies **ACES Filmic** (exposure 1), output sRGB | `renderer.js` constructor; live values |
| Lights | From the GLBs (scene 1: 7 + 1 added in code; scenes 2, 4, 5: 1 each; 3, 6: none). One shadow caster: the scene-2 character point light, 1024 map | console, `site.js` ~4004 |

## Assets loaded (all up front, ~52 MB)

| File (under `https://brand.ivress.co.jp/`) | Size | What |
|---|---|---|
| `glb/scene1.glb … scene6.glb` | 3.9 / 6.1 / 6.3 / 14.4 / 10.3 / 2.0 MB | Six scenes, Draco + Meshopt compressed, KTX2 textures inside |
| `glb/sceneN_cam.glb` ×6 | 12–28 KB each | Animated camera + target per scene |
| `glb/scene3_ivress.glb`, `scene4_castle.glb` | 365 KB, 231 KB | Logo mesh; castle as instanced points |
| `glb/scene4_curve.glb`, `scene6_curve.glb` | 597 KB, 153 KB | Bezier curves (1 and 15) that particles fly along |
| `glb/scene_2_bake/…_clean.glb + _packed.exr + .json` | 3.3 MB + 2.0 MB + small | Baked vertex animation of the runner |
| `img/scenes/scenes_array.ktx2` | 1.8 MB | 5-layer texture array: one snapshot per chapter, wrapped on the "planets" of the end screen |
| `img/brick_normal.exr`, `concrete_normal.png`, `fog.png` | 2.2 / 2.5 / 3.3 MB | Normal maps, fog sprite |
| `draco/*.wasm`, `basis/*.wasm` | 192 KB, 473 KB | Draco and Basis/KTX2 decoders |
| `_astro/vendor.Cx1SL1k6.js` | 2.4 MB | three r182 + WebGPU + TSL + Lenis + GSAP + Howler |
| `_astro/site.js`, `loader.js`, `renderer.js`, `CommonScripts.js` | 100 / 44 / 26 / 87 KB | App code |
| `audio/**/*.opus`, `impulse_response.mp3` | 1.9 MB total | Music and SFX |
| Fonts | Basilia (self-hosted woff2), Cardo + Josefin Sans (Google), Typekit kit | Title, counter, body |

No HDR environment, no video, no JSON keyframes: every camera and object move lives inside the GLB animation clips.

## Chapter by chapter

Section boundaries as page fraction: S1 0–0.13, S2 0.13–0.26, S3 0.26–0.39, S4 0.39–0.52, S5 0.52–0.65, S6 0.65–1.0. Chapter titles are DOM; nine chapters map to six scenes because S3 and S6 are split into UI parts.

| Shot | Chapter | Camera (read live) | Colour / fog (per-scene arrays `mists`, `fogColors`, `fogIntensities`) | Visible effect → how |
|---|---|---|---|---|
| `00-load`, `01-after-start` | Title | fixed | near-black, mist 0–600, #3b3b3b | % loader while all 52 MB arrive; then a warm-up renders every scene 3 frames off-screen so no shader compiles mid-scroll |
| `c0.02`, `c0.07` | 01 Prologue | (23,6,62) → (20,5,53), fov 35→32 | grey-blue, white door glow | Stone arches from GLB; blue windows = emissive meshes; dust = points; scarf = custom output node. Vertical text fades in letter by letter |
| `c0.12` | S1 → S2 cut | (0,2,-33), fov 14.5 | white-out | `corridor` material multiplies brightness ×100 then ×10 000 as `oneProgress` passes 0.7–1; post graph mixes to white through an elliptical mask over 0.9–0.97 |
| `c0.16`, `c0.20`, `c0.25` | 02 Encounter | (0.5,1.4,0.7) → (-1.9,1.4,-3.7), fov 35 | night blue #162432, mist off, 1 shadow light | Unlit black silhouettes. The orb is `sphere_fresnel`, a node material fed `twoProgress`; from 0.55 it scales ×20 and its streaks become the gold burst. The "monster" dissolves by pushing vertices outward with noise over 0.6–0.95. Cut to white at 0.92 |
| `c0.29` | 03 Power | (0,0.5,-24), fov 23 | blue, mist 0–23 | Blue particle river: GPU compute particles sampled along a curve (1000 points in a storage buffer, curl noise) |
| `c0.35` | 04 Oath | (0,0.9,-39) | same | Same particles; scarf turns gold (emissive ×100). Cut to black at 0.92 |
| `c0.42`, `c0.48` | 05 Bond | (-15,8,-46) → (-12,7,-42), fov 32 | grey #545454 / far #363636, mist 10.8–46 | Far castle = `InstancedMesh` of glowing points; `small_path` fades in along its UV with `fourthProgress`; gold stream flies along `scene4_curve`; snow = points. Cut to black at 0.97 |
| `c0.55`, `c0.58`, `c0.62` | 06 Trial | (0,2.4,-18) → (-0.8,3,-7), fov 37 | grey #393939, mist 6–28 | Eyes = unlit white `eyes` material drawn last. "HOLD TO INTERACT": holding runs a 3.2 s tween; `blade` emissive ramps ×150 → ×1000 with `fiveProgress`; scarf re-assembles from particles over 0.275–0.8. Cut to **gold** (#FFA500 + 0.5) at 0.92 (`c0.66`) |
| `c0.72`, `c0.78` | 07 Expansion | (5,15,-34) → (-20,27,-96), fov 58→78 | gold #cc841e / far #775409 | Castle rebuilt from 15 curve-following particle systems; camera pulls back and **fov widens by 115° × progress** (37° → 147°) |
| `c0.84`, `c0.86` | 08 Spiral | fixed (-53,32,-182), fov 97→107 | gold | `SpaceTravel` pass: polar spiral warp of the finished frame + chromatic aberration + procedural nebula, ramping from `sixthProgress` 0.37 |
| `c0.90`, `c0.96` | 09 IVRESS / end | overlay camera z 3.3 → 20 | black space | Second scene on top: galaxy sphere (procedural nebula), 41–55 k star points placed by a compute shader, 100 instanced "planets" textured with the 5-layer KTX2 array of chapter snapshots (the big one shows the **live** render), airglow ring, logo SVG in DOM |
| `c0.99` | loop | — | iris to black | `vignetteTransitionProgress` closes an iris, page scrolls to 0, Prologue restarts |

Constant everywhere: **film grain** (`FilmHDNode`: blue-noise + hash, scale 1.8, speed 30, stronger in dark pixels, intensity 0.5), **bloom** (strength 0.012, radius 0.21, threshold 0: nearly invisible), **mouse parallax** (camera offset up to 0.2/0.5 units, fading out in each scene's last 20 %), and on desktop a pointer-driven **GPU fluid simulation** (128 sim / 512 dye) that slightly distorts and tints the frame where the mouse moved.

## The post-processing graph, in order

`scenePass` → fluid UV distortion → per-scene fog (`fogFactor(viewZ, mistNear, mistFar)` mixed toward `fogColor`, then `fogFarColor` past a threshold, scaled by `fogIntensity`) → `+ bloom` → ACES tone mapping → five chapter flashes (`smoothstep` mixes to white / white / black / black / gold on each section's progress) → `SpaceTravel` warp → `FilmHD` grain → fluid tint. A second `PostProcessing` draws the overlay scene with the iris vignette. One TSL graph, compiled once.

## What we could borrow tonight (fits r149 UMD, no build, no network, no model files)

| Effect | How on our page | Hours |
|---|---|---|
| Chapter cut flashes | In our post pass add `uFlash` and a colour; mix to white at red→dadao and to warm gold at dadao→tower, keyed on `progress` with the same 0.92–0.97 / 0–0.05 window. Mask = `length(vec2(uv.x-.5,(uv.y-.5)*.6))` | 1 |
| Letter-by-letter word reveal | Split `WORDS` into `<span data-delay>` glyphs; toggle `show`; CSS `transition-delay` per glyph, no JS per frame | 1 |
| Chapter column + counter | "01/03 WHEN WE WERE YOUNG" top-left, `writing-mode: vertical-rl` for the Chinese secondary name | 1 |
| Luminance-aware grain | `grain *= mix(1, 1-luma, 0.85)`, slower time step (`floor(t*30)`) | 0.5 |
| FOV ramp on the climb | Add `fov` to the last two `CAM` keyframes (35 → ~90) and update the projection per frame; IVRESS goes to 147° for the "world opens up" feeling | 0.5 |
| Mouse parallax | `camera.position += right*(-mx*0.2) + up*(-my*0.5)`, damped, fading near chapter ends | 0.5 |
| Curve particles | `THREE.Points` (~3 k) at `curve.getPointAt(t + noise)`, CPU-updated each frame; lantern sparks in Dadaocheng, light stream up 101. r149 has `CatmullRomCurve3` | 2 |
| Render warm-up | `renderer.compile` each era at load so the first boundary does not hitch | 0.5 |

## What would need a decision (breaks a constraint or a CJ decision)

| Effect | Breaks | Cost if approved |
|---|---|---|
| WebGPU + TSL renderer (node fog, bloom, spiral warp, compute particles) | r149 UMD, no build. Needs r182 ES modules (a local ~2.4 MB copy works from `file://` with an importmap) and every `scene-*.js` rewritten to node materials | 2–3 days |
| Blender scenes and camera clips | "no model files"; replaces the asset library with GLBs plus a `_cam.glb` per chapter | 1 day per chapter + Blender time |
| Per-scene coloured fog | CJ 2026-09-20: "CLOSE THE MIST". IVRESS's mood is mostly this fog. A per-chapter far-distance *tint* with no density is the nearest respectful version | 1 h |
| Silhouette characters | IVRESS is dark with one light source; ours is "BRIGHT AND PRETTY". A black-cutout girl reads as a different film | 1 h |
| Autoscroll (page plays itself) | Changes the one verb "scroll"; the girl's run/walk logic keys on scroll velocity | 2 h |
| Hold-to-interact gate | New input; blocks the stage demo if missed | 2 h |
| Bloom, sound, spiral warp | HANDOFF "not done on purpose" | bloom 2 h in WebGL (two render targets), sound 1 h |
| Pointer fluid distortion | Ping-pong render targets and 4 passes; desktop-only on IVRESS too | 3 h |

## How to reproduce

Native `scrollTo` is ignored while the autoscroll runs. Click Start, import the page's module, then drive Lenis:

```
agent-browser eval "document.querySelector('#start-button').click()"
agent-browser eval "import('/_astro/CommonScripts.astro_astro_type_script_index_0_lang.lnE5Pcs2.js').then(m=>{window.__m=m; m.g.autoscroll.setEnabled(false); m.g.lenis.start()})"
agent-browser eval "window.__m.g.lenis.scrollTo(0.42*(document.documentElement.scrollHeight-innerHeight),{immediate:true})"
```

`__m.s.gl` is the renderer, `__m.s.camera` the scrubbed camera, `__m.g.sections` the six progress uniforms.
