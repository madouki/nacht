# Paternoster-Kabine verkleinern und an ihren Platz in img/krat3d.png setzen (Karte K3 in js/castle.js, Schlüssel pcabin).
# python pack_pcabin.py <pcabin.png> <castle.js> <krat3d.png>
import sys, os, re
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
src, js, png = sys.argv[1], sys.argv[2], sys.argv[3]
v = [int(x) for x in re.search(r'"pcabin":\[([0-9,]+)\]', open(js, encoding='utf-8').read()).group(1).split(',')]
im = ns['grade'](ns['down'](Image.open(src), v[2], v[3]))
atlas = Image.open(png).convert('RGBA'); atlas.paste(im, (v[0], v[1])); atlas.save(png, optimize=True)
print('gesetzt: pcabin', v)
