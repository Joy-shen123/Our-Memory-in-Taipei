# stall.py — one 年貨大街 stall (issue #5 step 3), instanced along the Dadaocheng road.
# From scene-dadao.js fest: table 3.0 (X) x 1.6 (Y), 0.9 tall, goods on top, a red canopy
# 3.6 x 2.2 at z 2.25 on two front posts. The customer side faces -Y. The red price boards are
# scene text parts at x ±0.5, y -0.85, z 0.95..1.4: that space stays free.
#
#   Blender --background --python asset/blender/stall.py -- --out asset/models/stall.glb

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe, bm_sphere, bm_solid, solid

TABLE_H = 0.9


def table():
    solid('table_top', 'haze', lambda bm: bm_box(bm, (3.0, 1.6, 0.08), (0, 0, TABLE_H - 0.04)), bevel=0.03)
    # the cloth skirt on three sides, with a scalloped hem
    def skirt(bm):
        bm_box(bm, (3.0, 0.04, TABLE_H - 0.12), (0, -0.78, (TABLE_H - 0.12) / 2))
        for s in (-1, 1):
            bm_box(bm, (0.04, 1.6, TABLE_H - 0.12), (s * 1.48, 0, (TABLE_H - 0.12) / 2))
        for i in range(-3, 4):
            bm_box(bm, (0.36, 0.05, 0.08), (i * 0.42, -0.8, 0.06))
    solid('skirt', 'bone', skirt, bevel=0.0)
    def legs(bm):
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_box(bm, (0.07, 0.07, TABLE_H - 0.08), (sx * 1.35, sy * 0.65, (TABLE_H - 0.08) / 2))
    solid('legs', 'ink', legs, bevel=0.0)


def goods():
    z = TABLE_H
    # sacks: squashed spheres, mouths tied
    def sacks(bm):
        for i, (x, y, r, col) in enumerate([(-1.05, 0.25, 0.34, 0), (-0.45, 0.3, 0.32, 0), (-0.75, -0.3, 0.3, 0)]):
            bm_sphere(bm, r, (x, y, z + r * 0.75), 10, 7, scale_z=0.8)
            bm_lathe(bm, [(0, z + r * 1.35), (0.1, z + r * 1.4), (0.07, z + r * 1.55), (0, z + r * 1.6)], n=8, xform=Matrix.Translation((x, y, 0)))
    solid('sacks', 'bone', sacks, bevel=0.0)
    # boxes of dried goods, stacked
    def boxes(bm):
        bm_box(bm, (0.7, 0.55, 0.3), (0.35, 0.3, z + 0.15))
        bm_box(bm, (0.62, 0.5, 0.26), (0.38, 0.32, z + 0.43))
        bm_box(bm, (0.5, 0.42, 0.24), (1.1, 0.35, z + 0.12))
    solid('boxes', 'brick', boxes, bevel=0.03)
    def heap(bm):
        bm_box(bm, (0.68, 0.48, 0.22), (0.35, 0.32, z + 0.56 + 0.1))
        bm_sphere(bm, 0.2, (1.1, 0.35, z + 0.34), 8, 6, scale_z=0.55)
    solid('heap', 'lamp', heap, bevel=0.03)
    # jars and a scale on the front edge
    def jars(bm):
        prof = [(0, 0), (0.13, 0), (0.15, 0.12), (0.13, 0.26), (0.09, 0.3), (0.1, 0.34), (0, 0.34)]
        for k, x in enumerate((0.85, 1.15, 1.32)):
            y = -0.45 + (k % 2) * 0.28
            bm_lathe(bm, [(r, zz + z) for r, zz in prof], n=10, xform=Matrix.Translation((x, y, 0)))
    solid('jars', 'verm', jars, bevel=0.0)
    def scale(bm):
        bm_lathe(bm, [(0, z), (0.16, z), (0.16, z + 0.05), (0.03, z + 0.05), (0.03, z + 0.5), (0, z + 0.5)], n=8, xform=Matrix.Translation((-1.25, -0.5, 0)))
        bm_lathe(bm, [(0, z + 0.48), (0.2, z + 0.5), (0.22, z + 0.53), (0, z + 0.53)], n=10, xform=Matrix.Translation((-1.25, -0.5, 0)))
    solid('scale', 'ink', scale, bevel=0.0)
    # a hanging string of goods under the canopy front
    def hanging(bm):
        bm_box(bm, (3.2, 0.03, 0.03), (0, -0.85, 2.05))
        for i in range(6):
            x = -1.25 + i * 0.5
            bm_box(bm, (0.02, 0.02, 0.35), (x, -0.85, 1.87))
            bm_sphere(bm, 0.09, (x, -0.85, 1.62), 8, 5, scale_z=1.4)
    solid('hanging', 'lamp', hanging, bevel=0.0)


def canopy():
    solid('canopy', 'verm', lambda bm: bm_box(bm, (3.6, 2.2, 0.12), (0, 0.0, 2.25 + 0.06)), bevel=0.04)
    # a ridge fold along the middle and the scalloped bone edge
    solid('canopy_ridge', 'verm', lambda bm: bm_solid(bm, [(-1.8, 2.37), (1.8, 2.37), (0, 2.62)], -1.05, 1.05), bevel=0.03)
    def scallops(bm):
        for i in range(-4, 5):
            x = i * 0.42
            bm_solid(bm, [(-0.2, 2.2), (0.2, 2.2), (0.2, 2.34), (0, 2.08), (-0.2, 2.34)], -1.12, -1.06, Matrix.Translation((x, 0, 0)))
        for s in (-1, 1):
            for j in range(-2, 3):
                bm_solid(bm, [(-0.2, 2.34), (0.2, 2.34), (0, 2.08)], 0.0, 0.06,
                         Matrix.Translation((s * 1.8 + (0.0 if s > 0 else -0.06), j * 0.44, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z'))
    solid('scallops', 'bone', scallops, bevel=0.0)
    def posts(bm):
        for s in (-1, 1):
            bm_box(bm, (0.07, 0.07, 2.28), (s * 1.6, -0.9, 1.14))
            bm_box(bm, (0.07, 0.07, 2.28), (s * 1.6, 0.9, 1.14))
            bm_box(bm, (0.07, 1.87, 0.07), (s * 1.6, 0.0, 2.2))
        bm_box(bm, (3.27, 0.07, 0.07), (0, -0.9, 2.2))
    solid('posts', 'ink', posts, bevel=0.0)
    # the bulb on its cord under the canopy
    def bulb(bm):
        bm_box(bm, (0.02, 0.02, 0.35), (0, -0.2, 2.07))
        bm_lathe(bm, [(0, 1.92), (0.05, 1.92), (0.05, 1.86), (0.09, 1.8), (0.09, 1.7), (0.05, 1.64), (0, 1.63)], n=10, xform=Matrix.Translation((0, -0.2, 0)))
    solid('bulb', 'lamp', bulb, bevel=0.0)


def build():
    table()
    goods()
    canopy()


if __name__ == '__main__':
    S.run(build, camera=((5, -6, 3), (0, 0, 1.2), 45))
