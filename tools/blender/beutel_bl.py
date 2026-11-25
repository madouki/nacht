# Klingelbeutel (Gegner in der Sonnenkathedrale): ein besessener Kollektenbeutel aus rotem Samt mit Goldring und Quaste, an einem
# langen Holzstab, darunter ein Messingglöckchen; aus der Öffnung schauen zwei gierig glühende Augen. Bildfeld 48×40, Beutel rechts.
# Posen: hover0, hover1 (Glöckchen schwingt), lunge (Stab gestreckt, Öffnung weit auf), full (prall voll Münzen, Augen zufrieden).
# Aufruf: python bl.py beutel_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_beutel", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def beutel(pose):
    VEL, VEL2, GOLD = M('#7c1020', 1.0, 0, 0, 0.04, 0.35), M('#4c0812', 1.0, 0, 0, 0.03, 0.25), M('#e0b040', 0.25, 0.9)
    WOOD, BRASS, DARK, EYE = M('#6c4424', 0.55, 0, 0, 0.45), M('#c89838', 0.3, 0.85), M('#14060a', 0.9), M('#ffe070', 0.2, 0, 3.5)
    COIN = M('#f0c040', 0.25, 0.95)
    full, lunge = pose == 'full', pose == 'lunge'
    bx, by = (31.0, 19.0) if not lunge else (34.0, 20.0)
    sw = {'hover0': -0.25, 'hover1': 0.35, 'lunge': 0.0, 'full': 0.15}[pose]
    # Holzstab schräg nach hinten links, mit Querholz am Beutel
    tube((bx - 30.0, by + (12.0 if not lunge else 3.0)), (bx - 3.0, by - 7.5), 0.9, 0.8, WOOD, 1.5)
    tube((bx - 4.0, by - 9.0), (bx + 4.0, by - 9.0), 0.7, 0.7, WOOD, 0.0)
    S(bx - 30.0, by + (12.0 if not lunge else 3.0), 1.5, 1.2, BRASS)
    # Samtbeutel: bauchig, unten zusammengerafft; voll ist er prall
    r = 9.0 if full else 7.6
    S(bx, by + 1.5, 0.0, r, VEL, r * 0.92, r * (1.02 if full else 0.96))
    for k in range(6):   # Falten
        a = -0.9 + k * 0.36
        S(bx + math.sin(a) * r * 0.82, by + 2.5 + math.cos(a) * 1.2, -r * 0.55, 1.1, VEL2, 0.8, r * 0.7, (0, a * 0.4, 0))
    S(bx, by + r + 1.5, 0.0, 2.4, VEL2, 2.2, 1.8)   # Raffung
    # Goldring an der Öffnung, darin Dunkel und die Augen
    op = 1.6 if lunge else 1.0
    S(bx, by - 6.2, 0.0, 5.6 * op, DARK, 4.6 * op, 1.3 * op)
    for k in range(16):
        a = k / 16 * math.tau
        S(bx + math.cos(a) * 6.0 * op, by - 6.2 + math.sin(a) * 1.4 * op, math.sin(a) * 4.8 * op, 0.75, GOLD)
    if full:   # Münzen schauen oben heraus, Augen zufrieden (schmale Bögen)
        for x, y in ((-2.5, -7.2), (0.5, -7.8), (3.0, -7.0), (-0.8, -6.6)): S(bx + x, by + y, -1.0, 1.6, COIN, 1.6, 0.5, (math.radians(70), 0, 0))
        for d in (-2.6, 2.6): tube((bx + d - 1.3, by - 1.2), (bx + d + 1.3, by - 1.2), 0.45, 0.45, EYE, -r * 0.92)
    else:
        for d in (-2.4, 2.4): S(bx + d, by - 1.0, -r * 0.86, 1.3 if lunge else 1.1, EYE, 0.5, 1.4 if lunge else 1.0)   # gierige Augen vorn auf dem Samt
        for d in (-2.4, 2.4): tube((bx + d - 1.6, by - 3.2 + (0.6 if d < 0 else -0.6)), (bx + d + 1.6, by - 3.2 + (-0.6 if d < 0 else 0.6)), 0.35, 0.35, VEL2, -r * 0.9)   # böse Brauen
    # Goldquaste unten und Messingglöckchen am Bändchen
    S(bx, by + r + 3.6, 0.0, 0.9, GOLD)
    for k in range(5): tube((bx - 0.8 + k * 0.4, by + r + 4.0), (bx - 1.6 + k * 0.8, by + r + 7.0), 0.28, 0.2, GOLD, 0.0)
    gx, gy = bx + 5.0 + math.sin(sw) * 4.0, by + r + 2.0 + math.cos(sw) * 1.0
    tube((bx + 3.0, by + r - 0.5), (gx, gy - 2.0), 0.2, 0.2, GOLD, 0.0)
    S(gx, gy, 0.0, 2.2, BRASS, 2.2, 2.0); S(gx, gy + 1.8, 0.0, 2.5, BRASS, 2.5, 0.6); S(gx, gy + 2.6, -0.6, 0.6, DARK)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('hover0', 'hover1', 'lunge', 'full'):
    name = 'beutel_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(48, 40); beutel(pose); shot(name)
print('ok')
