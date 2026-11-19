# Die fünf Posen der Schildwache aus schild_bl.py auf Spielgröße (80×60) bringen, zu img/wache3d.png packen und die Karte in js/wache.js eintragen.
# python pack_wache.py <render-dir> <wache.js> <wache3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
names = ['schild_walk0', 'schild_walk1', 'schild_wind', 'schild_thrust', 'schild_recover']
W, H = 80, 60
atlas = Image.new('RGBA', (len(names) * (W + 1), H)); MAP = {}
for i, n in enumerate(names):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), W, H)), (i * (W + 1), 0)); MAP[n] = [i * (W + 1), 0, W, H]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
