# Aktenordner aus akten_bl.py (vier Farben × closed/half/open, je 28×36) auf Spielgröße bringen, zu img/akten3d.png packen und die
# Karte in js/akten.js eintragen. python pack_akten.py <render-dir> <akten.js> <akten3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('akte%d_%s' % (c, p), 28, 36) for c in range(4) for p in ('closed', 'half', 'open')]
atlas = Image.new('RGBA', (len(JOBS) * 29, 36)); MAP = {}
for i, (n, w, h) in enumerate(JOBS):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (i * 29, 0)); MAP[n] = [i * 29, 0, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
