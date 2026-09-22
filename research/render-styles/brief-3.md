# Brief 3: one more look, from a reference picture CJ sent

Look at `ref-clay-iso.png` in this directory (Read it as an image). It is an isometric "clay diorama" render, the look Blender Eevee hobbyists use for a small room in a box: candy pastel palette (coral, teal, lilac, hot pink, peach), matte soft-plastic materials with no specular hotspots, soft area lighting with gentle ambient occlusion in corners, rounded edges, no outlines, a dark purple void around the diorama, a big numbered label on one wall.

Build `style-clay.html` on the same street code. Two shots as before (`?set=dadao`, `?set=ximen`), plus a third `?set=iso` that frames the street as a diorama: orthographic camera from the classic isometric angle (rotated 45 degrees, tilted about 35 degrees down), a cut-out floor slab under the street so it floats in the dark void, and a big "01 / When We Were Young" or "02 / Spring Festival" label on the back wall or floor, in the reference's white rounded sans.

How to get the look with the models unchanged:
- Traverse every material and remap its colour to the nearest of a 8 to 10 colour candy palette you set (keep dark-vs-light so signs stay legible), set roughness 0.9 metalness 0, MeshStandardMaterial or MeshLambert.
- Lighting: large soft key (a big RectAreaLight or several point lights with distance falloff), bright hemisphere fill tinted lilac from the sky and warm peach from the ground, no hard shadow, or a very soft shadow map with large radius.
- Post: cheap screen-space ambient occlusion approximation from the depth buffer (darken where depth changes under the pixel), slight bloom, gentle vignette toward the dark purple void, a touch of film grain. No outlines.
- Floor and road get the reference's pale wood plank tone; the "void" background is #1c1530.

Screenshots into `out/clay-dadao.png`, `out/clay-ximen.png`, `out/clay-iso.png`. Look at each one yourself and compare with the reference before calling it done. Add a row to `out/README.md` and `out/contact-sheet.html` with the same columns. Reply with only the three PNG paths and one line on how close it got to the reference.
