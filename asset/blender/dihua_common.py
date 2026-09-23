# dihua_common.py — the shared shophouse bay for the three Dihua Street styles (issue #5 step 3).
# dihua-min.py, dihua-yang.py and dihua-baroque.py import this and call build_bay(style).
#
# One bay = 4.6 m of frontage (Blender X ±2.3), from scene-dadao.js bay(): Blender y = 0 is the
# FACE line (the upper facade, world |x| 6.2), the arcade column stands 0.4 in front of it at the
# kerb, the shop wall at the arcade's back is at y 3.2..3.6, the arcade ceiling at z 3.8, two
# upper floors of 3.4 from z 4.2, roof line 10.8. Front toward -Y. Instanced by the engine, so
# the origin is the base centre and the model keeps its real height. One column per bay at +X;
# the next bay supplies the other side.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, arch_pts, rect_pts, solid, cutter

W = 4.6                 # frontage
HW = W / 2
WALK = 0.22             # sidewalk top
CEIL = 3.8              # arcade ceiling
F0 = 4.2                # first upper floor
FH = 3.4                # storey height
TOP = F0 + 2 * FH - 0.2 # roof line 10.8
WIN_W, WIN_H = 1.0, 2.0
WIN_X = 1.1
FRONT = S.face_frame(0, 0)               # the facade plane: local x along X, y into the wall, z up


def column(col):
    """The arcade column at the bay's +X edge, base and capital included."""
    def b(bm):
        bm_box(bm, (0.5, 0.5, CEIL - WALK), (HW, -0.4, WALK + (CEIL - WALK) / 2))
        bm_box(bm, (0.62, 0.62, 0.3), (HW, -0.4, WALK + 0.15))
        bm_box(bm, (0.62, 0.62, 0.25), (HW, -0.4, CEIL - 0.125))
    solid('column', col, b)


def arcade(col):
    """The slab over the arcade (its underside is the arcade ceiling) and a beam at the kerb line."""
    solid('arcade_slab', col, lambda bm: bm_box(bm, (W, 3.8, F0 - CEIL), (0, 1.5, CEIL + (F0 - CEIL) / 2)))
    solid('arcade_beam', col, lambda bm: bm_box(bm, (W, 0.5, 0.45), (0, -0.4, CEIL - 0.22)), bevel=0.03)


def shop_wall(col):
    """The shop wall at the arcade's back: a wide dark opening, a lattice door panel, a sign band."""
    F = S.face_frame(0, 3.2)
    c = cutter('shop_open', 'ink', lambda bm: bm_solid(bm, rect_pts(3.6, 2.7, WALK + 0.02), -0.5, 0.32, F))
    solid('shop_wall', col, lambda bm: bm_box(bm, (W, 0.4, CEIL - WALK), (0, 3.4, WALK + (CEIL - WALK) / 2)), cutters=(c,))
    solid('shop_sign', 'bone', lambda bm: bm_box(bm, (3.9, 0.1, 0.6), (0, 3.15, 3.3)), bevel=0.03)
    def lattice(bm):
        for i in range(-4, 5):
            bm_box(bm, (0.06, 0.06, 2.6), (i * 0.4, 3.45, WALK + 1.32))
        for k in range(1, 5):
            bm_box(bm, (3.5, 0.06, 0.06), (0, 3.45, WALK + 0.02 + k * 0.55))
        bm_box(bm, (3.5, 0.08, 0.16), (0, 3.44, WALK + 0.1))
    solid('shop_lattice', 'bone', lattice, bevel=0.0)


def upper_walls(col, window_pts, surround_pts, extra_cutters=()):
    """The upper facade slab (y 0..0.5) with its four windows cut in, the floor slabs behind it,
    a back slab, and the floor band. window_pts / surround_pts: profiles for one window, base at
    the sill (2.0 tall for a rectangle, an arch for 洋樓)."""
    def sur(bm):
        for f in range(2):
            for dx in (-WIN_X, WIN_X):
                bm_solid(bm, surround_pts, -0.5, 0.08, FRONT @ Matrix.Translation((dx, 0, F0 + f * FH + 0.5)))
    def rec(bm):
        for f in range(2):
            for dx in (-WIN_X, WIN_X):
                bm_solid(bm, window_pts, -0.5, 0.3, FRONT @ Matrix.Translation((dx, 0, F0 + f * FH + 0.5)))
    c1 = cutter('win_surround', 'bone', sur)
    c2 = cutter('win_recess', 'ink', rec)
    solid('facade', col, lambda bm: bm_box(bm, (W, 0.5, TOP - F0), (0, 0.25, F0 + (TOP - F0) / 2)), cutters=(c1, c2) + tuple(extra_cutters))
    def floors(bm):
        bm_box(bm, (W, 2.9, 0.25), (0, 1.95, F0 + 0.125))
        bm_box(bm, (W, 2.9, 0.25), (0, 1.95, F0 + FH + 0.125))
        bm_box(bm, (W, 0.2, TOP - F0), (0, 3.3, F0 + (TOP - F0) / 2))
    solid('floors', col, floors, bevel=0.03)
    solid('floor_band', 'bone', lambda bm: bm_box(bm, (W, 0.14, 0.22), (0, -0.02, F0 + FH - 0.11)), bevel=0.03)


def window_trim(sill_col='bone', mullions=True):
    """Sills and mullion bars for the four windows."""
    def b(bm):
        for f in range(2):
            z = F0 + f * FH + 0.5
            for dx in (-WIN_X, WIN_X):
                bm_box(bm, (WIN_W + 0.36, 0.22, 0.12), (dx, 0.0, z - 0.06))
                if mullions:
                    bm_box(bm, (0.06, 0.06, WIN_H), (dx, 0.2, z + WIN_H / 2))
                    bm_box(bm, (WIN_W, 0.06, 0.06), (dx, 0.2, z + WIN_H * 0.6))
    solid('window_trim', sill_col, b, bevel=0.02)


def pilaster(col, height, cap=False):
    """The pilaster at the bay's +X edge over the upper floors (the next bay supplies -X)."""
    def b(bm):
        bm_box(bm, (0.4, 0.4, height), (HW - 0.2, -0.15, F0 + height / 2))
        if cap:
            bm_box(bm, (0.56, 0.5, 0.3), (HW - 0.2, -0.2, F0 + height - 0.15))
            bm_box(bm, (0.5, 0.46, 0.2), (HW - 0.2, -0.18, F0 + 0.1))
    solid('pilaster', col, b, bevel=0.03)


def roof_slab():
    solid('roof', 'ink', lambda bm: bm_box(bm, (W, 3.2, 0.3), (0, 1.8, TOP + 0.15)), bevel=0.03)


def dentils(col, z, n=14, size=0.16, proud=0.1):
    """A row of small teeth under a cornice."""
    def b(bm):
        step = (W - 0.4) / (n - 1)
        for i in range(n):
            bm_box(bm, (size, proud + 0.05, size), (-HW + 0.2 + i * step, -proud / 2 + 0.02, z))
    solid('dentils', col, b, bevel=0.0)


def build_bay(style_parts, wall_col, window_pts=None, surround_pts=None, column_col=None, mullions=True):
    """Assemble one bay: the common parts, then style_parts() adds the parapet and trim."""
    column(column_col or wall_col)
    arcade(wall_col)
    shop_wall(wall_col)
    upper_walls(wall_col, window_pts or rect_pts(WIN_W, WIN_H), surround_pts or rect_pts(WIN_W + 0.3, WIN_H + 0.15, -0.075))
    window_trim(mullions=mullions)
    roof_slab()
    style_parts()


PREVIEW_CAM = ((9, -13, 7), (0, 1, 5.8), 50)   # whole bay in frame, from the street side
