# Pförtner Granitus (Palastwächter im Moorpalast, js/waechter.js): ein lebendig gewordener Steinritter – moosige Granitrüstung mit
# Rissen, Helm mit glühendem Sehschlitz und Moosbusch, Rundschild mit Mondsichel am vorderen Arm, Hellebarde in der hinteren Hand.
# Hält er den Schild oben, sticht er unten zu, und umgekehrt. Blick nach rechts (das Spiel spiegelt). Bildfeld 64×80, Füße unten.
# Posen: high0/high1 (Schild oben), low0/low1 (Schild unten), thrustL (Schild oben, Stich unten), thrustH (Schild unten, Stich
#        oben), leap (Sprung, Hellebarde über dem Kopf), slam (Hellebarde in den Boden gerammt)
# Aufruf: python bl.py waechter_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_waechter", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def granitus(pose):
    STONE, STONE2, CRACK = M('#6a6872', 0.9, 0, 0, 0.2), M('#4c4a54', 0.92, 0, 0, 0.15), M('#1c1a20', 0.95)
    MOSS, MOSS2 = M('#3e6a2a', 0.9, 0, 0, 0.2, 0.5), M('#5e8a30', 0.9, 0, 0, 0.2, 0.5)
    IRON, WOOD, GOLD = M('#6c6c78', 0.35, 0.8), M('#4a3220', 0.7), M('#c8a040', 0.3, 0.85)
    GLOW = M('#ffb040', 0.2, 0, 4.0)
    bob = 1.0 if pose.endswith('1') else 0.0
    crouch = 6.0 if pose == 'leap' else 3.0 if pose == 'slam' else 0.0
    lean = 4.0 if pose in ('thrustL', 'thrustH', 'slam') else 0.0
    cx, top = 30.0 + lean, 6.0 + bob + crouch
    # Beine mit Beinschienen, Kniekacheln, Eisenschuhe
    hip = top + 46
    for (x0, x1, d) in ((cx - 3.5, cx - 6.0 - (2 if crouch else 0), 2.0), (cx + 3.5, cx + 7.0 + (3 if crouch else 0), -2.0)):
        kx, ky = (x0 + x1) / 2 + (2.5 if crouch else 0), (hip + 77) / 2 - crouch * 0.4
        tube((x0, hip), (kx, ky), 4.0, 3.6, STONE2, d); tube((kx, ky), (x1, 75.5), 3.6, 3.0, STONE, d)
        S(kx + 0.8, ky, d - 2.6, 2.4, STONE, 2.0, 2.2); S(x1 + 1.2, 77.6, d, 4.4, IRON, 2.8, 2.2)
        S(x1 - 0.5, ky + 8, d - 2.8, 0.9, MOSS, 0.5, 2.4)                            # Moos an der Schiene
    # Schurz aus Steinplatten, Gürtel
    tube((cx, top + 38), (cx, hip + 4), 8.2, 9.8, STONE2, 0.0)
    for k in range(4): box(cx - 8 + k * 4.2, hip - 2, cx - 5 + k * 4.2, hip + 5.5, STONE, -10.4, -9.4)
    box(cx - 9, top + 37, cx + 9.5, top + 40, IRON, -9.8, 9.8); S(cx + 6, top + 38.5, -10.2, 1.5, GOLD, 0.6, 1.4)
    # Brustpanzer mit Riss, Moos auf der Schulter
    S(cx, top + 28, 0.0, 10.0, STONE, 9.0, 11.5)
    tube((cx + 2, top + 22), (cx + 5, top + 33), 0.35, 0.3, CRACK, -9.6); tube((cx + 5, top + 33), (cx + 3, top + 37), 0.3, 0.25, CRACK, -9.4)
    for k in range(5): S(cx - 6 + k * 2.4, top + 17.5 + (k % 2), -4.0, 1.8, MOSS if k % 2 else MOSS2, 1.4, 1.2)
    for (mx, my, mr) in ((cx - 4, top + 31, 2.2), (cx + 3, top + 26, 1.6), (cx - 1, top + 36, 1.8)): S(mx, my, -9.2, mr, MOSS, 0.8, mr * 0.8)
    tube((cx - 6, top + 25), (cx - 3, top + 29), 0.3, 0.25, CRACK, -9.4)
    S(cx - 8, top + 20, 3.0, 5.4, STONE2, 5.0, 4.4)                                   # hintere Schulter
    S(cx + 8, top + 20, -3.0, 5.8, STONE, 5.2, 4.8); S(cx + 9, top + 17, -5.5, 2.4, MOSS2, 1.6, 1.2)
    # Helm: Topfhelm mit Sehschlitz, Wangenplatten, Moosbusch obenauf
    hx, hy = cx + 1.5, top + 8
    S(hx, hy, 0.0, 6.6, STONE, 6.2, 7.6); box(hx - 6.0, hy + 3.5, hx + 6.6, hy + 7.0, STONE2, -6.4, 6.4)
    box(hx + 1.0, hy - 0.8, hx + 6.8, hy + 1.0, CRACK, -6.9, -2.0); box(hx + 1.6, hy - 0.4, hx + 6.4, hy + 0.6, GLOW, -7.0, -2.4)   # glühender Sehschlitz
    box(hx + 3.0, hy + 1.0, hx + 4.0, hy + 6.0, CRACK, -7.0, -6.0)                       # Atemschlitz
    for k in range(7): a = math.pi * (0.15 + 0.7 * k / 6); S(hx - math.cos(a) * 4.5, hy - 6.5 - math.sin(a) * 2.5, 0.0, 1.8, MOSS if k % 2 else MOSS2, 1.8, 1.6)
    L = bpy.data.lights.new('eyeL', 'POINT'); L.energy = 60; L.color = (1.0, 0.7, 0.3); L.shadow_soft_size = 1
    o = bpy.data.objects.new('eyeL', L); bpy.context.scene.collection.objects.link(o); o.location = (hx + 5 - FW / 2, -9, FH - hy); OBJ.append(o)
    # Schild am vorderen Arm: oben oder unten
    low = pose in ('low0', 'low1', 'thrustH')
    sh = (cx + 8, top + 21)
    if pose in ('leap', 'slam'): sy, sx = top + 30, cx + 9
    else: sy, sx = (top + 49 if low else top + 22), cx + 12
    el = (cx + 10, (sh[1] + sy) / 2 + 3)
    tube(sh, el, 2.8, 2.4, STONE2, -5.0); tube(el, (sx - 1, sy), 2.4, 2.2, STONE, -6.0)
    S(sx + 1.5, sy, -8.0, 5.8, STONE2, 2.4, 11.0); S(sx + 2.4, sy, -9.6, 5.0, STONE, 1.6, 10.0)
    for k in range(12): a = k / 12 * math.tau; S(sx + 2.6 + math.cos(a) * 4.6, sy + math.sin(a) * 9.4, -10.4, 0.7, IRON)   # Eisenbeschlag
    for k in range(7): a = math.pi * (0.55 + 0.9 * k / 6); S(sx + 3.2 + math.cos(a) * 2.6, sy + math.sin(a) * 4.0, -11.0, 0.8, GOLD)   # Mondsichel
    # Hellebarde in der hinteren Hand
    def halberd(a, b):   # Schaft von a nach b, Klinge an b
        tube(a, b, 0.9, 0.9, WOOD, 4.0)
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L; nx, ny = -uy, ux
        tip = (b[0] + ux * 6, b[1] + uy * 6)
        tip = (b[0] + ux * 9, b[1] + uy * 9); tube(b, tip, 1.6, 0.2, IRON, 4.0)        # Spitze
        for k in range(7):                                                            # breites Axtblatt
            S(b[0] - ux * (0.5 + k * 1.2) + nx * 4.6, b[1] - uy * (0.5 + k * 1.2) + ny * 4.6, 4.0, 3.6 - k * 0.3, IRON, 0.7, 3.6 - k * 0.3)
        S(b[0] - ux * 2 - nx * 3.0, b[1] - uy * 2 - ny * 3.0, 4.0, 2.0, IRON, 0.7, 1.2)   # Haken
        S(b[0] - ux * 1.2, b[1] - uy * 1.2, 4.0, 1.4, GOLD, 1.4, 1.4)
    bs = (cx - 8, top + 21)
    if pose in ('high0', 'high1', 'low0', 'low1'):
        hand = (cx - 12, top + 40); halberd((hand[0] + 1, 78), (hand[0] - 1, top - 2))
    elif pose == 'thrustL':
        hand = (cx + 2, top + 50); halberd((cx - 18, top + 52), (60, top + 54))
    elif pose == 'thrustH':
        hand = (cx + 2, top + 22); halberd((cx - 18, top + 24), (60, top + 20))
    elif pose == 'leap':
        hand = (cx - 4, top + 6); halberd((cx - 20, top + 14), (cx + 16, top - 4))
    else:   # slam: Klinge vorn im Boden
        hand = (cx + 6, top + 36); halberd((cx - 12, top + 22), (58, 74))
    mid = ((bs[0] + hand[0]) / 2 - 2, (bs[1] + hand[1]) / 2 + 2)
    tube(bs, mid, 2.8, 2.4, STONE2, 4.5); tube(mid, hand, 2.4, 2.2, STONE2, 4.5); S(hand[0], hand[1], 4.5, 2.6, IRON, 2.4, 2.4)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('high0', 'high1', 'low0', 'low1', 'thrustL', 'thrustH', 'leap', 'slam'):
    name = 'gran_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(64, 80); granitus(pose); shot(name)
print('ok')
