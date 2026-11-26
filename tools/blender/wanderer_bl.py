# Die Helden auf der Oberwelt (js/umland.js): Henrik (rotes Kopftuch, langes braunes Haar, Ledermantel, blaue Hose, Peitsche am
# Gürtel) und Ragnor (schwarzes Haar mit rotem Stirnband, nackter Oberkörper, Fellschurz, Schwert auf dem Rücken), beide mit einer
# Laterne in der Hand. Kleine 3D-Figuren in Schrägsicht von oben, je vier Blickrichtungen (0 hinauf, 1 rechts, 2 hinab, 3 links)
# und drei Laufbilder (0 stehend, 1 und 2 Schritt). Bildfeld 22×30, Füße unten mittig.
# Aufruf: python bl.py wanderer_bl.py '{"out": ".../r_wanderer", "ss": 6}'
import bpy, math, os
from mathutils import Vector

SS = CFG.get('ss', 6); W_, H_ = 22, 30; TILT = math.radians(55)
def reset():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for b in list(coll): coll.remove(b)
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
MATS = {}
def M(h, rough=0.7, emit=0.0, metal=0.0):
    k = (h, rough, emit, metal)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new(h); m.use_nodes = True; b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(h) + [1]; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = lin(h) + [1]; b.inputs['Emission Strength'].default_value = emit
    MATS[k] = m; return m
def empty(name, loc, parent=None, rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); o.location = loc; o.rotation_euler = rot; bpy.context.scene.collection.objects.link(o)
    if parent: o.parent = parent
    return o
def part(kind, loc, scale, mat, parent, rot=(0, 0, 0)):
    if kind == 's': bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1, location=(0, 0, 0))
    elif kind == 'c': bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=1, depth=1, location=(0, 0, 0))
    elif kind == 'k': bpy.ops.mesh.primitive_cone_add(vertices=14, radius1=1, radius2=0.7, depth=1, location=(0, 0, 0))
    elif kind == 't': bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.18, major_segments=20, minor_segments=8, location=(0, 0, 0))
    else: bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    o = bpy.context.active_object; o.location = loc; o.scale = scale; o.rotation_euler = rot; o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = kind != 'b'
    o.parent = parent; return o
def limb(parent, a, b, r, mat):   # Zylinder von a nach b (lokale Koordinaten)
    a, b = Vector(a), Vector(b); d = b - a; L = d.length
    o = part('c', (a + b) / 2, (r, r, L), mat, parent); o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); return o

def hero(who, direction, frame):
    reset(); MATS.clear()
    root = empty('root', (0, 0, 0), None, (0, 0, math.radians([180, 90, 0, -90][direction])))
    swing = [0.0, 0.42, -0.42][frame]; bob = 0.0 if frame == 0 else 0.025
    body = empty('body', (0, 0, bob), root)
    if who == 'henrik':
        SKIN, HAIR, RED, COAT, COAT2, PANTS, BOOT, BELT, SHIRT = M('#e8b088', 0.6), M('#6a3c1c', 0.8), M('#c42c2c', 0.6), M('#6c4428', 0.65), M('#8a5a34', 0.6), M('#3c4488', 0.7), M('#2c1c14', 0.6), M('#c89838', 0.35, 0, 0.7), M('#e0d8c8', 0.7)
    else:
        SKIN, HAIR, RED, COAT, COAT2, PANTS, BOOT, BELT, SHIRT = M('#d8925c', 0.55), M('#1a1414', 0.8), M('#c42c2c', 0.6), M('#6c4a30', 0.9), M('#8c6c4c', 0.95), M('#d8925c', 0.55), M('#7c5c3c', 0.9), M('#4a3220', 0.6), M('#d8925c', 0.55)
    # Beine an Hüftgelenken
    for side, s in ((-1, swing), (1, -swing)):
        hip = empty('hip', (side * 0.1, 0, 0.5), body, (s, 0, 0))
        limb(hip, (0, 0, 0), (0, 0, -0.38), 0.075, PANTS)
        part('s', (0, -0.05, -0.44), (0.085, 0.14, 0.07), BOOT, hip)
        if who == 'ragnor': part('c', (0, 0, -0.3), (0.095, 0.095, 0.12), COAT2, hip)   # Fellstulpen
    # Rumpf
    if who == 'henrik':
        part('k', (0, 0, 0.66), (0.24, 0.2, 0.52), COAT, body)                 # Mantel, unten weiter
        part('s', (0, -0.13, 0.84), (0.08, 0.06, 0.12), SHIRT, body)          # Hemd im Ausschnitt
        part('c', (0, 0, 0.6), (0.215, 0.185, 0.05), BELT, body)              # Gürtel
        part('t', (0.2, -0.02, 0.55), (0.07, 0.07, 0.07), M('#7c5c34', 0.6), body, (math.radians(80), 0, 0))   # Peitsche, aufgerollt
        part('k', (0, 0, 0.42), (0.27, 0.23, 0.16), COAT2, body)              # Mantelsaum
    else:
        part('s', (0, 0, 0.78), (0.21, 0.17, 0.26), SKIN, body)               # nackter Oberkörper
        part('k', (0, 0, 0.47), (0.22, 0.2, 0.2), COAT, body)                 # Fellschurz
        part('c', (0, 0, 0.58), (0.2, 0.18, 0.045), BELT, body)
        limb(body, (-0.18, -0.12, 0.98), (0.12, -0.15, 0.6), 0.025, BELT)     # Schwertgurt quer
        part('b', (0, 0.16, 0.92), (0.05, 0.02, 0.62), M('#b8b8c8', 0.25, 0, 0.9), body, (0, math.radians(30), 0))   # Schwert auf dem Rücken
        part('b', (-0.09, 0.17, 1.2), (0.16, 0.04, 0.035), M('#c89838', 0.35, 0, 0.7), body, (0, math.radians(30), 0))
    # Arme an Schultergelenken, die Laterne in der linken Hand
    for side, s in ((-1, -swing * 0.8), (1, swing * 0.8)):
        sh = empty('sh', (side * 0.22, 0, 0.95), body, (s, 0, 0))
        limb(sh, (0, 0, 0), (side * 0.04, 0, -0.32), 0.06, COAT if who == 'henrik' else SKIN)
        part('s', (side * 0.045, 0, -0.36), (0.055, 0.055, 0.055), SKIN, sh)
        if side < 0:   # Laterne
            limb(sh, (side * 0.045, 0, -0.38), (side * 0.045, -0.02, -0.45), 0.008, M('#24222c', 0.4, 0, 0.6))
            part('c', (side * 0.045, -0.02, -0.52), (0.045, 0.045, 0.1), M('#24222c', 0.4, 0, 0.6), sh)
            part('s', (side * 0.045, -0.02, -0.52), (0.034, 0.034, 0.045), M('#ffc860', 0.3, 6.0), sh)
            L = bpy.data.lights.new('lant', 'POINT'); L.energy = 6; L.color = (1.0, 0.75, 0.42); L.shadow_soft_size = 0.05
            lo = bpy.data.objects.new('lant', L); bpy.context.scene.collection.objects.link(lo); lo.parent = sh; lo.location = (side * 0.045, -0.12, -0.5)
    # Kopf
    head = empty('head', (0, 0, 1.2), body)
    part('s', (0, 0, 0), (0.22, 0.21, 0.22), SKIN, head)
    for ex in (-0.075, 0.075): part('s', (ex, -0.19, 0.0), (0.03, 0.02, 0.04), M('#1c1010', 0.4), head)
    if who == 'henrik':
        part('s', (0, 0.04, 0.05), (0.24, 0.23, 0.2), HAIR, head)                        # Haar oben
        part('s', (0, 0.12, -0.16), (0.2, 0.12, 0.24), HAIR, head)                       # langes Haar hinten
        part('s', (0, 0.01, 0.1), (0.245, 0.235, 0.15), RED, head)                       # rotes Kopftuch
        part('s', (0.06, 0.24, 0.06), (0.05, 0.06, 0.04), RED, head); limb(head, (0.06, 0.26, 0.05), (0.13, 0.36, -0.1), 0.03, RED)   # Knoten, Zipfel
    else:
        part('s', (0, 0.05, 0.06), (0.24, 0.23, 0.2), HAIR, head)
        part('s', (0, 0.14, -0.18), (0.21, 0.13, 0.28), HAIR, head)                      # Mähne
        part('c', (0, 0.0, 0.06), (0.226, 0.216, 0.055), RED, head, (math.radians(-8), 0, 0))   # Stirnband, eng am Kopf
        limb(head, (0.04, 0.24, 0.06), (0.12, 0.34, -0.12), 0.025, RED)

def setup():
    sc = bpy.context.scene
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = 1.7
    co = bpy.data.objects.new('c', cam); co.rotation_euler = (TILT, 0, 0); sc.collection.objects.link(co); sc.camera = co
    zc = 0.67 / math.sin(TILT); P = Vector((0, 0, zc)); co.location = P + 20 * Vector((0, -math.sin(TILT), math.cos(TILT)))
    s = bpy.data.lights.new('key', 'SUN'); s.energy = 3.2; s.color = (0.86, 0.9, 1.0); s.angle = math.radians(8)
    so = bpy.data.objects.new('key', s); so.rotation_euler = (math.radians(50), 0, math.radians(-35)); sc.collection.objects.link(so)
    r = bpy.data.lights.new('rim', 'SUN'); r.energy = 1.6; r.color = (1.0, 0.55, 0.45)
    ro = bpy.data.objects.new('rim', r); ro.rotation_euler = (math.radians(-60), 0, math.radians(150)); sc.collection.objects.link(ro)
    wd = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); sc.world = wd; wd.use_nodes = True
    bg = next(n for n in wd.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs['Color'].default_value = lin('#58607c') + [1]; bg.inputs['Strength'].default_value = 0.9
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: sc.render.engine = eng; break
        except TypeError: pass
    try: sc.view_settings.view_transform = 'Standard'
    except Exception: pass
    sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W_ * SS, H_ * SS, 100
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass

os.makedirs(CFG['out'], exist_ok=True); n = 0
for who in ('henrik', 'ragnor'):
    for d in range(4):
        for f in range(3):
            name = '%s_%d_%d' % (who, d, f)
            if CFG.get('only') and name not in CFG['only']: continue
            hero(who, d, f); setup(); bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); n += 1
print('ok', n)
