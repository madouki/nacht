# Riegeltür für NACHTMAHR (Abkürzungen im Schloss): zweiflügelige Eichentür mit Rundbogen, Eisenbändern und Ringgriffen, fünf
# Öffnungswinkel (34×48), dazu der Riegelbalken (28×9), den das Spiel selbst zur Seite schiebt.
# Aufruf: python bl.py riegel_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_riegel", "ss": 8}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))
SS = CFG.get('ss', 8)

def stage(w, h):
    global FW, FH
    FW, FH = w, h
    MATS.clear(); MESH.clear(); OBJ.clear()
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()

R0, CX, CY, BOT, LW = 15.0, 17.0, 17.0, 48.0, 15.0   # Bogenradius, Bogenmitte, Unterkante, Flügelbreite
def top(px): return CY - math.sqrt(max(0.0, R0 * R0 - (px - CX) ** 2))

def leaf(hx, sgn, ang):
    a = math.radians(ang); ca, sa = math.cos(a), math.sin(a)
    def P(u, py, d):   # u: Abstand vom Scharnier, d: Tiefe (negativ = zur Kamera); der Flügel schwingt nach hinten auf
        return (hx + sgn * (u * ca - d * sa), py, u * sa + d * ca)
    tp = lambda u: top(hx + sgn * u)
    OAK = [M('#6e4628', 0.62), M('#5c3a20', 0.66), M('#7c5230', 0.58), M('#664024', 0.64)]
    DARK, IRON, IRONL, BRASS = M('#160e0a', 0.9), M('#34303c', 0.42, 0.85), M('#6c6880', 0.32, 0.85), M('#c89040', 0.3, 0.9)
    grid(lambda s, v: P(s * LW, tp(s * LW) + (BOT - tp(s * LW)) * v, 0.0), 10, 1, DARK)                     # dunkle Rückwand (die Fugen)
    n = 3
    for i in range(n):   # senkrechte Bohlen mit Fugen
        u0, u1 = i * LW / n + 0.22, (i + 1) * LW / n - 0.22
        grid(lambda s, v: P(u0 + (u1 - u0) * s, tp(u0 + (u1 - u0) * s) + (BOT - tp(u0 + (u1 - u0) * s)) * v, -1.0 - 0.18 * math.sin(s * math.pi)), 6, 2, OAK[(i * 2 + (sgn > 0)) % 4])
    grid(lambda s, v: P(LW, tp(LW) + (BOT - tp(LW)) * v, -1.0 + 1.0 * s), 1, 1, OAK[1])                      # Stirnkante des Flügels
    for py in (13.0, 28.0, 41.0):   # Eisenbänder: vom Scharnier ausgehend, zur Mitte spitz zulaufend
        L = LW - 1.2; hw = 1.6
        grid(lambda s, v: P(s * L, py + (v - 0.5) * 2 * hw * (1 - 0.72 * max(0.0, s - 0.74) / 0.26), -1.55), 14, 2, IRON)
        for k in range(4):   # Nieten
            u = 1.7 + k * 3.5; X = P(u, py, -1.95); S(X[0], X[1], X[2], 0.62, IRONL)
        X = P(L - 0.2, py, -1.75); S(X[0], X[1], X[2], 0.9, IRONL)   # Spitze
    for py in (20.5, 34.5):   # Ziernägel zwischen den Bändern
        for k in range(3):
            u = 3.0 + k * 4.4; X = P(u, py, -1.5); S(X[0], X[1], X[2], 0.42, IRONL)
    for k in range(14):   # Ringgriff
        th = k / 14 * 2 * math.pi; X = P(LW - 2.7 + math.sin(th) * 1.6, 25.0 + (1 - math.cos(th)) * 1.7, -2.0); S(X[0], X[1], X[2], 0.46, BRASS)
    X = P(LW - 2.7, 25.0, -1.7); S(X[0], X[1], X[2], 0.8, BRASS)

def door(ang):
    leaf(CX - LW, 1, ang); leaf(CX + LW, -1, ang)

def bolt():   # Riegelbalken mit Knauf, zwei Führungen malt das Spiel nicht – sie gehören zum Balken
    IRON, IRONL, BRASS = M('#3c3844', 0.38, 0.85), M('#7c788c', 0.3, 0.85), M('#d09c48', 0.28, 0.9)
    tube((2.5, 4.5), (25.5, 4.5), 1.75, 1.75, IRON, -1.0)
    tube((2.5, 3.9), (25.5, 3.9), 0.5, 0.5, IRONL, -2.4)
    for x in (7.5, 20.5):   # Führungen
        tube((x, 1.2), (x, 7.8), 1.25, 1.25, IRON, -2.6); S(x, 1.4, -3.2, 0.6, IRONL); S(x, 7.6, -3.2, 0.6, IRONL)
    tube((14.0, 4.5), (14.0, 0.9), 0.75, 0.75, IRONL, -2.6); S(14.0, 0.9, -3.2, 1.45, BRASS)   # Knauf

os.makedirs(CFG['out'], exist_ok=True)
stage(34, 48)
for i, ang in enumerate((0, 24, 46, 66, 84)):
    door(ang); shot('door_%d' % i)
stage(28, 9)
bolt(); shot('bolt_0')
print('ok')
