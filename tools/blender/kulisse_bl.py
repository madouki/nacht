# Kulissen für NACHTMAHR: große Stücke hinter der Spielebene für Räume, die bisher leer wirkten. Kanal (Rohre, Schleuse), Stollen
# (Grubenausbau, Lore), Sternkuppel (Riesenteleskop), Mond (Käsebohrturm), Wintergarten (Palme im Kübel).
# Aufruf: python bl.py kulisse_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kulisse", "ss": 4}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))
SS = CFG.get('ss', 4)

def stage(w, h):
    global FW, FH
    FW, FH = w, h
    MATS.clear(); MESH.clear(); OBJ.clear()
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)
    sc = bpy.context.scene; sc.render.resolution_x = w * SS; sc.render.resolution_y = h * SS
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()

def box(x0, y0, x1, y1, mat, d0=-3.0, d1=3.0):   # Quader in Bildkoordinaten, d: Tiefe (negativ = zur Kamera)
    bm = bmesh.new(); v = {}
    for i, x in enumerate((x0, x1)):
        for j, y in enumerate((y0, y1)):
            for k, d in enumerate((d0, d1)): v[i, j, k] = bm.verts.new((x - FW / 2, d, FH - y))
    for f in (((0,0,0),(1,0,0),(1,1,0),(0,1,0)), ((0,0,1),(0,1,1),(1,1,1),(1,0,1)), ((0,0,0),(0,0,1),(1,0,1),(1,0,0)), ((0,1,0),(1,1,0),(1,1,1),(0,1,1)), ((0,0,0),(0,1,0),(0,1,1),(0,0,1)), ((1,0,0),(1,0,1),(1,1,1),(1,1,0))):
        bm.faces.new([v[c] for c in f])
    me = bpy.data.meshes.new('b'); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new('b', me); bpy.context.scene.collection.objects.link(o); OBJ.append(o); return o
def beam(a, b, w, mat, d=0.0):   # schräger Balken mit rechteckigem Querschnitt
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1; nx, ny = -dy / L * w / 2, dx / L * w / 2
    for dd, hw in ((d - w / 2, 1), (d + w / 2, 1)):
        pass
    grid(lambda u, v: (a[0] + dx * u + nx * (2 * v - 1), a[1] + dy * u + ny * (2 * v - 1), d - w * 0.45), 1, 1, mat)
    grid(lambda u, v: (a[0] + dx * u + nx, a[1] + dy * u + ny, d - w * 0.45 + w * 0.9 * v), 1, 1, mat)
    grid(lambda u, v: (a[0] + dx * u - nx, a[1] + dy * u - ny, d - w * 0.45 + w * 0.9 * v), 1, 1, mat)
def ring(cx, cy, r, tr, mat, d=-4.0, n=28):
    for i in range(n):
        a = i / n * 2 * math.pi; S(cx + math.cos(a) * r, cy + math.sin(a) * r, d, tr, mat)
def flange(a, b, r, mat, y=0.0):   # Rohrflansch quer zur Achse a→b
    tube(a, b, r, r, mat, y, y, caps=False)

def rohr():   # Rohrbündel mit Handrad, Manometer und Patina (112×84)
    IRON, IRON2, BRZ, BRZL, PAT, DARK = M('#5a4a42', 0.55, 0.7), M('#6c5848', 0.5, 0.7), M('#a87c3c', 0.34, 0.9), M('#dcae60', 0.26, 0.9), M('#5c9078', 0.7, 0.2), M('#181210', 0.8)
    tube((-6, 22), (118, 22), 10.5, 10.5, IRON, 2.0, caps=False)
    tube((-6, 60), (84, 60), 7.0, 7.0, IRON2, 0.0, caps=False)
    tube((84, 60), (84, 24), 7.0, 7.0, IRON2, 0.0); S(84, 60, 0.0, 8.0, IRON2)
    for x in (10, 38, 66, 96):   # Flansche mit Nieten
        flange((x - 1.8, 22), (x + 1.8, 22), 13.0, BRZ, 2.0)
        for k in range(7):
            a = k / 7 * 2 * math.pi; S(x, 22 + math.cos(a) * 11.6, 2.0 - abs(math.sin(a)) * 11.5 - 1.2, 1.0, BRZL)
    for x in (24, 56):
        flange((x - 1.4, 60), (x + 1.4, 60), 9.2, BRZ, 0.0)
    for x, y, r in ((18, 14, 4.2), (47, 30, 3.2), (76, 13, 5.0), (104, 30, 3.6), (34, 66, 3.4)):   # Grünspan
        S(x, y, -9.0 if y < 40 else -6.2, r, PAT, r, 1.3)
    tube((40, 60), (40, 80), 4.2, 4.2, IRON, 0.0); flange((40, 77), (40, 80), 6.2, BRZ, 0.0)   # Abfluss
    # Handrad auf dem Ventil
    tube((62, 60), (62, 42), 2.6, 2.6, BRZ, -6.0); S(62, 42, -6.0, 3.4, BRZL)
    ring(62, 42, 12.0, 1.7, BRZ, -9.0)
    for k in range(5):
        a = k / 5 * 2 * math.pi + 0.3; tube((62, 42), (62 + math.cos(a) * 12, 42 + math.sin(a) * 12), 1.1, 1.1, BRZL, -9.0, caps=False)
    # Manometer
    tube((18, 60), (18, 42), 1.6, 1.6, BRZ, -5.0); S(18, 38, -6.0, 9.2, BRZ, 3.0, 9.2); S(18, 38, -8.2, 7.4, M('#f0e8d0', 0.4, 0, 0.25), 1.6, 7.4)
    tube((18, 38), (22.5, 33.5), 0.7, 0.3, M('#a81c14', 0.4), -10.0, caps=False); S(18, 38, -10.0, 1.1, DARK)

def schleuse():   # steinerner Auslass mit Gitter und Löwenkopf-Schlussstein (88×88)
    ST, ST2, ST3, DARK, IRON, MOSS, BRZ = M('#6a6258', 0.9), M('#7c7266', 0.9), M('#544c44', 0.92), M('#0a0a10', 0.95), M('#34343e', 0.45, 0.8), M('#4c7c44', 0.95), M('#a87c3c', 0.34, 0.9)
    box(0, 0, 88, 88, ST3, 2.0, 5.0)
    grid(lambda u, v: (44 + math.cos(math.pi + u * math.pi) * 29 * v, 46 + math.sin(math.pi + u * math.pi) * 29 * v, 1.0), 20, 3, DARK)
    box(15, 46, 73, 88, DARK, 1.0, 2.0)
    n = 11   # Keilsteine im Bogen
    for i in range(n):
        a0, a1 = math.pi + i / n * math.pi + 0.012, math.pi + (i + 1) / n * math.pi - 0.012; mat = (ST, ST2)[i % 2]
        grid(lambda u, v: (44 + math.cos(a0 + (a1 - a0) * u) * (29 + 12 * v), 46 + math.sin(a0 + (a1 - a0) * u) * (29 + 12 * v), -3.5 - 1.2 * math.sin(v * math.pi)), 4, 3, mat)
    for x0, x1 in ((3, 15), (73, 85)):   # Gewände aus Quadern
        for j, y in enumerate(range(46, 88, 14)):
            box(x0 + (j % 2) * 1.0, y + 0.5, x1 - (j % 2) * 1.0, y + 13.5, (ST2, ST)[j % 2], -3.8, 2.0)
    for x in range(21, 70, 8):   # Gitterstäbe
        tube((x, 19 + (abs(x - 44) ** 2) / 24.0), (x, 86), 1.5, 1.5, IRON, -0.4, caps=False)
    for y in (46, 66):
        tube((15, y), (73, y), 1.4, 1.4, IRON, -1.0, caps=False)
    S(44, 13, -6.0, 9.0, BRZ, 4.5, 9.5); S(40, 10, -10.0, 1.5, M('#e8c048', 0.3, 0.8, 0.5)); S(48, 10, -10.0, 1.5, M('#e8c048', 0.3, 0.8, 0.5)); S(44, 17, -9.8, 3.2, M('#7c5c28', 0.4, 0.8), 1.6, 2.2)   # Löwenkopf
    for x, y, r in ((9, 8, 6), (78, 14, 5), (6, 70, 5), (82, 50, 4), (20, 6, 4), (66, 4, 5)):
        S(x, y, -4.6, r, MOSS, 1.6, r * 0.7)

def stuetze():   # Grubenausbau: zwei Stempel, Kappe, Streben, Laterne (72×104)
    W1, W2, W3, IRON, GL, ROPE = M('#6c4a2c', 0.8), M('#5a3c24', 0.84), M('#7c5834', 0.78), M('#3a3640', 0.45, 0.8), M('#fcc060', 0.2, 0, 7.0), M('#a08860', 0.9)
    for x0, x1 in ((3, 15), (57, 69)):
        box(x0, 16, x1, 104, W1, -4.0, 3.0)
        for yy in (18, 42, 66, 90):   # Maserung als flache Kerben
            box(x0 + 2.5, yy, x0 + 3.6, yy + 15, W2, -4.3, -3.8); box(x1 - 4.2, yy + 8, x1 - 3.1, yy + 20, W3, -4.3, -3.8)
        for yy in (28, 84):
            box(x0 - 0.8, yy, x1 + 0.8, yy + 4, IRON, -4.8, 3.2)
            for k in (2.5, 9.5): S(x0 + k, yy + 2, -5.2, 1.0, M('#6c6880', 0.3, 0.9))
    box(0, 4, 72, 19, W3, -5.5, 3.5)
    for x in range(5, 70, 11): box(x, 6.5, x + 1.1, 16.5, W2, -5.8, -5.3)
    for i in range(0, 72, 13): box(i + 0.5, 0, i + 12, 5, (W2, W1)[int(i / 13) % 2], -2.0, 3.0)   # Verzug über der Kappe
    beam((15, 44), (34, 18), 6.5, W2, -2.0); beam((57, 44), (38, 18), 6.5, W2, -2.0)
    # Laterne an der Kappe
    tube((36, 19), (36, 31), 0.5, 0.5, IRON, -6.5, caps=False)
    S(36, 32, -6.5, 3.8, IRON, 3.8, 1.7); tube((36, 33), (36, 45), 4.2, 4.2, GL, -6.5, caps=False); S(36, 46, -6.5, 4.8, IRON, 4.8, 1.8)
    for a in (0, 2.1, 4.2): tube((36 + math.cos(a) * 4.4, 33), (36 + math.cos(a) * 4.4, 45), 0.45, 0.45, IRON, -6.5 - math.sin(a) * 4.4, caps=False)
    for k in range(9): S(16 + k * 1.1, 58 + k * 2.5 + math.sin(k) * 0.8, -5.0, 0.8, ROPE)   # Seil am Stempel

def lore():   # Grubenwagen voll Erz auf zwei Schienen (72×44)
    IRON, IRON2, RIV, DARK, ORE, ORE2, GOLD = M('#4a4650', 0.5, 0.8), M('#5e5864', 0.42, 0.8), M('#8c8898', 0.3, 0.9), M('#14121a', 0.9), M('#4c4640', 0.95), M('#645c50', 0.9), M('#fcd040', 0.2, 0.9, 1.2)
    grid(lambda u, v: (11 - 4 * (1 - v) + (50 + 8 * (1 - v)) * u, 12 + 20 * v, -5.0), 4, 2, IRON2)
    for x in (22, 36, 50): box(x - 0.8, 12, x + 0.8, 32, IRON, -5.6, -4.6)
    box(4.5, 10, 67.5, 14, IRON, -6.2, 5.0); box(9, 30, 63, 33.5, IRON, -5.8, 5.0)
    for k in range(9): S(9 + k * 6.75, 12, -6.8, 0.9, RIV)
    for x, y, r, m in ((14, 8, 6.5, ORE), (24, 5, 7.5, ORE2), (36, 3, 8.5, ORE), (48, 6, 7.5, ORE2), (58, 8, 6.0, ORE), (30, 9, 5, ORE2), (44, 9, 5, ORE)):
        S(x, y, -1.0, r, m, r * 0.8, r * 0.82)
    for x, y in ((20, 3.5), (33, 0.8), (42, 3.6), (55, 5)): S(x, y, -6.5, 1.3, GOLD)
    for x in (20, 52):
        tube((x, 36), (x, 36.01), 6.2, 6.2, DARK, -7.2, -4.0, caps=False)
        ring(x, 36, 5.2, 1.0, IRON2, -7.4, 18); S(x, 36, -7.6, 1.8, RIV)
    box(0, 41, 72, 43, M('#6c6878', 0.35, 0.9), -3.0, 3.0)

def teleskop():   # Riesenteleskop auf Säule mit Zahnkranz (176×144)
    BR, BRL, BRD, ST, ST2, IRON, GL = M('#b08238', 0.3, 0.9), M('#e4b866', 0.24, 0.9), M('#7c5620', 0.36, 0.9), M('#5a5a68', 0.85), M('#70707e', 0.82), M('#2c2c38', 0.45, 0.8), M('#4c98d8', 0.1, 0, 0.9)
    box(62, 118, 122, 144, ST, -8.0, 8.0); box(56, 136, 128, 144, ST2, -10.0, 9.0); box(68, 112, 116, 120, ST2, -9.0, 8.0)
    tube((92, 112), (92, 70), 11.0, 7.0, IRON, 0.0)
    ring(92, 74, 25.0, 3.2, BRD, -3.0, 40)   # Zahnkranz
    for k in range(24):
        a = k / 24 * 2 * math.pi; S(92 + math.cos(a) * 29.0, 74 + math.sin(a) * 29.0, -3.0, 2.0, BR)
    for k in range(6):
        a = k / 6 * 2 * math.pi + 0.26; tube((92, 74), (92 + math.cos(a) * 24, 74 + math.sin(a) * 24), 1.5, 1.5, BR, -3.0, caps=False)
    S(92, 74, -8.0, 7.5, BRL, 4.0, 7.5)
    ax, ay, bx, by = 22.0, 122.0, 152.0, 36.0   # Rohr von unten links nach oben rechts
    def P(t): return (ax + (bx - ax) * t, ay + (by - ay) * t)
    tube(P(0.08), P(0.4), 8.0, 10.0, BR, -12.0, caps=False); tube(P(0.4), P(0.72), 10.0, 12.5, BRD, -12.0, caps=False); tube(P(0.72), P(1.0), 12.5, 15.0, BR, -12.0, caps=False)
    for t, r in ((0.09, 9.5), (0.26, 10.5), (0.4, 12.0), (0.56, 13.0), (0.72, 14.5), (0.86, 15.5), (0.985, 17.5)):
        tube(P(t - 0.012), P(t + 0.012), r, r, BRL, -12.0, caps=False)
    S(P(1.0)[0] + 1, P(1.0)[1] - 0.8, -13.0, 12.0, GL, 2.0, 12.0)
    tube(P(0.0), P(0.08), 4.0, 5.5, IRON, -12.0, caps=False); tube((P(0.0)[0] + 6, P(0.0)[1] + 4), (P(0.0)[0] - 3, P(0.0)[1] - 3), 3.2, 3.2, BRD, -12.0)   # Okular
    q0, q1 = P(0.42), P(0.8); tube((q0[0] - 11, q0[1] - 14), (q1[0] - 11, q1[1] - 14), 3.0, 3.8, BRD, -18.0)   # Sucherfernrohr
    for t in (0.5, 0.74): q = P(t); tube((q[0] - 4, q[1] - 6), (q[0] - 11, q[1] - 14), 1.3, 1.3, BRL, -15.0, caps=False)
    q = P(0.5); tube((92, 74), q, 6.0, 6.0, IRON, -6.0, -10.0)   # Achse zum Rohr
    tube((92, 74), (58, 106), 3.2, 3.2, IRON, -4.0, caps=False); S(56, 108, -4.0, 9.5, IRON); S(53, 105, -10.5, 2.4, M('#7c7c8c', 0.25, 0.9))   # Gegengewicht

def bohrer():   # Käsebohrturm: Gitterturm, Bohrer, angebissenes Käsestück auf der Kiste (112×116)
    ST, STL, W1, W2, CH, CH2, HOLE, RED = M('#6c6c78', 0.42, 0.8), M('#a0a0ac', 0.32, 0.85), M('#7a5834', 0.8), M('#5e4226', 0.84), M('#f8d048', 0.5, 0, 0.12), M('#fce890', 0.45, 0, 0.12), M('#a8801c', 0.7), M('#c82818', 0.5)
    L0, L1, R0, R1 = (20, 104), (42, 8), (92, 104), (68, 8)
    for a, b in ((L0, L1), (R0, R1)): tube(a, b, 2.4, 1.8, ST, -3.0)
    n = 6
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        a0 = (L0[0] + (L1[0] - L0[0]) * t0, L0[1] + (L1[1] - L0[1]) * t0); a1 = (L0[0] + (L1[0] - L0[0]) * t1, L0[1] + (L1[1] - L0[1]) * t1)
        b0 = (R0[0] + (R1[0] - R0[0]) * t0, R0[1] + (R1[1] - R0[1]) * t0); b1 = (R0[0] + (R1[0] - R0[0]) * t1, R0[1] + (R1[1] - R0[1]) * t1)
        tube(a1, b1, 1.3, 1.3, STL, -3.0, caps=False); tube(a0, b1, 1.0, 1.0, ST, -3.0, caps=False); tube(b0, a1, 1.0, 1.0, ST, -3.0, caps=False)
    tube((55, 8), (55, 80), 1.6, 1.6, STL, -2.0)
    for k in range(9):   # Bohrgewinde
        S(55, 64 + k * 4.4, -2.0, 7.0 - k * 0.7, (ST, STL)[k % 2], 7.0 - k * 0.7, 2.2)
    tube((55, 100), (55, 108), 2.0, 0.2, STL, -2.0, caps=False)
    box(36, 2, 74, 9, W1, -6.0, 4.0); S(55, 0.5, -3.0, 4.5, ST)
    tube((64, 0), (108, 18), 0.6, 0.6, ST, -3.0, caps=False)
    tube((100, 116), (100, 52), 0.9, 0.9, STL, -5.0)
    grid(lambda u, v: (100 - u * 22, 53 + v * (13 - 7 * u) + math.sin(u * 7) * 1.5, -5.0), 8, 2, RED)
    box(2, 92, 40, 116, W1, -8.0, 6.0)
    for x in (2, 14, 27): box(x, 92, x + 1.4, 116, W2, -8.3, -7.8)
    box(2, 103, 40, 104.6, W2, -8.3, -7.8)
    # Käse: Keil mit Löchern
    grid(lambda u, v: (6 + 32 * u, 92 - (12 + 10 * u) * v, -10.5), 6, 4, CH)
    grid(lambda u, v: (6 + 32 * u, 80 - 10 * u, -10.5 + 11 * v), 6, 2, CH2)
    for x, y, r in ((15, 86, 3.2), (27, 84, 2.6), (32, 76, 2.2), (11, 79, 1.9), (22, 77, 1.6)):
        S(x, y, -11.0, r, HOLE, 0.9, r)

def palme():   # Palme im Terrakotta-Kübel (88×112)
    POT, POT2, TR, TR2, L1, L2, L3, SOIL = M('#a8583c', 0.75), M('#c4704c', 0.7), M('#6c5238', 0.9), M('#84684a', 0.88), M('#2c6c40', 0.6), M('#3c8c50', 0.55), M('#1c5034', 0.65), M('#241810', 0.95)
    tube((44, 112), (44, 90), 13.0, 19.0, POT, -2.0, caps=False); tube((44, 92), (44, 86), 21.0, 21.0, POT2, -2.0, caps=False); S(44, 86, -2.0, 19.0, SOIL, 19.0, 2.4)
    for k in range(5): S(30 + k * 7, 100, -18.5 + abs(k - 2) * 1.0, 1.2, POT2)
    bx, by = 44.0, 86.0; tx, ty = 46.0, 28.0
    for i in range(13):
        t = i / 12; x = bx + (tx - bx) * t + math.sin(t * 2.6) * 4.0; y = by + (ty - by) * t; r = 6.2 - t * 2.0
        S(x, y, -1.0, r, (TR, TR2)[i % 2], r, 3.0)
    def frond(ang, L, mat, droop, d):
        def C(t):
            return (tx + math.cos(ang) * L * t, ty + math.sin(ang) * L * t + droop * t * t, d)
        for i in range(16):
            t0, t1 = i / 16, (i + 1) / 16; hw = 8.0 * math.sin(min(1, t0 + 0.14) * math.pi) ** 0.7
            p0, p1 = C(t0), C(t1); dx, dy = p1[0] - p0[0], p1[1] - p0[1]; n = math.hypot(dx, dy) or 1; nx, ny = -dy / n, dx / n
            for s in (-1, 1):   # Fiederblätter, leicht nach außen gefächert
                grid(lambda u, v: (p0[0] + dx * (u + 0.5 * v * 0.4) + s * nx * hw * v, p0[1] + dy * (u + 0.5 * v * 0.4) + s * ny * hw * v + 2.0 * v, d), 1, 1, mat if i % 2 else L3)
        for i in range(16):
            S(C(i / 16)[0], C(i / 16)[1], d - 0.6, 0.7, TR2)
    for ang, L, droop, m, d in ((-3.0, 40, 44, L1, -2), (-0.14, 40, 46, L1, -3), (-2.45, 38, 34, L2, -5), (-0.7, 38, 34, L2, -6), (-1.95, 30, 22, L1, -7), (-1.2, 30, 22, L1, -8), (2.9, 34, 40, L2, -9), (0.25, 34, 40, L2, -10)):
        frond(ang, L, m, droop, d)

os.makedirs(CFG['out'], exist_ok=True)
for name, fn, w, h in (('rohr', rohr, 112, 84), ('schleuse', schleuse, 88, 88), ('stuetze', stuetze, 72, 104), ('lore', lore, 72, 44), ('teleskop', teleskop, 176, 144), ('bohrer', bohrer, 112, 116), ('palme', palme, 88, 112)):
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); fn(); shot(name)
print('ok')
