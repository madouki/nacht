// Wetterhahn: Kupferhahn mit Grünspan auf einem eisernen Windpfeil, vom Kirchturm abgerissen (Hof, Brücke, Schiff, Turm, Turmspitze,
// Wald). Er gleitet über dem Helden und dreht sich ab und zu im Wind. Zum Angriff kräht er, dreht sich wie eine Wetterfahne zum Helden –
// der Pfeil zeigt die Stoßrichtung, die Spitze glüht, eine Ziellinie blinkt – und stößt dann geradeaus. Rammt er eine Wand, steckt er
// eine Weile fest und tut niemandem weh. Bilder: tools/blender/wetter_bl.py, pack_wetter.py
'use strict';
const Wetter = (() => {
  const MAP = {"wetter_glide0":[0,0,40,36],"wetter_glide1":[41,0,40,36],"wetter_aim":[82,0,40,36],"wetter_dash":[123,0,40,36]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { glide: [fr('wetter_glide0'), fr('wetter_glide1')], aim: fr('wetter_aim'), dash: fr('wetter_dash') };
  };
  img.src = 'img/wetter3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['courtyard', 'bridge', 'ship', 'spire', 'tower', 'forest']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const AIM = 40, LOCK = 12, DASH = 34, SPEED = 4.0, MAXANG = 0.95; // Zielen (Bilder), davon zuletzt fest, Stoßdauer, Tempo, steilster Winkel
  const PX = 20, PY = 15; // Drehpunkt im Bild (Rumpfmitte)

  class Wetterhahn extends Enemy {
    constructor(x, y) { super(x - 9, y - 9, 18, 18, 7, 2, 450); this.hx = x; this.hy = y; this.tm = 0; this.st = 'glide'; this.face = -1; this.ang = 0; this.dx = 0; this.dy = 0; this.cd = 60 + Math.floor(Math.random() * 40); this.gust = 90 + Math.floor(Math.random() * 90); this.seen = true; }
    aimAt(p) { // Winkel zum Helden, flacher als MAXANG; face zeigt zur Seite des Helden
      const dx = p.cx - this.cx, dy = p.cy - this.cy; if (Math.abs(dx) > 2) this.face = dx > 0 ? 1 : -1;
      this.ang = clamp(Math.atan2(dy, Math.max(1, Math.abs(dx))), -MAXANG, MAXANG);
    }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy;
      const near = p.alive && Math.abs(dx) < 170 && Math.abs(dy) < 120;
      if (this.st === 'glide') {
        if (near) this.face = dx > 0 ? 1 : -1;
        else if (--this.gust <= 0) { this.face = -this.face; this.gust = 100 + Math.floor(Math.random() * 120); } // dreht sich im Wind
        const tx = near ? p.cx - this.face * 78 : this.hx, ty = (near ? p.y - 34 : this.hy) + Math.sin(this.tm * 0.05) * 6;
        const ex = tx - this.cx, ey = ty - this.cy, L = Math.hypot(ex, ey);
        if (L > 1) { const sp = Math.min(0.9, L * 0.04), nx = this.x + ex / L * sp, ny = this.y + ey / L * sp; if (!Phys.rectSolid(nx, this.y, this.w, this.h)) this.x = nx; if (!Phys.rectSolid(this.x, ny, this.w, this.h)) this.y = ny; }
        this.ang *= 0.85;
        if (near && --this.cd <= 0) {
          this.st = 'aim'; this.tm = 0; Audio8.sfx('charge', this.cx);
          if (Math.random() < 0.4 || !F().wetter_crow) { if (Castle.setFlag && !F().wetter_crow) Castle.setFlag('wetter_crow'); W.spawn(new Popup(this.cx, this.y - 10, tr('wetterCrow'), '#ffd060')); }
        }
      } else if (this.st === 'aim') { // dreht sich wie eine Wetterfahne zum Helden, die letzten Bilder steht der Winkel fest
        if (this.tm < AIM - LOCK) this.aimAt(p);
        if (this.tm === AIM - LOCK) Audio8.sfx('select', this.cx);
        if (this.tm >= AIM) {
          this.st = 'dash'; this.tm = 0; this.dx = this.face * Math.cos(this.ang) * SPEED; this.dy = Math.sin(this.ang) * SPEED; Audio8.sfx('whoosh', this.cx);
          if (!F().wetter_tip && Castle.setFlag) { Castle.setFlag('wetter_tip'); Game.note('wetterNote'); }
        }
      } else if (this.st === 'dash') {
        const nx = this.x + this.dx, ny = this.y + this.dy, out = nx < 2 || ny < 2 || nx + this.w > W.room.w * T - 2 || ny + this.h > W.room.h * T - 2;
        if (out || Phys.rectSolid(nx, ny, this.w, this.h)) { // Pfeil steckt in der Wand
          this.st = 'stuck'; this.tm = 0; Audio8.sfx('wall', this.cx); W.shake = Math.max(W.shake, 2); if (F() && typeof Castle !== 'undefined' && Castle.flags) Castle.flags.wetter_ram = (Castle.flags.wetter_ram || 0) + 1; // für die Urkunde
          const tx = this.cx + Math.sign(this.dx) * 10, ty = this.cy + Math.sign(this.dy) * 6;
          for (let i = 0; i < 8; i++) W.spawn(new Particle(tx, ty, rnd(-1.6, 1.6), rnd(-2, 0), i % 2 ? '#b0a090' : '#e0b040', 22, 1, 0.12));
        } else {
          this.x = nx; this.y = ny;
          if (this.tm % 3 === 0) W.spawn(new Particle(this.cx - Math.sign(this.dx) * 10, this.cy + rnd(-4, 4), -this.dx * 0.15, rnd(-0.3, 0.3), this.tm % 6 ? '#5c9a86' : '#e8f0f0', 16, 1, 0));
          if (this.tm >= DASH) { this.st = 'glide'; this.tm = 0; this.cd = 110 + Math.floor(Math.random() * 60); }
        }
      } else if (this.st === 'stuck') { // zappelt, Sternchen; tut niemandem weh
        if (this.tm % 10 === 0) W.spawn(new Particle(this.cx + rnd(-6, 6), this.y - 4, rnd(-0.5, 0.5), -0.6, '#ffe890', 20, 1, 0));
        if (this.tm >= 70) { this.st = 'glide'; this.tm = 0; this.cd = 90 + Math.floor(Math.random() * 50); this.x -= Math.sign(this.dx) * 2; this.y -= Math.sign(this.dy) * 2; }
      }
      if (this.st !== 'stuck') this.touch();
    }
    kill(silent) {
      super.kill(silent); if (silent) return;
      for (let i = 0; i < 14; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2.2, 2.2), rnd(-2.6, 0.2), i % 3 ? '#5c9a86' : i % 2 ? '#e0b040' : '#2c2c34', 48, 2, 0.12));
      Audio8.sfx('tink', this.cx);
    }
    lightUp(L, cx, cy) {
      if (this.st === 'aim') { const t = this.tip(); L.push({ x: t[0] - cx, y: t[1] - cy, r: 20, c: [255, 160, 80], a: 0.3 + 0.25 * (this.tm / AIM) }); }
      else L.push({ x: this.cx + this.face * 9 - cx, y: this.y - 2 - cy, r: 10, c: [255, 210, 120], a: 0.15 });
    }
    tip() { // Pfeilspitze in Weltkoordinaten (Bild: 18 Pixel vor, 12 unter dem Drehpunkt), mitgedreht
      const r = this.face * this.ang, lx = this.face * 18, ly = 12; return [this.cx + lx * Math.cos(r) - ly * Math.sin(r), this.cy + lx * Math.sin(r) + ly * Math.cos(r)];
    }
    drawAim(ctx) { // blinkende Ziellinie in Stoßrichtung, ab der Pfeilspitze
      if (this.tm < 6) return; const locked = this.tm >= AIM - LOCK; if (!locked && (this.tm >> 2) & 1) return;
      const ux = this.face * Math.cos(this.ang), uy = Math.sin(this.ang); ctx.fillStyle = locked ? ((this.tm >> 1) & 1 ? '#fff0c0' : '#ff9040') : '#c89060';
      const [tx, ty] = this.tip();
      for (let d = 4; d < 100; d += 6) { if (locked && d > 4 + (this.tm - (AIM - LOCK)) * 12) break; ctx.fillRect(Math.round(tx + ux * d - W.cam.x), Math.round(ty + uy * d - W.cam.y), 2, 2); }
    }
    draw(ctx) {
      if (!S) return;
      if (this.st === 'aim') this.drawAim(ctx);
      const s = this.st === 'aim' ? S.aim : this.st === 'dash' ? S.dash : S.glide[(this.tm >> 4) & 1], fl = this.flashT > 0 && (this.flashT & 2);
      let rot = this.face * this.ang; if (this.st === 'stuck') rot += Math.sin(this.tm * 0.9) * 0.12 * Math.max(0, 1 - this.tm / 40);
      const sx = Math.round(this.cx - W.cam.x), sy = Math.round(this.cy - W.cam.y);
      if (Math.abs(rot) < 0.02) { this.ds(ctx, s, sx - PX, sy - PY, this.face < 0, fl); return; }
      this.lastDraw = { s, x: sx - PX + W.cam.x, y: sy - PY + W.cam.y, flip: this.face < 0, f: W.frame };
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); Sprites.draw(ctx, s, -PX, -PY, this.face < 0, fl); ctx.restore();
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // freie Luft (3×3 Kacheln) über begehbarem Boden, fern von Start und Türen
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 3; r < R.h - 4; r++) for (let c = 6; c < R.w - 6; c++) {
      let ok = true; for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1 && ok; j++) ok = !sol(c + i, r + j);
      if (!ok) continue; let k = 0; while (r + 2 + k < R.h && !sol(c, r + 2 + k)) k++; if (k > 7) continue;
      if (Math.abs(c - st.x) < 12 || avoid.some(([x, y]) => Math.abs(x - c) < 6 && Math.abs(y - r) < 6)) continue;
      out.push([c, r]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('wetter:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    const L = spots(w); if (!L.length) return;
    const n = R.w >= 100 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 20)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Wetterhahn(c * T + T / 2, r * T + T / 2));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Wetterhahn, AIM, DASH, get ready() { return !!S; } };
})();
