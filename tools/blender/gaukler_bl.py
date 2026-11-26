# Lunatus, der Mondgaukler (Endboss der Mondfeste auf der Mondinsel, js/gaukler.js): ein schlaksiger Narr mit einem Gesicht wie
# eine Mondsichel, Schellenkappe mit drei Zipfeln, Halskrause, Rauten-Wams in Nachtblau und Silber, zweifarbige Strümpfe und
# Schnabelschuhe mit Glöckchen. Er balanciert auf einer Zirkuskugel mit Sternen (eigenes Bild, vier Drehstellungen).
# Figur 64×88 (Füße unten Mitte), Blick nach rechts (das Spiel spiegelt); Kugel 44×44.
# Posen: idle0/idle1 (balanciert, Arme seitlich), roll (vorgebeugt, rollt), juggle0/juggle1 (Arme abwechselnd oben – die Sterne
# zeichnet das Spiel), throw (wirft nach vorn), hop (Arme hoch, in den Knien), dizzy (sitzt benommen auf der Kugel), bow (Verbeugung)
# Aufruf: python bl.py gaukler_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_gaukler", "ss": 8}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))

ARMS = {  # Hände relativ zur Brust (x nach rechts, y nach unten): links, rechts
    'idle0': ((-17, -2), (17, -4)), 'idle1': ((-17, -5), (17, -1)), 'roll': ((-15, 8), (-9, 12)), 'juggle0': ((-8, -15), (10, -4)),
    'juggle1': ((-10, -4), (8, -15)), 'throw': ((-12, 5), (21, -3)), 'hop': ((-10, -17), (10, -17)), 'dizzy': ((-9, 18), (9, 18)), 'bow': ((-16, -7), (3, 7)),
}

def lunatus(pose):
    mats()
    BLUE, BLUED, SILV, WHITE, GOLDB = M('#2c3ca8', 0.5), M('#1c2470', 0.55), M('#c8ccdc', 0.3, 0.6), M('#f4f4fc', 0.6), M('#f0c030', 0.22, 0.9)
    MOON, INK, CHEEK = M('#f6eaa8', 0.45, 0, 0.7), M('#1c1c2c', 0.3), M('#f09898', 0.6)
    crouch = {'roll': 7, 'hop': 6, 'dizzy': 14, 'bow': 3}.get(pose, 0)
    lean = {'roll': 7, 'bow': 10, 'throw': 3, 'idle1': 1}.get(pose, 0)
    fx = 32; hipY = 60 + crouch; chestY = 40 + crouch; neckY = 35 + crouch; cx = fx + lean * 0.35
    # Beine: links nachtblau, rechts silbern; Schnabelschuhe mit Glöckchen
    if pose == 'dizzy':
        for side, d, m in ((-1, 2, BLUE), (1, -2, SILV)):
            tube((cx + side * 2, hipY + 1), (cx + 9 + side, hipY + 9), 2.4, 2.0, m, d); tube((cx + 9 + side, hipY + 9), (cx + 15 + side, 84), 2.0, 1.6, m, d)
            curve([(cx + 13 + side, 86), (cx + 19 + side, 86), (cx + 22 + side, 83.5), (cx + 22.5 + side, 81)], 1.6, 0.6, BLUED, d - 1); S(cx + 22.6 + side, 80.6, d - 1, 1.1, GOLDB)
    else:
        for side, d, m in ((-1, 2, BLUE), (1, -2, SILV)):
            hx, fxx = cx + side * 3, fx + side * 5; kx, ky = fx + side * 4 + crouch * 0.3, (hipY + 87) / 2 - crouch * 0.2
            tube((hx, hipY), (kx, ky), 2.4, 2.0, m, d); tube((kx, ky), (fxx, 84.5), 2.0, 1.6, m, d)
            curve([(fxx - 2, 86.2), (fxx + 4, 86.2), (fxx + 7, 83.6), (fxx + 7.5, 81)], 1.7, 0.6, BLUED if side < 0 else BLUE, d - 1); S(fxx + 7.6, 80.5, d - 1, 1.1, GOLDB)
    # Wams mit Rauten, Gürtel mit Glöckchen
    lathe(cx, [(chestY, 6.2), (chestY + 8, 5.6), (hipY - 4, 4.4), (hipY, 5.4)], BLUE, 0, 32)
    for r in range(3):
        for k in range(2):
            dy = chestY + 3 + r * 6; dx = cx - 2.4 + k * 4.8 + (2.4 if r % 2 else 0) - 2.4
            prism(dx, dy, -5.6 + r * 0.3, [(0, -2.8), (2.2, 0), (0, 2.8), (-2.2, 0)], 0.8, SILV if (r + k) % 2 == 0 else BLUED, 0.1)
    ringh(cx, hipY - 3, 0, 4.8, 0.9, GOLDB); S(cx + 1, hipY - 1, -5.0, 1.0, GOLDB)
    for k in range(4): S(cx - 4 + k * 2.6, hipY + 1.6, -4.4, 1.3, BLUE if k % 2 else SILV)            # Zacken am Saum
    # Halskrause
    for k in range(12):
        a = k / 12 * math.tau; S(cx + math.cos(a) * 6.8, neckY + 1.2, math.sin(a) * 6.8, 2.3, WHITE, 2.3, 1.6)
    # Arme mit Puffärmeln und weißen Handschuhen
    (lx, ly), (rx, ry) = ARMS[pose]
    for side, (hx_, hy_), d, m in ((-1, (lx, ly), 2.5, SILV), (1, (rx, ry), -2.5, BLUE)):
        sx, sy = cx + side * 6, chestY + 1; ex, ey = cx + hx_, chestY + hy_; mx, my = (sx + ex) / 2 + side * 1.5, (sy + ey) / 2 + 2
        S(sx, sy, d, 3.2, m); tube((sx, sy), (mx, my), 1.6, 1.4, m, d); tube((mx, my), (ex, ey), 1.4, 1.3, m, d)
        ringh(ex, ey + 0.5, d, 1.6, 0.5, WHITE); S(ex, ey - 0.6, d - 0.4, 2.0, WHITE)
    # Kopf: Mondsichel, die sich nach rechts öffnet; Gesicht an der Innenkante
    hcx, hcy = cx + lean * 0.5, neckY - 12
    curve([(hcx + 5, hcy - 10), (hcx - 3, hcy - 8), (hcx - 7, hcy - 2), (hcx - 7.4, hcy + 1)], 0.8, 3.8, MOON, 0)
    curve([(hcx - 7.4, hcy + 1), (hcx - 6.6, hcy + 5), (hcx - 2.5, hcy + 9), (hcx + 5, hcy + 10)], 3.8, 0.8, MOON, 0)
    S(hcx - 4.6, hcy + 0.5, 0, 3.6, MOON, 3.4, 5.4)
    S(hcx - 0.4, hcy + 1.4, -1.6, 2.6, MOON, 1.6, 1.5)                                                  # Nase
    if pose == 'dizzy': S(hcx - 3.4, hcy - 3.0, -3.2, 1.3, WHITE)
    else: curve([(hcx - 5.0, hcy - 3.2), (hcx - 3.6, hcy - 4.2), (hcx - 2.2, hcy - 3.2)], 0.45, 0.45, INK, -3.4)   # fröhlich geschlossenes Auge
    curve([(hcx - 4.0, hcy + 5.0), (hcx - 2.4, hcy + 6.2), (hcx - 0.8, hcy + 5.4)], 0.5, 0.5, INK, -3.0)       # Lächeln
    S(hcx - 5.2, hcy + 2.8, -2.6, 1.3, CHEEK, 1.0, 0.8)
    # Schellenkappe auf der oberen Spitze, drei Zipfel mit Glöckchen
    tilt = 6 if pose == 'bow' else 3 if pose == 'hop' else 0
    bx, by = hcx - 2, hcy - 9
    ringh(bx, by + 0.5, 0, 4.0, 1.1, GOLDB)
    for (tx, ty, m, d) in ((-12, -10, BLUE, 1.5), (-1 + tilt, -17, SILV, 0.0), (10 + tilt, -11, BLUE, -1.5)):
        pts = [(bx, by), (bx + tx * 0.45, by + ty * 0.7), (bx + tx * 0.9, by + ty * 0.95), (bx + tx, by + ty * 0.75)]
        curve(pts, 3.0, 0.9, m, d); S(bx + tx, by + ty * 0.75 + 1.6, d, 1.7, GOLDB)
    shot('gaukler_' + pose)

def kugel(k):  # Zirkuskugel mit vier Sternen, k-te Drehstellung (je 22,5°)
    mats(); BALL, BAND, STAR, HL = M('#3a2c8c', 0.35), M('#c8ccdc', 0.3, 0.6), M('#f8d048', 0.3, 0, 1.6), M('#fcfcff', 0.2)
    S(22, 22, 0, 20, BALL)
    ring(22, 22, -0.5, 20.2, 0.9, BAND)
    for j in range(4):
        a = math.radians(k * 22.5 + j * 90); x, y = 22 + math.cos(a) * 12, 22 + math.sin(a) * 12; z = -math.sqrt(max(0.0, 400 - 144)) + 1.5
        pts = [(math.cos(math.radians(i * 36 - 90) + a) * (4.6 if i % 2 == 0 else 2.0), math.sin(math.radians(i * 36 - 90) + a) * (4.6 if i % 2 == 0 else 2.0)) for i in range(10)]
        prism(x, y, z, pts, 1.2, STAR, 0.1)
    S(15, 14, -15, 3.4, HL, 2.0, 2.2)
    shot('gaukler_ball%d' % k)

SS = CFG.get('ss', 8)
os.makedirs(CFG['out'], exist_ok=True)
for pose in ARMS: stage(64, 88, SS); lunatus(pose)
for k in range(4): stage(44, 44, SS); kugel(k)
print('ok')
