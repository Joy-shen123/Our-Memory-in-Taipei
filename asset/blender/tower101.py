# tower101.py — 台北101 (C.Y. Lee, 2004) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/tower101.py -- --out asset/models/tower101.glb
# Optional check render: add --preview /tmp/tower101.png (and --stats for a per-part count).
#
# Reference (HANDOFF.md, real-building tables): a mall podium; a tapering pedestal for floors
# 1–25 (a square frustum, wider at the ground); four 古錢 coin ornaments just under the pedestal
# top, one per face; eight 斗-shaped segments of eight floors, each flaring outward as it rises
# so its top overhangs the next one's base (節節高升); a 如意 at every segment's four bottom
# corners; a tapering crown for floors 91–101; mechanical box, mast, spire.
#
# Frame: metres, Blender Z up, origin at the tower's centre on the ground. Placed at world
# (0, 0, -420) with no rotation, so Blender +X → world +x and Blender -Y → world +z, the side the
# camera comes from. The podium's front and its canopy face -Y.
#
# The profile constants below are the ones scene-tower.js uses for TOWER.faceX(y), which keeps
# the climbing man on the west face. Change them together or not at all.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_bar, bm_solid, solid

SQ2 = math.sqrt(2)

# ── profile (scene-tower.js) ─────────────────────────────────────────────────
PODIUM_H = 7.0
PED_Y0, PED_Y1, PED_HB, PED_HT = 7.0, 30.0, 8.5, 6.0        # pedestal: base/top height, half-widths
SEG_Y0, SEG_H, SEG_N, SEG_HB, SEG_HT = 30.0, 8.5, 8, 5.2, 6.6   # the eight flared segments
CROWN_Y0 = SEG_Y0 + SEG_N * SEG_H                          # 98
CROWN_H, CROWN_HB, CROWN_HT = 8.0, 5.5, 3.2
CROWN_Y1 = CROWN_Y0 + CROWN_H                              # 106
MECH_H, MAST_H, SPIRE_H = 3.0, 2.0, 18.0
SPIRE_TOP = CROWN_Y1 + MECH_H + MAST_H + SPIRE_H           # 129

# ── podium (the mall block, centred 2 m toward the camera) ───────────────────
POD_W, POD_D, POD_CY = 30.0, 22.0, -2.0
GROUND_H = 4.0                                             # the glazed ground floor under the mall


def sq(bm, hw0, hw1, z0, z1, center=(0, 0)):
    """An axis-aligned square prism / frustum: half-width hw0 at z0, hw1 at z1."""
    return bm_prism(bm, 4, hw0 * SQ2, hw1 * SQ2, z0, z1, rot=math.pi / 4, center=center)


def hw_at(z, z0, z1, hb, ht):
    """Half-width of a frustum face at height z."""
    return hb + (ht - hb) * (z - z0) / (z1 - z0)


# ─────────────────────────────────────────────────────────────────────────────
# the podium
# ─────────────────────────────────────────────────────────────────────────────
def podium():
    """The mall: a glazed ground floor set back under the pale upper block, columns along the
    front, a parapet, and a canopy over the entrance toward the camera."""
    inset = 0.9
    solid('podium_ground', 'ink', lambda bm: bm_box(bm, (POD_W - 2 * inset, POD_D - 2 * inset, GROUND_H), (0, POD_CY, GROUND_H / 2)))
    solid('podium_upper', 'walk', lambda bm: bm_box(bm, (POD_W, POD_D, PODIUM_H - GROUND_H), (0, POD_CY, GROUND_H + (PODIUM_H - GROUND_H) / 2)))
    solid('podium_parapet', 'walk', lambda bm: bm_box(bm, (POD_W + 0.4, POD_D + 0.4, 0.45), (0, POD_CY, PODIUM_H + 0.2)), bevel=0.03)
    # a pale band where the upper block meets the glass, and a row of columns at the setback line
    solid('podium_soffit', 'bone', lambda bm: bm_box(bm, (POD_W + 0.1, POD_D + 0.1, 0.3), (0, POD_CY, GROUND_H - 0.15)), bevel=0.03)

    def columns(bm):
        yf = POD_CY - POD_D / 2 + inset                      # the ground floor's front face
        yb = POD_CY + POD_D / 2 - inset
        n = 7
        for i in range(n):
            x = -POD_W / 2 + inset + 0.3 + i * (POD_W - 2 * inset - 0.6) / (n - 1)
            for y in (yf, yb):
                bm_box(bm, (0.5, 0.5, GROUND_H), (x, y, GROUND_H / 2))
        for j in range(1, 4):                                # the side rows
            y = yf + j * (yb - yf) / 4
            for x in (-POD_W / 2 + inset, POD_W / 2 - inset):
                bm_box(bm, (0.5, 0.5, GROUND_H), (x, y, GROUND_H / 2))
    solid('podium_columns', 'walk', columns, bevel=0.03)
    # window mullions on the glazed ground floor: thin vertical bars between the columns
    def mullions(bm):
        yf = POD_CY - POD_D / 2 + inset
        yb = POD_CY + POD_D / 2 - inset
        for i in range(24):
            x = -POD_W / 2 + inset + 0.6 + i * (POD_W - 2 * inset - 1.2) / 23
            for y in (yf - 0.03, yb + 0.03):
                bm_box(bm, (0.08, 0.1, GROUND_H - 0.4), (x, y, 0.2 + (GROUND_H - 0.4) / 2))
    solid('podium_mullions', 'haze', mullions, bevel=0)
    # fins and bands on the pale upper block: the 0.78 keyframe looks straight at this face
    def pod_grid(bm):
        z0, z1 = GROUND_H + 0.3, PODIUM_H - 0.2
        for i in range(17):
            x = -POD_W / 2 + 0.6 + i * (POD_W - 1.2) / 16
            for y in (POD_CY - POD_D / 2 - 0.12, POD_CY + POD_D / 2 + 0.12):
                bm_box(bm, (0.22, 0.3, z1 - z0), (x, y, (z0 + z1) / 2))
        for j in range(11):
            y = POD_CY - POD_D / 2 + 0.6 + j * (POD_D - 1.2) / 10
            for x in (-POD_W / 2 - 0.12, POD_W / 2 + 0.12):
                bm_box(bm, (0.3, 0.22, z1 - z0), (x, y, (z0 + z1) / 2))
        for z in (z0, z1):
            bm_box(bm, (POD_W + 0.34, POD_D + 0.34, 0.16), (0, POD_CY, z))
    solid('podium_grid', 'bone', pod_grid, bevel=0, smooth=False)

    # the entrance canopy: a thin slab out from the front on two slender posts
    yf = POD_CY - POD_D / 2
    solid('podium_canopy', 'haze', lambda bm: bm_box(bm, (14.0, 4.0, 0.3), (0, yf - 1.6, 4.4)), bevel=0.03)
    solid('podium_canopy_fascia', 'bone', lambda bm: bm_box(bm, (14.2, 0.25, 0.6), (0, yf - 3.5, 4.4)), bevel=0.03)
    def posts(bm):
        for x in (-5.5, 5.5):
            bm_box(bm, (0.3, 0.3, 4.3), (x, yf - 3.2, 2.15))
    solid('podium_posts', 'haze', posts, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# curtain-wall detail, shared by pedestal, segments and crown
# ─────────────────────────────────────────────────────────────────────────────
def floor_bands(bm, z0, z1, hb, ht, floors, proud=0.12, thick=0.12):
    """Every floor line of a frustum gets two rings: the spandrel band standing `proud` of the
    glass, and a thinner nose standing further out again. One flat ring read as a painted line;
    two read as a floor edge with depth."""
    for i in range(1, floors):
        z = z0 + (z1 - z0) * i / floors
        hw = hw_at(z, z0, z1, hb, ht)
        sq(bm, hw + proud, hw + proud, z - thick / 2, z + thick / 2)
        sq(bm, hw + proud + 0.12, hw + proud + 0.12, z - thick / 2 + 0.02, z + thick / 2 - 0.05)


def mullion_bars(bm, z0, z1, hb, ht, per_face=5, proud=0.22, t=0.13):
    """Vertical mullions on each of the four faces, following the face's slope. They stand `proud`
    of the glass so the curtain wall reads as a grid of fins rather than a set of stripes.

    Square section on purpose: bm_bar tracks the bar's axis but not its roll, so a rectangular
    section lands at whatever angle the track quaternion picks and a deep, narrow fin shows up
    edge-on as a wide diagonal ribbon across the glass. A square bar is roll-independent."""
    for k in range(4):
        R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
        for i in range(per_face):
            u = -hb * 0.82 + i * (hb * 1.64) / (per_face - 1)
            p0 = R @ Vector((u, -(hb + proud), z0))
            p1 = R @ Vector((u * ht / hb, -(ht + proud), z1))
            bm_bar(bm, p0, p1, t)


def corner_bars(bm, z0, z1, hb, ht, proud=0.10, t=0.3):
    """A bar down each of the four slanted corners, so the 斗 silhouette reads from afar."""
    for sx in (-1, 1):
        for sy in (-1, 1):
            bm_bar(bm, (sx * (hb + proud), sy * (hb + proud), z0), (sx * (ht + proud), sy * (ht + proud), z1), t)


# ─────────────────────────────────────────────────────────────────────────────
# pedestal, coins
# ─────────────────────────────────────────────────────────────────────────────
def pedestal():
    solid('pedestal', 'glass', lambda bm: sq(bm, PED_HB, PED_HT, PED_Y0, PED_Y1))
    solid('pedestal_bands', 'haze', lambda bm: floor_bands(bm, PED_Y0, PED_Y1, PED_HB, PED_HT, 25), bevel=0)
    solid('pedestal_mullions', 'haze', lambda bm: mullion_bars(bm, PED_Y0, PED_Y1, PED_HB, PED_HT, 9), bevel=0)
    solid('pedestal_corners', 'bone', lambda bm: corner_bars(bm, PED_Y0, PED_Y1, PED_HB, PED_HT), bevel=0)
    # the pedestal's roof: the flat ring around the first segment's base, and a pale rim
    solid('pedestal_roof', 'haze', lambda bm: sq(bm, PED_HT + 0.05, PED_HT + 0.05, PED_Y1 - 0.05, PED_Y1 + 0.3), bevel=0.03)
    solid('pedestal_rim', 'bone', lambda bm: sq(bm, PED_HT + 0.2, PED_HT + 0.2, PED_Y1 - 0.35, PED_Y1 - 0.05), bevel=0.03)


def coins():
    """古錢: a round bone disc with a square ink hole, one on each face just under the pedestal top."""
    z = 27.4
    hw = hw_at(z, PED_Y0, PED_Y1, PED_HB, PED_HT)
    def build(bm):
        for k in range(4):
            R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
            # the disc is built flat (axis Z), then tipped to lie on the face (axis Y), then turned
            M = R @ Matrix.Translation((0, -(hw + 0.2), z)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_prism(bm, 18, 1.6, 1.6, -0.2, 0.2, rot=0, xform=M)
            bm_prism(bm, 18, 1.75, 1.75, -0.12, 0.12, rot=0, xform=M @ Matrix.Translation((0, 0, 0.16)))   # a raised rim
    solid('coins', 'bone', build, bevel=0.03)
    def holes(bm):
        for k in range(4):
            R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
            M = R @ Matrix.Translation((0, -(hw + 0.2), z))
            bm_box(bm, (1.0, 0.7, 1.0), (0, -0.1, 0), M)
    solid('coin_holes', 'ink', holes, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# the eight segments and the 如意
# ─────────────────────────────────────────────────────────────────────────────
def segments():
    def glass(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            sq(bm, SEG_HB, SEG_HT, z0, z0 + SEG_H)
    solid('segments', 'glass', glass)
    def bands(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            floor_bands(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, 8)
    solid('segment_bands', 'haze', bands, bevel=0)
    def mull(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            mullion_bars(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, 11)
    solid('segment_mullions', 'haze', mull, bevel=0)
    def corners(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            corner_bars(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT)
    solid('segment_corners', 'bone', corners, bevel=0)
    # the top rim of every segment: a pale ledge that overhangs the next base (the bamboo joint),
    # and a dark soffit ring under it so the step reads from below
    def rims(bm):
        for i in range(SEG_N):
            z1 = SEG_Y0 + (i + 1) * SEG_H
            sq(bm, SEG_HT + 0.25, SEG_HT + 0.25, z1 - 0.4, z1 + 0.05)
    solid('segment_rims', 'bone', rims, bevel=0.03)
    def soffits(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            sq(bm, SEG_HB + 0.5, SEG_HB + 0.5, z0 - 0.02, z0 + 0.35)
    solid('segment_soffits', 'ink', soffits, bevel=0.03)


def ruyi_pts(r_side=0.34, r_mid=0.40):
    """如意 head as a closed outline: three lobes in a fan over a short neck. Extruding this costs
    less than the sphere it replaces and actually looks like the ornament — the 如意 is the
    tower's signature and it was a squashed ball on a box."""
    def arc(cx, cz, r, a0, a1, n=5):
        return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))),
                 cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]
    pts = [(-0.17, 0.0), (0.17, 0.0)]
    pts += arc(0.5, 0.34, r_side, -72, 118)
    pts += arc(0.0, 0.68, r_mid, 22, 158)
    pts += arc(-0.5, 0.34, r_side, 62, 252)
    return pts


def ruyi():
    """如意 at every segment's four bottom corners, 32 of them, each facing out along its diagonal:
    the cloud head on a short stem over a base plate, with a small warm boss at its eye."""
    CORNERS = [(sx, sy) for sx in (-1, 1) for sy in (-1, 1)]

    def placement(sx, sy, z):
        return Matrix.Translation((sx * 5.45, sy * 5.45, z)) @ Matrix.Rotation(math.atan2(-sx, sy), 4, 'Z')

    def build(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H + 0.15
            for sx, sy in CORNERS:
                M = placement(sx, sy, z0)
                bm_box(bm, (0.72, 0.62, 0.22), (0, 0, 0.11), M)                      # base plate
                bm_box(bm, (0.2, 0.26, 0.3), (0, 0, 0.35), M)                        # stem
                bm_solid(bm, [(x, z + 0.46) for x, z in ruyi_pts()], -0.13, 0.13, M)  # the cloud head
    solid('ruyi', 'bone', build, bevel=0)

    def eyes(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H + 0.15
            for sx, sy in CORNERS:
                bm_box(bm, (0.24, 0.3, 0.24), (0, 0, 1.14), placement(sx, sy, z0))
    solid('ruyi_eyes', 'lamp', eyes, bevel=0, smooth=False)


# ─────────────────────────────────────────────────────────────────────────────
# crown, mechanical box, mast, spire
# ─────────────────────────────────────────────────────────────────────────────
def crown():
    solid('crown', 'glass', lambda bm: sq(bm, CROWN_HB, CROWN_HT, CROWN_Y0, CROWN_Y1))
    solid('crown_bands', 'haze', lambda bm: floor_bands(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT, 10), bevel=0)
    solid('crown_mullions', 'haze', lambda bm: mullion_bars(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT, 7), bevel=0)
    solid('crown_corners', 'bone', lambda bm: corner_bars(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT), bevel=0)
    solid('crown_base', 'bone', lambda bm: sq(bm, CROWN_HB + 0.25, CROWN_HB + 0.25, CROWN_Y0 - 0.05, CROWN_Y0 + 0.35), bevel=0.03)
    solid('crown_rim', 'bone', lambda bm: sq(bm, CROWN_HT + 0.2, CROWN_HT + 0.2, CROWN_Y1 - 0.35, CROWN_Y1 + 0.05), bevel=0.03)
    solid('mech', 'haze', lambda bm: sq(bm, 2.1, 2.1, CROWN_Y1, CROWN_Y1 + MECH_H))

    def fins(bm):
        """Four fins up the crown's corners and a stepped collar under its rim: the crown is the
        last thing the camera looks at on the climb and it was a plain frustum."""
        for k in range(4):
            R = Matrix.Rotation(math.pi / 4 + k * math.pi / 2, 4, 'Z')
            bm_bar(bm, R @ Vector((0, -(CROWN_HB * SQ2 + 0.1), CROWN_Y0 + 0.4)),
                   R @ Vector((0, -(CROWN_HT * SQ2 + 0.1), CROWN_Y1 - 0.4)), 0.26)
        for dz, hw in ((0.9, CROWN_HT + 0.42), (1.35, CROWN_HT + 0.26)):
            sq(bm, hw, hw, CROWN_Y1 - dz, CROWN_Y1 - dz + 0.22)
    solid('crown_fins', 'bone', fins, bevel=0)

    # louvres on the mechanical box: horizontal bone strips on its four faces
    def louvres(bm):
        for k in range(4):
            R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
            for j in range(4):
                bm_box(bm, (3.4, 0.16, 0.14), (0, -2.15, CROWN_Y1 + 0.55 + j * 0.6), R)
    solid('mech_louvres', 'bone', louvres, bevel=0)

    y0 = CROWN_Y1 + MECH_H

    def mast(bm):
        """The mast as a lattice: four corner posts, rungs and diagonals, not a solid block."""
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_bar(bm, (sx * 0.62, sy * 0.62, y0), (sx * 0.62, sy * 0.62, y0 + MAST_H), 0.12)
        for j in range(3):
            z = y0 + j * MAST_H / 2
            for k in range(4):
                R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
                bm_bar(bm, R @ Vector((-0.62, -0.62, z)), R @ Vector((0.62, -0.62, z)), 0.09)
                if j < 2:
                    bm_bar(bm, R @ Vector((-0.62, -0.62, z)), R @ Vector((0.62, -0.62, z + MAST_H / 2)), 0.07)
    solid('mast', 'bone', mast, bevel=0)

    y1 = y0 + MAST_H
    solid('spire', 'bone', lambda bm: bm_prism(bm, 8, 0.6, 0.12, y1, y1 + SPIRE_H, rot=0), bevel=0.03)

    def rings(bm):
        bm_prism(bm, 8, 0.85, 0.85, y1 - 0.1, y1 + 0.25, rot=0)
        for t in (0.25, 0.5, 0.75):
            r = 0.6 + (0.12 - 0.6) * t
            z = y1 + SPIRE_H * t
            bm_prism(bm, 8, r + 0.14, r + 0.14, z - 0.08, z + 0.08, rot=0)
            for k in range(4):                                       # stays out to each ring
                a = math.pi / 4 + k * math.pi / 2
                bm_bar(bm, (0, 0, z - 1.4), ((r + 0.34) * math.cos(a), (r + 0.34) * math.sin(a), z), 0.06)
    solid('spire_rings', 'haze', rings, bevel=0)


def build():
    podium()
    pedestal()
    coins()
    segments()
    ruyi()
    crown()


if __name__ == '__main__':
    # preview camera: the approach shot from the street, low and in front of the tower
    S.run(build, camera=((60.0, -120.0, 40.0), (0.0, 0.0, 60.0), 55))
