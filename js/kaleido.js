// Kaleidoskop (Schloss-Modus, über der Sonnenkathedrale): eine liegende Röhre aus Buntglas, in Trommeln geteilt, die sich um
// ihre Längsachse drehen – abwechselnd vorwärts und rückwärts. Unter den Trommeln nur Abgrund: hinüber kommt man nur am
// Ankerring mit der Peitsche, zwischen den Trommeln stehen Steinringe zum Verschnaufen. Die Fenster sind die Figurenfenster des
// Glasturms (König, Georg, Drache, Engel, Tentakel …, mit Baldachin, Juwelenbordüre und Inschrift), um die Röhre gelegt: sie
// kreisen mit jeder Trommel, die Figuren stehen mal Kopf. Wer oben im Mondlicht steht, wirft wie im Glasturm einen weichen,
// goldweißen Lichtschacht in die Röhre (Mantel, Kern, Streifen der Bleiruten, Lichthof, Staub) – benachbarte gegeneinander.
// Zeichnen: Röhre von innen pro Bildpunkt (wie der Glasturm, nur liegend: jede Bildzeile ist ein Strahl auf die Zylinderwand),
// die Drehung je Bildspalte nach der Trommel an dieser Stelle; Steinringe als Rippen davor; Lichtschächte nach dem Licht.
'use strict';

const Kaleido = (() => {
  const TW = 512, TH = 1104;                    // Textur: entlang der Achse × um den Umfang (ein Umlauf = drei Fenster- und drei Gewölbereihen)
  const SEC0 = 8, SEC = 20, PIT = 17, N = 5;      // Trommeln ab Kachel 8, je 20 Kacheln: 17 Abgrund + 3 Steinring; fünf Trommeln
  const SPIN = 0.0025;                           // Drehung je Bild (rad) – sehr gemächlich, die Fenster sollen wirken
  const KZ = 3.4;                                // Brennweite: enger Bildwinkel – riesige Fenster (eins größer als das Bild), die Röhre krümmt sich kaum
  let T3 = null, tab = null, out = null, rayC = null, rayX = null;

  const drum = (wx) => { const k = Math.floor((wx / T - SEC0) / SEC); return k >= 0 && k < N && (wx / T - SEC0) - k * SEC < PIT ? k : -1; }; // Trommel an Welt-x (−1: Steinring/Rand)
  const dirOf = (k) => (k % 2 ? -1 : 1);
  const angle = (k, f) => dirOf(k) * f * SPIN + k * 1.3;

  // ---------------- Textur: die Figurenfenster des Glasturms in einem Kreuzgratgewölbe, einmal in PS2-3D gerendert ----------------
  // Abgewickelte Röhrenwand, je Umlauf drei Fensterreihen (228 hoch) und drei Gewölbereihen (84 hoch). Die Fenster bleiben Pixel für
  // Pixel die des Glasturms, liegen aber tief in schrägen Laibungen aus Keilsteinen, gerahmt von einer Wulstrippe mit Goldfilet und
  // goldenem Scheitelstein; dazwischen Dienste mit Goldkapitell. Die Gewölbereihen sind Kreuzgratjoche: vier Kappen (Nachtblau mit
  // Goldsternen) senken sich zum Schlussstein, auf den Graten Diagonalrippen, unter jedem Joch der Scheitel des nächsten Fensters.
  // Fast orthogonal gerendert, Licht von links oben – eingebrannt wie PS2-Vertexlicht, es kreist mit der Trommel.
  const CW = 128, WR = 228, VR = 140, RH = WR + VR; // Zelle: Breite, Fensterreihe, Gewölbereihe
  function arch(x0, y0, Wd, Hd) { // gleichseitiger Spitzbogen als Umriss: links hoch, zwei Bögen, rechts hinunter, Sohlbank (26 Punkte)
    const A = Wd * 0.866, P = [];
    for (let i = 0; i <= 4; i++) P.push([x0, y0 + Hd - (Hd - A) * i / 4]);
    for (let i = 1; i <= 8; i++) { const f = Math.PI + Math.PI / 3 * i / 8; P.push([x0 + Wd + Wd * Math.cos(f), y0 + A + Wd * Math.sin(f)]); }
    for (let i = 1; i <= 8; i++) { const f = -Math.PI / 3 + Math.PI / 3 * i / 8; P.push([x0 + Wd * Math.cos(f), y0 + A + Wd * Math.sin(f)]); }
    for (let i = 1; i <= 4; i++) P.push([x0 + Wd, y0 + A + (Hd - A) * i / 4]);
    P.push([x0 + Wd / 2, y0 + Hd]);
    return P;
  }
  function vaultMesh() {
    const P = PS2, m = P.mesh(), ST = [[70, 58, 86], [88, 76, 106], [106, 94, 124]], RIB = [128, 116, 146], GOLD = [226, 178, 74], COL = [96, 84, 116];
    const face = (pts, col) => { const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]); P.face(m, pts.map(([u, v, z]) => P.vtx(m, u, -v, z)), col, [c[0], -c[1], 1000]); }; // Normale zum Betrachter
    const ridge = (a, b, w, col, gold = true) => { // Rippe mit Grat (zwei schräge Flächen), obenauf ein Goldfilet
      const du = b[0] - a[0], dv = b[1] - a[1], l = Math.hypot(du, dv) || 1, nu = -dv / l * w / 2, nv = du / l * w / 2, h = w * 0.6;
      const S = (p, s) => [p[0] + nu * s, p[1] + nv * s, p[2]], G = (p, s = 0) => [p[0] + nu * s, p[1] + nv * s, p[2] - h];
      face([S(a, 1), S(b, 1), G(b), G(a)], col); face([G(a), G(b), S(b, -1), S(a, -1)], col);
      if (gold) { const g = 0.7 / (w / 2); face([G(a, g), G(b, g), G(b, -g), G(a, -g)].map(p => [p[0], p[1], p[2] - 0.3]), GOLD); }
    };
    const dome = (u, v, z, r, col, gem) => { // Schlussstein: goldene Facettenkuppel mit Edelstein
      const ring = (rr, zz) => Array.from({ length: 8 }, (_, i) => [u + Math.cos(i * Math.PI / 4) * rr, v + Math.sin(i * Math.PI / 4) * rr, zz]);
      const o = ring(r, z), q = ring(r * 0.38, z - r * 0.55), top = [u, v, z - r * 0.7];
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; face([o[i], o[j], q[j], q[i]], col); face([q[i], q[j], top], gem); }
    };
    for (let band = -1; band <= 3; band++) for (let i = -1; i <= 4; i++) {
      const ox = i * CW, oy = band * RH, win = arch(ox + 22, oy + 16, 84, 196).map(p => [p[0], p[1], 24]), out = arch(ox + 11, oy + 5, 106, 218).map(p => [p[0], p[1], 0]);
      face(win, [12, 6, 18]); // hinter dem Glas (der Rand bleibt Bleirute)
      for (let k = 0; k < out.length; k++) { const j = (k + 1) % out.length; face([out[k], out[j], win[j], win[k]], k >= 21 ? ST[2] : ST[k % 3]); } // Laibung aus Keilsteinen, Sohlbank
      for (let k = 0; k < 20; k++) ridge([...out[k].slice(0, 2), -0.5], [...out[k + 1].slice(0, 2), -0.5], 5, RIB); // Wulstrippe um den Bogen
      face([[ox + 64, oy + 1, -4], [ox + 68, oy + 7, -4], [ox + 64, oy + 13, -4], [ox + 60, oy + 7, -4]], GOLD); // Scheitelstein
      ridge([ox, oy + 22, -1], [ox, oy + 210, -1], 6, COL, false); // Dienst zwischen den Fenstern, Goldringe, Kapitell und Basis
      for (const rv of [80, 150]) ridge([ox - 4, oy + rv, -4], [ox + 4, oy + rv, -4], 2.4, GOLD, false);
      face([[ox - 7, oy + 13, -5], [ox + 7, oy + 13, -5], [ox + 4, oy + 22, -5], [ox - 4, oy + 22, -5]], GOLD);
      face([[ox - 4, oy + 210, -4], [ox + 4, oy + 210, -4], [ox + 7, oy + 218, -4], [ox - 7, oy + 218, -4]], COL);
      const vy = oy + WR, H2 = VR / 2, C = [ox + 64, vy + H2, 46], TL = [ox, vy, 0], TR = [ox + CW, vy, 0], BL = [ox, vy + VR, 0], BR = [ox + CW, vy + VR, 0]; // Kreuzgratjoch, tief gewölbt
      const Mt = [ox + 64, vy, 20], Mb = [ox + 64, vy + VR, 20], Ml = [ox, vy + H2, 16], Mr = [ox + CW, vy + H2, 16], WEB = [[30, 38, 104], [38, 50, 124]];
      const Qt = [ox + 64, vy + H2 * 0.45, 38], Qb = [ox + 64, vy + VR - H2 * 0.45, 38], Ql = [ox + 30, vy + H2, 34], Qr = [ox + CW - 30, vy + H2, 34]; // Kappen gebaucht (zweite Stufe)
      // vier Kappen, jede aus zwei Stufen (Rand → Bauch → Scheitel), damit sie sich rund in die Tiefe wölben
      for (const [a, b, q, k] of [[TL, Mt, Qt, 0], [Mt, TR, Qt, 1], [TR, Mr, Qr, 2], [Mr, BR, Qr, 3], [BR, Mb, Qb, 4], [Mb, BL, Qb, 5], [BL, Ml, Ql, 6], [Ml, TL, Ql, 7]]) {
        const c = WEB[k % 2], md = [(a[0] + C[0]) / 2, (a[1] + C[1]) / 2, (a[2] + C[2]) / 2 - 4];
        face([a, b, q], c); face([a, q, md], c); face([md, q, C], c);
      }
      for (const c of [TL, TR, BR, BL]) { // Diagonalrippen auf den Graten, leicht durchhängend wie echte Gewölberippen
        const md = [(c[0] + C[0]) / 2, (c[1] + C[1]) / 2, (c[2] + C[2]) / 2 - 4];
        ridge([c[0], c[1], -1], [md[0], md[1], md[2] - 1], 8, RIB); ridge([md[0], md[1], md[2] - 1], [C[0], C[1], C[2] - 1], 8, RIB);
      }
      ridge([ox + 64, vy + 4, 19], [ox + 64, vy + H2 - 10, 44], 4, RIB, false); ridge([ox + 64, vy + VR - 4, 19], [ox + 64, vy + H2 + 10, 44], 4, RIB, false); // Scheitelrippe
      dome(C[0], C[1], C[2] - 6, 13, GOLD, (i + band) & 1 ? [200, 34, 64] : [40, 120, 220]);
      ridge([ox, vy, -2], [ox + CW, vy, -2], 9, RIB); ridge([ox, vy + VR, -2], [ox + CW, vy + VR, -2], 9, RIB); // Gurte zu den Fensterreihen
      ridge([ox, vy + 2, -3], [ox, vy + VR - 2, -3], 12, RIB); // Gurtbogen zwischen den Jochen (kräftig, mit Goldfilet)
      for (const gy of [vy, vy + VR]) dome(ox, gy, -4, 7, GOLD, [230, 200, 120]); // Knaufe, wo Gurte und Bögen sich kreuzen
    }
    return m;
  }
  function buildTex() {
    const wall = Tiles.layer('glass', 'wall'), glow = Tiles.layer('glass', 'glassGlow');
    const a = wall.c.getContext('2d').getImageData(0, 0, 512, 624).data, gl = glow.c.getContext('2d').getImageData(0, 0, 512, 624).data;
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d', { willReadFrequently: true });
    for (let Y = 0; Y < TH; Y += 9) for (let X = -((Y / 9) % 2) * 11; X < TW; X += 22) { // Quadermauerwerk hinter den Fenstern
      const n = (((Y / 9) * 7 + Math.floor(X / 22) * 13) % 5 + 5) % 5; x.fillStyle = `rgb(${17 + n},${11 + n},${24 + n})`; x.fillRect(X + 1, Y + 1, 21, 8);
    }
    const env = (() => { const v = [-0.45, 0.55, -0.7], l = Math.hypot(...v); return { sun: v.map(q => q / l), sunC: [0.82, 0.76, 0.68], amb: [0.3, 0.28, 0.4], sky: [0.1, 0.1, 0.16], fog: [0, 0, 0], fogD: 0 }; })();
    PS2.render(x, TW, TH, [vaultMesh()], { x: TW / 2, y: -TH / 2, z: -20000, yaw: 0, pitch: 0, f: 20000, near: 1, cx: TW / 2, cy: TH / 2 }, env);
    const img = x.getImageData(0, 0, TW, TH), d = img.data, gd = new Uint8ClampedArray(d.length);
    const hsh = (n) => { const h = Math.sin(n * 91.7) * 43758.5453; return h - Math.floor(h); };
    for (let band = 0; band < 3; band++) for (let i = 0; i < 4; i++) for (let s = 0; s < 34; s++) { // Goldsterne auf den Kappen
      const n = band * 97 + i * 31 + s, X = Math.floor(i * CW + 8 + hsh(n) * (CW - 16)), Y = Math.floor(band * RH + WR + 8 + hsh(n + 0.5) * (VR - 16)), j = (Y * TW + X) * 4;
      if (d[j + 2] > d[j] + 30 && d[j + 2] > 60) { d[j] = 236; d[j + 1] = 200; d[j + 2] = 112; if (s % 4 === 0 && X + 1 < TW) { d[j + 4] = 150; d[j + 5] = 122; d[j + 6] = 70; } }
    }
    const W0 = 84, H0 = 196, A0 = Math.round(W0 * 0.866);
    const ins = (lx, ly) => ly >= 0 && ly < H0 && lx >= 0 && lx < W0 && (ly >= A0 || ((lx - W0) ** 2 + (ly - A0) ** 2 <= W0 * W0 && lx ** 2 + (ly - A0) ** 2 <= W0 * W0));
    for (let band = 0; band < 3; band++) for (let i = 0; i < 4; i++) for (let ly = 0; ly < H0; ly++) for (let lx = 0; lx < W0; lx++) { // Glas einsetzen, Pixel für Pixel
      if (!(ins(lx - 2, ly) && ins(lx + 2, ly) && ins(lx, ly - 2) && ins(lx, ly + 2))) continue;
      const s = ((band * 208 + 6 + ly) * 512 + 22 + i * 128 + lx) * 4, o = ((band * RH + 16 + ly) * TW + 22 + i * CW + lx) * 4;
      for (let q = 0; q < 3; q++) { d[o + q] = a[s + q]; gd[o + q] = gl[s + q]; }
    }
    const lv = [[0.5, 0.04], [0.75, 0.2], [0.95, 0.46], [1.05, 0.86]].map(([mm, k]) => {
      const o = new Int32Array(TW * TH);
      for (let i = 0, j = 0; i < o.length; i++, j += 4) {
        const r = Math.min(255, d[j] * mm + gd[j] * k), g = Math.min(255, d[j + 1] * mm + gd[j + 1] * k), b = Math.min(255, d[j + 2] * mm + gd[j + 2] * k);
        o[i] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
      return o;
    });
    const wins = (Tiles.glassWins() || []).map(w => { const sh = Math.floor(w.v0 / 208) * (RH - 208) + 10; return { ...w, v0: w.v0 + sh, v1: w.v1 + sh }; }); // Fenster in der neuen Textur
    const hi = Tiles.glassHi ? Tiles.glassHi().map(Wd => LVK.map(([mm, k]) => { // Glas der Fenster doppelt aufgelöst (tiles.js), je Leuchtstufe vorgerechnet (0 = kein Glas)
      const o = new Int32Array(Wd.rgb.length);
      for (let j = 0; j < o.length; j++) if (Wd.mask[j]) { const c = Wd.rgb[j], g = Wd.glw[j]; o[j] = (255 << 24) | (Math.min(255, ((c >> 16) & 255) * mm + ((g >> 16) & 255) * k) << 16) | (Math.min(255, ((c >> 8) & 255) * mm + ((g >> 8) & 255) * k) << 8) | Math.min(255, (c & 255) * mm + (g & 255) * k); }
      return o;
    })) : null;
    T3 = { lv, wins, hi };
  }
  // Röhrentabelle: jede Bildzeile y trifft die Zylinderwand an der Umfangsstelle v[y]; s[y] = Maßstab entlang der Achse
  // (fern in der Bildmitte klein, nah oben und unten groß); light[y] = Mondlicht (oben hell, unten dunkel)
  function table() {
    if (tab) return tab;
    const H = 208, R = TH / (2 * Math.PI), dd = R * 0.3, f = (H / 2) / Math.tan(1.0) * TH / 624 * KZ; // Brennweite mit dem Umfang skaliert: Fenster so groß wie im Glasturm
    const v = new Float32Array(H), s = new Float32Array(H), light = new Float32Array(H);
    let smin = 1e9, smax = 0;
    for (let y = 0; y < H; y++) {
      const ph = Math.atan((y + 0.5 - H / 2) / f), c = Math.cos(ph), sn = Math.sin(ph);
      const t = dd * c + Math.sqrt(dd * dd * c * c - dd * dd + R * R), py = t * sn, pz = -dd + t * c;
      v[y] = Math.atan2(py, pz) / (2 * Math.PI) * TH; s[y] = t * c / f;
      smin = Math.min(smin, s[y]); smax = Math.max(smax, s[y]);
    }
    for (let y = 0; y < H; y++) light[y] = Math.max(0, Math.min(2.999, 2.6 - (y / H) * 2.4)); // oben voll im Mondlicht
    return (tab = { v, s, light, smin, smax });
  }
  const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  // Abschnitte entlang der Röhrenachse (Texturkoordinate a = Welt-x / 2 auf Höhe der Bildmitte): vor der ersten Trommel und hinter
  // der letzten drehen sich eigene Trommeln mit (Nummer −1 und N), zwischen je zwei Trommeln ein Steinring, der sich als Ring in
  // der Röhrenwand perspektivisch krümmt (kein flaches Band mehr im Bild)
  const A = (tile) => tile * T * 0.5;
  const span = (k) => k < 0 ? [-1e9, A(SEC0 - 3)] : k >= N ? [A(SEC0 + N * SEC), 1e9] : [A(SEC0 + k * SEC), A(SEC0 + k * SEC + PIT)];
  // Jede Trommel zeigt genau eine Fensterspalte (Zelle der Textur, Dienst bis Dienst), auf ihre Länge gestreckt – so schneidet kein
  // Steinring ein Fenster durch; Anfang und Ende setzen am Ring mit einem Dienst an. SC: Texturpixel je Achseneinheit
  const SC = CW / A(PIT), origin = (k) => k < 0 ? [A(SEC0 - 3), 0] : k >= N ? [A(SEC0 + N * SEC), 0] : [A(SEC0 + k * SEC), (k & 3) * CW];
  let RING = null;
  function ringTex() { // Steinring: Keilsteine rund um die Röhre, Goldkanten, Nieten; vier Leuchtstufen wie die Fenster
    const RW = 24, o = [0.42, 0.66, 0.92, 1.12].map(() => new Int32Array(RW * TH)), M = [0.42, 0.66, 0.92, 1.12];
    for (let v = 0; v < TH; v++) for (let u = 0; u < RW; u++) {
      const e = Math.min(u, RW - 1 - u), joint = v % 24 === 0, st = ((v / 24) | 0) % 2;
      let c = e < 1 ? [18, 12, 20] : e < 3 ? [200, 152, 56] : e < 4 ? [70, 54, 40] : joint ? [24, 18, 28] : st ? [92, 78, 84] : [106, 90, 96];
      if (e >= 4 && !joint && v % 24 === 1) c = [140, 124, 128];
      if ((u === 6 || u === RW - 7) && v % 18 === 9) c = [220, 180, 90];
      if (e >= 4 && e < 6) c = c.map(x => x * 0.7);
      M.forEach((m, i) => { o[i][v * RW + u] = (255 << 24) | (Math.min(255, c[2] * m) << 16) | (Math.min(255, c[1] * m) << 8) | Math.min(255, c[0] * m); });
    }
    return (RING = { RW, lv: o });
  }

  const LVK = [[0.5, 0.04], [0.75, 0.2], [0.95, 0.46], [1.05, 0.86]]; // Leuchtstufen (Grundfarbe, Leuchtebene) wie in buildTex
  const flash = () => typeof W !== 'undefined' && W.storm && FX.stormOn(W.storm); // Gewitter über dem Schloss (world.js STORMY)
  // Hintergrund: die Röhre; jeder Bildpunkt gehört zum Abschnitt an seiner Stelle der Achse (gedreht) oder zu einem Steinring
  function drawTube(ctx, cam, frame) {
    if (!T3) buildTex();
    const w = View.w, H = 208, tb = table(), LV = T3.lv, RG = RING || ringTex(), RL = RG.lv, RW = RG.RW;
    if (!out || out.w !== w) { const c = document.createElement('canvas'); c.width = w; c.height = H; const x = c.getContext('2d'), img = x.createImageData(w, H); out = { w, c, x, img, buf: new Int32Array(img.data.buffer) }; }
    const buf = out.buf, u0 = cam.x * 0.5, rots = new Float32Array(N + 2), fl = flash(), HI = T3.hi; // Blitz: alle Fenster gleißen auf
    for (let k = -1; k <= N; k++) rots[k + 1] = angle(k, frame) / (Math.PI * 2) * TH;
    const a0 = A(SEC0), sec = A(SEC), pit = A(PIT), ringW = A(3), aEnd = A(SEC0 + N * SEC);
    for (let x = 0; x < w; x++) {
      const dx = x - w / 2;
      for (let y = 0, o = x; y < H; y++, o += w) {
        const a = u0 + dx * tb.s[y], L = fl ? 2.99 : tb.light[y], lo = L | 0, hi = BAY4[((y & 3) << 2) | (x & 3)] < (L - lo) * 16;
        let k, ring = -1, ua;
        if (a < a0) { if (a >= a0 - ringW) ring = (a - a0 + ringW) / ringW; k = -1; ua = (a - a0 + ringW) * SC; }
        else if (a >= aEnd) { k = N; ua = (a - aEnd) * SC; }
        else { k = ((a - a0) / sec) | 0; const loc = a - a0 - k * sec; if (loc >= pit) ring = (loc - pit) / ringW; ua = loc * SC + (k & 3) * CW; }
        if (ring >= 0) { const v = ((Math.floor(tb.v[y]) % TH) + TH) % TH; buf[o] = RL[hi ? Math.min(3, lo + 1) : lo][v * RW + Math.min(RW - 1, (ring * RW) | 0)]; continue; }
        const vv = tb.v[y] + rots[k + 1], fua = Math.floor(ua), fvv = Math.floor(vv), u = ((fua % TW) + TW) % TW, v = ((fvv % TH) + TH) % TH, li = hi ? lo + 1 : lo;
        const cu = u & 127, band = (v / RH) | 0, cv = v - band * RH;
        if (HI && cu >= 22 && cu < 106 && cv >= 16 && cv < 212) { // im Fenster: Glas aus der doppelt aufgelösten Fassung, Licht je Stufe
          const val = HI[band * 4 + (u >> 7)][li][(((cv - 16 + vv - fvv) * 2) | 0) * 168 + (((cu - 22 + ua - fua) * 2) | 0)];
          if (val) { buf[o] = val; continue; }
        }
        buf[o] = LV[li][v * TW + u];
      }
    }
    out.x.putImageData(out.img, 0, 0);
    ctx.drawImage(out.c, 0, 0);
    const sh = ctx.createLinearGradient(0, 0, 0, H); // ferne Wand im Dunst, unten der Abgrund dunkel
    const dk = fl ? 0.35 : 1; sh.addColorStop(0, 'rgba(8,4,16,0.05)'); sh.addColorStop(0.45, `rgba(8,4,16,${0.32 * dk})`); sh.addColorStop(1, `rgba(4,2,10,${0.62 * dk})`);
    ctx.fillStyle = sh; ctx.fillRect(0, 0, w, H);
  }

  // Fenster auf dem Bildschirm: je Abschnitt (auch Anfang und Ende) und Fenster die Bildzeile seiner Mitte (Umfang + Drehung), die
  // Spalte (entlang der Achse, mit der Röhrenparallaxe) und die Breite; oben steht es im Mondlicht und wirft einen Schacht
  function beams(cam, frame) {
    if (!T3) buildTex();
    const out = [], w = View.w, tb = table(), H = 208, u0 = cam.x * 0.5, v0 = tb.v[0], v1 = tb.v[H - 1], fl = flash();
    const rowOf = (v) => { let lo = 0, hi = H - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tb.v[m] < v) lo = m + 1; else hi = m; } return lo; };
    for (let k = -1; k <= N; k++) {
      const [A0, A1] = span(k), [aO, uO] = origin(k), rot = angle(k, frame) / (Math.PI * 2) * TH;
      T3.wins.forEach((win, wi) => {
        const vc = ((((win.v0 + win.v1) / 2 - rot - v0) % TH) + TH) % TH + v0; // Fenstermitte relativ zur sichtbaren Wand
        if (vc > v1) return;
        const y = rowOf(vc), L = fl ? 2.6 : tb.light[y]; if (L < 0.55) return; // ganz unten im Schatten: kein Schacht
        const s = tb.s[y], hw = win.hw / SC / s, xs = w / 2 + (Math.max(A0, u0 - 4000) - u0) / s, xe = w / 2 + (Math.min(A1, u0 + 4000) - u0) / s;
        if (xs > w + 40 || xe < -40) return;
        const uLo = (Math.max(A0, u0 - 600) - aO) * SC + uO, uHi = (Math.min(A1, u0 + 600) - aO) * SC + uO;
        for (let n = Math.floor((uLo - win.u) / TW); n <= Math.ceil((uHi - win.u) / TW); n++) {
          const a = aO + (win.u + n * TW - uO) / SC; if (a < A0 || a > A1) continue;
          const x = w / 2 + (a - u0) / s;
          if (x + hw < -20 || x - hw > w + 20) continue;
          const yT = rowOf(Math.min(v1, Math.max(v0, vc - (win.v1 - win.v0) / 2))), yB = rowOf(Math.min(v1, Math.max(v0, vc + (win.v1 - win.v0) / 2)));
          const kL = fl ? 1.5 : Math.min(1.15, 0.25 + (L - 0.55) / 1.3), rgb = win.col.map((c, j) => Math.round(Math.min(255, c * 0.62 + win.acc[j] * 0.18 + 70)));
          out.push({ x0: x - hw, ww: hw * 2, wy: (yT + y) / 2, yT, yB, len: 200 + hw * 1.6, slant: 0.3 * dirOf(k) + (x / w - 0.5) * 0.35, col: rgb.join(','), k: kL * (0.85 + 0.15 * Math.sin(frame * 0.017 + wi + k)), id: (k + 1) * 16 + wi, cx0: Math.max(-40, xs), cx1: Math.min(w + 40, xe) });
        }
      });
    }
    return out;
  }
  // Volumetrische Lichtschächte wie im Glasturm (nach dem Licht gezeichnet, additiv, halbe Auflösung): Mantel, Kern, Streifen der
  // Bleiruten, Lichthof ums Glas, pixelscharfer Staub; jeder Schacht bleibt in seiner Trommel. Darunter farbiger Dunst über dem Abgrund
  function drawRays(ctx, cam, frame) {
    const B = beams(cam, frame); if (!B.length) return;
    const w = View.w, hw2 = Math.ceil(w / 2), lite = View.lite;
    const hsh2 = (n) => { const h = Math.sin(n * 127.1) * 43758.5453; return h - Math.floor(h); };
    if (!rayC || rayC.width !== hw2) { rayC = document.createElement('canvas'); rayC.width = hw2; rayC.height = 104; rayX = rayC.getContext('2d'); }
    const x = rayX; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, hw2, 104); x.setTransform(0.5, 0, 0, 0.5, 0, 0); x.globalCompositeOperation = 'lighter';
    for (const b of B) {
      x.save(); x.beginPath(); x.rect(b.cx0, 0, b.cx1 - b.cx0, 208); x.clip();
      const { x0, ww, wy, len, slant, col, k } = b, spread = 1.6;
      const beam = (f0, f1, a) => {
        const ax = x0 + ww * f0, bx = x0 + ww * f1, mx = (ax + bx) / 2;
        const g = x.createLinearGradient(mx, wy, mx + len * slant, wy + len);
        g.addColorStop(0, `rgba(${col},${(a * k).toFixed(3)})`); g.addColorStop(0.45, `rgba(${col},${(a * k * 0.45).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = g; x.beginPath(); x.moveTo(ax, wy); x.lineTo(bx, wy);
        x.lineTo(mx + (bx - mx) * spread + len * slant, wy + len); x.lineTo(mx + (ax - mx) * spread + len * slant, wy + len); x.closePath(); x.fill();
      };
      beam(0.02, 0.98, 0.26);                                                            // Mantel
      beam(0.25, 0.75, 0.3);                                                             // Kern
      for (let i = 0; i < (lite ? 3 : 6); i++) { const n = lite ? 3 : 6, f = (i + 0.5) / n + 0.035 * Math.sin(frame * 0.012 + i * 2.1 + b.id), h = 0.025 + 0.02 * hsh2(i + b.id * 7); beam(f - h, f + h, 0.11 + 0.06 * Math.sin(frame * 0.02 + i + b.id)); } // Streifen
      const halo = x.createRadialGradient(x0 + ww / 2, wy, 0, x0 + ww / 2, wy, ww * 0.9); // Lichthof ums Glas
      halo.addColorStop(0, `rgba(${col},${(0.22 * k).toFixed(3)})`); halo.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = halo; x.fillRect(x0 - ww * 0.4, wy - ww, ww * 1.8, ww * 2);
      x.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rayC, 0, 0, hw2, 104, 0, 0, hw2 * 2, 208);
    ctx.fillStyle = '#fff8e6';
    for (const b of B) for (let m = 0; m < (lite ? 8 : 16); m++) { // Staubkörnchen treiben langsam durch das Licht
      const t = (hsh2(m + b.id * 31) + frame * (0.0006 + hsh2(m * 3 + b.id) * 0.0009)) % 1, f = 0.1 + 0.8 * hsh2(m * 7 + b.id * 3) + 0.04 * Math.sin(frame * 0.017 + m);
      const along = t * b.len * 0.85, wid = b.ww * (1 + 0.6 * t), X = b.x0 + b.ww / 2 + (f - 0.5) * wid + along * b.slant, Y = b.wy + along;
      if (X < b.cx0 || X > b.cx1) continue;
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.85 * b.k * (0.5 + 0.5 * Math.sin(frame * 0.09 + m * 2.3)));
      ctx.fillRect(Math.round(X), Math.round(Y), m % 5 ? 1 : 2, 1);
    }
    ctx.globalAlpha = 1;
    const fog = ctx.createLinearGradient(0, 150, 0, 208); // farbiger Lichtnebel über dem Abgrund, gemischt aus den Glasfarben
    const mix = B.reduce((m, b) => { const c = b.col.split(',').map(Number); return [m[0] + c[0] * b.k, m[1] + c[1] * b.k, m[2] + c[2] * b.k, m[3] + b.k]; }, [0, 0, 0, 0]);
    if (mix[3] > 0) { const c = mix.slice(0, 3).map(v => Math.round(v / mix[3])).join(','); fog.addColorStop(0, `rgba(${c},0)`); fog.addColorStop(1, `rgba(${c},${Math.min(0.2, 0.05 * mix[3]).toFixed(3)})`); ctx.fillStyle = fog; ctx.fillRect(0, 150, w, 58); }
    ctx.restore();
  }
  return { drawTube, drawRays, drum, SEC0, SEC, PIT, N, prewarm() { Tiles.build('glass'); if (!T3) buildTex(); table(); } }; // die Fenster kommen aus dem Glasturm
})();
