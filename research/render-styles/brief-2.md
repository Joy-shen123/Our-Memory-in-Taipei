# Brief 2: six more looks, from a Chinese article on 3D model styles

CJ read an article that sorts 3D models into six styles and wants to see each one on the same street. Important caveat: the article's categories are about how a model is BUILT (polygon count, skin detail, face proportions). Our models are fixed procedural low-poly and must not be edited, so approximate each style with lighting, materials, camera and post only. Where a style cannot be honestly reached this way, say so in the description line rather than faking it.

Same street code, same two shots (`?set=dadao`, `?set=ximen`), 1536x1024, one self-contained `style-<name>.html` each, screenshots into `out/`, no CDN, no image or model files, procedural only.

| # | Name (article) | What to build |
|---|---|---|
| 7 | Realism 寫實 | Physically based look: MeshStandardMaterial with roughness/metalness set per object type, real sun + sky hemisphere, soft shadow map, ambient occlusion approximation (contact darkening at ground), procedural surface texture (brick bumps, plaster noise via canvas normal/bump maps generated at runtime), neutral colour grade. Serious, grounded. |
| 8 | Unreal / fantasy realism 幻想寫實 | Realism base plus drama: low golden or cold sun, volumetric light shafts through the trees (screen-space radial blur from the sun), coloured fog, oversized moon or lanterns floating, slight bloom. Same street, but a world that does not quite exist. |
| 9 | Photorealistic 相片寫實 | Camera-first: shallow depth of field (depth-based blur on the post pass, focus on the landmark), film colour grade, vignette, chromatic aberration at the edges, subtle sensor grain, correct exposure, ACES tone mapping. Looks like a photo taken of a model set. |
| 10 | Low-poly (Mat Szulik) 低面數 | Faceted flat shading: `flatShading: true` on every material so each polygon shows as a distinct tone, sharp edges, saturated but harmonious palette, a clear single sun direction so facets read, no outlines, no textures. Consider a slightly higher camera (three-quarter view) for the second shot to show the facets. Different from the existing "pastel" style: this one is crisp and vivid, not chalky. |
| 11 | Cartoon (American / Pixar) 卡通 | Rounded, friendly, saturated: warm three-point lighting with a strong rim light, soft shadows, mild subsurface-looking warmth on lit faces, exaggerated colour saturation, gentle bloom on lights, no outlines, big soft sky. A Pixar-style establishing shot. |
| 12 | Anime 日系動漫 | Cel shading with two or three hard bands (MeshToonMaterial with a custom gradient map), thin dark outlines (backface hull or post edge), hair-highlight style specular streaks on glossy surfaces, gradient sky with painted clouds, slight light leak / lens flare, pastel-saturated palette. Differs from the existing "toon": softer palette, thinner lines, painted-background feel like a Makoto Shinkai frame. |

Also, from the article's "3D that reads as 2D" note: if cheap, add one bonus `style-flat2d.html` — orthographic camera, unlit MeshBasicMaterial with hand-set colours, one drop shadow per object, so the scene reads as a flat illustration.

Look at every screenshot yourself before calling it done. Then:
- Add rows 7 to 12 (and the bonus if made) to `out/README.md` and `out/contact-sheet.html` with the same columns: what it looks like in plain English, what it costs on the real page, and one line on how far it honestly gets from the article's meaning given the models cannot change.
- Reply with only: the list of new PNGs and the one style from this batch you would put forward, in one line.
