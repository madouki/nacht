# Dorf Unkenbrunn (Oberwelt-Ort D, Seitenraum umland_dorf): die drei Dorfbewohner und die Kulissen hinter der Dorfstraße.
# Figuren je 40×48 Spielpixel, Füße bei (20, 48), Blick nach rechts (3/4 von vorn), je zwei Bilder:
#   wirtin  – Hulda Quappe, Wirtin der „Fetten Unke“: rundlich, grünes Kleid, rotes Mieder, Schürze, rote Haare im Dutt;
#             Bild 1 hebt den Krug.
#   buerger – Bürgermeister Ysidor Unkel: Bauch, Amtskette, Schnauzbart, Monokel, Papierkrone aus der Zeitung (die echte
#             Unkenkrone ist weg); Bild 1 tupft sich mit dem Taschentuch die Stirn.
#   eulalia – Wetterhexe Eulalia Zunder: Sternenmantel, Spitzhut mit Blitz, elektrisch abstehendes weißes Haar, Stab mit
#             Kupferspitze; Bild 1 knistert es an der Spitze.
# Kulissen (Vorderansicht): haus 112×128, wirtshaus 144×136, brunnen 72×80 (Unkenbrunnen mit Steinunke), turm 72×160
# (Eulalias schiefer Wetterturm mit Blitzableiter). Helfer aus uhr_bl.py und npc_bl.py.
# Aufruf: python bl.py dorf_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_dorf", "ss": 8, "what": [...]}'; danach pack_dorf.py.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))
_npc = open(os.path.join(CFG['dir'], 'npc_bl.py'), encoding='utf-8').read()
exec(compile(_npc[_npc.index('def skinmats():'):_npc.index('def bellringer(f):')], 'npc-helpers', 'exec'))

def wirtin(f):
    mats(); skinmats(); dy = -0.5 if f else 0.0
    DRESS, BLOUSE, APR, BOD, HAIR, SHOE = M('#3c8c4c', 0.6), M('#f4f0e4', 0.7), M('#fcf8ec', 0.75), M('#b02c2c', 0.5), M('#d8602c', 0.55), M('#3c2414', 0.5)
    MUG, MUGB, FOAM = M('#9c6434', 0.5), M('#c89838', 0.32, 0.9), M('#fcfcf4', 0.85)
    for x in (16.5, 23.5): box(x, 46.8, -0.8, 4.8, 2.4, 5, SHOE, 0.5)                                                     # Schuhe
    lathe(20, [(26 + dy, 6.4), (30, 7.8), (38, 9.2), (46, 9.8)], DRESS, 0, 36)                                           # weiter Rock
    prism(20.5, 37, -8.4, [(-5.4, -8), (5.4, -8), (6.4, 9), (-6.4, 9)], 0.8, APR, 0.25)                                  # Schürze
    lathe(20, [(21.5 + dy, 5.0), (24 + dy, 6.6), (28 + dy, 6.8)], BOD, 0, 32)                                            # Mieder
    for k in range(3): tube((18.6, 23.4 + dy + k * 1.6), (22.4, 24.4 + dy + k * 1.6), 0.25, 0.25, APR, -6.4, -6.4)       # Schnürung
    S(20.5, 21.2 + dy, -2.2, 4.6, BLOUSE, 4.0, 1.6)                                                                       # Bluse am Ausschnitt
    tube((15, 23 + dy), (12.6, 28), 2.1, 1.8, BLOUSE, -0.5, -1.0); tube((12.6, 28), (14.8, 31.4), 1.7, 1.5, BLOUSE, -1.0, -2.6)   # Arm in die Hüfte
    S(15.2, 31.8, -3.0, 1.5, SKIN)
    if f:   # Krug hoch: Prost!
        tube((26, 23 + dy), (29.5, 17.5), 2.1, 1.8, BLOUSE, -0.5, -3.6); S(30, 16.6, -4.0, 1.5, SKIN)
        mx, my = 31.5, 12.5
    else:
        tube((26, 23 + dy), (28.5, 29.5), 2.1, 1.8, BLOUSE, -0.5, -3.6); S(29, 30.2, -4.0, 1.5, SKIN)
        mx, my = 31.0, 27.0
    lathe(mx, [(my - 3.6, 2.6), (my - 3.0, 2.8), (my + 3.6, 2.9), (my + 4.2, 2.6)], MUG, -4.6, 24)                       # Krug
    for k in (-2.2, 2.4): ringh(mx, my + k, -4.6, 2.95, 0.35, MUGB)                                                      # Messingreifen
    ring(mx - 3.2, my + 0.4, -4.6, 1.6, 0.5, MUG)                                                                         # Henkel
    S(mx, my - 3.9, -4.6, 2.9, FOAM, 2.9, 1.2); S(mx + 1.6, my - 3.0, -6.4, 1.0, FOAM)                                    # Schaum, läuft über
    head(20.5, 16.5 + dy, 4.6, 0)
    for ex in (18.4, 23.8): S(ex, 18.0 + dy, -3.8, 1.0, M('#f08080', 0.6), 1.0, 0.55)                                    # rote Wangen
    S(19.5, 13.2 + dy, 1.0, 4.8, HAIR, 4.6, 3.0); S(19.0, 9.2 + dy, 1.4, 2.8, HAIR)                                       # Haar, Dutt
    S(16.6, 15.6 + dy, 0.6, 2.0, HAIR, 2.0, 2.6); S(24.2, 13.0 + dy, -2.4, 1.4, HAIR, 1.6, 0.8)                           # Seiten, Strähne
    S(19.0, 8.0 + dy, 1.6, 1.2, M('#3c8c4c', 0.5))                                                                        # Haarband
    shot('wirtin%d' % f)

def buerger(f):
    mats(); skinmats()
    COAT, VEST, PANTS, SHOE, PAPER, INKP, HANK = M('#2c4c3c', 0.6), M('#9c2c3c', 0.55), M('#3c3c48', 0.65), M('#1c140c', 0.45), M('#ece4cc', 0.85), M('#5c5848', 0.8), M('#fcfcfc', 0.8)
    for x in (16.8, 23.2): box(x, 46.8, -0.8, 4.4, 2.4, 5.4, SHOE, 0.5); tube((x, 39), (x, 45.5), 1.8, 1.7, PANTS, 0, 0)
    lathe(20, [(22.5, 5.4), (26, 7.0), (34, 7.6), (39.5, 6.6)], COAT, 1.4, 36)                                          # Gehrock
    for s in (-1, 1): prism(20 + s * 5.2, 41, 0.4, [(-1.6, -3), (1.6, -3), (2.6 + s * 0.8, 4), (-2.6 + s * 0.8, 4)], 2.0, COAT, 0.3)   # Rockschöße
    S(20.8, 32.5, -1.6, 7.0, VEST, 6.4, 7.6)                                                                              # Bauch in der Weste
    for k in range(4): S(23.6 + k * 0.2, 28.2 + k * 2.4, -7.4 - k * 0.2, 0.55, GOLD)                                     # Knöpfe
    chain((15.6, 23.6), (20.8, 30.4), -5.6, 0.62, 0.62, GOLD, 9, -7.6); chain((26.0, 23.6), (20.8, 30.4), -5.6, 0.62, 0.62, GOLD, 9, -7.6)   # Amtskette
    disc(20.8, 31.8, -8.2, 2.2, 0.8, GOLD, 32); S(20.8, 31.8, -8.8, 1.0, M('#3c8c4c', 0.3, 0.2))                          # Medaillon mit grüner Unke
    tube((15, 23.5), (12.8, 30), 2.0, 1.8, COAT, -0.5, -2.2); S(13.4, 31.0, -3.6, 1.5, SKIN)                              # Arm am Bauch
    if f:   # Taschentuch an die Stirn
        tube((26, 23.5), (27.8, 17.5), 2.0, 1.8, COAT, -0.5, -4.0); S(27.0, 15.2, -5.2, 1.4, SKIN)
        prism(26.0, 14.0, -6.0, [(-2.6, -1.6), (2.0, -2.2), (2.8, 1.8), (-1.8, 2.4)], 0.5, HANK, 0.2)
    else:
        tube((26, 23.5), (28.4, 30), 2.0, 1.8, COAT, -0.5, -2.2); S(28.2, 31.0, -3.4, 1.5, SKIN)
    head(20.6, 17.4, 4.8, 0)
    S(20.6, 14.2, -0.8, 3.8, M('#f0c8a0', 0.3), 3.8, 1.8)                                                                 # Glatze glänzt
    for s in (-1, 1): S(20.6 + s * 4.6, 17.4, 0.8, 1.6, HAIRG, 1.4, 2.2)                                                 # graue Haarbüschel
    for s in (-1, 1): S(23.2 + s * 1.9, 20.6, -4.6, 1.8, HAIRG, 1.0, 0.7)                                                # Schnauzbart
    ring(23.6, 16.6, -4.6, 1.25, 0.28, GOLD); curve([(24.8, 17.4), (26.0, 21.0), (25.2, 24.4)], 0.18, 0.18, GOLD, -4.2)  # Monokel mit Kettchen
    # Papierkrone aus der Zeitung: fünf Zacken, ein paar Druckzeilen
    pts = [(-4.6, 2.2), (-4.6, -2.0), (-3.2, 0.2), (-1.8, -2.6), (0, 0), (1.8, -2.6), (3.2, 0.2), (4.6, -2.0), (4.6, 2.2)]
    prism(20.4, 11.6, -1.0, pts, 7.2, PAPER, 0.15)
    for k in range(3): box(18.4 + k * 2.2, 12.6, -4.7, 1.6, 0.35, 0.2, INKP, 0)
    box(20.4, 11.2, -4.7, 4.0, 0.35, 0.2, INKP, 0)
    shot('buerger%d' % f)

def eulalia(f):
    mats(); skinmats()
    CLOAK, CLOAKD, HAT, BAND, FRIZZ, SHOE = M('#3c3c94', 0.6), M('#2a2a6c', 0.65), M('#2a2458', 0.6), M('#c8a040', 0.35, 0.8), M('#f4f4fc', 0.85), M('#2c1c14', 0.5)
    STAR, WOODM, COPPER, SPARK = M('#f8e070', 0.3, 0, 2.2), M('#6c4424', 0.55), M('#d8803c', 0.28, 0.9), M('#c8f0ff', 0.2, 0, 7.0)
    for x in (17.4, 22.6): box(x, 46.8, -0.8, 4.2, 2.2, 5.6, SHOE, 0.5); S(x + 2.6, 46.2, -2.4, 1.1, SHOE)                # Schnabelschuhe
    lathe(20, [(22.5, 4.6), (26, 5.8), (36, 7.4), (46.4, 8.8)], CLOAK, 0, 36)                                            # Sternenmantel
    for (sx, sy) in ((17.4, 31), (22.8, 36), (19.0, 41), (24.6, 43), (21.4, 28.6)): S(sx, sy, -7.0 - (sy - 26) * 0.12, 0.55, STAR)
    tube((15.2, 23.4), (13.0, 30.5), 1.8, 2.2, CLOAKD, -0.4, -1.6); S(13.4, 31.4, -2.6, 1.3, SKIN)                        # Arm
    tube((25.4, 23.4), (28.0, 28.5), 1.8, 2.2, CLOAKD, -0.4, -3.2); S(28.4, 29.2, -3.8, 1.3, SKIN)                        # Hand am Stab
    tube((28.6, 46.5), (29.4, 9.0), 0.7, 0.6, WOODM, -3.8, -3.8)                                                          # Stab
    tube((29.4, 9.4), (29.7, 3.4), 0.45, 0.15, COPPER, -3.8, -3.8)                                                        # Kupferspitze
    for k in range(4): ringh(29.45, 10.6 - k * 1.3, -3.8, 0.85, 0.24, COPPER)                                            # Kupferwicklung
    if f:   # es knistert
        for (sx, sy, r) in ((29.7, 3.0, 1.0), (27.4, 2.0, 0.5), (32.2, 3.6, 0.55), (30.8, 0.9, 0.45), (26.8, 5.0, 0.4)): S(sx, sy, -3.8, r, SPARK)
        curve([(29.7, 3.2), (32.0, 1.6), (31.0, 0.4), (33.4, -1.0)], 0.28, 0.12, SPARK, -3.8); curve([(29.5, 3.6), (27.0, 3.0), (27.8, 1.2), (25.4, 0.2)], 0.26, 0.1, SPARK, -3.8)
    head(20.2, 18.4, 4.4, 0)
    S(22.6, 19.0, -4.6, 0.9, SKIND, 1.6, 0.8)                                                                            # spitze Nase
    up = 1.25 if f else 1.0   # elektrisch abstehendes Haar (beim Knistern noch mehr)
    for k in range(11):
        a = math.pi * (0.95 + k * 0.11); r = 5.6 + (k % 3) * 0.7
        S(20.2 + math.cos(a) * r * 0.95, 18.4 + math.sin(a) * r * up * 0.9, 1.0 - (k % 2) * 1.4, 1.7 + (k % 2) * 0.4, FRIZZ)
    lathe(20.6, [(-1.2, 0.2), (2.0, 1.2), (6.0, 2.4), (10.4, 3.6), (11.2, 7.6), (12.2, 7.8)], HAT, 0.4, 32)               # Spitzhut mit Krempe
    ringh(20.6, 9.6, 0.4, 3.5, 0.5, BAND)
    prism(21.8, 6.6, -3.8, [(-0.8, -2.6), (1.0, -2.6), (0.2, -0.4), (1.4, -0.4), (-1.0, 2.8), (-0.2, 0.4), (-1.4, 0.4)], 0.5, STAR, 0.1)   # Blitzabzeichen
    shot('eulalia%d' % f)

def haus():  # 112×128 Fachwerkhaus
    mats(); PL, BEAM, ROOF, ROOFD, STONE, WIN, DOOR, BRICK, FLOW = M('#e8dcc0', 0.85), M('#4c2c18', 0.6), M('#a83c2c', 0.55), M('#7c2c20', 0.6), M('#8c8494', 0.8), M('#ffc860', 0.4, 0, 3.2), M('#5c3418', 0.55), M('#8c4c3c', 0.75), M('#e04848', 0.5)
    box(56, 124, 0, 98, 8, 34, STONE, 1.0)
    box(56, 93, 0, 88, 56, 28, PL, 0.6); box(56, 48, 0, 96, 34, 32, PL, 0.6)                                             # Erdgeschoss, vorkragendes Obergeschoss
    for py in (66, 92, 119, 32): box(56, py, -15.6 if py == 32 else -14.2, 98 if py in (66, 32) else 90, 3, 2.4, BEAM, 0.4)
    for px in (13, 34, 56, 78, 99): box(px, 93, -14.2, 3, 54, 2.4, BEAM, 0.4); box(px if px != 13 else 10, 48, -16.2, 3, 32, 2.4, BEAM, 0.4)
    for (px, rot) in ((23, 0.75), (89, -0.75)): box(px, 79, -14.0, 2.6, 30, 2.2, BEAM, 0.3, rot)
    prism(56, 18, 0, [(-58, 14), (0, -22), (58, 14)], 40, ROOF, 0.8)                                                     # Satteldach
    for k in range(5): box(56, 30 - k * 7, -20.4, 110 - k * 20, 1.2, 0.8, ROOFD, 0.2)                                     # Ziegelreihen
    box(84, 8, 6, 9, 22, 9, BRICK, 0.6); box(84, -2.6, 6, 11, 2.4, 11, BRICK, 0.4)                                        # Schornstein
    for (px, py) in ((30, 86), (82, 86), (30, 47), (82, 47)):
        z = -14.4 if py > 60 else -16.4
        box(px, py, z, 16, 18, 1.0, WIN, 0.2); box(px, py, z - 1.0, 17.6, 1.6, 1.2, BEAM, 0.2); box(px, py, z - 1.0, 1.6, 19.6, 1.2, BEAM, 0.2)
        box(px, py + 10.6, -15.4, 19, 2.2, 3.6, BEAM, 0.3)
        if py > 60:
            box(px, py + 13, -17.2, 18, 3.6, 4.6, M('#6c4424', 0.6), 0.3)                                                # Blumenkasten
            for k in range(5): S(px - 7 + k * 3.5, py + 10.6, -18.4, 1.6, FLOW if k % 2 else M('#f8d048', 0.5))
    box(56, 107, -14.0, 17, 26, 2.0, DOOR, 0.4); S(61, 108, -15.6, 0.9, GOLD)
    shot('haus')

def wirtshaus():  # 144×136 Gasthaus „Zur Fetten Unke“ mit Schild
    mats(); PL, BEAM, ROOF, ROOFD, STONE, WIN, DOOR, BAR = M('#d8c8a0', 0.85), M('#3c2414', 0.6), M('#5c6c3c', 0.6), M('#3c4c28', 0.65), M('#7c7480', 0.8), M('#ffc060', 0.4, 0, 3.4), M('#4c2c14', 0.55), M('#8c5c2c', 0.6)
    FROG, FROGD, MUGM, FOAM = M('#5cac48', 0.45), M('#3c7c34', 0.5), M('#c8903c', 0.45), M('#fcfcf0', 0.85)
    box(72, 131, 0, 134, 10, 36, STONE, 1.0)
    box(72, 96, 0, 124, 62, 30, PL, 0.6); box(72, 50, 0, 130, 32, 32, PL, 0.6)
    for py in (66, 34, 126): box(72, py, -16.2, 132, 3, 2.4, BEAM, 0.4)
    for px in (12, 40, 72, 104, 132): box(px, 96, -15.2, 3, 60, 2.4, BEAM, 0.4); box(px, 50, -16.2, 3, 32, 2.4, BEAM, 0.4)
    prism(72, 18, 0, [(-74, 16), (-60, -14), (60, -14), (74, 16)], 42, ROOF, 0.8)                                       # Walmdach, moosgrün
    for k in range(4): box(72, 30 - k * 8, -21.4, 144 - k * 8, 1.2, 0.8, ROOFD, 0.2)
    for (px, py) in ((26, 90), (56, 90), (118, 90), (26, 50), (56, 50), (88, 50), (118, 50)):
        z = -15.4 if py > 70 else -16.4
        box(px, py, z, 18, 20, 1.0, WIN, 0.2); box(px, py, z - 1.0, 19.4, 1.6, 1.2, BEAM, 0.2); box(px, py, z - 1.0, 1.6, 21.4, 1.2, BEAM, 0.2)
    box(88, 106, -15.0, 20, 32, 2.0, DOOR, 0.4); prism(88, 88, -15.4, [(-11, 2), (0, -6), (11, 2)], 2.4, BEAM, 0.3)      # Tür mit Giebel
    S(94, 108, -16.6, 1.0, GOLD)
    for (bx, by) in ((112, 120), (124, 122)):   # Fässer an der Tür
        lathe(bx, [(by - 8, 5.2), (by - 4, 6.0), (by + 4, 6.0), (by + 8, 5.2)], BAR, -20, 24)
        for k in (-5, 5): ringh(bx, by + k, -20, 5.9, 0.5, IRON)
    # Wirtshausschild am Ausleger: eine fette Unke mit Bierkrug
    tube((136, 64), (150, 64), 0.9, 0.9, IRON, -16, -16); for_k = [tube((141 + k * 6, 64), (141 + k * 6, 70), 0.3, 0.3, IRON, -16, -16) for k in range(2)]
    disc(144, 82, -16, 11.5, 1.6, M('#7c5434', 0.55), 40); ring(144, 82, -17.0, 11.5, 0.7, GOLD)
    S(143, 85, -18.2, 6.0, FROG, 2.0, 4.6); S(145, 79, -18.6, 4.4, FROG, 1.8, 3.4)
    for ex in (142.0, 147.4): S(ex, 75.6, -19.6, 1.6, FROGD); S(ex, 75.6, -20.8, 0.8, M('#1c1c24', 0.2))
    lathe(151, [(80, 2.2), (88, 2.4)], MUGM, -19, 20); S(151, 79.6, -19, 2.4, FOAM, 2.4, 1.0)
    shot('wirtshaus')

def brunnen():  # 72×80 Unkenbrunnen: Becken, Säule, Steinunke speit Wasser
    mats(); STONE, STONED, WATER, FROG, FROGD = M('#9c94a4', 0.75), M('#6c6474', 0.8), M('#58b0e0', 0.08, 0, 0.9), M('#6c9c5c', 0.4, 0.5), M('#4c7c44', 0.45, 0.5)
    lathe(36, [(60, 28), (62, 30), (75, 30), (80, 28.5)], STONE, 0, 56)                                                   # Becken
    ringh(36, 61, 0, 30, 1.6, STONED)
    disc(36, 63, 0, 28, 0.8, WATER, 48).rotation_euler = (math.radians(82), 0, 0)
    lathe(36, [(34, 4.6), (36, 6.0), (58, 6.4), (62, 7.4)], STONED, 0, 32)                                                 # Säule
    S(36, 26, 0, 10, FROG, 8.6, 7.4); S(38.6, 16.4, -2.6, 7.2, FROG, 6.4, 5.4)                                           # Steinunke
    for s in (-1, 1): S(36 + s * 8.6, 31.0, -3.4, 3.4, FROGD, 3.6, 2.2)                                                  # Füße
    for ex in (34.6, 43.6): S(ex, 11.0, -5.6, 2.8, FROG); S(ex + 0.4, 10.6, -8.0, 1.2, M('#e8c84c', 0.25, 0.6))           # Glupschaugen
    ring(39.6, 20.0, -7.8, 3.2, 0.6, FROGD)                                                                               # Maul
    curve([(42.6, 20.4), (49.0, 21.0), (54.0, 28.0), (56.6, 40.0), (57.0, 60.0)], 1.3, 0.9, WATER, -6.0, 70)                  # Wasserstrahl
    for k in range(6): S(53 + (k % 3) * 2.6, 61.6, -6 + (k // 3) * 2.4, 1.2, WATER)                                       # Spritzer
    shot('brunnen')

def turm():  # 72×160 Eulalias schiefer Wetterturm
    mats(); ST, STD, WINV, ROOF, COPPER, DOOR = M('#7c7490', 0.8), M('#5c5470', 0.85), M('#c890ff', 0.35, 0, 3.4), M('#3c3c7c', 0.6), M('#d8803c', 0.28, 0.9), M('#3c2414', 0.55)
    off = [0, 1.6, 3.4, 2.6, 0.8]
    for k in range(5):
        top, bot = 150 - (k + 1) * 24, 160 - k * 24 - (0 if k == 0 else 10)
        lathe(36 + off[k], [(top, 15.6 - k * 0.8), (bot, 16.0 - k * 0.8)], ST if k % 2 == 0 else STD, 0, 36)
        ringh(36 + off[k], bot, 0, 16.2 - k * 0.8, 1.0, STD)
    for (k, py) in ((1, 118), (2, 92), (3, 68)):
        disc(36 + off[k] - 3, py, -15.6 + k * 0.8, 4.6, 1.0, WINV, 32); ring(36 + off[k] - 3, py, -16.2 + k * 0.8, 4.6, 0.8, STD)
    box(36, 148, -15.6, 12, 22, 2, DOOR, 0.5); prism(36, 136, -16.0, [(-7, 2), (0, -4), (7, 2)], 2.0, STD, 0.3)
    lathe(37.6, [(16, 0.4), (24, 5), (34, 13), (38, 19), (40, 18)], ROOF, 0, 36)                                          # Kegeldach mit Krempe
    tube((38.2, 18), (40.6, -2), 0.7, 0.3, COPPER, 0, 0)                                                                   # Blitzableiter
    for k in range(3): ringh(39.0 + k * 0.4, 12 - k * 4, 0, 1.2, 0.3, COPPER)
    tube((40.6, -2), (40.6, -6), 0.3, 0.1, COPPER, 0, 0)
    S(48, 16, -4, 2.0, M('#d8d8e8', 0.4, 0.6)); tube((40, 10), (48, 16), 0.25, 0.25, COPPER, 0, -4)                         # Windmesser-Schale
    shot('turm')

def haus2():  # 96×144 schmales, hohes Haus mit Schieferdach, Erker, Laterne an der Tür
    mats(); PL, BEAM, SLATE, SLATED, STONE, WIN, DOOR, BRICK = M('#d8d0e8', 0.85), M('#3c2a3c', 0.6), M('#3c4c7c', 0.5), M('#2c3858', 0.55), M('#7c7480', 0.8), M('#ffc860', 0.4, 0, 3.2), M('#3c2c4c', 0.55), M('#7c4c3c', 0.75)
    box(48, 140, 0, 82, 8, 30, STONE, 1.0)
    box(48, 104, 0, 74, 64, 26, PL, 0.6); box(48, 58, 0, 80, 30, 28, PL, 0.6)
    for py in (72, 44, 136): box(48, py, -14.6, 82, 2.6, 2.2, BEAM, 0.3)
    prism(48, 22, 0, [(-46, 22), (0, -24), (46, 22)], 34, SLATE, 0.8)
    for k in range(6): box(48, 38 - k * 7, -17.6, 88 - k * 15, 1.0, 0.8, SLATED, 0.2)
    box(26, 6, 4, 8, 20, 8, BRICK, 0.6)
    box(48, 58, -16.0, 40, 26, 8, PL, 0.6); prism(48, 42, -16.0, [(-23, 4), (0, -9), (23, 4)], 10, SLATE, 0.5)   # Erker
    for px in (36, 48, 60): box(px, 58, -20.2, 9, 14, 1.0, WIN, 0.2); box(px, 58, -20.8, 10, 1.2, 1.0, BEAM, 0.1)
    for (px, py) in ((30, 98), (66, 98)): box(px, py, -13.6, 14, 18, 1.0, WIN, 0.2); box(px, py, -14.4, 1.4, 19, 1.0, BEAM, 0.1); box(px, py, -14.4, 15, 1.4, 1.0, BEAM, 0.1)
    box(48, 121, -13.4, 16, 28, 2.0, DOOR, 0.4); prism(48, 106, -13.8, [(-10, 2), (0, -6), (10, 2)], 2.0, BEAM, 0.3); S(53, 122, -14.8, 0.9, GOLD)
    tube((60, 104), (64, 104), 0.5, 0.5, IRON, -14, -16); box(64, 108, -16, 4, 6, 4, M('#ffd070', 0.3, 0, 4.0), 0.4)
    for px in (24, 72): lathe(px, [(128, 3.6), (136, 3.0)], M('#a8583c', 0.6), -16, 20); S(px, 126, -16, 3.6, M('#4c9c44', 0.6), 3.6, 2.6)
    shot('haus2')

def brett():  # 40×56 Gemeindebrett: kleines Dach, angeheftete Zettel, einer mit Büroklammer
    mats(); WOOD, ROOF, PAPER, PAPERY, INKP, CLIP = M('#6c4424', 0.6), M('#a83c2c', 0.55), M('#ece4cc', 0.85), M('#f0e0a0', 0.85), M('#4c4840', 0.8), M('#d8dce8', 0.2, 0.95)
    for px in (8, 32): box(px, 40, 0, 3, 32, 3, WOOD, 0.4)
    box(20, 26, 0, 32, 24, 2, WOOD, 0.5); prism(20, 12, 0, [(-19, 4), (0, -6), (19, 4)], 8, ROOF, 0.4)
    for (px, py, w, h, m) in ((12, 24, 9, 12, PAPER), (22, 22, 8, 10, PAPERY), (29, 27, 7, 9, PAPER), (16, 32, 10, 6, PAPERY)):
        box(px, py, -1.6, w, h, 0.3, m, 0.1)
        for k in range(3): box(px, py - h / 2 + 3 + k * 2.4, -1.9, w - 3, 0.5, 0.2, INKP, 0)
    curve([(20.2, 15.6), (20.2, 19.4), (21.6, 19.4), (21.6, 16.4), (20.9, 16.4), (20.9, 18.6)], 0.32, 0.32, CLIP, -2.4)   # Büroklammer
    shot('brett')

def laterne():  # 16×64 Straßenlaterne
    mats(); GLASS = M('#ffd070', 0.3, 0, 5.0)
    box(8, 62, 0, 7, 3, 7, IRON, 0.5); tube((8, 61), (8, 16), 0.9, 0.7, IRON, 0, 0)
    box(8, 12, 0, 6, 8, 6, GLASS, 0.3)
    for sx in (-3, 3): box(8 + sx, 12, 0, 0.7, 8.4, 6.4, IRON, 0.1)
    prism(8, 6, 0, [(-5, 2), (0, -3), (5, 2)], 7, IRON, 0.3); S(8, 2.4, 0, 0.9, IRON)
    shot('laterne')

def katze(f):  # 40×40: schwarze Katze auf dem Fass (0 schläft, 1 blinzelt) – 2: Fass leer, die Katze sitzt im Stiefel daneben
    mats(); BAR, FUR, FURL, EYE, BOOT = M('#8c5c2c', 0.6), M('#1c1a22', 0.6), M('#3c3848', 0.6), M('#e8d84c', 0.2, 0, 2.0), M('#5c3c24', 0.7)
    lathe(16, [(22, 9.0), (26, 10.2), (36, 10.2), (40, 9.0)], BAR, 0, 32)
    for k in (25, 37): ringh(16, k, 0, 10.2, 0.6, IRON)
    if f < 2:
        S(16, 18.6, -1, 7.6, FUR, 6.4, 3.8); S(10.4, 15.6, -3.0, 3.6, FUR)                                                 # zusammengerollt, Kopf
        for ex in (-1.6, 1.6): prism(10.4 + ex, 12.6, -3.0, [(-1.2, 1.4), (0, -1.6), (1.2, 1.4)], 1.0, FUR, 0.1)            # Ohren
        curve([(22.6, 19.6), (25.0, 17.0 - f * 3), (23.4, 13.4 - f * 3)], 1.0, 0.7, FUR, -2.0)                              # Schwanz
        if f: S(9.2, 15.6, -6.4, 0.75, EYE)
        else: box(9.2, 16.0, -6.4, 1.6, 0.4, 0.2, FURL, 0)
    else:
        lathe(31, [(30, 4.6), (40, 5.2)], BOOT, 0, 20); box(35, 37.6, -1, 8, 4.8, 9, BOOT, 0.8)                             # alter Stiefel
        S(31, 26.6, -1.2, 4.6, FUR, 4.2, 4.4); S(31.6, 21.0, -2.2, 3.4, FUR)
        for ex in (-1.5, 1.5): prism(31.6 + ex, 18.0, -2.2, [(-1.1, 1.3), (0, -1.6), (1.1, 1.3)], 1.0, FUR, 0.1)
        for ex in (30.4, 33.0): S(ex, 21.0, -5.2, 0.7, EYE)
        curve([(27, 28), (24.4, 24.6), (25.4, 21.0)], 0.9, 0.6, FUR, -1.0)
    shot('katze%d' % f)

def angel():  # 20×48 Angelrute an die Wand gelehnt, Rolle, Schnur ohne Haken
    mats(); ROD, CORK, LINE = M('#a87444', 0.45), M('#c8a070', 0.8), M('#e8e8f0', 0.4)
    tube((4, 47), (17, 2), 0.7, 0.3, ROD, -1, -1); tube((4.6, 45), (6.0, 40), 0.95, 0.95, CORK, -1.2, -1.2)
    disc(7.2, 37.6, -2.4, 2.0, 1.2, IRON, 24); S(7.2, 37.6, -3.2, 0.5, IRONL)
    curve([(17, 2.4), (18.2, 12), (18.4, 24), (18.0, 30)], 0.22, 0.22, LINE, -1)
    shot('angel')

def unke_wach():  # 40×36: die Brunnenunke ist kurz lebendig – große Augen, Maul auf, winzige Krone
    mats(); FROG, FROGD, BELLY, CROWN = M('#5cb048', 0.4), M('#3c8434', 0.45), M('#c8e070', 0.5), M('#f0c040', 0.25, 0.9)
    S(19, 24, 0, 10, FROG, 8.6, 7.6); S(21.6, 14.4, -2.6, 7.4, FROG, 6.6, 5.6); S(22.6, 20.6, -6.6, 4.4, BELLY, 2.0, 3.4)
    for s in (-1, 1): S(19 + s * 8.6, 29.0, -3.4, 3.4, FROGD, 3.6, 2.2)
    for ex in (17.4, 26.6): S(ex, 8.6, -5.6, 3.2, FROG); S(ex + 0.4, 8.2, -8.4, 1.8, M('#fcfcf0', 0.3)); S(ex + 0.8, 8.0, -9.8, 0.9, M('#1c1c24', 0.2))
    S(22.6, 17.8, -8.0, 3.0, M('#a8343c', 0.5), 1.2, 1.6)                                                                    # Maul auf
    prism(22.0, 3.6, -2.6, [(-3.6, 1.6), (-3.6, -1.4), (-1.8, 0.2), (0, -2.2), (1.8, 0.2), (3.6, -1.4), (3.6, 1.6)], 4.4, CROWN, 0.1)
    shot('unke_wach')

def skyline():  # 768×112 ferne Dächer von Unkenbrunn: Silhouetten, Kirchturm, Hügel, kleine Lichter
    mats(); SIL, SILD, HILL, LIT = M('#2c2c4c', 0.8), M('#22223c', 0.85), M('#1c2a34', 0.9), M('#ffc860', 0.4, 0, 3.0)
    import random; rnd = random.Random(7)
    prism(384, 100, 30, [(-400, 14), (-300, -16), (-160, -6), (-40, -22), (120, -8), (260, -20), (400, -4), (400, 14)], 20, HILL, 0.5)
    x = 8
    while x < 760:
        w = rnd.randint(26, 46); h = rnd.randint(22, 40); top = 112 - h; m = SIL if rnd.random() < 0.6 else SILD
        box(x + w / 2, 112 - h / 2 + 6, 0, w, h + 12, 10, m, 0.4); prism(x + w / 2, top - 4, 0, [(-w / 2 - 2, 4), (0, -rnd.randint(10, 18)), (w / 2 + 2, 4)], 12, m, 0.4)
        for k in range(rnd.randint(0, 3)):
            if rnd.random() < 0.7: box(x + 5 + rnd.random() * (w - 10), top + 8 + rnd.random() * (h - 14), -5.4, 3, 4, 0.6, LIT, 0)
        if rnd.random() < 0.3: box(x + w * 0.7, top - 8, 2, 4, 10, 4, m, 0.2)
        x += w + rnd.randint(-4, 10)
    box(420, 50, 4, 16, 84, 12, SIL, 0.5); lathe(420, [(-12, 0.4), (8, 8.6), (10, 9)], SILD, 4, 16); box(420, 26, -2.4, 6, 8, 0.6, LIT, 0)   # Kirchturm
    shot('skyline')

def zaun():  # 64×24 Lattenzaun
    mats(); WD = M('#d8c8a8', 0.75)
    for k in range(8): prism(4 + k * 8, 14, 0, [(-2.4, 10), (-2.4, -7), (0, -10), (2.4, -7), (2.4, 10)], 1.6, WD, 0.2)
    for py in (10, 19): box(32, py, 1.4, 64, 2.2, 1.2, M('#a89878', 0.8), 0.2)
    shot('zaun')

SS = CFG.get('ss', 8); WHAT = CFG.get('what') or ['wirtin', 'buerger', 'eulalia', 'haus', 'wirtshaus', 'brunnen', 'turm', 'haus2', 'brett', 'laterne', 'katze', 'angel', 'unke_wach', 'skyline', 'zaun']
os.makedirs(CFG['out'], exist_ok=True)
for f in (0, 1):
    if 'wirtin' in WHAT: stage(40, 48, SS); wirtin(f)
    if 'buerger' in WHAT: stage(40, 48, SS); buerger(f)
    if 'eulalia' in WHAT: stage(40, 48, SS); eulalia(f)
if 'haus' in WHAT: stage(112, 128, max(3, SS // 2)); haus()
if 'wirtshaus' in WHAT: stage(160, 136, max(3, SS // 2)); wirtshaus()
if 'brunnen' in WHAT: stage(72, 80, max(4, SS // 2)); brunnen()
if 'turm' in WHAT: stage(72, 160, max(3, SS // 2)); turm()
if 'haus2' in WHAT: stage(96, 144, max(3, SS // 2)); haus2()
if 'brett' in WHAT: stage(40, 56, SS); brett()
if 'laterne' in WHAT: stage(16, 64, SS); laterne()
if 'katze' in WHAT:
    for f in (0, 1, 2): stage(40, 40, SS); katze(f)
if 'angel' in WHAT: stage(20, 48, SS); angel()
if 'unke_wach' in WHAT: stage(40, 36, SS); unke_wach()
if 'skyline' in WHAT: stage(768, 112, 2); skyline()
if 'zaun' in WHAT: stage(64, 24, SS); zaun()
print('ok')
