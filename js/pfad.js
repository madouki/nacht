// Die Mondinsel (Gleis 3 im Bahnhof Krat, Spielzustand 'pfad'): eine Wegkarte wie in einem Jump'n'Run-Abenteuer. Der Held läuft
// auf festen Wegen von Levelpunkt zu Levelpunkt; erst wenn eine Strecke geschafft ist, legt sich der nächste Weg Punkt für Punkt
// frei. Rote Punkte haben einen geheimen Ausgang: Wer den Schlüssel zum Schlüsselloch trägt, öffnet einen verborgenen Weg – über
// die Sternenbrücke zum Glockenhaus. Dessen Glocke macht auf der ganzen Insel die Umrissblöcke fest. Am Ende wartet die Mondfeste.
// Jede Strecke (Seitenansicht, castle.js pfad_*) hat fünf Mondtaler, eine Zwischenglocke (dort geht es beim nächsten Versuch weiter)
// und am Ende die Zielschranke: Je höher man den wandernden Balken trifft, desto größer der Bonus.
// Bild: tools/blender/pfad_bl.py (Insel-Diorama, 16 px je Kachel) → img/pfad3d.png; Wege, Punkte und Held zeichnet das Spiel.
'use strict';
const Pfad = (() => {
  const TS = 16, MW = 30, MH = 17;
  // Levelpunkte (Kacheln): Art, Raum, Name; red = hat einen geheimen Ausgang
  const NODES = {
    A: { x: 3, y: 11, kind: 'anleger', name: 'pfadA' },
    L1: { x: 7, y: 9, room: 'pfad_1', name: 'pfadL1' },
    L2: { x: 12, y: 6, room: 'pfad_2', name: 'pfadL2', red: true },
    L3: { x: 17, y: 9, room: 'pfad_3', name: 'pfadL3' },
    L4: { x: 22, y: 12, room: 'pfad_4', name: 'pfadL4' },
    S: { x: 13, y: 1, room: 'pfad_s', name: 'pfadS' },
    G: { x: 19, y: 1, room: 'pfad_g', name: 'pfadG', kind: 'glocke' },
    F: { x: 26, y: 7, room: 'pfad_f', name: 'pfadF', kind: 'feste' },
  };
  const COURSES = ['L1', 'L2', 'L3', 'L4', 'S', 'F'];
  const fl = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const done = (n) => !!fl()['pfad_' + n], secret = (n) => !!fl()['pfad_' + n + '_g'];
  // Wege: von, nach, offen wenn …, Eckpunkte (Kacheln)
  const EDGES = [
    ['A', 'L1', () => true, [[3, 11], [5, 11], [5, 9], [7, 9]]],
    ['L1', 'L2', () => done('L1'), [[7, 9], [10, 9], [10, 6], [12, 6]]],
    ['L2', 'L3', () => done('L2'), [[12, 6], [15, 6], [15, 9], [17, 9]]],
    ['L2', 'S', () => secret('L2'), [[12, 6], [12, 4], [13, 4], [13, 1]]],
    ['S', 'G', () => done('S'), [[13, 1], [19, 1]]],
    ['L3', 'L4', () => done('L3'), [[17, 9], [17, 12], [22, 12]]],
    ['L4', 'F', () => done('L4'), [[22, 12], [24, 12], [24, 7], [26, 7]]],
  ];
  const IMG = new Image(); let pre = null, G = null, FX = null;
  const ready = () => IMG.complete && IMG.naturalWidth > 0;
  const px = (t) => t * TS + 8;
  function ensure() {
    if (!IMG.src) IMG.src = 'img/pfad3d.png?v=' + (window.BUILD || '');
    if (!pre && ready()) { pre = Sprites.canvas(MW * TS, MH * TS); pre.getContext('2d').drawImage(IMG, 0, 0, MW * TS, MH * TS); }
  }
  const openSet = () => EDGES.filter(e => e[2]()).map(e => e[0] + '-' + e[1]);
  // ---------------- Wegkarte ----------------
  function start() { // mit dem Zug von Gleis 3
    ensure(); const a = NODES.A;
    G = { at: 'A', x: px(a.x), y: px(a.y), dir: 2, step: 0, walk: null, t: 0, msg: null, seen: new Set(openSet()), reveal: [], course: null, mv: false };
    Audio8.sfx('door'); Audio8.play('insel', null, 0.6); Game.go('pfad');
    if (!fl().pfad_seen) { Castle.setFlag('pfad_seen'); G.msg = { k: 'pfadHilfe', t: 320 }; }
  }
  function back(kind) { // aus einer Strecke zurück auf die Karte (kind: 'ziel', 'geheim' oder null = abgebrochen)
    if (!G) return start();
    const n = G.course; G.course = null; G.walk = null; G.mv = false;
    if (n && kind === 'ziel' && !done(n)) Castle.setFlag('pfad_' + n);
    if (n && kind === 'geheim' && !secret(n)) Castle.setFlag('pfad_' + n + '_g');
    if (n && kind) { Castle.setFlag('pfad_' + n + '_mid', 0); }
    const now = openSet(); G.reveal = now.filter(k => !G.seen.has(k)).map(k => ({ k, t: 0 })); now.forEach(k => G.seen.add(k));
    if (G.reveal.length) G.msg = { k: 'pfadNeu', t: 160 };
    Audio8.play('insel', null, 0.5); Game.go('pfad');
  }
  function enter(n) {
    const d = NODES[n];
    if (d.kind === 'anleger') { pendingStation = true; const f = Castle.side.bahnhof; Game.castleGo({ s: f.s, r: f.r, place: 'start' }); return; }
    const f = Castle.side[d.room]; if (!f) return;
    G.course = n; Audio8.sfx('select'); Game.castleGo({ s: f.s, r: f.r, place: 'start' });
  }
  function input(P, I) {
    if (!G) return true;
    G.t++; if (G.msg && --G.msg.t <= 0) G.msg = null;
    for (const r of G.reveal) r.t++;
    if (G.reveal.some(r => r.t < 70)) return false; // erst den neuen Weg zeichnen lassen
    if (G.walk) { // auf dem Weg: Eckpunkt für Eckpunkt
      const w = G.walk, tgt = w.pts[w.i], tx = px(tgt[0]), ty = px(tgt[1]), dx = tx - G.x, dy = ty - G.y, d = Math.hypot(dx, dy), v = 1.7;
      G.mv = true; G.step += v;
      if (Math.abs(dx) > Math.abs(dy)) G.dir = dx > 0 ? 1 : 3; else if (d > 0.1) G.dir = dy > 0 ? 2 : 0;
      if (d <= v) { G.x = tx; G.y = ty; if (++w.i >= w.pts.length) { G.at = w.to; G.walk = null; G.mv = false; Audio8.sfx('step'); } }
      else { G.x += dx / d * v; G.y += dy / d * v; }
      return false;
    }
    G.mv = false;
    const want = I.left ? [-1, 0] : I.right ? [1, 0] : I.up ? [0, -1] : I.down ? [0, 1] : null; // gehalten: läuft los, sobald ein offener Weg in diese Richtung führt
    if (want) for (const e of EDGES) {
      if (!e[2]()) continue;
      let pts = null, to = null;
      if (e[0] === G.at) { pts = e[3]; to = e[1]; } else if (e[1] === G.at) { pts = e[3].slice().reverse(); to = e[0]; } else continue;
      const sx = Math.sign(pts[1][0] - pts[0][0]), sy = Math.sign(pts[1][1] - pts[0][1]);
      if (sx === want[0] && sy === want[1]) { G.walk = { pts: pts.slice(1), i: 0, to }; Audio8.sfx('select'); return false; }
    }
    if ((P.jump || P.attack || (P.up && NODES[G.at].kind === 'anleger')) && NODES[G.at]) enter(G.at);
    return false;
  }
  const taler = (n) => [0, 1, 2, 3, 4].filter(i => fl()['pfad_' + n + '_t' + i]).length;
  function node(ctx, n, t) {
    const d = NODES[n], x = px(d.x), y = px(d.y), open = n === 'A' || EDGES.some(e => e[2]() && (e[0] === n || e[1] === n)) || done(n);
    if (!open) return;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'anleger') { // kleines Zugsymbol: hier geht es zurück zum Bahnhof
      ctx.fillStyle = '#20141c'; ctx.fillRect(x - 7, y - 6, 14, 10); ctx.fillStyle = '#3c7ab8'; ctx.fillRect(x - 6, y - 5, 12, 7); ctx.fillStyle = '#fcd870'; ctx.fillRect(x - 4, y - 4, 3, 3); ctx.fillRect(x + 1, y - 4, 3, 3);
      ctx.fillStyle = '#20141c'; ctx.fillRect(x - 5, y + 2, 3, 2); ctx.fillRect(x + 2, y + 2, 3, 2); return;
    }
    const c = d.kind === 'glocke' ? (fl().pfad_glocke ? '#f8d040' : '#c8c8d8') : d.kind === 'feste' ? '#a060e8' : d.red ? '#e8403c' : '#f8c838';
    ctx.fillStyle = '#20141c'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y - 0.5, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - 2, y - 2.5, 2, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'glocke') { ctx.fillStyle = '#5c3c10'; ctx.fillRect(x - 2, y - 3, 4, 4); ctx.fillRect(x - 3, y + 1, 6, 1); }
    if (d.kind === 'feste') { ctx.fillStyle = '#2c1440'; ctx.fillRect(x - 3, y - 3, 6, 5); ctx.fillRect(x - 3, y - 5, 2, 2); ctx.fillRect(x + 1, y - 5, 2, 2); }
    if (done(n) || secret(n)) { ctx.fillStyle = '#58f898'; ctx.fillRect(x + 4, y - 8, 4, 4); ctx.fillStyle = '#20141c'; ctx.fillRect(x + 5, y - 7, 2, 2); } // geschafft
    if (COURSES.includes(n) && taler(n) === 5) { const k = (t >> 3) & 1; ctx.fillStyle = k ? '#fcf4a0' : '#f8c838'; ctx.fillRect(x - 1, y - 12, 2, 2); ctx.fillRect(x - 3, y - 11, 6, 1); } // alle Mondtaler
  }
  function path(ctx, e, frac) {
    const pts = e[3].map(p => [px(p[0]), px(p[1])]); let total = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(L); total += L; }
    const upto = total * frac;
    for (let d = 6, i = 0, acc = 0; d < total - 4 && d <= upto; d += 7) {
      while (i < seg.length - 1 && d > acc + seg[i]) { acc += seg[i]; i++; }
      const k = (d - acc) / seg[i], x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
      ctx.fillStyle = '#20141c'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 3); ctx.fillStyle = e[0] === 'S' || e[1] === 'S' || e[1] === 'G' ? '#a8e4fc' : '#fce8b0'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  }
  function draw(ctx, t) {
    if (!G) return; ensure();
    const vw = View.w, vh = 240, cx = Math.round(clamp(G.x - vw / 2, 0, Math.max(0, MW * TS - vw))), cy = Math.round(clamp(G.y - vh / 2, 0, MH * TS - vh));
    ctx.fillStyle = '#0c1430'; ctx.fillRect(0, 0, vw, vh);
    if (pre) ctx.drawImage(pre, cx, cy, Math.min(vw, MW * TS), vh, 0, 0, Math.min(vw, MW * TS), vh);
    else { ctx.fillStyle = '#16305c'; ctx.fillRect(0, 0, vw, vh); }
    ctx.save(); ctx.translate(-cx, -cy);
    for (const e of EDGES) { if (!e[2]()) continue; const r = G.reveal.find(r => r.k === e[0] + '-' + e[1]); path(ctx, e, r ? clamp(r.t / 70, 0, 1) : 1); if (r && r.t < 70 && r.t % 7 === 0) Audio8.sfx('tick'); }
    for (const n of Object.keys(NODES)) node(ctx, n, t);
    if (FX) for (const f of FX.flies) { const x = f.x + Math.sin(t * 0.02 * f.q + f.p) * 6, y = f.y + Math.cos(t * 0.017 * f.q + f.p * 2) * 4, a = Math.sin(t * 0.045 * f.q + f.p); if (a <= 0) continue; ctx.globalAlpha = a; ctx.fillStyle = '#e8ffb0'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.globalAlpha = a * 0.35; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
    ctx.globalAlpha = 1;
    Umland.heroAt(ctx, G.x, G.y - 2, G.dir, G.step, t, G.mv);
    ctx.restore();
    // Tilt-Shift wie auf der Oberwelt
    const c = Pfad.tilt || (Pfad.tilt = Sprites.canvas(vw, vh)), x = c.getContext('2d');
    if (c.width !== vw) c.width = vw;
    x.globalCompositeOperation = 'copy'; x.filter = 'blur(1.4px)'; x.drawImage(ctx.canvas, 0, 0, vw, vh, 0, 0, vw, vh); x.filter = 'none';
    x.globalCompositeOperation = 'destination-in'; const g = x.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#000'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, vw, vh); x.globalCompositeOperation = 'source-over'; ctx.drawImage(c, 0, 0);
    const vg = ctx.createRadialGradient(vw / 2, vh / 2, vh * 0.45, vw / 2, vh / 2, vw * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
    // Anzeigen: Titel, Name des Punkts, Mondtaler
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(4, 4, Font.width(tr('pfadTitel')) + 10, 13); ctx.fillStyle = '#58a8f8'; ctx.fillRect(4, 16, Font.width(tr('pfadTitel')) + 10, 1);
    Font.draw(ctx, tr('pfadTitel'), 9, 7, '#d8ecfc', { shadow: '#000' });
    const all = COURSES.reduce((n, k) => n + taler(k), 0), ts = tr('pfadTalerAlle', all, COURSES.length * 5);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(vw - Font.width(ts) - 14, 4, Font.width(ts) + 10, 13); Font.draw(ctx, ts, vw - 9, 7, '#f8d040', { align: 'right', shadow: '#000' });
    if (!G.walk && G.at) {
      const d = NODES[G.at], nm = tr(d.name), sub = d.kind === 'anleger' ? tr('pfadZug') : COURSES.includes(G.at) ? tr('pfadBetreten') + '   ' + tr('pfadTaler', taler(G.at)) : tr('pfadBetreten'), w = Math.max(Font.width(nm), Font.width(sub)) + 14;
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(Math.round(vw / 2 - w / 2), 196, w, 24); ctx.fillStyle = '#58a8f8'; ctx.fillRect(Math.round(vw / 2 - w / 2), 196, w, 1);
      Font.draw(ctx, nm, vw / 2, 200, '#d8ecfc', { align: 'center', shadow: '#000' }); Font.draw(ctx, sub, vw / 2, 210, (t >> 4) & 1 ? '#fcfcfc' : '#a0b4c8', { align: 'center', shadow: '#000' });
    }
    if (G.msg) { const ls = Duell.wrap(tr(G.msg.k), vw - 40); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(14, 150, vw - 28, ls.length * 10 + 8); ls.forEach((l, i) => Font.draw(ctx, l, vw / 2, 155 + i * 10, '#d8ecfc', { align: 'center', shadow: '#000' })); }
  }
  function fxInit() { let s = 17; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, flies = []; for (let i = 0; i < 40; i++) flies.push({ x: r() * MW * TS, y: r() * MH * TS, p: r() * 6.28, q: 0.6 + r() * 0.8 }); FX = { flies }; }
  fxInit();

  // ---------------- Bahnhof: Gleis 3 ----------------
  let pendingStation = false;
  class Fahrt extends Ent { // Schild am Bahnsteig: GLEIS 3 – MONDINSEL
    constructor(d) { super(d.x * T - 16, (d.y + 1) * T - 40, 48, 40); this.kind = 'prop'; }
    update() {
      this.t++; const p = W.player;
      if (this.t === 2 && pendingStation) { pendingStation = false; p.x = this.cx - p.w / 2; p.y = this.y + this.h - p.h; p.vx = p.vy = 0; }
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 26 || Math.abs(p.feet - (this.y + this.h)) > 4 || Game.state !== 'play' || W.arenaOn) return;
      pzSay('pfadEinsteigen'); if (Input.pressed.up) start();
    }
    draw(ctx) {
      const sx = Math.round(this.cx - W.cam.x), sy = Math.round(this.y - W.cam.y); if (sx < -40 || sx > View.w + 40) return;
      ctx.fillStyle = '#3c2c1c'; ctx.fillRect(sx - 1, sy + 8, 3, 32); const lab = tr('pfadGleis'), w = Font.width(lab) + 10;
      ctx.fillStyle = '#1c4c6c'; ctx.fillRect(sx - w / 2, sy, w, 11); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(sx - w / 2, sy, w, 1); ctx.fillRect(sx - w / 2, sy + 10, w, 1);
      Font.draw(ctx, lab, sx, sy + 2, '#fcfcfc', { align: 'center' });
    }
  }

  // ---------------- Strecken: Start, Mondtaler, Zwischenglocke, Zielschranke, Schlüssel, Schlüsselloch, Umrissblöcke ----------------
  const course = () => (G && G.course) || null;
  class Start extends Ent { // unsichtbar: setzt an die Zwischenglocke, linker Rand führt zurück auf die Karte
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.n = d.n; }
    update() {
      this.t++; const p = W.player;
      if (this.t === 2 && G && !G.course) G.course = this.n; // (Test oder Fortsetzung: Strecke trotzdem kennen)
      if (this.t === 3 && fl()['pfad_' + this.n + '_mid']) { const b = W.ents.find(e => e instanceof Glocke); if (b) { p.x = b.cx - p.w / 2 + 12; p.y = b.y + b.h - p.h; p.vx = p.vy = 0; W.cam.x = clamp(p.cx - View.w / 2, 0, W.room.w * T - View.w); } }
      if (this.t === 4 && !fl().pfad_kurs) { Castle.setFlag('pfad_kurs'); Game.note('pfadKurs'); }
      if (Game.state === 'play' && p.alive && this.t > 20 && p.x < 3 && !W.cleared) back(null);
    }
    draw() {}
  }
  class Taler extends Ent { // großer Mondtaler
    constructor(d) { super(d.x * T, d.y * T, 16, 20); this.kind = 'prop'; this.i = d.i; this.n = d.n; this.got = !!fl()['pfad_' + this.n + '_t' + this.i]; }
    update() {
      this.t++; const p = W.player;
      if (!this.got && p.alive && Phys.overlap(this, p)) {
        this.got = true; Castle.setFlag('pfad_' + this.n + '_t' + this.i); W.addScore(500, this.cx, this.y);
        const k = [0, 1, 2, 3, 4].filter(i => fl()['pfad_' + this.n + '_t' + i]).length;
        W.popup(this.cx, this.y - 6, tr('pfadTaler', k), '#f8d040'); Audio8.sfx(k === 5 ? 'fanfare' : 'coin');
        for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.4, 1.4), rnd(-2, 0), i % 2 ? '#f8d040' : '#fcf4c0', 30, 1, 0.08));
      }
    }
    lightUp(L, cx, cy) { if (!this.got) L.push({ x: this.cx - cx, y: this.cy - cy, r: 18, c: [255, 220, 120], a: 0.25 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y + Math.sin(this.t * 0.08) * 2), w = Math.abs(Math.cos(this.t * 0.06)) * 7 + 1;
      ctx.globalAlpha = this.got ? 0.25 : 1;
      ctx.fillStyle = '#5c3c08'; ctx.beginPath(); ctx.ellipse(x, y, w + 1, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8c838'; ctx.beginPath(); ctx.ellipse(x, y, w, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (w > 3) { ctx.fillStyle = '#fcf0a0'; ctx.beginPath(); ctx.arc(x - w * 0.15, y, w * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f8c838'; ctx.beginPath(); ctx.arc(x + w * 0.1, y - 1, w * 0.5, 0, Math.PI * 2); ctx.fill(); } // Mondsichel
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - Math.round(w * 0.5), y - 6, 1, 3);
      ctx.globalAlpha = 1;
    }
  }
  class Glocke extends Ent { // Zwischenglocke auf einem Pfahl: heilt und merkt sich die Stelle
    constructor(d) { super(d.x * T, (d.y + 1) * T - 40, 16, 40); this.kind = 'prop'; this.n = d.n; this.rung = !!fl()['pfad_' + this.n + '_mid']; this.sw = 0; }
    update() {
      this.t++; const p = W.player; this.sw *= 0.96;
      if (!this.rung && p.alive && Phys.overlap(this, p)) {
        this.rung = true; this.sw = 1; Castle.setFlag('pfad_' + this.n + '_mid'); p.hp = p.maxHp; Audio8.sfx('bell'); W.popup(this.cx, this.y - 8, tr('pfadMitte'), '#a8e4fc');
        for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.y + 8, rnd(-1.2, 1.2), rnd(-1.6, -0.2), '#a8e4fc', 30, 1, 0.04));
      }
    }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.y - W.cam.y), a = Math.sin(this.t * 0.3) * this.sw * 0.6;
      ctx.fillStyle = '#3c2c1c'; ctx.fillRect(x - 1, y + 8, 3, 32); ctx.fillRect(x - 6, y + 6, 13, 2);
      ctx.save(); ctx.translate(x, y + 8); ctx.rotate(a);
      ctx.fillStyle = this.rung ? '#f8d040' : '#a8a8b8'; ctx.beginPath(); ctx.moveTo(-5, 10); ctx.quadraticCurveTo(-5, 1, 0, 1); ctx.quadraticCurveTo(5, 1, 5, 10); ctx.fill();
      ctx.fillStyle = this.rung ? '#fcf4a0' : '#d8d8e4'; ctx.fillRect(-4, 4, 1, 5); ctx.fillStyle = '#5c3c10'; ctx.fillRect(-1, 10, 2, 2); ctx.restore();
    }
  }
  class Ziel extends Ent { // Zielschranke: zwei Pfosten, dazwischen wandert ein Balken auf und ab
    constructor(d) { super(d.x * T, (d.y + 1) * T - 96, 40, 96); this.kind = 'prop'; this.n = d.n; this.phase = 0; this.hit = false; this.out = 0; this.gy = (d.y + 1) * T; }
    get barY() { return this.gy - 12 - (0.5 + 0.5 * Math.sin(this.t * 0.045)) * 76; }
    update() {
      this.t++; const p = W.player;
      if (this.out) { // Siegesgang: der Held läuft weiter, dann zurück auf die Karte
        this.out++; p.vx = 1.2; p.face = 1; Input.setDemo(() => ({ right: true }));
        if (this.out === 2) { Audio8.play('fanfare'); W.cleared = true; }
        if (this.out > 120) { Input.setDemo(null); W.cleared = false; back(this.kind2 || 'ziel'); }
        return;
      }
      if (!p.alive || this.hit) return;
      const by = this.barY, bx = this.x + 6;
      if (p.x + p.w > bx && p.x < bx + 28 && p.y < by + 4 && p.feet > by - 2) { // Balken getroffen: Bonus nach Höhe
        const h = clamp((this.gy - by) / 88, 0, 1), bonus = Math.round(100 + h * 49) * 50; this.hit = true;
        W.addScore(bonus, this.cx, by); W.popup(this.cx, by - 8, tr('pfadBonus', bonus), '#f8d040'); Audio8.sfx('chime');
        for (let i = 0; i < 18; i++) W.spawn(new Particle(bx + 14, by, rnd(-2, 2), rnd(-2.4, 0), ['#f8d040', '#fcfcfc', '#a8e4fc'][i % 3], 40, 1, 0.08));
        this.finish();
      } else if (p.cx > this.x + 20) { this.hit = true; W.addScore(100, this.cx, this.gy - 20); this.finish(); }
    }
    finish() { this.out = 1; Game.note('pfadZiel'); if (this.n === 'F' && !fl().pfad_F) { W.addScore(10000); } }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), gy = Math.round(this.gy - W.cam.y), by = Math.round(this.barY - W.cam.y);
      for (const ox of [0, 34]) { ctx.fillStyle = '#20141c'; ctx.fillRect(x + ox, gy - 96, 6, 96); ctx.fillStyle = '#c8c8d8'; ctx.fillRect(x + ox + 1, gy - 95, 4, 95); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x + ox + 1, gy - 95, 1, 95); ctx.fillStyle = '#58a8f8'; for (let k = 0; k < 6; k++) ctx.fillRect(x + ox + 1, gy - 90 + k * 16, 4, 6); }
      if (!this.hit) { ctx.fillStyle = '#20141c'; ctx.fillRect(x + 5, by - 3, 30, 6); ctx.fillStyle = '#f8d040'; ctx.fillRect(x + 6, by - 2, 28, 4); ctx.fillStyle = '#fcf4a0'; ctx.fillRect(x + 6, by - 2, 28, 1); }
      ctx.fillStyle = '#f8d040'; ctx.beginPath(); ctx.arc(x + 3, gy - 99, 4, 0, Math.PI * 2); ctx.arc(x + 37, gy - 99, 4, 0, Math.PI * 2); ctx.fill(); // Mondkugeln
    }
  }
  class Schluessel extends Ent { // Schlüssel: wird aufgehoben und schwebt dann über dem Helden
    constructor(d) { super(d.x * T + 2, d.y * T + 2, 12, 12); this.kind = 'prop'; this.held = false; }
    update() {
      this.t++; const p = W.player;
      if (!this.held && p.alive && Phys.overlap(this, p)) { this.held = true; Audio8.sfx('key'); W.popup(p.cx, p.y - 10, tr('pfadSchluessel'), '#f8d040'); }
      if (this.held) { this.x += (p.cx - 6 - this.x) * 0.3; this.y += (p.y - 16 - this.y) * 0.3; }
    }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y + (this.held ? 0 : Math.sin(this.t * 0.1) * 2));
      ctx.fillStyle = '#5c3c08'; ctx.beginPath(); ctx.arc(x + 4, y + 4, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 6, y + 3, 7, 3); ctx.fillRect(x + 10, y + 5, 2, 4);
      ctx.fillStyle = '#f8c838'; ctx.beginPath(); ctx.arc(x + 4, y + 4, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 6, y + 4, 6, 1); ctx.fillRect(x + 10, y + 5, 1, 3);
      ctx.fillStyle = '#20141c'; ctx.fillRect(x + 3, y + 3, 2, 2);
    }
  }
  class Schloss extends Ent { // Schlüsselloch in einem Stein: mit Schlüssel → geheimer Ausgang
    constructor(d) { super(d.x * T, (d.y + 1) * T - 24, 16, 24); this.kind = 'prop'; this.n = d.n; this.open = 0; }
    update() {
      this.t++; const p = W.player, k = W.ents.find(e => e instanceof Schluessel && e.held);
      if (this.open) { this.open++; W.flash = Math.max(W.flash, this.open < 20 ? 6 : 0); if (this.open > 70) back('geheim'); return; }
      if (k && p.alive && Phys.overlap(this, p)) { this.open = 1; k.dead = true; Audio8.sfx('unlock'); Audio8.sfx('fanfare'); Game.note('pfadGeheim'); W.cleared = true; }
    }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
      ctx.fillStyle = '#3c3a48'; ctx.fillRect(x - 2, y, 20, 24); ctx.fillStyle = '#6c6a78'; ctx.fillRect(x - 1, y + 1, 18, 22); ctx.fillStyle = '#8c8a98'; ctx.fillRect(x - 1, y + 1, 18, 1);
      ctx.fillStyle = '#08040c'; ctx.beginPath(); ctx.arc(x + 8, y + 9, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 5, y + 20); ctx.lineTo(x + 8, y + 10); ctx.lineTo(x + 11, y + 20); ctx.fill();
      if (this.open) { const r = this.open * 6; ctx.globalAlpha = clamp(1 - this.open / 70, 0, 1); ctx.fillStyle = '#fcf4c0'; ctx.beginPath(); ctx.arc(x + 8, y + 12, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    }
  }
  class Umriss extends Ent { // Umrissblöcke: gestrichelt, bis die Glocke im Glockenhaus geläutet hat – dann feste Steine
    constructor(d) { super(d.x * T, d.y * T, (d.w || 2) * T, 8); this.kind = 'platform'; this.dx = 0; this.dy = 0; }
    get solid() { return !!fl().pfad_glocke; }
    update() { this.t++; }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), n = Math.round(this.w / T);
      for (let k = 0; k < n; k++) {
        const bx = x + k * T;
        if (this.solid) { ctx.fillStyle = '#20141c'; ctx.fillRect(bx, y, 16, 16); ctx.fillStyle = '#f8c838'; ctx.fillRect(bx + 1, y + 1, 14, 14); ctx.fillStyle = '#fcf0a0'; ctx.fillRect(bx + 1, y + 1, 14, 2); ctx.fillStyle = '#c89020'; ctx.fillRect(bx + 1, y + 13, 14, 2); ctx.fillStyle = '#5c3c08'; ctx.fillRect(bx + 7, y + 5, 2, 6); }
        else { ctx.fillStyle = (this.t >> 4) & 1 ? '#f8c838' : '#c89020'; for (let i = 0; i < 16; i += 4) { ctx.fillRect(bx + i, y, 2, 1); ctx.fillRect(bx + i, y + 15, 2, 1); ctx.fillRect(bx, y + i, 1, 2); ctx.fillRect(bx + 15, y + i, 1, 2); } }
      }
    }
  }
  class Riesenglocke extends Ent { // Glockenhaus: die große Glocke – ein Hieb, und die Umrissblöcke werden fest
    constructor(d) { super(d.x * T - 16, (d.y + 1) * T - 56, 40, 40); this.kind = 'enemy'; this.hp = 1; this.rung = !!fl().pfad_glocke; this.sw = 0; this.after = 0; }
    hit() {
      if (this.after) return false;
      this.sw = 1; Audio8.sfx('bell'); W.shake = Math.max(W.shake, 8);
      if (!fl().pfad_glocke) { Castle.setFlag('pfad_glocke'); Game.note('pfadGlocke'); }
      this.after = 1; return true;
    }
    update() { this.t++; this.sw *= 0.98; if (this.after && ++this.after > 200) { this.after = 0; back('ziel'); } }
    touch() {}
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.y - W.cam.y), a = Math.sin(this.t * 0.18) * this.sw * 0.5, on = !!fl().pfad_glocke;
      ctx.fillStyle = '#3c2c1c'; ctx.fillRect(x - 26, y - 6, 52, 5); ctx.fillRect(x - 26, y - 6, 4, 70); ctx.fillRect(x + 22, y - 6, 4, 70);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = '#5c3c08'; ctx.beginPath(); ctx.moveTo(-18, 40); ctx.quadraticCurveTo(-17, 2, 0, 2); ctx.quadraticCurveTo(17, 2, 18, 40); ctx.fill();
      ctx.fillStyle = on ? '#f8c838' : '#b8b0a0'; ctx.beginPath(); ctx.moveTo(-16, 38); ctx.quadraticCurveTo(-15, 4, 0, 4); ctx.quadraticCurveTo(15, 4, 16, 38); ctx.fill();
      ctx.fillStyle = on ? '#fcf0a0' : '#d8d0c0'; ctx.fillRect(-11, 10, 3, 24); ctx.fillStyle = '#20141c'; ctx.fillRect(-3, 38, 6, 6); ctx.restore();
      if (!on && ((this.t >> 4) & 1)) Font.draw(ctx, '!', x, y - 18, '#f8d040', { align: 'center', shadow: '#000' });
    }
  }
  const ent = (type, d) => type === 'pfadstart' ? new Start(d) : type === 'taler' ? new Taler(d) : type === 'zwglocke' ? new Glocke(d) : type === 'ziel' ? new Ziel(d)
    : type === 'schluessel' ? new Schluessel(d) : type === 'schloss' ? new Schloss(d) : type === 'umriss' ? new Umriss(d) : type === 'riesenglocke' ? new Riesenglocke(d) : new Fahrt(d);
  return { start, back, input, draw, ent, NODES, EDGES, COURSES, get game() { return G; }, enter, taler, done, secret, tilt: null };
})();
