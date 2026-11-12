# Graf (Dracula) für NACHTMAHR in Blender: drei Posen von vorn (Umhang geschlossen, offen, Arme erhoben), Bildfeld 100×88
# Spielpixel, SS-fach überabgetastet. Aufruf über den Add-on-Socket mit CFG = {'out', 'ss'}.
import bpy, bmesh, json, math, os
from mathutils import Euler

FW, FH = 100, 88
SS = CFG.get('ss', 8)

def lin(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

def reset():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for d in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for x in list(d):
            if x.users == 0: d.remove(x)

def setup():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = FW * SS; sc.render.resolution_y = FH * SS; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass
    w = bpy.data.worlds.get('NMWorld') or bpy.data.worlds.new('NMWorld'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (0.13, 0.1, 0.2, 1); bg.inputs[1].default_value = 0.5
    cam = bpy.data.cameras.new('NMCam'); cam.type = 'ORTHO'; cam.ortho_scale = FW
    co = bpy.data.objects.new('NMCam', cam); sc.collection.objects.link(co); co.location = (0, -200, FH / 2); co.rotation_euler = (math.radians(90), 0, 0); sc.camera = co
    def sun(name, rot, energy, col):
        l = bpy.data.lights.new(name, 'SUN'); l.energy = energy; l.color = col; l.angle = math.radians(6)
        o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.rotation_euler = Euler([math.radians(a) for a in rot])
    sun('Key', (58, 0, -32), 4.0, (1.0, 0.94, 0.9))      # von oben links vorn
    sun('Fill', (100, 0, 40), 0.9, (0.7, 0.74, 1.0))     # kaltes Licht von rechts unten
    sun('Rim', (-50, 0, 180), 3.0, (0.8, 0.7, 1.0))      # Kante von hinten
    sun('Under', (150, 0, 0), 0.5, (1.0, 0.25, 0.2))     # roter Schein von unten

MESH = {}
def meshes():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=18, radius=1); o = bpy.context.object; MESH['s'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=1, radius2=0, depth=2); o = bpy.context.object; MESH['k'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)

MATS = {}
def M(hexcol, rough=0.6, metal=0.0, emit=0.0, spec=0.4, sheen=0.0):
    k = (hexcol, rough, metal, emit, sheen)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new('m' + hexcol); m.use_nodes = True; m.use_backface_culling = False
    b = m.node_tree.nodes.get('Principled BSDF'); c = lin(hexcol)
    b.inputs['Base Color'].default_value = c; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    for nm in ('Specular IOR Level', 'Specular'):
        if nm in b.inputs: b.inputs[nm].default_value = spec; break
    if emit:
        for nm in ('Emission Color', 'Emission'):
            if nm in b.inputs: b.inputs[nm].default_value = c; break
        if 'Emission Strength' in b.inputs: b.inputs['Emission Strength'].default_value = emit
    if sheen and 'Sheen Weight' in b.inputs: b.inputs['Sheen Weight'].default_value = sheen
    MATS[k] = m; return m

OBJ = []
def add(kind, px, py, y, rx, ry, rz, mat, rot=(0, 0, 0)):
    o = bpy.data.objects.new('p', MESH[kind]); bpy.context.scene.collection.objects.link(o)
    o.location = (px - FW / 2, y, FH - py); o.scale = (rx, ry, rz); o.rotation_euler = rot
    if not o.material_slots: o.data.materials.append(None)
    o.material_slots[0].link = 'OBJECT'; o.material_slots[0].material = mat
    OBJ.append(o); return o
def S(px, py, y, rx, mat, ry=None, rz=None, rot=(0, 0, 0)): return add('s', px, py, y, rx, ry if ry else rx, rz if rz else rx, mat, rot)
def chain(a, b, y, r0, r1, mat, n=18, y1=None):
    for i in range(n):
        t = i / (n - 1); S(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, y + ((y1 - y) * t if y1 is not None else 0), r0 + (r1 - r0) * t, mat)
def tube(a, b, r0, r1, mat, y0=0.0, y1=None, caps=True):
    from mathutils import Vector, Matrix
    if y1 is None: y1 = y0
    A = Vector((a[0] - FW / 2, y0, FH - a[1])); Bv = Vector((b[0] - FW / 2, y1, FH - b[1])); d = Bv - A; L = d.length or 0.001
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=r0, radius2=r1, depth=L)
    me = bpy.data.meshes.new('t'); bm.to_mesh(me); bm.free()
    for pl in me.polygons: pl.use_smooth = True
    o = bpy.data.objects.new('t', me); bpy.context.scene.collection.objects.link(o); me.materials.append(mat)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized()); o.location = (A + Bv) / 2
    OBJ.append(o)
    if caps: S(a[0], a[1], y0, r0, mat); S(b[0], b[1], y1, r1, mat)
    return o
def grid(fn, nu, nv, mat):  # Fläche aus fn(u, v) → (px, py, y)
    bm = bmesh.new(); vs = [[None] * (nv + 1) for _ in range(nu + 1)]
    for i in range(nu + 1):
        for j in range(nv + 1):
            px, py, y = fn(i / nu, j / nv); vs[i][j] = bm.verts.new((px - FW / 2, y, FH - py))
    for i in range(nu):
        for j in range(nv): bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
    me = bpy.data.meshes.new('g'); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new('g', me); bpy.context.scene.collection.objects.link(o); me.materials.append(mat); OBJ.append(o); return o
def clear():
    for o in OBJ: bpy.data.objects.remove(o, do_unlink=True)
    OBJ.clear()

def poly_at(pts, t):  # Punkt auf einem Streckenzug, t 0..1 nach Länge
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]; L = sum(seg) or 1; d = t * L
    for i, s in enumerate(seg):
        if d <= s or i == len(seg) - 1:
            k = min(1, d / s) if s else 0; return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k)
        d -= s

def count(pose):
    skin, skinS = M('#eeeaf2', 0.45), M('#cdc6d6', 0.55)
    black, coat = M('#0c0a14', 0.35, 0, 0, 0.6), M('#16121e', 0.5, 0, 0, 0.5, 0.4)
    red, redD = M('#c41c2c', 0.5, 0, 0, 0.5, 0.5), M('#7c0c1c', 0.6)
    white, gold = M('#f0ecf8', 0.5), M('#f0c040', 0.25, 0.9)
    hair = M('#0a0810', 0.25, 0, 0, 0.8)
    cx = 50
    # Arme je Pose (Bild-links = seine rechte Seite)
    if pose == 'open': shd, elb, hnd = (41.5, 30), (27, 27.5), (12.5, 22.5)
    elif pose == 'cast': shd, elb, hnd = (41.5, 29), (35, 16), (37.5, 4)
    else: shd, elb, hnd = (42, 30.5), (40.5, 40), (46.5, 47)
    mir = lambda p: (2 * cx - p[0], p[1])
    # ---- Umhang hinten ----
    if pose == 'closed':
        def cape(u, v):  # Mantel um den Leib: halber Kegel mit Falten, vorn ein Schlitz
            th = (u - 0.5) * math.radians(300); r = 9.8 + 10.2 * v + 1.7 * v * math.sin(th * 7)
            return (cx + math.sin(th) * r, 27 + 59.5 * v + 1.2 * math.cos(th) * (1 - v), -math.cos(th) * r * 0.55 + 1.5)
        grid(cape, 84, 16, M('#0f0b16', 0.45, 0, 0, 0.5, 0.25))
        tube((cx + 0.6, 34), (cx + 0.2, 86.5), 0.55, 0.7, redD, -6.6, -11.6, caps=False)   # schmale rote Futterkante am Schlitz
    else:
        K = 5 if pose == 'open' else 6
        cornerY, hemY, sideX = (62, 84, 6) if pose == 'open' else (56, 85, 2)
        top = [hnd, elb, shd, (cx, 27.5), mir(shd), mir(elb), mir(hnd)]
        def cape(u, v):
            tx, tyy = poly_at(top, u)
            bx = sideX + (FW - 2 * sideX) * u
            arc = math.sin(math.pi * u) ** 0.7
            byy = cornerY + (hemY - cornerY) * arc - 6.5 * (1 - abs(math.cos(math.pi * u * K)) ** 0.6) * (0.35 + 0.65 * arc)
            w = v ** 0.9
            return (tx + (bx - tx) * w, tyy + (byy - tyy) * w, 4.0 + 4.2 * v * math.cos(math.pi * u * K * 2) + 1.5 * (1 - v))
        grid(cape, 84, 18, red)
        grid(lambda u, v: (lambda p: (p[0] + (p[0] - cx) * 0.035, p[1] + 0.9, p[2] + 1.2))(cape(u, v)), 84, 18, black)   # schwarzer Saum dahinter
    # ---- Kragen: hoch aufgestellt, außen schwarz, innen rot ----
    for s in (-1, 1):
        def leaf(u, v, k=1.0, s=s):  # vom Schlüsselbein spitz nach oben außen
            w = (0.25 + 4.6 * math.sin(math.pi * min(1, v * 1.08)) ** 0.75 * (1 - 0.45 * v)) * k
            mx, my = cx + s * (4.2 + 6.4 * v), 29 - 22.5 * v
            return (mx + s * (u - 0.5) * 2 * w, my + (u - 0.5) * 2 * w * 0.35 * s * -1, 3.2 - 1.6 * math.sin(math.pi * u) + (0 if k == 1.0 else 0.9))
        grid(lambda u, v: leaf(u, v, 1.22), 10, 18, black); grid(leaf, 10, 18, red)
    # ---- Beine, Schuhe ----
    if pose != 'closed':
        for s in (-1, 1):
            tube((cx + s * 3.4, 55), (cx + s * 3.9, 84), 3.7, 2.6, coat)
            S(cx + s * 4.2, 85.7, -2.0, 3.0, black, 4.8, 1.7)
    else:
        for s in (-1, 1): S(cx + s * 3.0, 86.0, -6.5, 2.4, black, 3.4, 1.4)
    # ---- Rumpf: Frack, Hemdbrust, rote Weste, Orden ----
    S(cx, 30.4, 0, 9.4, coat, 4.4, 3.8); S(cx, 37.5, 0, 7.6, coat, 4.3, 9.6); S(cx, 47, 0, 5.9, coat, 4.0, 6.0); S(cx, 53.5, 0, 6.9, coat, 4.2, 6.2)
    S(cx, 35.5, -3.4, 3.0, white, 1.6, 7.0); S(cx, 44.5, -3.5, 3.5, red, 1.7, 8.0)
    S(cx, 29.6, -3.9, 2.3, red, 1.4, 1.5); S(cx, 29.2, -4.8, 1.0, gold, 0.8, 1.0)   # Schleife mit Brosche
    S(cx, 43.5, -5.2, 1.5, gold, 0.7, 1.5); S(cx, 43.5, -5.7, 0.75, M('#a01020', 0.2, 0, 0.6), 0.5, 0.75)
    for py in (38.5, 48.5): S(cx, py, -5.1, 0.55, gold, 0.4, 0.55)
    # ---- Arme ----
    for s, (a, b, c) in ((-1, (shd, elb, hnd)), (1, (mir(shd), mir(elb), mir(hnd)))):
        if pose == 'closed' and s == 1: continue
        ya = -1.0 if pose != 'closed' else -5.5
        tube(a, b, 3.1, 2.5, coat, 0, ya * 0.5); tube(b, c, 2.5, 2.0, coat, ya * 0.5, ya)
        S(c[0], c[1], ya - 0.3, 2.5, white, 2.1, 1.5)                                   # Manschette
        hx, hy = c[0] + (c[0] - b[0]) * 0.17, c[1] + (c[1] - b[1]) * 0.17
        S(hx, hy, ya - 0.5, 2.1, white, 1.7, 2.3)                                       # Handschuh
        if pose != 'closed':
            dx, dy = c[0] - b[0], c[1] - b[1]; L = math.hypot(dx, dy) or 1
            for k in (-1, 0, 1): chain((hx, hy), (hx + dx / L * 3.4 - dy / L * k * 1.4, hy + dy / L * 3.4 + dx / L * k * 1.4), ya - 0.6, 0.75, 0.5, white, 5)   # Finger
    # ---- Kopf ----
    hy = 17.0
    S(cx, 25.2, 0, 2.5, skinS, 2.3, 2.6)                                                # Hals
    S(cx, hy - 0.6, 0, 5.0, skin, 5.2, 6.2)                                             # Schädel
    S(cx, hy + 3.2, -0.6, 3.9, skin, 4.4, 4.4)                                          # Wangen/Kiefer
    S(cx, hy + 6.6, -1.4, 1.9, skin, 2.4, 2.1)                                          # spitzes Kinn
    for s in (-1, 1):
        S(cx + s * 3.9, hy + 2.6, -3.2, 1.3, skinS, 1.0, 2.4, (0, math.radians(-s * 18), 0))    # Wangenschatten
        add('k', cx + s * 5.6, hy - 1.2, 0.5, 1.3, 0.8, 2.8, skin, (0, math.radians(s * 30), 0))  # spitze Ohren
        S(cx + s * 2.2, hy - 0.2, -4.7, 1.35, M('#fc2c20', 0.3, 0, 3.0), 0.6, 0.48, (0, math.radians(-s * 14), 0))   # glühende Augen
        S(cx + s * 2.1, hy - 0.2, -5.0, 0.42, M('#fff0d0', 0.3, 0, 4.0), 0.3, 0.36)
        S(cx + s * 2.4, hy - 1.5, -4.9, 1.9, hair, 0.6, 0.42, (0, math.radians(s * 24), 0))   # strenge Brauen
        S(cx + s * 2.0, hy + 0.9, -4.3, 1.9, skinS, 0.8, 0.5)                             # Augenringe
        add('k', cx + s * 1.0, hy + 5.2, -4.7, 0.36, 0.3, 0.85, white, (math.radians(180), 0, 0))   # Fangzähne
    S(cx, hy + 1.8, -5.3, 0.85, skin, 1.2, 2.0); S(cx, hy + 2.9, -5.6, 1.1, skin, 0.9, 0.7)   # Nase
    S(cx, hy + 4.5, -4.6, 1.9, M('#5c1024', 0.5), 0.6, 0.42)                                 # Mund
    S(cx, hy - 3.6, 0.9, 5.3, hair, 5.4, 4.3); S(cx, hy - 1.0, 2.6, 5.3, hair, 4.2, 6.2)       # zurückgekämmtes Haar
    add('k', cx, hy - 3.0, -4.3, 2.2, 1.2, 2.6, hair, (math.radians(180 - 22), 0, 0))          # Witwenspitze
    for s in (-1, 1): S(cx + s * 4.4, hy - 1.6, -1.2, 1.1, hair, 2.2, 3.2)                     # Schläfen

def run():
    reset(); setup(); meshes()
    out = CFG['out']; os.makedirs(out, exist_ok=True)
    for pose in CFG.get('poses', ['closed', 'open', 'cast']):
        clear(); count(pose)
        bpy.context.scene.render.filepath = os.path.join(out, 'count_' + pose + '.png'); bpy.ops.render.render(write_still=True)
    if not CFG.get('keep'): clear()
    print('Graf gerendert')
run()
