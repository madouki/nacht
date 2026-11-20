# Kleiderschrank Kunibert (Zwischengegner in Zimmer 13 des Hotels Krat): ein besessener Nussbaumschrank mit Kranzgesims, Klauenfüßen,
# Kassettentüren mit Messingknäufen. Zu glühen seine Augen durch die Schlüssellöcher; einen Spalt offen schauen sie aus dem Dunkel;
# weit offen zeigt er Kleider auf der Stange, eine Zahnreihe aus Kleiderbügeln und einen roten Schal als Zunge.
# Bildfeld 56×68 Spielpixel, Füße unten (y ≈ 67), Mitte x = 28. Posen: closed, rockL, rockR (wankt), ajar (Spalt), open (weit auf).
# Aufruf: python bl.py schrank_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_schrank", "ss": 5}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def pivot(n0, loc, rot):
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = loc; bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = rot; OBJ.append(e)

def schrank(pose):
    WOOD, WOOD2, WOOD3 = M('#2c160a', 0.5, 0, 0, 0.45, 0.15), M('#44240f', 0.45, 0, 0, 0.45, 0.15), M('#1c0e06', 0.6)
    BRASS, DARK, EYE = M('#d8a840', 0.3, 0.85), M('#0c0608', 0.95), M('#fce040', 0.2, 0, 3.0)
    CLOTH = [M('#3c5c8c', 0.8), M('#8c2c3c', 0.8), M('#4c6c3c', 0.8), M('#d8c8a8', 0.8), M('#5c3c6c', 0.8)]
    SCARF, HANG = M('#d81c2c', 0.6, 0, 0.05), M('#e8e0c8', 0.35, 0.3)
    cx, foot = 28.0, 67.0
    ang = {'closed': 0, 'rockL': 0, 'rockR': 0, 'ajar': 24, 'open': 78}[pose]
    n0 = len(OBJ)
    x0, x1, y0, y1 = 14.0, 42.0, 13.0, 64.0
    # Korpus, Innenraum (dunkel), Kranzgesims mit Bogen, Sockel, Klauenfüße
    box(x0, y0, x1, y1, WOOD, -4.6, 5.0)
    box(x0 + 1.0, y0 + 1.0, x1 - 1.0, y1 - 1.0, DARK, -4.8, -4.6)
    box(x0 - 2.0, y0 - 3.0, x1 + 2.0, y0 + 0.6, WOOD2, -5.6, 5.6)
    S(cx, y0 - 3.2, -1.0, 7.0, WOOD2, 5.0, 3.2); S(cx, y0 - 4.6, -4.6, 1.2, BRASS)
    box(x0 - 1.0, y1 - 1.0, x1 + 1.0, y1 + 0.6, WOOD3, -5.4, 5.4)
    for fx in (x0 + 1.6, x1 - 1.6):
        for d in (-4.0, 3.6): S(fx, foot - 1.6, d, 1.8, WOOD3, 1.6, 1.6); S(fx + (1.0 if fx > cx else -1.0), foot - 0.5, d - 0.6, 0.8, BRASS, 0.8, 0.5)
    if ang > 0:   # Innenleben: Augen im Dunkel; weit offen Kleider, Bügelzähne, Schalzunge
        ey = 27.0
        for ex in ((cx - 4.2, cx + 4.2) if ang > 40 else (cx - 1.6, cx + 1.6)): S(ex, ey, -5.0, 1.5 if ang > 40 else 1.0, EYE, 0.4, 1.0 if ang > 40 else 0.7)
        if ang > 40:
            tube((x0 + 1.5, y0 + 3.0), (x1 - 1.5, y0 + 3.0), 0.4, 0.4, BRASS, -3.8)
            for k, xx in enumerate((x0 + 3.2, x0 + 7.6, x1 - 7.6, x1 - 3.2)):
                box(xx - 2.2, y0 + 4.0, xx + 2.2, y0 + 20.0 + (k % 2) * 4.0, CLOTH[k], -5.1, -4.85)
            for k in range(7): tube((x0 + 3.0 + k * 3.7, y0 + 2.4), (x0 + 3.6 + k * 3.7, y0 + 6.2), 0.55, 0.05, HANG, -4.9)   # Bügel als Zähne oben
            for k in range(6): tube((x0 + 4.6 + k * 3.7, y1 - 2.0), (x0 + 5.0 + k * 3.7, y1 - 5.4), 0.5, 0.05, HANG, -4.9)  # und unten
            pts = [(cx, y1 - 9.0), (cx + 1.0, y1 - 4.0), (cx - 0.6, y1 + 0.5), (cx + 2.4, y1 + 3.2)]
            for i in range(3): tube(pts[i], pts[i + 1], 1.4, 1.2, SCARF, -6.0 - i * 0.8)
    # Türen: Kassetten, Knäufe, Schlüssellöcher; an den äußeren Kanten angeschlagen, öffnen nach vorn
    for side in (-1, 1):
        m0 = len(OBJ); hx = x0 if side < 0 else x1; dx0, dx1 = (x0, cx - 0.1) if side < 0 else (cx + 0.1, x1)
        box(dx0, y0 + 0.5, dx1, y1 - 0.5, WOOD2, -5.6, -4.8)
        box(dx0 + 1.6, y0 + 4.0, dx1 - 1.6, y0 + 22.0, WOOD, -5.9, -5.5); box(dx0 + 1.6, y0 + 26.0, dx1 - 1.6, y1 - 4.0, WOOD, -5.9, -5.5)
        kx = cx - side * 1.6
        S(kx, 38.0, -6.2, 0.9, BRASS)
        if ang == 0: S(kx, 41.0, -5.95, 0.55, EYE, 0.3, 0.55)   # glühendes Auge im Schlüsselloch
        else: S(kx, 41.0, -5.95, 0.5, DARK, 0.3, 0.55)
        pivot(m0, (hx - FW / 2, -5.2, FH - y0), (0, 0, math.radians(side * ang)))
    if pose in ('rockL', 'rockR'):   # wankt auf einer Kante
        pivot(n0, ((x0 if pose == 'rockL' else x1) - FW / 2, 0, FH - foot), (0, math.radians(-7 if pose == 'rockL' else 7), 0))

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('closed', 'rockL', 'rockR', 'ajar', 'open'):
    name = 'schrank_' + pose
    if CFG.get('only') and name not in CFG['only']: continue
    stage(56, 68); schrank(pose); shot(name)
print('ok')
