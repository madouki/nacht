# Hintergründe „Grotte“ und „Uhrturm“ für NACHTMAHR in Blender (je 512×208, nahtlos kachelbar – waagrecht und senkrecht).
# Grotte: Felswand als verschobene Fläche (periodisches Rauschen aus Sinuswellen, darum ohne Naht) und drei Tropfsteinsäulen.
# Uhrturm: Quadermauerwerk mit Pilastern, Eichenbalken mit Eisenbändern, Spitzbogenfenstern und einem Steinring um die Uhr
# (Zifferblatt, Zeiger und Lichtbahnen zeichnet weiter das Spiel).
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'what': ['cave', 'tower'], 'ss'}. Nutzt die Helfer aus crypt_bg_bl.py.
import bpy, bmesh, math, os, random
_s2 = open(os.path.join(CFG['dir'], 'crypt_bg_bl.py'), encoding='utf-8').read()
exec(compile(_s2[:_s2.index('def run():')], 'crypt_helpers', 'exec'))

def lights(key, kc, fill, fc):
    for o in bpy.data.objects:
        if o.type != 'LIGHT': continue
        if o.name == 'Key': o.data.energy = key; o.data.color = kc
        elif o.name == 'Fill': o.data.energy = fill; o.data.color = fc
        else: o.data.energy = 0.0

def strata(c1, c2, period, rough=0.9):  # Gestein mit waagrechten Schichten: Farbe wechselt mit der Höhe (Periode teilt 208)
    k = ('strata', c1, c2, period)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new('strata'); m.use_nodes = True; m.use_backface_culling = False
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 2 * math.pi / period; nt.links.new(sep.outputs['Z'], mul.inputs[0])
    sn = nt.nodes.new('ShaderNodeMath'); sn.operation = 'SINE'; nt.links.new(mul.outputs[0], sn.inputs[0])
    hf = nt.nodes.new('ShaderNodeMath'); hf.operation = 'MULTIPLY_ADD'; hf.inputs[1].default_value = 0.5; hf.inputs[2].default_value = 0.5; nt.links.new(sn.outputs[0], hf.inputs[0])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    nt.links.new(hf.outputs[0], mix.inputs[0]); mix.inputs[6].default_value = lin(c1); mix.inputs[7].default_value = lin(c2)
    nt.links.new(mix.outputs[2], b.inputs['Base Color']); b.inputs['Roughness'].default_value = rough
    MATS[k] = m; return m

def rock_h(seed, terms=30, kx_max=10, ky_max=5):  # periodische, zerklüftete Höhe h(x, y) in 0..1 (Perioden 512 und 208)
    random.seed(seed)
    T = []
    for _ in range(terms):
        kx, ky = random.randint(0, kx_max), random.randint(0, ky_max)
        if kx == 0 and ky == 0: kx = 1
        T.append((kx, ky, random.uniform(0, 1), 1.0 / (kx + ky * 1.6 + 1) ** 0.85))
    tot = sum(t[3] for t in T)
    return lambda x, y: sum(a * (1 - abs(math.sin(math.pi * (kx * x / 512 + ky * y / 208 + ph)))) for kx, ky, ph, a in T) / tot

def flat(o):
    for p in o.data.polygons: p.use_smooth = False
    return o

def cave_far():
    h = rock_h(61, 64, 22, 9); mat = strata('#64462a', '#544024', 52)
    flat(grid(lambda u, v: (u * 512, v * 208, -70 * (h(u * 512, v * 208) - 0.5)), 128, 52, mat))
    glow(80, 60, -34, 260000, (0.25, 0.75, 1.0), 6); glow(300, 150, -34, 220000, (0.6, 0.3, 1.0), 6); glow(440, 40, -34, 200000, (0.25, 0.75, 1.0), 6)   # ferner Kristallschein

def cave_pillars():
    h = rock_h(77, 40, 9, 14); mat = strata('#7a6046', '#665038', 26)
    for cx, w in ((40, 17), (170, 23), (380, 19)):   # Tropfsteinsäulen: oben und unten breit, in der Mitte eingeschnürt, mit Sinterringen
        def f(u, v, cx=cx, w=w):
            Y = v * 208; th = u * math.pi
            r = w / 2 * (0.6 + 0.4 * abs(math.cos(Y / 208 * math.pi * 2))) + (h(cx * 7 + u * 90, Y) - 0.5) * 9.0
            return (cx - math.cos(th) * r, Y, -math.sin(th) * r * 0.85)
        flat(grid(f, 10, 52, mat))

def tower_wall():
    wall = BR('#555560', '#44444e', '#0c0c10', 24, 13, bump=0.8, mortar=0.9)
    block = BR('#70707c', '#5e5e6a', '#141418', 16, 13, bump=0.9)
    wood = BR('#6a4420', '#58381a', '#22140a', 64, 3.4, rough=0.7, bump=0.5, mortar=0.5)
    iron, glass, dark = M('#30303c', 0.4, 0.8), M('#a80020', 0.3, 0, 1.6), M('#050508', 0.9)
    vs1, vs2 = M('#7a7a88', 0.85), M('#666672', 0.85)
    WIN = (40, 250, 470); CX, CY = 380, 66
    holes = [lambda x, y, w=w: abs(x - (w + 3)) < 6 and ((y >= 46 and y < 82) or (y < 46 and y > 46 - 14 * (1 - abs(x - (w + 3)) / 6))) for w in WIN]   # Spitzbogenfenster
    holes.append(lambda x, y: (x - CX) ** 2 + (y - CY) ** 2 < 35 ** 2)                                                                       # Uhrnische
    mask(holes, wall, 0.0, 2)
    box(256, 104, 16, 256, 1, 104, dark)                                                                                                      # Dunkel hinter den Öffnungen
    for w in WIN:                                                                                                                             # Glas, Mittelpfosten, Gewände
        box(w + 3, 60, 8, 6, 0.5, 22, glass); box(w + 3, 60, 6, 0.6, 1, 22, iron); box(w + 3, 62, 6, 6, 1, 0.6, iron)
        for d in (-1, 1): box(w + 3 + d * 8, 64, -2, 2.2, 3, 19, block)
        box(w + 3, 84.5, -3, 11, 4, 2.5, block)
        for d in (-1, 1): box(w + 3 + d * 4.4, 37, -2, 2.0, 3, 9.5, vs1 if d < 0 else vs2, (0, math.radians(-d * 24), 0))
    N = 22
    for j in range(N):                                                                                                                        # Steinring um die Uhr
        th = 2 * math.pi * (j + 0.5) / N
        box(CX + math.cos(th) * 39.5, CY - math.sin(th) * 39.5, -3, 5.2, 4.5, 4.6, vs1 if j % 2 == 0 else vs2, (0, math.radians(90) - th, 0))
    box(CX, CY, 12, 36, 1, 36, BR('#34343c', '#2a2a32', '#08080c', 24, 13))                                                                   # Nischenwand unter dem Zifferblatt
    for px in (190, 446):                                                                                                                     # Pilaster mit Bändern
        box(px, 104, -4, 9, 6, 104, block)
        for by in (26, 78, 130, 182): box(px, by, -6, 12, 8, 3.5, block)
    for by in (0, 104, 208):                                                                                                                  # Eichenbalken mit Eisenbändern und Nieten
        box(256, by, -8, 256, 6, 5.5, wood)
        for bx in (190, 446, 62, 318):
            box(bx, by, -11, 5, 4, 7, iron)
            for d in (-1, 1): S(bx + d * 2.2, by - 3.5, -15.5, 1.0, M('#8a8a98', 0.3, 0.9)); S(bx + d * 2.2, by + 3.5, -15.5, 1.0, M('#8a8a98', 0.3, 0.9))
    for px, d in ((190, 1), (446, -1), (190, -1), (446, 1)):                                                                                  # Kopfbänder unter dem mittleren Balken
        tube((px + d * 9, 132), (px + d * 30, 110), 2.6, 2.6, M('#5a3a1c', 0.7), -7, -7, caps=False)
    for cx, ln in ((120, 58), (300, 40), (500, 70)):                                                                                          # Ketten vom oberen Balken
        for q in range(int(ln / 4)): S(cx + (0.5 if q % 2 else -0.5), 8 + q * 4, -9, 1.3, iron, 0.9, 2.2)

def run2():
    os.makedirs(CFG['out'], exist_ok=True); what = CFG.get('what') or ['cave', 'tower']; ss = CFG.get('ss', 4)
    if 'cave' in what:
        stage(512, 208, ss); lights(3.2, (1.0, 0.82, 0.62), 0.9, (0.45, 0.7, 1.0)); cave_far(); shot('cave_far')
        stage(512, 208, ss); lights(3.6, (1.0, 0.8, 0.58), 1.6, (0.4, 0.75, 1.0)); cave_pillars(); shot('cave_pillars')
    if 'tower' in what:
        stage(512, 208, ss); lights(3.4, (0.86, 0.88, 1.0), 0.5, (1.0, 0.75, 0.55)); tower_wall(); shot('tower_wall')
    print('gerendert:', what)
run2()
