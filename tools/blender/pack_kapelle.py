# Die Knochenkapelle aus kapelle_bl.py (Guitarrón, Trompete, Geige, je zwei Bilder 32×48) zu img/kapelle3d.png packen und die
# Karte in js/kapelle.js eintragen. python pack_kapelle.py <render-dir> <kapelle.js> <kapelle3d.png>
import sys, os, re, json
from PIL import Image, ImageEnhance
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
JOBS = [k + str(f) for k in ('guit', 'trump', 'viol') for f in (0, 1)]
atlas = Image.new('RGBA', (len(JOBS) * 33, 48)); MAP = {}
for i, n in enumerate(JOBS):
    im = grade(down(Image.open(os.path.join(src, n + '.png')), 32, 48)); a = im.getchannel('A')
    im = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.82).convert('RGBA'); im.putalpha(a)   # Figuren nicht heller als die Helden
    atlas.paste(im, (i * 33, 0)); MAP[n] = [i * 33, 0, 32, 48]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
