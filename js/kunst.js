// Waffenkünste: Drei Treffer kurz hintereinander entfesseln die Kunst der angelegten Waffe – ohne Waffe ein Wuchtschlag, das Silberschwert wirft ein
// Silberkreuz, die Blutrune nimmt Blutzoll (heilt), der Drachenzahn schickt eine Feuerwalze über den Boden, der Reißzahn reißt Wunden, die nachbluten.
// Dazu die Kerzenmimik: Ab und zu ist eine Kerze keine Kerze. Wer genau hinsieht, merkt es am Blinzeln.
'use strict';
const Kunst = (() => {
  const ART = { silver: 'kreuz', bloodrune: 'blut', dragonfang: 'feuer', reisszahn: 'reissen' }, GAP = 62;
  let chain = 0, lastId = -1, lastT = -999, ids = 0;
  const art = () => { const w = typeof Castle !== 'undefined' && Castle.on && Castle.eq && Castle.eq.weapon; return ART[w] || 'wucht'; };
  function foes(box, fn) { // jeder Gegner und Boss, dessen Trefferzone eine der Boxen berührt
    const boxes = Array.isArray(box) ? box : [box], hit = (r) => boxes.some(b => Phys.overlap(b, r));
    for (const e of W.ents) {
      if (e.dead || (e.kind !== 'enemy' && e.kind !== 'boss') || (e.kind === 'enemy' && e.rise !== undefined && e.rise < 12)) continue;
      if (e.hurtBoxes ? e.hurtBoxes().some(hit) : hit(e.hurtBox ? e.hurtBox() : e)) fn(e);
    }
  }
  function swing(p, foe, box, dmg) { // nach jedem Peitschenbild: zählt Schläge, die getroffen haben
    if (!foe || p.atkId === lastId) return;
    chain = W.frame - lastT < GAP ? chain + 1 : 1; lastId = p.atkId; lastT = W.frame;
    if (chain >= 3) { chain = 0; fire(p, box, dmg); }
  }
  function fire(p, box, dmg) {
    const a = art(), id = 'k' + (++ids), F = typeof Castle !== 'undefined' && Castle.on && Castle.flags;
    W.popup(p.cx, p.y - 18, tr('kunst_' + a), a === 'blut' ? '#fc5c6c' : a === 'feuer' ? '#fca040' : a === 'kreuz' ? '#e0e8fc' : a === 'reissen' ? '#fc8c8c' : '#fce0a8');
    W.hitstop = Math.max(W.hitstop, 5); Input.rumble(0.5, 0.6, 160); // kein Vollbild-Blitz: die Kunst kommt oft
    if (F && !F.kunst_tip) { Castle.setFlag('kunst_tip'); Game.note('kunstFirst'); }
    if (F) F.kunst = (F.kunst || 0) + 1;
    if (a === 'wucht') { // Wuchtschlag: breiter Hieb, doppelter Schaden, alles fliegt
      const big = box.map(b => ({ x: b.x - 6, y: b.y - 8, w: b.w + 12, h: b.h + 16 }));
      foes(big, e => e.hit(dmg * 2, id)); const h = box[box.length - 1];
      W.spawn(new Shock(h.x + h.w / 2, h.y + h.h / 2, 40, '#fce0a8', 4)); W.shake = Math.max(W.shake, 7); Audio8.sfx('boom', p.cx);
    } else if (a === 'kreuz') { W.spawn(new Kreuz(p.cx + p.face * 10, p.atkTop() + 6, p.face, dmg * 2)); Audio8.sfx('throw', p.cx); Audio8.sfx('tink', p.cx); }
    else if (a === 'blut') { // Blutzoll: jeder getroffene Gegner gibt Leben ab
      let n = 0; foes(box, e => { n++; e.hit(dmg, id); for (let i = 0; i < 6; i++) W.spawn(new Particle(e.cx, e.cy, (p.cx - e.cx) / 26 + rnd(-0.4, 0.4), (p.cy - e.cy) / 26 + rnd(-0.6, 0.2), i % 2 ? '#fc3c3c' : '#a8101c', 26, 2, 0)); });
      const heal = Math.min(p.maxHp - p.hp, 2 + n * 2); if (heal > 0) { p.hp += heal; W.popup(p.cx, p.y - 8, '+' + heal, '#7cf8a0'); } Audio8.sfx('heart', p.cx);
    } else if (a === 'feuer') { W.spawn(new Walze(p.cx, p.feet, p.face, dmg * 1.5)); Audio8.sfx('boom', p.cx); }
    else { foes(box, e => { e.hit(dmg, id); W.spawn(new Riss(e, dmg)); }); Audio8.sfx('crit', p.cx); }
  }
  class Kreuz extends Ent { // Silberkreuz: dreht sich, fliegt weit und schneidet durch alles
    constructor(x, y, d, dmg) { super(x - 8, y - 8, 16, 16); this.kind = 'fx'; this.d = d; this.dmg = dmg; this.id = 'kx' + (++ids); }
    update() { this.t++; this.x += this.d * 5.2; foes(this, e => e.hit(this.dmg, this.id)); if (this.t > 44 || Phys.solidTile(Math.floor(this.cx / T), Math.floor(this.cy / T))) { this.dead = true; W.sparks(this.cx, this.cy, 6); } if (this.t % 2 === 0) W.spawn(new Particle(this.cx, this.cy, 0, 0, '#c8d8fc', 10, 1, 0)); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 26, c: [200, 220, 252], a: 0.45 }); }
    draw(ctx) { const f = CROSS_SPIN[(this.t * (this.d > 0 ? 1 : -1) % 16 + 16) % 16]; ctx.drawImage(f, Math.round(this.cx - W.cam.x) - 9, Math.round(this.cy - W.cam.y) - 9); }
  }
  class Walze extends Ent { // Drachenfeuer: fünf Flammensäulen laufen am Boden entlang
    constructor(x, feet, d, dmg) { super(x, feet - 1, 1, 1); this.kind = 'fx'; this.d = d; this.dmg = dmg; this.n = 0; this.cols = []; this.id = 'kf' + (++ids); }
    update() {
      this.t++;
      if (this.t % 5 === 1 && this.n < 5) {
        const x = this.x + this.d * (18 + this.n * 18), c = Math.floor(x / T); let r = Math.floor(this.y / T);
        for (let k = 0; k < 4 && !Phys.solidTile(c, r + 1); k++) r++;
        if (!Phys.solidTile(c, r) && Phys.solidTile(c, r + 1)) { this.cols.push({ x, fy: (r + 1) * T, t: 0 }); Audio8.sfx('zap', x); W.dust(x, (r + 1) * T, 3); }
        else this.n = 5;
        this.n++;
      }
      for (const k of this.cols) { k.t++; if (k.t < 22) foes({ x: k.x - 7, y: k.fy - 30, w: 14, h: 30 }, e => e.hit(this.dmg, this.id)); }
      if (this.n >= 5 && this.cols.every(k => k.t > 30)) this.dead = true;
    }
    lightUp(L, cx, cy) { for (const k of this.cols) if (k.t < 30) L.push({ x: k.x - cx, y: k.fy - 14 - cy, r: 30, c: [252, 140, 40], a: 0.5 * (1 - k.t / 30) }); }
    draw(ctx) {
      for (const k of this.cols) {
        if (k.t > 30) continue; const x = Math.round(k.x - W.cam.x), b = Math.round(k.fy - W.cam.y), s = Math.min(1, k.t / 5) * (1 - Math.max(0, k.t - 18) / 12);
        for (let i = 0; i < 6; i++) { const h = Math.round((18 + ((k.t * 3 + i * 7) % 12)) * s); ctx.fillStyle = i % 3 === 0 ? '#fcf0a0' : i % 3 === 1 ? '#fca030' : '#e85818'; ctx.fillRect(x - 6 + i * 2, b - h, 2, h); }
      }
    }
  }
  class Riss extends Ent { // Reißzahn: die Wunde blutet viermal nach
    constructor(e, dmg) { super(e.cx, e.cy, 1, 1); this.kind = 'fx'; this.e = e; this.dmg = Math.max(0.5, dmg * 0.6); this.k = 0; }
    update() {
      this.t++; const e = this.e; if (e.dead) { this.dead = true; return; }
      if (this.t % 4 === 0) W.spawn(new Particle(e.cx + rnd(-4, 4), e.cy + rnd(-4, 4), rnd(-0.3, 0.3), rnd(0.2, 0.8), '#c81020', 22, 1, 0.08));
      if (this.t % 26 === 0) { this.k++; e.hit(this.dmg, 'kr' + (++ids)); if (this.k >= 4) this.dead = true; }
    }
    draw() { }
  }

  // ---------------- Kerzenmimik ----------------
  class Mimik extends Enemy {
    constructor(c) { super(c.cx - 7, c.y + c.h - 22, 14, 22, 6, 2, 900); this.drop = c.drop; this.wait = 24; this.face = W.player.cx < this.cx ? -1 : 1; this.vx = 0; this.vy = -2.6; this.mouth = 1; }
    update() {
      super.update(); if (this.kbT > 0 && this.wuchtStep()) return;
      const p = W.player; this.mouth = Math.max(0, this.mouth - 0.06);
      if (this.onGround) { this.vx *= 0.7; if (--this.wait <= 0) { this.face = p.cx < this.cx ? -1 : 1; this.vx = this.face * 1.7; this.vy = -3.4; this.wait = 34; this.mouth = 1; Audio8.sfx('chomp', this.cx); } }
      this.physics(); this.touch();
    }
    kill(silent) { super.kill(silent); if (silent) return; W.spawn(new Item('bagBig', this.cx - 6, this.cy)); W.spawn(new Item(rollDrop(this.drop), this.cx + 6, this.cy)); W.popup(this.cx, this.y - 10, tr('mimicWin'), '#f8d848'); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y - 2 - cy, r: 26, c: [252, 180, 80], a: 0.45 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.y + this.h - W.cam.y), f = this.face, R = (a, y, w, h, c) => { ctx.fillStyle = this.flashT > 0 && (this.flashT & 2) ? '#fcfcfc' : c; ctx.fillRect(f > 0 ? x + a : x - a - w, b + y, w, h); };
      const leg = Math.round(Math.sin(this.t * 0.5) * (this.onGround ? 0 : 2));
      R(-5, -3, 3, 3 + leg, '#8c6c20'); R(2, -3, 3, 3 - leg, '#8c6c20'); R(-6, -6, 12, 3, '#c89c30'); R(-4, -7, 8, 1, '#f0cc60');           // Leuchterfuß mit Beinchen
      R(-5, -20, 10, 15, '#2c1c14'); R(-4, -19, 8, 13, '#c8b898'); R(-4, -19, 2, 13, '#e0d4b8'); R(2, -19, 2, 13, '#988868'); R(-3, -20, 2, 2, '#c8b898'); // Wachskörper mit dunklem Rand
      const m = Math.round(this.mouth * 4); R(-4, -13, 8, 2 + m, '#1c0404'); R(-3, -12, 6, m, '#a01820'); for (let i = 0; i < 4; i++) { R(-4 + i * 2, -13, 1, 1, '#fcfcfc'); R(-3 + i * 2, -12 + m, 1, 1, '#fcfcfc'); } // Maul mit Zähnen
      R(-3, -18, 3, 3, '#1c0404'); R(1, -18, 3, 3, '#1c0404'); R(-2, -17, 1, 1, '#fc2c2c'); R(2, -17, 1, 1, '#fc2c2c'); R(-3, -19, 3, 1, '#5c3c24'); R(1, -19, 3, 1, '#5c3c24'); // böse Augen unter dicken Brauen
      const fl = (this.t >> 2) & 1; R(-1, -24 - fl, 3, 5 + fl, '#fca030'); R(0, -23 - fl, 1, 3, '#fcf0a0'); R(0, -20, 1, 1, '#3c3020');     // Flamme und Docht
    }
  }
  function wake(c) { // die Kerze zeigt Zähne
    const m = new Mimik(c); W.spawn(m); Audio8.sfx('chomp', c.cx); Audio8.sfx('rise', c.cx); W.spawn(new Shock(c.cx, c.cy, 22, '#fca030', 2)); W.shake = Math.max(W.shake, 4);
    const F = Castle.on && Castle.flags; if (F && !F.mimic_tip) { Castle.setFlag('mimic_tip'); Game.note('mimicNote'); }
    return m;
  }
  function populate(w) { // in manchen Räumen ist genau eine Kerze eine Mimik
    if (typeof Castle === 'undefined' || !Castle.on) return; const R = w.room;
    if (R.arena || R.mini || R.hall || (Levels.STAGES[w.stage] || {}).id === 'arrival' || Math.random() >= 0.24) return;
    const list = w.ents.filter(e => e instanceof Candle && !e.torch && !e.blood && Math.abs(e.cx - w.player.cx) > 90);
    if (list.length >= 3) list[Math.floor(Math.random() * list.length)].mimic = true;
  }
  function over(ctx) { // Kettenanzeige über dem Helden und das verräterische Blinzeln der Mimik
    const p = W.player;
    if (p && p.alive && chain > 0 && W.frame - lastT < GAP) for (let i = 0; i < 3; i++) { const x = Math.round(p.cx - W.cam.x) - 6 + i * 5, y = Math.round(p.y - W.cam.y) - 7; ctx.fillStyle = '#100808'; ctx.fillRect(x - 1, y - 1, 4, 4); ctx.fillStyle = i < chain ? '#fce070' : '#5c4c28'; ctx.fillRect(x, y, 2, 2); }
    for (const e of W.ents) if (e.mimic && !e.dead && (e.t + 37) % 200 < 9 && e.onScreen(0)) { const x = Math.round(e.cx - W.cam.x), y = Math.round(e.y - W.cam.y) + 6; ctx.fillStyle = '#d81820'; ctx.fillRect(x - 2, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); }
  }
  return { swing, fire, populate, wake, over, foes, art, get chain() { return chain; } };
})();
