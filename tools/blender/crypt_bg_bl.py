# Hintergrund „Gruft“ für NACHTMAHR in Blender: eine Arkadenwand aus Quadern (512×208, nahtlos kachelbar) mit vier Jochen –
# Beinhaus-Regale, offener Bogen (durchsichtig, dahinter die ferne Ebene), Sarkophag, Eisengitter – und eine ferne Ebene
# (Arkaden in halber Größe, zwei Geschosse). Orthografische Kamera, damit die Bilder nahtlos kacheln.
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'what': ['wall', 'far']}.
import bpy, bmesh, math, os, random
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))

def stage(w, h, ss):
    global FW, FH, SS
    FW, FH, SS = w, h, ss
    MATS.clear(); MESH.clear(); OBJ.clear()
    reset(); setup(); meshes()
    bpy.ops.mesh.primitive_cube_add(size=2); o = bpy.context.object; MESH['b'] = o.data; bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)
    for o in bpy.data.objects:   # Gruftlicht: kühles Hauptlicht von links oben, blaue Aufhellung, kein roter Schein
        if o.type != 'LIGHT': continue
        if o.name == 'Key': o.data.energy = 3.4; o.data.color = (0.78, 0.84, 1.0); o.data.angle = math.radians(3)
        elif o.name == 'Fill': o.data.energy = 0.4; o.data.color = (0.4, 0.5, 1.0)
        else: o.data.energy = 0.0
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()
    for l in [o for o in bpy.data.objects if o.type == 'LIGHT' and o.name.startswith('Glow')]: bpy.data.objects.remove(l, do_unlink=True)

def BR(c1, c2, cm, bw, bh, rough=0.9, bump=0.7, mortar=0.8):  # Quadermauerwerk: Ziegeltextur über die Weltposition, Fugen vertieft
    k = ('br', c1, c2, cm, bw, bh)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new('brick'); m.use_nodes = True; m.use_backface_culling = False
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    geo = nt.nodes.new('ShaderNodeNewGeometry'); mp = nt.nodes.new('ShaderNodeMapping'); br = nt.nodes.new('ShaderNodeTexBrick')
    mp.inputs['Rotation'].default_value = (math.radians(90), 0, 0)
    nt.links.new(geo.outputs['Position'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    br.inputs['Color1'].default_value = lin(c1); br.inputs['Color2'].default_value = lin(c2); br.inputs['Mortar'].default_value = lin(cm)
    br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = mortar; br.inputs['Brick Width'].default_value = bw; br.inputs['Row Height'].default_value = bh
    for nm, v in (('Mortar Smooth', 0.2), ('Bias', 0.0)):
        if nm in br.inputs: br.inputs[nm].default_value = v
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; nt.links.new(br.outputs['Fac'], inv.inputs[1])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump; bp.inputs['Distance'].default_value = 1.2
    nt.links.new(inv.outputs[0], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = rough
    MATS[k] = m; return m

def box(px, py, y, hx, hy, hz, mat, rot=(0, 0, 0)): return add('b', px, py, y, hx, hy, hz, mat, rot)   # hx/hz: halbe Breite/Höhe (px), hy: halbe Tiefe
def mask(holes, mat, y=0.0, q=2):  # Wandfläche mit ausgesparten Öffnungen (Raster q px)
    bm = bmesh.new(); vs = {}
    def v(ix, iy):
        if (ix, iy) not in vs: vs[(ix, iy)] = bm.verts.new((ix * q - FW / 2, y, FH - iy * q))
        return vs[(ix, iy)]
    for iy in range(FH // q):
        for ix in range(FW // q):
            cx, cy = (ix + 0.5) * q, (iy + 0.5) * q
            if any(h(cx, cy) for h in holes): continue
            bm.faces.new((v(ix, iy + 1), v(ix + 1, iy + 1), v(ix + 1, iy), v(ix, iy)))
    me = bpy.data.meshes.new('mask'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('mask', me); bpy.context.scene.collection.objects.link(o); me.materials.append(mat); OBJ.append(o)
def glow(px, py, y, watts, col=(1.0, 0.62, 0.3), r=4.0):  # warmes Punktlicht (Kerzenschein in den Nischen)
    l = bpy.data.lights.new('Glow', 'POINT'); l.energy = watts; l.color = col; l.shadow_soft_size = r
    o = bpy.data.objects.new('Glow', l); bpy.context.scene.collection.objects.link(o); o.location = (px - FW / 2, y, FH - py)

def skull(px, py, y, s, bone, dark):
    S(px, py, y, 3.3 * s, bone, 3.0 * s, 3.1 * s); S(px, py + 2.6 * s, y - 0.4, 2.2 * s, bone, 2.2 * s, 1.5 * s)
    for d in (-1, 1): S(px + d * 1.35 * s, py + 0.3 * s, y - 2.6 * s, 0.95 * s, dark, 0.6, 1.05 * s)
    S(px, py + 1.9 * s, y - 2.7 * s, 0.45 * s, dark, 0.4, 0.6 * s)

def arcade(x0, w, base, k, kinds, deep=True):
    # Joche der Breite bw ab x0; base = Fußlinie (py), k = Maßstab. kinds: je Joch 'bones' | 'open' | 'tomb' | 'gate' | 'dark'
    wall = BR('#39405c', '#2b3148', '#07080f', 16 * k, 8 * k)
    block = BR('#666c88', '#555b76', '#12141f', 14 * k, 10 * k, bump=0.9)
    dstone = BR('#242a40', '#1c2134', '#05060b', 16 * k, 8 * k)
    vs1, vs2 = M('#6e7490', 0.85), M('#5a607a', 0.85)
    bone, dark, iron, gold = M('#cfc8b0', 0.6), M('#06060e', 0.9), M('#2a2c3c', 0.45, 0.7), M('#b08a30', 0.35, 0.8)
    bw = 128 * k; n = len(kinds); top = base - 196 * k; cy = top + 92 * k; R = 50 * k
    holes = []
    for i in range(n):
        c = x0 + (i + 0.5) * bw
        holes.append(lambda x, y, c=c: (y >= cy and y < base and abs(x - c) < R) or (y < cy and (x - c) ** 2 + (y - cy) ** 2 < R * R))
    # nur der eigene Streifen der Arkade gehört zur Wand (für gestapelte Geschosse)
    band = lambda x, y: not (top <= y < base + 12 * k and x0 <= x < x0 + n * bw)
    mask(holes + [band], wall, 0.0, 2)
    box(x0 + n * bw / 2, top + 9 * k, -5, n * bw / 2, 6, 5 * k, block)                                  # Gesims
    for j in range(int(n * bw / (16 * k)) + 1): box(x0 + j * 16 * k, top + 17 * k, -4, 3 * k, 5, 2.5 * k, block)   # Zahnschnitt
    box(x0 + n * bw / 2, base + 6 * k, -6, n * bw / 2, 8, 6 * k, block)                                # Sockelband
    for i in range(n + 1):                                                                              # Pfeiler mit Kämpfer und Basis
        px = x0 + i * bw
        box(px, (cy + base) / 2, -4, 13 * k, 6, (base - cy) / 2, block)
        box(px, cy - 2 * k, -6, 17 * k, 8, 4 * k, block); box(px, cy + 4 * k, -5, 15 * k, 7, 2 * k, dstone)
        box(px, base - 5 * k, -6, 16 * k, 8, 5 * k, block)
        box(px, (top + 20 * k + cy - 6 * k) / 2, -3, 9 * k, 4, (cy - 6 * k - top - 20 * k) / 2, block)   # Lisene bis zum Gesims
    for i in range(n):
        c = x0 + (i + 0.5) * bw; kind = kinds[i]
        N = 13
        for j in range(N):                                                                              # Bogensteine, Schlussstein größer
            th = math.pi * (j + 0.5) / N; key = j == N // 2
            box(c + math.cos(th) * 55 * k, cy - math.sin(th) * 55 * k, -3 - (2 if key else 0), 5.7 * k, 5 + (2 if key else 0), (6.6 if key else 5) * k, vs1 if j % 2 == 0 else vs2, (0, math.radians(90) - th, 0))
        if kind == 'open': continue
        if deep: box(c, (top + 40 * k + base) / 2, 30, R + 2, 1, (base - top - 40 * k) / 2 + 2, dstone)   # Rückwand der Nische
        if kind == 'dark': continue
        if kind == 'bones':                                                                             # Beinhaus: drei Regale voller Schädel
            for r, sy in enumerate((cy + 14 * k, cy + 44 * k, cy + 74 * k)):
                box(c, sy + 6 * k, 22, R - 3 * k, 7, 1.6 * k, block)
                for q in range(9):
                    random.seed(i * 100 + r * 10 + q)
                    skull(c - 40 * k + q * 10 * k + random.uniform(-1, 1) * k, sy - random.uniform(0, 1.5) * k, 20 + random.uniform(-2, 2), k * random.uniform(0.9, 1.1), bone, dark)
            for q in range(5): skull(c - 22 * k + q * 11 * k, cy - 14 * k - (5 * k if q in (1, 3) else 0) - (9 * k if q == 2 else 0), 22, k, bone, dark)
            box(c, cy - 8 * k, 22, 30 * k, 7, 1.6 * k, block)
            glow(c - 30 * k, cy + 30 * k, 8, 60000 * k * k); glow(c + 26 * k, cy + 64 * k, 8, 40000 * k * k)
        elif kind == 'tomb':                                                                            # Sarkophag auf einem Podest, Kreuz auf dem Deckel, Kerzen
            box(c, base - 8 * k, 14, 42 * k, 12, 5 * k, block)
            box(c, base - 26 * k, 14, 36 * k, 10, 13 * k, M('#5a6488', 0.55)); box(c, base - 42 * k, 13, 39 * k, 11, 3.5 * k, M('#6c78a0', 0.5))
            box(c, base - 26 * k, 3, 2.2 * k, 1.5, 9 * k, gold); box(c, base - 30 * k, 3, 6.5 * k, 1.5, 2.2 * k, gold)
            for d in (-1, 1):
                tube((c + d * 30 * k, base - 46 * k), (c + d * 30 * k, base - 58 * k), 1.3 * k, 1.3 * k, M('#e8e0c8', 0.5, 0, 0.3), 12, 12, caps=False)
                S(c + d * 30 * k, base - 61 * k, 12, 1.5 * k, M('#ffc860', 0.4, 0, 4.0), 1.2 * k, 2.4 * k)
            glow(c, base - 66 * k, 2, 90000 * k * k)
            for q in range(3): skull(c - 9 * k + q * 9 * k, cy - 6 * k, 24, k * 1.1, bone, dark)                    # Schädel in einer Wandnische darüber
            box(c, cy + 0.5 * k, 24, 18 * k, 5, 1.5 * k, block)
        elif kind == 'gate':                                                                            # Eisengitter vor der Finsternis, Kette mit Ring
            for q in range(9): tube((c - 40 * k + q * 10 * k, cy - (R * R - (q * 10 * k - 40 * k) ** 2) ** 0.5 if abs(q * 10 * k - 40 * k) < R else cy), (c - 40 * k + q * 10 * k, base), 1.3 * k, 1.3 * k, iron, 6, 6, caps=False)
            for sy in (cy + 6 * k, cy + 56 * k): box(c, sy, 5, R - 2 * k, 1.5, 1.8 * k, iron)
            box(c + 2 * k, cy + 34 * k, 3, 5 * k, 2, 6 * k, iron); S(c + 2 * k, cy + 36 * k, 0.5, 1.6 * k, gold)   # Schloss
            glow(c, cy + 20 * k, 22, 25000 * k * k, (0.35, 0.5, 1.0))

def run():
    os.makedirs(CFG['out'], exist_ok=True); what = CFG.get('what') or ['wall', 'far']
    if 'wall' in what:
        stage(512, 208, CFG.get('ss', 4))
        arcade(0, 512, 196, 1.0, ['bones', 'open', 'tomb', 'gate'])
        shot('crypt_wall')
    if 'far' in what:   # halbe Größe, zwei Geschosse, alle Bögen dunkel – wird nachher eingenebelt
        stage(512, 208, CFG.get('ss', 4))
        for row in range(2): arcade(0, 512, 98 + row * 104, 0.5, ['dark'] * 8, deep=False)
        shot('crypt_far')
    print('gerendert:', what)
run()
