# Walzerpaar für NACHTMAHR: zwei Ballgeister, er im Frack, sie im Ballkleid mit Hochsteckfrisur, eng im Walzer. Blassblau leuchtend.
# Posen: s0, s60, s120 (das Paar dreht sich um die senkrechte Achse; 180–300 Grad sind gespiegelt), bow (Verbeugung und Knicks).
# Bildfeld 40×44 Spielpixel, Boden bei y = 43, Drehachse bei x = 20.
# Aufruf: python bl.py walzer_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_walzer", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def spin(cx, deg):   # alles um die senkrechte Achse durch x = cx drehen
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, 0); bpy.context.view_layer.update()
    for o in list(OBJ):
        o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, 0, math.radians(deg)); OBJ.append(e)

def paar(pose):
    COAT, COATD, SHIRT = M('#4c64a8', 0.45, 0, 0.08), M('#28346c', 0.6, 0, 0.04), M('#e8f4fc', 0.4, 0, 0.3)
    SKIN, HAIR, EYE = M('#b8d4e8', 0.5, 0, 0.25), M('#4c5c7c', 0.6, 0, 0.05), M('#40e8ff', 0.2, 0, 4.0)
    GOWN, GOWND, LACE = M('#8c74c8', 0.45, 0, 0.06), M('#4c3888', 0.55, 0, 0.03), M('#dcd4f4', 0.4, 0, 0.25)
    bow = pose == 'bow'
    # Er (links, Blick nach rechts)
    gx, lean = 15.5, (0.55 if bow else 0.08)
    hip = (gx, 25.0)
    for d, dx in ((0.8, -1.4), (-0.8, 1.6)):   # Beine, Schuhe
        tube((hip[0] + dx * 0.4, hip[1]), (hip[0] + dx, 41.5), 1.35, 1.05, COATD, d); S(hip[0] + dx + 0.9, 42.2, d, 1.5, M('#101420', 0.3, 0.3), 0.9, 0.7)
    sh = (gx + math.sin(lean) * 11, 25.0 - math.cos(lean) * 11)   # Schultermitte
    ch = (hip[0] + (sh[0] - hip[0]) * 0.62, hip[1] + (sh[1] - hip[1]) * 0.62)
    S(hip[0], hip[1] - 1.0, 0.0, 2.5, COAT, 2.4, 2.8)                                   # Taille
    S(ch[0] + 0.5, ch[1], 0.0, 3.3, COAT, 3.2, 4.8, (0, -lean, 0))                       # Brustkorb
    S(sh[0], sh[1] + 0.6, 0.0, 2.4, COAT, 3.6, 1.8, (0, -lean, 0))                       # Schultern
    tube((sh[0], sh[1]), (sh[0] + math.sin(lean) * 2.0, sh[1] - math.cos(lean) * 2.0), 1.0, 1.0, SKIN, 0.0)   # Hals
    tube((hip[0] - 1.6, hip[1] - 1.2), (hip[0] - 4.4, hip[1] + 6.4), 1.8, 0.7, COATD, 0.9)   # Frackschöße
    tube((hip[0] - 0.4, hip[1] - 1.2), (hip[0] - 2.4, hip[1] + 7.0), 1.6, 0.6, COATD, 1.6)
    S(sh[0] + 1.6, sh[1] + 3.6, -2.4, 1.6, SHIRT, 0.8, 3.0, (0, -lean, 0))
    S(sh[0] + 1.8, sh[1] + 0.6, -2.8, 1.1, M('#141828', 0.4), 0.5, 0.6)   # Fliege
    hx, hy = sh[0] + math.sin(lean) * 4.2 + 0.6, sh[1] - math.cos(lean) * 4.2
    S(hx, hy, 0.0, 2.9, SKIN, 2.6, 3.3); S(hx + 2.8, hy + 0.3, -0.2, 0.8, SKIN, 0.6, 0.9)   # Kopf, Nase
    S(hx - 0.8, hy - 1.9, 0.1, 2.9, HAIR, 2.7, 1.8); S(hx - 2.0, hy - 0.2, 0.1, 1.6, HAIR, 2.4, 2.2)   # gescheitelt, nach hinten gekämmt
    S(hx + 1.4, hy - 0.5, -2.4, 0.55, EYE)
    # Sie (rechts, Blick nach links)
    lx, low = 24.5, (2.6 if bow else 0.0)
    wy = 22.0 + low
    swing = 0.0 if bow else 2.2
    wide = 1.2 if bow else 0.0
    tube((lx, wy), (lx + swing * 0.35, 31.0), 2.4, 5.0 + wide * 0.5, GOWN, 0.0)                         # Glockenrock oben
    tube((lx + swing * 0.35, 31.0), (lx + swing, 42.6), 5.0 + wide * 0.5, 7.8 + wide, GOWN, 0.0)       # unten
    tube((lx + swing * 0.2, 27.0), (lx + swing * 0.7, 37.0), 3.6, 7.0 + wide, GOWND, 0.6, caps=False)  # Überrock
    for k in range(11):   # Rüschen am Saum
        a = k / 10 * math.pi; S(lx + swing + math.cos(a) * 7.9, 42.3, -math.sin(a) * 2.6 - 0.3, 1.1, LACE, 0.9, 0.7)
    for k in range(3): tube((lx + swing * 0.4 - 2.4 + k * 2.4, 31.5), (lx + swing - 4.6 + k * 4.6, 42.0), 0.35, 0.5, GOWND, -4.4 + abs(k - 1) * 0.8, -6.6 + abs(k - 1) * 1.2)   # Falten
    tube((lx, wy), (lx - 0.4, wy - 7.4), 2.4, 2.8, GOWN, 0.0)   # Mieder
    S(lx - 0.6, wy - 6.6, -1.8, 2.4, LACE, 0.8, 1.0)
    fx, fy = lx - 0.8 - (1.2 if bow else 0), wy - 10.8
    tube((lx - 0.4, wy - 7.4), (fx + 0.2, fy + 2.0), 0.8, 0.75, SKIN, 0.0)   # Hals
    S(fx, fy, 0.0, 2.6, SKIN, 2.4, 3.0); S(fx - 2.5, fy + 0.4, -0.2, 0.65, SKIN, 0.5, 0.7)
    S(fx + 0.8, fy - 1.6, 0.2, 2.5, HAIR, 2.4, 1.8); S(fx + 2.4, fy - 3.6, 0.3, 1.8, HAIR); S(fx + 1.6, fy + 0.2, 0.2, 1.3, HAIR, 1.9, 1.9)
    S(fx + 3.0, fy - 5.0, 0.3, 0.8, LACE)
    S(fx - 1.2, fy - 0.4, -2.2, 0.5, EYE)
    if bow:   # Verbeugung: er die Hand auf der Brust, sie hält den Rock
        tube((sh[0] + 0.6, sh[1] + 0.6), (sh[0] + 2.4, sh[1] + 4.0), 1.0, 0.9, COAT, -1.8); S(sh[0] + 2.6, sh[1] + 4.2, -2.6, 0.9, LACE)
        tube((sh[0] - 1.0, sh[1] + 0.8), (sh[0] - 4.6, sh[1] + 7.0), 1.0, 0.9, COAT, 1.0)
        for s in (-1, 1): tube((lx - 0.6 * s, wy - 6.4), (lx + 4.0 * s, wy + 4.0), 0.8, 0.7, SKIN, -1.2 * s)
    else:   # Walzerhaltung: sein Arm um ihre Taille, ihre Hand auf seiner Schulter, die gefassten Hände nach vorn
        tube((sh[0] + 1.0, sh[1] + 1.2), (lx + 1.6, wy - 3.0), 1.0, 0.9, COAT, 1.2)
        tube((lx - 1.4, wy - 7.2), (sh[0] + 1.6, sh[1] - 0.2), 0.8, 0.7, SKIN, 0.6)
        mid = ((sh[0] + lx) / 2 + 0.4, sh[1] - 1.6)
        tube((sh[0] + 0.8, sh[1] + 0.6), mid, 1.0, 0.85, COAT, -1.0, -4.6); tube((lx - 1.0, wy - 6.8), mid, 0.8, 0.7, SKIN, -1.0, -4.6)
        S(mid[0], mid[1], -4.8, 1.0, LACE)
    if not bow: spin(20.0, {'s0': 0, 's60': 60, 's120': 120}[pose])

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('s0', 's60', 's120', 'bow'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(40, 44); paar(pose); shot('walzer_' + pose)
print('ok')
