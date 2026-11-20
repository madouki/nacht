# Madame Vitrina aus vitrina_bl.py (sechs Posen, je 48×64) auf Spielgröße bringen, zu img/vitrina3d.png packen und die Karte in
# js/vitrina.js eintragen. python pack_vitrina.py <render-dir> <vitrina.js> <vitrina3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('vitrina_' + p, 48, 64) for p in ('show', 'point', 'wave', 'shy', 'hip', 'reach')]
atlas = Image.new('RGBA', (len(JOBS) * 49, 64)); MAP = {}
for i, (n, w, h) in enumerate(JOBS):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (i * 49, 0)); MAP[n] = [i * 49, 0, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
