// Chefetage (Schloss-Modus, rechts an der Hauptpoststelle, Tür nur mit vollständigem Laufzettel): Vorzimmer und das Büro der
// Amtsleitung. Der Amtsleiter ist „zu Tisch“ – sein Schreibtisch hat übernommen: DER SCHREIBTISCHTÄTER (Endgegner des
// Behördentrakts, PS2-3D, gespiegelt statt umgedreht). Mahagoni mit grünem Lederbezug, Schubladenstöcke mit Messinggriffen,
// Telefon mit Wählscheibe, Bankerlampe, Stempelkarussell, Aktenstapel, Namensschild, dahinter der Chefsessel.
// Phase 1: SCHUBLADEN (gleiten über den Boden), STEMPELKARUSSELL (drei Stempel fallen mit Schattenwarnung).
// Phase 2 (ab zwei Dritteln): das Telefon klingelt – WARTESCHLEIFE: Fahrstuhlmusik, er ist nicht zu treffen, Wartenummern regnen
// von der Decke, zehn Sekunden lang („Ihr Anruf ist uns wichtig“). Danach geht es weiter.
// Phase 3 (ab einem Drittel): er steht auf – vier Beine fahren aus, er springt und stampft (Bodenwellen), der Chefsessel rollt los.
// Nach jedem Angriff ist er kurz außer Atem (offen: Schaden ×1,7, sonst ×0,45).
'use strict';

const Chef = (() => {
  class Schublade extends Ent { // gleitet über den Boden
    constructor(x, gy, dir, b) { super(x - 13, gy - 14, 26, 14); this.kind = 'eproj'; this.dir = dir; this.b = b; this.v = 3.2; this.dmg = b.dmg; }
    update() {
      this.t++; this.x += this.dir * this.v; this.v = Math.max(1.6, this.v - 0.012);
      const b = this.b; if (this.x < b.ax + 4 || this.x + this.w > b.ax + b.aw - 4 || this.t > 240 || b.dying) { this.dead = true; W.debris(this.cx, this.y + 8, '#6c3418', 5); Audio8.sfx('crumble', this.cx); }
      const p = W.player; if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#1c0c06'; ctx.fillRect(sx - 1, sy - 1, 28, 16); ctx.fillStyle = '#7c3c1c'; ctx.fillRect(sx, sy, 26, 14); ctx.fillStyle = '#a85c2c'; ctx.fillRect(sx, sy, 26, 2);
      ctx.fillStyle = '#e8c070'; ctx.fillRect(sx + 9, sy + 6, 8, 2); ctx.fillStyle = '#f0ead8'; ctx.fillRect(sx + 3, sy - 3, 6, 3); ctx.fillRect(sx + 15, sy - 2, 7, 2); // Griff, herausquellende Akten
    }
  }
  class Stempel extends Ent { // fällt nach einer Schattenwarnung
    constructor(x, gy, b, delay) { super(x - 12, W.cam.y - 30, 24, 24); this.kind = 'eproj'; this.gy = gy; this.b = b; this.warn = 40 + delay; this.vy = 0; this.dmg = b.dmg; this.tx = x; }
    update() {
      this.t++;
      if (this.warn > 0) { this.warn--; return; }
      this.vy = Math.min(8, this.vy + 0.5); this.y += this.vy;
      const p = W.player; if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
      if (this.y + this.h >= this.gy) { this.dead = true; W.shake = Math.max(W.shake, 6); Audio8.sfx('stamp', this.cx); this.b.marks.push({ x: this.cx, t: 300 }); W.popup(this.cx, this.gy - 30, tr('amtMark'), '#fc5c5c'); }
    }
    draw(ctx) {
      const fy = Math.round(this.gy - W.cam.y), cx = Math.round(this.tx - W.cam.x);
      const k = this.warn > 0 ? 1 - this.warn / 60 : 1; ctx.fillStyle = `rgba(0,0,0,${(0.2 + 0.4 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(cx, fy - 1, 8 + 8 * k, 3, 0, 0, Math.PI * 2); ctx.fill();
      if (this.warn > 0) return;
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx + 7, sy - 1, 10, 14); ctx.fillRect(sx - 1, sy + 13, 26, 12);
      ctx.fillStyle = '#7c4c24'; ctx.fillRect(sx + 8, sy, 8, 12); ctx.fillStyle = '#a86c34'; ctx.fillRect(sx + 6, sy - 4, 12, 5);  // Griff, Knauf
      ctx.fillStyle = '#5c3418'; ctx.fillRect(sx, sy + 14, 24, 7); ctx.fillStyle = '#c81c2c'; ctx.fillRect(sx, sy + 21, 24, 3);   // Holzblock, Gummi
    }
  }
  class Nummer extends Ent { // Wartenummer fällt von der Decke
    constructor(x, b) { super(x - 10, W.cam.y + 2, 20, 10); this.kind = 'eproj'; this.b = b; this.vy = rnd(0.7, 1.1); this.ph = rnd(0, 6); this.n = 100 + Math.floor(Math.random() * 900); this.dmg = 1; }
    update() {
      this.t++; this.y += this.vy; this.x += Math.sin(this.t * 0.07 + this.ph) * 0.6;
      const p = W.player; if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; }
      if (this.y + this.h >= this.b.gy || this.b.dying) { this.dead = true; for (let i = 0; i < 3; i++) W.spawn(new Particle(this.cx, this.b.gy - 3, rnd(-0.8, 0.8), rnd(-1, -0.3), '#f0ead8', 30, 1, 0.06)); }
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx - 1, sy - 1, 22, 13); ctx.fillStyle = '#f8f0d0'; ctx.fillRect(sx, sy, 20, 11); ctx.fillStyle = '#e04040'; ctx.fillRect(sx, sy, 20, 2);
      Font.draw(ctx, String(this.n), sx + 10, sy + 3, '#1c1c24', { align: 'center' });
    }
  }
  class Sessel extends Ent { // der Chefsessel rollt quer durchs Büro
    constructor(x, gy, dir, b) { super(x - 14, gy - 34, 28, 34); this.kind = 'eproj'; this.dir = dir; this.b = b; this.v = 0.5; this.dmg = b.dmg; this.spin = 0; this.bounced = false; }
    update() {
      this.t++; this.v = Math.min(3.8, this.v + 0.08); this.x += this.dir * this.v; this.spin += this.v * 0.08;
      const b = this.b, lo = b.ax + 6, hi = b.ax + b.aw - 6;
      if (this.x < lo || this.x + this.w > hi) { if (this.bounced) this.dead = true; else { this.bounced = true; this.dir = -this.dir; this.v = 2; W.shake = Math.max(W.shake, 5); Audio8.sfx('boom', this.cx); } }
      const p = W.player; if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
      if (b.dying) this.dead = true;
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = Math.round(Math.abs(Math.cos(this.spin)) * 12) + 8;
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx + 14 - w / 2 - 1, sy - 1, w + 2, 20);
      ctx.fillStyle = '#7c1c24'; ctx.fillRect(sx + 14 - w / 2, sy, w, 18); ctx.fillStyle = '#a83038'; ctx.fillRect(sx + 14 - w / 2, sy, w, 2); // Lehne
      ctx.fillStyle = '#5c1018'; ctx.fillRect(sx + 3, sy + 18, 22, 5); ctx.fillStyle = '#3c3a44'; ctx.fillRect(sx + 13, sy + 23, 3, 6);    // Sitz, Säule
      ctx.fillStyle = '#1c1a20'; for (const dx of [2, 9, 18, 24]) { ctx.fillRect(sx + dx, sy + 29, 4, 2); ctx.fillRect(sx + dx + 1, sy + 31, 3, 3); } // Fußkreuz mit Rollen
    }
  }
  return { Schublade, Stempel, Nummer, Sessel };
})();

class Schreibtisch extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw - 110, gy - 70, 110, 66, 72, 3);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 25000; this.nameKey = 'bossChef'; this.music = 'dienstweg'; this.keepMusic = true;
    this.bx = ax + aw - 100; this.by = 0; this.leg = 0; this.vy = 0; this.face = -1; this.yaw = 0.35; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.phase = 1; this.marks = []; this.buf = null; this.ring = 0; this.hold = 0; this.lamp = 1; this.chair = true;
    this.handset = 0; this.carousel = 0; this.drawerOut = 0;
  }
  porto() { return true; } // Bodenwellen der Hauptpoststelle (Post.Welle) fragen hier nach
  mesh() {
    const K = Keller, m = PS2.mesh(), fl = this.flashT > 0, F = (c) => (fl ? [240, 240, 240] : c);
    const MAHO = [112, 52, 28], MAHOL = [150, 76, 40], MAHOD = [72, 32, 18], LEATHER = [52, 104, 66], BRASS = [232, 188, 84], BLACK = [22, 20, 26], CREAM = [242, 234, 212], BURG = [120, 26, 36], GREENGL = [60, 170, 100];
    const P = { c: [0, this.by, 0], r: this.state === 'tired' ? Math.sin(this.timer * 0.5) * 0.02 : 0, y: this.yaw, m: this.face };
    const Q = (c, r) => ({ c, r, y: P.y, m: P.m }), at = (x, y, z) => Keller.xf(P, x, y, z), L = 10 + this.leg;
    for (const [lx, lz] of [[-48, -20], [-48, 20], [48, -20], [48, 20]]) { // Beine: gedrechselt, fahren in Phase 3 aus
      K.fbox(m, P, lx, -L / 2 + 10, lz, 6, L, 6, F(MAHOD)); K.fbox(m, P, lx, 10 - L + 1.5, lz, 9, 3, 9, F(BRASS));
    }
    for (const sx of [-38, 38]) { // Schubladenstöcke mit je drei Schubladen zum Betrachter
      K.fbox(m, P, sx, 33, 0, 30, 44, 50, F(MAHO));
      for (let k = 0; k < 3; k++) {
        const out = this.drawerOut * (k === 1 ? 1 : 0.4) * 10;
        K.fbox(m, P, sx, 18 + k * 14, -25.5 - out / 2, 26, 12, 1 + out, F(MAHOL)); K.fbox(m, P, sx, 18 + k * 14, -26.5 - out, 8, 2, 1, F(BRASS));
      }
    }
    K.fbox(m, P, 0, 30, 6, 46, 36, 38, F(MAHOD));                                                   // Kniehöhle (dunkel)
    // in der Kniehöhle: zwei glühende Augen unter zornigen Brauen (blinzeln; außer Atem halb zu, in der Warteschleife gelangweilt)
    const blink = this.t % 200 < 7, eh = blink ? 0.6 : this.state === 'tired' ? 1.4 : this.state === 'hold' ? 1 : 3.2, EYE = this.state === 'tired' ? [255, 150, 60] : [255, 228, 80];
    for (const ex of [-7, 7]) {
      K.fbox(m, P, ex, 33, -25.8, 6, eh, 0.6, EYE); // vor der Ebene der Schubladenfronten (Maler-Sortierung je Fläche)
      if (!blink && eh > 2) K.fbox(m, P, ex + (ex < 0 ? 1.5 : -1.5), 33, -26.2, 2, 2, 0.4, [40, 10, 10]); // Pupillen zur Mitte
      K.fbox(m, Q(at(ex, 37.5, -26), this.state === 'hold' ? 0 : ex < 0 ? -0.38 : 0.38), 0, 0, 0, 9, 1.8, 0.8, F(BLACK));
    }
    K.fbox(m, P, 0, 58, 0, 116, 6, 56, F(MAHO)); K.fbox(m, P, 0, 61.4, 0, 104, 1, 46, F(LEATHER)); // Platte, Lederbezug
    K.fbox(m, P, 0, 55, -28.5, 116, 1.4, 1, F(BRASS));                                              // Messingkante
    K.fbox(m, P, 0, 50, -28.6, 34, 7, 1, F(CREAM)); K.fbox(m, P, 0, 50, -29.1, 26, 1.4, 0.6, F(BLACK)); // Namensschild AMTSLEITUNG
    // Telefon mit Wählscheibe und Hörer (springt beim Klingeln)
    const tp = 34, rg = this.ring > 0 ? Math.sin(this.t * 2.2) * 1.5 : 0;
    K.fbox(m, P, tp, 66 + rg * 0.3, -6, 18, 8, 14, F(BLACK)); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; K.fbox(m, P, tp + Math.cos(a) * 4, 66, -13.5 + Math.sin(a) * 0.1, 1.6, 1.6, 0.6, F(CREAM)); }
    const hp = Q(at(tp, 71 + this.handset * 22 + Math.abs(rg), -6), this.handset * 0.5 + rg * 0.05); K.fbox(m, hp, 0, 0, 0, 20, 3, 4, F(BLACK)); K.fbox(m, hp, -9, -2, 0, 4, 5, 6, F(BLACK)); K.fbox(m, hp, 9, -2, 0, 4, 5, 6, F(BLACK));
    // Bankerlampe: Messingfuß, grüner Glasschirm (leuchtet)
    K.fbox(m, P, -42, 64, 8, 10, 3, 10, F(BRASS)); K.fbox(m, P, -42, 72, 8, 2, 14, 2, F(BRASS));
    K.fbox(m, Q(at(-42, 80, 8), 0.15), 0, 0, 0, 22, 5, 9, [GREENGL[0] * this.lamp + 20, GREENGL[1] * this.lamp + 20, GREENGL[2] * this.lamp + 20]);
    // Stempelkarussell: Drehständer mit sechs Stempeln
    K.fbox(m, P, -14, 64, -4, 4, 6, 4, F(BRASS)); K.fbox(m, P, -14, 68, -4, 16, 2, 16, F(BRASS));
    for (let k = 0; k < 6; k++) { const a = this.carousel + k * Math.PI / 3, x = -14 + Math.cos(a) * 6, z = -4 + Math.sin(a) * 6; K.fbox(m, P, x, 73, z, 3, 8, 3, F(MAHOL)); K.fbox(m, P, x, 77.5, z, 4, 2, 4, F([200 - k * 10, 30, 40])); }
    for (let k = 0; k < 5; k++) K.fbox(m, P, 12 + (k % 2), 64.5 + k * 2.4, 10, 20, 2.2, 15, F(k % 2 ? CREAM : [228, 220, 196])); // Aktenstapel
    if (this.chair) { // Chefsessel hinter dem Tisch
      K.fbox(m, P, 0, 70, 36, 46, 58, 10, F(BURG)); K.fbox(m, P, 0, 100.5, 36, 42, 5, 9, F([160, 46, 56])); K.fbox(m, P, 0, 30, 28, 34, 6, 22, F(BURG));
      for (const sx of [-25, 25]) K.fbox(m, P, sx, 78, 36, 5, 44, 11, F([96, 18, 26]));                    // Ohrenbacken
      for (let k = 0; k < 6; k++) K.fbox(m, P, -17.5 + k * 7, 96, 30.6, 3, 3, 1, F(BRASS));              // Ziernägel
      for (let k = 0; k < 3; k++) K.fbox(m, P, -12 + k * 12, 82, 30.6, 2, 2, 1, F([70, 12, 20]));          // Knöpfe der Polsterung
    }
    // Brille auf dem Tisch: Goldfassung, blitzt
    for (const dx of [-5, 5]) K.fbox(m, P, -26 + dx, 63, -18, 8, 1, 6, F(BRASS));
    return [m];
  }
  draw() { }
  drawLit(ctx) {
    const fy = Math.round(this.gy - W.cam.y);
    for (const mk of this.marks) { const a = Math.min(1, mk.t / 60) * 0.6, x = Math.round(mk.x - W.cam.x); ctx.fillStyle = `rgba(200,24,40,${a.toFixed(2)})`; ctx.fillRect(x - 12, fy - 2, 24, 2); }
    const sx = Math.round(this.bx - W.cam.x); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(sx, fy - 1, 64, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (this.dying > 80) return;
    const sh = this.dying && this.dying < 60 ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    const B = Keller.blit(ctx, this, this.mesh(), this.bx, this.gy, sh);
    this.lastDraw = this.dying ? null : { s: { c: B.c, f: B.c, w: View.w, h: 208 }, x: W.cam.x, y: W.cam.y, flip: false };
    if (this.state === 'hold') { // Warteschleife: Anzeige oben
      const s = Math.ceil(this.hold / 60), msg = tr('bossChefHold', s);
      ctx.fillStyle = 'rgba(8,6,14,0.75)'; const w = Font.width(msg) + 16; ctx.fillRect(View.w / 2 - w / 2, 16, w, 14);
      Font.draw(ctx, msg, View.w / 2, 19, (this.t >> 4) & 1 ? '#fce0a8' : '#f8b800', { align: 'center' });
    }
  }
  lightUp(L, cx, cy) {
    if (this.dying > 80) return;
    L.push({ x: this.bx - this.face * 42 - cx, y: this.gy - 84 - this.by - cy, r: 40, c: [120, 255, 160], a: 0.35 * this.lamp });
  }
  go(s) { this.state = s; this.timer = 0; }
  say(k, col, ...a) { W.popup(clamp(this.bx, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 130 - this.by, tr(k, ...a), col); }
  vulnerable() { return this.state !== 'intro' && this.state !== 'hold' && this.state !== 'call' && this.state !== 'stand'; }
  hit(dmg, id) {
    const soft = this.state !== 'tired';
    const r = super.hit(dmg * (soft ? 0.45 : 1.7), id);
    if (r && !soft && !this.dying) W.popup(this.cx, this.y - 6, tr('bossChefCrit'), '#fcd070');
    return r;
  }
  attack() { // nächster Angriff je Phase
    const r = Math.random(), p3 = this.phase >= 3;
    if (p3 && r < 0.3) { this.go('jump'); this.vy = -6.6; this.jx = (W.player.cx - this.bx) / 56; Audio8.sfx('whoosh', this.bx); }
    else if (p3 && r < 0.45 && this.chair) { this.go('chair'); }
    else if (r < (p3 ? 0.72 : 0.5)) this.go('drawers');
    else this.go('stamps');
  }
  update() {
    this.tick();
    const p = W.player, ease = (v, to, k) => v + (to - v) * k, sp = this.phase >= 3 ? 1.3 : 1;
    for (const mk of this.marks) mk.t--; this.marks = this.marks.filter(mk => mk.t > 0);
    this.carousel += this.state === 'stamps' ? 0.25 : 0.02;
    if (this.ring > 0) { this.ring--; if (this.ring % 40 === 0) Audio8.sfx('phone', this.bx); }
    if (this.dying) {
      if (this.dying % 2 === 0) for (let i = 0; i < 3; i++) W.spawn(new Particle(this.bx + rnd(-60, 60), this.gy - rnd(20, 90), rnd(-2.5, 2.5), rnd(-3.2, -0.5), ['#f4f0e4', '#e8dcc0', '#c81c2c', '#7c3c1c'][i % 4], 90, rnd(1, 2) | 0, 0.07));
      if (this.dying === 20) this.ring = 96;
      if (this.dying === 80) { W.shake = 26; W.flash = 12; Audio8.sfx('boom', this.bx); Audio8.sfx('crumble', this.bx); for (let i = 0; i < 50; i++) W.spawn(new Particle(this.bx + rnd(-60, 60), this.gy - rnd(10, 80), rnd(-4.5, 4.5), rnd(-5, -1), ['#f4f0e4', '#c81c2c', '#7c3c1c', '#e8c070'][i % 4], 130, 2, 0.07)); }
      this.leg = ease(this.leg, 0, 0.1); this.by = ease(this.by, 0, 0.1);
      return this.updateDeath(150);
    }
    // Phasenwechsel: Warteschleife ab zwei Dritteln, Aufstehen ab einem Drittel
    if (this.phase === 1 && this.hp <= this.maxHp * 2 / 3 && this.state !== 'jump') { this.phase = 2; this.go('call'); this.ring = 120; this.say('bossChefCall', '#f8d048'); }
    else if (this.phase === 2 && this.hp <= this.maxHp / 3 && this.state !== 'hold' && this.state !== 'call' && this.state !== 'jump') { this.phase = 3; this.go('stand'); }
    if (this.state === 'idle' || this.state === 'intro' || this.state === 'tired') this.face = p.cx < this.bx ? -1 : 1;
    this.yaw = ease(this.yaw, -0.35 * this.face, 0.12);
    this.w = 116; this.h = 66; this.x = this.bx - 58; this.y = this.gy - 70 - this.by - this.leg * 0.2;
    if (this.state !== 'intro' && this.state !== 'tired' && this.state !== 'hold' && p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    this.drawerOut = ease(this.drawerOut, this.state === 'drawers' ? 1 : 0, 0.2);
    this.handset = ease(this.handset, this.state === 'hold' || this.state === 'call' ? 1 : 0, 0.15);
    this.lamp = this.state === 'hold' ? 0.35 + 0.15 * Math.sin(this.t * 0.2) : ease(this.lamp, 1, 0.05);
    if (this.state === 'intro') { if (this.timer > 90) this.go('idle'); }
    else if (this.state === 'idle') { // rückt heran
      const want = clamp(p.cx - this.face * 130, this.ax + 70, this.ax + this.aw - 70); this.bx += clamp((want - this.bx) * 0.02, -0.7 * sp, 0.7 * sp);
      if (this.timer > (this.phase >= 3 ? 40 : 64)) this.attack();
    } else if (this.state === 'drawers') { // SCHUBLADEN: zwei (drei) gleiten über den Boden
      const n = this.phase >= 3 ? 3 : 2;
      if (this.timer % 22 === 10 && this.timer < 10 + n * 22) { W.spawn(new Chef.Schublade(this.bx + this.face * 50, this.gy, this.face, this)); Audio8.sfx('klack', this.bx); }
      if (this.timer > 20 + n * 22) this.go('tired');
    } else if (this.state === 'stamps') { // STEMPELKARUSSELL: drei Stempel mit Schattenwarnung
      if (this.timer === 12) { const n = this.phase >= 3 ? 4 : 3; for (let i = 0; i < n; i++) { const x = clamp(p.cx + (i - (n - 1) / 2) * 44, this.ax + 16, this.ax + this.aw - 16); W.spawn(new Chef.Stempel(x, this.gy, this, i * 8)); } Audio8.sfx('creak', this.bx); }
      if (this.timer > 90) this.go('tired');
    } else if (this.state === 'tired') { // außer Atem – offen für Treffer
      if (this.timer % 12 === 0) W.spawn(new Particle(this.bx + rnd(-40, 40), this.gy - 66 - this.by, rnd(-0.3, 0.3), -rnd(0.4, 0.9), '#e8e4d8', 30, 1, -0.01));
      if (this.timer > (this.phase >= 3 ? 50 : 70)) this.go('idle');
    } else if (this.state === 'call') { // das Telefon klingelt: gleich geht es in die Warteschleife
      if (this.timer === 70) { this.go('hold'); this.hold = 600; Audio8.play('warteschleife'); this.say('bossChefWait', '#f8d048'); Audio8.sfx('select'); }
    } else if (this.state === 'hold') { // WARTESCHLEIFE: nicht zu treffen, Wartenummern regnen
      this.hold--;
      if (this.hold % 26 === 0) W.spawn(new Chef.Nummer(clamp(p.cx + rnd(-140, 140), this.ax + 12, this.ax + this.aw - 12), this));
      if (this.hold % 180 === 90) this.say('bossChefPatience', '#fce0a8');
      if (this.hold <= 0) { Audio8.play(this.music); this.say('bossChefBack', '#fc7460'); this.ring = 0; this.go('tired'); }
    } else if (this.state === 'stand') { // steht auf: Beine fahren aus
      this.leg = ease(this.leg, 34, 0.04); this.by = this.leg * 0.95;
      if (this.timer === 1) { this.say('bossChefStand', '#fc7460'); Audio8.sfx('creak', this.bx); Audio8.tempo(1.12); }
      if (this.timer % 10 === 0) { W.shake = Math.max(W.shake, 3); Audio8.sfx('chug', this.bx); }
      if (this.timer > 90) { this.go('idle'); W.shake = 14; Audio8.sfx('boom', this.bx); }
    } else if (this.state === 'jump') { // springt und stampft: Bodenwellen
      this.vy += 0.26; this.by -= this.vy; this.bx = clamp(this.bx + this.jx * sp, this.ax + 64, this.ax + this.aw - 64);
      const base = this.phase >= 3 ? this.leg * 0.95 : 0;
      if (this.by <= base && this.vy > 0) {
        this.by = base; this.vy = 0; W.shake = 20; Audio8.sfx('stamp', this.bx); Audio8.sfx('boom', this.bx); Input.rumble(0.9, 0.7, 380);
        W.spawn(new Post.Welle(this.bx - 60, this.gy, -1, this)); W.spawn(new Post.Welle(this.bx + 60, this.gy, 1, this));
        this.go('tired');
      }
    } else if (this.state === 'chair') { // der Chefsessel rollt los (einmal)
      if (this.timer === 20) { this.chair = false; W.spawn(new Chef.Sessel(this.bx - this.face * 20, this.gy, this.face, this)); Audio8.sfx('whoosh', this.bx); this.say('bossChefChair', '#e8c070'); }
      if (this.timer > 50) this.go('tired');
    }
  }
}
