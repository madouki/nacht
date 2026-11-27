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
   trägt die Karte ein (weitere Render-Ordner hinten anhängen, z. B. `r_items` aus `items_bl.py` für Herzen, Geldsäcke, Braten,
   Kristallkugel). Die Paternoster-Kabine: `pcabin_bl.py`, dann
   `python pack_pcabin.py r_pcabin/pcabin.png ../../js/castle.js ../../img/krat3d.png`.

6. **Hintergründe:** `python bl.py crypt_bg_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_bg", "ss": 4}'` rendert die
   Arkadenwand der Gruft und die ferne Ebene (je 512×208, kachelbar); `python pack_bg.py r_bg ../../img/bg` verkleinert und
   tönt sie. Geladen werden sie von `js/bg3d.js`. Uhrturm und Grotte: `bg2_bl.py` (nutzt die Helfer aus `crypt_bg_bl.py`),
   dann wieder `pack_bg.py` (`JOBS` enthält die Tönung je Bild).

7. **Uhrwerk (Glockenstuhl, Zeigerkammer, Kuckucksuhr):** `python bl.py uhr_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_uhr", "ss": 6}'`
   rendert Kuckucksuhr-Gehäuse, Kuckuck (zu/offen), Pendelgewicht, Tannenzapfen, Zifferblatt, Zeiger, Stachelnabe und zwei
   Zahnräder; `python pack_uhr.py r_uhr ../../js/glocken.js ../../img/uhr3d.png` packt den Atlas und trägt `UHR_MAP` ein.
   Zeiger, Nabe und Zahnräder dreht das Spiel (geglättet), Türflügel, Uhrzeiger, Kette und Scherengitter malt es dazu.

8. **Figuren der Seil-Räume:** `python bl.py npc_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_npc", "ss": 8}'` rendert Glöckner,
   Bergführer und Uhrmacher (je 28×44, zwei Atembilder); `pack_uhr.py` nimmt den Ordner als viertes Argument mit in den Atlas
   (`n_bell0` …, um 26 % abgedunkelt, damit das Glühen sie nicht überstrahlt). Die Zeichner in castle.js nutzen sie zuerst.
   Seit 20261115: auch Knochen-Kalle, Anatol, Kartograf, Kantinenchefin, Bibliothekar, Gefangener, Speedrunner-Geist (+ Stoppuhr
   `n_watch`), Stempelmann und Wandhuhn (40×48, Füße bei 20/48; eigene Bildwahl je Figur in den Zeichnern).

Aussehen der Helden steht in `LOOK` (hero_bl.py), die Posen des Grafen in `count()` (count_bl.py). Bildgrößen, Anker und
Kartenschlüssel bleiben, damit im Spiel nichts verrutscht.

9. **Riegeltür (Abkürzungen):** `python bl.py riegel_bl.py '{"dir": "<dieser Ordner>", "out": ".../r_riegel", "ss": 8}'` rendert die Eichentür in fünf
   Öffnungswinkeln (34×48) und den Riegelbalken (28×9); `python pack_riegel.py r_riegel ../../js/riegel.js ../../img/riegel3d.png` packt den Atlas und trägt die Karte ein.

10. Kulissen hinter der Spielebene: `python bl.py kulisse_bl.py '{"dir": "<dieser Ordner>", "out": "<Ausgabe>", "ss": 4}'`, danach `python pack_kulisse.py <Ausgabe> ../../js/kulisse.js ../../img/kulisse3d.png`. Welche Stücke in welchem Raum stehen, steht in `ROOMS` in `js/kulisse.js`.

## Hafenfeuer und Waffenaltäre

Aus dem Projektstamm rendert `blender -b --factory-startup -P tools/blender/waffenaltar.py` die drei Waffenaltäre für die Heldenwahl. `blender -b --factory-startup -P tools/blender/hafenfeuer_bl.py` erzeugt das Schiffs-Sprite und das Modell `hafenfeuer.glb`.

Die [Unreal-Lichtstudie](../unreal/HarbourPreview/HarbourPreview.uproject) öffnet in UE 5.8 die Karte `HarbourStudy`. Mit **Play** zeigt die orthografische Kamera das Hafenfeuer im Mondlicht.

## Tiefenauge des Schiffskraken

`blender -b --factory-startup -P tools/blender/tiefenauge_bl.py` erzeugt das offene Bronzewappen als `tiefenauge.glb` und rendert die geschlossene und die offene Pose für das Spiel. Im Unreal-Projekt liegt die zweite Lichtstudie unter `Content/Nachtmahr/TiefenaugeStudy.umap`. Die Karte öffnen und **Play** drücken, um das Relief durch die eingerichtete Kamera zu sehen.

## Schatztruhen

Aus dem Projektstamm rendert `blender -b --factory-startup -P tools/blender/schatztruhen_bl.py` die fünf Deckelposen von Reisetruhe, Domschrein und Herzschrein nach `img/schatztruhen.png`. Jede Zeile gehört zu einer Truhe. Der gleiche Lauf exportiert die drei geschlossenen Modelle in `tools/blender/schatztruhen.glb`.

Im [Unreal-Projekt](../unreal/HarbourPreview/HarbourPreview.uproject) zeigt die Karte `Content/Nachtmahr/SchatzkammerStudy.umap` die drei Modelle nebeneinander. **Play** wechselt auf die eingerichtete orthografische Kamera.
