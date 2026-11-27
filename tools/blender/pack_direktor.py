# Kolosseum-Direktor aus direktor_bl.py: vier Posen (gerendert 352×448 → 44×56) nach img/direktor3d.png, Karte in js/arena.js.
# Wie die anderen Blender-Figuren etwas abgedunkelt, sonst überstrahlt das Glühen im Kolosseum.
# python pack_direktor.py <render-dir> <arena.js> <direktor3d.png>
import sys, os, re, json
from PIL import Image, ImageEnhance
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
POSES = ['idle0', 'idle1', 'ruf', 'jubel']; MAP = {}
atlas = Image.new('RGBA', (len(POSES) * 45, 56))
for i, p in enumerate(POSES):
    im = grade(down(Image.open(os.path.join(src, 'direktor_' + p + '.png')), 44, 56))
    a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.8).convert('RGBA'); im.putalpha(a)
    atlas.paste(im, (i * 45, 0)); MAP[p] = [i * 45, 0, 44, 56]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const DIR_MAP = \{.*?\};', lambda m: 'const DIR_MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt', atlas.size)
