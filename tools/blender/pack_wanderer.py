# Die Oberwelt-Helden aus wanderer_bl.py (Henrik und Ragnor als Spielzeugfiguren, je 4 Richtungen × 3 Laufbilder, 26×34) zu
# img/wanderer3d.png packen – mit feiner dunkler Kontur, damit die Figur auf der bunten Karte lesbar bleibt – und die Karte in
# js/umland.js eintragen (const HERO_MAP). python pack_wanderer.py <render-dir> <umland.js> <wanderer3d.png>
import sys, os, re, json
from PIL import Image, ImageFilter, ImageChops
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
FW, FH = 26, 34
def outline(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 90 else 0)
    ring = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(3)), a)
    o = Image.new('RGBA', im.size, (20, 12, 28, 0)); o.putalpha(ring.point(lambda v: 210 if v else 0))
    o.alpha_composite(im); return o
JOBS = ['%s_%d_%d' % (w, d, f) for w in ('henrik', 'ragnor') for d in range(4) for f in range(3)]
atlas = Image.new('RGBA', (12 * (FW + 1), 2 * (FH + 1))); MAP = {}
for i, n in enumerate(JOBS):
    x, y = (i % 12) * (FW + 1), (i // 12) * (FH + 1)
    atlas.paste(outline(grade(down(Image.open(os.path.join(src, n + '.png')), FW, FH))), (x, y)); MAP[n] = [x, y, FW, FH]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const HERO_MAP = \{.*?\};', lambda m: 'const HERO_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
