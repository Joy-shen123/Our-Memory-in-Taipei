# Brief: style 14, "Bruno" — our street rendered with bruno-simon.com's method

You are a build agent in the main checkout of `Our-Memory-in-Taipei`, a scroll-driven three.js page (r149 UMD, no build, no network). Read `HANDOFF.md` in full, then `research/render-styles/README.md` (the 15 earlier style tests and their exact pattern), then `research/bruno-simon/README.md` sections 4 and 6 (how Bruno's look is made, with every hex). CJ asked, 2026-09-22: 「can you make a preview if i use it's method?」. The preview is a picture, not a page change.

## Goal

CJ can look at our own street, same models, same two camera shots as the other 15 styles, and see what it looks like rendered Bruno's way, so he can decide whether to move the page in that direction.

## Done when

- `research/render-styles/style-bruno.html` exists and works like the other `style-*.html` pages: `?set=dadao|ximen`, self-contained, models untouched, materials and lights swapped at runtime, r149 UMD only.
- `research/render-styles/shots/bruno-dadao.jpg`, `bruno-ximen.jpg` at 1536x1024, plus `bruno-cycle.jpg`: the ximen shot four times side by side under Bruno's four day-cycle presets (day, dusk, night, dawn), so CJ sees the light move.
- A row 14 appended to the table in `research/render-styles/README.md` in the same shape as rows 7 to 13: plain-English look, honest cost on the real page, pictures. Plus one line under "How far each one honestly gets".
- The shots opened for the lead to check: console empty, no page errors.
- Nothing committed. The lead commits.

## Bruno's method, the five ingredients to reproduce (from `research/bruno-simon/README.md`)

1. **Coloured shadows.** One DirectionalLight with a 2048 shadow map. In the material, take the max of the core shadow (`smoothstep(-0.25, 1.0, dot(normal, lightDir))`) and the drop shadow, and mix the lit colour toward `baseColour * shadowColor`, where shadowColor is the day-cycle purple (`#6d3fff` by day). Never grey. In r149 do this with `MeshLambertMaterial` plus `onBeforeCompile` patching the fragment shader, or a small `ShaderMaterial`; the earlier `style-toon.html` and `style-clay.html` show both routes.
2. **24-colour palette.** Quantise every material colour to the nearest of Bruno's 24 swatches (section 6a of the report) at material-swap time. Keep the sign canvases as they are, since they are text.
3. **Two-tone shading.** No normal, roughness or detail maps; flat base colour, the stepped core shadow above, a fake ground bounce: mix a little of the road or ground colour into downward-facing normals, fading with height.
4. **Narrow camera.** Field of view 25 degrees, camera pulled back so the framing matches the other styles' two shots as closely as possible. Say in the README row how far the camera had to move.
5. **Day cycle.** Sky is a 2D gradient between fog colour A and B (no skybox), light colour and intensity, shadow colour and fog from the four presets in section 6b. Objects fade toward the same two colours with distance. `?cycle=day|dusk|night|dawn` picks the preset; default day.

Optional if cheap: weak bloom on emissive signs (threshold 1, strength 0.25), and the fake depth of field that blurs by distance from the screen's vertical centre. Say in the README whether they are on.

## Method

1. Copy the structure of `style-pastel.html` (closest cousin: one sun, shadows, no outlines). Same two camera keyframes, same viewport, same asset set loading.
2. Build the five ingredients in the order above, screenshotting after 1 and after 5 so the lead can see what each added: `shots/bruno-step1-ximen.jpg`, then the final three.
3. Screenshots with agent-browser, session name `brunostyle`, viewport 1536x1024, wait 60 frames after load. The `bruno-cycle.jpg` strip can be four screenshots stitched with `sips` or a small canvas page. Sessions `issue3`, `music` and `bruno` belong to other agents; do not touch them.
4. Append the README row and the honesty line. The cost line assumes the real page today: 101 fps at 1440x900 with one grain pass; a shadow map costs 10 to 20 percent per the pastel and low-poly rows.

## Do not touch

- `index.html`, `app.js`, `data.js`, `scene-*.js`, `style.css`, `asset/` at the repo root. Work only inside `research/render-styles/`.
- The two worktrees under `~/Documents/CJ-project-vault/_worktrees/`.
- Git: no commit, no push.

## Deliverable

- `research/render-styles/style-bruno.html`, the four jpgs under `shots/`, the README row.
- Reply with only: the file paths, the fps cost estimate in one line, and one line on which of the five ingredients changed the picture most.
