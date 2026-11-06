// Rohrpost-Express (Schloss-Modus): Eilzustellung für Personen zwischen Aktenkeller und Rohrpostamt. An der Station (Messingrohr mit
// Klappe) ↑ drücken: der Held steigt in die Kapsel und saust in Ego-Sicht durch die Röhre (Tunnel aus einer Nachschlagetabelle in
// halber Auflösung, gemalte Messingtextur). ← → kreist die Kapsel an der Röhrenwand entlang, Sprung = Druckstoß (schneller), Angriff
// = Peitsche nach vorn (zerschlägt Leitz-Ordner). Weichenklappen sperren eine Röhrenhälfte, Gitter lassen nur eine Lücke frei, Ordner
// fliegen entgegen, Briefmarken bringen Gold. Ohne Kratzer zugestellt: Urkunde „Eilzustellung“. Die Station im Rohrpostamt fährt
// erst, wenn man einmal aus dem Aktenkeller angekommen ist (sonst wäre sie eine Abkürzung am Amtsschimmel vorbei).
// Seit 20261106 gnädiger und schöner: Countdown, Hindernisse früh sichtbar und weiter auseinander, Lenkhilfe an der Peilmarke,
// Lampenringe, Licht am Ende der Röhre, Bullauge.
// Raum: .prop('express', { x, y, dest: 'rohrpost' | 'aktenkeller', need: 'mini' | 'flag' })
'use strict';

const Express = (() => {
  const LW = 213, LH = 104, F = 1500, TW = 128, TH = 128, LEN = 6400; // Tabelle in halber Auflösung, Brennweite, Textur, Streckenlänge
  let tex = null, lut = null, R = null, arrive = null, img = null, cv = null, cx2 = null;
  const ang = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
  function makeTex() { // Messingrohr: Glanzstreifen je Winkel, Ringfugen mit Nieten, ab und zu grüne Signallampen
    tex = new Uint8ClampedArray(TW * TH * 4);
    for (let v = 0; v < TH; v++) for (let u = 0; u < TW; u++) {
      const a = u / TW * Math.PI * 2, gl = 0.55 + 0.35 * Math.cos(a * 2 + 0.6) + 0.12 * Math.cos(a * 9);
      let r = 196 * gl, g = 150 * gl, b = 72 * gl;
      const vv = v % 32;
      if (vv < 3) { r *= 0.45; g *= 0.42; b *= 0.4; } else if (vv === 3) { r = Math.min(255, r * 1.5); g = Math.min(255, g * 1.45); b *= 1.3; } // Fuge, Kante
      if (vv === 6 && u % 8 === 4) { r = 250; g = 226; b = 150; }                                                                         // Niete
      if (v >= 64 && v < 72 && (u === 40 || u === 41 || u === 104 || u === 105)) { r = 70; g = 250; b = 120; }                           // Signallampe
      if (((u * 7 + v * 13) % 11) === 0) { r *= 0.9; g *= 0.9; b *= 0.9; }
      const i = (v * TW + u) * 4; tex[i] = r; tex[i + 1] = g; tex[i + 2] = b; tex[i + 3] = 255;
    }
  }
  function makeLut() { // je Bildpunkt: Winkel (u) und Tiefe (F/d) – die Röhrenwand in Zentralperspektive
    lut = { u: new Float32Array(LW * LH), d: new Float32Array(LW * LH) };
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const dx = x - LW / 2 + 0.5, dy = y - LH / 2 + 0.5, d = Math.max(0.6, Math.hypot(dx, dy)), i = y * LW + x;
      lut.u[i] = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * TW; lut.d[i] = F / d;
    }
    cv = document.createElement('canvas'); cv.width = LW; cv.height = LH; cx2 = cv.getContext('2d'); img = cx2.createImageData(LW, LH);
  }
  // Strecke (seit 20261106 gnädiger): Hindernisse weiter auseinander, breitere Gitterlücken, Ordner einzeln oder zu zweit –
  // zum Reagieren bleiben jetzt rund 1,5 bis 3 Sekunden statt einer Drittelsekunde
  function course(seed) { // Hindernisse entlang der Strecke: wird schwerer, je weiter es geht
    let s = seed; const rn = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const o = []; let z = 520;
    while (z < LEN - 200) {
      const k = z / LEN, r = rn(), a = rn() * Math.PI * 2;
      if (r < 0.28) o.push({ t: 'flap', z, a });
      else if (r < 0.48 && k > 0.2) o.push({ t: 'grate', z, a, gap: 0.8 - k * 0.15 });
      else if (r < 0.78) { for (let i = 0; i < 1 + (k > 0.55 ? 1 : 0); i++) o.push({ t: 'folder', z: z + i * 40, a: a + (rn() - 0.5) * 1.2, col: ['#3c6cc8', '#c83c3c', '#3c9c58', '#e8c040'][Math.floor(rn() * 4)] }); }
      else for (let i = 0; i < 5; i++) o.push({ t: 'stamp', z: z + i * 22, a: a + i * 0.28 });                 // Briefmarken im Bogen
      z += 230 - k * 50 + rn() * 90;
    }
    return o;
  }
  const GO = 96; // Countdown vor der Abfahrt (Bilder)
  function start(p, st) {
    if (!lut) makeLut(); if (!tex) makeTex();
    R = { t: 0, z: 0, sp: 0, th: -Math.PI / 2, vth: 0, boost: 0, cool: 0, whip: 0, obs: course(st.dest === 'rohrpost' ? 4242 : 1717), stamps: 0, hits: 0, dest: st.dest, end: 0, flash: 24, shake: 0, go: GO, warn: null, sparks: [] };
    p.state = 'express'; p.vx = p.vy = 0;
    Audio8.sfx('whoosh'); Audio8.sfx('hiss'); Audio8.play('galopp'); Input.rumble(0.5, 0.4, 300);
    W.spawn(new ExpressView());
  }
  function hurt(p, o) {
    R.hits++; R.sp = Math.max(1.4, R.sp * 0.6); R.flash = -10; R.shake = 12;
    p.hp = Math.max(1, p.hp - 1); Audio8.sfx('hurt'); Audio8.sfx('crumble'); Input.rumble(0.6, 0.6, 250);
    W.popup(p.cx, p.y - 10, tr(o.t === 'flap' ? 'expFlap' : o.t === 'grate' ? 'expGrate' : 'expFolder'), '#fc7460');
  }
  // Lenkhilfe: Wohin muss die Kapsel für das nächste gefährliche Hindernis? (Zielwinkel, sicher jetzt?)
  function aim(o, me) {
    const df = Math.abs(ang(o.a - me));
    if (o.t === 'flap') return { tgt: o.a + Math.PI, safe: df >= Math.PI / 2 - 0.12 };
    if (o.t === 'grate') return { tgt: o.a, safe: df <= o.gap };
    return { tgt: o.a + (ang(me - o.a) >= 0 ? 0.9 : -0.9), safe: df >= 0.32 }; // Ordner: zur Seite ausweichen
  }
  function ride(p, I, P) { // vom Helden-Update aufgerufen (Zustand 'express')
    if (!R) { p.state = 'normal'; return; }
    if (R.done) { if (W.room !== R.room) { R = null; p.state = 'normal'; } return; } // Überblendung zum Zielraum läuft
    R.t++; if (R.flash > 0) R.flash--; else if (R.flash < 0) R.flash++; if (R.shake > 0) R.shake--;
    if (R.end) { if (++R.end > 40) finish(p); return; }
    R.vth += ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 0.011; R.vth *= 0.86; R.th += R.vth;
    if (R.go > 0) { // Countdown: lenken geht schon, losgefahren wird bei 0
      if (--R.go % 32 === 0) Audio8.sfx(R.go ? 'select' : 'bell');
      if (!R.go) { Audio8.sfx('hiss'); Input.rumble(0.4, 0.3, 200); }
      return;
    }
    if (P.jump && R.cool <= 0) { R.boost = 50; R.cool = 110; Audio8.sfx('hiss'); Audio8.sfx('whoosh'); }
    if (R.boost > 0) R.boost--; if (R.cool > 0) R.cool--;
    if (P.attack && R.whip <= 0) { R.whip = 18; Audio8.sfx('whip'); }
    if (R.whip > 0) R.whip--;
    const run = R.t - GO;
    R.sp += ((Math.min(3.3, 2.0 + run * 0.0005) + (R.boost > 0 ? 1.3 : 0)) - R.sp) * 0.05;
    R.z += R.sp;
    const me = R.th + Math.PI / 2; // Platz der Kapsel an der Röhrenwand (unten im Bild)
    R.warn = null;
    for (const o of R.obs) {
      if (o.done) continue;
      const dz = o.z - R.z, df = Math.abs(ang(o.a - me));
      if (o.t === 'folder' && R.whip > 6 && dz > 0 && dz < 110 && df < 0.6) { o.done = true; o.broke = true; Audio8.sfx('crumble'); W.popup(p.cx, p.y - 10, '+50', '#f8b800'); W.addScore(50); for (let i = 0; i < 14; i++) R.sparks.push({ x: rnd(-40, 40), y: rnd(-30, 10), vx: rnd(-2.5, 2.5), vy: rnd(-3, -0.5), t: 40, c: i % 3 ? '#f0ead8' : o.col }); continue; }
      if (!R.warn && o.t !== 'stamp' && dz > 2 && dz < 420) { const a = aim(o, me); R.warn = { o, dz, safe: a.safe, dir: Math.sign(ang(a.tgt - me)) }; if (!a.safe && dz < 260 && !o.beeped) { o.beeped = true; Audio8.sfx('tink'); } }
      if (dz > 2) continue;
      o.done = true;
      if (o.t === 'flap' && df < Math.PI / 2 - 0.12) hurt(p, o);
      else if (o.t === 'grate' && df > o.gap) hurt(p, o);
      else if (o.t === 'folder' && df < 0.32) hurt(p, o);
      else if (o.t === 'stamp' && df < 0.42) { R.stamps++; W.addScore(100); Audio8.sfx('money'); }
      else if (o.t !== 'stamp') Audio8.sfx('whoosh');
    }
    if (R.sp > 2.6 && R.t % 3 === 0) R.sparks.push({ x: rnd(-60, 60), y: rnd(70, 96), vx: rnd(-1.5, 1.5), vy: rnd(-1.2, -0.2), t: 18, c: '#fce0a0' }); // Funken an der Kufe
    for (const s of R.sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.t--; }
    R.sparks = R.sparks.filter(s => s.t > 0);
    if (R.z >= LEN) { R.end = 1; R.flash = 40; Audio8.sfx('bell'); Audio8.sfx('stamp'); }
  }
  function finish(p) {
    const st = R, perfect = st.hits === 0;
    R.done = true; R.room = W.room; R.flash = 60; // weiß bleiben, bis der Zielraum da ist
    if (typeof Castle !== 'undefined' && Castle.setFlag) { Castle.setFlag('express_done'); if (perfect) Castle.setFlag('express_perfect'); }
    arrive = { dest: st.dest, stamps: st.stamps, perfect };
    const f = Castle.side[st.dest]; Game.castleGo({ s: f.s, r: f.r, place: 'start' });
  }
  // ---------------- Ego-Sicht (über der Welt, nach dem Licht) ----------------
  // Röhrenwand aus der Nachschlagetabelle, dazu (seit 20261106): Lampenringe alle 512 Einheiten, die die Wand warm aufhellen,
  // warmer Dunst statt Schwarz, Licht am Ende der Röhre (wächst bis zur Ankunft), Hindernisse schon von weitem sichtbar,
  // Bullauge der Kapsel mit Messingrand und Nieten, Funken an der Kufe, Lenkhilfe an der Peilmarke
  const LB = new Float32Array(256); for (let i = 0; i < 256; i++) { const d = Math.min(Math.abs(i - 128), 256 - Math.abs(i - 128)); LB[i] = 1 + 1.1 * Math.exp(-(((i - 128) / 9) ** 2)) + 0.25 * Math.exp(-((d / 30) ** 2)); }
  const FOG = [26, 15, 8];
  let frame = null;
  function makeFrame(vw) { // Bullauge: dunkler Rahmen mit elliptischer Öffnung, Messingrand, Nieten, Haltegriff unten
    const c = document.createElement('canvas'); c.width = vw; c.height = 208; const x = c.getContext('2d'), cx = vw / 2, rx = vw * 0.49, ry = 102;
    x.fillStyle = '#140c06'; x.fillRect(0, 0, vw, 208);
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(cx, 100, rx, ry, 0, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over';
    for (const [w, col] of [[5, '#5c3c10'], [3, '#c89838'], [1, '#f8e0a0']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.ellipse(cx, 100, rx + 2, ry + 2, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
    x.strokeStyle = '#8c6420'; x.lineWidth = 4; x.beginPath(); x.ellipse(cx, 100, rx + 2, ry + 2, 0, -0.05 * Math.PI, 1.05 * Math.PI); x.stroke();
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, px = cx + Math.cos(a) * (rx + 5), py = 100 + Math.sin(a) * (ry + 5); if (py < 0 || py > 206) continue; x.fillStyle = '#3c2408'; x.fillRect(px - 2, py - 2, 4, 4); x.fillStyle = '#e8c870'; x.fillRect(px - 1, py - 2, 2, 1); }
    const g = x.createRadialGradient(cx, 100, ry * 0.7, cx, 100, rx * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); x.fillStyle = g; x.fillRect(0, 0, vw, 208); // Glas: Ränder dunkler
    x.fillStyle = '#2c1c0c'; x.fillRect(cx - 70, 196, 140, 12); x.fillStyle = '#c89838'; x.fillRect(cx - 70, 196, 140, 2); x.fillStyle = '#7c5418'; x.fillRect(cx - 72, 194, 6, 14); x.fillRect(cx + 66, 194, 6, 14); // Haltegriff
    return c;
  }
  class ExpressView extends Ent {
    constructor() { super(0, 0, 1, 1); this.kind = 'fx'; }
    update() { if (!R) this.dead = true; }
    draw() { }
    drawLit(ctx) {
      if (!R) return;
      const vw = View.w, cx = vw / 2, cy = 104, d8 = img.data, U = lut.u, D = lut.d, rot = R.th / (Math.PI * 2) * TW, zz = R.z * 0.5, k = Math.min(1, R.z / LEN);
      for (let i = 0, n = LW * LH; i < n; i++) { // Röhrenwand: Textur nach Winkel und Tiefe, Lampenringe, zur Mitte hin warmer Dunst
        const dd = D[i], vw2 = (dd * 0.5 + zz) | 0, u = ((U[i] + rot) | 0) & 127, t = ((vw2 & 127) * TW + u) * 4, f = Math.min(1, 40 / dd), l = f * LB[vw2 & 255], j = i * 4, fo = 1 - f;
        d8[j] = tex[t] * l + FOG[0] * fo; d8[j + 1] = tex[t + 1] * l + FOG[1] * fo; d8[j + 2] = tex[t + 2] * l + FOG[2] * fo; d8[j + 3] = 255;
      }
      cx2.putImageData(img, 0, 0);
      const sh = R.shake ? ((R.t >> 1) & 1) * 2 - 1 : 0;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv, 0, 0, LW, LH, sh, 0, vw, 208); ctx.imageSmoothingEnabled = false;
      // Licht am Ende der Röhre: wächst bis zur Ankunft
      ctx.globalCompositeOperation = 'lighter';
      const lr = 14 + 150 * k * k * k, lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, lr); lg.addColorStop(0, `rgba(255,236,190,${(0.35 + 0.6 * k * k).toFixed(2)})`); lg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = lg; ctx.fillRect(cx - lr, cy - lr, lr * 2, lr * 2);
      ctx.globalCompositeOperation = 'source-over';
      // Hindernisse von hinten nach vorn – schon von weitem zu sehen (ab 900 Einheiten), ab 300 voll deckend
      const vis = R.obs.filter(o => !o.done && o.z - R.z > 2 && o.z - R.z < 900).sort((a, b) => b.z - a.z);
      for (const o of vis) {
        const dz = o.z - R.z, r = 2 * F / dz, s = ang(o.a - R.th), lw = Math.max(1, r / 30);
        ctx.globalAlpha = Math.max(0, Math.min(1, (900 - dz) / 600));
        if (o.t === 'flap') { // Weichenklappe: Messingplatte mit Warnstreifen und Scharnier über einer Röhrenhälfte
          const a0 = s - Math.PI / 2, a1 = s + Math.PI / 2;
          ctx.fillStyle = '#5c3c10'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill();
          const pg = ctx.createLinearGradient(cx + Math.cos(s) * r, cy + Math.sin(s) * r, cx, cy); pg.addColorStop(0, '#e8c060'); pg.addColorStop(1, '#8c6420');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * 0.9, a0 + 0.04, a1 - 0.04); ctx.closePath(); ctx.fill();
          for (let q = 0; q < 10; q++) { ctx.strokeStyle = q & 1 ? '#1c1408' : '#f8d030'; ctx.lineWidth = Math.max(1, r * 0.07); ctx.beginPath(); ctx.arc(cx, cy, r * 0.95, a0 + q * Math.PI / 10, a0 + (q + 1) * Math.PI / 10); ctx.stroke(); } // Warnstreifen
          ctx.strokeStyle = '#3c2408'; ctx.lineWidth = Math.max(1, r / 18); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r); ctx.stroke(); // Scharnier
          ctx.fillStyle = (R.t >> 3) & 1 ? '#fc3c3c' : '#8c1c1c'; const lpx = cx + Math.cos(s) * r * 0.45, lpy = cy + Math.sin(s) * r * 0.45, ls = Math.max(2, r / 14); ctx.fillRect(lpx - ls / 2, lpy - ls / 2, ls, ls); // Warnlampe
        } else if (o.t === 'grate') { // Gitter: eiserne Stäbe, die freie Lücke leuchtet grün
          ctx.fillStyle = 'rgba(88,248,136,0.16)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s - o.gap, s + o.gap); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#2c2c38'; ctx.lineWidth = lw * 1.6; ctx.beginPath(); ctx.arc(cx, cy, r, s + o.gap, s - o.gap + Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#6c7084'; ctx.lineWidth = lw;
          for (let a = o.gap; a < Math.PI * 2 - o.gap; a += 0.26) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(s + a) * r * 0.08, cy + Math.sin(s + a) * r * 0.08); ctx.lineTo(cx + Math.cos(s + a) * r, cy + Math.sin(s + a) * r); ctx.stroke(); }
          ctx.strokeStyle = '#9ca0b0'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, s + o.gap, s - o.gap + Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#58f888'; ctx.lineWidth = Math.max(1, r / 25); ctx.beginPath(); ctx.arc(cx, cy, r * 0.97, s - o.gap + 0.04, s + o.gap - 0.04); ctx.stroke(); // grün = frei
        } else { // Ordner und Briefmarken stehen an der Wand
          const px = cx + Math.cos(s) * r * 0.82, py = cy + Math.sin(s) * r * 0.82, q = r / 60;
          ctx.save(); ctx.translate(px, py); ctx.rotate(s - Math.PI / 2);
          if (o.t === 'folder') { // Leitz-Ordner: Rücken, Etikett, Griffloch, Schatten
            const w = 18 * q, h = 24 * q;
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-w / 2 + 2 * q, -h + 2 * q, w, h);
            ctx.fillStyle = '#100c14'; ctx.fillRect(-w / 2 - 1, -h - 1, w + 2, h + 2); ctx.fillStyle = o.col; ctx.fillRect(-w / 2, -h, w, h);
            ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w / 2, -h, w * 0.25, h);
            ctx.fillStyle = '#f0ead8'; ctx.fillRect(-w / 3, -h * 0.88, w * 0.66, h * 0.32); ctx.fillStyle = '#5c5c6c'; ctx.fillRect(-w / 4, -h * 0.76, w / 2, Math.max(1, q));
            ctx.fillStyle = '#100c14'; ctx.beginPath(); ctx.arc(0, -h * 0.3, w * 0.16, 0, Math.PI * 2); ctx.fill();
          } else { // Briefmarke: gezähnter Rand, rotes Motiv, Goldglanz
            const w = 13 * q, gl = ((R.t + o.z) >> 3) % 6 === 0;
            ctx.fillStyle = '#f8f4e8'; ctx.fillRect(-w / 2, -w * 1.25, w, w * 1.25);
            ctx.fillStyle = '#c8bca0'; for (let e = 0; e < 5; e++) { ctx.fillRect(-w / 2 + e * w / 4 - 0.5, -w * 1.25 - 0.5, Math.max(1, q), Math.max(1, q)); ctx.fillRect(-w / 2 + e * w / 4 - 0.5, -0.5, Math.max(1, q), Math.max(1, q)); }
            ctx.fillStyle = '#c82c2c'; ctx.fillRect(-w / 2 + w * 0.15, -w * 1.1, w * 0.7, w * 0.95); ctx.fillStyle = gl ? '#fffce0' : '#f8d048'; ctx.fillRect(-w * 0.14, -w * 0.8, w * 0.28, w * 0.34);
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // Peitsche nach vorn, Funken, Tempo-Striche
      if (R.whip > 6) { ctx.strokeStyle = '#c89050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 30, 208); ctx.quadraticCurveTo(cx + 10, 150, cx, 124 - (18 - R.whip) * 2); ctx.stroke(); }
      for (const s of R.sparks) { ctx.fillStyle = s.c; ctx.fillRect(Math.round(cx + s.x), Math.round(cy + s.y), 2, 2); }
      if (R.boost > 0 || R.sp > 3) { ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 1; for (let q = 0; q < 16; q++) { const a = (q * 2.39 + R.t * 0.07) % (Math.PI * 2), r0 = 60 + ((R.t * 9 + q * 37) % 120); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + 26), cy + Math.sin(a) * (r0 + 26)); ctx.stroke(); } }
      if (!frame || frame.width !== vw) frame = makeFrame(vw);
      ctx.drawImage(frame, 0, 0);
      // Peilmarke mit Lenkhilfe: grün = sicher, rot blinkend = Kollisionskurs, Pfeil zeigt, wohin man lenken muss
      const w = R.warn, bad = w && !w.safe, blink = (R.t >> 2) & 1;
      ctx.fillStyle = '#e8c870'; ctx.fillRect(cx - 5, 186, 10, 8);
      ctx.fillStyle = bad ? (blink ? '#fc3c3c' : '#8c1c1c') : '#58f888'; ctx.fillRect(cx - 3, 188, 6, 4);
      if (bad) {
        const urg = Math.max(0, Math.min(1, (420 - w.dz) / 300)), ax = cx + w.dir * (16 + ((R.t >> 2) % 3) * 3);
        ctx.fillStyle = `rgba(252,${Math.round(220 - urg * 160)},60,${(0.5 + urg * 0.5).toFixed(2)})`;
        for (let q = 0; q < 2; q++) { const bx = ax + w.dir * q * 9; ctx.beginPath(); ctx.moveTo(bx + w.dir * 6, 190); ctx.lineTo(bx, 185); ctx.lineTo(bx, 195); ctx.closePath(); ctx.fill(); }
        if (urg > 0.6) { ctx.strokeStyle = `rgba(252,60,60,${((urg - 0.6) * 0.8).toFixed(2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, 100, vw * 0.47, 98, 0, 0, Math.PI * 2); ctx.stroke(); } // roter Rand: gleich knallt's
      }
      // Anzeige: Strecke, Briefmarken, Druckstoß
      ctx.fillStyle = 'rgba(8,6,14,0.7)'; ctx.fillRect(8, 6, vw - 16, 13);
      ctx.fillStyle = '#5c4414'; ctx.fillRect(12, 10, vw - 24, 5); ctx.fillStyle = '#f8d048'; ctx.fillRect(12, 10, (vw - 24) * k, 5);
      Font.draw(ctx, tr('expStamps', R.stamps), 12, 22, '#f8f4e8', { shadow: '#000' });
      Font.draw(ctx, tr(R.cool > 0 ? 'expWait' : 'expBoost'), vw - 12, 22, R.cool > 0 ? '#8c8c9c' : '#58f888', { align: 'right', shadow: '#000' });
      if (R.go > 0) { const n = Math.ceil(R.go / 32), sc = 1 + (R.go % 32) / 32; ctx.save(); ctx.translate(cx, 92); ctx.scale(sc * 2, sc * 2); Font.draw(ctx, String(n), 0, -3, '#fcf4c0', { align: 'center', shadow: '#000' }); ctx.restore(); }
      if (R.flash) { ctx.fillStyle = R.flash > 0 ? `rgba(255,252,240,${Math.min(1, R.flash / 24).toFixed(2)})` : `rgba(255,40,40,${(-R.flash / 20).toFixed(2)})`; ctx.fillRect(0, 0, vw, 208); }
      if (R.end) Font.draw(ctx, tr('expArrive'), cx, 96, '#fcf4c0', { align: 'center', shadow: '#000' });
      if (R.done) { ctx.fillStyle = '#fffcf0'; ctx.fillRect(0, 0, vw, 208); }
      ctx.restore();
    }
  }
  // ---------------- Station: Messingrohr mit Klappe, Schild, Lampe ----------------
  class Station extends Ent {
    constructor(d) { super(d.x * T - 8, (d.y + 1) * T - 40, 32, 40); this.kind = 'prop'; this.d = d; this.open = 0; }
    ready() {
      const d = this.d;
      if (d.need === 'mini') { const M = W.room.mini; return !M || !!W.miniDone[W.stage + ':' + W.roomIdx]; }
      if (d.need === 'flag') return !!(Castle.flags && Castle.flags.express_done);
      return true;
    }
    update() {
      this.t++;
      if (arrive && arrive.dest && Castle.side[arrive.dest] && W.stage === Castle.side[arrive.dest].s && W.roomIdx === Castle.side[arrive.dest].r) { // Ankunft: Held steigt hier aus
        const p = W.player, a = arrive; arrive = null; R = null; p.state = 'normal';
        p.x = this.cx - p.w / 2; p.y = this.y + this.h - p.h; p.vx = p.vy = 0; this.open = 30;
        Audio8.sfx('door'); W.popup(p.cx, p.y - 16, tr('expDone', a.stamps), '#f8d048'); if (a.stamps) W.addScore(a.stamps * 50);
        if (a.perfect) Game.note('expPerfect');
        for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + rnd(-6, 6), this.y + 10, rnd(-1, 1), rnd(-1.5, -0.3), '#e8e4d8', 30, 1, 0.05));
      }
      if (this.open > 0) this.open--;
      const p = W.player;
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 14 || Math.abs(p.feet - (this.y + this.h)) > 4) return;
      if (!this.ready()) { pzSay('expClosed'); return; }
      pzSay('expIn');
      if (Input.pressed.up) { this.open = 20; Audio8.sfx('door'); start(p, this.d); }
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), ok = this.ready();
      if (sx < -40 || sx > View.w + 40) return;
      ctx.fillStyle = '#5c3c10'; ctx.fillRect(sx + 9, sy - 200, 14, 200);                                                         // Rohr hinauf
      ctx.fillStyle = '#c89838'; ctx.fillRect(sx + 10, sy - 200, 4, 200); ctx.fillStyle = '#8c6420'; ctx.fillRect(sx + 18, sy - 200, 3, 200);
      for (let y = sy - 196; y < sy; y += 24) { ctx.fillStyle = '#e8c870'; ctx.fillRect(sx + 8, y, 16, 2); }                         // Muffen
      ctx.fillStyle = '#3c2408'; ctx.fillRect(sx, sy, 32, 40); ctx.fillStyle = '#c89838'; ctx.fillRect(sx + 1, sy + 1, 30, 38);       // Gehäuse
      ctx.fillStyle = '#1c140c'; ctx.fillRect(sx + 5, sy + 8, 22, 30 - this.open * 0.5);                                               // Klappe
      ctx.fillStyle = '#7c5418'; ctx.fillRect(sx + 6, sy + 9, 20, Math.max(0, 27 - this.open));
      ctx.fillStyle = '#e8c870'; ctx.fillRect(sx + 14, sy + 20, 4, 3);
      ctx.fillStyle = ok ? ((this.t >> 4) & 1 ? '#58f888' : '#2c8c48') : '#e04040'; ctx.fillRect(sx + 13, sy + 2, 6, 4);                // Lampe
      ctx.fillStyle = '#0c1c3c'; const lab = tr('expSign'), w = Font.width(lab) + 8; ctx.fillRect(sx + 16 - w / 2, sy - 14, w, 11);
      Font.draw(ctx, lab, sx + 16, sy - 12, '#f0ead8', { align: 'center' });
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 4 - cy, r: 18, c: this.ready() ? [90, 240, 130] : [240, 70, 60], a: 0.4 }); }
  }
  return { start, ride, active: () => !!R, Station, make: (d) => new Station(d), state: () => R };
})();
