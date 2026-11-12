# NACHTMAHR – Changelog

Neueste Version oben. Die Build-Nummer steht im Titelbild unten rechts und in der Browser-Konsole (`BUILD`).
Unter **Beim Testen ansehen** steht jeweils, worauf es beim Ausprobieren ankommt.

Schnell an eine Stelle kommen: Adresse mit `?test` öffnen → Titel → Testmodus; im Pausenmenü gibt es dann
**TEST-WERKZEUGE** (Meilensteine, Unverwundbarkeit, alle Relikte).

---

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
