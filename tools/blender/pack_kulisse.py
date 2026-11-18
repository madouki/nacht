# Die Bilder aus kulisse_bl.py auf Spielgröße verkleinern und zu img/kulisse3d.png packen; die Karte kommt nach js/kulisse.js.
# python pack_kulisse.py <render-dir> <kulisse.js> <kulisse3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
SZ = {'rohr': (112, 84), 'schleuse': (88, 88), 'stuetze': (72, 104), 'lore': (72, 44), 'teleskop': (176, 144), 'bohrer': (112, 116), 'palme': (88, 112)}
names = sorted(n for n in SZ if os.path.exists(os.path.join(src, n + '.png')))
W = 360; x = y = rowh = 0; MAP = {}; place = []
for n in sorted(names, key=lambda k: -SZ[k][1]):
    w, h = SZ[n]
    if x + w > W: x = 0; y += rowh + 1; rowh = 0
    place.append((n, x, y)); MAP[n] = [x, y, w, h]; x += w + 1; rowh = max(rowh, h)
atlas = Image.new('RGBA', (W, y + rowh))
for n, px, py in place:
    atlas.paste(grade(down(Image.open(os.path.join(src, n + '.png')), *SZ[n])), (px, py))
atlas.save(png, optimize=True)
if os.path.exists(js):
    s = open(js, encoding='utf-8').read()
    s2 = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
    open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(names), atlas.size, json.dumps(MAP, separators=(',', ':')))
