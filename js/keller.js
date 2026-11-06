// Aktenkeller (Schloss-Modus, 2. UG links am Paternoster): eine Rollregalanlage und der Reißwolf.
// ROLLREGALE: drei fahrbare Regale (2, 4 und 6 Kacheln hoch, Blender-Modelle 'rr2/rr4/rr6' in img/krat3d.png) auf einer Schiene.
// Am Steuerpult am Eingang hat jedes Regal eine Kurbel (A, B, C): ein Peitschenhieb schickt es zur Registraturwand, der nächste
// wieder zurück. Es rollt, bis es anstößt – an die Wand, ein anderes Regal oder den Helden (den schiebt es mit, bis er klemmt).
// Stehen alle drei der Größe nach vor der Wand, ergeben sie eine Treppe hinauf und hinüber zur Bosskammer. Die festen Kacheln
// der Regale ('G', unsichtbar fest) wandern im Raster mit; wer oben steht, fährt mit.
// REISSWOLF (Zwischengegner): ein Aktenvernichter mit Wolfskopf (Blender-Netz, js/rwmesh.js) auf Bürostuhlrollen, das Netzkabel
// als Schwanz. Auftritt: er steht stromlos in der Ecke; betritt der Held die Kammer, kriecht der Stecker in die Steckdose, die
// LEDs flackern, der Motor heult hoch – dann das Heulen, Namensband, Wortgeplänkel, Kampf. Angriffe: SCHREDDERN (Maul auf, er
// saugt den Helden und Akten aus den Regalen an – drei verschluckte Ordner, dann PAPIERSTAU: er raucht, klemmt und steckt doppelt
// ein), KONFETTI (Fächer aus Papierstreifen im Bogen), ANSTURM (rollt quer durch die Kammer, prallt an die Wand und ist kurz
// benommen). Ab halber Energie Stufe 5 (Partikelschnitt): schneller, mehr Konfetti, Doppelansturm. Besiegt platzt er in Konfetti.
'use strict';

const Keller = (() => {
  const A = (k) => (typeof Castle !== 'undefined' && Castle.art ? Castle.art(k) : null);
  const K3 = () => (typeof Castle !== 'undefined' && Castle.k3at ? Castle : null);

  // ---------------- Rollregal ----------------
  class Rollregal extends Ent {
    constructor(d) {
      super(d.x * T, (d.base - d.h) * T, 2 * T, d.h * T);
      this.kind = 'prop'; this.d = d; this.id = d.id; this.hh = d.h; this.base = d.base; this.home = d.x; this.to = d.to;
      this.px = d.x * T; this.dir = 0; this.goal = d.x; this.occ = [d.x, d.x + 1]; this.spin = 0;
      this.fill(d.x, 'G'); this.fill(d.x + 1, 'G');
    }
    fill(c, ch) { for (let r = this.base - this.hh; r < this.base; r++) W.room.grid[r][c] = ch; }
    colFree(c) {
      if (c < 0 || c >= W.room.w) return false;
      for (let r = this.base - this.hh; r < this.base; r++) if (SOLID.has(W.room.grid[r][c])) return false;
      return true;
    }
    atWall() { return !this.dir && Math.round(this.px / T) === this.to; }
    send() { // Kurbel: fährt es, kehrt es um; steht es an der Wand, geht es zurück an seinen Platz, sonst (auch wenn es unterwegs klemmte) zur Wand
      if (this.dir) this.goal = this.goal === this.to ? this.home : this.to;
      else this.goal = this.atWall() ? this.home : this.to;
      this.dir = Math.sign(this.goal * T - this.px);
      if (this.dir) Audio8.sfx('creak', this.cx);
    }
    stop(squeeze) {
      this.dir = 0; Audio8.sfx('klack', this.cx); W.shake = Math.max(W.shake, 2);
      if (squeeze) W.popup(this.cx, this.y - 10, tr('rrStuck'), '#f8b800');
    }
    update() {
      this.t++;
      if (!this.dir) return;
      const SPD = 1, p = W.player, nx = this.px + this.dir * SPD, top = (this.base - this.hh) * T, bot = this.base * T;
      const lead = this.dir < 0 ? Math.floor(nx / T) : Math.floor((nx + 2 * T - 0.01) / T);
      if (lead < this.occ[0] || lead > this.occ[1]) { // Vorderkante erreicht eine neue Spalte: frei? Held im Weg → mitschieben
        if (!this.colFree(lead)) return this.stop();
        const lx = lead * T;
        if (p.alive && p.x < lx + T && p.x + p.w > lx && p.y < bot && p.feet > top + 1) {
          Phys.moveX(p, this.dir < 0 ? lx - (p.x + p.w) - 0.01 : lx + T - p.x + 0.01);
          if (p.x < lx + T && p.x + p.w > lx) return this.stop(true);
        }
        this.fill(lead, 'G'); if (this.dir < 0) this.occ[0] = lead; else this.occ[1] = lead;
      }
      if (p.alive && p.onGround && Math.abs(p.feet - top) < 2 && p.x + p.w > this.px && p.x < this.px + 2 * T) Phys.moveX(p, this.dir * SPD); // oben mitfahren
      this.px = nx; this.x = nx; this.spin += this.dir * 0.22;
      const tail = this.dir < 0 ? this.occ[1] : this.occ[0];
      if (this.dir < 0 ? this.px + 2 * T <= tail * T : this.px >= (tail + 1) * T) { this.fill(tail, '.'); if (this.dir < 0) this.occ[1]--; else this.occ[0]++; }
      if (this.t % 12 === 0) Audio8.sfx('chug', this.cx);
      if (Math.abs(this.px - this.goal * T) < SPD) { this.px = this.goal * T; this.x = this.px; this.stop(); }
    }
    draw(ctx) {
      const sx = Math.round(this.px - W.cam.x), sy = Math.round(this.base * T - W.cam.y);
      if (sx < -40 || sx > View.w + 8) return;
      const K = K3();
      if (!(K && K.k3at(ctx, 'rr' + this.hh, sx, sy))) { ctx.fillStyle = '#4c5c54'; ctx.fillRect(sx, sy - this.hh * T, 32, this.hh * T); }
      ctx.fillStyle = '#f0ead8'; ctx.fillRect(sx + 12, sy - this.hh * T + 4, 9, 6); Font.draw(ctx, this.id, sx + 17, sy - this.hh * T + 4, '#1c1c24', { align: 'center' }); // Kennbuchstabe
    }
  }

  // ---------------- Steuerpult mit den Kurbeln A, B, C (und der Schiene) ----------------
  class Kurbel extends Ent { // peitschbar (kind 'candle': W.whipAt ruft hit())
    constructor(x, y, id) { super(x - 8, y - 8, 16, 16); this.kind = 'candle'; this.id = id; this.cool = 0; }
    shelf() { return W.ents.find(e => e instanceof Rollregal && e.id === this.id); }
    hit() {
      if (this.cool > 0) return; this.cool = 20;
      const s = this.shelf(); if (!s) return;
      s.send(); Audio8.sfx('tink', this.cx);
    }
    update() { this.t++; if (this.cool > 0) this.cool--; }
    draw(ctx) {
      const s = this.shelf(), sx = Math.round(this.cx - W.cam.x), sy = Math.round(this.cy - W.cam.y);
      if (sx < -20 || sx > View.w + 20) return;
      ctx.fillStyle = '#2c3430'; ctx.fillRect(sx - 9, sy - 9, 18, 26); ctx.fillStyle = '#5c6c64'; ctx.fillRect(sx - 9, sy - 9, 18, 1); // Konsole
      const w = A('rrwheel'), a = s ? s.spin : 0;
      if (w) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.drawImage(w, -6, -6); ctx.restore(); }
      else { ctx.strokeStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.stroke(); }
      const lit = s ? (s.dir ? ((this.t >> 3) & 1 ? '#f8d038' : '#5c4c10') : s.atWall() ? '#58e070' : '#e04040') : '#444';
      ctx.fillStyle = lit; ctx.fillRect(sx - 2, sy + 10, 4, 3);
      Font.draw(ctx, this.id, sx, sy - 18, '#f0ead8', { align: 'center', shadow: '#000' });
    }
    lightUp(L, cx, cy) { const s = this.shelf(); L.push({ x: this.cx - cx, y: this.cy + 11 - cy, r: 10, c: s && s.atWall() ? [90, 230, 110] : [230, 70, 60], a: 0.4 }); }
  }
  class Schiene extends Ent { // Bodenschiene der Rollregale
    constructor(d) { super(d.x0 * T, d.base * T - 2, (d.x1 - d.x0 + 1) * T, 2); this.kind = 'prop'; }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#5c6470'; ctx.fillRect(sx, sy, this.w, 2); ctx.fillStyle = '#a8b0bc'; ctx.fillRect(sx, sy, this.w, 1);
      ctx.fillStyle = '#2c3038'; for (let x = 0; x < this.w; x += 8) ctx.fillRect(sx + x, sy + 1, 1, 1);
    }
  }

  function make(d) {
    if (d.k === 'roll') return new Rollregal(d);
    if (d.k === 'crank') return new Kurbel(d.x * T + 8, d.y * T + 4, d.id);
    if (d.k === 'rail') return new Schiene(d);
    if (d.k === 'socket') return new Steckdose(d);
    return new Ent(0, 0, 1, 1);
  }

  // ---------------- PS2-Bausteine für den Reißwolf ----------------
  const BEIGE = [218, 208, 186], GRAPH = [64, 64, 72], GRAPHD = [40, 40, 46], STEEL = [186, 192, 204], RUBBER = [26, 24, 30], CHROME = [210, 214, 222];
  const PAL = { BEIGE, BEIGED: [176, 166, 146], BLACK: [24, 22, 26], C1: [236, 230, 210], C2: [190, 60, 60], C3: [70, 110, 190], C4: [240, 200, 70], GLASS: [52, 70, 92], GRAPH, GRAPHD, GREEN: [60, 190, 90], LED: [255, 60, 40], PLATE: [244, 240, 228], RED: [200, 34, 40], STEEL };
  function xf(P, x, y, z) { // Teil-Rahmen → Boss-Raum (Rollen um z, Spiegeln in x (P.m = Blickrichtung), dann Gieren um y)
    const cr = Math.cos(P.r), sr = Math.sin(P.r), cy = Math.cos(P.y), sy = Math.sin(P.y), X = (x * cr - y * sr) * (P.m || 1), Y = x * sr + y * cr;
    return [P.c[0] + X * cy - z * sy, P.c[1] + Y, P.c[2] + X * sy + z * cy];
  }
  function fbox(m, P, ox, oy, oz, w, h, d, col) {
    const I = [];
    for (const [a, b, e] of [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]) { const q = xf(P, ox + a * w / 2, oy + b * h / 2, oz + e * d / 2); I.push(PS2.vtx(m, q[0], q[1], q[2])); }
    const C = xf(P, ox, oy, oz), [Q0, Q1, Q2, Q3, Q4, Q5, Q6, Q7] = I;
    for (const q of [[Q0, Q1, Q5, Q4], [Q1, Q2, Q6, Q5], [Q2, Q3, Q7, Q6], [Q3, Q0, Q4, Q7], [Q4, Q5, Q6, Q7], [Q0, Q3, Q2, Q1]]) PS2.face(m, q, col, C);
  }
  function imp(m, part, P, col) { // Blender-Netz mit eigenen Normalen einsetzen; col(key) → [Farbe, Leuchten]
    const base = m.v.length / 3, cr = Math.cos(P.r), sr = Math.sin(P.r), cy = Math.cos(P.y), sy = Math.sin(P.y);
    for (let i = 0; i < part.v.length; i += 3) { const q = xf(P, part.v[i], part.v[i + 1], part.v[i + 2]); m.v.push(q[0], q[1], q[2]); }
    for (const f of part.f) {
      const X = (f[1] * cr - f[2] * sr) * (P.m || 1), Y = f[1] * sr + f[2] * cr, [c, e] = col(RW_MESH.k[f[0]]);
      m.f.push({ i: f.slice(4).map(j => j + base), c, n: [X * cy - f[3] * sy, Y, X * sy + f[3] * cy], e, two: false, a: 1 });
    }
  }
  const ENV = (() => { const n = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); }; return { sun: n([0.4, 0.8, -0.5]), sunC: [0.95, 1.0, 1.05], amb: [0.2, 0.2, 0.24], sky: [0.2, 0.22, 0.28], rim: n([-0.7, 0.4, 0.6]), rimC: [0.55, 0.4, 0.3], fog: [0, 0, 0], fogD: 0 }; })(); // Neonröhre von vorn oben, warmes Gegenlicht
  function blit(ctx, holder, list, bx, gy, shake) { // eigener Puffer, dunkle Kontur, nach dem Licht (wie beim Amtsschimmel)
    const w = View.w, Hb = 208, VX = w / 2, D = 560;
    if (!holder.buf || holder.buf.w !== w) {
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = Hb; return c; }, c = mk(), o = mk();
      holder.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), o, ox: o.getContext('2d'), w };
    }
    const B = holder.buf, ox = bx - W.cam.x, oy = gy - W.cam.y;
    B.x.clearRect(0, 0, w, Hb);
    PS2.render(B.x, w, Hb, list, { x: VX - ox, y: oy - 60, z: -D, yaw: 0, pitch: 0, f: D, near: 30, cx: VX, cy: 60 }, ENV);
    const O = B.ox; O.globalCompositeOperation = 'copy'; O.drawImage(B.c, 0, 0); O.globalCompositeOperation = 'source-in'; O.fillStyle = '#0c0a10'; O.fillRect(0, 0, w, Hb);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(B.o, shake + dx, dy);
    ctx.drawImage(B.c, shake, 0);
    return B;
  }

  // ---------------- Steckdose an der Kammerwand ----------------
  class Steckdose extends Ent {
    constructor(d) { super(d.x * T, d.y * T, 12, 14); this.kind = 'prop'; }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#d8d0c0'; ctx.fillRect(sx, sy, 12, 14); ctx.fillStyle = '#a8a090'; ctx.fillRect(sx, sy + 13, 12, 1);
      ctx.fillStyle = '#3c3830'; ctx.fillRect(sx + 3, sy + 5, 2, 3); ctx.fillRect(sx + 7, sy + 5, 2, 3);
    }
  }

  return { make, Rollregal, Kurbel, xf, fbox, imp, blit, PAL, BEIGE, GRAPH, GRAPHD, STEEL, RUBBER, CHROME };
})();

class Reisswolf extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + 80, gy - 100, 112, 92, 48, 3);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 12000; this.nameKey = 'bossReiss'; this.music = 'reisswolf'; this.keepMusic = true;
    this.bx = ax + 116; this.face = 1; this.yaw = -0.35; this.lootY = gy - 40;
    this.state = 'off'; this.timer = 0; this.ph2 = false; this.lateIntro = true; this.holdIntro = true;
    this.sock = { x: ax + 14, y: gy - 24 }; this.plug = 0; this.led = 0; this.rev = 0; this.jaw = 0; this.wheel = 0; this.eat = 0; this.vx = 0;
    this.dashes = 0; this.buf = null; this.fast = !!(Castle.flags && Castle.flags.reiss_seen); // beim Wiedersehen kürzerer Auftritt
  }
  // ---------------- Modell ----------------
  plugPos() { // Stecker: liegt erst am Boden hinter ihm, kriecht dann in die Steckdose
    const fx = this.bx - this.face * 70, fy = this.gy - 3, k = this.plug * this.plug * (3 - 2 * this.plug);
    return [fx + (this.sock.x + 6 - fx) * k, fy + (this.sock.y + 7 - fy) * k - Math.sin(Math.PI * k) * 26];
  }
  mesh() {
    const KM = Keller, m = PS2.mesh(), fl = this.flashT > 0, F = (c) => (fl ? [240, 240, 240] : c), bob = this.state === 'off' ? 0 : Math.sin(this.t * (0.3 + this.rev * 0.9)) * (0.4 + this.rev);
    const P = { c: [0, bob, 0], r: this.state === 'bonk' ? Math.sin(this.timer * 0.6) * 0.04 : 0, y: this.yaw, m: this.face };
    const jam = this.state === 'jam', led = this.led, LED = [255, 40 + 120 * led, 30];
    const col = (k) => k === 'LED' ? [led > 0.05 ? LED : [70, 20, 20], led * 1.1] : k === 'GREEN' ? [F(this.led > 0.3 && !jam ? [80, 240, 110] : [30, 70, 40]), this.led > 0.3 && !jam ? 0.5 : 0] : k === 'RED' ? [F(jam && (this.t >> 2) & 1 ? [255, 70, 60] : PAL_RED), jam ? 0.6 : 0] : [F(KM.PAL[k] || [200, 0, 200]), 0];
    const PAL_RED = KM.PAL.RED;
    KM.imp(m, RW_MESH.body, P, col);
    KM.imp(m, RW_MESH.head, P, col);
    const ja = -this.jaw * 0.55, hinge = [30, 64]; // Unterkiefer klappt um das Gelenk
    const PJ = { c: Keller.xf(P, hinge[0], hinge[1], 0), r: ja, y: P.y, m: P.m };
    const jawPart = { v: RW_MESH.jaw.v.map((v, i) => (i % 3 === 0 ? v - hinge[0] : i % 3 === 1 ? v - hinge[1] : v)), f: RW_MESH.jaw.f };
    KM.imp(m, jawPart, PJ, col);
    for (const [lx, lz] of [[-26, -16], [-26, 16], [22, -16], [22, 16]]) { // Beine: Chromrohr, Bürostuhlrolle
      KM.fbox(m, P, lx, 10, lz, 4, 8, 4, F(KM.CHROME));
      const PW = { c: Keller.xf(P, lx, 5, lz), r: this.wheel, y: P.y, m: P.m };
      KM.fbox(m, PW, 0, 0, 0, 10, 10, 5, F(KM.RUBBER)); KM.fbox(m, PW, 0, 0, 0, 4, 4, 5.6, F(KM.CHROME));
    }
    if (jam) for (let k = 0; k < 3; k++) KM.fbox(m, P, 40 + k * 7, 60 + ((this.timer * 0.6 + k * 5) % 6), 0, 5, 7, 14, F([236, 230, 210])); // Papier steckt im Maul fest
    // Netzkabel: vom Heck in sanftem Bogen zum Stecker (im Boss-Raum, Weltpunkt umgerechnet)
    const tail = Keller.xf(P, -40, 30, 0), [px, py] = this.plugPos(), ex = px - this.bx, ey = this.gy - py, N = 9;
    let prev = tail;
    for (let i = 1; i <= N; i++) {
      const u = i / N, x = tail[0] + (ex - tail[0]) * u, sag = Math.sin(Math.PI * u) * (14 + Math.abs(ex - tail[0]) * 0.05);
      const y = tail[1] + (ey - tail[1]) * u - sag, z = tail[2] * (1 - u), cur = [x, Math.max(1.5, y), z];
      PS2.beam(m, prev[0], prev[1], prev[2], cur[0], cur[1], cur[2], 2.4, 2.4, F([30, 30, 34]), { open: true }); prev = cur;
    }
    const PP = { c: [ex, ey, 0], r: 0, y: 0 }; KM.fbox(m, PP, 0, 0, 0, 9, 11, 9, F([46, 46, 52])); KM.fbox(m, PP, 0, 0, -5, 6, 6, 1, F([70, 70, 78]));
    return [m];
  }
  draw() { }
  drawLit(ctx) {
    const shake = this.state === 'jam' ? ((this.t >> 1) & 1) * 2 - 1 : this.dying && this.dying < 40 ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    const fy = Math.round(this.gy - W.cam.y), sx = Math.round(this.bx - W.cam.x);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(sx + this.face * 10, fy - 1, 52, 4, 0, 0, Math.PI * 2); ctx.fill(); // Schatten
    if (this.dying > 60) return;
    const B = Keller.blit(ctx, this, this.mesh(), this.bx, this.gy, shake);
    this.lastDraw = this.dying ? null : { s: { c: B.c, f: B.c, w: View.w, h: 208 }, x: W.cam.x, y: W.cam.y, flip: false };
  }
  lightUp(L, cx, cy) {
    if (this.dying > 60) return;
    const hx = this.bx + this.face * 48 - cx, hy = this.gy - 86 - cy;
    if (this.led > 0.1) L.push({ x: hx, y: hy, r: 18 + this.led * 18, c: [255, 60, 40], a: 0.45 * this.led });
    if (this.state === 'suck') L.push({ x: this.bx + this.face * 50 - cx, y: this.gy - 64 - cy, r: 34, c: [200, 220, 255], a: 0.35 });
    if (this.plug >= 1 && this.state === 'boot' && this.timer < 12) L.push({ x: this.sock.x + 6 - cx, y: this.sock.y + 7 - cy, r: 30, c: [180, 220, 255], a: 0.9 });
  }
  // ---------------- Verhalten ----------------
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.bx, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 140, tr(k), col); }
  vulnerable() { return !['off', 'plug', 'boot', 'howl'].includes(this.state); }
  hit(dmg, id) { // nur angekratzt – außer im Papierstau oder benommen an der Wand: dann doppelt
    const soft = this.state !== 'jam' && this.state !== 'bonk';
    const r = super.hit(dmg * (soft ? 0.4 : 1.8), id);
    if (r && !soft && !this.dying) { W.popup(this.cx, this.y - 6, tr('bossReissCrit'), '#fcd070'); }
    return r;
  }
  hitbox() { this.w = 112; this.h = 92; this.x = this.face > 0 ? this.bx - 40 : this.bx - 72; this.y = this.gy - 100; }
  clampX(x) { return clamp(x, this.ax + 70, this.ax + this.aw - 76); }
  spit() { // Konfetti: Fächer aus Papierstreifen im Bogen
    const n = this.ph2 ? 7 : 5, mx = this.bx + this.face * 66, my = this.gy - 66;
    for (let i = 0; i < n; i++) W.spawn(new EProj('page', mx, my, this.face * (0.9 + i * 0.45), -2.4 - (i % 2) * 0.5, 0.07, this.dmg - 1)); // nah und hoch bis weit und flach
    Audio8.sfx('shred', this.bx); for (let i = 0; i < 12; i++) W.spawn(new Particle(mx, my, this.face * rnd(0.5, 2.5), rnd(-2.5, -0.5), ['#f0ead8', '#e04848', '#4c7cd8', '#f8d048'][i % 4], 50, 1, 0.08));
  }
  update() {
    this.tick();
    const p = W.player, ease = (v, to, k) => v + (to - v) * k, sp = this.ph2 ? 1.35 : 1;
    if (this.dying) { // platzt in Konfetti
      this.led = ease(this.led, 0, 0.1); this.rev = ease(this.rev, 0, 0.05); this.jaw = ease(this.jaw, 1, 0.1);
      if (this.dying % 2 === 0) for (let i = 0; i < 4; i++) W.spawn(new Particle(this.bx + rnd(-50, 60), this.gy - rnd(20, 100), rnd(-2.4, 2.4), rnd(-3.4, -0.4), ['#f0ead8', '#e04848', '#4c7cd8', '#f8d048', '#58c070'][i % 5], 90, rnd(1, 2) | 0, 0.06));
      if (this.dying === 60) { W.shake = 24; W.flash = 10; Audio8.sfx('boom', this.bx); Audio8.sfx('shred', this.bx); for (let i = 0; i < 60; i++) W.spawn(new Particle(this.bx + rnd(-40, 50), this.gy - rnd(20, 90), rnd(-4, 4), rnd(-5, -1), ['#f0ead8', '#e04848', '#4c7cd8', '#f8d048', '#58c070'][i % 5], 120, 2, 0.07)); }
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2 && this.vulnerable()) { // Stufe 5: Partikelschnitt
      this.ph2 = true; W.flash = 8; W.shake = Math.max(W.shake, 14); Audio8.sfx('howl'); Audio8.tempo(1.1); Input.rumble(0.7, 0.6, 500);
      this.say('bossReissRage', '#fc7460');
    }
    const turn = this.state === 'idle' || this.state === 'wind';
    if (turn) this.face = p.cx < this.bx ? -1 : 1;
    this.yaw = ease(this.yaw, -0.35 * this.face, 0.14); // gespiegelt statt umgedreht: Fenster und Typenschild bleiben vorn
    this.hitbox();
    if (this.vulnerable() && this.state !== 'jam' && this.state !== 'bonk') this.touch();
    if (this.state === 'off') { // stromlos in der Ecke; der Held kommt herein
      this.led = 0;
      if (this.timer > (this.fast ? 16 : 50)) { this.go('plug'); Audio8.sfx('creak', this.sock.x); }
    } else if (this.state === 'plug') { // Stecker kriecht zur Steckdose
      this.plug = Math.min(1, this.timer / (this.fast ? 36 : 70));
      if (this.timer % 12 === 0) Audio8.sfx('stepWet', this.sock.x);
      if (this.plug >= 1) { this.go('boot'); Audio8.sfx('zap', this.sock.x); W.flash = 4; W.shake = 6; for (let i = 0; i < 10; i++) W.spawn(new Particle(this.sock.x + 6, this.sock.y + 7, rnd(-2, 2), rnd(-2, 0.5), i % 2 ? '#c8e8ff' : '#fcf4c0', 20, 1, 0.1)); }
    } else if (this.state === 'boot') { // LEDs flackern, der Motor heult hoch, Kiefer klappert
      this.led = this.timer < 40 ? ((this.timer >> 2) & 1 ? 1 : 0.1) : ease(this.led, 1, 0.1);
      this.rev = Math.min(1, this.timer / 70); this.jaw = Math.abs(Math.sin(this.timer * 0.5)) * 0.4 * this.rev;
      if (this.timer % 8 === 0) Audio8.sfx('chug', this.bx);
      if (this.timer > (this.fast ? 50 : 80)) { this.go('howl'); this.howl(); }
    } else if (this.state === 'howl') { // Kopf hoch, Maul auf, Heulen – danach Namensband, Geplänkel, Kampf
      this.jaw = ease(this.jaw, 1, 0.2);
      if (this.timer === 50) { this.holdIntro = false; Audio8.play(this.music); }
      if (this.timer > 90) { this.go('idle'); this.jaw = 0; }
    } else if (this.state === 'idle') { // rollt auf den Helden zu, Kiefer klappert
      this.rev = ease(this.rev, 0.35, 0.05); this.jaw = Math.abs(Math.sin(this.t * 0.25)) * 0.25;
      const want = this.clampX(p.cx - this.face * 120), d = want - this.bx; this.vx = clamp(d * 0.03, -1.1 * sp, 1.1 * sp); this.bx += this.vx; this.wheel -= this.vx * 0.2 * this.face;
      if (this.timer > (this.ph2 ? 50 : 80)) {
        const r = Math.random();
        if (r < 0.4) { this.go('suck'); Audio8.sfx('hiss', this.bx); }
        else if (r < 0.7) this.go('spit');
        else { this.go('wind'); this.dashes = this.ph2 ? 2 : 1; }
      }
    } else if (this.state === 'suck') { // SCHREDDERN: Maul auf, saugt an – drei Ordner und er hat Papierstau
      this.jaw = ease(this.jaw, 1, 0.15); this.rev = ease(this.rev, 1, 0.08);
      const mx = this.bx + this.face * 66, my = this.gy - 64;
      if (p.alive && this.timer > 14 && this.timer < 120) {
        const dx = mx - p.cx; if (Math.abs(dx) < 260) p.x += Math.sign(dx) * (this.ph2 ? 0.75 : 0.6) * (1 - Math.abs(dx) / 300); // Sog
        if (Math.abs(dx) < 22 && Math.abs(p.cy - my) < 40) { p.hurt(this.dmg, mx); }
      }
      if (this.timer % 3 === 0) { const sx = mx + this.face * rnd(30, 160), sy = my + rnd(-40, 30); W.spawn(new Particle(sx, sy, (mx - sx) / 18, (my - sy) / 18, '#f0ead8', 18, 1, 0)); } // Papier wird angesaugt
      if (this.timer === 60) this.feed();
      if (this.timer % 20 === 0) Audio8.sfx('shred', this.bx);
      if (this.timer > 130) { this.jaw = 0.2; if (this.eat >= 3) { this.go('jam'); this.eat = 0; this.say('bossReissJam', '#fcd070'); Audio8.sfx('crumble', this.bx); } else this.go('idle'); }
    } else if (this.state === 'spit') { // KONFETTI
      this.jaw = this.timer < 20 ? ease(this.jaw, 0.8, 0.2) : ease(this.jaw, 0.2, 0.1);
      if (this.timer === 22 || (this.ph2 && this.timer === 46)) this.spit();
      if (this.timer > 70) this.go('idle');
    } else if (this.state === 'wind') { // Anlauf: Rollen drehen durch, Motor heult
      this.rev = ease(this.rev, 1, 0.1); this.wheel += 0.6 * this.face; this.jaw = 0.5;
      if (this.timer % 6 === 0) W.spawn(new Particle(this.bx - this.face * 30, this.gy - 2, -this.face * rnd(0.5, 1.5), -rnd(0.2, 0.8), '#8c8070', 20, 1, 0.05));
      if (this.timer > 30) { this.go('charge'); Audio8.sfx('whoosh', this.bx); }
    } else if (this.state === 'charge') { // ANSTURM quer durch die Kammer
      this.vx = this.face * 4.2 * sp; this.bx += this.vx; this.wheel -= this.vx * 0.25 * this.face;
      if (this.timer % 4 === 0) W.spawn(new Particle(this.bx - this.face * 50, this.gy - rnd(2, 14), -this.face * rnd(0.5, 2), -rnd(0.5, 1.5), ['#f0ead8', '#e04848', '#4c7cd8'][this.timer % 3], 30, 1, 0.08));
      const lim = this.face > 0 ? this.ax + this.aw - 76 : this.ax + 70;
      if ((this.face > 0 && this.bx >= lim) || (this.face < 0 && this.bx <= lim)) {
        this.bx = lim; W.shake = 14; Audio8.sfx('boom', this.bx); Input.rumble(0.7, 0.5, 300);
        if (--this.dashes > 0) { this.face = -this.face; this.go('wind'); this.timer = 18; } else { this.go('bonk'); this.say('bossReissBonk', '#c8e8ff'); }
      }
    } else if (this.state === 'bonk') { // benommen an der Wand: treffbar
      this.rev = ease(this.rev, 0, 0.1); this.jaw = 0.6; this.led = 0.4 + 0.3 * Math.sin(this.timer * 0.4);
      if (this.timer > 70) { this.go('idle'); this.led = 1; }
    } else if (this.state === 'jam') { // PAPIERSTAU: raucht und klemmt – doppelter Schaden
      this.rev = ease(this.rev, 0.1, 0.1); this.jaw = 0.75 + Math.sin(this.timer * 0.9) * 0.05;
      if (this.timer % 6 === 0) W.spawn(new Particle(this.bx + this.face * rnd(30, 60), this.gy - rnd(70, 90), rnd(-0.3, 0.3), -rnd(0.6, 1.2), this.timer % 12 ? '#9c9ca8' : '#5c5c68', 50, 2, -0.01)); // Rauch
      if (this.timer % 30 === 0) Audio8.sfx('crumble', this.bx);
      if (this.timer > (this.ph2 ? 130 : 170)) { this.go('idle'); Audio8.sfx('chug', this.bx); }
    }
  }
  howl() { // ElevenLabs-Probe: Schredder heult wie ein Wolf; die Wände wackeln ein wenig
    Audio8.sfx('howl');
    W.bossEntrance(this, { sfx: null, music: false });
    W.shake = 22; W.wobble = 4; Input.rumble(0.9, 0.7, 1000);
    this.say('bossReissShout', '#f8b800');
    if (Castle.setFlag) Castle.setFlag('reiss_seen');
  }
  feed() { // ein Leitz-Ordner fliegt aus dem Regal ins Maul: Mampf
    this.eat++;
    const mx = this.bx + this.face * 66, my = this.gy - 64;
    W.spawn(new ReissOrdner(this.ax + (this.face > 0 ? this.aw - 30 : 30), this.gy - 120, mx, my));
    W.popup(mx, my - 30, this.eat + '/3', '#f0ead8');
  }
}

class ReissOrdner extends Ent { // fliegt aus dem Regal ins Maul (nur Optik)
  constructor(x, y, tx, ty) { super(x, y, 14, 18); this.kind = 'fx'; this.x0 = x; this.y0 = y; this.tx = tx; this.ty = ty; this.col = ['#3c6cc8', '#c83c3c', '#3c9c58', '#e8c040'][Math.floor(Math.random() * 4)]; }
  update() {
    this.t++; const k = Math.min(1, this.t / 26), e = k * k;
    this.x = this.x0 + (this.tx - this.x0) * e - 7; this.y = this.y0 + (this.ty - this.y0) * e - Math.sin(Math.PI * k) * 30 - 9;
    if (k >= 1) { this.dead = true; Audio8.sfx('shred', this.tx); for (let i = 0; i < 10; i++) W.spawn(new Particle(this.tx, this.ty + 20, rnd(-1, 1), rnd(0.5, 2), i % 2 ? '#f0ead8' : this.col, 40, 1, 0.08)); }
  }
  draw(ctx) {
    const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
    ctx.save(); ctx.translate(sx + 7, sy + 9); ctx.rotate(this.t * 0.35);
    ctx.fillStyle = '#100c14'; ctx.fillRect(-8, -10, 16, 20); ctx.fillStyle = this.col; ctx.fillRect(-7, -9, 14, 18);
    ctx.fillStyle = '#f0ead8'; ctx.fillRect(-4, -6, 8, 5); ctx.fillStyle = '#1c1820'; ctx.fillRect(-2, 3, 4, 4);
    ctx.restore();
  }
}
