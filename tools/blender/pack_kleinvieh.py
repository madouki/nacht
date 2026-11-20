# Postamt-Figuren und Qualle aus kleinvieh_bl.py auf Spielgröße bringen, zu img/kleinvieh3d.png packen und die Karte in js/kleinvieh.js eintragen.
# python pack_kleinvieh.py <render-dir> <kleinvieh.js> <kleinvieh3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('brief_up', 24, 18), ('brief_down', 24, 18)] + [('nach_' + p, 36, 36) for p in ('sleep', 'wake', 'open')]
JOBS += [('paket%d' % c, 32, 32) for c in range(4)] + [('qualle_' + p, 20, 24) for p in ('a', 'b', 'sq')]
JOBS += [('kalb_' + p, 24, 22) for p in ('idle', 'squash', 'air')] + [('mimik_' + p, 20, 30) for p in ('shut', 'open_a', 'open_b')]
W = sum(w + 1 for _, w, _ in JOBS); H = max(h for _, _, h in JOBS)
atlas = Image.new('RGBA', (W, H)); MAP = {}; x = 0
for n, w, h in JOBS:
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, 0)); MAP[n] = [x, 0, w, h]; x += w + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
