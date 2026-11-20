"""Render the three weapon alcoves for the hero carousel.

blender -b --factory-startup -P tools/blender/waffenaltar.py
"""
import math
from pathlib import Path

import bpy
from mathutils import Vector


OUT = Path(__file__).resolve().parents[2] / "img" / "waffenaltar"
OUT.mkdir(parents=True, exist_ok=True)


def material(name, rgb, metal=0, rough=.5, glow=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bs = mat.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Metallic"].default_value = metal
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Emission Color"].default_value = (*rgb, 1)
    bs.inputs["Emission Strength"].default_value = glow
    return mat


def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        edge = obj.modifiers.new("Worn edges", "BEVEL")
        edge.width = bevel
        edge.segments = 2
        obj.modifiers.new("Normals", "WEIGHTED_NORMAL")
    return obj


def block(name, pos, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)


def rod(name, a, b, r, mat, r2=None, sides=12):
    delta = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=r, radius2=r if r2 is None else r2,
                                    depth=delta.length, location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return finish(obj, name, mat)


def bead(pos, radius, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=radius, location=pos)
    return finish(bpy.context.object, "Boss", mat)


def molding(name, points, r, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = r
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, xyz in zip(spline.points, points):
        point.co = (*xyz, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    return finish(obj, name, mat)


def relief(name, outline, ridge, mat):
    # A raised central ridge gives each side of the steel a different catchlight.
    vertices = [(x, 0, z) for x, z in outline] + [(ridge[0], -.24, ridge[1])]
    n = len(outline)
    faces = [(n, i, (i + 1) % n) for i in range(n)] + [tuple(reversed(range(n)))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat)


def lancet(x, z, radius, stone, brass, glass):
    # An equilateral pointed arch, with shared spring-line and a leaded trefoil.
    for side in (-1, 1):
        points = [(x + side * radius, 1.52, -.3), (x + side * radius, 1.52, z)]
        for i in range(1, 19):
            a = i * math.pi / 54
            points.append((x + side * radius * (2 * math.cos(a) - 1), 1.52, z + 2 * radius * math.sin(a)))
        molding("Carved archivolt", points, .14, stone)
        molding("Gilt fillet", [(px, py - .14, pz) for px, py, pz in points], .025, brass)
    block("Glass", (x, 1.87, 3.3), (radius * 2, .12, 7.5), glass)
    for dx in (-.5, 0, .5):
        rod("Leading", (x + dx * radius, 1.69, 0), (x + dx * radius, 1.69, z + .9), .037, stone)
    for i in range(3):
        a = math.pi / 2 + i * math.tau / 3
        cx = x + .49 * math.cos(a)
        cz = z + 1.0 + .49 * math.sin(a)
        points = [(cx + .54 * math.cos(j * math.tau / 28), 1.68,
                   cz + .54 * math.sin(j * math.tau / 28)) for j in range(29)]
        molding("Trefoil", points, .065, stone)


def weapon(hero, steel, gold, iron, leather, gem):
    start = set(bpy.context.scene.objects)
    if hero == "henrik":
        rod("Whip haft", (0, 0, -.05), (0, 0, 1.9), .16, leather, .12)
        for z in (.04, .29, .6, .91, 1.22, 1.53, 1.86):
            rod("Grip collar", (0, 0, z), (0, 0, z + .09), .18, gold)
        # Sagging chain, alternating links. The far end suspends a spiked head.
        for i in range(16):
            t = i / 15
            x = -1.32 * t
            z = 1.98 + 6.5 * t - 5.7 * t * t
            bpy.ops.mesh.primitive_torus_add(major_segments=16, minor_segments=6, major_radius=.13,
                                             minor_radius=.040, location=(x, 0, z))
            link = bpy.context.object
            link.rotation_euler = (math.pi / 2, 0, .95 if i % 2 else 0)
            link.scale = (.8, 1.24, 1)
            finish(link, "Forged link", gold)
        c = Vector((-1.33, 0, 2.32))
        bead(c, .47, iron)
        for dx, dy, dz in ((-1,0,0),(1,0,0),(0,0,-1),(0,0,1),(-.7,0,.7),(.7,0,-.7),
                           (-.7,0,-.7),(.7,0,.7),(0,-1,0)):
            direction = Vector((dx, dy, dz)).normalized()
            rod("Star spike", c + direction * .35, c + direction * .86, .15, steel, 0, 6)
    elif hero == "ragnor":
        rod("Leather grip", (0, 0, -.15), (0, 0, 1.05), .15, leather)
        for i in range(6):
            z = i * .18
            rod("Grip wire", (0, 0, z), (0, 0, z + .05), .161, gold)
        bead((0, 0, -.18), .24, gold)
        molding("Curved quillons", [(-.95,0,.83),(-.77,0,1.14),(-.38,0,1.21),(0,0,1.15),
                                    (.38,0,1.21),(.77,0,1.14),(.95,0,.83)], .105, gold)
        relief("Double edged blade", [(-.27,1.17),(-.36,1.62),(-.26,4.32),(0,5.16),
                                      (.26,4.32),(.36,1.62),(.27,1.17)], (0,3.25), steel)
        bead((0,-.14,1.17), .17, gem)
    else:
        rod("Ash shaft", (0,0,-.36), (0,0,4.3), .105, leather)
        for z in (-.34, .25, 2.8, 3.13, 3.38, 3.63):
            rod("Brass socket", (0,0,z), (0,0,z+.12), .14, gold)
        relief("Crescent axe", [(0,3.16),(-.42,3.32),(-.94,2.95),(-1.23,2.52),
                                (-1.34,3.08),(-1.25,3.66),(-1.04,4.19),(-.8,4.48),
                                (-.79,3.98),(-.45,3.75),(0,3.87)], (-.75,3.51), steel)
        relief("Beak", [(0,3.69),(.48,3.57),(.85,3.04),(.65,3.88),(0,4.09)], (.42,3.77), steel)
        relief("Lance point", [(-.16,4.03),(-.22,4.31),(0,5.39),(.22,4.31),(.16,4.03)], (0,4.43), steel)
        bead((0,-.14,3.66), .13, gem)
    objects = set(bpy.context.scene.objects) - start
    mount = bpy.data.objects.new("Weapon mount", None)
    bpy.context.collection.objects.link(mount)
    for obj in objects:
        obj.parent = mount
    mount.location = (-2.68 if hero != "henrik" else -2.05, -.35, 1.18 if hero != "henrik" else 1.01)
    mount.rotation_euler.y = math.radians(12 if hero != "henrik" else 24)
    if hero == "henrik":
        mount.scale = (1.28, 1.28, 1.28)


def area(name, pos, target, energy, color, size):
    light = bpy.data.lights.new(name, "AREA")
    light.energy, light.color, light.shape, light.size = energy, color, "DISK", size
    obj = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render(hero, tint):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    stone = material("Blue slate", (.045,.047,.073), .22)
    gild = material("Aged brass", (.43,.21,.063), .73, .32)
    glass = material("Lit glass", tint, .18, .4, .25)
    steel = material("Silver cutting edges", (.51,.65,.78), .78, .24)
    iron = material("Hammered iron", (.12,.16,.21), .78, .31)
    leather = material("Oxblood leather", (.13,.052,.027), .16, .57)
    gem = material("Garnet", (.42,.04,.028), .45, .19)
    block("Rear wall", (0,2.35,3), (18,.55,12), stone)
    for x in (-5.85, -2.08, 1.69, 5.46):
        lancet(x, 3.92, 1.66, stone, gild, glass)
    block("Pavement", (0,0,-.47), (18,12,.5), stone)
    for radius, height, z, mat in ((2.16,.16,-.12,stone),(2.08,.12,.02,gild),(2.0,.28,.20,stone),
                                   (2.03,.065,.365,gild),(1.98,.10,.445,stone)):
        rod("Hero dais", (2.04,-.22,z-height/2), (2.04,-.22,z+height/2), radius, mat, sides=10)
    weapon(hero, steel, gild, iron, leather, gem)
    area("Amber key", (-4,-5,8), (-2,0,3), 720, (1,.73,.45), 4)
    area("Blue window", (4,-1,7), (0,0,2), 390, (.48,.64,1), 3)
    area("Silver glint", (-1,-6,3.7), (-2,0,3), 195, (.72,.88,1), 2.5)
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Midnight")
    scene.world.color = (.15,.15,.21)
    bpy.ops.object.camera_add(location=(0,-18,5.1))
    scene.camera = bpy.context.object
    scene.camera.rotation_euler = (Vector((0,0,3.23)) - scene.camera.location).to_track_quat("-Z","Y").to_euler()
    scene.camera.data.type = "ORTHO"
    scene.camera.data.ortho_scale = 12.3
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 288, 172
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = str(OUT / (hero + ".png"))
    bpy.ops.render.render(write_still=True)


for name, color in (("henrik", (.155,.022,.030)), ("ragnor", (.026,.091,.142)), ("kaspar", (.089,.035,.13))):
    render(name, color)
