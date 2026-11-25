// Die Knochenkapelle: drei Calaca-Mariachis (Guitarrón, Trompete, Geige), die durchs Schloss ziehen – alle vier Spielminuten
// stehen sie woanders (Hotel-Galerie, Bahnsteig, Kantine, Lichterpassage, Gruftgang). Wer näher kommt, hört ihren Son (Lied
// 'mariachi', 6/8 mit Sesquialtera); wer fünf Sekunden zuhört, bekommt ein Ständchen: Angriff +2, Glück +2 für drei Minuten
// (Castle.serenade, neben der Mahlzeit im HUD). Bilder: tools/blender/kapelle_bl.py → pack_kapelle.py (je 32×48, Füße unten)
'use strict';
const KAPELLE3D = (() => {
  const MAP = {"guit0":[0,0,32,48],"guit1":[33,0,32,48],"trump0":[66,0,32,48],"trump1":[99,0,32,48],"viol0":[132,0,32,48],"viol1":[165,0,32,48]};
  const C = {}, img = new Image();
  img.onload = () => { for (const [n, r] of Object.entries(MAP)) { const c = Sprites.canvas(r[2], r[3]); c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); C[n] = c; } };
  img.src = 'img/kapelle3d.png?v=' + (window.BUILD || '');
  return { MAP, get ready() { return !!C.guit0; }, get(n) { return C[n]; } };
})();
const Kapelle = (() => {
  const VENUES = [['hotel', 45, 10], ['bahnhof', 96, 17], ['kantine', 29, 17], ['passage', 16, 17], ['gruftgang', 75, 10]];
  const PERIOD = 60 * 60 * 4, LISTEN = 300;
  const venue = () => VENUES[Math.floor(((typeof Castle !== 'undefined' && Castle.rpg && Castle.rpg.frames) || 0) / PERIOD) % VENUES.length];
  const here = (v) => { const f = Castle.side && Castle.side[v[0]]; return !!f && W.stage === f.s && W.roomIdx === f.r; };
  function enter() { // nach jedem Raumaufbau: steht die Kapelle hier? Sonst ihr Lied ausklingen lassen
    if (typeof Castle === 'undefined' || !Castle.on) return;
    const v = venue();
    if (here(v)) { if (!W.ents.some(e => e instanceof Band)) W.spawn(new Band(v[1], v[2])); }
    else if (Audio8.current === 'mariachi') Audio8.play(W.songName(), null, 0.6);
  }
  class Band extends Ent {
    constructor(tx, row) { super(tx * T - 40, (row + 1) * T - 48, 80, 48); this.kind = 'prop'; this.playing = false; this.listen = 0; this.done = false; }
    update() {
      this.t++; const p = W.player, d = Math.abs(p.cx - this.cx);
      const close = p.alive && d < 96 && Math.abs(p.feet - (this.y + this.h)) < 40 && Game.state === 'play' && !W.arenaOn;
      if (close && !this.playing) { this.playing = true; Audio8.play('mariachi', null, 0.6); }
      else if (this.playing && (d > 160 || W.arenaOn)) { this.playing = false; if (!W.arenaOn) Audio8.play(W.songName(), null, 0.8); }
      if (this.playing && this.t % 18 === 0) W.spawn(new Particle(this.x + rnd(6, 74), this.y + rnd(-2, 10), rnd(-0.3, 0.3), -0.55, ['#f8d048', '#f050a0', '#20c8c0'][((this.t / 18) | 0) % 3], 70, 2, -0.004)); // Noten steigen auf
      if (close && !this.done) {
        this.listen++; pzSay('kapelleHoer');
        if (this.listen >= LISTEN) { this.done = true; Castle.serenade(); Audio8.sfx('trompete', this.cx); W.popup(this.cx, this.y - 12, tr('kapelleOle'), '#f8d048'); Game.note('kapelleBuff'); for (let i = 0; i < 16; i++) W.spawn(new Particle(this.cx + rnd(-30, 30), this.y + rnd(0, 20), rnd(-1.4, 1.4), rnd(-2.4, -0.8), ['#f89820', '#fcc040', '#f050a0', '#20c8c0'][i % 4], 50, 2, 0.05)); }
      }
    }
    draw(ctx) {
      const sx = Math.round(this.x - W.cam.x), feet = Math.round(this.y + this.h - W.cam.y);
      if (sx < -90 || sx > View.w + 10) return;
      ['guit', 'trump', 'viol'].forEach((k, i) => {
        const f = this.playing ? (((this.t >> 3) + i) & 1) : (((this.t >> 5) + i) & 1), im = KAPELLE3D.get(k + f), x = sx + 8 + i * 24 + (i === 1 ? 2 : 0);
        if (im) ctx.drawImage(im, x - 12, feet - 48);
        else { ctx.fillStyle = '#1c1a22'; ctx.fillRect(x - 3, feet - 30, 6, 30); ctx.fillStyle = '#ece4cc'; ctx.fillRect(x - 3, feet - 38, 6, 7); ctx.fillStyle = '#2a2016'; ctx.fillRect(x - 10, feet - 40, 20, 2); }
      });
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.y + 20 - cy, r: 56, c: [252, 190, 120], a: 0.18 }); }
  }
  return { enter, venue, VENUES, Band, LISTEN };
})();
