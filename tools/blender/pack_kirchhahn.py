# Kirchturmhahn Kasimir aus kirchhahn_bl.py (sechs Posen, je 96×92) auf Spielgröße bringen, zu img/kirchhahn3d.png packen und die Karte in
# js/kirchhahn.js eintragen. python pack_kirchhahn.py <render-dir> <kirchhahn.js> <kirchhahn3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('kirchhahn_' + p, 96, 92) for p in ('glide0', 'glide1', 'crow', 'dash', 'spin45', 'spin90')]
atlas = Image.new('RGBA', (len(JOBS) * 97, 92)); MAP = {}
for i, (n, w, h) in enumerate(JOBS):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (i * 97, 0)); MAP[n] = [i * 97, 0, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
