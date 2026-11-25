// Totengräber Theobald (Zwischengegner im Gruftgang): ein Calaca-Skelett – bemalter Zuckerschädel, Ringelblumen an Zylinder und
// Knopfloch, Gehrock, Laterne, rostige Schaufel – mit trockenem Noir-Humor; gräbt seit 1648 ohne Pause (Knochen-Kalle vom
// Betriebsrat hat eine Akte über ihn).
//   Abtauchen  – gräbt sich ein; nur ein Erdhügel wandert unter dem Boden auf den Helden zu, zittert – und er bricht heraus
//                (Erdklumpen fliegen). Verfehlt er, steckt die Schaufel fest: dann sitzen Treffer besser (×1,5)
//   Grabstein  – holt aus und wirft einen Grabstein im Bogen; wo er zerspringt, ist ein frisches Grab, aus dem eine Knochenhand greift
//   Schaufel   – wer ihm zu nahe kommt, bekommt die Schaufel
//   Knochenhände – ab halber Energie: Risse laufen über den Boden, dann brechen Hände in einer Reihe hervor
// Bilder: tools/blender/totengraeber_bl.py (idle0, idle1, dig, swing, laugh; 60×80, Blick nach rechts). Lied: 'polka'
'use strict';
const THEO_ART = (() => {
  const MAP = {"theo_idle0":[0,0,60,80],"theo_idle1":[61,0,60,80],"theo_dig":[122,0,60,80],"theo_swing":[183,0,60,80],"theo_laugh":[244,0,60,80]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['idle0', 'idle1', 'dig', 'swing', 'laugh']) S[k] = fr('theo_' + k);
  };
  img.src = 'img/theo3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Grabhand extends Ent { // Knochenhand aus dem Boden: erst Risse/Krümel, dann greift sie zu und zieht sich zurück; grave: mit Grabhügel
  constructor(x, gy, dmg, delay, bursts, grave) { super(x - 5, gy - 20, 10, 20); this.kind = 'eproj'; this.gx = x; this.gy = gy; this.dmg = dmg; this.delay = delay; this.bursts = bursts; this.grave = grave; this.n = 0; this.up = 0; }
  update() {
    this.t++; const p = W.player, k = this.t - this.delay, cyc = 64, ph = k % cyc;
    if (k < 0) return;
    if (Math.floor(k / cyc) >= this.bursts) { this.dead = !this.grave || this.t > this.delay + this.bursts * cyc + 30; this.up = 0; if (this.dead) return; return; }
    if (ph < 22) { this.up = 0; if (ph % 4 === 0) W.spawn(new Particle(this.gx + rnd(-5, 5), this.gy - 1, rnd(-0.5, 0.5), rnd(-1.4, -0.4), '#6c5a44', 16, 1, 0.12)); if (ph === 21) Audio8.sfx('crumble', this.gx); }
    else if (ph < 40) this.up = Math.min(1, (ph - 22) / 5);
    else this.up = Math.max(0, 1 - (ph - 40) / 8);
    if (this.up > 0.6 && p.alive && !p.hidden && Math.abs(p.cx - this.gx) < 9 && p.feet > this.gy - 20 && p.y < this.gy) p.hurt(this.dmg, this.gx);
  }
  draw(ctx) {
    const x = Math.round(this.gx - W.cam.x), y = Math.round(this.gy - W.cam.y), k = this.t - this.delay;
    if (this.grave) { ctx.fillStyle = '#3c2c20'; ctx.beginPath(); ctx.ellipse(x, y, 13, 4, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#5c4630'; ctx.fillRect(x - 10, y - 3, 20, 1); }
    if (k >= 0 && k % 64 < 22) { ctx.fillStyle = '#1c1410'; for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 4 - 1, y - 1, 2 + (k >> 3) % 2, 1); } // Risse
    if (this.up <= 0) return;
    const h = Math.round(18 * this.up), j = (this.t >> 2) & 1;
    ctx.fillStyle = '#2c241c'; ctx.fillRect(x - 3, y - h - 1, 7, h + 1);
    ctx.fillStyle = '#e6dcc4'; ctx.fillRect(x - 2, y - h + 5, 5, h - 5);                                       // Unterarm
    for (let f = 0; f < 4; f++) ctx.fillRect(x - 3 + f * 2, y - h - (f === 1 || f === 2 ? 3 : 1) - j, 1, 5);   // Finger
    ctx.fillStyle = '#b4a888'; ctx.fillRect(x - 2, y - h + 4, 5, 1);
  }
}

class Grabstein extends Ent { // fliegt im Bogen, zerspringt am Boden und hinterlässt ein frisches Grab mit Knochenhand
  constructor(x, y, vx, vy, gy, dmg, hand) { super(x - 6, y - 8, 12, 16); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.gy = gy; this.dmg = dmg; this.rot = 0; this.hand = hand; }
  update() {
    this.t++; this.vy += 0.2; this.x += this.vx; this.y += this.vy; this.rot += this.vx * 0.05; const p = W.player;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.land(); return; }
    if (this.y + this.h >= this.gy) this.land();
    if (this.t > 200) this.dead = true;
  }
  land() {
    this.dead = true; Audio8.sfx('stone', this.cx); W.shake = Math.max(W.shake, 5);
    for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.gy - 4, rnd(-2, 2), rnd(-2.6, -0.6), i % 2 ? '#8c8c94' : '#5c4630', 26, 2, 0.15));
    if (this.hand) W.spawn(new Grabhand(clamp(this.cx, W.arenaX + 12, W.arenaX + W.arenaW - 12), this.gy, this.dmg, 20, 2, true));
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.rot);
    ctx.fillStyle = '#2c2c34'; ctx.beginPath(); ctx.moveTo(-7, 9); ctx.lineTo(-7, -4); ctx.arc(0, -4, 7, Math.PI, 0); ctx.lineTo(7, 9); ctx.fill();
    ctx.fillStyle = '#8c8c98'; ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(-6, -4); ctx.arc(0, -4, 6, Math.PI, 0); ctx.lineTo(6, 8); ctx.fill();
    ctx.fillStyle = '#4c4c58'; ctx.fillRect(-1, -6, 2, 8); ctx.fillRect(-3, -4, 6, 2);                         // Kreuz
    ctx.fillStyle = '#5c7c44'; ctx.fillRect(-6, 5, 4, 3);                                                     // Moos
    ctx.restore();
  }
}

class Erdklumpen extends Ent { // Erde beim Herausbrechen
  constructor(x, y, vx, vy, gy, dmg) { super(x - 3, y - 3, 6, 6); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.gy = gy; this.dmg = dmg; }
  update() {
    this.t++; this.vy += 0.22; this.x += this.vx; this.y += this.vy; const p = W.player;
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.y + this.h >= this.gy) { this.dead = true; for (let i = 0; i < 4; i++) W.spawn(new Particle(this.cx, this.gy - 2, rnd(-1, 1), rnd(-1.4, -0.3), '#5c4630', 16, 1, 0.12)); }
  }
  draw(ctx) { const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y); ctx.fillStyle = '#2c1c14'; ctx.fillRect(x - 3, y - 3, 7, 6); ctx.fillStyle = '#6c5438'; ctx.fillRect(x - 2, y - 2, 5, 4); }
}

class Theobald extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = W.room.h - 1; while (r > 1 && Phys.solidTile(c, r - 1)) r--;
    const gy = r * T;
    super(ax + aw - 96, gy - 64, 30, 64, 44, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 15000, nameKey: 'bossTheo', music: 'polka', face: -1, ph2: false, n: 0, sink: 0, mound: null, festSaid: false, hit1: false, lootY: gy - 24 });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { const s = this.state; return s !== 'intro' && s !== 'under' && !(s === 'dig' && this.timer > 16) && !(s === 'rise' && this.sink > 0.4); }
  hit(dmg, id) { // steckt die Schaufel fest, sitzt es besser
    const fest = this.state === 'stuck', ok = super.hit(fest ? dmg * 1.5 : dmg, id);
    if (ok && fest && !this.festSaid) { this.festSaid = true; W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 16, tr('theoFest'), '#f8d878'); }
    return ok;
  }
  say(key, col) { W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 16, tr(key), col); }
  update() {
    this.tick();
    if (this.dying) { this.sink = 0; if (this.dying % 5 === 0) W.spawn(new Particle(this.cx + rnd(-14, 14), this.y + rnd(0, 50), rnd(-1, 1), rnd(-1.6, -0.2), ['#e6dcc4', '#f89820', '#fcc040', '#f050a0'][(this.dying / 5) % 4], 40, 2, 0.06)); return this.updateDeath(110); } // Knochen und Ringelblumen
    const p = W.player, s = this.state, t = this.timer;
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; this.say('theoWut', '#ff9aa8'); Audio8.sfx('laugh', this.cx); W.shake = Math.max(W.shake, 6); }
    switch (s) {
      case 'intro':
        if (t === 12) { this.say('theoFeierabend', '#fcfcfc'); Audio8.sfx('laugh', this.cx); }
        if (t > 96) this.go('idle');
        break;
      case 'idle': {
        this.face = Math.sign(p.cx - this.cx) || this.face; this.sink = 0;
        if (t > (this.ph2 ? 28 : 44)) {
          this.n++; const d = Math.abs(p.cx - this.cx);
          this.go(d < 52 ? 'swing' : this.ph2 && this.n % 4 === 0 ? 'hands' : this.n % 2 ? 'dig' : 'throw');
        }
        break;
      }
      case 'dig': // gräbt sich ein
        if (t % 6 === 0) { Audio8.sfx('crumble', this.cx); for (let i = 0; i < 3; i++) W.spawn(new Particle(this.cx + this.face * 10, this.gy - 2, rnd(-1.6, 1.6), rnd(-2.2, -0.6), '#6c5438', 20, 2, 0.14)); }
        if (t > 8) this.sink = Math.min(1, (t - 8) / 16);
        if (t > 26) { this.go('under'); this.mound = { x: this.cx }; }
        break;
      case 'under': { // nur der Erdhügel wandert
        const v = this.ph2 ? 2.6 : 2.0, dx = clamp(p.cx, this.ax + 14, this.ax + this.aw - 14) - this.mound.x;
        this.mound.x += clamp(dx, -v, v); this.x = this.mound.x - this.w / 2;
        if (t % 5 === 0) W.spawn(new Particle(this.mound.x + rnd(-6, 6), this.gy - 2, rnd(-0.8, 0.8), rnd(-1.4, -0.4), '#6c5438', 16, 1, 0.12));
        if (t % 18 === 0) Audio8.sfx('crumble', this.mound.x);
        if ((Math.abs(dx) < 4 && t > 30) || t > 120) this.go('rise');
        break;
      }
      case 'rise': { // der Hügel zittert (Ansage) – dann bricht er heraus
        const tell = this.ph2 ? 14 : 20;
        if (t < tell) { if (t % 3 === 0) W.spawn(new Particle(this.mound.x + rnd(-8, 8), this.gy - 2, rnd(-0.6, 0.6), rnd(-1.8, -0.8), '#8c7050', 14, 1, 0.1)); break; }
        if (t === tell) {
          this.hit1 = false; Audio8.sfx('boom', this.cx); Audio8.sfx('crumble', this.cx); W.shake = Math.max(W.shake, 10); Input.rumble(0.6, 0.4, 220);
          for (const vx of [-1.8, -0.9, 0.9, 1.8]) W.spawn(new Erdklumpen(this.cx, this.gy - 10, vx, -3.4 - Math.abs(vx) * 0.4, this.gy, this.dmg));
          for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.gy - rnd(6, 30), rnd(-1.6, 1.6), rnd(-2.4, -0.8), ['#f89820', '#fcc040', '#f050a0'][i % 3], 46, 2, 0.05)); // Ringelblumen-Blüten
          if (p.alive && Math.abs(p.cx - this.cx) < 20 && p.feet > this.gy - 30) { p.hurt(this.dmg, this.cx); this.hit1 = true; }
        }
        this.sink = Math.max(0, 1 - (t - tell) / 6);
        if (t > tell + 8) { this.mound = null; this.go(this.hit1 ? 'laugh' : 'stuck'); }
        break;
      }
      case 'stuck': // Schaufel steckt im Boden: zappelt
        if (t % 14 === 0) W.spawn(new Particle(this.cx + this.face * 10, this.y + 4, rnd(-0.4, 0.4), -0.7, '#a8d8fc', 18, 1, 0.05)); // Schweißtropfen
        if (t > (this.ph2 ? 40 : 56)) this.go('idle');
        break;
      case 'laugh':
        if (t === 1) Audio8.sfx('laugh', this.cx);
        if (t > 34) this.go('idle');
        break;
      case 'throw': // Grabstein im Bogen, dort entsteht ein frisches Grab
        if (t === 16) {
          const hx = this.cx + this.face * 6, hy = this.y - 6, tx = clamp(p.cx, this.ax + 14, this.ax + this.aw - 14), tA = 42, g = 0.2;
          W.spawn(new Grabstein(hx, hy, (tx - hx) / tA, (this.gy - 8 - hy - 0.5 * g * tA * tA) / tA, this.gy, this.dmg, true)); Audio8.sfx('throw', this.cx);
        }
        if (t > 44) this.go('idle');
        break;
      case 'swing': // Schaufelhieb nach vorn
        if (t === 1) Audio8.sfx('whoosh', this.cx);
        if (t === 12) { Audio8.sfx('clank', this.cx); const hx = this.cx + this.face * 28; if (p.alive && Math.abs(p.cx - hx) < 26 && p.feet > this.y + 10 && p.y < this.gy) p.hurt(this.dmg, this.cx); for (let i = 0; i < 6; i++) W.spawn(new Particle(hx, this.gy - 2, rnd(-1.4, 1.4), rnd(-1.8, -0.4), '#6c5438', 18, 1, 0.12)); }
        if (t > 34) this.go('idle');
        break;
      case 'hands': // Risse laufen zum Helden, dann brechen Hände in einer Reihe hervor
        if (t === 1) { // fünf Hände rund um den Helden (immer in der Arena), von der Seite des Totengräbers her nacheinander
          Audio8.sfx('laugh', this.cx); const c = clamp(p.cx, this.ax + 60, this.ax + this.aw - 60), xs = [-2, -1, 0, 1, 2].map(k => c + k * 26).sort((a, b) => Math.abs(a - this.cx) - Math.abs(b - this.cx));
          xs.forEach((x, i) => W.spawn(new Grabhand(x, this.gy, this.dmg, 6 + i * 8, 1, false)));
        }
        if (t > 60) this.go('idle');
        break;
    }
    if (this.state !== 'under' && this.state !== 'rise') this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
    this.y = this.gy - this.h;
    if (!['intro', 'under', 'stuck', 'dig', 'rise'].includes(this.state)) this.touch();
  }
  pose() {
    const s = this.state, t = this.timer;
    if (s === 'dig' || s === 'stuck' || s === 'rise') return 'dig';
    if (s === 'swing') return t < 12 ? 'swing' : 'dig';
    if (s === 'throw') return t < 16 ? 'swing' : t < 30 ? 'idle0' : 'laugh';
    if (s === 'laugh' || s === 'hands' || (s === 'intro' && t > 10 && t < 50)) return 'laugh';
    return ((this.t / 20) | 0) & 1 ? 'idle1' : 'idle0';
  }
  lightUp(L, cx, cy) { if (this.state !== 'under') L.push({ x: this.cx - this.face * 10 - cx, y: this.y + 34 + this.sink * 64 - cy, r: 26, c: [255, 190, 110], a: 0.22 * (1 - this.sink) }); }
  draw(ctx) {
    const S = THEO_ART.get(), gyS = Math.round(this.gy - W.cam.y);
    if (this.mound) { // Erdhügel (zittert vor dem Herausbrechen)
      const mx = Math.round(this.mound.x - W.cam.x) + (this.state === 'rise' && this.timer < 20 ? ((this.t >> 1) & 1) * 2 - 1 : 0);
      ctx.fillStyle = '#2c1c14'; ctx.beginPath(); ctx.ellipse(mx, gyS, 15, 6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#6c5438'; ctx.beginPath(); ctx.ellipse(mx, gyS, 13, 5, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#8c7050'; ctx.fillRect(mx - 5, gyS - 4, 3, 1); ctx.fillRect(mx + 3, gyS - 3, 2, 1);
    }
    if (this.state === 'under' || !S) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, View.w, gyS); ctx.clip(); // eingegraben: nur der Teil über dem Boden
    const jig = this.state === 'stuck' ? ((this.t >> 2) & 1) * 2 - 1 : 0;
    this.spr(ctx, S[this.pose()], this.face < 0, jig, Math.round(this.sink * 80), this.flashT > 0 && (this.flashT & 2));
    ctx.restore();
    if (this.state === 'stuck') Font.draw(ctx, '!?', Math.round(this.cx - W.cam.x), Math.round(this.y - 24 - W.cam.y), (this.t >> 3) & 1 ? '#ffe890' : '#fcfcfc', { align: 'center', shadow: '#000' });
  }
}
