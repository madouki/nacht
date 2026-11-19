// Bosskämpfe: gemeinsame Schicht für alle Bosse, ohne ihre eigenen Abläufe anzufassen.
// – Taumel: Treffer (und Perfekt-Ausweichen, Konter) füllen die gelbe Leiste unter der Bossleiste. Ist sie voll, steht der Boss zwei
//   Sekunden benommen da: sein Ablauf, seine Helfer und alle Geschosse halten an, Treffer kommen schneller und härter durch.
// – Letztes Aufgebot: unter einem Viertel der Energie wird der Boss sichtbar wütend und rund 12 % schneller.
// – Finisher: der letzte Treffer friert das Bild ein (Scherenschnitt mit Strahlen und Schnitt), danach läuft der Tod des Bosses.
// – Kampfakte: nach dem Sieg ein kleiner Bericht mit Zeit, kassierten Treffern, Taumeln, Rang (S bis C) und Bonusgold.
// – Ansagen: vor jedem großen Angriff hält der Boss kurz inne und blitzt auf, ein Ring zieht sich um ihn zusammen; Sturzflüge zeigen
//   ihre Bahn, Sprünge und Stürze den Einschlag am Boden. Alle Bosse sprechen damit dieselbe Bildsprache.
'use strict';

const Duell = (() => {
  const STUN = 120, NEED0 = 10, NEED_UP = 5, NEED_MAX = 20, LAST_AT = 0.25, IMP = 20, REP = 480, PANEL = 172;
  const RANKS = ['C', 'B', 'A', 'S'], BONUS = [0, 0.1, 0.25, 0.5];
  const INK = { S: '#f8d848', A: '#7cdcfc', B: '#c8c8d8', C: '#c89878' };
  const FACE = {
    S: ['#fcfcfc', '#fcf4b8', '#fce070', '#f8d848', '#f8b800', '#c88000', '#7c4c00'], A: ['#fcfcfc', '#d8f4fc', '#a4e4fc', '#7cdcfc', '#3cbcfc', '#0078c8', '#004478'],
    B: ['#fcfcfc', '#ececf4', '#d8d8e4', '#c8c8d8', '#a0a0b4', '#74748c', '#484860'], C: ['#fcecd8', '#f0d8bc', '#e0c0a0', '#c89878', '#a87858', '#7c5438', '#503420'],
  };
  let imp = null, rep = null;
  // Ansagen je Boss und Zustand: [Bilder Innehalten, Markierung]. 0 Bilder: der Boss holt ohnehin sichtbar aus, es kommt nur das Zeichen dazu
  const TELL = {
    GiantBat: { swoop: [24, 'line'], shoot: [16] },
    GiantSkeleton: { throw: [14], jump: [16] },
    Count: { open: [10] },
    Medusa: { aim: [0], coil: [0], warn: [0], spit: [12], gaze: [12], heads: [12] },
    SunWarden: { charge: [0], leap: [14], bolts: [12] },
    Amtsschimmel: { raise: [0], snort: [0], rear: [0] },
    Schreibtisch: { jump: [14], chair: [12], drawers: [12], stamps: [12] },
    ManTrap: { attack: [14], roots: [14] },
    Kuckucksuhr: { out: [0] },
    GolemBoss: { charge: [0], crouch: [0], raise: [0], roar: [0] },
    IceWitch: { shards: [14], rain: [14], swoop: [18, 'line'], summon: [10] },
    Reisswolf: { howl: [0], wind: [0], suck: [10], spit: [12] },
    Awakened: { charge: [14], slamUp: [0] },
    MannImMond: { quake: [14], rain: [12], sickle: [14], blowWind: [0], cheese: [12] },
    Frankiermaschine: { roll: [16], salvo: [14], jump: [14] },
    Sternbild: { swipeWind: [0], chargeWind: [0], stingWind: [0], volley: [12], slamUp: [0], rain: [12] },
    Conductor: { raise: [0], swing: [12], whistle: [12] },
    Doppel: { atk: [0] },
    TentacleBoss: { aim: [0], coil: [0], warn: [0], spit: [0] },
  };
  // Sprünge mit eigener Bahn: der Boden zeigt, wo der Boss wirklich aufkommt (g: Schwerkraft, m: Abstand zur Arenawand, k: Tempo im Endspurt)
  const LEAP = { GiantSkeleton: { st: 'jump' }, SunWarden: { st: 'leap', vy: -6.4, reach: 52, max: 2.6 }, Frankiermaschine: { st: 'jump', g: 0.24, m: 56, k: (b) => (b.ph2 ? 1.3 : 1) }, Schreibtisch: { st: 'jump', g: 0.26, m: 64, k: (b) => (b.phase >= 3 ? 1.3 : 1), base: (b) => (b.phase >= 3 ? b.leg * 0.95 : 0) } };
  const TELL_SHOW = 24;
  const tellKey = (b) => b.arms ? ([...b.arms, b.burst].map(a => a && a.state).find(s => s === 'aim' || s === 'coil' || s === 'warn' || s === 'spit') || '') : b.atkT ? 'atk' : b.state; // Krake: seine Arme, Doppelgänger: sein Hieb

  const rec = (b) => b.du || (b.du = { t: 0, g: 0, need: NEED0, idle: 0, stun: 0, n: 0, last: false, hits0: (W.stats && W.stats.hits) || 0 });
  const stunned = (b) => !!(b && b.du && b.du.stun > 0 && !b.dying);
  const holding = () => stunned(W.boss);

  // Wo der Kopf des Bosses im Bild steht (Sterne, Sprüche): aus der zuletzt gezeichneten Figur, immer innerhalb des Bildes
  function head(b) {
    const r = b.lastDraw; let x = b.cx, y = b.y;
    if (r && r.s && r.s.w && Number.isFinite(r.x) && Number.isFinite(r.y) && Math.abs(r.x + r.s.w / 2 - b.cx) < 200) { x = r.x + r.s.w / 2; y = Math.min(y, r.y); }
    return { x: clamp(x, W.cam.x + 30, W.cam.x + View.w - 30), y: clamp(y, W.cam.y + 26, W.cam.y + 176) };
  }

  function stagger(b, d) {
    d.stun = STUN; d.n++; d.g = 0; d.idle = 0;
    const h = head(b);
    W.hitstop = Math.max(W.hitstop, 9); W.shake = Math.max(W.shake, 14); W.flash = Math.max(W.flash, 4);
    W.spawn(new Shock(h.x, h.y + 14, 70, '#fcd070', 4));
    W.popup(h.x, h.y - 8, tr('duelLine' + ((d.n - 1) % 4)), '#fce0a8');
    Game.shout('duelStun');
    Audio8.sfx('crumble', b.cx); Audio8.sfx('charge'); Input.rumble(0.8, 0.6, 320);
    if (typeof Castle !== 'undefined' && Castle.on && Castle.flags && !Castle.flags.duel_tip) { Castle.setFlag('duel_tip'); Game.note('duelTip'); }
  }
  function wake(b, d) { // kurz unverwundbar: was während des Taumels neben dem Helden in der Luft stand, trifft nicht aus dem Nichts
    d.need = Math.min(NEED_MAX, d.need + NEED_UP);
    const p = W.player; if (p) p.inv = Math.max(p.inv, 40);
    W.spawn(new Shock(b.cx, b.cy, 46, '#fce0a8', 3)); Audio8.sfx('whoosh', b.cx);
  }
  function struck(b, n = 1) {
    if (!b || b.dying) return;
    const d = rec(b); d.idle = 0;
    if (d.stun > 0) return;
    d.g += n * (b.stunGain || 1); if (d.g >= d.need) stagger(b, d);
  }
  const bonus = (n) => { if (W.boss && !W.boss.holdIntro) struck(W.boss, n); };

  // Von der Spielschleife je Boss und Schritt gefragt: true = dieser Boss steht gerade und bekommt keinen eigenen Schritt
  function hold(b) {
    const d = b.du; if (!d) return false;
    if (d.stun <= 0) return announce(b, d);
    if (b.dying) { d.stun = 0; return false; }
    d.stun--;
    if (b.flashT > 0) b.flashT--; if (b.invT > 0) b.invT--;
    if (d.stun % 30 === 29) b.flashT = Math.max(b.flashT, 4);
    if (d.stun === 0) wake(b, d);
    return true;
  }
  // Ansage: neuer Zustand aus der Tabelle → kurz innehalten (der Boss blitzt), das Zeichen bleibt, bis der Angriff läuft
  function announce(b, d) {
    if (b.dying || b.holdIntro) { d.tell = null; return false; }
    const key = tellKey(b);
    if (key !== d.ts) {
      d.ts = key;
      const e = (TELL[b.constructor.name] || {})[key];
      if (e) { d.tell = { t: 0, n: Math.round(e[0] * (d.last ? 0.7 : 1)), show: Math.max(TELL_SHOW, e[0]), mark: e[1] }; Audio8.sfx('tell', b.cx); }
      else d.tell = null;
    }
    const A = d.tell; if (!A) return false;
    if (++A.t > A.show) { d.tell = null; return false; }
    if (A.t > A.n) return false;
    if (A.t === 1 || A.t === 13) b.flashT = Math.max(b.flashT || 0, 3);
    return true;
  }

  function tick() {
    if (rep) { rep.t++; if (rep.t === 70) { Audio8.sfx('stamp'); W.shake = Math.max(W.shake, 6); Input.rumble(0.5, 0.5, 220); if (rep.bonus) Audio8.sfx('money'); } if (rep.t > REP) rep = null; }
    const b = W.boss; if (!b || b.dead || b.dying || b.holdIntro) return;
    const d = rec(b); d.t++;
    if (d.stun <= 0 && d.g > 0 && b.vulnerable() && ++d.idle > 200 && d.idle % 30 === 0) d.g = Math.max(0, d.g - 1); // wer ablässt, verliert den Druck langsam wieder (solange der Boss gar nicht treffbar ist, bleibt er)
    if (!d.last && b.hp <= b.maxHp * LAST_AT) {
      d.last = true; const h = head(b);
      W.flash = Math.max(W.flash, 6); W.shake = Math.max(W.shake, 16); W.spawn(new Shock(h.x, h.y + 16, 100, '#e83c20', 5));
      W.popup(h.x, h.y - 8, tr('duelLast'), '#fc7460'); Audio8.sfx('roar'); Input.rumble(0.7, 0.4, 400);
    }
    if (d.last && d.stun <= 0) {
      if (W.frame % 5 === 0 && !View.lite) { const h = head(b); W.spawn(new Particle(h.x + rnd(-22, 22), h.y + rnd(0, 46), rnd(-0.3, 0.3), rnd(-1.5, -0.5), W.frame % 2 ? '#fc7460' : '#f8b800', 30, 1, -0.01)); }
      if (W.frame % 8 === 0 && !(W.slowT > 0)) b.update(); // jeder achte Schritt doppelt
    }
  }

  // ---------------- Finisher ----------------
  function finish(b) {
    const p = W.player, r = b.lastDraw;
    imp = { f: W.frame, x: b.cx, y: b.cy, boss: r && r.s && r.s.c ? { ...r } : null, hero: p && p.rimDraw && p.rimDraw.s && p.rimDraw.s.c ? { ...p.rimDraw } : null };
    W.hitstop = Math.max(W.hitstop, IMP); W.cinema = Math.max(W.cinema, 100);
    Audio8.sfx('crack'); Audio8.sfx('boom'); Input.rumble(1, 1, 420);
  }
  const sils = new WeakMap();
  function silhouette(img, col) {
    let m = sils.get(img); if (!m) sils.set(img, m = {});
    if (m[col]) return m[col];
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return (m[col] = c);
  }
  function drawImpact(ctx) {
    if (!imp) return;
    const k = W.frame - imp.f; if (k >= IMP || k < 0) { imp = null; return; }
    const light = k >= 9, bg = light ? '#f4efe4' : '#06030c', fg = light ? '#06030c' : '#f4efe4'; // erst weiß auf schwarz, dann umgekehrt
    const cx = Math.round(imp.x - W.cam.x), cy = Math.round(imp.y - W.cam.y) + 32;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 32, View.w, 208); ctx.clip();
    ctx.globalAlpha = k < 15 ? 1 : 1 - (k - 14) / (IMP - 14);
    ctx.fillStyle = bg; ctx.fillRect(0, 32, View.w, 208);
    ctx.fillStyle = fg;
    for (let i = 0; i < 26; i++) { // Strahlen, die vom Boss wegschießen
      const a = i / 26 * Math.PI * 2 + (i * 37 % 11) * 0.03, sp = 0.014 + (i * 13 % 7) * 0.004, r0 = 46 + (i * 29 % 5) * 7 + k * 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a - sp) * 520, cy + Math.sin(a - sp) * 520); ctx.lineTo(cx + Math.cos(a + sp) * 520, cy + Math.sin(a + sp) * 520); ctx.fill();
    }
    const put = (d) => { if (!d) return; const img = d.flip ? d.s.f : d.s.c; if (!img) return; const pad = d.s.pad || 0; ctx.drawImage(silhouette(img, fg), Math.round(d.x - W.cam.x) - pad, Math.round(d.y - W.cam.y) + 32 - pad); };
    if (imp.boss) put(imp.boss); else { ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill(); }
    put(imp.hero);
    if (k >= 3) { // der Schnitt quer durch den Boss
      const th = Math.min(7, (k - 2) * 1.6), L = 210;
      ctx.fillStyle = light ? '#a80020' : '#fcfcfc';
      ctx.beginPath(); ctx.moveTo(cx - L, cy + L * 0.46); ctx.lineTo(cx, cy - th); ctx.lineTo(cx + L, cy - L * 0.46); ctx.lineTo(cx, cy + th); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- Kampfakte ----------------
  function report(b) {
    const d = rec(b), hits = Math.max(0, ((W.stats && W.stats.hits) || 0) - d.hits0), par = (b.score >= 12000 ? 150 : 90) * 60;
    const pts = (hits === 0 ? 3 : hits <= 2 ? 2 : hits <= 5 ? 1 : 0) + (d.t <= par ? 1 : 0), i = clamp(pts - 1, 0, 3), rank = RANKS[i];
    const gold = Math.round((b.score || 3000) * BONUS[i] / 10) * 10;
    if (gold) W.addScore(gold);
    const id = b.nameKey || (W.stageDef && W.stageDef.bossKey);
    if (typeof Castle !== 'undefined' && Castle.on && Castle.setBossRank && id) Castle.setBossRank(id, i + 1);
    rep = { t: 0, rank, hits, time: d.t, n: d.n, bonus: gold, lines: wrap(tr('duelV' + rank), PANEL - 12) };
  }
  function wrap(s, max) { // Japanisch/Chinesisch haben keine Leerzeichen: dort Zeichen für Zeichen umbrechen
    const out = [];
    for (const l of Game.wrapLine(s, max)) { if (Font.width(l) <= max) { out.push(l); continue; } let cur = ''; for (const ch of l) { if (cur && Font.width(cur + ch) > max) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); }
    return out;
  }
  function clock(f) { const s = Math.floor(f / 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function drawReport(ctx) {
    if (!rep) return;
    const t = rep.t, lh = I18N.cjk ? 12 : 10, rows = [[tr('duelTime'), clock(rep.time)], [tr('duelHits'), String(rep.hits)], [tr('duelStuns'), String(rep.n)]];
    const h = 17 + rows.length * lh + (rep.bonus ? lh : 0) + 3 + rep.lines.length * lh + 3;
    const inK = clamp(t / 14, 0, 1), slide = Math.round((1 - inK) * (1 - inK) * (PANEL + 10));
    const x = View.w - PANEL - 6 + slide, y = 70, ink = INK[rep.rank];
    ctx.save(); ctx.globalAlpha = clamp((REP - t) / 20, 0, 1);
    ctx.fillStyle = 'rgba(8,4,14,0.9)'; ctx.fillRect(x, y, PANEL, h);
    ctx.fillStyle = '#c89020'; ctx.fillRect(x, y, PANEL, 1); ctx.fillRect(x, y + h - 1, PANEL, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + PANEL - 1, y, 1, h);
    Font.draw(ctx, tr('duelTitle'), x + 6, y + 4, '#f8b800', { shadow: '#000' });
    ctx.fillStyle = '#5c4010'; ctx.fillRect(x + 6, y + 14, PANEL - 12, 1);
    rows.forEach(([a, v], i) => { if (t < 16 + i * 10) return; const ry = y + 17 + i * lh; Font.draw(ctx, a, x + 6, ry, '#b0a080', { shadow: '#000' }); Font.draw(ctx, v, x + PANEL - 54, ry, '#fcfcfc', { align: 'right', shadow: '#000' }); });
    let ry = y + 17 + rows.length * lh;
    if (rep.bonus) { if (t >= 70) Font.draw(ctx, tr('duelBonus', rep.bonus), x + 6, ry, '#f8b800', { shadow: '#000' }); ry += lh; }
    if (t >= 82) rep.lines.forEach((l, i) => Font.draw(ctx, l, x + 6, ry + 3 + i * lh, ink, { shadow: '#000' }));
    if (t >= 70) { // Rang: wird aufgestempelt
      const sc = Math.max(3, 9 - (t - 70)), R = 8 + sc * 4;
      ctx.save(); ctx.translate(x + PANEL - 27, y + 33); ctx.rotate(-0.24);
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, Math.PI * 2); ctx.stroke();
      Game.bigFlat(ctx, rep.rank, 0, -Math.round(sc * 3.5), sc, FACE[rep.rank], null, '#000');
      ctx.restore();
    }
    ctx.restore();
  }

  // Sterne über dem benommenen Boss
  // Boden unter einem Punkt (Weltkoordinaten): erste feste Kachel darunter
  function floorBelow(x, y) {
    const col = Math.floor(x / T), last = W.room.h - 1;
    for (let r = Math.max(0, Math.floor(y / T)); r <= last; r++) if (Phys.solidTile(col, r)) return r * T;
    return (W.room.h - 2) * T;
  }
  function floorMark(ctx, wx, fy, w, k) { // Warnstreifen am Boden: zieht sich mit nahendem Einschlag zusammen und wird heller
    const x = Math.round(wx - W.cam.x), y = Math.round(fy - W.cam.y), hw = Math.round(w / 2 * (1.5 - 0.5 * k)), p = 0.55 + 0.45 * Math.sin(W.frame * 0.55);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + 0.3 * k * p; ctx.fillStyle = '#e83018'; ctx.fillRect(x - hw, y - 3, hw * 2, 3);
    ctx.globalAlpha = 0.5 + 0.4 * p; ctx.fillStyle = '#fc6840'; ctx.fillRect(x - hw, y - 1, hw * 2, 1);
    ctx.fillStyle = '#fce070'; ctx.fillRect(x - hw - 1, y - 5, 2, 5); ctx.fillRect(x + hw - 1, y - 5, 2, 5);
    ctx.restore();
  }
  // Wo der Sprung endet: die Bahn wird mit den Regeln des Bosses bis zum Boden vorausgerechnet
  function landing(b) {
    const A = LEAP[b.constructor.name]; if (!A || b.state !== A.st) return null;
    if (A.g) {
      let by = b.by, vy = b.vy, x = b.bx, n = 0; const k = A.k(b), base = A.base ? A.base(b) : 0;
      while (n++ < 160) { vy += A.g; by -= vy; x = clamp(x + b.jx * k, b.ax + A.m, b.ax + b.aw - A.m); if (by <= base && vy > 0) break; }
      return { x, y: b.gy, n };
    }
    const wait = A.vy !== undefined && b.timer < 1, p = W.player; // der Sonnenwächter springt erst nach dem Innehalten ab und zielt dann auf den Helden
    const vx = wait ? clamp((p.cx - b.cx) / A.reach, -A.max, A.max) : b.vx || 0, e = { x: b.x, y: b.y, w: b.w, h: b.h }; let vy = wait ? A.vy : b.vy || 0, n = 0; // dieselben Stoßregeln wie im Sprung selbst
    while (n++ < 160) { vy = Math.min(vy + 0.21, 4.2); Phys.moveX(e, vx); const hit = Phys.moveY(e, vy); if (hit) vy = 0; e.x = clamp(e.x, b.ax + 4, b.ax + b.aw - 4 - e.w); if (hit === 1) break; }
    return { x: e.x + e.w / 2, y: e.y + e.h, n };
  }
  function drawTell(ctx) {
    const b = W.boss, d = b && b.du; if (!d || b.dying || b.holdIntro || d.stun > 0) return;
    const L = landing(b);
    if (L) floorMark(ctx, L.x, L.y, clamp(b.w + 14, 30, 96), clamp(1 - L.n / 50, 0, 1));
    const A = d.tell; if (!A) return;
    const k = clamp(A.t / A.show, 0, 1), h = head(b), hx = Math.round(h.x - W.cam.x), hy = Math.round(h.y + 14 - W.cam.y), sx = Math.round(clamp(b.cx, W.cam.x + 24, W.cam.x + View.w - 24) - W.cam.x), sy = Math.round(clamp(b.cy, W.cam.y + 30, W.cam.y + 180) - W.cam.y), r0 = clamp(Math.max(b.w, b.h) * 0.62, 16, 92), r = r0 + 46 * (1 - k) * (1 - k); // der Ring umschließt den ganzen Boss, auch die riesigen
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.5 * k; ctx.lineWidth = 5; ctx.strokeStyle = '#140408'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke(); // dunkler Grund: der Ring bleibt auch vor hellen Sälen sichtbar
    ctx.globalAlpha = 0.65 + 0.35 * k; ctx.lineWidth = 3; ctx.strokeStyle = k > 0.65 ? '#fce070' : '#fc4830';
    ctx.setLineDash([10, 6]); ctx.lineDashOffset = -W.frame * 1.5; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (A.mark === 'line' && Number.isFinite(b.tx) && Number.isFinite(b.ty)) { // Sturzflug: die Bahn bis zum Ziel
      const tx = Math.round(b.tx - W.cam.x), ty = Math.round(b.ty - W.cam.y);
      ctx.globalAlpha = 0.3 + 0.45 * k; ctx.strokeStyle = '#fc4830'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -W.frame; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fce070'; for (const [ax, ay] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillRect(tx + ax * 7 - (ax ? 2 : 0), ty + ay * 7 - (ay ? 2 : 0), ax ? 5 : 1, ay ? 5 : 1);
    }
    const s = Math.round(3 + 6 * Math.sin(k * Math.PI)); // Glanzstern am Kopf: das Zeichen „jetzt kommt was“
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff4d0'; ctx.fillRect(hx - s, hy - 15, s * 2 + 1, 1); ctx.fillRect(hx, hy - 15 - s, 1, s * 2 + 1); ctx.fillStyle = '#fc6840'; ctx.fillRect(hx - 1, hy - 16, 3, 3);
    ctx.restore();
  }
  function drawWorld(ctx) {
    const b = W.boss; if (!stunned(b)) return;
    const h = head(b), sx = h.x - W.cam.x, sy = h.y - W.cam.y, f = W.frame;
    for (let i = 0; i < 5; i++) {
      const a = f * 0.12 + i * 1.2566, px = Math.round(sx + Math.cos(a) * 19), py = Math.round(sy - 7 + Math.sin(a) * 5), hi = Math.sin(a) > 0;
      ctx.fillStyle = hi ? '#fce070' : '#a87810'; ctx.fillRect(px - 2, py, 5, 1); ctx.fillRect(px, py - 2, 1, 5); ctx.fillRect(px - 1, py - 1, 3, 3);
      ctx.fillStyle = '#fcfcfc'; ctx.fillRect(px, py, 1, 1);
    }
  }
  // Füllstand für die Bossleiste: k 0…1; während des Taumels läuft sie sichtbar leer
  function gauge() {
    const b = W.boss, d = b && b.du; if (!d) return { k: 0, stun: false, last: false };
    return d.stun > 0 ? { k: d.stun / STUN, stun: true, last: d.last } : { k: clamp(d.g / d.need, 0, 1), stun: false, last: d.last };
  }
  function clear() { imp = null; rep = null; }

  return { drawTell, landing, rec, stunned, holding, struck, bonus, hold, tick, finish, report, drawImpact, drawReport, drawWorld, gauge, clear, wrap, STUN, LAST_AT, get rep() { return rep; }, get imp() { return imp; } };
})();
