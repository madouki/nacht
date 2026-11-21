// Grottenolm Gustav (Zwischengegner im Unterirdischen Kanal, hinter dem zweiten Becken): ein riesiger, blinder Höhlenmolch.
// Er sieht nichts, hört aber alles.
//   lauschen – liegt still, die Kiemen gespreizt. Lärm: Gehen in seiner Nähe, Rennen, Landen, Peitschenhiebe und Wurfwaffen
//              (ein Schallring am Helden zeigt, dass er etwas gehört hat). Wer still steht oder weit weg geht, bleibt ungehört
//   stürzen  – auf das Geräusch schnellt er flach zu (drüberspringen); prallt er an die Wand, ist er kurz benommen
//   spucken  – ist das Geräusch weit weg, spuckt er einen Schleimklumpen im Bogen dorthin (die Pfütze ätzt eine Weile)
//   tasten   – hört er lange nichts, kriecht er suchend umher ('?')
// Treffer von hinten sitzen besser (×1,5), und getroffen dreht er sich erst nach einem Moment um. Ab halber Energie hört er feiner
// und peitscht mit dem Schwanz gegen die Wand: Tropfsteine fallen von der Decke. Bilder: tools/blender/olm_bl.py
'use strict';
const OLM_ART = (() => {
  const MAP = {"olm_crawl0":[0,0,96,40],"olm_crawl1":[97,0,96,40],"olm_listen":[194,0,96,40],"olm_lunge":[291,0,96,40],"olm_spit":[388,0,96,40]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['crawl0', 'crawl1', 'listen', 'lunge', 'spit']) S[k] = fr('olm_' + k);
  };
  img.src = 'img/olm3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Schleim extends Ent { // Schleimklumpen im Bogen; am Boden eine Pfütze, die eine Weile ätzt
  constructor(x, y, vx, vy, gy, dmg) { super(x - 4, y - 4, 8, 8); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.gy = gy; this.dmg = dmg; this.pud = -1; }
  update() {
    this.t++; const p = W.player, hitP = p.alive && !p.hidden && Phys.overlap(this, p);
    if (this.pud < 0) {
      this.vy += 0.18; this.x += this.vx; this.y += this.vy;
      if (this.t % 3 === 0) W.spawn(new Particle(this.cx, this.cy, rnd(-0.3, 0.3), rnd(-0.3, 0.3), '#d8ecb8', 14, 1, 0.05));
      if (hitP) { p.hurt(this.dmg, this.cx); this.dead = true; Audio8.sfx('splat', this.cx); return; }
      if (this.y + this.h >= this.gy) { this.pud = 0; this.x = this.cx - 13; this.w = 26; this.y = this.gy - 4; this.h = 4; Audio8.sfx('splat', this.cx); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx, this.gy - 2, rnd(-1.6, 1.6), rnd(-1.8, -0.4), '#d8ecb8', 22, 2, 0.12)); }
    } else {
      if (hitP && !(p.inv > 0)) p.hurt(this.dmg, this.cx);
      if (++this.pud > 100) this.dead = true;
    }
    if (this.t > 300 || this.x < W.arenaX - 30 || this.x > W.arenaX + W.arenaW + 30) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y);
    if (this.pud < 0) { ctx.fillStyle = '#a8c890'; ctx.beginPath(); ctx.ellipse(x, y, 4, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#eef8dc'; ctx.fillRect(x - 2, y - 2, 2, 1); return; }
    ctx.globalAlpha = Math.min(1, (100 - this.pud) / 30) * 0.8; ctx.fillStyle = '#b8d8a0'; ctx.beginPath(); ctx.ellipse(x, Math.round(this.gy - W.cam.y) - 1, 13, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    if ((this.pud >> 3) % 3 === 0) { ctx.fillStyle = '#eef8dc'; ctx.fillRect(x - 6 + (this.pud % 12), Math.round(this.gy - W.cam.y) - 3, 1, 1); } // Bläschen
    ctx.globalAlpha = 1;
  }
}

class Tropfstein extends Ent { // erst rieselt Staub, dann fällt der Tropfstein von der Decke und zerspringt am Boden
  constructor(x, gy, warn, dmg) { super(x - 6, 0, 12, 20); this.kind = 'eproj'; this.gx = x; this.gy = gy; this.warn = warn; this.dmg = dmg; this.vy = 0;
    let r = Math.floor(gy / T) - 2; while (r > 0 && !Phys.solidTile(Math.floor(x / T), r)) r--; this.y = (r + 1) * T; this.y0 = this.y; }
  update() {
    this.t++; const p = W.player;
    if (this.t < this.warn) { if (this.t % 4 === 0) W.spawn(new Particle(this.gx + rnd(-4, 4), this.y0 + 2, 0, rnd(0.6, 1.4), '#a89880', 30, 1, 0.04)); return; }
    if (this.t === this.warn) Audio8.sfx('crack', this.gx);
    this.vy = Math.min(7, this.vy + 0.4); this.y += this.vy;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.gx); this.shatter(); return; }
    if (this.y + this.h >= this.gy) this.shatter();
  }
  shatter() { this.dead = true; this.y = this.gy - this.h; Audio8.sfx('stone', this.gx); W.shake = Math.max(W.shake, 4); for (let i = 0; i < 9; i++) W.spawn(new Particle(this.gx + rnd(-4, 4), this.gy - 3, rnd(-1.8, 1.8), rnd(-2.4, -0.6), i % 2 ? '#8c8070' : '#c8bca8', 28, 2, 0.15)); }
  draw(ctx) {
    const x = Math.round(this.gx - W.cam.x), y = Math.round(this.y - W.cam.y), j = this.t < this.warn ? ((this.t >> 1) & 1) : 0;
    ctx.fillStyle = '#1c1814'; ctx.beginPath(); ctx.moveTo(x - 7 + j, y - 1); ctx.lineTo(x + 7 + j, y - 1); ctx.lineTo(x + j, y + 21); ctx.fill(); // Umriss
    ctx.fillStyle = '#9c9080'; ctx.beginPath(); ctx.moveTo(x - 6 + j, y); ctx.lineTo(x + 6 + j, y); ctx.lineTo(x + j, y + 19); ctx.fill();
    ctx.fillStyle = '#e0d4bc'; ctx.beginPath(); ctx.moveTo(x - 4 + j, y); ctx.lineTo(x - 1 + j, y); ctx.lineTo(x - 1 + j, y + 14); ctx.fill();
    if (this.t < this.warn) { const gy = Math.round(this.gy - W.cam.y), k = this.t / this.warn; ctx.globalAlpha = 0.35 + 0.4 * k; ctx.fillStyle = '#c8bca8'; ctx.beginPath(); ctx.ellipse(x, gy - 1, 3 + 5 * k, 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } // Staubhäufchen am Boden zeigt die Stelle
  }
}

class Gustav extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = W.room.h - 1; while (r > 1 && Phys.solidTile(c, r - 1)) r--; // Boden von unten her (darüber hängen Simse)
    const gy = r * T;
    super(ax + aw - 104, gy - 20, 72, 20, 42, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 14000, nameKey: 'bossOlm', music: 'olm', face: -1, ph2: false, ear: null, quiet: 0, walk: 0, pg: true, pvy: 0, alerts: 0, backSaid: false, heard: 0, lootY: gy - 24 });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { // von hinten (der Held auf der Schwanzseite) sitzt es besser; getroffen dreht er sich erst nach einem Moment um
    const p = W.player, behind = Math.sign(p.cx - this.cx) === -this.face;
    const ok = super.hit(behind ? dmg * 1.5 : dmg, id);
    if (ok) {
      if (behind && !this.backSaid) { this.backSaid = true; W.popup(clamp(this.cx, W.cam.x + 70, W.cam.x + View.w - 70), this.y - 18, tr('olmBack'), '#f8d878'); }
      this.ear = { x: p.cx }; if (this.state === 'listen' || this.state === 'sniff') { this.go('alert'); this.timer = -16; }
    }
    return ok;
  }
  noise() { // wie laut ist der Held gerade? 0 still, 1 Gehen, 2 Rennen/Landen, 3 Peitsche/Wurfwaffe
    const p = W.player; if (!p.alive || p.hidden) { this.pg = true; return 0; }
    let n = 0; const g = p.onGround;
    if (g && Math.abs(p.vx) > 0.4) n = Math.abs(p.vx) > 1.6 ? 2 : 1;
    if (g && !this.pg && this.pvy > 1.2) n = Math.max(n, 2);                         // Landen
    if ((p.atkT > 0 && p.atkId !== this.lastAtk) || W.ents.some(e => e.kind === 'sub' && e.t <= 1)) { this.lastAtk = p.atkId; n = 3; } // Peitschenknall, Wurf
    this.pg = g; this.pvy = p.vy;
    return n;
  }
  hears(n) { const d = Math.abs(W.player.cx - this.cx); return n >= 2 || (n === 1 && d < (this.ph2 ? 210 : 120)); }
  update() {
    this.tick();
    if (this.dying) { if (this.dying % 10 === 0) W.spawn(new Particle(this.cx + rnd(-30, 30), this.y + rnd(0, 14), rnd(-1, 1), rnd(-1.6, -0.2), '#f0c4bc', 34, 2, 0.1)); return this.updateDeath(110); }
    const p = W.player, s = this.state, t = this.timer, sp = this.ph2 ? 1.2 : 1;
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 18, tr('olmWut'), '#ff9aa8'); Audio8.sfx('roar', this.cx); W.shake = Math.max(W.shake, 8); }
    const n = s === 'intro' ? 0 : this.noise(), heard = n && this.hears(n);
    if (heard) { this.quiet = 0; if (s !== 'lunge' && s !== 'spit' && s !== 'tail') { this.ear = { x: p.cx }; if (W.frame - this.heard > 20) W.spawn(new Shock(p.cx, p.feet - 3, 20 + n * 6, '#c8e0ff', 1)); this.heard = W.frame; } }
    else this.quiet++;
    switch (s) {
      case 'intro': // kriecht von rechts herein und hebt lauschend den Kopf
        if (t < 50) { this.x -= 0.6; this.walk += 0.15; }
        if (t === 30) Audio8.sfx('slime', this.cx);
        if (t > 90) this.go('listen');
        break;
      case 'listen':
        if (heard) { this.go('alert'); break; }
        if (this.quiet > (this.ph2 ? 100 : 150)) { this.go('sniff'); this.quiet = 0; }
        break;
      case 'sniff': // tastet suchend umher, an der Wand kehrt er um
        if (heard) { this.go('alert'); break; }
        this.x += this.face * 0.45 * sp; this.walk += 0.12;
        if (this.x <= this.ax + 4 || this.x + this.w >= this.ax + this.aw - 4) this.face = -this.face;
        if (t % 24 === 0) Audio8.sfx('slime', this.cx);
        if (t > 140) this.go('listen');
        break;
      case 'alert': // dreht sich zum Geräusch: '!'
        if (t === 0) Audio8.sfx('growl', this.cx);
        if (this.ear && t >= 0) this.face = Math.sign(this.ear.x - this.cx) || this.face;
        if (t > (this.ph2 ? 12 : 18)) {
          this.alerts++; const far = this.ear && Math.abs(this.ear.x - this.cx) > 150;
          this.go(this.ph2 && this.alerts % 3 === 0 ? 'tail' : far ? 'spit' : 'lunge');
          if (this.state === 'lunge') Audio8.sfx('whoosh', this.cx);
        }
        break;
      case 'lunge': { // schnellt flach auf das Geräusch zu
        const tx = this.ear ? this.ear.x : this.cx + this.face * 80, v = (this.ph2 ? 3.8 : 3.2);
        this.face = Math.sign(tx - this.cx) || this.face; this.x += this.face * v; this.walk += 0.5;
        if (t % 3 === 0) W.spawn(new Particle(this.cx - this.face * 30, this.gy - 2, -this.face * rnd(0.4, 1.2), rnd(-1, -0.2), '#a8b8c0', 16, 1, 0.08));
        const wall = this.x <= this.ax + 2 || this.x + this.w >= this.ax + this.aw - 2;
        if (wall) { this.go('daze'); W.shake = Math.max(W.shake, 10); Audio8.sfx('wall', this.cx); Input.rumble(0.6, 0.4, 220); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx + this.face * 36, this.gy - rnd(4, 18), -this.face * rnd(0.5, 2), rnd(-2, 0), '#8c8070', 24, 2, 0.12)); }
        else if (Math.abs(this.cx - tx) < 8 || t > 70) { this.ear = null; this.go('listen'); this.quiet = 0; }
        break;
      }
      case 'spit': // Schleimklumpen im Bogen dorthin, wo es zuletzt laut war
        if (t === 12) {
          const hx = this.cx + this.face * 38, hy = this.gy - 16, tx = clamp(this.ear ? this.ear.x : p.cx, this.ax + 14, this.ax + this.aw - 14), tA = 40, g = 0.18;
          W.spawn(new Schleim(hx, hy, (tx - hx) / tA, (this.gy - 4 - hy - 0.5 * g * tA * tA) / tA, this.gy, this.dmg)); Audio8.sfx('splat', this.cx);
        }
        if (t > 34) { this.go('listen'); this.quiet = 0; }
        break;
      case 'tail': // schlägt mit dem Schwanz an die Wand: Tropfsteine fallen
        this.walk += 0.6;
        if (t === 14) {
          W.shake = Math.max(W.shake, 12); Audio8.sfx('boom', this.cx); Input.rumble(0.7, 0.5, 260);
          const x0 = clamp(this.ear ? this.ear.x : p.cx, this.ax + 12, this.ax + this.aw - 12), xs = [x0];
          for (let k = 0; xs.length < 4 && k < 40; k++) { const x = clamp(x0 + rnd(-120, 120), this.ax + 12, this.ax + this.aw - 12); if (xs.every(o => Math.abs(o - x) > 34)) xs.push(x); }
          xs.forEach((x, i) => W.spawn(new Tropfstein(x, this.gy, 34 + i * 10, this.dmg)));
        }
        if (t > 44) { this.go('listen'); this.quiet = 0; }
        break;
      case 'daze': // benommen nach dem Aufprall
        if (t % 12 === 0) W.spawn(new Particle(this.cx + this.face * 30 + rnd(-4, 4), this.y - 4, rnd(-0.4, 0.4), -0.6, '#ffe890', 20, 1, 0));
        if (t > (this.ph2 ? 44 : 60)) { this.go('listen'); this.quiet = 60; }
        break;
    }
    this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2); this.y = this.gy - this.h;
    if (!['intro', 'daze'].includes(this.state)) this.touch();
  }
  pose() {
    const s = this.state;
    if (s === 'listen' || s === 'alert') return 'listen';
    if (s === 'lunge') return 'lunge';
    if (s === 'spit') return this.timer > 6 && this.timer < 26 ? 'spit' : 'listen';
    return ((this.walk * 1.2) | 0) & 1 ? 'crawl1' : 'crawl0';
  }
  lightUp(L, cx, cy) {
    L.push({ x: this.cx + this.face * 26 - cx, y: this.gy - 20 - cy, r: 22, c: [255, 120, 140], a: 0.14 }); // Kiemen schimmern
  }
  draw(ctx) {
    const S = OLM_ART.get(); if (!S) return;
    const jig = this.state === 'daze' || this.state === 'tail' ? ((this.t >> 1) & 1) * 2 - 1 : 0;
    this.spr(ctx, S[this.pose()], this.face < 0, -this.face * 2 + jig, 1, this.flashT > 0 && (this.flashT & 2));
    const hx = Math.round(this.cx + this.face * 34 - W.cam.x), hy = Math.round(this.gy - (this.pose() === 'listen' ? 40 : 32) - W.cam.y) + Math.round(Math.sin(this.t * 0.15));
    if (this.state === 'alert' && this.timer >= 0) Font.draw(ctx, '!', hx, hy, (this.t >> 2) & 1 ? '#ff6060' : '#fcfcfc', { align: 'center', shadow: '#000' });
    else if (this.state === 'sniff') Font.draw(ctx, '?', hx, hy, '#c8e0ff', { align: 'center', shadow: '#000' });
    else if (this.state === 'daze') Font.draw(ctx, '@', hx, hy, '#ffe890', { align: 'center', shadow: '#000' });
  }
}
