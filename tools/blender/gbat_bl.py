# Riesenfledermaus (erster Hauptboss) für NACHTMAHR in Blender: von vorn, Bildfeld 128×84 Spielpixel. 8 Flügelschlag-Phasen
# mit geschlossenem und mit aufgerissenem Maul, dazu die ruhende Haltung (Flügel angelegt). Aufruf: CFG = {'dir', 'out', 'ss'}.
import bpy, bmesh, math, os
_src = open(os.path.join(CFG['dir'], 'count_bl.py'), encoding='utf-8').read()
_pre = _src[:_src.index('def count(')].replace('FW, FH = 100, 88', 'FW, FH = 128, 84')
exec(compile(_pre, 'helpers', 'exec'))

def bat(a, mouth, fold=False):  # a: Flügelwinkel in rad (+ = oben)
    cx, by = 64, 41 - (0 if fold else math.sin(a) * 1.0)
    fur, furL, furD = M('#402654', 0.9), M('#64427c', 0.9), M('#22122e', 0.9)
    memb, membL = M('#55206c', 0.5, 0, 0, 0.35, 0.7), M('#7c3088', 0.5, 0, 0, 0.35, 0.7)
    bone, claw = M('#a878b4', 0.45), M('#e8e0d0', 0.3)
    eye, glint = M('#fc2c1c', 0.3, 0, 3.2), M('#fff0d0', 0.3, 0, 4.0)
    maw, tongue, pink = M('#5c0c1c', 0.5), M('#d05070', 0.5), M('#c86090', 0.6)
    # ---- Flügel ----
    for s in (-1, 1):
        if fold:  # angelegt: wie ein Mantel um den Leib
            S(cx + s * 6.2, by + 3.5, -1.5, 4.2, memb, 5.2, 11.5, (0, math.radians(s * 6), 0)); S(cx + s * 4.2, by + 5, -3.6, 2.6, membL, 2.6, 9.5, (0, math.radians(s * 10), 0))
            tube((cx + s * 6, by - 4), (cx + s * 8.6, by + 6), 1.4, 1.1, bone, -3); tube((cx + s * 8.6, by + 6), (cx + s * 5.5, by + 14), 1.0, 0.6, bone, -3)
            continue
        S_ = (cx + s * 6, by - 5)
        ea = a * 0.7 + 0.12; E = (S_[0] + s * math.cos(ea) * 14, S_[1] - math.sin(ea) * 14)
        wa = a * 1.15 - 0.05; Wr = (E[0] + s * math.cos(wa) * 13, E[1] - math.sin(wa) * 13)
        span = 0.86 + 0.14 * math.cos(a)
        F = [(Wr[0] + s * math.cos(a * 1.2 + d) * L * span, Wr[1] - math.sin(a * 1.2 + d) * L) for d, L in ((0.55, 20), (-0.05, 25), (-0.6, 23), (-1.25, 19))]
        B = (cx + s * 4, by + 10)
        for i in range(3):  # Hautfelder zwischen den Fingern, Saum eingebuchtet, leicht gewölbt
            p, q = F[i], F[i + 1]
            def panel(u, v, p=p, q=q, Wr=Wr):
                hx, hy = p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u
                k = 1 - 0.2 * math.sin(math.pi * u)
                return (Wr[0] + (hx - Wr[0]) * v * k, Wr[1] + (hy - Wr[1]) * v * k, 3.0 + 1.8 * math.sin(math.pi * u) * v)
            grid(panel, 10, 8, membL if i == 1 else memb)
        def inner(u, v, S_=S_, E=E, Wr=Wr, F=F, B=B):
            tx, ty = poly_at([S_, E, Wr], u)
            bx, byy = B[0] + (F[3][0] - B[0]) * u, B[1] + (F[3][1] - B[1]) * u
            k = 1 - 0.18 * math.sin(math.pi * u)
            return (tx + (bx - tx) * v * k, ty + (byy - ty) * v * k, 3.2 + 1.6 * math.sin(math.pi * u) * v)
        grid(inner, 12, 8, memb)
        tube(S_, E, 2.0, 1.5, furL, 1.0); tube(E, Wr, 1.4, 1.1, bone, 1.4)        # Arm
        for f in F: tube(Wr, f, 0.85, 0.35, bone, 1.8)                             # Finger
        add('k', Wr[0], Wr[1] - 2.2, 0.6, 0.7, 0.7, 2.2, claw)                     # Daumenkralle
    # ---- Leib ----
    S(cx, by + 2.5, 0, 7.2, fur, 6.2, 8.8); S(cx, by + 4, -3.6, 4.6, furL, 3.2, 6.0)      # Rumpf, heller Bauch
    S(cx, by - 4.2, -1.2, 6.4, furL, 5.2, 3.2)                                           # Halskrause
    for s in (-1, 1):
        S(cx + s * 2.8, by + 11.2, -2.4, 1.5, furD, 1.6, 1.4)
        for k in (-1, 0, 1): add('k', cx + s * 2.8 + k * 0.9, by + 13.2, -3.0, 0.35, 0.35, 1.0, claw, (math.radians(180), 0, 0))   # Krallen
    # ---- Kopf ----
    hy = by - 9.5
    S(cx, hy, -1.5, 6.0, fur, 5.6, 5.6)
    S(cx, hy + 2.0, -5.4, 2.9, furL, 2.6, 2.3); S(cx, hy + 1.0, -7.4, 1.2, furD, 0.9, 1.0)     # Schnauze, Nase
    for s in (-1, 1):
        add('k', cx + s * 4.6, hy - 6.6, -0.6, 2.7, 1.6, 5.2, fur, (0, math.radians(s * 16), 0))        # Ohren
        add('k', cx + s * 4.5, hy - 6.0, -1.9, 1.5, 0.8, 3.8, pink, (0, math.radians(s * 16), 0))
        S(cx + s * 2.7, hy - 1.0, -5.9, 1.75, eye, 0.8, 1.15, (0, math.radians(-s * 16), 0)); S(cx + s * 2.4, hy - 1.3, -6.5, 0.5, glint, 0.3, 0.45)   # Augen
        S(cx + s * 2.9, hy - 2.7, -5.9, 2.2, furD, 0.7, 0.55, (0, math.radians(s * 22), 0))              # Brauen
    if mouth:  # aufgerissenes Maul: dunkler Rachen, lange Fänge, Zunge
        S(cx, hy + 4.6, -5.0, 3.2, maw, 2.2, 3.0); S(cx, hy + 5.6, -6.0, 1.6, tongue, 1.0, 1.4)
        for s in (-1, 1):
            add('k', cx + s * 1.9, hy + 3.9, -6.6, 0.55, 0.5, 1.7, claw, (math.radians(180), 0, 0)); add('k', cx + s * 1.3, hy + 6.6, -6.4, 0.45, 0.4, 1.2, claw)
        S(cx, hy + 7.6, -4.6, 3.0, furL, 2.2, 1.2)                                                       # Unterkiefer
    else:
        S(cx, hy + 3.7, -6.6, 2.0, maw, 0.6, 0.4)
        for s in (-1, 1): add('k', cx + s * 1.3, hy + 4.7, -6.8, 0.42, 0.4, 1.05, claw, (math.radians(180), 0, 0))

def run():
    reset(); setup(); meshes()
    out = CFG['out']; os.makedirs(out, exist_ok=True); n = 0
    def shot(name, *args):
        clear(); bat(*args); bpy.context.scene.render.filepath = os.path.join(out, name + '.png'); bpy.ops.render.render(write_still=True)
    only = CFG.get('only')
    for i in range(8):
        a = math.sin(i / 8 * math.pi * 2); a *= 0.66 if a > 0 else 0.85   # nach oben flacher: die Spitzen bleiben im Bild
        if only and i not in only: continue
        shot('gbat_flap%d' % i, a, False); shot('gbat_open%d' % i, a, True); n += 2
    if not only: shot('gbat_fold', 0, False, True); n += 1
    clear(); print('Riesenfledermaus gerendert', n)
run()
