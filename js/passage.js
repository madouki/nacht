// Lichterpassage (Schloss-Modus, links am Bahnhof Krat): eine Einkaufspassage der Belle Époque unter einem Glastonnendach, auf das
// der Regen trommelt. Zwei Geschosse Ladenfronten mit vergoldeten Schildern (Hutmacher, Konditorei, Parfümerie, Puppenklinik),
// eine Galerie mit Jugendstilgeländer, Gaslaternen, ein Café mit Marmortischchen. Es ist nach Ladenschluss – und die
// Schaufensterpuppen sind noch da. Sie bewegen sich nur, wenn man ihnen den Rücken zukehrt; sieht man hin, erstarren sie mitten in
// der Bewegung in einer neuen Pose. Schaufenster lassen sich einschlagen (Beute, manchmal steigt eine Puppe heraus), und die
// Kristalllüster unter dem Glasdach hängen an morschen Ketten: wer darunter durchläuft, hört es klirren – dann stürzen sie.
'use strict';

const Passage = (() => {
  const C = (w, h) => Sprites.canvas(w, h);
  const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
  const hn = (X, Y, s) => { let n = Math.imul(X * 374761393 + Y * 668265263 + s * 1442695041, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

  // ---------------- Kacheln: Mosaikboden auf grünem Marmor, Galerie aus Gusseisen mit Jugendstilranken ----------------
  function tile(kind, o = {}) {
    const c = C(16, 16), x = c.getContext('2d'), v = o.v || 0, s = 17 + v * 13 + (o.crack ? 5 : 0) + (o.chip ? 9 : 0);
    if (kind === 'alt') { // Galerieboden: Laufblech mit Messingkante, darunter eine Ranke als Konsole, dazwischen Durchblick
      px(x, '#1c2a24', 0, 0, 16, 4); px(x, '#c8a050', 0, 0, 16, 1); px(x, '#3c5a4a', 0, 1, 16, 1); px(x, '#0c1410', 0, 3, 16, 1);
      for (let X = (v % 2) * 2; X < 16; X += 4) px(x, '#5c7c6a', X, 2);
      x.strokeStyle = '#2c4438'; x.lineWidth = 1.4; x.beginPath(); x.arc(8, 8, 3.2, Math.PI * 0.2, Math.PI * 1.8); x.stroke(); // Ranke
      x.beginPath(); x.moveTo(8, 4); x.quadraticCurveTo(14, 6, 13, 12); x.stroke(); x.beginPath(); x.moveTo(8, 4); x.quadraticCurveTo(2, 6, 3, 12); x.stroke();
      px(x, '#c8a050', 7, 7, 2, 2);
      return c;
    }
    // Körper: grüner Marmor mit Adern
    for (let Y = 0; Y < 16; Y++) for (let X = 0; X < 16; X++) {
      const k = hn(X, Y, s), vein = Math.abs(Math.sin((X + v * 5) * 0.55 + Y * 0.31 + s) * 6 - Y + 8) < 0.7;
      px(x, vein ? '#6c9c84' : k < 0.3 ? '#14281e' : k > 0.85 ? '#2c5040' : '#1c3a2c', X, Y);
    }
    if (o.crack) { px(x, '#08100c', 4, 6, 1, 4); px(x, '#08100c', 5, 9, 3, 1); }
    if (kind === 'top') { // Oberkante: Mosaikband mit Mäander, Goldfuge, darunter cremeweißer Marmor
      px(x, '#e8dcc0', 0, 0, 16, 5); px(x, '#c8b890', 0, 4, 16, 1);
      for (let X = 0; X < 16; X++) for (let Y = 1; Y < 4; Y++) if (((X + v * 4) % 8 < 4) !== (Y === 2 && (X % 4 === 1 || X % 4 === 2))) px(x, (X >> 2) % 2 ? '#8c2430' : '#2c4c7c', X, Y); // Mäander in Rot und Blau
      px(x, '#e0b84c', 0, 5, 16, 1); px(x, '#0c1410', 0, 6, 16, 1);
    }
    return c;
  }

  // ---------------- Kulisse: Glastonnendach, Galeriegeschoss mit Rundbogenfenstern, Ladenzeile (einmal gemalt, 512 breit) ----------------
  let wall = null, wallKey = '';
  const SHOPS = [ // Schild, Lackfarbe, Ware im Schaufenster
    { key: 'passShop0', col: '#1c3c2c', ware: 'hats' }, { key: 'passShop1', col: '#5c1420', ware: 'cakes' },
    { key: 'passShop2', col: '#2c1c48', ware: 'bottles' }, { key: 'passShop3', col: '#1c1c24', ware: 'dolls' },
  ];
  function ware(x, kind, X, Y, w, h, seed) { // Auslage hinter dem Glas
    const R = (i) => hn(i, seed, 7);
    if (kind === 'hats') for (let i = 0; i < 4; i++) { const hx = X + 6 + i * ((w - 12) / 4), hy = Y + h - 18 - (i % 2) * 14, col = ['#8c2430', '#2c4c7c', '#c8a050', '#3c5a2c'][i];
      px(x, '#6c5c48', hx + 6, hy + 8, 2, 18 - (i % 2 ? 0 : 14) + (i % 2) * 14); px(x, col, hx, hy + 4, 14, 3); px(x, col, hx + 3, hy, 8, 5); px(x, '#e8dcc0', hx + 3, hy + 3, 8, 1); if (R(i) < 0.6) { px(x, '#f0f0f0', hx + 10, hy - 4, 1, 5); px(x, '#f0f0f0', hx + 11, hy - 6, 1, 3); } } // Hüte auf Ständern, Federn
    else if (kind === 'cakes') for (let i = 0; i < 3; i++) { const cx = X + 10 + i * ((w - 20) / 3), cy = Y + h - 6, tiers = 1 + (i % 3);
      px(x, '#c8c0b0', cx - 2, cy - 2, 20, 2);
      for (let t = 0; t < tiers; t++) { const tw = 16 - t * 4, ty = cy - 8 - t * 7; px(x, ['#f0d8e0', '#f8f0d8', '#e0b0c0'][t], cx + (16 - tw) / 2, ty, tw, 6); px(x, '#c8203c', cx + (16 - tw) / 2, ty, tw, 1); }
      px(x, '#c8203c', cx + 7, cy - 10 - tiers * 7, 2, 2); } // Torten mit Kirsche
    else if (kind === 'bottles') for (let i = 0; i < 6; i++) { const bx = X + 6 + i * ((w - 12) / 6), by = Y + h - 6 - (i % 2) * 12, col = ['#c84c8c', '#4c8cc8', '#c8a050', '#58c88c', '#a04cc8', '#e8e8f0'][i];
      px(x, '#8c7c68', bx - 2, by, 12, 2); px(x, col, bx, by - 12, 8, 12); px(x, '#ffffff', bx + 1, by - 11, 1, 8); px(x, '#c8a050', bx + 2, by - 16, 4, 4); } // Flakons auf Etageren
    else for (let i = 0; i < 3; i++) { const dx = X + 8 + i * ((w - 16) / 3), dy = Y + h - 4; // Puppen auf Ständern, eine schaut her
      px(x, '#6c5c48', dx + 5, dy - 10, 2, 10); px(x, ['#7c2c48', '#2c5c7c', '#5c4c2c'][i], dx + 1, dy - 26, 10, 16); px(x, '#f0e8dc', dx + 3, dy - 33, 6, 7);
      px(x, '#141018', dx + 4, dy - 30, 1, 1); px(x, '#141018', dx + (i === 1 ? 6 : 7), dy - 30, 1, 1); px(x, '#f0e8dc', dx - 1, dy - 22, 2, 8); px(x, '#f0e8dc', dx + 11, dy - 24, 2, 8); }
  }
  function paintWall() {
    const W0 = 512, H0 = 272, c = C(W0, H0), x = c.getContext('2d');
    // Glastonnendach: Glasfelder vor dem Nachthimmel, Eisenrippen als Bögen, Firstlaterne
    const sky = x.createLinearGradient(0, 0, 0, 72); sky.addColorStop(0, '#141c40'); sky.addColorStop(0.6, '#26305c'); sky.addColorStop(1, '#3a3c64'); x.fillStyle = sky; x.fillRect(0, 0, W0, 72);
    for (let X = 0; X < W0; X += 16) for (let Y = 0; Y < 66; Y += 11) { px(x, (X / 16 + Y / 11) % 3 ? 'rgba(140,170,230,0.22)' : 'rgba(180,205,250,0.3)', X + 1, Y + 1, 14, 9); px(x, 'rgba(255,255,255,0.12)', X + 1, Y + 1, 14, 1); }
    { const mg = x.createRadialGradient(400, 18, 2, 400, 18, 70); mg.addColorStop(0, 'rgba(240,240,255,0.5)'); mg.addColorStop(0.15, 'rgba(200,210,255,0.2)'); mg.addColorStop(1, 'rgba(200,210,255,0)'); x.fillStyle = mg; x.fillRect(330, 0, 140, 72); } // der Mond hinter dem nassen Glas
    x.strokeStyle = '#2c3c38'; x.lineWidth = 3;
    for (let X = 0; X <= W0; X += 64) { x.beginPath(); x.moveTo(X, 72); x.quadraticCurveTo(X + 6, 20, X + 32, 0); x.stroke(); x.beginPath(); x.moveTo(X + 64, 72); x.quadraticCurveTo(X + 58, 20, X + 32, 0); x.stroke(); }
    x.lineWidth = 1; x.strokeStyle = '#5c7c6c'; for (let X = 0; X <= W0; X += 64) { x.beginPath(); x.moveTo(X - 1, 72); x.quadraticCurveTo(X + 5, 20, X + 31, 0); x.stroke(); }
    px(x, '#1c2c28', 0, 66, W0, 8); px(x, '#c8a050', 0, 66, W0, 1); px(x, '#5c7c6c', 0, 67, W0, 1); // Traufgesims
    for (let X = 4; X < W0; X += 8) px(x, '#0c1410', X, 70, 4, 4); // Zahnschnitt
    // Galeriegeschoss: Rundbogenfenster mit Sprossen, Pilaster mit Ranken, Laternen
    px(x, '#d8c8a8', 0, 74, W0, 72); for (let Y = 74; Y < 146; Y += 8) px(x, '#c8b894', 0, Y, W0, 1);
    for (let X = 0; X < W0; X += 64) {
      px(x, '#b8a47c', X, 74, 8, 72); px(x, '#e8dcc0', X + 1, 74, 2, 72); px(x, '#8c7454', X + 7, 74, 1, 72); // Pilaster
      x.strokeStyle = '#3c5a4a'; x.lineWidth = 1; x.beginPath(); for (let Y = 80; Y < 142; Y += 10) { x.moveTo(X + 4, Y); x.quadraticCurveTo(X + 8, Y + 5, X + 4, Y + 10); } x.stroke();
      const wx = X + 18, wy = 84, ww = 36, wh = 52; // Rundbogenfenster
      x.fillStyle = '#5c4834'; x.beginPath(); x.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 3, Math.PI, 0); x.lineTo(wx + ww + 3, wy + wh); x.lineTo(wx - 3, wy + wh); x.closePath(); x.fill();
      const gl = x.createLinearGradient(0, wy, 0, wy + wh); gl.addColorStop(0, '#f8d890'); gl.addColorStop(1, '#c87c38'); x.fillStyle = gl; // warmes Licht der Wohnungen
      x.beginPath(); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); x.lineTo(wx, wy + wh); x.closePath(); x.fill();
      x.strokeStyle = '#3c2c1c'; x.lineWidth = 2; x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.moveTo(wx, wy + 30); x.lineTo(wx + ww, wy + 30); x.stroke();
      x.lineWidth = 1; x.beginPath(); x.arc(wx + ww / 2, wy + ww / 2, ww / 4, Math.PI, 0); x.stroke();
      if (hn(X, 3, 1) < 0.5) { px(x, 'rgba(40,20,10,0.75)', wx + 4, wy + 34, 9, 18); px(x, 'rgba(40,20,10,0.75)', wx + 6, wy + 30, 5, 5); } // ein Schatten am Fenster
      px(x, '#2c3c34', X + 8, 140, 56, 6); x.strokeStyle = '#3c5a4a'; for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(X + 12 + k * 8, 143, 3, 0, Math.PI); x.stroke(); } // Brüstungsgitter
    }
    // Ladenzeile: lackierte Holzfronten, vergoldete Schilder, große Schaufenster, Türen mit Glas
    px(x, '#2a2018', 0, 146, W0, 4); px(x, '#c8a050', 0, 146, W0, 1);
    SHOPS.forEach((S, i) => {
      const X = i * 128, txt = tr(S.key);
      px(x, S.col, X + 4, 150, 120, 104); px(x, 'rgba(255,255,255,0.08)', X + 4, 150, 120, 2); px(x, 'rgba(0,0,0,0.35)', X + 122, 150, 2, 104);
      px(x, '#141010', X + 10, 152, 108, 15); px(x, '#c8a050', X + 10, 152, 108, 1); px(x, '#c8a050', X + 10, 166, 108, 1); // Schildbrett
      const tc = C(108, 12), tx = tc.getContext('2d'); Font.draw(tx, txt.length > 17 ? txt.slice(0, 17) : txt, 54, 3, '#e8c060', { align: 'center' }); x.drawImage(tc, X + 10, 154);
      const gx = X + 12, gy = 172, gw = 72, gh = 66; // Schaufenster
      px(x, '#0c0a10', gx - 2, gy - 2, gw + 4, gh + 4);
      const sg = x.createLinearGradient(0, gy, 0, gy + gh); sg.addColorStop(0, '#f8e0a8'); sg.addColorStop(1, '#a86c38'); x.fillStyle = sg; x.fillRect(gx, gy, gw, gh); // warm beleuchtete Auslage
      ware(x, S.ware, gx, gy, gw, gh, i + 3);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.moveTo(gx + 8, gy); x.lineTo(gx + 20, gy); x.lineTo(gx + 6, gy + gh); x.lineTo(gx - 6 + 6, gy + gh); x.closePath(); x.fill(); // Spiegelung
      px(x, '#c8a050', gx - 2, gy + gh + 2, gw + 4, 1);
      const dx = X + 92, dy = 172; px(x, '#0c0a10', dx - 1, dy - 1, 24, 78); px(x, S.col, dx, dy, 22, 76); px(x, 'rgba(250,220,160,0.5)', dx + 3, dy + 4, 16, 34); px(x, '#c8a050', dx + 17, dy + 44, 2, 3); // Tür
      px(x, '#141010', X, 150, 4, 104); px(x, '#3c2c20', X + 1, 150, 2, 104); // Trennpfosten
    });
    px(x, '#1c1410', 0, 254, W0, 18); for (let X = 0; X < W0; X += 8) px(x, '#2c2018', X, 256, 6, 2); // Sockel
    return c;
  }
  // ---------------- PS2-3D vor der Fassade: Markisen über den Schaufenstern, Gaslaternen an Eisenarmen ----------------
  // In Kachel-Perspektive an die gemalte Wand geheftet (PS2.drawLocal): die Markise ragt schräg zum Betrachter, man sieht je nach
  // Stand ihre Unterseite und die Seitenwangen; die Laterne hängt an einem Arm vor dem Pfeiler zwischen zwei Läden
  const AWN = ['#a8182c', '#1c6c3c', '#1c3c8c', '#7c1c4c'], hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const meshA = [], holders = new Map();
  function awningMesh(i) { // gestreifte Markise mit Volant (Bogenkante), Seitenwangen, Eisenstangen
    if (meshA[i]) return meshA[i];
    const P = PS2, m = P.mesh(), A = hex(AWN[i % AWN.length]), CR = [236, 226, 200], IR = [40, 36, 44], n = 8, W2 = 42, D = -28, Y = -15;
    for (let k = 0; k < n; k++) { // Streifen von der Wand (z 0) schräg hinab zur Vorderkante
      const x0 = -W2 + k * 2 * W2 / n, x1 = x0 + 2 * W2 / n, col = k % 2 ? CR : A;
      P.face(m, [P.vtx(m, x0, 0, 0), P.vtx(m, x1, 0, 0), P.vtx(m, x1, Y, D), P.vtx(m, x0, Y, D)], col, null, { two: true });
      P.face(m, [P.vtx(m, x0, Y, D), P.vtx(m, x1, Y, D), P.vtx(m, (x0 + x1) / 2, Y - 5, D - 1)], col, null, { two: true }); // Volant (Zacke)
    }
    for (const sx of [-W2, W2]) P.face(m, [P.vtx(m, sx, 0, 0), P.vtx(m, sx, Y, D), P.vtx(m, sx, Y, 0)], A.map(v => v * 0.8), null, { two: true }); // Seitenwangen
    for (const sx of [-W2 + 2, W2 - 2]) P.beam(m, sx, Y - 1, D, sx, -26, 0, 1.4, 1.4, IR); // Eisenstangen zur Wand
    P.beam(m, -W2, Y, D, W2, Y, D, 1.6, 1.6, [200, 160, 80]); // Messingstange an der Vorderkante
    return (meshA[i] = m);
  }
  let meshL = null;
  function lanternMesh() { // Gaslaterne: Wandarm mit Volute, sechseckiges Glas, Dach mit Knauf
    if (meshL) return meshL;
    const P = PS2, m = P.mesh(), IR = [36, 34, 40], BR = [200, 160, 80];
    P.beam(m, 0, 0, 0, 0, 0, -18, 2, 2, IR); P.beam(m, 0, -6, 0, 0, 0, -12, 1.4, 1.4, IR);            // Arm, Strebe
    P.beam(m, 0, 0, -18, 0, -4, -18, 1.2, 1.2, IR);                                                  // Haken
    P.prism(m, 0, -18, -18, 4.5, 2, 6, IR, { top: BR });                                              // Boden
    P.prism(m, 0, -16, -18, 4.2, 10, 6, [255, 206, 120], { e: 0.85, cap: false, a: 0.9 });          // Glas mit Flamme
    P.cone(m, 0, -6, -18, 6, 5, 6, IR); P.prism(m, 0, -1, -18, 1, 3, 6, BR);                           // Dach, Knauf
    return (meshL = m);
  }
  function holder(k) { let o = holders.get(k); if (!o) { o = {}; holders.set(k, o); if (holders.size > 40) holders.clear(); } return o; }
  function draw3D(ctx, ox, oy, frame) {
    const w = View.w;
    for (let X = -ox, n = 0; X < w; X += 512, n++) SHOPS.forEach((S, i) => {
      const sx = X + i * 128;
      if (sx + 140 < 0 || sx - 20 > w) return;
      PS2.drawLocal(ctx, holder('a' + n + '_' + i), [awningMesh(i)], sx + 48, 170 - oy, [-64, -12, 128, 44], 'a' + i);
      const lx = sx + 2, ly = 186 - oy;
      PS2.drawLocal(ctx, holder('l' + n + '_' + i), [lanternMesh()], lx, ly, [-16, -8, 32, 40], 'l');
      const [gx, gy] = PS2.projLocal(lx, ly, 0, -11, -18), r = 13 + Math.sin(frame * 0.07 + i) * 1.5, g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); // warmer Schein
      g.addColorStop(0, 'rgba(255,200,120,0.35)'); g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(gx - r, gy - r, r * 2, r * 2); ctx.restore();
    });
  }
  function drawHall(ctx, cam, frame) {
    const key = Options.lang;
    if (!wall || wallKey !== key) { wall = paintWall(); wallKey = key; }
    const w = View.w, ox = Math.floor(cam.x * 0.5) % 512, oy = Math.max(0, Math.min(272 - 208, Math.floor(cam.y * 0.5)));
    for (let X = -ox; X < w; X += 512) ctx.drawImage(wall, X, -oy);
    draw3D(ctx, ox, oy, frame);
    // Regen auf dem Glasdach: Schlieren und Tropfen laufen schräg hinab, im Blitz leuchtet das Glas auf
    const top = -oy, vh = 72;
    if (top + vh > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, Math.max(0, top), w, top + vh - Math.max(0, top)); ctx.clip();
      ctx.fillStyle = 'rgba(180,200,255,0.35)';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 97 + frame * 0.7 - cam.x * 0.5) % (w + 40) + w + 40) % (w + 40) - 20, sy = top + ((i * 53 + frame * 2.2) % (vh + 20)) - 10;
        for (let k = 0; k < 5; k++) ctx.fillRect(Math.round(sx + k * 0.4), Math.round(sy + k), 1, 1);
      }
      if (FX.stormOn(W.storm)) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,210,255,0.35)'; ctx.fillRect(0, top, w, vh); }
      ctx.restore();
    }
  }
  function prewarm() { if (!wall || wallKey !== Options.lang) { wall = paintWall(); wallKey = Options.lang; } Mannequin.build(); }
  return { tile, drawHall, prewarm, SHOPS, ware };
})();

// ---------------- Schaufensterpuppe ----------------
// Porzellanpuppe auf einem Ständer, in Kleidern der Saison. Sie bewegt sich nur, solange der Held ihr den Rücken zukehrt: dann
// gleitet sie mit ausgestreckten Armen heran (Ständer kratzt über das Mosaik, die Augen glimmen). Schaut er hin, erstarrt sie im
// selben Bild in einer neuen Pose – zeigend, winkend, verschämt, die Hand an der Hüfte. Nur in Bewegung tut sie weh; zerschlagen
// lässt sie sich immer (Porzellan, der Kopf rollt).
class Mannequin extends Enemy {
  static build() {
    if (Mannequin.S) return; Mannequin.S = {};
    const DRESS = [['#7c2c48', '#a84468', '#4c1828'], ['#2c5c7c', '#4c84a8', '#18344c'], ['#4c5c2c', '#6c8440', '#2c3818'], ['#5c3c6c', '#84589c', '#341c44']];
    const POSE = { // Arme: [Schulterwinkel, Ellbogenwinkel] je links/rechts (0 = hängt, π/2 = nach vorn), Kopfneigung
      show: [[0.2, 1.9], [2.6, 0.2], 1], point: [[0.15, 0.1], [1.55, 0.05], 0], wave: [[0.2, 0.2], [2.7, 0.9], -1], shy: [[2.2, 2.4], [2.3, 2.5], 1],
      hip: [[0.5, 2.3], [0.2, 0.2], -1], reach: [[1.45, 0.15], [1.55, 0.1], 0],
    };
    DRESS.forEach((D, di) => Object.entries(POSE).forEach(([name, P]) => {
      const c = Sprites.canvas(28, 40), x = c.getContext('2d'), cx = 14, foot = 39, SK = '#f2ece2', SH = '#c8beb0';
      x.fillStyle = '#2c2420'; x.fillRect(cx - 5, foot - 2, 10, 2); x.fillStyle = '#5c4c3c'; x.fillRect(cx - 1, foot - 10, 2, 8); // Ständer
      x.fillStyle = D[2]; x.beginPath(); x.moveTo(cx - 3, foot - 26); x.lineTo(cx + 3, foot - 26); x.lineTo(cx + 7, foot - 10); x.lineTo(cx - 7, foot - 10); x.closePath(); x.fill(); // Rock
      x.fillStyle = D[0]; x.beginPath(); x.moveTo(cx - 3, foot - 26); x.lineTo(cx + 3, foot - 26); x.lineTo(cx + 6, foot - 11); x.lineTo(cx - 6, foot - 11); x.closePath(); x.fill();
      x.fillStyle = D[1]; x.fillRect(cx - 2, foot - 25, 1, 13); x.fillRect(cx + 9 - 3, foot - 14, 2, 3); // Glanz, Turnüre
      x.fillStyle = D[0]; x.fillRect(cx - 3, foot - 32, 6, 7); x.fillStyle = D[1]; x.fillRect(cx - 3, foot - 32, 6, 1); // Mieder
      x.fillStyle = '#e8c060'; x.fillRect(cx - 3, foot - 26, 6, 1);
      const arm = (side, [a1, a2]) => { // Porzellanarm in zwei Gliedern
        const sx = cx + side * 3.5, sy = foot - 31, l1 = 5, l2 = 5, ex = sx + side * Math.sin(a1) * l1 * (a1 > 1.2 && a1 < 2 ? 0.4 : 1) + (a1 > 1.2 && a1 < 2 ? side * 0 : 0), ey = sy + Math.cos(a1) * l1;
        const fwd = (a) => Math.sin(a) * (name === 'point' || name === 'reach' ? 1 : side); // zeigen/greifen: beide Arme nach vorn (rechts im Bild)
        const e2x = sx + fwd(a1) * l1, e2y = sy + Math.cos(a1) * l1, hx = e2x + fwd(a1 + a2) * l2, hy = e2y + Math.cos(a1 + a2) * l2;
        x.strokeStyle = SH; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(sx, sy); x.lineTo(e2x, e2y); x.lineTo(hx, hy); x.stroke();
        x.strokeStyle = SK; x.lineWidth = 1.4; x.beginPath(); x.moveTo(sx, sy); x.lineTo(e2x, e2y); x.lineTo(hx, hy); x.stroke();
        return [ex, ey];
      };
      arm(-1, P[0]); arm(1, P[1]);
      const tilt = P[2], hx = cx + tilt * 0.6, hy = foot - 37; // Kopf: glattes Porzellanoval, Hut mit Feder
      x.fillStyle = SH; x.fillRect(hx - 2, hy - 1, 5, 6); x.fillStyle = SK; x.fillRect(hx - 2, hy - 1, 4, 5); x.fillRect(cx - 1, foot - 33, 2, 2);
      x.fillStyle = '#141018'; x.fillRect(hx - 1, hy + 1, 1, 1); x.fillRect(hx + 1, hy + 1, 1, 1);
      x.fillStyle = D[2]; x.fillRect(hx - 4, hy - 2, 9, 1); x.fillStyle = D[0]; x.fillRect(hx - 2, hy - 4, 5, 2); x.fillStyle = '#f8f4ec'; x.fillRect(hx + 3, hy - 6, 1, 3); x.fillRect(hx + 4, hy - 7, 1, 2);
      Mannequin.S[di + name] = Sprites.fromCanvas(c, true);
    }));
  }
  constructor(tx, ty, o = {}) {
    super(tx * T + 2, (ty + 1) * T - 34, 12, 34, 4, 2, 400);
    Mannequin.build();
    this.dress = o.dress ?? Math.floor(tx * 7 + ty) % 4; this.pose = o.pose || ['show', 'point', 'hip', 'wave'][(tx + ty) % 4];
    this.st = o.awake ? 'creep' : 'still'; this.face = -1; this.eye = 0; this.scrape = 0;
  }
  watched() { // schaut der Held hierher? (Blickrichtung zur Puppe, oder sie steht ihm direkt auf den Füßen)
    const p = W.player, dx = this.cx - p.cx;
    return !p.alive || Math.abs(dx) < 6 || Math.sign(dx) === p.face;
  }
  update() {
    super.update();
    const p = W.player, dx = p.cx - this.cx, dy = p.feet - (this.y + this.h), near = Math.abs(dx) < 15 * T && Math.abs(dy) < 3 * T && this.onScreen(24);
    if (this.st === 'creep') {
      if (this.watched() || !near) { // erwischt: erstarrt im selben Bild in einer neuen Pose
        this.st = 'still'; this.vx = 0; this.eye = 0;
        const P = ['show', 'point', 'wave', 'shy', 'hip'].filter(q => q !== this.pose); this.pose = P[Math.floor(Math.random() * P.length)];
        if (near) { Audio8.sfx('tink', this.cx); if (!W.passNote) { W.passNote = 1; Game.note('passFrozen'); } }
      } else {
        this.face = Math.sign(dx) || this.face; this.pose = 'reach'; this.eye = Math.min(1, this.eye + 0.1);
        this.vx = this.groundAhead(this.face) ? this.face * 1.7 : 0;
        if (++this.scrape % 14 === 0) Audio8.sfx('step', this.cx);
      }
    } else if (!this.watched() && near && p.alive) { this.st = 'creep'; }
    if (this.physics()) this.vx = 0;
    if (this.st === 'creep') this.touch(); // nur in Bewegung gefährlich
  }
  hit(dmg, id) {
    if (id && this.lastHit === id) return false;
    Audio8.sfx('tink', this.cx); W.spawn(new Particle(this.cx, this.y + 6, rnd(-1, 1), rnd(-2, -1), '#f2ece2', 30, 1, 0.2));
    return super.hit(dmg, id);
  }
  kill(silent) {
    if (!silent) {
      Audio8.sfx('shatter', this.cx);
      for (let i = 0; i < 14; i++) W.spawn(new Particle(this.cx, this.y + rnd(4, 30), rnd(-2.2, 2.2), rnd(-3.4, -0.8), i % 3 ? '#f2ece2' : ['#7c2c48', '#2c5c7c', '#4c5c2c', '#5c3c6c'][this.dress], 60, i % 2 ? 2 : 1, 0.2)); // Porzellan und Stoff
      W.spawn(new Particle(this.cx, this.y + 2, this.face * -1.6, -2.2, '#f2ece2', 120, 4, 0.18)); // der Kopf rollt davon
    }
    super.kill(silent);
  }
  draw(ctx) {
    const S = Mannequin.S[this.dress + this.pose]; if (!S) return;
    const jit = this.st === 'creep' ? ((this.t >> 2) & 1) : 0;
    this.spr(ctx, S, this.face < 0, 0, -jit, this.flash);
    if (this.eye > 0.05) { // glimmende Augen, solange sie sich bewegt
      const ex = Math.round(this.cx - W.cam.x + (this.face < 0 ? 0 : 0)), ey = Math.round(this.y + this.h - W.cam.y - 36 - jit);
      ctx.globalAlpha = this.eye; ctx.fillStyle = '#ff3c3c'; ctx.fillRect(ex - 1, ey, 1, 1); ctx.fillRect(ex + 1, ey, 1, 1); ctx.globalAlpha = 1;
    }
  }
}

// ---------------- Schaufenster (zerschlagbar) ----------------
// Vor der Ladenfront eine Vitrine mit Messingrahmen und Auslage. Ein Peitschenhieb: Glas splittert, Beute fällt heraus – und
// manchmal steigt eine beleidigte Puppe aus der Auslage.
class ShopWindow extends Ent {
  constructor(d) { super(d.x * T, (d.y + 1) * T - 36, (d.w || 3) * T, 36); this.kind = 'candle'; this.ware = d.ware || 'hats'; this.broken = false; this.doll = !!d.doll; this.col = d.col || '#1c3c2c'; }
  update() { this.t++; }
  lightUp(L, cx, cy) { if (!this.broken) L.push({ x: this.cx - cx, y: this.cy - cy, r: 34, c: [252, 210, 140], a: 0.32 }); }
  hit() {
    if (this.broken) return;
    this.broken = true; Audio8.sfx('shatter', this.cx); W.shake = Math.max(W.shake, 3);
    for (let i = 0; i < 22; i++) W.spawn(new Particle(this.x + rnd(2, this.w - 2), this.y + rnd(2, 30), rnd(-2.4, 2.4), rnd(-3, -0.5), i % 3 ? '#c8e4fc' : '#ffffff', 50, i % 4 ? 1 : 2, 0.2));
    W.spawn(new Item(rollDrop('rnd'), this.cx, this.cy - 4));
    if (Math.random() < 0.5) W.spawn(new Item(rollDrop('$'), this.cx + 8, this.cy - 4));
    if (this.doll) { const m = W.spawn(new Mannequin(Math.floor(this.cx / T), Math.floor((this.y + this.h) / T) - 1, { awake: true })); m.face = Math.sign(W.player.cx - this.cx) || 1; Game.note('passDoll'); }
  }
  drawBack(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), w = this.w, h = this.h;
    if (x > View.w + 4 || x + w < -4) return;
    ctx.fillStyle = '#141010'; ctx.fillRect(x - 2, y - 2, w + 4, h + 2);
    ctx.fillStyle = this.col; ctx.fillRect(x - 1, y + h - 8, w + 2, 8); ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 2, y - 2, w + 4, 1); ctx.fillRect(x - 1, y + h - 8, w + 2, 1); // Sockel, Messing
    const g = ctx.createLinearGradient(0, y, 0, y + h - 8); g.addColorStop(0, this.broken ? '#2c2018' : '#f8e0a8'); g.addColorStop(1, this.broken ? '#140c08' : '#b07438');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h - 8);
    Passage.ware(ctx, this.ware, x, y, w, h - 8, Math.floor(this.x / T));
    if (!this.broken) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + 4, y + h - 8); ctx.lineTo(x, y + h - 8); ctx.closePath(); ctx.fill(); } // Spiegelung
    else { ctx.fillStyle = 'rgba(200,228,252,0.55)'; for (const [a, b2] of [[0, 4], [w - 6, 6], [w / 2 - 2, 3]]) { ctx.beginPath(); ctx.moveTo(x + a, y); ctx.lineTo(x + a + b2, y); ctx.lineTo(x + a + b2 / 2, y + 9); ctx.closePath(); ctx.fill(); } } // Scherben im Rahmen
    ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 2, y - 2, 1, h - 6); ctx.fillRect(x + w + 1, y - 2, 1, h - 6);
  }
  draw() { }
}

// ---------------- Kristalllüster an morscher Kette ----------------
// Hängt unter dem Glasdach. Läuft der Held darunter durch (oder trifft die Peitsche die Kette), klirrt es, der Lüster pendelt, und
// nach einem Augenblick reißt die Kette: er stürzt, zerschellt am Boden (Splitter, Druckwelle) und trifft, wer darunter steht.
class FallingLuster extends Ent {
  constructor(d) {
    super(d.x * T - 14, (d.y || 2) * T + (d.len || 60), 28, 22); this.kind = 'candle'; this.ax = d.x * T; this.ay = (d.y || 1) * T; this.len = d.len || 60;
    this.st = 'hang'; this.timer = 0; this.vy = 0; this.sw = 0;
  }
  update() {
    this.t++; this.timer++;
    const p = W.player;
    if (this.st === 'hang') {
      this.sw = Math.sin(this.t * 0.03) * 0.6;
      if (p.alive && Math.abs(p.cx - this.ax) < 22 && p.y > this.y && p.y - this.y < 15 * T) this.trigger();
    } else if (this.st === 'warn') {
      this.sw = Math.sin(this.timer * 0.5) * 3;
      if (this.timer % 6 === 0) Audio8.sfx('tink', this.ax);
      if (this.timer > 34) { this.st = 'fall'; this.timer = 0; Audio8.sfx('crack', this.ax); }
    } else if (this.st === 'fall') {
      this.vy = Math.min(7, this.vy + 0.32); this.y += this.vy; this.sw *= 0.9;
      if (p.alive && Phys.overlap(this, p)) p.hurt(3, this.cx);
      const ty = Math.floor((this.y + this.h) / T), tx = Math.floor(this.cx / T);
      if (Phys.solidTile(tx, ty) || this.y > W.room.h * T) { // zerschellt
        this.y = ty * T - this.h; this.st = 'broken'; this.timer = 0;
        Audio8.sfx('shatter', this.cx); Audio8.sfx('crash', this.cx); W.shake = Math.max(W.shake, 8); Input.rumble(0.6, 0.4, 250);
        W.spawn(new Shock(this.cx, this.y + this.h, 40, '#fce0a8', 3));
        for (let i = 0; i < 30; i++) W.spawn(new Particle(this.cx + rnd(-12, 12), this.y + this.h - 4, rnd(-3, 3), rnd(-4, -1), i % 3 ? '#e8f4ff' : '#e8c060', 60, i % 4 ? 1 : 2, 0.22));
      }
    }
  }
  trigger() { if (this.st !== 'hang') return; this.st = 'warn'; this.timer = 0; Audio8.sfx('creak', this.ax); }
  hit() { this.trigger(); }
  lightUp(L, cx, cy) { if (this.st !== 'broken') L.push({ x: this.cx - cx, y: this.cy - cy, r: 46, c: [252, 220, 150], a: 0.45 }); }
  draw(ctx) {
    const cx = Math.round(this.cx - W.cam.x + this.sw), y = Math.round(this.y - W.cam.y), ax = Math.round(this.ax - W.cam.x), ay = Math.round(this.ay - W.cam.y);
    if (cx < -40 || cx > View.w + 40) return;
    if (this.st === 'broken') { // Trümmer: verbogener Reif, Kristalle
      ctx.fillStyle = '#8c6c2c'; ctx.fillRect(cx - 13, y + this.h - 3, 26, 3); ctx.fillStyle = '#e8c060'; ctx.fillRect(cx - 13, y + this.h - 3, 26, 1);
      ctx.fillStyle = '#d8ecff'; for (let i = 0; i < 7; i++) ctx.fillRect(cx - 12 + i * 4, y + this.h - 5 + (i % 2), 2, 2);
      return;
    }
    if (this.st !== 'fall') { ctx.fillStyle = '#5c4c3c'; for (let k = ay; k < y; k += 3) ctx.fillRect(Math.round(ax + (cx - ax) * (k - ay) / Math.max(1, y - ay)), k, 1, 2); } // Kette
    else { ctx.fillStyle = '#5c4c3c'; ctx.fillRect(cx, y - 8, 1, 6); }
    ctx.fillStyle = '#8c6c2c'; ctx.fillRect(cx - 2, y, 4, 4); ctx.fillStyle = '#e8c060'; ctx.fillRect(cx - 1, y, 2, 1);
    ctx.fillStyle = '#a07c30'; ctx.fillRect(cx - 13, y + 8, 26, 3); ctx.fillStyle = '#f0d070'; ctx.fillRect(cx - 13, y + 8, 26, 1); // Reif
    ctx.fillStyle = '#a07c30'; ctx.fillRect(cx - 9, y + 4, 18, 2);
    for (let i = 0; i < 6; i++) { const kx = cx - 12 + i * 5; ctx.fillStyle = '#f0e8d8'; ctx.fillRect(kx, y + 4, 2, 4); const f = ((this.t >> 2) + i) & 1; ctx.fillStyle = f ? '#fce0a8' : '#fcc860'; ctx.fillRect(kx, y + 2 - f, 2, 2); } // Kerzen
    for (let i = 0; i < 9; i++) { const kx = cx - 12 + i * 3, l = 3 + (i % 3) * 2 + (i === 4 ? 3 : 0); ctx.fillStyle = (this.t + i * 7) % 40 < 3 ? '#ffffff' : '#c8e4fc'; ctx.fillRect(kx, y + 11, 1, l); } // Kristallbehang
  }
}

// Café vor der Konditorei: Marmortischchen, Bugholzstühle, eine Tasse dampft noch – der Gast ist eben erst gegangen (oder erstarrt)
class PassageCafe extends Ent {
  constructor(d) { super(d.x * T, (d.y + 1) * T - 20, (d.n || 3) * 40, 20); this.kind = 'prop'; this.n = d.n || 3; }
  update() { this.t++; }
  draw() { }
  drawBack(ctx) {
    const x0 = Math.round(this.x - W.cam.x), fy = Math.round(this.y + this.h - W.cam.y);
    if (x0 > View.w + 8 || x0 + this.w < -8) return;
    for (let i = 0; i < this.n; i++) {
      const tx = x0 + 14 + i * 40;
      for (const s of [-1, 1]) { const c = tx + s * 11; ctx.fillStyle = '#3c2414'; ctx.fillRect(c - 3, fy - 9, 6, 2); ctx.fillRect(c + s * 2, fy - 17, 1, 8); ctx.fillRect(c - 3, fy - 7, 1, 7); ctx.fillRect(c + 2, fy - 7, 1, 7); ctx.strokeStyle = '#3c2414'; ctx.beginPath(); ctx.arc(c + s * 2, fy - 18, 3, 0, Math.PI * 2); ctx.stroke(); } // Bugholzstühle
      ctx.fillStyle = '#1c1410'; ctx.fillRect(tx - 1, fy - 12, 2, 12); ctx.fillRect(tx - 4, fy - 1, 8, 1); // Tischfuß
      ctx.fillStyle = '#e8e4dc'; ctx.fillRect(tx - 7, fy - 14, 14, 2); ctx.fillStyle = '#b8b0a4'; ctx.fillRect(tx - 7, fy - 13, 14, 1); // Marmorplatte
      ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 2, fy - 17, 3, 3); ctx.fillStyle = '#4c2c18'; ctx.fillRect(tx - 1, fy - 17, 1, 1); // Tasse
      if (i === 1) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 3; k++) ctx.fillRect(tx - 1 + Math.round(Math.sin(this.t * 0.05 + k) * 1.5), fy - 20 - k * 3 - ((this.t >> 3) % 3), 1, 2); } // Dampf
    }
  }
}
