# Zweite Kulissen-Lieferung für NACHTMAHR: Gladiatorenstatue (Kolosseum), Sarkophag (Kerker, Gruft), Globus (Archive), Konzertflügel (Hotel, Theater),
# Orgel (Kapelle, Kathedrale) und Eiskristalle mit eingefrorenem Gummihuhn (Eiskeller).
# Aufruf: python bl.py kulisse2_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_kulisse", "ss": 4}'
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'kulisse_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def rohr():')], 'helpers2', 'exec'))

def gladiator():   # Marmorstatue mit Schwert, Rundschild und Helmbusch (96×136)
    MB, MB2, ST, ST2, BRZ, BRZL, RED, STL, MOSS = M('#d8d0c0', 0.55), M('#b8b0a0', 0.6), M('#6c6458', 0.9), M('#857c6e', 0.88), M('#a87c3c', 0.34, 0.9), M('#e0b868', 0.26, 0.9), M('#9c2820', 0.75), M('#c8ccd4', 0.25, 0.9), M('#4c7040', 0.95)
    box(14, 120, 82, 136, ST, -10, 10); box(20, 112, 76, 120, ST2, -9, 9); box(14, 120, 82, 122, ST2, -11, 11)
    for x in (24, 40, 56, 72): S(x, 128, -10.4, 3.2, BRZ, 0.8, 3.2)
    tube((39, 112), (42, 86), 6.2, 8.0, MB, 0.0); tube((57, 112), (54, 86), 6.2, 8.0, MB, 0.0)
    box(32, 106, 46, 113, BRZ, -7, 6); box(50, 106, 64, 113, BRZ, -7, 6)
    S(48, 66, -1.0, 14.0, BRZ, 10.0, 19.0); S(42, 57, -9.4, 5.6, BRZL, 1.6, 4.6); S(54, 57, -9.4, 5.6, BRZL, 1.6, 4.6); box(47.4, 50, 48.6, 78, BRZ, -11, -9)
    for y in (66, 71, 76): box(40, y, 56, y + 1.2, BRZ, -10.6, -8)
    for i in range(9): tube((33 + i * 3.8, 82), (30 + i * 4.5, 99), 2.1, 2.7, (BRZ, RED)[i % 2], -7.0, caps=False)
    box(32, 78, 64, 84, BRZ, -11, 9); S(48, 81, -12.0, 4.0, BRZL, 1.4, 4.0)
    tube((62, 52), (76, 40), 5.6, 4.6, MB, -2.0); tube((76, 40), (81, 25), 4.6, 3.6, MB, -3.0); S(62, 51, -2.0, 7.2, BRZ, 6.5, 6.0); S(81, 24, -3.0, 4.2, MB)
    tube((81, 26), (87, 3), 2.5, 0.7, STL, -5.0); tube((74, 28), (89, 23), 1.5, 1.5, BRZL, -5.0)
    tube((34, 52), (24, 66), 5.6, 4.6, MB, -2.0); S(34, 51, -2.0, 7.2, BRZ, 6.5, 6.0)
    S(19, 74, -8.0, 16.5, BRZ, 3.0, 16.5); S(19, 74, -10.6, 13.5, RED, 1.2, 13.5); S(19, 74, -12.0, 4.6, BRZL)
    for k in range(10): a = k / 10 * 2 * math.pi; S(19 + math.cos(a) * 14.8, 74 + math.sin(a) * 14.8, -10.8, 1.2, BRZL)
    tube((48, 46), (48, 38), 5.0, 5.0, MB, -1.0)
    S(48, 32, -2.0, 8.2, MB, 8.2, 9.0); S(48, 26, -2.5, 10.0, BRZ, 10.0, 8.0); box(39, 30, 57, 33, BRZ, -12, 4); box(39, 33, 43, 42, BRZ, -11, 4); box(53, 33, 57, 42, BRZ, -11, 4)
    for i in range(10): S(34 + i * 3.2, 16.5 - math.sin(i / 9 * math.pi) * 8.0, -2.0, 2.8, RED, 2.4, 4.0)
    for x, y, r in ((22, 116, 4.5), (70, 128, 5.0), (38, 134, 3.6), (60, 114, 2.8)): S(x, y, -9.6, r, MOSS, 1.2, r * 0.7)

def sarkophag():   # Steinsarg mit Grabfigur, Deckel einen Spalt offen (104×64)
    ST, ST2, ST3, DARK, MOSS, GOLD, WAX, FL = M('#6c665e', 0.9), M('#8a8378', 0.86), M('#4e4942', 0.92), M('#07060a', 0.95), M('#4c7040', 0.95), M('#c89c44', 0.3, 0.9), M('#e8dcc0', 0.6), M('#fcb048', 0.5, 0, 4.0)
    box(6, 36, 98, 64, ST, -14, 12); box(2, 58, 102, 64, ST3, -16, 13); box(6, 36, 98, 39, ST2, -15, 12)
    for x in (18, 42, 66, 90):
        box(x - 9, 42, x + 9, 56, ST3, -15, -13.6)
        grid(lambda u, v: (x + math.cos(math.pi + u * math.pi) * 9 * v, 42 + math.sin(math.pi + u * math.pi) * 6 * v, -15.2), 10, 2, ST3)
        S(x, 50, -15.8, 3.2, GOLD, 0.8, 3.2)
    box(62, 33, 90, 36, DARK, -15.5, 11)
    box(2, 26, 90, 33, ST2, -16, 13); box(2, 31, 90, 33, ST3, -17, 14)
    tube((24, 21), (82, 21), 8.5, 6.0, ST2, -2.0); S(18, 18, -2.0, 7.4, ST2); S(18, 12, -2.0, 6.4, GOLD, 6.0, 2.4)
    for x in (36, 48, 60, 72): tube((x, 13), (x + 2, 28), 1.2, 1.5, ST3, -9.5, caps=False)
    S(50, 14, -8.0, 4.4, ST2, 3.6, 3.0); tube((50, 14), (78, 14), 1.4, 0.6, GOLD, -9.0); tube((44, 10), (44, 20), 1.0, 1.0, GOLD, -9.0)
    for x, y, r in ((14, 60, 6.0), (88, 58, 5.0), (58, 37, 3.6), (32, 30, 3.0)): S(x, y, -15.8, r, MOSS, 1.0, r * 0.6)
    for x, h in ((96, 12), (101, 8)): tube((x, 58), (x, 58 - h), 2.0, 1.8, WAX, -13.0); S(x, 58 - h - 3, -13.0, 1.3, FL, 1.3, 2.6)

def globus():   # Erdglobus im Messingring auf drei Holzbeinen (72×104)
    WD, WD2, SEA, SEA2, LAND, LAND2, BRZ, BRZL = M('#5a3820', 0.55), M('#7c5230', 0.5), M('#2c5c78', 0.45), M('#3c7898', 0.42), M('#b89c60', 0.6), M('#8c9c54', 0.65), M('#a87c3c', 0.3, 0.9), M('#e4bc6c', 0.24, 0.9)
    tube((36, 72), (10, 102), 2.6, 3.6, WD, -2.0); tube((36, 72), (62, 102), 2.6, 3.6, WD, -2.0); tube((36, 72), (36, 102), 2.6, 3.4, WD2, -6.0); tube((20, 90), (52, 90), 1.5, 1.5, WD2, -3.0)
    for x in (10, 62): S(x, 101, -2.0, 4.0, BRZ, 4.0, 2.2)
    tube((36, 66), (36, 76), 5.0, 3.0, BRZ, -2.0); S(36, 72, -2.0, 6.0, BRZL, 6.0, 3.0)
    S(36, 36, -2.0, 25.5, SEA); S(29, 28, -19.0, 12.0, SEA2, 6.0, 10.0)
    for x, y, rx, rz, m in ((24, 25, 9.0, 7.0, LAND), (30, 36, 5.0, 9.0, LAND2), (44, 22, 7.0, 5.0, LAND2), (50, 38, 6.5, 8.5, LAND), (38, 52, 8.0, 4.0, LAND), (18, 44, 3.5, 5.0, LAND2)):
        d = math.sqrt(max(4, 25.5 ** 2 - (x - 36) ** 2 - (y - 36) ** 2)); S(x, y, -2.0 - d + 1.0, rx, m, 1.6, rz)
    ring(36, 36, 30.0, 1.7, BRZ, -2.0, 44)
    for a in range(0, 360, 30): r = math.radians(a); S(36 + math.cos(r) * 30, 36 + math.sin(r) * 30, -3.6, 0.9, BRZL)
    tube((16.5, 13.0), (55.5, 59.0), 1.2, 1.2, BRZL, -2.0); S(16, 12, -2.0, 2.4, BRZL); S(56, 60, -2.0, 2.4, BRZL)

def fluegel():   # Konzertflügel mit aufgestelltem Deckel (124×84)
    BLK, BLK2, IV, EB, BRZ, RED, ST = M('#100c10', 0.14, 0.1), M('#241c24', 0.18, 0.1), M('#f0e8d8', 0.4), M('#08060a', 0.3), M('#c89c44', 0.28, 0.9), M('#6c1420', 0.8), M('#3c3438', 0.5)
    box(14, 40, 112, 54, BLK, -16, 14); box(14, 52, 112, 55, BLK2, -17, 15); S(108, 47, -1.0, 14.0, BLK, 15.0, 7.5)
    box(18, 37, 108, 40, RED, -14, 12)
    for x in (34, 58, 82): tube((x, 40), (x + 18, 37.4), 0.5, 0.5, BRZ, -10.0, caps=False)
    grid(lambda u, v: (16 + u * 92, 37 - u * 27 * v, -15.0), 10, 2, BLK2); grid(lambda u, v: (16 + u * 92, 37 - u * 27 - 1.2 * v, -15.2), 10, 1, M('#4c4450', 0.2, 0.2))
    grid(lambda u, v: (22 + u * 26, 36 - v * 11, -15.4), 2, 2, M('#e8dcc0', 0.6)); box(30, 28, 31, 36, BRZ, -15.8, -15.5); box(40, 28, 41, 36, BRZ, -15.8, -15.5)
    tube((72, 40), (70, 17), 0.9, 0.9, BRZ, -12.0)
    box(2, 43, 16, 50, BLK, -15, 13); box(2, 42, 16, 45, IV, -15, 13)
    for i in range(10): box(3.2 + i * 1.3, 41.4, 3.9 + i * 1.3, 43.2, EB, -15.2, -8.0)
    for x, d in ((28, -10.0), (98, -10.0), (82, 8.0)):
        tube((x, 55), (x, 78), 4.2, 2.6, BLK, d); S(x, 79, d, 3.4, BRZ, 3.4, 2.6)
    tube((30, 55), (30, 72), 1.2, 1.2, BRZ, -4.0); box(26, 70, 40, 73, BRZ, -8.0, -2.0)
    for x in (29, 33, 37): box(x, 73, x + 2, 76, BRZ, -9.0, -3.0)

def orgel():   # Orgelprospekt mit Pfeifen, Spieltisch und vergoldeten Rosetten (168×152)
    WD, WD2, DK, SIL, SIL2, GOLD, GOLDL, IV, DARK = M('#3c2214', 0.5), M('#5c3820', 0.45), M('#20120c', 0.6), M('#c4c8d4', 0.22, 0.95), M('#7c808c', 0.3, 0.9), M('#c89c44', 0.28, 0.95), M('#f0c868', 0.22, 0.9), M('#f0e8d8', 0.4), M('#06050a', 0.95)
    box(6, 92, 162, 152, WD, -6, 10); box(2, 146, 166, 152, DK, -8, 11); box(2, 88, 166, 95, WD2, -9, 11); box(2, 88, 166, 90, GOLD, -10, 11)
    box(0, 40, 10, 92, WD2, -8, 10); box(158, 40, 168, 92, WD2, -8, 10); S(5, 36, -2.0, 7.0, GOLD); S(163, 36, -2.0, 7.0, GOLD)
    box(10, 22, 158, 92, DARK, 6, 10)
    for i in range(16):
        x = 17.5 + i * 8.9; top = 40 + abs(i - 7.5) * 4.2
        tube((x, top - 14), (x, 88), 2.3, 2.3, SIL2, 3.0, caps=False); S(x, top - 14, 3.0, 2.4, SIL2, 2.4, 1.0)
    for i in range(17):
        x = 13 + i * 8.9; top = 16 + abs(i - 8) * 6.6
        tube((x, top), (x, 80), 3.5, 3.5, SIL, -2.0, caps=False); S(x, top, -2.0, 3.6, SIL, 3.6, 1.3)
        box(x - 2.1, 70, x + 2.1, 73, DARK, -5.7, -4.8); tube((x, 80), (x, 89), 3.5, 0.8, SIL, -2.0, caps=False)
    for x in (14, 84, 154): S(x, 104, -7.0, 9.0, GOLD, 2.0, 9.0); S(x, 104, -9.0, 4.2, GOLDL, 1.6, 4.2)
    box(46, 100, 122, 128, DK, -10, -5); box(50, 108, 118, 112, IV, -13, -7); box(50, 117, 118, 121, IV, -14, -8)
    for i in range(23): box(51.5 + i * 2.9, 107, 52.8 + i * 2.9, 110, DARK, -13.4, -9.0); box(51.5 + i * 2.9, 116, 52.8 + i * 2.9, 119, DARK, -14.4, -10.0)
    for x in (52, 62, 106, 116): S(x, 104, -11.0, 1.8, GOLDL, 2.4, 1.8)

def eis():   # Eiskristalle mit eingefrorenem Gummihuhn (116×92)
    I1, I2, I3, Y, OR, RD, ST = M('#7cc8ec', 0.1, 0.0, 0.16), M('#a8e0f8', 0.08, 0.0, 0.26), M('#4c94c8', 0.14, 0.0, 0.1), M('#f8d838', 0.4, 0, 0.5), M('#f87800', 0.4, 0, 0.3), M('#d82800', 0.4, 0, 0.3), M('#44586c', 0.8)
    for x, r, rz in ((12, 12, 4), (44, 20, 5), (78, 18, 5), (106, 11, 4)): S(x, 90, -2.0, r, ST, 12.0, rz)
    for bx, tx, top, r, d, m in ((10, 4, 44, 8, 2, I3), (24, 16, 30, 11, 4, I1), (98, 106, 34, 10, 4, I1), (108, 114, 52, 7, 2, I3), (82, 92, 16, 13, 3, I3), (40, 30, 42, 9, -6, I2), (86, 80, 48, 8, -8, I2), (66, 72, 58, 7, -11, I2)):
        tube((bx, 88), (tx, top), r, 0.6, m, d)
    tube((54, 90), (54, 6), 19.0, 1.0, I1, -2.0); tube((50, 88), (47, 32), 7.0, 0.6, I2, -18.0)
    S(56, 62, -7.0, 8.0, Y, 7.0, 6.5); S(63, 53, -7.0, 4.6, Y); tube((67, 53), (72, 54), 1.8, 0.7, OR, -7.0); S(62, 47.5, -7.0, 2.2, RD, 1.6, 2.4); S(65, 51.5, -11.0, 1.0, M('#14141c', 0.3))
    tube((52, 68), (51, 74), 0.9, 0.9, OR, -7.0); tube((60, 68), (61, 74), 0.9, 0.9, OR, -7.0)
    tube((54, 88), (54, 26), 15.0, 1.2, M('#bfeaff', 0.04, 0.0, 0.1), -10.0)

os.makedirs(CFG['out'], exist_ok=True)
for name, fn, w, h in (('gladiator', gladiator, 96, 136), ('sarkophag', sarkophag, 104, 64), ('globus', globus, 72, 104), ('fluegel', fluegel, 124, 84), ('orgel', orgel, 168, 152), ('eis', eis, 116, 92)):
    if CFG.get('only') and name not in CFG['only']: continue
    stage(w, h); fn(); shot(name)
print('ok')
