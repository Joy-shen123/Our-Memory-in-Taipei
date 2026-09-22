# stylized.py — shared helpers for the Blender model scripts in this folder (issue #5).
#
# Every building or street element is its own script (red-house.py, temple.py, …) that imports
# this module, builds solids from primitives with boolean-cut openings and a bevel on every edge,
# assigns flat palette materials, and exports one glb. Use:
#
#   import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
#   import stylized as S
#   def build():
#       S.solid('walls', 'brick', lambda bm: S.bm_box(bm, (4, 4, 6), (0, 0, 3)))
#   S.run(build, camera=((10, -12, 6), (0, 0, 3), 45))
#
# then:  Blender --background --python asset/blender/<name>.py -- --out asset/models/<name>.glb [--preview x.png] [--stats]
#
# Frame: metres, Blender Z up, origin on the ground at the model's centre. The front faces -Y in
# Blender, which the exporter turns into +Z (three.js), the library convention "front faces +Z
# before rotation". Colours: flat per-material values from the data.js palette, written as raw
# hex/255 so the loaded three.js Color equals C(name) (the page renders linear and applies gamma
# in its post pass). No textures, no UVs. Everything is joined into one object per group so
# three.js gets one mesh with one primitive per palette colour.
#
# Look (CJ 2026-09-23 「dont like low poly」): bevel 0.05 m with 2 segments on building edges,
# 1 segment on small trim (>= 0.025), none on thin bars. Hardened normals keep flat faces flat.

import argparse
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

# ── palette: the hexes in data.js ────────────────────────────────────────────
PALETTE = {
    'ink':   '#2b2f3a',   # dark: roofs, glass, openings, trunks
    'haze':  '#9fb6c9',   # distance and shade, ridges, concrete
    'lamp':  '#ffb347',   # warm light, goods
    'bone':  '#f7f2e8',   # pale facades and trim
    'verm':  '#d9483b',   # red accent
    'sky':   '#8ecbff',
    'brick': '#b8664c',   # brick walls
    'glass': '#5fb0bf',   # Taipei 101 curtain wall
    'leaf':  '#6fae6a',   # trees
    'road':  '#6d6f75',
    'walk':  '#e2dccb',   # pavement, plinths, concrete
}

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
# 2D profiles (points in the X-Z plane) and curve sampling
# ─────────────────────────────────────────────────────────────────────────────
def arch_pts(w, straight, n=8):
    """Closed arch: a rectangle w wide and `straight` tall with a semicircle on top."""
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


def quad(p0, p1, p2, n=6, include_start=False):
    """Points along a quadratic Bézier."""
    out = []
    for i in range(0 if include_start else 1, n + 1):
        t = i / n
        out.append(tuple((1 - t) ** 2 * p0[k] + 2 * (1 - t) * t * p1[k] + t * t * p2[k] for k in range(2)))
    return out


def cubic(p0, p1, p2, p3, n=6, include_start=False):
    """Points along a cubic Bézier."""
    out = []
    for i in range(0 if include_start else 1, n + 1):
        t = i / n
        out.append(tuple((1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * p1[k] + 3 * (1 - t) * t * t * p2[k] + t ** 3 * p3[k] for k in range(2)))
    return out


# ─────────────────────────────────────────────────────────────────────────────
# bmesh builders. Every solid is closed and manifold so the booleans stay clean.
# Each takes a bmesh, adds geometry, applies an optional 4x4 xform to the new verts.
# ─────────────────────────────────────────────────────────────────────────────
def bm_solid(bm, pts, y0, y1, xform=None):
    """Extrude a closed 2D polygon (X-Z points, counter-clockwise or clockwise) along Y from y0 to y1."""
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


def bm_solid_z(bm, pts, z0, z1, xform=None):
    """Extrude a closed 2D polygon (X-Y points) along Z from z0 to z1 (a slab, a plan shape)."""
    a = [bm.verts.new((x, y, z0)) for x, y in pts]
    b = [bm.verts.new((x, y, z1)) for x, y in pts]
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


def bm_prism(bm, n, r0, r1, z0, z1, rot=math.pi / 8, xform=None, center=(0, 0)):
    """A regular n-gon prism / frustum standing on Z: radius r0 at z0, r1 at z1. rot = the angle of
    the first vertex: pi/8 gives an octagon with flats on the axes, pi/4 a square on the axes."""
    cx, cy = center
    ring0 = [bm.verts.new((cx + r0 * math.cos(rot + i * 2 * math.pi / n), cy + r0 * math.sin(rot + i * 2 * math.pi / n), z0)) for i in range(n)]
    ring1 = [bm.verts.new((cx + r1 * math.cos(rot + i * 2 * math.pi / n), cy + r1 * math.sin(rot + i * 2 * math.pi / n), z1)) for i in range(n)]
    bm.faces.new(ring0[::-1])
    bm.faces.new(ring1)
    for i in range(n):
        bm.faces.new((ring0[i], ring0[(i + 1) % n], ring1[(i + 1) % n], ring1[i]))
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=ring0 + ring1)
    return ring0 + ring1


def bm_cylinder(bm, r, z0, z1, n=12, center=(0, 0), xform=None):
    return bm_prism(bm, n, r, r, z0, z1, rot=0, xform=xform, center=center)


def bm_lathe(bm, profile, n=12, xform=None):
    """Revolve a (r, z) polyline about Z. Endpoints with r == 0 close with a centre vertex; other
    endpoints close with a flat cap. For pots, bowls, lantern bodies, finials."""
    rings = []
    verts = []
    for r, z in profile:
        if r <= 1e-6:
            v = bm.verts.new((0, 0, z))
            rings.append([v])
            verts.append(v)
        else:
            ring = [bm.verts.new((r * math.cos(i * 2 * math.pi / n), r * math.sin(i * 2 * math.pi / n), z)) for i in range(n)]
            rings.append(ring)
            verts += ring
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        if len(a) == 1:
            for i in range(n):
                bm.faces.new((a[0], b[i], b[(i + 1) % n]))
        elif len(b) == 1:
            for i in range(n):
                bm.faces.new((a[i], a[(i + 1) % n], b[0]))
        else:
            for i in range(n):
                bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if len(rings[0]) > 1:
        bm.faces.new(rings[0][::-1])
    if len(rings[-1]) > 1:
        bm.faces.new(rings[-1])
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=verts)
    return verts


def bm_sphere(bm, r, center=(0, 0, 0), u=12, v=8, scale_z=1.0):
    m = Matrix.Translation(center) @ Matrix.Diagonal((1, 1, scale_z, 1))
    res = bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r, matrix=m)
    return res['verts']


def bm_bar(bm, p0, p1, t, xform=None, t2=None):
    """A rectangular-section bar of thickness t (by t2) from p0 to p1: ridges, hips, rods, rails."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    q = d.normalized().to_track_quat('Z', 'Y')
    m = Matrix.Translation(p0) @ q.to_matrix().to_4x4()
    return bm_box(bm, (t, t2 or t, L), (0, 0, L / 2), (xform @ m) if xform is not None else m)


def face_frame(theta, apothem, center=(0, 0, 0)):
    """Local frame of a wall face: x along the face, y into the wall, z up; the wall surface at
    y = 0 with its outward normal at -Y before the rotation theta about Z. theta 0 = the front
    (-Y), pi/2 = the +X face, pi = the back (+Y), 3pi/2 = the -X face."""
    n = Matrix.Rotation(theta, 4, 'Z') @ Vector((0, -1, 0, 0))
    return Matrix.Translation(Vector(center) + Vector(n[:3]) * apothem) @ Matrix.Rotation(theta, 4, 'Z')


def face_x_sign(theta):
    """+1 when the face frame's local x runs along +X (theta 0) or +Y (theta pi/2), else -1.
    Use it to place a thing at a world offset u along a face: local x = face_x_sign(theta) * u."""
    return 1 if abs(theta) < 1e-6 or abs(theta - math.pi / 2) < 1e-6 else -1


# ─────────────────────────────────────────────────────────────────────────────
# objects
# ─────────────────────────────────────────────────────────────────────────────
OBJECTS = []      # [(object, group)] — everything that ends up in the glb
CUTTERS = []      # cutter objects, deleted after the booleans are applied


def new_object(name, bm, material, bevel=BEVEL, cutters=(), group='main', smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(material))
    if smooth:
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
    OBJECTS.append((ob, group))
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


def solid(name, material, builder, bevel=BEVEL, cutters=(), group='main', smooth=True):
    """Build one solid: builder(bm) adds geometry; the result gets the material, the booleans
    (cutters, in order) and the bevel. group names the glb node it is joined into."""
    bm = bmesh.new()
    builder(bm)
    return new_object(name, bm, material, bevel, cutters, group, smooth)


def cutter(name, material, builder):
    """A boolean cutter: its faces give their colour to the cut. Deleted after use."""
    bm = bmesh.new()
    builder(bm)
    return new_cutter(name, bm, material)


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


def join(objs, name):
    main = objs[0]
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=main, selected_editable_objects=objs, selected_objects=objs):
            bpy.ops.object.join()
    main.name = name
    main.data.name = name
    return main


def tri_count(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


def bounds(obs):
    pts = [ob.matrix_world @ Vector(c) for ob in obs for c in ob.bound_box]
    lo = Vector((min(v.x for v in pts), min(v.y for v in pts), min(v.z for v in pts)))
    hi = Vector((max(v.x for v in pts), max(v.y for v in pts), max(v.z for v in pts)))
    return lo, hi


def preview(path, obs, camera=None):
    """Workbench render: flat material colours, studio light, shadows. camera = (location,
    target, vertical fov degrees) in this file's frame, or None for an automatic 3/4 view."""
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
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    if camera is None:
        lo, hi = bounds(obs)
        c = (lo + hi) / 2
        size = max(hi - lo)
        loc = c + Vector((1.1, -1.5, 0.7)) * size
        target = Vector((c.x, c.y, (lo.z + hi.z) * 0.45))
        fov = 40
    else:
        loc, target, fov = Vector(camera[0]), Vector(camera[1]), camera[2]
    cam_data.angle = math.radians(fov)
    cam.location = loc
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def run(build, camera=None, argv=None):
    """Parse --out/--preview/--stats, build, apply, join per group, export the glb, report."""
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--preview', default=None)
    ap.add_argument('--stats', action='store_true', help='print the triangle count per part')
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    OBJECTS.clear()
    CUTTERS.clear()
    _mats.clear()

    build()

    for ob, _ in OBJECTS:
        apply_modifiers(ob)
    for c in CUTTERS:
        bpy.data.objects.remove(c, do_unlink=True)
    if args.stats:
        for ob, g in sorted(OBJECTS, key=lambda o: -tri_count(o[0].data)):
            print(f'[model]   {g + "/" + ob.name:<32} {tri_count(ob.data):>6} tris')
    groups = []
    for ob, g in OBJECTS:
        if g not in groups:
            groups.append(g)
    joined = [join([ob for ob, g in OBJECTS if g == grp], grp) for grp in groups]

    total = sum(tri_count(o.data) for o in joined)
    lo, hi = bounds(joined)
    for o in joined:
        print(f'[model] {o.name}: {tri_count(o.data)} triangles, {len(o.data.vertices)} verts, materials {[m.name for m in o.data.materials]}')
    print(f'[model] total triangles {total}')
    print(f'[model] bounds x {lo.x:.2f}..{hi.x:.2f}  y {lo.y:.2f}..{hi.y:.2f}  z {lo.z:.2f}..{hi.z:.2f}')

    bpy.ops.export_scene.gltf(
        filepath=args.out, export_format='GLB', export_apply=True, export_yup=True,
        export_normals=True, export_texcoords=False, export_materials='EXPORT',
        export_animations=False, export_skins=False, export_morph=False, export_cameras=False,
        export_extras=False)
    print(f'[model] wrote {args.out}')

    if args.preview:
        preview(args.preview, joined, camera)
        print(f'[model] preview {args.preview}')
    return joined
