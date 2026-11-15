# Figuren für NACHTMAHR in Blender: der Glöckner (Glockenstuhl), der Bergführer (Tropfsteinklamm, ein Skelett), der Uhrmacher
# (Zeigerkammer); dazu (40×48, Füße bei 20/48) Knochen-Kalle, Friseur Anatol, der Kartograf und die Kantinenchefin. Je 28×44 Spielpixel, Füße unten in der Mitte (14/44), Blick nach rechts (3/4 von vorn),
# zwei Bilder (Atmen: Oberkörper hebt sich). SS-fach überabgetastet. Aufruf über den Add-on-Socket:
# CFG = {'dir', 'out', 'ss', 'what': [...]}; danach pack_npc.py.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'uhr_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index("SS = CFG.get('ss', 6)")], 'uhr-helpers', 'exec'))   # stage, shot, box, prism, disc, ring, ringh, curve, lathe, M, S, tube …

def skinmats():
    global SKIN, SKIND, LIP, EYEW, PUP, HAIRG, WOOL
    SKIN, SKIND, LIP = M('#e8b088', 0.55), M('#c88c68', 0.6), M('#a85848', 0.5)
    EYEW, PUP, HAIRG, WOOL = M('#fcfcfc', 0.3), M('#1c1c24', 0.2), M('#a8a8b4', 0.7), M('#fcfcfc', 0.9)

def head(hx, hy, r, dy=0.0):  # Kopf mit Augen, Nase und Mund, Blick nach rechts vorn
    S(hx, hy + dy, 0, r, SKIN)
    for ex in (hx + r * 0.05, hx + r * 0.62): S(ex, hy + dy - r * 0.1, -r * 0.82, r * 0.17, EYEW); S(ex + r * 0.05, hy + dy - r * 0.1, -r * 0.95, r * 0.09, PUP)
    S(hx + r * 0.5, hy + dy + r * 0.2, -r * 0.92, r * 0.2, SKIND)                     # Nase
    S(hx + r * 0.3, hy + dy + r * 0.55, -r * 0.8, r * 0.22, LIP, r * 0.28, r * 0.08)  # Mund

def bellringer(f):
    mats(); skinmats(); dy = -0.7 if f else 0.0
    ROBE, ROBED, CORD = M('#6c5838', 0.8), M('#4c3c24', 0.85), M('#c8a868', 0.7)
    box(11, 43, -1, 5, 2, 5, M('#3c2c1c', 0.6), 0.5); box(18, 43, -1, 5, 2, 5, M('#3c2c1c', 0.6), 0.5)     # Sandalen
    lathe(14, [(23 + dy, 4.0), (26 + dy, 5.4), (32, 6.0), (38, 6.8), (42, 7.4), (42.6, 7.0)], ROBE, 0, 32)  # Kutte
    S(11, 24 + dy, 1.5, 5.4, ROBED, 5.0, 4.6)                                                               # Buckel
    ringh(14, 32, 0, 6.15, 0.55, CORD); tube((18.5, 32), (19, 38), 0.5, 0.4, CORD, -4.5, -4.8)              # Strick
    tube((19.6, 0), (19.6, 33), 0.55, 0.55, CORD, -3.5, -3.5); box(19.6, 34.5, -3.5, 2.4, 3, 2.4, M('#a87c40', 0.5), 0.4)   # Glockenseil mit Griff
    tube((16, 25 + dy), (19.4, 30), 1.5, 1.3, ROBE, -2, -4); S(19.6, 30.2, -4.4, 1.3, SKIN)                 # Arm am Seil
    tube((13, 25 + dy), (16.6, 23.5 + dy), 1.5, 1.3, ROBE, -3, -6); S(16.8, 22.4 + dy, -6.8, 1.0, SKIN, 0.9, 1.4)   # Arm, Finger an den Lippen
    head(15.5, 17, 4.6, dy)
    S(15.5, 14.6 + dy, -1.6, 2.6, M('#fce0b8', 0.25), 2.6, 1.0)                                            # Glatze glänzt
    for a in range(5): S(11.5 + a * 0.6, 17.5 + dy + a * 0.3, 1.2 - a * 0.8, 1.4, HAIRG)                    # Haarkranz
    S(11.0, 18.0 + dy, -1.5, 1.5, WOOL); S(19.8, 18.0 + dy, -1.0, 1.4, WOOL)                               # Watte in den Ohren
    shot('bell%d' % f)

def guide(f):  # Skelett im Bergsteigerzeug
    mats(); skinmats(); dy = -0.7 if f else 0.0
    BONE, BONED, SOCK, RED, BREECH, LEA, HAT, ROPE = M('#ece6cc', 0.55), M('#9c9478', 0.6), M('#c8a868', 0.75), M('#a83c2c', 0.5), M('#5c4428', 0.7), M('#a87c40', 0.6), M('#3c5c34', 0.75), M('#c8a868', 0.7)
    for x in (11, 17): box(x, 42.5, -1, 5, 3, 6, M('#4c3420', 0.6), 0.6); tube((x, 35), (x, 41), 1.5, 1.6, SOCK, 0, 0); ringh(x, 37, 0, 1.6, 0.4, RED)   # Schuhe, Strümpfe
    lathe(14, [(28 + dy, 5.0), (31, 5.4), (34, 5.0), (35.5, 4.6)], BREECH, 0, 28)                          # Kniebundhose
    for x in (11.5, 16.5): tube((x, 35), (x, 36), 1.8, 1.8, BREECH, 0, 0)
    tube((14, 18 + dy), (14, 28 + dy), 0.8, 0.8, BONE, -1, -1)                                              # Wirbelsäule
    for k in range(4): ringh(14, 19.5 + dy + k * 2.0, -0.5, 3.6 - k * 0.3, 0.45, BONE)                      # Rippen
    for x in (11.3, 16.7): tube((x, 18 + dy), (x, 28.5 + dy), 0.5, 0.5, LEA, -3.6, -3.6)                    # Hosenträger
    S(10.5, 21 + dy, -1, 3.0, ROPE, 2.4, 3.4); ring(10.5, 21 + dy, -2.5, 2.6, 0.7, ROPE)                     # Seil über der Schulter
    tube((17.5, 19 + dy), (20.5, 27), 0.6, 0.6, BONE, -2, -3); S(20.6, 27.4, -3.2, 0.9, BONE)               # Arm zum Pickel
    tube((21, 14), (21, 42), 0.55, 0.55, M('#7c5c34', 0.6), -3, -3); box(22, 14.5, -3, 6, 1.6, 1.2, M('#7c7c8c', 0.35, 0.8), 0.3)   # Pickel
    S(14.5, 12 + dy, 0, 4.4, BONE, 4.2, 4.0)                                                                # Schädel
    for ex in (13.2, 16.6): S(ex, 11.6 + dy, -3.4, 1.15, PUP)                                               # Augenhöhlen
    S(15.3, 14.2 + dy, -3.6, 0.6, PUP); box(15, 16.2 + dy, -3.0, 4.6, 1.4, 1.0, BONED, 0.3)                 # Nase, Kiefer
    disc(14.5, 8.6 + dy, 0, 6.6, 1.0, HAT, 32, 0.3).rotation_euler = (math.radians(80), 0, 0)               # Hutkrempe
    lathe(14.5, [(3.5 + dy, 2.6), (4.2 + dy, 3.6), (7.4 + dy, 3.9), (8.4 + dy, 4.0)], HAT, 0, 28); ringh(14.5, 7.4 + dy, 0, 3.95, 0.5, RED)   # Hut mit Band
    curve([(17.5, 7 + dy), (19.5, 3 + dy), (20, 0.5 + dy)], 0.5, 0.25, M('#fcfcfc', 0.6), -1)              # Feder
    shot('guide%d' % f)

def clockmaker(f):
    mats(); skinmats(); dy = -0.7 if f else 0.0
    TROU, VEST, VESTD, APRON, APRONL = M('#3c3c4c', 0.7), M('#6c4c8c', 0.6), M('#4c3464', 0.65), M('#8c5c2c', 0.55), M('#a87444', 0.5)
    for x in (11, 17): box(x, 42.8, -1, 5, 2.4, 6, M('#2c1c10', 0.5), 0.5); tube((x, 33), (x, 41.5), 1.7, 1.8, TROU, 0, 0)   # Schuhe, Hose
    lathe(14, [(22 + dy, 4.6), (25 + dy, 5.6), (30, 5.6), (33, 5.2)], VEST, 0, 28)                          # Weste
    prism(14.2, 29, -6.3, [(-4.4, -6.5), (4.4, -6.5), (4.8, 6), (-4.8, 6)], 1.0, APRON, 0.3); box(14.2, 22.8 + dy, -6.9, 8.6, 0.8, 0.4, APRONL, 0)   # Lederschürze
    for k in range(3): S(9.7, 24 + dy + k * 2.4, -4.4, 0.45, M('#e8b030', 0.3, 0.9))                         # Westenknöpfe
    tube((18.5, 25 + dy), (19, 31), 0.35, 0.35, M('#e8b030', 0.3, 0.9), -6.6, -6.8); disc(19.2, 32.4, -7.0, 1.7, 0.8, M('#f8d878', 0.25, 0.9), 24, 0.2); S(19.2, 32.4, -7.6, 0.5, PUP)   # Taschenuhr an der Kette
    tube((17.5, 23 + dy), (21, 29), 1.5, 1.3, VEST, -1.5, -3); S(21.2, 29.4, -3.4, 1.3, SKIN)                # Arm
    tube((21.4, 24), (21.6, 31.5), 0.35, 0.35, M('#c8c8d8', 0.25, 0.9), -3.6, -3.6); box(21.6, 23.4, -3.6, 1.6, 2.4, 1.6, M('#a83c2c', 0.5), 0.3)   # Schraubenzieher
    tube((10.5, 23 + dy), (9.5, 30), 1.5, 1.3, VEST, -1, -1.5); S(9.4, 30.4, -1.6, 1.3, SKIN)                 # anderer Arm
    head(14.5, 16, 4.6, dy)
    S(14.5, 12.6 + dy, -1.4, 2.6, M('#fce0b8', 0.25), 2.6, 1.0)                                            # Glatze
    for a in range(5): S(10.6 + a * 0.5, 16 + dy + a * 0.35, 1 - a * 0.7, 1.5, HAIRG)                       # Haarkranz
    ring(14.6, 15.0 + dy, -4.6, 1.8, 0.6, PUP); disc(14.6, 15.0 + dy, -4.4, 1.5, 0.6, M('#7cdcfc', 0.1, 0, 0.6), 24, 0.1)   # Lupe vorm Auge
    S(16.2, 18.4 + dy, -4.2, 1.5, HAIRG, 1.6, 0.7); S(13.6, 18.4 + dy, -4.0, 1.3, HAIRG, 1.4, 0.7)          # Schnurrbart
    shot('clock%d' % f)

# ---- zweite Runde: 40×48, Füße unten in der Mitte (20/48) ----
def kalle(f):  # Knochen-Kalle, Betriebsrat der Skelette: Schiebermütze, rote Armbinde, Protestschild
    mats(); skinmats(); dy = -0.7 if f else 0.0; wv = 0.8 if f else -0.4
    BONE, BONED, CAP, CAPL, RED, SIGN = M('#ece6cc', 0.55), M('#9c9478', 0.6), M('#5c5c6c', 0.7), M('#7c7c8c', 0.6), M('#c82828', 0.5), M('#f4ecd4', 0.7)
    for x in (17.5, 22.5): tube((x, 36), (x, 46.5), 0.75, 0.7, BONE, 0, 0); S(x + 0.8, 47, -0.5, 1.6, BONE, 1.8, 1.0)   # Beine, Füße
    S(20, 35 + dy * 0.3, 0, 3.6, BONED, 3.6, 1.8)                                                                       # Becken
    tube((20, 24 + dy), (20, 35), 0.8, 0.8, BONE, -1, -1)
    for k in range(4): ringh(20, 25.5 + dy + k * 2.0, -0.5, 3.6 - k * 0.3, 0.45, BONE)                                  # Rippen
    tube((16, 24 + dy), (24, 24 + dy), 0.8, 0.8, BONE, -0.5, -0.5)                                                       # Schultern
    tube((16, 24 + dy), (14.5, 33), 0.6, 0.55, BONE, -0.5, -1.5); ringh(15.3, 28.5 + dy * 0.5, -1, 1.1, 0.7, RED)       # Arm mit Armbinde
    tube((24, 24 + dy), (26.5, 27 + wv), 0.6, 0.55, BONE, -0.5, -2.5); S(26.6, 27.3 + wv, -2.8, 0.9, BONE)               # Arm zum Stiel
    tube((26.8, 9 + wv), (26.8, 31 + wv), 0.55, 0.55, M('#7c5c34', 0.6), -3, -3)                                          # Stiel
    box(26.8, 6 + wv, -3.6, 15, 10, 0.8, SIGN, 0.3); box(26.8, 1.6 + wv, -4.1, 15, 1, 0.3, RED, 0); box(26.8, 10.4 + wv, -4.1, 15, 1, 0.3, RED, 0)   # Schild
    text(26.8, 6 + wv, -4.2, 'STREIK', 3.6, RED)
    S(20.5, 17 + dy, 0, 4.4, BONE, 4.2, 4.0)                                                                             # Schädel
    for ex in (19.2, 22.6): S(ex, 16.6 + dy, -3.4, 1.15, PUP)
    S(21.3, 19.2 + dy, -3.6, 0.6, PUP); box(21, 21.2 + dy, -3.0, 4.6, 1.4, 1.0, BONED, 0.3)
    S(20.5, 13.6 + dy, -0.4, 4.6, CAP, 4.7, 1.6); box(23.6, 14.2 + dy, -3.6, 5, 1.2, 3, CAPL, 0.4)                       # Schiebermütze mit Schirm
    shot('kalle%d' % f)

def anatol(f):  # Friseur Anatol: hager, gestreiftes Hemd, Schürze, Pomade, gezwirbelter Schnurrbart, Schere, Pflaster
    mats(); skinmats(); dy = -0.7 if f else 0.0; open_ = f == 0
    STR, WH, APR, TROU, HAIR = M('#c83c3c', 0.6), M('#f4f0e8', 0.6), M('#e8e8f0', 0.6), M('#2c2c3c', 0.7), M('#2c1c14', 0.25)
    for x in (18, 22): box(x, 46.8, -0.8, 4, 2.2, 5, M('#1c1410', 0.5), 0.5); tube((x, 36), (x, 45.8), 1.2, 1.3, TROU, 0, 0)   # Schuhe, Hose
    lathe(20, [(25 + dy, 3.6), (27 + dy, 4.4), (33, 4.2), (36.5, 4.0)], WH, 0, 28)                                       # Hemd (weiß) …
    for k in range(5): ringh(20, 26.5 + dy + k * 2.1, 0, 4.3, 0.5, STR)                                                  # … mit roten Streifen
    prism(20, 32, -4.6, [(-3.4, -5.5), (3.4, -5.5), (3.8, 5), (-3.8, 5)], 0.8, APR, 0.2)                                   # Schürze
    tube((16.5, 26 + dy), (15, 33), 1.2, 1.1, STR, -0.5, -1.5); S(15, 33.4, -1.6, 1.1, SKIN); box(15, 33.4, -2.6, 1.8, 0.8, 0.4, M('#f4ecd4', 0.6), 0)   # Arm, Hand mit Pflaster
    tube((23.5, 26 + dy), (26, 30), 1.2, 1.1, STR, -0.5, -2.5); S(26.2, 30.3, -2.8, 1.1, SKIN); box(26.2, 30.3, -3.8, 1.8, 0.8, 0.4, M('#f4ecd4', 0.6), 0)
    SC = M('#c8ccd8', 0.2, 0.9); a = 0.35 if open_ else 0.08                                                             # Schere (offen/zu)
    for s in (-1, 1): box(29.5, 30.3, -3.6, 6, 0.7, 0.5, SC, 0, s * a)
    S(26.8, 30.3, -3.8, 0.8, SC)
    tube((20, 22.5 + dy), (20, 25 + dy), 1.2, 1.2, SKIN, 0, 0)
    S(20.5, 18 + dy, 0, 4.2, SKIN, 4.0, 4.2)                                                                             # Kopf (hager)
    S(20.2, 15.2 + dy, 0.2, 4.0, HAIR, 4.2, 2.6)                                                                         # Pomade
    for ex in (19.8, 22.6): box(ex, 17.6 + dy, -3.9, 1.6, 0.5, 0.3, PUP, 0)                                              # zugekniffene Augen
    S(21.6, 19.6 + dy, -3.9, 0.9, SKIND)
    for s in (-1, 1): curve([(21.5, 21.1 + dy), (21.5 + s * 2.2, 21.2 + dy), (21.5 + s * 3.0, 20.2 + dy)], 0.55, 0.3, HAIR, -3.8)   # Schnurrbart, gezwirbelt
    box(16.4, 17.6 + dy, -0.5, 0.8, 3.2, 0.6, M('#f4c8a0', 0.4), 0)                                                       # Kamm hinterm Ohr
    shot('anatol%d' % f)

def carto(f):  # der Kartograf: Mantel, zerzaustes weißes Haar, Kneifer, Kartenrollen, Federkiel, Karte am Boden
    mats(); skinmats(); dy = -0.7 if f else 0.0; sc = 0.6 if f else 0.0
    COAT, COATD, PAPER, PAPD, GOLDK, WHITE = M('#5c4c2c', 0.75), M('#3c3018', 0.8), M('#e8dcb8', 0.75), M('#c8b890', 0.75), M('#c89020', 0.3, 0.9), M('#ecece8', 0.8)
    box(10, 47.5, -1, 14, 1, 7, PAPER, 0.2)                                                                              # Karte am Boden
    for k, (x, c) in enumerate(((7, '#7c5c34'), (11, '#2c6c9c'), (14, '#7c5c34'))): box(x, 47.0, -3.0, 2.5, 0.3, 0.5, M(c, 0.6), 0)
    for x in (18, 22): box(x, 46.8, -0.8, 4, 2.2, 5, M('#2c1c14', 0.5), 0.5)                                              # Schuhe
    lathe(20, [(25 + dy, 4.0), (28 + dy, 5.0), (36, 5.6), (44, 6.0), (45.6, 5.8)], COAT, 0, 28)                          # Mantel
    for k in range(3): S(18.3, 30 + k * 4, -5.2, 0.5, COATD)                                                             # Knöpfe
    for k, (yy, r) in enumerate(((27, 1.4), (29.5, 1.3))): tube((13, yy + dy), (17.5, yy + dy + 1.5), r, r, PAPER if k == 0 else PAPD, -3, -3)   # Kartenrollen
    tube((15.5, 26 + dy), (15, 31), 1.4, 1.3, COAT, -1, -2)                                                              # Arm hält die Rollen
    tube((24.5, 26 + dy), (27, 29), 1.4, 1.3, COAT, -0.5, -2.5); S(27.2, 29.3, -2.8, 1.2, SKIN)                          # Arm mit Federkiel
    curve([(27.5, 29.5), (28.5 + sc, 25), (29.2 + sc, 21.5)], 0.5, 0.2, M('#f4f4fc', 0.6), -3)                         # Federkiel
    head(20.5, 18 + dy, 4.4, 0)
    for k in range(8): a = math.pi * (0.9 + k * 0.17); S(20.5 + math.cos(a) * 4.6, 18 + dy + math.sin(a) * 4.6, 0.5, 1.6, WHITE)   # zerzaustes Haar
    S(23, 13.8 + dy, -1, 1.4, WHITE); S(17.4, 21.6 + dy, -2.8, 1.3, WHITE, 1.6, 1.0)                                   # Strähne, Bart
    for ex in (20.7, 23.3): ring(ex, 17.6 + dy, -4.2, 1.1, 0.25, GOLDK)                                                  # Kneifer
    shot('carto%d' % f)

def cook(f):  # Kantinenchefin Schöpfkelle: Kochjacke, blaue Schürze, Haube, rote Wangen, Kelle, Suppentopf
    mats(); skinmats(); dy = -0.7 if f else 0.0; sw = 1.0 if f else -1.0
    JACK, APR, CLOG, POT, POTL, SOUP = M('#f4f0e8', 0.65), M('#5c7cc8', 0.6), M('#e8e8e8', 0.5), M('#8c8c9c', 0.35, 0.8), M('#c8c8d8', 0.3, 0.85), M('#a86c2c', 0.4)
    for x in (17.5, 22.5): box(x, 46.6, -0.8, 4.4, 2.6, 5.5, CLOG, 0.6); tube((x, 38), (x, 45.5), 1.5, 1.5, M('#3c3c58', 0.7), 0, 0)
    lathe(20, [(24 + dy, 4.4), (27 + dy, 6.0), (33, 6.2), (38.5, 5.8)], JACK, 0, 28)                                       # Kochjacke
    prism(20, 32, -5.9, [(-4.6, -6), (4.6, -6), (5.0, 6.4), (-5.0, 6.4)], 0.8, APR, 0.2)                                   # blaue Schürze
    for k in range(2): S(20, 27 + dy + k * 2.5, -5.8, 0.45, POTL)
    tube((15, 25 + dy), (13.8, 33), 1.5, 1.4, JACK, -0.5, -1); S(13.8, 33.4, -1.2, 1.3, SKIN)                            # Arm
    tube((25, 25 + dy), (27 + sw * 0.5, 30), 1.5, 1.4, JACK, -0.5, -3); S(27.2 + sw * 0.5, 30.4, -3.3, 1.3, SKIN)        # Arm mit Kelle
    tube((27.4 + sw * 0.5, 30), (28.5 + sw, 39), 0.4, 0.4, POTL, -3.4, -2); S(28.8 + sw, 39.4, -2, 1.4, POTL, 1.6, 0.9)  # Kelle im Topf
    lathe(31, [(37.5, 5.4), (38.2, 5.8), (46, 5.4), (47.6, 5.0)], POT, -1, 32); ringh(31, 37.8, -1, 5.7, 0.4, POTL)       # Suppentopf
    disc(31, 38.4, -1, 5.0, 0.6, SOUP, 32, 0.2).rotation_euler = (math.radians(80), 0, 0)
    for s in (-1, 1): box(31 + s * 6.4, 40, -1, 1.2, 1.6, 1.4, M('#5c5c6c', 0.4, 0.8), 0.3)                             # Griffe
    head(20.5, 18.5 + dy, 4.4, 0)
    for ex in (18.4, 23.6): S(ex, 20.0 + dy, -3.6, 1.0, M('#e87c7c', 0.6), 1.0, 0.5)                                    # rote Wangen
    lathe(20.5, [(8.0 + dy, 3.6), (8.8 + dy, 4.8), (11.5 + dy, 5.2), (13.5 + dy, 4.4), (14.8 + dy, 4.6)], M('#fcfcfc', 0.7), 0, 28)   # Haube
    shot('cook%d' % f)

SS = CFG.get('ss', 8); W = CFG.get('what') or ['bell', 'guide', 'clock', 'kalle', 'anatol', 'carto', 'cook']
os.makedirs(CFG['out'], exist_ok=True)
for f in (0, 1):
    if 'bell' in W: stage(28, 44, SS); bellringer(f)
    if 'guide' in W: stage(28, 44, SS); guide(f)
    if 'clock' in W: stage(28, 44, SS); clockmaker(f)
    if 'kalle' in W: stage(40, 48, SS); kalle(f)
    if 'anatol' in W: stage(40, 48, SS); anatol(f)
    if 'carto' in W: stage(40, 48, SS); carto(f)
    if 'cook' in W: stage(40, 48, SS); cook(f)
print('done', W)
