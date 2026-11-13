# Paternoster-Kabine für NACHTMAHR in Blender: 52×56, Anker 26/51 (Standfläche). Offene Kabine von vorn: Mahagoni-Rückwand
# mit Kassetten, Messingpfosten und -handlauf, Deckenlampe, Emailleschild, Riffelboden mit Warnkante.
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out'}.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))

def stage(w, h, ss):
    global FW, FH, SS
    FW, FH, SS = w, h, ss
    MATS.clear(); MESH.clear(); OBJ.clear()
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()
def rect(x0, y0, x1, y1, mat, y=0.0, bulge=0.0, n=8):  # Rechteck zur Kamera, bulge wölbt die Mitte nach vorn (weiches Licht)
    return grid(lambda u, v: (x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, y - bulge * math.sin(math.pi * u) * math.sin(math.pi * v)), n, n, mat)
def curve(pts, r0, r1, mat, y=0.0, n=12):
    P = []
    for i in range(len(pts) - 1):
        for k in range(n): t = k / n; P.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t))
    P.append(pts[-1])
    for i, q in enumerate(P): t = i / (len(P) - 1); S(q[0], q[1], y, r0 + (r1 - r0) * t, mat)

def cabin():
    wall, wallD, panel, panelL = M('#3c1c10', 0.7), M('#22100a', 0.8), M('#5c2c16', 0.5), M('#7c4020', 0.45)
    brass, brassD, steel = M('#e8b030', 0.28, 0.85), M('#a87018', 0.35, 0.85), M('#4c4a58', 0.4, 0.7)
    enamel, cream, ink = M('#1c3c8c', 0.25), M('#f0e8d0', 0.5), M('#201810', 0.7)
    lamp, carpet, warnY, warnK = M('#ffe6a8', 0.4, 0, 3.2), M('#a01828', 0.8), M('#f0c428', 0.5), M('#1c1a1e', 0.6)
    rect(5, 3, 47, 51, wall, 9.0)                                                        # Rückwand
    for x0, x1 in ((5, 9.5), (42.5, 47)): rect(x0, 6, x1, 51, wallD, 8.5)                # Seitenwände im Schatten
    for x0 in (10.5, 21.2, 31.9):                                                        # Kassetten: oben hoch, unten niedrig
        rect(x0, 11, x0 + 9.6, 32, panel, 8.0, 1.6); rect(x0 + 1.4, 12.6, x0 + 8.2, 30.4, panelL, 6.8, 0.9)
        rect(x0, 38.5, x0 + 9.6, 49.5, panel, 8.0, 1.4); rect(x0 + 1.4, 40, x0 + 8.2, 48, panelL, 6.9, 0.7)
    rect(22.0, 16.5, 30.0, 23.5, cream, 6.0, 0.3); rect(23.2, 18.4, 28.8, 19.2, ink, 5.6); rect(23.2, 20.6, 27.4, 21.3, ink, 5.6)   # Dienstvorschrift
    tube((6.5, 35.2), (45.5, 35.2), 0.95, 0.95, brass, 3.0, 3.0, caps=False)             # Handlauf mit Haltern
    for x in (12.0, 26.0, 40.0): S(x, 35.2, 4.2, 1.3, brassD, 2.2, 1.3)
    rect(3, 1.5, 49, 6.2, wallD, 2.0, 0.6); tube((3, 6.3), (49, 6.3), 0.6, 0.6, brass, 1.0, 1.0, caps=False)   # Sturz mit Messingleiste
    rect(20.5, 2.2, 31.5, 5.2, enamel, 0.6, 0.3); rect(22.5, 3.3, 29.5, 4.1, cream, 0.2)                       # Emailleschild
    S(26, 9.4, 3.0, 2.6, lamp, 2.2, 2.2); S(26, 7.4, 3.0, 1.9, brass, 1.9, 0.8)                                 # Deckenlampe
    for s in (-1, 1):                                                                    # Pfosten, Knäufe, geschwungene Konsolen
        px = 26 + s * 22.6
        tube((px, 2.5), (px, 51.0), 1.55, 1.55, brass, 0.0, 0.0, caps=False)
        for yy in (6.3, 28.0, 49.0): S(px, yy, 0.0, 2.1, brassD, 2.1, 1.0)
        curve([(px - s * 1.5, 15.5), (px - s * 3.6, 10.6), (px - s * 8.0, 7.6)], 0.75, 0.6, brass, 1.0)
        S(px - s * 4.2, 10.4, 0.6, 1.0, brassD)
    rect(1, 51, 51, 53.2, carpet, -1.0, 0.5); tube((1, 51.2), (51, 51.2), 0.6, 0.6, brass, -1.6, -1.6, caps=False)   # Teppichkante
    rect(1, 53.2, 51, 56, steel, -1.0)
    for i in range(7): rect(1.5 + i * 7.2, 53.9, 5.1 + i * 7.2, 55.6, warnY if i % 2 == 0 else warnK, -1.4)       # Warnleiste

os.makedirs(CFG['out'], exist_ok=True)
stage(52, 56, 12); cabin(); shot('pcabin')
print('gerendert: pcabin')
