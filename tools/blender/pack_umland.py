# Die Grafschaft Krat aus umland_bl.py (Render in doppelter Größe) auf 896×512 bringen (16 px je Kachel), nachts abgestimmt:
# etwas mehr Kontrast, kühle Schatten, warme Lichter bleiben warm. python pack_umland.py <render.png> <img/umland3d.png>
import sys
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
