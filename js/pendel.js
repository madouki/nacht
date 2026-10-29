// Pendelhalle des Uhrturms (Schloss-Modus): riesige Uhrpendel mit Scheibengewicht schwingen über dem Abgrund – benachbarte
// gegenläufig, am Umkehrpunkt kommen sich zwei Gewichte nahe. Man steht oben auf der Wölbung der Scheibe, schwingt mit und
// springt im richtigen Moment zum nächsten Gewicht. Dahinter das Zifferblatt des Uhrturms von innen: Mondlicht scheint durch
// das Milchglas, die Ziffern stehen spiegelverkehrt, die Zeiger laufen rückwärts (man sieht sie ja von hinten).
'use strict';

class BigPendulum extends Ent { // d: { x, y (Drehpunkt, Kacheln), len (px), amp (rad), speed (rad je Bild), phase }
  constructor(d) {
    super(0, 0, 72, 72); this.kind = 'platform'; this.d = d; this.R = 36; this.slack = 2; // Messinglinse, 72 px breit
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
  // Alle Riesenpendel des Raums in einem Durchgang in PS2-3D (volle Auflösung – auf der Linse steht man), Kamera wie die
  // 3D-Kacheln (Auge 200 vor der Spielebene, Fluchtpunkt Bildmitte/60): die Linse liegt genau dort, wo man auf ihr steht
  draw(ctx) {
    if (BigPendulum.drawn === W.frame && BigPendulum.room === W.room) return;
    BigPendulum.drawn = W.frame; BigPendulum.room = W.room;
    const w = View.w, H = 208, cx = W.cam.x, cy = W.cam.y;
    const vis = W.platforms.filter(e => e instanceof BigPendulum && !e.dead && Math.max(e.px, e.bx) - cx > -90 && Math.min(e.px, e.bx) - cx < w + 90);
    if (!vis.length) return;
    let B = BigPendulum.buf;
    if (!B || B.w !== w) { const c = document.createElement('canvas'); c.width = w; c.height = H; B = BigPendulum.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w }; }
    const m = PS2.mesh();
    for (const e of vis) Pend3D.build(m, e.px, -e.py, 0, e.ang, e.L, e.R);
    B.x.clearRect(0, 0, w, H);
    PS2.render(B.x, w, H, [m], { x: cx + w / 2, y: -(cy + 60), z: -200, yaw: 0, pitch: 0, f: 200, near: 20, cx: w / 2, cy: 60 }, BigPendulum.ENV);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // warmer Schein um die Gewichte
    for (const e of vis) { const bx = e.bx - cx, by = e.by - cy, R = e.R, g = ctx.createRadialGradient(bx, by, R * 0.6, bx, by, R * 1.9); g.addColorStop(0, 'rgba(252,200,110,0.2)'); g.addColorStop(1, 'rgba(252,200,110,0)'); ctx.fillStyle = g; ctx.fillRect(bx - R * 2, by - R * 2, R * 4, R * 4); }
    ctx.restore();
    ctx.drawImage(B.c, 0, 0);
    for (const e of vis) e.face2D(ctx);
  }
  face2D(ctx) { // graviertes Sonnengesicht vorn auf der Linse (blinzelt ab und zu), Glanzlicht wandert mit dem Schwung
    const VX = View.w / 2, k = 200 / (200 - this.R * 0.46), sx = this.bx - W.cam.x, sy = this.by - W.cam.y, bx = VX + (sx - VX) * k, by = 60 + (sy - 60) * k, a = this.ang, t = this.t, s = this.R / 26;
    ctx.save(); ctx.strokeStyle = 'rgba(130,78,18,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, 9 * s, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) { const q = a + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(bx + Math.cos(q) * 10 * s, by + Math.sin(q) * 10 * s); ctx.lineTo(bx + Math.cos(q) * 15 * s, by + Math.sin(q) * 15 * s); ctx.stroke(); }
    const blink = (t + this.d.x * 37) % 220 < 7;
    ctx.fillStyle = 'rgba(96,52,10,0.85)';
    if (blink) { ctx.fillRect(Math.round(bx - 5 * s), Math.round(by - 3 * s), 3, 1); ctx.fillRect(Math.round(bx + 2 * s), Math.round(by - 3 * s), 3, 1); }
    else { ctx.fillRect(Math.round(bx - 4 * s), Math.round(by - 4 * s), 2, 2); ctx.fillRect(Math.round(bx + 2 * s), Math.round(by - 4 * s), 2, 2); }
    ctx.beginPath(); ctx.arc(bx, by + s, 4 * s, 0.2, Math.PI - 0.2); ctx.stroke();
    const gx = bx - 9 * s - a * 18; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.ellipse(gx, by - 12 * s, 5 * s, 2, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  lightUp(L, cx, cy) { L.push({ x: this.bx - cx, y: this.by - cy, r: 40, c: [252, 210, 120], a: 0.35 }); }
}

BigPendulum.ENV = (() => { const v = [-0.4, 0.55, -0.73], l = Math.hypot(...v); return { static: false, sun: v.map(c => c / l), sunC: [0.92, 0.8, 0.6], amb: [0.3, 0.26, 0.28], sky: [0.12, 0.1, 0.14], fog: [0, 0, 0], fogD: 0 }; })(); // warmes Lampenlicht von vorn links

class ClockFace extends Ent { // Zifferblatt von innen, hinter allem (drawBack): Milchglas mit Mondlicht, Spiegelziffern, rückwärts laufende Zeiger
  constructor(d) { super(d.x * T, d.y * T, 1, 1); this.kind = 'prop'; this.r = d.r || 150; this.noWrap = true; }
  update() { this.t++; }
  draw() { }
  screen() { return { x: Math.round(View.w / 2 + (this.x - View.w / 2 - W.cam.x) * 0.6), y: Math.round(104 + (this.y - 104 - W.cam.y) * 0.8), r: this.r }; } // Lage in der Wandebene (wie die Fenster)
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
    const { x, y, r } = this.screen(), t = W.frame; // in der Rückwand (TowerGlass.wall spart die Öffnung aus, dahinter Himmel und Zahnwerk)
    if (x + r + 24 < -20 || x - r - 24 > View.w + 20) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r); // Milchglas, von hinten vom Mond beschienen – das Zahnwerk scheint als Schatten durch
    g.addColorStop(0, 'rgba(220,226,255,0.5)'); g.addColorStop(0.7, 'rgba(150,160,210,0.32)'); g.addColorStop(1, 'rgba(60,64,100,0.22)');
    for (let k = 0; k < 24; k++) { // Steinkranz aus Keilsteinen, in die Quaderwand eingebunden
      const a0 = k / 24 * Math.PI * 2, a1 = (k + 1) / 24 * Math.PI * 2 - 0.02;
      ctx.fillStyle = k % 2 ? '#3a3848' : '#33313f'; ctx.beginPath(); ctx.arc(x, y, r + 24, a0, a1); ctx.arc(x, y, r + 10, a1, a0, true); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = '#4c4a5c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r + 24, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#1c1828'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke(); // eiserner Ring
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
    const clock = W.ents.find(e => e instanceof ClockFace && !e.dead), c = clock && clock.screen(); // in der Pendelhalle: nur durch das Zifferblatt sichtbar
    if (c && (c.x + c.r < 0 || c.x - c.r > View.w || c.y + c.r < 0 || c.y - c.r > 208)) return;
    const w = View.w, Wb = Math.ceil(w / 2), Hb = 104;
    if (!this.buf || this.buf.w !== Wb) { const c = document.createElement('canvas'); c.width = Wb; c.height = Hb; this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w: Wb }; }
    const P = PS2, m = P.mesh(), t = W.frame, BR = [176, 128, 56], BZ = [124, 86, 42], IR = [92, 90, 104];
    this.gears.forEach((g, i) => GearWorks.gear(P, m, g, g.w * t + i * 0.37, i % 3 === 1 ? BZ : BR, IR));
    const B = this.buf; B.x.clearRect(0, 0, Wb, Hb);
    P.render(B.x, Wb, Hb, [m], { x: W.cam.x + w / 2, y: -(W.cam.y + 104), z: 0, yaw: 0, pitch: 0, f: 100, near: 20, cx: Wb / 2, cy: 52 }, GearWorks.ENV);
    ctx.save(); if (c) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.clip(); } ctx.globalAlpha = c ? 0.8 : 0.45; ctx.imageSmoothingEnabled = true; ctx.drawImage(B.c, 0, 0, Wb, Hb, 0, 0, Wb * 2, 208); ctx.restore(); // dezent: weit hinten
  }
}
GearWorks.ENV = (() => { const v = [-0.45, 0.5, -0.75], l = Math.hypot(...v); return { sun: v.map(c => c / l), sunC: [0.95, 0.78, 0.5], amb: [0.16, 0.14, 0.2], sky: [0.12, 0.12, 0.18], fog: [14, 12, 22], fogD: 0.0016 }; })(); // warme Lampe von vorn links, Dunst in der Tiefe

// Riesenpendel in PS2-3D (Pendelhalle als Plattformen, Uhrturm als Kulisse): Rostpendel aus fünf Stäben, Messing und Stahl in der
// Tiefe versetzt, Querjoche, Lyra mit Rosette, am Drehpunkt ein extrudiertes Zahnrad, das mit dem Ausschlag dreht; unten eine
// Messinglinse (Drehkörper, vorn gewölbt) mit Perlrand. Modell: Drehpunkt (ox, oy, oz), y nach oben, ang = Auslenkung
const Pend3D = (() => {
  const BR = [214, 164, 70], BR2 = [160, 112, 40], ST = [150, 160, 174], DK = [64, 46, 24], LENS = [226, 176, 76], LENS2 = [176, 122, 44], BEAD = [252, 222, 150];
  function build(m, ox, oy, oz, ang, L, R) {
    const P = PS2, s = Math.sin(ang), c = Math.cos(ang), at = (o, d) => [ox + c * o + s * d, oy + s * o - c * d]; // o quer, d längs zur Stange
    const end = L - R * 0.9, k = R / 30;
    for (const [o, z, col] of [[-0.26, -3, BR], [-0.13, 3, ST], [0, -4, BR], [0.13, 3, ST], [0.26, -3, BR]]) { const [x0, y0] = at(o * R, 0), [x1, y1] = at(o * R, end); P.beam(m, x0, y0, oz + z * k, x1, y1, oz + z * k, 2.6 * k, 2.6 * k, col, { open: true }); }
    for (const d of [0.12, 0.3, 0.72, 0.9]) { const [x0, y0] = at(-0.34 * R, end * d), [x1, y1] = at(0.34 * R, end * d); P.beam(m, x0, y0, oz - 6 * k, x1, y1, oz - 6 * k, 3.4 * k, 3.4 * k, BR2); }
    for (const sg of [-1, 1]) { // Lyra: zwei geschwungene Arme
      let prev = null;
      for (let i = 0; i <= 6; i++) { const u = i / 6, o = sg * R * (0.95 * 2 * u * (1 - u) + 0.32 * u * u), d = end * (0.62 - 0.22 * u), q = at(o, d); if (prev) P.beam(m, prev[0], prev[1], oz - 8 * k, q[0], q[1], oz - 8 * k, 2.6 * k, 2.6 * k, BR); prev = q; }
    }
    { const [rx, ry] = at(0, end * 0.38); P.prism(m, rx, ry - 5 * k, oz - 10 * k, 6 * k, 10 * k, 8, BR, { top: BEAD }); }                  // Rosette
    GearWorks.gear(P, m, { x: ox, y: -oy, z: oz + 14 * k, R: R * 0.8, t: 12 }, ang * 3, BR2, DK);                                         // Zahnrad am Drehpunkt
    P.prism(m, ox, oy - 6 * k, oz - 8 * k, 5 * k, 12 * k, 8, DK, { top: BEAD });                                                              // Achse
    const [bx, by] = at(0, L), prof = [[0, -0.46], [0.42, -0.4], [0.74, -0.26], [0.94, -0.1], [1, 0], [0.9, 0.16]], n = 16, rings = [];
    for (const [r, z] of prof) { const row = []; for (let i = 0; i < n; i++) { const a = ang + i / n * Math.PI * 2; row.push(P.vtx(m, bx + Math.cos(a) * r * R, by + Math.sin(a) * r * R, oz + z * R)); } rings.push(row); }
    for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < n; i++) { // Mitte als Dreiecke (ein Viereck mit doppeltem Mittelpunkt hätte keine Normale und fiele weg)
      const i2 = (i + 1) % n, q = j ? [rings[j][i], rings[j][i2], rings[j + 1][i2], rings[j + 1][i]] : [rings[0][i], rings[1][i2], rings[1][i]];
      P.face(m, q, j === 3 ? LENS2 : (i + j) % 2 ? LENS : LENS.map(v => v * 0.94), [bx, by, oz + R]);
    }
    for (let i = 0; i < 12; i++) { const a = ang + i / 12 * Math.PI * 2; P.box(m, bx + Math.cos(a) * R * 0.86, by + Math.sin(a) * R * 0.86 - 1.6 * k, oz - R * 0.18, 3.2 * k, 3.2 * k, 3.2 * k, i % 2 ? BEAD : BR2); } // Perlrand
    return [bx, by, oz - R * 0.46];
  }
  return { build };
})();
// Kulissenpendel (Uhrturm): schwingt tief hinten im Turm, nicht begehbar – wird mit der Tiefe kleiner und zieht langsamer vorbei
class PendulumDeco extends Ent { // d: { x, y (Drehpunkt, Kacheln), z (Tiefe px), len, R, amp, speed, phase }
  constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; this.d = d; this.buf = null; }
  update() { this.t++; }
  draw() { }
  drawBack(ctx) {
    const d = this.d, w = View.w, Wb = Math.ceil(w / 2), Hb = 104, ang = d.amp * Math.sin(W.frame * d.speed + (d.phase || 0));
    if (!this.buf || this.buf.w !== Wb) { const c = document.createElement('canvas'); c.width = Wb; c.height = Hb; this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w: Wb }; }
    const m = PS2.mesh(), B = this.buf;
    Pend3D.build(m, d.x * T, -d.y * T, d.z, ang, d.len, d.R);
    B.x.clearRect(0, 0, Wb, Hb);
    PS2.render(B.x, Wb, Hb, [m], { x: W.cam.x + w / 2, y: -(W.cam.y + 60), z: -200, yaw: 0, pitch: 0, f: 100, near: 20, cx: Wb / 2, cy: 30 }, PendulumDeco.ENV);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(B.c, 0, 0, Wb, Hb, 0, 0, Wb * 2, 208); ctx.restore();
  }
}
PendulumDeco.ENV = (() => { const v = [-0.4, 0.5, -0.77], l = Math.hypot(...v); return { sun: v.map(c => c / l), sunC: [0.95, 0.8, 0.56], amb: [0.26, 0.22, 0.28], sky: [0.12, 0.1, 0.16], fog: [16, 14, 26], fogD: 0.0009 }; })();

// Buntglasfenster in der Rückwand der Pendelhalle: die Figurenfenster des Glasturms in doppelter Auflösung (Tiles.glassHi), fest
// eingemauert – tiefe Laibung, Spitzbogen aus Keilsteinen mit Wulst, Sohlbank auf Konsolen, Säulchen mit Kapitell –, auf derselben
// Wandebene wie das Zifferblatt (Parallaxe 0.6). Mondlicht lässt sie glimmen und wirft farbige Schächte; schlägt der Blitz ein
// (Gewitter über dem Schloss), gleißen sie auf und werfen helle Lichtbahnen schräg durch die Halle
class TowerGlass extends Ent { // d: { list: [[x, y, Fenster 0–11], …] (Kacheln: Fenstermitte, Oberkante), s (Maßstab) }
  constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; this.list = d.list; this.s = d.s || 1; }
  update() { this.t++; }
  draw() { }
  static arch(ctx, x0, y0, W, H) { // gleichseitiger Spitzbogen als Pfad
    const A = W * 0.866;
    ctx.beginPath(); ctx.moveTo(x0, y0 + H); ctx.lineTo(x0, y0 + A); ctx.arc(x0 + W, y0 + A, W, Math.PI, Math.PI * 4 / 3); ctx.arc(x0, y0 + A, W, -Math.PI / 3, 0); ctx.lineTo(x0 + W, y0 + H); ctx.closePath();
  }
  // Rückwand der Halle in derselben Ebene wie Fenster und Zifferblatt (Parallaxe 0.6 / 0.8): Quader in versetzten Lagen, Pilaster
  // zwischen den Fenstern, Gesimse über und unter den Fensterreihen – so sitzen die Fenster fest im Mauerwerk, statt vor der
  // ferneren Turmkulisse zu schweben. Das Zifferblatt bleibt eine Öffnung (dahinter Nachthimmel, das Zahnwerk, das Milchglas)
  static wall(ctx, clock) {
    const vw = View.w, sx = (wx) => vw / 2 + (wx - vw / 2 - W.cam.x) * 0.6, sy = (wy) => 104 + (wy - 104 - W.cam.y) * 0.8;
    const hn = (a, b) => { let n = Math.imul(a * 374761393 + b * 668265263, 1274126177); n ^= n >>> 13; return ((n >>> 0) % 997) / 997; };
    ctx.save();
    if (clock) { const c = clock.screen(); ctx.beginPath(); ctx.rect(-4, -4, vw + 8, 216); ctx.arc(c.x, c.y, c.r + 10, 0, Math.PI * 2, true); ctx.clip('evenodd'); } // Öffnung für das Zifferblatt
    ctx.fillStyle = '#121018'; ctx.fillRect(0, 0, vw, 208);
    const BW = 38, BH = 19, x0 = sx(0), y0 = sy(0), r0 = Math.floor(-y0 / BH) - 1;
    for (let r = r0; y0 + r * BH < 208; r++) { // Quaderlagen
      const y = Math.round(y0 + r * BH), off = (r & 1) * BW / 2, k0 = Math.floor((-x0 - off) / BW) - 1;
      for (let k = k0; x0 + off + k * BW < vw; k++) {
        const x = Math.round(x0 + off + k * BW), v = hn(k, r);
        ctx.fillStyle = v < 0.33 ? '#2a2734' : v < 0.66 ? '#2e2b39' : '#262330'; ctx.fillRect(x + 1, y + 1, BW - 2, BH - 2);
        ctx.fillStyle = '#3c394e'; ctx.fillRect(x + 1, y + 1, BW - 2, 1); ctx.fillStyle = '#1c1a24'; ctx.fillRect(x + 1, y + BH - 2, BW - 2, 1); // Lichtkante oben, Schattenkante unten
        if (v > 0.86) { ctx.fillStyle = '#16141c'; ctx.fillRect(x + 6 + Math.round(v * 20), y + 5, 7, 1); } // Riss
      }
    }
    for (const wy of [262, 348]) { const y = Math.round(sy(wy)); ctx.fillStyle = '#2c2a38'; ctx.fillRect(0, y, vw, 7); ctx.fillStyle = '#3c3a4c'; ctx.fillRect(0, y, vw, 1); ctx.fillStyle = '#0e0c14'; ctx.fillRect(0, y + 7, vw, 2); } // Gesimse zwischen den Fensterreihen
    for (const wx of [0, 480, 794, 1254, 1568, 2048]) { // Pilaster zwischen Fenstern und Zifferblatt
      const x = Math.round(sx(wx)) - 8; if (x > vw + 10 || x < -26) continue;
      ctx.fillStyle = '#34313f'; ctx.fillRect(x, 0, 16, 208); ctx.fillStyle = '#48455c'; ctx.fillRect(x, 0, 2, 208); ctx.fillStyle = '#121018'; ctx.fillRect(x + 14, 0, 2, 208);
      for (let y = Math.round(y0) % 38 - 38; y < 208; y += 38) { ctx.fillStyle = '#1a1822'; ctx.fillRect(x + 2, y, 12, 1); } // Fugen der Pilasterquader
    }
    ctx.restore();
    if (clock) { const c = clock.screen(), g = ctx.createRadialGradient(c.x - c.r * 0.3, c.y - c.r * 0.3, 10, c.x, c.y, c.r + 10); g.addColorStop(0, '#2c3460'); g.addColorStop(1, '#0c0e1e'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 10, 0, Math.PI * 2); ctx.fill(); } // Nachthimmel hinter dem Glas
  }
  drawBack(ctx) {
    const clock = W.ents.find(e => e instanceof ClockFace && !e.dead);
    TowerGlass.wall(ctx, clock);
    const HI = Tiles.glassHi(), fl = W.storm && FX.stormOn(W.storm), t = this.t, s = this.s, w = 84 * s, h = 196 * s, A = TowerGlass.arch;
    for (const [tx, ty, i] of this.list) {
      const x = Math.round(View.w / 2 + (tx * T - View.w / 2 - W.cam.x) * 0.6 - w / 2), y = Math.round(104 + (ty * T - 104 - W.cam.y) * 0.8);
      if (x + w + 30 < 0 || x - 30 > View.w || y > 220 || y + h + 20 < -10) continue;
      const im = HI[i % HI.length], e = 9 * s;
      ctx.save();
      A(ctx, x - e - 4 * s, y - e - 4 * s, w + 2 * e + 8 * s, h + 2 * e + 4 * s); ctx.fillStyle = '#1c1a26'; ctx.fill();   // Fuge um den Bogen
      A(ctx, x - e, y - e, w + 2 * e, h + 2 * e); const sg = ctx.createLinearGradient(x - e, 0, x + w + e, 0); sg.addColorStop(0, '#6c6878'); sg.addColorStop(0.5, '#4c4858'); sg.addColorStop(1, '#2c2a36'); ctx.fillStyle = sg; ctx.fill(); // Keilsteinbogen
      ctx.strokeStyle = 'rgba(20,18,28,0.9)'; ctx.lineWidth = 1; // Fugen der Keilsteine
      for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI / 3, cx0 = x + w + e, cy0 = y + w * 0.866; ctx.beginPath(); ctx.moveTo(cx0 + Math.cos(a) * (w + e), cy0 + Math.sin(a) * (w + e) - e * 0.2); ctx.lineTo(cx0 + Math.cos(a) * w, cy0 + Math.sin(a) * w); ctx.stroke(); }
      A(ctx, x - 3 * s, y - 3 * s, w + 6 * s, h + 3 * s); ctx.fillStyle = '#0c0a12'; ctx.fill();                              // tiefe Laibung
      ctx.restore();
      ctx.drawImage(im.c, x, y, w, h);                                                                                          // das Glas (doppelt aufgelöst)
      for (const sx of [x - e + 1, x + w + e - 5 * s]) { // Säulchen mit Kapitell und Basis
        ctx.fillStyle = '#4c4858'; ctx.fillRect(sx, y + w * 0.7, 4 * s, h - w * 0.7); ctx.fillStyle = '#6c6878'; ctx.fillRect(sx, y + w * 0.7, 1, h - w * 0.7);
        ctx.fillStyle = '#7c7888'; ctx.fillRect(sx - s, y + w * 0.7 - 3 * s, 6 * s, 3 * s); ctx.fillRect(sx - s, y + h - 2 * s, 6 * s, 2 * s);
      }
      ctx.fillStyle = '#5c5868'; ctx.fillRect(x - e - 6 * s, y + h, w + 2 * e + 12 * s, 5 * s); ctx.fillStyle = '#8c8898'; ctx.fillRect(x - e - 6 * s, y + h, w + 2 * e + 12 * s, 1); // Sohlbank
      ctx.fillStyle = '#2c2a36'; for (const kx of [x - e, x + w / 2 - 3 * s, x + w + e - 6 * s]) { ctx.fillRect(kx, y + h + 5 * s, 6 * s, 4 * s); ctx.fillRect(kx + s, y + h + 9 * s, 4 * s, 2 * s); } // Konsolen
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = fl ? 0.95 : 0.3 + 0.06 * Math.sin(t * 0.03 + i); ctx.drawImage(im.g, x, y, w, h); // Mondlicht bzw. Blitz durchs Glas
      const len = fl ? 320 : 180, sl = 0.42, x0 = x + 14 * s, x1 = x + w - 14 * s, y0 = y + h * 0.66, g = ctx.createLinearGradient(0, y0, 0, y0 + len);
      g.addColorStop(0, fl ? 'rgba(220,214,255,0.42)' : 'rgba(170,150,255,0.08)'); g.addColorStop(1, 'rgba(170,150,255,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 + len * sl + 24, y0 + len); ctx.lineTo(x0 + len * sl - 12, y0 + len); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}
