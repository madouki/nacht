// Der Amtsschimmel (Schloss-Modus, Zwischengegner im Amt für Heldentaten links vom Rohrpostamt): ein Pferd aus alten Akten –
// Aktenordner als Rumpf, gerollte Formulare als Beine, eine Mähne aus losen Blättern, rotes Amtsband um den Bauch, ein Hals wie
// ein Ziehharmonika-Ordner, und der Kopf ist ein riesiger Holzstempel mit Pferdegesicht (unten die rote Gummiplatte). PS2-Low-Poly
// wie der Steingolem (ps2.js), gezeichnet nach dem Licht. Angriffe: STEMPEL – der Kopf hebt sich, folgt dem Helden (Schatten am
// Boden) und knallt herab, danach steckt er kurz fest und ist vom Boden aus treffbar (roter Abdruck); FORMULARSTURM – er schnaubt
// Wellen von Formularen, abwechselnd in Kopfhöhe (ducken) und knapp über dem Boden (springen); AKTENLAWINE – er bäumt sich auf und
// stampft, Akten fallen aus den Regalen (vorher rieselt Staub). Treffbar ist nur der Stempelkopf. Ab halber Energie: nächste
// Instanz – schneller, Doppelstempel, mehr Formulare und Akten.
'use strict';

class AmtFile extends Ent { // Akte aus dem obersten Regalfach: erst rieselt Staub, dann fällt sie und platzt in lose Blätter
  constructor(x, gy, dmg) {
    super(x - 8, W.cam.y - 22, 16, 12); this.kind = 'eproj'; this.gy = gy; this.dmg = dmg; this.vy = 0; this.warn = 36;
    this.col = ['#c8a868', '#5c7c9c', '#9c3c3c', '#6c8c4c'][Math.floor(Math.random() * 4)];
  }
  update() {
    this.t++;
    if (this.warn > 0) { if (--this.warn % 4 === 0) W.spawn(new Particle(this.cx + rnd(-7, 7), W.cam.y + 2, rnd(-0.2, 0.2), rnd(0.5, 1), '#a89c84', 24, 1, 0.04)); return; }
    this.vy = Math.min(6.5, this.vy + 0.3); this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.y + this.h >= this.gy) {
      this.dead = true; W.shake = Math.max(W.shake, 3); Audio8.sfx('crumble', this.cx);
      for (let i = 0; i < 9; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.gy - 4, rnd(-1.6, 1.6), rnd(-2.4, -0.6), i % 3 ? '#f0ead8' : this.col, 40, 2, 0.06)); // lose Blätter flattern
    }
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
    if (this.warn > 0) { ctx.fillStyle = 'rgba(168,156,132,0.45)'; ctx.fillRect(x + 3, 0, 10, 2); return; } // Staub aus dem Regal
    ctx.fillStyle = '#1c1820'; ctx.fillRect(x - 1, y - 1, 18, 14);
    ctx.fillStyle = this.col; ctx.fillRect(x, y, 16, 12);
    ctx.fillStyle = '#f0ead8'; ctx.fillRect(x + 2, y + 3, 7, 4); ctx.fillRect(x + 12, y + 1, 2, 10); // Etikett, Rücken
    ctx.fillStyle = '#2c2830'; ctx.fillRect(x + 12, y + 5, 2, 2);                                     // Griffloch
  }
}

class Amtsschimmel extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + 170, gy - 98, 40, 28, 40, 3); // Trefferfläche = Stempelkopf (folgt jedes Bild der Pose)
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 9000; this.nameKey = 'bossAmt'; this.music = 'amtsmarsch';
    this.bx = ax + 104; this.wall = this.bx + 66; this.face = 1; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.ph2 = false;
    this.head = { x: 74, y: 84 }; this.rear = 0; this.eye = 0; this.ink = 0; this.walk = 0; this.stamps = 0; this.waves = 0; this.marks = []; this.buf = null;
  }
  // ---------------- Modell ----------------
  // lokale Koordinaten: x nach vorn (zum Helden), y hoch ab Boden, z in die Tiefe (0 = Spielebene). Der Rumpf steht schräg zum
  // Betrachter (YAW) und bäumt sich um die Hinterhufe auf (rear); Hals und Stempelkopf liegen ungedreht in der Spielebene – der
  // Stempel trifft genau dort, wo der Held steht
  rot(x, z) { const c = Math.cos(Amtsschimmel.YAW), s = Math.sin(Amtsschimmel.YAW); return [x * c - z * s, x * s + z * c]; }
  pitch(x, y) { const a = this.rear * 0.42, px = -56, c = Math.cos(a), s = Math.sin(a); return [px + (x - px) * c - y * s, (x - px) * s + y * c]; }
  tf(x, y, z) { const [X, Y] = this.pitch(x, y), [rx, rz] = this.rot(X, z); return [rx, Y, rz]; }
  rp(x, y, z) { // Bildpunkt eines ungedrehten Punkts (wie beim Golem: ferne Kamera, kaum Fluchtverzerrung)
    const D = Amtsschimmel.CAM_D, VX = View.w / 2, k = D / (D + z), sx = this.bx - W.cam.x, sy = this.gy - W.cam.y;
    return [VX + (sx + x - VX) * k, 60 + (sy - y - 60) * k];
  }
  mesh() {
    const P = PS2, m = P.mesh(), arm = P.mesh(), fl = this.flashT > 0, F = (c) => (fl ? [240, 240, 240] : c);
    const PAPER = F([236, 230, 212]), PAPER2 = F([206, 196, 172]), FOLD = F([196, 158, 92]), BLUE = F([92, 120, 156]), GREEN = F([100, 128, 84]);
    const RED = F([184, 30, 42]), WOOD = F([116, 76, 44]), WOOD2 = F([150, 100, 58]), DARK = F([40, 36, 44]), EYE = [255, 60 + 140 * this.eye, 40];
    const Lg = (mm, x0, y0, z0, x1, y1, z1, w, h, col) => { // Rolle (gerolltes Formular): achteckiger Strang
      let dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      let sx = dz, sz = -dx; const sl = Math.hypot(sx, sz); if (sl < 1e-6) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
      const ux = -sz * dy, uy = sz * dx - sx * dz, uz = sx * dy;
      const ring = (px, py, pz) => Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) / 8 * Math.PI * 2, ca = Math.cos(a) * w / 2, sa = Math.sin(a) * h / 2; return P.vtx(mm, px + sx * ca + ux * sa, py + uy * sa, pz + sz * ca + uz * sa); });
      const A = ring(x0, y0, z0), E = ring(x1, y1, z1), C = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; P.face(mm, [A[i], A[j], E[j], E[i]], col.map(c => c * (i % 2 ? 1 : 0.9)), C); }
      P.face(mm, A, col, C); P.face(mm, E, col, C);
    };
    // Beine: gerollte Formulare mit rotem Band, Hufe als kleine Stempel mit roter Gummisohle; im Trab heben sich die Diagonalen
    for (const [lx, lz, off] of [[40, -18, 0], [40, 18, Math.PI], [-52, -18, Math.PI], [-52, 18, 0]]) {
      const ph = this.walk + off, lift = Math.max(0, Math.sin(ph)) * 8, sw = Math.cos(ph) * 5, front = lx > 0, up = front ? this.rear * 30 : 0;
      const kx = lx + sw * 0.5 + (front ? this.rear * 16 : 0), ky = 30 + lift * 0.6 + up * 0.5, hx = lx + sw + (front ? this.rear * 6 : 0), hy = 8 + lift + up;
      Lg(m, lx, 58, lz, kx, ky, lz, 16, 16, PAPER2); Lg(m, kx, ky, lz, hx, hy, lz, 12, 12, PAPER);
      P.box(m, (lx + kx) / 2, (58 + ky) / 2 - 2, lz, 17, 3, 17, RED);
      P.box(m, hx + 2, hy - 8, lz, 16, 7, 16, WOOD); P.box(m, hx + 2, hy - 10, lz, 16, 2, 16, RED, { e: 0.1, bottom: true });
    }
    // Rumpf: sieben Aktenordner Rücken an Rücken (bunte Rücken, Etikett und Griffloch zum Betrachter), oben ein Stapel loser Blätter
    const BIND = [FOLD, BLUE, PAPER2, GREEN, FOLD, BLUE, PAPER2];
    for (let i = 0; i < 7; i++) {
      const x = -62 + i * 18;
      P.box(m, x, 50, 0, 17, 42 + (i % 2) * 4, 50, BIND[i]);
      P.box(m, x, 62, -25.5, 8, 15, 1, PAPER); P.box(m, x, 80, -25.5, 4, 4, 1, DARK);
    }
    P.box(m, -8, 92, 0, 128, 5, 46, PAPER, { rot: 0.02 }); P.box(m, -6, 97, 2, 112, 3, 40, PAPER2, { rot: -0.03 }); // Blätterstapel
    P.box(m, -4, 48, 0, 8, 54, 54, RED); P.box(m, -4, 102, -9, 12, 6, 7, RED, { rot: 0.5 }); P.box(m, -4, 102, 9, 12, 6, 7, RED, { rot: -0.5 }); // Amtsband mit Schleife
    P.box(m, 58, 54, 0, 18, 42, 46, PAPER2); P.box(m, -80, 58, 0, 16, 34, 44, PAPER2);                  // Brust, Kruppe
    P.box(m, -40, 66, -26.5, 28, 13, 1, RED, { e: 0.05 }); P.box(m, -40, 68, -27.2, 22, 9, 1, F([236, 196, 190])); // Stempelabdruck auf der Flanke
    for (let i = 0; i < 5; i++) { const wv = Math.sin(this.t * 0.12 + i) * 6; P.beam(m, -86, 88 - i * 3, -8 + i * 4, -104 - i * 2, 42 + wv - i * 4, -10 + i * 5, 3, 1.5, i % 2 ? PAPER : PAPER2, { open: true }); } // Schweif aus Papierstreifen
    for (let i = 0, V = m.v; i < V.length; i += 3) { const q = this.tf(V[i], V[i + 1], V[i + 2]); V[i] = q[0]; V[i + 1] = q[1]; V[i + 2] = q[2]; } // aufbäumen, schräg drehen
    { const a = this.rear * 0.42, c = Math.cos(a), s = Math.sin(a); for (const fc of m.f) { const X = fc.n[0] * c - fc.n[1] * s, Y = fc.n[0] * s + fc.n[1] * c, [rx, rz] = this.rot(X, fc.n[2]); fc.n[0] = rx; fc.n[1] = Y; fc.n[2] = rz; } } // Normalen mitdrehen
    // Hals: Ziehharmonika-Ordner vom Widerrist zum Kopf (zieht sich beim Stempeln weit aus), Mähne aus flatternden Blättern
    const [nx, ny, nz] = this.tf(46, 94, 0), hx = this.head.x, hy = this.head.y;
    const ex = hx - 16, ey = hy + 2, len = Math.hypot(ex - nx, ey - ny), n = Math.max(4, Math.round(len / 9));
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 0.7) / n, X0 = nx + (ex - nx) * u0, Y0 = ny + (ey - ny) * u0, X1 = nx + (ex - nx) * u1, Y1 = ny + (ey - ny) * u1, Z0 = nz * (1 - u0), Z1 = nz * (1 - u1);
      P.beam(arm, X0, Y0, Z0, X1, Y1, Z1, 26 - 6 * u0, 22 - 4 * u0, i % 2 ? BLUE : FOLD);
      if (i % 2 === 0) { const fl2 = Math.sin(this.t * 0.2 + i * 1.3) * 0.5; P.box(arm, X0 - 3, Y0 + 11, Z0, 10, 10, 2, i % 4 ? PAPER : F([250, 248, 240]), { rot: fl2 }); }
    }
    // Kopf = Holzstempel mit Pferdegesicht: Gesicht, Maul, Nüstern, glühende Augen, Ohren, Griff mit Knauf, unten die rote Gummiplatte
    P.box(arm, hx, hy - 10, 0, 40, 22, 30, PAPER); P.box(arm, hx + 22, hy - 12, 0, 16, 14, 24, PAPER2);
    for (const z of [-7, 7]) P.box(arm, hx + 30.5, hy - 6, z, 1, 4, 4, DARK);
    for (const z of [-15.5, 15.5]) P.box(arm, hx + 8, hy + 2, z, 7, 5, 1, EYE, { e: 0.3 + this.eye * 0.9 });
    for (const z of [-9, 9]) P.cone(arm, hx - 8, hy + 12, z, 4, 11, 4, PAPER2);
    P.box(arm, hx, hy + 12, 0, 14, 10, 14, WOOD); P.box(arm, hx, hy + 22, 0, 22, 9, 22, WOOD2);
    P.box(arm, hx + 4, hy - 13, 0, 46, 3, 34, WOOD); P.box(arm, hx + 4, hy - 16, 0, 44, 3, 32, RED, { e: 0.12 + this.ink * 0.4, bottom: true });
    return [m, arm];
  }
  draw() { } // gezeichnet wird nach dem Licht (drawLit)
  drawLit(ctx) {
    const w = View.w, Hb = 208, VX = w / 2, D = Amtsschimmel.CAM_D;
    if (!this.buf || this.buf.w !== w) {
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = Hb; return c; }, c = mk(), o = mk();
      this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), o, ox: o.getContext('2d'), w };
    }
    const B = this.buf, ox = this.bx - W.cam.x, oy = this.gy - W.cam.y, fy = Math.round(oy);
    for (const mk of this.marks) { // roter Stempelabdruck am Boden, verblasst langsam
      const a = Math.min(1, mk.t / 40) * 0.55, x = Math.round(mk.x - W.cam.x);
      ctx.fillStyle = `rgba(200,24,40,${a.toFixed(2)})`; ctx.fillRect(x - 22, fy - 2, 44, 3); ctx.fillRect(x - 24, fy - 1, 2, 2); ctx.fillRect(x + 22, fy - 1, 2, 2);
    }
    if (this.state === 'raise' || this.state === 'hover' || this.state === 'slam') { // Schatten des Stempels
      const sx = Math.round(this.bx + this.head.x + 4 - W.cam.x), k = clamp(1 - (this.head.y - 15) / 150, 0.2, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.25 + 0.35 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(sx, fy - 1, 12 + 14 * k, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    B.x.clearRect(0, 0, w, Hb);
    PS2.render(B.x, w, Hb, this.mesh(), { x: VX - ox, y: oy - 60, z: -D, yaw: 0, pitch: 0, f: D, near: 30, cx: VX, cy: 60 }, Amtsschimmel.ENV);
    const O = B.ox; O.globalCompositeOperation = 'copy'; O.drawImage(B.c, 0, 0); O.globalCompositeOperation = 'source-in'; O.fillStyle = '#100c14'; O.fillRect(0, 0, w, Hb);
    const shake = this.dying ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(B.o, shake + dx, dy);
    ctx.drawImage(B.c, shake, 0);
    this.lastDraw = { s: { c: B.c, f: B.c, w, h: Hb }, x: W.cam.x, y: W.cam.y, flip: false };
  }
  // ---------------- Verhalten ----------------
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.wall + 80, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 150, tr(k), col); }
  vulnerable() { return this.state !== 'intro'; }
  headBox() { return { x: this.bx + this.head.x - 18, y: this.gy - this.head.y - 16, w: 48, h: 40 }; }
  reach(px) { return clamp(px - this.bx - 4, 70, Math.min(this.ax + this.aw - this.bx - 30, 270)); }
  update() {
    this.tick();
    const p = W.player, sp = this.ph2 ? 1.4 : 1, ease = (v, to, k) => v + (to - v) * k, h = this.head;
    if (p.alive && p.x < this.wall) { p.x = this.wall; if (p.vx < 0) p.vx = 0; } // vor der Brust ist Schluss
    for (const mk of this.marks) mk.t--;
    this.marks = this.marks.filter(mk => mk.t > 0);
    this.ink = Math.max(0, this.ink - 0.02);
    if (this.dying) {
      this.eye = ease(this.eye, 0, 0.05); h.y = ease(h.y, 20, 0.05); this.rear = ease(this.rear, 0, 0.1);
      if (this.dying % 3 === 0) W.spawn(new Particle(this.bx + rnd(-90, 60), this.gy - rnd(10, 110), rnd(-1.6, 1.6), rnd(-1.6, 0.2), Math.random() < 0.6 ? '#f0ead8' : '#c8a868', 60, 2, 0.05)); // lose Blätter
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { // nächste Instanz: Augen rot, schneller, Doppelstempel
      this.ph2 = true; W.flash = 8; W.shake = Math.max(W.shake, 14); Audio8.sfx('neigh'); Audio8.tempo(1.12); Input.rumble(0.7, 0.6, 500);
      this.say('bossAmtRage', '#fc7460');
    }
    const trot = this.state === 'idle' || this.state === 'snort' || this.state === 'blow';
    if (trot) this.walk += 0.13 * sp;
    if (!this.dying && this.t % 9 === 0 && this.state !== 'intro') W.spawn(new Particle(this.bx + rnd(-80, 50), this.gy - rnd(50, 105), rnd(-0.4, 0.4), rnd(-0.2, 0.4), '#f0ead8', 60, 1, 0.03)); // Aktenstaub
    const hb = this.headBox(); this.w = 40; this.h = 28; this.x = hb.x + 4; this.y = hb.y + 6;
    if (this.state === 'intro') { // erwacht: Blätter wirbeln herbei, Augen glimmen, Wiehern
      this.eye = clamp((this.timer - 20) / 40, 0, 1); h.x = ease(h.x, 74, 0.08); h.y = ease(h.y, 84 + Math.sin(this.timer * 0.2) * 8, 0.1);
      if (this.timer % 3 === 0) W.spawn(new Particle(this.bx + rnd(-100, 80), this.gy - rnd(0, 130), rnd(-1, 1), rnd(-1, 1), '#f0ead8', 30, 1, 0));
      if (this.timer === 56) { Audio8.sfx('neigh'); W.shake = 14; Input.rumble(0.6, 0.5, 500); this.say('bossAmtShout', '#f8b800'); }
      if (this.timer > 110) this.go('idle');
    } else if (this.state === 'idle') {
      this.eye = ease(this.eye, this.ph2 ? 0.9 : 0.4, 0.05); this.rear = ease(this.rear, 0, 0.1);
      h.x = ease(h.x, 74, 0.06); h.y = ease(h.y, 84 + Math.sin(this.t * 0.11) * 4, 0.08);
      if (this.timer > (this.ph2 ? 34 : 56)) {
        const r = Math.random();
        if (r < 0.42) { this.go('raise'); this.stamps = this.ph2 ? 2 : 1; Audio8.sfx('creak', this.bx); }
        else if (r < 0.74) { this.go('snort'); Audio8.sfx('hiss', this.bx); }
        else { this.go('rear'); Audio8.sfx('neigh', this.bx); }
      }
    } else if (this.state === 'raise') { // Stempel hebt sich über den Helden
      h.x = ease(h.x, this.reach(p.cx), 0.08); h.y = ease(h.y, 150, 0.08); this.eye = ease(this.eye, 1, 0.1);
      if (this.timer > (this.ph2 ? 22 : 32)) this.go('hover');
    } else if (this.state === 'hover') { // schwebt und folgt dem Helden – der Schatten wird dunkler
      h.x = ease(h.x, this.reach(p.cx), this.ph2 ? 0.07 : 0.045); h.y = ease(h.y, 150, 0.1);
      if (this.timer > (this.ph2 ? 14 : 24)) { this.go('slam'); Audio8.sfx('whoosh', this.bx + h.x); }
    } else if (this.state === 'slam') { // knallt herab: ABGELEHNT!
      h.y = Math.max(15, h.y - 12);
      if (p.alive && Phys.overlap(this.headBox(), p)) p.hurt(this.dmg + 1, this.bx + h.x);
      if (h.y <= 15) {
        const x = this.bx + h.x + 4;
        W.shake = 16; Audio8.sfx('stamp', x); Audio8.sfx('boom', x); Input.rumble(0.9, 0.7, 380);
        W.spawn(new Shock(x, this.gy - 4, 60, '#e83c3c', 4)); W.popup(x, this.gy - 40, tr('amtMark'), '#fc5c5c');
        for (let i = 0; i < 10; i++) W.spawn(new Particle(x + rnd(-22, 22), this.gy - 2, rnd(-1.8, 1.8), rnd(-2.2, -0.4), i % 2 ? '#d81830' : '#f0ead8', 30, 2, 0.12)); // Tinte und Blätter
        this.marks.push({ x, t: 300 }); this.ink = 1;
        if (--this.stamps > 0) this.go('raise'); else this.go('stuck');
      }
    } else if (this.state === 'stuck') { // steckt im Stempelkissen fest: jetzt treffbar
      h.y = 15 + (this.timer > 50 ? Math.sin(this.timer * 0.8) * 2 : 0); this.eye = ease(this.eye, 0.2, 0.1);
      if (this.timer % 12 === 0) W.spawn(new Particle(this.bx + h.x + rnd(-14, 18), this.gy - 20, rnd(-0.4, 0.4), -rnd(0.4, 0.9), '#f8f0d8', 26, 1, 0)); // Stempeldampf
      if (this.timer > (this.ph2 ? 56 : 76)) { this.go('idle'); Audio8.sfx('creak', this.bx + h.x); }
    } else if (this.state === 'snort') { // senkt den Kopf, bläht die Nüstern
      h.x = ease(h.x, 96, 0.08); h.y = ease(h.y, 44, 0.08);
      if (this.timer % 5 === 0) W.spawn(new Particle(this.bx + h.x + 30, this.gy - h.y + rnd(-4, 4), rnd(0.4, 1.2), rnd(-0.4, 0.4), '#e8e4d8', 20, 1, 0));
      if (this.timer > (this.ph2 ? 22 : 32)) { this.go('blow'); this.waves = this.ph2 ? 5 : 3; }
    } else if (this.state === 'blow') { // Formularsturm: Wellen abwechselnd tief (springen) und in Kopfhöhe (ducken)
      const gap = this.ph2 ? 20 : 26;
      if (this.timer % gap === 1 && this.waves > 0) {
        const low = this.waves % 2 === 1, y = this.gy - (low ? 7 : 26), v = this.ph2 ? 2.9 : 2.3;
        for (let i = 0; i < 2; i++) W.spawn(new EProj('page', this.bx + h.x + 28 + i * 10, y + rnd(-1.5, 1.5), v, 0, 0, this.dmg));
        Audio8.sfx('whoosh', this.bx + h.x); this.waves--;
      }
      if (this.waves <= 0 && this.timer > gap * (this.ph2 ? 5 : 3) + 20) this.go('idle');
    } else if (this.state === 'rear') { // bäumt sich auf und stampft: Akten fallen aus den Regalen
      if (this.timer < 40) { this.rear = ease(this.rear, 1, 0.08); h.y = ease(h.y, 120, 0.08); h.x = ease(h.x, 60, 0.08); }
      else this.rear = ease(this.rear, 0, 0.35);
      if (this.timer === 46) {
        W.shake = 14; Audio8.sfx('boom', this.bx); Input.rumble(0.6, 0.5, 400);
        const n = this.ph2 ? 6 : 4, x0 = this.wall + 14, x1 = this.ax + this.aw - 14;
        for (let i = 0; i < n; i++) W.spawn(new AmtFile(x0 + ((i + Math.random() * 0.8) / n) * (x1 - x0), this.gy, this.dmg));
      }
      if (this.timer > 72) this.go('idle');
    }
  }
  lightUp(L, cx, cy) {
    if (this.dying) return;
    const hx = this.bx + this.head.x - cx, hy = this.gy - this.head.y - cy;
    L.push({ x: hx, y: hy, r: 40, c: [240, 220, 180], a: 0.3 });
    if (this.eye > 0.1) L.push({ x: hx + 8, y: hy - 2, r: 16 + this.eye * 20, c: [255, 70, 40], a: 0.45 * this.eye });
    if (this.ink > 0.05) L.push({ x: hx + 4, y: hy + 16, r: 30, c: [255, 40, 50], a: 0.5 * this.ink });
  }
}
Amtsschimmel.YAW = -0.55; Amtsschimmel.CAM_D = 560; // Rumpf schräg zum Betrachter (Flanke mit den Etiketten zeigt nach vorn), ferne Kamera
Amtsschimmel.ENV = (() => { const n = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); }; return { sun: n([0.5, 0.7, -0.6]), sunC: [1.05, 0.95, 0.78], amb: [0.16, 0.15, 0.2], sky: [0.22, 0.24, 0.32], rim: n([-0.7, 0.5, 0.5]), rimC: [0.35, 0.4, 0.6], fog: [0, 0, 0], fogD: 0 }; })(); // Schreibtischlampe von rechts vorn, kühles Fensterlicht von hinten
