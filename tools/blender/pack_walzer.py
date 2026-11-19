# Die Posen des Walzerpaars aus walzer_bl.py auf Spielgröße (40×44) bringen, zu img/walzer3d.png packen und die Karte in js/walzer.js eintragen.
# python pack_walzer.py <render-dir> <walzer.js> <walzer3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
names = ['walzer_s0', 'walzer_s60', 'walzer_s120', 'walzer_bow']
W, H = 40, 44
atlas = Image.new('RGBA', (len(names) * (W + 1), H)); MAP = {}
for i, n in enumerate(names):
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), W, H)), (i * (W + 1), 0)); MAP[n] = [i * (W + 1), 0, W, H]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
