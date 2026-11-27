// Mahre (Schloss-Modus): Jedes Geschöpf im Schloss ist ein Albtraum des Grafen – und manche lassen ihn zurück. Stirbt ein Gegner,
// steigt mit etwas Glück sein MAHR auf (ein dunkler Wisch mit zwei Augen), kreist kurz und verfängt sich im Traumfänger des Helden.
// Zwei Plätze: RUF (aktiv, ↑ + SUB, kostet MP) und BANN (wirkt immer). Jeder weitere Fang desselben Mahrs hebt seinen Rang
// (I–IX: mehr Schaden bzw. stärkere Wirkung). Verwaltung: Pause → STATUS → MAHRE (castle.js: Fang, Rang, Plätze, Spielstand).
// Hier: die Liste, die Wirkungen der Ruf-Mahre (Geschosse), Fang-Animation, Traumfänger, Versteinerung und die kleinen Bildzeichen.
'use strict';

const Mahr = (() => {
  // from: Klassenname des Gegners · rate: Fangchance je Sieg (dazu Glück, Blutmond und ein Trostzähler in castle.js)
  // Ruf: mp · Bann: st(Rang) → Werte (def, hp, regen, luck, greed, float wie Ausrüstung; neu: crit %, dodge %, mpreg %)
  const LIST = [
    { id: 'bat', from: 'Bat', slot: 'ruf', mp: 5, rate: 0.07, col: '#b48cfc' },
    { id: 'bone', from: 'Skeleton', slot: 'ruf', mp: 3, rate: 0.07, col: '#e8e4d8' },
    { id: 'fire', from: 'Fishman', slot: 'ruf', mp: 6, rate: 0.09, col: '#fc8c3c' },
    { id: 'pages', from: 'FlyBook', slot: 'ruf', mp: 7, rate: 0.09, col: '#f0e8d0' },
    { id: 'raven', from: 'Raven', slot: 'ruf', mp: 6, rate: 0.09, col: '#8c8cc8' },
    { id: 'stone', from: 'MedusaHead', slot: 'ruf', mp: 10, rate: 0.07, col: '#a8c890' },
    { id: 'folder', from: 'Ordner', slot: 'ruf', mp: 5, rate: 0.1, col: '#5c8ce8' },
    { id: 'letter', from: 'Brief', slot: 'ruf', mp: 4, rate: 0.14, col: '#f4f0e4' },
    { id: 'star', from: 'Sternschnuppe', slot: 'ruf', mp: 9, rate: 0.14, col: '#fff4c8' },
    { id: 'orbit', from: 'Astrolab', slot: 'ruf', mp: 12, rate: 0.16, col: '#7cc8f8' },
    { id: 'ghost', from: 'Ghost', slot: 'bann', rate: 0.08, col: '#78b4fc', st: (r) => ({ dodge: 6 + 2 * r }) },
    { id: 'iron', from: 'Knight', slot: 'bann', rate: 0.08, col: '#c8ccd8', st: (r) => ({ def: 1 + (r >> 1) }) },
    { id: 'flesh', from: 'Ghoul', slot: 'bann', rate: 0.07, col: '#8cc86c', st: (r) => ({ regen: 1, hp: 2 * r }) },
    { id: 'claw', from: 'Panther', slot: 'bann', rate: 0.14, col: '#e8d040', st: (r) => ({ crit: 8 + 2 * r }) },
    { id: 'clock', from: 'Automat', slot: 'bann', rate: 0.12, col: '#e8b060', st: (r) => ({ mpreg: 30 + 10 * r }) },
    { id: 'doll', from: 'Mannequin', slot: 'bann', rate: 0.12, col: '#f8c8d8', st: (r) => ({ luck: 1 + (r >> 1) }) },
    { id: 'cod', from: 'Nachnahme', slot: 'bann', rate: 0.18, col: '#c89858', st: (r) => ({ greed: 1 + (r >> 2) }) },
    { id: 'moon', from: 'Mondkalb', slot: 'bann', rate: 0.14, col: '#e8e4d0', st: (r) => ({ float: 1, luck: Math.floor(r / 3) }) },
  ];
  const BY = {}, FROM = {};
  LIST.forEach(d => { BY[d.id] = d; FROM[d.from] = d; });
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const strike = (box, dmg, id) => Castle.mahrStrike(box, dmg, id);
  let uid = 0;
  const glows = {};
  function glow(ctx, x, y, r, a, col = '#ffffff') { // weicher Schein in der Farbe des Mahrs (je Farbe einmal vorgemalt)
    let c = glows[col];
    if (!c) { c = glows[col] = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 0.9; g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.drawImage(c, x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // ---------------- Geschosse der Ruf-Mahre ----------------
  class Shot extends Ent {
    constructor(type, x, y, vx, vy, dmg, o = {}) {
      super(x - 5, y - 5, 10, 10); this.kind = 'fx'; this.type = type; this.vx = vx; this.vy = vy; this.dmg = dmg; this.o = o;
      this.id = 'mahr' + (++uid); this.face = vx < 0 ? -1 : 1; this.life = o.life || 90; this.ph = o.ph || 0; this.back = false; this.seen = new Set();
    }
    solid() { return Phys.solidTile(Math.floor(this.cx / T), Math.floor(this.cy / T)); }
    pop(n = 5, col = '#fcfcfc') { this.dead = true; W.sparks(this.cx, this.cy, n); for (let i = 0; i < n; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1.4, 1.4), rnd(-1.6, 0.4), col, 20, 1, 0.06)); }
    boom(r, part = 1) { // Aufprall mit Wirkung im Umkreis
      this.dead = true; strike({ x: this.cx - r, y: this.cy - r, w: r * 2, h: r * 2 }, this.dmg * part, this.id + 'b');
      W.spawn(new Shock(this.cx, this.cy, r + 8, this.type === 'star' ? '#fff4c8' : '#fc8c3c', 3)); W.sparks(this.cx, this.cy, 10); W.shake = Math.max(W.shake, 4); Audio8.sfx('explode', this.cx);
      for (let i = 0; i < 10; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2.2, 2.2), rnd(-2.6, 0.4), i % 2 ? '#f8b800' : (this.type === 'star' ? '#fff4c8' : '#fc5c1c'), 28, 1, 0.08));
    }
    update() {
      this.t++; const p = W.player, k = this.type;
      if (k === 'bat') { this.x += this.vx; this.y += Math.sin(this.t * 0.28 + this.ph) * 1.5; if (strike(this, this.dmg)) return this.pop(5, '#b48cfc'); }
      else if (k === 'bone') { // flacher Wurf, der zweimal vom Boden abspringt; jeder Sprung trifft neu
        this.vy += 0.16; this.x += this.vx; this.y += this.vy; strike(this, this.dmg, this.id);
        if (this.vy > 0 && this.solid()) { if ((this.hops = (this.hops || 0) + 1) > 2) return this.pop(4, '#e8e4d8'); this.y -= this.vy; this.vy = -Math.max(1.9, this.vy * 0.62); this.id = 'mahr' + (++uid); W.sparks(this.cx, this.cy + 4, 2); Audio8.sfx('klack', this.cx); }
      }
      else if (k === 'fire') { this.x += this.vx; if (this.t % 2 === 0) W.spawn(new Particle(this.cx - this.face * 4, this.cy + rnd(-2, 2), -this.face * rnd(0.2, 0.8), rnd(-0.5, 0.1), this.t % 4 ? '#fc7c1c' : '#f8b800', 14, 1, 0)); if (strike(this, this.dmg, this.id) || this.solid()) return this.boom(14, 0.5); }
      else if (k === 'page') { this.x += this.vx; this.y += this.vy + Math.sin(this.t * 0.4 + this.ph) * 0.5; if (strike(this, this.dmg)) return this.pop(3, '#f0e8d0'); }
      else if (k === 'raven') { this.x += this.vx; this.y += this.vy; if (this.t > 24) this.vy *= 0.9; strike(this, this.dmg, this.id); if (this.t % 5 === 0) W.spawn(new Particle(this.cx, this.cy, rnd(-0.4, 0.4), rnd(0.2, 0.8), '#2c2c44', 26, 1, 0.02)); }
      else if (k === 'letter') { this.x += this.vx; strike(this, this.dmg, this.id); if (this.solid()) return this.pop(4, '#f4f0e4'); }
      else if (k === 'folder') { // Bumerang: bremst, kehrt um, zurück zum Helden (trifft auf dem Rückweg noch einmal)
        this.vx -= this.face * 0.13; this.x += this.vx;
        if (!this.back && this.vx * this.face < 0) { this.back = true; this.id = 'mahr' + (++uid); }
        if (this.back) { this.y += clamp(p.cy - this.cy, -1.6, 1.6); if (Math.abs(p.cx - this.cx) < 10 && Math.abs(p.cy - this.cy) < 20) { this.dead = true; Audio8.sfx('klack2', this.cx); return; } }
        strike(this, this.dmg, this.id);
      } else if (k === 'stone') { // Medusenhaupt: versteinert gewöhnliche Gegner, Bosse nehmen nur Schaden
        this.x += this.vx; this.y += Math.sin(this.t * 0.16) * 1.2;
        for (const e of W.ents) {
          if (e.dead || e.kind !== 'enemy' || this.seen.has(e) || !Phys.overlap(this, e)) continue;
          this.seen.add(e); e.hit(this.dmg, this.id);
          if (!e.dead) { const fresh = !(e.stunT > 0); e.stunT = Math.max(e.stunT || 0, this.o.stun); if (fresh) W.spawn(new Stone(e)); Audio8.sfx('stone', e.cx); }
        }
        strike(this, this.dmg, this.id);
      } else if (k === 'star') { this.x += this.vx; this.y += this.vy; if (this.cy >= this.o.ty || (this.t > 6 && this.solid())) return this.boom(18); }
      if (this.t > this.life || !this.onScreen(60)) this.dead = true;
    }
    lightUp(L, cx, cy) { const k = this.type; if (k === 'fire' || k === 'star' || k === 'stone') L.push({ x: this.cx - cx, y: this.cy - cy, r: k === 'star' ? 30 : 22, c: k === 'fire' ? [252, 140, 40] : k === 'star' ? [255, 244, 200] : [150, 220, 130], a: 0.6 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y), t = this.t, f = this.face, k = this.type;
      const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + (f > 0 ? a : -a - w), y + b, w, h); };
      if (k === 'bat') { const up = (t >> 2) & 1; R(-2, -2, 5, 4, '#3c2460'); R(-1, -1, 3, 2, '#7c54c8'); R(2, -1, 1, 1, '#fc5c5c'); R(-6, up ? -5 : -1, 4, 3, '#5c3c9c'); R(3, up ? -5 : -1, 4, 3, '#5c3c9c'); R(-7, up ? -4 : 0, 1, 2, '#3c2460'); R(7, up ? -4 : 0, 1, 2, '#3c2460'); }
      else if (k === 'bone') { const r = (t >> 2) % 4; Sprites.draw(ctx, Sprites.S.bone, x - 4, y - 4, r === 1 || r === 3); }
      else if (k === 'fire') { glow(ctx, x, y, 12, 0.7, '#fc8c3c'); R(-4, -4, 8, 8, '#fc5c1c'); R(-3, -3, 6, 6, '#fc8c1c'); R(-2, -2, 4, 4, '#f8d038'); R(-1, -1, 2, 2, '#fffce0'); R(-7, -2 + ((t >> 1) & 1), 3, 3, '#fc3c1c'); }
      else if (k === 'page') { const q = (t >> 2) & 1; R(-3, -3 + q, 7, 5 - q * 2, '#f0e8d0'); R(q ? 3 : -3, -3 + q, 1, 5 - q * 2, '#c8bca0'); R(-2, -2 + q, 4, 1, '#8c3040'); }
      else if (k === 'raven') { const up = (t >> 2) & 1; R(-5, -2, 9, 4, '#1c1c2c'); R(-4, -1, 7, 2, '#3c3c5c'); R(4, -3, 3, 3, '#1c1c2c'); R(7, -2, 2, 1, '#e8b040'); R(5, -2, 1, 1, '#fc5c5c'); R(-4, up ? -6 : 1, 6, 3, '#2c2c44'); R(-8, -1, 3, 2, '#1c1c2c'); }
      else if (k === 'letter') { ctx.globalAlpha = 0.35; R(-16, -2, 10, 1, '#f4f0e4'); R(-13, 1, 8, 1, '#f4f0e4'); ctx.globalAlpha = 1; R(-6, -4, 13, 9, '#100c14'); R(-5, -3, 11, 7, '#f4f0e4'); for (let i = 0; i < 6; i++) { R(-5 + i * 2, -3, 1, 1, i % 2 ? '#2c5cc8' : '#c82c2c'); R(-5 + i * 2, 3, 1, 1, i % 2 ? '#c82c2c' : '#2c5cc8'); } R(-1, -1, 2, 2, '#a81c24'); }
      else if (k === 'folder') { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.45 * f); ctx.fillStyle = '#100c14'; ctx.fillRect(-6, -8, 12, 16); ctx.fillStyle = '#3c6cc8'; ctx.fillRect(-5, -7, 10, 14); ctx.fillStyle = '#5c8ce8'; ctx.fillRect(-5, -7, 3, 14); ctx.fillStyle = '#f0ead8'; ctx.fillRect(-3, -5, 6, 4); ctx.fillStyle = '#100c14'; ctx.fillRect(-1, 2, 2, 2); ctx.restore(); }
      else if (k === 'stone') { glow(ctx, x, y, 12, 0.45, '#a8c890'); const w = (t >> 2) & 1; R(-4, -4, 8, 8, '#4c7c44'); R(-3, -3, 6, 6, '#78b060'); R(-1, -2, 2, 2, '#fffca0'); R(2, -2, 2, 2, '#fffca0'); R(-1, 2, 4, 1, '#2c4c28'); R(-6, -6 + w, 2, 3, '#4c7c44'); R(-2, -7 - w, 2, 3, '#4c7c44'); R(2, -7 + w, 2, 3, '#4c7c44'); R(-7, -1 - w, 3, 2, '#4c7c44'); }
      else if (k === 'star') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,244,200,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - this.vx * 5, y - this.vy * 5); ctx.stroke(); ctx.restore(); glow(ctx, x, y, 14, 0.9, '#fff4c8'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 4, 3, 9); ctx.fillRect(x - 4, y - 1, 9, 3); }
    }
  }
  class Orbit extends Ent { // Sternenkranz: drei Sterne kreisen um den Helden und treffen, was sie berühren
    constructor(dmg, life) { super(0, 0, 1, 1); this.kind = 'fx'; this.dmg = dmg; this.life = life; }
    pos(k) { const p = W.player, a = this.t * 0.09 + k * Math.PI * 2 / 3; return [p.cx + Math.cos(a) * 25, p.cy - 2 + Math.sin(a) * 15]; }
    update() {
      this.t++; const p = W.player; if (!p.alive || this.t > this.life) { this.dead = true; return; }
      this.x = p.cx; this.y = p.cy;
      for (let k = 0; k < 3; k++) { const [x, y] = this.pos(k); if (strike({ x: x - 5, y: y - 5, w: 10, h: 10 }, this.dmg, 'orb' + k + '_' + ((this.t / 40) | 0))) W.sparks(x, y, 3); }
    }
    lightUp(L, cx, cy) { for (let k = 0; k < 3; k++) { const [x, y] = this.pos(k); L.push({ x: x - cx, y: y - cy, r: 14, c: [150, 200, 255], a: 0.4 }); } }
    draw(ctx) {
      if (this.life - this.t < 70 && (this.t & 4)) return; // läuft gleich aus: blinken
      for (let k = 0; k < 3; k++) { const [wx, wy] = this.pos(k), x = Math.round(wx - W.cam.x), y = Math.round(wy - W.cam.y); glow(ctx, x, y, 9, 0.8, '#7cc8f8'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 3, 2, 6); ctx.fillRect(x - 3, y - 1, 6, 2); }
    }
  }
  class Stone extends Ent { // Versteinerung: grauer Schleier mit Rissen über dem Gegner, solange er starr ist
    constructor(e) { super(e.x, e.y, e.w, e.h); this.kind = 'fx'; this.e = e; }
    update() {
      const e = this.e; this.t++; this.x = e.x; this.y = e.y; this.w = e.w; this.h = e.h;
      if (e.flashT > 0) e.flashT--;
      if (e.dead || !(e.stunT > 0)) { this.dead = true; if (!e.dead) { for (let i = 0; i < 6; i++) W.spawn(new Particle(e.cx + rnd(-6, 6), e.cy + rnd(-8, 8), rnd(-1.2, 1.2), rnd(-1.6, 0), '#a8a8b0', 26, 2, 0.12)); Audio8.sfx('crumble', e.cx); } }
    }
    draw(ctx) {
      const e = this.e, x = Math.round(e.x - W.cam.x), y = Math.round(e.y - W.cam.y), blink = e.stunT < 40 && (this.t & 4);
      if (blink) return;
      ctx.fillStyle = 'rgba(150,152,164,0.62)'; ctx.fillRect(x - 1, y - 1, e.w + 2, e.h + 2);
      ctx.fillStyle = 'rgba(60,60,72,0.8)'; ctx.fillRect(x + (e.w >> 1), y, 1, e.h >> 1); ctx.fillRect(x + (e.w >> 1) - 2, y + (e.h >> 1), 3, 1); ctx.fillRect(x + 2, y + e.h - 5, 1, 4);
      ctx.fillStyle = 'rgba(220,220,230,0.7)'; ctx.fillRect(x, y, e.w, 1);
    }
  }

  // ---------------- Fang: der Mahr steigt auf, der Traumfänger schwebt über dem Helden ein, das Netz fängt ihn ----------------
  // Traumfänger aus Blender (tools/blender/traumfaenger_bl.py → pack_traumfaenger.py): zwölf Drehstellungen 44×64 (Reifmitte 22/17)
  // und eine Leuchtmaske für Netz und Kristall, die in der Farbe des Mahrs aufleuchtet.
  const TF_MAP = {"tf_00":[0,0,44,64],"tf_01":[45,0,44,64],"tf_02":[90,0,44,64],"tf_03":[135,0,44,64],"tf_04":[180,0,44,64],"tf_05":[225,0,44,64],"tf_06":[270,0,44,64],"tf_07":[315,0,44,64],"tf_08":[360,0,44,64],"tf_09":[405,0,44,64],"tf_10":[450,0,44,64],"tf_11":[495,0,44,64],"tf_glow":[540,0,44,64]};
  const TF = (() => {
    const img = new Image(); let A = null; const tint = {};
    img.onload = () => {
      const cut = (n) => { const r = TF_MAP[n], c = document.createElement('canvas'); c.width = r[2]; c.height = r[3]; c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return c; };
      A = { f: [], glow: cut('tf_glow') }; for (let k = 0; k < 12; k++) A.f.push(cut('tf_' + String(k).padStart(2, '0')));
    };
    img.src = 'img/traumfaenger.png?v=' + (window.BUILD || '');
    function glowOf(col) { // Netzmaske in der Mahrfarbe mit weißem Kern (je Farbe einmal)
      if (!A) return null; let c = tint[col]; if (c) return c;
      c = tint[col] = document.createElement('canvas'); c.width = A.glow.width; c.height = A.glow.height; const g = c.getContext('2d');
      g.drawImage(A.glow, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3; g.drawImage(A.glow, 0, 0); return c;
    }
    return { get: () => A, glowOf };
  })();
  const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const HY = -13;                                                    // Reifmitte relativ zum Scheitel des Helden
  const backOut = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

  class Wisp extends Ent { // der Mahr: eine dunkle Seelenflamme mit leuchtendem Rand, Schweif und zwei Augen
    constructor(x, y, def, rank, first, gold) { super(x - 5, y - 5, 10, 10); this.kind = 'fx'; this.def = def; this.rank = rank; this.first = first; this.gold = gold; this.trail = []; this.ph = rnd(0, 6.28); this.c = null; Audio8.sfx('mahrRise', x); }
    update() {
      this.t++; const p = W.player;
      this.trail.unshift([this.cx, this.cy]); if (this.trail.length > 10) this.trail.pop();
      if (this.t < 40) { const k = this.t / 40; this.y -= 0.85 - 0.45 * k; this.x += Math.sin(this.t * 0.22 + this.ph) * 1.5 * (1 - 0.5 * k); }
      else {
        if (!this.c) this.c = W.spawn(new Catcher(this.def));                                   // der Traumfänger erscheint über dem Helden
        const c = this.c, tx = c.dead ? p.cx : c.hx, ty = c.dead ? p.cy : c.hy;
        const dx = tx - this.cx, dy = ty - this.cy, d = Math.hypot(dx, dy) || 1, v = Math.min(6.5, 1.2 + (this.t - 40) * 0.22), sw = Math.min(1, d / 60) * 1.6;
        this.x += dx / d * v - dy / d * sw; this.y += dy / d * v + dx / d * sw;                // mit leichtem Bogen ins Netz
        if (d < 7 || this.t > 220) return this.caught(p);
      }
      if (this.t % 3 === 0) W.spawn(new Particle(this.cx + rnd(-3, 3), this.cy + rnd(-2, 3), rnd(-0.3, 0.3), rnd(0.1, 0.6), this.t % 6 ? this.def.col : '#fcfcfc', 18, 1, 0));
    }
    caught(p) {
      const d = this.def; this.dead = true;
      const c = this.c && !this.c.dead ? this.c : W.spawn(new Catcher(d)); c.grab();
      W.hitstop = Math.max(W.hitstop, 7); W.flash = Math.max(W.flash, 3); Input.rumble(0.5, 0.6, 220);
      W.spawn(new Shock(c.hx, c.hy, 30, d.col, 3));
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, v = rnd(0.8, 1.8); W.spawn(new Particle(c.hx, c.hy, Math.cos(a) * v, Math.sin(a) * v - 0.4, i % 2 ? d.col : '#fcfcfc', 30, 1, 0.02)); }
      if (this.gold) { W.popup(p.cx, p.y - 16, '+' + this.gold + ' G', '#f8b800'); Audio8.sfx('money'); return; }
      W.popup(p.cx, p.y - 26, tr('mahrGot'), '#c8a0fc'); W.popup(p.cx, p.y - 15, tr('mahr_' + d.id) + (this.rank > 1 ? ' ' + ROMAN[this.rank] : ''), d.col);
      Audio8.sfx('mahrCatch');
      if (this.first) Game.note('mahrFirst');
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 26, c: rgbOf(this.def.col), a: 0.55 }); }
    draw(ctx) {
      const col = this.def.col, cx = this.cx - W.cam.x, cy = this.cy - W.cam.y, n = this.trail.length, TAU = Math.PI * 2;
      const [r0, g0, b0] = rgbOf(col), soft = 1 - 0.5 * (0.3 * r0 + 0.59 * g0 + 0.11 * b0) / 255;   // helle Mahre: gedämpfter Schein
      for (let i = n - 1; i >= 2; i -= 2) { const [tx, ty] = this.trail[i], k = 1 - i / n; glow(ctx, tx - W.cam.x, ty - W.cam.y, 3 + 7 * k, 0.3 * k * soft, col); } // Schweif
      glow(ctx, cx, cy, 14, 0.6 * soft, col);
      const x = Math.round(cx), y = Math.round(cy + Math.sin(this.t * 0.35) * 0.8);
      const [px, py] = this.trail[3] || [this.cx, this.cy + 6]; let ux = px - this.cx, uy = py - this.cy; const ul = Math.hypot(ux, uy); if (ul < 0.5) { ux = 0; uy = 1; } else { ux /= ul; uy /= ul; }
      const lobes = (grow) => { // Leib und Flammenzipfel gegen die Flugrichtung
        ctx.beginPath(); ctx.arc(x, y, 5.2 + grow, 0, TAU); ctx.fill();
        for (let i = 1; i <= 3; i++) { const w = Math.sin(this.t * 0.45 + i * 1.3) * 0.9; ctx.beginPath(); ctx.arc(x + ux * i * 2.7 - uy * w, y + uy * i * 2.7 + ux * w, Math.max(0.6, 4.6 - i * 1.2) + grow, 0, TAU); ctx.fill(); }
      };
      ctx.fillStyle = col; lobes(1); ctx.fillStyle = '#1c1030'; lobes(0);
      const ex = Math.round(-ux * 0.8), ey = Math.round(-uy * 0.8), blink = (this.t + 17) % 64 < 4;  // Augen schauen in Flugrichtung, blinzeln ab und zu
      ctx.fillStyle = col;
      if (blink) { ctx.fillRect(x - 3 + ex, y - 1 + ey, 2, 1); ctx.fillRect(x + 1 + ex, y - 1 + ey, 2, 1); }
      else { ctx.fillRect(x - 3 + ex, y - 2 + ey, 2, 3); ctx.fillRect(x + 1 + ex, y - 2 + ey, 2, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3 + ex, y - 2 + ey, 1, 1); ctx.fillRect(x + 1 + ex, y - 2 + ey, 1, 1); }
    }
  }
  class Catcher extends Ent { // Traumfänger: schwebt drehend über dem Helden ein, fängt den Mahr im Netz, leuchtet auf und zieht in den Helden
    constructor(def) { // Ebene der Requisiten: hängt wie ein Heiligenschein hinter dem Helden; Licht und Funken liegen davor
      super(0, 0, 1, 1); this.kind = 'prop'; this.def = def; this.st = 'in'; this.u = 0; this.ang = 720; this.sc = 0; this.g = 0; this.got = false; const p = W.player; this.hx = p.cx; this.hy = p.y + HY;
      const [r, g, b] = rgbOf(def.col); this.lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
    }
    go(st) { this.st = st; this.u = 0; }
    grab() { this.got = true; this.go('glow'); this.ang -= 360 * Math.round(this.ang / 360); }
    update() {
      this.t++; this.u++; const p = W.player;
      if (this.st !== 'out') { this.hx += (p.cx - this.hx) * 0.3; this.hy += (p.y + HY - this.hy) * 0.3; this.sc = backOut(Math.min(1, this.t / 18)); }
      if (this.st === 'in') { const k = Math.min(1, this.t / 18); this.ang = 720 * (1 - k) * (1 - k); if (k >= 1) this.go('wait'); }
      else if (this.st === 'wait') { this.ang = 26 * Math.sin(this.u * 0.08); if (this.u > 200) this.go('out'); }
      else if (this.st === 'glow') {
        this.ang += (0 - this.ang) * 0.25; this.g = this.u < 5 ? this.u / 5 : Math.max(0, 1 - (this.u - 5) / 42);
        if (this.u < 26 && this.u % 2 === 0) { const a = rnd(0, Math.PI * 2), r = 15; W.spawn(new Particle(this.hx + Math.cos(a) * r, this.hy + Math.sin(a) * r, -Math.cos(a) * 1.2, -Math.sin(a) * 1.2, this.u % 4 ? this.def.col : '#fffbe8', 11, 1, 0)); } // Lichtfunken laufen ins Netz
        if (this.u > 46) this.go('out');
      } else { // out: dreht sich schneller, wird kleiner und sinkt in den Helden
        const k = Math.min(1, this.u / 20); this.ang += 10 + 36 * k; this.sc = 1 - k * k; this.g = Math.max(0, this.g - 0.05);
        this.hx += (p.cx - this.hx) * 0.3; this.hy += (p.cy - this.hy) * 0.3;
        if (this.u % 2 === 0) W.spawn(new Particle(this.hx + rnd(-6, 6), this.hy + rnd(-6, 6), rnd(-0.4, 0.4), rnd(-0.8, -0.1), this.u % 4 ? this.def.col : '#fffbe8', 16, 1, 0));
        if (k >= 1) {
          this.dead = true; if (!this.got) return;
          W.spawn(new Shock(p.cx, p.cy, 20, this.def.col, 2));
          for (let i = 0; i < 8; i++) W.spawn(new Particle(p.cx + rnd(-4, 4), p.cy + rnd(-10, 6), rnd(-0.9, 0.9), rnd(-1.6, -0.4), i % 2 ? this.def.col : '#fcfcfc', 24, 1, 0.03));
        }
      }
    }
    lightUp(L, cx, cy) { if (this.g > 0.05) L.push({ x: this.hx - cx, y: this.hy - cy, r: 24 + 22 * this.g, c: rgbOf(this.def.col), a: 0.55 * this.g }); }
    draw(ctx) {
      if (W.shC && ctx.canvas === W.shC) return;                                                            // kein Gewitterschatten
      const A = TF.get(); if (!A) return this.ring(ctx);
      const s = this.sc; if (s < 0.04) return;
      const soft = 1 - 0.45 * this.lum;                                                                       // helle Mahre (Knochen, Brief) leuchten gedämpfter
      const hx = this.hx - W.cam.x, hy = this.hy - W.cam.y, a = ((this.ang % 360) + 360) % 360, fr = Math.round(a / 30) % 12, img = A.f[fr];
      if (this.g > 0.02) glow(ctx, hx, hy, 10 + 14 * this.g, 0.5 * this.g * soft, this.def.col);              // Schein hinter dem Reif
      ctx.save();
      if (Math.abs(s - 1) < 0.01) ctx.drawImage(img, Math.round(hx - 22), Math.round(hy - 17)); else ctx.drawImage(img, hx - 22 * s, hy - 17 * s, 44 * s, 64 * s);
      const cw = Math.abs(Math.cos(a * Math.PI / 180)), G = this.g > 0.02 && TF.glowOf(this.def.col);
      if (G && cw > 0.15) { // das Netz leuchtet in der Farbe des Mahrs (bei schräger Lage schmaler)
        const w = 44 * s * cw, x = hx - w / 2, y = hy - 17 * s, h = 64 * s, pul = 0.8 + 0.2 * Math.sin(this.t * 0.7);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, this.g * pul * soft); ctx.drawImage(G, x, y, w, h);
        if (!View.lite) { ctx.globalAlpha = 0.16 * this.g * soft; for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(G, x + ox, y + oy, w, h); }
      }
      if (this.g > 0.12 && !View.lite) { // Lichtstrahlen aus dem Kristall
        ctx.globalCompositeOperation = 'lighter'; ctx.translate(hx, hy); ctx.rotate(this.t * 0.03); ctx.fillStyle = this.def.col;
        for (let i = 0; i < 8; i++) { const L = (14 + 16 * this.g) * (i % 2 ? 0.7 : 1); ctx.globalAlpha = 0.22 * this.g * soft; ctx.beginPath(); ctx.moveTo(0, -1.4); ctx.lineTo(L, 0); ctx.lineTo(0, 1.4); ctx.fill(); ctx.rotate(Math.PI / 4); }
      }
      ctx.restore();
    }
    ring(ctx) { // Ersatz, solange das Bild lädt: Reif mit Netz und drei Federn
      const x = this.hx - W.cam.x, y = this.hy - W.cam.y, r = 13 * Math.max(0.05, this.sc), rot = this.t * 0.05;
      ctx.save(); ctx.translate(x, y);
      ctx.strokeStyle = '#8c5c2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(252,224,168,0.8)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 7; i++) { const a0 = rot + i * Math.PI * 2 / 7, a1 = rot + (i + 3) * Math.PI * 2 / 7; ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); }
      ctx.stroke();
      for (const dx of [-7, 0, 7]) { ctx.fillStyle = '#f0ead8'; ctx.fillRect(dx - 1, r + 3, 3, 8); ctx.fillStyle = '#4c3424'; ctx.fillRect(dx - 1, r + 9, 3, 2); }
      ctx.restore();
    }
  }

  class Glyph extends Ent { // Zauberkreis unter dem Helden, solange der Ruf hinausgeht
    constructor(col) { super(0, 0, 1, 1); this.kind = 'fx'; this.col = col; }
    update() { if (++this.t > 22) this.dead = true; }
    draw(ctx) {
      const p = W.player, x = Math.round(p.cx - W.cam.x), y = Math.round(p.feet - W.cam.y) - 1, k = this.t / 22, r = 6 + 18 * Math.min(1, k * 2.2), a = k < 0.5 ? 1 : (1 - k) * 2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.9; ctx.strokeStyle = this.col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.62, r * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) { const an = this.t * 0.2 + i * Math.PI / 3; ctx.fillRect(Math.round(x + Math.cos(an) * r) - 1, Math.round(y + Math.sin(an) * r * 0.3) - 1, 2, 2); }
      ctx.globalAlpha = a * 0.3; ctx.fillStyle = this.col; ctx.fillRect(x - 1, y - 34, 2, 34); // Lichtsäule
      ctx.restore();
    }
  }
  class CritStar extends Ent { // kritischer Treffer: vierstrahliger Stern blitzt am Gegner auf
    constructor(x, y) { super(x, y, 1, 1); this.kind = 'fx'; this.rot = rnd(-0.3, 0.3); }
    update() { if (++this.t > 11) this.dead = true; }
    draw(ctx) {
      const x = this.x - W.cam.x, y = this.y - W.cam.y, k = this.t / 11, L = 10 + 28 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2), w = 5 * (1 - k);
      ctx.save(); ctx.translate(x, y); ctx.rotate(this.rot + 0.5); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k * k;
      for (let i = 0; i < 2; i++) {
        if (i) ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#fcd070'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-L * 0.6, 0); ctx.lineTo(0, -w * 0.5); ctx.lineTo(L * 0.6, 0); ctx.lineTo(0, w * 0.5); ctx.fill();
      }
      ctx.restore();
    }
  }

  // Ruf auslösen: Rang und Stufe heben den Schaden
  function cast(def, p, rank, mul) { // mul: Stärke des Helden (wie beim Peitschenhieb)
    const k = 1 + 0.15 * (rank - 1), D = (b) => b * k * mul, f = p.face, x = p.cx + f * 8, y = p.y + 11;
    W.spawn(new Glyph(def.col)); Audio8.sfx('cast');
    switch (def.id) {
      case 'bat': for (let i = 0; i < 3; i++) W.spawn(new Shot('bat', x, y - 7 + i * 7, f * (2.4 + i * 0.3), 0, D(1.1), { ph: i * 2.1, life: 100 })); Audio8.sfx('bat'); break;
      case 'bone': W.spawn(new Shot('bone', x, y, f * 2.6, -2.3, D(1.6), { life: 170 })); Audio8.sfx('throw'); break;
      case 'fire': W.spawn(new Shot('fire', x, y + 2, f * 3.8, 0, D(2.4), { life: 80 })); Audio8.sfx('fire'); break;
      case 'pages': for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.22; W.spawn(new Shot('page', x, y, Math.cos(a) * 3.2 * f, Math.sin(a) * 3.2, D(0.9), { ph: i, life: 55 })); } Audio8.sfx('page'); break;
      case 'raven': W.spawn(new Shot('raven', p.cx - f * 46, p.y - 62, f * 3.6, 2.9, D(2.6), { life: 80 })); Audio8.sfx('whoosh'); break;
      case 'stone': W.spawn(new Shot('stone', x, y - 2, f * 1.7, 0, D(0.8), { life: 150, stun: 110 + rank * 14 })); Audio8.sfx('charge'); break;
      case 'folder': W.spawn(new Shot('folder', x, y, f * 4.4, 0, D(1.7), { life: 130 })); Audio8.sfx('klack2'); break;
      case 'letter': W.spawn(new Shot('letter', x, y, f * 5.6, 0, D(1.5), { life: 60 })); Audio8.sfx('whoosh'); break;
      case 'star': { const tg = Castle.mahrTarget(p, 240, 150), tx = tg ? tg.cx : p.cx + f * 72, ty = tg ? tg.cy : p.feet - 8; W.spawn(new Shot('star', tx - f * 50, ty - 150, f * 2, 6, D(3.6), { life: 70, ty })); Audio8.sfx('holy'); break; }
      case 'orbit': W.ents.forEach(e => { if (e instanceof Orbit) e.dead = true; }); W.spawn(new Orbit(D(0.45), 420 + rank * 30)); Audio8.sfx('rosary'); break;
    }
  }
  // Bildzeichen 11×11: der Wisch in der Farbe des Mahrs; Ruf mit Flammenzipfel, Bann mit Reif
  function icon(ctx, def, x, y, dim) {
    const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (def.slot === 'bann') { R(1, 0, 9, 1, '#c89020'); R(0, 1, 1, 9, '#c89020'); R(10, 1, 1, 9, '#c89020'); R(1, 10, 9, 1, '#c89020'); }
    R(2, 2, 7, 6, dim ? '#2c2c3c' : '#1c1030'); R(3, 1, 5, 8, dim ? '#2c2c3c' : '#1c1030'); if (def.slot === 'ruf') { R(5, 0, 1, 1, def.col); R(4, 9, 3, 1, dim ? '#2c2c3c' : '#1c1030'); R(5, 10, 1, 1, dim ? '#2c2c3c' : '#1c1030'); }
    R(3, 4, 2, 2, dim ? '#5c5c6c' : def.col); R(6, 4, 2, 2, dim ? '#5c5c6c' : def.col); if (!dim) { R(3, 4, 1, 1, '#ffffff'); R(6, 4, 1, 1, '#ffffff'); }
  }
  return { LIST, BY, FROM, ROMAN, cast, icon, glow, Shot, Orbit, Stone, Wisp, Catcher, Glyph, CritStar };
})();
