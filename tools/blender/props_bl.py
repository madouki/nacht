# Requisiten für NACHTMAHR in Blender: Kerze (8×16 ×2), Fackel (12×20 ×2), Standleuchter (28×58 ×2, Kasten 24×48 bei 2/10),
# Feuerschale (32×68 ×3, Kasten 16×52 bei 8/16). Gedrechselte Teile als Rotationskörper, Flammen als leuchtende Tropfen.
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'what': [...]}.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))

def stage(w, h, ss):
    global FW, FH, SS
    FW, FH, SS = w, h, ss
    MATS.clear(); MESH.clear(); OBJ.clear()   # reset() räumt unbenutzte Materialien weg – die Merkliste darf sie nicht mehr kennen
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)   # Blender bezieht den Maßstab auf die längere Bildseite
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()
def curve(pts, r0, r1, mat, y=0.0, n=12):  # geschwungene Röhre durch Stützpunkte (Kugelkette, dicht)
    P = []
    for i in range(len(pts) - 1):
        for k in range(n): t = k / n; P.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t))
    P.append(pts[-1])
    for i, q in enumerate(P): t = i / (len(P) - 1); S(q[0], q[1], y, r0 + (r1 - r0) * t, mat)
def lathe(cx, prof, mat, y=0.0, n=28):  # Rotationskörper: prof = [(py, Radius), ...] von oben nach unten
    m = len(prof) - 1
    def f(u, v):
        py, r = prof[min(m, int(round(v * m)))]; th = u * 2 * math.pi
        return (cx + math.cos(th) * r, py, y + math.sin(th) * r)
    return grid(f, n, m, mat)
def mats():
    global GOLD, GOLDD, IRON, IRONL, WAX, F1, F2, F3, COAL, GLOW
    GOLD, GOLDD = M('#e8b030', 0.28, 0.85), M('#a87018', 0.35, 0.85)
    IRON, IRONL = M('#3c3848', 0.4, 0.8), M('#6c6880', 0.35, 0.8)
    WAX = M('#f4ecd4', 0.5, 0, 0.22)
    F1, F2, F3 = M('#fc5c1c', 0.4, 0, 2.6), M('#f8b800', 0.4, 0, 3.0), M('#fff4b0', 0.4, 0, 3.4)
    COAL, GLOW = M('#7c1c08', 0.8, 0, 0.9), M('#fc7c10', 0.5, 0, 2.4)
def flame(cx, by, h, w, lean=0.0, y=-0.5, core=True):  # Tropfenflamme: by = Fuß, h = Höhe, w = halbe Breite
    S(cx + lean * 0.25, by - h * 0.36, y, w, F1, w * 0.8, h * 0.4)
    S(cx + lean * 0.7, by - h * 0.66, y, w * 0.62, F1, w * 0.5, h * 0.3)
    S(cx + lean * 1.1, by - h * 0.86, y, w * 0.3, F1, w * 0.3, h * 0.16)
    S(cx + lean * 0.2, by - h * 0.3, y - 0.8, w * 0.62, F2, w * 0.5, h * 0.27)
    if core: S(cx, by - h * 0.2, y - 1.4, w * 0.34, F3, w * 0.3, h * 0.14)

def candle(ph):  # Messingleuchter mit Tropfschale, Wachskerze, Flamme
    mats(); cx = 4.0
    flame(cx, 4.9, 4.6 if ph == 0 else 4.0, 1.55, -0.5 if ph == 0 else 0.7)
    tube((cx, 4.7), (cx, 9.5), 1.35, 1.35, WAX, 0, 0, caps=False)
    S(cx - 1.1, 6.3, -0.9, 0.5, WAX, 0.5, 0.9)                                         # Wachstropfen
    lathe(cx, [(9.1, 2.0), (9.3, 3.3), (10.0, 3.4), (10.5, 1.3), (11.2, 0.8), (11.9, 1.6), (12.6, 0.8), (13.6, 0.8), (14.3, 1.5), (15.0, 2.9), (15.7, 3.4), (16.0, 3.4)], GOLD)

def torch(ph):  # eiserner Feuerkorb mit Goldrand auf einem Ständer, große Flamme
    mats(); cx = 6.0
    k = 1 if ph == 0 else -1
    flame(cx - 2.3, 7.0, 4.4 + k * 0.8, 1.6, -0.6 * k, 0.6, False); flame(cx + 2.3, 6.9, 4.6 - k * 0.9, 1.6, 0.7 * k, 0.6, False)
    flame(cx, 7.4, 7.2 - k * 0.3, 3.1, 0.7 * k, -0.4)
    S(cx, 6.9, 0, 4.4, COAL, 4.4, 0.9)
    lathe(cx, [(6.3, 4.5), (6.2, 5.4), (7.1, 5.5), (7.4, 4.9)], GOLD)
    lathe(cx, [(7.2, 5.0), (8.5, 4.0), (10.0, 2.6), (11.2, 1.5), (11.8, 1.0), (12.4, 1.6), (13.0, 0.9), (17.2, 0.9), (17.9, 1.4), (18.6, 2.6), (19.4, 3.6), (20.0, 3.8)], IRON)
    S(cx, 12.4, -1.2, 1.2, GOLD, 0.8, 0.5)                                              # Goldring am Schaft

def candelabra(ph):  # goldener Standleuchter mit fünf Kerzen (Kasten 24×48 liegt bei 2/10)
    mats(); cx = 14.0
    tops = [(4.0, 11.0), (9.0, 13.0), (14.0, 9.0), (19.0, 13.0), (24.0, 11.0)]
    for i, (x, t) in enumerate(tops):
        k = math.sin(ph * 2.6 + i * 1.9)
        flame(x, t + 0.3, 4.2 + k * 0.5, 1.35, 0.6 * k)
        tube((x, t), (x, t + 5.2), 1.15, 1.15, WAX, 0, 0, caps=False)
        lathe(x, [(t + 4.6, 1.5), (t + 4.9, 2.3), (t + 5.6, 2.3), (t + 6.2, 1.0), (t + 7.0, 0.8)], GOLD)   # Tülle mit Tropfteller
    for s in (-1, 1):   # geschwungene Arme
        mx = lambda x: cx + s * (cx - x)
        curve([(mx(14.0), 29.0), (mx(10.5), 31.0), (mx(6.0), 30.0), (mx(4.0), 25.5), (mx(4.0), 18.0)], 0.95, 0.8, GOLD, 0.0)
        curve([(mx(14.0), 25.0), (mx(11.4), 26.6), (mx(9.2), 25.0), (mx(9.0), 20.0)], 0.9, 0.8, GOLD, -0.6)
        S(mx(6.0), 30.2, -0.6, 1.3, GOLDD, 1.0, 1.0); S(mx(11.2), 26.6, -1.0, 1.1, GOLDD, 0.9, 0.9)       # Zierknäufe
    lathe(cx, [(15.8, 0.9), (17.5, 0.9), (19.0, 1.6), (20.5, 0.9), (23.5, 1.0), (25.0, 2.3), (29.0, 2.5), (30.5, 1.1), (34.0, 0.9), (35.5, 2.0),
               (37.5, 2.0), (39.0, 1.0), (44.0, 0.9), (45.5, 1.9), (47.0, 1.2), (49.5, 1.3), (51.0, 3.4), (53.0, 5.2), (54.5, 6.6), (55.6, 8.0), (56.6, 8.4), (58.0, 8.4)], GOLD)
    S(cx, 27.0, -2.4, 1.0, M('#c81830', 0.2, 0, 0.6))                                     # Rubin an der Nabe

def brazier(ph):  # eiserne Feuerschale auf einem Dreifuß (Kasten 16×52 liegt bei 8/16), fünf züngelnde Flammen
    mats(); cx = 16.0
    for k in range(5):
        a = ph * 2.1 + k * 1.7; h = 11.5 + math.sin(a) * 3.6 + math.sin(a * 2.3) * 1.8 + (2 - abs(k - 2)) * 1.6
        flame(7.0 + k * 4.5, 24.6, h, 3.0, math.sin(a * 1.3 + 1.0) * 1.3, 1.6 - (k % 2) * 2.0 - (1.2 if k == 2 else 0), k % 2 == 0)
    for i in range(9): S(5.4 + i * 2.65, 23.5 + (i % 2) * 0.5, -3.0 + (i % 3) * 2.2, 1.9, COAL if (i + ph) % 3 else GLOW)
    S(cx, 24.4, 0, 11.6, COAL, 11.6, 1.0)
    lathe(cx, [(23.4, 12.2), (23.0, 13.1), (24.0, 13.4), (24.7, 12.9)], GOLD)
    lathe(cx, [(24.5, 12.8), (26.0, 12.3), (27.6, 11.2), (29.2, 9.2), (30.6, 6.2), (31.6, 3.2), (32.4, 1.5), (33.4, 1.1), (48.5, 1.1), (49.6, 1.8), (50.6, 1.2)], IRON)
    lathe(cx, [(26.4, 12.25), (27.3, 11.6)], GOLDD)                                        # Zierband
    for i in range(7): S(cx + math.cos(0.45 + i * 0.37) * 12.3, 25.6, -math.sin(0.45 + i * 0.37) * 12.3, 0.75, GOLD)   # Nieten
    S(cx, 43.5, 0, 2.1, GOLD, 2.1, 1.3)
    curve([(cx, 50.0), (cx + 0.5, 58.0), (cx + 0.2, 66.6)], 1.0, 0.85, IRON, 5.0)          # hinteres Bein
    for s in (-1, 1):
        curve([(cx, 50.0), (cx + s * 3.6, 55.5), (cx + s * 6.4, 61.5), (cx + s * 7.0, 66.8)], 1.05, 0.9, IRONL if s < 0 else IRON, -2.2)
        S(cx + s * 7.4, 67.1, -2.4, 1.6, IRON, 1.5, 0.9)                                   # Klauenfuß
    lathe(cx, [(57.6, 4.6), (58.4, 4.7)], GOLDD)                                           # Strebenring

def run():
    os.makedirs(CFG['out'], exist_ok=True); what = CFG.get('what') or ['candle', 'torch', 'candelabra', 'brazier']
    if 'candle' in what:
        stage(8, 16, 24)
        for i in range(2): candle(i); shot('candle_%d' % i)
    if 'torch' in what:
        stage(12, 20, 24)
        for i in range(2): torch(i); shot('torch_%d' % i)
    if 'candelabra' in what:
        stage(28, 58, 12)
        for i in range(2): candelabra(i); shot('candelabra_%d' % i)
    if 'brazier' in what:
        stage(32, 68, 12)
        for i in range(3): brazier(i); shot('brazier_%d' % i)
    print('gerendert:', what)
run()
