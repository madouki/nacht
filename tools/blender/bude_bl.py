# Wurfbude „Dosenwerfen“ (Lichterpassage, js/bude.js): Jahrmarktsbude mit rot-weiß gestreiftem, schrägem Vordach und Bogenkante,
# Holzpfosten, Bretterwand, Regal mit drei Dosenpyramiden, Lebkuchenherzen als Preise an der Wand, gestreifter Tresen mit
# Ballkorb. Bildfeld 96×56 (6 Kacheln breit), Boden unten. Schild und Lichterkette zeichnet das Spiel darüber (Sprache, Blinken).
# Aufruf: python bl.py bude_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_bude", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def bude():
    RED, WHITE, GOLD = M('#b41c24', 0.7, 0, 0, 0.3, 0.2), M('#f0e8dc', 0.75, 0, 0, 0.3, 0.2), M('#d8a838', 0.3, 0.85)
    WOOD, WOODL, PLANK, PLANK2, DARK = M('#5c3818', 0.6), M('#a8703c', 0.5), M('#4a2c18', 0.8), M('#3c2414', 0.85), M('#1c0e08', 0.9)
    CANS = [M('#c83c3c', 0.3, 0.6), M('#3c78c8', 0.3, 0.6), M('#e8b840', 0.3, 0.6)]
    TIN, GINGER, ICING, BALL, WICK = M('#d8d8e0', 0.25, 0.9), M('#9c5424', 0.7), M('#fcf4e8', 0.5), M('#ece4cc', 0.55), M('#a07838', 0.85)
    # Bretterwand hinten mit Fugen
    box(4, 10, 92, 45, PLANK, 2.0, 5.0)
    for y in (16.5, 23, 29.5, 36, 42.5): box(4, y, 92, y + 0.7, PLANK2, 1.7, 2.0)
    # Pfosten
    for x in (3.2, 92.8): tube((x, 6.0), (x, 56.0), 2.0, 2.0, WOOD, -3.0, caps=False); S(x, 6.0, -3.0, 2.3, WOODL)
    # Regal mit drei Dosenpyramiden
    box(7, 33, 89, 35, WOODL, -2.5, 2.0)
    for k, px in enumerate((22.0, 48.0, 74.0)):
        for row, n in enumerate((3, 2, 1)):
            for i in range(n):
                x = px + (i - (n - 1) / 2) * 4.7; y1 = 33.0 - row * 5.8; y0 = y1 - 5.6; c = CANS[(i + row + k) % 3]
                tube((x, y0), (x, y1), 2.2, 2.2, c, -0.6, caps=False)
                for yy in (y0 + 0.3, y1 - 0.3): tube((x, yy - 0.35), (x, yy + 0.35), 2.32, 2.32, TIN, -0.6, caps=False)
                box(x - 1.0, y0 + 2.2, x + 1.0, y0 + 3.6, ICING, -2.9, -2.7)   # Etikett
    # Lebkuchenherzen an Bändern zwischen den Pyramiden (Preise)
    for hx in (35.0, 61.0):
        tube((hx - 3.0, 11.5), (hx, 16.5), 0.25, 0.25, RED, 1.0, caps=False); tube((hx + 3.0, 11.5), (hx, 16.5), 0.25, 0.25, RED, 1.0, caps=False)
        hy = 19.0
        for s in (-1, 1): S(hx + s * 1.9, hy, 0.5, 2.5, GINGER, 0.9, 2.4)
        tube((hx, hy + 1.0), (hx, hy + 5.5), 3.4, 0.4, GINGER, 0.5, caps=False)
        for k in range(15):   # Zuckergussrand rundherum
            t = k / 14
            if t < 0.5: a = math.pi * (1.0 - t * 2.2); ex, ey = hx - 1.9 + math.cos(a) * 1.9, hy - math.sin(a) * 1.8
            else: a = math.pi * (1.2 - (t - 0.5) * 2.4); ex, ey = hx + 1.9 + math.cos(a) * 1.9, hy - math.sin(a) * 1.8
            S(ex, ey, -0.9, 0.32, ICING)
        for s in (-1, 1): tube((hx + s * 2.9, hy + 1.2), (hx + s * 0.4, hy + 4.6), 0.32, 0.32, ICING, -0.5, caps=True)
        S(hx, hy + 1.6, -0.8, 0.9, RED, 0.35, 0.9); S(hx - 1.6, hy + 0.4, -0.7, 0.45, ICING); S(hx + 1.6, hy + 0.4, -0.7, 0.45, ICING)
    # Vordach: schräge Bahnen rot/weiß, unten eine Bogenkante, Goldborte
    for i in range(8):
        x0 = i * 12.0; mat = RED if i % 2 == 0 else WHITE
        grid(lambda u, v, x0=x0: (x0 + u * 12.0, 1.0 + v * 9.0, 3.0 - v * 10.0), 1, 1, mat)
        S(x0 + 6.0, 10.3, -7.2, 6.0, mat, 0.9, 2.6)
    tube((-1.0, 10.0), (97.0, 10.0), 0.6, 0.6, GOLD, -7.6, caps=False)
    tube((-1.0, 1.0), (97.0, 1.0), 1.1, 1.1, WOOD, 3.0, caps=False)
    for i in range(9): S(i * 12.0, 10.2, -7.8, 0.9, GOLD)   # Knöpfe an den Bahnkanten
    # Tresen: Brett oben, gestreifte Front
    box(-1, 42.5, 97, 45.2, WOODL, -10.0, -1.0)
    for i in range(6): box(i * 16.0, 45.2, i * 16.0 + 16.0, 56.0, RED if i % 2 == 0 else WHITE, -8.5, -2.0)
    box(-1, 54.8, 97, 56.0, WOOD, -9.0, -1.5)
    # Ballkorb rechts auf dem Tresen
    tube((80.0, 37.6), (80.0, 42.5), 4.6, 3.8, WICK, -6.0, caps=False)
    for k in range(3): tube((80.0, 38.6 + k * 1.4), (80.0, 39.0 + k * 1.4), 4.5 - k * 0.25, 4.5 - k * 0.25, DARK if k == 1 else WICK, -6.0, caps=False)
    for bx, by, bd in ((77.8, 36.6, -6.5), (81.6, 36.2, -6.8), (79.6, 35.0, -5.0)): S(bx, by, bd, 2.0, BALL); tube((bx - 2.0, by), (bx + 2.0, by), 0.35, 0.35, RED, bd - 0.4, caps=False)
    # warmes Licht unter dem Vordach (die Bude leuchtet in der dunklen Passage)
    L = bpy.data.lights.new('budeL', 'POINT'); L.energy = 2600; L.color = (1.0, 0.78, 0.5); L.shadow_soft_size = 6
    o = bpy.data.objects.new('budeL', L); bpy.context.scene.collection.objects.link(o); o.location = (0, -14, 56 - 16); OBJ.append(o)

os.makedirs(CFG['out'], exist_ok=True)
stage(96, 56); bude(); shot('bude')
print('ok')
