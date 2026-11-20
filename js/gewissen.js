// Gewissen: sechs Gewissensfragen im Schloss (anständig oder einträglich), jede Antwort gilt für immer. Wer überwiegend anständig bleibt,
// erleidet weniger Schaden; wer überwiegend schäbig handelt, teilt mehr aus. Am Ende erzählt die Chronik eine von drei Fassungen.
// Dazu die Opferschreine in den Speicherkammern: Gold gegen dauerhafte Ränge in Angriff, Leben und Magie.
'use strict';
const Gewissen = (() => {
  const CASES = [
    { id: 'pruefer', at: 'kerker', x: 14, art: 'cage', a: {}, b: { gold: 1500 } },
    { id: 'bein', at: 'gruftgang', x: 24, art: 'bones', a: { item: 'elixir' }, b: { gold: 1200 } },
    { id: 'gast', at: 'zimmer13', x: 18, art: 'ghost', a: { pay: 500 }, b: { gold: 1800 } },
    { id: 'waisen', at: 'sakristei', x: 7, art: 'box', a: { pay: 1000, hp: 1 }, b: { gold: 2500 } },
    { id: 'antrag', at: 'heldenamt', x: 46, art: 'desk', a: {}, b: { atk: 1 } },
    { id: 'kalb', at: 'mondmeer', x: 63, art: 'calf', a: {}, b: { gold: 3000 } },
  ];
  const ALTARS = new Set(['kasematte', 'felsenkammer', 'lesezimmer', 'sakristei', 'orangerie', 'vorzimmer']);
  const PRICE = [1500, 3000, 6000, 12000, 24000], RANKS = PRICE.length, STATS = ['atk', 'hp', 'mp'];
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const pickOf = (id) => F()['gw_' + id] || 0;   // 0 offen, 1 anständig, 2 schäbig
  const score = () => CASES.reduce((n, c) => n + (pickOf(c.id) === 1 ? 1 : pickOf(c.id) === 2 ? -1 : 0), 0);
  const tier = () => { const s = score(); return s >= 2 ? 'good' : s <= -2 ? 'bad' : 'mid'; };
  const rank = (k) => F()['op_' + k] || 0;
  const persist = () => Castle.setFlag('gw_seen');
  const atkMul = () => (1 + 0.08 * (rank('atk') + (F().gw_atk || 0))) * (tier() === 'bad' ? 1.15 : 1);
  const defDiv = () => (tier() === 'good' ? 1.18 : 1);
  const hpBonus = () => 4 * rank('hp') + 4 * (F().gw_hp || 0);
  const mpBonus = () => 6 * rank('mp');
  const all = (want) => CASES.every(c => pickOf(c.id) === want);

  let ui = null;
  class Stelle extends Ent {
    constructor(x, fy, w) { super(x * T - w / 2, fy - 28, w, 28); this.kind = 'prop'; this.noWrap = true; this.fy = fy; }
    near() { const p = W.player; return p.alive && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.feet - this.fy) < 20; }
    update() { this.t++; if (this.open() && this.near() && Input.pressed.up && Game.state === 'play' && !W.boss) this.use(); }
    open() { return true; }
    marker(ctx) {
      if (!this.open() || !this.near()) return;
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.y - W.cam.y) - 12 + Math.round(Math.sin(this.t * 0.14) * 2);
      ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1);
    }
  }
  class Fall extends Stelle {
    constructor(c, fy) { super(c.x, fy, 28); this.c = c; }
    open() { return !pickOf(this.c.id); }
    use() { ui = { mode: 'case', c: this.c, sel: 0, phase: 'ask', t: 0, msg: null, src: this }; Game.go('gewissen'); Audio8.sfx('select'); }
    lightUp(L, cx, cy) { if (this.open()) L.push({ x: this.cx - cx, y: this.cy - cy, r: 34, c: [248, 200, 110], a: 0.3 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), t = this.t, on = this.open(), R = (a, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, b + y, w, h); };
      switch (this.c.art) {
        case 'cage': { for (let i = -10; i <= 10; i += 5) if (on || i < 0) R(i, -36, 1, 34, '#6c6878'); R(-11, -37, 23, 2, '#8c8898'); R(-11, -3, 23, 2, '#54505c'); R(0, -56, 1, 19, '#54505c'); if (on) { const w = Math.round(Math.sin(t * 0.05)); R(-4 + w, -30, 8, 13, '#34344c'); R(-3 + w, -36, 6, 6, '#e0b090'); R(-3 + w, -38, 6, 2, '#4c3c2c'); R(-2 + w, -34, 1, 1, '#100808'); R(1 + w, -34, 1, 1, '#100808'); R(-3 + w, -17, 2, 11, '#24243c'); R(1 + w, -17, 2, 11, '#24243c'); R(5 + w, -26, 4, 5, '#f0e8d0'); } break; }
        case 'bones': { if (!on) { R(-8, -3, 16, 3, '#c8bca0'); R(-3, -7, 6, 5, '#e8e0c8'); break; } const h = Math.abs(Math.sin(t * 0.1)) * 3 | 0; R(-3, -30 - h, 7, 7, '#e8e0c8'); R(-2, -28 - h, 2, 2, '#141018'); R(1, -28 - h, 2, 2, '#141018'); R(-1, -23 - h, 2, 10, '#c8bca0'); for (let i = 0; i < 3; i++) R(-4, -22 + i * 3 - h, 9, 1, '#c8bca0'); R(-5, -21 - h, 1, 8, '#c8bca0'); R(5, -21 - h, 1, 8, '#c8bca0'); R(0, -13 - h, 2, 13 + h, '#e8e0c8'); R(10, -2, 11, 2, '#e8e0c8'); R(9, -3, 2, 4, '#f8f4e4'); R(20, -3, 2, 4, '#f8f4e4'); break; }
        case 'ghost': { if (!on) break; const y = Math.round(Math.sin(t * 0.06) * 2); ctx.globalAlpha = 0.8; R(-7, -32 + y, 14, 22, '#c8d8f0'); R(-5, -35 + y, 10, 3, '#c8d8f0'); for (let i = 0; i < 3; i++) R(-7 + i * 5, -10 + y, 4, 3 + (i % 2) * 2, '#c8d8f0'); ctx.globalAlpha = 1; R(-4, -28 + y, 2, 3, '#20283c'); R(2, -28 + y, 2, 3, '#20283c'); R(-1, -22 + y, 3, 2, '#20283c'); R(8, -24 + y, 8, 10, '#f0e8d0'); R(9, -22 + y, 6, 1, '#8c3040'); R(9, -19 + y, 5, 1, '#8c8068'); break; }
        case 'box': { R(-9, -24, 18, 24, '#5c3c20'); R(-9, -24, 18, 2, '#8c6438'); R(-7, -18, 14, 12, '#452c18'); R(-3, -22, 6, 1, on ? '#141010' : '#a88040'); if (on) { R(-5, -14, 10, 6, '#c89020'); R(-4, -13, 8, 1, '#f8d848'); } else { R(-9, -28, 9, 4, '#5c3c20'); R(2, -3, 3, 1, '#f8d848'); } break; }
        case 'desk': { R(-14, -18, 28, 3, '#8c6438'); R(-13, -15, 3, 15, '#5c3c20'); R(10, -15, 3, 15, '#5c3c20'); R(-9, -20, 12, 2, '#f0e8d0'); R(-7, -19, 8, 1, '#8c8068'); R(6, -26, 3, 6, '#5c3c20'); R(4, -21, 7, 3, on ? '#c82030' : '#585868'); if (!on) R(-5, -20, 5, 2, '#c82030'); break; }
        case 'calf': { R(-13, -6, 26, 6, '#54544c'); if (!on) { R(-5, -3, 10, 3, '#f8d048'); break; } const b2 = Math.round(Math.sin(t * 0.08)); R(-9, -19 + b2, 18, 12, '#d8d4c4'); R(-5, -17 + b2, 6, 4, '#54544c'); R(-15, -24 + b2, 9, 9, '#e8e4d4'); R(-13, -21 + b2, 1, 2, '#141018'); R(-9, -21 + b2, 1, 2, '#141018'); R(-15, -17 + b2, 9, 2, '#e8a8a0'); R(-16, -26 + b2, 2, 3, '#c8c4b4'); R(-7, -26 + b2, 2, 3, '#c8c4b4'); R(4, -27 + b2, 10, 8, '#f8d048'); R(6, -25 + b2, 2, 2, '#a8801c'); R(10, -23 + b2, 2, 2, '#a8801c'); break; }
      }
      if (on && !this.near()) { const y = b - 46 + Math.round(Math.sin(t * 0.09) * 2); Font.draw(ctx, '?', x, y, '#f8d848', { align: 'center', shadow: '#000' }); }
      this.marker(ctx);
    }
  }
  class Schrein extends Stelle {
    constructor(x, fy) { super(x, fy, 26); }
    use() { ui = { mode: 'altar', sel: 0, t: 0, msg: null }; Game.go('gewissen'); Audio8.sfx('select'); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.fy - 34 - cy, r: 38 + Math.sin(this.t * 0.2) * 3, c: [252, 150, 60], a: 0.45 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), t = this.t, R = (a, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, b + y, w, h); };
      R(-13, -5, 26, 5, '#3c3844'); R(-13, -5, 26, 1, '#6c6878'); R(-10, -21, 20, 16, '#4c4854'); R(-10, -21, 20, 1, '#8c8898'); R(-8, -17, 16, 9, '#2c2834'); R(-4, -15, 8, 5, '#a87818'); R(-3, -14, 6, 1, '#f8d848'); R(-12, -24, 24, 3, '#6c6878'); R(-12, -24, 24, 1, '#a8a4b4');
      for (const [a, c] of [[-7, '#f8d848'], [-2, '#c89020'], [3, '#f8d848']]) R(a, -26, 4, 2, c);
      for (let i = 0; i < 5; i++) { const ph = (t * 0.09 + i * 1.3) % 1, a = Math.round(Math.sin(t * 0.3 + i * 2) * 2), h = 4 + (i * 3 % 5); R(-2 + i - 1 + a, -30 - h + Math.round(ph), 2, h, i % 2 ? '#f8a030' : '#fce070'); }
      this.marker(ctx);
    }
  }
  function floorY(c) { const R = W.room; for (let r = R.h - 1; r > 1; r--) if (Phys.solidTile(c, r) && !Phys.solidTile(c, r - 1)) return r * T; return (R.h - 2) * T; }
  function populate(w) {
    if (typeof Castle === 'undefined' || !Castle.on) return;
    const key = w.room.side; if (!key) return;
    for (const c of CASES) if (c.at === key) w.spawn(new Fall(c, floorY(Math.floor(c.x))));
    if (ALTARS.has(key)) w.spawn(new Schrein(24, floorY(24)));
  }
  function roomEvents(w) { if (typeof Castle !== 'undefined' && Castle.on) hunter(w); }
  // Reine Weste: alle drei Minuten fängt dich der Schutzengel einmal auf. Schwarze Seele: die Steuerfahndung ist dir auf den Fersen.
  let angelAt = -99999;
  function angel(p) {
    if (tier() !== 'good' || !Castle.on) return false;
    const now = Castle.rpg.frames; if (now - angelAt < 10800) return false;
    angelAt = now; p.hp = Math.max(1, Math.ceil(p.maxHp / 3)); p.inv = 200;
    W.popup(p.cx, p.y - 16, tr('gwAngel'), '#fce8b0'); W.flash = Math.max(W.flash, 8); W.spawn(new Shock(p.cx, p.cy, 80, '#fce8b0', 5)); Audio8.sfx('holy'); Input.rumble(0.6, 0.4, 300);
    for (let i = 0; i < 18; i++) W.spawn(new Particle(p.cx + rnd(-14, 14), p.feet - rnd(0, 34), rnd(-0.4, 0.4), -rnd(0.5, 1.6), i % 2 ? '#fcfcfc' : '#fce8b0', 46, 2, -0.01));
    return true;
  }
  function hunter(w) { // nur in gewöhnlichen Räumen, nie im Prolog
    const R = w.room; if (tier() !== 'bad' || R.arena || R.mini || R.hall || R.wrap || R.grav || R.side === 'kolosseum' || (Levels.STAGES[w.stage] || {}).id === 'arrival' || Math.random() >= 0.16) return;
    const c = clamp(Math.floor(w.player.cx / T) + 14, 2, R.w - 3), fy = floorY(c); if (fy <= T || Phys.solidTile(c, fy / T - 1)) return;
    const k = new Knight(c, fy / T - 1); Champ.make(k, 'eile'); w.spawn(k); Game.note('champHunt');
  }
  function decide(c, which) {
    const o = which ? c.b : c.a, was = tier(), p = W.player;
    if (o.pay) W.score = Math.max(0, W.score - o.pay);
    if (o.gold) W.score += o.gold;
    F()['gw_' + c.id] = which ? 2 : 1;
    if (o.hp) F().gw_hp = (F().gw_hp || 0) + o.hp;
    if (o.atk) F().gw_atk = (F().gw_atk || 0) + o.atk;
    persist();
    if (o.item) Castle.giveItem(o.item, true);
    Castle.applyHp(p); if (o.hp) p.hp = p.maxHp;
    W.popup(p.cx, p.y - 12, tr(which ? 'gwDown' : 'gwUp'), which ? '#fc7460' : '#7cf0a0');
    W.spawn(new Shock(p.cx, p.cy, 44, which ? '#e83018' : '#7cf0a0', 3));
    Audio8.sfx(which ? 'growl' : 'holy'); if (o.gold) Audio8.sfx('money');
    const now = tier(); if (now !== was && now !== 'mid') ui.perk = 'gwPerk_' + now;
  }
  function input(P) { // true = fertig
    ui.t++; if (ui.t < 10) return false;
    if (ui.mode === 'case') {
      if (ui.phase === 'done') { if (P.jump || P.attack || P.start) { if (ui.perk) Game.note(ui.perk); ui = null; return true; } return false; }
      if (P.start) { ui = null; return true; }
      if (P.up || P.down) { ui.sel = 1 - ui.sel; ui.msg = null; Audio8.sfx('select'); }
      if (P.jump || P.attack) { const o = ui.sel ? ui.c.b : ui.c.a; if (o.pay && W.score < o.pay) { ui.msg = 'gwNoGold'; Audio8.sfx('wall'); return false; } decide(ui.c, ui.sel); ui.phase = 'done'; ui.t = 0; }
      return false;
    }
    if (P.start) { ui = null; return true; }
    if (P.up || P.down) { ui.sel = (ui.sel + (P.down ? 1 : 3)) % 4; ui.msg = null; Audio8.sfx('select'); }
    if (P.jump || P.attack) {
      if (ui.sel === 3) { ui = null; return true; }
      const k = STATS[ui.sel], r = rank(k);
      if (r >= RANKS) { Audio8.sfx('wall'); return false; }
      if (W.score < PRICE[r]) { ui.msg = 'gwNoGold'; Audio8.sfx('wall'); return false; }
      W.score -= PRICE[r]; F()['op_' + k] = r + 1; persist();
      Castle.applyHp(W.player); if (k === 'hp') W.player.hp = W.player.maxHp;
      Audio8.sfx('cert'); Audio8.sfx('money'); W.flash = Math.max(W.flash, 3);
    }
    return false;
  }
  function drawCase(ctx) {
    const c = ui.c, w = View.w, bw = Math.min(w - 12, 360), bx = (w - bw) >> 1, tw = bw - 22, done = ui.phase === 'done';
    const body = Duell.wrap(tr('gw_' + c.id + (done ? (ui.sel ? '_rb' : '_ra') : '_q')), tw), h = 24 + body.length * 10 + (done ? 8 : 30), by = 38; // oben im Bild: die Figur am Boden bleibt sichtbar
    ctx.fillStyle = '#07050f'; ctx.fillRect(bx, by, bw, h); ctx.fillStyle = '#c89020'; ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by + h - 1, bw, 1); ctx.fillRect(bx, by, 1, h); ctx.fillRect(bx + bw - 1, by, 1, h);
    if (!ui.msg) Font.draw(ctx, tr('gwTitle'), bx + 11, by + 6, '#f8c838', { shadow: '#000' });
    body.forEach((l, i) => Font.draw(ctx, l, bx + 11, by + 20 + i * 10, '#f0e8d8', { shadow: '#000' }));
    if (done) return;
    const y0 = by + 22 + body.length * 10;
    ['_a', '_b'].forEach((s, i) => { const on = ui.sel === i, y = y0 + i * 12; if (on) { ctx.fillStyle = 'rgba(44,28,6,0.92)'; ctx.fillRect(bx + 6, y - 3, bw - 12, 12); ctx.fillStyle = '#c89020'; ctx.fillRect(bx + 6, y - 3, bw - 12, 1); ctx.fillRect(bx + 6, y + 8, bw - 12, 1); Sprites.draw(ctx, Sprites.S.heartS, bx + 9, y); } Font.draw(ctx, tr('gw_' + c.id + s), bx + 22, y, on ? (i ? '#fc9c80' : '#a8f0c0') : '#a09888', { shadow: '#000' }); });
    if (ui.msg) Font.draw(ctx, tr(ui.msg), bx + bw - 11, by + 6, '#fc7460', { align: 'right', shadow: '#000' });
  }
  function drawAltar(ctx, t) {
    const cx = View.cx, w = View.w, lx = cx - Math.min(128, w / 2 - 20), rx = cx + Math.min(128, w / 2 - 20);
    Zier.frame(ctx, '#c89020'); Game.big(ctx, tr('opferTitle'), cx, 12, 2, LOGO, null, '#000');
    Duell.wrap(tr('opferLine'), rx - lx).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 36 + i * 10, '#d0c0a0', { align: 'center', shadow: '#000' }));
    Font.draw(ctx, 'GOLD ' + W.score, cx, 60, '#f8d848', { align: 'center', shadow: '#000' });
    STATS.forEach((k, i) => {
      const y = 82 + i * 30, on = ui.sel === i, r = rank(k), bonus = k === 'atk' ? '+8 %' : k === 'hp' ? '+4' : '+6';
      if (on) { ctx.fillStyle = 'rgba(200,144,32,0.18)'; ctx.fillRect(lx - 6, y - 5, rx - lx + 12, 26); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 3, y); }
      Font.draw(ctx, tr('opfer_' + k), lx + 10, y, on ? '#fcfcfc' : '#b0a080', { shadow: '#000' }); Font.draw(ctx, bonus, lx + 10, y + 10, '#7cf0a0', { shadow: '#000' });
      for (let p = 0; p < RANKS; p++) { const px = cx - 26 + p * 11; ctx.fillStyle = '#1c1428'; ctx.fillRect(px - 1, y + 2, 10, 10); ctx.fillStyle = p < r ? '#f8c838' : '#3c3448'; ctx.fillRect(px, y + 3, 8, 8); if (p < r) { ctx.fillStyle = '#fff4c0'; ctx.fillRect(px, y + 3, 8, 1); } }
      const max = r >= RANKS, pr = max ? tr('opferMax') : PRICE[r] + ' G'; Font.draw(ctx, pr, rx, y + 3, max ? '#7cf0a0' : W.score >= PRICE[r] ? '#f8d848' : '#a06050', { align: 'right', shadow: '#000' });
    });
    const by = 174, on = ui.sel === 3; if (on) { ctx.fillStyle = 'rgba(200,144,32,0.18)'; ctx.fillRect(lx - 6, by - 3, rx - lx + 12, 13); Sprites.draw(ctx, Sprites.S.heartS, lx - 3, by); } Font.draw(ctx, tr('opferBack'), lx + 10, by, on ? '#fcfcfc' : '#b0a080', { shadow: '#000' });
    if (ui.msg) Font.draw(ctx, tr(ui.msg), cx, 196, '#fc7460', { align: 'center', shadow: '#000' });
  }
  function draw(ctx, t) { if (!ui) return; if (ui.mode === 'case') drawCase(ctx); else drawAltar(ctx, t); }
  // Statusseite: rechts das Gewissen mit den sechs Entscheidungen (nur wenn neben den Werten Platz ist)
  function drawStatus(ctx) {
    const w = View.w, room = View.cx - Math.min(118, w / 2 - 14); if (room < 84) return;
    const cx = w - Math.round(room / 2) - 3, t = tier(), col = t === 'good' ? '#7cf0a0' : t === 'bad' ? '#fc7460' : '#c8c8d8';
    Font.draw(ctx, tr('gwLabel'), cx, 56, '#b0a080', { align: 'center', shadow: '#000' });
    Duell.wrap(tr('gwTier_' + t), room - 12).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 70 + i * 10, col, { align: 'center', shadow: '#000' }));
    CASES.forEach((c, i) => { const p = pickOf(c.id), x = cx - 27 + i * 10; ctx.fillStyle = '#1c1428'; ctx.fillRect(x - 1, 95, 8, 8); ctx.fillStyle = p === 1 ? '#7cf0a0' : p === 2 ? '#e83018' : '#3c3448'; ctx.fillRect(x, 96, 6, 6); });
  }
  return { angel, roomEvents, populate, input, draw, drawStatus, tier, score, all, atkMul, defDiv, hpBonus, mpBonus, CASES, ALTARS, PRICE, get ui() { return ui; } };
})();
