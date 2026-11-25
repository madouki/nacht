// Walross Waldemar (Zwischengegner im Eiskeller unter der Eisrutsche): der Kellermeister – Monokel, Schnauzbart, Strickschal.
// Er hält Mittagsschlaf zwischen den eingefrorenen Weinflaschen, und wer ihn weckt, bekommt es mit 1,4 Tonnen Speck zu tun.
//   Bauchrutscher – holt Schwung (Strich am Boden zeigt die Bahn) und schlittert übers Eis; an der Wand ist er benommen,
//                   dann sitzen Treffer doppelt (Ab halber Energie prallt er einmal ab und rutscht zurück)
//   Stampfer      – richtet sich auf und rammt die Stoßzähne ins Eis: Eiswellen laufen nach beiden Seiten (drüberspringen)
//   Eisblock      – wirft gefrorene Kellerware im Bogen; der Block zerspringt in drei schlitternde Splitter
//   Hatschi       – ab halber Energie: holt tief Luft (der Sog zieht den Helden heran, dagegen anlaufen) und niest Eissplitter
// Bilder: tools/blender/walross_bl.py (idle0, idle1, slide, rear, slam, clap; 96×56, Blick nach rechts). Lied: 'walross'
'use strict';
const WALROSS_ART = (() => {
  const MAP = {"walross_idle0":[0,0,96,56],"walross_idle1":[97,0,96,56],"walross_slide":[194,0,96,56],"walross_rear":[291,0,96,56],"walross_slam":[388,0,96,56],"walross_clap":[485,0,96,56]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['idle0', 'idle1', 'slide', 'rear', 'slam', 'clap']) S[k] = fr('walross_' + k);
  };
  img.src = 'img/walross3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Eiswelle extends Ent { // Eiszacken, die am Boden entlangrasen
  constructor(x, gy, dir, dmg, v) { super(x - 6, gy - 14, 12, 14); this.kind = 'eproj'; this.gy = gy; this.dir = dir; this.dmg = dmg; this.v = v || 3.2; }
  update() {
    this.t++; this.x += this.dir * this.v; const p = W.player;
    if (this.t % 2 === 0) W.spawn(new Particle(this.cx, this.gy - 2, -this.dir * rnd(0.2, 1), rnd(-1.6, -0.4), this.t % 4 ? '#c8ecfc' : '#fcfcfc', 18, 1, 0.1));
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.x < W.arenaX - 4 || this.x + this.w > W.arenaX + W.arenaW + 4 || this.t > 200) { this.dead = true; Audio8.sfx('tink', this.cx); }
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.gy - W.cam.y), k = 0.75 + 0.25 * Math.sin(this.t * 0.6);
    for (let i = -1; i <= 1; i++) { const h = Math.round((i === 0 ? 14 : 9) * k), bx = x + i * 5;
      ctx.fillStyle = '#1c3c5c'; ctx.beginPath(); ctx.moveTo(bx - 4, y); ctx.lineTo(bx, y - h - 1); ctx.lineTo(bx + 4, y); ctx.fill();
      ctx.fillStyle = '#a8dcf8'; ctx.beginPath(); ctx.moveTo(bx - 3, y); ctx.lineTo(bx, y - h); ctx.lineTo(bx + 3, y); ctx.fill();
      ctx.fillStyle = '#f0fcff'; ctx.fillRect(bx - 1, y - h + 2, 1, Math.max(1, h - 4)); }
  }
}

class Eissplitter extends Ent { // Bruchstück der Eisscholle: schlittert über den Boden und schmilzt
  constructor(x, gy, vx, dmg) { super(x - 4, gy - 5, 8, 5); this.kind = 'eproj'; this.vx = vx; this.dmg = dmg; this.gy = gy; }
  update() {
    this.t++; this.x += this.vx; this.vx *= 0.985; const p = W.player;
    if (this.x < W.arenaX + 2 || this.x + this.w > W.arenaX + W.arenaW - 2) this.vx = -this.vx * 0.6;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; Audio8.sfx('tink', this.cx); return; }
    if (this.t > 110) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.gy - W.cam.y); ctx.globalAlpha = Math.min(1, (110 - this.t) / 25);
    ctx.fillStyle = '#1c3c5c'; ctx.fillRect(x - 1, y - 6, 10, 6); ctx.fillStyle = '#b8e4fc'; ctx.fillRect(x, y - 5, 8, 5); ctx.fillStyle = '#f0fcff'; ctx.fillRect(x + 1, y - 5, 3, 1);
    ctx.globalAlpha = 1;
  }
}

class Eisscholle extends Ent { // gefrorene Kellerware: ein Eisblock mit einer Weinflasche darin, fliegt im Bogen
  constructor(x, y, vx, vy, gy, dmg) { super(x - 7, y - 6, 14, 12); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.gy = gy; this.dmg = dmg; this.rot = 0; }
  update() {
    this.t++; this.vy += 0.2; this.x += this.vx; this.y += this.vy; this.rot += this.vx * 0.06; const p = W.player;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.burst(); return; }
    if (this.y + this.h >= this.gy) this.burst();
    if (this.t > 200) this.dead = true;
  }
  burst() {
    this.dead = true; Audio8.sfx('crash', this.cx); W.shake = Math.max(W.shake, 4);
    for (const v of [-2.2, 0.4, 2.4]) W.spawn(new Eissplitter(this.cx, this.gy, v + rnd(-0.3, 0.3), this.dmg));
    for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.gy - 4, rnd(-2, 2), rnd(-2.6, -0.6), i % 3 ? '#c8ecfc' : '#3c7c4c', 26, 2, 0.14)); // Eis und Flaschenglas
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.rot);
    ctx.fillStyle = '#1c3c5c'; ctx.fillRect(-8, -7, 16, 14); ctx.fillStyle = 'rgba(168,220,248,0.92)'; ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = '#2c5c34'; ctx.fillRect(-2, -3, 4, 8); ctx.fillRect(-1, -5, 2, 2); ctx.fillStyle = '#e8d8a8'; ctx.fillRect(-2, 0, 4, 2); // Flasche mit Etikett
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-6, -5, 2, 6);
    ctx.restore();
  }
}

class Waldemar extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = W.room.h - 1; while (r > 1 && Phys.solidTile(c, r - 1)) r--; // Boden von unten her (darüber hängen Simse)
    const gy = r * T;
    super(ax + aw - 112, gy - 34, 76, 34, 46, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 15000, nameKey: 'bossWalross', music: 'walross', face: -1, ph2: false, vx: 0, n: 0, bounce: 0, speckSaid: false, lootY: gy - 24 });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { // benommen an der Wand: auf die Speckschwarte sitzt es doppelt
    const daze = this.state === 'daze', ok = super.hit(daze ? dmg * 2 : dmg, id);
    if (ok && daze && !this.speckSaid) { this.speckSaid = true; W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 20, tr('walrossSpeck'), '#f8d878'); }
    return ok;
  }
  wallHit() { return this.x <= this.ax + 3 || this.x + this.w >= this.ax + this.aw - 3; }
  update() {
    this.tick();
    if (this.dying) { if (this.dying % 9 === 0) W.spawn(new Particle(this.cx + rnd(-34, 34), this.y + rnd(0, 20), rnd(-1, 1), rnd(-1.6, -0.2), '#c8ecfc', 34, 2, 0.1)); return this.updateDeath(110); }
    const p = W.player, s = this.state, t = this.timer;
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 20, tr('walrossWut'), '#a8dcf8'); Audio8.sfx('roar', this.cx); W.shake = Math.max(W.shake, 8); }
    switch (s) {
      case 'intro': // schnarcht – dann weckt ihn der Held
        if (t % 40 === 0) Audio8.sfx('snore', this.cx);
        if (t === 70) { W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 20, tr('walrossWach'), '#fcfcfc'); Audio8.sfx('growl', this.cx); W.shake = Math.max(W.shake, 4); }
        if (t > 110) this.go('idle');
        break;
      case 'idle': {
        this.face = Math.sign(p.cx - this.cx) || this.face; this.vx = 0;
        if (t > (this.ph2 ? 30 : 46)) {
          this.n++; const far = Math.abs(p.cx - this.cx) > 150;
          this.go(this.ph2 && this.n % 4 === 0 ? 'clap' : far && this.n % 2 ? 'throw' : this.n % 3 === 1 ? 'rear' : 'windup');
          this.bounce = this.ph2 ? 1 : 0;
        }
        break;
      }
      case 'windup': // holt Schwung: schiebt sich zurück, der Strich am Boden zeigt die Bahn
        if (t < 16) this.x -= this.face * 0.35;
        if (t === 2) Audio8.sfx('growl', this.cx);
        if (t > 20) { this.go('slide'); this.vx = this.face * (this.ph2 ? 5.8 : 5.2); Audio8.sfx('whoosh', this.cx); }
        break;
      case 'slide': // Bauchrutscher übers Eis
        this.x += this.vx; this.vx *= 0.994;
        if (t % 2 === 0) W.spawn(new Particle(this.cx - this.face * 36, this.gy - 2, -this.face * rnd(0.6, 2), rnd(-1.8, -0.4), t % 4 ? '#e0f4fc' : '#fcfcfc', 20, 2, 0.1)); // Eisspray
        if (this.wallHit()) {
          W.shake = Math.max(W.shake, 10); Audio8.sfx('wall', this.cx); Input.rumble(0.6, 0.4, 220);
          for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx + this.face * 38, this.gy - rnd(4, 26), -this.face * rnd(0.5, 2), rnd(-2, 0), '#c8ecfc', 24, 2, 0.12));
          if (this.bounce > 0) { this.bounce--; this.vx = -this.vx * 0.85; this.face = -this.face; this.x += this.vx * 2; }
          else this.go('daze');
        } else if (Math.abs(this.vx) < 1.2 || t > 160) this.go('idle');
        break;
      case 'rear': // richtet sich auf (Ansage), dann der Stampfer
        if (t === 1) Audio8.sfx('growl', this.cx);
        if (t > 16) this.go('slam');
        break;
      case 'slam': { // Stoßzähne ins Eis: Eiswellen nach beiden Seiten (in Phase 2 eine zweite, schnellere Welle)
        const wave = (v) => { for (const d of [-1, 1]) W.spawn(new Eiswelle(this.cx + this.face * 30 + d * 10, this.gy, d, this.dmg, v)); W.shake = Math.max(W.shake, 12); Audio8.sfx('boom', this.cx); Input.rumble(0.7, 0.5, 260); for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + this.face * 30, this.gy - 3, rnd(-2.4, 2.4), rnd(-3, -0.8), '#e0f4fc', 26, 2, 0.15)); };
        if (t === 4) wave(3.0);
        if (this.ph2 && t === 34) wave(4.0);
        if (t > (this.ph2 ? 60 : 40)) this.go('idle');
        break;
      }
      case 'throw': // Kellerware im Bogen zum Helden
        if (t === 14) {
          const hx = this.cx + this.face * 30, hy = this.y - 8, tx = clamp(p.cx, this.ax + 14, this.ax + this.aw - 14), tA = 44, g = 0.2;
          W.spawn(new Eisscholle(hx, hy, (tx - hx) / tA, (this.gy - 6 - hy - 0.5 * g * tA * tA) / tA, this.gy, this.dmg)); Audio8.sfx('throw', this.cx);
        }
        if (this.ph2 && t === 30) { const hx = this.cx + this.face * 30, hy = this.y - 8, tx = clamp(p.cx + this.face * 50, this.ax + 14, this.ax + this.aw - 14), tA = 40, g = 0.2; W.spawn(new Eisscholle(hx, hy, (tx - hx) / tA, (this.gy - 6 - hy - 0.5 * g * tA * tA) / tA, this.gy, this.dmg)); Audio8.sfx('throw', this.cx); }
        if (t > (this.ph2 ? 50 : 40)) this.go('idle');
        break;
      case 'clap': // holt tief Luft (der Sog zieht den Helden heran) – und niest: HATSCHI! Eissplitter schießen nach vorn
        this.face = Math.sign(p.cx - this.cx) || this.face;
        if (t < 96) {
          if (t % 16 === 0) Audio8.sfx('snore', this.cx);
          if (p.alive && t > 10) { const dx = this.cx - p.cx; if (Math.abs(dx) < 300) p.x += Math.sign(dx) * 0.8 * (1 - Math.abs(dx) / 340); }
          if (t % 2 === 0) { const sx = this.cx + this.face * rnd(60, 240), sy = this.gy - rnd(4, 70); W.spawn(new Particle(sx, sy, -this.face * rnd(1.8, 3.2), (this.y + 6 - sy) / 50, '#f0faff', 24, 1, 0)); } // Luft und Schnee strömen zum Maul
        }
        if (t === 96) {
          W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 20, tr('walrossHatschi'), '#fcfcfc'); Audio8.sfx('sneeze', this.cx); W.shake = Math.max(W.shake, 10);
          for (const v of [3.2, 4.4, 5.6]) W.spawn(new Eissplitter(this.cx + this.face * 40, this.gy, this.face * v, this.dmg));
          for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx + this.face * 40, this.y + 8, this.face * rnd(1, 4), rnd(-1.4, 1), '#f0faff', 28, 2, 0.04));
        }
        if (t > 124) this.go('idle');
        break;
      case 'daze': // benommen an der Wand
        if (t % 12 === 0) W.spawn(new Particle(this.cx + this.face * 30 + rnd(-4, 4), this.y - 6, rnd(-0.4, 0.4), -0.6, '#ffe890', 20, 1, 0));
        if (t > (this.ph2 ? 56 : 74)) this.go('idle');
        break;
    }
    this.h = this.state === 'slide' || this.state === 'daze' ? 18 : 34; // flach auf dem Bauch: man kommt drüber
    this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2); this.y = this.gy - this.h;
    if (!['intro', 'daze'].includes(this.state)) this.touch();
  }
  pose() {
    const s = this.state, t = this.timer;
    if (s === 'slide' || s === 'daze') return 'slide';
    if (s === 'rear') return 'rear';
    if (s === 'slam') return t < 4 ? 'rear' : t < 26 ? 'slam' : 'idle0';
    if (s === 'throw') return t < 14 ? 'rear' : t < 24 ? 'clap' : 'idle0';
    if (s === 'clap') return t < 90 ? (t >> 4) & 1 ? 'clap' : 'rear' : t < 112 ? 'slam' : 'idle0';
    if (s === 'windup') return (t >> 2) & 1 ? 'idle1' : 'idle0';
    return ((this.t / 24) | 0) & 1 ? 'idle1' : 'idle0';
  }
  draw(ctx) {
    const S = WALROSS_ART.get();
    if (this.state === 'windup' && (this.t >> 2) & 1) { // Bahn des Bauchrutschers
      ctx.fillStyle = 'rgba(200,236,252,0.55)'; const x0 = Math.round(this.cx - W.cam.x), x1 = Math.round((this.face > 0 ? this.ax + this.aw : this.ax) - W.cam.x), y = Math.round(this.gy - W.cam.y) - 1;
      ctx.fillRect(Math.min(x0, x1), y, Math.abs(x1 - x0), 1);
    }
    if (!S) { ctx.fillStyle = '#7c4e3c'; ctx.fillRect(Math.round(this.x - W.cam.x), Math.round(this.y - W.cam.y), this.w, this.h); return; }
    const jig = this.state === 'daze' || this.state === 'windup' ? ((this.t >> 1) & 1) * 2 - 1 : 0;
    this.spr(ctx, S[this.pose()], this.face < 0, jig, 1, this.flashT > 0 && (this.flashT & 2));
    const hx = Math.round(this.cx + this.face * 30 - W.cam.x), hy = Math.round(this.y - 18 - W.cam.y);
    if (this.state === 'intro' && this.timer < 70) { const k = (this.t % 60) / 60; Font.draw(ctx, 'Z', hx + 6 + Math.round(k * 10), hy - Math.round(k * 12), '#c8e0ff', { shadow: '#000' }); }
    else if (this.state === 'daze') Font.draw(ctx, '@', hx, hy, '#ffe890', { align: 'center', shadow: '#000' });
  }
}
