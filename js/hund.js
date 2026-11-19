// Kettenhund Brutus (Zwischengegner im Zwinger): ein schwerer Mastiff mit Stachelhalsband, angekettet an einen Pfahl mitten in der
// Arena. Die Kette reicht nur so weit: Springt er nach einem Helden außer Reichweite, reißt sie ihn mitten im Sprung zurück – er
// landet auf dem Rücken, zappelt mit den Beinen und ist eine Weile wehrlos (das ist der Moment). Er bellt außerdem ein „WAU!“, das
// als Schallwelle über den Boden rollt (drüberspringen). Ab halber Energie lockert sich der Pfahl: die Kette reicht weiter, er wird
// schneller und bellt zweimal. Bilder: tools/blender/hund_bl.py, pack_hund.py
'use strict';
const HUND_ART = (() => {
  const MAP = {"hund_stand0":[0,0,96,64],"hund_stand1":[97,0,96,64],"hund_crouch":[194,0,96,64],"hund_leap":[291,0,96,64],"hund_bark":[388,0,96,64],"hund_choke":[485,0,96,64]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { walk: [fr('hund_stand0'), fr('hund_stand1')], crouch: fr('hund_crouch'), leap: fr('hund_leap'), bark: fr('hund_bark'), choke: fr('hund_choke') };
  };
  img.src = 'img/hund3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Wau extends Ent { // gebelltes „WAU!“ als Schallwelle am Boden: rollt auf den Helden zu, drüberspringen
  constructor(x, gy, d, dmg) { super(x - 12, gy - 14, 24, 14); this.kind = 'eproj'; this.unstoppable = true; this.d = d; this.dmg = dmg; this.gy = gy; this.txt = tr('hundWau'); }
  update() {
    this.t++; this.x += this.d * 2.7; const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.t > 120 || this.x < W.arenaX - 30 || this.x > W.arenaX + W.arenaW + 30) this.dead = true;
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 18, c: [252, 220, 140], a: 0.25 }); }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.gy - W.cam.y), k = 1 + 0.12 * Math.sin(this.t * 0.8);
    ctx.strokeStyle = 'rgba(252,224,150,0.55)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const r = 6 + i * 4 + (this.t % 6); ctx.beginPath(); ctx.arc(x - this.d * (10 + i * 3), y - 6, r, this.d > 0 ? -0.9 : Math.PI - 0.9, this.d > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); }
    ctx.save(); ctx.translate(x, y - 7); ctx.scale(k, k); Font.draw(ctx, this.txt, 0, -4, '#fce0a0', { align: 'center', shadow: '#5c2c10' }); ctx.restore();
  }
}

class Kettenhund extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw - 120, gy - 34, 50, 34, 30, 2); // früher Zwischengegner (Gefahrenstufe 0): Energie wie Zugführer und Golem
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 9000; this.nameKey = 'bossHund'; this.music = 'boss';
    this.post = ax + aw / 2; this.reach = 7 * T; // Pfahl in der Mitte, so weit reicht die Kette (vom Pfahl bis zum Halsband)
    this.face = -1; this.state = 'intro'; this.timer = 0; this.vx = 0; this.vy = 0; this.ph2 = false; this.lootY = gy - 40; this.step = 0; this.air = false; this.barks = 0; this.wobble = 0;
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { return super.hit(this.state === 'choke' ? dmg * 1.5 : dmg, id); } // auf dem Rücken: Treffer sitzen besser
  collar() { // Kettenring am Halsband (Weltkoordinaten), je nach Pose
    const O = { walk: [11, -39], crouch: [14, -33], leap: [16, -44], bark: [14, -43], choke: [-18, -22] }, k = this.pose(), o = O[k] || O.walk;
    return [this.cx + this.face * o[0], this.y + this.h + 2 + o[1]];
  }
  pose() { const s = this.state; return s === 'choke' || s === 'yank' ? 'choke' : s === 'crouch' ? 'crouch' : s === 'leap' ? 'leap' : s === 'bark' || s === 'barkWind' ? 'bark' : 'walk'; }
  update() {
    if (this.dying) { this.updateDeath(); return; }
    this.tick(); const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.25 : 1;
    if (this.wobble > 0) this.wobble--;
    if (!this.ph2 && this.hp < this.maxHp / 2) { // der Pfahl lockert sich: mehr Kette, mehr Tempo
      this.ph2 = true; this.reach += 2.5 * T; this.wobble = 40; Audio8.sfx('crack', this.post); W.shake = Math.max(W.shake, 10); Audio8.sfx('roar', this.cx);
      W.spawn(new Shock(this.post, this.gy - 12, 50, '#f8d878', 3)); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.post, this.gy - 4, rnd(-1.6, 1.6), rnd(-2.6, -0.8), i % 2 ? '#8c6c4c' : '#5c4430', 30, 2, 0.18));
    }
    const lim = (x) => clamp(x, Math.max(this.ax + 6, this.post - this.reach), Math.min(this.ax + this.aw - this.w - 6, this.post + this.reach - this.w));
    switch (this.state) {
      case 'intro': this.vx = 0; this.face = dx > 0 ? 1 : -1; if (this.timer === 30) Audio8.sfx('growl', this.cx); if (this.timer > 70) this.go('idle'); break;
      case 'idle': {
        if (Math.abs(dx) > 10) this.face = dx > 0 ? 1 : -1;
        this.vx = Math.abs(dx) > 70 ? this.face * 0.9 * sp : 0; this.step += Math.abs(this.vx);
        if (this.timer > (this.ph2 ? 34 : 56)) { this.vx = 0; this.go(Math.random() < (Math.abs(dx) < 170 ? 0.62 : 0.3) ? 'crouch' : 'barkWind'); Audio8.sfx(this.state === 'crouch' ? 'growl' : 'tell', this.cx); }
        break;
      }
      case 'crouch': this.vx = 0; this.face = dx > 0 ? 1 : dx < 0 ? -1 : this.face; if (this.timer > 34 / sp) { // Satz zum Helden (zielt auf seine jetzige Stelle)
        this.go('leap'); this.air = true; this.vy = -5.0; this.vx = clamp(dx / 30, -4.6, 4.6); if (Math.abs(this.vx) < 1.5) this.vx = this.face * 1.5; Audio8.sfx('whoosh', this.cx);
      } break;
      case 'leap': {
        this.vy += 0.3; this.y += this.vy; this.x += this.vx;
        const [cx] = this.collar();
        if (Math.abs(cx - this.post) > this.reach + 6) { // Kette straff: reißt ihn zurück
          this.go('yank'); this.vx = -Math.sign(cx - this.post) * 2.4; this.vy = -2.2; Audio8.sfx('chain', this.cx); W.shake = Math.max(W.shake, 8); Input.rumble(0.5, 0.4, 160);
          if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.hund_tip) { Castle.setFlag('hund_tip'); Game.note('bossHundTip'); }
        } else if (this.y + this.h >= this.gy && this.vy > 0) { this.y = this.gy - this.h; this.air = false; this.vx = 0; W.dust(this.cx, this.gy, 4); Audio8.sfx('stone', this.cx); W.shake = Math.max(W.shake, 5); this.go('recover'); }
        break;
      }
      case 'yank': // fliegt rückwärts und landet auf dem Rücken
        this.vy += 0.32; this.y += this.vy; this.x += this.vx;
        if (this.y + this.h >= this.gy && this.vy > 0) { this.y = this.gy - this.h; this.air = false; this.vx = 0; W.dust(this.cx, this.gy, 6); Audio8.sfx('boom', this.cx); W.shake = Math.max(W.shake, 10); this.go('choke'); }
        break;
      case 'choke': this.vx = 0; if (this.timer % 12 === 0) W.spawn(new Particle(this.cx + rnd(-14, 14), this.y - 4, rnd(-0.4, 0.4), -0.7, '#ffe890', 22, 1, 0)); if (this.timer > (this.ph2 ? 66 : 86)) { this.go('recover'); this.timer = -6; Audio8.sfx('growl', this.cx); } break;
      case 'barkWind': this.vx = 0; this.face = dx > 0 ? 1 : -1; if (this.timer > 20 / sp) { this.go('bark'); this.barks = 0; } break;
      case 'bark':
        this.vx = 0;
        if (this.timer === 4 || (this.ph2 && this.timer === 30)) { const [hx] = this.collar(); W.spawn(new Wau(hx + this.face * 22, this.gy, this.face, Math.max(1, this.dmg - 1))); Audio8.sfx('roar', this.cx); W.shake = Math.max(W.shake, 3); }
        if (this.timer > (this.ph2 ? 50 : 30)) this.go('recover');
        break;
      default: this.vx = 0; if (this.timer > (this.ph2 ? 26 : 40)) this.go('idle'); // recover
    }
    if (!this.air) { this.x = lim(this.x + this.vx); this.y = this.gy - this.h; }
    else this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
    if (this.state !== 'choke' && this.state !== 'yank') this.touch();
  }
  lightUp(L, cx, cy) {
    const [hx, hy] = this.collar();
    if (this.state === 'crouch' || this.state === 'barkWind') L.push({ x: hx + this.face * 26 - cx, y: hy - 4 - cy, r: 22, c: [255, 80, 50], a: 0.4 });
    if (this.ph2) L.push({ x: this.cx - cx, y: this.cy - cy, r: 44, c: [252, 120, 60], a: 0.14 });
  }
  drawPost(ctx) { // Holzpfahl mit Eisenring, im zweiten Akt schief und wackelig
    const x = Math.round(this.post - W.cam.x), y = Math.round(this.gy - W.cam.y), lean = this.ph2 ? 2 : 0, w = this.wobble > 0 ? ((this.wobble >> 1) & 1) * 2 - 1 : 0;
    for (let i = 0; i < 26; i++) { const xi = x - 3 + Math.round((lean + w) * i / 26); ctx.fillStyle = i < 2 ? '#c8a878' : i % 7 === 3 ? '#4c3420' : '#7c5c3c'; ctx.fillRect(xi, y - i - 1, 6, 1); ctx.fillStyle = '#5c4430'; ctx.fillRect(xi + 4, y - i - 1, 2, 1); }
    ctx.fillStyle = '#a8a8b8'; ctx.fillRect(x - 4 + lean + w, y - 22, 8, 2); ctx.fillStyle = '#e0e0ec'; ctx.fillRect(x - 3 + lean + w, y - 22, 3, 1);
    if (this.ph2) { ctx.fillStyle = '#3c2c20'; ctx.fillRect(x - 6, y - 1, 3, 1); ctx.fillRect(x + 4, y - 1, 3, 1); } // aufgerissene Erde
  }
  drawChain(ctx) { // Kettenglieder vom Pfahl zum Halsband, durchhängend je nach Spiel
    const [hx, hy] = this.collar(), px = this.post + (this.ph2 ? 2 : 0), py = this.gy - 21, d = Math.hypot(hx - px, hy - py), slack = Math.max(0, this.reach - d);
    const sag = Math.min(26, slack * 0.35), n = Math.max(6, Math.round(d / 4));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = px + (hx - px) * t, y = py + (hy - py) * t + sag * 4 * t * (1 - t);
      const yy = Math.min(y, this.gy - 2), sx = Math.round(x - W.cam.x), sy = Math.round(yy - W.cam.y);
      ctx.fillStyle = '#2c2c34'; ctx.fillRect(sx - 1, sy - 1, 3, 3); ctx.fillStyle = i % 2 ? '#a8a8b8' : '#d0d0dc'; ctx.fillRect(sx - (i % 2), sy - ((i + 1) % 2), 1 + (i % 2), 1 + ((i + 1) % 2));
    }
  }
  draw(ctx) {
    this.drawPost(ctx);
    const S = HUND_ART.get(); if (!S) return;
    const k = this.pose(), s = k === 'walk' ? S.walk[(this.step >> 4) & 1] : S[k], jig = this.state === 'crouch' ? ((this.t >> 1) & 1) : 0;
    const flip = this.face < 0; // auf dem Rücken liegt der Kopf hinten, zum Pfahl hin (so ist das Bild gerendert)
    this.spr(ctx, s, flip, jig, this.state === 'choke' ? 1 : 2, this.flashT > 0 && (this.flashT & 2));
    this.drawChain(ctx);
  }
}
