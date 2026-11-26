// Höhlenspinne: hängt in Höhle, Gruft, Eishöhle, Wald, Spiegelsaal und Bibliothek an einem Faden unter der Decke. Kommt der Held darunter vorbei,
// seilt sie sich ab, pendelt und spuckt Netze – ein Treffer klebt: knapp zwei Sekunden halbes Tempo. Dann klettert sie wieder hinauf.
// Bilder: tools/blender/spinne_bl.py, pack_spinne.py
'use strict';
const Spinne = (() => {
  const MAP = {"spinne_hang":[0,0,56,48],"spinne_drop":[57,0,56,48],"spinne_spit":[114,0,56,48],"spinne_walk0":[171,0,56,48],"spinne_walk1":[228,0,56,48]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { hang: fr('spinne_hang'), drop: fr('spinne_drop'), spit: fr('spinne_spit') };
  };
  img.src = 'img/spinne3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['cave', 'crypt', 'ice', 'forest', 'mirror', 'library']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};

  class Klebt extends Ent { // Netz am Helden: halbes Tempo, schwächere Sprünge
    constructor() { super(0, 0, 1, 1); this.kind = 'fx'; this.life = 100; }
    update() {
      const p = W.player; if (!p || !p.alive || ++this.t > this.life) { this.dead = true; return; }
      p.x -= p.vx * 0.5; if (p.vy < 0) p.y -= p.vy * 0.3; // die Hälfte der Bewegung zurück: über bereits durchlaufenen Weg, also nie in eine Wand
      this.x = p.cx; this.y = p.cy;
    }
    draw(ctx) {
      const p = W.player, x = Math.round(p.cx - W.cam.x), y = Math.round(p.cy - W.cam.y), a = clamp((this.life - this.t) / 30, 0, 1) * 0.8;
      ctx.strokeStyle = `rgba(236,236,246,${a.toFixed(2)})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const t = i / 6 * 6.283 + this.t * 0.02; ctx.moveTo(x + Math.cos(t) * 3, y + Math.sin(t) * 5); ctx.lineTo(x + Math.cos(t) * 9, y + Math.sin(t) * 14); }
      ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, 6, 10, 0, 0, 6.283); ctx.stroke();
    }
  }
  class Netz extends Ent { // gespucktes Netz: fliegt auf den Helden zu, klebt beim Treffer
    constructor(x, y, vx, vy) { super(x - 4, y - 4, 8, 8); this.kind = 'eproj'; this.vx = vx; this.vy = vy; this.dmg = 1; }
    update() {
      this.t++; this.x += this.vx; this.y += this.vy; const p = W.player;
      if (p.alive && Phys.overlap(this, p)) { this.dead = true; if (!(p.inv > 0)) { if (!W.ents.some(e => e instanceof Klebt && !e.dead)) W.spawn(new Klebt()); Audio8.sfx('slime', this.cx); if (!F().spinne_tip && Castle.setFlag) { Castle.setFlag('spinne_tip'); Game.note('spinneNote'); } } return; }
      if (this.t > 120 || Phys.solidTile(Math.floor(this.cx / T), Math.floor(this.cy / T))) { this.dead = true; W.sparks(this.cx, this.cy, 3); }
    }
    draw(ctx) { const x = Math.round(this.cx - W.cam.x), y = Math.round(this.cy - W.cam.y); ctx.fillStyle = 'rgba(236,236,246,0.85)'; ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x, y - 3, 1, 7); ctx.fillRect(x - 2, y - 2, 1, 1); ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 2, y - 2, 1, 1); ctx.fillRect(x - 2, y + 2, 1, 1); }
  }
  class Hoehlenspinne extends Enemy {
    constructor(c, r, floorY) {
      const ax = c * T + T / 2, ay = (r + 1) * T;
      super(ax - 7, ay + 4, 14, 14, 6, 2, 400); this.ax = ax; this.ay = ay; this.len = 10; this.max = Math.max(24, floorY - ay - 26); this.st = 'hang'; this.tm = 0; this.cool = 30; this.seen = true; this.sway = 0;
    }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.ax;
      if (this.st === 'hang') { this.len += (10 - this.len) * 0.1; if (this.cool > 0) this.cool--; else if (p.alive && Math.abs(dx) < 70 && p.cy > this.ay + 20 && p.cy - this.ay < this.max + 60) { this.st = 'drop'; this.tm = 0; this.goal = clamp(p.y - this.ay - 6, 24, this.max); Audio8.sfx('rise', this.ax); } }
      else if (this.st === 'drop') { this.len = Math.min(this.goal, this.len + 4.5); if (this.len >= this.goal) { this.st = 'dangle'; this.tm = 0; } }
      else if (this.st === 'dangle' || this.st === 'spit') {
        this.sway = Math.sin(this.tm * 0.05) * 7;
        if (this.st === 'dangle' && this.tm % 80 === 50 && p.alive) { this.st = 'spit'; this.spitT = 0; }
        if (this.st === 'spit' && ++this.spitT === 14) { const ex = p.cx - this.cx, ey = p.cy - this.cy, L = Math.hypot(ex, ey) || 1; W.spawn(new Netz(this.cx, this.cy + 6, ex / L * 2.4, ey / L * 2.4)); Audio8.sfx('throw', this.cx); }
        if (this.st === 'spit' && this.spitT > 24) this.st = 'dangle';
        if (this.tm > 300 || Math.abs(dx) > 190) { this.st = 'climb'; this.tm = 0; }
      } else { this.sway *= 0.92; this.len -= 1.6; if (this.len <= 10) { this.len = 10; this.st = 'hang'; this.cool = 110; } }
      this.x = this.ax + this.sway - this.w / 2; this.y = this.ay + this.len - this.h / 2;
      this.touch();
    }
    draw(ctx) {
      const tx = Math.round(this.ax - W.cam.x), ty = Math.round(this.ay - W.cam.y), bx = Math.round(this.cx - W.cam.x), by = Math.round(this.cy - W.cam.y) - 8;
      ctx.strokeStyle = 'rgba(220,220,236,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx + 0.5, ty); ctx.lineTo(bx + 0.5, by); ctx.stroke();
      if (!S) return;
      const s = this.st === 'spit' ? S.spit : this.st === 'hang' || this.st === 'climb' ? S.hang : S.drop;
      this.spr(ctx, s, false, 0, 15, this.flashT > 0 && (this.flashT & 2));
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // Deckenstellen über einem Gang: Fels darüber, fünf freie Kacheln darunter, dann Boden, auf dem der Held läuft
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar|Gargoyle|Schildwache/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 0; r < R.h - 8; r++) for (let c = 3; c < R.w - 3; c++) {
      if (!sol(c, r)) continue; let free = 0; while (r + 1 + free < R.h && !sol(c, r + 1 + free)) free++;
      if (free < 6 || free > 13 || r + 1 + free >= R.h) continue;
      if (Math.abs(c - st.x) < 8 || avoid.some(([x, y]) => Math.abs(x - c) < 5)) continue;
      out.push([c, r, (r + 1 + free) * T]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.safe || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('spinne:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx)); if (rand() > 0.6) return;
    const L = spots(w); if (!L.length) return;
    const n = rand() < 0.4 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 14)) got.push(s); }
    for (const [c, r, fy] of got) w.spawn(new Hoehlenspinne(c, r, fy));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Hoehlenspinne, Netz, Klebt, get ready() { return !!S; } };
})();
