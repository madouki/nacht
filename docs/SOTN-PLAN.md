# NACHTMAHR → Schloss-Modus im Stil von *Symphony of the Night*

Stand: 2026-10-21. Ziel: aus den 7 linearen Kapiteln (28 Räume) ein zusammenhängendes Schloss machen, das man frei
erkundet: Relikte schalten Moves frei und öffnen Gebiete, Bosse bewachen Regionen, eine Karte zeigt den Erkundungsgrad,
dazu eine leichte RPG-Schicht. Grafik, Engine, Räume und Gegner bleiben; der Arcade-Modus (Kapitel, Zeit, Leben,
Highscore) bleibt unverändert daneben bestehen. Beide Modi teilen sich die Räume aus `js/levels.js`.

## 1. Ausgangslage im Code

| Baustein | Heute | Für das Schloss |
|---|---|---|
| `js/levels.js` | `room(w, theme, h)` mit `start`, **einem** Ausgang (`exit(x)` rechts oder `exitAt(...)` oben), `arena(boss)` am Raumende; `STAGES` = 7 Kapitel mit `rooms[]` | Räume bekommen eine feste `id` und mehrere Türen; `STAGES` bleibt für den Arcade-Modus |
| `js/world.js` `loadRoom(stage, roomIdx)` | setzt den Helden auf `def.start`; Ausgangszone → `Game.nextRoom()` → nächster Index | `loadRoom(roomId, doorId)`: Held erscheint an der Gegentür, Blickrichtung in den Raum |
| `js/game.js` | Zustände `title … card → play ⇄ pause → fade → clear`; Pause = WEITER / LEICHT / ABSCHNITT / TITEL | neue Zustände `map`, später `equip`/`status`; kein Kapitelwechsel, keine Zeit, keine Leben |
| `js/entities.js` `Player` | alle Moves sind immer da: Doppelsprung (`canDouble`, Z. 391), Dash/Luft-Dash (`startDash`, Z. 339), Wandsprung (`wallJump`, Z. 388), Kante packen (Z. 482), Ring-Pendeln (Z. 701), Rutschen | Moves an Relikte koppeln: `p.has('dash')` an genau diesen Stellen |
| Engelsstatuen (`Statue`, `js/props.js`) | Kontrollpunkt im Raum, heilt 37,5 % | bleiben Rücksetzpunkte; Speichern übernehmen eigene Speicherräume |
| `Relic`-Prop | Sockel mit Fund (`oneUp`, `heartB`) | derselbe Sockel trägt die Bewegungs-Relikte |

## 2. Ein Schloss statt sieben Kapiteln

### Regionen

```
                         BERGFRIED-KRONE:  Brücke ── Ballsaal ── Thronsaal [GRAF]
                                              │
                                          Glasturm ↑
                                              │
  SONNENKATHEDRALE                        Seelenstrudel ◄── Siegeltor (5 Siegel)
  Dach [SONNENWÄCHTER]                        │
     │ Sonnenturm ↑                           │
  Kathedrale ── Uhrturm ↑ ── Bibliothek ↑ ── Marmorgalerie [MEDUSA] ── Bergfried-Turm
                                                                            │
                                                     Glockenturm ↑ ─────────┘
                                                          │ (Sims, Doppelsprung)
  Prolog: Tutorial-Schiff ► Schiff ► Wald ► BURGHOF ── EINGANGSHALLE [S] ── Große Halle [RIESENFLEDERMAUS] ── Glastür ── WINTERGARTEN:
                                                          │ Kellertreppe              Palmenhaus ── Maschinenhalle ── Kuppel ↑ ── [MENSCHENFALLE]
                                                          ▼
  KATAKOMBEN:  Höhlensee ── Brunnenschacht ↑ ── Eishöhle ── Eisturm ↓ ── Gruft [KNOCHENRIESE] ── Gruftaufzug ↑ (Abkürzung zur Kellertreppe)
```

Die Eingangshalle wird zum Knotenpunkt wie der Eingang in SotN: geradeaus die Große Halle, oben über den Galerie-Sims
der Glockenturm, unten eine neue Kellertreppe in die Katakomben, in der Mitte das versiegelte Tor zum Thron.

### Türen (alle in beide Richtungen, sofern nicht anders vermerkt)

| Tür | Seite A | Seite B | Bedingung |
|---|---|---|---|
| Wald → Burghof | Wald, rechts | Burghof, links | Prolog-Ende; zurück nur bis zur Mole (Schiff legt ab) |
| Burghof ↔ Eingangshalle | Burghof, rechts (Torbogen, rutschen) | Eingangshalle, unten links | – |
| Eingangshalle ↔ Große Halle | Eingangshalle, unten rechts | Große Halle, links | – |
| Eingangshalle ↔ Glockenturm | Galerie-Sims oben (31,7) | Glockenturm, unten links | Doppelsprung |
| Glockenturm ↔ Bergfried-Turm | Glockenturm, oben rechts | Bergfried-Turm, links | – |
| Bergfried-Turm ↔ Marmorgalerie | rechts | links | – |
| Marmorgalerie ↔ Bibliothek | Galerie rechts (hinter Medusa) | Bibliothek, unten links | Wandsprung (im Raum) |
| Bibliothek ↔ Uhrturm | Bibliothek, oben rechts | Uhrturm, unten links | – |
| Uhrturm ↔ Kathedrale | Uhrturm, oben | Kathedrale, links | – |
| Kathedrale ↔ Sonnenturm ↔ Dach | wie heute, plus Rückweg | | Ring, Wandsprung, Dash |
| Eingangshalle ↔ Kellertreppe (neu) ↔ Höhlensee | Eingangshalle unten | Höhlensee, links | Dash (See) |
| Höhlensee ↔ Brunnenschacht ↔ Eishöhle | wie heute, plus Rückweg | | – |
| Eishöhle → Eisturm → Gruft | Eishöhle rechts, Eisturm-Fuß | Gruft links | **Einbahn** (Rutschpartie abwärts) |
| Gruft ↔ Gruftaufzug (neu) ↔ Kellertreppe | Gruft rechts (hinter dem Knochenriesen) | Kellertreppe | Rückweg für den Eisturm |
| Große Halle ↔ Glastür ↔ Palmenhaus | Große Halle rechts (hinter der Fledermaus) | Palmenhaus links | Glasschlüssel |
| Palmenhaus ↔ Maschinenhalle ↔ Kuppel-Aufstieg ↔ Kuppel | wie heute, plus Rückweg | | – |
| Eingangshalle ↔ Seelenstrudel | Siegeltor in der Hallenmitte | Strudel links | 5 Siegel |
| Strudel ↔ Glasturm ↔ Brücke ↔ Ballsaal ↔ Thronsaal | wie heute, plus Rückweg | | Ring, Dash |

Einbahn-Stellen und ihr Rückweg:

- **Eisturm** (Rutschpartie abwärts): Rückweg über den neuen Gruftaufzug.
- **Brücke** (bricht hinter dem Helden weg): nur beim ersten Überqueren; danach bleiben die Lücken, mit Dash in beide Richtungen schaffbar.
- **Schiff und Seilrutschen**: Prolog, nicht wieder betretbar. Die Mole am Waldrand bleibt als Sackgasse.
- Bröckelnde Steine (`Crumble` hat `home`) und Aufzüge pendeln schon heute zurück; das reicht für den Rückweg.

### Bosse und Arenen

Arenen liegen heute in den letzten `View.w` Pixeln eines Raums (`View.w` schwankt zwischen 256 und 640). Im Schloss
bekommt jede Arena eine zweite Tür hinter dem Boss, die sich nach dem Sieg öffnet. Der Sieg wird im Spielstand
gemerkt (`flags.boss_gbat` usw.), damit der Boss beim nächsten Besuch nicht wieder erscheint (heute nur `W.miniDone`
für die laufende Stage).

## 3. Speicherräume

- Neue Mini-Räume (16×13 Kacheln = 1 Kartenzelle) mit einer **roten** Engelsstatue (Variante von `Statue`): volle
  Heilung, Spielstand schreiben, auf der Karte rot wie in SotN.
- 8 Stück: Burghof, vor Medusa, Kellertreppe, vor der Gruft, Uhrturm→Kathedrale, vor dem Dach, Palmenhaus-Eingang, vor dem Thron.
- Die blauen Statuen in den Räumen bleiben Rücksetzpunkte: normal führt der Tod zum letzten Speicherraum (SotN),
  im Leicht-Modus zurück zur letzten Statue.
- Später: 3–4 Warp-Spiegel in Speicherräumen gegen lange Rückwege.

## 4. Karte

- Raster aus Zellen zu 16×13 Kacheln (ungefähr ein Bildschirm). Eine Zelle wird aufgedeckt, sobald der Held sie betritt.
- Darstellung wie in SotN: betretene Zellen blau, Raumgrenzen weiß, Türen gold, Speicherräume rot, Bosse markiert, Held blinkt.
- Erkundungsgrad in Prozent. Es zählen nur Zellen mit Stand- oder Fundstelle (Boden unter Luft, Treppen, Kerzen,
  Truhen, Ringe, Aufzüge), damit 100 % erreichbar sind; reine Himmelszellen über dem Schiff zählen nicht.
- Später: Relikt „Schlosskarte" (beim Bibliothekar) zeigt nicht betretene Räume grau; eigene Kartentaste
  (Xbox „Ansicht", heute Ton – Ton wandert ins Optionsmenü).

**Prototyp in diesem Schritt:** siehe Abschnitt 9.

## 5. Relikte schalten Moves frei

Der Prolog auf dem Schiff bleibt das Tutorial mit allen Moves. Am Burgtor reißt der Fluch des Grafen dem Helden die
Relikte vom Leib, sie verstreuen sich im Schloss (wie Alucard bei Tod). Grundausstattung: Laufen, Springen, Peitsche,
Rutschen, Kante packen, Spezialwaffe.

| Relikt | Move | Fundort | Öffnet |
|---|---|---|---|
| Rabenfeder | Doppelsprung | Riesenfledermaus (Große Halle) | Galerie-Sims → Glockenturm |
| Schattenmantel | Dash + Luft-Dash | Medusa (Marmorgalerie) | Höhlensee (9 Kacheln Wasser), Brücke |
| Enterhaken | Ring-Pendeln | Versteck in der Eishöhle | Eisturm, Kathedrale, Strudel |
| Katzenkralle | Wandsprung | Knochenriese (Gruft) | Bibliothek, Uhrturm, Sonnenturm |
| Glasschlüssel | – | Sonnenwächter (Dach) | Glastür → Wintergarten |
| Siegel I–V | – | je ein Boss | Siegeltor → Thron |

Umsetzung: `Player.has(relic)` (immer `true` im Arcade-Modus) an den fünf Stellen in `entities.js`. Die Sperren
stehen schon in den Räumen: Wandsprung-Schächte im Glockenturm und in der Bibliothek, Dash-Lücken im Höhlensee und auf
der Brücke, Ringe über Schluchten. Der Reliktsockel ist der vorhandene `Relic`-Prop mit neuem `loot`.

## 6. RPG-Schicht

- **EXP / Level:** jeder Gegnertyp gibt EXP (Basiswert × Regionsstufe). Bedarf je Stufe `20·L² + 10·L`
  (L2: 30, L5: 550, L10: 2100, L20: 8200). Aufstieg: +5 HP, +2 MP, +1 STR, +1 CON, volle Heilung, „LEVEL UP!".
- **HP / MP:** HP ersetzt die heutige Lebensleiste (Leicht-Modus verdoppelt weiter). MP regeneriert langsam und
  bezahlt den Heiligen Sturm und den Ladeangriff (heute 10 Herzen). Herzen bleiben Munition der Spezialwaffen.
  Schadenszahlen über `W.popup`.
- **Ausrüstung:** Waffe (heldenspezifisch: Peitsche, Schwert, Hellebarde; die heutigen Peitschenstufen `p.whip`
  werden Waffenstufen), Kopf, Rüstung, Umhang, 2× Talisman.
- **Drops:** Gegner bekommen Droptabellen (häufig/selten, Glück erhöht die Chance); Kerzen und Truhen behalten
  ihre heutigen Drops. Gold (`$`) wird beim Bibliothekar am Lesepult ausgegeben: Tränke, Schlosskarte, Ausrüstung.
- **Menü:** Pause → KARTE / AUSRÜSTUNG / RELIKTE / STATUS. Punkte, Zeit, Leben und Rang gibt es nur im Arcade-Modus.

## 7. Kapitel → Regionen

| Kapitel heute | Region im Schloss | Boss | Belohnung |
|---|---|---|---|
| 1 Die Ankunft | Prolog (linear) | Tentakel (Zwischengegner) | – (Tutorial, dann Fluch am Tor) |
| 2 Der Burghof | Burgtor + Glockenturm | Riesenfledermaus | Rabenfeder, Siegel I |
| 4 Der Bergfried | Westtürme (Bergfried-Turm, Galerie, Bibliothek, Uhrturm) | Medusa | Schattenmantel, Siegel II |
| 3 Die Katakomben | Katakomben | Knochenriese | Katzenkralle, Siegel III |
| 5 Die Sonnenkathedrale | Sonnenkathedrale | Sonnenwächter | Glasschlüssel, Siegel IV |
| 6 Der Wintergarten | Wintergarten | Menschenfalle | Siegel V |
| 7 Der Thron der Nacht | Bergfried-Krone | Graf Nachtmahr | Ende, Bonus bei 100 % |

Medusa rückt vor den Knochenriesen; die Regionsstufe der Gegner gleicht das aus. Musik läuft pro Region weiter wie
heute pro Kapitel (`W.songName()`), Regionsname als Einblendung beim ersten Betreten statt der Kapitelkarte.

## 8. Risiken

1. **Spielstände:** `localStorage` kann leer sein (privater Modus, gelöschte Daten, Xbox Edge räumt auf), Schreiben
   ist synchron. Der Prototyp speichert unter `stage-id:raum-index`; wird `levels.js` umsortiert, verrutschen die
   Kartendaten. Darum ab Phase 1 feste Raum-IDs, ein Versionsfeld mit Migration, mehrere Slots und ein
   Export-Code als Sicherung. Klein halten (Bitsets statt Listen).
2. **Leistung auf Handy und Xbox:** heute wird beim Kapitelstart das ganze Kapitel vorgebaut (`prewarmStage`).
   Mit Türen zwischen beliebigen Räumen drohen Ruckler am Raumwechsel. Abhilfe: Nachbarräume in Leerlauf-Frames
   vorbauen (`runWarm` gibt es schon), LRU-Cache für gebaute Räume, Karte in eine Offscreen-Leinwand cachen und nur bei
   neuen Zellen neu zeichnen, `localStorage` nur bei neuen Zellen und beim Speichern schreiben.
3. **Test-Bots:** `clip/regress.js` läuft die Kapitel linear ab. Für das Schloss braucht es (a) einen Tür-Test
   A→B→A für jedes Türpaar, (b) einen Erreichbarkeits-Prüfer (Breitensuche über den Türgraphen mit Relikt-Bedingungen:
   jedes Relikt ist erreichbar, bevor es gebraucht wird; keine Einbahn ohne Rückweg), (c) Bots für jeden Raum in
   beiden Richtungen (`Input.setDemo`), (d) Speichern/Laden im Kreis, (e) den Karten-Test aus diesem Prototyp.
4. **Leveldesign:** alle Räume sind von links unten nach rechts/oben gebaut. Rückwärts fehlen Spawnpunkte, Hinweise
   zeigen in die falsche Richtung, Arenen hängen am rechten Rand mit `camLock`. Das ist der größte Brocken.
5. **Balance:** ohne Zeitlimit und Leben fällt der Arcade-Druck weg; die Kapitel-Reihenfolge ändert sich. EXP-Kurve
   und Regionsstufen müssen das tragen.
6. **Umfang:** neue Texte in 6 Sprachen, Sprachausgabe für Relikte und Regionen, Musik je Region.
7. **Arcade-Modus nicht beschädigen:** jede Schloss-Logik hinter `Castle.on`; der Arcade-Regressionstest bleibt Pflicht.

## 9. Fahrplan

| Phase | Inhalt | Fertig, wenn |
|---|---|---|
| **0 (erledigt)** | `?castle`: Pause → KARTE, betretene Zellen aufdecken, Heldenposition, Erkundungsgrad, Speicherung in `localStorage` | Karte im Browser getestet, Arcade unverändert |
| **1 (Prototyp erledigt)** | Kapitel werden Regionen eines Schlosses: Türen in beide Richtungen, Knoten Eingangshalle (Keller-, Turm-, Siegeltor), Wege hinter den Bossen, Einbahnen mit Rückweg, eine Karte für das ganze Schloss, Bosse geben Siegel und bleiben besiegt, kein Zeitlimit | alle Regionen frei begehbar, Thron hinter 5 Siegeln |
| **1b (teilweise erledigt)** | erledigt: Speicherkammern mit Spielstand, „Fortsetzen" im Titel und nach Game Over, Warpkammern mit Schnellreise über die Karte. Offen: feste Raum-IDs, Regionsmusik ohne Neustart, Spielstand-Slots | Spielstand überlebt Umsortieren von `levels.js` |
| **2 Relikte (erledigt bis auf den Prüfer)** | Fluch am Burgtor, 10 Relikte (Doppelsprung, Dash, Ring-Greifen, Wandsprung, Steinbrecher, Fledermaus-, Nebel-, Wolfsgestalt, Dampfstiefel, Taucherhelm) auf Sockeln, bei Bossen und bei den Zwischengegnern Eishexe und Zugführer, rissiges Gestein vor Zusatzräumen, Dachboden nur fliegend, Kerkerzelle nur als Nebel, Gepäckraum im Hotel nur als Wolf. Selbsttest prüft Türen/Figuren/Gitter/Texte/Modelle/Puppen und die Erreichbarkeit aller Räume über Türen. Offen: Erreichbarkeit innerhalb der Räume (Sprunghöhen) | ganzes Schloss ohne Softlock durchspielbar |
| **3 RPG (fast erledigt)** | erledigt: EXP/Stufe mit LEVEL UP, max. HP/STR/CON je Stufe, Schadenszahlen, Beute, Statusbildschirm, Stufe im Spielstand, Ausrüstung (Waffe/Rüstung/Amulett) mit Drops und Einzelstücken, Tränke, Laden des Bibliothekars, Schlosskarte, drei Begleiter mit Stufen, MP und drei Zauber per Befehlseingabe, Bestiarium, Verkaufen. vier Zauber (mit Tetra-Seelen), Nebenaufträge mit Auftragsbuch. Offen: weitere Gestalten | Statusbildschirm, Shop |
| **4 Bosse & Siegel (erledigt)** | Arenen mit Hintertür, Siegeltor, eigenes Ende (Epilog der drei Figuren, Ergebnis mit Rang nach Erkundungsgrad, Neues Spiel+), neue Verbindungsräume | Abspann im Schloss-Modus |
| **4b Geschichte & Verzahnung (erledigt)** | drei Figuren mit absurden Gesprächen im Maniac-Mansion-Ton (zweiter Held, Bibliothekar, lila Tentakel), elf Szenen entlang der Relikte und Siegel; drei Schleifen (Geheimgang Kolosseum ↔ Brunnenschacht, Wehrgang Bergfried ↔ Glockenturm, Himmelsbrücke Kathedralendach ↔ Kuppel). Offen: weitere Figuren, Szene nach dem Grafen | jede Region über mindestens zwei Wege erreichbar |
| 5 Kür | Warp-Spiegel, Schlosskarte, Geheimwände (`X`/`Y` gibt es schon), „Umgedrehtes Schloss" als Mode-7-Spiegelung | 200 % |

### Prototyp (Phase 0 + 1) benutzen

- Seit 2026-10-22 ist der Schloss-Modus der **Standard**: `https://madouki.github.io/nacht/` startet das Schloss. Das lineare
  Arcade-Spiel gibt es unter `?arcade` oder im Titel über **ARCADE-MODUS** (zurück über **SCHLOSS-MODUS (SOTN)**); alte
  `?castle`-Links funktionieren weiter. Testschalter wie gehabt: `&stage=N&room=M`, `&noboot`.
- **Wegweiser:** das nächste Ziel in der empfohlenen Reihenfolge (Relikt finden, Boss besiegen, Siegeltor öffnen, Graf)
  steht oben im Pausenmenü und unten auf der Karte, der Zielraum blinkt golden auf der Karte (auch unbetreten); nach Fluch,
  Relikt, Boss und Fortsetzen blendet es sich unten im Bild ein.
  Im Spiel zeigt ein **goldener Pfeil** den Weg: eine Breitensuche über den Raumgraphen (Ausgang, Türen, Verbindungen; noch
  verschlossene Tore nur, wenn es sonst keinen Weg gibt) ergibt die Tür in diesem Raum, über der er wippt – Randausgänge mit
  Pfeil zur Seite, Türen außer Sicht mit Pfeil am Bildrand (Turm: kürzerer Weg über die Naht), im Zielraum auf das Ziel selbst.
  Nicht im Bosskampf, in Szenen, Menüs und im Prolog; abschaltbar unter Optionen → WEGWEISER. Konsole: `Castle.guidePlan()`.
- **Prolog überspringen** (zum Testen): solange man auf dem Schiff oder im Wald ist, Pause → PROLOG ÜBERSPRINGEN.
- **Testmodus** (Titel → TESTMODUS): Sprung zu acht Meilensteinen (Burgtor nach dem Fluch, Rabenfeder, Riesenfledermaus,
  Knochenriese, Medusa, Sonnenwächter, fünf Siegel, vor dem Grafen) mit passender Stufe, Gold, Relikten, Siegeln, Ausrüstung,
  Begleitern, Zaubern und freien Warpkammern; ältere Szenen gelten als gesehen. Der Testmodus speichert in eigene Plätze
  (`nachtmahr.test.*`, die Adresse bekommt `?test`), der echte Spielstand bleibt unberührt; Titel → TESTMODUS BEENDEN.
  HUD zeigt „TEST“ (mit * = unverwundbar). Pause → **TEST-WERKZEUGE**: unverwundbar, alle Relikte, Stufe +5, Gold +10000,
  alle Warpkammern, Karte aufdecken, Boss hier besiegen, zu einem Meilenstein, Selbsttest.
- **Selbsttest** (`Castle.selfCheck()`, im Testmodus bei jedem Meilenstein und in den Werkzeugen, Ergebnis in der Konsole):
  Karte ohne Überlappung, ↑-Türen und Figuren auf Boden mit Platz darüber, Funde nicht in der Wand, alle Verbindungen finden
  ihre Räume, alle Texte (Gegenstände, Szenen, Zauber, Werkzeuge) vorhanden.
- **Fortsetzungspunkt:** beim Pausieren, bei jedem Raumwechsel und wenn der Tab versteckt oder der Browser geschlossen wird,
  merkt sich das Spiel Raum, Stelle (auf festem Boden die aktuelle, sonst der letzte sichere Punkt), Energie, MP, Stufe und
  Gold. Titel → FORTSETZEN nimmt den neueren von Fortsetzungspunkt und Speicherkammer; nach Game Over zählt wie in SotN nur
  die Speicherkammer (der Fortsetzungspunkt verfällt). Im Prolog gibt es keinen Fortsetzungspunkt.
- **Karte auf Select:** Select/Ansicht-Taste (Tastatur: Tab) blendet die Karte durchscheinend über dem laufenden Spiel ein,
  um den Helden zentriert (noch einmal drücken: weg); in der Pause öffnet Select die große Karte. Im Arcade-Modus bleibt die
  Ansicht-Taste der Tonschalter.
- **Türen:** ↑-Türen sind Steinbögen wie die Speicherkammer (Quaderring, Schlussstein, Fackelschein, zwei Wandfackeln),
  verschlossen mit eisernem Fallgitter; das Siegeltor hat violette Runen. Seitenausgänge zeigen schon aus zwölf Kacheln
  Entfernung einen Lichtschein und drei große Winkelpfeile, die zum Rand laufen.
- **Laden:** Regionswechsel zeigen den Regionsnamen nur kurz (30–90 Bilder statt 75–140); eine schon vorgebaute Region wird
  in derselben Sitzung nicht noch einmal vorgebaut.
- **Relikte:** Beim ersten Betreten des Burghofs raubt der Fluch des Grafen Doppelsprung, Dash, Wandsprung und Ring-Greifen
  (Kante packen und Rutschen bleiben; im Prolog auf dem Schiff geht noch alles). Sie liegen als leuchtende Kugeln auf Sockeln:
  Rabenfeder (Doppelsprung) am Ende des Kolosseums, Enterhaken (Ringe) in der Eishöhle; Schattenmantel (Dash) bei der
  Riesenfledermaus, Katzenkralle (Wandsprung) beim Knochenriesen, Steinbrecher bei Medusa – der Boss lässt sein Relikt in der
  Arena zurück. Empfohlene Reihenfolge: Kolosseum → Glockenturm → Riesenfledermaus → Katakomben → Knochenriese → Bergfried →
  Medusa → Sonnenkathedrale / Wintergarten → Thron. Die Sperren stecken in `Player.startDash`, `wallDir`, `tryLatch` (in
  `castle.js` umhüllt) und dem Doppelsprung-Flag `canDouble`; `entities.js` bleibt unverändert.
- **Gefahrenstufen:** Prolog und Burghof 1, Katakomben 2, Bergfried 3, Sonnenkathedrale 4, Wintergarten 5, Thron 6, Verlies 7.
  Je Stufe über 1: Gegner +50 % Lebensenergie (Bosse +30 %), +25 % Schaden (auch Geschosse), +60 % EXP. Die Regionskarte
  zeigt GEFAHR *** und die eigene Stufe.
- **Zusatzräume** (nur im Schloss-Modus, hinten an ihre Region gehängt, eigener Platz auf der Karte): Kolosseum (Tür im
  Burghof, Stufe 2, Gegner kommen immer nach – zum Aufleveln), Unterirdischer Kanal (Tür in der Gruft, Stufe 3, führt ins
  Palmenhaus: Schleife Katakomben ↔ Wintergarten), Schatzkammer (Tür auf der linken Galerie der Bibliothek, Stufe 3), Verlies
  (Tür unten im Glasturm, Stufe 7). Kanal, Schatzkammer und Verlies sind mit rissigem Gestein verschlossen, das erst der
  Steinbrecher zerschlägt (vom Palmenhaus aus ist der Kanal offen; von innen bricht das Gestein). In jedem Zusatzraum
  steht ein **Lebensgefäß** (max. HP +4 für immer). Dazu zwei Zusatzräume ohne Gefäß, die Regionen verbinden: **Wehrgang**
  (Stufe 3, Mauerkrone mit zwei Scharten) und **Himmelsbrücke** (Stufe 5, Steg über dem Wolkenmeer mit Lücken).
- **Schleifen (2D-Open-World):** Geheimgang am rechten Ende des Kolosseums ↔ Tür im Brunnenschacht (Burghof ↔ Katakomben
  ohne Kellertür); Tür im Bergfried-Turm (x 40) → Wehrgang → Tür auf der Plattform im Glockenturm (Bergfried ↔ Burghof);
  Kathedralendach (hinter dem Sonnenwächter) → Himmelsbrücke → Kuppel (hinter der Menschenfalle). In eine Arena mit
  lebendem Boss führt keine Schleife: solange er lebt, ist die Tür „VON DER ANDEREN SEITE VERRIEGELT" (Torbedingung
  `beat`, für die Rückrichtung `back`).
- **Geschichte** (Ton: schräg wie *Maniac Mansion* – trockene Pointen, absurde Alltagsdetails im Gruselschloss, die
  Wegweiser-Infos stecken trotzdem in jeder Szene): Im Burghof wartet gleich nach dem Fluch der **zweite Held** (der nächste nach dem gespielten: Henrik →
  Ragnor → Kaspar → Henrik) – auch ihn hat der Fluch getroffen. Er erzählt vom Grafen und den Relikten, schickt einen ins
  Kolosseum und hält danach die Eingangshalle: nach jedem Relikt hat er dort Neues (wo der nächste Boss wartet, was hinter
  der Kellertür, der Turmtür und den rissigen Mauern liegt), mit fünf Siegeln steht er auf der Galerie am Siegeltor. Der
  **Bibliothekar** in der Bibliothek des Bergfrieds (neben dem Lesepult) kennt die Chronik des Grafen (einst Puppenspieler –
  Kaspar hat eine eigene Zeile), verrät mit dem Steinbrecher die Schatzkammer und heilt bei jedem Gespräch (HP, Herzen auf 10).
  Der **lila Tentakel** vom Schiff hat überlebt, wurde vom Grafen gefeuert und sitzt jetzt in einem Eimer Meerwasser: am
  Eingang des Kolosseums (Plan zur Weltherrschaft, Schritt 1: Beine besorgen – und der Tipp zur Rabenfeder), später auf
  der Himmelsbrücke (erobert die Wolken, zahlt 1000 Gold Schweigegeld, „nur leicht klebrig").
  Neue Szene: „!" über der Figur und eine grüne Marke auf der Karte; das Gespräch beginnt beim Herantreten, die Welt steht
  still. Sprung/Angriff/↑ schreibt die Seite fertig bzw. blättert, Start überspringt. Danach wiederholt ↑ vor der Figur
  den Rat. Das Fenster zeigt Porträt (Figur links, Held rechts), Namen und Schreibmaschinentext; es steht oben, wenn die
  Sprecher unten im Bild stehen. Gesehene Szenen liegen in `flag['story_<id>']`, Texte in allen sechs Sprachen in `i18n.js`
  (`story_<id>` = Seiten „A:/H:/K:/L:/T:Text", `story_<id>Again`).
- **Türen:** zurück in den vorigen Raum geht es am linken Rand (gegen den Rand laufen; ein goldener Pfeil erscheint),
  in Turmräumen ohne Rand (Sonnenturm, Kuppel-Aufstieg) mit ↑ an der Starttür. Torbögen mit ↑ betritt man ebenfalls mit ↑.
- **Eingangshalle als Knoten:** Kellerschacht im Boden → Katakomben, Turmschacht über dem Sims → Bergfried,
  Siegelschacht über der oberen Galerie → Thron der Nacht (erst mit 5 Siegeln; sonst Meldung „SIEGELTOR: n/5 SIEGEL").
- **Hinter den Bossen:** Große Halle (Riesenfledermaus) → Wintergarten, Marmorgalerie (Medusa) → Sonnenkathedrale,
  Gruft (Knochenriese) → zurück durch das Loch unter der Brücke, den Gruftgang und den Eisaufzug.
- **Bosse:** der Orb schließt kein Kapitel mehr ab, sondern gibt ein Siegel („SIEGEL n/5 – EIN NEUER WEG IST OFFEN");
  die Arena öffnet sich, der Boss bleibt besiegt (auch nach Neuladen). Beim Grafen gibt es wie gewohnt den Abspann.
  Zwischengegner (Tentakel, Eishexe) bleiben ebenfalls besiegt.
- **Einbahnen:** vom Schiff (Prolog), vom Eisturm (Rutschpartie) und von der einstürzenden Brücke führt kein Weg zurück;
  der Rückweg aus den Katakomben führt durch das Loch in der Gruft, den Gruftgang und den Eisaufzug hinauf in die Eishöhle.
- **Regionen:** ein Regionswechsel zeigt die Kapitelkarte als Regionsnamen (Ansage nur beim ersten Betreten). Kein
  Zeitlimit; Tod → Wiedereinstieg an der letzten Statue oder an der Tür, durch die man gekommen ist.
- **Karte Rand an Rand (wie in SotN):** Räume hängen nur noch an Seitenausgängen (`{ e: 'L'|'R', y }`) oder Schächten
  (`{ e: 'T'|'B', x }`) zusammen, und auf der Karte grenzen sie genau dort aneinander – keine ↑-Türen mehr zwischen Räumen.
  `Castle.mapReport()` liefert `{ bad: [], doors: [] }`, `Castle.selfCheck()` `[]`. Zusatzräume legen sich von selbst an
  ihren Randausgang (`mapAt` `null`). Umbauten im Schloss-Modus: Bibliothek → Schatzkammer und Glasturm → Verlies seitlich
  (rissiges Gestein am Rand), Loch in der Marmorgalerie ins Spiegelkabinett (Aufzug zurück), Kabinett → oben in den
  Spiegelschacht → Schachtfuß → Spiegeltunnel (zwei Zellen länger) → Foyer des Hoftheaters (erst mit allen Siegeln, zurück
  immer), Ballsaal-Aufzug durch die Luke ins Foyer, Foyer-Galerie → Zuschauerraum; Gruft (hinter dem Knochenriesen) → Kanal,
  Loch am Kanalanfang in die versunkene Kapelle, Lücke in der Stachelgrube der Eishöhle → Eisrutsche (erst mit Dash und
  Enterhaken, sonst Stachelgrube), Turmfuß der Rutsche → Eiskeller.
- **Aufzüge als Abkürzung** (`js/lift.js`, `.lift(x, Haltestellen, { id, start, lock, speed })`, von einer Seite verriegelt
  bis zur ersten Fahrt): **Eisaufzug** (Eishöhle ↔ Eiskeller ↔ Gruftgang ↔ Gruft; oben verriegelt, die Kabine wartet unter
  der Luke), **Pumpenschacht** (Kanal ↔ Kuppel des Wintergartens; vom Kanal aus verriegelt), **Himmelsaufzug**
  (Himmelsbrücke ↔ Menschenfalle; von unten verriegelt), dazu Hotelaufzug und Lastenaufzug im Bahnhof.
- **Kaleidoskop** (`js/kaleido.js`, über der Sonnenkathedrale: Treppe links im Vorplatz hinauf durch die Luke): liegende Röhre
  aus Buntglas in fünf Trommeln, die sich abwechselnd vorwärts und rückwärts um die Längsachse drehen; Steinringe mit Goldkante
  zwischen den Trommeln. Die Fenster sind die Figurenfenster des Glasturms (`Tiles.layer('glass', …)`, `Tiles.glassWins()`),
  um die Röhre gelegt – sie kreisen mit ihrer Trommel. Was oben im Mondlicht steht, wirft wie im Glasturm einen goldweißen
  Lichtschacht (Mantel, Kern, Streifen der Bleiruten, Lichthof, Staub), darunter farbiger Dunst über dem Abgrund. Unter jeder Trommel 17 Kacheln
  Abgrund mit zwei Ankerringen: nur mit der Peitsche zu schaffen (Bot-Test: Sprung + Doppelsprung + Luft-Dash kommen höchstens
  gut 10 Kacheln weit, mit den Ringen klappt jede Trommel); Fledermaus, Nebel und Wolf reißt der Wirbel zurück. Am Ende Truhe,
  Lebensgefäß und die **Prismenklinge** (ATT +6), dann durch die Luke hinab auf den Pfeiler der Kathedrale (Einbahn).
- **Ring-Schwung:** jeder Absprung vom Ankerring endet mit einem Salto in Flugrichtung.
- **Sonnenturm bröckelt** (Schloss-Modus, `crumbleTick`): wer auf einem Steinsims steht, löst nach gut einer halben Sekunde
  (Knirschen, rieselnder Staub) die Steine darunter samt Nachbarn; sie stürzen in Brocken ab und wachsen nach 5 Sekunden
  nach. Turmfuß, Pfeiler und die Simse unter den Engeln halten. Im Arcade-Modus bleibt der Turm wie er war.
- **Pendelhalle des Uhrturms** (`js/pendel.js`, links am Zahnradwerk über dem Mauervorsprung): sechs riesige Uhrpendel mit
  Scheibengewicht (stehen auf der Wölbung, `surfaceAt`/`carryAt`), Nachbarn gegenläufig – am Umkehrpunkt nur gut 3 Kacheln
  auseinander, dann hinüberspringen; in der Mitte ein Steinpfeiler. Dahinter das Zifferblatt von innen (Milchglas im Mondlicht,
  Spiegelziffern, die Zeiger laufen rückwärts). Am Ende Truhe, Lebensgefäß, **Taschenuhr des Grafen** (Amulett). Bot-Test:
  von Gewicht zu Gewicht bis ans Ende.
- **Steingolem im Golemstollen** (`js/golem.js`, links vom Eiskeller, Zwischengegner): bildschirmfüllendes PS2-Low-Poly-Modell,
  jedes Bild aus Felsquadern neu gebaut und mit der Software-3D gerastert, gezeichnet nach dem Licht (`drawLit`, eigene
  Fackelbeleuchtung). Augenlaser fegt über den Boden zum Helden und zurück (drüberspringen), flacher Laser mit dem Kopf am
  Boden in Kopfhöhe (ducken), Faust schwebt über dem Helden (Schatten) und kracht herab (Gesteinsbrocken), Brüllen lässt
  Steine aus der Decke fallen; ab halber Energie schneller, Laser doppelt. Treffbar nur das Runenherz im Bauch (im Stand mit
  Sprung, kniend nach dem Faustschlag vom Boden). Lohn: **Steinhaut** (Rüstung, DEF +6). Zwischengegner starten nur noch,
  wenn der Held in ihrer Arena steht (nicht von rechts hinter einer Wand).
- **Speicher- und Warpkammern als eigene kleine Räume** (eine Kartenzelle, Seitenausgang): Kasematte/Torstube (Burghof),
  Felsenkammer/Grottenportal (Brunnenschacht), Lesezimmer/Turmstube (Bibliothek), Sakristei/Kreuzgang (Kathedrale),
  Orangerie/Treibhaus (Palmenhaus), Vorzimmer/Seelenportal (über dem Seelenstrudel). Sie behalten den alten Schlüssel
  (`CHAMBERS`, 5. Feld) – Spielstände und freigeschaltete Portale bleiben gültig. Das Hotel behält Sternlampe und Aufzug.
  Jede Kammer ist eine kleine Kapelle (`js/kammer.js`, `def.hall`), bildfüllend 32 Kacheln breit ohne Mauersäulen (auf der
  Karte weiter eine Zelle: `def.mapW = 1`), drei Joche – ein großes Mitteljoch zwischen zwei Seitenjochen – unter einem Kreuzrippengewölbe mit
  Sternenhimmel in den Kappen, Rippen mit Goldfilet, Nasenbesatz am Schildbogen, goldener Schlussstein, Dienstbündel mit
  Blattkapitellen, Blendarkade im Sockel, ein großes Rosenfenster, dessen Mondlichtschacht senkrecht auf die Mitte fällt;
  Steinfarben nach Region. In der **Speicherkammer** steht dort der Brunnen als Ort der Rast (kein Sarg mehr): Plattform,
  achteckiges Becken, drei Schalen mit Kaskaden, leuchtendes Wasser, aufsteigende Lichter, zwei Kerzenständer – wer ihn
  erreicht, speichert, und das Wasser flammt auf; ein Bronzefrosch spuckt aus Prinzip ins Becken. In der **Warpkammer**
  schwebt das Portal: eine wabernde Ikosaederkugel in PS2-3D (`ChamberPortal`) über einem Runenkreis, von zwei Ringen umkreist,
  gesperrt matt und träge; ↑ öffnet die Schnellreise.
- **Lichterpassage** (`js/passage.js`, links am Bahnhof Krat, Bahnsteig links ↔ rechter Rand, Seitenraum 0:16): Einkaufspassage
  der Belle Époque unter einem Glastonnendach im Regen (Mond hinter nassem Glas, Blitze), Galeriegeschoss mit Rundbogenfenstern,
  Ladenzeile mit vergoldeten Schildern in sechs Sprachen (Hutmacher, Konditorei, Parfümerie, Puppenklinik), Café. Unten die
  Ladenzeile, darüber zwei Galerien über Treppen. **Schaufensterpuppen** (`Mannequin`) bewegen sich nur, solange der Held ihnen
  den Rücken zukehrt, und erstarren beim Hinsehen in einer neuen Pose (nur in Bewegung gefährlich, zerschlagbar);
  **Schaufenster** (`ShopWindow`) lassen sich einschlagen (Beute, zwei davon entlassen eine beleidigte Puppe);
  **Kristalllüster** (`FallingLuster`) klirren, wenn man darunter durchläuft, und stürzen. Am Ende auf der linken Galerie:
  Truhe, Lebensgefäß und der **Schirm mit dem Entenkopf** (Amulett, DEF +3, Glück).
- **Treppen statt Aufzügen** an allen 13 Ausgängen nach oben (Kolosseum, Kerker, Bahnhof, Katakomben, Kanal, Kapelle,
  Gruftgang, Spiegelkabinett, Kathedrale, Menschenfalle, Laboratorium, Seelenstrudel, Ballsaal): die Treppe endet in Reihe 0
  im Schacht und führt oben hinaus; wo der Platz nicht reicht, mit Podest (Bahnhof: der Sims am Stellwerk ist das Podest,
  Ballsaal: Fuß auf dem sicheren Zielpodest). Von oben kommend fängt man sich auf der Treppe. Die Abkürzungs-Aufzüge
  (`js/lift.js`) und die Aufzüge innerhalb eines Raums bleiben. Bot-Test: in jedem Raum hinauf und durch das Loch zurück.
- **Handy:** die Peitsche hakt per Touch zuverlässig ein (ein schräg nach unten gehaltener Stick zählt in der Luft nicht als ↓,
  ein zu früher Schlag wird 14 Bilder gemerkt, ein zweiter Tipp holt neu aus); im Pausenmenü bleiben A/B/II Tasten (vorher
  galt A als Tipp auf die Menüzeile in derselben Höhe – oft ZUM TITEL); Abschnitte, Meilensteine und Test-Werkzeuge per Tipp
  wählbar (zweiter Tipp startet), die Abschnittsliste rollt erst am Rand.
- **Laden eines Abschnitts / Meilensteins:** Ladebild sofort (erst gezeichnet, dann gebaut), Balken über den Vorbau nur des
  Zielraums (die übrigen Räume der Region bauen sich beim Betreten), dazu ein CSS-Lade-Kranz (`#loadspin`), der sich auch
  während eines großen Vorbaus weiterdreht. Abschnittswahl im Schloss = Testspielen: eigene Test-Spielstände, im Pausenmenü
  die TEST-WERKZEUGE (unverwundbar, alle Relikte, **alle Ausrüstung**, Stufe +5, Gold …).
- **Steingolem überarbeitet:** volle Auflösung (scharf), schräg zum Betrachter (etwa 45°, ferne Kamera ohne Fluchtverzerrung),
  gedrungen und breitschultrig, der linke Arm stützt sich auf, der Schlagarm kommt von der Schulter zum Helden hin; dunkle
  Kontur um den Felsleib, glühende Runenrisse; Steinquader in wechselnden Tönen mit heller Fase, leuchtende Kristallbüschel
  auf Schultern und Buckel, rieselnde Steinchen.
- **Pendelhalle überarbeitet:** Rostpendel (Messing- und Stahlstäbe mit Querjochen) mit Lyra, Messinglinse mit Perlrand und
  graviertem Sonnengesicht (blinzelt), wanderndes Glanzlicht, warmer Schein; dahinter Riesenzahnräder des Uhrwerks und
  Mondlichtschächte mit Staub aus dem Zifferblatt.
- **Pendelhalle zweistöckig** (40 Kacheln hoch, auf der Karte drei Zellen): Eingang rechts unten, unten über die sechs Pendel
  nach links, am linken Absatz eine Treppe hinauf, oben über drei Zahnrad-Riesenräder (Gondeln an den Speichen, oben rechts
  abspringen) zurück nach rechts zur Taschenuhr. Dahinter ein gigantisches Zahnwerk in PS2-3D (`GearWorks`: neun extrudierte
  Räder in drei Ketten und Tiefen, gegenläufig im Verhältnis der Zähne, Tiefendunst). Bot-Tests: Pendel unten, Treppe, Räder oben.
- **Brunnen der Rast in PS2-3D** (`ChamberFountain.mesh3d`): Marmorstufen, achteckiges Becken mit vertieften Feldern und
  Goldrosetten, Delfinspeier, gedrechselte Schalen, Goldknospe, Kerzenständer; eigene Kamera in der Bildmitte – im Vorbeigehen
  sieht man ihn schräg. Wasser als Ringflächen um den Schaft; Fontäne, Kaskaden, Wellen, Lichter als 2D-Schicht perspektivisch darüber.
- **Kaleidoskop im Kreuzgratgewölbe:** die Röhrenwand ist eine einmal in PS2-3D gerenderte Textur – die Figurenfenster des
  Glasturms (Pixel für Pixel) tief in schrägen Laibungen mit Wulstrippe, Goldfilet und Scheitelstein, dazwischen Dienste; zwischen
  den Fensterreihen Kreuzgratjoche mit Sternenkappen, Diagonalrippen und Schlussstein. Anfang und Ende der Röhre drehen sich mit.
- **Fundbüro** (`js/puzzle.js`, links an der Lichterpassage): Schalterrätsel – Hebel per Peitsche (Gepäckaufzug),
  Schrankkoffer auf die Gepäckwaage schieben, Stempel nach dem Dienstweg; Gelöstes bleibt gelöst (`Castle.setFlag`).
- **Versuchsstrecke** (`js/moto.js`, links am Automatenwerk durch den Hallenboden): Fahrsequenz auf dem Dampfrad „Krat I“ –
  ↑ aufsitzen, in Fahrtrichtung Gas, dagegen bremsen/wenden, Sprung (auf Holzschanzen mit deren Schwung), ↓ ducken unter
  Trägern (32 px Luft), Dash = Dampfstoß für den weitesten Graben, Peitsche vom Sattel (fegt auch Mauerbrocken weg), ↑ Hupe.
  Spielerzustand `ride` (entities.js: update/hurt/sprite rufen `Moto.*`), Gruben → letzter Prüfposten (−3 Energie).
  Zeitfahren (MotoGate/MotoGhost): Start/Ziel-Tor, Wendemarke am Prellbock, Medaillen Gold ≤ 32 s / Silber ≤ 40 s / Bronze ≤ 52 s
  (beim ersten Mal Beute), Bestfahrt als Geisterfahrer (`nachtmahr.moto`); eigene Musik „Dampfgalopp“ (audio.js `galopp`).
  Der Prüfmeister (MotoInspector, Werk-Automat auf einem Pult hinter der Strecke) hebt zum Start die Flagge, nickt bei Bronze/Silber,
  fällt bei Gold scheppernd um, gähnt ohne Medaille.
- **Rohrpostamt** (`js/puzzle.js` PzTube/PzTubeBoard, links am Fundbüro hinter dem Rückgabeschalter): Rohrpost für Personen – ↑ am
  Einwurf, Fahrt durch gläserne Rohre (Fahrzeug-Zustand `ride`), drei Weichen, Hebel A stellt J1, B stellt J2 und J3, C nur J3;
  Ausgänge RETOUR / UNZUSTELLBAR (Sack) / STRAFPORTO / ZUGESTELLT (Balkon mit Truhe und Lebensgefäß). Lösung: A und B an, C aus.
  Musik im Fundbüro und Rohrpostamt: „Amtsstuben-Walzer“ (audio.js `amt`, Schreibmaschine, Zeilenglocke, Wagenrücklauf).
- **Karten-Schnelltaste:** Tab oder Q, Ansicht-Taste, auf dem Handy ein Karten-Knopf oben rechts (nur im Schloss-Modus):
  im Spiel die durchscheinende Karte, in der Pause die große Karte.
- **Offene Aufzugsschächte** (`js/shaft.js`, Raum-Flag `openOut`): statt Blockwänden ein Stahlgitterschacht frei in einer
  Riesenhalle in PS2-3D – fest sind nur unsichtbare Gitterspalten ('G') neben der Kabine mit Öffnungen an den Haltestellen und
  schmale Absätze, die über den Raumrand hinaus weiterlaufen. Dahinter je Aufzug eine eigene Halle, Geschoss für Geschoss mit
  Tiefenparallaxe und Kolossalpfeilern vorn: Lichthof des Hotels Krat (Galerien, Messinggeländer, Kugellampen), Eisdom (Eissäulen,
  Eiszapfen, Kristalle, leuchtende Adern), Pumpwerk (Glaswand, Nietträger, Rohre, Schwungräder mit Kolben), Himmelsaufzug außen an
  der Sonnenkathedrale (Stadt der Kathedralen). Bot-Test: alle Haltestellen und Ausgänge, während der Fahrt bleibt der Held im Gitter.
- **Kaleidoskop gestreckt statt zerschnitten:** jede Trommel zeigt genau eine Fensterspalte (Dienst bis Dienst), auf ihre Länge
  gestreckt – kein Steinring schneidet mehr ein Fenster durch. Die Kreuzgratjoche höher (140) und tief gewölbt: Kappen in zwei
  Stufen, dicke Diagonalrippen, Scheitelrippe, Gurtbögen mit Goldfilet, große Schlusssteine und Knaufe.
- **Steingolem aus Felsbrocken:** jeder Block gefast (26 Flächen) und leicht verschoben, Gliedmaßen als achteckige Felsstränge.
- **Der Erweckte:** runde Glieder (Achtkant), flacher Haarschopf mit Pony, Halsbolzen, zerlumpter brauner Gehrock mit zu
  kurzen Ärmeln, Stirnnaht. **Labor:** Wimshurst-Maschine mit gegenläufigen Glasscheiben (Messingsektoren, Funkenstrecke) und
  zwei Jakobsleitern, an denen der Lichtbogen aufsteigt.
- **Riesenpendel in PS2-3D** (`Pend3D`): Rostpendel aus fünf Stäben in der Tiefe versetzt, Querjoche, Lyra mit Rosette,
  extrudiertes Zahnrad am Drehpunkt, Messinglinse als Drehkörper mit Perlrand und graviertem Sonnengesicht; Linse jetzt 64 px
  (Bot-Test: alle Sprünge). Unter dem Gewölbe der oberen Etage drehen sich Räderwerke wie im Uhrturm; im Uhrturm schwingt
  dafür ein Riesenpendel tief hinten als Kulisse (`PendulumDeco`).
- **Easter-Egg-Figuren** (`BEATS` speed/bones/chick/barber/carto, Zeichnungen `EGG`, Texte `story_*` in 6 Sprachen): Geist eines
  Speedrunners im Kaleidoskop (seit 1391 halb in der Wand), Knochen-Kalle, Betriebsrat der Skelette, im Gruftgang (500 Gold
  Streikgeld), das Wandhuhn als Fundsache Nr. 13 im Fundbüro, Friseur Anatol (Medusas Friseur, Tipps gegen den Blick) in der
  Lichterpassage, der Kartograf oben in der Pendelhalle (verzweifelt am ständigen Anbauen, erklärt die Karten-Taste).
- **Abschnittswahl zeigt Neues:** `RECENT` in castle.js markiert die zuletzt geänderten Räume mit NEU, darunter steht, was sich
  geändert hat; SUB springt zum nächsten markierten Abschnitt. Bei jeder Auslieferung neu füllen.
- **Urkunden** (Errungenschaften, `ACH` in castle.js): 15 Urkunden vom „Amt für Heldentaten“ (Zimmer 13B) – Kammerjäger,
  Steuerprüfung, Kartograph ehrenhalber („der Architekt baut schon an“) usw. Geprüft alle 30 Bilder am Spielstand, erteilt =
  `flag['ach_' + id]`; Einblendung unten mit Wachssiegel, sobald der Wegweiser schweigt, mehr als drei auf einmal (älterer
  Spielstand) als Sammelmeldung. Status → fünfte Seite: Liste mit Siegeln, ↑↓ wählt, darunter die Bedingung. Jede Urkunde
  zahlt 500 Gold Aufwandsentschädigung (`ACH_PAY`, gleich beim Erteilen gutgeschrieben); dazu der Tusch `cert` (Stempel + Fanfare).
- **Bosskammern wie in SotN** (`World.updateGates`/`drawGates`): schließt eine Arena (Haupt- und Zwischengegner), rasseln an beiden
  Rändern eiserne Fallgitter herab (Kette, Aufschlag mit Staub und Beben), nach dem Sieg (Miniboss) bzw. dem Siegel (Hauptboss)
  ziehen sie sich wieder hoch; Höhe von der Decke über der Spalte bis zum Boden unter dem Helden. Nicht in Turmräumen (`wrap`).
  Dazu: `Game.applyView` setzt die Kamera im Bosskampf nicht mehr auf den Helden zurück (Vollbild/Adressleiste sprengten sonst die Arena).
- **Amt für Heldentaten, Zimmer 13B** (links am Rohrpostamt, `heldenamt`, Stufe 3; js/amt.js): Aktenarchiv (Thema `library`) mit
  Oberamtsrat Stempelmann am Stehpult (stellt die Urkunden aus, nach dem Boss zweite Szene) und der Bosskammer des **Amtsschimmels**:
  ein PS2-Pferd aus Aktenordnern, gerollten Formularen und losen Blättern, Hals wie ein Ziehharmonika-Ordner, Kopf = Holzstempel mit
  Pferdegesicht. STEMPEL (Kopf hebt sich, folgt dem Helden, knallt herab: „ABGELEHNT!“, roter Abdruck, danach steckt er fest und ist
  treffbar), FORMULARSTURM (Formulare abwechselnd tief/Kopfhöhe), AKTENLAWINE (bäumt sich auf, Akten fallen aus den Regalen); ab halber
  Energie Doppelstempel, schneller, mehr Formulare. Eigenes Lied **Amtsmarsch** (g-Moll, Umtata, Trommelwirbel, Schalterglocke), in
  Phase 2 nur schneller. Lohn: **Dienstsiegel** (Amulett, DEF +1, Urkunden zahlen doppelt – `gear('cert')`), Urkunde „Antrag genehmigt“.
  - **Neuer Amtsschimmel** (20261105): ein Schimmel aus Leitz-Ordnern (`AmtModel` in js/amt.js). Rumpf, Kruppe, Brust und
    Beine sind einzelne Ordner (Rücken mit Etikett im Rahmen, farbigem Reiter, Griffloch im Metallring, Metallkante), Hufe sind
    Holzstempel, der Hals eine Fächermappe mit Papiermähne. Der Kopf ist ein Pferdekopf aus gefaltetem Papier als Stempelgriff
    (Blender-Low-Poly, Szene `nm_schimmel`, als Netz mit Normalen in js/amtmesh.js).
    - Auftritt: In der Kammer liegt ein Haufen Ordner (`AmtPile`). Betritt der Held die Kammer, fliegen die Teile der Reihe nach im
      Bogen an ihren Platz (Hufe, Beine, Rumpf, Kruppe, Brust, Hals, Kopf). Dann schnürt sich das Amtsband zu, das Siegel klatscht
      drauf, die Augen glühen.
    - Danach der **Urschrei**: ElevenLabs-Probe `voice/neigh_big.mp3` plus Dröhnen. Er bäumt sich auf, die Wände wackeln
      (`W.wobble`: zeilenweiser Versatz wie SNES-HDMA, `drawWobble`). Erst dann folgen Musik, Namensband und Wortgeplänkel
      (`holdIntro`, `lateIntro`, `W.bossEntrance`), danach der Kampf. Beim Wiedersehen geht der Zusammenbau doppelt so schnell.
    - Besiegt fällt er wieder zum Haufen. Peitscht man den Haufen, hüpft der Kopf und antwortet mit Beamtensprüchen (`amtPile0–3`).
- **Behördentrakt hübscher** (20261105-0209): Die Paternoster-Kabinen sind neu gerendert (helle Eiche, Messing, gelb-schwarze Warnkante,
  Dienstvorschrift an der Rückwand, Innenlicht). Im Schacht liegen jetzt Ziegelfugen und Stahlschienen mit Nieten, an jeder
  Stockwerkskante eine Warnkante, und der Lampenschein ist wärmer. Das Gemälde in der Hotel-Tapete zeigt jetzt den Hotelier:
  eine Blender-Büste (Szene `nm_portrait`) mit Zwirbelbart, Monokel, Vatermörder, Fliege und Orden als kleines Ölbild
  (`hotelier` im Atlas, über `Castle.art`/`whenArt` nachträglich in die Tapete gemalt), mit Eckrosetten, Namensschild und
  Bilderleuchte.
- **Aktenkeller und Reißwolf** (20261105-1323; js/keller.js, 2. UG links am Paternoster, `aktenkeller`, Karte eine Zellenreihe hoch):
  - Rollregalanlage: drei fahrbare Regale (2, 4 und 6 Kacheln hoch, Blender `rr2/rr4/rr6`) auf einer Schiene. Am Steuerpult
    stehen die Kurbeln A, B, C mit Lampen (grün = an der Wand). Ein Hieb schickt das Regal zur Registraturwand, an der Wand zurück,
    während der Fahrt kehrt es um. Es rollt, bis es anstößt, und schiebt den Helden mit, bis er klemmt („KLEMMT!“). Die festen
    Kacheln ('G') wandern im Raster mit, Mitfahren oben drauf geht. Der Größe nach an der Wand ergibt sich eine Treppe zur
    Wandkrone, und keine Reihenfolge blockiert.
  - **Reißwolf** (Zwischengegner): ein Aktenvernichter mit Wolfskopf (Blender-Netz js/rwmesh.js, Szene `nm_reiss`). Er hat
    Bürostuhlrollen, das Netzkabel ist sein Schwanz.
    - Auftritt: Er steht stromlos in der Ecke, dann kriecht der Stecker in die Steckdose, LEDs flackern, der Motor dreht hoch, er
      heult. Erst danach kommen Namensband, Geplänkel und das Lied `reisswolf` (e-Moll-Galopp, 168 BPM).
    - Angriffe: SCHREDDERN (saugt an, nach drei verschluckten Ordnern PAPIERSTAU mit Schaden ×1,8, sonst nur ×0,4), KONFETTI
      (Fächer aus Papierstreifen) und ANSTURM (Wandprall: benommen und verwundbar). Ab halber Energie Stufe 5 (Partikelschnitt).
    - Besiegt platzt er in Konfetti. Lohn: Reißzahn (Waffe, ATK +6) und die Urkunde „Datenschutz gewährleistet“.
  - Geräusche `howl`/`shred` vorerst als Synth (ElevenLabs war belegt; `Audio8.sample` nimmt Proben, sobald sie in `SAMP` stehen).
- **Mahre, kritische Treffer, neues HUD** (20261111; js/mahr.js): Der Held trägt einen Traumfänger. Besiegte Gegner lassen
  manchmal ihren **Mahr** zurück (ein dunkler Wisch mit Augen), der zum Helden fliegt und sich im Traumfänger verfängt.
  - **18 Mahre in zwei Plätzen** (`Mahr.LIST`): zehn **Ruf-Mahre** (↑ + SUB, kosten MP: Flederschwarm, Knochenwurf mit
    zwei Bodensprüngen, Feuerspucke, Seitenhagel, Rabensturz, Steinblick mit Versteinerung, Aktenwurf als Bumerang, Eilbrief,
    Sternschnuppe mit Zielsuche, Sternenkranz) und acht **Bann-Mahre** (wirken dauernd: Ausweichen, DEF, Regeneration, Krit,
    MP-Regeneration, Glück, Gold, weniger Schwerkraft). Je Platz einer; Status → Seite MAHRE (↑↓ wählen, Angriff legt an/ab).
  - **Rang I–IX:** derselbe Mahr noch einmal hebt den Rang (Ruf: +15 % Schaden je Rang, Bann: bessere Werte); bei Rang IX
    gibt es 500 Gold. Fangquote = Grundquote × Glück × Blutmond + Pechschutz (`mpity_<id>`); der erste Mahr ist sicher.
  - Ruf-Schaden = Grundwert × Rang × Stärke des Helden (wie der Peitschenhieb, `strMul`); die Explosion der Feuerspucke zählt halb.
  - **Kritische Treffer:** Quote 3 % + 1,5 je Glück + Bann-Mahr, Schaden ×1,75; goldene Zahl mit „!“, Ring, Funken, kurzer Halt.
    Ein Hieb ist als Ganzes kritisch oder nicht (`swingCrit(atkId)`), damit Mehrfachtreffer zusammenpassen.
  - **Versteinerung:** `e.stunT` hält gewöhnliche Gegner an (world.js überspringt ihr `update`), `Mahr.Stone` zeigt den Schleier.
  - **Schloss-HUD neu** (`Game.drawCastleHud`, Arcade bleibt): Medaillon mit Stufe, EXP als grüner Ring; glatte HP- und
    MP-Leisten mit Zahl, deren Länge mit dem Höchstwert wächst, Nachlauf in Weiß, wandernder Glanz; Bossleiste mit Schädel
    nur im Kampf; der Ruf-Mahr teilt sich das Fach mit der Spezialwaffe (grau, wenn die MP nicht reichen); Münze vor dem Gold.
    Geprüft bei 256, 300, 426 und 640 Pixeln Breite (test_hud.js).
  - Urkunden „Traumfänger“ (erster Mahr) und „Albtraumsammler“ (alle 18). Tests: test_mahr.js, test_hud.js.
  - **Feinschliff dazu** (zweiter Stand am selben Tag; test_polish.js, test_audio2.js, test_filter.js):
    - *Geräusche:* acht neue (`mahrRise`, `mahrCatch`, `cast`, `mpOut`, `ghost`, `crit`, `stone`, `heartbeat`, alle Synth – ElevenLabs
      war nicht verbunden). Oft gehörte Geräusche (`VARY` in audio.js: Peitsche, Treffer, Schritte …) klingen jedes Mal ± 5 % anders.
    - *Musik:* Hi-Hats auf den Sechzehntel-Nebenzeiten leiser und leicht unregelmäßig (`hatVel`, Position kommt aus dem Cursor
      `c.s`); bei wenig HP rückt die Musik hinter einen sanften Tiefpass (`Audio8.danger`, 3,4 kHz), dazu Herzschlag im Takt des
      roten Warnrands. `Audio8.filterHz` zeigt den Filter für Tests.
    - *Grafik:* Zauberkreis mit Lichtsäule beim Ruf (`Mahr.Glyph`), vierstrahliger Stern beim kritischen Treffer (`Mahr.CritStar`),
      violettes Glimmen an Gegnern, deren Mahr noch fehlt (`mahrHint`), im HUD grüner Blitz bei Heilung, Medaillon-Blitz beim
      Stufenaufstieg, MP-Zahl blinkt rot, wenn der Ruf nicht bezahlbar ist.
    - *Gameplay:* Versteinerte sind spröde (Treffer ×1,5, Splitter); Perfekt-Ausweichen gibt 6 MP, und in der Zeitlupe danach
      ist jeder Hieb kritisch (`critNow`).
  - **Dritter Stand** (mit dem eingemischten Zweig `polish-20261106`: schmale Schirme, Namensband, Vorbau; test_polish2.js, test_shadow.js):
    - *Grafik:* Bodenschatten unter Held, Gegnern und Beute (`W.drawGroundShadows`, nur im flachen Zeichenweg – nicht auf Turmmänteln
      und gewölbten Räumen): ragt seitlich unter den Füßen hervor, wird im Sprung kleiner und blasser, ab 72 px Höhe keiner.
      `noShadow` am Gegner schaltet ihn ab.
    - *Gameplay:* Herzen und Gold kommen dem Helden die letzten 36 px entgegen (`MAGNET` in enemies.js, nur Schloss); kritische
      Treffer schieben laufende Gegner 5 px zurück; der Stufenaufstieg füllt die MP; **↑ + Karte** wechselt im Spiel reihum zum
      nächsten gefangenen Ruf-Mahr (`Castle.mahrCycle`, erst ab zwei Ruf-Mahren – sonst öffnet die Taste wie gewohnt die Karte).
      Die Hilfezeile der Seite MAHRE zeigt das im Wechsel (`mahrSwap`, 8 Sprachen).
  - **Vierter Stand** (20261112; Rückmeldung „Schrift im HUD und Menü teils verdeckt“, „Fledermäuse und Helden hübscher“):
    - *Lesbarkeit:* Gold steht jetzt mit Münze unter den Leisten (über dem Waffenfach stieß die Zahl an dessen Rahmen; im
      Bosskampf steht dort die Bossleiste), die HP-Zahl endet vor dem Waffenfach. Status, Karte und alle `panel()`-Seiten sind
      deckend – vorher schien das HUD als blasse Geisterschrift durch. `Font.draw` macht zu breite Zeilen lesbar schmaler:
      erst schmalere Leerzeichen (`opts.sp`, Buchstaben bleiben scharf), dann geglättet aus einem Puffer (das frühere Stauchen
      ließ Pixelspalten wegfallen). Leere Auftragsliste bricht um, Verwandlungsnamen weichen dem Befehl. test_menus.js
      fotografiert HUD, Pause, alle Statusseiten, Ausrüstung und Karte bei mehreren Breiten.
    - *Fledermaus:* neu als Pixelgrafik im Code (`batPixel` in sprites16.js: von vorn, Flughäute in drei Feldern mit
      Fingerknochen, Ohren, glühende Augen, 16 Phasen, ruhend kopfüber im Mantel); das vorgerenderte Low-Poly-Modell aus dem
      Atlas wird nicht mehr geladen. Blender und Meshy waren nicht verbunden.
    - *Helden:* die Blender-Bilder werden beim Bauen nachgeschärft (`polish3d` in hero.js: harte Kante, mehr Kontrast und
      Farbe, gestufte Töne, Auge unter dem Stirnband an der Stelle `e` des Kopfrasters; beim Blinzeln zu). test_art.js zeigt beides.
  - **Fünfter Stand – erster Schritt Richtung HD-3D** (20261112; Leitlinie des Users: von 16-Bit schrittweise zu einem
    Bloodstained-artigen HD-3D-Look, mit Augenmaß, ohne das Gesamtgefüge zu gefährden – immer ein abgegrenztes Stück je Runde,
    Bildgrößen, Anker und Trefferflächen bleiben):
    - *Helden neu aus Blender:* `HEROES.exportRig(id)` liefert je Pose die Gelenke (47 Posen, Schlüssel = Hash der Pose). Ein
      Blender-Skript (hero_bl.py, über den Add-on-Socket 127.0.0.1:9876) baut daraus je Pose eine 3D-Figur aus Kugeln und
      Ellipsoiden (drei Lichter: Führung von oben links, kaltes Gegenlicht, Kante von hinten), rendert orthografisch mit 12-facher
      Überabtastung; pack.py verkleinert vormultipliziert auf 34×36, härtet die Kante, stuft die Töne leicht und setzt die
      Bilder an die Plätze der vorhandenen Karte in chars3d.js (die Karten bleiben unverändert). Vier Figuren mit eigenem Aussehen:
      Henrik, Ragnor (nackter Oberkörper, Fellmantel, Schwert), Kaspar (Porzellan-Marionette im Gehrock, Hellebarde), Henrik als
      Abenteurer (Hut, Jacke, Tasche). `polish3d` setzt nur noch die harte Kante und das Auge.
    - *Graf neu aus Blender* (count_bl.py): drei Posen 100×88 von vorn – Umhang als gefaltete Fläche mit gebogtem Saum und
      schwarzem Rand, spitz aufgestellter Kragen, Frack mit Hemdbrust, roter Weste und Orden, blasses Gesicht mit glühenden Augen.
      Augenhöhe wie zuvor (y 17), damit der Augenschein im Spiel passt. Bilder ersetzen count_* in img/creatures3d.png.
    - *Musik:* Rückmeldung „Percussion stolpert, weniger Techno, harmonischer“ → die gemeinsamen Schlagzeugmuster (FOUR, DK,
      FILL…, PFOUR, GFOUR) sind jetzt ein Rock-Takt (Kick auf 1, vor 3 und auf 3, Snare auf 2 und 4, Hi-Hat auf den
      Achtel-Nebenzeiten, Tom-Wirbel statt Rausch-Anstieg), die Zufallsbetonung der Hi-Hats ist weg, das Pumpen der Melodie bei
      jeder Kick fast weg (0,45 → 0,88), Schlagzeug-Bus leiser (0,5–0,9), zweite Stimme und Streicherfläche lauter, Kratzbass
      leiser. test_songs.js spielt alle 31 Lieder an und prüft die Spurlängen.
    - *Zweites Stück (20261112):* Riesenfledermaus neu (gbat_bl.py: 8 Schlagphasen × Maul zu/auf + ruhend, 128×84, Hautfelder
      als gewölbte Gitterflächen zwischen den Fingern) und die Rig-Gegner Ghul, Fischmensch, Ritter (hero_bl.py mit `head`-Stil
      'zombie' / 'fish' / 'helmet', Posen aus `HEROES.exportRig('monsters')`, Aufruf mit `rid`).
    - *Drittes Stück (20261113):* Skelett (einfach und doppelt groß als Knochenriese) und Sonnenwächter (doppelt groß) aus
      hero_bl.py (`head: 'skull'`, `ribs`, `metal` für glänzende Rüstung; `CFG.S` wählt die Posen der Auflösungsstufe,
      pack.py verkleinert mit Faktor K auf 68×72). Damit sind alle Rig-Figuren neu.
    - *Gameplay dazu:* Statusseite 6 KOPFGELD (`bountyList`, `drawBounties`), Rückweg-Portal `ReturnGate` nach `bossReward`
      (↑ öffnet die Schnellreise; wird vor Türen geprüft und nicht auf Türen gestellt).
    - *Musik dazu:* `harmonyP2` – gebrochene Achtel-Akkorde (`alberti`), in der Wiederholung die Melodie eine Terz tiefer
      (`thirdBelow`, natürliches Moll; leiterfremde Töne bekommen die große Terz).
    - *Viertes Stück (20261113):* Medusa (ruhig / fauchend, 72×64), Medusenhaupt, Gespenst, Flammenschädel, Seeadler, Rabe
      und Knochensäule aus `tools/blender/rest_bl.py` (frei modelliert, kein Rig); `pack_rest.py` setzt die 18 Bilder an ihre
      Plätze in `img/creatures3d.png`. Damit sind alle Kreaturen des Atlas neu; das Schlangenhaar und der Schwanz der Medusa
      werden weiter im Spiel gezeichnet (Farben des Leibs darauf abgestimmt).
    - *Fünftes Stück (20261113):* Requisiten aus `tools/blender/props_bl.py` – Kerze, Fackel (ersetzen `S.candle`/`S.torch`),
      Standleuchter und Feuerschale (`Sprites.S.props3d`, Atlas `img/props3d.png`, Karte in `js/props3d.js`; `pack_props.py`).
      Paternoster-Kabine neu (`pcabin_bl.py`, `pack_pcabin.py` setzt sie in `img/krat3d.png`). Truhe und Kronleuchter bleiben
      die Polygonmodelle mit Echtzeit-Perspektive.
    - *Dazu (20261113):* Arrangeur in `js/audio.js` (`arrange`: lange Form A B C D … je Lied, Orchesterstimmen fl/hrp/str/brs/
      tmp/glk; `Audio8._songs` = Original fürs Taktduell, `Audio8._arr` = gespielte Form; `play(name, then, fade, at)` springt
      an eine Stelle). Schnellreise zu jedem betretenen Raum (`roomDoors`, `tripList`, `tripMove`). Paternoster-Eilgang
      (`Pater.v`). Schacht-Prüfung `shaftAudit` im Selbsttest (Einbahn-Schächte: Eisrutsche, Eiskeller).
    - *Sechstes Stück (20261113):* Sammelgegenstände aus `tools/blender/items_bl.py` (Herzen, Geldsäcke, Braten, Kristallkugel)
      im Atlas `img/props3d.png` (`pack_props.py <r_props> … <r_items>`); 1UP, Peitschen-Aufwertung und die Wurfwaffen bleiben
      gezeichnet (die Wurfwaffen sind zugleich Geschoss und HUD-Bild). Musik: `bridge` je Lied = eigene Mittelteil-Melodie in der
      Grundtonart (Burghof, Katakomben, Bergfried, Boss). Aufzüge: `Elevator` 1,2 px je Schritt, kurze Pausen, kommt auf Wunsch;
      `ShortcutLift` Grundtempo 4,2.
    - *Siebtes Stück (20261113), erster Hintergrund:* Thema `crypt` – Arkadenwand und ferne Ebene aus
      `tools/blender/crypt_bg_bl.py` (orthografisch, 512×208, nahtlos; Mauerwerk als Ziegeltextur über die Weltposition,
      Bogensteine als einzelne Quader, Punktlichter in den Nischen), `pack_bg.py` verkleinert und tönt sie nach `img/bg/`.
      `js/bg3d.js` lädt die Bilder; `buildBg('crypt')` meldet sich mit `BG3D.on` an und tauscht die Ebene `wall` aus, davor
      liegt neu `far3d` (Parallaxe 0,22). Weitere Themen lassen sich genauso anhängen (Eintrag in `SRC`, Haken im Thema).
    - *Achtes Stück (20261113):* Themen `tower` und `cave` aus `tools/blender/bg2_bl.py` – Uhrturm: Quaderwand mit Pilastern,
      Balken, Spitzbogenfenstern, Steinring um die Uhr (Zifferblatt und Lichtbahnen legt `buildBg` weiter darüber); Grotte:
      Felswand als verschobene Fläche aus periodischem Sinus-Rauschen (darum nahtlos), flach schattiert, und Tropfsteinsäulen.
      `pack_bg.py` hat je Bild eigene Tönung (`JOBS`).
    - Nächste Schritte der Leitlinie (noch offen): die übrigen Hintergründe sind schon aufwendig gezeichnet oder in Echtzeit-3D;
      später eine höher aufgelöste Ebene für Figuren.
  - **Sechster Stand – alle Bosse im Wegweiser, weniger Lauferei** (20261112; Rückmeldung „zu viel Backtracking“, „neue Bosse
    nicht einbezogen“, „Infernax-Fluss“):
    - *Nebenbosse als Ziele:* `goal()` wählt jetzt zwischen dem Hauptweg (`mainGoal()`, Liste `GOALS`) und dem nächsten
      erreichbaren Nebenboss (`sideGoal()`: alle Räume mit `.mini`, deren Boss in `MINI_NAME` steht). Ein Nebenboss kommt dran,
      wenn seine Gefahrenstufe kleiner ist als die des Hauptziels und `hopsFrom(…, true)` einen Weg durch offene Tore findet –
      nach Stufe, dann nach Entfernung. Der Mond hängt an der Mondkanone (kein Türweg): nach dem Sternbild zeigt das Ziel auf
      die Sternkuppel. Text „NEBENBOSS: {0}“ (`castleGoalBoss`), Ort = Raumname (`whereRaw`). Neue Nebenziele sagt `goalTick`
      von selbst an. `Castle.goalInfo()`, `Castle.sideBosses()` für Tests.
    - *Bosszähler* auf der Statusseite (`bossTally`, 16 = 6 Arenen + 10 Nebenbosse).
    - *Schnellreise von überall:* Pause → SCHNELLREISE (`travelOk`, `openTravel`, Zustand `warp` wie in der Warpkammer), nicht im
      Bosskampf, nicht im Vorspiel; vorgewählt ist die Kammer in der Region des Ziels.
    - *Fluss, zweiter Teil:* `bossDoors()` nimmt schon betretene Räume unbesiegter Bosse in die Reiseliste auf (Ankunft am
      Raumeingang, `place: 'start'`), **↓ + Karte** öffnet die Reise aus dem Spiel, `bossReward()` zahlt nach jedem Bosssieg
      Kopfgeld (Stufe × 1000 bzw. × 2000) und füllt HP und MP; einmaliger Hinweis `travelTip`. test_flow.js prüft alles.
    - Offen für den „Infernax-Fluss“: Abkürzungen als echte Türen zwischen den Regionen, sichtbares Rückweg-Portal in der Arena, Aufträge mit Lohn.
    - CHANGELOG.md im Projektstamm führt je Build auf, was neu ist und was beim Testen anzusehen ist – bei jeder Veröffentlichung ergänzen.
      Seit 20261113 auch im Spiel: Optionen → CHANGELOG (Zustand `changelog`, `Game.chgLayout/updateChangelog/drawChangelog`);
      die Daten erzeugt `python tools/make_changelog.py` aus CHANGELOG.md nach js/changelog.js – vor jedem Commit neu erzeugen.
- **Feinschliff über das ganze Spiel** (20261106, zweite Runde):
  - **Rundgang durch alle 86 Räume** (test_sweep.js): jeder Raum betreten, 3 s laufen lassen, ein Bild je Raum, Fehler je Raum.
    Ergebnis: keine Fehler, Selbsttest sauber.
  - **Glühen nachgeschärft**: In hellen Gebieten (Zwinger bei Blitz, Sonnenkathedrale bei Tag, Himmelsaufzug, Ballsaal,
    Theaterfoyer) wusch das Glühen das Bild weiß aus. Die Schwelle ist jetzt x⁵ statt x³ (nur wirklich Helles glüht), dazu
    niedrigere Stärken für helle Themen in `BLOOM` (sun, cathedral, spire, theater, courtyard, ballroom …).
  - **Texte pixelgenau geprüft** (test_text.js, alle 1040 Schlüssel in allen acht Sprachen mit der Spielschrift):
    - Bestiarium und Urkunden höchstens 2 Zeilen à 260 px, Gegenstandsbeschreibungen 1 Zeile ≤ 402 px, Namen ≤ 200 px.
    - Dialoge höchstens 4 Zeilen à 298 px, Grammophon-Sprüche 2 Zeilen à 232 px.
    - 13 Überlängen gekürzt (Pointen erhalten): u. a. Erweckter, Steingolem, Schaufensterpuppe, Taschenuhr, Prisma,
      Entenschirm, Sternbild (es), Gummihuhn (fr), Taktduell-Spruch.
    - Die Herausforderung des Grammophons (`taktHi`) erscheint jetzt im Countdown des Taktduells; vorher war sie nie zu sehen.
  - **Lautstärke der Lieder angeglichen** (`SONG_GAIN` in audio.js, eigener Gain-Knoten `songGain` zwischen Musikbus und
    Pausenfilter): drei Echtzeit-Messläufe (RMS). Die Messung schwankt je nach Rechnerlast um ±2 dB, deshalb ist nur korrigiert,
    was in allen Läufen übereinstimmte: Amtsstuben-Walzer ×1,6, Sonnenkathedrale ×1,2, Fahrstuhlmusik ×1,15; Dienstweg, Graf und
    stage2 ×0,8.
  - Stationshinweise („Mondkanone: ↑ einsteigen …“, Rohrpost) verschwinden beim Start der Fahrt, statt über dem Flug stehen zu
    bleiben.
- **Mond** (20261106; js/mond.js): In der Sternkuppel steht nach dem Sternbild die Mondkanone des Amtsleiters (Jules Verne
  lässt grüßen).
  - **Mondkanone** (`Mond.Cannon`, k 'cannon'): ↑ davor → Zustand 'cannon'. Mündungsblitz, Bildschirmbeben, Flug durchs All
    (Sternstreifen, der Mond wächst in der Bildmitte, Kapsel mit Feuerschweif), Weißblende, Landung. Die Rückkehrkapsel
    (k 'capsule') steckt schräg im Mondboden und fliegt zurück (die Erde wächst). Die Ankunft wickelt die Kanone/Kapsel im
    Zielraum ab, wie beim Rohrpost-Express. Der Selbsttest zählt Reisen per Kanone und Express als Verbindung.
  - **Mondmeer** (`mondmeer`, 96×30, Karte `MOON_AT` [-25, -12] hoch über der Sternwarte): geringe Schwerkraft
    (`room.grav = 0.42`, Sprung 100 statt 44 px, langsameres Fallen). Dazu die Erde am Himmel mit Kontinenten, Wolken,
    Nachtseite und Atmosphäre (`Mond.EarthSky`) über dem Sternenhimmel aus js/stern.js.
    - Das Höhlen-Thema erscheint als graues Mondgestein: `room.mono` ist ein Filter, die Kacheln werden in einen Puffer
      gezeichnet und einmal gefiltert aufgetragen. `room.amb` überschreibt die Dunkelheit, `room.bloom` das Glühen.
    - Felsnadeln, schwebende Mondbrocken, zwei Krater im Boden, Truhe, Lebensgefäß. Schild „Außenstelle Mond – geöffnet bei
      Vollmond, Wartenummern bitte festhalten, sie schweben“.
    - Gegner: **Mondkälber** (hüpfen in hohen, weichen Bögen auf den Helden) und Sternschnuppen.
  - **Krater** (`krater`, 44×22): **Der Mann im Mond** (Zwischengegner `mond`, 100 HP). Eine große Mondscheibe mit Gesicht,
    gezeichnet hinter den Kacheln: Sie geht beim Auftritt hinter dem Kraterrand auf. Die Augen folgen dem Helden, er blinzelt.
    Treffbar sind nur die offenen Augen; nach jedem Angriff ist er müde (Schaden ×1,5).
    - **Vollmond**: Pusten (Backen blähen sich, schiebt den Helden zum Kraterrand, Staub fliegt) und Käsebrocken im weichen Bogen
      (`Mond.Kaese`, ein `EProj`, also per Konter zurückschlagbar).
    - **Halbmond** (ab zwei Dritteln): Der Schatten wandert über die linke Gesichtshälfte, das linke Auge ist nicht zu treffen.
      Dazu die Mondsichel als Bumerang: erst tief (drüberspringen), dann hoch zurück (drunter durch); sie lässt sich nicht
      zerschlagen.
    - **Neumond** (ab einem Drittel): fast dunkel, der ganze Krater wird finster (`room.amb` 0,62), die Augen glühen rot. Dazu
      Mondbeben (fällt auf den Boden, Bodenwellen) und Sternregen.
    - Sieg: Er versinkt hinter dem Kraterrand und weint Mondstaub. „Er hinterlässt einen Mondstein und einen Hauch von Käse.“
      Lohn: **Mondstein** (Amulett: Schwerkraft −15 % überall, `Castle.floaty`, LUCK +1) und die Urkunden „Ein kleiner Schritt“
      (gelandet) und „Mondfinsternis“.
  - **Musik**: „Mondmeer“ (a-Moll mit neapolitanischem B, 84 BPM, lange Melodietöne mit Vibrato wie ein Theremin, Sci-Fi-Piepser)
    und „Mann im Mond“ (a-Moll, 168 BPM).
  - **Abwärtshieb federt** (überall): Trifft der Hieb nach unten (↓ + Angriff in der Luft) einen Gegner, eine Panzerung, ein
    Geschoss oder eine Kerze, schnellt der Held hoch wie auf einem Pogo-Stab (Doppelsprung und Luft-Dash wieder frei).
    `W.whipAt` zählt dafür die Treffer.
- **Sternwarte des Amtsleiters** (20261106; js/stern.js): Der Amtsleiter ist Hobby-Astronom, und auch Sternbilder müssen genehmigt werden.
  - **Zugang**: Im Vorzimmer der Chefetage führt eine Wendeltreppe (zwei Läufe mit Absatz) zu einer Deckenluke (x 2–3, Tor
    `{ mini: chefetage }`, erst nach dem Schreibtischtäter). Vom Tritt unter der Luke springt man hinauf ins Planetarium und kommt
    dort durch eine Bodenluke heraus. Auf der Karte liegt die Sternwarte über der Chefetage (rechts daneben lagen schon die
    Ankunfts-Räume). `Castle.mapLayout()` gibt die Kartenlage für Tests aus.
  - **Planetarium** (`planetarium`, 72×34, Galerie-Thema ohne Säulen-Silhouetten `openSky`, keine Decke): offener Sternenhimmel
    (`Stern.Sky`: Verlauf, Milchstraße, 280 funkelnde Sterne in zwei Parallaxe-Schichten, Mond mit Kratern und Hof,
    Sternschnuppen). Darin ein riesiges Messing-Orrery (`Stern.Orrery`): Sonne mit Korona (leuchtet), Zahnkranz, Sockel,
    gestrichelte Bahnen, Ausleger mit Gegengewicht.
    - Vier Planeten als Plattformen mit gewölbter Oberseite (`surfaceAt`, tragen mit): Merkur, Venus, Erde mit Mond und
      Kontinenten, Saturn mit Ringen.
    - Der Saturn (Radius 22, Bahn 198) taucht am Tiefpunkt in einen Bodenschlitz und steht dort nur 16 px über dem Boden. Man
      springt auf und reitet hinauf zum Balkon (Ausgang zur Sternkuppel).
    - Gegner: **Sternschnuppe** (schwebt, glüht mit Zielstrahl auf, stürzt sich auf den Helden, formt sich oben neu) und
      **Astrolabium** (drei drehende Messingringe, schießt Sternbolzen `Stern.Bolt`, ein `EProj`, also per Konter
      zurückschlagbar).
    - Truhe am Balkon, Lebensgefäß auf dem Sims, Schild „Planetarium des Amtsleiters“.
  - **Sternkuppel** (`sternkuppel`, 44×24): **Das Sternbild** (Zwischengegner `stern`, x 6–38, 96 HP). Zehn Sterne mit
    Verbindungslinien, nur die Sterne nehmen Schaden (`hurtBoxes`). Dahinter eine zarte Fläche wie in einem alten Sternatlas.
    Auftritt: Die Sterne fallen von oben an ihren Platz.
    - **Großer Bär**: Prankenwirbel (dreht sich einmal und rückt heran, die Linien verletzen) und Ansturm quer durch die Kuppel.
      Vor jedem Angriff werden die Linien rot.
    - Ab zwei Dritteln: Die Sterne fliegen im Bogen auseinander und werden zum **Skorpion**. Stachel (Zielmarke am Boden, dann
      sticht er zu) und Sternbolzen-Salve.
    - Ab einem Drittel wird er zum **Großen Stempel** (kleiner, damit er im Bild bleibt): Stempelschlag mit Bodenwellen
      („GENEHMIGT!“) und Sternregen mit Schattenwarnung.
    - Nach jedem Angriff Atempause (Schaden ×1,5).
    - Sieg: „Der Himmel ist wieder ordnungsgemäß abgelegt.“ Lohn: Taschen-Orrery (Amulett, MP +12, LUCK +2, DEF +1) und die
      Urkunden „Sternstunde“ und „Planetenhüpfer“ (auf allen vier Planeten gestanden, `flag.planet0–3`).
  - **Musik**: „Sternwarte“ (E-Dur, lydisch, 92 BPM, Celesta-Melodie mit langem Echo, Harfen-Arpeggien) und „Sternbild“
    (fis-Moll, 160 BPM, Sechzehntel-Arpeggien, Galopp-Oktavbass, Pfeifenorgel).
  - Bosse mit eigenem Lied behalten es jetzt bei halber Energie (`boss.keepMusic`, nur schneller). Vorher ersetzte die Welt
    „Dienstweg“ und „Reißwolf“ ab der Hälfte durch das allgemeine Bosslied.
  - **Spieltempo** (Optionen): 100 / 85 / 70 % – langsamer heißt mehr Zeit zum Reagieren. Die Musik bleibt im Takt.
- **Feinschliff für alles** (20261106; Grafik, Gameplay, Musik, neue Idee):
  - **Glühen (Bloom)** über allen Räumen (`FX.bloom`, js/fx.js): Das Spielfeld wird auf ein Viertel verkleinert, zweimal mit sich
    selbst multipliziert (x³, nur Helles bleibt), noch einmal halbiert und weich vergrößert additiv darübergelegt. Stärke je Gebiet
    `BLOOM` in world.js (helle Säle weniger). Im Spar-Modus (Xbox) wird der Puffer nur jedes zweite Bild neu berechnet.
    Optionen → GLÜHEN schaltet es ab. Kosten auf dem PC etwa 2,5 ms je Bild vor der Optimierung, 60 fps bleiben.
  - **Konter für alle Geschosse**: Jedes gewöhnliche `EProj` (Feuer, Knochen, Stein, Buchseite, Eis) fliegt nach einem Peitschenhieb
    zurück und trifft Gegner und Bosse (Stein und Knochen im Bogen, blauer Schimmer). Sondergeschosse der Bosse zerbrechen wie
    bisher. Urkunde „Retour an Absender“ nach 25 Kontern (`flag.konter`).
  - **Perfekt-Ausweichen**: Wer in den ersten zehn Bildern eines Dashs (oder am Anfang einer Rutschpartie) getroffen würde, nimmt
    keinen Schaden. Stattdessen läuft knapp zwei Sekunden Zeitlupe: Gegner, Geschosse und Bosse bewegen sich nur jedes zweite Bild, der
    Held in voller Geschwindigkeit. Dazu blauer Schimmer mit Zeitlinien und dumpfe Musik (`Audio8.slow`). Abklingzeit gut drei
    Sekunden. Urkunde „Knapp daneben ist auch vorbei“ nach zehnmal (`flag.dodge`).
  - **Musik**: Die Melodie hat eine zweite, 9 Cent verstimmte Stimme (Chorus, rechts im Panorama, weich gefiltert). Der Bass
    bekommt eine Sinus-Sub-Oktave (ab 90 Hz Grundton). **Adaptive Musik**: Das Schlagzeug läuft über einen eigenen Bus, beim
    Erkunden mit 60 %. Sind Gegner in der Nähe oder kämpft ein Boss, schwillt es schnell auf 100 % an und klingt danach langsam
    ab (`Audio8.intensity`, die Welt setzt es alle 12 Bilder).
  - **Rohrpost-Express überarbeitet** (der Wunsch: „sieht besser aus und überfordert nicht“):
    - Hindernisse sind schon aus 900 Einheiten Entfernung zu sehen und ab 300 voll deckend (vorher war das Ausblenden quadratisch:
      klar erst etwa eine Drittelsekunde vor dem Aufprall).
    - Abstände etwa doppelt so groß, Gitterlücken breiter, Ordner einzeln oder zu zweit, Tempo 2,0 bis 3,3 (vorher bis 4,4),
      Lenkung schneller, Treffer kosten 1 HP.
    - Countdown 3-2-1 vor der Abfahrt.
    - Lenkhilfe an der Peilmarke: grün heißt sicher, rot blinkend heißt Kollisionskurs. Ein Pfeil zeigt die Richtung, dazu ein
      Warnton und kurz vor dem Aufprall ein roter Rand.
    - Grafik: Lampenringe alle 512 Einheiten hellen die Wand warm auf, warmer Dunst statt Schwarz, Licht am Ende der Röhre (wächst
      bis zur Ankunft), weich gefilterte Wand, Bullauge mit Messingrand, Nieten und Haltegriff, Funken an der Kufe, Konfetti aus
      zerschlagenen Ordnern. Weichenklappen haben Warnstreifen, Scharnier und Warnlampe, Gitterlücken leuchten grün, Ordner haben
      Etikett und Griffloch, Briefmarken einen gezähnten Rand.
    - Der Wegweiser-Pfeil ist während der Fahrt aus.
  - **Taktduell am Grammophon** (js/takt.js, Hotel Krat): Angriff auf eine Platte startet ein Rhythmusspiel zum Lied.
    - Die Noten entstehen aus der Melodiestimme (p1): mindestens zwei Sechzehntel Abstand, die Bahn nach Tonhöhe
      (← tief, ↑/Sprung mittel, → hoch). Kurze Lieder laufen zweimal.
    - Wertung: PERFEKT ≤ 70 ms, GUT ≤ 140 ms. Verpasste Noten und leeres Drücken brechen die Serie.
    - Rang S/A/B/C mit Kommentar des Grammophons. Bestwert je Platte (`flag.takt_<lied>`), Gold für jede Verbesserung
      (Differenz / 20), Urkunde „Ohrwurm“ für Rang S.
    - Die Uhr folgt der laufenden Musik (`Audio8.steps`), ohne Ton zählen die Bilder.
    - Grafik: doppelt großes Grammophon, Spotlight im Takt, Schellackplatten mit Glanzlicht, Notensymbole steigen aus dem
      Trichter, goldene Bahnränder ab einer Serie von 10.
- **Der Dienstweg** (20261105-1934; js/chef.js): Laufzettel, Chefetage und der Endgegner des Behördentrakts.
  - **Laufzettel**: fünf Stempel – Amtsschimmel, Kantine (gegessen), Reißwolf, Rohrpost-Express (gefahren), Frankiermaschine
    (`LAUF`/`lauf()` in castle.js). Jeder neue Stempel wird eingeblendet („LAUFZETTEL: STEMPEL 3/5“, sobald keine andere
    Meldung läuft; `flag.lauf` merkt den Stand). Vollständig: Meldung und Urkunde „Dienstweg eingehalten“.
  - Neues Tor `{ laufzettel: 1 }` in `gateOk`: Tür rechts an der Frankierstelle (Hauptpoststelle y 19) → **Chefetage**. Zu
    meldet sie „NUR MIT VOLLSTÄNDIGEM LAUFZETTEL (n/5 STEMPEL)“. Zurück geht es immer.
  - Oberamtsrat Stempelmann erklärt den Laufzettel (Szene `clerk3`, nach `clerk2`) und gratuliert nach dem Sieg (`clerk4`:
    „Dann sind Sie jetzt zuständig. Für alles.“).
  - **Chefetage** (`chefetage`, 76×22, Hotel-Thema, Karte eine Zellenreihe): Vorzimmer mit Wartebank, Wanduhr, Sekretariat,
    Kaffeekessel und Sternlampe (Blender-Dekor), Aktenböcke mit Truhe, Ordner/Flieger/Brief/Geist. Schild „AMTSLEITUNG –
    Sprechzeiten donnerstags 11:00–11:15, außer donnerstags“. Raummusik: Fahrstuhlmusik.
  - **Der Schreibtischtäter** (Zwischengegner `chef`, x 44–74, PS2-3D, gespiegelt): Mahagoni-Schreibtisch mit grünem
    Lederbezug, Schubladenstöcken mit Messinggriffen, Namensschild, Wählscheibentelefon, Bankerlampe (leuchtet), drehendem
    Stempelkarussell, Aktenstapel, Brille und Chefsessel mit Ohrenbacken. In der Kniehöhle glühen Augen unter zornigen
    Brauen (blinzeln; außer Atem halb zu, in der Warteschleife gelangweilt). Die Augen liegen vor der Ebene der
    Schubladenfronten, weil `PS2.render` ganze Flächen nach mittlerer Tiefe sortiert (sonst verschwindet das hintere Auge
    hinter der Rückwand der Kniehöhle).
    - Phase 1: SCHUBLADEN gleiten über den Boden, STEMPELKARUSSELL lässt drei Stempel mit Schattenwarnung fallen (Abdruck am
      Boden).
    - Phase 2 (ab zwei Dritteln): Das Telefon klingelt (`phone`), Hörer ab, **Warteschleife**: 10 s unverwundbar,
      Wartenummern fallen von der Decke, Anzeige „WARTESCHLEIFE – NOCH n S“, „Ihr Anruf ist uns wichtig“. Danach außer Atem.
    - Phase 3 (ab einem Drittel): „HÖHENVERSTELLBAR!“ – vier Beine fahren aus, er springt und stampft (Bodenwellen
      `Post.Welle`), der Chefsessel rollt einmal quer durchs Büro (prallt einmal ab). Unter dem stehenden Tisch kann man durch.
    - Nach jedem Angriff außer Atem: ×1,7 Schaden („ZUR AKTE!“), sonst ×0,45.
    - Sieg: „Der Amtsleiter kommt vom Mittagessen: Wer hat meinen Schreibtisch aufgeräumt?“ Lohn: **Goldener Stempel**
      (Amulett, ATK +4, DEF +3, LUCK +2), Lebensgefäß im Büro, Urkunde „Dienstschluss“.
  - Musik: **Dienstweg** (d-Moll, 176 BPM, Stempelmotiv, Oktavbass, Schreibmaschine `y`, Ratsche) im Kampf, **Warteschleife**
    (blecherne Wartemusik in C-Dur, 100 BPM) am Telefon. Alle Spuren gleich lang (256 bzw. 128 Sechzehntel).
  - ElevenLabs war wieder belegt: Telefonklingeln als Synth (`phone`).
- **Hauptpoststelle** (js/post.js, rechts an der Registratur, `hauptpost`, 110×22, Karte eine Zellenreihe):
  - **Sortierhalle**: Drei Förderbänder (`Band` auf '='-Reihen) laufen über den Briefsackschacht, eines gegen die Laufrichtung.
    Fliegende **Briefe** (Luftpostumschläge, Wellenflug) sind unterwegs.
  - **Paketlager**: Ein `Paket` (2×2, 'G') wird vom Absatz geschoben, fällt und wird an die Mauer gerückt, dann geht es hinauf.
    Es fällt kachelweise; stürzt es in den Schacht, kommt es als „RETOUR“ zurück. Bänder schieben Pakete mit. Dazu die
    **Nachnahme**, ein Paket mit Zähnen, das aufklappt und hüpft.
  - **Frankiermaschine** (Zwischengegner, PS2-3D, gespiegelt statt umgedreht): grün emaillierte Gusseisenmaschine mit Goldrahmen,
    Typenschild, Posthorn-Emblem, Kurbel, Zählwerk, Manometer-Augen, Frankierhebel und Druckwalze.
    - ROLLSTEMPEL: Die Walze rollt durch die Stelle, stempelt PORTO auf den Boden und kehrt zurück. Solange sie fort ist, liegt
      das Druckwerk offen.
    - BRIEFSALVE: Umschläge im Bogen.
    - FRANKIEREN: Sie springt auf den Helden, schickt zwei Bodenwellen los und steckt danach fest.
    - Offen oder steckend nimmt sie ×1,7 Schaden, sonst ×0,45. Jeder Treffer kostet obendrein NACHPORTO (100, ab Phase 2
      200 Gold). Phase 2 heißt Expresszuschlag.
    - Lohn: Posthorn (LUCK +3, GREED +1) und die Urkunde „Porto bezahlt“. Raummusik ist die Posthorn-Polka (B-Dur), der Boss
      spielt den Amtsmarsch.
- Reißwolf und Frankiermaschine spiegeln sich beim Umdrehen (`P.m` in `Keller.xf`/`imp`), statt sich um 180° zu drehen. So
  bleiben Fenster, Typenschild und Kurbel zum Betrachter.
- **Rohrpost-Express** (20261105-1430; js/express.js): Eilzustellung in Ego-Sicht zwischen der Kammer des Reißwolfs (Aktenkeller, erst
  nach dem Sieg) und dem Rohrpostamt (Rückweg erst nach der ersten Fahrt, sonst Abkürzung am Amtsschimmel vorbei).
  - An der Station ↑ drücken. Die Röhre ist ein Tunnel aus einer Nachschlagetabelle (213×104, Winkel und Tiefe je Bildpunkt) mit
    gemalter Messingtextur (Ringfugen, Nieten, Signallampen).
  - Steuerung: ← → kreist die Kapsel an der Wand entlang, Sprung = Druckstoß, Angriff = Peitsche nach vorn.
  - Hindernisse: Weichenklappen (Halbscheibe), Gitter mit grün markierter Lücke, entgegenfliegende Leitz-Ordner (zerschlagbar);
    dazu Briefmarken im Bogen (Gold). Die Strecke ist 6400 Einheiten lang und wird schneller und dichter.
  - Treffer kosten 2 HP (nie unter 1) und Tempo. Ohne Treffer gibt es die Urkunde „Eilzustellung“ (`express_perfect`).
  - Ankunft: weiß überblendet, der Held steigt an der Gegenstation aus.
- **Amtsschimmel noch hübscher** (20261105-1323):
  - Schabracke aus Registerblättern (pastell, mit Reitern), die beim Zuschnüren herabfällt.
  - Zaumzeug aus Amtsband mit Siegelmedaillon, Glanzlichter in den Augen, Kopf 15 % größer (die Plattenkante bleibt).
  - Mähne und Schweif aus weiß-lindgrünem Endlospapier, Messingringe an den Hufen, das Amtsband breiter über der Schabracke.
- **Musik im Amt**: Die Schreibmaschine im Amtsstuben-Walzer nutzt jetzt `y` (nur Klack). `z` schlägt auch die Bassdrum samt
  Ducking, deshalb stolperte der Walzer über unregelmäßige Kicks. Die Schreibmaschine läuft jetzt auf festem Raster, mit weichem
  Bumm auf der Eins, Zeilenglocke und Wagenrücklauf alle vier Takte.
- **Behördentrakt** (js/trakt.js; hinter der Bosskammer des Amtsschimmels links hinaus, Tür `{ mini: heldenamt }`): ein Trakt, der
  vom Amt in die Untergeschosse führt.
  - **Paternoster** (`paternoster`, 32×56): zwei Schächte mit 26 offenen Kabinen im Umlauf (Blender-Modell `pcabin`, Kabinenboden =
    Plattform). Links fahren sie hinauf, rechts hinab, oben und unten wechseln sie den Schacht.
    - Stockwerke: EG rechts Amt, 1. UG links Kantine, 2. UG Aktenkeller, 3. UG rechts Registratur.
    - Ein- und Aussteigen im Vorbeifahren. Neben einer vorbeiziehenden Decke hält die Kabine den Helden fest. Steht sie knapp unter
      der Stockwerkskante, tritt er beim Drücken zur Öffnung hinüber (Aussteighilfe).
    - Wer oben durch die Wende fährt, erlebt, was das Schild (Dienstvorschrift Nr. 12) verneint: Das Bild dreht sich einmal ganz
      herum (`W.flipA` in `applyCamFx`, gedeckt durch Vergrößerung). Dafür gibt es die Urkunde „Kopfüber“.
    - An jedem Stockwerk ein leises Ding.
  - **Kantine** (`kantine`): Theke mit Essen, Kaffeekessel (dampft) und Tische als Blender-Modelle. Dazu ein Speiseplan als
    Kreidetafel mit dem echten Wochentag in der Spielsprache.
    - Kantinenchefin Schöpfkelle (Sprecher K) verkauft Essen, das man sofort isst. Das Tagesgericht hängt vom Wochentag ab (Mo Linsen
      DEF +3, Di Schnitzel ATT +3, Mi Currywurst ATT +2 und Glück, Do Erbsensuppe DEF +2 und Nachheilen, Fr Backfisch Glück und Gold).
      Es heilt ganz und wirkt drei Minuten (`buff`, fließt in `gear()`; Teller mit Restzeit im HUD).
    - Kaffee füllt die MP, Bienenstich heilt die Hälfte, die Platte „Fahrstuhlmusik“ kostet 2000 G. Am Wochenende gibt es nur Kaffee
      und Kuchen.
    - Nach der Fahrt durch die obere Wende hat sie eine zweite Szene. Urkunde „Mahlzeit!“.
  - **Registratur** (`registratur`): Aktenschränke (`Schrank`, Schubladen alle 40 px, eine Treppe für einfache Sprünge). Ein
    Peitschenhieb zieht die Schubladen heraus, sieben Sekunden lang. Über A–F geht es aufs Regal, über G–M auf die Galerie mit den
    **Ärmelschonern** (Rüstung, DEF +4, Urkunde „Ordnungsgemäß abgelegt“).
    - Die Ablage P spuckt Papierflieger (beim ersten Mal auch einen Goldsack), ein Postausgang startet ebenfalls Papierflieger.
  - Neue Gegner: **Aktenordner** (steht still im Regal, klappt auf und hüpft schnappend) und **Papierflieger** (gleitet, stößt herab,
    fängt sich mit einem Looping ab). Beide stehen im Bestiarium.
  - Neues Lied **Fahrstuhlmusik**: Bossa nova in F-Dur mit Rim-Click (Trommel `c`), Bass Grundton und Quinte, Gitarre im
    Bossa-Rhythmus.
  - Das Grammophon kennt jetzt auch „Amtsmarsch“ (die Platte liegt im EG links) und „Fahrstuhlmusik“.
- **Wischspur der Peitsche** (`drawWhip`): beim Ausschlagen ziehen die letzten fünf Spitzenpunkte einen verblassenden hellen Bogen
  (Lederpeitsche warm, Kette kühl), in Weltlage gemerkt; im Spar-Modus aus.
- **Staub im Fackelschein** (`FX.drawMotes`): über warmen Lichtern (Kerzen, Fackeln, Leuchter) treiben Staubkörnchen, die nur
  im Lichtkreis aufleuchten; im Spar-Modus aus.
- **Stereo-Musik wie beim SNES** (`PAN` in audio.js): Melodie links, Begleitung rechts, Echo der Melodie rechts außen, Pads breit,
  Becken rechts, Toms links/rechts; Panner je Musikbus, √2 davor hält die Lautstärke.
- **Hotel- und Eisaufzug wie das Pumpwerk:** Maschinenhalle mit großen erleuchteten Fenstern, Nietträgern, Rohren und drehenden
  Schwungrädern (`machine`/`anim` in `LiftShaft.STYLE`) – das Hotel in Messing und warmem Licht, der Eisaufzug in Stahl und Frost.
- **Kaleidoskop gewaltiger:** enge Brennweite (`KZ` 2,5): Fenster 2,5-mal so groß (eins füllt fast das Bild), die Röhre krümmt sich kaum; Trommeln drehen
  halb so schnell; mehr Lichtschächte; Gewitter wie im übrigen Schloss (`STORMY.kaleido`): beim Blitz gleißen alle Fenster auf.
- **Pendelhalle:** Figurenfenster des Glasturms an der Rückwand (`TowerGlass`, bei Blitz Lichtbahnen), zwei Kolossalpendel tief
  hinten, Linsen vorn 72 px (Bot-Test: alle Sprünge).
- **Wortgeplänkel zu Beginn der Bosskämpfe** (`Game.startBanter`, Texte `banter_<Bossname>` für 13 Bosse in 6 Sprachen): läuft
  unten im Bild mit, der Kampf beginnt währenddessen; einmal je Boss und Spielstand.
- **Lichterpassage in 3D:** gestreifte Markisen über den Schaufenstern und Gaslaternen an den Pfeilern (PS2.drawLocal an der Fassade).
- **Buntglas in doppelter Auflösung** (`Tiles.glassHi`, 168×392 je Fenster): feine Bleiruten, plastische Scheiben (zum Rand hin
  dunkler), Gesichter und Schrift sauber; das Kaleidoskop tastet es direkt ab (`KZ` 3,4, Drehung 0,0025 – Fenster noch größer, langsamer).
- **Pendelhalle aufgeräumt:** keine Kolossalpendel mehr im Hintergrund, das Uhrwerk blasser; die sechs Fenster (84×196) sitzen fest in der
  Wand (Parallaxe 0.6 wie das Zifferblatt) mit Keilsteinbogen, tiefer Laibung, Säulchen und Sohlbank auf Konsolen.
- **Lichterpassage:** Jugendstilfenster der Wohnungen – Sandsteingewände mit Schlussstein, Fächer-Oberlicht aus Buntglas, Gardinen,
  Geranien, Silhouetten im warmen Licht (Katze, Leser, Tanzpaar, Vogelkäfig, Vampir beim Zähneputzen, Zimmerpalme).
- **Golem** mit Felsbrocken, Flechten, Moos, Steinkamm und glühenden Runenbändern; der **Erweckte** mit Plateaustiefeln, Knieflicken,
  Messingknöpfen, Gürtelschnalle, Brauen und Funken zwischen den Halsbolzen.
- **Ahnenbilder** mit Messing-Bilderleuchte (warmer Lichtkegel) und Namensschild auf der unteren Rahmenleiste (`portrait0–2`, 6 Sprachen).
- **Karte:** Pause → **KARTE** zeigt das ganze Schloss (Regionen um die Eingangshalle: Prolog links, Katakomben unten,
  Bergfried oben, Sonnenkathedrale oben rechts, Wintergarten rechts, Thron ganz oben). Angriff zoomt, im Zoom scrollen
  die Pfeile, Sprung/Start schließt. Unten: Erkundungsgrad der Region und des Schlosses, Siegel n/5.
- **Abschnittswahl:** im Schloss-Modus mit Erkundungsgrad je Raum und Region; ein rotes Siegel zeigt besiegte Regionsbosse.
- **Speicherkammern** (Steinnische mit Sarg und Kerzen): hineingehen sichert den Spielstand und füllt Energie (und Herzen auf
  mindestens 10) auf. Je Region eine, dazu am Waldrand des Prologs; auf der Karte rot. Der Spielstand übersteht Neuladen
  und neue Browser-Sitzungen: im Titel steht dann **FORTSETZEN** ganz oben, und nach Game Over geht es zur letzten
  Speicherkammer. Gesichert werden Ort, Held, Herzen, Spezialwaffe, Peitsche, Punkte und Leben; Karte, Siegel und
  Warpkammern werden ohnehin laufend gemerkt. „SPIEL STARTEN" beginnt auf dem Schiff, Karte und Siegel bleiben.
- **Warpkammern** (blaue Nische mit Strudel) neben den Speicherkammern (Thron: am Torbogen vor der Brücke): betreten
  schaltet sie frei, ↑ öffnet die **SCHNELLREISE**-Karte, Pfeile wählen eine freigeschaltete Kammer, Sprung reist hin.
  Engelsstatuen sind auf der Karte jetzt blau, damit Rot für die Speicherkammern frei ist.
- **RPG:** besiegte Gegner geben EXP (Punktwert ÷ 15, Bosse ÷ 20); Stufe n braucht insgesamt 15·n·(n−1) EXP
  (LV2 30, LV5 300, LV10 1350). Jede Stufe: +2 max. HP, +1 STR (+5 % Schaden für Peitsche und Spezialwaffen),
  +1 CON (erlittener Schaden ÷ (1 + 4 % je Punkt), mindestens 1). „LEVEL UP!" als Ausruf. Treffer zeigen Schadenszahlen
  (Schaden × 10, Bosse gelb), Gegner lassen Gold, große Herzen und Braten fallen, Bosse einen großen Geldsack. Das HUD
  zeigt LV mit EXP-Leiste und Gold statt Punkten und Zeit; Pause → **STATUS** (HP, EXP, NEXT, GOLD, KILLS, STR, CON, ATT,
  DEF, Spielzeit, Erkundungsgrad, Siegel, Warpkammern). Stufe, EXP, Besiegte und Spielzeit sichert die Speicherkammer;
  „SPIEL STARTEN" beginnt auf Stufe 1. Treffer werden an der gesunkenen Energie der Gegner erkannt (keine Gegnerklasse
  geändert); STR/CON wirken über `Options.dmgMul` und `Player.hurt`, nur mit `?castle`.
- **Ausrüstung** (Pause → **AUSRÜSTUNG**): drei Plätze – Waffe (Beschläge und Runen für jede Heldenwaffe: Silberbeschlag
  ATT +2, Blutrune +4, Drachenzahn +7), Rüstung (Lederwams DEF +2, Kettenhemd +4, Spiegelpanzer +7), Amulett (Herzamulett
  max. HP +8, Blutstein heilt 1 HP alle 4 s, Glücksmünze 2,5× Beute, Ring der Gier 1,5× Gold). ATT/DEF zählen wie STR/CON-Punkte
  (je +5 % Schaden bzw. +4 % Abwehr). ↑↓ wählt, ←→ oder Sprung wechselt, auf Heiltrank (50 %) und Elixier (100 %) trinkt Sprung.
  Einzelstücke schweben in den Zusatzräumen (Kolosseum Lederwams, Kanal Blutstein, Schatzkammer Ring der Gier, Verlies
  Drachenzahn, Wehrgang Glücksmünze, Himmelsbrücke Spiegelpanzer); ein Fund für einen leeren Platz wird gleich angelegt.
  Gegner lassen mit 3 % etwas fallen (nach Gefahrenstufe; Doppeltes wird zum Heiltrank), Bosse ein Elixier.
- **Begleiter** (Familiars wie in SotN, vierter Platz im Ausrüstungsmenü, immer nur einer): **Fledermausjunges** (liegt nach
  dem Sieg über die Riesenfledermaus in ihrer Arena – „hält dich für seine Mutter“; stürzt sich auf Gegner), **Fee im Glas**
  (Laden, 7000; heilt 12 % + 2 % je Stufe, sobald die Energie unter die Hälfte fällt, dann 15 s Pause; will Komplimente),
  **Tentakelchen** (der Neffe des lila Tentakels – dieser gibt ihn im Kolosseum mit, sobald man die Rabenfeder hat; haut zu,
  was nah kommt, und redet zu viel). Jeder Treffer bzw. jede Heilung gibt Erfahrung, alle 12 Punkte eine Stufe (bis LV 9:
  mehr Schaden, kürzere Pausen). Begleiter treffen nur Gegner und Bosse (deren Trefferzonen), nie Kerzen, Geschosse oder
  Geheimwände; Sprechblasen mit absurden Sprüchen. Stufen liegen in `famx` im Karten-Spielstand.
- **Bestiarium** (Pause → STATUS, ←→ bis zur dritten Seite, ↑↓ wählt): 21 Gegnerarten und 8 Bosse wie die Gegnerliste in
  SotN, mit Siegen je Art und absurdem Eintrag (unbesiegte Arten bleiben „???“). Die erste besiegte Art meldet „NEU IM
  BESTIARIUM“. Gezählt wird über den Klassennamen des Gegners (`best` im Karten-Spielstand; bleibt bei Neues Spiel+).
- **Verkaufen:** im Laden des Bibliothekars wechselt ←→ zwischen KAUFEN und VERKAUFEN. Verkaufen lässt sich alles außer
  Zauberbüchern, Schlosskarte, Begleitern und dem einzigen angelegten Stück; halber Ladenpreis, Einzelstücke zu festen
  Preisen (z. B. Drachenzahn 6000). Der Erlös wird auch im Speicherkammer-Spielstand gutgeschrieben.
- **Ende im Schloss-Modus:** nach dem Grafen verabschieden sich zweiter Held, Bibliothekar und lila Tentakel über dem
  Morgenhimmel (Gesprächsfenster, absurd wie gewohnt), dann **SCHLOSS BEFREIT**: Erkundungsgrad, Spielzeit, Stufe, Besiegte,
  Relikte, Lebensgefäße, Gold und ein Rang nach Erkundungsgrad (S ab 95 %, A ab 80 %, B ab 60 %, sonst C) mit Kommentar.
  Wahl: **NEUES SPIEL+** (Stufe, EXP, Gold, Ausrüstung, Begleiter, Zauber und gesehene Szenen bleiben; Karte, Relikte, Bosse,
  Gefäße, Warpkammern und rissige Wände auf Anfang; der Fluch schlägt wieder zu; je Runde +2 Gefahrenstufen; Start am Burgtor)
  oder der bekannte **Abspann**. Test: Pause → TEST-WERKZEUGE → ZUM ENDE.
- **Taucherhelm und versunkene Kapelle:** Relikt „Taucherhelm“ (Blender-Modell auf dem Sockel) am Ende des Kanals. Damit
  ist Wasser kein Abgrund mehr: in `~`-Becken und unter der Wasserlinie eines Raums (`def.waterLine`) sinkt der Held langsam,
  jeder Sprung ist ein Schwimmzug, Wasser bremst, am Beckengrund bleibt er stehen (`swimUpdate`, `hazards`-Hülle). Ohne Helm
  ertrinkt er unter einer Wasserlinie (zurück an den letzten sicheren Platz). **Versunkene Kapelle** (Tür am Kanalanfang, x 6):
  Luftblase mit Steg, darunter Säulenstümpfe, Simse, Altar mit Lebensgefäß, versunkene Glocke (Blender), Tang, Lichtstrahlen
  und Blasen (`CastleWater` zeichnet die Wasser-Ebene über allem); Quallen (`Jelly`, im Bestiarium); Funde Dreizack des
  Wassermanns (ATT +5) und die Platte „Tanz des Kraken“. Relikte jetzt 10.
- **Nebenaufträge** (Status, vierte Seite „AUFTRÄGE“: Auftraggeber, gefundene Stücke, erledigt):
  **Die Ausreißer** (Bibliothekar: Kochbuch im Hotel, Liebesroman auf dem Wehrgang, Telefonbuch im Bahnhof → Zauberbuch
  **Tetra-Seelen**, ↑ ↗ → ↘ ↓ + Angriff, 20 MP, vier Seelen), **Die Koffer aus Zimmer 7** (Portier: Kolosseum, Dachboden,
  Kanal → Portiersmütze, MP +12), **Die Untertasse** (Gefangener, seit 1391 vermisst, liegt in der Minibar von Zimmer 13 →
  Eisenkugel, ATT +4). `QUESTS`, Szenen mit `give`/`take`; die Stücke bleiben beim Auftraggeber. Ausrüstung kann jetzt
  auch MP geben (`gear('mp')`).
- **Karte:** Figuren als Marke (blinkt gelb, wenn sie etwas Neues zu erzählen haben).
- **Spiegelkabinett und der Doppelgänger** (Tür in der Marmorgalerie, x 34, Stufe 4): Marmorsaal mit Standspiegeln aus
  Blender, die den Helden spiegeln – solange der Doppelgänger lebt, mit Verzögerung. Er tritt aus dem rechten Spiegel: dein
  eigenes Bild in Dunkelviolett mit roten Augen, deine Waffe und Reichweite, hält Abstand, springt, weicht deinen Hieben mit
  einem Rückwärts-Dash aus; ab halber Energie Nachbilder und Schattendolche. Lohn (`MINI_LOOT`): **Schattenzwilling** –
  Begleiter, der 18 Bilder hinter dir herläuft und jeden Hieb wiederholt. Hinten eine brüchige Wand (Mauerbraten, Goldsack),
  dahinter eine Nische mit der Tür zum Spiegeltunnel.
- **Spiegeltunnel** (Thema `mirror`): eine Spiegelgalerie wie in Versailles als Mode-7-Röhre, die sich um ihre Längsachse
  dreht wie der Seelenstrudel (`Mode7.drawTunnel(…, 'mirror')`) – das Spielfeld bleibt aufrecht. Je Feld zwei riesige
  Arkadenspiegel aus vielen Scheiben mit vergoldeten Sprossen, Pilaster aus rotem Rance-Marmor, Eierstab-Gesimse, goldene
  Sonnen, Kristalllüster und goldene Kandelaber, Versailler Parkett. Die Spiegel spiegeln wirklich (js/mirror.js):
  `Mirror.capture` hält am Ende von `World.draw` das Spielfeld fest, `Mirror.reflect` legt es im nächsten Bild unter das
  durchscheinende Glas – nahe Wände gekippt, die Rückwand verkleinert zum Fluchtpunkt (endloser Spiegeltunnel, Verstärkung
  unter 1, damit nichts zu Weiß aufschaukelt). **Spiegelschacht** (`mtower`): gebaut wie der Glasturm – Zickzack-Treppen
  und zwei Aufzüge in einer stehenden Röhre (`drawGlassTube` mit Versailles-Spiegeltextur, Alpha bleibt erhalten), die sich
  auf den Treppen mitdreht und ebenfalls spiegelt; oben eine Tür auf die Empore der Marmorgalerie (Schleife).
- **Eisrutsche** (Tür in der Eishöhle, x 80; nur mit Schattenmantel und Enterhaken – Tor `{ relics: [...] }`): Hindernis-
  Rutschpartie abwärts um einen Eishöhlen-Turm (`wrap`, `ice`, `iceRamps`, Turmmantel `towerTex: 'cave'` mit Fels,
  gefrorenen Wasserfällen und Kristallbüscheln). Stachelfelder im Rutschweg, Eiswände (`icewall`, nur ein Dash zerschlägt
  sie), niedrige Eisdecken (geduckt mit Tempo: Bauchrutscher mit vollem Schwung), eine unterbrochene Rampe mit Stacheln am
  Fuß, zwei Gruben mit Ankerringen (18 breit, Ring-zu-Ring), Schanzen über Stachelreihen. Unten Truhe und Lebensgefäß, eine
  Einbahn-Tür führt zurück in die Eishöhle.
- **Selbsttest – Erreichbarkeit:** Breitensuche vom Wald über Türen und Ausgänge; jeder Raum, der so nicht erreichbar ist,
  wird gemeldet („Raum unerreichbar“).
- **Lokschuppen und der Zugführer:** Tür am linken Bahnsteig (x 14) in den Lokschuppen über dem Bahnhof (Stufe 3). Links
  stehen Lok und Wasserkran, oben ein Kransims mit Lebensgefäß; rechts die Arena des **Zugführers** – einer riesigen
  Schaffnerpuppe (Blender, zwölf Posen in `img/cond3d.png`, Bildkarte `K3C`): ruckt heran, holt mit der Fahrkartenzange aus
  und stürmt durch die Halle (danach verschnauft er), wirft Glut aus der Laterne im Bogen, pfeift Druckwellen über den
  Boden; ab halber Energie schneller und ruft zwei Puppen. Lohn: **Dampfstiefel** (`MINI_RELIC`).
- **Dampfstiefel:** ↑ + DASH am Boden = Supersprung (gut 8 Kacheln senkrecht, steuerbar, danach ist der Doppelsprung frei;
  von unten prallt man an Simsen ab, also neben dem Sims abspringen). Neue Ziele: Kransims im Lokschuppen, **Signalbrücke**
  unter dem Bahnhofsdach (Schallplatte „Morgenröte“, Truhe). Status → Zauber-Seite listet ihn bei den Verwandlungen.
- **Zimmer 13** (Tür auf der Hotel-Galerie, x 46): `gate: { item: 'keyring' }` – der Schlüsselbund des Gefangenen, der „in
  kein Schloss passt“, passt genau hier. Der Portier erkennt ihn (Szene conc3), drinnen wohnt jetzt der lila Tentakel im
  Eimer neben dem Messingbett (Szene tent4) und schenkt das **Daunenkissen** (Rüstung, DEF +5).
- **Wolfsgestalt** (Relikt „Seele des Wolfs“, erscheint neben dem Eistor, sobald die Eishexe am Fuß des Eisturms besiegt
  ist; wer daran vorbeiläuft oder einen älteren Spielstand hat, findet es am Anfang der Gruft – `MINI_RELIC`): ↓ ↘ → + Sprung
  verwandelt (4 MP, dann 1 MP je Sekunde, bei 0 MP zurück, sobald Platz ist). Der Wolf ist flach (12 px) und schnell, springt,
  Angriff = Biss mit einem Satz nach vorn (trifft jeden Gegner einmal, Schaden wächst mit der Stufe), ↑ am Boden verwandelt
  zurück (stehend, sonst geduckt; in der Klappe nicht). Nur der Wolf passt durch **Haustierklappen** (`def.grates` mit `pet`).
  Zauber-Seite: alle Verwandlungen als Zeilen mit Befehl und Kosten. Treffer und Stürze ändern keine Tiergestalt mehr
  (`setCrouch` ist in Tiergestalt gesperrt – vorher konnte ein Treffer die Fledermaus auf Heldengröße ziehen).
- **Hotel Krat** (Hommage an die Lobby aus „Lies of P“, eigene Texte und Figuren): Tür mit Schild im Burghof (x 50), Lobby
  über dem Burghof, eigenes Kachelthema `hotel` (grüne Damasttapete, Mahagoni, Messing-Gaslampen, Regenfenster mit der
  Stadt dahinter, roter Läufer, Galerie). Sicherer Ort ohne Gegner: **Sternlampe** = Speicherkammer, **Aufzug** =
  Warpkammer, **Grammophon** (↑): legt gefundene oder gekaufte **Schallplatten** auf (zehn Stücke des Schlosses, Liste mit
  ???), **der Portier** – eine Holzpuppe mit Monokel, die nicht lügen kann: lügt er doch, wächst seine Nase (`~` vor einer
  Gesprächsseite) – mit eigenem Laden (Bademantel DEF +3 mit langsamer Heilung, Platten, Tränke). Unter der Galerie hinter
  der Haustierklappe der Gepäckraum (Lebensgefäß, Platte, Truhe). Musik: ruhiger Walzer in d-Moll ohne Schlagzeug.
- **Bahnhof Krat** links neben dem Hotel (Stufe 2): Bahnhofshalle aus Eisen und Glas (Thema `station`), Bahnsteigkante,
  Fußgängerbrücke, Abfahrtstafel mit Fallblättern (absurde Ziele), Uhr; die Dampflok „KRAT“ steht mit zwei Wagen unter
  Dampf hinter der Bahnsteigkante. Gegner: **Puppen** (Gepäckträger ohne Fäden: ruckeln heran, holen aus, springen; im
  Bestiarium), Raben. Lebensgefäß auf der Brücke, Platte, Truhe am Stellwerk.
- **Blender-Modelle (PS2-Look):** Dampflok mit Tender, Personenwagen, Bahnsteigdach (kachelbar), Bank, Gaslaterne,
  Bahnhofsuhr, Ortsschild, Empfangstresen, Schlüsselbrett, Grammophon, Sternlampe, Aufzug, Ohrensessel, Gepäckwagen –
  in Blender aus Grundkörpern gebaut, orthografisch mit 16 px je Meter gerendert, in `img/krat3d.png` gepackt; die Bildkarte
  `K3` in castle.js nennt Lage, Anker und Zusatzpunkte (Schornstein für den Dampf, Lampen fürs Licht). `def.decor` setzt sie
  in die Räume (`CastleDecor`), Räder verschwinden per Abschneiden hinter der Bahnsteigkante.
- **Nebelgestalt** (Relikt „Asche des Nebels“, liegt nach dem Sieg über die Menschenfalle in ihrer Arena): ↑ ↓ + Sprung
  verwandelt (6 MP, dann 1 MP alle 0,5 s), langsam schwebender Nebel, unverwundbar, schwebt durch **Gitter** (`def.grates`,
  `CastleGrate`: schieben jeden zurück, der kein Nebel ist). Sprung oder Angriff verwandelt zurück, wenn Platz ist (nicht
  mitten im Gitter). Der **Kerker** (Tür mitten im Kolosseum, x 50) ist früh betretbar: hinter einem bis zur Decke vermauerten
  Gitter sitzt **der Gefangene** (seit 1391, wegen Falschparkens mit einer Kutsche, hat Tee). Er spricht schon durchs Gitter
  (größere Reichweite `reach`), als Nebel in seiner Zelle schenkt er den **Schlüsselbund** (Amulett, ATT +2, DEF +2); dort
  liegen auch ein Lebensgefäß und eine Truhe. Der zweite Held erklärt den Weg (Szene „fog“). Relikte jetzt 7. Die
  Verwandlungen rechnen ab den Füßen (die Befehle enden oft geduckt).
- **Fledermausgestalt** (Relikt „Seele der Fledermaus“, liegt nach dem Sieg über den Sonnenwächter in seiner Arena):
  ↓ ↑ + Sprung verwandelt (4 MP, dann 1 MP alle 0,6 s, bei 0 MP von selbst zurück), Sprung oder Angriff verwandelt zurück,
  wenn Platz ist. Die Fledermaus fliegt frei, ist 10×10 groß und fliegt auch durch Seitenausgänge; ein Raumwechsel
  verwandelt zurück. Nur fliegend erreichbar: ein Sims unter der Decke der Eingangshalle (x 66–70) mit Tür zum
  **Dachboden** (Stufe 3, Lebensgefäß, Gummihuhn mit Seilrolle: mehr Beute und Gold). Der zweite Held erklärt es
  (Szene „wings“), Status → Zauber-Seite zeigt den Befehl. Code: `toBat`/`fromBat`/`batUpdate`/`batDraw` umhüllen
  `Player.update`/`draw` (entities.js bleibt unverändert). Relikte jetzt 6.
- **Zauber** wie in SotN: Befehl mit dem Steuerkreuz, dann Angriff (der Hieb entfällt). Gezeigt mit Blick nach rechts:
  **Seelenruf** ← → ↑ ↓ (5 MP, eine Seele sucht sich einen Gegner), **Höllenfeuer** ↑ ↓ ↘ → (12 MP, drei Feuerbälle im Fächer),
  **Seelenraub** ← → ↘ ↓ ↙ ← → (24 MP, trifft alles im Bild, jede Seele heilt). Gelernt aus Zauberbüchern im Laden (2500 /
  6000 / 12000). MP erst mit dem ersten Buch: 24 + 3 je Stufe, +1 alle 0,75 s, voll in der Speicherkammer und beim
  Bibliothekar; Leiste im HUD neben der EXP. Schaden wächst mit der Stufe. Pause → STATUS, ←→ blättert zur Zauber-Seite
  (Befehle, MP-Kosten). Die Befehlserkennung läuft vor `W.update` (`Castle.preUpdate`) und löscht dort den Angriffsdruck.
- **Laden des Bibliothekars:** nach jedem Gespräch mit ihm (↑) öffnet sein Laden (rollt bei mehr als acht Zeilen) – Heiltrank
  800, Elixier 4000, Lederwams 2000, Kettenhemd 6000, Silberbeschlag 3000, Herzamulett 5000, Fee im Glas 7000, Zauberbücher,
  **Schlosskarte** 3000 (zeigt auf der Karte alle unbetretenen Räume
  grau; der Erkundungsgrad zählt weiter nur Betretenes). Gold = Punkte; Ausrüstung gibt es nur einmal. Besitz wird wie die
  Relikte sofort gemerkt (`inv`, `eq` im Karten-Spielstand), ein Kauf zieht das Gold auch im Speicherkammer-Spielstand ab.
- Code: `js/castle.js` (Regionen `REGION_AT`, Verbindungen `LINKS`, Türen `CastleDoor`, Kammern `CHAMBERS`/`CastleChamber`,
  Szenen `BEATS`/`CastleNPC`, Spielstand, Karte), Einbindung in `js/game.js` (`castleGo`/`castleEnter`, `nextRoom`,
  `startStage`, `startClear`, Pausenmenü, Titelmenü `titleItems`/`castleContinue`, Zustände `map`, `warp`, `status`, `talk`,
  `equip`, `shop`); Ausrüstung `GEAR`/`FINDS`/`DROPS`/`STOCK`/`BOSS_LOOT`, `CastleLoot`, Begleiter `CastleFamiliar`/`famTick`, Zauber `SPELLS`/`preUpdate`/`CastleSpell`.
- Daten: `localStorage['nachtmahr.resume']` = Fortsetzungspunkt (Testmodus: `nachtmahr.test.map` / `.castle` / `.resume`);
  `localStorage['nachtmahr.map']` = `{ v: 1, rooms: { "<stage-id>:<raum>": [Zellnummern] }, boss, mini, warp, vessel, relic, crack, flag, inv, eq, famx, best }`,
  `localStorage['nachtmahr.castle']` = Spielstand der letzten Speicherkammer; `Castle.reset()` in der Konsole löscht alles.
