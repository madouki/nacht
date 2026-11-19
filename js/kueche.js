// Kantinenküche (Schloss-Modus): Viele Gegnerarten lassen mit etwas Glück ihre eigene Zutat fallen (das Bestiarium zeigt sie als BEUTE).
// Im Laden der Kantinenchefin führt ←→ bis KOCHEN: Aus den Zutaten kocht sie acht Gerichte. Jedes stärkt beim ersten Mal dauerhaft,
// jeder Nachschlag heilt voll. Spielstand in Castle.flags: mat_<id> = Vorrat, mats_<id> = schon einmal gefunden, dish_<id> = gegessen,
// kp_<id> = Siege ohne Zutat (Trostzähler: jeder leere Sieg macht die nächste Zutat wahrscheinlicher).
// Bilder der Gerichte: tools/blender/kueche_bl.py, pack_kueche.py → img/kueche3d.png
'use strict';
const Kueche = (() => {
  const MAP = {"big_kieselsuppe":[0,0,32,28],"sm_kieselsuppe":[0,29,14,12],"big_zuckerwatte":[33,0,32,28],"sm_zuckerwatte":[15,29,14,12],"big_suesssauer":[66,0,32,28],"sm_suesssauer":[30,29,14,12],"big_sorbet":[99,0,32,28],"sm_sorbet":[45,29,14,12],"big_pudding":[132,0,32,28],"sm_pudding":[60,29,14,12],"big_fischstaebchen":[165,0,32,28],"sm_fischstaebchen":[75,29,14,12],"big_milchreis":[198,0,32,28],"sm_milchreis":[90,29,14,12],"big_gulasch":[231,0,32,28],"sm_gulasch":[105,29,14,12]};
  const img = new Image(); let ok = false;
  img.onload = () => { ok = true; };
  img.src = 'img/kueche3d.png?v=' + (window.BUILD || '');
  const F = () => (typeof Castle !== 'undefined' && Castle.flags) || {};

  // Gegnerart → [Zutat, Grundchance]; seltene Gegner geben öfter etwas
  const SRC = {
    Bat: ['fluegel', 0.07], Ghost: ['ekto', 0.07], Knight: ['rost', 0.09], LivingArmor: ['rost', 0.15], Schildwache: ['rost', 0.15],
    Skeleton: ['knochen', 0.1], Raven: ['rabenei', 0.1], Gargoyle: ['kiesel', 0.14], FlyBook: ['eselsohr', 0.12], Tome: ['eselsohr', 0.2],
    Ordner: ['eselsohr', 0.12], Pitcher: ['nektar', 0.14], Snapper: ['bohne', 0.14], Automat: ['zahnrad', 0.18], Galvanifrosch: ['zahnrad', 0.15], IceSkeleton: ['eiswuerfel', 0.25],
    Frostgeist: ['raureif', 0.25], Hoehlenspinne: ['netz', 0.25], Jelly: ['gelee', 0.25], Mondkalb: ['mondmilch', 0.3], Fishman: ['fisch', 0.3],
  };
  const DISHES = [
    { id: 'kieselsuppe', need: { kiesel: 2, knochen: 1, bohne: 1 }, st: { hp: 4 } },
    { id: 'zuckerwatte', need: { netz: 2, nektar: 1 }, st: { mp: 6 } },
    { id: 'suesssauer', need: { fluegel: 3, nektar: 1 }, st: { atk: 1 } },
    { id: 'sorbet', need: { raureif: 1, eiswuerfel: 2 }, st: { def: 1 } },
    { id: 'pudding', need: { gelee: 2, ekto: 1 }, st: { luck: 1 } },
    { id: 'fischstaebchen', need: { fisch: 1, eselsohr: 2 }, st: { hp: 4 } },
    { id: 'milchreis', need: { mondmilch: 2, rabenei: 1 }, st: { mp: 6 } },
    { id: 'gulasch', need: { zahnrad: 2, knochen: 1, rost: 2 }, st: { atk: 1, def: 1 } },
  ];
  // Zutaten als 10×10-Pixelbilder: a Grundfarbe, b Schatten, c Licht
  const ICON = {
    fluegel: [['#5c3c7c', '#3c2450', '#9c7cc8'], ['..........', '.a........', '.aa....a..', '.aca..aa..', '.aaaaaaa..', '.abbbbbaa.', '..b.b.b.a.', '..........']],
    knochen: [['#e8e4d0', '#a8a090', '#fcfcf0'], ['..........', 'cc......cc', 'aac....caa', '.aaaaaaaa.', '.abbbbbba.', 'aab....baa', 'bb......bb', '..........']],
    eiswuerfel: [['#a8e8fc', '#5cb4dc', '#f0fcff'], ['..........', '..cccccc..', '.caaaaaab.', '.caacaaab.', '.caaaaaab.', '.caaaaaab.', '.cbbbbbbb.', '..........']],
    ekto: [['#7cf8a0', '#3cb868', '#e0fff0'], ['...aaaa...', '..aaccaa..', '.aacaaaaa.', '.aaaaaaaa.', '.aaaaaaab.', '.aaaaaabb.', '.ab.ab.ab.', '..........']],
    gelee: [['#e83c48', '#9c1c2c', '#ff9ca0'], ['..........', '...cccc...', '..caaaab..', '..aaaaab..', '.caaaaaab.', '.aaaaaaab.', 'bbbbbbbbbb', '..........']],
    nektar: [['#c8e83c', '#7c9c1c', '#f8ffb0'], ['....c.....', '...cab....', '...aab....', '..caaab...', '..aaaaab..', '..acaaab..', '..aaaaab..', '...bbbb...']],
    fisch: [['#f8a060', '#c86c34', '#ffd0a8'], ['..........', '.ccaaaa...', 'caaaaaaab.', 'aaaaaaaabb', '.bbaaaab.b', '...bbbb...', '..........']],
    eselsohr: [['#f0ecd8', '#a8a090', '#d8d0b8'], ['aaaaaab...', 'aaaaaacb..', 'abbbbacccb', 'aaaaaaaaab', 'abbbbbbbab', 'aaaaaaaaab', 'abbbbbaaab', 'aaaaaaaaab', 'bbbbbbbbbb']],
    zahnrad: [['#d8a838', '#8c6418', '#1c1410'], ['...a..a...', '..aaaaaa..', '.aaabbaaa.', '..abccba..', '..abccba..', '.aaabbaaa.', '..aaaaaa..', '...a..a...']],
    kiesel: [['#a8a8b0', '#6c6c78', '#dcdce4'], ['..........', '..cca.....', '.caaaab...', '.aaaaab.ca', '..bbbb.cab', '......abb.', '..........']],
    netz: [['#ffffff', '#c8c8d0', '#d8d8e0'], ['c...c...c.', '.c..c..c..', '..cacac...', 'cccaaaccc.', '..cacac...', '.c..c..c..', 'c...c...c.']],
    raureif: [['#e8fcff', '#a8e0fc', '#a8e0fc'], ['....c.....', '.c..c..c..', '..c.c.c...', '...aaa....', 'cccacaccc.', '...aaa....', '..c.c.c...', '.c..c..c..', '....c.....']],
    mondmilch: [['#f8f4d8', '#c8c098', '#ffffff'], ['...bb.....', '...cc.....', '..caab....', '.caaaab...', '.aacaab...', '.aaaaab...', '.aaaaab...', '.bbbbbb...']],
    rost: [['#b8642c', '#7c3c14', '#e89c5c'], ['.a....c...', 'acb..aab..', '.b..aaab..', '...acb..a.', '.a..b..cab', 'aab...a.b.', '.b...aab..']],
    rabenei: [['#7c8cac', '#4c5470', '#c8d0e8'], ['...aaa....', '..acaab...', '.acaaaab..', '.aaabaab..', '.aaaaaab..', '.abaaabb..', '..abbbb...']],
    bohne: [['#5cc83c', '#2c7c1c', '#a8f088'], ['........a.', '.......aa.', '..aaaaab..', '.acacacab.', '.aaaaaaab.', '..bbbbbb..']],
  };
  const have = (m) => F()['mat_' + m] | 0;
  const eaten = (d) => !!F()['dish_' + d.id];
  const ready = (d) => Object.keys(d.need).every(m => have(m) >= d.need[m]);
  function stat(k) { let n = 0; for (const d of DISHES) if (d.st[k] && eaten(d)) n += d.st[k]; return n; } // für Castle.gear(): dauerhafte Stärkung
  const LABEL = { hp: () => 'MAX HP', mp: () => 'MAX MP', atk: () => 'ATK', def: () => 'DEF', luck: () => tr('kuecheLck') };
  const fx = (d) => Object.keys(d.st).map(k => LABEL[k]() + ' +' + d.st[k]).join(' · ');

  function matIcon(ctx, m, x, y) {
    const I = ICON[m]; if (!I) return; const [pal, rows] = I, P = { a: pal[0], b: pal[1], c: pal[2] }, oy = Math.floor((10 - rows.length) / 2);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = P[r[i]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x + i, y + oy + j, 1, 1); } } });
  }
  function dishIcon(ctx, id, x, y, big) { // aus dem Atlas (Blender); fehlt er, eine schlichte Schüssel
    const r = MAP[(big ? 'big_' : 'sm_') + id];
    if (ok && r) { ctx.drawImage(img, r[0], r[1], r[2], r[3], Math.round(x), Math.round(y), r[2], r[3]); return; }
    const s = big ? 3 : 1; ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + s, y + 5 * s, 10 * s, 3 * s); ctx.fillStyle = '#c87c34'; ctx.fillRect(x + 2 * s, y + 4 * s, 8 * s, s);
  }

  class Zutat extends Ent { // fällt aus dem Gegner, hüpft einmal auf und liegt dann eine Weile glitzernd da
    constructor(m, x, y) { super(x - 5, y - 5, 10, 10); this.kind = 'item'; this.m = m; this.vy = -2.4; this.vx = rnd(-0.7, 0.7); this.life = 900; this.landed = false; this.bounced = false; }
    update() {
      this.t++;
      if (!this.landed) {
        this.vy = Math.min(this.vy + 0.16, 2.6); if (this.vx) { Phys.moveX(this, this.vx); this.vx *= 0.97; }
        if (Phys.moveY(this, this.vy) === 1) { if (!this.bounced && this.vy > 1) { this.bounced = true; this.vy = -1.2; } else { this.landed = true; this.vx = 0; } }
        if (this.y > W.room.h * T) this.dead = true;
      }
      if (this.t % 40 === 0) W.spawn(new Particle(this.cx + rnd(-4, 4), this.y + rnd(0, 4), 0, -0.3, '#fcf0b0', 16, 1, 0));
      if (--this.life <= 0) this.dead = true;
    }
    lightUp(L, cx, cy) { L.push({ x: this.cx - cx, y: this.cy - cy, r: 10, c: [252, 230, 170], a: 0.1 }); } // nur ein Hauch, sonst überstrahlt der Schein das Bildchen
    draw(ctx) {
      if (this.life < 90 && (this.t & 2)) return;
      const bob = this.landed ? Math.round(Math.sin(this.t * 0.08)) : 0;
      matIcon(ctx, this.m, Math.round(this.x - W.cam.x), Math.round(this.y - W.cam.y) + bob);
    }
    collect(p) {
      this.dead = true; const f = F(), first = !f.kue_any;
      f['mat_' + this.m] = Math.min(99, have(this.m) + 1); f['mats_' + this.m] = 1; f.kue_any = 1;
      if (typeof Castle !== 'undefined' && Castle.setFlag) Castle.setFlag('kue_seen'); // speichert
      W.popup(this.cx, this.y - 6, tr('mat_' + this.m), '#f8d878'); Audio8.sfx('item');
      if (first && typeof Game !== 'undefined' && Game.note) Game.note('kuecheNote');
    }
  }
  function drop(e) { // aus Castle.defeated(): je Gegnerart ihre Zutat; jeder leere Sieg erhöht die Chance um drei Prozentpunkte
    if (!e || e.kind === 'boss' || typeof Castle === 'undefined' || !Castle.on) return;
    const s = SRC[e.constructor && e.constructor.name]; if (!s) return;
    const f = F(), k = 'kp_' + s[0], ch = s[1] * (1 + 0.25 * stat('luck')) + 0.03 * (f[k] | 0);
    if (Math.random() >= ch) { f[k] = (f[k] | 0) + 1; return; }
    f[k] = 0; W.spawn(new Zutat(s[0], e.cx, Math.min(e.cy, W.room.h * T - 24)));
  }
  function beastLine(ctx, k, cx, y) { // Bestiarium: BEUTE dieser Art (unbekannt, bis sie einmal gefunden wurde)
    const s = SRC[k]; if (!s) return; const m = s[0], seen = F()['mats_' + m], n = have(m);
    const txt = tr('kuecheLoot', seen ? tr('mat_' + m) + (n ? ' ×' + n : '') : '???'), w = Font.width(txt);
    if (seen) matIcon(ctx, m, Math.round(cx - w / 2 - 13), y - 2);
    Font.draw(ctx, txt, cx, y, seen ? '#c8e0a8' : '#5c5c6c', { align: 'center', shadow: '#000' });
  }

  // ---------------- Kochen (dritte Seite im Laden der Kantinenchefin) ----------------
  const ui = { sel: 0 };
  function input(P) { // gibt den Text zurück, den die Köchin sagt (oder null)
    const n = DISHES.length;
    if (P.up || P.down) { ui.sel = (ui.sel + (P.down ? 1 : n - 1)) % n; Audio8.sfx('select'); }
    if (!(P.jump || P.attack)) return null;
    const d = DISHES[ui.sel];
    if (!ready(d)) { Audio8.sfx('wall'); return 'kuecheMissing'; }
    const f = F(), first = !eaten(d);
    for (const m in d.need) f['mat_' + m] = have(m) - d.need[m];
    f['dish_' + d.id] = 1; f.kue_cooked = (f.kue_cooked | 0) + 1;
    if (Castle.setFlag) Castle.setFlag('kue_seen');
    const p = W.player; if (p && p.alive) p.hp = p.maxHp; // der Zuwachs an MAX HP kommt beim nächsten Abgleich obendrauf
    Audio8.sfx('chomp'); Audio8.sfx(first ? 'bigItem' : 'heart'); Audio8.sfx('burp');
    return first ? 'kuecheEat_' + d.id : 'kuecheAgain';
  }
  function draw(ctx, t, lx, rx, cx) {
    DISHES.forEach((d, i) => {
      const y = 80 + i * 12, on = i === ui.sel, e = eaten(d), r = ready(d);
      if (on) { ctx.fillStyle = 'rgba(232,168,72,0.2)'; ctx.fillRect(lx - 6, y - 3, rx - lx + 12, 12); if ((t >> 4) % 2 === 0) Sprites.draw(ctx, Sprites.S.heartS, lx - 4, y - 1); }
      dishIcon(ctx, d.id, lx + 6, y - 3, false);
      Font.draw(ctx, tr('dish_' + d.id), lx + 22, y, on ? '#fcfcfc' : e ? '#a8b8a0' : '#c8c8d8', { shadow: '#000', fit: rx - lx - 52 });
      if (r) Font.draw(ctx, tr('kuecheReady'), rx - (e ? 12 : 0), y, '#f8b800', { align: 'right', shadow: '#000' });
      if (e) Font.draw(ctx, '✓', rx, y, '#58f898', { align: 'right', shadow: '#000' });
    });
    const d = DISHES[ui.sel], ks = Object.keys(d.need), bx = lx - 2;
    dishIcon(ctx, d.id, bx, 176, true);
    ks.forEach((m, i) => { const y = 177 + i * 10, h = have(m), okk = h >= d.need[m]; matIcon(ctx, m, bx + 38, y - 2); Font.draw(ctx, tr('mat_' + m) + '  ' + Math.min(h, 99) + '/' + d.need[m], bx + 52, y, okk ? '#a8f0a0' : '#d08c8c', { shadow: '#000' }); });
    Font.draw(ctx, eaten(d) ? tr('kuecheEaten') : tr('kuecheFirst', fx(d)), bx + 38, 177 + ks.length * 10 + 1, eaten(d) ? '#7cdcfc' : '#f8d878', { shadow: '#000', fit: rx - bx - 38 });
    Font.draw(ctx, tr('kuecheHelp'), cx, 218, '#7c7c8c', { align: 'center' });
  }
  const anyReady = () => DISHES.some(ready);
  return { drop, stat, beastLine, input, draw, matIcon, dishIcon, anyReady, Zutat, SRC, DISHES, ICON, have, eaten, ready, get ui() { return ui; }, get ready3d() { return ok; } };
})();
