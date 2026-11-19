# Hängt die Bilder aus kulisse2_bl.py unten an img/kulisse3d.png an (vorhandene Stücke bleiben, wo sie sind) und ergänzt die Karte in js/kulisse.js.
# python pack_kulisse2.py <render-dir> <kulisse.js> <kulisse3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
SZ = {'orgel': (168, 152), 'gladiator': (96, 136), 'globus': (72, 104), 'eis': (116, 92), 'fluegel': (124, 84), 'sarkophag': (104, 64)}
s = open(js, encoding='utf-8', newline='').read()
MAP = json.loads(re.search(r'const MAP = (\{.*?\});', s, re.S).group(1))
atlas = Image.open(png).convert('RGBA'); W = atlas.width
fresh = [n for n in sorted(SZ, key=lambda k: -SZ[k][1]) if n not in MAP]
x = 0; y = atlas.height + 1; rowh = 0
for n in fresh:
    w, h = SZ[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    MAP[n] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
H = max(v[1] + v[3] for v in MAP.values())
out = Image.new('RGBA', (W, H)); out.paste(atlas, (0, 0))
for n in SZ:
    px, py, w, h = MAP[n]; out.paste((0, 0, 0, 0), (px, py, px + w, py + h)); out.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (px, py))
out.save(png, optimize=True)
s2 = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(SZ), out.size)
