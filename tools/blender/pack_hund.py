# Die Posen des Kettenhunds (96×64) und seines Welpen Krümel (28×20) aus hund_bl.py auf Spielgröße bringen, zu img/hund3d.png
# packen und die Karte in js/hund.js eintragen.
# python pack_hund.py <render-dir> <hund.js> <hund3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('hund_' + n, 96, 64) for n in ('stand0', 'stand1', 'crouch', 'leap', 'bark', 'choke')] + [('pup_' + n, 28, 20) for n in ('run0', 'run1', 'bite', 'sit')]
Wt = sum(w + 1 for _, w, _ in JOBS); Ht = max(h for _, _, h in JOBS)
atlas = Image.new('RGBA', (Wt, Ht)); MAP = {}; x = 0
for n, w, h in JOBS:
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, 0)); MAP[n] = [x, 0, w, h]; x += w + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
