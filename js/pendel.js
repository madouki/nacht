// Pendelhalle des Uhrturms (Schloss-Modus): riesige Uhrpendel mit Scheibengewicht schwingen über dem Abgrund – benachbarte
// gegenläufig, am Umkehrpunkt kommen sich zwei Gewichte nahe. Man steht oben auf der Wölbung der Scheibe, schwingt mit und
// springt im richtigen Moment zum nächsten Gewicht. Dahinter das Zifferblatt des Uhrturms von innen: Mondlicht scheint durch
// das Milchglas, die Ziffern stehen spiegelverkehrt, die Zeiger laufen rückwärts (man sieht sie ja von hinten).
'use strict';

class BigPendulum extends Ent { // d: { x, y (Drehpunkt, Kacheln), len (px), amp (rad), speed (rad je Bild), phase }
  constructor(d) {
    super(0, 0, 52, 52); this.kind = 'platform'; this.d = d; this.R = 26; this.slack = 2;
    this.px = d.x * T + 8; this.py = d.y * T; this.L = d.len; this.A = d.amp; this.w0 = d.speed || 0.02; this.ph = d.phase || 0;
    this.dx = 0; this.dy = 0; this.place(W.frame || 0);
  }
  place(f) {
    this.ang = this.A * Math.sin(f * this.w0 + this.ph);
    this.bx = this.px + Math.sin(this.ang) * this.L; this.by = this.py + Math.cos(this.ang) * this.L;
    this.x = this.bx - this.R; this.y = this.by - this.R;
  }
  update() {
    this.t++;
    const ox = this.bx, oy = this.by, was = this.ang;
    this.place(W.frame); this.dx = this.bx - ox; this.dy = this.by - oy;
    if (Math.sign(this.ang - was) !== Math.sign(was - (this.prev ?? was)) && Math.abs(this.ang) > this.A * 0.8 && Math.abs(this.bx - W.player.cx) < View.w) Audio8.sfx('tick', this.bx); // Umkehrpunkt: das Werk tickt
    this.prev = was;
  }
  surfaceAt(x) { const d = x - this.bx; return Math.abs(d) > this.R * 0.8 ? null : this.by - Math.sqrt(this.R * this.R - d * d); } // Wölbung der Scheibe
  carryAt() { return [this.dx, this.dy]; }
  draw(ctx) {
    const cx = W.cam.x, cy = W.cam.y, px = this.px - cx, py = this.py - cy, bx = this.bx - cx, by = this.by - cy, a = this.ang, R = this.R;
    const nx = Math.cos(a), ny = -Math.sin(a); // quer zur Stange
    ctx.save();
    for (const [o, col, lw] of [[0, '#3c2c10', 7], [0, '#a87c2c', 5], [-1.5, '#f8d070', 1]]) { // Stange: zwei Messingschienen mit Glanzkante
      for (const s of [-1, 1]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(px + nx * (s * 4 + o), py + ny * (s * 4 + o)); ctx.lineTo(bx + nx * (s * 4 + o), by + ny * (s * 4 + o)); ctx.stroke(); }
    }
    for (let k = 1; k < 8; k++) { const u = k / 8, x = px + (bx - px) * u, y = py + (by - py) * u; ctx.fillStyle = '#c89838'; ctx.fillRect(Math.round(x - 4), Math.round(y - 1), 8, 2); } // Querstreben
    ctx.save(); ctx.translate(px, py); ctx.rotate(this.ang * 3); // Zahnrad am Drehpunkt dreht mit dem Pendel
    ctx.fillStyle = '#5c4418'; for (let k = 0; k < 10; k++) { ctx.rotate(Math.PI / 5); ctx.fillRect(-2, -15, 4, 5); }
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c89838'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const g = ctx.createRadialGradient(bx - 8, by - 10, 3, bx, by, R); // Scheibengewicht: Messing, Sonnenrad graviert
    g.addColorStop(0, '#fce8a0'); g.addColorStop(0.45, '#d8a440'); g.addColorStop(0.85, '#8c5c18'); g.addColorStop(1, '#3c2808');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(60,36,8,0.8)'; ctx.lineWidth = 1;
    for (const r of [R - 4, 13]) { ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke(); }
    for (let k = 0; k < 12; k++) { const t = a + k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(bx + Math.cos(t) * 6, by + Math.sin(t) * 6); ctx.lineTo(bx + Math.cos(t) * 12, by + Math.sin(t) * 12); ctx.stroke(); }
    ctx.fillStyle = '#fcf0c0'; ctx.fillRect(Math.round(bx - 10), Math.round(by - R + 1), 20, 1); // Glanz oben (dort steht man)
    ctx.restore();
  }
  lightUp(L, cx, cy) { L.push({ x: this.bx - cx, y: this.by - cy, r: 34, c: [252, 210, 120], a: 0.35 }); }
}

class ClockFace extends Ent { // Zifferblatt von innen, hinter allem (drawBack): Milchglas mit Mondlicht, Spiegelziffern, rückwärts laufende Zeiger
  constructor(d) { super(d.x * T, d.y * T, 1, 1); this.kind = 'prop'; this.r = d.r || 150; this.noWrap = true; }
  update() { this.t++; }
  draw() { }
  drawBack(ctx) {
    const x = Math.round(View.w / 2 + (this.x - View.w / 2 - W.cam.x) * 0.6), y = Math.round(104 + (this.y - 104 - W.cam.y) * 0.8), r = this.r, t = W.frame; // Parallaxe: liegt weiter hinten
    if (x + r < -20 || x - r > View.w + 20) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r); // Milchglas, von hinten vom Mond beschienen
    g.addColorStop(0, 'rgba(220,226,255,0.55)'); g.addColorStop(0.7, 'rgba(150,160,210,0.35)'); g.addColorStop(1, 'rgba(60,64,100,0.25)');
    ctx.fillStyle = '#1c1828'; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2c2438'; ctx.lineWidth = 4; // Sprossen des Zifferblatts
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.22, y + Math.sin(a) * r * 0.22); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    for (const rr of [r * 0.22, r * 0.62, r * 0.98]) { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke(); }
    const NUM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let k = 0; k < 12; k++) { // Ziffern von hinten: gespiegelt, und im Uhrzeigersinn von hinten gesehen gegen den Uhrzeigersinn
      const a = -Math.PI / 2 - k * Math.PI / 6, nx = x + Math.cos(a) * r * 0.8, ny = y + Math.sin(a) * r * 0.8;
      ctx.save(); ctx.translate(Math.round(nx), Math.round(ny)); ctx.scale(-1, 1); Font.draw(ctx, NUM[k], 0, -4, '#2c2438', { align: 'center' }); ctx.restore();
    }
    const hand = (len, w, a) => { ctx.strokeStyle = '#141018'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke(); };
    hand(r * 0.5, 7, -Math.PI / 2 - t * 0.00045); hand(r * 0.78, 4, -Math.PI / 2 - Math.floor(t / 90) * 0.0105); // Stunden gleitend, Minuten springen im Takt
    ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; // Mondschein fällt durch das Glas in die Halle
    const sh = ctx.createLinearGradient(x, y, x + r * 0.6, y + r * 2.2); sh.addColorStop(0, 'rgba(170,180,255,0.12)'); sh.addColorStop(1, 'rgba(170,180,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.lineTo(x + r * 1.4, y + r * 2.4); ctx.lineTo(x - r * 0.2, y + r * 2.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
