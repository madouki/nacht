# Helden für NACHTMAHR in Blender: aus den Gelenken des Spiel-Rigs (HEROES.exportRig) wird je Pose eine 3D-Figur aus
# Kugeln/Ellipsoiden aufgebaut und orthografisch von der Seite gerendert (Bildfeld 34×36 Spielpixel, SS-fach überabgetastet).
# Aufruf über den Add-on-Socket: Variablen CFG = {'id', 'rig', 'out', 'ss', 'only'} vorher setzen, dann exec().
import bpy, json, math, os
from mathutils import Euler

FW, FH = 34, 36
SS = CFG.get('ss', 12)

def lin(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

def reset():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for d in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for x in list(d):
            if x.users == 0: d.remove(x)

def setup():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = FW * SS; sc.render.resolution_y = FH * SS; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    try: sc.eevee.taa_render_samples = 16
    except Exception: pass
    w = bpy.data.worlds.get('NMWorld') or bpy.data.worlds.new('NMWorld'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (0.16, 0.15, 0.24, 1); bg.inputs[1].default_value = 0.55
    cam = bpy.data.cameras.new('NMCam'); cam.type = 'ORTHO'; cam.ortho_scale = FH
    co = bpy.data.objects.new('NMCam', cam); sc.collection.objects.link(co); co.location = (0, -80, FH / 2); co.rotation_euler = (math.radians(90), 0, 0); sc.camera = co
    def sun(name, rot, energy, col):
        l = bpy.data.lights.new(name, 'SUN'); l.energy = energy; l.color = col; l.angle = math.radians(8)
        o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.rotation_euler = Euler([math.radians(a) for a in rot]); return o
    sun('Key', (52, 0, -38), 4.2, (1.0, 0.95, 0.86))     # von oben links vorn
    sun('Fill', (78, 0, 55), 0.9, (0.62, 0.72, 1.0))     # blaues Gegenlicht von rechts vorn
    sun('Rim', (-52, 0, 160), 2.6, (0.85, 0.8, 1.0))     # Kante von hinten oben

MESH = {}
def meshes():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=1); o = bpy.context.object; MESH['s'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.16, major_segments=28, minor_segments=8); o = bpy.context.object; MESH['t'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.3, major_segments=28, minor_segments=10); o = bpy.context.object; MESH['T'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=1, radius2=0, depth=2); o = bpy.context.object; MESH['k'] = o.data; bpy.ops.object.shade_smooth(); bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.mesh.primitive_cube_add(size=2); o = bpy.context.object; MESH['c'] = o.data; bpy.data.objects.remove(o, do_unlink=True)

MATS = {}
def M(hexcol, rough=0.62, dark=1.0, metal=0.0, spec=0.35):
    k = (hexcol, rough, dark, metal)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new('m' + hexcol + str(dark)); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); c = lin(hexcol)
    b.inputs['Base Color'].default_value = (c[0] * dark, c[1] * dark, c[2] * dark, 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    for nm in ('Specular IOR Level', 'Specular'):
        if nm in b.inputs: b.inputs[nm].default_value = spec; break
    MATS[k] = m; return m

POSE = []
def add(kind, px, py, y, rx, ry, rz, mat, roty=0.0, rot=None):
    o = bpy.data.objects.new('p', MESH[kind]); bpy.context.scene.collection.objects.link(o)
    o.location = (px - FW / 2, y, FH - py); o.scale = (rx, ry, rz)
    o.rotation_euler = rot if rot else (0, roty, 0)
    # Material je Objekt (das Netz wird geteilt)
    if not o.material_slots: o.data.materials.append(None)
    o.material_slots[0].link = 'OBJECT'; o.material_slots[0].material = mat
    POSE.append(o); return o
def S(px, py, y, r, mat, ry=None, rz=None, roty=0.0): return add('s', px, py, y, r, ry if ry else r, rz if rz else r, mat, roty)
def chain(a, b, y, r0, r1, mat, n=6):
    n = max(n * 3, 12)
    for i in range(n):
        t = i / (n - 1); S(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, y, r0 + (r1 - r0) * t, mat)
def clear():
    for o in POSE: bpy.data.objects.remove(o, do_unlink=True)
    POSE.clear()

# ---------------- Aussehen je Held ----------------
LOOK = {
    'henrik': dict(whip=True, skin='#f4b88c', hair='#8a4c1e', hairD='#4a240e', band='#d82434', torso='#6a3818', torsoD='#44220e', shirt=None, legs='#3a2e58', boot='#6a3a18', bootL='#8c5226',
                   bracer='#5a3014', flap='#6e3c18', sash='#c42838', trim='#f0c040', pauld='#8ca0d8', arm=1.85, leg=1.0, pony=True, bandOn=True),
    'ragnor': dict(skin='#dc945c', hair='#241c30', hairD='#0c0812', band='#c81c1c', torso='#dc945c', torsoD='#b4683c', shirt=None, legs='#dc945c', boot='#8a7860', bootL='#b4a084',
                   bracer='#9ca0c0', flap='#6c5c46', sash='#623214', trim='#8c4e22', pauld=None, arm=2.15, leg=1.0, pony=True, bandOn=True, mantle='#8a7860', sword=True, bare=True),
    'kaspar': dict(skin='#ece0cc', hair='#2c2228', hairD='#141014', band=None, torso='#5e3a44', torsoD='#3a2028', shirt='#f0e8dc', legs='#30263e', boot='#2a2430', bootL='#46404c',
                   bracer=None, flap='#5e3a44', sash='#5e3a44', trim='#f0c040', pauld=None, arm=1.6, leg=0.9, pony=False, bandOn=False, sleeve='#5e3a44', joints='#f0c040', pole=True, cravat='#a02c3c', eye='#f0a020'),
    'henrikAdv': dict(whip=True, skin='#e8a676', hair='#6c3816', hairD='#2c1408', band=None, torso='#7a4a22', torsoD='#4e2c12', shirt='#b4a47c', legs='#8c7c58', boot='#623214', bootL='#8c4e22',
                      bracer=None, flap=None, sash=None, trim='#f0c040', pauld=None, arm=1.85, leg=1.0, pony=False, bandOn=False, sleeve='#7a4a22', hat='#7a5630', hatD='#3a2410', satchel='#5a3416', kerchief='#d4ae70'),
    # ---- Gegner aus demselben Rig (HEROES.exportRig('monsters')) ----
    'ghoul': dict(head='zombie', skin='#86a65a', hair='#2c2018', hairD='#140c08', band=None, torso='#6e5238', torsoD='#4a3622', shirt=None, legs='#5a442e', boot='#86a65a', bootL='#9cba6c',
                  bracer=None, flap='#5a442e', sash=None, trim='#4a3622', pauld=None, arm=1.55, leg=0.9, pony=False, bandOn=False, belt='#3a2a1a'),
    'fish': dict(head='fish', skin='#3aa860', hair='#145c40', hairD='#0c2c24', band=None, torso='#3aa860', torsoD='#2c8c50', shirt='#d8d880', legs='#2f9856', boot='#2c8c50', bootL='#58b478',
                 bracer=None, flap=None, sash=None, trim='#2c8c50', pauld=None, arm=1.65, leg=1.0, pony=False, bandOn=False, belt='#2c8c50', fin='#d83020'),
    'knight': dict(head='helmet', skin='#b4b4d0', hair='#3c3c58', hairD='#1c1c2c', band=None, torso='#a4a4c4', torsoD='#7c7c9c', shirt=None, legs='#8c8cac', boot='#a4a4c4', bootL='#d0d0e8',
                   bracer='#f0c040', flap='#8c8cac', sash=None, trim='#f0c040', pauld='#c8c8e4', arm=2.0, leg=1.1, pony=False, bandOn=False, metal=True, shield='#2c50d0', plume='#e02818'),
    'skel': dict(head='skull', ribs=True, skin='#e8e0c8', hair='#9c9478', hairD='#3c3428', band=None, torso='#dcd4b8', torsoD='#b4a888', shirt=None, legs='#dcd4b8', boot='#dcd4b8', bootL='#f4f0e0',
                 bracer=None, flap=None, sash=None, trim='#b4a888', pauld=None, arm=1.05, leg=0.55, pony=False, bandOn=False, joints='#b4a888'),
    'sunknight': dict(head='helmet', skin='#e8b030', hair='#8c5c00', hairD='#3c2400', band=None, torso='#f4c848', torsoD='#a87010', shirt=None, legs='#c89020', boot='#f0c040', bootL='#fcf0a0',
                      bracer='#d0d0e8', flap='#d8a830', sash=None, trim='#d0d0e8', pauld='#fcd860', arm=2.0, leg=1.1, pony=False, bandOn=False, metal=True, shield='#2c50d0', plume='#fcfcfc'),
}

def monster_head(L, hc, sh, flare, fA):
    st = L['head']; skin = M(L['skin'], 0.6)
    if st == 'zombie':  # kahler, eingefallener Schädel, Augenhöhlen mit roter Glut, offener Mund, Haarsträhnen im Nacken
        S(hc[0] + 0.4, hc[1] + 0.2, 0, 4.3, skin, 4.0, 4.5); S(hc[0] + 1.6, hc[1] + 3.0, 0, 2.6, skin, 2.8, 2.0)
        S(hc[0] + 2.9, hc[1] - 0.4, -3.2, 1.25, M('#141c0c', 0.8), 0.6, 1.1); S(hc[0] + 3.0, hc[1] - 0.4, -3.7, 0.5, M('#fc3020', 0.3), 0.3, 0.5)
        S(hc[0] + 3.4, hc[1] + 2.9, -2.4, 1.2, M('#1c0808', 0.7), 0.6, 0.9)
        S(hc[0] + 4.4, hc[1] + 1.0, 0, 0.7, skin, 0.7, 0.8)
        chain((hc[0] - 3.2, hc[1] - 2.2), (hc[0] - 4.6 - flare * 0.5, hc[1] + 3.4), 0, 1.3, 0.6, M(L['hair'], 0.9), 4)
    elif st == 'fish':  # Fischkopf: Schnauze nach vorn, großes Auge, roter Flossenkamm, heller Kehlsack
        S(hc[0] + 0.6, hc[1] + 0.6, 0, 4.6, skin, 3.9, 4.1); S(hc[0] + 3.6, hc[1] + 1.8, 0, 2.9, skin, 2.9, 2.3)
        S(hc[0] + 2.4, hc[1] + 3.6, 0, 3.0, M(L['shirt'], 0.6), 2.8, 1.5)
        S(hc[0] + 2.2, hc[1] - 0.9, -3.2, 1.7, M('#fcfcf4', 0.3), 0.8, 1.7); S(hc[0] + 2.7, hc[1] - 0.9, -3.8, 0.8, M('#080808', 0.3), 0.4, 0.9)
        S(hc[0] + 5.2, hc[1] + 2.6, -1.6, 1.4, M('#0c1c14', 0.6), 0.9, 0.35)
        for i in range(4): add('k', hc[0] - 3.0 + i * 1.6, hc[1] - 3.3 - (0.5 if i in (1, 2) else 0), 0, 0.95, 0.5, 1.5, M(L['fin'], 0.5), rot=(0, math.radians(-16 + i * 5), 0))   # Kamm bleibt im Bildfeld
    elif st == 'helmet':  # Topfhelm mit Sehschlitz, Kamm und rotem Federbusch
        steel, dark = M(L['torso'], 0.3, 1, 0.8), M('#10101c', 0.6)
        S(hc[0] + 0.2, hc[1] + 0.3, 0, 4.5, steel, 4.2, 4.7); S(hc[0] + 0.6, hc[1] + 3.4, 0, 3.7, steel, 3.8, 1.6)
        S(hc[0] + 2.6, hc[1] + 0.2, -2.9, 2.4, dark, 1.6, 0.62); S(hc[0] + 3.9, hc[1] + 2.0, -1.8, 0.5, dark, 1.2, 1.5)
        S(hc[0] - 0.2, hc[1] - 4.2, 0, 3.6, M('#d0d0e8', 0.25, 1, 0.8), 0.8, 0.9)
        chain((hc[0] - 0.6, hc[1] - 5.0), (hc[0] - 5.4 - flare, hc[1] - 3.0), 0, 1.5, 0.7, M(L['plume'], 0.7), 5); chain((hc[0] - 3.0, hc[1] - 4.6), (hc[0] - 6.4 - flare, hc[1] - 0.6), 0, 1.2, 0.5, M(L['plume'], 0.7, 0.8), 4)
    elif st == 'skull':  # Schädel: Hirnschale, Jochbein, dunkle Augenhöhlen, Nasenloch, Unterkiefer mit Zahnreihe
        bone, dark = M(L['skin'], 0.5), M('#140c08', 0.8)
        S(hc[0] + 0.3, hc[1] - 0.2, 0, 4.4, bone, 4.0, 4.3); S(hc[0] + 1.7, hc[1] + 2.4, 0, 2.9, bone, 3.0, 1.9)
        S(hc[0] + 2.6, hc[1] + 0.2, -3.1, 1.45, dark, 0.7, 1.35); S(hc[0] + 4.2, hc[1] + 1.6, -1.8, 0.55, dark, 0.5, 0.75)
        S(hc[0] + 1.9, hc[1] + 4.3, 0, 2.5, bone, 2.6, 1.0); S(hc[0] + 2.7, hc[1] + 3.5, -2.3, 1.7, dark, 0.5, 0.28)
    if L.get('shield'):  # runder Schild am vorderen Arm: blau mit goldenem Rand und Buckel
        hx, hy = min(fA[4] + 0.4, FW - 4.6), max(fA[5] - 0.6, 4.6)
        S(hx, hy, -5.2, 4.3, M('#f0c040', 0.3, 1, 0.8), 0.7, 4.3); S(hx, hy, -5.6, 3.6, M(L['shield'], 0.35, 1, 0.3), 0.7, 3.6); S(hx, hy, -6.2, 1.3, M('#f0c040', 0.25, 1, 0.9), 0.9, 1.3)

def figure_torso(L, sh, hip, ang, tor, torD, legs, flare):
    S(hip[0], hip[1] - 0.3, 0, 3.15, legs, 3.9, 2.7)                                                             # Becken
    S(sh[0] * 0.3 + hip[0] * 0.7, sh[1] * 0.3 + hip[1] * 0.7, 0, 3.05, torD if not L.get('bare') else tor, 3.8, 3.4, ang)   # Bauch
    S(sh[0] * 0.66 + hip[0] * 0.34 + 0.35, sh[1] * 0.66 + hip[1] * 0.34 + 0.3, 0, 3.55, tor, 4.5, 4.4, ang)       # Brust
    if L.get('shirt'): S(sh[0] + 1.9, sh[1] + 2.6, -1.2, 1.9, M(L['shirt'], 0.7), 2.6, 3.4, ang)                   # Hemdbrust
    if L.get('bare'):                                                                                             # Brustmuskel, Gurt
        S(sh[0] + 2.2, sh[1] + 1.8, -2.0, 1.9, tor, 2.2, 1.7); chain((sh[0] - 2.6, sh[1] - 0.6), (hip[0] + 2.8, hip[1] - 3.2), -3.6, 0.7, 0.7, M('#3c1c0c', 0.6), 9)
    S(hip[0], hip[1] - 2.0, 0, 3.3, M(L.get('belt') or (L['trim'] if not L.get('bare') else '#3c1c0c'), 0.35, 1, 0.6 if not (L.get('bare') or L.get('belt')) else 0), 4.0, 0.6)   # Gürtel
    if not L.get('belt'): S(hip[0] + 3.0, hip[1] - 2.0, -2.2, 0.95, M('#f0c040', 0.25, 1, 0.9), 0.9, 0.95)                               # Schnalle
    if L.get('flap'):
        S(hip[0] - 0.4, hip[1] + 1.9, -3.5, 2.7, M(L['flap'], 0.65), 0.9, 3.3); S(hip[0] - 0.4, hip[1] + 4.9, -3.7, 2.2, M(L['trim'], 0.35, 1, 0.5), 0.6, 0.4)
    if L.get('sash'):
        sm = M(L['sash'], 0.7); chain((hip[0] + 2.4, hip[1] - 1.0), (hip[0] + 2.6 - flare * 1.1, hip[1] + 6.2 - flare * 0.5), -2.6, 1.5, 1.0, sm, 6)
    if L.get('mantle'):
        mm = M(L['mantle'], 0.9); S(sh[0] - 0.6, sh[1] - 0.2, 0, 4.4, mm, 5.4, 2.4); S(sh[0] - 3.4, sh[1] + 2.6, 0, 2.2, mm, 4.6, 3.6); S(sh[0] - 4.0 - flare * 0.6, sh[1] + 6.6, 0, 1.8, mm, 4.0, 3.0)
    if L.get('satchel'):
        S(hip[0] - 2.2, hip[1] + 1.4, -4.2, 2.3, M(L['satchel'], 0.6), 1.2, 2.1); chain((sh[0] + 2.4, sh[1] - 0.8), (hip[0] - 2.2, hip[1] - 0.4), -4.0, 0.55, 0.55, M(L['satchel'], 0.6, 0.8), 9)

def figure(r, L):
    CX = FW / 2
    lean, ty, hipY, flare = r['lean'], r['ty'], r['hipY'], r['flare']
    fL, bL, fA, bA = r['fL'], r['bL'], r['fA'], r['bA']
    sh = (CX + lean, 11.8 + ty); hip = (CX + lean * 0.3, hipY)
    mt = 0.6 if L.get('metal') else 0.0; rg = 0.32 if L.get('metal') else None   # Rüstung glänzt
    skin, skinB = M(L['skin'], rg or 0.55, 1, mt), M(L['skin'], rg or 0.55, 0.7, mt)
    legs, legsB = M(L['legs'], rg or 0.7, 1, mt), M(L['legs'], rg or 0.7, 0.68, mt)
    boot, bootB, bootL = M(L['boot'], rg or 0.5, 1, mt), M(L['boot'], rg or 0.5, 0.68, mt), M(L['bootL'], rg or 0.45, 1, mt)
    lr = L['leg']; ar = L['arm']
    sleeve = L.get('sleeve')
    armM, armMB = (M(sleeve, 0.7), M(sleeve, 0.7, 0.68)) if sleeve else (skin, skinB)

    def leg(G, y, mThigh, mBoot, back):
        chain((G[0], G[1]), (G[2], G[3]), y, 2.55 * lr, 2.0 * lr, mThigh)
        chain((G[2], G[3]), (G[4], G[5]), y, 1.95 * lr, 1.5 * lr, mBoot)
        S(G[2] + (G[4] - G[2]) * 0.12, G[3] + (G[5] - G[3]) * 0.12, y, 2.3 * lr, mBoot if back else bootL, 2.3 * lr, 1.0)   # Stulpe
        S(G[4] + 1.15, G[5] + 0.75, y, 2.45, mBoot, 1.5, 1.3)                                                           # Fuß
        if L.get('joints'): S(G[2], G[3], y - (0 if back else 0.6), 1.5, M(L['joints'], 0.3, 0.7 if back else 1, 0.8))
        if L.get('metal'): S(G[2] + 0.5, G[3], y - (0 if back else 0.9), 2.1 * lr, M(L['trim'], 0.25, 0.7 if back else 1, 0.8), 1.6, 1.9 * lr)   # Kniebuckel
    def arm(A, y, mArm, mSkin, back):
        chain((A[0], A[1]), (A[2], A[3]), y, ar, ar - 0.25, mArm)
        chain((A[2], A[3]), (A[4], A[5]), y, ar - 0.3, ar - 0.55, mArm)
        if L.get('bracer'):
            a = (A[2] + (A[4] - A[2]) * 0.38, A[3] + (A[5] - A[3]) * 0.38); b = (A[2] + (A[4] - A[2]) * 0.86, A[3] + (A[5] - A[3]) * 0.86)
            chain(a, b, y, ar - 0.12, ar - 0.3, M(L['bracer'], 0.4, 0.7 if back else 1, 0.5 if L['bracer'].startswith('#9') else 0), 4)
        S(A[4], A[5], y, max(1.2, ar * 0.74), mSkin)
        if L.get('joints'): S(A[2], A[3], y - (0 if back else 0.5), 1.2, M(L['joints'], 0.3, 0.7 if back else 1, 0.8))

    # ---- hinten: Waffe auf dem Rücken, hinterer Arm, hinteres Bein ----
    if L.get('sword'):
        chain((CX - 6 + lean, 7 + ty), (CX + 3 + lean, 22 + ty), 4.6, 1.0, 0.9, M('#a4a4c4', 0.25, 0.9, 0.9), 12)
        chain((CX - 7.2 + lean, 4.8 + ty), (CX - 5.8 + lean, 7.6 + ty), 4.6, 0.9, 0.9, M('#623214', 0.6), 3)
        chain((CX - 7.8 + lean, 9.4 + ty), (CX - 3.8 + lean, 7.4 + ty), 4.6, 0.75, 0.75, M('#f0c040', 0.3, 1, 0.8), 4)
    if L.get('pole'):
        chain((CX - 7 + lean, 26 + ty), (CX + 5 + lean, -2 + ty), 4.6, 0.7, 0.7, M('#8c5a2c', 0.6), 16)
        S(CX + 6.4 + lean, 2.4 + ty, 4.6, 3.0, M('#a4a4c4', 0.25, 1, 0.9), 0.5, 2.6, math.radians(-12))
        chain((CX + 5 + lean, -2 + ty), (CX + 6.2 + lean, -6 + ty), 4.6, 0.8, 0.25, M('#e8e8f8', 0.2, 1, 0.9), 4)
    arm(bA, 3.5, armMB, skinB, True)
    leg(bL, 1.8, legsB, bootB, True)
    # ---- Rumpf ----
    tor, torD = M(L['torso'], rg or 0.6, 1, mt), M(L['torsoD'], rg or 0.6, 1, mt)
    ang = math.atan2(sh[0] - hip[0], hip[1] - sh[1])
    if L.get('ribs'):  # Skelett: Wirbelsäule, vier Rippenbögen, Becken, Schlüsselbein
        chain(hip, (sh[0], sh[1] - 1.5), 0, 0.95, 0.85, torD, 6)
        for i in range(4):
            t = 0.42 + i * 0.16; S(hip[0] + (sh[0] - hip[0]) * t + 0.5, hip[1] + (sh[1] - hip[1]) * t, 0, 3.3 - i * 0.25, tor, 3.6 - i * 0.2, 0.55, ang)
        S(hip[0], hip[1] - 0.4, 0, 2.7, tor, 3.3, 1.35); S(sh[0], sh[1] - 0.2, 0, 3.4, tor, 4.0, 0.6)
    else:
        figure_torso(L, sh, hip, ang, tor, torD, legs, flare)
    # ---- vorn: Bein, Arm ----
    leg(fL, -1.8, legs, boot, False)
    if L.get('pauld'): S(fA[0] - 0.1, fA[1] - 0.5, -3.7, 2.45, M(L['pauld'], 0.3, 1, 0.6), 2.3, 2.1)
    arm(fA, -3.6, armM, skin, False)
    if r.get('coil') and L.get('whip'): add('T', fA[4] + 0.6, fA[5] + 1.9, -4.6, 1.9, 1.9, 1.9, M('#c88a48', 0.5), rot=(math.radians(90), 0, 0))
    # ---- Hals und Kopf ----
    hc = (CX + lean - 0.2, ty + 5.2)
    S(sh[0] + 0.4, sh[1] - 1.9, 0, 1.6, skin, 1.7, 1.9)
    if L.get('cravat'): S(sh[0] + 1.3, sh[1] - 0.6, -1.4, 1.5, M(L['cravat'], 0.6), 1.6, 1.3); chain((sh[0] + 0.4, sh[1] - 0.6), (sh[0] - 3.0 - flare, sh[1] + 1.2), 3.0, 1.0, 0.6, M(L['cravat'], 0.6), 4)
    if L.get('kerchief'): S(sh[0] + 0.8, sh[1] - 0.9, 0, 2.3, M(L['kerchief'], 0.7), 2.5, 1.2); chain((sh[0] - 1.4, sh[1] - 0.8), (sh[0] - 4.4 - flare, sh[1] + 0.6), 0, 1.0, 0.5, M(L['kerchief'], 0.7), 4)
    if L.get('head'): monster_head(L, hc, sh, flare, fA); return
    hair, hairD = M(L['hair'], 0.5, 1, 0, 0.5), M(L['hairD'], 0.5)
    S(hc[0] + 1.0, hc[1] + 0.9, 0, 3.9, skin, 3.9, 4.0)                               # Gesicht
    S(hc[0] + 1.3, hc[1] + 2.9, 0, 2.6, skin, 2.9, 1.9)                               # Kinn
    S(hc[0] + 4.3, hc[1] + 1.0, 0, 0.75, skin, 0.7, 0.8)                              # Nase
    S(hc[0] - 0.5, hc[1] + 1.0, -3.6, 0.95, skin, 0.5, 1.15)                          # Ohr
    if L.get('hat'):
        S(hc[0] - 0.8, hc[1] - 0.6, 0, 4.3, hair, 4.2, 3.9)                           # Haar unter dem Hut
        S(hc[0], hc[1] - 2.9, 0, 6.6, M(L['hat'], 0.8), 6.4, 0.85, math.radians(5))   # Krempe
        S(hc[0] - 0.2, hc[1] - 4.6, 0, 3.6, M(L['hat'], 0.8), 3.7, 2.6); S(hc[0] - 0.1, hc[1] - 3.5, 0, 3.75, M(L['hatD'], 0.6), 3.85, 0.7)
    else:
        S(hc[0] - 1.3, hc[1] - 1.2, 0, 4.3, hair, 4.3, 4.2)                           # Haarschopf
        S(hc[0] - 2.6, hc[1] + 1.6, 0, 2.6, hairD, 3.6, 3.2)                          # Nacken
        S(hc[0] + 1.6, hc[1] - 3.3, 0, 2.2, hair, 3.4, 1.3, math.radians(18))         # Stirnlocke
    if L.get('bandOn'):
        add('t', hc[0] - 0.2, hc[1] - 1.9, 0, 4.5, 4.4, 4.2, M(L['band'], 0.55), roty=math.radians(-8))
        for dy in (0, 1.2): chain((hc[0] - 4.4, hc[1] - 1.6 + dy * 0.3), (hc[0] - 8.4 - flare * 0.8, hc[1] + 0.2 + dy - flare * 0.5), 0.8 - dy, 0.7, 0.4, M(L['band'], 0.55), 5)
    if L.get('pony'):
        chain((hc[0] - 3.8, hc[1] + 2.4), (hc[0] - 6.0 - flare * 1.2, hc[1] + 9.2 - flare * 1.3), 0.6, 1.75, 0.9, hair, 7)

def run():
    reset(); setup(); meshes()
    rig = json.load(open(CFG['rig'])); L = LOOK[CFG['id']]; out = CFG['out']; os.makedirs(out, exist_ok=True)
    only = CFG.get('only'); n = 0
    for r in rig:
        if only and r['key'] not in only: continue
        if CFG.get('rid') and (r.get('id') != CFG['rid'] or r.get('S', 1) != CFG.get('S', 1)): continue
        clear(); figure(r, L)
        bpy.context.scene.render.filepath = os.path.join(out, r['key'] + '.png'); bpy.ops.render.render(write_still=True); n += 1
    clear(); print('gerendert', n)
run()
