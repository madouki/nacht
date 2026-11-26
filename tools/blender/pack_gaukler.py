# Lunatus, der Mondgaukler, aus gaukler_bl.py: neun Posen (gerendert 64×88 → 48×66) und vier Drehstellungen der Kugel
# (44×44 → 34×34) auf Spielgröße bringen, zu img/gaukler3d.png packen und die Karte in js/gaukler.js eintragen.
# python pack_gaukler.py <render-dir> <gaukler.js> <gaukler3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
POSES = ['idle0', 'idle1', 'roll', 'juggle0', 'juggle1', 'throw', 'hop', 'dizzy', 'bow']
JOBS = [('gk_' + p, 'gaukler_' + p, 48, 66) for p in POSES] + [('gk_ball%d' % k, 'gaukler_ball%d' % k, 34, 34) for k in range(4)]
atlas = Image.new('RGBA', (9 * 49, 67 + 35)); MAP = {}
for i, (n, f, w, h) in enumerate(JOBS):
    x, y = (i * 49, 0) if i < 9 else ((i - 9) * 35, 67)
    atlas.paste(grade(down(Image.open(os.path.join(src, f + '.png')), w, h)), (x, y)); MAP[n] = [x, y, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
