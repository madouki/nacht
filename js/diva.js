// Primadonna Ottilie von Tremolo (Zwischengegnerin auf der Bühne des Hoftheaters, Zuschauerraum): eine Geister-Operndiva, die seit
// ihrer letzten Vorstellung auf Applaus wartet. Kampf auf der Bühne:
//   Arie      – singt mit ausgebreiteten Armen, Notenketten fliegen in Wellen über die Bühne (drüberspringen, ducken)
//   Verbeugung – nach jeder Arie ein tiefer Knicks, sie wartet auf Applaus: jetzt sitzen Treffer besser (×1,5)
//   Scheinwerfer – sie weist in den Saal, ein Lichtkegel streicht über den Bühnenboden; wer im Lichtfleck steht, verbrennt
//   zweiter Akt – „ZUGABE!“: schnellere Arien mit mehr Noten, das Geisterpublikum wirft Rosen auf die Bühne
// Bilder: tools/blender/diva_bl.py, pack_diva.py
'use strict';
const DIVA_ART = (() => {
  const MAP = {"diva_idle":[0,0,64,88],"diva_sing0":[65,0,64,88],"diva_sing1":[130,0,64,88],"diva_point":[195,0,64,88],"diva_bow":[260,0,64,88]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { idle: fr('diva_idle'), sing: [fr('diva_sing0'), fr('diva_sing1')], point: fr('diva_point'), bow: fr('diva_bow') };
  };
  img.src = 'img/diva3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Ton extends Ent { // gesungene Note: fliegt waagrecht, schwingt auf und ab, leuchtet golden
  constructor(x, y, d, ph, dmg, sp) { super(x - 4, y - 5, 8, 10); this.kind = 'eproj'; this.d = d; this.y0 = y; this.ph = ph; this.dmg = dmg; this.sp = sp; this.kind2 = (ph * 3) & 1; }
  update() {
    this.t++; this.x += this.d * this.sp; this.y = this.y0 + Math.sin(this.t * 0.11 + this.ph) * 13 - 5;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.t > 260 || this.x < W.arenaX - 24 || this.x > W.arenaX + W.arenaW + 24) this.dead = true;
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 14, c: [252, 220, 140], a: 0.22 }); }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y);
    ctx.fillStyle = 'rgba(252,224,150,0.35)'; ctx.fillRect(x - 5, y - 6, 10, 13);
    ctx.fillStyle = '#1c0c08'; ctx.fillRect(x - 3, y + 1, 5, 4); ctx.fillRect(x + 1, y - 6, 1, 8); // Notenkopf und Hals (Umriss)
    ctx.fillStyle = '#f8d878'; ctx.fillRect(x - 2, y + 2, 3, 2); ctx.fillRect(x + 1, y - 5, 1, 7);
    if (this.kind2) { ctx.fillRect(x + 2, y - 5, 2, 1); ctx.fillRect(x + 3, y - 4, 1, 2); } // Fähnchen (Achtel)
  }
}

class Rose extends Ent { // Rose aus dem Geisterpublikum: fliegt im Bogen auf die Bühne, bleibt kurz stecken
  constructor(x, y, vx, vy, dmg) { super(x - 4, y - 4, 8, 8); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.dmg = dmg; this.stuck = 0; }
  update() {
    this.t++;
    if (this.stuck) { if (++this.stuck > 50) this.dead = true; return; }
    this.vy += 0.12; this.x += this.vx; this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.vy > 0 && Phys.solidTile(Math.floor(this.cx / T), Math.floor((this.y + this.h) / T))) { this.y = Math.floor((this.y + this.h) / T) * T - this.h; this.stuck = 1; Audio8.sfx('tink', this.cx); }
    if (this.y > W.room.h * T) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), a = this.stuck ? 0 : this.t * 0.3, c = Math.cos(a), s = Math.sin(a);
    if (this.stuck && this.stuck > 34 && (this.stuck & 2)) return;
    ctx.fillStyle = '#2c7c34'; for (let k = 1; k <= 5; k++) ctx.fillRect(Math.round(x - s * k), Math.round(y + c * k), 1, 1); // Stiel
    ctx.fillStyle = '#5c0c1c'; ctx.fillRect(x - 2, y - 2, 5, 4); ctx.fillStyle = '#d81838'; ctx.fillRect(x - 1, y - 2, 3, 3); ctx.fillStyle = '#fc6c7c'; ctx.fillRect(x, y - 2, 1, 1);
  }
}

class Primadonna extends Boss {
  constructor(ax, aw) {
    const stage = 21 * T; // Bühnenboden des Zuschauerraums (Oberkante Reihe 21)
    super(ax + aw - 64, stage - 56, 24, 56, 48, 3);
    this.ax = ax; this.aw = aw; this.stage = stage; this.mini = true; this.score = 20000; this.nameKey = 'bossDiva'; this.music = 'chapel';
    this.face = -1; this.state = 'intro'; this.timer = 0; this.ph2 = false; this.lootY = stage - 30; this.spot = null; this.next = 0; this.fade = 0; this.said = 0;
    this.sx0 = Math.max(ax + 4 * T + 8, 90 * T); this.sx1 = ax + aw - 8; // Bühnenbreite (Scheinwerfer und Laufweg)
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  hit(dmg, id) { return super.hit(this.state === 'bow' ? dmg * 1.5 : dmg, id); }
  pose() { const s = this.state; return s === 'aria' ? 'sing' : s === 'spotWind' || s === 'spot' || s === 'roses' ? 'point' : s === 'bow' ? 'bow' : 'idle'; }
  say(key, col) { W.popup(this.cx, this.y - 10, tr(key), col || '#f8d878'); }
  update() {
    if (this.dying) { this.spot = null; this.updateDeath(); return; }
    this.tick(); const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.3 : 1;
    if (!this.ph2 && this.hp < this.maxHp / 2) { // zweiter Akt: sie verlangt eine Zugabe
      this.ph2 = true; this.say('divaZugabe', '#fc7c5c'); Audio8.sfx('bell', this.cx); W.shake = Math.max(W.shake, 8); W.flash = 6;
    }
    switch (this.state) {
      case 'intro': this.fade = Math.min(1, this.timer / 50); this.face = dx > 0 ? 1 : -1; if (this.timer > 80) this.go('idle'); break;
      case 'idle': { // gleitet über die Bühne, hält Abstand zum Helden
        this.face = dx > 0 ? 1 : -1;
        const want = clamp(p.cx - this.face * 110, this.sx0, this.sx1 - this.w);
        this.x += clamp(want - this.x, -0.8, 0.8);
        if (this.timer > (this.ph2 ? 46 : 70)) {
          const k = this.next++ % (this.ph2 ? 4 : 3);
          this.go(k === 1 ? 'spotWind' : k === 3 ? 'roses' : 'aria');
          if (this.state === 'aria') Audio8.sfx('tell', this.cx);
        }
        break;
      }
      case 'aria': // Notenketten in Wellen
        this.face = dx > 0 ? 1 : -1;
        if (this.timer % Math.round(16 / sp) === 8 && this.timer < 60) {
          const n = this.ph2 ? 2 : 1;
          for (let i = 0; i < n; i++) W.spawn(new Ton(this.cx + this.face * 12, this.y + 14 + i * 22, this.face, this.timer * 0.4 + i * 1.7, Math.max(1, this.dmg - 1), this.ph2 ? 2.0 : 1.6));
          Audio8.sfx('tink', this.cx);
        }
        if (this.timer > 72) { this.go('bow'); Audio8.sfx('latch', this.cx); }
        break;
      case 'bow': // Knicks: wartet auf Applaus
        if (this.timer === 12) { this.say('divaApplaus'); if (typeof Castle !== 'undefined' && Castle.flags && !Castle.flags.diva_tip) { Castle.setFlag('diva_tip'); Game.note('bossDivaTip'); } }
        if (this.timer > (this.ph2 ? 48 : 70)) this.go(this.ph2 && this.next % 2 ? 'roses' : 'idle');
        break;
      case 'spotWind': { // weist in den Saal: der Lichtkegel erscheint schwach am fernen Bühnenrand
        this.face = dx > 0 ? 1 : -1;
        if (this.timer === 1) { const from = this.face > 0 ? this.sx1 - 10 : this.sx0 + 10; this.spot = { x: from, d: -this.face, hot: false }; Audio8.sfx('latch', this.cx); }
        if (this.timer > 34 / sp) { this.go('spot'); this.spot.hot = true; Audio8.sfx('zap', this.cx); }
        break;
      }
      case 'spot': { // der heiße Lichtfleck streicht über den Bühnenboden
        const S = this.spot; S.x += S.d * (this.ph2 ? 2.4 : 1.9);
        if (p.alive && p.onGround && Math.abs(p.feet - this.stage) < 4 && Math.abs(p.cx - S.x) < 17) p.hurt(this.dmg, S.x);
        if (S.x < this.sx0 - 20 || S.x > this.sx1 + 20 || this.timer > 200) { this.spot = null; this.go('idle'); }
        break;
      }
      case 'roses': // das Geisterpublikum wirft Rosen
        if (this.timer === 6) this.say('divaBravo', '#fc9cb0');
        if (this.timer % 10 === 0 && this.timer <= (this.ph2 ? 50 : 30)) {
          const x0 = this.ax + 4, tx = clamp(p.cx + rnd(-40, 40), this.sx0, this.sx1), fl = 46 + rnd(0, 10), vx = (tx - x0) / fl;
          W.spawn(new Rose(x0, this.stage - 120, vx, -1.6, Math.max(1, this.dmg - 1))); Audio8.sfx('whoosh', x0);
        }
        if (this.timer > 70) this.go('idle');
        break;
    }
    this.x = clamp(this.x, this.sx0, this.sx1 - this.w); this.y = this.stage - this.h;
    if (this.state !== 'bow' && this.state !== 'intro') this.touch();
  }
  lightUp(L, cx, cy) {
    L.push({ x: this.cx - cx, y: this.cy - cy, r: 40, c: [200, 220, 255], a: 0.16 * this.fade });
    if (this.spot) L.push({ x: this.spot.x - cx, y: this.stage - 6 - cy, r: 30, c: [255, 240, 200], a: this.spot.hot ? 0.55 : 0.18 });
  }
  drawSpot(ctx) { // Lichtkegel von der Bühnendecke auf den Boden
    const S = this.spot; if (!S) return;
    const x = Math.round(S.x - W.cam.x), fy = Math.round(this.stage - W.cam.y), top = Math.round(this.stage - 170 - W.cam.y), a = S.hot ? 0.3 : 0.1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, top, 0, fy); g.addColorStop(0, `rgba(255,240,200,0)`); g.addColorStop(1, `rgba(255,236,190,${a})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 4, top); ctx.lineTo(x + 4, top); ctx.lineTo(x + 18, fy); ctx.lineTo(x - 18, fy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = S.hot ? `rgba(255,230,170,${0.55 + 0.2 * ((this.t >> 2) & 1)})` : 'rgba(255,230,170,0.22)';
    ctx.beginPath(); ctx.ellipse(x, fy - 1, 17, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  draw(ctx) {
    this.drawSpot(ctx);
    const S = DIVA_ART.get(); if (!S) return;
    const k = this.pose(), s = k === 'sing' ? S.sing[(this.t >> 4) & 1] : S[k], bob = Math.round(Math.sin(this.t * 0.06) * 1.5);
    const a = this.fade < 1 ? this.fade : 0.92; // Geist: ein Hauch durchscheinend
    ctx.save(); ctx.globalAlpha = a; this.spr(ctx, s, this.face < 0, 0, 2 + bob, this.flashT > 0 && (this.flashT & 2)); ctx.restore();
  }
}
