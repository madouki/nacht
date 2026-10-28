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
  const TW = 512, TH = 624;                     // Textur (Glasturm): entlang der Achse × um den Umfang (ein Umlauf = drei Fensterreihen)
  const SEC0 = 8, SEC = 20, PIT = 17, N = 5;      // Trommeln ab Kachel 8, je 20 Kacheln: 17 Abgrund + 3 Steinring; fünf Trommeln
  const SPIN = 0.011;                            // Drehung je Bild (rad)
  let T3 = null, tab = null, out = null, rayC = null, rayX = null;

  const drum = (wx) => { const k = Math.floor((wx / T - SEC0) / SEC); return k >= 0 && k < N && (wx / T - SEC0) - k * SEC < PIT ? k : -1; }; // Trommel an Welt-x (−1: Steinring/Rand)
  const dirOf = (k) => (k % 2 ? -1 : 1);
  const angle = (k, f) => dirOf(k) * f * SPIN + k * 1.3;

  // ---------------- Textur: die Fenster des Glasturms (Tiles), in vier Leuchtstufen: vom Mond abgewandt bis voll beschienen ----------------
  function buildTex() {
    const wall = Tiles.layer('glass', 'wall'), glow = Tiles.layer('glass', 'glassGlow');
    const a = wall.c.getContext('2d').getImageData(0, 0, TW, TH).data, gl = glow.c.getContext('2d').getImageData(0, 0, TW, TH).data;
    const lv = [[0.5, 0.04], [0.75, 0.2], [0.95, 0.46], [1.05, 0.86]].map(([m, k]) => {
      const o = new Int32Array(TW * TH);
      for (let i = 0, j = 0; i < o.length; i++, j += 4) {
        const r = Math.min(255, a[j] * m + gl[j] * k), gg = Math.min(255, a[j + 1] * m + gl[j + 1] * k), b = Math.min(255, a[j + 2] * m + gl[j + 2] * k);
        o[i] = (255 << 24) | (b << 16) | (gg << 8) | r;
      }
      return o;
    });
    T3 = { lv, wins: Tiles.glassWins() || [] };
  }
  // Röhrentabelle: jede Bildzeile y trifft die Zylinderwand an der Umfangsstelle v[y]; s[y] = Maßstab entlang der Achse
  // (fern in der Bildmitte klein, nah oben und unten groß); light[y] = Mondlicht (oben hell, unten dunkel)
  function table() {
    if (tab) return tab;
    const H = 208, R = TH / (2 * Math.PI), dd = R * 0.3, f = (H / 2) / Math.tan(1.0);
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

  // Hintergrund: die Röhre, je Spalte um den Winkel ihrer Trommel gedreht; davor die Steinringe zwischen den Trommeln
  function drawTube(ctx, cam, frame) {
    if (!T3) buildTex();
    const w = View.w, H = 208, tb = table(), LV = T3.lv;
    if (!out || out.w !== w) { const c = document.createElement('canvas'); c.width = w; c.height = H; const x = c.getContext('2d'), img = x.createImageData(w, H); out = { w, c, x, img, buf: new Int32Array(img.data.buffer) }; }
    const buf = out.buf, u0 = cam.x * 0.5, rots = new Float32Array(N + 1);
    for (let k = 0; k < N; k++) rots[k] = angle(k, frame) / (Math.PI * 2) * TH;
    for (let x = 0; x < w; x++) {
      const k = drum(cam.x + x), rot = k < 0 ? 0 : rots[k], dx = x - w / 2;
      for (let y = 0, o = x; y < H; y++, o += w) {
        const u = ((Math.floor(u0 + dx * tb.s[y]) % TW) + TW) % TW, v = ((Math.floor(tb.v[y] + rot) % TH) + TH) % TH;
        const L = tb.light[y], lo = L | 0, fr = (L - lo) * 16;
        buf[o] = (BAY4[((y & 3) << 2) | (x & 3)] < fr ? LV[lo + 1] : LV[lo])[v * TW + u];
      }
    }
    out.x.putImageData(out.img, 0, 0);
    ctx.drawImage(out.c, 0, 0);
    const sh = ctx.createLinearGradient(0, 0, 0, H); // ferne Wand im Dunst, unten der Abgrund dunkel
    sh.addColorStop(0, 'rgba(8,4,16,0.05)'); sh.addColorStop(0.45, 'rgba(8,4,16,0.32)'); sh.addColorStop(1, 'rgba(4,2,10,0.62)');
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

  // Fenster auf dem Bildschirm: je sichtbare Trommel und Fenster die Bildzeile seiner Mitte (Umfang + Drehung der Trommel), die Spalte
  // (entlang der Achse, mit der Röhrenparallaxe) und die Breite; oben steht es im Mondlicht und wirft einen Schacht
  function beams(cam, frame) {
    if (!T3) buildTex();
    const out = [], w = View.w, tb = table(), H = 208, u0 = cam.x * 0.5, v0 = tb.v[0], v1 = tb.v[H - 1];
    const rowOf = (v) => { let lo = 0, hi = H - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tb.v[m] < v) lo = m + 1; else hi = m; } return lo; };
    for (let k = 0; k < N; k++) {
      const xs = (SEC0 + k * SEC) * T - cam.x, xe = xs + PIT * T; if (xs > w + 40 || xe < -40) continue;
      const rot = angle(k, frame) / (Math.PI * 2) * TH;
      T3.wins.forEach((win, wi) => {
        const vc = ((((win.v0 + win.v1) / 2 - rot - v0) % TH) + TH) % TH + v0; // Fenstermitte relativ zur sichtbaren Wand
        if (vc > v1) return;
        const y = rowOf(vc), L = tb.light[y]; if (L < 0.9) return;     // unten im Schatten: kein Schacht
        const s = tb.s[y], hw = win.hw / s;
        for (let n = -2; n <= 2; n++) {
          const x = w / 2 + (win.u + n * TW - u0) / s;
          if (x + hw < xs - 20 || x - hw > xe + 20) continue;
          const yT = rowOf(Math.min(v1, Math.max(v0, vc - (win.v1 - win.v0) / 2))), yB = rowOf(Math.min(v1, Math.max(v0, vc + (win.v1 - win.v0) / 2)));
          const kL = Math.min(1, (L - 0.9) / 1.3), rgb = win.col.map((c, j) => Math.round(Math.min(255, c * 0.62 + win.acc[j] * 0.18 + 70)));
          out.push({ x0: x - hw, ww: hw * 2, wy: (yT + y) / 2, yT, yB, len: 200 + hw * 1.6, slant: 0.3 * dirOf(k) + (x / w - 0.5) * 0.35, col: rgb.join(','), k: kL * (0.85 + 0.15 * Math.sin(frame * 0.017 + wi + k)), id: k * 16 + wi, cx0: xs, cx1: xe });
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
