// Kirchturmhahn Kasimir (Zwischengegner auf der Himmelsbrücke): der Ur-Wetterhahn vom Kathedralenturm, mit abgerissenem Turmstab,
// Windkreuz und Turmknauf. Vater aller Wetterhähne (js/wetter.js).
//   gleiten  – schwebt über dem Steg, dreht sich im Wind
//   stoßen   – zielt wie eine Wetterfahne (Ziellinie), stößt geradeaus; rammt er den Steg, steckt er fest (Treffer ×1,5)
//   Windstoß – fliegt an den Rand, dreht sich auf dem Stab und bläst über den Steg: schiebt den Helden, Dachschiefer fliegt flach
//              (drüberspringen) oder hoch (unten bleiben)
//   Blitz    – kräht in den Himmel: Blitze schlagen an markierten Stellen auf dem Steg ein
// Ab halber Energie: Sturmwarnung, Regen, zwei kleine Wetterhähne, Blitze dreifach und zweimal. Bilder: tools/blender/kirchhahn_bl.py
'use strict';
const KIRCHHAHN_ART = (() => {
  const MAP = {"kirchhahn_glide0":[0,0,96,92],"kirchhahn_glide1":[97,0,96,92],"kirchhahn_crow":[194,0,96,92],"kirchhahn_dash":[291,0,96,92],"kirchhahn_spin45":[388,0,96,92],"kirchhahn_spin90":[485,0,96,92]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { glide: [fr('kirchhahn_glide0'), fr('kirchhahn_glide1')], crow: fr('kirchhahn_crow'), dash: fr('kirchhahn_dash'), spin45: fr('kirchhahn_spin45'), spin90: fr('kirchhahn_spin90') };
  };
  img.src = 'img/kirchhahn3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Schiefer extends Ent { // Dachschiefer im Windstoß: fliegt flach (drüberspringen) oder hoch (unten bleiben)
  constructor(x, y, d, dmg) { super(x - 6, y - 3, 12, 6); this.kind = 'eproj'; this.d = d; this.dmg = dmg; this.y0 = y; }
  update() {
    this.t++; this.x += this.d * (2.2 + Math.min(1.4, this.t * 0.03)); this.y = this.y0 - 3 + Math.sin(this.t * 0.2) * 2;
    const p = W.player; if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; Audio8.sfx('tink', this.cx); return; }
    if (this.t > 200 || this.x < W.arenaX - 16 || this.x > W.arenaX + W.arenaW + 16) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), a = this.t * 0.5 * this.d, c = Math.cos(a), s = Math.sin(a);
    const P = (u, v) => [x + u * c - v * s * 0.4, y + u * s * 0.4 + v * c];
    ctx.fillStyle = '#2c3440'; ctx.beginPath(); for (const [u, v] of [[-6, -3], [6, -3], [7, 2], [-5, 3]]) { const [px, py] = P(u, v); ctx.lineTo(px, py); } ctx.fill();
    ctx.fillStyle = '#6c7c90'; ctx.beginPath(); for (const [u, v] of [[-5, -2], [5, -2], [5, -1], [-5, 0]]) { const [px, py] = P(u, v); ctx.lineTo(px, py); } ctx.fill();
  }
}

class Blitzmal extends Ent { // markierte Stelle auf dem Steg: Warnung, dann schlägt der Blitz ein
  constructor(x, gy, warn, dmg) { super(x - 8, 0, 16, gy); this.kind = 'fx'; this.gx = x; this.gy = gy; this.warn = warn; this.dmg = dmg; this.pts = null; }
  update() {
    this.t++; const p = W.player;
    if (this.t < this.warn) { if (this.t % 6 === 0) W.spawn(new Particle(this.gx + rnd(-6, 6), this.gy - 2, 0, rnd(-1.2, -0.4), '#bfe0ff', 16, 1, 0)); return; }
    if (this.t === this.warn) { // Einschlag
      const top = W.cam.y + 20; this.pts = []; let x = this.gx + rnd(-10, 10);
      for (let y = top; y < this.gy; y += 10) { this.pts.push([x, y]); x += rnd(-7, 7); x = clamp(x, this.gx - 14, this.gx + 14); }
      this.pts.push([this.gx, this.gy]);
      Audio8.sfx('thunder', this.gx); Audio8.sfx('zap', this.gx); W.shake = Math.max(W.shake, 8); W.flash = Math.max(W.flash || 0, 4); Input.rumble(0.6, 0.4, 220);
      for (let i = 0; i < 10; i++) W.spawn(new Particle(this.gx, this.gy - 2, rnd(-2.2, 2.2), rnd(-2.6, -0.6), i % 2 ? '#fff4c0' : '#9cc8ff', 26, 2, 0.12));
    }
    if (this.t <= this.warn + 6 && p.alive && !p.hidden && Math.abs(p.cx - this.gx) < 11 && p.y < this.gy) p.hurt(this.dmg, this.gx);
    if (this.t > this.warn + 14) this.dead = true;
  }
  lightUp(L, cx, cy) { if (this.t >= this.warn) L.push({ x: this.gx - cx, y: this.gy - 40 - cy, r: 70, c: [190, 220, 255], a: 0.6 * (1 - (this.t - this.warn) / 15) }); else L.push({ x: this.gx - cx, y: this.gy - cy, r: 14 + 10 * this.t / this.warn, c: [160, 200, 255], a: 0.25 }); }
  draw(ctx) {
    const cx = W.cam.x, cy = W.cam.y;
    if (this.t < this.warn) { // blinkender Kreis auf den Planken, immer schneller
      const k = this.t / this.warn, on = ((this.t * (1 + k * 3)) | 0) % 8 < 5; if (!on) return;
      ctx.strokeStyle = k > 0.7 ? '#fff4c0' : '#9cc8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.round(this.gx - cx), Math.round(this.gy - cy) - 1, 10 - k * 3, 3, 0, 0, Math.PI * 2); ctx.stroke();
      return;
    }
    if (!this.pts) return; const a = 1 - (this.t - this.warn) / 15; ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.lineCap = 'round';
    for (const [w, col] of [[5, 'rgba(120,170,255,0.5)'], [2, '#fff8e0']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); this.pts.forEach(([x, y], i) => i ? ctx.lineTo(x - cx, y - cy) : ctx.moveTo(x - cx, y - cy)); ctx.stroke(); }
    ctx.restore();
  }
}

class Kasimir extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = 2; while (r < W.room.h - 1 && !Phys.solidTile(c, r)) r++;
    const gy = r * T;
    super(ax + aw - 90, gy - 220, 40, 62, 44, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 16000, nameKey: 'bossHahn', music: 'boss2', face: -1, ang: 0, dx: 0, dy: 0, ph2: false, last: '', seq: 0, gustDir: 1, volley: 0, lootY: gy - 30, kids: [] });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  get bx() { return this.cx; }           // Rumpfmitte (Drehpunkt), der Turmstab hängt darunter
  get by() { return this.y + 18; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { return super.hit(this.state === 'stuck' ? dmg * 1.5 : dmg, id); } // steckt im Steg: wehrlos
  hover() { return this.gy - 84 + Math.sin(this.t * 0.05) * 5; }
  aimAt(p) { const dx = p.cx - this.bx, dy = p.cy - this.by; if (Math.abs(dx) > 2) this.face = dx > 0 ? 1 : -1; this.ang = clamp(Math.atan2(dy, Math.max(1, Math.abs(dx))), -0.3, 1.15); }
  flyTo(tx, ty, sp) { const ex = tx - this.bx, ey = ty - this.by, L = Math.hypot(ex, ey); if (L < 1) return true; const v = Math.min(sp, L * 0.08 + 0.2); this.x += ex / L * v; this.y += ey / L * v; return L < 4; }
  update() {
    this.tick();
    if (this.dying) {
      if (this.dying === 1) for (const k of this.kids) if (!k.dead) k.kill();
      if (this.dying % 9 === 0) W.spawn(new Particle(this.bx + rnd(-16, 16), this.by + rnd(-10, 20), rnd(-1.6, 1.6), rnd(-2, 0), this.dying % 18 ? '#5c9a86' : '#e0b040', 40, 2, 0.12));
      this.ang *= 0.95; return this.updateDeath(120);
    }
    const p = W.player, dx = p.cx - this.bx, sp = this.ph2 ? 1.25 : 1, s = this.state, t = this.timer;
    if (!this.ph2 && this.hp <= this.maxHp / 2 && s !== 'stuck') { // Sturmwarnung: Regen, zwei Küken
      this.ph2 = true; W.popup(clamp(this.bx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 12, tr('hahnSturm'), '#bfe0ff'); Audio8.sfx('thunder', this.bx); Audio8.sfx('rooster', this.bx);
      if (W.storm) W.storm.cd = 0; W.shake = Math.max(W.shake, 10);
      if (typeof Wetter !== 'undefined' && Wetter.Wetterhahn) for (const fx of [0.2, 0.8]) { const k = new Wetter.Wetterhahn(this.ax + this.aw * fx, this.gy - 110); this.kids.push(k); W.spawn(k); }
    }
    if (this.ph2 && W.frame % 2 === 0) W.spawn(new Particle(W.cam.x + rnd(0, View.w), W.cam.y + 34, this.gustDir * 0.6, 4.6, '#8ca8d0', 34, 1, 0)); // Regen
    switch (s) {
      case 'intro': // senkt sich vom Himmel, kräht
        this.face = dx > 0 ? 1 : -1; this.flyTo(this.ax + this.aw - 80, this.hover(), 1.6);
        if (t === 50) { Audio8.sfx('rooster', this.bx); W.popup(clamp(this.bx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 12, tr('hahnCrow'), '#ffd060'); }
        if (t > 96) this.go('glide');
        break;
      case 'glide': { // schwebt dem Helden voraus, dreht sich im Wind
        this.face = dx > 0 ? 1 : -1; this.ang *= 0.85;
        this.flyTo(clamp(p.cx - this.face * 84, this.ax + 30, this.ax + this.aw - 30), this.hover(), 1.3 * sp);
        if (t > (this.ph2 ? 46 : 66)) {
          const order = this.ph2 ? ['aim', 'bolt', 'aim', 'gust', 'aim', 'bolt'] : ['aim', 'gust', 'aim', 'bolt'];
          const a = order[this.seq++ % order.length]; this.go(a === 'gust' ? 'gustGo' : a === 'bolt' ? 'boltGo' : 'aim');
          if (a === 'aim') Audio8.sfx('charge', this.bx);
        }
        break;
      }
      case 'aim': { // dreht sich zum Helden wie eine Wetterfahne, zuletzt steht der Winkel fest
        const AIM = this.ph2 ? 38 : 46, LOCK = 14;
        if (t < AIM - LOCK) { this.aimAt(p); this.flyTo(this.bx, this.hover(), 0.5); }
        if (t === AIM - LOCK) Audio8.sfx('select', this.bx);
        if (t >= AIM) { const v = (this.ph2 ? 5.6 : 5.0); this.dx = this.face * Math.cos(this.ang) * v; this.dy = Math.sin(this.ang) * v; this.go('dash'); Audio8.sfx('whoosh', this.bx); }
        break;
      }
      case 'dash': {
        this.x += this.dx; this.y += this.dy;
        if (t % 2 === 0) W.spawn(new Particle(this.bx - Math.sign(this.dx) * 14, this.by + rnd(-6, 6), -this.dx * 0.15, rnd(-0.3, 0.3), t % 4 ? '#5c9a86' : '#e8f0f0', 16, 2, 0));
        const wall = this.x <= this.ax + 2 || this.x + this.w >= this.ax + this.aw - 2, floor = this.y + this.h >= this.gy + 4;
        if (wall || floor) { // steckt im Steg (oder in der Wand)
          if (floor) this.y = this.gy + 4 - this.h; this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
          this.go('stuck'); Audio8.sfx('wall', this.bx); Audio8.sfx('crash', this.bx); W.shake = Math.max(W.shake, 12); Input.rumble(0.7, 0.5, 260);
          const hx = this.bx + this.face * 14, hy = floor ? this.gy : this.by;
          for (let i = 0; i < 12; i++) W.spawn(new Particle(hx + rnd(-8, 8), hy - 2, rnd(-2, 2), rnd(-2.6, -0.4), i % 3 ? '#8c6c4c' : '#e0b040', 30, 2, 0.14));
        } else if (t > 60) { this.go('glide'); }
        break;
      }
      case 'stuck': // zappelt; wehrlos, tut niemandem weh
        if (t % 10 === 0) W.spawn(new Particle(this.bx + rnd(-8, 8), this.y - 2, rnd(-0.5, 0.5), -0.6, '#ffe890', 22, 1, 0));
        if (t % 16 === 0) Audio8.sfx('creak', this.bx);
        if (t > (this.ph2 ? 62 : 84)) { this.go('pull'); Audio8.sfx('flap', this.bx); }
        break;
      case 'pull': // reißt sich los und steigt wieder auf
        this.ang *= 0.9; this.y -= 2.2; if (this.y + this.h < this.gy - 30 || t > 40) this.go('glide');
        break;
      case 'gustGo': { // an den Rand, der vom Helden weiter weg ist
        const left = p.cx > this.ax + this.aw / 2, tx = left ? this.ax + 34 : this.ax + this.aw - 34;
        this.ang *= 0.85; this.face = left ? 1 : -1; this.gustDir = this.face;
        if (this.flyTo(tx, this.gy - 84, 2.0 * sp) || t > 70) { this.go('gust'); Audio8.sfx('spin', this.bx); }
        break;
      }
      case 'gust': { // dreht sich auf dem Stab, dann bläst er: der Held wird geschoben, Dachschiefer fliegt mit
        const SPIN = 28, LEN = this.ph2 ? 150 : 130;
        this.flyTo(this.bx, this.gy - 84, 0.6);
        if (t >= SPIN) {
          if (p.alive && !p.hidden && Math.abs(p.feet - this.gy) < 80) Phys.moveX(p, this.gustDir * (p.onGround ? 0.8 : 1.05));
          if (t % 2 === 0) W.spawn(new Particle(this.gustDir > 0 ? W.cam.x + rnd(0, 40) : W.cam.x + View.w - rnd(0, 40), this.gy - rnd(6, 90), this.gustDir * rnd(4, 6.5), 0, '#e8f0f8', 30, 1, 0));
          const every = this.ph2 ? 20 : 26;
          if ((t - SPIN) % every === 0 && t < LEN - 20) { const high = ((t - SPIN) / every | 0) % 3 === 2; W.spawn(new Schiefer(this.bx + this.gustDir * 18, high ? this.gy - 38 : this.gy - 7, this.gustDir, this.dmg)); Audio8.sfx('whoosh', this.bx); }
          if (t % 30 === 0) Audio8.sfx('flap', this.bx);
        }
        if (t > LEN) this.go('glide');
        break;
      }
      case 'boltGo': // in die Mitte, hoch hinauf
        this.ang *= 0.85; this.face = dx > 0 ? 1 : -1;
        if (this.flyTo(this.ax + this.aw / 2, this.gy - 118, 2.0 * sp) || t > 60) { this.go('crow'); this.volley = 0; }
        break;
      case 'crow': // kräht in den Himmel, Blitze schlagen an markierten Stellen ein
        this.face = dx > 0 ? 1 : -1;
        if (t === 4) { Audio8.sfx('rooster', this.bx); W.popup(clamp(this.bx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 12, tr('hahnCrow'), '#ffd060'); if (W.storm) W.storm.cd = 0; }
        if (t === 14) {
          const n = this.ph2 ? 3 : 2, xs = [clamp(p.cx, this.ax + 14, this.ax + this.aw - 14)];
          for (let k = 0; xs.length < n && k < 40; k++) { const x = clamp(p.cx + rnd(-110, 110), this.ax + 14, this.ax + this.aw - 14); if (xs.every(o => Math.abs(o - x) > 44)) xs.push(x); }
          xs.forEach((x, i) => W.spawn(new Blitzmal(x, this.gy, 50 + i * 6, this.dmg + 1)));
        }
        if (t > 80) { if (this.ph2 && ++this.volley < 2) this.timer = 8; else this.go('glide'); }
        break;
    }
    if (this.state !== 'dash' && this.state !== 'stuck') { this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2); if (this.y + this.h > this.gy) this.y = this.gy - this.h; }
    if (!['intro', 'stuck', 'pull'].includes(this.state)) this.touch();
  }
  lightUp(L, cx, cy) {
    L.push({ x: this.bx + this.face * 18 - cx, y: this.by - 20 - cy, r: 18, c: [255, 210, 120], a: 0.2 }); // Augen
    if (this.state === 'aim' || this.state === 'crow') { const t = this.tip(); L.push({ x: t[0] - cx, y: t[1] - cy, r: 26, c: [255, 160, 80], a: 0.45 }); }
    L.push({ x: this.bx - cx, y: this.by + 40 - cy, r: 20, c: [240, 200, 90], a: 0.12 }); // Turmknauf
  }
  tip() { // Pfeilspitze (Bild: 37 vor, 21 unter dem Drehpunkt), mitgedreht
    const r = this.face * this.ang, lx = this.face * 37, ly = 21; return [this.bx + lx * Math.cos(r) - ly * Math.sin(r), this.by + lx * Math.sin(r) + ly * Math.cos(r)];
  }
  drawAim(ctx) { // blinkende Ziellinie ab der Pfeilspitze
    const AIM = this.ph2 ? 38 : 46, LOCK = 14, t = this.timer; if (t < 6) return; const locked = t >= AIM - LOCK; if (!locked && (t >> 2) & 1) return;
    const ux = this.face * Math.cos(this.ang), uy = Math.sin(this.ang), [tx, ty] = this.tip(); ctx.fillStyle = locked ? ((t >> 1) & 1 ? '#fff0c0' : '#ff9040') : '#c89060';
    for (let d = 4; d < 170; d += 7) { if (locked && d > 4 + (t - (AIM - LOCK)) * 16) break; ctx.fillRect(Math.round(tx + ux * d - W.cam.x), Math.round(ty + uy * d - W.cam.y), 2, 2); }
  }
  draw(ctx) {
    const S = KIRCHHAHN_ART.get(); if (!S) return;
    if (this.state === 'aim') this.drawAim(ctx);
    const s = this.state, t = this.timer; let spr = S.glide[(this.t >> 4) & 1], flip = this.face < 0;
    if (s === 'aim' || s === 'crow') spr = S.crow; else if (s === 'dash' || s === 'stuck') spr = S.dash;
    else if (s === 'gust' && t < 28) { const k = (t >> 2) % 8; spr = [S.glide[0], S.spin45, S.spin90, S.spin45, S.glide[0], S.spin45, S.spin90, S.spin45][k]; flip = (k >= 3 && k <= 6) !== (this.face < 0); }
    else if (s === 'gust') spr = S.glide[(this.t >> 2) & 1];
    let rot = this.face * this.ang; if (s === 'stuck') rot += Math.sin(t * 0.9) * 0.1 * Math.max(0, 1 - t / 40);
    const fl = this.flashT > 0 && (this.flashT & 2), sx = Math.round(this.bx - W.cam.x), sy = Math.round(this.by - W.cam.y);
    if (Math.abs(rot) < 0.02) { this.ds(ctx, spr, sx - 48, sy - 34, flip, fl); return; }
    this.lastDraw = { s: spr, x: sx - 48 + W.cam.x, y: sy - 34 + W.cam.y, flip, f: W.frame };
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); Sprites.draw(ctx, spr, -48, -34, flip, fl); ctx.restore();
  }
}
