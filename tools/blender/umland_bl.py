# Die Grafschaft Krat (js/umland.js) als Diorama bei Mondlicht: die ganze Oberwelt (56×32 Kacheln) als 3D-Landschaft, schräg von
# oben gesehen (Kippwinkel TILT). Der Boden ist in Nord-Süd-Richtung um 1/cos(TILT) gestreckt, damit jede Kachel im Bild genau
# 16 px (× ss) groß ist und die Kollision der Kachelkarte zum Bild passt. Was hoch ist (Berge, Bäume, Häuser), ragt nach oben ins
# Bild. Berge mit Schnee, Fluss mit flachem Ufer, Sumpf mit Tümpeln und Schilf, Wälder aus Tannen und Laubbäumen, Friedhof mit
# Gittern und offenem Grab, Kräuterhütte mit Kessel, Bahnhof mit Zug, Höhleneingang mit Fackeln, Holzbrücke.
# Aufruf: python bl.py umland_bl.py '{"map": [...Zeilen...], "out": ".../umland.png", "ss": 2}'
import bpy, bmesh, math, random
import numpy as np
from mathutils import Vector, Matrix, noise

MAP = CFG['map']; MW, MH = len(MAP[0]), len(MAP); SS = CFG.get('ss', 2); PAD = 4; SUB = CFG.get('sub', 8)
TILT = math.radians(CFG.get('tilt', 32)); K = 1 / math.cos(TILT)
rng = random.Random(7)
TOY = CFG.get('toy', True)   # Spielzeug-Diorama: glänzender Kunststoff, kräftige Farben, runde Bäume auf Stämmen

# ---------------- Szene leeren ----------------
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
    for b in list(coll): coll.remove(b)
sc = bpy.context.scene

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
def mat(name, col=None, rough=0.8, metal=0.0, emit=0.0, attr=False, bump=0.0, bscale=40.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if attr:
        a = nt.nodes.new('ShaderNodeAttribute'); a.attribute_name = 'Col'; nt.links.new(a.outputs['Color'], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = lin(col) + [1]
    if emit:
        if attr: nt.links.new(a.outputs['Color'], b.inputs['Emission Color'])
        else: b.inputs['Emission Color'].default_value = lin(col) + [1]
        b.inputs['Emission Strength'].default_value = emit
    if bump:
        tx = nt.nodes.new('ShaderNodeTexNoise'); tx.inputs['Scale'].default_value = bscale; tx.inputs['Detail'].default_value = 6
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
        nt.links.new(tx.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    try: b.inputs['Specular IOR Level'].default_value = 0.25 if not coat else 0.5
    except KeyError: pass
    if coat:   # Klarlack wie bei Spielzeugfiguren
        for k, v in (('Coat Weight', coat), ('Coat Roughness', 0.12)):
            try: b.inputs[k].default_value = v
            except KeyError: pass
    return m
def link(o): sc.collection.objects.link(o); return o

# ---------------- Kachelfelder ----------------
def cell(x, y):
    c = MAP[y][x] if 0 <= x < MW and 0 <= y < MH else 'M'
    if c == 'M' and 0 <= x < MW:   # der Fluss läuft oben und unten aus dem Bild
        if y <= 0 and MAP[1][x] == '~': c = '~'
        if y >= MH - 1 and MAP[MH - 2][x] == '~': c = '~'
    return c
GW, GH = MW + 2 * PAD, MH + 2 * PAD
CELLS = [[cell(x, y) for x in range(-PAD, MW + PAD)] for y in range(-PAD, MH + PAD)]
def field(chars):
    t = np.array([[1.0 if c in chars else 0.0 for c in row] for row in CELLS])
    f = np.pad(np.kron(t, np.ones((SUB, SUB))), 1, mode='edge')
    return (f[:-1, :-1] + f[1:, :-1] + f[:-1, 1:] + f[1:, 1:]) / 4
def blur(a, r, n=2):
    for _ in range(n):
        for ax in (0, 1):
            p = np.pad(a, [(r, r) if i == ax else (0, 0) for i in range(2)], mode='edge')
            c = np.insert(np.cumsum(p, axis=ax), 0, 0, axis=ax)
            a = ((c[2 * r + 1:, :] - c[:-2 * r - 1, :]) if ax == 0 else (c[:, 2 * r + 1:] - c[:, :-2 * r - 1])) / (2 * r + 1)
    return a
def ss(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

NY, NX = GH * SUB + 1, GW * SUB + 1
U = -PAD + np.arange(NX) / SUB; V = -PAD + np.arange(NY) / SUB
UU, VV = np.meshgrid(U, V)
mB = blur(field('M'), max(1, int(SUB * 0.8)), 3)
wB = blur(field('~B'), max(1, SUB // 4), 2)
sB = blur(field('s'), max(1, SUB // 2), 2)
tB = blur(field('T'), max(1, SUB // 2), 2)
yB = blur(field('+G'), max(1, SUB // 3), 2)
rB = blur(field('=SB'), 1, 2)
N1 = np.zeros((NY, NX)); N2 = np.zeros((NY, NX)); NR = np.zeros((NY, NX)); NP = np.zeros((NY, NX))
for i in range(NY):
    for j in range(NX):
        u, v = U[j], V[i]
        N1[i, j] = noise.noise(Vector((u * 0.22, v * 0.22, 1.7)))
        N2[i, j] = noise.noise(Vector((u * 1.3, v * 1.3, 5.1)))
        NR[i, j] = noise.ridged_multi_fractal(Vector((u * 0.33, v * 0.33, 0.5)), 0.9, 2.0, 5, 1.0, 2.2)
        NP[i, j] = noise.noise(Vector((u * 0.8, v * 0.8, 9.0)))
NR = (NR - NR.min()) / (np.ptp(NR) + 1e-6)

# Höhen: Berge aus der Masse der Bergkacheln, Fluss eingetieft, Tümpel im Sumpf, leichte Hügel
mt = np.clip((mB - 0.42) / 0.58, 0, 1)
peaks = []   # einzelne Gipfel je Bergkachel, innen höher – so lesen sich Bergketten statt Hochebenen
for y in range(-PAD, MH + PAD):
    for x in range(-PAD, MW + PAD):
        if CELLS[y + PAD][x + PAD] != 'M': continue
        m = mt[int((y + PAD + 0.5) * SUB), int((x + PAD + 0.5) * SUB)]
        if not (0 <= x < MW and 0 <= y < MH): m *= 0.55   # außerhalb der Karte flacher: kürzere Schatten am Rand
        if m > 0.55:
            if rng.random() < 0.5: peaks.append((x + rng.uniform(0.1, 0.9), y + rng.uniform(0.1, 0.9), (1.0 + 3.3 * m ** 0.8) * rng.uniform(0.55, 1.0), rng.uniform(1.05, 1.6)))
        elif rng.random() < 0.85: peaks.append((x + rng.uniform(0.15, 0.85), y + rng.uniform(0.15, 0.85), (0.7 + 2.0 * m) * rng.uniform(0.6, 1.0), rng.uniform(1.7, 2.3)))
Hp = np.zeros((NY, NX))
for (px_, py_, h_, s_) in peaks: Hp = np.maximum(Hp, h_ * np.clip(1 - np.hypot(UU - px_, VV - py_) * s_ / h_ / 1.4, 0, 1) ** 1.5)   # spitze Gipfel, breiter Fuß
Hm = Hp * ss(0.0, 0.3, mt) + 0.55 * NR * mt * ss(0.3, 1.5, Hp)
H = 0.06 * N1 + 0.03 * N2 + Hm
wd = ss(0.28, 0.75, wB); H = H * (1 - wd) - 0.42 * wd
PAL = next(((x, y) for y in range(MH) for x in range(MW) if MAP[y][x] == 'P'), None)
pud = ss(0.45, 0.8, sB) * ss(0.0, 0.25, NP)
if PAL: pud = pud * ss(1.3, 2.2, np.hypot(UU - PAL[0] - 0.5, VV - PAL[1] - 0.6))   # fester Grund um den Moorpalast
H = H - 0.22 * pud
rf = ss(0.5, 0.78, rB) * (1 - wd); H = H - 0.015 * rf
FIELDS = [(8.25, 20.2, 12.75, 23.8, 'acker'), (13.3, 20.2, 17.7, 23.1, 'weizen')]
FM = {}
for (x0, y0, x1, y1, kind) in FIELDS:
    f = ss(0.0, 0.12, np.minimum(np.minimum(UU - x0, x1 - UU), np.minimum(VV - y0, y1 - VV)))
    rows = 0.5 + 0.5 * np.sin(VV * math.tau * 3.2); FM[kind] = (f, rows); H = H + 0.035 * f * rows
WL = -0.08
gy, gx = np.gradient(H, 1 / SUB); slope = np.sqrt(gx ** 2 + (gy / K) ** 2)

# Farben (linear)
def C(h): return np.array(lin(h))
def mix(a, b, t): return a * (1 - t[..., None]) + b * t[..., None]
G1, G2, G3, G4, G5 = ('#2f6a2c', '#5aa444', '#86bc52', '#285a2c', '#245024') if TOY else ('#2a4e26', '#4e8240', '#6a8c44', '#24402a', '#1e3a1c')
col = mix(np.broadcast_to(C(G1), (NY, NX, 3)), np.broadcast_to(C(G2), (NY, NX, 3)), ss(-0.45, 0.5, N1))
col = mix(col, np.broadcast_to(C(G3), (NY, NX, 3)), 0.45 * ss(0.15, 0.6, N2))                     # helle Wiesenflecken
col = mix(col, np.broadcast_to(C(G4), (NY, NX, 3)), 0.4 * ss(0.2, 0.6, -N2))                      # dunkle Senken
col = mix(col, np.broadcast_to(C(G5), (NY, NX, 3)), 0.75 * ss(0.3, 0.8, tB))                     # Waldboden
col = mix(col, np.broadcast_to(C('#3a3c24'), (NY, NX, 3)), ss(0.35, 0.7, sB))                            # Sumpf
col = mix(col, np.broadcast_to(C('#2a3422'), (NY, NX, 3)), 0.6 * ss(0.3, 0.7, sB) * ss(-0.2, 0.3, N2))
col = mix(col, np.broadcast_to(C('#3c4836'), (NY, NX, 3)), 0.8 * ss(0.3, 0.7, yB))                       # Friedhofsrasen
col = mix(col, np.broadcast_to(C('#c8b07a' if TOY else '#8a7650'), (NY, NX, 3)), ss(0.08, 0.3, wB) * (1 - mt))                 # Ufer
col = mix(col, np.broadcast_to(C('#b8905c' if TOY else '#86704a'), (NY, NX, 3)), rf)                                          # Weg
col = mix(col, np.broadcast_to(C('#6a5638'), (NY, NX, 3)), rf * 0.5 * ss(0.1, 0.5, N2))
rock = mix(np.broadcast_to(C('#8a8290' if TOY else '#66605c'), (NY, NX, 3)), np.broadcast_to(C('#4e4856' if TOY else '#3a3634'), (NY, NX, 3)), ss(0.8, 2.2, slope))
rock = mix(rock, np.broadcast_to(C('#4e4a3c'), (NY, NX, 3)), 0.4 * ss(0.2, 0.6, N2))
rock = mix(rock, np.broadcast_to(C('#2e4a2c'), (NY, NX, 3)), 0.6 * (1 - ss(0.15, 0.7, H)))                # grüner Bergfuß
col = mix(col, rock, ss(0.02, 0.18, mt))
snow = ss(3.25, 3.6, H + 0.35 * N2) * (1 - ss(3.0, 4.2, slope))
f, rows = FM['acker']; col = mix(col, mix(np.broadcast_to(C('#2e2216'), (NY, NX, 3)), np.broadcast_to(C('#5a4630'), (NY, NX, 3)), rows), f)
f, rows = FM['weizen']; col = mix(col, mix(np.broadcast_to(C('#4a4a22'), (NY, NX, 3)), np.broadcast_to(C('#a89448'), (NY, NX, 3)), rows), f)
col = mix(col, np.broadcast_to(C('#e6eaf4'), (NY, NX, 3)), snow)

# ---------------- Gelände ----------------
def grid_mesh(name, Z, colors, mask=None, flat=None):
    vid = -np.ones((NY, NX), dtype=int); verts = []; cols = []
    for i in range(NY):
        for j in range(NX):
            if mask is not None and not (mask[max(i - 1, 0):i + 2, max(j - 1, 0):j + 2].any()): continue
            vid[i, j] = len(verts); verts.append((U[j], -V[i] * K, float(Z[i, j]))); cols.append(colors[i, j])
    faces = []
    for i in range(NY - 1):
        for j in range(NX - 1):
            q = (vid[i, j], vid[i + 1, j], vid[i + 1, j + 1], vid[i, j + 1])
            if min(q) < 0: continue
            if mask is not None and not mask[i:i + 2, j:j + 2].any(): continue
            faces.append(q)
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    a = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    a.data.foreach_set('color', np.hstack([np.array(cols), np.ones((len(cols), 1))]).ravel())
    for p in me.polygons: p.use_smooth = True
    if flat is not None:   # Fels facettiert, Wiesen weich
        fl = [bool(flat[i, j]) for i in range(NY - 1) for j in range(NX - 1) if min(vid[i, j], vid[i + 1, j], vid[i + 1, j + 1], vid[i, j + 1]) >= 0 and (mask is None or mask[i:i + 2, j:j + 2].any())]
        for p, f in zip(me.polygons, fl):
            if f: p.use_smooth = False
    return link(bpy.data.objects.new(name, me))
land = grid_mesh('land', H, col); land.data.materials.append(mat('land', attr=True, rough=0.62 if TOY else 0.88, bump=0.2 if TOY else 0.35, bscale=55, coat=0.18 if TOY else 0))
deep = ss(0.0, 0.3, WL - H)
wcol = mix(np.broadcast_to(C('#2c5c84'), (NY, NX, 3)), np.broadcast_to(C('#0c2244'), (NY, NX, 3)), deep)
wcol = mix(wcol, np.broadcast_to(C('#1c3a3a'), (NY, NX, 3)), ss(0.4, 0.7, sB))
water = grid_mesh('water', np.full((NY, NX), WL), wcol, mask=(H < WL + 0.01))
wm = mat('water', attr=True, rough=0.06 if TOY else 0.18, bump=0.12, bscale=18, coat=1.0 if TOY else 0); water.data.materials.append(wm)

# ---------------- Bausteine (alles in einem Netz je Material, Farbe je Ecke) ----------------
BM = {}
def bmget(key):
    if key not in BM:
        bm = bmesh.new(); BM[key] = (bm, bm.verts.layers.float_color.new('Col'))
    return BM[key]
def W(x, y, z=0.0): return Vector((x, -y * K, z))   # Kachelkoordinaten → Welt
def ground(x, y):
    j = int(round((x + PAD) * SUB)); i = int(round((y + PAD) * SUB))
    return float(H[min(max(i, 0), NY - 1), min(max(j, 0), NX - 1)])
def paint(key, verts, hexc, jitter=0.0):
    bm, lay = bmget(key); c = C(hexc)
    if jitter: c = c * (1 + rng.uniform(-jitter, jitter))
    for v in verts: v[lay] = (c[0], c[1], c[2], 1.0)
def cone(key, p, r1, r2, h, hexc, seg=8, jit=0.0, rot=0.0):
    bm, _ = bmget(key)
    m = Matrix.Translation(p + Vector((0, 0, h / 2))) @ Matrix.Rotation(rot, 4, 'Z')
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h, matrix=m); paint(key, g['verts'], hexc, jit)
def ball(key, p, r, hexc, sub=2, sz=1.0, lump=0.0, jit=0.0):
    bm, _ = bmget(key)
    g = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r, matrix=Matrix.Translation(p) @ Matrix.Diagonal((1, 1, sz, 1)))
    if lump:
        o = Vector((rng.random() * 50, rng.random() * 50, 0))
        for v in g['verts']: v.co += (v.co - p).normalized() * lump * noise.noise(v.co * 3 + o)
    paint(key, g['verts'], hexc, jit)
def cube(key, p0, p1, hexc, jit=0.0):   # achsenparallel, p0/p1 in Welt
    bm, _ = bmget(key); c = (p0 + p1) / 2; s = p1 - p0
    g = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((s.x, s.y, s.z, 1))); paint(key, g['verts'], hexc, jit)
def tbox(key, x0, y0, x1, y1, z0, z1, hexc, jit=0.0): cube(key, W(x0, y1, z0), W(x1, y0, z1), hexc, jit)
def prism(key, x0, y0, x1, y1, z0, z1, hexc, over=0.08):   # Satteldach, First in x-Richtung
    bm, lay = bmget(key)
    a = [bm.verts.new(W(x, y, z)) for (x, y, z) in ((x0 - over, y0 - over, z0), (x1 + over, y0 - over, z0), (x1 + over, y1 + over, z0), (x0 - over, y1 + over, z0))]
    r = [bm.verts.new(W(x, (y0 + y1) / 2, z1)) for x in (x0 - over, x1 + over)]
    for f in ((a[0], a[1], r[1], r[0]), (a[2], a[3], r[0], r[1]), (a[1], a[2], r[1]), (a[3], a[0], r[0]), (a[3], a[2], a[1], a[0])): bm.faces.new(f)
    paint(key, a + r, hexc)
def tube(key, a, b, r, hexc, seg=6):
    d = b - a; L = d.length
    if L < 1e-6: return
    bm, _ = bmget(key); q = d.to_track_quat('Z', 'Y')
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r * 0.8, depth=L, matrix=Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    paint(key, g['verts'], hexc)
LIGHTS = []   # sichtbare Lichtquellen (Welt, Art) → Bildpunkte für das Flackern im Spiel
def glow_at(p, kind): LIGHTS.append((p, kind))
def lamp(p, hexc, watt, rad=0.05):
    l = bpy.data.lights.new('l', 'POINT'); l.energy = watt; l.color = lin(hexc); l.shadow_soft_size = rad
    o = bpy.data.objects.new('l', l); o.location = p; link(o)

# ---------------- Bäume, Büsche, Blumen, Steine ----------------
DECID = lambda x, y: (x < 20 and y < 20) or rng.random() < 0.25
for y in range(-PAD, MH + PAD):
    for x in range(-PAD, MW + PAD):
        c = CELLS[y + PAD][x + PAD]
        if c == 'T':
            for k in range(3):
                px, py = x + rng.uniform(0.1, 0.9), y + rng.uniform(0.1, 0.95); z = ground(px, py)
                if DECID(x, y):
                    r = rng.uniform(0.36, 0.5)
                    if TOY:
                        tone = rng.choice(['#3c8a3a', '#4a9a40', '#2f7a34', '#5aa848']) if rng.random() > 0.18 else rng.choice(['#e0802c', '#d04a2c', '#e8a83a'])
                        cone('wood', W(px, py, z), 0.08, 0.06, r * 0.9 + 0.2, '#7a4c2c', 10)
                        ball('leaf', W(px, py, z + r * 0.95 + 0.3), r * 1.02, tone, 3, 0.92, 0.02, 0.05)
                    else:
                        tone = rng.choice(['#2c5a2c', '#33652e', '#284e2a', '#3a6a30', '#4a6c2a']) if rng.random() > 0.18 else rng.choice(['#8a5a1c', '#9a4420', '#7a6a20', '#a07428'])
                        ball('leaf', W(px, py, z + r * 0.95 + 0.12), r, tone, 2, 0.85, 0.09, 0.08)
                else:
                    h = rng.uniform(0.95, 1.3); r = rng.uniform(0.3, 0.4); tone = rng.choice(['#2a6a44', '#327a4c', '#245e3c', '#3a8450'] if TOY else ['#1e4430', '#22503a', '#1a3c2c', '#28563a']); sg = 14 if TOY else 7
                    cone('leaf', W(px, py, z + 0.12), r, 0.0, h * 0.62, tone, sg, 0.08, rng.random())
                    cone('leaf', W(px, py, z + 0.12 + h * 0.38), r * 0.72, 0.0, h * 0.62, tone, sg, 0.08, rng.random())
                    cone('wood', W(px, py, z), 0.06, 0.05, 0.2, '#4a3020')
        elif c == 'h':
            for k in range(2):
                px, py = x + rng.uniform(0.25, 0.75), y + rng.uniform(0.3, 0.8)
                ball('leaf', W(px, py, ground(px, py) + 0.16), rng.uniform(0.18, 0.26), '#3c6c30', 2, 0.8, 0.05, 0.1)
        elif c == '.' and 0 <= x < MW and 0 <= y < MH and not any(f[0] - 0.9 <= x <= f[2] and f[1] - 0.9 <= y <= f[3] for f in FIELDS):
            if rng.random() < 0.1:
                fc = rng.choice(['#f0e8f8', '#f8d048', '#c880e8', '#f07090'])
                for k in range(rng.randint(1, 3)):
                    px, py = x + rng.uniform(0.15, 0.85), y + rng.uniform(0.15, 0.85)
                    ball('flower', W(px, py, ground(px, py) + 0.05), 0.055, fc, 1)
            for k in range(rng.randint(0, 3)):   # Grasbüschel mit kleinem Schatten
                px, py = x + rng.uniform(0.05, 0.95), y + rng.uniform(0.05, 0.95)
                cone('leaf', W(px, py, ground(px, py)), 0.07, 0.0, rng.uniform(0.1, 0.16), rng.choice(['#4a7c38', '#5a8a40', '#3c6a30']), 5, 0.1, rng.random())
            if rng.random() < 0.06:
                px, py = x + rng.uniform(0.2, 0.8), y + rng.uniform(0.3, 0.8)
                ball('stone', W(px, py, ground(px, py) + 0.04), rng.uniform(0.09, 0.16), '#7a7880', 1, 0.6, 0.03, 0.12)
        elif c == 's' and rng.random() < 0.55:   # Schilf und Seerosen
            px, py = x + rng.uniform(0.2, 0.8), y + rng.uniform(0.2, 0.8)
            for k in range(rng.randint(3, 6)):
                bx, by = px + rng.uniform(-0.12, 0.12), py + rng.uniform(-0.12, 0.12); z = max(ground(bx, by), WL)
                tube('leaf', W(bx, by, z), W(bx + rng.uniform(-0.04, 0.04), by, z + rng.uniform(0.25, 0.4)), 0.014, '#6c7c3c', 4)
                if k % 2: ball('wood', W(bx, by, z + 0.32), 0.03, '#6c4424', 1, 2.2)
            lx, ly = x + rng.uniform(0.2, 0.8), y + rng.uniform(0.2, 0.8)
            if ground(lx, ly) < WL: cone('leaf', W(lx, ly, WL), 0.11, 0.11, 0.01, '#4c8c3c', 9)

# ---------------- Brücke ----------------
bt = [(x, y) for y in range(MH) for x in range(MW) if MAP[y][x] == 'B']
if bt:
    x0, x1 = min(p[0] for p in bt) - 0.2, max(p[0] for p in bt) + 1.2; yb = bt[0][1]
    n = int((x1 - x0) / 0.14)
    for k in range(n):
        tbox('wood', x0 + k * (x1 - x0) / n, yb + 0.18, x0 + (k + 0.85) * (x1 - x0) / n, yb + 0.86, 0.02, 0.1, '#8c5c2c' if k % 2 else '#7a4c24', 0.06)
    for yy in (yb + 0.16, yb + 0.86):
        for xx in np.linspace(x0, x1, 5): tbox('wood', xx - 0.04, yy - 0.04, xx + 0.04, yy + 0.04, 0.0, 0.36, '#5c3a1c')
        tbox('wood', x0, yy - 0.025, x1, yy + 0.025, 0.28, 0.34, '#a87040')

# ---------------- Orte ----------------
def spot(c):
    for y in range(MH):
        for x in range(MW):
            if MAP[y][x] == c: return x, y
S0, H0, K0, G0 = spot('S'), spot('H'), spot('K'), spot('G')
# Kräuterhütte der Walburga: Fachwerk, Strohdach, Schornstein, Fenster mit Licht, Kessel mit grünem Schein, Kräuterbeet
hx, hy = H0
tbox('house', hx + 0.06, hy + 0.2, hx + 0.94, hy + 0.82, 0.0, 0.44, '#7a5634')
for xx in (hx + 0.06, hx + 0.5, hx + 0.92): tbox('house', xx, hy + 0.8, xx + 0.04, hy + 0.85, 0.0, 0.44, '#3a2414')
tbox('house', hx + 0.06, hy + 0.8, hx + 0.96, hy + 0.85, 0.2, 0.24, '#3a2414')
prism('roof', hx + 0.06, hy + 0.2, hx + 0.94, hy + 0.82, 0.42, 0.86, '#9a7838', 0.1)
tbox('stone', hx + 0.68, hy + 0.32, hx + 0.82, hy + 0.46, 0.4, 1.0, '#6a6470')
tbox('wood', hx + 0.42, hy + 0.83, hx + 0.58, hy + 0.86, 0.0, 0.3, '#3a2410')
tbox('glow', hx + 0.16, hy + 0.83, hx + 0.32, hy + 0.86, 0.18, 0.32, '#ffb450')
tbox('glow', hx + 0.68, hy + 0.83, hx + 0.84, hy + 0.86, 0.18, 0.32, '#ffb450')
lamp(W(hx + 0.5, hy + 1.1, 0.35), '#ffa850', 18, 0.2); glow_at(W(hx + 0.24, hy + 0.85, 0.25), 'win'); glow_at(W(hx + 0.76, hy + 0.85, 0.25), 'win')
ball('iron', W(hx - 0.25, hy + 0.95, 0.12), 0.14, '#18161c', 2, 0.8)
cone('brew', W(hx - 0.25, hy + 0.95, 0.2), 0.11, 0.11, 0.02, '#60ff70', 10)
lamp(W(hx - 0.25, hy + 0.95, 0.4), '#70ff80', 8, 0.1); glow_at(W(hx - 0.25, hy + 0.95, 0.22), 'brew')
for k in range(6):
    tbox('flower', hx + 1.05 + (k % 3) * 0.16, hy + 0.35 + (k // 3) * 0.22, hx + 1.13 + (k % 3) * 0.16, hy + 0.43 + (k // 3) * 0.22, 0.0, 0.08, rng.choice(['#c880e8', '#f8d048', '#e8e0f0']))
CHIM = W(hx + 0.75, hy + 0.39, 1.0)
# Bahnhof Krat: Backstein, Schieferdach, Fenster mit Licht, Bahnsteig, Gleis nach Westen, kleiner Zug, Laternen
sx, sy = S0
tbox('brick', sx - 0.9, sy - 0.35, sx + 1.4, sy + 0.42, 0.0, 0.58, '#86483a')
prism('slate', sx - 0.9, sy - 0.35, sx + 1.4, sy + 0.42, 0.56, 1.0, '#3c3c4e', 0.1)
for k in range(4): tbox('glow', sx - 0.7 + k * 0.55, sy + 0.42, sx - 0.5 + k * 0.55, sy + 0.45, 0.2, 0.42, '#ffd070')
tbox('stone', sx - 1.6, sy + 0.45, sx + 1.9, sy + 0.95, 0.0, 0.07, '#6e6c74')
for xx in (sx - 1.3, sx + 1.6):
    tbox('iron', xx - 0.03, sy + 0.82, xx + 0.03, sy + 0.88, 0.0, 0.5, '#20202a'); ball('glow', W(xx, sy + 0.85, 0.54), 0.06, '#ffd070', 1)
    lamp(W(xx, sy + 0.95, 0.6), '#ffc060', 10, 0.1); glow_at(W(xx, sy + 0.85, 0.54), 'lamp')
ry = sy + 1.2
for k in range(int((sx + 6 + PAD) / 0.25)):
    xx = -PAD + k * 0.25; tbox('wood', xx, ry - 0.02, xx + 0.1, ry + 0.38, 0.0, 0.03, '#3c2a1c')
for yy in (ry + 0.06, ry + 0.3): tbox('iron', -PAD, yy - 0.015, sx + 6, yy + 0.015, 0.03, 0.06, '#9a9aa8')
tbox('red', sx + 5.9, ry - 0.04, sx + 6.05, ry + 0.4, 0.0, 0.22, '#a02c24')
tx0 = sx + 3.0   # Zug: Lok mit Kessel und Schlot, ein Wagen mit erleuchteten Fenstern
tube('iron', W(tx0 + 0.2, ry + 0.18, 0.36), W(tx0 + 1.2, ry + 0.18, 0.36), 0.2, '#22222c', 12)
tbox('iron', tx0 + 1.15, ry - 0.02, tx0 + 1.6, ry + 0.38, 0.06, 0.66, '#2a2a34'); tbox('red', tx0 + 1.1, ry - 0.04, tx0 + 1.65, ry + 0.4, 0.64, 0.7, '#a02c24')
tbox('glow', tx0 + 1.25, ry + 0.38, tx0 + 1.45, ry + 0.4, 0.38, 0.55, '#ffd070')
cone('iron', W(tx0 + 0.4, ry + 0.18, 0.5), 0.06, 0.09, 0.3, '#18181e', 8)
tbox('red', tx0 + 0.15, ry - 0.03, tx0 + 1.6, ry + 0.39, 0.06, 0.14, '#a02c24')
for xx in (tx0 + 0.35, tx0 + 0.75, tx0 + 1.3): tube('iron', W(xx, ry - 0.04, 0.12), W(xx, ry + 0.42, 0.12), 0.11, '#3a3a44', 10)
tbox('car', tx0 - 1.5, ry - 0.02, tx0 + 0.05, ry + 0.38, 0.08, 0.62, '#2c4a3a'); tbox('slate', tx0 - 1.55, ry - 0.05, tx0 + 0.1, ry + 0.41, 0.62, 0.68, '#30303c')
for k in range(4): tbox('glow', tx0 - 1.35 + k * 0.36, ry + 0.38, tx0 - 1.15 + k * 0.36, ry + 0.4, 0.32, 0.5, '#ffd070')
lamp(W(tx0 - 0.6, ry + 0.7, 0.4), '#ffc060', 6, 0.3)
# Tiefe Höhle: Felsbogen im Berghang, dunkle Öffnung nach Süden, zwei Fackeln
kx, ky = K0; kz = ground(kx + 0.5, ky - 0.1)
for k in range(11):
    a = math.pi * k / 10; px = kx + 0.5 + math.cos(a) * 0.8; pz = kz + 0.05 + math.sin(a) * 0.95
    ball('stone', Vector((px, -(ky - 0.05) * K, pz)), rng.uniform(0.24, 0.3), '#8a8090', 1, 1.0, 0.05, 0.12)
bm, lay = bmget('hole'); vs = [bm.verts.new(Vector((kx + 0.5 + math.cos(math.pi * k / 12) * 0.62, -(ky + 0.02) * K, kz + math.sin(math.pi * k / 12) * 0.8))) for k in range(13)]
bm.faces.new(vs); paint('hole', vs, '#020104')
lamp(W(kx + 0.5, ky - 0.3, kz + 0.3), '#ff3020', 5, 0.2)   # rötlicher Schein aus der Tiefe
for xx in (kx - 0.45, kx + 1.45):
    tbox('wood', xx - 0.03, ky + 0.1, xx + 0.03, ky + 0.16, kz, kz + 0.5, '#4a3020'); ball('fire', W(xx, ky + 0.13, kz + 0.56), 0.07, '#ffa040', 1, 1.4)
    lamp(W(xx, ky + 0.35, kz + 0.6), '#ff9040', 9, 0.1); glow_at(W(xx, ky + 0.13, kz + 0.56), 'fire')
# Friedhof: Grabsteine und Kreuze, Eisengitter oben und unten, ein toter Baum, das offene Grab mit Erdhaufen, Schaufel und Laterne
gx, gy = G0
for y in range(MH):
    for x in range(MW):
        if MAP[y][x] == '+' and rng.random() < 0.8:
            px, py = x + rng.uniform(0.25, 0.75), y + rng.uniform(0.3, 0.7)
            if rng.random() < 0.6:
                tbox('stone', px - 0.2, py - 0.06, px + 0.2, py + 0.06, 0.0, 0.46, rng.choice(['#b4b4c0', '#a4a4b0', '#bcbac4']), 0.04)
                tube('stone', W(px - 0.2, py, 0.46), W(px + 0.2, py, 0.46), 0.06, '#b4b4c0', 10)
            else:
                tbox('stone', px - 0.05, py - 0.05, px + 0.05, py + 0.05, 0.0, 0.6, '#b4b4c0'); tbox('stone', px - 0.18, py - 0.05, px + 0.18, py + 0.05, 0.36, 0.46, '#b4b4c0')
ys = [y for y in range(MH) for x in range(MW) if MAP[y][x] in '+G']; xs = [x for y in range(MH) for x in range(MW) if MAP[y][x] in '+G']
fx0, fx1, fy0, fy1 = min(xs) + 0.1, max(xs) + 0.9, min(ys) + 0.05, max(ys) + 0.95
for yy in (fy0, fy1):
    for k in range(int((fx1 - fx0) / 0.2) + 1):
        xx = fx0 + k * 0.2
        if yy == fy1 and abs(xx - (gx + 0.5)) < 0.5: continue
        tbox('iron', xx - 0.015, yy - 0.015, xx + 0.015, yy + 0.015, 0.0, 0.3, '#24222c')
    tbox('iron', fx0, yy - 0.02, fx1, yy + 0.02, 0.24, 0.28, '#24222c')
tb = Vector((min(xs) + 0.7, -(min(ys) + 0.5) * K, 0))
tube('wood', tb, tb + Vector((0.05, 0, 0.8)), 0.06, '#3a2a24')
for a, l in ((0.7, 0.4), (-0.9, 0.35), (2.2, 0.3)): tube('wood', tb + Vector((0.04, 0, 0.6)), tb + Vector((0.04 + math.cos(a) * l, math.sin(a) * l * 0.4, 0.6 + l * 0.7)), 0.025, '#3a2a24', 5)
tbox('hole', gx + 0.25, gy + 0.3, gx + 0.75, gy + 0.85, 0.0, 0.012, '#060408')
tbox('stone', gx + 0.25, gy + 0.08, gx + 0.75, gy + 0.2, 0.0, 0.5, '#9c9ca8'); tube('stone', W(gx + 0.25, gy + 0.14, 0.5), W(gx + 0.75, gy + 0.14, 0.5), 0.12, '#9c9ca8', 10)
ball('dirt', W(gx + 0.95, gy + 0.6, 0.02), 0.22, '#4a3420', 2, 0.55, 0.05)
tube('wood', W(gx + 0.98, gy + 0.62, 0.05), W(gx + 1.02, gy + 0.55, 0.62), 0.02, '#7a5a34', 5); tbox('iron', gx + 0.93, gy + 0.6, gx + 1.06, gy + 0.64, 0.0, 0.14, '#7a7a84')
tbox('iron', gx + 0.08, gy + 0.72, gx + 0.18, gy + 0.82, 0.0, 0.18, '#24222c'); ball('glow', W(gx + 0.13, gy + 0.77, 0.12), 0.045, '#ffc060', 1)
lamp(W(gx + 0.2, gy + 0.95, 0.3), '#ffb050', 6, 0.1); glow_at(W(gx + 0.13, gy + 0.77, 0.12), 'lamp')
# Wegweiser an der Kreuzung
wx, wy = 33.75, 17.35
tbox('wood', wx - 0.03, wy - 0.03, wx + 0.03, wy + 0.03, 0.0, 0.5, '#5c3a1c'); tbox('wood', wx - 0.25, wy - 0.02, wx + 0.12, wy + 0.02, 0.38, 0.46, '#8c6434'); tbox('wood', wx - 0.08, wy - 0.02, wx + 0.28, wy + 0.02, 0.27, 0.35, '#8c6434')

# Moorpalast: Steinsockel im Sumpf, Säulenhalle mit Schieferdach, dunkles Tor, zwei Feuerschalen
if PAL:
    qx, qy = PAL
    tbox('stone', qx - 0.6, qy - 0.3, qx + 1.6, qy + 1.1, 0.0, 0.12, '#5a5864', 0.04); tbox('stone', qx - 0.3, qy + 0.95, qx + 1.3, qy + 1.25, 0.0, 0.06, '#6a6874')
    tbox('stone', qx - 0.35, qy - 0.15, qx + 1.35, qy + 0.6, 0.12, 0.66, '#45434f')
    for k in range(5): tube('stone', W(qx - 0.28 + k * 0.39, qy + 0.74, 0.12), W(qx - 0.28 + k * 0.39, qy + 0.74, 0.7), 0.06, '#8c8a96', 8)
    tbox('stone', qx - 0.42, qy + 0.6, qx + 1.42, qy + 0.86, 0.7, 0.8, '#7a7884')
    prism('slate', qx - 0.42, qy - 0.15, qx + 1.42, qy + 0.86, 0.8, 1.18, '#34323f', 0.05)
    tbox('hole', qx + 0.36, qy + 0.58, qx + 0.64, qy + 0.62, 0.12, 0.5, '#020104')
    ball('glow', W(qx + 0.5, qy + 0.86, 0.98), 0.07, '#ffd070', 1)   # Mondsichel im Giebel
    for xx in (qx - 0.48, qx + 1.48):
        tbox('iron', xx - 0.04, qy + 1.0, xx + 0.04, qy + 1.08, 0.0, 0.36, '#24222c'); cone('iron', W(xx, qy + 1.04, 0.36), 0.03, 0.09, 0.07, '#24222c', 8)
        ball('fire', W(xx, qy + 1.04, 0.46), 0.07, '#ffa040', 1, 1.5); lamp(W(xx, qy + 1.3, 0.55), '#ff9040', 8, 0.1); glow_at(W(xx, qy + 1.04, 0.46), 'fire')
# Laternen am Weg: warme Lichtinseln
LOCS = [spot(c) for c in 'SHKG']
for y in range(MH):
    for x in range(MW):
        if MAP[y][x] != '=' or (x * 3 + y * 5) % 8 or any(abs(x - a) + abs(y - b) < 3 for a, b in LOCS): continue
        horiz = 0 < x < MW - 1 and (MAP[y][x - 1] in '=SB' or MAP[y][x + 1] in '=SB')
        lx, ly = (x + 0.5, y + 0.06) if horiz else (x + 0.94, y + 0.5)
        tbox('iron', lx - 0.025, ly - 0.025, lx + 0.025, ly + 0.025, 0.0, 0.56, '#24222c'); tbox('iron', lx - 0.05, ly - 0.05, lx + 0.05, ly + 0.05, 0.6, 0.63, '#24222c')
        ball('glow', W(lx, ly, 0.56), 0.05, '#ffd070', 1); lamp(W(lx, ly + 0.25, 0.62), '#ffb860', 5, 0.08); glow_at(W(lx, ly, 0.56), 'lamp')
# Felder: Zaun, Vogelscheuche, Heuhaufen
for (x0, y0, x1, y1, kind) in FIELDS:
    for (a, b, c_, d) in ((x0, y0, x1, y0), (x0, y1, x1, y1), (x0, y0, x0, y1), (x1, y0, x1, y1)):
        L = math.hypot(c_ - a, d - b); n = int(L / 0.34)
        for k in range(n + 1):
            px_, py_ = a + (c_ - a) * k / n, b + (d - b) * k / n
            if kind == 'acker' and a == x1 and abs(py_ - (y0 + y1) / 2) < 0.4: continue   # Tor zum Weg
            tbox('wood', px_ - 0.025, py_ - 0.025, px_ + 0.025, py_ + 0.025, 0.0, 0.24, '#6a4a2a')
        if b == d: tbox('wood', a, b - 0.015, c_, b + 0.015, 0.15, 0.19, '#7a5632')
        else: tbox('wood', a - 0.015, b, a + 0.015, d, 0.15, 0.19, '#7a5632')
cx_, cy_ = 10.5, 22.0   # Vogelscheuche mit Hut
tbox('wood', cx_ - 0.03, cy_ - 0.03, cx_ + 0.03, cy_ + 0.03, 0.0, 0.7, '#5a3a1c'); tbox('wood', cx_ - 0.3, cy_ - 0.02, cx_ + 0.3, cy_ + 0.02, 0.48, 0.53, '#5a3a1c')
tbox('house', cx_ - 0.13, cy_ - 0.06, cx_ + 0.13, cy_ + 0.06, 0.3, 0.55, '#6a2c24'); ball('dirt', W(cx_, cy_, 0.66), 0.09, '#c8a050', 1)
cone('wood', W(cx_, cy_, 0.72), 0.16, 0.0, 0.2, '#3a2a1c', 8); cone('wood', W(cx_, cy_, 0.72), 0.2, 0.2, 0.02, '#3a2a1c', 10)
for (hx_, hy_) in ((14.2, 21.0), (16.6, 22.4), (15.3, 22.6)):   # Heuhaufen
    ball('dirt', W(hx_, hy_, 0.05), 0.24, '#b09048', 2, 0.85, 0.04)
# Bergwald: Tannen am Fuß der Berge, Felsbrocken
for y in range(-PAD, MH + PAD):
    for x in range(-PAD, MW + PAD):
        if CELLS[y + PAD][x + PAD] != 'M': continue
        for k in range(2):
            px_, py_ = x + rng.random(), y + rng.random(); z = ground(px_, py_)
            if 0.12 < z < 1.4 and rng.random() < 0.45:
                h = rng.uniform(0.7, 1.0); r = rng.uniform(0.22, 0.3); tone = rng.choice(['#1a3a2c', '#1e4232', '#163426'])
                cone('leaf', W(px_, py_, z), r, 0.0, h * 0.6, tone, 7, 0.08, rng.random()); cone('leaf', W(px_, py_, z + h * 0.35), r * 0.7, 0.0, h * 0.6, tone, 7, 0.08, rng.random())
            elif 0.02 < z < 0.4 and rng.random() < 0.25:
                ball('stone', W(px_, py_, z), rng.uniform(0.12, 0.22), '#6a6470', 1, 0.7, 0.05, 0.1)
# Steine im Fluss und Gischt, wo er aus den Bergen kommt
for y in range(-PAD, MH + PAD):
    for x in range(-PAD, MW + PAD):
        if CELLS[y + PAD][x + PAD] != '~': continue
        if rng.random() < 0.14: ball('stone', W(x + rng.uniform(0.2, 0.8), y + rng.uniform(0.2, 0.8), WL - 0.03), rng.uniform(0.07, 0.12), '#5a5a66', 1, 0.6, 0.03, 0.1)
        if y <= 1:
            for k in range(6): cone('foam', W(x + rng.uniform(0.05, 0.95), y + rng.uniform(0.0, 1.0), WL + 0.005), rng.uniform(0.05, 0.12), rng.uniform(0.05, 0.12), 0.01, '#d0e0f4', 8)

# Netze bauen, Materialien
MATS = {'leaf': ('leaf', 0.75, 0, 0, True), 'wood': ('wood', 0.8, 0, 0, True), 'flower': ('flower', 0.5, 0, 0.25, True), 'stone': ('stone', 0.85, 0, 0, True),
        'house': ('house', 0.8, 0, 0, True), 'roof': ('roof', 0.9, 0, 0, True), 'glow': ('#ffc060', 0.5, 0, 6.0, False), 'iron': ('iron', 0.45, 0.6, 0, True),
        'brew': ('#60ff70', 0.3, 0, 5.0, False), 'brick': ('brick', 0.85, 0, 0, True), 'slate': ('slate', 0.6, 0, 0, True), 'red': ('red', 0.5, 0.2, 0, True),
        'car': ('car', 0.6, 0, 0, True), 'hole': ('#020104', 1.0, 0, 0, False), 'fire': ('#ffa040', 0.5, 0, 8.0, False), 'dirt': ('dirt', 0.95, 0, 0, True), 'foam': ('foam', 0.4, 0, 0.35, True)}
TOYM = {'leaf': (0.3, 0.55), 'wood': (0.45, 0.35), 'stone': (0.45, 0.35), 'house': (0.4, 0.4), 'roof': (0.35, 0.5), 'brick': (0.45, 0.35), 'slate': (0.3, 0.5), 'red': (0.3, 0.6), 'car': (0.3, 0.6), 'dirt': (0.6, 0.15), 'flower': (0.3, 0.5)}
for key, (bm, lay) in BM.items():
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free()
    nm, rough, metal, emit, attr = MATS.get(key, (key, 0.8, 0, 0, True))
    cr = TOYM.get(key) if TOY else None
    me.materials.append(mat('m_' + key, None if attr else nm, cr[0] if cr else rough, metal, emit, attr, coat=cr[1] if cr else 0))
    if key in ('leaf', 'stone', 'dirt') or (TOY and key in ('wood', 'flower')):
        for p in me.polygons: p.use_smooth = True
    link(bpy.data.objects.new(key, me))

# ---------------- Licht, Kamera, Bild ----------------
def sun(az, el, hexc, power, ang=3.0):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = power; l.color = lin(hexc); l.angle = math.radians(ang)
    o = bpy.data.objects.new('sun', l); d = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), -math.sin(el)))
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); link(o)
sun(math.radians(CFG.get('az', 18)), math.radians(CFG.get('el', 46)), '#d0d8ff' if TOY else '#c4cdf5', CFG.get('moon', 3.6 if TOY else 2.8), 6.0 if TOY else 3.0)
sun(math.radians(225), math.radians(22), '#ff6a5a', CFG.get('red', 0.2), 6)
wd_ = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); sc.world = wd_; wd_.use_nodes = True
bg = next(n for n in wd_.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs['Color'].default_value = lin('#34407a' if TOY else '#1c2848') + [1]; bg.inputs['Strength'].default_value = CFG.get('amb', 1.45 if TOY else 1.15)
cam = bpy.data.cameras.new('ucam'); cam.type = 'ORTHO'; cam.ortho_scale = MW; cam.clip_end = 300
co = bpy.data.objects.new('ucam', cam); co.rotation_euler = (TILT, 0, 0)
co.location = Vector((MW / 2, -(MH / 2) * K, 0)) + 80 * Vector((0, -math.sin(TILT), math.cos(TILT))); link(co); sc.camera = co
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except TypeError: pass
try: sc.eevee.taa_render_samples = CFG.get('samples', 48)
except Exception: pass
for k, v in (('use_shadows', True), ('use_gtao', True), ('use_raytracing', True), ('shadow_ray_count', 2), ('shadow_step_count', 8)):
    try: setattr(sc.eevee, k, v)
    except Exception: pass
try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
except Exception: pass
sc.view_settings.exposure = CFG.get('exp', 0.0)
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = MW * 16 * SS, MH * 16 * SS, 100
sc.render.film_transparent = False; sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = CFG['out']; bpy.ops.render.render(write_still=True)
px = lambda p: (round(p.x * 16, 1), round((-p.y / K - p.z * math.sin(TILT)) * 16, 1))
import json
if CFG.get('lights'): json.dump([[px(p)[0], px(p)[1], k] for p, k in LIGHTS], open(CFG['lights'], 'w'))
print('ok', 'Schornstein', px(CHIM), 'Verts', len(land.data.vertices), 'Lichter', len(LIGHTS))
