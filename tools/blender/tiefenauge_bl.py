"""Blender -b --factory-startup -P tools/blender/tiefenauge_bl.py

Model the ship's bronze votive, export the open relief for Unreal and render its two game poses.
Front is -Y, Z is up. The hanging loop, iris and eight arms share one casting.
"""
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgb, metallic, roughness, glow=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = roughness
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Emission Color"].default_value = (*rgb, 1)
    bs.inputs["Emission Strength"].default_value = glow
    return m


gold = material("Polished bronze", (.58, .29, .078), .76, .32)
shadow = material("Antique bronze", (.105, .048, .023), .64, .48)
patina = material("Verdigris enamel", (.037, .205, .166), .46, .35)
amber = material("Candle amber", (1.0, .36, .028), .32, .22, .27)
black = material("Black obsidian", (.009, .005, .019), .3, .17)
pearl = material("Pearl inlay", (.85, .79, .58), .24, .28)


def bead(name, x, depth, z, size, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1,
                                         location=(x, -depth, z))
    obj = bpy.context.object
    obj.name, obj.scale = name, size
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def tube(name, points, radii, mat, closed=False):
    # Sweep a round section along the relief plane. Varying the radius gives each arm a fine tip.
    vertices, faces = [], []
    sides = 8
    for i, (x, depth, z) in enumerate(points):
        lo = points[(i - 1) % len(points)] if closed or i else points[i]
        hi = points[(i + 1) % len(points)] if closed or i + 1 < len(points) else points[i]
        dx, dz = hi[0] - lo[0], hi[2] - lo[2]
        inv = 1 / max(.00001, math.hypot(dx, dz))
        r = radii[i]
        for j in range(sides):
            a = math.tau * j / sides
            vertices.append((x - dz * inv * r * math.cos(a), -depth - r * math.sin(a),
                             z + dx * inv * r * math.cos(a)))
    for i in range(len(points) if closed else len(points) - 1):
        next_i = (i + 1) % len(points)
        for j in range(sides):
            k = (j + 1) % sides
            faces.append((i*sides+j, i*sides+k, next_i*sides+k, next_i*sides+j))
    if not closed:
        faces += [tuple(reversed(range(sides))), tuple(range(len(vertices)-sides, len(vertices)))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    for p in mesh.polygons:
        p.use_smooth = True
    return obj


def ring(name, x, depth, z, rx, rz, r, mat):
    pts = [(x + rx*math.cos(i*math.tau/64), depth, z + rz*math.sin(i*math.tau/64)) for i in range(64)]
    return tube(name, pts, [r]*len(pts), mat, True)


def scroll(name, knots, width, mat):
    # Interpolate through the jeweller's control points to keep the silhouette taut at sprite size.
    coords = [Vector(p) for p in knots]
    pts = []
    for k in range(len(coords)-1):
        a, b = coords[k], coords[k+1]
        ma = (b - coords[max(0,k-1)]) * .5
        mb = (coords[min(k+2,len(coords)-1)] - a) * .5
        for j in range(7):
            t = j/7
            pts.append(a*(2*t**3-3*t*t+1) + ma*(t**3-2*t*t+t) + b*(-2*t**3+3*t*t) + mb*(t**3-t*t))
    pts.append(coords[-1])
    radii = [width * (1 - .92 * (i/(len(pts)-1))**1.16) for i in range(len(pts))]
    tube(name, pts, radii, mat)
    return pts, radii


# Patinated backplate, rolled edges and the bail from which the plaque hangs.
bead("Cast shell", 0, 0, 1.04, (.63,.085,.59), shadow)
bead("Enamel ground", 0, .068, 1.04, (.57,.06,.54), patina)
ring("Outer bezel", 0, .08, 1.04, .615,.575,.031,gold)
ring("Hanging bail", 0, .01, 1.73, .122,.15,.037,gold)
bead("Bail joint", 0,.075,1.59,(.092,.07,.09),gold)

arms = [
    [(.33,1.32),(.58,1.45),(.79,1.56),(.86,1.72),(.77,1.77),(.74,1.68)],
    [(.47,1.13),(.70,1.20),(.86,1.10),(.91,.94),(.84,.87),(.76,.91),(.76,.99)],
    [(.44,.97),(.67,.85),(.71,.62),(.64,.44),(.47,.42),(.41,.52),(.46,.59),(.52,.56)],
    [(.21,.88),(.36,.65),(.31,.45),(.17,.30),(.16,.17),(.25,.095),(.33,.13)],
]
for sign in (-1, 1):
    for i, outline in enumerate(arms):
        knots = [(sign*x,.08+.012*math.sin(n),z) for n,(x,z) in enumerate(outline)]
        pts, radii = scroll("Curled arm", knots, .079 if i != 3 else .071, gold)
        for n in range(6,len(pts)-5,6):
            x,d,z = pts[n]; r = radii[n]*.60
            bead("Verdigris sucker",x,d+radii[n]*.75,z,(r,r*.6,r),patina)
    for k in range(4):
        a = math.radians(30 + k*17)
        bead("Crown stud",sign*.45*math.cos(a),.137,1.14+.42*math.sin(a),(.025,.019,.025),pearl)

bead("Eye socket",0,.128,1.105,(.49,.077,.247),shadow)
open_parts = []
open_parts.append(bead("Honey glass",0,.204,1.105,(.411,.074,.211),amber))
open_parts.append(bead("Vertical pupil",0,.276,1.105,(.086,.012,.190),black))
open_parts.append(bead("Catchlight",-.094,.279,1.197,(.042,.013,.034),pearl))
for sign in (-1,1):
    pts = [(-.445+.89*i/40,.218,1.105+sign*.189*math.sin(math.pi*i/40)) for i in range(41)]
    tube("Engraved lid",pts,[.018+.022*math.sin(math.pi*i/40) for i in range(41)],gold)

# Merge a copy for engine import; keep the working relief rig intact for the sleeping pose.
parts = list(bpy.context.scene.objects)
bpy.ops.object.select_all(action="DESELECT")
copies = []
for part in parts:
    obj=part.copy()
    obj.data=part.data.copy()
    bpy.context.collection.objects.link(obj)
    obj.select_set(True)
    copies.append(obj)
bpy.context.view_layer.objects.active=copies[0]
bpy.ops.object.join()
model=bpy.context.object
model.name="Tiefenauge"
bpy.context.scene.cursor.location=(0,0,0)
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/"tools/blender/tiefenauge.glb"),export_format="GLB",
                          use_selection=True,export_texcoords=False,export_animations=False)
bpy.data.objects.remove(model,do_unlink=True)

scene = bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=10
scene.cycles.use_denoising=True
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=160
scene.render.resolution_percentage=100
scene.render.image_settings.color_mode="RGBA"
scene.world=bpy.data.worlds.new("Deep blue")
scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.25,.29,.38,1)
focus=Vector((0,-.06,.97))

def aim(obj):
    obj.rotation_euler=(focus-obj.location).to_track_quat("-Z","Y").to_euler()

bpy.ops.object.camera_add(location=(0,-5,1.03))
scene.camera=bpy.context.object
scene.camera.data.type="ORTHO"
scene.camera.data.ortho_scale=2.03
aim(scene.camera)
for name,pos,color,energy,size in [
    ("Warm key",(-1.5,-2,2.8),(1,.77,.51),125,1.5),
    ("Sea fill",(1.5,-1.1,.85),(.45,.74,1),68,1.15),
    ("Gilded rim",(.5,.6,2.6),(1,.70,.33),145,1),
]:
    bpy.ops.object.light_add(type="AREA", location=pos)
    lamp=bpy.context.object
    lamp.name=name
    lamp.data.energy,lamp.data.color,lamp.data.size=energy,color,size
    aim(lamp)

def render(state):
    scene.render.filepath=str(ROOT / "img" / ("tiefenauge_" + state + ".png"))
    bpy.ops.render.render(write_still=True)

render("offen")
for part in open_parts:
    part.hide_render=True
bead("Sleeping eyelids",0,.205,1.105,(.412,.074,.213),patina)
pts=[(-.40+.80*i/32,.221+.062*math.sin(i*math.pi/32),1.105-.036*math.sin(i*math.pi/32)) for i in range(33)]
tube("Lid seam",pts,[.012]*len(pts),shadow)
render("zu")
