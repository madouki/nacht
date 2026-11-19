# Höhlenspinne für NACHTMAHR: hängt am Faden von der Decke, seilt sich ab und spuckt Netze. Bildfeld 56×48 Spielpixel, Mitte des Körpers bei (28, 24).
# Posen: hang (Beine angezogen, Kopf nach unten), drop (Beine gespreizt), spit (Hinterleib gehoben, Maul offen), walk0/walk1 (von der Seite, krabbelnd).
# Aufruf: python bl.py spinne_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_spinne", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers5', 'exec'))

def spinne(pose):
    BODY, BODY2, HAIR, RED, EYE, FANG, SILK = M('#2c2430', 0.55), M('#1c161e', 0.6), M('#4c3c48', 0.9), M('#c81c24', 0.4, 0, 0.6), M('#fc2c2c', 0.2, 0, 6.0), M('#e8dcc8', 0.4), M('#e8e8f0', 0.5, 0, 0.4)
    cx, cy = 28, 24
    side = pose in ('walk0', 'walk1')
    if side:   # von der Seite: Kopf rechts, Hinterleib links, Beine nach unten zum Boden (y 46)
        S(cx - 8, cy + 6, 0.0, 9.0, BODY, 8.0, 7.5); S(cx - 9, cy + 3, -6.5, 3.0, RED, 0.8, 4.0); S(cx + 4, cy + 9, 0.0, 6.0, BODY2, 5.5, 5.0)
        for i in range(6): S(cx + 7.5 + (i % 3) * 1.3, cy + 6 + (i // 3) * 1.4, -4.6, 0.8, EYE)
        tube((cx + 9, cy + 12), (cx + 11, cy + 15), 1.0, 0.3, FANG, -2.0); tube((cx + 9, cy + 12), (cx + 12, cy + 14), 1.0, 0.3, FANG, 2.0)
        ph = 0 if pose == 'walk0' else 1
        for k in range(4):
            for d in (-5.0, 5.0):
                sw = (1 if (k + ph + (d > 0)) % 2 else -1) * 3
                hip = (cx + 2 + k * 1.6, cy + 9); knee = (cx - 6 + k * 6 + sw, cy - 2 + abs(k - 1.5) * 1.5); foot = (cx - 12 + k * 9 + sw * 1.4, 46)
                tube(hip, knee, 1.3, 1.0, BODY2, d * 0.6); tube(knee, foot, 1.0, 0.4, BODY2, d); S(knee[0], knee[1], d * 0.8, 1.2, HAIR)
        return
    # von vorn/oben hängend: Hinterleib oben (am Faden), Kopf unten
    up = pose == 'spit'
    tube((cx, 0), (cx, cy - 10), 0.35, 0.35, SILK, 0.0)
    S(cx, cy - 4 - (3 if up else 0), 0.0, 9.0, BODY, 8.0, 10.0); S(cx, cy - 6 - (3 if up else 0), -7.4, 2.4, RED, 0.6, 3.6); S(cx, cy - 1 - (3 if up else 0), -7.6, 2.0, RED, 0.6, 1.6)
    S(cx, cy + 8, 0.0, 6.2, BODY2, 5.6, 5.4)
    for i, (ex, ey) in enumerate(((-2.2, 9.5), (2.2, 9.5), (-3.6, 8), (3.6, 8), (-1, 11.4), (1, 11.4))): S(cx + ex, cy + ey, -4.8, 0.9 if i < 2 else 0.7, EYE)
    gap = 2.4 if up else 1.2
    tube((cx - 1.5, cy + 12.5), (cx - gap, cy + 16.5), 1.1, 0.3, FANG, -3.0); tube((cx + 1.5, cy + 12.5), (cx + gap, cy + 16.5), 1.1, 0.3, FANG, -3.0)
    spread = {'hang': 0.35, 'drop': 1.0, 'spit': 0.8}[pose]
    for k in range(4):
        for sgn in (-1, 1):
            a = math.radians(-60 + k * 38)                      # Ansatzwinkel rund um den Vorderleib
            hip = (cx + sgn * 4.5, cy + 6 + k * 1.6)
            reach = 9 + 9 * spread
            knee = (cx + sgn * (6 + reach * 0.75), cy + 2 + k * 3.5 - (10 - k * 3) * spread * 0.6)
            foot = (cx + sgn * (6 + reach * (0.9 + 0.25 * spread)), cy + 10 + k * 5 * (0.4 + spread * 0.6) + (1 - spread) * 4)
            d = -2.0 + k * 1.4
            tube(hip, knee, 1.4, 1.0, BODY2, d); tube(knee, foot, 1.0, 0.35, BODY2, d); S(knee[0], knee[1], d - 0.5, 1.3, HAIR)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('hang', 'drop', 'spit', 'walk0', 'walk1'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(56, 48); spinne(pose); shot('spinne_' + pose)
print('ok')
