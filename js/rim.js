// Randlicht: Fackeln, Kerzen und Zauber zeichnen an Held, Gegnern und Bossen eine helle Kante auf die Seite, die dem Licht zugewandt ist.
// Dadurch stehen die Figuren im Raum, statt nur davor zu kleben. Je Sprite und Blickrichtung werden einmal drei Masken gerechnet
// (linke, rechte, obere Kante der Figur, die dunkle Kontur bleibt frei) und je Lichtfarbe eingefärbt; gezeichnet wird additiv nach
// der Raumbeleuchtung. Im Spar-Modus aus.
'use strict';

const Rim = (() => {
  const TINTS = [[255, 170, 90], [255, 84, 70], [120, 190, 255], [255, 222, 130], [190, 120, 255], [150, 240, 190], [232, 232, 255]];
  const tintOf = (c) => { let best = 0, bd = 1e9; TINTS.forEach((t, i) => { const d = (t[0] - c[0]) ** 2 + (t[1] - c[1]) ** 2 + (t[2] - c[2]) ** 2; if (d < bd) { bd = d; best = i; } }); return best; };
  const cache = new WeakMap();
  let budget = 0; // neue Masken je Bild begrenzen, damit ein Raumwechsel nicht ruckelt

  function build(img) { // drei Masken nebeneinander: links | rechts | oben
    const w = img.width, h = img.height, src = img.getContext('2d').getImageData(0, 0, w, h).data;
    const body = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { const a = src[i * 4 + 3], l = src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11; body[i] = a >= 128 && l > 30 ? 1 : 0; }
    const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? body[y * w + x] : 0);
    const c = document.createElement('canvas'); c.width = w * 3; c.height = h;
    const x = c.getContext('2d'), out = x.createImageData(w * 3, h), d = out.data;
    const put = (px, py, v) => { const i = (py * w * 3 + px) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = v; };
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      if (!at(px, py)) continue;
      if (!at(px - 1, py)) put(px, py, 255); else if (!at(px - 2, py)) put(px, py, 96);
      if (!at(px + 1, py)) put(px + w, py, 255); else if (!at(px + 2, py)) put(px + w, py, 96);
      if (!at(px, py - 1)) put(px + w * 2, py, 255); else if (!at(px, py - 2)) put(px + w * 2, py, 96);
    }
    x.putImageData(out, 0, 0);
    return { base: c, w, h, tint: [] };
  }
  function tinted(m, k) {
    if (m.tint[k]) return m.tint[k];
    const c = document.createElement('canvas'); c.width = m.base.width; c.height = m.base.height;
    const x = c.getContext('2d'), t = TINTS[k]; x.drawImage(m.base, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgb(${t[0]},${t[1]},${t[2]})`; x.fillRect(0, 0, c.width, c.height);
    return (m.tint[k] = c);
  }
  function maskOf(img) {
    let m = cache.get(img);
    if (!m) { if (budget <= 0) return null; budget--; m = build(img); cache.set(img, m); }
    return m;
  }

  function one(ctx, d, lights) {
    if (!d || d.f !== W.frame || !d.s || !d.s.c || d.s.w > 140 || d.s.h > 140) return;
    const sw = d.s.w, sh = d.s.h, sx = d.x - W.cam.x, sy = d.y - W.cam.y, cx = sx + sw / 2, cy = sy + sh / 2;
    if (sx + sw < -8 || sx > View.w + 8 || sy + sh < -8 || sy > 216) return;
    const v = [0, 0, 0], best = [0, 0, 0], col = [null, null, null];
    for (const l of lights) {
      const dx = l.x - cx, dy = l.y - cy, dist = Math.hypot(dx, dy), range = l.r * 1.5 + 26;
      if (dist >= range || dist < 6) continue; // (dist < 6: das eigene Leuchten der Figur)
      const k = (1 - dist / range) * Math.min(0.8, l.a === undefined ? 0.4 : l.a);
      [Math.max(0, -dx / dist), Math.max(0, dx / dist), Math.max(0, -dy / dist) * 0.8].forEach((f, i) => { const a = f * k; v[i] += a; if (a > best[i]) { best[i] = a; col[i] = l.c; } });
    }
    if (v[0] + v[1] + v[2] < 0.03) return;
    const img = d.flip ? d.s.f : d.s.c, m = img && maskOf(img); if (!m) return;
    const pad = d.s.pad || 0, X = Math.round(sx) - pad, Y = Math.round(sy) - pad;
    for (let i = 0; i < 3; i++) {
      if (v[i] < 0.02 || !col[i]) continue;
      ctx.globalAlpha = Math.min(0.9, v[i] * 2.4);
      ctx.drawImage(tinted(m, tintOf(col[i])), i * m.w, 0, m.w, m.h, X, Y, m.w, m.h);
    }
  }

  function draw(ctx, lights) {
    if (View.lite || !lights.length) return;
    budget = 4;
    const src = lights.filter(l => l.c && l.r > 10 && l.x > -120 && l.x < View.w + 120 && l.y > -120 && l.y < 330);
    if (!src.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = false;
    for (const e of W.ents) if ((e.kind === 'enemy' || e.kind === 'boss') && !e.dead && !(e.alpha !== undefined && e.alpha < 1)) one(ctx, e.lastDraw, src);
    if (W.player && W.player.alive) one(ctx, W.player.rimDraw, src);
    ctx.restore();
  }
  return { draw };
})();
