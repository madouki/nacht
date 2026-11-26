// Hüpfsarg: aufrechter Sarg in Gruft, Thronsaal und Hotel. Er steht still wie Dekoration; kommt der Held näher, hüpft er ihm in drei Sprüngen
// nach (jeder Aufprall staubt und rumst). Dann geht der Deckel einen Spalt auf, zwei Augen glühen (Vorwarnung), und er springt auf: drin
// sitzt der mürrische Vormieter mit Schlafmütze, schimpft und scheucht zwei Fledermäuse hinaus. Nur offen nimmt der Sarg vollen
// Schaden – mit Deckel zu prallt fast alles ab. Bilder: tools/blender/sarg_bl.py, pack_sarg.py
'use strict';
const Sarg = (() => {
  const MAP = {"sarg_rest":[0,0,32,40],"sarg_peek":[33,0,32,40],"sarg_open":[66,0,32,40]};
  const img = new Image(); let S = null;
  img.onload = () => {
    const fr = (n) => { const r = MAP[n], c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return Sprites.fromCanvas(c, true); };
    S = { rest: fr('sarg_rest'), peek: fr('sarg_peek'), open: fr('sarg_open') };
  };
  img.src = 'img/sarg3d.png?v=' + (window.BUILD || '');
  const THEMES = new Set(['crypt', 'throne', 'hotel']); // Zimmer 13 hat einen Dauergast
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};
  const HOPS = 3, PEEK = 30, OPEN = 90, SHUT = 0.25; // Sprünge je Runde, Vorwarnung, offen (Bilder), Schadensanteil bei zu

  class Huepfsarg extends Enemy {
    constructor(x, floorY) { super(x - 8, floorY - 36, 16, 36, 12, 2, 600); this.st = 'rest'; this.tm = 0; this.face = -1; this.vx = 0; this.vy = 0; this.hops = 0; this.cd = 30 + Math.floor(Math.random() * 30); this.squash = 0; this.hx = x; this.bats = []; this.air = false; }
    hit(dmg, id) { // Deckel zu: fast alles prallt ab
      if (this.st === 'open') return super.hit(dmg, id);
      if (id && this.lastHit === id) return false;
      if (!F().sarg_tip && Castle.setFlag) { Castle.setFlag('sarg_tip'); Game.note('sargNote'); }
      Audio8.sfx('tink', this.cx); return super.hit(dmg * SHUT, id);
    }
    update() {
      super.update(); this.tm++; if (this.squash > 0) this.squash--;
      const p = W.player, dx = p.cx - this.cx, dy = p.cy - this.cy, near = p.alive && Math.abs(dx) < 140 && Math.abs(dy) < 60;
      if (this.st === 'rest') {
        this.vx = 0; this.physics();
        if (near && this.onGround && --this.cd <= 0) { this.st = 'hop'; this.tm = 0; this.hops = 0; this.face = dx > 0 ? 1 : -1; }
      } else if (this.st === 'hop') {
        if (this.onGround && !this.air && this.tm > 8) { // abspringen
          this.face = dx > 0 ? 1 : dx < 0 ? -1 : this.face; this.vy = -3.0; this.vx = this.face * clamp(Math.abs(dx) / 40, 0.6, 1.4); this.onGround = false; this.air = true; this.squash = 0;
        }
        if (this.physics()) this.vx = 0;
        if (this.air && this.onGround) { // Aufprall
          this.air = false; this.vx = 0; this.tm = 0; this.squash = 8; this.hops++; W.dust(this.cx, this.y + this.h, 1); Audio8.sfx('wall', this.cx); W.shake = Math.max(W.shake, 1);
          if (this.hops >= HOPS) { this.st = 'peek'; this.tm = 0; Audio8.sfx('charge', this.cx); }
        }
      } else if (this.st === 'peek') { // Deckel einen Spalt auf, Augen glühen
        this.vx = 0; this.physics();
        if (this.tm >= PEEK) {
          this.st = 'open'; this.tm = 0; Audio8.sfx('crack', this.cx);
          W.spawn(new Popup(this.cx, this.y - 6, tr('sargGrumble'), '#e8e0c8'));
          if (!F().sarg_tip && Castle.setFlag) { Castle.setFlag('sarg_tip'); Game.note('sargNote'); }
        }
      } else if (this.st === 'open') {
        this.vx = 0; this.physics();
        if (this.tm === 12 || this.tm === 26) { // scheucht Fledermäuse hinaus (höchstens zwei unterwegs)
          this.bats = this.bats.filter(b => !b.dead);
          if (this.bats.length < 2) { const b = new Bat(0, 0); b.x = this.cx - b.w / 2; b.y = this.y + 8; b.state = 'fly'; b.dir = this.face; b.face = this.face; b.baseY = b.y; b.t = 0; W.spawn(b); this.bats.push(b); Audio8.sfx('bat', this.cx); }
        }
        if (this.tm >= OPEN) { this.st = 'rest'; this.tm = 0; this.cd = 70 + Math.floor(Math.random() * 50); Audio8.sfx('wall', this.cx); }
      }
      this.touch();
    }
    kill(silent) {
      super.kill(silent); if (silent) return;
      for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx + rnd(-6, 6), this.cy + rnd(-12, 12), rnd(-2, 2), rnd(-2.8, -0.4), i % 3 ? '#56301c' : i % 2 ? '#e8e0c8' : '#d8a838', 50, 2, 0.14));
      Audio8.sfx('crack', this.cx);
    }
    lightUp(L, cx, cy) {
      if (this.st === 'peek') L.push({ x: this.cx + (this.face < 0 ? -6.6 : 6.6) - cx, y: this.y + 7.5 - cy, r: 14, c: [255, 220, 120], a: 0.35 + 0.15 * ((this.tm >> 2) & 1) });
      else if (this.st === 'open') L.push({ x: this.cx - cx, y: this.y + 10 - cy, r: 18, c: [255, 120, 90], a: 0.1 });
    }
    draw(ctx) {
      if (!S) return;
      const s = this.st === 'open' ? S.open : this.st === 'peek' ? S.peek : S.rest, fl = this.flashT > 0 && (this.flashT & 2);
      const flip = this.st === 'rest' || this.st === 'hop' ? false : this.face < 0;
      let k = 0; if (this.squash > 0) k = Math.sin(this.squash / 8 * Math.PI) * 0.12; else if (this.st === 'hop' && !this.onGround) k = -0.06;
      const tilt = this.st === 'hop' && !this.onGround ? this.face * 0.12 : this.st === 'peek' ? Math.sin(this.tm * 1.3) * 0.03 : 0;
      if (!k && !tilt) { this.spr(ctx, s, flip, 0, 1, fl); return; }
      const fx = Math.round(this.cx - W.cam.x), fy = Math.round(this.y + this.h + 1 - W.cam.y); // Fußpunkt
      this.lastDraw = { s, x: fx - s.w / 2 + W.cam.x, y: fy - s.h + W.cam.y, flip, f: W.frame };
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(tilt); ctx.scale(1 + k, 1 - k); Sprites.draw(ctx, s, -Math.round(s.w / 2), -s.h, flip, fl); ctx.restore();
    }
  }

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function spots(w) { // Bodenplätze: drei Kacheln fester Boden, darüber drei Kacheln frei, fern von Start, Türen und Figuren
    const R = w.room, out = [], sol = (c, r) => Phys.solidTile(c, r), st = R.start || { x: 2, y: R.h - 3 };
    const avoid = w.ents.filter(e => /Door|Loot|NPC|Huhn|Gong|Ansager|Chamber|Bolt|Latch|Schrein|Altar|Lift|Pater/.test(e.constructor.name)).map(e => [e.cx / T, e.cy / T]);
    for (let r = 3; r < R.h - 1; r++) for (let c = 6; c < R.w - 6; c++) {
      let ok = true; for (let i = -1; i <= 1 && ok; i++) ok = sol(c + i, r + 1) && !sol(c + i, r) && !sol(c + i, r - 1) && !sol(c + i, r - 2);
      if (!ok || Math.abs(c - st.x) < 12) continue;
      if (avoid.some(([x, y]) => Math.abs(x - c) < 5 && Math.abs(y - r) < 4)) continue;
      out.push([c, r]);
    }
    return out;
  }
  function place(w) {
    const R = w.room; if (!THEMES.has(R.theme) || R.arena || R.safe || R.mini || R.hall || R.wrap || R.side === 'kantine') return; // in der Kantine wird gegessen, nicht gehüpft
    const rand = rng(hash('sarg:' + (R.side || '') + ':' + w.stage + ':' + w.roomIdx));
    const L = spots(w); if (!L.length) return;
    const n = R.w >= 100 ? 2 : 1, got = [];
    for (let k = 0; k < 40 && got.length < n; k++) { const s = L[Math.floor(rand() * L.length)]; if (!got.some(g => Math.abs(g[0] - s[0]) < 20)) got.push(s); }
    for (const [c, r] of got) w.spawn(new Huepfsarg(c * T + T / 2, (r + 1) * T));
  }
  class Platz extends Ent { constructor() { super(0, 0, 0, 0); this.kind = 'fx'; } update() { this.dead = true; place(W); } draw() { } }
  function populate(w) { if (typeof Castle !== 'undefined' && Castle.on && THEMES.has(w.room.theme)) w.spawn(new Platz()); }
  return { populate, spots, THEMES, Huepfsarg, PEEK, OPEN, SHUT, get ready() { return !!S; } };
})();
