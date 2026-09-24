# chunghwa.py — one 中華商場 block (Chunghwa Market, 1961–1992) and the bridge between two
# blocks, as a stylized glb with two groups, 'block' and 'bridge', which scene-red.js instances.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/chunghwa.py -- --out asset/models/chunghwa.glb [--preview x.png] [--stats]
#
# Reference (research/realism-ximen/zone2-chunghwa/README.md): eight joined three-storey
# concrete blocks along 中華路. The road face, the one the street sees:
#   - ground floor: a 3.5 m arcade (騎樓) behind square piers, a deep soffit with fluorescent
#     tubes (painted), shops opening into it, a signboard band on the fascia (the text is
#     canvas in the scene);
#   - floors 2 and 3: open corridors 3 m deep behind solid concrete parapet walls, square
#     columns rising through every floor, each floor slab a strong horizontal band, canvas
#     awnings over the 2nd-floor bays by 1990; no window bands, no balconies;
#   - end walls: a tall panel of concrete lattice (breeze block), with 中華商場 and the block
#     number painted beside it (canvas in the scene);
#   - flat roof with water tanks and stair heads (the rooftop neon stays scene parts).
# The bridges (1969–74) joined neighbouring blocks at 2nd-floor level: open decks, solid
# parapet panels and steel bar railings, painted pale green.
#
# Frame: metres, Blender Z up. The road face is the plane y = 0 and faces -Y, which the
# exporter turns into +Z; scene-red.js rotates it +π/2 so it looks at the road from the west.
# Depth runs into +y, the block's length along X about 0, origin on the ground at the road
# face's centre. The -X end is the north end, the one the camera sees walking south.
#
# Look (CJ 2026-09-24, the Arcane method): the silhouette only, box-mapped UVs (4 m per UV unit)
# for the painted concrete; the shop fronts, lattice, stripes and stains are painted by
# asset/paint/chunghwa_paint.py and laid on by scene-red.js.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, bm_cylinder, rect_pts, solid, cutter

# ── dimensions (metres) ──────────────────────────────────────────────────────
L = 9.4             # block length along the street (X); scene-red.js places them L + GAP apart
GAP = 2.6           # the cross street between two blocks, spanned by the bridge
FLOOR = 3.3         # storey height
FLOORS = 3          # the real count; 2 gives CJ's lower street back (see scene-red.js)
DEPTH = 10.0        # into +y
ARCADE = 3.5        # ground-floor arcade depth: the shop wall stands at y = ARCADE
CORR = 3.0          # upper corridor depth: the shop wall upstairs stands at y = CORR
SLAB = 0.34         # the floor-slab band
PARA = 1.05         # parapet height above the slab
TOP = FLOOR * FLOORS
COL_XS = [-L / 2 + 0.3 + k * (L - 0.6) / 4 for k in range(5)]          # 4 bays
BAY_XS = [(COL_XS[k] + COL_XS[k + 1]) / 2 for k in range(4)]
BAY_W = COL_XS[1] - COL_XS[0] - 0.5
UNIT_XS = [-L / 2 + 0.95 + k * 1.9 for k in range(5)]                   # 2 m shop units


def body():
    """The concrete mass behind the arcade and corridors, full depth, up to the roof. Plain: the
    shop fronts on its road faces are painted (chunghwa-shops.webp) on planes the scene lays there."""
    g = 'block'
    solid('ground_mass', 'walk', lambda bm: bm_box(bm, (L, DEPTH - ARCADE, FLOOR), (0, (ARCADE + DEPTH) / 2, FLOOR / 2)), group=g)
    for f in range(1, FLOORS):
        z0 = f * FLOOR
        solid(f'upper_mass_{f}', 'walk', lambda bm, z0=z0: bm_box(bm, (L, DEPTH - CORR, FLOOR), (0, (CORR + DEPTH) / 2, z0 + FLOOR / 2)), group=g)


def frame():
    """Piers and columns through every floor, the slab bands, the parapets."""
    g = 'block'
    def cols(bm):
        for x in COL_XS:
            bm_box(bm, (0.5, 0.55, TOP), (x, 0.2, TOP / 2))
    solid('columns', 'bone', cols, group=g)
    def slabs(bm):
        for f in range(1, FLOORS + 1):
            z = f * FLOOR
            back = ARCADE if f == 1 else CORR
            bm_box(bm, (L + 0.1, back + 0.25, SLAB), (0, back / 2 - 0.12, z - SLAB / 2))
    solid('slabs', 'bone', slabs, group=g)
    # the soffits: the underside of each slab over the arcade and corridors
    def soffit(bm):
        for f in range(1, FLOORS):
            back = ARCADE if f == 1 else CORR
            bm_box(bm, (L - 0.05, back, 0.06), (0, back / 2, f * FLOOR - SLAB - 0.03))
    solid('soffit', 'haze', soffit, bevel=0.0, group=g)
    # parapet walls between the columns on floors 2 and 3, and the low roof parapet
    def parapets(bm):
        for f in range(1, FLOORS):
            z = f * FLOOR
            for x in BAY_XS:
                bm_box(bm, (BAY_W + 0.02, 0.2, PARA), (x, 0.05, z + PARA / 2))
        for x in BAY_XS:
            bm_box(bm, (BAY_W + 0.02, 0.2, 0.7), (x, 0.05, TOP + 0.35))
    solid('parapets', 'walk', parapets, bevel=0.04, group=g)
    def coping(bm):
        for f in range(1, FLOORS + 1):
            z = f * FLOOR + (PARA if f < FLOORS else 0.7)
            bm_box(bm, (L + 0.05, 0.3, 0.08), (0, 0.05, z + 0.04))
    solid('coping', 'bone', coping, bevel=0.02, group=g)
    # the roof slab over everything behind the corridors
    solid('roof', 'haze', lambda bm: bm_box(bm, (L, DEPTH - 0.1, 0.3), (0, DEPTH / 2 + 0.05, TOP + 0.15)), bevel=0.03, group=g)
    # the fascia over the arcade that carries the signboard band (text is canvas in the scene)
    solid('fascia', 'bone', lambda bm: bm_box(bm, (L, 0.16, 0.52), (0, -0.1, FLOOR - SLAB - 0.2)), bevel=0.02, group=g)


def awnings():
    """Canvas awnings over the 2nd-floor corridor bays, sloping out; the stripes are painted."""
    g = 'block'
    z = FLOOR + 2.55
    tilt = Matrix.Rotation(math.radians(24), 4, 'X')
    def red(bm):
        for x in BAY_XS:
            bm_box(bm, (BAY_W - 0.1, 1.0, 0.04), (0, 0, 0), Matrix.Translation((x, -0.25, z)) @ tilt)
    solid('awning', 'verm', red, bevel=0.0, group=g)


def ends():
    """The north end wall (-X). The lattice panel, 中華商場 and the number are painted on it."""
    g = 'block'
    x0 = -L / 2
    # the solid end wall over the arcade, closing the corridors' ends; the arcade stays open
    solid('end_wall', 'walk', lambda bm: bm_box(bm, (0.3, DEPTH, TOP - FLOOR + SLAB), (x0 + 0.15, DEPTH / 2, FLOOR - SLAB + (TOP - FLOOR + SLAB) / 2)), group=g)


def rooftop():
    """Stair heads and water tanks on the bare roof."""
    g = 'block'
    z0 = TOP + 0.3
    solid('stair_head', 'bone', lambda bm: bm_box(bm, (2.2, 2.6, 1.8), (1.6, 6.5, z0 + 0.9)), group=g)
    solid('stair_door', 'ink', lambda bm: bm_box(bm, (0.8, 0.1, 1.4), (1.6, 5.16, z0 + 0.7)), bevel=0.0, group=g)
    def tank(bm):
        for cx in (-2.4, 3.6):
            for sx in (-1, 1):
                for sy in (-1, 1):
                    bm_box(bm, (0.12, 0.12, 0.9), (cx + sx * 0.5, 7.6 + sy * 0.5, z0 + 0.45))
            bm_cylinder(bm, 0.75, z0 + 0.9, z0 + 2.0, n=14, center=(cx, 7.6))
    solid('water_tank', 'haze', tank, bevel=0.03, group=g)


def bridge():
    """The 2nd-floor bridge across the cross street to the next block, open deck, pale green."""
    g = 'bridge'
    span, w, z = GAP + 0.6, 2.6, FLOOR
    solid('deck', 'bone', lambda bm: bm_box(bm, (span, w, 0.3), (0, 1.6, z - 0.15)), group=g)
    solid('girders', 'leaf', lambda bm: [bm_box(bm, (span, 0.22, 0.5), (0, 1.6 + s * (w / 2 - 0.12), z - 0.55)) for s in (-1, 1)], bevel=0.03, group=g)
    def panels(bm):
        for s in (-1, 1):
            bm_box(bm, (span - 0.2, 0.08, 0.45), (0, 1.6 + s * (w / 2 - 0.05), z + 0.23))
    solid('panels', 'bone', panels, bevel=0.02, group=g)
    def rails(bm):
        for s in (-1, 1):
            y = 1.6 + s * (w / 2 - 0.05)
            bm_box(bm, (span, 0.06, 0.06), (0, y, z + 1.05))
            n = int(span / 0.22)
            for i in range(n + 1):
                bm_box(bm, (0.035, 0.035, 0.6), (-span / 2 + i * span / n, y, z + 0.75))
    solid('rails', 'leaf', rails, bevel=0.0, group=g)


def build():
    body()
    frame()
    awnings()
    ends()
    rooftop()
    bridge()


if __name__ == '__main__':
    S.run(build, camera=((-16, -14, 7), (0, 2, 5), 45), uvs=4.0)
