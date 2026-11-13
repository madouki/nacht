# Hintergrundbilder aus crypt_bg_bl.py auf Spielgröße bringen: Wand (mit durchsichtigem Bogen) und ferne Ebene (eingenebelt).
# python pack_bg.py <render-dir> <out-dir>     → <out-dir>/crypt_wall.png, crypt_far.png (je 512×208)
import sys, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
def small(name):
    im = Image.open(os.path.join(d, name + '.png')).convert('RGBA'); W, H = 512, 208
    pm = im.copy(); px = pm.load()   # vormultipliziert verkleinern (sonst dunkle Säume am durchsichtigen Bogen)
    for y in range(pm.height):
        for x in range(pm.width):
            r, g, b, a = px[x, y]; px[x, y] = (r * a // 255, g * a // 255, b * a // 255, a)
    sm = pm.resize((W, H), Image.BOX); q = sm.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = q[x, y]
            q[x, y] = (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), 255) if a >= 128 else (0, 0, 0, 0)
    return sm
def grade(im, sat, gain, top, fog=None, fk=0.0):  # sat: Sättigung, gain: Helligkeit, top: Abdunklung am oberen Rand, fog: Nebelfarbe
    q = im.load(); W, H = im.size
    for y in range(H):
        g = gain * (top + (1 - top) * min(1.0, y / (H * 0.6)))
        for x in range(W):
            r, gg, b, a = q[x, y]
            if not a: continue
            l = 0.3 * r + 0.59 * gg + 0.11 * b; v = [l + (c - l) * sat for c in (r, gg, b)]
            v = [c * g for c in v]
            if fog: v = [c * (1 - fk) + f * fk for c, f in zip(v, fog)]
            q[x, y] = tuple(max(0, min(255, round(c / 4) * 4)) for c in v) + (255,)
    return im
grade(small('crypt_wall'), 0.85, 1.28, 0.82).save(os.path.join(out, 'crypt_wall.png'), optimize=True)
far = small('crypt_far'); bg = Image.new('RGBA', far.size, (0, 0, 0, 255)); q = bg.load()
for y in range(far.height):
    for x in range(far.width): q[x, y] = (5 + y // 26, 7 + y // 20, 18 + y // 9, 255)
bg.alpha_composite(grade(far, 0.7, 0.95, 0.8, (20, 30, 64), 0.36)); bg.convert('RGB').save(os.path.join(out, 'crypt_far.png'), optimize=True)
print('ok', out)
