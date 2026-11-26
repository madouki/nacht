// Frostgeist: schwebender Kapuzengeist mit Eiskrone in Eishöhle, Spiegelsaal, Glasturm und Kaleidoskop. Er hält Abstand über dem Helden,
// hebt die Hände – an der Decke glitzern drei Risse – und lässt Eiszapfen herabfallen. Beim Tod zerspringt er in Splitter.
// Bilder: tools/blender/frost_bl.py, pack_frost.py
'use strict';
const Frost = (() => {
  const MAP = {"frost_float0":[0,0,48,56],"frost_float1":[49,0,48,56],"frost_cast":[98,0,48,56]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { float: [fr('frost_float0'), fr('frost_float1')], cast: fr('frost_cast') };
  };
  img.src = 'img/frost3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['ice', 'mirror', 'glass', 'kaleido']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};

  class Eiszapfen extends Ent { // erst ein glitzernder Riss an der Decke (Vorwarnung), dann fällt der Zapfen
    constructor(x, top, dmg) { super(x - 4, top, 8, 16); this.kind = 'eproj'; this.unstoppable = true; this.dmg = dmg; this.warn = 42; this.vy = 0; this.top = top; }
    update() {
      this.t++;
      if (this.warn > 0) { if (--this.warn % 6 === 0) W.spawn(new Particle(this.cx + rnd(-4, 4), this.top + 2, 0, rnd(0.3, 0.7), '#c8f0fc', 18, 1, 0.02)); if (this.warn === 0) Audio8.sfx('crack', this.cx); return; }
      this.vy = Math.min(7, this.vy + 0.45); this.y += this.vy; const p = W.player;
      if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.shatter(); return; }
      if (Phys.solidTile(Math.floor(this.cx / T), Math.floor((this.y + this.h) / T)) || this.y > W.room.h * T) this.shatter();
    }
    shatter() { this.dead = true; Audio8.sfx('tink', this.cx); for (let i = 0; i < 8; i++) W.spawn(new Particle(this.cx, this.y + this.h - 2, rnd(-1.6, 1.6), rnd(-2.2, -0.4), i % 2 ? '#c8f0fc' : '#7cc8ec', 26, 1, 0.14)); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: (this.warn > 0 ? this.top + 2 : this.cy) - cy, r: 16, c: [150, 230, 252], a: this.warn > 0 ? 0.25 + 0.2 * ((this.warn >> 2) & 1) : 0.35 }); }
    draw(ctx) {
      const x = Math.round(this.cx - W.cam.x);
      if (this.warn > 0) { const y = Math.round(this.top - W.cam.y), k = (this.warn >> 2) & 1; ctx.fillStyle = k ? '#e8fcff' : '#8cd8f4'; ctx.fillRect(x - 4, y, 9, 1); ctx.fillRect(x - 1, y + 1, 3, 2); ctx.fillRect(x, y + 3, 1, 2); return; }
      const y = Math.round(this.y - W.cam.y); for (let i = 0; i < 16; i++) { const w = Math.max(1, Math.round(6 * (1 - i / 16))); ctx.fillStyle = i < 3 ? '#e8fcff' : i % 4 === 0 ? '#c8f0fc' : '#8cd8f4'; ctx.fillRect(x - (w >> 1), y + i, w, 1); }
    }
  }
  class Frostgeist extends Enemy {
    constructor(x, y) { super(x - 8, y - 15, 16, 30, 8, 2, 500); this.hx = x; this.hy = y; this.tm = 0; this.st = 'float'; this.face = -1; this.seen = true; this.cd = 90; }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.cx, near = Math.abs(dx) < 260 && Math.abs(p.cy - this.cy) < 180;
      if (near) this.face = dx > 0 ? 1 : -1;
      if (this.st === 'float') {
        const tx = near ? p.cx - this.face * 70 : this.hx, ty = (near ? p.y - 46 : this.hy) + Math.sin(this.tm * 0.06) * 8;
        const ex = tx - this.cx, ey = ty - this.cy, L = Math.hypot(ex, ey);
        if (L > 1) { const sp = Math.min(0.7, L * 0.04); const nx = this.x + ex / L * sp, ny = this.y + ey / L * sp; if (!Phys.rectSolid(nx, ny, this.w, this.h)) { this.x = nx; this.y = ny; } }
        if (near && --this.cd <= 0) { this.st = 'cast'; this.tm = 0; Audio8.sfx('cast', this.cx); }
      } else if (this.tm === 18) { // drei Zapfen: über dem Helden und links und rechts davon
        for (const o of [-30, 0, 30]) { const x = p.cx + o + rnd(-4, 4), c = Math.floor(x / T); let r = Math.floor((p.y - 2) / T), k = 0; while (r > 0 && !Phys.solidTile(c, r - 1) && k++ < 12) r--; W.spawn(new Eiszapfen(x, Math.max(r * T, W.cam.y), this.dmg)); }
        if (!F().frost_tip && Castle.setFlag) { Castle.setFlag('frost_tip'); Game.note('frostNote'); }
      } else if (this.tm > 40) { this.st = 'float'; this.cd = 150 + Math.floor(Math.random() * 60); }
      this.touch();
    }
    kill(silent) { super.kill(silent); if (silent) return; for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2.2, 2.2), rnd(-2.4, 0.6), i % 3 ? '#a8e8fc' : '#e8fcff', 40, 2, 0.1)); Audio8.sfx('shatter', this.cx); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 6 - cy, r: 34, c: [120, 220, 252], a: this.st === 'cast' ? 0.55 : 0.32 }); }
    draw(ctx) {
      if (!S) return;
      const s = this.st === 'cast' ? S.cast : S.float[(this.tm >> 4) & 1];
      ctx.save(); ctx.globalAlpha = 0.9; this.spr(ctx, s, this.face < 0, 0, 13, this.flashT > 0 && (this.flashT & 2)); ctx.restore();
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
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.safe || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('frost:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    const L = spots(w); if (!L.length) return;
    const n = R.w >= 90 ? 2 : 1, got = []; // jeder kalte Raum hat seinen Geist, lange Säle zwei
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 18)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Frostgeist(c * T + T / 2, r * T + T / 2));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Frostgeist, Eiszapfen, get ready() { return !!S; } };
})();
