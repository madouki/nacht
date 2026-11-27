# Der Kolosseum-Direktor (Ansager der Gladiatorenprüfung, js/arena.js) in Blender: Zirkusdirektor mit rotem Frack, goldenen
# Brandenburgern und Schulterstücken, weißer Reithose, Schaftstiefeln, Zylinder mit rotem Band, gezwirbeltem Schnauzbart, Fliege,
# goldenem Sprachrohr und Spazierstock. Bild 44×56 Spielpixel, Füße unten in der Mitte (22/56), Blick nach rechts (3/4 von vorn).
# Posen: idle0/idle1 (Atmen), ruf (Sprachrohr am Mund, Ansage), jubel (beide Arme hoch). SS-fach überabgetastet.
# Aufruf: python bl.py direktor_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_direktor", "ss": 8}'; danach pack_direktor.py
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))   # stage, shot, box, prism, disc, ring, ringh, curve, lathe, M, S, tube …

def direktor(pose):
    mats()
    SKIN, SKIND, LIP, EYEW, PUP = M('#e8b088', 0.55), M('#c88c68', 0.6), M('#a85848', 0.5), M('#fcfcfc', 0.3), M('#1c1c24', 0.2)
    RED, REDD, GOLD, WHITE, BLK, BLKS = M('#c41c2c', 0.45), M('#8c1420', 0.5), M('#f2c040', 0.25, 0.85), M('#f4f0e8', 0.55), M('#1c1820', 0.5), M('#16141c', 0.12, 0.2)
    HAIR, CHEEK = M('#2c1810', 0.35), M('#f08888', 0.6)
    dy = -0.6 if pose == 'idle1' else -0.8 if pose == 'jubel' else 0.0
    # Stiefel, Reithose
    for x, d in ((19.5, 1.2), (24.5, -1.2)):
        box(x + 1, 55.0, d - 0.6, 5.2, 2.0, 5.5, BLKS, 0.5)
        tube((x, 45), (x, 54), 1.7, 1.6, BLKS, d, d)
        tube((x, 37 + dy * 0.3), (x, 45.5), 1.9, 1.75, WHITE, d, d)
    # Frack: Leib, Schöße hinten, goldene Brandenburger, Knöpfe
    lathe(22, [(25.5 + dy, 4.2), (28 + dy, 5.6), (33 + dy, 5.4), (37 + dy, 5.1), (38 + dy, 4.6)], RED, 0, 32)
    prism(17.5, 40.5 + dy, 1.8, [(-2.2, -4.5), (2.0, -4.5), (1.4, 5.5), (-2.6, 4.0)], 1.4, REDD, 0.3)
    prism(19.8, 40.5 + dy, 3.0, [(-2.0, -4.5), (2.0, -4.5), (1.6, 5.0), (-2.2, 4.2)], 1.4, REDD, 0.3)
    for k in range(4):
        y = 27.6 + dy + k * 2.2
        curve([(19.8, y), (22.0, y + 0.3), (24.4, y)], 0.38, 0.38, GOLD, -5.2)
        S(19.6, y, -4.9, 0.55, GOLD); S(24.6, y, -4.9, 0.55, GOLD)
    ringh(22, 37 + dy, 0, 5.15, 0.55, BLK); box(23.6, 37 + dy, -5.0, 1.6, 1.4, 0.6, GOLD, 0.1)
    # Schulterstücke mit Fransen
    for sx, d in ((17.2, 1.5), (26.8, -1.5)):
        S(sx, 25.2 + dy, d, 1.9, GOLD, 1.9, 0.9)
        for k in range(4): tube((sx - 1.3 + k * 0.9, 25.8 + dy), (sx - 1.3 + k * 0.9, 27.6 + dy), 0.2, 0.2, GOLD, d - 0.5, d - 0.5, False)
    # Arme, Sprachrohr, Stock
    def arm(sh, el, ha, d):
        tube(sh, el, 1.55, 1.4, RED, d, d - 0.5); tube(el, ha, 1.4, 1.2, RED, d - 0.5, d - 1.2); ringh(ha[0], ha[1], d - 1.2, 1.25, 0.45, GOLD); S(ha[0] + 0.3, ha[1] + 0.5, d - 1.6, 1.2, WHITE)
    def horn(a, b, r0, r1):
        tube(a, b, r0, r1, GOLD, -3.5, -3.5); ring(b[0], b[1], -3.5, r1, 0.35, GOLD)
        S(b[0] - 0.15, b[1], -3.4, r1 * 0.75, M('#3c2808', 0.6), r1 * 0.75, 0.4)
    if pose == 'ruf':
        arm((26.5, 26 + dy), (29.5, 25 + dy), (26.8, 21.6 + dy), -2.5); horn((27.0, 21.5 + dy), (36.5, 17.5 + dy), 0.9, 3.2)
        arm((17.5, 26 + dy), (16.0, 31 + dy), (16.2, 35 + dy), 1.5); tube((16.0, 35 + dy), (14.0, 55), 0.45, 0.45, BLK, 0.5, 0.5); S(16.1, 34.4 + dy, 0.3, 0.9, GOLD)
    elif pose == 'jubel':
        arm((26.5, 26 + dy), (30.0, 21 + dy), (31.5, 15.5 + dy), -2.5); horn((31.5, 15.0 + dy), (36.5, 7.5 + dy), 0.8, 2.8)
        arm((17.5, 26 + dy), (14.5, 21 + dy), (13.0, 15.5 + dy), 1.5); tube((13.0, 15.5 + dy), (10.0, 5.5 + dy), 0.45, 0.45, BLK, 0.5, 0.5); S(9.8, 5.0 + dy, 0.5, 0.9, GOLD)
    else:
        arm((26.5, 26 + dy), (28.5, 30.5 + dy), (28.6, 34.5 + dy), -2.5); horn((28.8, 34.3 + dy), (35.0, 31.5 + dy), 0.8, 2.6)
        arm((17.5, 26 + dy), (16.0, 31 + dy), (16.2, 35 + dy), 1.5); tube((16.0, 35 + dy), (14.0, 55), 0.45, 0.45, BLK, 0.5, 0.5); S(16.1, 34.4 + dy, 0.3, 0.9, GOLD)
    # Hals, Kragen, Fliege
    tube((22, 22.5 + dy), (22, 25.5 + dy), 1.4, 1.5, SKIN, 0, 0)
    ringh(22, 24.6 + dy, 0, 2.2, 0.6, WHITE)
    for s in (-1, 1): prism(22.6 + s * 1.2, 25.0 + dy, -2.6, [(0, 0), (s * 1.6, -1.0), (s * 1.6, 1.0)], 0.6, BLK, 0.1)
    S(22.6, 25.0 + dy, -2.9, 0.5, BLK)
    # Kopf
    hx, hy, r = 22.6, 19.0 + dy, 4.4
    S(hx, hy, 0, r, SKIN)
    for ex in (hx + r * 0.05, hx + r * 0.62): S(ex, hy - r * 0.18, -r * 0.82, r * 0.17, EYEW); S(ex + r * 0.05, hy - r * 0.18, -r * 0.95, r * 0.09, PUP)
    for ex in (hx + r * 0.05, hx + r * 0.62): curve([(ex - 0.9, hy - r * 0.42), (ex + 0.9, hy - r * 0.48)], 0.3, 0.3, HAIR, -r * 0.88)   # Augenbrauen
    S(hx + r * 0.5, hy + r * 0.12, -r * 0.92, r * 0.24, SKIND)                                                  # Nase
    S(hx - r * 0.25, hy + r * 0.25, -r * 0.72, r * 0.22, CHEEK); S(hx + r * 0.95, hy + r * 0.25, -r * 0.55, r * 0.2, CHEEK)
    open_ = pose in ('ruf', 'jubel')
    S(hx + r * 0.32, hy + r * 0.62, -r * 0.8, r * 0.24, M('#5c1018', 0.5) if open_ else LIP, r * 0.22, r * (0.16 if open_ else 0.07))
    for s in (-1, 1): curve([(hx + r * 0.32, hy + r * 0.38), (hx + r * 0.32 + s * 2.3, hy + r * 0.42), (hx + r * 0.32 + s * 3.4, hy + r * 0.05), (hx + r * 0.32 + s * 3.2, hy - r * 0.18)], 0.6, 0.25, HAIR, -r * 0.82)   # Schnauzbart, gezwirbelt
    S(hx - r * 0.85, hy + r * 0.1, -r * 0.3, r * 0.32, HAIR, r * 0.3, r * 0.55)                                  # Koteletten
    # Zylinder mit Band und Schnalle
    tilt = (-0.8 if pose == 'jubel' else 0.0) + 1.9   # Zylinder sitzt auf dem Kopf
    lathe(22.2, [(3.5 + dy + tilt, 3.3), (5 + dy + tilt, 3.45), (12.2 + dy + tilt, 3.7)], BLKS, 0, 32)
    disc(22.2, 3.5 + dy + tilt, 0, 3.3, 0.5, BLKS)
    ringh(22.2, 11.2 + dy + tilt, 0, 3.75, 0.7, RED); box(24.6, 11.2 + dy + tilt, -3.3, 1.6, 1.4, 0.5, GOLD, 0.1)
    lathe(22.2, [(12.6 + dy + tilt, 6.4), (13.4 + dy + tilt, 6.4)], BLKS, 0, 32)
    shot('direktor_' + pose)

SS = CFG.get('ss', 8)
os.makedirs(CFG['out'], exist_ok=True)
for pose in ('idle0', 'idle1', 'ruf', 'jubel'): stage(44, 56, SS); direktor(pose)
print('ok')
