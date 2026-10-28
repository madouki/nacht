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
    const cx = W.cam.x, cy = W.cam.y, px = this.px - cx, py = this.py - cy, bx = this.bx - cx, by = this.by - cy, a = this.ang, R = this.R, t = this.t;
    if (Math.max(px, bx) < -60 || Math.min(px, bx) > View.w + 60) return;
    const nx = Math.cos(a), ny = -Math.sin(a), L = Math.hypot(bx - px, by - py) - R + 2, ux = (bx - px) / (L + R - 2), uy = (by - py) / (L + R - 2); // quer und längs zur Stange
    const P = (o, d) => [px + nx * o + ux * d, py + ny * o + uy * d];
    ctx.save(); ctx.lineCap = 'butt';
    // Rostpendel: fünf Stäbe, Messing und Stahl im Wechsel, mit Querjochen; dunkle Kontur zuerst
    const rods = [[-6, '#a87c2c', '#f8d070'], [-3, '#8c949c', '#e0e8f0'], [0, '#a87c2c', '#f8d070'], [3, '#8c949c', '#e0e8f0'], [6, '#a87c2c', '#f8d070']];
    ctx.strokeStyle = '#1c140c'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(...P(0, 0)); ctx.lineTo(...P(0, L)); ctx.stroke();
    for (const [o, col, hi] of rods) {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(o, 0)); ctx.lineTo(...P(o, L)); ctx.stroke();
      ctx.strokeStyle = hi; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(...P(o - 0.6, 0)); ctx.lineTo(...P(o - 0.6, L)); ctx.stroke();
    }
    for (const d of [0.12, 0.3, 0.7, 0.88]) { // Querjoche mit Nieten
      const [x0, y0] = P(-8, L * d), [x1, y1] = P(8, L * d);
      ctx.strokeStyle = '#5c4418'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    { // Lyra in der Mitte: zwei geschwungene Arme, oben eine Rosette
      const d0 = L * 0.4, d1 = L * 0.62;
      ctx.strokeStyle = '#3c2c10'; ctx.lineWidth = 4;
      for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...P(0, d1)); ctx.quadraticCurveTo(...P(s2 * 22, (d0 + d1) / 2), ...P(s2 * 9, d0)); ctx.stroke(); }
      ctx.strokeStyle = '#e8b848'; ctx.lineWidth = 2;
      for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...P(0, d1)); ctx.quadraticCurveTo(...P(s2 * 22, (d0 + d1) / 2), ...P(s2 * 9, d0)); ctx.stroke(); }
      const [rx, ry] = P(0, d0 - 3); ctx.fillStyle = '#c89838'; ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fce8a0'; ctx.beginPath(); ctx.arc(rx - 1, ry - 1, 2, 0, Math.PI * 2); ctx.fill();
    }
    // Zahnrad am Drehpunkt dreht mit dem Pendel
    ctx.save(); ctx.translate(px, py); ctx.rotate(a * 3);
    ctx.fillStyle = '#3c2c10'; for (let k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.fillRect(-2.5, -17, 5, 6); }
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a87c2c'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3c2c10'; for (let k = 0; k < 5; k++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.arc(0, -6.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fce8a0'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Scheibengewicht: polierte Messinglinse, Perlrand, graviertes Sonnengesicht (blinzelt ab und zu), Glanz wandert mit dem Schwung
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // warmer Schein ums Gewicht
    const hg = ctx.createRadialGradient(bx, by, R * 0.6, bx, by, R * 1.8); hg.addColorStop(0, 'rgba(252,200,110,0.18)'); hg.addColorStop(1, 'rgba(252,200,110,0)'); ctx.fillStyle = hg; ctx.fillRect(bx - R * 2, by - R * 2, R * 4, R * 4);
    ctx.restore();
    ctx.fillStyle = '#2c1c08'; ctx.beginPath(); ctx.arc(bx, by, R + 2, 0, Math.PI * 2); ctx.fill();
    const gx = bx - 9 - a * 18, g = ctx.createRadialGradient(gx, by - 10, 2, bx, by, R);
    g.addColorStop(0, '#fff4c8'); g.addColorStop(0.25, '#f0c860'); g.addColorStop(0.7, '#b07c24'); g.addColorStop(1, '#5c3c10');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 24; k++) { const q = k / 24 * Math.PI * 2 + a; ctx.fillStyle = k % 2 ? '#fce8a0' : '#8c5c18'; ctx.beginPath(); ctx.arc(bx + Math.cos(q) * (R - 3), by + Math.sin(q) * (R - 3), 1.4, 0, Math.PI * 2); ctx.fill(); } // Perlrand
    ctx.strokeStyle = 'rgba(70,40,8,0.85)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, R - 6, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 16; k++) { const q = a + k * Math.PI / 8; ctx.beginPath(); ctx.moveTo(bx + Math.cos(q) * 11, by + Math.sin(q) * 11); ctx.lineTo(bx + Math.cos(q) * (k % 2 ? 15 : 18), by + Math.sin(q) * (k % 2 ? 15 : 18)); ctx.stroke(); } // Sonnenstrahlen
    ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.stroke();
    const blink = (t + (this.d.x * 37)) % 220 < 7; // Sonnengesicht: Augen, Lächeln
    ctx.fillStyle = 'rgba(70,40,8,0.9)';
    if (blink) { ctx.fillRect(Math.round(bx - 5), Math.round(by - 3), 3, 1); ctx.fillRect(Math.round(bx + 2), Math.round(by - 3), 3, 1); }
    else { ctx.fillRect(Math.round(bx - 4), Math.round(by - 4), 2, 2); ctx.fillRect(Math.round(bx + 2), Math.round(by - 4), 2, 2); }
    ctx.beginPath(); ctx.arc(bx, by + 1, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(gx, by - 13, 5, 2, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; // Glanzlicht
    ctx.fillStyle = '#fcf0c0'; ctx.fillRect(Math.round(bx - 10), Math.round(by - R + 1), 20, 1); // Glanz oben (dort steht man)
    ctx.restore();
  }
  lightUp(L, cx, cy) { L.push({ x: this.bx - cx, y: this.by - cy, r: 34, c: [252, 210, 120], a: 0.35 }); }
}

class ClockFace extends Ent { // Zifferblatt von innen, hinter allem (drawBack): Milchglas mit Mondlicht, Spiegelziffern, rückwärts laufende Zeiger
  constructor(d) { super(d.x * T, d.y * T, 1, 1); this.kind = 'prop'; this.r = d.r || 150; this.noWrap = true; }
  update() { this.t++; }
  draw() { }
  gears(ctx, t) { // Riesenzahnräder des Uhrwerks weit hinten (Parallaxe 0.35), dunkle Bronze mit Lichtkante
    const G = [[-220, 40, 70, 20, 1], [-120, 150, 46, 14, -1.53], [150, 30, 90, 26, -0.78], [270, 160, 54, 16, 1.44], [40, 200, 40, 12, -1.75], [380, 60, 60, 18, 1.0]];
    for (const [ox, oy, r, n, sp] of G) {
      const x = Math.round(View.w / 2 + (this.x + ox - View.w / 2 - W.cam.x) * 0.35), y = Math.round(80 + oy - (W.cam.y - 112) * 0.35);
      if (x + r + 10 < 0 || x - r - 10 > View.w) continue;
      const rot = t * 0.004 * sp;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = '#1c140c'; ctx.beginPath();
      for (let k = 0; k < n; k++) { const q0 = k / n * Math.PI * 2, q1 = q0 + Math.PI / n * 0.9; ctx.lineTo(Math.cos(q0) * r, Math.sin(q0) * r); ctx.lineTo(Math.cos(q0) * (r + 7), Math.sin(q0) * (r + 7)); ctx.lineTo(Math.cos(q1) * (r + 7), Math.sin(q1) * (r + 7)); ctx.lineTo(Math.cos(q1) * r, Math.sin(q1) * r); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,150,70,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#2c2014'; for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.22, 0, Math.PI * 2); ctx.fill(); } // Speichenlöcher
      ctx.fillStyle = '#4c3818'; ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
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
    for (let k = 0; k < 4; k++) { // einzelne Lichtschächte zwischen den Sprossen, Staub darin
      const ang = -0.9 + k * 0.6, sx = x + Math.cos(ang) * r * 0.5, sy = y + Math.sin(ang) * r * 0.5, g2 = ctx.createLinearGradient(sx, sy, sx + 90, sy + 260);
      g2.addColorStop(0, 'rgba(180,190,255,0.09)'); g2.addColorStop(1, 'rgba(180,190,255,0)'); ctx.fillStyle = g2;
      ctx.beginPath(); ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy); ctx.lineTo(sx + 130, sy + 280); ctx.lineTo(sx + 70, sy + 280); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(220,225,255,0.5)'; for (let m = 0; m < 6; m++) { const u = ((t * 0.002 + m * 0.17 + k * 0.31) % 1); ctx.fillRect(Math.round(sx + u * 100 + Math.sin(m + t * 0.01) * 6), Math.round(sy + u * 280), 1, 1); }
    }
    const sh = ctx.createLinearGradient(x, y, x + r * 0.6, y + r * 2.2); sh.addColorStop(0, 'rgba(170,180,255,0.12)'); sh.addColorStop(1, 'rgba(170,180,255,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.lineTo(x + r * 1.4, y + r * 2.4); ctx.lineTo(x - r * 0.2, y + r * 2.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// Gigantisches Zahnwerk hinter der Pendelhalle in PS2-3D: drei Räderketten in verschiedenen Tiefen, jedes Rad extrudiert (Zähne,
// Seitenflächen, Speichen, Nabe), ineinandergreifend und gegenläufig im Verhältnis der Zähne, warmes Lampenlicht, Tiefendunst.
// Jedes Bild neu gebaut (die Räder drehen sich) und in halber Auflösung gerastert; weiter hinten liegende Räder ziehen langsamer vorbei.
class GearWorks extends Ent {
  constructor(d) {
    super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; this.buf = null;
    const g = (x, y, z, R, t, w) => ({ x, y, z, R, t, w }), at = (p, a, R) => [p.x + Math.cos(a) * (p.R + R + 9), p.y + Math.sin(a) * (p.R + R + 9)];
    const A = g(360, 150, 430, 150, 30, 0.0035), B = g(...at(A, 0.6, 90), 430, 90, 18, 0), C = g(...at(B, -0.9, 60), 430, 60, 12, 0);
    const D = g(1180, 250, 560, 200, 40, -0.0022), E = g(...at(D, 2.6, 80), 560, 80, 16, 0), F = g(...at(D, -0.4, 100), 560, 100, 20, 0);
    const G = g(1760, 380, 360, 130, 26, 0.004), H = g(...at(G, -2.2, 70), 360, 70, 14, 0), I = g(...at(G, 0.5, 46), 360, 46, 10, 0);
    for (const [a, b] of [[A, B], [B, C], [D, E], [D, F], [G, H], [G, I]]) b.w = -a.w * a.t / b.t; // Gegenlauf im Verhältnis der Zähne
    this.gears = [A, B, C, D, E, F, G, H, I];
  }
  update() { this.t++; }
  draw() { }
  static gear(P, m, g, ang, col, hub) { // extrudiertes Zahnrad um seine Achse (z), Vorderseite zum Betrachter
    const N = g.t * 4, out = [], back = [], zf = g.z - 12, zb = g.z + 12, R0 = g.R, R1 = g.R + 9;
    for (let i = 0; i < N; i++) {
      const q = Math.floor(i / 4), k = i % 4, a = ang + (q + [0, 0.18, 0.5, 0.68][k]) * Math.PI * 2 / g.t, r = k === 1 || k === 2 ? R1 : R0;
      const x = g.x + Math.cos(a) * r, y = -(g.y + Math.sin(a) * r);
      out.push(P.vtx(m, x, y, zf)); back.push(P.vtx(m, x, y, zb));
    }
    const c = P.vtx(m, g.x, -g.y, zf), C = [g.x, -g.y, g.z];
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; P.face(m, [c, out[i], out[j]], col, C); P.face(m, [out[i], back[i], back[j], out[j]], col.map(v => v * 0.8), C); } // Scheibe, Zahnflanken
    for (let s = 0; s < 6; s++) { const a = ang + s * Math.PI / 3, ex = g.x + Math.cos(a) * R0 * 0.9, ey = g.y + Math.sin(a) * R0 * 0.9; P.beam(m, g.x, -g.y, zf - 4, ex, -ey, zf - 4, R0 * 0.09 + 3, 6, hub); } // Speichen
    P.box(m, g.x, -g.y - R0 * 0.16, zf - 10, R0 * 0.32, R0 * 0.32, 8, hub, { rot: ang }); // Nabe
  }
  drawBack(ctx) {
    const w = View.w, Wb = Math.ceil(w / 2), Hb = 104;
    if (!this.buf || this.buf.w !== Wb) { const c = document.createElement('canvas'); c.width = Wb; c.height = Hb; this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w: Wb }; }
    const P = PS2, m = P.mesh(), t = W.frame, BR = [176, 128, 56], BZ = [124, 86, 42], IR = [92, 90, 104];
    this.gears.forEach((g, i) => GearWorks.gear(P, m, g, g.w * t + i * 0.37, i % 3 === 1 ? BZ : BR, IR));
    const B = this.buf; B.x.clearRect(0, 0, Wb, Hb);
    P.render(B.x, Wb, Hb, [m], { x: W.cam.x + w / 2, y: -(W.cam.y + 104), z: 0, yaw: 0, pitch: 0, f: 100, near: 20, cx: Wb / 2, cy: 52 }, GearWorks.ENV);
    ctx.save(); ctx.globalAlpha = 0.92; ctx.imageSmoothingEnabled = true; ctx.drawImage(B.c, 0, 0, Wb, Hb, 0, 0, Wb * 2, 208); ctx.restore();
  }
}
GearWorks.ENV = (() => { const v = [-0.45, 0.5, -0.75], l = Math.hypot(...v); return { sun: v.map(c => c / l), sunC: [0.95, 0.78, 0.5], amb: [0.16, 0.14, 0.2], sky: [0.12, 0.12, 0.18], fog: [14, 12, 22], fogD: 0.0016 }; })(); // warme Lampe von vorn links, Dunst in der Tiefe
