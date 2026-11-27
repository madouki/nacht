# Sternbild aus stern_np.py: drei Atlasfiguren und zwei Sterne auf Spielgröße (halbe Rendergröße), weicher Rand (vormultipliziert
# verkleinert), nach img/stern3d.png; Karte STERN_MAP in js/stern.js: [x, y, w, h, ox, oy] mit (ox, oy) = Bildmitte des Sternbilds.
# python pack_stern.py <render-dir> <stern.js> <stern3d.png>
import sys, os, re, json
import numpy as np
from PIL import Image
src, js, png = sys.argv[1:4]
meta = json.load(open(os.path.join(src, 'meta.json')))
def soft(path, w, h):
    im = Image.open(path).convert('RGBA'); a = np.asarray(im, dtype=np.float32) / 255
    pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    pm = np.asarray(Image.fromarray((pm * 255).astype(np.uint8), 'RGBA').resize((w, h), Image.LANCZOS), dtype=np.float32) / 255
    A = pm[..., 3:4]; rgb = np.where(A > 0.02, pm[..., :3] / np.maximum(A, 1e-3), 0)
    return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), np.clip(A * 1.1, 0, 1)]) * 255).astype(np.uint8), 'RGBA')
parts = {}
for n, m in meta.items(): parts[n] = (m['w'] // 2, m['h'] // 2, round(m['ox'] / 2, 1), round(m['oy'] / 2, 1))
for n in ('star_w', 'star_r'): parts[n] = (32, 32, 16, 16)
x = y = rowh = 0; W = 600; MAP = {}
for n in sorted(parts, key=lambda n: -parts[n][1]):
    w, h, ox, oy = parts[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    MAP[n] = [x, y, w, h, ox, oy]; x += w + 1; rowh = max(rowh, h)
atlas = Image.new('RGBA', (W, y + rowh))
for n, (x, y, w, h, ox, oy) in MAP.items(): atlas.paste(soft(os.path.join(src, n + '.png'), w, h), (x, y))
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s, k = re.subn(r'const STERN_MAP = \{.*?\};', lambda m: 'const STERN_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt', atlas.size, MAP, 'ersetzt', k)
