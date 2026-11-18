// Riegeltür (Abkürzungen im Schloss, Logik in castle.js): Eichentür aus Blender (tools/blender/riegel_bl.py → pack_riegel.py →
// img/riegel3d.png) in einem Steinbogen aus den Farben des Raums. Hinter der offenen Tür führt eine Wendeltreppe ins Licht.
// o: { k: 0–1 Öffnung, slide: 0–1 Riegel geschoben, bolt: Riegel sichtbar, far: von dieser Seite verschlossen (Schild), t: Bildzähler }
'use strict';
const Riegel = (() => {
  const MAP = {"bolt_0":[0,0,28,9],"door_0":[29,0,34,48],"door_1":[64,0,34,48],"door_2":[99,0,34,48],"door_3":[134,0,34,48],"door_4":[169,0,34,48]};
  const C = {}, img = new Image();
  img.onload = () => { for (const n in MAP) { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/riegel3d.png?v=' + (window.BUILD || '');
  // Rundbogen aus Pixelzeilen: Halbkreis oben (Radius r), darunter gerade Wangen bis zum Boden
  const arch = (ctx, cx, top, r, bot, col) => {
    ctx.fillStyle = col;
    for (let y = 0; y < r; y++) { const h = Math.round(Math.sqrt(r * r - (r - y - 0.5) * (r - y - 0.5))); ctx.fillRect(cx - h, top + y, h * 2, 1); }
    ctx.fillRect(cx - r, top + r, r * 2, bot - top - r);
  };
  function stairs(ctx, cx, bot, k, t) { // Wendeltreppe hinter der Tür: Stufen steigen nach hinten an, Fackelschein von oben
    arch(ctx, cx, bot - 46, 15, bot, '#0a0608');
    const glow = (0.5 + 0.1 * Math.sin(t * 0.07)) * k;
    for (let i = 0; i < 6; i++) { // von unten nach oben: jede Stufe schmaler, heller zum Licht hin
      const w = 13 - i * 1.5, y = bot - 5 - i * 5, v = i / 5;
      ctx.fillStyle = 'rgb(' + Math.round(34 + v * 96) + ',' + Math.round(24 + v * 58) + ',' + Math.round(22 + v * 26) + ')'; ctx.fillRect(Math.round(cx - w), y, Math.round(w * 2), 5);
      ctx.fillStyle = 'rgb(' + Math.round(70 + v * 150) + ',' + Math.round(48 + v * 100) + ',' + Math.round(34 + v * 40) + ')'; ctx.fillRect(Math.round(cx - w), y, Math.round(w * 2), 1);
    }
    ctx.globalAlpha = glow * 0.5; arch(ctx, cx, bot - 44, 9, bot - 28, '#fcb860');
    ctx.globalAlpha = glow * 0.5; arch(ctx, cx, bot - 41, 5, bot - 31, '#fce8b0'); ctx.globalAlpha = 1;
  }
  function draw(ctx, cx, bot, pc, o) {
    const t = o.t || 0, k = o.k || 0, top = bot - 50;
    arch(ctx, cx, top, 19, bot, pc.deep); arch(ctx, cx, top + 1, 18, bot, pc.light); arch(ctx, cx, top + 2, 17, bot, pc.mid); // Quaderring in den Steinfarben des Raums
    ctx.fillStyle = pc.joint;
    for (const a of [0.22, 0.62, 1.02, 1.42, 1.82, 2.22, 2.62, 3.0]) ctx.fillRect(Math.round(cx - Math.cos(a) * 17.5), Math.round(top + 19 - Math.sin(a) * 17.5), 1, 2);
    for (let y = top + 22; y < bot - 3; y += 7) { ctx.fillRect(cx - 19, y, 3, 1); ctx.fillRect(cx + 16, y, 3, 1); }
    ctx.fillStyle = pc.light; ctx.fillRect(cx - 3, top, 6, 4); ctx.fillStyle = pc.mid; ctx.fillRect(cx - 2, top + 1, 4, 3); // Schlussstein
    arch(ctx, cx, bot - 47, 16, bot, pc.joint);
    if (k > 0) stairs(ctx, cx, bot, k, t); else arch(ctx, cx, bot - 46, 15, bot, '#0a0608');
    const fr = C['door_' + clamp(Math.round(k * 4), 0, 4)];
    if (fr) ctx.drawImage(fr, cx - 17, bot - 48);
    else if (k < 0.5) { arch(ctx, cx, bot - 46, 15, bot, '#4c3020'); ctx.fillStyle = '#2c1c14'; ctx.fillRect(cx - 1, bot - 46, 2, 46); } // bis das Bild geladen ist
    if (o.far && k === 0) { // verschlossene Seite: Brett mit Warnzeichen, Spinnweben im Bogen
      ctx.fillStyle = '#1c120c'; ctx.fillRect(cx - 9, bot - 37, 18, 11); ctx.fillStyle = '#8c6c44'; ctx.fillRect(cx - 8, bot - 36, 16, 9); ctx.fillStyle = '#a88858'; ctx.fillRect(cx - 8, bot - 36, 16, 1);
      ctx.fillStyle = '#7c1c14'; for (let i = 0; i < 5; i++) { ctx.fillRect(cx - 3 + i, bot - 34 + i, 2, 1); ctx.fillRect(cx + 2 - i, bot - 34 + i, 2, 1); }
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(cx - 7, bot - 35, 1, 1); ctx.fillRect(cx + 6, bot - 35, 1, 1); ctx.fillRect(cx - 7, bot - 29, 1, 1); ctx.fillRect(cx + 6, bot - 29, 1, 1);
      ctx.globalAlpha = 0.34; ctx.fillStyle = '#d8d8e0'; for (let i = 0; i < 9; i++) { ctx.fillRect(cx - 13 + i, bot - 38 - i, 1, 1); ctx.fillRect(cx - 13, bot - 38 - i, i, 1 - (i % 3 ? 1 : 0)); } ctx.globalAlpha = 1;
    }
    if (o.bolt) { // Riegelbalken: rutscht nach rechts aus der linken Führung; ein Glanz läuft darüber und zieht den Blick an
      const s = clamp(o.slide || 0, 0, 1), bx = Math.round(cx - 14 + s * 11), by = bot - 29, b = C.bolt_0;
      if (b) ctx.drawImage(b, bx, by); else { ctx.fillStyle = '#5c5868'; ctx.fillRect(bx + 2, by + 3, 24, 3); }
      if (!s) { const ph = t % 150; if (ph < 26) { ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff4d0'; ctx.fillRect(bx + 2 + ph, by + 3, 2, 3); ctx.globalAlpha = 1; } if (ph > 26 && ph < 42) { const r = ph < 34 ? ph - 26 : 42 - ph, x0 = bx + 14, y0 = by + 1; ctx.fillStyle = '#fff4d0'; ctx.fillRect(x0 - (r >> 1), y0, r | 1, 1); ctx.fillRect(x0, y0 - (r >> 1), 1, r | 1); } }
    }
    ctx.fillStyle = pc.joint; ctx.fillRect(cx - 19, bot - 2, 38, 2); ctx.fillStyle = pc.mid; ctx.fillRect(cx - 19, bot - 2, 38, 1); // Schwelle
  }
  return { draw };
})();
