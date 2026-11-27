// Gladiatorenprüfung im Kolosseum: Der Ansager schickt fünf Wellen in den abgesperrten Westflügel. Drei Stufen (Bronze, Silber, Gold) mit
// wachsenden Gegnern und Champions; beim ersten Sieg gibt es Gold und einen Trank, Gold schenkt dauerhaft Angriff, Wiederholungen zahlen ein Viertel.
// Dazu die Tagesprüfung: jeden Tag (Ortszeit) andere Wellen und zwei Regeln (Champions, Fledermäuse, Goldrausch, Mondschwerkraft, Hektik, Glaskanone).
'use strict';
const Arena = (() => {
  const X0 = 3, X1 = 27, NPC = 16, ROW = 10, QUIPS = 4, MAXWAVE = 2700;
  const TIERS = [
    { lv: 1, gold: 2000, item: 'potion', mul: 1, col: '#d89048', waves: ['sk sk', 'gh gh gh ba ba', 'kn sk sk', 'pa pa ba ba', 'kn kn sk sk ba'] },
    { lv: 8, gold: 6000, item: 'elixir', mul: 1.6, col: '#c8d0e0', waves: ['kn sk sk ba', 'pa pa pa gh gh', 'kn kn *sk', 'bk bk bk pa pa', '*kn kn sk sk ba ba'] },
    { lv: 15, gold: 15000, item: 'elixir', mul: 2.4, col: '#f8d048', waves: ['*sk kn kn', 'pa pa pa pa ba ba', '*pa bk bk gh gh gh', 'kn kn kn sk sk ho', '*kn *kn *pa sk sk'] },
  ];
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  // Der Direktor in Blender (tools/blender/direktor_bl.py → pack_direktor.py): idle0/idle1, ruf (Ansage), jubel (nach dem Sieg), 44×56, Füße 22/56
  const DIR_MAP = {"idle0":[0,0,44,56],"idle1":[45,0,44,56],"ruf":[90,0,44,56],"jubel":[135,0,44,56]};
  const DIR = (() => { let C = null; const img = new Image(); img.onload = () => { C = {}; for (const [n, r] of Object.entries(DIR_MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } }; img.src = 'img/direktor3d.png?v=' + (window.BUILD || ''); return { get: (n) => C && C[n] }; })();
  let cheer = 0;   // Jubel nach einem Sieg (Bilder)
  const won = (i) => !!F()['arena_t' + (i + 1)], best = (i) => F()['arena_b' + (i + 1)] || 0;
  const open = (i) => i === 3 ? won(0) && Castle.rpg.lv >= 5 : (i === 0 || won(i - 1)) && Castle.rpg.lv >= TIERS[i].lv;
  const MODS = ['champs', 'bats', 'gold', 'grav', 'eile', 'glas'];
  const POOL = ['sk sk kn ba', 'gh gh gh pa pa', 'kn kn *sk ba', 'bk bk pa pa ho', 'pa pa pa ba ba', '*kn sk sk bk', 'ho ho gh gh kn', 'kn kn kn ba ba ba', '*pa pa sk sk', 'bk bk bk gh gh ho'];
  const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  function daily(key = today()) { // aus dem Datum gewürfelt: für alle Spieler am selben Tag dieselbe Prüfung
    let a = (key * 2654435761) >>> 0 || 1; const r = () => { a ^= a << 13; a >>>= 0; a ^= a >>> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; };
    const m = MODS.slice(), mods = []; while (mods.length < 2) mods.push(m.splice(Math.floor(r() * m.length), 1)[0]);
    const p = POOL.slice(), waves = []; while (waves.length < 5) waves.push(p.splice(Math.floor(r() * p.length), 1)[0]);
    return { key, mods, lv: 5, gold: 5000 * (mods.includes('gold') ? 3 : 1), item: 'elixir', mul: 1.8, col: '#7cdcfc', waves: mods.includes('bats') ? waves.map(w => w + ' ba ba') : waves };
  }
  const dailyBest = () => F()['daily_' + today()] || 0;
  let undo = [];
  function cleanup() { undo.forEach(f => { try { f(); } catch (e) { /* schon fort */ } }); undo = []; }
  const clock = (f) => { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let run = null, ui = null;
  const has = (m) => !!(run && run.tier === 3 && TIERS[3] && TIERS[3].mods.includes(m));

  function make(code, col, dir) {
    const champ = code[0] === '*', c = champ ? code.slice(1) : code; let e;
    if (c === 'sk') e = new Skeleton(col, ROW); else if (c === 'kn') e = new Knight(col, ROW); else if (c === 'pa') e = new Panther(col, ROW);
    else if (c === 'gh') { e = new Ghoul(col * T, (ROW + 1) * T, dir); e.rise = 20; }
    else if (c === 'ba') { e = new Bat(col, 5); e.state = 'fly'; e.dir = dir; e.face = dir; e.baseY = e.y; e.seen = true; }
    else if (c === 'bk') e = new FlyBook(col * T, 6 * T, { dir }); else e = new Ghost(col, 6);
    if (champ) Champ.make(e); else if (has('champs') && Math.random() < 0.4) Champ.make(e);
    e.hp *= TIERS[run.tier].mul * (has('glas') ? 0.5 : 1); if (e.champHp) e.champHp = e.hp; e.seen = true;
    if (has('eile')) { const up = e.update; e.update = function () { up.call(this); if (W.frame % 2 === 0 && !this.dead) up.call(this); }; }
    return e;
  }
  function start(tier) {
    W.ents.forEach(e => { if (e.kind === 'enemy' || e.kind === 'eproj') e.dead = true; }); W.spawners = [];
    cleanup(); if (tier === 3) TIERS[3] = daily();
    run = { tier, wave: -1, phase: 'pause', t: 0, q: [], live: [], time: 0, n: 0 };
    if (has('grav')) { const R = W.room, g0 = R.grav; R.grav = 0.62; undo.push(() => { R.grav = g0; }); }
    if (has('glas')) { const p = W.player, own = Object.prototype.hasOwnProperty.call(p, 'hurt'), h = p.hurt; p.hurt = function (d, x) { return h.call(this, d * 2, x); }; undo.push(() => { if (own) p.hurt = h; else delete p.hurt; }); }
    W.arenaOn = true; W.camLock = true; W.arenaBoss = null; W.camTarget = null; W.arenaX = X0 * T; W.arenaW = (X1 - X0) * T;
    Audio8.play('boss'); Audio8.sfx('roar');
  }
  function finish() {
    const i = run.tier, D = TIERS[i], f = F(), p = W.player, dk = 'daily_' + (D.key || 0), first = i === 3 ? !f[dk] : !won(i), gold = first ? D.gold : Math.round(D.gold / 4);
    if (i === 3) { if (!f[dk] || run.time < f[dk]) f[dk] = run.time; if (first) f.daily_n = (f.daily_n || 0) + 1; }
    else { f['arena_t' + (i + 1)] = 1; if (!best(i) || run.time < best(i)) f['arena_b' + (i + 1)] = run.time; }
    W.addScore(gold); W.popup(p.cx, p.y - 16, tr('arenaGold', gold), '#f8d848'); Game.note(i === 3 ? 'arenaDailyWin' : first && i === 2 ? 'arenaThumb' : 'arenaWin');
    if (first) { Castle.giveItem(D.item, true); if (i === 2) f.gw_atk = (f.gw_atk || 0) + 1; }
    cleanup();
    Castle.setFlag('arena_seen'); Audio8.play(W.songName()); Audio8.sfx('cert'); Audio8.sfx('money'); Input.rumble(0.6, 0.6, 300);
    W.spawn(new Shock(p.cx, p.cy, 90, '#f8d048', 5)); W.flash = Math.max(W.flash, 6); cheer = 240;
    W.arenaOn = false; W.camLock = false; W.arenaW = 0; W.camEase = 1; run = null;
  }
  class Ansager extends Ent {
    constructor(fy) { super(NPC * T, fy - 30, 16, 30); this.kind = 'prop'; this.fy = fy; }
    near() { const p = W.player; return p.alive && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.feet - this.fy) < 20; }
    update() {
      this.t++; if (cheer > 0) cheer--; if (run) { this.tick(); return; }
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
    pose() { // Ansage bei jeder neuen Welle, Jubel nach dem Sieg, sonst ruhiges Atmen
      if (cheer > 0) return 'jubel';
      if (run && (run.phase === 'pause' ? run.t > 60 : run.t < 46)) return 'ruf';
      return (this.t >> 5) & 1 ? 'idle1' : 'idle0';
    }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), w = Math.round(Math.sin(this.t * 0.08)), f = W.player.cx < this.cx ? -1 : 1, R = (a, y, n, h, c) => { ctx.fillStyle = c; ctx.fillRect(f > 0 ? x + a : x - a - n, b + y, n, h); };
      const im = DIR.get(this.pose());
      if (im) { // Blender-Figur; beim Jubel hüpft er ein wenig
        const hop = cheer > 0 ? -Math.abs(Math.sin(cheer * 0.18)) * 3 : 0;
        ctx.save(); ctx.translate(x, Math.round(b + hop)); if (f < 0) ctx.scale(-1, 1); ctx.drawImage(im, -22, -56); ctx.restore();
        if (!run && this.near()) { const y = b - 70 + Math.round(Math.sin(this.t * 0.14) * 2); ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1); }
        return;
      }
      R(-4, -11, 3, 11, '#1c1c28'); R(1, -11, 3, 11, '#1c1c28'); R(-5, -24, 10, 14, '#a81c28'); R(-1, -24, 2, 12, '#f8d048'); R(-5, -24, 10, 1, '#d83040'); R(-7, -23, 2, 9, '#a81c28'); R(5, -23 + w, 3, 3, '#a81c28');
      R(-3, -31, 7, 7, '#e8b890'); R(1, -29, 1, 1, '#100808'); R(-1, -27, 6, 1, '#2c1c14'); R(-5, -33, 11, 2, '#141018'); R(-3, -41, 7, 8, '#141018'); R(-3, -35, 7, 1, '#c82030');
      R(8, -25 + w, 2, 5, '#f8d048'); R(10, -27 + w, 2, 9, '#f8d048'); R(12, -29 + w, 2, 13, '#c89020');
      if (!run && this.near()) { const y = b - 54 + Math.round(Math.sin(this.t * 0.14) * 2); ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1); }
    }
  }
  function floorY() { for (let r = W.room.h - 1; r > 1; r--) if (Phys.solidTile(NPC, r) && !Phys.solidTile(NPC, r - 1)) return r * T; return (ROW + 1) * T; }
  function populate(w) { cleanup(); run = null; ui = null; if (typeof Castle !== 'undefined' && Castle.on && w.room.side === 'kolosseum') w.spawn(new Ansager(floorY())); }
  function input(P) { // true = Menü zu
    ui.t++; if (ui.t < 10) return false;
    if (P.start) { ui = null; return true; }
    if (P.up || P.down) { ui.sel = (ui.sel + (P.down ? 1 : 4)) % 5; ui.msg = null; Audio8.sfx('select'); }
    if (P.jump || P.attack) {
      if (ui.sel === 4) { ui = null; return true; }
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
    TIERS.slice(0, 3).forEach((D, i) => {
      const y = 60 + i * 30, on = ui.sel === i, ok = open(i), done = won(i);
      if (on) { ctx.fillStyle = 'rgba(200,56,40,0.2)'; ctx.fillRect(lx - 6, y - 5, rx - lx + 12, 26); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 3, y); }
      Font.draw(ctx, tr('arenaT' + (i + 1)), lx + 10, y, ok ? D.col : '#6c6474', { shadow: '#000' });
      Font.draw(ctx, done ? '+' + Math.round(D.gold / 4) + ' G' : '+' + D.gold + ' G', rx, y, ok ? '#f8d848' : '#6c6474', { align: 'right', shadow: '#000' });
      const sub = !ok ? (i > 0 && !won(i - 1) ? tr('arenaLockPrev') : tr('arenaLockLv', D.lv)) : best(i) ? tr('arenaBest', clock(best(i))) : tr('arenaWaves', D.waves.length);
      Font.draw(ctx, sub, lx + 10, y + 12, ok ? '#a09888' : '#a06050', { shadow: '#000' });
    });
    { // Tagesprüfung: heute gewürfelte Regeln, Bestzeit des Tages
      const D = daily(), y = 150, on = ui.sel === 3, ok = open(3), b = dailyBest();
      if (on) { ctx.fillStyle = 'rgba(60,140,200,0.22)'; ctx.fillRect(lx - 6, y - 5, rx - lx + 12, 26); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 3, y); }
      Font.draw(ctx, tr('arenaDaily'), lx + 10, y, ok ? D.col : '#6c6474', { shadow: '#000' });
      Font.draw(ctx, b ? tr('arenaDailyDone', clock(b)) : '+' + D.gold + ' G', rx, y, ok ? (b ? '#a8d8a0' : '#f8d848') : '#6c6474', { align: 'right', shadow: '#000' });
      Font.draw(ctx, ok ? D.mods.map(m => tr('mod_' + m)).join(' · ') : tr('arenaLockPrev'), lx + 10, y + 12, ok ? '#a0c8d8' : '#a06050', { shadow: '#000' });
    }
    const by = 184, on = ui.sel === 4; if (on) { ctx.fillStyle = 'rgba(200,56,40,0.2)'; ctx.fillRect(lx - 6, by - 3, rx - lx + 12, 13); Sprites.draw(ctx, Sprites.S.heartS, lx - 3, by); } Font.draw(ctx, tr('opferBack'), lx + 10, by, on ? '#fcfcfc' : '#b0a080', { shadow: '#000' });
  }
  function drawHud(ctx) { // Wellenanzeige und Ansage über dem Spiel
    if (!run) return;
    const cx = View.cx, D = TIERS[run.tier], n = run.wave + (run.phase === 'pause' ? 2 : 1), all = D.waves.length;
    Font.draw(ctx, tr('arenaWave', Math.min(n, all), all) + '   ' + clock(run.time), cx, 36, D.col, { align: 'center', shadow: '#000' });
    if (run.tier === 3 && !(Game.noteT > 0)) Font.draw(ctx, D.mods.map(m => tr('mod_' + m)).join(' · '), cx, 46, '#a0c8d8', { align: 'center', shadow: '#000' });
    if (run.phase === 'pause') {
      const k = run.t; ctx.globalAlpha = clamp(Math.min(k / 12, (100 - k) / 14), 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 76, View.w, 54); ctx.fillStyle = D.col; ctx.fillRect(0, 76, View.w, 1); ctx.fillRect(0, 129, View.w, 1);
      Game.big(ctx, tr('arenaWave', Math.min(n, all), all), cx, 84, 2, LOGO, null, '#000');
      Duell.wrap(tr('arenaQuip' + ((run.wave + 1) % QUIPS)), View.w - 24).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 106 + i * 10, '#f0e8d8', { align: 'center', shadow: '#000' }));
      ctx.globalAlpha = 1;
    }
  }
  return { populate, input, draw, drawHud, start, TIERS, won, daily, today, MODS, dailyBest, get run() { return run; }, get ui() { return ui; } };
})();
