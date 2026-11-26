# Baut tools/blender/pfad_bl.py (Mondinsel, js/pfad.js) aus umland_bl.py: gleicher Diorama-Unterbau (Gelände, Wasser, Bäume, Licht,
# Kamera, Spielzeug-Stil), aber Meer statt Grenzgebirge und eigene Wahrzeichen an den Levelpunkten. Dazu die Inselkarte als JSON.
# python make_pfad_bl.py  →  pfad_bl.py, pfad_map.json (neben diesem Skript)
import os, json, math, random
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'umland_bl.py'), encoding='utf-8').read()
cut = lambda a, b=None: src[src.index(a):src.index(b)] if b else src[src.index(a):]
head = src[:src.index('# ---------------- Brücke ----------------')]
tail = cut('# Netze bauen, Materialien')
def rep(s, a, b):
    assert s.count(a) == 1, a[:60]; return s.replace(a, b)
head = rep(head, "# Die Grafschaft Krat (js/umland.js) als Diorama bei Mondlicht", "# Die Mondinsel (js/pfad.js) – erzeugt von make_pfad_bl.py aus umland_bl.py. Ursprünglich: Die Grafschaft Krat (js/umland.js) als Diorama bei Mondlicht")
head = rep(head, "    c = MAP[y][x] if 0 <= x < MW and 0 <= y < MH else 'M'\n", "    c = MAP[y][x] if 0 <= x < MW and 0 <= y < MH else '~'   # rundum Meer\n    return c\n")
head = rep(head, "FIELDS = [(8.25, 20.2, 12.75, 23.8, 'acker'), (13.3, 20.2, 17.7, 23.1, 'weizen')]", "FIELDS = []")
head = rep(head, "f, rows = FM['acker']; col =", "if 'acker' in FM: f, rows = FM['acker']; col =")
head = rep(head, "f, rows = FM['weizen']; col =", "if 'weizen' in FM: f, rows = FM['weizen']; col =")
head = rep(head, "wcol = mix(np.broadcast_to(C('#2c5c84'), (NY, NX, 3)), np.broadcast_to(C('#0c2244'), (NY, NX, 3)), deep)",
           "wcol = mix(np.broadcast_to(C('#3aa4c4' if TOY else '#2c5c84'), (NY, NX, 3)), np.broadcast_to(C('#123c78' if TOY else '#0c2244'), (NY, NX, 3)), deep)")
head = rep(head, "wd = ss(0.28, 0.75, wB); H = H * (1 - wd) - 0.42 * wd", "wd = ss(0.28, 0.75, wB); H = H * (1 - wd) - 0.6 * wd")
head = rep(head, "col = mix(col, np.broadcast_to(C('#c8b07a' if TOY else '#8a7650'), (NY, NX, 3)), ss(0.08, 0.3, wB) * (1 - mt))", "col = mix(col, np.broadcast_to(C('#e8d29a'), (NY, NX, 3)), ss(0.1, 0.42, blur(field('~B'), max(1, SUB // 2), 2)) * (1 - mt))   # breite Sandstrände")
head = rep(head, "wcol = mix(wcol, np.broadcast_to(C('#1c3a3a'), (NY, NX, 3)), ss(0.4, 0.7, sB))", "wcol = mix(wcol, np.broadcast_to(C('#1c3a3a'), (NY, NX, 3)), ss(0.4, 0.7, sB))\nwcol = mix(wcol, np.broadcast_to(C('#5ad8e0'), (NY, NX, 3)), 0.8 * (1 - ss(0.4, 0.97, blur(field('~B'), SUB, 3))))   # türkises Flachwasser\nwcol = mix(wcol, np.broadcast_to(C('#8af0e8'), (NY, NX, 3)), 0.55 * (1 - ss(0.0, 0.12, WL - H)))\nwcol = mix(wcol, np.broadcast_to(C('#f4fcff'), (NY, NX, 3)), 0.92 * (1 - ss(0.0, 0.06, WL - H)))   # Brandungslinie")
LAND = r'''
# ---------------- Mondinsel: Wahrzeichen an den Levelpunkten ----------------
NODE = CFG['nodes']
def nd(k): return NODE[k][0], NODE[k][1]
CHIM = W(0, 0, 0)
# A – Inselbahnhof: Bahndamm übers Meer, Gleis, Bahnsteig mit Dach und Laternen
ax, ay = nd('A')
tbox('stone', -PAD, ay + 0.25, ax + 1.6, ay + 1.05, WL - 0.3, 0.06, '#7a7480', 0.03)
for k in range(int((ax + 1.6 + PAD) / 0.25)):
    xx = -PAD + k * 0.25; tbox('wood', xx, ay + 0.35, xx + 0.1, ay + 0.95, 0.06, 0.09, '#5c3a24')
for yy in (ay + 0.45, ay + 0.85): tbox('iron', -PAD, yy - 0.015, ax + 1.6, yy + 0.015, 0.09, 0.12, '#c8c8d8')
tbox('stone', ax - 0.2, ay - 0.35, ax + 1.3, ay + 0.2, 0.0, 0.1, '#9a96a0')
for xx in (ax - 0.1, ax + 1.1): tbox('wood', xx - 0.04, ay - 0.3, xx + 0.04, ay - 0.22, 0.1, 0.62, '#6a4428')
prism('roof', ax - 0.25, ay - 0.4, ax + 1.35, ay - 0.1, 0.6, 0.82, '#3c7ab8', 0.06)
for xx in (ax - 0.25, ax + 1.35):
    tbox('iron', xx - 0.025, ay + 0.1, xx + 0.025, ay + 0.15, 0.1, 0.62, '#24222c'); ball('glow', W(xx, ay + 0.12, 0.64), 0.05, '#ffd070', 1)
    lamp(W(xx, ay + 0.35, 0.7), '#ffc060', 6, 0.08); glow_at(W(xx, ay + 0.12, 0.64), 'lamp')
# L1 – Laternensteg: Laternen entlang des Wegs vom Anleger
for (lx, ly) in ((5.0, 11.0), (5.0, 9.6), (6.2, 8.6)):
    tbox('iron', lx + 0.42, ly + 0.42, lx + 0.48, ly + 0.48, ground(lx, ly), ground(lx, ly) + 0.58, '#24222c')
    ball('glow', W(lx + 0.45, ly + 0.45, ground(lx, ly) + 0.6), 0.05, '#ffd070', 1); lamp(W(lx + 0.45, ly + 0.7, 0.7), '#ffc060', 5, 0.08); glow_at(W(lx + 0.45, ly + 0.45, ground(lx, ly) + 0.6), 'lamp')
# L2 – Glühwurmwald: leuchtende Pilze am Waldrand
bx_, by_ = nd('L2')
for k in range(9):
    mx, my = bx_ + 0.5 + math.cos(k * 0.7) * rng.uniform(0.7, 1.3), by_ + 0.5 + math.sin(k * 0.7) * rng.uniform(0.6, 1.1); z = ground(mx, my)
    tube('wood', W(mx, my, z), W(mx, my, z + 0.1), 0.02, '#e8e0d0', 6); ball('brew', W(mx, my, z + 0.12), 0.06, '#60e8d0', 1, 0.5)
    if k % 3 == 0: glow_at(W(mx, my, z + 0.12), 'brew')
lamp(W(bx_ + 0.5, by_ + 1.2, 0.5), '#50e0c0', 6, 0.3)
# L3 – Kraterhöhle: Felsbogen am Kraterrand, rötlicher Schein aus der Tiefe
kx, ky = nd('L3'); kx += 1.0; ky -= 0.6; kz = ground(kx + 0.5, ky - 0.1)
for k in range(11):
    a = math.pi * k / 10; px_ = kx + 0.5 + math.cos(a) * 0.62; pz = kz + 0.05 + math.sin(a) * 0.75
    ball('stone', Vector((px_, -(ky - 0.05) * K, pz)), rng.uniform(0.2, 0.25), '#9a90a4', 1, 1.0, 0.04, 0.1)
bm, lay = bmget('hole'); vs = [bm.verts.new(Vector((kx + 0.5 + math.cos(math.pi * k / 12) * 0.48, -(ky + 0.02) * K, kz + math.sin(math.pi * k / 12) * 0.62))) for k in range(13)]
bm.faces.new(vs); paint('hole', vs, '#020104'); lamp(W(kx + 0.5, ky - 0.3, kz + 0.3), '#ff4020', 5, 0.2)
for xx in (kx - 0.25, kx + 1.25):
    tbox('wood', xx - 0.03, ky + 0.1, xx + 0.03, ky + 0.16, kz, kz + 0.45, '#4a3020'); ball('fire', W(xx, ky + 0.13, kz + 0.5), 0.06, '#ffa040', 1, 1.4); glow_at(W(xx, ky + 0.13, kz + 0.5), 'fire')
# L4 – Turm der Winde: runder Steinturm mit Kegeldach und Windmühlenflügeln
tx_, ty_ = nd('L4'); tx_ += 0.5; ty_ -= 0.2; z0 = ground(tx_, ty_)
tube('stone', W(tx_, ty_, z0), W(tx_, ty_, z0 + 1.6), 0.34, '#c8c0b0', 14); cone('roof', W(tx_, ty_, z0 + 1.58), 0.44, 0.0, 0.6, '#c84a3a', 14)
for k in range(3): tbox('glow', tx_ - 0.06, ty_ + 0.33, tx_ + 0.06, ty_ + 0.36, z0 + 0.35 + k * 0.42, z0 + 0.52 + k * 0.42, '#ffd070')
glow_at(W(tx_, ty_ + 0.34, z0 + 0.8), 'win')
for k in range(4):
    a = math.radians(45 + 90 * k); c_, s_ = math.cos(a), math.sin(a)
    tube('wood', W(tx_, ty_ + 0.4, z0 + 1.3), W(tx_ + c_ * 0.8, ty_ + 0.4, z0 + 1.3 + s_ * 0.8), 0.025, '#6a4428', 4)
    bm, lay = bmget('house'); p0 = W(tx_ + c_ * 0.25, ty_ + 0.41, z0 + 1.3 + s_ * 0.25); p1 = W(tx_ + c_ * 0.78, ty_ + 0.41, z0 + 1.3 + s_ * 0.78); n_ = Vector((-s_, 0, c_)) * 0.12
    vs = [bm.verts.new(v) for v in (p0, p1, p1 + n_, p0 + n_)]; bm.faces.new(vs); paint('house', vs, '#f0e8d8')
# F – Mondfeste: Bergfried, vier Ecktürme mit Spitzdächern, Zinnen, Tor, violette Fenster, Mondbanner
fx, fy = nd('F'); fz = ground(fx + 0.5, fy + 0.5)
tbox('stone', fx - 0.45, fy - 0.45, fx + 1.45, fy + 1.0, fz, fz + 0.9, '#4a4458')
for (cxo, cyo) in ((-0.45, -0.45), (1.45, -0.45), (-0.45, 1.0), (1.45, 1.0)):
    tube('stone', W(fx + cxo, fy + cyo, fz), W(fx + cxo, fy + cyo, fz + 1.3), 0.2, '#5a5468', 12); cone('slate', W(fx + cxo, fy + cyo, fz + 1.28), 0.27, 0.0, 0.42, '#2c2440', 12)
for k in range(9): tbox('stone', fx - 0.4 + k * 0.22, fy + 0.95, fx - 0.3 + k * 0.22, fy + 1.02, fz + 0.9, fz + 1.02, '#5a5468')
tbox('hole', fx + 0.3, fy + 0.98, fx + 0.7, fy + 1.02, fz, fz + 0.45, '#020104')
for xx in (fx - 0.1, fx + 1.0): tbox('glow', xx, fy + 0.98, xx + 0.12, fy + 1.01, fz + 0.5, fz + 0.68, '#c070ff'); glow_at(W(xx + 0.06, fy + 1.0, fz + 0.6), 'brew')
tube('iron', W(fx + 0.5, fy + 0.2, fz + 0.9), W(fx + 0.5, fy + 0.2, fz + 1.9), 0.02, '#24222c', 5)
bm, lay = bmget('red'); vs = [bm.verts.new(W(fx + 0.52, fy + 0.2, z)) for z in (fz + 1.88, fz + 1.55)] + [bm.verts.new(W(fx + 1.05, fy + 0.2, fz + 1.7))]; bm.faces.new(vs); paint('red', vs, '#6a2c9c')
ball('glow', W(fx + 0.72, fy + 0.19, fz + 1.72), 0.07, '#ffe070', 1, 1.0)
lamp(W(fx + 0.5, fy + 1.4, fz + 0.6), '#b060ff', 10, 0.2)
# S – Sternwarte auf der Nordinsel: runde Plattform mit Ring aus Sternsteinen
sx_, sy_ = nd('S'); sz = ground(sx_ + 0.5, sy_ + 0.5)
tube('stone', W(sx_ + 0.5, sy_ + 0.5, sz), W(sx_ + 0.5, sy_ + 0.5, sz + 0.12), 0.55, '#a8a0b8', 18)
for k in range(8): a = k / 8 * math.tau; ball('glow', W(sx_ + 0.5 + math.cos(a) * 0.45, sy_ + 0.5 + math.sin(a) * 0.45, sz + 0.16), 0.05, '#a8e4fc', 1)
tube('iron', W(sx_ + 0.5, sy_ + 0.5, sz + 0.12), W(sx_ + 0.7, sy_ + 0.35, sz + 0.75), 0.05, '#c8a040', 8)
# Sternenbrücke: leuchtende Trittsteine über dem Wasser (geheimer Weg), dann weiter zum Glockenhaus
for (x0, y0, x1, y1) in CFG['stars']:
    n_ = int(max(abs(x1 - x0), abs(y1 - y0)) / 0.5)
    for k in range(n_ + 1):
        xx, yy = x0 + (x1 - x0) * k / max(1, n_), y0 + (y1 - y0) * k / max(1, n_)
        cone('foam', W(xx + 0.5, yy + 0.5, WL + 0.01), 0.16, 0.16, 0.03, '#d8f0ff', 5); ball('glow', W(xx + 0.5, yy + 0.5, WL + 0.06), 0.035, '#a8e4fc', 1)
# G – Glockenhaus: offener Pavillon mit goldener Glocke
gx_, gy_ = nd('G'); gz = ground(gx_ + 0.5, gy_ + 0.5)
for (cxo, cyo) in ((0.1, 0.1), (0.9, 0.1), (0.1, 0.9), (0.9, 0.9)): tbox('wood', gx_ + cxo - 0.04, gy_ + cyo - 0.04, gx_ + cxo + 0.04, gy_ + cyo + 0.04, gz, gz + 0.6, '#7a4c2c')
prism('roof', gx_ + 0.05, gy_ + 0.05, gx_ + 0.95, gy_ + 0.95, 0.6 + gz, 0.95 + gz, '#3c7ab8', 0.08)
cone('glow', W(gx_ + 0.5, gy_ + 0.5, gz + 0.22), 0.16, 0.08, 0.26, '#f8c838', 12); lamp(W(gx_ + 0.5, gy_ + 1.0, gz + 0.4), '#ffd070', 6, 0.1); glow_at(W(gx_ + 0.5, gy_ + 0.5, gz + 0.35), 'lamp')
# Palmen an den Stränden
def palme(px, py):
    z = ground(px, py); lean = rng.uniform(-0.3, 0.3); h = rng.uniform(1.05, 1.35); top = W(px + lean, py, z + h)
    for k in range(5):   # gebogener Stamm aus Ringen
        t0, t1 = k / 5, (k + 1) / 5
        tube('wood', W(px + lean * t0 * t0, py, z + h * t0), W(px + lean * t1 * t1, py, z + h * t1), 0.075 - k * 0.008, '#a8743e' if k % 2 else '#8c5c30', 8)
    for k in range(7):   # Wedel: Mittelrippe und zwei flache Blattbüschel
        a_ = k / 7 * math.tau + rng.random() * 0.3; c_, s_ = math.cos(a_), math.sin(a_); g_ = rng.choice(['#5cc04a', '#4cb040', '#3c9c38'])
        tube('leaf', top, top + Vector((c_ * 0.62, s_ * 0.62 * K, -0.2)), 0.04, g_, 5)
        for f_, r_ in ((0.38, 0.13), (0.72, 0.1)): ball('leaf', top + Vector((c_ * 0.62 * f_, s_ * 0.62 * f_ * K, -0.2 * f_)), r_, g_, 1, 0.45)
    for k in range(3): ball('wood', top + Vector((rng.uniform(-0.07, 0.07), rng.uniform(-0.07, 0.07), -0.1)), 0.06, '#6a4424', 1)   # Kokosnüsse
beach = [(x + 0.5, y + 0.5) for y in range(MH) for x in range(MW) if MAP[y][x] == '.' and any(0 <= y + dy < MH and 0 <= x + dx < MW and MAP[y + dy][x + dx] == '~' for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
rng.shuffle(beach); taken = []
for (bx, by) in beach:
    if len(taken) >= 16: break
    if any(abs(bx - tx) + abs(by - ty) < 2.5 for tx, ty in taken) or any(abs(bx - nx - 0.5) + abs(by - ny - 0.5) < 1.6 for nx, ny in NODE.values()): continue
    taken.append((bx, by)); palme(bx + rng.uniform(-0.2, 0.2), by + rng.uniform(-0.2, 0.2))
# Leuchtturm auf der Ostspitze: weiß-rot geringelt, oben ein warmes Licht
lx_, ly_ = CFG.get('lighthouse', (28.4, 9.4)); lz = ground(lx_, ly_)
for k in range(6): tube('house' if k % 2 else 'red', W(lx_, ly_, lz + k * 0.34), W(lx_, ly_, lz + (k + 1) * 0.34), 0.32 - k * 0.02, '#f4f0e8' if k % 2 else '#d8302c', 16)
cone('stone', W(lx_, ly_, lz - 0.05), 0.46, 0.38, 0.14, '#8a8494', 14)
cone('stone', W(lx_, ly_, lz + 2.04), 0.3, 0.3, 0.04, '#3a3640', 14); tube('glow', W(lx_, ly_, lz + 2.08), W(lx_, ly_, lz + 2.36), 0.17, '#fff0a0', 12); cone('roof', W(lx_, ly_, lz + 2.36), 0.24, 0.0, 0.3, '#d8302c', 14)
lamp(W(lx_, ly_ + 0.5, lz + 2.2), '#fff0a0', 22, 0.1); glow_at(W(lx_, ly_, lz + 2.2), 'fire')
# Segelboot und Felsen im Meer
bx_, by_ = CFG.get('boat', (6.2, 15.0))
Z_ = 1.7; B_ = lambda dx, dy, dz: W(bx_ + dx * Z_, by_ + dy * Z_, WL + dz * Z_)
bm, lay = bmget('wood'); hull = [B_(-0.45, -0.12, 0.01), B_(0.45, -0.12, 0.01), B_(0.3, 0.12, 0.01), B_(-0.35, 0.12, 0.01), B_(-0.5, -0.16, 0.14), B_(0.6, -0.16, 0.14), B_(0.38, 0.16, 0.14), B_(-0.42, 0.16, 0.14)]
vs = [bm.verts.new(v) for v in hull]
for f in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([vs[i] for i in f])
paint('wood', vs, '#9a5c34')
tube('wood', B_(0, 0, 0.12), B_(0, 0, 0.85), 0.03, '#6a4424', 6)
bm, lay = bmget('house'); sail = [bm.verts.new(v) for v in (B_(0.03, 0, 0.82), B_(0.03, 0, 0.2), B_(0.46, 0, 0.24))]; bm.faces.new(sail); paint('house', sail, '#f8f0e0')
bm, lay = bmget('red'); flag = [bm.verts.new(v) for v in (B_(0, 0, 0.85), B_(0, 0, 0.75), B_(-0.16, 0, 0.8))]; bm.faces.new(flag); paint('red', flag, '#d8302c')
cone('foam', B_(0.62, 0, 0.0), 0.12 * Z_, 0.05, 0.01, '#f4fcff', 8)
for (rx, ry, rr) in ((1.2, 3.5, 0.22), (27.2, 2.4, 0.26), (25.6, 15.2, 0.2), (8.5, 0.8, 0.18)): ball('stone', W(rx, ry, WL), rr, '#8a8494', 1, 0.7, 0.05, 0.1)

'''
open(os.path.join(here, 'pfad_bl.py'), 'w', encoding='utf-8').write(head + LAND + tail)

# Inselkarte 30×17: Meer, Hauptinsel, zwei Nordinselchen, Wald, Kraterring, Wege
MW, MH = 30, 17; rnd = random.Random(5)
m = [['~'] * MW for _ in range(MH)]
def blob(cx, cy, rx, ry, c, jag=0.18):
    for y in range(MH):
        for x in range(MW):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1 - jag * rnd.random(): m[y][x] = c
blob(15.5, 9.3, 13.6, 5.9, '.'); blob(13.5, 1.6, 1.6, 1.3, '.', 0.05); blob(19.5, 1.6, 1.6, 1.3, '.', 0.05)
blob(10.8, 5.6, 3.4, 2.0, 'T'); blob(8.5, 13.6, 2.6, 1.4, 'T'); blob(27.5, 11.8, 2.0, 1.6, 'T')
for y in range(MH):
    for x in range(MW):
        d = math.hypot(x + 0.5 - 20.5, y + 0.5 - 8.5)
        if 1.3 < d < 2.7 and m[y][x] != '~': m[y][x] = 'M'
NODES = {'A': (3, 11), 'L1': (7, 9), 'L2': (12, 6), 'L3': (17, 9), 'L4': (22, 12), 'S': (13, 1), 'G': (19, 1), 'F': (26, 7)}
PATHS = [[(3, 11), (5, 11), (5, 9), (7, 9)], [(7, 9), (10, 9), (10, 6), (12, 6)], [(12, 6), (15, 6), (15, 9), (17, 9)], [(17, 9), (17, 12), (22, 12)], [(22, 12), (24, 12), (24, 7), (26, 7)]]
SECRET = [[(12, 6), (12, 4), (13, 4), (13, 1)], [(13, 1), (19, 1)]]
def walk(pts, c):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        for k in range(max(abs(x1 - x0), abs(y1 - y0)) + 1):
            x, y = x0 + k * (x1 > x0) - k * (x1 < x0), y0 + k * (y1 > y0) - k * (y1 < y0)
            if c == '=' or m[y][x] != '~': m[y][x] = c if m[y][x] != '~' else m[y][x]
for p in PATHS: walk(p, '=')
for p in SECRET: walk(p, '.')
for (x, y) in NODES.values(): m[y][x] = '.' if m[y][x] != '~' else '.'
stars = []
for p in SECRET:
    for (x0, y0), (x1, y1) in zip(p, p[1:]): stars.append((x0, y0, x1, y1))
json.dump({'map': [''.join(r) for r in m], 'nodes': NODES, 'stars': [s for s in stars if True], 'lighthouse': (28.4, 9.4), 'boat': (6.2, 15.0)}, open(os.path.join(here, 'pfad_map.json'), 'w'))
print('\n'.join(''.join(r) for r in m))
