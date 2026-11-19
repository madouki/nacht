# Die Posen des Frostgeists aus frost_bl.py auf Spielgröße (48×56) bringen, zu img/frost3d.png packen und die Karte in js/frost.js eintragen.
# python pack_frost.py <render-dir> <frost.js> <frost3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
names = ['frost_float0', 'frost_float1', 'frost_cast']
W, H = 48, 56
atlas = Image.new('RGBA', (len(names) * (W + 1), H)); MAP = {}
for i, n in enumerate(names):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), W, H)), (i * (W + 1), 0)); MAP[n] = [i * (W + 1), 0, W, H]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
