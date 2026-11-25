# Wahrsageautomat aus orakel_bl.py: zwei Raumbilder (40×64) und zwei Nahaufnahmen (160×120) zu img/orakel3d.png packen und die
# Karte in js/orakel.js eintragen. python pack_orakel.py <render-dir> <orakel.js> <orakel3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('orakel0', 40, 64, 0, 0), ('orakel1', 40, 64, 41, 0), ('orakelNah0', 160, 120, 82, 0), ('orakelNah1', 160, 120, 243, 0)]
atlas = Image.new('RGBA', (404, 120)); MAP = {}
for n, w, h, x, y in JOBS:
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, y)); MAP[n] = [x, y, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
