# Traumfänger aus traumfaenger_bl.py: zwölf Drehstellungen und die Leuchtmaske (gerendert 352×512) auf 44×64 bringen.
# Anders als bei den Figuren bleibt der Rand weich (vormultipliziert verkleinert, Alpha nur leicht angehoben), sonst zerfällt
# das feine Netz in Einzelpixel. Packt img/traumfaenger.png und trägt die Karte in js/mahr.js ein.
# python pack_traumfaenger.py <render-dir> <mahr.js> <traumfaenger.png>
import sys, os, re, json
from PIL import Image
src, js, png = sys.argv[1:4]
FW, FH = 44, 64

def soft(im, w, h, gain=1.35):
    im = im.convert('RGBA'); W, H = im.size; px = im.load(); bx, by = W // w, H // h
    out = Image.new('RGBA', (w, h)); o = out.load()
    for y in range(h):
        for x in range(w):
            R = G = B = A = 0
            for yy in range(y * by, (y + 1) * by):
                for xx in range(x * bx, (x + 1) * bx):
                    p = px[xx, yy]
                    if p[3]: R += p[0] * p[3]; G += p[1] * p[3]; B += p[2] * p[3]; A += p[3]
            a = A / (bx * by)
            if a < 10: continue
            c = [R / A, G / A, B / A]
            l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
            c = [max(0, min(255, round((l + (v - l) * 1.12 - 128) * 1.08 + 130))) for v in c]   # etwas mehr Farbe und Kontrast
            o[x, y] = (c[0], c[1], c[2], min(255, round(a * gain)))
    return out

N = 12
atlas = Image.new('RGBA', ((N + 1) * (FW + 1), FH)); MAP = {}
for k in range(N + 1):
    name = 'tf_%02d' % k if k < N else 'tf_glow'
    im = soft(Image.open(os.path.join(src, name + '.png')), FW, FH, 1.6 if k == N else 1.35)
    atlas.paste(im, (k * (FW + 1), 0)); MAP[name] = [k * (FW + 1), 0, FW, FH]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const TF_MAP = \{.*?\};', lambda m: 'const TF_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
