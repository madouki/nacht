// Hauptpoststelle (Schloss-Modus, rechts an der Registratur): Sortierhalle mit Förderbändern über dem Briefsackschacht, ein
// Paketlager mit schiebbaren Paketen und die Frankierstelle mit der Frankiermaschine.
// FÖRDERBAND: liegt auf einer Plattformreihe ('='), läuft in eine Richtung und nimmt mit, wer draufsteht (gegen die Laufrichtung
// muss man rennen). PAKET: 2×2 Kacheln, unsichtbar fest ('G'); wer dagegen drückt, schiebt es kachelweise, ohne Halt fällt es,
// stürzt es in den Schacht, kommt es nach kurzer Zeit an seinen Platz zurück („RETOUR“). Gegner: BRIEF (flatternder Umschlag mit
// Luftpoststreifen, segelt im Wellenflug auf den Helden zu) und NACHNAHME (ein Paket, das aufklappt und mit Zähnen hüpft).
// FRANKIERMASCHINE (Zwischengegner, PS2-3D): grün emaillierte Gusseisenmaschine mit Druckwalze, Zählwerk, Manometer-Augen und
// Handkurbel. ROLLSTEMPEL (die Walze rollt durch die Stelle und stempelt PORTO auf den Boden – drüberspringen; solange sie fort
// ist, liegt das Druckwerk offen: doppelter Schaden), BRIEFSALVE (Umschläge im Bogen), FRANKIEREN (springt auf den Helden und
// schickt beim Aufprall zwei Bodenwellen los, danach steckt sie kurz fest). Jeder Treffer kostet obendrein NACHPORTO (Gold).
'use strict';

const Post = (() => {
  // ---------------- Förderband ----------------
  class Band extends Ent { // d: { x0, x1, row: Reihe der Bandkacheln (Oberfläche), dir, v }
    constructor(d) { super(d.x0 * T, d.row * T, (d.x1 - d.x0 + 1) * T, 6); this.kind = 'prop'; this.dir = d.dir; this.v = d.v || 0.75; this.ph = 0; }
    update() {
      this.t++; this.ph += this.dir * this.v;
      const p = W.player;
      if (p.alive && p.state === 'normal' && p.onGround && Math.abs(p.feet - this.y) < 1.5 && p.x + p.w > this.x && p.x < this.x + this.w) Phys.moveX(p, this.dir * this.v);
      for (const e of W.ents) if (e instanceof Paket && !e.mv && Math.abs((e.r + 1) * T - this.y) < 1 && e.c * T + 2 * T > this.x && e.c * T < this.x + this.w) e.nudge(this.dir);
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = this.w;
      if (sx > View.w + 20 || sx + w < -20) return;
      ctx.fillStyle = '#2c2a30'; ctx.fillRect(sx, sy - 1, w, 6);                                      // Gummiband
      ctx.fillStyle = '#5c5864'; for (let x = ((this.ph % 10) + 10) % 10; x < w; x += 10) ctx.fillRect(sx + x, sy, 4, 1); // Rillen wandern mit
      ctx.fillStyle = '#e8c040'; const ch = this.dir > 0 ? [0, 1, 2, 1, 0] : [2, 1, 0, 1, 2]; // Pfeile in Laufrichtung
      for (let x = ((this.ph * 0.5 % 24) + 24) % 24; x < w - 4; x += 24) for (let k = 0; k < 5; k++) ctx.fillRect(sx + x + ch[k], sy + 1 + k * 0.5, 1, 1);
      for (const ex of [sx - 2, sx + w - 4]) { ctx.fillStyle = '#7c7884'; ctx.fillRect(ex, sy - 2, 6, 7); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(ex + 2, sy + 1, 2, 2); } // Rollen
      ctx.fillStyle = '#3c3a44'; ctx.fillRect(sx, sy + 5, w, 3); ctx.fillStyle = '#585664'; for (let x = 4; x < w; x += 16) ctx.fillRect(sx + x, sy + 8, 3, 6); // Gestell
    }
  }

  // ---------------- Paket (schiebbar, fällt) ----------------
  class Paket extends Ent { // d: { x: linke Spalte, row: untere Reihe }
    constructor(d) {
      super(d.x * T, (d.row - 1) * T, 2 * T, 2 * T); this.kind = 'prop';
      this.c = d.x; this.r = d.row; this.home = [d.x, d.row]; this.mv = null; this.push = 0; this.gone = 0; this.seed = (d.x * 7 + d.row) % 4;
      this.set('G');
    }
    cells(c, r) { return [[c, r - 1], [c + 1, r - 1], [c, r], [c + 1, r]]; }
    set(ch) { for (const [x, y] of this.cells(this.c, this.r)) if (y >= 0 && y < W.room.h) W.room.grid[y][x] = ch; }
    freeCol(c, r) { return [r - 1, r].every(y => y < 0 || y >= W.room.h || !SOLID.has(W.room.grid[y][c])); }
    freeRow(c, r) { return [c, c + 1].every(x => r >= W.room.h || !SOLID.has(W.room.grid[r][x])); }
    start(dx, dy) { // Zielkacheln sofort belegen, alte erst am Ende freigeben
      const nc = this.c + dx, nr = this.r + dy;
      this.mv = { dx, dy, k: 0, from: this.cells(this.c, this.r) };
      this.c = nc; this.r = nr;
      for (const [x, y] of this.cells(nc, nr)) if (y >= 0 && y < W.room.h) W.room.grid[y][x] = 'G';
    }
    nudge(dir) { if (!this.mv && this.freeCol(dir > 0 ? this.c + 2 : this.c - 1, this.r)) this.start(dir, 0); } // vom Förderband
    update() {
      this.t++;
      if (this.gone > 0) { if (--this.gone === 0) { [this.c, this.r] = this.home; this.set('G'); this.x = this.c * T; this.y = (this.r - 1) * T; W.popup(this.cx, this.y - 6, tr('paketBack'), '#f0ead8'); Audio8.sfx('door', this.cx); } return; }
      const p = W.player;
      if (this.mv) {
        const m = this.mv, sp = m.dy ? 0.25 : 0.125; m.k = Math.min(1, m.k + sp);
        const px = (this.c - m.dx * (1 - m.k)) * T, py = (this.r - 1 - m.dy * (1 - m.k)) * T;
        if (p.alive && p.onGround && Math.abs(p.feet - this.y) < 2 && p.x + p.w > this.x && p.x < this.x + this.w) { Phys.moveX(p, px - this.x); if (m.dy) p.y += py - this.y; } // Mitfahrer
        this.x = px; this.y = py;
        if (m.k >= 1) {
          const now = new Set(this.cells(this.c, this.r).map(q => q.join()));
          for (const [x, y] of m.from) if (!now.has(x + ',' + y) && y >= 0 && y < W.room.h) W.room.grid[y][x] = '.';
          this.mv = null; if (m.dy) { Audio8.sfx('klack', this.cx); W.dust(this.cx, this.y + 2 * T, 3); }
        }
        return;
      }
      if (this.r + 1 >= W.room.h) { this.set('.'); this.gone = 90; this.y = W.room.h * T + 40; Audio8.sfx('crumble', this.cx); return; } // in den Schacht gestürzt
      if (this.freeRow(this.c, this.r + 1)) return this.start(0, 1);                                                     // fällt
      // Schieben: Held drückt seitlich dagegen
      const I = Input.held, side = p.alive && p.onGround && p.state === 'normal' && p.feet > this.y + 6 && p.y < this.y + 2 * T - 4;
      const right = side && I.right && p.x + p.w >= this.x - 1 && p.x + p.w <= this.x + 3, left = side && I.left && p.x <= this.x + 2 * T + 1 && p.x >= this.x + 2 * T - 3;
      if (right || left) { if (++this.push > 8) { const dir = right ? 1 : -1; if (this.freeCol(dir > 0 ? this.c + 2 : this.c - 1, this.r)) { this.start(dir, 0); Audio8.sfx('chug', this.cx); } this.push = 0; } } else this.push = 0;
    }
    draw(ctx) {
      if (this.gone) return;
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      if (sx > View.w + 8 || sx < -40) return;
      ctx.fillStyle = '#2c1c0c'; ctx.fillRect(sx, sy, 32, 32); ctx.fillStyle = '#b07c44'; ctx.fillRect(sx + 1, sy + 1, 30, 30);       // Packpapier
      ctx.fillStyle = '#c8945c'; ctx.fillRect(sx + 1, sy + 1, 30, 3); ctx.fillStyle = '#8c5c2c'; ctx.fillRect(sx + 1, sy + 28, 30, 3);
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(sx + 15, sy + 1, 2, 30); ctx.fillRect(sx + 1, sy + 15, 30, 2);                            // Paketschnur
      ctx.fillStyle = '#f8f4e8'; ctx.fillRect(sx + 4, sy + 5, 9, 7); ctx.fillStyle = '#5c5c78'; ctx.fillRect(sx + 5, sy + 7, 7, 1); ctx.fillRect(sx + 5, sy + 9, 5, 1); // Adresse
      ctx.fillStyle = ['#c83c3c', '#3c6cc8', '#3c9c58', '#e8a030'][this.seed]; ctx.fillRect(sx + 21, sy + 4, 6, 7); ctx.fillStyle = '#f8f4e8'; ctx.fillRect(sx + 22, sy + 5, 4, 5); // Briefmarke
      ctx.fillStyle = '#c82c2c'; ctx.fillRect(sx + 18, sy + 20, 10, 6); ctx.fillStyle = '#f8f4e8'; ctx.fillRect(sx + 19, sy + 22, 8, 2);   // Zerbrechlich-Etikett
    }
  }

  // ---------------- Brief (fliegender Umschlag) ----------------
  class Brief extends Enemy {
    constructor(x, y, o = {}) { super(x * T + 1, y * T + 3, 14, 10, 2, 1, 150); this.base = y * T + 3; this.ph = (x * 1.7) % 6; this.face = o.dir || -1; }
    update() {
      super.update();
      const p = W.player, dx = p.cx - this.cx;
      this.ph += 0.06;
      if (p.alive && Math.abs(dx) < 220) { this.face = Math.sign(dx) || this.face; this.x += clamp(dx * 0.012, -0.85, 0.85); this.base += clamp(p.cy - 8 - this.base, -0.35, 0.35); }
      this.y = this.base + Math.sin(this.ph * 1.7) * 9;
      this.touch();
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), fl = (this.t >> 3) & 1, w = this.flashT > 0;
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx - 1, sy - 1, 16, 12);
      ctx.fillStyle = w ? '#fcfcfc' : '#f4f0e4'; ctx.fillRect(sx, sy, 14, 10);
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#2c5cc8' : '#c82c2c'; ctx.fillRect(sx + k * 2, sy, 2, 1); ctx.fillRect(sx + k * 2, sy + 9, 2, 1); } // Luftpoststreifen
      ctx.fillStyle = '#c8c0b0'; if (fl) { ctx.fillRect(sx + 1, sy + 1, 12, 1); ctx.fillRect(sx + 3, sy + 2, 8, 1); ctx.fillRect(sx + 5, sy + 3, 4, 1); } else { ctx.fillRect(sx + 5, sy - 3, 4, 1); ctx.fillRect(sx + 3, sy - 2, 8, 1); ctx.fillRect(sx + 1, sy - 1, 12, 1); } // Klappe flattert
      ctx.fillStyle = '#a81c24'; ctx.fillRect(sx + 6, sy + 4, 2, 2); ctx.fillStyle = '#3c9c58'; ctx.fillRect(sx + 10, sy + 5, 3, 3);   // Siegel, Marke
      this.lastDraw = null;
    }
    kill(silent) { super.kill(silent); if (!silent) { W.popup(this.cx, this.y - 8, tr('briefDead'), '#f0ead8'); for (let i = 0; i < 6; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.4, 1.4), rnd(-1.6, 0), i % 2 ? '#f4f0e4' : '#2c5cc8', 40, 1, 0.05)); } }
  }

  // ---------------- Nachnahme (Paket mit Zähnen) ----------------
  class Nachnahme extends Enemy {
    constructor(x, y) { super(x * T + 2, (y + 1) * T - 24, 28, 24, 4, 2, 320); this.st = 'sleep'; this.vx = 0; this.vy = 0; this.tm = 0; this.open = 0; }
    update() {
      super.update(); this.physics();
      const p = W.player, dx = p.cx - this.cx;
      this.tm++;
      if (this.st === 'sleep') { if (p.alive && Math.abs(dx) < 70 && Math.abs(p.cy - this.cy) < 50) { this.st = 'wake'; this.tm = 0; W.popup(this.cx, this.y - 6, '!', '#f8b800'); Audio8.sfx('creak', this.cx); } return; }
      this.open = Math.min(1, this.open + 0.15);
      if (this.onGround) { this.vx *= 0.7; if (this.tm > (this.st === 'wake' ? 30 : 46)) { this.st = 'hop'; this.tm = 0; this.face = Math.sign(dx) || 1; this.vx = this.face * 1.6; this.vy = -3.6; Audio8.sfx('klack2', this.cx); } }
      this.touch();
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = this.flashT > 0, o = this.open, lid = Math.round(o * 7);
      ctx.fillStyle = '#2c1c0c'; ctx.fillRect(sx - 1, sy - 1, 30, 26);
      ctx.fillStyle = w ? '#fcfcfc' : '#a87440'; ctx.fillRect(sx, sy + 4, 28, 20);
      if (o > 0.1) { // aufgeklappt: Zähne, Augen
        ctx.fillStyle = '#1c0c08'; ctx.fillRect(sx + 2, sy + 4, 24, 6); ctx.fillStyle = '#f8f4e8'; for (let k = 0; k < 6; k++) { ctx.fillRect(sx + 3 + k * 4, sy + 4, 2, 3); ctx.fillRect(sx + 5 + k * 4, sy + 8, 2, 2); }
        ctx.fillStyle = '#fce040'; ctx.fillRect(sx + 6, sy + 12, 3, 3); ctx.fillRect(sx + 19, sy + 12, 3, 3); ctx.fillStyle = '#1c0c08'; ctx.fillRect(sx + 7 + (this.face > 0 ? 1 : 0), sy + 13, 1, 1); ctx.fillRect(sx + 20 + (this.face > 0 ? 1 : 0), sy + 13, 1, 1);
      }
      ctx.fillStyle = w ? '#fcfcfc' : '#c08c54'; ctx.fillRect(sx - 2, sy + 4 - lid - 3, 14, 3); ctx.fillRect(sx + 16, sy + 4 - lid - 3, 14, 3); // Deckelklappen
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(sx + 13, sy + 4, 2, 20);
      ctx.fillStyle = '#f8f4e8'; ctx.fillRect(sx + 3, sy + 17, 22, 5); ctx.fillStyle = '#c82c2c'; ctx.fillRect(sx + 4, sy + 18, 20, 1); ctx.fillRect(sx + 4, sy + 20, 14, 1); // NACHNAHME-Zettel
      this.lastDraw = null;
    }
    kill(silent) { super.kill(silent); if (!silent) { W.popup(this.cx, this.y - 8, tr('nachDead'), '#f8b800'); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.6, 1.6), rnd(-2, -0.4), i % 2 ? '#a87440' : '#e8dcc0', 40, 2, 0.08)); } }
  }

  // ---------------- Frankiermaschine: Teile ----------------
  class Walze extends Ent { // Druckwalze rollt durch die Stelle und stempelt PORTO auf den Boden
    constructor(boss, dir, sp) { super(boss.bx + dir * 40 - 13, boss.gy - 26, 26, 26); this.kind = 'eproj'; this.b = boss; this.dir = dir; this.sp = sp; this.a = 0; this.back = false; this.mark = 0; this.dmg = boss.dmg; }
    update() {
      this.t++;
      const b = this.b, lo = b.ax + 14, hi = b.ax + b.aw - 14;
      this.x += this.dir * this.sp; this.a += this.dir * this.sp / 13;
      if (!this.back && ((this.dir > 0 && this.x + this.w >= hi) || (this.dir < 0 && this.x <= lo))) { this.back = true; this.dir = -this.dir; W.shake = Math.max(W.shake, 6); Audio8.sfx('boom', this.cx); }
      if ((this.mark += this.sp) > 26) { this.mark = 0; b.marks.push({ x: this.cx, t: 360 }); Audio8.sfx('stamp', this.cx); }
      const p = W.player; if (p.alive && Phys.overlap(this, p)) { if (b.porto(p)) p.hurt(this.dmg, this.cx); }
      if (this.back && Math.abs(this.cx - b.bx - (b.face * 40)) < 6) { this.dead = true; b.drum = true; b.go('idle'); Audio8.sfx('klack', this.cx); }
      if (b.dead || b.dying) this.dead = true;
    }
    draw(ctx) {
      const cx = Math.round(this.cx - W.cam.x), cy = Math.round(this.cy - W.cam.y);
      ctx.fillStyle = '#100c14'; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3c5c48'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 6; k++) { const a = this.a + k * Math.PI / 3; ctx.fillStyle = k % 2 ? '#c81c2c' : '#e8c070'; ctx.fillRect(cx + Math.cos(a) * 10 - 2, cy + Math.sin(a) * 10 - 2, 4, 4); } // Stempelplatten
      ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c3c10'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  }
  class Welle extends Ent { // Bodenwelle nach dem Aufprall
    constructor(x, gy, dir, boss) { super(x - 6, gy - 12, 12, 12); this.kind = 'eproj'; this.dir = dir; this.b = boss; this.dmg = boss.dmg; }
    update() {
      this.t++; this.x += this.dir * 3.2;
      const b = this.b; if (this.x < b.ax + 8 || this.x > b.ax + b.aw - 8 || this.t > 140) this.dead = true;
      const p = W.player; if (p.alive && p.onGround && Phys.overlap(this, p)) { if (b.porto(p)) p.hurt(this.dmg, this.cx); }
      if (this.t % 3 === 0) W.spawn(new Particle(this.cx, this.y + 10, rnd(-0.4, 0.4), rnd(-1.6, -0.6), this.t % 6 ? '#c81c2c' : '#f0ead8', 18, 1, 0.1));
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), h = 6 + Math.sin(this.t * 0.6) * 3;
      ctx.fillStyle = 'rgba(200,28,44,0.85)'; ctx.fillRect(sx, sy + 12 - h, 12, h); ctx.fillStyle = '#fcd0c0'; ctx.fillRect(sx + 2, sy + 12 - h, 8, 1);
    }
  }

  function make(d) {
    if (d.k === 'band') return new Band(d);
    if (d.k === 'paket') return new Paket(d);
    return new Ent(0, 0, 1, 1);
  }
  return { make, Band, Paket, Brief, Nachnahme, Walze, Welle };
})();

class Frankiermaschine extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw - 120, gy - 80, 80, 74, 52, 3);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 14000; this.nameKey = 'bossFrank'; this.music = 'amtsmarsch';
    this.bx = ax + aw - 110; this.by = 0; this.vy = 0; this.face = -1; this.yaw = 0.4; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.ph2 = false; this.drum = true; this.drumA = 0; this.crank = 0; this.count = 0; this.marks = []; this.buf = null; this.salvo = 0;
  }
  porto(p) { // Treffer kostet Nachporto (Gold) – nur wenn der Held gerade verwundbar ist
    if (p.inv > 0 || !p.alive) return false;
    const g = Math.min(W.score, this.ph2 ? 200 : 100);
    if (g > 0) { W.score -= g; W.popup(p.cx, p.y - 18, tr('portoHit', g), '#fc7460'); Audio8.sfx('money', p.cx); }
    return true;
  }
  mesh() { // gespiegelt statt umgedreht (P.m = Blickrichtung): Zählwerk, Manometer und Walze vorn, Kurbel und Typenschild zum Betrachter
    const K = Keller, m = PS2.mesh(), fl = this.flashT > 0, F = (c) => (fl ? [240, 240, 240] : c);
    const GREEN = [44, 100, 72], GREENL = [64, 132, 96], GREEND = [26, 60, 44], GOLD = [236, 194, 86], GOLDD = [176, 132, 50], IRON = [52, 52, 60], CREAM = [242, 234, 212], RED = [200, 30, 42], BLACK = [20, 18, 24];
    const P = { c: [0, this.by, 0], r: this.state === 'stuck' ? Math.sin(this.timer * 0.7) * 0.03 : 0, y: this.yaw, m: this.face };
    const Q = (c, r) => ({ c, r, y: P.y, m: P.m }), at = (x, y, z) => Keller.xf(P, x, y, z);
    // Sockel mit Klauenfüßen, Gehäuse mit gewölbter Haube (drei Stufen), Goldkanten
    K.fbox(m, P, 0, 12, 0, 86, 8, 48, F(GREEND)); K.fbox(m, P, 0, 16.5, 0, 88, 1.5, 50, F(GOLDD));
    for (const [lx, lz] of [[-37, -19], [-37, 19], [37, -19], [37, 19]]) { K.fbox(m, P, lx, 5, lz, 9, 8, 9, F(GOLD)); K.fbox(m, P, lx + 3, 1.5, lz, 5, 3, 10, F(GOLDD)); }
    K.fbox(m, P, -6, 40, 0, 64, 44, 40, F(GREEN));
    K.fbox(m, P, -6, 63.5, 0, 68, 3, 44, F(GOLD));
    K.fbox(m, P, -8, 71, 0, 58, 12, 38, F(GREEND)); K.fbox(m, P, -8, 79, 0, 50, 4, 32, F(GREEN)); K.fbox(m, P, -8, 82.5, 0, 40, 3, 26, F(GREENL));
    // Seitenwand zum Betrachter: Goldrahmen, Typenschild, Posthorn-Emblem, Kurbel
    K.fbox(m, P, -6, 54, -20.4, 56, 1.4, 0.8, F(GOLD)); K.fbox(m, P, -6, 22, -20.4, 56, 1.4, 0.8, F(GOLD));
    K.fbox(m, P, -33.4, 38, -20.4, 1.4, 32, 0.8, F(GOLD)); K.fbox(m, P, 21.4, 38, -20.4, 1.4, 32, 0.8, F(GOLD));
    K.fbox(m, P, 4, 44, -20.7, 22, 8, 0.8, F(CREAM)); K.fbox(m, P, 4, 45, -21.1, 16, 1.6, 0.5, F(RED)); K.fbox(m, P, 4, 42, -21.1, 12, 1, 0.5, F(BLACK));
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; K.fbox(m, P, -10 + Math.cos(a) * 6, 32 + Math.sin(a) * 6, -20.8, 2.6, 2.6, 0.8, F(GOLD)); } // Posthorn: Ring
    K.fbox(m, P, -2, 30, -20.8, 10, 2, 0.8, F(GOLD)); K.fbox(m, P, 4, 30, -20.8, 4, 5, 0.8, F(GOLD));                  // Rohr, Schalltrichter
    const PC = Q(at(-24, 40, -23), this.crank);
    for (let k = 0; k < 4; k++) K.fbox(m, Q(PC.c, this.crank + k * Math.PI / 2), 0, 5, 0, 2, 10, 2, F(IRON));
    K.fbox(m, PC, 0, 0, 0, 5, 5, 4, F(GOLD)); K.fbox(m, PC, 0, 10, -2.5, 3, 3, 5, F(RED));
    // Vorderseite: Zählwerk mit vier Ziffernrollen, darüber zwei Manometer-Augen, unten die Druckwalze
    K.fbox(m, P, 26.6, 66, 0, 1.4, 10, 30, F(BLACK)); K.fbox(m, P, 26.2, 66, 0, 1, 12, 32, F(GOLD));
    for (let k = 0; k < 4; k++) { const dgt = Math.floor(this.count / Math.pow(10, 3 - k)) % 10; K.fbox(m, P, 27.4, 66, -10.5 + k * 7, 0.6, 7, 5.5, F(CREAM)); K.fbox(m, P, 27.8, 64 + (dgt % 5) * 0.9, -10.5 + k * 7, 0.4, 1.2, 3.5, F(BLACK)); }
    for (const z of [-1, 1]) {
      K.fbox(m, P, 21, 79, z * 9, 6, 11, 11, F(GOLD)); K.fbox(m, P, 24.2, 79, z * 9, 0.6, 9, 9, F(CREAM));
      const na = this.state === 'stuck' ? Math.sin(this.t) * 1.2 : (this.ph2 ? 1.0 : 0.3) + Math.sin(this.t * 0.2) * 0.3;
      K.fbox(m, { c: at(24.7, 79, z * 9), r: 0, y: P.y + Math.PI / 2 * P.m, m: 1 }, 0, 0, 0, 0.5, 0.5, 0.5, F(BLACK));
      K.fbox(m, Q(at(24.8, 79, z * 9), na), 0, 2, 0, 0.6, 4.2, 1.2, F(RED));
    }
    // Frankierhebel oben: Goldstange mit rotem Knauf, wippt beim Stempeln
    const la = this.state === 'jump' || this.state === 'stuck' ? -0.9 : -0.35 + Math.sin(this.t * 0.08) * 0.08;
    const PL = Q(at(-20, 84, 12), la); K.fbox(m, PL, 14, 0, 0, 28, 2.4, 2.4, F(GOLD)); K.fbox(m, PL, 29, 0, 0, 5, 5, 5, F(RED));
    for (let k = 0; k < 4; k++) K.fbox(m, P, -26 + k * 3.5, 86 + k * 1.6, -6, 18, 1.6, 20, F(k % 2 ? CREAM : [250, 246, 236])); // Briefstapel
    for (let k = 0; k < 3; k++) K.fbox(m, Q(at(24, 58 + k * 2.5, -8 + k * 8), 0.3 + k * 0.1), 4, 0, 0, 10, 1.4, 7, F(CREAM)); // Briefe im Einzug
    if (this.drum) { // Druckwalze: zwölf Stäbe im Kreis, drei davon mit roter Gummiplatte, goldene Achskappen
      for (let k = 0; k < 12; k++) { const a = this.drumA + k * Math.PI / 6; K.fbox(m, Q(at(40 + Math.cos(a) * 10, 26 + Math.sin(a) * 10, 0), a), 0, 0, 0, 3.6, 6, 30, F(k % 4 === 0 ? RED : IRON)); }
      K.fbox(m, P, 40, 26, -16, 8, 8, 2, F(GOLD)); K.fbox(m, P, 40, 26, 16, 8, 8, 2, F(GOLD));
    } else K.fbox(m, P, 36, 26, 0, 6, 22, 30, F(this.t & 4 ? [255, 120, 80] : [160, 40, 30]));               // offenes Druckwerk glüht
    K.fbox(m, P, 33, 26, -17.5, 10, 26, 3, F(GREEND)); K.fbox(m, P, 33, 26, 17.5, 10, 26, 3, F(GREEND));      // Walzenbock
    return [m];
  }
  draw() { }
  drawLit(ctx) {
    const fy = Math.round(this.gy - W.cam.y);
    for (const mk of this.marks) { // PORTO-Stempel auf dem Boden
      const a = Math.min(1, mk.t / 60) * 0.7, x = Math.round(mk.x - W.cam.x);
      ctx.fillStyle = `rgba(200,24,40,${a.toFixed(2)})`; ctx.fillRect(x - 10, fy - 2, 20, 2); ctx.fillRect(x - 10, fy - 4, 2, 2); ctx.fillRect(x + 8, fy - 4, 2, 2);
    }
    const sx = Math.round(this.bx - W.cam.x); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(sx, fy - 1, 48 - Math.min(30, this.by * 0.2), 4, 0, 0, Math.PI * 2); ctx.fill();
    if (this.dying > 70) return;
    const sh = this.dying && this.dying < 50 ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    const B = Keller.blit(ctx, this, this.mesh(), this.bx, this.gy, sh);
    this.lastDraw = this.dying ? null : { s: { c: B.c, f: B.c, w: View.w, h: 208 }, x: W.cam.x, y: W.cam.y, flip: false };
  }
  lightUp(L, cx, cy) {
    if (this.dying > 70) return;
    L.push({ x: this.bx + this.face * 26 - cx, y: this.gy - 74 - this.by - cy, r: 26, c: this.ph2 ? [255, 90, 60] : [255, 220, 150], a: 0.35 });
    if (!this.drum) L.push({ x: this.bx + this.face * 36 - cx, y: this.gy - 26 - this.by - cy, r: 30, c: [255, 90, 60], a: 0.5 });
  }
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.bx, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 130, tr(k), col); }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { // gepanzert – offen (Walze fort) oder steckend nach dem Sprung: doppelt
    const soft = this.drum && this.state !== 'stuck';
    const r = super.hit(dmg * (soft ? 0.45 : 1.7), id);
    if (r && !soft && !this.dying) W.popup(this.cx, this.y - 6, tr('bossFrankCrit'), '#fcd070');
    return r;
  }
  update() {
    this.tick();
    const p = W.player, sp = this.ph2 ? 1.3 : 1, ease = (v, to, k) => v + (to - v) * k;
    for (const mk of this.marks) mk.t--; this.marks = this.marks.filter(mk => mk.t > 0);
    this.count = (this.count + (this.state === 'idle' ? 1 : 3)) % 10000;
    if (this.dying) {
      if (this.dying % 2 === 0) for (let i = 0; i < 3; i++) W.spawn(new Particle(this.bx + rnd(-40, 40), this.gy - rnd(20, 80), rnd(-2.4, 2.4), rnd(-3, -0.5), ['#f4f0e4', '#c81c2c', '#2c5cc8', '#e8c070'][i % 4], 80, rnd(1, 2) | 0, 0.07));
      if (this.dying === 70) { W.shake = 22; W.flash = 10; Audio8.sfx('boom', this.bx); Audio8.sfx('stamp', this.bx); for (let i = 0; i < 40; i++) W.spawn(new Particle(this.bx + rnd(-40, 40), this.gy - rnd(10, 80), rnd(-4, 4), rnd(-5, -1), ['#f4f0e4', '#c81c2c', '#2c5cc8', '#e8c070'][i % 4], 120, 2, 0.07)); }
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; W.flash = 8; W.shake = 12; Audio8.tempo(1.12); Audio8.sfx('bell'); this.say('bossFrankRage', '#fc7460'); }
    if (this.state === 'idle' || this.state === 'intro') this.face = p.cx < this.bx ? -1 : 1;
    this.yaw = ease(this.yaw, -0.4 * this.face, 0.14); // gespiegelt statt umgedreht
    this.w = 80; this.h = 74; this.x = this.bx - 40; this.y = this.gy - 80 - this.by;
    if (this.state !== 'intro' && this.state !== 'stuck') this.touchPorto(p);
    if (this.state === 'intro') { this.crank += 0.2; if (this.timer % 20 === 0) Audio8.sfx('stamp', this.bx); if (this.timer > 100) this.go('idle'); }
    else if (this.state === 'idle') { // stampft heran, kurbelt
      this.crank += 0.1 * sp; this.drumA += 0.05;
      const want = clamp(p.cx - this.face * 110, this.ax + 60, this.ax + this.aw - 60); this.bx += clamp((want - this.bx) * 0.02, -0.8 * sp, 0.8 * sp);
      if (this.timer > (this.ph2 ? 45 : 70)) {
        const r = Math.random();
        if (r < 0.36 && this.drum) this.go('roll');
        else if (r < 0.68) { this.go('salvo'); this.salvo = this.ph2 ? 5 : 3; }
        else { this.go('jump'); this.vy = -6.2; this.jx = (p.cx - this.bx) / 52; Audio8.sfx('whoosh', this.bx); }
      }
    } else if (this.state === 'roll') { // ROLLSTEMPEL: Walze ausklinken
      this.drumA += 0.4;
      if (this.timer === 24) { this.drum = false; W.spawn(new Post.Walze(this, this.face, this.ph2 ? 3.4 : 2.6)); this.say('bossFrankRoll', '#e8c070'); Audio8.sfx('klack', this.bx); }
      // bleibt offen, bis die Walze zurück ist (die Walze schaltet auf idle)
    } else if (this.state === 'salvo') { // BRIEFSALVE
      this.crank += 0.3;
      if (this.timer % 14 === 7 && this.salvo > 0) {
        const mx = this.bx + this.face * 30, my = this.gy - 84, dx = p.cx - mx, t0 = 46, vx = dx / t0, vy = -2.6;
        W.spawn(new EProj('page', mx, my, vx + rnd(-0.3, 0.3), vy, 0.11, this.dmg - 1)); this.salvo--; Audio8.sfx('page', this.bx);
      }
      if (this.salvo <= 0 && this.timer > 60) this.go('idle');
    } else if (this.state === 'jump') { // FRANKIEREN: Sprung auf den Helden
      this.vy += 0.24; this.by -= this.vy; this.bx = clamp(this.bx + this.jx * sp, this.ax + 56, this.ax + this.aw - 56);
      if (this.by <= 0 && this.vy > 0) {
        this.by = 0; this.vy = 0; W.shake = 18; Audio8.sfx('stamp', this.bx); Audio8.sfx('boom', this.bx); Input.rumble(0.8, 0.6, 350);
        this.marks.push({ x: this.bx - 20, t: 400 }, { x: this.bx + 20, t: 400 });
        W.spawn(new Post.Welle(this.bx - 44, this.gy, -1, this)); W.spawn(new Post.Welle(this.bx + 44, this.gy, 1, this));
        if (this.ph2) { W.spawn(new Post.Welle(this.bx - 44, this.gy, -1, this)); }
        W.popup(this.bx, this.gy - 100, tr('bossFrankStamp'), '#fc5c5c'); this.go('stuck');
      }
    } else if (this.state === 'stuck') { // steckt nach dem Aufprall fest – offen für Treffer
      if (this.timer % 10 === 0) W.spawn(new Particle(this.bx + rnd(-30, 30), this.gy - rnd(60, 80), rnd(-0.3, 0.3), -rnd(0.5, 1), '#9c9ca8', 40, 2, -0.01));
      if (this.timer > (this.ph2 ? 60 : 85)) this.go('idle');
    }
  }
  touchPorto(p) { if (p.alive && Phys.overlap(this, p) && this.porto(p)) p.hurt(this.dmg, this.cx); }
}
