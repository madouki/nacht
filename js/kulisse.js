// Kulissen (Blender: tools/blender/kulisse_bl.py → pack_kulisse.py → img/kulisse3d.png): große Stücke hinter der Spielebene für Räume,
// die bisher leer wirkten. Sie stehen nur im Bild, haben keine Kollision und sind abgedunkelt, damit Held und Gegner vorn klar bleiben.
// ROOMS: Raumschlüssel (Zusatzraum: sein Name, sonst 'Region:Raum') → Stücke [Art, Mitte x in Kacheln, Unterkante y in Kacheln ('f' = Boden), Optionen]
'use strict';
const Kulisse = (() => {
  const MAP = {"teleskop":[0,0,176,144],"bohrer":[177,0,112,116],"palme":[0,145,88,112],"stuetze":[89,145,72,104],"schleuse":[162,145,88,88],"rohr":[0,258,112,84],"lore":[113,258,72,44],"orgel":[0,343,168,152],"gladiator":[169,343,96,136],"globus":[266,343,72,104],"eis":[0,496,116,92],"fluegel":[117,496,124,84],"sarkophag":[242,496,104,64]};
  const img = new Image(), C = {};
  let ready = false;
  img.onload = () => { ready = true; for (const k in C) delete C[k]; };
  img.src = 'img/kulisse3d.png?v=' + (window.BUILD || '');
  // Abgedunkelte Fassung je Stück und Stärke, einmal gebaut
  function art(k, dim, flip) {
    const id = k + '/' + dim + '/' + (flip ? 1 : 0);
    if (C[id] || !ready || !MAP[k]) return C[id] || null;
    const [sx, sy, w, h] = MAP[k], c = Sprites.canvas(w, h), x = c.getContext('2d');
    if (flip) { x.translate(w, 0); x.scale(-1, 1); }
    x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(8,8,22,${dim})`; x.fillRect(0, 0, w, h);
    return (C[id] = c);
  }
  const ROOMS = {
    kanal: [['rohr', 9, 7], ['schleuse', 24.5, 11, { water: 1 }], ['rohr', 40, 6, { flip: 1 }], ['schleuse', 61.5, 11, { water: 1 }], ['rohr', 78, 5.5], ['rohr', 106, 6, { flip: 1 }]],
    golemstollen: [['rail', 0, 'f', { to: 72 }], ['stuetze', 7, 'f'], ['lore', 14, 'f'], ['stuetze', 21, 'f'], ['stuetze', 35, 'f'], ['lore', 45, 'f', { flip: 1 }], ['stuetze', 49, 'f'], ['stuetze', 63, 'f']],
    '1:0': [['stuetze', 16, 'f'], ['stuetze', 44, 'f'], ['lore', 52, 'f', { flip: 1 }], ['stuetze', 74, 'f']],
    sternkuppel: [['teleskop', 23, 'f', { dim: 0.42 }]],
    mondmeer: [['bohrer', 24, 'f', { dim: 0.2 }], ['bohrer', 78, 'f', { dim: 0.28, flip: 1 }]],
    krater: [['bohrer', 36, 'f', { dim: 0.34, flip: 1 }]],
    'expo:0': [['palme', 12, 'f'], ['palme', 48, 'f', { flip: 1 }]],
    'expo:1': [['palme', 8, 'f'], ['palme', 26, 'f', { flip: 1 }], ['palme', 44, 'f'], ['palme', 60, 'f', { flip: 1 }]],
    orangerie: [['palme', 5.5, 'f', { dim: 0.16 }], ['palme', 26.5, 'f', { dim: 0.16, flip: 1 }]],
    treibhaus: [['palme', 5.5, 'f', { dim: 0.16 }], ['palme', 26.5, 'f', { dim: 0.16, flip: 1 }]],
    kolosseum: [['gladiator', 32, 'f', { dim: 0.26 }], ['gladiator', 78, 'f', { dim: 0.26, flip: 1 }]],
    kerker: [['sarkophag', 27, 'f', { dim: 0.3 }]],
    gruftgang: [['sarkophag', 24, 'f', { dim: 0.3 }], ['sarkophag', 61, 'f', { dim: 0.3, flip: 1 }]],
    verlies: [['sarkophag', 53, 'f', { dim: 0.3 }]],
    registratur: [['globus', 31, 'f', { dim: 0.24 }]],
    attic: [['globus', 5, 'f', { dim: 0.28 }]],
    schatz: [['globus', 33, 'f', { dim: 0.24, flip: 1 }]],
    hotel: [['fluegel', 31, 'f', { dim: 0.2 }]],
    theaterfoyer: [['fluegel', 50, 'f', { dim: 0.2, flip: 1 }]],
    theater: [['orgel', 101, 'f', { dim: 0.3 }]],
    'sun:0': [['orgel', 90, 'f', { dim: 0.3 }]],
    eiskeller: [['eis', 20, 'f', { dim: 0.14 }], ['eis', 53, 'f', { dim: 0.14, flip: 1 }]],
  };
  const floorAt = (col) => { const R = W.room; let r = R.h - 1; while (r > 0 && !Phys.solidTile(col, r)) r--; while (r > 0 && Phys.solidTile(col, r - 1)) r--; return r; }; // Oberkante des untersten Bodens (schwebende Brocken zählen nicht)

  class Stueck extends Ent {
    constructor(k, x, y, o) {
      super(x * T, 0, 1, 1); this.kind = 'prop'; this.k = k; this.o = o || {}; this.dim = this.o.dim ?? 0.34; this.noWrap = true;
      this.fy = (y === 'f' ? floorAt(Math.floor(x)) : y) * T; const m = MAP[k] || [0, 0, 16, 16];
      this.iw = m[2]; this.ih = m[3]; this.x = x * T; this.y = this.fy - this.ih / 2;
    }
    update() { this.t++; }
    draw() { }
    lightUp(L, cx, cy) {
      const fl = 1 + Math.sin(this.t * 0.23 + this.x) * 0.08 + Math.sin(this.t * 0.51) * 0.05;
      if (this.k === 'stuetze') L.push({ x: this.x - cx, y: this.fy - 64 - cy, r: 44 * fl, c: [252, 176, 84], a: 0.42 });
      else if (this.k === 'schleuse' && this.o.water) L.push({ x: this.x - cx, y: this.fy - 24 - cy, r: 40, c: [90, 170, 220], a: 0.2 });
      else if (this.k === 'teleskop') L.push({ x: this.x + 52 - cx, y: this.fy - 106 - cy, r: 42, c: [120, 190, 255], a: 0.2 });
    }
    drawBack(ctx) {
      const cx = W.cam.x, cy = W.cam.y, t = this.t;
      if (this.k === 'rail') { // Schienen mit Schwellen am Boden des Stollens
        const x0 = Math.max(this.x, Math.floor(cx)), x1 = Math.min(this.o.to * T, cx + View.w), y = Math.round(this.fy - cy);
        for (let sx = Math.floor(x0 / 18) * 18; sx < x1; sx += 18) { ctx.fillStyle = '#34261a'; ctx.fillRect(Math.round(sx - cx), y - 3, 10, 3); }
        ctx.fillStyle = '#6c6878'; ctx.fillRect(Math.round(x0 - cx), y - 5, Math.round(x1 - x0), 1); ctx.fillStyle = '#2c2a34'; ctx.fillRect(Math.round(x0 - cx), y - 4, Math.round(x1 - x0), 1);
        return;
      }
      const sx = Math.round(this.x - this.iw / 2 - cx), sy = Math.round(this.fy - this.ih - cy);
      if (sx > View.w + 4 || sx + this.iw < -4) return;
      const a = art(this.k, this.dim, this.o.flip); if (a) ctx.drawImage(a, sx, sy);
      if (this.k === 'schleuse' && this.o.water) { // das Wasser schießt durchs Gitter hinab ins Becken
        const x0 = sx + 19, w = 50, y0 = sy + 56, h = this.ih - 56;
        ctx.fillStyle = 'rgba(70,150,200,0.28)'; ctx.fillRect(x0, y0, w, h);
        for (let i = 0; i < 13; i++) {
          const col = x0 + i * 4 + (i * 7 % 3), sp = 2.2 + (i * 5 % 4) * 0.5, len = 7 + (i * 11 % 7), y = y0 + ((t * sp + i * 37) % (h + len)) - len;
          ctx.fillStyle = i % 3 ? 'rgba(180,228,252,0.65)' : 'rgba(244,252,255,0.85)'; ctx.fillRect(col, Math.max(y0, Math.round(y)), 1, Math.max(1, Math.min(len, Math.round(y0 + h - Math.max(y0, y)))));
        }
        for (let i = 0; i < 7; i++) { const ph = (t * 0.09 + i * 0.9) % 1, px = x0 + 3 + (i * 7.3 % w), py = y0 + h - 3 - ph * 7; ctx.fillStyle = `rgba(232,246,255,${(0.75 * (1 - ph)).toFixed(2)})`; ctx.fillRect(Math.round(px), Math.round(py), 2, 1); } // Gischt
      } else if (this.k === 'rohr') { // Tropfen am Abfluss
        const dx = sx + (this.o.flip ? this.iw - 40 : 40), py = sy + 80 + ((t * 1.4 + this.x) % 70);
        if (((t + this.x) % 160) < 70) { ctx.fillStyle = 'rgba(170,220,250,0.8)'; ctx.fillRect(dx, Math.round(py), 1, 3); }
      } else if (this.k === 'teleskop' && (t >> 3) % 12 === 0) { // Glanz auf der Linse
        ctx.fillStyle = 'rgba(232,246,255,0.9)'; ctx.fillRect(sx + 142, sy + 30, 7, 1); ctx.fillRect(sx + 145, sy + 27, 1, 7);
      }
    }
  }
  function populate(w) {
    if (typeof Castle === 'undefined' || !Castle.on) return;
    const st = Levels.STAGES[w.stage], key = w.room.side || (st.id + ':' + w.roomIdx);
    for (const [k, x, y, o] of ROOMS[key] || []) w.spawn(new Stueck(k, x, y, o));
  }
  return { populate, ROOMS };
})();
