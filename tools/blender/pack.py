# Blender-Bilder (überabgetastet) auf Spielpixel verkleinern und zum Atlas packen.
# python pack.py preview <dir> <out.png>            – Kontrollbild (groß + verkleinert)
# python pack.py atlas <dir> <chars3d.js> <id> <out.png>   – Atlas an den Positionen der vorhandenen Karte
import sys, os, re, json, glob
from PIL import Image
FW, FH = 34, 36

def down(im, w=FW, h=FH, thr=118):
    im = im.convert('RGBA')
    # vormultipliziert verkleinern (sonst färbt der transparente Rand die Kanten dunkel), dann Kante hart
    r, g, b, a = im.split()
    pm = Image.merge('RGBA', [Image.composite(c, Image.new('L', im.size, 0), a) for c in (r, g, b)] + [a])
    pm = Image.merge('RGBA', [Image.eval(Image.merge('RGB', pm.split()[:3]).split()[i], lambda v: v) for i in range(3)] + [a])
    # echtes Vormultiplizieren
    px = im.load(); W, H = im.size
    sm = im.resize((w, h), Image.BOX)
    acc = Image.new('RGBA', (w, h)); o = acc.load(); bx, by = W // w, H // h
    for y in range(h):
        for x in range(w):
            R = G = B = A = 0
            for yy in range(y * by, (y + 1) * by):
                for xx in range(x * bx, (x + 1) * bx):
                    p = px[xx, yy]
                    if p[3]:
                        R += p[0] * p[3]; G += p[1] * p[3]; B += p[2] * p[3]; A += p[3]
            n = bx * by
            if A / n >= thr: o[x, y] = (round(R / A), round(G / A), round(B / A), 255)
            else: o[x, y] = (0, 0, 0, 0)
    return acc

def grade(im):  # etwas mehr Kontrast und Farbe, leicht gestufte Töne (wie die Nachschärfung im Spiel, die dafür entfällt)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a: continue
            l = 0.3 * r + 0.59 * g + 0.11 * b
            v = []
            for c in (r, g, b):
                c = l + (c - l) * 1.12; c = (c - 128) * 1.1 + 132; v.append(max(0, min(255, round(c / 6) * 6)))
            px[x, y] = (v[0], v[1], v[2], 255)
    return im

if sys.argv[1] == 'preview':
    d, out = sys.argv[2], sys.argv[3]
    files = sorted(glob.glob(os.path.join(d, '*.png')))[:8]
    S = 8
    sheet = Image.new('RGB', (len(files) * (FW * S + 6), FH * 12 // 2 + FH * S + 12), (58, 48, 80))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGBA')
        big = im.resize((im.width // 2, im.height // 2), Image.LANCZOS); sheet.paste(big, (i * (FW * S + 6) + 30, 0), big)
        sm = grade(down(im)).resize((FW * S, FH * S), Image.NEAREST); sheet.paste(sm, (i * (FW * S + 6), FH * 6 + 8), sm)
    sheet.save(out); print(sheet.size)
else:
    d, js, hid, out = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
    K = int(sys.argv[6]) if len(sys.argv) > 6 else 1   # Auflösungsstufe (2 = doppelt große Figur)
    FW, FH = FW * K, FH * K
    s = open(js, encoding='utf-8').read()
    mp = json.loads(re.search(r"load3d\('%s', '[^']*%s', (\{.*?\})" % (hid, re.escape(os.path.basename(out))), s).group(1))
    atlas = Image.new('RGBA', (max(v[0] for v in mp.values()) + FW, max(v[1] for v in mp.values()) + FH), (0, 0, 0, 0)); miss = 0
    for k, (x, y) in mp.items():
        f = os.path.join(d, k + '.png')
        if not os.path.exists(f): miss += 1; continue
        atlas.paste(grade(down(Image.open(f), FW, FH)), (x, y))
    atlas.save(out); print(hid, 'Bilder', len(mp) - miss, 'fehlend', miss)
