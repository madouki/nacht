// Dorf Unkenbrunn (Oberwelt-Ort D in der Grafschaft Krat, Raum umland_dorf): die Dorfstraße bei Nacht – Pflaster, ferne Dächer im
// Hintergrund, Fachwerkhäuser, Gasthaus „Zur Fetten Unke“, Unkenbrunnen, Gemeindebrett, Laternen, Lichterketten, Rauch aus den
// Schornsteinen und Eulalias schiefer Wetterturm. Bewohner: Wirtin Hulda (heilt), Bürgermeister Unkel (Auftrag Unkenkrone, 5000 Gold)
// und Wetterhexe Eulalia (danach das Donnerwort); deren Gespräche stehen in castle.js (BEATS, QUESTS, SPELLS).
// Dazu ein Abenteuer wie in alten Zeigen-und-Klicken-Spielen (Spielzustand 'abenteuer'): an markierten Dingen ↑ drücken, dann ein
// Verb wählen – ANSEHEN, NEHMEN, BENUTZEN (mit Kram aus der Tasche, auch Kram mit Kram), REDEN; der Held kommentiert alles frech,
// die Brunnenunke führt ein Gespräch mit Antwortwahl. Rätselkette: Angel (Gasthaus) + Büroklammer (Gemeindebrett) = Angel mit Haken
// → am Brunnen erst ein alter Stiefel (die Katze zieht hinein und gibt ihren Geldbeutel frei), dann die goldene Kugel → die Unke
// wird kurz lebendig, bleibt aber lieber Unke und schenkt ihren Siegelring (Urkunde „Froschkönig“). Flags dorf_*.
// Bild: tools/blender/dorf_bl.py → pack_dorf.py → img/dorf3d.png (Figuren 40×48, Füße bei 20/48).
'use strict';
const Dorf = (() => {
  const MAP = {"turm":[0,0,72,160],"haus2":[73,0,96,144],"wirtshaus":[170,0,160,136],"haus":[331,0,112,128],"skyline":[0,161,768,112],"brunnen":[0,274,72,80],"laterne":[73,274,16,64],"brett":[90,274,40,56],"wirtin0":[131,274,40,48],"wirtin1":[172,274,40,48],"buerger0":[213,274,40,48],"buerger1":[254,274,40,48],"eulalia0":[295,274,40,48],"eulalia1":[336,274,40,48],"angel":[377,274,20,48],"katze0":[398,274,40,40],"katze1":[439,274,40,40],"katze2":[480,274,40,40],"unke_wach":[521,274,40,36],"zaun":[562,274,64,24]};
  const C = {}, img = new Image(); let asked = false;
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  const load = () => { if (!asked) { asked = true; img.src = 'img/dorf3d.png?v=' + (window.BUILD || ''); } };
  load(); // gleich vorladen: der Dorfraum soll nicht erst ohne Häuser erscheinen
  function fig(ctx, n, x, feet, flip) {
    load(); const c = C[n]; if (!c) return false;
    ctx.save(); ctx.translate(Math.round(x), Math.round(feet)); if (flip) ctx.scale(-1, 1); ctx.drawImage(c, -20, -48); ctx.restore(); return true;
  }
  const fl = () => Castle.flags;
  // ---------------- Dorfstraße ----------------
  // [Stück, Mitte x in Kacheln, gespiegelt] – unten auf dem Boden, hinter der Spielebene
  const ROW = [['zaun', 2.6], ['haus', 7], ['laterne', 12.2], ['wirtshaus', 18.5], ['laterne', 27.6], ['brunnen', 31], ['brett', 38.5], ['laterne', 41.4],
    ['haus2', 45.5], ['zaun', 50.6], ['turm', 55], ['laterne', 58.4], ['haus', 63, true]];
  const LAMPS = ROW.filter(r => r[0] === 'laterne').map(r => r[1]);
  const SMOKE = [[7, 84 - 56, 128], [45.5, 26 - 48, 146], [63, 56 - 84, 128]]; // Schornsteine: Haus x, Versatz im Bild, Höhe über dem Boden
  const GARLAND = [[23.3, 100, 27.6, 60, 10], [27.6, 60, 41.4, 60, 26], [48.6, 104, 52.9, 112, 8]]; // Lichterketten: von (x, Höhe) nach (x, Höhe), Durchhang
  const BULB = ['#ff6050', '#ffd040', '#60d0ff', '#90ff70', '#ff80e0'];
  const WELL = { x: 31, k: 72 / 2 }; // Brunnen 72×80: Wasserstrahl tritt bei x 57 aus, Becken bei y 60, Steinunke bei (37, 21)
  // Dinge zum Untersuchen: x in Kacheln (Mitte), sy = Sprechhöhe über dem Boden, who = Sprecherfarbe
  const DINGE = [
    { id: 'gardine', x: 7.4, sy: 84, who: 'G' },
    { id: 'angel', x: 14.3, sy: 44, need: () => !fl().dorf_angel },
    { id: 'katze', x: 25.2, sy: 34, who: 'K' },
    { id: 'unke', x: 30.4, sy: 72, who: 'U' },
    { id: 'brett', x: 38.5, sy: 56 },
    { id: 'turm', x: 55, sy: 44, who: 'T' },
  ];
  const COL = { H: '#fcfcfc', U: '#98f070', K: '#c8b0ff', G: '#f0c0a0', T: '#a8d8ff' };
  let pat = null, wakeT = 0, ui = null, nope = 0, GY = 176; // GY: Bodenhöhe der Dorfstraße
  function pflaster() { // 64×14, kachelbar: drei Reihen runder Steine mit Licht oben und Schatten unten
    const c = Sprites.canvas(64, 14), x = c.getContext('2d'); let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    x.fillStyle = '#1c1820'; x.fillRect(0, 0, 64, 14);
    for (let row = 0; row < 3; row++) {
      let px = row % 2 ? -4 : 0; const y = row * 5;
      while (px < 64) {
        const w = 6 + Math.floor(r() * 4), v = 62 + Math.floor(r() * 34) - row * 6;
        for (const ox of [0, -64, 64]) {
          const X = px + ox + 1; if (X > 64 || X + w < 0) continue;
          x.fillStyle = `rgb(${v},${v - 8},${v + 6})`; x.fillRect(X, y, w - 1, 4);
          x.fillStyle = `rgb(${v + 30},${v + 22},${v + 30})`; x.fillRect(X + 1, y, w - 3, 1);
          x.fillStyle = `rgb(${v - 26},${v - 32},${v - 18})`; x.fillRect(X, y + 3, w - 1, 1);
        }
        px += w;
      }
    }
    return c;
  }
  class Strasse extends Ent {
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.gy = GY = (d.y + 1) * T; this.drops = []; this.smoke = []; this.near = null; }
    update() {
      this.t++; if (wakeT > 0) wakeT--;
      if (this.t % 3 === 0) this.drops.push({ x: WELL.x * T - WELL.k + 57 + rnd(-1.5, 1.5), y: this.gy - 20, vx: rnd(-0.5, 0.5), vy: rnd(-1.4, -0.6), t: 0 });
      for (const p of this.drops) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += 0.12; }
      this.drops = this.drops.filter(p => p.t < 18);
      if (this.t % 9 === 0) for (const [hx, ox, h] of SMOKE) this.smoke.push({ x: hx * T + ox + rnd(-1, 1), y: this.gy - h, vx: 0.12 + Math.random() * 0.1, r: 2, t: 0 });
      for (const p of this.smoke) { p.t++; p.x += p.vx + Math.sin((p.t + p.x) * 0.05) * 0.1; p.y -= 0.32; p.r += 0.045; }
      this.smoke = this.smoke.filter(p => p.t < 130);
      const p = W.player; this.near = null;
      if (p && p.alive && p.onGround && Game.state === 'play') for (const d of DINGE) if ((!d.need || d.need()) && Math.abs(p.cx - d.x * T) < 14) { this.near = d; break; }
      if (this.near && Input.pressed.up) open(this.near);
    }
    drawBack(ctx) {
      load(); const cam = W.cam, gy = this.gy - cam.y, t = W.frame || this.t;
      const sky = C.skyline; if (sky) { ctx.globalAlpha = 0.92; ctx.drawImage(sky, Math.round(-cam.x * 0.42) - 30, Math.round(gy - sky.height - 8)); ctx.globalAlpha = 1; } // ferne Dächer
      for (const [k, x, flip] of ROW) {
        const c = C[k]; if (!c) continue;
        const sx = Math.round(x * T - c.width / 2 - cam.x), sy = Math.round(gy - c.height);
        if (sx > View.w + 4 || sx + c.width < -4) continue;
        if (flip) { ctx.save(); ctx.translate(sx + c.width, sy); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, sx, sy);
      }
      const cat = C[fl().dorf_katze ? 'katze2' : (this.near && this.near.id === 'katze') || t % 260 < 26 ? 'katze1' : 'katze0'];
      if (cat) ctx.drawImage(cat, Math.round(25.2 * T - 20 - cam.x), Math.round(gy - 40));
      if (!fl().dorf_angel && C.angel) ctx.drawImage(C.angel, Math.round(14.3 * T - 10 - cam.x), Math.round(gy - 48));
      if (awake() && C.unke_wach) { // die Steinunke wird lebendig (Gespräch, Erlösung)
        const bx = WELL.x * T - 36 - cam.x, by = gy - 80, hop = Math.round(Math.abs(Math.sin((ui ? ui.t : t) * 0.25)) * -2);
        ctx.drawImage(C.unke_wach, Math.round(bx + 17), Math.round(by + 2 + hop));
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; // Lichterketten über der Straße
      GARLAND.forEach(([x0, h0, x1, h1, sag], gi) => {
        const ax = x0 * T - cam.x, ay = gy - h0, bx = x1 * T - cam.x, by = gy - h1; if (Math.max(ax, bx) < -10 || Math.min(ax, bx) > View.w + 10) return;
        const n = Math.max(4, Math.round(Math.abs(bx - ax) / 9));
        for (let i = 1; i < n; i++) {
          const k = i / n, x = ax + (bx - ax) * k, y = ay + (by - ay) * k + sag * 4 * k * (1 - k), on = (t + i * 13 + gi * 7) % 70 > 5;
          ctx.globalAlpha = on ? 0.35 : 0.12; ctx.fillStyle = BULB[(i + gi) % BULB.length]; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 5, 5);
          ctx.globalAlpha = on ? 1 : 0.4; ctx.fillRect(Math.round(x) - 1, Math.round(y), 2, 3);
        }
      });
      ctx.globalAlpha = 1; ctx.restore();
      ctx.strokeStyle = 'rgba(20,14,24,0.85)'; ctx.lineWidth = 1; // die Schnur
      for (const [x0, h0, x1, h1, sag] of GARLAND) { const ax = x0 * T - cam.x, ay = gy - h0, bx = x1 * T - cam.x, by = gy - h1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by); ctx.stroke(); }
      for (const p of this.smoke) { ctx.globalAlpha = 0.3 * (1 - p.t / 130); ctx.fillStyle = '#8c88a4'; ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#c8ecff'; // Spritzer am Brunnen
      for (const p of this.drops) { ctx.globalAlpha = 1 - p.t / 18; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 1, 1); }
      ctx.globalAlpha = 1;
    }
    lightUp(L, cx, cy) { // Fensterschein, Laternen, Brunnen
      for (const [k, x] of ROW) if (k === 'haus' || k === 'haus2' || k === 'wirtshaus' || k === 'turm') L.push({ x: x * T - cx, y: this.gy - 50 - cy, r: 48, c: k === 'turm' ? [200, 150, 255] : [252, 200, 130], a: 0.2 });
      for (const x of LAMPS) L.push({ x: x * T - cx, y: this.gy - 52 - cy, r: 44 + Math.sin(this.t * 0.07 + x) * 2, c: [255, 210, 140], a: 0.42 });
      L.push({ x: WELL.x * T - cx, y: this.gy - 30 - cy, r: 36, c: [120, 200, 255], a: 0.22 });
      if (awake()) L.push({ x: WELL.x * T - cx, y: this.gy - 62 - cy, r: 50, c: [150, 255, 120], a: 0.45 });
    }
    draw(ctx) {
      const cam = W.cam, gy = this.gy - cam.y;
      if (!pat) pat = pflaster();
      for (let x = -(((cam.x % 64) + 64) % 64); x < View.w; x += 64) ctx.drawImage(pat, x, Math.round(gy - 1)); // Pflaster vor den Häusern
      const p = W.player, t = this.t;
      for (const d of DINGE) { // Funkeln an den Dingen, in der Nähe Name und ↑
        if (d.need && !d.need()) continue;
        const x = Math.round(d.x * T - cam.x), y = Math.round(gy - d.sy);
        if (x < -40 || x > View.w + 40) continue;
        if (this.near === d && Game.state === 'play') {
          const nm = tr('dg_' + d.id); Font.draw(ctx, nm, x, y - 12, '#fce0a8', { align: 'center', shadow: '#000' });
          Font.draw(ctx, '↑', x - 2, y - 2 + Math.round(Math.sin(t * 0.12) * 2), '#fcfcfc', { shadow: '#000' });
        } else if (p && Math.abs(p.cx - d.x * T) < 110 && (t + d.x * 9) % 90 < 10) {
          ctx.fillStyle = '#fff4c8'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 3, 1); ctx.fillRect(x, y + 2, 1, 1);
        }
      }
    }
  }
  // ---------------- Abenteuer: Verben, Kram, Gespräch ----------------
  const VERBS = ['look', 'take', 'use', 'talk'];
  const awake = () => wakeT > 0 || !!(ui && ui.d.id === 'unke' && (ui.stage === 'choice' || (ui.stage === 'say' && ui.say[ui.si] && ui.say[ui.si].who === 'U')));
  const kram = () => Castle.kram();
  const iname = (id) => tr('item_' + id);
  const tname = (w) => (typeof w === 'string' ? iname(w) : tr('dg_' + w.id));
  function open(d) { ui = { d, stage: 'verb', v: 0, i: 0, w: 0, c: 0, t: 0, say: null, si: 0, n: 0, after: null, line: '' }; Game.go('abenteuer'); Audio8.sfx('select'); }
  function say(lines, after) { // [Sprecher, Schlüssel, …Werte]
    ui.say = lines.map(([who, k, ...a]) => ({ who, text: tr(k, ...a) })); ui.si = 0; ui.n = 0; ui.after = after || 'verb'; ui.stage = 'say';
  }
  const no = () => [['H', 'dNo' + (1 + (nope++ % 4))]];
  const give = (id) => Castle.giveItem(id, false), drop = (id) => Castle.drop(id), set = (k) => Castle.setFlag(k);
  function look(d) {
    const f = fl(), k = { katze: f.dorf_katze ? 'dl_katze2' : 'dl_katze', unke: f.dorf_prinz ? 'dl_unke2' : 'dl_unke', brett: f.dorf_klammer ? 'dl_brett2' : 'dl_brett' }[d.id] || 'dl_' + d.id;
    return [['H', k]];
  }
  function take(d) {
    const f = fl();
    if (d.id === 'angel') { set('dorf_angel'); give('angel'); Audio8.sfx('item'); return [['H', 'dTakeAngel']]; }
    if (d.id === 'brett') { if (f.dorf_klammer) return [['H', 'dt_brett2']]; set('dorf_klammer'); give('klammer'); Audio8.sfx('item'); return [['H', 'dTakeKlammer']]; }
    if (d.id === 'katze') return f.dorf_katze ? [['H', 'dt_katze'], ['K', 'dMiau']] : [['H', 'dt_katze']];
    return [['H', 'dt_' + d.id]];
  }
  function talk(d) {
    if (d.id === 'unke') { if (fl().dorf_prinz) return [['U', 'dUnkeSchlaf']]; ui.c = 0; say([['U', 'dUnkeHallo']], 'choice'); return null; }
    if (d.id === 'gardine') return [['H', 'dr_gardine'], ['G', 'dr_gardineA']];
    if (d.id === 'katze') return [['H', 'dr_katze'], ['K', 'dMiau']];
    if (d.id === 'turm') return [['H', 'dr_turm'], ['T', 'dr_turmA']];
    return [['H', 'dr_' + d.id]];
  }
  function use(item, target) { // target: ein Ding oder ein Kram-Stück
    const f = fl(), pair = (a, b) => (item === a && target === b) || (item === b && target === a);
    if (pair('angel', 'klammer')) { drop('angel'); drop('klammer'); give('angelhaken'); Audio8.sfx('item'); return [['H', 'dCombine']]; }
    if (typeof target === 'string') return no();
    const id = target.id;
    if (id === 'unke') {
      if (item === 'angel') return [['H', 'dNoHook']];
      if (item === 'klammer') return [['H', 'dClipUnke']];
      if (item === 'stiefel') return [['U', 'dUnkeStiefel']];
      if (item === 'angelhaken') {
        Audio8.sfx('splash');
        if (!f.dorf_stiefel) { set('dorf_stiefel'); give('stiefel'); return [['H', 'dFishBoot'], ['U', 'dUnkeStiefel']]; }
        if (!f.dorf_kugel) { set('dorf_kugel'); give('goldkugel'); Audio8.sfx('bigItem'); return [['H', 'dFishBall'], ['U', 'dUnkeBall']]; }
        return [['H', 'dFishNone']];
      }
      if (item === 'goldkugel') { // Erlösung – die Unke bleibt aber lieber Unke
        drop('goldkugel'); set('dorf_prinz'); wakeT = 260; W.flash = 8; Audio8.sfx('holy'); Audio8.sfx('bigItem');
        for (let i = 0; i < 24; i++) W.spawn(new Particle(WELL.x * T + rnd(-14, 14), GY - 64 + rnd(-10, 10), rnd(-0.8, 0.8), rnd(-1.6, -0.2), i % 2 ? '#98f070' : '#f8d048', 50, 1, 0));
        give('froschring');
        return [['U', 'dPrinz1'], ['U', 'dPrinz2'], ['H', 'dPrinzH'], ['U', 'dPrinz3']];
      }
    }
    if (id === 'katze' && item === 'stiefel' && !f.dorf_katze) {
      drop('stiefel'); set('dorf_katze'); W.addScore(777); Audio8.sfx('money'); const p = W.player; W.popup(p.cx, p.y - 8, '+777 G', '#f8b800');
      return [['H', 'dCatBoot'], ['K', 'dMiau'], ['H', 'dCatGold']];
    }
    if (id === 'katze' && item === 'goldkugel') return [['H', 'dBallKatze']];
    return no();
  }
  const QUESTIONS = [['dQ1', [['U', 'dA1']]], ['dQ2', [['U', 'dA2'], ['H', 'dA2b']]], ['dQ3', [['U', 'dA3'], ['U', 'dA3b']]], ['dQ4', [['U', 'dA4']]]];
  function input(P) { // true = zu
    if (!ui) return true;
    ui.t++; if (wakeT > 0) wakeT--;
    if (ui.t < 6) return false;
    const st = ui.stage, close = () => { ui = null; return true; };
    if (st === 'say') {
      const s = ui.say[ui.si], len = [...s.text].length;
      if (ui.n < len) { ui.n = Math.min(len, ui.n + 1.5); if ((ui.t & 3) === 0) Audio8.sfx('tink'); }
      if (P.start) ui.si = ui.say.length;
      else if (P.jump || P.attack || P.up) { if (ui.n < len) ui.n = len; else { ui.si++; ui.n = 0; Audio8.sfx('select'); } }
      if (ui.si >= ui.say.length) { ui.say = null; if (ui.after === 'close') return close(); ui.stage = ui.after; if (ui.stage === 'verb' && !kram().length) ui.v = Math.min(ui.v, 3); }
      return false;
    }
    if (st === 'choice') {
      if (P.up) { ui.c = (ui.c + QUESTIONS.length - 1) % QUESTIONS.length; Audio8.sfx('select'); }
      if (P.down) { ui.c = (ui.c + 1) % QUESTIONS.length; Audio8.sfx('select'); }
      if (P.start) { ui.stage = 'verb'; return false; }
      if (P.jump || P.attack) { const [q, a] = QUESTIONS[ui.c], bye = ui.c === QUESTIONS.length - 1; say([['H', q], ...a], bye ? 'verb' : 'choice'); }
      return false;
    }
    if (st === 'verb') {
      if (P.left) { ui.v = (ui.v + 3) % 4; Audio8.sfx('select'); }
      if (P.right) { ui.v = (ui.v + 1) % 4; Audio8.sfx('select'); }
      if (P.down || P.start) return close();
      if (P.jump || P.attack) {
        const v = VERBS[ui.v], d = ui.d;
        if (v === 'look') say(look(d));
        else if (v === 'take') say(take(d));
        else if (v === 'talk') { const r = talk(d); if (r) say(r); }
        else if (!kram().length) say([['H', 'dNoKram']]);
        else { ui.stage = 'item'; ui.i = 0; Audio8.sfx('select'); }
      }
      return false;
    }
    const K = kram();
    if (st === 'item') {
      if (!K.length) { ui.stage = 'verb'; return false; }
      ui.i = Math.min(ui.i, K.length - 1);
      if (P.left) { ui.i = (ui.i + K.length - 1) % K.length; Audio8.sfx('select'); }
      if (P.right) { ui.i = (ui.i + 1) % K.length; Audio8.sfx('select'); }
      if (P.down || P.start) { ui.stage = 'verb'; return false; }
      if (P.jump || P.attack) { ui.item = K[ui.i]; if (K.length > 1) { ui.stage = 'with'; ui.w = 0; Audio8.sfx('select'); } else say(use(ui.item, ui.d)); }
      return false;
    }
    if (st === 'with') {
      const opts = [ui.d, ...K.filter(k => k !== ui.item)];
      ui.w = Math.min(ui.w, opts.length - 1);
      if (P.left) { ui.w = (ui.w + opts.length - 1) % opts.length; Audio8.sfx('select'); }
      if (P.right) { ui.w = (ui.w + 1) % opts.length; Audio8.sfx('select'); }
      if (P.down || P.start) { ui.stage = 'item'; return false; }
      if (P.jump || P.attack) say(use(ui.item, opts[ui.w]));
      return false;
    }
    return false;
  }
  function sentence() { // Satzzeile wie in alten Abenteuern: SCHAU UNKENBRUNNEN AN, BENUTZE ANGEL MIT …
    const d = ui.d, K = kram();
    if (ui.stage === 'item' && K.length) return tr('vbS_use', iname(K[Math.min(ui.i, K.length - 1)]));
    if (ui.stage === 'with') { const opts = [d, ...K.filter(k => k !== ui.item)]; return tr('vbS_useWith', iname(ui.item), tname(opts[Math.min(ui.w, opts.length - 1)])); }
    if (ui.stage === 'choice') return tr('vbS_talk', tname(d));
    if (ui.stage === 'say') return ui.line;
    return tr('vbS_' + VERBS[ui.v], tname(d));
  }
  function bubble(ctx, s, n) { // Sprechtext über dem Sprecher, in seiner Farbe
    const cam = W.cam, p = W.player, d = ui.d;
    const ax = s.who === 'H' ? p.cx - cam.x : d.x * T - cam.x, ay = (s.who === 'H' ? p.y - 8 : GY - d.sy) - cam.y + 32;
    const txt = [...s.text].slice(0, Math.floor(n)).join(''), lines = Duell.wrap(txt || ' ', 176);
    const w = Math.max(...lines.map(l => Font.width(l))), x = clamp(Math.round(ax), Math.round(w / 2) + 6, View.w - Math.round(w / 2) - 6), y0 = Math.max(48, Math.round(ay - lines.length * 10));
    lines.forEach((l, i) => Font.draw(ctx, l, x, y0 + i * 10, COL[s.who] || '#fcfcfc', { align: 'center', shadow: '#000' }));
  }
  function drawUI(ctx, t) {
    if (!ui) return;
    const cx = View.cx, s0 = sentence(); if (ui.stage !== 'say') ui.line = s0;
    ctx.fillStyle = 'rgba(8,4,20,0.78)'; ctx.fillRect(0, 34, View.w, 12); ctx.fillStyle = '#5c3c88'; ctx.fillRect(0, 46, View.w, 1);
    Font.draw(ctx, s0, cx, 36, '#f8e0a8', { align: 'center', shadow: '#000' });
    if (ui.stage === 'say') { const s = ui.say[ui.si]; if (s) bubble(ctx, s, ui.n); return; }
    const py = 182, ph = 58;
    ctx.fillStyle = 'rgba(14,8,30,0.92)'; ctx.fillRect(0, py, View.w, ph); ctx.fillStyle = '#7c5cc8'; ctx.fillRect(0, py, View.w, 1); ctx.fillStyle = '#2c1c48'; ctx.fillRect(0, py + 2, View.w, 1);
    if (ui.stage === 'choice') {
      QUESTIONS.forEach(([q], i) => { const on = ui.c === i, y = py + 6 + i * 12; if (on) { ctx.fillStyle = 'rgba(124,92,200,0.35)'; ctx.fillRect(16, y - 2, View.w - 32, 11); }
        Font.draw(ctx, (on ? '> ' : '  ') + tr(q), 22, y, on ? '#fcfcfc' : '#b8a8d8', { shadow: '#000' }); });
      return;
    }
    const bw = Math.min(96, Math.floor((View.w - 24) / 4));
    VERBS.forEach((v, i) => { // Verbleiste
      const x = Math.round(cx - bw * 2 + i * bw), on = ui.v === i && ui.stage === 'verb', act = ui.stage === 'verb' || (v === 'use');
      ctx.fillStyle = on ? 'rgba(124,92,200,0.5)' : 'rgba(40,28,72,0.6)'; ctx.fillRect(x + 2, py + 5, bw - 4, 13);
      ctx.fillStyle = on ? '#fce0a8' : '#4c3c78'; ctx.fillRect(x + 2, py + 5, bw - 4, 1); ctx.fillRect(x + 2, py + 17, bw - 4, 1);
      Font.draw(ctx, tr('vb_' + v), x + bw / 2, py + 8, on ? '#fcfcfc' : act ? '#c8b8e8' : '#6c5c8c', { align: 'center', shadow: '#000' });
    });
    const K = kram(), sel = ui.stage === 'item' ? Math.min(ui.i, K.length - 1) : -1, wsel = ui.stage === 'with' ? ui.w : -1; // Kram in der Tasche
    const opts = ui.stage === 'with' ? [ui.d, ...K.filter(k => k !== ui.item)] : null;
    const row = opts || K, cw = 30, x0 = Math.round(cx - row.length * cw / 2);
    if (!row.length) Font.draw(ctx, tr('vbEmpty'), cx, py + 28, '#6c5c8c', { align: 'center' });
    row.forEach((it, i) => {
      const x = x0 + i * cw, on = i === sel || i === wsel;
      ctx.fillStyle = on ? 'rgba(248,208,72,0.3)' : 'rgba(40,28,72,0.6)'; ctx.fillRect(x + 2, py + 23, cw - 4, 16);
      if (on) { ctx.fillStyle = '#f8d048'; ctx.fillRect(x + 2, py + 23, cw - 4, 1); ctx.fillRect(x + 2, py + 38, cw - 4, 1); }
      if (typeof it === 'string') Castle.itemIcon(ctx, it, x + cw / 2 - 5, py + 26); else Font.draw(ctx, '*', x + cw / 2, py + 27, '#fce0a8', { align: 'center' });
    });
    const nm = ui.stage === 'item' && K.length ? iname(K[sel]) : ui.stage === 'with' ? tname(opts[Math.min(wsel, opts.length - 1)]) : '';
    if (nm) Font.draw(ctx, nm, cx, py + 42, '#f8d048', { align: 'center', shadow: '#000' });
    Font.draw(ctx, tr('vbBack'), cx, py + 50, '#7c6ca0', { align: 'center' });
  }
  return { MAP, C, fig, load, ent: (d) => new Strasse(d), Blitz: null, input, drawUI, DINGE, get ui() { return ui; }, open, use, get awake() { return awake(); } };
})();
// Donnerwort: ein Blitz fährt von oben in den Gegner (Zauber donner in castle.js)
Dorf.Blitz = class Blitz extends Ent {
  constructor(x, y) { super(x - 6, y - 6, 12, 12); this.kind = 'fx'; this.tx = x; this.ty = y; this.seed = Math.random() * 1000; }
  update() { if (++this.t > 16) this.dead = true; }
  lightUp(L, cx, cy) { L.push({ x: this.tx - cx, y: this.ty - cy, r: 70, c: [200, 230, 255], a: 0.6 * (1 - this.t / 16) }); }
  draw(ctx) {
    const cam = W.cam, x0 = this.tx - cam.x, y1 = this.ty - cam.y, top = -10; let s = this.seed + (this.t >> 1) * 7;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const pts = [[x0 + (r() - 0.5) * 30, top]]; for (let k = 1; k < 8; k++) pts.push([x0 + (r() - 0.5) * 18 * (1 - k / 8), top + (y1 - top) * k / 8]); pts.push([x0, y1]);
    ctx.globalAlpha = this.t < 10 ? 1 : 1 - (this.t - 10) / 6;
    for (const [w, col] of [[5, 'rgba(120,180,255,0.45)'], [2, '#c8ecff'], [1, '#ffffff']]) {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
};
function drawWirtin(ctx, cx, feet, t, flip) { // hebt ab und zu den Krug
  if (Dorf.fig(ctx, 'wirtin' + ((t % 200) < 40 ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-8, -20, 16, 20, '#3c8c4c'); R(-5, -19, 10, 17, '#fcf8ec'); R(-6, -28, 12, 8, '#b02c2c'); R(-4, -36, 8, 8, '#e8b088'); R(-5, -40, 10, 4, '#d8602c'); R(7, -24, 4, 6, '#9c6434');
}
function drawBuerger(ctx, cx, feet, t, flip) { // tupft sich die Stirn
  if (Dorf.fig(ctx, 'buerger' + ((t % 240) < 50 ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-7, -26, 14, 18, '#2c4c3c'); R(-5, -22, 10, 12, '#9c2c3c'); R(-3, -8, 2, 8, '#3c3c48'); R(1, -8, 2, 8, '#3c3c48'); R(-4, -34, 8, 8, '#e8b088'); R(-5, -38, 10, 4, '#ece4cc'); R(-1, -18, 2, 2, '#e8b030');
}
function drawEulalia(ctx, cx, feet, t, flip) { // an der Stabspitze knistert es
  if (Dorf.fig(ctx, 'eulalia' + ((t % 150) < 24 && ((t >> 2) & 1) ? 1 : 0), cx, feet, flip)) return;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? cx - x - w : cx + x, feet + y, w, h); };
  R(-7, -26, 14, 26, '#3c3c94'); R(-4, -34, 8, 8, '#e8b088'); R(-6, -36, 12, 3, '#f4f4fc'); R(-5, -40, 10, 4, '#2a2458'); R(-2, -46, 4, 6, '#2a2458'); R(8, -44, 1, 44, '#6c4424'); R(7, -46, 3, 2, '#d8803c');
}
