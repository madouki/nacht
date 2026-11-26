// Schildwache: gepanzerte Wache mit Turmschild und Lanze in Thronsaal, Galerie, Ballsaal, Halle, Kathedrale, Hotel, Theater und Bibliothek.
// Der Schild fängt jeden Treffer von vorn ab. Die Wache rückt langsam vor, zieht die Lanze zurück (die Spitze blitzt) und stößt zu – danach
// hängt der Schild kurz herab. Verwundbar: von hinten, von oben auf den Helm und nach dem Stoß. Bilder: tools/blender/schild_bl.py, pack_wache.py
'use strict';
const Wache = (() => {
  const MAP = {"schild_walk0":[0,0,80,60],"schild_walk1":[81,0,80,60],"schild_wind":[162,0,80,60],"schild_thrust":[243,0,80,60],"schild_recover":[324,0,80,60]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { walk: [fr('schild_walk0'), fr('schild_walk1')], wind: fr('schild_wind'), thrust: fr('schild_thrust'), recover: fr('schild_recover') };
  };
  img.src = 'img/wache3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['throne', 'gallery', 'ballroom', 'hall', 'cathedral', 'hotel', 'theater', 'library']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};

  class Schildwache extends Enemy {
    constructor(c, r) { super(c * T, (r + 1) * T - 36, 16, 36, 14, 3, 900); this.st = 'walk'; this.tm = 0; this.vx = 0; this.vy = 0; this.face = -1; this.step = 0; this.seen = true; }
    behind() { const p = W.player; return Math.sign(p.cx - this.cx) === -this.face; }
    above() { const p = W.player; return p.feet < this.y + 8; }
    hurtBoxes() { // verwundbar von hinten, von oben und während er sich vom Stoß erholt
      const body = { x: this.x, y: this.y, w: this.w, h: this.h };
      if (this.st === 'recover' || this.behind()) return [body];
      if (this.above()) return [{ x: this.x, y: this.y, w: this.w, h: 10 }];
      return [];
    }
    armorBoxes() { return this.st === 'recover' ? [] : [{ x: this.face > 0 ? this.cx + 4 : this.cx - 16, y: this.y + 2, w: 12, h: 32 }]; }
    deflect(id, b) {
      if (this.lastDef === id) return; this.lastDef = id;
      Audio8.sfx('tink', this.cx); W.sparks(b.x + b.w / 2, b.y + 12, 6); this.flashT = 3;
      if (!F().wache_tip && Castle.setFlag) { Castle.setFlag('wache_tip'); Game.note('wacheNote'); }
    }
    lance() { return { x: this.face > 0 ? this.cx + 6 : this.cx - 50, y: this.y + 12, w: 44, h: 6 }; }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.cx, near = Math.abs(dx) < 230 && Math.abs(p.feet - this.y - this.h) < 48;
      if (this.st === 'walk') {
        if (near && Math.abs(dx) > 10) this.face = dx > 0 ? 1 : -1;
        const want = near && Math.abs(dx) > 50 ? this.face * 0.38 : 0;
        this.vx = want && this.groundAhead(this.face) ? want : 0; if (this.vx) this.step++;
        if (near && Math.abs(dx) < 64 && this.tm > 50 && Math.sign(dx) === this.face) { this.st = 'wind'; this.tm = 0; this.vx = 0; Audio8.sfx('tell', this.cx); }
      } else if (this.st === 'wind') {
        this.vx = 0; if (this.tm > 32) { this.st = 'thrust'; this.tm = 0; Audio8.sfx('whoosh', this.cx); }
      } else if (this.st === 'thrust') {
        this.vx = this.groundAhead(this.face) ? this.face * 2.8 : 0;
        if (p.alive && Phys.overlap(this.lance(), p)) p.hurt(this.dmg + 1, this.cx);
        if (this.tm > 12) { this.st = 'recover'; this.tm = 0; this.vx = 0; W.dust(this.cx + this.face * 8, this.y + this.h, 3); Audio8.sfx('clank', this.cx); }
      } else if (this.tm > 52) { this.st = 'walk'; this.tm = 0; }
      this.physics(); this.touch();
    }
    lightUp(L, cx, cy) { if (this.st === 'wind') L.push({ x: this.cx + this.face * 22 - cx, y: this.y + 14 - cy, r: 20, c: [252, 248, 220], a: 0.5 }); }
    draw(ctx) {
      if (!S) return;
      const s = this.st === 'wind' ? S.wind : this.st === 'thrust' ? S.thrust : this.st === 'recover' ? S.recover : S.walk[(this.step >> 4) & 1];
      this.spr(ctx, s, this.face < 0, this.face * 8, 2, this.flashT > 0 && (this.flashT & 2));
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // ebene Böden: elf Kacheln breit, drei Kacheln Luft darüber, fern von Start und Türen
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar|Gargoyle/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 3; r < R.h - 1; r++) for (let c = 8; c < R.w - 8; c++) {
      let ok = true; for (let k = -5; k <= 5 && ok; k++) ok = sol(c + k, r + 1) && !sol(c + k, r) && !sol(c + k, r - 1) && !sol(c + k, r - 2);
      if (!ok || Math.abs(c - st.x) < 12 || avoid.some(([x, y]) => Math.abs(x - c) < 7 && Math.abs(y - r) < 4) || (R.door && Math.abs(R.door.x - c) < 8 && Math.abs(R.door.base - r) < 4)) continue;
      out.push([c, r]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.safe || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('wache:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx)); if (rand() > 0.55) return;
    const L = spots(w); if (!L.length) return;
    const [c, r] = L[Math.floor(rand() * L.length)]; w.spawn(new Schildwache(c, r));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Schildwache, get ready() { return !!S; } };
})();
