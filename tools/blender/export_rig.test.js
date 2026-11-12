// Gelenke aller Heldenposen für Blender ausgeben (HEROES.exportRig) und die Atlaskarten aus chars3d.js dazu
module.exports = async (page, h) => {
  const fs = require('fs'), path = require('path'), out = process.env.OUT || '.', res = [];
  await page.waitForFunction(() => typeof Game !== 'undefined' && typeof HEROES !== 'undefined', null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  for (const id of ['henrik', 'ragnor', 'kaspar', 'henrikAdv']) {
    const rig = await page.evaluate((id) => HEROES.exportRig(id), id);
    fs.writeFileSync(path.join(out, 'rig_' + id + '.json'), JSON.stringify(rig));
    res.push(id + ': ' + rig.length + ' Posen, S ' + [...new Set(rig.map(r => r.S))].join('/') + ', Schlüssel z. B. ' + rig.slice(0, 3).map(r => r.key).join(','));
  }
  res.push('Fehler: ' + JSON.stringify(h.errors.slice(0, 6)));
  return res;
};
