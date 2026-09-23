# dihua-min.py — 閩南 style Dihua Street bay: plain red brick, wooden shutters, a low brick
# parapet over a pale string course and a brick dentil course. Shared bay in dihua_common.py.
#
#   Blender --background --python asset/blender/dihua-min.py -- --out asset/models/dihua-min.glb

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, solid
import dihua_common as D


def parapet():
    # pale string course at the roof line, the brick parapet above it, dentils below
    solid('string_course', 'bone', lambda bm: bm_box(bm, (D.W, 0.3, 0.2), (0, 0.05, D.TOP - 0.1)), bevel=0.03)
    solid('parapet', 'brick', lambda bm: bm_box(bm, (D.W, 0.5, 0.7), (0, 0.25, D.TOP + 0.35)))
    solid('parapet_cap', 'bone', lambda bm: bm_box(bm, (D.W, 0.6, 0.12), (0, 0.25, D.TOP + 0.76)), bevel=0.03)
    D.dentils('brick', D.TOP - 0.38)
    # wooden shutters folded open beside every window
    def shutters(bm):
        for f in range(2):
            z = D.F0 + f * D.FH + 0.5
            for dx in (-D.WIN_X, D.WIN_X):
                for s in (-1, 1):
                    bm_box(bm, (0.42, 0.07, D.WIN_H), (dx + s * (D.WIN_W / 2 + 0.38), -0.035, z + D.WIN_H / 2))
                    for k in range(4):
                        bm_box(bm, (0.3, 0.03, 0.06), (dx + s * (D.WIN_W / 2 + 0.38), -0.085, z + 0.3 + k * 0.45))
    solid('shutters', 'ink', shutters, bevel=0.02)


def build():
    D.build_bay(parapet, 'brick')
    D.pilaster('brick', D.TOP - D.F0)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
