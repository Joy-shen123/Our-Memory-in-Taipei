# dihua-min.py — 閩南 style Dihua Street bay: plain red brick, wooden shutters, and a brick
# parapet with recessed panels between end piers over a corbelled brick cornice. Shared bay in
# dihua_common.py; everything here goes in the 'crest' group.
#
#   Blender --background --python asset/blender/dihua-min.py -- --out asset/models/dihua-min.glb

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, solid, cutter
import dihua_common as D


def parapet():
    """The 閩南 parapet, modelled rather than plated: a pale string course, three recessed brick
    panels between two end piers, a corbelled brick cornice under it, and a stone cap that steps
    up over each pier."""
    top = D.TOP
    solid('string_course', 'bone', lambda bm: bm_box(bm, (D.W, 0.3, 0.2), (0, 0.05, top - 0.1)), bevel=0.03, group='crest')
    D.dentils('brick', top - 0.38)

    # the parapet wall, with three panels sunk into its street face
    def panels(bm):
        for dx in (-1.32, 0.0, 1.32):
            bm_box(bm, (1.04, 0.2, 0.42), (dx, -0.02, top + 0.38))
    c = cutter('parapet_panels', 'brick', panels)
    solid('parapet', 'brick', lambda bm: bm_box(bm, (D.W, 0.5, 0.7), (0, 0.25, top + 0.35)), cutters=(c,), group='crest')

    def piers(bm):
        for s in (-1, 1):
            bm_box(bm, (0.5, 0.62, 0.94), (s * (D.HW - 0.25), 0.21, top + 0.47))
            bm_box(bm, (0.62, 0.72, 0.14), (s * (D.HW - 0.25), 0.21, top + 1.01))     # pier cap
    solid('parapet_piers', 'brick', piers, bevel=0.03, group='crest')
    solid('parapet_cap', 'bone', lambda bm: bm_box(bm, (D.W - 0.5, 0.6, 0.12), (0, 0.25, top + 0.76)), bevel=0.03, group='crest')

    # wooden shutters folded open beside every window, on both storeys
    def shutters(bm, z):
        for dx in (-D.WIN_X, D.WIN_X):
            for s in (-1, 1):
                bm_box(bm, (0.42, 0.07, D.WIN_H), (dx + s * (D.WIN_W / 2 + 0.38), -0.035, z + D.WIN_H / 2))
                for k in range(4):
                    bm_box(bm, (0.3, 0.03, 0.06), (dx + s * (D.WIN_W / 2 + 0.38), -0.085, z + 0.3 + k * 0.45))
    solid('shutters', 'ink', lambda bm: shutters(bm, D.F0 + 0.5), bevel=0.02, group='main')
    solid('shutters_s', 'ink', lambda bm: shutters(bm, D.STOREY_Z + 0.5), bevel=0.02, group='storey')


def build():
    D.build_bay(parapet, 'brick')


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
