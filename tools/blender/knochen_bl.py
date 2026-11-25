# HD-3D für die häufigsten Schlossgegner: Skelett (Knochen, glühende Augenhöhlen, zerschlissener Lendenschurz), Eisskelett (bereifte
# Knochen, Eiszapfen, kaltes Glühen) und Ritter (Plattenrüstung mit rotem Helmbusch, Wappenrock, Schwert). Blick nach rechts.
# Skelett/Eisskelett: Bildfeld 32×36, Körpermitte x = 16, Füße unten. Ritter: 48×40, Körpermitte x = 24 (Platz für den Ausfall).
# Posen: skel_walk0/1, skel_throw, ice_walk0/1, ice_throw, knight_walk0/1, knight_wind, knight_thrust.
# Aufruf: python bl.py knochen_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_knochen", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def limb(a, b, c, r1, r2, mat, d, joint=None):   # Ober- und Unterteil mit Gelenk
    tube(a, b, r1, r1 * 0.85, mat, d); tube(b, c, r2, r2 * 0.8, mat, d); S(b[0], b[1], d, r1 * 0.95, joint or mat)

# Beinstellungen relativ zur Hüfte: (Knie vorn, Fuß vorn, Knie hinten, Fuß hinten) in Bildpixeln, je Pose
LEGS = {
    'walk0': ((2.6, 6.4), (3.6, 13.0), (-2.0, 6.6), (-3.8, 13.0)),
    'walk1': ((1.0, 6.8), (0.2, 13.2), (-0.2, 6.6), (0.8, 13.2)),
    'throw': ((2.8, 6.2), (4.4, 13.0), (-2.4, 6.4), (-4.4, 13.0)),
}

def skelett(pose, ice=False):
    if ice:
        BONE, JOINT = M('#cfe6f2', 0.35, 0.05, 0.08), M('#8cb4cc', 0.4)
        EYE, CLOTH = M('#7cf0ff', 0.2, 0, 3.5), M('#3c5c7c', 0.8)
        ICE = M('#e8fcff', 0.08, 0, 0.35)
    else:
        BONE, JOINT = M('#e4dcc4', 0.6), M('#a89c80', 0.65)
        EYE, CLOTH = M('#ff5020', 0.2, 0, 3.5), M('#4c3828', 0.85)
    SASH = [M('#f08020', 0.8), M('#20a8a0', 0.8), M('#e04890', 0.8)] if not ice else None   # Calaca: Schärpe in Totenfest-Farben
    DARK = M('#140c08', 0.9)
    kind = pose.split('_')[1]
    cx, hy = 16.0, 21.5
    lean = 0.5 if kind == 'throw' else 0.0
    # Beine
    kf, af, kb, ab = LEGS[kind]
    hip = (cx + 0.4, hy)
    for (kn, an, d) in ((kb, ab, 1.4), (kf, af, -1.4)):
        k = (hip[0] + kn[0], hip[1] + kn[1]); a = (hip[0] + an[0], min(34.6, hip[1] + an[1]))
        limb(hip, k, a, 0.85, 0.7, BONE, d, JOINT)
        S(a[0] + 1.3, 35.0, d, 1.7, BONE, 0.9, 0.55)   # Fuß
    # Becken, Lendenschurz, Wirbelsäule, Brustkorb
    S(cx + 0.3, hy, 0.2, 2.8, BONE, 1.9, 1.3)
    for k in range(3): S(cx - 0.6 + k * 1.2, hy + 2.0 + (k % 2) * 0.6, -1.0, 1.4, SASH[k] if SASH else CLOTH, 0.5, 2.0 + (k % 2) * 0.6)
    top = (cx + lean, 12.6)
    for i in range(9):
        t = i / 8; S(cx + 0.2 + (top[0] - cx) * t, hy - 1.2 - (hy - 1.2 - top[1]) * t, 0.8, 0.62, JOINT if i % 2 else BONE)
    for k in range(4):   # Rippen: vorn und hinten je ein Bogen
        y = 13.6 + k * 1.75; w = 3.4 - abs(k - 1.2) * 0.45
        for side, d in ((1, -1.3), (-1, 1.3)):
            tube((cx + lean * (1 - k / 4) - 0.2, y), (cx + lean * (1 - k / 4) + side * w, y + 0.9), 0.48, 0.38, BONE, 0.6, d)
    S(cx + lean + 1.6, 15.6, -1.6, 0.5, BONE, 0.4, 2.4)   # Brustbein
    S(cx + lean, 12.8, 0.0, 3.2, BONE, 1.8, 0.7)          # Schlüsselbeine
    # Schädel mit Kiefer und glühenden Höhlen
    hx, hy2 = cx + lean + 1.4, 7.0
    tube((cx + lean + 0.3, 12.4), (hx - 0.4, hy2 + 2.6), 0.55, 0.5, JOINT, 0.0)
    S(hx, hy2, 0.0, 3.3, BONE, 2.9, 3.5)
    S(hx + 1.4, hy2 + 3.0, -0.3, 2.0, BONE, 1.7, 1.1)
    for k in range(4): S(hx + 0.6 + k * 0.7, hy2 + 2.2, -1.9, 0.3, M('#f8f4e8', 0.4), 0.2, 0.45)
    for ex, ey, dd in ((hx + 1.9, hy2 - 0.2, -2.1), (hx + 0.1, hy2 - 0.3, -2.6)):
        S(ex, ey, dd, 0.95, DARK, 0.5, 1.05); S(ex + 0.1, ey + 0.1, dd - 0.4, 0.42, EYE)
    S(hx + 2.7, hy2 + 1.0, -1.6, 0.45, DARK, 0.3, 0.6)    # Nasenloch
    if not ice:   # Calaca: bemalter Zuckerschädel – Blütenringe um die Augen, Stirnblume, genähter Mund, Ringelblume hinterm Ohr
        TEAL, PINK, YEL, ORA, ORA2 = M('#20c8c0', 0.4), M('#f050a0', 0.4), M('#f8d020', 0.4), M('#f89820', 0.6), M('#fcc040', 0.6)
        for ex, ey, dd in ((hx + 1.9, hy2 - 0.2, -2.3), (hx + 0.1, hy2 - 0.3, -2.8)):
            for k in range(8): a = k / 8 * math.tau; S(ex + math.cos(a) * 1.45, ey + math.sin(a) * 1.55, dd - 0.15, 0.55, TEAL if k % 2 else PINK)
        S(hx + 0.9, hy2 - 2.7, -2.6, 0.7, YEL)
        for k in range(5): a = k / 5 * math.tau - 1.57; S(hx + 0.9 + math.cos(a) * 1.0, hy2 - 2.7 + math.sin(a) * 1.0, -2.5, 0.6, PINK)
        for k in range(5): S(hx + 0.4 + k * 0.75, hy2 + 3.3, -2.0, 0.22, DARK, 0.15, 0.5)   # Nähte über dem Mund
        for k in range(7): a = k / 7 * math.tau; S(hx - 2.6 + math.cos(a) * 1.2, hy2 - 1.6 + math.sin(a) * 1.2, -0.6, 0.85, ORA if k % 2 else ORA2)   # Ringelblume
        S(hx - 2.6, hy2 - 1.6, -1.2, 0.7, M('#c86010', 0.7))
    # Arme: hinterer Arm, vorderer Arm (beim Wurf mit Knochen über dem Kopf)
    shf, shb = (cx + lean + 1.6, 13.4), (cx + lean - 1.6, 13.4)
    if kind == 'throw':
        limb(shb, (shb[0] + 2.6, 17.2), (shb[0] + 5.6, 15.8), 0.62, 0.52, BONE, 2.2, JOINT)
        el, hd = (shf[0] - 3.0, 10.6), (shf[0] - 5.6, 6.6)
        limb(shf, el, hd, 0.65, 0.55, BONE, -2.4, JOINT)
        tube((hd[0] - 1.6, hd[1] - 1.9), (hd[0] + 1.6, hd[1] + 1.9), 0.55, 0.55, BONE, -2.9)   # geworfener Knochen
        for e in ((hd[0] - 1.6, hd[1] - 1.9), (hd[0] + 1.6, hd[1] + 1.9)):
            S(e[0] - 0.4, e[1], -2.9, 0.75, BONE); S(e[0] + 0.4, e[1], -2.9, 0.75, BONE)
    else:
        sw = 1 if kind == 'walk0' else -1
        limb(shb, (shb[0] + 1.6 * sw, 18.2), (shb[0] + 2.8 * sw + 0.6, 22.4), 0.62, 0.52, BONE, 2.2, JOINT)
        limb(shf, (shf[0] - 1.4 * sw, 18.2), (shf[0] - 1.8 * sw + 1.4, 22.2), 0.65, 0.55, BONE, -2.4, JOINT)
    if ice:   # Raureif und Eiszapfen
        for x, y, r in ((hx - 0.8, hy2 - 3.0, 1.0), (hx + 1.2, hy2 - 3.3, 0.8), (shf[0], 12.6, 0.9), (shb[0], 12.4, 0.8), (cx + 1.0, hy + 0.6, 0.7)):
            S(x, y, -0.6, r, ICE)
        for x, y, L in ((cx - 1.4, 20.6, 2.6), (cx + 1.8, 20.4, 2.0), (hx + 1.6, hy2 + 4.0, 1.8)):
            tube((x, y), (x, y + L), 0.45, 0.05, ICE, -1.8)

KLEGS = {
    'walk0': ((3.0, 7.0), (4.4, 15.6), (-2.6, 7.2), (-4.4, 15.6)),
    'walk1': ((1.2, 7.4), (0.4, 15.8), (-0.4, 7.2), (1.0, 15.8)),
    'wind':  ((3.4, 6.0), (5.4, 14.4), (-3.6, 6.4), (-6.2, 15.0)),
    'thrust': ((6.0, 5.4), (8.8, 13.6), (-5.0, 6.2), (-9.6, 13.0)),
}

def ritter(pose):
    STEEL, STEELL, DARK = M('#8c8cac', 0.35, 0.55), M('#c4c4dc', 0.3, 0.6), M('#16161e', 0.7, 0.2)
    GOLD, PLUME, CLOTH = M('#c89020', 0.3, 0.9), M('#c82410', 0.75, 0, 0.05), M('#3a0e22', 0.9)
    BLADE, VISOR = M('#dce0ec', 0.15, 0.95), M('#ff4020', 0.2, 0, 2.5)
    kind = pose.split('_')[1]
    cx = 24.0; hy = 23.0 + {'walk0': 0, 'walk1': 0, 'wind': 1.4, 'thrust': 2.2}[kind]
    lean = {'walk0': 0.3, 'walk1': 0.3, 'wind': -1.0, 'thrust': 2.4}[kind]
    kf, af, kb, ab = KLEGS[kind]
    hip = (cx, hy)
    for (kn, an, d) in ((kb, ab, 1.8), (kf, af, -1.8)):
        k = (hip[0] + kn[0], hip[1] + kn[1]); a = (hip[0] + an[0], min(38.4, hip[1] + an[1]))
        limb(hip, k, a, 1.55, 1.3, STEEL, d, STEELL)
        S(a[0] + 1.6, 38.8, d, 2.3, STEEL, 1.3, 0.8)   # Eisenschuh
    # Wappenrock (flaches Tuch vorn), Beintaschen als Kegel, Gürtel
    box(cx - 0.4 + lean * 0.3, hy - 1.0, cx + 2.6 + lean * 0.3, hy + 7.4, CLOTH, -3.4, -2.9); box(cx - 0.2 + lean * 0.3, hy + 6.6, cx + 2.4 + lean * 0.3, hy + 7.2, GOLD, -3.5, -3.3)
    tube((cx + lean * 0.4, hy - 2.4), (cx, hy + 1.4), 2.7, 3.4, STEEL, 0.0)
    for k in range(2): tube((cx - 3.2 + lean * 0.3, hy - 0.6 + k * 1.4), (cx + 3.3 + lean * 0.3, hy - 0.6 + k * 1.4), 0.25, 0.25, DARK, -0.2)
    tube((cx - 3.0 + lean * 0.5, hy - 2.6), (cx + 3.2 + lean * 0.5, hy - 2.6), 0.55, 0.55, GOLD, 0.0)
    # Brustpanzer als Kegel mit Grat, Schulterstücke in Lagen, Topfhelm mit Sehschlitz und Busch
    ch = (cx + lean * 0.6, hy - 7.0)
    tube((cx + lean * 0.5, hy - 2.8), (ch[0] + 0.2, ch[1] - 2.2), 2.6, 3.5, STEEL, 0.0)
    S(ch[0] + 0.2, ch[1] - 2.2, 0.0, 3.5, STEEL, 3.0, 1.6)
    tube((ch[0] + 3.0, hy - 3.2), (ch[0] + 3.3, ch[1] - 2.0), 0.35, 0.35, STEELL, -1.4)   # Grat
    sh = (ch[0], ch[1] - 4.0)
    for d, sg in ((-2.9, 1), (2.9, -1)):
        for k in range(2): S(sh[0] + (1.0 if d < 0 else -1.4), sh[1] + 0.8 + k * 1.4, d, 2.5 - k * 0.4, STEELL if k == 0 else STEEL, 1.8, 1.1, (0, 0.25 * sg, 0))
    hx, hy2 = sh[0] + 0.8 + lean * 0.3, sh[1] - 4.4
    tube((hx, hy2 - 2.4), (hx, hy2 + 2.8), 3.0, 3.1, STEEL, 0.0)
    S(hx, hy2 - 2.4, 0.0, 3.0, STEEL, 3.0, 1.4)
    tube((hx + 1.0, hy2 - 0.6), (hx + 3.2, hy2 - 0.6), 0.45, 0.45, DARK, -1.6)   # Sehschlitz
    S(hx + 3.0, hy2 - 0.6, -1.9, 0.32, VISOR)
    for k in range(3): S(hx + 2.7, hy2 + 1.0 + k * 0.7, -1.7, 0.22, DARK, 0.25, 0.18)
    tube((hx + 2.9, hy2 - 3.0), (hx + 3.0, hy2 + 2.6), 0.3, 0.3, GOLD, -0.9)   # Band über dem Gesicht
    for i in range(14):   # Helmbusch: Bogen nach hinten, beim Ausfall fliegt er flacher
        t = i / 13; ang = math.radians(100 + 70 * t - (25 if kind == 'thrust' else 0))
        r = 2.0 + 6.5 * t
        S(hx - 0.4 + math.cos(ang) * r * 0.9, hy2 - 3.4 - math.sin(ang) * r * 0.55 + t * t * 3.0, 0.0, 1.3 - 0.5 * t, PLUME, 1.0 - 0.3 * t, 1.1 - 0.4 * t)
    # Arme und Schwert
    shf, shb = (sh[0] + 1.6, sh[1] + 1.2), (sh[0] - 1.6, sh[1] + 1.2)
    limb(shb, (shb[0] - 1.6, shb[1] + 5.0), (shb[0] + 0.4, shb[1] + 9.0), 1.2, 1.0, STEEL, 3.2, STEELL)
    if kind in ('walk0', 'walk1'):
        el, hd = (shf[0] + 2.4, shf[1] + 4.6), (shf[0] + 5.2, shf[1] + 3.2)
        tip = (hd[0] + 7.0, hd[1] - 9.6)
    elif kind == 'wind':
        el, hd = (shf[0] - 2.6, shf[1] + 3.4), (shf[0] - 4.2, shf[1] + 0.6)
        tip = (hd[0] + 13.0, hd[1] - 1.2)
    else:
        el, hd = (shf[0] + 4.6, shf[1] + 2.0), (shf[0] + 9.0, shf[1] + 2.4)
        tip = (hd[0] + 14.0, hd[1] + 0.4)
    limb(shf, el, hd, 1.2, 1.0, STEEL, -3.2, STEELL)
    S(hd[0], hd[1], -3.4, 1.3, STEELL)   # Handschuh
    L = math.hypot(tip[0] - hd[0], tip[1] - hd[1]); ux, uy = (tip[0] - hd[0]) / L, (tip[1] - hd[1]) / L
    base = (hd[0] + ux * 1.2, hd[1] + uy * 1.2)
    tube(base, tip, 0.55, 0.12, BLADE, -3.6)
    tube((base[0] - uy * 2.0, base[1] + ux * 2.0), (base[0] + uy * 2.0, base[1] - ux * 2.0), 0.4, 0.4, GOLD, -3.6)   # Parierstange
    S(hd[0] - ux * 1.8, hd[1] - uy * 1.8, -3.6, 0.7, GOLD)   # Knauf
    if kind == 'thrust':   # Schwung des Stoßes
        for k in range(3): S(tip[0] - 3 - k * 3, tip[1] + rnd_off(k), -4.0, 0.25, M('#f8f4e8', 0.3, 0, 2.0), 1.2, 0.2)

def rnd_off(k): return (-1.0, 0.6, -0.4)[k]

os.makedirs(CFG['out'], exist_ok=True)
JOBS = [('skel_walk0', 32, 36, lambda: skelett('skel_walk0')), ('skel_walk1', 32, 36, lambda: skelett('skel_walk1')), ('skel_throw', 32, 36, lambda: skelett('skel_throw')),
        ('ice_walk0', 32, 36, lambda: skelett('ice_walk0', True)), ('ice_walk1', 32, 36, lambda: skelett('ice_walk1', True)), ('ice_throw', 32, 36, lambda: skelett('ice_throw', True)),
        ('knight_walk0', 48, 40, lambda: ritter('knight_walk0')), ('knight_walk1', 48, 40, lambda: ritter('knight_walk1')),
        ('knight_wind', 48, 40, lambda: ritter('knight_wind')), ('knight_thrust', 48, 40, lambda: ritter('knight_thrust'))]
for name, w, h, fn in JOBS:
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); fn(); shot(name)
print('ok')
