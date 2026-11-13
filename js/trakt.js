// Behördentrakt hinter dem Amt für Heldentaten (Schloss-Modus): Paternoster, Kantine, Registratur.
// Paternoster: ein Umlaufaufzug aus offenen Kabinen (Blender-Modell 'pcabin'), die ohne Halt im Kreis laufen – links hinauf,
// rechts hinab. Man steigt im Vorbeifahren ein und aus. Oben und unten wechseln die Kabinen den Schacht; wer oben durchfährt,
// erlebt, was die Dienstvorschrift ausdrücklich verneint (das Bild dreht sich einmal ganz herum).
// Registratur: Aktenschränke, deren Schubladen nach einem Peitschenhieb herausfahren (Treppe zum Klettern), die Ablage P,
// ein Postausgang, der Papierflieger startet. Gegner: Aktenordner (hüpft und schnappt) und Papierflieger (gleitet, stößt, Looping).
// Bau in castle.js: .prop('trakt', { k: 'pater' | 'cab' | 'outbox' | 'menu', … }), .enemy('ordner', x, y), .enemy('flieger', x, y)
'use strict';

const Trakt = (() => {
  const C = () => typeof Castle !== 'undefined' && Castle.on ? Castle : null;

  // ---------------- Paternoster ----------------
  // d: { x: linke Spalte des Aufwärtsschachts (3 breit; Pfeiler x+3, Abwärtsschacht x+4..x+6), top/bot: Standreihe der Kabinen
  //      in der oberen/unteren Wende, pil: [erste, letzte Reihe] des Pfeilers, floors: [[Standreihe, Schildtext], …], speed }
  class Pater extends Ent {
    constructor(d) {
      super(d.x * T, (d.top - 3) * T, 7 * T, (d.bot - d.top + 4) * T);
      this.kind = 'prop'; this.d = d; this.noWrap = true;
      this.xu = d.x * T; this.xd = (d.x + 4) * T; this.yt = (d.top + 1) * T; this.yb = (d.bot + 1) * T;
      this.V = this.yb - this.yt; this.Hz = this.xd - this.xu; this.L = 2 * this.V + 2 * this.Hz;
      const n = Math.round(this.L / 64);
      this.sp = this.L / n; this.ph = 0; this.speed = d.speed || 0.7; this.v = this.speed; // v: Tempo im Augenblick (Eilgang, solange der Held mitfährt)
      this.cabs = []; this.plats = [];
      for (let i = 0; i < n; i++) {
        const self = this, c = { kind: 'platform', pater: this, i, x: 0, y: 0, w: 48, h: 6, dx: 0, dy: 0, slack: 4, seg: 0,
          update() { if (this.i === 0) self.ph = (self.ph + self.v) % self.L; self.place(this, false); } };
        this.place(c, true); this.cabs.push(c); this.plats.push(c);
      }
      this.spin = -1; this.lastSeg = -1; this.cellar = false; this.ding = -1;
      if (typeof W !== 'undefined') W.flipA = 0;
    }
    pos(s) {
      const { V, Hz, xu, xd, yt, yb } = this;
      if (s < V) return [xu, yb - s, 0];
      if (s < V + Hz) return [xu + (s - V), yt, 1];
      if (s < 2 * V + Hz) return [xd, yt + (s - V - Hz), 2];
      return [xd - (s - 2 * V - Hz), yb, 3];
    }
    place(c, init) {
      const [x, y, seg] = this.pos((this.ph + c.i * this.sp) % this.L);
      c.dx = init ? 0 : x - c.x; c.dy = init ? 0 : y - c.y; c.x = x; c.y = y; c.seg = seg;
    }
    update() {
      this.t++;
      const p = W.player, c = p && p.alive ? p.ridePlat : null;
      // Eilgang: fährt der Held mit, läuft der ganze Umlauf gut dreimal so schnell (sonst steht man für vier Stockwerke zehn
      // Sekunden in der Kabine); in den Wenden gemächlicher. Wer eine Richtung hält, will aussteigen: dann bremst der Umlauf,
      // und die Aussteighilfe setzt den Helden am nächsten Stockwerk hinaus.
      { const on = !!(c && c.pater === this), I = Input.held, want = !on ? this.speed : I.left || I.right ? 1.5 : c.seg === 1 || c.seg === 3 ? 2.2 : (this.d.fast || 3.3);
        this.v += clamp(want - this.v, -0.16, 0.14); }
      if (c && c.pater === this) {
        // in der Kabine bleiben, solange daneben eine Decke vorbeizieht (sonst trüge die Kabine den Helden in die Mauer)
        const side = c.seg === 0 ? -1 : c.seg === 2 ? 1 : 0, edge = side < 0 ? c.x - 3 : c.x + c.w + 1;
        const y0 = p.y + 1 - (c.seg === 0 ? 8 : 0), open = side !== 0 && !Phys.rectSolid(edge, y0, 2, p.feet - 3 - y0); // daneben frei in Körperhöhe (hinauf: mit Luft über dem Kopf)
        const lo = c.x + 1, hi = c.x + c.w - p.w - 1, I = Input.held;
        if (side && (side > 0 ? I.right : I.left) && (side > 0 ? p.x >= hi - 1 : p.x <= lo + 1)) { // Aussteighilfe: Kabine knapp unter der Stockwerkskante → hinübertreten
          for (const [row] of this.d.floors) {
            const fy = (row + 1) * T;
            if (c.y - fy >= -2 && c.y - fy <= 14 && !Phys.rectSolid(edge, fy - p.h, 2, p.h - 1)) { p.y = fy - p.h; p.x = side > 0 ? c.x + c.w + 1 : c.x - p.w - 1; p.vy = 0; p.ridePlat = null; this.lastSeg = -1; return; }
          }
        }
        if (!(open && side < 0)) p.x = Math.max(p.x, lo);
        if (!(open && side > 0)) p.x = Math.min(p.x, hi);
        if (c.seg !== this.lastSeg) {
          if (c.seg === 1 && this.lastSeg === 0 && this.spin < 0) { this.spin = 0; Audio8.sfx('whoosh'); Audio8.sfx('creak'); } // oben durch: das Bild dreht sich einmal herum
          if (c.seg === 3 && this.lastSeg === 2 && !this.cellar) { this.cellar = true; Game.note('patCellar'); Audio8.sfx('creak'); }
          this.lastSeg = c.seg;
        }
        for (const [row] of this.d.floors) { // an jedem Stockwerk ein leises Ding (Fahrstuhlmusik verlangt das)
          const fy = (row + 1) * T, a0 = c.y - c.dy - fy, a1 = c.y - fy;
          if (a0 * a1 <= 0 && a0 !== a1 && (c.seg === 0 || c.seg === 2) && this.ding !== row) { this.ding = row; Audio8.sfx('ding', c.x + 24); }
        }
      } else this.lastSeg = -1;
      if (this.spin >= 0) {
        const len = 150, k = Math.min(1, ++this.spin / len), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        W.flipA = e * Math.PI * 2;
        if (this.spin === 75) W.shake = Math.max(W.shake, 3);
        if (k >= 1) { this.spin = -1; W.flipA = 0; Game.note('patFlip'); const K = C(); if (K) K.setFlag('pat_flip'); }
      }
      if (this.t % 40 === 0 && p && Math.abs(p.cy - (this.yt + this.yb) / 2) < this.V) Audio8.sfx('cog', this.xu + 56);
    }
    wheel(ctx, x, y, r, a) { // Kettenrad: Kranz mit Zähnen, Speichen, Nabe
      ctx.fillStyle = '#2c2420'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6c5c4c';
      for (let k = 0; k < 20; k++) { const b = a + k * Math.PI / 10; ctx.fillRect(Math.round(x + Math.cos(b) * (r + 2)) - 1, Math.round(y + Math.sin(b) * (r + 2)) - 1, 3, 3); }
      ctx.strokeStyle = '#4c4038'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#3c3430'; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const b = a + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * (r - 3), y + Math.sin(b) * (r - 3)); ctx.stroke(); }
      ctx.fillStyle = '#c89020'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); ctx.fillStyle = '#fce0a8'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2);
    }
    draw(ctx) {
      const cx = W.cam.x, cy = W.cam.y, xu = Math.round(this.xu - cx), xd = Math.round(this.xd - cx), top = Math.round(this.yt - cy), bot = Math.round(this.yb - cy);
      if (xu > View.w + 60 || xd + 110 < 0) return;
      const y0 = Math.max(-10, top - 70), y1 = Math.min(260, bot + 34);
      if (y1 > y0) { // Schachtwand: Ziegel im Halbdunkel (Fugen wandern mit der Welt), Führungsschienen aus Stahl mit Nieten, dahinter die Ketten
        const sw = xd - xu + 52, ox = xu - 2;
        ctx.fillStyle = '#160e0c'; ctx.fillRect(ox, y0, sw, y1 - y0);
        ctx.fillStyle = '#22160f';
        for (let y = y0 - (((y0 + cy) % 6) + 6) % 6; y < y1; y += 6) {
          ctx.fillRect(ox, y, sw, 1);
          const row = Math.round((y + cy) / 6); for (let x = ox + ((row & 1) ? 6 : 0) + 3; x < ox + sw; x += 12) ctx.fillRect(x, y + 1, 1, 5);
        }
        for (const gx of [xu, xu + 46, xd, xd + 46]) { // Schienen links und rechts jeder Kabinenbahn
          ctx.fillStyle = '#34323c'; ctx.fillRect(gx, y0, 2, y1 - y0); ctx.fillStyle = '#6c6a78'; ctx.fillRect(gx, y0, 1, y1 - y0);
          ctx.fillStyle = '#a8a4b4'; for (let y = y0 - (((y0 + cy) % 24) + 24) % 24; y < y1; y += 24) ctx.fillRect(gx, y, 2, 1);
        }
        const chain = (x, dir) => { // Glieder wandern mit: hinauf im linken, hinab im rechten Schacht
          ctx.fillStyle = '#2c2a30'; ctx.fillRect(x, y0, 2, y1 - y0);
          const off = ((dir * this.ph) % 8 + 8) % 8; // (im Eilgang laufen die Kettenglieder entsprechend schneller)
          ctx.fillStyle = '#7c7884'; for (let y = y0 - 8 + off; y < y1; y += 8) ctx.fillRect(x, Math.round(y), 2, 3);
        };
        chain(xu + 23, -1); chain(xd + 23, 1);
      }
      const a = this.ph / 40;
      if (top - 30 > -60 && top - 30 < 280) this.wheel(ctx, (xu + xd + 48) / 2, top - 28, 38, a);
      if (bot - 26 > -60 && bot - 26 < 280) this.wheel(ctx, (xu + xd + 48) / 2, bot - 26, 38, -a);
      const [p0, p1] = this.d.pil, py0 = Math.round(p0 * T - cy), py1 = Math.round((p1 + 1) * T - cy); // Pfeiler zwischen den Schächten
      if (py1 > 0 && py0 < 260) {
        ctx.fillStyle = '#3c2414'; ctx.fillRect(xu + 48, py0, 16, py1 - py0);
        ctx.fillStyle = '#5c3820'; ctx.fillRect(xu + 50, py0, 12, py1 - py0);
        ctx.fillStyle = '#c89020'; ctx.fillRect(xu + 48, py0, 1, py1 - py0); ctx.fillRect(xu + 63, py0, 1, py1 - py0);
        for (let y = py0 + 20; y < py1; y += 48) { ctx.fillStyle = '#2c1a0e'; ctx.fillRect(xu + 51, y, 10, 1); }
      }
      for (const [row] of this.d.floors) { // gelb-schwarze Warnkante an jeder Stockwerkskante zum Schacht
        const ey = Math.round((row + 1) * T - cy);
        if (ey < -4 || ey > 244) continue;
        for (const ex of [xu - 18, xd + 50]) for (let k = 0; k < 16; k += 4) { ctx.fillStyle = (k >> 2) & 1 ? '#1c1a1e' : '#f0c428'; ctx.fillRect(ex + k, ey, 4, 2); }
      }
      for (const [row, key] of this.d.floors) { // Stockwerksschilder (Emaille) links und rechts über der Schachtöffnung
        const fy = Math.round((row + 1) * T - cy) - 62;
        if (fy < -20 || fy > 250) continue;
        const s = tr(key), w = Font.width(s) + 8;
        for (const sx of [xu - 6 - w, xd + 54]) {
          ctx.fillStyle = '#0c1c3c'; ctx.fillRect(sx, fy, w, 11); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(sx, fy, w, 1); ctx.fillRect(sx, fy + 10, w, 1);
          Font.draw(ctx, s, sx + w / 2, fy + 2, '#e8e4d8', { align: 'center' });
        }
      }
      const K = C();
      for (const c of this.cabs) { // Kabinen (Boden = Standfläche)
        const sx = Math.round(c.x - cx), sy = Math.round(c.y - cy);
        if (sx < -60 || sx > View.w + 10 || sy < -10 || sy > 300) continue;
        if (!(K && K.k3at(ctx, 'pcabin', sx + 24, sy))) {
          ctx.fillStyle = '#2c1810'; ctx.fillRect(sx, sy - 50, 48, 50); ctx.fillStyle = '#c89020'; ctx.fillRect(sx, sy - 52, 48, 2); ctx.fillRect(sx, sy, 48, 4);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx + 2, sy + 4, 44, 2);
      }
    }
    lightUp(L, cx, cy) {
      for (const c of this.cabs) {
        const sx = c.x + 24 - cx, sy = c.y - 40 - cy;
        if (sx > -40 && sx < View.w + 40 && sy > -40 && sy < 280) L.push({ x: sx, y: sy, r: 36, c: [255, 214, 150], a: 0.42 }); // Kabinenlampe: warmer Schein im dunklen Schacht
      }
    }
  }

  // ---------------- Aktenschrank (Registratur) ----------------
  // d: { x, y: Standreihe (Boden in y + 1), n: Schubladen zu je DH px (einfacher Sprung: 44 px), side: 1 (fahren nach rechts) | -1, lab, ablage }
  // Ein Peitschenhieb zieht alle Schubladen heraus (gestaffelt); sie bleiben 7 s offen und rattern zurück. Der Deckel trägt immer.
  // Ablage P: spuckt Papierflieger, beim ersten Mal auch einen Goldsack
  const CAB_OAK = ['#4c2c16', '#8c5a30', '#b07440', '#dca060'], DH = 40;
  class Schrank extends Ent {
    constructor(d) {
      const n = d.n || 3, H = n * DH;
      super(d.x * T, (d.y + 1) * T - H, 32, H);
      this.kind = 'candle'; this.d = d; this.n = n; this.side = d.side || 1; this.out = 0; this.st = 'closed'; this.hold = 0; this.cool = 0;
      this.bottom = (d.y + 1) * T; this.plats = [];
      this.plats.push({ kind: 'platform', x: this.x, y: this.y, w: 32, h: 6, dx: 0, dy: 0, update() {} }); // Deckel
      if (!d.ablage) {
        const self = this;
        for (let k = 0; k < n - 1; k++) this.plats.push({ kind: 'platform', k, x: 0, y: this.bottom - (k + 1) * DH, w: 2, h: 6, dx: 0, dy: 0, solid: false, update() { self.fit(this); } });
      }
    }
    ext(k) { return clamp(this.out - k * 7, 0, 32); }
    fit(pl) {
      const e = this.ext(pl.k);
      pl.solid = e > 10;
      if (this.side > 0) { pl.x = this.x + 30; pl.w = e + 2; } else { pl.x = this.x - e; pl.w = e + 2; }
    }
    hit() {
      if (this.d.ablage) { this.spit(); return; }
      if (this.st === 'closed' || this.st === 'closing') { this.st = 'opening'; Audio8.sfx('creak', this.cx); Audio8.sfx('chain', this.cx); }
      else this.hold = 420; // noch einmal gepeitscht: bleibt länger offen
      W.dust(this.cx, this.bottom, 2);
    }
    spit() {
      if (this.cool > 0) return;
      this.cool = 420; this.out = 32; this.st = 'spat';
      Audio8.sfx('whoosh', this.cx); Audio8.sfx('page', this.cx);
      W.popup(this.cx, this.y - 8, tr('ablageP'), '#fce0a8');
      for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx + rnd(-6, 6), this.y + 10, rnd(-1.6, 1.6), rnd(-2.6, -0.6), i % 3 ? '#f0ece0' : '#c8c0a8', 70, 2, 0.05));
      for (let i = 0; i < 3; i++) W.spawn(new Flieger(this.cx + (i - 1) * 6, this.y + 6, { dir: i % 2 ? 1 : -1, vy: -1.6 - i * 0.4 }));
      const K = C();
      if (K && !K.flags.ablage_gold) { K.setFlag('ablage_gold'); W.spawn(new Item('bagBig', this.cx, this.y)); }
    }
    update() {
      this.t++;
      if (this.cool > 0) this.cool--;
      if (this.st === 'spat') { this.out = Math.max(0, this.out - 1.5); if (!this.out) this.st = 'closed'; return; }
      if (this.st === 'opening') { this.out = Math.min(32 + (this.n - 2) * 7, this.out + 2.2); if (this.out >= 32 + (this.n - 2) * 7) { this.st = 'open'; this.hold = 420; Audio8.sfx('latch', this.cx); } }
      else if (this.st === 'open') { if (--this.hold <= 0) { this.st = 'closing'; Audio8.sfx('chain', this.cx); } else if (this.hold === 60) Audio8.sfx('clank', this.cx); }
      else if (this.st === 'closing') { this.out = Math.max(0, this.out - 1.1); if (!this.out) { this.st = 'closed'; Audio8.sfx('latch', this.cx); } }
    }
    drawer(ctx, sx, dy, e, k, shake) { // eine Schublade: Kasten mit Hängeregistratur (Reiter ragen heraus), Front mit Griff und Schild
      const s = this.side, fx = s > 0 ? sx + 32 + e - 4 : sx - e, bx0 = s > 0 ? sx + 28 : sx - e, bw = e + 4;
      if (e > 0) {
        ctx.fillStyle = CAB_OAK[1]; ctx.fillRect(bx0, dy + 6, bw, DH - 8); ctx.fillStyle = CAB_OAK[2]; ctx.fillRect(bx0, dy + 6, bw, 2);
        ctx.fillStyle = '#e8e0c8'; for (let x = bx0 + 2; x < bx0 + bw - 3; x += 5) ctx.fillRect(x, dy + 2 + ((x * 7) % 3), 3, 5);
        const tabs = ['#c83c3c', '#3c7cc8', '#58a858', '#e8b830']; for (let x = bx0 + 3, i = k; x < bx0 + bw - 4; x += 9, i++) { ctx.fillStyle = tabs[i % 4]; ctx.fillRect(x, dy + 1 + (i % 2), 4, 3); }
      }
      const fy = dy + 2 + (shake ? ((this.t >> 1) & 1) : 0);
      ctx.fillStyle = CAB_OAK[0]; ctx.fillRect(fx, fy, 4, DH - 4); ctx.fillStyle = CAB_OAK[3]; ctx.fillRect(fx + (s > 0 ? 3 : 0), fy, 1, DH - 4);
      if (e <= 0) {
        ctx.fillStyle = CAB_OAK[2]; ctx.fillRect(sx + 2, dy + 2, 28, DH - 4); ctx.fillStyle = CAB_OAK[3]; ctx.fillRect(sx + 2, dy + 2, 28, 1); ctx.fillStyle = CAB_OAK[0]; ctx.fillRect(sx + 2, dy + DH - 3, 28, 1);
        ctx.fillStyle = '#e8e0c8'; ctx.fillRect(sx + 10, dy + 8, 12, 7); ctx.fillStyle = '#c89020'; ctx.fillRect(sx + 9, dy + 7, 14, 1); ctx.fillRect(sx + 9, dy + 15, 14, 1);
        ctx.fillStyle = '#c89020'; ctx.fillRect(sx + 11, dy + 22, 10, 3); ctx.fillStyle = '#fce0a8'; ctx.fillRect(sx + 12, dy + 22, 8, 1);
      } else { ctx.fillStyle = '#0c0606'; ctx.fillRect(sx + 3, dy + 3, 26, DH - 6); } // leeres Fach
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), sy = Math.round(this.y - W.cam.y), H = this.n * DH;
      if (sx > View.w + 50 || sx + 80 < 0 || sy > 250 || sy + H < -10) return;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx - 2, sy + H - 2, 36, 4);
      ctx.fillStyle = CAB_OAK[0]; ctx.fillRect(sx, sy, 32, H); ctx.fillStyle = CAB_OAK[1]; ctx.fillRect(sx + 1, sy + 1, 30, H - 2);
      ctx.fillStyle = CAB_OAK[3]; ctx.fillRect(sx - 1, sy - 2, 34, 3); ctx.fillStyle = '#c89020'; ctx.fillRect(sx - 1, sy - 2, 34, 1); // Deckplatte
      const shake = this.st === 'open' && this.hold < 60;
      for (let k = 0; k < this.n; k++) {
        const dy = sy + H - (k + 1) * DH, e = this.d.ablage ? (k === 0 ? this.out * 0.5 : 0) : k < this.n - 1 ? this.ext(k) : 0;
        this.drawer(ctx, sx, dy, e, k, shake && e > 0);
      }
      const lab = this.d.ablage ? tr('ablageLab') : this.d.lab || '';
      if (lab) { const w = Font.width(lab) + 4, ly = this.d.ablage ? sy - 14 : sy + 4; ctx.fillStyle = '#e8e0c8'; ctx.fillRect(sx + 16 - w / 2, ly, w, 9); Font.draw(ctx, lab, sx + 16, ly + 1, '#3c2414', { align: 'center' }); }
    }
  }

  // ---------------- Postausgang ----------------
  // Drahtkorb auf einem Pult: solange der Held in der Nähe ist, startet alle paar Sekunden ein Papierflieger (höchstens drei)
  class Outbox extends Ent {
    constructor(d) { super(d.x * T - 8, (d.y + 1) * T - 26, 32, 26); this.kind = 'prop'; this.d = d; this.cd = 90; this.dir = d.dir || -1; }
    update() {
      this.t++;
      const p = W.player;
      if (!p.alive || Math.abs(p.cx - this.cx) > 240 || Math.abs(p.cy - this.cy) > 150) return;
      if (--this.cd > 0) return;
      this.cd = 200 + Math.floor(rnd(0, 120));
      if (W.ents.filter(e => e instanceof Flieger && !e.dead).length >= 3) return;
      W.spawn(new Flieger(this.cx, this.y - 2, { dir: Math.sign(p.cx - this.cx) || this.dir, vy: -1.2 })); Audio8.sfx('page', this.cx);
    }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
      if (x > View.w + 10 || x + 40 < 0) return;
      ctx.fillStyle = '#3c2414'; ctx.fillRect(x, y + 12, 32, 3); ctx.fillRect(x + 2, y + 15, 2, 11); ctx.fillRect(x + 28, y + 15, 2, 11); // Pult
      ctx.fillStyle = '#7c4c28'; ctx.fillRect(x, y + 12, 32, 1);
      ctx.fillStyle = '#9c9ca8'; ctx.fillRect(x + 6, y + 4, 20, 1); ctx.fillRect(x + 6, y + 11, 20, 1); for (let k = 6; k <= 26; k += 4) ctx.fillRect(x + k, y + 4, 1, 8); // Drahtkorb
      ctx.fillStyle = '#f0ece0'; ctx.fillRect(x + 8, y + 6 - ((this.t >> 4) & 1), 16, 5); ctx.fillStyle = '#c8c0a8'; ctx.fillRect(x + 8, y + 9, 16, 1);
      const lab = tr('outboxLab'), lw = Font.width(lab) + 4; ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x + 16 - lw / 2, y - 8, lw, 9); Font.draw(ctx, lab, x + 16, y - 7, '#3c2414', { align: 'center' });
    }
  }

  // ---------------- Speiseplan (Kantine) ----------------
  // Kreidetafel auf einer Staffelei: heutiger Wochentag (Sprache des Spiels) und das Tagesgericht, darunter Kaffee und Kuchen
  const LOCALE = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', ja: 'ja-JP', zh: 'zh-CN', it: 'it-IT', ro: 'ro-RO' };
  function weekday() { try { return new Date().toLocaleDateString(LOCALE[Options.lang] || 'de-DE', { weekday: 'long' }).toUpperCase(); } catch (e) { return ''; } }
  class Menu extends Ent {
    constructor(d) { super(d.x * T - 24, (d.y + 1) * T - 58, 64, 58); this.kind = 'prop'; }
    draw(ctx) {
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y);
      if (x > View.w + 20 || x + 80 < 0) return;
      const K = C(), dish = K && K.dishToday(), lines = [weekday(), dish ? tr('item_' + dish) : tr('kantMenuWE'), tr('item_kaffee'), tr('item_kuchen')];
      const w = Math.max(64, ...lines.map(l => Font.width(l) + 10)), bx = x + 32 - w / 2;
      ctx.fillStyle = '#5c3820'; ctx.fillRect(x + 8, y + 40, 2, 18); ctx.fillRect(x + 54, y + 40, 2, 18); ctx.fillRect(x + 31, y + 44, 2, 14); // Staffelei
      ctx.fillStyle = '#9c6434'; ctx.fillRect(bx - 3, y - 3, w + 6, 50); ctx.fillStyle = '#dca060'; ctx.fillRect(bx - 3, y - 3, w + 6, 1); ctx.fillStyle = '#4c2c16'; ctx.fillRect(bx - 3, y + 46, w + 6, 1);
      ctx.fillStyle = '#24382c'; ctx.fillRect(bx, y, w, 44);
      ctx.fillStyle = '#2c3c34'; ctx.fillRect(bx + 3, y + 30, w * 0.4, 1); // Wischspur
      Font.draw(ctx, tr('kantMenuT'), x + 32, y + 3, '#f8d878', { align: 'center' });
      Font.draw(ctx, lines[0], x + 32, y + 13, '#e8e8e0', { align: 'center' });
      Font.draw(ctx, lines[1], x + 32, y + 22, dish ? '#fcfcfc' : '#a8b8b0', { align: 'center' });
      Font.draw(ctx, lines[2] + ' · ' + lines[3], x + 32, y + 33, '#a8c8b8', { align: 'center' });
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 20 - cy, r: 60, c: [252, 220, 170], a: 0.3 }); }
  }

  // ---------------- Aktenordner ----------------
  // steht zugeklappt im Regal; kommt der Held näher, klappt er auf (die Ringmechanik als Gebiss) und hüpft schnappend auf ihn zu
  const ORD_COL = [['#2c5ca8', '#1c3c78'], ['#a8282c', '#781c1c'], ['#2c8c4c', '#1c5c34'], ['#d8b830', '#a08820']];
  class Ordner extends Enemy {
    constructor(tx, ty, o = {}) {
      super(tx * T + 2, (ty + 1) * T - 22, 12, 22, 4, 2, 300);
      this.st = 'rest'; this.col = ORD_COL[(o.col ?? tx) % ORD_COL.length]; this.hops = 0; this.tm = 0; this.face = -1; this.open = 0; this.vy = 0; this.vx = 0;
    }
    update() {
      super.update();
      const p = W.player, dx = p.cx - this.cx;
      this.tm++;
      if (this.st === 'rest') {
        this.vx = 0; this.physics(); this.open = 0;
        if (p.alive && this.onScreen(0) && Math.abs(dx) < 96 && Math.abs(p.cy - this.cy) < 64) { this.st = 'wake'; this.tm = 0; this.face = Math.sign(dx) || -1; Audio8.sfx('page', this.cx); }
        return;
      }
      if (this.st === 'wake') { this.open = Math.min(1, this.tm / 12); this.physics(); if (this.tm > 18) { this.st = 'hop'; this.tm = 0; } this.touch(); return; }
      if (this.st === 'hop') {
        if (this.onGround && this.tm > 6) {
          if (this.hops >= 3) { this.st = 'pause'; this.tm = 0; this.hops = 0; this.vx = 0; }
          else { this.face = Math.sign(dx) || this.face; this.vx = this.face * 1.35; this.vy = -3.3; this.hops++; this.tm = 0; this.onGround = false; Audio8.sfx('flap', this.cx); }
        }
        this.open = this.onGround ? Math.max(0, this.open - 0.2) : 0.5 + 0.5 * Math.abs(Math.sin(this.tm * 0.35));
        const was = this.onGround;
        if (this.physics()) this.vx = 0;
        if (this.onGround && !was) { this.vx = 0; Audio8.sfx('chomp', this.cx); W.dust(this.cx, this.y + this.h, 1); this.tm = 0; }
      } else if (this.st === 'pause') { this.open = Math.max(0, this.open - 0.1); this.physics(); if (this.tm > 50) this.st = Math.abs(dx) < 140 ? 'hop' : 'rest'; }
      this.touch();
      if (this.y > W.room.h * T) this.dead = true;
    }
    kill(silent) {
      super.kill(silent);
      if (silent) return;
      W.popup(this.cx, this.y - 6, tr('ordnerDead'), '#fce0a8');
      for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx + rnd(-5, 5), this.cy + rnd(-6, 6), rnd(-1.6, 1.6), rnd(-2.2, -0.4), i % 3 ? '#f0ece0' : this.col[0], 80, 2, 0.05));
    }
    draw(ctx) {
      const f = this.face, x = Math.round(this.cx - W.cam.x), y = Math.round(this.y + this.h - W.cam.y), fl = this.flash;
      if (x < -30 || x > View.w + 30) return;
      const C0 = fl ? '#fcfcfc' : this.col[0], C1 = fl ? '#e8e8e8' : this.col[1], o = this.open, wob = this.st === 'wake' ? ((this.t >> 1) & 1) : 0;
      const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(f > 0 ? x + a : x - a - w, y + b, w, h); };
      if (o < 0.15) { // zugeklappt: Rücken mit Etikett und Griffloch
        R(-6 + wob, -22, 12, 22, C1); R(-5 + wob, -22, 10, 22, C0); R(-4 + wob, -18, 8, 7, '#f0ece0'); R(-3 + wob, -16, 6, 1, '#3c3c48'); R(-3 + wob, -14, 4, 1, '#3c3c48');
        R(-2 + wob, -7, 4, 4, '#14101c'); R(-6 + wob, -1, 12, 1, '#14101c');
        return;
      }
      const gap = Math.round(2 + o * 9); // aufgeklappt: zwei Deckel, dazwischen Papier und die blitzenden Ringe
      R(-7, -22, 12, 4, C0); R(-7, -18 - gap, 12, 3, C1);
      R(-7, -14, 14, 14, C0); R(-6, -13, 12, 12, C1); R(-5, -12, 11, 10, '#f0ece0'); R(-5, -9, 11, 1, '#c8c0a8'); R(-5, -6, 11, 1, '#c8c0a8');
      R(-7, -16 - gap, 14, 3, C0); R(-6, -13 - gap + 0, 12, 1, '#f0ece0');
      for (let k = 0; k < 3; k++) { R(-5 + k * 4, -14, 2, 3, '#d8d8e8'); R(-5 + k * 4, -14 - gap + 1, 2, 3, '#d8d8e8'); } // Ringe (Zähne)
      R(3, -17 - Math.round(gap / 2), 2, 2, '#fc3c3c'); // Auge im Spalt
    }
  }

  // ---------------- Papierflieger ----------------
  // gleitet in Wellen, stößt auf den Helden herab und fängt sich mit einem Looping ab
  class Flieger extends Enemy {
    constructor(x, y, o = {}) {
      super(x - 6, y - 3, 12, 6, 1, 1, 120);
      this.face = o.dir || -1; this.vx = this.face * 1.5; this.vy = o.vy || 0; this.st = 'glide'; this.tm = 0; this.loopA = 0; this.cd = 40 + Math.floor(rnd(0, 40));
    }
    update() {
      super.update();
      const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy;
      this.tm++;
      if (this.st === 'glide') {
        this.vy = this.vy * 0.95 + Math.sin(this.t * 0.09) * 0.05;
        this.vx += (this.face * 1.5 - this.vx) * 0.05;
        if (--this.cd <= 0 && p.alive && Math.abs(dx) < 110 && dy > -10 && Math.sign(dx) === Math.sign(this.vx)) {
          this.st = 'dive'; this.tm = 0; const a = Math.atan2(dy, dx); this.vx = Math.cos(a) * 2.6; this.vy = Math.sin(a) * 2.6; Audio8.sfx('whoosh', this.cx);
        }
      } else if (this.st === 'dive') {
        if (this.tm > 34) { this.st = 'loop'; this.tm = 0; this.loopA = Math.atan2(this.vy, this.vx); }
      } else if (this.st === 'loop') { // Looping: die Flugrichtung dreht sich einmal ganz herum
        this.loopA += (this.vx >= 0 ? -1 : 1) * 0.1;
        const sp = 2.1; this.vx = Math.cos(this.loopA) * sp; this.vy = Math.sin(this.loopA) * sp;
        if (this.tm > 63) { this.st = 'glide'; this.face = Math.sign(this.vx) || this.face; this.cd = 90 + Math.floor(rnd(0, 60)); }
      }
      this.x += this.vx; this.y += this.vy;
      if (Phys.rectSolid(this.x, this.y, this.w, this.h) && this.tm > 8) { this.kill(); return; } // an der Wand zerknüllt
      this.touch();
      if (this.t > 1200 || (this.t > 120 && !this.onScreen(120))) this.dead = true;
    }
    kill(silent) {
      super.kill(silent);
      if (!silent) for (let i = 0; i < 6; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.2, 1.2), rnd(-1.4, 0.2), '#f0ece0', 50, 1, 0.04));
    }
    draw(ctx) {
      const x = this.cx - W.cam.x, y = this.cy - W.cam.y;
      if (x < -20 || x > View.w + 20 || y < -20 || y > 260) return;
      const a = Math.atan2(this.vy, this.vx), fl = this.flash;
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
      ctx.fillStyle = fl ? '#fcfcfc' : '#f0ece0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-7, -5); ctx.lineTo(-4, 0); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = fl ? '#fcfcfc' : '#b8b0a0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, 0); ctx.lineTo(-6, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3c7cc8'; ctx.fillRect(-3, -2, 3, 1); // Briefkopf
      ctx.restore();
    }
  }

  function make(d) {
    switch (d.k) {
      case 'pater': return new Pater(d);
      case 'cab': return new Schrank(d);
      case 'outbox': return new Outbox(d);
      case 'menu': return new Menu(d);
    }
    return new Ent(0, 0, 1, 1);
  }
  return { make, Pater, Schrank, Ordner, Flieger };
})();
const Ordner = Trakt.Ordner, Flieger = Trakt.Flieger;
