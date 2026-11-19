# HD-3D für Holzpuppe (Gepäckträger am Bahnhof Krat) und Schaufensterpuppe (Passage). Blick nach rechts.
# Holzpuppe: Bildfeld 30×38, Mitte x = 15, Sohle unten; Posen walk0, walk1, wind (Ausholen), lunge (Satz nach vorn).
# Schaufensterpuppe: Bildfeld 32×42, Mitte x = 16, Ständerfuß unten, Kopf 36 px über dem Fuß; Posen show, point, wave, shy, hip,
# reach in vier Kleidern (Name puppe<Kleid><Pose>, Kleid 0–3).
# Aufruf: python bl.py puppen_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_puppen", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def holz(pose):
    WD, WL, JT = M('#c89c64', 0.55), M('#e8c088', 0.5), M('#8c6438', 0.6)
    RED, REDL, DARK = M('#7c1c1c', 0.75), M('#a83030', 0.7), M('#1c1414', 0.6)
    BRASS, CAP, EYE = M('#f8b800', 0.3, 0.85), M('#a81c1c', 0.7), M('#140c08', 0.15, 0.2)
    cx, foot = 15.0, 37.4
    lean = {'walk0': 0.0, 'walk1': 0.0, 'wind': -1.2, 'lunge': 2.6}[pose]
    lift = {'walk0': 0.0, 'walk1': 0.0, 'wind': 1.2, 'lunge': -2.0}[pose]
    hip = (cx, 27.5 + lift)
    # Beine: Holzstäbe mit Kugelgelenken, schwarze Schuhe
    LEG = {'walk0': ((2.2, 5.0), (3.0, 9.6), (-1.8, 5.2), (-3.0, 9.6)), 'walk1': ((0.6, 5.2), (0.2, 9.8), (-0.4, 5.2), (0.4, 9.8)),
           'wind': ((2.6, 4.2), (3.6, 8.6), (-2.6, 4.6), (-4.4, 8.6)), 'lunge': ((1.0, 4.8), (-1.6, 9.0), (-3.2, 3.8), (-7.0, 6.8))}[pose]
    for (kn, an, d) in ((LEG[2], LEG[3], 1.3), (LEG[0], LEG[1], -1.3)):
        k = (hip[0] + kn[0], hip[1] + kn[1]); a = (hip[0] + an[0], min(foot - 0.6, hip[1] + an[1]))
        tube(hip, k, 0.95, 0.85, WD, d); tube(k, a, 0.85, 0.75, WD, d); S(k[0], k[1], d, 1.15, JT)
        S(a[0] + 1.0, a[1] + 0.5, d, 1.8, DARK, 1.0, 0.8)
    # Jacke mit Messingknöpfen, Kragen
    ch = (cx + lean, hip[1] - 6.0)
    tube((cx + lean * 0.3, hip[1] + 0.6), (ch[0], ch[1] - 3.6), 3.4, 3.0, RED, 0.0)
    S(ch[0], ch[1] - 3.6, 0.0, 3.0, RED, 2.6, 1.2)
    tube((cx + lean * 0.3 - 3.4, hip[1] + 0.2), (cx + lean * 0.3 + 3.4, hip[1] + 0.2), 0.45, 0.45, M('#3c0c0c', 0.8), 0.0)
    for k in range(3): S(ch[0] + 2.9 - k * 0.2 + lean * 0.1, ch[1] - 2.4 + k * 2.4, -1.6, 0.55, BRASS)
    tube((ch[0] - 2.6, ch[1] - 4.4), (ch[0] + 2.6, ch[1] - 4.4), 0.6, 0.6, REDL, 0.0)
    # Arme
    shf, shb = (ch[0] + 0.4, ch[1] - 3.6), (ch[0] - 0.6, ch[1] - 3.6)
    if pose == 'lunge':
        for sh, d in ((shb, 2.4), (shf, -2.6)):
            el = (sh[0] + 3.6, sh[1] + 0.6); hd = (sh[0] + 7.4, sh[1] + 0.2)
            tube(sh, el, 0.8, 0.75, WD, d); tube(el, hd, 0.75, 0.7, WD, d); S(el[0], el[1], d, 0.95, JT); S(hd[0], hd[1], d, 1.1, WL)
    else:
        sw = {'walk0': 1, 'walk1': -1, 'wind': -2.2}[pose]
        for sh, d, sg in ((shb, 2.4, -1), (shf, -2.6, 1)):
            el = (sh[0] + 1.2 * sw * sg, sh[1] + 4.2); hd = (sh[0] + 2.0 * sw * sg + (0.6 if pose != 'wind' else -0.6), sh[1] + 8.2 - (1.4 if pose == 'wind' else 0))
            tube(sh, el, 0.8, 0.75, WD, d); tube(el, hd, 0.75, 0.7, WD, d); S(el[0], el[1], d, 0.95, JT); S(hd[0], hd[1], d, 1.1, WL)
    # Hals, Holzkopf mit Knopfaugen, Wange, Mund, Riss; Gepäckträgermütze mit Messingschild
    hx, hy = ch[0] + 0.4 + lean * 0.3, ch[1] - 8.6
    tube((ch[0], ch[1] - 4.4), (hx, hy + 3.0), 0.8, 0.8, JT, 0.0)
    S(hx, hy, 0.0, 3.6, WD, 3.4, 3.8); S(hx + 0.6, hy - 1.2, -1.4, 2.4, WL, 1.6, 2.0)
    for ex, d in ((hx + 2.6, -1.8), (hx + 0.6, -2.9)):
        S(ex, hy + 0.2, d, 0.75, EYE, 0.5, 0.8); S(ex + 0.25, hy - 0.15, d - 0.5, 0.22, M('#ffffff', 0.2, 0, 1.5))
    S(hx + 1.6, hy + 2.0, -2.9, 0.8, M('#e86060', 0.6), 0.3, 0.5)
    tube((hx + 1.4, hy + 2.6), (hx + 3.2, hy + 2.4), 0.25, 0.25, M('#5c2c18', 0.7), -2.6)
    tube((hx - 1.6, hy - 2.4), (hx - 1.0, hy + 0.4), 0.2, 0.15, JT, -3.2)
    tube((hx - 0.4, hy - 3.0), (hx + 0.2, hy - 4.6), 3.7, 3.6, CAP, 0.0)
    S(hx + 0.2, hy - 4.6, 0.0, 3.6, CAP, 3.4, 0.6)
    S(hx + 3.0, hy - 2.8, -0.4, 2.6, DARK, 2.2, 0.45, (0, 0.15, 0))   # Schirm
    S(hx + 2.4, hy - 3.9, -2.4, 0.9, BRASS, 0.3, 0.6)                  # Schild

DRESS = [('#7c2c48', '#a84468', '#4c1828'), ('#2c5c7c', '#4c84a8', '#18344c'), ('#4c5c2c', '#6c8440', '#2c3818'), ('#5c3c6c', '#84589c', '#341c44')]
POSE = { # Arme: [Schulterwinkel, Ellbogenwinkel] je hinten/vorn (0 = hängt, π/2 = waagrecht), Kopfneigung
    'show': ((0.2, 1.9), (2.6, 0.2), 1), 'point': ((0.15, 0.1), (1.55, 0.05), 0), 'wave': ((0.2, 0.2), (2.7, 0.9), -1),
    'shy': ((2.2, 2.4), (2.3, 2.5), 1), 'hip': ((0.5, 2.3), (0.2, 0.2), -1), 'reach': ((1.45, 0.15), (1.55, 0.1), 0)}

def puppe(dress, pose):
    D0, D1, D2 = (M(c, 0.55, 0, 0.0, 0.4, 0.5) for c in DRESS[dress])
    SK, SH = M('#f2ece2', 0.18, 0, 0.05), M('#c8beb0', 0.3)
    POLE, BASE, EYE, LACE = M('#5c4c3c', 0.5, 0.3), M('#2c2420', 0.4, 0.5), M('#141018', 0.2), M('#f8f4ec', 0.5)
    cx, foot = 16.0, 41.4
    # Ständer
    S(cx, foot - 0.6, 0.0, 5.2, BASE, 3.2, 0.7); tube((cx, foot - 1.0), (cx, foot - 11.0), 0.7, 0.7, POLE, 0.0); S(cx, foot - 1.4, -0.4, 1.0, M('#c89020', 0.3, 0.9))
    # Rock (Glocke), Turnüre hinten, Mieder, Gürtel
    tube((cx, foot - 26.0), (cx + 0.2, foot - 18.0), 2.6, 4.6, D0, 0.0, caps=False)
    tube((cx + 0.2, foot - 18.0), (cx + 0.3, foot - 11.0), 4.6, 6.2, D0, 0.0, caps=False)
    tube((cx + 0.3, foot - 11.4), (cx + 0.3, foot - 10.6), 6.3, 6.4, D2, 0.0)
    S(cx - 3.4, foot - 19.0, 1.4, 2.0, D1, 2.0, 2.8)   # Turnüre
    for k in (-1, 1): tube((cx + k * 1.4, foot - 25.0), (cx + k * 3.6, foot - 11.6), 0.25, 0.3, D1, -2.5, -5.9)   # Falten
    tube((cx, foot - 32.6), (cx, foot - 25.8), 2.8, 2.4, D0, 0.0)
    tube((cx - 2.6, foot - 26.0), (cx + 2.6, foot - 26.0), 0.5, 0.5, M('#e8c060', 0.3, 0.8), 0.0)
    S(cx + 0.4, foot - 31.6, -1.8, 1.8, LACE, 0.6, 1.0)
    # Porzellanarme in zwei Gliedern
    A0, A1, tilt = POSE[pose]
    for side, (a1, a2), d in ((-1, A0, 1.8), (1, A1, -2.0)):
        sx, sy = cx + side * 3.0, foot - 31.4
        fwd = (lambda a: math.sin(a)) if pose in ('point', 'reach') else (lambda a: math.sin(a) * side)
        e = (sx + fwd(a1) * 5.2, sy + math.cos(a1) * 5.2); hnd = (e[0] + fwd(a1 + a2) * 5.0, e[1] + math.cos(a1 + a2) * 5.0)
        S(sx, sy, d, 1.3, D0); tube((sx, sy), e, 0.85, 0.75, SK, d); tube(e, hnd, 0.75, 0.6, SK, d); S(e[0], e[1], d, 0.8, SH); S(hnd[0], hnd[1], d, 0.95, SK)
    # Hals, Kopf (glattes Porzellanoval), aufgemalte Augen, Hut mit Feder
    hx, hy = cx + tilt * 0.6, foot - 36.0
    tube((cx, foot - 33.0), (hx, hy + 2.6), 0.8, 0.8, SK, 0.0)
    S(hx, hy, 0.0, 2.6, SK, 2.4, 3.1)
    for ex in (hx - 1.0, hx + 1.0): S(ex, hy + 0.1, -2.2, 0.38, EYE, 0.2, 0.42)
    S(hx, hy + 1.8, -2.2, 0.45, M('#c86070', 0.5), 0.2, 0.2)
    S(hx, hy - 2.2, 0.0, 4.6, D2, 3.6, 0.45)          # Krempe
    tube((hx, hy - 2.4), (hx + 0.2, hy - 4.4), 2.4, 2.1, D0, 0.0); S(hx + 0.2, hy - 4.4, 0.0, 2.1, D0, 2.1, 0.6)
    tube((hx + 2.0, hy - 3.6), (hx + 3.6, hy - 7.4), 0.5, 0.15, LACE, -0.6); tube((hx + 3.6, hy - 7.4), (hx + 4.6, hy - 6.6), 0.3, 0.1, LACE, -0.6)

os.makedirs(CFG['out'], exist_ok=True)
JOBS = [('holz_' + p, 30, 38, (lambda p=p: holz(p))) for p in ('walk0', 'walk1', 'wind', 'lunge')]
JOBS += [('puppe%d%s' % (d, p), 32, 42, (lambda d=d, p=p: puppe(d, p))) for d in range(4) for p in POSE]
for name, w, h, fn in JOBS:
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); fn(); shot(name)
print('ok')
