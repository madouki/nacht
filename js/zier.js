// Menügrund für Status, Ausrüstung, Karte und alle Pausenseiten: Nachtblau mit feinem Mauerwerk, blassem Mond, Schloss-Silhouette am
// unteren Rand und gotischen Eckbeschlägen. Bleibt so dunkel, dass jede Schrift darüber so gut lesbar ist wie auf dem glatten Grund.
'use strict';
const Zier = (() => {
  const cache = {};
  const hash = (i) => { let h = Math.imul(i + 11, 2654435761) >>> 0; h ^= h >>> 13; return (Math.imul(h, 1274126177) >>> 8) / 16777216; };
  function build(w) {
    const c = Sprites.canvas(w, 240), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#04051a'); g.addColorStop(0.62, '#050416'); g.addColorStop(1, '#0b0619'); x.fillStyle = g; x.fillRect(0, 0, w, 240);
    const mx = w - 58, my = 62, m = x.createRadialGradient(mx, my, 6, mx, my, 58); m.addColorStop(0, 'rgba(130,120,190,0.13)'); m.addColorStop(0.4, 'rgba(100,90,170,0.05)'); m.addColorStop(1, 'rgba(60,50,120,0)'); x.fillStyle = m; x.fillRect(mx - 60, my - 60, 120, 120);
    x.fillStyle = 'rgba(150,150,210,0.028)';
    for (let y = 8, r = 0; y < 232; y += 12, r++) { x.fillRect(8, y, w - 16, 1); for (let bx = (r % 2 ? 20 : 8); bx < w - 8; bx += 24) x.fillRect(bx, y, 1, 12); }
    x.fillStyle = 'rgba(190,190,240,0.34)'; for (let i = 0; i < Math.round(w / 9); i++) x.fillRect(Math.round(10 + hash(i) * (w - 20)), Math.round(10 + hash(i * 7 + 3) * 120), 1, 1);
    const base = 232; x.fillStyle = '#0a0820'; let px = 8, i = 0; // Schloss am Horizont
    while (px < w - 8) { const tw = 10 + Math.floor(hash(i * 3) * 18), th = 8 + Math.floor(hash(i * 5 + 1) * 24); x.fillRect(px, base - th, tw, th); if (hash(i * 11) < 0.55) { x.beginPath(); x.moveTo(px - 1, base - th); x.lineTo(px + tw / 2, base - th - 10 - hash(i) * 8); x.lineTo(px + tw + 1, base - th); x.closePath(); x.fill(); } else for (let k = 0; k < tw; k += 4) x.fillRect(px + k, base - th - 2, 2, 2); px += tw + Math.floor(hash(i * 13) * 8); i++; }
    x.fillStyle = 'rgba(248,190,90,0.22)'; for (let k = 0; k < Math.round(w / 34); k++) x.fillRect(Math.round(14 + hash(k * 17) * (w - 28)), Math.round(base - 3 - hash(k * 23) * 16), 1, 2);
    const v = x.createRadialGradient(w / 2, 120, 90, w / 2, 120, Math.max(w * 0.62, 170)); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,6,0.55)'); x.fillStyle = v; x.fillRect(0, 0, w, 240);
    return c;
  }
  function corner(ctx, x, y, sx, sy, col) { // Beschlag: Winkel, Spitze und Knauf
    const R = (a, b, w, h) => ctx.fillRect(sx > 0 ? x + a : x - a - w + 1, sy > 0 ? y + b : y - b - h + 1, w, h);
    ctx.fillStyle = '#04040c'; R(-1, -1, 22, 5); R(-1, -1, 5, 22);
    ctx.fillStyle = col; R(0, 0, 20, 3); R(0, 0, 3, 20); R(3, 3, 7, 1); R(3, 3, 1, 7); R(5, 5, 3, 3);
    ctx.fillStyle = '#fce8b0'; R(0, 0, 20, 1); R(0, 0, 1, 20); R(6, 6, 1, 1);
    ctx.fillStyle = col; R(20, 1, 3, 1); R(1, 20, 1, 3);
  }
  // Grund und Rahmen in der Farbe der Seite
  function frame(ctx, col) {
    const w = View.w; if (!cache[w]) cache[w] = build(w);
    ctx.drawImage(cache[w], 0, 0);
    ctx.fillStyle = col; ctx.fillRect(6, 6, w - 12, 1); ctx.fillRect(6, 233, w - 12, 1); ctx.fillRect(6, 6, 1, 228); ctx.fillRect(w - 7, 6, 1, 228);
    ctx.globalAlpha = 0.28; ctx.fillRect(9, 9, w - 18, 1); ctx.fillRect(9, 230, w - 18, 1); ctx.fillRect(9, 9, 1, 222); ctx.fillRect(w - 10, 9, 1, 222); ctx.globalAlpha = 1;
    corner(ctx, 5, 5, 1, 1, col); corner(ctx, w - 6, 5, -1, 1, col); corner(ctx, 5, 234, 1, -1, col); corner(ctx, w - 6, 234, -1, -1, col);
  }
  // Statusseite: der Held in einer goldenen Nische (nur wenn links neben den Werten Platz ist)
  function hero(ctx, p, t) {
    const w = View.w, room = View.cx - Math.min(118, w / 2 - 14); if (room < 84) return;
    const d = p && p.rimDraw, s = d && d.s, img = s && (d.flip ? s.f : s.c); if (!img) return;
    const cx = Math.round(room / 2) + 3, base = 122, K = 2, iw = img.width * K, ih = img.height * K, y = base - ih + 8;
    ctx.fillStyle = '#100c26'; ctx.beginPath(); ctx.arc(cx, 72, 32, Math.PI, 0); ctx.lineTo(cx + 32, base + 4); ctx.lineTo(cx - 32, base + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c89020'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx + 0.5, 72.5, 32, Math.PI, 0); ctx.moveTo(cx + 32.5, 72); ctx.lineTo(cx + 32.5, base + 4); ctx.moveTo(cx - 31.5, 72); ctx.lineTo(cx - 31.5, base + 4); ctx.stroke();
    const g = ctx.createRadialGradient(cx, 84, 2, cx, 84, 36); g.addColorStop(0, `rgba(248,190,90,${(0.2 + 0.05 * Math.sin(t * 0.05)).toFixed(3)})`); g.addColorStop(1, 'rgba(248,190,90,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 32, 40, 64, 86);
    ctx.fillStyle = '#c89020'; ctx.fillRect(cx - 36, base + 4, 72, 2); ctx.fillStyle = '#fce8b0'; ctx.fillRect(cx - 36, base + 4, 72, 1);
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(cx - iw / 2), Math.round(y), iw, ih); ctx.imageSmoothingEnabled = sm;
  }
  return { frame, hero };
})();
