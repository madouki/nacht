# Angler Anselm (Zwischengegner in der versunkenen Kapelle): ein Tiefsee-Anglerfisch, der das Ewige Licht der Kapelle als Köder an
# seiner Angel trägt – eine rote Kirchenlampe mit Messingkappe. Dunkler, blaugrauer Leib mit Leuchtpunkten, Unterkiefer voller
# Zähne, Rückenstacheln, Schwanzflosse. Bildfeld 96×72 Spielpixel, Blick nach rechts, Leibmitte etwa (44, 40).
# Posen: swim0/swim1 (Schwanz schlägt), open (Maul weit auf, Ausfall), chomp (zugeschnappt, Backen voll), tired (gekippt, X-Augen,
# Zunge raus, Angel hängt schlaff). Gibt die Lage der Lampe je Pose aus (für das Leuchten in js/angler.js).
# Aufruf: python bl.py angler_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_angler", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))
LAMP = {}

def pivot(n0, cx, cy, deg):   # alle seit OBJ[n0] erzeugten Teile ohne Eltern in der Bildebene um (cx, cy) drehen
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (0, math.radians(deg), 0); OBJ.append(e)
def rot(p, c, deg):
    a = math.radians(deg); dx, dy = p[0] - c[0], p[1] - c[1]
    return (c[0] + dx * math.cos(a) - dy * math.sin(a), c[1] + dx * math.sin(a) + dy * math.cos(a))
def tri(a, b, c, mat, d=0.0, n=3):
    grid(lambda u, v: (a[0] + (b[0] - a[0]) * u + (c[0] - (a[0] + (b[0] - a[0]) * u)) * v,
                       a[1] + (b[1] - a[1]) * u + (c[1] - (a[1] + (b[1] - a[1]) * u)) * v, d), n, n, mat)
def curve(pts, r0, r1, mat, d=0.0):
    for i in range(len(pts) - 1):
        t0, t1 = i / (len(pts) - 1), (i + 1) / (len(pts) - 1)
        tube(pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1, mat, d)

def angler(pose):
    BODY, BODY2 = M('#3c4c5c', 0.45, 0, 0, 0.5, 0.6), M('#2c3844', 0.55)
    BELLY, DARK, GUM = M('#8c8478', 0.6), M('#120810', 0.9), M('#7c2034', 0.6)
    TOOTH, EYE, PUP = M('#f0ece0', 0.25), M('#e8e0a0', 0.25, 0, 0.5), M('#100808', 0.2)
    DOT, FIN, SPINE = M('#5ce8fc', 0.2, 0, 2.2), M('#4c6070', 0.5, 0, 0, 0.4, 0.4), M('#a8b8c0', 0.35)
    GOLD, GLASS, FLAME = M('#d8a830', 0.3, 0.9), M('#e83020', 0.15, 0, 1.6 if pose != 'tired' else 0.35), M('#fce090', 0.2, 0, 3.0 if pose != 'tired' else 0.6)
    tired = pose == 'tired'; open_ = {'open': 1.0, 'chomp': 0.0, 'tired': 0.35}.get(pose, 0.3); ph = 1.0 if pose == 'swim1' else 0.0
    n0 = len(OBJ)
    # Schwanzflosse (schlägt auf und ab) und Rückenstacheln mit Flossenhaut
    tl = 6.0 * (1 if ph else -1) if pose in ('swim0', 'swim1') else 0.0
    tri((18.0, 36.0), (3.0, 24.0 + tl), (5.0, 40.0 + tl * 0.5), FIN, 2.0); tri((18.0, 44.0), (5.0, 40.0 + tl * 0.5), (3.0, 56.0 + tl), FIN, 2.0)
    for k, (x, h) in enumerate(((28.0, 9.0), (34.0, 12.0), (40.0, 11.0), (46.0, 8.0))):
        tube((x, 24.0), (x - 4.0, 24.0 - h), 0.7, 0.1, SPINE, 1.0)
        if k < 3: tri((x, 24.5), (x - 4.0, 24.0 - h), (x + 6.0, 24.5), FIN, 1.6, 2)
    # Leib, Bauch, Flecken und Leuchtpunkte
    S(42.0, 40.0, 0.0, 26.0, BODY, 18.0, 19.0)
    S(46.0, 49.0, -6.0, 20.0, BELLY, 11.0, 9.5)
    for (x, y, r) in ((26.0, 34.0, 2.6), (33.0, 28.0, 2.0), (30.0, 46.0, 2.2), (38.0, 33.0, 1.6), (22.0, 42.0, 1.8)):
        S(x, y, -math.sqrt(max(1.0, 18.0 ** 2 * (1 - ((x - 42) / 26) ** 2 - ((y - 40) / 19) ** 2))) + 0.6, r, BODY2, 0.6, r * 0.8)
    for k in range(6):
        x = 24.0 + k * 6.0; y = 52.0 - math.sin(k * 0.6) * 2.0
        S(x, y, -math.sqrt(max(1.0, 18.0 ** 2 * (1 - ((x - 42) / 26) ** 2 - ((y - 40) / 19) ** 2))) - 0.2, 0.8, DOT)
    # Brustflosse
    tri((40.0, 46.0), (30.0, 58.0 + (2.0 if ph else -1.0)), (44.0, 56.0), FIN, -12.0)
    # Maul: dunkler Rachen, Oberkiefer-Zähne, Unterkiefer (klappt auf) mit großen Zähnen
    S(63.0, 46.0, -9.0, 8.0, DARK, 7.0, 2.0 + 6.0 * open_)
    S(64.0, 47.0 + 3.0 * open_, -9.5, 4.0, GUM, 3.5, 1.0 + 2.0 * open_)
    for k in range(6):
        x = 56.0 + k * 2.8; tube((x, 42.0 - 0.5 * open_), (x + 0.6, 45.5 + 0.5 * open_), 0.85, 0.05, TOOTH, -10.0 - k * 0.3)
    m0 = len(OBJ)
    S(58.0, 52.0, -1.0, 15.0, BODY, 13.0, 5.5)
    for k in range(6):
        x = 58.0 + k * 2.8; tube((x, 50.0), (x - 0.4, 45.0), 1.05, 0.05, TOOTH, -11.0 - k * 0.2)
    pivot(m0, 46.0, 50.0, 30.0 * open_)
    if pose == 'chomp':
        for s in (-1, 1): S(54.0, 44.0, s * 12.0, 7.0, BODY, 4.0, 6.0)   # volle Backen (Blasen sammeln)
    # Auge
    if tired:
        for s in (-1, 1): tube((56.0, 31.0 + s * 2.0), (60.0, 31.0 - s * 2.0), 0.55, 0.55, DARK, -13.5)
        S(65.0, 55.0, -9.0, 3.0, M('#e86080', 0.5), 2.0, 2.4)   # Zunge
    else:
        S(58.0, 32.0, -12.2, 3.4, EYE, 1.5, 3.4); S(59.2, 32.2, -13.8, 1.6, PUP)
        S(59.8, 31.0, -14.6, 0.5, M('#ffffff', 0.2, 0, 1.5))
    # Angel mit dem Ewigen Licht
    pts = [(54.0, 23.0), (58.0, 14.0), (66.0, 8.0), (75.0, 8.0), (80.0, 12.0)] if not tired else [(54.0, 23.0), (60.0, 18.0), (68.0, 20.0), (73.0, 27.0), (75.0, 34.0)]
    curve(pts, 1.1, 0.5, SPINE, -2.0)
    lx, ly = pts[-1][0], pts[-1][1] + 3.6
    tube((lx, ly - 3.4), (lx, ly - 2.2), 0.3, 0.3, GOLD, -2.0)
    S(lx, ly - 2.0, -2.0, 2.4, GOLD, 2.4, 0.9)
    tube((lx, ly - 1.4), (lx, ly + 2.4), 2.0, 1.7, GLASS, -2.0)
    S(lx, ly + 0.4, -2.6, 0.9, FLAME, 0.9, 1.3)
    S(lx, ly + 2.8, -2.0, 1.9, GOLD, 1.9, 0.8); tube((lx, ly + 3.2), (lx, ly + 4.6), 0.5, 0.1, GOLD, -2.0)
    lamp = (lx, ly + 0.4)
    if tired:
        pivot(n0, 44.0, 40.0, 24.0); lamp = rot(lamp, (44.0, 40.0), 24.0)
    LAMP[pose] = [round(lamp[0], 1), round(lamp[1], 1)]

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('swim0', 'swim1', 'open', 'chomp', 'tired'):
    name = 'angler_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(96, 72); angler(pose); shot(name)
print('LAMP ' + repr(LAMP))
