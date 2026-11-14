# Die Uhrwerk-Bilder aus uhr_bl.py auf Spielgröße verkleinern, zu img/uhr3d.png packen (Regalpackung) und die Karte
# (const UHR_MAP = {...};) in js/glocken.js eintragen.  python pack_uhr.py <render-dir> <glocken.js> <uhr3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
SZ = {'house': (128, 96), 'bird0': (32, 24), 'bird1': (32, 24), 'bob': (28, 28), 'cone': (10, 16), 'dial': (188, 188),
      'hand': (96, 14), 'hub': (40, 40), 'gearB': (112, 112), 'gearS': (64, 64)}
names = sorted(SZ, key=lambda n: -SZ[n][1])
W = 512; x = y = rowh = 0; MAP = {}
for n in names:   # Regale: nach Höhe sortiert, Zeile für Zeile
    w, h = SZ[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    MAP[n] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
H = y + rowh
atlas = Image.new('RGBA', (W, H))
for n, (x, y, w, h) in MAP.items(): atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), (x, y))
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8').read()
s2 = re.sub(r'const UHR_MAP = \{.*?\};', lambda m: 'const UHR_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(MAP), atlas.size, 'Karte', 'eingetragen' if s2 != s else 'unverändert/NICHT gefunden')
