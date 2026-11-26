# Die Oberwelt-Helden aus wanderer_bl.py (Henrik und Ragnor, je 4 Richtungen × 3 Laufbilder, 22×30) zu img/wanderer3d.png packen und
# die Karte in js/umland.js eintragen (const HERO_MAP). python pack_wanderer.py <render-dir> <umland.js> <wanderer3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = ['%s_%d_%d' % (w, d, f) for w in ('henrik', 'ragnor') for d in range(4) for f in range(3)]
atlas = Image.new('RGBA', (12 * 23, 2 * 31)); MAP = {}
for i, n in enumerate(JOBS):
    x, y = (i % 12) * 23, (i // 12) * 31
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), 22, 30)), (x, y)); MAP[n] = [x, y, 22, 30]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const HERO_MAP = \{.*?\};', lambda m: 'const HERO_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
