# red-house.py — 西門紅樓 (Ximen Red House, Kondo Juro, 1908) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/red-house.py -- --out asset/models/red-house.glb
# Optional check render (Workbench, flat colours):
#   ... -- --out asset/models/red-house.glb --preview /tmp/red-house.png
#
# Reference (HANDOFF.md, real-building tables): a two-storey red-brick octagon (~16 m across),
# eight arched openings at street level, paired windows above, pale string courses and corner
# quoins, an eight-sided slate roof with a lantern, and the one-storey cross-shaped market hall
# (十字樓) with gable roofs behind it. Sizes match the primitive build in scene-red.js so the glb
# lands in the same place: octagon circumradius 7.2, eave 8.8, the long arm 30 x 8.4 centred
# 21 m behind the octagon, the cross arm 8.4 x 30 centred 23 m behind.
#
# Frame: metres, Blender Z up. The front (the face toward the road) faces -Y, which the glTF
# exporter turns into +Z, the library convention (front faces +Z before rotation). The cross
# wing runs along +Y (away from the road). Origin at the octagon's centre on the ground.
#
# Look (issue #5, CJ 2026-09-23 「dont like low poly」): primitives with boolean cuts for the
# openings and a bevel on every edge, flat palette materials, no textures. The shared mechanics
# (builders, materials, bevel rules, join, export, preview) live in stylized.py in this folder.

import math
import os
import sys

import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_solid, bm_bar, arch_pts, rect_pts, circle_pts, face_frame, solid, cutter

# ── dimensions (metres), from scene-red.js ───────────────────────────────────
R = 7.2                 # octagon circumradius
APO = R * math.cos(math.pi / 8)          # apothem, the distance to a flat face (6.65)
HALF_SIDE = R * math.sin(math.pi / 8)    # half of one side (2.76)
EAVE = 8.8              # wall top
FLOOR = 4.55            # string course between the floors
ARM_H = 4.6             # cross-wing wall height
ARM_W = 8.4             # cross-wing arm width
ARM_L = 30.0            # cross-wing arm length
LONG_ARM_Y = 21.0       # long arm centre, behind the octagon (world x 37.6 - 16.6)
CROSS_ARM_Y = 23.0      # cross arm centre (world x 39.6 - 16.6)
# ─────────────────────────────────────────────────────────────────────────────
# the octagon
# ─────────────────────────────────────────────────────────────────────────────
ARCH_Z = 0.5                                 # arches start on top of the plinth
ARCH_W, ARCH_STRAIGHT = 2.5, 2.4             # the pale surround of a ground-floor arch (top 4.15)
OPEN_W, OPEN_STRAIGHT = 2.0, 2.15            # the dark opening inside it (top 3.65)
WIN_W, WIN_H, WIN_Z = 1.05, 2.45, 5.35       # upper-floor window surround
GLASS_W, GLASS_H = 0.78, 2.15                # the glass inside the surround
WIN_DX = 1.15                                # the pair sits at ±WIN_DX on each face


def octagon_walls():
    """The two-storey brick octagon with its openings cut in: a shallow pale surround, then a
    deeper dark recess, on all eight faces."""
    surround = bmesh.new()
    recess = bmesh.new()
    for k in range(8):
        F = face_frame(k * math.pi / 4, APO)
        # ground floor: one arched opening per face
        bm_solid(surround, arch_pts(ARCH_W, ARCH_STRAIGHT), -0.6, 0.12, F @ Matrix.Translation((0, 0, ARCH_Z)))
        bm_solid(recess, arch_pts(OPEN_W, OPEN_STRAIGHT), -0.6, 0.5, F @ Matrix.Translation((0, 0, ARCH_Z)))
        # upper floor: a pair of tall windows
        for dx in (-WIN_DX, WIN_DX):
            bm_solid(surround, rect_pts(WIN_W, WIN_H, WIN_Z), -0.6, 0.1, F @ Matrix.Translation((dx, 0, 0)))
            bm_solid(recess, rect_pts(GLASS_W, GLASS_H, WIN_Z + 0.15), -0.6, 0.32, F @ Matrix.Translation((dx, 0, 0)))
    c1 = S.new_cutter('oct_surround', surround, 'bone')
    c2 = S.new_cutter('oct_recess', recess, 'ink')
    solid('oct_walls', 'brick', lambda bm: bm_prism(bm, 8, R, R, 0.0, EAVE), cutters=(c1, c2))


def octagon_trim():
    """Plinth, a banded string course over a corbel row, and a cornice over a dentil row. The
    first pass flattened each of these into one plate, which is what reads as a low-poly box."""
    solid('oct_plinth', 'walk', lambda bm: bm_prism(bm, 8, R + 0.14, R + 0.14, 0.0, 0.5))

    def course(bm):
        bm_prism(bm, 8, R + 0.10, R + 0.10, FLOOR - 0.12, FLOOR)          # lower band
        bm_prism(bm, 8, R + 0.24, R + 0.24, FLOOR, FLOOR + 0.22)          # the proud main band
        bm_prism(bm, 8, R + 0.10, R + 0.10, FLOOR + 0.22, FLOOR + 0.36)   # upper band
    solid('oct_course', 'bone', course, bevel=0.03)

    def corbels(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, APO)
            for i in range(5):
                bm_box(bm, (0.28, 0.22, 0.18), (-2.0 + i * 1.0, 0.0, FLOOR - 0.23), F)
    solid('oct_corbels', 'bone', corbels, bevel=0.0, smooth=False)

    solid('oct_cornice_a', 'bone', lambda bm: bm_prism(bm, 8, R + 0.22, R + 0.22, EAVE - 0.55, EAVE - 0.25))
    solid('oct_cornice_b', 'bone', lambda bm: bm_prism(bm, 8, R + 0.36, R + 0.36, EAVE - 0.25, EAVE))

    def dentils(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, APO)
            for i in range(7):
                bm_box(bm, (0.28, 0.26, 0.26), (-2.1 + i * 0.7, -0.02, EAVE - 0.72), F)
    solid('oct_dentils', 'bone', dentils, bevel=0.0, smooth=False)


def octagon_quoins():
    """Corner quoins: a pale strip up each corner on both faces, with wider tooth blocks every
    other course so the corner reads as alternating stone."""
    def build(bm):
        for k in range(8):
            for face, sign in ((k, 1), ((k + 1) % 8, -1)):
                F = face_frame(face * math.pi / 4, APO)
                x = sign * (HALF_SIDE - 0.16)
                bm_box(bm, (0.32, 0.20, EAVE - 0.55 - 0.5), (x, 0.05, 0.5 + (EAVE - 0.55 - 0.5) / 2), F)
                for z in (0.95, 2.15, 3.35, 5.25, 6.45, 7.65):
                    bm_box(bm, (0.62, 0.24, 0.5), (sign * (HALF_SIDE - 0.31), 0.04, z), F)
    solid('oct_quoins', 'bone', build, bevel=0.03)


def octagon_openings_detail():
    """What sits inside and around the cut openings: keystones, transoms, moulded sills, lintels
    with their own keystone, and a two-bar-by-one-mullion sash in every upper window."""
    def bone(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, APO)
            top = ARCH_Z + ARCH_STRAIGHT + ARCH_W / 2
            bm_box(bm, (0.36, 0.2, 0.5), (0, 0.02, top - 0.1), F)                          # keystone
            bm_box(bm, (OPEN_W, 0.12, 0.08), (0, 0.32, ARCH_Z + OPEN_STRAIGHT), F)          # transom
            for dx in (-WIN_DX, WIN_DX):
                bm_box(bm, (WIN_W + 0.3, 0.22, 0.16), (dx, 0.02, WIN_Z - 0.08), F)          # sill
                bm_box(bm, (WIN_W + 0.54, 0.3, 0.1), (dx, -0.01, WIN_Z - 0.22), F)          # sill moulding
                bm_box(bm, (WIN_W + 0.3, 0.16, 0.22), (dx, 0.02, WIN_Z + WIN_H + 0.11), F)  # lintel
                bm_box(bm, (0.3, 0.22, 0.34), (dx, -0.01, WIN_Z + WIN_H + 0.14), F)         # lintel keystone
                bm_box(bm, (0.07, 0.08, GLASS_H), (dx, 0.24, WIN_Z + 0.15 + GLASS_H / 2), F)   # mullion
                for f in (0.36, 0.68):
                    bm_box(bm, (GLASS_W, 0.08, 0.07), (dx, 0.24, WIN_Z + 0.15 + GLASS_H * f), F)
    solid('oct_openings', 'bone', bone, bevel=0.02)


def octagon_fanlights():
    """Real fanlights in the eight arched openings: five glazing bars radiating from the transom's
    centre plus one concentric arc, and a pair of bars in the square part below. Issue #5 left the
    arches as plain dark recesses, which is the flat stand-in surface CJ keeps pointing at."""
    cz = ARCH_Z + OPEN_STRAIGHT                # the springing line, 2.65
    rr = OPEN_W / 2 - 0.06                     # the fanlight's radius inside the reveal

    def bars(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, APO)
            for i in range(1, 6):
                a = i * math.pi / 6
                bm_bar(bm, (0, 0.30, cz), (rr * math.cos(a), 0.30, cz + rr * math.sin(a)), 0.07, xform=F)
            arc = [(0.52 * math.cos(t * math.pi / 6), 0.30, cz + 0.52 * math.sin(t * math.pi / 6)) for t in range(7)]
            for q0, q1 in zip(arc, arc[1:]):
                bm_bar(bm, q0, q1, 0.06, xform=F)
            for dx in (-0.62, 0.0, 0.62):                                   # the sash below the transom
                bm_bar(bm, (dx, 0.30, ARCH_Z + 0.12), (dx, 0.30, cz - 0.05), 0.07, xform=F)
            bm_bar(bm, (-rr, 0.30, ARCH_Z + 1.15), (rr, 0.30, ARCH_Z + 1.15), 0.06, xform=F)
    solid('oct_fanlights', 'bone', bars, bevel=0.0)


def entrance():
    """The front entrance (face 0, toward the road): a pair of pale pilasters beside the arch and
    three steps down to the pavement."""
    F = face_frame(0, APO)

    def pil(bm):
        for dx in (-1.85, 1.85):
            bm_box(bm, (0.5, 0.3, FLOOR - 0.5), (dx, 0.0, 0.5 + (FLOOR - 0.5) / 2), F)
            bm_box(bm, (0.7, 0.36, 0.22), (dx, 0.0, FLOOR - 0.11), F)     # capital
    solid('entrance_pilasters', 'bone', pil, bevel=0.03)

    def steps(bm):
        for i in range(3):
            bm_box(bm, (3.6 + i * 0.5, 0.5, 0.15), (0, -0.25 - i * 0.5, 0.075 + (2 - i) * 0.15), F)
    solid('entrance_steps', 'walk', steps, bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# the roof and the lantern
# ─────────────────────────────────────────────────────────────────────────────
ROOF_R = R + 0.6
ROOF_Z0 = EAVE + 0.3
ROOF_TOP_R = 0.95
ROOF_Z1 = EAVE + 3.75


def roof():
    solid('eave', 'ink', lambda bm: bm_prism(bm, 8, R + 0.7, R + 0.7, EAVE, EAVE + 0.3))
    solid('roof', 'ink', lambda bm: bm_prism(bm, 8, ROOF_R, ROOF_TOP_R, ROOF_Z0, ROOF_Z1))
    # slate courses: three thin steps up the slope, same colour, only the bevel shows them
    def courses(bm):
        for t in (0.28, 0.55, 0.8):
            r = ROOF_R + (ROOF_TOP_R - ROOF_R) * t
            z = ROOF_Z0 + (ROOF_Z1 - ROOF_Z0) * t
            bm_prism(bm, 8, r + 0.09, r + 0.09 - 0.05, z - 0.05, z + 0.07)
    solid('roof_courses', 'ink', courses, bevel=0.03)
    # hips: a pale bar down each corner, and the apex ring
    def hips(bm):
        for i in range(8):
            a = math.pi / 8 + i * math.pi / 4
            p0 = (ROOF_TOP_R * math.cos(a), ROOF_TOP_R * math.sin(a), ROOF_Z1 + 0.02)
            p1 = ((ROOF_R + 0.1) * math.cos(a), (ROOF_R + 0.1) * math.sin(a), ROOF_Z0 + 0.02)
            bm_bar(bm, p0, p1, 0.16)
        bm_prism(bm, 8, ROOF_TOP_R + 0.1, ROOF_TOP_R + 0.1, ROOF_Z1 - 0.06, ROOF_Z1 + 0.1)
    solid('roof_hips', 'haze', hips, bevel=0.03)


def lantern():
    """The small octagonal lantern on the apex: louvred faces, its own cornice, cap and finial."""
    z0 = ROOF_Z1
    LR = 0.82
    louvres = bmesh.new()
    for k in range(8):
        F = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
        bm_solid(louvres, rect_pts(0.34, 0.72, 0.3), -0.4, 0.1, F)
    cut = S.new_cutter('lantern_louvres', louvres, 'ink')
    solid('lantern', 'bone', lambda bm: bm_prism(bm, 8, LR, LR, z0, z0 + 1.3), bevel=0.03, cutters=(cut,))
    def louvre_bars(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
            for z in (0.45, 0.62, 0.79, 0.96):
                bm_box(bm, (0.34, 0.08, 0.05), (0, 0.05, z), F)
    solid('lantern_bars', 'bone', louvre_bars, bevel=0.0)
    def frames(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
            for dx in (-0.22, 0.22):
                bm_box(bm, (0.1, 0.16, 0.86), (dx, -0.02, 0.73), F)
            for dz in (0.24, 1.09):
                bm_box(bm, (0.54, 0.16, 0.1), (0, -0.02, dz), F)
    solid('lantern_frames', 'bone', frames, bevel=0.0, smooth=False)

    def piers(bm):
        for k in range(8):
            a = math.pi / 8 + k * math.pi / 4
            x, y = LR * 0.97 * math.cos(a), LR * 0.97 * math.sin(a)
            bm_bar(bm, (x, y, z0), (x, y, z0 + 1.32), 0.15)
    solid('lantern_piers', 'bone', piers, bevel=0.0)

    solid('lantern_cornice', 'bone', lambda bm: bm_prism(bm, 8, LR + 0.16, LR + 0.16, z0 + 1.3, z0 + 1.45), bevel=0.03)
    solid('lantern_cap', 'ink', lambda bm: bm_prism(bm, 8, LR + 0.22, 0.08, z0 + 1.45, z0 + 2.35), bevel=0.03)
    def ribs(bm):
        for k in range(8):
            a = math.pi / 8 + k * math.pi / 4
            bm_bar(bm, ((LR + 0.2) * math.cos(a), (LR + 0.2) * math.sin(a), z0 + 1.47),
                   (0.09 * math.cos(a), 0.09 * math.sin(a), z0 + 2.32), 0.11)
    solid('lantern_ribs', 'haze', ribs, bevel=0.0)

    def finial(bm):
        bm_prism(bm, 8, 0.05, 0.05, z0 + 2.3, z0 + 3.2, rot=0)
        S.bm_sphere(bm, 0.2, (0, 0, z0 + 3.25), 10, 6)
        S.bm_sphere(bm, 0.11, (0, 0, z0 + 2.75), 8, 5)
    solid('finial', 'bone', finial, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the cross wing (十字樓): two gabled arms crossing behind the octagon
# ─────────────────────────────────────────────────────────────────────────────
AW_W, AW_STRAIGHT, AW_Z = 1.1, 1.45, 1.0     # arm window surround (arched), sill at 1.0
AG_W, AG_STRAIGHT = 0.82, 1.35               # the glass inside it


def arm(name, center, along_x):
    """One arm: a brick box with arched windows on its long sides, a pale plinth and cornice, a
    gable roof with ridge and bargeboards, an oculus and an arched door in each gable end."""
    cx, cy = center
    L, W = ARM_L, ARM_W
    size = (L, W, ARM_H) if along_x else (W, L, ARM_H)
    # long-side windows: skip the stretch hidden inside the other arm or the octagon
    def window_positions():
        out = []
        n = int(L // 2.5)
        for i in range(n):
            u = -L / 2 + 1.25 + i * 2.5 + (L - n * 2.5) / 2
            if along_x and abs(u) < W / 2 + 0.9:           # inside the long arm's body
                continue
            if not along_x:
                yw = cy + u
                if abs(yw - CROSS_ARM_Y) < W / 2 + 0.9:      # inside the cross arm
                    continue
                if yw < APO + 0.9:                           # inside the octagon
                    continue
            out.append(u)
        return out
    us = window_positions()
    # the two long faces: theta 0 / pi are the ±Y faces (arm along X); pi/2, 3pi/2 the ±X faces
    thetas = (0, math.pi) if along_x else (math.pi / 2, 3 * math.pi / 2)
    # local x runs +X on the theta 0 face and +Y on the pi/2 face; the opposite faces mirror it
    faces = [(th, [u if th in (0, math.pi / 2) else -u for u in us]) for th in thetas]
    surround, recess = bmesh.new(), bmesh.new()
    for th, xs in faces:
        F = face_frame(th, W / 2, (cx, cy, 0))
        for x in xs:
            bm_solid(surround, arch_pts(AW_W, AW_STRAIGHT), -0.6, 0.1, F @ Matrix.Translation((x, 0, AW_Z)))
            bm_solid(recess, arch_pts(AG_W, AG_STRAIGHT), -0.6, 0.3, F @ Matrix.Translation((x, 0, AW_Z + 0.12)))
    # gable ends: an arched door, on the ends that are not buried
    end_thetas = (math.pi / 2, 3 * math.pi / 2) if along_x else (0, math.pi)
    ends = []
    for th in end_thetas:
        if not along_x and th == 0:
            continue                                        # the long arm's near end is inside the octagon
        ends.append(th)
        F = face_frame(th, L / 2, (cx, cy, 0))
        bm_solid(surround, arch_pts(1.9, 2.2), -0.6, 0.1, F @ Matrix.Translation((0, 0, 0.3)))
        bm_solid(recess, arch_pts(1.5, 2.05), -0.6, 0.45, F @ Matrix.Translation((0, 0, 0.3)))
    c1 = S.new_cutter(name + '_surround', surround, 'bone')
    c2 = S.new_cutter(name + '_recess', recess, 'ink')
    solid(name + '_walls', 'brick', lambda bm: bm_box(bm, size, (cx, cy, ARM_H / 2)), cutters=(c1, c2))
    # sills and mullions, pilasters between the windows (brick, so only the bevel draws them)
    def detail(bm):
        for th, xs in faces:
            F = face_frame(th, W / 2, (cx, cy, 0))
            for x in xs:
                bm_box(bm, (AW_W + 0.3, 0.22, 0.14), (x, 0.02, AW_Z - 0.07), F)
                bm_box(bm, (0.07, 0.08, AG_STRAIGHT + AG_W / 2), (x, 0.22, AW_Z + 0.12 + (AG_STRAIGHT + AG_W / 2) / 2), F)
                bm_box(bm, (AG_W, 0.08, 0.07), (x, 0.22, AW_Z + 0.12 + AG_STRAIGHT), F)
    solid(name + '_sills', 'bone', detail, bevel=0.02)
    def pilasters(bm):
        for th, xs in faces:
            F = face_frame(th, W / 2, (cx, cy, 0))
            for i in range(len(xs) - 1):
                if abs(xs[i + 1] - xs[i]) < 3:
                    bm_box(bm, (0.42, 0.2, ARM_H - 0.9), ((xs[i] + xs[i + 1]) / 2, 0.0, 0.5 + (ARM_H - 0.9) / 2), F)
    solid(name + '_pilasters', 'brick', pilasters, bevel=0.03)
    # plinth and cornice
    solid(name + '_plinth', 'walk', lambda bm: bm_box(bm, (size[0] + 0.24, size[1] + 0.24, 0.45), (cx, cy, 0.225)), bevel=0.03)
    solid(name + '_cornice', 'bone', lambda bm: bm_box(bm, (size[0] + 0.3, size[1] + 0.3, 0.32), (cx, cy, ARM_H - 0.36)), bevel=0.03)
    # the gable roof: a triangular prism with a 0.35 overhang all round
    RISE, OVER = 2.6, 0.35
    half = W / 2 + OVER
    prof = [(-half, ARM_H - 0.05), (half, ARM_H - 0.05), (0, ARM_H - 0.05 + RISE)]
    # bm_solid extrudes an X-Z profile along Y, which is the long arm's direction. For the cross
    # arm (along X) the same prism is turned 90° about Z so the extrusion runs along X.
    T = Matrix.Translation((cx, cy, 0)) @ (Matrix.Rotation(-math.pi / 2, 4, 'Z') if along_x else Matrix.Identity(4))
    solid(name + '_roof', 'ink', lambda bm: bm_solid(bm, prof, -L / 2 - OVER, L / 2 + OVER, T), bevel=0.06)
    # ridge, bargeboards, oculi
    ridge_z = ARM_H - 0.05 + RISE
    def trim(bm):
        axis = Vector((1, 0, 0)) if along_x else Vector((0, 1, 0))
        c = Vector((cx, cy, 0))
        bm_bar(bm, c + axis * (-L / 2 - OVER - 0.05) + Vector((0, 0, ridge_z + 0.02)), c + axis * (L / 2 + OVER + 0.05) + Vector((0, 0, ridge_z + 0.02)), 0.18)
        side = Vector((0, 1, 0)) if along_x else Vector((1, 0, 0))
        for e in (-1, 1):
            end = c + axis * e * (L / 2 + OVER + 0.02)
            for s in (-1, 1):
                bm_bar(bm, end + side * s * half + Vector((0, 0, ARM_H - 0.05)), end + Vector((0, 0, ridge_z + 0.05)), 0.16)
    solid(name + '_trim', 'haze', trim, bevel=0.03)
    def oculus(bm):
        for th in ends:
            F = face_frame(th, L / 2, (cx, cy, 0))
            bm_solid(bm, circle_pts(0.62, 14), -0.12, 0.1, F @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus_ring', 'bone', oculus, bevel=0.03)
    def oculus_glass(bm):
        for th in ends:
            F = face_frame(th, L / 2, (cx, cy, 0))
            bm_solid(bm, circle_pts(0.44, 14), -0.05, 0.12, F @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus', 'ink', oculus_glass, bevel=0.0)


def cross_wing():
    arm('long_arm', (0, LONG_ARM_Y), along_x=False)
    arm('cross_arm', (0, CROSS_ARM_Y), along_x=True)


def build():
    octagon_walls()
    octagon_trim()
    octagon_quoins()
    octagon_openings_detail()
    octagon_fanlights()
    entrance()
    roof()
    lantern()
    cross_wing()


if __name__ == '__main__':
    # preview camera: the page's Red House keyframe in this file's frame. Camera at world
    # (-3, 3.5, -34) with the building at (16.6, -70), looking at (9, 4, -72); world +x ← local +Y,
    # world +z ← local +X, vertical fov 50.
    S.run(build, camera=((36.0, -19.6, 3.5), (-2.0, -7.6, 4.0), 50))
