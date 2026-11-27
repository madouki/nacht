// Die Klötzchenburg (Spielzustand 'burg'): ein Verlies aus Riesenspielzeug im Krähenkamm, in Draufsicht wie die Grafschaft Krat
// (umland.js, Ort Z). Sechs Räume zu 26×13 Kacheln, Bilder aus Blender (tools/blender/burg_bl.py → pack_burg.py: img/burg3d.png
// mit den Räumen, img/burgobj.png mit Figuren und Dingen). Rätsel: Bauklötze auf Knöpfe schieben, Aufziehschlüssel für den
// Schlüsselklotz, die Klopfbank (Schalter mit der Peitsche treffen: rote und blaue Pflöcke tauschen), Zinnsoldaten (zwei
// Peitschenhiebe), Kreisel (unverwundbar, prallen ab), Bällebad (versinken: zurück an die Tür). Kommandant Knacks, ein
// Nussknacker, steht in der Eingangshalle. Lohn in der Schatzkammer: die Nebenwaffe Kreisel (enemies.js), danach bringt die
// Spieluhr-Drehscheibe hinaus. Fortschritt in Castle.flags: burg_keys, burg_bigkey, burg_door_<id>, burg_c_<id>, burg_r1, burg_r2,
// burg_done, burg_v_<raum>. Test: rec/test_burg.js
'use strict';
const Burg = (() => {
  const TS = 16, RW = 26, RH = 13, TOP = 32, CROWN = 20, IW = RW * TS, FH = RH * TS;   // Boden beginnt 32 px unter dem Bildrand
  const ROOM_MAP = {"r0":[0,0,416,228],"r1":[417,0,416,228],"r2":[0,229,416,228],"r3":[417,229,416,228],"r4":[0,458,416,228],"r5":[417,458,416,228]};   // pack_burg.py: [x, y, w, h] der Raumbilder in img/burg3d.png (416×228, oben 20 px Wandkrone)
  const OBJ_MAP = {"block0":[34,65,20,28,-2,-10],"block1":[55,65,20,28,-2,-10],"block2":[76,65,20,28,-2,-10],"btn0":[273,65,16,20,0,-4],"btn1":[290,65,16,20,0,-4],"pr0":[139,65,16,26,0,-10],"pr1":[156,65,16,26,0,-10],"pb0":[173,65,16,26,0,-10],"pb1":[190,65,16,26,0,-10],"sw0":[0,65,16,30,0,-14],"sw1":[17,65,16,30,0,-14],"ch0":[97,65,20,28,-2,-12],"ch1":[118,65,20,28,-2,-12],"bc0":[332,0,28,34,-6,-16],"bc1":[361,0,28,34,-6,-16],"it_key":[391,65,16,16,0,-4],"it_bigkey":[408,65,16,16,0,-4],"it_kreisel":[425,65,16,16,0,-4],"lockN":[390,0,36,34,-2,-16],"bigN":[427,0,36,34,-2,-16],"shutN":[464,0,36,34,-2,-16],"lockW":[0,0,20,64,-2,-14],"bigW":[21,0,20,64,-2,-14],"shutW":[42,0,20,64,-2,-14],"sold0":[129,0,28,36,-6,-22],"sold1":[158,0,28,36,-6,-22],"solu0":[187,0,28,36,-6,-22],"solu1":[216,0,28,36,-6,-22],"sols0":[245,0,28,36,-6,-22],"sols1":[274,0,28,36,-6,-22],"solx":[303,0,28,36,-6,-22],"top0":[307,65,20,20,-2,-6],"top1":[328,65,20,20,-2,-6],"top2":[349,65,20,20,-2,-6],"top3":[370,65,20,20,-2,-6],"npc0":[63,0,32,46,-8,-30],"npc1":[96,0,32,46,-8,-30],"pad0":[207,65,32,26,-8,-6],"pad1":[240,65,32,26,-8,-6]};    // pack_burg.py: [x, y, w, h, ox, oy] in img/burgobj.png (ox/oy: Versatz zur linken oberen Ecke der Kachel)
  // # Wand · o Spielzeugstapel · D Tür · . Boden · , Boden nur für den Helden (Klötze rutschen dort nicht) · ~ Bällebad
  // B Bauklotz · _ Knopf · r/b Pflock rot/blau · S Klopfbank-Schalter · c/C Truhe/große Truhe · N Knacks · T Zinnsoldat · K Kreisel · X Spieluhr
  const ROOMS = {
    r0: { gx: 1, gy: 2, doors: { n: 'a', s: 'x', w: 'o', e: 'o' }, rows: [
      '############DD############',
      '#o......................o#',
      '#........................#',
      '#....N...................#',
      '#........................#',
      'D........................D',
      'D........................D',
      'D........................D',
      '#........................#',
      '#........................#',
      '#........................#',
      '#o......................o#',
      '############DD############'] },
    r1: { gx: 0, gy: 2, doors: { e: 'o' }, chests: { c: { id: 'k1', item: 'key', cond: 'burg_r1' } }, rows: [
      '##########################',
      '#,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,oooooooooooooo,,,,,,#',
      '#,,,,o_...o....o..o,,c,,,#',
      '#,,,,o....B.......o,,,,,,#',
      '#,,,,o..oo...o....o,,,,,,D',
      '#,,,,o......B......,,,,,,D',
      '#,,,,o..o....oo...o,,,,,,D',
      '#,,,,o.B..........o,,,,,,#',
      '#,,,,o_...o.....o.o,,,,,,#',
      '#,,,,oooooooooooooo,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,#',
      '##########################'] },
    r2: { gx: 2, gy: 2, doors: { w: 'o', n: 'c' }, axes: ['h', 'v', 'h'], rows: [
      '############DD############',
      '#........................#',
      '#........................#',
      '#.....o..........o.......#',
      '#........T...............#',
      'D........................#',
      'D...........o..o.....T...#',
      'D........................#',
      '#.....o..........o.......#',
      '#.......T................#',
      '#........................#',
      '#........................#',
      '##########################'] },
    r3: { gx: 2, gy: 1, doors: { s: 'c' }, chests: { C: { id: 'bk', item: 'bigkey' } }, rows: [
      '##########################',
      '#........................#',
      '#......oooooooooooo......#',
      '#......o....C.....o......#',
      '#......o..........o......#',
      '#......ooooobbooooo......#',
      '#......o...S......o......#',
      '#......ooooorrooooo......#',
      '#........................#',
      '#...S....................#',
      '#........................#',
      '#........................#',
      '############DD############'] },
    r4: { gx: 1, gy: 1, doors: { s: 'a', n: 'b' }, rows: [
      '############DD############',
      '#........................#',
      '#........................#',
      '#.....~~~~~~~~~~~~~~.....#',
      '#.....~~~~~~~~~~~~~~.....#',
      '#..K..~~~~~~~~~~~~~~..K..#',
      '#.....~~~~~~~~~~~~~~.....#',
      '#.....~~~~~~~~~~~~~~.....#',
      '#.....~~~~~~~~~~~~~~.....#',
      '#........................#',
      '#...........K............#',
      '#........................#',
      '############DD############'] },
    r5: { gx: 1, gy: 0, doors: { s: 'b' }, chests: { C: { id: 'kr', item: 'kreisel' } }, rows: [
      '##########################',
      '#........................#',
      '#...o................o...#',
      '#........................#',
      '#........................#',
      '#............C...........#',
      '#........................#',
      '#...o................o...#',
      '#........................#',
      '#........................#',
      '#............X...........#',
      '#........................#',
      '############DD############'] },
  };
  const DOORS = { a: 'lock', b: 'big', c: 'shut' };   // a: Schlüsselklotz Eingang ↔ Kreiselkammer, b: goldenes Schloss zur Schatzkammer, c: Gitter bis die Soldaten fallen
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], SIDE = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
  const flag = (k) => !!Castle.flags[k], setF = (k) => Castle.setFlag(k);
  const doorOpen = (id) => id === 'o' || id === 'x' || (DOORS[id] === 'shut' ? flag('burg_r2') : flag('burg_door_' + id));
  const byGrid = (gx, gy) => Object.keys(ROOMS).find(k => ROOMS[k].gx === gx && ROOMS[k].gy === gy);
  const trList = (k) => { const v = I18N.t(k); return Array.isArray(v) ? v : [v]; };
  let RIMG = null, OIMG = null;
  function ensure() {
    if (RIMG) return;
    RIMG = new Image(); OIMG = new Image();
    RIMG.src = 'img/burg3d.png?v=' + (window.BUILD || ''); OIMG.src = 'img/burgobj.png?v=' + (window.BUILD || '');
  }
  const okImg = (im) => im && im.complete && im.naturalWidth > 0;
  function obj(ctx, name, px, py, a) { // Ding aus dem Atlas, px/py = linke obere Ecke seiner Kachel auf dem Schirm
    const m = OBJ_MAP[name]; if (!m || !okImg(OIMG)) return false;
    if (a !== undefined) ctx.globalAlpha = a;
    ctx.drawImage(OIMG, m[0], m[1], m[2], m[3], Math.round(px + m[4]), Math.round(py + m[5]), m[2], m[3]);
    if (a !== undefined) ctx.globalAlpha = 1;
    return true;
  }

  // ---------------- Zustand ----------------
  let G = null;
  function start() { // vom Ort Z der Grafschaft aus
    ensure();
    G = { room: null, x: 13 * TS, y: FH - 12, dir: 0, step: 0, mv: false, t: 0, inv: 60, push: 0, pushDir: -1, whip: null, talk: null, msg: null, reveal: null,
      sink: 0, trans: null, peg: 0, fx: [], entry: null, swCool: 0, kb: null, lockT: 0 };
    load('r0'); G.entry = { x: G.x, y: G.y, dir: 0 };
    Audio8.sfx('door'); Audio8.play('burg', null, 0.6); Game.go('burg');
    if (!flag('burg_seen')) { setF('burg_seen'); G.msg = { k: 'burgHilfe', t: 420 }; }
  }
  function load(id) {
    const R = ROOMS[id]; G.room = id; G.fx = []; setF('burg_v_' + id);
    G.grid = R.rows.map(r => r.split(''));
    const o = G.o = { blocks: [], buttons: [], pegs: [], sw: [], chests: [], npc: null, sol: [], tops: [], pad: null };
    let ti = 0, ki = 0;
    R.rows.forEach((row, y) => [...row].forEach((c, x) => {
      const put = (ch) => { G.grid[y][x] = ch; };
      if (c === 'B') { o.blocks.push({ x, y, mx: 0, my: 0, mt: 0, v: o.blocks.length % 3 }); put('.'); }
      else if (c === '_') { o.buttons.push({ x, y }); put('.'); }
      else if (c === 'r' || c === 'b') { o.pegs.push({ x, y, c }); put('.'); }
      else if (c === 'S') { o.sw.push({ x, y, hit: 0 }); put('.'); }
      else if (c === 'c' || c === 'C') { o.chests.push(Object.assign({ x, y, big: c === 'C' }, R.chests[c])); put(c === 'c' ? ',' : '.'); }
      else if (c === 'N') { o.npc = { x, y }; put('.'); }
      else if (c === 'T') { if (!flag('burg_r2')) o.sol.push({ x: x * TS + 8, y: y * TS + 10, ax: (R.axes || [])[ti] || 'h', d: ti % 2 ? -1 : 1, hp: 2, hitT: 0, kx: 0, ky: 0, fall: 0, f: 0 }); ti++; put('.'); }
      else if (c === 'K') { const a = [0.7, 2.4, 4.0, 5.6][ki % 4]; o.tops.push({ x: x * TS + 8, y: y * TS + 8, vx: Math.cos(a) * 1.05, vy: Math.sin(a) * 1.05, ph: ki * 1.7 }); ki++; put('.'); }
      else if (c === 'X') { o.pad = { x, y }; put('.'); }
    }));
  }
  const tileAt = (tx, ty) => (G.grid[ty] || [])[tx];
  const blockAt = (tx, ty) => G.o.blocks.find(b => b.x === tx && b.y === ty);
  const present = (c) => !c.cond || flag(c.cond);
  const pegUp = (p) => (p.c === 'r') === (G.peg === 0);
  const doorSide = (tx, ty) => ty === 0 ? 'n' : ty === RH - 1 ? 's' : tx === 0 ? 'w' : 'e';
  function solidObj(tx, ty) {
    const o = G.o;
    return !!(blockAt(tx, ty) || o.sw.some(s => s.x === tx && s.y === ty) || o.chests.some(c => present(c) && c.x === tx && c.y === ty) || (o.npc && o.npc.x === tx && o.npc.y === ty));
  }
  function wallish(tx, ty) { // Wand, Stapel oder geschlossene Tür
    const c = tileAt(tx, ty); if (c === undefined) return true;
    if (c === '#' || c === 'o') return true;
    if (c === 'D') return !doorOpen(ROOMS[G.room].doors[doorSide(tx, ty)]);
    return false;
  }
  function heroBlocked(tx, ty, ign) {
    if (wallish(tx, ty) || solidObj(tx, ty)) return true;
    return G.o.pegs.some(p => p.x === tx && p.y === ty && pegUp(p)) && !(ign && ign.has(tx + ',' + ty)); // steigt ein Pflock unter dem Helden, kommt er noch herunter
  }
  const corners = (x, y) => [[x - 5, y - 4], [x + 5, y - 4], [x - 5, y + 3], [x + 5, y + 3]];
  const boxFree = (x, y, ign) => corners(x, y).every(([px, py]) => !heroBlocked(Math.floor(px / TS), Math.floor(py / TS), ign));
  const underHero = () => new Set(corners(G.x, G.y).map(([px, py]) => Math.floor(px / TS) + ',' + Math.floor(py / TS)));
  const near = (x, y, r) => Math.hypot(G.x - x, G.y - 4 - y) < r;
  function burst(x, y, n, cols, sp = 1.4) { for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.4, sp); G.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, c: cols[i % cols.length], t: 0, life: 22 + (i % 3) * 6 }); } }
  function popup(x, y, s, c) { G.fx.push({ x, y, s, c, t: 0, life: 70, vy: -0.4, vx: 0 }); }

  // ---------------- Schaden, Ohnmacht, Ausgang ----------------
  function hurt(d, fx, fy) {
    if (G.inv > 0) return;
    G.inv = 70; Audio8.sfx('hurt'); if (Input.rumble) Input.rumble(0.4, 0.5, 160);
    if (fx !== undefined) { const dx = G.x - fx, dy = G.y - fy, l = Math.hypot(dx, dy) || 1; G.kb = { x: dx / l * 2.4, y: dy / l * 2.4, t: 10 }; }
    const p = W.player; if (Options.god) return;
    p.hp -= d; if (p.hp <= 0) faint();
  }
  function faint() { // umgekippt: Kommandant Knacks trägt den Helden zurück in die Eingangshalle
    const p = W.player; p.hp = Math.max(1, Math.ceil(p.maxHp / 2));
    load('r0'); G.x = 13 * TS; G.y = FH - 12; G.dir = 0; G.entry = { x: G.x, y: G.y, dir: 0 }; G.kb = null; G.sink = 0; G.whip = null; G.inv = 120;
    G.msg = { k: 'burgOhnmacht', t: 320 };
  }
  function exit() { G = null; Umland.resume(); }
  function leave(side) {
    const R = ROOMS[G.room], id = R.doors[side];
    if (id === 'x') { exit(); return; }
    const [dx, dy] = SIDE[side], nk = byGrid(R.gx + dx, R.gy + dy); if (!nk) return;
    const from = G.room; load(nk);
    if (side === 'n') G.y = FH - 10; else if (side === 's') G.y = 11; else if (side === 'w') G.x = IW - 9; else G.x = 9;
    G.entry = { x: G.x, y: G.y, dir: G.dir }; G.trans = { from, dx, dy, t: 0 }; G.whip = null; G.push = 0; G.kb = null; G.inv = Math.max(G.inv, 40); // kurz Schutz an der Tür
    Audio8.sfx('step');
  }

  // ---------------- Schieben, Schlösser, Truhen ----------------
  function tryPush(b, dx, dy) {
    if (G.room === 'r1' && flag('burg_r1')) return false; // gelöst: die Klötze bleiben, wo sie sind
    const tx = b.x + dx, ty = b.y + dy;
    if (tileAt(tx, ty) !== '.' || solidObj(tx, ty) || G.o.pegs.some(p => p.x === tx && p.y === ty)) { Audio8.sfx('klack2'); return false; }
    b.x = tx; b.y = ty; b.mx = dx; b.my = dy; b.mt = 10; Audio8.sfx('stone');
    return true;
  }
  function tryDoor(tx, ty) { // gegen eine verschlossene Tür laufen: mit Schlüssel aufschließen, sonst Hinweis
    const id = ROOMS[G.room].doors[doorSide(tx, ty)], kind = DOORS[id];
    if (!kind || doorOpen(id) || G.lockT > 0) return;
    G.lockT = 50;
    if (kind === 'lock' && (Castle.flags.burg_keys || 0) > 0) { Castle.flags.burg_keys--; setF('burg_door_' + id); Audio8.sfx('unlock'); popup(G.x, G.y - 30, tr('burgUnlock'), '#fce070'); burst(tx * TS + 8, ty * TS + 8, 10, ['#c89040', '#fce070']); return; }
    if (kind === 'big' && flag('burg_bigkey')) { setF('burg_door_' + id); Audio8.sfx('unlock'); Audio8.sfx('chime'); popup(G.x, G.y - 30, tr('burgUnlock'), '#fce070'); burst(tx * TS + 8, ty * TS + 8, 14, ['#f8d048', '#fffbe0', '#c878f8']); return; }
    if (kind === 'shut') { G.msg = { k: 'burgShutNote', t: 160 }; return; }
    G.msg = { k: kind === 'big' ? 'burgBigLocked' : 'burgLocked', t: 160 }; Audio8.sfx('klack2');
  }
  function give(item) {
    if (item === 'key') Castle.flags.burg_keys = (Castle.flags.burg_keys || 0) + 1;
    else if (item === 'bigkey') setF('burg_bigkey');
    else if (item === 'kreisel') { W.player.sub = 'kreisel'; setF('sub_kreisel'); setF('burg_done'); }
  }
  function openChest(c) {
    setF('burg_c_' + c.id); give(c.item);
    G.reveal = { item: c.item, t: 0 }; Audio8.sfx('chest'); Audio8.sfx(c.item === 'kreisel' ? 'fanfare' : 'bigItem');
    burst(c.x * TS + 8, c.y * TS + 4, c.big ? 18 : 10, ['#fce070', '#fffbe8', '#f87878']);
  }

  // ---------------- Eingabe und Spiel ----------------
  function input(P, I) {
    if (!G) return false;
    G.t++; if (G.msg && --G.msg.t <= 0) G.msg = null;
    tickFx();
    if (G.trans) { if (++G.trans.t >= 26) G.trans = null; return false; }
    if (G.reveal) { G.reveal.t++; if (G.reveal.t > 40 && (P.jump || P.attack || P.up || P.start)) { Audio8.sfx('select'); G.reveal = null; } return false; }
    if (G.talk) {
      if (P.jump || P.attack || P.up || P.start) {
        Audio8.sfx('select');
        if (++G.talk.i >= G.talk.lines.length) { if (G.talk.give) { W.player.sub = 'kreisel'; Audio8.sfx('item'); popup(G.x, G.y - 34, tr('burgNeu'), '#fce070'); } G.talk = null; } // Kreisel verloren? Knacks hat immer noch einen
      }
      return false;
    }
    if (G.inv > 0) G.inv--;
    if (G.lockT > 0) G.lockT--;
    if (G.swCool > 0) G.swCool--;
    const o = G.o;
    // Bällebad: versinken, an der Tür wieder auftauchen
    if (G.sink) {
      if (++G.sink > 44) { G.sink = 0; G.x = G.entry.x; G.y = G.entry.y; G.dir = G.entry.dir; G.inv = 0; hurt(1); if (!flag('burg_ball')) { setF('burg_ball'); G.msg = { k: 'burgBall', t: 220 }; } }
      return false;
    }
    // Figuren und Dinge
    for (const b of o.blocks) if (b.mt > 0) b.mt--;
    updSoldiers(); updTops();
    if (G.room === 'r1' && !flag('burg_r1') && o.buttons.length && o.buttons.every(u => o.blocks.some(b => b.x === u.x && b.y === u.y && b.mt === 0))) {
      setF('burg_r1'); Audio8.sfx('chime'); G.msg = { k: 'burgSolved', t: 200 };
      for (const c of o.chests) if (c.cond === 'burg_r1') burst(c.x * TS + 8, c.y * TS + 6, 16, ['#fcfcfc', '#d8d0e8', '#fce070']);
    }
    if (G.room === 'r2' && !flag('burg_r2') && o.sol.length === 0) { setF('burg_r2'); Audio8.sfx('chime'); Audio8.sfx('creak'); G.msg = { k: 'burgShutOpen', t: 200 }; }
    // Rückstoß nach einem Treffer
    if (G.kb) { const ign = underHero(); if (boxFree(G.x + G.kb.x, G.y, ign)) G.x += G.kb.x; if (boxFree(G.x, G.y + G.kb.y, ign)) G.y += G.kb.y; G.kb.x *= 0.82; G.kb.y *= 0.82; if (--G.kb.t <= 0) G.kb = null; }
    // ↑ / Angriff vor Truhe oder Knacks
    if (P.up || P.attack || P.jump) {
      for (const c of o.chests) {
        if (!present(c) || flag('burg_c_' + c.id)) continue;
        if (G.dir === 0 && Math.abs(G.x - (c.x * TS + 8)) < (c.big ? 13 : 10) && Math.abs(G.y - ((c.y + 1) * TS + 8)) < 9) { openChest(c); return false; }
      }
      if (o.npc && (P.up || P.attack) && near(o.npc.x * TS + 8, o.npc.y * TS + 8, 26)) {
        const k = flag('burg_done') ? 'burgKnacks3' : flag('burg_door_a') || flag('burg_r2') ? 'burgKnacks2' : 'burgKnacks1';
        G.talk = { lines: trList(k), i: 0, give: k === 'burgKnacks3' && W.player.sub !== 'kreisel' }; Audio8.sfx('select'); return false;
      }
    }
    // Peitsche
    if (P.attack && !G.whip) { G.whip = { t: 0, d: G.dir, hit: new Set() }; Audio8.sfx('whip'); }
    if (G.whip) { const w = G.whip; w.t++; if (w.t >= 3 && w.t <= 10) whipHit(w); if (w.t > 15) G.whip = null; }
    // Laufen (während des Hiebs steht der Held)
    const mx = G.whip ? 0 : (I.right ? 1 : 0) - (I.left ? 1 : 0), my = G.whip ? 0 : (I.down ? 1 : 0) - (I.up ? 1 : 0);
    const sp = 1.2 / (mx && my ? 1.41 : 1), ign = underHero();
    G.mv = !!(mx || my); if (G.mv) { G.step += sp; G.dir = my > 0 ? 2 : my < 0 ? 0 : mx > 0 ? 1 : 3; }
    let pushed = false;
    if (mx) {
      const nx = G.x + mx * sp;
      if (boxFree(nx, G.y, ign)) G.x = nx;
      else if (!my) { pushed = against(mx, 0); if (!pushed) slide(0, mx, ign); }
    }
    if (my) {
      const ny = G.y + my * sp;
      if (boxFree(G.x, ny, ign)) G.y = ny;
      else if (!mx) { pushed = against(0, my); if (!pushed) slide(my, 0, ign); }
    }
    if (!pushed) { G.push = 0; G.pushDir = -1; }
    // Türen hinaus
    if (G.y < 7) return leave('n'), false;
    if (G.y > FH - 6) return leave('s'), false;
    if (G.x < 7) return leave('w'), false;
    if (G.x > IW - 7) return leave('e'), false;
    // Bällebad, Spieluhr
    if (tileAt(Math.floor(G.x / TS), Math.floor(G.y / TS)) === '~' && !G.kb) { G.sink = 1; Audio8.sfx('splash'); burst(G.x, G.y - 2, 12, ['#f85858', '#58a8f8', '#f8d848', '#68d868', '#f8f8f8'], 1.8); return false; }
    if (o.pad && flag('burg_done') && Math.floor(G.x / TS) === o.pad.x && Math.floor(G.y / TS) === o.pad.y) { Audio8.sfx('teleport'); exit(); return false; }
    return false;
  }
  function against(dx, dy) { // gegen Klotz oder Tür: Klotz schieben (nach kurzem Drücken), Tür aufschließen
    const tx = Math.floor((G.x + dx * 8) / TS), ty = Math.floor((G.y + (dy > 0 ? 6 : dy < 0 ? -8 : 0)) / TS);
    if (tileAt(tx, ty) === 'D') { tryDoor(tx, ty); return false; }
    const b = blockAt(tx, ty); if (!b || b.mt > 0) return false;
    const aligned = dx ? Math.abs(G.y - (ty * TS + 9)) <= 6 : Math.abs(G.x - (tx * TS + 8)) <= 6; if (!aligned) return false;
    const d = dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0;
    if (G.pushDir !== d) { G.pushDir = d; G.push = 0; }
    if (++G.push > 14) { G.push = 0; tryPush(b, dx, dy); }
    return true;
  }
  function slide(ax, ay, ign) { // um Ecken gleiten: knapp neben einer Öffnung schiebt sich der Held hinein
    for (let s = 1; s <= 7; s++) for (const sg of [-1, 1]) {
      const ox = ax ? sg * s : 0, oy = ay ? sg * s : 0;
      if (boxFree(G.x + ox + ay * 1.5, G.y + oy + ax * 1.5, ign) && boxFree(G.x + ox, G.y + oy, ign)) { G.x += ox ? sg * 0.8 : 0; G.y += oy ? sg * 0.8 : 0; return; }
    }
  }
  function whipBox(w) {
    const L = 32 * Math.min(1, w.t / 5), [dx, dy] = DIRS[w.d], ox = G.x, oy = G.y - 9;
    if (dx) return { x: Math.min(ox, ox + dx * L), y: oy - 6, w: L, h: 12 };
    return { x: ox - 6, y: dy < 0 ? oy - L : oy, w: 12, h: L };
  }
  const inBox = (b, x, y, r) => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h;
  function whipHit(w) {
    const bx = whipBox(w), [dx, dy] = DIRS[w.d];
    for (const s of G.o.sol) {
      if (s.fall || w.hit.has(s) || !inBox(bx, s.x, s.y - 7, 7)) continue;
      w.hit.add(s); s.hp--; s.hitT = 18; s.kx = dx * 2.6; s.ky = dy * 2.6; Audio8.sfx('hit'); burst(s.x, s.y - 10, 6, ['#fcfcfc', '#f8d048']);
      if (s.hp <= 0) { s.fall = 1; Audio8.sfx('cog'); burst(s.x, s.y - 8, 10, ['#c8ccd8', '#f8d048', '#e83c3c']); }
    }
    for (const k of G.o.tops) {
      if (w.hit.has(k) || !inBox(bx, k.x, k.y - 4, 6)) continue;
      w.hit.add(k); if (dx) k.vx = dx * Math.abs(k.vx); if (dy) k.vy = dy * Math.abs(k.vy); Audio8.sfx('tink'); burst(k.x, k.y - 4, 5, ['#fcfcfc', '#fce070']);
    }
    for (const s of G.o.sw) {
      if (G.swCool > 0 || w.hit.has(s) || !inBox(bx, s.x * TS + 8, s.y * TS + 2, 8)) continue;
      w.hit.add(s); G.peg ^= 1; G.swCool = 30; s.hit = 16; Audio8.sfx('klack'); Audio8.sfx('ding');
      burst(s.x * TS + 8, s.y * TS - 2, 10, G.peg ? ['#58a8f8', '#c8e4fc'] : ['#f85858', '#fcc8c8']);
    }
  }
  function blockedFor(px, py) { const tx = Math.floor(px / TS), ty = Math.floor(py / TS); return wallish(tx, ty) || tileAt(tx, ty) === 'D' || solidObj(tx, ty); }
  function updSoldiers() {
    const o = G.o;
    for (const s of o.sol) {
      if (s.fall) { s.fall++; continue; }
      if (s.hitT > 0) { s.hitT--; if (!blockedFor(s.x + s.kx * 3, s.y)) s.x += s.kx; if (!blockedFor(s.x, s.y + s.ky * 3)) s.y += s.ky; s.kx *= 0.8; s.ky *= 0.8; continue; }
      const vx = s.ax === 'h' ? s.d * 0.6 : 0, vy = s.ax === 'v' ? s.d * 0.6 : 0;
      const pegHit = (px, py) => o.pegs.some(p => p.x === Math.floor(px / TS) && p.y === Math.floor(py / TS) && pegUp(p));
      const ax = s.x + vx + Math.sign(vx) * 7, ay = s.y + vy + Math.sign(vy) * 7;
      if (blockedFor(ax, ay) || tileAt(Math.floor(ax / TS), Math.floor(ay / TS)) === '~' || pegHit(ax, ay)) s.d = -s.d; else { s.x += vx; s.y += vy; }
      s.f += 0.6;
      if (G.inv <= 0 && Math.hypot(s.x - G.x, s.y - G.y) < 11) hurt(2, s.x, s.y);
    }
    o.sol = o.sol.filter(s => !(s.fall > 64));
  }
  function updTops() {
    for (const k of G.o.tops) {
      k.ph += 0.55;
      if (blockedFor(k.x + k.vx + Math.sign(k.vx) * 5, k.y)) { k.vx = -k.vx; if (G.t % 3 === 0) Audio8.sfx('tink'); } else k.x += k.vx;
      if (blockedFor(k.x, k.y + k.vy + Math.sign(k.vy) * 4)) k.vy = -k.vy; else k.y += k.vy;
      if (G.inv <= 0 && Math.hypot(k.x - G.x, k.y - G.y) < 10) hurt(2, k.x, k.y);
    }
  }
  function tickFx() { for (const f of G.fx) { f.t++; f.x += f.vx; f.y += f.vy; if (!f.s) { f.vy += 0.06; f.vx *= 0.97; } } G.fx = G.fx.filter(f => f.t < f.life); }

  // ---------------- Zeichnen ----------------
  function drawRoom(ctx, id, ox, oy) {
    const m = ROOM_MAP[id];
    if (m && okImg(RIMG)) { ctx.drawImage(RIMG, m[0], m[1], m[2], m[3], Math.round(ox), Math.round(oy - CROWN), m[2], m[3]); return; }
    const rows = ROOMS[id].rows; // Ersatz, solange das Bild lädt
    rows.forEach((r, y) => [...r].forEach((c, x) => { ctx.fillStyle = c === '#' ? '#5c3c8c' : c === 'o' ? '#c8783c' : c === '~' ? '#e86c9c' : c === 'D' ? '#2c1c3c' : (x + y) % 2 ? '#e8d4a8' : '#dcc498'; ctx.fillRect(Math.round(ox + x * TS), Math.round(oy + y * TS), TS, TS); }));
  }
  function heroDraw(ctx, sx, sy) {
    if (G.inv > 0 && (G.t & 4) && !G.sink) return;
    if (G.sink) { // versinkt zwischen bunten Bällen
      const k = Math.min(1, G.sink / 26); ctx.save(); ctx.beginPath(); ctx.rect(sx - 20, sy - 40, 40, 40 - 4 - k * 26); ctx.clip(); Umland.heroAt(ctx, sx, sy - 7 + k * 26, G.dir, G.step, G.t, false); ctx.restore();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#f85858', '#58a8f8', '#f8d848', '#68d868', '#f8f8f8', '#c878f8'][i]; ctx.beginPath(); ctx.arc(sx - 9 + i * 3.6, sy - 3 + Math.sin(G.t * 0.3 + i) * 1.2, 2.2, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    Umland.heroAt(ctx, sx, sy - 7, G.dir, G.step, G.t, G.mv);
    if (G.reveal) { const it = { key: 'it_key', bigkey: 'it_bigkey', kreisel: 'it_kreisel' }[G.reveal.item]; if (!obj(ctx, it, sx - 8, sy - 50)) { ctx.fillStyle = '#fce070'; ctx.fillRect(sx - 4, sy - 46, 8, 8); } }
  }
  function drawWhip(ctx, ox, oy) {
    const w = G.whip; if (!w) return;
    const L = 32 * Math.min(1, w.t / 5) * (w.t > 11 ? Math.max(0, (16 - w.t) / 5) : 1), [dx, dy] = DIRS[w.d], hx = ox + G.x + dx * 4, hy = oy + G.y - 9 + (dy > 0 ? 2 : 0);
    ctx.save(); ctx.lineCap = 'round';
    for (const [lw, col] of [[3, '#3c2414'], [1.4, '#a8783c']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(hx, hy); for (let i = 1; i <= 6; i++) { const t = i / 6, wob = Math.sin(t * 3 + w.t) * 1.5 * (1 - t); ctx.lineTo(hx + dx * L * t - dy * wob, hy + dy * L * t + dx * wob); } ctx.stroke(); }
    ctx.fillStyle = '#fce070'; ctx.fillRect(Math.round(hx + dx * L) - 1, Math.round(hy + dy * L) - 1, 3, 3);
    ctx.restore();
  }
  function scene(ctx, ox, oy) { // Dinge und Figuren eines Raums, nach Tiefe sortiert
    const o = G.o, L = [], tp = (tx, ty) => [ox + tx * TS, oy + ty * TS], R = ROOMS[G.room];
    for (const u of o.buttons) { const [px, py] = tp(u.x, u.y), down = o.blocks.some(b => b.x === u.x && b.y === u.y && b.mt === 0); if (!obj(ctx, down ? 'btn1' : 'btn0', px, py)) { ctx.fillStyle = down ? '#8c2c2c' : '#e84c3c'; ctx.fillRect(px + 4, py + 4, 8, 8); } }
    for (const p of o.pegs) if (!pegUp(p)) { const [px, py] = tp(p.x, p.y); obj(ctx, p.c === 'r' ? 'pr0' : 'pb0', px, py); }
    if (o.pad) { const [px, py] = tp(o.pad.x, o.pad.y); obj(ctx, flag('burg_done') ? 'pad1' : 'pad0', px, py); if (flag('burg_done')) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.2 * Math.sin(G.t * 0.1); ctx.fillStyle = '#fce8a8'; ctx.beginPath(); ctx.ellipse(px + 8, py + 8, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
    for (const p of o.pegs) if (pegUp(p)) L.push({ y: p.y * TS + 15, d: () => { const [px, py] = tp(p.x, p.y); if (!obj(ctx, p.c === 'r' ? 'pr1' : 'pb1', px, py)) { ctx.fillStyle = p.c === 'r' ? '#e83c3c' : '#3c7ce8'; ctx.fillRect(px + 3, py - 4, 10, 16); } } });
    for (const b of o.blocks) L.push({ y: b.y * TS + 15 - b.my * b.mt * 1.6, d: () => { const [px, py] = tp(b.x - b.mx * b.mt / 10, b.y - b.my * b.mt / 10); if (!obj(ctx, 'block' + b.v, px, py)) { ctx.fillStyle = '#e8b048'; ctx.fillRect(px + 1, py - 6, 14, 20); } } });
    for (const s of o.sw) L.push({ y: s.y * TS + 15, d: () => { const [px, py] = tp(s.x, s.y); obj(ctx, G.peg ? 'sw1' : 'sw0', px, py - (s.hit > 0 ? (s.hit--, 1) : 0)); } });
    for (const c of o.chests) if (present(c)) L.push({ y: c.y * TS + 15, d: () => { const [px, py] = tp(c.x, c.y), op = flag('burg_c_' + c.id); if (!obj(ctx, (c.big ? 'bc' : 'ch') + (op ? 1 : 0), px, py)) { ctx.fillStyle = '#a8642c'; ctx.fillRect(px + 2, py, 12, 12); } } });
    if (o.npc) L.push({ y: o.npc.y * TS + 15, d: () => { const [px, py] = tp(o.npc.x, o.npc.y), talk = G.talk && (G.t >> 3) & 1; obj(ctx, talk ? 'npc1' : 'npc0', px, py); } });
    for (const s of o.sol) L.push({ y: s.y, d: () => {
      const px = ox + s.x - 8, py = oy + s.y - 10;
      if (s.fall) { obj(ctx, 'solx', px, py, s.fall > 40 ? Math.max(0, (64 - s.fall) / 24) : 1); return; }
      if (s.hitT > 0 && (s.hitT & 2)) return;
      const fr = Math.floor(s.f / 6) % 2, nm = s.ax === 'v' ? (s.d > 0 ? 'sold' : 'solu') : 'sols';
      if (s.ax !== 'v' && s.d < 0) { ctx.save(); ctx.translate(px * 2 + 16, 0); ctx.scale(-1, 1); obj(ctx, nm + fr, px, py); ctx.restore(); } else obj(ctx, nm + fr, px, py);
    } });
    for (const k of o.tops) L.push({ y: k.y, d: () => { const px = ox + k.x - 8, py = oy + k.y - 8; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px + 8, py + 9, 6, 2.4, 0, 0, Math.PI * 2); ctx.fill(); obj(ctx, 'top' + (Math.floor(k.ph) % 4), px, py - Math.abs(Math.sin(k.ph * 0.5)) * 0.8); } });
    L.push({ y: G.y, d: () => heroDraw(ctx, ox + G.x, oy + G.y) });
    for (const side of ['n', 's', 'w', 'e']) { // Türen: Schlüsselklotz, goldenes Schloss oder Gitter, solange sie zu sind
      const id = R.doors[side]; if (!id || doorOpen(id)) continue;
      const kind = DOORS[id], nm = (kind === 'lock' ? 'lock' : kind === 'big' ? 'big' : 'shut') + (side === 'n' || side === 's' ? 'N' : 'W');
      const [tx, ty] = side === 'n' ? [12, 0] : side === 's' ? [12, RH - 1] : side === 'w' ? [0, 5] : [RW - 1, 5];
      L.push({ y: (ty + (side === 's' ? 1 : side === 'n' ? 1 : 3)) * TS - 1, d: () => { const [px, py] = tp(tx, ty); if (!obj(ctx, nm, px, py)) { ctx.fillStyle = kind === 'big' ? '#e8b030' : '#8c5c2c'; ctx.fillRect(px, py, side === 'n' || side === 's' ? 32 : 16, side === 'n' || side === 's' ? 16 : 48); } } });
    }
    L.sort((a, b) => a.y - b.y).forEach(e => e.d());
    drawWhip(ctx, ox, oy);
  }
  function hud(ctx, vw) {
    const p = W.player, keys = Castle.flags.burg_keys || 0, nm = tr('burgR' + G.room.slice(1));
    ctx.fillStyle = 'rgba(8,4,14,0.92)'; ctx.fillRect(0, 0, vw, 12); ctx.fillStyle = '#c89020'; ctx.fillRect(0, 12, vw, 1);
    Font.draw(ctx, nm, 6, 2, '#fce0a8', { shadow: '#000' });
    const hx = vw - 150; ctx.fillStyle = '#2c0c14'; ctx.fillRect(hx, 3, 52, 6); ctx.fillStyle = '#e83c4c'; ctx.fillRect(hx, 3, Math.round(52 * Math.max(0, p.hp) / p.maxHp), 6); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(hx, 3, 52, 1);
    if (!obj(ctx, 'it_key', hx + 56, -2)) { ctx.fillStyle = '#c8ccd8'; ctx.fillRect(hx + 60, 3, 6, 6); }
    Font.draw(ctx, '×' + keys, hx + 72, 2, '#fcfcfc', { shadow: '#000' });
    if (flag('burg_bigkey')) obj(ctx, 'it_bigkey', hx + 86, -2);
    // Lageplan: besuchte Räume, der aktuelle blinkt
    const mx = vw - 36;
    for (const [k, R] of Object.entries(ROOMS)) {
      if (!flag('burg_v_' + k)) continue;
      const x = mx + R.gx * 10, y = 1 + R.gy * 4 - 0;
      ctx.fillStyle = k === G.room ? ((G.t >> 4) & 1 ? '#fce070' : '#f89838') : k === 'r5' ? '#c878f8' : '#6c5ca8'; ctx.fillRect(x, y, 9, 3);
    }
  }
  function box(ctx, vw, lines, title, tcol) {
    const h = lines.length * 10 + (title ? 22 : 10), y = 236 - h;
    ctx.fillStyle = 'rgba(8,4,12,0.92)'; ctx.fillRect(12, y, vw - 24, h); ctx.fillStyle = '#c89020'; ctx.fillRect(12, y, vw - 24, 1); ctx.fillRect(12, y + h - 1, vw - 24, 1);
    if (title) Font.draw(ctx, title, 20, y + 4, tcol, { shadow: '#000' });
    lines.forEach((l, i) => Font.draw(ctx, l, 20, y + (title ? 15 : 5) + i * 10, '#fcfcfc', { shadow: '#000' }));
  }
  function draw(ctx, t) {
    if (!G) return; ensure();
    const vw = View.w, vh = 240, cx = vw >= IW ? -Math.round((vw - IW) / 2) : Math.round(clamp(G.x - vw / 2, 0, IW - vw));
    ctx.fillStyle = '#0c0814'; ctx.fillRect(0, 0, vw, vh);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 13, vw, vh - 13); ctx.clip();
    if (G.trans) { // Bildwechsel wie beim Blättern: der alte Raum gleitet hinaus, der neue herein
      const k = G.trans.t / 26, e = k * k * (3 - 2 * k), { dx, dy } = G.trans, sx = dx * IW, sy = dy * (FH + 4);
      drawRoom(ctx, G.trans.from, -cx - sx * e, TOP - sy * e);
      drawRoom(ctx, G.room, -cx + sx * (1 - e), TOP + sy * (1 - e));
      heroDraw(ctx, -cx + sx * (1 - e) + G.x, TOP + sy * (1 - e) + G.y);
    } else {
      drawRoom(ctx, G.room, -cx, TOP);
      scene(ctx, -cx, TOP);
      for (const f of G.fx) { const a = Math.max(0, 1 - f.t / f.life); if (f.s) { const hw = Font.width(f.s) / 2 + 4; Font.draw(ctx, f.s, Math.round(clamp(f.x - cx, hw, vw - hw)), Math.round(f.y + TOP), f.c, { align: 'center', shadow: '#000' }); continue; } ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x - cx), Math.round(f.y + TOP), 2, 2); ctx.globalAlpha = 1; }
    }
    ctx.restore();
    if (!View.lite) { // Tilt-Shift wie über der Grafschaft: oben und unten weich, die Mitte scharf
      const c = G.tilt || (G.tilt = Sprites.canvas(vw, vh)), x = c.getContext('2d');
      if (c.width !== vw || c.height !== vh) { c.width = vw; c.height = vh; G.tiltG = null; }
      x.globalCompositeOperation = 'copy'; x.filter = 'blur(1.2px)'; x.drawImage(ctx.canvas, 0, 0, vw, vh, 0, 0, vw, vh); x.filter = 'none';
      x.globalCompositeOperation = 'destination-in'; if (!G.tiltG) { G.tiltG = x.createLinearGradient(0, 0, 0, vh); G.tiltG.addColorStop(0, 'rgba(0,0,0,0.9)'); G.tiltG.addColorStop(0.22, 'rgba(0,0,0,0)'); G.tiltG.addColorStop(0.8, 'rgba(0,0,0,0)'); G.tiltG.addColorStop(1, 'rgba(0,0,0,0.9)'); }
      x.fillStyle = G.tiltG; x.fillRect(0, 13, vw, vh - 13); x.globalCompositeOperation = 'source-over'; ctx.drawImage(c, 0, 0);
    }
    const vg = ctx.createRadialGradient(vw / 2, vh / 2 + 10, vh * 0.42, vw / 2, vh / 2 + 10, vw * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,4,20,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 13, vw, vh - 13);
    hud(ctx, vw);
    if (G.msg && !G.talk && !G.reveal) { const ls = Duell.wrap(tr(G.msg.k), vw - 44); box(ctx, vw, ls); }
    if (G.reveal) box(ctx, vw, Duell.wrap(tr({ key: 'burgKey', bigkey: 'burgBigKey', kreisel: 'burgKreisel' }[G.reveal.item]), vw - 44), tr('burgFund'), '#fce070');
    if (G.talk) {
      const raw = G.talk.lines[G.talk.i] || '', who = raw[1] === ':' ? raw[0] : 'K', txt = raw[1] === ':' ? raw.slice(2) : raw;
      box(ctx, vw, Duell.wrap(txt, vw - 44), who === 'H' ? tr('umlandDu') : tr('npcKnacks'), who === 'H' ? '#a4e4fc' : '#f8a868');
    }
  }
  // Testhilfe: in einen Raum springen
  function warp(id, x, y) { load(id); G.x = x; G.y = y; G.entry = { x, y, dir: G.dir }; G.trans = null; }
  return { start, input, draw, exit, warp, tryPush, ROOMS, DOORS, TS, RW, RH, IW, FH, get game() { return G; } };
})();
