// Kaleidoskop (Schloss-Modus, über der Sonnenkathedrale): eine liegende Röhre aus Buntglas, in Trommeln geteilt, die sich um
// ihre Längsachse drehen – abwechselnd vorwärts und rückwärts. Unter den Trommeln nur Abgrund: hinüber kommt man nur am
// Ankerring mit der Peitsche, zwischen den Trommeln stehen Steinringe zum Verschnaufen. Mondlicht fällt durch die Fenster als
// farbige Lichtschächte in die Röhre (Mantel, Kern, Streifen, Staub, Lichthof, farbiger Dunst über dem Abgrund) und wandert mit
// jeder Trommel um – benachbarte Trommeln laufen gegeneinander.
// Zeichnen: Röhre von innen pro Bildpunkt (wie der Glasturm, nur liegend: jede Bildzeile ist ein Strahl auf die Zylinderwand),
// die Drehung je Bildspalte nach der Trommel an dieser Stelle; Steinringe als Rippen davor; Lichtschächte nach dem Licht.
'use strict';

const Kaleido = (() => {
  const TW = 256, TH = 512;                     // Textur: entlang der Achse × um den Umfang (ein Umlauf)
  const SEC0 = 8, SEC = 20, PIT = 17, N = 5;      // Trommeln ab Kachel 8, je 20 Kacheln: 17 Abgrund + 3 Steinring; fünf Trommeln
  const SPIN = 0.011;                            // Drehung je Bild (rad)
  const GLASS = [[200, 24, 48], [36, 72, 220], [24, 156, 84], [236, 176, 40], [132, 48, 196], [236, 120, 28], [60, 176, 220]];
  let T3 = null, tab = null, out = null, rayC = null, rayX = null;

  const hsh = (n) => { const h = Math.sin(n * 127.1 + 311.7) * 43758.5453; return h - Math.floor(h); };
  const drum = (wx) => { const k = Math.floor((wx / T - SEC0) / SEC); return k >= 0 && k < N && (wx / T - SEC0) - k * SEC < PIT ? k : -1; }; // Trommel an Welt-x (−1: Steinring/Rand)
  const dirOf = (k) => (k % 2 ? -1 : 1);
  const angle = (k, f) => dirOf(k) * f * SPIN + k * 1.3;

  // ---------------- Textur: Lanzettfenster mit Butzen aus farbigem Glas, Bleiruten, Steinpfosten; dazwischen Rosetten ----------------
  function buildTex() {
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d');
    const g = document.createElement('canvas'); g.width = TW; g.height = TH; const gx = g.getContext('2d'); // Leuchtebene (nur Glas)
    x.fillStyle = '#100a14'; x.fillRect(0, 0, TW, TH);
    for (let y = 0; y < TH; y += 8) for (let u = 0; u < TW; u += 16) { // Mauerwerk zwischen den Fenstern
      x.fillStyle = (Math.floor(y / 8) + Math.floor(u / 16)) % 3 ? '#1c1420' : '#241a28'; x.fillRect(u + ((y / 8) % 2) * 8, y, 15, 7);
    }
    const pane = (px, py, pw, ph, col, k) => { // eine Butze: Glas mit Schimmer, darunter die Leuchtebene
      const [r, gg, b] = col, m = 0.55 + 0.45 * k;
      x.fillStyle = `rgb(${Math.round(r * 0.42 * m)},${Math.round(gg * 0.42 * m)},${Math.round(b * 0.42 * m)})`; x.fillRect(px, py, pw, ph);
      x.fillStyle = `rgba(255,255,255,${(0.05 + 0.08 * k).toFixed(3)})`; x.fillRect(px, py, Math.max(1, pw >> 2), ph);
      gx.fillStyle = `rgb(${Math.round(r * m)},${Math.round(gg * m)},${Math.round(b * m)})`; gx.fillRect(px, py, pw, ph);
    };
    const lancet = (u0, v0, w, h, seed) => { // Spitzbogenfenster: Rahmen, Butzen im Rautenraster, Bleiruten
      x.fillStyle = '#3c3040'; x.fillRect(u0 - 3, v0 - 3, w + 6, h + 6);
      x.fillStyle = '#6c5c64'; x.fillRect(u0 - 3, v0 - 3, w + 6, 1);
      for (let yy = 0; yy < h; yy += 6) for (let xx = 0; xx < w; xx += 6) {
        const arch = yy < w / 2 ? Math.abs(xx + 3 - w / 2) > Math.sqrt(Math.max(0, (w / 2) ** 2 - (w / 2 - yy) ** 2)) : false; // Bogen oben
        if (arch) continue;
        const ci = Math.floor(hsh(seed + xx * 0.37 + yy * 0.11) * 4 + (yy / h) * 3) % GLASS.length;
        pane(u0 + xx, v0 + yy, 5, 5, GLASS[(ci + seed) % GLASS.length], hsh(seed * 3 + xx + yy * 7));
      }
      x.fillStyle = '#0a060c'; for (let yy = 0; yy < h; yy += 6) x.fillRect(u0, v0 + yy + 5, w, 1); // Bleiruten
      for (let xx = 0; xx < w; xx += 6) x.fillRect(u0 + xx + 5, v0 + w / 2, 1, h - w / 2);
      x.fillStyle = '#5c4c58'; x.fillRect(u0 + w / 2 - 1, v0 + w / 2, 2, h - w / 2); // Mittelpfosten
    };
    const rose = (cu, cv, r, seed) => { // Rosette: Ring aus Blütenblättern um eine Sonne
      x.fillStyle = '#3c3040'; x.beginPath(); x.arc(cu, cv, r + 4, 0, Math.PI * 2); x.fill();
      for (let yy = -r; yy <= r; yy += 4) for (let xx = -r; xx <= r; xx += 4) {
        const d = Math.hypot(xx, yy); if (d > r) continue;
        const a = Math.atan2(yy, xx), petal = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12);
        const ci = d < r * 0.3 ? 3 : (petal + Math.floor(d / (r / 3)) + seed) % GLASS.length;
        pane(cu + xx, cv + yy, 3, 3, GLASS[ci], d < r * 0.3 ? 1 : hsh(petal + seed));
      }
      x.strokeStyle = '#0a060c'; x.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(cu + Math.cos(a) * r * 0.3, cv + Math.sin(a) * r * 0.3); x.lineTo(cu + Math.cos(a) * r, cv + Math.sin(a) * r); x.stroke(); }
      for (const rr of [r * 0.3, r * 0.66, r]) { x.beginPath(); x.arc(cu, cv, rr, 0, Math.PI * 2); x.stroke(); }
    };
    for (let i = 0; i < 4; i++) lancet(i * 64 + 14, 24, 36, 132, i * 5 + 1);       // obere Fensterreihe
    for (let i = 0; i < 4; i++) rose(i * 64 + 32, 222, 26, i * 3 + 2);            // Rosetten
    for (let i = 0; i < 4; i++) lancet(i * 64 + 14, 280, 36, 132, i * 7 + 11);     // untere Fensterreihe
    for (let i = 0; i < 4; i++) rose(i * 64 + 32, 470, 22, i * 5 + 4);
    const a = x.getImageData(0, 0, TW, TH).data, gl = gx.getImageData(0, 0, TW, TH).data;
    const lv = [0.12, 0.45, 0.85, 1.4].map(k => { // vier Leuchtstufen: vom Mond abgewandt bis voll beschienen
      const o = new Int32Array(TW * TH);
      for (let i = 0, j = 0; i < o.length; i++, j += 4) {
        const r = Math.min(255, a[j] * (0.7 + k * 0.3) + gl[j] * k), gg = Math.min(255, a[j + 1] * (0.7 + k * 0.3) + gl[j + 1] * k), b = Math.min(255, a[j + 2] * (0.7 + k * 0.3) + gl[j + 2] * k);
        o[i] = (255 << 24) | (b << 16) | (gg << 8) | r;
      }
      return o;
    });
    T3 = { lv };
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

  // Fenster je Trommel (entlang der Achse versetzt): Lichtschacht, solange das Fenster dem Mond zugewandt ist
  function beams(cam, frame) {
    const out = [], w = View.w;
    for (let k = 0; k < N; k++) {
      const xs = (SEC0 + k * SEC) * T - cam.x; if (xs > w + 40 || xs + PIT * T < -40) continue;
      for (let i = 0; i < 4; i++) {
        const a = angle(k, frame) + i * 1.57 + k * 0.4, c = Math.cos(a); // Fenster i der Trommel k: oben (c = 1) im vollen Mondlicht
        if (c < 0.15) continue;
        const xw = xs + (2 + i * 4.2) * T, yw = 104 - 150 * c, col = GLASS[(i * 3 + k * 2) % GLASS.length];
        out.push({ x: xw, y: yw, ww: 34, k: Math.pow((c - 0.15) / 0.85, 1.4), slant: 0.22 * dirOf(k) * Math.sin(a) + 0.12, col: col.map(v => Math.round(Math.min(255, v * 0.7 + 70))).join(','), id: k * 4 + i, x0: xs, x1: xs + PIT * T });
      }
    }
    return out;
  }
  // Volumetrische Lichtschächte (nach dem Licht gezeichnet, additiv): halbe Auflösung, Mantel, Kern, Streifen, Lichthof, Staub
  function drawRays(ctx, cam, frame) {
    const B = beams(cam, frame); if (!B.length) return;
    const w = View.w, hw2 = Math.ceil(w / 2), lite = View.lite;
    if (!rayC || rayC.width !== hw2) { rayC = document.createElement('canvas'); rayC.width = hw2; rayC.height = 104; rayX = rayC.getContext('2d'); }
    const x = rayX; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, hw2, 104); x.setTransform(0.5, 0, 0, 0.5, 0, 0); x.globalCompositeOperation = 'lighter';
    for (const b of B) {
      x.save(); x.beginPath(); x.rect(b.x0, 0, b.x1 - b.x0, 208); x.clip(); // jeder Schacht bleibt in seiner Trommel
      const len = 260, beam = (f0, f1, a) => {
        const ax = b.x - b.ww / 2 + b.ww * f0, bx = b.x - b.ww / 2 + b.ww * f1, mx = (ax + bx) / 2;
        const gr = x.createLinearGradient(mx, b.y, mx + len * b.slant, b.y + len);
        gr.addColorStop(0, `rgba(${b.col},${(a * b.k).toFixed(3)})`); gr.addColorStop(0.5, `rgba(${b.col},${(a * b.k * 0.5).toFixed(3)})`); gr.addColorStop(1, `rgba(${b.col},0)`);
        x.fillStyle = gr; x.beginPath(); x.moveTo(ax, b.y); x.lineTo(bx, b.y);
        x.lineTo(mx + (bx - mx) * 1.7 + len * b.slant, b.y + len); x.lineTo(mx + (ax - mx) * 1.7 + len * b.slant, b.y + len); x.closePath(); x.fill();
      };
      beam(0, 1, 0.26);                                                     // Mantel
      beam(0.28, 0.72, 0.3);                                                // Kern
      for (let i = 0; i < (lite ? 2 : 5); i++) { const f = (i + 0.5) / (lite ? 2 : 5) + 0.04 * Math.sin(frame * 0.013 + i * 2.1 + b.id); beam(f - 0.03, f + 0.03, 0.12 + 0.06 * Math.sin(frame * 0.021 + i + b.id)); } // Bleiruten werfen Streifen
      if (b.y > -30) { const h = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, 40); h.addColorStop(0, `rgba(${b.col},${(0.3 * b.k).toFixed(3)})`); h.addColorStop(1, `rgba(${b.col},0)`); x.fillStyle = h; x.fillRect(b.x - 40, b.y - 40, 80, 80); } // Lichthof ums Glas
      x.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rayC, 0, 0, hw2, 104, 0, 0, hw2 * 2, 208);
    for (const b of B) for (let m = 0; m < (lite ? 6 : 12); m++) { // Staub treibt durch das farbige Licht
      const t = (hsh(m + b.id * 31) + frame * (0.0007 + hsh(m * 3 + b.id) * 0.001)) % 1, along = t * 200;
      const X = b.x + (hsh(m * 7 + b.id) - 0.5) * b.ww * (1 + t) + along * b.slant, Y = b.y + along;
      if (X < b.x0 || X > b.x1) continue;
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.8 * b.k * (0.5 + 0.5 * Math.sin(frame * 0.09 + m * 2.3)));
      ctx.fillStyle = `rgb(${b.col})`; ctx.fillRect(Math.round(X), Math.round(Y), m % 4 ? 1 : 2, m % 4 ? 1 : 2);
    }
    ctx.globalAlpha = 1;
    const fog = ctx.createLinearGradient(0, 150, 0, 208); // farbiger Lichtnebel über dem Abgrund, gemischt aus den Glasfarben
    const mix = B.reduce((m, b) => { const c = b.col.split(',').map(Number); return [m[0] + c[0] * b.k, m[1] + c[1] * b.k, m[2] + c[2] * b.k, m[3] + b.k]; }, [0, 0, 0, 0]);
    if (mix[3] > 0) { const c = mix.slice(0, 3).map(v => Math.round(v / mix[3])).join(','); fog.addColorStop(0, `rgba(${c},0)`); fog.addColorStop(1, `rgba(${c},${Math.min(0.22, 0.06 * mix[3]).toFixed(3)})`); ctx.fillStyle = fog; ctx.fillRect(0, 150, w, 58); }
    ctx.restore();
  }
  return { drawTube, drawRays, drum, SEC0, SEC, PIT, N, prewarm() { if (!T3) buildTex(); table(); } };
})();
