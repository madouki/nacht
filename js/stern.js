// Sternwarte des Amtsleiters (Schloss-Modus, hinter der Chefetage): Der Amtsleiter ist Hobby-Astronom – auch Sternbilder müssen
// genehmigt werden. Planetarium: ein riesiges Messing-Orrery unter offenem Himmel, vier Planeten kreisen auf Auslegern um die
// Sonne; man reitet auf ihnen hinauf zum Balkon (Saturn mit Ringen, Erde mit Mond). Gegner: Sternschnuppen (stürzen sich nach
// kurzem Aufglühen auf den Helden) und Astrolabien (drehende Messingringe, schießen Sternbolzen – mit der Peitsche zurückschlagbar).
// Sternkuppel: DAS STERNBILD (Endgegner der Sternwarte) – zehn Sterne, durch Linien verbunden, ordnen sich nacheinander zum
// GROSSEN BÄREN (Prankenwirbel, Ansturm), zum SKORPION (Stachel, Sternbolzen) und zum GROSSEN STEMPEL (Stempelschlag mit
// Bodenwellen, Sternregen). Treffbar sind nur die Sterne selbst.
'use strict';

const Stern = (() => {
  // ---------------- Himmel: Verlauf, Milchstraße, Sterne mit Funkeln, Mond, Sternschnuppen ----------------
  let MW = null, STARS = null, GLOW = null;
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function prep() {
    if (STARS) return;
    const r = rng(777); STARS = [];
    for (let i = 0; i < 280; i++) { const b = r(); STARS.push({ x: r() * 1600, y: r() * 420, b: b * b, c: b > 0.85 ? (r() < 0.5 ? '#fff0c8' : '#c8dcff') : '#e8ecff', ph: r() * 6 }); }
    MW = document.createElement('canvas'); MW.width = 640; MW.height = 260; const x = MW.getContext('2d'), rn = rng(99);
    for (let i = 0; i < 2600; i++) { // Milchstraße: schräges Band aus weichem Staub
      const t = rn(), px = t * 640, py = 200 - t * 150 + (rn() + rn() + rn() - 1.5) * 48, a = 0.05 + rn() * 0.08, s = 1 + rn() * 3;
      x.fillStyle = `rgba(${170 + rn() * 60 | 0},${160 + rn() * 50 | 0},${220 + rn() * 35 | 0},${a.toFixed(3)})`; x.fillRect(px, py, s, s);
    }
    GLOW = document.createElement('canvas'); GLOW.width = GLOW.height = 32; const g = GLOW.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(210,225,255,0.8)'); gr.addColorStop(0.5, 'rgba(120,160,255,0.22)'); gr.addColorStop(1, 'rgba(80,120,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  }
  class Sky extends Ent { // hinter den Kacheln: deckt den Hintergrund des Themas ab
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; this.d = d; this.shoot = null; prep(); }
    update() { this.t++; if (!this.shoot && Math.random() < 0.006) this.shoot = { x: rnd(40, View.w - 40), y: rnd(10, 80), vx: rnd(3, 5) * (Math.random() < 0.5 ? -1 : 1), vy: rnd(1, 2), t: 30 }; if (this.shoot && --this.shoot.t <= 0) this.shoot = null; }
    draw() { }
    drawBack(ctx) {
      const vw = View.w, cam = W.cam, f = W.frame;
      const g = ctx.createLinearGradient(0, 0, 0, 208); g.addColorStop(0, '#05071a'); g.addColorStop(0.6, '#0e0c2c'); g.addColorStop(1, '#241638');
      ctx.fillStyle = g; ctx.fillRect(0, 0, vw, 208);
      const mx = -((cam.x * 0.06 + f * 0.01) % 640); ctx.drawImage(MW, mx, -cam.y * 0.05 - 20); ctx.drawImage(MW, mx + 640, -cam.y * 0.05 - 20);
      for (const s of STARS) { // Sterne mit leichter Tiefe (zwei Schichten) und Funkeln
        const par = s.b > 0.5 ? 0.16 : 0.1, sx = ((s.x - cam.x * par - f * 0.015) % 1600 + 1600) % 1600, sy = ((s.y - cam.y * par) % 420 + 420) % 420;
        if (sx > vw || sy > 208) continue;
        const tw = 0.55 + 0.45 * Math.sin(f * 0.05 + s.ph * 3), a = (0.25 + s.b * 0.75) * tw;
        ctx.globalAlpha = a; ctx.fillStyle = s.c; ctx.fillRect(sx | 0, sy | 0, 1, 1);
        if (s.b > 0.7) { ctx.fillRect((sx | 0) - 1, sy | 0, 3, 1); ctx.fillRect(sx | 0, (sy | 0) - 1, 1, 3); }
      }
      ctx.globalAlpha = 1;
      if (this.d.moon) { // Mond mit Kratern und Hof
        const ox = vw * 0.78 - cam.x * 0.03, oy = 46 - cam.y * 0.03;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const h = ctx.createRadialGradient(ox, oy, 10, ox, oy, 60); h.addColorStop(0, 'rgba(200,210,255,0.25)'); h.addColorStop(1, 'rgba(120,140,255,0)'); ctx.fillStyle = h; ctx.fillRect(ox - 60, oy - 60, 120, 120); ctx.restore();
        ctx.fillStyle = '#e8e4d0'; ctx.beginPath(); ctx.arc(ox, oy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c8c2a8'; for (const [cx, cy, r] of [[-5, -4, 4], [6, 3, 3], [-2, 8, 2.5], [7, -7, 2]]) { ctx.beginPath(); ctx.arc(ox + cx, oy + cy, r, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = 'rgba(10,8,30,0.35)'; ctx.beginPath(); ctx.arc(ox + 6, oy - 2, 16, 0, Math.PI * 2); ctx.fill(); // Schatten: zunehmend
      }
      if (this.shoot) { const s = this.shoot, k = s.t / 30; ctx.strokeStyle = `rgba(255,250,230,${(0.8 * k).toFixed(2)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6); ctx.stroke(); s.x += s.vx; s.y += s.vy; }
    }
  }
  function glow(ctx, x, y, s, a) { ctx.globalAlpha = a; ctx.drawImage(GLOW, x - 16 * s, y - 16 * s, 32 * s, 32 * s); ctx.globalAlpha = 1; }

  // ---------------- Orrery: Sonne in der Mitte, Ausleger, vier Planeten als Plattformen ----------------
  const PLANETS = [ // r: Bahnradius (px), R: Planetenradius, sp: Winkel je Bild, Farben (hell, dunkel), Extras
    { r: 72, R: 14, sp: 0.0105, c: ['#c8c4c0', '#6c6870'], ph: 0.4, name: 0 },
    { r: 114, R: 15, sp: -0.0072, c: ['#f8d88c', '#a8743c'], ph: 2.6, name: 1 },
    { r: 156, R: 16, sp: 0.0058, c: ['#7cb8f8', '#2c5c9c'], ph: 4.4, moon: true, name: 2 },
    { r: 198, R: 22, sp: -0.006, c: ['#e8cc8c', '#8c6c3c'], ph: 1.2, rings: true, name: 3 },
  ];
  class Orrery extends Ent {
    constructor(d) {
      super(d.x * T + 8, d.y * T, 0, 0); this.kind = 'prop'; this.d = d; prep();
      this.plats = PLANETS.map((p, i) => new Planet(this, p, i));
    }
    update() { this.t++; if (this.t % 30 === 0 && Math.abs(this.x - W.player.cx) < View.w) Audio8.sfx('tick', this.x); }
    drawBack(ctx) { // Sockel, Bahnen, Ausleger, Sonne (hinter den Kacheln und Figuren)
      const sx = this.x - W.cam.x, sy = this.y - W.cam.y, f = W.frame;
      ctx.fillStyle = '#2c2014'; ctx.fillRect(sx - 9, sy, 18, 400); ctx.fillStyle = '#a87c3c'; ctx.fillRect(sx - 7, sy, 4, 400); ctx.fillStyle = '#5c4020'; ctx.fillRect(sx + 3, sy, 4, 400);
      ctx.strokeStyle = 'rgba(232,200,120,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      for (const p of this.plats) { ctx.beginPath(); ctx.arc(sx, sy, p.p.r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);
      for (const p of this.plats) { // Ausleger: Messingarm mit Gegengewicht
        const px = p.bx - W.cam.x, py = p.by - W.cam.y, a = Math.atan2(py - sy, px - sx);
        ctx.strokeStyle = '#3c2c14'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - Math.cos(a) * 20, sy - Math.sin(a) * 20); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = '#d8a850'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx - Math.cos(a) * 20, sy - Math.sin(a) * 20); ctx.lineTo(px, py); ctx.stroke();
        ctx.fillStyle = '#7c5c2c'; ctx.beginPath(); ctx.arc(sx - Math.cos(a) * 22, sy - Math.sin(a) * 22, 4, 0, Math.PI * 2); ctx.fill();
      }
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + f * 0.01; ctx.fillStyle = '#c89838'; ctx.fillRect(sx + Math.cos(a) * 27 - 2, sy + Math.sin(a) * 27 - 2, 4, 4); } // Zahnkranz
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; // Sonne: glühender Messingball mit Korona
      const h = ctx.createRadialGradient(sx, sy, 6, sx, sy, 70); h.addColorStop(0, 'rgba(255,200,90,0.55)'); h.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = h; ctx.fillRect(sx - 70, sy - 70, 140, 140); ctx.restore();
      const sg = ctx.createRadialGradient(sx - 6, sy - 6, 2, sx, sy, 22); sg.addColorStop(0, '#fff4c0'); sg.addColorStop(0.5, '#f8b838'); sg.addColorStop(1, '#a85418');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 - f * 0.02; ctx.strokeStyle = 'rgba(255,220,120,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 24, sy + Math.sin(a) * 24); ctx.lineTo(sx + Math.cos(a) * 31, sy + Math.sin(a) * 31); ctx.stroke(); }
    }
    draw() { }
    lightUp(L, cx, cy) { L.push({ x: this.x - cx, y: this.y - cy, r: 110, c: [255, 190, 90], a: 0.55 }); }
  }
  class Planet extends Ent { // Plattform: gewölbte Oberseite (surfaceAt), trägt den Helden auf der Bahn mit
    constructor(o, p, i) { super(0, 0, p.R * 2, p.R * 2); this.kind = 'platform'; this.o = o; this.p = p; this.i = i; this.slack = 4; this.dx = this.dy = 0; this.ang = p.ph; this.place(); }
    place() { this.bx = this.o.x + Math.cos(this.ang) * this.p.r; this.by = this.o.y + Math.sin(this.ang) * this.p.r; this.x = this.bx - this.p.R; this.y = this.by - this.p.R; }
    update() { const ox = this.bx, oy = this.by; this.ang += this.p.sp; this.place(); this.dx = this.bx - ox; this.dy = this.by - oy; }
    surfaceAt(x) { const d = x - this.bx, R = this.p.R; return Math.abs(d) > R * 0.95 ? null : this.by - Math.sqrt(R * R - d * d); }
    carryAt() { return [this.dx, this.dy]; }
    onStand() { if (typeof Castle !== 'undefined' && Castle.on && Castle.flags && !Castle.flags['planet' + this.i]) { Castle.flags['planet' + this.i] = 1; Audio8.sfx('tink', this.bx); } }
    draw(ctx) {
      const p = this.p, sx = Math.round(this.bx - W.cam.x), sy = Math.round(this.by - W.cam.y), R = p.R;
      if (sx < -60 || sx > View.w + 60) return;
      if (p.rings) { ctx.strokeStyle = '#b89c64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sx, sy, R * 1.9, R * 0.5, -0.25, Math.PI, Math.PI * 2); ctx.stroke(); }
      const g = ctx.createRadialGradient(sx - R * 0.35, sy - R * 0.4, 1, sx, sy, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, p.c[0]); g.addColorStop(1, p.c[1]);
      ctx.fillStyle = '#0c0814'; ctx.beginPath(); ctx.arc(sx, sy, R + 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fill();
      if (p.name === 2) { ctx.fillStyle = 'rgba(80,170,90,0.75)'; ctx.fillRect(sx - 6, sy - 4, 7, 5); ctx.fillRect(sx + 3, sy + 3, 5, 4); } // Kontinente
      if (p.name === 3) { ctx.fillStyle = 'rgba(140,100,50,0.35)'; ctx.fillRect(sx - R + 3, sy - 3, R * 2 - 6, 2); ctx.fillRect(sx - R + 4, sy + 4, R * 2 - 8, 2); }
      if (p.rings) { ctx.strokeStyle = '#e8d4a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sx, sy, R * 1.9, R * 0.5, -0.25, 0, Math.PI); ctx.stroke(); }
      if (p.moon) { const a = W.frame * 0.05, mx = sx + Math.cos(a) * (R + 9), my = sy + Math.sin(a) * (R + 9) * 0.5; ctx.fillStyle = '#d8d4c8'; ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(sx - 3, sy - R, 6, 1); // Lichtkante oben: hier steht man
    }
  }

  // ---------------- Sternbolzen (gewöhnliches Geschoss: per Konter zurückschlagbar) ----------------
  class Bolt extends EProj {
    constructor(x, y, vx, vy, dmg) { super('star', x, y, vx, vy, 0, dmg); }
    draw(ctx) {
      const x = this.cx - W.cam.x, y = this.cy - W.cam.y, a = this.t * 0.3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y, 0.8, this.reflected ? 0.9 : 0.7); ctx.restore();
      ctx.fillStyle = this.reflected ? '#a4e4fc' : '#fff4c8';
      for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2; ctx.fillRect(Math.round(x + Math.cos(b) * 3) - 1, Math.round(y + Math.sin(b) * 3) - 1, 2, 2); }
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 20, c: [200, 220, 255], a: 0.45 }); }
  }

  // ---------------- Sternschnuppe: schwebt, glüht auf, stürzt sich auf den Helden, formt sich oben neu ----------------
  class Sternschnuppe extends Enemy {
    constructor(x, y) { super(x * T + 2, y * T + 2, 12, 12, 2, 2, 200); this.hx = this.x; this.hy = this.y; this.st = 'hover'; this.timer = (x * 37) % 120; this.trail = []; this.vx = 0; this.vy = 0; prep(); }
    update() {
      super.update(); this.timer++;
      const p = W.player;
      if (this.st === 'hover') { this.y = this.hy + Math.sin(this.t * 0.05) * 4; if (this.timer > 140 && p.alive && Math.abs(p.cx - this.cx) < 240) { this.st = 'aim'; this.timer = 0; this.tx = p.cx; this.ty = p.cy; Audio8.sfx('charge', this.cx); } }
      else if (this.st === 'aim') { if (this.timer > 34) { const dx = this.tx - this.cx, dy = this.ty - this.cy, l = Math.hypot(dx, dy) || 1; this.vx = dx / l * 4; this.vy = dy / l * 4; this.st = 'dive'; this.timer = 0; Audio8.sfx('whoosh', this.cx); } }
      else if (this.st === 'dive') {
        this.x += this.vx; this.y += this.vy; this.trail.push([this.cx, this.cy]); if (this.trail.length > 10) this.trail.shift();
        if (Phys.solidTile(Math.floor(this.cx / T), Math.floor((this.y + this.h) / T)) || this.timer > 110) { // Einschlag: Funken, oben neu
          for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2, 2), rnd(-2.5, -0.3), i % 2 ? '#fff4c8' : '#a4c4fc', 30, 1, 0.1));
          Audio8.sfx('crumble', this.cx); this.x = this.hx; this.y = this.hy; this.st = 'hover'; this.timer = 0; this.trail = []; this.vx = this.vy = 0;
        }
      }
      this.touch();
    }
    draw(ctx) {
      const x = this.cx - W.cam.x, y = this.cy - W.cam.y;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      this.trail.forEach(([tx, ty], i) => glow(ctx, tx - W.cam.x, ty - W.cam.y, 0.3 + i * 0.05, i / 14));
      glow(ctx, x, y, this.st === 'aim' ? 1 + Math.sin(this.timer * 0.6) * 0.3 : 0.8, this.flashT > 0 ? 1 : 0.85);
      ctx.restore();
      ctx.fillStyle = this.flashT > 0 ? '#ffffff' : '#fff8d8'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
      if (this.st === 'aim') { ctx.strokeStyle = 'rgba(255,120,80,0.6)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(this.tx - W.cam.x, this.ty - W.cam.y); ctx.stroke(); ctx.setLineDash([]); } // Zielstrahl warnt
      this.lastDraw = null;
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 26, c: [220, 230, 255], a: 0.5 }); }
  }

  // ---------------- Astrolabium: drehende Messingringe, Sternbolzen ----------------
  class Astrolab extends Enemy {
    constructor(x, y) { super(x * T - 2, y * T - 2, 20, 20, 6, 2, 400); this.hy = this.y; this.cd = 80 + (x * 13) % 60; this.face = -1; prep(); }
    update() {
      super.update();
      const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy;
      this.y = this.hy + Math.sin(this.t * 0.04) * 6; this.face = dx < 0 ? -1 : 1;
      if (p.alive && Math.hypot(dx, dy) < 300 && --this.cd <= 0) {
        const l = Math.hypot(dx, dy) || 1; W.spawn(new Bolt(this.cx, this.cy, dx / l * 1.9, dy / l * 1.9, this.dmg)); this.cd = 120; Audio8.sfx('tink', this.cx);
      }
      this.touch();
    }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), a = this.t * 0.04, w = this.flashT > 0, warn = this.cd < 24;
      for (const [k, col] of [[0, '#d8a850'], [1, '#a87c3c'], [2, '#f0cc78']]) { ctx.strokeStyle = w ? '#fff' : col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 11 - k * 2, Math.abs(Math.cos(a * (k + 1) + k)) * (11 - k * 2) + 1, a * (k % 2 ? -1 : 1) + k, 0, Math.PI * 2); ctx.stroke(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y, warn ? 1.1 : 0.6, warn ? 0.9 : 0.5); ctx.restore();
      ctx.fillStyle = warn && (this.t & 2) ? '#ffffff' : '#7cc8f8'; ctx.fillRect(x - 2, y - 2, 4, 4);
      this.lastDraw = null;
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 24, c: [150, 200, 255], a: 0.4 }); }
  }

  function make(d) {
    if (d.k === 'sky') return new Sky(d);
    if (d.k === 'orrery') return new Orrery(d);
    return new Ent(0, 0, 1, 1);
  }
  return { make, Sky, Orrery, Planet, Bolt, Sternschnuppe, Astrolab, glow, prep };
})();

// ---------------- DAS STERNBILD (Zwischengegner 'stern', Sternkuppel) ----------------
// Zehn Sterne; dieselben zehn ordnen sich zu drei Bildern (Verbindungslinien je Bild). Nur die Sterne nehmen Schaden (hurtBoxes).
// Bei zwei Dritteln und einem Drittel der Energie fliegen sie auseinander und setzen sich neu zusammen (unverwundbar).
const STERN_FORMS = [
  { key: 'bossSternBear', s: 1.45, // Großer Bär: Deichsel, Kasten, Beine, Kopf
    n: [[-72, -18], [-46, -28], [-22, -20], [0, -12], [4, 14], [38, 16], [42, -10], [66, -26], [-6, 42], [34, 44]],
    e: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3], [6, 7], [4, 8], [5, 9]] },
  { key: 'bossSternScorp', s: 1.45, // Skorpion: Scheren, Kopf, Leib, Schwanz, Stachel (Stern 9)
    n: [[-66, -34], [-68, -8], [-44, -20], [-18, -12], [8, -4], [28, 8], [42, 28], [58, 38], [70, 24], [64, 6]],
    e: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]] },
  { key: 'bossSternStamp', s: 1.15, // Großer Stempel: Knauf, Griff, Holzblock, Gummiplatte (kleiner: bleibt im Bild)
    n: [[0, -62], [-9, -42], [9, -42], [-7, -18], [7, -18], [-42, -2], [42, -2], [-42, 24], [42, 24], [0, 24]],
    e: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 6], [5, 6], [5, 7], [6, 8], [7, 9], [9, 8]] },
];
class Sternbild extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw - 140, gy - 160, 140, 110, 96, 3);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 30000; this.nameKey = 'bossStern'; this.music = 'sternbild'; this.keepMusic = true;
    this.form = 0; this.cx0 = ax + aw - 120; this.cy0 = gy - 110; this.rot = 0; this.lootY = gy - 40;
    this.pts = STERN_FORMS[0].n.map(([x, y]) => ({ x: x * 1.45, y: y * 1.45, fl: 0 })); this.from = null;
    this.state = 'intro'; this.timer = 0; this.red = 0; this.sting = null; this.marks = []; Stern.prep();
    for (const p of this.pts) { p.sx = p.x * 3; p.sy = p.y * 3 - 200; } // Auftritt: die Sterne fallen von weit oben an ihren Platz
  }
  porto() { return true; } // Bodenwellen (Post.Welle) treffen immer
  world(p) { const c = Math.cos(this.rot), s = Math.sin(this.rot); return [this.cx0 + p.x * c - p.y * s, this.cy0 + p.x * s + p.y * c]; }
  nodes() { return this.pts.map(p => { if (p.sx !== undefined) return [this.cx0 + p.sx, this.cy0 + p.sy]; const w = this.world(p); return p === this.pts[9] && this.sting ? [this.sting.x, this.sting.y] : w; }); }
  hurtBoxes() { if (!this.vulnerable()) return []; return this.nodes().map(([x, y]) => ({ x: x - 8, y: y - 8, w: 16, h: 16 })); }
  vulnerable() { return this.state !== 'intro' && this.state !== 'morph' && !this.dying; }
  hit(dmg, id) {
    const r = super.hit(dmg * (this.state === 'rest' ? 1.5 : 1), id);
    if (r) { const N = this.nodes(), p = W.player; let bi = 0, bd = 1e9; N.forEach(([x, y], i) => { const d = Math.hypot(x - p.cx, y - p.cy); if (d < bd) { bd = d; bi = i; } }); this.pts[bi].fl = 12; W.spawn(new Particle(N[bi][0], N[bi][1], rnd(-1.5, 1.5), rnd(-2, 0), '#e8f0ff', 24, 1, 0.05)); }
    return r;
  }
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.cx0, W.cam.x + 90, W.cam.x + View.w - 90), this.gy - 170, tr(k), col); }
  morph(to) { this.from = this.pts.map(p => ({ x: p.x, y: p.y })); this.form = to; this.go('morph'); this.rot = 0; this.sting = null; this.say(STERN_FORMS[to].key, '#c8dcff'); Audio8.sfx('holy', this.cx0); W.flash = 6; }
  touchHurt() { // Berührung: Sterne immer, Linien nur in Angriffen (Prankenwirbel, Ansturm, Stachel)
    const p = W.player; if (!p.alive) return;
    const N = this.nodes(), hitR = (x, y, r) => Math.abs(x - p.cx) < p.w / 2 + r && Math.abs(y - p.cy) < p.h / 2 + r;
    for (const [x, y] of N) if (hitR(x, y, 6)) { p.hurt(this.dmg, x); return; }
    if (this.state === 'swipe' || this.state === 'charge' || (this.state === 'sting' && this.timer > 12)) {
      for (const [a, b] of STERN_FORMS[this.form].e) { const [x0, y0] = N[a], [x1, y1] = N[b], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10); for (let k = 1; k < n; k++) if (hitR(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 2)) { p.hurt(this.dmg, x0); return; } }
    }
  }
  attack() {
    const r = Math.random(), f = this.form;
    if (f === 0) { if (r < 0.5) { this.go('swipeWind'); this.red = 1; Audio8.sfx('charge', this.cx0); } else { this.go('chargeWind'); this.red = 1; this.dir = W.player.cx < this.cx0 ? -1 : 1; Audio8.sfx('growl', this.cx0); } }
    else if (f === 1) { if (r < 0.5) { this.go('stingWind'); this.tx = W.player.cx; Audio8.sfx('charge', this.cx0); } else this.go('volley'); }
    else { if (r < 0.55) { this.go('slamUp'); Audio8.sfx('whoosh', this.cx0); } else this.go('rain'); }
  }
  update() {
    this.tick();
    const p = W.player, ease = (v, to, k) => v + (to - v) * k, fast = this.form === 2 ? 1.25 : 1;
    for (const q of this.pts) if (q.fl > 0) q.fl--;
    for (const m of this.marks) m.t--; this.marks = this.marks.filter(m => m.t > 0);
    if (this.red > 0 && this.state !== 'swipeWind' && this.state !== 'chargeWind' && this.state !== 'swipe' && this.state !== 'charge') this.red = Math.max(0, this.red - 0.05);
    const N = this.nodes(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of N) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    this.x = x0 - 8; this.y = y0 - 8; this.w = x1 - x0 + 16; this.h = y1 - y0 + 16;
    if (this.dying) { // die Sterne fliegen auseinander, ein letzter Glanz
      for (const q of this.pts) { if (q.vx === undefined) { const a = Math.atan2(q.y, q.x) + rnd(-0.3, 0.3); q.vx = Math.cos(a) * rnd(2, 5); q.vy = Math.sin(a) * rnd(2, 5) - 1; } q.x += q.vx; q.y += q.vy; q.vy += 0.02; }
      if (this.dying === 1) { W.flash = 14; W.shake = 20; Audio8.sfx('holy', this.cx0); Audio8.sfx('shatter', this.cx0); }
      if (this.dying % 3 === 0) W.spawn(new Particle(this.cx0 + rnd(-90, 90), this.cy0 + rnd(-60, 60), rnd(-1, 1), rnd(-1.5, 0.5), ['#fff4c8', '#c8dcff', '#a4c4fc'][this.dying % 3], 50, 1, 0.02));
      return this.updateDeath(150);
    }
    // Phasenwechsel
    if (this.form === 0 && this.hp <= this.maxHp * 2 / 3 && this.state !== 'morph') this.morph(1);
    else if (this.form === 1 && this.hp <= this.maxHp / 3 && this.state !== 'morph') this.morph(2);
    const F = STERN_FORMS[this.form];
    if (this.state === 'intro') { // Sterne fallen an ihren Platz
      for (const q of this.pts) { q.sx = ease(q.sx, q.x, 0.06); q.sy = ease(q.sy, q.y, 0.06); }
      if (this.timer === 40) Audio8.sfx('holy', this.cx0);
      if (this.timer > 100) { for (const q of this.pts) { delete q.sx; delete q.sy; } this.go('idle'); }
      return;
    }
    if (this.state === 'morph') { // auseinander, im Bogen an die neuen Plätze
      const k = Math.min(1, this.timer / 70), e = k * k * (3 - 2 * k);
      this.pts.forEach((q, i) => { const a = this.from[i], b = F.n[i], bx = b[0] * F.s, by = b[1] * F.s, lift = Math.sin(k * Math.PI) * (40 + i * 6); q.x = a.x + (bx - a.x) * e + Math.sin(k * Math.PI) * Math.cos(i * 1.7) * 30; q.y = a.y + (by - a.y) * e - lift; });
      this.cy0 = ease(this.cy0, this.gy - 110, 0.05);
      if (this.timer >= 70) { this.pts.forEach((q, i) => { q.x = F.n[i][0] * F.s; q.y = F.n[i][1] * F.s; }); this.go('idle'); Audio8.tempo(this.form === 2 ? 1.12 : 1.06); }
      return;
    }
    this.touchHurt();
    if (this.state === 'idle') { // schwebt über dem Helden, wiegt sich
      const want = clamp(p.cx + (p.cx < this.ax + this.aw / 2 ? 90 : -90), this.ax + 100, this.ax + this.aw - 100);
      this.cx0 += clamp((want - this.cx0) * 0.02, -1.1 * fast, 1.1 * fast); this.cy0 = ease(this.cy0, this.gy - (this.form === 2 ? 96 : 112) + Math.sin(this.t * 0.03) * 10, 0.05);
      this.rot = ease(this.rot, Math.sin(this.t * 0.02) * 0.12, 0.1);
      if (this.timer > (this.form === 2 ? 50 : 70)) this.attack();
    } else if (this.state === 'rest') { // nach dem Angriff: Sterne flackern matt (Schaden ×1,5)
      this.rot = ease(this.rot, 0, 0.08);
      if (this.timer > 70) this.go('idle');
    } else if (this.state === 'swipeWind') { this.rot = ease(this.rot, -0.4, 0.08); if (this.timer > 32) { this.go('swipe'); Audio8.sfx('whoosh', this.cx0); } }
    else if (this.state === 'swipe') { // Prankenwirbel: dreht sich einmal herum und rückt auf den Helden zu
      this.rot += 0.21 * fast; this.cx0 += clamp(p.cx - this.cx0, -2.2, 2.2);
      if (this.timer > 30) { this.go('rest'); this.red = 0.6; }
    } else if (this.state === 'chargeWind') { this.cy0 = ease(this.cy0, this.gy - 70, 0.08); this.cx0 -= this.dir * 0.4; if (this.timer > 40) { this.go('charge'); Audio8.sfx('roar', this.cx0); } }
    else if (this.state === 'charge') { // Ansturm quer durch die Kuppel
      this.cx0 += this.dir * 4.2 * fast; this.rot = this.dir * 0.15;
      if (this.cx0 < this.ax + 90 || this.cx0 > this.ax + this.aw - 90) { this.cx0 = clamp(this.cx0, this.ax + 90, this.ax + this.aw - 90); W.shake = 10; Audio8.sfx('boom', this.cx0); this.go('rest'); }
    } else if (this.state === 'stingWind') { // Skorpion: Zielmarke am Boden, dann sticht der Stachel zu
      this.tx = ease(this.tx, p.cx, 0.05);
      if (this.timer > 44) { this.go('sting'); const s = this.world(this.pts[9]); this.sting = { x: s[0], y: s[1], sx: s[0], sy: s[1] }; Audio8.sfx('whoosh', this.cx0); }
    } else if (this.state === 'sting') {
      const s = this.sting, k = Math.min(1, this.timer / 10), back = this.timer > 34 ? Math.min(1, (this.timer - 34) / 14) : 0, ty = this.gy - 12;
      s.x = s.sx + (this.tx - s.sx) * k * (1 - back); s.y = s.sy + (ty - s.sy) * k * (1 - back);
      if (this.timer === 10) { W.shake = 8; Audio8.sfx('stamp', this.tx); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.tx, ty, rnd(-2, 2), rnd(-2.5, -0.5), '#c8dcff', 26, 1, 0.1)); }
      if (this.timer > 48) { this.sting = null; this.go('rest'); }
    } else if (this.state === 'volley') { // Sternbolzen aus dem Kopf (zurückschlagbar)
      if (this.timer % 12 === 6 && this.timer < 66) { const [hx, hy] = this.nodes()[2], dx = p.cx - hx, dy = p.cy - hy, l = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + rnd(-0.12, 0.12); W.spawn(new Stern.Bolt(hx, hy, Math.cos(a) * 2.3, Math.sin(a) * 2.3, this.dmg - 1)); Audio8.sfx('tink', hx); }
      if (this.timer > 80) this.go('rest');
    } else if (this.state === 'slamUp') { // Großer Stempel: steigt, folgt dem Helden, schlägt zu
      this.cy0 = ease(this.cy0, this.gy - 112, 0.08); this.cx0 += clamp(p.cx - this.cx0, -2.4, 2.4);
      if (this.timer > 46) { this.go('slam'); this.vy = 1; }
    } else if (this.state === 'slam') {
      this.vy += 0.9; this.cy0 += this.vy; const floor = this.gy - 24 * STERN_FORMS[2].s;
      if (this.cy0 >= floor) {
        this.cy0 = floor; W.shake = 18; Audio8.sfx('stamp', this.cx0); Audio8.sfx('boom', this.cx0); Input.rumble(0.8, 0.6, 300);
        W.spawn(new Post.Welle(this.cx0 - 64, this.gy, -1, this)); W.spawn(new Post.Welle(this.cx0 + 64, this.gy, 1, this));
        this.marks.push({ x: this.cx0, t: 240 }); W.popup(this.cx0, this.gy - 70, tr('bossSternOk'), '#fc5c5c');
        this.go('rest');
      }
    } else if (this.state === 'rain') { // Sternregen: fallende Sterne mit Schattenwarnung
      if (this.timer % 16 === 1 && this.timer < 100) { const x = clamp(p.cx + rnd(-130, 130), this.ax + 16, this.ax + this.aw - 16); W.spawn(new SternTropfen(x, this.gy, this)); }
      if (this.timer > 130) this.go('rest');
    }
  }
  draw() { }
  drawLit(ctx) {
    if (this.dying > 120) return;
    const N = this.nodes(), F = STERN_FORMS[this.form], cam = W.cam, warn = this.red > 0 || this.state === 'stingWind';
    const fy = Math.round(this.gy - cam.y);
    for (const m of this.marks) { const a = Math.min(1, m.t / 60) * 0.6, x = Math.round(m.x - cam.x); ctx.fillStyle = `rgba(200,24,40,${a.toFixed(2)})`; ctx.fillRect(x - 30, fy - 2, 60, 2); }
    if (this.state === 'stingWind') { const x = Math.round(this.tx - cam.x), k = this.timer / 44; ctx.strokeStyle = `rgba(255,90,70,${(0.4 + k * 0.5).toFixed(2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, fy - 1, 10 + k * 8, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (!this.dying) { // Bildumriss wie in einem alten Sternatlas: zarte Fläche zwischen den Sternen
      ctx.fillStyle = `rgba(90,120,220,${(0.06 + 0.03 * Math.sin(this.t * 0.05)).toFixed(3)})`; ctx.beginPath();
      const cx = N.reduce((a, n) => a + n[0], 0) / N.length, cy = N.reduce((a, n) => a + n[1], 0) / N.length;
      [...N].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)).forEach(([x, y], i) => (i ? ctx.lineTo(x - cam.x, y - cam.y) : ctx.moveTo(x - cam.x, y - cam.y))); ctx.closePath(); ctx.fill();
      for (const [a, b] of F.e) { // Verbindungslinien: breiter Schein, heller Kern (rot vor einem Angriff)
        const [xa, ya] = N[a], [xb, yb] = N[b];
        ctx.strokeStyle = warn ? `rgba(255,${Math.round(120 - this.red * 60)},90,0.35)` : 'rgba(110,150,255,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xa - cam.x, ya - cam.y); ctx.lineTo(xb - cam.x, yb - cam.y); ctx.stroke();
        ctx.strokeStyle = warn ? 'rgba(255,200,170,0.85)' : 'rgba(210,228,255,0.85)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    N.forEach(([x, y], i) => { // Sterne
      const q = this.pts[i], tw = 0.85 + 0.15 * Math.sin(this.t * 0.2 + i * 1.3), big = i === 9 && this.form === 1 ? 1.3 : 1, dim = this.state === 'rest' ? 0.7 : 1;
      Stern.glow(ctx, x - cam.x, y - cam.y, (1.1 + (q.fl ? 0.5 : 0)) * big * tw, (q.fl ? 1 : 0.85) * dim);
    });
    ctx.restore();
    N.forEach(([x, y], i) => { const q = this.pts[i], sx = Math.round(x - cam.x), sy = Math.round(y - cam.y); ctx.fillStyle = q.fl ? '#ffffff' : this.state === 'rest' ? '#c8d0e8' : '#fffcf0'; ctx.fillRect(sx - 1, sy - 3, 3, 7); ctx.fillRect(sx - 3, sy - 1, 7, 3); });
    this.lastDraw = null;
  }
  lightUp(L, cx, cy) { if (this.dying > 100) return; this.nodes().forEach(([x, y], i) => { if (i % 2 === 0) L.push({ x: x - cx, y: y - cy, r: 44, c: this.red > 0 ? [255, 140, 110] : [150, 180, 255], a: 0.35 }); }); }
}
class SternTropfen extends Ent { // Sternregen: Schatten am Boden warnt, dann fällt der Stern
  constructor(x, gy, b) { super(x - 6, W.cam.y - 20, 12, 12); this.kind = 'eproj'; this.gy = gy; this.b = b; this.warn = 40; this.vy = 0; this.dmg = b.dmg; this.tx = x; }
  update() {
    this.t++;
    if (this.warn > 0) { this.warn--; return; }
    this.vy = Math.min(7, this.vy + 0.45); this.y += this.vy;
    const p = W.player; if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.dead = true; }
    if (this.y + this.h >= this.gy || this.b.dying) { this.dead = true; for (let i = 0; i < 6; i++) W.spawn(new Particle(this.cx, this.gy - 2, rnd(-1.5, 1.5), rnd(-2, -0.4), '#fff4c8', 24, 1, 0.1)); Audio8.sfx('tink', this.cx); }
  }
  draw(ctx) {
    const fy = Math.round(this.gy - W.cam.y), cx = Math.round(this.tx - W.cam.x), k = this.warn > 0 ? 1 - this.warn / 40 : 1;
    ctx.fillStyle = `rgba(160,190,255,${(0.2 + 0.4 * k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(cx, fy - 1, 4 + 6 * k, 2, 0, 0, Math.PI * 2); ctx.fill();
    if (this.warn > 0) return;
    const x = this.cx - W.cam.x, y = this.cy - W.cam.y;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; Stern.glow(ctx, x, y, 0.9, 0.9); ctx.strokeStyle = 'rgba(200,220,255,0.5)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 18); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  }
}
