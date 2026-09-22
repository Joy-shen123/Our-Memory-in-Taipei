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
from stylized import bm_box, bm_prism, bm_bar, solid

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
    """A thin square ring at every floor line of a frustum, standing `proud` of the glass."""
    for i in range(1, floors):
        z = z0 + (z1 - z0) * i / floors
        hw = hw_at(z, z0, z1, hb, ht) + proud
        sq(bm, hw, hw, z - thick / 2, z + thick / 2)


def mullion_bars(bm, z0, z1, hb, ht, per_face=5, proud=0.10, t=0.16):
    """Vertical bars on each of the four faces, following the face's slope."""
    for k in range(4):
        R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
        for i in range(per_face):
            u = -hb * 0.8 + i * (hb * 1.6) / (per_face - 1)
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
    solid('pedestal_mullions', 'haze', lambda bm: mullion_bars(bm, PED_Y0, PED_Y1, PED_HB, PED_HT, 6), bevel=0)
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
            mullion_bars(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, 5)
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


def ruyi():
    """如意 ornaments: a squashed bone sphere on a small foot at every segment's four bottom corners."""
    def build(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H + 0.15
            for sx in (-1, 1):
                for sy in (-1, 1):
                    x, y = sx * 5.45, sy * 5.45
                    bm_box(bm, (0.6, 0.6, 0.25), (x, y, z0 + 0.125))
                    S.bm_sphere(bm, 0.7, (x, y, z0 + 0.25 + 0.52), u=10, v=6, scale_z=0.75)
    solid('ruyi', 'bone', build, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# crown, mechanical box, mast, spire
# ─────────────────────────────────────────────────────────────────────────────
def crown():
    solid('crown', 'glass', lambda bm: sq(bm, CROWN_HB, CROWN_HT, CROWN_Y0, CROWN_Y1))
    solid('crown_bands', 'haze', lambda bm: floor_bands(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT, 10), bevel=0)
    solid('crown_mullions', 'haze', lambda bm: mullion_bars(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT, 4), bevel=0)
    solid('crown_corners', 'bone', lambda bm: corner_bars(bm, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT), bevel=0)
    solid('crown_base', 'bone', lambda bm: sq(bm, CROWN_HB + 0.25, CROWN_HB + 0.25, CROWN_Y0 - 0.05, CROWN_Y0 + 0.35), bevel=0.03)
    solid('crown_rim', 'bone', lambda bm: sq(bm, CROWN_HT + 0.2, CROWN_HT + 0.2, CROWN_Y1 - 0.35, CROWN_Y1 + 0.05), bevel=0.03)
    solid('mech', 'haze', lambda bm: sq(bm, 2.1, 2.1, CROWN_Y1, CROWN_Y1 + MECH_H))
    # louvres on the mechanical box: horizontal bone strips on its four faces
    def louvres(bm):
        for k in range(4):
            R = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
            for j in range(4):
                bm_box(bm, (3.4, 0.16, 0.14), (0, -2.15, CROWN_Y1 + 0.55 + j * 0.6), R)
    solid('mech_louvres', 'bone', louvres, bevel=0)
    y0 = CROWN_Y1 + MECH_H
    solid('mast', 'bone', lambda bm: sq(bm, 0.7, 0.7, y0, y0 + MAST_H))
    y1 = y0 + MAST_H
    solid('spire', 'bone', lambda bm: bm_prism(bm, 8, 0.6, 0.12, y1, y1 + SPIRE_H, rot=0), bevel=0.03)
    # rings up the spire, and a small collar where it meets the mast
    def rings(bm):
        bm_prism(bm, 8, 0.85, 0.85, y1 - 0.1, y1 + 0.25, rot=0)
        for t in (0.25, 0.5, 0.75):
            r = 0.6 + (0.12 - 0.6) * t
            bm_prism(bm, 8, r + 0.14, r + 0.14, y1 + SPIRE_H * t - 0.08, y1 + SPIRE_H * t + 0.08, rot=0)
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
