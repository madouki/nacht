// Wasserspeier: hocken als Steinfiguren auf Simsen über Abgründen (Turm, Halle, Kathedrale, Galerie, Hof, Brücke, Gruft, Bibliothek).
// Als Stein unverwundbar. Geht der Held darunter vorbei, glühen die Augen auf, die Figur reißt sich los und stürzt sich auf ihn,
// dann fliegt sie mühsam zurück auf ihren Platz – nur jetzt ist sie verwundbar. Bilder: tools/blender/garg_bl.py, pack_garg.py
'use strict';
const Garg = (() => {
  const MAP = {"garg_stone":[0,0,64,56],"garg_wake":[65,0,64,56],"garg_fly0":[130,0,64,56],"garg_fly1":[195,0,64,56],"garg_dive":[260,0,64,56]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { stone: fr('garg_stone'), wake: fr('garg_wake'), fly: [fr('garg_fly0'), fr('garg_fly1')], dive: fr('garg_dive') };
  };
  img.src = 'img/garg3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['tower', 'hall', 'cathedral', 'spire', 'gallery', 'courtyard', 'bridge', 'crypt', 'library']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};

  class Gargoyle extends Enemy {
    constructor(c, r) { super(c * T - 3, (r + 1) * T - 22, 22, 22, 10, 3, 700); this.hx = this.x; this.hy = this.y; this.st = 'stone'; this.tm = 0; this.cool = 60; this.face = 1; this.vx = 0; this.vy = 0; this.seen = true; }
    update() {
      super.update(); const p = W.player; this.tm++;
      if (this.st === 'stone') {
        if (this.cool > 0) { this.cool--; return; }
        if (p.alive && Math.abs(p.cx - this.cx) < 96 && p.cy > this.cy + 12 && p.cy - this.cy < 190) { this.st = 'wake'; this.tm = 0; this.face = p.cx < this.cx ? -1 : 1; Audio8.sfx('crumble', this.cx); if (!F().garg_tip && Castle.setFlag) { Castle.setFlag('garg_tip'); Game.note('gargNote'); } }
        return;
      }
      if (this.st === 'wake') { // die Augen glühen, Steinstaub rieselt, dann reißt er sich los
        if (this.tm % 4 === 0) W.spawn(new Particle(this.cx + rnd(-8, 8), this.y + this.h, rnd(-0.2, 0.2), rnd(0.3, 0.8), '#8c8890', 30, 1, 0.05));
        if (this.tm > 40) { const dx = p.cx - this.cx, dy = p.cy - this.cy, L = Math.hypot(dx, dy) || 1; this.vx = dx / L * 3.4; this.vy = Math.max(0.6, dy / L * 3.4); this.face = dx < 0 ? -1 : 1; this.st = 'dive'; this.tm = 0; Audio8.sfx('whoosh', this.cx); Audio8.sfx('roar', this.cx); }
        return;
      }
      if (this.st === 'dive') {
        this.x += this.vx; this.y += this.vy; this.touch();
        const hitWall = this.tm > 8 && (Phys.solidTile(Math.floor((this.cx + Math.sign(this.vx) * 10) / T), Math.floor(this.cy / T)) || Phys.solidTile(Math.floor(this.cx / T), Math.floor((this.y + this.h + 1) / T))); // erst nach dem Absprung vom eigenen Sims
        if (hitWall || this.tm > 80 || this.y > this.hy + 230) { this.st = 'rise'; this.tm = 0; W.dust(this.cx, this.y + this.h, 5); W.shake = Math.max(W.shake, 3); Audio8.sfx('stone', this.cx); }
        return;
      }
      // zurück auf den Sims: langsam, mit schwerem Flügelschlag – jetzt verwundbar
      const dx = this.hx - this.x, dy = this.hy - this.y, L = Math.hypot(dx, dy);
      if (L < 2 || this.tm > 600) { this.x = this.hx; this.y = this.hy; this.st = 'stone'; this.cool = 150; this.face = p.cx < this.cx ? -1 : 1; Audio8.sfx('stone', this.cx); W.dust(this.cx, this.y + this.h, 3); return; }
      const sp = 1.15; this.x += dx / L * sp; this.y += dy / L * sp + Math.sin(this.tm * 0.2) * 0.5; if (Math.abs(dx) > 1) this.face = dx < 0 ? -1 : 1; this.touch();
      if (this.tm % 16 === 0) Audio8.sfx('flap', this.cx);
    }
    hit(dmg, id) { // als Stein: Funken, kein Schaden
      if (this.st === 'stone') { if (id && this.lastHit === id) return false; this.lastHit = id; Audio8.sfx('tink', this.cx); W.sparks(this.cx, this.cy, 4); return false; }
      return super.hit(dmg, id);
    }
    kill(silent) { super.kill(silent); if (silent) return; for (let i = 0; i < 12; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-2, 2), rnd(-2.6, -0.4), i % 2 ? '#8c8890' : '#5c5466', 40, 2, 0.12)); }
    lightUp(L, cx, cy) { if (this.st !== 'stone') L.push({ x: this.cx + this.face * 9 - cx, y: this.y + 2 - cy, r: 18, c: [252, 60, 40], a: 0.45 }); }
    draw(ctx) {
      if (!S) return;
      const s = this.st === 'stone' ? S.stone : this.st === 'wake' ? S.wake : this.st === 'dive' ? S.dive : S.fly[(this.tm >> 3) & 1];
      const jit = this.st === 'wake' ? Math.round(Math.sin(this.tm * 1.7)) : 0;
      this.spr(ctx, s, this.face < 0, jit, 6, this.flashT > 0 && (this.flashT & 2));
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // Simskanten über einem Abgrund: fester Boden darunter, frei darüber, daneben mindestens fünf freie Reihen nach unten
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Stueck|Schrein|Altar/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]); // nur Feststehendes: bewegte Requisiten (Pendel) würden die Plätze bei jedem Besuch verschieben
    for (let r = 2; r < R.h - 6; r++) for (let c = 3; c < R.w - 3; c++) {
      if (!sol(c, r + 1) || sol(c, r) || sol(c, r - 1) || sol(c, r - 2)) continue;
      const drop = (cc) => { let n = 0; for (let k = r + 1; k < R.h && !sol(cc, k); k++) n++; return n; };
      if (Math.max(drop(c - 1), drop(c + 1)) < 5) continue;
      if (Math.abs(c - st.x) < 10 || avoid.some(([x, y]) => Math.abs(x - c) < 5 && Math.abs(y - r) < 5) || (R.door && Math.abs(R.door.x - c) < 7 && Math.abs(R.door.base - r) < 8)) continue; // nicht vor Türen und Tore
      out.push([c, r]);
    }
    return out;
  }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  function place(w) {
    const R = w.room;
    if (!THEMES.has(R.theme) || R.arena || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash((R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    if (rand() > 0.8) return;
    const L = spots(w); if (!L.length) return;
    const n = rand() < 0.45 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 16)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Gargoyle(c, r));
  }
  class Platz extends Ent { // setzt die Wasserspeier erst im ersten Bild: dann stehen auch die Türen des Schlosses schon im Raum
    constructor() { super(0, 0, 0, 0); this.kind = 'fx'; }
    update() { this.dead = true; place(W); }
    draw() { }
  }
  return { populate, spots, THEMES, Gargoyle, get ready() { return !!S; } };
})();
