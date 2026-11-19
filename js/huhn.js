// Geheimnisjagd: Dem Hühnerwart in der Eingangshalle sind zwölf goldene Gummihühner entlaufen. Sie sitzen an abgelegenen Stellen im ganzen
// Schloss und quieken: je näher der Held kommt, desto öfter und lauter (und aus der richtigen Richtung). Der Hühnerwart kennt zu jedem ein Rätsel und zahlt
// bei 3, 6, 9 und 12 Funden Finderlohn. Standplätze: [Raum, Kachel-x, Standreihe], geprüft mit test_huhn.js
'use strict';
const Huhn = (() => {
  const SPOTS = [
    ['kolosseum', 10, 7], ['kerker', 46, 7], ['hotel', 36, 11], ['bahnhof', 70, 3], ['automatenwerk', 103, 9], ['registratur', 28, 4],
    ['planetarium', 48, 7], ['mondmeer', 63, 9], ['eiskeller', 29, 6], ['spiegelschacht', 21, 9], ['glockenstuhl', 10, 9], ['theater', 24, 11],
  ];
  const PAY = [3, 6, 9, 12], NPC_X = 11, CELLS = 6;
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const got = (i) => !!F()['huhn_' + i], count = () => SPOTS.reduce((n, s, i) => n + (got(i) ? 1 : 0), 0), done = () => !!F().huhn_all;
  let ui = null, buddy = null;

  let goldImg = null;
  function gold() { // das gewöhnliche Gummihuhn, in Gold getaucht
    if (goldImg) return goldImg;
    const c = document.createElement('canvas'); c.width = 14; c.height = 14; const x = c.getContext('2d');
    RubberChicken.paint(x, 1, 1, false); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(252,196,40,0.4)'; x.fillRect(0, 0, 14, 14);
    x.fillStyle = 'rgba(255,248,200,0.8)'; x.fillRect(4, 4, 4, 1); x.fillRect(9, 2, 1, 1);
    return (goldImg = c);
  }
  function pay(n) { // Finderlohn
    const i = PAY.indexOf(n), f = F(); if (i < 0 || f['huhn_p' + i]) return;
    f['huhn_p' + i] = 1;
    if (i === 0) W.addScore(3000);
    if (i === 1) { W.addScore(6000); Castle.giveItem('elixir', true); }
    if (i === 2) f.gw_atk = (f.gw_atk || 0) + 1;
    if (i === 3) f.huhn_all = 1;
    Game.note(i === 3 ? 'huhnBaron' : 'huhnPay', tr('huhnRew' + i)); Audio8.sfx('cert');
  }
  class GoldHuhn extends Ent {
    constructor(i, c, r) { super(c * T, (r + 1) * T - 18, 16, 18); this.kind = 'prop'; this.i = i; this.cd = 30; }
    update() {
      this.t++; const p = W.player; if (!p.alive) return;
      const d = Math.hypot(p.cx - this.cx, p.cy - this.cy), near = clamp(1 - d / (T * 46), 0, 1);
      if (--this.cd <= 0) { if (near > 0) Audio8.peep(this.cx, 0.14 + near * near * 0.86); this.cd = Math.round(44 + (1 - near) * 150); }
      if (near > 0.1 && !F().huhn_tip && Castle.setFlag) { Castle.setFlag('huhn_tip'); Game.note('huhnTip'); }
      if (!Phys.overlap(this, p)) return;
      this.dead = true; Castle.setFlag('huhn_' + this.i); const n = count();
      Audio8.sfx('squeak', this.cx); Audio8.sfx('money', this.cx); W.popup(this.cx, this.y - 12, tr('huhnGot', n, SPOTS.length), '#f8d848');
      W.hitstop = Math.max(W.hitstop, 6); W.spawn(new Shock(this.cx, this.cy, 46, '#f8d848', 4)); Input.rumble(0.4, 0.5, 160);
      for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283; W.spawn(new Particle(this.cx, this.cy, Math.cos(a) * rnd(0.8, 2.2), Math.sin(a) * rnd(0.8, 2.2) - 0.5, k % 3 ? '#f8d848' : '#fff4c0', 40, 2, 0.07)); }
      pay(n);
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 20 + Math.sin(this.t * 0.07) * 3, c: [252, 200, 70], a: 0.24 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x) - 7, y = Math.round(this.y - W.cam.y) + 2 + Math.round(Math.sin(this.t * 0.07) * 2);
      ctx.drawImage(gold(), x, y);
      const k = (this.t >> 2) % 18; if (k < 4) { ctx.fillStyle = '#fffbe0'; const sx = x + 2 + (this.t >> 6) % 10, sy = y + (this.t >> 7) % 8; ctx.fillRect(sx - k, sy, k * 2 + 1, 1); ctx.fillRect(sx, sy - k, 1, k * 2 + 1); }
    }
  }
  class Huehnerwart extends Ent {
    constructor(fy) { super(NPC_X * T, fy - 30, 16, 30); this.kind = 'prop'; this.fy = fy; }
    near() { const p = W.player; return p.alive && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.feet - this.fy) < 20; }
    update() { this.t++; if (this.near() && Input.pressed.up && Game.state === 'play') { ui = { sel: 0, t: 0 }; Game.go('huhn'); Audio8.sfx('squeak'); } }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 10 - cy, r: 30, c: [252, 210, 140], a: 0.26 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), s = Math.round(Math.sin(this.t * 0.05)), f = W.player.cx < this.cx ? -1 : 1, R = (a, y, n, h, c) => { ctx.fillStyle = c; ctx.fillRect(f > 0 ? x + a : x - a - n, b + y, n, h); };
      R(-4, -10, 3, 10, '#3c3020'); R(1, -10, 3, 10, '#3c3020'); R(-5, -2, 4, 2, '#1c1410'); R(1, -2, 4, 2, '#1c1410');          // Hose, Stiefel
      R(-6, -24, 12, 15, '#6c5428'); R(-6, -24, 12, 1, '#8c7038'); R(-1, -23, 2, 13, '#4c3c1c'); R(-5, -14, 4, 3, '#4c3c1c'); R(2, -14, 4, 3, '#4c3c1c'); // Kittel mit Taschen
      R(-3, -31, 7, 7, '#d8b090'); R(1, -29, 1, 1, '#100808'); R(-3, -26, 7, 2, '#e8e4dc'); R(-2, -25, 5, 2, '#e8e4dc');            // Gesicht, weißer Bart
      R(-5, -33, 11, 2, '#2c3c30'); R(-3, -37, 7, 4, '#3c5040');                                                                   // Schirmmütze
      R(8, -30 + s, 1, 30 - s, '#8c6c3c'); R(6, -2, 5, 2, '#c8a860');                                                              // Besen
      ctx.save(); ctx.translate(f > 0 ? x - 11 : x - 3, b - 21 + s); ctx.drawImage(gold(), 0, 0); ctx.restore();                   // das letzte Huhn unterm Arm
      if (this.near()) { const y = b - 50 + Math.round(Math.sin(this.t * 0.14) * 2); ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1); }
    }
  }
  function floorY() { for (let r = 1; r < W.room.h; r++) if (Phys.solidTile(NPC_X, r) && !Phys.solidTile(NPC_X, r - 1)) return r * T; return 18 * T; }
  function populate(w) {
    ui = null; buddy = null; if (typeof Castle === 'undefined' || !Castle.on) return;
    if (w.room.theme === 'foyer') w.spawn(new Huehnerwart(floorY()));
    SPOTS.forEach(([k, c, r], i) => { const a = Castle.side[k]; if (a && a.s === w.stage && a.r === w.roomIdx && !got(i)) w.spawn(new GoldHuhn(i, c, r)); });
  }
  function input(P) { // true = Menü zu
    ui.t++; if (ui.t < 10) return false;
    if (P.start) { ui = null; return true; }
    const n = SPOTS.length, back = ui.sel === n;
    if (P.left && !back) { ui.sel = (ui.sel + n - 1) % n; Audio8.sfx('select'); }
    if (P.right && !back) { ui.sel = (ui.sel + 1) % n; Audio8.sfx('select'); }
    if (P.down) { ui.sel = back ? 0 : ui.sel + CELLS >= n ? n : ui.sel + CELLS; Audio8.sfx('select'); }
    if (P.up) { ui.sel = back ? n - 1 : ui.sel < CELLS ? n : ui.sel - CELLS; Audio8.sfx('select'); }
    if ((P.jump || P.attack) && ui.sel === n) { ui = null; return true; }
    return false;
  }
  function draw(ctx, t) {
    if (!ui) return;
    const cx = View.cx, half = Math.min(132, View.w / 2 - 20), lx = cx - half, rx = cx + half, n = count();
    Zier.frame(ctx, '#d8a020'); Game.big(ctx, tr('huhnTitle'), cx, 12, 2, LOGO, null, '#000');
    Duell.wrap(tr('huhnLine'), rx - lx).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 34 + i * 10, '#d0c0a0', { align: 'center', shadow: '#000' }));
    const cw = Math.min(36, Math.floor((rx - lx) / CELLS)), gx = Math.round(cx - cw * CELLS / 2);
    SPOTS.forEach((s, i) => {
      const x = gx + (i % CELLS) * cw, y = 58 + Math.floor(i / CELLS) * 28, on = ui.sel === i;
      ctx.fillStyle = on ? 'rgba(216,160,32,0.34)' : 'rgba(8,4,16,0.6)'; ctx.fillRect(x + 1, y, cw - 2, 26);
      ctx.fillStyle = on ? '#f8d048' : '#5c4c28'; ctx.fillRect(x + 1, y, cw - 2, 1); ctx.fillRect(x + 1, y + 25, cw - 2, 1); ctx.fillRect(x + 1, y, 1, 26); ctx.fillRect(x + cw - 2, y, 1, 26);
      if (got(i)) ctx.drawImage(gold(), x + Math.round(cw / 2) - 7, y + 6 + (on ? Math.round(Math.sin(t * 0.2)) : 0));
      else Font.draw(ctx, '?', x + Math.round(cw / 2), y + 9, on ? '#f8d048' : '#6c5c3c', { align: 'center' });
    });
    Font.draw(ctx, tr('huhnCount', n, SPOTS.length), cx, 116, '#f8d848', { align: 'center', shadow: '#000' });
    const next = PAY.findIndex(p => n < p), msg = next < 0 ? tr('huhnDone') : tr('huhnNext', PAY[next], tr('huhnRew' + next));
    Font.draw(ctx, msg, cx, 128, '#a8d8a0', { align: 'center', shadow: '#000' });
    if (ui.sel < SPOTS.length) Duell.wrap(got(ui.sel) ? tr('huhnHome') : tr('huhnR' + ui.sel), rx - lx).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 146 + i * 11, got(ui.sel) ? '#90887c' : '#fcf0d8', { align: 'center', shadow: '#000' }));
    const by = 176, on = ui.sel === SPOTS.length; if (on) { ctx.fillStyle = 'rgba(216,160,32,0.26)'; ctx.fillRect(lx - 6, by - 3, rx - lx + 12, 13); Sprites.draw(ctx, Sprites.S.heartS, lx - 3, by); }
    Font.draw(ctx, tr('opferBack'), cx, by, on ? '#fcfcfc' : '#b0a080', { align: 'center', shadow: '#000' });
  }
  function over(ctx) { // alle zwölf gefunden: das letzte Huhn flattert dem Helden fortan hinterher
    if (!done() || !W.player || !W.player.alive) return;
    const p = W.player, tx = p.cx - (p.face || 1) * 16, ty = p.y - 8;
    if (!buddy) buddy = { x: tx, y: ty };
    buddy.x += (tx - buddy.x) * 0.1; buddy.y += (ty - buddy.y) * 0.1;
    ctx.drawImage(gold(), Math.round(buddy.x - W.cam.x) - 7, Math.round(buddy.y - W.cam.y + Math.sin(W.frame * 0.11) * 2) - 7);
  }
  return { populate, input, draw, over, count, SPOTS, PAY, got, done, get ui() { return ui; } };
})();
