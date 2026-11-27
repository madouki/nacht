# Klötzchenburg aus burg_bl.py packen: sechs Räume (Render 832×456 → 416×228) nach img/burg3d.png, alle Dinge (Render vierfach →
# Fenstergröße, weicher Rand, vormultipliziert verkleinert) nach img/burgobj.png; ROOM_MAP und OBJ_MAP in js/burg.js eintragen.
# python pack_burg.py <render-dir> <burg.js> <burg3d.png> <burgobj.png>
import sys, os, re, json
from PIL import Image, ImageEnhance, ImageFilter
src, js, rpng, opng = sys.argv[1:5]
WIN = json.load(open(os.path.join(src, 'win.json')))

def room(path):
    im = Image.open(path).convert('RGB').resize((416, 228), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=40, threshold=2))
    im = ImageEnhance.Contrast(im).enhance(1.06); im = ImageEnhance.Color(im).enhance(1.08)
    return im
def soft(path, w, h):
    im = Image.open(path).convert('RGBA'); W, H = im.size
    r, g, b, a = im.split(); A = a.point(lambda v: v)
    pm = Image.merge('RGBA', [Image.composite(c, Image.new('L', im.size, 0), a) for c in (r, g, b)] + [a])   # vormultiplizieren
    small = pm.resize((w, h), Image.LANCZOS); px = small.load()
    out = Image.new('RGBA', (w, h)); o = out.load()
    for y in range(h):
        for x in range(w):
            R, G, B, Al = px[x, y]
            if Al < 12: continue
            k = 255 / Al; c = [min(255, round(v * k)) for v in (R, G, B)]
            l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
            c = [max(0, min(255, round((l + (v - l) * 1.08 - 128) * 1.05 + 130))) for v in c]
            o[x, y] = (c[0], c[1], c[2], min(255, round(Al * 1.25)))
    return out

keys = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5']
RA = Image.new('RGB', (2 * 417, 3 * 229)); RM = {}
for i, k in enumerate(keys):
    x, y = (i % 2) * 417, (i // 2) * 229
    RA.paste(room(os.path.join(src, 'room_' + k + '.png')), (x, y)); RM[k] = [x, y, 416, 228]
RA.save(rpng, optimize=True)

items = sorted(WIN.items(), key=lambda kv: -kv[1][3]); OA_W = 512; x = y = rowh = 0; place = {}
for n, (u0, v0, w, h) in items:   # Regale füllen, höchste zuerst
    if x + w > OA_W: x = 0; y += rowh + 1; rowh = 0
    place[n] = (x, y); x += w + 1; rowh = max(rowh, h)
OA = Image.new('RGBA', (OA_W, y + rowh)); OM = {}
for n, (u0, v0, w, h) in WIN.items():
    px_, py_ = place[n]; OA.paste(soft(os.path.join(src, 'o_' + n + '.png'), w, h), (px_, py_)); OM[n] = [px_, py_, w, h, u0, v0]
OA.save(opng, optimize=True)

s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const ROOM_MAP = \{.*?\};', lambda m: 'const ROOM_MAP = ' + json.dumps(RM, separators=(',', ':')) + ';', s, count=1, flags=re.S)
s = re.sub(r'const OBJ_MAP = \{.*?\};', lambda m: 'const OBJ_MAP = ' + json.dumps(OM, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('Räume', RA.size, 'Dinge', OA.size, len(OM))
