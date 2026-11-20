# Kirchturmhahn Kasimir (Zwischengegner auf der Himmelsbrücke): der Ur-Wetterhahn vom Kathedralenturm. Der Hahn aus wetter_bl.py,
# 2,2-mal so groß, dazu unter dem Windpfeil der abgerissene Turmstab mit Windkreuz (Kugeln an den Armen) und vergoldetem Turmknauf.
# Bildfeld 96×92 Spielpixel, Drehachse (Turmstab) bei x ≈ 50.6, Rumpfmitte bei (48, 34). Blick nach rechts.
# Posen: glide0, glide1 (Schwanz wippt), crow (kräht, Spitze glüht), dash (gestreckt), spin45, spin90 (dreht sich auf dem Stab).
# Aufruf: python bl.py kirchhahn_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kirchhahn", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'wetter_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('os.makedirs(')], 'wetter', 'exec'))   # bringt die Helfer aus kulisse_bl.py und hahn(pose) mit

K, CX, CY = 2.2, 48.0, 34.0          # Maßstab, neue Rumpfmitte
AXIS = CX + 1.2 * K                  # Turmstab (im kleinen Hahn bei x = 21.2)

def group(n0, origin):   # alle Objekte ab n0 an ein leeres Elternobjekt hängen (Ursprung in Bildkoordinaten)
    e = bpy.data.objects.new('grp', None); bpy.context.scene.collection.objects.link(e)
    e.location = (origin[0] - FW / 2, 0, FH - origin[1]); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    OBJ.append(e); return e

def kasimir(pose):
    base = {'glide0': 'glide0', 'glide1': 'glide1', 'crow': 'aim', 'dash': 'dash', 'spin45': 'glide0', 'spin90': 'glide0'}[pose]
    n0 = len(OBJ)
    hahn(base)                                                        # im kleinen Maßstab um (20, 18)
    g = group(n0, (20.0, 18.0)); g.scale = (K, K, K); g.location = (CX - FW / 2, 0, FH - CY)
    bpy.context.view_layer.update()
    IRON, RUST, GOLD = M('#2c2c34', 0.5, 0.7), M('#8c4c2c', 0.75, 0.3), M('#e0b040', 0.22, 0.95)
    ay = CY + 9.6 * K                                                 # Höhe des Windpfeils
    tube((AXIS, ay - 1.0), (AXIS, 86.0), 1.4, 1.2, IRON, 2.6)          # Turmstab
    cy2 = ay + 10.0                                                   # Windkreuz: Arm quer, Arm zur Kamera, Kugeln an den Enden
    tube((AXIS - 13.0, cy2), (AXIS + 13.0, cy2), 0.9, 0.9, IRON, 2.6)
    tube((AXIS, cy2), (AXIS, cy2), 0.9, 0.9, IRON, -10.0, 15.0)
    for x, d in ((AXIS - 13.6, 2.6), (AXIS + 13.6, 2.6), (AXIS, -10.6), (AXIS, 15.6)): S(x, cy2, d, 2.0, GOLD)
    for x in (AXIS - 7.0, AXIS + 7.0): S(x, cy2, 2.6, 1.3, RUST, 1.3, 1.0)
    S(AXIS, 79.0, 2.6, 5.2, GOLD, 5.2, 4.6)                           # Turmknauf
    S(AXIS, 74.6, 2.6, 2.4, IRON, 2.4, 1.0); S(AXIS, 83.4, 2.6, 2.6, IRON, 2.6, 1.0)
    tube((AXIS, 86.0), (AXIS - 1.0, 91.0), 1.2, 0.5, RUST, 2.6)       # abgerissenes, rostiges Ende
    if pose in ('spin45', 'spin90'):                                  # dreht sich auf dem Stab: alles um die senkrechte Achse
        rot = group(n0, (AXIS, 40.0)); rot.rotation_euler = (0, 0, math.radians(45 if pose == 'spin45' else 90))

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('glide0', 'glide1', 'crow', 'dash', 'spin45', 'spin90'):
    name = 'kirchhahn_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(96, 92); kasimir(pose); shot(name)
print('ok')
