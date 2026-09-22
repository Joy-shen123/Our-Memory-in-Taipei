# chunghwa.py — one 中華商場 block (Chunghwa Market, 1961–1992) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/chunghwa.py -- --out asset/models/chunghwa.glb [--preview x.png] [--stats]
#
# Reference (HANDOFF.md): the eight blocks 忠孝仁愛信義和平 along 中華路: an arcade of shops at
# street level with columns at the kerb, small balcony windows on the floor above, a flat roof
# that carried the steel-framed neon signs. CJ, 2026-09-21: 「盡量矮點才能比較後來的建設跟慢慢長大的感覺」
# so the block is drawn at two storeys. The rooftop sign frame, its text board and the 忠棟 …
# name plates stay as scene parts (canvas text); nothing here carries text.
#
# Frame: metres, Blender Z up. Front (the arcade line, toward the road) is the plane y = 0 and
# faces -Y, which the exporter turns into +Z; scene-red.js rotates it +π/2 so the front looks at
# the road from the west side. Depth runs into +y, the 10 m frontage along X about 0, origin on
# the ground at the front line's centre. Sizes match the primitive build in scene-red.js.
#
# Look: primitives, boolean-cut openings, bevelled edges, flat palette materials (stylized.py).

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, bm_bar, bm_cylinder, rect_pts, face_frame, solid, cutter

# ── dimensions (metres), from scene-red.js section 2 ─────────────────────────
L = 10.0            # block length along the street (X)
FLOOR = 3.3         # storey height
DEPTH = 10.0        # into +y
WALL_Y0, WALL_Y1 = 1.5, 4.5     # the ground-floor shop wall, behind the arcade
DOOR_XS = [-L / 2 + 1.7 + k * 3.3 for k in range(3)]
COL_XS = [-L / 2 + 0.45 + k * (L - 0.9) / 3 for k in range(4)]


def arcade_columns():
    """Four square columns on the kerb line, proud of the front plane."""
    def build(bm):
        for x in COL_XS:
            bm_box(bm, (0.5, 0.5, FLOOR), (x, -0.25, FLOOR / 2))
    solid('columns', 'walk', build)


def shop_wall():
    """The ground-floor shop wall with three open, dark doorways cut into it."""
    front = face_frame(0, -WALL_Y0)       # the wall's road face at y = WALL_Y0, outward -Y
    doors = cutter('doorways', 'ink', lambda bm: [
        bm_solid(bm, rect_pts(2.0, 2.2, 0.0), -0.6, 0.6, front @ Matrix.Translation((x, 0, 0))) for x in DOOR_XS])
    solid('shop_wall', 'haze', lambda bm: bm_box(bm, (L, WALL_Y1 - WALL_Y0, FLOOR), (0, (WALL_Y0 + WALL_Y1) / 2, FLOOR / 2)), cutters=(doors,))
    # the shops' back rooms: a plain body from the shop wall to the block's rear, so the upper
    # storey stands on something
    solid('back_rooms', 'haze', lambda bm: bm_box(bm, (L, DEPTH - WALL_Y1 + 0.2, FLOOR), (0, (WALL_Y1 - 0.2 + DEPTH) / 2, FLOOR / 2)))
    # door frames: a pale surround on the wall around each opening
    def frames(bm):
        for x in DOOR_XS:
            bm_box(bm, (0.16, 0.14, 2.3), (x - 1.08, 0.02, 1.15), front)
            bm_box(bm, (0.16, 0.14, 2.3), (x + 1.08, 0.02, 1.15), front)
            bm_box(bm, (2.32, 0.14, 0.16), (x, 0.02, 2.22), front)
    solid('door_frames', 'bone', frames, bevel=0.02)


def shop_signs():
    """A flat sign board over each doorway, alternating red and warm."""
    front = face_frame(0, -WALL_Y0 + 0.05)
    for k, x in enumerate(DOOR_XS):
        col = 'verm' if k % 2 == 0 else 'lamp'
        solid(f'sign_{k}', col, lambda bm, x=x: bm_box(bm, (2.6, 0.1, 0.7), (x, -0.05, 2.55), front), bevel=0.03)


def arcade_ceiling():
    """The slab over the arcade, from the kerb line back to the shop wall."""
    solid('arcade_slab', 'walk', lambda bm: bm_box(bm, (L, WALL_Y0 + 0.1, 0.3), (0, WALL_Y0 / 2, FLOOR - 0.15)), bevel=0.03)


def upper_storey():
    """The floor over the arcade, full depth, with three balcony windows on the road face."""
    front = face_frame(0, 0)
    z0 = FLOOR
    win = cutter('windows', 'ink', lambda bm: [
        bm_solid(bm, rect_pts(1.0, 1.4, z0 + 1.0), -0.6, 0.3, front @ Matrix.Translation((x, 0, 0))) for x in DOOR_XS])
    solid('upper', 'bone', lambda bm: bm_box(bm, (L, DEPTH, FLOOR), (0, DEPTH / 2, z0 + FLOOR / 2)), cutters=(win,))
    # window frames and sills
    def frames(bm):
        for x in DOOR_XS:
            bm_box(bm, (0.12, 0.12, 1.6), (x - 0.56, 0.0, z0 + 1.7), front)
            bm_box(bm, (0.12, 0.12, 1.6), (x + 0.56, 0.0, z0 + 1.7), front)
            bm_box(bm, (1.24, 0.12, 0.12), (x, 0.0, z0 + 2.46), front)
            bm_box(bm, (1.3, 0.2, 0.1), (x, -0.02, z0 + 0.95), front)     # sill
            bm_box(bm, (0.05, 0.06, 1.4), (x, 0.15, z0 + 1.7), front)     # mullion in the glass
    solid('win_frames', 'bone', frames, bevel=0.02)
    # balconies: a small slab and a railing of thin bars in front of each window
    def balconies(bm):
        for x in DOOR_XS:
            bm_box(bm, (1.8, 0.7, 0.12), (x, -0.35, z0 + 0.06), front)
    solid('balcony_slabs', 'haze', balconies, bevel=0.03)
    def rails(bm):
        for x in DOOR_XS:
            bm_box(bm, (1.8, 0.05, 0.06), (x, -0.68, z0 + 0.95), front)        # top rail
            for i in range(9):
                bm_box(bm, (0.04, 0.04, 0.85), (x - 0.8 + i * 0.2, -0.68, z0 + 0.52), front)
            for s in (-1, 1):
                bm_box(bm, (0.04, 0.68, 0.85), (x + s * 0.88, -0.35, z0 + 0.52), front)  # side rails
            bm_box(bm, (0.05, 0.68, 0.06), (x - 0.88, -0.35, z0 + 0.95), front)
            bm_box(bm, (0.05, 0.68, 0.06), (x + 0.88, -0.35, z0 + 0.95), front)
    solid('balcony_rails', 'haze', rails, bevel=0.0)


def parapet():
    """Roof slab and low parapet, overhanging the walls by 0.15."""
    z0 = FLOOR * 2
    solid('roof_slab', 'haze', lambda bm: bm_box(bm, (L + 0.3, DEPTH + 0.3, 0.5), (0, DEPTH / 2, z0 + 0.25)))


def rooftop():
    """The stair-head box and a water tank on four legs."""
    z0 = FLOOR * 2 + 0.5
    solid('stair_head', 'bone', lambda bm: bm_box(bm, (2.4, 2.6, 1.6), (-2.6, 6.5, z0 + 0.8)))
    solid('stair_door', 'ink', lambda bm: bm_box(bm, (0.8, 0.1, 1.3), (-2.6, 5.16, z0 + 0.65)), bevel=0.0)
    def tank(bm):
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_box(bm, (0.12, 0.12, 0.9), (2.5 + sx * 0.6, 6.5 + sy * 0.6, z0 + 0.45))
        bm_cylinder(bm, 0.85, z0 + 0.9, z0 + 2.1, n=14, center=(2.5, 6.5))
        bm_cylinder(bm, 0.9, z0 + 2.05, z0 + 2.2, n=14, center=(2.5, 6.5))
    solid('water_tank', 'walk', tank, bevel=0.03)


def build():
    arcade_columns()
    shop_wall()
    shop_signs()
    arcade_ceiling()
    upper_storey()
    parapet()
    rooftop()


if __name__ == '__main__':
    S.run(build, camera=((14, -12, 4), (0, 2, 3), 45))
