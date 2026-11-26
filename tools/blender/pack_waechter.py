# Pförtner Granitus aus waechter_bl.py (acht Posen, gerendert 64×80, gepackt 72×90) auf Spielgröße bringen, zu img/waechter3d.png
# packen und die Karte in js/waechter.js eintragen. python pack_waechter.py <render-dir> <waechter.js> <waechter3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [('gran_' + p, 72, 90) for p in ('high0', 'high1', 'low0', 'low1', 'thrustL', 'thrustH', 'leap', 'slam')]
atlas = Image.new('RGBA', (len(JOBS) * 73, 90)); MAP = {}
for i, (n, w, h) in enumerate(JOBS):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (i * 73, 0)); MAP[n] = [i * 73, 0, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
