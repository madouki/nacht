# Madame Vitrina, Königin der Schaufensterpuppen (Zwischengegnerin in der Lichterpassage): die Blender-Schaufensterpuppe aus
# puppen_bl.py anderthalbfach, in königlichem Violett mit Goldborte, Krone statt Hut, Hermelin-Umhang hinten. Bildfeld 48×64,
# Ständerfuß unten (y ≈ 63), Mitte x = 24, Blick nach rechts. Posen wie die Puppen: show, point, wave, shy, hip, reach.
# Aufruf: python bl.py vitrina_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_vitrina", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))
_pp = open(os.path.join(CFG['dir'], 'puppen_bl.py'), encoding='utf-8').read()
_pp = _pp[_pp.index('DRESS = ['):_pp.index('os.makedirs(')]
# Hut gegen Krone tauschen (die drei Hutzeilen der Puppe)
HAT = _pp[_pp.index('    S(hx, hy - 2.2, 0.0, 4.6, D2, 3.6, 0.45)'):_pp.index('\n', _pp.index('tube((hx + 2.0, hy - 3.6)')) + 1]
CROWN = """    GOLD, GEM, RUBY = M('#e8b848', 0.25, 0.9), M('#8cf0fc', 0.1, 0, 1.2), M('#fc3c5c', 0.15, 0, 0.8)
    tube((hx, hy - 2.0), (hx, hy - 3.2), 2.5, 2.5, GOLD, 0.0)
    for k in range(5):
        a = -0.9 + k * 0.45; tube((hx + math.sin(a) * 2.2, hy - 3.0), (hx + math.sin(a) * 2.4, hy - 5.4 - (0.8 if k == 2 else 0)), 0.55, 0.1, GOLD, -math.cos(a) * 2.0)
    S(hx, hy - 2.6, -2.5, 0.6, RUBY); S(hx - 1.4, hy - 2.6, -2.1, 0.4, GEM); S(hx + 1.4, hy - 2.6, -2.1, 0.4, GEM)
"""
_pp = _pp.replace(HAT, CROWN)
exec(compile(_pp, 'puppen_def', 'exec'))
DRESS.append(('#4c1c6c', '#7c3ca8', '#2c0c44'))   # königliches Violett (Kleid 4)

def cape(cx, foot):   # Hermelin-Umhang hinter dem Rücken, unten weit, mit weißem Saum und schwarzen Tupfen
    RED, ERM, DOT = M('#5c0c2c', 0.6, 0, 0, 0.3, 0.5), M('#f4f0ec', 0.7), M('#141018', 0.6)
    def f(u, v):
        x0 = cx - 3.4 + 6.8 * u; x1 = cx - 8.0 + 13.0 * u
        return (x0 * (1 - v) + x1 * v, foot - 32.0 + 22.0 * v, 3.0 + v * 2.0 + math.sin(u * math.pi) * 1.2)
    grid(f, 8, 8, RED)
    for k in range(9):
        p = f(k / 8, 1.0); S(p[0], p[1], p[2] - 0.3, 1.1, ERM, 0.8, 1.0)
        if k % 2: S(p[0], p[1] + 0.2, p[2] - 1.1, 0.3, DOT)
    tube((cx - 3.6, foot - 31.6), (cx + 3.6, foot - 31.6), 1.0, 1.0, ERM, 1.2)   # Hermelinkragen

def vitrina(pose):
    n0 = len(OBJ)
    cape(16.0, 41.4)
    puppe(4, pose)
    e = bpy.data.objects.new('scale', None); bpy.context.scene.collection.objects.link(e)
    e.location = (16.0 - FW / 2, 0, FH - 41.4); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.scale = (1.5, 1.5, 1.5); e.location = (24.0 - FW / 2, 0, FH - 63.4); OBJ.append(e)

os.makedirs(CFG['out'], exist_ok=True)
for pose in POSE:
    name = 'vitrina_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(48, 64); vitrina(pose); shot(name)
print('ok')
