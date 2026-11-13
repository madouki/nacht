# Die Bilder aus props_bl.py auf Spielgröße verkleinern, zu img/props3d.png packen und die Karte in js/props3d.js eintragen.
# python pack_props.py <render-dir> <props3d.js> <props3d.png> [weitere Render-Ordner …]
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
js, png, dirs = sys.argv[2], sys.argv[3], [sys.argv[1]] + sys.argv[4:]   # weitere Render-Ordner hinten anhängen
SZ = {'candle': (8, 16), 'torch': (12, 20), 'candelabra': (28, 58), 'brazier': (32, 68),
      'heartS': (8, 8), 'heartB': (14, 12), 'bag': (12, 15), 'bagBig': (12, 15), 'roast': (16, 13), 'orb': (16, 15)}   # Sammelgegenstände (items_bl.py)
files = {f[:-4]: os.path.join(d, f) for d in dirs for f in os.listdir(d) if f.endswith('.png') and f.split('_')[0] in SZ}; names = sorted(files)
W = sum(SZ[n.split('_')[0]][0] + 1 for n in names); H = max(SZ[n.split('_')[0]][1] for n in names)
atlas = Image.new('RGBA', (W, H)); MAP = {}; x = 0
for n in names:
    w, h = SZ[n.split('_')[0]]
    atlas.paste(grade(down(Image.open(files[n]), w, h)), (x, 0)); MAP[n] = [x, 0, w, h]; x += w + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8').read()
s2 = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(names), atlas.size, 'Karte', 'eingetragen' if s2 != s or json.dumps(MAP, separators=(',', ':')) in s else 'NICHT gefunden')
