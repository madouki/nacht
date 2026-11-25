# Küster Ruprecht aus kuester_bl.py (zwei Bilder, je 40×48, Füße bei 20/48) auf Spielgröße bringen, so hell wie die anderen
# Figuren abdunkeln (wie pack_uhr.py), zu img/kuester3d.png packen und die Karte in js/kuester.js eintragen.
# python pack_kuester.py <render-dir> <kuester.js> <kuester3d.png>
import sys, os, re, json
from PIL import Image, ImageEnhance
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
atlas = Image.new('RGBA', (2 * 41, 48)); MAP = {}
for i in (0, 1):
    im = grade(down(Image.open(os.path.join(src, 'kuester%d.png' % i)), 40, 48))
    a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.74).convert('RGBA'); im.putalpha(a)
    atlas.paste(im, (i * 41, 0)); MAP['kuester%d' % i] = [i * 41, 0, 40, 48]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
