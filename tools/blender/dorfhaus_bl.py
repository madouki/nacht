# Häuser von Unkenbrunn (Dorfstraße, js/dorf.js), zweite Fassung: Fachwerkhäuser in leichter Schrägansicht (um 20° gedreht, damit
# Seitenwand und Dachfläche Tiefe zeigen), bei Mondlicht mit warmem Licht aus den Fenstern.
# Baukasten fachwerk(): Bruchsteinsockel, Erdgeschoss, vorkragendes Obergeschoss, Gefache in leicht wechselnden Farben, Balken mit
# Streben, Giebel mit Rundfenster, Dach aus Ziegelreihen mit First und Ortgang, Fenster mit Rahmen, Sprossen, Gardinen, Fensterbank,
# Läden und Blumenkasten, Rundbogentür mit Brettern, Klinke, Stufe und Türlampe, Schornstein, Efeu, Seitenfenster.
# Stücke: haus (rosa Gefache, rotes Dach), haus2 (schmal, hoch, Schiefer, Erker), haus3 (Bäckerei, Ocker, Brezel), wirtshaus
# („Zur Fetten Unke“, moosgrünes Dach, Schild, Fässer), turm (Eulalias schiefer Wetterturm aus Steinringen mit Balkon).
# Je Stück schreibt das Skript <name>_meta.json: Umriss im Bild (für den Zuschnitt) und Schornsteinspitze (für den Rauch im Spiel).
# Aufruf: python bl.py dorfhaus_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_dorf", "ss": 4, "what": [...]}'; danach pack_dorf.py.
import bpy, bmesh, math, os, json, random
from mathutils import Vector
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))
YAW = math.radians(CFG.get('yaw', -20))

def L(x, z): return (x + FW / 2, FH - z)                       # lokal (x nach rechts, z nach oben, Mitte 0) → Bild
def B(x, z, y, w, h, d, mat, bev=0.3, rot=0.0): px, py = L(x, z); return box(px, py, y, w, h, d, mat, bev, rot)
def Pr(x, z, y, pts, d, mat, bev=0.2): px, py = L(x, z); return prism(px, py, y, [(a, -b) for a, b in pts], d, mat, bev)
def Sp(x, z, y, r, mat, ry=None, rz=None): px, py = L(x, z); return S(px, py, y, r, mat, ry, rz)
def Tu(a, b, r0, r1, mat, y0=0.0, y1=None, caps=True): return tube(L(*a), L(*b), r0, r1, mat, y0, y1, caps)
def hx(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def jit(h, k, R): f = 1 + R.uniform(-k, k); return '#%02x%02x%02x' % tuple(max(0, min(255, int(c * f))) for c in hx(h))
def mix(a, b, t): A, Bc = hx(a), hx(b); return '#%02x%02x%02x' % tuple(int(A[i] + (Bc[i] - A[i]) * t) for i in range(3))
CHIM = []
def lamp(x, z, y, energy, col=(1.0, 0.72, 0.4), r=2.0):
    Ld = bpy.data.lights.new('w', 'POINT'); Ld.energy = energy; Ld.color = col; Ld.shadow_soft_size = r
    o = bpy.data.objects.new('w', Ld); bpy.context.scene.collection.objects.link(o); px, py = L(x, z); o.location = (px - FW / 2, y, FH - py); OBJ.append(o); return o
def night():  # Mondlicht statt Atelierlicht; Umgebungsverdeckung, falls es sie gibt
    for o in bpy.context.scene.objects:
        if o.type == 'LIGHT' and o.data.type == 'SUN':
            if o.name.startswith('Key'): o.data.energy = 2.4; o.data.color = (0.78, 0.84, 1.0)
            elif o.name.startswith('Fill'): o.data.energy = 0.8; o.data.color = (0.6, 0.66, 1.0)
            elif o.name.startswith('Rim'): o.data.energy = 1.8
            elif o.name.startswith('Under'): o.data.energy = 0.0
    sc = bpy.context.scene
    for k, v in (('use_gtao', True), ('gtao_distance', 8.0), ('use_soft_shadows', True), ('taa_render_samples', 48)):
        try: setattr(sc.eevee, k, v)
        except Exception: pass
def turn(name, yaw=None):  # alles um die senkrechte Mittelachse drehen, Umriss und Schornstein für den Zuschnitt merken
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    for o in OBJ:
        if o.parent is None: o.parent = e
    e.rotation_euler = (0, 0, YAW if yaw is None else yaw); OBJ.append(e); bpy.context.view_layer.update()
    xs, zs = [], []
    for o in OBJ:
        if o.type != 'MESH': continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); xs.append(w.x); zs.append(w.z)
    meta = {'bbox': [min(xs) + FW / 2, FH - max(zs), max(xs) + FW / 2, FH - min(zs)], 'size': [FW, FH],
            'chimney': [[c.matrix_world.translation.x, c.matrix_world.translation.z] for c in CHIM]}
    json.dump(meta, open(os.path.join(CFG['out'], name + '_meta.json'), 'w')); CHIM.clear()

def fenster(x, z, w, h, y, m, R, shut=True, flowers=True, light=True):  # Fenster auf der Vorderseite (y = Wandfläche)
    B(x, z, y - 0.5, w + 4, h + 4, 1.4, m['beam'], 0.3)
    B(x, z, y - 1.2, w, h, 0.5, m['glass'], 0.1)
    for s in (-1, 1): B(x + s * (w / 2 - 2.0), z + 0.5, y - 1.7, 3.2, h - 1.5, 0.4, m['curtain'], 0.2)
    B(x, z, y - 2.0, 1.2, h, 0.7, m['beam'], 0.1); B(x, z + h * 0.12, y - 2.0, w, 1.2, 0.7, m['beam'], 0.1)
    B(x, z - h / 2 - 2.2, y - 2.0, w + 6, 1.6, 3.6, m['sill'], 0.4)
    if shut:
        for s in (-1, 1):
            sx = x + s * (w / 2 + 2 + w / 4)
            B(sx, z, y - 0.9, w / 2, h + 2, 1.0, m['shut'], 0.25)
            for k in range(4): B(sx, z - h / 2 + (k + 0.8) * h / 4.4, y - 1.5, w / 2 - 1.4, 0.7, 0.3, m['shutd'], 0)
    if flowers:
        B(x, z - h / 2 - 5.4, y - 3.4, w + 4, 4.4, 4.2, m['box'], 0.4)
        for k in range(int(w / 3) + 1):
            fx = x - w / 2 + k * 3 + R.uniform(-0.5, 0.5)
            Sp(fx, z - h / 2 - 2.4 + R.uniform(-0.6, 0.8), y - 4.4 + R.uniform(-0.8, 0.8), R.uniform(1.4, 2.0), m['leaf'])
            if k % 2 == 0: Sp(fx + 0.6, z - h / 2 - 1.4 + R.uniform(0, 1.2), y - 5.4, R.uniform(1.0, 1.4), R.choice(m['flowers']))
    if light: lamp(x, z, y - 9, 2200)

def tuer(x, w, h, y, m, R, lampside=1):  # Rundbogentür auf dem Sockel
    FB = m['FB']; arc = [(math.cos(math.pi * i / 12) * w / 2, h - w / 2 + math.sin(math.pi * i / 12) * w / 2) for i in range(13)]
    R2 = w / 2 + 2.4; Pr(x, FB, y - 0.3, [(-R2, 0), (R2, 0)] + [(math.cos(math.pi * i / 12) * R2, h - w / 2 + math.sin(math.pi * i / 12) * R2) for i in range(13)], 1.6, m['beam'], 0.3)
    Pr(x, FB, y - 1.1, [(-w / 2, 0), (w / 2, 0)] + [(px, pz) for px, pz in arc], 1.4, m['door'], 0.2)
    for k in range(1, 4): B(x - w / 2 + k * w / 4, FB + (h - w / 2) / 2, y - 1.9, 0.5, h - w / 2 - 1, 0.3, m['doord'], 0)
    for k in (0.3, 0.75): B(x, FB + (h - w / 2) * k, y - 2.0, w - 2, 1.0, 0.4, m['iron'], 0.1)
    Sp(x + w * 0.3, FB + h * 0.42, y - 2.4, 0.9, m['brass']); ring(L(x, FB + h * 0.56)[0], L(x, FB + h * 0.56)[1], y - 2.2, 1.6, 0.35, m['brass'])
    B(x, 1.3, y - 4.0, w + 9, 2.6, 6.4, m['step'], 0.6)
    lx = x + lampside * (w / 2 + 6)
    Tu((lx, FB + h + 1), (lx, FB + h + 1), 0.4, 0.4, m['iron'], y - 0.5, y - 4.5, False)
    B(lx, FB + h - 2, y - 4.5, 3.4, 4.6, 3.4, m['lampglass'], 0.4); B(lx, FB + h + 0.8, y - 4.5, 4.6, 1.2, 4.6, m['iron'], 0.3)
    lamp(lx, FB + h - 2, y - 8, 900, (1.0, 0.7, 0.36))

def efeu(x0, z0, z1, y, R, mats, n=34):  # Efeu rankt an einer Ecke hoch
    x, z = x0, z0
    for i in range(n):
        z += (z1 - z0) / n * R.uniform(0.6, 1.4); x += R.uniform(-2.2, 2.2); x = max(x0 - 6, min(x0 + 6, x))
        Sp(x, z, y - R.uniform(0.4, 1.6), R.uniform(1.4, 2.6), R.choice(mats))

def fachwerk(o):
    R = random.Random(o.get('seed', 1)); mats()
    W, D, H1, H2, RH, J = o['W'], o['D'], o['H1'], o['H2'], o['RH'], o.get('jetty', 3); FB = 8
    m = {'FB': FB, 'beam': M(o['beam'], 0.65), 'glass': M('#ffc868', 0.35, 0, 3.4), 'curtain': M(o.get('curtain', '#a83c3c'), 0.8), 'sill': M('#8c7c6c', 0.8),
         'shut': M(o['shut'], 0.6), 'shutd': M(mix(o['shut'], '#000000', 0.35), 0.7), 'box': M('#6c4424', 0.7), 'leaf': M('#3c8c3c', 0.6),
         'flowers': [M(c, 0.5) for c in o.get('flowers', ['#e83c3c', '#f8d048', '#f070c0', '#f8f0f8'])], 'door': M(o.get('doorcol', '#5c3418'), 0.6),
         'doord': M('#3a2010', 0.7), 'iron': M('#2c2830', 0.4, 0.8), 'brass': M('#d8a840', 0.3, 0.9), 'step': M('#6c6474', 0.9), 'lampglass': M('#ffb048', 0.3, 0, 2.2)}
    fy, z1 = -D / 2, FB + H1; z2 = z1 + H2; fy2 = fy - J; Wx = W / 2 + J
    # Sockel: Bruchsteine vorn und an der rechten Seite
    B(0, FB / 2, 0, W + 2, FB, D + 2, M('#4c4654', 0.9), 0.6)
    for row in range(2):
        x = -W / 2 - 1
        while x < W / 2 + 0.5:
            w = min(R.uniform(6, 11), W / 2 + 1 - x); B(x + w / 2, row * 4 + 2, fy - 1.4, w - 0.7, 3.4, 1.4, M(jit('#7c7488', 0.14, R), 0.9), 0.5); x += w
        yy = -D / 2 - 1
        while yy < D / 2 + 0.5:
            w = min(R.uniform(6, 11), D / 2 + 1 - yy); B(W / 2 + 1.4, row * 4 + 2, yy + w / 2, 1.4, 3.4, w - 0.7, M(jit('#7c7488', 0.14, R), 0.9), 0.5); yy += w
    # Wände und Gefache
    B(0, FB + H1 / 2, 0, W, H1, D, M(o['wall'], 0.9), 0.4)
    B(0, z1 + H2 / 2, 0, W + 2 * J, H2, D + 2 * J, M(o['wall'], 0.9), 0.4)
    posts = o.get('posts', 5)
    for (y0, zA, zB, half) in ((fy, FB, z1, W / 2), (fy2, z1, z2, Wx)):
        xs = [-half + 2 * half * k / posts for k in range(posts + 1)]; rail = (zA + zB) / 2
        for i in range(posts):
            for (a, b) in ((zA, rail), (rail, zB)):
                B((xs[i] + xs[i + 1]) / 2, (a + b) / 2, y0 - 0.3, xs[i + 1] - xs[i] - 2.4, b - a - 2.4, 0.7, M(jit(mix(o['wall'], o['infill'], R.uniform(0.3, 1.0)), 0.04, R), 0.92), 0.2)
        for x in xs: B(x, (zA + zB) / 2, y0 - 1.0, 3.0, zB - zA, 2.0, m['beam'], 0.4)
        for z in (zA + 1.4, rail, zB - 1.4): B(0, z, y0 - 1.0, 2 * half + 2, 2.8, 2.2, m['beam'], 0.4)
        for i in (0, posts - 1):   # Streben in den Eckfeldern
            cx, cz = (xs[i] + xs[i + 1]) / 2, (zA + rail) / 2; dl = math.hypot(xs[i + 1] - xs[i], rail - zA)
            B(cx, cz, y0 - 1.2, 2.4, dl * 0.95, 1.8, m['beam'], 0.3, math.atan2(xs[i + 1] - xs[i], rail - zA) * (1 if i == 0 else -1))
        # Seitenwand rechts: Pfosten und Riegel
        sx = half + 1.0
        for k in range(4): B(sx, (zA + zB) / 2, -D / 2 - (J if zA > FB else 0) + (D + (2 * J if zA > FB else 0)) * k / 3, 2.0, zB - zA, 3.0, m['beam'], 0.4)
        for z in (zA + 1.4, rail, zB - 1.4): B(sx, z, 0, 2.2, 2.8, D + (2 * J if zA > FB else 0) + 2, m['beam'], 0.4)
    # Giebel mit Balken und Rundfenster
    Pr(0, z2, 0, [(-Wx, 0), (Wx, 0), (0, RH)], D + 2 * J, M(o['wall'], 0.9), 0.3)
    for gx in (-Wx / 2, 0, Wx / 2):
        gh = RH * (1 - abs(gx) / Wx) - 2; B(gx, z2 + gh / 2, fy2 - 1.0, 2.6, gh, 1.8, m['beam'], 0.3)
    cw = Wx * 1.1; B(0, z2 + RH * 0.45, fy2 - 1.0, cw, 2.6, 2.0, m['beam'], 0.3)
    gz = z2 + RH * 0.24
    for side in (-1, 1):
        if o.get('gable_win', True): disc(L(side * Wx / 4, gz)[0], L(side * Wx / 4, gz)[1], fy2 - 1.3, 3.0, 0.8, m['glass'], 24); ring(L(side * Wx / 4, gz)[0], L(side * Wx / 4, gz)[1], fy2 - 1.7, 3.2, 0.7, m['beam'])
    # Dach: Ziegelreihen auf beiden Flächen, First, Ortgang
    ex, ez, top = Wx + 5, z2 - 2, z2 + RH + 3; s = math.atan2(top - ez, ex); Ls = math.hypot(ex, top - ez); n = o.get('rows', 8)
    dd = D + 2 * J + 12; ROOF, ROOFD = o['roof'], mix(o['roof'], '#000000', 0.3)
    for side in (-1, 1):
        for i in range(n):
            t = (i + 0.5) / n; x, z = side * ex * (1 - t), ez + (top - ez) * t
            nx, nz = side * math.sin(s), math.cos(s)
            B(x + nx * 1.4, z + nz * 1.4, 0, Ls / n + 2.2, 2.6, dd, M(jit(ROOF if i % 2 else ROOFD, 0.06, R), 0.7), 0.5, side * s)
        xm, zm = side * ex / 2, (ez + top) / 2
        B(xm + side * math.sin(s) * 2.6, zm + math.cos(s) * 2.6, -dd / 2 - 0.6, Ls + 2, 2.4, 1.6, m['beam'], 0.3, side * s)   # Ortgang
    Tu((0, top + 2.6), (0, top + 2.6), 2.2, 2.2, M(ROOFD, 0.7), -dd / 2, dd / 2, True)                                       # First
    # Schornstein auf der rechten Dachfläche
    if o.get('chimney', True):
        cx = ex * 0.38; cb = ez + (top - ez) * (1 - cx / ex) - 4; ct = top + o.get('chim_h', 10)
        B(cx, (cb + ct) / 2, D * 0.15, 7, ct - cb, 7, M('#8c4c3c', 0.8), 0.4); c = B(cx, ct + 1.0, D * 0.15, 9.4, 2.2, 9.4, M('#5c2c24', 0.8), 0.4); CHIM.append(c)
    # Fenster vorn (je Geschoss) und an der Seite
    for (fx, fl) in o['wins']:
        zc = FB + H1 * 0.58 if fl == 0 else z1 + H2 * 0.52; yy = fy if fl == 0 else fy2
        fenster(fx, zc, o.get('ww', 12), o.get('wh', 15) if fl == 0 else o.get('wh2', 13), yy, m, R, shut=o.get('shutters', True), flowers=fl == 1 or o.get('flowers0', False), light=True)
    for (wy, fl) in o.get('side', [(-4, 0), (6, 1)]):
        zc = FB + H1 * 0.58 if fl == 0 else z1 + H2 * 0.52; sx = (W / 2 if fl == 0 else Wx) + 0.4
        B(sx, zc, wy, 1.4, 16, 12, m['beam'], 0.3); B(sx + 0.6, zc, wy, 0.6, 12, 8, m['glass'], 0.1); B(sx + 1.0, zc, wy, 0.6, 12, 1.0, m['beam'], 0)
    tuer(o['door'][0], o['door'][1], o['door'][2], fy, m, R, o.get('lampside', 1))
    if o.get('ivy') is not None: efeu(o['ivy'], FB, z1 + H2 * 0.8, fy - 1.5, R, [M('#2f6c34', 0.6), M('#3c7c3c', 0.6), M('#4c8c40', 0.6)])
    return m, fy, fy2, z1, z2, Wx

def haus():   # rosa Gefache, rotes Dach, grüne Läden, Efeu links
    fachwerk({'seed': 3, 'W': 88, 'D': 44, 'H1': 44, 'H2': 34, 'RH': 40, 'wall': '#e8dccc', 'infill': '#d89c94', 'beam': '#4c2c1c', 'roof': '#a8442c',
              'shut': '#3c7c4c', 'wins': [(-28, 0), (28, 0), (-26, 1), (0, 1), (26, 1)], 'door': (2, 16, 30), 'ivy': -40})
    turn('haus')

def haus2():  # schmal, hoch, Schiefer, Erker mit drei Fenstern, rote Läden
    m, fy, fy2, z1, z2, Wx = fachwerk({'seed': 5, 'W': 66, 'D': 40, 'H1': 48, 'H2': 40, 'RH': 52, 'wall': '#dcd8e8', 'infill': '#a8b8d8', 'beam': '#3c2a3c',
              'roof': '#3c4c7c', 'shut': '#a83c3c', 'curtain': '#3c5ca8', 'wins': [(-20, 0)], 'door': (14, 15, 32), 'posts': 4, 'lampside': -1, 'rows': 9, 'chim_h': 14})
    R = random.Random(9); B(0, z1 + 20, fy2 - 6, 40, 26, 10, M('#dcd8e8', 0.9), 0.5)   # Erker
    for ex in (-13, 0, 13): fenster(ex, z1 + 20, 9, 14, fy2 - 11, m, R, shut=False, flowers=False)
    Pr(0, z1 + 33, fy2 - 6, [(-23, 0), (23, 0), (0, 9)], 12, M('#3c4c7c', 0.6), 0.4)
    B(0, z1 + 6.4, fy2 - 6.5, 42, 2.6, 11, m['beam'], 0.4)
    turn('haus2')

def haus3():  # Bäckerei: Ocker, braunes Dach, blaue Läden, goldene Brezel am Ausleger
    m, fy, fy2, z1, z2, Wx = fachwerk({'seed': 7, 'W': 80, 'D': 44, 'H1': 42, 'H2': 32, 'RH': 38, 'wall': '#eedcb0', 'infill': '#d8a858', 'beam': '#5c3418',
              'roof': '#b85c2c', 'shut': '#3c5c9c', 'curtain': '#e8e0c8', 'wins': [(-24, 0), (-22, 1), (22, 1)], 'door': (16, 16, 30), 'ivy': 36, 'flowers0': True})
    GOLD = M('#e8b030', 0.3, 0.9); Tu((Wx + 1, z1 + 8), (Wx + 16, z1 + 8), 0.8, 0.8, M('#2c2830', 0.4, 0.8), fy2 - 4, fy2 - 4)
    for k in (0, 1): Tu((Wx + 9 + k * 4, z1 + 8), (Wx + 9 + k * 4, z1 + 3), 0.3, 0.3, M('#2c2830', 0.4, 0.8), fy2 - 4, fy2 - 4, False)
    bx, bz = Wx + 11, z1 - 6   # Brezel
    pts = [(bx - 6, bz - 4), (bx - 7, bz + 2), (bx - 3, bz + 6), (bx, bz + 2), (bx + 3, bz + 6), (bx + 7, bz + 2), (bx + 6, bz - 4), (bx, bz - 6), (bx - 6, bz - 4)]
    curve([L(*q) for q in pts], 1.6, 1.6, GOLD, fy2 - 4, 6); curve([L(bx - 3, bz + 4), L(bx + 3, bz - 4)], 1.4, 1.4, GOLD, fy2 - 4.5, 6); curve([L(bx + 3, bz + 4), L(bx - 3, bz - 4)], 1.4, 1.4, GOLD, fy2 - 3.5, 6)
    B(-20, z1 - 3, fy - 6, 34, 1.6, 12, M('#c83c3c', 0.6), 0.3, 0)   # Markise über dem Fenster
    for k in range(6): B(-34 + k * 5.6, z1 - 3.4, fy - 6.4, 2.8, 2.2, 12.4, M('#f4f0e8', 0.6), 0.2)
    turn('haus3')

def wirtshaus():  # „Zur Fetten Unke“: breit, moosgrünes Dach, Salbei-Gefache, Schild, Fässer, Tür rechts der Mitte (dort steht die Wirtin)
    m, fy, fy2, z1, z2, Wx = fachwerk({'seed': 11, 'W': 132, 'D': 50, 'H1': 48, 'H2': 36, 'RH': 44, 'wall': '#e4d6b0', 'infill': '#a8b888', 'beam': '#3c2414',
              'roof': '#5c7c3c', 'shut': '#8c2c2c', 'curtain': '#c8a040', 'wins': [(-50, 0), (-20, 0), (48, 0), (-50, 1), (-17, 1), (17, 1), (50, 1)], 'door': (20, 20, 34),
              'posts': 7, 'ww': 13, 'side': [(-8, 0), (8, 1)], 'rows': 9, 'flowers0': True})
    R = random.Random(13); IRON = M('#2c2830', 0.4, 0.8)
    Tu((Wx + 1, z1 + 10), (Wx + 18, z1 + 10), 0.9, 0.9, IRON, fy2 - 4, fy2 - 4)
    for k in (0, 1): Tu((Wx + 10 + k * 6, z1 + 10), (Wx + 10 + k * 6, z1 + 5), 0.3, 0.3, IRON, fy2 - 4, fy2 - 4, False)
    sx, sz = Wx + 13, z1 - 6
    disc(L(sx, sz)[0], L(sx, sz)[1], fy2 - 4, 11, 1.6, M('#7c5434', 0.55), 40); ring(L(sx, sz)[0], L(sx, sz)[1], fy2 - 5, 11, 0.8, M('#e8b030', 0.3, 0.9))
    FROG = M('#5cac48', 0.45); Sp(sx - 1, sz - 3, fy2 - 6.4, 6.0, FROG, 2.0, 4.6); Sp(sx + 1, sz + 3, fy2 - 6.8, 4.4, FROG, 1.8, 3.4)
    for ex in (sx - 1.4, sx + 3.6): Sp(ex, sz + 6.6, fy2 - 8, 1.6, M('#3c7c34', 0.5)); Sp(ex, sz + 6.6, fy2 - 9.2, 0.8, M('#1c1c24', 0.2))
    lathe(L(sx + 7, 0)[0], [(L(0, sz + 2)[1], 2.2), (L(0, sz - 6)[1], 2.4)], M('#c8903c', 0.45), fy2 - 7, 20)
    for (bx, by) in ((-62, fy - 8), (-50, fy - 9)):   # Fässer
        lathe(L(bx, 0)[0], [(L(0, 15)[1], 5.0), (L(0, 11)[1], 6.0), (L(0, 3)[1], 6.0), (L(0, 0)[1], 5.0)], M('#8c5c2c', 0.6), by, 24)
        for kz in (3.5, 11.5): ringh(L(bx, kz)[0], L(bx, kz)[1], by, 5.9, 0.5, IRON)
    B(-8, 4, fy - 9, 26, 2.0, 5, M('#6c4424', 0.6), 0.3)   # Bank vor dem Fenster
    for bx in (-18, 2): B(bx, 1.8, fy - 9, 2.0, 3.6, 4, M('#4c2c14', 0.6), 0.2)
    turn('wirtshaus')

def turm():  # Eulalias schiefer Wetterturm: Steinringe, Rundfenster, Balkon, Schindelkegel, Blitzableiter, Efeu
    mats(); R = random.Random(17)
    off = [0, 0.8, 1.8, 2.6, 3.2, 3.0, 2.4, 1.8]; zk = [0, 20, 40, 60, 80, 100, 118, 134]; ST = ['#7c7490', '#6c6480', '#847c98']
    for k in range(7):
        r = 17 - k * 0.7
        lathe(L(off[k], 0)[0], [(L(0, zk[k + 1])[1], r), (L(0, zk[k])[1], r + 0.2)], M(jit(R.choice(ST), 0.05, R), 0.85), 0, 40)
        ringh(L(off[k], zk[k])[0], L(off[k], zk[k])[1], 0, r + 0.3, 1.0, M('#4c4458', 0.9))
        for j in range(5):   # vorstehende Steine
            a = R.uniform(-1.9, -1.2); B(off[k] + math.cos(a) * r, zk[k] + R.uniform(4, 16), math.sin(a) * r - 0.6, R.uniform(4, 7), R.uniform(3, 5), 2.4, M(jit('#8c849c', 0.1, R), 0.9), 0.6)
    WINV = M('#c890ff', 0.35, 0, 3.4); FR = M('#3c3444', 0.6)
    for (k, z) in ((1, 30), (3, 70), (5, 108)):
        r = 17 - k * 0.7; x = off[k] - 3; disc(L(x, z)[0], L(x, z)[1], -r - 0.6, 4.4, 1.0, WINV, 32); ring(L(x, z)[0], L(x, z)[1], -r - 1.0, 4.6, 0.9, FR)
        B(x, z, -r - 1.6, 0.8, 8.8, 0.6, FR, 0); B(x, z, -r - 1.6, 8.8, 0.8, 0.6, FR, 0); lamp(x, z, -r - 10, 1400, (0.8, 0.56, 1.0))
    door = M('#3c2414', 0.6); arc = [(math.cos(math.pi * i / 10) * 6, 14 + math.sin(math.pi * i / 10) * 6) for i in range(11)]
    Pr(0, 0, -16.6, [(-6, 0), (6, 0)] + arc, 2, door, 0.3); B(0, 1.3, -20, 18, 2.6, 6, M('#6c6474', 0.9), 0.6)
    WOOD = M('#6c4424', 0.6)   # Balkon
    lathe(L(off[6], 0)[0], [(L(0, 120)[1], 22), (L(0, 118)[1], 22)], WOOD, 0, 40)
    ringh(L(off[6], 127)[0], L(off[6], 127)[1], 0, 21.6, 0.7, WOOD)
    for j in range(11): a = math.pi * (1.05 + j * 0.09); Tu((off[6] + math.cos(a) * 21.6, 120), (off[6] + math.cos(a) * 21.6, 127), 0.5, 0.5, WOOD, math.sin(a) * 21.6, math.sin(a) * 21.6, False)
    SH = ['#3c3c8c', '#34347c', '#4848a0']   # Schindelkegel, leicht schief
    for k in range(7):
        z0, z1_ = 134 + k * 7, 134 + (k + 1) * 7; r0, r1 = 24 - k * 3.3, 24 - (k + 1) * 3.3
        lathe(L(off[7] + k * 0.5, 0)[0], [(L(0, z1_)[1], max(0.5, r1 + 1)), (L(0, z0)[1], r0)], M(jit(R.choice(SH), 0.05, R), 0.6), 0, 36)
    COP = M('#d8803c', 0.28, 0.9); tip = (off[7] + 4.2, 184)
    Tu((tip[0], 180), (tip[0] + 2, 200), 0.6, 0.3, COP, 0, 0)
    for k in range(3): ringh(L(tip[0] + 0.5 + k * 0.4, 186 + k * 3)[0], L(tip[0] + 0.5 + k * 0.4, 186 + k * 3)[1], 0, 1.3, 0.3, COP)
    for a in (0, 2.1, 4.2): Tu((tip[0] + 1.4, 194), (tip[0] + 1.4 + math.cos(a) * 6, 194), 0.25, 0.25, COP, 0, math.sin(a) * 6, False); Sp(tip[0] + 1.4 + math.cos(a) * 6, 194, math.sin(a) * 6, 1.4, M('#d8d8e8', 0.3, 0.7))
    Sp(tip[0] + 2, 201, 0, 1.0, M('#c8f0ff', 0.2, 0, 6.0))
    efeu(-12, 0, 90, -15.5, R, [M('#2f6c34', 0.6), M('#3c7c3c', 0.6), M('#4c8c40', 0.6)], 40)
    turn('turm', 0.0)

SS = CFG.get('ss', 4)
os.makedirs(CFG['out'], exist_ok=True)
SIZES = {'haus': (140, 150), 'haus2': (112, 176), 'haus3': (150, 140), 'wirtshaus': (200, 158), 'turm': (90, 210)}
for name in CFG.get('what') or list(SIZES):
    w, h = SIZES[name]; stage(w, h, SS); night()
    try: globals()[name]()
    except Exception:
        import traceback; open(os.path.join(CFG['out'], 'fehler.txt'), 'w').write(traceback.format_exc()); raise
    shot(name)
print('ok')
