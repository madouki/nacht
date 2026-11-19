// Wachhauptmann (Zwischengegner im Verlies): die Schildwache in Schwarz und Gold, anderthalbmal so groß, mit Umhang.
// Der Turmschild fängt jeden Treffer von vorn ab. Angriffe: Lanzenstoß (ab halber Energie zweimal hintereinander), Schildansturm quer durch
// die Arena, Sprung mit Schockwellen nach beiden Seiten (drüberspringen). Danach hängt der Schild herab – das ist der Moment.
// Verwundbar auch von hinten und von oben auf den Helm. Bilder: tools/blender/schild_bl.py (captain), pack_capt.py
'use strict';
const HAUPTMANN_ART = (() => {
  const MAP = {"capt_walk0":[0,0,120,90],"capt_walk1":[121,0,120,90],"capt_wind":[242,0,120,90],"capt_thrust":[363,0,120,90],"capt_recover":[484,0,120,90],"capt_bash":[605,0,120,90],"capt_leap":[726,0,120,90]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { walk: [fr('capt_walk0'), fr('capt_walk1')], wind: fr('capt_wind'), thrust: fr('capt_thrust'), recover: fr('capt_recover'), bash: fr('capt_bash'), leap: fr('capt_leap') };
  };
  img.src = 'img/capt3d.png?v=' + (window.BUILD || '');
  return { get: () => S };
})();

class Welle extends Ent { // Schockwelle am Boden: rollt nach außen, drüberspringen
  constructor(x, gy, d, dmg, big) { super(x - 6, gy - (big ? 18 : 13), 12, big ? 18 : 13); this.kind = 'eproj'; this.unstoppable = true; this.d = d; this.dmg = dmg; this.gy = gy; }
  update() {
    this.t++; this.x += this.d * 3.1; const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.t % 3 === 0) W.spawn(new Particle(this.cx, this.gy - 2, rnd(-0.4, 0.4), rnd(-1.6, -0.6), this.t % 6 ? '#c8a878' : '#8c7458', 20, 1, 0.1));
    if (this.t > 80 || Phys.solidTile(Math.floor((this.cx + this.d * 8) / T), Math.floor((this.gy - 6) / T))) this.dead = true;
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.gy - 8 - cy, r: 20, c: [252, 200, 120], a: 0.35 }); }
  draw(ctx) { const x = Math.round(this.cx - W.cam.x), b = Math.round(this.gy - W.cam.y); for (let i = 0; i < 5; i++) { const h = Math.round(this.h * (1 - Math.abs(i - 2) / 3) * (0.8 + 0.2 * Math.sin(this.t * 0.6 + i))); ctx.fillStyle = i === 2 ? '#fce8b0' : '#d8a860'; ctx.fillRect(x - 5 + i * 2, b - h, 2, h); } }
}

class Hauptmann extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw - 64, gy - 54, 24, 54, 48, 4);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 12000; this.nameKey = 'bossHauptmann'; this.music = 'boss';
    this.face = -1; this.state = 'intro'; this.timer = 0; this.vx = 0; this.vy = 0; this.ph2 = false; this.lootY = gy - 40; this.step = 0; this.thrusts = 0; this.air = false;
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  open() { return this.state === 'recover' || this.state === 'leapWind' || this.state === 'leap'; }
  behind() { return Math.sign(W.player.cx - this.cx) === -this.face; }
  above() { return W.player.feet < this.y + 10; }
  hurtBoxes() {
    if (this.dying) return [];
    const body = { x: this.x, y: this.y, w: this.w, h: this.h };
    if (this.open() || this.behind()) return [body];
    if (this.above()) return [{ x: this.x, y: this.y, w: this.w, h: 14 }];
    return [];
  }
  armorBoxes() { return this.dying || this.open() ? [] : [{ x: this.face > 0 ? this.cx + 6 : this.cx - 26, y: this.y + 4, w: 20, h: 46 }]; }
  deflect(id, b) {
    if (this.lastDef === id) return; this.lastDef = id;
    Audio8.sfx('tink', this.cx); W.sparks(b.x + b.w / 2, b.y + 16, 7); this.flashT = 3; W.hitstop = Math.max(W.hitstop, 3);
    if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.hauptmann_tip) { Castle.setFlag('hauptmann_tip'); Game.note('bossHauptmannTip'); }
  }
  lance() { return { x: this.face > 0 ? this.cx + 8 : this.cx - 74, y: this.y + 18, w: 66, h: 8 }; }
  shieldBox() { return { x: this.face > 0 ? this.cx + 6 : this.cx - 26, y: this.y + 4, w: 20, h: 46 }; }
  update() {
    if (this.dying) { this.updateDeath(); return; }
    this.tick(); const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.3 : 1;
    if (!this.ph2 && this.hp < this.maxHp / 2) { this.ph2 = true; Audio8.sfx('roar', this.cx); W.shake = Math.max(W.shake, 10); W.spawn(new Shock(this.cx, this.cy, 70, '#f8d878', 4)); }
    switch (this.state) {
      case 'intro': this.vx = 0; if (this.timer === 40) { Audio8.sfx('clank', this.cx); W.dust(this.cx, this.gy, 6); } if (this.timer > 70) this.go('idle'); break;
      case 'idle': {
        if (Math.abs(dx) > 8) this.face = dx > 0 ? 1 : -1;
        this.vx = Math.abs(dx) > 80 ? this.face * 0.7 * sp : 0; this.step += Math.abs(this.vx);
        if (this.timer > (this.ph2 ? 36 : 62)) { const r = Math.random(); this.go(Math.abs(dx) < 96 ? (r < 0.6 ? 'wind' : 'leapWind') : (r < 0.55 ? 'bashWind' : 'leapWind')); this.vx = 0; Audio8.sfx('tell', this.cx); }
        break;
      }
      case 'wind': this.vx = 0; if (this.timer > 30 / sp) { this.go('thrust'); Audio8.sfx('whoosh', this.cx); } break;
      case 'thrust':
        this.vx = this.face * 3.3 * sp;
        if (p.alive && Phys.overlap(this.lance(), p)) p.hurt(this.dmg, this.cx);
        if (this.timer > 14) { this.thrusts++; if (this.ph2 && this.thrusts < 2) { this.go('wind'); this.timer = 14; } else { this.thrusts = 0; this.go('recover'); Audio8.sfx('clank', this.cx); } }
        break;
      case 'bashWind': this.vx = -this.face * 0.5; if (this.timer > 28) { this.go('bash'); Audio8.sfx('charge', this.cx); } break;
      case 'bash': {
        this.vx = this.face * 4.4 * sp;
        if (p.alive && Phys.overlap(this.shieldBox(), p)) { p.hurt(this.dmg, this.cx); }
        if (this.timer % 4 === 0) W.dust(this.cx - this.face * 8, this.gy, 1);
        const wall = this.face > 0 ? this.x + this.w >= this.ax + this.aw - 10 : this.x <= this.ax + 10;
        if (wall || this.timer > 70) { this.go('recover'); this.timer = -20; W.shake = Math.max(W.shake, 12); Audio8.sfx('boom', this.cx); W.spawn(new Shock(this.cx + this.face * 14, this.cy, 40, '#f8d878', 3)); }
        break;
      }
      case 'leapWind': this.vx = 0; if (this.timer > 24 / sp) { this.go('leap'); this.vy = -6.6; this.vx = clamp(dx / 42, -3.2, 3.2); this.face = dx > 0 ? 1 : -1; this.air = true; Audio8.sfx('djump', this.cx); } break;
      case 'leap':
        this.vy += 0.3;
        if (this.y + this.h >= this.gy && this.vy > 0) { // Aufschlag: Schockwellen nach beiden Seiten
          this.y = this.gy - this.h; this.vy = 0; this.air = false; W.shake = Math.max(W.shake, 14); Audio8.sfx('boom', this.cx); Input.rumble(0.6, 0.6, 220);
          for (const d of [-1, 1]) { W.spawn(new Welle(this.cx + d * 14, this.gy, d, this.dmg - 1, this.ph2)); if (this.ph2) { const w2 = new Welle(this.cx + d * 14, this.gy, d, this.dmg - 1, false); w2.t = -24; w2.x -= d * 0; W.spawn(w2); } }
          this.go('recover');
        }
        break;
      default: this.vx = 0; if (this.timer > (this.ph2 ? 42 : 62)) this.go('idle'); // recover: Schild hängt herab
    }
    // Bewegung in der Arena
    this.x = clamp(this.x + this.vx, this.ax + 6, this.ax + this.aw - this.w - 6);
    if (this.state === 'leap') this.y += this.vy; else this.y = this.gy - this.h;
    if (!this.air) this.touch();
  }
  lightUp(L, cx, cy) {
    if (this.state === 'wind') L.push({ x: this.cx + this.face * 34 - cx, y: this.y + 22 - cy, r: 26, c: [252, 248, 220], a: 0.55 });
    if (this.ph2) L.push({ x: this.cx - cx, y: this.y + 10 - cy, r: 40, c: [252, 120, 60], a: 0.18 });
  }
  draw(ctx) {
    const S = HAUPTMANN_ART.get(); if (!S) return;
    const st = this.state, s = st === 'wind' || st === 'leapWind' ? S.wind : st === 'thrust' ? S.thrust : st === 'recover' ? S.recover : st === 'bash' || st === 'bashWind' ? S.bash : st === 'leap' ? S.leap : S.walk[(this.step >> 4) & 1];
    this.spr(ctx, s, this.face < 0, this.face * 12, 3, this.flashT > 0 && (this.flashT & 2));
  }
}
