# Kleinvieh in HD-3D (Mondkalb und Mimik am Ende): fliegender Brief (Papierflügel, Klappe, Kulleraugen), Nachnahme-Paket (schläft, blinzelt, schnappt mit
# Pappdeckeln und Zahnreihe) und das Schiebepaket (vier Briefmarkenfarben) – dazu die Qualle aus der versunkenen Kapelle.
# Bildkoordinaten in Spielpixeln, Blick nach rechts. Aufruf:
#   python bl.py kleinvieh_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kleinvieh", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def pivot(n0, cx, cy, rot):   # alle seit OBJ[n0] erzeugten Teile ohne Eltern an ein gedrehtes Leer-Objekt hängen
    e = bpy.data.objects.new('pivot', None); bpy.context.scene.collection.objects.link(e)
    e.location = (cx - FW / 2, 0, FH - cy); bpy.context.view_layer.update()
    for o in OBJ[n0:]:
        if o.parent is None: o.parent = e; o.matrix_parent_inverse = e.matrix_world.inverted()
    e.rotation_euler = rot; OBJ.append(e)
def hinge(n0, cx, cy, deg): pivot(n0, cx, cy, (0, math.radians(deg), 0))        # in der Bildebene
def turn(n0, cx, cy, deg): pivot(n0, cx, cy, (0, 0, math.radians(deg)))         # um die Hochachse (zeigt die Seite)
def tri(a, b, c, d, mat):   # Dreieck aus Bildpunkten a, b, c in Tiefe d (als schmales Gitter)
    grid(lambda u, v: (a[0] + (b[0] - a[0]) * u + (c[0] - (a[0] + (b[0] - a[0]) * u)) * v,
                       a[1] + (b[1] - a[1]) * u + (c[1] - (a[1] + (b[1] - a[1]) * u)) * v, d), 4, 4, mat)

# ---------------- Brief: 24×18, Mitte (12, 9) ----------------
def brief(pose):
    up = pose == 'up'
    PAPER, FLAP, RED, BLUE = M('#f4f0e4', 0.75), M('#d4c6aa', 0.8), M('#c82c2c', 0.6), M('#2c5cc8', 0.6)
    INK, STAMP, WHITE, BLACK = M('#3c3c58', 0.7), M('#3c9c58', 0.55), M('#fcfcfc', 0.35), M('#100c14', 0.4)
    INSIDE, SEAL = M('#4c3c34', 0.9), M('#a81c24', 0.35)
    box(5.0, 4.0, 19.0, 14.0, PAPER, -0.8, 0.8)
    for k in range(7):
        c = RED if k % 2 == 0 else BLUE
        box(5.0 + k * 2, 4.0, 7.0 + k * 2, 4.8, c, -0.88, -0.8); box(5.0 + k * 2, 13.2, 7.0 + k * 2, 14.0, c, -0.88, -0.8)
    for k, w in enumerate((5.0, 3.6)): tube((6.6, 11.6 + k * 1.2), (6.6 + w, 11.6 + k * 1.2), 0.22, 0.22, INK, -0.9)   # Anschrift
    box(15.2, 10.4, 18.4, 13.0, WHITE, -0.92, -0.8); box(15.7, 10.9, 17.9, 12.5, STAMP, -0.98, -0.9)                  # Marke
    for ex in (9.4, 13.0):   # Kulleraugen, Pupillen in Flugrichtung
        S(ex, 9.8, -1.0, 1.15, WHITE, 0.6, 1.15); S(ex + 0.45, 10.0, -1.55, 0.55, BLACK)
    if up:   # Klappe aufgeschlagen: Innenfutter und ein Briefbogen schauen heraus
        box(5.6, 4.0, 18.4, 5.0, INSIDE, -0.95, -0.85)
        box(7.4, 2.2, 16.6, 4.6, WHITE, -0.4, -0.3)
        for k in range(2): tube((8.4, 2.9 + k * 0.9), (14.8 - k * 2, 2.9 + k * 0.9), 0.16, 0.16, INK, -0.5)
        tri((5.0, 4.1), (19.0, 4.1), (12.0, 0.5), 0.2, FLAP)
    else:    # Klappe zu, mit Siegel an der Spitze
        tri((5.0, 4.2), (19.0, 4.2), (12.0, 8.6), -0.95, FLAP)
        EDGE = M('#a89878', 0.8)
        for a in ((5.2, 4.3), (18.8, 4.3)): tube(a, (12.0, 8.5), 0.24, 0.24, EDGE, -1.0)
        S(12.0, 8.1, -1.1, 0.95, SEAL, 0.5, 0.95)
    tip = 2.4 if up else 15.8   # Papierflügel
    tri((5.0, 7.0), (5.0, 11.0), (0.5, tip), 0.0, PAPER); tri((19.0, 7.0), (19.0, 11.0), (23.5, tip), 0.0, PAPER)
    for sx, tx in ((5.0, 0.5), (19.0, 23.5)): tube((sx, 9.0), (tx + (sx - tx) * 0.25, tip + (9.0 - tip) * 0.25), 0.15, 0.1, FLAP, -0.15)

# ---------------- Nachnahme: 36×36, Boden unten, Mitte x = 18 (Deckel klappen nach außen auf wie ein Kiefer) ----------------
def nach(pose):
    o = {'sleep': 0.0, 'wake': 0.35, 'open': 1.0}[pose]
    CARD, CARD2, CARD3 = M('#a87440', 0.85), M('#c08c54', 0.85), M('#7c5028', 0.9)
    STRING, LABEL, RED = M('#e8dcc0', 0.8), M('#f8f4e8', 0.7), M('#c82c2c', 0.6)
    DARK, TOOTH, EYE, PUP = M('#1c0c08', 0.9), M('#f8f4e8', 0.3), M('#fce040', 0.3, 0, 0.6), M('#1c0c08', 0.3)
    n0 = len(OBJ)
    box(4.0, 16.0, 32.0, 36.0, CARD, -5.0, 5.0)
    box(4.0, 35.0, 32.0, 36.0, CARD3, -5.05, 5.05)
    tube((18.0, 16.2), (18.0, 35.8), 0.55, 0.55, STRING, -5.05)
    box(6.0, 28.6, 30.0, 33.8, LABEL, -5.15, -5.0)                                                      # NACHNAHME-Zettel
    for k, w in enumerate((22.0, 14.0)): tube((7.0, 30.0 + k * 2.0), (7.0 + w, 30.0 + k * 2.0), 0.35, 0.35, RED, -5.2)
    if o > 0:   # Rachen vorn oben mit Zähnen
        box(5.0, 16.0, 31.0, 16.0 + 6.5 * o, DARK, -5.12, -5.02)
        for k in range(6):
            x = 6.8 + k * 4.3; tube((x, 16.0), (x + 0.9, 16.0 + 3.2 * o), 0.95, 0.12, TOOTH, -5.3)
            if o > 0.6: tube((x + 2.1, 22.5), (x + 2.7, 20.0), 0.85, 0.12, TOOTH, -5.3)
        for ex in (12.0, 24.0):
            S(ex, 25.0, -5.1, 1.8, EYE, 0.8, 1.8); S(ex + 0.75, 25.3, -5.85, 0.8, PUP)
    else:       # schläft: Augen zu
        for ex in (12.0, 24.0): tube((ex - 1.7, 25.2), (ex + 1.7, 25.2), 0.35, 0.35, DARK, -5.2)
    for side in (-1, 1):   # Deckelklappen, an der Oberkante angeschlagen; offen schwingen sie über die Senkrechte nach außen
        m0 = len(OBJ); hx = 4.0 if side < 0 else 32.0
        box(min(hx, 18.0), 14.6, max(hx, 18.0), 16.0, CARD2, -5.0, 5.0)
        box(min(hx, 18.0), 14.6, max(hx, 18.0), 15.0, CARD3, -5.05, 5.05)
        hinge(m0, hx, 16.0, side * 105 * o)
    turn(n0, 18.0, 26.0, -18)

# ---------------- Schiebepaket: 32×32 (2×2 Kacheln), frontal ----------------
def paket(ci):
    STAMPS = ['#c83c3c', '#3c6cc8', '#3c9c58', '#e8a030']
    CARD, TOP, BOT = M('#b07c44', 0.85), M('#c8945c', 0.85), M('#8c5c2c', 0.9)
    STRING, LABEL, INK = M('#e8dcc0', 0.8), M('#f8f4e8', 0.7), M('#5c5c78', 0.7)
    STAMP, WHITE, RED, TAPE = M(STAMPS[ci], 0.55), M('#fcfcfc', 0.4), M('#c82c2c', 0.6), M('#b89c68', 0.8)
    box(0.4, 0.4, 31.6, 31.6, CARD, -6.0, 6.0)
    box(0.2, 0.2, 31.8, 2.6, TOP, -6.1, 6.1); box(0.2, 29.4, 31.8, 31.8, BOT, -6.1, 6.1)
    box(0.2, 0.2, 1.4, 31.8, BOT, -6.1, 6.1); box(30.6, 0.2, 31.8, 31.8, BOT, -6.1, 6.1)
    box(12.0, 0.1, 20.0, 5.6, TAPE, -6.25, -6.0)                                                          # Klebeband
    tube((16.0, 0.6), (16.0, 31.4), 0.75, 0.75, STRING, -6.2); tube((0.6, 16.0), (31.4, 16.0), 0.75, 0.75, STRING, -6.2)
    S(16.0, 16.0, -6.6, 1.5, STRING, 0.9, 1.2)                                                           # Knoten
    box(3.6, 4.6, 13.0, 12.0, LABEL, -6.3, -6.0)
    for k, w in enumerate((7.0, 5.0, 6.0)): tube((4.8, 6.6 + k * 1.8), (4.8 + w, 6.6 + k * 1.8), 0.26, 0.26, INK, -6.4)
    box(20.6, 3.8, 27.6, 11.4, WHITE, -6.3, -6.0); box(21.4, 4.6, 26.8, 10.6, STAMP, -6.4, -6.25)
    for k in range(4): S(20.6 + k * 2.33, 3.8, -6.35, 0.45, CARD); S(20.6 + k * 2.33, 11.4, -6.35, 0.45, CARD)  # Zähnung
    box(18.0, 19.6, 28.4, 26.4, RED, -6.3, -6.0); box(18.8, 22.0, 27.6, 23.8, WHITE, -6.4, -6.25)         # ZERBRECHLICH
    tube((22.0, 20.4), (22.0, 21.6), 0.5, 0.3, WHITE, -6.45); tube((24.4, 24.4), (24.4, 25.6), 0.3, 0.5, WHITE, -6.45)

# ---------------- Qualle: 20×24, Glockenmitte x = 10, Oberkante y = 2 ----------------
def qualle(pose):
    sq = pose == 'sq'; ph = 1.0 if pose == 'b' else 0.0
    BELL, RIM, CORE = M('#c870e8', 0.25, 0, 0.35, 0.6), M('#e8a0fc', 0.3, 0, 0.5), M('#fcd8ff', 0.2, 0, 1.4)
    TENT = M('#e8a0fc', 0.35, 0, 0.45)
    rx, rz, top = (7.6, 3.6, 4.0) if sq else (6.4, 5.4, 2.0)
    base = top + rz
    grid(lambda u, v: (10.0 + rx * math.sin(v * math.pi / 2) * math.cos(u * 2 * math.pi), top + rz * (1 - math.cos(v * math.pi / 2)),
                       rx * 0.8 * math.sin(v * math.pi / 2) * math.sin(u * 2 * math.pi)), 24, 8, BELL)
    S(10.0, base - rz * 0.45, -1.0, rx * 0.42, CORE, rx * 0.3, rz * 0.32)                                  # leuchtender Kern
    for k in range(12):   # Saum
        a = k / 12 * 2 * math.pi; S(10.0 + math.cos(a) * rx * 0.96, base + 0.2, math.sin(a) * rx * 0.75, 0.75, RIM)
    for k in range(5):    # Tentakel, schwingen je nach Bild
        x0 = 10.0 + (k - 2) * rx * 0.36; L = (6.0 if sq else 9.0) + (k % 2) * 3.0
        pts = []
        for i in range(10):
            t = i / 9; sw = math.sin(t * 3.0 + k * 1.3 + ph * math.pi) * (0.8 + t * 1.6) * (0.4 if sq else 1.0)
            pts.append((x0 + sw, base + 0.6 + t * L))
        for i in range(9): tube(pts[i], pts[i + 1], 0.5 - i * 0.035, 0.5 - (i + 1) * 0.035, TENT, (k - 2) * 0.6)

# ---------------- Mondkalb: 24×22, Hufe unten, Mitte x = 12 (Mondgestein mit Kratern, goldene Hörnchen, Käseglocke am Hals) ----------------
def kalb(pose):
    MOON, BELLY, CRATER = M('#e8e4dc', 0.9), M('#f6f2ea', 0.85), M('#a8a4b4', 0.95)
    HEAD, PINK, DARK = M('#f4f0e8', 0.8), M('#e8a8b0', 0.6), M('#141018', 0.3)
    GOLD, HOOF, CHEESE = M('#f8d878', 0.3, 0.8), M('#8c8898', 0.6), M('#f8c838', 0.6, 0, 0.1)
    sq = pose == 'squash'; air = pose == 'air'
    by, rz, rx = (15.6, 3.6, 7.2) if sq else (13.2, 4.4, 6.6)
    if air: by -= 1.0
    # Beinchen
    for lx, d in ((6.6, 1.6), (8.4, -1.8), (14.0, 1.6), (15.8, -1.8)):
        top = (lx, by + rz * 0.6)
        if air: foot = (lx - 1.6, 20.0)
        elif sq: foot = (lx + (0.8 if lx > 11 else -0.8), 21.0)
        else: foot = (lx, 21.0)
        tube(top, foot, 1.05, 0.9, MOON, d); S(foot[0], foot[1] + 0.2, d, 1.05, HOOF, 1.0, 0.7)
    S(11.0, by, 0.0, rx, MOON, 4.6, rz)
    S(11.4, by + rz * 0.45, -1.6, rx * 0.7, BELLY, 3.0, rz * 0.5)
    for cx_, cy_, r in ((7.6, by - 1.4, 1.2), (12.4, by - 2.4, 0.9), (14.6, by + 0.6, 1.1), (9.6, by + 1.4, 0.7)):
        S(cx_, cy_, -4.1, r, CRATER, 0.5, r * 0.9)
    tube((4.6, by - 0.6), (2.0, by - 2.8), 0.55, 0.35, MOON, 0.6); S(1.8, by - 3.0, 0.6, 1.0, BELLY)   # Schwänzchen
    hx, hy = 17.6, by - 4.2 + (1.0 if sq else 0.0)
    tube((14.6, by - 1.6), (hx - 0.6, hy + 1.4), 2.0, 1.8, MOON, 0.0)                                # Hals
    S(hx - 1.6, hy + 2.4, 0.0, 2.5, GOLD, 2.4, 0.5)                                                  # Halsband
    tube((hx - 0.8, hy + 3.0), (hx - 0.6, hy + 4.6), 0.15, 0.15, GOLD, -2.2); S(hx - 0.6, hy + 5.0, -2.3, 0.95, CHEESE, 0.5, 0.8)  # Käseglocke
    S(hx, hy, -0.4, 3.3, HEAD, 2.9, 3.0)
    S(hx + 2.6, hy + 1.2, -0.8, 1.7, PINK, 1.4, 1.3)
    for nz in (-1.6, 0.4): S(hx + 3.9, hy + 1.0, nz - 0.4, 0.3, DARK)
    S(hx + 0.9, hy - 0.8, -2.5, 0.65, DARK, 0.4, 0.75); S(hx + 1.1, hy - 1.1, -2.9, 0.22, M('#ffffff', 0.2, 0, 1.5))
    S(hx - 1.8, hy - 1.4, 1.6, 1.1, HEAD, 0.6, 0.7)                                                  # Ohr
    tube((hx - 1.0, hy - 2.4), (hx - 2.0, hy - 6.0), 0.65, 0.12, GOLD, 1.2); tube((hx + 0.8, hy - 2.6), (hx + 1.6, hy - 6.2), 0.65, 0.12, GOLD, -1.2)

# ---------------- Mimik: 20×30, Leuchterfuß unten, Mitte x = 10 (Kerze mit Zähnen, roten Augen, Beinchen) ----------------
def mimik(pose):
    GOLD, GOLD2 = M('#c89c30', 0.3, 0.85), M('#f0cc60', 0.25, 0.9)
    WAX, WAX2, DARK = M('#d4c49c', 0.6, 0, 0.0, 0.35, 0.3), M('#e4d6b4', 0.55, 0, 0.0), M('#1c0404', 0.8)
    GUM, TOOTH, RED = M('#a01820', 0.5), M('#fcfcfc', 0.3), M('#fc2c2c', 0.2, 0, 3.0)
    BROW, WICK = M('#5c3c24', 0.7), M('#3c3020', 0.8)
    FL, FL2 = M('#fca030', 0.4, 0, 3.0), M('#fcf0a0', 0.3, 0, 4.0)
    op = {'shut': 0.0, 'open_a': 0.75, 'open_b': 1.0}[pose]; b = pose == 'open_b'
    for lx, d, sw in ((7.8, 1.2, -1), (12.2, -1.2, 1)):   # Beinchen
        k = (1 if b else -1) * sw * 0.9
        tube((lx, 26.6), (lx + k, 29.6), 0.55, 0.45, GOLD, d); S(lx + k + 0.5, 29.7, d, 0.9, GOLD, 0.7, 0.4)
    S(10.0, 26.0, 0.0, 6.2, GOLD, 5.2, 1.1); S(10.0, 25.2, 0.0, 4.8, GOLD2, 4.2, 0.7)              # Leuchterteller
    tube((10.0, 25.4), (10.0, 10.6), 4.5, 4.2, WAX, 0.0); S(10.0, 10.6, 0.0, 4.2, WAX2, 4.0, 0.9)
    for dx, L in ((-3.2, 4.0), (1.6, 6.5), (3.6, 2.6)):                                                # Wachsnasen
        tube((10.0 + dx, 10.8), (10.0 + dx * 1.05, 10.8 + L), 0.7, 0.55, WAX2, -math.sqrt(max(0.1, 17.6 - dx * dx)) - 0.1); S(10.0 + dx * 1.05, 11.0 + L, -math.sqrt(max(0.1, 17.6 - dx * dx)) - 0.1, 0.7, WAX2)
    mx = 10.6
    if op > 0:
        S(mx, 18.8, -4.0, 3.7, DARK, 0.8, 1.4 + 2.4 * op); S(mx, 19.6 + op, -4.3, 2.4, GUM, 0.5, 1.0 * op)
        for k in range(4):
            tube((mx - 2.7 + k * 1.8, 17.0 - 0.8 * op), (mx - 2.5 + k * 1.8, 18.6), 0.6, 0.05, TOOTH, -4.6)
            tube((mx - 1.8 + k * 1.8, 20.2 + 2.2 * op), (mx - 1.6 + k * 1.8, 19.0 + 1.8 * op), 0.55, 0.05, TOOTH, -4.6)
    else:
        for k in range(4): tube((mx - 2.8 + k * 1.4, 18.4 + (k % 2) * 0.8), (mx - 1.4 + k * 1.4, 18.4 + ((k + 1) % 2) * 0.8), 0.5, 0.5, DARK, -4.4)   # Zickzack-Grinsen
    for ex in (8.0, 12.8):   # böse Augen
        S(ex, 14.2, -3.9, 1.75, DARK, 0.6, 1.6); S(ex + 0.35, 14.5, -4.6, 0.8, RED)
        tube((ex - 1.9, 11.6 + (0.0 if ex < 10 else 1.2)), (ex + 1.9, 11.6 + (1.2 if ex < 10 else 0.0)), 0.5, 0.5, BROW, -4.3)
    tube((10.0, 10.4), (10.2, 8.6), 0.28, 0.25, WICK, 0.0)
    lean = 0.6 if b else -0.4
    S(10.2 + lean * 0.5, 6.2, 0.0, 1.5, FL, 1.2, 2.7); S(10.2 + lean * 0.2, 7.2, -0.6, 0.8, FL2, 0.6, 1.4)

JOBS = [('brief_up', 24, 18, brief, 'up'), ('brief_down', 24, 18, brief, 'down')]
JOBS += [('nach_' + p, 36, 36, nach, p) for p in ('sleep', 'wake', 'open')]
JOBS += [('paket%d' % c, 32, 32, paket, c) for c in range(4)]
JOBS += [('qualle_' + p, 20, 24, qualle, p) for p in ('a', 'b', 'sq')]
JOBS += [('kalb_' + p, 24, 22, kalb, p) for p in ('idle', 'squash', 'air')]
JOBS += [('mimik_' + p, 20, 30, mimik, p) for p in ('shut', 'open_a', 'open_b')]
os.makedirs(CFG['out'], exist_ok=True)
for name, w, h, fn, arg in JOBS:
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); fn(arg); shot(name)
print('ok')
