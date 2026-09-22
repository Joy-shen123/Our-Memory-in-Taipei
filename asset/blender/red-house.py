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
# Look (issue #5, CJ 2026-09-23 「dont like low poly」): everything is built from primitives with
# boolean cuts for the openings and a bevel modifier on every edge (0.05 m, 2 segments,
# hardened normals so flat faces stay flat and only the edges round). Colours are flat
# per-material values from the palette in data.js, written as raw hex/255 so the loaded
# three.js Color equals C(name) in app.js (the page renders in linear and applies gamma in
# its post pass). No textures, no UVs. One object, one material slot per palette colour.

import argparse
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

# ── palette: the hexes in data.js ────────────────────────────────────────────
PALETTE = {
    'ink':   '#2b2f3a',   # slate roof, window glass, dark openings
    'haze':  '#9fb6c9',   # roof ridges and hips
    'lamp':  '#ffb347',
    'bone':  '#f7f2e8',   # string courses, quoins, surrounds, the lantern
    'verm':  '#d9483b',
    'brick': '#b8664c',   # the walls
    'walk':  '#e2dccb',   # steps and plinth
}

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
BEVEL = 0.05
SEGMENTS = 2

# ─────────────────────────────────────────────────────────────────────────────
# materials
# ─────────────────────────────────────────────────────────────────────────────
_mats = {}


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (1, 3, 5))


def mat(name):
    """One flat material per palette colour. Raw hex/255, no sRGB→linear conversion."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    r, g, b = hex_rgb(PALETTE[name])
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    m.diffuse_color = (r, g, b, 1.0)
    _mats[name] = m
    return m


# ─────────────────────────────────────────────────────────────────────────────
# bmesh builders. Every solid is closed and manifold so the booleans stay clean.
# ─────────────────────────────────────────────────────────────────────────────
def bm_solid(bm, pts, y0, y1, xform=None):
    """Extrude a closed 2D polygon (points in the X-Z plane) along Y from y0 to y1."""
    a = [bm.verts.new((x, y0, z)) for x, z in pts]
    b = [bm.verts.new((x, y1, z)) for x, z in pts]
    n = len(pts)
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    for i in range(n):
        bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=a + b)
    return a + b


def bm_box(bm, size, center=(0, 0, 0), xform=None):
    """Axis-aligned box. size = (x, y, z), centred at center, then transformed."""
    sx, sy, sz = size
    cx, cy, cz = center
    pts = [(cx - sx / 2, cz - sz / 2), (cx + sx / 2, cz - sz / 2), (cx + sx / 2, cz + sz / 2), (cx - sx / 2, cz + sz / 2)]
    return bm_solid(bm, pts, cy - sy / 2, cy + sy / 2, xform)


def bm_prism(bm, n, r0, r1, z0, z1, rot=math.pi / 8, xform=None):
    """A regular n-gon prism / frustum standing on Z: radius r0 at z0, r1 at z1."""
    ring0 = [bm.verts.new((r0 * math.cos(rot + i * 2 * math.pi / n), r0 * math.sin(rot + i * 2 * math.pi / n), z0)) for i in range(n)]
    ring1 = [bm.verts.new((r1 * math.cos(rot + i * 2 * math.pi / n), r1 * math.sin(rot + i * 2 * math.pi / n), z1)) for i in range(n)]
    bm.faces.new(ring0[::-1])
    bm.faces.new(ring1)
    for i in range(n):
        bm.faces.new((ring0[i], ring0[(i + 1) % n], ring1[(i + 1) % n], ring1[i]))
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=ring0 + ring1)
    return ring0 + ring1


def bm_bar(bm, p0, p1, t, xform=None):
    """A square-section bar of thickness t from p0 to p1 (a ridge, a hip, a rod)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    q = d.normalized().to_track_quat('Z', 'Y')
    m = Matrix.Translation(p0) @ q.to_matrix().to_4x4()
    return bm_box(bm, (t, t, L), (0, 0, L / 2), (xform @ m) if xform is not None else m)


def arch_pts(w, straight, n=8):
    """Closed arch profile in X-Z: a rectangle w wide, straight tall, with a semicircle on top."""
    r = w / 2
    pts = [(-r, 0), (r, 0)]
    for i in range(n + 1):
        a = i * math.pi / n
        pts.append((r * math.cos(a), straight + r * math.sin(a)))
    return pts


def rect_pts(w, h, z0=0):
    return [(-w / 2, z0), (w / 2, z0), (w / 2, z0 + h), (-w / 2, z0 + h)]


def circle_pts(r, n=16):
    return [(r * math.cos(i * 2 * math.pi / n), r * math.sin(i * 2 * math.pi / n)) for i in range(n)]


def face_frame(theta, apothem, center=(0, 0, 0)):
    """Local frame of a wall face: x along the face, y into the wall, z up; the wall surface at
    y = 0 with its outward normal at -Y before the rotation theta about Z. theta 0 = the front."""
    n = Matrix.Rotation(theta, 4, 'Z') @ Vector((0, -1, 0, 0))
    return Matrix.Translation(Vector(center) + Vector(n[:3]) * apothem) @ Matrix.Rotation(theta, 4, 'Z')


# ─────────────────────────────────────────────────────────────────────────────
# objects
# ─────────────────────────────────────────────────────────────────────────────
OBJECTS = []      # everything that ends up in the glb
CUTTERS = []      # cutter objects, deleted after the booleans are applied


def new_object(name, bm, material, bevel=BEVEL, cutters=()):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(material))
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for cutter in cutters:
        b = ob.modifiers.new('cut_' + cutter.name, 'BOOLEAN')
        b.operation = 'DIFFERENCE'
        b.solver = 'EXACT'
        b.material_mode = 'TRANSFER'     # the cut faces take the cutter's colour
        b.object = cutter
    # bevel: two segments on the building's edges, one on small trim (a 3 cm chamfer reads as
    # rounded from the street), none on thin bars, which would only cost triangles
    if bevel >= 0.025:
        bv = ob.modifiers.new('bevel', 'BEVEL')
        bv.width = bevel
        bv.segments = SEGMENTS if bevel >= 0.04 else 1
        bv.limit_method = 'ANGLE'
        bv.angle_limit = math.radians(30)
        bv.use_clamp_overlap = True
        bv.harden_normals = True
    OBJECTS.append(ob)
    return ob


def new_cutter(name, bm, material):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(material))
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.hide_render = True
    CUTTERS.append(ob)
    return ob


def solid(name, material, builder, bevel=BEVEL, cutters=()):
    bm = bmesh.new()
    builder(bm)
    return new_object(name, bm, material, bevel, cutters)


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
    c1 = new_cutter('oct_surround', surround, 'bone')
    c2 = new_cutter('oct_recess', recess, 'ink')
    solid('oct_walls', 'brick', lambda bm: bm_prism(bm, 8, R, R, 0.0, EAVE), cutters=(c1, c2))


def octagon_trim():
    """Plinth, string course, cornice: pale octagonal bands standing proud of the brick."""
    solid('oct_plinth', 'walk', lambda bm: bm_prism(bm, 8, R + 0.14, R + 0.14, 0.0, 0.5))
    solid('oct_course', 'bone', lambda bm: bm_prism(bm, 8, R + 0.12, R + 0.12, FLOOR, FLOOR + 0.32))
    solid('oct_cornice_a', 'bone', lambda bm: bm_prism(bm, 8, R + 0.22, R + 0.22, EAVE - 0.55, EAVE - 0.25))
    solid('oct_cornice_b', 'bone', lambda bm: bm_prism(bm, 8, R + 0.36, R + 0.36, EAVE - 0.25, EAVE))


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
    """What sits inside and around the cut openings: keystones, transoms, sills, lintels, mullions."""
    def bone(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, APO)
            top = ARCH_Z + ARCH_STRAIGHT + ARCH_W / 2
            bm_box(bm, (0.36, 0.2, 0.5), (0, 0.02, top - 0.1), F)                     # keystone
            bm_box(bm, (OPEN_W, 0.12, 0.08), (0, 0.32, ARCH_Z + OPEN_STRAIGHT), F)       # transom under the fanlight
            for dx in (-WIN_DX, WIN_DX):
                bm_box(bm, (WIN_W + 0.3, 0.22, 0.16), (dx, 0.02, WIN_Z - 0.08), F)     # sill
                bm_box(bm, (WIN_W + 0.3, 0.16, 0.22), (dx, 0.02, WIN_Z + WIN_H + 0.11), F)  # lintel
                bm_box(bm, (0.07, 0.08, GLASS_H), (dx, 0.24, WIN_Z + 0.15 + GLASS_H / 2), F)   # mullion
                bm_box(bm, (GLASS_W, 0.08, 0.07), (dx, 0.24, WIN_Z + 0.15 + GLASS_H * 0.62), F)  # transom bar
    solid('oct_openings', 'bone', bone, bevel=0.02)


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
    cut = new_cutter('lantern_louvres', louvres, 'ink')
    solid('lantern', 'bone', lambda bm: bm_prism(bm, 8, LR, LR, z0, z0 + 1.3), bevel=0.03, cutters=(cut,))
    def louvre_bars(bm):
        for k in range(8):
            F = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
            for z in (0.45, 0.62, 0.79, 0.96):
                bm_box(bm, (0.34, 0.08, 0.05), (0, 0.05, z), F)
    solid('lantern_bars', 'bone', louvre_bars, bevel=0.0)
    solid('lantern_cornice', 'bone', lambda bm: bm_prism(bm, 8, LR + 0.16, LR + 0.16, z0 + 1.3, z0 + 1.45), bevel=0.03)
    solid('lantern_cap', 'ink', lambda bm: bm_prism(bm, 8, LR + 0.22, 0.08, z0 + 1.45, z0 + 2.35), bevel=0.03)
    def finial(bm):
        bm_prism(bm, 8, 0.05, 0.05, z0 + 2.3, z0 + 3.2, rot=0)
        bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=0.2, matrix=Matrix.Translation((0, 0, z0 + 3.25)))
        bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.11, matrix=Matrix.Translation((0, 0, z0 + 2.75)))
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
    c1 = new_cutter(name + '_surround', surround, 'bone')
    c2 = new_cutter(name + '_recess', recess, 'ink')
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
            bm_solid(bm, circle_pts(0.62, 20), -0.12, 0.1, F @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus_ring', 'bone', oculus, bevel=0.03)
    def oculus_glass(bm):
        for th in ends:
            F = face_frame(th, L / 2, (cx, cy, 0))
            bm_solid(bm, circle_pts(0.44, 20), -0.05, 0.12, F @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus', 'ink', oculus_glass, bevel=0.0)


def cross_wing():
    arm('long_arm', (0, LONG_ARM_Y), along_x=False)
    arm('cross_arm', (0, CROSS_ARM_Y), along_x=True)


# ─────────────────────────────────────────────────────────────────────────────
# apply, join, export
# ─────────────────────────────────────────────────────────────────────────────
def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ob_eval = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ob_eval, preserve_all_data_layers=True, depsgraph=dg)
    me.name = ob.name + '_applied'
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def join_all(objs, name='RedHouse'):
    main = objs[0]
    with bpy.context.temp_override(active_object=main, selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    main.name = name
    main.data.name = name
    return main


def tri_count(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


def preview(path, ob):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = False
    scene.view_settings.view_transform = 'Standard'
    scene.render.resolution_x, scene.render.resolution_y = 1440, 900
    scene.render.film_transparent = False
    world = bpy.data.worlds.new('w')
    world.color = (0.55, 0.75, 0.95)
    scene.world = world
    cam_data = bpy.data.cameras.new('cam')
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.angle = math.radians(50)
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    # the page's Red House keyframe, in this file's frame: camera at world (-3, 3.5, -34) with the
    # building at (16.6, -70), looking at (9, 4, -72). world +x ← local +Y, world +z ← local +X.
    cam.location = Vector((36.0, -19.6, 3.5))
    target = Vector((-2.0, -7.6, 4.0))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--preview', default=None)
    ap.add_argument('--stats', action='store_true', help='print the triangle count per part')
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    octagon_walls()
    octagon_trim()
    octagon_quoins()
    octagon_openings_detail()
    entrance()
    roof()
    lantern()
    cross_wing()

    for ob in OBJECTS:
        apply_modifiers(ob)
    if args.stats:
        for ob in sorted(OBJECTS, key=lambda o: -tri_count(o.data)):
            print(f'[red-house]   {ob.name:<24} {tri_count(ob.data):>6} tris')
    for c in CUTTERS:
        bpy.data.objects.remove(c, do_unlink=True)
    house = join_all(OBJECTS)

    n_tri = tri_count(house.data)
    bb = [house.matrix_world @ Vector(c) for c in house.bound_box]
    lo = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    hi = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    print(f'[red-house] triangles {n_tri}, verts {len(house.data.vertices)}, materials {[m.name for m in house.data.materials]}')
    print(f'[red-house] bounds x {lo.x:.2f}..{hi.x:.2f}  y {lo.y:.2f}..{hi.y:.2f}  z {lo.z:.2f}..{hi.z:.2f}')

    bpy.ops.export_scene.gltf(
        filepath=args.out, export_format='GLB', export_apply=True, export_yup=True,
        export_normals=True, export_texcoords=False, export_materials='EXPORT',
        export_animations=False, export_skins=False, export_morph=False, export_cameras=False,
        export_extras=False)
    print(f'[red-house] wrote {args.out}')

    if args.preview:
        preview(args.preview, house)
        print(f'[red-house] preview {args.preview}')


if __name__ == '__main__':
    main()
