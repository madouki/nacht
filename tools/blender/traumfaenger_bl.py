# Traumfänger des Helden (Mahr-Fang, js/mahr.js): Reif mit Lederwicklung und Goldknoten, gewebtes Netz (sieben Anker, drei
# Schlaufenreihen) mit Glasperlen, ein Bergkristall in der Mitte, drei Schnüre mit Perlen und Eulenfedern.
# Bild 44×64 (Reifmitte bei 22/17), zwölf Drehstellungen um die senkrechte Achse (je 30°) und eine Leuchtmaske (nur Netz und
# Kristall, weiß), die das Spiel in der Farbe des gefangenen Mahrs aufleuchten lässt.
# Aufruf: python bl.py traumfaenger_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_tf", "ss": 8}'; danach pack_traumfaenger.py
import bpy, bmesh, math, os
from mathutils import Matrix
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))

CX, CY, RH, RW = 22, 17, 13.4, 11.9   # Reifmitte, Reifradius (Wulstmitte), Netzanker (innen)

def web_points():
    n = 7; loops = [[(CX + math.cos(-math.pi / 2 + i * math.tau / n) * RW, CY + math.sin(-math.pi / 2 + i * math.tau / n) * RW) for i in range(n)]]
    for k in range(3):
        q = loops[-1]; s = 0.80 - 0.04 * k
        loops.append([(CX + ((q[i][0] + q[(i + 1) % n][0]) / 2 - CX) * s, CY + ((q[i][1] + q[(i + 1) % n][1]) / 2 - CY) * s) for i in range(n)])
    return loops

def web(thread, glow=False):
    L = web_points(); n = len(L[0]); r = 0.40
    for k in range(len(L) - 1):
        for i in range(n):
            a, m, b = L[k][i], L[k + 1][i], L[k][(i + 1) % n]
            tube(a, m, r, r, thread, 0, 0, False); tube(m, b, r, r, thread, 0, 0, False)
    for m in L[-1]: tube(m, (CX, CY), r * 0.9, r * 0.9, thread, 0, 0, False)
    return L

def feather(x, y, length, tilt, VANE, TIP, BAR, QUILL):
    w = 2.5 if length > 18 else 2.2
    pts = [(0, 0)] + [(w * math.sin(math.pi * t) ** 0.7 * (1.0 if t < 0.85 else 0.8), length * t) for t in (0.08, 0.2, 0.35, 0.5, 0.65, 0.8, 0.92)] + [(0, length)]
    pts += [(-px, py) for px, py in reversed(pts[1:-1])]
    rot = math.radians(tilt)
    at = lambda f: (x - math.sin(rot) * length * f, y + math.cos(rot) * length * f)   # Punkt auf dem Kiel (Drehung um die Tiefenachse)
    prism(x, y, 0.15, pts, 0.5, VANE, 0.12, rot)
    tip = [(px, py - length * 0.70) for px, py in pts if py >= length * 0.70]
    tip = [(w * 1.02, length * 0.02)] + tip + [(-w * 1.02, length * 0.02)]
    tx, ty = at(0.70); prism(tx, ty, -0.25, tip, 0.35, TIP, 0.08, rot)
    for f in (0.42, 0.56):                                                               # zwei feine Querbänder
        bx, by = at(f)
        prism(bx, by, -0.3, [(-w * 0.95, -0.45), (w * 0.95, -0.45), (w * 0.95, 0.45), (-w * 0.95, 0.45)], 0.3, BAR, 0.05, rot)
    tube((x, y - 1.2), at(0.96), 0.38, 0.18, QUILL, -0.45, -0.45)

def catcher(ang, mask=False):
    mats()
    if mask:
        W_ = M('#ffffff', 0.5, 0, 4.0)
        web(W_); S(CX, CY, -0.4, 2.3, W_)
        return
    LEATHER, LEATHERD = M('#7c4a26', 0.62), M('#4c2a14', 0.7)
    GOLDK = M('#e8b838', 0.25, 0.9)
    THREAD = M('#f0e4c6', 0.55, 0, 0.35)
    CRYS = M('#dceaff', 0.06, 0, 0.7)
    TURQ, RUBY, AMBER = M('#3ccac0', 0.15), M('#d0383c', 0.15), M('#f0a030', 0.15)
    VANE, TIP, BAR, QUILL = M('#f4ecd8', 0.65), M('#4c3424', 0.6), M('#8c6c4c', 0.6), M('#d8c8a4', 0.5)
    # Reif: 40 Wickelstücke im Wechsel hell/dunkel, oben ein Goldknoten mit Aufhängeschlaufe
    n = 40
    for i in range(n):
        a0, a1 = i / n * math.tau, (i + 0.86) / n * math.tau
        p0 = (CX + math.cos(a0) * RH, CY + math.sin(a0) * RH); p1 = (CX + math.cos(a1) * RH, CY + math.sin(a1) * RH)
        tube(p0, p1, 1.32, 1.32, LEATHER if i % 2 else LEATHERD, 0, 0, i % 2 == 0)
    S(CX, CY - RH, -0.6, 1.9, GOLDK, 1.6, 1.6); ring(CX, CY - RH - 2.6, 0, 1.5, 0.42, GOLDK)
    for s in (-1, 1): S(CX + s * 2.4, CY - RH + 0.2, -0.4, 1.1, GOLDK)
    # Netz mit Glasperlen, Kristall in der Mitte
    L = web(THREAD)
    for (k, i, m) in ((1, 1, TURQ), (1, 4, RUBY), (2, 2, AMBER), (2, 6, TURQ), (3, 0, RUBY)):
        x, y = L[k][i]; S(x, y, -0.2, 0.95 if k < 3 else 0.85, m)
    S(CX, CY, -0.4, 2.3, CRYS, 2.3, 2.6); S(CX - 0.8, CY - 1.0, -2.4, 0.7, M('#ffffff', 0.05, 0, 2.0))
    # drei Schnüre mit Perlen und Federn
    for (dx, top, beadY, fy, fl, tilt, m) in ((-1, None, 31.5, 34.5, 19, 9, TURQ), (0, None, 36.0, 39.5, 23, 0, AMBER), (1, None, 31.5, 34.5, 19, -9, TURQ)):
        a = math.pi / 2 - dx * math.radians(38)
        hx, hy = CX + math.cos(a) * (RH + 1.0), CY + math.sin(a) * (RH + 1.0)
        fx = hx + dx * 1.2
        tube((hx, hy), (fx, beadY - 1.4), 0.32, 0.32, THREAD, 0, 0, False)
        S(fx, beadY, -0.2, 1.35, m); S(fx, beadY + 2.3, -0.2, 0.95, GOLDK)
        tube((fx, beadY + 2.8), (fx, fy), 0.3, 0.3, THREAD, 0, 0, False)
        feather(fx, fy, fl, tilt, VANE, TIP, BAR, QUILL)

def turn(ang):  # alles um die senkrechte Achse durch die Reifmitte drehen
    bpy.context.view_layer.update()
    R = Matrix.Rotation(math.radians(ang), 4, 'Z')
    for o in OBJ: o.matrix_world = R @ o.matrix_world

SS = CFG.get('ss', 8)
os.makedirs(CFG['out'], exist_ok=True)
for k in range(12):
    stage(44, 64, SS); catcher(k * 30); turn(k * 30); shot('tf_%02d' % k)
stage(44, 64, SS); catcher(0, True)
bpy.context.scene.world.node_tree.nodes.get('Background').inputs[1].default_value = 0.0
shot('tf_glow')
print('ok')
