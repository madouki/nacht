# Mann im Mond aus mond_np.py: Ebenen (Mondkugel, Augen, Brauen, Münder) auf Spielgröße, weicher Rand (vormultipliziert verkleinert),
# nach img/mond3d.png; Karte MOON_MAP in js/mond.js. Fehlende Teile werden übersprungen (das Spiel malt sie dann selbst).
# python pack_mond.py <render-dir> <mond.js> <mond3d.png>
import sys, os, re, json
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
src, js, png = sys.argv[1:4]
SZ = {'mond_base': (132, 132), 'eye_open': (22, 18), 'eye_tired': (22, 18), 'eye_shut': (22, 18), 'eye_red': (22, 18), 'brow': (24, 12), 'browa': (24, 12),
      'mund_smile': (44, 28), 'mund_open': (44, 28), 'mund_blow': (44, 28), 'mund_grim': (44, 28)}
def soft(path, w, h):
    im = Image.open(path).convert('RGBA')
    if im.width > w * 16: im = im.resize((w * 16, h * 16), Image.BOX)   # sehr große Renderings erst grob verkleinern
    r, g, b, a = im.split()
    pm = Image.merge('RGBA', [Image.composite(c, Image.new('L', im.size, 0), a) for c in (r, g, b)] + [a]).resize((w, h), Image.LANCZOS)
    px = pm.load(); out = Image.new('RGBA', (w, h)); o = out.load()
    for y in range(h):
        for x in range(w):
            R, G, B, A = px[x, y]
            if A < 10: continue
            k = 255 / A; o[x, y] = (min(255, round(R * k)), min(255, round(G * k)), min(255, round(B * k)), min(255, round(A * 1.15)))
    return out
have = {n: s for n, s in SZ.items() if os.path.exists(os.path.join(src, n + '.png'))}
x = y = rowh = 0; W = 256; MAP = {}
for n in sorted(have, key=lambda n: -have[n][1]):
    w, h = have[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    MAP[n] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
atlas = Image.new('RGBA', (W, y + rowh))
for n, (x, y, w, h) in MAP.items(): atlas.paste(soft(os.path.join(src, n + '.png'), w, h), (x, y))
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MOON_MAP = \{.*?\};', lambda m: 'const MOON_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt', atlas.size, sorted(MAP), 'fehlen', sorted(set(SZ) - set(MAP)))
