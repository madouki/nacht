// Walzerpaar: zwei Ballgeister im Ballsaal, Thronsaal, Foyer und Theater. Sie drehen sich im Dreivierteltakt über den Boden, zwei Takte
// lang auf den Helden zu (auf der Eins ein großer Schritt), dann verbeugen sie sich – und ein Fächer aus Noten fliegt im Bogen
// heraus. Danach geht es weiter im Takt. Er tritt ihr dabei gelegentlich auf den Fuß.
// Bilder: tools/blender/walzer_bl.py, pack_walzer.py
'use strict';
const Walzer = (() => {
  const MAP = {"walzer_s0":[0,0,40,44],"walzer_s60":[41,0,40,44],"walzer_s120":[82,0,40,44],"walzer_bow":[123,0,40,44]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { spin: [fr('walzer_s0'), fr('walzer_s60'), fr('walzer_s120')], bow: fr('walzer_bow') };
  };
  img.src = 'img/walzer3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['ballroom', 'throne', 'foyer', 'theater']);
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const BEAT = 22, BARS = 2, BOW = 48, NOTES = 5; // Bilder je Schlag, Takte bis zur Verbeugung, Verbeugung, Noten im Fächer

  class Note extends Ent { // Note im Bogen: steigt, fällt, verlischt an Wand oder Boden
    constructor(x, y, vx, vy, dmg) { super(x - 3, y - 4, 6, 8); this.kind = 'fx'; this.vx = vx; this.vy = vy; this.dmg = dmg; this.life = 170; this.k = Math.floor(Math.random() * 2); }
    update() {
      this.t++; this.vy = Math.min(2.2, this.vy + 0.035); this.x += this.vx; this.y += this.vy; const p = W.player;
      if (p.alive && Phys.overlap(this, p)) { p.hurt(this.dmg, this.cx); this.pop(); return; }
      if (--this.life <= 0 || Phys.solidTile(Math.floor(this.cx / T), Math.floor(this.cy / T)) || this.y > W.room.h * T) this.pop();
    }
    pop() { this.dead = true; for (let i = 0; i < 5; i++) W.spawn(new Particle(this.cx, this.cy, rnd(-1, 1), rnd(-1.2, 0.2), i % 2 ? '#b8ecff' : '#ffffff', 16, 1, 0.05)); }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 12, c: [150, 220, 255], a: 0.3 }); }
    draw(ctx) { // Achtelnote (♪) oder zwei verbundene Sechzehntel, in Pixeln
      const x = Math.round(this.x - W.cam.x), y = Math.round(this.y - W.cam.y), c1 = (this.t >> 3) & 1 ? '#ffffff' : '#b8ecff';
      ctx.fillStyle = '#1c2c48'; ctx.fillRect(x - 1, y + 4, 5, 4); ctx.fillRect(x + 2, y - 1, 3, 7);
      ctx.fillStyle = c1; ctx.fillRect(x, y + 5, 3, 2); ctx.fillRect(x + 3, y, 1, 6); ctx.fillRect(x + 4, y, 1, 1); ctx.fillRect(x + 5, y + 1, 1, 2);
      if (this.k) { ctx.fillRect(x + 4, y + 2, 2, 1); }
    }
  }
  class Walzerpaar extends Enemy {
    constructor(x, floorY) { super(x - 11, floorY - 38, 22, 38, 14, 2, 700); this.st = 'idle'; this.tm = 0; this.face = -1; this.vx = 0; this.vy = 0; this.rot = 0; this.hx = x; this.cd = 20 + Math.floor(Math.random() * 30); }
    update() {
      super.update(); this.tm++; const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy, near = p.alive && Math.abs(dx) < 170 && Math.abs(dy) < 80;
      if (this.st === 'idle') { // drehen sich gemächlich auf der Stelle
        this.vx = 0; this.physics(); this.rot += 0.05;
        if (near && --this.cd <= 0) { this.st = 'waltz'; this.tm = 0; this.face = dx > 0 ? 1 : -1; }
      } else if (this.st === 'waltz') {
        const beat = Math.floor(this.tm / BEAT), inBeat = this.tm % BEAT;
        if (inBeat === 0 && beat % 3 === 0) this.face = Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : this.face; // zu jedem Takt neu ausrichten
        const sp = (beat % 3 === 0 ? 1.25 : 0.6) * Math.sin(Math.PI * inBeat / BEAT); // auf der Eins ein großer Schritt
        this.vx = this.groundAhead(this.face) ? this.face * sp : 0; if (this.physics()) { this.face = -this.face; this.vx = 0; }
        this.rot += 6 / (BEAT * 3); // eine volle Drehung je Takt
        if (beat >= BARS * 3) {
          this.st = 'bow'; this.tm = 0; this.vx = 0; this.face = dx > 0 ? 1 : -1;
          if (Math.random() < 0.35) W.spawn(new Popup(this.cx + this.face * 6, this.y - 6, tr('walzerOuch'), '#e8e0ff'));
        }
      } else if (this.st === 'bow') {
        this.vx = 0; this.physics();
        if (this.tm === 16) { // Notenfächer, nach oben und zum Helden geneigt
          for (let i = 0; i < NOTES; i++) { const a = -Math.PI / 2 + (i - (NOTES - 1) / 2) * 0.42 + this.face * 0.18; W.spawn(new Note(this.cx, this.y + 8, Math.cos(a) * 1.7, Math.sin(a) * 1.7 - 0.3, 1)); }
          Audio8.sfx('cast', this.cx);
          if (!F().walzer_tip && Castle.setFlag) { Castle.setFlag('walzer_tip'); Game.note('walzerNote'); }
        }
        if (this.tm >= BOW) { this.st = near ? 'waltz' : 'idle'; this.tm = 0; this.cd = 30; }
      }
      this.touch();
    }
    kill(silent) {
      super.kill(silent); if (silent) return;
      for (let i = 0; i < 18; i++) W.spawn(new Particle(this.cx + rnd(-8, 8), this.cy + rnd(-14, 14), rnd(-1.4, 1.4), rnd(-2.2, -0.2), i % 3 ? '#9c84d8' : i % 2 ? '#4c64a8' : '#e8e0ff', 46, 2, -0.02));
      Audio8.sfx('cast', this.cx);
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 30, c: [170, 160, 255], a: this.st === 'bow' ? 0.22 : 0.12 }); }
    draw(ctx) {
      if (!S) return; const fl = this.flashT > 0 && (this.flashT & 2);
      let s, flip;
      if (this.st === 'bow') { s = S.bow; flip = this.face < 0; }
      else { const k = ((Math.floor(this.rot) % 6) + 6) % 6; s = S.spin[k % 3]; flip = k >= 3; }
      ctx.save(); ctx.globalAlpha = 0.92; this.spr(ctx, s, flip, 0, 2, fl); ctx.restore();
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // Tanzfläche: fünf Kacheln fester Boden, darüber drei Kacheln frei, fern von Start, Türen und Figuren
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar|Lift|Pater/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 3; r < R.h - 1; r++) for (let c = 6; c < R.w - 6; c++) {
      let ok = true; for (let i = -2; i <= 2 && ok; i++) ok = sol(c + i, r + 1) && !sol(c + i, r) && !sol(c + i, r - 1) && !sol(c + i, r - 2);
      if (!ok || Math.abs(c - st.x) < 12) continue;
      if (avoid.some(([x, y]) => Math.abs(x - c) < 5 && Math.abs(y - r) < 4)) continue;
      out.push([c, r]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.safe || R.mini || R.hall || R.wrap) return;
    const rand = rng(hash('walzer:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    const L = spots(w); if (!L.length) return;
    const n = R.w >= 110 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 24)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Walzerpaar(c * T + T / 2, (r + 1) * T));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Walzerpaar, Note, BEAT, BARS, get ready() { return !!S; } };
})();
