# Die Grafschaft Krat aus umland_bl.py (Render in doppelter Größe) auf 896×512 bringen (16 px je Kachel), nachts abgestimmt:
# etwas mehr Kontrast, kühle Schatten, warme Lichter bleiben warm. Optional die Lichtpunkte (lights.json aus umland_bl.py) in
# js/umland.js eintragen. python pack_umland.py <render.png> <img/umland3d.png> [lights.json js/umland.js]
import sys, json, re
from PIL import Image, ImageEnhance, ImageFilter
src, dst = sys.argv[1:3]
im = Image.open(src).convert('RGB')
im = im.resize((896, 512), Image.LANCZOS)
im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=45, threshold=2))
im = ImageEnhance.Contrast(im).enhance(1.12)
im = ImageEnhance.Color(im).enhance(1.12)
r, g, b = im.split()   # kühle Schatten: in dunklen Bereichen etwas Blau dazu
b = Image.eval(b, lambda v: min(255, int(v + 10 * (1 - v / 255) ** 2)))
im = Image.merge('RGB', (r, g, b))
im.save(dst, optimize=True)
print('gepackt', im.size)
if len(sys.argv) > 4:
    L = [[round(x), round(y), k] for x, y, k in json.load(open(sys.argv[3]))]
    js = sys.argv[4]; t = open(js, encoding='utf-8', newline='').read()
    t = re.sub(r'const LIGHTS = \[.*?\];', lambda m: 'const LIGHTS = ' + json.dumps(L, separators=(',', ':')) + ';', t, count=1, flags=re.S)
    open(js, 'w', encoding='utf-8', newline='').write(t); print('Lichter', len(L))
