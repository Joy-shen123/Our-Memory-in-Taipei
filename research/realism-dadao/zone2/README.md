# Zone 2 — reference-based shophouses

CJ, 2026-09-24: “Redo zone 2 properly, then finish zones 1, 3 and 4.” This supersedes the earlier zone-2-only preview stop. The starting state for this comparison is the previous uncommitted attempt, not HEAD.

## Evidence inspected

All six supplied photographs in `refs/` were visually inspected before editing. `1-shophouses-arcade.png`, `2-shophouses-vents-plaques.png` and `5-arcade-perspective-scooters.png` show recessed arcades, close-set window grids, fanlights, masonry joints, stone name panels and pierced parapets. `6-shop-interior-bins.png` shows the shallow divided counters and open interiors. The dates and photographers of these supplied screenshots are unknown; the architecture is used as a surviving-building reference, not evidence for a particular festival year.

[National Central Library, A View of Dihua Street in Taipei](https://tme.ncl.edu.tw/en/old-photographs/visual-feast/street-scenes/3421-a-view-of-dihua-street-in-taipei) supplies the historical context for the Minnan, Western and Neo-Baroque mixture. Search text was retrieved; the full page returned HTTP 500. No unviewed image is claimed as visually inspected.

## Diagnosis and ranked changes

1. Highest improvement per hour: replace repeated sparse window openings with the three-window rhythm, divided sashes, fanlights, plaque surrounds and true ground-floor arches seen in the photographs.
2. Give neighboring properties different widths and heights without stretching doors: eight east bays use widths from 3.9 to 5.3 m; a separate upper-floor module adds occasional third storeys.
3. Build pierced ceramic parapets and shaped plaster gables, plus a low tiled Minnan roof. Keep the palette and daylight.
4. Open the shopfronts, add two tiers of divided goods bins, merchant signs and breaks between festival stalls. A procedural brick bond uses only palette-relative shading, with planar UVs on the new model.

## Result

`asset/blender/dihua-zone2.py` rebuilds `asset/models/dihua-zone2.glb`: 6,224 triangles, 280,924 bytes. Shared arcade geometry avoids exporting the same interior three times. Only complete bays inside z −190 to −230 use this asset in this commit; adjacent-zone changes follow separately.

Matched desktop progress 0.44, camera z −203.562542, 1440×900. Edge density: **14.4% → 19.4%**. Micro-contrast: **0.081 → 0.088**. The improvement is visible but remains below the metric script's photographic target of 29.4%; a full frame includes sky, road and page typography, so this is a comparative detail measure, not an accuracy score.

Screenshots and raw browser results are in `../verification/`. `zone2-comparison.png` is before left, after right. Headed performance, mobile and scene rerun results are in `after-2.json`. The existing optional music-manifest and favicon 404s are recorded rather than hidden; the empty-console bar cannot be claimed.

Verify: `node scripts/verify-realism.cjs after 2` and `python3 scripts/detail-metric.py research/realism-dadao/verification/zone2-before.png research/realism-dadao/verification/zone2-after.png`.

Rebuild: `/Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/dihua-zone2.py -- --out asset/models/dihua-zone2.glb`.
