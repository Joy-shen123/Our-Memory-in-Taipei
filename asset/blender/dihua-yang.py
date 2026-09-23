# dihua-yang.py — 洋樓 style Dihua Street bay: red brick with round-arched windows in pale
# surrounds, keystones, a cornice and a balustrade parapet on its own pedestals. Shared bay in
# dihua_common.py; the parapet goes in the 'crest' group.
#
#   Blender --background --python asset/blender/dihua-yang.py -- --out asset/models/dihua-yang.glb

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe, arch_pts, solid
import dihua_common as D

ARCH_STRAIGHT = 1.5                      # arch top at sill + 2.0


def parapet():
    """The 洋樓 parapet: a two-step cornice over a dentil row, then a balustrade that runs between
    two solid end pedestals with their own caps, instead of a rail sitting on a plate."""
    top = D.TOP
    solid('cornice_a', 'bone', lambda bm: bm_box(bm, (D.W, 0.34, 0.14), (0, 0.03, top - 0.34)), bevel=0.03, group='crest')
    solid('cornice_b', 'bone', lambda bm: bm_box(bm, (D.W, 0.5, 0.22), (0, 0.05, top - 0.14)), bevel=0.03, group='crest')
    D.dentils('bone', top - 0.5, n=12, size=0.14, proud=0.08)

    def pedestals(bm):
        for s in (-1, 1):
            x = s * (D.HW - 0.3)
            bm_box(bm, (0.6, 0.6, 1.16), (x, 0.25, top + 0.58))
            bm_box(bm, (0.72, 0.72, 0.14), (x, 0.25, top + 1.23))                 # pedestal cap
            bm_box(bm, (0.5, 0.5, 0.16), (x, 0.25, top + 1.38))                   # ball plinth
            S.bm_sphere(bm, 0.21, (x, 0.25, top + 1.62), 10, 6)                   # finial ball
    solid('parapet_pedestals', 'bone', pedestals, bevel=0.03, group='crest')

    solid('rail_low', 'bone', lambda bm: bm_box(bm, (D.W - 0.6, 0.5, 0.25), (0, 0.25, top + 0.125)), bevel=0.03, group='crest')
    solid('rail_top', 'bone', lambda bm: bm_box(bm, (D.W - 0.6, 0.44, 0.2), (0, 0.25, top + 0.95)), bevel=0.03, group='crest')

    def balusters(bm):
        prof = [(0.07, 0), (0.1, 0.04), (0.06, 0.12), (0.1, 0.3), (0.07, 0.42), (0.1, 0.52), (0.07, 0.58), (0.07, 0.6)]
        for k in range(-2, 3):
            bm_lathe(bm, [(r, z + top + 0.25) for r, z in prof], n=8,
                     xform=S.Matrix.Translation((k * 0.185 * D.W, 0.25, 0)))
    solid('balusters', 'bone', balusters, bevel=0.0, group='crest')

    # keystones over the arches, one per storey
    def keys(bm, z0):
        z = z0 + 0.5 + ARCH_STRAIGHT + D.WIN_W / 2 + 0.05
        for dx in (-D.WIN_X, D.WIN_X):
            bm_box(bm, (0.24, 0.2, 0.4), (dx, -0.02, z))
            bm_box(bm, (0.34, 0.16, 0.12), (dx, -0.03, z + 0.24))                 # its own cap
    solid('keystones', 'bone', lambda bm: keys(bm, D.F0), bevel=0.02, group='main')
    solid('keystones_s', 'bone', lambda bm: keys(bm, D.STOREY_Z), bevel=0.02, group='storey')


def build():
    D.build_bay(parapet, 'brick',
                window_pts=arch_pts(D.WIN_W, ARCH_STRAIGHT),
                surround_pts=[(x, z - 0.1) for x, z in arch_pts(D.WIN_W + 0.3, ARCH_STRAIGHT + 0.1)],
                column_col='brick', pil_col='bone', pil_cap=True)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
