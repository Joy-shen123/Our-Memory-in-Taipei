# girl.py — 張君雅小妹妹, the girl who runs down the middle of the street, as a stylized glb
# with a two-frame run (issue #5 step 4).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/girl.py -- --out asset/models/girl.glb
#
# Reference: the engine's primitive girl in app.js — bowl-cut black hair with a straight fringe,
# white shirt, dark pinafore skirt on two straps with a bib, red cheeks, a bowl of noodles carried
# in both hands in front of her, bare legs, dark shoes. Suggested by the 張君雅 character, not
# copied. Same size as the primitive: 2.73 tall to the top of the head (the scene scales by 1.15).
#
# Frame: metres, Blender Z up. She faces -Y (glTF +Z, the library convention). Origin on the
# ground between her feet.
#
# Two glb nodes, `runA` and `runB`, share every static part (head, hair, torso, skirt) and differ
# only in the legs, the arms and the bowl height: runA has the left leg forward, runB the right.
# The engine shows one or the other by stride phase. Both are built from the same helper so they
# line up exactly. Shared mechanics live in stylized.py in this folder.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_lathe, bm_sphere, solid

SWING = math.radians(25)        # leg swing, forward and back
HIP_Z = 0.85
LEG_L = 0.8
SHOULDER = (0.3, 0.0, 2.1)      # x mirrored for the other arm
BOWL = (0.0, -0.5, 1.78)        # bowl centre; runA carries it a little higher, runB lower


# ─────────────────────────────────────────────────────────────────────────────
# static parts
# ─────────────────────────────────────────────────────────────────────────────
def head(g):
    solid('head', 'bone', lambda bm: bm_sphere(bm, 0.27, (0, 0, 2.46), 14, 10), bevel=0, group=g)
    # cheeks: two red dots on the front of the face
    def cheeks(bm):
        for x in (-0.17, 0.17):
            bm_sphere(bm, 0.06, (x, -0.22, 2.33), 8, 6)
    solid('cheeks', 'verm', cheeks, bevel=0, group=g)


def hair(g):
    """Bowl cut: a lathe cap over the top of the head that comes down past the ears, the back of
    the bowl filled in behind, a straight fringe across the forehead."""
    def cap(bm):
        r, cz, n = 0.305, 2.47, 8
        prof = [(0.0, cz + r)]
        for i in range(1, n + 1):
            a = i / n * math.pi * 0.44                    # the top of the head, stopping above the eyes
            prof.append((r * math.sin(a), cz + r * math.cos(a)))
        prof.append((0.0, prof[-1][1]))                    # flat underside
        bm_lathe(bm, prof, n=16)
    solid('hair_cap', 'ink', cap, bevel=0, group=g)
    # the bowl's rim: the back and the two sides come down to the ears, the front is the fringe
    solid('hair_back', 'ink', lambda bm: bm_box(bm, (0.58, 0.22, 0.34), (0, 0.15, 2.36)), bevel=0.05, group=g)
    def sides(bm):
        for x in (-0.25, 0.25):
            bm_box(bm, (0.1, 0.3, 0.28), (x, 0.04, 2.4))
    solid('hair_sides', 'ink', sides, bevel=0.04, group=g)
    solid('fringe', 'ink', lambda bm: bm_box(bm, (0.5, 0.15, 0.16), (0, -0.21, 2.47)), bevel=0.04, group=g)


def torso(g):
    """White shirt: a rounded box, the pinafore straps over its shoulders and the bib in front."""
    solid('shirt', 'bone', lambda bm: bm_box(bm, (0.52, 0.32, 0.6), (0, 0, 1.92)), bevel=0.05, group=g)
    # short sleeves: a little wider than the shirt at the shoulders
    def sleeves(bm):
        for x in (-0.31, 0.31):
            bm_box(bm, (0.12, 0.26, 0.2), (x, 0, 2.1))
    solid('sleeves', 'bone', sleeves, bevel=0.05, group=g)
    def straps(bm):
        for x in (-0.13, 0.13):
            bm_box(bm, (0.09, 0.35, 0.6), (x, 0, 1.92))
    solid('straps', 'ink', straps, bevel=0.03, group=g)
    solid('bib', 'ink', lambda bm: bm_box(bm, (0.36, 0.36, 0.22), (0, 0, 1.73)), bevel=0.03, group=g)


def skirt(g):
    """Dark pinafore skirt: a flared lathe from the hem up under the shirt."""
    prof = [(0.0, 0.8), (0.5, 0.8), (0.47, 0.86), (0.36, 1.2), (0.28, 1.5), (0.25, 1.7), (0.0, 1.7)]
    solid('skirt', 'ink', lambda bm: bm_lathe(bm, prof, n=16), bevel=0.03, group=g)


# ─────────────────────────────────────────────────────────────────────────────
# the moving parts: legs, arms, the bowl
# ─────────────────────────────────────────────────────────────────────────────
def leg_matrix(x, forward):
    """Hip at (x, 0, HIP_Z); the leg runs down local -Z. A rotation about X by -SWING swings the
    foot toward -Y (forward), +SWING toward +Y (back)."""
    return Matrix.Translation((x, 0, HIP_Z)) @ Matrix.Rotation(-SWING if forward else SWING, 4, 'X')


def legs(g, left_forward):
    def skin(bm):
        for x, fwd in ((-0.15, left_forward), (0.15, not left_forward)):
            M = leg_matrix(x, fwd)
            bm_box(bm, (0.16, 0.16, LEG_L), (0, 0, -LEG_L / 2), M)
    solid('legs', 'bone', skin, bevel=0.04, group=g)
    def shoes(bm):
        for x, fwd in ((-0.15, left_forward), (0.15, not left_forward)):
            M = leg_matrix(x, fwd)
            bm_box(bm, (0.2, 0.3, 0.11), (0, -0.05, -LEG_L + 0.02), M)       # the shoe, toe forward
    solid('shoes', 'ink', shoes, bevel=0.03, group=g)


def arms_and_bowl(g, dz):
    bowl_c = Vector(BOWL) + Vector((0, 0, dz))
    def arms(bm):
        for s in (-1, 1):
            sh = Vector((s * SHOULDER[0], SHOULDER[1], SHOULDER[2]))
            hand = bowl_c + Vector((s * 0.27, 0.02, 0.1))
            bm_bar(bm, sh, hand, 0.13)
            bm_sphere(bm, 0.08, hand, 8, 6)                                     # the hand on the rim
    solid('arms', 'bone', arms, bevel=0.03, group=g)
    T = Matrix.Translation(bowl_c)
    prof = [(0.0, 0.0), (0.2, 0.0), (0.3, 0.2), (0.3, 0.24), (0.0, 0.24)]
    solid('bowl', 'bone', lambda bm: bm_lathe(bm, prof, n=14, xform=T), bevel=0.03, group=g)
    solid('noodles', 'lamp', lambda bm: bm_sphere(bm, 0.24, bowl_c + Vector((0, 0, 0.17)), 12, 8, scale_z=0.5), bevel=0, group=g)
    solid('egg', 'verm', lambda bm: bm_sphere(bm, 0.07, bowl_c + Vector((0.09, -0.06, 0.34)), 8, 6), bevel=0, group=g)
    def chopsticks(bm):
        for i, x in enumerate((-0.05, 0.03)):
            p0 = bowl_c + Vector((x, 0.02 + i * 0.03, 0.2))
            p1 = p0 + Vector((0.24 + i * 0.03, 0.06, 0.26))                   # leaning out to her left
            bm_bar(bm, p0, p1, 0.025)
    solid('chopsticks', 'ink', chopsticks, bevel=0, group=g)


# ─────────────────────────────────────────────────────────────────────────────
def frame(g, left_forward, bowl_dz):
    head(g)
    hair(g)
    torso(g)
    skirt(g)
    legs(g, left_forward)
    arms_and_bowl(g, bowl_dz)


def build():
    frame('runA', left_forward=True, bowl_dz=0.03)
    frame('runB', left_forward=False, bowl_dz=-0.03)


if __name__ == '__main__':
    S.run(build, camera=((3.0, -4.0, 2.2), (0.0, 0.0, 1.4), 40))
