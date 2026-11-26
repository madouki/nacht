# Dorf Unkenbrunn aus dorf_bl.py auf Spielgröße bringen, nachts abdunkeln (Figuren wie pack_kuester.py, Kulissen stärker, die ferne
# Dachsilhouette am stärksten), in Regalreihen zu img/dorf3d.png packen und die Karte in js/dorf.js eintragen.
# Figuren je 40×48 (Füße bei 20/48); Kulissen: haus 112×128, haus2 96×144, wirtshaus 160×136, brunnen 72×80, turm 72×160;
# Dinge fürs Abenteuer: brett 40×56, laterne 16×64, katze0–2 40×40, angel 20×48, unke_wach 40×36, zaun 64×24; skyline 768×112.
# Die Häuser kommen seit der zweiten Fassung aus dorfhaus_bl.py (Schrägansicht, eigener Ordner): zugeschnitten nach <name>_meta.json,
# waagerecht symmetrisch um die Bildmitte (dort steht das Haus im Spiel), unten bis zum Boden.
# python pack_dorf.py <render-dir> <dorf.js> <dorf3d.png> [<haus-render-dir>]
import sys, os, re, json
from PIL import Image, ImageEnhance
here = os.path.dirname(os.path.abspath(__file__))
ns = {}; exec(open(os.path.join(here, 'pack.py'), encoding='utf-8').read().split("if sys.argv[1] == 'preview'")[0], ns)
down, grade = ns['down'], ns['grade']
src, js, png = sys.argv[1:4]; hsrc = sys.argv[4] if len(sys.argv) > 4 else None
JOBS = [(n, 40, 48, 0.78) for n in ('wirtin0', 'wirtin1', 'buerger0', 'buerger1', 'eulalia0', 'eulalia1')]
HOUSES = ['haus', 'haus2', 'haus3', 'wirtshaus', 'turm'] if hsrc else []
CROP = {}
for n in HOUSES:   # Zuschnitt aus dem Umriss: symmetrisch um die Mitte, oben 2 px Luft, unten der Boden
    mt = json.load(open(os.path.join(hsrc, n + '_meta.json'))); (x0, y0, x1, y1), (FW, FH) = mt['bbox'], mt['size']
    half = int(max(FW / 2 - x0, x1 - FW / 2) + 2.5); top = max(0, int(y0) - 2); CROP[n] = (FW / 2 - half, top, FW / 2 + half, FH, FW, FH)
    JOBS.append((n, 2 * half, FH - top, {'haus2': 0.7, 'haus': 0.78}.get(n, 0.82)))   # das blaue Haus wirkt sonst zu hell
JOBS += [(n, w, h, k) for (n, w, h, k) in (('haus', 112, 128, 0.7), ('haus2', 96, 144, 0.66), ('wirtshaus', 160, 136, 0.7), ('turm', 72, 160, 0.7)) if n not in CROP]
JOBS += [('brunnen', 72, 80, 0.7)]
JOBS += [('brett', 40, 56, 0.74), ('laterne', 16, 64, 0.8), ('katze0', 40, 40, 0.78), ('katze1', 40, 40, 0.78), ('katze2', 40, 40, 0.78),
         ('angel', 20, 48, 0.8), ('unke_wach', 40, 36, 0.9), ('zaun', 64, 24, 0.66), ('skyline', 768, 112, 0.55)]
def dim(im, k):
    a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(k).convert('RGBA'); im.putalpha(a); return im
WMAX = 770; x = y = rowh = 0; place = []
for n, w, h, k in sorted(JOBS, key=lambda j: -j[2]):   # Regalreihen, die höchsten zuerst
    if x + w > WMAX: x, y, rowh = 0, y + rowh + 1, 0
    place.append((n, w, h, k, x, y)); x += w + 1; rowh = max(rowh, h)
atlas = Image.new('RGBA', (WMAX, y + rowh)); MAP = {}
for n, w, h, k, px, py in place:
    if n in CROP:
        a, b, c, d, FW, FH = CROP[n]; im = Image.open(os.path.join(hsrc, n + '.png')); sx, sy = im.width / FW, im.height / FH
        im = im.crop((round(a * sx), round(b * sy), round(c * sx), round(d * sy)))
    else: im = Image.open(os.path.join(src, n + '.png'))
    atlas.paste(dim(grade(down(im, w, h)), k), (px, py)); MAP[n] = [px, py, w, h]
atlas.save(png, optimize=True)
s = open(js, encoding='utf-8', newline='').read()
s = re.sub(r'const MAP = \{.*?\};', lambda m: 'const MAP = ' + json.dumps(MAP, separators=(',', ':')) + ';', s, count=1, flags=re.S)
open(js, 'w', encoding='utf-8', newline='').write(s)
print('gepackt:', atlas.size)
