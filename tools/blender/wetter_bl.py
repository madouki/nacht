# Wetterhahn für NACHTMAHR: Kupferhahn mit Grünspan, vergoldetem Kamm, Schnabel und Kehllappen, Sichelfedern aus Blech, sitzt auf
# einem eisernen Windpfeil mit abgerissenem Dachstab. Blick nach rechts. Bildfeld 40×36 Spielpixel, Mitte bei (20, 18).
# Posen: glide0, glide1 (Schwanz wippt), aim (kräht, Pfeilspitze glüht), dash (gestreckt, Schwanz flach).
# Aufruf: python bl.py wetter_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_wetter", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def hahn(pose):
    COP, COPD, GOLD = M('#5c9a86', 0.5, 0.5), M('#2e6658', 0.55, 0.45), M('#e0b040', 0.25, 0.9)
    BARE = M('#b0703c', 0.35, 0.85)   # blankes Kupfer unter dem Grünspan
    IRON, RUST, EYE = M('#2c2c34', 0.5, 0.7), M('#8c4c2c', 0.75, 0.3), M('#ffd060', 0.2, 0, 2.5)
    HOT = M('#ff9040', 0.2, 0, 4.0) if pose == 'aim' else IRON
    cx, cy = 20.0, 18.0
    st = 1.0 if pose == 'dash' else 0.0           # gestreckt
    puff = 1.0 if pose == 'aim' else 0.0          # Brust raus
    # Rumpf, Brust, Flügel aus Blech mit Nietenreihe
    S(cx, cy, 0.0, 7.4 + st * 1.4, COP, 3.6, 6.0 - st * 1.2)
    S(cx + 4.2 + st, cy - 1.0, -0.6, 4.2 + puff, COP, 3.4 + puff * 0.4, 4.6 + puff)
    S(cx - 0.8, cy - 0.6, -3.4, 5.2 + st, COPD, 0.8, 3.0 - st * 0.6, (0, -0.25, 0))
    for k in range(4): S(cx - 4.0 + k * 2.4, cy + 1.4 - k * 0.6, -4.2, 0.45, GOLD)
    for x, y in ((-4.5, 3.2), (2.5, 4.0), (5.2, -3.4)): S(cx + x + st, cy + y, -2.9, 1.5, BARE, 0.5, 1.0)
    # Hals und Kopf
    hx, hy = cx + 7.6 + st * 3.0, cy - 9.2 + st * 4.2 - puff * 0.6
    tube((cx + 4.6 + st, cy - 3.6 + st), (hx - 0.6, hy + 1.6), 3.4, 2.8, COP, 0.0)
    S(hx, hy, 0.0, 3.0, COP, 2.6, 3.0)
    for k, (x, y, r) in enumerate(((-1.6, -3.2, 1.3), (0.0, -3.8, 1.5), (1.6, -3.1, 1.3), (2.8, -2.0, 0.9))): S(hx + x, hy + y, 0.0, r, GOLD, 0.8, r)
    if pose == 'aim':   # Schnabel weit auf: er kräht
        tube((hx + 2.4, hy - 0.6), (hx + 5.8, hy - 2.0), 1.0, 0.2, GOLD, 0.0); tube((hx + 2.4, hy + 0.4), (hx + 5.2, hy + 1.6), 0.8, 0.2, GOLD, 0.0)
        S(hx + 3.0, hy - 0.1, -0.4, 0.7, M('#601818', 0.7))
    else: tube((hx + 2.4, hy - 0.2), (hx + 5.6, hy + 0.4), 1.1, 0.2, GOLD, 0.0)
    S(hx + 2.0, hy + 2.4, -0.6, 0.9, GOLD, 0.6, 1.4)
    S(hx + 0.9, hy - 0.8, -2.5, 0.85, EYE, 0.4, 0.85); S(hx + 1.2, hy - 1.1, -2.9, 0.3, M('#ffffff', 0.1, 0, 3.0))
    # Sichelfedern: Fächer nach hinten oben
    base = (cx - 5.6 - st, cy - 1.6 + st * 0.6)
    a0, a1 = {'glide0': (100, 160), 'glide1': (110, 168), 'aim': (88, 176), 'dash': (160, 186)}[pose]
    for k in range(5):   # flache, gebogene Blechfedern
        a = math.radians(a0 + (a1 - a0) * k / 4); L = 13.0 - abs(k - 1.5) * 1.3 + st * 2; d = 0.6 - k * 0.35
        mat = COP if k % 2 else COPD
        for i in range(22):
            t = i / 21; bend = math.radians(-28 * t * t)
            r = L * t; x = base[0] + math.cos(a + bend) * r; y = base[1] - math.sin(a + bend) * r - 1.4 * math.sin(math.pi * t)
            S(x, y, d, 1.9 - 1.3 * t, mat, 0.55, 1.7 - 1.3 * t, (0, -(a + bend) + math.pi / 2, 0))
    # Beine greifen den Windpfeil
    ay = cy + 9.6 - st * 2.0
    for d, mat in ((1.6, COPD), (-1.6, COP)):
        tube((cx + 0.6 + d * 0.4, cy + 4.6 - st), (cx + 1.2 + d * 0.4, ay - 0.8), 0.8, 0.6, mat, d)
        S(cx + 1.6 + d * 0.4, ay - 0.4, d, 1.2, GOLD, 0.7, 0.6)
    # Windpfeil: Schaft, Spitze, Fiederung; darunter der abgerissene Dachstab
    tube((cx - 15.0, ay), (cx + 14.0, ay), 0.7, 0.7, IRON, 1.2)
    S(cx + 15.6, ay, 1.2, 3.2, HOT, 0.4, 1.9); S(cx + 13.4, ay, 1.2, 0.9, IRON)
    if pose == 'aim': S(cx + 16.6, ay, 0.6, 0.9, M('#ffd080', 0.2, 0, 6.0))
    S(cx - 14.6, ay - 1.6, 1.2, 2.2, IRON, 0.35, 1.6, (0, 0.6, 0)); S(cx - 14.6, ay + 1.6, 1.2, 2.2, IRON, 0.35, 1.6, (0, -0.6, 0))
    for x in (-9.0, 8.0): S(cx + x, ay, 1.2, 0.9, RUST, 0.9, 0.9)
    if pose != 'dash':
        tube((cx + 1.2, ay), (cx + 1.2, ay + 5.4), 0.65, 0.6, IRON, 1.2)
        S(cx + 1.0, ay + 5.6, 1.2, 0.9, RUST, 0.8, 0.6); S(cx + 1.7, ay + 6.0, 1.0, 0.5, RUST)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('glide0', 'glide1', 'aim', 'dash'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(40, 36); hahn(pose); shot('wetter_' + pose)
print('ok')
