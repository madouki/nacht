# Uhrwerk-Teile für NACHTMAHR in Blender (Glockenstuhl, Zeigerkammer, Kuckucksuhr): Kuckucksuhr-Gehäuse 128×96, Kuckuck
# (geschlossen/offen) 32×24, Pendelgewicht 28×28, Tannenzapfen 10×16, Zifferblatt 188×188, Zeiger 96×14 (Achse bei 22/7),
# Stachelnabe 40×40, Zahnräder für die Wand 112×112 und 64×64; Glocke 64×96, Laufkatze 24×14 (zwei Radstellungen), Schiene
# 32×9 (kachelbar), Löwenkopf-Düse 14×20. Alles in Spielpixeln, SS-fach überabgetastet.
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'ss', 'what': [...]}; danach pack_uhr.py.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))

def stage(w, h, ss):
    global FW, FH, SS
    FW, FH, SS = w, h, ss
    MATS.clear(); MESH.clear(); OBJ.clear()
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()

def link(me, mat, name='o'):
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); me.materials.append(mat); OBJ.append(o); return o
def bevel(o, w, seg=2):
    m = o.modifiers.new('bv', 'BEVEL'); m.width = w; m.segments = seg; m.limit_method = 'ANGLE'; return o
def box(px, py, y, w, h, d, mat, bev=0.5, rot=0.0):  # Quader: Mitte (px, py), Breite w, Höhe h, Tiefe d (y negativ = zur Kamera)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=(w, d, h), verts=bm.verts)
    me = bpy.data.meshes.new('b'); bm.to_mesh(me); bm.free()
    o = link(me, mat, 'b'); o.location = (px - FW / 2, y, FH - py); o.rotation_euler = (0, rot, 0)
    if bev: bevel(o, bev)
    return o
def prism(px, py, y, pts, d, mat, bev=0.4, rot=0.0):  # ausgestanzte Fläche aus Punkten (Spielpixel relativ zur Mitte, y nach unten), Tiefe d
    bm = bmesh.new(); vs = [bm.verts.new((x, -d / 2, -yy)) for x, yy in pts]; f = bm.faces.new(vs)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f]); bmesh.ops.translate(bm, vec=(0, d, 0), verts=[v for v in ex['geom'] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('p'); bm.to_mesh(me); bm.free()
    o = link(me, mat, 'p'); o.location = (px - FW / 2, y, FH - py); o.rotation_euler = (0, rot, 0)
    if bev: bevel(o, bev)
    return o
def gear_pts(teeth, ro, ri, sharp=False, n=6):
    P = []
    for i in range(teeth):
        a0 = 2 * math.pi * i / teeth; st = 2 * math.pi / teeth
        prof = [(0.0, ri), (0.2, ri), (0.5, ro), (0.8, ri)] if sharp else [(0.0, ri), (0.15, ri), (0.28, ro), (0.55, ro), (0.68, ri)]
        for k, r in prof: a = a0 + k * st; P.append((math.cos(a) * r, math.sin(a) * r))
    return P
def disc(px, py, y, r, d, mat, n=48, bev=0.3):
    return prism(px, py, y, [(math.cos(2 * math.pi * i / n) * r, math.sin(2 * math.pi * i / n) * r) for i in range(n)], d, mat, bev)
def ring(px, py, y, r, t, mat):  # Wulst (Torus) in der Bildebene
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=t, major_segments=64, minor_segments=12)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); o.rotation_euler = (math.radians(90), 0, 0); o.location = (px - FW / 2, y, FH - py)
    o.data.materials.append(mat); OBJ.append(o); return o
def ringh(px, py, y, r, t, mat):  # waagerechter Wulst (Band um einen Rotationskörper)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=t, major_segments=64, minor_segments=10)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); o.location = (px - FW / 2, y, FH - py)
    o.data.materials.append(mat); OBJ.append(o); return o
def curve(pts, r0, r1, mat, y=0.0, n=10):
    P = []
    for i in range(len(pts) - 1):
        for k in range(n): t = k / n; P.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t))
    P.append(pts[-1])
    for i, q in enumerate(P): t = i / (len(P) - 1); S(q[0], q[1], y, r0 + (r1 - r0) * t, mat)
def text(px, py, y, s, size, mat, rot=0.0):
    cu = bpy.data.curves.new('tx', 'FONT'); cu.body = s; cu.size = size; cu.extrude = 0.35; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new('tx', cu); bpy.context.scene.collection.objects.link(o); cu.materials.append(mat)
    o.location = (px - FW / 2, y, FH - py); o.rotation_euler = (math.radians(90), rot, 0); OBJ.append(o); return o

def mats():
    global WAL, WALD, WALL, OAK, LEAF, LEAFL, GOLD, GOLDD, IRON, IRONL, CREAM, INK, BONE, VOID, BRASS, BRASSD, RED, BIRD, BIRDD, BIRDL, BEAK, EYE
    WAL, WALD, WALL, OAK = M('#5c3818', 0.55), M('#2c180a', 0.7), M('#8c5c2c', 0.5), M('#a87444', 0.5)
    LEAF, LEAFL = M('#3c5c24', 0.6), M('#6c8c3c', 0.55)
    GOLD, GOLDD = M('#e8b030', 0.28, 0.85), M('#a87018', 0.35, 0.85)
    BRASS, BRASSD = M('#c89838', 0.32, 0.9), M('#7c5c1c', 0.4, 0.9)
    IRON, IRONL = M('#3c3848', 0.4, 0.8), M('#7c7890', 0.32, 0.85)
    CREAM, INK, BONE, VOID, RED = M('#cdb98e', 0.7), M('#2c2418', 0.5), M('#e0d0a8', 0.6), M('#0c0604', 0.9), M('#a83c2c', 0.4)
    BIRD, BIRDD, BIRDL, BEAK, EYE = M('#8c4c1c', 0.55), M('#5c2c0c', 0.6), M('#c87c3c', 0.5), M('#f0b020', 0.4), M('#1c1c24', 0.2)

def house():  # 128×96: Gehäuse-Mitte x 64; Giebel ab y 6, Kasten 28..90, Türchen bei y 42, Zifferblatt bei y 70 (r 19)
    mats(); cx = 64
    box(cx, 59, 2, 88, 62, 16, WAL, 0.8)                                            # Kasten
    box(cx, 59, -6.5, 80, 54, 1.5, WALD, 0.3)                                       # Rückwand der Füllung (dunkel)
    for x in (cx - 42, cx + 42): tube((x, 30), (x, 89), 2.6, 2.6, OAK, -7, -7)    # gedrechselte Ecksäulen
    for k in range(5): S(cx - 42, 36 + k * 12, -9.5, 2.2, WALL); S(cx + 42, 36 + k * 12, -9.5, 2.2, WALL)
    box(cx, 89, -6, 94, 4, 18, OAK, 0.6)                                            # Sockelleiste
    for k in range(7): S(cx - 36 + k * 12, 93, -6, 2.2, WALL, 2.0, 2.6)             # Zapfen unter dem Sockel
    prism(cx, 18, 4, [(-50, 12), (0, -8), (50, 12)], 10, WALD, 0.4)                 # Giebelfeld hinter dem Dach
    for s in (-1, 1):                                                               # Giebeldach: dicke Dachplatten mit drei Schindelreihen
        rot = s * math.radians(21.8)
        box(cx + s * 31, 17, -4, 72, 7, 30, WALD, 0.8, rot)
        for r in range(3):
            for k in range(6):
                d = 7 + k * 10.5 + (5 if r % 2 else 0); px = cx + s * d * math.cos(rot); py = 4 + d * math.sin(abs(rot)) + 1.5 - r * 2.2
                if d < 68: box(px, py, -10 - r * 1.2, 9.5, 3.2, 3, WALL if (k + r) % 2 else OAK, 0.6, rot)
    for k in range(-4, 5):                                                          # geschnitztes Blattwerk am Giebelrand
        x = cx + k * 13; y = 30 - (4 - abs(k)) * 5.0
        S(x - 2.5, y, -14, 3.6, LEAF, 4.4, 2.0); S(x + 2.5, y - 1, -14.5, 3.2, LEAFL, 3.8, 1.8); S(x, y + 2.2, -15, 1.4, WALL)
    S(cx, 4, -10, 4.5, WALL, 4.5, 3.4); S(cx + 4, 2, -11, 2.2, BIRDL); S(cx + 7, 2.4, -11.5, 1.2, BEAK, 1.6, 0.9)  # Vögelchen auf dem First
    box(cx, 42, -8, 26, 22, 3, OAK, 0.6); box(cx, 42, -9.5, 20, 16, 2, VOID, 0.2)     # Türrahmen, dunkle Öffnung
    tube((cx - 12, 53), (cx + 12, 53), 1.0, 1.0, OAK, -11, -11)                      # Sitzstange
    for s in (-1, 1): curve([(cx + s * 14, 66), (cx + s * 22, 58), (cx + s * 26, 50), (cx + s * 25, 45)], 1.5, 0.9, BONE, -10)   # Geweih
    for s in (-1, 1): curve([(cx + s * 22, 58), (cx + s * 29, 56)], 1.1, 0.7, BONE, -10); curve([(cx + s * 25, 51), (cx + s * 31, 48)], 1.0, 0.6, BONE, -10)
    ring(cx, 70, -9.5, 18, 1.8, GOLD); disc(cx, 70, -9.4, 16.5, 1.4, CREAM)        # Zifferblatt (Zeiger malt das Spiel)
    for i in range(12): a = i * math.pi / 6; S(cx + math.sin(a) * 13.5, 70 - math.cos(a) * 13.5, -10.4, 1.0 if i % 3 else 1.4, INK)
    for s in (-1, 1): S(cx + s * 30, 72, -10, 4.0, WALL, 3.0, 5.0); S(cx + s * 30, 72, -12, 1.6, RED)   # Rosetten
    shot('house')

def bird(openb):  # 32×24, nach rechts
    mats()
    S(14, 13, 0, 8.5, BIRD, 8.5, 5.4); S(13, 16, -1.5, 6.5, BIRDL, 6.5, 3.4)        # Leib, Brust
    S(10, 12, -3, 6.2, BIRDD, 6.5, 3.2, (0, math.radians(-12), 0))                 # Flügel
    S(4, 10, 0, 5.0, BIRDD, 5.0, 1.6, (0, math.radians(18), 0))                    # Schwanz
    S(22, 8, -1, 5.0, BIRD)                                                        # Kopf
    S(24, 6.5, -4.4, 1.3, M('#fcfcfc', 0.3)); S(24.6, 6.5, -5.4, 0.7, EYE)          # Auge
    up, lo = (math.radians(-14), math.radians(22)) if openb else (math.radians(-3), math.radians(4))
    o = add('k', 29, 8.5 - (1.2 if openb else 0.3), -1, 1.4, 1.4, 3.4, BEAK, (0, 0, 0)); o.rotation_euler = (0, math.radians(-90) + up, 0)
    o = add('k', 28.5, 10 + (1.4 if openb else 0.2), -1, 1.1, 1.1, 2.8, M('#d89000', 0.45), (0, 0, 0)); o.rotation_euler = (0, math.radians(-90) + lo, 0)
    shot('bird%d' % (1 if openb else 0))

def bob():  # 28×28 Pendelgewicht
    mats(); disc(14, 14, 0, 12.5, 3, GOLDD, 48, 0.6); disc(14, 14, -1.6, 11, 1.2, GOLD, 48, 0.3)
    for i in range(8): a = i * math.pi / 4; S(14 + math.cos(a) * 6, 14 + math.sin(a) * 6, -2.6, 2.2, GOLD, 2.2, 1.0)
    S(14, 14, -3, 2.6, M('#fce890', 0.2, 0.9)); shot('bob')

def cone():  # 10×16 Tannenzapfen-Gewicht
    mats(); tube((5, 0), (5, 2.5), 0.5, 0.5, IRONL, 0)
    for k in range(6): y = 3 + k * 2.1; r = 3.6 - abs(k - 2.2) * 0.55; S(5, y, 0, r, WAL if k % 2 else WALL, r, 1.6)
    S(5, 14.5, 0, 1.2, WALD); shot('cone')

def dial():  # 188×188: Messingrand, cremefarbenes Blatt, Minutenstriche, römische Ziffern
    mats(); c = 94
    ring(c, c, 0, 91, 2.6, BRASS); ring(c, c, -0.5, 86.5, 1.4, BRASSD); disc(c, c, 1.0, 88, 2, CREAM, 96, 0.4)
    ring(c, c, -0.4, 77, 0.6, INK); ring(c, c, -0.4, 60, 0.5, INK)
    for i in range(60):
        a = i * math.pi / 30; big = i % 5 == 0; r0, r1 = (78, 85) if big else (81, 85)
        box(c + math.sin(a) * (r0 + r1) / 2, c - math.cos(a) * (r0 + r1) / 2, -0.4, 2.0 if big else 0.9, r1 - r0, 0.8, INK, 0, a)
    nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
    for i, s in enumerate(nums): a = i * math.pi / 6; text(c + math.sin(a) * 68.5, c - math.cos(a) * 68.5, -0.6, s, 9.5, INK, a)
    for i in range(12): a = i * math.pi / 6 + math.pi / 12; S(c + math.sin(a) * 47, c - math.cos(a) * 47, -0.2, 1.4, BRASSD, 1.4, 0.6)   # Zierpunkte
    shot('dial')

def hand():  # 96×14, Achse bei (22, 7), Spitze rechts
    mats(); y = 7
    disc(8, y, 0, 6.8, 3, IRON, 32, 0.5); S(8, y, -1.8, 3.4, IRONL, 3.4, 1.2); S(8, y, -2.6, 1.2, GOLD)                     # Gegengewicht
    prism(50, y, 0, [(-28, -3.4), (18, -2.2), (32, -5.6), (40, 0), (32, 5.6), (18, 2.2), (-28, 3.4)], 2.6, IRON, 0.5)   # Zeigerblatt mit Lanzenspitze
    prism(86, y, -0.4, [(-6, -2.6), (0, 0), (-6, 2.6), (-3.5, 0)], 1.4, IRONL, 0.2)                 # Lanzenspitze heller
    S(66, y, -1.4, 3.2, IRONL, 3.2, 1.2); S(66, y, -2.2, 1.4, GOLD)                                  # Zierknoten
    disc(22, y, -1.0, 5.0, 3.2, GOLD, 32, 0.5); S(22, y, -2.8, 1.6, GOLDD)                          # Achsring
    shot('hand')

def hub():  # 40×40 Stachelnabe (Zahnrad mit spitzen Zähnen)
    mats(); prism(20, 20, 0, gear_pts(10, 19.5, 12.5, True), 5, IRON, 0.5)
    disc(20, 20, -2.2, 11.5, 1.6, IRONL, 40, 0.4); disc(20, 20, -3.0, 5.5, 1.6, GOLD, 32, 0.4); S(20, 20, -4, 1.6, GOLDD)
    for i in range(10): a = (i + 0.5) * 2 * math.pi / 10; S(20 + math.cos(a) * 15, 20 + math.sin(a) * 15, -2, 0.9, M('#c8c8d8', 0.2, 0.9))
    shot('hub')

def gear(name, size, teeth, ro, ri, mat, matd, holes):
    mats(); c = size / 2
    prism(c, c, 0, gear_pts(teeth, ro, ri), 6, mat, 0.6)
    disc(c, c, -3.2, ri - 5, 1.2, matd, 64, 0.4)
    for i in range(holes): a = 2 * math.pi * i / holes; disc(c + math.cos(a) * (ri - 5) * 0.58, c + math.sin(a) * (ri - 5) * 0.58, -3.4, (ri - 5) * 0.26, 2.0, VOID, 32, 0.3)
    disc(c, c, -4.4, ri * 0.24, 2.4, mat, 32, 0.5); S(c, c, -5.6, ri * 0.09, IRON)
    shot(name)

def lathe(cx, prof, mat, y=0.0, n=40):  # Rotationskörper: prof = [(py, Radius), ...] von oben nach unten
    m = len(prof) - 1
    def f(u, v):
        py, r = prof[min(m, int(round(v * m)))]; th = u * 2 * math.pi
        return (cx + math.cos(th) * r, py, y + math.sin(th) * r)
    return grid(f, n, m, mat)

def bell():  # 64×96: Glocke mit Krone, Drehpunkt bei (32, 6); Profil wie die gezeichnete (Schulter, Flanke, ausgestellter Schlagring)
    mats(); cx = 32; top = 6; bh = 90; bw = 64
    BR, BRD, BRL = M('#b8862c', 0.32, 0.9), M('#6c4414', 0.45, 0.85), M('#e8c070', 0.25, 0.95)
    prof = lambda k: 0.18 + 0.12 * (k / 0.08) if k < 0.08 else 0.30 + 0.05 * (k - 0.08) / 0.67 if k < 0.75 else 0.35 + 0.15 * ((k - 0.75) / 0.25) ** 1.6
    P = [(top + k / 60 * bh, min(0.5, prof(k / 60)) * bw * 0.98) for k in range(61)]
    lathe(cx, [(top - 0.5, 0.1)] + P, BR, 0, 48)
    for k, t in ((0.3, 1.0), (0.34, 0.8), (0.8, 1.1), (0.93, 1.2)): ringh(cx, top + k * bh, 0, min(0.5, prof(k)) * bw * 0.985, t, BRD)   # Zierbänder
    for i in range(9): S(cx - 18 + i * 4.5, top + 0.47 * bh, -min(0.5, prof(0.47)) * bw * 0.9, 0.9, BRD)                            # Inschrift (Punkte)
    disc(cx, top + 0.6 * bh, -21.2, 4.2, 1.2, BRD, 32, 0.3); disc(cx, top + 0.6 * bh, -21.9, 3.2, 0.8, BRL, 32, 0.3); S(cx, top + 0.6 * bh, -22.6, 1.2, BRD)   # Medaillon
    for dx in (-5, 0, 5): ring(cx + dx, top - 2, 0, 3.0, 1.2, BRD)                                                                 # Krone (Henkel)
    tube((cx - 8, top - 0.5), (cx + 8, top - 0.5), 1.4, 1.4, BRD, 0, 0)
    shot('bell')

def trolley(ph):  # 24×14: Laufkatze, Schienenhöhe bei y 4; zwei Räder (Speichen um 45° versetzt), Messinggehäuse, Gehänge
    mats()
    for wx in (7, 17):
        disc(wx, 4, -1.5, 3.2, 2.2, IRON, 24, 0.3); disc(wx, 4, -2.8, 1.0, 1.0, IRONL, 12, 0.2)
        for k in range(2): a = ph * math.pi / 4 + k * math.pi / 2; box(wx, 4, -2.7, 0.7, 5.6, 0.6, IRONL, 0, a)
    box(12, 8, 0, 18, 5, 6, BRASS, 0.8); box(12, 6.1, -3.2, 16, 1, 0.8, M('#fce0a0', 0.3, 0.9), 0)
    S(5, 8, -3.2, 0.8, BRASSD); S(19, 8, -3.2, 0.8, BRASSD)
    tube((12, 10.5), (12, 13), 1.0, 1.0, IRONL, 0, 0)
    shot('trolley%d' % ph)

def rail():  # 32×9 kachelbar: Eichenbalken (y 0..6) mit eiserner Laufschiene (y 5..7), eine Niete
    mats()
    box(16, 3, 0, 32.02, 6, 6, M('#4c3018', 0.6), 0); box(16, 0.6, -3.05, 32.02, 0.9, 0.2, M('#8c6438', 0.5), 0)
    for gy in (2.0, 3.6): box(16, gy, -3.1, 32.02, 0.35, 0.1, M('#3c2410', 0.7), 0)                                  # Maserung
    box(16, 6.2, -1.0, 32.02, 2.0, 5, IRONL, 0); box(16, 5.4, -3.6, 32.02, 0.5, 0.2, M('#e8e8f0', 0.2, 0.9), 0)
    S(16, 3, -3.4, 1.0, IRON, 1.0, 0.6)
    shot('rail')

def lion():  # 14×20: Löwenkopf-Düse aus Eisen, Maul nach rechts (Strahl nach rechts); y 1..19
    mats(); IRD, IRM = M('#2c2834', 0.45, 0.8), M('#4c4858', 0.38, 0.85)
    box(5, 10, 1, 8, 19, 4, IRD, 0.6)                                                           # Wandplatte
    for i in range(9): a = -math.pi / 2 + i * math.pi / 8; S(7 + math.cos(a) * 5.2, 10 + math.sin(a) * 6.2, -2, 2.0, IRM, 2.0, 1.4)   # Mähne
    S(8, 10, -3.2, 4.2, IRM, 3.8, 2.6)                                                           # Kopf
    S(10.5, 11.5, -4.6, 2.6, IRM, 2.2, 1.6)                                                      # Schnauze
    S(9.2, 7.6, -5.4, 0.8, M('#c83c1c', 0.3, 0, 0.8)); S(11.6, 7.6, -5.2, 0.6, M('#c83c1c', 0.3, 0, 0.8))   # glühende Augen
    S(12.4, 12.6, -4.6, 1.5, VOID, 1.2, 1.2)                                                     # offenes Maul
    shot('lion')

SS = CFG.get('ss', 6); W = CFG.get('what') or ['house', 'bird', 'bob', 'cone', 'dial', 'hand', 'hub', 'gears', 'bell', 'trolley', 'rail', 'lion']
os.makedirs(CFG['out'], exist_ok=True)
if 'house' in W: stage(128, 96, SS); house()
if 'bird' in W: stage(32, 24, SS); bird(False); bird(True)
if 'bob' in W: stage(28, 28, SS); bob()
if 'cone' in W: stage(10, 16, SS); cone()
if 'dial' in W: stage(188, 188, max(3, SS // 2)); dial()
if 'hand' in W: stage(96, 14, SS); hand()
if 'hub' in W: stage(40, 40, SS); hub()
if 'bell' in W: stage(64, 96, SS); bell()
if 'trolley' in W: stage(24, 14, SS); trolley(0); trolley(1)
if 'rail' in W: stage(32, 9, SS); rail()
if 'lion' in W: stage(14, 20, SS); lion()
if 'gears' in W:
    stage(112, 112, max(3, SS // 2)); mats(); gear('gearB', 112, 24, 54, 46, BRASS, BRASSD, 6)
    stage(64, 64, SS); mats(); gear('gearS', 64, 14, 30, 24, IRON, IRONL, 4)
print('done', W)
