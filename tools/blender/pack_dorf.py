# Dorf Unkenbrunn aus dorf_bl.py: drei Dorfbewohner (je zwei Bilder, 40×48, Füße bei 20/48) und vier Kulissen (haus 112×128,
# wirtshaus 160×136, brunnen 72×80, turm 72×160) auf Spielgröße bringen, nachts abdunkeln (Figuren wie pack_kuester.py, Kulissen
# etwas stärker, damit sie hinter der Spielebene bleiben), zu img/dorf3d.png packen und die Karte in js/dorf.js eintragen.
# python pack_dorf.py <render-dir> <dorf.js> <dorf3d.png>
import sys, os, re, json
from PIL import Image, ImageEnhance
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]
FIG = ['wirtin0', 'wirtin1', 'buerger0', 'buerger1', 'eulalia0', 'eulalia1']
BG = [('haus', 112, 128), ('wirtshaus', 160, 136), ('brunnen', 72, 80), ('turm', 72, 160)]
def dim(im, k):
    a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(k).convert('RGBA'); im.putalpha(a); return im
W = max(len(FIG) * 41, sum(w + 1 for _, w, _ in BG)); atlas = Image.new('RGBA', (W, 49 + 160)); MAP = {}
for i, n in enumerate(FIG):
    atlas.paste(dim(grade(down(Image.open(os.path.join(src, n + '.png')), 40, 48)), 0.78), (i * 41, 0)); MAP[n] = [i * 41, 0, 40, 48]
x = 0
for n, w, h in BG:
    atlas.paste(dim(grade(down(Image.open(os.path.join(src, n + '.png')), w, h)), 0.7), (x, 49)); MAP[n] = [x, 49, w, h]; x += w + 1
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
