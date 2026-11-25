# Walross Waldemar (Zwischengegner im Eiskeller, js/walross.js): ein Kellermeister von einem Walross – speckige, faltige Haut,
# buschiger Schnauzbart, zwei lange Stoßzähne, Monokel an einer Goldkette und ein rot-weiß gestreifter Strickschal. Blick nach
# rechts (das Spiel spiegelt). Bildfeld 96×56, Bauch unten auf dem Boden.
# Posen: idle0, idle1 (schnauft, Bart wippt), slide (Bauchrutscher, flach gestreckt), rear (aufgerichtet, Kopf hoch),
#        slam (Stoßzähne ins Eis), clap (aufgerichtet, Flossen vor der Brust zusammen)
# Aufruf: python bl.py walross_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_walross", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def walross(pose):
    SKIN, SKIN2, SKIN3 = M('#7c4e3c', 0.88, 0, 0, 0.16, 0.12), M('#5c3628', 0.9, 0, 0, 0.12), M('#9a6a54', 0.88, 0, 0, 0.14)
    MUZ, BRISTLE, IVORY = M('#a8806a', 0.85, 0, 0, 0.15), M('#8c7462', 0.9, 0, 0, 0.1), M('#f2ead2', 0.3, 0, 0, 0.55)
    EYE, GLINT, GOLD = M('#100808', 0.15), M('#ffffff', 0.2, 0, 2.0), M('#e0b040', 0.22, 0.95)
    RED, CREAM, FLIP = M('#b02828', 0.85, 0, 0, 0.3, 0.5), M('#ece0c8', 0.85, 0, 0, 0.3, 0.5), M('#5c3a2c', 0.7)
    up = pose in ('rear', 'clap'); slide = pose == 'slide'; slam = pose == 'slam'; i1 = pose == 'idle1'
    # Rumpf: hinten flach am Boden, vorn die Brust; aufgerichtet steht die Brust hoch
    if slide:
        S(42, 44, 0.5, 34, SKIN, 15, 11.5); S(70, 41, 0.0, 14, SKIN, 13, 11)
        hx, hy = 84, 38
    elif up:
        S(36, 44, 0.5, 26, SKIN, 15, 12); S(56, 33, 0.0, 15, SKIN, 14, 18); S(60, 20, -0.5, 11, SKIN, 12, 11)
        hx, hy = 66, 13
    elif slam:
        S(38, 41, 0.5, 30, SKIN, 15, 14.5); S(64, 40, 0.0, 15, SKIN, 13.5, 14)
        hx, hy = 78, 40
    else:
        S(38, 40, 0.5, 30, SKIN, 15, 15.5); S(62, 34, 0.0, 15, SKIN, 14, 15)
        hx, hy = 74, 25 - (1.2 if i1 else 0)
    # Speckfalten am Hals und auf dem Rücken
    for k in range(4):
        a = -0.7 + k * 0.35
        S(hx - 12 + k * 1.2, hy + 9 + k * 2.2, -9.5 + k * 0.5, 7.5 - k, SKIN2, 0.7, 1.0, (0, a, 0))
    for k, (fx, fy, fr) in enumerate(((24, 38, 3.2), (34, 44, 2.4), (46, 36, 2.8), (18, 46, 2.0), (52, 46, 2.2))): S(fx + (4 if slide else 0), fy + (3 if slide else 0), -14.6, fr, SKIN3 if k % 2 else SKIN2, 0.5, fr * 0.7)   # Flecken
    for k in range(3): S(22 + k * 10, 28 + (k == 1) * -1 + (4 if slide else 0) + (5 if up else 0), -6, 4.5, SKIN3, 1.0, 0.7)
    # Kopf, Schnauzpolster, Bart, Stoßzähne
    S(hx, hy, -1.0, 12.5, SKIN, 11.0, 11.0)
    mx, my = hx + 9, hy + 6
    S(mx, my, -2.5, 6.5, MUZ, 7.0, 5.0); S(mx - 1.5, my + 1.5, -6.0, 5.5, MUZ, 5.0, 4.6)
    for k in range(5): S(mx + 2 + (k % 2), my - 2 + k * 1.6, -9.6, 0.55, EYE)                    # Barthaar-Grübchen
    sway = 1.0 if i1 else 0.0
    for k in range(9):                                                                         # buschiger Schnauzbart
        bx = mx - 4 + k * 1.2; tube((bx, my + 2.5), (bx - 0.4 + sway * (k % 2), my + 6.5 + (k % 3) * 0.8), 0.7, 0.35, BRISTLE, -7.0 - (k % 2) * 0.8, caps=True)
    tl = 11 if not up else 12
    if slam: t1, t2 = (mx - 1, my + 4), (mx - 3, 55.5)
    elif up: t1, t2 = (mx - 1, my + 4), (mx + 9, my + 4 + tl)
    elif slide: t1, t2 = (mx - 1, my + 3), (mx + 8, my + 10)
    else: t1, t2 = (mx - 1, my + 4), (mx + 2, my + 4 + tl)
    tube(t1, t2, 1.9, 0.5, IVORY, -9.5); tube((t1[0] - 1.5, t1[1]), (t2[0] - 1.5, t2[1] - 0.5), 1.8, 0.5, IVORY, -4.0)  # zwei Stoßzähne
    # Auge mit Monokel und Goldkette
    ex, ey = hx + 2, hy - 4
    S(ex, ey, -10.4, 1.6, EYE, 0.8, 1.7); S(ex + 0.5, ey - 0.6, -11.6, 0.5, GLINT)
    S(ex - 2.6, ey - 2.2, -8.6, 2.6, SKIN2, 0.6, 0.6)                                          # Brauenwulst
    for k in range(22):
        a = k / 22 * math.tau; S(ex + math.cos(a) * 3.1, ey + math.sin(a) * 3.1, -12.2, 0.5, GOLD)
    for k in range(10):
        t = k / 9; S(ex - 2.0 - t * 6, ey + 3 + t * 9 + math.sin(t * math.pi) * 2, -12.0 + t * 1.5, 0.38, GOLD)
    # Strickschal um den Hals (rot-weiß gestreift), ein Zipfel weht nach hinten
    nx, ny = hx - 8, hy + 10
    for k in range(9):
        S(nx + 1 + k * 0.5, ny - 5 + k * 1.5, -14.2 + abs(k - 4) * 0.5, 2.6, RED if k % 2 == 0 else CREAM, 1.6, 1.6)
    for k in range(5): S(nx - 3 - k * 2.4, ny + 4 + k * (1.6 if not slide else -0.2), -13.0 + k * 0.4, 1.9, RED if k % 2 == 0 else CREAM, 1.2, 1.6)
    # Flossen
    if pose == 'clap':
        for d in (-2.0, 2.0): S(hx + 5, hy + 18 + d * 0.3, -14.5 + d, 6.5, FLIP, 1.6, 3.2, (0, 0.9, 0))
    elif up:
        S(hx - 2, hy + 22, -14.5, 6.5, FLIP, 1.6, 3.0, (0, -0.4, 0))
    elif slide:
        S(54, 52, -13.0, 7.5, FLIP, 1.6, 2.4, (0, 0.25, 0))
    else:
        S(hx - 12, 51.5, -14.0, 7.5, FLIP, 1.6, 2.8, (0, 0.15, 0))
    tx = 8 if not slide else 6                                                                 # Schwanzflossen
    S(tx, 51 if not up else 52, -2.0, 6.0, FLIP, 3.5, 2.4, (0, 0.5, 0)); S(tx + 2, 53, 3.0, 5.0, FLIP, 3.0, 2.0, (0, -0.3, 0))

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('idle0', 'idle1', 'slide', 'rear', 'slam', 'clap'):
    name = 'walross_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(96, 56); walross(pose); shot(name)
print('ok')
