# Die Uhrwerk-Bilder aus uhr_bl.py auf Spielgröße verkleinern, zu img/uhr3d.png packen (Regalpackung) und die Karte
# (const UHR_MAP = {...};) in js/glocken.js eintragen.  python pack_uhr.py <render-dir> <glocken.js> <uhr3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]; npc = sys.argv[4] if len(sys.argv) > 4 else None   # optional: Render-Ordner der Figuren (npc_bl.py)
SZ = {'house': (128, 96), 'bird0': (32, 24), 'bird1': (32, 24), 'bob': (28, 28), 'cone': (10, 16), 'dial': (188, 188),
      'hand': (96, 14), 'hub': (40, 40), 'gearB': (112, 112), 'gearS': (64, 64),
      'bell': (64, 96), 'trolley0': (24, 14), 'trolley1': (24, 14), 'rail': (32, 9), 'lion': (14, 20)}
if npc: SZ.update({'n_' + k + str(f): (28, 44) for k in ('bell', 'guide', 'clock') for f in (0, 1)})   # Glöckner, Bergführer, Uhrmacher
if npc: SZ.update({'n_' + k + str(f): (40, 48) for k in ('kalle', 'anatol', 'carto', 'cook') for f in (0, 1)})   # Knochen-Kalle, Anatol, Kartograf, Kantinenchefin
if npc: SZ.update({'n_' + k + str(f): (40, 48) for k in ('librarian', 'prisoner', 'speed', 'clerk', 'chicken') for f in (0, 1)}); SZ.update({'n_watch': (10, 10)} if npc else {})   # Bibliothekar, Gefangener, Geist, Stempelmann, Huhn, Stoppuhr
names = sorted(SZ, key=lambda n: -SZ[n][1])
W = 640; x = y = rowh = 0; MAP = {}
for n in names:   # Regale: nach Höhe sortiert, Zeile für Zeile
    w, h = SZ[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    MAP[n] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
H = y + rowh
atlas = Image.new('RGBA', (W, H))
from PIL import ImageEnhance
for n, (x, y, w, h) in MAP.items():
    im = grade(down(Image.open(os.path.join(npc, n[2:] + '.png') if n.startswith('n_') else os.path.join(src, n + '.png')), w, h))
    if n.startswith('n_'): a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.74).convert('RGBA'); im.putalpha(a)   # Figuren: so hell wie die Helden (sonst überstrahlt das Glühen)
    atlas.paste(im, (x, y))
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8').read()
s2 = re.sub(r'const UHR_MAP = \{.*?\};', lambda m: 'const UHR_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(MAP), atlas.size, 'Karte', 'eingetragen' if s2 != s else 'unverändert/NICHT gefunden')
