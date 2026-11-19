# Die Gerichte aus kueche_bl.py zweimal verkleinern (32×28 für die Vorschau, 14×12 für die Liste), zu img/kueche3d.png packen
# und die Karte in js/kueche.js eintragen.
# python pack_kueche.py <render-dir> <kueche.js> <kueche3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
ids = ['kieselsuppe', 'zuckerwatte', 'suesssauer', 'sorbet', 'pudding', 'fischstaebchen', 'milchreis', 'gulasch']
BW, BH, SW, SH = 32, 28, 14, 12
atlas = Image.new('RGBA', (len(ids) * (BW + 1), BH + 1 + SH)); MAP = {}
for i, n in enumerate(ids):
    im = Image.open(os.path.join(src, 'dish_' + n + '.png')).convert('RGBA')
    atlas.paste(grade(down(im, BW, BH)), (i * (BW + 1), 0)); MAP['big_' + n] = [i * (BW + 1), 0, BW, BH]
    k = 12; sm = im.resize((SW * k, SH * k), Image.LANCZOS)   # erst auf ein Vielfaches bringen, dann wie üblich verkleinern
    atlas.paste(grade(down(sm, SW, SH)), (i * (SW + 1), BH + 1)); MAP['sm_' + n] = [i * (SW + 1), BH + 1, SW, SH]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
