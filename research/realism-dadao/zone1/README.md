# Zone 1 — entrance and lantern canopy

CJ, 2026-09-24: “Read docs/briefs/ADDENDUM-lanterns.md and fold it into your zone 1 work”. The addendum quotes: 「年貨大街的燈籠也應該要垂下來像布條一樣 給他們物理是不是比較好」. Its explicit scope extends the canopy through all of Dadaocheng.

## References and diagnosis

Visually inspected `refs/3-nianhuo-entrance-pillar.png` for a temporary printed festival portal and `refs/4-lanterns-yongle-tiger.png` for closely spaced rows of multicolored lanterns; `refs/1-shophouses-arcade.png` and `refs/5-arcade-perspective-scooters.png` for the arcade and parked scooters. The photograph dates are unknown. The zodiac mascots are not imported into the 2000–2019 chapter.

Read `issue-18-archway:asset/blender/nianhuo_archway.py` and its `scene-dadao.js` placement before editing the entrance. Adapted the portal proportions and structural depth with the original site palette; did not merge the branch or import its violet colors and undated tiger. `asset/blender/dadao-entrance.py` owns the new portal and scooter geometry. The resulting GLB is 37,124 bytes.

Read `main:scene-red.js` lines 556–584. Its banners use a sampled static mesh with a parabolic bow, not an actual catenary. This scene adopts that build-once approach but uses the addendum's cosh curve.

## Ranked changes and result

1. Replace straight red rows with a canopy: 33 rows in groups of three, 363 plumb lanterns, seven colors derived from the existing palette. Span 12.4 m, catenary parameter 20.8 m, support height 8.15 m; sag approximately 0.931 m (7.5%). Caps, vertical suspension cords and tassels make the bodies read as hung objects. Wires share one merged mesh; bodies, caps and cords are instanced. No physics library, per-frame CPU work or optional sway.
2. Replace the old generic arch with a deep temporary portal, wrapped columns, diamond borders and a readable name band. Replace the floating rigid street banners with subdivided, sagging cloth attached by corner ties.
3. Continue reference-based façades through the entrance's procedural bays and replace block scooters with wheels, body panels, seats, handlebars and mirrors. Remove the historical tricycle. Preserve the old seeded random sequence so unrelated scene placement stays stable.

## Verification

Baseline captured after the zone 2 commit and before these changes, at progress 0.35 (1440×900). `../verification/before-1.json` and `after-1.json` contain two headed performance runs at 0.38, 0.44 and 0.52, plus the matched camera coordinates. The final report records edge-density results and full validation. The canopy is intentionally static.

Commands: `node scripts/verify-realism.cjs before 1`, `node scripts/verify-realism.cjs after 1`, and `python3 scripts/detail-metric.py research/realism-dadao/verification/zone1-before.png research/realism-dadao/verification/zone1-after.png`.

Rebuild: `/Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/dadao-entrance.py -- --out asset/models/dadao-entrance.glb`.
