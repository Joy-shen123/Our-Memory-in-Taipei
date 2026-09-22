# dihua-baroque.py — 巴洛克 style Dihua Street bay: plaster walls ('walk', its own material so the
# scene can recolour it per instance), pale pilasters with capitals, window pediments, a dentil
# cornice and the curved gable crest with volutes and a medallion (屈臣氏大藥房 / 林五湖 style).
# Shared bay in dihua_common.py.
#
#   Blender --background --python asset/blender/dihua-baroque.py -- --out asset/models/dihua-baroque.glb

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, bm_prism, solid
import dihua_common as D

CREST_H = 2.1
CREST_W = 4.5


def crest_profile():
    """scene-dadao.js crestGeo, x -0.5..0.5, y 0..1, scaled to CREST_W x CREST_H, sitting on TOP."""
    P = lambda x, y: (x * CREST_W, y * CREST_H + D.TOP)
    pts = [P(-0.5, 0), P(0.5, 0), P(0.5, 0.32)]
    pts += [P(*p) for p in S.quad((0.5, 0.32), (0.42, 0.5), (0.27, 0.52), 4)]
    pts.append(P(0.17, 0.6))
    pts += [P(*p) for p in S.cubic((0.17, 0.6), (0.17, 0.92), (0.07, 1.0), (0.0, 1.0), 5)]
    pts += [P(*p) for p in S.cubic((0.0, 1.0), (-0.07, 1.0), (-0.17, 0.92), (-0.17, 0.6), 5)]
    pts.append(P(-0.27, 0.52))
    pts += [P(*p) for p in S.quad((-0.27, 0.52), (-0.42, 0.5), (-0.5, 0.32), 4)]
    return pts


def parapet():
    top = D.TOP
    # the crest, a pale border band following its top, and the volutes on the shoulders
    solid('crest', 'bone', lambda bm: bm_solid(bm, crest_profile(), 0.0, 0.55))
    solid('crest_band', 'bone', lambda bm: bm_solid(bm, [(x * 0.94, (z - top) * 0.94 + top + 0.02) for x, z in crest_profile()], -0.06, 0.0), bevel=0.02)
    def volutes(bm):
        for s in (-1, 1):
            m = Matrix.Translation((s * 0.27 * CREST_W, -0.05, top + 0.52 * CREST_H)) @ Matrix.Rotation(-3.14159 / 2, 4, 'X')
            bm_prism(bm, 12, 0.28, 0.28, 0.0, 0.65, rot=0, xform=m)
            m2 = Matrix.Translation((s * 0.27 * CREST_W, -0.12, top + 0.52 * CREST_H)) @ Matrix.Rotation(-3.14159 / 2, 4, 'X')
            bm_prism(bm, 12, 0.14, 0.14, 0.0, 0.2, rot=0, xform=m2)
    solid('volutes', 'bone', volutes, bevel=0.03)
    # the medallion, proud of the crest
    solid('medallion', 'lamp', lambda bm: bm_prism(bm, 16, 0.35, 0.35, 0.0, 0.16, rot=0,
          xform=Matrix.Translation((0, 0.0, top + 0.95)) @ Matrix.Rotation(3.14159 / 2, 4, 'X')), bevel=0.02)
    solid('medallion_ring', 'bone', lambda bm: bm_prism(bm, 16, 0.42, 0.42, 0.0, 0.08, rot=0,
          xform=Matrix.Translation((0, 0.0, top + 0.95)) @ Matrix.Rotation(3.14159 / 2, 4, 'X')), bevel=0.02)
    # the cornice at the roof line, with dentils
    solid('cornice_a', 'bone', lambda bm: bm_box(bm, (D.W, 0.34, 0.14), (0, 0.03, top - 0.34)), bevel=0.03)
    solid('cornice_b', 'bone', lambda bm: bm_box(bm, (D.W, 0.5, 0.22), (0, 0.05, top - 0.14)), bevel=0.03)
    D.dentils('bone', top - 0.5, n=12, size=0.14, proud=0.08)
    # pediments over the windows: a small cornice and a low triangle
    def pediments(bm):
        for f in range(2):
            z = D.F0 + f * D.FH + 0.5 + D.WIN_H + 0.12
            for dx in (-D.WIN_X, D.WIN_X):
                bm_box(bm, (D.WIN_W + 0.5, 0.2, 0.12), (dx, 0.0, z))
                bm_solid(bm, [(-0.75, z + 0.06), (0.75, z + 0.06), (0, z + 0.42)], -0.12, 0.05, Matrix.Translation((dx, 0, 0)))
    solid('pediments', 'bone', pediments, bevel=0.02)


def build():
    D.build_bay(parapet, 'walk', column_col='walk')
    D.pilaster('bone', D.TOP - D.F0 + 1.0, cap=True)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
