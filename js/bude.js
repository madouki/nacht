// Wurfbude „DOSENWERFEN“ (Minispiel in der Lichterpassage): an der Bude ↑ drücken (Einsatz 100 Gold), dann 40 Sekunden in der
// Frontansicht: Fadenkreuz mit den Pfeilen bewegen, Angriff wirft einen Ball. Ziele: drei Dosenpyramiden (je Dose 10, ganze Pyramide
// +30, wird nachgefüllt), Enten auf der Schiene (20), Pappfiguren, die hinter dem Tresen hochklappen: Graf Krat (40), Oma Krat (−30,
// „NICHT DIE OMA!“), selten das goldene Gummihuhn (100). Preise: ab 500 Trostgold, ab 900 das Lebkuchenherz (einmal, danach Gold),
// ab 1500 die Urkunde „Schützenkönig“ (Grenzen mit einem Zielbot in drei Stufen geeicht: schwach ≈ 1000–1400, gut ≈ 1700–2000). Bestwert in Castle.flags.bude_best. Raum: .prop('bude', { x, y }) – Spielzustand 'bude' (game.js)
'use strict';
const BUDE3D = (() => { // Bild der Bude im Raum: tools/blender/bude_bl.py → pack_bude.py (96×56, Boden unten)
  const MAP = {"bude":[0,0,96,56]};
  const C = {}, img = new Image();
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/bude3d.png?v=' + (window.BUILD || '');
  return { MAP, get ready() { return !!C.bude; }, get(n) { return C[n]; } };
})();
const Bude = (() => {
  const VW = 400, LEN = 40 * 60, COST = 100, SHELF = [124, 170], COUNTER = 204;
  let G = null;
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const pyramid = (cx, sy) => { const cans = []; [[3, 0], [2, 1], [1, 2]].forEach(([n, row]) => { for (let i = 0; i < n; i++) cans.push({ x: cx + (i - (n - 1) / 2) * 15, y: sy - 8 - row * 17, row, down: 0, vx: 0, vy: 0, rot: 0, col: ['#c83c3c', '#3c7cc8', '#e8b840'][(i + row) % 3] }); }); return { cx, sy, cans, refill: 0 }; };
  function start() {
    G = { t: 0, score: 0, hits: 0, shots: 0, ax: VW / 2, ay: 110, balls: [], pyr: [pyramid(86, SHELF[0]), pyramid(314, SHELF[0]), pyramid(200, SHELF[1])], ducks: [], pops: [], msgs: [], cool: 0, nextDuck: 30, nextPop: 90, end: 0, prize: null };
    W.score -= COST; Audio8.sfx('bell'); Game.go('bude');
  }
  const say = (x, y, text, col) => G.msgs.push({ x, y, text, col, t: 0 });
  const add = (n, x, y) => { G.score = Math.max(0, G.score + n); say(x, y, (n > 0 ? '+' : '') + n, n > 0 ? '#f8d048' : '#fc6450'); };
  function throwBall() { G.shots++; G.cool = 13; G.pulse = 14; G.balls.push({ x0: VW / 2 + 46, y0: 252, x1: G.ax, y1: G.ay, t: 0 }); Audio8.sfx('throw'); }
  function land(b) { // der Ball kommt an: vorn die Pappfiguren, dann die Enten, dann die Dosen
    const x = b.x1, y = b.y1, R = 7;
    for (const p of G.pops) if (!p.hit && p.up > 0.6 && Math.abs(x - p.x) < 17 + R / 2 && y > p.y - 46 && y < Math.min(p.y, COUNTER)) {
      p.hit = true; p.t = 0; G.hits++;
      if (p.kind === 'oma') { add(-30, p.x, p.y - 50); say(p.x, p.y - 62, tr('budeOma'), '#fc9c80'); Audio8.sfx('hurt'); }
      else if (p.kind === 'huhn') { add(100, p.x, p.y - 50); Audio8.sfx('squeak'); Audio8.sfx('money'); }
      else { add(40, p.x, p.y - 50); Audio8.sfx('stamp'); }
      return;
    }
    for (const d of G.ducks) if (!d.hit && Math.abs(x - d.x) < 12 + R / 2 && Math.abs(y - d.y) < 10 + R / 2) { d.hit = true; d.vy = -1.5; G.hits++; add(20, d.x, d.y - 14); Audio8.sfx('squeak'); return; }
    let got = 0;
    for (const P of G.pyr) for (const c of P.cans) if (!c.down && Math.abs(x - c.x) < 11 && Math.abs(y - c.y) < 13) {
      got++; topple(c, x);
      for (const o of P.cans) if (!o.down && o.row > c.row && Math.abs(o.x - c.x) < 12) topple(o, x); // was darauf stand, fällt mit
    }
    if (got) {
      G.hits++; Audio8.sfx('clank'); Audio8.sfx('tink');
      for (const P of G.pyr) { const n = P.cans.filter(c => c.down === 1).length; for (const c of P.cans) if (c.down === 1) c.down = 2; if (n) add(10 * n, P.cx, P.sy - 60); if (n && P.cans.every(c => c.down) && !P.refill) { P.refill = 150; add(30, P.cx, P.sy - 74); say(P.cx, P.sy - 86, tr('budeAlle'), '#7cf0a0'); } }
      return;
    }
    Audio8.sfx('tink'); G.marks = (G.marks || []).concat([{ x, y, t: 0 }]).slice(-8); // Ball prallt an die Rückwand
  }
  function topple(c, x) { c.down = 1; c.vx = (c.x - x) * 0.12 + rnd(-1, 1); c.vy = rnd(-3, -1.6); c.rot = rnd(-0.3, 0.3); }
  function input(P, I) {
    if (!G) return true;
    G.t++;
    if (G.end) { // Auswertung: Sprung/Angriff/Start zurück in die Passage
      if (G.end < 1000) G.end++;
      if (G.end > 40 && (P.jump || P.attack || P.start || P.up)) { G = null; Audio8.sfx('select'); return true; }
      return false;
    }
    const mx = (I.right ? 1 : 0) - (I.left ? 1 : 0), my = (I.down ? 1 : 0) - (I.up ? 1 : 0); // Zielring: erst fein, beim Halten schneller
    G.hold = mx || my ? Math.min(14, (G.hold || 0) + 1) : 0; const sp = 1.8 + 2.6 * G.hold / 14;
    G.ax = clamp(G.ax + mx * sp, 10, VW - 10); G.ay = clamp(G.ay + my * sp, 40, COUNTER - 6);
    if (G.cool > 0) G.cool--; if (G.pulse > 0) G.pulse--;
    G.aim = aimKind(G.ax, G.ay); G.lock = (G.lock || 0) + ((G.aim && G.cool === 0 ? 1 : 0) - (G.lock || 0)) * 0.3;
    if ((P.attack || P.sub || (I.attack && G.cool === 0)) && G.cool === 0) throwBall();
    for (const b of G.balls) if (++b.t === 14) land(b);
    G.balls = G.balls.filter(b => b.t < 14);
    for (const P2 of G.pyr) { for (const c of P2.cans) if (c.down) { c.x += c.vx; c.y += c.vy; c.vy += 0.3; c.rot += c.vx * 0.08; } if (P2.refill && --P2.refill === 0) { const n = pyramid(P2.cx, P2.sy); P2.cans = n.cans; Audio8.sfx('klack'); } }
    if (--G.nextDuck <= 0) { G.ducks.push({ x: VW + 16, y: 64, hit: false, vy: 0, gold: false }); G.nextDuck = 55 + Math.floor(Math.random() * 40); }
    for (const d of G.ducks) { if (d.hit) { d.vy += 0.25; d.y += d.vy; } else d.x -= 1.3 + G.t / LEN; }
    G.ducks = G.ducks.filter(d => d.x > -20 && d.y < 260);
    if (--G.nextPop <= 0) { // Pappfigur klappt hoch (nicht zweimal am selben Platz)
      const free = [56, 146, 254, 344].filter(x => !G.pops.some(p => p.x === x)); if (free.length) { const r = Math.random(); G.pops.push({ x: free[Math.floor(Math.random() * free.length)], y: COUNTER + 2, kind: r < 0.1 ? 'huhn' : r < 0.45 ? 'oma' : 'graf', up: 0, t: 0, stay: 80 - Math.floor(G.t / LEN * 30), hit: false }); Audio8.sfx('latch'); }
      G.nextPop = 45 + Math.floor(Math.random() * 45);
    }
    for (const p of G.pops) { p.t++; if (p.hit) p.up = Math.max(0, p.up - 0.12); else if (p.t < 10) p.up = p.t / 10; else if (p.t > p.stay) p.up = Math.max(0, p.up - 0.1); }
    G.pops = G.pops.filter(p => !(p.up <= 0 && (p.hit || p.t > p.stay)));
    for (const m of G.msgs) m.t++; G.msgs = G.msgs.filter(m => m.t < 50);
    if (G.marks) { for (const m of G.marks) m.t++; G.marks = G.marks.filter(m => m.t < 40); }
    if (G.t % 60 === 0 && LEN - G.t <= 300 && LEN - G.t > 0) Audio8.sfx('tick');
    if (G.t >= LEN) finish();
    return false;
  }
  function finish() { // Runde vorbei: Bestwert, Preis
    G.end = 1; Audio8.sfx('bell'); const s = G.score, fl = F();
    const best = Math.max(fl.bude_best || 0, s); if (typeof Castle !== 'undefined' && Castle.flags) Castle.flags.bude_best = best;
    let gold = 0, key = 'budeNix';
    if (s >= 900) { if (typeof Castle !== 'undefined' && Castle.inv && !Castle.inv.lebkuchen && Castle.giveItem) { Castle.giveItem('lebkuchen', false); key = 'budeHerz'; } else { gold = s >= 1500 ? 1000 : 600; key = 'budeGold'; } }
    else if (s >= 500) { gold = 300; key = 'budeTrost'; }
    if (s >= 1500) key = key === 'budeHerz' ? 'budeHerz' : 'budeKoenig';
    if (gold) W.score += gold;
    G.prize = { key, gold, best, rec: s >= best && s > 0 };
    Audio8.sfx(gold || key === 'budeHerz' ? 'money' : 'select');
    if (typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('bude_played');
  }
  // ---------------- Zeichnen ----------------
  function draw(ctx, t) {
    if (!G) return;
    const s = Math.min(1, View.w / VW), ox = Math.round((View.w - VW * s) / 2);
    ctx.fillStyle = '#0c0610'; ctx.fillRect(0, 0, View.w, 240);
    ctx.save(); ctx.translate(ox, 0); ctx.scale(s, s);
    // Rückwand: Holzbretter, Lichterkette, Schild
    for (let y = 30; y < COUNTER; y += 14) { ctx.fillStyle = (y / 14) & 1 ? '#3c2418' : '#442a1c'; ctx.fillRect(0, y, VW, 14); ctx.fillStyle = '#2c1810'; ctx.fillRect(0, y + 13, VW, 1); }
    for (let x = 0; x < VW; x += 20) { const on = ((x / 20 + (t >> 3)) % 3) !== 0; ctx.fillStyle = '#1c1c1c'; ctx.fillRect(x, 36, 20, 1); ctx.fillStyle = on ? ['#fc6450', '#f8d048', '#7cf0a0', '#78b4fc'][(x / 20) % 4] : '#4c3c2c'; ctx.fillRect(x + 8, 37, 4, 5); }
    const sw = Math.max(152, Font.width(tr('budeTitel')) + 20); ctx.fillStyle = '#5c1420'; ctx.fillRect(VW / 2 - sw / 2, 4, sw, 24); ctx.fillStyle = '#f8d048'; ctx.fillRect(VW / 2 - sw / 2, 4, sw, 1); ctx.fillRect(VW / 2 - sw / 2, 27, sw, 1);
    Font.draw(ctx, tr('budeTitel'), VW / 2, 11, '#fce0a8', { align: 'center', shadow: '#000' });
    // Entenschiene
    ctx.fillStyle = '#8c8c9c'; ctx.fillRect(0, 74, VW, 3); ctx.fillStyle = '#4c4c5c'; ctx.fillRect(0, 77, VW, 2);
    for (const d of G.ducks) drawDuck(ctx, d.x, d.y, d.hit, t);
    // Regalbretter mit Dosen
    for (const y of SHELF) { ctx.fillStyle = '#8c5c2c'; ctx.fillRect(20, y, VW - 40, 6); ctx.fillStyle = '#b07838'; ctx.fillRect(20, y, VW - 40, 2); ctx.fillStyle = '#4c2c14'; ctx.fillRect(20, y + 6, VW - 40, 2); }
    for (const P of G.pyr) for (const c of P.cans) drawCan(ctx, c);
    if (G.marks) for (const m of G.marks) { ctx.globalAlpha = 1 - m.t / 40; ctx.fillStyle = '#1c0c08'; ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    // Pappfiguren hinter dem Tresen
    for (const p of G.pops) drawPop(ctx, p, t);
    // Tresen mit Streifen
    ctx.fillStyle = '#6c3c1c'; ctx.fillRect(0, COUNTER, VW, 36); for (let x = 0; x < VW; x += 32) { ctx.fillStyle = (x / 32) & 1 ? '#c82c2c' : '#f4ece0'; ctx.fillRect(x, COUNTER + 6, 32, 26); }
    ctx.fillStyle = '#a86c3c'; ctx.fillRect(0, COUNTER, VW, 6); ctx.fillStyle = '#f8d048'; ctx.fillRect(0, COUNTER, VW, 1);
    // fliegende Bälle (werden kleiner)
    for (const b of G.balls) { const k = b.t / 14, x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 26, r = 9 - k * 5.5; ctx.fillStyle = '#1c1c1c'; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c83c3c'; ctx.fillRect(x - r, y - 0.5, r * 2, 1); }
    if (!G.end) drawAim(ctx, t);
    for (const m of G.msgs) Font.draw(ctx, m.text, m.x, m.y - m.t * 0.5, m.col, { align: 'center', shadow: '#000' });
    // Anzeige: Punkte, Zeit
    const left = Math.max(0, Math.ceil((LEN - G.t) / 60));
    Font.draw(ctx, tr('budePunkte', G.score), 8, 220, '#f8d048', { shadow: '#000' });
    Font.draw(ctx, tr('budeZeit', left), VW - 8, 220, left <= 5 && (t >> 3) & 1 ? '#fc6450' : '#fcfcfc', { align: 'right', shadow: '#000' });
    if (G.t < 70 && !G.end) Font.draw(ctx, tr('budeLos'), VW / 2, 96, (t >> 3) & 1 ? '#fce0a8' : '#f8d048', { align: 'center', shadow: '#000' });
    if (G.end) { // Auswertung
      ctx.fillStyle = 'rgba(12,6,0,0.86)'; ctx.fillRect(VW / 2 - 140, 70, 280, 92); ctx.fillStyle = '#c89020'; ctx.fillRect(VW / 2 - 140, 70, 280, 1); ctx.fillRect(VW / 2 - 140, 161, 280, 1);
      Font.draw(ctx, tr('budeEnde', G.score), VW / 2, 80, '#f8d048', { align: 'center', shadow: '#000' });
      Font.draw(ctx, tr('budeBest', G.prize.best) + (G.prize.rec ? '  ' + tr('budeRekord') : ''), VW / 2, 96, G.prize.rec ? '#7cf0a0' : '#c8c0b0', { align: 'center', shadow: '#000' });
      Font.draw(ctx, tr(G.prize.key, G.prize.gold), VW / 2, 116, '#fce0a8', { align: 'center', shadow: '#000' });
      if (G.end > 40) Font.draw(ctx, tr('budeWeiter'), VW / 2, 144, (t >> 4) & 1 ? '#fcfcfc' : '#8c8c9c', { align: 'center', shadow: '#000' });
    }
    ctx.restore();
  }
  function aimKind(x, y) { // was gerade unter dem Zielring liegt (gleiche Reihenfolge und Maße wie land())
    for (const p of G.pops) if (!p.hit && p.up > 0.6 && Math.abs(x - p.x) < 20.5 && y > p.y - 46 && y < Math.min(p.y, COUNTER)) return p.kind === 'graf' ? 'good' : p.kind;
    for (const d of G.ducks) if (!d.hit && Math.abs(x - d.x) < 15.5 && Math.abs(y - d.y) < 13.5) return 'good';
    for (const P of G.pyr) for (const c of P.cans) if (!c.down && Math.abs(x - c.x) < 11 && Math.abs(y - c.y) < 13) return 'good';
    return null;
  }
  function drawAim(ctx, t) { // Zielring: vier kreisende Segmente mit Leuchten, zieht sich über einem Ziel zusammen und färbt sich
    const x = G.ax, y = G.ay, ready = G.cool === 0, k = G.aim, TAU = Math.PI * 2;
    const col = !ready ? [168, 164, 184] : k === 'oma' ? [252, 92, 80] : k === 'huhn' ? [252, 214, 72] : k ? [124, 240, 160] : [252, 236, 204];
    const rgb = (a) => 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')', L = G.lock || 0;
    const r = 13 - 3.5 * L + Math.sin(t * 0.12) * 0.6 * (1 - L), spin = t * (0.035 + 0.05 * L);
    ctx.save(); ctx.lineCap = 'round';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r + 10); g.addColorStop(0, rgb(0.05)); g.addColorStop(0.55, rgb(0.16 + 0.14 * L)); g.addColorStop(1, rgb(0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, TAU); ctx.fill();                               // weicher Schein
    for (const [w, c] of [[4, 'rgba(14,6,2,0.78)'], [1.7, rgb(1)]]) {                                              // Segmente: dunkle Kontur, dann Farbe
      ctx.lineWidth = w; ctx.strokeStyle = c;
      for (let i = 0; i < 4; i++) { const a = spin + i * TAU / 4; ctx.beginPath(); ctx.arc(x, y, r, a + 0.3, a + TAU / 4 - 0.3); ctx.stroke(); }
    }
    for (const [grow, c] of [[1.3, 'rgba(14,6,2,0.78)'], [0, rgb(1)]]) { ctx.fillStyle = c;                         // kleine Pfeilspitzen in den Lücken, zeigen nach innen
      for (let i = 0; i < 4; i++) { const a = spin + i * TAU / 4, cs = Math.cos(a), sn = Math.sin(a), tip = r - 1.5 - grow, base = r + 4 + grow, hw = 2.3 + grow;
        ctx.beginPath(); ctx.moveTo(x + cs * tip, y + sn * tip); ctx.lineTo(x + cs * base - sn * hw, y + sn * base + cs * hw); ctx.lineTo(x + cs * base + sn * hw, y + sn * base - cs * hw); ctx.closePath(); ctx.fill(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x, y, r, spin + 0.3 + Math.PI, spin + 0.75 + Math.PI); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke(); // Glanzlicht auf einem Segment
    ctx.lineWidth = 1; ctx.strokeStyle = rgb(0.35); ctx.beginPath(); ctx.arc(x, y, r - 3.5, 0, TAU); ctx.stroke(); // feiner Innenring
    if (!ready) { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(248,208,72,0.95)'; ctx.beginPath(); ctx.arc(x, y, r - 3.5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - G.cool / 13)); ctx.stroke(); } // Nachladen
    if (k === 'oma' && ready) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(14,6,2,0.78)'; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(x - 3.5, y - 3.5 * s); ctx.lineTo(x + 3.5, y + 3.5 * s); ctx.stroke(); } ctx.lineWidth = 1.4; ctx.strokeStyle = rgb(1); for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(x - 3.5, y - 3.5 * s); ctx.lineTo(x + 3.5, y + 3.5 * s); ctx.stroke(); } }
    else { ctx.fillStyle = 'rgba(14,6,2,0.8)'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = rgb(1); ctx.beginPath(); ctx.arc(x, y, 1.3 + 0.4 * L, 0, TAU); ctx.fill(); } // Mittelpunkt
    if (G.pulse > 0) { const q = 1 - G.pulse / 14; ctx.lineWidth = 1.6 * (1 - q) + 0.4; ctx.strokeStyle = 'rgba(252,236,204,' + (0.8 * (1 - q)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x, y, r + 2 + q * 14, 0, TAU); ctx.stroke(); } // Wurf-Puls
    ctx.restore();
  }
  function drawCan(ctx, c) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = '#2c2c34'; ctx.fillRect(-7, -9, 14, 18); ctx.fillStyle = c.col; ctx.fillRect(-6, -7, 12, 14);
    ctx.fillStyle = '#d8d8e0'; ctx.fillRect(-6, -8, 12, 2); ctx.fillRect(-6, 6, 12, 2); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-4, -6, 2, 12);
    ctx.fillStyle = '#fce0a8'; ctx.fillRect(-2, -2, 5, 3);
    ctx.restore();
  }
  function drawDuck(ctx, x, y, hit, t) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (hit) ctx.rotate(0.9);
    ctx.fillStyle = '#1c1c1c'; ctx.fillRect(-12, -6, 22, 13); ctx.fillStyle = '#f8d048'; ctx.fillRect(-11, -5, 20, 11); ctx.fillRect(4, -13, 9, 9);
    ctx.fillStyle = '#f87800'; ctx.fillRect(13, -9, 5, 3); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(9, -11, 2, 2); ctx.fillStyle = '#fce0a8'; ctx.fillRect(-9, -4, 10, 2);
    ctx.fillStyle = '#5c5c6c'; ctx.fillRect(-2, 7, 3, 4);
    ctx.restore();
  }
  function drawPop(ctx, p, t) { // Pappaufsteller am Stiel, klappt hinter dem Tresen hoch
    const h = 46, y = COUNTER + 2 - h * p.up * 1.0, x = p.x;
    ctx.fillStyle = '#5c3c1c'; ctx.fillRect(x - 1, y + h - 6, 3, 40);
    if (p.kind === 'graf') { // Graf Krat: Umhang, bleiches Gesicht, Zähne
      ctx.fillStyle = '#1c1c24'; ctx.fillRect(x - 15, y + 14, 30, 30); ctx.fillStyle = '#a81828'; ctx.fillRect(x - 13, y + 16, 26, 4);
      ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x - 8, y, 16, 16); ctx.fillStyle = '#1c1c24'; ctx.fillRect(x - 9, y - 2, 18, 5); ctx.fillRect(x - 2, y + 1, 4, 4);
      ctx.fillStyle = '#c81c1c'; ctx.fillRect(x - 5, y + 6, 3, 2); ctx.fillRect(x + 2, y + 6, 3, 2); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x - 3, y + 12, 2, 3); ctx.fillRect(x + 1, y + 12, 2, 3);
    } else if (p.kind === 'oma') { // Oma Krat: Dutt, Brille, Strickjacke, Strickzeug
      ctx.fillStyle = '#8c5ca8'; ctx.fillRect(x - 14, y + 16, 28, 28); ctx.fillStyle = '#c8a0d8'; ctx.fillRect(x - 12, y + 18, 24, 2);
      ctx.fillStyle = '#f0c8a8'; ctx.fillRect(x - 8, y + 2, 16, 15); ctx.fillStyle = '#d8d8e0'; ctx.fillRect(x - 9, y - 2, 18, 6); ctx.fillRect(x - 4, y - 6, 8, 5);
      ctx.fillStyle = '#5c5c6c'; ctx.fillRect(x - 6, y + 7, 5, 3); ctx.fillRect(x + 1, y + 7, 5, 3); ctx.fillStyle = '#c84040'; ctx.fillRect(x - 3, y + 13, 6, 1);
      ctx.fillStyle = '#e8b840'; ctx.fillRect(x + 6, y + 26, 10, 1); ctx.fillRect(x + 4, y + 30, 12, 1);
    } else { // goldenes Gummihuhn
      ctx.fillStyle = '#c89020'; ctx.fillRect(x - 12, y + 16, 24, 20); ctx.fillStyle = '#f8d048'; ctx.fillRect(x - 11, y + 17, 22, 18); ctx.fillRect(x + 2, y + 2, 12, 15);
      ctx.fillStyle = '#c81c1c'; ctx.fillRect(x + 4, y - 2, 6, 5); ctx.fillStyle = '#f87800'; ctx.fillRect(x + 14, y + 7, 5, 3); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(x + 9, y + 6, 2, 2);
      if ((t >> 2) & 1) { ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x - 6, y + 20, 2, 2); }
    }
  }
  // ---------------- Bude im Raum ----------------
  class Stand extends Ent {
    constructor(d) { super(d.x * T, (d.y + 1) * T - 56, 6 * T, 56); this.kind = 'prop'; this.d = d; }
    update() {
      this.t++; const p = W.player;
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 30 || Math.abs(p.feet - (this.y + this.h)) > 4 || Game.state !== 'play') return;
      if (W.score < COST) { pzSay('budeArm'); return; }
      pzSay('budeIn', COST);
      if (Input.pressed.up) start();
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = this.w, t = this.t;
      if (sx < -w || sx > View.w + 10) return;
      const im = BUDE3D.get('bude');
      if (im) { ctx.drawImage(im, sx, sy); for (let x = 8; x < w - 6; x += 10) { const on = ((x / 10 + (t >> 3)) % 3) !== 0; ctx.fillStyle = on ? ['#fc6450', '#f8d048', '#7cf0a0'][(x / 10) % 3] : '#4c3c2c'; ctx.fillRect(sx + x, sy + 12, 2, 2); if (on) { ctx.globalAlpha = 0.3; ctx.fillRect(sx + x - 1, sy + 11, 4, 4); ctx.globalAlpha = 1; } } } // Blender-Bild, darüber die blinkende Lichterkette
      else {
      ctx.fillStyle = '#2c1810'; ctx.fillRect(sx + 2, sy + 10, w - 4, 46);                                     // Budenrückwand
      for (let x = 0; x < w; x += 12) { ctx.fillStyle = (x / 12) & 1 ? '#c82c2c' : '#f4ece0'; ctx.fillRect(sx + x, sy, 12, 10); ctx.fillRect(sx + x + 2, sy + 10, 8, 3); } // gestreiftes Vordach
      ctx.fillStyle = '#5c3c1c'; ctx.fillRect(sx, sy + 10, 3, 46); ctx.fillRect(sx + w - 3, sy + 10, 3, 46);    // Pfosten
      for (let i = 0; i < 3; i++) { const cx = sx + 22 + i * 26; ctx.fillStyle = ['#c83c3c', '#3c7cc8', '#e8b840'][i]; ctx.fillRect(cx - 4, sy + 22, 8, 10); ctx.fillRect(cx - 9, sy + 32, 8, 10); ctx.fillRect(cx + 1, sy + 32, 8, 10); } // Dosenpyramiden
      ctx.fillStyle = '#6c3c1c'; ctx.fillRect(sx, sy + 42, w, 14); for (let x = 0; x < w; x += 16) { ctx.fillStyle = (x / 16) & 1 ? '#c82c2c' : '#f4ece0'; ctx.fillRect(sx + x, sy + 45, 16, 9); } // Tresen
      for (let x = 4; x < w; x += 10) { ctx.fillStyle = ((x / 10 + (t >> 3)) % 3) ? ['#fc6450', '#f8d048', '#7cf0a0'][(x / 10) % 3] : '#4c3c2c'; ctx.fillRect(sx + x, sy + 13, 3, 3); } // Lichterkette
      } // Ersatzbild, bis das Blender-Bild geladen ist
      const lab = tr('budeSchild'), lw = Font.width(lab) + 8; ctx.fillStyle = '#5c1420'; ctx.fillRect(sx + w / 2 - lw / 2, sy - 13, lw, 11); ctx.fillStyle = '#f8d048'; ctx.fillRect(sx + w / 2 - lw / 2, sy - 13, lw, 1);
      Font.draw(ctx, lab, sx + w / 2, sy - 11, (t >> 5) % 4 ? '#fce0a8' : '#f8d048', { align: 'center' });
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 20 - cy, r: 42, c: [252, 200, 130], a: 0.22 }); }
  }
  return { start, input, draw, Stand, make: (d) => new Stand(d), get game() { return G; }, LEN, COST };
})();
