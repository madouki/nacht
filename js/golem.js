// Steingolem (Schloss-Modus, Zwischengegner im Golemstollen links vom Eiskeller): bildschirmfüllend, aus Felsquadern gefügt,
// Runen glühen in den Fugen, Moos auf den Schultern. Er steht am linken Ende des Stollens, der Kopf stößt an die Decke, und
// schaut nach rechts zum Helden – als PS2-Low-Poly-Modell, jedes Bild neu gebaut und mit der Software-3D (ps2.js) gerastert.
// Angriffe: Augenlaser fegt über den Boden zum Helden und zurück (drüberspringen); flacher Laser – er geht in die Knie, senkt
// den Kopf bis an den Boden und feuert waagerecht in Kopfhöhe (ducken); Faust hebt sich über den Helden (Schatten), kracht
// herab, Gesteinsbrocken spritzen, danach sinkt er kurz in die Knie; Brüllen: Steine fallen von der Decke. Treffbar ist nur
// das Runenherz in der Brust – im Stand mit einem Sprung, kniend vom Boden aus. Ab halber Energie schneller, Laser doppelt.
'use strict';

class GolemRock extends Ent { // Stein aus der Stollendecke: erst rieselt Staub (Vorwarnung), dann fällt er
  constructor(x, gy, dmg) { super(x - 9, -24, 18, 18); this.kind = 'eproj'; this.gy = gy; this.dmg = dmg; this.vy = 0; this.warn = 34; }
  update() {
    this.t++;
    if (this.warn > 0) { if (--this.warn % 4 === 0) W.spawn(new Particle(this.cx + rnd(-8, 8), W.cam.y + 2, rnd(-0.2, 0.2), rnd(0.6, 1.2), '#8c8070', 24, 1, 0.05)); return; }
    this.vy = Math.min(7, this.vy + 0.32); this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.y + this.h >= this.gy) {
      this.dead = true; W.shake = Math.max(W.shake, 4); Audio8.sfx('crumble', this.cx);
      for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.gy - 4, rnd(-1.8, 1.8), rnd(-2.6, -0.6), i % 2 ? '#7c7468' : '#4c463e', 34, 2, 0.16));
    }
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
    if (this.warn > 0) { ctx.fillStyle = 'rgba(140,128,112,0.35)'; ctx.fillRect(x + 4, Math.round(-W.cam.y), 10, 3); return; } // Riss in der Decke
    ctx.fillStyle = '#4c463e'; ctx.fillRect(x + 2, y, 14, 18); ctx.fillRect(x, y + 3, 18, 12);
    ctx.fillStyle = '#7c7468'; ctx.fillRect(x + 2, y, 14, 3); ctx.fillRect(x, y + 3, 4, 8);
    ctx.fillStyle = '#2c2824'; ctx.fillRect(x + 9, y + 6, 6, 2);
  }
}

class GolemBoss extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + 100, gy - 110, 26, 30, 36, 3); // Trefferfläche = Runenherz in der Brust (folgt jedes Bild der Pose)
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 8000; this.nameKey = 'bossGolem'; this.music = 'boss';
    this.bx = ax + 112; this.wall = this.bx + 64; this.face = 1; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.ph2 = false;
    this.kneel = 0; this.dip = 0; this.eye = 0; this.roarK = 0; this.open = 0; // Pose (0 … 1): Knie, Kopf gesenkt, Augenglut, Brüllen, Brust offen
    this.fist = { x: this.bx + 30, y: gy - 22, home: true }; this.beam = null; this.buf = null;
  }
  // ---------------- Modell ----------------
  // lokale Koordinaten: x nach vorn (zum Helden), y hoch ab Boden, z in die Tiefe (0 = Spielebene). Maße in Bildpunkten.
  pose() {
    const k = this.kneel, d = this.dip, bob = Math.sin(this.t * 0.05) * 2 * (1 - k);
    const hip = 52 - 30 * k + bob, chest = hip + 96, head = { x: 20 + 14 * Math.max(0, d), y: (chest - 4) * (1 - d) + 5 * d, tilt: d }; // gesenkt: Kopf liegt am Boden, Augen in Kopfhöhe des Helden
    return { hip, chest, head, eyeY: head.y + 23, eyeX: head.x + 27 };
  }
  mesh() {
    const P = PS2, m = P.mesh(), S = this.flashT > 0 ? [240, 240, 240] : [104, 96, 88], S2 = this.flashT > 0 ? [220, 220, 220] : [80, 74, 70], D = [44, 40, 40], MOSS = [62, 98, 52];
    const RUNE = [255, 150, 70], ps = this.pose(), k = this.kneel;
    // Beine (im Knien kürzer, die Knie stehen vor)
    for (const z of [-26, 26]) {
      P.box(m, -6 + 14 * k, 0, z, 34, Math.max(14, ps.hip - 6), 30, S2);
      P.box(m, 4 + 18 * k, 0, z, 42, 12, 34, D);                                              // Fuß
      if (k > 0.2) P.box(m, 22 * k, ps.hip - 20, z, 30, 18, 30, S);                            // Knie
    }
    P.box(m, 0, ps.hip - 8, 0, 70, 20, 78, D);                                                 // Becken
    P.box(m, 0, ps.hip + 10, 0, 70, 40, 72, S2);                                              // Taille
    P.box(m, 2, ps.hip + 44, 0, 92, ps.chest - ps.hip - 34, 104, S);                          // Brustkorb, breit
    P.box(m, 6, ps.chest - 28, 0, 90, 26, 96, S2);                                            // Brustpanzer
    for (const z of [-62, 62]) { // Felsschultern mit Zacken und Moos, die Arme hängen außen
      P.box(m, -2, ps.chest - 26, z, 54, 46, 42, S); P.box(m, -8, ps.chest + 18, z * 0.92, 34, 8, 26, MOSS);
      P.cone(m, -10, ps.chest + 18, z * 1.05, 12, 20, 4, D); P.cone(m, 10, ps.chest + 14, z * 0.9, 9, 14, 4, D);
    }
    for (let i = 0; i < 4; i++) P.box(m, 47, ps.hip + 50 + i * 12, -34 + (i % 2) * 60, 2, 3, 14, RUNE, { e: 0.35 + 0.25 * Math.sin(this.t * 0.08 + i) }); // Runen in den Fugen
    // Runenherz in der Brust: öffnet sich (Platten weichen), glüht stärker beim Laser und im Knien
    const cy = ps.hip + 12, glow = 0.45 + 0.5 * this.open + 0.15 * Math.sin(this.t * 0.2); // im Bauch: im Stand mit Sprung, kniend vom Boden erreichbar
    P.box(m, 44, cy - 14, 0, 6, 28, 28, RUNE, { e: glow });
    for (const s of [-1, 1]) P.box(m, 46, cy - 16, s * (16 + 12 * this.open), 6, 32, 14, S2); // Brustplatten
    // hinterer Arm hängt, vorderer Arm reicht bis zur Faust (Welt → lokal)
    P.beam(m, -4, ps.chest - 10, 70, 8, 30, 72, 28, 28, S2); P.box(m, 10, 6, 72, 42, 36, 40, S);   // hinterer Arm hängt bis zum Boden
    const f = this.fist, fx = f.x - this.bx, fy = this.gy - f.y, sx = 6, sy = ps.chest - 10, sz = -66; // die Faust kommt in die Spielebene (z 0): dort trifft sie
    const ex = (sx + fx) / 2 + 10, ey = Math.max(sy, fy) + 26;                                   // Ellbogen
    P.beam(m, sx, sy, sz, ex, ey, -30, 28, 28, S2); P.beam(m, ex, ey, -22, fx, fy + 16, 0, 24, 24, S);
    P.box(m, fx, fy - 20, 0, 44, 40, 44, S); P.box(m, fx + 20, fy - 14, 0, 6, 30, 40, D);         // Faust, Knöchel
    // Kopf: senkt sich beim flachen Laser bis an den Boden; Brauen, Mund, glühende Augen
    const hx = ps.head.x, hy = ps.head.y, eye = [255, 70 + 120 * this.eye, 40 + 60 * this.eye];
    P.beam(m, 0, ps.chest - 8, 0, hx - 6, hy + 8, 0, 34, 30, D);                                // Nacken
    P.box(m, hx, hy, 0, 56, 46, 56, S);                                                         // Kopf, gebückt zwischen den Schultern
    P.box(m, hx + 6, hy + 30, 0, 52, 10, 64, D);                                                // Stirnwulst
    P.box(m, hx + 28, hy + 8, 0, 4, 5, 26, [30, 20, 20]);                                       // Mundspalt
    for (const z of [-13, 13]) P.box(m, hx + 28, hy + 21, z, 3, 7, 11, eye, { e: 0.25 + this.eye * 0.9 });
    P.box(m, hx - 6, hy + 46, -8, 24, 8, 22, MOSS); P.cone(m, hx - 10, hy + 46, 14, 8, 14, 4, D);
    return [m];
  }
  draw() { } // gezeichnet wird nach dem Licht (drawLit): der Felsleib hat seine eigene Fackelbeleuchtung, der Stollennebel liegt dahinter
  drawLit(ctx) {
    const w = View.w, Wb = Math.ceil(w / 2), Hb = 104, VX = w / 2;
    if (!this.buf || this.buf.w !== Wb) { const c = document.createElement('canvas'); c.width = Wb; c.height = Hb; this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w: Wb }; }
    const B = this.buf, ox = this.bx - W.cam.x, oy = this.gy - W.cam.y;
    B.x.clearRect(0, 0, Wb, Hb);
    PS2.render(B.x, Wb, Hb, this.mesh(), { x: VX - ox, y: oy - 60, z: -200, yaw: 0, pitch: 0, f: 100, near: 30, cx: VX / 2, cy: 30 }, GolemBoss.ENV);
    const shake = this.dying ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(B.c, 0, 0, Wb, Hb, shake, 0, Wb * 2, 208); ctx.restore();
    this.lastDraw = { s: { c: B.c, f: B.c, w: Wb, h: Hb }, x: W.cam.x, y: W.cam.y, flip: false };
    // Schatten der Faust am Boden, solange sie über dem Helden schwebt
    if (this.state === 'raise' || this.state === 'hover' || this.state === 'slam') {
      const sx = Math.round(this.fist.x - W.cam.x), k = clamp(1 - (this.gy - this.fist.y) / 180, 0.2, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.25 + 0.35 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(sx, Math.round(this.gy - W.cam.y) - 1, 14 + 16 * k, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (this.beam) this.drawBeam(ctx);
    if (this.eye > 0.05) { // Augenglut (auch ohne Strahl)
      const e = this.eyePt(); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(e.x - W.cam.x, e.y - W.cam.y, 0, e.x - W.cam.x, e.y - W.cam.y, 10 + this.eye * 26);
      g.addColorStop(0, `rgba(255,220,180,${(0.5 * this.eye).toFixed(2)})`); g.addColorStop(0.4, `rgba(255,60,30,${(0.35 * this.eye).toFixed(2)})`); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(e.x - W.cam.x - 40, e.y - W.cam.y - 40, 80, 80); ctx.restore();
    }
  }
  eyePt() { const ps = this.pose(), q = PS2.projLocal(this.bx - W.cam.x, this.gy - W.cam.y, ps.eyeX + 2, ps.eyeY, -12); return { x: q[0] + W.cam.x, y: q[1] + W.cam.y }; }
  drawBeam(ctx) { // Laser: weißer Kern, roter Mantel, Glut am Auftreffpunkt
    const b = this.beam, e = this.eyePt(), x0 = e.x - W.cam.x, y0 = e.y - W.cam.y, x1 = b.x - W.cam.x, y1 = b.y - W.cam.y, fl = (this.t >> 1) & 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [lw, c] of [[14 + fl * 2, 'rgba(255,30,20,0.22)'], [8, 'rgba(255,80,40,0.55)'], [3, 'rgba(255,240,220,0.95)']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    const g = ctx.createRadialGradient(x1, y1, 0, x1, y1, 22); g.addColorStop(0, 'rgba(255,230,180,0.9)'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x1 - 22, y1 - 22, 44, 44); ctx.restore();
  }
  // ---------------- Verhalten ----------------
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.wall + 80, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 150, tr(k), col); }
  vulnerable() { return this.state !== 'intro'; }
  beamHits(x0, y0, x1, y1) { // Strahl (Strecke) gegen den Helden
    const p = W.player; if (!p.alive) return false;
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; if (x > p.x - 3 && x < p.x + p.w + 3 && y > p.y - 3 && y < p.y + p.h + 3) return true; }
    return false;
  }
  update() {
    this.tick();
    const p = W.player, sp = this.ph2 ? 1.4 : 1, ease = (v, to, k) => v + (to - v) * k;
    if (p.alive && p.x < this.wall) { p.x = this.wall; if (p.vx < 0) p.vx = 0; } // vor dem Felsleib ist Schluss
    if (this.dying) {
      this.eye = ease(this.eye, 0, 0.05); this.kneel = ease(this.kneel, 1, 0.03); this.beam = null;
      if (this.dying % 5 === 0) for (let i = 0; i < 3; i++) W.spawn(new Particle(this.bx + rnd(-50, 50), this.gy - rnd(10, 180), rnd(-1.5, 1.5), rnd(-1, 0.5), i % 2 ? '#7c7468' : '#4c463e', 50, 2, 0.15));
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { // Phase 2: Risse glühen, schneller, doppelter Laser
      this.ph2 = true; W.flash = 8; W.shake = Math.max(W.shake, 16); Audio8.sfx('roar'); Audio8.tempo(1.1); Input.rumble(0.7, 0.6, 500);
      this.say('bossGolemRage', '#fc7460');
    }
    const ps = this.pose(), f = this.fist;
    const hq = PS2.projLocal(this.bx - W.cam.x, this.gy - W.cam.y, 44, ps.hip + 12, 0); // Runenherz folgt der Pose (wo man es sieht)
    this.w = 26; this.h = 30; this.x = hq[0] + W.cam.x - 13; this.y = hq[1] + W.cam.y - 15;
    if (this.state !== 'slam' && this.state !== 'hover' && this.state !== 'raise') { f.x = ease(f.x, this.bx + 30, 0.08); f.y = ease(f.y, this.gy - 22 - this.kneel * 4, 0.08); }
    if (this.state === 'intro') { // erwacht: Augen glimmen auf, Steine bröckeln ab, Brüllen
      this.eye = clamp((this.timer - 20) / 40, 0, 1);
      if (this.timer % 6 === 0) W.spawn(new Particle(this.bx + rnd(-40, 50), this.gy - rnd(30, 170), rnd(-0.6, 0.6), rnd(0, 1), '#7c7468', 40, 2, 0.15));
      if (this.timer === 62) { Audio8.sfx('roar'); W.shake = 20; Input.rumble(0.8, 0.6, 600); this.say('bossGolemShout', '#f8b800'); }
      if (this.timer > 110) this.go('idle');
    } else if (this.state === 'idle') {
      this.eye = ease(this.eye, 0.35, 0.05); this.kneel = ease(this.kneel, 0, 0.06); this.dip = ease(this.dip, 0, 0.06); this.open = ease(this.open, 0, 0.1);
      if (this.timer > (this.ph2 ? 34 : 56)) {
        const r = Math.random();
        if (r < 0.34) { this.go('charge'); Audio8.sfx('charge', this.bx); }
        else if (r < 0.58) this.go('crouch');
        else if (r < 0.88) { this.go('raise'); Audio8.sfx('creak', this.bx); }
        else this.go('roar');
      }
    } else if (this.state === 'charge') { // Augen laden, Brust öffnet sich (Runenherz treffbar)
      this.eye = clamp(this.timer / (this.ph2 ? 30 : 46), 0, 1.2); this.open = ease(this.open, 1, 0.1); this.dip = ease(this.dip, 0, 0.15); this.kneel = ease(this.kneel, 0, 0.15); // aufrichten: Augen oben
      if (this.timer % 3 === 0) { const e = this.eyePt(); W.spawn(new Particle(e.x + rnd(-14, 14), e.y + rnd(-14, 14), 0, 0, '#fc7460', 12, 1, 0)); }
      if (this.timer > (this.ph2 ? 30 : 46)) { this.go('sweep'); this.sweeps = this.ph2 ? 2 : 1; Audio8.sfx('laser', this.bx); }
    } else if (this.state === 'sweep') { // Strahl fegt über den Boden bis ans Ende des Stollens und zurück
      const len = this.ph2 ? 46 : 64, u = this.timer / len, k = u < 0.5 ? u * 2 : 2 - u * 2, x = this.wall + 8 + k * (this.ax + this.aw - this.wall - 20);
      this.beam = { x, y: this.gy };
      const e = this.eyePt();
      if (this.beamHits(e.x, e.y, x, this.gy)) p.hurt(this.dmg + 1, x);
      if (this.timer % 2 === 0) W.spawn(new Particle(x + rnd(-4, 4), this.gy - 2, rnd(-1.5, 1.5), rnd(-2.4, -0.6), this.timer % 4 ? '#fcb860' : '#fc5c3c', 22, 1, 0.12)); // Funken
      if (this.timer % 8 === 0) Audio8.sfx('fire', x);
      if (this.timer >= len) { this.beam = null; if (--this.sweeps > 0) { this.timer = 0; Audio8.sfx('laser', this.bx); } else this.go('idle'); }
    } else if (this.state === 'crouch') { // in die Knie, Kopf bis an den Boden – gleich kommt der flache Laser
      this.kneel = ease(this.kneel, 1, 0.08); this.dip = ease(this.dip, 1, 0.07); this.eye = clamp(this.timer / 40, 0, 1.2); this.open = ease(this.open, 1, 0.1);
      if (this.timer === 8) Audio8.sfx('charge', this.bx);
      if (this.timer > (this.ph2 ? 34 : 46)) { this.go('flat'); Audio8.sfx('laser', this.bx); W.shake = Math.max(W.shake, 6); }
    } else if (this.state === 'flat') { // waagerecht in Kopfhöhe des stehenden Helden: ducken!
      const e = this.eyePt(); this.beam = { x: this.ax + this.aw, y: e.y };
      if (this.beamHits(e.x, e.y, this.ax + this.aw, e.y)) p.hurt(this.dmg + 1, e.x);
      if (this.timer % 3 === 0) W.spawn(new Particle(this.ax + this.aw - rnd(0, 8), e.y + rnd(-3, 3), -rnd(0.5, 2), rnd(-1, 1), '#fcb860', 18, 1, 0));
      if (this.timer > (this.ph2 ? 56 : 44)) { this.beam = null; this.go('idle'); }
    } else if (this.state === 'raise') { // Faust hebt sich über den Helden
      const tx = clamp(p.cx, this.wall + 24, this.ax + this.aw - 24);
      f.x = ease(f.x, tx, 0.08); f.y = ease(f.y, this.gy - 160, 0.08);
      if (this.timer > 34) this.go('hover');
    } else if (this.state === 'hover') { // schwebt und folgt dem Helden – der Schatten wird dunkler
      f.x = ease(f.x, clamp(p.cx, this.wall + 24, this.ax + this.aw - 24), this.ph2 ? 0.06 : 0.04);
      if (this.timer > (this.ph2 ? 16 : 28)) { this.go('slam'); Audio8.sfx('whoosh', f.x); }
    } else if (this.state === 'slam') { // kracht herab
      f.y = Math.min(this.gy - 22, f.y + 10);
      if (p.alive && Phys.overlap({ x: f.x - 22, y: f.y - 20, w: 44, h: 40 }, p)) p.hurt(this.dmg + 1, f.x);
      if (f.y >= this.gy - 22) {
        W.shake = 18; Audio8.sfx('boom', f.x); Audio8.sfx('crumble', f.x); Input.rumble(0.9, 0.7, 400);
        W.spawn(new Shock(f.x, this.gy - 4, 70, '#c8b8a0', 4));
        for (const d of [-1, 1]) for (let i = 0; i < (this.ph2 ? 3 : 2); i++) W.spawn(new EProj('rock', f.x + d * 18, this.gy - 14, d * (1.4 + i * 0.9), -3.2 - i * 0.6, 0.18, this.dmg));
        this.go('kneel');
      }
    } else if (this.state === 'kneel') { // erschöpft in die Knie: das Runenherz ist vom Boden aus erreichbar
      this.kneel = ease(this.kneel, 1, 0.12); this.open = ease(this.open, 1, 0.12); this.eye = ease(this.eye, 0.15, 0.1);
      if (this.timer > (this.ph2 ? 60 : 84)) this.go('idle');
    } else if (this.state === 'roar') { // Brüllen: Steine lösen sich aus der Stollendecke
      this.roarK = Math.sin(Math.min(1, this.timer / 50) * Math.PI); this.dip = ease(this.dip, -0.15, 0.1);
      if (this.timer === 10) { Audio8.sfx('roar'); W.shake = 14; Input.rumble(0.6, 0.5, 400); }
      if (this.timer === 14) for (let i = 0; i < (this.ph2 ? 6 : 4); i++) W.spawn(new GolemRock(this.wall + 20 + ((i + Math.random()) / (this.ph2 ? 6 : 4)) * (this.ax + this.aw - this.wall - 40), this.gy, this.dmg));
      if (this.timer > 60) this.go('idle');
    }
  }
  lightUp(L, cx, cy) {
    if (this.dying) return;
    const ps = this.pose(), q = PS2.projLocal(this.bx - W.cam.x, this.gy - W.cam.y, 46, ps.hip + 12, 0);
    L.push({ x: this.fist.x - cx, y: this.fist.y - cy, r: 50, c: [220, 200, 170], a: 0.35 });
    L.push({ x: q[0] + W.cam.x - cx, y: q[1] + W.cam.y - cy, r: 30 + this.open * 20, c: [255, 140, 60], a: 0.4 + this.open * 0.3 }); // Runenherz
    if (this.eye > 0.1) { const e = this.eyePt(); L.push({ x: e.x - cx, y: e.y - cy, r: 20 + this.eye * 30, c: [255, 60, 40], a: 0.5 * this.eye }); }
    if (this.beam) L.push({ x: this.beam.x - cx, y: this.beam.y - cy, r: 50, c: [255, 90, 50], a: 0.7 });
  }
}
GolemBoss.ENV = (() => { const v = [0.55, 0.65, -0.55], l = Math.hypot(...v); return { sun: v.map(c => c / l), sunC: [0.95, 0.8, 0.62], amb: [0.22, 0.2, 0.28], sky: [0.1, 0.1, 0.14], fog: [0, 0, 0], fogD: 0 }; })(); // Fackellicht von rechts vorn, harte Schatten
