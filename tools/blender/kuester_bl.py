# Küster Ruprecht (Figur auf dem Vorplatz der Sonnenkathedrale): alter Küster in schwarzem Talar mit weißem Beffchen, Glatze mit
# grauem Haarkranz, runde Brille, besorgte Brauen. Er hält den langen Kollektenstab – am Haken hängt nichts mehr, seine
# Klingelbeutel sind ausgeflogen. 40×48 Spielpixel, Füße bei (20, 48), Blick nach rechts (3/4 von vorn).
# Bilder: kuester0 (ruhig), kuester1 (hebt klagend die freie Hand). Helfer aus uhr_bl.py und npc_bl.py.
# Aufruf: python bl.py kuester_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kuester", "ss": 8}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))
_npc = open(os.path.join(CFG['dir'], 'npc_bl.py'), encoding='utf-8').read()
exec(compile(_npc[_npc.index('def skinmats():'):_npc.index('def bellringer(f):')], 'npc-helpers', 'exec'))

def kuester(f):
    mats(); skinmats()
    GOWN, GOWND, BAND, WOOD, HOOK, SHOE = M('#1c1c24', 0.75), M('#101016', 0.8), M('#f4f4f0', 0.6), M('#6c4424', 0.55), M('#b89040', 0.3, 0.85), M('#1c140c', 0.5)
    for x in (17.5, 22.5): box(x, 46.8, -0.8, 4.4, 2.4, 5, SHOE, 0.5)                                                   # Schuhe
    lathe(20, [(24, 4.6), (27, 5.6), (35, 6.4), (43, 7.2), (46, 7.4)], GOWN, 0, 32)                                     # Talar
    for k in range(5): box(20.6, 27.5 + k * 3.6, -6.2, 0.8, 0.8, 0.4, M('#3c3c48', 0.5), 0.2)                           # Knopfleiste
    box(21.2, 25.0, -4.6, 1.2, 3.0, 0.4, BAND, 0.1); box(22.6, 25.0, -4.3, 1.2, 3.0, 0.4, BAND, 0.1)                     # Beffchen
    # rechter Arm hält den Kollektenstab schräg nach vorn oben, am Ende der leere Haken
    tube((24, 26.5), (27.5, 31), 1.6, 1.5, GOWND, -0.5, -3.5); S(28, 31.4, -4.0, 1.3, SKIN)
    tube((24.0, 40.0), (38.5, 9.0), 0.55, 0.5, WOOD, -4.2, -4.2)
    ringh(38.4, 9.4, -4.2, 0.9, 0.3, HOOK); curve([(38.6, 8.6), (39.4, 7.2), (38.6, 6.0), (37.6, 6.8)], 0.32, 0.3, HOOK, -4.2)   # leerer Haken
    # linker Arm: ruhig am Körper oder klagend erhoben
    if f: tube((16, 26), (12.5, 21), 1.6, 1.5, GOWND, -0.5, -2.5); S(12.2, 20.2, -3.0, 1.3, SKIN, 1.1, 1.6)
    else: tube((16, 26), (15, 33), 1.6, 1.5, GOWND, -0.5, -1.5); S(15.0, 33.6, -1.8, 1.2, SKIN)
    head(20.5, 18.5, 4.4, 0)
    S(20.5, 15.4, -1.0, 3.0, M('#f0c8a0', 0.3), 3.0, 1.4)                                                              # Glatze glänzt
    for a in range(5): S(15.8 + a * 0.5, 18.6 + a * 0.4, 1.4 - a * 0.9, 1.5, HAIRG)                                     # grauer Haarkranz
    S(25.2, 17.6, 0.2, 1.1, HAIRG)
    for ex in (20.7, 23.3): ring(ex, 17.8, -4.2, 1.1, 0.25, M('#d8d8e0', 0.3, 0.9))                                      # runde Brille
    for ex, a in ((20.4, 0.35), (23.6, -0.35)): tube((ex - 1.0, 16.0 - a), (ex + 1.0, 16.0 + a), 0.3, 0.3, HAIRG, -4.3)   # besorgte Brauen
    shot('kuester%d' % f)

SS = CFG.get('ss', 8)
os.makedirs(CFG['out'], exist_ok=True)
for f in (0, 1): stage(40, 48, SS); kuester(f)
print('ok')
