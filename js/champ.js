// Champions: manchmal steht in einem Raum ein goldener Gegner. Er hält dreimal so viel aus, trifft härter und lässt sich kaum
// zurückstoßen, zahlt dafür aber viermal so viel Erfahrung, Gold und sicheres Heilfutter. Goldener Schein, Krönchen und eigene Lebensleiste.
'use strict';
const Champ = (() => {
  const OK = new Set(['Skeleton', 'IceSkeleton', 'Knight', 'Panther', 'Automat', 'Mondkalb', 'Ordner', 'Ghost', 'FlyBook']);
  const CHANCE = 0.34, GOAL = 10;
  function populate(w) {
    if (typeof Castle === 'undefined' || !Castle.on) return;
    const R = w.room; if (R.arena || R.safe || R.mini || R.hall || (Levels.STAGES[w.stage] || {}).id === 'arrival' || Math.random() >= CHANCE) return;
    const list = w.ents.filter(e => e.kind === 'enemy' && OK.has(e.constructor.name) && Math.abs(e.cx - w.player.cx) > 130);
    if (list.length) make(list[Math.floor(Math.random() * list.length)]);
  }
  const TRAITS = ['flamme', 'eile', 'panzer', 'spalt'];
  class Flamme extends Ent { // Feuerspur des flammenden Champions
    constructor(x, fy, dmg) { super(x - 4, fy - 12, 8, 12); this.kind = 'eproj'; this.dmg = dmg; this.fy = fy; this.life = 110; }
    update() { if (++this.t > this.life) { this.dead = true; return; } const p = W.player; if (p.alive && this.t > 10 && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 18, c: [252, 130, 40], a: 0.4 }); }
    draw(ctx) { const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), k = Math.min(1, (this.life - this.t) / 30); for (let i = 0; i < 4; i++) { const h = Math.round((5 + ((this.t + i * 5) >> 2) % 6) * k); ctx.fillStyle = i % 2 ? '#f8a030' : '#fce070'; ctx.fillRect(x - 3 + i * 2, b - h, 2, h); } }
  }
  function make(e, trait) {
    e.champ = true; e.hp = Math.max(6, e.hp * 3); e.champHp = e.hp; e.dmg = (e.dmg || 1) + 1; e.score = (e.score || 100) * 4; e.expMul = (e.expMul || 1) * 4;
    const t = e.trait = trait || TRAITS[Math.floor(Math.random() * TRAITS.length)], up = e.update, hit = e.hit;
    if (t === 'eile') e.update = function () { up.call(this); if (W.frame % 2 === 0 && !this.dead) up.call(this); }; // bewegt sich anderthalbmal so schnell
    if (t === 'flamme') e.update = function () { up.call(this); if (this.onGround !== false && W.frame % 26 === 0 && !this.dead) W.spawn(new Flamme(this.cx, this.y + this.h, Math.max(1, (this.dmg || 2) - 1))); };
    if (t === 'panzer') { e.shield = 3; e.hit = function (dmg, id) { if (this.shield > 0 && id && this.lastHit !== id) { this.lastHit = id; this.shield--; this.flashT = 6; Audio8.sfx('tink', this.cx); W.sparks(this.cx, this.cy, 6); W.comboHit(); return true; } return hit.call(this, dmg, id); }; }
    return e;
  }
  function reward(e) {
    const y = Math.min(e.cy, W.room.h * T - 24);
    W.spawn(new Item('bagBig', e.cx - 8, y)); W.spawn(new Item('heartB', e.cx + 8, y));
    W.popup(e.cx, e.y - 16, tr('champWin'), '#f8d848'); Audio8.sfx('money', e.cx);
    W.spawn(new Shock(e.cx, e.cy, 54, '#f8d848', 4)); W.shake = Math.max(W.shake, 8); W.hitstop = Math.max(W.hitstop, 6); Input.rumble(0.5, 0.5, 200);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; W.spawn(new Particle(e.cx, e.cy, Math.cos(a) * rnd(1, 2.4), Math.sin(a) * rnd(1, 2.4) - 0.6, i % 2 ? '#f8d848' : '#fff4c0', 34, 2, 0.08)); }
    if (Castle.flags) Castle.flags.champs = (Castle.flags.champs || 0) + 1;
    if (e.trait === 'spalt' && ['Skeleton', 'IceSkeleton', 'Knight', 'Panther'].includes(e.constructor.name)) for (const d of [-1, 1]) { // zerfällt in zwei gewöhnliche Hälften
      const m = new e.constructor(clamp(Math.floor(e.cx / T) + d, 1, W.room.w - 2), Math.floor((e.y + e.h - 1) / T)); m.hp = Math.max(1, (e.champHp || 6) / 6); W.spawn(m); W.spawn(new Shock(m.cx, m.cy, 22, '#f8d848', 2));
    }
  }
  const seen = (e) => e.champ && !e.dead && e.onScreen(0);
  const golds = new WeakMap();
  function gold(img) { let c = golds.get(img); if (c) return c; c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#f8b828'; x.fillRect(0, 0, c.width, c.height); golds.set(img, c); return c; }
  function under(ctx) { // goldener Schein hinter dem Gegner
    for (const e of W.ents) {
      if (!seen(e)) continue;
      if (Castle.flags && !Castle.flags.champ_tip) { Castle.setFlag('champ_tip'); Game.note('champTip'); }
      const x = Math.round(e.cx - W.cam.x), y = Math.round(e.cy - W.cam.y), r = Math.round(Math.max(e.w, e.h) * 0.9 + 8), p = 0.55 + 0.25 * Math.sin(W.frame * 0.12);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = p; ctx.drawImage(FX.disc(r, [248, 190, 50], [0.55, 0.32, 0.14, 0.04]), x - r, y - r); ctx.restore();
    }
  }
  function over(ctx) { // Krönchen, Funken und Lebensleiste, nach dem Licht
    for (const e of W.ents) {
      if (!seen(e)) continue;
      const d = e.lastDraw, img = d && d.s && (d.flip ? d.s.f : d.s.c);
      if (img) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.34 + 0.18 * Math.sin(W.frame * 0.16); ctx.drawImage(gold(img), Math.round(d.x - W.cam.x) - (d.s.pad || 0), Math.round(d.y - W.cam.y) - (d.s.pad || 0)); ctx.restore(); }
      const x = Math.round(e.cx - W.cam.x), top = Math.round(e.y - W.cam.y), bob = Math.round(Math.sin(W.frame * 0.1) * 1.5), cy = top - 10 + bob;
      ctx.fillStyle = '#5c3c08'; ctx.fillRect(x - 5, cy + 1, 11, 5); ctx.fillStyle = '#f8c838'; ctx.fillRect(x - 4, cy + 2, 9, 3); ctx.fillRect(x - 4, cy, 1, 2); ctx.fillRect(x, cy - 1, 1, 3); ctx.fillRect(x + 4, cy, 1, 2); ctx.fillStyle = '#fff4c0'; ctx.fillRect(x - 3, cy + 2, 7, 1); ctx.fillStyle = '#d8283c'; ctx.fillRect(x, cy + 3, 1, 1);
      e.champHp = Math.max(e.champHp || 0, e.hp); const k = clamp(e.hp / e.champHp, 0, 1); if (k < 1) { const w = 24, bx = x - 12, by = top - 15 + bob; ctx.fillStyle = '#0c0808'; ctx.fillRect(bx - 1, by - 1, w + 2, 4); ctx.fillStyle = '#4c2c08'; ctx.fillRect(bx, by, w, 2); ctx.fillStyle = '#f8c838'; ctx.fillRect(bx, by, Math.max(1, Math.round(w * k)), 2); }
      if (e.trait && Math.abs(W.player.cx - e.cx) < 150) Font.draw(ctx, tr('champ_' + e.trait), x, top - 26 + bob, e.trait === 'flamme' ? '#fc9050' : e.trait === 'eile' ? '#7cdcfc' : e.trait === 'panzer' ? '#c8c8d8' : '#c8a0fc', { align: 'center', shadow: '#000' });
      if (e.shield > 0) for (let i = 0; i < e.shield; i++) { const a = W.frame * 0.09 + i * 2.09; ctx.fillStyle = '#d8e0f0'; ctx.fillRect(Math.round(e.cx - W.cam.x + Math.cos(a) * (e.w / 2 + 9)) - 1, Math.round(e.cy - W.cam.y + Math.sin(a) * 12) - 1, 3, 3); }
      if (W.frame % 11 === 0 && !View.lite) W.spawn(new Particle(e.cx + rnd(-e.w, e.w), e.y + rnd(0, e.h), 0, -rnd(0.3, 0.8), '#f8d848', 26, 1, -0.01));
    }
  }
  return { populate, make, reward, under, over, GOAL, OK };
})();
