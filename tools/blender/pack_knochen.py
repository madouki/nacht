# Skelett, Eisskelett und Ritter aus knochen_bl.py auf Spielgröße bringen, zu img/knochen3d.png packen und die Karte in js/knochen.js
# eintragen. python pack_knochen.py <render-dir> <knochen.js> <knochen3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [(n, 32, 36) for n in ('skel_walk0', 'skel_walk1', 'skel_throw', 'ice_walk0', 'ice_walk1', 'ice_throw')] + [(n, 48, 40) for n in ('knight_walk0', 'knight_walk1', 'knight_wind', 'knight_thrust')]
Wt = sum(w + 1 for _, w, _ in JOBS); Ht = max(h for _, _, h in JOBS)
atlas = Image.new('RGBA', (Wt, Ht)); MAP = {}; x = 0
for n, w, h in JOBS:
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, 0)); MAP[n] = [x, 0, w, h]; x += w + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
