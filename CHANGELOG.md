# NACHTMAHR – Changelog

Neueste Version oben. Die Build-Nummer steht im Titelbild unten rechts und in der Browser-Konsole (`BUILD`).
Unter **Beim Testen ansehen** steht jeweils, worauf es beim Ausprobieren ankommt.

Schnell an eine Stelle kommen: Adresse mit `?test` öffnen → Titel → Testmodus; im Pausenmenü gibt es dann
**TEST-WERKZEUGE** (Meilensteine, Unverwundbarkeit, alle Relikte).

---

## 20261113-0229 – Grafik: Medusa und die kleinen Kreaturen neu aus Blender

**Neu – Grafik**
- **Medusa** neu modelliert: Gesicht mit leuchtenden Schlitzaugen, Diadem mit Rubin, Goldkragen, Schuppenmieder, Gürtel,
  Armreife und Krallenhände; beim Fauchen reißt sie beide Arme hoch und zeigt die Giftzähne. Der Schlangenleib beginnt
  als zwei Windungen mit hellen Bauchschilden und geht in den gezeichneten Schwanz über. Das bewegte Schlangenhaar bleibt.
- **Medusenhäupter** (fliegende Köpfe): größeres Gesicht mit Augen, Diadem und kurzem Schlangenhaar.
- **Gespenst:** Laken mit Zipfel, welligem Saum und kleinen Ärmchen.
- **Flammenschädel:** runder Schädel mit glühender Augenhöhle und Kiefer, dahinter ein dreifarbiger Flammenschweif.
- **Seeadler:** weißer Kopf und Schwanz, gelber Schnabel, breitere Schwingen mit dunklen Schwungfedern.
- **Rabe:** etwas kräftiger, blauschwarzes Gefieder, rotes Auge.
- **Knochensäule:** zwei gehörnte Drachenschädel mit Zahnreihe auf einer Wirbelsäule; beim Feuern klappt der obere
  Rachen auf und zeigt die Glut.
- Bildgrößen, Trefferflächen und Verhalten sind unverändert – nur die Bilder sind neu.

**Beim Testen ansehen**
- Bergfried, Boss Medusa: passt der Übergang vom Leib zum Schwanz am Boden, liegen die glühenden Augen beim
  Versteinerungsblick auf dem Gesicht, verdeckt das Schlangenhaar das Gesicht nicht zu sehr?
- Medusenhäupter (Medusas Angriff) und Flammenschädel: gut zu erkennen, auch wenn sie leuchten?
- Bergfried, erster Raum: Knochensäule – sieht das aufklappende Maul beim Feuern richtig aus, in beide Blickrichtungen?
- Ankunft (Schiff): Seeadler und Raben; Burghof und Katakomben: Gespenster. Sind die kleinen Vögel vor dunklem
  Hintergrund noch gut zu sehen?

## 20261113-0153 – Grafik, Gameplay, Musik: Skelette und Sonnenwächter neu, Kopfgeld-Seite, Portal, zweite Stimme

**Neu – Grafik**
- **Skelett, Knochenriese und Sonnenwächter** neu aus Blender: Schädel mit Augenhöhlen, Rippenbögen, dünne Knochen;
  der Sonnenwächter in glänzender Goldrüstung mit Stahl-Kniebuckeln, weißem Federbusch und Schild. Auch der Ritter glänzt jetzt.
  Damit kommen alle Figuren, die aus dem Gelenk-Rig entstehen, aus derselben Render-Strecke wie die Helden.

**Neu – Gameplay**
- **Statusseite KOPFGELD** (Pause → STATUS, ganz nach rechts blättern): alle 16 Bosse als Steckbriefliste mit Ort und Lohn;
  erledigte haben einen Haken, das aktuelle Ziel des Wegweisers blinkt.
- **Rückweg-Portal:** nach jedem Bosssieg erscheint neben dem Helden ein blaues Portal. ↑ davor öffnet die Schnellreise.
  Es bleibt, bis man den Raum verlässt.

**Neu – Musik**
- Die drei Hauptthemen (Burghof, Katakomben, Bergfried) haben eine neue Begleitstimme: im ersten Durchgang ruhige gebrochene
  Akkorde in Achteln statt der schnellen 16tel-/32tel-Arpeggien, in der Wiederholung singt die zweite Stimme die Melodie
  eine Terz tiefer mit.

**Beim Testen ansehen**
- Katakomben (Skelette, Knochenriese), Sonnenkathedrale (Sonnenwächter): passen Größe und Trefferfläche, sieht der
  Lanzenstoß des Sonnenwächters noch richtig aus?
- KOPFGELD-Seite auf deinem Bildschirm: ist alles lesbar, stimmen die Haken mit deinem Spielstand?
- Portal nach einem Bosssieg: steht es frei (nicht in einer Wand oder auf einer Tür), reagiert ↑ zuverlässig?
- Musik: klingt die Terzstimme in allen drei Stücken sauber, oder reibt sie sich irgendwo mit Bass und Fläche?

## 20261113-0134 – Changelog im Spiel

**Neu**
- **Optionen → CHANGELOG** zeigt dieses Changelog im Spiel: ↑↓ rollt (gehalten läuft es weiter), ←→ springt zur vorigen
  oder nächsten Version, Start, Sprung oder Angriff führt zurück. In der Optionszeile steht die neueste Build-Nummer.
- Der Text kommt aus CHANGELOG.md (`python tools/make_changelog.py` erzeugt daraus js/changelog.js) und ist auf Deutsch,
  auch wenn das Spiel auf eine andere Sprache gestellt ist.

**Beim Testen ansehen**
- Titel → OPTIONEN → ganz nach unten: steht CHANGELOG vor ZURÜCK, stimmt die Build-Nummer mit dem Titelbild überein?
- Ist die Seite auf deinem Bildschirm gut lesbar, rollt sie flüssig, sind lange Zeilen sauber umbrochen?

## 20261113-0128 – Grafik: Riesenfledermaus und Gegner neu aus Blender

**Neu**
- **Riesenfledermaus** (erster Hauptboss) ist in Blender neu modelliert: pelziger Leib mit hellem Bauch, Kopf mit Ohren und
  glühenden Augen, Flügel mit Arm, vier Fingerknochen und gewölbten Hautfeldern, aufgerissenes Maul mit Fängen beim Sturzflug
  und beim Schießen, ruhend mit angelegten Flügeln. 17 Bilder, gleiche Größe und Lage wie vorher.
- **Ghul, Fischmensch und Ritter** neu aus derselben Render-Strecke wie die Helden: runder, mit Licht von oben links,
  der Ritter mit Helm, Federbusch und blauem Schild, der Fischmensch mit Flossenkamm und hellem Kehlsack.
- Diese Version liegt nur auf GitHub Pages (itch.io und Game Jolt stehen noch auf 20261112-0614).

**Beim Testen ansehen**
- Große Halle: Riesenfledermaus in allen Phasen – schlafend an der Decke, Flügelschlag, Sturzflug mit offenem Maul.
  Passt die Trefferfläche noch zum Bild?
- Ghule (Katakomben), Fischmenschen (am Wasser), Ritter (Burghof/Bergfried): passen sie neben den neuen Helden ins Bild?
- Noch im alten Stil: Skelette, Knochenriese, Sonnenwächter, Medusa, Raben, Geister.

## 20261112-1414 – Fluss: schneller zurück zum Boss, Lohn nach jedem Sieg

**Neu**
- **Bossräume als Reiseziele:** Hast du den Raum eines noch unbesiegten Bosses einmal betreten, steht er in der Schnellreise
  (orange beschriftet, z. B. „NEBENBOSS: DER ZUGFÜHRER“). Die Reise setzt dich am Eingang dieses Raums ab – nach einer
  Niederlage entfällt der lange Anmarsch. Vorgewählt ist der Raum des aktuellen Ziels, wenn er schon bekannt ist.
- **↓ + Karte** (Tab/Q bzw. Select) öffnet die Schnellreise direkt aus dem Spiel, ohne Pausenmenü.
- **Lohn nach jedem Bosssieg:** Kopfgeld (Nebenboss 1000 G je Gefahrenstufe, Hauptboss 2000 G je Stufe), HP und MP sind
  danach voll. Beim ersten Sieg erscheint einmal der Hinweis auf die Schnellreise.
- Nach der Schnellreise aus dem Pausenmenü ist die Musik wieder normal laut (die Pause-Dämpfung wird gelöst).

**Beim Testen ansehen**
- Einen Bossraum betreten, wieder hinausgehen, dann Pause → SCHNELLREISE: steht der Raum in der Liste, kommt man am
  Eingang an und beginnt der Kampf normal?
- ↓ + Karte im Laufen, im Sprung, auf Treppen: öffnet sich die Reise nur, wenn man es will (↓ wird auch zum Ducken benutzt)?
- Ist das Kopfgeld zu großzügig oder zu knapp? Fühlt sich das volle Auffüllen nach Bossen richtig an?
- Bekannt offen: Abkürzungen als echte Türen zwischen Regionen und ein sichtbares Portal in der Arena gibt es noch nicht.

## 20261112-0614 – Alle Bosse im Schloss, weniger Lauferei

**Neu**
- **Nebenbosse sind Ziele des Wegweisers.** Bisher führte der goldene Pfeil nur über den Hauptweg; Zugführer, Amtsschimmel,
  Frankiermaschine, Schreibtischtäter, Sternbild, Mann im Mond, Reißwolf, Golem, Doppelgänger und der Erwachte (Frankensteins
  Geschöpf) musste man selbst finden. Jetzt schickt der Wegweiser zu ihnen, sobald der Hauptweg eine höhere Gefahrenstufe
  erreicht hat und das Tor zu ihrem Bereich offen ist – leichtere zuerst, dann der nähere. Anzeige: „NEBENBOSS: …“ mit dem Raum.
- **Bosszähler** auf der Statusseite: BOSSE x/16 (sechs Hauptbosse, zehn Nebenbosse).
- **Schnellreise von überall:** Pause → SCHNELLREISE öffnet die Karte der schon betretenen Warpkammern. Vorgewählt ist die Kammer
  in der Region des aktuellen Ziels. Nicht im Bosskampf und nicht im Vorspiel.
- Zum Mond führt das Ziel über die Sternkuppel (Mondkanone), sobald das Sternbild besiegt ist.

**Beim Testen ansehen**
- Zeigt der Pfeil nach einem Hauptboss sinnvoll auf einen Nebenboss? Ist der Weg dorthin ohne fehlendes Relikt gehbar?
  (Der Wegweiser prüft nur Tore, nicht Sprunghöhen – falls er zu einem Boss schickt, den man noch nicht erreichen kann, bitte melden.)
- Schnellreise: kommt man in der gewählten Warpkammer an, stimmt danach die Musik der Region?
- Fühlt sich die Reihenfolge der Nebenbosse richtig an (acht davon haben Gefahrenstufe 3)?

## 20261112-0201 – Helden und Graf neu aus Blender, ruhigere Musik

**Neu**
- Henrik, Ragnor, Kaspar und Henrik im Abenteurer-Look sind in Blender neu modelliert und gerendert (47 Posen je Figur).
- Der Graf (Dracula) ist neu: gefalteter Umhang mit gebogtem Saum, spitzer Kragen, Frack mit Weste und Orden.
- Musik: Rock-Takt statt Vier-auf-den-Boden, keine zufällig betonten Hi-Hats mehr, das Pumpen bei jeder Kick ist fast weg,
  zweite Stimme und Streicher stehen weiter vorn.

**Beim Testen ansehen**
- Heldenwahl im Titel: sehen alle drei Helden (und Henriks zweiter Look mit ▲▼) in allen Bewegungen sauber aus – Laufen,
  Springen, Ducken, Treppen, Angriff, Treffer?
- Thronsaal: der Graf in allen drei Haltungen (Umhang zu, offen, Arme erhoben), sitzt das Augenglühen auf den Augen?
- Musik in Burghof, Katakomben, Bergfried: stolpert das Schlagzeug noch? Ist es zu leise geworden?

## 20261112-0056 – Lesbare Schrift, neue Fledermaus

**Neu**
- Gold steht mit Münze unter den Leisten (stieß vorher an das Waffenfach).
- Status, Karte und alle Menüseiten sind deckend – das HUD scheint nicht mehr als blasse Schrift durch.
- Zu breite Zeilen werden lesbar schmaler (erst schmalere Leerzeichen, dann geglättet) statt zu Pixelbrei gestaucht.
- Fledermäuse neu als Pixelgrafik: Flughäute, Ohren, glühende Augen, 16 Flügelschlag-Phasen, ruhend kopfüber.

**Beim Testen ansehen**
- HUD und alle Menüseiten auf dem eigenen Bildschirm: ist noch irgendwo Schrift verdeckt oder abgeschnitten?
- Auf dem Handy (hoch und quer): Zauber-, Urkunden-, Mahre- und Ausrüstungsseite.

## 20261111-2152 – Bodenschatten, Beute-Magnet, Ruf-Schnellwechsel

**Neu**
- Bodenschatten unter Held, Gegnern und Beute (im Sprung kleiner und blasser).
- Herzen und Gold kommen dem Helden die letzten Schritte entgegen.
- Kritische Treffer schieben laufende Gegner ein Stück zurück; der Stufenaufstieg füllt die MP.
- **↑ + Karte** wechselt im Spiel zum nächsten gefangenen Ruf-Mahr (ab zwei Ruf-Mahren).
- Der Zweig mit den Verbesserungen für schmale Schirme, Bosskammern und Ladehänger ist eingemischt.

**Beim Testen ansehen**
- Schatten auf Treppen, Plattformen und Aufzügen; stört der Magnet beim gezielten Liegenlassen von Beute?

## 20261111-1713 – Feinschliff an Ton, Grafik und Gefühl

**Neu**
- Acht neue Geräusche (Mahr steigt auf, Fang, Ruf, leere MP, Geisterhaut, Versteinerung, kritischer Treffer, Herzschlag);
  oft gehörte Geräusche klingen jedes Mal leicht anders.
- Bei wenig HP: Herzschlag, die Musik rückt in den Hintergrund.
- Zauberkreis beim Ruf, Stern beim kritischen Treffer, violettes Glimmen an Gegnern, deren Mahr noch fehlt.
- Versteinerte Gegner sind spröde (Treffer ×1,5). Perfektes Ausweichen gibt 6 MP, und in der Zeitlupe danach ist jeder Hieb kritisch.
- HUD: grüner Blitz bei Heilung, Medaillon blitzt beim Stufenaufstieg, MP-Zahl blinkt rot, wenn der Ruf nicht bezahlbar ist.

## 20261111-1659 – Mahre, kritische Treffer, neues Schloss-HUD

**Neu**
- **Mahre:** besiegte Gegner lassen manchmal ihren Mahr zurück, der im Traumfänger landet. Zehn Ruf-Mahre (↑ + SUB, kosten MP)
  und acht Bann-Mahre (wirken dauernd), je Platz einer, Rang I–IX. Pause → STATUS → Seite MAHRE.
- **Kritische Treffer** (Glück, Bann-Mahr „Raubtierblick“): goldene Zahl mit „!“, Schaden ×1,75.
- **Schloss-HUD:** Medaillon mit Stufe und EXP-Ring, glatte HP-/MP-Leisten mit Zahl, Bossleiste nur im Kampf, Ruf-Mahr im Waffenfach.

**Beim Testen ansehen**
- Der erste besiegte Gegner mit Mahr (z. B. Skelett) gibt ihn sicher; danach Fangquote und Ränge.
- Balance der Ruf-Mahre gegen normale Gegner und Bosse.
