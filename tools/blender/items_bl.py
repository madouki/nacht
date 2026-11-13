# Sammelgegenstände für NACHTMAHR in Blender: kleines Herz (8×8), großes Herz (14×12), Geldsack rot / violett (12×15),
# Braten (16×13), Kristallkugel (16×15, zwei Bilder). Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'what': [...]}.
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

def heart(cx, ly, r, tip):  # zwei Kugeln und ein Kegel mit der Spitze nach unten; ly = Mitte der Bögen, tip = Spitze
    red, glint = M('#e01830', 0.22, 0, 0.25, 0.8), M('#ffe0e0', 0.3, 0, 2.6)
    for s in (-1, 1): S(cx + s * r * 0.86, ly, 0, r, red, r * 0.8, r)
    base = ly + r * 0.05; hz = (tip - base) / 2
    add('k', cx, base + hz, 0, r * 1.84, r * 0.8, hz, red, (math.radians(180), 0, 0))
    S(cx, ly + r * 0.7, 0, r * 1.3, red, r * 0.8, r * 1.05)                                   # füllt die Flanken (bauchige Herzform)
    S(cx - r * 0.95, ly - r * 0.4, -r * 0.8, r * 0.34, glint, r * 0.3, r * 0.28)

def bag(col, tie):  # praller Sack mit Kordel und Goldmünze
    cloth, clothD, gold = M(col, 0.75), M(col, 0.9), M('#f0c040', 0.25, 0.9)
    S(6, 9.9, 0, 5.7, cloth, 4.8, 5.0); S(4.0, 8.8, -2.8, 2.5, cloth, 2.0, 2.8)
    S(6, 5.2, 0, 3.0, clothD, 2.4, 1.2)
    for a in (-1.5, -0.5, 0.5, 1.5): S(6 + a * 1.7, 2.3 + abs(a) * 0.35, 0, 1.45, cloth, 1.3, 1.7)   # Zipfel über der Kordel
    S(6, 4.6, -0.6, 3.2, M(tie, 0.4, 0.5), 2.6, 0.7)
    S(7.0, 10.4, -4.4, 2.1, gold, 0.6, 2.1); S(7.0, 10.4, -5.0, 1.2, M('#a87018', 0.4, 0.9), 0.3, 1.2)

def roast():  # Braten auf dem Silberteller, Knochen ragt heraus
    meat, meatL, bone, plate, green = M('#b05a18', 0.3, 0, 0, 0.7), M('#e09040', 0.3), M('#f4ecd8', 0.5), M('#c8ccd8', 0.25, 0.8), M('#3c9c40', 0.6)
    S(8, 11.3, 0, 7.4, plate, 5.0, 1.5); S(8, 10.6, 0, 6.2, M('#8c90a0', 0.3, 0.8), 4.2, 0.8)
    S(7.0, 7.2, 0, 5.4, meat, 4.0, 3.7); S(5.6, 6.0, -2.6, 2.6, meatL, 1.6, 1.7)
    tube((11.0, 5.0), (14.0, 2.4), 0.8, 0.8, bone, 0, 0, caps=False); S(14.3, 2.0, 0, 1.25, bone); S(13.4, 1.6, 0.4, 1.0, bone)
    S(2.4, 10.0, -2.0, 1.4, green); S(12.8, 10.2, -2.0, 1.3, green); S(13.9, 9.6, -1.0, 1.0, M('#e03020', 0.4))

def orb(ph):  # Kristallkugel: glühender Kern, heller Rand, Glanzlicht
    glass, core, glint = M('#1c9ce8' if ph == 0 else '#48c4ff', 0.12, 0, 0.3 if ph == 0 else 0.7, 1.0), M('#e8fcff', 0.3, 0, 3.2), M('#ffffff', 0.3, 0, 4.0)
    S(7.5, 7.5, 0, 7.1, glass, 7.1, 7.1)
    S(8.6 - ph * 1.6, 8.6 - ph * 1.4, -5.6, 2.6 + ph * 0.5, core, 1.2, 2.6 + ph * 0.5)
    S(4.9, 4.4, -5.8, 1.5, glint, 0.8, 1.2); S(10.6, 11.2, -5.2, 0.7, glint, 0.5, 0.6)

def run():
    os.makedirs(CFG['out'], exist_ok=True); what = CFG.get('what') or ['heart', 'bag', 'roast', 'orb']
    if 'heart' in what:
        stage(8, 8, 24); heart(3.5, 2.6, 2.0, 7.7); shot('heartS_0')
        stage(14, 12, 24); heart(6.5, 3.7, 3.55, 11.8); shot('heartB_0')
    if 'bag' in what:
        stage(12, 15, 24); bag('#c02424', '#f0c040'); shot('bag_0'); bag('#8438cc', '#f0f0f0'); shot('bagBig_0')
    if 'roast' in what:
        stage(16, 13, 24); roast(); shot('roast_0')
    if 'orb' in what:
        stage(16, 15, 24)
        for i in range(2): orb(i); shot('orb_%d' % i)
    print('gerendert:', what)
run()
