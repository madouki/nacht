# Galvanifrosch für NACHTMAHR: mechanischer Frosch aus grünem Email mit Messingnieten, Kupferspule und Glaskuppel mit Funken auf dem
# Rücken, Fliegerbrille. Blick nach rechts. Bildfeld 36×26 Spielpixel, Boden bei y = 24. Posen: sit, crouch (lädt auf), leap.
# Aufruf: python bl.py frosch_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_frosch", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def frosch(pose):
    GREEN, DARKG, BELLY = M('#3c8c4c', 0.32, 0.25), M('#245c30', 0.4, 0.2), M('#b8c890', 0.55)
    BRASS, COPPER, IRON = M('#d8a838', 0.3, 0.85), M('#c8743c', 0.28, 0.85), M('#34343c', 0.45, 0.7)
    GLASS, SPARK, EYE, DARK = M('#bce8f8', 0.05, 0, 0.2), M('#a8f0ff', 0.2, 0, 4.0), M('#f8e070', 0.2, 0, 2.2), M('#141018', 0.8)
    ox = {'sit': 0.0, 'crouch': 0.0, 'leap': 3.5}[pose]
    lo = {'sit': 0.0, 'crouch': 1.4, 'leap': -2.6}[pose]
    tilt = {'sit': 0.0, 'crouch': 0.0, 'leap': -0.2}[pose]
    bx, by = 15 + ox, 16.5 + lo
    # Körper (Email), Bauchplatte, Nietennaht, Flecken
    S(bx, by, 0.0, 8.2, GREEN, 5.6, 6.2, (0, tilt, 0))
    S(bx + 1.5, by + 3.0, -2.6, 5.4, BELLY, 2.6, 3.2, (0, tilt, 0))
    for k in range(7):
        a = math.pi * (1.1 + 0.8 * k / 6); S(bx + math.cos(a) * 7.6, by + math.sin(a) * 5.6 + 1.0, -3.6, 0.45, BRASS)
    for k, (x, y) in enumerate(((-4, -2.5), (-1, -4.2), (3, -3.6), (-5.5, 1.0))): S(bx + x, by + y, -4.4, 1.1, DARKG, 1.1, 0.5)
    # Kopf mit Maulspalte und Kehlsack
    hx, hy = bx + 9.0, by - 2.4 + (-1.2 if pose == 'leap' else 0)
    S(hx, hy, 0.0, 5.0, GREEN, 4.2, 4.6); S(hx + 1.2, hy + 1.8, -2.4, 3.8, BELLY, 2.0, 2.6)
    tube((hx - 1.2, hy + 1.0), (hx + 4.8, hy + 0.6), 0.35, 0.35, DARK, -4.6, -2.4, caps=False)
    if pose != 'leap': S(hx + 0.6, hy + 3.6, -2.0, 2.0 if pose == 'sit' else 2.7, M('#e0d098', 0.4, 0, 0.12), 1.8, 1.9)
    # Fliegerbrille: Messingring und leuchtendes Glas zur Kamera, Riemen um den Kopf
    ex, ey = hx + 0.4, hy - 4.0
    S(ex, ey, -3.6, 2.4, BRASS, 1.0, 2.4); S(ex + 0.2, ey, -4.6, 1.6, EYE, 0.5, 1.6); S(ex + 0.9, ey - 0.6, -5.1, 0.45, M('#ffffff', 0.1, 0, 3.0))
    tube((ex - 2.2, ey + 0.4), (ex - 5.0, ey + 1.6), 0.5, 0.5, M('#5c3c24', 0.7), -3.2, -2.0, caps=False)
    # Rücken: Eisenkern mit Kupferwicklung, darüber die Glaskuppel mit Funken und ein Blitzableiter
    cy = by - 7.6
    tube((bx - 5.0, cy + 0.8), (bx + 4.0, cy + 0.8), 1.5, 1.5, IRON, 0.0)
    for k in range(6): tube((bx - 4.2 + k * 1.5, cy + 0.8), (bx - 3.6 + k * 1.5, cy + 0.8), 2.2, 2.2, COPPER, 0.0, caps=False)
    for x in (bx - 5.4, bx + 4.4): S(x, cy + 0.8, 0.0, 2.4, BRASS, 0.6, 2.4)
    S(bx - 0.5, cy - 2.6, 0.0, 2.6, GLASS); S(bx - 0.5, cy - 2.6, 0.0, 0.9 + (0.9 if pose == 'crouch' else 0), SPARK)
    tube((bx - 0.5, cy - 5.0), (bx - 0.5, cy - 7.2), 0.3, 0.15, BRASS, 0.0); S(bx - 0.5, cy - 7.4, 0.0, 0.6, BRASS)
    if pose == 'crouch':
        for k, (x, y) in enumerate(((-6.5, -3), (5.5, -4), (-3, -6.5), (3, -1.5), (8, 1))): S(bx + x, cy + y, -3.0 + k, 0.7, SPARK)
    # Beine
    for d, mat in ((3.4, DARKG), (-3.4, GREEN)):
        if pose == 'leap':
            tube((bx - 5, by + 1.5), (bx - 10, by + 4.5), 2.4, 1.5, mat, d); tube((bx - 10, by + 4.5), (bx - 14, by + 6.0), 1.4, 0.9, mat, d)
            S(bx - 15, by + 6.4, d, 1.9, mat, 2.2, 0.9); tube((bx + 6, by + 2.5), (bx + 12, by + 2.0), 1.2, 0.9, mat, d * 0.8); S(bx + 12.8, by + 2.0, d * 0.8, 1.3, mat, 1.5, 0.8)
        else:
            S(bx - 5.5, 24 - 4.6 + lo * 0.3, d, 4.0, mat, 2.8, 2.6); tube((bx - 8, 22.6), (bx + 1, 23.3), 1.3, 1.1, mat, d); S(bx + 2, 23.5, d, 2.1, mat, 2.4, 0.9)
            tube((bx + 5.5, by + 3), (bx + 7, 23.1), 1.2, 1.0, mat, d * 0.8); S(bx + 8, 23.5, d * 0.8, 1.7, mat, 2.0, 0.8)
        S(bx - 5.5, by + 1.5, d * 1.05, 1.0, BRASS)   # Gelenkbolzen

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('sit', 'crouch', 'leap'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(36, 26); frosch(pose); shot('frosch_' + pose)
print('ok')
