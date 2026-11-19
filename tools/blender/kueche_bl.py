# Gerichte der Kantinenküche (js/kueche.js): acht Teller und Schüsseln, schräg von oben. Bildfeld 32×28 Spielpixel.
# Gebaut wird aufrecht (x quer, y Höhe nach unten wie im Bild, d Tiefe), dann kippt ein Drehpunkt alles um 38° zur Kamera.
# Aufruf: python bl.py kueche_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kueche", "ss": 6}'
import bpy, bmesh, math, os, random
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def rev(cx, cy, prof, mat, n=32):   # Drehkörper: prof = [(Radius, Höhe über cy), ...] von innen/unten nach außen/oben
    def fn(u, v):
        k = v * (len(prof) - 1); i = min(int(k), len(prof) - 2); t = k - i
        r = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t; h = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t
        a = u * 2 * math.pi; return (cx + r * math.cos(a), cy - h, r * math.sin(a))
    grid(fn, n, (len(prof) - 1) * 3, mat)
def disc(cx, cy, r, mat, h=0.0, n=32):
    grid(lambda u, v: (cx + r * v * math.cos(u * 2 * math.pi), cy - h, r * v * math.sin(u * 2 * math.pi)), n, 3, mat)
def plate(cx, cy, r, mat, rim):
    rev(cx, cy, [(0, 0.0), (r * 0.7, 0.0), (r * 0.86, 0.5), (r, 1.4)], mat); rev(cx, cy + 0.6, [(r * 0.3, 0.0), (r * 0.92, 0.6)], rim)
def bowl(cx, cy, r, h, out, food, lvl=0.78):
    rev(cx, cy, [(r * 0.5, 0.0), (r * 0.72, h * 0.25), (r * 0.92, h * 0.6), (r, h)], out)
    rev(cx, cy, [(r * 0.94, h * 0.97), (r * 0.98, h * 1.04)], out)
    disc(cx, cy, r * 0.93, food, h * lvl)
def steam(cx, cy, k=3):
    W8 = M('#ffffff', 0.9, 0, 0.6)
    for i in range(k): S(cx - 3 + i * 3, cy - i * 2.2, -1.0 + i * 0.5, 1.2 + 0.3 * i, W8, 1.0 + 0.3 * i, 1.0)
def tilt(cx, cy, deg=38):
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in list(OBJ):
        o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = (math.radians(deg), 0, 0); OBJ.append(e)

def gericht(id):
    random.seed(id); cx = 16
    CLAY = M('#a8643c', 0.6); PORC, RIM = M('#f0ece4', 0.25, 0, 0.05), M('#3c64b4', 0.3)
    if id == 'kieselsuppe':   # Tonschüssel, grünliche Brühe, Kiesel, ein Knochen, Bohnen
        bowl(cx, 22, 11, 8, CLAY, M('#8c9c4c', 0.3, 0, 0.05))
        for x, d, r in ((-4, -2, 2.4), (2, 1, 2.0), (5, -3, 1.7)): S(cx + x, 22 - 6.6, d, r, M('#9c9ca4', 0.55), r, r * 0.8)
        tube((cx - 1, 22 - 7), (cx + 6, 22 - 12), 0.9, 0.9, M('#ece4cc', 0.5), 2.0, 2.0, caps=False)
        S(cx + 6, 22 - 12, 2.0, 1.3, M('#ece4cc', 0.5)); S(cx + 6.6, 22 - 11, 2.0, 1.2, M('#ece4cc', 0.5))
        for k in range(3): tube((cx - 7 + k * 2, 22 - 6.4), (cx - 4 + k * 2, 22 - 6.6), 0.7, 0.6, M('#4cb43c', 0.4), 4.0 - k * 2)
        steam(cx, 8)
    elif id == 'zuckerwatte':   # Holzstab im Ständer, darauf eine Wolke aus Spinnennetz-Watte
        plate(cx, 25, 9, PORC, RIM)
        tube((cx, 25), (cx, 10), 0.7, 0.7, M('#c89c5c', 0.6), 0.0, caps=False)
        PINK, PINK2 = M('#f8e0f0', 0.9, 0, 0.35), M('#e8c8f0', 0.9, 0, 0.25)
        for k in range(16):
            a = k * 2.4; r = 4.5 + (k % 3); S(cx + math.cos(a) * r * 0.8, 9 + math.sin(a * 1.3) * 3.6, math.sin(a) * 3.0, 3.2 - (k % 3) * 0.4, PINK if k % 2 else PINK2)
        S(cx, 8, 0, 5.4, PINK, 6.4, 5.0)
    elif id == 'suesssauer':   # Teller mit drei glasierten Flügeln, Ananas, Soße
        plate(cx, 22, 13, PORC, RIM)
        disc(cx, 22, 8.5, M('#e8642c', 0.25, 0, 0.1), 0.2)
        WING = M('#5c3460', 0.3)
        for k, (x, d) in enumerate(((-5, -3), (1, 2), (5, -4))):
            S(cx + x, 22 - 1.6, d, 3.6, WING, 1.2, 2.2, (0, 0.3 * k - 0.3, 0))
            for j in range(3): tube((cx + x - 2, 22 - 1.8), (cx + x + 1.5 + j, 22 - 2.8), 0.4, 0.2, M('#3c1c3c', 0.4), d - 1 + j)
        for x, d in ((-2, 4), (3, -1), (-7, 1), (7, 2)): box(cx + x - 1, 22 - 2.6, cx + x + 1, 22 - 0.6, M('#f8d848', 0.3), d - 1, d + 1)
    elif id == 'sorbet':   # Glasschale auf Stiel, drei Kugeln Raureif-Sorbet, Minzblatt
        GLASS = M('#b8e0f0', 0.08, 0, 0.12)
        rev(cx, 26, [(0, 0), (5, 0), (5.5, 0.6)], GLASS); tube((cx, 26), (cx, 18), 0.8, 0.8, GLASS, 0.0, caps=False)
        rev(cx, 18, [(1, 0), (6, 2.2), (9, 4.0), (9.6, 4.6)], GLASS)
        ICE = (M('#d8f4fc', 0.5, 0, 0.25), M('#a8dcf8', 0.5, 0, 0.2), M('#f0fcff', 0.5, 0, 0.3))
        for k, (x, y, d) in enumerate(((-3.5, 12, 1.0), (3.5, 12, 0.0), (0, 8.5, -1.0))): S(cx + x, y, d, 4.0, ICE[k])
        S(cx + 2, 5, -2.0, 1.8, M('#3cb84c', 0.4), 2.4, 0.8, (0, 0.6, 0))
    elif id == 'pudding':   # wackelnder roter Pudding mit grüner Ektoplasma-Soße
        plate(cx, 25, 12, PORC, RIM)
        rev(cx, 25, [(0, 12.0), (5, 12.0), (6.5, 10.5), (8.5, 2.0), (9, 0.2)], M('#d82c38', 0.15, 0, 0.12))
        GOO = M('#6cf090', 0.15, 0, 0.45)
        disc(cx, 25, 5.4, GOO, 12.15)
        for x, d in ((-5, -6), (2, -7.6), (6, -5)): tube((cx + x * 0.7, 13.5), (cx + x, 21 + abs(x) * 0.3), 1.0, 0.7, GOO, d * 0.7, d); S(cx + x, 21 + abs(x) * 0.3, d, 1.1, GOO)
        for x in (-2, 2): S(cx + x, 17.5, -8.2, 0.9, M('#1c0c10', 0.4))   # er schaut zurück
    elif id == 'fischstaebchen':   # vier Fischstäbchen, Zitrone, Papierserviette mit Eselsohr
        plate(cx, 22, 13, PORC, RIM)
        CR = M('#e8a03c', 0.6)
        for k in range(4): box(cx - 7 + k * 0.6, 22 - 2.2, cx + 4 + k * 0.6, 22 - 0.2, CR, -7.0 + k * 3.2, -4.6 + k * 3.2)
        S(cx + 8, 22 - 1.6, -2.0, 2.6, M('#f8e048', 0.4), 1.4, 1.6)
        box(cx - 9, 22 - 0.4, cx - 1, 22 - 0.1, M('#f8f4e8', 0.8), 3.0, 9.0)
    elif id == 'milchreis':   # Schüssel Mondmilchreis mit Zimt und einem Mondkeks
        bowl(cx, 22, 11, 8, M('#5c7cbc', 0.3), M('#f8f0d8', 0.6, 0, 0.12), 0.86)
        for k in range(14):
            a = random.random() * 6.28; r = random.random() * 8; S(cx + math.cos(a) * r, 22 - 6.95, math.sin(a) * r, 0.45, M('#8c5424', 0.7), 0.45, 0.2)
        for k in range(13):   # Mondkeks als Sichel, steckt schräg im Reis
            t = k / 12; a = math.pi * (0.15 + 0.7 * t); S(cx + 3 + math.cos(a) * 5.0, 22 - 8 - math.sin(a) * 5.0, -4.0, 0.5 + 1.5 * math.sin(t * math.pi), M('#e8c070', 0.6))
    elif id == 'gulasch':   # Uhrwerk-Gulasch: Eisentopf, dunkle Soße, Zahnräder ragen heraus, ein Knochen
        IRON = M('#3c3c44', 0.45, 0.6)
        bowl(cx, 22, 11, 9, IRON, M('#8c2c14', 0.3, 0, 0.06), 0.8)
        for x in (-12, 12): tube((cx + x * 0.95, 22 - 7), (cx + x * 1.15, 22 - 7), 1.0, 1.0, IRON, 0.0)
        BR, HOLE = M('#d8a838', 0.4, 0.45), M('#1c1408', 0.8)
        for (x, y, r, d) in ((-3, 11.5, 4.2, 3.0), (4.5, 12.5, 3.2, 1.0)):   # Zahnräder hochkant zur Kamera (gegen die Kippung gedreht)
            yy = y + d * 0.5
            grid(lambda u, v, x=x, yy=yy, r=r, d=d: (cx + x + math.cos(u * 2 * math.pi) * r * (0.35 + 0.65 * v), yy + math.sin(u * 2 * math.pi) * r * (0.35 + 0.65 * v) * 0.82, d - 5.0 - math.sin(u * 2 * math.pi) * r * (0.35 + 0.65 * v) * 0.55), 24, 2, BR)
            for k in range(10):
                a = k / 10 * 2 * math.pi; tx, ty = math.cos(a) * (r + 0.7), math.sin(a) * (r + 0.7)
                S(cx + x + tx, yy + ty * 0.82, d - 5.0 - ty * 0.55, 0.9, BR, 0.9, 0.9)
            S(cx + x, yy, d - 5.3, r * 0.33, HOLE, r * 0.33, 0.3)
        tube((cx - 8, 22 - 6.6), (cx - 4, 22 - 11), 0.9, 0.9, M('#ece4cc', 0.5), 3.0, 3.0, caps=False); S(cx - 4, 22 - 11, 3.0, 1.2, M('#ece4cc', 0.5))
        steam(cx + 1, 6)

os.makedirs(CFG['out'], exist_ok=True)
for id in ('kieselsuppe', 'zuckerwatte', 'suesssauer', 'sorbet', 'pudding', 'fischstaebchen', 'milchreis', 'gulasch'):
    if CFG.get('only') and id not in CFG['only']: continue
    stage(32, 28); gericht(id); tilt(16, 20, 0 if id == 'sorbet' else 16 if id == 'zuckerwatte' else 30); shot('dish_' + id)
print('ok')
