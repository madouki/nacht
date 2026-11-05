// Rohrpost-Express (Schloss-Modus): Eilzustellung für Personen zwischen Aktenkeller und Rohrpostamt. An der Station (Messingrohr mit
// Klappe) ↑ drücken: der Held steigt in die Kapsel und saust in Ego-Sicht durch die Röhre (Tunnel aus einer Nachschlagetabelle in
// halber Auflösung, gemalte Messingtextur). ← → kreist die Kapsel an der Röhrenwand entlang, Sprung = Druckstoß (schneller), Angriff
// = Peitsche nach vorn (zerschlägt Leitz-Ordner). Weichenklappen sperren eine Röhrenhälfte, Gitter lassen nur eine Lücke frei, Ordner
// fliegen entgegen, Briefmarken bringen Gold. Ohne Kratzer zugestellt: Urkunde „Eilzustellung“. Die Station im Rohrpostamt fährt
// erst, wenn man einmal aus dem Aktenkeller angekommen ist (sonst wäre sie eine Abkürzung am Amtsschimmel vorbei).
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
  function course(seed) { // Hindernisse entlang der Strecke: wird schwerer, je weiter es geht
    let s = seed; const rn = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const o = []; let z = 260;
    while (z < LEN - 120) {
      const k = z / LEN, r = rn(), a = rn() * Math.PI * 2;
      if (r < 0.28) o.push({ t: 'flap', z, a });
      else if (r < 0.48 && k > 0.2) o.push({ t: 'grate', z, a, gap: 0.55 - k * 0.12 });
      else if (r < 0.78) { for (let i = 0; i < 2 + (k > 0.5 ? 1 : 0); i++) o.push({ t: 'folder', z: z + i * 26, a: a + (rn() - 0.5) * 1.6, col: ['#3c6cc8', '#c83c3c', '#3c9c58', '#e8c040'][Math.floor(rn() * 4)] }); }
      else for (let i = 0; i < 5; i++) o.push({ t: 'stamp', z: z + i * 18, a: a + i * 0.28 });                 // Briefmarken im Bogen
      z += 110 - k * 30 + rn() * 50;
    }
    return o;
  }
  function start(p, st) {
    if (!lut) makeLut(); if (!tex) makeTex();
    R = { t: 0, z: 0, sp: 2.4, th: -Math.PI / 2, vth: 0, boost: 0, cool: 0, whip: 0, obs: course(st.dest === 'rohrpost' ? 4242 : 1717), stamps: 0, hits: 0, dest: st.dest, end: 0, flash: 24, shake: 0 };
    p.state = 'express'; p.vx = p.vy = 0;
    Audio8.sfx('whoosh'); Audio8.sfx('hiss'); Audio8.play('galopp'); Input.rumble(0.5, 0.4, 300);
    W.spawn(new ExpressView());
  }
  function hurt(p, o) {
    R.hits++; R.sp = Math.max(1.6, R.sp * 0.55); R.flash = -10; R.shake = 12;
    p.hp = Math.max(1, p.hp - 2); Audio8.sfx('hurt'); Audio8.sfx('crumble'); Input.rumble(0.6, 0.6, 250);
    W.popup(p.cx, p.y - 10, tr(o.t === 'flap' ? 'expFlap' : o.t === 'grate' ? 'expGrate' : 'expFolder'), '#fc7460');
  }
  function ride(p, I, P) { // vom Helden-Update aufgerufen (Zustand 'express')
    if (!R) { p.state = 'normal'; return; }
    if (R.done) { if (W.room !== R.room) { R = null; p.state = 'normal'; } return; } // Überblendung zum Zielraum läuft
    R.t++; if (R.flash > 0) R.flash--; else if (R.flash < 0) R.flash++; if (R.shake > 0) R.shake--;
    if (R.end) { if (++R.end > 40) finish(p); return; }
    R.vth += ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 0.0075; R.vth *= 0.86; R.th += R.vth;
    if (P.jump && R.cool <= 0) { R.boost = 50; R.cool = 110; Audio8.sfx('hiss'); Audio8.sfx('whoosh'); }
    if (R.boost > 0) R.boost--; if (R.cool > 0) R.cool--;
    if (P.attack && R.whip <= 0) { R.whip = 18; Audio8.sfx('whip'); }
    if (R.whip > 0) R.whip--;
    R.sp += ((Math.min(4.4, 2.4 + R.t * 0.0007) + (R.boost > 0 ? 1.8 : 0)) - R.sp) * 0.05;
    R.z += R.sp;
    const me = R.th + Math.PI / 2; // Platz der Kapsel an der Röhrenwand (unten im Bild)
    for (const o of R.obs) {
      if (o.done) continue;
      const dz = o.z - R.z, df = Math.abs(ang(o.a - me));
      if (o.t === 'folder' && R.whip > 6 && dz > 0 && dz < 90 && df < 0.55) { o.done = true; o.broke = true; Audio8.sfx('crumble'); W.popup(p.cx, p.y - 10, '+50', '#f8b800'); W.addScore(50); continue; }
      if (dz > 2) continue;
      o.done = true;
      if (o.t === 'flap' && df < Math.PI / 2 - 0.12) hurt(p, o);
      else if (o.t === 'grate' && df > o.gap) hurt(p, o);
      else if (o.t === 'folder' && df < 0.32) hurt(p, o);
      else if (o.t === 'stamp' && df < 0.38) { R.stamps++; W.addScore(100); Audio8.sfx('money'); }
      else if (o.t !== 'stamp') Audio8.sfx('whoosh');
    }
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
  class ExpressView extends Ent {
    constructor() { super(0, 0, 1, 1); this.kind = 'fx'; }
    update() { if (!R) this.dead = true; }
    draw() { }
    drawLit(ctx) {
      if (!R) return;
      const vw = View.w, cx = vw / 2, cy = 104, d8 = img.data, U = lut.u, D = lut.d, rot = R.th / (Math.PI * 2) * TW, zz = R.z * 0.5;
      for (let i = 0, n = LW * LH; i < n; i++) { // Röhrenwand: Textur nach Winkel und Tiefe, zur Mitte hin dunkler
        const dd = D[i], u = ((U[i] + rot) | 0) & 127, v = ((dd * 0.5 + zz) | 0) & 127, t = (v * TW + u) * 4, f = Math.min(1, 26 / dd + 0.02), j = i * 4;
        d8[j] = tex[t] * f; d8[j + 1] = tex[t + 1] * f; d8[j + 2] = tex[t + 2] * f; d8[j + 3] = 255;
      }
      cx2.putImageData(img, 0, 0);
      const sh = R.shake ? ((R.t >> 1) & 1) * 2 - 1 : 0;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, 0, 0, LW, LH, sh, 0, vw, 208);
      // Hindernisse von hinten nach vorn
      const vis = R.obs.filter(o => !o.done && o.z - R.z > 2 && o.z - R.z < 700).sort((a, b) => b.z - a.z);
      for (const o of vis) {
        const dz = o.z - R.z, r = 2 * F / dz, s = ang(o.a - R.th), fog = Math.min(1, 900 / (dz * dz) * 6);
        ctx.globalAlpha = Math.min(1, fog);
        if (o.t === 'flap') { // Weichenklappe: Messingplatte über einer Röhrenhälfte
          ctx.fillStyle = '#7c5418'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s - Math.PI / 2, s + Math.PI / 2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#c89838'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * 0.92, s - Math.PI / 2 + 0.05, s + Math.PI / 2 - 0.05); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#5c3c10'; for (let k = 0; k < 7; k++) { const a = s - Math.PI / 2 + 0.2 + k * 0.45; ctx.fillRect(cx + Math.cos(a) * r * 0.8 - 1, cy + Math.sin(a) * r * 0.8 - 1, Math.max(1, r / 40), Math.max(1, r / 40)); }
          ctx.fillStyle = '#e8c870'; ctx.fillRect(cx - 1, cy - 1, 3, 3);
        } else if (o.t === 'grate') { // Gitter: nur eine Lücke frei
          ctx.strokeStyle = '#4c5060'; ctx.lineWidth = Math.max(1, r / 22);
          ctx.beginPath(); ctx.arc(cx, cy, r, s + o.gap, s - o.gap + Math.PI * 2); ctx.stroke();
          for (let a = o.gap; a < Math.PI * 2 - o.gap; a += 0.26) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(s + a) * r, cy + Math.sin(s + a) * r); ctx.stroke(); }
          ctx.fillStyle = '#9ca0b0'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r * 0.08), 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#58f888'; ctx.lineWidth = Math.max(1, r / 40); ctx.beginPath(); ctx.arc(cx, cy, r * 0.97, s - o.gap + 0.04, s + o.gap - 0.04); ctx.stroke(); // grün = frei
        } else { // Ordner und Briefmarken stehen an der Wand
          const px = cx + Math.cos(s) * r * 0.82, py = cy + Math.sin(s) * r * 0.82, k = r / 60;
          ctx.save(); ctx.translate(px, py); ctx.rotate(s - Math.PI / 2);
          if (o.t === 'folder') { const w = 16 * k, h = 22 * k; ctx.fillStyle = '#100c14'; ctx.fillRect(-w / 2 - 1, -h - 1, w + 2, h + 2); ctx.fillStyle = o.col; ctx.fillRect(-w / 2, -h, w, h); ctx.fillStyle = '#f0ead8'; ctx.fillRect(-w / 4, -h * 0.85, w / 2, h * 0.3); ctx.fillStyle = '#1c1820'; ctx.fillRect(-w / 8, -h * 0.35, w / 4, w / 4); }
          else { const w = 12 * k; ctx.fillStyle = '#f8f4e8'; ctx.fillRect(-w / 2, -w * 1.2, w, w * 1.2); ctx.fillStyle = '#c82c2c'; ctx.fillRect(-w / 2 + w * 0.15, -w * 1.05, w * 0.7, w * 0.9); ctx.fillStyle = '#f8d048'; ctx.fillRect(-w * 0.12, -w * 0.75, w * 0.24, w * 0.3); }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // Peitsche nach vorn, Kapselrand, Tempo-Striche
      if (R.whip > 6) { ctx.strokeStyle = '#c89050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 30, 208); ctx.quadraticCurveTo(cx + 10, 150, cx, 124 - (18 - R.whip) * 2); ctx.stroke(); }
      if (R.boost > 0 || R.sp > 3.5) { ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 14; k++) { const a = (k * 2.39 + R.t * 0.07) % (Math.PI * 2), r0 = 60 + ((R.t * 9 + k * 37) % 120); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + 22), cy + Math.sin(a) * (r0 + 22)); ctx.stroke(); } }
      ctx.fillStyle = '#1c140c'; ctx.fillRect(0, 196, vw, 12); ctx.fillStyle = '#c89838'; ctx.fillRect(0, 196, vw, 1); // Kapselrand unten
      ctx.fillStyle = '#e8c870'; ctx.fillRect(cx - 4, 190, 8, 6); ctx.fillStyle = '#58f888'; ctx.fillRect(cx - 1, 192, 2, 2);     // Peilmarke: hier ist die Kapsel
      // Anzeige: Strecke, Briefmarken, Druckstoß
      const k = Math.min(1, R.z / LEN); ctx.fillStyle = 'rgba(8,6,14,0.7)'; ctx.fillRect(8, 6, vw - 16, 13);
      ctx.fillStyle = '#5c4414'; ctx.fillRect(12, 10, vw - 24, 5); ctx.fillStyle = '#f8d048'; ctx.fillRect(12, 10, (vw - 24) * k, 5);
      Font.draw(ctx, tr('expStamps', R.stamps), 12, 22, '#f8f4e8', { shadow: '#000' });
      Font.draw(ctx, tr(R.cool > 0 ? 'expWait' : 'expBoost'), vw - 12, 22, R.cool > 0 ? '#8c8c9c' : '#58f888', { align: 'right', shadow: '#000' });
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
