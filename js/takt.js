// Taktduell am Grammophon (Hotel Krat, Schloss-Modus): Die Geisterstimme des Grammophons fordert heraus. Zur gewählten Platte
// fallen Schellackplatten auf drei Bahnen (← ↑ →) im Takt der Melodie herab. Die Noten entstehen aus der Melodiestimme (p1) des
// Lieds: mindestens zwei Sechzehntel Abstand, die Bahn nach Tonhöhe (tiefes Drittel links, mittleres oben, hohes rechts).
// Treffer auf der Linie: PERFEKT (≤ 70 ms), GUT (≤ 140 ms); verpasste Noten und leeres Drücken brechen die Serie.
// Wertung S/A/B/C nach Trefferquote; Bestwert je Platte im Spielstand (castle.js zahlt Gold für jede Verbesserung).
// Uhr: die laufende Musik (Audio8.steps), ohne Ton (Testlauf, stumm) zählen die Bilder.
'use strict';

const Takt = (() => {
  const NT = { c: 0, 'c#': 1, d: 2, 'd#': 3, e: 4, f: 5, 'f#': 6, g: 7, 'g#': 8, a: 9, 'a#': 10, b: 11 };
  const midi = (n) => { const m = /^([a-g]#?)(-?\d)$/.exec(n); return m ? (parseInt(m[2], 10) + 1) * 12 + NT[m[1]] : null; };
  const LEAD = 150, SPAN = 1.5, PERF = 70, GOOD = 140, LATE = 170; // Vorlauf (Bilder), sichtbare Zeit (s), Fenster (ms)
  const COL = ['#e84c4c', '#f8c838', '#4c9cf8'], ARW = ['left', 'up', 'right'];
  let D = null;
  function chart(id) {
    const s = Audio8._songs && Audio8._songs[id]; if (!s) return null;
    const tr0 = s.tracks.find(t => t.name === 'p1') || s.tracks[0], loopLen = tr0.ev.reduce((a, e) => a + e.len, 0), loops = loopLen < 192 ? 2 : 1;
    const notes = []; let t = 0, last = -9;
    for (let L = 0; L < loops; L++) for (const e of tr0.ev) { const m = midi(e.n); if (m !== null && t - last >= 2) { notes.push({ s: t, m }); last = t; } t += e.len; }
    const ms = notes.map(n => n.m).sort((a, b) => a - b), lo = ms[Math.floor(ms.length / 3)], hi = ms[Math.floor(ms.length * 2 / 3)];
    notes.forEach((n, i) => { n.lane = n.m < lo ? 0 : n.m > hi ? 2 : lo === hi ? i % 3 : 1; });
    return { notes, bpm: s.bpm, end: t };
  }
  function start(id) {
    const c = chart(id); if (!c || !c.notes.length) return false;
    D = { id, notes: c.notes, bpm: c.bpm, end: c.end, t: 0, wait: LEAD, f: 0, score: 0, combo: 0, maxCombo: 0, perf: 0, good: 0, miss: 0, stray: 0, pops: [], flash: [0, 0, 0], res: null, fx: [] };
    Audio8.stop(); Audio8.sfx('tink');
    return true;
  }
  function now() { // Sechzehntel seit Liedbeginn (negativ im Vorlauf)
    if (D.wait > 0) return -D.wait / 60 * D.bpm / 15;
    const a = Audio8.current === D.id && Audio8.ready() ? Audio8.steps() : null;
    return a !== null ? a : D.f / 60 * D.bpm / 15;
  }
  function judge(k, lane) {
    if (k === 'P' || k === 'G') for (let i = 0; i < (k === 'P' ? 2 : 1); i++) D.fx.push({ x: 0, y: 0, vx: 0.4 + Math.random() * 0.8, vy: -0.8 - Math.random() * 0.8, t: 60, c: COL[lane] }); // Noten steigen aus dem Trichter
    if (k === 'P') { D.perf++; D.combo++; D.score += 100 + Math.min(100, D.combo * 2); Audio8.sfx('tink'); }
    else if (k === 'G') { D.good++; D.combo++; D.score += 50 + Math.min(50, D.combo); }
    else { if (k === 'M') D.miss++; else { D.stray++; D.score = Math.max(0, D.score - 20); Audio8.sfx('wall'); } D.combo = 0; }
    D.maxCombo = Math.max(D.maxCombo, D.combo);
    D.pops.push({ k, lane, t: 28 });
  }
  function finish() {
    const n = D.notes.length, acc = (D.perf + D.good * 0.6) / n;
    const rank = acc >= 0.95 && D.miss === 0 ? 'S' : acc >= 0.85 ? 'A' : acc >= 0.7 ? 'B' : 'C';
    D.res = { id: D.id, score: D.score, rank, acc: Math.round(acc * 100), perf: D.perf, good: D.good, miss: D.miss, maxCombo: D.maxCombo, t: 0 };
    Audio8.sfx(rank === 'S' || rank === 'A' ? 'cert' : 'select');
  }
  function input(P) { // pro Bild; gibt das Ergebnis zurück, wenn das Duell vorbei ist (oder abgebrochen: { quit: true })
    if (!D) return { quit: true };
    D.t++;
    for (const p of D.pops) p.t--; D.pops = D.pops.filter(p => p.t > 0);
    for (const f of D.fx) { f.x += f.vx; f.y += f.vy; f.vx += Math.sin((D.t + f.t) * 0.15) * 0.05; f.t--; } D.fx = D.fx.filter(f => f.t > 0);
    for (let l = 0; l < 3; l++) if (D.flash[l] > 0) D.flash[l]--;
    if (D.res) { D.res.t++; if (D.res.t > 40 && (P.jump || P.attack || P.start)) { const r = D.res; D = null; return r; } return null; }
    if (P.start) { D = null; Audio8.stop(); return { quit: true }; }
    if (D.wait > 0) { if (--D.wait === 0) { Audio8.play(D.id); D.f = 0; } else if (D.wait % 50 === 0) Audio8.sfx('select'); }
    else D.f++;
    const s = now(), msPer = 15000 / D.bpm;
    const press = [P.left, P.up || P.jump || P.attack, P.right];
    for (let l = 0; l < 3; l++) if (press[l]) {
      D.flash[l] = 8;
      let best = null, bd = 1e9;
      for (const n of D.notes) { if (n.s - s > 6) break; if (n.done || n.lane !== l) continue; const d = Math.abs(n.s - s) * msPer; if (d < bd) { bd = d; best = n; } }
      if (best && bd <= GOOD) { best.done = true; best.hit = Math.abs(best.s - s) * msPer <= PERF ? 'P' : 'G'; judge(best.hit, l); } else judge('X', l);
    }
    for (const n of D.notes) { if (n.s - s > 0) break; if (!n.done && (s - n.s) * msPer > LATE) { n.done = true; judge('M', n.lane); } }
    if (s > D.end + 4 && !D.res) finish();
    return null;
  }
  function arrow(ctx, x, y, dir, col, sz) { // Pfeil mit Spitze in Richtung dir
    ctx.fillStyle = col; ctx.beginPath();
    if (dir === 'up') { ctx.moveTo(x, y - sz); ctx.lineTo(x + sz, y + sz * 0.6); ctx.lineTo(x - sz, y + sz * 0.6); }
    else { const d = dir === 'left' ? -1 : 1; ctx.moveTo(x + d * sz, y); ctx.lineTo(x - d * sz * 0.6, y - sz); ctx.lineTo(x - d * sz * 0.6, y + sz); }
    ctx.closePath(); ctx.fill();
  }
  function disc(ctx, x, y, col, t, lane) { // Schellackplatte: schwarz mit Rillen, farbiges Etikett, Glanzlicht dreht sich
    ctx.fillStyle = '#08060c'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2c2834'; ctx.lineWidth = 1; for (const r of [8, 6]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#08060c'; ctx.fillRect(x - 1, y - 1, 2, 2);
    const a = t * 0.2 + lane; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x, y, 8.5, a, a + 0.7); ctx.stroke();
  }
  function wrapText(str, maxW) { const out = []; let line = ''; for (const w of str.split(' ')) { const tt = line ? line + ' ' + w : w; if (!line || Font.width(tt) <= maxW) line = tt; else { out.push(line); line = w; } } if (line) out.push(line); return out; }
  function draw(ctx, t, best, hx, hy) { // hx/hy: Trichter des Grammophons (Bildschirm)
    if (!D) return;
    const cx = View.cx, top = 34, hitY = 182, lw = 36, x0 = cx - lw * 1.5, s = now(), pps = (hitY - top) / (SPAN * D.bpm / 15);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // Spotlight von oben auf die Bahnen, pulsiert im Takt
    const beat = D.wait > 0 ? 0 : (s / 4) % 1, sg = ctx.createRadialGradient(cx, top - 20, 4, cx, top + 80, 150);
    sg.addColorStop(0, `rgba(255,230,170,${(0.16 + (1 - beat) * 0.1).toFixed(3)})`); sg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = sg; ctx.fillRect(cx - 160, top - 10, 320, hitY - top + 40);
    ctx.restore();
    for (const f of D.fx) { // Notensymbole aus dem Trichter
      const fx = Math.round((hx || cx - 120) + f.x * 1.2), fy = Math.round((hy || 90) + f.y * 1.2); ctx.globalAlpha = Math.min(1, f.t / 20);
      ctx.fillStyle = f.c; ctx.fillRect(fx, fy, 4, 3); ctx.fillRect(fx + 3, fy - 7, 1, 8); ctx.fillRect(fx + 3, fy - 7, 3, 1); ctx.globalAlpha = 1;
    }
    for (let l = 0; l < 3; l++) { // Bahnen mit Rillenmuster
      const lx = x0 + l * lw;
      ctx.fillStyle = D.flash[l] ? 'rgba(255,240,200,0.16)' : 'rgba(20,14,24,0.7)'; ctx.fillRect(lx + 2, top, lw - 4, hitY - top + 14);
      if (D.combo >= 10) { ctx.fillStyle = (t >> 2) % 2 ? '#f8d048' : '#a87c20'; ctx.fillRect(lx + 2, top, 1, hitY - top + 14); ctx.fillRect(lx + lw - 3, top, 1, hitY - top + 14); } // Serie: goldene Ränder
      ctx.fillStyle = 'rgba(200,144,32,0.12)'; for (let y = top + ((t * 2) % 12); y < hitY + 12; y += 12) ctx.fillRect(lx + 4, y, lw - 8, 1);
    }
    ctx.fillStyle = '#c89020'; ctx.fillRect(x0, hitY - 1, lw * 3, 2); // Trefferlinie mit Pfeilen
    for (let l = 0; l < 3; l++) { const ax = x0 + l * lw + lw / 2; arrow(ctx, ax, hitY + 8, ARW[l], D.flash[l] ? '#fffce0' : COL[l], D.flash[l] ? 6 : 5); }
    for (const n of D.notes) { // Noten
      if (n.done && !n.hit) continue;
      const y = hitY - (n.s - s) * pps;
      if (y < top - 12) break; if (y > hitY + 16) continue;
      const nx = x0 + n.lane * lw + lw / 2;
      if (n.hit) { const k = Math.max(0, 1 - (s - n.s) * 0.25); if (k <= 0) continue; ctx.globalAlpha = k; ctx.strokeStyle = n.hit === 'P' ? '#fffce0' : COL[n.lane]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx, hitY, 10 + (1 - k) * 14, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; continue; }
      disc(ctx, nx, y, COL[n.lane], t, n.lane);
    }
    for (const p of D.pops) { // Urteile
      const k = p.k === 'P' ? 'taktPerfect' : p.k === 'G' ? 'taktGood' : 'taktMiss', col = p.k === 'P' ? '#fffce0' : p.k === 'G' ? '#58f888' : '#fc5c5c';
      ctx.globalAlpha = Math.min(1, p.t / 10); Font.draw(ctx, tr(k), x0 + p.lane * lw + lw / 2, hitY - 24 - (28 - p.t), col, { align: 'center', shadow: '#000' }); ctx.globalAlpha = 1;
    }
    const rx = x0 + lw * 3 + 14; // Seitenleiste: Punkte, Serie, Fortschritt
    Font.draw(ctx, tr('taktScore', D.score), rx, 60, '#fce0a8', { shadow: '#000' });
    Font.draw(ctx, tr('taktCombo', D.combo), rx, 74, D.combo >= 10 ? '#f8b800' : '#c8c8d8', { shadow: '#000' });
    if (best) Font.draw(ctx, tr('taktBest', best), rx, 88, '#8c8c9c', { shadow: '#000' });
    const prog = Math.max(0, Math.min(1, s / D.end)); ctx.fillStyle = '#3c2c14'; ctx.fillRect(rx, 102, 60, 4); ctx.fillStyle = '#f8d048'; ctx.fillRect(rx, 102, 60 * prog, 4);
    if (D.wait > 0) { const n = Math.ceil(D.wait / 50); ctx.save(); ctx.translate(cx, 100); ctx.scale(3, 3); Font.draw(ctx, String(n), 0, -3, '#fcf4c0', { align: 'center', shadow: '#000' }); ctx.restore(); }
    if (D.wait > 0) wrapText(tr('taktHi'), View.w - 40).slice(0, 2).forEach((l, i) => Font.draw(ctx, l, cx, 194 + i * 10, '#fce0a8', { align: 'center', shadow: '#000' })); // die Herausforderung des Grammophons
    if (D.res) { // Ergebnis
      const r = D.res, a = Math.min(1, r.t / 20);
      const bw = Math.min(View.w - 24, 340); ctx.fillStyle = `rgba(8,6,14,${(0.86 * a).toFixed(2)})`; ctx.fillRect(cx - bw / 2, 60, bw, 124); ctx.fillStyle = '#c89020'; ctx.fillRect(cx - bw / 2, 60, bw, 1); ctx.fillRect(cx - bw / 2, 183, bw, 1);
      ctx.save(); ctx.translate(cx, 92); ctx.scale(4, 4); Font.draw(ctx, r.rank, 0, -3, r.rank === 'S' ? '#f8d048' : r.rank === 'A' ? '#58f888' : r.rank === 'B' ? '#7cdcfc' : '#fc7460', { align: 'center', shadow: '#000' }); ctx.restore();
      Font.draw(ctx, tr('taktAcc', r.acc) + '   ' + tr('taktScore', r.score), cx, 118, '#fce0a8', { align: 'center', shadow: '#000' });
      Font.draw(ctx, tr('taktMax', r.maxCombo), cx, 130, '#c8c8d8', { align: 'center', shadow: '#000' });
      if (r.gold) Font.draw(ctx, tr('taktNewBest', r.gold), cx, 142, '#f8b800', { align: 'center', shadow: '#000' });
      wrapText(tr('takt' + r.rank), bw - 16).slice(0, 3).forEach((l, i) => Font.draw(ctx, l, cx, 156 + i * 10, '#e8e4d8', { align: 'center', shadow: '#000' }));
    }
  }
  return { start, input, draw, active: () => !!D, result: () => D && D.res, state: () => D };
})();
