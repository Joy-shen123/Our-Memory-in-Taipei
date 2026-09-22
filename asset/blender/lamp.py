# lamp.py — a street lamp as a stylized glb (issue #5 step 3, instanced along both sidewalks).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/lamp.py -- --out asset/models/lamp.glb [--preview x.png] [--stats]
#
# 5.5 m tall: a fluted base, a tapering post (0.22 → 0.14), a curved arm bending toward the road
# (−Y), a small brace under it, and a lantern head with a cap. Origin at the base centre, front
# (the arm) toward −Y, so the engine can instance it with per-instance rotation. Lathes and tubes
# carry no bevel: they are already round, and their smooth normals do the rest. Shared mechanics in
# stylized.py.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_lathe


def bm_tube(bm, pts, r, n=8):
    """A round tube swept along a polyline (local helper, not in stylized.py): one ring per
    point, in the plane normal to the local tangent, capped at both ends. Smooth around bends."""
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        q = (b - a).normalized().to_track_quat('Z', 'Y')
        ring = [bm.verts.new(p + q @ Vector((r * math.cos(k * 2 * math.pi / n), r * math.sin(k * 2 * math.pi / n), 0))) for k in range(n)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])

H_POST = 4.7            # where the arm leaves the post
ARM_END = (0.0, -1.4, 5.38)


def post():
    """Fluted base rings, then the tapering post with a small cap."""
    prof = [(0, 0), (0.34, 0), (0.34, 0.12), (0.28, 0.15), (0.28, 0.32), (0.24, 0.36),
            (0.22, 0.6), (0.14, 4.6), (0.16, 4.62), (0.16, H_POST), (0, H_POST)]
    S.solid('post', 'haze', lambda bm: bm_lathe(bm, prof, n=10), bevel=0)


def arm():
    """A curved arm: short bar segments along a quadratic curve from the post top out over the road."""
    pts = S.quad((0, H_POST - 0.05), (-0.6, 5.45), (ARM_END[1], ARM_END[2]), n=8, include_start=True)

    def build(bm):
        bm_tube(bm, [(0, y, z) for y, z in pts], 0.05, n=8)
        bm_tube(bm, [(0, 0, 4.15), (0, -0.62, 5.12)], 0.03, n=6)  # the diagonal brace
    S.solid('arm', 'haze', build, bevel=0)


def head():
    """The lantern: an eight-sided glowing body under a small cap at the arm's end."""
    x, y, z = ARM_END
    T = Matrix.Translation((x, y, 0))
    body = [(0, 5.28), (0.12, 5.28), (0.25, 5.05), (0.22, 4.8), (0.12, 4.7), (0, 4.7)]
    cap = [(0, 5.5), (0.3, 5.3), (0.3, 5.26), (0, 5.26)]
    S.solid('lantern', 'lamp', lambda bm: bm_lathe(bm, body, n=8, xform=T), bevel=0)
    S.solid('cap', 'haze', lambda bm: bm_lathe(bm, cap, n=8, xform=T), bevel=0)


def build():
    post()
    arm()
    head()


if __name__ == '__main__':
    S.run(build, camera=None)
