// Madame Vitrina, Königin der Schaufensterpuppen (Zwischengegnerin in der Lichterpassage). Wie ihre Puppen bewegt sie sich nur,
// wenn man wegschaut:
//   angeschaut – erstarrt in einer Pose (ein Porzellanklirren); dann lässt sie sich treffen
//   erwischt   – dreht sich der Held zu ihr um, während sie gerade gleitet, gerät sie aus der Fassung: Treffer sitzen besser (×1,5)
//   weggeschaut – gleitet auf ihrem Ständer heran und schlägt mit dem Fächer zu; ist der Held weit weg, wirft sie Hutschachteln
//   angestarrt – wer sie zu lange anstarrt („STARR NICHT SO!“), dem steht sie plötzlich im Rücken
//   Verstärkung – sie ruft Schaufensterpuppen an beide Ränder, damit man nicht alles im Blick behält
// Ab halber Energie gleitet sie schneller, ruft öfter Puppen und wechselt öfter die Seite. Bilder: tools/blender/vitrina_bl.py
'use strict';
const VITRINA_ART = (() => {
  const MAP = {"vitrina_show":[0,0,48,64],"vitrina_point":[49,0,48,64],"vitrina_wave":[98,0,48,64],"vitrina_shy":[147,0,48,64],"vitrina_hip":[196,0,48,64],"vitrina_reach":[245,0,48,64]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['show', 'point', 'wave', 'shy', 'hip', 'reach']) S[k] = fr('vitrina_' + k);
  };
  img.src = 'img/vitrina3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Hutschachtel extends Ent { // geworfene Hutschachtel: fliegt im Bogen, springt zweimal auf, rollt aus
  constructor(x, y, vx, vy, dmg) { super(x - 6, y - 5, 12, 10); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.dmg = dmg; this.bounce = 0; this.col = ['#c86090', '#5c9cc8', '#e8b848'][Math.floor(rnd(0, 3))]; }
  update() {
    this.t++; this.vy += 0.2; this.x += this.vx; this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.pop(); return; }
    const gy = Math.floor((this.y + this.h) / T);
    if (this.vy > 0 && Phys.solidTile(Math.floor(this.cx / T), gy)) {
      this.y = gy * T - this.h; this.vy = -this.vy * 0.55; this.vx *= 0.8; Audio8.sfx('klack', this.cx);
      if (++this.bounce > 2) this.pop();
    }
    if (this.t > 220 || this.x < W.arenaX - 30 || this.x > W.arenaX + W.arenaW + 30) this.dead = true;
  }
  pop() { this.dead = true; for (let i = 0; i < 6; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.4, 1.4), rnd(-2, -0.4), i % 2 ? this.col : '#f4ece0', 30, 1, 0.12)); }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
    ctx.fillStyle = '#1c1018'; ctx.fillRect(x - 1, y - 1, 14, 12);
    ctx.fillStyle = this.col; ctx.fillRect(x, y + 2, 12, 8); ctx.fillStyle = '#f4ece0'; ctx.fillRect(x - 1, y, 14, 3); // Schachtel, Deckel
    ctx.fillStyle = '#fc3c5c'; ctx.fillRect(x + 5, y, 2, 10); ctx.fillRect(x + 3, y - 2, 6, 2); // Schleife
  }
}

class Vitrina extends Boss {
  constructor(ax, aw) {
    const floor = 18 * T; // Ladenzeile der Lichterpassage (Oberkante Reihe 18)
    super(ax + aw - 70, floor - 58, 22, 58, 34, 2); // früher Raum (Gefahrenstufe 2): Energie wie Brutus und Golem
    this.ax = ax; this.aw = aw; this.floor = floor; this.mini = true; this.score = 11000; this.nameKey = 'bossVitrina'; this.music = 'expo';
    this.face = -1; this.state = 'intro'; this.timer = 0; this.ph2 = false; this.lootY = floor - 30; this.pose = 'show'; this.moved = 0; this.stare = 0; this.summonT = 160; this.vx = 0; this.fade = 0;
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro' && this.state !== 'vanish'; }
  hit(dmg, id) {
    if (id && this.lastHit === id) return false;
    Audio8.sfx('tink', this.cx); W.spawn(new Particle(this.cx, this.y + 10, rnd(-1, 1), rnd(-2, -1), '#f2ece2', 30, 1, 0.2));
    return super.hit(this.state === 'caught' ? dmg * 1.5 : dmg, id);
  }
  watched() { const p = W.player, dx = this.cx - p.cx; return p.alive && (Math.abs(dx) < 8 || Math.sign(dx) === p.face); }
  freeze() { // erstarrt in einer neuen Pose (nie zweimal dieselbe)
    const P = ['show', 'point', 'wave', 'shy', 'hip'].filter(q => q !== this.pose); this.pose = P[Math.floor(Math.random() * P.length)];
    this.vx = 0; Audio8.sfx('tink', this.cx);
  }
  summon() { // zwei Schaufensterpuppen, je eine am linken und rechten Rand
    if (typeof Mannequin === 'undefined' || W.ents.filter(e => e instanceof Mannequin && !e.dead).length >= 2) return;
    for (const tx of [Math.floor(this.ax / T) + 2, Math.floor((this.ax + this.aw) / T) - 3]) { const m = new Mannequin(tx, 17, { awake: true, dress: 4 % 4 }); W.spawn(m); W.spawn(new Shock(m.cx, m.cy, 18, '#c8a0fc', 2)); }
    Audio8.sfx('rise', this.cx);
  }
  update() {
    if (this.dying) { this.updateDeath(); return; }
    this.tick(); const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.3 : 1, seen = this.watched();
    if (!this.ph2 && this.hp < this.maxHp / 2) { this.ph2 = true; W.popup(this.cx, this.y - 10, tr('vitrinaRage'), '#fc7ce8'); Audio8.sfx('shatter', this.cx); W.shake = Math.max(W.shake, 8); this.summonT = 30; }
    if (this.moved > 0) this.moved--;
    if (this.state !== 'intro' && this.state !== 'vanish' && --this.summonT <= 0) { this.summon(); this.summonT = this.ph2 ? 240 : 330; }
    switch (this.state) {
      case 'intro': this.fade = Math.min(1, this.timer / 40); if (this.timer > 70) this.go('still'); break;
      case 'still': // angeschaut: rührt sich nicht
        if (!seen) { this.go('glide'); this.stare = 0; break; }
        if (++this.stare > (this.ph2 ? 110 : 160)) { W.popup(this.cx, this.y - 10, tr('vitrinaStare'), '#fc9cd8'); this.stare = 0; this.go('vanish'); Audio8.sfx('whoosh', this.cx); }
        break;
      case 'glide': // weggeschaut: gleitet heran, wirft aus der Ferne Hutschachteln
        if (seen) { // umgedreht – erstarrt; frisch in Bewegung erwischt: aus der Fassung
          if (this.moved > 0) { this.go('caught'); W.popup(this.cx, this.y - 10, tr('vitrinaCaught'), '#f8d878'); this.freeze(); Audio8.sfx('crit', this.cx); if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.vitrina_tip) { Castle.setFlag('vitrina_tip'); Game.note('bossVitrinaTip'); } }
          else { this.go('still'); this.freeze(); }
          break;
        }
        this.face = dx > 0 ? 1 : -1; this.pose = 'reach'; this.moved = 18;
        if (Math.abs(dx) > 130 && this.timer % Math.round(70 / sp) === 30) { // Hutschachtel im Bogen
          const fl = 40, vx = clamp(dx / fl, -3.2, 3.2); W.spawn(new Hutschachtel(this.cx + this.face * 10, this.y + 14, vx, -3.2, Math.max(1, this.dmg - 1))); Audio8.sfx('throw', this.cx);
        }
        this.vx = this.face * (this.ph2 ? 1.9 : 1.45);
        if (Math.abs(dx) < 26) { this.vx = 0; this.go('slap'); this.pose = 'wave'; Audio8.sfx('whoosh', this.cx); }
        if (this.timer % 14 === 0) Audio8.sfx('step', this.cx);
        break;
      case 'slap': // Fächerschlag (nur, solange sie nicht angeschaut wird)
        this.vx = 0;
        if (this.timer === 10 && Math.abs(dx) < 34 && Math.abs(p.cy - this.cy) < 34 && p.alive) p.hurt(this.dmg, this.cx);
        if (this.timer > 22) { this.go(seen ? 'still' : 'glide'); if (seen) this.freeze(); }
        break;
      case 'caught': this.vx = 0; if (this.timer > 50) this.go(this.watched() ? 'still' : 'glide'); break;
      case 'vanish': // wer starrt, hat sie im Rücken: verschwindet und taucht hinter dem Helden auf
        this.fade = Math.max(0, 1 - this.timer / 14);
        if (this.timer === 16) { const nx = p.cx - p.face * 70 - this.w / 2; this.x = clamp(nx, this.ax + 6, this.ax + this.aw - this.w - 6); this.face = p.cx > this.cx ? 1 : -1; this.pose = 'reach'; }
        if (this.timer > 16) this.fade = Math.min(1, (this.timer - 16) / 12);
        if (this.timer > 30) this.go(this.watched() ? 'still' : 'glide');
        break;
    }
    this.x = clamp(this.x + this.vx, this.ax + 6, this.ax + this.aw - this.w - 6); this.y = this.floor - this.h;
    if (this.state === 'glide' || this.state === 'slap') this.touch();
  }
  lightUp(L, cx, cy) { if (this.state === 'glide' || this.state === 'slap') L.push({ x: this.cx - cx, y: this.y + 8 - cy, r: 20, c: [252, 120, 220], a: 0.18 }); }
  draw(ctx) {
    const S = VITRINA_ART.get(); if (!S) return;
    const jit = this.state === 'glide' ? ((this.t >> 2) & 1) : this.state === 'caught' ? ((this.t >> 1) & 1) * 2 - 1 : 0;
    ctx.save(); ctx.globalAlpha = this.fade;
    this.spr(ctx, S[this.pose] || S.show, this.face < 0, jit, 1, this.flashT > 0 && (this.flashT & 2));
    ctx.restore();
    if (this.state === 'glide' || this.state === 'slap') { // glühende Augen, solange sie sich bewegt
      const ex = Math.round(this.cx - W.cam.x + this.face * 2), ey = Math.round(this.y - W.cam.y + 9);
      ctx.fillStyle = '#fc4cdc'; ctx.fillRect(ex - 2, ey, 1, 1); ctx.fillRect(ex + 1, ey, 1, 1);
    }
  }
}
