// Gladiatorenprüfung im Kolosseum: Der Ansager schickt fünf Wellen in den abgesperrten Westflügel. Drei Stufen (Bronze, Silber, Gold) mit
// wachsenden Gegnern und Champions; beim ersten Sieg gibt es Gold und einen Trank, Gold schenkt dauerhaft Angriff, Wiederholungen zahlen ein Viertel.
'use strict';
const Arena = (() => {
  const X0 = 3, X1 = 27, NPC = 16, ROW = 10, QUIPS = 4, MAXWAVE = 2700;
  const TIERS = [
    { lv: 1, gold: 2000, item: 'potion', mul: 1, col: '#d89048', waves: ['sk sk', 'gh gh gh ba ba', 'kn sk sk', 'pa pa ba ba', 'kn kn sk sk ba'] },
    { lv: 8, gold: 6000, item: 'elixir', mul: 1.6, col: '#c8d0e0', waves: ['kn sk sk ba', 'pa pa pa gh gh', 'kn kn *sk', 'bk bk bk pa pa', '*kn kn sk sk ba ba'] },
    { lv: 15, gold: 15000, item: 'elixir', mul: 2.4, col: '#f8d048', waves: ['*sk kn kn', 'pa pa pa pa ba ba', '*pa bk bk gh gh gh', 'kn kn kn sk sk ho', '*kn *kn *pa sk sk'] },
  ];
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const won = (i) => !!F()['arena_t' + (i + 1)], best = (i) => F()['arena_b' + (i + 1)] || 0;
  const open = (i) => (i === 0 || won(i - 1)) && Castle.rpg.lv >= TIERS[i].lv;
  const clock = (f) => { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let run = null, ui = null;

  function make(code, col, dir) {
    const champ = code[0] === '*', c = champ ? code.slice(1) : code; let e;
    if (c === 'sk') e = new Skeleton(col, ROW); else if (c === 'kn') e = new Knight(col, ROW); else if (c === 'pa') e = new Panther(col, ROW);
    else if (c === 'gh') { e = new Ghoul(col * T, (ROW + 1) * T, dir); e.rise = 20; }
    else if (c === 'ba') { e = new Bat(col, 5); e.state = 'fly'; e.dir = dir; e.face = dir; e.baseY = e.y; e.seen = true; }
    else if (c === 'bk') e = new FlyBook(col * T, 6 * T, { dir }); else e = new Ghost(col, 6);
    if (champ) Champ.make(e);
    e.hp *= TIERS[run.tier].mul; if (e.champHp) e.champHp = e.hp; e.seen = true;
    return e;
  }
  function start(tier) {
    W.ents.forEach(e => { if (e.kind === 'enemy' || e.kind === 'eproj') e.dead = true; }); W.spawners = [];
    run = { tier, wave: -1, phase: 'pause', t: 0, q: [], live: [], time: 0, n: 0 };
    W.arenaOn = true; W.camLock = true; W.arenaBoss = null; W.camTarget = null; W.arenaX = X0 * T; W.arenaW = (X1 - X0) * T;
    Audio8.play('boss'); Audio8.sfx('roar');
  }
  function finish() {
    const i = run.tier, D = TIERS[i], first = !won(i), f = F(), p = W.player, gold = first ? D.gold : Math.round(D.gold / 4);
    f['arena_t' + (i + 1)] = 1; if (!best(i) || run.time < best(i)) f['arena_b' + (i + 1)] = run.time;
    W.addScore(gold); W.popup(p.cx, p.y - 16, tr('arenaGold', gold), '#f8d848'); Game.note(first && i === 2 ? 'arenaThumb' : 'arenaWin');
    if (first) { Castle.giveItem(D.item, true); if (i === 2) f.gw_atk = (f.gw_atk || 0) + 1; }
    Castle.setFlag('arena_seen'); Audio8.play(W.songName()); Audio8.sfx('cert'); Audio8.sfx('money'); Input.rumble(0.6, 0.6, 300);
    W.spawn(new Shock(p.cx, p.cy, 90, '#f8d048', 5)); W.flash = Math.max(W.flash, 6);
    W.arenaOn = false; W.camLock = false; W.arenaW = 0; W.camEase = 1; run = null;
  }
  class Ansager extends Ent {
    constructor(fy) { super(NPC * T, fy - 30, 16, 30); this.kind = 'prop'; this.fy = fy; }
    near() { const p = W.player; return p.alive && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.feet - this.fy) < 20; }
    update() {
      this.t++; if (run) { this.tick(); return; }
      if (this.near() && Input.pressed.up && Game.state === 'play') { ui = { sel: 0, t: 0, msg: null }; Game.go('arena'); Audio8.sfx('select'); }
    }
    tick() { // eine Prüfung läuft
      const p = W.player; if (!p.alive) return; run.t++; run.time++;
      const maxC = Math.max(X0 * T, X1 * T - View.w); W.cam.x = View.w >= (X1 - X0) * T ? clamp((X0 + X1) * T / 2 - View.w / 2, 0, W.room.w * T - View.w) : clamp(p.cx - View.w / 2, X0 * T, maxC);
      run.live = run.live.filter(e => !e.dead);
      if (run.phase === 'pause') { if (run.t > 100) { run.wave++; run.q = TIERS[run.tier].waves[run.wave].split(' '); run.phase = 'fight'; run.t = 0; run.waveT = 0; Audio8.sfx('announce'); } return; }
      run.waveT++;
      if (run.q.length && run.t % 22 === 1) {
        const left = run.n++ % 2 === 0, col = clamp(Math.floor((W.cam.x + (left ? 26 : View.w - 26)) / T), X0 + 1, X1 - 2), e = make(run.q.shift(), col, left ? 1 : -1);
        W.spawn(e); run.live.push(e); W.spawn(new Shock(e.cx, e.cy, 26, '#c83828', 3)); W.dust(e.cx, (ROW + 1) * T, 4); Audio8.sfx('rise', e.cx);
      }
      if (run.waveT > MAXWAVE) run.live.forEach(e => e.kill(true)); // niemand bleibt ewig unauffindbar
      if (!run.q.length && !run.live.length) { if (run.wave >= TIERS[run.tier].waves.length - 1) finish(); else { run.phase = 'pause'; run.t = 0; } }
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 8 - cy, r: 32, c: [252, 200, 130], a: 0.3 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), w = Math.round(Math.sin(this.t * 0.08)), f = W.player.cx < this.cx ? -1 : 1, R = (a, y, n, h, c) => { ctx.fillStyle = c; ctx.fillRect(f > 0 ? x + a : x - a - n, b + y, n, h); };
      R(-4, -11, 3, 11, '#1c1c28'); R(1, -11, 3, 11, '#1c1c28'); R(-5, -24, 10, 14, '#a81c28'); R(-1, -24, 2, 12, '#f8d048'); R(-5, -24, 10, 1, '#d83040'); R(-7, -23, 2, 9, '#a81c28'); R(5, -23 + w, 3, 3, '#a81c28');
      R(-3, -31, 7, 7, '#e8b890'); R(1, -29, 1, 1, '#100808'); R(-1, -27, 6, 1, '#2c1c14'); R(-5, -33, 11, 2, '#141018'); R(-3, -41, 7, 8, '#141018'); R(-3, -35, 7, 1, '#c82030');
      R(8, -25 + w, 2, 5, '#f8d048'); R(10, -27 + w, 2, 9, '#f8d048'); R(12, -29 + w, 2, 13, '#c89020');
      if (!run && this.near()) { const y = b - 54 + Math.round(Math.sin(this.t * 0.14) * 2); ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1); }
    }
  }
  function floorY() { for (let r = W.room.h - 1; r > 1; r--) if (Phys.solidTile(NPC, r) && !Phys.solidTile(NPC, r - 1)) return r * T; return (ROW + 1) * T; }
  function populate(w) { run = null; ui = null; if (typeof Castle !== 'undefined' && Castle.on && w.room.side === 'kolosseum') w.spawn(new Ansager(floorY())); }
  function input(P) { // true = Menü zu
    ui.t++; if (ui.t < 10) return false;
    if (P.start) { ui = null; return true; }
    if (P.up || P.down) { ui.sel = (ui.sel + (P.down ? 1 : 3)) % 4; ui.msg = null; Audio8.sfx('select'); }
    if (P.jump || P.attack) {
      if (ui.sel === 3) { ui = null; return true; }
      if (!open(ui.sel)) { ui.msg = 1; Audio8.sfx('wall'); return false; }
      start(ui.sel); ui = null; return true;
    }
    return false;
  }
  function draw(ctx, t) {
    if (!ui) return;
    const cx = View.cx, w = View.w, lx = cx - Math.min(132, w / 2 - 20), rx = cx + Math.min(132, w / 2 - 20);
    Zier.frame(ctx, '#c83828'); Game.big(ctx, tr('arenaTitle'), cx, 12, 2, LOGO, null, '#000');
    Duell.wrap(tr('arenaLine'), rx - lx).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 36 + i * 10, '#d0c0a0', { align: 'center', shadow: '#000' }));
    TIERS.forEach((D, i) => {
      const y = 66 + i * 34, on = ui.sel === i, ok = open(i), done = won(i);
      if (on) { ctx.fillStyle = 'rgba(200,56,40,0.2)'; ctx.fillRect(lx - 6, y - 5, rx - lx + 12, 30); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 3, y); }
      Font.draw(ctx, tr('arenaT' + (i + 1)), lx + 10, y, ok ? D.col : '#6c6474', { shadow: '#000' });
      Font.draw(ctx, done ? '+' + Math.round(D.gold / 4) + ' G' : '+' + D.gold + ' G', rx, y, ok ? '#f8d848' : '#6c6474', { align: 'right', shadow: '#000' });
      const sub = !ok ? (i > 0 && !won(i - 1) ? tr('arenaLockPrev') : tr('arenaLockLv', D.lv)) : best(i) ? tr('arenaBest', clock(best(i))) : tr('arenaWaves', D.waves.length);
      Font.draw(ctx, sub, lx + 10, y + 12, ok ? '#a09888' : '#a06050', { shadow: '#000' });
    });
    const by = 172, on = ui.sel === 3; if (on) { ctx.fillStyle = 'rgba(200,56,40,0.2)'; ctx.fillRect(lx - 6, by - 3, rx - lx + 12, 13); Sprites.draw(ctx, Sprites.S.heartS, lx - 3, by); } Font.draw(ctx, tr('opferBack'), lx + 10, by, on ? '#fcfcfc' : '#b0a080', { shadow: '#000' });
  }
  function drawHud(ctx) { // Wellenanzeige und Ansage über dem Spiel
    if (!run) return;
    const cx = View.cx, D = TIERS[run.tier], n = run.wave + (run.phase === 'pause' ? 2 : 1), all = D.waves.length;
    Font.draw(ctx, tr('arenaWave', Math.min(n, all), all) + '   ' + clock(run.time), cx, 36, D.col, { align: 'center', shadow: '#000' });
    if (run.phase === 'pause') {
      const k = run.t; ctx.globalAlpha = clamp(Math.min(k / 12, (100 - k) / 14), 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 76, View.w, 54); ctx.fillStyle = D.col; ctx.fillRect(0, 76, View.w, 1); ctx.fillRect(0, 129, View.w, 1);
      Game.big(ctx, tr('arenaWave', Math.min(n, all), all), cx, 84, 2, LOGO, null, '#000');
      Duell.wrap(tr('arenaQuip' + ((run.wave + 1) % QUIPS)), View.w - 24).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 106 + i * 10, '#f0e8d8', { align: 'center', shadow: '#000' }));
      ctx.globalAlpha = 1;
    }
  }
  return { populate, input, draw, drawHud, start, TIERS, won, get run() { return run; }, get ui() { return ui; } };
})();
