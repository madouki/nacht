// Kleiderschrank Kunibert (Zwischengegner in Zimmer 13 des Hotels Krat, seit 1391 verschlossen): ein besessener Nussbaumschrank.
//   wanken   – kippelt von Kante zu Kante auf den Helden zu, die Augen glühen durch die Schlüssellöcher
//   Bügel    – öffnet einen Spalt und wirft Kleiderbügel wie Bumerangs, die zu ihm zurückfliegen
//   stampfen – hüpft und schlägt auf: Staubwellen rollen über den Boden (drüberspringen)
//   schlucken – reißt die Türen auf und saugt den Helden an; wer hineingerät, wird verschluckt und ausgespuckt. Weit offen ist
//               aber auch sein Innerstes ungeschützt: Treffer sitzen dann besser (×1,5)
// Ab halber Energie flattern Motten heraus, er wirft mehr Bügel und stampft zweimal. Bilder: tools/blender/schrank_bl.py
'use strict';
const SCHRANK_ART = (() => {
  const MAP = {"schrank_closed":[0,0,56,68],"schrank_rockL":[57,0,56,68],"schrank_rockR":[114,0,56,68],"schrank_ajar":[171,0,56,68],"schrank_open":[228,0,56,68]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['closed', 'rockL', 'rockR', 'ajar', 'open']) S[k] = fr('schrank_' + k);
  };
  img.src = 'img/schrank3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Buegel extends Ent { // Kleiderbügel als Bumerang: fliegt hinaus, wird langsamer, kehrt um und fliegt zum Schrank zurück
  constructor(owner, x, y, d, sp, dmg, wob) { super(x - 6, y - 4, 12, 8); this.kind = 'eproj'; this.owner = owner; this.vx = d * sp; this.d = d; this.y0 = y; this.dmg = dmg; this.wob = wob; this.back = false; }
  update() {
    this.t++; this.vx -= this.d * 0.085; this.x += this.vx; this.y = this.y0 + Math.sin(this.t * 0.09 + this.wob) * 10 - 4;
    if (!this.back && Math.sign(this.vx) !== this.d) this.back = true;
    const p = W.player, o = this.owner;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if ((this.back && o && Math.abs(this.cx - o.cx) < 10) || this.t > 240 || !o || o.dead) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), a = this.t * 0.4, c = Math.cos(a), s = Math.sin(a);
    const P = (u, v) => [Math.round(x + u * c - v * s), Math.round(y + u * s + v * c)];
    ctx.fillStyle = '#1c1008'; for (let k = -6; k <= 6; k++) { const [px, py] = P(k, 2); ctx.fillRect(px - 1, py - 1, 3, 2); }
    ctx.fillStyle = '#e8d8b0'; for (let k = -5; k <= 5; k++) { const [px, py] = P(k, 2 - Math.abs(k) * 0.5 + 2); ctx.fillRect(px, py, 1, 1); const [qx, qy] = P(k, 2); ctx.fillRect(qx, qy, 1, 1); }
    ctx.fillStyle = '#c8c8d8'; const [hx, hy] = P(0, -2); ctx.fillRect(hx, hy - 1, 1, 2); const [hx2, hy2] = P(1, -4); ctx.fillRect(hx2, hy2, 2, 1); // Haken
  }
}

class Staubwelle extends Ent { // Staubwelle nach dem Aufstampfen: rollt über den Boden
  constructor(x, gy, d, dmg) { super(x - 7, gy - 10, 14, 10); this.kind = 'eproj'; this.d = d; this.gy = gy; this.dmg = dmg; }
  update() {
    this.t++; this.x += this.d * 2.4; const p = W.player;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.t % 3 === 0) W.spawn(new Particle(this.cx, this.gy - 2, -this.d * rnd(0.2, 0.8), rnd(-1.2, -0.3), '#a89878', 22, 2, 0.04));
    if (this.t > 110 || this.x < W.arenaX - 20 || this.x > W.arenaX + W.arenaW + 20) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.gy - W.cam.y), k = 1 + 0.15 * Math.sin(this.t * 0.6);
    ctx.fillStyle = 'rgba(168,152,120,0.75)'; ctx.beginPath(); ctx.ellipse(x, y - 4, 8 * k, 5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(220,208,180,0.6)'; ctx.beginPath(); ctx.ellipse(x - this.d * 3, y - 6, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

class Kunibert extends Boss {
  constructor(ax, aw) {
    const floor = (W.room.h - 2) * T;
    super(ax + aw - 70, floor - 52, 26, 52, 40, 2);
    this.ax = ax; this.aw = aw; this.floor = floor; this.mini = true; this.score = 15000; this.nameKey = 'bossSchrank'; this.music = 'tango'; // Kleiderschrank-Tango (audio.js)
    this.face = -1; this.state = 'intro'; this.timer = 0; this.ph2 = false; this.lootY = floor - 30; this.vy = 0; this.hops = 0; this.last = ''; this.swallow = 0;
    this.shoo = true; // Gast-Geist und Tentakel verkriechen sich während des Kampfs unterm Bett
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { return super.hit(this.state === 'gulp' ? dmg * 1.5 : dmg, id); } // weit offen: das Innerste ist ungeschützt
  pose() {
    const s = this.state;
    if (s === 'gulp' || this.swallow > 0) return 'open';
    if (s === 'gulpWind' || s === 'hangers') return 'ajar';
    if (s === 'walk') return ((this.t / 10) | 0) & 1 ? 'rockL' : 'rockR';
    return 'closed';
  }
  update() {
    if (this.dying) { if (this.dying === 1 && !this.ate && typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('schrank_clean'); this.updateDeath(); return; } // Urkunde: nie verschluckt
    this.tick(); const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.3 : 1;
    if (!this.ph2 && this.hp < this.maxHp / 2) { // Motten!
      this.ph2 = true; W.popup(this.cx, this.y - 10, tr('schrankMotten'), '#e8dcb0'); Audio8.sfx('flap', this.cx); W.shake = Math.max(W.shake, 8);
      for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx + rnd(-10, 10), this.y + rnd(10, 40), rnd(-1.6, 1.6), rnd(-1.6, -0.2), i % 2 ? '#c8bca0' : '#8c8070', 70, 2, -0.01));
    }
    if (this.swallow > 0) { // der Held steckt im Schrank
      p.x = this.cx - p.w / 2; p.y = this.floor - p.h; p.vx = p.vy = 0; p.hidden = true; p.inv = Math.max(p.inv || 0, 2);
      if (this.timer % 8 === 0) { W.shake = Math.max(W.shake, 3); Audio8.sfx('klack', this.cx); }
      if (--this.swallow === 0) { // ausspucken
        p.hidden = false; p.inv = 0; p.x = this.cx + this.face * 22 - p.w / 2; p.vx = this.face * 3.6; p.vy = -3.6; p.hurt(this.dmg + 1, this.cx);
        W.popup(this.cx, this.y - 10, tr('schrankSpit'), '#e8dcb0'); Audio8.sfx('splat', this.cx);
        for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + this.face * 14, this.y + 30, this.face * rnd(0.6, 2.4), rnd(-2, 0), i % 2 ? '#d81c2c' : '#a89878', 40, 2, 0.1));
        this.go('walk');
      }
      return;
    }
    switch (this.state) {
      case 'intro': this.face = dx > 0 ? 1 : -1; if (this.timer === 30) Audio8.sfx('creak', this.cx); if (this.timer > 70) this.go('walk'); break;
      case 'walk': { // kippelt heran
        this.face = dx > 0 ? 1 : -1;
        if (Math.abs(dx) > 40) this.x += this.face * 0.55 * sp;
        if (this.timer % 10 === 0) Audio8.sfx('stone', this.cx);
        if (this.timer > (this.ph2 ? 44 : 64)) {
          const opts = ['hangers', 'stomp', 'gulpWind'].filter(s => s !== this.last), pick = opts[Math.floor(Math.random() * opts.length)];
          this.last = pick; this.go(pick); if (pick === 'gulpWind') Audio8.sfx('creak', this.cx); if (pick === 'stomp') { this.vy = -4.6; this.hops = this.ph2 ? 2 : 1; Audio8.sfx('djump', this.cx); }
        }
        break;
      }
      case 'hangers': // Bügel wie Bumerangs
        this.face = dx > 0 ? 1 : -1;
        if (this.timer === 16 || (this.ph2 && this.timer === 30)) {
          const n = 2; for (let i = 0; i < n; i++) W.spawn(new Buegel(this, this.cx + this.face * 10, this.y + 14 + i * 16, this.face, this.ph2 ? 4.0 : 3.5, Math.max(1, this.dmg - 1), i * 1.7));
          Audio8.sfx('whoosh', this.cx);
        }
        if (this.timer > 50) this.go('walk');
        break;
      case 'stomp': // hüpft, schlägt auf, Staubwellen in beide Richtungen
        this.vy += 0.3; this.y += this.vy; this.x += this.face * 0.8;
        if (this.y + this.h >= this.floor && this.vy > 0) {
          this.y = this.floor - this.h; this.vy = 0; W.shake = Math.max(W.shake, 8); Audio8.sfx('boom', this.cx); Input.rumble(0.5, 0.4, 160);
          for (const d of [-1, 1]) W.spawn(new Staubwelle(this.cx + d * 16, this.floor, d, this.dmg));
          if (--this.hops > 0) this.vy = -4.2; else this.go('walk');
        }
        break;
      case 'gulpWind': this.face = dx > 0 ? 1 : -1; if (this.timer > 18 / sp) { this.go('gulp'); Audio8.sfx('roar', this.cx); } break;
      case 'gulp': { // Türen weit auf: saugt an
        const near = Math.abs(dx) < 170 && Math.abs(p.feet - this.floor) < 48 && p.alive && !p.hidden;
        if (near) { Phys.moveX(p, -Math.sign(dx) * (this.ph2 ? 1.15 : 0.85)); if (this.timer % 4 === 0) W.spawn(new Particle(p.cx + Math.sign(dx) * 20, p.cy + rnd(-12, 12), -Math.sign(dx) * 2.2, 0, '#c8bca0', 18, 1, 0)); }
        if (near && Math.abs(dx) < 24) { this.swallow = 44; this.timer = 0; this.ate = true; Audio8.sfx('chomp', this.cx); if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.schrank_tip) { Castle.setFlag('schrank_tip'); Game.note('bossSchrankTip'); } break; }
        if (this.timer > (this.ph2 ? 90 : 72)) { this.go('walk'); Audio8.sfx('door', this.cx); }
        break;
      }
    }
    this.x = clamp(this.x, this.ax + 4, this.ax + this.aw - this.w - 4);
    if (this.state !== 'stomp') this.y = this.floor - this.h;
    if (this.state !== 'intro' && this.state !== 'gulp') this.touch(); // weit offen schluckt er, statt zu rempeln
  }
  lightUp(L, cx, cy) { const o = this.pose() === 'open' || this.pose() === 'ajar'; L.push({ x: this.cx - cx, y: this.y + 20 - cy, r: o ? 30 : 16, c: [252, 224, 64], a: o ? 0.3 : 0.12 }); }
  draw(ctx) {
    const S = SCHRANK_ART.get(); if (!S) return;
    const jig = this.state === 'gulpWind' || this.swallow > 0 ? ((this.t >> 1) & 1) * 2 - 1 : 0;
    this.spr(ctx, S[this.pose()], this.face < 0, jig, 1, this.flashT > 0 && (this.flashT & 2));
  }
}
