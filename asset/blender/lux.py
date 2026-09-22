# lux.py — 樂聲戲院 (Lux Theatre, 1964) on 武昌街 as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/lux.py -- --out asset/models/lux.glb [--preview x.png] [--stats]
#
# Reference (HANDOFF.md): a plain block on the electric street whose whole street face was
# covered by painters' billboards for the current films, a marquee canopy over the doors, poster
# cases at the pavement, a vertical 樂聲戲院 neon on the corner. Drawn at three storeys (the
# childhood street stays low). The billboards, the top board and the corner neon stay as
# scene parts (canvas text) flush on the front; this model gives each a proud frame and leaves
# the wall flat behind it. Nothing here carries text.
#
# Frame: metres, Blender Z up. Front (toward the road) is the plane y = 0 facing -Y, which the
# exporter turns into +Z; scene-red.js rotates it +π/2 so the front looks at the road from the
# west side (Blender +X → world -z). Depth into +y, 15 m frontage along X about 0, origin on the
# ground at the front line's centre. Sizes match the primitive build in scene-red.js.
#
# Look: primitives, boolean-cut openings, bevelled edges, flat palette materials (stylized.py).

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, bm_bar, bm_cylinder, bm_sphere, rect_pts, face_frame, solid, cutter

# ── dimensions (metres), from scene-red.js section 3 ─────────────────────────
W = 15.0            # frontage along X
D = 12.0            # depth into +y
H = 10.0            # roof line
MARQ_Z = 4.2        # marquee canopy underside
MARQ_OUT = 1.6      # how far it projects over the pavement
MARQ_HW = 6.5       # half width
LOBBY_DEPTH = 1.2
# where the scene's text boards sit on the front: (centre x, z bottom, width, height)
BOARDS = [(-3.7, 4.6, 6.8, 3.9), (3.7, 4.6, 6.8, 3.9), (0.0, 8.55, 13.8, 1.4)]
CASE_XS = [-5 + 2 * k for k in range(6)]

FRONT = face_frame(0, 0)


def block():
    """The plain block with the lobby recess cut into its front under the marquee, and a few
    plain windows on the side faces."""
    lobby = cutter('lobby_cut', 'ink', lambda bm: bm_solid(bm, rect_pts(9.0, MARQ_Z - 0.15, 0.15), -0.6, LOBBY_DEPTH, FRONT))
    def sides(bm):
        for th in (math.pi / 2, 3 * math.pi / 2):
            F = face_frame(th, W / 2, (0, D / 2, 0))
            for k in range(3):
                for z in (5.4, 7.9):
                    bm_solid(bm, rect_pts(1.0, 1.5, z), -0.6, 0.25, F @ Matrix.Translation((-3.5 + k * 3.5, 0, 0)))
    side_win = cutter('side_windows', 'ink', sides)
    solid('block', 'bone', lambda bm: bm_box(bm, (W, D, H), (0, D / 2, H / 2)), cutters=(lobby, side_win))
    # side window frames
    def frames(bm):
        for th in (math.pi / 2, 3 * math.pi / 2):
            F = face_frame(th, W / 2, (0, D / 2, 0))
            for k in range(3):
                for z in (5.4, 7.9):
                    x = -3.5 + k * 3.5
                    bm_box(bm, (1.3, 0.16, 0.1), (x, -0.02, z - 0.05), F)     # sill
                    bm_box(bm, (0.05, 0.06, 1.5), (x, 0.12, z + 0.75), F)     # mullion
    solid('side_frames', 'bone', frames, bevel=0.02)


def roof():
    """Roof slab overhanging 0.2, a parapet lip, a plant box, and the sign lattice along the back."""
    solid('roof_slab', 'haze', lambda bm: bm_box(bm, (W + 0.4, D + 0.4, 0.5), (0, D / 2, H + 0.25)))
    solid('roof_plant', 'haze', lambda bm: bm_box(bm, (3.0, 2.4, 1.2), (4.5, 7.0, H + 0.5 + 0.6)))
    def lattice(bm):
        y = D - 0.6
        for x in (-5.5, -2.75, 0.0, 2.75, 5.5):
            bm_box(bm, (0.14, 0.14, 4.0), (x, y, H + 0.5 + 2.0))
            bm_bar(bm, (x, y - 1.6, H + 0.5), (x, y, H + 3.6), 0.1)          # a brace to each post
        for z in (H + 2.0, H + 3.4, H + 4.5):
            bm_box(bm, (11.3, 0.12, 0.12), (0, y, z))
    solid('sign_lattice', 'ink', lattice, bevel=0.0)


def board_frames():
    """Proud pale frames around the scene's billboard positions on the front."""
    def build(bm):
        for cx, z0, w, h in BOARDS:
            for s in (-1, 1):
                bm_box(bm, (0.2, 0.1, h + 0.4), (cx + s * (w / 2 + 0.1), -0.05, z0 + h / 2), FRONT)
            for zz in (z0 - 0.1, z0 + h + 0.1):
                bm_box(bm, (w + 0.4, 0.1, 0.2), (cx, -0.05, zz), FRONT)
    solid('board_frames', 'bone', build, bevel=0.03)
    # a narrow ledge under the two big billboards, the painters' scaffold line
    solid('ledge', 'haze', lambda bm: bm_box(bm, (W - 0.6, 0.35, 0.12), (0, -0.17, 4.42), FRONT), bevel=0.03)


def marquee():
    """The canopy over the doors: an ink slab, a warm lit band along its front edge, two thin
    posts to the pavement, and a row of bulbs under the lip."""
    y_out = -MARQ_OUT
    solid('marquee', 'ink', lambda bm: bm_box(bm, (MARQ_HW * 2, MARQ_OUT + 0.3, 0.35), (0, y_out / 2 + 0.15, MARQ_Z + 0.175)))
    solid('marquee_lip', 'lamp', lambda bm: bm_box(bm, (MARQ_HW * 2 + 0.1, 0.12, 0.25), (0, y_out - 0.03, MARQ_Z + 0.5)), bevel=0.03)
    def posts(bm):
        for x in (-MARQ_HW, MARQ_HW):
            bm_box(bm, (0.08, 0.08, MARQ_Z), (x, y_out + 0.1, MARQ_Z / 2))
    solid('marquee_posts', 'ink', posts, bevel=0.0)
    def bulbs(bm):
        for i in range(13):
            bm_sphere(bm, 0.09, (-6 + i * 1.0, y_out + 0.35, MARQ_Z - 0.06), 8, 5)
    solid('marquee_bulbs', 'lamp', bulbs, bevel=0.0)


def entrance():
    """Inside the lobby recess: a row of glazed doors with pale frames, a ticket booth on the
    right, and a step up from the pavement."""
    y = LOBBY_DEPTH - 0.05
    def doors(bm):
        for k in range(4):
            x = -3.6 + k * 1.6
            bm_box(bm, (0.1, 0.12, 2.6), (x - 0.7, y, 1.45), FRONT)
            bm_box(bm, (0.1, 0.12, 2.6), (x + 0.7, y, 1.45), FRONT)
            bm_box(bm, (1.5, 0.12, 0.12), (x, y, 2.7), FRONT)
            bm_box(bm, (1.5, 0.12, 0.08), (x, y, 0.95), FRONT)               # push bar
        bm_box(bm, (7.0, 0.1, 0.4), (-1.2, y, 3.0), FRONT)                   # transom over the doors
    solid('doors', 'bone', doors, bevel=0.02)
    solid('booth', 'walk', lambda bm: bm_box(bm, (1.6, 1.0, 2.4), (3.6, 0.55, 1.2)), bevel=0.03)
    solid('booth_window', 'ink', lambda bm: bm_box(bm, (1.0, 0.1, 0.9), (3.6, 0.02, 1.6)), bevel=0.0)
    solid('booth_top', 'verm', lambda bm: bm_box(bm, (1.8, 1.2, 0.2), (3.6, 0.55, 2.5)), bevel=0.03)
    solid('step', 'walk', lambda bm: bm_box(bm, (9.2, 0.6, 0.15), (0, -0.25, 0.075)), bevel=0.03)


def poster_cases():
    """Six glazed poster cases along the pavement wall, either side of the entrance."""
    def frames(bm):
        for x in CASE_XS:
            if abs(x) < 4.6:
                continue                                                     # not across the lobby
            bm_box(bm, (0.1, 0.06, 1.8), (x - 0.65, -0.03, 1.8), FRONT)
            bm_box(bm, (0.1, 0.06, 1.8), (x + 0.65, -0.03, 1.8), FRONT)
            bm_box(bm, (1.4, 0.06, 0.1), (x, -0.03, 0.95), FRONT)
            bm_box(bm, (1.4, 0.06, 0.1), (x, -0.03, 2.65), FRONT)
    solid('case_frames', 'bone', frames, bevel=0.02)
    def glass(bm):
        for x in CASE_XS:
            if abs(x) < 4.6:
                continue
            bm_box(bm, (1.2, 0.04, 1.6), (x, -0.02, 1.8), FRONT)
    solid('case_glass', 'ink', glass, bevel=0.0)


def build():
    block()
    roof()
    board_frames()
    marquee()
    entrance()
    poster_cases()


if __name__ == '__main__':
    S.run(build, camera=((18, -16, 5), (0, 2, 5), 45))
