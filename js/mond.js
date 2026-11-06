// Mond (Schloss-Modus): In der Sternkuppel steht nach dem Sternbild die Mondkanone des Amtsleiters (Jules Verne lässt grüßen).
// ↑ davor: der Held steigt in die Kapsel, BUMM – Flug durchs All (Sternstreifen, der Mond wächst), Landung im Mondmeer.
// Dort: geringe Schwerkraft (W.room.grav), die Erde steht am Himmel, Mondkälber hüpfen in hohen Bögen, Sternschnuppen.
// Die Rückkehrkapsel steckt im Mondboden (↑: zurück in die Sternkuppel). Hinter dem Mondmeer der Krater mit dem MANN IM MOND:
// Vollmond (Pusten, Käsebrocken – zurückschlagbar), Halbmond (eine Gesichtshälfte im Schatten, dazu die Mondsichel als Bumerang),
// Neumond (fast dunkel, nur die Augen glühen: Mondbeben mit Bodenwellen, Sternregen). Treffbar sind die offenen Augen.
// Raum: .prop('mond', { k: 'cannon', x, y, dest: 'mondmeer' }) / { k: 'capsule', x, y, dest: 'sternkuppel' }
'use strict';

const Mond = (() => {
  let F = null, arrive = null, MOON = null, EARTH = null;
  // ---------------- Flug ----------------
  function start(p, d) {
    F = { t: 0, dest: d.dest, back: d.k === 'capsule' };
    p.state = 'cannon'; p.vx = p.vy = 0; Game.noteT = 0; // Stationshinweis ausblenden
    W.shake = 24; W.flash = 10; Audio8.sfx('boom'); Audio8.sfx('whoosh'); Input.rumble(1, 0.8, 500);
    W.spawn(new FlightView());
  }
  function ride(p) { // vom Helden-Update aufgerufen (Zustand 'cannon')
    if (!F) { p.state = 'normal'; return; }
    if (F.done) { if (W.room !== F.room) { F = null; p.state = 'normal'; } return; }
    F.t++;
    if (F.t % 30 === 0) Audio8.sfx('whoosh');
    if (F.t === 150) {
      F.done = true; F.room = W.room; arrive = { dest: F.dest, back: F.back };
      if (typeof Castle !== 'undefined' && Castle.setFlag && !F.back) Castle.setFlag('mond_landed');
      const f = Castle.side[F.dest]; Game.castleGo({ s: f.s, r: f.r, place: 'start' });
    }
  }
  class FlightView extends Ent { // Flug durchs All: Sternstreifen, Ziel wächst in der Bildmitte, die Kapsel mit Feuerschweif
    constructor() { super(0, 0, 1, 1); this.kind = 'fx'; this.st = Array.from({ length: 90 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random() * 200, v: 1 + Math.random() * 3 })); }
    update() { if (!F) this.dead = true; for (const s of this.st) { s.r += s.v * (1 + s.r * 0.03); if (s.r > 260) { s.r = 2; s.a = Math.random() * Math.PI * 2; } } }
    draw() { }
    drawLit(ctx) {
      if (!F) return;
      const vw = View.w, cx = vw / 2, cy = 104, k = Math.min(1, F.t / 150);
      ctx.fillStyle = '#04030c'; ctx.fillRect(0, 0, vw, 208);
      for (const s of this.st) { const x0 = cx + Math.cos(s.a) * s.r, y0 = cy + Math.sin(s.a) * s.r * 0.7, l = 2 + s.r * 0.08; ctx.strokeStyle = `rgba(230,236,255,${Math.min(1, s.r / 120).toFixed(2)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(s.a) * l, y0 + Math.sin(s.a) * l * 0.7); ctx.stroke(); }
      const r = 6 + k * k * 120; // Ziel: Mond (hin) oder Erde (zurück)
      if (F.back) { prepEarth(); ctx.drawImage(EARTH, cx - r, cy - r, r * 2, r * 2); } else { prepMoon(); ctx.drawImage(MOON, cx - r, cy - r, r * 2, r * 2); }
      const sx = cx + Math.sin(F.t * 0.1) * 6, sy = cy + 40 - k * 20; // Kapsel mit Feuerschweif
      for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#fff4c0', '#f8b838', '#e84c1c'][i % 3]; ctx.fillRect(sx - 2 + (Math.random() - 0.5) * 4, sy + 10 + i * 3, 4, 3); }
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx - 6, sy - 9, 12, 20); ctx.fillStyle = '#c8ccd8'; ctx.fillRect(sx - 5, sy - 8, 10, 18); ctx.fillStyle = '#e84040'; ctx.fillRect(sx - 3, sy - 12, 6, 4); ctx.fillStyle = '#7cc8f8'; ctx.fillRect(sx - 2, sy - 4, 4, 4);
      if (F.t < 14) { ctx.fillStyle = `rgba(255,250,230,${(1 - F.t / 14).toFixed(2)})`; ctx.fillRect(0, 0, vw, 208); } // Mündungsblitz
      if (F.t > 120 || F.done) { ctx.fillStyle = `rgba(255,252,240,${F.done ? 1 : ((F.t - 120) / 30).toFixed(2)})`; ctx.fillRect(0, 0, vw, 208); }
    }
  }
  // ---------------- Mond- und Erdscheibe (vorgerendert) ----------------
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function prepMoon() {
    if (MOON) return; const R = 64; MOON = document.createElement('canvas'); MOON.width = MOON.height = R * 2 + 4; const x = MOON.getContext('2d'), c = R + 2, r = rng(4242);
    const g = x.createRadialGradient(c - 18, c - 20, 6, c, c, R); g.addColorStop(0, '#dcd8cc'); g.addColorStop(0.6, '#b4b0a4'); g.addColorStop(1, '#78746c');
    x.fillStyle = g; x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.fill(); x.save(); x.clip();
    for (const [mx, my, mr] of [[-22, -10, 20], [10, -24, 14], [18, 14, 18], [-12, 26, 12]]) { x.fillStyle = 'rgba(120,118,112,0.35)'; x.beginPath(); x.arc(c + mx, c + my, mr, 0, Math.PI * 2); x.fill(); } // Mondmeere
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = r() * R * 0.92, cr = 2 + r() * 7, px = c + Math.cos(a) * d, py = c + Math.sin(a) * d; x.fillStyle = 'rgba(90,88,84,0.45)'; x.beginPath(); x.arc(px, py, cr, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(255,255,250,0.35)'; x.lineWidth = 1; x.beginPath(); x.arc(px + 0.6, py + 0.6, cr, Math.PI * 0.9, Math.PI * 1.9); x.stroke(); } // Krater mit Lichtrand
    x.restore();
  }
  function prepEarth() {
    if (EARTH) return; const R = 64; EARTH = document.createElement('canvas'); EARTH.width = EARTH.height = R * 2 + 4; const x = EARTH.getContext('2d'), c = R + 2, r = rng(1969);
    const g = x.createRadialGradient(c - 18, c - 20, 6, c, c, R); g.addColorStop(0, '#9cd8ff'); g.addColorStop(0.55, '#2c74c8'); g.addColorStop(1, '#0c2c64');
    x.fillStyle = g; x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.fill(); x.save(); x.clip();
    for (let i = 0; i < 9; i++) { const px = c + (r() - 0.5) * R * 1.6, py = c + (r() - 0.5) * R * 1.6; x.fillStyle = i % 3 ? 'rgba(80,150,70,0.85)' : 'rgba(170,140,80,0.8)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(px + (r() - 0.5) * 22, py + (r() - 0.5) * 16, 5 + r() * 9, 0, Math.PI * 2); x.fill(); } } // Kontinente
    x.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(c + (r() - 0.5) * R * 1.8, c + (r() - 0.5) * R * 1.8, 6 + r() * 14, 2 + r() * 3, r(), 0, Math.PI * 2); x.fill(); } // Wolkenbänder
    const sh = x.createLinearGradient(c - R, 0, c + R, 0); sh.addColorStop(0, 'rgba(0,0,10,0)'); sh.addColorStop(0.62, 'rgba(0,0,10,0)'); sh.addColorStop(1, 'rgba(0,0,10,0.75)'); x.fillStyle = sh; x.fillRect(0, 0, c * 2, c * 2); // Nachtseite
    x.restore(); x.strokeStyle = 'rgba(140,200,255,0.6)'; x.lineWidth = 2; x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.stroke(); // Atmosphäre
  }
  class EarthSky extends Ent { // die Erde am Mondhimmel (über dem Sternenhimmel aus js/stern.js)
    constructor(d) { super(0, 0, 1, 1); this.kind = 'prop'; prepEarth(); }
    draw() { }
    drawBack(ctx) {
      const ex = View.w * 0.28 - W.cam.x * 0.025, ey = 54 - W.cam.y * 0.02, R = 34;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const h = ctx.createRadialGradient(ex, ey, R * 0.8, ex, ey, R * 1.8); h.addColorStop(0, 'rgba(90,150,255,0.3)'); h.addColorStop(1, 'rgba(60,110,255,0)'); ctx.fillStyle = h; ctx.fillRect(ex - R * 2, ey - R * 2, R * 4, R * 4); ctx.restore();
      ctx.drawImage(EARTH, ex - R, ey - R, R * 2, R * 2);
    }
  }
  // ---------------- Mondkanone (Sternkuppel) und Rückkehrkapsel (Mondmeer) ----------------
  class Cannon extends Ent {
    constructor(d) { super(d.x * T - 12, (d.y + 1) * T - 44, 40, 44); this.kind = 'prop'; this.d = d; this.kick = 0; }
    ready() { if (this.d.k === 'capsule') return true; const M = W.room.mini; return !M || !!W.miniDone[W.stage + ':' + W.roomIdx]; }
    update() {
      this.t++; if (this.kick > 0) this.kick--;
      const ar = arrive, side = ar && Castle.side[ar.dest];
      if (side && W.stage === side.s && W.roomIdx === side.r) { // Ankunft: Held steigt hier aus
        const p = W.player; arrive = null; F = null; p.state = 'normal';
        p.x = this.cx - p.w / 2 + (this.d.k === 'capsule' ? 26 : 0); p.y = this.y + this.h - p.h; p.vx = p.vy = 0; this.kick = 30;
        W.shake = 14; Audio8.sfx('boom'); for (let i = 0; i < 18; i++) W.spawn(new Particle(this.cx + rnd(-16, 16), this.y + this.h - 4, rnd(-1.6, 1.6), rnd(-2.2, -0.4), '#d8d4c8', 40, 2, 0.03));
        if (!ar.back) W.popup(p.cx, p.y - 16, tr('mondLand'), '#f8f4e0');
      }
      const p = W.player;
      if (!p.alive || p.state !== 'normal' || !p.onGround || Math.abs(p.cx - this.cx) > 16 || Math.abs(p.feet - (this.y + this.h)) > 4) return;
      if (!this.ready()) { pzSay('mondClosed'); return; }
      pzSay(this.d.k === 'capsule' ? 'mondBack' : 'mondIn');
      if (Input.pressed.up) { this.kick = 24; start(p, this.d); }
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), k = this.kick > 0 ? Math.sin(this.kick * 0.8) * 2 : 0;
      if (sx < -60 || sx > View.w + 60) return;
      if (this.d.k === 'capsule') { // Projektilkapsel, schräg im Mondboden steckend, Luke, Bullauge, rote Spitze
        ctx.save(); ctx.translate(sx + 20, sy + 40); ctx.rotate(-0.35);
        ctx.fillStyle = '#100c14'; ctx.fillRect(-11, -41, 22, 42); ctx.fillStyle = '#c8ccd8'; ctx.fillRect(-10, -40, 20, 40); ctx.fillStyle = '#e8ecf4'; ctx.fillRect(-10, -40, 4, 40);
        ctx.fillStyle = '#e84040'; ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(0, -54); ctx.lineTo(10, -40); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5c6070'; for (let y = -34; y < 0; y += 9) ctx.fillRect(-10, y, 20, 1);
        ctx.fillStyle = '#1c2c4c'; ctx.beginPath(); ctx.arc(0, -24, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = (this.t >> 4) & 1 ? '#7cdcfc' : '#4c9cd8'; ctx.beginPath(); ctx.arc(0, -24, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#9c988c'; ctx.fillRect(sx + 2, sy + 40, 36, 4); // aufgeworfener Mondstaub
        return;
      }
      // Mondkanone: Lafette mit Speichenrädern, Messingrohr steil nach oben rechts, Mündung mit Ring, Zielfernrohr
      ctx.save(); ctx.translate(sx + 16, sy + 30 + k);
      ctx.fillStyle = '#2c1c10'; ctx.fillRect(-16, -4, 34, 10); ctx.fillStyle = '#5c3c20'; ctx.fillRect(-15, -3, 32, 8);
      ctx.rotate(-0.95);
      ctx.fillStyle = '#3c2810'; ctx.fillRect(-6, -8, 52, 16); const g = ctx.createLinearGradient(0, -7, 0, 7); g.addColorStop(0, '#f8dc8c'); g.addColorStop(0.5, '#c8963c'); g.addColorStop(1, '#6c4818');
      ctx.fillStyle = g; ctx.fillRect(-5, -7, 50, 14); ctx.fillStyle = '#f8e8b0'; ctx.fillRect(44, -9, 6, 18); ctx.fillStyle = '#100c14'; ctx.fillRect(48, -5, 2, 10);
      ctx.fillStyle = '#7c5c2c'; for (const x of [8, 22, 34]) ctx.fillRect(x, -8, 2, 16); // Ringe
      ctx.fillStyle = '#2c2c38'; ctx.fillRect(10, -13, 16, 4); ctx.fillStyle = '#7cc8f8'; ctx.fillRect(25, -13, 2, 4); // Fernrohr
      ctx.restore();
      for (const wx of [sx + 4, sx + 28]) { ctx.strokeStyle = '#3c2810'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, sy + 38, 7, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#a87c3c'; ctx.lineWidth = 1; for (let a = 0; a < 4; a++) { const b = a * Math.PI / 4 + this.t * 0.0; ctx.beginPath(); ctx.moveTo(wx - Math.cos(b) * 6, sy + 38 - Math.sin(b) * 6); ctx.lineTo(wx + Math.cos(b) * 6, sy + 38 + Math.sin(b) * 6); ctx.stroke(); } }
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 10 - cy, r: 22, c: this.ready() ? [255, 220, 140] : [255, 90, 70], a: 0.35 }); }
  }

  // ---------------- Mondkalb: hüpft in hohen, weichen Bögen auf den Helden zu ----------------
  class Mondkalb extends Enemy {
    constructor(x, y) { super(x * T, y * T + 2, 16, 14, 4, 2, 300); this.vy = 0; this.vx = 0; this.cd = 30 + (x * 7) % 50; this.face = -1; this.air = false; }
    update() {
      super.update();
      const p = W.player, g = 0.09;
      this.vy = Math.min(this.vy + g, 2.4); this.y += this.vy;
      if (this.vx) { this.x += this.vx; if (Phys.solidTile(Math.floor((this.vx > 0 ? this.x + this.w : this.x) / T), Math.floor((this.y + 4) / T))) { this.x -= this.vx; this.vx = -this.vx; } }
      const fr = Math.floor((this.y + this.h) / T);
      if (this.vy >= 0 && Phys.solidTile(Math.floor(this.cx / T), fr)) {
        this.y = fr * T - this.h; if (this.air) { Audio8.sfx('step', this.cx); for (let i = 0; i < 3; i++) W.spawn(new Particle(this.cx, this.y + this.h, rnd(-0.8, 0.8), rnd(-0.6, -0.1), '#c8c4b8', 20, 1, 0.02)); }
        this.vy = 0; this.vx = 0; this.air = false;
        if (--this.cd <= 0 && p.alive && Math.abs(p.cx - this.cx) < 260) { this.face = p.cx < this.cx ? -1 : 1; this.vy = -3.1; this.vx = this.face * 1.15; this.air = true; this.cd = 60; }
      }
      if (this.y > W.room.h * T) this.kill(true);
      this.touch();
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), w = this.flashT > 0, f = this.face, squash = !this.air && this.cd > 52 ? 2 : 0;
      ctx.fillStyle = '#100c14'; ctx.fillRect(sx - 1, sy + 1 + squash, 18, 13 - squash);
      ctx.fillStyle = w ? '#ffffff' : '#e8e4dc'; ctx.fillRect(sx, sy + 2 + squash, 16, 11 - squash); ctx.fillStyle = '#c8c4b8'; ctx.fillRect(sx, sy + 10, 16, 3);
      ctx.fillStyle = '#9c98a8'; ctx.fillRect(sx + 3, sy + 4, 3, 2); ctx.fillRect(sx + 10, sy + 7, 2, 2); // Mondflecken
      const hx = f > 0 ? sx + 12 : sx; ctx.fillStyle = w ? '#ffffff' : '#f4f0e8'; ctx.fillRect(hx - 1, sy - 2 + squash, 6, 7); // Kopf
      ctx.fillStyle = '#100c14'; ctx.fillRect(hx + (f > 0 ? 3 : 0), sy + 1 + squash, 2, 2); ctx.fillStyle = '#e8a8b0'; ctx.fillRect(hx + (f > 0 ? 4 : -1), sy + 3 + squash, 2, 1);
      ctx.fillStyle = '#f8d878'; ctx.fillRect(hx, sy - 4 + squash, 1, 2); ctx.fillRect(hx + 4, sy - 4 + squash, 1, 2); // Hörnchen
      ctx.fillStyle = '#8c8898'; if (this.air) { ctx.fillRect(sx + 2, sy + 13, 2, 3); ctx.fillRect(sx + 12, sy + 13, 2, 3); } else { ctx.fillRect(sx + 2, sy + 13, 2, 1); ctx.fillRect(sx + 12, sy + 13, 2, 1); }
      this.lastDraw = null;
    }
  }

  // ---------------- Geschosse des Mannes im Mond ----------------
  class Kaese extends EProj { // Käsebrocken: gewöhnliches Geschoss (per Konter zurückschlagbar), weicher Bogen
    constructor(x, y, vx, vy, dmg) { super('cheese', x, y, vx, vy, 0.05, dmg); this.w = this.h = 8; }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
      if (this.reflected) { ctx.fillStyle = (this.t & 2) ? 'rgba(164,228,252,0.7)' : 'rgba(88,160,252,0.45)'; ctx.fillRect(x - 3, y - 3, 14, 14); }
      ctx.fillStyle = '#5c4410'; ctx.fillRect(x - 1, y - 1, 10, 10); ctx.fillStyle = '#f8d048'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = '#fce88c'; ctx.fillRect(x, y, 8, 2);
      ctx.fillStyle = '#c89820'; ctx.fillRect(x + 2, y + 3, 2, 2); ctx.fillRect(x + 5, y + 5, 2, 2); // Löcher
    }
  }
  class Sichel extends Ent { // Mondsichel: Bumerang quer durch den Krater, nicht zu zerschlagen (darüber springen, darunter durch)
    constructor(b, dir) { super(b.mx - 14, b.gy - 30, 28, 18); this.kind = 'eproj'; this.unstoppable = true; this.b = b; this.dir = dir; this.v = 3.2; this.dmg = b.dmg; this.low = true; }
    update() {
      this.t++; const b = this.b; this.x += this.dir * this.v;
      if (this.low && (this.x < b.ax + 6 || this.x + this.w > b.ax + b.aw - 6)) { this.dir = -this.dir; this.low = false; this.y = b.gy - 66; Audio8.sfx('whoosh', this.cx); } // kehrt hoch zurück
      if (!this.low && Math.abs(this.cx - b.mx) < 20) this.dead = true;
      const p = W.player; if (p.alive && Phys.overlap(this, p)) p.hurt(this.dmg, this.cx);
      if (b.dying || this.t > 400) this.dead = true;
    }
    draw(ctx) {
      const x = this.cx - W.cam.x, y = this.cy - W.cam.y, a = this.t * 0.3 * this.dir;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,180,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2); ctx.arc(-4, 0, 10, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 30, c: [255, 240, 180], a: 0.45 }); }
  }

  function make(d) {
    if (d.k === 'cannon' || d.k === 'capsule') return new Cannon(d);
    if (d.k === 'earth') return new EarthSky(d);
    return new Ent(0, 0, 1, 1);
  }
  return { make, start, ride, active: () => !!F, state: () => F, Cannon, Mondkalb, Kaese, Sichel, prepMoon, moon: () => (prepMoon(), MOON) };
})();

// ---------------- DER MANN IM MOND (Zwischengegner 'mond', Krater) ----------------
// Eine große Mondscheibe mit Gesicht schwebt über dem Kraterboden (hinter den Kacheln: beim Auftritt geht sie hinter dem
// Kraterrand auf). Treffbar sind nur die offenen Augen; nach jedem Angriff ist er müde (Schaden ×1,5).
class MannImMond extends Boss {
  constructor(ax, aw) {
    const gy = (W.room.h - 2) * T;
    super(ax + aw / 2 - 64, gy - 220, 128, 128, 100, 3);
    this.ax = ax; this.aw = aw; this.gy = gy; this.mini = true; this.score = 32000; this.nameKey = 'bossMond'; this.music = 'mondboss'; this.keepMusic = true;
    this.mx = ax + aw / 2; this.my = gy + 90; this.R = 64; this.lit = 1; this.phase = 0; this.lootY = gy - 40;
    this.state = 'intro'; this.timer = 0; this.puff = 0; this.mouth = 0; this.lid = 0; this.angry = 0; Mond.prepMoon();
  }
  porto() { return true; }
  eyes() { return [[this.mx - 21, this.my - 14], [this.mx + 21, this.my - 14]]; }
  eyeOpen(i) { // Halbmond: das linke Auge liegt im Schatten; geschlossene Lider schützen
    if (this.lid > 0.5) return false;
    if (this.phase === 1 && i === 0) return false;
    return true;
  }
  hurtBoxes() { if (!this.vulnerable()) return []; return this.eyes().filter((e, i) => this.eyeOpen(i)).map(([x, y]) => ({ x: x - 9, y: y - 7, w: 18, h: 14 })); }
  vulnerable() { return this.state !== 'intro' && this.state !== 'eclipse' && !this.dying; }
  hit(dmg, id) { const r = super.hit(dmg * (this.state === 'tired' ? 1.5 : 1), id); if (r) { this.lid = 1; Audio8.sfx('hurt', this.mx); } return r; }
  go(s) { this.state = s; this.timer = 0; }
  say(k, col) { W.popup(clamp(this.mx, W.cam.x + 90, W.cam.x + View.w - 90), this.my - this.R - 16, tr(k), col); }
  attack() {
    const r = Math.random(), ph = this.phase;
    if (ph === 2 && r < 0.35) { this.go('quake'); this.angry = 1; Audio8.sfx('growl', this.mx); }
    else if (ph === 2 && r < 0.6) this.go('rain');
    else if (ph >= 1 && r < 0.55) this.go('sickle');
    else if (r < 0.5) { this.go('blowWind'); Audio8.sfx('charge', this.mx); }
    else this.go('cheese');
  }
  update() {
    this.tick();
    const p = W.player, ease = (v, to, k) => v + (to - v) * k;
    this.lid = Math.max(0, this.lid - 0.08); if (this.t % 160 < 6) this.lid = 1; // blinzeln
    this.x = this.mx - this.R; this.y = this.my - this.R; this.w = this.h = this.R * 2;
    if (this.dying) { // versinkt hinter dem Kraterrand, weint Mondstaub
      this.my += 0.9; this.mouth = ease(this.mouth, 0.4, 0.1);
      if (this.dying % 4 === 0) W.spawn(new Particle(this.mx + rnd(-30, 30), this.my - 10, rnd(-0.4, 0.4), rnd(0.2, 0.8), '#e8e4d8', 50, 1, 0.01));
      if (this.dying === 1) { W.flash = 12; W.shake = 18; Audio8.sfx('holy', this.mx); }
      if (W.room.ambBase !== undefined) W.room.amb = W.room.ambBase;
      return this.updateDeath(150);
    }
    if (this.phase === 0 && this.hp <= this.maxHp * 2 / 3 && this.state !== 'eclipse') { this.phase = 1; this.go('eclipse'); this.say('bossMondHalf', '#c8dcff'); Audio8.sfx('holy', this.mx); }
    else if (this.phase === 1 && this.hp <= this.maxHp / 3 && this.state !== 'eclipse') { this.phase = 2; this.go('eclipse'); this.say('bossMondNew', '#fc7460'); Audio8.sfx('roar', this.mx); }
    const touch = () => { if (p.alive && Math.hypot(p.cx - this.mx, p.cy - this.my) < this.R + 6) p.hurt(this.dmg, this.mx); };
    if (this.state === 'intro') { // geht hinter dem Kraterrand auf
      this.my = ease(this.my, this.gy - 122, 0.035); if (this.timer === 30) Audio8.sfx('holy', this.mx);
      if (this.timer > 110) this.go('idle');
      return;
    }
    if (this.state === 'eclipse') { // Schatten wandert über das Gesicht
      const to = this.phase === 1 ? 0.5 : 0.08; this.lit = ease(this.lit, to, 0.05);
      if (this.phase === 2) { if (W.room.ambBase === undefined) W.room.ambBase = W.room.amb; W.room.amb = ease(W.room.amb ?? 0.2, 0.62, 0.05); }
      if (this.timer > 70) { this.go('idle'); Audio8.tempo(this.phase === 2 ? 1.12 : 1.06); }
      return;
    }
    touch();
    this.angry = Math.max(0, this.angry - 0.01);
    if (this.state === 'idle') {
      const want = clamp(p.cx + Math.sin(this.t * 0.01) * 60, this.ax + 80, this.ax + this.aw - 80);
      this.mx += clamp((want - this.mx) * 0.01, -0.7, 0.7); this.my = ease(this.my, this.gy - 122 + Math.sin(this.t * 0.03) * 8, 0.05);
      this.mouth = ease(this.mouth, 0, 0.1); this.puff = ease(this.puff, 0, 0.1);
      if (this.timer > (this.phase === 2 ? 50 : 70)) this.attack();
    } else if (this.state === 'tired') { // müde: Augen halb offen, Mund schlaff (Schaden ×1,5)
      this.mouth = ease(this.mouth, 0.3, 0.1); this.my = ease(this.my, this.gy - 102, 0.04);
      if (this.timer > 70) this.go('idle');
    } else if (this.state === 'blowWind') { this.puff = ease(this.puff, 1, 0.08); if (this.timer > 40) { this.go('blow'); this.dir = p.cx < this.mx ? -1 : 1; Audio8.sfx('whoosh', this.mx); } }
    else if (this.state === 'blow') { // Pusten: schiebt den Helden zum Kraterrand, Staub fliegt
      this.puff = ease(this.puff, 0.3, 0.1); this.mouth = 0.6;
      if (p.alive) Phys.moveX(p, this.dir * (p.onGround ? 1.05 : 1.4));
      if (this.timer % 2 === 0) W.spawn(new Particle(this.mx + this.dir * 20, this.my + 22, this.dir * rnd(2.5, 4.5), rnd(-0.6, 0.6), '#e8e4d8', 40, 1, 0));
      if (this.timer % 16 === 0) Audio8.sfx('whoosh', this.mx);
      if (this.timer > 100) this.go('tired');
    } else if (this.state === 'cheese') { // Käsebrocken im Bogen (zurückschlagbar)
      this.mouth = ease(this.mouth, 1, 0.2);
      if (this.timer % 14 === 7 && this.timer < 66) { const dx = p.cx - this.mx, t0 = 60, vx = clamp(dx / t0, -2.4, 2.4) + rnd(-0.3, 0.3); W.spawn(new Mond.Kaese(this.mx, this.my + 24, vx, -1.4 - rnd(0, 0.8), this.dmg - 1)); Audio8.sfx('chomp', this.mx); }
      if (this.timer > 84) this.go('tired');
    } else if (this.state === 'sickle') { // Mondsichel als Bumerang: erst tief, dann hoch zurück
      if (this.timer === 20) { W.spawn(new Mond.Sichel(this, p.cx < this.mx ? -1 : 1)); Audio8.sfx('whoosh', this.mx); this.angry = 1; }
      if (this.timer > 120) this.go('tired');
    } else if (this.state === 'quake') { // Mondbeben: fällt auf den Kraterboden, Bodenwellen
      if (this.timer < 30) this.my = ease(this.my, this.gy - 158, 0.08);
      else { this.my += 6; if (this.my >= this.gy - this.R + 10) { this.my = this.gy - this.R + 10; W.shake = 20; Audio8.sfx('boom', this.mx); Input.rumble(0.9, 0.7, 400); W.spawn(new Post.Welle(this.mx - this.R, this.gy, -1, this)); W.spawn(new Post.Welle(this.mx + this.R, this.gy, 1, this)); this.go('tired'); } }
    } else if (this.state === 'rain') { // Sternregen (Schattenwarnung)
      if (this.timer % 18 === 1 && this.timer < 100 && typeof SternTropfen !== 'undefined') { const x = clamp(p.cx + rnd(-120, 120), this.ax + 16, this.ax + this.aw - 16); W.spawn(new SternTropfen(x, this.gy, this)); }
      if (this.timer > 120) this.go('tired');
    }
  }
  draw() { }
  drawBack(ctx) { // hinter den Kacheln: beim Auftritt geht der Mond hinter dem Kraterrand auf
    if (this.dying > 140) return;
    const cx = Math.round(this.mx - W.cam.x), cy = Math.round(this.my - W.cam.y), R = this.R, p = W.player, fl = this.flashT > 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const h = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.7); h.addColorStop(0, `rgba(255,250,220,${(0.12 * this.lit + 0.03).toFixed(2)})`); h.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = h; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4); ctx.restore();
    ctx.drawImage(Mond.moon(), cx - R - 2, cy - R - 2);
    if (fl) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    // Gesicht
    const ang = this.angry > 0.3 || this.state === 'blowWind' || this.state === 'quake';
    for (const s of [-1, 1]) { // Wangen (beim Pusten aufgebläht)
      if (this.puff > 0.05) { ctx.fillStyle = `rgba(240,200,190,${(0.6 * this.puff).toFixed(2)})`; ctx.beginPath(); ctx.arc(cx + s * 30, cy + 12, 8 + this.puff * 9, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#6c6860'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + s * 12, cy - 26 + (ang ? 4 : 0)); ctx.lineTo(cx + s * 31, cy - 28 - (ang ? 3 : 0)); ctx.stroke(); // Brauen
    }
    this.eyes().forEach(([ex, ey], i) => {
      const x = Math.round(ex - W.cam.x), y = Math.round(ey - W.cam.y), lid = this.lid > 0.5 || (this.phase === 1 && i === 0) ? 1 : this.state === 'tired' ? 0.45 : 0;
      ctx.fillStyle = '#4c4840'; ctx.beginPath(); ctx.ellipse(x, y, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      if (lid >= 1) { ctx.strokeStyle = '#3c3830'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.stroke(); return; }
      ctx.fillStyle = this.phase === 2 ? '#2c0c10' : '#fffcf0'; ctx.beginPath(); ctx.ellipse(x, y + lid * 3, 9, 7 - lid * 5, 0, 0, Math.PI * 2); ctx.fill();
      const dx = clamp((p.cx - ex) * 0.03, -3, 3), dy = clamp((p.cy - ey) * 0.03, -2, 3);
      ctx.fillStyle = this.phase === 2 ? '#fc3c3c' : '#1c2c4c'; ctx.fillRect(Math.round(x + dx - 2), Math.round(y + dy - 2 + lid * 2), 4, 4);
    });
    ctx.fillStyle = 'rgba(120,116,108,0.6)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 4, 6, 9, 0, 0, Math.PI * 2); ctx.fill(); // Nase
    ctx.strokeStyle = '#5c5850'; ctx.lineWidth = 3; // Mund: Lächeln, Pustemund, offen zum Spucken
    if (this.state === 'blow') { ctx.fillStyle = '#3c2020'; ctx.beginPath(); ctx.arc(cx + this.dir * 4, cy + 24, 6, 0, Math.PI * 2); ctx.fill(); }
    else if (this.mouth > 0.4) { ctx.fillStyle = '#3c2020'; ctx.beginPath(); ctx.ellipse(cx, cy + 24, 14, 4 + this.mouth * 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c84c5c'; ctx.fillRect(cx - 6, cy + 26 + this.mouth * 3, 12, 3); }
    else { ctx.beginPath(); ctx.arc(cx, cy + 10, 18, 0.25 * Math.PI + (ang ? 0.2 : 0), 0.75 * Math.PI - (ang ? 0.2 : 0)); ctx.stroke(); }
    // Mondphase: Schatten über dem Gesicht (Halbmond: linke Hälfte, Neumond: fast alles, nur ein heller Rand)
    if (this.lit < 0.98) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2); ctx.clip();
      const off = R * 2 * this.lit; ctx.fillStyle = 'rgba(6,6,18,0.86)'; ctx.beginPath(); ctx.arc(cx - off + R * 0.0, cy, R * 1.02, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (this.phase === 2) { this.eyes().forEach(([ex, ey]) => { const x = ex - W.cam.x, y = ey - W.cam.y; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,60,60,0.5)'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore(); if (this.lid < 0.5) { ctx.fillStyle = '#ff5c4c'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 4); } }); }
    }
    this.lastDraw = null;
  }
  lightUp(L, cx, cy) { if (this.dying > 120) return; L.push({ x: this.mx - cx, y: this.my - cy, r: 110, c: this.phase === 2 ? [255, 90, 80] : [255, 248, 220], a: this.phase === 2 ? 0.25 : 0.25 * this.lit + 0.08 }); }
}
