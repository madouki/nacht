// Spiegelräume (Schloss-Modus): Spiegeltunnel und Spiegelschacht spiegeln wirklich. Am Ende jedes Bildes merkt sich capture()
// das fertige Spielfeld; im nächsten Bild legt reflect() es unter das durchscheinende Spiegelglas der Röhre. Die nahen Wände
// zeigen es gekippt (liegende Röhre: Decke und Boden kippen senkrecht, stehender Turm: die Seitenwände waagerecht), die
// Rückwand verkleinert zum Fluchtpunkt – und weil in diesem Spiegelbild wieder die Spiegel zu sehen sind, wird daraus ein
// endloser Spiegeltunnel. Held, Gegner, Kerzen und Geschosse erscheinen so von selbst im Glas.
'use strict';

const Mirror = (() => {
  const K = 0.56; // Rückwand: der Held steht in der Röhrenmitte, sein Spiegelbild doppelt so weit hinten
  let prev = null, px = null, far = null, fx = null, mask = null, maskKey = '', live = false;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; // GPU-Leinwände
  function ensure(w) {
    if (prev && prev.width === w) return;
    prev = canvas(w, 208); px = prev.getContext('2d');
    far = canvas(w, 208); fx = far.getContext('2d');
    live = false;
  }
  // Ende von World.draw: das Spielfeld dieses Bildes (ohne HUD) für das nächste Bild festhalten
  function capture(ctx) {
    const cv = ctx.canvas, w = View.w, s = cv.width / w;
    ensure(w);
    px.drawImage(cv, 0, 32 * s, w * s, 208 * s, 0, 0, w, 208);
    live = true;
  }
  // weiche Maske für die Rückwand: liegende Röhre ein waagerechtes Band in Augenhöhe, Turm ein senkrechtes Band in der Mitte
  function buildMask(w, axis) {
    mask = canvas(w, 208); const m = mask.getContext('2d'), fw = w * K, x0 = (w - fw) / 2, y0 = 104 * (1 - K), y1 = y0 + 208 * K;
    const lin = (a, b, stops) => { const g = axis === 'v' ? m.createLinearGradient(0, a, 0, b) : m.createLinearGradient(a, 0, b, 0); stops.forEach(([o, al]) => g.addColorStop(o, `rgba(0,0,0,${al})`)); return g; };
    if (axis === 'v') {
      m.fillStyle = lin(y0, y1, [[0, 0], [0.22, 1], [0.78, 1], [1, 0]]); m.fillRect(0, 0, w, 208);
      m.globalCompositeOperation = 'destination-in';
      const g = m.createLinearGradient(x0, 0, x0 + fw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.12, 'rgba(0,0,0,1)'); g.addColorStop(0.88, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(0, 0, w, 208);
    } else {
      m.fillStyle = lin(x0, x0 + fw, [[0, 0], [0.3, 1], [0.7, 1], [1, 0]]); m.fillRect(0, 0, w, 208);
      m.globalCompositeOperation = 'destination-in';
      const g = m.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.1, 'rgba(0,0,0,1)'); g.addColorStop(0.9, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(0, 0, w, 208);
    }
    maskKey = w + axis;
  }
  // Untergrund der Röhre zeichnen: dunkel, darauf das gespiegelte letzte Bild; danach legt die Röhre ihr Glas darüber
  function reflect(ctx, axis) {
    const w = View.w;
    ctx.fillStyle = '#05040c'; ctx.fillRect(0, 0, w, 208);
    if (!live || !prev || prev.width !== w) return;
    if (axis === 'hall') { // gerade Spiegelwand (Spiegelkabinett): der ganze Saal noch einmal, zum Fluchtpunkt (Bildmitte, Höhe 60) hin verkleinert
      const k = 0.8; ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(prev, w * (1 - k) / 2, 60 * (1 - k), w * k, 208 * k); ctx.restore(); return;
    }
    ctx.save();
    ctx.globalAlpha = 0.9;
    if (axis === 'v') { ctx.translate(0, 208); ctx.scale(1, -1); } else { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(prev, 0, 0);
    ctx.restore();
    if (maskKey !== w + axis) buildMask(w, axis);
    fx.globalCompositeOperation = 'source-over'; fx.clearRect(0, 0, w, 208);
    fx.drawImage(prev, w * (1 - K) / 2, 104 * (1 - K), w * K, 208 * K);
    fx.globalCompositeOperation = 'destination-in'; fx.drawImage(mask, 0, 0); fx.globalCompositeOperation = 'source-over';
    ctx.drawImage(far, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // Silber wirft Licht zurück – knapp, sonst schaukelt sich die Spiegelung in der Tiefe zu Weiß auf
    ctx.globalAlpha = 0.12; ctx.drawImage(far, 0, 0);
    ctx.restore();
  }
  const reset = () => { live = false; };

  // ---------------- Kristalllüster wie in der Galerie des Glaces ----------------
  // Goldkette, Krone, Baluster mit Kristallkugel, zwei Kränze von Kerzenarmen, Girlanden aus Kristallperlen und lange
  // Pendeloquen, unten ein großer Tropfen. Hängen hinter der Spielebene (Parallaxe), wiegen sich, Kerzen flackern, Kristalle
  // blitzen – und erscheinen natürlich auch in den Spiegeln.
  let luster = null, halo = null;
  const LW = 72, LH = 96, ARMS = [{ y: 52, rx: 30, n: 8 }, { y: 36, rx: 19, n: 6 }];
  function buildLuster() {
    luster = canvas(LW, LH); const x = luster.getContext('2d'), cx = LW / 2;
    const g = (k) => `rgb(${GOLD[k].join(',')})`, cr = (a) => `rgba(232,246,255,${a})`;
    const P = (c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); };
    for (let y = 0; y < 14; y += 3) { P(g(1), cx - 1, y, 3, 2); P(g(4), cx - (y % 6 ? 0 : 1), y, 1, 2); } // Kette
    P(g(2), cx - 6, 14, 13, 3); for (let k = -6; k <= 6; k += 3) { P(g(5), cx + k, 12, 1, 2); P(cr(1), cx + k, 11); } // Krone
    for (let y = 17; y < 64; y++) { const r = 2 + Math.round(Math.abs(Math.sin((y - 17) * 0.24)) * 3); P(g(2), cx - r, y, r * 2 + 1, 1); P(g(5), cx - r + 1, y); } // Baluster
    x.fillStyle = 'rgba(200,230,255,0.75)'; x.beginPath(); x.arc(cx, 44, 6, 0, Math.PI * 2); x.fill(); P('#ffffff', cx - 3, 41, 2, 2); // Kristallkugel
    const swag = (x0, y0, x1, y1, sag) => { for (let t = 0; t <= 1.001; t += 0.12) P(t * 10 % 2 < 1 ? cr(1) : cr(0.7), x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag); };
    for (const A of ARMS) {
      const pts = [];
      for (let i = 0; i < A.n; i++) { const a = i / A.n * Math.PI * 2; pts.push([cx + Math.cos(a) * A.rx, A.y + Math.sin(a) * A.rx * 0.28, Math.sin(a)]); }
      x.strokeStyle = g(3); x.lineWidth = 2; x.beginPath(); x.ellipse(cx, A.y, A.rx, A.rx * 0.28, 0, 0, Math.PI * 2); x.stroke(); // Kranz
      x.strokeStyle = g(5); x.lineWidth = 1; x.beginPath(); x.ellipse(cx, A.y - 1, A.rx, A.rx * 0.28, 0, Math.PI, Math.PI * 2); x.stroke();
      pts.forEach(([px2, py, z], i) => {
        const [qx, qy] = pts[(i + 1) % pts.length];
        swag(px2, py + 2, qx, qy + 2, 5 + z * 1.5);                                          // Girlande zum Nachbararm
        for (let k = 0; k < 4 + (i % 2) * 2; k++) P(cr(1 - k * 0.1), px2, py + 3 + k * 2);    // Pendeloque
        P(cr(1), px2 - 1, py + 13 + (i % 2) * 4, 3, 2);
        P('#f4ead8', px2 - 1, py - 6, 2, 6); P(g(4), px2 - 2, py - 1, 4, 1);                 // Kerze in der Tülle
      });
    }
    for (let k = 0; k < 9; k++) P(cr(1 - k * 0.07), cx, 64 + k * 2); // Spitze
    x.fillStyle = cr(0.95); x.beginPath(); x.moveTo(cx, 82); x.lineTo(cx + 4, 88); x.lineTo(cx, 95); x.lineTo(cx - 4, 88); x.closePath(); x.fill(); P('#ffffff', cx - 1, 86, 2, 3);
    halo = canvas(32, 32); const h = halo.getContext('2d'), gr = h.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,224,150,0.9)'); gr.addColorStop(0.25, 'rgba(255,190,90,0.35)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    h.fillStyle = gr; h.fillRect(0, 0, 32, 32);
  }
  function drawOne(ctx, sx, sy, sc, sway, frame, i) {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(sway); ctx.scale(sc, sc);
    ctx.drawImage(luster, -LW / 2, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const A of ARMS) for (let k = 0; k < A.n; k++) { // Flammen mit Lichthof
      const a = k / A.n * Math.PI * 2, fx2 = Math.cos(a) * A.rx, fy = A.y + Math.sin(a) * A.rx * 0.28 - 8, fl = 0.75 + 0.25 * Math.sin(frame * 0.3 + k * 1.7 + i);
      ctx.globalAlpha = 0.55 * fl; ctx.drawImage(halo, fx2 - 10, fy - 10, 20, 20);
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff4c8'; ctx.fillRect(Math.round(fx2), Math.round(fy), 1, 2);
    }
    for (let k = 0; k < 5; k++) { // Kristalle blitzen auf
      const ph = (frame * 0.05 + k * 1.9 + i * 2.3) % 6.28, b = Math.max(0, Math.sin(ph) - 0.8) * 5; if (b <= 0) continue;
      const gx = Math.round(Math.sin(k * 2.1 + i) * 26), gy = 40 + k * 9;
      ctx.globalAlpha = b; ctx.fillStyle = '#ffffff'; ctx.fillRect(gx - 3, gy, 7, 1); ctx.fillRect(gx, gy - 3, 1, 7);
    }
    ctx.restore();
  }
  // axis 'v': Lüster in einer Reihe entlang des Tunnels (hängen von oben); 'h': im Schacht übereinander, an langen Ketten
  function drawLusters(ctx, cam, frame, axis) {
    if (!luster) buildLuster();
    const w = View.w;
    if (axis === 'v') {
      const par = 0.8, sp = 200, i0 = Math.floor((cam.x * par - LW) / sp);
      for (let i = i0; i < i0 + Math.ceil(w / sp) + 2; i++) drawOne(ctx, i * sp + 100 - cam.x * par, -10, 1, Math.sin(frame * 0.017 + i * 1.3) * 0.035, frame, i);
    } else {
      const par = 0.6, sp = 300, j0 = Math.floor((cam.y * par - LH) / sp);
      for (let j = j0; j < j0 + 3; j++) {
        const sx = w / 2 + (j % 2 ? 1 : -1) * w * 0.2, sy = j * sp - cam.y * par;
        ctx.fillStyle = `rgb(${GOLD[2].join(',')})`; ctx.fillRect(Math.round(sx) - 1, Math.min(0, sy) - 1, 2, Math.max(0, sy + 2 - Math.min(0, sy))); // lange Kette
        drawOne(ctx, sx, sy, 0.85, Math.sin(frame * 0.015 + j) * 0.03, frame, j);
      }
    }
  }

  // ---------------- Versailles: Pixelmaler für die Spiegelgalerien (Röhre im Tunnel und im Schacht) ----------------
  // Arkadenspiegel aus vielen Scheiben mit vergoldeten Sprossen, Pilaster aus rotem Rance-Marmor mit Goldleisten, Gesimse mit
  // Eierstab, an den Kreuzungen goldene Sonnen. Das Glas bleibt durchscheinend (Alpha) – darunter liegt das Spiegelbild.
  const GOLD = [[34, 16, 4], [86, 48, 8], [146, 96, 22], [204, 148, 42], [238, 194, 90], [252, 232, 160]];
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  function marble(X, Y, dark = 0) { // Rance-Marmor: tiefes Rotbraun, gewundene grauweiße Adern, feine Körnung
    const v = Math.sin(X * 0.083 + Math.sin(Y * 0.047 + X * 0.01) * 2.6 + Math.sin((X - Y) * 0.019) * 3.1), n = hash(X >> 1, Y >> 1) * 16 - dark;
    const base = [112 + n, 32 + n * 0.45, 30 + n * 0.4], a = Math.abs(v);
    return a < 0.05 ? mix(base, [206, 184, 172], 0.85) : a < 0.13 ? mix(base, [170, 120, 112], 0.45) : base;
  }
  const gold = (k) => GOLD[Math.max(0, Math.min(5, Math.round(k)))];
  function sun(dx, dy, r0) { // Sonnenrosette: Gesicht in der Mitte, zwölf Strahlen
    const r = Math.hypot(dx, dy) / r0, a = Math.atan2(dy, dx);
    if (r > 1) return null;
    if (r < 0.42) { const eye = Math.abs(Math.abs(dx) - r0 * 0.15) < r0 * 0.07 && Math.abs(dy + r0 * 0.08) < r0 * 0.06; return eye ? GOLD[1] : gold(5 - r * 6 + (dx + dy < 0 ? 0.5 : -0.5)); }
    if (r < 0.5) return GOLD[1];
    const ray = ((a / (Math.PI * 2) * 12 + 12) % 1) < 0.5;
    return ray ? (r > 0.92 ? GOLD[2] : gold(4.6 - r * 1.6)) : r < 0.66 ? GOLD[2] : null;
  }
  // Glas einer Spiegelscheibe: edge = Abstand zur Sprosse/zum Rahmen, id = Scheibe (jede spiegelt ein wenig anders)
  function glass(X, Y, edge, id) {
    if (edge < 1) return [255, 255, 255, 176];                 // Facette fängt das Licht
    if (edge < 2.5) return [196, 214, 250, 142];
    const ox = Math.max(0, 1 - edge / 8), t = hash(id, 3) * 18 - 9, s = ((X + Y * 1.3 + id * 23) % 150 + 150) % 150;
    let c = ox > 0.3 ? [58, 66, 98] : [150 + t, 170 + t, 212], a = 10 + 110 * ox * ox + hash(id, 9) * 12;
    if (s < 7) { c = [236, 244, 255]; a += 56 - Math.abs(s - 3.5) * 10; }       // schräger Glanzstreif
    else if (s > 12 && s < 15) { c = [226, 236, 255]; a += 30; }
    if (ox > 0.4 && hash(X, Y) < 0.05) { c = [22, 24, 36]; a = 150; }       // blinde Flecken im alten Silber
    else if (hash(Y, X) < 0.0015) { c = [255, 255, 255]; a = 230; }         // Funkeln
    return [c[0], c[1], c[2], Math.min(255, a)];
  }
  // Arkadenspiegel: lu = waagerecht zur Bogenmitte, vy = Höhe ab Oberkante; hw Halbbreite, top Scheitel, bot Unterkante,
  // Sprossen alle cols/rows – liefert [r,g,b,a] oder null (außerhalb von Spiegel und Rahmen)
  function arcade(lu, vy, hw, top, bot, rowH, id) {
    const cy = top + hw, inArch = vy >= cy ? Math.abs(lu) < hw && vy < bot : Math.hypot(lu, vy - cy) < hw;
    const dO = Math.min(hw - Math.abs(lu), bot - vy, vy >= cy ? 1e9 : hw - Math.hypot(lu, vy - cy));
    if (!inArch) return dO > -2 ? GOLD[5].concat(255) : dO > -3.5 ? GOLD[3].concat(255) : dO > -5 ? GOLD[0].concat(255) : null; // Goldrahmen
    const cw = hw * 2 / 3, mu = Math.min(Math.abs(lu - cw / 2), Math.abs(lu + cw / 2)), mv = vy > cy ? Math.abs(((bot - vy) % rowH) - 0) : 1e9;
    const mvv = vy > cy ? Math.min(mv, rowH - ((bot - vy) % rowH)) : Math.abs(Math.hypot(lu, vy - cy) - hw * 0.55);
    const dm = Math.min(mu, mvv, dO);
    if (dm < 1.3 && dO >= 1.3) return (lu + vy) % 3 < 1.5 ? GOLD[4].concat(255) : GOLD[2].concat(255); // vergoldete Sprossen
    const col = lu < -cw / 2 ? 0 : lu > cw / 2 ? 2 : 1, row = vy > cy ? Math.floor((bot - vy) / rowH) : 9;
    return glass(lu + 200, vy, dm - (dO < 1.3 ? 0 : 1.3), id * 31 + col * 7 + row);
  }
  return { capture, reflect, reset, drawLusters, GOLD, marble, gold, sun, glass, arcade, hash };
})();
