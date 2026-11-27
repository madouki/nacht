# Der Mann im Mond (js/mond.js) als Höhenfeld gerendert, mit numpy statt Blender: Mondkugel mit echten Kratern (Mulde mit
# aufgeworfenem Rand), Mondmeeren, Gesteinskörnung und weichem Gesichtsrelief (Brauenwülste, Augenhöhlen, Nase, Wangen, Kinn),
# beleuchtet von links oben, mit kühlem Randlicht. Dazu Augen, Brauen und Münder als eigene Ebenen (gleiche Namen und Größen wie
# die frühere Blender-Fassung). Vierfach überabgetastet, ins Ausgabeverzeichnis als PNG; danach pack_mond.py.
# python mond_np.py <out-dir>
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
SSF = 4
rng = np.random.default_rng(1969)

def value_noise(n, cells, seed):   # glattes Wertrauschen auf n×n, aus einem groben Zufallsgitter bikubisch hochgezogen
    g = np.random.default_rng(seed).random((cells + 3, cells + 3)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((n + 3 * n // cells, n + 3 * n // cells), Image.BICUBIC)
    a = np.asarray(im, dtype=np.float32)[n // cells: n // cells + n, n // cells: n // cells + n] / 255
    return a
def fbm(n, seed):
    return sum(value_noise(n, c, seed + i) * w for i, (c, w) in enumerate(((4, 0.5), (9, 0.25), (19, 0.14), (41, 0.08), (83, 0.03))))
def shade(h, albedo, mask, light=(-0.52, -0.58, 0.63), amb=0.22, rimc=(0.55, 0.62, 0.85), rimk=0.35):
    gy, gx = np.gradient(h)
    nrm = np.dstack([-gx, -gy, np.ones_like(h)]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    L = np.array(light); L = L / np.linalg.norm(L)
    lam = np.clip((nrm * L).sum(axis=2), 0, 1)
    lam = lam ** 0.85                                                          # weicher Übergang zur Schattenseite
    rim = np.clip(1 - nrm[..., 2], 0, 1) ** 2.2 * rimk
    col = albedo * (amb + (1 - amb) * lam)[..., None] + rim[..., None] * np.array(rimc)[None, None, :] * mask[..., None]
    return np.clip(col, 0, 1)
def save(name, col, mask, size):
    rgba = np.dstack([col, mask]); im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
    im.save(os.path.join(out, name + '.png'))

# ---------------- Mondkugel ----------------
N = 132 * SSF; R = 64 * SSF; C = 66 * SSF
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
u = (xx + 0.5 - C) / R; v = (yy + 0.5 - C) / R; r2 = u * u + v * v
inside = r2 < 1
z = np.sqrt(np.clip(1 - r2, 0, 1))
bump = np.zeros_like(z); alb = np.zeros((N, N), np.float32)
def g2(cx, cy, sx, sy, amp, rot=0.0):   # Gaußhügel in Spielpixeln (Mitte der Kugel = 66/66)
    X = (xx / SSF - cx); Y = (yy / SSF - cy)
    if rot: X, Y = X * math.cos(rot) + Y * math.sin(rot), -X * math.sin(rot) + Y * math.cos(rot)
    return amp * np.exp(-(X * X) / (2 * sx * sx) - (Y * Y) / (2 * sy * sy))
# Gesichtsrelief (Höhen in Kugelradien)
face = (g2(66 - 21, 41.5, 10, 3.6, 0.11, -0.12) + g2(66 + 21, 41.5, 10, 3.6, 0.11, 0.12)            # Brauenwülste
        - g2(66 - 21, 52, 8.5, 6.2, 0.12) - g2(66 + 21, 52, 8.5, 6.2, 0.12)                          # Augenhöhlen
        + g2(68, 69, 4.6, 8.0, 0.17) + g2(68, 76.5, 6.0, 3.0, 0.06)                                  # Nase, Nasenflügel
        + g2(66 - 31, 80, 8.5, 7, 0.10) + g2(66 + 31, 80, 8.5, 7, 0.10)                              # Wangen
        + g2(66, 104, 10, 5, 0.07) - g2(66, 92, 16, 3.5, 0.03))                                      # Kinn, Mundfalte
bump += face
# Krater: Mulde mit Wall, nicht mitten im Gesicht
feat = [(45, 52, 14), (87, 52, 14), (68, 72, 11), (66, 92, 19), (45, 42, 10), (87, 42, 10)]
craters = []
tries = 0
while len(craters) < 34 and tries < 4000:
    tries += 1
    a = rng.random() * 2 * math.pi; d = math.sqrt(rng.random()) * 60; cx, cy = 66 + math.cos(a) * d, 66 + math.sin(a) * d
    cr = 1.6 + rng.random() ** 2 * 7.5
    if any(math.hypot(cx - fx, cy - fy) < fr + cr for fx, fy, fr in feat): continue
    if any(math.hypot(cx - x2, cy - y2) < (cr + r3) * 0.8 for x2, y2, r3 in craters): continue
    craters.append((cx, cy, cr))
for cx, cy, cr in craters:
    D = np.sqrt((xx / SSF - cx) ** 2 + (yy / SSF - cy) ** 2) / cr
    depth = 0.018 + 0.006 * cr
    bump += np.where(D < 1, -depth * (1 - D * D), 0) + depth * 0.55 * np.exp(-((D - 1.05) ** 2) / 0.02)
    alb += np.where(D < 0.95, -0.07, 0) + 0.06 * np.exp(-((D - 1.05) ** 2) / 0.03)
# Mondmeere und Körnung
maria = np.zeros_like(z)
for cx, cy, sx, sy in ((26, 30, 13, 10), (100, 28, 11, 8), (104, 92, 13, 11), (30, 100, 10, 8), (66, 14, 9, 5)):   # Mondmeere am Rand, nicht im Gesicht
    maria += np.exp(-(((xx / SSF - cx) / sx) ** 2 + ((yy / SSF - cy) / sy) ** 2) ** 1.6)
maria = np.clip(maria, 0, 1) * (0.6 + 0.4 * value_noise(N, 7, 11))
grain = fbm(N, 3)
H = (z + bump * z) * R / SSF * 1.0 + (grain - 0.5) * 0.35     # Höhe in Spielpixeln (fürs Gefälle), Körnung als feines Relief
base = 0.74 + 0.18 * (grain - 0.5) * 2 + alb - 0.22 * maria - 0.05 * np.clip(g2(68, 69, 5, 8, 1), 0, 1)   # Nase etwas dunkler, sonst glänzt sie im Kraterlicht
eyesock = (g2(66 - 21, 52, 7.5, 5.5, 1) + g2(66 + 21, 52, 7.5, 5.5, 1)); base -= 0.32 * np.clip(eyesock, 0, 1)
albedo = np.dstack([base * 1.0, base * 0.97, base * 0.88]).clip(0, 1)
mask = inside.astype(np.float32)
col = shade(H, albedo, mask)
col = col * mask[..., None]
img = np.dstack([col, mask])
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(os.path.join(out, 'mond_base.png'))

# ---------------- Augen (22×18) ----------------
def eye(kind):
    W_, H_ = 22 * SSF, 18 * SSF; yy2, xx2 = np.mgrid[0:H_, 0:W_].astype(np.float32)
    ex, ey, rx, ry = 11 * SSF, 9 * SSF, 9.4 * SSF, 7.4 * SSF
    e = ((xx2 + 0.5 - ex) / rx) ** 2 + ((yy2 + 0.5 - ey) / ry) ** 2; m = (e < 1).astype(np.float32)
    zz = np.sqrt(np.clip(1 - e, 0, 1)) * 6 * SSF
    sclera = np.array([1.0, 0.98, 0.92]) if kind != 'red' else np.array([0.32, 0.05, 0.07])
    alb = np.ones((H_, W_, 3)) * sclera
    col = shade(zz, alb, m, amb=0.45, rimk=0.15)
    lid = {'open': 0.0, 'red': 0.0, 'tired': 0.55, 'shut': 1.0}[kind]
    if lid > 0:   # Oberlid aus Mondgestein, darunter eine dunkle Wimpernlinie
        edge = ey - ry + lid * 2 * ry * (0.98 if kind == 'shut' else 1.0)
        lm = (yy2 < edge + (np.abs(xx2 - ex) / rx) ** 2 * (-1.5 * SSF)) & (m > 0)
        lidz = np.sqrt(np.clip(1 - e, 0, 1)) * 7 * SSF + 2
        lcol = shade(lidz, np.ones((H_, W_, 3)) * np.array([0.7, 0.68, 0.6]), m, amb=0.3)
        col = np.where(lm[..., None], lcol, col)
        line = (np.abs(yy2 - (edge + (np.abs(xx2 - ex) / rx) ** 2 * (-1.5 * SSF))) < 0.9 * SSF) & (m > 0)
        col = np.where(line[..., None], np.array([0.2, 0.19, 0.17]), col)
    else:
        top = (np.abs(e - 0.96) < 0.06) & (yy2 < ey); col = np.where(top[..., None], col * 0.55, col)
    save('eye_' + kind, col, m, None)
for k in ('open', 'tired', 'shut', 'red'): eye(k)

# ---------------- Brauen und Münder (mit PIL gezeichnet, geglättet) ----------------
def layer(w, h): return Image.new('RGBA', (w * SSF, h * SSF), (0, 0, 0, 0))
def finish(im, name):
    im = im.filter(ImageFilter.GaussianBlur(SSF * 0.25)); im.save(os.path.join(out, name + '.png'))
def brow(angry):
    im = layer(24, 12); d = ImageDraw.Draw(im); s = SSF
    pts = [(2, 8.2), (8, 4.6), (15, 4.0), (22, 5.2)] if not angry else [(2, 3.0), (9, 3.4), (16, 5.6), (22, 9.0)]
    d.line([(x * s, (y + 0.8) * s) for x, y in pts], fill=(40, 38, 34, 150), width=int(3.6 * s), joint='curve')   # Schatten
    d.line([(x * s, y * s) for x, y in pts], fill=(92, 88, 80, 255), width=int(3.2 * s), joint='curve')
    d.line([(x * s, (y - 0.9) * s) for x, y in pts], fill=(150, 146, 136, 255), width=int(1.0 * s), joint='curve')
    finish(im, 'browa' if angry else 'brow')
for a in (False, True): brow(a)
def mouth(kind):
    im = layer(44, 28); d = ImageDraw.Draw(im); s = SSF
    LIP, LIPH, DARK, TONG, TOOTH = (86, 80, 72, 255), (150, 142, 128, 255), (44, 20, 22, 255), (196, 78, 92, 255), (244, 240, 228, 255)
    if kind == 'smile':
        box = [5 * s, -6 * s, 39 * s, 23 * s]
        d.arc([box[0], box[1] + s, box[2], box[3] + s], 28, 152, fill=(40, 36, 32, 140), width=int(3.4 * s))
        d.arc(box, 28, 152, fill=LIP, width=int(3.0 * s)); d.arc([box[0] + s, box[1] - s, box[2] - s, box[3] - s], 40, 140, fill=LIPH, width=int(0.9 * s))
        for x in (6.5, 37.5): d.ellipse([(x - 1.8) * s, (13 - 1.8) * s, (x + 1.8) * s, (13 + 1.8) * s], fill=LIP)
    elif kind == 'open':
        d.ellipse([8 * s, 6 * s, 36 * s, 26 * s], fill=LIP); d.ellipse([10 * s, 8 * s, 34 * s, 24 * s], fill=DARK)
        d.ellipse([14 * s, 16 * s, 30 * s, 24 * s], fill=TONG); d.ellipse([18 * s, 17 * s, 23 * s, 19 * s], fill=(232, 130, 140, 255))
        for k in range(4): d.rounded_rectangle([(13.5 + k * 4.4) * s, 8 * s, (16.8 + k * 4.4) * s, 11.5 * s], radius=s, fill=TOOTH)
        d.arc([8 * s, 6 * s, 36 * s, 26 * s], 200, 340, fill=LIPH, width=int(0.9 * s))
    elif kind == 'blow':
        d.ellipse([20 * s, 9 * s, 34 * s, 25 * s], fill=LIP); d.ellipse([23 * s, 12.5 * s, 31 * s, 21.5 * s], fill=DARK)
        d.arc([20 * s, 9 * s, 34 * s, 25 * s], 200, 330, fill=LIPH, width=int(0.9 * s))
    else:   # grimmig: zusammengebissene Zähne, Mundwinkel nach unten
        d.rounded_rectangle([8 * s, 12 * s, 36 * s, 21 * s], radius=3 * s, fill=LIP)
        d.rounded_rectangle([9.5 * s, 13.4 * s, 34.5 * s, 19.6 * s], radius=2 * s, fill=TOOTH)
        for k in range(1, 6): d.line([((9.5 + k * 4.2) * s, 13.4 * s), ((9.5 + k * 4.2) * s, 19.6 * s)], fill=(150, 144, 132, 255), width=int(0.6 * s))
        d.line([(9.5 * s, 16.5 * s), (34.5 * s, 16.5 * s)], fill=(150, 144, 132, 255), width=int(0.6 * s))
        for sx in (-1, 1): d.line([((22 + sx * 13) * s, 19 * s), ((22 + sx * 17) * s, 24 * s)], fill=LIP, width=int(2.4 * s))
    finish(im, 'mund_' + kind)
for k in ('smile', 'open', 'blow', 'grim'): mouth(k)
print('ok', len(craters), 'Krater')
