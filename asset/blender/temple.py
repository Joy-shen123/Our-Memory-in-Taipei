# temple.py — 霞海城隍廟 (Xiahai City God Temple, Dadaocheng, 1859) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/temple.py -- --out asset/models/temple.glb [--preview x.png] [--stats]
#
# Reference (HANDOFF.md): one of Taipei's smallest temples (~150 m²), a single hall facing the
# street: brick side walls, a dark carved wooden front wall with red doors, two thick red porch
# columns at the kerb, a gabled (硬山) brick-orange tiled roof with an ink 燕尾脊 swallowtail
# ridge whose tips sweep up and out past the gables, a name board on the eave (drawn by the
# scene as canvas text, not here), two big red lanterns, an incense burner on the forecourt.
#
# Frame: metres, Blender Z up. scene-dadao.js places the glb at (-8.8, 0, -240) with
# rotation.y = +π/2, so Blender -Y (glTF +Z) → world +x (the road) and Blender +X → world -z.
# The front wall's face is the plane y = 0, the hall runs into +Y, the width (8 m) along X.
# Origin on the ground at the front wall's centre. Sizes match the primitive build:
# hall 8 x 9, walls 5.0, porch columns at y -2.3 (the kerb), roof from y -3.1 to 9.5, ridge at
# z 9.4, swallowtail tips at x ±5.9 up to z 12 (label top is 12.5). The eave's front fascia
# stays at y -3.1 so the scene's name board (at y -3.15, z 4.1..4.95) hangs just in front of it.
#
# Look: primitives, boolean-cut lattice windows, a bevel on every edge, flat palette materials
# (stylized.py owns the mechanics).

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, bm_cylinder, bm_prism, bm_lathe, bm_sphere, rect_pts, face_frame, quad, cubic, solid, cutter

# ── dimensions (metres), from scene-dadao.js ─────────────────────────────────
HW = 4.0            # half width of the hall (x ±4)
DEPTH = 9.0         # hall depth (y 0..9)
WH = 5.0            # wall height
WALK = 0.22         # top of the sidewalk slab the porch stands on
COL_Y = -2.3        # porch columns, the kerb line
COL_X = 3.6
ROOF_Y0, ROOF_Y1 = -3.1, 9.5      # roof span front..back
ROOF_YC = (ROOF_Y0 + ROOF_Y1) / 2  # the ridge line (y 3.2)
ROOF_HALF = (ROOF_Y1 - ROOF_Y0) / 2
ROOF_X = HW + 0.3                 # gable ends just past the walls (硬山: no side overhang)
EAVE_Z = 5.5                      # top of the eave beam, the roof's bottom edge
RIDGE_Z = 9.4                     # roof apex
TIP_X, TIP_Z = 5.9, 12.0          # swallowtail tips
DOU_BASE = WH - 0.43              # 4.57: top of the porch beam, foot of the 斗拱 stacks
DOOR_X = 1.3                      # the two door centres
REC_D = 0.46                      # how deep the door recess is cut into the 0.58 front wall


# ─────────────────────────────────────────────────────────────────────────────
# the hall
# ─────────────────────────────────────────────────────────────────────────────
def hall():
    """Brick side and back walls with a pale plinth and two lattice windows per side; the front
    wall is the dark carved wood: two red doors with pale frames and lattice panels between."""
    # side lattice windows: a pale surround cut shallow, then a dark recess with bone bars inside
    sur = S.new_cutter('hall_surround', _bm(lambda bm: [
        bm_solid(bm, rect_pts(1.3, 1.5, 2.2), -0.6, 0.08, face_frame(th, HW, (0, 0, 0)) @ Matrix.Translation((S.face_x_sign(th) * u, 0, 0)))
        for th in (math.pi / 2, 3 * math.pi / 2) for u in (3.0, 6.5)]), 'bone')
    rec = S.new_cutter('hall_recess', _bm(lambda bm: [
        bm_solid(bm, rect_pts(1.0, 1.2, 2.35), -0.6, 0.3, face_frame(th, HW, (0, 0, 0)) @ Matrix.Translation((S.face_x_sign(th) * u, 0, 0)))
        for th in (math.pi / 2, 3 * math.pi / 2) for u in (3.0, 6.5)]), 'ink')
    # the front bay is cut out of the brick box so the wooden wall sits 2 cm behind brick corner
    # posts (no coplanar faces between the two)
    front = cutter('hall_front_cut', 'ink', lambda bm: bm_box(bm, (2 * HW - 0.2, 1.2, WH + 0.2), (0, 0.0, WH / 2)))
    solid('hall_walls', 'brick', lambda bm: bm_box(bm, (2 * HW, DEPTH, WH), (0, DEPTH / 2, WH / 2)), cutters=(front, sur, rec))

    def lattice(bm):
        for th in (math.pi / 2, 3 * math.pi / 2):
            for u in (3.0, 6.5):
                F = face_frame(th, HW, (0, 0, 0)) @ Matrix.Translation((S.face_x_sign(th) * u, 0.18, 0))
                for dx in (-0.25, 0, 0.25):
                    bm_box(bm, (0.06, 0.06, 1.2), (dx, 0, 2.95), F)
                for dz in (2.75, 3.15):
                    bm_box(bm, (1.0, 0.06, 0.06), (0, 0, dz), F)
    solid('hall_lattice', 'bone', lattice, bevel=0.0)
    solid('hall_plinth', 'walk', lambda bm: bm_box(bm, (2 * HW + 0.2, DEPTH + 0.1, 0.45), (0, DEPTH / 2 + 0.05, 0.225)), bevel=0.03)


def front_wall():
    """The carved front (ink), 0.58 thick. Each red door sits at the back of a 0.3 m recess behind
    pale stone jambs, a 門楣 lintel and a 門檻 threshold, instead of standing proud of a flat board."""
    rec = cutter('door_recess', 'ink', lambda bm: [
        bm_box(bm, (1.46, REC_D, 3.36), (x, -0.02 + REC_D / 2, 1.8)) for x in (-DOOR_X, DOOR_X)])
    solid('front_wall', 'ink', lambda bm: bm_box(bm, (2 * HW - 0.2, 0.58, WH), (0, 0.31, WH / 2)), cutters=(rec,))

    def doors(bm):
        for x in (-DOOR_X, DOOR_X):
            bm_box(bm, (1.4, 0.12, 3.2), (x, 0.38, 1.72), None)
    solid('doors', 'verm', doors, bevel=0.03)

    def frames(bm):
        for x in (-DOOR_X, DOOR_X):
            for dx in (-0.78, 0.78):
                bm_box(bm, (0.18, 0.3, 3.62), (x + dx, -0.04, 1.81), None)            # jambs
            bm_box(bm, (1.92, 0.3, 0.26), (x, -0.04, 3.61), None)                     # 門楣 lintel
            bm_box(bm, (1.74, 0.34, 0.2), (x, -0.04, 0.1), None)                      # 門檻 threshold
        bm_box(bm, (2 * HW - 0.2, 0.25, 0.3), (0, -0.05, WH - 0.35), None)            # the carved lintel band
        bm_box(bm, (2 * HW - 0.2, 0.25, 0.2), (0, -0.05, 0.1), None)                  # the sill board
    solid('door_frames', 'bone', frames, bevel=0.03)

    def door_studs(bm):
        for x in (-DOOR_X, DOOR_X):
            for dx in (-0.38, 0.0, 0.38):
                for dz in (1.05, 1.95, 2.85):
                    bm_box(bm, (0.13, 0.08, 0.13), (x + dx, 0.28, dz), None)
    solid('door_studs', 'lamp', door_studs, bevel=0.0)


def stone_window():
    """竹節窗, the bamboo-joint stone window between the two doors: three round bars with joints,
    in a plain stone surround. The real front has one of these in every blind bay."""
    z0, z1 = 1.55, 3.45

    def frame(bm):
        bm_box(bm, (0.86, 0.26, 0.18), (0, -0.04, z0 - 0.09), None)
        bm_box(bm, (0.86, 0.26, 0.18), (0, -0.04, z1 + 0.09), None)
        for dx in (-0.37, 0.37):
            bm_box(bm, (0.12, 0.26, z1 - z0 + 0.36), (dx, -0.04, (z0 + z1) / 2), None)
    solid('window_frame', 'walk', frame, bevel=0.03)

    def bars(bm):
        for dx in (-0.23, 0.0, 0.23):
            bm_cylinder(bm, 0.06, z0, z1, 8, (dx, -0.09))
            for z in (2.03, 2.5, 2.97):
                bm_cylinder(bm, 0.1, z - 0.06, z + 0.06, 8, (dx, -0.09))
    solid('window_bars', 'walk', bars, bevel=0.0)


def wall_relief():
    """The two carved stone 堵 panels beside the doors — a raised frame, a 卷草 scroll spiral and
    two cloud curls standing off the field, a round boss at the eye — and a 石鼓 drum stone at the
    foot of each outer jamb. This is the carved relief the first pass dropped."""
    PX, PZ, PW, PH = 3.05, 2.5, 1.42, 2.5

    def frames(bm):
        for x in (-PX, PX):
            for dz in (-PH / 2, PH / 2):
                bm_box(bm, (PW, 0.2, 0.15), (x, -0.04, PZ + dz), None)
            for dx in (-PW / 2 + 0.075, PW / 2 - 0.075):
                bm_box(bm, (0.15, 0.2, PH), (x + dx, -0.04, PZ), None)
    solid('relief_frames', 'walk', frames, bevel=0.03)

    def carving(bm):
        """A closed 團螭 roundel over three carved bands: continuous rings read as carving, a
        broken spiral reads as damage."""
        for sgn in (-1, 1):
            cx, cz = sgn * PX, PZ + 0.42
            for R, n, t in ((0.44, 14, 0.1), (0.24, 10, 0.08)):
                ring = [(cx + R * math.cos(i * 2 * math.pi / n), cz + R * math.sin(i * 2 * math.pi / n)) for i in range(n)]
                for p, q in zip(ring, ring[1:] + ring[:1]):
                    bm_bar(bm, (p[0], -0.12, p[1]), (q[0], -0.12, q[1]), t)
            for k in range(4):                                       # four cloud spokes off the ring
                a = math.pi / 4 + k * math.pi / 2
                bm_bar(bm, (cx + 0.4 * math.cos(a), -0.11, cz + 0.4 * math.sin(a)),
                       (cx + 0.66 * math.cos(a), -0.11, cz + 0.66 * math.sin(a)), 0.09)
            for dz in (-0.62, -0.86, -1.1):                          # carved bands under the roundel
                bm_box(bm, (PW - 0.44, 0.1, 0.09), (cx, -0.11, PZ + dz), None)
    solid('relief_carving', 'haze', carving, bevel=0.0)

    def boss(bm):
        for x in (-PX, PX):
            bm_lathe(bm, [(0, 0), (0.15, 0), (0.17, -0.07), (0.12, -0.16), (0, -0.2)], 10,
                     Matrix.Translation((x, -0.06, PZ + 0.3)) @ Matrix.Rotation(-math.pi / 2, 4, 'X'))
    solid('relief_boss', 'lamp', boss, bevel=0.0)

    def drums(bm):
        for x in (-DOOR_X - 0.78, DOOR_X + 0.78):
            T = Matrix.Translation((x, -0.19, 0.66)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_cylinder(bm, 0.3, -0.12, 0.12, 14, (0, 0), T)
            bm_box(bm, (0.56, 0.46, 0.4), (x, -0.16, 0.2), None)
    solid('door_drums', 'walk', drums, bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# the porch
# ─────────────────────────────────────────────────────────────────────────────
def gong_pts(L, h, lobes=2):
    """A 栱 arm seen from the side: flat top, the ends cut back, the bottom scalloped into lobes."""
    top, bot = h / 2, -h / 2
    xr = L / 2 - 0.08
    pts = [(-L / 2, top), (L / 2, top), (L / 2, bot + 0.06), (xr, bot)]
    step = 2 * xr / lobes
    for i in range(lobes):
        a, b = xr - i * step, xr - (i + 1) * step
        pts += quad((a, bot), ((a + b) / 2, bot + 0.10), (b, bot), 3)
    pts.append((-L / 2, bot + 0.06))
    return pts


def porch():
    """Two thick red columns on octagonal stone bases at the kerb, a low brick step between them,
    red beams tying the column tops to the hall, and the 斗拱 stacks carrying the eave."""
    def columns(bm):
        for x in (-COL_X, COL_X):
            bm_cylinder(bm, 0.35, WALK + 0.35, DOU_BASE, 12, (x, COL_Y))
    solid('columns', 'verm', columns, bevel=0.03)

    def bases(bm):
        for x in (-COL_X, COL_X):
            bm_prism(bm, 8, 0.5, 0.44, WALK, WALK + 0.35, center=(x, COL_Y))
    solid('column_bases', 'walk', bases, bevel=0.03)
    solid('porch_step', 'brick', lambda bm: bm_box(bm, (2 * COL_X - 0.8, 0.35, 0.5), (0, COL_Y, WALK + 0.25)), bevel=0.03)

    def beams(bm):
        for x in (-COL_X, COL_X):
            bm_box(bm, (0.4, -COL_Y + 0.2, 0.4), (x, COL_Y / 2 + 0.1, DOU_BASE - 0.2), None)   # tie beams to the hall
        bm_box(bm, (2 * COL_X + 0.4, 0.4, 0.5), (0, COL_Y, DOU_BASE - 0.25), None)             # the front beam
    solid('porch_beams', 'verm', beams, bevel=0.03)

    # 斗拱: each stack is a flared 坐斗, a scalloped 栱 across the eave line, a 華栱 projecting out
    # under it, and three 升 blocks carrying the eave beam. Red blocks, pale arms, as on the real
    # temple. Front stacks sit over the porch, side stacks under the gable eaves.
    STACKS = [(x, COL_Y, True) for x in (-COL_X, -1.8, 0.0, 1.8, COL_X)]
    STACKS += [(sx * (HW + 0.05), y, False) for sx in (-1, 1) for y in (1.5, 4.5, 7.5)]

    def blocks(bm):
        for x, y, along_x in STACKS:
            T = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(0 if along_x else math.pi / 2, 4, 'Z')
            bm_prism(bm, 4, 0.20, 0.27, DOU_BASE, DOU_BASE + 0.21, rot=math.pi / 4, xform=T)      # 坐斗
            for u in (-0.55, 0.0, 0.55):
                bm_prism(bm, 4, 0.11, 0.15, DOU_BASE + 0.43, DOU_BASE + 0.55, rot=math.pi / 4,
                         xform=T, center=(u, 0))                                                  # 升
    solid('brackets', 'verm', blocks, bevel=0.025)

    def arms(bm):
        for x, y, along_x in STACKS:
            R = Matrix.Rotation(0 if along_x else math.pi / 2, 4, 'Z')
            T = Matrix.Translation((x, y, DOU_BASE + 0.32)) @ R
            bm_solid(bm, gong_pts(1.30, 0.22), -0.12, 0.12, T)                                    # 栱
            bm_solid(bm, gong_pts(0.92, 0.18, 1), -0.09, 0.09, T @ Matrix.Rotation(math.pi / 2, 4, 'Z'))  # 華栱
    solid('bracket_arms', 'bone', arms, bevel=0.025)


# ─────────────────────────────────────────────────────────────────────────────
# the roof
# ─────────────────────────────────────────────────────────────────────────────
def slope_pts(n=7):
    """One roof slope as (u, z) from the front eave to the apex, gently concave the Chinese way."""
    return quad((-ROOF_HALF, EAVE_Z + 0.05), (-ROOF_HALF * 0.55, EAVE_Z + 0.5), (0, RIDGE_Z), n, include_start=True)


def roof():
    """The eave beam, the gabled tiled roof (a concave-sloped prism along X), tile courses as
    thin bars down each slope, pale verge boards on the gable edges and eave rims, and the
    ridge with its swallowtail tails and painted band."""
    solid('eave_beam', 'ink', lambda bm: bm_box(bm, (2 * HW + 0.8, ROOF_Y1 - ROOF_Y0, 0.4), (0, ROOF_YC, EAVE_Z - 0.2)), bevel=0.03)
    # the roof body: profile in (u, z) across the roof, extruded along X. bm_solid extrudes an
    # X-Z profile along Y, so build it and turn it 90° about Z (profile x → -y).
    front = slope_pts()
    back = [(-u, z) for u, z in reversed(front[:-1])]
    top = front + back
    prof = [(-ROOF_HALF, EAVE_Z - 0.28), (ROOF_HALF, EAVE_Z - 0.28)] + list(reversed(top))
    T = Matrix.Translation((0, ROOF_YC, 0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z')
    solid('roof', 'brick', lambda bm: bm_solid(bm, prof, -ROOF_X, ROOF_X, T), bevel=0.06)

    def courses(bm):
        pts = slope_pts(12)
        for u, z in pts[1:-1]:
            for sgn in (-1, 1):
                y = ROOF_YC + sgn * u
                bm_bar(bm, (-ROOF_X + 0.1, y, z + 0.06), (ROOF_X - 0.1, y, z + 0.06), 0.13)
    solid('tile_courses', 'brick', courses, bevel=0.0)

    def verges(bm):
        pts = slope_pts(8)
        for x in (-ROOF_X - 0.02, ROOF_X + 0.02):
            for (u0, z0), (u1, z1) in zip(pts, pts[1:]):
                for sgn in (-1, 1):
                    bm_bar(bm, (x, ROOF_YC + sgn * u0, z0 + 0.08), (x, ROOF_YC + sgn * u1, z1 + 0.08), 0.22)
        for y in (ROOF_Y0, ROOF_Y1):
            bm_bar(bm, (-ROOF_X, y, EAVE_Z - 0.05), (ROOF_X, y, EAVE_Z - 0.05), 0.24)   # eave rims
    solid('verges', 'bone', verges, bevel=0.03)


def ridge():
    """燕尾脊: an ink band along the apex, sagging in the middle, its ends sweeping up and out
    into the forked tails past the gables; a red painted band on the sag; a pearl at the centre."""
    band_z = RIDGE_Z - 0.2
    inner = 4.3
    # right half outline, from the bottom at the centre out to the tail and back in over the top
    right = [(0, band_z), (4.6, band_z)]
    right += quad((4.6, band_z), (TIP_X - 0.15, band_z + 1.0), (TIP_X, TIP_Z - 0.15), 5)    # outer edge up to the tip
    right += [(TIP_X - 0.22, TIP_Z), (TIP_X - 0.45, TIP_Z - 0.3)]                               # the fork's notch
    right += quad((TIP_X - 0.45, TIP_Z - 0.3), (5.35, RIDGE_Z + 1.05), (inner, RIDGE_Z + 0.8), 5)  # inner edge back down
    right += quad((inner, RIDGE_Z + 0.8), (0, RIDGE_Z + 0.25), (0, RIDGE_Z + 0.55), 5)         # the sag to the centre top
    left = [(-x, z) for x, z in reversed(right[1:-1])]
    prof = right + left
    solid('ridge', 'ink', lambda bm: bm_solid(bm, prof, ROOF_YC - 0.28, ROOF_YC + 0.28, None), bevel=0.04)

    def band(bm):
        top = quad((-inner + 0.3, RIDGE_Z + 0.62), (0, RIDGE_Z + 0.1), (inner - 0.3, RIDGE_Z + 0.62), 8, include_start=True)
        bottom = [(x, z - 0.34) for x, z in reversed(top)]
        bm_solid(bm, top + bottom, ROOF_YC - 0.34, ROOF_YC + 0.34, None)
    solid('ridge_band', 'verm', band, bevel=0.03)

    def pearl(bm):
        bm_sphere(bm, 0.3, (0, ROOF_YC, RIDGE_Z + 0.85), 12, 8)
        bm_box(bm, (0.5, 0.5, 0.12), (0, ROOF_YC, RIDGE_Z + 0.5), None)
    solid('ridge_pearl', 'lamp', pearl, bevel=0.0)


def ridge_dragons():
    """雙龍搶珠: one 剪黏 dragon on each half of the ridge, its tail out over the swallowtail and
    its head reared in toward the pearl. The spine is a shallow cubic S that hugs the ridge, the
    body a chain of bars tapering from the tail to the neck, with a swept-back comb, two clawed
    legs, a blocky head with an upturned snout and horns, and a fanned tail. Thin bars, no bevel."""
    y0 = ROOF_YC
    spine = cubic((4.35, RIDGE_Z + 0.95), (3.5, RIDGE_Z + 1.85), (2.2, RIDGE_Z + 0.75),
                  (1.25, RIDGE_Z + 1.25), 10, include_start=True)
    N = len(spine)
    wave = [0.10 * math.sin(i * math.pi / 3) for i in range(N)]   # a little off the ridge plane

    def pt(sgn, i):
        return (sgn * spine[i][0], y0 + wave[i], spine[i][1])

    def axes(i):
        """Unit tangent and the up-ish normal of the spine at vertex i, in the X-Z plane."""
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, N - 1)]
        d = Vector((b[0] - a[0], 0.0, b[1] - a[1])).normalized()
        n = Vector((-d.z, 0.0, d.x))
        return d, (n if n.z >= 0 else -n)

    def body(bm):
        for sgn in (-1, 1):
            for i in range(N - 1):
                t = 0.10 + 0.17 * (i / (N - 2)) ** 0.8
                bm_bar(bm, pt(sgn, i), pt(sgn, i + 1), t)
    solid('dragon_body', 'verm', body, bevel=0.0)

    def comb(bm):
        for sgn in (-1, 1):
            for i in range(2, N - 1, 2):
                d, n = axes(i)
                v = (n - d * 0.5).normalized() * 0.15          # swept back toward the tail
                p = pt(sgn, i)
                bm_bar(bm, p, (p[0] + sgn * v.x, p[1], p[2] + v.z), 0.06, t2=0.2)
    solid('dragon_comb', 'lamp', comb, bevel=0.0)

    def head(bm):
        for sgn in (-1, 1):
            hx, hz = sgn * spine[-1][0], spine[-1][1]
            y = y0 + wave[-1]
            bm_box(bm, (0.52, 0.38, 0.38), (hx - sgn * 0.22, y, hz + 0.08), None)       # skull
            bm_box(bm, (0.36, 0.26, 0.2), (hx - sgn * 0.56, y, hz + 0.02), None)        # snout
            bm_box(bm, (0.2, 0.22, 0.16), (hx - sgn * 0.7, y, hz + 0.16), None)         # upturned nose
            bm_box(bm, (0.34, 0.3, 0.1), (hx - sgn * 0.52, y, hz - 0.15), None)         # jaw
            for dy in (-0.17, 0.17):
                bm_bar(bm, (hx - sgn * 0.12, y + dy, hz + 0.2),
                       (hx + sgn * 0.3, y + dy, hz + 0.52), 0.07)                       # horns, swept back
    solid('dragon_head', 'verm', head, bevel=0.025)

    def eyes(bm):
        for sgn in (-1, 1):
            hx, hz = sgn * spine[-1][0], spine[-1][1]
            for dy in (-0.2, 0.2):
                bm_sphere(bm, 0.075, (hx - sgn * 0.36, y0 + wave[-1] + dy, hz + 0.14), 8, 6)
    solid('dragon_eyes', 'ink', eyes, bevel=0.0)

    def legs(bm):
        for sgn in (-1, 1):
            for i in (3, 7):
                c, y = pt(sgn, i), y0 + wave[i]
                for dy in (-0.15, 0.15):
                    knee = (c[0] - sgn * 0.2, y + dy * 1.5, c[2] - 0.26)
                    bm_bar(bm, (c[0], y + dy * 0.7, c[2]), knee, 0.085)
                    bm_bar(bm, knee, (knee[0] - sgn * 0.02, knee[1], knee[2] - 0.24), 0.07)
    solid('dragon_legs', 'verm', legs, bevel=0.0)

    def claws(bm):
        for sgn in (-1, 1):
            for i in (3, 7):
                c, y = pt(sgn, i), y0 + wave[i]
                for dy in (-0.15, 0.15):
                    bm_box(bm, (0.2, 0.16, 0.1), (c[0] - sgn * 0.24, y + dy * 1.5, c[2] - 0.55), None)
    solid('dragon_claws', 'lamp', claws, bevel=0.0)

    def tail(bm):
        for sgn in (-1, 1):
            tx, tz = spine[0]
            for a, L in ((0.35, 0.5), (0.85, 0.66), (1.35, 0.5)):
                bm_bar(bm, (sgn * tx, y0 + wave[0], tz),
                       (sgn * (tx + L * math.cos(a)), y0 + wave[0], tz - 0.04 + L * math.sin(a)), 0.06, t2=0.19)
    solid('dragon_tail', 'lamp', tail, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# lanterns and the incense burner
# ─────────────────────────────────────────────────────────────────────────────
LAN_Y, LAN_Z = -2.5, 3.7


def lanterns():
    def body(bm):
        for x in (-2.0, 2.0):
            bm_sphere(bm, 0.5, (x, LAN_Y, LAN_Z), 14, 10, scale_z=0.86)
    solid('lanterns', 'verm', body, bevel=0.0)

    def caps(bm):
        for x in (-2.0, 2.0):
            bm_cylinder(bm, 0.2, LAN_Z + 0.36, LAN_Z + 0.52, 10, (x, LAN_Y))       # top cap
            bm_cylinder(bm, 0.2, LAN_Z - 0.52, LAN_Z - 0.36, 10, (x, LAN_Y))       # bottom cap
            bm_bar(bm, (x, LAN_Y, LAN_Z + 0.5), (x, LAN_Y, DOU_BASE - 0.05), 0.05)  # cord up to the beam
            bm_bar(bm, (x, LAN_Y, LAN_Z - 0.85), (x, LAN_Y, LAN_Z - 0.5), 0.05)     # tassel cord
    solid('lantern_caps', 'ink', caps, bevel=0.0)

    def tassels(bm):
        for x in (-2.0, 2.0):
            bm_lathe(bm, [(0, LAN_Z - 0.85), (0.1, LAN_Z - 0.9), (0.08, LAN_Z - 1.2), (0, LAN_Z - 1.25)], 8)
    solid('lantern_tassels', 'lamp', tassels, bevel=0.0)


def burner():
    """The incense burner on the forecourt: a lathe pot on three legs with ear handles and a lid ring."""
    x, y = 0.0, -1.9
    T = Matrix.Translation((x, y, 0))

    def pot(bm):
        bm_lathe(bm, [(0, WALK + 0.5), (0.34, WALK + 0.5), (0.52, WALK + 0.72), (0.54, WALK + 1.05), (0.46, WALK + 1.22),
                      (0.4, WALK + 1.36), (0, WALK + 1.36)], 14, T)
        for i in range(3):
            a = math.pi / 2 + i * 2 * math.pi / 3
            bm_cylinder(bm, 0.08, WALK, WALK + 0.55, 8, (x + 0.34 * math.cos(a), y + 0.34 * math.sin(a)))
        for sx in (-1, 1):                                                          # ear handles
            bm_box(bm, (0.14, 0.22, 0.34), (x + sx * 0.6, y, WALK + 1.35), None)
            bm_box(bm, (0.22, 0.22, 0.1), (x + sx * 0.52, y, WALK + 1.2), None)
    solid('burner', 'ink', pot, bevel=0.0)
    solid('burner_rim', 'haze', lambda bm: bm_lathe(bm, [(0.3, WALK + 1.36), (0.42, WALK + 1.36), (0.42, WALK + 1.46), (0.3, WALK + 1.46)], 14, T), bevel=0.0)


def _bm(fn):
    """Run fn(bm) on a fresh bmesh and return it (for cutters built from a comprehension)."""
    import bmesh
    bm = bmesh.new()
    fn(bm)
    return bm


def build():
    hall()
    front_wall()
    stone_window()
    wall_relief()
    porch()
    roof()
    ridge()
    ridge_dragons()
    lanterns()
    burner()


if __name__ == '__main__':
    # preview: from the road, three-quarter, in this file's frame
    S.run(build, camera=((12.0, -14.0, 5.0), (0.0, 2.0, 4.0), 45))
