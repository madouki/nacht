# Grottenolm Gustav (Zwischengegner im Unterirdischen Kanal): ein riesiger, blinder Höhlenmolch. Langer, blasser Leib mit rosigem
# Schimmer, drei rote, gefiederte Kiemenbüschel je Seite, winzige Augen unter der Haut, vier dünne Beinchen mit je drei Zehen, ein
# Ruderschwanz mit Flossensaum. Bildfeld 96×40 Spielpixel, Boden bei y = 39, Kopf rechts.
# Posen: crawl0, crawl1 (Beine wechseln), listen (Vorderleib gehoben, Kiemen gespreizt), lunge (gestreckt, Maul auf), spit (Kopf hoch,
# Maul weit auf).
# Aufruf: python bl.py olm_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_olm", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def olm(pose):
    SKIN, SKIN2, BELLY = M('#cc8682', 0.4, 0, 0, 0.5, 0.45), M('#b07074', 0.45, 0, 0, 0.5, 0.4), M('#e2aea6', 0.5, 0, 0, 0.4, 0.4)
    BACK, SPOT = M('#9c6266', 0.45, 0, 0, 0.5, 0.3), M('#7c4c54', 0.55)
    import random; rnd = random.Random(7)
    GILL, GILL2 = M('#e03c50', 0.5, 0, 0.15, 0.4, 0.3), M('#ff7a84', 0.45, 0, 0.25, 0.4, 0.3)
    EYE, MOUTH, MAW = M('#7c5c64', 0.6), M('#8c3c48', 0.6), M('#c8485c', 0.5, 0, 0.1)
    GROUND = 39.0
    lift = {'listen': 10.0, 'spit': 7.0}.get(pose, 0.0)
    stretch = 1.0
    def spine(t):   # Schwanzspitze t = 0 … Schnauze t = 1
        x = (4.0 if pose == 'lunge' else 6.0) + 80.0 * t * stretch
        y = 30.5 + (1.2 * math.sin(t * 7.0 + (0.0 if pose != 'crawl1' else 1.6)) if t < 0.5 else 0.0)
        if t > 0.58: y -= lift * ((t - 0.58) / 0.42) ** 1.6
        if pose == 'lunge' and t > 0.7: y += 1.5 * (t - 0.7) / 0.3
        return x, y
    def rad(t):
        if t < 0.38: return 1.0 + 4.6 * (t / 0.38) ** 0.8
        if t < 0.76: return 5.6 + 0.9 * math.sin((t - 0.38) / 0.38 * math.pi)
        if t < 0.84: return 5.6 - 1.0 * (t - 0.76) / 0.08
        return 4.6 + 1.6 * math.sin((t - 0.84) / 0.16 * math.pi * 0.62)
    N = 64
    for i in range(N + 1):   # Leib als Kette weicher Kugeln, der Kopf flach und breit
        t = i / N; x, y = spine(t); r = rad(t)
        head = t > 0.84
        S(x, y, 0.0, r * (1.25 if head else 1.0), SKIN, r * (1.35 if head else 1.0), r * (0.78 if head else 0.92))
        if t < 0.97: S(x, y - r * 0.42, 0.0, r * 0.95, BACK, r * 0.8, r * 0.5)                     # dunklerer Rücken
        if 0.3 < t < 0.84: S(x, y + r * 0.5, -0.6, r * 0.8, BELLY, r * 0.85, r * 0.4)
        if i % 3 == 0 and 0.1 < t < 0.95: S(x + rnd.uniform(-1, 1), y - r * rnd.uniform(0.3, 0.7), -r * rnd.uniform(0.2, 0.7), rnd.uniform(0.5, 0.9), SPOT, None, 0.35)   # Flecken
    for i in range(26):     # Flossensaum oben und unten am Schwanz
        t = 0.02 + 0.34 * i / 25; x, y = spine(t); r = rad(t); f = 1.0 + 2.4 * math.sin(t / 0.36 * math.pi)
        S(x, y - r * 0.7, 0.0, 1.4, SKIN2, 0.5, f); S(x, y + r * 0.7, 0.0, 1.4, SKIN2, 0.5, f * 0.7)
    hx, hy = spine(1.0)
    S(hx - 5.0, hy - 2.6, -5.6, 0.75, EYE); S(hx - 5.0, hy - 2.6, 5.6, 0.75, EYE)   # Augen unter der Haut
    if pose in ('lunge', 'spit'):   # Maul auf: Unterkiefer klappt herab, innen rot
        op = 4.0 if pose == 'spit' else 2.8
        S(hx - 2.0, hy + 1.2 + op * 0.4, -1.0, 5.2, M('#5c1824', 0.7), 5.6, 1.2 + op * 0.55)       # Rachen
        S(hx - 1.0, hy + 1.6 + op * 0.5, -2.0, 3.2, MAW, 3.6, 0.9)                                  # Zunge
        tube((hx + 1.6, hy + 2.6 + op), (hx - 8.0, hy + 2.6), 2.0, 2.8, SKIN, 0.0)                 # Unterkiefer
    else:
        tube((hx + 1.8, hy + 1.4), (hx - 7.0, hy + 1.8), 0.35, 0.35, MOUTH, -5.6); tube((hx + 1.8, hy + 1.4), (hx - 7.0, hy + 1.8), 0.35, 0.35, MOUTH, 5.6)
    gx, gy = spine(0.82); spread = 1.35 if pose in ('listen', 'spit') else 1.0
    for d in (-1, 1):       # Kiemenbüschel: drei je Seite, gefiedert
        for k in range(3):
            a = math.radians(-120 + k * 38) * spread if k else math.radians(-112 * spread)
            a = math.radians((-70, -100, -135)[k] - (12 if spread > 1 else 0) * (k - 1))
            L = (5.4, 6.4, 5.2)[k] * (1.1 if spread > 1 else 1.0)
            bx, by = gx - 0.5, gy - 1.5 + k * 1.6
            for j in range(7):
                s = j / 6; px = bx + math.cos(a) * L * s; py = by + math.sin(a) * L * s - 0.6 * s
                S(px, py, d * (5.2 + s * 1.2), 1.1 - 0.5 * s, GILL if j % 2 else GILL2)
                if j > 1: S(px + 0.9, py + 0.9, d * (5.4 + s * 1.2), 0.45, GILL2); S(px - 0.9, py + 0.5, d * (5.4 + s * 1.2), 0.45, GILL2)
    legs = ((0.74, 1), (0.42, -1))   # vorn, hinten
    for t, ph in legs:
        x, y = spine(t); r = rad(t)
        for d in (-1, 1):
            sw = {'crawl0': 1, 'crawl1': -1}.get(pose, 0) * ph * d
            if pose == 'lunge': sw = 1.4 * d * ph
            fx = x + sw * 3.2; kx, ky = (x + fx) / 2 + 1.2, y + r * 0.9 + 2.2
            top = (x, y + r * 0.5); foot = (fx + 1.2, GROUND - 0.6)
            if pose in ('listen', 'spit') and t > 0.6: foot = (fx + 0.5, GROUND - 0.6)
            mat = SKIN if d < 0 else SKIN2
            tube(top, (kx, ky), 1.1, 0.8, mat, d * 3.6); tube((kx, ky), foot, 0.8, 0.6, mat, d * 3.8)
            for z in (-1, 0, 1): S(foot[0] + 1.2 + abs(z) * -0.4, foot[1] + 0.2, d * 3.8 + z * 0.9, 0.55, mat, 0.45, 0.35)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('crawl0', 'crawl1', 'listen', 'lunge', 'spit'):
    name = 'olm_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(96, 40); olm(pose); shot(name)
print('ok')
