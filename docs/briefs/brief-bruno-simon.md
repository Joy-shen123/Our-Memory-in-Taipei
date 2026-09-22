# Brief: reverse-engineer bruno-simon.com

You are a research agent in the main checkout of `Our-Memory-in-Taipei`, a scroll-driven three.js page (r149 UMD, no build step, no network; read `HANDOFF.md` for what it is). CJ wants to know how Bruno Simon's portfolio is built so he can rebuild the same feeling for this project. The reader is CJ, a non-native English speaker who builds three.js pages himself; write plainly, gloss any technical word on first use.

## Goal

A report CJ can rebuild from: every tool, the structure of the product, how the 3D is achieved, the fonts, the colour palette, and a checklist of what he would need to rebuild it.

## Done when

`research/bruno-simon/README.md` exists with these sections, each backed by a source you actually read (a URL, a file path in a public repo, a network request you saw, a computed CSS value):

1. **What it is** — one paragraph: what the visitor does, what loads, how long it takes.
2. **Tools** — a table: library or tool, version, what it is used for, where you saw it (bundle string, request, repo file). three.js, physics engine, build tool, animation library, loader formats, hosting, analytics, anything else.
3. **Structure** — folder and module structure of the source, the scene graph (sections or areas of the world, camera, controls), the load sequence, and how state moves (physics tick, input, resize). A diagram in plain text is fine.
4. **How the 3D is done** — models (which format, from which tool), how lighting is faked (baked textures, matcaps, vertex colours, custom shaders), the shadow trick, the floor, post-processing, how the car and physics work, how the text in the world is made, how it stays fast.
5. **Fonts** — every font family used, weight, size at 1440 wide, where it loads from, the licence.
6. **Colour palette** — every colour that matters as hex, grouped: background, floor, materials, UI, text. Read them from computed CSS and from the shader or texture sources, not from a screenshot guess.
7. **Interaction and feel** — controls, camera behaviour, the sound design, easter eggs, the mobile fallback.
8. **What CJ needs to rebuild it** — a numbered checklist: assets to make (in what tool), code modules to write, in what order, with a rough hour count each. Then one honest paragraph on what does not carry over to a page with no build step and no model files.
9. **Sources** — everything you read.

Plus `research/bruno-simon/shots/` with at least six screenshots at 1440x900: the loading screen, the first frame, two areas of the world, one close-up showing a texture, the mobile view at 390x844.

## Method

1. Start with the public source. Bruno Simon published his 2019 portfolio at `github.com/brunosimon/folio-2019`; check whether the live site is still that version or a newer one, and say which. Read the repo's `package.json`, `src/`, the Blender and texture assets folder, the shader folder. `gh repo view brunosimon/folio-2019` and `gh api` work without cloning; clone into `research/bruno-simon/src-folio-2019/` only if reading through the API is slower. If cloned, do not commit the clone.
2. Then the live site with agent-browser (session name `bruno`): `agent-browser open https://bruno-simon.com`, `set viewport 1440 900`, wait for the loader, take the screenshots, then `agent-browser network` for every asset request (bundle names, model files, textures, fonts, audio), and `agent-browser eval` for computed styles (`getComputedStyle(document.body)`, font-family on every text node, CSS custom properties on `:root`).
3. Cross-check: anything in the report that came from the repo must be confirmed present in the live bundle or the network log, or be marked "2019 repo only, not confirmed live".
4. Write the README last, from your notes, not as you go.

If `agent-browser open` returns "os error 35", close that session, remove only its files under `~/.agent-browser/`, use a new session name. Never `pkill` the daemon. Another agent-browser session (`issue3`) may be running on this machine; do not touch it.

## Do not touch

- Anything outside `research/bruno-simon/` and this brief. Another agent is working in a worktree of this repo; the main checkout's `app.js`, `data.js`, `scene-*.js`, `HANDOFF.md` and `asset/` are not yours.
- Git: do not commit, stage or push. The lead commits.
- Eagle, the wiki vaults, `/tmp`.

## Deliverable

- `research/bruno-simon/README.md`
- `research/bruno-simon/shots/*.png`
- Reply with only: the README path, the shot count, and five lines: the three.js version, the physics engine, how lighting is faked, the main font, the background hex.
