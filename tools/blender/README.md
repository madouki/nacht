# Figuren aus Blender (Helden, Graf)

Erster Schritt der Leitlinie „von 16-Bit schrittweise zum HD-3D-Look“: die Figuren werden in Blender aus Grundkörpern
aufgebaut, mit drei Lichtern beleuchtet, stark überabgetastet gerendert und auf Spielpixel verkleinert.

1. **Gelenke ausgeben:** im Spiel `HEROES.exportRig('henrik')` (auch `ragnor`, `kaspar`, `henrikAdv`) → Liste mit einem Eintrag
   je Pose (`key` = Hash der Pose, Gelenke in Bildpunkten des 34×36-Feldes). `export_rig.test.js` schreibt sie mit dem
   Aufnahme-Harness als `rig_<id>.json`.
2. **Rendern:** Blender mit dem MCP-Add-on starten (lauscht auf 127.0.0.1:9876), dann
   `python bl.py hero_bl.py '{"id": "henrik", "rig": ".../rig_henrik.json", "out": ".../r_henrik", "ss": 12}'`
   bzw. `python bl.py count_bl.py '{"out": ".../r_count", "ss": 8}'` (drei Posen, 100×88).
3. **Packen:** `python pack.py atlas r_henrik ../../js/chars3d.js henrik ../../img/henrik3d.png` setzt die verkleinerten Bilder an
   die Plätze der vorhandenen Karte. Die drei Graf-Bilder kommen an die Plätze `count_closed/open/cast` in
   `img/creatures3d.png` (Karte in `js/creatures3d.js`).

4. **Kreaturen ohne Rig:** `python bl.py rest_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_rest", "what": ["medusa", "pillar"]}'`
   rendert Medusa, Medusenhaupt, Gespenst, Flammenschädel, Seeadler, Rabe und Knochensäule (`what` weglassen = alle);
   `python pack_rest.py r_rest ../../js/creatures3d.js ../../img/creatures3d.png` setzt sie in den Atlas.

5. **Requisiten:** `python bl.py props_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_props"}'` rendert Kerze, Fackel,
   Standleuchter und Feuerschale; `python pack_props.py r_props ../../js/props3d.js ../../img/props3d.png` packt den Atlas und
   trägt die Karte ein. Die Paternoster-Kabine: `pcabin_bl.py`, dann
   `python pack_pcabin.py r_pcabin/pcabin.png ../../js/castle.js ../../img/krat3d.png`.

Aussehen der Helden steht in `LOOK` (hero_bl.py), die Posen des Grafen in `count()` (count_bl.py). Bildgrößen, Anker und
Kartenschlüssel bleiben, damit im Spiel nichts verrutscht.
