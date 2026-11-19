# Holzpuppe und Schaufensterpuppe aus puppen_bl.py auf Spielgröße bringen, zu img/puppen3d.png packen und die Karte in js/puppen.js
# eintragen. python pack_puppen.py <render-dir> <puppen.js> <puppen3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('holz_' + n, 30, 38) for n in ('walk0', 'walk1', 'wind', 'lunge')] + [('puppe%d%s' % (d, p), 32, 42) for d in range(4) for p in ('show', 'point', 'wave', 'shy', 'hip', 'reach')]
PER = 14; rows = [JOBS[i:i + PER] for i in range(0, len(JOBS), PER)]
Wt = max(sum(w + 1 for _, w, _ in r) for r in rows); Ht = sum(max(h for _, _, h in r) + 1 for r in rows)
atlas = Image.new('RGBA', (Wt, Ht)); MAP = {}; y = 0
for r in rows:
    x = 0
    for n, w, h in r:
        atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, y)); MAP[n] = [x, y, w, h]; x += w + 1
    y += max(h for _, _, h in r) + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
