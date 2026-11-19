# Wasserspeier (Gargoyle) für NACHTMAHR: hockt als Steinfigur auf Simsen, erwacht, stürzt sich herab und fliegt zurück.
# Fünf Posen, Blickrichtung rechts, Bildfeld 64×56 Spielpixel: stone, wake, fly0 (Flügel oben), fly1 (Flügel unten), dive (im Sturz).
# Aufruf: python bl.py garg_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_garg", "ss": 4}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers3', 'exec'))

W0, H0 = 64, 56
def garg(pose):
    live = pose != 'stone'
    if live: BODY, BODY2, MEMB, BONE, HORN = M('#5c5470', 0.5), M('#3e3650', 0.55), M('#2c2040', 0.75), M('#6e6484', 0.5), M('#b8ac98', 0.45)
    else: BODY, BODY2, MEMB, BONE, HORN = M('#8a8690', 0.93), M('#6a6672', 0.95), M('#58545e', 0.95), M('#7a7680', 0.95), M('#9c968e', 0.9)
    EYE = M('#fc3424', 0.3, 0, 7.0) if pose != 'stone' else M('#2c2830', 0.9)
    MOSS = M('#4c6c40', 0.95)
    th = {'stone': 0.0, 'wake': -0.08, 'fly0': 0.18, 'fly1': 0.18, 'dive': 0.62}[pose]
    cx, cy = (30, 34) if pose in ('stone', 'wake') else (30, 30)
    c, s = math.cos(th), math.sin(th)
    P = lambda x, y: (cx + x * c - y * s, cy + x * s + y * c)
    rot = (0, -th, 0)
    # Schwanz mit Spitze
    tail = [(-9, 4), (-15, 8), (-21, 7), (-25, 2)] if pose in ('stone', 'wake') else [(-9, 2), (-17, 3), (-24, 0), (-28, -3)]
    for a, b in zip(tail, tail[1:]): tube(P(*a), P(*b), 2.4 - tail.index(a) * 0.5, 2.0 - tail.index(a) * 0.5, BODY2, 4.0)
    tx, ty = P(*tail[-1]); S(tx, ty, 4.0, 2.6, BODY2, 1.2, 1.6, rot)
    # Flügel: Schulter, Ellenbogen, drei Fingerspitzen; Haut als Fächer mit eingezogenen Rändern
    sh = (-2, -6)
    wing = {'stone': ((-6, -12), [(-14, 8), (-10, 12), (-4, 13)]), 'wake': ((-7, -15), [(-16, 4), (-13, 10), (-6, 12)]),
            'fly0': ((-6, -20), [(-20, -27), (-24, -16), (-18, -6)]), 'fly1': ((-8, -2), [(-24, 8), (-20, 16), (-10, 18)]),
            'dive': ((-14, -10), [(-28, -8), (-28, 0), (-20, 4)])}[pose]
    for d, k in ((6.0, 1.0), (-4.0, 0.85)):   # hinterer und vorderer Flügel
        el, tips = wing
        E = (sh[0] + (el[0] - sh[0]) * k, sh[1] + (el[1] - sh[1]) * k); T = [(sh[0] + (t[0] - sh[0]) * k, sh[1] + (t[1] - sh[1]) * k) for t in tips]
        tube(P(*sh), P(*E), 1.3, 0.9, BONE, d); S(*P(*E), d, 1.1, BONE)
        for t in T: tube(P(*E), P(*t), 0.7, 0.25, BONE, d)
        pts = [E] + T
        for i in range(len(pts) - 1):
            A, B = pts[i], pts[i + 1]
            def fn(u, v, A=A, B=B):
                ex, ey = A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u
                mx, my = (ex + E[0]) / 2, (ey + E[1]) / 2; k2 = math.sin(math.pi * u) * 0.28 if i > 0 else 0
                ex, ey = ex + (mx - ex) * k2, ey + (my - ey) * k2
                x, y = E[0] + (ex - E[0]) * v, E[1] + (ey - E[1]) * v
                gx, gy = P(x, y); return (gx, gy, d + 0.5)
            grid(fn, 6, 3, MEMB)
        if i == 0: pass
    # Rumpf, Brust, Bauch
    S(*P(-1, 1), 0.0, 7.0, BODY, 6.0, 8.5, rot); S(*P(5, -4), -1.0, 6.4, BODY, 5.4, 6.6, rot); S(*P(3, 4), -1.5, 4.6, BODY2, 4.4, 4.4, rot)
    S(*P(-3, -7), 2.0, 4.0, BODY2, 3.6, 3.0, rot)   # Buckel zwischen den Schulterblättern
    for k in range(3): S(*P(7 + k * 0.3, -5 + k * 3.0), -5.6, 2.2, BODY2, 0.6, 1.1, rot)   # Bauchschuppen
    # Beine (gehockt oder angezogen im Flug)
    if pose in ('stone', 'wake'):
        for d in (4.0, -4.0):
            S(*P(-3, 8), d, 6.0, BODY, 5.0, 5.0, rot); tube(P(0, 11), P(4, 16), 2.4, 2.0, BODY2, d); S(*P(5, 17), d - 1, 3.0, BODY2, 2.6, 1.6, rot)
            for k in range(3): tube(P(6, 17), P(9, 18 + k * 0.4), 0.8, 0.3, HORN, d - 2 + k * 1.6)
    else:
        for d in (4.0, -4.0): S(*P(-5, 7), d, 5.0, BODY, 4.0, 4.0, rot); tube(P(-6, 9), P(-12, 12), 2.0, 1.4, BODY2, d); S(*P(-13, 12), d, 1.8, BODY2)
    # Arme mit Klauen
    for d in (-6.0, 3.0):
        hand = (12, 12) if pose in ('stone', 'wake') else (16, 4) if pose != 'dive' else (18, 6)
        tube(P(7, 0), P(*hand), 2.4, 1.8, BODY2, d); S(*P(*hand), d, 2.2, BODY2)
        for k in range(3): tube(P(*hand), P(hand[0] + 3, hand[1] + 1 + k * 1.2), 0.7, 0.25, HORN, d - 1 + k)
    # Kopf: Schädel, Schnauze, Kiefer mit Zähnen, Hörner, Ohren, Augen
    hx, hy = 13, -11
    S(*P(hx, hy), -1.0, 5.4, BODY, 5.0, 5.2, rot); S(*P(hx + 5, hy + 2), -1.0, 4.6, BODY, 3.6, 2.8, rot); S(*P(hx + 9, hy + 2.4), -1.0, 1.8, BODY2, 1.6, 1.6, rot)
    jaw = 3.5 if pose in ('wake', 'dive') else 1.0
    S(*P(hx + 4, hy + 5 + jaw * 0.4), -1.0, 3.8, BODY2, 3.4, 1.8, rot)
    if jaw > 1:
        S(*P(hx + 5, hy + 4), -3.0, 2.6, M('#2c0808', 0.6), 1.6, 1.4, rot)
    for k in range(4): S(*P(hx + 5 + k * 1.3, hy + 3.4), -4.0, 0.5, M('#e8e0d0', 0.4), 0.5, 1.1)
    for d, sg in ((-3.0, 1), (3.0, -1)):
        tube(P(hx - 1, hy - 4), P(hx - 4, hy - 9), 1.5, 0.9, HORN, d); tube(P(hx - 4, hy - 9), P(hx - 9, hy - 10), 0.9, 0.2, HORN, d)
        tube(P(hx - 3, hy - 1), P(hx - 7, hy - 3), 1.2, 0.3, BODY2, d * 1.6)
    for d in (-4.6, -1.2): S(*P(hx + 3, hy - 1.6), d, 1.25, EYE, 0.9, 0.9)
    S(*P(hx + 2.5, hy - 3.0), -3.6, 3.4, BODY2, 1.6, 1.1, rot)   # finstere Brauenwulst
    if not live:
        for x, y, r in ((-4, -2, 2.4), (8, 6, 1.8), (-12, 10, 2.0)): S(*P(x, y), -8.6, r, MOSS, 0.8, r * 0.6)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('stone', 'wake', 'fly0', 'fly1', 'dive'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(W0, H0); garg(pose); shot('garg_' + pose)
print('ok')
