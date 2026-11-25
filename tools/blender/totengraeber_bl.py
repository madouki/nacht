# Totengräber Theobald (Zwischengegner im Gruftgang, js/totengraeber.js): ein Skelett im fadenscheinigen Gehrock mit Zylinder
# (weinrotes Hutband), Stiefeln, Laterne am Haken und einer rostigen Schaufel; in den Augenhöhlen glimmt es grünlich.
# Blick nach rechts (das Spiel spiegelt). Bildfeld 48×64, Füße unten.
# Posen: idle0, idle1 (Laterne schwingt, Kiefer klappert), dig (vorgebeugt, Schaufel im Boden), swing (Schaufel über dem Kopf),
#        laugh (Kopf in den Nacken, Kiefer offen, Hand am Bauch)
# Aufruf: python bl.py totengraeber_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_totengraeber", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def theobald(pose):
    BONE, BONE2, DARK = M('#e6dcc4', 0.55, 0, 0, 0.35), M('#b4a888', 0.65), M('#0e0a10', 0.9)
    COAT, COAT2, HAT, BAND = M('#3e3450', 0.85, 0, 0, 0.25, 0.5), M('#564668', 0.8, 0, 0, 0.25, 0.5), M('#1a161e', 0.6, 0, 0, 0.3, 0.3), M('#7c1c30', 0.7, 0, 0, 0.3, 0.4)
    WOOD, IRON, RUST, BOOT, BRASS = M('#6c4a2c', 0.6), M('#787880', 0.4, 0.75), M('#8c4a2c', 0.8, 0.3), M('#2c1c14', 0.7), M('#c89838', 0.3, 0.85)
    GLOW, LANT = M('#7cffb0', 0.2, 0, 3.2), M('#ffc860', 0.2, 0, 3.0)
    lean = {'dig': 7.0, 'swing': -2.0, 'laugh': -2.5}.get(pose, 0.0)
    hx, hy = 24 + lean, 14 + (5 if pose == 'dig' else 0) + (-1 if pose == 'laugh' else 0)
    sh = (hx - 2.5, hy + 9)                                                    # Schulter
    # Beine und Stiefel
    tube((21, 46), (20, 61), 1.3, 1.1, BONE2, 0.5); tube((27, 46), (28, 61), 1.3, 1.1, BONE2, -0.5)
    S(20.5, 61.8, 0.5, 3.2, BOOT, 2.4, 1.8); S(29.0, 61.8, -0.5, 3.2, BOOT, 2.4, 1.8)
    # Gehrock: Kegel von den Schultern zum Saum, Schöße hinten, Knopfleiste
    tube((sh[0] + 1, sh[1] - 1), (24, 46), 4.8, 6.2, COAT, 0.0)
    tube((20, 38), (14, 53), 2.6, 1.2, COAT2, 2.5); tube((22, 38), (17, 54), 2.3, 1.0, COAT2, 3.5)   # Rockschöße
    for k in range(4): S(sh[0] + 3.6 - k * 0.6, sh[1] + 2 + k * 5, -5.2 - k * 0.6, 0.65, BRASS)
    bx0, by0 = sh[0] + 2.2, sh[1] + 1.2                                        # Ringelblume im Knopfloch
    for k in range(7): a = k / 7 * math.tau; S(bx0 + math.cos(a) * 1.1, by0 + math.sin(a) * 1.1, -6.0, 0.75, M('#f89820', 0.6) if k % 2 else M('#fcc040', 0.6))
    S(bx0, by0, -6.5, 0.6, M('#c86010', 0.7))
    tube((sh[0] - 1, sh[1] - 1), (sh[0] + 4, sh[1] + 1), 2.2, 1.6, COAT2, -1.0)                   # Kragen
    # Hals und Schädel
    tube((hx - 1.5, hy + 5), (sh[0] + 1, sh[1]), 1.1, 1.3, BONE2, -0.5)
    S(hx, hy, -0.5, 5.2, BONE, 4.8, 5.6)
    jaw = 2.4 if pose == 'laugh' else (0.8 if pose == 'idle1' else 0.0)
    S(hx + 1.2, hy + 5.0 + jaw, -0.5, 3.6, BONE2, 3.4, 1.6)
    for k in range(5): box(hx - 0.8 + k * 1.1, hy + 3.6, hx - 0.1 + k * 1.1, hy + 4.6, BONE, -4.8, -4.2)   # Zähne oben
    if jaw > 1:
        for k in range(4): box(hx - 0.2 + k * 1.1, hy + 3.9 + jaw, hx + 0.5 + k * 1.1, hy + 4.8 + jaw, BONE, -4.6, -4.0)
    for ex in (hx + 0.4, hx + 3.2):                                            # Augenhöhlen mit Glimmen
        S(ex, hy - 0.4, -4.4, 1.5, DARK, 0.7, 1.7); S(ex + 0.2, hy - 0.3, -5.0, 0.45, GLOW)
    S(hx + 4.0, hy + 2.0, -4.2, 0.7, DARK, 0.5, 0.9)                           # Nasenloch
    TEAL, PINK, YEL, ORA, ORA2 = M('#20c8c0', 0.4), M('#f050a0', 0.4), M('#f8d020', 0.4), M('#f89820', 0.6), M('#fcc040', 0.6)
    for ex in (hx + 0.4, hx + 3.2):                                            # Calaca: Blütenringe um die Augenhöhlen
        for k in range(10): a = k / 10 * math.tau; S(ex + math.cos(a) * 2.1, hy - 0.4 + math.sin(a) * 2.3, -4.9, 0.42, TEAL if k % 2 else PINK)
    S(hx + 1.8, hy - 4.0, -4.6, 0.7, YEL)                                      # Stirnblume
    for k in range(6): a = k / 6 * math.tau; S(hx + 1.8 + math.cos(a) * 1.2, hy - 4.0 + math.sin(a) * 1.1, -4.5, 0.55, PINK)
    for k in range(4): a = 0.5 + k * 0.45; S(hx - 2.6 + math.cos(a) * 1.6, hy + 2.2 + math.sin(a) * 1.4, -4.0, 0.36, TEAL)   # Wangenschnörkel
    for k in range(6): S(hx - 0.3 + k * 1.0, hy + 4.4, -4.9, 0.24, DARK, 0.2, 0.7)   # Nähte über dem Mund
    # Zylinder mit Hutband (beim Lachen nach hinten gekippt)
    tilt = -0.35 if pose == 'laugh' else (0.2 if pose == 'dig' else 0.0)
    bxh, byh = hx - 0.5, hy - 5.2
    S(bxh, byh, -0.5, 7.2, HAT, 6.6, 0.9, (0, tilt, 0))
    top = (bxh - 9.5 * math.sin(tilt) * -1, byh - 9.5 * math.cos(tilt))
    tube((bxh, byh), top, 4.2, 4.6, HAT, -0.5)
    tube((bxh + 0.6 * math.sin(-tilt), byh - 1.4), (bxh + 1.2 * math.sin(-tilt), byh - 3.0), 4.4, 4.5, BAND, -0.5, caps=False)
    fx, fy = bxh + 3.6, byh - 2.2                                              # Ringelblume am Hutband
    for k in range(9): a = k / 9 * math.tau; S(fx + math.cos(a) * 1.5, fy + math.sin(a) * 1.5, -4.6, 0.95, ORA if k % 2 else ORA2)
    S(fx, fy, -5.2, 0.9, M('#c86010', 0.7))
    # Arme, Schaufel, Laterne je Pose
    if pose == 'dig': grip, blade, lh = (hx + 9, hy + 22), (44, 59), (hx + 4, hy + 18)
    elif pose == 'swing': grip, blade, lh = (hx + 5, hy - 3), (hx - 9, hy - 11), (hx - 1, hy - 1)
    elif pose == 'laugh': grip, blade, lh = (35, 34), (39, 59), (hx + 2, sh[1] + 9)
    else: grip, blade, lh = (35, 33 + (1 if pose == 'idle1' else 0)), (37, 59), (14, 38)
    def arm(s0, hand, d, out=1.0):
        mx, my = (s0[0] + hand[0]) / 2 + out * 2.0, (s0[1] + hand[1]) / 2 + 1.5
        tube(s0, (mx, my), 1.6, 1.2, COAT2, d); tube((mx, my), hand, 1.0, 0.8, BONE2, d); S(hand[0], hand[1], d, 1.4, BONE)
    arm((sh[0] + 1.5, sh[1]), grip, -5.0)                                      # vorderer Arm an der Schaufel
    if pose == 'swing': arm((sh[0] - 2.5, sh[1]), (grip[0] - 2, grip[1] + 3), 3.5, -1.0)
    elif pose == 'dig': arm((sh[0] - 2.5, sh[1]), lh, 3.5)
    else: arm((sh[0] - 2.5, sh[1]), lh, 3.5, -1.0)
    # Schaufel: Stiel, Griff, rostiges Blatt in Stielrichtung
    tube(grip, blade, 0.75, 0.75, WOOD, -6.0)
    gx, gy = grip[0] - (blade[0] - grip[0]) * 0.12, grip[1] - (blade[1] - grip[1]) * 0.12
    tube((gx - 1.6, gy), (gx + 1.6, gy), 0.6, 0.6, WOOD, -6.0)
    ang = math.atan2(blade[0] - grip[0], blade[1] - grip[1])
    S(blade[0], blade[1], -6.0, 2.9, IRON, 0.7, 4.2, (0, -ang, 0)); S(blade[0] + 0.6, blade[1] + 1.2, -6.8, 1.4, RUST, 0.3, 1.6, (0, -ang, 0))
    # Laterne am Haken (nicht beim Ausholen: dann hängt sie am Gürtel)
    lx, ly = (lh[0], lh[1] + 4) if pose not in ('swing', 'laugh', 'dig') else (hx - 7, sh[1] + 16)
    tube((lx, ly - 4), (lx, ly - 2), 0.3, 0.3, IRON, 2.0)
    box(lx - 2.2, ly - 2.2, lx + 2.2, ly + 3.4, IRON, 1.0, 3.0); S(lx, ly + 0.6, 2.0, 1.7, LANT, 1.2, 2.2)
    L = bpy.data.lights.new('lantL', 'POINT'); L.energy = 140; L.color = (1.0, 0.75, 0.4); L.shadow_soft_size = 2
    o = bpy.data.objects.new('lantL', L); bpy.context.scene.collection.objects.link(o); o.location = (lx - FW / 2, -6, FH - ly); OBJ.append(o)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('idle0', 'idle1', 'dig', 'swing', 'laugh'):
    name = 'theo_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(48, 64); theobald(pose); shot(name)
print('ok')
