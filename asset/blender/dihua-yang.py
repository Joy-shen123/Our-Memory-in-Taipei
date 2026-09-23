# dihua-yang.py — 洋樓 style Dihua Street bay: red brick with round-arched windows in pale
# surrounds, keystones, a cornice and a balustrade parapet. Shared bay in dihua_common.py.
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
    top = D.TOP
    # cornice: two steps proud of the facade
    solid('cornice_a', 'bone', lambda bm: bm_box(bm, (D.W, 0.34, 0.14), (0, 0.03, top - 0.34)), bevel=0.03)
    solid('cornice_b', 'bone', lambda bm: bm_box(bm, (D.W, 0.5, 0.22), (0, 0.05, top - 0.14)), bevel=0.03)
    D.dentils('bone', top - 0.5, n=12, size=0.14, proud=0.08)
    # balustrade: rails and turned balusters
    solid('rail_low', 'bone', lambda bm: bm_box(bm, (D.W, 0.5, 0.25), (0, 0.25, top + 0.125)), bevel=0.03)
    solid('rail_top', 'bone', lambda bm: bm_box(bm, (D.W, 0.5, 0.2), (0, 0.25, top + 0.95)), bevel=0.03)
    def balusters(bm):
        prof = [(0.07, 0), (0.1, 0.04), (0.06, 0.12), (0.1, 0.3), (0.07, 0.42), (0.1, 0.52), (0.07, 0.58), (0.07, 0.6)]
        for k in range(-2, 3):
            bm_lathe(bm, [(r, z + top + 0.25) for r, z in prof], n=8, xform=S.Matrix.Translation((k * 0.2 * D.W, 0.25, 0)))
    solid('balusters', 'bone', balusters, bevel=0.0)
    # keystones over the arches
    def keys(bm):
        for f in range(2):
            z = D.F0 + f * D.FH + 0.5 + ARCH_STRAIGHT + D.WIN_W / 2 + 0.05
            for dx in (-D.WIN_X, D.WIN_X):
                bm_box(bm, (0.22, 0.18, 0.36), (dx, 0.0, z))
    solid('keystones', 'bone', keys, bevel=0.02)


def build():
    D.build_bay(parapet, 'brick',
                window_pts=arch_pts(D.WIN_W, ARCH_STRAIGHT),
                surround_pts=[(x, z - 0.1) for x, z in arch_pts(D.WIN_W + 0.3, ARCH_STRAIGHT + 0.1)],
                column_col='brick')
    D.pilaster('bone', D.TOP - D.F0, cap=True)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
