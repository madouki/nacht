"""Create three hinged treasure coffers, their Unreal mesh set and the five-pose game atlas.

blender -b --factory-startup -P tools/blender/schatztruhen_bl.py
"""
import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
CELL = 96
PITCH = 2.08
ANGLES = (0, -18, -60, -108, -96)
HINGE = Vector((0, .37, .57))
KINDS = ("Reisetruhe", "Domschrein", "Herzschrein")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, rgb, metallic=0, roughness=.45):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


oak = material("Smoked oak", (.21, .061, .025))
oak_light = material("Oak heartwood", (.37, .14, .046))
iron = material("Blue iron", (.13, .18, .24), .65)
bronze = material("Gilt brass", (.71, .35, .070), .72, .30)
mahogany = material("Red lacquer", (.25, .016, .041), .26, .28)
ivory = material("Warm ivory", (.80, .66, .45), .16)
teal = material("Midnight enamel", (.021, .14, .17), .37, .29)
ruby = material("Garnet", (.73, .018, .051), .34, .22)
interior = material("Velvet lining", (.080, .015, .040))


def box(name, pos, size, mat, bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name, obj.dimensions = name, size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        edge = obj.modifiers.new("Chiselled edge", "BEVEL")
        edge.width, edge.segments = bevel, 1
        bpy.ops.object.modifier_apply(modifier=edge.name)
    return obj


def rivet(pos, size, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=pos)
    obj = bpy.context.object
    obj.name, obj.scale = "Cabochon", size
    obj.data.materials.append(mat)
    return obj


def mesh_object(name, vertices, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def badge(name, outline, center, depth, relief, mat):
    # Each facet meets at one proud point, so the ornament reads in a few pixels.
    points = [(x, depth, z) for x, z in outline] + [(center[0], depth - relief, center[1])]
    n = len(outline)
    faces = [(i, (i + 1) % n, n) for i in range(n)] + [tuple(reversed(range(n)))]
    return mesh_object(name, points, faces, mat)


def barrel(name, lo, hi, style, mat, outset=0):
    if style == 1:
        profile = [(-.39, 0), (-.32, .12), (0, .31), (.32, .12), (.39, 0)]
    else:
        profile = [(-.39 * math.cos(i * math.pi / 12), .24 * math.sin(i * math.pi / 12)) for i in range(13)]
    points = [(x, y * (1 + outset), .57 + z + outset * .37)
              for x in (lo, hi) for y, z in profile]
    n = len(profile)
    faces = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
    faces += [(0, n, 2*n-1, n-1), tuple(range(n)), tuple(reversed(range(n, 2*n)))]
    return mesh_object(name, points, faces, mat)


def make_chest(style):
    start = set(scene.objects)
    wood = (oak, mahogany, teal)[style]
    edging = (iron, bronze, ivory)[style]
    box("Lower moulding", (0, 0, .105), (1.38, .79, .11), edging)
    box("Lining", (0, 0, .205), (1.26, .65, .13), interior)
    for side in (-1, 1):
        box("Front or back", (0, side*.33, .36), (1.34, .082, .39), wood)
        box("End panel", (side*.63, 0, .36), (.087, .66, .39), wood)
        box("Lined rim", (0, side*.345, .55), (1.39, .08, .044), edging)
        box("Lined rim", (side*.655, 0, .55), (.08, .68, .044), edging)
        for x in (-.52, .52):
            box("Foot", (x, side*.29, .060), (.146, .14, .095), edging)
            box("Strap", (x, side*.374, .36), (.091, .028, .402), edging)
            for z in (.23, .47):
                rivet((x, side*.395, z), (.031, .020, .031), bronze)
    box("Lock plate", (0, -.393, .42), (.207, .041, .194), bronze, .022)
    box("Keyhole", (0, -.416, .415), (.037, .014, .078), interior, .006)
    if style == 0:
        for z in (.25, .33):
            box("Plank joint", (0, -.373, z), (1.21, .009, .012), oak_light, 0)
    elif style == 1:
        for x in (-.35, .35):
            badge("Lancet", [(x-.10,.19),(x-.10,.36),(x,.48),(x+.10,.36),(x+.10,.19)], (x,.31), -.378, .028, bronze)
            badge("Lancet glass", [(x-.05,.22),(x-.05,.34),(x,.40),(x+.05,.34),(x+.05,.22)], (x,.31), -.410, .016, ruby)
    else:
        for side in (-1, 1):
            wing = [(.11,.37),(.24,.49),(.47,.50),(.42,.40),(.34,.34),(.37,.33),(.23,.25)]
            badge("Ivory wing", [(side*x,z) for x,z in wing], (side*.27,.37), -.40, .041, ivory)
    body = set(scene.objects) - start
    barrel("Hinged lid", -.70, .70, style, wood)
    for x in (-.52, .52):
        barrel("Lid strap", x-.047, x+.047, style, edging, .055)
    box("Underside of lid", (0, 0, .563), (1.30,.68,.026), interior)
    box("Lid lip", (0,-.395,.584), (1.40,.045,.047), edging)
    box("Split clasp", (0,-.419,.563), (.135,.032,.117), bronze)
    if style == 1:
        for x in (-.59, 0, .59):
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.083, radius2=0, depth=.185,
                                            location=(x,0,.935))
            bpy.context.object.data.materials.append(bronze)
        rivet((0,-.207,.782), (.105,.042,.079), ruby)
    if style == 2:
        heart = [(-.12,.72),(-.135,.81),(-.082,.856),(-.027,.850),(0,.817),
                 (.027,.850),(.082,.856),(.135,.81),(.12,.72),(0,.612)]
        badge("Heart of the shrine", heart, (0,.759), -.335, .080, ruby)
        for side in (-1, 1):
            wing = [(.08,.70),(.29,.82),(.52,.96),(.49,.84),(.41,.76),(.45,.765),(.32,.68),(.15,.68)]
            badge("Winged crest", [(side*x,z) for x,z in wing], (side*.27,.76), -.302, .055, ivory)
    lid = set(scene.objects) - start - body
    bpy.context.view_layer.update()
    return [(o, o.matrix_world.copy(), o in lid) for o in sorted(body | lid, key=lambda o:o.name)]


models = [make_chest(i) for i in range(3)]
bpy.ops.object.select_all(action="DESELECT")
exports = []
for i, parts in enumerate(models):
    copies = []
    for source, transform, _ in parts:
        obj = bpy.data.objects.new(source.name, source.data.copy())
        scene.collection.objects.link(obj)
        obj.matrix_world = transform
        obj.select_set(True)
        copies.append(obj)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    merged = bpy.context.object
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    merged.name = KINDS[i]
    merged.data.name = KINDS[i]
    merged.location.x = (i - 1) * 1.85
    merged.select_set(False)
    exports.append(merged)
for obj in exports:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"tools/blender/schatztruhen.glb"), export_format="GLB",
                          use_selection=True, export_texcoords=False, export_animations=False)
for obj in exports:
    bpy.data.objects.remove(obj, do_unlink=True)

# Arrange every pose in screen space. All fifteen tiles share the same orthographic camera and foot anchor.
direction = Vector((2.3,-6.2,2.4)).normalized()
rotation = (-direction).to_track_quat("-Z","Y")
right = rotation @ Vector((1,0,0))
up = rotation @ Vector((0,1,0))
for row, parts in enumerate(models):
    for col, angle in enumerate(ANGLES):
        offset = right*((col-2)*PITCH) + up*((1-row)*PITCH - .64)
        hinge = Matrix.Translation(HINGE) @ Matrix.Rotation(math.radians(angle),4,"X") @ Matrix.Translation(-HINGE)
        for source, transform, moving in parts:
            obj = bpy.data.objects.new(source.name, source.data)
            scene.collection.objects.link(obj)
            obj.matrix_world = Matrix.Translation(offset) @ (hinge @ transform if moving else transform)
    for source, _, _ in parts:
        bpy.data.objects.remove(source, do_unlink=True)

scene.world = bpy.data.worlds.new("Night fill")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.20,.25,.36,1)
for pos, color, power, angle in [((-3,-5,7),(1,.82,.62),3.1,10), ((4,-3,4),(.53,.73,1),1.65,12),
                                ((1,4,3),(1,.67,.39),2.3,8)]:
    bpy.ops.object.light_add(type="SUN")
    lamp = bpy.context.object
    lamp.rotation_euler = (-Vector(pos)).to_track_quat("-Z","Y").to_euler()
    lamp.data.energy, lamp.data.color, lamp.data.angle = power, color, math.radians(angle)
bpy.ops.object.camera_add(location=direction*18)
scene.camera = bpy.context.object
scene.camera.rotation_euler = rotation.to_euler()
scene.camera.data.type = "ORTHO"
scene.camera.data.ortho_scale = PITCH*len(ANGLES)
scene.render.engine = "CYCLES"
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = CELL*len(ANGLES), CELL*len(models)
scene.render.resolution_percentage = 100
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = str(ROOT/"img/schatztruhen.png")
bpy.ops.render.render(write_still=True)
