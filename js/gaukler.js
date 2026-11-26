// Lunatus, der Mondgaukler (Endboss der Mondfeste auf der Mondinsel, Raum pfad_f): ein Narr mit Mondsichel-Gesicht, der auf einer
// Sternenkugel balanciert. Er tritt jeden Abend auf – Publikum hatte er seit dreihundert Jahren keins.
//   Rollen      – rollt auf der Kugel quer durch die Arena (drüberspringen); prallt er gegen die Wand, ist er benommen
//                 (Treffer zählen anderthalbfach)
//   Jonglieren  – jongliert drei Sterne (im zweiten Akt fünf) und wirft sie im Bogen; sie springen zweimal auf
//   Hopser      – springt mit der Kugel zum Helden, beim Aufprall laufen Mondwellen nach beiden Seiten (drüberspringen)
//   Von oben    – ein Abwärtshieb auf die Kappe trifft doppelt und federt den Helden wieder hoch
//   Zweiter Akt – ab halber Energie rollen beim Rollen zwei Spiegelbilder mit (ohne Schatten, durchscheinend, harmlos nur für
//                 Leute, die sie nicht berühren)
// Bilder: tools/blender/gaukler_bl.py → pack_gaukler.py (Figur 48×66, Kugel 34×34). Lied: 'gaukler'
'use strict';
const GAUKLER_ART = (() => {
  const MAP = {"gk_idle0":[0,0,48,66],"gk_idle1":[49,0,48,66],"gk_roll":[98,0,48,66],"gk_juggle0":[147,0,48,66],"gk_juggle1":[196,0,48,66],"gk_throw":[245,0,48,66],"gk_hop":[294,0,48,66],"gk_dizzy":[343,0,48,66],"gk_bow":[392,0,48,66],"gk_ball0":[0,67,34,34],"gk_ball1":[35,67,34,34],"gk_ball2":[70,67,34,34],"gk_ball3":[105,67,34,34]};
  const POSES = ['idle0', 'idle1', 'roll', 'juggle0', 'juggle1', 'throw', 'hop', 'dizzy', 'bow'];
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of POSES) S[k] = fr('gk_' + k); for (let i = 0; i < 4; i++) S['ball' + i] = fr('gk_ball' + i);
  };
  img.src = 'img/gaukler3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();
function gauklerStar(ctx, x, y, r, rot, col) { // fünfzackiger Stern mit dunklem Rand
  const path = (R) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? R * 0.45 : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };
  ctx.fillStyle = '#20141c'; path(r + 1.2); ctx.fill(); ctx.fillStyle = col; path(r); ctx.fill(); ctx.fillStyle = '#fffbe0'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}
class Jonglierstern extends Ent { // geworfener Stern: Bogen, zweimal aufspringen, dann zerplatzen
  constructor(x, y, vx, vy, gy, dmg) { super(x - 5, y - 5, 10, 10); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.gy = gy; this.dmg = dmg; this.b = 0; }
  update() {
    this.t++; this.vy += 0.2; this.x += this.vx; this.y += this.vy; const p = W.player;
    if (this.y + this.h >= this.gy) { this.y = this.gy - this.h; if (++this.b > 2) { this.dead = true; W.spawn(new Spark(this.cx, this.cy)); return; } this.vy = -Math.abs(this.vy) * 0.62; Audio8.sfx('tink', this.cx); }
    if (this.x < W.arenaX || this.x + this.w > W.arenaX + W.arenaW) { this.vx = -this.vx; this.x = clamp(this.x, W.arenaX, W.arenaX + W.arenaW - this.w); }
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; }
    if (this.t > 400) this.dead = true;
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 16, c: [255, 220, 120], a: 0.35 }); }
  draw(ctx) { gauklerStar(ctx, this.cx - W.cam.x, this.cy - W.cam.y, 6, this.t * 0.25, '#f8d048'); }
}
class Mondwelle extends Ent { // Funkenwelle am Boden nach dem Hopser
  constructor(x, gy, dir, dmg) { super(x - 6, gy - 12, 12, 12); this.kind = 'eproj'; this.gy = gy; this.dir = dir; this.dmg = dmg; }
  update() {
    this.t++; this.x += this.dir * 2.8; const p = W.player;
    if (this.t % 2 === 0) W.spawn(new Particle(this.cx, this.gy - 3, -this.dir * rnd(0.2, 0.9), rnd(-1.6, -0.4), this.t % 4 ? '#f8d048' : '#a8c8fc', 16, 1, 0.1));
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.x < W.arenaX - 4 || this.x + this.w > W.arenaX + W.arenaW + 4 || this.t > 200) this.dead = true;
  }
  draw(ctx) { const x = this.cx - W.cam.x, y = this.gy - W.cam.y - 6; gauklerStar(ctx, x, y, 5 + Math.sin(this.t * 0.6), this.t * 0.4, '#fce890'); }
}
class Spiegelbild extends Ent { // Trugbild im zweiten Akt: rollt mit, ohne Schatten, verblasst danach
  constructor(boss, x, dir, wait) { super(x - 14, boss.gy - 92, 28, 92); this.kind = 'fx'; this.boss = boss; this.dir = dir; this.wait = wait; this.spin = 0; this.fade = 0; }
  update() {
    this.t++; const b = this.boss, p = W.player;
    if (b.dead || b.dying) { this.dead = true; return; }
    if (this.t > this.wait && !this.fade) {
      this.x += this.dir * (b.ph2 ? 3.6 : 3.0); this.spin += 3.6;
      if (this.x <= W.arenaX + 2 || this.x + this.w >= W.arenaX + W.arenaW - 2) { this.fade = 1; W.spawn(new Shock(this.cx, this.cy + 20, 30, '#a8c8fc', 2)); Audio8.sfx('ghost', this.cx); }
    }
    if (this.fade && ++this.fade > 30) this.dead = true;
    if (!this.fade && this.t > this.wait && p.alive && !p.hidden && Phys.overlap({ x: this.x + 4, y: this.y + 60, w: this.w - 8, h: 32 }, p)) p.hurt(b.dmg, this.cx);
  }
  draw(ctx) {
    const S = GAUKLER_ART.get(); if (!S) return;
    ctx.save(); ctx.globalAlpha = (this.t < 16 ? this.t / 16 : 1) * (this.fade ? 1 - this.fade / 30 : 1) * (0.5 + 0.1 * Math.sin(this.t * 0.3)); ctx.filter = 'hue-rotate(40deg) brightness(1.2)';
    Lunatus.paint(ctx, S, this.cx, this.y + this.h, this.t > this.wait ? 'roll' : 'idle0', this.spin, this.dir < 0, false);
    ctx.restore();
  }
}
class Lunatus extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = W.room.h - 1; while (r > 1 && Phys.solidTile(c, r - 1)) r--;
    const gy = r * T;
    super(ax + aw - 80, gy - 92, 28, 92, 56, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 18000, nameKey: 'bossGaukler', music: 'gaukler', face: -1, ph2: false, n: 0, vy: 0, spin: 0, dizzies: 0, stomps: 0, lootY: gy - 24 });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  say(key, col) { W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 14, tr(key), col); }
  hit(dmg, id) {
    const p = W.player, top = p.atkT > 0 && !p.onGround && (p.atkDir === 'down' || p.atkDir === 'downd') && p.feet < this.y + 40;
    const k = top ? 1.8 : this.state === 'dizzy' ? 1.5 : 1;
    const r = super.hit(dmg * k, id);
    if (r && top) { // auf die Kappe: der Held federt hoch
      p.vy = Math.min(p.vy, -4.6); this.stomps++; Audio8.sfx('squeak', this.cx); W.spawn(new Shock(this.cx, this.y + 6, 24, '#f8d048', 2));
      if (this.stomps === 1) this.say('gauklerKappe', '#fce890');
    }
    return r;
  }
  update() {
    this.tick();
    if (this.dying === 2 && !(typeof Rausch !== 'undefined' && Rausch.on) && typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('pfad_gaukler');
    if (this.dying) { if (this.dying % 4 === 0) W.spawn(new Particle(this.cx + rnd(-14, 14), this.y + rnd(0, 80), rnd(-1, 1), rnd(-1.6, -0.2), ['#f8d048', '#2c3ca8', '#c8ccdc'][(this.dying / 4) % 3], 40, 2, 0.1)); return this.updateDeath(110); }
    const p = W.player, s = this.state, t = this.timer, d = Math.abs(p.cx - this.cx);
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; this.say('gauklerWut', '#ffb27c'); Audio8.sfx('laugh', this.cx); W.flash = 6; }
    switch (s) {
      case 'intro': // Auftritt: Sterne stieben, Verbeugung
        if (t % 6 === 0 && t < 60) W.spawn(new Particle(this.cx + rnd(-20, 20), this.y + rnd(0, 40), rnd(-0.6, 0.6), rnd(-1.2, -0.2), t % 12 ? '#f8d048' : '#a8c8fc', 30, 1, 0.03));
        if (t === 10) Audio8.sfx('bell', this.cx);
        if (t === 30) this.say('gauklerHallo', '#fce890');
        if (t > 90) this.go('idle');
        break;
      case 'idle': {
        this.face = Math.sign(p.cx - this.cx) || this.face;
        const v = this.ph2 ? 0.7 : 0.5, x0 = this.x;
        if (d > 120) this.x += this.face * v; else if (d < 60) this.x -= this.face * v;
        this.spin += (this.x - x0) * 2;
        if (t > (this.ph2 ? 34 : 50)) {
          const seq = ['roll', 'juggle', 'hop']; const next = seq[this.n++ % 3];
          this.go(next);
          if (next === 'roll') { const room = this.face > 0 ? this.ax + this.aw - this.x - this.w : this.x - this.ax; if (room < 70) this.face = -this.face; }
        }
        break;
      }
      case 'roll': // Anlauf, dann quer durch die Arena
        if (t === 1) { Audio8.sfx('charge', this.cx); if (this.ph2) for (const [k, w] of [[0.3, 18], [0.7, 40]]) W.spawn(new Spiegelbild(this, this.ax + this.aw * (this.face > 0 ? k * 0.6 : 1 - k * 0.6), this.face, w)); }
        if (t < 22) { this.spin += 1.5; this.x += Math.sin(t * 1.3) * 0.6; break; }
        if (t === 22) Audio8.sfx('whoosh', this.cx);
        this.x += this.face * (this.ph2 ? 4.0 : 3.3); this.spin += 4;
        if (t % 6 === 0) W.spawn(new Particle(this.cx - this.face * 14, this.gy - 2, -this.face * rnd(0.4, 1.2), rnd(-1.2, -0.3), '#f8d048', 14, 1, 0.08));
        if (this.x <= this.ax + 2 || this.x + this.w >= this.ax + this.aw - 2) {
          Audio8.sfx('boom', this.cx); W.shake = Math.max(W.shake, 9); Input.rumble(0.6, 0.4, 220); W.spawn(new Shock(this.cx + this.face * 14, this.y + 60, 40, '#f8d048', 3));
          this.face = -this.face; this.dizzies++; this.go('dizzy');
          if (this.dizzies === 2) this.say('gauklerTipp', '#fcfcfc');
        }
        break;
      case 'dizzy': // benommen nach dem Aufprall: Treffer zählen mehr
        if (t > (this.ph2 ? 56 : 76)) this.go('idle');
        break;
      case 'juggle': { // Sterne kreisen über den Händen, dann der Wurf
        this.face = Math.sign(p.cx - this.cx) || this.face;
        if (t % 10 === 0 && t < 50) Audio8.sfx('tink', this.cx);
        if (t === 56) {
          const k = this.ph2 ? 5 : 3; Audio8.sfx('throw', this.cx);
          for (let i = 0; i < k; i++) {
            const tx = clamp(p.cx + (i - (k - 1) / 2) * 34, this.ax + 8, this.ax + this.aw - 8), fl = 46 + i * 6;
            W.spawn(new Jonglierstern(this.cx + this.face * 10, this.y + 10, (tx - this.cx) / fl, -4.6 + i * 0.2, this.gy, this.dmg));
          }
        }
        if (t > 80) this.go('idle');
        break;
      }
      case 'hop': { // in die Knie, Sprung samt Kugel, Aufprall mit Mondwellen
        if (t < 14) { if (t === 1) Audio8.sfx('charge', this.cx); break; }
        if (t === 14) { const tx = clamp(p.cx, this.ax + 30, this.ax + this.aw - 30); this.vy = -6.8; this.vx = (tx - this.cx) / 48; Audio8.sfx('jump', this.cx); }
        this.vy += 0.28; this.x += this.vx; this.y += this.vy; this.spin += this.vx * 3;
        if (this.y + this.h >= this.gy && this.vy > 0) {
          this.y = this.gy - this.h; Audio8.sfx('boom', this.cx); W.shake = Math.max(W.shake, 11); Input.rumble(0.7, 0.5, 260);
          W.spawn(new Mondwelle(this.cx - 18, this.gy, -1, this.dmg)); W.spawn(new Mondwelle(this.cx + 18, this.gy, 1, this.dmg));
          if (this.ph2) { W.spawn(new Mondwelle(this.cx - 18, this.gy, -1, this.dmg)); }
          this.go('land');
        }
        break;
      }
      case 'land': // nach dem Aufprall kurz wackelig
        if (t > (this.ph2 ? 26 : 36)) this.go('idle');
        break;
    }
    if (this.state !== 'hop') this.y = this.gy - this.h;
    this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
    if (this.state !== 'intro') this.touch();
  }
  pose() {
    const s = this.state, t = this.timer, idle = ((this.t / 20) | 0) & 1;
    if (s === 'intro') return t < 70 ? 'bow' : 'idle0';
    if (s === 'roll') return 'roll';
    if (s === 'dizzy') return 'dizzy';
    if (s === 'juggle') return t >= 56 ? 'throw' : 'juggle' + (((t / 8) | 0) & 1);
    if (s === 'hop') return 'hop';
    if (s === 'land') return 'idle1';
    return 'idle' + idle;
  }
  // Kugel unten, Figur obendrauf (Füße 4 px in die Kugel); gibt das Bild der Figur zurück
  static paint(ctx, S, cx, bottom, pose, spin, flip, flash, ent) {
    const b = S['ball' + (((Math.floor(spin / 8) % 4) + 4) % 4)], f = S[pose];
    Sprites.draw(ctx, b, Math.round(cx - b.w / 2 - W.cam.x), Math.round(bottom - b.h - W.cam.y), flip, flash);
    const x = Math.round(cx - f.w / 2 - W.cam.x), y = Math.round(bottom - b.h + 4 - f.h - W.cam.y);
    if (ent) ent.ds(ctx, f, x, y, flip, flash); else Sprites.draw(ctx, f, x, y, flip, flash);
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 16 - cy, r: 40, c: [255, 236, 170], a: 0.3 }); }
  draw(ctx) {
    const S = GAUKLER_ART.get(); if (!S) return;
    const bottom = this.y + this.h, sh = clamp(1 - (this.gy - bottom) / 120, 0.3, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.4 * sh})`; ctx.beginPath(); ctx.ellipse(Math.round(this.cx - W.cam.x), Math.round(this.gy - 1 - W.cam.y), 16 * sh, 3.5 * sh, 0, 0, Math.PI * 2); ctx.fill(); // nur der echte wirft Schatten
    Lunatus.paint(ctx, S, this.cx, bottom, this.pose(), this.spin, this.face < 0, this.flashT > 0 && (this.flashT & 2), this);
    const t = this.timer, hx = this.cx - W.cam.x, hy = bottom - 34 - 62 - W.cam.y;
    if (this.state === 'juggle' && t < 56) { const k = this.ph2 ? 5 : 3; for (let i = 0; i < k; i++) { const a = t * 0.16 + i * Math.PI * 2 / k; gauklerStar(ctx, hx + Math.cos(a) * 14, hy - 4 + Math.sin(a) * 9, 4, t * 0.3 + i, '#f8d048'); } }
    if (this.state === 'dizzy') for (let i = 0; i < 3; i++) { const a = t * 0.12 + i * 2.1; gauklerStar(ctx, hx + Math.cos(a) * 12, hy + 4 + Math.sin(a) * 4, 3, a, i % 2 ? '#fce890' : '#a8c8fc'); }
  }
}
