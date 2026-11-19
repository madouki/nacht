// Galvanifrosch: mechanischer Frosch mit Kupferspule und Glaskuppel (Labor, Weltausstellung, Automatenwerk, Bahnhof). Er sitzt und pumpt
// mit dem Kehlsack; kommt der Held näher, duckt er sich, Funken springen über den Rücken (Vorwarnung), dann springt er auf ihn zu.
// Beim Aufkommen entlädt sich die Spule: ein Blitzbogen läuft links und rechts über den Boden. Wer dann in der Luft ist, bleibt heil.
// Bilder: tools/blender/frosch_bl.py, pack_frosch.py
'use strict';
const Frosch = (() => {
  const MAP = {"frosch_sit":[0,0,36,26],"frosch_crouch":[37,0,36,26],"frosch_leap":[74,0,36,26]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { sit: fr('frosch_sit'), crouch: fr('frosch_crouch'), leap: fr('frosch_leap') };
  };
  img.src = 'img/frosch3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['lab', 'expo', 'werk', 'station']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const REACH = 30; // Reichweite der Entladung zu jeder Seite (Pixel)

  class Entladung extends Ent { // Blitzbogen am Boden: trifft nur, wer mit den Füßen in Bodennähe ist
    constructor(x, floor, dmg) { super(x - REACH, floor - 10, REACH * 2, 10); this.kind = 'fx'; this.x0 = x; this.floor = floor; this.dmg = dmg; this.life = 16; this.hitDone = false; }
    update() {
      this.t++; const p = W.player;
      if (!this.hitDone && p.alive && Math.abs(p.cx - this.x0) < REACH + p.w / 2 && Math.abs(p.y + p.h - this.floor) < 10) { this.hitDone = true; p.hurt(this.dmg, this.x0); }
      if (this.t > 5) this.hitDone = true; // nur in den ersten Bildern gefährlich
      if (--this.life <= 0) this.dead = true;
    }
    lightUp(L, cx, cy) { L.push({ x: this.x0 - cx, y: this.floor - 4 - cy, r: 44, c: [150, 230, 255], a: 0.5 * this.life / 16 }); }
    draw(ctx) {
      const y0 = Math.round(this.floor - W.cam.y), x0 = Math.round(this.x0 - W.cam.x), k = this.life / 16, reach = REACH * Math.min(1, this.t / 4);
      for (const dir of [-1, 1]) for (let arc = 0; arc < 2; arc++) {
        ctx.fillStyle = arc ? '#e8fcff' : '#7cd8fc'; let y = y0 - 2;
        for (let i = 0; i < reach; i += 2) { y = clamp(y + (((i * 7 + this.t * 13 + arc * 5) % 5) - 2), y0 - 7, y0 - 1); if (Math.random() < k + 0.2) ctx.fillRect(x0 + dir * i, y, 2, 1); }
      }
    }
  }
  class Galvanifrosch extends Enemy {
    constructor(x, floorY) { super(x - 9, floorY - 14, 18, 14, 6, 2, 400); this.st = 'sit'; this.tm = 0; this.face = -1; this.cd = 40 + Math.floor(Math.random() * 40); this.vx = 0; this.vy = 0; this.air = false; this.hx = x; }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy;
      const near = p.alive && Math.abs(dx) < 150 && Math.abs(dy) < 70;
      if (this.st === 'sit') {
        this.vx = 0; this.physics(); if (near) this.face = dx > 0 ? 1 : -1;
        if (near && --this.cd <= 0 && this.onGround) { this.st = 'crouch'; this.tm = 0; Audio8.sfx('charge', this.cx); }
      } else if (this.st === 'crouch') { // Funken springen über den Rücken: gleich geht's los
        this.vx = 0; this.physics();
        if (this.tm % 4 === 0) W.spawn(new Particle(this.cx + rnd(-8, 8), this.y - 4 + rnd(-4, 2), rnd(-0.8, 0.8), rnd(-1.4, -0.4), this.tm % 8 ? '#a8f0ff' : '#ffffff', 14, 1, 0.05));
        if (this.tm >= 26) { this.st = 'leap'; this.tm = 0; this.face = dx > 0 ? 1 : dx < 0 ? -1 : this.face; this.vx = this.face * clamp(Math.abs(dx) / 34, 1.1, 2.3); this.vy = -4.1; this.onGround = false; this.air = true; Audio8.sfx('whoosh', this.cx); }
      } else if (this.st === 'leap') {
        if (this.physics()) this.vx = 0;
        if (this.air && this.onGround && this.tm > 4) { // Aufschlag: Spule entlädt sich
          this.air = false; this.vx = 0; W.spawn(new Entladung(this.cx, this.y + this.h, this.dmg)); Audio8.sfx('zap', this.cx); W.dust(this.cx, this.y + this.h, 1);
          if (!F().frosch_tip && Castle.setFlag) { Castle.setFlag('frosch_tip'); Game.note('froschNote'); }
          this.st = 'sit'; this.tm = 0; this.cd = 60 + Math.floor(Math.random() * 50);
        }
      }
      this.touch();
    }
    kill(silent) { super.kill(silent); if (silent) return; for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2, 2), rnd(-2.6, -0.4), i % 3 ? '#4c9c5c' : i % 2 ? '#d8a838' : '#a8f0ff', 50, 2, 0.12)); Audio8.sfx('zap', this.cx); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y - 8 - cy, r: this.st === 'crouch' ? 30 : 18, c: [150, 230, 255], a: this.st === 'crouch' ? 0.45 : 0.22 }); }
    draw(ctx) {
      if (!S) return;
      const s = this.st === 'crouch' ? S.crouch : this.st === 'leap' && !this.onGround ? S.leap : S.sit;
      this.spr(ctx, s, this.face < 0, 0, 2, this.flashT > 0 && (this.flashT & 2));
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // Bodenplätze: drei Kacheln fester Boden, darüber zwei Kacheln frei, fern von Start, Türen und Figuren
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar|Lift|Pater/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 2; r < R.h - 1; r++) for (let c = 6; c < R.w - 6; c++) {
      let ok = true; for (let i = -1; i <= 1 && ok; i++) ok = sol(c + i, r + 1) && !sol(c + i, r) && !sol(c + i, r - 1);
      if (!ok || Math.abs(c - st.x) < 12) continue;
      if (avoid.some(([x, y]) => Math.abs(x - c) < 5 && Math.abs(y - r) < 4)) continue;
      out.push([c, r]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('frosch:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    const L = spots(w); if (!L.length) return;
    const n = R.w >= 100 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 20)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Galvanifrosch(c * T + T / 2, (r + 1) * T));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Galvanifrosch, Entladung, REACH, get ready() { return !!S; } };
})();
