# Primadonna aus diva_bl.py (fünf Posen, je 64×88) auf Spielgröße bringen, zu img/diva3d.png packen und die Karte in
# js/diva.js eintragen. python pack_diva.py <render-dir> <diva.js> <diva3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('diva_' + p, 64, 88) for p in ('idle', 'sing0', 'sing1', 'point', 'bow')]
atlas = Image.new('RGBA', (len(JOBS) * 65, 88)); MAP = {}
for i, (n, w, h) in enumerate(JOBS):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (i * 65, 0)); MAP[n] = [i * 65, 0, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
