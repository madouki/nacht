// Pförtner Granitus (Palastwächter im Moorpalast, Umland-Ort P): ein lebendig gewordener Steinritter, seit 1723 im Dienst und
// noch nie im Urlaub. Er will deinen Ausweis sehen – und du hast keinen.
//   Schild        – deckt die Höhe, auf der du stehst: aufrecht oben, geduckt unten, aber mit einer kurzen Verzögerung. Treffer
//                   auf den Schild prallen ab (Funken). Durch kommt, wer schnell die Haltung wechselt, mit dem Abwärtshieb von oben
//                   zuschlägt oder ihn von hinten erwischt.
//   Stich         – hält er den Schild oben, sticht er unten zu (drüberspringen); hält er ihn unten, sticht er oben zu (ducken)
//   Wurfaxt       – ab halber Energie und auf Abstand: die Hellebarde fliegt wie ein Bumerang auf Brusthöhe (ducken)
//   Sprung        – ab halber Energie: springt zum Helden, Steinwellen laufen nach beiden Seiten (drüberspringen); danach
//                   steht er kurz ohne Deckung da
// Bilder: tools/blender/waechter_bl.py → pack_waechter.py (high0/1, low0/1, thrustL, thrustH, leap, slam; 72×90). Lied: 'palast'
'use strict';
const WAECHTER_ART = (() => {
  const MAP = {"gran_high0":[0,0,72,90],"gran_high1":[73,0,72,90],"gran_low0":[146,0,72,90],"gran_low1":[219,0,72,90],"gran_thrustL":[292,0,72,90],"gran_thrustH":[365,0,72,90],"gran_leap":[438,0,72,90],"gran_slam":[511,0,72,90]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = {}; for (const k of ['high0', 'high1', 'low0', 'low1', 'thrustL', 'thrustH', 'leap', 'slam']) S[k] = fr('gran_' + k);
  };
  img.src = 'img/waechter3d.png?v=' + (window.BUILD || '');
  return { MAP, get: () => S };
})();

class Steinwelle extends Ent { // Steinsplitter, die am Boden entlangrasen
  constructor(x, gy, dir, dmg) { super(x - 6, gy - 12, 12, 12); this.kind = 'eproj'; this.gy = gy; this.dir = dir; this.dmg = dmg; }
  update() {
    this.t++; this.x += this.dir * 3.0; const p = W.player;
    if (this.t % 2 === 0) W.spawn(new Particle(this.cx, this.gy - 2, -this.dir * rnd(0.2, 1), rnd(-1.8, -0.5), this.t % 4 ? '#8c8a94' : '#5c8a3c', 18, 1, 0.12));
    if (p.alive && !p.hidden && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; return; }
    if (this.x < W.arenaX - 4 || this.x + this.w > W.arenaX + W.arenaW + 4 || this.t > 200) { this.dead = true; Audio8.sfx('crumble', this.cx); }
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.gy - W.cam.y), k = 0.8 + 0.2 * Math.sin(this.t * 0.7);
    for (let i = -1; i <= 1; i++) { const h = Math.round((i === 0 ? 12 : 8) * k), bx = x + i * 5;
      ctx.fillStyle = '#2c2a30'; ctx.fillRect(bx - 3, y - h - 1, 6, h + 1); ctx.fillStyle = i ? '#6c6a74' : '#8e8c96'; ctx.fillRect(bx - 2, y - h, 4, h); ctx.fillStyle = '#b8b6c0'; ctx.fillRect(bx - 2, y - h, 2, 1); }
  }
}

class Wurfaxt extends Ent { // die geworfene Hellebarde: fliegt geradeaus, wird langsamer und kehrt zum Pförtner zurück
  constructor(owner, x, y, dir, dmg) { super(x - 10, y - 5, 20, 10); this.kind = 'eproj'; this.owner = owner; this.vx = dir * 4.4; this.dir = dir; this.dmg = dmg; }
  update() {
    this.t++; this.vx -= this.dir * 0.1; this.x += this.vx; const p = W.player, o = this.owner;
    if (this.t % 9 === 0) Audio8.sfx('whoosh', this.cx);
    if (p.alive && !p.hidden && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    this.x = clamp(this.x, W.arenaX, W.arenaX + W.arenaW - this.w);
    if ((this.t > 40 && Math.abs(this.cx - o.cx) < 14) || o.dead || o.dying || this.t > 220) { this.dead = true; o.axe = null; }
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), a = this.t * 0.45, c = Math.cos(a), s = Math.sin(a);
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - c * 13, y - s * 13); ctx.lineTo(x + c * 13, y + s * 13); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#9c9cac'; ctx.beginPath(); ctx.moveTo(x + c * 13, y + s * 13); ctx.lineTo(x + c * 8 - s * 6, y + s * 8 + c * 6); ctx.lineTo(x + c * 6, y + s * 6); ctx.fill();
    ctx.fillStyle = '#d8d8e4'; ctx.fillRect(Math.round(x + c * 13) - 1, Math.round(y + s * 13) - 1, 2, 2);
  }
}

class Granitus extends Boss {
  constructor(ax, aw) {
    const c = Math.floor((ax + aw / 2) / T); let r = W.room.h - 1; while (r > 1 && Phys.solidTile(c, r - 1)) r--;
    const gy = r * T;
    super(ax + aw - 90, gy - 66, 30, 66, 52, 2);
    Object.assign(this, { ax, aw, gy, mini: true, score: 16000, nameKey: 'bossWaechter', music: 'palast', face: -1, ph2: false, n: 0, guard: 'high', guardT: 0, blocks: 0, vy: 0, axe: null, lootY: gy - 24, stone: 1 });
    this.go('intro');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return this.state !== 'intro'; }
  say(key, col) { W.popup(clamp(this.cx, W.cam.x + 80, W.cam.x + View.w - 80), this.y - 16, tr(key), col); }
  // Wo trifft der Held? Geduckt unten, mit dem Abwärtshieb von oben, sonst (auch Geschosse und Zauber) auf Brusthöhe
  heightOf(p) {
    if (p.atkT > 0 && (p.crouchAtk || (p.crouch && p.onGround))) return 'low';
    if (p.atkT > 0 && !p.onGround && (p.atkDir === 'down' || p.atkDir === 'downd')) return 'top';
    return 'high';
  }
  guarding() { return ['idle', 'aimL', 'aimH', 'thrustL', 'thrustH', 'recover', 'throw'].includes(this.state); }
  hit(dmg, id) {
    const p = W.player, front = Math.sign(p.cx - this.cx) === this.face || Math.abs(p.cx - this.cx) < 6;
    if (!this.dying && this.guarding() && front && this.heightOf(p) === this.guard) { // abgeblockt
      if (id && this.lastBlock === id) return false; this.lastBlock = id;
      const sy = this.guard === 'high' ? this.y + 18 : this.y + 48;
      Audio8.sfx('clank', this.cx); W.spawn(new Spark(this.cx + this.face * 14, sy)); W.spawn(new Spark(this.cx + this.face * 16, sy + 6)); W.shake = Math.max(W.shake, 2);
      if (p.alive) p.x += Math.sign(p.cx - this.cx) * 3; // der Schild schiebt zurück
      this.blocks++;
      if (this.blocks === 3) this.say('waechterTipp', '#fcfcfc'); else if (this.blocks === 7) this.say('waechterTipp2', '#fcfcfc');
      return false;
    }
    return super.hit(dmg, id);
  }
  update() {
    this.tick();
    if (this.dying === 2 && !(typeof Rausch !== 'undefined' && Rausch.on) && typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('umland_palast_frei');
    if (this.dying) { if (this.dying % 4 === 0) W.spawn(new Particle(this.cx + rnd(-14, 14), this.y + rnd(0, 60), rnd(-1, 1), rnd(-1.4, 0), ['#8e8c96', '#5c5a64', '#5e8a30'][(this.dying / 4) % 3], 40, 2, 0.12)); return this.updateDeath(110); }
    const p = W.player, s = this.state, t = this.timer, d = Math.abs(p.cx - this.cx);
    if (!this.ph2 && this.hp <= this.maxHp / 2) { this.ph2 = true; this.say('waechterWut', '#ffb27c'); Audio8.sfx('crumble', this.cx); W.shake = Math.max(W.shake, 8); }
    if (this.stone > 0 && s !== 'intro') this.stone = Math.max(0, this.stone - 0.05);
    switch (s) {
      case 'intro': // steht als Statue, erwacht: Staub rieselt, der Sehschlitz glimmt auf
        if (t % 8 === 0 && t < 70) W.spawn(new Particle(this.cx + rnd(-14, 14), this.y + rnd(0, 20), rnd(-0.3, 0.3), rnd(0.2, 0.8), '#8e8c96', 30, 1, 0.05));
        if (t === 40) { Audio8.sfx('crumble', this.cx); W.shake = Math.max(W.shake, 4); }
        if (t > 50) this.stone = Math.max(0, 1 - (t - 50) / 30);
        if (t === 84) this.say('waechterOhne', '#fcfcfc');
        if (t > 110) this.go('idle');
        break;
      case 'idle': { // Deckung: der Schild folgt der Haltung des Helden – mit Verzögerung
        this.face = Math.sign(p.cx - this.cx) || this.face;
        const want = p.crouch && p.onGround ? 'low' : 'high';
        if (want !== this.guard) { if (++this.guardT > (this.ph2 ? 13 : 22)) { this.guard = want; this.guardT = 0; Audio8.sfx('klack', this.cx); } } else this.guardT = 0;
        const v = this.ph2 ? 0.6 : 0.42;
        if (d > 70) this.x += this.face * v; else if (d < 38) this.x -= this.face * v * 0.8;
        if (t > (this.ph2 ? 34 : 48)) {
          this.n++;
          if (this.ph2 && this.n % 3 === 0) this.go('leap');
          else if (this.ph2 && d > 120 && !this.axe) this.go('throw');
          else if (d < 90) this.go(this.guard === 'high' ? 'aimL' : 'aimH');
          else this.timer = Math.floor(t * 0.6);
        }
        break;
      }
      case 'aimL': case 'aimH': // Ansage: die Klinge blitzt, er lehnt sich zurück
        if (t === 1) Audio8.sfx('charge', this.cx);
        if (t % 4 === 0) W.spawn(new Particle(this.cx + this.face * 26, s === 'aimL' ? this.gy - 10 : this.gy - 48, rnd(-0.4, 0.4), rnd(-0.6, -0.1), '#fce8a8', 12, 1, 0.02));
        if (t > (this.ph2 ? 12 : 16)) this.go(s === 'aimL' ? 'thrustL' : 'thrustH');
        break;
      case 'thrustL': case 'thrustH': { // Stich unter dem Schild durch (tief) oder darüber (hoch)
        if (t === 1) { Audio8.sfx('whoosh', this.cx); this.x += this.face * 6; }
        if (t >= 2 && t <= 9) {
          const x0 = this.face > 0 ? this.cx + 12 : this.cx - 60, y0 = s === 'thrustL' ? this.gy - 16 : this.gy - 40, h = 16; // tief: Füße (Sprung weicht aus) · hoch: Kopfhöhe des stehenden Helden (28), geduckt (20) frei
          if (p.alive && p.x + p.w > x0 && p.x < x0 + 48 && p.y + p.h > y0 && p.y < y0 + h) p.hurt(this.dmg, this.cx);
          if (t === 4) { Audio8.sfx('clank', this.cx); W.spawn(new Spark(this.cx + this.face * 56, y0 + h / 2)); }
        }
        if (t > 22) this.go('recover');
        break;
      }
      case 'recover':
        if (t > (this.ph2 ? 10 : 18)) this.go('idle');
        break;
      case 'throw': // Hellebarde als Bumerang, Schild bleibt unten
        this.guard = 'low';
        if (t === 14) { this.axe = new Wurfaxt(this, this.cx + this.face * 18, this.gy - 40, this.face, this.dmg); W.spawn(this.axe); Audio8.sfx('throw', this.cx); }
        if (t > 20 && !this.axe) this.go('idle');
        if (t > 260) { this.axe = null; this.go('idle'); }
        break;
      case 'leap': { // in die Hocke, Sprung zum Helden, Aufschlag mit Steinwellen
        if (t < 14) { if (t === 1) Audio8.sfx('charge', this.cx); break; }
        if (t === 14) { const tx = clamp(p.cx, this.ax + 30, this.ax + this.aw - 30); this.vy = -6.2; this.vx = (tx - this.cx) / 40; Audio8.sfx('jump', this.cx); }
        this.vy += 0.31; this.x += this.vx; this.y += this.vy;
        if (this.y + this.h >= this.gy && this.vy > 0) {
          this.y = this.gy - this.h; Audio8.sfx('boom', this.cx); Audio8.sfx('crumble', this.cx); W.shake = Math.max(W.shake, 12); Input.rumble(0.7, 0.5, 260);
          W.spawn(new Steinwelle(this.cx - 16, this.gy, -1, this.dmg)); W.spawn(new Steinwelle(this.cx + 16, this.gy, 1, this.dmg));
          if (p.alive && Math.abs(p.cx - this.cx) < 26 && p.feet > this.gy - 20) p.hurt(this.dmg, this.cx);
          this.go('slam');
        }
        break;
      }
      case 'slam': // nach dem Aufschlag: Klinge im Boden, keine Deckung
        if (t % 10 === 0) W.spawn(new Particle(this.cx + this.face * 10, this.y + 4, rnd(-0.4, 0.4), -0.7, '#a8d8fc', 18, 1, 0.05));
        if (t > (this.ph2 ? 46 : 56)) this.go('idle');
        break;
    }
    if (this.state !== 'leap') this.y = this.gy - this.h;
    this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
    if (this.state !== 'intro') this.touch();
  }
  pose() {
    const s = this.state, t = this.timer, idle = ((this.t / 22) | 0) & 1;
    if (s === 'thrustL') return t < 18 ? 'thrustL' : 'high0';
    if (s === 'thrustH') return t < 18 ? 'thrustH' : 'low0';
    if (s === 'aimL') return 'high1';
    if (s === 'aimH') return 'low1';
    if (s === 'leap') return t < 14 ? 'slam' : 'leap';
    if (s === 'slam') return 'slam';
    if (s === 'throw') return t < 14 ? 'thrustH' : 'low' + idle;
    return (this.guard === 'low' ? 'low' : 'high') + (s === 'intro' ? 0 : idle);
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx + this.face * 6 - cx, y: this.y + 14 - cy, r: 22, c: [255, 180, 80], a: 0.2 * (1 - this.stone) }); }
  draw(ctx) {
    const S = WAECHTER_ART.get(); if (!S) return;
    const back = this.state === 'aimL' || this.state === 'aimH' ? -this.face * 2 : 0;
    this.spr(ctx, S[this.pose()], this.face < 0, back, 0, this.flashT > 0 && (this.flashT & 2));
    if (this.stone > 0) { // noch Statue: grauer Schleier
      const ld = this.lastDraw; if (ld) { ctx.save(); ctx.globalAlpha = this.stone; ctx.filter = 'grayscale(1) brightness(0.85)'; Sprites.draw(ctx, ld.s, Math.round(ld.x - W.cam.x), Math.round(ld.y - W.cam.y), ld.flip); ctx.restore(); }
    }
    if (this.guardT > 4 && this.state === 'idle') Font.draw(ctx, '?', Math.round(this.cx - W.cam.x), Math.round(this.y - 10 - W.cam.y), '#fce8a8', { align: 'center', shadow: '#000' });
  }
}
