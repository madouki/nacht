# Die Bilder aus riegel_bl.py auf Spielgröße verkleinern und zu img/riegel3d.png packen; die Karte kommt nach js/riegel.js.
# python pack_riegel.py <render-dir> <riegel.js> <riegel3d.png>
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
SZ = {'door': (34, 48), 'bolt': (28, 9)}
names = sorted(f[:-4] for f in os.listdir(src) if f.endswith('.png') and f.split('_')[0] in SZ)
W = sum(SZ[n.split('_')[0]][0] + 1 for n in names); H = max(SZ[n.split('_')[0]][1] for n in names)
atlas = Image.new('RGBA', (W, H)); MAP = {}; x = 0
for n in names:
    w, h = SZ[n.split('_')[0]]
    im = grade(down(Image.open(os.path.join(src, n + '.png')), w, h))
    if n.startswith('door'):   # Eiche dunkler und kühler, damit die Tür im Schloss nicht wie frisch vom Tischler aussieht
        r, g, b, al = im.split(); im = Image.merge('RGBA', (r.point(lambda v: int(v * 0.72)), g.point(lambda v: int(v * 0.68)), b.point(lambda v: int(v * 0.70)), al))
    atlas.paste(im, (x, 0)); MAP[n] = [x, 0, w, h]; x += w + 1
atlas.save(png, optimize=True)
if os.path.exists(js):
    s = open(js, encoding='utf-8').read()
    s2 = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
    open(js, 'w', encoding='utf-8', newline='').write(s2)
print('gepackt:', len(names), atlas.size, json.dumps(MAP, separators=(',', ':')))
