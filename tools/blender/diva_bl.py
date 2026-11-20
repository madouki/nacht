# Primadonna Ottilie von Tremolo (Zwischengegnerin auf der Bühne des Hoftheaters): eine Geister-Operndiva in weinrotem Samtkleid
# mit Goldborte und Tournüre, geisterblasse, leicht leuchtende Haut, weiß aufgetürmte Perücke mit Diadem, Fächer in der Hand.
# Bildfeld 64×88 Spielpixel, Saum unten (y ≈ 86), Blick nach rechts, Körpermitte x = 32.
# Posen: idle (Fächer vor der Brust), sing0/sing1 (Arme ausgebreitet, Kopf im Nacken, Mund offen – zwei Atemstellungen),
# point (rechter Arm weist nach vorn: Scheinwerfer!), bow (tiefer Knicks, Kopf gesenkt – wartet auf Applaus).
# Aufruf: python bl.py diva_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_diva", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def pivot(n0, cx, cy, deg):
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, math.radians(deg), 0); OBJ.append(e)

def arm(sh, a1, a2, L1, L2, d, SLEEVE, SKIN, LACE, fan=None):
    e = (sh[0] + math.sin(a1) * L1, sh[1] + math.cos(a1) * L1)
    h = (e[0] + math.sin(a1 + a2) * L2, e[1] + math.cos(a1 + a2) * L2)
    S(sh[0], sh[1], d, 2.2, SLEEVE, 2.0, 2.0)
    tube(sh, e, 1.45, 1.1, SKIN, d); tube(e, h, 1.1, 0.8, SKIN, d)
    tube((e[0] - 0.1, e[1]), (e[0] + math.sin(a1) * 1.4, e[1] + math.cos(a1) * 1.4), 1.6, 1.3, LACE, d)   # Spitzenrüsche am Ellbogen
    S(h[0], h[1], d - 0.2, 1.15, SKIN, 0.9, 1.2)
    return h

def diva(pose):
    VEL, VEL2, VEL3 = M('#56081c', 0.62, 0, 0, 0.3, 0.25), M('#7c1430', 0.58, 0, 0, 0.3, 0.25), M('#30040e', 0.7)
    GOLD, LACE = M('#e8b848', 0.3, 0.85), M('#f4ecf0', 0.5, 0, 0.05)
    SKIN, BLUSH = M('#d8e8f4', 0.35, 0, 0.35), M('#e8a8c0', 0.5, 0, 0.1)
    HAIR, HAIR2 = M('#f0f0f8', 0.6, 0, 0.12, 0.4, 0.6), M('#c8c8dc', 0.6)
    DARK, LIPS, GEM = M('#1c0c18', 0.4), M('#c82848', 0.35), M('#8cf0fc', 0.1, 0, 1.6)
    FAN, FAN2 = M('#2c0c24', 0.5), M('#e8b848', 0.35, 0.6)
    cx, hem = 32.0, 86.0
    bow = pose == 'bow'; sing = pose.startswith('sing'); br = 1.0 if pose == 'sing1' else 0.0
    n0 = len(OBJ)
    # Kleid: weite Glocke mit Tournüre hinten, Volants, Goldborte am Saum
    waist = hem - 34.0
    tube((cx, waist), (cx + 0.4, hem - 16.0), 5.2, 10.5, VEL, 0.0, caps=False)
    tube((cx + 0.4, hem - 16.0), (cx + 0.6, hem - 1.0), 10.5, 15.0, VEL, 0.0)
    for k in range(3): tube((cx + 0.5, hem - 12.0 + k * 4.5), (cx + 0.6, hem - 10.5 + k * 4.5), 11.5 + k * 1.3, 11.8 + k * 1.3, VEL2 if k % 2 == 0 else VEL3, 0.0, caps=False)   # Volants
    tube((cx + 0.6, hem - 1.6), (cx + 0.6, hem - 0.4), 15.1, 15.3, GOLD, 0.0, caps=False)
    S(cx - 5.5, waist + 7.0, 5.0, 4.8, VEL3, 5.0, 6.5)   # Tournüre (hinten, kaum zu sehen)
    for s in (-1, 1): tube((cx + s * 1.5, waist + 2.0), (cx + s * 6.0, hem - 2.0), 0.35, 0.45, GOLD, -5.0, -14.0)
    # Mieder, Spitzenkragen, Brosche
    m0 = len(OBJ)
    chest = waist - 11.0
    tube((cx, waist + 1.0), (cx + 0.6, chest), 4.6, 5.0, VEL, 0.0)
    tube((cx - 4.6, waist), (cx + 4.6, waist), 0.6, 0.6, GOLD, -2.6)
    S(cx + 0.8, chest + 0.6, -1.4, 5.6, LACE, 4.2, 1.6)
    S(cx + 1.4, chest + 3.0, -4.6, 1.2, GEM)
    # Kopf: Hals, Gesicht, aufgetürmte Perücke mit Locken, Diadem, Schönheitsfleck
    hx, hy = cx + 1.2, chest - 6.0
    tube((cx + 0.6, chest), (hx, hy + 3.0), 1.4, 1.2, SKIN, 0.0)
    S(hx, hy, 0.0, 3.4, SKIN, 3.2, 3.9)
    if sing:
        S(hx + 2.4, hy + 1.8, -2.6, 1.0, DARK, 0.6, 1.3 + 0.3 * br)   # Mund weit offen
        for ex in (hx + 2.2, hx + 0.4): tube((ex - 0.6, hy - 0.8), (ex + 0.6, hy - 0.4), 0.22, 0.22, DARK, -3.0)   # Augen geschlossen (Hingabe)
    else:
        S(hx + 2.3, hy + 2.0, -2.8, 0.7, LIPS, 0.4, 0.45)
        for ex in (hx + 2.3, hx + 0.5): S(ex, hy - 0.5, -2.9, 0.5, DARK, 0.3, 0.6)
    S(hx + 0.6, hy + 1.1, -3.2, 0.7, BLUSH, 0.3, 0.5); S(hx + 1.6, hy + 0.6, -3.3, 0.22, DARK)
    S(hx - 0.8, hy - 3.6, 0.6, 4.2, HAIR, 3.8, 3.6)
    S(hx - 1.4, hy - 8.0, 0.4, 3.4, HAIR, 3.0, 3.6); S(hx - 1.0, hy - 11.6, 0.2, 2.4, HAIR, 2.2, 2.4)
    for (lx, ly) in ((hx - 4.4, hy - 1.0), (hx - 4.0, hy + 2.2), (hx + 2.6, hy - 3.6), (hx - 3.6, hy - 6.4)): S(lx, ly, 0.6, 1.4, HAIR2, 1.3, 1.4)
    tube((hx - 3.6, hy - 4.6), (hx + 2.8, hy - 4.6), 0.45, 0.45, GOLD, -2.2)
    for k, h in enumerate((1.4, 2.4, 1.4)): tube((hx - 1.6 + k * 1.6, hy - 4.8), (hx - 1.6 + k * 1.6, hy - 4.8 - h), 0.45, 0.1, GOLD, -2.8)
    S(hx - 0.0, hy - 6.6, -3.0, 0.6, GEM)
    if sing: pivot(m0, cx + 0.6, waist, -6.0 - 2.0 * br)   # Oberkörper zurückgelehnt
    # Arme und Fächer
    shb, shf = (cx - 3.6, chest + 1.2), (cx + 4.2, chest + 1.2)
    if pose == 'idle':
        arm(shb, -0.25, 0.4, 6.5, 6.0, 2.4, VEL2, SKIN, LACE)
        h = arm(shf, 0.9, 2.0, 6.5, 6.0, -3.0, VEL2, SKIN, LACE)
        fan = (h[0] - 1.0, h[1] - 2.0)
    elif sing:
        arm(shb, -1.9 - 0.15 * br, -0.3, 6.8, 6.2, 2.4, VEL2, SKIN, LACE)
        h = arm(shf, 2.0 + 0.15 * br, 0.3, 6.8, 6.2, -3.0, VEL2, SKIN, LACE)
        fan = None
    elif pose == 'point':
        arm(shb, -0.4, 0.6, 6.5, 6.0, 2.4, VEL2, SKIN, LACE)
        h = arm(shf, 1.45, 0.05, 7.2, 6.8, -3.0, VEL2, SKIN, LACE)
        fan = (h[0] + 1.6, h[1])
    else:  # bow
        arm(shb, -0.8, 0.5, 6.5, 6.0, 2.4, VEL2, SKIN, LACE)
        h = arm(shf, 0.4, 0.2, 6.5, 6.0, -3.0, VEL2, SKIN, LACE)
        fan = (h[0], h[1] + 1.5)
    if fan:   # Fächer: Halbkreis aus Stäben mit dunkler Seide
        for k in range(7):
            a = math.pi * (0.15 + 0.7 * k / 6)
            tube(fan, (fan[0] + math.cos(a) * 5.2, fan[1] - math.sin(a) * 5.2), 0.18, 0.12, FAN2, -4.0)
        for k in range(6):
            a0, a1 = math.pi * (0.15 + 0.7 * k / 6), math.pi * (0.15 + 0.7 * (k + 1) / 6)
            grid(lambda u, v, a0=a0, a1=a1: (fan[0] + math.cos(a0 + (a1 - a0) * u) * 5.0 * (0.25 + 0.75 * v), fan[1] - math.sin(a0 + (a1 - a0) * u) * 5.0 * (0.25 + 0.75 * v), -3.9), 2, 2, FAN)
    if bow: pivot(m0, cx + 0.6, waist + 1.0, 38.0)   # tiefer Knicks: Oberkörper samt Armen und Kopf nach vorn, der Rock bleibt stehen

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('idle', 'sing0', 'sing1', 'point', 'bow'):
    name = 'diva_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(64, 88); diva(pose); shot(name)
print('ok')
