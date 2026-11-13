# Die Bilder aus rest_bl.py auf Spielgröße verkleinern und an ihre Plätze in img/creatures3d.png setzen.
# python pack_rest.py <render-dir> <creatures3d.js> <creatures3d.png> [name ...]
import sys, os, re, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
d, js, png = sys.argv[1], sys.argv[2], sys.argv[3]
MAP = json.loads(re.search(r'const MAP = (\{.*?\});', open(js, encoding='utf-8').read(), re.S).group(1))
names = sys.argv[4:] or sorted(f[:-4] for f in os.listdir(d) if f.endswith('.png') and f[:-4] in MAP)
atlas = Image.open(png).convert('RGBA')
for n in names:
    x, y, w, h = MAP[n]
    atlas.paste(grade(down(Image.open(os.path.join(d, n + '.png')), w, h)), (x, y))
atlas.save(png, optimize=True)
print('gesetzt:', len(names), ' '.join(names))
