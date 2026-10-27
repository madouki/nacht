// Automatenwerk (Schloss-Modus, Tür im Lokschuppen): eine Fabrikhalle der Belle Époque, in der Aufziehsoldaten gebaut werden –
// in PS2-3D. Sheddach aus Glas im Gewitter (Blitze leuchten durch die Scheiben, kalte Lichtbahnen fallen in die Halle),
// Gusseisensäulen mit Jugendstilbögen und Gaslampen, hinten das Montageband: halbfertige Automaten hängen an einer Laufschiene
// und ziehen durch die Halle; ein riesiges Schwungrad mit Dampfmaschine (Pleuel, Kreuzkopf) treibt über Riemen die
// Transmissionswelle und die Drehbänke; an der Rückwand Dampfrohre, die zischen; rechts die Gießerei mit Kupolofen, Gießstrahl,
// Glut und Funkenregen; am Eingang das Messingschild der Firma. Spielmechanik (Klassen unten): Förderbänder tragen Held und
// Gegner, Dampfhämmer schlagen im Takt (vorher zischen sie und heben sich ein Stück), Dampfdüsen tragen nach oben, ein
// Kettenzug lässt neue Automaten aufs Montageband herab. Gegner: der Automat – ein Aufziehsoldat mit Säbelarm.
'use strict';

const Werk = (() => {
  const { mesh, vtx, face, box, prism, cone, beam, render } = PS2;
  const CPU = { willReadFrequently: true };
  const C = (w, h) => Sprites.canvas(w, h);
  const hn = (X, Y, s) => { let n = Math.imul(X * 374761393 + Y * 668265263 + s * 1442695041, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  // ---------------- Kacheln ----------------
  // Körper: rußige Ziegel; Oberkante: Riffelblech mit Messingnieten; '=': genieteter Gitterträger mit Durchblick
  function tile(kind, o = {}) {
    const c = C(16, 16), x = c.getContext('2d'), v = o.v || 0, s = 31 + v * 17 + (o.crack ? 5 : 0) + (o.chip ? 9 : 0);
    if (kind === 'alt') {
      const I = ['#b4bccc', '#7c8496', '#4c5262', '#2c303c', '#14161c'];
      for (let k = 0; k < 9; k++) { px(x, I[2], 1 + k, 4 + k, 2, 1); px(x, I[2], 13 - k, 4 + k, 2, 1); px(x, I[4], 1 + k, 5 + k, 1, 1); } // Andreaskreuz, dazwischen Durchblick
      px(x, I[3], 0, 0, 16, 4); px(x, I[0], 0, 0, 16, 1); px(x, I[1], 0, 1, 16, 1); px(x, I[4], 0, 3, 16, 1);     // Obergurt mit Lauffläche
      for (let X = 1; X < 16; X += 3) px(x, '#5c6272', X, 2);                                                     // Riffel
      px(x, I[3], 0, 4, 2, 9); px(x, I[1], 0, 4, 1, 9);                                                           // Pfosten
      px(x, I[3], 0, 13, 16, 3); px(x, I[1], 0, 13, 16, 1); px(x, I[4], 0, 15, 16, 1);                           // Untergurt
      for (const X of [3, 8, 13]) { px(x, '#e0c88c', X, 1); px(x, '#e0c88c', X, 14); }                            // Nieten
      return c;
    }
    px(x, '#0e0706', 0, 0, 16, 16); // Mörtel
    for (let r = 0; r < 4; r++) {
      const off = (r % 2) * 4;
      for (let b = -1; b < 3; b++) {
        const bx = b * 8 + off, by = r * 4, k = hn(b + 3, r, s);
        px(x, k < 0.2 ? '#3a1a10' : k > 0.85 ? '#6a3422' : '#4c2416', bx, by, 7, 3);
        px(x, k > 0.85 ? '#8a4a32' : '#62301e', bx, by, 7, 1); px(x, '#2a120a', bx + 1, by + 2, 6, 1);
        if (hn(b, r, s + 1) < 0.4) px(x, '#22100a', bx + 2 + ((k * 4) | 0), by + 1);
      }
    }
    for (let Y = 0; Y < 16; Y++) for (let X = 0; X < 16; X++) if (hn(X, Y, s + 7) < 0.1) px(x, 'rgba(0,0,0,0.35)', X, Y); // Ruß
    if (o.crack) { let X = 4 + ((hn(1, 2, s) * 6) | 0); for (let Y = 0; Y < 12; Y++) { px(x, '#080404', X, Y); if (hn(X, Y, s) < 0.4) X += hn(Y, X, s) < 0.5 ? -1 : 1; } }
    if (o.chip) { px(x, '#0a0504', 12, 12, 4, 4); px(x, '#2a120a', 12, 12, 4, 1); }
    if (kind === 'top') { // Riffelblech, darunter eine Schattenfuge
      px(x, '#2c303c', 0, 0, 16, 6);
      for (let X = 0; X < 16; X++) for (const Y of [2, 4]) if (((X + (Y === 4 ? 2 : 0)) % 4) === 0) { px(x, '#5a6072', X, Y); px(x, '#171920', X + 1, Y); }
      px(x, '#a8b0c0', 0, 0, 16, 1); px(x, '#636a7a', 0, 1, 16, 1); px(x, '#101116', 0, 5, 16, 1); px(x, 'rgba(0,0,0,0.5)', 0, 6, 16, 1);
      px(x, '#e0c47c', 2, 3); px(x, '#e0c47c', 13, 3); px(x, '#5c4a20', 3, 3); px(x, '#5c4a20', 14, 3);           // Messingnieten
      if (v === 1) { px(x, '#6c3c1c', 6, 2, 3, 2); px(x, '#8c4c20', 7, 2); px(x, '#5c3018', 9, 3); }              // Rost
      if (v === 2) { px(x, '#141620', 5, 2, 6, 3); px(x, '#3c3c64', 6, 2, 2, 1); px(x, '#5c4c3c', 9, 3); }          // Ölfleck
      if (v === 3) { px(x, '#0c0d12', 15, 1, 1, 5); px(x, '#7c8494', 14, 1, 1, 4); }                                 // Plattenstoß
    }
    return c;
  }

  // ---------------- Halle (PS2-3D) ----------------
  // Spielebene z = 200 wie die Kacheln, Hallenboden y = 0 = Raumboden (unten), Horizont bei HY. In sehr hohen Räumen steigt die
  // 3D-Kamera langsamer als das Bild (bleibt unter dem Dach). Die Halle wird für die ganze Raumlänge gebaut (keine Periode):
  // Schwungrad, Gießerei und Firmenschild stehen an festen Stellen. Abschnitte zu CH Einheiten; hintere Ebene (z ≥ ZF: Rückwand,
  // Dach, Maschinen) wird seltener neu gerastert. Dazwischen die bewegten Teile (Rad, Pleuel, Riemen, Montageband).
  const HY = 110, ZB = 560, ZF = 430, CH = 256, HX0 = -1024, HX1 = 3328, BAY = 256, NC = Math.ceil((HX1 - HX0) / CH);
  const YR = 290, TH = 62, TD = 80, TEETH = [240, 320, 400, 480];  // Dachfuß, Höhe und Tiefe der Shedzähne (Glas zeigt nach hinten)
  const FCZ = 268, BCZ = 494, RZ = 340, RY = 200, LSZ = 456, LSY = 266; // Säulenreihen, Montageschiene, Transmissionswelle
  const FW = { x: 880, y: 118, z: 440, r: 104 }, FD = { x: 1790, z: 524 }, PLATE = { x: 250, y: 214 }; // Schwungrad, Kupolofen, Schild
  const ENG = { x0: FW.x - 330, x1: FW.x - 214, z: 452 }; // Dampfzylinder
  const IRON = [44, 48, 62], IRON2 = [30, 32, 42], IRONL = [112, 120, 142], BRASS = [218, 172, 76], BRICK = [112, 54, 38], BRICK2 = [80, 38, 28],
    STONE = [150, 136, 118], COPPER = [176, 98, 56], GLASS = [176, 196, 236], GREEN = [40, 78, 62], ROOF = [34, 30, 32], WOOD = [86, 62, 42],
    FLOOR1 = [62, 58, 56], FLOOR2 = [48, 44, 44], LAMPC = [255, 214, 140], NAVY = [44, 54, 104], PORC = [232, 226, 216], RED = [160, 30, 34];
  const ENV = { static: true, sun: null, sunC: [0.62, 0.68, 0.88], amb: [0.3, 0.28, 0.32], sky: [0.16, 0.18, 0.28], fog: [10, 12, 24], fogD: 0.0008 };
  { const v = [-0.3, 0.8, -0.5], l = Math.hypot(...v); ENV.sun = v.map(c => c / l); }
  const clampI = (v, a, b) => (v < a ? a : v > b ? b : v);
  function bar(m, x0, y0, z0, x1, y1, z1, w, col, o = {}) { // dünne Strebe als flaches Band zur Kamera (1 Fläche)
    let sx = y1 - y0, sy = -(x1 - x0); const l = Math.hypot(sx, sy); if (l < 1e-6) { sx = 1; sy = 0; } else { sx /= l; sy /= l; }
    const h = w / 2;
    face(m, [vtx(m, x0 + sx * h, y0 + sy * h, z0), vtx(m, x1 + sx * h, y1 + sy * h, z1), vtx(m, x1 - sx * h, y1 - sy * h, z1), vtx(m, x0 - sx * h, y0 - sy * h, z0)], col, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2 + 60], { two: true, e: o.e || 0 });
  }
  const quad = (m, P, col, o = { two: true }) => face(m, P.map(p => vtx(m, p[0], p[1], p[2])), col, null, o);
  const wallRect = (m, x0, x1, y0, y1, col, z = ZB) => quad(m, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], col);
  const arcPts = (cx, cy, r, a0, a1, n, z) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]; });

  let hall = null, lamps = [], shafts = [], vents = [], glows = [], roofGlass = [], lampScr = [];
  function buildHall() {
    lamps = []; shafts = []; vents = []; roofGlass = [];
    const L = { wall: Array.from({ length: NC }, mesh), far: Array.from({ length: NC }, mesh), near: Array.from({ length: NC }, mesh) };
    const M = (x, z) => (z >= ZB - 20 ? L.wall : z >= ZF ? L.far : L.near)[clampI(Math.floor((x - HX0) / CH), 0, NC - 1)];
    const R = rng(4711), plateW = 560, blind = (x) => Math.abs(x - PLATE.x) < plateW / 2 + 30 || Math.abs(x - FD.x) < 150;
    // Boden: Eisenplatten im Wechsel, Schienen für die Gießwagen, Grube unter dem Schwungrad
    for (let z = 200; z < ZB; z += 60) for (let x = HX0; x < HX1; x += 64) {
      const i = Math.round(x / 64), j = Math.round((z - 200) / 60), m = M(x + 32, z >= 420 ? ZF : 0);
      quad(m, [[x, 0, z], [x, 0, z + 60], [x + 64, 0, z + 60], [x + 64, 0, z]], (i + j) & 1 ? FLOOR1 : FLOOR2);
    }
    for (let x = HX0; x < HX1; x += CH) for (const z of [300, 318]) quad(M(x + CH / 2, 0), [[x, 0.6, z], [x + CH, 0.6, z], [x + CH, 0.6, z + 3], [x, 0.6, z + 3]], IRONL);
    quad(M(FW.x, 0), [[FW.x - 26, 1, FW.z - 30], [FW.x + 26, 1, FW.z - 30], [FW.x + 26, 1, FW.z + 30], [FW.x - 26, 1, FW.z + 30]], [8, 8, 12]);
    // Rückwand: Ziegelsockel, Pilaster, hohe Rundbogenfenster mit Sprossen (Blitze leuchten hindurch), Dampfrohre
    for (let b = Math.floor(HX0 / BAY); b * BAY < HX1; b++) {
      const bx = b * BAY, m = M(bx + BAY / 2, ZB);
      wallRect(m, bx, bx + BAY, 0, 72, BRICK2); box(m, bx + BAY / 2, 70, ZB - 4, BAY, 5, 10, STONE);
      if (!blind(bx)) box(m, bx, 0, ZB - 7, 26, YR, 14, BRICK, { top: STONE });
      for (const wx of [bx + 64, bx + 192]) {
        const hw = 42, y0 = 98, ys = 214, l = wx - 64, r = wx + 64, mw = M(wx, ZB);
        if (blind(wx)) { wallRect(mw, wx - 64, wx + 64, 72, YR, BRICK); continue; }
        wallRect(mw, l, wx - hw, 72, YR, BRICK); wallRect(mw, wx + hw, r, 72, YR, BRICK); wallRect(mw, wx - hw, wx + hw, 72, y0, BRICK);
        const arc = arcPts(wx, ys, hw, Math.PI, 0, 10, ZB);
        quad(mw, [[wx - hw, y0, ZB], [wx + hw, y0, ZB], ...arc.slice().reverse()], GLASS, { two: true, a: 0.3 });
        quad(mw, [[wx - hw, ys, ZB], [wx - hw, YR, ZB], [wx, YR, ZB], ...arcPts(wx, ys, hw, Math.PI / 2, Math.PI, 5, ZB)], BRICK);
        quad(mw, [[wx + hw, ys, ZB], ...arcPts(wx, ys, hw, 0, Math.PI / 2, 5, ZB), [wx, YR, ZB], [wx + hw, YR, ZB]], BRICK);
        for (let k = 0; k < 10; k++) bar(mw, arc[k][0], arc[k][1], ZB - 2, arc[k + 1][0], arc[k + 1][1], ZB - 2, 5, STONE); // Bogen aus Werkstein
        for (const dx of [-hw / 2, 0, hw / 2]) { const top = ys + Math.sqrt(hw * hw - dx * dx); bar(mw, wx + dx, y0, ZB - 1, wx + dx, top, ZB - 1, 1.6, IRON2); }
        for (const yy of [136, 176, ys]) bar(mw, wx - hw, yy, ZB - 1, wx + hw, yy, ZB - 1, 1.6, IRON2);
        box(mw, wx, y0 - 5, ZB - 5, hw * 2 + 10, 5, 10, STONE);
      }
      const pm = M(bx + BAY / 2, ZB - 20); // Dampfrohre mit Flanschen
      beam(pm, bx, 110, ZB - 18, bx + BAY, 110, ZB - 18, 10, 10, COPPER, { open: true }); box(pm, bx + 40, 104, ZB - 18, 5, 12, 14, IRON2);
      beam(pm, bx, 86, ZB - 16, bx + BAY, 86, ZB - 16, 7, 7, IRON, { open: true }); box(pm, bx + 168, 81, ZB - 16, 4, 10, 11, IRON2);
      if (b % 2 === 0) { beam(pm, bx + 120, 110, ZB - 18, bx + 120, YR, ZB - 18, 8, 8, COPPER, { open: true }); box(pm, bx + 120, 150, ZB - 26, 12, 4, 4, RED); vents.push([bx + 150, 116, ZB - 20, b]); }
    }
    // Sheddach: Dachflächen steigen nach hinten, das Glas steht senkrecht und zeigt nach hinten – von unten sieht man im Wechsel
    // dunkle Dachflächen und helle Glasbänder mit Sprossen; vorne schließt eine Traufe die Lücke zur Spielebene
    for (let x = HX0; x < HX1; x += CH) {
      const m = M(x + CH / 2, ZF), x1 = x + CH;
      quad(m, [[x, YR, 200], [x1, YR, 200], [x1, YR, TEETH[0]], [x, YR, TEETH[0]]], ROOF);
      quad(m, [[x, YR - 10, 214], [x1, YR - 10, 214], [x1, YR + 150, 214], [x, YR + 150, 214]], [22, 22, 30]); // vorderer Dachbinder
      beam(m, x, YR - 8, 212, x1, YR - 8, 212, 4, 5, IRONL, { open: true }); for (let k = 0; k < CH; k += 16) bar(m, x + k, YR - 6, 211, x + k + 16, YR + 40, 211, 1.6, IRON);
      TEETH.forEach((z0) => {
        const zg = z0 + TD;
        quad(m, [[x, YR, z0], [x1, YR, z0], [x1, YR + TH, zg], [x, YR + TH, zg]], ROOF);
        quad(m, [[x, YR, zg], [x1, YR, zg], [x1, YR + TH, zg], [x, YR + TH, zg]], [118, 136, 178], { two: true, e: 0.12 }); roofGlass.push([x, x1, zg]);
        for (let mx = x; mx < x1; mx += 32) { bar(m, mx, YR, zg - 1, mx, YR + TH, zg - 1, 1.8, IRON2); bar(m, mx, YR + 1, z0, mx, YR + TH - 1, zg - 2, 1.6, IRON2); }
        bar(m, x, YR + TH * 0.5, zg - 1, x1, YR + TH * 0.5, zg - 1, 1.4, IRON2);
        beam(m, x, YR - 3, z0, x1, YR - 3, z0, 5, 6, IRON2, { open: true }); // Unterzug am Fuß jedes Zahns
      });
    }
    for (let b = Math.floor(HX0 / BAY); b * BAY < HX1; b++) { // Querbinder unter den Zähnen (Fachwerk), über den vorderen Säulen
      const x = b * BAY, m = M(x, ZF);
      for (const z0 of TEETH) { bar(m, x, YR - 4, z0, x, YR - 4, z0 + TD, 3, IRON); bar(m, x, YR - 4, z0 + TD / 2, x, YR + TH / 2, z0 + TD / 2, 2, IRON); }
    }
    // Transmissionswelle (Riemenscheiben bewegt), Drehbänke darunter
    for (let x = HX0; x < HX1; x += CH) { const m = M(x + CH / 2, LSZ); beam(m, x, LSY, LSZ, x + CH, LSY, LSZ, 4, 4, IRONL, { open: true }); bar(m, x + 40, LSY, LSZ, x + 40, YR - 4, LSZ, 2, IRON2); }
    for (let b = Math.floor(HX0 / BAY); b * BAY < HX1; b++) {
      const mx = b * BAY + 64; if (Math.abs(mx - FW.x) < 300 || Math.abs(mx - FD.x) < 260 || Math.abs(mx - PLATE.x) < 320) continue;
      const m = M(mx, LSZ); box(m, mx + 18, 0, LSZ, 96, 24, 30, GREEN, { top: [60, 104, 84] }); box(m, mx, 24, LSZ, 26, 26, 28, GREEN); box(m, mx + 52, 24, LSZ, 18, 16, 22, IRON);
      beam(m, mx + 12, 38, LSZ, mx + 46, 38, LSZ, 4, 4, IRONL, { open: true }); box(m, mx, 50, LSZ - 15, 4, 4, 2, BRASS);
    }
    // hintere Säulenreihe: schlanke Gusseisensäulen mit Kapitell und Kopfbändern
    for (let b = Math.floor(HX0 / BAY); b * BAY < HX1; b++) {
      const x = b * BAY + 128, m = M(x, BCZ);
      box(m, x, 0, BCZ, 18, 8, 18, STONE); prism(m, x, 8, BCZ, 6.5, 10, 8, IRON, { rTop: 4.5 }); prism(m, x, 18, BCZ, 4.2, YR - 40, 8, IRON, { rTop: 3.8, cap: false });
      prism(m, x, YR - 22, BCZ, 4, 10, 8, IRON, { rTop: 9 }); for (const s of [-1, 1]) { bar(m, x, YR - 14, BCZ, x + s * 22, YR - 6, BCZ, 2, IRON); bar(m, x + s * 22, YR - 6, BCZ, x + s * 40, YR - 3, BCZ, 2, IRON); }
    }
    // Dampfmaschine vor dem Schwungrad: Fundament, Zylinder mit Messingbändern, Schieberkasten, Kreuzkopfführung; Lagerbock hinter dem Rad
    { const m = M(FW.x, ZF + 1), cy = FW.y;
      box(m, (ENG.x0 + FW.x - 80) / 2, 0, ENG.z + 6, FW.x - 80 - ENG.x0 + 20, cy - 26, 60, STONE, { top: [170, 156, 136] });
      box(m, (ENG.x0 + ENG.x1) / 2, cy - 26, ENG.z, ENG.x1 - ENG.x0, 52, 48, GREEN, { top: [62, 108, 88] });
      for (const bx of [ENG.x0 + 4, ENG.x0 + 40, ENG.x1 - 40, ENG.x1 - 4]) box(m, bx, cy - 28, ENG.z, 6, 56, 50, BRASS);
      box(m, (ENG.x0 + ENG.x1) / 2, cy + 26, ENG.z + 4, 60, 18, 30, IRON, { top: IRONL });
      bar(m, (ENG.x0 + ENG.x1) / 2, cy + 44, ENG.z, (ENG.x0 + ENG.x1) / 2, YR - 30, ENG.z, 7, COPPER); // Dampfzuleitung
      for (const s of [-1, 1]) beam(m, ENG.x1, cy + s * 13, ENG.z - 14, FW.x - 70, cy + s * 13, ENG.z - 14, 5, 5, IRONL, { open: true });
      box(m, FW.x, 0, FW.z + 34, 36, cy + 10, 22, STONE, { top: [170, 156, 136] }); box(m, FW.x, cy - 8, FW.z + 30, 30, 20, 20, BRASS);
    }
    // Gießerei: Kupolofen mit Eisenbändern und Schlot durchs Dach, Gichtbühne, Abstich mit glühender Rinne, Pfanne, Formkästen
    { const m = M(FD.x, ZF + 1), z = FD.z;
      prism(m, FD.x, 0, z, 54, 250, 10, BRICK2, { top: [40, 20, 16] }); for (const yy of [30, 90, 150, 210]) prism(m, FD.x, yy, z, 56, 7, 10, IRON2);
      prism(m, FD.x, 250, z, 30, 120, 8, IRON2, { cap: false }); cone(m, FD.x, 250, z, 56, 20, 10, IRON);
      box(m, FD.x, 160, z - 40, 220, 6, 50, IRON2); for (let k = -5; k <= 5; k++) bar(m, FD.x + k * 20, 166, z - 64, FD.x + k * 20, 190, z - 64, 1.4, IRONL);
      bar(m, FD.x - 110, 188, z - 64, FD.x + 110, 188, z - 64, 2, IRONL);
      quad(m, [[FD.x - 9, 48, z - 55], [FD.x + 9, 48, z - 55], [FD.x + 9, 66, z - 55], [FD.x - 9, 66, z - 55]], [255, 150, 40], { two: true, e: 1 });
      for (let k = -3; k <= 3; k++) if (k) quad(m, [[FD.x + k * 13 - 3, 22, z - 54], [FD.x + k * 13 + 3, 22, z - 54], [FD.x + k * 13 + 3, 28, z - 54], [FD.x + k * 13 - 3, 28, z - 54]], [255, 120, 30], { two: true, e: 0.9 });
      quad(m, [[FD.x - 14, 196, z - 56], [FD.x + 14, 196, z - 56], [FD.x + 14, 216, z - 56], [FD.x - 14, 216, z - 56]], [255, 170, 60], { two: true, e: 0.8 }); // Gichtöffnung
      box(m, FD.x, 50, z - 70, 12, 5, 30, IRON); quad(m, [[FD.x - 4, 55.5, z - 84], [FD.x + 4, 55.5, z - 84], [FD.x + 4, 55.5, z - 56], [FD.x - 4, 55.5, z - 56]], [255, 170, 60], { two: true, e: 1 });
      prism(m, FD.x, 0, z - 96, 22, 34, 8, IRON2); prism(m, FD.x, 34, z - 96, 20, 1, 8, [255, 160, 50], { e: 1 });
      for (let k = 0; k < 6; k++) { const mx = FD.x - 250 + k * 34; box(m, mx, 0, z - 80, 28, 10, 26, [70, 60, 50], { top: k % 2 ? [255, 120, 40] : [120, 60, 30], e: k % 2 ? 0.6 : 0.1 }); }
      beam(m, FD.x - 320, 252, z - 60, FD.x + 320, 252, z - 60, 8, 12, IRON2, { open: true }); box(m, FD.x - 120, 236, z - 60, 26, 12, 20, IRON);
      bar(m, FD.x - 120, 236, z - 60, FD.x - 120, 150, z - 60, 1.4, IRONL); prism(m, FD.x - 120, 120, z - 60, 14, 24, 8, IRON2);
    }
    // vordere Säulenreihe: Gusseisen mit Sockel, Schaftring und Kelchkapitell; dazwischen Jugendstilbögen (Gitterträger mit
    // Bogenuntergurt, Ringen in den Zwickeln und Peitschenschwüngen), am Scheitel hängt je eine Gaslampe
    for (let b = Math.floor(HX0 / BAY); b * BAY < HX1; b++) {
      const x = b * BAY, m = M(x, FCZ), mb = M(x + BAY / 2, FCZ);
      box(m, x, 0, FCZ, 24, 9, 24, STONE, { top: [176, 164, 144] }); prism(m, x, 9, FCZ, 10, 16, 8, IRON, { rTop: 6.5 });
      prism(m, x, 25, FCZ, 5.6, 200, 8, IRON, { rTop: 4.8, cap: false }); prism(m, x, 120, FCZ, 7, 5, 8, IRONL); prism(m, x, 60, FCZ, 6.4, 3, 8, BRASS);
      prism(m, x, 225, FCZ, 5, 12, 8, IRON, { rTop: 12 }); box(m, x, 237, FCZ, 30, 5, 30, IRON2, { top: IRONL });
      const arc = (t) => [x + t * BAY, 242 + 40 * Math.sin(Math.PI * t), FCZ];
      for (let k = 0; k < 14; k++) { const a = arc(k / 14), c = arc((k + 1) / 14); bar(mb, a[0], a[1], FCZ, c[0], c[1], FCZ, 3.6, IRONL); }
      bar(mb, x, YR - 3, FCZ, x + BAY, YR - 3, FCZ, 4, IRONL);
      for (let k = 1; k < 14; k++) { const a = arc(k / 14); if (Math.abs(k - 7) > 0) bar(mb, a[0], a[1], FCZ, a[0], YR - 3, FCZ, 1.5, IRON); }
      for (const t of [0.09, 0.91]) { const cx = x + t * BAY, cy = 268; for (let k = 0; k < 10; k++) { const p0 = arcPts(cx, cy, 8, k / 10 * Math.PI * 2, (k + 1) / 10 * Math.PI * 2, 1, FCZ); bar(mb, p0[0][0], p0[0][1], FCZ, p0[1][0], p0[1][1], FCZ, 1.5, IRONL); } box(mb, cx, cy - 1.5, FCZ - 1, 3, 3, 2, BRASS); }
      for (const s of [-1, 1]) { const cx = x + BAY / 2 + s * 46; let p = [cx, YR - 4]; for (let k = 1; k <= 6; k++) { const a = k * 0.62, r = 16 - k * 2; const q = [cx - s * Math.sin(a) * r, YR - 4 - (1 - Math.cos(a)) * r * 0.9]; bar(mb, p[0], p[1], FCZ, q[0], q[1], FCZ, 1.4, IRON); p = q; } }
      const lx = x + BAY / 2, ly = 226; // Gaslampe am Bogenscheitel
      bar(mb, lx, 282, FCZ, lx, ly + 8, FCZ, 1.2, IRON2); cone(mb, lx, ly + 3, FCZ, 9, 6, 8, [40, 70, 56]); cone(mb, lx, ly + 3, FCZ, 4.5, -6, 6, LAMPC, { e: 1 });
      lamps.push([lx, ly, FCZ, 1]);
    }
    // Montageband: Laufschiene (Doppel-T) mit Abhängungen, darunter Werkbänke mit Köpfen, Rümpfen und Zahnrädern
    for (let x = HX0; x < HX1; x += CH) {
      const m = M(x + CH / 2, RZ);
      beam(m, x, RY + 4, RZ, x + CH, RY + 4, RZ, 3, 8, IRON2, { open: true }); beam(m, x, RY, RZ, x + CH, RY, RZ, 9, 2, IRON, { open: true });
      for (const hx of [x + 30, x + 158]) bar(m, hx, RY + 8, RZ, hx, YR - 4, RZ, 1.6, IRON2);
      for (const bx of [x + 64, x + 192]) {
        if (Math.abs(bx - FW.x) < 140 || Math.abs(bx - FD.x) < 200) continue;
        box(m, bx, 0, RZ + 14, 104, 28, 34, WOOD, { top: [110, 82, 58] });
        for (let k = 0; k < 4; k++) { const ox = bx - 38 + k * 25 + R() * 8, t = R(); if (t < 0.35) prism(m, ox, 28, RZ + 10, 3.6, 6, 6, PORC, { rTop: 3 }); else if (t < 0.65) box(m, ox, 28, RZ + 12, 10, 7, 9, NAVY); else prism(m, ox, 28, RZ + 12, 6, 2, 8, BRASS); }
      }
    }
    return L;
  }

  // ---------------- Vorgerenderte Bilder: Schwungrad, Automaten an der Schiene, Firmenschild, Dampfwolken ----------------
  const SPRENV = { sun: null, sunC: [0.95, 0.86, 0.72], amb: [0.36, 0.36, 0.46], sky: [0.22, 0.22, 0.32], fog: [0, 0, 0], fogD: 0 };
  { const v = [-0.45, 0.65, -0.62], l = Math.hypot(...v); SPRENV.sun = v.map(c => c / l); }
  // Mesh fast orthografisch (Kamera 1500 entfernt) in eine Leinwand rastern: 1 Einheit = sc Pixel, Ursprung bei (ox, oy)
  function snap(list, Wc, Hc, sc, ox, oy, yaw = 0, env = SPRENV) {
    const c = Sprites.canvas(Wc, Hc), D = 1500, cam = { x: -D * Math.sin(yaw), y: 0, z: -D * Math.cos(yaw), yaw, pitch: 0, f: D * sc, near: 100, cx: ox, cy: oy };
    render(c.getContext('2d', CPU), Wc, Hc, list, cam, env);
    return { c, cam };
  }
  function half(src, w, h, thr) { // halbieren (weiche Kanten), optional mit hartem Alpha für Pixelkonturen
    const c = Sprites.canvas(w, h), x = c.getContext('2d', CPU);
    x.imageSmoothingEnabled = true; x.drawImage(src, 0, 0, w, h);
    if (thr) { const im = x.getImageData(0, 0, w, h), d = im.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= thr ? 255 : 0; x.putImageData(im, 0, 0); }
    return c;
  }
  let wheelImg = null;
  function wheel() { // Schwungrad von vorn: Kranz aus 32 Gliedern mit polierter Kante, sechs Speichen, Nabe – dreht sich als Bild
    if (wheelImg) return wheelImg;
    const m = mesh(), R0 = FW.r, S = 2 * 200 / FW.z, N = 32, RIM = [70, 30, 26], RIM2 = [48, 22, 20];
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
      beam(m, Math.cos(a0) * R0, Math.sin(a0) * R0, 0, Math.cos(a1) * R0, Math.sin(a1) * R0, 0, 22, 14, i % 2 ? RIM : RIM2);
      beam(m, Math.cos(a0) * (R0 + 6), Math.sin(a0) * (R0 + 6), -4, Math.cos(a1) * (R0 + 6), Math.sin(a1) * (R0 + 6), -4, 14, 2, IRONL);
      beam(m, Math.cos(a0) * (R0 - 9), Math.sin(a0) * (R0 - 9), -2, Math.cos(a1) * (R0 - 9), Math.sin(a1) * (R0 - 9), -2, 12, 3, BRASS);
    }
    for (let k = 0; k < 6; k++) { // Speichen leicht geschwungen, zur Nabe hin dicker
      const a = k / 6 * Math.PI * 2, b = a + 0.12;
      beam(m, Math.cos(a) * 16, Math.sin(a) * 16, 0, Math.cos(b) * 58, Math.sin(b) * 58, 0, 12, 12, RIM);
      beam(m, Math.cos(b) * 58, Math.sin(b) * 58, 0, Math.cos(a + 0.05) * (R0 - 8), Math.sin(a + 0.05) * (R0 - 8), 0, 9, 9, RIM);
    }
    beam(m, 0, 0, -16, 0, 0, 12, 34, 34, IRON); beam(m, 0, 0, -20, 0, 0, -16, 22, 22, BRASS);
    const sz = Math.ceil((R0 + 12) * S) * 2, { c } = snap([m], sz, sz, S, sz / 2, sz / 2, 0);
    return (wheelImg = { c, s: sz / 2 });
  }
  // Aufziehsoldat (Gegner und halbfertige Puppen an der Schiene): Tschako mit Messingschild und rotem Federbusch, Porzellangesicht,
  // dunkelblauer Waffenrock mit weißem Kreuzgurt, goldenen Epauletten und Messingknöpfen, Gelenkkugeln aus Messing, ein großer
  // Aufziehschlüssel im Rücken; der rechte Unterarm endet in einer Säbelklinge. Pose: Winkel der Glieder (Radiant, 0 = senkrecht)
  const P_ = { lean: 0, head: 0, hipF: 0, kneeF: 0, hipB: 0, kneeB: 0, shB: 0.1, elB: 0.1, shF: 0.2, elF: 0.3 };
  const POSES = {
    stand: {}, sleep: { lean: 0.42, head: 0.5, hipF: 0.18, kneeF: 0.38, hipB: 0.12, kneeB: 0.32, shB: -0.3, elB: 0, shF: -0.25, elF: 0 },
    walk0: { hipF: 0.36, kneeF: 0.08, hipB: -0.3, kneeB: 0.32, shB: 0.35, shF: -0.1, elF: 0.4, lean: 0.06 },
    walk1: { hipF: 0.12, kneeF: 0.05, hipB: -0.06, kneeB: 0.5, shB: 0.15, shF: 0.1, elF: 0.4, lean: 0.06 },
    walk2: { hipF: -0.3, kneeF: 0.32, hipB: 0.36, kneeB: 0.08, shB: -0.15, shF: 0.4, elF: 0.4, lean: 0.06 },
    walk3: { hipF: -0.06, kneeF: 0.5, hipB: 0.12, kneeB: 0.05, shB: 0.05, shF: 0.25, elF: 0.4, lean: 0.06 },
    wind: { lean: -0.12, hipF: 0.3, kneeF: 0.15, hipB: -0.25, kneeB: 0.1, shB: 0.7, elB: 0.5, shF: -2.6, elF: -0.5 },
    lunge: { lean: 0.5, hipF: 0.8, kneeF: 0.7, hipB: -0.55, kneeB: 0.1, shB: -0.6, elB: 0.2, shF: 1.62, elF: 0.02, head: -0.15 },
    recover: { lean: 0.32, hipF: 0.6, kneeF: 0.6, hipB: -0.4, kneeB: 0.15, shB: -0.3, shF: 0.9, elF: 0.7, head: 0.1 },
    hang: { lean: 0.08, head: 0.45, hipF: 0.08, kneeF: 0.16, hipB: -0.02, kneeB: 0.2, shB: -0.08, elB: 0.06, shF: 0.06, elF: 0.1 },
  };
  function oBox(m, c, ux, uy, hx, hy, hz, col, o = {}) { // Quader mit Achsen ux, uy (in der x-y-Ebene) und z
    const P = (a, b, d) => vtx(m, c[0] + ux[0] * a * hx + uy[0] * b * hy, c[1] + ux[1] * a * hx + uy[1] * b * hy, c[2] + d * hz);
    const p = [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1), P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)];
    face(m, [p[0], p[1], p[2], p[3]], col, c, o); face(m, [p[4], p[5], p[6], p[7]], col, c, o); face(m, [p[0], p[1], p[5], p[4]], col, c, o);
    face(m, [p[3], p[2], p[6], p[7]], o.top || col, c, o); face(m, [p[0], p[3], p[7], p[4]], col, c, o); face(m, [p[1], p[2], p[6], p[5]], col, c, o);
  }
  function limb(m, a, b, w, d, col, o) { // Glied von a nach b (in der x-y-Ebene, Tiefe d)
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, uy = [dx / l, dy / l], ux = [uy[1], -uy[0]];
    oBox(m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], ux, uy, w / 2, l / 2, d / 2, col, o);
  }
  const ball = (m, p, r, col) => oBox(m, p, [1, 0], [0, 1], r, r, r, col);
  const dir = (p, ang, len) => [p[0] + Math.sin(ang) * len, p[1] - Math.cos(ang) * len, p[2]];
  // part: 'full' (Gegner), 'noarms' (ohne Arme), 'frame' (nur Gerippe aus Messing), 'torso' (ohne Beine und Kopf)
  function soldier(pose, part = 'full') {
    const q = { ...P_, ...pose }, m = mesh(), BOOT = [26, 24, 30], TROU = [36, 40, 74], STRIPE = [170, 36, 40], GOLD = [232, 186, 70], JOINT = [190, 150, 64], WHITE = [226, 228, 236];
    const frame = part === 'frame', eyes = {};
    const hip = [0, 18.5, 0];
    if (part !== 'torso') for (const [s, hipA, kneeA] of [[1, q.hipB, q.kneeB], [-1, q.hipF, q.kneeF]]) { // Beine: hinten (z +), vorn (z −)
      const h = [hip[0], hip[1], s * 2.6], k = dir(h, hipA, 8.5), f = dir(k, hipA - kneeA, 8.5);
      limb(m, h, k, frame ? 1.6 : 3.6, frame ? 1.6 : 3.6, frame ? JOINT : TROU); limb(m, k, f, frame ? 1.6 : 3.2, frame ? 1.6 : 3.2, frame ? JOINT : TROU);
      if (!frame) limb(m, [h[0] + 1.85, h[1], h[2] - s * 0.2], [k[0] + 1.85, k[1], k[2] - s * 0.2], 0.6, 3.7, STRIPE);
      ball(m, k, 1.9, JOINT); oBox(m, [f[0] + 1.2, f[1] + 1.4, f[2]], [1, 0], [0, 1], 3.3, 1.5, 1.7, BOOT);
    }
    const ly = [Math.sin(q.lean), Math.cos(q.lean)], lx = [ly[1], -ly[0]], at = (u, v, z = 0) => [hip[0] + lx[0] * u + ly[0] * v, hip[1] + lx[1] * u + ly[1] * v, z];
    ball(m, at(0, 0.5), 3.2, frame ? JOINT : TROU);
    if (frame) { for (const v of [4, 7, 10]) oBox(m, at(0, v), lx, ly, 4.2, 0.6, 3.4, JOINT); limb(m, at(-1, 1), at(-1, 12), 1.4, 1.4, JOINT); }
    else {
      oBox(m, at(0, 7), lx, ly, 4.6, 6, 3.4, NAVY);                                                 // Waffenrock
      oBox(m, at(0, 1.6), lx, ly, 4.9, 0.9, 3.6, WHITE);                                           // Koppel
      for (const s of [-1, 1]) limb(m, at(-3.8, 12, s * 3.55), at(3.9, 2.4, s * 3.55), 1.3, 0.4, WHITE); // Kreuzgurt (seitlich sichtbar)
      for (const v of [4.5, 7.2, 9.9]) ball(m, at(4.75, v, -1.4), 0.55, GOLD);                    // Knöpfe
      for (const s of [-1, 1]) oBox(m, at(0.3, 12.7, s * 3.6), lx, ly, 2.2, 0.8, 1.6, GOLD);       // Epauletten
      limb(m, at(-4.4, 8), at(-8, 8.3), 1.3, 1.3, JOINT); oBox(m, at(-9.6, 8.6), lx, ly, 0.6, 3.2, 0.7, GOLD); // Aufziehschlüssel im Rücken
      for (const s of [-1, 1]) ball(m, at(-9.6, 8.6 + s * 2.6), 1.3, GOLD);
    }
    const neck = at(0, 13.6);
    if (part === 'torso') ball(m, neck, 1.3, JOINT); // kopflos: nur der Halsstummel
    else {
      const hr = [Math.sin(q.lean + q.head), Math.cos(q.lean + q.head)], hx = [hr[1], -hr[0]], hc = [neck[0] + hr[0] * 4, neck[1] + hr[1] * 4, 0];
      const hd = (u, v, z = 0) => [hc[0] + hx[0] * u + hr[0] * v, hc[1] + hx[1] * u + hr[1] * v, z];
      limb(m, neck, hd(0, -2.4), 1.6, 1.6, JOINT);
      oBox(m, hd(0.2, 0.4), hx, hr, 2.9, 3.4, 2.7, PORC); oBox(m, hd(2.9, -0.4), hx, hr, 0.5, 2.2, 1.9, PORC);   // Porzellankopf, Nase/Kinn
      oBox(m, hd(2.6, -1.6), hx, hr, 0.35, 0.3, 1.4, [40, 20, 24]);                                                // Mund
      if (!frame) {
        oBox(m, hd(0, 5.6), hx, hr, 3.0, 2.6, 3.0, [24, 22, 30], { top: [44, 40, 54] });                           // Tschako
        oBox(m, hd(3.05, 5.4), hx, hr, 0.25, 1.6, 1.4, GOLD); oBox(m, hd(2.4, 3.1), hx, hr, 1.4, 0.35, 2.4, [20, 18, 24]); // Schild, Schirm
        limb(m, hd(-0.6, 8), hd(-1.6, 12.4), 1.6, 1.6, [200, 32, 40]); ball(m, hd(-1.7, 12.6), 1.2, [230, 60, 60]);        // Federbusch
      }
      eyes.a = hd(3.2, 0.9, -1.2); eyes.b = hd(3.2, 0.9, 1.2);
    }
    if (part === 'full' || part === 'frame' || part === 'torso') for (const [s, sh, el, blade] of [[1, q.shB, q.elB, false], [-1, q.shF, q.elF, part === 'full']]) { // Arme: hinten, vorn (Säbelarm)
      const sp = at(0.2, 11.6, s * 5), e = dir(sp, sh, 6.5), w = dir(e, sh + el, 6);
      ball(m, sp, 1.9, frame ? JOINT : GOLD); limb(m, sp, e, 2.6, 2.6, frame ? JOINT : NAVY); ball(m, e, 1.5, JOINT); limb(m, e, w, 2.2, 2.2, frame ? JOINT : NAVY);
      if (blade) { // Säbel: Messingkorb und lange Klinge in Verlängerung des Unterarms
        ball(m, w, 1.7, GOLD); const tip = dir(w, sh + el, 15.5);
        limb(m, w, tip, 1.5, 0.7, [214, 222, 236], { e: 0.12 }); limb(m, dir(w, sh + el, 2), dir(w, sh + el, 15), 0.4, 0.8, [255, 255, 255], { e: 0.3 });
        eyes.tip = tip;
      } else ball(m, w, 1.5, frame ? JOINT : WHITE);
    }
    return { m, eyes };
  }
  const SPR = {}; let sprReady = false;
  const SW = 52, SH = 46, SOY = 44; // Gegner-Sprite (Ursprung = Füße bei SW/2, SOY)
  function buildSprites() {
    if (sprReady) return; sprReady = true;
    const sc = 0.82 * 2, yaw = -0.42;
    for (const k in POSES) {
      const { m, eyes } = soldier(POSES[k], 'full'), { c, cam } = snap([m], SW * 2, SH * 2, sc, SW, SOY * 2, yaw);
      const pr = (p) => { const r = PS2.project(cam, SW * 2, SH * 2, p[0], p[1], p[2]); return [r[0] / 2 - SW / 2, r[1] / 2 - SOY]; };
      SPR[k] = { s: Sprites.fromCanvas(half(c, SW, SH, 110), true), eyes: eyes.a ? [pr(eyes.a), pr(eyes.b)] : null, tip: eyes.tip ? pr(eyes.tip) : null };
    }
  }
  // halbfertige Automaten an der Schiene (z = RZ): vier Bauzustände, hängend an der Halsöse
  let hangImgs = null;
  function hangSprites() {
    if (hangImgs) return hangImgs;
    const sc = 2 * 200 / RZ, parts = ['full', 'noarms', 'frame', 'torso'];
    hangImgs = parts.map((p, i) => {
      const { m } = soldier(POSES.hang, p === 'full' ? 'noarms' : p), W2 = 60, H2 = 64, { c } = snap([m], W2, H2, sc, W2 / 2, H2 - 6, -0.5 + i * 0.35, ENVH), h = half(c, W2 / 2, H2 / 2, 0);
      const d = h.getContext('2d', CPU).getImageData(0, 0, W2 / 2, H2 / 2).data; let ay = 0; // oberste deckende Zeile = Aufhängung
      for (let i2 = 3; i2 < d.length; i2 += 4) if (d[i2] > 60) { ay = Math.floor((i2 >> 2) / (W2 / 2)); break; }
      return { c: h, ax: W2 / 4, ay };
    });
    return hangImgs;
  }
  const ENVH = { sun: null, sunC: [0.5, 0.56, 0.72], amb: [0.34, 0.32, 0.36], sky: [0.2, 0.2, 0.28], fog: [0, 0, 0], fogD: 0 };
  { const v = [-0.3, 0.8, -0.5], l = Math.hypot(...v); ENVH.sun = v.map(c => c / l); }
  let plateImg = null;
  function plate() { // Firmenschild aus Messing: geprägte Schrift, Doppelrahmen, Nieten
    if (plateImg) return plateImg;
    const w = 200, h = 54, c = C(w, h), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f4dc94'); g.addColorStop(0.45, '#c8963c'); g.addColorStop(0.55, '#b07c2c'); g.addColorStop(1, '#704c18');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#4c3010'; x.lineWidth = 2; x.strokeRect(3, 3, w - 6, h - 6); x.strokeStyle = '#fff0b8'; x.lineWidth = 1; x.strokeRect(6.5, 6.5, w - 13, h - 13);
    for (const [X, Y] of [[10, 10], [w - 11, 10], [10, h - 11], [w - 11, h - 11]]) { px(x, '#4c3010', X - 1, Y - 1, 3, 3); px(x, '#fff4c8', X - 1, Y - 1); }
    const emb = (fn, col, dx, dy) => { x.save(); x.translate(dx, dy); fn(col); x.restore(); };
    const head = (col) => { const t = C(84, 9), tx = t.getContext('2d'); Font.draw(tx, 'AUTOMATENWERK', 1, 1, col); x.imageSmoothingEnabled = false; x.drawImage(t, 16, 9, 168, 18); };
    emb(head, '#4c2c08', 1, 1); emb(head, '#fff6d0', 0, 0);
    const line = (txt, y) => { Font.draw(x, txt, w / 2 + 1, y + 1, '#4c2c08', { align: 'center' }); Font.draw(x, txt, w / 2, y, '#fff0c0', { align: 'center' }); };
    line('J. EISENHART UND SÖHNE', 31); line('- GEGR. 1889 -', 41);
    return (plateImg = c);
  }
  const puffC = new Map();
  function puff(r, col = '222,226,236') { // weiche Dampfwolke (gecacht je Radius)
    r = Math.max(2, Math.round(r)); const k = r + '|' + col; let c = puffC.get(k);
    if (!c) { c = C(r * 2, r * 2); const x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, `rgba(${col},0.75)`); g.addColorStop(0.5, `rgba(${col},0.4)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); puffC.set(k, c); }
    return c;
  }
  let skyC = null;
  function skyTex() { // Gewitterwolken (nahtlos, 512 breit)
    if (skyC) return skyC;
    const w = 512, h = 150, c = C(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data;
    const vn = (X, Y, p, s) => { const x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), H = (a, b) => hn(((a % p) + p) % p, b, s); return (H(x0, y0) * (1 - u) + H(x0 + 1, y0) * u) * (1 - v) + (H(x0, y0 + 1) * (1 - u) + H(x0 + 1, y0 + 1) * u) * v; };
    for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
      let n = 0, a = 0.55, f = 1 / 64;
      for (let o = 0; o < 4; o++) { n += vn(X * f * 1, Y * f * 1.8, 512 * f, 11 + o) * a; a *= 0.5; f *= 2; }
      const k = Math.max(0, Math.min(1, (n - 0.36) * 2.1)), mo = Math.max(0, 1 - Math.hypot(((X - 300 + 768) % 512) - 256, (Y - 34) * 2.2) / 230), i = (Y * w + X) * 4, b = bay4(X, Y) * 0.05;
      const L = k * (0.55 + 0.6 * mo) + mo * 0.25; // Wolkenränder im Mondlicht
      d[i] = 12 + L * 112 + b * 40; d[i + 1] = 14 + L * 122 + b * 40; d[i + 2] = 28 + L * 150 + b * 50; d[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return (skyC = c);
  }
  const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bay4 = (x, y) => BAY4[(y & 3) * 4 + (x & 3)] / 16;

  // ---------------- Zeichnen der Halle ----------------
  const bufs = {};
  function layerBuf(name, Wb, Hb) {
    let B = bufs[name];
    if (!B || B.c.width !== Wb) { B = bufs[name] = { c: Sprites.canvas(Wb, Hb), key: null, np: 0 }; B.x = B.c.getContext('2d', CPU); }
    return B;
  }
  function visible(list, camX, zmax) { // Abschnitte, die bis in die Tiefe zmax ins Bild reichen können
    const half = View.w / 2 * zmax / 200 + 140, out = [];
    for (let k = 0; k < NC; k++) { const a = HX0 + k * CH; if (a + CH > camX - half && a < camX + half) out.push(list[k]); }
    return out;
  }
  const st = { fly: 0, sparks: [], puffs: [], hook: 0, lastF: -1, cam: null }; // bewegte Teile
  function prewarm() { if (!hall) hall = buildHall(); wheel(); hangSprites(); plate(); skyTex(); buildSprites(); }
  function view(cam) { // 3D-Kamera zur Spielkamera (Vollauflösung)
    const room = W.room, floorPx = room ? (room.h - 2) * T : 176, maxY = room ? Math.max(0, room.h * T - View.fh) : 0;
    const rawMin = floorPx - maxY - HY, raw = floorPx - cam.y - HY;
    return { x: cam.x + View.w / 2, y: rawMin + (raw - rawMin) * 0.72 };
  }
  const P3 = (v, X, Y, Z) => [View.w / 2 + (X - v.x) * 200 / Z, HY - (Y - v.y) * 200 / Z];
  function drawHall(ctx, cam, frame) {
    if (!hall) prewarm();
    const w = View.w, lite = View.lite, dv = lite ? 3 : 2, Wb = Math.ceil(w / dv), Hb = Math.ceil(208 / dv), v = view(cam);
    st.cam = v;
    if (st.lastF !== frame) { st.lastF = frame; st.fly += 0.021; stepFx(v, frame); }
    drawSky(ctx, cam, frame);
    const c3 = { x: v.x, y: v.y, z: 0, yaw: 0, pitch: 0, f: 200 / dv, near: 20, hy: HY / 208 };
    const A = layerBuf('wall', Wb, Hb), F = layerBuf('far', Wb, Hb), N = layerBuf('near', Wb, Hb);
    const kf = Math.round(v.x * 0.42 / dv) + '|' + Math.round(v.y * 0.42 / dv) + '|' + Wb;
    if (F.key !== kf) {
      F.key = kf; A.x.clearRect(0, 0, Wb, Hb); F.x.clearRect(0, 0, Wb, Hb);
      A.np = render(A.x, Wb, Hb, visible(hall.wall, v.x, ZB), c3, ENV); F.np = render(F.x, Wb, Hb, visible(hall.far, v.x, ZB), c3, ENV);
    }
    const kn = Math.round(v.x / dv) + '|' + Math.round(v.y / dv) + '|' + Wb;
    if (N.key !== kn) { N.key = kn; N.x.clearRect(0, 0, Wb, Hb); N.np = render(N.x, Wb, Hb, visible(hall.near, v.x, ZF), c3, ENV); nearLights(N, c3, Wb, Hb, dv); }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(A.c, 0, 0, Wb, Hb, 0, 0, w, 208); ctx.restore();
    drawPlate(ctx, v, frame); // Firmenschild an der Rückwand – hinter Maschinen und Säulen
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(F.c, 0, 0, Wb, Hb, 0, 0, w, 208); ctx.restore();
    drawGlassFlash(ctx, v, frame);
    drawBack(ctx, v, frame);
    drawMachines(ctx, v, frame);
    drawLine(ctx, v, frame);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(N.c, 0, 0, Wb, Hb, 0, 0, w, 208); ctx.restore();
    drawShafts(ctx, frame);
  }
  function drawSky(ctx, cam, frame) {
    const w = View.w, S = skyTex(), off = (((cam.x * 0.05 + frame * 0.06) % 512) + 512) % 512;
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, w, 208);
    for (let x = -off; x < w; x += 512) ctx.drawImage(S, Math.round(x), 0);
    const g = ctx.createLinearGradient(0, 110, 0, 208); g.addColorStop(0, 'rgba(10,12,22,0)'); g.addColorStop(1, 'rgba(10,12,22,1)'); ctx.fillStyle = g; ctx.fillRect(0, 110, w, 98);
    if (W.storm && FX.stormOn(W.storm)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; for (let x = -off; x < w; x += 512) ctx.drawImage(S, Math.round(x), 0); ctx.restore(); }
    if (W.storm) FX.drawStormSky(ctx, W.storm, w);
  }
  // Lichtbahnen aus den Sheds (kaltes Gewitterlicht) und Lichthöfe der Gaslampen – beim Neurastern der vorderen Ebene vorbereitet
  function nearLights(N, c3, Wb, Hb, dv) {
    if (!N.sh || N.sh.width !== Wb) { N.sh = Sprites.canvas(Wb, Hb); N.shx = N.sh.getContext('2d'); }
    const x = N.shx; x.clearRect(0, 0, Wb, Hb); N.dust = [];
    x.globalCompositeOperation = 'lighter';
    const LXs = -0.32, LZs = -0.42; // das Licht fällt nach links unten und nach vorn
    for (const [zg, o] of [[TEETH[0] + TD, 40], [TEETH[1] + TD, 170]]) for (let k = Math.floor((c3.x - 700) / 256); k <= Math.floor((c3.x + 700) / 256); k++) {
      const x0 = k * 256 + o, x1 = x0 + 42, yT = YR + 4, zB = zg + LZs * YR, xs = LXs * YR;
      const T0 = PS2.project(c3, Wb, Hb, x0, yT, zg), T1 = PS2.project(c3, Wb, Hb, x1, yT, zg), B0 = PS2.project(c3, Wb, Hb, x0 + xs, 0, Math.max(210, zB)), B1 = PS2.project(c3, Wb, Hb, x1 + xs, 0, Math.max(210, zB));
      if (Math.max(T0[0], T1[0], B0[0], B1[0]) < 0 || Math.min(T0[0], T1[0], B0[0], B1[0]) > Wb) continue;
      const g = x.createLinearGradient(T0[0], T0[1], B0[0], B0[1]), a = 0.26 + 0.1 * hn(k, zg, 3);
      g.addColorStop(0, `rgba(170,190,255,${a.toFixed(3)})`); g.addColorStop(0.7, `rgba(140,160,230,${(a * 0.45).toFixed(3)})`); g.addColorStop(1, 'rgba(140,160,230,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(T0[0], T0[1]); x.lineTo(T1[0], T1[1]); x.lineTo(B1[0], B1[1]); x.lineTo(B0[0], B0[1]); x.closePath(); x.fill();
      N.dust.push([(T0[0] + T1[0]) / 2 * dv, (T0[1] + T1[1]) / 2 * dv, (B0[0] + B1[0]) / 2 * dv, (B0[1] + B1[1]) / 2 * dv, k * 1.7 + zg]);
    }
    x.globalCompositeOperation = 'source-over';
    N.x.save(); N.x.globalCompositeOperation = 'lighter'; lampScr = []; // Lichthöfe der Gaslampen unter den Bögen
    for (const [lx, ly, lz] of lamps) {
      const [sx, sy, sz] = PS2.project(c3, Wb, Hb, lx, ly, lz), r = 6200 / sz / dv; if (sz < 20 || sx < -r || sx > Wb + r || sy < -r || sy > Hb + r) continue;
      lampScr.push([sx * dv, sy * dv]);
      const g = N.x.createRadialGradient(sx, sy, 0, sx, sy, r); g.addColorStop(0, 'rgba(255,200,120,0.55)'); g.addColorStop(1, 'rgba(255,150,70,0)');
      N.x.fillStyle = g; N.x.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    N.x.restore();
  }
  const stormK = (frame) => { const on = W.storm && FX.stormOn(W.storm), fl = W.storm && W.storm.flash > 0; return on ? 1 : fl ? 0.55 : 0.32 + 0.1 * Math.sin(frame * 0.013) + 0.06 * Math.sin(frame * 0.051); };
  function drawShafts(ctx, frame) {
    const N = bufs.near; if (!N || !N.sh) return;
    const k = stormK(frame);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.globalAlpha = Math.min(1, k);
    ctx.drawImage(N.sh, 0, 0, N.sh.width, N.sh.height, 0, 0, View.w, 208);
    ctx.restore();
    if (View.lite) return;
    ctx.fillStyle = 'rgba(214,226,255,0.5)'; // Staub in den Lichtbahnen
    for (const [tx, ty, bx, by, ph] of N.dust || []) for (let d = 0; d < 3; d++) {
      const u = (frame * 0.0018 + d * 0.33 + ph * 0.13) % 1, X = tx + (bx - tx) * u + Math.sin(frame * 0.02 + d * 2 + ph) * 3, Y = ty + (by - ty) * u;
      if (X >= 0 && X < View.w && Y >= 0 && Y < 208) ctx.fillRect(Math.round(X), Math.round(Y), 1, 1);
    }
  }
  // Rückwand: Firmenschild, Dampfstöße aus den Rohren, Gießerei (Abstich, Glut, Funken)
  function stepFx(v, frame) {
    for (const [x, y, z, b] of vents) { // Rohre zischen reihum
      if (Math.abs(x - v.x) > View.w * 1.6 + 200) continue;
      const ph = (frame + b * 97) % 260;
      if (ph < 50 && ph % 3 === 0) st.puffs.push({ x, y, z, vx: (hn(frame, b, 1) - 0.5) * 0.5, vy: 0.9 + hn(b, frame, 2) * 0.6, r: 4, t: 0, life: 70 });
    }
    if (Math.abs(FD.x - v.x) < View.w * 1.4 + 300) { // Funkenregen am Abstich
      const n = View.lite ? 1 : 3;
      for (let i = 0; i < n; i++) if (Math.random() < 0.7) st.sparks.push({ x: FD.x + (Math.random() - 0.5) * 8, y: 40, z: FD.z - 96, vx: (Math.random() - 0.5) * 3.2, vy: 1 + Math.random() * 3.4, vz: -Math.random() * 1.6, t: 0, life: 30 + Math.random() * 30 });
    }
    for (const p of st.puffs) { p.t++; p.x += p.vx; p.y += p.vy; p.vy *= 0.985; p.r += 0.32; }
    for (const s of st.sparks) { s.t++; s.x += s.vx; s.y += s.vy; s.z += s.vz; s.vy -= 0.16; if (s.y < 0) { s.y = 0; s.vy *= -0.35; s.vx *= 0.6; } }
    st.puffs = st.puffs.filter(p => p.t < p.life); st.sparks = st.sparks.filter(s => s.t < s.life);
  }
  function drawPlate(ctx, v, frame) { // Firmenschild an der Rückwand, angestrahlt von zwei Lampen
    const [sx, sy] = P3(v, PLATE.x, PLATE.y, ZB - 2), I = plate();
    if (sx + I.width < 0 || sx - I.width > View.w) return;
    ctx.drawImage(I, Math.round(sx - I.width / 2), Math.round(sy - I.height / 2));
    const fl = 0.85 + 0.15 * Math.sin(frame * 0.21) * Math.sin(frame * 0.05);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) { const lx = sx + s * 70, ly = sy - 36, g = ctx.createRadialGradient(lx, ly, 0, lx, ly + 30, 70); g.addColorStop(0, `rgba(255,214,140,${(0.3 * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(255,160,80,0)'); ctx.fillStyle = g; ctx.fillRect(lx - 70, ly - 20, 140, 120); px(ctx, '#2a2a30', Math.round(lx) - 3, Math.round(ly) - 3, 7, 2); px(ctx, '#fff0c0', Math.round(lx) - 2, Math.round(ly) - 1, 5, 1); }
    ctx.restore();
  }
  function drawGlassFlash(ctx, v, frame) { // Shedverglasung: Wolken ziehen als helle Bänder vorbei, im Blitz gleißt das ganze Dach
    const k = stormK(frame), on = W.storm && FX.stormOn(W.storm), half = View.w / 2 * ZB / 200 + 60;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x0, x1, zg] of roofGlass) {
      if (x1 < v.x - half || x0 > v.x + half) continue;
      const a = P3(v, x0, YR, zg), b = P3(v, x1, YR, zg), c = P3(v, x1, YR + TH, zg), d = P3(v, x0, YR + TH, zg);
      if (Math.max(a[1], b[1]) < 0) continue;
      const cl = 0.5 + 0.5 * Math.sin(x0 * 0.013 + zg * 0.05 + frame * 0.012);
      ctx.fillStyle = `rgba(150,170,255,${(on ? 0.7 : 0.05 + 0.08 * cl * k).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawBack(ctx, v, frame) {
    const w = View.w;
    for (const p of st.puffs) { // Dampf aus den Rohren
      const [sx, sy] = P3(v, p.x, p.y, p.z), r = p.r * 200 / p.z * 1.6; if (sx < -r || sx > w + r) continue;
      ctx.globalAlpha = 0.55 * (1 - p.t / p.life); ctx.drawImage(puff(r), Math.round(sx - r), Math.round(sy - r));
    }
    ctx.globalAlpha = 1;
    const [fx, fy] = P3(v, FD.x, 56, FD.z - 60); // Gießerei
    glows = [];
    if (fx > -260 && fx < w + 260) {
      const fl = 0.8 + 0.2 * Math.sin(frame * 0.33) * Math.sin(frame * 0.07 + 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(fx, fy, 2, fx, fy + 20, 170); g.addColorStop(0, `rgba(255,150,50,${(0.55 * fl).toFixed(3)})`); g.addColorStop(0.4, `rgba(220,80,20,${(0.22 * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(160,40,10,0)');
      ctx.fillStyle = g; ctx.fillRect(fx - 170, fy - 150, 340, 340);
      const [lx, ly] = P3(v, FD.x, 4, FD.z - 96), [sx0, sy0] = P3(v, FD.x, 55, FD.z - 82); // Gießstrahl: wabert, glüht weißgelb
      ctx.lineCap = 'round';
      for (const [wd, col] of [[5, 'rgba(255,120,30,0.5)'], [2.4, 'rgba(255,210,110,0.95)'], [1, '#fffbe0']]) {
        ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(sx0, sy0);
        for (let k = 1; k <= 6; k++) { const u = k / 6; ctx.lineTo(sx0 + (lx - sx0) * u + Math.sin(frame * 0.4 + k * 1.7) * 0.8 * u, sy0 + (ly - 6 - sy0) * u); }
        ctx.stroke();
      }
      g = ctx.createRadialGradient(lx, ly - 6, 0, lx, ly - 6, 26); g.addColorStop(0, 'rgba(255,220,140,0.8)'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.fillRect(lx - 26, ly - 32, 52, 52);
      for (const s of st.sparks) { const [sx, sy] = P3(v, s.x, s.y, s.z), [qx, qy] = P3(v, s.x - s.vx * 2, s.y - s.vy * 2, s.z - s.vz * 2); ctx.strokeStyle = s.t < s.life * 0.5 ? '#fff0b0' : '#ff9a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(qx, qy); ctx.stroke(); }
      ctx.restore();
      glows.push([fx, fy, fl]);
    }
  }
  // Schwungrad mit Dampfmaschine (Kurbel, Pleuel, Kreuzkopf, Kolbenstange), Riemen zur Transmission, Riemenscheiben, Drehbankriemen
  function drawMachines(ctx, v, frame) {
    const w = View.w, a = st.fly;
    const belt = (c1, r1, c2, r2, t, wd = 2) => { // offener Riemen zwischen zwei Scheiben, Laufmarken wandern mit
      const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy); if (d < Math.abs(r1 - r2) + 1) return;
      const th = Math.atan2(dy, dx), al = Math.acos((r1 - r2) / d);
      for (const s of [1, -1]) {
        const p1 = [c1[0] + r1 * Math.cos(th + s * al), c1[1] + r1 * Math.sin(th + s * al)], p2 = [c2[0] + r2 * Math.cos(th + s * al), c2[1] + r2 * Math.sin(th + s * al)];
        ctx.strokeStyle = '#1c140e'; ctx.lineWidth = wd + 1; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
        ctx.strokeStyle = '#5c4430'; ctx.lineWidth = Math.max(1, wd - 1); ctx.stroke();
        const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.floor(L / 9); ctx.fillStyle = '#9c7c5c';
        for (let k = 0; k < n; k++) { const u = (((k * 9 + s * t) % L) + L) % L / L; ctx.fillRect(Math.round(p1[0] + (p2[0] - p1[0]) * u), Math.round(p1[1] + (p2[1] - p1[1]) * u), 1, 1); }
      }
    };
    const pulley = (c, r, ang) => { // Riemenscheibe mit Speichen
      ctx.fillStyle = '#2a2c36'; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8890a4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c[0], c[1], r - 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#5c6070'; for (let k = 0; k < 4; k++) { const b = ang + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(b) * (r - 1), c[1] + Math.sin(b) * (r - 1)); ctx.stroke(); }
      ctx.fillStyle = '#c8a050'; ctx.fillRect(Math.round(c[0]) - 1, Math.round(c[1]) - 1, 2, 2);
    };
    const kz = 200 / LSZ, run = frame * 0.9;
    for (let b = Math.floor((v.x - w * LSZ / 400 - 300) / BAY); b <= Math.floor((v.x + w * LSZ / 400 + 300) / BAY); b++) { // Drehbänke an der Welle
      const mx = b * BAY + 64; if (Math.abs(mx - FW.x) < 300 || Math.abs(mx - FD.x) < 260 || Math.abs(mx - PLATE.x) < 320) continue;
      const top = P3(v, mx, LSY - 2, LSZ), bot = P3(v, mx, 44, LSZ - 16), r1 = 15 * kz, r2 = 8 * kz;
      if (top[0] < -40 || top[0] > w + 40) continue;
      belt(top, r1, bot, r2, run, 2); pulley(top, r1, a * 3.2 + b); pulley(bot, r2, a * 6 + b);
    }
    const [cx, cy] = P3(v, FW.x, FW.y, FW.z), R = FW.r * 200 / FW.z;
    if (cx < -R - 300 || cx > w + R + 200) return;
    const ls = P3(v, FW.x + 230, LSY - 2, LSZ), rs = 26 * kz;
    belt([cx, cy], R - 2, ls, rs, run * 1.4, 4); pulley(ls, rs, -a * 4.1);
    const I = wheel(), k = 0.5; // Rad (vorgerendert, gedreht)
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(cx, cy); ctx.rotate(a); ctx.drawImage(I.c, -I.s * k, -I.s * k, I.s * 2 * k, I.s * 2 * k); ctx.restore();
    // Kurbel vor dem Rad, Pleuel zum Kreuzkopf, Kolbenstange in den Zylinder
    const zc = FW.z - 22, rc = 40, Lr = 150, pin = [FW.x + Math.cos(-a + Math.PI) * rc, FW.y + Math.sin(-a + Math.PI) * rc], xh = pin[0] - Math.sqrt(Lr * Lr - (pin[1] - FW.y) ** 2);
    const P = (X, Y) => P3(v, X, Y, zc), hub = P(FW.x, FW.y), pp = P(pin[0], pin[1]), ch = P(xh, FW.y), cyl = P(ENG.x1, FW.y);
    const rod = (p, q, wd, col, hi) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); if (hi) { ctx.strokeStyle = hi; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1] - wd / 3); ctx.lineTo(q[0], q[1] - wd / 3); ctx.stroke(); } };
    rod(hub, pp, 9 * 200 / zc, '#3c2a20', '#7c5a40'); // Kurbelwange
    ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6c5020'; ctx.fillRect(Math.round(hub[0]) - 1, Math.round(hub[1]) - 1, 2, 2);
    rod(cyl, ch, 2.6, '#9ca4b8', '#e8ecf4'); rod(ch, pp, 5, '#4c505e', '#a8b0c4');
    ctx.fillStyle = '#c89a40'; ctx.fillRect(Math.round(ch[0]) - 4, Math.round(ch[1]) - 3, 8, 6); ctx.fillStyle = '#f0d080'; ctx.fillRect(Math.round(ch[0]) - 4, Math.round(ch[1]) - 3, 8, 1);
    ctx.fillStyle = '#d8b060'; ctx.beginPath(); ctx.arc(pp[0], pp[1], 2.4, 0, Math.PI * 2); ctx.fill();
    const gv = P3(v, (ENG.x0 + ENG.x1) / 2, FW.y + 52, ENG.z - 4), ga = frame * 0.2; // Fliehkraftregler auf dem Schieberkasten
    ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gv[0], gv[1]); ctx.lineTo(gv[0], gv[1] - 10); ctx.stroke();
    for (const s of [0, Math.PI]) { const bx = gv[0] + Math.cos(ga + s) * 6, by = gv[1] - 6; ctx.beginPath(); ctx.moveTo(gv[0], gv[1] - 10); ctx.lineTo(bx, by); ctx.stroke(); ctx.fillStyle = '#f0c860'; ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, Math.PI * 2); ctx.fill(); }
  }
  // Montageband: halbfertige Automaten hängen an Laufkatzen und ziehen langsam durch die Halle, pendeln dabei leicht
  function drawLine(ctx, v, frame) {
    const w = View.w, imgs = hangSprites(), k = 200 / RZ, SP = 104, speed = 0.32, span = w * RZ / 400 + 80;
    const off = (frame * speed) % SP;
    for (let n = Math.floor((v.x - span - off) / SP); n <= Math.floor((v.x + span - off) / SP); n++) {
      const X = n * SP + off, [sx, sy] = P3(v, X, RY - 2, RZ); if (sx < -30 || sx > w + 30) continue;
      const id = ((n % 4) + 4) % 4, I = imgs[id], sw = Math.sin(frame * 0.035 + n * 1.3) * 0.07;
      ctx.fillStyle = '#16161e'; ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - 2, 6, 3); ctx.fillStyle = '#5c6070'; ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - 2, 6, 1); // Laufkatze
      ctx.fillStyle = '#2c2c34'; ctx.fillRect(Math.round(sx), Math.round(sy) + 1, 1, Math.round(6 * k));
      ctx.save(); ctx.translate(sx, sy + 6 * k); ctx.rotate(sw); ctx.drawImage(I.c, -I.ax, -I.ay); ctx.restore();
      if (id === 2 && (frame + n * 13) % 90 < 4) { ctx.fillStyle = '#fff4c0'; ctx.fillRect(Math.round(sx) + 3, Math.round(sy + 18 * k), 1, 1); } // Schweißfunke am Gerippe
    }
  }

  // ---------------- Licht vor der Spielebene (nach FX.render, über allem) ----------------
  // schräge Bahnen kalten Gewitterlichts aus den Sheds – im Blitz gleißend –, rechts der Glutschein der Gießerei
  function drawRays(ctx, cam, frame) {
    const w = View.w, room = W.room, floor = (room.h - 2) * T - cam.y, k = stormK(frame), SL = 0.36, SP = 300;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let n = Math.floor((cam.x - 200) / SP); n <= Math.floor((cam.x + w + 120 + SL * room.h * T) / SP); n++) {
      const xf = n * SP + 60 - cam.x, yTop = Math.max(0, -cam.y), yBot = Math.min(208, floor + 6); if (yBot <= yTop) continue;
      const a = (0.06 + 0.05 * hn(n, 1, 9)) * k, g = ctx.createLinearGradient(0, yTop, 0, yBot);
      g.addColorStop(0, `rgba(170,190,255,${a.toFixed(3)})`); g.addColorStop(1, `rgba(150,170,240,${(a * 0.35).toFixed(3)})`); ctx.fillStyle = g;
      for (const [o, wd] of [[0, 14], [18, 14], [36, 10]]) {
        const xa = xf + o + SL * (floor - yTop), xb = xf + o + SL * (floor - yBot); if (Math.max(xa, xb) + wd < 0 || Math.min(xa, xb) > w) continue;
        ctx.beginPath(); ctx.moveTo(xa, yTop); ctx.lineTo(xa + wd, yTop); ctx.lineTo(xb + wd, yBot); ctx.lineTo(xb, yBot); ctx.closePath(); ctx.fill();
      }
    }
    const fx = room.w * T - 220 - cam.x; // Gießerei: Glut von rechts unten
    if (fx < w + 260) {
      const fl = 0.8 + 0.2 * Math.sin(frame * 0.33) * Math.sin(frame * 0.07 + 1), gy = floor - 20, g = ctx.createRadialGradient(fx + 120, gy, 10, fx + 120, gy, 260);
      g.addColorStop(0, `rgba(255,120,40,${(0.2 * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(200,60,20,0)'); ctx.fillStyle = g; ctx.fillRect(fx - 140, gy - 260, 520, 300);
    }
    ctx.restore();
  }
  // Vordergrund (Parallaxe 1.3): Kranträger oben, Ketten mit Lasthaken, ein Rohrstrang mit Flanschen
  function front(x) {
    const d = '#06050a', rim = '#2c2a3c', warm = '#4c2410';
    px(x, d, 0, 0, 640, 7); px(x, rim, 0, 7, 640, 1); for (let X = 4; X < 640; X += 16) px(x, '#1c1a26', X, 3, 2, 2);
    for (let X = 0; X < 640; X += 12) for (let k = 0; k < 6; k++) { px(x, d, X + k, 7 + k, 2, 1); px(x, d, X + 12 - k, 7 + k, 2, 1); }
    px(x, d, 0, 13, 640, 2);
    for (const [cx, len] of [[96, 46], [330, 70], [534, 34]]) {
      for (let y = 15; y < 15 + len; y += 4) { px(x, d, cx - 1, y, 3, 3); px(x, rim, cx - 1, y, 1, 2); px(x, d, cx, y + 3, 1, 1); }
      const y = 15 + len; px(x, d, cx - 1, y, 3, 4); for (let a = 0; a < 9; a++) px(x, d, cx + Math.round(Math.cos(a * 0.45) * 5) - 1, y + 4 + Math.round(Math.sin(a * 0.45) * 5), 2, 2); px(x, warm, cx - 6, y + 8, 2, 1);
    }
    px(x, d, 180, 18, 120, 6); px(x, rim, 180, 18, 120, 1); for (const X of [180, 236, 296]) { px(x, d, X, 16, 4, 10); px(x, rim, X, 16, 1, 10); }
    px(x, d, 296, 24, 6, 40); px(x, rim, 296, 24, 1, 40); px(x, d, 292, 62, 14, 4);
  }
  // Wandlampe statt Kerze: Gusseisen-Ausleger, Drahtkorb mit Glaskolben, Gasflamme (Kerzen-Hitbox 12×20)
  function drawLamp(ctx, x, y, t) {
    px(ctx, '#14141c', x, y + 9, 4, 2); px(ctx, '#3c3e4c', x, y + 9, 4, 1); px(ctx, '#14141c', x + 1, y + 11, 1, 5); px(ctx, '#14141c', x, y + 15, 3, 2); // Ausleger und Wandplatte
    px(ctx, '#2a2a34', x + 4, y + 2, 7, 2); px(ctx, '#c8a050', x + 4, y + 2, 7, 1);                                                                 // Kappe
    const fl = 0.8 + 0.2 * Math.sin(t * 0.37) * Math.sin(t * 0.11);
    ctx.fillStyle = `rgba(255,214,140,${(0.7 * fl).toFixed(2)})`; ctx.fillRect(x + 5, y + 4, 5, 7);
    px(ctx, '#fffbe8', x + 7, y + 6, 1, 3); px(ctx, '#ffd070', x + 6, y + 8, 3, 2);
    px(ctx, '#20202a', x + 4, y + 4, 1, 7); px(ctx, '#20202a', x + 10, y + 4, 1, 7); px(ctx, '#20202a', x + 7, y + 4, 1, 1); px(ctx, '#20202a', x + 4, y + 7, 7, 1); // Drahtkorb
    px(ctx, '#2a2a34', x + 5, y + 11, 5, 2); px(ctx, '#c8a050', x + 6, y + 13, 3, 1);
  }
  const make = (d) => d.type === 'belt' ? new WerkBelt(d) : d.type === 'press' ? new WerkPress(d) : d.type === 'vent' ? new WerkVent(d) : d.type === 'hatch' ? new WerkHatch(d) : new WerkHall(d);
  const stats = () => ({ far: bufs.far ? bufs.far.np : 0, near: bufs.near ? bufs.near.np : 0 });
  return { tile, prewarm, drawHall, drawRays, front, drawLamp, make, puff, stats, buildSprites, get SPR() { buildSprites(); return SPR; }, get glows() { return glows; }, get lamps() { return lampScr; }, SW, SH };
})();

// ---------------- Förderband ----------------
// Bandoberfläche auf der Bodenreihe row (x0 … x1): trägt Held, Gegner und Beute mit v px/Bild. Leder mit Querleisten (laufen
// sichtbar), seitlich ein genietetes Wangenblech mit drehenden Rollen und Pfeilen in Laufrichtung, an den Enden Trommeln.
class WerkBelt extends Ent {
  constructor(d) { super(d.x0 * T, d.row * T - 2, (d.x1 - d.x0 + 1) * T, 4); this.kind = 'prop'; this.row = d.row; this.v = d.v; this.ph = 0; }
  update() {
    this.t++; this.ph += this.v;
    const top = this.row * T, x0 = this.x, x1 = this.x + this.w, p = W.player;
    const on = (e) => e.onGround && Math.abs(e.y + e.h - top) < 1 && e.x + e.w > x0 + 2 && e.x < x1 - 2;
    if (p.alive && (p.state === 'normal' || p.state === 'hurt') && !p.plat && on(p)) Phys.moveX(p, this.v);
    for (const e of W.ents) if ((e.kind === 'enemy' || (e.kind === 'item' && e.landed)) && !e.dead && (e.kind === 'item' ? Math.abs(e.y + e.h - top) < 2 && e.cx > x0 && e.cx < x1 : on(e))) Phys.moveX(e, this.v);
  }
  draw(ctx) {
    const X0 = Math.round(this.x - W.cam.x), X1 = X0 + this.w, Y = this.row * T - Math.round(W.cam.y);
    if (X1 < -8 || X0 > View.w + 8 || Y < -20 || Y > 230) return;
    const VX = View.w / 2, VY = 60, K = 0.1, ph = ((this.ph % 8) + 8) % 8;
    if (Y > VY && !View.lite3d) { // Lauffläche in der Tiefe (wie die Oberseiten der 3D-Kacheln)
      const bx0 = X0 + (VX - X0) * K, bx1 = X1 + (VX - X1) * K, by = Y + (VY - Y) * K;
      ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(X1, Y); ctx.lineTo(bx1, by); ctx.lineTo(bx0, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4c382a';
      for (let sx = X0 - 8 + ph; sx < X1; sx += 8) { if (sx < X0) continue; const bx = sx + (VX - sx) * K; ctx.beginPath(); ctx.moveTo(sx, Y); ctx.lineTo(sx + 2, Y); ctx.lineTo(bx + 2, by); ctx.lineTo(bx, by); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(X0, Y, this.w, 1);
    }
    ctx.fillStyle = '#1a120c'; ctx.fillRect(X0, Y, this.w, 4); // Bandkante vorn
    ctx.fillStyle = '#5c4434'; for (let sx = X0 - 8 + ph; sx < X1; sx += 8) if (sx >= X0) ctx.fillRect(Math.round(sx), Y, 2, 3);
    ctx.fillStyle = '#7c6048'; ctx.fillRect(X0, Y, this.w, 1);
    ctx.fillStyle = '#2c2e3a'; ctx.fillRect(X0, Y + 4, this.w, 9); ctx.fillStyle = '#4c5062'; ctx.fillRect(X0, Y + 4, this.w, 1); ctx.fillStyle = '#121218'; ctx.fillRect(X0, Y + 12, this.w, 1); // Wangenblech
    const ang = this.ph / 4;
    for (let x = X0 + 8; x < X1; x += 16) { // Rollen
      ctx.fillStyle = '#16161e'; ctx.fillRect(x - 3, Y + 5, 7, 7); ctx.fillStyle = '#6c7084'; ctx.fillRect(x - 2, Y + 6, 5, 5);
      ctx.fillStyle = '#1c1c26'; const c = Math.cos(ang), s = Math.sin(ang); ctx.fillRect(Math.round(x + c * 2), Math.round(Y + 8 + s * 2), 1, 1); ctx.fillRect(Math.round(x - c * 2), Math.round(Y + 8 - s * 2), 1, 1);
      ctx.fillStyle = '#d8b868'; ctx.fillRect(x, Y + 8, 1, 1);
    }
    const dir = Math.sign(this.v); ctx.fillStyle = '#c8a040'; // Laufrichtung (Messingpfeile auf dem Blech)
    for (let x = X0 + 16; x < X1 - 8; x += 32) for (let k = 0; k < 3; k++) { ctx.fillRect(x + dir * k, Y + 7 + k, 1, 1); ctx.fillRect(x + dir * k, Y + 9 - k, 1, 1); }
    for (const ex of [X0, X1]) { ctx.fillStyle = '#16161e'; ctx.fillRect(ex - 3, Y - 1, 6, 14); ctx.fillStyle = '#7c8094'; ctx.fillRect(ex - 2, Y, 4, 12); ctx.fillStyle = '#c8a040'; ctx.fillRect(ex - 1, Y + 5, 2, 2); } // Trommeln
  }
}

// ---------------- Dampfhammer (Presse) ----------------
// Ein Stempel (3 Kacheln breit) zwischen zwei Gusseisenständern, darüber Zylinder und Haupt mit Warnlampe. Takt: oben warten,
// dann zischt Dampf aus dem Zylinder, die Lampe blinkt rot und der Stempel hebt sich ein Stück – dann schlägt er herab (Schaden
// und Rückstoß), bleibt kurz unten und fährt langsam wieder hoch. Gegner unter dem Stempel werden zerquetscht. PS2-3D in
// Kachelperspektive (PS2.drawLocal), neu gerastert nur bei Bewegung.
class WerkPress extends Ent {
  constructor(d) {
    super(d.x * T, d.row * T - 14, 48, 14); this.kind = 'prop'; this.row = d.row; this.per = d.period || 140; this.ph = d.phase || 0; this.rise = (d.rise || 5) * T;
    this.lift = 1; this.buf = {}; this.slam = 0; this.state = 'up';
  }
  phase() { return (W.frame + this.ph) % this.per; }
  update() {
    this.t++;
    const t = this.phase(), P = this.per, tw = P - 96, near = Math.abs(W.player.cx - this.cx) < View.w * 0.75, prev = this.lift;
    // Takt: 0 … tw oben, tw … tw+40 Zischen (hebt sich), dann 6 Bilder Schlag, 16 unten, 34 zurück
    if (t < tw) { this.state = 'up'; this.lift = 1; }
    else if (t < tw + 40) { this.state = 'hiss'; const k = (t - tw) / 40; this.lift = 1 + 0.09 * Math.sin(k * Math.PI / 2); if (t === tw && near) Audio8.sfx('hiss', this.cx); if (t % 3 === 0 && this.onScreen(40)) this.steam(); }
    else if (t < tw + 46) { this.state = 'slam'; const k = (t - tw - 40 + 1) / 6; this.lift = 1.09 * (1 - k * k); }
    else if (t < tw + 62) { this.state = 'down'; this.lift = 0; }
    else { this.state = 'back'; const k = (t - tw - 62) / 34; this.lift = 1 - (1 - k) * (1 - k); }
    if (this.lift === 0 && prev > 0) this.impact(near);
    this.y = this.row * T - 14 - this.lift * this.rise;
    if (this.lift < 0.95 && this.state !== 'hiss') this.crush();
  }
  ramBox() { return { x: this.x + 1, y: this.y, w: this.w - 2, h: 14 }; }
  crush() {
    const b = this.ramBox(), p = W.player;
    if (p.alive && Phys.overlap(b, p) && p.inv <= 0) {
      p.hurt(3, this.cx);
      if (p.inv > 0 && p.state === 'hurt') { p.vx = Math.sign(p.cx - this.cx || 1) * 2.6; p.vy = -2.6; W.shake = Math.max(W.shake, 6); Input.rumble(0.7, 0.6, 250); }
    }
    for (const e of W.ents) if (e.kind === 'enemy' && !e.dead && Phys.overlap(b, e)) e.hit(99, 'press' + this.ph + ':' + this.slam);
  }
  impact(near) {
    this.slam++;
    if (!this.onScreen(48)) return;
    const fy = this.row * T;
    W.shake = Math.max(W.shake, near ? 5 : 2); if (near) { Audio8.sfx('wall', this.cx); Audio8.sfx('clank', this.cx); Input.rumble(0.35, 0.4, 140); }
    W.sparks(this.x + 4, fy - 2, 5); W.sparks(this.x + this.w - 4, fy - 2, 5); W.dust(this.cx - 18, fy, 3); W.dust(this.cx + 18, fy, 3);
  }
  steam() { for (const s of [-1, 1]) W.spawn(new WerkPuff(this.cx + s * 13, this.row * T - this.rise - 44, s * (0.5 + Math.random() * 0.6), -0.3 - Math.random() * 0.4, 5)); }
  lightUp(L, cx, cy) {
    if (this.state === 'hiss' && (this.t & 4)) L.push({ x: this.cx - cx, y: this.row * T - this.rise - 70 - cy, r: 26, c: [255, 40, 30], a: 0.6 });
    if (this.state === 'down' || this.state === 'slam') L.push({ x: this.cx - cx, y: this.row * T - 8 - cy, r: 30, c: [255, 170, 80], a: 0.35 });
  }
  frameMesh(lampOn) { // Ständer (grün lackiert, Goldlinien), Haupt mit Messingschild und Warnlampe, Dampfzylinder mit Messingbändern
    const { mesh, box, prism, cone } = PS2, m = mesh(), G = [36, 70, 58], G2 = [26, 50, 42], BR = [222, 176, 78], top = this.rise + 14, lamp = lampOn ? [255, 70, 40] : [110, 24, 20];
    for (const s of [-1, 1]) {
      box(m, s * 33, 0, 12, 10, top + 46, 12, G, { top: G2 }); box(m, s * 33, 0, 12, 18, 7, 18, G2, { top: [70, 76, 92] });
      box(m, s * 33 - s * 5.2, 8, 6, 0.6, top + 30, 0.6, BR); box(m, s * 33, top + 28, 5.5, 13, 4, 1, BR);
    }
    box(m, 0, top + 40, 8, 88, 22, 26, G, { top: G2 }); box(m, 0, top + 44, -5.2, 40, 9, 1, BR); box(m, 0, top + 41, -5.4, 86, 1.2, 1, BR);
    prism(m, 0, top + 4, 8, 12, 36, 8, [150, 86, 50]); for (const yy of [top + 6, top + 20, top + 34]) prism(m, 0, yy, 8, 13, 3, 8, BR);
    prism(m, 15, top + 30, 2, 3, 16, 6, [120, 120, 130]); prism(m, 15, top + 44, 2, 4, 2, 6, [180, 40, 40]); // Ventil mit Handrad
    cone(m, 0, top + 63, 0, 3.6, 3.5, 6, lamp, { e: lampOn ? 1 : 0 }); cone(m, 0, top + 63, 0, 3.6, -2.5, 6, lamp, { e: lampOn ? 1 : 0 }); box(m, 0, top + 61, 0, 6, 1.5, 6, BR);
    return [m];
  }
  ramMesh() { // Kolbenstange und Stempel: schwerer Eisenblock mit Messingkante und Schlagplatte
    const { mesh, box, prism } = PS2, m = mesh(), top = this.rise + 14, rb = this.lift * this.rise;
    prism(m, 0, rb + 14, 8, 3.4, top + 4 - rb - 14, 6, [200, 206, 220], { cap: false });
    box(m, 0, rb + 3, 6, 50, 12, 26, [56, 60, 74], { top: [66, 70, 86] }); box(m, 0, rb + 10.5, -7.4, 50, 2.2, 0.8, [222, 176, 78]);
    box(m, 0, rb, 6, 46, 3, 22, [150, 156, 170]); box(m, 0, rb + 4, -7.6, 14, 4, 0.6, [222, 176, 78]); for (const s of [-1, 1]) box(m, s * 19, rb + 6, -7.6, 2, 2, 0.6, [250, 220, 140]);
    return [m];
  }
  draw(ctx) {
    const sx = this.cx - W.cam.x, sy = this.row * T - W.cam.y, top = this.rise + 14;
    if (sx < -80 || sx > View.w + 80) return;
    if (this.state !== 'up') { // Schatten auf dem Band: wird dunkler, je tiefer der Stempel
      const k = 1 - Math.min(1, this.lift); ctx.fillStyle = `rgba(0,0,0,${(0.2 + 0.4 * k).toFixed(2)})`; ctx.fillRect(Math.round(sx - 22 + 6 * (1 - k)), Math.round(sy - 2), Math.round(44 - 12 * (1 - k)), 3);
    }
    const lampOn = this.state === 'hiss' && (this.t & 4) > 0;
    PS2.drawLocal(ctx, this.fbuf || (this.fbuf = {}), () => this.frameMesh(lampOn), sx, sy, [-62, -top - 80, 124, top + 92], lampOn ? 1 : 0, PS2.LENV);
  }
  drawFront(ctx) { // Stempel vor dem Helden: er zerquetscht ihn sichtbar
    const sx = this.cx - W.cam.x, sy = this.row * T - W.cam.y, top = this.rise + 14;
    if (sx < -80 || sx > View.w + 80) return;
    PS2.drawLocal(ctx, this.buf, () => this.ramMesh(), sx, sy, [-40, -top - 12, 80, top + 18], String(Math.round(this.lift * this.rise)), PS2.LENV);
    if (this.state === 'down' && this.phase() % 4 < 2) { ctx.fillStyle = 'rgba(255,220,150,0.6)'; ctx.fillRect(Math.round(sx - 23), Math.round(sy - 1), 46, 1); }
  }
}
class WerkPuff extends Ent { // kleine Dampfwolke (Pressen, Düsen)
  constructor(x, y, vx, vy, r) { super(x, y, 1, 1); this.vx = vx; this.vy = vy; this.r = r; this.life = 40 + Math.random() * 20; this.kind = 'fx'; }
  update() { this.t++; this.x += this.vx; this.y += this.vy; this.vx *= 0.96; this.vy -= 0.01; this.r += 0.25; if (this.t > this.life) this.dead = true; }
  draw(ctx) { const r = this.r, I = Werk.puff(r); ctx.globalAlpha = 0.6 * (1 - this.t / this.life); ctx.drawImage(I, Math.round(this.x - W.cam.x - r), Math.round(this.y - W.cam.y - r)); ctx.globalAlpha = 1; }
}

// ---------------- Dampfdüse ----------------
// Gitterrost im Boden (2 Kacheln). Im Takt: erst spuckt sie (Vorwarnung), dann steht eine Dampfsäule h Kacheln hoch – wer darin
// steht, wird hinaufgetragen (wie ein Aufzug, mit gehaltenem Sprung schneller).
class WerkVent extends Ent {
  constructor(d) { super(d.x * T, d.row * T - d.h * T, 2 * T, d.h * T); this.kind = 'prop'; this.row = d.row; this.per = d.period || 230; this.ph = d.phase || 0; this.blast = d.blast || 110; this.ps = []; this.state = 'idle'; }
  update() {
    this.t++;
    const t = (W.frame + this.ph) % this.per, tb = this.per - this.blast, near = this.onScreen(80), fy = this.row * T;
    this.state = t < tb - 34 ? 'idle' : t < tb ? 'pre' : 'blast';
    if (t === tb - 34 && near) Audio8.sfx('rise', this.cx);
    if (t === tb && near) Audio8.sfx('hiss', this.cx);
    if (near) {
      if (this.state === 'blast') for (let i = 0; i < (View.lite ? 1 : 2); i++) this.ps.push({ x: this.cx + (Math.random() - 0.5) * 20, y: fy - 2, vy: -3.2 - Math.random() * 1.6, r: 5, t: 0, life: Math.round(this.h / 4.2) });
      else if (this.state === 'pre' && t % 5 === 0) this.ps.push({ x: this.cx + (Math.random() - 0.5) * 16, y: fy - 2, vy: -1.4 - Math.random(), r: 3, t: 0, life: 18 });
      else if (t % 23 === 0) this.ps.push({ x: this.cx + (Math.random() - 0.5) * 14, y: fy - 2, vy: -0.5, r: 2, t: 0, life: 36 });
    }
    for (const q of this.ps) { q.t++; q.y += q.vy; q.x += Math.sin((q.t + q.r) * 0.3) * 0.4; q.r += this.state === 'blast' ? 0.5 : 0.2; }
    this.ps = this.ps.filter(q => q.t < q.life);
    const p = W.player;
    if (this.state === 'blast' && p.alive && (p.state === 'normal' || p.state === 'hurt') && p.x + p.w > this.x + 2 && p.x < this.x + this.w - 2 && p.feet > this.y + 4 && p.feet <= fy + 1) {
      const k = Math.min(1, (p.feet - this.y) / 36); // Aufwind: trägt mit bis zu 2,4 px/Bild, oben schwebt man und kann seitlich auf den Steg
      Phys.moveY(p, -2.4 * k); p.vy = Math.min(p.vy, -0.25); p.onGround = false; p.coyote = 0; p.canDouble = true;
      if (this.t % 9 === 0) W.spawn(new Particle(p.cx + rnd(-6, 6), p.feet, rnd(-0.4, 0.4), -1.5, '#e8ecf4', 16, 1, 0));
    }
  }
  lightUp() {}
  draw(ctx) {
    const X = Math.round(this.x - W.cam.x), Y = this.row * T - Math.round(W.cam.y);
    if (X > View.w + 40 || X + this.w < -40) return;
    const VX = View.w / 2, VY = 60, K = 0.1;
    if (Y > VY) { const bx0 = X + (VX - X) * K, bx1 = X + 32 + (VX - X - 32) * K, by = Y + (VY - Y) * K; ctx.fillStyle = '#0c0c12'; ctx.beginPath(); ctx.moveTo(X + 1, Y); ctx.lineTo(X + 31, Y); ctx.lineTo(bx1 - 1, by); ctx.lineTo(bx0 + 1, by); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#0c0c12'; ctx.fillRect(X, Y, 32, 5); ctx.fillStyle = '#c8a040'; ctx.fillRect(X, Y, 32, 1); ctx.fillRect(X, Y, 1, 5); ctx.fillRect(X + 31, Y, 1, 5); // Messingrahmen
    ctx.fillStyle = '#4c5062'; for (let x = X + 3; x < X + 30; x += 4) ctx.fillRect(x, Y + 1, 2, 4); // Rost
    if (this.state !== 'idle') { ctx.fillStyle = this.state === 'blast' ? 'rgba(255,255,255,0.5)' : 'rgba(255,200,160,0.35)'; ctx.fillRect(X + 2, Y + 1, 28, 2); }
    for (const q of this.ps) { const r = q.r, I = Werk.puff(r); ctx.globalAlpha = (this.state === 'blast' ? 0.62 : 0.45) * (1 - q.t / q.life); ctx.drawImage(I, Math.round(q.x - W.cam.x - r), Math.round(q.y - W.cam.y - r)); }
    ctx.globalAlpha = 1;
    if (this.state === 'blast') { const g = ctx.createLinearGradient(0, Y - this.h, 0, Y); g.addColorStop(0, 'rgba(230,236,255,0)'); g.addColorStop(1, 'rgba(230,236,255,0.22)'); ctx.fillStyle = g; ctx.fillRect(X + 6, Y - this.h, 20, this.h); }
  }
}

// ---------------- Kettenzug am Montageband ----------------
// Eine Laufkatze unter einem Doppel-T-Träger (Kachelreihe top) senkt in Abständen einen neuen Automaten an der Kette herab
// (solange der Held in der Nähe ist und höchstens max Automaten unterwegs sind); danach fährt der leere Haken wieder hoch.
class WerkHatch extends Ent {
  constructor(d) { super(d.x * T - 8, d.top * T, 32, 16); this.kind = 'prop'; this.tx = d.x; this.top = d.top; this.row = d.row; this.max = d.max || 2; this.every = d.every || 260; this.cd = 90; this.cur = null; this.hook = d.top * T + 20; }
  update() {
    this.t++;
    const p = W.player, near = Math.abs(p.cx - this.cx) < 15 * T && p.alive;
    if (this.cur && (this.cur.dead || this.cur.st !== 'drop')) { this.cur = null; this.cd = this.every; Audio8.sfx('chain', this.cx); }
    if (this.cur) this.hook = this.cur.y - 6;
    else {
      this.hook = Math.max(this.top * T + 20, this.hook - 2.2);
      this.kids = (this.kids || []).filter(e => !e.dead);
      if (near && --this.cd <= 0 && this.kids.length < this.max) {
        this.cur = W.spawn(new Automat(this.tx, this.row, { drop: this.top * T + 24 })); this.kids.push(this.cur); Audio8.sfx('chain', this.cx);
      }
    }
  }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.top * T - W.cam.y), hy = Math.round(this.hook - W.cam.y);
    if (x < -120 || x > View.w + 120) return;
    ctx.fillStyle = '#16161e'; ctx.fillRect(x - 72, y, 144, 8); ctx.fillStyle = '#4c5062'; ctx.fillRect(x - 72, y, 144, 1); ctx.fillRect(x - 72, y + 7, 144, 1); // Träger
    ctx.fillStyle = '#26262e'; for (let k = -72; k < 72; k += 12) ctx.fillRect(x + k, y + 2, 2, 4);
    ctx.fillStyle = '#20222c'; ctx.fillRect(x - 9, y + 8, 18, 10); ctx.fillStyle = '#5c6070'; ctx.fillRect(x - 9, y + 8, 18, 1); // Laufkatze mit Kettentrommel
    const a = this.t * 0.2; ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 6, y + 11, 12, 4); ctx.fillStyle = '#6c5020'; ctx.fillRect(x - 6 + Math.round((Math.sin(a) + 1) * 5), y + 11, 1, 4);
    for (let yy = y + 18; yy < hy; yy += 3) { ctx.fillStyle = (yy >> 1) & 1 ? '#3c3e4c' : '#7c8094'; ctx.fillRect(x - ((yy / 3) & 1), yy, 2, 2); } // Kette
    ctx.fillStyle = '#7c8094'; ctx.fillRect(x - 1, hy, 3, 4); ctx.fillRect(x - 3, hy + 3, 2, 3); ctx.fillRect(x + 2, hy + 3, 2, 3); // Haken
  }
}

// ---------------- Hallensteuerung: Maschinentakt, Glut der Gießerei ----------------
class WerkHall extends Ent {
  constructor() { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; }
  update() {
    this.t++;
    if (this.t % 64 === 0 && Math.random() < 0.6) Audio8.sfx('cog'); // Uhrwerke in der Halle
  }
  lightUp(L, cx, cy, flick) { // Gaslampen unter den Bögen und Glut des Kupolofens (Bildkoordinaten aus dem Hintergrund)
    for (const [x, y] of Werk.lamps) L.push({ x, y: y + 6, r: 34 + flick(x), c: [255, 190, 110], a: 0.28 });
    for (const [x, y, fl] of Werk.glows) L.push({ x, y: Math.min(200, y + 30), r: 90 + fl * 20, c: [255, 120, 40], a: 0.4 * fl });
    const fx = W.room.w * T - 100 - W.cam.x;
    if (fx < View.w + 100) L.push({ x: fx, y: (W.room.h - 3) * T - W.cam.y, r: 120, c: [255, 110, 40], a: 0.3 });
  }
}

// ---------------- Der Automat ----------------
// Aufziehsoldat aus der Fabrik: steht still und dunkel am Band, bis man ihm zu nahe kommt – dann glimmen die Augen auf, das
// Uhrwerk rastet ein, und er stakst ruckartig heran (Schub, Pause, Schub). Vor dem Helden reißt er den Säbelarm hoch (Glanz
// auf der Klinge) und stößt nach vorn; danach steht er kurz still – die Gelegenheit. Neue Automaten kommen am Kettenzug herab
// und fahren reglos auf dem Montageband, bis sie vom Ende fallen. Pressen zerquetschen sie.
class Automat extends Enemy {
  constructor(tx, ty, o = {}) {
    super(tx * T + 2, (ty + 1) * T - 30, 12, 30, 5, 2, 600);
    this.st = o.drop !== undefined ? 'drop' : o.awake ? 'walk' : 'sleep'; this.timer = Math.floor(rnd(0, 20)); this.face = o.face || -1; this.eye = o.awake ? 1 : 0;
    if (this.st === 'drop') this.y = o.drop; this.step = 0; this.knockT = 0; this.wasGround = false; this.fallY = 0; this.expMul = 1.2;
  }
  update() {
    super.update();
    const p = W.player, dx = p.cx - this.cx, dy = p.feet - (this.y + this.h);
    this.timer++;
    if (this.st === 'drop') { this.vx = 0; const r = Phys.moveY(this, 0.9); if (r === 1) { this.st = 'sleep'; this.onGround = true; Audio8.sfx('clank', this.cx); W.dust(this.cx, this.y + this.h, 3); } return; }
    if (this.st === 'sleep') {
      this.vx = 0;
      if ((Math.abs(dx) < 76 && Math.abs(dy) < 40 && p.alive && this.onScreen(0)) || this.landed) this.boot();
    } else if (this.st === 'boot') {
      this.vx = 0; this.eye = Math.min(1, this.timer / 26) * (this.timer % 6 < 4 ? 1 : 0.3);
      if (this.timer > 30) { this.st = 'walk'; this.timer = 0; this.eye = 1; }
    } else if (this.knockT > 0) { this.knockT--; this.vx *= 0.85; }
    else if (this.st === 'walk') {
      const tick = this.timer % 26;
      if (tick === 0) { this.face = Math.sign(dx) || this.face; this.step++; if (this.onScreen(16) && Math.abs(dx) < 220) Audio8.sfx('cog', this.cx); }
      this.vx = tick < 11 && this.groundAhead(this.face) ? this.face * 1.25 : 0;
      if (tick === 11) this.step++;
      if (this.timer > 26 && Math.abs(dx) < 52 && Math.abs(dy) < 26 && Math.sign(dx) === this.face) { this.st = 'wind'; this.timer = 0; this.vx = 0; Audio8.sfx('latch', this.cx); }
    } else if (this.st === 'wind') { this.vx = 0; if (this.timer > 22) { this.st = 'lunge'; this.timer = 0; this.vx = this.face * 3.6; this.vy = -0.8; Audio8.sfx('whoosh', this.cx); } }
    else if (this.st === 'lunge') { if (this.timer > 7) this.vx *= 0.82; if (!this.groundAhead(this.face) && this.onGround) this.vx = 0; if (this.timer > 13) { this.st = 'recover'; this.timer = 0; } }
    else if (this.st === 'recover') { this.vx = 0; if (this.timer > 30) { this.st = 'walk'; this.timer = 1; } }
    const was = this.onGround, y0 = this.y;
    if (this.physics()) this.vx = 0;
    if (was && !this.onGround) this.fallY = y0;
    if (!was && this.onGround && this.y - this.fallY > 10 && this.st === 'sleep') { this.landed = true; Audio8.sfx('clank', this.cx); W.dust(this.cx, this.y + this.h, 4); } // vom Band gefallen
    if (this.st === 'lunge' && this.timer > 1 && this.timer < 12 && p.alive && Phys.overlap(this.blade(), p)) p.hurt(this.dmg + 1, this.cx);
    if (this.st !== 'sleep' && this.st !== 'boot') this.touch();
  }
  boot() { this.st = 'boot'; this.timer = 0; this.landed = false; Audio8.sfx('latch', this.cx); this.face = Math.sign(W.player.cx - this.cx) || this.face; }
  blade() { return { x: this.face > 0 ? this.x + this.w : this.x - 24, y: this.y + 8, w: 24, h: 9 }; }
  hit(dmg, id) {
    if (id && this.lastHit === id) return false;
    if (this.st === 'sleep' || this.st === 'drop') { if (this.st === 'drop') this.st = 'sleep'; this.boot(); this.timer = 14; }
    else if (this.st !== 'lunge') { this.knockT = 8; this.vx = Math.sign(this.cx - W.player.cx || 1) * 1.5; }
    Audio8.sfx('clank', this.cx);
    return super.hit(dmg, id);
  }
  kill(silent) {
    if (!silent) for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2, 2), rnd(-3.6, -1), i % 3 ? '#d8a848' : '#e8e4dc', 50, i % 2 ? 2 : 1, 0.2)); // Zahnräder und Porzellansplitter
    super.kill(silent);
  }
  pose() {
    if (this.st === 'sleep') return 'sleep'; if (this.st === 'drop') return 'hang'; if (this.st === 'boot') return 'stand';
    if (this.st === 'wind') return 'wind'; if (this.st === 'lunge') return 'lunge'; if (this.st === 'recover') return 'recover';
    return this.vx ? 'walk' + (this.step % 4) : 'walk' + (this.step % 2 ? 1 : 3);
  }
  draw(ctx) {
    const S = Werk.SPR[this.pose()]; if (!S) return;
    const jit = this.st === 'boot' && this.timer % 4 < 2 ? 1 : this.st === 'wind' && this.timer > 12 ? ((this.t >> 1) & 1) : 0;
    this.spr(ctx, S.s, this.face < 0, jit, 1, this.flash);
    const bx = Math.round(this.cx - W.cam.x) + jit, by = Math.round(this.y + this.h - W.cam.y), f = this.face < 0 ? -1 : 1;
    if (S.eyes && this.eye > 0.05) { // glimmende Augen
      ctx.globalAlpha = this.eye;
      const ex = Math.round(bx + f * S.eyes[0][0] - 0.5), ey = Math.round(by + S.eyes[0][1] - 0.5);
      ctx.fillStyle = 'rgba(255,60,30,0.35)'; ctx.fillRect(ex - 2, ey, 5, 1); ctx.fillRect(ex, ey - 1, 1, 3); // Schein
      for (const [ex2, ey2] of S.eyes) { ctx.fillStyle = '#ff4020'; ctx.fillRect(Math.round(bx + f * ex2 - 0.5), Math.round(by + ey2 - 0.5), 1, 1); }
      ctx.fillStyle = '#ffe0b0'; ctx.fillRect(ex, ey, 1, 1);
      ctx.globalAlpha = 1;
    }
    if (this.st === 'wind' && S.tip && this.timer > 8 && this.timer < 16) { // Glanz auf der Klinge
      const tx = Math.round(bx + f * S.tip[0]), ty = Math.round(by + S.tip[1]), k = this.timer - 8;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - k % 4, ty, 1 + 2 * (k % 4), 1); ctx.fillRect(tx, ty - k % 4, 1, 1 + 2 * (k % 4));
    }
  }
}
