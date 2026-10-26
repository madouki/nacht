// Hoftheater (Schloss-Modus, unter dem Ballsaal): ein barockes Theater aus weißem Marmor und Gold, ein wenig wie ein Wiener
// Hoftheater. Das Foyer hat riesige Rundbogenfenster mit Mondlicht und eine Prunkstiege; im Zuschauerraum steht man mitten im
// Rund – vier Logenränge mit rotem Samt, goldenen Brüstungen und weißen Marmorpilastern, gegenüber der Bühne die Kaiserloge,
// in manchen Logen sitzt ein Geisterpublikum, oben ein Kuppelfresko. Das Rund wird wie der Glasturm als Zylinder von innen
// gezeichnet (tiles.js drawGlassTube) und dreht sich beim Durchlaufen perspektivisch mit, bis am Ende das Bühnenportal mit
// dem Samtvorhang vor einem steht. Auf der Bühne hebt sich der echte Vorhang, wenn der Held hinaufkommt.
'use strict';

const Theater = (() => {
  const GOLD = [[40, 22, 6], [96, 58, 12], [156, 106, 28], [210, 158, 52], [240, 200, 100], [252, 236, 170]];
  const gold = (k) => GOLD[Math.max(0, Math.min(5, Math.round(k)))];
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function marble(X, Y, dark = 0) { // weißer Marmor mit feinen grauen Adern
    const v = Math.sin(X * 0.071 + Math.sin(Y * 0.043 + X * 0.012) * 2.8 + Math.sin((X + Y) * 0.017) * 2.6), n = hash(X >> 1, Y >> 1) * 10 - dark;
    const base = [236 + n * 0.6, 230 + n * 0.6, 218 + n * 0.5], a = Math.abs(v);
    return a < 0.04 ? mix(base, [150, 146, 150], 0.6) : a < 0.1 ? mix(base, [196, 192, 196], 0.4) : base;
  }

  // ---------------- Zuschauerraum: Mantel des Runds (1024 × 400, einmal herum; Bühne bei u 512, Kaiserloge bei u 0) ----------------
  let round = null;
  const TW = 1024, TH = 400, TOP = 104, TIER = 70, PITCH = 48;
  function roundTex() {
    if (round) return round;
    const c = canvas(TW, TH), x = c.getContext('2d'), img = x.createImageData(TW, TH), d = img.data;
    const gc = canvas(TW, TH), gx = gc.getContext('2d'), gimg = gx.createImageData(TW, TH), gd = gimg.data;
    const put = (X, Y, col, glow) => {
      const i = (Y * TW + X) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      if (glow) { gd[i] = glow[0]; gd[i + 1] = glow[1]; gd[i + 2] = glow[2]; } gd[i + 3] = 255;
    };
    const SHINE = [30, 22, 8], VEL = [132, 14, 30];
    for (let Y = 0; Y < TH; Y++) for (let X = 0; X < TW; X++) {
      const dx = X - 512, ad = Math.abs(dx);
      if (Y < 90) { // Kuppelfresko: Himmel mit Wolken und Licht, goldene Rippen
        const rib = X % 128, rd = Math.min(rib, 128 - rib);
        if (rd < 3) { put(X, Y, rd < 1 ? GOLD[5] : GOLD[2], SHINE); continue; }
        const k = Y / 90, cl = Math.sin(X * 0.035 + Math.sin(Y * 0.09) * 2.2) * Math.sin(X * 0.013 - Y * 0.05) > 0.3, glow = Math.max(0, 1 - Math.hypot(dx / 300, (Y - 20) / 60));
        put(X, Y, cl ? mix([226, 214, 200], [255, 236, 200], glow) : mix([70 + k * 50, 104 + k * 50, 168 + k * 30], [230, 210, 170], glow * 0.7), glow > 0.3 ? [40, 32, 14] : null);
        continue;
      }
      if (Y < TOP) { const e = Y - 90, ex = X % 10; put(X, Y, e < 1.5 || e > 12.5 ? GOLD[0] : e < 3 ? GOLD[5] : (ex === 0 || ex === 9) ? GOLD[0] : Math.hypot((ex - 4.5) / 3.6, (e - 7.5) / 4) < 1 ? gold(5 - Math.hypot(ex - 3.5, e - 6.5) * 0.5) : GOLD[1], SHINE); continue; } // Gesims mit Eierstab
      if (ad < 150) { // Bühnenportal: Marmorsäulen, Goldrahmen, Kartusche mit Masken, Samtvorhang mit Lambrequin
        const ow = 124, otop = 168 - Math.sqrt(Math.max(0, 1 - (dx / ow) ** 2)) * 40, inO = ad < ow && Y > otop;
        if (inO) {
          if (Y < otop + 26) { // Lambrequin: gerafften Bahnen mit Goldborte und Quasten
            const sw = ((dx + 1000) % 62) / 62, sag = otop + 14 + Math.sin(sw * Math.PI) * 10;
            if (Y < sag) put(X, Y, Y > sag - 2 ? GOLD[4] : mix(VEL, [190, 40, 60], 0.3 * Math.sin(sw * Math.PI)));
            else put(X, Y, mix([60, 4, 12], VEL, 0.5 + 0.5 * Math.cos(dx * 0.28)));
            if (Math.abs(sw - 0.5) > 0.47 && Y < sag + 8 && Y > sag - 2) put(X, Y, GOLD[4], SHINE);
            continue;
          }
          const fold = 0.5 + 0.5 * Math.cos(dx * 0.26 + Math.sin(Y * 0.02 + dx * 0.01) * 0.6), sh = 0.45 + 0.55 * fold * (0.85 + 0.15 * Math.sin(Y * 0.05)); // Samtfalten
          put(X, Y, Y > TH - 10 ? (Y % 3 ? GOLD[4] : GOLD[2]) : [VEL[0] * sh + 18 * fold, VEL[1] * sh, VEL[2] * sh + 6], Y > TH - 10 ? SHINE : null);
          continue;
        }
        if (ad < ow + 4 && Y > otop - 6) { put(X, Y, ad < ow + 1.5 && Y > otop - 2 ? GOLD[5] : GOLD[2], SHINE); continue; } // Rahmen
        if (ad > ow + 4) { // Säulen links und rechts
          const cd = Math.abs(ad - 137), cyl = 1 - (cd / 13) ** 2;
          if (cd < 13) { put(X, Y, Y < 132 ? gold(2 + cyl * 3 + (Y % 4 < 2 ? 0.5 : -0.5)) : Y > TH - 18 ? gold(1.5 + cyl * 2) : mix(marble(X, Y), [120, 112, 108], 0.4 * (1 - cyl)), Y < 132 ? SHINE : null); continue; }
        }
        const mk = Math.hypot(dx / 34, (Y - 128) / 20); // Kartusche mit zwei Masken
        if (mk < 1) { // Kartusche: Goldrahmen, darin eine lachende und eine weinende Maske auf rotem Grund
          if (mk > 0.86) { put(X, Y, GOLD[mk > 0.95 ? 1 : 4], SHINE); continue; }
          let col = mix([120, 14, 30], [60, 4, 14], mk);
          for (const s of [-1, 1]) {
            const mx = dx - s * 14, my = Y - 128;
            if (Math.hypot(mx / 9, my / 11) >= 1) continue;
            const eye = Math.abs(Math.abs(mx) - 3.5) < 1.6 && Math.abs(my + 3) < 1.3, mouth = Math.abs(mx) < 4.5 && Math.abs(my - 5 + s * Math.cos(mx / 4.5 * 1.5) * 1.8) < 1;
            col = eye || mouth ? [40, 24, 20] : [244, 238, 226];
          }
          put(X, Y, col); continue;
        }
        put(X, Y, mix(marble(X, Y), [180, 150, 90], Y < 150 ? 0.15 : 0)); // Marmorwand ums Portal
        continue;
      }
      if (Y >= TH - 16) { put(X, Y, Y < TH - 13 ? GOLD[4] : Y < TH - 11 ? GOLD[1] : mix([96, 10, 24], [50, 4, 12], (Y - TH + 11) / 11), Y < TH - 11 ? SHINE : null); continue; } // Parkettwand: Samt mit Goldleiste
      // Logenränge
      const tier = Math.floor((Y - TOP) / TIER), ty = (Y - TOP) % TIER, box = Math.floor(X / PITCH), bx = X % PITCH, ku = ((X + 512) % TW) - 512;
      if (Math.abs(ku) < 60 && (tier === 1 || tier === 2)) { // Kaiserloge über zwei Ränge: Draperie, Krone, Wappen
        const ry = Y - (TOP + TIER), inner = Math.abs(ku) < 44 && ry > 18 && ry < TIER * 2 - 26;
        if (ry < 18 && Math.hypot(ku / 22, (ry - 9) / 9) < 1) { const spike = ry < 6 && (Math.abs(ku) % 8) < 3; put(X, Y, spike || ry > 4 ? gold(3 + (ry < 9 ? 2 : 0)) : [40, 10, 20], SHINE); continue; } // Krone
        if (inner) {
          const drape = ry < 34 + Math.abs(ku) * -0.3 + 14 * (1 - Math.abs(ku) / 44); // geraffter Vorhang oben
          if (drape) { put(X, Y, mix(VEL, [200, 50, 70], 0.4 + 0.3 * Math.sin(ku * 0.4))); continue; }
          put(X, Y, mix([70, 6, 18], [26, 2, 8], (ry - 20) / 110)); if (Math.hypot(ku, ry - 70) < 3) put(X, Y, [255, 220, 150], [255, 190, 110]);
          continue;
        }
        if (ry >= TIER * 2 - 26) { put(X, Y, ry < TIER * 2 - 23 ? [150, 20, 36] : ry % 5 === 0 ? GOLD[4] : mix([248, 240, 222], [196, 176, 140], (ry - TIER * 2 + 23) / 23), SHINE); continue; } // Brüstung der Kaiserloge
        put(X, Y, Math.abs(ku) < 46 ? GOLD[3] : marble(X, Y), Math.abs(ku) < 46 ? SHINE : null); continue;
      }
      if (bx < 6) { put(X, Y, ty < 5 ? gold(4 - ty * 0.4) : ty > 44 && ty < 48 ? GOLD[2] : mix(marble(X, Y), [200, 194, 186], bx === 0 || bx === 5 ? 0.6 : 0), ty < 5 ? SHINE : null); continue; } // Pilaster mit Goldkapitell
      if (ty >= 48) { // Brüstung: Samtpolster, Goldleiste, cremeweiß mit Goldmedaillon und Girlande, nach unten gewölbt
        const by = ty - 48;
        if (by < 2) { put(X, Y, [150, 20, 36]); continue; }
        if (by < 4) { put(X, Y, GOLD[4], SHINE); continue; }
        const med = Math.hypot(bx - 27, by - 11) < 5, gar = Math.abs(by - 8 - Math.sin((bx - 6) / 42 * Math.PI) * 5) < 1.1;
        put(X, Y, med ? gold(4.5 - Math.hypot(bx - 26, by - 10) * 0.4) : gar ? GOLD[3] : mix([250, 244, 230], [176, 160, 132], (by / 22) ** 1.5), med || gar ? SHINE : null);
        continue;
      }
      // Logenöffnung: tiefroter Samt, Draperie in den oberen Ecken, Wandleuchter, manchmal ein Geisterzuschauer
      const ox = bx - 6, w2 = PITCH - 6, sw = Math.min(ox, w2 - ox), dr = ty < 14 - sw * 0.9 && sw < 12;
      if (dr) { put(X, Y, ty < 2 ? GOLD[4] : mix(VEL, [200, 46, 66], 0.25 + 0.25 * Math.sin(ox * 0.9)), ty < 2 ? SHINE : null); continue; }
      const ghost = hash(box * 7 + tier, tier * 13) < 0.33, gxC = 21 + (hash(box, tier) - 0.5) * 8;
      if (ghost) {
        const head = Math.hypot(ox - gxC, ty - 24) < 4.2, body = Math.abs(ox - gxC) < 8 - Math.max(0, 32 - ty) * 0.5 && ty > 28;
        if (head || body) { put(X, Y, mix([150, 196, 214], [90, 130, 160], (ty - 20) / 28), [40, 70, 80]); continue; }
      }
      if (Math.hypot(ox - 34, ty - 16) < 2.2) { put(X, Y, [255, 226, 160], [255, 200, 120]); continue; } // Wandleuchter
      const lamp = Math.max(0, 1 - Math.hypot(ox - 34, ty - 16) / 16);
      put(X, Y, mix(mix([86, 8, 22], [34, 2, 8], ty / 48), [150, 70, 40], lamp * 0.6), lamp > 0.2 ? [60 * lamp, 30 * lamp, 10 * lamp] : null);
    }
    x.putImageData(img, 0, 0); gx.putImageData(gimg, 0, 0);
    return (round = { c, gc });
  }

  // ---------------- Foyer: weiße Marmorwand mit riesigen Rundbogenfenstern (512 × 208, Parallaxe 0.5) ----------------
  let foyer = null;
  const WINX = [64, 192, 320, 448]; // Fenstermitten (für die Lichtstrahlen in grand.js Rays: 32, 160, 288, 416 bis Unterkante 176)
  function foyerTex() {
    if (foyer) return foyer;
    const Wd = 512, Hd = 208, c = canvas(Wd, Hd), x = c.getContext('2d'), img = x.createImageData(Wd, Hd), d = img.data;
    const put = (X, Y, col) => { const i = (Y * Wd + X) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
    for (let Y = 0; Y < Hd; Y++) for (let X = 0; X < Wd; X++) {
      const lx = X % 128, pd = Math.min(lx, 128 - lx), wx = lx - 64;
      if (Y < 14) { const dn = X % 8; put(X, Y, Y < 2 || Y === 13 ? GOLD[1] : Y < 4 ? GOLD[5] : Y < 10 ? (dn < 5 ? mix(marble(X, Y), [255, 250, 240], Y < 6 ? 0.4 : 0) : [150, 138, 120]) : Y < 12 ? GOLD[3] : marble(X, Y, 20)); continue; } // Gesims mit Zahnschnitt zwischen den Geschossen
      if (Y >= 198) { put(X, Y, Y < 200 ? GOLD[4] : marble(X, Y, 30)); continue; } // Sockel
      if (pd < 11) { // Pilaster mit kannelierten Schäften und Goldkapitell
        if (Y < 30) { put(X, Y, Math.sin(pd * 0.9 + Y * 0.6) > 0 ? gold(4.5 - (Y - 14) / 8) : GOLD[2]); continue; }
        if (Y > 186) { put(X, Y, gold(3.5 - Math.abs(Y - 192) * 0.4)); continue; }
        put(X, Y, pd % 4 === 1 ? mix(marble(X, Y), [170, 164, 160], 0.5) : marble(X, Y)); continue;
      }
      const top = 34, hw = 34, cy = top + hw, bot = 178, inW = Math.abs(wx) < hw && Y < bot && (Y >= cy || Math.hypot(wx, Y - cy) < hw);
      const dO = Math.min(hw - Math.abs(wx), bot - Y, Y >= cy ? 99 : hw - Math.hypot(wx, Y - cy));
      if (inW) {
        if (dO < 2.5) { put(X, Y, dO < 1 ? GOLD[5] : GOLD[3]); continue; } // Goldfalz
        const mull = Math.abs(wx) < 1.2 || Math.abs(Y - 112) < 1.2 || Math.abs(Y - 146) < 1.2 || (Y < cy && Math.abs(Math.hypot(wx, Y - cy) - hw * 0.55) < 1);
        if (mull) { put(X, Y, [210, 200, 186]); continue; }
        const k = (Y - top) / (bot - top), moon = Math.max(0, 1 - Math.hypot(wx + 16, Y - 70) / 60), star = hash(X, Y) < 0.004;
        put(X, Y, star ? [240, 240, 255] : mix(mix([30, 42, 96], [12, 16, 44], k), [150, 170, 230], moon * 0.7)); continue; // Nachthimmel im Mondlicht
      }
      if (dO > -6 && dO <= 0) { put(X, Y, dO > -2 ? [252, 246, 232] : dO > -4 ? mix(marble(X, Y), [200, 190, 170], 0.5) : [170, 160, 146]); continue; } // Stuckrahmen
      if (Y >= bot && Y < bot + 6 && Math.abs(wx) < hw + 6) { put(X, Y, Y === bot ? [252, 248, 238] : mix(marble(X, Y), [150, 140, 130], (Y - bot) / 6)); continue; } // Fensterbank
      if (Y < top - 2 && Math.abs(wx) < 16 && Math.hypot(wx / 16, (Y - 22) / 8) < 1) { put(X, Y, gold(4.5 - Math.hypot(wx / 6, Y - 22) * 0.3)); continue; } // Kartusche über dem Fenster
      const panel = Y > bot + 8 && Y < 194 && Math.abs(wx) < hw + 2, pe = panel && (Math.abs(Math.abs(wx) - hw - 2) < 1 || Y === bot + 9 || Y === 193);
      put(X, Y, pe ? GOLD[3] : mix(marble(X, Y), [214, 204, 186], panel ? 0.25 : 0));
    }
    x.putImageData(img, 0, 0);
    return (foyer = c);
  }
  return { roundTex, foyerTex, WINX, TW, TH };
})();

// Bühnenvorhang (Zuschauerraum): roter Samt mit Goldborte vor der Bühne; sobald der Held auf die Bühne kommt, hebt er sich und
// gibt den Schatz frei – mit Paukenwirbel. Rein dekorativ (keine Kollision), liegt vor den Kacheln.
class TheaterCurtain extends Ent {
  constructor(d) { super(d.x0 * T, d.y0 * T, (d.x1 - d.x0 + 1) * T, (d.y1 - d.y0 + 1) * T); this.kind = 'prop'; this.lift = 0; this.open = false; this.trig = d.trig * T; }
  update() {
    this.t++;
    if (!this.open && W.player.cx > this.trig) { this.open = true; Audio8.sfx('bell'); Audio8.sfx('rise'); W.shake = Math.max(W.shake, 3); }
    if (this.open && this.lift < 1) this.lift = Math.min(1, this.lift + 0.008);
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), w = this.w, h = this.h, e = 1 - Math.pow(1 - this.lift, 2.2);
    if (x > View.w || x + w < 0) return;
    const hh = Math.round(h * (1 - e)); // gerafft nach oben
    for (let X = 0; X < w; X++) {
      const fold = 0.5 + 0.5 * Math.cos(X * 0.3 + Math.sin(this.t * 0.02 + X * 0.05) * 0.4), sh = 0.45 + 0.55 * fold;
      const bunch = Math.round(Math.sin(X / w * Math.PI) * 10 * e); // beim Heben rafft sich der Saum zu Bögen
      const len = Math.max(0, hh - bunch);
      ctx.fillStyle = `rgb(${Math.round(132 * sh + 20 * fold)},${Math.round(14 * sh)},${Math.round(30 * sh + 6)})`; ctx.fillRect(x + X, y, 1, len);
      if (len > 0) { ctx.fillStyle = X % 3 ? '#f0c864' : '#a87420'; ctx.fillRect(x + X, y + len - 3, 1, 3); } // Goldfransen
    }
    ctx.fillStyle = '#d2a040'; ctx.fillRect(x - 4, y - 6, w + 8, 6); ctx.fillStyle = '#f8e0a0'; ctx.fillRect(x - 4, y - 6, w + 8, 1); // Vorhangstange mit Lambrequin-Kante
  }
}
