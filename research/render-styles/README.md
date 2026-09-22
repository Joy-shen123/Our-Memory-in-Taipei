# Rendering style options — Our Memory in Taipei

Same models, same two camera shots (Dadaocheng → Xiahai Temple, Ximending → Red House), 1536x1024. Each style is one self-contained page in the parent folder: `style-<name>.html?set=dadao|ximen`. Models are untouched; materials are swapped at runtime. Open `contact-sheet.html` to see all 14 pictures side by side.

Cost lines assume the real page as it is today: 101 fps at 1440x900 with one cheap grain pass.

| # | Style | What it looks like (plain English) | What it costs on the real page | Pictures |
|---|---|---|---|---|
| 0 | Woodblock print | Two-ink print: paper, orange and black, like an old Taiwanese New Year print. | One cheap pass, no fps loss. Hides every real colour, sign lettering becomes blobs. Already built. CJ set this direction aside on 2026-09-20 ("bright and pretty"). | `shots/woodblock-dadao.jpg`, `shots/woodblock-ximen.jpg` |
| 1 | Cel / toon | Flat colour bands, thick black outline, blue anime sky with clouds. A 1990s animated film frame. | Same fps as today (toon material is cheaper, outline is one pass). Hides nothing, signs stay readable. Outlines may flicker on thin poles while scrolling. Effort: half a day. | `shots/toon-dadao.jpg`, `shots/toon-ximen.jpg` |
| 2 | Soft pastel low-poly | Chalky milky colours, faceted shapes, warm late-afternoon sun with long soft shadows, no outlines. | Shadow map is the only real cost: roughly 10 to 20 percent fps loss (2048 map on phones). Softens loud sign colours. Effort: one day, the shadow camera must follow the scroll camera down the 460-unit street. | `shots/pastel-dadao.jpg`, `shots/pastel-ximen.jpg` |
| 3 | Night neon | Dark blue night, glowing signs and lanterns with bloom, warm street lamps, rain-wet road mirroring the lights. | Heaviest: bloom is three extra passes and the wet road marches 48 steps per road pixel, 30 to 40 percent fps loss on laptop graphics. It is night, so it fights "bright and pretty". Effort: two to three days. | `shots/neon-dadao.jpg`, `shots/neon-ximen.jpg` |
| 4 | Gouache / watercolour | Paint on textured paper: wobbly hand-drawn edges, colour bleeding, pigment pooling at edges, washed sky. | One pass with extra texture reads, about 10 percent fps loss. The wobble smears small lettering, temple sign and shop names stop being readable. Effort: half a day. | `shots/gouache-dadao.jpg`, `shots/gouache-ximen.jpg` |
| 5 | Blueprint | White ink lines on blue drafting paper, no fill, diagonal hatching in shadow, faint grid and sheet border. | Renders the scene twice plus a shadow map, about 25 percent fps loss. Hides all colour and the sky; the girl's red dress becomes an outline. Effort: half a day. Better as a transition or "future" chapter than the whole page. | `shots/blueprint-dadao.jpg`, `shots/blueprint-ximen.jpg` |
| 6 | Retro pixel / PS1 | Drawn at 384x256 and blown up with hard pixels, limited colours with dot dither, wobbly vertices, distance fog. A 1997 PlayStation game. | Fastest of all, fps goes up (a quarter of the pixels). Hides small text and detail: sign lettering and the girl become a few pixels. Vertex wobble moves while scrolling, which some people find uncomfortable. Effort: half a day. | `shots/pixel-dadao.jpg`, `shots/pixel-ximen.jpg` |

## Two picks for a scroll-driven page about Taipei memory

1. **Pastel low-poly** as the base look: the only style that is both "bright and pretty" (CJ, 2026-09-20) and feels like a memory, and the long shadows give depth as the camera moves without hiding the buildings.
2. **Cel / toon** as the second choice: keeps every sign readable, costs nothing in fps, and matches the 1990s Ximending chapter, which people remember through anime and comics.
3. Neon is the most striking single frame but it is night, so it contradicts the bright-daylight decision; gouache and pixel hide the sign text that the real-building direction depends on.

## Batch 2: the six styles from the Chinese article, plus two bonus looks

Same street, same two shots. The article sorts models by how they are built (polygon count, skin detail, proportions); our models cannot change, so each row says how far lighting, materials, camera and post honestly get.

| # | Style | What it looks like (plain English) | What it costs on the real page | Pictures |
|---|---|---|---|---|
| 7 | Realism | Physically based look: brick and plaster bumps drawn at load, real sun and sky light, soft shadows, darker corners where walls meet the ground, neutral colour. | Shadow map plus a normals pass plus 12-sample occlusion plus bump maps: roughly 30 percent fps loss. Hides nothing. Effort: one to two days (shadow camera must follow the scroll, bump per asset type). | `shots/realism-dadao.jpg, shots/realism-ximen.jpg` |
| 8 | Unreal / fantasy realism | The realism base at golden hour: light shafts through the trees, violet fog, an oversized moon, floating lanterns, soft bloom. | Realism cost plus bloom (three passes) plus shafts (four quarter-size passes): roughly 40 percent fps loss. Dusk palette fights "bright and pretty". Effort: two days. | `shots/fantasy-dadao.jpg, shots/fantasy-ximen.jpg` |
| 9 | Photorealistic | Seen through a camera lens: shallow focus on the landmark, film colour, vignette, colour fringing at the edges, sensor grain, ACES tone curve. | Realism cost plus three more full-size passes (24-tap focus blur): roughly 40 percent fps loss. Blurs the street sides and any text off centre. Effort: one day, and focus must pull to each anchor while scrolling. | `shots/photoreal-dadao.jpg, shots/photoreal-ximen.jpg` |
| 10 | Low-poly | Every polygon shows as its own flat tone under one clear sun, vivid harmonious colours, faceted hills behind the street, no outlines, no textures. Second shot from a higher angle. | Shadow map only: 10 to 15 percent fps loss. Hides nothing. Effort: half a day (a day with the terrain). | `shots/lowpoly-dadao.jpg, shots/lowpoly-ximen.jpg` |
| 11 | Cartoon (Pixar) | Friendly and juicy: warm key light, cool fill, a rim light on every edge, soft shadows, saturated colour, gentle bloom, big soft sky. | Shadow map plus bloom plus a custom shader: roughly 20 percent fps loss. Hides nothing. Effort: one day. | `shots/cartoon-dadao.jpg, shots/cartoon-ximen.jpg` |
| 12 | Anime | Three soft cel bands, thin coloured outlines, hard highlight streaks on glossy surfaces, painted sky with big clouds, warm light leak, faint lens flare. Softer than the earlier toon. | Toon material is cheaper than today's, one post pass: same fps as today. Hides nothing, signs readable. Effort: half a day. | `shots/anime-dadao.jpg, shots/anime-ximen.jpg` |
| B | Flat 2D (bonus) | Orthographic view, no lighting, every colour snapped to a small hand-picked palette, one hard drop shadow per object. Reads as a vector illustration. | No post, unlit materials: fps goes up. Hides all depth cues and lighting. Effort: half a day, but it only works from one fixed angle, which fights a camera that rides down the street. | `shots/flat2d-dadao.jpg, shots/flat2d-ximen.jpg` |
| 13 | Clay diorama (from CJ's reference) | Candy pastel palette (coral, hot pink, peach, teal, lilac), matte soft-plastic surfaces, soft lilac and peach light, darker corners, no outlines, pale wood floor, dark purple void. The iso shot floats the street on a slab with a big numbered label. | Shadow map plus normals pass plus occlusion plus bloom: roughly 30 percent fps loss. Replaces every original colour, so sign colours change. Effort: one day; the iso diorama is a separate camera from the scroll page. | `shots/clay-dadao.jpg, shots/clay-ximen.jpg, shots/clay-iso.jpg` |

How far each one honestly gets from the article's meaning, given the models cannot change:

- **7 Realism**: Halfway. Lighting and surface are real, but the article's realism means high-polygon detail; these stay 12-face boxes and read as a well-lit toy set.
- **8 Unreal / fantasy realism**: Close. Mood is what the article means and light alone delivers it; only the volumetric shafts are a 2D screen trick, not real fog.
- **9 Photorealistic**: Not reachable. 12-face buildings cannot be photoreal; what you get is a photo of a miniature model set, which is honest but a different look.
- **10 Low-poly**: Fully reached. The models already are low-poly; flat shading just shows it. This is the one style where the article's meaning and our models agree.
- **11 Cartoon (Pixar)**: Halfway. The lighting recipe is real, but Pixar's look comes from rounded high-polygon modelling and skin-like materials; boxes stay boxes.
- **12 Anime**: Mostly reached. Cel bands and painted sky are the real thing; the highlight streaks are fake stripes (no characters, no hair), and building proportions cannot change.
- **B Flat 2D (bonus)**: Fully reached for a still frame; the article's "3D that reads as 2D" needs a fixed angle, so scrolling would have to glide the orthographic camera sideways.
- **13 Clay diorama (from CJ's reference)**: About 70 percent. Palette, matte surfaces, soft light and the void are there; the reference's rounded edges and chunky proportions need remodelling, so corners stay sharp and objects stay thin.

**One to put forward from this batch: low-poly.** It is the only style where the article's category and our models agree, it costs almost nothing, and it is bright and vivid, which is CJ's direction.

The clay diorama (13) comes from CJ's reference picture `shots/ref-clay-iso.jpg`; its third shot `?set=iso` (`shots/clay-iso.jpg`) frames the Ximending street as a floating slab with the "01 / When We Were Young" label. `?set=iso&street=dadao` gives "02 / Spring Festival".

## How these were made

- `style-<name>.html` = `print.html` with the post pass and the lights/materials replaced. Shared street code is identical in all six.
- Screenshots: `agent-browser --headed open "file://.../style-<name>.html?set=dadao"`, viewport set to 1536x1024 before the first screenshot, 2.5 s wait, console checked (empty for all 12).
- No CDN, no image or model files; every effect (paper, clouds, stars, dither, hatching) is procedural in the shader.
