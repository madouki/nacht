// Schalterrätsel (Schloss-Modus): Hebel, die die Peitsche umlegt, Rollgitter, ein Gepäckaufzug, ein Schrankkoffer zum
// Schieben, eine Gepäckwaage (Druckplatte, die Gewicht verlangt), Stempel, die in der Reihenfolge des Dienstwegs geschlagen
// werden wollen, und Emailschilder, die beim Davorstehen ihren Text zeigen. Erster Einsatz: das Fundbüro links an der
// Lichterpassage. Die Bauteile hängen über Gruppen (g) zusammen: Hebel, Waage und Formular schalten eine Gruppe, Tore und
// Aufzüge folgen ihr. Gelöste Rätsel merkt sich der Spielstand (save → Castle.flags['pz_' + save]), dann bleiben die Tore
// offen. Hebel, Tor, Aufzug, Koffer, Waage und Stempel in PS2-3D (PS2.drawLocal), Formular und Schilder gemalt.
// Raum: .prop('pz', { k: 'lever' | 'gate' | 'lift' | 'trunk' | 'scale' | 'stamp' | 'form' | 'sign', ... }) – siehe make().
'use strict';

const Puzzle = (() => {
  const { mesh, box, prism, cone, beam } = PS2;
  let st = {}, room = null; // Gruppe → an/aus, gilt für den aktuellen Raumbesuch
  const S = () => { if (room !== W.room) { room = W.room; st = {}; } return st; };
  const get = (g) => !!S()[g];
  const set = (g, v) => { S()[g] = !!v; };
  const saved = (k) => !!(k && typeof Castle !== 'undefined' && Castle.flags && Castle.flags['pz_' + k]);
  const keep = (k) => { if (k && typeof Castle !== 'undefined' && Castle.on) Castle.setFlag('pz_' + k); };

  const IRON = [46, 50, 60], IRON2 = [30, 32, 40], IRONL = [104, 110, 128], BRASS = [214, 170, 74], RED = [168, 34, 34], OAK = [118, 78, 44],
    OAK2 = [86, 54, 30], LEATHER = [96, 52, 30], GREEN = [34, 76, 58], RUBBER = [92, 24, 30];
  // Stellhebel wie im Stellwerk: Gusseisensockel mit Zahnbogen, roter Hebelarm (a: Neigung in Radiant, + = nach rechts),
  // Sperrklinke und Messinggriff, daneben ein Pfosten mit Signallampe (rot = aus, grün = an)
  function leverMesh(a, lit) {
    const m = mesh(), L = 25, tx = Math.sin(a) * L, ty = 7 + Math.cos(a) * L;
    box(m, 0, 0, 6, 24, 5, 14, IRON, { top: IRONL });
    for (let k = -3; k <= 3; k++) { const t = k * 0.17; box(m, Math.sin(t) * 15, 4 + Math.cos(t) * 15, 7, 3.4, 2.6, 3, IRON2); }
    box(m, 0, 4, 7, 8, 7, 8, IRON2);
    beam(m, 0, 7, 1, tx, ty, 1, 3.2, 3.2, RED);
    beam(m, tx * 0.55, 7 + (ty - 7) * 0.55, -1.6, tx * 0.95, 7 + (ty - 7) * 0.95, -1.6, 1.4, 1.4, IRONL); // Sperrklinkenstange
    box(m, tx, ty - 2, 1, 5, 5, 5, BRASS);
    prism(m, -9, 5, 8, 1.4, 22, 6, IRON2);
    box(m, -9, 27, 8, 6, 6, 6, IRON, { top: IRONL }); box(m, -9, 28, 4.6, 4, 4, 1, lit ? [60, 230, 120] : [230, 40, 30], { e: 1 });
    return [m];
  }
  // Rollgitter: Kasten oben in der Mauer, darunter senkrechte Stäbe mit Querbändern und Spitzen (hb: sichtbare Höhe in px)
  function gateMesh(w, hb) {
    const m = mesh();
    box(m, w / 2, -4, 4, w + 6, 8, 12, IRON2, { top: IRONL });
    box(m, w / 2, -1, -2.4, w + 4, 2, 1, BRASS);
    if (hb > 2) {
      for (let x = 3; x < w; x += 5) box(m, x, -hb, 3, 1.8, hb - 3, 1.8, IRON);
      for (let y = -6; y > -hb + 3; y -= 14) box(m, w / 2, y - 2, 2, w - 2, 2.4, 2.4, IRONL);
      box(m, w / 2, -hb, 2, w - 1, 3, 3, IRON2);
      for (let x = 3; x < w; x += 5) cone(m, x, -hb, 3, 1.4, -3.5, 4, IRONL);
    }
    return [m];
  }
  // Gepäckaufzug: Eichenpalette in einem Eisenrahmen, Messinggeländer an der Rückseite, Warnleiste vorn
  function liftMesh(w) {
    const m = mesh();
    box(m, w / 2, -8, 9, w, 5, 20, IRON, { top: IRONL });
    for (let k = 0; k < 5; k++) box(m, 3 + k * (w - 6) / 4, -3, 9, (w - 6) / 4 - 1.2, 3, 19, k % 2 ? OAK : OAK2, { top: [150, 104, 64] });
    for (const x of [2, w - 2]) prism(m, x, 0, 18, 1.2, 16, 6, BRASS);
    beam(m, 2, 16, 18, w - 2, 16, 18, 1.6, 1.6, BRASS);
    box(m, w / 2, -7.6, -1.2, w - 1, 1.8, 0.8, [248, 184, 0]);
    for (let k = 0; k < 5; k++) box(m, 4 + k * (w - 8) / 4, -7.6, -1.5, 2.6, 1.8, 0.6, [36, 32, 30]);
    return [m];
  }
  // Schrankkoffer: Leder auf Holz, Messingecken, zwei Lederriemen, Griff oben
  function trunkMesh(w, h) {
    const m = mesh();
    box(m, w / 2, 0, 9, w, h, 16, LEATHER, { top: [124, 72, 42] });
    box(m, w / 2, h * 0.55, 0.6, w - 0.4, 1.4, 1, OAK2);                             // Deckelfuge
    for (const x of [w * 0.3, w * 0.7]) { box(m, x, -0.2, 0.4, 3, h + 0.4, 1.2, [62, 34, 20]); box(m, x, h * 0.4, -0.4, 3.6, 2.4, 0.6, BRASS); } // Riemen mit Schnallen
    for (const x of [1.5, w - 1.5]) for (const y of [0, h - 3]) box(m, x, y, 0.6, 3.4, 3, 2, BRASS);                 // Ecken
    box(m, w / 2, h, 9, 8, 1.6, 3, [40, 24, 16]);
    return [m];
  }
  // Gepäckwaage: Messingplatte bündig im Boden, Säule mit großem Zifferblatt dahinter
  function scaleMesh(w, sink) {
    const m = mesh();
    box(m, w / 2, -2 - sink, 8, w - 2, 2, 18, BRASS, { top: [236, 198, 108] });
    box(m, w / 2, -0.4, 8, w + 2, 0.8, 20, IRON2);
    prism(m, w / 2, 0, 20, 2.4, 22, 8, IRON, { rTop: 2 });
    box(m, w / 2, 22, 20, 26, 26, 6, IRON, { top: IRONL });
    box(m, w / 2, 23, 16.6, 22, 22, 1, [232, 222, 196]);
    return [m];
  }
  // Stempel: Stange von der Decke, Eichengriff, Messinghals, roter Gummiblock (rod: Stangenlänge in px)
  function stampMesh(rod) {
    const m = mesh();
    beam(m, 0, 18, 4, 0, 18 + rod, 4, 1.6, 1.6, IRONL);
    prism(m, 0, 10, 4, 3.4, 8, 8, OAK, { rTop: 4.4 }); prism(m, 0, 18, 4, 4.4, 2, 8, OAK2);
    prism(m, 0, 6, 4, 2, 4, 6, BRASS);
    box(m, 0, 0, 4, 18, 6, 12, [56, 40, 30], { top: [80, 58, 42] });
    box(m, 0, -2, 4, 17, 2, 11, RUBBER);
    return [m];
  }

  // Textschild (Emailschild wie an Pariser Straßenecken): dunkelblau, weißer Rand, weiße Schrift
  function enamel(ctx, cx, y, text, col = '#1c2c6c') {
    const w = Font.width(text) + 10, x = Math.round(cx - w / 2);
    ctx.fillStyle = '#0a0c18'; ctx.fillRect(x - 1, y - 1, w + 2, 13);
    ctx.fillStyle = col; ctx.fillRect(x, y, w, 11);
    ctx.fillStyle = '#e8ecf4'; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 9, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, 9); ctx.fillRect(x + w - 2, y + 1, 1, 9);
    Font.draw(ctx, text, Math.round(cx), y + 2, '#f4f4f8', { align: 'center' });
  }
  const make = (d) => {
    if (d.save && saved(d.save)) set(d.g, true); // schon gelöst: von Anfang an offen
    switch (d.k) {
      case 'lever': return new PzLever(d);
      case 'gate': return new PzGate(d);
      case 'lift': return new PzLift(d);
      case 'trunk': return new PzTrunk(d);
      case 'scale': return new PzScale(d);
      case 'stamp': return new PzStamp(d);
      case 'form': return new PzForm(d);
      default: return new PzSign(d);
    }
  };
  return { get, set, saved, keep, make, enamel, leverMesh, gateMesh, liftMesh, trunkMesh, scaleMesh, stampMesh };
})();

// Text dauerhaft zeigen, solange der Held davorsteht (Schilder, Waage)
const pzSay = (key, ...args) => { if (Game.noteKey !== key || Game.noteT < 40) Game.note(key, ...args); };

// ---------------- Stellhebel ----------------
// Ein Peitschenhieb legt ihn um (kind 'candle': W.whipAt ruft hit()). mode 'toggle' (Standard) schaltet hin und her, save rastet ein
class PzLever extends Ent {
  constructor(d) {
    super(d.x * T - 4, (d.y + 1) * T - 36, 24, 36); this.kind = 'candle';
    this.g = d.g; this.save = d.save; this.fy = (d.y + 1) * T; this.cool = 0; this.o = {}; this.say = d.say;
    this.a = Puzzle.get(this.g) ? 1 : 0;
  }
  hit() {
    if (this.cool > 0 || (this.save && Puzzle.get(this.g))) return;
    this.cool = 26;
    const v = !Puzzle.get(this.g); Puzzle.set(this.g, v);
    if (v && this.save) Puzzle.keep(this.save);
    Audio8.sfx('clank', this.cx); Audio8.sfx('latch', this.cx); W.shake = Math.max(W.shake, 2); Input.rumble(0.25, 0.3, 100);
    for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx + rnd(-4, 4), this.y + 8, rnd(-1.4, 1.4), rnd(-2.2, -0.6), i % 2 ? '#fce0a8' : '#e8c070', 20, 1, 0.12));
    if (this.say) W.popup(this.cx, this.y - 6, tr(this.say), '#fce0a8');
  }
  update() { this.t++; if (this.cool > 0) this.cool--; const want = Puzzle.get(this.g) ? 1 : 0; this.a += (want - this.a) * 0.3; if (Math.abs(want - this.a) < 0.01) this.a = want; }
  lightUp(L, cx, cy) { L.push({ x: this.cx - 9 - cx, y: this.fy - 30 - cy, r: 20, c: this.a > 0.5 ? [60, 255, 130] : [255, 60, 40], a: 0.5 }); }
  draw(ctx) {
    const sx = this.cx - W.cam.x, sy = this.fy - W.cam.y;
    if (sx < -40 || sx > View.w + 40) return;
    const ang = 0.5 - this.a * 1.0, lit = this.a > 0.5;
    PS2.drawLocal(ctx, this.o, () => Puzzle.leverMesh(ang, lit), sx, sy, [-26, -40, 52, 44], Math.round(ang * 30) + (lit ? 'g' : 'r'));
  }
}

// ---------------- Rollgitter ----------------
// Zellen x … x+w-1, y0 … y1 sind zu ('G': fest, die Grafik zeichnet das Gitter). Offen, solange die Gruppe an ist; schließt
// nicht auf dem Helden
class PzGate extends Ent {
  constructor(d) {
    super(d.x * T, d.y0 * T, (d.w || 2) * T, (d.y1 - d.y0 + 1) * T); this.kind = 'prop';
    this.g = d.g; this.cells = []; this.o = {};
    for (let y = d.y0; y <= d.y1; y++) for (let x = d.x; x < d.x + (d.w || 2); x++) this.cells.push([x, y]);
    this.open = Puzzle.get(this.g) ? 1 : 0; this.solid = false; this.fill(this.open < 0.5);
  }
  fill(on) { if (on === this.solid) return; this.solid = on; for (const [x, y] of this.cells) W.room.grid[y][x] = on ? 'G' : '.'; }
  blocked() { const p = W.player; return (p.alive && Phys.overlap(p, this)) || W.ents.some(e => (e.kind === 'enemy' || e instanceof PzTrunk) && !e.dead && Phys.overlap(e, this)); }
  update() {
    this.t++;
    const want = Puzzle.get(this.g), was = this.open;
    if (want && this.open < 1) { this.open = Math.min(1, this.open + 0.022); if (was === 0) { Audio8.sfx('chain', this.cx); W.shake = Math.max(W.shake, 3); } if (this.open > 0.6) this.fill(false); }
    else if (!want && this.open > 0) {
      if (this.open < 0.6 && this.blocked()) return; // nicht auf den Helden herab
      this.open = Math.max(0, this.open - 0.05); if (this.open < 0.5) this.fill(true);
      if (this.open === 0) { Audio8.sfx('wall', this.cx); W.dust(this.cx, this.y + this.h, 4); W.shake = Math.max(W.shake, 3); }
    }
    if (this.open > 0 && this.open < 1 && this.t % 6 === 0 && this.onScreen(20)) Audio8.sfx('cog', this.cx);
  }
  draw(ctx) {
    const sx = this.x - W.cam.x, sy = this.y - W.cam.y;
    if (sx > View.w + 20 || sx + this.w < -20) return;
    const hb = Math.round(this.h * (1 - this.open)) + 2;
    PS2.drawLocal(ctx, this.o, () => Puzzle.gateMesh(this.w, hb), sx, sy, [-6, -6, this.w + 12, this.h + 14], hb);
  }
}

// ---------------- Gepäckaufzug ----------------
// Plattform (w Kacheln), fährt zur Reihe high, solange die Gruppe an ist, sonst zur Reihe low (Oberkante); trägt den Helden
class PzLift extends Ent {
  constructor(d) {
    super(d.x * T, 0, (d.w || 3) * T, 8); this.kind = 'platform';
    this.g = d.g; this.yLow = d.low * T; this.yHigh = d.high * T; this.dx = 0; this.dy = 0; this.o = {}; this.roof = (d.roof ?? 2) * T;
    this.y = Puzzle.get(this.g) ? this.yHigh : this.yLow; this.moving = false;
  }
  update() {
    this.t++;
    const ty = Puzzle.get(this.g) ? this.yHigh : this.yLow, d = ty - this.y, ny = this.y + Math.max(-1, Math.min(1, d));
    this.dy = ny - this.y; this.y = ny;
    const mv = Math.abs(this.dy) > 0.01;
    if (mv && !this.moving) Audio8.sfx('chain', this.cx);
    if (!mv && this.moving) { Audio8.sfx('clank', this.cx); W.dust(this.cx, this.y, 3); }
    if (mv && this.t % 10 === 0) Audio8.sfx('cog', this.cx);
    this.moving = mv;
  }
  draw(ctx) {
    const sx = this.x - W.cam.x, sy = this.y - W.cam.y;
    if (sx > View.w + 20 || sx + this.w < -20) return;
    ctx.fillStyle = '#16161e'; for (const ax of [3, this.w - 4]) ctx.fillRect(Math.round(sx + ax), Math.round(this.roof - W.cam.y), 2, Math.round(this.y - this.roof)); // Ketten zur Umlenkrolle
    ctx.fillStyle = '#7c8094'; for (const ax of [3, this.w - 4]) for (let y = this.roof; y < this.y - 2; y += 4) ctx.fillRect(Math.round(sx + ax), Math.round(y - W.cam.y), 1, 2);
    for (const ax of [3, this.w - 4]) { ctx.fillStyle = '#c8a040'; ctx.fillRect(Math.round(sx + ax - 2), Math.round(this.roof - W.cam.y) - 4, 6, 5); }
    PS2.drawLocal(ctx, this.o, () => Puzzle.liftMesh(this.w), sx, sy, [-4, -24, this.w + 8, 36], 'l');
  }
}

// ---------------- Schrankkoffer ----------------
// Wer dagegen läuft, schiebt ihn (langsamer als Gehen); er fällt über Kanten (RUMMS), man kann auf ihm stehen. lim: je Standreihe
// des Koffers erlaubter Bereich [Reihe, x0, x1] (Kacheln) – so landet er nie in einer Ecke, aus der man ihn nicht zurückholt
class PzTrunk extends Ent {
  constructor(d) {
    super(d.x * T + 2, (d.y + 1) * T - 22, 28, 22); this.kind = 'prop';
    this.lim = d.lim || []; this.vy = 0; this.onGround = true; this.o = {}; this.pushT = 0; this.hint = d.hint;
    const t = this; // Deckel als Plattform (die Welt aktualisiert Plattformen vor dem Helden, der Koffer rechnet danach)
    this.deck = { kind: 'platform', get x() { return t.x; }, get y() { return t.y; }, get w() { return t.w; }, h: 4, dx: 0, dy: 0, update() {} };
  }
  limits() {
    const row = Math.round((this.y + this.h) / T);
    for (const [r, a, b] of this.lim) if (r === row) return [a * T, (b + 1) * T];
    return [0, W.room.w * T];
  }
  update() {
    this.t++;
    const p = W.player, I = Input.held, x0 = this.x, y0 = this.y;
    if (p.alive && (p.state === 'normal' || p.state === 'hurt') && p.feet > this.y + 6 && p.y < this.y + this.h - 2 && p.x + p.w > this.x && p.x < this.x + this.w) {
      const side = p.cx < this.cx ? 1 : -1; // Held links: schiebt nach rechts
      if (p.onGround && this.onGround && (side > 0 ? I.right : I.left)) {
        const [a, b] = this.limits();
        Phys.moveX(this, side * 0.85);
        if (this.x < a) this.x = a; if (this.x + this.w > b) this.x = b - this.w;
        if (Math.abs(this.x - x0) > 0.01) { this.pushT++; if (this.pushT % 14 === 1) { Audio8.sfx('step', this.cx); W.dust(this.cx - side * 12, this.y + this.h, 1); } }
        if (this.hint && !this.hinted) { this.hinted = true; Game.note(this.hint); }
      }
      p.x = side > 0 ? this.x - p.w : this.x + this.w; // der Koffer ist massiv
      if (p.x < 0) p.x = 0;
    }
    this.vy = Math.min(this.vy + GRAV, MAXFALL);
    const fast = this.vy, r = Phys.moveY(this, this.vy);
    const was = this.onGround; this.onGround = r === 1; if (r) this.vy = 0;
    if (this.onGround && !was && fast > 2) { // vom Bord gestoßen
      Audio8.sfx('wall', this.cx); Audio8.sfx('clank', this.cx); W.shake = Math.max(W.shake, 6); Input.rumble(0.4, 0.5, 160);
      W.dust(this.x + 4, this.y + this.h, 3); W.dust(this.x + this.w - 4, this.y + this.h, 3);
      W.popup(this.cx, this.y - 8, tr('pzThud'), '#fce0a8');
    }
    if (this.y > W.room.h * T) { this.dead = true; return; }
    this.deck.dx = this.x - x0; this.deck.dy = this.y - y0;
  }
  draw(ctx) {
    const sx = this.x - W.cam.x, sy = this.y + this.h - W.cam.y;
    if (sx > View.w + 20 || sx + this.w < -20) return;
    PS2.drawLocal(ctx, this.o, () => Puzzle.trunkMesh(this.w, this.h), sx, sy, [-4, -this.h - 6, this.w + 10, this.h + 8], 't');
    const lx = Math.round(sx + 5), ly = Math.round(sy - 15); // Aufkleber: ZERBRECHLICH (Glas mit Sprung)
    ctx.fillStyle = '#e8dcb4'; ctx.fillRect(lx, ly, 9, 7); ctx.fillStyle = '#b02020'; ctx.fillRect(lx + 4, ly + 1, 1, 4); ctx.fillRect(lx + 2, ly + 1, 5, 1); ctx.fillRect(lx + 3, ly + 5, 3, 1);
  }
}

// ---------------- Gepäckwaage ----------------
// Druckplatte, die Gewicht verlangt: der Held allein wiegt zu wenig, erst der Koffer drückt die Nadel über need (kg). Dann schaltet
// sie ihre Gruppe ein und rastet ein (save)
class PzScale extends Ent {
  constructor(d) {
    super(d.x * T, (d.y + 1) * T - 4, (d.w || 2) * T, 4); this.kind = 'prop';
    this.g = d.g; this.need = d.need || 100; this.save = d.save; this.fy = (d.y + 1) * T; this.o = {}; this.kg = 0; this.shown = Puzzle.get(this.g) ? 140 : 0; this.told = false;
  }
  weight() {
    const p = W.player, on = (e) => Math.abs(e.y + e.h - this.fy) < 2 && e.cx > this.x - 4 && e.cx < this.x + this.w + 4; // Schwerpunkt über der Platte
    let kg = 0, hero = false;
    if (p.alive && p.onGround && on(p)) { kg += 72; hero = true; }
    for (const e of W.ents) if (e instanceof PzTrunk && !e.dead && e.onGround && on(e)) kg += 140;
    return { kg, hero };
  }
  update() {
    this.t++;
    const { kg, hero } = this.weight();
    this.shown += (kg - this.shown) * 0.12;
    if (kg !== this.kg) { if (kg > this.kg) Audio8.sfx('tick', this.cx); this.kg = kg; }
    if (Puzzle.get(this.g)) return;
    if (kg >= this.need) {
      Puzzle.set(this.g, true); Puzzle.keep(this.save);
      Audio8.sfx('checkpoint', this.cx); Game.note('pzScaleOk', kg); W.popup(this.cx, this.fy - 40, kg + ' KG', '#f8d878');
    } else if (hero && kg > 0) pzSay('pzScaleLight', kg, this.need);
  }
  draw(ctx) {
    const sx = this.x - W.cam.x, sy = this.fy - W.cam.y;
    if (sx > View.w + 30 || sx + this.w < -30) return;
    const sink = Math.min(2, this.shown / 70);
    PS2.drawLocal(ctx, this.o, () => Puzzle.scaleMesh(this.w, sink), sx, sy, [-12, -54, this.w + 24, 58], Math.round(sink * 4));
    const [dx, dy] = PS2.projLocal(sx, sy, this.w / 2, 34, 16); // Zifferblatt: Nadel bis 200 kg, rote Marke bei need
    const ang = (k) => -2.3 + Math.min(1, k / 200) * 4.6;
    ctx.fillStyle = '#2c2420'; for (let k = 0; k <= 200; k += 25) { const a = ang(k); ctx.fillRect(Math.round(dx + Math.sin(a) * 8), Math.round(dy - Math.cos(a) * 8), 1, 1); }
    { const a = ang(this.need); ctx.fillStyle = '#d02020'; ctx.fillRect(Math.round(dx + Math.sin(a) * 9) - 1, Math.round(dy - Math.cos(a) * 9) - 1, 2, 2); }
    const a = ang(this.shown); ctx.strokeStyle = '#1c1410'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.round(dx) + 0.5, Math.round(dy) + 0.5); ctx.lineTo(dx + Math.sin(a) * 8, dy - Math.cos(a) * 8); ctx.stroke();
    ctx.fillStyle = '#c8a040'; ctx.fillRect(Math.round(dx) - 1, Math.round(dy) - 1, 2, 2);
    Font.draw(ctx, Math.round(this.shown) + ' KG', Math.round(dx), Math.round(dy) + 12, this.shown >= this.need ? '#58f8a0' : '#f8d878', { align: 'center', shadow: '#000' });
  }
}

// ---------------- Stempel ----------------
// Hängt an einer Stange von der Decke (Kopf in Reihe y); ein Peitschenhieb schlägt ihn – das Formular seiner Gruppe prüft die Reihenfolge
class PzStamp extends Ent {
  constructor(d) {
    const top = (d.top ?? 2) * T, hy = (d.y + 1) * T;
    super(d.x * T - 2, hy - 14, 20, 16); this.kind = 'candle';
    this.n = d.n; this.g = d.g; this.rod = hy - 14 - top; this.hy = hy; this.o = {}; this.bob = 0; this.vb = 0; this.cool = 0; this.flashT = 0;
    this.lab = d.x % 2 ? 13 : 0; // Nachbarn: Wortschilder versetzt übereinander (lange Wörter überlappen sonst)
  }
  hit() {
    if (this.cool > 0 || Puzzle.get(this.g)) return;
    this.cool = 30; this.vb = 3.2; this.flashT = 16;
    Audio8.sfx('stamp', this.cx); W.shake = Math.max(W.shake, 2);
    for (let i = 0; i < 6; i++) W.spawn(new Particle(this.cx + rnd(-6, 6), this.y + this.h, rnd(-1, 1), rnd(-0.6, 0.6), '#c02030', 18, 1, 0.1)); // Stempelfarbe
    const f = W.ents.find(e => e instanceof PzForm && e.g === this.g); if (f) f.stamp(this.n);
  }
  update() { this.t++; if (this.cool > 0) this.cool--; if (this.flashT > 0) this.flashT--; this.vb -= this.bob * 0.25; this.vb *= 0.82; this.bob += this.vb; }
  draw(ctx) {
    const sx = this.cx - W.cam.x, sy = this.hy - 8 + this.bob - W.cam.y;
    if (sx < -30 || sx > View.w + 30) return;
    const L = this.rod + this.bob - 12; // Stange reicht genau bis zur Schiene
    PS2.drawLocal(ctx, this.o, () => Puzzle.stampMesh(L), sx, sy, [-14, -L - 22, 28, L + 32], Math.round(this.bob));
    const word = tr('pzStamp' + this.n), w = Font.width(word) + 4, x = Math.round(sx - w / 2), y = Math.round(sy - 24 - this.lab);
    ctx.fillStyle = this.flashT > 0 && (this.t & 2) ? '#f8e0a0' : '#e8dcb4'; ctx.fillRect(x, y, w, 9); ctx.fillStyle = '#5c3c20'; ctx.fillRect(x, y + 8, w, 1);
    Font.draw(ctx, word, Math.round(sx), y + 1, '#801818', { align: 'center' });
  }
}

// ---------------- Formular (Reihenfolge) ----------------
// Großes Formular an der Wand mit vier Feldern: jeder Stempel in der richtigen Reihenfolge (order: Stempelnummern) füllt
// das nächste Feld; ein falscher macht es ungültig. Vollständig → Gruppe an, rastet ein (save)
class PzForm extends Ent {
  constructor(d) {
    super(d.x * T, d.y * T, (d.w || 6) * T, (d.h || 4) * T); this.kind = 'prop';
    this.g = d.g; this.order = d.order; this.save = d.save; this.got = Puzzle.get(this.g) ? d.order.slice() : []; this.badT = 0; this.okT = 0;
    this.rail = d.rail === undefined ? null : d.rail * T; // Laufschiene der Stempel (Reihe), unter dem Formular
  }
  stamp(n) {
    if (Puzzle.get(this.g)) return;
    if (this.order[this.got.length] === n) {
      this.got.push(n); Audio8.sfx('select', this.cx);
      if (this.got.length === this.order.length) {
        Puzzle.set(this.g, true); Puzzle.keep(this.save); this.okT = 90;
        Audio8.sfx('bigItem', this.cx); Game.note('pzFormOk'); W.flash = Math.max(W.flash, 4);
      }
    } else {
      this.got = []; this.badT = 50;
      Audio8.sfx('wall', this.cx); Game.note('pzFormBad'); W.shake = Math.max(W.shake, 4);
      for (let i = 0; i < 12; i++) W.spawn(new Particle(this.x + rnd(0, this.w), this.y + rnd(0, this.h), rnd(-1.2, 1.2), rnd(-1.6, 0.2), '#e8dcb4', 40, 2, 0.06)); // Papierschnipsel
    }
  }
  update() { this.t++; if (this.badT > 0) this.badT--; if (this.okT > 0) this.okT--; }
  draw(ctx) {
    const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), w = this.w, h = this.h;
    if (x > View.w + 8 || x + w < -8) return;
    if (this.rail !== null) { // Messingschiene mit Konsolen, an der die Stempel hängen
      const ry = Math.round(this.rail - W.cam.y);
      ctx.fillStyle = '#14141c'; ctx.fillRect(x - 6, ry - 3, w + 12, 6); ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 6, ry - 3, w + 12, 1); ctx.fillStyle = '#6c5420'; ctx.fillRect(x - 6, ry + 2, w + 12, 1);
      for (const bx of [x - 4, x + w + 1]) { ctx.fillStyle = '#14141c'; ctx.fillRect(bx, ry - 14, 3, 12); ctx.fillStyle = '#c8a040'; ctx.fillRect(bx, ry - 14, 1, 12); }
    }
    const shake = this.badT > 30 ? ((this.t >> 1) & 1 ? 1 : -1) : 0;
    ctx.fillStyle = '#3c2c1c'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 2, y - 2, w + 4, 1); // Rahmen
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x + shake, y, w, h); ctx.fillStyle = '#d4c8a8'; for (let k = 14; k < h; k += 6) ctx.fillRect(x + 4 + shake, y + k, w - 8, 1);
    Font.draw(ctx, tr('pzFormTitle'), x + w / 2 + shake, y + 2, '#2c2418', { align: 'center' });
    const n = this.order.length, cols = 2, bw = Math.floor((w - 8) / cols), bh = Math.floor((h - 14) / Math.ceil(n / cols)); // Felder 2 × 2 (lange Wörter)
    for (let i = 0; i < n; i++) {
      const bx = x + 4 + (i % cols) * bw + shake, by = y + 12 + Math.floor(i / cols) * bh;
      ctx.fillStyle = '#9c8c6c'; ctx.fillRect(bx, by, bw - 3, 1); ctx.fillRect(bx, by + bh - 2, bw - 3, 1); ctx.fillRect(bx, by, 1, bh - 1); ctx.fillRect(bx + bw - 4, by, 1, bh - 1);
      Font.draw(ctx, String(i + 1), bx + 3, by + 3, '#6c5c44');
      if (i < this.got.length) { // Stempelabdruck: rote Schrift im Rahmen, schräg verrutscht
        const word = tr('pzStamp' + this.got[i]), ww = Font.width(word) + 6;
        ctx.save(); ctx.translate(bx + (bw - 3) / 2 + 4, by + bh / 2 - 1); ctx.rotate(((i * 37) % 7 - 3) * 0.04); ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#b01828'; ctx.lineWidth = 1; ctx.strokeRect(-ww / 2 + 0.5, -6.5, ww, 12);
        Font.draw(ctx, word, 0, -3, '#b01828', { align: 'center' }); ctx.restore();
      }
    }
    if (this.badT > 0) { ctx.fillStyle = `rgba(200,20,30,${(this.badT / 50 * 0.35).toFixed(2)})`; ctx.fillRect(x, y, w, h); }
    if (this.okT > 0 && (this.okT & 8)) { ctx.fillStyle = 'rgba(90,250,150,0.25)'; ctx.fillRect(x, y, w, h); }
  }
}

// ---------------- Emailschild ----------------
// Kurzer Titel auf dem Schild (title), der lange Text (key) erscheint oben, solange der Held davor (darunter bis 8 Reihen tief) steht
class PzSign extends Ent {
  constructor(d) { super(d.x * T, d.y * T, T, T); this.kind = 'prop'; this.key = d.key; this.title = d.title; this.reach = (d.reach || 2) * T; this.col = d.col; }
  update() { this.t++; const p = W.player; if (this.key && p.alive && Math.abs(p.cx - this.cx) < this.reach && p.feet > this.y && p.feet <= this.y + 8 * T) pzSay(this.key); }
  draw(ctx) {
    const x = this.cx - W.cam.x, y = Math.round(this.y - W.cam.y);
    if (x < -120 || x > View.w + 120) return;
    Puzzle.enamel(ctx, x, y, tr(this.title), this.col);
  }
}
