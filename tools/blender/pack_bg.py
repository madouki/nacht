# Hintergrundbilder aus crypt_bg_bl.py und bg2_bl.py auf Spielgröße (512×208) bringen und tönen.
# python pack_bg.py <render-dir> <out-dir> [name ...]     → <out-dir>/<name>.png
# Je Bild: Sättigung, Helligkeit, Abdunklung am oberen Rand, Nebelfarbe und -anteil, deckender Grund (ferne Ebene der Gruft).
# Die Raumbeleuchtung des Spiels dunkelt Hintergründe stark ab – darum hier eher zu hell als zu dunkel tönen.
import sys, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
JOBS = {
    'crypt_wall':   dict(sat=0.85, gain=1.28, top=0.82),
    'crypt_far':    dict(sat=0.7, gain=0.95, top=0.8, fog=(20, 30, 64), fk=0.36, ground=True),
    'cave_far':     dict(sat=0.8, gain=0.72, top=0.85, fog=(14, 10, 8), fk=0.15),
    'cave_pillars': dict(sat=0.75, gain=0.8, top=0.9),
    'tower_wall':   dict(sat=0.85, gain=1.0, top=0.85),
}
def small(name):
    im = Image.open(os.path.join(d, name + '.png')).convert('RGBA'); W, H = 512, 208
    pm = im.copy(); px = pm.load()   # vormultipliziert verkleinern (sonst dunkle Säume an durchsichtigen Stellen)
    for y in range(pm.height):
        for x in range(pm.width):
            r, g, b, a = px[x, y]; px[x, y] = (r * a // 255, g * a // 255, b * a // 255, a)
    sm = pm.resize((W, H), Image.BOX); q = sm.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = q[x, y]
            q[x, y] = (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), 255) if a >= 128 else (0, 0, 0, 0)
    return sm
def grade(im, sat=1.0, gain=1.0, top=1.0, fog=None, fk=0.0, **_):
    q = im.load(); W, H = im.size
    for y in range(H):
        g = gain * (top + (1 - top) * min(1.0, y / (H * 0.6)))
        for x in range(W):
            r, gg, b, a = q[x, y]
            if not a: continue
            l = 0.3 * r + 0.59 * gg + 0.11 * b; v = [(l + (c - l) * sat) * g for c in (r, gg, b)]
            if fog: v = [c * (1 - fk) + f * fk for c, f in zip(v, fog)]
            q[x, y] = tuple(max(0, min(255, round(c / 4) * 4)) for c in v) + (255,)
    return im
for name in sys.argv[3:] or JOBS:
    if not os.path.exists(os.path.join(d, name + '.png')): print('fehlt:', name); continue
    j = JOBS[name]; im = grade(small(name), **j)
    if j.get('ground'):   # deckender, nach unten heller werdender Nachtgrund hinter der fernen Ebene
        bg = Image.new('RGBA', im.size, (0, 0, 0, 255)); q = bg.load()
        for y in range(im.height):
            for x in range(im.width): q[x, y] = (5 + y // 26, 7 + y // 20, 18 + y // 9, 255)
        bg.alpha_composite(im); im = bg
    opaque = im.getextrema()[3][0] == 255
    (im.convert('RGB') if opaque else im).save(os.path.join(out, name + '.png'), optimize=True)
    print('ok', name, 'deckend' if opaque else 'mit Durchsicht')
