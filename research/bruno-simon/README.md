# bruno-simon.com — how it is built

Research date: 2026-09-22. Reader: CJ. Everything below is either read from source I downloaded, or seen in the live browser. Where the two disagree I say so.

## The first thing you must know

**The live site is not `folio-2019`.** It is a complete rewrite called **folio-2025**, and Bruno publishes its source too, under MIT licence, Blender files included:

- Live source: <https://github.com/brunosimon/folio-2025> (branch `main`, ~32,000 lines across 148 files under `sources/`)
- Old source: <https://github.com/brunosimon/folio-2019> — a different site, still a good read, but nothing on the live page comes from it

I found the folio-2025 link inside the live JavaScript bundle. Bruno prints a message in the browser console that lists his whole stack. Open <https://bruno-simon.com>, press F12, read the Console tab — it names three.js, Rapier, Howler.js, Amatic SC and Nunito by hand. That is the single best source in this whole report.

The two versions are so different that I cover the live 2025 one in full and put the 2019 one in a short comparison at the end.

---

## 1. What it is

You open the page and see a dark grid floor with a small glowing disc floating in it, a car on the disc under a cherry tree, and hand-written words saying "CLICK TO START". Nothing else — no menu, no text wall. You click, a ring of light sweeps outward from the car and paints a whole island into existence: sand, grass, water, roads, trees. Then you drive. Arrow keys or WASD. The island holds 13 themed "areas" (his projects, his career, a bowling alley, a race circuit, a toilet, an altar, a time machine, and so on), and you find them by driving into them. There is no scrolling and no page navigation at all — the world *is* the navigation. A day-night cycle runs the whole time on a 4-minute loop, so the same place looks orange, then purple, then deep blue, then pink again.

On my machine (Chrome headless, 1440×900, fast connection) the page made **115 network requests for 7.16 MB**, the last asset landed **about 12 seconds** after navigation started, and it held a steady **60 fps**. The "click to start" screen appears well before that — the heavy assets keep streaming while you look at it.

Sources: live page at 1440×900 (`shots/01-loading.png`, `shots/02-first-frame.png`), `performance.getEntriesByType('resource')` measured in the live page, `sources/Game/Game.js`, `sources/Game/World/Areas/Areas.js`.

---

## 2. Tools

Versions are from `package.json` in folio-2025 (`main`, read 2026-09-22). The "seen live" column is how I confirmed the same thing is actually running on bruno-simon.com.

| Library / tool | Version | What it does here | Seen live as |
|---|---|---|---|
| **three.js** | `^0.183.2` | The 3D engine. Imported as `three/webgpu`, not plain `three`. | `window.__THREE__ === "183"` in the live page; `REVISION = "183"` in `assets/index-ORr3L4no.js` |
| **three.js TSL** | ships inside three r183 | "Three.js Shading Language" — lets you write shader code as JavaScript that compiles to either WebGL or WebGPU. Every custom material here is written in it. | 125 `NodeMaterial` classes in the live bundle; 50 `MeshBasicNodeMaterial`, 13 `MeshLambertNodeMaterial` |
| **WebGPURenderer** | three r183 | The renderer. Falls back to WebGL automatically if the browser has no WebGPU. | `navigator.gpu` present and the canvas has a live `webgpu` context; the site's own Options panel prints "WebGPU" |
| **@dimforge/rapier3d** | `^0.17.3` | The physics engine (Rust compiled to WebAssembly). Replaces cannon.js from 2019. | `assets/rapier-BmPn8Tpt.js` + `assets/rapier_wasm3d_bg-0Vyjx73g.wasm` requested at runtime, lazily |
| **gsap** | `^3.12.5` | Animation tweening — camera moves, UI, the reveal sweep. | `window.gsapVersions === ["3.12.5"]` live |
| **howler** | `^2.2.4` | All audio: music, engine loop, impacts, thunder, birds. | `window.Howler` present live; 42 `.mp3` requests |
| **camera-controls** | `^3.1.2` | Only for the debug free-fly camera and the map view. The normal gameplay camera is hand-written. | in bundle |
| **tweakpane** + `@tweakpane/plugin-essentials`, `plugin-camerakit` | `^4.0.4` | The debug panel (add `#debug` to the URL). Replaces dat.GUI from 2019. | `class TpEvent`, `class TabApi` etc. in the live bundle |
| **stats-gl** | `^3.6.0` | FPS / draw-call monitor, only with `#stats` in the URL. | `sources/Game/Rendering.js` `setStats()` |
| **seedrandom** | `^3.0.5` | Repeatable randomness, so scattered grass and leaves look the same on every load. | `new alea('foliage')` in `sources/Game/World/Foliage.js` |
| **normalize-wheel** | `^1.0.1` | Makes mouse-wheel zoom behave the same across browsers. | in bundle |
| **msgpack-lite** + **uuid** | `^0.1.26`, `^11.1.0` | Talking to his private multiplayer/stats server. The site works fine without it — live it reports `is-server-offline`. | `document.documentElement.className` contains `is-server-offline` live |
| **vite** | `^7.2.4` | The build tool. Plus `vite-plugin-wasm`, `vite-plugin-top-level-await`, `vite-plugin-node-polyfills`, `vite-plugin-restart`, `@vitejs/plugin-basic-ssl`. | Output is `assets/index-<hash>.js` + `assets/index-<hash>.css`, Vite's signature naming |
| **stylus** | `^0.64.0` | CSS preprocessor. All 21 style files are `.styl`. | compiled into `assets/index-Di03QkGT.css` |
| **@gltf-transform/cli** + **KTX-Software** | `^4.1.0` | Asset compression pipeline, run by `npm run compress`. Squeezes models and textures before they ship. | every model URL ends `-compressed.glb`; every texture is `.ktx` |
| **sharp**, **glob**, **dotenv**, **emoji-regex** | — | Build scripts only, not shipped to the browser. | — |
| **Draco** | bundled with three | Mesh compression decoder. | `draco/draco_wasm_wrapper.js` + `draco/draco_decoder.wasm` fetched live |
| **Basis Universal** | bundled with three | KTX2 texture decoder. | `basis/basis_transcoder.js` + `.wasm` fetched live |
| **Hosting** | — | Self-hosted. Plain **nginx 1.24.0 on Ubuntu**, not Vercel or Netlify. | `curl -I https://bruno-simon.com/` → `Server: nginx/1.24.0 (Ubuntu)`, `Last-Modified: Tue, 07 Apr 2026` |
| **Analytics** | — | Google Analytics 4, property `G-JMSN30BQ5J`. | inline script in the live HTML; a `POST` to `google-analytics.com/g/collect` fires on load |
| **Loader formats** | — | `.glb` for models (Draco-compressed), `.ktx` (KTX2 + Basis ETC1S) for textures, `.mp3` for audio, `.woff2` for fonts, `.svg` / `.webp` for flat UI icons. | network log |

What is **not** here, and is worth noticing: no React, no Vue, no state library, no TypeScript, no CSS framework. It is plain JavaScript classes and a preprocessor for CSS.

---

## 3. Structure

### Folders

```
folio-2025/
├── sources/                 <- everything Vite compiles (Vite's "root")
│   ├── index.html           <- the only HTML page
│   ├── index.js             <- 12 lines: import override, start Game
│   ├── threejs-override.js  <- monkey-patches THREE.Object3D.prototype.copy
│   ├── Game/                <- 116 files, all the logic
│   │   ├── Game.js          <- the one singleton that owns everything
│   │   ├── Rendering.js Ligthing.js Materials.js Fog.js Water.js Terrain.js
│   │   ├── View.js          <- the camera (788 lines)
│   │   ├── Player.js Respawns.js Zones.js Objects.js InstancedGroup.js
│   │   ├── Audio.js Inputs/ Physics/ Passes/ Materials/ Geometries/ Cycles/
│   │   ├── Menu.js Map.js Modals.js Notifications.js Achievements.js
│   │   └── World/
│   │       ├── World.js     <- builds the scene in 3 steps
│   │       ├── Areas/       <- 15 files, one class per place (CircuitArea is 1690 lines)
│   │       └── Floor.js Grass.js Foliage.js Trees.js Water­Surface.js Snow.js ...
│   ├── data/                <- achievements.js projects.js lab.js social.js countries.js consoleLog.js
│   └── style/               <- 21 .styl files, one per UI piece
├── static/                  <- served as-is: models, textures, sounds, fonts, ui svgs
├── resources/               <- the sources of the assets: .blend, .psd, .sbs, GarageBand projects
├── scripts/compress.js      <- the asset squeezing pipeline
└── vite.config.js
```

Note `resources/folio-2025.blend` — the **entire world is one Blender file**, published in the repo.

### The scene, in plain terms

There is no "scene graph" in the tidy nested sense. Almost everything is added flat to one `THREE.Scene`, and grouping is logical (a class owns its meshes) rather than spatial. The pieces:

```
Scene
├── backgroundNode           <- not a skybox: a 2D colour gradient painted behind everything
├── DirectionalLight (×1)    <- the only real light in the whole site. Casts the shadow map.
├── Floor                    <- one big plane, 128 subdivisions, coloured by a terrain data texture
├── Grid                     <- the dark "nothing" floor you see before the reveal
├── WaterSurface             <- a separate surface at y = -0.3
├── Grass / Foliage / Trees / Bushes / Flowers   <- all InstancedMesh, thousands of copies, few draw calls
├── Scenery                  <- roads, buildings, props, loaded from one scenery glb
├── 13 Areas                 <- landing, projects, lab, career, social, bowling, circuit,
│                               cookie, toilet, altar, achievements, behindTheScene, timeMachine
├── VisualVehicle            <- the car you see
└── weather/effects          <- rain, snow, lightning, leaves, wind lines, confetti, tornado
```

The camera is a **PerspectiveCamera with a 25° field of view** (narrow — that is what makes the world look like a tilt-shift model), near 0.1, far 200. It sits on a sphere around a focus point: `phi = π × 0.31`, `theta = π × 0.25`, distance between 15 and 30 depending on zoom. It does not orbit freely during play. It follows the car with easing, and it also has a "roll" spring that gets kicked when you crash. Source: `sources/Game/View.js` lines 284–400.

### Load sequence

`Game.init()` is one long `async` function and the order matters:

1. Create the bare systems that need no files: `Scene`, `Debug`, `ResourcesLoader`, `Quality`, `Server`, `Ticker`, `Time`, `DayCycles`, `YearCycles`, `Inputs`, `Audio`, `Notifications`, `RayCursor`, `Viewport`, `Modals`, `Menu`, `Rendering`.
2. `await rendering.setRenderer()` — WebGPU needs an `await` before anything can draw.
3. **First wave, awaited (4 files only):** respawn points, a stars texture, a sound-icon texture, and `palette.ktx`. That is why the intro appears in seconds — it needs almost nothing.
4. Build the intro world: `Respawns`, `View`, post-processing, `Reveal`, `Noises`, `Weather`, `Wind`, `Tracks`, `Lighting`, `Fog`, `Water`, `Materials`, `Objects`, `Explosions`, `World`.
5. **Second wave, in parallel:** the Rapier WebAssembly module (dynamic `import()`) and ~50 model/texture files. The loading bar you see is this wave: `(f, p) => this.world.intro.updateProgress(1 - f / p)`.
6. When both land: `Terrain`, `Physics`, `PhysicsVehicle`, `Zones`, `Player`, `InteractivePoints`, `KonamiCode`, `Achievements`, `Tornado`, `Map`, `Title`, then `world.step(1)` builds the real island.
7. `PreRenderer.render()` — a trick worth stealing. It makes everything in the scene visible for one frame, renders it once into a tiny 32-pixel cube render target, then hides it again. The point is not the image; it is to force every shader to compile **before** the player starts moving, so there is no stutter later.
8. Three ticks later, `reveal.updateStep(0)` starts the expanding ring.

Source: `sources/Game/Game.js`.

### How state moves: one clock, numbered priorities

This is the cleanest idea in the whole codebase and it is the one I would copy first.

There is **one** `requestAnimationFrame` loop, owned by the renderer (`renderer.setAnimationLoop(...)`), which drives a `Ticker`. Every system subscribes with `ticker.events.on('tick', fn, PRIORITY)` and the ticker runs them in priority order. No system calls another system's update. The order is data, written out in the repo's own readme:

```
0   Time, Inputs
1   Player: pre-physics      (reads Inputs)
2   PhysicsVehicle: pre-physics
3   Physics                  <- Rapier steps the world here
4   PhysicsWireframe, Objects (copy physics results onto meshes)
5   PhysicsVehicle: post-physics
6   Player: post-physics
7   View                     <- camera moves after the car has moved
8   Intro, DayCycles, YearCycles, Weather, Zones, VisualVehicle
9   Wind, Lighting, Tornado, InteractivePoints, Tracks
10  Areas, Foliage, Fog, Reveal, Terrain, Trails, Floor, Grass, Leaves,
    Lightnings, RainLines, Snow, VisualTornado, WaterSurface, Benches,
    Bricks, ExplosiveCrates, Fences, Lanterns, Whispers
13  InstancedGroup           <- all instance matrices uploaded once, after everything moved
14  Audio, Notifications, Title
998 Rendering                <- draw
999 Monitoring
```

Input: a single `Inputs` class merges keyboard, gamepad, mouse pointer, wheel and an on-screen joystick ("nipple") into named **actions** (`forward`, `boost`, `honk`, `respawn`…). Each action belongs to categories (`wandering`, `racing`, `cinematic`), so when you enter a race the game just switches the active category instead of rewiring listeners.

Resize: a `Viewport` class fires `change` (every resize) and `throttleChange` (debounced). Cheap things listen to `change`; expensive rebuilds — shadow camera size, floor size — listen to `throttleChange`.

---

## 4. How the 3D is done

### Models

Everything is modelled in **Blender** and exported as `.glb`. The whole world is one `.blend` file in the repo (`resources/folio-2025.blend`). Export rules are written in the repo readme: mute the palette texture node before exporting (three.js attaches it itself), use the saved export presets, and **do not compress in Blender** — that happens later.

Compression is a separate `npm run compress` step using `@gltf-transform/cli` and Khronos' KTX tools. It walks `static/`, Draco-compresses meshes, and re-encodes every embedded texture to **ETC1S at quality 255** — a lossy format the GPU can read directly without unpacking. Originals are kept; new `-compressed.glb` files are written beside them. The result: **23 model files totalling 0.96 MB**, and **36 texture files totalling 0.84 MB**, for an entire island. That is the number to remember.

Some models come in pairs: `playgroundVisual` / `playgroundPhysical`, `birchTreesVisual` / `birchTreesReferences`. The visual one is what you see; the physical one is a crude low-poly shape for collision, and the "references" one is just a set of empty objects marking where to place instances.

### How lighting is faked

**This is the heart of the look, so read this section slowly.**

There is exactly **one real light** in the site: a single `DirectionalLight` (a sun). Everything else is faked inside one custom material.

That material is `MeshDefaultMaterial` (`sources/Game/Materials/MeshDefaultMaterial.js`, ~140 lines). It extends `MeshLambertNodeMaterial` but then **throws away the standard lighting pipeline and writes its own `outputNode`** from scratch. Step by step, this is what happens to every pixel:

1. **Base colour** — a flat colour, most often one pixel sampled from `palette.ktx` (see §6). No texture detail, no normal map, no roughness map.
2. **Light bounce** — it reads the terrain colour underneath the object and mixes a little of it into surfaces facing downward, fading out with height. So a white box sitting on orange sand gets a warm underside for free. This is fake global illumination, costing one texture read.
3. **Water tint** — if the pixel is within 0.013 units of the water surface height, it is forced to pure white. That is the entire "foam at the waterline" effect.
4. **Light** — multiply by `lightColor × lightIntensity`, both uniforms driven by the day cycle.
5. **Core shadow** (the dark side of an object) — `dot(normal, lightDirection)`, then `smoothstep(-0.25, 1.0)`. Because the smoothstep edges are wide apart it produces a soft two-tone band, not a gradient. This is what makes objects read as cartoon rather than realistic.
6. **Drop shadow** (the shadow cast on the ground) — here is the clever bit. Three.js normally multiplies the shadow into the colour. Bruno intercepts it: `receivedShadowNode` **captures** the shadow value into a variable and returns `1`, so three.js applies nothing. He then uses the captured number himself.
7. **Both shadows combined** — take the maximum of core shadow and drop shadow, and `mix()` the lit colour toward `baseColour × shadowColor`. `shadowColor` is a **saturated purple or magenta from the day cycle**, never grey and never black. That single decision is why the site looks like an illustration.
8. **Fog** — mix toward the fog colour by `rangeFogFactor(near, far)`.
9. **Alpha test** — discard below 0.1.
10. **Reveal** — discard any pixel further from the reveal centre than the current reveal radius, and tint a bright ring at the boundary. This is the whole opening animation: no animation at all, just one growing number that every material reads.

So: **flat palette colours, one sun, two hand-shaped shadow bands, a coloured shadow instead of a dark one, and a fake bounce from the ground.** No matcaps, no baked lightmaps, no PBR. Compare with 2019, which used matcaps and per-area baked `floorShadow.png` images.

Real shadow maps *are* used, but only to produce that captured number: 2048 px at high quality, 512 px on mobile, `radius` 3 or 2, bias `-0.001`, normal bias `0.1`. The shadow camera is not fixed — it is resized every frame to cover exactly the piece of ground the camera can see (`View.optimalArea`, computed by raycasting the four screen corners onto the floor plane). That is why 2048 pixels is enough for a whole island.

### The floor

One `PlaneGeometry` sized to the visible area, 1.5-unit cells, with its normal attribute deleted (it is flat, so the normal is constant and not worth storing). Its colour comes from a **terrain data texture** where each channel means something different: red = paving slabs, green = grass, blue = height/water depth. Dirt and water colour come from a gradient Bruno draws into a 1×16 canvas at runtime (`#ffa94e` → `#5bc2b9` → `#13375f`). Grass colour is a single uniform, `#b8b62e`. Slabs blend `#ffcf8b` (high) to `#a87762` (low).

The green channel is also multiplied down by a **wheel-tracks render target**, so driving over grass flattens it. The tracks texture scrolls with the player.

### Post-processing

Two passes only, both written in TSL, assembled in `sources/Game/Rendering.js`:

- **bloom** — three.js' `BloomNode`, threshold 1, strength 0.25, 5 mip levels at high quality and 2 at low. Deliberately weak. It only catches the emissive things: lanterns, neon, the reveal ring.
- **cheapDOF** — a hand-rolled fake depth of field. It does not read the depth buffer at all. It blurs by **distance from the vertical centre of the screen**: `uv().y.sub(0.5).abs().smoothstep(0.2, 0.5)`, fed into three.js' `hashBlur` with 25 repeats. Because the camera is always looking down at a fixed angle, screen-Y *is* depth. A real DOF pass would cost several times more.

On low quality (mobile) the DOF pass is dropped entirely and only bloom runs.

### The car and the physics

The car is a **Rapier `VehicleController`** — a ray-cast vehicle, the standard arcade model where four rays probe the ground and push the chassis up like springs. Gravity is `-9.81`. Key numbers from `sources/Game/Physics/PhysicsVehicle.js`: steering amplitude 0.5 rad, engine force 300, top speed 5, boosted top speed 40, boost multiplier 2, brake 35, idle brake 0.06.

The suspension is a toy in its own right. Three preset heights (`0.88 / 1.23 / 1.63`) and three stiffnesses (`20 / 30 / 40`), and you can pump **each corner independently** from the numpad — `Numpad7/9/1/3` for the four corners, `Numpad8/2/4/6` for front/back/left/right, Space for all. That is how you make the car dance, flip and jump. There is also explicit stuck detection, upside-down detection and a flip helper.

Collision filtering uses three groups (`all`, `object`, `bumper`) packed into Rapier's 32-bit collision masks, so the car's bumper can push props that do not push each other.

Rapier arrives as a **lazy dynamic import** (`import('./rapier-...js')`) that runs in parallel with the asset download, so its 2.4 MB of WebAssembly never blocks the intro.

### Text in the world

Three different techniques, picked per case:

1. **Modelled letters.** "BRUNO SIMON" lying on the ground is Blender geometry, part of the scenery model. You can drive into it and knock it over.
2. **Baked texture labels.** Small signs (the career labels, project labels, key icons) are PNGs authored in Photoshop (`resources/textures/career/*.png`), compressed to `.ktx`, and drawn on a plane. For labels the alpha comes from the red channel with premultiplied alpha — `sources/Game/Materials.js` has a named exception for `projectsLabels` and `blackboardLabels`.
3. **Canvas text at runtime.** `sources/Game/TextCanvas.js` draws text into a `<canvas>` with `NearestFilter` (no smoothing — it keeps the pixel-art edge) and uses it as a texture. Used in the Projects and Lab areas where the text is data-driven.

The browser tab title is its own joke: a 30-character strip of emoji with a 🚗 that moves as you drive (`sources/Game/Title.js`).

### How it stays fast

Ranked by how much they matter:

1. **Instancing everywhere.** `InstancedGroup` takes a Blender group and turns every mesh in it into an `InstancedMesh`, so thousands of bricks, fences, benches, lanterns and trees cost a handful of draw calls. All instance matrices upload once per frame at priority 13, after everything has finished moving.
2. **Tiny assets.** 0.96 MB of models, 0.84 MB of textures. Draco + ETC1S do the work; the art style (flat colours, no detail maps) makes it possible.
3. **Grass and leaves are one merged geometry.** `Foliage` builds 80 small planes scattered on a sphere with seeded randomness, merges them into a single geometry, and instances *that*. One tree canopy = one instance, not 80.
4. **Shader pre-compile.** The `PreRenderer` cube-render trick described above.
5. **A camera-shaped shadow.** Resizing the shadow camera to the visible ground each frame keeps a 2048px map sharp over a whole island.
6. **Two quality levels, chosen by user agent.** Mobile gets: no DOF pass, 512px shadows instead of 2048, bloom at 2 mips instead of 5, a slightly higher camera angle. `sources/Game/Quality.js`.
7. **`sortObjects = false`** plus custom sorts that just compare `renderOrder` — cheaper than three.js' default depth sorting, and the author controls order by hand anyway.
8. **Render-to-texture for wheel tracks** instead of geometry.

---

## 5. Fonts

Three families. Two from Google Fonts, one self-hosted.

| Family | Weight | Where it is used | Size at 1440 wide (computed) | Loaded from | Licence |
|---|---|---|---|---|---|
| **Nunito** | 400, 700, 900 | Everything readable: body text, buttons, labels, menu copy. This is the default on `body`. | 20px body (`html { font-size: 20px }`), 16px in tab content, 13px small labels, 58px line-height on buttons | `fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Nunito:wght@400;700;900&display=block` → `fonts.gstatic.com/s/nunito/v32/XRXV3I6Li01BKofINeaBTMnFcQ.woff2` | SIL Open Font License 1.1 |
| **Amatic SC** | 700 | Every heading and every hand-written feel: "CLICK TO START", modal titles, achievement titles, the "Now playing" strip. | 50px modal title (`.title` is `2.5rem` = 50px), 40px, 34px achievement titles | same Google stylesheet → `fonts.gstatic.com/s/amaticsc/v28/TUZ3zwprpvBS1izr_vOMscGKfrUC_2fi-Q.woff2` | SIL Open Font License 1.1 |
| **Pally** | 500 (Medium) | Declared and preloaded, used only inside 3D canvas-drawn text. Regular and Bold `@font-face` rules exist but only Medium is fetched live. | 20px in the font-loader probe | self-hosted: `bruno-simon.com/fonts/Pally-Medium.woff2` (also `.woff`, `.ttf` in the repo) | Indian Type Foundry, free for personal **and** commercial use via Fontshare — not an OFL font; check the Fontshare terms before shipping it |

Two details worth copying:

- The stylesheet uses **`display=block`**, not the usual `swap`. That means text stays invisible until the font loads, rather than flashing in a fallback. On a page where the first words are hand-written 3D text, a flash would look broken.
- There is a hidden **font loader probe** at the top of `<body>`: three empty divs with `data-font="400 20px Nunito"` etc., parked at `top: calc(100% + 1px)`. The game reads these to know when the fonts are ready, because the canvas-drawn 3D text needs the real font before it draws.

Responsive type is done with one lever: `html { font-size: 20px }`, dropping to 18px under 520px and 16px under 440px. Everything else is in `rem`, so the whole UI scales from that one number.

Sources: `sources/index.html`, `sources/style/fonts.styl`, `sources/style/general.styl`, live `getComputedStyle` sweep over every visible element at 1440×900, live network log.

---

## 6. Colour palette

Colours live in three separate places, and it is worth keeping them separate in your head.

### 6a. The world palette — one 128×4 pixel PNG

The whole island is coloured by a single image: `resources/palette.png`, shipped as `static/palette.ktx`. It is **128 × 4 pixels**, and it holds 24 colours in vertical bands plus black. Every model in Blender has UV coordinates pointing at one band of this image, so changing a colour anywhere in the world means editing one pixel column.

I decoded the PNG directly. The 24 bands, left to right:

| | | | |
|---|---|---|---|
| `#7c7691` grey-lilac | `#ebd1a3` sand | `#574e37` dark olive | `#3dbbe7` sky blue |
| `#c8c2c1` light grey | `#4a413c` dark brown | `#575a5e` slate | `#eec3af` skin pink |
| `#e4a90c` gold | `#91ad78` sage green | `#e49a78` clay | `#988165` mid brown |
| `#abae2b` olive yellow | `#a49876` khaki | `#b36d45` terracotta | `#e56202` orange |
| `#ec3f1c` red-orange | `#fde6e1` off-white pink | `#f8a658` light orange | `#c30e3a` crimson |
| `#c366ef` violet | `#ed719f` pink | `#1e0603` near-black brown | `#fff2e8` cream |

Plus `#000000` as the last band.

This is the trick behind the coherence of the site. Nobody picks a colour per material — everything draws from 24 swatches.

Loader settings matter here: `NearestFilter` on both min and mag, `generateMipmaps = false`, `SRGBColorSpace`. Without nearest filtering the bands would bleed into each other.

### 6b. The atmosphere — four day-cycle presets

The sky, the light and the shadows are not fixed colours. They are interpolated between four presets over a **4-minute** loop (`sources/Game/Cycles/DayCycles.js`). The shadow colour is the surprising one: always a saturated purple or magenta, never grey.

| | day | dusk | night | dawn |
|---|---|---|---|---|
| Light colour | `#ffd2c2` | `#ff8181` | `#3240ff` | `#ffa882` |
| Light intensity | 1.2 | 1.2 | 3.8 | 1.2 |
| **Shadow colour** | `#6d3fff` | `#4e009c` | `#2f00db` | `#db004f` |
| Fog / background A | `#00ffff` | `#3e53ff` | `#10266f` | `#f885ff` |
| Fog / background B | `#9b89ff` | `#ff4ce4` | `#490a42` | `#ff7d24` |
| Reveal colour | `#5f7dff` | `#ff86d9` | `#b678ff` | `#ff9d9d` |
| Reveal intensity | 12 | 5.55 | 10 | 4.85 |

There is **no skybox**. `scene.backgroundNode` is set to a 2D radial mix between fog colour A and fog colour B across the viewport. The "sky" is a flat gradient, and the same two colours are what objects fade into with distance — so the horizon always matches perfectly, for free.

### 6c. Named material colours

From `sources/Game/Materials.js`, `Terrain.js`, `Floor.js`, `Lighting.js`, `World.js`:

| Purpose | Colours |
|---|---|
| Terrain gradient (dirt → shallow → deep water) | `#ffa94e` at 0.1, `#5bc2b9` at 0.3, `#13375f` at 0.9 |
| Grass | `#b8b62e` |
| Paving slabs | `#ffcf8b` high, `#a87762` low |
| Light bounce tint | `#82487f` |
| Orange emissive gradient | `#ff8641` → `#ff3e00`, intensity 1.7 |
| Purple emissive gradient | `#454bbc` → `#ff2eb4`, intensity 1.7 |
| Blue emissive gradient | `#91f0ff` → `#128fff`, intensity 1.7 |
| Green emissive gradient | `#f8ffa6` → `#74ff00`, intensity 1.5 |
| White emissive gradient | `#ffffff` → `#666666`, intensity 2.7 |
| Red gradient | `#ff3a3a` → `#721551` |
| Generic gradient (sky-ish) | `#ffb646` at 0, `#ff347e` at 0.5, `#01005f` at 1 |
| Birch trees | `#ff4f2b` → `#ff903f` |
| Oak trees | `#b4b536` → `#d8cf3b` |
| Cherry trees | `#ff6d6d` → `#ff9990` |
| Reveal ring default | `#e88eff`, intensity 5.5 |

Emissive materials use a neat normalisation: `colour ÷ luminance(colour) × intensity`. That makes a dim colour and a bright colour glow equally hard, so "intensity" means the same thing for every colour.

### 6d. The HTML UI palette

Counted from the compiled live stylesheet `assets/index-Di03QkGT.css` and confirmed against `sources/style/*.styl`. Frequency in brackets.

| Role | Hex |
|---|---|
| Page background (radial gradient, top-left to edge) | `#251f2b` → `#1d1721` — confirmed live as `radial-gradient(farthest-side at 0px 0px, rgb(37,31,43), rgb(29,23,33))` on `<html>` |
| Panel / modal background | `#251f2b` (14), `#241e2a`, `#141414`, `#1d172199` |
| Primary text | `#ffffff` (38) |
| Secondary / accent text, icons | `#ffceca` (21) — a pale warm pink |
| Success / highlight ("WebGPU", achievement progress) | `#d5ff95` (13) — pale lime |
| Danger / close button | `#c21515` (4), `#ff87a2`, `#ff6a7c` |
| Muted text | `#555555` (7), `#cccccc`, `#767676` |
| Deep accent | `#46123b` (4), `#bf65ff77`, `#f1d7ff` |
| Warm accent ("Now playing") | `#ffc67b` |

Note there are almost **no CSS custom properties** — only `--size`, `--width`, `--max-width`, `--hover-translate`, all for geometry, none for colour. Colours are literals in Stylus files. That is a choice I would not copy.

---

## 7. Interaction and feel

**Controls.** Arrows or WASD to drive. Shift boosts. B or Ctrl brakes. R respawns. H honks. E / F / Enter interacts. Space pumps all four suspensions; the numpad pumps them individually. Mouse wheel zooms. Gamepad is fully mapped (including both analogue triggers and stick clicks), and there is a **free camera on V, but only in debug mode** (`#debug` in the URL). Full list in `sources/Game/Player.js` lines 220–240.

**Camera behaviour.** Fixed angle, follows the car with easing, zoom from 15 to 30 units. Two touches make it feel alive: the focus point has a "magnet" that pulls the camera slightly toward points of interest, and there is a roll spring (damping 4, pull 100) that gets kicked on impact, so the whole view tilts and settles when you crash. It also zooms out with speed (`speedAmplitude -0.4` between 5 and 40 units/sec) — a standard racing-game trick for conveying speed without changing anything else.

**Sound.** Howler.js, and it is dense — 42 mp3 files load on first visit. Three original music tracks (`Sudo.mp3`, `Boy.mp3`, `Baguira.mp3`) written for the site by Kounine and released **CC0**, so you may reuse them. The track rotates every 3 minutes based on wall-clock time: `Math.floor(Date.now() / 1000 / 60 / 3) % songs.length`. On top: engine loop, suspension air, spring squeaks, tyres on pebbles, horn, paper, thunder near and distant, explosions, stone slides, an anvil, a cash register, bells, bowling pins, wolves howling at night, a countdown and a fanfare on the race circuit. Most one-shots randomise volume and playback rate per trigger (`rate: 1 + Math.random() * 0.7`) so repeats never sound identical. Ambient layers cross-fade on the day cycle — the night ambience fades in over 15 seconds via gsap.

**Easter eggs and hidden things.**

- **Konami code** — ↑↑↓↓←→←→ B A (also accepts WASD equivalents), and it changes the vehicle. There is a repeat counter, so it does something different each time.
- **38 achievements** with titles like "I'm going on an adventure!", "Under the sea", "Teeth first", "Lowrider", "KA-CHOW!", "Great Explosion Murder God Dynamight", "So baked right now" (accept 1000 cookies). Stored per visitor, shown in the Achievements area and in the menu.
- **A "Behind the scene" area** inside the world that explains how the world is made.
- **A Time Machine area** with screen textures for Metal Gear Solid and his own old folio.
- **A whispers system** — visitors leave short messages that other visitors find (this is what the private server is for).
- **A toilet area**, an **altar**, a **bowling alley**, and a full **race circuit** with countdown, checkpoints and applause.
- **A `#debug` URL hash** that opens the whole Tweakpane panel, plus `#stats` and `#inspector`.
- **The console message** listing the entire stack.
- **The animated `<title>`** with a car driving through underscores.

**Mobile.** Not a fallback — a genuine second control scheme. An on-screen joystick (`Nipple`, drawn in 3D with TSL, not in HTML) plus a row of touch buttons (interact, unstuck, previous, next, open, close). Quality drops to level 1 by user-agent sniffing: no depth-of-field, 512px shadows, less bloom, camera angle raised from `π×0.31` to `π×0.27` so more of the road is visible on a tall screen. The page CSS shrinks its root font from 20px to 18px under 520px and 16px under 440px. I confirmed it loads and plays at 390×844 (`shots/10-mobile-390x844.png`, `shots/11-mobile-playing.png`).

---

## 8. What CJ needs to rebuild it

Hour counts assume you, working with an agent, and assume you already know three.js. They are for the *stylised world* version, not for reproducing all 13 areas.

### Assets to make

1. **Learn enough Blender to model flat-shaded low-poly props.** No sculpting, no UV unwrapping in the usual sense — just boxes and cylinders you bevel and join. (8–15 h if you have never used Blender; 2 h if you have.)
2. **Build a palette PNG.** 128×4 pixels, 24 vertical colour bands, in any image editor. Then in Blender, set every material to sample one band of it. This is the step that gives you Bruno's coherence, and it is by far the cheapest win in the whole list. (1 h for the image, 2–3 h to wire the Blender material and get the UV workflow right.)
3. **Model your scene** — for Our Memory in Taipei, that is the Ximending block, the Dadaocheng arcade, the 101. One `.blend`, one material, one palette. (20–40 h, and this is the real cost.)
4. **Paint a terrain data texture** — one PNG where R/G/B each mean a different ground type. Only if you want a varied ground. (2 h.)
5. **Export and compress.** Install `@gltf-transform/cli` and the Khronos KTX tools, copy Bruno's `scripts/compress.js`. (2 h once, then free forever.)
6. **Sound.** Either licence a pack or use Bruno's CC0 music from `github.com/brunosimon/folio-2025/tree/main/static/sounds/musics`. (2–4 h to place them.)

### Code modules to write, in this order

7. **A `Ticker` with numbered priorities.** ~60 lines. Do this before anything else; it changes how the rest of the code is shaped. (2 h.)
8. **A `Game` singleton + a `ResourcesLoader`** that takes a list of `[name, url, type, onLoad]` and reports progress. ~150 lines. (3 h.)
9. **A two-wave load**: a tiny first wave for the intro, everything else in parallel behind a progress bar. (2 h.)
10. **`MeshDefaultMaterial`** — the custom TSL material from §4. This is the single highest-value file to port. Start with just: flat colour → one light uniform → `smoothstep`ed core shadow → coloured shadow mix → fog. Add the bounce and the reveal later. (6–10 h, most of it learning TSL.)
11. **A day-cycle system**: four colour presets, interpolated on a timer, feeding uniforms. ~120 lines and it makes the scene look ten times more alive than a fixed palette. (3 h.)
12. **The camera**: narrow field of view (25°), fixed spherical offset, eased follow, speed-zoom, roll spring. (4 h.)
13. **`InstancedGroup`**: read a Blender group, make one `InstancedMesh` per mesh in it, update matrices once per frame at low priority. (4 h.)
14. **The shadow-camera-fits-visible-ground trick**: raycast the four screen corners onto the floor plane, resize the directional light's shadow camera to that box, on debounced resize only. (3 h.)
15. **The reveal**: one uniform radius, every material discards beyond it and tints a ring at the edge. Cheapest big effect in the whole site. (2 h.)
16. **`PreRenderer`**: make everything visible, render once to a 32px cube target, hide again. ~30 lines, removes first-interaction stutter. (1 h.)
17. **Post-processing**: bloom at low strength, plus `cheapDOF` if your camera angle is fixed. (3 h.)
18. **Rapier + a ray-cast vehicle**, only if you want driving. This is a whole project on its own. (15–30 h.)
19. **The `Inputs` abstraction**: named actions with categories, fed by keyboard + gamepad + touch. (5 h.)
20. **Quality levels** driven by user agent. (2 h.)

### And now the honest paragraph

Very little of this transfers to Our Memory in Taipei as it stands. Your page is r149 three.js loaded as a UMD global, no build step, no server, no network, and no model or image files — every building is procedural geometry plus canvas textures. Bruno's site is the opposite on every one of those axes. Specifically: **TSL and `WebGPURenderer` do not exist in r149**, so `MeshDefaultMaterial` cannot be ported at all without upgrading three.js and adding a bundler; **all his geometry comes from `.glb` files**, which you have ruled out; **Rapier is 2.4 MB of WebAssembly** fetched over the network; and **KTX2/Draco need decoder files served over HTTP**, so they will not run from a `file://` double-click. Four things *do* carry over as they are, and they are worth more than they sound: the **numbered-priority ticker**, the **palette-as-a-tiny-image idea** (you can build a 24-swatch palette in `data.js` and have every `C(name)` read from it — you half do this already), the **coloured shadow instead of a grey one** (you can approximate it in r149 by tinting your ambient/hemisphere light purple rather than grey, which would cost you one line and change the whole mood), and the **day-cycle preset interpolation**. If you want the rest, the honest version is: it is not a port, it is a new project with a build step, and you should decide that deliberately rather than drift into it.

---

## 9. Sources

**Read directly (downloaded and read in full or in part):**

- `https://github.com/brunosimon/folio-2025` branch `main` — `package.json`, `readme.md`, `license.md`, `vite.config.js`, and all 148 files under `sources/`. Files I read closely: `Game/Game.js`, `Game/Rendering.js`, `Game/Materials.js`, `Game/Materials/MeshDefaultMaterial.js`, `Game/Ligthing.js` (spelling is his), `Game/Fog.js`, `Game/Passes/cheapDOF.js`, `Game/Terrain.js`, `Game/Water.js`, `Game/World/Floor.js`, `Game/World/World.js`, `Game/World/Foliage.js`, `Game/World/Scenery.js`, `Game/World/Areas/Areas.js`, `Game/View.js`, `Game/Physics/Physics.js`, `Game/Physics/PhysicsVehicle.js`, `Game/Player.js`, `Game/Cycles/DayCycles.js`, `Game/Quality.js`, `Game/Reveal.js`, `Game/PreRenderer.js`, `Game/Server.js`, `Game/Respawns.js`, `Game/Map.js`, `Game/InstancedGroup.js`, `Game/TextCanvas.js`, `Game/Title.js`, `Game/Audio.js`, `Game/Inputs/Inputs.js`, `Game/Inputs/Nipple.js`, `Game/KonamiCode.js`, `Game/Easter.js`, `data/achievements.js`, `style/fonts.styl`, `style/general.styl`, all of `style/*.styl` for colour counting.
- `https://raw.githubusercontent.com/brunosimon/folio-2025/main/resources/palette.png` — decoded pixel by pixel to get §6a.
- `https://github.com/brunosimon/folio-2019` branch `master` — `package.json`, `vite.config.js`, `src/index.html`, `src/style/main.css`, `src/index.js`, `src/javascript/Application.js`, `src/javascript/Camera.js`, `src/javascript/Materials/Matcap.js`, `src/javascript/World/Shadows.js`, and the full file tree.

**Live page, session `bruno` and `bruno2`, headless Chrome 152:**

- `https://bruno-simon.com/` — HTML source, 58,809 bytes.
- `https://bruno-simon.com/assets/index-ORr3L4no.js` — 4.86 MB, 108,824 lines, **not minified**. This is where I found `REVISION = "183"`, the `Game` class, `WebGPURenderer`, and the console message pointing at folio-2025. (`index-ORr3L4no.js.map` returns 404 — no source map published.)
- `https://bruno-simon.com/assets/index-Di03QkGT.css` — 40,256 bytes, for the UI colour counts.
- `https://bruno-simon.com/assets/rapier-BmPn8Tpt.js` — 229,923 bytes.
- Network log of a full load: 115 resource entries, 7.16 MB transferred, broken down as wasm 2.40 MB / mp3 1.88 MB / js 1.04 MB / glb 0.96 MB / ktx 0.84 MB.
- `getComputedStyle` sweep over every visible element at 1440×900 for §5 and §6d.
- `window.__THREE__`, `window.gsapVersions`, `window.Howler`, `navigator.gpu`, canvas `webgpu` context — runtime confirmation of versions.
- `curl -I https://bruno-simon.com/` — `Server: nginx/1.24.0 (Ubuntu)`.
- Browser console on the live page — Bruno's own stack listing.

**Screenshots in `shots/`** (all 1440×900 except the two mobile ones at 390×844):

| File | What it shows |
|---|---|
| `01-loading.png` | The loading state: the dark grid floor and the small reveal circle |
| `02-first-frame.png` | The "CLICK TO START" screen — the whole entry point |
| `03-world-intro-brunos.png` | The landing area just after starting, with the modelled "BRUNOS" letters |
| `04-world-area-2.png` | Underwater — the water tint and the "Under the sea" state |
| `05-closeup-texture.png` | Car close-up at dusk, showing bloom on the tail lights and the DOF blur |
| `06-map-ui.png` | The in-game map with clickable teleport pins |
| `07-projects-area.png` | Close-up: stylised grass, water surface lines, cherry trees, paving slabs, neon |
| `08-career-area.png` | The Social area at night — core shadows, drop shadows, world text labels |
| `09-menu-ui.png` | The menu: Amatic SC headings, Nunito body, the "Now playing" strip |
| `10-mobile-390x844.png` | Mobile entry screen |
| `11-mobile-playing.png` | Mobile in-world, with the modelled "BRUNO SIMON" text |

---

## Appendix: how folio-2019 differs

For completeness, since the brief asked. **None of this is on the live site any more.**

| | folio-2019 | folio-2025 (live) |
|---|---|---|
| Renderer | `WebGLRenderer`, pixel ratio forced to 2 | `WebGPURenderer` with WebGL fallback |
| Materials | Custom GLSL `ShaderMaterial` with **matcaps** — 14 sphere images in `static/models/matcaps/` that fake lighting from a lookup | TSL `MeshDefaultMaterial`, one real sun, hand-shaped shadow bands, palette texture |
| Shadows | **Baked** `floorShadow.png` per area, plus fake blob shadows following objects, colour `#d04500` | Real shadow map, captured as a number and re-applied as a coloured tint |
| Physics | cannon.js `^0.6.2` | Rapier (Rust/WebAssembly) |
| Debug UI | dat.GUI | Tweakpane |
| Build | Vite 5 (it was Parcel originally; the repo has since been updated) | Vite 7 |
| Post | Custom GLSL blur pass ×2 + a "glows" pass (colour `#ffcfe0`, radius 0.7, alpha 0.55) | Bloom + cheapDOF, both TSL |
| Camera | Perspective, **40°** FOV, distance 14–29 | Perspective, **25°** FOV, distance 15–30 |
| Font | **Comic Neue 700** from Google Fonts | Amatic SC 700 + Nunito + Pally |
| Clear colour | `0x000000` (there is a commented-out `0x414141`) | No clear colour — a viewport gradient `backgroundNode` |
| Structure | `World/Sections/*` — Intro, Crossroads, Projects, Information, Playground, four Distinction sections | `World/Areas/*` — 13 area classes |
| Extra | A "Three.js Journey" chat bubble in the corner with a waving cartoon boy | Achievements, whispers, a race circuit, a private server, a day cycle |
| Licence | MIT, © 2019 Bruno SIMON | MIT, © 2025 Bruno Simon |
