# Wahrsageautomat „Madame Mystika“ (Hotel-Lobby, js/orakel.js): Holzkabinett mit Messingbeschlägen, Münz- und Kartenschlitz,
# darüber die Vitrine mit Bogenaufsatz und Halbmond; darin die Automatenfrau (Porzellangesicht, Turban mit Juwel, Ohrringe,
# Stola) mit den Händen über der Kristallkugel. Zwei Bilder im Raum (40×64, Füße unten): ruhig / Kugel glüht, Augen leuchten.
# Dazu die Nahaufnahme für die Weissagung (160×120): Büste und Kugel, wieder ruhig / glühend.
# Aufruf: python bl.py orakel_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_orakel", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def orakel(glow, close=False):
    # Bildkoordinaten des Raumbilds (40×64); die Nahaufnahme vergrößert um den Kopf herum
    K, CX, CY = (4.0, 80.0, 58.0) if close else (1.0, 20.0, 20.0)
    P = lambda x, y: (CX + (x - 20.0) * K, CY + (y - 20.0) * K)
    def s(x, y, d, r, m, ry=None, rz=None, rot=(0, 0, 0)): px, py = P(x, y); S(px, py, d * K, r * K, m, (ry or r) * K, (rz or r) * K, rot)
    def t(a, b, r0, r1, m, d=0.0, d1=None, caps=True): tube(P(*a), P(*b), r0 * K, r1 * K, m, d * K, (d if d1 is None else d1) * K, caps)
    def bx(x0, y0, x1, y1, m, d0=-3.0, d1=3.0): a, b = P(x0, y0), P(x1, y1); box(a[0], a[1], b[0], b[1], m, d0 * K, d1 * K)
    WOOD, WOOD2, WOODL = M('#4a2414', 0.55), M('#2c140a', 0.7), M('#7c4424', 0.45)
    BRASS, BRASSL, VEL, DARK = M('#b88a34', 0.3, 0.9), M('#e8c060', 0.22, 0.95), M('#4c1040', 0.9, 0, 0, 0.3, 0.6), M('#120608', 0.9)
    SKIN, SKIN2, LIP = M('#f0e0d4', 0.35, 0, 0, 0.5), M('#d8c0b4', 0.4), M('#a82838', 0.4)
    TUR, TUR2, GEM, GOLD = M('#5c1c6c', 0.8, 0, 0, 0.3, 0.5), M('#7c3c8c', 0.8, 0, 0, 0.3, 0.5), M('#30d8a0', 0.1, 0, 1.6 if glow else 0.6), M('#e0b040', 0.25, 0.9)
    BALL, BALLC = M('#8c60f0', 0.05, 0.0, 2.2 if glow else 0.9), M('#d8c8ff', 0.05, 0.0, 3.4 if glow else 1.5)
    EYE = M('#ffe070', 0.2, 0, 3.0) if glow else M('#1c2c5c', 0.3)
    # ---- Kabinett (Unterteil) ----
    if not close:
        bx(4, 36, 36, 62, WOOD, -4.0, 4.0)
        bx(3, 34, 37, 37, WOODL, -5.0, 5.0); bx(3, 61, 37, 64, WOOD2, -5.0, 5.0)
        bx(8, 40, 32, 58, WOOD2, -4.6, -4.2)                                  # Füllung vorn
        for x in (8, 32): t((x, 40), (x, 58), 0.45, 0.45, BRASS, -4.7, caps=False)
        for y in (40, 58): t((8, y), (32, y), 0.45, 0.45, BRASS, -4.7, caps=False)
        bx(16, 43, 24, 47, BRASS, -5.2, -4.4); bx(17, 44.4, 23, 45.6, DARK, -5.5, -5.1)   # Kartenschlitz
        s(28, 44, -5.0, 2.2, BRASS, 0.6, 2.2); bx(27.6, 42.6, 28.4, 45.4, DARK, -5.8, -5.4)  # Münzeinwurf
        for x, y in ((12, 50), (28, 50)): s(x, y, -4.8, 2.4, BRASSL, 0.5, 2.4)          # Rosetten
        bx(14, 51, 26, 54, BRASS, -5.0, -4.4)                                    # Namensschild (Text zeichnet das Spiel)
        for x in (4.5, 35.5): t((x, 62), (x, 64), 1.0, 1.2, BRASS, -3.6)         # Füße
    # ---- Vitrine ----
    for x in (4.5, 35.5): t((x, 34), (x, 7), 1.1, 1.1, WOOD, -3.0, caps=False); s(x, 34, -3.0, 1.3, BRASS); s(x, 7, -3.0, 1.3, BRASS)
    bx(3.5, 33, 36.5, 35, WOODL, -5.0, 4.0)                                      # Boden der Vitrine
    bx(5.5, 8, 34.5, 33, VEL, 3.0, 4.0)                                          # Samtrückwand
    for i in range(7): s(7 + i * 4.3, 8.5, 2.6, 2.4, VEL, 0.6, 3.0)                # Vorhangfalten oben
    for k in range(24):                                                         # Bogenaufsatz
        a = math.pi * k / 23; x, y = 20 - math.cos(a) * 16, 7 - math.sin(a) * 6
        s(x, y, -3.0, 1.2, WOOD); s(x, y - 0.9, -3.8, 0.5, BRASS)
    t((4, 7), (36, 7), 1.0, 1.0, WOOD, -3.0, caps=False)
    s(20, -1.5, -3.6, 2.6, BRASSL, 0.8, 2.6); s(21.4, -2.2, -4.6, 2.2, WOOD, 0.8, 2.2)   # Halbmond auf dem Bogen
    for x in (7, 33): s(x, 1.5, -3.4, 1.0, GOLD)
    # ---- Automatenfrau ----
    s(20, 29, 0.5, 9.5, VEL, 4.0, 4.5)                                           # Schultern, Stola
    for k in range(9): s(12.5 + k * 1.9, 31.5 + (k % 2) * 0.4, -2.2, 0.9, GOLD)       # Fransen
    s(20, 25.5, -1.5, 3.2, SKIN2, 2.0, 1.6)                                      # Hals
    s(20, 20.5, -1.0, 4.4, SKIN, 4.0, 5.2)                                       # Gesicht (Porzellan)
    for d in (-1.6, 1.6):
        s(20 + d, 19.8, -4.9, 0.95, EYE, 0.4, 0.7)                               # Augen
        t((20 + d - 1.2, 18.4 - (0.3 if d < 0 else -0.3) * 0), (20 + d + 1.2, 18.4), 0.22, 0.22, WOOD2, -4.7, caps=False)  # Brauen
        s(20 + d * 1.5, 22.0, -4.0, 0.9, M('#e8a0a0', 0.5), 0.3, 0.6)            # Wangenrot
    s(20, 23.4, -4.6, 1.1, LIP, 0.35, 0.45)                                      # Mund
    s(20, 21.3, -5.0, 0.5, SKIN2, 0.6, 0.9)                                      # Nase
    for d in (-4.4, 4.4): s(20 + d, 22.5, -1.0, 0.9, GOLD); s(20 + d, 24.2, -1.0, 1.2, GOLD)   # Ohrringe
    s(20, 15.8, -0.5, 5.6, TUR, 4.6, 3.8)                                        # Turban
    for k in range(3): s(20 + (k - 1) * 0.6, 14.2 + k * 1.5, -1.0 - k * 0.3, 5.3 - k * 0.5, TUR2, 4.2, 0.75, (0, (k - 1) * 0.18, 0))   # Wicklungen
    s(20, 14.4, -4.6, 1.3, GEM); s(20, 14.4, -4.0, 1.9, GOLD, 0.5, 1.9)            # Juwel mit Fassung
    for k, (dx, dy, rr) in enumerate(((0.8, 10.6, 0.35), (2.0, 10.0, 0.6), (-0.4, 10.2, -0.1))): s(20 + dx, dy, -2.2 - k * 0.3, 0.75, M('#f4ecf8', 0.7), 0.5, 2.4, (0, rr, 0))   # Federbusch
    # Hände über der Kugel, Kugel auf dem Messingständer
    s(20, 31.4, -3.2, 2.2, BRASS, 2.0, 0.8); t((20, 31.2), (20, 33), 1.2, 2.0, BRASS, -3.2)
    s(20, 27.6, -3.6, 3.6, BALL); s(19.0, 26.6, -6.6, 1.2, BALLC, 0.6, 1.0)
    for sgn in (-1, 1):
        hx = 20 + sgn * (4.6 if not glow else 3.9); hy = 26.6 if not glow else 25.4
        t((20 + sgn * 7.0, 29.0), (hx, hy), 1.0, 0.8, M('#3c0c34', 0.85), -2.0, -4.0)
        s(hx, hy, -4.6, 1.3, SKIN, 0.9, 0.9)
        for f in range(3): t((hx, hy), (hx - sgn * (0.8 + f * 0.6), hy - 1.6 + f * 0.4), 0.3, 0.25, SKIN, -4.8)
    # Lichtschein der Kugel
    L = bpy.data.lights.new('ballL', 'POINT'); L.energy = (520 if glow else 200) * K * K; L.color = (0.7, 0.5, 1.0); L.shadow_soft_size = 3 * K
    px, py = P(20, 27.6); o = bpy.data.objects.new('ballL', L); bpy.context.scene.collection.objects.link(o); o.location = (px - FW / 2, -8 * K, FH - py); OBJ.append(o)

os.makedirs(CFG['out'], exist_ok=True)
for name, w, h, glow, close in (('orakel0', 40, 64, False, False), ('orakel1', 40, 64, True, False), ('orakelNah0', 160, 120, False, True), ('orakelNah1', 160, 120, True, True)):
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); orakel(glow, close); shot(name)
print('ok')
