# Schildwache für NACHTMAHR: gepanzerte Wache mit Turmschild und Lanze. Blickrichtung rechts, Bildfeld 80×60 Spielpixel, Boden bei y 58.
# Posen: walk0, walk1 (Schild vorn, Lanze aufrecht), wind (Lanze zurückgezogen, Spitze blitzt), thrust (Ausfall, Lanze weit vorn), recover (Schild gesenkt).
# Aufruf: python bl.py schild_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_schild", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers4', 'exec'))

def wache(pose):
    CAP = CFG.get('captain')
    IRON, IRON2, STEEL, GOLD, RED, DARK, SH, WOOD = M('#4c5060', 0.32, 0.9), M('#363a48', 0.38, 0.9), M('#a8b0c0', 0.22, 0.95), M('#c8a048', 0.28, 0.95), M('#7c1c24', 0.8), M('#0a0a10', 0.9), M('#2c2440', 0.5, 0.3), M('#5c3c20', 0.6)
    if CAP: IRON, IRON2, STEEL, GOLD, RED, SH = M('#2a2a32', 0.3, 0.9), M('#1c1c24', 0.35, 0.9), M('#e0c070', 0.2, 0.95), M('#f8d878', 0.22, 0.95), M('#9c1424', 0.7), M('#5c1018', 0.5, 0.2)
    base = 'walk0' if pose in ('bash', 'leap') else pose
    lean = {'walk0': 0, 'walk1': 0, 'wind': -2, 'thrust': 4, 'recover': 1, 'bash': 7, 'leap': 1}[pose]
    bx = 32 + lean
    # Beine und Sabatons
    legs = {'walk0': (((bx + 2, 40), (bx + 6, 57)), ((bx - 2, 40), (bx - 6, 57))), 'walk1': (((bx + 2, 40), (bx - 2, 57)), ((bx - 2, 40), (bx + 2, 57))),
            'wind': (((bx + 2, 40), (bx + 7, 57)), ((bx - 2, 40), (bx - 7, 57))), 'thrust': (((bx + 3, 40), (bx + 12, 57)), ((bx - 3, 40), (bx - 9, 57))),
            'recover': (((bx + 2, 40), (bx + 6, 57)), ((bx - 2, 40), (bx - 5, 57))), 'bash': (((bx + 3, 40), (bx + 13, 56)), ((bx - 3, 40), (bx - 12, 55))),
            'leap': (((bx + 2, 40), (bx + 9, 48)), ((bx - 2, 40), (bx - 7, 50)))}[pose]
    for (a, b), d in zip(legs, (-3.0, 3.0)):
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        tube(a, mid, 3.4, 3.0, IRON, d); tube(mid, b, 3.0, 2.6, IRON2, d); S(mid[0], mid[1], d - 1.5, 2.6, STEEL, 2.0, 2.0)
        S(b[0] + 2, b[1] - 0.5, d, 3.6, IRON, 2.6, 1.6)
    if CAP:   # Umhang des Hauptmanns, hinter dem Rücken wehend
        wave = {'bash': 10, 'leap': -6}.get(pose, 3)
        grid(lambda u, v: (bx - 5 - v * (6 + wave) + math.sin(v * 3 + u * 2) * 1.5 + u * 6, 18 + v * 30, 8.0 + u * 2), 4, 8, RED)
    # Waffenrock und Beintaschen
    grid(lambda u, v: (bx - 7 + u * 14 + (v * (u - 0.5) * 4), 36 + v * 10, -1.0), 6, 2, RED)
    for x in (-5, 0, 5): S(bx + x, 37, -3.5, 3.2, IRON, 1.6, 3.0)
    # Rumpf, Brustpanzer, Schultern, Halsberge
    S(bx, 29, 0.0, 7.6, IRON, 6.4, 9.0); S(bx + 2.5, 27, -3.0, 6.0, STEEL, 2.4, 7.0); tube((bx + 2, 21), (bx + 2, 33), 0.6, 0.6, GOLD, -5.4)
    S(bx - 4, 21, 4.0, 4.8, IRON, 4.4, 3.6); S(bx + 4, 21, -4.0, 4.8, IRON, 4.4, 3.6); S(bx + 4, 20, -6.0, 3.2, GOLD, 1.0, 1.2)
    S(bx + 1, 18, 0.0, 4.0, IRON2, 4.0, 2.4)
    # Topfhelm mit Sehschlitz und Federbusch
    hx, hy = bx + 2, 12
    S(hx, hy, 0.0, 5.4, IRON, 5.2, 5.8); box(hx + 1, hy - 1.2, hx + 6, hy + 0.2, DARK, -6.0, -4.6); box(hx + 3, hy + 2, hx + 6, hy + 2.6, DARK, -6.0, -4.8)
    tube((hx - 1, hy - 6), (hx + 1, hy - 6), 0.9, 0.9, GOLD, 0.0)
    for i in range(9): S(hx - 1 - i * 1.6, hy - 6 - math.sin(i / 8 * math.pi) * 3 + i * 0.4, 1.0, 2.0 - i * 0.12, RED, 1.6, 2.4)
    # Lanze im hinteren Arm
    lance = {'walk0': ((bx - 6, 48), (bx - 6, 1)), 'walk1': ((bx - 6, 48), (bx - 6, 1)), 'wind': ((bx - 14, 31), (bx + 22, 27)),
             'thrust': ((bx - 4, 30), (79, 29)), 'recover': ((bx - 10, 26), (bx + 26, 56)), 'bash': ((bx - 16, 34), (bx + 10, 26)), 'leap': ((bx - 10, 4), (bx + 22, 50))}[pose]
    hand = {'walk0': (bx - 6, 30), 'walk1': (bx - 6, 30), 'wind': (bx - 6, 30), 'thrust': (bx + 6, 30), 'recover': (bx - 2, 32), 'bash': (bx - 6, 31), 'leap': (bx - 2, 14)}[pose]
    tube((bx - 4, 22), hand, 2.4, 2.0, IRON, 5.0); S(hand[0], hand[1], 5.0, 2.4, IRON2)
    (a, b) = lance; L = math.dist(a, b); ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
    tube(a, (b[0] - ux * 9, b[1] - uy * 9), 1.3, 1.1, WOOD, 6.5); tube((b[0] - ux * 9, b[1] - uy * 9), b, 1.6, 0.2, STEEL, 6.5)
    vx, vy = hand[0] + ux * 4, hand[1] + uy * 4; tube((vx, vy), (vx + ux * 4, vy + uy * 4), 3.6, 1.2, STEEL, 6.0)
    if pose == 'wind': S(b[0], b[1], -2.0, 1.6, M('#fcfcf0', 0.2, 0, 8.0)); S(b[0], b[1], -2.0, 4.0, M('#fcf0c0', 0.3, 0, 2.0), 0.4, 0.6)
    # Turmschild im vorderen Arm (Wappen: Fledermaus)
    sx = {'walk0': 44, 'walk1': 44, 'wind': 44, 'thrust': 48, 'recover': 38, 'bash': 50, 'leap': 44}[pose] + lean * 0.3; sy = 17 if pose != 'recover' else 30; tilt = 0.0 if pose != 'recover' else 0.5
    def shield_pt(u, v):
        half = 7.0 * (1 - max(0, v - 0.55) / 0.45 * 0.95); x = (u - 0.5) * 2 * half; y = v * 28
        return (sx + x * math.cos(tilt) - y * math.sin(tilt), sy + x * math.sin(tilt) + y * math.cos(tilt))
    tube((bx + 4, 24), shield_pt(0.5, 0.35), 2.2, 2.0, IRON, -6.0)
    grid(lambda u, v: (*shield_pt(u, v), -9.0 - math.sin(u * math.pi) * 1.6), 8, 10, SH)
    for k in range(10):
        for u in (0.0, 1.0): p1, p2 = shield_pt(u, k / 10), shield_pt(u, (k + 1) / 10); tube(p1, p2, 0.7, 0.7, GOLD, -9.4, caps=False)
    tube(shield_pt(0, 0), shield_pt(1, 0), 0.8, 0.8, GOLD, -9.4)
    ex, ey = shield_pt(0.5, 0.36)
    S(ex, ey, -11.0, 2.2, STEEL, 0.8, 1.8)
    for d in (-1, 1): grid(lambda u, v, d=d: (ex + d * (1.5 + u * 5.5), ey - 1 + u * 1.5 - v * (2.6 - u * 1.4) + math.sin(u * 9) * 0.4, -10.8), 4, 1, STEEL)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('walk0', 'walk1', 'wind', 'thrust', 'recover') + (('bash', 'leap') if CFG.get('captain') else ()):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(80, 60); wache(pose); shot(('capt_' if CFG.get('captain') else 'schild_') + pose)
print('ok')
