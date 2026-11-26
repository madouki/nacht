// Dorf Unkenbrunn (Oberwelt-Ort D in der Grafschaft Krat, Raum umland_dorf): die Dorfstraße bei Nacht mit Fachwerkhäusern,
// dem Gasthaus „Zur Fetten Unke“, dem Unkenbrunnen und Eulalias schiefem Wetterturm. Bewohner: Wirtin Hulda Quappe (heilt),
// Bürgermeister Ysidor Unkel (Auftrag: die Unkenkrone aus dem Moorpalast; Lohn 5000 Gold) und Wetterhexe Eulalia Zunder
// (danach: das Buch „Donnerwort“, Zauber donner in castle.js). Gespräche, Auftrag und Zauber stehen in castle.js (BEATS,
// QUESTS, SPELLS). Bild: tools/blender/dorf_bl.py → pack_dorf.py → img/dorf3d.png (Figuren 40×48, Füße bei 20/48).
'use strict';
const Dorf = (() => {
  const MAP = {"wirtin0":[0,0,40,48],"wirtin1":[41,0,40,48],"buerger0":[82,0,40,48],"buerger1":[123,0,40,48],"eulalia0":[164,0,40,48],"eulalia1":[205,0,40,48],"haus":[0,49,112,128],"wirtshaus":[113,49,160,136],"brunnen":[274,49,72,80],"turm":[347,49,72,160]};
  const C = {}, img = new Image(); let asked = false;
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  const load = () => { if (!asked) { asked = true; img.src = 'img/dorf3d.png?v=' + (window.BUILD || ''); } };
  load(); // gleich vorladen: der Dorfraum soll nicht erst ohne Häuser erscheinen
  function fig(ctx, n, x, feet, flip) {
    load(); const c = C[n]; if (!c) return false;
    ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); if (flip) ctx.scale(-1, 1); ctx.drawImage(c, -20, -48); ctx.restore(); return true;
  }
  // Dorfstraße: [Stück, Mitte x in Kacheln, gespiegelt] – unten auf dem Boden, hinter der Spielebene
  const ROW = [['haus', 6, false], ['wirtshaus', 18.5, false], ['brunnen', 31, false], ['haus', 43, true], ['turm', 55, false]];
  const WELL = { x: 31, k: 72 / 2 }; // Wasserstrahl des Brunnens: Austritt im Bild bei x 57 von 72, Becken bei y 60 von 80
  class Strasse extends Ent {
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.gy = (d.y + 1) * T; this.drops = []; }
    update() {
      this.t++;
      if (this.t % 3 === 0) this.drops.push({ x: WELL.x * T - WELL.k + 57 + rnd(-1.5, 1.5), y: this.gy - 80 + 60, vx: rnd(-0.5, 0.5), vy: rnd(-1.4, -0.6), t: 0 });
      for (const p of this.drops) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += 0.12; }
      this.drops = this.drops.filter(p => p.t < 18);
    }
    drawBack(ctx) {
      load(); const cam = W.cam;
      for (const [k, x, flip] of ROW) {
        const c = C[k]; if (!c) continue;
        const sx = Math.round(x * T - c.width / 2 - cam.x), sy = Math.round(this.gy - c.height - cam.y);
        if (sx > View.w + 4 || sx + c.width < -4) continue;
        if (flip) { ctx.save(); ctx.translate(sx + c.width, sy); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, sx, sy);
      }
      ctx.fillStyle = '#c8ecff'; // Spritzer am Brunnen
      for (const p of this.drops) { ctx.globalAlpha = 1 - p.t / 18; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 1, 1); }
      ctx.globalAlpha = 1;
    }
    lightUp(L, cx, cy) { // Fensterschein und Laternenlicht auf der Straße
      for (const [k, x] of ROW) if (k !== 'brunnen') L.push({ x: x * T - cx, y: this.gy - 40 - cy, r: 52, c: k === 'turm' ? [200, 150, 255] : [252, 200, 130], a: 0.22 });
    }
    draw() {}
  }
  class Blitz extends Ent { // Donnerwort: ein Blitz fährt von oben in den Gegner
    constructor(x, y) { super(x - 6, y - 6, 12, 12); this.kind = 'fx'; this.tx = x; this.ty = y; this.seed = Math.random() * 1000; }
    update() { if (++this.t > 16) this.dead = true; }
    lightUp(L, cx, cy) { L.push({ x: this.tx - cx, y: this.ty - cy, r: 70, c: [200, 230, 255], a: 0.6 * (1 - this.t / 16) }); }
    draw(ctx) {
      const cam = W.cam, x0 = this.tx - cam.x, y1 = this.ty - cam.y, top = -10; let s = this.seed + (this.t >> 1) * 7;
      const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      const pts = [[x0 + (r() - 0.5) * 30, top]]; for (let k = 1; k < 8; k++) pts.push([x0 + (r() - 0.5) * 18 * (1 - k / 8), top + (y1 - top) * k / 8]); pts.push([x0, y1]);
      ctx.globalAlpha = this.t < 10 ? 1 : 1 - (this.t - 10) / 6;
      for (const [w, col] of [[5, 'rgba(120,180,255,0.45)'], [2, '#c8ecff'], [1, '#ffffff']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  return { MAP, C, fig, load, ent: (d) => new Strasse(d), Blitz };
})();
function drawWirtin(ctx, cx, feet, t, flip) { // hebt ab und zu den Krug
  if (Dorf.fig(ctx, 'wirtin' + ((t % 200) < 40 ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-8, -20, 16, 20, '#3c8c4c'); R(-5, -19, 10, 17, '#fcf8ec'); R(-6, -28, 12, 8, '#b02c2c'); R(-4, -36, 8, 8, '#e8b088'); R(-5, -40, 10, 4, '#d8602c'); R(7, -24, 4, 6, '#9c6434');
}
function drawBuerger(ctx, cx, feet, t, flip) { // tupft sich die Stirn
  if (Dorf.fig(ctx, 'buerger' + ((t % 240) < 50 ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-7, -26, 14, 18, '#2c4c3c'); R(-5, -22, 10, 12, '#9c2c3c'); R(-3, -8, 2, 8, '#3c3c48'); R(1, -8, 2, 8, '#3c3c48'); R(-4, -34, 8, 8, '#e8b088'); R(-5, -38, 10, 4, '#ece4cc'); R(-1, -18, 2, 2, '#e8b030');
}
function drawEulalia(ctx, cx, feet, t, flip) { // an der Stabspitze knistert es
  if (Dorf.fig(ctx, 'eulalia' + ((t % 150) < 24 && ((t >> 2) & 1) ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-7, -26, 14, 26, '#3c3c94'); R(-4, -34, 8, 8, '#e8b088'); R(-6, -36, 12, 3, '#f4f4fc'); R(-5, -40, 10, 4, '#2a2458'); R(-2, -46, 4, 6, '#2a2458'); R(8, -44, 1, 44, '#6c4424'); R(7, -46, 3, 2, '#d8803c');
}
