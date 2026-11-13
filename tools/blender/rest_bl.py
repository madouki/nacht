# Medusa und die kleinen Kreaturen für NACHTMAHR in Blender: Medusa (72×64, ruhig / fauchend), Medusenhaupt (16×16 ×2),
# Gespenst (20×22 ×2), Flammenschädel (24×18 ×4), Seeadler (24×12 ×3), Rabe (16×10 sitzend, 16×8 ×2 fliegend), Knochensäule (16×32 ×2).
# Aufruf über den Add-on-Socket: CFG = {'dir', 'out', 'what': [...]}.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('def count(')], 'helpers', 'exec'))

def stage(w, h, ss):
    global FW, FH, SS
    FW, FH, SS = w, h, ss
    MATS.clear(); MESH.clear(); OBJ.clear()   # reset() räumt unbenutzte Materialien weg – die Merkliste darf sie nicht mehr kennen
    reset(); setup(); meshes()
    bpy.data.cameras['NMCam'].ortho_scale = max(w, h)   # Blender bezieht den Maßstab auf die längere Bildseite (Hochformat: Knochensäule)
def shot(name):
    bpy.context.scene.render.filepath = os.path.join(CFG['out'], name + '.png'); bpy.ops.render.render(write_still=True); clear()
def curve(pts, r0, r1, mat, y=0.0, n=14):  # geschwungene Röhre durch Stützpunkte (Kugelkette, dicht)
    P = []
    for i in range(len(pts) - 1):
        for k in range(n): t = k / n; P.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t))
    P.append(pts[-1])
    for i, q in enumerate(P): t = i / (len(P) - 1); S(q[0], q[1], y, r0 + (r1 - r0) * t, mat)

# ---------------- Medusa ----------------
def medusa(hiss, head_only=False, ph=0.0, cx=36.0, hy=12.5, k=1.0):
    skin, skinL, skinD = M('#7cd89c' if head_only else '#62c084', 0.5), M('#8cdca8', 0.5), M('#2f7c4e', 0.6)
    coil, coilL = M('#1c6238', 0.4), M('#3c9c5c', 0.4)
    gold, ruby = M('#f0c040', 0.25, 0.9), M('#c81830', 0.2, 0, 0.6)
    eye, glint, lip, dark = M('#f8e040', 0.3, 0, 3.0), M('#fffce0', 0.3, 0, 4.0), M('#3c1028', 0.5), M('#10241a', 0.7)
    snake, snakeL, white = M('#2c8c50', 0.45), M('#58b478', 0.45), M('#f4f0e0', 0.3)
    # Schlangenhaar: Bögen aus der Kopfhaut, Köpfchen mit rotem Auge
    for i in range(9):
        a = math.radians(-100 + i * 25 + math.sin(ph + i) * 6); L = (6.5 + (i % 3) * 1.6) * k * (k if k < 1 else 1) * (0.7 if head_only else 1)
        bx, by = cx + math.sin(a) * 4.6 * k, hy - 1.5 * k - math.cos(a) * 4.4 * k
        mx, my = bx + math.sin(a) * L * 0.6, by - math.cos(a) * L * 0.75
        ex, ey = mx + math.sin(a + 0.9 * math.sin(ph * 1.3 + i * 2)) * L * 0.55, my - math.cos(a * 0.5) * L * 0.35 + 1.2 * k
        curve([(bx, by), (mx, my), (ex, ey)], 1.25 * k, 0.9 * k, snake if i % 2 else snakeL, 1.2 - (i % 3) * 0.8, 9)
        S(ex, ey, 0.9 - (i % 3) * 0.8, 1.25 * k, snakeL, 1.0 * k, 1.0 * k); S(ex + 0.4 * k, ey - 0.3 * k, -0.3, 0.38 * k, ruby)
    # Kopf: ovales Gesicht, hohe Wangen, Schlitzaugen, dunkle Lippen, Diadem
    S(cx, hy, 0, 5.4 * k, skin, 5.2 * k, 6.2 * k); S(cx, hy + 3.2 * k, -0.6, 4.1 * k, skin, 4.4 * k, 4.2 * k); S(cx, hy + 6.0 * k, -1.2, 2.0 * k, skin, 2.4 * k, 1.9 * k)
    for s in (-1, 1):
        S(cx + s * 2.4 * k, hy + 0.1 * k, -4.9, 1.75 * k, eye, 0.7, 0.85 * k, (0, math.radians(-s * 14), 0)); S(cx + s * 2.4 * k, hy + 0.1 * k, -5.5, 0.3 * k, dark, 0.3, 0.8 * k)
        S(cx + s * 2.6 * k, hy - 1.7 * k, -4.9, 1.9 * k, skinD, 0.6, 0.35 * k, (0, math.radians(s * 20), 0))   # Brauen
        add('k', cx + s * 5.6 * k, hy + 0.4 * k, 0.4, 0.9 * k, 0.6, 2.2 * k, skin, (0, math.radians(s * 60), 0))  # Flossenohren
    S(cx, hy + 2.2 * k, -5.3, 0.55 * k, skinL, 0.8, 1.0 * k)                                                   # Nase
    if hiss:
        S(cx, hy + 4.8 * k, -4.9, 1.9 * k, lip, 1.2, 1.7 * k); S(cx, hy + 5.4 * k, -5.2, 1.0 * k, ruby, 0.7, 0.8 * k)
        for s in (-1, 1): add('k', cx + s * 1.1 * k, hy + 3.9 * k, -5.4, 0.36 * k, 0.3, 1.0 * k, white, (math.radians(180), 0, 0))
    else:
        S(cx, hy + 4.4 * k, -5.0, 1.6 * k, M('#b02040', 0.4), 0.6, 0.55 * k)
    S(cx, hy - 4.2 * k, -3.2, 4.4 * k, gold, 2.2, 0.65 * k); S(cx, hy - 4.7 * k, -4.8, 0.85 * k, ruby, 0.7, 0.85 * k)   # Diadem mit Rubin
    if head_only: return
    # Hals, Schultern, Rumpf (nach unten dunkler), Goldkragen, Schuppenmieder, Gürtel mit Rubin
    S(cx, 21.5, 0, 2.3, skin, 2.2, 3.0)
    S(cx, 25.5, 0, 8.6, skin, 3.8, 3.0); S(cx, 30.5, 0, 6.6, skin, 4.0, 6.5); S(cx, 37.5, 0, 5.2, skinD, 3.6, 5.0); S(cx, 43.0, 0, 6.4, skinD, 4.2, 4.2)
    S(cx, 24.2, -1.6, 6.2, gold, 3.2, 1.5); S(cx, 24.6, -4.6, 1.2, ruby, 0.8, 1.2)
    for s in (-1, 1): S(cx + s * 3.0, 30.0, -3.0, 3.1, gold, 2.2, 2.9)                                         # Mieder
    S(cx, 33.2, -3.0, 5.4, gold, 2.6, 0.7)
    S(cx, 41.6, -0.6, 6.7, gold, 4.4, 1.0); S(cx, 41.8, -4.8, 1.5, ruby, 0.9, 1.5)
    S(cx, 36.5, -3.6, 2.6, skinL, 1.0, 3.2)                                                                    # heller Bauch
    # Arme
    for s in (-1, 1):
        sh = (cx + s * 8.4, 25.5)
        if hiss: el, ha = (cx + s * 15.5, 22.0), (cx + s * 17.5, 11.5)
        else: el, ha = (cx + s * 11.6, 33.0), (cx + s * (14.5 if s > 0 else 12.0), 40.5 if s < 0 else 37.0)
        tube(sh, el, 2.3, 1.8, skin, 0, -1.0); tube(el, ha, 1.8, 1.4, skin, -1.0, -2.2)
        S(el[0] + (ha[0] - el[0]) * 0.72, el[1] + (ha[1] - el[1]) * 0.72, -1.9, 1.9, gold, 1.9, 1.2)            # Armreif
        S(ha[0], ha[1], -2.4, 1.7, skinL, 1.4, 1.9)
        dx, dy = ha[0] - el[0], ha[1] - el[1]; L = math.hypot(dx, dy) or 1
        for q in (-1, 0, 1): tube(ha, (ha[0] + dx / L * 3.0 - dy / L * q * 1.3, ha[1] + dy / L * 3.0 + dx / L * q * 1.3), 0.55, 0.2, skinD, -2.6, -2.8, caps=False)   # Krallen
    # Ansatz des Schlangenleibs: zwei Windungen mit hellen Bauchschilden (der Rest wird im Spiel gezeichnet)
    for (yy, rx, rr, ph0) in ((49.0, 9.5, 4.3, 0.4), (56.5, 13.5, 4.9, 2.2)):  # zwei Windungen als Ringe, vorn dicker; der Rest wird im Spiel gezeichnet
        pts = [(cx + 1 + math.cos(ph0 + i * math.pi / 8) * rx, yy + math.sin(ph0 + i * math.pi / 8) * 2.4) for i in range(17)]
        for i, q in enumerate(pts):
            front = math.sin(ph0 + i * math.pi / 8)   # > 0: vorn
            S(q[0], q[1], -front * 4.2, rr * (0.86 + 0.14 * front), coil)
            if front > 0.2 and i % 2 == 0: S(q[0], q[1] - rr * 0.55, -front * 4.2 - 2.4, 1.3, coilL, 1.0, 0.8)
            if front > 0.5: S(q[0], q[1] + rr * 0.5, -front * 4.2 - 2.6, rr * 0.55, M('#c8d490', 0.5), 1.0, rr * 0.3)

# ---------------- kleine Kreaturen ----------------
def ghost(ph):  # Laken mit welligem Saum, dunkle Augen und Mund, leicht leuchtend
    sheet, dark = M('#eef4ff', 0.6, 0, 0.35), M('#1c2848', 0.6)
    def f(u, v):
        th = (u - 0.5) * math.radians(340); r = 6.2 * math.sin(min(1, v * 1.25) * math.pi / 2) ** 0.7 + 0.9 * v * math.sin(th * 4 + ph)
        return (10 + math.sin(th) * r, 3.2 + 17.5 * v + (1.3 * math.sin(th * 4 + ph) if v > 0.9 else 0), -math.cos(th) * r * 0.8)
    grid(f, 40, 16, sheet)
    for s in (-1, 1): S(10 + s * 2.3, 9.0, -5.6, 1.15, dark, 0.6, 1.6)
    S(10, 13.2, -5.9, 1.3, dark, 0.6, 1.7 + 0.3 * math.sin(ph))
    for s in (-1, 1): S(10 + s * 7.0, 12.5 + s * math.sin(ph) * 0.8, -1.0, 1.9, sheet, 1.6, 1.3)   # Ärmchen

def fire_skull(i):  # Schädel nach rechts, Flammenschweif nach links in vier Phasen
    bone, dark = M('#f0e8d0', 0.5), M('#1c1008', 0.7)
    f1, f2, f3 = M('#fc5c1c', 0.4, 0, 2.6), M('#f8b800', 0.4, 0, 3.0), M('#fff4b0', 0.4, 0, 3.4)
    for j in range(7):
        t = j / 6; wob = math.sin(i * 1.6 + j * 1.3) * 1.6 * t
        S(13.5 - t * 11.5, 9.0 + wob - t * 1.5, 1.5, 4.6 * (1 - t * 0.72), f1); S(14.0 - t * 9.0, 9.2 + wob * 0.7 - t, 0.5, 3.4 * (1 - t * 0.75), f2)
        if j < 4: S(14.5 - t * 6.0, 9.3 + wob * 0.4, -0.5, 2.3 * (1 - t * 0.8), f3)
    S(17.0, 8.4, -1.5, 4.9, bone, 4.6, 4.6); S(18.6, 12.0, -1.8, 3.2, bone, 3.4, 2.2)
    S(19.4, 8.4, -5.4, 1.5, dark, 0.8, 1.6); S(21.6, 10.4, -4.4, 0.6, dark, 0.5, 0.8); S(19.4, 13.2, -4.6, 2.2, dark, 0.6, 0.35)
    S(19.6, 8.4, -6.0, 0.55, M('#fc3020', 0.3, 0, 3.0))

def bird(kind, wing):  # Rabe / Seeadler von der Seite, Blick nach rechts; wing: -1 unten, 0 gestreckt, 1 oben, None = sitzend
    if kind == 'raven':
        body, bodyL, beak, cxx, cyy, sc = M('#181822', 0.55, 0, 0, 0.4), M('#32324e', 0.55, 0, 0, 0.4), M('#e8a030', 0.4), 8.4, (5.6 if wing is None else 4.3), 1.25
    else:
        body, bodyL, beak, cxx, cyy, sc = M('#5c3a1e', 0.6), M('#94643a', 0.6), M('#f0c030', 0.4), 12.5, 6.6, 1.5
    white = M('#f4f0e8', 0.5)
    S(cxx, cyy, 0, 3.6 * sc, body, 2.0 * sc, (2.1 if kind == 'raven' else 1.9) * sc); S(cxx + 3.2 * sc, cyy - 0.9 * sc, 0, 1.7 * sc, white if kind == 'eagle' else body, 1.5 * sc, 1.55 * sc)
    add('k', cxx + 5.4 * sc, cyy - 0.6 * sc, 0, 0.7 * sc, 0.6 * sc, 1.3 * sc, beak, (0, math.radians(100), 0))
    S(cxx + 3.7 * sc, cyy - 1.3 * sc, -1.4 * sc, 0.4 * sc, M('#fc3020', 0.3, 0, 2.0) if kind == 'raven' else M('#181008', 0.4))
    tube((cxx - 2.6 * sc, cyy + 0.2 * sc), (cxx - 6.0 * sc, cyy + 0.9 * sc), 1.3 * sc, 0.5 * sc, white if kind == 'eagle' else body, 0, 0)   # Schwanz
    if wing is None:
        S(cxx - 0.6, cyy + 0.2, -2.4, 3.4, bodyL, 0.8, 1.7, (0, math.radians(-8), 0))
        for d in (-0.6, 1.2): tube((cxx + d, cyy + 2.0), (cxx + d + 0.3, cyy + 4.2), 0.34, 0.34, beak, -0.5, -0.5, caps=False)
    else:
        a = wing * 0.95 if wing else 0.3                                         # gestreckt: leicht angehoben, sonst sähe man nur eine Linie
        room = (cyy - 0.4) if a > 0 else (FH - cyy - 0.4)                       # Platz bis zum Bildrand
        Lw = min(5.4 * sc, room / max(0.3, abs(math.sin(a))))
        tipx, tipy = cxx - 2.6 * sc - abs(math.sin(a)) * 1.2 * sc, cyy - 0.3 * sc - math.sin(a) * Lw
        def w(u, v, front=True):
            bx = cxx - 2.8 * sc + u * 5.0 * sc; by = cyy - 0.5 * sc
            tx = tipx - 1.8 * sc + u * 4.4 * sc; tyy = tipy + (1.1 * sc * (1 - u) if a >= 0 else -1.1 * sc * (1 - u))
            return (bx + (tx - bx) * v, by + (tyy - by) * v, (-1.7 if front else 1.7) * sc * (0.6 + 0.4 * (1 - v)))
        grid(lambda u, v: w(u, v, False), 6, 6, body); grid(lambda u, v: w(u, v, True), 6, 6, bodyL)
        if kind == 'eagle':                                                       # dunkle Schwungfedern an der Flügelspitze
            for u in (0.1, 0.5, 0.9): q = w(u, 1.0); S(q[0], q[1], q[2] - 0.3, 0.75 * sc, body, 0.5, 0.75 * sc)

def pillar(op):  # Knochensäule: zwei gehörnte Drachenschädel auf einer Wirbelsäule, Schnauze nach rechts; op: oberer Rachen offen, Glut im Maul
    bone, boneD, dark, white = M('#d0c4a0', 0.6), M('#94845c', 0.6), M('#1c1008', 0.7), M('#fcf8e8', 0.4)
    red, f1, f2 = M('#fc3020', 0.3, 0, 3.0), M('#fc6c1c', 0.4, 0, 3.0), M('#fff0a0', 0.4, 0, 3.6)
    for j in range(12): S(5.2, 1.2 + j * 2.7, 1.8, 2.3 if j % 2 == 0 else 1.5, boneD, 2.0, 1.45)               # Wirbel
    for n, cy in enumerate((8.0, 24.0)):
        o = op and n == 0
        add('k', 3.0, cy - 4.9, 0.6, 1.35, 1.1, 3.1, boneD, (0, math.radians(-40), 0))                            # Horn
        S(6.6, cy - 0.9, 0, 4.3, bone, 4.0, 3.7); S(10.8, cy + 0.1 - (0.5 if o else 0), -0.3, 4.0, bone, 2.8, 2.1) # Hirnschale, Schnauze
        S(13.7, cy + 0.5 - (0.7 if o else 0), -0.4, 1.7, bone, 2.2, 1.7)
        S(8.2, cy - 1.1, -3.4, 1.55, dark, 0.8, 1.35); S(8.5, cy - 1.1, -4.1, 0.6, red)                            # Augenhöhle mit Glut
        S(14.1, cy - 0.3 - (0.7 if o else 0), -2.3, 0.5, dark, 0.5, 0.45)                                          # Nasenloch
        for i in range(4): add('k', 9.3 + i * 1.5, cy + 2.5 - (0.6 if o else 0), -1.7, 0.42, 0.4, 0.95, white, (math.radians(180), 0, 0))
        if o:
            tube((6.6, cy + 2.8), (12.6, cy + 6.4), 1.3, 0.9, bone, 0, -0.3)                                         # Unterkiefer klappt auf
            S(11.6, cy + 3.3, -0.8, 2.1, f1, 1.5, 1.6); S(13.2, cy + 3.5, -1.2, 1.3, f2, 1.2, 1.1)
        else:
            tube((6.6, cy + 3.1), (13.2, cy + 3.7), 1.2, 0.8, bone, 0, -0.3)

def run():
    os.makedirs(CFG['out'], exist_ok=True); what = CFG.get('what') or ['medusa', 'head', 'ghost', 'skull', 'eagle', 'raven', 'pillar']
    if 'medusa' in what:
        stage(72, 64, 8); medusa(False); shot('medusa_calm'); medusa(True, ph=0.7); shot('medusa_hiss')
    if 'head' in what:
        stage(16, 16, 24)
        for i in range(2): medusa(i == 1, True, ph=i * 1.4, cx=8.0, hy=9.4, k=0.92); shot('medusahead_%d' % i)
    if 'ghost' in what:
        stage(20, 22, 20)
        for i in range(2): ghost(i * 1.6); shot('ghost_%d' % i)
    if 'skull' in what:
        stage(24, 18, 20)
        for i in range(4): fire_skull(i); shot('skull_%d' % i)
    if 'eagle' in what:
        stage(24, 12, 24)
        for i, wg in enumerate((1, 0, -1)): bird('eagle', wg); shot('eagle_%d' % i)
    if 'raven' in what:
        stage(16, 10, 28); bird('raven', None); shot('raven_perch')
        stage(16, 8, 28)
        for i, wg in enumerate((1, -1)): bird('raven', wg); shot('raven_fly%d' % i)
    if 'pillar' in what:
        stage(16, 32, 20)
        for i in range(2): pillar(i == 1); shot('pillar_%d' % i)
    print('gerendert:', what)
run()
