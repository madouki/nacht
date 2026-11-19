// Drastische Pixel-Tode (Optionen → BLUT UND BROCKEN): Gegner zerplatzen je nach Material in Blut, Knochen, Blech, Öl, Papier, Schleim,
// Pflanzenfasern, Käse oder Eis. Brocken springen über den Boden und bleiben kurz liegen, Blut und Öl hinterlassen Flecken bis zum Raumwechsel.
'use strict';
const Drastik = (() => {
  const MAT = { Ghoul: 'blood', Bat: 'blood', Panther: 'blood', Fishman: 'blood', SeaEagle: 'blood', Raven: 'blood', Snake: 'blood', Skeleton: 'bone', IceSkeleton: 'bone', Skull: 'bone', Pillar: 'bone',
    Knight: 'steel', Automat: 'oil', Mannequin: 'wood', Puppet: 'wood', Astrolab: 'oil', FlyBook: 'paper', Tome: 'paper', Ordner: 'paper', Brief: 'paper', Nachnahme: 'paper', Flieger: 'paper',
    Ghost: 'ecto', Jelly: 'ecto', Sternschnuppe: 'ecto', Snapper: 'plant', Pitcher: 'plant', Cocoon: 'plant', Mondkalb: 'cheese', IceBoulder: 'ice',
    GiantBat: 'blood', Count: 'blood', Medusa: 'blood', Awakened: 'blood', GiantSkeleton: 'bone', SunWarden: 'steel', Amtsschimmel: 'paper', Schreibtisch: 'paper', Frankiermaschine: 'oil', Reisswolf: 'oil', Kuckucksuhr: 'oil', Conductor: 'oil', GolemBoss: 'stone', MannImMond: 'cheese', Sternbild: 'ecto', Doppel: 'ecto', TentacleBoss: 'ecto', ManTrap: 'plant', IceWitch: 'ice' };
  const PAL = { blood: ['#a80820', '#d81830', '#700410', '#e84848'], bone: ['#e8e0c8', '#c8bca0', '#8c8068', '#f8f4e4'], steel: ['#8c8ca0', '#c8c8d8', '#54546c', '#a80820'], oil: ['#181420', '#3c3848', '#c89020', '#6c6878'],
    wood: ['#a07848', '#c8a070', '#6c4c2c', '#e8d0a8'], paper: ['#f0e8d0', '#c8bca0', '#8c3040', '#fcfcf0'], ecto: ['#8cf0d8', '#c8fcec', '#3c9c8c', '#b080fc'], plant: ['#3c8c44', '#74c464', '#a8d848', '#1c5c34'],
    cheese: ['#f8d048', '#fce890', '#a8801c', '#fcf4c0'], ice: ['#a8e8fc', '#e8fcff', '#4c9cd8', '#fcfcfc'], stone: ['#6c6258', '#8c8074', '#48403a', '#f8a838'] };
  const STAIN = { blood: '#6c0614', oil: '#14101c', ecto: '#2c7c70', plant: '#2c5c30', cheese: '#a8801c' };
  let stains = [];
  const matOf = (e) => MAT[e.constructor.name] || 'blood', pick = (a) => a[Math.floor(Math.random() * a.length)];
  function stain(x, y, col) { stains.push({ x: Math.round(x), y: Math.round(y), w: 3 + Math.floor(Math.random() * 8), c: col }); if (stains.length > 70) stains.shift(); }

  class Brocken extends Ent {
    constructor(x, y, vx, vy, col, size, mark) { super(x, y, size, size); this.kind = 'fx'; this.vx = vx; this.vy = vy; this.col = col; this.mark = mark; this.rest = false; this.life = 170 + Math.random() * 90; this.bounce = size > 2 ? 2 : 0; }
    update() {
      if (++this.t > this.life) { this.dead = true; return; }
      if (this.rest) return;
      this.vy = Math.min(this.vy + 0.2, 5); const nx = this.x + this.vx, ny = this.y + this.vy;
      if (Phys.solidTile(Math.floor((nx + this.w / 2) / T), Math.floor((this.y + this.h / 2) / T))) this.vx *= -0.4; else this.x = nx;
      const row = Math.floor((ny + this.h) / T);
      if (this.vy > 0 && Phys.solidTile(Math.floor((this.x + this.w / 2) / T), row)) {
        this.y = row * T - this.h; if (this.mark) { stain(this.x, row * T, this.mark); this.mark = null; }
        if (this.bounce-- > 0 && this.vy > 1) { this.vy *= -0.42; this.vx *= 0.6; } else { this.rest = true; this.vx = this.vy = 0; }
      } else this.y = ny;
      if (this.y > W.room.h * T + 8) this.dead = true;
    }
    draw(ctx) { if (this.life - this.t < 30 && (this.t & 2)) return; ctx.fillStyle = this.col; ctx.fillRect(Math.round(this.x - W.cam.x), Math.round(this.y - W.cam.y), this.w, this.h); }
  }
  class Fontaene extends Ent { // der Rest spritzt noch ein paar Bilder lang nach oben
    constructor(x, y, cols, mark) { super(x, y, 1, 1); this.kind = 'fx'; this.cols = cols; this.mark = mark; }
    update() { if (++this.t > 22) { this.dead = true; return; } if (this.t % 2 === 0) W.spawn(new Brocken(this.x + rnd(-2, 2), this.y, rnd(-0.9, 0.9), rnd(-4.4, -2.4), pick(this.cols), 2, this.t % 6 === 0 ? this.mark : null)); }
    draw() { }
  }
  class Flecken extends Ent {
    constructor() { super(0, 0, 1, 1); this.kind = 'prop'; this.noWrap = true; }
    update() { }
    draw(ctx) { ctx.globalAlpha = 0.85; for (const s of stains) { const x = s.x - Math.round(W.cam.x); if (x < -12 || x > View.w + 12) continue; ctx.fillStyle = s.c; ctx.fillRect(x - (s.w >> 1), s.y - Math.round(W.cam.y) - 1, s.w, 2); ctx.fillRect(x - (s.w >> 2), s.y - Math.round(W.cam.y) - 2, s.w >> 1, 1); } ctx.globalAlpha = 1; }
  }
  const room = () => Options.gore && W.ents.length < 620;
  function spray(x, y, n, mat, pow, dir) {
    const c = PAL[mat] || PAL.blood, mark = STAIN[mat];
    for (let i = 0; i < n; i++) { const big = i % 3 === 0; W.spawn(new Brocken(x + rnd(-5, 5), y + rnd(-7, 7), rnd(-1.7, 1.7) * pow + (dir || 0) * rnd(0.3, 1.5), rnd(-4, -0.8) * pow, pick(c), big ? 3 + Math.floor(Math.random() * 2) : 2, i % 2 ? mark : null)); }
  }
  function burst(e) { // Gegner stirbt
    if (!room()) return;
    const mat = matOf(e), n = Math.round(Math.min(24, 10 + e.h / 2) * (View.lite ? 0.5 : 1)), d = Math.sign(e.cx - W.player.cx) || 0;
    spray(e.cx, e.cy, n, mat, 1, d);
    if (mat === 'blood' || mat === 'oil' || mat === 'ecto') W.spawn(new Fontaene(e.cx, e.y + 4, PAL[mat], STAIN[mat]));
  }
  function hit(e) { if (room()) spray(e.cx, e.cy, View.lite ? 2 : 4, matOf(e), 0.6, Math.sign(e.cx - W.player.cx) || 0); } // Treffer, der noch nicht tötet
  function boss(b) { if (room()) spray(b.cx + rnd(-b.w / 2, b.w / 2), b.cy + rnd(-b.h / 2, b.h / 2), View.lite ? 6 : 12, matOf(b), 1.3, 0); }
  function hero(p) { if (room()) { spray(p.cx, p.cy, 22, 'blood', 1.2, 0); W.spawn(new Fontaene(p.cx, p.y + 6, PAL.blood, STAIN.blood)); } }
  function populate(w) { stains = []; w.spawn(new Flecken()); }
  return { burst, hit, boss, hero, populate, MAT, get stains() { return stains; } };
})();
