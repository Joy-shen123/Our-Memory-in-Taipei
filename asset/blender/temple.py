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
from stylized import bm_box, bm_bar, bm_solid, bm_cylinder, bm_prism, bm_lathe, bm_sphere, rect_pts, face_frame, quad, solid, cutter

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
    """The carved wooden front (ink), 0.6 thick, with two red doors in pale frames, a lattice
    panel between them and one beside each door, and a carved beam band along the top."""
    solid('front_wall', 'ink', lambda bm: bm_box(bm, (2 * HW - 0.2, 0.58, WH), (0, 0.31, WH / 2)))

    def doors(bm):
        for x in (-1.3, 1.3):
            bm_box(bm, (1.2, 0.12, 3.0), (x, -0.02, 1.5 + 0.1), None)
    solid('doors', 'verm', doors, bevel=0.03)

    def frames(bm):
        for x in (-1.3, 1.3):
            bm_box(bm, (0.16, 0.2, 3.3), (x - 0.68, -0.05, 1.75), None)
            bm_box(bm, (0.16, 0.2, 3.3), (x + 0.68, -0.05, 1.75), None)
            bm_box(bm, (1.52, 0.2, 0.16), (x, -0.05, 3.32), None)
        bm_box(bm, (2 * HW - 0.2, 0.25, 0.3), (0, -0.05, WH - 0.35), None)       # the carved lintel band
        bm_box(bm, (2 * HW - 0.2, 0.25, 0.2), (0, -0.05, 0.1), None)             # the sill board
    solid('door_frames', 'bone', frames, bevel=0.03)

    def door_studs(bm):
        for x in (-1.3, 1.3):
            for dx in (-0.3, 0.3):
                for dz in (1.0, 2.0, 2.7):
                    bm_box(bm, (0.14, 0.08, 0.14), (x + dx, -0.1, dz), None)
    solid('door_studs', 'lamp', door_studs, bevel=0.0)

    def panels(bm):
        for x, w in ((0.0, 1.1), (-3.1, 1.4), (3.1, 1.4)):
            n = 3 if w < 1.2 else 4
            for i in range(n):
                dx = -w / 2 + 0.15 + i * (w - 0.3) / (n - 1)
                bm_box(bm, (0.06, 0.1, 1.9), (x + dx, -0.04, 2.6), None)
            for dz in (1.9, 2.6, 3.3):
                bm_box(bm, (w - 0.2, 0.1, 0.06), (x, -0.04, dz), None)
    solid('front_lattice', 'bone', panels, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the porch
# ─────────────────────────────────────────────────────────────────────────────
def porch():
    """Two thick red columns on octagonal stone bases at the kerb, a low brick step between
    them, red beams tying the column tops to the hall, and the bracket stacks under the eave."""
    def columns(bm):
        for x in (-COL_X, COL_X):
            bm_cylinder(bm, 0.35, WALK + 0.35, WH + 0.1, 12, (x, COL_Y))
    solid('columns', 'verm', columns, bevel=0.03)

    def bases(bm):
        for x in (-COL_X, COL_X):
            bm_prism(bm, 8, 0.5, 0.44, WALK, WALK + 0.35, center=(x, COL_Y))
    solid('column_bases', 'walk', bases, bevel=0.03)
    solid('porch_step', 'brick', lambda bm: bm_box(bm, (2 * COL_X - 0.8, 0.35, 0.5), (0, COL_Y, WALK + 0.25)), bevel=0.03)

    def beams(bm):
        for x in (-COL_X, COL_X):
            bm_box(bm, (0.4, -COL_Y + 0.2, 0.4), (x, COL_Y / 2 + 0.1, WH - 0.3), None)   # tie beams to the hall
        bm_box(bm, (2 * COL_X + 0.4, 0.4, 0.5), (0, COL_Y, WH - 0.35), None)            # the front beam between the columns
    solid('porch_beams', 'verm', beams, bevel=0.03)

    def brackets(bm):
        # 斗拱, simplified: a red block, a pale arm, a wider red arm, stepping out under the eave
        def stack(x, y, along_x):
            bm_box(bm, (0.5, 0.5, 0.26), (x, y, WH - 0.05 + 0.13), None)
            bm_box(bm, (1.0, 0.3, 0.2) if along_x else (0.3, 1.0, 0.2), (x, y, WH + 0.31), None)
        for x in (-COL_X, COL_X):
            stack(x, COL_Y, True)
        for x in (-1.8, 1.8):
            stack(x, COL_Y, True)
        for y in (1.5, 4.5, 7.5):
            stack(-HW - 0.05, y, False)
            stack(HW + 0.05, y, False)
    solid('brackets', 'verm', brackets, bevel=0.03)

    def bracket_arms(bm):
        for x in (-COL_X, COL_X, -1.8, 1.8):
            bm_box(bm, (1.4, 0.26, 0.16), (x, COL_Y, WH + 0.49), None)
        for y in (1.5, 4.5, 7.5):
            bm_box(bm, (0.26, 1.4, 0.16), (-HW - 0.05, y, WH + 0.49), None)
            bm_box(bm, (0.26, 1.4, 0.16), (HW + 0.05, y, WH + 0.49), None)
    solid('bracket_arms', 'bone', bracket_arms, bevel=0.03)


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
            bm_bar(bm, (x, LAN_Y, LAN_Z + 0.5), (x, LAN_Y, WH - 0.1), 0.05)         # cord up to the beam
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
    porch()
    roof()
    ridge()
    lanterns()
    burner()


if __name__ == '__main__':
    # preview: from the road, three-quarter, in this file's frame
    S.run(build, camera=((12.0, -14.0, 5.0), (0.0, 2.0, 4.0), 45))
