# Frostgeist für NACHTMAHR: schwebender Kapuzengeist aus Eisnebel mit Eiskrone, Blick nach rechts. Bildfeld 48×56 Spielpixel.
# Posen: float0, float1 (Schleppe weht), cast (Arme erhoben, Hände leuchten).
# Aufruf: python bl.py frost_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_frost", "ss": 6}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def geist(pose):
    ROBE, ROBE2, MIST, ICE, ICE2, EYE, VOID = M('#3c6aa4', 0.45, 0, 0.03), M('#1e3a6c', 0.5, 0, 0.02), M('#9cd0ec', 0.3, 0, 0.25), M('#8cd8f4', 0.06, 0, 0.35), M('#d8f8ff', 0.04, 0, 0.8), M('#20e8fc', 0.2, 0, 3.0), M('#0c1424', 0.9)
    ph = {'float0': 0.0, 'float1': 1.0, 'cast': 0.5}[pose]
    cx = 22
    # Kutte: Kegelmantel, unten in Fetzen zur Schleppe ausgefranst
    def robe(u, v):
        a = math.pi * (0.15 + 0.7 * u); r = 4 + v * 10; x = cx - 1 + math.cos(a) * r * 0.9 - v * v * (6 + 3 * ph); y = 14 + v * 34
        return (x + math.sin(v * 5 + ph * 2 + u * 3) * v * 1.5, y, -math.sin(a) * r - 1)
    grid(robe, 10, 8, ROBE)
    def robe_back(u, v):
        a = math.pi * (1.15 + 0.7 * u); r = 4 + v * 10; x = cx - 1 + math.cos(a) * r * 0.9 - v * v * (6 + 3 * ph); y = 14 + v * 34
        return (x, y, -math.sin(a) * r + 1)
    grid(robe_back, 10, 8, ROBE2)
    for k in range(6):   # Nebelfetzen der Schleppe
        t = k / 5; S(cx - 6 - t * (10 + 4 * ph), 44 + t * 6 + math.sin(t * 7 + ph) * 2, 0.0, 3.6 - t * 2.4, MIST, 2.6 - t, 2.0 - t * 1.2)
    # Kapuze und leeres Gesicht mit zwei Augenlichtern
    S(cx + 2, 12, 0.0, 7.0, ROBE, 6.4, 7.6); S(cx + 5.5, 13, -3.4, 4.4, VOID, 2.6, 4.8)
    for d in (-2.6, -0.4): S(cx + 7.4, 12, d - 3.0, 1.1, EYE)
    # Eiskrone
    for i, (dx, h) in enumerate(((-4, 7), (-1, 10), (2, 12), (5, 9), (7, 6))):
        tube((cx + dx, 6.5), (cx + dx + 0.6, 6.5 - h), 1.4, 0.15, ICE2 if i == 2 else ICE, 0.0)
    # Arme und Hände
    if pose == 'cast':
        for d, (hx, hy) in ((-4.0, (cx + 13, 2)), (4.0, (cx + 4, 0))):
            tube((cx + 3, 20), (hx - 1, hy + 6), 2.2, 1.4, ROBE2, d); S(hx, hy + 4, d - 1, 2.0, ICE2); S(hx, hy + 4, d - 1, 3.0, MIST, 0.8, 3.0)
    else:
        for d, (hx, hy) in ((-4.0, (cx + 10, 30 - ph * 2)), (4.0, (cx + 7, 32 + ph * 2))):
            tube((cx + 3, 20), (hx, hy), 2.2, 1.4, ROBE2, d); S(hx + 0.8, hy + 1, d - 1, 1.8, ICE)
            for k in range(3): tube((hx + 1, hy + 1), (hx + 3.5, hy + 2 + k * 1.2), 0.5, 0.15, ICE2, d - 1 + k * 0.6)
    # Eissplitter, die um ihn kreisen
    for k in range(3):
        a = k * 2.1 + ph * 1.1; tube((cx + math.cos(a) * 15, 24 + math.sin(a) * 9), (cx + math.cos(a) * 15 + 0.6, 28 + math.sin(a) * 9), 1.0, 0.1, ICE, -6.0)

os.makedirs(CFG['out'], exist_ok=True)
for pose in ('float0', 'float1', 'cast'):
    if CFG.get('only') and pose not in CFG['only']: continue
    stage(48, 56); geist(pose); shot('frost_' + pose)
print('ok')
