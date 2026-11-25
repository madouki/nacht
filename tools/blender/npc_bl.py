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
    TEAL, PINK, YEL = M('#20c8c0', 0.4), M('#f050a0', 0.4), M('#f8d020', 0.4)                                           # Calaca: Zuckerschädel
    for ex in (19.2, 22.6):
        for k in range(8): a = k / 8 * math.tau; S(ex + math.cos(a) * 1.75, 16.6 + dy + math.sin(a) * 1.8, -3.9, 0.38, TEAL if k % 2 else PINK)
    S(21.0, 14.8 + dy, -3.9, 0.45, YEL)
    for k in range(5): S(19.4 + k * 0.85, 21.9 + dy, -3.7, 0.2, PUP, 0.15, 0.55)                                         # Nähte
    for k in range(7): a = k / 7 * math.tau; S(17.2 + math.cos(a) * 1.0, 12.8 + dy + math.sin(a) * 1.0, -3.0, 0.7, M('#f89820', 0.6) if k % 2 else M('#fcc040', 0.6))   # Ringelblume an der Mütze
    S(17.2, 12.8 + dy, -3.5, 0.6, M('#c86010', 0.7))
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

# ---- dritte Runde: 40×48, Füße bei 20/48 ----
def librarian(f):  # Bibliothekar: Gelehrtenkappe, weißer Bart, runde Brille, violette Robe mit Goldsaum, aufgeschlagenes Buch (f=1: Seite hoch)
    mats(); skinmats()
    ROBE, ROBED, GOLDH, CAPR, BEARD, PAGE, COVER = M('#4c3478', 0.7), M('#2c1c4c', 0.75), M('#d8a838', 0.3, 0.9), M('#6c1c2c', 0.6), M('#e8e8f0', 0.8), M('#f4ecd4', 0.7), M('#7c2c1c', 0.6)
    for x in (17.5, 22.5): box(x, 46.8, -0.8, 4.4, 2.4, 5, M('#2c1c14', 0.5), 0.5)
    lathe(20, [(25, 4.4), (28, 5.4), (36, 6.4), (44, 7.4), (46, 7.6)], ROBE, 0, 32); ringh(20, 45.4, 0, 7.55, 0.5, GOLDH)   # Robe mit Goldsaum
    box(20.2, 36, -6.4, 0.7, 19, 0.4, GOLDH, 0)                                                                         # Goldnaht
    tube((16, 26), (15, 33), 1.6, 1.5, ROBED, -0.5, -1.5)                                                               # Arm
    tube((24, 26), (26, 31), 1.6, 1.5, ROBED, -0.5, -4); S(26.6, 31.6, -4.6, 1.2, SKIN)                                 # Arm hält das Buch
    box(28.5, 33.2, -5.6, 9, 1.2, 4, COVER, 0.3); box(26.3, 32.2, -5.8, 4.2, 0.8, 3.6, PAGE, 0.2); box(30.7, 32.2, -5.8, 4.2, 0.8, 3.6, PAGE, 0.2)   # offenes Buch
    if f: box(30, 29.6, -6.2, 3.8, 0.4, 3.0, PAGE, 0.1, math.radians(-50))                                              # Seite wird umgeblättert
    head(20.5, 18.5, 4.4, 0)
    for x, y, r in ((17.4, 22.5, 2.2), (20.6, 23.5, 2.6), (23.2, 22.4, 1.9), (20.4, 26.5, 2.0), (20.6, 29, 1.4)): S(x, y, -2.8, r, BEARD, r, r * 0.8)   # Bart
    S(16.2, 18, 0, 1.6, BEARD); S(24.6, 17.2, 0.4, 1.3, BEARD)                                                          # Haar an den Seiten
    for ex in (20.7, 23.3): ring(ex, 17.6, -4.2, 1.15, 0.25, M('#f8e070', 0.3, 0.9))                                    # runde Brille
    lathe(20.5, [(12.2, 2.6), (13.0, 4.0), (14.6, 4.6), (15.2, 4.6)], CAPR, 0, 28); S(20.5, 12.0, 0, 0.9, M('#a03040', 0.5))   # Kappe mit Knopf
    shot('librarian%d' % f)

def prisoner(f):  # Gefangener: Skelett in Lumpen, Fußfessel, Teetasse; f=1: Kiefer klappert
    mats(); skinmats()
    BONE, BONED, RAG, RAGL, IRONK = M('#e8e0c8', 0.55), M('#a8a088', 0.6), M('#6c4c2c', 0.85), M('#8c6c44', 0.8), M('#5c5c6c', 0.4, 0.8)
    for x in (18, 22): tube((x, 37), (x, 46.5), 0.75, 0.7, BONE, 0, 0); S(x + 0.6, 47, -0.4, 1.5, BONE, 1.7, 1.0)
    ringh(18, 45.5, 0, 1.4, 0.55, IRONK)                                                                                # Fußfessel
    lathe(20, [(25, 4.0), (27, 4.8), (33, 4.6), (37, 4.4), (38.5, 3.6)], RAG, 0, 24)                                     # Lumpen
    for k in range(3): ringh(20.6, 29 + k * 2.0, -0.4, 3.9, 0.45, BONE)                                                 # Rippen
    box(20.8, 31, -4.4, 3.4, 6.5, 0.6, M('#1c1410', 0.9), 0)                                                            # Riss im Stoff (dahinter Rippen)
    for k in range(3): box(20.8, 29 + k * 2.0, -4.7, 3.0, 0.7, 0.3, BONE, 0)
    for x in (16, 24): S(x, 38.4, -1, 1.6, RAGL, 1.4, 1.0)                                                              # Fransen
    tube((16, 26), (15, 34), 0.6, 0.55, BONE, -0.5, -1)                                                                 # Arm
    tube((24, 26), (26.5, 30), 0.6, 0.55, BONE, -0.5, -3); S(26.8, 30.3, -3.3, 0.9, BONE)                               # Arm mit Tasse
    disc(28.5, 31.6, -3.5, 3.0, 0.5, M('#fcfcfc', 0.3), 24, 0.1).rotation_euler = (math.radians(80), 0, 0)            # Untertasse
    lathe(28.5, [(28.4, 1.9), (29.5, 1.9), (30.8, 1.5), (31.3, 1.2)], M('#fcfcfc', 0.3), -3.5, 24); ring(30.6, 29.6, -3.5, 0.9, 0.3, M('#fcfcfc', 0.3))   # Tasse mit Henkel
    S(20.5, 18.5, 0, 4.2, BONE, 4.0, 3.8)                                                                               # Schädel
    for ex in (19.2, 22.4): S(ex, 18.0, -3.2, 1.1, PUP)
    S(21.2, 20.4, -3.4, 0.55, PUP)
    box(21, 23.2 + (0.9 if f else 0), -2.8, 4.4, 1.4, 1.0, BONED, 0.3)                                                  # Kiefer (klappert)
    shot('prisoner%d' % f)

def speedghost(f):  # Geist eines Speedrunners: durchscheinend (Durchsichtigkeit macht das Spiel), Stirnband, wehender Schweif
    mats(); skinmats()
    GH, GHD, BAND, EYE2 = M('#d8e8ff', 0.5, 0, 0.35), M('#a8c4f0', 0.5, 0, 0.25), M('#e83c3c', 0.5), M('#24304c', 0.4)
    for k in range(6): S(20 - k * 0.5 + (0.6 if (k + f) % 2 else -0.6), 34 + k * 2.2, 0, 4.2 - k * 0.6, GH if k % 2 else GHD)   # Schweif statt Beine
    S(20, 29, 0, 5.0, GH, 5.0, 4.6)                                                                                     # Leib
    tube((24, 27), (27.5, 28), 1.3, 1.1, GH, -0.5, -3)                                                                  # Arm (hält die Stoppuhr)
    S(20.5, 19.5, 0, 4.4, GH)                                                                                           # Kopf
    ringh(20.5, 17.6, 0, 4.25, 0.7, BAND)                                                                               # Stirnband
    e = 0.8 if f else -0.6
    curve([(16.4, 17.6), (13.6, 18 + e), (11.6, 17.4 - e)], 0.7, 0.4, BAND, 0.5)                                       # wehende Enden
    for ex in (20.6, 23.4): box(ex, 19.8, -4.0, 1.6, 0.6, 0.3, EYE2, 0)                                                 # verbissener Blick
    box(22, 22.4, -3.8, 2.6, 0.5, 0.3, EYE2, 0)                                                                         # Mund
    shot('speed%d' % f)

def watch():  # 10×10 Stoppuhr (deckend)
    mats(); disc(5, 5.6, 0, 4.0, 1.6, M('#c89020', 0.3, 0.9), 32, 0.4); disc(5, 5.6, -0.9, 3.0, 0.4, M('#fcf0c8', 0.5), 32, 0.1)
    box(5, 1.0, 0, 1.4, 1.4, 1.4, M('#c89020', 0.3, 0.9), 0.3); box(5, 4.6, -1.2, 0.5, 2.2, 0.2, M('#c82828', 0.4), 0)
    shot('watch')

def clerk(f):  # Oberamtsrat Stempelmann: Augenschirm, runde Brille, Ärmelschoner, Weste, am Stehpult; f=1: Stempel unten
    mats(); skinmats()
    SKP, SHIRT, VEST, TIE, SLEEVE, VISOR, DESK, DESKL = M('#e0d8c8', 0.6), M('#f0ece0', 0.6), M('#5c5c6c', 0.65), M('#8c1c2c', 0.5), M('#1c1c24', 0.6), M('#2c7c4c', 0.3), M('#4c3020', 0.6), M('#5c3c24', 0.55)
    for x in (18, 22): box(x, 46.8, -0.8, 4, 2.2, 5, M('#1c1418', 0.5), 0.5); tube((x, 36), (x, 45.8), 1.2, 1.3, M('#3c3c48', 0.7), 0, 0)
    lathe(20, [(25, 3.8), (27, 4.6), (33, 4.4), (36.5, 4.2)], SHIRT, 0, 28)
    prism(20, 30.5, -4.5, [(-3.6, -5), (-1, -5), (0, -1), (1, -5), (3.6, -5), (3.8, 5.5), (-3.8, 5.5)], 0.6, VEST, 0.2)   # Weste
    prism(20, 28.5, -5.0, [(-0.6, -3), (0.6, -3), (0.9, 3), (0, 4), (-0.9, 3)], 0.4, TIE, 0.1)                            # Krawatte
    tube((16, 26), (15, 33), 1.3, 1.2, SHIRT, -0.5, -1); tube((15.3, 30), (15, 33), 1.45, 1.35, SLEEVE, -1, -1.2); S(15, 33.4, -1.4, 1.1, SKP)   # Arm mit Ärmelschoner
    up = 0 if f else 3.5
    tube((24, 26), (27.5, 31 - up), 1.3, 1.2, SHIRT, -0.5, -3); tube((26, 29.5 - up * 0.5), (27.5, 31 - up), 1.45, 1.35, SLEEVE, -2, -3)
    S(27.8, 31.3 - up, -3.3, 1.1, SKP); box(28.6, 29.4 - up, -3.3, 2.4, 3.2, 2.4, M('#74482c', 0.5), 0.4); box(28.6, 31.4 - up, -3.3, 3.6, 1.0, 3.0, M('#b81e2a', 0.5), 0.2)   # Stempel
    box(30.5, 41, -1, 9, 12, 7, DESK, 0.5); box(30.5, 34.6, -1, 10, 1.2, 8, DESKL, 0.3); box(29.5, 33.6, -2, 5, 0.8, 4, M('#2c4c8c', 0.6), 0.2)   # Stehpult mit Stempelkissen
    tube((20, 22.5), (20, 25), 1.1, 1.1, SKP, 0, 0)
    S(20.5, 18.5, 0, 4.3, SKP, 4.1, 4.3); S(20, 15.4, 0.4, 3.8, M('#c8c4b8', 0.7), 4.0, 2.2)                           # Kopf, schütteres Haar
    for ex in (20.6, 23.2): S(ex, 18.2, -3.6, 0.45, PUP); ring(ex, 18.2, -4.0, 1.1, 0.25, M('#c8c8d8', 0.3, 0.9))      # Augen, Brille
    box(21.6, 21.2, -3.8, 2.4, 0.4, 0.3, M('#a89c8c', 0.5), 0)
    box(21.6, 14.6, -3.0, 9.5, 0.6, 5.5, VISOR, 0.1, math.radians(-8))                                                 # grüner Augenschirm
    shot('clerk%d' % f)

def chicken(f):  # Wandhuhn auf der Fundkiste, Fundzettel Nr. 13; f=1: pickt
    mats(); skinmats()
    CRATE, CRATED, HEN, HENW, COMB, BEAK = M('#7c5428', 0.7), M('#5c3c1c', 0.75), M('#f4f0e4', 0.6), M('#d8d0bc', 0.65), M('#d82828', 0.5), M('#f8b800', 0.4)
    box(20, 43, 0, 18, 10, 9, CRATE, 0.5); box(20, 38.4, -4.6, 18, 0.8, 0.3, M('#a07040', 0.6), 0); box(20, 43, -4.6, 18, 0.7, 0.3, CRATED, 0); box(20, 43, -4.7, 1.6, 10, 0.3, CRATED, 0)   # Fundkiste
    S(19.5, 33.5, 0, 5.4, HEN, 5.6, 4.6); S(18, 33.8, -2.6, 3.4, HENW, 3.8, 1.8)                                        # Leib, Flügel
    for k in range(3): S(14 - k * 0.6, 29.5 - k * 1.2, 0.5 - k, 1.6, HEN if k % 2 else HENW, 1.2, 2.4)                 # Schwanzfedern
    hx, hy = (25.8, 30.5) if f else (24.4, 27.2)
    S(hx, hy, -0.5, 2.6, HEN); S(hx - 0.3, hy - 2.6, -0.5, 1.0, COMB, 1.8, 1.0); S(hx + 0.4, hy + 2.2, -1.4, 0.7, COMB, 0.6, 1.0)   # Kopf, Kamm, Kehllappen
    o = add('k', hx + 3.0, hy + 0.2, -0.8, 0.8, 0.8, 1.4, BEAK); o.rotation_euler = (0, math.radians(-90), 0)              # Schnabel
    S(hx + 1.0, hy - 0.6, -2.2, 0.5, PUP)
    box(22.5, 38.5, -4.2, 0.6, 2.0, 0.6, BEAK, 0); box(24.2, 40, -4.6, 3.4, 2.6, 0.3, M('#fcf4c8', 0.7), 0.1); text(24.2, 40, -4.8, '13', 1.8, M('#8c7c5c', 0.6))   # Fuß, Fundzettel Nr. 13
    shot('chicken%d' % f)

SS = CFG.get('ss', 8); W = CFG.get('what') or ['bell', 'guide', 'clock', 'kalle', 'anatol', 'carto', 'cook', 'librarian', 'prisoner', 'speed', 'clerk', 'chicken']
os.makedirs(CFG['out'], exist_ok=True)
for f in (0, 1):
    if 'bell' in W: stage(28, 44, SS); bellringer(f)
    if 'guide' in W: stage(28, 44, SS); guide(f)
    if 'clock' in W: stage(28, 44, SS); clockmaker(f)
    if 'kalle' in W: stage(40, 48, SS); kalle(f)
    if 'anatol' in W: stage(40, 48, SS); anatol(f)
    if 'carto' in W: stage(40, 48, SS); carto(f)
    if 'cook' in W: stage(40, 48, SS); cook(f)
    if 'librarian' in W: stage(40, 48, SS); librarian(f)
    if 'prisoner' in W: stage(40, 48, SS); prisoner(f)
    if 'speed' in W: stage(40, 48, SS); speedghost(f)
    if 'clerk' in W: stage(40, 48, SS); clerk(f)
    if 'chicken' in W: stage(40, 48, SS); chicken(f)
if 'speed' in W: stage(10, 10, SS); watch()
print('done', W)
