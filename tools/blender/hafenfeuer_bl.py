"""Blender -b -P tools/blender/hafenfeuer_bl.py • Hafenfeuer on the starting coast."""
import math
import random
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
rng = random.Random(1873)
bpy.ops.wm.read_factory_settings(use_empty=True)
vertices, faces, indices, materials = [], [], [], []


def material(name, color, metal=0, glow=0):
    # Swatches are sRGB, Blender's shader inputs are linear.
    rgb = [int(color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    rgba = tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb) + (1,)
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgba
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = 0.72
    if glow:
        shader.inputs["Emission Color"].default_value = rgba
        shader.inputs["Emission Strength"].default_value = glow
    materials.append(mat)
    return len(materials) - 1


basalt = material("Salt basalt", "252239")
stone = material("Violet limestone", "66576c")
limestone = material("Salt-worn edges", "a8999c")
dark = material("Deep recess", "171625")
verdigris = material("Verdigris copper", "327073", 0.25)
bronze = material("Burnished copper", "a37350", 0.26)
shingles = material("Oxblood tiles", "753847")
glass = material("Ghost glass", "44bcbd", glow=0.65)
flame = material("Beacon flame", "c7fff0", glow=2.5)
amber = material("Keeper's windows", "eeab68", glow=0.6)


def polygon(points, mat):
    start = len(vertices)
    vertices.extend(points)
    faces.append(tuple(range(start, start + len(points))))
    indices.append(mat)


def ring(x, y, z, rx, ry, sides, phase=0):
    return [(x + rx * math.cos(phase + i * math.tau / sides),
             y + ry * math.sin(phase + i * math.tau / sides), z) for i in range(sides)]


def loft(rings, mat):
    count = len(rings[0])
    polygon(list(reversed(rings[0])), mat)
    for low, high in zip(rings, rings[1:]):
        for i in range(count):
            j = (i + 1) % count
            polygon([low[i], low[j], high[j], high[i]], mat)
    polygon(rings[-1], mat)


def turret(x, y, profile, mat, sides=8):
    loft([ring(x, y, z, r, r, sides, math.pi / sides) for z, r in profile], mat)


def box(x, y, z, w, d, h, mat):
    base = [(x - w/2, y - d/2, z), (x + w/2, y - d/2, z),
            (x + w/2, y + d/2, z), (x - w/2, y + d/2, z)]
    loft([base, [(a, b, c + h) for a, b, c in base]], mat)


# Interlocking, water-cut columnar basalt in a low asymmetrical reef.
for x, y, r, h in [(0, 0, 3.55, 2.36), (-3.05, 0.15, 2.1, 1.84), (3.54, 0.25, 1.9, 1.66),
                   (-5.1, 0.28, 1.45, 1.32), (5.25, -0.12, 1.45, 0.9), (-6.5, 0.55, 0.72, 0.58)]:
    loft([ring(x, y, -0.5, r, r * 0.68, 7), ring(x, y, h * 0.68, r * 0.94, r * 0.68, 7),
          ring(x + 0.15, y, h, r * 0.7, r * 0.49, 7)], basalt)
    for k in range(6):
        dx = r * (k / 3 - 0.83)
        t = rng.uniform(0.4, h)
        turret(x + dx, y - 0.51*r, [(-0.4, 0.42), (t, 0.46), (t + 0.15, 0.32)], stone if k % 4 == 0 else basalt, 5)

# A battered breakwater, pitched-roof keeper's cottage and a warm lancet window.
box(-2.9, 0, 1.54, 3.55, 2.05, 0.4, limestone)
box(-2.9, 0, 1.94, 2.95, 1.55, 1.86, stone)
for end in (-4.58, -1.22):
    polygon([(end, -0.99, 3.77), (end, 0.99, 3.77), (end, 0, 4.94)], shingles)
for side in (-1, 1):
    polygon([(-4.58, side * 0.99, 3.77), (-1.22, side * 0.99, 3.77), (-1.22, 0, 4.94), (-4.58, 0, 4.94)], shingles)
box(-3.75, 0.3, 4.13, 0.42, 0.5, 1.02, basalt)
for wx in (-3.7, -2.78):
    box(wx, -0.81, 2.48, 0.39, 0.08, 0.81, dark)
    box(wx, -0.87, 2.54, 0.2, 0.06, 0.58, amber)
for n in range(6):
    box(2.3 + n * 0.39, -0.77, 0.38, 0.48, 0.9, 1.85 - n * 0.26, stone)

# Faceted tower with sloping buttresses, lancet recesses and projecting stone courses.
turret(0, 0, [(1.65, 1.96), (2.65, 1.87), (3, 1.58), (8.62, 1.04)], stone)
for z, radius in [(2.57, 1.9), (4.55, 1.51), (7.14, 1.28), (8.5, 1.24)]:
    turret(0, 0, [(z, radius), (z + 0.12, radius + 0.035), (z + 0.21, radius - 0.06)], limestone)
for i in range(8):
    a = (i + 0.5) * math.tau / 8
    cx, sy = math.cos(a), math.sin(a)
    loft([ring(cx * r, sy * r, z, width, width, 4, a) for z, r, width in
          [(2, 1.71, 0.54), (3.65, 1.61, 0.41), (6.8, 1.28, 0.18)]], limestone)
    # Lancets follow the flat faces, with a slim highlight nested inside the dark recess.
    ax, ay = math.cos(i * math.tau/8), math.sin(i * math.tau/8)
    for width, bottom, top, inset, mat in [(0.32, 5.09, 6.65, 0.035, dark), (0.11, 5.26, 6.33, 0.045, glass)]:
        pane = []
        for u, z in [(-width, bottom), (width, bottom), (width, top - 0.35), (0, top), (-width, top - 0.35)]:
            radius = (1.58 - (z - 3) * 0.54/5.62) * math.cos(math.pi/8) + inset
            pane.append((ax * radius - ay * u, ay * radius + ax * u, z))
        polygon(pane, mat)

# Copper lantern, open gallery, Fresnel bands around an emissive spindle.
turret(0, 0, [(8.65, 1.04), (8.91, 1.58), (9.11, 1.63), (9.2, 1.42)], verdigris)
for i in range(8):
    a = (i + 0.5) * math.tau/8
    turret(1.22 * math.cos(a), 1.22 * math.sin(a), [(9.15, 0.1), (10.94, 0.095)], bronze, 5)
turret(0, 0, [(9.23, 0.18), (9.7, 0.61), (10.17, 0.72), (10.65, 0.25)], glass, 12)
turret(0, 0, [(9.72, 0.64), (10.11, 0.76), (10.37, 0.62)], flame, 12)
for z, r in [(9.65, 0.65), (9.8, 0.72), (10.21, 0.73), (10.42, 0.59)]:
    turret(0, 0, [(z, r), (z + 0.045, r)], bronze, 12)
turret(0, 0, [(10.89, 1.26), (11.04, 1.61), (11.18, 1.64)], bronze)
turret(0, 0, [(11.16, 1.67), (11.46, 1.19), (12.6, 0.38), (13.05, 0.22)], verdigris)
turret(0, 0, [(12.85, 0.21), (13.08, 0.29), (13.31, 0.12), (14, 0.018)], bronze)
polygon([(0, 0, 13.9), (-0.6, 0.06, 13.91), (-1.13, 0.03, 13.66), (-0.6, 0.04, 13.71), (0, 0, 13.58)], shingles)

mesh = bpy.data.meshes.new("Hafenfeuer")
mesh.from_pydata(vertices, [], faces)
mesh.update()
obj = bpy.data.objects.new("Hafenfeuer", mesh)
bpy.context.collection.objects.link(obj)
for mat in materials:
    mesh.materials.append(mat)
for face, index in zip(mesh.polygons, indices):
    face.material_index = index
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath=str(ROOT / "tools/blender/hafenfeuer.glb"), export_format="GLB",
                          use_selection=True, export_texcoords=False, export_animations=False)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 240
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new("Moonlit mist")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.14, 0.17, 0.25, 1)

focus = Vector((0, 0, 6.6))
def aim(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()

bpy.ops.object.camera_add(location=(9, -36, 11.8))
camera = bpy.context.object
aim(camera, focus)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 16
scene.camera = camera

def area(name, location, color, power, size):
    bpy.ops.object.light_add(type="AREA", location=location)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy, lamp.data.color, lamp.data.shape, lamp.data.size = power, color, "DISK", size
    aim(lamp, focus)

area("Moon", (-7, -10, 18), (0.66, 0.79, 1.0), 2900, 8)
area("Sky behind copper", (4, 6, 14), (0.59, 0.89, 1.0), 3600, 6)
area("Harbour", (8, -5, 6), (0.95, 0.53, 0.42), 550, 5)
scene.view_settings.view_transform = "AgX"
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = str(ROOT / "img/bg/hafenfeuer.png")
bpy.context.view_layer.update()
for name, position in [("lamp", (0, 0, 10.08)), ("waterline", (0, 0, -0.2))]:
    uv = world_to_camera_view(scene, camera, Vector(position))
    print(name, "in sprite:", round(uv.x * 240, 1), round((1 - uv.y) * 240, 1))
bpy.ops.render.render(write_still=True)
