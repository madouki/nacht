// Steingolem (Schloss-Modus, Zwischengegner im Golemstollen links vom Eiskeller): bildschirmfüllend, aus Felsquadern gefügt,
// Runen glühen in den Fugen, Moos auf den Schultern. Er steht am linken Ende des Stollens, der Kopf stößt an die Decke, und
// schaut nach rechts zum Helden – als PS2-Low-Poly-Modell, jedes Bild neu gebaut und mit der Software-3D (ps2.js) gerastert.
// Angriffe: Augenlaser fegt über den Boden zum Helden und zurück (drüberspringen); flacher Laser – er geht in die Knie, senkt
// den Kopf bis an den Boden und feuert waagerecht in Kopfhöhe (ducken); Faust hebt sich über den Helden (Schatten), kracht
// herab, Gesteinsbrocken spritzen, danach sinkt er kurz in die Knie; Brüllen: Steine fallen von der Decke. Treffbar ist nur
// das Runenherz in der Brust – im Stand mit einem Sprung, kniend vom Boden aus. Ab halber Energie schneller, Laser doppelt.
'use strict';

class GolemRock extends Ent { // Stein aus der Stollendecke: erst rieselt Staub (Vorwarnung), dann fällt er
  constructor(x, gy, dmg) { super(x - 9, -24, 18, 18); this.kind = 'eproj'; this.gy = gy; this.dmg = dmg; this.vy = 0; this.warn = 34; }
  update() {
    this.t++;
    if (this.warn > 0) { if (--this.warn % 4 === 0) W.spawn(new Particle(this.cx + rnd(-8, 8), W.cam.y + 2, rnd(-0.2, 0.2), rnd(0.6, 1.2), '#8c8070', 24, 1, 0.05)); return; }
    this.vy = Math.min(7, this.vy + 0.32); this.y += this.vy;
    const p = W.player;
    if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
    if (this.y + this.h >= this.gy) {
      this.dead = true; W.shake = Math.max(W.shake, 4); Audio8.sfx('crumble', this.cx);
      for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.gy - 4, rnd(-1.8, 1.8), rnd(-2.6, -0.6), i % 2 ? '#7c7468' : '#4c463e', 34, 2, 0.16));
    }
  }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
    if (this.warn > 0) { ctx.fillStyle = 'rgba(140,128,112,0.35)'; ctx.fillRect(x + 4, Math.round(-W.cam.y), 10, 3); return; } // Riss in der Decke
    ctx.fillStyle = '#4c463e'; ctx.fillRect(x + 2, y, 14, 18); ctx.fillRect(x, y + 3, 18, 12);
    ctx.fillStyle = '#7c7468'; ctx.fillRect(x + 2, y, 14, 3); ctx.fillRect(x, y + 3, 4, 8);
    ctx.fillStyle = '#2c2824'; ctx.fillRect(x + 9, y + 6, 6, 2);
  }
}

class GolemBoss extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + 100, gy - 110, 26, 30, 36, 3); // Trefferfläche = Runenherz in der Brust (folgt jedes Bild der Pose)
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 8000; this.nameKey = 'bossGolem'; this.music = 'boss';
    this.bx = ax + 112; this.wall = this.bx + 70; this.face = 1; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.ph2 = false;
    this.kneel = 0; this.dip = 0; this.eye = 0; this.roarK = 0; this.open = 0; // Pose (0 … 1): Knie, Kopf gesenkt, Augenglut, Brüllen, Brust offen
    this.fist = { x: this.bx + 30, y: gy - 22, home: true }; this.beam = null; this.buf = null;
  }
  // ---------------- Modell ----------------
  // lokale Koordinaten: x nach vorn (zum Helden), y hoch ab Boden, z in die Tiefe (0 = Spielebene). Maße in Bildpunkten.
  pose() {
    const k = this.kneel, d = this.dip, bob = Math.sin(this.t * 0.05) * 2 * (1 - k);
    const hip = 46 - 26 * k + bob, chest = hip + 86, head = { x: 22 + 12 * Math.max(0, d), y: (chest - 16) * (1 - d) + 5 * d, tilt: d }; // gedrungen, Kopf tief zwischen den Schultern; gesenkt: Kopf am Boden, Augen in Kopfhöhe des Helden
    return { hip, chest, head, eyeY: head.y + 23, eyeX: head.x + 26 };
  }
  // Der Leib steht schräg zum Betrachter (YAW, etwa 45°): von genau der Seite war er nur eine senkrechte Säule. Faust und Unterarm des
  // Schlagarms bleiben ungedreht – die Faust schlägt in der Spielebene (z 0) auf. rp: gedrehter Modellpunkt → Bildpunkt
  rot(x, z) { const c = Math.cos(GolemBoss.YAW), s = Math.sin(GolemBoss.YAW); return [x * c - z * s, x * s + z * c]; }
  rp(x, y, z) { // wie PS2.projLocal, aber mit der fernen Kamera des Golems (CAM_D): kaum Fluchtverzerrung, die nahe Schulter bläht sich nicht auf
    const [rx, rz] = this.rot(x, z), D = GolemBoss.CAM_D, VX = View.w / 2, k = D / (D + rz), sx = this.bx - W.cam.x, sy = this.gy - W.cam.y;
    return [VX + (sx + rx - VX) * k, 60 + (sy - y - 60) * k];
  }
  mesh() {
    const P = PS2, m = P.mesh(), arm = P.mesh(), fl = this.flashT > 0;
    const S = fl ? [240, 240, 240] : [118, 110, 102], S2 = fl ? [220, 220, 220] : [90, 86, 84], D = fl ? [200, 200, 200] : [50, 46, 52];
    const WARM = fl ? [230, 230, 230] : [132, 112, 90], LIT = fl ? [250, 250, 250] : [154, 144, 128], MOSS = [62, 104, 52], MOSS2 = [90, 132, 60];
    const TINT = [[1.05, 1, 0.93], [0.95, 0.98, 1.06], [1, 1, 1]], AO = (y) => 0.72 + 0.28 * Math.min(1, Math.max(0, y / 170)); // Brocken mal wärmer, mal kühler; unten dunkler (Bodenschatten)
    // Felsbrocken statt glatter Quader: jede Kante gefast (26 Flächen), die Ecken leicht verschoben – so fängt jeder Brocken an
    // Kanten und Ecken Licht wie behauener Stein; Steinfarbe wechselt leicht, Oberseiten heller. Selbstleuchtende bleiben Quader
    let nb = 0;
    const B = (mm, cx, y0, cz, w, h, d, col, o = {}) => {
      if (o.e) return P.box(mm, cx, y0, cz, w, h, d, col, o);
      const id = ++nb, r0 = Math.sin(id * 12.9898) * 43758.5453, kk = 0.86 + 0.26 * (r0 - Math.floor(r0));
      const hw = w / 2, hh = h / 2, hd = d / 2, b = Math.min(w, h, d) * 0.26, rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot), yc = y0 + hh;
      const jit = (i) => { const r = Math.sin((id * 37 + i) * 78.233) * 43758.5453; return (r - Math.floor(r) - 0.5) * b * 0.55; };
      let n = 0; const V = {};
      const vx = (x, y, z) => { x += jit(n++); y += jit(n++); z += jit(n++); return P.vtx(mm, cx + x * cs - z * sn, yc + y, cz + x * sn + z * cs); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
        V[sx + ',' + sy + ',' + sz] = { x: vx(sx * hw, sy * (hh - b), sz * (hd - b)), y: vx(sx * (hw - b), sy * hh, sz * (hd - b)), z: vx(sx * (hw - b), sy * (hh - b), sz * hd) };
      const tn = TINT[id % 3], ao = AO(yc);
      const v = (sx, sy, sz) => V[sx + ',' + sy + ',' + sz], C = [cx, yc, cz], F = (idx, t) => P.face(mm, idx, col.map((c, j) => Math.min(255, c * kk * t * tn[j] * ao)), C, o);
      for (const sx of [-1, 1]) F([v(sx, -1, -1).x, v(sx, 1, -1).x, v(sx, 1, 1).x, v(sx, -1, 1).x], 1);               // Seiten
      for (const sy of [-1, 1]) F([v(-1, sy, -1).y, v(1, sy, -1).y, v(1, sy, 1).y, v(-1, sy, 1).y], sy > 0 ? 1.14 : 0.9); // oben, unten
      for (const sz of [-1, 1]) F([v(-1, -1, sz).z, v(1, -1, sz).z, v(1, 1, sz).z, v(-1, 1, sz).z], 1);               // vorn, hinten
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) F([v(sx, sy, -1).x, v(sx, sy, -1).y, v(sx, sy, 1).y, v(sx, sy, 1).x], sy > 0 ? 1.1 : 0.94); // Fasen
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) F([v(sx, -1, sz).x, v(sx, -1, sz).z, v(sx, 1, sz).z, v(sx, 1, sz).x], 1.02);
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) F([v(-1, sy, sz).y, v(-1, sy, sz).z, v(1, sy, sz).z, v(1, sy, sz).y], sy > 0 ? 1.1 : 0.94);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) F([v(sx, sy, sz).x, v(sx, sy, sz).y, v(sx, sy, sz).z], 1.06); // Ecken
    };
    const L = (mm, x0, y0, z0, x1, y1, z1, w, h, col) => { // Gliedmaße als achteckiger Felsstrang, zum Ende hin etwas schlanker
      let dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      let sx = dz, sz = -dx; const sl = Math.hypot(sx, sz); if (sl < 1e-6) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
      const ux = -sz * dy, uy = sz * dx - sx * dz, uz = sx * dy, id = ++nb;
      const ring = (px, py, pz, k) => Array.from({ length: 8 }, (_, i) => {
        const a = (i + 0.5) / 8 * Math.PI * 2, r = Math.sin((id * 13 + i) * 91.7) * 43758.5453, jj = 1 + (r - Math.floor(r) - 0.5) * 0.16;
        const ca = Math.cos(a) * w / 2 * k * jj, sa = Math.sin(a) * h / 2 * k * jj;
        return P.vtx(mm, px + sx * ca + ux * sa, py + uy * sa, pz + sz * ca + uz * sa);
      });
      const A = ring(x0, y0, z0, 1), E = ring(x1, y1, z1, 0.86), C = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], ao = AO(C[1]);
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; P.face(mm, [A[i], A[j], E[j], E[i]], col.map(c => c * (i % 2 ? 1 : 0.92) * ao), C); }
      P.face(mm, A, col.map(c => c * ao), C); P.face(mm, E, col.map(c => c * ao), C);
    };
    const RUNE = [255, 150, 70], ps = this.pose(), k = this.kneel, hip = ps.hip, ch = ps.chest, glowR = 0.3 + 0.25 * Math.sin(this.t * 0.08) + (this.ph2 ? 0.35 : 0);
    // Beine: kurz und breitbeinig – Schienbein, schräger Oberschenkel, keilförmiger Fuß; zwischen den Beinen eine Lücke
    for (const z of [-36, 36]) {
      const lh = Math.max(16, hip - 8);
      B(m, -2 + 16 * k, 0, z, 34, lh * 0.56, 34, S2, { rot: z * 0.004 });
      B(m, 0 + 10 * k, lh * 0.46, z * 1.04, 40, lh * 0.62, 40, S, { rot: -z * 0.005 });
      B(m, 8 + 18 * k, 0, z, 54, 12, 44, D); B(m, 31 + 18 * k, 0, z, 10, 8, 38, S2);   // Fuß mit Zehenkante
      if (k > 0.2) B(m, 22 * k, hip - 18, z, 32, 20, 34, LIT, { rot: 0.3 });                // Knie
    }
    B(m, 0, hip - 10, 0, 58, 22, 96, D);                                                     // Becken
    B(m, 2, hip + 8, 0, 56, 36, 82, S2);                                                     // Taille, schmal
    B(m, 4, hip + 40, 0, 74, ch - hip - 72, 108, S);                                          // Brust unten
    B(m, 8, ch - 38, 0, 86, 42, 140, WARM, { rot: 0.04 });                                     // Brust oben, breit (V-Form)
    B(m, -32, ch - 46, 0, 44, 54, 104, S2);                                                  // Buckel
    for (const [y, z, w] of [[hip + 50, -22, 16], [hip + 64, 20, 22], [ch - 28, -40, 18], [ch - 16, 30, 14]]) B(m, y > ch - 40 ? 52 : 43, y, z, 3, 3, w, RUNE, { e: glowR, rot: 0.5 }); // Runenrisse
    for (const s2 of [-1, 1]) { // Felsschultern, höher als der gesenkte Kopf: Brocken, Zacken, Moos
      const z = s2 * 82;
      B(m, -4, ch - 34, z, 58, 54, 52, S, { rot: s2 * 0.18 });
      B(m, -12, ch + 12, z * 0.96, 40, 14, 36, LIT, { rot: -s2 * 0.3 });
      B(m, 12, ch + 4, z * 1.08, 22, 14, 22, S2, { rot: 0.5 });
      B(m, -14, ch + 24, z * 0.94, 30, 6, 26, MOSS); B(m, -2, ch + 16, z * 1.12, 14, 5, 12, MOSS2);
      P.cone(m, -16, ch + 26, z * 1.02, 9, 18, 4, D); P.cone(m, 8, ch + 18, z * 0.88, 7, 13, 4, D);
    }
    // Runenherz im Bauch: Platten weichen auseinander, glüht stärker beim Laser und im Knien (im Stand mit Sprung, kniend vom Boden)
    const cy = hip + 12, glow = 0.45 + 0.5 * this.open + 0.15 * Math.sin(this.t * 0.2);
    { // Runenherz: geschliffener Stein (Doppelpyramide), Facetten im Wechsel heller – er funkelt, wenn er sich mit dem Leib dreht
      const gx = 46, C = [gx, cy, 0], top = P.vtx(m, gx + 2, cy + 17, 0), bot = P.vtx(m, gx + 2, cy - 17, 0);
      const rim = [[gx + 9, 0], [gx + 4, 11], [gx - 3, 9], [gx - 3, -9], [gx + 4, -11]].map(([x, z]) => P.vtx(m, x, cy, z));
      for (let i = 0; i < rim.length; i++) {
        const j = (i + 1) % rim.length, c2 = i % 2 ? [255, 190, 110] : RUNE;
        P.face(m, [top, rim[i], rim[j]], c2, C, { e: glow * (i % 2 ? 1.1 : 0.85) }); P.face(m, [bot, rim[j], rim[i]], c2, C, { e: glow * (i % 2 ? 0.95 : 0.7) });
      }
    }
    for (const s2 of [-1, 1]) B(m, 46, cy - 16, s2 * (16 + 12 * this.open), 6, 32, 14, S2);
    // linker Arm (zum Betrachter hin) hängt bis zum Boden, die Faust stützt sich auf
    L(m, -4, ch - 10, -88, 8, ch - 66, -100, 34, 34, S2); B(m, 8, ch - 84, -100, 32, 26, 32, LIT);
    L(m, 8, ch - 72, -100, 16, 26, -102, 32, 32, S); B(m, 16, 0, -102, 48, 34, 46, S2); B(m, 36, 4, -102, 8, 24, 42, D);
    // Kopf: tief zwischen den Schultern, senkt sich beim flachen Laser bis an den Boden; Kiefer, Stirnwulst, Mundspalt, glühende Augen
    const hx = ps.head.x, hy = ps.head.y, eye = [255, 70 + 120 * this.eye, 40 + 60 * this.eye];
    L(m, 0, ch - 8, 0, hx - 6, hy + 8, 0, 36, 32, D);                                          // Nacken
    B(m, hx, hy, 0, 54, 44, 60, S);                                                         // Schädel
    B(m, hx + 8, hy - 8, 0, 44, 14, 54, S2);                                                // Kiefer
    B(m, hx + 8, hy + 30, 0, 48, 10, 68, D);                                                // Stirnwulst
    B(m, hx + 27, hy + 6, 0, 4, 5, 28, [30, 20, 20]);                                       // Mundspalt
    for (const z of [-13, 13]) B(m, hx + 27, hy + 21, z, 3, 7, 11, eye, { e: 0.25 + this.eye * 0.9 });
    B(m, hx - 8, hy + 44, -8, 26, 8, 26, MOSS); P.cone(m, hx - 12, hy + 44, 14, 8, 16, 4, D);
    // Oberfläche: kleine Felsbrocken kleben an Schultern, Buckel und Schenkeln, Flechten (gelbgrün) und Moospolster auf den
    // Oberseiten, glühende Runenbänder ziehen sich über Brust und Schenkel, ein Steinkamm über den Rücken
    for (const [x, y, z, w2, h2, col] of [[-20, ch + 2, -46, 14, 9, S2], [-26, ch - 10, 40, 12, 10, D], [-36, ch - 20, -12, 16, 12, S], [-38, ch - 30, 22, 12, 9, S2],
      [14, hip - 2, -48, 10, 8, D], [18, hip + 6, 44, 12, 9, S2], [-8, hip + 30, -58, 10, 9, S], [-6, hip + 26, 56, 9, 8, D], [30, ch - 50, -40, 9, 7, S2], [28, ch - 44, 44, 10, 8, S]])
      B(m, x, y, z, w2, h2, w2, col, { rot: (x + z) * 0.03 });
    for (const [x, y, z, w2, d2, col] of [[-10, ch + 20, -30, 22, 16, [150, 160, 70]], [-20, ch + 26, 36, 18, 14, MOSS2], [-30, ch + 10, 4, 16, 18, MOSS], [8, ch + 2, -70, 14, 12, [170, 170, 80]], [-6, hip + 40 + 30 * (1 - k), 48, 12, 10, MOSS]])
      B(m, x, y, z, w2, 3, d2, col, { rot: z * 0.02 }); // Flechten und Moos
    for (let i = 0; i < 6; i++) P.cone(m, -44 + i * 3, ch - 8 + i * 6, -30 + i * 12, 6 - i * 0.4, 14, 4, D); // Steinkamm über den Rücken
    for (const [x0, y0, z0, x1, y1, z1] of [[44, hip + 30, -30, 48, ch - 46, -10], [48, ch - 46, -10, 46, ch - 22, 26], [34, hip * 0.3, -40, 34, hip * 0.9, -30], [34, hip * 0.3, 40, 34, hip * 0.8, 32]])
      P.beam(m, x0, y0, z0, x1, y1, z1, 2.4, 2.4, RUNE, { e: glowR * 0.85, open: true }); // glühende Runenbänder
    // Kristallbüschel aus der Höhle wachsen aus Schultern und Buckel (selbstleuchtend, pulsierend)
    const cg = 0.1 + 0.07 * Math.sin(this.t * 0.06), CR = [[150, 80, 255], [60, 190, 255]];
    for (const [x0, y0, z0, n] of [[-30, ch + 8, -26, 3], [-28, ch + 8, 24, 2], [-10, ch + 26, -74, 3], [-12, ch + 26, 76, 3], [-40, ch - 6, 0, 2]])
      for (let i = 0; i < n; i++) P.cone(m, x0 + (i - 1) * 7, y0 - 2, z0 + (i % 2 ? 6 : -5), 5 + (i % 2) * 2, 16 + ((i * 7) % 3) * 8, 5, CR[(i + n) % 2], { e: cg + i * 0.03 });
    for (const [x, y, z, w, rr] of [[30, hip * 0.5, -36, 14, 0.9], [30, hip * 0.7, 36, 12, -0.7], [-2, ch - 54, -100, 16, 0.6], [16, ch - 64, 92, 14, -0.5], [10, ch - 6, 60, 18, 0.3]]) // Runenrisse an Beinen und Armen
      P.box(m, x, y, z, 3, 3, w, RUNE, { e: glowR * 0.9, rot: rr });
    for (let i = 0, V = m.v; i < V.length; i += 3) { const [x, z] = this.rot(V[i], V[i + 2]); V[i] = x; V[i + 2] = z; } // Leib drehen
    for (const fc of m.f) { const [x, z] = this.rot(fc.n[0], fc.n[2]); fc.n[0] = x; fc.n[2] = z; }
    // Schlagarm an der Schulter zum Helden hin, Faust in der Spielebene (Welt → lokal)
    const f = this.fist, fx = f.x - this.bx, fy = this.gy - f.y, [sx, sz] = this.rot(4, 86), sy = ch - 10;
    const ex = Math.max(sx, fx) + 14, ey = Math.max(sy - 30, fy) + 18, ez = sz * 0.45;          // Ellbogen
    L(arm, sx, sy, sz, ex, ey, ez, 34, 34, S2); B(arm, ex, ey - 15, ez, 32, 28, 32, LIT);
    L(arm, ex, ey, ez, fx, fy + 16, 0, 30, 30, S);
    B(arm, fx, fy - 20, 0, 48, 40, 48, S); for (const kz of [-14, 0, 14]) B(arm, fx + 22, fy - 14, kz, 10, 26, 13, D); B(arm, fx - 4, fy + 14, 0, 32, 10, 38, LIT); // Faust, Knöchel, Handrücken
    return [m, arm];
  }
  draw() { } // gezeichnet wird nach dem Licht (drawLit): der Felsleib hat seine eigene Fackelbeleuchtung, der Stollennebel liegt dahinter
  drawLit(ctx) {
    const w = View.w, Hb = 208, VX = w / 2, D = GolemBoss.CAM_D; // volle Auflösung (die halbe wurde weich hochskaliert und war unscharf)
    if (!this.buf || this.buf.w !== w) {
      const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = Hb; return c; }, c = mk(), o = mk();
      this.buf = { c, x: c.getContext('2d', { willReadFrequently: true }), o, ox: o.getContext('2d'), w };
    }
    const B = this.buf, ox = this.bx - W.cam.x, oy = this.gy - W.cam.y;
    B.x.clearRect(0, 0, w, Hb);
    PS2.render(B.x, w, Hb, this.mesh(), { x: VX - ox, y: oy - 60, z: -D, yaw: 0, pitch: 0, f: D, near: 30, cx: VX, cy: 60 }, GolemBoss.ENV);
    // dunkle Kontur um den Felsleib: hebt die Silhouette vom Stollen ab
    const O = B.ox; O.globalCompositeOperation = 'copy'; O.drawImage(B.c, 0, 0); O.globalCompositeOperation = 'source-in'; O.fillStyle = '#0c0a0e'; O.fillRect(0, 0, w, Hb);
    const shake = this.dying ? ((this.t >> 1) & 1) * 3 - 1 : 0;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(B.o, shake + dx, dy);
    ctx.drawImage(B.c, shake, 0);
    this.lastDraw = { s: { c: B.c, f: B.c, w, h: Hb }, x: W.cam.x, y: W.cam.y, flip: false };
    // Schatten der Faust am Boden, solange sie über dem Helden schwebt
    if (this.state === 'raise' || this.state === 'hover' || this.state === 'slam') {
      const sx = Math.round(this.fist.x - W.cam.x), k = clamp(1 - (this.gy - this.fist.y) / 180, 0.2, 1);
      ctx.fillStyle = `rgba(0,0,0,${(0.25 + 0.35 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(sx, Math.round(this.gy - W.cam.y) - 1, 14 + 16 * k, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    this.drawGlow(ctx, shake);
    if (this.beam) this.drawBeam(ctx);
    if (this.eye > 0.05) { // Augenglut (auch ohne Strahl)
      const e = this.eyePt(); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(e.x - W.cam.x, e.y - W.cam.y, 0, e.x - W.cam.x, e.y - W.cam.y, 10 + this.eye * 26);
      g.addColorStop(0, `rgba(255,220,180,${(0.5 * this.eye).toFixed(2)})`); g.addColorStop(0.4, `rgba(255,60,30,${(0.35 * this.eye).toFixed(2)})`); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(e.x - W.cam.x - 40, e.y - W.cam.y - 40, 80, 80); ctx.restore();
    }
  }
  eyePt() { const ps = this.pose(), q = this.rp(ps.eyeX + 2, ps.eyeY, -13); return { x: q[0] + W.cam.x, y: q[1] + W.cam.y }; }
  // Leuchten über dem Felsleib: Glut um Runenherz und Runenrisse, ein Kreis aus Runenzeichen dreht sich um das Herz (heller, wenn die
  // Brust offen und das Herz treffbar ist), auf den Kristallspitzen blitzt ab und zu ein Funkeln auf
  drawGlow(ctx, sx) {
    if (this.dying) return;
    const ps = this.pose(), t = this.t, ch = ps.chest, hip = ps.hip, pulse = 0.5 + 0.5 * Math.sin(t * 0.08), op = this.open;
    const halo = (x, y, r, a, c0, c1) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c0.replace('A', a.toFixed(2))); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, z] of [[43, hip + 50, -22], [43, hip + 64, 20], [52, ch - 28, -40], [52, ch - 16, 30]]) { const q = this.rp(x, y, z); halo(q[0] + sx, q[1], 9, 0.18 + 0.2 * pulse + (this.ph2 ? 0.15 : 0), 'rgba(255,140,60,A)', 'rgba(255,90,30,0)'); }
    const h = this.rp(48, hip + 12, 0), hx = h[0] + sx, hy = h[1], R = 20 + 6 * op;
    halo(hx, hy, R + 8, 0.3 + 0.35 * op + 0.1 * pulse, 'rgba(255,190,110,A)', 'rgba(255,100,40,0)');
    const ra = 0.22 + 0.55 * op; ctx.fillStyle = `rgba(255,170,80,${ra.toFixed(2)})`;
    for (let i = 0; i < 12; i++) { // Runenkreis, schräg wie die Brust: schmale Ellipse
      const a = t * 0.025 + i * Math.PI / 6, px = hx + Math.cos(a) * R * 0.62, py = hy + Math.sin(a) * R;
      const gl = (i * 7) % 4; ctx.fillRect(Math.round(px) - 1, Math.round(py) - (gl === 0 ? 2 : 1), gl === 3 ? 1 : 2, gl === 0 ? 4 : gl === 1 ? 2 : 3);
    }
    for (const [i, x, y, z] of [[0, -30, ch + 30, -26], [1, -10, ch + 46, -74], [2, -12, ch + 46, 76], [3, -28, ch + 28, 24], [4, -40, ch + 16, 0]]) { // Funkeln
      const ph = (t + i * 53) % 170; if (ph > 18) continue;
      const q = this.rp(x, y, z), k = Math.sin(ph / 18 * Math.PI), s = 2 + 5 * k, X = Math.round(q[0] + sx), Y = Math.round(q[1]);
      ctx.fillStyle = `rgba(200,235,255,${(0.85 * k).toFixed(2)})`; ctx.fillRect(X - s, Y, s * 2 + 1, 1); ctx.fillRect(X, Y - s, 1, s * 2 + 1);
      ctx.fillStyle = `rgba(255,255,255,${k.toFixed(2)})`; ctx.fillRect(X - 1, Y - 1, 3, 3);
    }
    ctx.restore();
  }
  drawBeam(ctx) { // Laser: weißer Kern, roter Mantel, Glut am Auftreffpunkt
    const b = this.beam, e = this.eyePt(), x0 = e.x - W.cam.x, y0 = e.y - W.cam.y, x1 = b.x - W.cam.x, y1 = b.y - W.cam.y, fl = (this.t >> 1) & 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [lw, c] of [[14 + fl * 2, 'rgba(255,30,20,0.22)'], [8, 'rgba(255,80,40,0.55)'], [3, 'rgba(255,240,220,0.95)']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    const g = ctx.createRadialGradient(x1, y1, 0, x1, y1, 22); g.addColorStop(0, 'rgba(255,230,180,0.9)'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x1 - 22, y1 - 22, 44, 44); ctx.restore();
  }
  // ---------------- Verhalten ----------------
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.wall + 80, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 150, tr(k), col); }
  vulnerable() { return this.state !== 'intro'; }
  beamHits(x0, y0, x1, y1) { // Strahl (Strecke) gegen den Helden
    const p = W.player; if (!p.alive) return false;
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; if (x > p.x - 3 && x < p.x + p.w + 3 && y > p.y - 3 && y < p.y + p.h + 3) return true; }
    return false;
  }
  update() {
    this.tick();
    const p = W.player, sp = this.ph2 ? 1.4 : 1, ease = (v, to, k) => v + (to - v) * k;
    if (p.alive && p.x < this.wall) { p.x = this.wall; if (p.vx < 0) p.vx = 0; } // vor dem Felsleib ist Schluss
    if (this.dying) {
      this.eye = ease(this.eye, 0, 0.05); this.kneel = ease(this.kneel, 1, 0.03); this.beam = null;
      if (this.dying % 5 === 0) for (let i = 0; i < 3; i++) W.spawn(new Particle(this.bx + rnd(-50, 50), this.gy - rnd(10, 180), rnd(-1.5, 1.5), rnd(-1, 0.5), i % 2 ? '#7c7468' : '#4c463e', 50, 2, 0.15));
      return this.updateDeath(140);
    }
    if (!this.ph2 && this.hp <= this.maxHp / 2) { // Phase 2: Risse glühen, schneller, doppelter Laser
      this.ph2 = true; W.flash = 8; W.shake = Math.max(W.shake, 16); Audio8.sfx('roar'); Audio8.tempo(1.1); Input.rumble(0.7, 0.6, 500);
      this.say('bossGolemRage', '#fc7460');
    }
    if (!this.dying && this.t % 7 === 0 && this.state !== 'intro') W.spawn(new Particle(this.bx + rnd(-50, 46), this.gy - rnd(60, 170), rnd(-0.3, 0.3), rnd(0, 0.6), Math.random() < 0.5 ? '#6c6458' : '#8c8478', 70, 1, 0.12)); // Steinchen rieseln vom Felsleib
    const ps = this.pose(), f = this.fist;
    const hq = this.rp(47, ps.hip + 12, 0); // Runenherz folgt der Pose (wo man es sieht)
    this.w = 26; this.h = 30; this.x = hq[0] + W.cam.x - 13; this.y = hq[1] + W.cam.y - 15;
    if (!this.dying && this.state !== 'intro' && this.t % (this.open > 0.5 ? 4 : 10) === 0) W.spawn(new Particle(this.cx + rnd(-8, 8), this.cy + rnd(-10, 10), rnd(-0.25, 0.25), rnd(-0.9, -0.3), Math.random() < 0.5 ? '#ffb060' : '#ff7a3c', 36, 1, -0.01)); // Glut steigt aus dem Herzen
    if (this.state !== 'slam' && this.state !== 'hover' && this.state !== 'raise') { f.x = ease(f.x, this.bx + 30, 0.08); f.y = ease(f.y, this.gy - 22 - this.kneel * 4, 0.08); }
    if (this.state === 'intro') { // erwacht: Augen glimmen auf, Steine bröckeln ab, Brüllen
      this.eye = clamp((this.timer - 20) / 40, 0, 1);
      if (this.timer % 6 === 0) W.spawn(new Particle(this.bx + rnd(-40, 50), this.gy - rnd(30, 170), rnd(-0.6, 0.6), rnd(0, 1), '#7c7468', 40, 2, 0.15));
      if (this.timer === 62) { Audio8.sfx('roar'); W.shake = 20; Input.rumble(0.8, 0.6, 600); this.say('bossGolemShout', '#f8b800'); }
      if (this.timer > 110) this.go('idle');
    } else if (this.state === 'idle') {
      this.eye = ease(this.eye, 0.35, 0.05); this.kneel = ease(this.kneel, 0, 0.06); this.dip = ease(this.dip, 0, 0.06); this.open = ease(this.open, 0, 0.1);
      if (this.timer > (this.ph2 ? 34 : 56)) {
        const r = Math.random();
        if (r < 0.34) { this.go('charge'); Audio8.sfx('charge', this.bx); }
        else if (r < 0.58) this.go('crouch');
        else if (r < 0.88) { this.go('raise'); Audio8.sfx('creak', this.bx); }
        else this.go('roar');
      }
    } else if (this.state === 'charge') { // Augen laden, Brust öffnet sich (Runenherz treffbar)
      this.eye = clamp(this.timer / (this.ph2 ? 30 : 46), 0, 1.2); this.open = ease(this.open, 1, 0.1); this.dip = ease(this.dip, 0, 0.15); this.kneel = ease(this.kneel, 0, 0.15); // aufrichten: Augen oben
      if (this.timer % 3 === 0) { const e = this.eyePt(); W.spawn(new Particle(e.x + rnd(-14, 14), e.y + rnd(-14, 14), 0, 0, '#fc7460', 12, 1, 0)); }
      if (this.timer > (this.ph2 ? 30 : 46)) { this.go('sweep'); this.sweeps = this.ph2 ? 2 : 1; Audio8.sfx('laser', this.bx); }
    } else if (this.state === 'sweep') { // Strahl fegt über den Boden bis ans Ende des Stollens und zurück
      const len = this.ph2 ? 46 : 64, u = this.timer / len, k = u < 0.5 ? u * 2 : 2 - u * 2, x = this.wall + 8 + k * (this.ax + this.aw - this.wall - 20);
      this.beam = { x, y: this.gy };
      const e = this.eyePt();
      if (this.beamHits(e.x, e.y, x, this.gy)) p.hurt(this.dmg + 1, x);
      if (this.timer % 2 === 0) W.spawn(new Particle(x + rnd(-4, 4), this.gy - 2, rnd(-1.5, 1.5), rnd(-2.4, -0.6), this.timer % 4 ? '#fcb860' : '#fc5c3c', 22, 1, 0.12)); // Funken
      if (this.timer % 8 === 0) Audio8.sfx('fire', x);
      if (this.timer >= len) { this.beam = null; if (--this.sweeps > 0) { this.timer = 0; Audio8.sfx('laser', this.bx); } else this.go('idle'); }
    } else if (this.state === 'crouch') { // in die Knie, Kopf bis an den Boden – gleich kommt der flache Laser
      this.kneel = ease(this.kneel, 1, 0.08); this.dip = ease(this.dip, 1, 0.07); this.eye = clamp(this.timer / 40, 0, 1.2); this.open = ease(this.open, 1, 0.1);
      if (this.timer === 8) Audio8.sfx('charge', this.bx);
      if (this.timer > (this.ph2 ? 34 : 46)) { this.go('flat'); Audio8.sfx('laser', this.bx); W.shake = Math.max(W.shake, 6); }
    } else if (this.state === 'flat') { // waagerecht in Kopfhöhe des stehenden Helden: ducken!
      const e = this.eyePt(); this.beam = { x: this.ax + this.aw, y: e.y };
      if (this.beamHits(e.x, e.y, this.ax + this.aw, e.y)) p.hurt(this.dmg + 1, e.x);
      if (this.timer % 3 === 0) W.spawn(new Particle(this.ax + this.aw - rnd(0, 8), e.y + rnd(-3, 3), -rnd(0.5, 2), rnd(-1, 1), '#fcb860', 18, 1, 0));
      if (this.timer > (this.ph2 ? 56 : 44)) { this.beam = null; this.go('idle'); }
    } else if (this.state === 'raise') { // Faust hebt sich über den Helden
      const tx = clamp(p.cx, this.wall + 24, this.ax + this.aw - 24);
      f.x = ease(f.x, tx, 0.08); f.y = ease(f.y, this.gy - 160, 0.08);
      if (this.timer > 34) this.go('hover');
    } else if (this.state === 'hover') { // schwebt und folgt dem Helden – der Schatten wird dunkler
      f.x = ease(f.x, clamp(p.cx, this.wall + 24, this.ax + this.aw - 24), this.ph2 ? 0.06 : 0.04);
      if (this.timer > (this.ph2 ? 16 : 28)) { this.go('slam'); Audio8.sfx('whoosh', f.x); }
    } else if (this.state === 'slam') { // kracht herab
      f.y = Math.min(this.gy - 22, f.y + 10);
      if (p.alive && Phys.overlap({ x: f.x - 22, y: f.y - 20, w: 44, h: 40 }, p)) p.hurt(this.dmg + 1, f.x);
      if (f.y >= this.gy - 22) {
        W.shake = 18; Audio8.sfx('boom', f.x); Audio8.sfx('crumble', f.x); Input.rumble(0.9, 0.7, 400);
        W.spawn(new Shock(f.x, this.gy - 4, 70, '#c8b8a0', 4));
        for (const d of [-1, 1]) for (let i = 0; i < (this.ph2 ? 3 : 2); i++) W.spawn(new EProj('rock', f.x + d * 18, this.gy - 14, d * (1.4 + i * 0.9), -3.2 - i * 0.6, 0.18, this.dmg));
        this.go('kneel');
      }
    } else if (this.state === 'kneel') { // erschöpft in die Knie: das Runenherz ist vom Boden aus erreichbar
      this.kneel = ease(this.kneel, 1, 0.12); this.open = ease(this.open, 1, 0.12); this.eye = ease(this.eye, 0.15, 0.1);
      if (this.timer > (this.ph2 ? 60 : 84)) this.go('idle');
    } else if (this.state === 'roar') { // Brüllen: Steine lösen sich aus der Stollendecke
      this.roarK = Math.sin(Math.min(1, this.timer / 50) * Math.PI); this.dip = ease(this.dip, -0.15, 0.1);
      if (this.timer === 10) { Audio8.sfx('roar'); W.shake = 14; Input.rumble(0.6, 0.5, 400); }
      if (this.timer === 14) for (let i = 0; i < (this.ph2 ? 6 : 4); i++) W.spawn(new GolemRock(this.wall + 20 + ((i + Math.random()) / (this.ph2 ? 6 : 4)) * (this.ax + this.aw - this.wall - 40), this.gy, this.dmg));
      if (this.timer > 60) this.go('idle');
    }
  }
  lightUp(L, cx, cy) {
    if (this.dying) return;
    const ps = this.pose(), q = this.rp(47, ps.hip + 12, 0);
    L.push({ x: this.fist.x - cx, y: this.fist.y - cy, r: 50, c: [220, 200, 170], a: 0.35 });
    L.push({ x: q[0] + W.cam.x - cx, y: q[1] + W.cam.y - cy, r: 30 + this.open * 20, c: [255, 140, 60], a: 0.4 + this.open * 0.3 }); // Runenherz
    if (this.eye > 0.1) { const e = this.eyePt(); L.push({ x: e.x - cx, y: e.y - cy, r: 20 + this.eye * 30, c: [255, 60, 40], a: 0.5 * this.eye }); }
    if (this.beam) L.push({ x: this.beam.x - cx, y: this.beam.y - cy, r: 50, c: [255, 90, 50], a: 0.7 });
  }
}
GolemBoss.YAW = -0.78; GolemBoss.CAM_D = 560; // Leib schräg zum Betrachter gedreht (Brust zeigt nach rechts vorn), ferne Kamera
GolemBoss.ENV = (() => { const n = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); }; return { sun: n([0.55, 0.65, -0.55]), sunC: [1.15, 0.9, 0.64], amb: [0.11, 0.1, 0.17], sky: [0.2, 0.23, 0.36], rim: n([-0.75, 0.5, 0.42]), rimC: [0.42, 0.62, 1.08], fog: [0, 0, 0], fogD: 0 }; })(); // Fackellicht von rechts vorn (harte Schatten), kühles Gegenlicht der Kristalle von hinten links
