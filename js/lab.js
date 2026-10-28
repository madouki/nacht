// Galvani-Laboratorium (Schloss-Modus, Luke im Boden der Maschinenhalle): eine galvanische Versuchshalle aus Backstein und
// Gusseisen unter einem Glasdach im Gewitter, in PS2-3D. In der Mitte ein riesiger Glastank voll grün leuchtender Nährlösung,
// darin schwebt eine Gestalt zwischen aufsteigenden Blasen; Teslaspulen als Low-Poly-Türme mit knisternden Bögen, Kupferrohre,
// Leidener Flaschen, Ketten, hinten ein Galgen mit zwei Elektrodenarmen über dem Operationstisch. Ein Blitzableiter führt durchs
// Dach bis über den Tank: regelmäßig schlägt der Blitz ein, der Saal steht im weißen Licht, alle Spulen feuern.
// Spielebene: Lichtbögen zwischen Spulenpaaren (vorher Ladeglühen und Knistern), Bodenplatten unter Strom im Takt, ein
// Messerschalter, den die Peitsche umlegt – dann ruht ein Abschnitt ein paar Sekunden. Am Tisch erweckt der Blitz den Erweckten.
'use strict';

const Lab = (() => {
  const { mesh, vtx, face, box, prism, cone, beam, render, project } = PS2;
  const CPU = { willReadFrequently: true };
  const cv = (w, h) => Sprites.canvas(w, h);
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
  const bay = (x, y) => BAY[(y & 3) * 4 + (x & 3)];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const nrm = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); };
  const noise = (x, y, s) => { // weiches Wertrauschen (Wolken, Ziegel)
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi + s, yi), b = hash(xi + 1 + s, yi), c = hash(xi + s, yi + 1), d = hash(xi + 1 + s, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, s) => noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 17) * 0.3 + noise(x * 4.3, y * 4.3, s + 41) * 0.15;

  // ---------------- Lage im Saal (Weltpixel: x wie der Raum, y nach oben ab Hallenboden, z in die Tiefe, Spielebene z = 200) ----------------
  const TX = 896, TZ = 440, TR = 100, TB = 34, TTOP = 314; // Glastank: Mitte, Radius, Glas von TB bis TTOP
  const ROD = { x: TX, y: 412, z: TZ }; // Kugel am Ende des Blitzableiters, darunter (Spalt) die Spitze auf der Tankkuppel
  const SPIKE = { x: TX, y: 392, z: TZ };
  const COILS = [[548, 410, 1.12], [1244, 410, 1.12], [1404, 350, 0.82], [1726, 350, 0.82]]; // Teslaspulen: x, z, Größe
  const coilTop = (c) => ({ x: c[0], y: 218 * c[2], z: c[1] });
  const GX = 1560, GZ = 300; // Galgen mit Elektrodenarmen über dem Operationstisch
  const GTIP = [[GX - 30, 96, GZ - 64], [GX + 30, 96, GZ - 64]];
  const ZW = 640, PW = 200 / ZW, XW0 = -900, XW1 = 2700, YW = 470; // gemalte Rückwand (Ebene z = ZW, Maßstab PW)
  const X0 = -900, X1 = 2700, CHK = 240, NC = Math.ceil((X1 - X0) / CHK);

  const IRON = [50, 54, 64], IRON2 = [78, 82, 96], COP = [200, 114, 58], COP2 = [146, 74, 38], BRASS = [218, 172, 82], BRASS2 = [150, 112, 46],
    PORC = [228, 224, 212], PORC2 = [176, 170, 160], STONE = [84, 76, 78], STONE2 = [62, 56, 60], WOOD = [100, 60, 36], WOOD2 = [72, 42, 26],
    FLUID = [60, 210, 120], FLUID2 = [44, 170, 100], GLASS = [170, 230, 210], TOR = [214, 220, 236], RUB = [30, 26, 30];
  const ENV = { static: true, sun: nrm([-0.35, 0.55, -0.75]), sunC: [0.44, 0.46, 0.6], amb: [0.3, 0.28, 0.34], sky: [0.1, 0.12, 0.2], fog: [8, 10, 22], fogD: 0.0013 };
  const ENVF = { static: true, sun: nrm([-0.15, 0.85, -0.5]), sunC: [0.95, 0.96, 1.15], amb: [0.74, 0.76, 0.92], sky: [0.3, 0.3, 0.42], fog: [96, 104, 140], fogD: 0.001 };

  // ---------------- Zustand: Blitzschläge, stillgelegte Abschnitte, Funken ----------------
  const st = { strikeT: 0, next: 400, cut: {}, coil: [0, 0, 0, 0], sparks: [], zapT: 0, room: null };
  function reset() { st.strikeT = 0; st.next = 260 + Math.random() * 200; st.cut = {}; st.coil = [0, 0, 0, 0]; st.sparks = []; st.zapT = 0; st.req = false; }
  function strike() { st.req = true; } // nächstes Bild: Blitz in den Ableiter (Donner, weißes Licht, alle Spulen feuern)
  const cut = (g, n) => { st.cut[g] = Math.max(st.cut[g] || 0, n); };
  const isCut = (g) => g !== undefined && (st.cut[g] || 0) > 0;
  const cutLeft = (g) => st.cut[g] || 0;
  const flashOn = () => FX.stormOn(W.storm);

  // ---------------- Kacheln (Thema 'lab'): Riffelblech auf Backstein, Laufgang aus dunklem Eisen mit Kupferleiste ----------------
  function floorTile(v) {
    const c = cv(16, 16), x = c.getContext('2d'), P = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    for (let Y = 0; Y < 16; Y++) for (let X = 0; X < 16; X++) {
      const n = hash(X + v * 31, Y);
      if (Y < 6) { const tread = ((X + (Y >> 1) * 2) % 4 === 0) && Y > 0 && Y < 5; P(Y === 0 ? '#8c94a4' : tread ? (Y < 3 ? '#9ca4b4' : '#6c7484') : n > 0.85 ? '#3c4250' : '#4a505e', X, Y); continue; } // Riffelblech
      if (Y === 6) { P(X % 5 === 2 ? '#f0b070' : '#a85c2c', X, Y); continue; } // Kupferleiste
      if (Y === 7) { P('#140c0a', X, Y); continue; }
      const row = (Y - 8) >> 2, off = (row & 1) * 4, mortar = (Y - 8) % 4 === 3 || (X + off) % 8 === 7;
      P(mortar ? '#1a0c08' : n > 0.8 ? '#6c3424' : n > 0.3 ? '#542a1c' : '#46221a', X, Y); // Backstein darunter
    }
    for (const X of [1, 14]) { x.fillStyle = '#d8dce8'; x.fillRect(X, 1, 1, 1); } // Nieten
    if (v === 1) { x.fillStyle = 'rgba(90,240,170,0.55)'; x.fillRect(5, 3, 3, 1); x.fillRect(6, 2, 1, 1); } // grüner Fleck (Nährlösung)
    if (v === 3) { x.fillStyle = '#2a1410'; x.fillRect(9, 2, 4, 2); } // Brandfleck
    return c;
  }
  function grateTile() {
    const c = cv(16, 16), x = c.getContext('2d'), P = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    P('#3c424e', 0, 0, 16, 4); P('#8c94a6', 0, 0, 16, 1); P('#5c6272', 0, 1, 16, 1); P('#b86a34', 0, 3, 16, 1); P('#0c0e12', 0, 4, 16, 1);
    for (let i = 0; i < 10; i++) { P('#2c3038', 2 + i, 5 + i, 2, 1); P('#2c3038', 12 - i, 5 + i, 2, 1); } // Andreaskreuz
    P('#2c3038', 0, 5, 2, 11); P('#2c3038', 14, 5, 2, 11); P('#5c6272', 0, 5, 1, 11); P('#2c3038', 0, 14, 16, 2);
    for (const X of [2, 7, 13]) P('#e8d0a8', X, 2, 1, 1);
    return c;
  }

  // ---------------- Gewitterhimmel (hinter Fenstern und Glasdach) ----------------
  let sky = null;
  function buildSky() {
    const Wd = 640, Hd = 208, mk = (lit) => {
      const c = cv(Wd, Hd), x = c.getContext('2d'), img = x.createImageData(Wd, Hd), d = img.data;
      for (let Y = 0; Y < Hd; Y++) for (let X = 0; X < Wd; X++) {
        const k = Y / Hd, n = fbm(X / 70, Y / 34, 3) + (fbm(((X + 320) % Wd) / 70, Y / 34, 3) - fbm(X / 70, Y / 34, 3)) * Math.max(0, X - 520) / 120, cl = Math.max(0, n - 0.42) * 2.4;
        let col = mix([8, 6, 18], [30, 20, 44], k);
        col = mix(col, lit ? [210, 210, 250] : [58, 50, 78], Math.min(1, cl + bay(X, Y) * 0.12));
        if (cl > 0.55) col = mix(col, lit ? [255, 255, 255] : [86, 76, 104], (cl - 0.55) * 1.6);
        const i = (Y * Wd + X) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
      x.putImageData(img, 0, 0); return c;
    };
    return { dark: mk(false), lit: mk(true) };
  }
  // Regen schräg vor dem Himmel (nur durch Fenster und Dach zu sehen)
  function drawRain(ctx, w, frame) {
    ctx.fillStyle = 'rgba(150,160,210,0.32)';
    for (let k = 0; k < 46; k++) {
      const sx = (hash(k, 3) * (w + 80) + frame * (3.2 + hash(k, 5))) % (w + 80) - 40, sy = (hash(k, 9) * 260 + frame * (7 + hash(k, 7) * 2)) % 260 - 40;
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(sx - i * 0.5), Math.round(sy + i * 2), 1, 2);
    }
  }

  // ---------------- Rückwand: Backstein, Sockel, Gesims, hohe Bogenfenster, Schalttafeln, Tafel mit Skizzen (gemalt, Ebene z = ZW) ----------------
  let wall = null;
  const WIN = (X) => 160 + 320 * Math.round((X - 160) / 320); // Fenstermitten
  function buildWall() {
    const Wd = Math.ceil((XW1 - XW0) * PW), Hd = Math.ceil(YW * PW) + 1, c = cv(Wd, Hd), x = c.getContext('2d'), img = x.createImageData(Wd, Hd), d = img.data;
    const put = (u, v, col, a = 255) => { const i = (v * Wd + u) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a; };
    for (let v = 0; v < Hd; v++) for (let u = 0; u < Wd; u++) {
      const X = XW0 + u / PW, Y = YW - v / PW, wc = WIN(X), dx = X - wc, adx = Math.abs(dx);
      if (Y > 452) { put(u, v, (u % 4 === 0 && Y < 462) ? [26, 22, 26] : Y > 464 ? [96, 88, 86] : [70, 64, 66]); continue; } // Gesims mit Zahnschnitt
      if (Y > 440) { put(u, v, Y > 448 ? [110, 100, 96] : [40, 34, 36]); continue; }
      const AY = 330, AR = 74, inWin = adx < AR && Y > 150 && (Y < AY || Math.hypot(dx, Y - AY) < AR);
      const dO = Y < AY ? Math.min(AR - adx, Y - 150) : Math.min(AR - Math.hypot(dx, Y - AY), Y - 150);
      if (inWin) { // Fenster: Eisensprossen, schmutziges Glas, sonst durchsichtig
        const mul = adx < 2.5 || (Y < AY && Math.abs(((Y - 150) % 45) - 22) > 20.5) || (Y < AY && Math.abs(adx - 37) < 2.5) || (Y >= AY && Math.abs(Math.hypot(dx, Y - AY) - 40) < 2.5) || (Y >= AY && Math.abs(Math.atan2(Y - AY, dx) % 0.5236) < 0.03);
        if (dO < 6) put(u, v, [34, 34, 44]); else if (mul) put(u, v, [22, 24, 32]);
        else { const dirt = hash(u >> 1, v >> 1); if (dirt > 0.9) put(u, v, [30, 34, 40], 110); else if (Y < 190 && dirt > 0.5) put(u, v, [24, 26, 30], 90); else put(u, v, [0, 0, 0], 0); } // Ruß unten
        continue;
      }
      if (dO > -14 && adx < AR + 14 && Y > 136) { // Steinrahmen und Fensterbank
        put(u, v, Y < 150 ? (Y > 146 ? [150, 140, 132] : [92, 84, 82]) : dO > -4 ? [128, 120, 116] : dO > -9 ? [104, 96, 94] : [80, 74, 74]); continue;
      }
      if (Y < 34) { // Sockel aus Granitquadern
        const blk = Math.floor(X / 64), joint = X - blk * 64 < 3 || Y > 30 || (Y > 15 && Y < 18);
        put(u, v, joint ? [26, 22, 24] : mix([70, 64, 66], [92, 86, 86], hash(blk, Y > 16 ? 1 : 0) * 0.5 + (Y > 26 ? 0.4 : 0)));
        continue;
      }
      // Backstein: Läufer in Reihen, Fugen dunkel, vereinzelt rußig oder ausgeblüht; unten feucht dunkler
      const row = Math.floor(v / 3), off = (row & 1) * 4, mortar = v % 3 === 2 || (u + off) % 8 === 7, bk = hash(Math.floor((u + off) / 8), row);
      let col = mortar ? [22, 12, 10] : bk > 0.9 ? [118, 62, 44] : bk > 0.5 ? [92, 46, 34] : bk > 0.12 ? [80, 40, 30] : [56, 30, 26];
      if (!mortar && hash(u, v) > 0.92) col = mix(col, [140, 120, 110], 0.3);
      col = mix(col, [10, 8, 10], Math.max(0, 0.45 - Y / 200) + Math.max(0, (Y - 300) / 300) * 0.5); // unten feucht, oben im Dunkel
      put(u, v, col);
    }
    x.putImageData(img, 0, 0);
    const U = (X) => (X - XW0) * PW, V = (Y) => (YW - Y) * PW, R = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(Math.round(U(X)), Math.round(V(Y)), Math.max(1, Math.round(w * PW)), Math.max(1, Math.round(h * PW))); };
    // Schalttafeln aus Marmor unter den Fenstern: Messingmanometer, Messerschalter, Glühlampen
    for (const wx of [160, 480, 2080]) {
      R('#1c1a1e', wx - 84, 134, 168, 98); R('#c8c4bc', wx - 80, 130, 160, 90); R('#9c968e', wx - 80, 42, 160, 2 / PW);
      for (let k = 0; k < 3; k++) { // Manometer
        const cx = U(wx - 50 + k * 50), cy = V(110), r = 5.5;
        x.fillStyle = '#5c4418'; x.beginPath(); x.arc(cx, cy, r + 1.5, 0, 7); x.fill(); x.fillStyle = '#e8c870'; x.beginPath(); x.arc(cx, cy, r + 0.5, 0, 7); x.fill();
        x.fillStyle = '#f4f0e4'; x.beginPath(); x.arc(cx, cy, r - 0.6, 0, 7); x.fill();
        x.strokeStyle = '#c81818'; x.lineWidth = 1; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(-2.2 + k * 1.1) * r * 0.8, cy + Math.sin(-2.2 + k * 1.1) * r * 0.8); x.stroke();
      }
      for (let k = 0; k < 4; k++) { R('#3c2c1c', wx - 66 + k * 36, 80, 18, 6); R('#d88848', wx - 62 + k * 36, 74, 4, 26); R('#d88848', wx - 52 + k * 36, 74, 4, 26); R('#1c1c1c', wx - 64 + k * 36, 102, 16, 6); } // Messerschalter
      for (let k = 0; k < 6; k++) R(k % 2 ? '#fcd070' : '#c82828', wx - 70 + k * 28, 56, 8, 8); // Kontrolllampen
    }
    // Schiefertafel mit Skizzen eines Körpers, Formeln, Kreidestaub (hinter dem Galgen)
    { const bx = 1376, by = 136, bw = 132, bh = 96; R('#3c2414', bx - 4, by + 4, bw + 8, bh + 8); R('#1c2622', bx, by, bw, bh);
      x.strokeStyle = 'rgba(230,236,230,0.8)'; x.lineWidth = 1; const L = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(U(a), V(b)) : x.moveTo(U(a), V(b))); x.stroke(); };
      x.beginPath(); x.arc(U(bx + 34), V(by - 26), 4, 0, 7); x.stroke(); L([[bx + 34, by - 38], [bx + 34, by - 66]]); L([[bx + 18, by - 44], [bx + 50, by - 44]]); L([[bx + 34, by - 66], [bx + 24, by - 88]]); L([[bx + 34, by - 66], [bx + 44, by - 88]]); // Figur
      x.beginPath(); x.arc(U(bx + 34), V(by - 54), 11, 0, 7); x.stroke(); // Kreis um die Figur
      x.fillStyle = 'rgba(230,236,230,0.75)'; for (let k = 0; k < 7; k++) x.fillRect(Math.round(U(bx + 64)), Math.round(V(by - 12 - k * 11)), 4 + ((k * 7) % 9), 1); // Formelzeilen
      L([[bx + 104, by - 20], [bx + 112, by - 34], [bx + 106, by - 42], [bx + 118, by - 56]]); // Blitzzeichen
    }
    return c;
  }

  // ---------------- 3D: Boden, Säulen, Rohre, Tank, Teslaspulen, Leidener Flaschen, Galgen, Glasdach, Blitzableiter ----------------
  let hall = null, lamps = [];
  function ring(m, cx, cy, cz, r, n, th, col, a0 = 0, a1 = Math.PI * 2, plane = 'xz') { // Ring aus Balken (Torus, Bänder)
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * i / n, u1 = a0 + (a1 - a0) * (i + 1) / n;
      const P = (u) => plane === 'xz' ? [cx + Math.cos(u) * r, cy, cz + Math.sin(u) * r] : [cx + Math.cos(u) * r, cy + Math.sin(u) * r, cz];
      const [x0, y0, z0] = P(u0), [x1, y1, z1] = P(u1);
      beam(m, x0, y0, z0, x1, y1, z1, th, th, col, { open: true });
    }
  }
  function ball(m, cx, cy, cz, r, col, seg = 6, rings = 4) {
    const rows = [];
    for (let j = 0; j <= rings; j++) { const v = j / rings * Math.PI, row = []; for (let i = 0; i < seg; i++) { const u = i / seg * Math.PI * 2; row.push(vtx(m, cx + Math.cos(u) * Math.sin(v) * r, cy + Math.cos(v) * r, cz + Math.sin(u) * Math.sin(v) * r)); } rows.push(row); }
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) face(m, [rows[j][i], rows[j][(i + 1) % seg], rows[j + 1][(i + 1) % seg], rows[j + 1][i]], col, [cx, cy, cz]);
  }
  function coil(m, cx, cz, s) { // Teslaspule: Schaltschrank, Primärwicklung, Sekundärrohr mit Kupferbändern, Isolatoren, Toroid
    box(m, cx, 0, cz, 76 * s, 40 * s, 62 * s, WOOD, { top: WOOD2 });
    box(m, cx, 40 * s, cz, 80 * s, 4 * s, 66 * s, BRASS2, { top: BRASS });
    for (const k of [-1, 1]) box(m, cx + k * 26 * s, 10 * s, cz - 31.5 * s, 14 * s, 18 * s, 1, [24, 20, 22]); // Lüftungsgitter
    for (let i = 0; i < 4; i++) prism(m, cx + (i % 2 ? 1 : -1) * 28 * s, 44 * s, cz + (i < 2 ? -1 : 1) * 22 * s, 4 * s, 18 * s, 6, PORC, { top: PORC2 }); // Isolatorfüße
    prism(m, cx, 44 * s, cz, 34 * s, 6 * s, 12, COP2, { top: COP }); prism(m, cx, 50 * s, cz, 30 * s, 8 * s, 12, COP, { cap: false }); // Primärwicklung
    for (let i = 0; i < 7; i++) prism(m, cx, (58 + i * 20) * s, cz, (13 - i * 0.6) * s, 20 * s, 8, i % 2 ? COP2 : COP, { cap: false }); // Sekundärrohr
    prism(m, cx, 198 * s, cz, 7 * s, 10 * s, 6, PORC, { top: PORC2 });
    ring(m, cx, 214 * s, cz, 30 * s, 12, 13 * s, TOR); // Toroid
    prism(m, cx, 206 * s, cz, 24 * s, 12 * s, 10, TOR, { top: [210, 214, 228] });
    cone(m, cx, 218 * s, cz, 3 * s, 14 * s, 5, BRASS);
  }
  function buildHall() {
    lamps = [];
    const ch = Array.from({ length: NC }, mesh), M = (x) => ch[Math.max(0, Math.min(NC - 1, Math.floor((x - X0) / CHK)))];
    // Boden: dunkle Steinplatten, Kabelkanal mit Kupferschiene, Abfluss
    for (let z = 200; z < ZW; z += 80) for (let x = X0; x < X1; x += 80) {
      const m = M(x + 40), i = Math.round(x / 80), j = Math.round(z / 80), col = (i * 7 + j * 3) % 5 === 0 ? [72, 66, 70] : (i + j) & 1 ? STONE : STONE2;
      face(m, [vtx(m, x, 0, z), vtx(m, x, 0, z + 80), vtx(m, x + 80, 0, z + 80), vtx(m, x + 80, 0, z)], col, null, { two: true });
    }
    for (let x = X0; x < X1; x += CHK) { const m = M(x + 1); beam(m, x, 1, 236, x + CHK, 1, 236, 8, 2, COP2, { open: true }); beam(m, x, 0.5, 560, x + CHK, 0.5, 560, 24, 1, [30, 28, 34], { open: true }); }
    // Gusseisensäulen vor der Rückwand (Kannelur angedeutet), Kapitell, Gaslampe am Arm
    for (let x = -960; x <= X1 + 60; x += 320) {
      const m = M(x);
      box(m, x, 0, 616, 30, 26, 30, STONE, { top: [96, 90, 92] });
      prism(m, x, 26, 616, 11, 404, 8, x % 640 ? IRON : IRON2, { cap: false });
      box(m, x, 420, 616, 34, 12, 34, IRON2, { top: [96, 100, 112] });
      box(m, x, 200, 600, 4, 4, 22, BRASS2); box(m, x, 186, 589, 8, 14, 8, BRASS, { e: 0.9 }); lamps.push([x, 193, 589]);
    }
    // Kupferrohre an der Wand: zwei Stränge, Flansche, Ventile mit Handrad, Fallrohre
    for (let x = X0; x < X1; x += CHK) {
      const m = M(x + CHK / 2);
      beam(m, x, 64, 596, x + CHK, 64, 596, 12, 12, COP, { open: true }); beam(m, x, 352, 600, x + CHK, 352, 600, 9, 9, COP2, { open: true });
      for (let k = 40; k < CHK; k += 120) { box(m, x + k, 57, 596, 6, 14, 16, BRASS2); box(m, x + k, 345, 600, 5, 14, 13, BRASS2); }
    }
    for (let x = -800; x < X1; x += 640) { const m = M(x); beam(m, x, 64, 594, x, 352, 594, 8, 8, COP2, { open: true }); prism(m, x, 120, 586, 9, 3, 8, [170, 30, 30], { top: [210, 50, 40] }); }
    // Glastank: gestufter Messingsockel, grüne Nährlösung, Messingstreben und -ringe, Deckel, Kupferkuppel, Spitze
    { const m = M(TX);
      prism(m, TX, 0, TZ, TR + 22, 18, 14, BRASS2, { top: BRASS }); prism(m, TX, 18, TZ, TR + 12, 16, 14, BRASS, { top: BRASS2 });
      for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI; box(m, TX + Math.cos(a) * (TR + 18), 4, TZ + Math.sin(a) * (TR + 18), 6, 10, 6, [40, 36, 30]); } // Bolzen
      prism(m, TX, TB, TZ, TR - 4, TTOP - TB, 14, FLUID, { cap: false });
      for (const y of [TB, TTOP - 10]) prism(m, TX, y, TZ, TR + 4, 10, 14, BRASS2, { cap: false });
      ring(m, TX, 170, TZ, TR + 3, 14, 4, BRASS2, Math.PI, Math.PI * 2);
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI; prism(m, TX + Math.cos(a) * (TR + 4), TB, TZ + Math.sin(a) * (TR + 4), 3.4, TTOP - TB, 5, BRASS); } // Streben
      prism(m, TX, TTOP, TZ, TR + 10, 16, 14, BRASS2, { top: BRASS }); prism(m, TX, TTOP + 16, TZ, TR - 6, 8, 14, IRON2, { top: IRON });
      cone(m, TX, TTOP + 24, TZ, TR * 0.62, 40, 14, COP); prism(m, TX, TTOP + 60, TZ, 4, SPIKE.y - TTOP - 60, 6, IRON2); ball(m, SPIKE.x, SPIKE.y, SPIKE.z, 6, BRASS);
      for (let i = 0; i < 4; i++) { const a = Math.PI * (1.15 + i * 0.23); beam(m, TX + Math.cos(a) * (TR * 0.5), TTOP + 34, TZ + Math.sin(a) * (TR * 0.5), TX + Math.cos(a) * (TR + 30), TTOP - 40 - i * 30, TZ + Math.sin(a) * (TR + 30), 4, 4, RUB, { open: true }); } // Schläuche
      box(m, TX - TR - 34, 0, TZ - 10, 18, 230, 6, IRON); for (let y = 16; y < 230; y += 18) box(m, TX - TR - 34, y, TZ - 14, 18, 2, 4, IRON2); // Leiter
      box(m, TX - TR - 30, 230, TZ - 10, 30, 4, 26, IRON2, { top: [96, 100, 112] }); // Podest
    }
    // Blitzableiter: Eisenstange durchs Dach bis über den Tank, Kugel am Ende, Isolatoren
    { const m = M(ROD.x); prism(m, ROD.x, ROD.y + 6, ROD.z, 3, 760, 6, IRON2, { cap: false }); ball(m, ROD.x, ROD.y, ROD.z, 9, BRASS, 8, 5);
      for (const y of [470, 540]) prism(m, ROD.x, y, ROD.z, 7, 12, 8, PORC, { top: PORC2 }); }
    // Teslaspulen, dazwischen dicke Kabel am Boden
    for (const [cx, cz, s] of COILS) coil(M(cx), cx, cz, s);
    for (const [cx, cz] of [COILS[0], COILS[1]]) { const dir = Math.sign(TX - cx), m = M((cx + TX) / 2); beam(m, cx + dir * 38, 6, cz - 20, TX - dir * (TR + 20), 6, TZ - 50, 6, 6, RUB, { open: true }); }
    // Leidener Flaschen: zwei Regale, je zwei Böden mit sechs Flaschen (Kupferbelag, Glas, Messingstab mit Knauf, Sammelschiene)
    for (const rx of [240, 2030]) for (let sh = 0; sh < 2; sh++) {
      const m = M(rx), y = sh * 62, z = 470;
      box(m, rx, y, z, 172, 6, 40, WOOD, { top: [124, 78, 46] }); if (!sh) for (const k of [-1, 1]) box(m, rx + k * 84, 0, z, 6, 130, 6, WOOD2);
      for (let k = 0; k < 6; k++) {
        const jx = rx - 70 + k * 28;
        prism(m, jx, y + 6, z, 10, 26, 6, COP, { top: COP2 }); prism(m, jx, y + 32, z, 10, 12, 6, GLASS, { cap: false, a: 0.35 }); prism(m, jx, y + 44, z, 8, 3, 6, WOOD2, { top: [40, 30, 20] });
        box(m, jx, y + 47, z, 2, 8, 2, BRASS); box(m, jx, y + 55, z, 5, 4, 5, BRASS);
      }
      beam(m, rx - 70, y + 57, z, rx + 70, y + 57, z, 2, 2, BRASS2, { open: true });
    }
    box(M(2030), 2030, 124, 470, 172, 6, 40, WOOD, { top: [124, 78, 46] });
    // Galgen über dem Operationstisch: zwei Pfosten mit Kupferwicklung, Querträger, Isolatoren, Elektrodenarme, Kupferring
    { const m = M(GX);
      for (const k of [-1, 1]) { box(m, GX + k * 124, 0, GZ, 18, 214, 18, IRON, { top: IRON2 }); for (let y = 30; y < 200; y += 34) box(m, GX + k * 124, y, GZ, 21, 14, 21, COP); box(m, GX + k * 124, 0, GZ, 30, 12, 30, STONE, { top: [96, 90, 92] }); }
      box(m, GX, 204, GZ, 270, 16, 22, IRON2, { top: [96, 100, 112] });
      for (const [tx, ty, tz] of GTIP) {
        const bx = GX + Math.sign(tx - GX) * 64;
        for (let i = 0; i < 4; i++) prism(m, bx, 172 + i * 8, GZ, i % 2 ? 6 : 9, 8, 8, PORC, { top: PORC2 });
        beam(m, bx, 172, GZ, tx, ty + 10, tz, 9, 9, COP, {}); beam(m, bx, 186, GZ, bx, 204, GZ, 4, 4, IRON2, {});
        cone(m, tx, ty + 12, tz, 7, -16, 8, BRASS); ball(m, tx, ty - 6, tz, 4, BRASS, 6, 3);
      }
      ring(m, GX, 112, GZ + 26, 92, 18, 9, COP, 0, Math.PI * 2, 'xy'); // Kupferring hinter dem Tisch
      ring(m, GX, 112, GZ + 28, 80, 18, 3, BRASS2, 0, Math.PI * 2, 'xy');
      for (const k of [-1, 1]) beam(m, GX + k * 124, 214, GZ, GX + k * 60, 700, 520, 5, 5, RUB, { open: true }); // Kabel zum Dach
      beam(m, ROD.x + 6, 560, ROD.z, GX, 600, 420, 5, 5, RUB, { open: true });
    }
    // Glasdach: Sparren von der Traufe (y 440 über der Wand) schräg nach vorn hinauf, Pfetten, Scheiben
    const roof = (t) => [440 + t * 240, ZW - t * 400]; // t 0..1 → (y, z)
    for (let x = X0; x <= X1; x += 160) { const m = M(x), [y1, z1] = roof(1); beam(m, x, 440, ZW, x, y1, z1, 6, 9, IRON, { open: true }); }
    for (const t of [0, 0.25, 0.5, 0.75]) { const [y, z] = roof(t); for (let x = X0; x < X1; x += CHK) beam(M(x + CHK / 2), x, y, z, x + CHK, y, z, 5, 5, IRON2, { open: true }); }
    for (let x = X0; x < X1; x += 160) for (let k = 0; k < 4; k++) {
      const m = M(x + 80), [ya, za] = roof(k / 4), [yb, zb] = roof((k + 1) / 4);
      face(m, [vtx(m, x, ya, za), vtx(m, x + 160, ya, za), vtx(m, x + 160, yb, zb), vtx(m, x, yb, zb)], GLASS, null, { two: true, a: 0.1 });
    }
    return { ch };
  }

  // ---------------- Zeichnen: Himmel, Wand, 3D-Puffer, dann Lichter, Blasen, Gestalt, Bögen, Blitz ----------------
  const buf = { c: null, x: null, key: null };
  let cF = null; // Kamera in voller Auflösung (für Punkte der Überlagerungen)
  function camFor(cam) {
    const w = View.w, floorPx = W.room ? (W.room.h - 2) * T : 176;
    return { x: cam.x + w / 2, y: floorPx - cam.y - 83.2, z: 0, yaw: 0, pitch: 0, f: 200, near: 20, hy: 0.4 };
  }
  const P = (X, Y, Z) => project(cF, View.w, 208, X, Y, Z); // Punkt → Bild [x, y, z]
  function visible(camX) {
    const half = View.w / 2 * (ZW + 40) / 200 + 160, out = [];
    for (let k = 0; k < NC; k++) { const a = X0 + k * CHK; if (a + CHK > camX - half && a < camX + half) out.push(hall.ch[k]); }
    return out;
  }
  function zap(ctx, x0, y0, x1, y1, seed, wd, a = 1, col = '170,210,255') { // gezackter Lichtbogen: breiter Schein, Kern, weiße Seele
    const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7)), pts = [[x0, y0]], nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
    for (let i = 1; i < n; i++) { const t = i / n, j = (hash(seed + i, i * 3.1) - 0.5) * wd * Math.sin(t * Math.PI) * 2; pts.push([x0 + (x1 - x0) * t + nx / nl * j, y0 + (y1 - y0) * t + ny / nl * j]); }
    pts.push([x1, y1]);
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${col},${(0.22 * a).toFixed(3)})`; ctx.lineWidth = 5; path();
    ctx.strokeStyle = `rgba(${col},${(0.7 * a).toFixed(3)})`; ctx.lineWidth = 2; path();
    ctx.strokeStyle = `rgba(255,255,255,${(0.95 * a).toFixed(3)})`; ctx.lineWidth = 1; path();
    return pts;
  }
  // Gestalt im Tank: gekrümmter Körper, angezogene Knie, hängende Arme, gesenkter Kopf, Schläuche im Rücken (einmal gemalt)
  let shape = null;
  function buildShape() {
    const c = cv(64, 96), x = c.getContext('2d');
    x.translate(32, 50);
    const body = (col) => {
      x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.ellipse(-1, -14, 9, 15, 0.12, 0, 7); x.fill(); // Rumpf
      x.beginPath(); x.ellipse(2, -33, 6, 7, 0.4, 0, 7); x.fill(); // gesenkter Kopf
      x.lineWidth = 7; x.beginPath(); x.moveTo(-3, 0); x.quadraticCurveTo(12, 6, 6, 22); x.stroke(); x.beginPath(); x.moveTo(1, 0); x.quadraticCurveTo(16, 4, 12, 20); x.stroke(); // Knie angezogen
      x.lineWidth = 5; x.beginPath(); x.moveTo(6, 22); x.lineTo(2, 36); x.stroke(); x.beginPath(); x.moveTo(12, 20); x.lineTo(9, 34); x.stroke(); // Unterschenkel
      x.lineWidth = 5; x.beginPath(); x.moveTo(-6, -24); x.quadraticCurveTo(-12, -6, -8, 12); x.stroke(); x.beginPath(); x.moveTo(5, -24); x.quadraticCurveTo(10, -8, 14, 6); x.stroke(); // Arme hängen
      x.lineWidth = 2; x.beginPath(); x.moveTo(-8, -20); x.quadraticCurveTo(-18, -40, -10, -48); x.stroke(); x.beginPath(); x.moveTo(-4, -26); x.quadraticCurveTo(-6, -42, 2, -48); x.stroke(); // Schläuche
    };
    x.save(); x.translate(1.5, 0); body('rgba(170,255,200,0.55)'); x.restore(); // Lichtsaum
    body('#0c2416');
    x.fillStyle = 'rgba(160,255,190,0.9)'; for (const [a, b] of [[-3, -18], [-1, -12], [1, -6], [4, -36]]) x.fillRect(a, b, 1, 1); // glimmende Nähte
    return c;
  }
  const BUB = Array.from({ length: 22 }, (_, i) => ({ a: Math.PI * (1.08 + hash(i, 1) * 0.84), r: 0.25 + hash(i, 2) * 0.7, sp: 0.35 + hash(i, 3) * 0.5, ph: hash(i, 4) * 300, s: hash(i, 5) < 0.3 ? 2 : 1 }));

  function drawHall(ctx, cam, frame = 0) {
    if (!hall) hall = buildHall();
    if (!sky) sky = buildSky();
    if (!wall) wall = buildWall();
    if (!shape) shape = buildShape();
    const w = View.w, dv = View.lite ? 3 : 2, Wb = Math.ceil(w / dv), Hb = Math.ceil(208 / dv), fl = flashOn();
    cF = camFor(cam);
    // Himmel mit Regen (nur durch Fenster und Glasdach zu sehen)
    const so = ((Math.floor(cam.x * 0.04) % 640) + 640) % 640;
    for (let x = -so; x < w; x += 640) ctx.drawImage(sky.dark, x, 0);
    if (fl || st.strikeT > 30) { ctx.globalAlpha = fl ? 0.9 : 0.3; for (let x = -so; x < w; x += 640) ctx.drawImage(sky.lit, x, 0); ctx.globalAlpha = 1; }
    drawRain(ctx, w, frame);
    if (W.storm && W.storm.flash > 0 && fl) { const sx = P(ROD.x, 900, ROD.z)[0]; zap(ctx, sx - 40, -6, sx, 40, Math.floor(frame / 2), 18, 1, '200,200,255'); } // Blitz am Himmel
    // Rückwand (gemalt, Ebene z = ZW)
    const wx = w / 2 + (XW0 - cF.x) * PW, wy = 83.2 + (cF.y - YW) * PW;
    ctx.drawImage(wall, Math.round(wx), Math.round(wy));
    if (fl) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45; ctx.drawImage(wall, Math.round(wx), Math.round(wy)); ctx.restore(); }
    // 3D-Halle in halber Auflösung (nur neu rastern, wenn sich die Kamera bewegt oder der Blitz an/aus geht)
    if (!buf.c || buf.c.width !== Wb) { buf.c = cv(Wb, Hb); buf.x = buf.c.getContext('2d', CPU); buf.key = null; }
    const key = Math.round(cF.x / dv) + '|' + Math.round(cF.y / dv) + '|' + Wb + '|' + (fl ? 1 : 0);
    if (buf.key !== key) {
      buf.key = key; buf.x.clearRect(0, 0, Wb, Hb);
      const c3 = { ...cF, f: 200 / dv };
      buf.np = render(buf.x, Wb, Hb, visible(cF.x), c3, fl ? ENVF : ENV);
      buf.x.save(); buf.x.globalCompositeOperation = 'lighter'; // Lichthöfe der Gaslampen
      for (const [lx, ly, lz] of lamps) {
        const [sx, sy, sz] = project(c3, Wb, Hb, lx, ly, lz), r = 3600 / sz / dv; if (sz < 20 || sx < -r || sx > Wb + r || sy < -r || sy > Hb + r) continue;
        const g = buf.x.createRadialGradient(sx, sy, 0, sx, sy, r); g.addColorStop(0, 'rgba(255,200,120,0.5)'); g.addColorStop(1, 'rgba(255,150,70,0)'); buf.x.fillStyle = g; buf.x.fillRect(sx - r, sy - r, r * 2, r * 2);
      }
      buf.x.restore();
    }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(buf.c, 0, 0, Wb, Hb, 0, 0, w, 208); ctx.restore();
    drawTankLife(ctx, frame);
    drawArcs(ctx, frame);
  }
  // Leben im Tank: grünes Leuchten, Gestalt, Blasen, Glanzstreifen auf dem Glas
  function drawTankLife(ctx, frame) {
    const L = P(TX - TR, 170, TZ - 10), Rr = P(TX + TR, 170, TZ - 10), top = P(TX, TTOP - 10, TZ - TR), bot = P(TX, TB, TZ - TR);
    if (Rr[0] < -60 || L[0] > View.w + 60 || bot[1] < -10 || top[1] > 218) return;
    const cx = (L[0] + Rr[0]) / 2, hw = (Rr[0] - L[0]) / 2, s = 200 / TZ, k = st.strikeT > 0 ? Math.min(1, st.strikeT / 30) : 0, pul = 0.5 + 0.5 * Math.sin(frame * 0.05);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - hw + 2, top[1], hw * 2 - 4, bot[1] - top[1]); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, `rgba(60,200,120,${(0.08 + k * 0.3).toFixed(3)})`); g.addColorStop(1, `rgba(90,255,160,${(0.22 + pul * 0.08 + k * 0.4).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(cx - hw, top[1], hw * 2, bot[1] - top[1]);
    ctx.globalCompositeOperation = 'source-over';
    const bob = Math.sin(frame * 0.021) * 5 * s, tw = k > 0.2 ? (hash(frame, 1) - 0.5) * 3 : 0, cy = P(TX, 172, TZ)[1];
    ctx.globalAlpha = 0.92; ctx.drawImage(shape, Math.round(cx - 32 * s * 1.5 + tw), Math.round(cy - 50 * s * 1.5 + bob), Math.round(64 * s * 1.5), Math.round(96 * s * 1.5)); ctx.globalAlpha = 1;
    if (k > 0.3) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 0.5; ctx.drawImage(shape, Math.round(cx - 32 * s * 1.5 + tw + 1), Math.round(cy - 50 * s * 1.5 + bob), Math.round(64 * s * 1.5), Math.round(96 * s * 1.5)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.fillStyle = 'rgba(210,255,225,0.8)'; // Blasen
    for (const b of BUB) {
      const yy = TB + ((frame * b.sp + b.ph) % (TTOP - TB - 20)), wob = Math.sin(frame * 0.07 + b.ph) * 4;
      const p = P(TX + Math.cos(b.a) * TR * b.r + wob, yy, TZ + Math.sin(b.a) * TR * b.r);
      ctx.fillRect(Math.round(p[0]), Math.round(p[1]), b.s, b.s);
    }
    ctx.globalCompositeOperation = 'lighter'; // Glanz auf dem Glas
    ctx.fillStyle = 'rgba(200,255,230,0.12)'; ctx.fillRect(Math.round(cx - hw * 0.62), top[1], Math.max(2, Math.round(hw * 0.12)), bot[1] - top[1]);
    ctx.fillStyle = 'rgba(200,255,230,0.07)'; ctx.fillRect(Math.round(cx + hw * 0.45), top[1], Math.max(1, Math.round(hw * 0.06)), bot[1] - top[1]);
    ctx.restore();
  }
  // Teslaspulen knistern; beim Blitzschlag schlagen Bögen von allen Spulen zum Tank, der Ableiter glüht
  function drawArcs(ctx, frame) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const k = st.strikeT > 0 ? Math.min(1, st.strikeT / 24) : 0, sp = P(SPIKE.x, SPIKE.y, SPIKE.z), rd = P(ROD.x, ROD.y, ROD.z);
    COILS.forEach((c, i) => {
      const t = coilTop(c), p = P(t.x, t.y, t.z), s = 200 / t.z * c[2];
      if (p[0] < -80 || p[0] > View.w + 80 || p[1] < -60 || p[1] > 240) return;
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 40 * s + k * 30); g.addColorStop(0, `rgba(150,190,255,${(0.26 + k * 0.5 + st.coil[i] * 0.04).toFixed(3)})`); g.addColorStop(1, 'rgba(120,150,255,0)');
      ctx.fillStyle = g; ctx.fillRect(p[0] - 70, p[1] - 70, 140, 140);
      ctx.strokeStyle = `rgba(210,225,255,${(0.32 + k * 0.5).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 4 * s, 30 * s, 5 * s, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); // Glanz auf dem Toroid
      if (st.coil[i] > 0) for (let n = 0; n < 2; n++) { const a = hash(i * 7 + n, Math.floor(frame / 3)) * Math.PI * 2, L = 30 + 30 * hash(i, frame >> 2); zap(ctx, p[0], p[1], p[0] + Math.cos(a) * L * s * 1.6, p[1] + Math.sin(a) * L * s - 6, i * 13 + n + (frame >> 1), 6, 0.8); }
      if (k > 0 && i < 2) zap(ctx, p[0], p[1], sp[0], sp[1] + 8, i * 31 + (frame >> 1), 12, k);
      else if (k > 0) { const gt = P(...GTIP[i - 2]); zap(ctx, p[0], p[1], gt[0], gt[1], i * 17 + (frame >> 1), 10, k); }
    });
    if (k > 0) { // Ableiter: Überschlag von der Kugel auf die Tankspitze, Glut entlang der Stange
      zap(ctx, rd[0], rd[1], sp[0], sp[1], frame >> 1, 4, k);
      const tp = P(ROD.x, 900, ROD.z); ctx.strokeStyle = `rgba(200,220,255,${(0.6 * k).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rd[0], rd[1]); ctx.lineTo(tp[0], tp[1]); ctx.stroke();
      const g = ctx.createRadialGradient(rd[0], rd[1], 0, rd[0], rd[1], 46); g.addColorStop(0, `rgba(255,255,255,${(0.7 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(rd[0] - 46, rd[1] - 46, 92, 92);
    }
    ctx.restore();
    ctx.fillStyle = '#fce0a8'; for (const s of st.sparks) { const p = P(s.x, s.y, s.z); ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, s.t < 8 ? 2 : 1); } // Funken aus den Rohren
  }
  // Vordergrund: Ketten mit Haken und durchhängende Kabel ganz vorn (Parallaxe 1.3), bei Blitz als harte Silhouette
  let front = null;
  function buildFront() {
    const c = cv(640, 208), x = c.getContext('2d');
    x.fillStyle = '#05040a';
    for (const [cx, len] of [[70, 58], [250, 34], [410, 72], [560, 40]]) { // Ketten
      for (let y = 0; y < len; y += 5) { x.fillRect(cx - 1, y, 3, 4); x.fillRect(cx, y + 1, 1, 2); x.fillStyle = '#2c2a34'; x.fillRect(cx - 1, y, 1, 1); x.fillStyle = '#05040a'; }
      x.fillRect(cx - 1, len, 3, 6); x.fillRect(cx + 2, len + 6, 2, 4); x.fillRect(cx - 2, len + 8, 4, 2); // Haken
    }
    x.lineWidth = 4; x.strokeStyle = '#05040a'; // Kabel
    x.beginPath(); x.moveTo(-10, 6); x.quadraticCurveTo(140, 60, 330, 8); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.moveTo(300, 2); x.quadraticCurveTo(470, 46, 650, 4); x.stroke();
    x.fillStyle = '#05040a'; x.fillRect(0, 0, 640, 3);
    return c;
  }
  function drawFront(ctx, cam, frame) {
    if (!front) front = buildFront();
    const off = ((Math.floor(cam.x * 1.3) % 640) + 640) % 640, oy = -Math.round(Math.max(0, cam.y - 0) * 0.08);
    ctx.globalAlpha = W.arenaOn ? 0.35 : 0.85;
    for (let x = -off; x < View.w; x += 640) ctx.drawImage(front, x, oy);
    ctx.globalAlpha = 1;
  }
  // Zustand je Bild (vom Steuerobjekt im Raum): Blitzplan, Spulenknistern, Funken, stillgelegte Abschnitte
  function tick(frame) {
    for (const g in st.cut) if (st.cut[g] > 0 && --st.cut[g] === 0) { Audio8.sfx('teleport'); Audio8.sfx('zap'); } // Strom kommt zurück
    if (st.strikeT > 0) st.strikeT--;
    if (st.req) { st.req = false; W.storm.cd = 1; st.strikeT = 48; st.next = 620 + Math.random() * 380; Audio8.sfx('crack'); Audio8.sfx('zap'); }
    else if (--st.next <= 0) { W.storm.cd = 1; st.strikeT = 48; st.next = 620 + Math.random() * 380; Audio8.sfx('crack'); }
    else W.storm.cd = Math.max(W.storm.cd, 30); // keine zufälligen Blitze: hier schlägt er nur in den Ableiter
    for (let i = 0; i < 4; i++) { if (st.coil[i] > 0) st.coil[i]--; else if (Math.random() < 0.012) { st.coil[i] = 6 + Math.floor(Math.random() * 10); if (cF && Math.abs(coilTop(COILS[i]).x - cF.x) < View.w) Audio8.sfx('zap', coilTop(COILS[i]).x); } }
    if (Math.random() < 0.03) { const x = X0 + 900 + Math.random() * 1800; st.sparks.push({ x, y: 352, z: 590, vy: 0, t: 0 }); }
    for (const s of st.sparks) { s.t++; s.vy -= 0.12; s.y += s.vy; }
    st.sparks = st.sparks.filter(s => s.y > 0 && s.t < 90);
  }
  // Licht im Saal: der Tank strahlt grün, beim Einschlag gleißen Ableiter und Spulen
  function lights(L) {
    if (!cF) return;
    const t = P(TX, 140, TZ), k = st.strikeT > 0 ? Math.min(1, st.strikeT / 30) : 0, pul = Math.sin(W.frame * 0.05);
    if (t[0] > -160 && t[0] < View.w + 160) { L.push({ x: t[0], y: t[1], r: 110 + pul * 6 + k * 40, c: [70, 255, 150], a: 0.35 + k * 0.3 }); const b = P(TX, 40, TZ - TR); L.push({ x: b[0], y: b[1], r: 80, c: [60, 230, 140], a: 0.3 }); }
    COILS.forEach((c, i) => { const p = P(coilTop(c).x, coilTop(c).y, c[1]); if (p[0] > -60 && p[0] < View.w + 60 && (k > 0 || st.coil[i] > 0)) L.push({ x: p[0], y: p[1], r: 50 + k * 50, c: [150, 190, 255], a: 0.4 + k * 0.3 }); });
    if (k > 0) { const r = P(ROD.x, ROD.y, ROD.z); L.push({ x: r[0], y: r[1], r: 90, c: [210, 220, 255], a: 0.6 * k }); }
  }
  // Laken über der Gestalt auf dem Operationstisch (Füße links bei x0, Kopf rechts; y = Tischplatte); ab und zu zuckt eine Hand
  const SHEET = [[0, 3], [3, 9], [7, 8], [12, 5], [26, 5], [32, 9], [38, 8], [48, 8], [54, 11], [62, 12], [70, 14], [76, 12], [80, 8], [84, 12], [90, 11], [95, 4]];
  function drawSheet(ctx, x0, y, t, lift) {
    x0 = Math.round(x0); y = Math.round(y - lift);
    const jerk = (t % 230) < 8 ? Math.round(Math.sin(t * 2.3) * 2) : 0, H = (u) => { for (let i = 1; i < SHEET.length; i++) if (u <= SHEET[i][0]) { const [a, ha] = SHEET[i - 1], [b, hb] = SHEET[i]; return ha + (hb - ha) * (u - a) / (b - a); } return 3; };
    for (let u = -3; u < 99; u++) {
      const h = Math.round(H(Math.max(0, Math.min(95, u))) + (u > 56 && u < 62 ? jerk : 0)), drop = 6 + Math.round(Math.abs(Math.sin(u * 0.45)) * 3 + (u < 0 || u > 95 ? 3 : 0)), fold = Math.sin(u * 0.45) > 0.6;
      ctx.fillStyle = fold ? '#9c988c' : '#c8c4b4'; ctx.fillRect(x0 + u, y - h, 1, h + drop); // Tuch mit hängendem Saum
      ctx.fillStyle = '#ece8dc'; ctx.fillRect(x0 + u, y - h, 1, 2); // Licht auf der Oberseite
      if (hash(u, 3) > 0.9) { ctx.fillStyle = 'rgba(70,160,90,0.6)'; ctx.fillRect(x0 + u, y - h + 3, 1, 2); } // grüne Flecken
    }
    ctx.fillStyle = '#7c786c'; for (let u = 10; u < 92; u += 9) ctx.fillRect(x0 + u, y - Math.round(H(u)) + 3, 1, Math.round(H(u)) - 2); // Faltenwurf
    ctx.fillStyle = '#d8d0a8'; ctx.fillRect(x0 - 5, y - 2, 4, 5); ctx.fillStyle = '#8c8070'; ctx.fillRect(x0 - 3, y - 6, 1, 4); // Zettel am Zeh
  }
  const prewarm = () => { if (!hall) hall = buildHall(); if (!sky) sky = buildSky(); if (!wall) wall = buildWall(); if (!shape) shape = buildShape(); };
  const proj = (X, Y, Z) => (cF ? P(X, Y, Z) : [0, 0, 1]);
  return { floorTile, grateTile, drawHall, drawFront, drawSheet, prewarm, tick, lights, reset, strike, cut, isCut, cutLeft, zap, proj, GTIP, st, stats: () => ({ np: buf.np || 0 }) };
})();

// ---------------- Spielebene: Spulenpole, Stromplatten, Messerschalter, Operationstisch, Steuerung ----------------
// Kleine PS2-Modelle (einmal gebaut, gezeichnet mit PS2.drawLocal: Ursprung Bodenmitte, y nach oben, z = 0 Spielebene)
const LabModels = (() => {
  const { mesh, box, prism, face, vtx } = PS2;
  const IRON = [54, 58, 70], IRON2 = [96, 100, 116], COP = [204, 116, 58], COP2 = [150, 76, 38], BRASS = [222, 176, 84], PORC = [232, 228, 216], PORC2 = [180, 174, 164], LEATH = [96, 58, 32];
  let pole = null, table = null;
  function ballM(m, cx, cy, cz, r, col) {
    const rows = [];
    for (let j = 0; j <= 4; j++) { const v = j / 4 * Math.PI, row = []; for (let i = 0; i < 8; i++) { const u = i / 8 * Math.PI * 2; row.push(vtx(m, cx + Math.cos(u) * Math.sin(v) * r, cy + Math.cos(v) * r, cz + Math.sin(u) * Math.sin(v) * r)); } rows.push(row); }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) face(m, [rows[j][i], rows[j][(i + 1) % 8], rows[j + 1][(i + 1) % 8], rows[j + 1][i]], col, [cx, cy, cz]);
  }
  return {
    pole() { // Spulenpol (4 Kacheln hoch): Eisensockel, Porzellanisolatoren, Kupferwicklung, Messingkragen, Kugel
      if (pole) return pole;
      const m = mesh();
      box(m, 0, 0, 5, 18, 6, 16, IRON, { top: IRON2 });
      for (let i = 0; i < 5; i++) prism(m, 0, 6 + i * 5, 5, i % 2 ? 4 : 6.5, 5, 8, i % 2 ? PORC2 : PORC, { top: PORC });
      for (let i = 0; i < 4; i++) prism(m, 0, 31 + i * 5, 5, 5, 5, 8, i % 2 ? COP2 : COP, { cap: i === 3 });
      prism(m, 0, 51, 5, 7, 3, 8, BRASS, { top: [250, 210, 120] });
      ballM(m, 0, 59, 5, 6.5, [190, 196, 210]);
      return (pole = [m]);
    },
    table() { // Operationstisch: Stahlplatte auf Eisenbeinen, Ablage, Kopfstütze aus Leder, Kurbel
      if (table) return table;
      const m = mesh();
      for (const x of [-42, 42]) for (const z of [0, 18]) { prism(m, x, 0, z, 2.4, 22, 6, IRON); box(m, x, 0, z, 6, 2, 6, IRON2); }
      box(m, 0, 7, 9, 88, 2, 22, IRON, { top: IRON2 });
      box(m, 0, 20, 9, 100, 4, 30, [120, 126, 140], { top: [170, 176, 190] });
      box(m, 0, 18, 9, 104, 2, 32, IRON);
      box(m, 38, 24, 9, 18, 4, 22, LEATH, { top: [130, 84, 48] });
      for (const x of [-30, -6, 18]) box(m, x, 24, 9, 5, 0.6, 31, [70, 40, 22]);
      prism(m, -54, 10, 0, 6, 3, 8, BRASS); box(m, -54, 10, -2, 2, 2, 8, BRASS);
      return (table = [m]);
    },
  };
})();

// Spulenpaar: in festem Takt schlägt ein Lichtbogen zwischen den Polen (vorher ~0,7 s Ladeglühen und Knistern)
class LabArc extends Ent {
  constructor(d) {
    const fy = (d.y + 1) * T;
    super(d.x0 * T + 8, fy - 64, (d.x1 - d.x0) * T, 64);
    this.kind = 'prop'; this.fy = fy; this.ax = d.x0 * T + 8; this.bx = d.x1 * T + 8; this.per = d.per || 150; this.ph = d.ph || 0; this.on = d.on || 54; this.warn = 42; this.g = d.g;
    this.oa = {}; this.ob = {}; this.st = 'off';
  }
  phase() { if (Lab.isCut(this.g)) return 'off'; const c = (W.frame + this.ph) % this.per; return c < this.warn ? 'warn' : c < this.warn + this.on ? 'live' : 'off'; }
  update() {
    this.t++;
    const s = this.phase(), near = Math.abs(W.player.cx - this.cx) < View.w * 0.7 && Math.abs(W.player.feet - this.fy) < 200;
    if (s !== this.st) { if (near && s === 'warn') Audio8.sfx('cog', this.cx); if (near && s === 'live') { Audio8.sfx('zap', this.cx); Audio8.sfx('crack', this.cx); } this.st = s; }
    if (s === 'live' && near && this.t % 14 === 0) Audio8.sfx('zap', this.cx);
    if (s === 'warn' && near && this.t % 9 === 0) Audio8.sfx('tick', this.cx);
    const p = W.player;
    if (s === 'live' && p.alive && Phys.overlap({ x: this.ax + 7, y: this.fy - 60, w: this.bx - this.ax - 14, h: 60 }, p)) p.hurt(4, p.cx < this.cx ? this.ax - 8 : this.bx + 8);
  }
  lightUp(L, cx, cy) {
    const s = this.st, k = s === 'warn' ? ((W.frame + this.ph) % this.per) / this.warn : 0;
    if (s === 'live') L.push({ x: this.cx - cx, y: this.fy - 36 - cy, r: 76 + Math.sin(this.t * 0.9) * 6, c: [150, 190, 255], a: 0.6 });
    else if (s === 'warn') for (const x of [this.ax, this.bx]) L.push({ x: x - cx, y: this.fy - 59 - cy, r: 14 + k * 22, c: [140, 180, 255], a: 0.3 + k * 0.3 });
  }
  draw(ctx) {
    const cx = W.cam.x, cy = W.cam.y, y = this.fy - cy;
    if (this.ax - cx > View.w + 24 || this.bx - cx < -24) return;
    PS2.drawLocal(ctx, this.oa, LabModels.pole(), this.ax - cx, y, [-16, -74, 32, 78]);
    PS2.drawLocal(ctx, this.ob, LabModels.pole(), this.bx - cx, y, [-16, -74, 32, 78]);
    const s = this.st, cut = Lab.isCut(this.g), xa = this.ax - cx, xb = this.bx - cx, ty = y - 59;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (cut) { ctx.fillStyle = 'rgba(80,30,20,0.6)'; ctx.fillRect(xa - 2, ty - 2, 4, 4); ctx.fillRect(xb - 2, ty - 2, 4, 4); } // abgeschaltet: Kugeln dunkel
    else if (s === 'warn') { // Laden: Glühen wächst, Funken springen an den Kugeln
      const k = ((W.frame + this.ph) % this.per) / this.warn;
      for (const x of [xa, xb]) {
        const g = ctx.createRadialGradient(x, ty, 0, x, ty, 6 + k * 12); g.addColorStop(0, `rgba(220,235,255,${(0.35 + k * 0.6).toFixed(3)})`); g.addColorStop(1, 'rgba(120,160,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 20, ty - 20, 40, 40);
        if (k > 0.35 && (this.t & 3) === 0) Lab.zap(ctx, x, ty, x + (x === xa ? 1 : -1) * (6 + k * 14), ty + (Math.random() - 0.5) * 12, this.t + x, 4, 0.7);
      }
    } else if (s === 'live') { // drei Bögen quer über den Weg, flackernd
      const sd = Math.floor(this.t / 2) * 7;
      Lab.zap(ctx, xa, ty, xb, ty, sd, 9, 1); Lab.zap(ctx, xa, ty + 2, xb, y - 30, sd + 3, 12, 0.85); Lab.zap(ctx, xa + 2, y - 30, xb, y - 8, sd + 5, 10, 0.75);
      for (const x of [xa, xb]) { const g = ctx.createRadialGradient(x, ty, 0, x, ty, 16); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(150,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 16, ty - 16, 32, 32); }
    }
    ctx.restore();
  }
}
// Bodenplatte aus Kupfer: pulsiert im Takt (blinkt erst, dann steht sie unter Strom)
class LabPlate extends Ent {
  constructor(d) { super(d.x0 * T, d.y * T - 3, (d.x1 - d.x0 + 1) * T, 6); this.kind = 'prop'; this.row = d.y; this.per = d.per || 150; this.ph = d.ph || 0; this.on = d.on || 50; this.warn = 30; this.g = d.g; this.st = 'off'; }
  phase() { if (Lab.isCut(this.g)) return 'off'; const c = (W.frame + this.ph) % this.per; return c < this.warn ? 'warn' : c < this.warn + this.on ? 'live' : 'off'; }
  update() {
    this.t++;
    const s = this.phase(), p = W.player, near = this.onScreen(40);
    if (s !== this.st) { if (near && s === 'live') Audio8.sfx('zap', this.cx); this.st = s; }
    if (s === 'live' && near && this.t % 16 === 0) Audio8.sfx('flameTick', this.cx);
    if (s === 'live' && p.alive && p.onGround && Math.abs(p.feet - this.row * T) < 3 && p.x + p.w > this.x + 3 && p.x < this.x + this.w - 3) p.hurt(3, p.cx + p.face * 10);
  }
  lightUp(L, cx, cy) {
    if (this.st !== 'live') return;
    for (let x = this.x + 16; x < this.x + this.w; x += 48) L.push({ x: x - cx, y: this.row * T - 6 - cy, r: 34, c: [120, 220, 255], a: 0.45 });
  }
  draw(ctx) {
    const x0 = Math.round(this.x - W.cam.x), y = Math.round(this.row * T - W.cam.y), w = this.w, s = this.st, cut = Lab.isCut(this.g);
    if (x0 > View.w || x0 + w < 0) return;
    ctx.fillStyle = '#2c160c'; ctx.fillRect(x0, y - 1, w, 4);
    ctx.fillStyle = cut ? '#6c3c22' : '#b8642c'; ctx.fillRect(x0 + 1, y - 1, w - 2, 2); ctx.fillStyle = cut ? '#8c5434' : '#f0a060'; ctx.fillRect(x0 + 1, y - 1, w - 2, 1);
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x0, y - 2, 3, 5); ctx.fillRect(x0 + w - 3, y - 2, 3, 5); // Porzellanklötze
    ctx.fillStyle = '#5c2c14'; for (let x = 8; x < w - 4; x += 8) ctx.fillRect(x0 + x, y, 1, 1); // Nieten
    if (cut) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (s === 'warn') { if ((this.t >> 2) & 1) { ctx.fillStyle = 'rgba(120,200,255,0.5)'; ctx.fillRect(x0, y - 2, w, 2); } if (Math.random() < 0.5) { ctx.fillStyle = '#e0f0ff'; ctx.fillRect(x0 + Math.floor(Math.random() * w), y - 3 - Math.floor(Math.random() * 3), 1, 1); } }
    else if (s === 'live') {
      const g = ctx.createLinearGradient(0, y - 14, 0, y + 2); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(1, 'rgba(160,220,255,0.55)'); ctx.fillStyle = g; ctx.fillRect(x0, y - 14, w, 16);
      ctx.fillStyle = 'rgba(230,245,255,0.9)'; ctx.fillRect(x0 + 2, y - 1, w - 4, 1);
      for (let x = 4; x < w - 4; x += 12) { const sd = x * 3 + (this.t >> 1); Lab.zap(ctx, x0 + x, y - 1, x0 + x + 5 + (sd % 5), y - 7 - (sd % 7), sd, 3, 0.8); }
    }
    ctx.restore();
  }
}
// Messerschalter auf einer Schiefertafel: ein Peitschenhieb legt ihn um – der Abschnitt ist ein paar Sekunden stromlos
class LabLever extends Ent {
  constructor(d) { super(d.x * T - 4, (d.y + 1) * T - 40, 24, 40); this.kind = 'candle'; this.g = d.g; this.dur = d.dur || 420; this.cool = 0; this.fy = (d.y + 1) * T; this.flip = 0; }
  hit() {
    if (this.cool > 0 || Lab.isCut(this.g)) return;
    this.cool = 30; Lab.cut(this.g, this.dur);
    Audio8.sfx('clank', this.cx); Audio8.sfx('latch', this.cx); W.shake = Math.max(W.shake, 3); Input.rumble(0.3, 0.3, 120);
    for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + rnd(-4, 4), this.y + 14, rnd(-1.6, 1.6), rnd(-2.4, -0.6), i % 2 ? '#fce0a8' : '#a4e4fc', 22, 1, 0.12));
    W.popup(this.cx, this.y - 6, tr('labCut'), '#7cf0d8');
  }
  update() { this.t++; if (this.cool > 0) this.cool--; const on = !Lab.isCut(this.g); this.flip += ((on ? 0 : 1) - this.flip) * 0.35; }
  lightUp(L, cx, cy) { const on = !Lab.isCut(this.g); L.push({ x: this.cx - cx, y: this.y + 4 - cy, r: 26, c: on ? [255, 70, 50] : [80, 255, 160], a: 0.5 }); }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), on = !Lab.isCut(this.g), R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (x > View.w + 8 || x < -30) return;
    R('#141012', 10, 30, 4, 10); R('#3c3438', 11, 30, 1, 10); R('#241c20', 6, 38, 12, 2); // Gusseisenständer
    R('#f8d020', 7, 0, 10, 8); R('#141010', 9, 2, 6, 5); R('#f8d020', 11, 2, 2, 2); R('#f8d020', 10, 4, 2, 2); R('#f8d020', 12, 5, 1, 1); // Warnschild mit Blitz
    R('#6c4c1c', 0, 9, 24, 22); R('#d8a850', 0, 9, 24, 1); R('#3c2c10', 0, 30, 24, 1); R('#262a30', 2, 11, 20, 18); R('#3a4048', 2, 11, 20, 1); // Schiefertafel im Messingrahmen
    R('#e8e4d8', 4, 24, 16, 3); R('#a8a49c', 4, 26, 16, 1); // Porzellansockel mit Scharnier
    R('#d8b060', 5, 12, 3, 4); R('#d8b060', 16, 12, 3, 4); R('#8c6c30', 5, 15, 3, 1); R('#8c6c30', 16, 15, 3, 1); // Kontaktklemmen oben
    const a = -0.18 + this.flip * 2.95, hx = x + 12, hy = y + 24, L = 13, ex = hx + Math.sin(a) * L, ey = hy - Math.cos(a) * L;
    ctx.lineCap = 'butt';
    for (const o of [-5, 5]) { ctx.strokeStyle = '#7c3c18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx + o, hy); ctx.lineTo(ex + o, ey); ctx.stroke(); ctx.strokeStyle = '#f0a868'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + o - 1, hy); ctx.lineTo(ex + o - 1, ey); ctx.stroke(); } // Messerklingen aus Kupfer
    ctx.fillStyle = '#100c10'; ctx.fillRect(Math.round(ex - 8), Math.round(ey - 2), 16, 3); ctx.fillStyle = '#4c4448'; ctx.fillRect(Math.round(ex - 8), Math.round(ey - 2), 16, 1); // Querholm
    ctx.fillStyle = '#100c10'; ctx.fillRect(Math.round(ex - 1), Math.round(ey - 6), 3, 5); ctx.fillStyle = '#f0ece0'; ctx.fillRect(Math.round(ex - 2), Math.round(ey - 8), 5, 3); // Griff mit Porzellanknauf
    R(on ? ((this.t >> 3) & 1 ? '#fc3c28' : '#b01c14') : '#58f8a0', 10, 17, 4, 4); R('#fcfcfc', 10, 17, 1, 1); // Kontrolllampe
    if (!on) { const n = Math.ceil(Lab.cutLeft(this.g) / this.dur * 6); for (let i = 0; i < 6; i++) R(i < n ? '#58f8a0' : '#1c3428', 3 + i * 3, 28, 2, 2); } // Restzeit
    else if ((this.t % 46) < 3) { ctx.fillStyle = '#e0f0ff'; ctx.fillRect(x + 6 + (this.t % 3) * 5, y + 11, 1, 2); ctx.fillRect(x + 17 - (this.t % 3), y + 10, 1, 2); } // Funken an den Klemmen
  }
}
// Operationstisch (PS2-3D) mit der Gestalt unter dem Laken; Riemen hängen herab
class LabTable extends Ent {
  constructor(d) { const fy = (d.y + 1) * T; super(d.x * T - 52, fy - 26, 104, 26); this.kind = 'prop'; this.fy = fy; this.o = {}; }
  update() { this.t++; }
  body() { const b = W.boss; return !(b && b instanceof Awakened) && !W.miniDone[W.stage + ':' + W.roomIdx]; }
  draw(ctx) {
    const x = this.cx - W.cam.x, y = this.fy - W.cam.y;
    if (x < -80 || x > View.w + 80) return;
    PS2.drawLocal(ctx, this.o, LabModels.table(), x, y, [-64, -40, 128, 46]);
    ctx.fillStyle = '#3c2210'; for (const o of [-30, -6, 18]) { const sw = Math.round(Math.sin(this.t * 0.03 + o) * 1); ctx.fillRect(Math.round(x + o - 2 + sw), Math.round(y - 23), 2, 12); ctx.fillStyle = '#a89060'; ctx.fillRect(Math.round(x + o - 2 + sw), Math.round(y - 12), 2, 2); ctx.fillStyle = '#3c2210'; } // Riemen
    if (this.body()) Lab.drawSheet(ctx, x - 44, y - 25, this.t, 0);
  }
}
// Steuerung (unsichtbar): Blitzplan, Spulen, Licht des Tanks; folgt der Kamera, damit ihr Licht immer gesammelt wird
class LabCtl extends Ent {
  constructor() { super(0, 0, 4, 4); this.kind = 'prop'; Lab.reset(); }
  update() { this.t++; this.x = W.cam.x + View.w / 2; this.y = W.cam.y + 100; Lab.tick(W.frame); }
  lightUp(L) { Lab.lights(L); }
}
Lab.mk = (d) => d.k === 'arc' ? new LabArc(d) : d.k === 'plate' ? new LabPlate(d) : d.k === 'lever' ? new LabLever(d) : d.k === 'table' ? new LabTable(d) : new LabCtl(d);

// ---------------- Der Erweckte (Zwischengegner am Operationstisch) ----------------
// Ein vernähter Riese aus vielen Leibern (jede Partie eine andere Haut), in Echtzeit-3D (Low-Poly wie die Menschenfalle): breite
// Schultern, gebeugter Rücken, kahler gewölbter Schädel, lange Arme mit zerrissenen Eisenmanschetten, Kupferelektroden an den
// Schläfen, eine Kupferplatte mit einem Glasherz auf der Brust; Nähte und Augen glimmen grün. Der Blitz erweckt ihn: Laken fliegt, er richtet sich steif auf, brüllt.
// Angriffe: schwerfälliger Ansturm quer durch die Halle (vorher geduckt, drüberspringen), Faustschlag in den Boden mit einer
// Stromwelle über den Boden (drüberspringen), glühende Kolben im Bogen (zerspringen zu Strompfützen). Ab halber Energie
// schlägt der Blitz noch einmal in ihn: schneller, Doppelschlag, drei Kolben auf einmal.
const AwakenedModel = (() => {
  const { mesh, vtx, face } = PS2;
  // aus vielen Leibern genäht: jede Partie hat eine andere Hautfarbe, dazwischen die glimmenden Nähte
  const TORSO = [176, 168, 160], HEADC = [186, 178, 166], NECK = [148, 140, 136], ARMN = [164, 132, 112], FOREN = [178, 170, 160], ARMF = [150, 160, 172], FOREF = [140, 128, 120], HANDC = [166, 150, 136],
    PANTS = [58, 48, 64], PANTS2 = [46, 38, 52], BOOT = [44, 36, 32], LEATH = [96, 58, 32], CU = [208, 120, 60], IRONC = [76, 78, 92];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]) || 1, nrm = (a) => mul(a, 1 / len(a));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // Gelenke (Modell: x vorwärts, y hoch, z zur Seite – −z liegt zur Kamera hin)
  function joints(P) {
    const hip = [0, 42, 0], sp = P.hunch, up = [Math.sin(sp), Math.cos(sp), 0], fp = [Math.cos(sp), -Math.sin(sp), 0];
    const legs = [0, 1].map(i => {
      const k = i ? 1 : -1, L = P.legs[i], h = [hip[0], hip[1] - 3, k * 8];
      const knee = [h[0] + Math.sin(L.a1) * 19, h[1] - Math.cos(L.a1) * 19, k * 8.5], a = L.a1 - L.a2;
      return { k, h, knee, foot: [knee[0] + Math.sin(a) * 17, knee[1] - Math.cos(a) * 17, k * 9] };
    });
    const chest = add(hip, mul(up, 31)), hu = sp + 0.55 + (P.head || 0), neck = add(chest, [Math.sin(hu) * 7, Math.cos(hu) * 7, 0]);
    const ht = sp * 0.4 + (P.head || 0) * 0.6, head = add(neck, [Math.sin(ht) * 8 + 1.5, Math.cos(ht) * 8, 0]);
    const arms = [0, 1].map(i => {
      const k = i ? 1 : -1, A = P.arms[i], s = add(chest, add(mul(up, -3), [0, 0, k * 16]));
      const d1 = [Math.sin(A.sh) * Math.cos(A.ab), -Math.cos(A.sh) * Math.cos(A.ab), k * Math.sin(A.ab)], el = add(s, mul(d1, 22));
      const fa = A.sh + A.el, d2 = [Math.sin(fa) * Math.cos(A.ab * 0.5), -Math.cos(fa) * Math.cos(A.ab * 0.5), k * Math.sin(A.ab * 0.5)];
      return { k, s, el, hand: add(el, mul(d2, 20)), d2 };
    });
    const J = { hip, up, fp, legs, chest, neck, head, ht, arms };
    const low = Math.min(legs[0].foot[1], legs[1].foot[1]) - 4, sh = -low * (P.plant ?? 1); // Sohlen auf den Boden
    const mv = (p) => { p[1] += sh; };
    mv(hip); mv(chest); mv(neck); mv(head); legs.forEach(l => { mv(l.h); mv(l.knee); mv(l.foot); }); arms.forEach(a => { mv(a.s); mv(a.el); mv(a.hand); });
    return J;
  }
  // Mesh in Weltlage (Puffer: 1 Einheit = 1 Pixel, Ursprung zwischen den Füßen); W3: Liegen (Drehung um die Füße), Blick, Versatz
  function build(P, face0, pal) {
    const m = mesh(), J = joints(P), yaw = 0.5, ca = Math.cos(yaw), sa = Math.sin(yaw), f = face0;
    const cl = Math.cos(P.lie || 0), sl = Math.sin(P.lie || 0), ox = P.ox || 0, oy = P.oy || 0;
    const W3 = (p) => { const x = p[0] * cl - p[1] * sl, y = p[0] * sl + p[1] * cl; return [ox + f * ca * x + f * sa * p[2], oy + y, -sa * x + ca * p[2]]; };
    const V = (p) => { const q = W3(p); return vtx(m, q[0], q[1], q[2]); };
    function seg(a, b, wa, da, wb, db, col, o = {}) {
      const d = nrm(sub(b, a)); let s = Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]; s = nrm(sub(s, mul(d, dot(s, d)))); const q = cross(d, s);
      const C = (base, w, dd, i, j) => V(add(base, add(mul(s, w * i), mul(q, dd * j))));
      const v = [C(a, wa, da, -1, -1), C(a, wa, da, 1, -1), C(a, wa, da, 1, 1), C(a, wa, da, -1, 1), C(b, wb, db, -1, -1), C(b, wb, db, 1, -1), C(b, wb, db, 1, 1), C(b, wb, db, -1, 1)];
      const c = W3(mul(add(a, b), 0.5));
      face(m, [v[0], v[1], v[5], v[4]], col, c, o); face(m, [v[1], v[2], v[6], v[5]], col, c, o); face(m, [v[2], v[3], v[7], v[6]], col, c, o); face(m, [v[3], v[0], v[4], v[7]], col, c, o);
      face(m, [v[0], v[3], v[2], v[1]], o.cap || col, c, o); face(m, [v[4], v[5], v[6], v[7]], o.cap || col, c, o);
    }
    function blob(c0, rx, ry, rz, col, seg2 = 8, rings = 6) {
      const rows = [], c = W3(c0);
      for (let j = 0; j <= rings; j++) { const v = j / rings * Math.PI, row = []; for (let i = 0; i < seg2; i++) { const u = i / seg2 * Math.PI * 2; row.push(V([c0[0] + Math.cos(u) * Math.sin(v) * rx, c0[1] + Math.cos(v) * ry, c0[2] + Math.sin(u) * Math.sin(v) * rz])); } rows.push(row); }
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg2; i++) face(m, [rows[j][i], rows[j][(i + 1) % seg2], rows[j + 1][(i + 1) % seg2], rows[j + 1][i]], col, c);
    }
    const { hip, up, fp, chest, neck, head } = J, sN = J.arms[0].s, sF = J.arms[1].s;
    for (const L of J.legs) { // Beine: zerrissene Hose, schwere Stiefel
      seg(L.h, L.knee, 8, 8, 6.6, 6.6, PANTS); seg(L.knee, L.foot, 6.6, 6.6, 5.6, 5.4, PANTS2);
      seg([L.foot[0] - 4, L.foot[1] - 1.5, L.foot[2]], [L.foot[0] + 9, L.foot[1] - 2, L.foot[2]], 5, 3.4, 4.6, 2.8, BOOT);
    }
    seg(add(hip, [0, -7, 0]), add(hip, mul(up, 3)), 12.5, 9, 13, 9.4, PANTS); seg(add(hip, mul(up, 2)), add(hip, mul(up, 5)), 13.6, 10, 13.6, 10, LEATH); // Becken, Gürtel
    seg(add(hip, mul(up, 4)), add(chest, mul(up, -2)), 12, 8.6, 16.5, 10.6, TORSO); // Rumpf: schmale Hüfte, breiter Brustkorb
    seg(add(sN, [0, 2, 3]), add(sF, [0, 2, -3]), 7, 7.4, 7, 7.4, TORSO); // Schulterjoch (Nackenmuskeln)
    for (const A of J.arms) blob(add(A.s, [0, 1, 0]), 7.4, 7.6, 7, A.k < 0 ? ARMN : ARMF, 7, 4); // Schultern
    seg(add(chest, mul(up, -1)), neck, 7.4, 6.4, 5.8, 5.4, NECK); // Stiernacken
    const pc = add(add(chest, mul(up, -10)), mul(fp, 10.2)); // Kupferplatte mit Glasherz
    seg(add(pc, mul(up, -6)), add(pc, mul(up, 6)), 7.5, 1.3, 8.5, 1.3, CU); seg(add(add(pc, mul(up, -3.5)), mul(fp, 1.6)), add(add(pc, mul(up, 3.5)), mul(fp, 1.6)), 2.4, 2.2, 2.4, 2.2, pal.heart);
    for (const k of [-1, 1]) seg(add(chest, [-2, 2, k * 11]), add(pc, [0, 5, k * 6]), 1.6, 1.2, 1.6, 1.2, LEATH); // Riemen über die Schultern
    const hu = [Math.sin(J.ht), Math.cos(J.ht), 0], hw = [Math.cos(J.ht), -Math.sin(J.ht), 0], H = (f2, u2, z2 = 0) => add(head, add(add(mul(hw, f2), mul(hu, u2)), [0, 0, z2])); // Kopf: vorwärts, hoch
    blob(head, 8, 9, 7.6, HEADC); // kahler, gewölbter Schädel
    seg(H(6.4, 2.4, -5.6), H(6.4, 2.4, 5.6), 1.8, 2, 1.8, 2, NECK); // Brauenwulst
    seg(H(1.5, -6), H(7.2, -6.6), 5.8, 2.6, 5, 2.2, NECK); // schwerer Unterkiefer
    for (const k of [-1, 1]) { seg(H(0.5, 0.5, k * 6.6), H(0.5, 0.5, k * 11), 1.6, 1.6, 1.3, 1.3, CU); seg(H(0.5, 0.5, k * 11), H(0.5, 0.5, k * 12.8), 2, 2, 2, 2, pal.tip); } // Kupferelektroden an den Schläfen
    for (const A of J.arms) { // Arme: lang, Unterarme wie Keulen, Eisenmanschetten, schwere Fäuste
      seg(add(A.s, [0, 2, 0]), A.el, 6.6, 6.2, 5.2, 5.2, A.k < 0 ? ARMN : ARMF); seg(A.el, A.hand, 5, 4.8, 5.6, 5.2, A.k < 0 ? FOREN : FOREF);
      seg(add(A.hand, mul(A.d2, -6)), add(A.hand, mul(A.d2, -1)), 6.2, 5.8, 6.2, 5.8, IRONC);
      seg(A.hand, add(A.hand, mul(A.d2, 7)), 5.2, 5.4, 4.6, 4.8, HANDC);
    }
    // Leuchtpunkte und Nähte (für die 2D-Überlagerung, nur die zur Kamera gewandte Seite)
    const near = J.arms[0], ln = J.legs[0];
    const pts = {
      heart: W3(add(pc, mul(fp, 3))), tips: [W3(H(0.5, 0.5, -12.8)), W3(H(0.5, 0.5, 12.8))], eyes: [W3(H(7.4, 0.2, -3)), W3(H(7.4, 0.2, 3))], fist: W3(add(near.hand, mul(near.d2, 4))),
      seams: [
        [add(add(chest, mul(fp, 10.8)), [0, -2, -11]), add(add(chest, mul(fp, 11.2)), mul(up, -8)), add(add(hip, mul(fp, 9.4)), add(mul(up, 9), [0, 0, 5]))],
        [H(5.5, 6, -3), H(0, 9.4, -2.5), H(-6, 6.5, -3)], // über den Schädel
        [H(4, -2, -7.2), H(7, -5, -5.8)], // Wange
        [add(near.el, [0, 0, -5.4]), add(near.hand, mul(near.d2, -7)).map((v, i) => (i === 2 ? v - 5.4 : v))],
        [add(sN, [3, 2, -7.6]), add(sN, [-4, -4, -7.4])], // Schulternaht
        [add(neck, add(mul(fp, 5.8), [0, 0, -5])), add(neck, add(mul(fp, 6.2), [0, 0, 4]))],
        [add(ln.knee, [2, 4, -7]), add(ln.knee, [5, -6, -6.4])],
      ].map(l => l.map(W3)),
    };
    return { m, pts };
  }
  return { build };
})();

class Awakened extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T, tab = W.ents.find(e => e instanceof LabTable), tx = tab ? tab.cx : ax + aw / 2;
    super(tx - 44 - 15, gy - 66, 30, 66, 30, 3);
    Object.assign(this, { ax, aw, gy, tx, mini: true, score: 8000, nameKey: 'bossAwakened', music: 'boss', face: -1, ph2: false, lootY: gy - 40, walk: 0, stepN: 0, glow: 0.3, zapT: 0, sheet: true, buf: null, pts: null, seq: 0, slam2: false });
    this.go('lie');
  }
  go(s) { this.state = s; this.timer = 0; }
  vulnerable() { return !['lie', 'rise', 'roar', 'rage'].includes(this.state); }
  say(k, col) { W.popup(clamp(this.cx, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 96, tr(k), col); }
  update() {
    this.tick();
    if (this.zapT > 0) this.zapT--;
    if (this.dying) { if (this.dying % 8 === 0) W.sparks(this.cx + rnd(-16, 16), this.gy - rnd(20, 70), 6); if (this.dying % 16 === 0) Audio8.sfx('zap', this.cx); return this.updateDeath(130); }
    const p = W.player, dx = p.cx - this.cx, sp = this.ph2 ? 1.3 : 1, s = this.state, t = this.timer;
    if (!this.ph2 && this.hp <= this.maxHp / 2 && this.vulnerable()) { this.ph2 = true; this.go('rage'); Lab.strike(); this.zapT = 64; this.say('bossAwakenedRage', '#7cf0d8'); return; }
    this.glow += ((this.ph2 ? 0.9 : 0.55) + (s === 'slamUp' || s === 'wind' ? 0.3 : 0) - this.glow) * 0.08;
    let hunch = false;
    if (s === 'lie') { // der Blitz fährt in den Leib: Zucken, das Laken fliegt
      if (t === 1) { Lab.strike(); this.zapT = 92; }
      if (t % 7 === 0 && t < 92) { Audio8.sfx('zap', this.cx); W.shake = Math.max(W.shake, 2); }
      if (t === 58) { this.sheet = false; W.spawn(new LabSheet(this.tx - 44, this.gy - 26)); Audio8.sfx('whoosh', this.cx); }
      if (t > 100) { this.go('rise'); Audio8.sfx('creak', this.cx); Audio8.sfx('rise', this.cx); }
      return;
    }
    if (s === 'rise') { if (t === 40) Audio8.sfx('creak', this.cx); if (t > 64) { this.go('roar'); Audio8.sfx('roar', this.cx); W.shake = 16; Input.rumble(0.9, 0.6, 500); this.say('bossAwakenedShout', '#7cf0d8'); } return; }
    if (s === 'roar' || s === 'rage') { if (t % 6 === 0) W.sparks(this.cx + rnd(-10, 10), this.gy - 80, 3); if (t > (s === 'rage' ? 74 : 58)) this.go('walk'); this.touch(); return; }
    if (s === 'walk') { // schwerfällig heran, jeder Schritt dröhnt
      this.face = Math.sign(dx) || this.face;
      const v = Math.abs(dx) > 30 ? 0.11 * sp : 0.04; this.walk += v; if (Math.abs(dx) > 30) this.x += this.face * 0.64 * sp;
      const n = Math.floor(this.walk / Math.PI); if (n !== this.stepN) { this.stepN = n; Audio8.sfx('step', this.cx); Audio8.sfx('beat', this.cx); W.shake = Math.max(W.shake, 2); W.dust(this.cx + this.face * 6, this.gy, 3); }
      if (t > (this.ph2 ? 44 : 70)) {
        const order = this.ph2 ? ['charge', 'slam', 'throw', 'slam', 'charge', 'throw'] : ['slam', 'throw', 'charge'];
        let a = order[this.seq++ % order.length]; if (Math.abs(dx) > 150 && a === 'slam') a = 'throw';
        this.go(a === 'charge' ? 'wind' : a === 'slam' ? 'slamUp' : 'throw');
        if (a === 'charge') Audio8.sfx('growl', this.cx);
      }
    } else if (s === 'wind') { // duckt sich, scharrt, die Elektroden knistern
      this.face = Math.sign(dx) || this.face; hunch = true;
      if (t % 6 === 0) { Audio8.sfx('zap', this.cx); W.dust(this.cx - this.face * 8, this.gy, 2); }
      if (t > (this.ph2 ? 26 : 38)) { this.go('charge'); Audio8.sfx('whoosh', this.cx); W.shake = Math.max(W.shake, 4); }
    } else if (s === 'charge') { // Ansturm bis an die Wand
      hunch = true; this.x += this.face * 3.7 * sp; this.walk += 0.34;
      if (t % 3 === 0) W.dust(this.cx - this.face * 10, this.gy, 2);
      const n = Math.floor(this.walk / Math.PI); if (n !== this.stepN) { this.stepN = n; Audio8.sfx('step', this.cx); W.shake = Math.max(W.shake, 3); }
      if (this.x <= this.ax + 4 || this.x + this.w >= this.ax + this.aw - 4 || t > 110) {
        this.go('stun'); W.shake = 14; Audio8.sfx('wall', this.cx); Audio8.sfx('boom', this.cx); Input.rumble(0.7, 0.5, 300);
        W.debris(this.face > 0 ? this.ax + this.aw - 6 : this.ax + 6, this.gy - 40, '#6c3424', 10); W.sparks(this.cx + this.face * 16, this.gy - 50, 10);
      }
    } else if (s === 'stun') { if (t % 12 === 0) W.sparks(this.cx + rnd(-6, 6), this.gy - 84, 3); if (t > (this.ph2 ? 40 : 60)) this.go('walk'); }
    else if (s === 'slamUp') { // Fäuste über den Kopf, Nähte und Elektroden gleißen auf
      this.face = Math.sign(dx) || this.face;
      if (t % 5 === 0) Audio8.sfx('zap', this.cx);
      if (t > (this.ph2 ? 22 : 32)) this.go('slamDown');
    } else if (s === 'slamDown') { // Faustschlag: eine Stromwelle läuft nach beiden Seiten über den Boden
      hunch = true;
      if (t === 5) {
        W.shake = 16; Audio8.sfx('boom', this.cx); Audio8.sfx('zap', this.cx); Input.rumble(0.9, 0.7, 350);
        const hx = this.cx + this.face * 26;
        for (const d of [-1, 1]) W.spawn(new LabWave(hx, this.gy, d * (this.ph2 ? 3.1 : 2.5), this.ax, this.ax + this.aw));
        for (let i = 0; i < 8; i++) W.debris(hx + rnd(-10, 10), this.gy - 2, '#4c2c1c', 1);
        W.sparks(hx, this.gy - 4, 12);
      }
      if (t > 34) { if (this.ph2 && !this.slam2) { this.slam2 = true; this.go('slamUp'); this.timer = 10; } else { this.slam2 = false; this.go('walk'); } }
    } else if (s === 'throw') { // greift einen Kolben vom Gürtel und schleudert ihn im Bogen
      this.face = Math.sign(dx) || this.face;
      if (t === 24) {
        const h = this.pts ? this.pts.fistW : { x: this.cx, y: this.gy - 70 }, n = this.ph2 ? 3 : 1;
        for (let i = 0; i < n; i++) { const tAir = 40 + i * 9, g = 0.16, tx = clamp(p.cx + (i - (n - 1) / 2) * 34, this.ax + 12, this.ax + this.aw - 12), vy = (this.gy - 4 - h.y - 0.5 * g * tAir * tAir) / tAir; W.spawn(new LabFlask(h.x, h.y, (tx - h.x) / tAir, vy, g, this.gy)); }
        Audio8.sfx('throw', this.cx);
      }
      if (t > 46) this.go('walk');
    }
    const H = hunch ? 50 : 66; this.y = this.gy - H; this.h = H; // geduckt kleiner (über den Ansturm springen)
    this.x = clamp(this.x, this.ax + 2, this.ax + this.aw - this.w - 2);
    this.touch();
  }
  pose() {
    const s = this.state, t = this.timer, w = this.walk, ez = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2), tr2 = (a) => (Math.random() - 0.5) * a;
    const P = { hunch: 0.46, head: 0.1, legs: [{ a1: 0, a2: 0.12 }, { a1: 0, a2: 0.12 }], arms: [{ sh: 0.14, ab: 0.2, el: 0.32 }, { sh: 0.1, ab: 0.18, el: 0.28 }], lie: 0, ox: 0, oy: 0, plant: 1 };
    const walkLegs = (amp) => { for (const i of [0, 1]) { const ph = w + i * Math.PI; P.legs[i] = { a1: Math.sin(ph) * amp, a2: 0.18 + Math.max(0, Math.sin(ph + 1.7)) * amp * 1.7 }; } };
    if (this.dying) { const k = Math.min(1, this.dying / 50); P.hunch = 0.46 + k * 0.8; P.head = k * 0.7; P.legs = [{ a1: k * 1.0, a2: k * 2.0 }, { a1: -k * 0.2, a2: k * 1.7 }]; P.arms = [{ sh: 0.2 + tr2(0.2), ab: 0.3, el: 0.1 }, { sh: 0.1, ab: 0.25, el: 0.1 }]; return P; }
    if (s === 'lie' || s === 'rise') {
      const k = s === 'lie' ? 0 : ez(Math.min(1, t / 60)), tw = s === 'lie' && this.zapT > 0 ? 0.35 : 0;
      P.lie = (1 - k) * Math.PI / 2; P.plant = k; P.oy = 34 * (1 - k); P.hunch = k * 0.3; P.head = 0;
      P.legs = [{ a1: tr2(tw * 0.5), a2: 0 }, { a1: tr2(tw * 0.5), a2: 0 }]; P.arms = [{ sh: tr2(tw * 2), ab: 0.1 + tr2(tw), el: tr2(tw * 2) }, { sh: tr2(tw * 2), ab: 0.1, el: tr2(tw) }];
      return P;
    }
    if (s === 'roar' || s === 'rage') { const k = Math.min(1, t / 14); P.hunch = 0.46 - k * 0.36; P.head = -0.8 * k; P.arms = [{ sh: 0.6 * k + tr2(0.08), ab: 1.15 * k, el: 0.6 }, { sh: 0.5 * k, ab: 1.1 * k, el: 0.6 }]; P.legs = [{ a1: 0.2, a2: 0.3 }, { a1: -0.2, a2: 0.2 }]; return P; }
    if (s === 'walk') { walkLegs(0.42); P.hunch = 0.48 + Math.sin(w * 2) * 0.03; P.arms = [{ sh: -Math.sin(w) * 0.32 + 0.18, ab: 0.2, el: 0.36 }, { sh: Math.sin(w) * 0.32 + 0.14, ab: 0.18, el: 0.3 }]; return P; }
    if (s === 'wind') { P.hunch = 0.86; P.head = -0.35; P.legs = [{ a1: 0.6, a2: 1.1 }, { a1: -0.25, a2: 0.7 }]; P.arms = [{ sh: -0.75 + tr2(0.05), ab: 0.3, el: 0.7 }, { sh: -0.6, ab: 0.28, el: 0.6 }]; return P; }
    if (s === 'charge') { walkLegs(0.7); P.hunch = 1.0; P.head = -0.45; P.arms = [{ sh: 0.95 + Math.sin(w) * 0.2, ab: 0.25, el: 0.25 }, { sh: 0.85 - Math.sin(w) * 0.2, ab: 0.22, el: 0.25 }]; return P; }
    if (s === 'stun') { P.hunch = 0.68 + Math.sin(t * 0.2) * 0.08; P.head = 0.5 + Math.sin(t * 0.13) * 0.2; P.arms = [{ sh: 0.05, ab: 0.14, el: 0.08 }, { sh: 0.02, ab: 0.14, el: 0.08 }]; P.legs = [{ a1: 0.15, a2: 0.35 }, { a1: -0.1, a2: 0.3 }]; return P; }
    if (s === 'slamUp') { const k = ez(Math.min(1, t / 14)); P.hunch = 0.46 - k * 0.6; P.head = -0.5 * k; P.arms = [{ sh: 0.2 + k * 2.75, ab: 0.28, el: 0.4 * k }, { sh: 0.15 + k * 2.7, ab: 0.26, el: 0.4 * k }]; P.legs = [{ a1: 0.15, a2: 0.2 }, { a1: -0.15, a2: 0.2 }]; return P; }
    if (s === 'slamDown') { const k = Math.min(1, t / 5); P.hunch = -0.14 + k * 1.3; P.head = -0.2; P.arms = [{ sh: 2.95 - k * 1.65, ab: 0.24, el: 0.4 - k * 0.3 }, { sh: 2.85 - k * 1.6, ab: 0.22, el: 0.4 - k * 0.3 }]; P.legs = [{ a1: 0.55 * k, a2: 1.05 * k }, { a1: -0.3 * k, a2: 0.75 * k }]; return P; }
    if (s === 'throw') { const k = t < 22 ? ez(Math.min(1, t / 16)) : 1, r = t < 22 ? 0 : ez(Math.min(1, (t - 22) / 6)); P.hunch = 0.4 + r * 0.25; P.arms = [{ sh: 0.14 - k * 2.4 + r * 4.0, ab: 0.35, el: 1.1 * k - r }, { sh: 0.5, ab: 0.2, el: 0.4 }]; P.legs = [{ a1: 0.25 * r, a2: 0.3 }, { a1: -0.2, a2: 0.2 + 0.2 * r }]; return P; }
    return P;
  }
  lightUp(L, cx, cy) {
    if (!this.pts || this.sheet) return;
    const g = this.glow, q = this.pts;
    L.push({ x: q.heartW.x - cx, y: q.heartW.y - cy, r: 26 + g * 8, c: [90, 255, 160], a: 0.22 + g * 0.14 });
    L.push({ x: this.cx - cx, y: this.gy - 40 - cy, r: 56, c: null }); // er bleibt im Dunkel sichtbar
    for (const tp of q.tipsW) L.push({ x: tp.x - cx, y: tp.y - cy, r: 12 + g * 6, c: [150, 200, 255], a: 0.3 });
  }
  draw(ctx) {
    const BW = 200, BH = 140, OY = 8, cx = W.cam.x, cy = W.cam.y, X = Math.round(this.cx - cx - BW / 2), Y = Math.round(this.gy - cy - BH + OY);
    if (this.sheet) { Lab.drawSheet(ctx, this.tx - 44 - cx, this.gy - 25 - cy, this.t, 0); this.drawZap(ctx); return; }
    if (this.dying && this.dying > 100 && (this.dying & 2)) return;
    if (!this.buf) { this.buf = Sprites.canvas(BW, BH); this.bx = this.buf.getContext('2d', { willReadFrequently: true }); }
    const x = this.bx, fl = FX.stormOn(W.storm), g = this.glow, pal = { heart: [100 + g * 140, 255, 170], tip: [170 + g * 80, 220 + g * 30, 255] };
    const { m, pts } = AwakenedModel.build(this.pose(), this.face, pal);
    const cam = { x: 0, y: BH / 2 + 500 - OY, z: -1500, yaw: 0, pitch: 0, f: 1500, near: 100, cx: BW / 2, cy: BH / 2 - 500 };
    x.clearRect(0, 0, BW, BH);
    PS2.render(x, BW, BH, [m], cam, fl ? Awakened.ENVF : Awakened.ENV);
    const pr = (p) => PS2.project(cam, BW, BH, p[0], p[1], p[2]);
    if (this.flash) { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(0, 0, BW, BH); x.restore(); }
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    const a = 0.45 + g * 0.45 + Math.sin(this.t * 0.2) * 0.08;
    for (const line of pts.seams) { // glimmende Nähte mit Stichen
      const q = line.map(pr);
      x.strokeStyle = `rgba(90,255,170,${(a * 0.35).toFixed(3)})`; x.lineWidth = 3; x.beginPath(); q.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
      x.strokeStyle = `rgba(190,255,215,${a.toFixed(3)})`; x.lineWidth = 1; x.stroke();
      x.fillStyle = `rgba(210,255,225,${a.toFixed(3)})`;
      for (let i = 1; i < q.length; i++) { const [x0, y0] = q[i - 1], [x1, y1] = q[i], n = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 3)), nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1; for (let k = 0; k <= n; k++) { const px = x0 + (x1 - x0) * k / n, py = y0 + (y1 - y0) * k / n; x.fillRect(Math.round(px + nx / nl * 1.5), Math.round(py + ny / nl * 1.5), 1, 1); x.fillRect(Math.round(px - nx / nl * 1.5), Math.round(py - ny / nl * 1.5), 1, 1); } }
    }
    const hp = pr(pts.heart), gr = x.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 9 + g * 6); gr.addColorStop(0, `rgba(170,255,200,${(0.6 + g * 0.3).toFixed(3)})`); gr.addColorStop(1, 'rgba(60,255,140,0)'); x.fillStyle = gr; x.fillRect(hp[0] - 16, hp[1] - 16, 32, 32);
    const tips = pts.tips.map(pr);
    for (const tp of tips) { const r = 5 + g * 5, gg = x.createRadialGradient(tp[0], tp[1], 0, tp[0], tp[1], r); gg.addColorStop(0, 'rgba(230,240,255,0.95)'); gg.addColorStop(1, 'rgba(120,170,255,0)'); x.fillStyle = gg; x.fillRect(tp[0] - r, tp[1] - r, r * 2, r * 2); }
    pts.eyes.map(pr).forEach((e, i) => { x.fillStyle = i ? 'rgba(120,255,170,0.5)' : '#c8ffd8'; x.fillRect(Math.round(e[0]) - 1, Math.round(e[1]), 2, 1); const eg = x.createRadialGradient(e[0], e[1], 0, e[0], e[1], 4); eg.addColorStop(0, 'rgba(110,255,160,0.7)'); eg.addColorStop(1, 'rgba(60,255,140,0)'); x.fillStyle = eg; x.fillRect(e[0] - 4, e[1] - 4, 8, 8); }); // glimmende Augen
    const s = this.state;
    if (s === 'slamUp' || s === 'wind' || s === 'rage' || s === 'roar' || (this.ph2 && this.t % 40 < 6)) Lab.zap(x, tips[0][0], tips[0][1], tips[1][0], tips[1][1] - 6, this.t >> 1, 5, 0.9); // Überschlag zwischen den Elektroden
    if (s === 'slamUp') { const f = pr(pts.fist); Lab.zap(x, tips[0][0], tips[0][1], f[0], f[1], (this.t >> 1) + 9, 6, 0.8); }
    if (s === 'throw' && this.timer < 24) { const f = pr(pts.fist); x.fillStyle = '#e8fff0'; x.fillRect(Math.round(f[0]) - 2, Math.round(f[1]) - 4, 4, 7); const fg = x.createRadialGradient(f[0], f[1], 0, f[0], f[1], 10); fg.addColorStop(0, 'rgba(120,255,170,0.9)'); fg.addColorStop(1, 'rgba(60,255,140,0)'); x.fillStyle = fg; x.fillRect(f[0] - 10, f[1] - 10, 20, 20); }
    x.restore();
    ctx.drawImage(this.buf, X, Y);
    const toW = (p) => ({ x: X + p[0] + cx, y: Y + p[1] + cy });
    this.pts = { heartW: toW(hp), tipsW: tips.map(toW), fistW: toW(pr(pts.fist)) };
    this.lastDraw = { s: { c: this.buf, f: this.buf, w: BW, h: BH, pad: 0 }, x: X + cx, y: Y + cy, flip: false };
    this.drawZap(ctx);
  }
  drawZap(ctx) { // Lichtbögen von den Elektrodenarmen des Galgens in den Leib (Erweckung, Raserei)
    if (this.zapT <= 0) return;
    const k = Math.min(1, this.zapT / 20), tgt = this.pts && !this.sheet ? [this.pts.tipsW[0], this.pts.heartW] : [{ x: this.tx - 14, y: this.gy - 38 }, { x: this.tx + 30, y: this.gy - 36 }];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    Lab.GTIP.forEach((g, i) => { const p = Lab.proj(g[0], g[1], g[2]), q = tgt[i]; Lab.zap(ctx, p[0], p[1], q.x - W.cam.x, q.y - W.cam.y, (this.t >> 1) * 5 + i, 12, k); });
    ctx.restore();
  }
}
Awakened.ENV = { sun: (() => { const v = [-0.45, 0.7, -0.55], l = Math.hypot(...v); return v.map(c => c / l); })(), sunC: [0.66, 0.66, 0.74], amb: [0.32, 0.37, 0.35], sky: [0.1, 0.16, 0.12], fog: [0, 0, 0], fogD: 0 };
Awakened.ENVF = { sun: Awakened.ENV.sun, sunC: [1, 1, 1.1], amb: [0.8, 0.82, 0.92], sky: [0.3, 0.3, 0.36], fog: [0, 0, 0], fogD: 0 };
if (typeof BOSSES !== 'undefined') BOSSES.awakened = Awakened;

// Stromwelle: läuft nach dem Faustschlag über den Boden bis an den Rand der Halle (drüberspringen)
class LabWave extends Ent {
  constructor(x, floor, vx, x0, x1) { super(x - 7, floor - 16, 14, 16); this.kind = 'eproj'; this.vx = vx; this.x0 = x0; this.x1 = x1; this.unstoppable = true; this.dmg = 2; this.floor = floor; }
  update() {
    this.t++; this.x += this.vx;
    if (this.x < this.x0 - 14 || this.x > this.x1 || this.t > 260) this.dead = true;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.t % 2 === 0) W.spawn(new Particle(this.cx + rnd(-4, 4), this.floor - 2, -this.vx * 0.2 + rnd(-0.5, 0.5), rnd(-1.6, -0.5), Math.random() < 0.5 ? '#a4e4fc' : '#fcfcfc', 14, 1, 0.08));
    if (this.t % 10 === 0) Audio8.sfx('flameTick', this.cx);
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.floor - 8 - cy, r: 34, c: [140, 200, 255], a: 0.55 }); }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.floor - W.cam.y), d = Math.sign(this.vx);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, 20); g.addColorStop(0, 'rgba(200,230,255,0.7)'); g.addColorStop(1, 'rgba(100,160,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 20, y - 24, 40, 26);
    for (let k = 0; k < 3; k++) Lab.zap(ctx, x - d * k * 5, y, x - d * k * 5 + rnd(-3, 3), y - 16 + k * 3, this.t * 3 + k, 3, 1 - k * 0.25);
    Lab.zap(ctx, x - d * 22, y - 1, x + d * 4, y - 2, this.t * 7, 3, 0.6);
    ctx.restore();
  }
}
// Glühender Kolben: fliegt im Bogen, zerspringt am Boden zu einer Strompfütze
class LabFlask extends Ent {
  constructor(x, y, vx, vy, g, floor) { super(x - 3, y - 4, 6, 8); this.kind = 'eproj'; this.type = 'flask'; this.vx = vx; this.vy = vy; this.g = g; this.floor = floor; this.dmg = 2; }
  update() {
    this.t++; this.vy += this.g; this.x += this.vx; this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.burst(); return; }
    if (this.y + this.h >= this.floor) { this.y = this.floor - this.h; this.burst(); }
  }
  burst() {
    this.dead = true; Audio8.sfx('shatter', this.cx); Audio8.sfx('zap', this.cx);
    W.spawn(new LabPuddle(this.cx, this.floor));
    for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx, this.floor - 4, rnd(-1.8, 1.8), rnd(-2.6, -0.6), i % 3 ? '#7cf8b0' : '#e8fff0', 24, 1, 0.14));
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 24, c: [90, 255, 160], a: 0.6 }); }
  draw(ctx) {
    const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), k = (this.t >> 2) & 3;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * Math.PI / 2 + this.t * 0.05);
    ctx.fillStyle = '#d8f0e8'; ctx.fillRect(-3, -2, 6, 6); ctx.fillStyle = '#5cf898'; ctx.fillRect(-2, 0, 4, 3); ctx.fillStyle = '#8c6c40'; ctx.fillRect(-1, -5, 2, 3); ctx.fillStyle = '#fcfcfc'; ctx.fillRect(-2, -1, 1, 1);
    ctx.restore();
  }
}
class LabPuddle extends Ent { // grüne Pfütze, die knisternd unter Strom steht (nur am Boden gefährlich)
  constructor(x, floor) { super(x - 18, floor - 6, 36, 6); this.kind = 'eproj'; this.unstoppable = true; this.dmg = 2; this.floor = floor; this.life = 90; }
  update() { this.t++; if (this.t > this.life) this.dead = true; const p = W.player; if (this.t > 6 && p.alive && p.onGround && Math.abs(p.feet - this.floor) < 3 && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx); }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.floor - 4 - cy, r: 30, c: [90, 255, 170], a: 0.45 * (1 - this.t / this.life) }); }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.floor - W.cam.y), a = Math.min(1, (this.life - this.t) / 30);
    ctx.globalAlpha = a; ctx.fillStyle = '#1c6c40'; ctx.fillRect(x + 2, y - 2, 32, 2); ctx.fillStyle = '#58f898'; ctx.fillRect(x + 4, y - 2, 28, 1); ctx.fillRect(x, y - 1, 36, 1); ctx.globalAlpha = 1;
    if (this.t > 6 && this.t % 4 < 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; Lab.zap(ctx, x + 4 + (this.t * 7) % 28, y - 1, x + 8 + (this.t * 11) % 24, y - 9, this.t, 3, a); ctx.restore(); }
  }
}
// Das Laken fliegt beim Erwachen davon (nur Effekt)
class LabSheet extends Ent {
  constructor(x, y) { super(x, y - 14, 96, 14); this.kind = 'fx'; this.vy = -3.2; this.vx = 0.9; this.rot = 0; }
  update() { this.t++; this.vy += 0.06; this.x += this.vx; this.y += this.vy; this.rot += 0.02; if (this.t > 120) this.dead = true; }
  draw(ctx) {
    const x = this.x - W.cam.x, y = this.y - W.cam.y, a = Math.max(0, 1 - this.t / 120);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x + 48, y + 7); ctx.rotate(this.rot);
    for (let u = -48; u < 48; u++) { const h = 6 + Math.sin(u * 0.2 + this.t * 0.3) * 4; ctx.fillStyle = u % 9 === 0 ? '#9c988c' : '#d8d4c4'; ctx.fillRect(u, -h / 2 + Math.sin(u * 0.08 + this.t * 0.2) * 5, 1, h); }
    ctx.restore();
  }
}
