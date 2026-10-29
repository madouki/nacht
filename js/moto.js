// Dampfrad (Schloss-Modus): ein Dampf-Velociped der Belle Époque aus dem Automatenwerk – Holzspeichenräder, Messingkessel
// unter dem Sattel, Schornstein hinten, Karbidlampe vorn, Ballhupe am Lenker (Fahrgestell in PS2-3D vorgerendert, Räder und
// Pleuel gemalt). ↑ daneben = aufsitzen; dann steuert das Fahrzeug den Helden (Zustand 'ride', entities.js): in Fahrtrichtung
// Gas, dagegen bremsen (im Stand: wenden), Sprung = Dampfsprung (auf einer Schanze mit ihrem Schwung), ↓ = ducken (unter
// niedrigen Trägern hindurch), Dash = Dampfstoß (kurz schneller), Angriff = Peitsche vom Sattel, ↑ = Hupe (im Stand: absteigen).
// Wände und Träger bremsen hart (Schaden), Gruben kosten Energie und setzen am letzten Prüfposten wieder auf.
// Raum: .prop('moto', { k: 'bike', x, y, dir } | { k: 'ramp', x0, x1, y, h, up } | { k: 'post', x, y }) – erste Strecke: die
// Versuchsstrecke links am Automatenwerk.
'use strict';

const Moto = (() => {
  const { mesh, box, prism, cone, beam, render } = PS2;
  const R = 9, WB = 11;                  // Radradius, halber Radstand (px)
  const SEAT = 12, LOW = 4;              // Füße des Helden über dem Boden: aufrecht / geduckt
  const HEAD = 35, HEADD = 26;           // Kopfhöhe: Träger mit 32 px Luft – aufrecht stößt man an, geduckt passt man durch
  const FAST = 3.4, BOOST = 4.6, HOP = -4.2, G = 0.2, LAUNCH = 2;
  const IRON = [40, 42, 52], IRONL = [104, 110, 128], BRASS = [218, 172, 76], LEATHER = [96, 52, 30], RED = [176, 30, 34], WOOD = [128, 86, 48];

  // ---------------- Fahrgestell (PS2-3D, einmal gerendert) ----------------
  // Ursprung: Boden mitten zwischen den Rädern, x nach vorn, y nach oben (px); Räder bei (±WB, R) malt drawBike selbst
  function bodyMesh() {
    const m = mesh(), arc = (cx, r, z) => { for (let k = 0; k < 6; k++) { const a0 = Math.PI * (0.12 + k * 0.13), a1 = a0 + 0.13; beam(m, cx + Math.cos(a0) * r, R + Math.sin(a0) * r, z, cx + Math.cos(a1) * r, R + Math.sin(a1) * r, z, 4, 1.2, IRON, { open: true }); } };
    beam(m, -WB, R, 0, -3, 17, 0, 1.8, 1.8, IRON); beam(m, -3, 17, 0, -2, 22, 0, 1.8, 1.8, IRON);   // Hinterbau, Sattelstütze
    beam(m, -2, 21, 0, 9, 23, 0, 2, 2, IRON); beam(m, 9, 24, 0, WB, R, 0, 2, 2, IRONL);              // Oberrohr, Gabel
    beam(m, 9, 22, 0, 0, 8, 0, 2, 2, IRON); beam(m, -WB, R, 0, 0, 7, 0, 1.6, 1.6, IRON);             // Unterrohr, Kettenstrebe
    arc(-WB, R + 2.4, 0); arc(WB, R + 2.4, 0);                                                         // Schutzbleche
    box(m, 0, 2, 0, 9, 5, 8, [34, 30, 34], { top: IRON }); box(m, 0, 3, -4.2, 5, 1.6, 0.6, [255, 140, 40], { e: 0.9 }); // Feuerbüchse mit Glut
    prism(m, 0, 7, 0, 4.4, 10, 8, BRASS, { top: [240, 206, 120] });                                   // Kessel
    for (const y of [8, 12, 16]) prism(m, 0, y, 0, 4.7, 0.9, 8, IRON);
    cone(m, 0, 17, 0, 4.4, 3, 8, BRASS); box(m, 0, 11, -4.6, 3.4, 2.4, 0.6, RED);                     // Dom, Namensschild
    prism(m, -9, 15, 1, 1.5, 11, 6, IRON); cone(m, -9, 26, 1, 2.6, 1.6, 6, IRONL);                    // Schornstein (Krone unter 32 px)
    box(m, -2.5, 22, 0, 9, 2.2, 6, LEATHER, { top: [124, 72, 42] });                                  // Sattel
    beam(m, 9, 23, 0, 7, 28, 0, 1.6, 1.6, IRON); beam(m, 7, 28, -4.5, 7, 28, 4.5, 1.4, 1.4, IRONL);  // Lenker
    for (const z of [-4.5, 4.5]) box(m, 6, 27.4, z, 3, 1.4, 1.6, [60, 36, 24]);
    box(m, 5.4, 29, -6, 2.6, 2.6, 2.6, RED); beam(m, 6.6, 30, -6, 11, 31, -6, 1, 1, BRASS);          // Ballhupe
    box(m, 13, 17, 0, 5, 5, 6, BRASS, { top: [240, 206, 120] }); box(m, 15.6, 18, 0, 0.8, 3.4, 4, [255, 240, 170], { e: 1 }); // Karbidlampe
    for (const z of [-4, 4]) box(m, 2, 9, z, 3.4, 1, 2, IRONL);                                       // Fußrasten
    beam(m, -3, 9, -3.6, -WB + 1, R, -3.6, 1, 1, BRASS);                                               // Kolbenstange zum Hinterrad
    return [m];
  }
  const SPRENV = { sun: null, sunC: [0.95, 0.86, 0.72], amb: [0.36, 0.36, 0.46], sky: [0.22, 0.22, 0.32], fog: [0, 0, 0], fogD: 0 };
  { const v = [-0.45, 0.65, -0.62], l = Math.hypot(...v); SPRENV.sun = v.map(c => c / l); }
  let bodyImg = null;
  function body() { // fast orthografisch in doppelter Auflösung rastern, weich halbieren
    if (bodyImg) return bodyImg;
    const W2 = 112, H2 = 84, ox = 56, oy = 72, D = 1500, sc = 2, yaw = -0.3;
    const c = Sprites.canvas(W2, H2);
    render(c.getContext('2d', { willReadFrequently: true }), W2, H2, bodyMesh(), { x: -D * Math.sin(yaw), y: 0, z: -D * Math.cos(yaw), yaw, pitch: 0, f: D * sc, near: 100, cx: ox, cy: oy }, SPRENV);
    const h = Sprites.canvas(W2 / 2, H2 / 2), x = h.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(c, 0, 0, W2 / 2, H2 / 2);
    return (bodyImg = { c: h, ox: ox / 2, oy: oy / 2 });
  }
  // Rad: eiserner Reifen, Messingfelge, zwölf Holzspeichen (drehen mit ph), Nabe
  function wheel(ctx, x, y, ph) {
    ctx.strokeStyle = '#141418'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, R - 1.2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, R - 2.8, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#9c6c38'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = ph + k * Math.PI / 6; ctx.moveTo(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5); ctx.lineTo(x + Math.cos(a) * (R - 3), y + Math.sin(a) * (R - 3)); } ctx.stroke();
    ctx.fillStyle = '#e0c070'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  }
  // Rampe (Holzschanze auf Eisenböcken): Keil von x0 bis x1, h hoch, up = 1 steigt nach rechts, -1 nach links
  function rampMesh(L, h, up, D = 28) {
    const m = mesh(), hiX = up > 0 ? L : 0, loX = L - hiX, v = (x, y, z) => PS2.vtx(m, x, y, z), C = [L / 2, h / 3, D / 2];
    const a = v(loX, 0, 0), b = v(hiX, 0, 0), c = v(hiX, h, 0), a2 = v(loX, 0, D), b2 = v(hiX, 0, D), c2 = v(hiX, h, D);
    PS2.face(m, [a, b, c], [70, 44, 26], C); PS2.face(m, [a2, b2, c2], [70, 44, 26], C);
    PS2.face(m, [a, c, c2, a2], WOOD, C); PS2.face(m, [b, c, c2, b2], [60, 38, 22], C);
    for (let k = 1; k < 6; k++) { const t = k / 6, x = loX + (hiX - loX) * t; beam(m, x, h * t + 0.3, 0, x, h * t + 0.3, D, 0.8, 0.5, [70, 44, 26], { open: true }); } // Plankenfugen
    for (const t of [0.35, 0.7]) { const x = loX + (hiX - loX) * t; box(m, x, 0, -0.4, 2, h * t, 1, IRON); }                             // Eisenböcke
    box(m, hiX - up * 1, h - 1, D / 2, 2, 1.4, D, BRASS);                                                                                  // Messingkante
    return [m];
  }
  // Prüfposten: Eisenpfosten mit Emailtafel und Signallampe (rot → grün, sobald man vorbeifährt)
  function postMesh(lit) {
    const m = mesh();
    box(m, 0, 0, 6, 8, 3, 8, IRON, { top: IRONL }); prism(m, 0, 3, 6, 1.4, 30, 6, IRON);
    box(m, 0, 24, 3, 12, 8, 2, [28, 44, 108]); box(m, 0, 34, 6, 5, 5, 5, IRON, { top: IRONL });
    box(m, 0, 35, 3.4, 3, 3, 0.6, lit ? [70, 240, 120] : [240, 50, 40], { e: 1 });
    return [m];
  }

  // höchste Standfläche bei x (Kacheln und Rampen), die nicht höher liegt als from; Infinity = Abgrund
  function groundAt(x, from) {
    const c = Math.floor(x / T), H = W.room.h; let best = Infinity, r = Math.max(0, Math.floor(from / T));
    for (; r < H; r++) if (Phys.solidTile(c, r)) break;
    if (r < H && r * T >= from - 0.01) best = r * T; // Kachel, deren Oberkante über from liegt, ist eine Wand
    for (const p of W.platforms) if (p.isRamp) { const s = p.surfaceAt(x); if (s !== null && s >= from - 0.01 && s < best) best = s; }
    return best;
  }

  function ride(p, I, P) { const b = p.ride; if (!b || b.dead) { Moto.release(p); return; } b.drive(p, I, P); }
  function bump(p, srcX) { if (p.ride) p.ride.bump(srcX); }
  function pose(p, H, a) { return p.atkT ? H.catk[a] : H.crouch; } // im Sattel: Hockpose, Peitsche aus der Hocke
  function release(p) { // Held vom Rad lösen (Absteigen, Tod, Raumwechsel)
    if (p.ride) p.ride.rider = null;
    p.ride = null; if (p.state === 'ride') p.state = 'normal';
    p.crouchAtk = false; p.y = p.feet - 28; p.h = 28;
  }
  const make = (d) => d.k === 'ramp' ? new MotoRamp(d) : d.k === 'post' ? new MotoPost(d) : d.k === 'gate' ? new MotoGate(d) : new MotoBike(d);
  return { R, WB, SEAT, LOW, HEAD, HEADD, FAST, BOOST, HOP, G, LAUNCH, body, wheel, rampMesh, postMesh, groundAt, ride, bump, pose, release, make };
})();

// ---------------- Das Dampfrad ----------------
class MotoBike extends Ent {
  constructor(d) {
    super(d.x * T, (d.y + 1) * T - 26, 28, 26); this.kind = 'prop';
    this.bx = d.x * T + 8; this.by = (d.y + 1) * T; this.dir = d.dir || -1;
    this.vx = 0; this.vy = 0; this.air = false; this.slope = 0; this.coyote = 0; this.ph = 0; this.tilt = 0; this.wob = 0;
    this.boostT = 0; this.boostCool = 0; this.crashT = 0; this.turnT = 0; this.hornT = 0; this.duck = false; this.rider = null; this.look = 0;
    this.safe = { x: this.bx, y: this.by, dir: this.dir }; this.placed = false; this.told = false;
  }
  place() { // steht der Held beim Betreten weit weg (Fortsetzen am Streckenende), wartet das Rad neben ihm
    this.placed = true;
    const p = W.player; if (Math.abs(p.cx - this.bx) < 20 * T) return;
    const side = p.cx < W.room.w * T / 2 ? 1 : -1, x = p.cx + side * 30, g = Moto.groundAt(x, p.feet - 12);
    if (g === Infinity) return;
    this.bx = x; this.by = g; this.dir = side; this.safe = { x, y: g, dir: side };
  }
  mount(p) {
    p.state = 'ride'; p.ride = this; this.rider = p;
    p.vx = 0; p.vy = 0; p.atkT = 0; p.dangle = false; p.dashT = 0; p.slideT = 0; p.flipT = 0; p.setCrouch(false);
    this.vx = 0; this.vy = 0; this.air = false; this.turnT = 0; this.look = W.look; this.safe = { x: this.bx, y: this.by, dir: this.dir };
    Audio8.sfx('hiss', this.bx); Audio8.sfx('chug', this.bx); this.puff(3);
    if (!this.told) { this.told = true; Game.note('motoGo'); }
    this.sync(p);
  }
  dismount(p) {
    const x = this.bx - this.dir * 20;
    if (Phys.rectSolid(x - p.w / 2, this.by - 28, p.w, 28)) return false; // kein Platz neben dem Rad
    Moto.release(p); this.mountCool = 20; // derselbe ↑-Druck setzt ihn nicht gleich wieder in den Sattel
    p.x = x - p.w / 2; p.y = this.by - p.h; p.onGround = true; p.vx = 0; p.vy = 0; p.face = this.dir;
    Audio8.sfx('step', this.bx); return true;
  }
  turn() { this.dir = -this.dir; this.turnT = 0; Audio8.sfx('whoosh', this.bx); W.dust(this.bx, this.by, 4); }
  puff(n = 1) { for (let i = 0; i < n; i++) W.spawn(new WerkPuff(this.bx - this.dir * 9 + rnd(-1, 1), this.by - 30, -this.dir * rnd(0.2, 0.7) - this.dir * this.vx * 0.4, -0.5 - Math.random() * 0.5, 3 + Math.random() * 2)); }
  bump(srcX) { this.wob = 18; this.vx *= 0.6; Audio8.sfx('clank', this.bx); }
  crash(key) {
    this.crashT = 26; this.wob = 22; this.vx = 0; if (!this.air) { this.vy = -1.6; this.air = true; }
    Audio8.sfx('wall', this.bx); W.shake = Math.max(W.shake, 8); Input.rumble(0.7, 0.6, 250);
    W.sparks(this.bx + this.dir * 18, this.by - 16, 8);
    W.popup(this.bx, this.by - 44, tr(key), '#fc7460');
    if (this.rider) this.rider.hurt(2, this.bx + this.dir * 30);
  }
  fell() { // in die Grube: Energie weg, am letzten Prüfposten wieder aufsetzen
    const p = this.rider, s = this.safe;
    this.bx = s.x; this.by = s.y; this.dir = s.dir; this.vx = 0; this.vy = 0; this.air = false; this.crashT = 0; this.boostT = 0;
    if (!p) return;
    const dmg = Options.god ? 0 : 3;
    p.fellAt = W.frame; Audio8.sfx('hurt'); Input.rumble(0.5, 0.8, 250);
    if (p.hp <= dmg) { p.hp = 0; Moto.release(p); p.die(true); return; }
    p.hp -= dmg; p.inv = 120; this.sync(p); this.look = this.dir * 40;
    W.popup(this.bx, this.by - 44, '-' + dmg, '#fc7460'); W.puff(this.bx, this.by); W.shake = 6;
  }
  sync(p) { // Held in den Sattel setzen (Hitbox in Hockgröße, Füße auf den Rasten)
    p.h = 20; p.x = this.bx - p.w / 2 + this.dir; p.y = this.by - (this.duck ? Moto.LOW : Moto.SEAT) - p.h;
    p.face = this.dir; p.onGround = !this.air; p.vx = this.dir * this.vx; p.vy = this.vy; p.crouch = false;
    p.lastSafe = { cx: this.safe.x, feet: this.safe.y };
  }
  drive(p, I, P) {
    const M = Moto, fwd = this.dir > 0 ? I.right : I.left, back = this.dir > 0 ? I.left : I.right;
    this.duck = !!I.down;
    if (this.boostCool > 0) this.boostCool--;
    if (this.hornT > 0) this.hornT--;
    // Gas, Bremse, Wenden, Dampfstoß
    if (this.crashT > 0) { this.crashT--; this.vx *= 0.85; }
    else if (back && !this.air) {
      if (this.vx > 0.15) { this.vx = Math.max(0, this.vx - 0.13); if (this.t % 3 === 0) W.sparks(this.bx - this.dir * M.WB, this.by - 1, 1); if (this.t % 9 === 0) Audio8.sfx('tink', this.bx); }
      else { this.vx = 0; if (++this.turnT > 12) this.turn(); }
    } else {
      this.turnT = 0;
      if (fwd) this.vx += ((this.boostT > 0 ? M.BOOST : M.FAST) - this.vx) * (this.air ? 0.012 : 0.045);
      else this.vx = Math.max(0, this.vx - (this.air ? 0.003 : 0.02));
    }
    if (P.dash && this.boostCool === 0 && this.crashT === 0) { this.boostT = 45; this.boostCool = 140; Audio8.sfx('hiss', this.bx); this.puff(4); W.shake = Math.max(W.shake, 3); }
    if (this.boostT > 0) { this.boostT--; if (this.vx > 0.5) this.vx += (M.BOOST - this.vx) * 0.12; if (this.t % 2 === 0) this.puff(); } // Dampffahne
    // Dampfsprung: am Boden oder kurz nach der Kante; auf einer Schanze mit ihrem Schwung
    if (P.jump && this.crashT === 0 && (!this.air || this.coyote > 0)) {
      this.vy = M.HOP + Math.min(0, this.air ? this.vy : this.slope * M.LAUNCH); this.air = true; this.coyote = 0;
      Audio8.sfx('djump', this.bx); Audio8.sfx('hiss', this.bx); this.puff(2); W.dust(this.bx, this.by, 3);
    }
    // waagrecht: Wand vor dem Vorderrad, Kopf gegen Träger
    let nx = this.bx + this.dir * this.vx;
    const head = this.duck ? M.HEADD : M.HEAD, front = nx + this.dir * (M.WB + M.R - 1);
    if (this.vx > 0 && (front < 2 || front > W.room.w * T - 2 || Phys.rectSolid(front - 1, this.by - 24, 2, 18))) {
      if (this.vx > 1.6) this.crash(nx < 4 * T ? 'motoBuffer' : 'motoCrash'); else this.vx = 0;
      nx = this.bx;
    } else if (Phys.rectSolid(nx - 6, this.by - head, 12, 5)) {
      if (this.vx > 1.2) this.crash('motoHead'); else this.vx = 0;
      nx = this.bx;
    }
    // senkrecht: Boden unter den Rädern folgen (Rampen hinauf), an Kanten abheben, in der Luft fallen und landen
    const groundAt = (x, from) => Math.min(M.groundAt(x - M.WB, from), M.groundAt(x, from), M.groundAt(x + M.WB, from));
    if (!this.air) {
      const g = groundAt(nx, this.by - 12);
      if (g > this.by + 6) { this.air = true; this.vy = Math.min(0, this.slope) * M.LAUNCH; this.coyote = 8; } // Kante oder Schanzenende
      else { this.slope = g - this.by; this.by = g; }
    }
    if (this.air) {
      this.vy = Math.min(this.vy + M.G, 6);
      let ny = this.by + this.vy;
      if (this.vy < 0 && Phys.rectSolid(nx - 6, ny - head, 12, 4)) { this.vy = 0.4; ny = this.by; }
      const g = groundAt(nx, this.by - 2);
      if (this.vy >= 0 && ny >= g) {
        const hard = this.vy > 3; this.by = g; this.air = false; this.vy = 0; this.slope = 0;
        W.dust(this.bx - M.WB, g, hard ? 4 : 2); W.dust(this.bx + M.WB, g, hard ? 4 : 2); Audio8.sfx(hard ? 'clank' : 'step', this.bx);
        if (hard) { W.shake = Math.max(W.shake, 4); Input.rumble(0.4, 0.4, 120); }
      } else this.by = ny;
      if (this.coyote > 0) this.coyote--;
    }
    this.bx = nx;
    if (this.by > W.room.h * T + 30) { this.fell(); if (p.state !== 'ride') return; }
    // Stacheln unter den Rädern; Rammstoß gegen Gegner
    if (!this.air && Phys.tile(Math.floor(this.bx / T), Math.floor((this.by + 1) / T)) === '^' && p.inv <= 0) p.hurt(3, this.bx + this.dir * 20);
    if (this.vx > 2.4) { const rb = { x: this.bx + this.dir * 10 - 8, y: this.by - 22, w: 16, h: 20 }; for (const e of W.ents) if (e.kind === 'enemy' && !e.dead && Phys.overlap(rb, e)) e.hit(3, 'ram' + Math.floor(this.t / 20)); }
    // Hupe / absteigen
    if (P.up) {
      if (!this.air && this.vx < 0.3 && this.crashT === 0) { if (this.dismount(p)) return; }
      else if (this.hornT === 0) { this.hornT = 40; Audio8.sfx('horn', this.bx); W.popup(this.bx + this.dir * 14, this.by - 46, tr('motoHorn'), '#f8d878'); }
    }
    // Lage, Räder, Dampf, Kamera
    const gF = M.groundAt(this.bx + this.dir * M.WB, this.by - 12), gR = M.groundAt(this.bx - this.dir * M.WB, this.by - 12);
    const want = this.air ? Math.max(-0.45, Math.min(0.35, this.vy * 0.07)) : (gF < Infinity && gR < Infinity ? Math.atan2(gF - gR, 2 * M.WB) : 0);
    this.tilt += (want - this.tilt) * 0.3;
    if (this.wob > 0) this.wob--;
    this.ph += this.vx / M.R;
    const per = Math.max(7, Math.round(24 - this.vx * 4));
    if (this.vx > 0.3 && this.t % per === 0) { Audio8.sfx('chug', this.bx); this.puff(); }
    if (!this.air && this.vx > 2 && this.t % 4 === 0) W.dust(this.bx - this.dir * M.WB, this.by, 1);
    this.look += (this.dir * (30 + this.vx * 22) - this.look) * 0.06; W.look = this.look;
    this.sync(p);
    if (P.sub) p.tryAttack(true, true); else if (P.attack) p.tryAttack(false, false);
    p.crouchAtk = true; p.atkDir = 'fwd'; p.tickAttack();
    if (!p.atkSub && p.atkT >= 12 && p.atkT <= 17) for (const k of [20, 28, 36]) { // der Hieb vom Sattel fegt auch Mauerbrocken vor dem Vorderrad weg
      const c = Math.floor((this.bx + this.dir * k) / T), r = Math.floor((this.by - 8) / T);
      if (Phys.tile(c, r) === 'X' || Phys.tile(c, r) === 'Y') W.breakTile(c, r, Phys.tile(c, r));
    }
  }
  update() {
    this.t++;
    if (!this.placed) this.place();
    const p = W.player;
    if (this.rider && (p.state !== 'ride' || p.ride !== this)) this.rider = null;
    if (!this.rider) {
      this.vx = 0; this.tilt *= 0.8;
      const g = Math.min(Moto.groundAt(this.bx - Moto.WB, this.by - 12), Moto.groundAt(this.bx + Moto.WB, this.by - 12));
      if (g > this.by + 1) { this.vy = Math.min(this.vy + Moto.G, 6); this.by = Math.min(g, this.by + this.vy); if (this.by > W.room.h * T + 30) { this.by = this.safe.y; this.bx = this.safe.x; } } else { this.by = g; this.vy = 0; }
      if (this.t % 50 === 0 && this.onScreen(20)) this.puff();
      const near = p.alive && p.state === 'normal' && p.onGround && Math.abs(p.cx - this.bx) < 26 && Math.abs(p.feet - this.by) < 10;
      if (this.mountCool > 0) this.mountCool--;
      if (near) { pzSay('motoMount'); if (Input.pressed.up && !(this.mountCool > 0)) this.mount(p); }
    }
    this.x = this.bx - 14; this.y = this.by - 26;
  }
  lightUp(L, cx, cy) {
    L.push({ x: this.bx + this.dir * 26 - cx, y: this.by - 18 - cy, r: 44, c: [255, 236, 170], a: 0.42 }); // Karbidlampe
    L.push({ x: this.bx - cx, y: this.by - 4 - cy, r: 14, c: [255, 140, 50], a: 0.4 });                   // Glut der Feuerbüchse
  }
  draw(ctx) {
    const sx = Math.round(this.bx - W.cam.x), sy = Math.round(this.by - W.cam.y);
    if (sx < -60 || sx > View.w + 60) return;
    const img = Moto.body(), wob = this.wob > 0 ? Math.sin(this.wob * 1.3) * 0.08 * (this.wob / 22) : 0, flash = this.rider && this.rider.inv > 0 && (W.frame & 2);
    ctx.save(); ctx.translate(sx, sy); ctx.scale(this.dir, 1); ctx.rotate(this.tilt + wob); // gespiegelt: dieselbe Drehung hebt die Nase in beide Richtungen
    if (flash) ctx.globalAlpha = 0.55;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(img.c, -img.ox, -img.oy);
    for (const wx of [-Moto.WB, Moto.WB]) Moto.wheel(ctx, wx, -Moto.R, this.ph);
    const cp = this.ph, kx = -Moto.WB + Math.cos(cp) * 4, ky = -Moto.R + Math.sin(cp) * 4; // Pleuel: Kurbelzapfen am Hinterrad ↔ Kessel
    ctx.strokeStyle = '#d8b060'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(-2, -9); ctx.stroke();
    ctx.fillStyle = '#f0d890'; ctx.fillRect(Math.round(kx) - 1, Math.round(ky) - 1, 2, 2);
    if (this.boostT > 0 && (this.t & 2)) { ctx.fillStyle = 'rgba(255,190,90,0.7)'; ctx.fillRect(-15, -30, 3, 3); }
    ctx.restore();
    if (this.boostT > 0 && this.vx > 3.6) { // Tempo-Streifen hinter dem Rad
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) { const y = sy - 6 - ((k * 37 + this.t * 3) % 40), len = 30 + ((k * 53 + this.t * 5) % 50), x = sx - this.dir * (24 + ((k * 29 + this.t * 11) % 60)); ctx.fillStyle = `rgba(255,230,180,${(0.08 + 0.04 * (k % 3)).toFixed(2)})`; ctx.fillRect(this.dir > 0 ? x - len : x, y, len, 1); }
      ctx.restore();
    }
  }
}

// ---------------- Rampe ----------------
// Holzschanze als schräge Plattform (zu Fuß begehbar, surfaceAt); das Dampfrad nimmt ihren Schwung mit in die Luft
class MotoRamp extends Ent {
  constructor(d) {
    super(d.x0 * T, (d.y + 1) * T - d.h, (d.x1 - d.x0 + 1) * T, d.h); this.kind = 'platform'; this.isRamp = true;
    this.base = (d.y + 1) * T; this.hh = d.h; this.up = d.up; this.dx = 0; this.dy = 0; this.o = {};
  }
  surfaceAt(x) {
    if (x < this.x || x > this.x + this.w) return null;
    const t = (x - this.x) / this.w; return this.base - this.hh * (this.up > 0 ? t : 1 - t);
  }
  update() {}
  draw(ctx) {
    const sx = this.x - W.cam.x, sy = this.base - W.cam.y;
    if (sx > View.w + 20 || sx + this.w < -20) return;
    PS2.drawLocal(ctx, this.o, () => Moto.rampMesh(this.w, this.hh, this.up), sx, sy, [-6, -this.hh - 10, this.w + 12, this.hh + 14], 'r');
  }
}

// ---------------- Prüfposten ----------------
class MotoPost extends Ent {
  constructor(d) { super(d.x * T, (d.y + 1) * T - 40, 16, 40); this.kind = 'prop'; this.fy = (d.y + 1) * T; this.lit = false; this.o = {}; }
  update() {
    this.t++;
    const p = W.player, b = p.state === 'ride' && p.ride;
    if (b && Math.abs(b.bx - this.cx) < 12) { // auch im Flug darüber: Wiedereinstieg am Fuß des Postens
      b.safe = { x: this.cx, y: this.fy, dir: b.dir };
      if (!this.lit) { this.lit = true; Audio8.sfx('checkpoint', this.cx); W.popup(this.cx, this.y - 6, tr('motoPost'), '#7cf0a8'); }
    }
  }
  lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.fy - 36 - cy, r: 18, c: this.lit ? [70, 255, 130] : [255, 60, 40], a: 0.5 }); }
  draw(ctx) {
    const sx = this.cx - W.cam.x, sy = this.fy - W.cam.y;
    if (sx < -30 || sx > View.w + 30) return;
    PS2.drawLocal(ctx, this.o, () => Moto.postMesh(this.lit), sx, sy, [-12, -44, 24, 48], this.lit ? 'g' : 'r');
  }
}

// ---------------- Zeitfahren: Start/Ziel-Tor, Wendemarke, Medaillen, Geisterfahrer ----------------
// Fährt man vom Start weg durch das Tor, läuft die Uhr; am Prellbock (Wendemarke) wenden und zurück durchs Tor = eine Runde.
// Bestzeit, Medaillen und die Bestfahrt (alle 2 Bilder Ort, Lage, Richtung) bleiben im Spielstand; beim nächsten Versuch fährt
// die Bestfahrt als Geisterfahrer mit. Absteigen bricht ab, Stürze kosten nur Zeit
const MotoRun = (() => {
  const MEDALS = [['gold', 32 * 60], ['silver', 40 * 60], ['bronze', 52 * 60]]; // Bilder
  const key = () => 'nachtmahr.' + (typeof Castle !== 'undefined' && Castle.testing ? 'test.' : '') + 'moto';
  const load = () => { try { return JSON.parse(localStorage.getItem(key()) || '{}') || {}; } catch (e) { return {}; } };
  const keep = (o) => { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) { /* privat */ } };
  const medalOf = (f) => (MEDALS.find(([, lim]) => f <= lim) || [null])[0];
  const fmt = (f) => (f / 60).toFixed(2);
  return { MEDALS, load, keep, medalOf, fmt };
})();

class MotoGate extends Ent { // d: { x, y } – Tor über der Strecke (Mitte x), y = Standreihe
  constructor(d) {
    super(d.x * T - 40, (d.y + 1) * T - 70, 80, 70); this.kind = 'prop'; this.gx = d.x * T + 8; this.fy = (d.y + 1) * T; this.o = {};
    this.run = null; this.lastX = null; this.result = null; this.resT = 0; this.ghost = null;
    const st = MotoRun.load(); this.best = st.best || 0; this.medal = st.best ? MotoRun.medalOf(st.best) : null;
  }
  start() {
    const st = MotoRun.load();
    this.run = { t: 0, turned: false, rec: [] }; this.result = null;
    if (st.ghost && st.ghost.length > 8) this.ghost = W.spawn(new MotoGhost(st.ghost, this));
    Audio8.sfx('go'); Game.note('motoRunGo'); W.popup(this.gx, this.fy - 74, tr('motoGo3'), '#fce0a8');
  }
  stop(abort) {
    if (this.ghost) { this.ghost.dead = true; this.ghost = null; }
    if (abort) { Game.note('motoAbort'); Audio8.sfx('select'); }
    this.run = null;
  }
  finish() {
    const r = this.run, f = r.t, st = MotoRun.load(), m = MotoRun.medalOf(f), newBest = !st.best || f < st.best;
    st.medals = st.medals || {};
    if (newBest) { st.best = f; st.ghost = r.rec; this.best = f; this.medal = m; }
    const first = m && !st.medals[m]; if (m) st.medals[m] = 1;
    MotoRun.keep(st);
    this.result = { f, m, newBest }; this.resT = 300;
    Audio8.sfx(m === 'gold' ? 'oneUp' : m ? 'bigItem' : 'item'); W.flash = Math.max(W.flash, m ? 6 : 2);
    Game.note(m ? 'motoMedal_' + m : 'motoNoMedal', MotoRun.fmt(f));
    if (first) { // erste Medaille dieser Art: der Prüfmeister zahlt aus
      const loot = m === 'gold' ? ['bagBig', 'bagBig', 'heartB'] : m === 'silver' ? ['bagBig', 'heartB'] : ['bagBig'];
      loot.forEach((t, i) => W.spawn(new Item(t, this.gx - 20 + i * 20, this.fy - 40)));
    }
    this.stop(false);
  }
  update() {
    this.t++; if (this.resT > 0) this.resT--;
    const p = W.player, b = p.state === 'ride' ? p.ride : null;
    if (this.run) {
      if (!b) { this.stop(true); this.lastX = null; return; } // abgestiegen
      const r = this.run; r.t++;
      if (r.t % 2 === 0) r.rec.push(Math.round(b.bx), Math.round(b.by), Math.round(b.tilt * 100), b.dir);
      if (!r.turned && b.bx < 10 * T) { r.turned = true; Audio8.sfx('checkpoint'); W.popup(b.bx, b.by - 50, tr('motoTurn'), '#7cf0a8'); }
      if (r.t > 60 * 300) this.stop(true); // nach fünf Minuten zählt es nicht mehr
    }
    if (b) {
      if (this.lastX !== null) {
        const crossedL = this.lastX >= this.gx && b.bx < this.gx, crossedR = this.lastX < this.gx && b.bx >= this.gx;
        if (crossedL && !this.run) this.start();
        else if (crossedR && this.run && this.run.turned) this.finish();
      }
      this.lastX = b.bx;
    } else this.lastX = null;
  }
  lightUp(L, cx, cy) { for (const s of [-1, 1]) L.push({ x: this.gx + s * 38 - cx, y: this.fy - 70 - cy, r: 34, c: [255, 214, 140], a: 0.45 }); }
  static mesh() { // Gusseisenpfosten mit Gaslaternen, genieteter Querträger mit Fachwerk
    if (MotoGate.M) return MotoGate.M;
    const { mesh, box, prism, cone, beam } = PS2, m = mesh(), IR = [40, 42, 52], IRL = [104, 110, 128], BR = [218, 172, 76];
    for (const s of [-1, 1]) {
      box(m, s * 38, 0, 16, 10, 5, 10, IR, { top: IRL }); prism(m, s * 38, 5, 16, 2.6, 58, 8, IR, { rTop: 2 }); prism(m, s * 38, 24, 16, 3.4, 3, 8, BR);
      box(m, s * 38, 63, 16, 7, 2, 7, IR); prism(m, s * 38, 65, 16, 3, 7, 6, [255, 230, 160], { e: 1 }); cone(m, s * 38, 72, 16, 4.4, 4, 6, IR);
    }
    beam(m, -40, 60, 16, 40, 60, 16, 4, 5, IR); beam(m, -40, 52, 16, 40, 52, 16, 2, 2, IRL);
    for (let k = -4; k < 4; k++) beam(m, k * 10, 53, 16, k * 10 + 10, 59, 16, 1.2, 1.2, IRL, { open: true });
    return (MotoGate.M = [m]);
  }
  draw(ctx) {
    const sx = this.gx - W.cam.x, sy = this.fy - W.cam.y;
    if (sx < -70 || sx > View.w + 70) return;
    PS2.drawLocal(ctx, this.o, MotoGate.mesh(), sx, sy, [-50, -84, 100, 90], 'g');
    const [lx, ly] = PS2.projLocal(sx, sy, -34, 51, 16), [rx] = PS2.projLocal(sx, sy, 34, 51, 16); // Zielflagge als Band unter dem Träger
    const x0 = Math.round(lx), x1 = Math.round(rx), y0 = Math.round(ly);
    for (let x = x0; x < x1; x += 3) for (let r = 0; r < 2; r++) { ctx.fillStyle = (Math.floor((x - x0) / 3) + r) % 2 ? '#e8e8ec' : '#141418'; ctx.fillRect(x, y0 + r * 3, 3, 3); }
    Font.draw(ctx, tr('motoGateT'), Math.round(sx), y0 + 8, '#fce0a8', { align: 'center', shadow: '#000' });
  }
}

// Geisterfahrer: die Bestfahrt als durchscheinendes Dampfrad mit weißem Fahrer – im Takt der laufenden Runde
class MotoGhost extends Ent {
  constructor(rec, gate) { super(0, 0, 28, 26); this.kind = 'prop'; this.rec = rec; this.gate = gate; this.ph = 0; this.lastBx = null; }
  at() {
    const r = this.gate.run; if (!r) return null;
    const R = this.rec, n = R.length / 4, k = Math.min(n - 1, r.t / 2), i = Math.floor(k), j = Math.min(n - 1, i + 1), u = k - i, q = (o) => R[i * 4 + o] + (R[j * 4 + o] - R[i * 4 + o]) * u;
    return { bx: q(0), by: q(1), tilt: q(2) / 100, dir: R[i * 4 + 3], done: r.t / 2 >= n - 1 };
  }
  update() {
    this.t++; const g = this.at(); if (!g) { this.dead = true; return; }
    if (this.lastBx !== null) this.ph += Math.abs(g.bx - this.lastBx) / Moto.R;
    this.lastBx = g.bx; this.x = g.bx - 14; this.y = g.by - 26;
  }
  draw(ctx) {
    const g = this.at(); if (!g) return;
    const sx = Math.round(g.bx - W.cam.x), sy = Math.round(g.by - W.cam.y);
    if (sx < -60 || sx > View.w + 60) return;
    ctx.save(); ctx.globalAlpha = g.done ? 0.2 : 0.55; ctx.globalCompositeOperation = 'lighter';
    ctx.translate(sx, sy); ctx.scale(g.dir, 1); ctx.rotate(g.tilt);
    const img = Moto.body(); ctx.imageSmoothingEnabled = true; ctx.drawImage(img.c, -img.ox, -img.oy);
    for (const wx of [-Moto.WB, Moto.WB]) Moto.wheel(ctx, wx, -Moto.R, this.ph);
    ctx.restore();
    const H = W.player.H, spr = H && H.crouch; // Fahrer als weißer Schemen
    if (spr) {
      const wc = Sprites.whiteOf(spr);
      ctx.save(); ctx.globalAlpha = g.done ? 0.18 : 0.5;
      ctx.drawImage(g.dir < 0 ? wc.f : wc.c, Math.round(g.bx - 5 + g.dir - 3 - (spr.mx || 0) - W.cam.x) - spr.pad, Math.round(g.by - Moto.SEAT - spr.h - W.cam.y) - spr.pad);
      ctx.restore();
    }
  }
}

// Anzeige des Zeitfahrens oben im Bild (über dem Licht, damit sie lesbar bleibt): laufende Zeit, Bestzeit mit Medaille, Ergebnis
Moto.drawHud = (ctx) => {
  const g = W.ents && W.ents.find(e => e instanceof MotoGate && !e.dead); if (!g) return;
  const cx = View.cx, col = { gold: '#f8d040', silver: '#c8d0dc', bronze: '#d08850' };
  const medal = (x, y, m) => { ctx.fillStyle = '#000'; ctx.fillRect(x - 5, y - 4, 11, 10); ctx.fillStyle = col[m]; ctx.fillRect(x - 3, y - 4, 7, 9); ctx.fillRect(x - 4, y - 3, 9, 7); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 2, 2); };
  if (g.run) {
    const s = tr('motoTime') + ' ' + MotoRun.fmt(g.run.t);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cx - 52, 34, 104, 12);
    Font.draw(ctx, s, cx, 36, g.run.turned ? '#7cf0a8' : '#fce0a8', { align: 'center', shadow: '#000' });
  }
  if (g.best) { const s = tr('motoBest') + ' ' + MotoRun.fmt(g.best); Font.draw(ctx, s, View.w - 8, 36, '#bcbcbc', { align: 'right', shadow: '#000' }); if (g.medal) medal(View.w - 16 - Font.width(s), 39, g.medal); }
  if (g.resT > 0 && g.result) {
    const r = g.result, s = MotoRun.fmt(r.f) + (r.m ? '  ' + tr('motoM_' + r.m) : '') + (r.newBest ? '  ' + tr('motoNewBest') : ''), w = Font.width(s) + 26;
    ctx.save(); ctx.globalAlpha = Math.min(1, g.resT / 30); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(cx - w / 2, 70, w, 16);
    if (r.m) medal(cx - w / 2 + 10, 78, r.m);
    Font.draw(ctx, s, cx + 7, 74, r.m ? col[r.m] : '#fcfcfc', { align: 'center', shadow: '#000' }); ctx.restore();
  }
};
