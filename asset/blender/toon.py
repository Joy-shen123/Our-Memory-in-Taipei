# toon.py — turn mesh materials into a cel-shaded (toon) look, with an inked outline.
#
# In Blender: open the Scripting tab, open this file, select objects, Run Script (Alt+P).
# Nothing selected means every mesh in the scene. Ctrl+Z undoes it.
#
# Headless test (builds a sample scene and renders it):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/toon.py -- --demo x.png
#
# How it works: Diffuse BSDF → Shader to RGB turns the lighting into a plain brightness value,
# a constant Color Ramp snaps it into BANDS flat steps, which multiply the base colour. A
# Layer Weight rim adds a thin light edge. The outline is the "inverted hull" trick: a Solidify
# modifier with flipped normals draws a black shell whose front faces are culled.
#
# EEVEE only. Shader to RGB does not exist in Cycles, and none of this exports to glTF, so the
# website's three.js scene does not see it (three.js has its own MeshToonMaterial).

import sys

import bpy

BANDS = [(0.0, 0.35), (0.45, 0.7), (0.75, 1.0)]   # (light level where the band starts, brightness)
RIM = 0.25            # rim light strength, 0 turns it off
OUTLINE = 0.02        # outline thickness in metres, 0 turns it off
OUTLINE_COLOR = (0.02, 0.02, 0.03, 1.0)


def base_color(mat):
    """The colour the material shows now: Principled base colour, else the viewport colour."""
    if mat and mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                return tuple(n.inputs['Base Color'].default_value)
    return tuple(mat.diffuse_color) if mat else (0.8, 0.8, 0.8, 1.0)


def toon_material(mat):
    """Rebuild mat's node tree as a toon shader, keeping its colour."""
    color = base_color(mat)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new

    diffuse = N('ShaderNodeBsdfDiffuse'); diffuse.location = (-800, 0)
    to_rgb = N('ShaderNodeShaderToRGB'); to_rgb.location = (-600, 0)
    ramp = N('ShaderNodeValToRGB'); ramp.location = (-400, 0)
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    while len(els) < len(BANDS):
        els.new(1.0)
    for el, (pos, v) in zip(els, BANDS):
        el.position, el.color = pos, (v, v, v, 1.0)

    tint = N('ShaderNodeMix'); tint.location = (-100, 0)
    tint.data_type, tint.blend_type = 'RGBA', 'MULTIPLY'
    tint.inputs['Factor'].default_value = 1.0
    tint.inputs['B'].default_value = color

    rim = N('ShaderNodeLayerWeight'); rim.location = (-400, -300)
    rim.inputs['Blend'].default_value = 0.4
    rim_step = N('ShaderNodeMath'); rim_step.location = (-200, -300)
    rim_step.operation, rim_step.inputs[1].default_value = 'GREATER_THAN', 0.85
    rim_amt = N('ShaderNodeMath'); rim_amt.location = (0, -300)
    rim_amt.operation, rim_amt.inputs[1].default_value = 'MULTIPLY', RIM
    add = N('ShaderNodeMix'); add.location = (150, 0)
    add.data_type, add.blend_type = 'RGBA', 'ADD'
    add.inputs['B'].default_value = (1, 1, 1, 1)

    emit = N('ShaderNodeEmission'); emit.location = (350, 0)
    out = N('ShaderNodeOutputMaterial'); out.location = (550, 0)

    L(diffuse.outputs['BSDF'], to_rgb.inputs['Shader'])
    L(to_rgb.outputs['Color'], ramp.inputs['Fac'])
    L(ramp.outputs['Color'], tint.inputs['A'])
    L(rim.outputs['Facing'], rim_step.inputs[0])
    L(rim_step.outputs['Value'], rim_amt.inputs[0])
    L(tint.outputs['Result'], add.inputs['A'])
    L(rim_amt.outputs['Value'], add.inputs['Factor'])
    L(add.outputs['Result'], emit.inputs['Color'])
    L(emit.outputs['Emission'], out.inputs['Surface'])
    mat.diffuse_color = color
    return mat


def outline_material():
    mat = bpy.data.materials.get('ToonOutline') or bpy.data.materials.new('ToonOutline')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = OUTLINE_COLOR
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (200, 0)
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat.use_backface_culling = True
    mat.use_backface_culling_shadow = True   # else the shell shadows the whole object into the darkest band
    mat.diffuse_color = OUTLINE_COLOR
    return mat


def add_outline(obj, ink):
    if OUTLINE <= 0 or 'ToonOutline' in obj.modifiers:
        return
    if ink.name not in obj.data.materials:
        obj.data.materials.append(ink)
    mod = obj.modifiers.new('ToonOutline', 'SOLIDIFY')
    mod.thickness = OUTLINE
    mod.offset = 1.0
    mod.use_flip_normals = True
    mod.use_rim = False
    mod.material_offset = list(obj.data.materials).index(ink)


def apply(objects):
    ink = outline_material()
    done = set()
    for obj in objects:
        if obj.type != 'MESH':
            continue
        if not obj.data.materials:
            obj.data.materials.append(bpy.data.materials.new(obj.name + '_toon'))
        for mat in obj.data.materials:
            if mat and mat != ink and mat.name not in done:
                toon_material(mat)
                done.add(mat.name)
        add_outline(obj, ink)
    return len(done)


def flat_material(name, col):
    m = bpy.data.materials.new(name)
    m.diffuse_color = col
    m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col
    return m


def demo(png):
    """Sample scene: three coloured shapes, a sun, a camera. Renders to png."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    specs = [('Sphere', (-2.2, 0, 1), (0.85, 0.2, 0.15, 1)),
             ('Monkey', (0, 0, 1), (0.95, 0.75, 0.3, 1)),
             ('Cube', (2.2, 0, 1), (0.2, 0.45, 0.8, 1))]
    for kind, loc, col in specs:
        if kind == 'Monkey':
            bpy.ops.mesh.primitive_monkey_add(location=loc)
        elif kind == 'Cube':
            bpy.ops.mesh.primitive_cube_add(size=1.4, location=loc)
        else:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.8, location=loc)
        bpy.ops.object.shade_smooth()
        bpy.context.object.data.materials.append(flat_material(kind, col))
    bpy.ops.mesh.primitive_plane_add(size=20)
    bpy.context.object.data.materials.append(flat_material('Ground', (0.6, 0.65, 0.55, 1)))
    bpy.ops.object.light_add(type='SUN', rotation=(0.7, 0.5, 0))
    bpy.context.object.data.energy = 4
    bpy.ops.object.camera_add(location=(0, -11, 4), rotation=(1.3, 0, 0))
    sc = bpy.context.scene
    sc.world = bpy.data.worlds.new('Sky')
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.7, 0.85, 1)
    sc.camera = bpy.context.object
    apply([o for o in sc.objects if o.type == 'MESH'])
    sc.render.engine = 'BLENDER_EEVEE'
    sc.view_settings.view_transform = 'Standard'   # AgX would wash the flat colours out
    sc.render.resolution_x, sc.render.resolution_y = 960, 540
    sc.render.filepath = png
    bpy.ops.render.render(write_still=True)


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--demo' in argv:
        demo(bpy.path.abspath(argv[argv.index('--demo') + 1]))
    else:
        picked = bpy.context.selected_objects or list(bpy.context.scene.objects)
        print(f'toon.py: {apply(picked)} materials converted')
