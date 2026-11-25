# Die Knochenkapelle (js/kapelle.js): drei Calaca-Mariachis – Guitarrón, Trompete, Geige. Charro-Anzug (kurze schwarze Jacke,
# Silberknöpfe an den Hosennähten), breiter Sombrero mit Goldborte, rote Fliege, bemalter Zuckerschädel. Blick nach rechts.
# Je zwei Spielbilder (0/1). Bildfeld 32×48, Füße bei (16, 48).
# Aufruf: python bl.py kapelle_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kapelle", "ss": 8}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers6', 'exec'))

def musiker(kind, f):
    BONE, BONE2, DARK = M('#ece4cc', 0.55), M('#b4a888', 0.65), M('#100a0c', 0.9)
    SUIT, SUIT2, SILVER, GOLD, RED = M('#1c1a22', 0.7, 0, 0, 0.3, 0.3), M('#2e2a38', 0.7), M('#d8d8e0', 0.25, 0.9), M('#d8a838', 0.3, 0.85), M('#c01c30', 0.6)
    HAT, HAT2 = M('#2a2016', 0.75), M('#6c5030', 0.7)
    TEAL, PINK, YEL, ORA = M('#20c8c0', 0.4), M('#f050a0', 0.4), M('#f8d020', 0.4), M('#f89820', 0.6)
    WOOD, WOOD2, BRASS = M('#a0602c', 0.4), M('#5c3418', 0.5), M('#e8b848', 0.22, 0.95)
    cx, bob = 16.0, (0.6 if f else 0.0)
    # Beine mit Silberknöpfen, Stiefel
    for x, d in ((14.0, 1.0), (18.0, -1.0)):
        tube((x, 31), (x, 45.5), 1.5, 1.3, SUIT, d); S(x + 0.6, 46.6, d, 2.2, M('#1a1210', 0.5), 1.8, 1.4)
        for k in range(5): S(x + 1.3, 33 + k * 2.5, d - 1.4, 0.35, SILVER)
    # Jacke, Weste, Fliege
    tube((cx, 19 - bob), (cx, 31), 4.6, 4.2, SUIT2, 0.0)
    box(cx + 0.6, 20 - bob, cx + 4.2, 30, M('#e8e0d0', 0.6), -4.6, -3.8)              # Hemd
    for k in range(3): S(cx + 3.2, 22.5 - bob + k * 2.6, -4.7, 0.42, SILVER)
    S(cx + 2.4, 20.2 - bob, -5.0, 1.0, RED, 0.6, 0.7); S(cx + 3.8, 20.2 - bob, -5.0, 1.0, RED, 0.6, 0.7); S(cx + 3.1, 20.2 - bob, -5.2, 0.5, RED)   # Fliege
    tube((cx - 4.4, 19.5 - bob), (cx + 4.4, 19.5 - bob), 1.4, 1.4, SUIT, 0.0)        # Schultern
    # Schädel mit Calaca-Bemalung
    hx, hy = cx + 1.2, 12.5 - bob
    tube((cx + 0.5, 18.5 - bob), (hx - 0.5, hy + 3), 0.8, 0.8, BONE2, 0.0)
    S(hx, hy, 0.0, 4.0, BONE, 3.7, 4.3); S(hx + 1.2, hy + 3.9, -0.2, 2.6, BONE2, 2.4, 1.2)
    for ex in (hx + 0.2, hx + 2.6):
        S(ex, hy - 0.3, -3.4, 1.2, DARK, 0.5, 1.3)
        for k in range(8): a = k / 8 * math.tau; S(ex + math.cos(a) * 1.7, hy - 0.3 + math.sin(a) * 1.8, -3.6, 0.42, TEAL if k % 2 else PINK)
    S(hx + 1.4, hy - 3.0, -3.4, 0.6, YEL); S(hx + 3.4, hy + 1.8, -3.0, 0.5, DARK, 0.4, 0.7)
    for k in range(4): S(hx + 0.4 + k * 0.85, hy + 3.4, -3.5, 0.2, DARK, 0.15, 0.6)
    # Sombrero: breite Krempe, hohe Krone, Goldborte
    S(hx, hy - 4.6, 0.0, 12.5, HAT, 11.5, 1.0, (0.32, 0, 0)); S(hx, hy - 4.3, 0.2, 12.6, GOLD, 11.6, 0.45, (0.32, 0, 0))   # Krempe leicht zur Kamera geneigt
    tube((hx, hy - 5), (hx - 0.3, hy - 11), 4.0, 2.8, HAT2, 0.0); S(hx - 0.3, hy - 11, 0.0, 2.8, HAT2, 2.8, 1.2)
    tube((hx, hy - 6.2), (hx, hy - 7.2), 4.0, 3.9, GOLD, 0.0, caps=False)
    for k in range(5): a = k / 5 * math.tau; S(hx - 3.6 + math.cos(a) * 0.9, hy - 6.6 + math.sin(a) * 0.9, -2.4, 0.6, ORA)   # Ringelblume am Hut
    # Arme und Instrument
    shf, shb = (cx + 3.5, 20 - bob), (cx - 3.5, 20 - bob)
    def arm(s0, hand, d): mx, my = (s0[0] + hand[0]) / 2 + 1.0, (s0[1] + hand[1]) / 2 + 1.5; tube(s0, (mx, my), 1.3, 1.1, SUIT, d); tube((mx, my), hand, 0.8, 0.7, BONE2, d); S(hand[0], hand[1], d, 1.1, BONE)
    if kind == 'guit':   # Guitarrón: großer Bauch, kurzer Hals
        S(cx + 2.5, 28.0, -6.0, 7.2, WOOD, 3.2, 7.8); S(cx + 2.5, 28.0, -9.0, 2.0, WOOD2, 0.4, 2.0)   # Korpus, Schallloch
        for k in range(6): tube((cx - 1.5 + k * 1.4, 24), (cx - 1.0 + k * 1.4, 33), 0.12, 0.12, M('#f0f0f0', 0.3, 0.6), -9.4)   # Saiten
        tube((cx - 2.0, 22.5), (cx - 10.0, 12.0), 1.0, 0.9, WOOD2, -6.0); S(cx - 10.4, 11.4, -6.0, 1.6, WOOD2, 0.8, 2.2)   # Hals, Kopf
        arm(shb, (cx - 6.5, 17.0), 2.0); arm(shf, (cx + 4.0 + (1.6 if f else 0.0), 27.5 + (1.0 if f else -1.0)), -10.0)
    elif kind == 'trump':   # Trompete: zum Mund, im zweiten Bild höher
        ty = (hy + 3.4) - (1.6 if f else 0.0)
        tube((hx + 3.4, hy + 3.4), (hx + 13.0, ty - 2.0), 0.5, 0.5, BRASS, -3.0); tube((hx + 11.0, ty - 1.6), (hx + 15.0, ty - 2.6), 0.6, 2.4, BRASS, -3.0, caps=False)
        S(hx + 7.0, hy + 4.6, -3.6, 1.2, BRASS, 1.0, 1.4); for_k = [S(hx + 6.2 + k * 0.9, hy + 2.4, -3.4, 0.3, BRASS) for k in range(3)]
        arm(shf, (hx + 6.4, hy + 5.4), -4.5); arm(shb, (hx + 8.6, hy + 4.4), -2.5)
    else:   # Geige unter dem Kinn, Bogen wechselt
        S(hx - 2.6, hy + 7.0, -3.6, 3.0, WOOD, 1.0, 2.2, (0, 0.6, 0)); tube((hx - 2.6, hy + 7), (hx - 9.0, hy + 12.0), 0.5, 0.45, WOOD2, -3.6)
        bx0 = (hx - 9.0, hy + 4.0) if f else (hx - 2.0, hy + 2.5); bx1 = (hx + 1.0, hy + 13.0) if f else (hx + 7.0, hy + 11.5)
        tube(bx0, bx1, 0.22, 0.18, M('#e8d8b8', 0.6), -4.6)
        arm(shb, (hx - 7.5, hy + 11.5), -2.0); arm(shf, ((bx0[0] + bx1[0]) / 2 + 1.0, (bx0[1] + bx1[1]) / 2 + 1.0), -5.0)

os.makedirs(CFG['out'], exist_ok=True)
for kind in ('guit', 'trump', 'viol'):
    for f in (0, 1):
        name = '%s%d' % (kind, f)
        if CFG.get('only') and name not in CFG['only']: continue
        stage(32, 48); musiker(kind, f); shot(name)
print('ok')
