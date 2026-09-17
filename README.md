# Moorhuhn Game

Ein bewusst kleines Browsergame-Grundgerüst für den ersten spielbaren Moorhuhn-Prototypen. Es verwendet **TypeScript** und die native **HTML5 Canvas 2D API** – ohne Game Engine.

## Starten

```bash
npm install
npm run dev
```

Der Entwicklungsserver zeigt danach eine lokale Adresse an. Der Canvas läuft in einer festen virtuellen Auflösung von **1920 × 1080** und skaliert proportional in das Browserfenster.

Der Level-Editor ist unter `/editor.html` erreichbar. Von der Spielansicht führt außerdem ein Link direkt dorthin.

## Prüfen vor Auslieferung

```bash
npm run build
```

Das prüft TypeScript und erstellt eine Produktionsversion in `dist/`.

## Struktur

```text
src/
  core/
    camera.ts       Horizontale/vertikale Weltverschiebung
    constants.ts    Virtuelle Auflösung
    input.ts        Maus-/Pointer-Eingaben in Canvas-Koordinaten
    renderer.ts     Canvas-Kontext und Basiszeichnen
  game/
    entities/       Wiederverwendbare Zielobjekte
    game.ts         Spielschleife, Update und Render-Reihenfolge
    level-types.ts  Datenmodell für Level und Ziele
  data/
    prototype-level.json  Konfiguration des Testlevels
  main.ts           Anwendung zusammensetzen und starten
```

## Testlevel steuern

Das aktuelle Level ist 6.400 Pixel breit. Bewege die Kamera mit `A` / `D` oder den Pfeiltasten `←` / `→` horizontal durch die Kulisse. Hintergrund, Bäume, Scheune und Schild sind bewusst gezeichnete Platzhalter – keine finalen Assets.

## Aktueller Spielkern

- Mit einem Klick wird geschossen; ein Treffer auf das fliegende Platzhalter-Huhn gibt 100 Punkte.
- Das Magazin fasst acht Schuss und lädt automatisch nach dem letzten Schuss. Mit `R` lässt es sich vorher nachladen.
- Das Huhn reagiert auf Treffer, fällt sichtbar aus dem Bild und startet danach wieder am Levelrand.
- Jede Runde dauert 90 Sekunden. Der Endscreen zeigt die Punkte; mit `Enter` beginnt eine neue Runde.
- Ziele, Rundenzeit und Waffenwerte kommen aus `src/data/prototype-level.json`. Dort sind auch ein statisches Bonusziel (+250) und ein klar markiertes Freundes-Ziel (-300) definiert.
- Ziele erscheinen in eigenen Wellen. Pro Objekt lassen sich Startzeit, Sichtbarkeitsdauer und Wiederholungsintervall festlegen.
- Fliegende Ziele unterstützen die Flugbahnen `wave`, `zigzag` und `low`; Tempo und Flugbahn sind ebenfalls Datenwerte.
- Treffer lösen Partikel und Punktetext aus. Mehrere schnelle positive Treffer bauen eine Combo auf; ab drei Treffern steigt der Punkte-Multiplikator.
- Ein Startscreen beginnt die Runde erst per Klick oder `Enter`. Nach jeder Runde zeigt die Ergebnisansicht Trefferquote, Bestleistung und einen möglichen neuen Rekord.

Die JSON-Datei ist die spätere Brücke zum Level-Editor: Neue Werte und Zielobjekte können dort ergänzt werden, ohne die Spielschleife umzubauen.

## Visueller Level-Editor

Der Editor lädt das Testlevel in den Browser. Dort lassen sich Ziele auswählen, verschieben, hinzufügen, entfernen und in ihren Werten verändern. Die gestrichelte Umrandung in der Karte zeigt die echte **Hitbox**; Breite und Höhe sind direkt editierbar. Für jede Welle sind **Start**, **Sichtbar** und **Wiederholen** einstellbar; die Zeitleiste darunter zeigt alle Auftritte über die gesamte Runde. Fliegende Ziele besitzen zusätzlich eine **Flugbahn**. Der Button **„JSON exportieren“** lädt den aktuellen Stand als JSON-Datei herunter; **„JSON importieren“** lädt ihn später wieder ein. **„Level testen“** übergibt den aktuellen Stand direkt an das Spiel. Der Browser merkt sich diesen Teststand, bis er im Editor zurückgesetzt wird.
