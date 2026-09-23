# dihua_common.py — the shared shophouse bay for the three Dihua Street styles (issue #5 step 3).
# dihua-min.py, dihua-yang.py and dihua-baroque.py import this and call build_bay(style).
#
# One bay = 4.6 m of frontage (Blender X ±2.3), from scene-dadao.js bay(): Blender y = 0 is the
# FACE line (the upper facade, world |x| 6.2), the arcade column stands 0.4 in front of it at the
# kerb, the shop wall at the arcade's back is at y 3.2..3.6, the arcade ceiling at z 3.8, upper
# floors of 3.4 from z 4.2. Front toward -Y. Instanced by the engine, so the origin is the base
# centre and the model keeps its real height. One column per bay at +X; the next bay supplies the
# other side.
#
# Issue #15 step 3 splits the bay into three glb groups so the street gets its floor variety back
# (HANDOFF: "Dihua bays are all two upper floors; the old floors: 3 and tall: options are ignored"):
#
#   main     the 騎樓 arcade, the shop wall, and ONE upper floor   (z 0 .. 7.6)
#   storey   one more upper floor, built where the second sits     (z 7.6 .. 11.0)
#   crest    the roof slab and the style's own parapet             (z 11.0 up)
#
# scene-dadao.js instances main once per bay, storey (floors - 1) times at y = (k - 1) * FH, and
# crest once at y = (floors - 2) * FH — instSet already carries a per-item y offset. A one-floor
# bay drops the storey and pulls its crest down; a three-floor bay gets two storeys.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_solid, arch_pts, rect_pts, solid, cutter

W = 4.6                 # frontage
HW = W / 2
WALK = 0.22             # sidewalk top
CEIL = 3.8              # arcade ceiling
F0 = 4.2                # first upper floor
FH = 3.4                # storey height
STOREY_Z = F0 + FH      # 7.6, where the second floor (the 'storey' module) starts
TOP = F0 + 2 * FH       # 11.0, the crest line of a standard two-floor bay
WIN_W, WIN_H = 1.0, 2.0
WIN_X = 1.1
FRONT = S.face_frame(0, 0)               # the facade plane: local x along X, y into the wall, z up


def column(col):
    """The 騎樓 arcade column at the bay's +X edge: a stepped plinth, an octagonal (chamfered)
    shaft, a necking, a moulded capital and an abacus. A plain box with two collars is the shape
    CJ keeps calling low poly, and this is the one piece of the bay the camera passes within a
    metre of."""
    x, y = HW, -0.4

    def b(bm):
        bm_box(bm, (0.8, 0.8, 0.16), (x, y, WALK + 0.08))                       # plinth
        bm_box(bm, (0.68, 0.68, 0.2), (x, y, WALK + 0.26))                      # base
        bm_box(bm, (0.56, 0.56, 0.14), (x, y, WALK + 0.43))                     # base moulding
        bm_prism(bm, 8, 0.271, 0.271, WALK + 0.5, CEIL - 0.62, rot=math.pi / 8, center=(x, y))
        bm_box(bm, (0.56, 0.56, 0.12), (x, y, CEIL - 0.56))                     # necking
        bm_box(bm, (0.64, 0.64, 0.2), (x, y, CEIL - 0.4))                       # capital
        bm_box(bm, (0.76, 0.76, 0.14), (x, y, CEIL - 0.23))                     # abacus
    solid('column', col, b, bevel=0.03, group='main')


def arcade(col):
    """The slab over the arcade (its underside is the arcade ceiling), a beam at the kerb line, and
    a corbel bracket where each column meets the beam."""
    solid('arcade_slab', col, lambda bm: bm_box(bm, (W, 3.8, F0 - CEIL), (0, 1.5, CEIL + (F0 - CEIL) / 2)), group='main')
    solid('arcade_beam', col, lambda bm: bm_box(bm, (W, 0.5, 0.45), (0, -0.4, CEIL - 0.22)), bevel=0.03, group='main')

    def brackets(bm):
        for s in (-1, 1):
            bm_solid(bm, [(0, CEIL - 0.44), (s * 0.5, CEIL - 0.44), (0, CEIL - 0.94)], -0.62, -0.18,
                     Matrix.Translation((HW, 0, 0)))
    solid('arcade_brackets', col, brackets, bevel=0.03, group='main')


def shop_wall(col):
    """The shop wall at the arcade's back: a wide dark opening, a lattice door panel, a sign band."""
    F = S.face_frame(0, 3.2)
    c = cutter('shop_open', 'ink', lambda bm: bm_solid(bm, rect_pts(3.6, 2.7, WALK + 0.02), -0.5, 0.32, F))
    solid('shop_wall', col, lambda bm: bm_box(bm, (W, 0.4, CEIL - WALK), (0, 3.4, WALK + (CEIL - WALK) / 2)), cutters=(c,), group='main')
    solid('shop_sign', 'bone', lambda bm: bm_box(bm, (3.9, 0.1, 0.6), (0, 3.15, 3.3)), bevel=0.03, group='main')

    def lattice(bm):
        for i in range(-4, 5):
            bm_box(bm, (0.06, 0.06, 2.6), (i * 0.4, 3.45, WALK + 1.32))
        for k in range(1, 5):
            bm_box(bm, (3.5, 0.06, 0.06), (0, 3.45, WALK + 0.02 + k * 0.55))
        bm_box(bm, (3.5, 0.08, 0.16), (0, 3.44, WALK + 0.1))
    solid('shop_lattice', 'bone', lattice, bevel=0.0, group='main')


def upper_floor(col, window_pts, surround_pts, z0, group, mullions=True, extra_cutters=()):
    """One upper storey, built at its real z so main and storey read the same when stacked: the
    facade slab (y 0..0.5) with its two windows cut in, the floor slab and the back slab behind it,
    a sill over a corbel course, a one-mullion-by-two-transom sash, and the band at its head."""
    sfx = '' if group == 'main' else '_s'

    def sur(bm):
        for dx in (-WIN_X, WIN_X):
            bm_solid(bm, surround_pts, -0.5, 0.08, FRONT @ Matrix.Translation((dx, 0, z0 + 0.5)))

    def rec(bm):
        for dx in (-WIN_X, WIN_X):
            bm_solid(bm, window_pts, -0.5, 0.3, FRONT @ Matrix.Translation((dx, 0, z0 + 0.5)))
    c1 = cutter('win_surround' + sfx, 'bone', sur)
    c2 = cutter('win_recess' + sfx, 'ink', rec)
    solid('facade' + sfx, col, lambda bm: bm_box(bm, (W, 0.5, FH), (0, 0.25, z0 + FH / 2)),
          cutters=(c1, c2) + tuple(extra_cutters), group=group)

    def floors(bm):
        bm_box(bm, (W, 2.9, 0.25), (0, 1.95, z0 + 0.125))
        bm_box(bm, (W, 0.2, FH), (0, 3.3, z0 + FH / 2))
    solid('floors' + sfx, col, floors, bevel=0.03, group=group)
    solid('floor_band' + sfx, 'bone', lambda bm: bm_box(bm, (W, 0.14, 0.22), (0, -0.02, z0 + FH - 0.11)), bevel=0.03, group=group)

    def trim(bm):
        z = z0 + 0.5
        for dx in (-WIN_X, WIN_X):
            bm_box(bm, (WIN_W + 0.36, 0.26, 0.12), (dx, -0.02, z - 0.06))            # sill
            bm_box(bm, (WIN_W + 0.62, 0.3, 0.1), (dx, -0.05, z - 0.19))              # sill corbel course
            if mullions:
                bm_box(bm, (0.06, 0.06, WIN_H), (dx, 0.2, z + WIN_H / 2))
                for f in (0.34, 0.66):
                    bm_box(bm, (WIN_W, 0.06, 0.06), (dx, 0.2, z + WIN_H * f))
    solid('window_trim' + sfx, 'bone', trim, bevel=0.02, group=group)


def pilaster(col, z0, group, cap=False):
    """The pilaster at the bay's +X edge over one storey (the next bay supplies -X): a plinth, the
    shaft, a necking and a one- or two-step capital instead of the old plain 0.4 m box."""
    x = HW - 0.2
    sfx = '' if group == 'main' else '_s'

    def b(bm):
        bm_box(bm, (0.5, 0.48, 0.2), (x, -0.19, z0 + 0.1))                           # plinth
        bm_box(bm, (0.4, 0.4, FH - 0.5), (x, -0.15, z0 + 0.2 + (FH - 0.5) / 2))      # shaft
        bm_box(bm, (0.46, 0.44, 0.1), (x, -0.17, z0 + FH - 0.25))                    # necking
        if cap:
            bm_box(bm, (0.54, 0.5, 0.12), (x, -0.2, z0 + FH - 0.14))
            bm_box(bm, (0.62, 0.56, 0.1), (x, -0.23, z0 + FH - 0.05))
        else:
            bm_box(bm, (0.5, 0.46, 0.2), (x, -0.18, z0 + FH - 0.1))
    solid('pilaster' + sfx, col, b, bevel=0.03, group=group)


def roof_slab():
    solid('roof', 'ink', lambda bm: bm_box(bm, (W, 3.2, 0.3), (0, 1.8, TOP + 0.15)), bevel=0.03, group='crest')


def dentils(col, z, n=14, size=0.16, proud=0.1):
    """A row of small teeth under a cornice. Flat-shaded: smooth shading rounds a square tooth into
    a bead, and the bevel that would fix it costs four times the triangles on a 0.16 m block."""
    def b(bm):
        step = (W - 0.4) / (n - 1)
        for i in range(n):
            bm_box(bm, (size, proud + 0.05, size), (-HW + 0.2 + i * step, -proud / 2 + 0.02, z))
    solid('dentils', col, b, bevel=0.0, smooth=False, group='crest')


def build_bay(crest_parts, wall_col, window_pts=None, surround_pts=None, column_col=None,
              mullions=True, pil_col=None, pil_cap=False):
    """Assemble one bay: the arcade and one floor in 'main', the second floor in 'storey', then
    crest_parts() adds the roof slab and the style's parapet in 'crest'."""
    wp = window_pts or rect_pts(WIN_W, WIN_H)
    sp = surround_pts or rect_pts(WIN_W + 0.3, WIN_H + 0.15, -0.075)
    pc = pil_col or wall_col
    column(column_col or wall_col)
    arcade(wall_col)
    shop_wall(wall_col)
    upper_floor(wall_col, wp, sp, F0, 'main', mullions)
    pilaster(pc, F0, 'main', pil_cap)
    upper_floor(wall_col, wp, sp, STOREY_Z, 'storey', mullions)
    pilaster(pc, STOREY_Z, 'storey', pil_cap)
    roof_slab()
    crest_parts()


PREVIEW_CAM = ((9, -13, 7), (0, 1, 5.8), 50)   # whole bay in frame, from the street side
