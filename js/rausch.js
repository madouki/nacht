// Bossrausch: Der Gong im Kolosseum ruft alle bereits besiegten Bosse noch einmal, einen nach dem anderen, in ihren eigenen Kammern und auf Zeit.
// Der Spielstand bleibt unberührt: Besiegt gilt weiter als besiegt, der Rausch öffnet die Kammern nur, solange er läuft. Zwischen zwei Bossen gibt es etwas Leben zurück;
// wer fällt, wacht wie gewohnt an der Speicherkammer auf. Der Graf bleibt außen vor: Sein Ende gehört der Geschichte.
'use strict';
const Rausch = (() => {
  const MIN = 5, GONG = 23, HEAL = 0.3, WAIT = 90, GIVE_UP = 600;
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const clock = (f) => { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let run = null, ui = null, home = null, out = null;

  function rooms() { // alle Kammern in der Reihenfolge der Regionen, ohne den Grafen
    const L = [], last = Levels.STAGES.length - 1;
    Levels.STAGES.forEach((st, s) => st.rooms.forEach((d, r) => { const m = d.mini && d.mini.boss, a = d.arena && d.arena.boss; if ((m || a) && !(a && s === last)) L.push({ s, r, boss: m || a }); }));
    return L;
  }
  const roster = () => rooms().filter(L => Castle.beaten(L.s, L.r));
  const reset = () => { run = null; ui = null; home = null; out = null; };

  function enter() { const L = run.list[run.i]; W.miniDone = {}; run.phase = 'enter'; run.t = 0; Game.castleGo({ s: L.s, r: L.r, place: 'start' }); }
  function start() { run = { list: roster(), i: 0, time: 0, t: 0, phase: 'enter' }; Audio8.sfx('stinger'); W.shake = Math.max(W.shake, 10); enter(); }
  function place() { // der Held tritt gleich in die Kammer, der Boss wird wie gewohnt vom Betreten gerufen
    const p = W.player, R = W.room, M = R.mini; W.ents.forEach(e => { if (e.kind === 'enemy' || e.kind === 'eproj') e.dead = true; }); W.spawners = [];
    if (M) { p.x = (M.x + 1) * T; p.y = Math.max(M.minRow + 1, 1) * T; } else if (R.arena) p.x = R.w * T - View.w + 70;
    p.vx = 0; p.vy = 0;
  }
  function force(L) { // Kammern mit eigenem Auslöser: die Arena von Hand schließen
    const R = W.room, M = R.mini, vw = View.w;
    W.arenaOn = true; W.camLock = true; W.arenaBoss = L.boss; W.arenaX = M ? M.x0 * T : R.w * T - vw; W.arenaW = M ? (M.x1 - M.x0) * T : vw;
    W.camTarget = clamp(Math.round(W.arenaX + W.arenaW / 2 - vw / 2), 0, R.w * T - vw);
  }
  function end(win) {
    const r = run, f = F(), n = win ? r.list.length : r.i, all = rooms().length; run = null;
    f.rausch_n = Math.max(f.rausch_n || 0, n);
    const gold = n * (win ? 600 : 300); if (gold) W.addScore(gold);
    if (win) { if (!f.rausch_best || r.time < f.rausch_best) f.rausch_best = r.time; if (r.list.length >= all) f.rausch_all = 1; Audio8.sfx('cert'); }
    Castle.setFlag('rausch_seen');
    if (win) { const k = Castle.side.kolosseum; home = { n, time: r.time, gold }; Game.castleGo({ s: k.s, r: k.r, place: 'start' }); }
    else out = { n, all: r.list.length };
  }
  function defeated() { // true: die Beute und der Orb des Bosses entfallen, es geht gleich weiter
    if (!run) return false;
    run.phase = 'won'; run.t = 0; W.camLock = false; W.arenaOn = false; W.arenaW = 0; Game.bossName = 0;
    return true;
  }
  function tick() {
    if (Game.state !== 'play' || !Castle.on) return;
    const p = W.player;
    if (out && p.alive && p.state !== 'dead') { Game.note('rauschOut', out.n, out.all); out = null; }
    if (home && W.room.side === 'kolosseum') { ui = { t: 0, sel: 1, res: home }; home = null; Game.go('rausch'); return; }
    if (!run) return;
    if (!p.alive || p.state === 'dead') { end(false); return; }
    const L = run.list[run.i], here = W.stage === L.s && W.roomIdx === L.r; run.t++;
    if (run.phase === 'enter') { if (here) { run.phase = 'call'; run.t = 0; place(); } else if (run.t > GIVE_UP) end(false); return; }
    if (!here) { run = null; return; } // Schnellreise oder Ähnliches: der Rausch ist vorbei
    if (run.phase === 'call') {
      run.time++; if (W.boss) { run.phase = 'fight'; return; }
      if (W.camTarget !== null && W.camTarget !== undefined) W.cam.x = W.camTarget; // keine lange Kamerafahrt durch den Raum: gleich in die Kammer
      if (run.t === 40 && !W.arenaOn && W.camTarget === null) force(L);
      if (run.t > GIVE_UP) { run.phase = 'won'; run.t = WAIT; } // lässt sich nicht rufen: überspringen statt hängen
      return;
    }
    if (run.phase === 'fight') { run.time++; return; }
    if (run.t === 24) { const n = Math.ceil(p.maxHp * HEAL); p.hp = Math.min(p.maxHp, p.hp + n); W.popup(p.cx, p.y - 14, tr('rauschHeal'), '#7cf8a0'); Audio8.sfx('heart'); }
    if (run.t > WAIT) { run.i++; if (run.i >= run.list.length) end(true); else enter(); }
  }

  class Gong extends Ent {
    constructor(fy) { super(GONG * T, fy - 44, 32, 44); this.kind = 'prop'; this.fy = fy; this.swing = 0; }
    near() { const p = W.player; return p.alive && p.onGround && Math.abs(p.cx - this.cx) < 26 && Math.abs(p.feet - this.fy) < 20 && !Arena.run; }
    update() {
      this.t++; if (this.swing > 0) this.swing--;
      if (this.near() && Input.pressed.up && Game.state === 'play') { const n = roster().length; ui = { t: 0, sel: n >= MIN ? 0 : 1, res: null }; this.swing = 60; Audio8.sfx('announce'); Game.go('rausch'); }
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 20 - cy, r: 40, c: [252, 190, 90], a: 0.32 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), b = Math.round(this.fy - W.cam.y), R = (a, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, b + y, w, h); };
      R(-17, -44, 4, 44, '#3c2414'); R(13, -44, 4, 44, '#3c2414'); R(-16, -44, 1, 44, '#5c3c20'); R(14, -44, 1, 44, '#5c3c20'); R(-21, -47, 42, 5, '#4c2c18'); R(-21, -47, 42, 1, '#7c5028'); R(-20, -3, 8, 3, '#2c1c10'); R(12, -3, 8, 3, '#2c1c10');
      const dx = Math.round(Math.sin(this.swing * 0.4) * this.swing * 0.04), cx = x + dx, cy = b - 22, rings = [[12, '#7c5414'], [11, '#c88c1c'], [9, '#e8b030'], [6, '#c88c1c'], [3, '#f8d868']];
      ctx.fillStyle = '#20140c'; ctx.fillRect(x - 5, b - 42, 1, 9); ctx.fillRect(x + 4, b - 42, 1, 9);
      for (const [r, c] of rings) { ctx.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
      ctx.fillStyle = '#fff4c0'; ctx.fillRect(cx - 6, cy - 7, 4, 1); ctx.fillRect(cx - 8, cy - 5, 2, 2);
      if (this.near()) { const y = b - 62 + Math.round(Math.sin(this.t * 0.14) * 2); ctx.fillStyle = '#100808'; ctx.fillRect(x - 5, y - 1, 11, 11); ctx.fillStyle = '#f8c838'; ctx.fillRect(x, y + 1, 1, 7); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y + 3, 5, 1); }
    }
  }
  function floorY() { for (let r = W.room.h - 1; r > 1; r--) if (Phys.solidTile(GONG, r) && !Phys.solidTile(GONG, r - 1)) return r * T; return 11 * T; }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && w.room.side === 'kolosseum') w.spawn(new Gong(floorY())); }

  function input(P) { // true = Menü zu
    ui.t++; if (ui.t < 10) return false;
    if (P.start) { ui = null; return true; }
    const ok = !ui.res && roster().length >= MIN;
    if ((P.up || P.down) && ok) { ui.sel = 1 - ui.sel; Audio8.sfx('select'); }
    if (P.jump || P.attack) { if (ui.sel === 1 || !ok) { ui = null; return true; } ui = null; start(); return 'fade'; }
    return false;
  }
  function draw(ctx, t) {
    if (!ui) return;
    const cx = View.cx, half = Math.min(132, View.w / 2 - 20), lx = cx - half, rx = cx + half, f = F(), n = roster().length;
    Zier.frame(ctx, '#c88c1c'); Game.big(ctx, tr('rauschTitle'), cx, 14, 2, LOGO, null, '#000');
    Duell.wrap(tr('rauschLine'), rx - lx).slice(0, 3).forEach((l, i) => Font.draw(ctx, l, cx, 40 + i * 11, '#d0c0a0', { align: 'center', shadow: '#000' }));
    if (ui.res) {
      Font.draw(ctx, tr('rauschWin', ui.res.n, clock(ui.res.time)), cx, 92, '#f8d848', { align: 'center', shadow: '#000' });
      Font.draw(ctx, tr('arenaGold', ui.res.gold), cx, 108, '#a8d8a0', { align: 'center', shadow: '#000' });
    } else {
      Font.draw(ctx, n >= MIN ? tr('rauschWait', n) : tr('rauschLock', MIN - n), cx, 86, n >= MIN ? '#f8d848' : '#e08068', { align: 'center', shadow: '#000' });
      if (f.rausch_best) Font.draw(ctx, tr('rauschBest', clock(f.rausch_best)), cx, 102, '#a8d8a0', { align: 'center', shadow: '#000' });
      if (f.rausch_n) Font.draw(ctx, tr('rauschMost', f.rausch_n), cx, 114, '#a09888', { align: 'center', shadow: '#000' });
    }
    const row = (y, s, on, ok) => { if (on) { ctx.fillStyle = 'rgba(200,140,28,0.24)'; ctx.fillRect(lx - 6, y - 3, rx - lx + 12, 13); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 3, y); } Font.draw(ctx, s, cx, y, !ok ? '#6c6474' : on ? '#fcfcfc' : '#b0a080', { align: 'center', shadow: '#000' }); };
    if (!ui.res) row(140, tr('rauschGo'), ui.sel === 0, n >= MIN);
    row(158, tr('opferBack'), ui.sel === 1, true);
  }
  function drawHud(ctx) { // Zähler und Uhr über dem Kampf; während des Namensbands hält er sich zurück
    if (!run || (W.boss && Game.bossName > 0 && Game.bossName < 150)) return;
    Font.draw(ctx, tr('rauschHud', Math.min(run.i + 1, run.list.length), run.list.length) + '   ' + clock(run.time), View.cx, 36, '#f0c860', { align: 'center', shadow: '#000' });
  }
  return { populate, tick, defeated, input, draw, drawHud, reset, rooms, roster, start, MIN, get on() { return !!run; }, get run() { return run; }, get ui() { return ui; } };
})();
