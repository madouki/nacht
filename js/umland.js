// Die Grafschaft Krat – das Umland (Oberwelt in Draufsicht, Spielzustand 'land'): mit dem Zug vom Bahnhof Krat hinaus. Der Held
// wandert über eine Karte aus Wiesen, Wald, Bergen, Fluss (eine Brücke), Sumpf und Friedhof; Schatten tauchen auf und jagen ihn –
// berührt ihn einer, geht es in einen Kampfplatz in Seitenansicht (je nach Gelände Wiese, Wald, Sumpf oder Friedhof; große
// Schatten bringen Verstärkung). Über den Bildrand des Kampfplatzes geht es zurück an dieselbe Stelle. Orte: Bahnhof (zurück ins
// Schloss), Kräuterhütte (Walburga, Lohn: Kräuterbeutel), Tiefe Höhle (eigener Raum mit Truhe und Lebensgefäß), altes Grab
// (graben: 3000 Gold). Kampfplätze: castle.js (umland_*, offmap), Lied 'umland' (audio.js). Bild: tools/blender/umland_bl.py
// (Diorama bei Mondlicht, 16 px je Kachel) → pack_umland.py → img/umland3d.png; bis es geladen ist, zeichnet paint() die Karte selbst.
// Darüber Nebel über Fluss und Sumpf, Glühwürmchen, ziehende Wolkenschatten, flackernde Laternen und Fackeln, Irrlichter über
// Friedhof und Sumpf und ab und zu ein Fledermausschwarm.
'use strict';
const Umland = (() => {
  const MW = 56, MH = 32, TS = 16, BLOCK = new Set(['M', '~', 'u']);
  const LOC = { S: 'umlandBahnhof', H: 'umlandHuette', K: 'umlandHoehle', G: 'umlandGrab', P: 'umlandPalast', D: 'umlandDorf' };
  let map = null, pre = null, G = null, pendingStation = false, extra = 0, pre3d = false, FX = null;
  const IMG = new Image();
  const HERO_MAP = {"henrik_0_0":[0,0,26,34],"henrik_0_1":[27,0,26,34],"henrik_0_2":[54,0,26,34],"henrik_1_0":[81,0,26,34],"henrik_1_1":[108,0,26,34],"henrik_1_2":[135,0,26,34],"henrik_2_0":[162,0,26,34],"henrik_2_1":[189,0,26,34],"henrik_2_2":[216,0,26,34],"henrik_3_0":[243,0,26,34],"henrik_3_1":[270,0,26,34],"henrik_3_2":[297,0,26,34],"ragnor_0_0":[0,35,26,34],"ragnor_0_1":[27,35,26,34],"ragnor_0_2":[54,35,26,34],"ragnor_1_0":[81,35,26,34],"ragnor_1_1":[108,35,26,34],"ragnor_1_2":[135,35,26,34],"ragnor_2_0":[162,35,26,34],"ragnor_2_1":[189,35,26,34],"ragnor_2_2":[216,35,26,34],"ragnor_3_0":[243,35,26,34],"ragnor_3_1":[270,35,26,34],"ragnor_3_2":[297,35,26,34]}; // Henrik und Ragnor in Schrägsicht (tools/blender/wanderer_bl.py → pack_wanderer.py): <held>_<richtung>_<bild>, 22×30
  const HIMG = new Image(); let HS = null;
  HIMG.onload = () => { HS = {}; for (const [n, r] of Object.entries(HERO_MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(HIMG, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); HS[n] = c; } };
  const LIGHTS = [[228,172,"win"],[236,172,"win"],[220,173,"brew"],[75,425,"lamp"],[122,425,"lamp"],[697,114,"fire"],[727,114,"fire"],[642,219,"lamp"],[728,365,"fire"],[760,365,"fire"],[42,334,"win"],[49,334,"win"],[56,334,"win"],[44,382,"win"],[54,382,"win"],[48,369,"win"],[89,312,"win"],[90,310,"win"],[89,382,"win"],[34,334,"lamp"],[90,358,"lamp"],[719,195,"lamp"],[104,220,"lamp"],[232,220,"lamp"],[543,275,"lamp"],[552,284,"lamp"],[680,284,"lamp"],[104,348,"lamp"],[543,403,"lamp"],[168,412,"lamp"],[296,412,"lamp"],[424,412,"lamp"]]; // Lichtquellen im Diorama [x, y, Art] – von pack_umland.py aus umland_bl.py eingetragen
  const img3d = () => IMG.complete && IMG.naturalWidth > 0;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function build() {
    seed = 7;
    const m = Array.from({ length: MH }, () => Array(MW).fill('.')), set = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) m[y][x] = c; };
    const ell = (cx, cy, rx, ry, c, jag = 0.25) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 - jag * rnd()) set(x, y, c); };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x < 1 || y < 1 || x > MW - 2 || y > MH - 2 || ((x < 2 || y < 2 || x > MW - 3 || y > MH - 3) && rnd() < 0.6)) set(x, y, 'M');
    ell(40, 3, 15, 4.5, 'M'); ell(53, 14, 3, 6, 'M'); ell(3, 4, 4, 3, 'M');
    ell(12, 12, 9, 7, 'T'); ell(30, 28, 11, 3.2, 'T'); ell(50, 30, 6, 3, 'T'); ell(27, 7, 4, 3, 'T');
    ell(46, 23, 7, 4.5, 's');
    for (let y = 11; y <= 15; y++) for (let x = 36; x <= 43; x++) set(x, y, '+');
    for (let i = 0; i < 50; i++) { const x = 2 + Math.floor(rnd() * (MW - 4)), y = 2 + Math.floor(rnd() * (MH - 4)); if (m[y][x] === '.') set(x, y, rnd() < 0.5 ? 'h' : 'T'); }
    for (let y = 1; y < MH - 1; y++) { const x = 21 + Math.round(2 * Math.sin(y / 4.5)); set(x, y, '~'); set(x + 1, y, '~'); }
    const road = (pts) => { for (let i = 0; i < pts.length - 1; i++) { let [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1]; for (let n = 0; n < 200; n++) { set(x0, y0, m[y0][x0] === '~' || m[y0][x0] === 'B' ? 'B' : '='); if (x0 === x1 && y0 === y1) break; if (x0 !== x1) x0 += Math.sign(x1 - x0); else y0 += Math.sign(y1 - y0); } } };
    road([[6, 26], [33, 26], [33, 16], [36, 13]]); road([[33, 18], [44, 18], [44, 9]]); road([[6, 26], [6, 14], [14, 14], [14, 11]]);
    for (let y = 8; y <= 12; y++) for (let x = 12; x <= 16; x++) if (m[y][x] === 'T' || m[y][x] === 'h') set(x, y, '.');
    for (let x = 42; x <= 46; x++) set(x, 7, 'M');
    for (const [x, y] of [[2, 20], [3, 20], [2, 23], [3, 23], [5, 19], [5, 23]]) set(x, y, 'u'); // Dorf Unkenbrunn: Gasthaus, Rathaus, Wetterturm, Häuschen (nicht begehbar)
    road([[6, 21], [4, 21]]); road([[2, 21], [2, 22], [5, 22]]); set(3, 21, 'D');                                                           // Dorfplatz mit dem Unkenbrunnen
    set(6, 26, 'S'); set(14, 10, 'H'); set(44, 8, 'K'); set(40, 13, 'G'); set(46, 22, 'P');
    return m;
  }
  const at = (x, y) => (map[Math.floor(y / TS)] || [])[Math.floor(x / TS)] || 'M';
  const free = (x, y) => !BLOCK.has(at(x, y));
  // ---------------- Kacheln (einmal vorgerendert, nächtliche Pixelkunst) ----------------
  function paint() {
    pre = Sprites.canvas(MW * TS, MH * TS); const x = pre.getContext('2d'); seed = 99;
    if (img3d()) { x.drawImage(IMG, 0, 0, MW * TS, MH * TS); pre3d = true; return; }   // das Blender-Diorama
    const R = (c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
    const grass = (X, Y, dark) => {
      R(dark ? '#24401e' : '#2f5428', X, Y, TS, TS);
      for (let i = 0; i < 4; i++) R(dark ? '#2a4a22' : (rnd() < 0.5 ? '#36602e' : '#2a4a24'), X + Math.floor(rnd() * 12), Y + Math.floor(rnd() * 12), 3 + Math.floor(rnd() * 3), 2 + Math.floor(rnd() * 3)); // Flecken
      for (let i = 0; i < 7; i++) R(dark ? '#30562a' : '#447a38', X + Math.floor(rnd() * 15), Y + Math.floor(rnd() * 14), 1, 2); // Halme
      if (!dark && rnd() < 0.12) { const fx = X + 3 + Math.floor(rnd() * 9), fy = Y + 3 + Math.floor(rnd() * 9), fc = ['#e8e0f0', '#f8d048', '#c880e8'][Math.floor(rnd() * 3)]; R(fc, fx, fy, 1, 1); R(fc, fx + 2, fy + 1, 1, 1); R(fc, fx + 1, fy + 3, 1, 1); } // Blumen
      if (rnd() < 0.05) { const sx = X + 3 + Math.floor(rnd() * 9), sy = Y + 4 + Math.floor(rnd() * 8); R('#5c5c58', sx, sy, 3, 2); R('#8c8c84', sx, sy, 2, 1); } // Stein
    };
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      const c = map[ty][tx], X = tx * TS, Y = ty * TS;
      if (c === '~' || c === 'B') { R('#13305c', X, Y, TS, TS); for (let i = 0; i < 3; i++) R('#1c4478', X + Math.floor(rnd() * 12), Y + Math.floor(rnd() * 14), 4, 1); }
      else if (c === 'M') R('#2e2a34', X, Y, TS, TS);
      else if (c === 's') { R('#1e2c1a', X, Y, TS, TS); R('#2c4038', X + 2 + Math.floor(rnd() * 6), Y + 4 + Math.floor(rnd() * 6), 7, 3); for (let i = 0; i < 3; i++) R('#4c6c34', X + Math.floor(rnd() * 15), Y + Math.floor(rnd() * 10), 1, 4); }
      else if (c === '+' || c === 'G') { grass(X, Y, true); if (rnd() < 0.5) { const a = X + 3 + Math.floor(rnd() * 8), b = Y + 3 + Math.floor(rnd() * 6); R('#5c5c68', a + 1, b, 2, 7); R('#5c5c68', a - 1, b + 2, 6, 2); R('#8c8c98', a + 1, b, 1, 6); } }
      else grass(X, Y, c === 'T');
      if (c === '=' || c === 'S') { R('#6c5838', X + 2, Y, 12, TS); R('#8c7448', X + 3, Y, 10, TS); for (let i = 0; i < 3; i++) R('#a08858', X + 4 + Math.floor(rnd() * 8), Y + Math.floor(rnd() * 15), 1, 1); }
      if (c === 'B') { R('#4c2c14', X, Y + 1, TS, 14); for (let k = 0; k < 4; k++) R(k % 2 ? '#8c5c2c' : '#7c4c24', X + k * 4, Y + 2, 3, 12); R('#a87040', X, Y + 1, TS, 1); R('#a87040', X, Y + 14, TS, 1); }
      if (c === 's') { if (rnd() < 0.5) { R('#3c5c28', X + 4 + Math.floor(rnd() * 8), Y + 6, 4, 3); R('#5c8c3c', X + 5 + Math.floor(rnd() * 6), Y + 6, 2, 1); } for (let i = 0; i < 2; i++) { const rx = X + 2 + Math.floor(rnd() * 12); R('#6c7c3c', rx, Y + 3 + Math.floor(rnd() * 6), 1, 5); R('#8c6c3c', rx, Y + 2, 1, 2); } } // Seerosen, Schilf
      if (c === 'h') { x.fillStyle = '#3c6c30'; x.beginPath(); x.ellipse(X + 8, Y + 11, 7, 4, 0, Math.PI, 0); x.fill(); R('#4c8040', X + 4, Y + 8, 5, 1); }
    }
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) if (map[ty][tx] === '~') { // helle Uferkanten
      const X = tx * TS, Y = ty * TS, land = (dx, dy) => { const c2 = (map[ty + dy] || [])[tx + dx]; return c2 && c2 !== '~' && c2 !== 'B'; };
      if (land(-1, 0)) R('#6c9cd8', X, Y, 1, TS); if (land(1, 0)) R('#6c9cd8', X + TS - 1, Y, 1, TS); if (land(0, -1)) R('#6c9cd8', X, Y, TS, 1); if (land(0, 1)) R('#4c7cb8', X, Y + TS - 1, TS, 1);
    }
    const big = []; for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const c = map[ty][tx]; if (c === 'M' || c === 'T') big.push([ty, tx, c]); }
    for (const [ty, tx, c] of big) { // zweiter Durchgang, von oben nach unten: große Gipfel und dichte Kronen, die überlappen
      const X = tx * TS, Y = ty * TS;
      if (c === 'M') { const w = 20 + Math.floor(rnd() * 8), h = 16 + Math.floor(rnd() * 10), px = X + 8 + Math.floor(rnd() * 4) - 2, by = Y + TS;
        x.fillStyle = '#1c1820'; x.beginPath(); x.moveTo(px - w / 2 - 1, by); x.lineTo(px, by - h - 1); x.lineTo(px + w / 2 + 1, by); x.fill();
        x.fillStyle = '#4a4452'; x.beginPath(); x.moveTo(px - w / 2, by); x.lineTo(px, by - h); x.lineTo(px + w / 2, by); x.fill();
        x.fillStyle = '#6e6678'; x.beginPath(); x.moveTo(px - w / 2, by); x.lineTo(px, by - h); x.lineTo(px - 2, by); x.fill(); // Mondseite
        x.fillStyle = '#e0e0f0'; x.beginPath(); x.moveTo(px, by - h); x.lineTo(px + h * 0.18, by - h * 0.68); x.lineTo(px + 1, by - h * 0.74); x.lineTo(px - h * 0.2, by - h * 0.64); x.fill(); } // Schneekappe
      else for (let k = 0; k < 3; k++) { const a = X + 3 + Math.floor(rnd() * 10), b = Y + 3 + Math.floor(rnd() * 9), r = 5 + Math.floor(rnd() * 3);
        x.fillStyle = '#0e2814'; x.beginPath(); x.arc(a, b + 1, r + 1, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1c4424'; x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#2a5e30'; x.beginPath(); x.arc(a - 1, b - 1, r - 2, 0, Math.PI * 2); x.fill(); R('#3e7c3c', a - 3, b - 3, 2, 1); R('#3e7c3c', a - 2, b - 4, 1, 1); }
    }
    const loc = (c, f) => { for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) if (map[ty][tx] === c) f(tx * TS, ty * TS); };
    loc('S', (X, Y) => { R('#2c1c18', X - 6, Y - 10, 28, 20); R('#8c3c2c', X - 5, Y - 9, 26, 7); R('#c85c3c', X - 5, Y - 9, 26, 1); R('#9c8468', X - 4, Y - 2, 24, 10); R('#f8d878', X + 1, Y + 1, 4, 4); R('#f8d878', X + 13, Y + 1, 4, 4); R('#3c2c1c', X + 7, Y + 2, 4, 6); for (let k = -1; k < 3; k++) { R('#5c5c64', X - 12 + k * 12, Y + 12, 10, 1); R('#3c2c1c', X - 9 + k * 12, Y + 11, 2, 3); } });
    loc('H', (X, Y) => { R('#2c1c10', X - 1, Y + 2, 18, 13); x.fillStyle = '#8c6c34'; x.beginPath(); x.moveTo(X - 4, Y + 5); x.lineTo(X + 8, Y - 6); x.lineTo(X + 20, Y + 5); x.fill(); x.fillStyle = '#b08c44'; x.beginPath(); x.moveTo(X - 2, Y + 4); x.lineTo(X + 8, Y - 4); x.lineTo(X + 10, Y - 2); x.lineTo(X + 2, Y + 4); x.fill(); R('#6c4c2c', X + 1, Y + 5, 14, 9); R('#f8c868', X + 3, Y + 7, 3, 3); R('#3c2410', X + 9, Y + 8, 4, 6); R('#5c5c64', X + 12, Y - 5, 3, 6); });
    loc('K', (X, Y) => { R('#3c3440', X - 4, Y - 2, 24, 18); x.fillStyle = '#08060c'; x.beginPath(); x.arc(X + 8, Y + 10, 7, Math.PI, 0); x.fill(); R('#08060c', X + 1, Y + 10, 14, 6); R('#6c6470', X - 2, Y + 2, 3, 2); R('#6c6470', X + 15, Y + 4, 3, 2); });
    loc('D', (X, Y) => { R('#16101a', X + 2, Y + 4, 13, 11); R('#7c7c8c', X + 3, Y + 5, 11, 9); R('#3c78c8', X + 4, Y + 6, 9, 4); R('#5c9c4c', X + 6, Y + 1, 5, 5); R('#e8c84c', X + 6, Y + 1, 1, 1); R('#e8c84c', X + 10, Y + 1, 1, 1); });
    loc('u', (X, Y) => { R('#2c1c10', X + 1, Y + 3, 15, 12); x.fillStyle = '#a83c2c'; x.beginPath(); x.moveTo(X - 1, Y + 6); x.lineTo(X + 8, Y - 3); x.lineTo(X + 17, Y + 6); x.fill(); R('#e0d0b0', X + 2, Y + 6, 13, 8); R('#f8c868', X + 4, Y + 8, 3, 3); R('#4c2c14', X + 9, Y + 9, 3, 5); });
    loc('G', (X, Y) => { R('#16101a', X + 3, Y - 2, 11, 16); x.fillStyle = '#7c7c8c'; x.beginPath(); x.moveTo(X + 4, Y + 13); x.lineTo(X + 4, Y + 2); x.arc(X + 8.5, Y + 2, 4.5, Math.PI, 0); x.lineTo(X + 13, Y + 13); x.fill(); R('#a8a8b8', X + 5, Y + 1, 1, 10); R('#3c3c48', X + 8, Y + 2, 1, 7); R('#3c3c48', X + 6, Y + 4, 5, 1); R('#5c3c24', X + 2, Y + 13, 13, 2); });
  }
  // ---------------- Spiel ----------------
  function ensure() { if (!map) { map = build(); if (!IMG.src) IMG.src = 'img/umland3d.png?v=' + (window.BUILD || ''); if (!HIMG.src) HIMG.src = 'img/wanderer3d.png?v=' + (window.BUILD || ''); paint(); fxInit(); } }
  function fxInit() { // Nebelschwaden über Fluss und Sumpf, Glühwürmchen, Wolkenschatten – feste Plätze, Bewegung nur beim Zeichnen
    let s = 31; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, fog = [], flies = [];
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const c = map[ty][tx];
      if ((c === 's' && r() < 0.24) || (c === '~' && r() < 0.14)) fog.push({ x: tx * TS + 8, y: ty * TS + 8, p: r() * 6.28, w: 34 + r() * 34 });
      if ((c === '.' || c === 's' || c === 'T' || c === 'h') && r() < 0.06) flies.push({ x: tx * TS + r() * 16, y: ty * TS + r() * 16, p: r() * 6.28, q: 0.6 + r() * 0.8 }); }
    const glow = (n, col) => { const c = Sprites.canvas(n, n), g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
    const wisps = [];   // Irrlichter: kalte Lichter, die über Friedhof und Sumpf schweben
    for (const [c, n] of [['+', 2], ['s', 3]]) { const cells = []; for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) if (map[ty][tx] === c) cells.push([tx, ty]);
      for (let i = 0; i < n && cells.length; i++) { const [tx, ty] = cells[Math.floor(r() * cells.length)]; wisps.push({ x: tx * TS + 8, y: ty * TS + 8, p: r() * 6.28, q: 0.6 + r() * 0.6 }); } }
    FX = { fog, flies, wisps, bats: [], puff: glow(64, 'rgba(196,206,236,0.5)'), cloud: glow(128, 'rgba(2,4,18,0.55)'), fly: glow(12, 'rgba(220,255,140,0.9)'),
      warm: glow(32, 'rgba(255,176,90,0.55)'), fire: glow(40, 'rgba(255,130,50,0.6)'), brew: glow(28, 'rgba(110,255,130,0.55)'), wisp: glow(24, 'rgba(140,220,255,0.8)') };
  }
  function start() { // vom Bahnhof Krat aus
    ensure(); const st = spot('S');
    G = { x: st.x, y: st.y + 18, dir: 2, step: 0, blobs: [], t: 0, talk: null, msg: null, inv: 90, gate: true };
    Audio8.sfx('door'); Audio8.play('umland', null, 0.6); Game.go('land');
    if (!Castle.flags.umland_seen) { Castle.setFlag('umland_seen'); G.msg = { k: 'umlandHilfe', t: 300 }; }
  }
  let dorf = null; const nearDorf = (x, y, r) => { dorf = dorf || spot('D'); return Math.hypot(x - dorf.x, y - dorf.y) < r; };
  function spot(c) { for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) if (map[ty][tx] === c) return { x: tx * TS + 8, y: ty * TS + 8 }; return { x: 100, y: 100 }; }
  function resume() { // vom Kampfplatz zurück an dieselbe Stelle
    if (!G) return start();
    G.blobs = G.blobs.filter(b => !b.hit); G.inv = 120; Audio8.sfx('door'); Audio8.play('umland', null, 0.5); Game.go('land');
  }
  const ROOM = { T: 'umland_wald', s: 'umland_sumpf', '+': 'umland_friedhof', G: 'umland_friedhof' };
  function encounter(b) {
    b.hit = true; extra = b.big ? 2 : 0; const f = Castle.side[ROOM[at(G.x, G.y)] || 'umland_wiese'];
    Audio8.sfx('stinger'); W.flash = 8;
    if (f) Game.castleGo({ s: f.s, r: f.r, place: 'start' });
  }
  function enter(c) {
    if (c === 'S') { pendingStation = true; G.gate = false; const f = Castle.side.bahnhof; Game.castleGo({ s: f.s, r: f.r, place: 'start' }); return; }
    if (c === 'D') { const f = Castle.side.umland_dorf; extra = 0; if (f) Game.castleGo({ s: f.s, r: f.r, place: 'start' }); return; }
    if (c === 'P') { const f = Castle.side.umland_palast; extra = 0; if (f) Game.castleGo({ s: f.s, r: f.r, place: 'start' }); return; }
    if (c === 'K') { const f = Castle.side.umland_hoehle; extra = 0; Castle.setFlag('umland_hoehle'); if (f) Game.castleGo({ s: f.s, r: f.r, place: 'start' }); return; }
    if (c === 'H') {
      if (!Castle.flags.umland_hut) G.talk = { lines: trList('story_walburga'), i: 0, give: true };
      else G.talk = { lines: ['W:' + tr('walburgaAgain')], i: 0 };
      Audio8.sfx('door'); return;
    }
    if (c === 'G') {
      if (Castle.flags.umland_grab) { G.msg = { k: 'umlandLeer', t: 160 }; Audio8.sfx('crumble'); return; }
      Castle.setFlag('umland_grab'); W.score += 3000; G.msg = { k: 'grabFund', t: 320 }; Audio8.sfx('crumble'); Audio8.sfx('money');
    }
  }
  const trList = (k) => { const v = I18N.t(k); return Array.isArray(v) ? v : [v]; };
  function input(P, I) {
    if (!G) return true;
    G.t++; if (G.msg && --G.msg.t <= 0) G.msg = null;
    if (G.talk) { // Gespräch in der Hütte
      if (P.jump || P.attack || P.up || P.start) { Audio8.sfx('select'); if (++G.talk.i >= G.talk.lines.length) { if (G.talk.give && !Castle.flags.umland_hut) { Castle.setFlag('umland_hut'); Castle.giveItem('kraeuter', false); } G.talk = null; } }
      return false;
    }
    const mx = (I.right ? 1 : 0) - (I.left ? 1 : 0), my = (I.down ? 1 : 0) - (I.up ? 1 : 0), c0 = at(G.x, G.y);
    const sp = (c0 === 's' ? 0.62 : c0 === 'T' ? 0.86 : 1.12) / (mx && my ? 1.41 : 1);
    G.mv = !!(mx || my); if (mx || my) { G.step += sp; G.dir = my > 0 ? 2 : my < 0 ? 0 : mx > 0 ? 1 : 3; }
    const nx = G.x + mx * sp, ny = G.y + my * sp;
    if (free(nx - 5, G.y + 4) && free(nx + 5, G.y + 4)) G.x = nx;
    if (free(G.x - 5, ny + 4) && free(G.x + 5, ny + 4) && free(G.x, ny - 2)) G.y = ny;
    G.x = clamp(G.x, 8, MW * TS - 8); G.y = clamp(G.y, 8, MH * TS - 8);
    const here = at(G.x, G.y), near = LOC[here] ? here : null;
    if (near && (P.up || P.attack) && G.inv <= 60) { enter(near); return false; }
    if (G.inv > 0) G.inv--;
    // Schatten: tauchen auf, jagen, ziehen in den Kampf
    if (G.t % 150 === 0 && G.blobs.length < 3) {
      for (let n = 0; n < 30; n++) { const a = rnd() * Math.PI * 2, d = 150 + rnd() * 70, x = G.x + Math.cos(a) * d, y = G.y + Math.sin(a) * d;
        if (x < 24 || y < 24 || x > MW * TS - 24 || y > MH * TS - 24 || !free(x, y) || LOC[at(x, y)] || nearDorf(x, y, 90)) continue;
        G.blobs.push({ x, y, big: rnd() < 0.3, t: 0, hit: false }); break; }
    }
    for (const b of G.blobs) {
      b.t++; const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy) || 1, v = (b.big ? 0.5 : 0.66) * (nearDorf(G.x, G.y, 60) ? -1.4 : 1); // im Dorf bist du sicher
      b.x += dx / d * v + Math.sin(b.t * 0.13) * 0.3; b.y += dy / d * v + Math.cos(b.t * 0.11) * 0.3;
      if (d < 9 && G.inv <= 0 && !LOC[here] && !nearDorf(G.x, G.y, 60)) { encounter(b); return false; }
    }
    G.blobs = G.blobs.filter(b => !b.hit && b.t < 1000);
    return false;
  }
  // ---------------- Zeichnen ----------------
  function hero(ctx, x, y, dir, step, t, moving = !!(G && G.mv)) { // Held in Schrägsicht: Blender-Figur mit Laterne, sonst kleine Pixelfigur (14×18)
    if (!HIMG.src) HIMG.src = 'img/wanderer3d.png?v=' + (window.BUILD || '');
    if (HS) {
      const who = typeof Options !== 'undefined' && Options.character === 'ragnor' ? 'ragnor' : 'henrik', fr = moving ? [1, 0, 2, 0][Math.floor(step / 4) % 4] : 0, im = HS[who + '_' + dir + '_' + fr];
      if (im) { ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y + 7), 6, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(im, Math.round(x - 13), Math.round(y - 24)); return; }
    }
    const f = Math.floor(step / 5) % 2, R = (c, X, Y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + X), Math.round(y + Y), w, h); };
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y + 7), 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    R('#1c1010', -4, 2 + (f ? 1 : 0), 3, 5); R('#1c1010', 1, 2 + (f ? 0 : 1), 3, 5);           // Beine
    R('#2c0c0c', -5, -6, 10, 9); R('#9c2c2c', -4, -5, 8, 8); R('#d8a040', -4, 0, 8, 1);   // Mantel, Gürtel
    if (dir === 1 || dir === 3) R('#7c5c34', dir === 1 ? 3 : -5, -2, 2, 4);                // Peitsche am Gürtel
    R('#1c1010', -4, -13, 8, 8); R('#e8b088', -3, -12, 6, 6);                                // Kopf
    R('#5c3818', -3, -13, 6, dir === 0 ? 5 : 2); if (dir === 2) { R('#1c1010', -2, -10, 1, 1); R('#1c1010', 1, -10, 1, 1); } else if (dir !== 0) R('#1c1010', dir === 1 ? 1 : -2, -10, 1, 1);
  }
  function blob(ctx, b, t) {
    const x = Math.round(b.x), y = Math.round(b.y), s = b.big ? 1.4 : 1, w = Math.sin(b.t * 0.2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 7 * s, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#120818'; ctx.beginPath(); ctx.ellipse(x, y - 2 * s + w, 6 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (b.big) { ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x - 9, y - 16); ctx.lineTo(x - 3, y - 11); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 6, y - 10); ctx.lineTo(x + 9, y - 16); ctx.lineTo(x + 3, y - 11); ctx.fill(); }
    ctx.fillStyle = '#2c1438'; ctx.fillRect(x - 3, y - 6 * s + w, 6, 2);
    ctx.fillStyle = (t >> 3) & 1 ? '#ff4040' : '#ff8060'; ctx.fillRect(x - 3, y - 3 * s + w, 2, 2); ctx.fillRect(x + 1, y - 3 * s + w, 2, 2);
  }
  function draw(ctx, t) {
    if (!G) return; ensure();
    const vw = View.w, vh = 240, cx = Math.round(clamp(G.x - vw / 2, 0, MW * TS - vw)), cy = Math.round(clamp(G.y - vh / 2, 0, MH * TS - vh));
    ctx.fillStyle = '#06040c'; ctx.fillRect(0, 0, vw, vh);
    if (!pre3d && img3d()) paint();   // das Diorama ist inzwischen geladen
    ctx.drawImage(pre, cx, cy, Math.min(vw, MW * TS), vh, 0, 0, Math.min(vw, MW * TS), vh);
    ctx.save(); ctx.translate(-cx, -cy);
    const vis = (x, y, m) => x > cx - m && x < cx + vw + m && y > cy - m && y < cy + vh + m;
    for (let ty = Math.floor(cy / TS); ty <= Math.floor((cy + vh) / TS); ty++) for (let tx = Math.floor(cx / TS); tx <= Math.floor((cx + vw) / TS); tx++) { // Wellen glitzern im Mondlicht
      if ((map[ty] || [])[tx] !== '~') continue; const k = (tx * 7 + ty * 3 + (t >> 4)) % (pre3d ? 7 : 5); if (k < 2) { ctx.fillStyle = pre3d ? (k ? 'rgba(150,190,255,0.55)' : 'rgba(220,236,255,0.8)') : (k ? '#4c7cc0' : '#7cacf0'); ctx.fillRect(tx * TS + 3 + k * 5, ty * TS + 5 + ((t >> 3) + tx) % 6, pre3d ? 2 : 3, 1); } }
    if (pre3d) { ctx.globalCompositeOperation = 'lighter'; // Laternen, Fenster, Fackeln und Kessel flackern
      LIGHTS.forEach(([x, y, k], i) => { if (!vis(x, y, 30)) return; const fl = 0.75 + 0.18 * Math.sin(t * 0.31 + i * 1.7) * Math.sin(t * 0.13 + i * 0.9) + (k === 'fire' ? 0.12 * Math.sin(t * 0.9 + i) : 0);
        const im = k === 'fire' ? FX.fire : k === 'brew' ? FX.brew : FX.warm, sz = (k === 'fire' ? 40 : k === 'win' ? 20 : k === 'brew' ? 28 : 30) * (0.92 + 0.08 * fl);
        ctx.globalAlpha = Math.min(1, fl * (k === 'win' ? 0.6 : 0.85)); ctx.drawImage(im, Math.round(x - sz / 2), Math.round(y - sz / 2), Math.round(sz), Math.round(sz)); });
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    for (const f of FX.fog) { const x = f.x + Math.sin(t * 0.006 + f.p) * 10, y = f.y + Math.cos(t * 0.004 + f.p) * 3; if (!vis(x, y, 60)) continue; // Nebelschwaden
      ctx.globalAlpha = 0.32 + 0.18 * Math.sin(t * 0.01 + f.p); ctx.drawImage(FX.puff, Math.round(x - f.w / 2), Math.round(y - f.w * 0.22), Math.round(f.w), Math.round(f.w * 0.44)); }
    ctx.globalAlpha = 1;
    const hut = spot('H'), chx = hut.x + (pre3d ? 4 : 6), chy = hut.y - (pre3d ? 10 : 14);
    for (let k = 0; k < 4; k++) { const p = ((t * 0.3 + k * 9) % 36); ctx.fillStyle = 'rgba(200,200,210,' + (0.5 - p / 80).toFixed(2) + ')'; ctx.fillRect(Math.round(chx + Math.sin(p / 6) * 2), Math.round(chy - p), 2, 2); } // Rauch aus dem Schornstein
    const st = spot('S'); ctx.fillStyle = 'rgba(248,216,120,' + ((pre3d ? 0.08 : 0.18) + 0.06 * Math.sin(t * 0.1)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(st.x, st.y, 20, 0, Math.PI * 2); ctx.fill();
    const ents = G.blobs.map(b => ({ y: b.y, d: () => blob(ctx, b, t) })).concat([{ y: G.y, d: () => hero(ctx, G.x, G.y, G.dir, G.step, t) }]);
    ents.sort((a, b) => a.y - b.y).forEach(e => e.d());
    for (const f of FX.flies) { const x = f.x + Math.sin(t * 0.02 * f.q + f.p) * 6, y = f.y + Math.cos(t * 0.017 * f.q + f.p * 2) * 4, a = Math.sin(t * 0.045 * f.q + f.p); // Glühwürmchen
      if (a <= 0 || !vis(x, y, 10)) continue; ctx.globalAlpha = a; ctx.drawImage(FX.fly, Math.round(x) - 6, Math.round(y) - 6); ctx.fillStyle = '#f4ffc0'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    ctx.globalCompositeOperation = 'lighter';
    for (const w of FX.wisps) { const x = w.x + Math.sin(t * 0.011 * w.q + w.p) * 22, y = w.y + Math.sin(t * 0.017 * w.q + w.p * 2) * 9 - 6, a = 0.45 + 0.4 * Math.sin(t * 0.05 + w.p); // Irrlichter
      if (!vis(x, y, 20)) continue; ctx.globalAlpha = Math.max(0, a); ctx.drawImage(FX.wisp, Math.round(x) - 12, Math.round(y) - 12); ctx.fillStyle = '#e8fbff'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!FX.bats.length && G.t % 840 === 400) { const dir = (G.t / 840) % 2 < 1 ? 1 : -1, y0 = cy + 40 + ((G.t * 7) % 120); // ab und zu ein Fledermausschwarm vor dem Mond
      for (let i = 0; i < 5; i++) FX.bats.push({ x: dir > 0 ? cx - 20 - i * 14 : cx + vw + 20 + i * 14, y: y0 + ((i * 37) % 30) - 15, v: dir * (1.5 + (i % 3) * 0.25), p: i * 1.3 }); }
    ctx.fillStyle = '#0a0610';
    for (const b of FX.bats) { b.x += b.v; b.p += 0.35; const x = Math.round(b.x), y = Math.round(b.y + Math.sin(b.p * 0.3) * 4), f = Math.sin(b.p) > 0 ? 1 : 0;
      ctx.fillRect(x - 1, y, 3, 2); ctx.fillRect(x - 4, y - 1 - f * 2, 3, 1 + f); ctx.fillRect(x + 2, y - 1 - f * 2, 3, 1 + f); }
    FX.bats = FX.bats.filter(b => b.x > cx - 120 && b.x < cx + vw + 120);
    for (let k = 0; k < 4; k++) { const x = ((k * 330 + t * 0.12) % (MW * TS + 320)) - 160, y = 60 + ((k * 197) % (MH * TS - 120)) + Math.sin(t * 0.002 + k) * 20; // Wolkenschatten ziehen über das Land
      if (!vis(x, y, 160)) continue; ctx.globalAlpha = 0.5; ctx.drawImage(FX.cloud, Math.round(x - 130), Math.round(y - 70), 260, 140); }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (pre3d) { // Tilt-Shift wie bei einer Miniaturlandschaft: oben und unten verschwimmt das Bild, die Mitte bleibt scharf
      const c = FX.tilt || (FX.tilt = Sprites.canvas(vw, vh)), x = c.getContext('2d');
      if (c.width !== vw || c.height !== vh) { c.width = vw; c.height = vh; }
      x.globalCompositeOperation = 'copy'; x.filter = 'blur(1.4px)'; x.drawImage(ctx.canvas, 0, 0, vw, vh, 0, 0, vw, vh); x.filter = 'none';
      x.globalCompositeOperation = 'destination-in'; if (!FX.tiltG) { FX.tiltG = x.createLinearGradient(0, 0, 0, vh); FX.tiltG.addColorStop(0, 'rgba(0,0,0,1)'); FX.tiltG.addColorStop(0.3, 'rgba(0,0,0,0)'); FX.tiltG.addColorStop(0.7, 'rgba(0,0,0,0)'); FX.tiltG.addColorStop(1, 'rgba(0,0,0,1)'); }
      x.fillStyle = FX.tiltG; x.fillRect(0, 0, vw, vh); x.globalCompositeOperation = 'source-over'; ctx.drawImage(c, 0, 0);
    }
    // Nacht: blauer Schleier, Blutmond, Vignette
    const hx = G.x - cx, hy = G.y - cy, dk = ctx.createRadialGradient(hx, hy, 18, hx, hy, 150); dk.addColorStop(0, 'rgba(255,200,120,0.10)'); dk.addColorStop(0.35, 'rgba(14,10,44,0.08)'); dk.addColorStop(1, pre3d ? 'rgba(10,8,36,0.26)' : 'rgba(10,8,36,0.42)'); // Laternenschein des Helden
    ctx.fillStyle = dk; ctx.fillRect(0, 0, vw, vh);
    const mg = ctx.createRadialGradient(vw - 40, 30, 4, vw - 40, 30, 60); mg.addColorStop(0, 'rgba(255,110,90,0.35)'); mg.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = mg; ctx.fillRect(vw - 100, 0, 100, 90);
    ctx.fillStyle = '#c83c3c'; ctx.beginPath(); ctx.arc(vw - 40, 30, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e86c5c'; ctx.beginPath(); ctx.arc(vw - 43, 27, 4, 0, Math.PI * 2); ctx.fill();
    const vg = ctx.createRadialGradient(vw / 2, vh / 2, vh * 0.45, vw / 2, vh / 2, vw * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
    // Anzeigen
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(4, 4, Font.width(tr('umlandTitel')) + 10, 13); ctx.fillStyle = '#c89020'; ctx.fillRect(4, 16, Font.width(tr('umlandTitel')) + 10, 1);
    Font.draw(ctx, tr('umlandTitel'), 9, 7, '#fce0a8', { shadow: '#000' });
    const here = at(G.x, G.y);
    if (LOC[here] && !G.talk) {
      const s = tr(LOC[here]), h = tr(here === 'S' ? 'umlandZug' : here === 'G' ? 'umlandGraben' : 'umlandBetreten');
      const w = Math.max(Font.width(s), Font.width(h)) + 14; ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(Math.round(vw / 2 - w / 2), 196, w, 24); ctx.fillStyle = '#c89020'; ctx.fillRect(Math.round(vw / 2 - w / 2), 196, w, 1);
      Font.draw(ctx, s, vw / 2, 200, '#fce0a8', { align: 'center', shadow: '#000' }); Font.draw(ctx, h, vw / 2, 210, (t >> 4) & 1 ? '#fcfcfc' : '#b0a080', { align: 'center', shadow: '#000' });
    }
    if (G.msg) { const ls = Duell.wrap(tr(G.msg.k), vw - 40); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(14, 150, vw - 28, ls.length * 10 + 8); ls.forEach((l, i) => Font.draw(ctx, l, vw / 2, 155 + i * 10, '#fce0a8', { align: 'center', shadow: '#000' })); }
    if (G.talk) { // Gesprächskasten: W = Walburga, H = Held
      const raw = G.talk.lines[G.talk.i] || '', who = raw[1] === ':' ? raw[0] : 'W', txt = raw[1] === ':' ? raw.slice(2) : raw, ls = Duell.wrap(txt, vw - 44);
      const h = ls.length * 10 + 22, y = 236 - h; ctx.fillStyle = 'rgba(8,4,12,0.9)'; ctx.fillRect(12, y, vw - 24, h); ctx.fillStyle = '#c89020'; ctx.fillRect(12, y, vw - 24, 1); ctx.fillRect(12, y + h - 1, vw - 24, 1);
      Font.draw(ctx, who === 'H' ? tr('umlandDu') : tr('npcWalburga'), 20, y + 4, who === 'H' ? '#a4e4fc' : '#a8e070', { shadow: '#000' });
      ls.forEach((l, i) => Font.draw(ctx, l, 20, y + 15 + i * 10, '#fcfcfc', { shadow: '#000' }));
    }
  }
  // ---------------- Bahnhof: Zug ins Umland; Kampfplatz: Rand führt zurück ----------------
  class Zug extends Ent {
    constructor(d) { super(d.x * T - 16, (d.y + 1) * T - 40, 48, 40); this.kind = 'prop'; }
    update() {
      this.t++; const p = W.player;
      if (this.t === 2 && pendingStation) { pendingStation = false; p.x = this.cx - p.w / 2; p.y = this.y + this.h - p.h; p.vx = p.vy = 0; }
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 26 || Math.abs(p.feet - (this.y + this.h)) > 4 || Game.state !== 'play' || W.arenaOn) return;
      pzSay('umlandEinsteigen'); if (Input.pressed.up) start();
    }
    draw(ctx) { // Schild am Bahnsteig: GLEIS 2 – UMLAND
      const sx = Math.round(this.cx - W.cam.x), sy = Math.round(this.y - W.cam.y); if (sx < -40 || sx > View.w + 40) return;
      ctx.fillStyle = '#3c2c1c'; ctx.fillRect(sx - 1, sy + 8, 3, 32); const lab = tr('umlandGleis'), w = Font.width(lab) + 10;
      ctx.fillStyle = '#1c3c6c'; ctx.fillRect(sx - w / 2, sy, w, 11); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(sx - w / 2, sy, w, 1); ctx.fillRect(sx - w / 2, sy + 10, w, 1);
      Font.draw(ctx, lab, sx, sy + 2, '#fcfcfc', { align: 'center' });
    }
  }
  class Rand extends Ent { // unsichtbar: über den Rand des Kampfplatzes zurück ins Umland; große Schatten bringen Verstärkung
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.quiet = !!(d && d.quiet); }
    update() {
      this.t++; const p = W.player;
      if (this.t === 3 && extra) { const gy = 11 * T; for (let i = 0; i < extra; i++) { const x = (W.room.w - 8 - i * 6) * T; W.spawn(i % 2 ? new Panther(x / T, 10) : new Knight(x / T, 10)); } extra = 0; }
      if (this.t === 3 && !this.quiet && !Castle.flags.umland_kampf) { Castle.setFlag('umland_kampf'); Game.note('umlandKampf'); }
      if (Game.state === 'play' && p.alive && this.t > 20 && (p.x < 3 || p.x + p.w > W.room.w * T - 3)) resume();
    }
    draw() {}
  }
  return { start, resume, input, draw, gate: (d) => new Zug(d), edge: (d) => new Rand(d), get game() { return G; }, get look() { return pre3d ? '3d' : 'pixel'; }, heroAt: hero, get canvas() { return pre; }, get map() { ensure(); return map; }, at: (x, y) => { ensure(); return at(x, y); }, spot: (c) => { ensure(); return spot(c); }, encounter, enter, TS };
})();
