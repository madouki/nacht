// Offene Aufzugsschächte (Schloss-Modus): statt Mauerblöcken ein Stahlgitterschacht frei in einer gigantischen Halle in PS2-3D.
// Kollision: unsichtbar feste Spalten ('G') links und rechts der Kabine, Absätze nur an den Haltestellen (der Raum setzt openOut:
// außerhalb des schmalen Schachtraums keine Mauer, die Absätze laufen bis an den Bildrand weiter). Dahinter je Aufzug eine eigene
// Architektur, Geschoss für Geschoss übereinander, um einen Lichthof gebaut – beim Fahren zieht sie mit Tiefenparallaxe vorbei:
//   hotel – Maschinenhaus des Hotels Krat: warm erleuchtete Fenster, Messingrohre und -räder, Galerien mit Kugellampen
//   ice   – vereistes Maschinenhaus: Frostglas im Stahlgerüst, Rohre, Schwungräder, Eiszapfen unter den Rosten
//   works – Pumpwerk unter der Kuppel: Glaswand im Eisengitter, Ziegel, Gitterroste auf Nietträgern, Schwungräder, Kolben, Rohre
//   sky   – außen an der Sonnenkathedrale: die Stadt der Kathedralen (PS2.drawCathedral), man sinkt an ihr hinab
// Gerendert in halber Auflösung (lite: Drittel) und weich hochskaliert, nur neu, wenn sich die Kamera bewegt oder etwas dreht.
'use strict';

class LiftShaft extends Ent {
  constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; this.style = d.style || 'hotel'; this.buf = null; this.cache = new Map(); }
  update() { this.t++; }
  draw() { }
  drawBack(ctx) {
    if (this.style === 'sky') PS2.drawCathedral(ctx, W.cam, W.frame, { rise: 520 });
    else this.drawHall(ctx);
    this.drawCage(ctx);
  }

  // ---------------- die Halle in PS2-3D ----------------
  drawHall(ctx) {
    const w = View.w, dv = View.lite ? 3 : 2, Wb = Math.ceil(w / dv), Hb = Math.ceil(208 / dv), S = LiftShaft.STYLE[this.style], t = W.frame;
    if (!this.buf || this.buf.w !== Wb || this.buf.h !== Hb) { const c = document.createElement('canvas'); c.width = Wb; c.height = Hb; this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), w: Wb, h: Hb, key: null }; }
    const B = this.buf, cx = W.cam.x + w / 2, cy = W.cam.y + 104, key = Math.round(cx) + '|' + Math.round(cy) + '|' + (S.anim ? t >> 1 : 0) + '|' + Wb;
    if (B.key !== key) {
      B.key = key;
      const x = B.x, g = x.createLinearGradient(0, 0, 0, Hb);
      g.addColorStop(0, S.bg[0]); g.addColorStop(0.5, S.bg[1]); g.addColorStop(1, S.bg[2]); x.fillStyle = g; x.fillRect(0, 0, Wb, Hb);
      const P = LiftShaft.P, hh = 104 * (LiftShaft.ZB + 200) / 200, k0 = Math.floor((cy - hh) / P) - 1, k1 = Math.ceil((cy + hh) / P), list = [];
      for (let k = k0; k <= k1; k++) {
        const ck = this.style + '|' + k;
        let m = this.cache.get(ck);
        if (!m) { if (this.cache.size > 24) this.cache.clear(); m = LiftShaft.storey(this.style, k); this.cache.set(ck, m); }
        list.push(m);
      }
      if (S.anim) list.push(LiftShaft.moving(this.style, k0, k1, t));
      PS2.render(x, Wb, Hb, list, { x: cx, y: -cy, z: -200, yaw: 0, pitch: 0, f: 200 / dv, near: 20, cx: Wb / 2, cy: Hb / 2 }, S.env);
      const v = x.createLinearGradient(0, 0, 0, Hb); v.addColorStop(0, S.fogA); v.addColorStop(0.3, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, S.fogA);
      x.fillStyle = v; x.fillRect(0, 0, Wb, Hb); // oben und unten verliert sich die Halle im Dunst
    }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(B.c, 0, 0, Wb, Hb, 0, 0, w, 208); ctx.restore();
  }
  // Ein Geschoss (Boden auf Welt-y k·P): Rückwand und zwei Seitenwände des Lichthofs mit Türen/Fenstern, umlaufende Galerie mit
  // Brüstung, Säulen an den Ecken und entlang der Seiten, dazu je Stil Lampen, Eiszapfen und Kristalle oder Nietträger und Rohre.
  // Große Flächen sind in Felder geteilt, damit die Tiefensortierung (Maleralgorithmus) stimmt.
  static storey(style, k) {
    const S = LiftShaft.STYLE[style], P = LiftShaft.P, ZB = LiftShaft.ZB, ZF = 150, AW = LiftShaft.AW, RC = 128, PS = PS2, m = PS.mesh();
    const Y0 = -(k + 1) * P, Y1 = -k * P, h = (n) => { const s = Math.sin(n * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }; // Y0 Boden, Y1 Decke
    const quad = (a, b, c, d, col, o) => PS.face(m, [a, b, c, d].map(p => PS.vtx(m, ...p)), col, o && o.C || null, o);
    const facing = (C) => ({ C }); // Normale weg von C (zur Kamera hin)
    const SEG = 120, nb = Math.round(2 * AW / SEG), nz = Math.round((ZB - ZF) / SEG);
    // Rückwand in Feldern, je Feld eine Tür bzw. ein Fenster (leuchtend)
    for (let i = 0; i < nb; i++) {
      const x0 = RC - AW + i * SEG, x1 = x0 + SEG, xm = (x0 + x1) / 2;
      quad([x0, Y0, ZB], [x1, Y0, ZB], [x1, Y1, ZB], [x0, Y1, ZB], S.wall[i % 2], facing([xm, (Y0 + Y1) / 2, ZB + 50]));
      const lit = h(i) < S.litP, ww = S.door[0] / 2, dh = S.door[1], col = lit ? S.lit : S.dark;
      quad([xm - ww, Y0 + 12, ZB - 1], [xm + ww, Y0 + 12, ZB - 1], [xm + ww, Y0 + 12 + dh, ZB - 1], [xm - ww, Y0 + 12 + dh, ZB - 1], col, { C: [xm, Y0 + 50, ZB + 50], e: lit ? S.litE : 0 });
      quad([xm - ww * 0.7, Y0 + 12 + dh, ZB - 1], [xm + ww * 0.7, Y0 + 12 + dh, ZB - 1], [xm, Y0 + 12 + dh + ww * 0.9, ZB - 1], [xm, Y0 + 12 + dh + ww * 0.9, ZB - 1], col, { C: [xm, Y0 + 50, ZB + 50], e: lit ? S.litE : 0 }); // Bogen
    }
    // Seitenwände (laufen in die Tiefe – sie geben der Halle ihre Perspektive)
    for (const s of [-1, 1]) for (let j = 0; j < nz; j++) {
      const z0 = ZF + j * SEG, z1 = z0 + SEG, zm = (z0 + z1) / 2, X = RC + s * AW;
      quad([X, Y0, z0], [X, Y0, z1], [X, Y1, z1], [X, Y1, z0], S.wall[(j + 1) % 2], facing([X + s * 50, (Y0 + Y1) / 2, zm]));
      const lit = h(j * 7 + s * 3 + 11) < S.litP, ww = S.door[0] / 2, dh = S.door[1], col = lit ? S.lit : S.dark, Xd = X - s;
      quad([Xd, Y0 + 12, zm - ww], [Xd, Y0 + 12, zm + ww], [Xd, Y0 + 12 + dh, zm + ww], [Xd, Y0 + 12 + dh, zm - ww], col, { C: [X + s * 50, Y0 + 50, zm], e: lit ? S.litE : 0 });
    }
    // Galerie: Bodenplatten (Rückseite in Feldern, Seiten in Feldern), Brüstung (halbdurchsichtig) mit Handlauf
    const GD = 80, GT = S.slab;
    for (let i = 0; i < nb; i++) { const x0 = RC - AW + i * SEG; PS.box(m, x0 + SEG / 2, Y0 - GT, ZB - GD / 2, SEG, GT, GD, S.floor, { top: S.floorTop, bottom: true }); }
    for (const s of [-1, 1]) for (let j = 0; j < nz; j++) { const z0 = ZF + j * SEG; PS.box(m, RC + s * (AW - GD / 2), Y0 - GT, z0 + SEG / 2, GD, GT, SEG, S.floor, { top: S.floorTop, bottom: true }); }
    const RH = S.rail, ex = RC + AW - GD, ez = ZB - GD;
    if (RH) {
      const scr = (a, b, c, d, C) => PS.face(m, [a, b, c, d].map(p => PS.vtx(m, ...p)), S.screen, C, { a: 0.55, two: true });
      scr([RC - ex + RC, Y0, ez], [ex, Y0, ez], [ex, Y0 + RH, ez], [RC - ex + RC, Y0 + RH, ez], [RC, Y0, ez + 50]);
      for (const s of [-1, 1]) { const X = RC + s * (AW - GD); scr([X, Y0, ZF], [X, Y0, ez], [X, Y0 + RH, ez], [X, Y0 + RH, ZF], [X + s * 50, Y0, (ZF + ez) / 2]); }
      PS.beam(m, 2 * RC - ex, Y0 + RH, ez, ex, Y0 + RH, ez, 3, 3, S.railC);
      for (const s of [-1, 1]) { const X = RC + s * (AW - GD); PS.beam(m, X, Y0 + RH, ZF, X, Y0 + RH, ez, 3, 3, S.railC); }
    }
    // Säulen: Ecken der Galerie und entlang der Seiten, vom Galerieboden bis unter den nächsten
    for (const [x, z] of [[2 * RC - ex, ez], [ex, ez], [2 * RC - ex, ZF + SEG], [ex, ZF + SEG], [2 * RC - ex, ZF + 2 * SEG], [ex, ZF + 2 * SEG]]) {
      PS.prism(m, x, Y0, z, S.colR, P - GT, S.colN, S.col, { rTop: S.colR * 0.85, cap: false });
      PS.prism(m, x, Y1 - GT - 10, z, S.colR * 1.6, 10, S.colN, S.cap, { rTop: S.colR, cap: false }); // Kapitell
    }
    // Kolossalpfeiler nah vor der Halle (ziehen beim Fahren schnell vorbei – daran misst das Auge die Größe), Ring je Geschoss
    for (const s of [-1, 1]) {
      const x = RC + s * 300, z = 240;
      PS.prism(m, x, Y0, z, 34, P, 8, S.pil, { cap: false, rot: Math.PI / 8 });
      PS.prism(m, x, Y0 + P * 0.5, z, 42, 18, 8, S.pilRing, { rot: Math.PI / 8, top: S.pilRing, bottom: true });
    }
    // Stilbeigaben
    if (style === 'hotel') { // Kugellampen auf dem Handlauf
      for (let i = 0; i <= 6; i++) { const x = 2 * RC - ex + (ex - (2 * RC - ex)) * i / 6; PS.box(m, x, Y0 + RH + 2, ez, 5, 5, 5, [255, 214, 140], { e: 0.9 }); }
      for (const s of [-1, 1]) for (let j = 1; j < 4; j++) PS.box(m, RC + s * (AW - GD), Y0 + RH + 2, ZF + j * (ez - ZF) / 4, 5, 5, 5, [255, 214, 140], { e: 0.9 });
    } else if (style === 'ice') { // Eiszapfen unter den Rosten
      for (let i = 0; i < 16; i++) { const x = RC - AW + 20 + h(i + 40) * (2 * AW - 40); PS.cone(m, x, Y0 - GT - 10, ZB - 8 - h(i + 60) * 60, 4 + h(i) * 4, -(14 + h(i + 80) * 30), 4, S.icicle); }
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) PS.cone(m, RC + s * (AW - 10 - h(i + 90) * 60), Y0 - GT - 10, ZF + 20 + h(i + 99) * (ZB - ZF - 40), 4 + h(i) * 3, -(12 + h(i + 7) * 26), 4, S.icicle);
    }
    if (S.machine) { // Maschinenhalle wie im Pumpwerk: Nietträger unter dem Rost, Rohre über die Geschosse, Rohrschellen
      PS.beam(m, 2 * RC - ex, Y0 - GT - 6, ez + 4, ex, Y0 - GT - 6, ez + 4, 8, 10, S.girder);
      for (const s of [-1, 1]) PS.beam(m, RC + s * (AW - GD + 4), Y0 - GT - 6, ZF, RC + s * (AW - GD + 4), Y0 - GT - 6, ez, 8, 10, S.girder);
      for (const [x, z, r] of [[RC - AW + 40, ZB - 30, 7], [RC - AW + 58, ZB - 30, 5], [RC + AW - 50, ZB - 40, 9]]) PS.prism(m, x, Y0, z, r, P, 8, S.pipe, { cap: false });
      for (let i = 0; i < 3; i++) PS.box(m, RC - AW + 40, Y0 + 40 + i * 70, ZB - 30, 20, 6, 20, S.girder); // Rohrschellen
    }
    return m;
  }
  // Bewegtes (je Bild neu): im Pumpwerk Schwungräder und Kolben jedes zweiten Geschosses
  static moving(style, k0, k1, t) {
    const m = PS2.mesh(), P = LiftShaft.P, RC = 128, S = LiftShaft.STYLE[style];
    for (let k = k0; k <= k1; k++) {
      if (((k % 2) + 2) % 2) continue;
      const Y = -(k + 0.5) * P, side = ((k / 2) % 2 + 2) % 2 ? -1 : 1, X = RC + side * 250, Z = LiftShaft.ZB - 60;
      GearWorks.gear(PS2, m, { x: X, y: -Y, z: Z, R: 70, t: 18 }, t * 0.02 * side, S.wheel, S.girder);
      const ph = Math.sin(t * 0.04 + k), px = X - side * 120;
      PS2.prism(m, px, Y - 60, Z, 14, 60, 8, S.girder, { cap: true }); // Zylinder
      PS2.box(m, px, Y + 4 + ph * 18, Z, 10, 60, 10, S.pipe);           // Kolbenstange
      PS2.beam(m, px, Y + 64 + ph * 18, Z - 8, X + Math.cos(t * 0.02 * side) * 50, Y + 20 + Math.sin(t * 0.02 * side) * 50, Z - 8, 6, 6, S.wheel); // Pleuel zum Rad
    }
    return m;
  }

  // ---------------- Stahlgitter des Schachts (2D, volle Auflösung) über den 'G'-Spalten ----------------
  drawCage(ctx) {
    const R = W.room, g = R.grid, S = LiftShaft.STYLE[this.style], ox = -Math.round(W.cam.x), oy = -Math.round(W.cam.y);
    const y0 = Math.max(0, Math.floor(W.cam.y / T)), y1 = Math.min(R.h - 1, y0 + 14);
    for (let cx = 0; cx < R.w; cx++) {
      let run = -1;
      for (let cy = y0; cy <= y1 + 1; cy++) {
        const on = cy <= y1 && g[cy][cx] === 'G';
        if (on && run < 0) run = cy;
        if (!on && run >= 0) { this.girder(ctx, cx * T + ox, run * T + oy, (cy - run) * T, S.cage, run * T); run = -1; }
      }
    }
    for (let cy = y0; cy <= y1; cy++) for (let cx = 0; cx < R.w; cx++) { // Konsolen unter den Absätzen
      if (g[cy][cx] !== '#' || (cy + 1 < R.h && g[cy + 1][cx] !== '.') || (cx + cy) % 2) continue;
      const X = cx * T + ox, Y = (cy + 1) * T + oy;
      ctx.fillStyle = S.cage[0]; ctx.beginPath(); ctx.moveTo(X + 3, Y); ctx.lineTo(X + 13, Y); ctx.lineTo(X + 8, Y + 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = S.cage[2]; ctx.fillRect(X + 3, Y, 10, 1);
    }
  }
  girder(ctx, X, Y, H, C, wy) { // Gitterstütze: zwei Gurte, Zickzack-Vergitterung, Nieten (C: dunkel, mittel, hell)
    ctx.fillStyle = C[0]; ctx.fillRect(X + 1, Y, 3, H); ctx.fillRect(X + 12, Y, 3, H);
    ctx.fillStyle = C[2]; ctx.fillRect(X + 1, Y, 1, H); ctx.fillRect(X + 12, Y, 1, H);
    const s0 = Math.floor(wy / 16) * 16 - wy;
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y, 16, H); ctx.clip();
    ctx.strokeStyle = C[1]; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let y = s0; y < H; y += 16) { const a = ((wy + y) / 16) % 2 ? 1 : 0; ctx.moveTo(X + (a ? 4 : 12), Y + y); ctx.lineTo(X + (a ? 12 : 4), Y + y + 16); }
    ctx.stroke();
    ctx.fillStyle = C[2]; for (let y = s0; y < H; y += 16) { ctx.fillRect(X + 2, Y + y, 1, 1); ctx.fillRect(X + 13, Y + y, 1, 1); }
    ctx.restore();
  }
}
LiftShaft.P = 256; LiftShaft.ZB = 720; LiftShaft.AW = 420; // Geschosshöhe, Tiefe der Rückwand, halbe Hofbreite
LiftShaft.STYLE = (() => {
  const env = (v, sunC, amb, sky, fog, fogD) => { const l = Math.hypot(...v); return { static: true, sun: v.map(c => c / l), sunC, amb, sky, fog, fogD }; };
  return {
    // Hotel und Eis gebaut wie das Pumpwerk (machine: Träger, Rohre, Schwungräder; große erleuchtete Fenster), nur in Messing/warm bzw. Stahl/Frost
    hotel: { bg: ['#1a0c08', '#2c140c', '#120806'], fogA: 'rgba(18,8,6,0.45)', machine: true, anim: true, env: env([-0.3, 0.55, -0.78], [0.98, 0.8, 0.56], [0.3, 0.22, 0.18], [0.14, 0.1, 0.08], [30, 14, 10], 0.0011),
      wall: [[132, 84, 56], [118, 74, 48]], door: [60, 150], litP: 0.85, lit: [255, 204, 130], litE: 0.5, dark: [40, 24, 16], slab: 8, floor: [70, 50, 36], floorTop: [96, 70, 48],
      rail: 20, screen: [36, 22, 14], railC: [222, 174, 82], colR: 8, colN: 8, col: [96, 70, 40], cap: [214, 166, 74], pil: [120, 92, 60], pilRing: [214, 166, 74], girder: [80, 58, 36], pipe: [214, 160, 70], wheel: [200, 150, 60], cage: ['#2c1c10', '#6c4c24', '#c89848'] },
    ice: { bg: ['#06101c', '#0c2440', '#040a14'], fogA: 'rgba(4,10,22,0.45)', machine: true, anim: true, env: env([-0.35, 0.6, -0.72], [0.74, 0.84, 1.0], [0.26, 0.32, 0.42], [0.12, 0.18, 0.26], [10, 26, 52], 0.0011),
      wall: [[78, 104, 138], [68, 92, 126]], door: [60, 150], litP: 0.85, lit: [176, 226, 255], litE: 0.42, dark: [24, 40, 60], slab: 8, floor: [60, 76, 96], floorTop: [180, 214, 240],
      rail: 20, screen: [30, 44, 60], railC: [170, 210, 240], colR: 8, colN: 8, col: [70, 96, 124], cap: [170, 210, 240], pil: [90, 120, 150], pilRing: [170, 210, 240], girder: [60, 78, 98], pipe: [160, 200, 230], wheel: [120, 150, 180], icicle: [196, 232, 252], cage: ['#1c2c40', '#4c7ca4', '#bce4fc'] },
    works: { bg: ['#06100c', '#0e2420', '#040a08'], fogA: 'rgba(4,12,10,0.45)', machine: true, anim: true, env: env([-0.4, 0.55, -0.73], [0.84, 0.9, 0.78], [0.26, 0.3, 0.27], [0.12, 0.16, 0.14], [12, 26, 22], 0.0011),
      wall: [[120, 66, 50], [108, 58, 44]], door: [60, 150], litP: 0.85, lit: [150, 230, 190], litE: 0.4, dark: [30, 40, 36], slab: 8, floor: [52, 60, 58], floorTop: [76, 86, 82],
      rail: 20, screen: [24, 34, 30], railC: [90, 130, 104], colR: 8, colN: 8, col: [56, 96, 74], cap: [96, 140, 110], pil: [58, 92, 74], pilRing: [40, 56, 50], girder: [48, 64, 58], pipe: [176, 108, 58], wheel: [90, 110, 100], cage: ['#14241c', '#3c6c54', '#8cc4a4'] },
    sky: { cage: ['#241c2c', '#5c4c6c', '#c8a868'] },
  };
})();
