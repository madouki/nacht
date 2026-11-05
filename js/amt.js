// Der Amtsschimmel (Schloss-Modus, Zwischengegner im Amt für Heldentaten links vom Rohrpostamt): ein Schimmel aus Leitz-Ordnern –
// weiße und apfelgraue Ordner als Rumpf, Kruppe und Brust (Rücken mit Etikett, Griffloch und Metallkante zum Betrachter), Ordner als
// Beine, Holzstempel als Hufe, ein Hals wie eine Fächermappe mit einer Mähne aus losen Blättern, das rote Amtsband mit Siegel um den
// Bauch, und der Kopf ist ein Stempel mit einem Pferdekopf aus gefaltetem Papier als Griff (Blender-Netz, js/amtmesh.js). PS2-Low-
// Poly wie der Steingolem (ps2.js), gezeichnet nach dem Licht. Auftritt: In der Kammer liegt ein Haufen Ordner; betritt der Held
// sie, fliegen die Ordner der Reihe nach an ihren Platz, das Amtsband schnürt sich zu, die Augen glühen – dann der Urschrei (er
// bäumt sich auf, die Wände wackeln), erst danach Namensband, Wortgeplänkel und Kampf. Angriffe: STEMPEL – der Kopf hebt sich,
// folgt dem Helden (Schatten am Boden) und knallt herab, danach steckt er kurz fest und ist vom Boden aus treffbar (roter Abdruck);
// FORMULARSTURM – er schnaubt Wellen von Formularen, abwechselnd in Kopfhöhe (ducken) und knapp über dem Boden (springen);
// AKTENLAWINE – er bäumt sich auf und stampft, Akten fallen aus den Regalen (vorher rieselt Staub). Treffbar ist nur der Stempelkopf.
// Ab halber Energie: nächste Instanz – schneller, Doppelstempel, mehr Formulare und Akten. Besiegt fällt er wieder zum Haufen.
'use strict';

class AmtFile extends Ent { // Akte aus dem obersten Regalfach: erst rieselt Staub, dann fällt sie und platzt in lose Blätter
  constructor(x, gy, dmg) {
    super(x - 8, W.cam.y - 22, 16, 12); this.kind = 'eproj'; this.gy = gy; this.dmg = dmg; this.vy = 0; this.warn = 36;
    this.col = ['#c8a868', '#5c7c9c', '#9c3c3c', '#6c8c4c'][Math.floor(Math.random() * 4)];
  }
  update() {
    this.t++;
    if (this.warn > 0) { if (--this.warn % 4 === 0) W.spawn(new Particle(this.cx + rnd(-7, 7), W.cam.y + 2, rnd(-0.2, 0.2), rnd(0.5, 1), '#a89c84', 24, 1, 0.04)); return; }
    this.vy = Math.min(6.5, this.vy + 0.3); this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.y + this.h >= this.gy) {
      this.dead = true; W.shake = Math.max(W.shake, 3); Audio8.sfx('crumble', this.cx);
      for (let i = 0; i < 9; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.gy - 4, rnd(-1.6, 1.6), rnd(-2.4, -0.6), i % 3 ? '#f0ead8' : this.col, 40, 2, 0.06)); // lose Blätter flattern
    }
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
    if (this.warn > 0) { ctx.fillStyle = 'rgba(168,156,132,0.45)'; ctx.fillRect(x + 3, 0, 10, 2); return; } // Staub aus dem Regal
    ctx.fillStyle = '#1c1820'; ctx.fillRect(x - 1, y - 1, 18, 14);
    ctx.fillStyle = this.col; ctx.fillRect(x, y, 16, 12);
    ctx.fillStyle = '#f0ead8'; ctx.fillRect(x + 2, y + 3, 7, 4); ctx.fillRect(x + 12, y + 1, 2, 10); // Etikett, Rücken
    ctx.fillStyle = '#2c2830'; ctx.fillRect(x + 12, y + 5, 2, 2);                                     // Griffloch
  }
}

// ---------------- Modell: ein Schimmel aus Leitz-Ordnern ----------------
// Jedes Teil hat eine Lage { c: Mitte, r: Rollen um z (Bildebene), y: Gieren um die Hochachse } im Raum des Bosses (x nach vorn
// zum Helden, y hoch ab Boden, z in die Tiefe). Rumpf und Beine stehen schräg zum Betrachter (YAW) und bäumen sich um die
// Hinterhufe auf (rear: tf); Hals und Stempelkopf liegen ungedreht in der Spielebene – der Stempel trifft genau, wo der Held steht.
// Beim Auftritt liegt jedes Teil auf dem Haufen (PILE) und fliegt im Bogen und mit Drall an seinen Platz.
const AmtModel = (() => {
  const WH = [238, 234, 224], G1 = [208, 210, 214], G2 = [180, 184, 192], G3 = [150, 154, 164], LAB = [252, 250, 240], INK = [92, 104, 140];
  const MINT = [206, 236, 206], REG = [[244, 176, 186], [244, 224, 140], [160, 196, 244], [170, 226, 170]]; // Endlospapier-Streifen, Registerblätter
  const HOLE = [40, 36, 44], RIM = [156, 162, 174], RED = [190, 32, 44], REDD = [128, 18, 28], GOLD = [236, 192, 84], WOOD = [116, 76, 44], WOOD2 = [150, 100, 58];
  const HC = { DARK: [40, 36, 44], GREY: [176, 172, 172], PAPER: [240, 236, 222], PAPERB: [222, 216, 198], PAPERC: [250, 248, 240], PINK: [236, 196, 190], PLATE: [200, 26, 40], WOOD, WOOD2 };
  const LEGS = [[40, -18, 0], [40, 18, Math.PI], [-52, -18, Math.PI], [-52, 18, 0]]; // Hüfte x, Seite z (vorn = −), Trabphase
  const XS = [-76, -59, -42, -25, -8, 9, 26, 43], TOP = [100, 104, 102, 99, 98, 100, 104, 108], BOT = [60, 56, 53, 51, 50, 51, 53, 57], BODY = [WH, G1, WH, G2, WH, G1, WH, G1];
  const NECK = 9, PARTS = [];
  LEGS.forEach((l, i) => PARTS.push({ t: 'hoof', leg: i, th: 9 }));
  LEGS.forEach((l, i) => PARTS.push({ t: 'shin', leg: i, w: 12, d: 14, col: i % 2 ? G3 : G2, th: 12 }));
  LEGS.forEach((l, i) => PARTS.push({ t: 'thigh', leg: i, w: 15, d: 17, col: i % 2 ? G2 : G1, th: 15 }));
  [3, 4, 2, 5, 1, 6, 0, 7].forEach(i => PARTS.push({ t: 'fold', x: XS[i], y0: BOT[i], y1: TOP[i], w: 17, d: 48, col: BODY[i], th: 17 })); // Rumpf von der Mitte nach außen
  PARTS.push({ t: 'lie', x: -92, y0: 64, y1: 80, len: 30, d: 40, col: G1, th: 16 }, { t: 'lie', x: -90, y0: 80, y1: 96, len: 26, d: 42, col: WH, th: 16 }); // Kruppe
  PARTS.push({ t: 'lie', x: 63, y0: 62, y1: 78, len: 28, d: 40, col: WH, th: 16 }, { t: 'lie', x: 61, y0: 78, y1: 96, len: 28, d: 42, col: G1, th: 16 }); // Brust
  for (let i = 0; i < NECK; i++) PARTS.push({ t: 'neck', i, th: 7 });
  PARTS.push({ t: 'head' });
  const CROUP = PARTS.findIndex(p => p.t === 'lie'), N0 = PARTS.findIndex(p => p.t === 'neck');
  // Haufen: fünf Lagen, unten breit, oben schmal; die Teile liegen kreuz und quer in zufälligen Fächern, obenauf der Stempel
  let seed = 1913; const rn = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const slots = [];
  [[11, 74], [9, 56], [7, 38], [4, 20], [2, 8]].forEach(([n, wd], layer) => { for (let k = 0; k < n; k++) slots.push({ x: 8 - wd + (k + 0.5) / n * 2 * wd + (rn() - 0.5) * 9, layer }); });
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rn() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const PILE = PARTS.map((p, i) => {
    if (p.t === 'head') return { c: [10, 5 * 12 + 15, -4], r: 0.32, y: -0.35 };
    const s = slots[i], lie = p.t !== 'hoof';
    return { c: [s.x, s.layer * 12 + p.th / 2 - (s.layer ? 2 : 0), (rn() - 0.5) * 34], r: lie ? Math.PI / 2 * (rn() < 0.5 ? 1 : -1) + (rn() - 0.5) * 0.3 : (rn() - 0.5) * 0.4, y: (rn() - 0.5) * 2.4 };
  });
  const SPIN = PARTS.map((p, i) => (p.t === 'head' ? 0 : ((i * 7) % 3 - 1) * Math.PI * 2));
  const YAW = () => Amtsschimmel.YAW;
  // ---- Bausteine ----
  function xf(P, x, y, z) { // Teil-Rahmen → Boss-Raum
    const cr = Math.cos(P.r), sr = Math.sin(P.r), cy = Math.cos(P.y), sy = Math.sin(P.y), X = x * cr - y * sr, Y = x * sr + y * cr;
    return [P.c[0] + X * cy - z * sy, P.c[1] + Y, P.c[2] + X * sy + z * cy];
  }
  function fbox(m, P, ox, oy, oz, w, h, d, col, rr = 0) { // gedrehter Quader im Teil-Rahmen (Versatz o, eigene Neigung rr)
    const c2 = Math.cos(rr), s2 = Math.sin(rr), I = [];
    for (const [a, b, e] of [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]) {
      const lx = a * w / 2, ly = b * h / 2, q = xf(P, ox + lx * c2 - ly * s2, oy + lx * s2 + ly * c2, oz + e * d / 2);
      I.push(PS2.vtx(m, q[0], q[1], q[2]));
    }
    const C = xf(P, ox, oy, oz), [A, B, Cc, D, E, F, G, H] = I;
    for (const q of [[A, B, F, E], [B, Cc, G, F], [Cc, D, H, G], [D, A, E, H], [E, F, G, H], [A, D, Cc, B]]) PS2.face(m, q, col, C);
  }
  function decal(m, P, ox, oy, z, w, h, col, rr = 0) { // flaches Schild auf der Vorderseite (−z) eines Teils
    const c2 = Math.cos(rr), s2 = Math.sin(rr), I = [];
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = a * w / 2, ly = b * h / 2, q = xf(P, ox + lx * c2 - ly * s2, oy + lx * s2 + ly * c2, z); I.push(PS2.vtx(m, q[0], q[1], q[2])); }
    PS2.face(m, I, col, xf(P, ox, oy, z + 6));
  }
  const TABS = [[84, 116, 196], [196, 56, 52], [72, 146, 84], [232, 188, 56]]; // farbige Reiter auf den Etiketten (blau, rot, grün, gelb)
  function folder(m, P, w, h, d, col, F, lab = true, tab = 0) { // Leitz-Ordner: Rücken zum Betrachter – Etikett im Rahmen mit Reiter und Beschriftung, Griffloch im Metallring, Metallkante
    fbox(m, P, 0, 0, 0, w, h, d, F(col));
    const z = -d / 2 - 0.5, lh = Math.min(h * 0.3, 14), ly = h * 0.2, r = w * 0.46;
    if (lab) {
      decal(m, P, 0, ly, z, w * 0.72, lh + 2, F(G3)); decal(m, P, 0, ly, z - 0.15, w * 0.6, lh, F(LAB));
      decal(m, P, 0, ly + lh / 2 - 1.4, z - 0.3, w * 0.6, 2.4, F(TABS[tab % 4]));
      decal(m, P, 0, ly - lh * 0.05, z - 0.3, w * 0.42, 1.1, F(INK)); decal(m, P, -w * 0.06, ly - lh * 0.3, z - 0.3, w * 0.3, 1.1, F(INK));
    }
    decal(m, P, 0, -h * 0.17, z, r, r, F(RIM)); decal(m, P, 0, -h * 0.17, z - 0.15, r * 0.62, r * 0.62, F(HOLE));
    decal(m, P, 0, -h / 2 + 1.3, z, w, 2.4, F(RIM));
  }
  const HS = 1.15, HY = 17 * (HS - 1); // Kopf 15 % größer; die Unterkante der Gummiplatte bleibt bei y = -17 (der Stempel trifft wie vorher)
  const hp = (x, y) => [x * HS, y * HS + HY];
  function head(m, P, F, eye, ink) { // Blender-Netz mit eigenen Normalen; Augen glühen, die Gummiplatte färbt sich mit Tinte. Dazu Zaumzeug aus Amtsband
    const Hm = AMT_HEAD, base = m.v.length / 3, cr = Math.cos(P.r), sr = Math.sin(P.r), cy = Math.cos(P.y), sy = Math.sin(P.y);
    for (let i = 0; i < Hm.v.length; i += 3) { const q = xf(P, Hm.v[i] * HS, Hm.v[i + 1] * HS + HY, Hm.v[i + 2] * HS); m.v.push(q[0], q[1], q[2]); }
    for (const f of Hm.f) {
      const k = Hm.k[f[0]], X = f[1] * cr - f[2] * sr, Y = f[1] * sr + f[2] * cr, n = [X * cy - f[3] * sy, Y, X * sy + f[3] * cy];
      let col, e = 0;
      if (k === 'EYE') { col = [255, 60 + 140 * eye, 40]; e = 0.3 + eye * 0.9; } else { col = F(HC[k]); if (k === 'PLATE') e = 0.12 + ink * 0.4; }
      m.f.push({ i: f.slice(4).map(j => j + base), c: col, n, e, two: false, a: 1 });
    }
    // Zaumzeug: Nasenriemen und Genickstück aus rotem Amtsband, Backenriemen, goldenes Siegelmedaillon; Glanzlichter in den Augen
    const [nx, ny] = hp(18, 2), [gx, gy2] = hp(-5, 7.5), [cx2, cy2] = hp(6.5, 3), [mx, my] = hp(-5, 4), [ex, ey] = hp(2.6, 11.6);
    fbox(m, P, nx, ny, 0, 3, 23 * HS, 19 * HS, F(RED)); fbox(m, P, gx, gy2, 0, 3.2, 32 * HS, 24.5 * HS, F(RED));
    for (const s of [-1, 1]) fbox(m, P, cx2, cy2, s * 11.4 * HS, 24 * HS, 2.4, 0.9, F(RED), -0.17);
    decal(m, P, mx, my, -12.3 * HS, 6, 6, F(GOLD), Math.PI / 4); decal(m, P, mx, my, -12.5 * HS, 2.5, 2.5, F(REDD));
    if (eye > 0.2) for (const s of [-1, 1]) decal(m, P, ex, ey, s * 11.3 * HS, 1.6, 1.4, [255, 250, 230]);
  }
  function part(m, i, P, F, b, ex) { // ein Teil an seiner Lage zeichnen
    const p = PARTS[i];
    if (p.t === 'hoof') { fbox(m, P, 0, 1, 0, 16, 7, 16, F(WOOD)); fbox(m, P, 0, -3.5, 0, 17, 2, 17, F(RED)); fbox(m, P, 0, 5.5, 0, 6, 3, 6, F(WOOD2)); fbox(m, P, 0, 4.4, 0, 16.8, 1.4, 16.8, F(GOLD)); } // Messingring am Huf
    else if (p.t === 'shin' || p.t === 'thigh') {
      const L = ex ? ex.L : p.t === 'shin' ? 26 : 30;
      if (ex && LEGS[p.leg][1] > 0) fbox(m, P, 0, 0, 0, p.w, L, p.d, F(p.col)); // Beine auf der abgewandten Seite: verdeckt, ohne Etiketten (spart Flächen)
      else folder(m, P, p.w, L, p.d, p.col, F, p.t === 'thigh', i);
    }
    else if (p.t === 'fold') folder(m, P, p.w, p.y1 - p.y0, p.d, p.col, F, true, i);
    else if (p.t === 'lie') folder(m, P, p.y1 - p.y0, p.len, p.d, p.col, F, true, i);
    else if (p.t === 'neck') {
      const L = ex ? ex.L : 9, u = (p.i + 0.5) / NECK, hh = 26 - 6 * u;
      fbox(m, P, 0, 0, 0, L * 1.06 + 0.5, hh, 22 - 4 * u, F(p.i % 2 ? G2 : WH));
      if (ex) for (const s of [-1, 1]) { // Mähne aus Endlospapier (weiß und lindgrün gestreift), zwei Lagen, flattert im Takt
        const fl = Math.sin((b ? b.t : 0) * 0.2 + p.i * 1.3 + s) * 0.5;
        fbox(m, P, -1 + s, hh / 2 + 6, s * 3, Math.max(6, L * 0.9), 15 - u * 4, 1.6, F((p.i + (s > 0 ? 1 : 0)) % 2 ? MINT : WH), fl - 0.25);
      }
    } else if (p.t === 'head') head(m, P, F, b ? b.eye : 0, b ? b.ink : 0);
  }
  // ---- Lagen am fertigen Pferd ----
  function legGeo(b, i) {
    const [lx, lz, off] = LEGS[i], ph = b.walk + off, lift = Math.max(0, Math.sin(ph)) * 8, sw = Math.cos(ph) * 5, front = lx > 0, up = front ? b.rear * 30 : 0;
    return { lx, lz, kx: lx + sw * 0.5 + (front ? b.rear * 16 : 0), ky: 30 + lift * 0.6 + up * 0.5, hx: lx + sw + (front ? b.rear * 6 : 0), hy: 8 + lift + up };
  }
  function seg(b, x0, y0, x1, y1, z, extra) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; return { P: { c: b.tf((x0 + x1) / 2, (y0 + y1) / 2, z), r: Math.atan2(-dx / L, dy / L) + b.rear * 0.42, y: YAW() }, L: L + extra }; }
  function finalPose(b, i) { // → { P, L? }
    const p = PARTS[i], pa = b.rear * 0.42;
    if (p.t === 'hoof') { const g = legGeo(b, p.leg); return { P: { c: b.tf(g.hx + 2, g.hy - 5, g.lz), r: pa, y: YAW() } }; }
    if (p.t === 'shin') { const g = legGeo(b, p.leg); return seg(b, g.kx, g.ky, g.hx + 1, g.hy - 1, g.lz, 3); }
    if (p.t === 'thigh') { const g = legGeo(b, p.leg); return seg(b, g.lx, 60, g.kx, g.ky, g.lz, 4); }
    if (p.t === 'fold') return { P: { c: b.tf(p.x, (p.y0 + p.y1) / 2, 0), r: pa, y: YAW() } };
    if (p.t === 'lie') return { P: { c: b.tf(p.x, (p.y0 + p.y1) / 2, 0), r: pa + Math.PI / 2, y: YAW() } };
    if (p.t === 'neck') { // Fächermappe vom Widerrist zum Kopf: zieht sich beim Stempeln weit aus
      const N = b.tf(46, 94, 0), ex = b.head.x - 16, ey = b.head.y + 2, u = (p.i + 0.5) / NECK, len = Math.hypot(ex - N[0], ey - N[1]);
      return { P: { c: [N[0] + (ex - N[0]) * u, N[1] + (ey - N[1]) * u, N[2] * (1 - u)], r: Math.atan2(ey - N[1], ex - N[0]), y: 0 }, L: len / NECK };
    }
    return { P: { c: [b.head.x, b.head.y, 0], r: b.headTilt || 0, y: 0 } };
  }
  function mix(A, B, e, i) { // Flug vom Haufen an den Platz: Bogen, Drall, weich ankommen
    const ee = e * e * (3 - 2 * e), hop = (28 + Math.hypot(B.c[0] - A.c[0], B.c[1] - A.c[1]) * 0.35) * Math.sin(Math.PI * e), rB = B.r + SPIN[i];
    return { c: [A.c[0] + (B.c[0] - A.c[0]) * ee, A.c[1] + (B.c[1] - A.c[1]) * ee + hop, A.c[2] + (B.c[2] - A.c[2]) * ee], r: A.r + (rB - A.r) * ee, y: A.y + (B.y - A.y) * ee };
  }
  // ---- ganzes Netz ----
  function build(b) { // b: der Amtsschimmel (asm: Fortschritt je Teil, null = fertig)
    const m = PS2.mesh(), fl = b.flashT > 0, F = (c) => (fl ? [240, 240, 240] : c);
    for (let i = 0; i < PARTS.length; i++) {
      const a = b.asm ? b.asm[i] : 1;
      if (a >= 1) { const f = finalPose(b, i); part(m, i, f.P, F, b, f); }
      else if (a <= 0) part(m, i, PILE[i], F, b, null);
      else { const f = finalPose(b, i); part(m, i, mix(PILE[i], f.P, a, i), F, b, f); }
    }
    const done = (i) => !b.asm || b.asm[i] >= 1;
    if (done(CROUP)) for (let i = 0; i < 7; i++) { // Schweif aus Endlospapier: sieben Bahnen in zwei Gliedern, die Welle läuft nach hinten
      const wv = Math.sin(b.t * 0.12 + i * 0.9), A = b.tf(-102, 92 - i * 2.4, -9 + i * 3), M = b.tf(-114 - i * 1.5, 70 + wv * 4 - i * 2, -10 + i * 3.3), B2 = b.tf(-122 - i * 2.5, 38 + Math.sin(b.t * 0.12 + i * 0.9 - 1.2) * 7 - i * 3, -11 + i * 3.6);
      const col = F(i % 2 ? MINT : WH);
      PS2.beam(m, A[0], A[1], A[2], M[0], M[1], M[2], 4, 1.5, col, { open: true }); PS2.beam(m, M[0], M[1], M[2], B2[0], B2[1], B2[2], 3.4, 1.4, col, { open: true });
    }
    if (b.tie > 0) { // Schabracke aus Registerblättern über dem Rücken (bunte Reiter an der Kante), fällt beim Zuschnüren herab
      const k = Math.min(1, b.tie * 1.6), drop = (1 - k) * 22;
      XS.forEach((x, i) => {
        if (x < -60 || x > 30) return;
        const P = { c: b.tf(x, TOP[i] + 1.6 + drop, 0), r: b.rear * 0.42, y: YAW() }, c = REG[i % 4];
        fbox(m, P, 0, 0, 0, 17.6, 3, 55, F(c));
        fbox(m, P, 0, -5, -27.6, 17.6, 10, 1, F(c));                                             // Lasche an der Flanke
        fbox(m, P, i % 2 ? -4 : 4, -11.5, -27.8, 6, 3.5, 1, F(TABS[(i + 1) % 4]));               // Reiter
      });
    }
    if (b.tie > 0) { // rotes Amtsband um den Bauch, Siegel auf der Flanke, Schleife oben
      const P = { c: b.tf(-8, 77, 0), r: b.rear * 0.42, y: YAW() }, k = b.tie;
      fbox(m, P, 0, 0, 0, 7, 58 * k, 60, F(RED));
      if (k >= 1) {
        decal(m, P, 0, 0, -30.3, 12, 12, F(REDD), Math.PI / 4); decal(m, P, 0, 0, -30.6, 7, 7, F(GOLD)); decal(m, P, 0, 0, -30.8, 3, 3, F(REDD), Math.PI / 4);
        fbox(m, P, -1, 31, -9, 12, 6, 7, F(RED), 0.5); fbox(m, P, -1, 31, 9, 12, 6, 7, F(RED), -0.5); fbox(m, P, -1, 30, 0, 5, 5, 6, F(REDD));
      }
    }
    return [m];
  }
  function buildPile(t, pop = 0) { // pop: gepeitscht – der Stempelkopf hüpft und dreht sich, die Ordner ruckeln
    const m = PS2.mesh(), F = (c) => c, k = pop / 34;
    for (let i = 0; i < PARTS.length; i++) {
      let P = PILE[i];
      if (pop > 0) P = PARTS[i].t === 'head' ? { c: [P.c[0], P.c[1] + Math.sin(k * Math.PI) * 20, P.c[2]], r: P.r + Math.sin(k * Math.PI * 2) * 0.5, y: P.y }
        : { c: [P.c[0], P.c[1] + Math.max(0, Math.sin(pop * 0.7 + i * 1.7)) * k * 3, P.c[2]], r: P.r, y: P.y };
      part(m, i, P, F, { t, eye: pop > 0 ? k : 0, ink: 0 }, null);
    }
    return [m];
  }
  // ---- zeichnen: eigener Puffer, dunkle Kontur, nach dem Licht ----
  function blit(ctx, holder, list, bx, gy, shake) {
    const w = View.w, Hb = 208, VX = w / 2, D = Amtsschimmel.CAM_D;
    if (!holder.buf || holder.buf.w !== w) {
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = Hb; return c; }, c = mk(), o = mk();
      holder.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), o, ox: o.getContext('2d'), w };
    }
    const B = holder.buf, ox = bx - W.cam.x, oy = gy - W.cam.y;
    B.x.clearRect(0, 0, w, Hb);
    PS2.render(B.x, w, Hb, list, { x: VX - ox, y: oy - 60, z: -D, yaw: 0, pitch: 0, f: D, near: 30, cx: VX, cy: 60 }, Amtsschimmel.ENV);
    const O = B.ox; O.globalCompositeOperation = 'copy'; O.drawImage(B.c, 0, 0); O.globalCompositeOperation = 'source-in'; O.fillStyle = '#100c14'; O.fillRect(0, 0, w, Hb);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(B.o, shake + dx, dy);
    ctx.drawImage(B.c, shake, 0);
    return B;
  }
  return { PARTS, PILE, build, buildPile, blit, legGeo };
})();

class AmtPile extends Ent { // Haufen Leitz-Ordner in der Bosskammer: liegt da, bis sich der Amtsschimmel daraus zusammensetzt (und wieder, wenn er besiegt ist)
  constructor() { super(0, 0, 0, 0); this.kind = 'candle'; this.buf = null; this.pop = 0; this.n = 0; } // besiegt peitschbar (kind 'candle': W.whipAt ruft hit())
  update() {
    this.t++; if (this.pop > 0) this.pop--;
    const M = W.room.mini, done = M && W.miniDone[W.stage + ':' + W.roomIdx];
    if (done) { this.x = M.x0 * T + 104 - 66; this.y = (W.room.h - 2) * T - 58; this.w = 146; this.h = 58; } else { this.w = 0; this.h = 0; }
  }
  hit() { // Wiehern nur auf Antrag: der Kopf hüpft hoch, ein Beamtenspruch
    if (!this.w || this.pop > 10) return;
    this.pop = 34; this.n++;
    Audio8.sfx('neighAmt', this.x + 76); Audio8.sfx('page', this.x + 76);
    W.popup(this.x + 78, this.y - 34, tr('amtPile' + (this.n % 4)), '#f0ead8');
    for (let i = 0; i < 8; i++) W.spawn(new Particle(this.x + 40 + rnd(0, 70), this.y + rnd(10, 40), rnd(-1.2, 1.2), rnd(-1.8, -0.4), i % 3 ? '#f0ead8' : '#a89c84', 40, 1, 0.06));
  }
  draw() { }
  drawLit(ctx) {
    const M = W.room.mini, b = W.boss;
    if (!M || (b instanceof Amtsschimmel && !b.dead)) return;
    const bx = M.x0 * T + 104, gy = (W.room.h - 2) * T;
    if (bx + 160 < W.cam.x || bx - 160 > W.cam.x + View.w) return;
    AmtModel.blit(ctx, this, AmtModel.buildPile(this.t, this.pop), bx, gy, 0);
  }
}

class Amtsschimmel extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + 170, gy - 98, 40, 28, 40, 3); // Trefferfläche = Stempelkopf (folgt jedes Bild der Pose)
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 9000; this.nameKey = 'bossAmt'; this.music = 'amtsmarsch';
    this.bx = ax + 104; this.wall = this.bx + 66; this.face = 1; this.lootY = gy - 40;
    this.state = 'build'; this.timer = 0; this.ph2 = false;
    this.lateIntro = true; this.holdIntro = true; // Auftritt, Musik, Namensband und Geplänkel erst nach dem Zusammenbau (world.js, game.js)
    this.asm = new Float32Array(AmtModel.PARTS.length); this.tie = 0; this.fast = !!(Castle.flags && Castle.flags.amt_built);
    this.head = { x: 74, y: 84 }; this.headTilt = 0; this.rear = 0; this.eye = 0; this.ink = 0; this.walk = 0; this.stamps = 0; this.waves = 0; this.marks = []; this.buf = null;
  }
  rot(x, z) { const c = Math.cos(Amtsschimmel.YAW), s = Math.sin(Amtsschimmel.YAW); return [x * c - z * s, x * s + z * c]; }
  pitch(x, y) { const a = this.rear * 0.42, px = -56, c = Math.cos(a), s = Math.sin(a); return [px + (x - px) * c - y * s, (x - px) * s + y * c]; }
  tf(x, y, z) { const [X, Y] = this.pitch(x, y), [rx, rz] = this.rot(X, z); return [rx, Y, rz]; }
  draw() { } // gezeichnet wird nach dem Licht (drawLit)
  drawLit(ctx) {
    const fy = Math.round(this.gy - W.cam.y);
    for (const mk of this.marks) { // roter Stempelabdruck am Boden, verblasst langsam
      const a = Math.min(1, mk.t / 40) * 0.55, x = Math.round(mk.x - W.cam.x);
      ctx.fillStyle = `rgba(200,24,40,${a.toFixed(2)})`; ctx.fillRect(x - 22, fy - 2, 44, 3); ctx.fillRect(x - 24, fy - 1, 2, 2); ctx.fillRect(x + 22, fy - 1, 2, 2);
    }
    if (this.state === 'raise' || this.state === 'hover' || this.state === 'slam') { // Schatten des Stempels
      const sx = Math.round(this.bx + this.head.x + 4 - W.cam.x), k = clamp(1 - (this.head.y - 15) / 150, 0.2, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.25 + 0.35 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(sx, fy - 1, 12 + 14 * k, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    const shake = this.dying && this.dying < 30 ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    const B = AmtModel.blit(ctx, this, AmtModel.build(this), this.bx, this.gy, shake);
    this.lastDraw = this.dying ? null : { s: { c: B.c, f: B.c, w: View.w, h: 208 }, x: W.cam.x, y: W.cam.y, flip: false }; // besiegt: zerfällt nicht, sondern fällt zum Haufen
  }
  // ---------------- Verhalten ----------------
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.wall + 80, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 150, tr(k), col); }
  vulnerable() { return this.state !== 'intro' && this.state !== 'build'; }
  headBox() { return { x: this.bx + this.head.x - 18, y: this.gy - this.head.y - 16, w: 48, h: 40 }; }
  reach(px) { return clamp(px - this.bx - 4, 70, Math.min(this.ax + this.aw - this.bx - 30, 270)); }
  land(i) { // ein Teil sitzt: Klack, ein Wölkchen Aktenstaub
    const p = AmtModel.PARTS[i], f = p.t === 'head' ? [this.head.x, this.head.y - 16] : p.t === 'hoof' ? this.tf(AmtModel.legGeo(this, p.leg).hx, 4, 0) : null;
    Audio8.sfx(p.t === 'head' ? 'stamp' : p.t === 'hoof' ? 'klack' : 'klack2', this.bx);
    if (p.t === 'head') { W.shake = Math.max(W.shake, 8); Input.rumble(0.5, 0.4, 260); }
    if (f) for (let k = 0; k < 4; k++) W.spawn(new Particle(this.bx + f[0] + rnd(-8, 8), this.gy - f[1], rnd(-0.8, 0.8), rnd(-0.9, -0.2), '#d8d0bc', 26, 1, 0.03));
  }
  scream() { // Urschrei: er bäumt sich auf, die Wände wackeln, Staub und Blätter regnen von den Regalen
    Audio8.sfx('neighBig');
    W.bossEntrance(this, { sfx: null, music: false });
    W.shake = 34; W.wobble = 7; Input.rumble(1, 0.9, 1400);
    this.say('bossAmtShout', '#f8b800');
    for (let i = 0; i < 30; i++) W.spawn(new Particle(W.cam.x + rnd(0, View.w), W.cam.y + rnd(34, 70), rnd(-0.4, 0.4), rnd(0.2, 1.3), i % 3 ? '#f0ead8' : '#a89c84', 140, i % 4 ? 1 : 2, 0.03));
    if (Castle.setFlag) Castle.setFlag('amt_built');
  }
  update() {
    this.tick();
    const p = W.player, sp = this.ph2 ? 1.4 : 1, ease = (v, to, k) => v + (to - v) * k, h = this.head;
    if (p.alive && p.x < this.wall) { p.x = this.wall; if (p.vx < 0) p.vx = 0; } // vor der Brust ist Schluss
    for (const mk of this.marks) mk.t--;
    this.marks = this.marks.filter(mk => mk.t > 0);
    this.ink = Math.max(0, this.ink - 0.02);
    if (this.dying) { // fällt in sich zusammen: die Ordner purzeln zurück auf den Haufen (vom Kopf her)
      this.eye = ease(this.eye, 0, 0.05); this.rear = ease(this.rear, 0, 0.1); this.headTilt = ease(this.headTilt, 0, 0.1);
      const n = AmtModel.PARTS.length;
      if (!this.asm) this.asm = new Float32Array(n).fill(1);
      for (let i = 0; i < n; i++) {
        const a = 1 - clamp((this.dying - 24 - (n - 1 - i) * 2.4) / 18, 0, 1);
        if (a <= 0 && this.asm[i] > 0) Audio8.sfx('klack2', this.bx);
        this.asm[i] = a;
      }
      this.tie = Math.max(0, this.tie - 0.04);
      if (this.dying % 3 === 0) W.spawn(new Particle(this.bx + rnd(-90, 60), this.gy - rnd(10, 110), rnd(-1.6, 1.6), rnd(-1.6, 0.2), Math.random() < 0.6 ? '#f0ead8' : '#c8a868', 60, 2, 0.05)); // lose Blätter
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { // nächste Instanz: Augen rot, schneller, Doppelstempel
      this.ph2 = true; W.flash = 8; W.shake = Math.max(W.shake, 14); Audio8.sfx('neighAmt'); Audio8.tempo(1.12); Input.rumble(0.7, 0.6, 500);
      this.say('bossAmtRage', '#fc7460');
    }
    const trot = this.state === 'idle' || this.state === 'snort' || this.state === 'blow';
    if (trot) this.walk += 0.13 * sp;
    if (!this.dying && this.t % 9 === 0 && this.state !== 'intro' && this.state !== 'build') W.spawn(new Particle(this.bx + rnd(-80, 50), this.gy - rnd(50, 105), rnd(-0.4, 0.4), rnd(-0.2, 0.4), '#f0ead8', 60, 1, 0.03)); // Aktenstaub
    const hb = this.headBox(); this.w = 40; this.h = 28; this.x = hb.x + 4; this.y = hb.y + 6;
    if (this.state === 'build') { // Auftritt I: der Haufen Leitz-Ordner setzt sich zusammen – Hufe, Beine, Rumpf, Kruppe, Brust, Hals, Kopf
      const n = this.asm.length, T0 = this.fast ? 14 : 34, GAP = this.fast ? 2 : 4, DUR = this.fast ? 14 : 22, end = T0 + (n - 1) * GAP + DUR;
      if (this.timer === T0 - 16) { Audio8.sfx('page'); W.shake = Math.max(W.shake, 4); Input.rumble(0.3, 0.2, 200); } // der Haufen ruckelt
      for (let i = 0; i < n; i++) {
        const e = clamp((this.timer - T0 - i * GAP) / DUR, 0, 1);
        if (e > 0 && this.asm[i] === 0 && i % 3 === 0) Audio8.sfx('page', this.bx);
        if (e >= 1 && this.asm[i] < 1) this.land(i);
        this.asm[i] = e;
      }
      if (this.timer > end + 6) { // Amtsband schnürt sich zu, das Siegel klatscht drauf
        const was = this.tie; this.tie = Math.min(1, this.tie + 0.08);
        if (was < 1 && this.tie >= 1) { Audio8.sfx('stamp', this.bx - 8); W.popup(this.bx - 8, this.gy - 112, tr('amtMark'), '#fc5c5c'); }
      }
      this.eye = clamp((this.timer - end - 24) / 26, 0, 1);
      if (this.timer > end + 58) { this.asm = null; this.go('intro'); this.scream(); }
    } else if (this.state === 'intro') { // Auftritt II: bäumt sich auf und wiehert; danach Namensband und Wortgeplänkel (game.js), dann der Kampf
      if (this.timer < 46) { this.rear = ease(this.rear, 1, 0.09); h.x = ease(h.x, 60, 0.09); h.y = ease(h.y, 128 + Math.sin(this.timer * 0.5) * 3, 0.12); this.headTilt = ease(this.headTilt, 0.38, 0.1); }
      else { this.rear = ease(this.rear, 0, 0.22); h.x = ease(h.x, 74, 0.08); h.y = ease(h.y, 84, 0.1); this.headTilt = ease(this.headTilt, 0, 0.1); }
      if (this.timer === 52) { W.shake = Math.max(W.shake, 16); Audio8.sfx('boom', this.bx); Input.rumble(0.7, 0.5, 400); } // Hufe krachen auf
      if (this.timer === 64) { this.holdIntro = false; Audio8.play(this.music); } // jetzt Namensband, Geplänkel, Marsch
      if (this.timer > 128) this.go('idle');
    } else if (this.state === 'idle') {
      this.eye = ease(this.eye, this.ph2 ? 0.9 : 0.4, 0.05); this.rear = ease(this.rear, 0, 0.1);
      h.x = ease(h.x, 74, 0.06); h.y = ease(h.y, 84 + Math.sin(this.t * 0.11) * 4, 0.08);
      if (this.timer > (this.ph2 ? 34 : 56)) {
        const r = Math.random();
        if (r < 0.42) { this.go('raise'); this.stamps = this.ph2 ? 2 : 1; Audio8.sfx('creak', this.bx); }
        else if (r < 0.74) { this.go('snort'); Audio8.sfx('hiss', this.bx); }
        else { this.go('rear'); Audio8.sfx('neighAmt', this.bx); }
      }
    } else if (this.state === 'raise') { // Stempel hebt sich über den Helden
      h.x = ease(h.x, this.reach(p.cx), 0.08); h.y = ease(h.y, 150, 0.08); this.eye = ease(this.eye, 1, 0.1);
      if (this.timer > (this.ph2 ? 22 : 32)) this.go('hover');
    } else if (this.state === 'hover') { // schwebt und folgt dem Helden – der Schatten wird dunkler
      h.x = ease(h.x, this.reach(p.cx), this.ph2 ? 0.07 : 0.045); h.y = ease(h.y, 150, 0.1);
      if (this.timer > (this.ph2 ? 14 : 24)) { this.go('slam'); Audio8.sfx('whoosh', this.bx + h.x); }
    } else if (this.state === 'slam') { // knallt herab: ABGELEHNT!
      h.y = Math.max(15, h.y - 12);
      if (p.alive && Phys.overlap(this.headBox(), p)) p.hurt(this.dmg + 1, this.bx + h.x);
      if (h.y <= 15) {
        const x = this.bx + h.x + 4;
        W.shake = 16; Audio8.sfx('stamp', x); Audio8.sfx('boom', x); Input.rumble(0.9, 0.7, 380);
        W.spawn(new Shock(x, this.gy - 4, 60, '#e83c3c', 4)); W.popup(x, this.gy - 40, tr('amtMark'), '#fc5c5c');
        for (let i = 0; i < 10; i++) W.spawn(new Particle(x + rnd(-22, 22), this.gy - 2, rnd(-1.8, 1.8), rnd(-2.2, -0.4), i % 2 ? '#d81830' : '#f0ead8', 30, 2, 0.12)); // Tinte und Blätter
        this.marks.push({ x, t: 300 }); this.ink = 1;
        if (--this.stamps > 0) this.go('raise'); else this.go('stuck');
      }
    } else if (this.state === 'stuck') { // steckt im Stempelkissen fest: jetzt treffbar
      h.y = 15 + (this.timer > 50 ? Math.sin(this.timer * 0.8) * 2 : 0); this.eye = ease(this.eye, 0.2, 0.1);
      if (this.timer % 12 === 0) W.spawn(new Particle(this.bx + h.x + rnd(-14, 18), this.gy - 20, rnd(-0.4, 0.4), -rnd(0.4, 0.9), '#f8f0d8', 26, 1, 0)); // Stempeldampf
      if (this.timer > (this.ph2 ? 56 : 76)) { this.go('idle'); Audio8.sfx('creak', this.bx + h.x); }
    } else if (this.state === 'snort') { // senkt den Kopf, bläht die Nüstern
      h.x = ease(h.x, 96, 0.08); h.y = ease(h.y, 44, 0.08);
      if (this.timer % 5 === 0) W.spawn(new Particle(this.bx + h.x + 30, this.gy - h.y + rnd(-4, 4), rnd(0.4, 1.2), rnd(-0.4, 0.4), '#e8e4d8', 20, 1, 0));
      if (this.timer > (this.ph2 ? 22 : 32)) { this.go('blow'); this.waves = this.ph2 ? 5 : 3; }
    } else if (this.state === 'blow') { // Formularsturm: Wellen abwechselnd tief (springen) und in Kopfhöhe (ducken)
      const gap = this.ph2 ? 20 : 26;
      if (this.timer % gap === 1 && this.waves > 0) {
        const low = this.waves % 2 === 1, y = this.gy - (low ? 7 : 26), v = this.ph2 ? 2.9 : 2.3;
        for (let i = 0; i < 2; i++) W.spawn(new EProj('page', this.bx + h.x + 28 + i * 10, y + rnd(-1.5, 1.5), v, 0, 0, this.dmg));
        Audio8.sfx('whoosh', this.bx + h.x); this.waves--;
      }
      if (this.waves <= 0 && this.timer > gap * (this.ph2 ? 5 : 3) + 20) this.go('idle');
    } else if (this.state === 'rear') { // bäumt sich auf und stampft: Akten fallen aus den Regalen
      if (this.timer < 40) { this.rear = ease(this.rear, 1, 0.08); h.y = ease(h.y, 120, 0.08); h.x = ease(h.x, 60, 0.08); }
      else this.rear = ease(this.rear, 0, 0.35);
      if (this.timer === 46) {
        W.shake = 14; Audio8.sfx('boom', this.bx); Input.rumble(0.6, 0.5, 400);
        const n = this.ph2 ? 6 : 4, x0 = this.wall + 14, x1 = this.ax + this.aw - 14;
        for (let i = 0; i < n; i++) W.spawn(new AmtFile(x0 + ((i + Math.random() * 0.8) / n) * (x1 - x0), this.gy, this.dmg));
      }
      if (this.timer > 72) this.go('idle');
    }
  }
  lightUp(L, cx, cy) {
    if (this.dying) return;
    const hx = this.bx + this.head.x - cx, hy = this.gy - this.head.y - cy;
    L.push({ x: hx, y: hy, r: 40, c: [240, 220, 180], a: 0.3 });
    if (this.eye > 0.1) L.push({ x: hx + 8, y: hy - 2, r: 16 + this.eye * 20, c: [255, 70, 40], a: 0.45 * this.eye });
    if (this.ink > 0.05) L.push({ x: hx + 4, y: hy + 16, r: 30, c: [255, 40, 50], a: 0.5 * this.ink });
  }
}
Amtsschimmel.YAW = -0.55; Amtsschimmel.CAM_D = 560; // Rumpf schräg zum Betrachter (Flanke mit den Etiketten zeigt nach vorn), ferne Kamera
Amtsschimmel.ENV = (() => { const n = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); }; return { sun: n([0.5, 0.7, -0.6]), sunC: [1.05, 0.95, 0.78], amb: [0.16, 0.15, 0.2], sky: [0.22, 0.24, 0.32], rim: n([-0.7, 0.5, 0.5]), rimC: [0.35, 0.4, 0.6], fog: [0, 0, 0], fogD: 0 }; })(); // Schreibtischlampe von rechts vorn, kühles Fensterlicht von hinten
