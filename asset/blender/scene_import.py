# scene_import.py — open a stretch of the live page in Blender (issue: blender-scene-export).
#
# CJ, 2026-09-24: 「你能夠分割一部分場景到blender嗎我想要渲染」. The buildings are glb files, but where
# each one stands is decided in JavaScript, so Blender can open one building and cannot open the
# street. tools/scene-dump.js reads the street back out of the running page; this reads that JSON
# and rebuilds it:
#
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/scene_import.py -- \
#       --json render/scene-0.44.json --out render/scene-0.44.blend --render render/scene-0.44.png
#
# What it does, in order:
#   1. links each asset/models/*.glb once and puts one linked copy at every recorded transform, so
#      editing the source mesh edits every copy of it;
#   2. rebuilds the JS-only geometry — the road and its eight strips, the sidewalks, the crowd, the
#      hanging signs, the boards, the library shopfronts — as real meshes from the dumped vertices;
#   3. writes the baked canvas textures (every sign, poster, price board and neon, plus the five
#      procedural surface families and their normal maps) next to the .blend and wires them up;
#   4. applies the palette through stylized.mat(), so a colour here is the same number as in
#      data.js and in every model script (CJ, 2026-09-22: 「the color pallete is close」);
#   5. builds a camera matching the page's camera at that scroll fraction, a sun matching the
#      page's shadow sun, and a world gradient matching the sky dome and the tinted hemisphere
#      light that gives the page its violet shade.
#
# Frames: the page is three.js, Y up, -Z down the street. Blender is Z up. Everything is converted
# by R = (x, y, z) -> (x, -z, y); the glb importer has already put the model meshes in Blender space,
# so a dumped world matrix M becomes R @ M @ R-inverse.
#
# Colour: flat palette values, raw hex/255, exactly as stylized.mat() writes them, and the view
# transform is Standard rather than AgX — AgX desaturates the highlights, which is the greyer look
# CJ ruled out on 2026-09-20 ("BRIGHT AND PRETTY"). Sun and world strengths are the two knobs.
#
# Shader (--shader): `toon` is the default and is what CJ asked for on 2026-09-24 —  the Komikaze
# cel-shade node group, appended out of his shader library, three tones per palette colour with
# the shadow tone carrying the page's own violet shade (app.js SHADOW_TINT). Komikaze is built on
# Shader-to-RGB, which only exists in EEVEE, so toon renders in EEVEE and not in Cycles. `pbr` is
# plain Cycles with Principled BSDF, and `flat` is Workbench flat colour — the control that shows
# what the shader is contributing.

import argparse
import base64
import json
import math
import os
import pathlib
import sys

import bpy
from mathutils import Euler, Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S  # noqa: E402  — the palette, hex_rgb() and mat() are shared with every model script

# three.js Y-up -> Blender Z-up
R = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
RI = R.inverted()

PAL_BY_HEX = {v.lower(): k for k, v in S.PALETTE.items()}

# CJ's shader library, 2026-09-24: 「我有shader 跟texture可以用了」. Built for Blender 4.2; only the
# node groups are appended, so the version gap stays where it can be checked.
KK_DEFAULT = '/Volumes/T7 Shield/Toon Shader Komikaze/Komikaze 3.2/Komikaze 3.2 (Blender 4.2).blend'


def mat4(m16):
    """A dumped three.js world matrix: 16 floats, column-major, as three.js stores them."""
    return Matrix([[m16[c * 4 + r] for c in range(4)] for r in range(4)])


def conv(m16):
    """World matrix for a mesh whose vertices have already been rotated into Blender space — the
    glb importer does that, and build_mesh() below does it for the JS parts. Both the world and the
    local frame turn, so the conversion is a conjugation."""
    return R @ mat4(m16) @ RI


def conv_rig(m16):
    """World matrix for a camera or a light, whose local frame is fixed by Blender's own convention
    (down local -Z, up local +Y — the same convention three.js uses). Only the world turns, so this
    is R @ M and not a conjugation; conjugating here tips the camera face down."""
    return R @ mat4(m16)


# ─────────────────────────────────────────────────────────────────────────────
# materials
# ─────────────────────────────────────────────────────────────────────────────
def srgb_rgb(h):
    """'#rrggbb' -> (r, g, b), raw hex/255 with no sRGB conversion — what stylized.mat() writes and
    what the glb importer reads out of baseColorFactor, so every colour in the file agrees."""
    return S.hex_rgb(h if h.startswith('#') else '#' + h)


SHADOW_TINT = (0x7b / 255.0, 0x5c / 255.0, 0xff / 255.0)   # app.js SHADOW_TINT
SHADOW_MIX = 0.30                                           # app.js SHADOW_MIX
SHADOW_VALUE = 0.72                                         # how far the cel shadow tone drops


def _lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def shade_tone(c):
    """The page's shadow colour rule (app.js `tinted`): darken, lerp 30% toward violet, then put the
    luminance back where it was, so shade reads as colour and nothing gets darker than it should."""
    d = tuple(v * SHADOW_VALUE for v in c)
    y = _lum(d) or 1e-6
    t = tuple(d[i] + (SHADOW_TINT[i] - d[i]) * SHADOW_MIX for i in range(3))
    k = y / (_lum(t) or 1e-6)
    return tuple(min(1.0, v * k) for v in t)


HI_LIFT = 0.20     # how far the highlight tone lifts toward white. v + (1-v)*k lifts a dark colour
                   # much more than a pale one, which is what the page's light does: the asphalt
                   # comes up, the bone facades were already white.


def light_tone(c, k=HI_LIFT):
    return tuple(min(1.0, v + (1.0 - v) * k) for v in c)


class Materials:
    def __init__(self, data, tex_dir, shader='toon', kk_group=None):
        self.data = data
        self.tex_dir = tex_dir
        self.shader = shader
        self.kk = kk_group
        self.images = {}
        self.cache = {}

    def image(self, tex_id):
        if tex_id is None:
            return None
        if tex_id in self.images:
            return self.images[tex_id]
        rec = next((t for t in self.data.get('textures', []) if t['id'] == tex_id), None)
        if rec is None:
            self.images[tex_id] = None
            return None
        self.tex_dir.mkdir(parents=True, exist_ok=True)
        path = self.tex_dir / ('tex-%03d.png' % tex_id)
        path.write_bytes(base64.b64decode(rec['png']))
        img = bpy.data.images.load(str(path), check_existing=True)
        # Non-Color, not sRGB. The page is three.js r149 in legacy colour management: a canvas
        # texture's bytes are used as they are, with no sRGB decode, and the palette is likewise
        # written raw hex/255. Letting Blender decode these as sRGB darkens every mid tone by more
        # than half — it is what made the road read near-black in the first pass.
        img.colorspace_settings.name = 'Non-Color'
        self.images[tex_id] = img
        return img

    def get(self, mat_id):
        if mat_id in self.cache:
            return self.cache[mat_id]
        spec = next(m for m in self.data['materials'] if m['id'] == mat_id)
        m = self.build(spec)
        self.cache[mat_id] = m
        return m

    def build(self, spec):
        name = PAL_BY_HEX.get(spec['color'].lstrip('#').lower(), spec['color'])
        m = bpy.data.materials.new('%s_%03d' % (name, spec['id']))
        m.use_nodes = True
        nt = m.node_tree
        nodes, links = nt.nodes, nt.links
        out = nodes['Material Output']
        base = srgb_rgb(spec['color'])
        m.diffuse_color = (*base, spec.get('opacity', 1.0))

        def node(kind, x, y):
            n = nodes.new(kind)
            n.location = (x, y)
            return n

        # colour chain: the flat palette value, times the texture map, times the vertex colours —
        # the same three multiplications MeshStandardMaterial does in the page.
        col = node('ShaderNodeRGB', -900, 300)
        col.outputs[0].default_value = (*base, 1.0)
        colour, alpha = col.outputs[0], None

        img = self.image(spec.get('map'))
        if img is not None:
            tex = node('ShaderNodeTexImage', -700, 500)
            tex.image = img
            tex.extension = 'REPEAT'
            uvm = node('ShaderNodeMapping', -900, 500)
            uvc = node('ShaderNodeUVMap', -1100, 500)
            rep = spec.get('repeat', [1, 1]) or [1, 1]
            off = spec.get('offset', [0, 0]) or [0, 0]
            uvm.inputs['Scale'].default_value = (rep[0], rep[1], 1.0)
            uvm.inputs['Location'].default_value = (off[0], off[1], 0.0)
            links.new(uvc.outputs['UV'], uvm.inputs['Vector'])
            links.new(uvm.outputs['Vector'], tex.inputs['Vector'])
            mul = node('ShaderNodeMix', -450, 400)
            mul.data_type = 'RGBA'
            mul.blend_type = 'MULTIPLY'
            mul.inputs['Factor'].default_value = 1.0
            links.new(colour, mul.inputs[6])
            links.new(tex.outputs['Color'], mul.inputs[7])
            colour = mul.outputs[2]
            alpha = tex.outputs['Alpha']

        if spec.get('vertexColors'):
            vc = node('ShaderNodeVertexColor', -700, 100)
            vc.layer_name = 'Col'
            mul = node('ShaderNodeMix', -450, 100)
            mul.data_type = 'RGBA'
            mul.blend_type = 'MULTIPLY'
            mul.inputs['Factor'].default_value = 1.0
            links.new(colour, mul.inputs[6])
            links.new(vc.outputs['Color'], mul.inputs[7])
            colour = mul.outputs[2]

        if self.shader == 'toon' and self.kk is not None and not spec.get('unlit'):
            return self.finish_toon(m, nt, nodes, links, out, colour, alpha, spec, base)

        if spec.get('unlit'):
            # MeshBasicMaterial in the page: the year markings on the road, the mountains. Flat, no
            # light, no shadow — an emission shader is the honest equivalent.
            em = node('ShaderNodeEmission', -200, 300)
            links.new(colour, em.inputs['Color'])
            em.inputs['Strength'].default_value = 1.0
            shader = em.outputs['Emission']
            if spec.get('transparent') and alpha is not None:
                mixt = node('ShaderNodeMixShader', 0, 300)
                trans = node('ShaderNodeBsdfTransparent', -200, 100)
                links.new(alpha, mixt.inputs['Fac'])
                links.new(trans.outputs[0], mixt.inputs[1])
                links.new(shader, mixt.inputs[2])
                shader = mixt.outputs[0]
                m.blend_method = 'BLEND'
            links.new(shader, out.inputs['Surface'])
            nodes.remove(nodes['Principled BSDF'])
            return m

        bsdf = nodes['Principled BSDF']
        links.new(colour, bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = spec.get('roughness', 0.92)
        bsdf.inputs['Metallic'].default_value = spec.get('metalness', 0.0)

        nimg = self.image(spec.get('normalMap'))
        if nimg is not None:
            ntex = node('ShaderNodeTexImage', -700, -250)
            ntex.image = nimg
            ntex.extension = 'REPEAT'
            nm = node('ShaderNodeNormalMap', -450, -250)
            links.new(ntex.outputs['Color'], nm.inputs['Color'])
            links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
            uvm2 = node('ShaderNodeMapping', -900, -250)
            uvc2 = node('ShaderNodeUVMap', -1100, -250)
            rep = spec.get('repeat', [1, 1]) or [1, 1]
            uvm2.inputs['Scale'].default_value = (rep[0], rep[1], 1.0)
            links.new(uvc2.outputs['UV'], uvm2.inputs['Vector'])
            links.new(uvm2.outputs['Vector'], ntex.inputs['Vector'])

        ei = spec.get('emissiveIntensity') or 0.0
        if spec.get('emissive') and ei > 0:
            eimg = self.image(spec.get('emissiveMap'))
            if eimg is not None:
                etex = node('ShaderNodeTexImage', -700, -600)
                etex.image = eimg
                links.new(etex.outputs['Color'], bsdf.inputs['Emission Color'])
            else:
                bsdf.inputs['Emission Color'].default_value = (*srgb_rgb(spec['emissive']), 1.0)
            bsdf.inputs['Emission Strength'].default_value = ei

        if spec.get('transparent'):
            if alpha is not None:
                links.new(alpha, bsdf.inputs['Alpha'])
            else:
                bsdf.inputs['Alpha'].default_value = spec.get('opacity', 1.0)
            m.blend_method = 'BLEND'
        return m


    def finish_toon(self, m, nt, nodes, links, out, colour, alpha, spec, base):
        """Komikaze's three-tone cel shade, fed the page's own palette. The middle tone IS the
        palette colour (CJ, 2026-09-22: 「the color pallete is close」— so it is not re-graded here),
        the highlight is that colour lifted a tenth toward white, and the shadow is the page's own
        violet shade rule. Where a material carries a baked canvas (a sign, a poster, a price board)
        the three tones are derived from the texture at render time rather than from a flat colour,
        so the sign keeps its text in every tone."""
        nodes.remove(nodes['Principled BSDF'])
        g = nodes.new('ShaderNodeGroup')
        g.node_tree = self.kk
        g.location = (60, 300)

        def mix(a, b, fac, blend='MIX', x=-200, y=0):
            n = nodes.new('ShaderNodeMix')
            n.data_type = 'RGBA'
            n.blend_type = blend
            n.location = (x, y)
            n.inputs['Factor'].default_value = fac
            if hasattr(a, 'default_value') or hasattr(a, 'links'):
                links.new(a, n.inputs[6])
            else:
                n.inputs[6].default_value = (*a, 1.0)
            if hasattr(b, 'is_linked') or hasattr(b, 'links'):
                links.new(b, n.inputs[7])
            else:
                n.inputs[7].default_value = (*b, 1.0)
            return n.outputs[2]

        textured = spec.get('map') is not None
        if textured:
            hi = mix(colour, (1, 1, 1), HI_LIFT, 'MIX', -200, 420)
            sh = mix(colour, SHADOW_TINT, SHADOW_MIX, 'MIX', -200, -80)
            sh = mix(sh, (SHADOW_VALUE,) * 3, 1.0, 'MULTIPLY', -60, -80)
            links.new(hi, g.inputs['Highlight'])
            links.new(colour, g.inputs['Midtone'])
            links.new(sh, g.inputs['Shadow'])
        else:
            g.inputs['Highlight'].default_value = (*light_tone(base), 1.0)
            g.inputs['Midtone'].default_value = (*base, 1.0)
            g.inputs['Shadow'].default_value = (*shade_tone(base), 1.0)
            if spec.get('vertexColors'):
                # the crowd's wardrobe colours and the baked per-vertex occlusion live in the
                # colour attribute, so the tones have to follow it rather than the flat value
                links.new(colour, g.inputs['Midtone'])
                links.new(mix(colour, (1, 1, 1), HI_LIFT, 'MIX', -200, 420), g.inputs['Highlight'])
                sh = mix(colour, SHADOW_TINT, SHADOW_MIX, 'MIX', -200, -80)
                links.new(mix(sh, (SHADOW_VALUE,) * 3, 1.0, 'MULTIPLY', -60, -80), g.inputs['Shadow'])

        for nm, val in (('Highlight Range', 0.52), ('Midtone Range', 0.86),
                        ('Highlight Softness', 0.22), ('Midtone Softness', 0.26)):
            if nm in g.inputs:
                g.inputs[nm].default_value = val

        shader = g.outputs['Emission']
        if spec.get('transparent'):
            if alpha is not None:
                links.new(alpha, g.inputs['Alpha'])
            else:
                g.inputs['Alpha'].default_value = spec.get('opacity', 1.0)
            set_blend(m)

        ei = spec.get('emissiveIntensity') or 0.0
        if spec.get('emissive') and ei > 0:
            em = nodes.new('ShaderNodeEmission')
            em.location = (60, -200)
            eimg = self.image(spec.get('emissiveMap'))
            if eimg is not None:
                etex = nodes.new('ShaderNodeTexImage')
                etex.image = eimg
                etex.location = (-200, -260)
                links.new(etex.outputs['Color'], em.inputs['Color'])
            else:
                em.inputs['Color'].default_value = (*srgb_rgb(spec['emissive']), 1.0)
            em.inputs['Strength'].default_value = ei
            add = nodes.new('ShaderNodeAddShader')
            add.location = (300, 100)
            links.new(shader, add.inputs[0])
            links.new(em.outputs['Emission'], add.inputs[1])
            shader = add.outputs[0]

        links.new(shader, out.inputs['Surface'])
        return m


def set_blend(m):
    """blend_method moved between Blender versions; ask for alpha blending whichever way exists."""
    for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
        try:
            setattr(m, attr, val)
            return
        except Exception:
            continue


def load_komikaze(path, group):
    """Append one Komikaze node group (and whatever it depends on) out of CJ's shader library.
    Appended, never opened as the working file: the library is built for Blender 4.2 and this is
    5.2, so only the node groups cross the gap, not the file's own scene or render settings."""
    p = pathlib.Path(path)
    if not p.exists():
        print('  ! Komikaze library not found at %s — falling back to Cycles PBR' % p)
        return None
    try:
        with bpy.data.libraries.load(str(p), link=False) as (src, dst):
            if group not in src.node_groups:
                print('  ! %s has no node group called %r' % (p.name, group))
                dst.node_groups = []
                return None
            dst.node_groups = [group]
    except Exception as e:
        print('  ! could not append from %s: %s' % (p.name, e))
        return None
    ng = bpy.data.node_groups.get(group)
    print('  toon shader: %r appended from %s' % (group, p.name))
    return ng


# ─────────────────────────────────────────────────────────────────────────────
# the glb library: one import per model, one linked copy per recorded transform
# ─────────────────────────────────────────────────────────────────────────────
class Library:
    """Each asset/models/<name>.glb is imported once into a hidden source collection. The importer
    gives one Blender object per glTF node with one material slot per primitive — exactly the shape
    the page instances — so a placed copy is a new object sharing that mesh datablock, with the
    dumped material overridden per slot (models.js recolours one primitive per instance for the
    shopfront bays and lights the lamp heads, so the slot override has to be per object)."""

    def __init__(self, models_dir, src_coll):
        self.models_dir = pathlib.Path(models_dir)
        self.src = src_coll
        self.nodes = {}     # (model, node) -> source object
        self.loaded = set()
        self.missing = set()

    def load(self, model):
        if model in self.loaded or model in self.missing:
            return
        path = self.models_dir / (model + '.glb')
        if not path.exists():
            print('  ! %s missing, its objects are skipped' % path)
            self.missing.add(model)
            return
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(path))
        for o in set(bpy.data.objects) - before:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            self.src.objects.link(o)
            o.hide_render = True
            if o.type == 'MESH':
                self.nodes[(model, o.name.split('.')[0])] = o
                o.data.name = '%s:%s' % (model, o.name.split('.')[0])
                # palette materials, shared with every model script, in place of the glb's own
                for slot in o.data.materials.keys():
                    pass
                for i, mm in enumerate(o.data.materials):
                    if mm and mm.name.split('.')[0] in S.PALETTE:
                        o.data.materials[i] = S.mat(mm.name.split('.')[0])
        self.loaded.add(model)

    def node(self, model, node):
        self.load(model)
        return self.nodes.get((model, node)) or self.nodes.get((model, 'main'))


# ─────────────────────────────────────────────────────────────────────────────
# the JS-only geometry: dumped vertices become a real mesh
# ─────────────────────────────────────────────────────────────────────────────
def build_mesh(spec):
    pos = spec['position']
    n = len(pos) // 3
    verts = [(pos[i * 3], -pos[i * 3 + 2], pos[i * 3 + 1]) for i in range(n)]      # R, applied to the vertices
    idx = spec.get('index')
    tri = [tuple(idx[i:i + 3]) for i in range(0, len(idx), 3)] if idx else [(i, i + 1, i + 2) for i in range(0, n, 3)]
    me = bpy.data.meshes.new(spec.get('name') or ('geo%d' % spec['id']))
    me.from_pydata(verts, [], tri)
    me.validate()
    uv = spec.get('uv')
    if uv:
        layer = me.uv_layers.new(name='UVMap')
        for loop in me.loops:
            v = loop.vertex_index
            layer.data[loop.index].uv = (uv[v * 2], uv[v * 2 + 1])
    col = spec.get('color')
    if col:
        # the page's baked per-vertex occlusion (app.js aoBake) and the crowd's wardrobe colours
        attr = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
        for i in range(n):
            attr.data[i].color = (col[i * 3], col[i * 3 + 1], col[i * 3 + 2], 1.0)
    for p in me.polygons:
        p.use_smooth = False                                # every JS part is a flat-faced box or plane
    return me


# ─────────────────────────────────────────────────────────────────────────────
# camera, sun, world
# ─────────────────────────────────────────────────────────────────────────────
def build_camera(data, coll, res):
    c = data.get('camera')
    if not c:
        print('  ! no camera in the dump')
        return None
    cam = bpy.data.cameras.new('page-camera')
    # three.js fov is vertical. Sensor fit VERTICAL keeps the vertical field identical whatever the
    # render aspect; a 16:9 still therefore shows a little more left and right than the 1440x900 page.
    cam.sensor_fit = 'VERTICAL'
    cam.sensor_height = 24.0
    cam.lens = 12.0 / math.tan(math.radians(c['fov']) / 2.0)
    cam.clip_start = max(0.05, c.get('near', 0.1))
    cam.clip_end = c.get('far', 600)
    ob = bpy.data.objects.new('page-camera', cam)
    coll.objects.link(ob)
    ob.matrix_world = conv_rig(c['matrix'])
    bpy.context.scene.camera = ob
    return ob


def build_sun(data, coll, strength, angle_deg):
    s = data.get('sun')
    if not s:
        return None
    lamp = bpy.data.lights.new('page-sun', type='SUN')
    lamp.color = srgb_rgb(s.get('color', '#ffffff'))
    lamp.energy = strength
    lamp.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new('page-sun', lamp)
    p = Vector(s['position'])
    t = Vector(s.get('target', [0, 0, 0]))
    d = (R.to_3x3() @ (t - p)).normalized()                 # the direction the light travels, in Blender space
    ob.rotation_euler = Vector((0, 0, -1)).rotation_difference(d).to_euler()
    ob.location = R.to_3x3() @ p
    coll.objects.link(ob)
    return ob


def build_world(data, strength):
    """The page's background is a two-stop gradient dome plus a hemisphere light whose two colours
    are lerped 30% toward violet (app.js SHADOW_TINT, issue #11) so shade reads as colour rather
    than grey. One Blender world does both jobs: the same gradient is what the camera sees and what
    lights the shadowed faces."""
    sky = data.get('sky') or {'horizon': '#cfe0ee', 'top': '#8ecbff'}
    hemi = data.get('hemi') or {'sky': '#e7eefb', 'ground': '#9a8fa8'}
    w = bpy.data.worlds.new('page-sky')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Strength'].default_value = strength
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mapr = nt.nodes.new('ShaderNodeMapRange')
    coord = nt.nodes.new('ShaderNodeNewGeometry')      # Incoming, not Generated: the world's Generated
    for i, n in enumerate((coord, sep, mapr, ramp, bg, out)):   # vector is not the view ray in EEVEE
        n.location = (i * 220 - 1100, 0)
    mapr.inputs['From Min'].default_value = 1.0        # Incoming points back at the viewer, so up is -Z
    mapr.inputs['From Max'].default_value = -1.0
    e = ramp.color_ramp.elements
    e[0].position = 0.0
    e[0].color = (*srgb_rgb(hemi['ground']), 1.0)            # below the horizon: the pavement bounce
    e[1].position = 0.5
    e[1].color = (*srgb_rgb(sky['horizon']), 1.0)
    mid = e.new(0.72)                                        # the dome mixes horizon->top as pow(y, 0.55)
    mid.color = tuple((a + b) / 2 for a, b in zip(srgb_rgb(sky['horizon']), srgb_rgb(sky['top']))) + (1.0,)
    topx = e.new(1.0)
    topx.color = (*srgb_rgb(sky['top']), 1.0)
    nt.links.new(coord.outputs['Incoming'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Z'], mapr.inputs['Value'])
    nt.links.new(mapr.outputs['Result'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return w


# ─────────────────────────────────────────────────────────────────────────────
def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


def wipe():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)


def main(argv):
    ap = argparse.ArgumentParser(prog='scene_import.py')
    ap.add_argument('--json', required=True, help='the dump from tools/scene-dump.js')
    ap.add_argument('--out', help='.blend to save')
    ap.add_argument('--render', help='render a still to this path')
    ap.add_argument('--res', default='1920x1080')
    ap.add_argument('--samples', type=int, default=128)
    ap.add_argument('--sun', type=float, default=3.2, help='sun strength, W/m2 (the page has no physical unit)')
    ap.add_argument('--sun-angle', type=float, default=1.6, help='sun angular diameter in degrees: how soft the shadows are')
    ap.add_argument('--world', type=float, default=0.75, help='sky/ambient strength')
    ap.add_argument('--models', default=None, help='asset/models (default: next to this script)')
    ap.add_argument('--tex-dir', default=None, help='where the baked canvas PNGs are written')
    ap.add_argument('--no-tex', action='store_true', help='ignore the baked canvas textures')
    ap.add_argument('--device', default='GPU', choices=('GPU', 'CPU'))
    ap.add_argument('--shader', default='toon', choices=('toon', 'pbr', 'flat'),
                    help='toon = Komikaze cel shade in EEVEE (default), pbr = Cycles Principled, flat = Workbench flat colour')
    ap.add_argument('--kk', default=KK_DEFAULT, help="CJ's Komikaze library .blend")
    ap.add_argument('--kk-group', default='Cel Shade 3 Tones (Soft)', help='which Komikaze node group to shade with')
    A = ap.parse_args(argv)

    jpath = pathlib.Path(A.json).resolve()
    data = json.loads(jpath.read_text())
    here = pathlib.Path(os.path.dirname(os.path.abspath(__file__)))
    models_dir = pathlib.Path(A.models) if A.models else (here.parent / 'models')
    tex_dir = pathlib.Path(A.tex_dir) if A.tex_dir else (jpath.parent / (jpath.stem + '-tex'))
    if A.no_tex:
        data['textures'] = []

    wipe()
    sc = bpy.context.scene
    src = collection('_glb-source')
    sc.view_layers[0].layer_collection.children['_glb-source'].exclude = False
    src.hide_render = True
    src.hide_viewport = True
    rig = collection('rig')

    kk = load_komikaze(A.kk, A.kk_group) if A.shader == 'toon' else None
    shader = A.shader if (A.shader != 'toon' or kk is not None) else 'pbr'
    if A.shader == 'toon' and kk is None:
        print('  ! toon was asked for and Komikaze did not load: this is a Cycles PBR render, say so')
    mats = Materials(data, tex_dir, shader=shader, kk_group=kk)
    lib = Library(models_dir, src)

    # ── the glb street: the dump lists one entry per primitive, all sharing the node's transform,
    # because that is how models.js instances them. Group them back into one object per placement.
    groups = {}
    order = []
    geo_objs = []
    for o in data['objects']:
        if o['source'] == 'glb':
            key = (o['model'], o['node'], o.get('inst'), tuple(o['matrix']))
            if key not in groups:
                groups[key] = {'matrix': o['matrix'], 'model': o['model'], 'node': o['node'], 'prims': {}}
                order.append(key)
            groups[key]['prims'][o.get('prim')] = o['mat']
        else:
            geo_objs.append(o)

    colls = {}

    def coll_for(name):
        if name not in colls:
            colls[name] = collection(name)
        return colls[name]

    placed = {}
    for key in order:
        g = groups[key]
        srcob = lib.node(g['model'], g['node'])
        if srcob is None:
            continue
        ob = bpy.data.objects.new('%s.%s' % (g['model'], g['node']), srcob.data)
        coll_for(g['model']).objects.link(ob)
        ob.matrix_world = conv(g['matrix'])
        for i, slot in enumerate(ob.material_slots):
            pal = slot.material.name.split('.')[0] if slot.material else None
            if pal in g['prims']:
                slot.link = 'OBJECT'
                slot.material = mats.get(g['prims'][pal])
        placed[g['model']] = placed.get(g['model'], 0) + 1

    # ── the JS-only geometry
    meshes = {}
    js = coll_for('js-geometry')
    for o in geo_objs:
        gid = o['geo']
        if gid is None:
            continue
        if gid not in meshes:
            spec = next(g for g in data['geometries'] if g['id'] == gid)
            meshes[gid] = build_mesh(spec)
        me = meshes[gid]
        if len(me.materials) == 0:
            me.materials.append(None)                      # one slot on the shared mesh; the colour is per object
        ob = bpy.data.objects.new(o.get('name') or ('part%d' % gid), me)
        (coll_for('backdrop') if o.get('backdrop') else js).objects.link(ob)
        ob.matrix_world = conv(o['matrix'])
        ob.material_slots[0].link = 'OBJECT'
        ob.material_slots[0].material = mats.get(o['mat'])
        placed['js-geometry'] = placed.get('js-geometry', 0) + 1

    build_camera(data, rig, A.res)
    build_sun(data, rig, A.sun, A.sun_angle)
    build_world(data, A.world)

    # ── render settings: Cycles, Standard view transform so the palette is the palette
    w, h = (int(v) for v in A.res.lower().split('x'))
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.film_transparent = False
    try:
        sc.view_settings.view_transform = 'Standard'     # AgX would grey the palette down; the page does not
        sc.view_settings.look = 'None'
    except Exception as e:
        print('  ! view transform: %s' % e)

    if shader == 'flat':
        # the control: Workbench, flat material colour, no shader at all
        sc.render.engine = 'BLENDER_WORKBENCH'
        sh = sc.display.shading
        sh.light = 'FLAT'
        sh.color_type = 'MATERIAL'
        sh.show_shadows = False
        sh.show_cavity = False
        sc.display.render_aa = '16'
        sky = data.get('sky') or {}
        if sky.get('horizon'):                 # Workbench ignores the world node tree; give it the
            sh.background_type = 'VIEWPORT'    # dome's horizon colour so the control is not on black
            sh.background_color = srgb_rgb(sky['horizon'])
    elif shader == 'toon':
        # Komikaze is built on Shader-to-RGB, which exists only in EEVEE
        sc.render.engine = 'BLENDER_EEVEE'
        try:
            sc.eevee.taa_render_samples = max(16, A.samples)
            sc.eevee.use_shadows = True
            sc.eevee.use_raytracing = True
            sc.eevee.shadow_ray_count = 2
            sc.eevee.shadow_step_count = 6
            sc.eevee.use_volumetric_shadows = False
        except Exception as e:
            print('  ! eevee settings: %s' % e)
    else:
        sc.render.engine = 'CYCLES'
        sc.cycles.samples = A.samples
        sc.cycles.use_denoising = True
        sc.cycles.max_bounces = 6
        sc.cycles.diffuse_bounces = 3
        sc.cycles.transparent_max_bounces = 8
    print('  engine: %s  shader: %s' % (sc.render.engine, shader))
    if A.device == 'GPU' and sc.render.engine == 'CYCLES':
        try:
            prefs = bpy.context.preferences.addons['cycles'].preferences
            for kind in ('METAL', 'CUDA', 'HIP', 'ONEAPI'):
                try:
                    prefs.compute_device_type = kind
                    break
                except Exception:
                    continue
            prefs.get_devices()
            for d in prefs.devices:
                d.use = True
            sc.cycles.device = 'GPU'
            print('  cycles device: GPU (%s)' % prefs.compute_device_type)
        except Exception as e:
            print('  ! GPU unavailable, rendering on CPU: %s' % e)
            sc.cycles.device = 'CPU'
    elif sc.render.engine == 'CYCLES':
        sc.cycles.device = 'CPU'

    # page versus blend, per source model. The page draws one THREE.Mesh per glb primitive; the
    # Blender glTF importer gives one object per glTF node with one material slot per primitive,
    # so one object here answers for several meshes there. Both numbers are printed and both go in
    # the summary, because only the pair is checkable.
    prims = {}
    for o in data['objects']:
        k = o['model'] if o['source'] == 'glb' else ('js-geometry')
        prims[k] = prims.get(k, 0) + 1
    print('\npage vs blend, per source (page meshes / page placements = blend objects):')
    for k in sorted(set(list(placed) + list(prims))):
        print('  %-14s %5d page meshes  ->  %5d blend objects' % (k, prims.get(k, 0), placed.get(k, 0)))
    print('  meshes %d  materials %d  textures %d' % (len(bpy.data.meshes), len(bpy.data.materials), len(bpy.data.images)))
    if lib.missing:
        print('  ! missing glbs: %s' % ', '.join(sorted(lib.missing)))

    summary = {'shader': shader, 'engine': sc.render.engine, 'komikaze': A.kk_group if kk is not None else None,
               'placed': placed, 'objects_in_blend': len([o for o in bpy.data.objects if not o.hide_render]),
               'page_meshes': prims,
               'meshes': len(bpy.data.meshes), 'materials': len(bpy.data.materials), 'images': len(bpy.data.images),
               'dump_counts': data.get('counts', {}), 'meta': data.get('meta', {})}

    if A.out:
        out = pathlib.Path(A.out).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            bpy.ops.file.pack_all()                        # the .blend carries its own baked sign PNGs
        except Exception as e:
            print('  ! pack_all: %s' % e)
        bpy.ops.wm.save_as_mainfile(filepath=str(out))
        print('\nsaved %s (%.1f MB)' % (out, out.stat().st_size / 1048576))
        (out.with_suffix('.summary.json')).write_text(json.dumps(summary, indent=2))

    if A.render:
        rp = pathlib.Path(A.render).resolve()
        rp.parent.mkdir(parents=True, exist_ok=True)
        sc.render.filepath = str(rp)
        sc.render.image_settings.file_format = 'PNG'
        print('\nrendering %dx%d, %d samples -> %s' % (w, h, A.samples, rp))
        bpy.ops.render.render(write_still=True)
        print('rendered %s (%.1f MB)' % (rp, rp.stat().st_size / 1048576))


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    main(argv)
