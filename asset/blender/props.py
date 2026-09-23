# props.py — six small street props in one glb (issue #5 step 3, scattered densely and
# instanced): a wooden crate, a rice sack, a parked bicycle, an A-frame sign board, a potted
# plant and a stack of cardboard boxes.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/props.py -- --out asset/models/props.glb [--preview x.png] [--stats]
#   add --spread (before --) to lay the six out in a row for the preview only; never export spread.
#
# Each prop is its own glb node (group name = prop name) with its origin at its own base centre
# and its front toward −Y, real size, so the engine can instance each one on its own. Shared
# mechanics in stylized.py.

import math
import os
import sys

import bmesh
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe, bm_bar, bm_sphere

# --spread: preview-only offsets so the props do not sit on top of each other
SPREAD = '--spread' in sys.argv
if SPREAD:
    sys.argv.remove('--spread')
_slot = [0]


def bm_ring(bm, profile, n=12, xform=None):
    """A closed (r, z) profile revolved about Z into a ring with a hole (a tyre). Local helper:
    stylized.py's bm_lathe caps open ends, which would fill the hole."""
    rings = [[bm.verts.new((r * math.cos(i * 2 * math.pi / n), r * math.sin(i * 2 * math.pi / n), z)) for i in range(n)] for r, z in profile]
    m = len(rings)
    for j in range(m):
        a, b = rings[j], rings[(j + 1) % m]
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=[v for ring in rings for v in ring])


def offset():
    """The translation for the current prop: zero for export, 1.4 m steps along X for a spread preview."""
    T = Matrix.Translation((_slot[0] * 1.4 if SPREAD else 0, 0, 0))
    _slot[0] += 1
    return T


def crate():
    """A wooden crate 0.6 x 0.5 x 0.5: a brick-coloured body with pale slats and corner posts."""
    T = offset()
    W, D, H = 0.6, 0.5, 0.5
    S.solid('crate_body', 'brick', lambda bm: bm_box(bm, (W - 0.04, D - 0.04, H - 0.04), (0, 0, H / 2), T), bevel=0.04, group='crate')

    def slats(bm):
        for sx in (-1, 1):                                        # corner posts
            for sy in (-1, 1):
                bm_box(bm, (0.06, 0.06, H), (sx * (W / 2 - 0.03), sy * (D / 2 - 0.03), H / 2), T)
        for z in (0.09, 0.25, 0.41):                              # three slats round each side
            for sy in (-1, 1):
                bm_box(bm, (W - 0.12, 0.03, 0.09), (0, sy * (D / 2 - 0.015), z), T)
            for sx in (-1, 1):
                bm_box(bm, (0.03, D - 0.12, 0.09), (sx * (W / 2 - 0.015), 0, z), T)
    S.solid('crate_slats', 'bone', slats, bevel=0.03, group='crate')


def sack():
    """A rice sack 0.5 x 0.6: a lathe that bulges, pinches at the neck and flares at the tie."""
    T = offset()
    prof = [(0, 0), (0.22, 0), (0.26, 0.12), (0.25, 0.38), (0.19, 0.5), (0.1, 0.55), (0.12, 0.6), (0, 0.6)]
    S.solid('sack_body', 'bone', lambda bm: bm_lathe(bm, prof, n=10, xform=T), bevel=0, group='sack')
    S.solid('sack_tie', 'ink', lambda bm: bm_lathe(bm, [(0.1, 0.53), (0.125, 0.535), (0.125, 0.565), (0.1, 0.57)], n=10, xform=T), bevel=0, group='sack')


def bicycle():
    """A parked bicycle 1.7 long along Y, front toward −Y, 1.0 tall: solid ink wheels, a diamond
    frame of thin bars, a saddle, handlebars, pedals."""
    T = offset()
    R = 0.35
    rear, front = (0, 0.55, R), (0, -0.55, R)
    bb, seat, head = (0, 0.12, 0.3), (0, 0.28, 0.86), (0, -0.4, 0.8)
    W = Matrix.Rotation(math.pi / 2, 4, 'Y')                      # lathe axis Z → X (the axle)

    def wheels(bm):
        tyre = [(0.3, -0.02), (0.33, -0.03), (R, 0), (0.33, 0.03), (0.3, 0.02)]
        for y in (rear[1], front[1]):
            bm_ring(bm, tyre, n=14, xform=T @ Matrix.Translation((0, y, R)) @ W)
    S.solid('bike_wheels', 'ink', wheels, bevel=0, group='bicycle')

    def spokes(bm):
        for y in (rear[1], front[1]):
            for k in range(3):                                     # three bars through the hub
                a = k * math.pi / 3
                bm_bar(bm, (0, y + 0.3 * math.cos(a), R + 0.3 * math.sin(a)), (0, y - 0.3 * math.cos(a), R - 0.3 * math.sin(a)), 0.012, xform=T)
            bm_lathe(bm, [(0, -0.03), (0.04, -0.03), (0.04, 0.03), (0, 0.03)], n=8, xform=T @ Matrix.Translation((0, y, R)) @ W)   # hub
    S.solid('bike_spokes', 'haze', spokes, bevel=0, group='bicycle')

    def frame(bm):
        t = 0.03
        for a, b in ((rear, bb), (rear, seat), (bb, seat), (seat, head), (bb, head), (head, front)):
            bm_bar(bm, a, b, t, xform=T)
        bm_bar(bm, head, (0, -0.42, 0.98), t, xform=T)             # stem
        bm_bar(bm, (-0.24, -0.44, 0.98), (0.24, -0.44, 0.98), 0.025, xform=T)   # handlebar
        bm_bar(bm, (-0.09, 0.12, 0.3), (0.09, 0.12, 0.3), 0.025, xform=T)       # crank axle
        bm_box(bm, (0.04, 0.09, 0.02), (-0.11, 0.2, 0.34), T)     # pedals
        bm_box(bm, (0.04, 0.09, 0.02), (0.11, 0.04, 0.26), T)
        bm_box(bm, (0.32, 0.04, 0.16), (0, 0.4, 0.6), T)          # rear rack / carrier
    S.solid('bike_frame', 'haze', frame, bevel=0, group='bicycle')
    S.solid('bike_saddle', 'ink', lambda bm: bm_box(bm, (0.12, 0.26, 0.05), (0, 0.3, 0.9), T), bevel=0.02, group='bicycle')
    S.solid('bike_basket', 'walk', lambda bm: bm_box(bm, (0.3, 0.24, 0.18), (0, -0.62, 0.86), T), bevel=0.03, group='bicycle')


def aboard():
    """An A-frame sign board 0.6 wide, 0.9 tall: two blank pale panels leaning on ink legs, hinged at the top."""
    T = offset()
    lean = 0.28                                                   # radians off vertical
    L = 0.9 / math.cos(lean)                                      # panel length along the slope

    def panels(bm):
        for s in (-1, 1):
            R = Matrix.Rotation(s * lean, 4, 'X')
            bm_box(bm, (0.56, 0.02, L - 0.12), (0, s * 0.02, L / 2 + 0.02), T @ R)
    S.solid('aboard_panels', 'bone', panels, bevel=0, group='aboard')

    def legs(bm):
        for s in (-1, 1):
            R = Matrix.Rotation(s * lean, 4, 'X')
            for x in (-0.28, 0.28):
                bm_box(bm, (0.035, 0.035, L), (x, s * 0.0, L / 2), T @ R)
        bm_bar(bm, (-0.3, 0, 0.9), (0.3, 0, 0.9), 0.04, xform=T)   # hinge bar
        for s in (-1, 1):                                          # foot bars
            y = s * 0.9 * math.tan(lean)
            bm_bar(bm, (-0.3, y, 0.02), (0.3, y, 0.02), 0.035, xform=T)
    S.solid('aboard_legs', 'ink', legs, bevel=0, group='aboard')


def plant():
    """A potted plant 0.8 tall: a terracotta lathe pot and a cluster of leaf spheres."""
    T = offset()
    pot = [(0, 0), (0.15, 0), (0.19, 0.3), (0.22, 0.3), (0.22, 0.37), (0.19, 0.37), (0.19, 0.34), (0, 0.34)]
    S.solid('plant_pot', 'brick', lambda bm: bm_lathe(bm, pot, n=10, xform=T), bevel=0, group='plant')

    def leaves(bm):
        for x, y, z, r in ((0, 0, 0.58, 0.22), (0.14, 0.06, 0.5, 0.15), (-0.13, -0.08, 0.52, 0.15), (0.02, -0.14, 0.62, 0.13), (-0.04, 0.13, 0.64, 0.13)):
            bm_sphere(bm, r, (x, y, z), u=8, v=6, scale_z=0.9)
    S.solid('plant_leaves', 'leaf', leaves, bevel=0, group='plant')


def boxes():
    """Three cardboard boxes stacked and turned a little, 0.5 tall in all, a tape strip on each."""
    T = offset()
    stack = [((0.46, 0.36, 0.19), 0.0), ((0.4, 0.3, 0.17), 0.25), ((0.3, 0.26, 0.14), -0.2)]

    def cardboard(bm):
        z = 0
        for (w, d, h), rot in stack:
            bm_box(bm, (w, d, h), (0, 0, z + h / 2), T @ Matrix.Rotation(rot, 4, 'Z'))
            z += h
    S.solid('boxes_card', 'walk', cardboard, bevel=0.03, group='boxes')

    def tape(bm):
        z = 0
        for (w, d, h), rot in stack:
            z += h
            bm_box(bm, (0.05, d + 0.01, 0.006), (0, 0, z + 0.003), T @ Matrix.Rotation(rot, 4, 'Z'))
    S.solid('boxes_tape', 'haze', tape, bevel=0, group='boxes')


def build():
    crate()
    sack()
    bicycle()
    aboard()
    plant()
    boxes()


if __name__ == '__main__':
    S.run(build, camera=None)
