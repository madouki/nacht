# Kettenhund Brutus (Zwischengegner im Zwinger): schwerer Mastiff mit dunklem Fell, hellerer Schnauze, glühenden Augen und einem
# Stachelhalsband mit Kettenring. Blick nach rechts. Bildfeld 96×64 Spielpixel, Körpermitte x = 48, Pfoten unten.
# Posen: stand0, stand1 (Gang), crouch (knurrt, Nackenhaare), leap (Sprung), bark (bellt), choke (von der Kette zurückgerissen,
# liegt auf dem Rücken, Zunge heraus).
# Aufruf: python bl.py hund_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_hund", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def root(cx, cy, deg, dz):   # alles um (cx, cy) in der Bildebene drehen und senkrecht verschieben
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in list(OBJ):
        o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, math.radians(deg), 0); e.location.z += 0 if dz == 'boden' else dz; OBJ.append(e)
    if dz == 'boden':   # auf den Boden legen: tiefster Punkt knapp über der Bildunterkante
        from mathutils import Vector
        e.location.z -= 0; bpy.context.view_layer.update()
        lo = min((o.matrix_world @ Vector(c)).z for o in OBJ if o.type == 'MESH' for c in o.bound_box)
        e.location.z += 0.4 - lo

def leg(pts, r, mat, d, paw):   # Bein als Kette von Röhren, Pfote am Ende
    for a, b in zip(pts, pts[1:]): tube(a, b, r, r * 0.85, mat, d); S(b[0], b[1], d, r * 0.95, mat)
    S(pts[-1][0] + 1.6, pts[-1][1] + 0.4, d, 2.6, paw, 2.0, 1.4)

def hund(pose):
    FUR, FURD, MUZ = M('#3c2c24', 0.85), M('#241a16', 0.9), M('#7c5c44', 0.8)
    BLACK, EYE, LEATHER = M('#120c0c', 0.4), M('#ff3020', 0.2, 0, 3.0), M('#1c1416', 0.5, 0.2)
    STEEL, MOUTH, TOOTH, TONGUE = M('#c8c8d4', 0.25, 0.9), M('#5c1418', 0.6), M('#f4ecd8', 0.4), M('#d85068', 0.5)
    base = 'stand0' if pose == 'choke' else pose
    low = {'stand0': 0, 'stand1': 0, 'crouch': 5.0, 'leap': -6.0, 'bark': -1.0}[base]
    tilt = {'leap': -12}.get(base, 0)
    # Rumpf: Hinterteil, Bauch, Brust
    S(29, 33 + low, 0.0, 11.0, FUR, 10.0, 11.5); S(44, 34 + low, 0.0, 17.0, FUR, 11.0, 11.0); S(57, 35 + low, -0.5, 10.5, FUR, 10.5, 11.5)
    S(58, 40 + low, -6.5, 6.0, MUZ, 3.0, 6.0)   # helle Brust
    if base == 'crouch':   # gesträubte Nackenhaare
        for k in range(7): tube((36 + k * 3.4, 24.0 + low - k * 0.4), (37 + k * 3.4, 19.8 + low - k * 0.6), 1.4, 0.1, FURD, 0.0)
    # Schwanz
    tube((19, 28 + low), (13, 21 + low - (4 if base == 'leap' else 0)), 2.4, 1.2, FUR, 0.0)
    # Beine: hinten (fern, nah), vorn (fern, nah)
    LEGS = {
        'stand0': [((30, 40), (34, 50), (31, 56), (34, 61.5)), ((28, 40), (22, 50), (26, 56), (24, 61.5)), ((58, 42), (57, 52), (56, 61.5)), ((58, 42), (63, 52), (65, 61.5))],
        'stand1': [((30, 40), (24, 50), (27, 56), (25, 61.5)), ((28, 40), (32, 50), (30, 56), (33, 61.5)), ((58, 42), (62, 52), (64, 61.5)), ((58, 42), (57, 52), (57, 61.5))],
        'crouch': [((30, 44), (38, 52), (31, 57), (34, 61.5)), ((28, 44), (36, 53), (28, 58), (30, 61.5)), ((58, 46), (64, 54), (68, 61.5)), ((58, 46), (66, 53), (71, 61.5))],
        'leap':   [((30, 34), (20, 40), (12, 44), (6, 46)), ((28, 34), (18, 42), (11, 47), (5, 50)), ((60, 36), (70, 40), (80, 41)), ((60, 36), (71, 43), (81, 46))],
        'bark':   [((30, 40), (34, 50), (31, 56), (33, 61.5)), ((28, 40), (24, 50), (27, 56), (26, 61.5)), ((58, 41), (60, 51), (62, 61.5)), ((58, 41), (64, 51), (67, 61.5))],
    }[base]
    for i, pts in enumerate(LEGS):
        pts = [(x, y + (low if j == 0 else 0)) for j, (x, y) in enumerate(pts)]
        far = i % 2 == 0
        leg(pts, 3.6 if i < 2 else 3.2, FURD if far else FUR, 6.5 if far else -6.5, FURD if far else MUZ)
    # Hals, Halsband mit Stacheln und Ring
    hx, hy = {'stand0': (72, 18), 'stand1': (72, 18), 'crouch': (73, 27), 'leap': (78, 16), 'bark': (75, 13)}[base]
    hy += 0 if base in ('crouch', 'bark', 'leap') else low
    n0 = (60, 31 + low); tube(n0, (hx - 4, hy + 4), 8.0, 6.6, FUR, 0.0)
    ca, cb = (n0[0] + (hx - 4 - n0[0]) * 0.42, n0[1] + (hy + 4 - n0[1]) * 0.42), (n0[0] + (hx - 4 - n0[0]) * 0.58, n0[1] + (hy + 4 - n0[1]) * 0.58)
    tube(ca, cb, 8.6, 8.2, LEATHER, 0.0)
    ux, uy = cb[0] - ca[0], cb[1] - ca[1]; L = math.hypot(ux, uy) or 1; px, py = -uy / L, ux / L; mc = ((ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2)
    for k in range(7):   # Stacheln rundum (oben, vorn zur Kamera, unten)
        a = math.pi * k / 6; ox, oz = math.cos(a), -math.sin(a)
        p0 = (mc[0] + px * 8.4 * ox, mc[1] + py * 8.4 * ox); p1 = (mc[0] + px * 11.4 * ox, mc[1] + py * 11.4 * ox)
        tube(p0, p1, 1.1, 0.05, STEEL, 8.4 * oz, 11.4 * oz)
    S(mc[0] - px * 6.0, mc[1] - py * 6.0 + 2.0, -4.0, 1.9, STEEL, 0.8, 1.9)   # Kettenring
    # Kopf, Schnauze, Kiefer, Nase, Augen, Ohren
    S(hx, hy, 0.0, 8.5, FUR, 8.0, 8.0)
    S(hx - 1.0, hy - 5.6, -1.0, 6.0, FURD, 5.0, 2.4)   # Stirnwulst
    mouth = base in ('bark', 'leap', 'crouch') and pose != 'choke'
    gape = {'bark': 7, 'leap': 5, 'crouch': 2.5}.get(base, 0) if mouth else 0
    S(hx + 8.5, hy + 3.0, -0.6, 6.5, MUZ, 5.6, 4.6)                     # Oberkiefer
    S(hx + 13.8, hy + 1.4, -1.0, 2.4, BLACK, 2.0, 1.8)                 # Nase
    if gape:
        S(hx + 7.0, hy + 6.6 + gape * 0.5, -0.6, 4.8, MOUTH, 4.6, 2.4 + gape * 0.3)
        S(hx + 7.0, hy + 8.0 + gape, -0.6, 5.6, MUZ, 4.8, 2.6, (0, -0.25, 0))   # Unterkiefer
        for k in range(4):
            tx = hx + 5.0 + k * 2.4
            tube((tx, hy + 6.0), (tx + 0.2, hy + 7.8), 0.6, 0.05, TOOTH, -4.4); tube((tx, hy + 7.2 + gape), (tx + 0.2, hy + 5.6 + gape), 0.6, 0.05, TOOTH, -4.4)
    else:
        S(hx + 7.0, hy + 7.2, -0.6, 5.2, MUZ, 4.6, 2.6)
        tube((hx + 3.0, hy + 6.2), (hx + 12.0, hy + 5.4), 0.35, 0.3, BLACK, -4.8)
        tube((hx + 9.6, hy + 6.0), (hx + 9.8, hy + 8.2), 0.7, 0.05, TOOTH, -4.4)   # Eckzahn
    if pose == 'choke':   # Zunge hängt heraus
        tube((hx + 8.0, hy + 7.0), (hx + 10.0, hy + 13.0), 1.6, 1.2, TONGUE, -3.0)
    for ex, d in ((hx + 3.6, -6.6), (hx + 1.2, -2.0)):
        S(ex, hy - 2.0, d, 1.5, BLACK, 0.8, 1.2)
        if pose != 'choke': S(ex + 0.3, hy - 2.2, d - 0.6, 0.8, EYE)
        else: tube((ex - 1.2, hy - 2.8), (ex + 1.2, hy - 1.2), 0.3, 0.3, MUZ, d - 0.8); tube((ex - 1.2, hy - 1.2), (ex + 1.2, hy - 2.8), 0.3, 0.3, MUZ, d - 0.8)
    for d in (-5.0, 5.0): tube((hx - 4.0, hy - 6.0), (hx - 7.0 - (2 if base == 'crouch' else 0), hy - 12.0 + (4 if base == 'crouch' else 0)), 2.8, 0.6, FURD, d)
    if tilt: root(48, 34, tilt, 0)
    if pose == 'choke': root(46, 34, CFG.get('chokeDeg', 195), 'boden')

def welpe(pose):   # Krümel, Brutus' Jüngster (Begleiter): großer Kopf, Schlappohren, rotes Halsband mit Glöckchen. 28×20, Mitte x = 14
    FUR, FURD, MUZ = M('#6c4c34', 0.85), M('#3c2c20', 0.9), M('#b08c64', 0.8)
    BLACK, EYE, RED, GOLD = M('#120c0c', 0.3), M('#fcfcfc', 0.2, 0, 1.5), M('#c82828', 0.6), M('#f8c838', 0.3, 0.9)
    MOUTH, TONGUE = M('#5c1418', 0.6), M('#e86078', 0.5)
    sit = pose == 'sit'; bite = pose == 'bite'
    by = 13.0 + (0.6 if sit else 0)
    if sit:
        S(11.5, 14.0, 0.0, 4.6, FUR, 3.8, 4.4); S(9.0, 16.4, 0.0, 3.6, FUR, 3.4, 3.0)
    else:
        S(12.0 + (1.0 if bite else 0), by, 0.0, 6.2, FUR, 3.8, 3.8, (0, -0.12 if bite else 0, 0))
    S(16.0 + (1.0 if bite else 0), by + 1.6, -1.6, 2.4, MUZ, 1.2, 2.2)   # helle Brust
    tube((6.2, by - 1.0), (3.4, by - 4.0 + (2.0 if sit else 0)), 1.0, 0.6, FUR, 0.0)   # Schwanz
    LEGS = {'run0': ((8, 16.4), (6.4, 19.4), (16, 16.4), (18.4, 19.4)), 'run1': ((8, 16.4), (9.6, 19.4), (16, 16.4), (14.6, 19.4)),
            'bite': ((8, 16.0), (5.4, 19.4), (17, 15.6), (21.6, 18.4)), 'sit': ((10, 17.0), (12.6, 19.4), (14.6, 16.0), (15.4, 19.4))}[pose]
    for (h, f) in ((LEGS[0], LEGS[1]), (LEGS[2], LEGS[3])):
        for d, mat in ((1.6, FURD), (-1.6, FUR)):
            tube(h, f, 1.1, 0.9, mat, d); S(f[0] + 0.6, f[1] - 0.1, d, 1.2, MUZ if d < 0 else FURD, 0.9, 0.6)
    hx, hy = (18.6, 8.6) if not bite else (21.0, 10.0)
    if sit: hx, hy = 15.6, 7.0
    tube((hx - 3.0, hy + 3.0), (hx - 1.0, hy + 1.4), 2.6, 2.4, FUR, 0.0)
    tube((hx - 3.2, hy + 3.4), (hx - 1.8, hy + 2.2), 2.8, 2.8, RED, 0.0); S(hx - 1.6, hy + 4.6, -2.0, 0.8, GOLD)   # Halsband, Glöckchen
    S(hx, hy, 0.0, 4.4, FUR, 4.0, 4.2)
    S(hx + 3.4, hy + 1.6, -0.4, 2.4, MUZ, 2.2, 1.8); S(hx + 5.4, hy + 0.9, -0.8, 0.9, BLACK, 0.8, 0.7)
    if bite:
        S(hx + 3.0, hy + 3.4, -0.6, 1.8, MOUTH, 1.8, 1.2); S(hx + 3.0, hy + 4.6, -0.4, 2.0, MUZ, 1.8, 0.9)
        for k in range(3): tube((hx + 2.0 + k * 1.1, hy + 2.6), (hx + 2.1 + k * 1.1, hy + 3.4), 0.3, 0.05, M('#f4ecd8', 0.4), -2.0)
    elif sit: tube((hx + 3.4, hy + 3.0), (hx + 3.8, hy + 5.4), 0.7, 0.6, TONGUE, -1.4)
    for ex, d in ((hx + 1.8, -3.6), (hx - 0.4, -2.0)):
        S(ex, hy - 0.8, d, 0.95, BLACK, 0.6, 1.05); S(ex + 0.3, hy - 1.2, d - 0.5, 0.35, EYE)
    for d in (-3.4, 3.4): tube((hx - 2.0, hy - 2.6), (hx - 3.6, hy + 2.4), 1.6, 1.1, FURD, d)   # Schlappohren

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('stand0', 'stand1', 'crouch', 'leap', 'bark', 'choke'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(96, 64); hund(pose); shot('hund_' + pose)
for pose in ('run0', 'run1', 'bite', 'sit'):
    if CFG.get('only') and 'pup_' + pose not in CFG['only']: continue
    stage(28, 20); welpe(pose); shot('pup_' + pose)
print('ok')
