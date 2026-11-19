// Große Boss-Auftritte: Das Schloss wird dunkel, ein Lichtkegel fällt auf den Boss, ein Band schießt auf, der Name schlägt mit Orchesterschlag ein,
// darunter steht der Beiname (epi_<Bossname> in i18n.js). Läuft über den Zähler Game.bossName (0 bis 150), die Welt bleibt dabei unangetastet.
'use strict';
const Auftritt = (() => {
  const HIT = 14, OUT = 132, END = 150, MID = 58, HALF = 22;
  const ACC = { crypt: '#7c4cd8', cave: '#2c8ca8', ice: '#6cc0f0', tower: '#c88828', library: '#a87038', hotel: '#c04870', station: '#c07030', werk: '#d86020', gallery: '#b09048', mirror: '#70a8d8', cathedral: '#f0c040', expo: '#48a860', throne: '#c82838', ship: '#3080b0', courtyard: '#6888a8', theater: '#c02848', ballroom: '#b03878', lab: '#50c090', vortex: '#8848d8', glass: '#60c0d0' };
  const nameId = (b) => (b && b.nameKey) || (W.stageDef && W.stageDef.bossKey);
  function hit() { // der Einschlag: einmal je Auftritt
    Audio8.sfx('stinger'); W.shake = Math.max(W.shake, 14); W.flash = Math.max(W.flash, 3); W.hitstop = Math.max(W.hitstop, 4); Input.rumble(0.8, 0.7, 280);
  }
  function draw(ctx) {
    const t = Game.bossName, b = W.boss; if (!b) return;
    const id = nameId(b), name = tr(id), epi = tr('epi_' + id), cx = View.cx, acc = ACC[W.room.theme] || '#c83828';
    if (t < 70 && !View.lite) { // Dunkelheit mit Lichtkegel auf dem Boss
      const k = clamp(Math.min(t / 10, (70 - t) / 22), 0, 1), x = b.cx - W.cam.x, y = b.cy - W.cam.y, r = Math.max(40, Math.max(b.w || 40, b.h || 40) * 0.9);
      const g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r + Math.max(View.w, 260)); g.addColorStop(0, 'rgba(2,0,8,0)'); g.addColorStop(0.28, 'rgba(2,0,8,' + (0.52 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(2,0,8,' + (0.78 * k).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, View.w, 240);
    }
    const open = t < HIT ? t / HIT : t > OUT ? clamp((END - t) / (END - OUT), 0, 1) : 1, h = Math.round(HALF * (1 - (1 - open) * (1 - open)));
    if (h <= 0) return;
    ctx.fillStyle = 'rgba(6,2,12,0.84)'; ctx.fillRect(0, MID - h, View.w, h * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, 0, View.w, 0); g.addColorStop(0, acc); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, acc); ctx.globalAlpha = 0.34; ctx.fillStyle = g; ctx.fillRect(0, MID - h, View.w, h * 2); ctx.restore();
    ctx.fillStyle = '#e8b040'; ctx.fillRect(0, MID - h, View.w, 1); ctx.fillRect(0, MID + h - 1, View.w, 1); ctx.fillStyle = acc; ctx.fillRect(0, MID - h + 1, View.w, 1); ctx.fillRect(0, MID + h - 2, View.w, 1);
    if (t < HIT - 1) return;
    if (t < HIT + 5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - (t - HIT + 1) / 6; ctx.fillStyle = '#fff0c8'; ctx.fillRect(0, MID - h, View.w, h * 2); ctx.restore(); } // weißer Schlag über das Band
    for (let i = 0; i < 16; i++) { const v = 2 + (i * 7) % 5, px = ((i * 61 + (t - HIT) * v * (i % 2 ? 1 : -1)) % View.w + View.w) % View.w, py = MID - h + 3 + (i * 13) % (Math.max(1, h * 2 - 6)); ctx.fillStyle = i % 3 ? '#e8a030' : '#fff0c0'; ctx.fillRect(px, py, 2 + i % 3, 1); } // Funkenflug im Band
    const fit = (s) => Font.width(name) * s <= View.w - 16, big = t < HIT + 6 && fit(3) ? 3 : fit(2) ? 2 : 1;
    Game.big(ctx, name, cx, big === 3 ? MID - 19 : big === 2 ? MID - 16 : MID - 11, big, ['#fff4d0', '#fce0a8', '#f8c040', '#f8b000', '#d08818', '#9c6400', '#6c4000'], null, '#000');
    if (t > HIT + 8 && epi !== 'epi_' + id) { const a = clamp((t - HIT - 8) / 14, 0, 1); ctx.globalAlpha = a; Font.draw(ctx, epi, cx, MID + 5, '#f0dcb0', { align: 'center', shadow: '#000' }); ctx.globalAlpha = 1; }
  }
  return { draw, hit, HIT, nameId };
})();
