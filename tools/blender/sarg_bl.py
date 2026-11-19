# Hüpfsarg für NACHTMAHR: aufrecht stehender Sarg aus dunklem Holz mit Eisenbeschlägen, Messinggriffen und Namensschild. Posen: rest
# (zu), peek (Deckel einen Spalt offen, zwei glühende Augen), open (Deckel aufgeschwungen: roter Samt, drinnen das mürrische Skelett des
# Vormieters mit Schlafmütze, eine Hand drohend erhoben). Bildfeld 32×40 Spielpixel, Boden bei y = 39.
# Aufruf: python bl.py sarg_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_sarg", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def prism(pts, d0, d1, mat, hinge=None, swing=0.0):   # Prisma aus einem Umriss in Bildkoordinaten, Tiefe d0..d1; optional um eine senkrechte Kante gedreht
    bm = bmesh.new(); n = len(pts)
    def V(x, y, d):
        if hinge is not None:
            u, w = x - hinge[0], d - hinge[1]; c, s = math.cos(swing), math.sin(swing); x, d = hinge[0] + u * c - w * s, hinge[1] + u * s + w * c
        return bm.verts.new((x - FW / 2, d, FH - y))
    A = [V(x, y, d0) for x, y in pts]; B = [V(x, y, d1) for x, y in pts]
    bm.faces.new(A[::-1]); bm.faces.new(B)
    for i in range(n): j = (i + 1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
    me = bpy.data.meshes.new('p'); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new('p', me); bpy.context.scene.collection.objects.link(o); OBJ.append(o); return o

def outline(cx, top, bot, wt, ws, wb, sy):   # Sargumriss: schmal oben, breite Schultern bei sy, schmal unten
    return [(cx - wt / 2, top), (cx + wt / 2, top), (cx + ws / 2, sy), (cx + wb / 2, bot), (cx - wb / 2, bot), (cx - ws / 2, sy)]

def sarg(pose):
    WOOD, WOODL, WOODD = M('#3a2014', 0.55, 0.05), M('#56301c', 0.45, 0.05), M('#140a06', 0.8)
    IRON, BRASS, VEL = M('#34343c', 0.45, 0.75), M('#d8a838', 0.3, 0.85), M('#4a0e16', 0.9, 0, 0.0, 0.3, 0.5)
    BONE, EYE, CAP, CAPW = M('#e8e0c8', 0.6), M('#ff5040', 0.2, 0, 3.5), M('#b82c2c', 0.8), M('#f0ece0', 0.8)
    cx, top, bot, sy = 16.0, 2.0, 39.0, 11.0
    # Kasten (hinten) und Innenraum
    prism(outline(cx, top, bot, 9.0, 17.0, 11.0, sy), 0.5, 4.5, WOOD)
    prism(outline(cx, top + 1.2, bot - 1.2, 7.0, 14.6, 8.8, sy), 0.0, 0.6, VEL if pose == 'open' else WOODD)
    for x, y in ((cx - 8.0, sy), (cx + 8.0, sy)): S(x, y, -0.4, 0.9, IRON, 1.0, 1.4)
    if pose == 'open':   # der Vormieter: Schädel mit Schlafmütze, Rippen, drohende Hand
        hx, hy = cx + 0.5, 10.5
        S(hx, hy, -0.6, 3.3, BONE, 3.0, 3.6)
        S(hx - 1.2, hy - 0.2, -3.4, 0.9, M('#100808', 0.9), 0.4, 1.0); S(hx + 1.3, hy - 0.4, -3.4, 0.9, M('#100808', 0.9), 0.4, 1.0)
        S(hx - 1.2, hy - 0.2, -3.6, 0.35, EYE); S(hx + 1.3, hy - 0.4, -3.6, 0.35, EYE)
        S(hx + 0.2, hy + 2.6, -2.6, 1.8, BONE, 1.2, 0.8)
        for k in range(4): S(hx - 1.2 + k * 0.8, hy + 2.7, -3.4, 0.28, M('#100808', 0.9), 0.2, 0.5)
        tube((hx - 3.0, hy - 2.0), (hx + 4.4, hy - 6.2), 3.2, 0.4, CAP, -0.4)   # Schlafmütze, Spitze hängt
        tube((hx + 4.4, hy - 6.2), (hx + 6.4, hy - 3.8), 0.6, 0.3, CAP, -0.4); S(hx + 6.6, hy - 3.4, -0.4, 1.2, CAPW)
        tube((hx - 3.4, hy - 1.6), (hx + 2.8, hy - 2.8), 1.0, 1.0, CAPW, -0.6, caps=False)
        for k in range(4): tube((hx - 3.5, hy + 6.5 + k * 2.0), (hx + 3.5, hy + 6.5 + k * 2.0), 0.55, 0.55, BONE, -0.6)
        tube((hx, hy + 5.0), (hx, hy + 14.0), 0.7, 0.7, BONE, -0.4)
        tube((hx + 4.0, hy + 7.0), (hx + 7.0, hy + 2.0), 0.6, 0.5, BONE, -1.6); tube((hx + 7.0, hy + 2.0), (hx + 7.4, hy - 1.4), 0.5, 0.45, BONE, -1.8)
        for k in range(3): tube((hx + 7.4, hy - 1.4), (hx + 6.6 + k * 0.8, hy - 3.6), 0.3, 0.25, BONE, -1.8)
    # Deckel: zu, einen Spalt offen oder aufgeschwungen (Scharnier an der linken Kante)
    lid = outline(cx, top - 0.3, bot + 0.3, 9.4, 17.6, 11.4, sy)
    sw = -{'rest': 0.0, 'peek': 0.72, 'open': 1.35}[pose]; hinge = (cx - 8.8, -0.3)
    prism(lid, -1.4, -0.3, WOODL, hinge, sw)
    inner = outline(cx, top + 2.0, bot - 2.0, 6.4, 13.4, 8.0, sy)
    prism(inner, -1.8, -1.3, WOOD, hinge, sw)
    def P(x, y, d): # Punkt auf dem Deckel mitdrehen
        u, w = x - hinge[0], d - hinge[1]; c, s = math.cos(sw), math.sin(sw); return hinge[0] + u * c - w * s, y, hinge[1] + u * s + w * c
    for x, y in ((cx, 15.0), (cx - 4.0, 13.0), (cx + 4.0, 13.0), (cx, 30.0)):   # Beschläge und Nieten
        px, py, pd = P(x, y, -2.0); S(px, py, pd, 0.6, IRON)
    px, py, pd = P(cx, 22.0, -2.0); S(px, py, pd, 2.6 * (1 - 0.6 * abs(sw) / 1.35), BRASS, 0.3, 1.2)   # Namensschild
    for x in (cx - 9.0, cx + 9.0):
        if pose == 'rest' or x > cx: S(x * 0.96 + cx * 0.04, 24.0, 1.8, 0.75, BRASS, 1.6, 2.0)   # Griffe
    if pose == 'peek':   # zwei glühende Augen im Spalt
        GL = M('#ffe080', 0.2, 0, 5.0); S(cx + 5.8, 10.6, -0.2, 0.95, GL, 0.4, 0.7); S(cx + 7.5, 10.3, -0.2, 0.95, GL, 0.4, 0.7)
    # Eisenkappen an den Ecken
    for x, y in ((cx - 4.5, top + 0.4), (cx + 4.5, top + 0.4), (cx - 5.4, bot - 0.6), (cx + 5.4, bot - 0.6)): S(x, y, 0.2, 1.2, IRON, 2.6, 0.9)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('rest', 'peek', 'open'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(32, 40); sarg(pose); shot('sarg_' + pose)
print('ok')
