# Brief: how does brand.ivress.co.jp render?

CJ (project owner, non-native English, does not know the three.js vocabulary) wants to know how https://brand.ivress.co.jp/ is rendered, because our page "Our Memory in Taipei" is a scroll-driven three.js street and IVRESS is the best-looking scroll-driven three.js brand story we found. Read `../HANDOFF.md` first for what our page is and its constraints (r149 UMD, no build, no network, no model files, opened by double-clicking index.html).

Goal: a teardown a builder can act on. Not "it looks nice"; what code and assets produce each visible effect.

## Method (do all of it)

1. Open the site with agent-browser (headed, 1440x900). Scroll through all chapters slowly. Screenshot each chapter into `research/ivress/shots/`. Note what changes per chapter: camera move, transitions, text, colour, lighting.
2. Network: list every script, model, texture, font, shader file loaded (agent-browser network requests). Sizes and formats: glTF/glb, Draco, KTX2, basis, HDR, mp4, JSON keyframes. Download nothing large; record URLs and sizes.
3. Read the main JS bundle(s). Identify: three.js version (search the bundle for `REVISION`), WebGPU vs WebGL and how the fallback is chosen, TSL or GLSL shaders, post-processing passes (bloom, DoF, grain, tone mapping, colour grading), scroll library (Lenis, GSAP ScrollTrigger, custom), camera path method (curve, keyframes, timeline), instancing, LOD, how text is synced to scroll.
4. In the page console, inspect the live renderer if reachable (`window.__three`, or find the WebGLRenderer via the canvas context, or React fiber roots). Record renderer parameters: pixel ratio, tone mapping, output colour space, shadow map, antialias.
5. For each visible effect you screenshot, write the line: effect → how it is made → which of our constraints it would break → hours to approximate on our page.

## Deliverable

`research/ivress/README.md`, under 2000 words, plain English with each term glossed once, with the screenshots referenced, a table of assets, a table of techniques, and a final section "What we could borrow tonight" (fits our constraints) and "What would need a decision" (breaks one). Cite by URL. Do not touch anything outside `research/ivress/`. Reply with the README path and a 5-line summary.
