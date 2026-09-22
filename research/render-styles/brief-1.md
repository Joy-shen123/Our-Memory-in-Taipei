# Brief: 3D rendering style options for "Our Memory in Taipei"

CJ (the owner) wants to SEE several rendering styles applied to the same 3D models, so he can pick one. He does not know the style vocabulary, so every option needs a plain-English one-line description and a picture.

## What is here

- `print.html` — a working style-test page. It loads `three.min.js` (r149, global THREE) and the teammate's procedural asset library from `lib/` (global `NOSTALGIA_ASSETS`, `NostalgiaCore`), lays 8 models along a street with trees, a landmark at the end, and runs ONE full-screen post shader (two-colour woodblock print). URL params: `?set=dadao|ximen|one&id=<asset-id>`, `&print=0` turns the shader off.
- `lib/` — symlink to the real asset library in the repo `~/Documents/CJ-project-vault/shidaimiwu-proto/asset/3d/`. Read-only. Do not edit anything there or in the repo.
- `dadao.png`, `ximen.png` — the woodblock style already rendered. That is option 0; do not redo it.
- The real product: `~/Documents/CJ-project-vault/shidaimiwu-proto/index.html` (read `HANDOFF.md` there for what the page is). Do not edit that repo; another agent is working in it.

## Task

Make 6 more styles, each as its own page `style-<name>.html` copied from `print.html` with the post pass and/or materials/lighting changed. Same two camera shots per style (`?set=dadao` and `?set=ximen`), 1536x1024. Suggested set, pick or replace as you judge, but keep them visually far apart from each other:

1. cel / toon (flat colour bands, thick black outline, anime background look)
2. soft pastel low-poly (no outlines, warm daylight, long soft shadows, gentle gradient sky)
3. night neon (dark blue night, emissive signs bloom, wet road reflection; Ximending 1990s feel)
4. gouache / watercolour (paper texture, edge darkening, colour bleed, hand-painted feel)
5. blueprint / ink line drawing (white or blue paper, lines only, hatching in shadow)
6. retro pixel / PS1 (low internal resolution, palette quantisation, ordered dither, no smoothing)

Rules: no CDN, no image or model files, procedural only, keep each page a single self-contained HTML that runs from file://. Keep the models untouched; override materials at runtime if a style needs it (traverse and swap). 60 fps is not required for this test.

## Screenshots (this exact recipe works)

```
export AGENT_BROWSER_SESSION=styles
agent-browser --headed open "file://$PWD/style-toon.html?set=dadao"; agent-browser set viewport 1536 1024; sleep 2
agent-browser screenshot "$PWD/out/toon-dadao.png"; agent-browser console
agent-browser open "file://$PWD/style-toon.html?set=ximen"; sleep 2; agent-browser screenshot "$PWD/out/toon-ximen.png"
agent-browser close
```

Set the viewport BEFORE the first screenshot; the renderer sizes to the window on load and on resize. Look at every screenshot yourself (Read the PNG) before calling it done; fix anything broken.

## Deliverable

- `out/<style>-dadao.png` and `out/<style>-ximen.png` for each style.
- `out/contact-sheet.html`: one page showing all 7 styles (include the existing woodblock `dadao.png`/`ximen.png`) as a grid, each with its name, a one-line plain-English description, and one line on what it costs on the real page (fps, what it hides, effort).
- `out/README.md`: the same table in markdown, plus which 2 you would pick for a scroll-driven page about Taipei memory and why, in 3 lines.

When done, reply with only: the path of the contact sheet and the 2 you would pick.
