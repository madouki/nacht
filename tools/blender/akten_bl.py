# Aktenordner (Behördentrakt) als HD-3D: zugeklappt steht er wie im Regal (Rücken mit Etikett und Griffloch), aufgeklappt schnappt der
# Deckel wie ein Kiefer auf – Papierstapel, die Ringmechanik als Zähne, ein rotes Auge im Spalt. Vier Farben, je closed/half/open.
# Bildfeld 28×36 Spielpixel, Mitte x = 14, Boden unten. Blick nach rechts.
# Aufruf: python bl.py akten_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_akten", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))
COLS = [('#2c5ca8', '#1c3c78'), ('#a8282c', '#781c1c'), ('#2c8c4c', '#1c5c34'), ('#d8b830', '#a08820')]

def hinge(n0, cx, cy, deg):   # alle seit OBJ[n0] erzeugten Teile um (cx, cy) in der Bildebene drehen
    e = bpy.data.objects.new('hinge', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, math.radians(deg), 0); OBJ.append(e)

def ordner(ci, pose):
    C0, C1 = M(COLS[ci][0], 0.45, 0.05), M(COLS[ci][1], 0.55)
    PAPER, LABEL, INK = M('#f0ece0', 0.8), M('#f8f4e8', 0.7), M('#3c3c48', 0.7)
    METAL, DARK, EYE = M('#d8d8e8', 0.25, 0.9), M('#14101c', 0.8), M('#ff3c3c', 0.2, 0, 4.0)
    if pose == 'closed':   # Rücken zur Kamera
        box(8.0, 13.6, 20.0, 35.6, C0, -3.0, 3.0)
        box(7.6, 13.4, 8.6, 35.8, C1, -3.2, 3.2); box(19.4, 13.4, 20.4, 35.8, C1, -3.2, 3.2)
        box(9.6, 16.4, 18.4, 23.6, LABEL, -3.3, -3.0)
        for k, w in enumerate((7.0, 5.0, 6.0)): tube((10.6, 18.0 + k * 1.8), (10.6 + w, 18.0 + k * 1.8), 0.28, 0.28, INK, -3.4)
        S(14.0, 30.0, -3.1, 1.9, DARK, 0.4, 1.9)
        for k in range(12): a = k / 12 * 2 * math.pi; S(14.0 + math.cos(a) * 2.1, 30.0 + math.sin(a) * 2.1, -3.3, 0.45, METAL)
        box(7.6, 35.0, 20.4, 35.8, DARK, -3.2, 3.2)
        return
    o = 0.5 if pose == 'half' else 1.0
    # Unterteil (Seitenansicht): Deckel unten, Papierstapel, untere Ringhälften als Zähne
    box(6.0, 21.0, 22.0, 35.6, C0, -4.0, 4.0)
    box(7.0, 20.4, 21.0, 34.6, PAPER, -3.6, 3.4)
    box(9.0, 25.0, 19.0, 31.0, LABEL, -4.2, -3.9)
    for k, w in enumerate((7.0, 5.0)): tube((10.0, 27.0 + k * 1.8), (10.0 + w, 27.0 + k * 1.8), 0.28, 0.28, INK, -4.3)
    box(5.6, 21.0, 6.6, 35.8, C1, -4.2, 4.2)   # Rücken hinten
    for k in range(3): tube((9.0 + k * 4.4, 22.0), (9.6 + k * 4.4, 18.0), 1.3, 0.25, METAL, -2.4)
    # Oberkiefer: Deckel am Rücken (hinten oben) angeschlagen, klappt um bis zu 38 Grad auf
    n0 = len(OBJ)
    box(6.0, 17.0, 22.0, 20.4, C0, -4.0, 4.0); box(6.0, 16.6, 22.0, 17.4, C1, -4.2, 4.2)
    box(7.0, 20.2, 21.0, 21.0, PAPER, -3.6, 3.4)
    for k in range(3): tube((9.0 + k * 4.4, 20.6), (9.6 + k * 4.4, 24.4), 1.3, 0.25, METAL, -2.4)
    hinge(n0, 6.0, 20.6, -38 * o)
    S(18.6, 19.8 - 4.0 * o, -2.6, 1.5, DARK, 0.6, 1.1); S(18.8, 19.6 - 4.0 * o, -3.3, 0.9, EYE)   # Auge im Spalt

os.makedirs(CFG['out'], exist_ok=True)
for ci in range(4):
    for pose in ('closed', 'half', 'open'):
        name = 'akte%d_%s' % (ci, pose)
        if CFG.get('only') and name not in CFG['only']: continue
        stage(28, 36); ordner(ci, pose); shot(name)
print('ok')
