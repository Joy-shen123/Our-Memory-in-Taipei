# yongle.py — 永樂市場 (Yongle Market, 1982) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/yongle.py -- --out asset/models/yongle.glb
# Optional check render:  ... --preview /tmp/yongle.png --stats
#
# Reference (HANDOFF.md): the 1982 concrete market on Dihua Street: a pale block, floors 2–5
# with horizontal window bands, floors 6–7 stepped back, an open shaded ground floor on columns
# (the wet market; the scene puts the cloth-bolt stalls under it), a rooftop sign frame. The
# scene's canvas-text signs (紅 vertical 永樂市場, 永樂布業商場 board, rooftop name) stay in
# scene-dadao.js, so the front stays flat at z 4.5..5.8 across the middle and nothing stands
# in front of the face beyond x 11.6.
#
# Frame: metres, Blender Z up. scene-dadao.js places the glb at world (-9.3, 0, -274) with
# rotation.y = +π/2, so Blender -Y → world +x (toward the road) and Blender +X → world -z.
# The front face is the plane y = 0, the building runs into +y (16 m deep), the 22 m frontage
# runs along X about 0. Origin on the ground at the front face's centre.
#
# Sizes match the primitive build in scene-dadao.js: ground hall 4.0, floors 2–5 to 17.6
# (x ±11, y 0..16), floors 6–7 to 24.4 (x ±8, y 4..16), rooftop sign frame to 26.6.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_prism, solid, cutter

# ── dimensions (metres), from scene-dadao.js ─────────────────────────────────
HALF_W = 11.0            # half the street frontage (22 m along X)
DEPTH = 16.0             # the block runs y 0..16
GROUND_H = 4.0           # the open wet-market floor
FLOOR_H = 3.4            # storey height above it
LOW_TOP = GROUND_H + 4 * FLOOR_H       # 17.6: top of floors 2–5
UP_HALF_W = 8.0          # floors 6–7 stepped back: x ±8
UP_Y0, UP_Y1 = 4.0, 16.0               # ... and y 4..16
UP_TOP = LOW_TOP + 2 * FLOOR_H         # 24.4
RECESS = 0.35            # window band depth
WIN_Z0, WIN_H = 2.0, 1.1               # window band from base + 2.0, 1.1 tall (clear of the text board at 4.5..5.8)
MULLION_STEP = 1.6


# ─────────────────────────────────────────────────────────────────────────────
# ground floor: the open hall in shade, columns at the kerb line, the ceiling slab
# ─────────────────────────────────────────────────────────────────────────────
def ground_floor():
    solid('hall', 'haze', lambda bm: bm_box(bm, (21.6, 15.0, GROUND_H), (0, 8.5, GROUND_H / 2)))
    solid('ceiling_slab', 'walk', lambda bm: bm_box(bm, (2 * HALF_W, DEPTH, 0.3), (0, DEPTH / 2, GROUND_H - 0.15)), bevel=0.03)

    def cols(bm):
        n = 7
        for i in range(n):
            x = -10.6 + i * (21.2 / (n - 1))
            bm_box(bm, (0.6, 0.6, GROUND_H - 0.3), (x, -0.3, (GROUND_H - 0.3) / 2))
            bm_box(bm, (0.8, 0.8, 0.12), (x, -0.3, 0.06))                     # base plate
    solid('columns', 'walk', cols, bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# the two concrete blocks, each with window bands cut into the front and both sides
# ─────────────────────────────────────────────────────────────────────────────
def band_block(name, half_w, y0, y1, z0, floors, front_pad, side_pad):
    """A 'walk' block x ±half_w, y y0..y1, z z0..z0 + floors*FLOOR_H with, per floor, a recessed
    ink window band, bone mullions inside it and a proud bone sill ledge. Corner piers are left
    solid (front_pad / side_pad from the corner) so the cutters never overlap."""
    h = floors * FLOOR_H
    yc = (y0 + y1) / 2
    d = y1 - y0

    def block(bm):
        bm_box(bm, (2 * half_w, d, h), (0, yc, z0 + h / 2))

    def recesses(bm):
        for f in range(floors):
            base = z0 + f * FLOOR_H
            zc = base + WIN_Z0 + WIN_H / 2
            bm_box(bm, (2 * (half_w - front_pad), RECESS + 0.5, WIN_H), (0, y0 - 0.25 + RECESS / 2, zc))    # front
            for s in (-1, 1):                                                                                  # sides
                bm_box(bm, (RECESS + 0.5, d - 2 * side_pad, WIN_H), (s * (half_w + 0.25 - RECESS / 2), yc, zc))
    rec = cutter(name + '_recess', 'ink', recesses)

    def joints(bm):                                                             # vertical expansion joints
        for x in (-half_w / 2, half_w / 2):
            bm_box(bm, (0.08, 0.5, h - 0.4), (x, y0 - 0.17, z0 + h / 2))
    jnt = cutter(name + '_joints', 'ink', joints)
    solid(name, 'walk', block, cutters=(rec, jnt))

    def mullions(bm):
        for f in range(floors):
            base = z0 + f * FLOOR_H
            zc = base + WIN_Z0 + WIN_H / 2
            nx = int((2 * (half_w - front_pad) - 0.4) // MULLION_STEP)
            for i in range(nx + 1):
                x = -(nx * MULLION_STEP) / 2 + i * MULLION_STEP
                bm_box(bm, (0.1, 0.3, WIN_H), (x, y0 + 0.15, zc))
            ny = int((d - 2 * side_pad - 0.4) // MULLION_STEP)
            for i in range(ny + 1):
                y = yc - (ny * MULLION_STEP) / 2 + i * MULLION_STEP
                for s in (-1, 1):
                    bm_box(bm, (0.3, 0.1, WIN_H), (s * (half_w - 0.15), y, zc))
    solid(name + '_mullions', 'bone', mullions, bevel=0.0)

    def ledges(bm):                                                             # the sill ledge under each band, proud of the wall
        for f in range(floors):
            base = z0 + f * FLOOR_H
            zc = base + WIN_Z0 - 0.07
            bm_box(bm, (2 * half_w + 0.24, 0.24, 0.16), (0, y0 - 0.06, zc))
            for s in (-1, 1):
                bm_box(bm, (0.24, d + 0.1, 0.16), (s * (half_w + 0.06), yc, zc))
    solid(name + '_ledges', 'bone', ledges, bevel=0.03)


def lower_block():
    band_block('lower', HALF_W, 0.0, DEPTH, GROUND_H, 4, front_pad=0.6, side_pad=0.6)
    solid('lower_roof', 'ink', lambda bm: bm_box(bm, (2 * HALF_W + 0.2, DEPTH + 0.2, 0.25), (0, DEPTH / 2, LOW_TOP + 0.125)), bevel=0.03)


def upper_block():
    band_block('upper', UP_HALF_W, UP_Y0, UP_Y1, LOW_TOP, 2, front_pad=0.6, side_pad=0.6)
    solid('upper_roof', 'ink', lambda bm: bm_box(bm, (2 * UP_HALF_W + 0.2, UP_Y1 - UP_Y0 + 0.2, 0.25), (0, (UP_Y0 + UP_Y1) / 2, UP_TOP + 0.125)), bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# rooftop: the sign frame (the scene's canvas text fills it), plant room, water tank
# ─────────────────────────────────────────────────────────────────────────────
def rooftop():
    z0 = UP_TOP + 0.25

    def frame(bm):
        for x in (-5.5, -1.8, 1.8, 5.5):
            bm_box(bm, (0.15, 0.15, 2.4), (x, 4.35, z0 + 1.2))
            bm_bar(bm, (x, 4.35, z0 + 2.3), (x, 6.6, z0), 0.12)                # struts back to the roof
        bm_box(bm, (11.15, 0.15, 0.15), (0, 4.35, z0 + 0.1))
        bm_box(bm, (11.15, 0.15, 0.15), (0, 4.35, z0 + 2.3))
    solid('sign_frame', 'ink', frame, bevel=0.0)

    def plant(bm):
        bm_box(bm, (4.0, 4.0, 2.6), (-4.0, 11.0, z0 + 1.3))
    def plant_door(bm):
        bm_box(bm, (0.9, 0.5, 2.0), (-4.0, 9.0, z0 + 1.0))
    solid('plant_room', 'walk', plant, cutters=(cutter('plant_door', 'ink', plant_door),))
    solid('plant_cap', 'bone', lambda bm: bm_box(bm, (4.3, 4.3, 0.2), (-4.0, 11.0, z0 + 2.7)), bevel=0.03)

    def tank(bm):
        S.bm_cylinder(bm, 1.2, z0 + 0.7, z0 + 2.7, n=14, center=(5.0, 11.0))
        bm_prism(bm, 14, 1.3, 0.25, z0 + 2.7, z0 + 3.2, rot=0, center=(5.0, 11.0))
    solid('water_tank', 'haze', tank, bevel=0.03)

    def legs(bm):
        for dx in (-0.8, 0.8):
            for dy in (-0.8, 0.8):
                bm_box(bm, (0.14, 0.14, 0.7), (5.0 + dx, 11.0 + dy, z0 + 0.35))
        bm_box(bm, (2.0, 0.12, 0.12), (5.0, 11.0, z0 + 0.66))
        bm_box(bm, (0.12, 2.0, 0.12), (5.0, 11.0, z0 + 0.66))
    solid('tank_legs', 'ink', legs, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the stair tower on the back corner, drainpipes down the front
# ─────────────────────────────────────────────────────────────────────────────
def stair_tower():
    def tower(bm):
        bm_box(bm, (3.0, 3.5, 20.5), (9.5, 14.75, 10.25))
    def slots(bm):
        for z in (6.0, 9.4, 12.8, 16.2):
            bm_box(bm, (0.9, 0.7, 1.0), (11.0, 14.75, z))
    solid('stair_tower', 'walk', tower, cutters=(cutter('stair_slots', 'ink', slots),))
    solid('stair_cap', 'bone', lambda bm: bm_box(bm, (3.3, 3.8, 0.25), (9.5, 14.75, 20.6)), bevel=0.03)


def drainpipes():
    def pipes(bm):
        for s in (-1, 1):
            bm_box(bm, (0.14, 0.14, LOW_TOP - GROUND_H - 0.5), (s * (HALF_W + 0.12), -0.1, (GROUND_H + LOW_TOP) / 2))
            bm_box(bm, (0.14, 0.14, UP_TOP - LOW_TOP - 0.5), (s * (UP_HALF_W + 0.12), UP_Y0 - 0.1, (LOW_TOP + UP_TOP) / 2))
            bm_box(bm, (0.14, 0.4, 0.14), (s * (UP_HALF_W + 0.12), UP_Y0 - 0.25, LOW_TOP + 0.3))   # elbow onto the lower roof
    solid('drainpipes', 'haze', pipes, bevel=0.0)


def build():
    ground_floor()
    lower_block()
    upper_block()
    rooftop()
    stair_tower()
    drainpipes()


if __name__ == '__main__':
    S.run(build, camera=((24.0, -30.0, 8.0), (0.0, 4.0, 10.0), 50))
