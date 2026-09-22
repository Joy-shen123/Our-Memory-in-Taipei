# shopfront.py — the Ximending shopfront body (issue #5 step 3): the building behind the library
# storefronts, replacing scene-red.js body() boxes. Three groups in one glb so the scene tiles
# them: 'ground' (z 0..3.3, shutter box, recessed shop, sign band, AC), 'storey' (z 0..3.3, two
# windows, balcony, AC), 'roof' (parapet, water tank, stair head, to z 2.0). Each 6.0 wide (X ±3),
# 9.2 deep (y 0..9.2), front toward -Y, origin at its own base so instances stack.
#
#   Blender --background --python asset/blender/shopfront.py -- --out asset/models/shopfront.glb

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe, bm_solid, rect_pts, solid, cutter

W, DEPTH, H = 6.0, 9.2, 3.3
FRONT = S.face_frame(0, 0)


def ground():
    g = 'ground'
    c = cutter('shop_recess', 'ink', lambda bm: bm_solid(bm, rect_pts(4.2, 2.6, 0.05), -0.5, 0.6, FRONT))
    solid('g_body', 'bone', lambda bm: bm_box(bm, (W, DEPTH, H), (0, DEPTH / 2, H / 2)), cutters=(c,), group=g)
    solid('g_shutter_box', 'haze', lambda bm: bm_box(bm, (4.5, 0.36, 0.42), (0, 0.05, 2.85)), bevel=0.03, group=g)
    solid('g_sign', 'bone', lambda bm: bm_box(bm, (5.4, 0.1, 0.5), (0, -0.05, 3.03)), bevel=0.02, group=g)
    def frame(bm):
        for s in (-1, 1):
            bm_box(bm, (0.12, 0.12, 2.6), (s * 2.1, 0.02, 1.35))
        bm_box(bm, (4.32, 0.12, 0.12), (0, 0.02, 2.66))
        bm_box(bm, (4.32, 0.12, 0.08), (0, 0.02, 0.09))
        bm_box(bm, (0.08, 0.08, 2.5), (0.7, 0.05, 1.3))               # door post
    solid('g_frame', 'haze', frame, bevel=0.0, group=g)
    solid('g_ac', 'haze', lambda bm: bm_box(bm, (0.6, 0.35, 0.5), (2.5, -0.17, 2.55)), bevel=0.03, group=g)
    def step(bm):
        bm_box(bm, (4.4, 0.3, 0.12), (0, -0.15, 0.06))
    solid('g_step', 'walk', step, bevel=0.03, group=g)


def storey():
    g = 'storey'
    sur = cutter('s_surround', 'bone', lambda bm: [bm_solid(bm, rect_pts(1.5, 1.9, 0.8), -0.5, 0.06, FRONT @ Matrix.Translation((dx, 0, 0))) for dx in (-1.5, 1.5)])
    rec = cutter('s_recess', 'ink', lambda bm: [bm_solid(bm, rect_pts(1.3, 1.7, 0.9), -0.5, 0.25, FRONT @ Matrix.Translation((dx, 0, 0))) for dx in (-1.5, 1.5)])
    solid('s_body', 'bone', lambda bm: bm_box(bm, (W, DEPTH, H), (0, DEPTH / 2, H / 2)), cutters=(sur, rec), group=g)
    def trim(bm):
        for dx in (-1.5, 1.5):
            bm_box(bm, (1.7, 0.2, 0.1), (dx, 0.0, 0.85))
            bm_box(bm, (0.06, 0.06, 1.7), (dx, 0.18, 1.75))
            bm_box(bm, (1.3, 0.06, 0.06), (dx, 0.18, 1.9))
    solid('s_trim', 'bone', trim, bevel=0.02, group=g)
    # the small balcony: slab and rails across the front
    solid('s_balcony', 'walk', lambda bm: bm_box(bm, (3.6, 0.9, 0.16), (0, -0.45, 0.08)), bevel=0.03, group=g)
    def rails(bm):
        bm_box(bm, (3.6, 0.06, 0.06), (0, -0.87, 1.05))
        for i in range(-8, 9):
            bm_box(bm, (0.04, 0.04, 0.9), (i * 0.21, -0.87, 0.6))
        for s in (-1, 1):
            bm_box(bm, (0.06, 0.84, 0.06), (s * 1.8, -0.45, 1.05))
            for k in range(3):
                bm_box(bm, (0.04, 0.04, 0.9), (s * 1.8, -0.15 - k * 0.3, 0.6))
    solid('s_rails', 'haze', rails, bevel=0.0, group=g)
    solid('s_ac', 'haze', lambda bm: bm_box(bm, (0.6, 0.35, 0.5), (2.6, -0.17, 1.3)), bevel=0.03, group=g)
    solid('s_band', 'bone', lambda bm: bm_box(bm, (W, 0.1, 0.16), (0, -0.03, 3.22)), bevel=0.02, group=g)


def roof():
    g = 'roof'
    def parapet(bm):
        bm_box(bm, (W, 0.3, 0.6), (0, 0.15, 0.3))
        bm_box(bm, (0.3, DEPTH - 0.3, 0.6), (-W / 2 + 0.15, DEPTH / 2 + 0.15, 0.3))
        bm_box(bm, (0.3, DEPTH - 0.3, 0.6), (W / 2 - 0.15, DEPTH / 2 + 0.15, 0.3))
        bm_box(bm, (W, 0.3, 0.6), (0, DEPTH - 0.15, 0.3))
    solid('r_parapet', 'bone', parapet, bevel=0.03, group=g)
    solid('r_cap', 'walk', lambda bm: bm_box(bm, (W + 0.1, 0.4, 0.08), (0, 0.15, 0.62)), bevel=0.02, group=g)
    solid('r_slab', 'haze', lambda bm: bm_box(bm, (W - 0.6, DEPTH - 0.6, 0.1), (0, DEPTH / 2, 0.05)), bevel=0.0, group=g)
    # water tank on legs
    def tank(bm):
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_box(bm, (0.08, 0.08, 0.7), (1.6 + sx * 0.5, 4.0 + sy * 0.5, 0.35))
        bm_box(bm, (1.2, 1.2, 0.06), (1.6, 4.0, 0.73))
    solid('r_tank_legs', 'ink', tank, bevel=0.0, group=g)
    solid('r_tank', 'walk', lambda bm: bm_lathe(bm, [(0, 0.76), (0.55, 0.76), (0.58, 0.9), (0.58, 1.75), (0.5, 1.9), (0, 1.95)], n=12, xform=Matrix.Translation((1.6, 4.0, 0))), bevel=0.0, group=g)
    # stair head with a door and a small roof
    solid('r_stair', 'bone', lambda bm: bm_box(bm, (2.0, 2.6, 1.9), (-1.4, 6.0, 0.95)), group=g)
    solid('r_stair_roof', 'ink', lambda bm: bm_box(bm, (2.3, 2.9, 0.12), (-1.4, 6.0, 1.94)), bevel=0.03, group=g)
    solid('r_stair_door', 'ink', lambda bm: bm_box(bm, (0.8, 0.06, 1.6), (-1.4, 4.68, 0.85)), bevel=0.0, group=g)


def build():
    ground()
    storey()
    roof()


if __name__ == '__main__':
    S.run(build, camera=((9, -10, 4), (0, 2, 2), 45))
