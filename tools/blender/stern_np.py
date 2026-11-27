# Das Sternbild (Boss der Sternkuppel, js/stern.js) wie in einem alten Himmelsatlas: hinter den zehn Sternen die Figur als
# leuchtender Kupferstich – durchscheinend blau gefüllt, schräg schraffiert, goldener Umriss und goldene Zeichnung (Augen, Glieder,
# Gravur). Drei Figuren passend zu den Sternplätzen in STERN_FORMS: Großer Bär (Kopf mit Ohr und Schnauze an Stern 7, Leib um den
# Kasten, Beine zu Stern 8/9, langer Schwanz entlang der Deichsel), Skorpion (Scheren an Stern 0/1, gegliederter Leib, Perlenschwanz,
# Giftstachel an Stern 9), Großer Stempel (Knauf, Griff, Holzblock, Gummiplatte mit „GENEHMIGT“). Dazu zwei Sternbilder mit
# Strahlenkranz (blauweiß, rot vor einem Angriff). Bilder in doppelter Auflösung (2 px je Einheit), vierfach überabgetastet.
# python stern_np.py <stern.js> <out-dir>   (liest STERN_FORMS aus stern.js; danach pack_stern.py)
import sys, os, re, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
js, out = sys.argv[1:3]; os.makedirs(out, exist_ok=True)
src = open(js, encoding='utf-8').read()
block = src[src.index('const STERN_FORMS'):]; block = block[:block.index('];') + 2]
forms = []
for m in re.finditer(r"key: '(\w+)', s: ([\d.]+).*?n: (\[\[.*?\]\]),\s*e: (\[\[.*?\]\])", block, re.S):
    forms.append({'key': m.group(1), 's': float(m.group(2)), 'n': json.loads(m.group(3)), 'e': json.loads(m.group(4))})
assert len(forms) == 3, len(forms)
K = 2; SS = 4; KS = K * SS   # Bild: 2 px je Einheit, gezeichnet vierfach größer
GOLD = (244, 222, 150); BLUE_T = (70, 110, 220); BLUE_B = (36, 50, 140)

class Fig:
    def __init__(self, pts, pad=46):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        self.x0, self.y0 = min(xs) - pad, min(ys) - pad; self.w, self.h = max(xs) - self.x0 + pad, max(ys) - self.y0 + pad
        self.W, self.H = int(self.w * KS), int(self.h * KS)
        self.mask = Image.new('L', (self.W, self.H), 0); self.m = ImageDraw.Draw(self.mask)
        self.det = Image.new('L', (self.W, self.H), 0); self.d = ImageDraw.Draw(self.det)
    def P(self, x, y): return ((x - self.x0) * KS, (y - self.y0) * KS)
    def ell(self, x, y, rx, ry, layer='m', w=0):
        a, b = self.P(x - rx, y - ry), self.P(x + rx, y + ry)
        (self.m if layer == 'm' else self.d).ellipse([a, b], fill=None if w else 255, outline=255 if w else None, width=int(w * KS) if w else 0)
    def line(self, pts, w, layer='m'):
        dr = self.m if layer == 'm' else self.d; pp = [self.P(x, y) for x, y in pts]
        dr.line(pp, fill=255, width=int(w * KS), joint='curve')
        for x, y in (pts[0], pts[-1]): r = w / 2; a, b = self.P(x - r, y - r), self.P(x + r, y + r); dr.ellipse([a, b], fill=255)
    def taper(self, pts, w0, w1):
        n = len(pts) - 1
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n; seg = [pts[i], pts[i + 1]]
            steps = 8
            for k in range(steps):
                a = (seg[0][0] + (seg[1][0] - seg[0][0]) * k / steps, seg[0][1] + (seg[1][1] - seg[0][1]) * k / steps)
                w = w0 + (w1 - w0) * (t0 + (t1 - t0) * k / steps); r = w / 2
                p0, p1 = self.P(a[0] - r, a[1] - r), self.P(a[0] + r, a[1] + r); self.m.ellipse([p0, p1], fill=255)
    def rrect(self, x0, y0, x1, y1, r, layer='m', w=0):
        dr = self.m if layer == 'm' else self.d
        dr.rounded_rectangle([self.P(x0, y0), self.P(x1, y1)], radius=int(r * KS), fill=None if w else 255, outline=255 if w else None, width=int(w * KS) if w else 0)
    def render(self, name):
        M = np.asarray(self.mask.filter(ImageFilter.GaussianBlur(KS * 0.6)), dtype=np.float32) / 255
        Me = np.asarray(self.mask.filter(ImageFilter.GaussianBlur(KS * 1.3)), dtype=np.float32) / 255
        D = np.asarray(self.det, dtype=np.float32) / 255
        H, Wd = M.shape; yy, xx = np.mgrid[0:H, 0:Wd]
        inside = np.clip((M - 0.35) * 4, 0, 1)
        edge = np.clip(1 - np.abs(Me - 0.5) * 3.2, 0, 1)                         # Umriss: schmales Band um die Grenze
        hatch = ((xx + yy) % int(3.2 * KS) < KS * 0.7).astype(np.float32) * inside * np.clip(1 - M * 0.4, 0, 1)   # Schraffur
        t = (yy / H)[..., None]
        fill = np.array(BLUE_T) * (1 - t) + np.array(BLUE_B) * t
        # Wölbung: stark weichgezeichnete Maske als Höhenfeld, Licht von links oben → Kissenrelief (hell oben links, dunkel unten rechts)
        Bh = np.asarray(self.mask.filter(ImageFilter.GaussianBlur(KS * 7)), dtype=np.float32) / 255
        gy_, gx_ = np.gradient(Bh); sh = np.clip(-(gx_ * -0.6 + gy_ * -0.8) * KS * 20, -1, 1)
        fill = fill * (1 + sh[..., None] * 0.55) + np.array((150, 190, 255)) * np.clip(sh, 0, 1)[..., None] * 0.35
        rim = np.clip(-sh, 0, 1) * edge                                          # Gegenlicht am Schattenrand (türkis)
        rng = np.random.default_rng(7); st = np.zeros_like(M)                  # Sternstaub in der Figur
        for _ in range(int(H * Wd / (KS * KS) / 260)):
            x, y = rng.integers(0, Wd), rng.integers(0, H); r = int(KS * rng.uniform(0.3, 0.8)); st[max(0, y - r):y + r, max(0, x - r):x + r] = rng.uniform(0.4, 1)
        st = st * inside
        rgb = fill * inside[..., None]; a = inside * (0.36 + np.clip(sh, 0, 1) * 0.12)
        rgb = rgb + np.array((210, 225, 255)) * st[..., None] * 0.8; a = np.maximum(a, st * 0.7)
        rgb = rgb * (1 - rim[..., None]) + np.array((120, 230, 255)) * rim[..., None]; a = np.maximum(a, rim * 0.9)
        rgb = rgb * (1 - hatch[..., None] * 0.5) + np.array((190, 210, 255)) * hatch[..., None] * 0.5; a = np.maximum(a, hatch * 0.42)
        for layer, strength in ((edge, 0.95), (D * inside, 0.9), (D * (1 - inside) * 0.0, 0)):
            rgb = rgb * (1 - layer[..., None] * strength) + np.array(GOLD) * layer[..., None] * strength; a = np.maximum(a, layer * strength)
        glow = np.asarray(Image.fromarray((np.clip(edge + D, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(KS * 2.2)), dtype=np.float32) / 255
        rgb = rgb + np.array((150, 170, 255)) * (glow * (1 - a))[..., None] * 0.6; a = np.maximum(a, glow * 0.45)
        img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(a, 0, 1) * 255]).astype(np.uint8), 'RGBA')
        img = img.resize((self.W // SS, self.H // SS), Image.LANCZOS)
        img.save(os.path.join(out, name + '.png'))
        return {'w': img.width, 'h': img.height, 'ox': round(-self.x0 * K, 2), 'oy': round(-self.y0 * K, 2)}

meta = {}
def scaled(F): return [(x * F['s'], y * F['s']) for x, y in F['n']]
# ---- Großer Bär ----
P = scaled(forms[0]); f = Fig(P)
body = P[3:7]; cx = sum(p[0] for p in body) / 4; cy = sum(p[1] for p in body) / 4
f.ell(cx + 4, cy + 2, (max(p[0] for p in body) - min(p[0] for p in body)) / 2 + 18, (max(p[1] for p in body) - min(p[1] for p in body)) / 2 + 15)
hx, hy = P[7]
f.line([P[6], (hx - 6, hy + 6)], 26)                                   # Nacken
f.ell(hx + 4, hy + 2, 17, 15); f.ell(hx + 22, hy + 9, 11, 8)           # Kopf, Schnauze
f.ell(hx - 6, hy - 14, 7, 7); f.ell(hx + 6, hy - 15, 6, 6)              # Ohren
f.ell(cx - 4, cy - 10, 30, 16)                                          # Buckel
for a, b in ((4, 8), (5, 9)):
    f.line([P[a], P[b]], 16); f.ell(P[b][0] + 4, P[b][1] + 4, 11, 6)    # Beine, Pranken
f.line([((P[3][0] + P[4][0]) / 2 - 6, P[4][1] + 6), (P[8][0] - 22, P[8][1] - 2)], 12)   # Hinterbein
f.taper([P[3], P[2], P[1], P[0], (P[0][0] - 14, P[0][1] + 6)], 22, 5)   # langer Schwanz (Deichsel)
f.ell(hx + 9, hy - 2, 2.4, 2.4, 'd'); f.ell(hx + 31, hy + 6, 3, 2.4, 'd')                     # Auge, Nase
f.line([(hx + 24, hy + 14), (hx + 30, hy + 13)], 1.4, 'd')
for k in range(5): x = cx - 30 + k * 15; f.line([(x, cy - 4), (x - 4, cy + 10)], 1.0, 'd')       # Fellstriche
for b in (8, 9):
    for k in (-5, 0, 5): f.line([(P[b][0] + 10 + k * 0.6, P[b][1] + 3 + k * 0.6), (P[b][0] + 15 + k * 0.5, P[b][1] + 6 + k * 0.4)], 1.2, 'd')   # Krallen
meta['fig_bear'] = f.render('fig_bear')
# ---- Skorpion ----
P = scaled(forms[1]); f = Fig(P)
f.taper([P[2], P[3], P[4], P[5]], 26, 18)                                 # Leib
for i in (3, 4): f.ell(P[i][0], P[i][1], 14, 12)
f.ell(P[2][0] - 2, P[2][1], 13, 11)                                       # Kopf
for i, r in ((5, 11), (6, 10), (7, 9), (8, 8.5)): f.ell(P[i][0], P[i][1], r, r)   # Perlenschwanz
for i in range(5, 8):
    a, b = P[i], P[i + 1]; f.line([a, b], 9)
sx, sy = P[9]; dx, dy = sx - P[8][0], sy - P[8][1]; L = math.hypot(dx, dy) or 1; ux, uy = dx / L, dy / L
f.line([P[8], (sx, sy)], 8); f.taper([(sx, sy), (sx + ux * 10 - uy * 3, sy + uy * 10 + ux * 3), (sx + ux * 14 - uy * 10, sy + uy * 14 + ux * 10)], 9, 2)   # Giftstachel
for c in (0, 1):   # Arme und Scheren
    cx_, cy_ = P[c]; f.line([P[2], (cx_ + 8, cy_ + (3 if c else -3))], 7)
    f.ell(cx_ + 4, cy_, 10, 7)
    f.taper([(cx_ + 2, cy_ - 4), (cx_ - 8, cy_ - 9), (cx_ - 15, cy_ - 5)], 6, 2); f.taper([(cx_ + 2, cy_ + 4), (cx_ - 8, cy_ + 9), (cx_ - 15, cy_ + 5)], 6, 2)
for k, i in enumerate((3, 3, 4, 4)):   # Beine
    bx = P[i][0] + (k % 2) * 10 - 5
    for sgn in (-1, 1): f.line([(bx, P[i][1]), (bx - 6, P[i][1] + sgn * 16), (bx - 10, P[i][1] + sgn * 24)], 3)
for i in (2, 3, 4): f.ell(P[i][0], P[i][1], 12, 10, 'd', 1.1)               # Panzerringe
f.ell(P[2][0] - 8, P[2][1] - 3, 2.2, 2.2, 'd'); f.ell(P[2][0] - 8, P[2][1] + 3, 2.2, 2.2, 'd')
meta['fig_scorp'] = f.render('fig_scorp')
# ---- Großer Stempel ----
P = scaled(forms[2]); f = Fig(P)
f.ell(P[0][0], P[0][1], 13, 10)                                           # Knauf
f.line([P[0], ((P[1][0] + P[2][0]) / 2, P[1][1])], 10)                    # Hals
f.m.polygon([f.P(P[1][0] - 3, P[1][1] - 4), f.P(P[2][0] + 3, P[2][1] - 4), f.P(P[4][0] + 8, P[4][1] + 6), f.P(P[3][0] - 8, P[3][1] + 6)], fill=255)   # Griff
f.rrect(P[5][0] - 8, P[5][1] - 6, P[6][0] + 8, P[7][1] - 4, 5)              # Holzblock
f.rrect(P[7][0] - 4, P[7][1] - 6, P[8][0] + 4, P[7][1] + 6, 2)              # Gummiplatte
f.rrect(P[5][0] - 4, P[5][1] - 2, P[6][0] + 4, P[7][1] - 8, 3, 'd', 1.0)    # Gravurrahmen
f.line([(P[7][0] - 2, P[7][1] - 5), (P[8][0] + 2, P[7][1] - 5)], 1.4, 'd')
f.ell(P[0][0] - 4, P[0][1] - 3, 4, 2.5, 'd', 0.9)
try: font = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', int(10 * KS))
except Exception: font = ImageFont.load_default()
cx, cy = (P[5][0] + P[6][0]) / 2, (P[5][1] + P[7][1]) / 2 - 2
f.d.text(f.P(cx, cy), 'GENEHMIGT', fill=255, font=font, anchor='mm')
meta['fig_stamp'] = f.render('fig_stamp')

# ---- Sterne mit Strahlenkranz ----
def star(name, core, halo):
    N = 64 * SS; yy, xx = np.mgrid[0:N, 0:N].astype(np.float32); c = N / 2
    dx, dy = (xx - c) / SS, (yy - c) / SS; r = np.hypot(dx, dy) + 1e-3
    I = np.exp(-r / 2.2) * 1.0 + np.exp(-r / 7) * 0.35
    for ang, L, wd in ((0, 22, 0.9), (math.pi / 2, 22, 0.9), (math.pi / 4, 11, 0.7), (3 * math.pi / 4, 11, 0.7)):
        along = np.abs(dx * math.cos(ang) + dy * math.sin(ang)); perp = np.abs(-dx * math.sin(ang) + dy * math.cos(ang))
        I += np.exp(-perp / wd) * np.exp(-along / L * 2.6) * 0.8
    I = np.clip(I, 0, 1.6)
    col = np.array(halo)[None, None, :] * np.clip(I, 0, 1)[..., None] + np.array(core)[None, None, :] * np.clip(I - 0.6, 0, 1)[..., None]
    a = np.clip(I, 0, 1)
    img = Image.fromarray(np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8), 'RGBA').resize((64, 64), Image.LANCZOS)
    img.save(os.path.join(out, name + '.png'))
star('star_w', (255, 255, 255), (150, 185, 255)); star('star_r', (255, 240, 220), (255, 130, 90))
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'))
print('ok', meta)
