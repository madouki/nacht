# Die Klötzchenburg (js/burg.js) in Blender: sechs Räume als Spielzeug-Dioramen (26×13 Kacheln, gleiche Schrägsicht wie die
# Grafschaft: Kippwinkel 32°, Boden in Nord-Süd-Richtung um 1/cos gestreckt → 16 px je Kachel, eine Höheneinheit hebt um 8,5 px)
# und alle beweglichen Dinge einzeln mit durchsichtigem Grund: Bauklötze, Knöpfe, Pflöcke, Klopfbank-Schalter, Truhen,
# Aufziehschlüssel, Schlüsselklotz, goldenes Schloss, Gitter, Zinnsoldat (drei Ansichten, zwei Schritte, umgefallen), Kreisel,
# Kommandant Knacks (Nussknacker) und die Spieluhr-Drehscheibe. Alles glänzt wie lackiertes Holz und Kunststoff.
# Aufruf: python bl.py burg_bl.py '{"rooms": ".../burg_rooms.json", "out": ".../r_burg", "ss": 2, "sso": 4}'; danach pack_burg.py
import bpy, bmesh, math, random, json, os
from mathutils import Vector, Matrix

TILT = math.radians(32); K = 1 / math.cos(TILT)
OUT = CFG['out']; SS = CFG.get('ss', 2); SSO = CFG.get('sso', 4)
DATA = json.load(open(CFG['rooms'], encoding='utf-8'))['rooms']
ONLY = CFG.get('only')   # z. B. ["r0", "block0"] zum Probieren
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
MATS = {}
def M(hexc, rough=0.32, coat=0.6, metal=0.0, emit=0.0):
    k = (hexc, rough, coat, metal, emit)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new('m'); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = lin(hexc) + [1]; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    for nm, v in (('Coat Weight', coat), ('Coat Roughness', 0.12), ('Specular IOR Level', 0.45)):
        try: b.inputs[nm].default_value = v
        except KeyError: pass
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexc) + [1]; b.inputs['Emission Strength'].default_value = emit
    MATS[k] = m; return m
def reset():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.curves):
        for b in list(coll): coll.remove(b)
    MATS.clear()
def W(x, y, z=0.0): return Vector((x, -y * K, z))   # Kachelkoordinaten (y nach Süden) → Welt
def link(o): sc.collection.objects.link(o); return o
def mk(bm, mat, smooth=False):
    me = bpy.data.meshes.new('m'); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    me.materials.append(mat); return link(bpy.data.objects.new('o', me))
def rbox(x0, y0, x1, y1, z0, z1, col, bev=0.06, smooth=False, **kw):   # Klotz mit runden Kanten
    bm = bmesh.new(); a, b = W(x0, y1, z0), W(x1, y0, z1); c = (a + b) / 2; s = b - a
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((s.x, s.y, s.z, 1)))
    if bev > 0: bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bev, s.x / 2.2, s.y / 2.2, s.z / 2.2), segments=2, profile=0.5, affect='EDGES')
    return mk(bm, M(col, **kw), smooth)
def cyl(cx, cy, r, z0, z1, col, seg=28, r2=None, smooth=True, **kw):
    bm = bmesh.new(); h = max(1e-3, z1 - z0)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h, matrix=Matrix.Translation(W(cx, cy, z0 + h / 2)))
    return mk(bm, M(col, **kw), smooth)
def ball(cx, cy, z, r, col, sz=1.0, **kw):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=r, matrix=Matrix.Translation(W(cx, cy, z)) @ Matrix.Diagonal((1, 1, sz, 1)))
    return mk(bm, M(col, **kw), True)
def tube(a, b, r, col, seg=12, **kw):   # a, b in Welt
    d = b - a; L = d.length
    if L < 1e-6: return
    bm = bmesh.new(); q = d.to_track_quat('Z', 'Y')
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=L, matrix=Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    return mk(bm, M(col, **kw), True)
def prism_y(x0, x1, y0, y1, z0, z1, col, **kw):   # Dreiecksklotz (Giebel), First in x-Richtung
    bm = bmesh.new()
    a = [bm.verts.new(W(x, y, z0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]; r = [bm.verts.new(W(x, (y0 + y1) / 2, z1)) for x in (x0, x1)]
    for f in ((a[0], a[1], r[1], r[0]), (a[2], a[3], r[0], r[1]), (a[1], a[2], r[1]), (a[3], a[0], r[0]), (a[3], a[2], a[1], a[0])): bm.faces.new(f)
    return mk(bm, M(col, **kw))
def text(s, x, y, z, size, col, face='s', **kw):
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.size = size; cu.extrude = 0.015; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new('t', cu); cu.materials.append(M(col, **kw)); link(o); o.location = W(x, y, z)
    o.rotation_euler = (math.radians(90), 0, 0) if face == 's' else (0, 0, 0)
    return o
def star(cx, cy, z, r, col, face='s', d=0.03, **kw):   # fünfzackiger Stern als flache Platte
    bm = bmesh.new(); pts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * 0.45; pts.append((math.cos(a) * rr, math.sin(a) * rr))
    if face == 's': vs = [bm.verts.new(W(cx + px, cy, z + py)) for px, py in pts]
    else: vs = [bm.verts.new(W(cx + px, cy - py / K, z)) for px, py in pts]
    f = bm.faces.new(vs); ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    off = Vector((0, d, 0)) if face == 's' else Vector((0, 0, -d))
    bmesh.ops.translate(bm, vec=off, verts=[v for v in ex['geom'] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mk(bm, M(col, **kw))
def group_rot(objs, ang, cx, cy, axis='Z', cz=0.0):   # Dinge gemeinsam drehen (um eine senkrechte oder waagrechte Achse durch cx/cy)
    bpy.context.view_layer.update(); p = W(cx, cy, cz)
    R = Matrix.Translation(p) @ Matrix.Rotation(ang, 4, axis) @ Matrix.Translation(-p)
    for o in objs: o.matrix_world = R @ o.matrix_world
def since(n): return list(sc.collection.objects)[n:]
def group_scale(objs, s, cx, cy):
    bpy.context.view_layer.update(); p = W(cx, cy, 0)
    S = Matrix.Translation(p) @ Matrix.Diagonal((s, s, s, 1)) @ Matrix.Translation(-p)
    for o in objs: o.matrix_world = S @ o.matrix_world

# ---------------- Licht, Kamera, Bild ----------------
def sun(az, el, hexc, power, ang=4.0):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = power; l.color = lin(hexc); l.angle = math.radians(ang)
    o = bpy.data.objects.new('sun', l); d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), -math.sin(el)))
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); link(o)
def setup(u0, v0, w, h, ss, transparent, room=False):
    sun(math.radians(55), math.radians(52), '#fff0dc', 3.4)
    sun(math.radians(200), math.radians(30), '#a8b8ff', 0.9)
    wd = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); sc.world = wd; wd.use_nodes = True
    bg = next(n for n in wd.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs['Color'].default_value = lin('#6c6490') + [1]; bg.inputs['Strength'].default_value = 1.0
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = max(w, h) / 16; cam.clip_end = 400
    co = bpy.data.objects.new('c', cam); co.rotation_euler = (TILT, 0, 0)
    tgt = W((u0 + w / 2) / 16, (v0 + h / 2) / 16, 0)
    co.location = tgt + 80 * Vector((0, -math.sin(TILT), math.cos(TILT))); link(co); sc.camera = co
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: sc.render.engine = eng; break
        except TypeError: pass
    try: sc.eevee.taa_render_samples = 40 if room else 24
    except Exception: pass
    for k, v in (('use_shadows', True), ('use_gtao', True), ('use_raytracing', True), ('shadow_ray_count', 2), ('shadow_step_count', 8)):
        try: setattr(sc.eevee, k, v)
        except Exception: pass
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w * ss, h * ss, 100
    sc.render.film_transparent = transparent; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
def shot(name):
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)

# ---------------- Räume ----------------
TOYS = ['#e8453c', '#f6c33b', '#3d7fe0', '#4cb35a', '#f08a2c', '#9b5bd6', '#e85c9c', '#3cc0c8']
STYLE = {   # Boden, Wandfarben (Reihenfolge), Stapel
    'r0': ('parkett', [0, 1, 2, 3], 'turm'), 'r1': ('feld', [2, 7, 1, 0], 'zaun'), 'r2': ('parkett', [0, 2, 1, 4], 'trommel'),
    'r3': ('karo', [5, 1, 7, 2], 'mauer'), 'r4': ('dunkel', [3, 6, 1, 2], 'turm'), 'r5': ('gold', [5, 1, 6, 0], 'ringe'), 'r6': ('brett', [0, 2, 1, 3], 'turm')}
LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
def room(key):
    rows = DATA[key]['rows']; doors = DATA[key]['doors']; fl, order, stack = STYLE[key]; rng = random.Random(hash(key) % 1000)
    pal = [TOYS[i] for i in order]
    H, Wd = len(rows), len(rows[0])
    c = lambda x, y: rows[y][x] if 0 <= x < Wd and 0 <= y < H else '#'
    rbox(-1, -2, Wd + 1, H + 1, -0.3, 0.0, '#3c2c4c', 0)                     # Grundplatte
    rbox(-1, -2.4, Wd + 1, 0.0, 0.0, 0.05, '#20142c', 0)                     # dunkel hinter der Nordwand (Türnischen)
    # Boden
    inner = lambda x, y: c(x, y) not in '#o'
    if fl in ('parkett', 'gold', 'feld', 'dunkel'):
        woods = {'gold': ['#e8c070', '#d8ac58', '#f0cc80', '#c89c48'], 'dunkel': ['#9c8ca8', '#8c7c9c', '#a898b4', '#7c6c8c']}.get(fl, ['#d8a868', '#c89458', '#e4b878', '#b88448'])
        for y in range(H):
            for half in (0, 0.5):
                x = -rng.random() * 2
                while x < Wd:
                    L = rng.uniform(1.4, 3.0); x0, x1 = max(0, x), min(Wd, x + L)
                    if x1 - x0 > 0.1: rbox(x0 + 0.02, y + half + 0.02, x1 - 0.02, y + half + 0.48, 0.0, 0.04, rng.choice(woods), 0.015, rough=0.4, coat=0.4)
                    x += L
        if fl == 'feld':   # Rätselfeld: Schaumstoffmatte mit sichtbaren Kacheln, nur hier rutschen die Klötze
            for y in range(H):
                for x in range(Wd):
                    if c(x, y) in '.B_': rbox(x + 0.03, y + 0.03, x + 0.97, y + 0.97, 0.0, 0.07, ['#9ad08c', '#f2e08c'][(x + y) % 2], 0.04, rough=0.55, coat=0.15)
    elif fl == 'matte':
        mat = ['#f25c54', '#f7c548', '#4c9be8', '#5cc46a', '#f39a3c', '#a56be0']
        for y in range(0, H, 2):
            for x in range(0, Wd, 2):
                rbox(x + 0.04, y + 0.04, x + 1.96, min(H, y + 2) - 0.04, 0.0, 0.07, mat[(x // 2 + (y // 2) * 2) % len(mat)], 0.04, rough=0.55, coat=0.15)
                for k in range(2):   # Puzzlenasen an den Kanten
                    cyl(x + 1.0, y + 0.04 + k * 1.92, 0.16, 0.0, 0.071, mat[(x // 2 + (y // 2) * 2 + 1) % len(mat)], 16, rough=0.55, coat=0.15)
    elif fl == 'brett':   # Paradeplatz: großes Spielbrett, Läufer von Tür zu Tür
        for y in range(H):
            for x in range(Wd):
                rbox(x + 0.01, y + 0.01, x + 0.99, y + 0.99, 0.0, 0.04, '#a83c4c' if ((x // 2) + (y // 2)) % 2 else '#f0e2c4', 0.02, rough=0.3, coat=0.7)
        rbox(12.05, 0.6, 13.95, 12.4, 0.04, 0.075, '#2c4cb8', 0.02, rough=0.8, coat=0); rbox(12.2, 0.6, 13.8, 12.4, 0.075, 0.08, '#3c64d8', 0.01, rough=0.8, coat=0)
        for y in range(1, 12, 2): star(13, y + 0.5, 0.085, 0.22, '#f8d048', face='top', d=0.01)
    else:
        for y in range(H):
            for x in range(Wd):
                rbox(x + 0.01, y + 0.01, x + 0.99, y + 0.99, 0.0, 0.04, '#cdbb98' if (x + y) % 2 else '#ece2cc', 0.02, rough=0.3, coat=0.7)
    if key == 'r0':   # runder Teppich mit Sternen, Läufer zur Nordtür
        cyl(13, 6.5, 4.0, 0.04, 0.08, '#b83c4c', 48, rough=0.8, coat=0); cyl(13, 6.5, 3.6, 0.08, 0.085, '#f2c86c', 48, rough=0.8, coat=0); cyl(13, 6.5, 3.4, 0.085, 0.09, '#b83c4c', 48, rough=0.8, coat=0)
        for i in range(8): a = i * math.pi / 4; star(13 + math.cos(a) * 2.5, 6.5 + math.sin(a) * 2.5 / K, 0.095, 0.3, '#f2c86c', face='top', d=0.01)
        rbox(12.1, 0.5, 13.9, 2.5, 0.04, 0.07, '#7c2c4c', 0.02, rough=0.8, coat=0)
    if key == 'r5':
        for (sx, sy) in ((13, 5.6), (13, 10.6)): cyl(sx, sy, 2.2, 0.04, 0.08, '#6c3cb8', 40, rough=0.8, coat=0); star(sx, sy, 0.085, 1.5, '#f8d048', face='top', d=0.01, metal=0.6)
    # Bällebad
    pit = [(x, y) for y in range(H) for x in range(Wd) if c(x, y) == '~']
    if pit:
        xs = [p[0] for p in pit]; ys = [p[1] for p in pit]; X0, X1, Y0, Y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
        rbox(X0, Y0, X1, Y1, -0.05, 0.05, '#24183c', 0)
        for (a, b2, d1, d2) in ((X0 - 0.25, Y0 - 0.25, X1 + 0.25, Y0), (X0 - 0.25, Y1, X1 + 0.25, Y1 + 0.25), (X0 - 0.25, Y0, X0, Y1), (X1, Y0, X1 + 0.25, Y1)):
            rbox(a, b2, d1, d2, 0.0, 0.32, '#f2f0f8', 0.08, True, rough=0.25, coat=0.8)
        cols = ['#f04848', '#3c8ce8', '#f8d040', '#48c058', '#f8f8f8', '#b860e8', '#f08830']
        for (x, y) in pit:
            for k in range(9): ball(x + rng.uniform(0.1, 0.9), y + rng.uniform(0.1, 0.9), rng.uniform(0.08, 0.22), 0.16, rng.choice(cols), rough=0.2, coat=0.9)
    # Wände: Nordwand zwei Lagen mit Buchstaben, Seiten eine Lage, Südwand flach
    for y in range(H):
        for x in range(Wd):
            if c(x, y) != '#': continue
            k = (x + y) % 4
            if y == 0:
                rbox(x + 0.02, y + 0.02, x + 0.98, y + 0.98, 0.0, 0.74, pal[k], 0.06, rough=0.3, coat=0.7)
                rbox(x + 0.06, y + 0.06, x + 0.94, y + 0.94, 0.74, 1.46, pal[(k + 2) % 4], 0.06, rough=0.3, coat=0.7)
                if 0 < x < Wd - 1 and x % 2 == 0: text(LET[(x // 2 + hash(key)) % 26], x + 0.5, y + 1.0, 0.36, 0.5, '#fffaf0', rough=0.3, coat=0.5)
                elif 0 < x < Wd - 1: star(x + 0.5, y + 0.95, 1.08, 0.2, '#fffaf0', rough=0.3, coat=0.5)
            elif y == H - 1:
                rbox(x + 0.02, y + 0.1, x + 0.98, y + 0.98, 0.0, 0.42, pal[k], 0.06, rough=0.3, coat=0.7)
            else:
                rbox(x + 0.04, y + 0.02, x + 0.96, y + 0.98, 0.0, 0.92, pal[k], 0.06, rough=0.3, coat=0.7)
    for x in (0, Wd - 1):   # Ecktürme mit Kegeldach und Wimpel
        cyl(x + 0.5, 0.5, 0.52, 0.0, 1.5, pal[1], 32, rough=0.3, coat=0.7); cyl(x + 0.5, 0.5, 0.6, 1.5, 1.95, pal[0], 32, 0.0, rough=0.3, coat=0.7)
        tube(W(x + 0.5, 0.5, 1.9), W(x + 0.5, 0.5, 2.2), 0.025, '#d8d0c0'); prism_y(x + 0.52, x + 0.9, 0.47, 0.53, 2.04, 2.2, pal[2])
    # Wimpelkette über der Nordwand
    for x in range(1, Wd - 1):
        if c(x, 0) != '#' or c(x + 1, 0) != '#': continue
        tri = [bmesh.new()]
        bm = tri[0]; a, b2, t2 = W(x + 0.1, 0.55, 1.74), W(x + 0.9, 0.55, 1.74), W(x + 0.5, 0.55, 1.5)
        bm.faces.new([bm.verts.new(a), bm.verts.new(b2), bm.verts.new(t2)]); mk(bm, M(TOYS[(x * 3) % len(TOYS)], rough=0.5, coat=0.2))
        if x % 3 == 0: cyl(x + 0.05, 0.55, 0.035, 1.46, 1.8, '#f2e6c8', 10)
    tube(W(1, 0.55, 1.76), W(Wd - 1, 0.55, 1.76), 0.012, '#f2e6c8', 6)
    # Stapel
    for y in range(H):
        for x in range(Wd):
            if c(x, y) != 'o': continue
            r2 = random.Random(x * 31 + y * 17 + len(key))
            if stack == 'zaun':
                rbox(x + 0.06, y + 0.12, x + 0.94, y + 0.88, 0.0, 0.55, '#f4efe4', 0.07, rough=0.3, coat=0.7)
                ball(x + 0.5, y + 0.5, 0.66, 0.14, TOYS[(x + y) % len(TOYS)])
            elif stack == 'mauer':
                rbox(x + 0.03, y + 0.05, x + 0.97, y + 0.95, 0.0, 0.5, pal[(x + y) % 4], 0.06, rough=0.3, coat=0.7)
                rbox(x + 0.1, y + 0.12, x + 0.9, y + 0.88, 0.5, 0.92, pal[(x + y + 2) % 4], 0.06, rough=0.3, coat=0.7)
            elif stack == 'trommel':
                cyl(x + 0.5, y + 0.5, 0.42, 0.0, 0.62, '#e8453c', 32); cyl(x + 0.5, y + 0.5, 0.45, 0.0, 0.08, '#f2f0e8', 32); cyl(x + 0.5, y + 0.5, 0.45, 0.54, 0.62, '#f2f0e8', 32)
                cyl(x + 0.5, y + 0.5, 0.4, 0.62, 0.64, '#f8f4ea', 32, rough=0.6, coat=0.1)
                for s in (-1, 1): tube(W(x + 0.5 - 0.3 * s, y + 0.3, 0.7), W(x + 0.5 + 0.25 * s, y + 0.7, 0.66), 0.03, '#c8945c')
            elif stack == 'ringe':
                cyl(x + 0.5, y + 0.5, 0.36, 0.0, 0.12, '#c8945c', 28)
                for i in range(4): cyl(x + 0.5, y + 0.5, 0.36 - i * 0.06, 0.12 + i * 0.17, 0.27 + i * 0.17, TOYS[i], 28, smooth=True)
                ball(x + 0.5, y + 0.5, 0.95, 0.12, '#f6c33b')
            else:   # Turm aus Klötzen mit Kugel
                rbox(x + 0.07, y + 0.07, x + 0.93, y + 0.93, 0.0, 0.6, pal[r2.randrange(4)], 0.07, rough=0.3, coat=0.7)
                n0 = len(sc.collection.objects); rbox(x + 0.17, y + 0.17, x + 0.83, y + 0.83, 0.6, 1.1, pal[r2.randrange(4)], 0.07, rough=0.3, coat=0.7)
                group_rot(since(n0), math.radians(r2.uniform(15, 35)), x + 0.5, y + 0.5)
                ball(x + 0.5, y + 0.5, 1.28, 0.2, pal[r2.randrange(4)])
    # Türen: Nische im Norden mit Torbogen, Säulchen an den anderen, Fußmatten
    if 'n' in doors:
        rbox(12.0, -1.0, 14.0, 0.98, 0.0, 1.32, '#140c1c', 0)
        for x in (11.9, 14.1): cyl(x, 0.85, 0.16, 0.0, 1.5, pal[3], 24)
        rbox(11.7, 0.66, 14.3, 1.02, 1.3, 1.6, pal[0], 0.06, rough=0.3, coat=0.7); prism_y(11.9, 14.1, 0.7, 1.0, 1.6, 2.05, pal[1], rough=0.3, coat=0.7)
        star(13, 1.03, 1.78, 0.14, '#fffaf0')
        rbox(12.15, 0.2, 13.85, 1.0, 0.04, 0.07, '#5c3c8c', 0.02, rough=0.8, coat=0)
    if 's' in doors:
        for x in (11.85, 14.15): cyl(x, 12.5, 0.15, 0.0, 0.7, pal[3], 20); ball(x, 12.5, 0.78, 0.16, pal[1])
        rbox(12.15, 12.05, 13.85, 12.95, 0.04, 0.07, '#5c3c8c', 0.02, rough=0.8, coat=0)
    for side, x in (('w', 0), ('e', Wd - 1)):
        if side not in doors: continue
        for y in (4.92, 8.08): cyl(x + 0.5, y, 0.15, 0.0, 1.1, pal[3], 20); ball(x + 0.5, y, 1.18, 0.16, pal[1])
        rbox(x + 0.1, 5.1, x + 0.9, 7.9, 0.04, 0.07, '#5c3c8c', 0.02, rough=0.8, coat=0)
    setup(0, -20, Wd * 16, H * 16 + 20, SS, False, True)
    shot('room_' + key)

# ---------------- Dinge ----------------
def ell(cx, cy, z, rx, ry, rz, col, **kw):   # Ellipsoid mit drei Halbachsen
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=1.0, matrix=Matrix.Translation(W(cx, cy, z)) @ Matrix.Diagonal((rx, ry, rz, 1)))
    return mk(bm, M(col, **kw), True)
def marshal(view, fr, pose=''):   # Feldmarschall Federkern: riesiger Zinngeneral auf grünem Sockel, Zweispitz, Monokel, Schnauzbart, Korkenflinte, Aufziehschlüssel
    n0 = len(sc.collection.objects); cx, cy = 1.0, 1.2; bob = 0.04 if fr else 0.0; st = 0.09 if fr else -0.09
    BLUE, GOLD, RED, SKIN, BLK = '#2c4cb8', '#f2c040', '#d8342c', '#f2c8a0', '#1c1c24'
    cyl(cx, cy, 0.62, 0.0, 0.1, '#3c8c48', 36)
    for sd in (-1, 1):
        ly = cy + st * sd
        cyl(cx + sd * 0.16, ly, 0.13, 0.1, 0.86 + bob, '#24306c', 16); cyl(cx + sd * 0.16, ly, 0.135, 0.4, 0.46, RED, 16); cyl(cx + sd * 0.16, ly, 0.155, 0.1, 0.32, BLK, 16)
    rbox(cx - 0.37, cy - 0.27, cx + 0.37, cy + 0.27, 0.82 + bob, 1.66 + bob, BLUE, 0.1, True)
    rbox(cx - 0.38, cy - 0.28, cx + 0.38, cy + 0.28, 0.9 + bob, 0.99 + bob, BLK, 0.03); rbox(cx - 0.07, cy + 0.27, cx + 0.07, cy + 0.3, 0.9 + bob, 1.0 + bob, GOLD, 0.01, metal=0.6)
    for k in range(3):
        for sd in (-1, 1): ball(cx + sd * 0.13, cy + 0.28, 1.12 + k * 0.16 + bob, 0.035, GOLD, metal=0.6)
    tube(W(cx - 0.3, cy + 0.28, 1.6 + bob), W(cx + 0.3, cy + 0.28, 1.02 + bob), 0.045, RED)
    for sd in (-1, 1):
        ell(cx + sd * 0.4, cy, 1.64 + bob, 0.17, 0.15, 0.06, GOLD, metal=0.6)
        for k in range(4): cyl(cx + sd * (0.3 + k * 0.06), cy + 0.12, 0.015, 1.5 + bob, 1.6 + bob, GOLD, 6, metal=0.6)
    if pose == 'aim':   # Korkenflinte nach vorn
        cyl(cx + 0.44, cy + 0.05, 0.09, 1.2 + bob, 1.6 + bob, BLUE, 12); cyl(cx - 0.44, cy + 0.05, 0.09, 1.1 + bob, 1.6 + bob, BLUE, 12)
        tube(W(cx + 0.3, cy - 0.05, 1.22), W(cx + 0.3, cy + 0.95, 1.2), 0.06, '#c8a040', metal=0.7); cyl(cx + 0.3, cy + 0.98, 0.11, 1.12, 1.28, '#c8a040', 16, r2=0.06, metal=0.7)
        rbox(cx + 0.22, cy - 0.3, cx + 0.38, cy + 0.05, 1.1, 1.26, '#8c5c2c', 0.03); ball(cx + 0.3, cy + 1.04, 1.2, 0.07, '#a8743c')
    else:
        for sd in (-1, 1): cyl(cx + sd * 0.45, cy + 0.02, 0.09, 1.0 + bob, 1.6 + bob, BLUE, 12); ball(cx + sd * 0.45, cy + 0.02, 0.98 + bob, 0.09, '#f4f0e6')
        tube(W(cx + 0.55, cy - 0.02, 0.9 + bob), W(cx + 0.55, cy - 0.02, 2.05 + bob), 0.05, '#c8a040', metal=0.7); cyl(cx + 0.55, cy - 0.02, 0.08, 2.0 + bob, 2.12 + bob, '#c8a040', 12, r2=0.05, metal=0.7)
    ball(cx, cy, 1.94 + bob, 0.28, SKIN)
    for sd in (-1, 1):
        ball(cx + sd * 0.1, cy + 0.24, 1.99 + bob, 0.035, BLK); ball(cx + sd * 0.15, cy + 0.2, 1.88 + bob, 0.05, '#f08080')
        curve_pts = [(cx + sd * 0.02, cy + 0.27, 1.84), (cx + sd * 0.16, cy + 0.28, 1.83), (cx + sd * 0.27, cy + 0.24, 1.9), (cx + sd * 0.3, cy + 0.2, 1.97)]
        for (ax, ay, az), (bx2, by2, bz) in zip(curve_pts, curve_pts[1:]): tube(W(ax, ay, az + bob), W(bx2, by2, bz + bob), 0.04, BLK)
    ball(cx, cy + 0.28, 1.9 + bob, 0.055, '#e8a088')
    cyl(cx + 0.1, cy + 0.27, 0.07, 1.98 + bob, 1.981 + bob, '#d8f0ff', 20, rough=0.05, coat=1.0); tube(W(cx + 0.17, cy + 0.28, 1.98 + bob), W(cx + 0.24, cy + 0.26, 1.7 + bob), 0.008, GOLD, metal=0.7)
    hat0 = len(sc.collection.objects)
    rbox(cx - 0.44, cy - 0.13, cx + 0.44, cy + 0.13, 2.12 + bob, 2.36 + bob, BLK, 0.1, True); rbox(cx - 0.45, cy + 0.11, cx + 0.45, cy + 0.14, 2.14 + bob, 2.2 + bob, GOLD, 0.01, metal=0.6)
    for k, c in enumerate(('#3d7fe0', '#fcfcfc', RED)): cyl(cx, cy + 0.14 + k * 0.004, 0.09 - k * 0.025, 2.24 + bob, 2.245 + bob, c, 20)
    ell(cx - 0.2, cy, 2.48 + bob, 0.09, 0.08, 0.16, RED)
    if pose == 'dizzy': group_rot(since(hat0), 0.35, cx, cy, 'Y', 2.1)
    tube(W(cx, cy - 0.26, 1.35 + bob), W(cx, cy - 0.6, 1.35 + bob), 0.06, GOLD, metal=0.7)   # Aufziehschlüssel im Rücken (Schwachpunkt)
    for sd in (-1, 1): ell(cx + sd * 0.26, cy - 0.64, 1.38 + bob, 0.25, 0.06, 0.2, GOLD, metal=0.7)
    objs = since(n0)
    group_scale(objs, 1.45, cx, cy)
    if view == 'u': group_rot(objs, math.pi, cx, cy)
    elif view == 's': group_rot(objs, math.pi / 2, cx, cy)
    if pose == 'dizzy': group_rot(objs, 0.16, cx, cy, 'Y', 0.0)
    if pose == 'fall': group_rot(objs, math.pi / 2, cx + 0.35, cy, 'Y', 0.0)   # zur Seite umgekippt
def keyshape(cx, cy, z, s, col, metal):   # Aufziehschlüssel: Schmetterlingsgriff, Schaft, Bart
    for sx in (-1, 1): ball(cx + sx * 0.17 * s, cy, z + 0.03 * s, 0.15 * s, col, 1.0, rough=0.2, coat=0.5, metal=metal)
    tube(W(cx, cy, z), W(cx, cy, z - 0.38 * s), 0.045 * s, col, rough=0.2, metal=metal)
    rbox(cx - 0.06 * s, cy - 0.04 * s, cx + 0.06 * s, cy + 0.04 * s, z - 0.4 * s, z - 0.28 * s, col, 0.01, rough=0.2, metal=metal)
def soldier(view, fr, fallen=False):
    n0 = len(sc.collection.objects); cx, cy = 0.5, 0.62; bob = 0.03 if fr else 0.0; leg = 0.07 if fr else -0.07
    cyl(cx, cy, 0.26, 0.0, 0.06, '#3c8c48', 28)                                                    # grüner Sockel
    for s in (-1, 1):   # Beine, Stiefel
        lx, ly = cx + s * 0.08, cy + (leg * s if view != 's' else 0); lx2 = lx + (leg * s if view == 's' else 0)
        cyl(lx2, ly, 0.065, 0.06, 0.38 + bob, '#2c3c8c', 14); cyl(lx2, ly, 0.075, 0.06, 0.14, '#1c1c24', 14)
    rbox(cx - 0.17, cy - 0.12, cx + 0.17, cy + 0.12, 0.36 + bob, 0.74 + bob, '#d8342c', 0.06, True)  # Rock
    for s in (-1, 1): tube(W(cx - 0.15 * s, cy + 0.125, 0.72 + bob), W(cx + 0.15 * s, cy + 0.125, 0.4 + bob), 0.02, '#f8f4ea')  # Kreuzgurte
    for s in (-1, 1): ball(cx + s * 0.2, cy, 0.7 + bob, 0.075, '#f2c040', metal=0.6)                 # Schulterstücke
    cyl(cx + 0.23, cy + 0.02, 0.055, 0.42 + bob, 0.7 + bob, '#d8342c', 12); cyl(cx - 0.23, cy + 0.02, 0.055, 0.42 + bob, 0.7 + bob, '#d8342c', 12)
    tube(W(cx + 0.27, cy - 0.02, 0.35 + bob), W(cx + 0.27, cy - 0.02, 1.15 + bob), 0.022, '#8c8c98', metal=0.6)  # Gewehr
    ball(cx, cy, 0.86 + bob, 0.135, '#f2c8a0')                                                     # Kopf
    for s in (-1, 1): ball(cx + s * 0.07, cy + 0.12, 0.84 + bob, 0.03, '#f07878'); ball(cx + s * 0.045, cy + 0.125, 0.89 + bob, 0.018, '#1c1c24')
    cyl(cx, cy, 0.125, 0.94 + bob, 1.22 + bob, '#1c1c24', 20); cyl(cx, cy, 0.13, 0.94 + bob, 0.98 + bob, '#f2c040', 20, metal=0.6)
    rbox(cx - 0.06, cy + 0.11, cx + 0.06, cy + 0.14, 1.04 + bob, 1.14 + bob, '#f2c040', 0.01, metal=0.6); ball(cx, cy, 1.27 + bob, 0.06, '#e8453c')
    keyshape(cx, cy - 0.17, 0.66 + bob, 0.8, '#f2c040', 0.6)                                       # Aufziehschlüssel im Rücken
    objs = since(n0)
    if view == 'u': group_rot(objs, math.pi, cx, cy)
    elif view == 's': group_rot(objs, math.pi / 2, cx, cy)
    if fallen: group_rot(objs, math.pi / 2, cx, cy, 'Y', 0.0); group_rot(objs, 0, cx, cy)
def kreisel(fr):
    cx, cy = 0.5, 0.5
    cyl(cx, cy, 0.3, 0.04, 0.24, '#e8453c', 32, r2=0.33); cyl(cx, cy, 0.0001, 0.0, 0.04, '#8c6c4c', 16, r2=0.3)
    cyl(cx, cy, 0.33, 0.24, 0.3, '#f6c33b', 32); cyl(cx, cy, 0.33, 0.3, 0.42, '#3d7fe0', 32, r2=0.08)
    tube(W(cx, cy, 0.4), W(cx, cy, 0.62), 0.035, '#c8945c'); ball(cx, cy, 0.64, 0.05, '#c8945c')
    for i in range(4): a = fr * math.pi / 8 + i * math.pi / 2; ball(cx + math.cos(a) * 0.33, cy + math.sin(a) * 0.33 / K, 0.27, 0.05, '#fcfcfc')
def npc(fr):   # Kommandant Knacks, ein Nussknacker
    cx, cy = 0.5, 0.55; n0 = len(sc.collection.objects)
    cyl(cx, cy, 0.3, 0.0, 0.07, '#2c6c3c', 28)
    for s in (-1, 1): cyl(cx + s * 0.1, cy, 0.08, 0.08, 0.6, '#f4f0e6', 14); cyl(cx + s * 0.1, cy, 0.095, 0.08, 0.26, '#1c1c24', 14)
    rbox(cx - 0.22, cy - 0.14, cx + 0.22, cy + 0.14, 0.58, 1.12, '#c82c34', 0.07, True)
    rbox(cx - 0.23, cy - 0.15, cx + 0.23, cy + 0.15, 0.58, 0.66, '#1c1c24', 0.02); rbox(cx - 0.05, cy + 0.13, cx + 0.05, cy + 0.16, 0.6, 0.64, '#f2c040', 0.01, metal=0.6)
    for k in range(3): ball(cx, cy + 0.15, 0.76 + k * 0.11, 0.03, '#f2c040', metal=0.6)
    for s in (-1, 1): ball(cx + s * 0.25, cy, 1.08, 0.1, '#f2c040', 0.7, metal=0.6); cyl(cx + s * 0.27, cy + 0.02, 0.07, 0.72, 1.06, '#c82c34', 12)
    tube(W(cx - 0.32, cy + 0.05, 0.7), W(cx - 0.36, cy + 0.08, 1.45), 0.02, '#d8dce8', metal=0.8)    # Säbel
    rbox(cx - 0.2, cy - 0.17, cx + 0.2, cy + 0.17, 1.12, 1.56, '#f2c8a0', 0.08, True)                 # Kopf
    jaw = 0.07 if fr else 0.0
    rbox(cx - 0.14, cy + 0.12, cx + 0.14, cy + 0.19, 1.14 - jaw, 1.28 - jaw, '#f2c8a0', 0.03, True)    # Unterkiefer
    if fr: rbox(cx - 0.12, cy + 0.15, cx + 0.12, cy + 0.17, 1.24 - jaw, 1.3, '#3c0c14', 0.01)
    for s in (-1, 1):
        ball(cx + s * 0.07, cy + 0.17, 1.44, 0.035, '#fcfcfc'); ball(cx + s * 0.07, cy + 0.19, 1.44, 0.018, '#1c1c24')
        ball(cx + s * 0.06, cy + 0.19, 1.32, 0.07, '#fcfcfc', 0.6); ball(cx + s * 0.13, cy + 0.16, 1.37, 0.03, '#f07878')
    for k in range(5): ball(cx - 0.16 + k * 0.08, cy + 0.17, 1.12 - jaw - 0.03 * (k % 2), 0.06, '#fcfcfc')   # Bart
    ball(cx, cy + 0.2, 1.38, 0.04, '#e8a088')
    cyl(cx, cy, 0.19, 1.56, 1.95, '#1c1c24', 24); cyl(cx, cy, 0.2, 1.56, 1.62, '#f2c040', 24, metal=0.6)
    star(cx, cy + 0.2, 1.76, 0.07, '#f2c040', metal=0.6); ball(cx + 0.12, cy, 2.02, 0.07, '#e8453c', 1.6)
    group_scale(since(n0), 1.3, cx, cy)
def chest(op, big):
    x0, x1, y0, y1, h = (-0.2, 1.2, 0.18, 0.92, 0.55) if big else (0.1, 0.9, 0.28, 0.86, 0.42)
    body, trim = ('#3c5cc8', '#f2c040') if big else ('#c8463c', '#f2c040')
    rbox(x0, y0, x1, y1, 0.0, h, body, 0.05)
    for xx in (x0 + 0.08, x1 - 0.14): rbox(xx, y0 - 0.01, xx + 0.06, y1 + 0.01, 0.0, h + 0.005, trim, 0.01, metal=0.6)
    star((x0 + x1) / 2, y1 + 0.01, h * 0.55, 0.12 if big else 0.09, trim, metal=0.6)
    n0 = len(sc.collection.objects)
    rbox(x0, y0, x1, y1, h, h + (0.2 if big else 0.16), body, 0.07, True)
    for xx in (x0 + 0.08, x1 - 0.14): rbox(xx, y0 - 0.01, xx + 0.06, y1 + 0.01, h, h + (0.21 if big else 0.17), trim, 0.01, metal=0.6)
    if op:
        group_rot(since(n0), math.radians(105), (x0 + x1) / 2, y0, 'X', h)
        rbox(x0 + 0.06, y0 + 0.06, x1 - 0.06, y1 - 0.06, h - 0.02, h + 0.002, '#2c1408', 0)
        ball((x0 + x1) / 2, (y0 + y1) / 2, h + 0.02, 0.18 if big else 0.12, '#fff0b0', 0.5, emit=3.0)
def door(kind, side):
    if side == 'N': X0, X1, Y0, Y1, Hh = 0.0, 2.0, 0.15, 0.95, 1.35
    else: X0, X1, Y0, Y1, Hh = 0.08, 0.92, 0.0, 3.0, 1.0
    if kind == 'shut':   # Zaun aus Holzstäben mit Kugeln
        n = 7 if side == 'N' else 9
        for i in range(n):
            t = (i + 0.5) / n
            px, py = (X0 + (X1 - X0) * t, 0.6) if side == 'N' else (0.5, Y0 + (Y1 - Y0) * t)
            cyl(px, py, 0.07, 0.0, Hh - 0.1, '#f4f0e6', 14); ball(px, py, Hh - 0.06, 0.09, '#e8453c')
        for z in (0.3, Hh - 0.35):
            if side == 'N': rbox(X0, 0.55, X1, 0.65, z, z + 0.1, '#3d7fe0', 0.02)
            else: rbox(0.45, Y0, 0.55, Y1, z, z + 0.1, '#3d7fe0', 0.02)
        return
    col, plate = ('#a0663a', '#f2c040') if kind == 'lock' else ('#e8b030', '#9b5bd6')
    rbox(X0, Y0, X1, Y1, 0.0, Hh, col, 0.08, rough=0.35, coat=0.6, metal=0.0 if kind == 'lock' else 0.5)
    if side == 'N':
        cx = (X0 + X1) / 2
        rbox(cx - 0.32, Y1 - 0.02, cx + 0.32, Y1 + 0.02, Hh * 0.25, Hh * 0.75, plate, 0.02, metal=0.6)
        cyl(cx, Y1 + 0.03, 0.08, Hh * 0.52, Hh * 0.52 + 0.001, '#140c1c', 16)
        ball(cx, Y1 + 0.025, Hh * 0.55, 0.07, '#140c1c'); rbox(cx - 0.035, Y1 + 0.01, cx + 0.035, Y1 + 0.04, Hh * 0.36, Hh * 0.52, '#140c1c', 0.0)
        if kind == 'big': star(cx, Y1 + 0.03, Hh * 0.88, 0.14, '#fffaf0')
        for s in (-1, 1): cyl(cx + s * 0.85, (Y0 + Y1) / 2, 0.1, Hh, Hh + 0.08, plate, 16, metal=0.6)
    else:
        rbox(0.3, 1.2, 0.7, 1.8, Hh, Hh + 0.02, plate, 0.02, metal=0.6); ball(0.5, 1.5, Hh + 0.03, 0.07, '#140c1c')
        if kind == 'big': star(0.5, 0.6, Hh + 0.02, 0.15, '#fffaf0', face='top')
def thing(name):
    if name.startswith('block'):
        v = int(name[-1]); col = ['#e8453c', '#3d7fe0', '#4cb35a'][v]
        rbox(0.04, 0.04, 0.96, 0.96, 0.0, 0.92, '#f0d8a8', 0.07, rough=0.4, coat=0.5)
        rbox(0.14, 0.95, 0.86, 0.975, 0.1, 0.82, col, 0.02); text('ABC'[v], 0.5, 0.985, 0.45, 0.55, '#fffaf0')
        rbox(0.14, 0.14, 0.86, 0.86, 0.915, 0.94, ['#f6c33b', '#e85c9c', '#f08a2c'][v], 0.02); star(0.5, 0.5, 0.95, 0.2, '#fffaf0', face='top', d=0.012)
    elif name.startswith('btn'):
        cyl(0.5, 0.5, 0.42, 0.0, 0.06, '#c8c8d4', 32, metal=0.4)
        cyl(0.5, 0.5, 0.32, 0.06, 0.08 if name == 'btn1' else 0.17, '#e8403c' if name == 'btn0' else '#9c2c2c', 32)
    elif name[0] == 'p' and name[1] in 'rb':
        col = '#e8403c' if name[1] == 'r' else '#3c78e8'; up = name[2] == '1'
        cyl(0.5, 0.5, 0.4, 0.0, 0.03, '#2c2034', 28)
        if up: cyl(0.5, 0.5, 0.33, 0.0, 0.62, col, 28); ball(0.5, 0.5, 0.62, 0.33, col, 0.55)
        else: cyl(0.5, 0.5, 0.33, 0.0, 0.06, col, 28, rough=0.5, coat=0.2)
    elif name.startswith('sw'):
        col = '#e8403c' if name == 'sw0' else '#3c78e8'
        cyl(0.5, 0.5, 0.32, 0.0, 0.12, '#8c5c34', 28); cyl(0.5, 0.5, 0.2, 0.12, 0.5, '#c8945c', 24); cyl(0.5, 0.5, 0.26, 0.48, 0.56, '#f2c040', 24, metal=0.6)
        ball(0.5, 0.5, 0.82, 0.3, col, rough=0.15, coat=0.9, emit=0.6); ball(0.42, 0.42, 0.95, 0.08, '#ffffff', emit=1.5)
    elif name in ('ch0', 'ch1', 'bc0', 'bc1'): chest(name[-1] == '1', name.startswith('bc'))
    elif name == 'it_key': keyshape(0.5, 0.5, 0.62, 1.0, '#d8dce8', 0.85)
    elif name == 'it_bigkey': keyshape(0.5, 0.5, 0.64, 1.15, '#f2c040', 0.8)
    elif name == 'it_kreisel': kreisel(1)
    elif name[:4] in ('lock', 'big', 'shut') or name[:3] == 'big': door(name[:-1], name[-1])
    elif name.startswith('sol'):
        if name == 'solx': soldier('d', 0, True)
        else: soldier(name[3], int(name[4]))
    elif name.startswith('top'): kreisel(int(name[3]))
    elif name.startswith('npc'): npc(int(name[3]))
    elif name.startswith('fm'):
        if name == 'fma': marshal('d', 0, 'aim')
        elif name == 'fmz': marshal('d', 0, 'dizzy')
        elif name == 'fmx': marshal('d', 0, 'fall')
        else: marshal(name[2], int(name[3]))
    elif name.startswith('pad'):
        on = name == 'pad1'
        cyl(0.5, 0.5, 0.72, 0.0, 0.1, '#8c5c34', 40); cyl(0.5, 0.5, 0.74, 0.08, 0.12, '#f2c040', 40, metal=0.7, emit=0.8 if on else 0)
        cyl(0.5, 0.5, 0.6, 0.12, 0.14, '#6c3cb8', 40, emit=0.5 if on else 0)
        for i in range(8): a = i * math.pi / 4; ball(0.5 + math.cos(a) * 0.5, 0.5 + math.sin(a) * 0.5 / K, 0.15, 0.05, '#fff0b0' if on else '#c8a8e8', emit=2.0 if on else 0)
        tube(W(1.15, 0.6, 0.1), W(1.25, 0.6, 0.4), 0.03, '#c8945c'); ball(1.25, 0.6, 0.42, 0.06, '#f2c040', metal=0.6)
        star(0.5, 0.5, 0.15, 0.25, '#f8d048', face='top', d=0.01, emit=1.5 if on else 0)
WIN = {}
for n in ('block0', 'block1', 'block2'): WIN[n] = (-2, -10, 20, 28)
for n in ('btn0', 'btn1'): WIN[n] = (0, -4, 16, 20)
for n in ('pr0', 'pr1', 'pb0', 'pb1'): WIN[n] = (0, -10, 16, 26)
for n in ('sw0', 'sw1'): WIN[n] = (0, -14, 16, 30)
for n in ('ch0', 'ch1'): WIN[n] = (-2, -12, 20, 28)
for n in ('bc0', 'bc1'): WIN[n] = (-6, -16, 28, 34)
for n in ('it_key', 'it_bigkey', 'it_kreisel'): WIN[n] = (0, -4, 16, 16)
for n in ('lockN', 'bigN', 'shutN'): WIN[n] = (-2, -16, 36, 34)
for n in ('lockW', 'bigW', 'shutW'): WIN[n] = (-2, -14, 20, 64)
for n in ('sold0', 'sold1', 'solu0', 'solu1', 'sols0', 'sols1', 'solx'): WIN[n] = (-6, -22, 28, 36)
for n in ('top0', 'top1', 'top2', 'top3'): WIN[n] = (-2, -6, 20, 20)
for n in ('npc0', 'npc1'): WIN[n] = (-8, -30, 32, 46)
for n in ('pad0', 'pad1'): WIN[n] = (-8, -6, 32, 26)
for n in ('fmd0', 'fmd1', 'fmu0', 'fmu1', 'fms0', 'fms1', 'fma', 'fmz'): WIN[n] = (-24, -40, 80, 86)
WIN['fmx'] = (-20, -26, 112, 72)

done = []
for key in DATA:
    if ONLY and key not in ONLY: continue
    reset(); room(key); done.append(key)
for name, (u0, v0, w, h) in WIN.items():
    if ONLY and name not in ONLY: continue
    reset(); thing(name); setup(u0, v0, w, h, SSO, True); shot('o_' + name); done.append(name)
json.dump({k: list(v) for k, v in WIN.items()}, open(os.path.join(OUT, 'win.json'), 'w'))
print('ok', len(done))
