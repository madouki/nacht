// Kaleidoskop (Schloss-Modus, über der Sonnenkathedrale): eine liegende Röhre aus Buntglas mit kolossalem Radius, in Trommeln
// geteilt, die sich um ihre Längsachse drehen – abwechselnd vorwärts und rückwärts. Die Trommeln wechseln sich ab:
//   1. Rosetten und schmale Spitzbogenfenster, die gegenüberliegende Hälfte um 180° gedreht (Spitzbogen, Rosette) – vorwärts
//   2. nur Spitzbogenfenster – rückwärts
//   3. nur Rosetten – vorwärts … und so weiter, die Drehrichtung wechselt weiter von Trommel zu Trommel.
// Unter den Trommeln nur Abgrund: hinüber kommt man nur am Ankerring mit der Peitsche, zwischen den Trommeln stehen Steinringe
// zum Verschnaufen. Was oben im Mondlicht steht, wirft wie im Glasturm einen weichen, goldweißen Lichtschacht in die Röhre
// (Mantel, Kern, Streifen der Bleiruten, Lichthof, Staub) – benachbarte Trommeln laufen gegeneinander.
// Zeichnen: Röhre von innen pro Bildpunkt (wie der Glasturm, nur liegend: jede Bildzeile ist ein Strahl auf die Zylinderwand),
// die Drehung je Bildspalte nach der Trommel an dieser Stelle; Steinringe als Rippen davor; Lichtschächte nach dem Licht.
'use strict';

const Kaleido = (() => {
  const BW = 144, SH = 160, SLOTS = 8, TH = SH * SLOTS; // Joch entlang der Achse × Fensterfeld um den Umfang; acht Felder je Umlauf (Radius ≈ 200)
  const SEC0 = 8, SEC = 20, PIT = 17, N = 5;      // Trommeln ab Kachel 8, je 20 Kacheln: 17 Abgrund + 3 Steinring; fünf Trommeln
  const SPIN = 0.011;                            // Drehung je Bild (rad)
  // Felder um den Umfang je Trommelart: [Bild (0 Rosette, 1 Spitzbogen), um 180° gedreht]
  const KINDS = [
    [[0, 0], [1, 0], [0, 0], [1, 0], [1, 1], [0, 1], [1, 1], [0, 1]], // Rosette + Spitzbogen, die andere Hälfte gedreht
    [[1, 0], [1, 0], [1, 0], [1, 0], [1, 1], [1, 1], [1, 1], [1, 1]], // nur Spitzbögen
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 1], [0, 1], [0, 1], [0, 1]], // nur Rosetten
  ];
  const kindOf = (k) => (k < 0 ? 0 : k % 3);
  let T3 = null, tab = null, out = null, rayC = null, rayX = null;

  const drum = (wx) => { const k = Math.floor((wx / T - SEC0) / SEC); return k >= 0 && k < N && (wx / T - SEC0) - k * SEC < PIT ? k : -1; }; // Trommel an Welt-x (−1: Steinring/Rand)
  const dirOf = (k) => (k % 2 ? -1 : 1);
  const angle = (k, f) => dirOf(k) * f * SPIN + k * 1.3;

  // ---------------- Textur: zwei Fensterfelder (Rosette, Spitzbogen-Dreiergruppe), je mit Leuchtebene, in vier Leuchtstufen ----------------
  const RUBY = [196, 28, 52], SAPH = [36, 64, 200], EMER = [28, 150, 80], GOLD = [236, 180, 48], AMET = [128, 52, 190], AZUR = [60, 160, 230], PEARL = [228, 226, 206];
  function buildTex() {
    const hsh = (n) => { const h = Math.sin(n * 127.1 + 311.7) * 43758.5453; return h - Math.floor(h); };
    const field = (paint) => { // ein Feld BW × SH: Stein (Grund) und Glas (Grund + Leuchtebene)
      const base = new Uint8ClampedArray(BW * SH * 4), glow = new Uint8ClampedArray(BW * SH * 4);
      for (let v = 0; v < SH; v++) for (let u = 0; u < BW; u++) {
        const i = (v * BW + u) * 4, g = paint(u, v);
        let c;
        if (g && g.glass) { // Glas: dunkel im Grund, leuchtend in der Leuchtebene, leise gesprenkelt
          const n = 0.85 + 0.3 * hsh(u * 13 + v * 7), col = g.glass;
          c = col.map(x => x * 0.36 * n);
          glow[i] = col[0] * n; glow[i + 1] = col[1] * n; glow[i + 2] = col[2] * n; glow[i + 3] = 255;
          if (g.lead) { c = [10, 6, 12]; glow[i] = glow[i + 1] = glow[i + 2] = 0; }
        } else if (g && g.stone) c = g.stone;
        else { // Quadermauer, dazu Ringrippe am Jochrand und Gesims zwischen den Feldern
          const rib = u < 7 || u >= BW - 7, cor = v < 4 || v >= SH - 4;
          const row = Math.floor(v / 16), bx = Math.floor((u + (row % 2) * 12) / 24), mortar = v % 16 === 0 || (u + (row % 2) * 12) % 24 === 0;
          c = mortar ? [20, 14, 24] : (bx + row) % 3 ? [42, 34, 48] : [51, 41, 58];
          if (!mortar && v % 16 === 1) c = [70, 58, 78];
          if (cor) c = v === 0 || v === SH - 1 ? [16, 10, 20] : v === 1 || v === SH - 2 ? [104, 88, 104] : [72, 60, 80];
          if (rib) { const d = Math.min(u, BW - 1 - u); c = d < 1 ? [200, 152, 56] : d < 3 ? [96, 82, 98] : d < 5 ? [78, 66, 84] : [26, 18, 30]; }
        }
        base[i] = c[0]; base[i + 1] = c[1]; base[i + 2] = c[2]; base[i + 3] = 255;
      }
      return { base, glow };
    };
    // Rosette: Steinring mit Kugelfries, 24 Rundscheiben, 12 spitze Blütenblätter, Kranz aus sechs Pässen, goldene Sonne in der Mitte
    const cx = BW / 2, cy = SH / 2, R = Math.min(BW, SH) / 2 - 9, PET = [RUBY, SAPH, GOLD, EMER, RUBY, AZUR, AMET, SAPH, RUBY, GOLD, EMER, SAPH];
    const rose = field((u, v) => {
      const dx = u + 0.5 - cx, dy = v + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + Math.PI;
      if (d > R + 6) return null;
      if (d > R + 3) return { stone: [30, 22, 34] };
      if (d > R) return { stone: (Math.round(a / (Math.PI * 2) * 48) % 2) ? [132, 112, 120] : [96, 80, 92] }; // Kugelfries
      if (d > R * 0.84) { // 24 Rundscheiben
        const k = Math.round(a / (Math.PI * 2) * 24) % 24, ra = k / 24 * Math.PI * 2 - Math.PI, rr = R * 0.92, ox = Math.cos(ra) * rr, oy = Math.sin(ra) * rr;
        const e = Math.hypot(dx - ox, dy - oy);
        return e < R * 0.068 ? { glass: k % 2 ? RUBY : AZUR, lead: e > R * 0.06 } : { stone: [88, 74, 86] };
      }
      if (d > R * 0.8) return { stone: [110, 94, 104] };
      if (d > R * 0.34) { // zwölf spitze Blütenblätter zwischen Maßwerkspeichen
        const sec = a / (Math.PI * 2) * 12, k = Math.floor(sec) % 12, off = Math.abs(sec - Math.floor(sec) - 0.5), t = (d - R * 0.34) / (R * 0.46);
        const half = 0.36 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.92 + 0.12); // Spitze innen und außen
        if (off > half) return { stone: off > half + 0.05 ? [74, 62, 76] : [120, 104, 114] };
        const lead = off < 0.018 || Math.abs((d % 9) - 4.5) < 0.5;
        return { glass: t > 0.82 ? GOLD : PET[k], lead };
      }
      if (d > R * 0.3) return { stone: [120, 104, 114] };
      if (d > R * 0.16) { // Kranz aus sechs Pässen
        const k = Math.floor(a / (Math.PI * 2) * 6) % 6, off = Math.abs(a / (Math.PI * 2) * 6 - Math.floor(a / (Math.PI * 2) * 6) - 0.5);
        return off > 0.42 ? { stone: [96, 82, 94] } : { glass: k % 2 ? EMER : AMET, lead: Math.abs(d - R * 0.23) < 0.5 };
      }
      if (d > R * 0.14) return { stone: [140, 120, 96] };
      return { glass: d < R * 0.07 ? PEARL : GOLD, lead: d > R * 0.07 && d < R * 0.08 }; // Sonne
    });
    // Spitzbogen: drei schmale Lanzetten (die mittlere höher), Rautenverglasung mit Rubinsaum, Medaillon, darüber ein Vierpass
    const LAN = [[cx - 36, 20, 30], [cx, 22, 14], [cx + 36, 20, 30]], bottom = SH - 14;
    const inLancet = (u, v, lc, w, top, pad) => {
      const hw = w / 2 - pad, spring = top + w * 0.9;
      if (v > bottom - pad || v < top + pad || Math.abs(u + 0.5 - lc) > hw) return false;
      if (v >= spring) return true;
      const L = Math.hypot(u + 0.5 - (lc - hw), v + 0.5 - spring), Rr = Math.hypot(u + 0.5 - (lc + hw), v + 0.5 - spring);
      return L <= hw * 2 && Rr <= hw * 2;
    };
    const lancet = field((u, v) => {
      for (const [lc, w, top] of LAN) {
        if (!inLancet(u, v, lc, w + 8, top - 6, 0)) continue;
        if (!inLancet(u, v, lc, w, top, 0)) return { stone: inLancet(u, v, lc, w + 4, top - 3, 0) ? [118, 102, 112] : [66, 54, 70] }; // Laibung
        if (!inLancet(u, v, lc, w, top, 3)) return { glass: (v >> 2) % 2 ? RUBY : GOLD, lead: v % 4 === 0 }; // Saum
        const mv = (top + bottom) / 2 + 6, md = Math.hypot(u + 0.5 - lc, v + 0.5 - mv);
        if (md < 6) return { glass: md < 3 ? GOLD : RUBY, lead: Math.abs(md - 3) < 0.6 };   // Medaillon
        const q = ((u - lc + 40) + (v - top)) % 8, p = ((lc - u + 40) + (v - top)) % 8;  // Rauten
        const mid = lc === cx, dia = Math.floor(((u - lc + 40) + (v - top)) / 8 + ((lc - u + 40) + (v - top)) / 8) % 3; // Mitte rubinrot, Seiten blau
        return { glass: mid ? (dia ? RUBY : GOLD) : (dia ? SAPH : EMER), lead: q === 0 || p === 0 };
      }
      for (const qx of [cx - 18, cx + 18]) { // Vierpässe zwischen den Lanzettspitzen
        const qy = 30, d0 = Math.hypot(u + 0.5 - qx, v + 0.5 - qy);
        if (d0 > 9) continue;
        if (d0 > 7) return { stone: [110, 94, 104] };
        for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) if (Math.hypot(u + 0.5 - qx - ox, v + 0.5 - qy - oy) < 3.2) return { glass: EMER, lead: false };
        return { stone: [84, 70, 84] };
      }
      return null;
    });
    // Überstrahlen: das Gegenlicht blutet über Bleiruten und Laibung (Leuchtebene weich gezeichnet)
    const bloom = (g) => {
      const c = document.createElement('canvas'); c.width = BW; c.height = SH; const x = c.getContext('2d', { willReadFrequently: true });
      x.putImageData(new ImageData(g, BW, SH), 0, 0);
      const t = document.createElement('canvas'); t.width = BW; t.height = SH; t.getContext('2d').drawImage(c, 0, 0);
      x.globalCompositeOperation = 'lighter'; x.filter = 'blur(2px)'; x.globalAlpha = 0.6; x.drawImage(t, 0, 0); x.filter = 'blur(6px)'; x.globalAlpha = 0.4; x.drawImage(t, 0, 0); x.filter = 'none';
      return x.getImageData(0, 0, BW, SH).data;
    };
    const levels = (F) => { // vier Leuchtstufen: vom Mond abgewandt bis voll beschienen
      const a = F.base, gl = bloom(F.glow);
      return [[0.5, 0.05], [0.75, 0.22], [0.95, 0.5], [1.05, 0.92]].map(([m, k]) => {
        const o = new Int32Array(BW * SH);
        for (let i = 0, j = 0; i < o.length; i++, j += 4) o[i] = (255 << 24) | (Math.min(255, a[j + 2] * m + gl[j + 2] * k) << 16) | (Math.min(255, a[j + 1] * m + gl[j + 1] * k) << 8) | Math.min(255, a[j] * m + gl[j] * k);
        return o;
      });
    };
    // Fenster für die Lichtschächte (Feldkoordinaten): Rosette als Ganzes, Spitzbögen als Dreiergruppe
    const wins = [{ u: cx, hw: R * 0.72, v0: cy - R * 0.9, v1: cy + R * 0.9, col: [150, 70, 170], acc: GOLD }, { u: cx, hw: 46, v0: 14, v1: bottom, col: [70, 96, 220], acc: RUBY }];
    T3 = { img: [levels(rose), levels(lancet)], wins };
  }
  // Röhrentabelle: jede Bildzeile y trifft die Zylinderwand an der Umfangsstelle v[y]; s[y] = Maßstab entlang der Achse
  // (fern in der Bildmitte klein, nah oben und unten groß); light[y] = Mondlicht (oben hell, unten dunkel)
  function table() {
    if (tab) return tab;
    const H = 208, R = TH / (2 * Math.PI), dd = R * 0.3, f = (H / 2) / Math.tan(0.78); // enges Blickfeld: die riesige Röhre wölbt sich flach, die Fenster bleiben groß
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

  // Hintergrund: die Röhre, je Spalte um den Winkel ihrer Trommel gedreht und mit ihren Fenstern; davor die Steinringe
  function drawTube(ctx, cam, frame) {
    if (!T3) buildTex();
    const w = View.w, H = 208, tb = table(), IMG = T3.img;
    if (!out || out.w !== w) { const c = document.createElement('canvas'); c.width = w; c.height = H; const x = c.getContext('2d'), img = x.createImageData(w, H); out = { w, c, x, img, buf: new Int32Array(img.data.buffer) }; }
    const buf = out.buf, uo = cam.x * 0.5 + BW * 64;
    // je Trommel eine Zeilentabelle: welches Fensterfeld (Bild, gedreht) und welche Feldzeile jede Bildzeile trifft – in der
    // Pixelschleife bleibt dann nur noch die Spalte entlang der Achse
    if (!out.rows) out.rows = [...Array(N + 1)].map(() => ({ img: new Uint8Array(H), flip: new Uint8Array(H), base: new Int32Array(H) }));
    for (let k = -1; k < N; k++) {
      const R = out.rows[k + 1], rot = k < 0 ? 0 : angle(k, frame) / (Math.PI * 2) * TH, KD = KINDS[kindOf(k)];
      for (let y = 0; y < H; y++) {
        const v = ((Math.floor(tb.v[y] + rot) % TH) + TH) % TH, sl = (v / SH) | 0, lv = v - sl * SH, f = KD[sl];
        R.img[y] = f[0]; R.flip[y] = f[1]; R.base[y] = (f[1] ? SH - 1 - lv : lv) * BW;
      }
    }
    for (let x = 0; x < w; x++) {
      const R = out.rows[drum(cam.x + x) + 1], dx = x - w / 2, bx = x & 3;
      for (let y = 0, o = x; y < H; y++, o += w) {
        let u = ((uo + dx * tb.s[y]) | 0) % BW; if (R.flip[y]) u = BW - 1 - u;
        const L = tb.light[y], lo = L | 0, LV = IMG[R.img[y]];
        buf[o] = (BAY4[((y & 3) << 2) | bx] < (L - lo) * 16 ? LV[lo + 1] : LV[lo])[R.base[y] + u];
      }
    }
    out.x.putImageData(out.img, 0, 0);
    ctx.drawImage(out.c, 0, 0);
    const sh = ctx.createLinearGradient(0, 0, 0, H); // ferne Wand im Dunst, unten der Abgrund dunkel
    sh.addColorStop(0, 'rgba(8,4,16,0.08)'); sh.addColorStop(0.45, 'rgba(8,4,16,0.36)'); sh.addColorStop(1, 'rgba(4,2,10,0.64)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, w, H);
    for (let k = -1; k < N; k++) { // Steinringe: Rippen aus dunklem Stein mit Goldkante, wo zwei Trommeln gegeneinander laufen
      const x0 = Math.round((SEC0 + k * SEC + PIT) * T - cam.x), x1 = x0 + 3 * T;
      if (k < 0 || x1 < -8 || x0 > w + 8) continue;
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, '#120c14'); g.addColorStop(0.2, '#3c3038'); g.addColorStop(0.5, '#5c4c50'); g.addColorStop(0.8, '#3c3038'); g.addColorStop(1, '#120c14');
      ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.fillStyle = '#c89838'; ctx.fillRect(x0 + 3, 0, 1, H); ctx.fillRect(x1 - 4, 0, 1, H);
      ctx.fillStyle = '#7c5c20'; for (let y = (frame >> 3) % 2 ? 6 : 10; y < H; y += 18) { ctx.fillRect(x0 + 6, y, 2, 2); ctx.fillRect(x1 - 8, y, 2, 2); } // Nieten
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x0 - 3, 0, 3, H); ctx.fillRect(x1, 0, 3, H); // Fugen: hier dreht sich die Nachbartrommel
    }
  }

  // Fenster auf dem Bildschirm: je sichtbare Trommel und Fensterfeld die Bildzeile seiner Mitte (Umfang + Drehung der Trommel), die
  // Spalten (entlang der Achse, je Joch, mit der Röhrenparallaxe) und die Breite; oben steht es im Mondlicht und wirft einen Schacht
  function beams(cam, frame) {
    if (!T3) buildTex();
    const out = [], w = View.w, tb = table(), H = 208, u0 = cam.x * 0.5, v0 = tb.v[0], v1 = tb.v[H - 1];
    const rowOf = (v) => { let lo = 0, hi = H - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tb.v[m] < v) lo = m + 1; else hi = m; } return lo; };
    for (let k = 0; k < N; k++) {
      const xs = (SEC0 + k * SEC) * T - cam.x, xe = xs + PIT * T; if (xs > w + 40 || xe < -40) continue;
      const rot = angle(k, frame) / (Math.PI * 2) * TH, KD = KINDS[kindOf(k)];
      KD.forEach(([im, flip], sl) => {
        const win = T3.wins[im], mid = sl * SH + (flip ? SH - (win.v0 + win.v1) / 2 : (win.v0 + win.v1) / 2), half = (win.v1 - win.v0) / 2;
        const vc = (((mid - rot - v0) % TH) + TH) % TH + v0; // Fenstermitte relativ zur sichtbaren Wand
        if (vc > v1) return;
        const y = rowOf(vc), L = tb.light[y]; if (L < 1.7) return; // nur oben im vollen Mondlicht
        const s = tb.s[y], hw = win.hw / s, yT = rowOf(Math.max(v0, vc - half)), kL = Math.min(1, (L - 1.7) / 0.8);
        const rgb = win.col.map((c, j) => Math.round(Math.min(255, c * 0.62 + win.acc[j] * 0.18 + 70)));
        for (let n = -8; n <= 8; n++) {
          const x = w / 2 + (win.u + n * BW - (u0 % BW)) / s;
          if (x + hw < xs - 10 || x - hw > xe + 10) continue;
          out.push({ x0: x - hw, ww: hw * 2, wy: (yT + y) / 2, len: 190 + hw * 2, slant: 0.28 * dirOf(k) + (x / w - 0.5) * 0.3, col: rgb.join(','), k: kL * (0.8 + 0.2 * Math.sin(frame * 0.017 + sl + n + k)), id: k * 97 + sl * 13 + n, cx0: xs, cx1: xe });
        }
      });
    }
    return out.sort((a, b) => b.k - a.k).slice(0, View.lite ? 6 : 10); // die hellsten zuerst, höchstens zehn
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
      beam(0.02, 0.98, 0.2);                                                             // Mantel
      beam(0.25, 0.75, 0.22);                                                            // Kern
      for (let i = 0; i < (lite ? 2 : 4); i++) { const n = lite ? 2 : 4, f = (i + 0.5) / n + 0.035 * Math.sin(frame * 0.012 + i * 2.1 + b.id), h = 0.03 + 0.02 * hsh2(i + b.id * 7); beam(f - h, f + h, 0.12 + 0.06 * Math.sin(frame * 0.02 + i + b.id)); } // Streifen
      const halo = x.createRadialGradient(x0 + ww / 2, wy, 0, x0 + ww / 2, wy, ww * 0.9); // Lichthof ums Glas
      halo.addColorStop(0, `rgba(${col},${(0.22 * k).toFixed(3)})`); halo.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = halo; x.fillRect(x0 - ww * 0.4, wy - ww, ww * 1.8, ww * 2);
      x.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rayC, 0, 0, hw2, 104, 0, 0, hw2 * 2, 208);
    ctx.fillStyle = '#fff8e6';
    for (const b of B) for (let m = 0; m < (lite ? 5 : 10); m++) { // Staubkörnchen treiben langsam durch das Licht
      const t = (hsh2(m + b.id * 31) + frame * (0.0006 + hsh2(m * 3 + b.id) * 0.0009)) % 1, f = 0.1 + 0.8 * hsh2(m * 7 + b.id * 3) + 0.04 * Math.sin(frame * 0.017 + m);
      const along = t * b.len * 0.85, wid = b.ww * (1 + 0.6 * t), X = b.x0 + b.ww / 2 + (f - 0.5) * wid + along * b.slant, Y = b.wy + along;
      if (X < b.cx0 || X > b.cx1) continue;
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.85 * b.k * (0.5 + 0.5 * Math.sin(frame * 0.09 + m * 2.3)));
      ctx.fillRect(Math.round(X), Math.round(Y), m % 5 ? 1 : 2, 1);
    }
    ctx.globalAlpha = 1;
    const fog = ctx.createLinearGradient(0, 150, 0, 208); // farbiger Lichtnebel über dem Abgrund, gemischt aus den Glasfarben
    const mix = B.reduce((m, b) => { const c = b.col.split(',').map(Number); return [m[0] + c[0] * b.k, m[1] + c[1] * b.k, m[2] + c[2] * b.k, m[3] + b.k]; }, [0, 0, 0, 0]);
    if (mix[3] > 0) { const c = mix.slice(0, 3).map(v => Math.round(v / mix[3])).join(','); fog.addColorStop(0, `rgba(${c},0)`); fog.addColorStop(1, `rgba(${c},${Math.min(0.12, 0.03 * mix[3]).toFixed(3)})`); ctx.fillStyle = fog; ctx.fillRect(0, 150, w, 58); }
    ctx.restore();
  }
  return { drawTube, drawRays, drum, SEC0, SEC, PIT, N, prewarm() { if (!T3) buildTex(); table(); } };
})();
