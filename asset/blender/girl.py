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
from stylized import bm_box, bm_bar, bm_solid, bm_lathe, bm_sphere, quad, solid, cutter

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


def rrect(w, h, r, cz, n=4):
    """A rounded rectangle in the X-Z plane, centred at (0, cz): four quarter-circle corners."""
    hw, hh = w / 2 - r, h / 2 - r
    pts = []
    for cx, cy, a0 in ((hw, -hh, -90), (hw, hh, 0), (-hw, hh, 90), (-hw, -hh, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cz + cy + r * math.sin(a)))
    return pts


def hair(g):
    """The bowl cut as ONE solid of revolution with the face cut out of it, not a cap plus a back
    block plus two side flaps plus a fringe bar. HANDOFF: "the girl's bowl cut is a cap, a back
    block, side flaps and a fringe (seams up close)" — four parts meeting at four hard seams, and
    the fringe bar read like a visor. The lathe runs from the crown down past the ears to a rolled
    hem; the boolean takes out a rounded face window whose straight top edge is the fringe line."""
    # max radius 0.298 against the head's 0.27: a thicker shell leaves a black rim all round the
    # face and the whole head reads as a helmet whatever the window does
    prof = [(0.00, 2.775), (0.095, 2.770), (0.172, 2.745), (0.234, 2.690), (0.276, 2.606),
            (0.294, 2.500), (0.298, 2.410), (0.292, 2.345), (0.272, 2.308), (0.235, 2.296),
            (0.00, 2.296)]

    def face_window(bm):
        # the window widens toward the chin: a straight-sided one leaves flaps 0.22 deep at the
        # cheeks and the whole thing reads as a crash helmet
        pts = [(-0.285, 2.02), (0.285, 2.02), (0.252, 2.40)]
        pts += quad((0.252, 2.40), (0.252, 2.464), (0.182, 2.464), 3)
        pts.append((-0.182, 2.464))
        pts += quad((-0.182, 2.464), (-0.252, 2.464), (-0.252, 2.40), 3)
        bm_solid(bm, pts, -0.45, -0.04)

    def ear_notches(bm):
        # lift the hair above the ears on both sides while the back stays long down to the nape.
        # A lathe alone is the same height all round, which is what read as a crash helmet. Its
        # own cutter object, not merged into the face window: two overlapping solids in one cutter
        # mesh make it self-intersecting and the EXACT solver then removes the whole hair.
        for sx in (-1, 1):
            bm_box(bm, (0.30, 0.34, 0.3), (sx * 0.31, -0.02, 2.17))
    c1 = cutter('face_window', 'ink', face_window)
    c2 = cutter('ear_notches', 'ink', ear_notches)
    solid('hair', 'ink', lambda bm: bm_lathe(bm, prof, n=20), bevel=0.03, cutters=(c1, c2), group=g)


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
    # a curved wall on a foot ring with a rolled rim, instead of a straight-sided cone
    prof = [(0.0, 0.015), (0.115, 0.015), (0.125, 0.0), (0.155, 0.0), (0.178, 0.035),
            (0.228, 0.105), (0.276, 0.185), (0.300, 0.245), (0.310, 0.276),
            (0.294, 0.296), (0.252, 0.290), (0.0, 0.290)]
    solid('bowl', 'bone', lambda bm: bm_lathe(bm, prof, n=18, xform=T), bevel=0.02, group=g)
    solid('noodles', 'lamp', lambda bm: bm_sphere(bm, 0.25, bowl_c + Vector((0, 0, 0.23)), 14, 9, scale_z=0.42), bevel=0, group=g)
    solid('egg', 'verm', lambda bm: bm_sphere(bm, 0.07, bowl_c + Vector((0.09, -0.06, 0.38)), 10, 7), bevel=0, group=g)
    def chopsticks(bm):
        for i, x in enumerate((-0.05, 0.03)):
            p0 = bowl_c + Vector((x, 0.02 + i * 0.03, 0.24))
            p1 = p0 + Vector((0.24 + i * 0.03, 0.06, 0.26))                   # leaning out to her left
            bm_bar(bm, p0, p1, 0.025)
    solid('chopsticks', 'ink', chopsticks, bevel=0, group=g)


# ─────────────────────────────────────────────────────────────────────────────
def backpack(g):
    """書包, the school backpack (CJ, 2026-09-23: 「後面背個書包好了」): a soft red bag on her back
    with a flap over its top and a mustard buckle, and two straps curving over the shoulders down
    to the chest. Body and flap are extruded rounded rectangles rather than boxes, so the vertical
    corners are actually round instead of chamfered, and the straps follow a curve instead of
    turning a hard corner at the shoulder. The shirt's back face is at y +0.16."""
    solid('pack', 'verm', lambda bm: bm_solid(bm, rrect(0.44, 0.5, 0.13, 1.86), 0.17, 0.38), bevel=0.06, group=g)
    solid('pack_flap', 'verm', lambda bm: bm_solid(bm, rrect(0.47, 0.2, 0.08, 2.05), 0.15, 0.41), bevel=0.05, group=g)
    solid('pack_buckle', 'lamp', lambda bm: bm_box(bm, (0.11, 0.05, 0.09), (0, 0.40, 1.97)), bevel=0.02, group=g)

    def straps(bm):
        for x in (-0.15, 0.15):
            path = quad((0.22, 2.02), (0.20, 2.24), (0.0, 2.21), 3, include_start=True)      # over the shoulder
            path += quad((0.0, 2.21), (-0.20, 2.18), (-0.19, 2.00), 3)                       # down the chest
            path += [(-0.185, 1.70)]
            for (y0, z0), (y1, z1) in zip(path, path[1:]):
                bm_bar(bm, (x, y0, z0), (x, y1, z1), 0.075, t2=0.045)
    solid('pack_straps', 'verm', straps, bevel=0.0, group=g)


def frame(g, left_forward, bowl_dz):
    head(g)
    hair(g)
    torso(g)
    backpack(g)
    skirt(g)
    legs(g, left_forward)
    arms_and_bowl(g, bowl_dz)


def build():
    frame('runA', left_forward=True, bowl_dz=0.03)
    frame('runB', left_forward=False, bowl_dz=-0.03)


if __name__ == '__main__':
    S.run(build, camera=((3.0, -4.0, 2.2), (0.0, 0.0, 1.4), 40))
