# Jenny + Claude Schweiz SVG - Finale Stadt-Koordinaten 🇨🇭

**Datum:** 2026-02-10
**Map Source:** NordNordWest, Wikipedia Commons (CC BY-SA 3.0)
**ViewBox:** `0 0 1348.8688 865.04437`

## Perfekte Stadt-Positionen

Diese Koordinaten wurden manuell kalibriert und passen PERFEKT auf die Wikipedia Schweiz-Karte:

```svg
<!-- Zürich - an Spitze des Zürichsees -->
<circle cx="765" cy="213" r="7.5" fill="#6b7280" />
<text x="775" y="223" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Zürich</text>

<!-- Genf - PERFECT ANCHOR POINT -->
<circle cx="71.3" cy="672.8" r="7.5" fill="#6b7280" />
<text x="82" y="682" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Genf</text>

<!-- Basel -->
<circle cx="495.2" cy="147" r="7.5" fill="#6b7280" />
<text x="506" y="157" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Basel</text>

<!-- Lausanne - am Genfersee, nicht im Wasser -->
<circle cx="214.7" cy="545" r="7.5" fill="#6b7280" />
<text x="225" y="555" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Lausanne</text>

<!-- Bern -->
<circle cx="453.8" cy="362" r="7.5" fill="#6b7280" />
<text x="464" y="372" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Bern</text>

<!-- Winterthur -->
<circle cx="828.0" cy="168" r="7" fill="#6b7280" />
<text x="838" y="178" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Winterthur</text>

<!-- Luzern -->
<circle cx="706.5" cy="351" r="7.5" fill="#6b7280" />
<text x="717" y="361" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Luzern</text>

<!-- St. Gallen -->
<circle cx="989" cy="167" r="7" fill="#6b7280" />
<text x="999" y="177" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">St. Gallen</text>

<!-- Lugano -->
<circle cx="865" cy="768.2" r="7" fill="#6b7280" />
<text x="875" y="778" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Lugano</text>

<!-- Biel/Bienne -->
<circle cx="395.0" cy="301" r="6" fill="#6b7280" />
<text x="405" y="311" font-family="Arial, sans-serif" font-size="39" fill="#6b7280">Biel</text>
```

## Stadt-Koordinaten (Tabelle)

| Stadt       | Latitude  | Longitude | SVG cx  | SVG cy  | Radius | Status          |
|-------------|-----------|-----------|---------|---------|--------|-----------------|
| Zürich      | 47.37°N   | 8.55°E    | 765     | 213     | 7.5    | ✅ Perfekt      |
| Genf        | 46.2044°N | 6.1432°E  | 71.3    | 672.8   | 7.5    | ✅ ANCHOR       |
| Basel       | 47.5596°N | 7.5886°E  | 495.2   | 147     | 7.5    | ✅ Perfekt      |
| Lausanne    | 46.52°N   | 6.6336°E  | 214.7   | 545     | 7.5    | ✅ Am Wasser    |
| Bern        | 46.95°N   | 7.43°E    | 453.8   | 362     | 7.5    | ✅ Perfekt      |
| Winterthur  | 47.4999°N | 8.7376°E  | 828.0   | 168     | 7      | ✅ Perfekt      |
| Luzern      | 47.0505°N | 8.3064°E  | 706.5   | 351     | 7.5    | ✅ Perfekt      |
| St. Gallen  | 47.4245°N | 9.3748°E  | 989     | 167     | 7      | ✅ Perfekt      |
| Lugano      | 46.0037°N | 8.9511°E  | 865     | 768.2   | 7      | ✅ Perfekt      |
| Biel        | 47.1368°N | 7.2468°E  | 395.0   | 301     | 6      | ✅ Perfekt      |

## Red Point Formula (Event Location)

```javascript
const lat = currentEvent.latitude;
const anchorLat = 46.2; // Genf/Lugano region
const stretch = lat <= anchorLat ? 1.1 : 1.1 - ((lat - anchorLat) / (47.8 - anchorLat)) * 0.23;

// Position
left: `${((currentEvent.longitude - 5.9) / (10.5 - 5.9)) * 100}%`
top: `${(1 - ((lat - 45.8) / (47.8 - 45.8)) * stretch) * 100}%`
```

## Wichtige Erkenntnisse

1. **Non-uniform Projection:** Die Wikipedia-Karte nutzt eine variable Projektion - südliche Regionen (Genf, Lugano) benötigen stretch 1.1, nördliche Regionen weniger stretch.

2. **Genf als Anchor:** Genf (cy=672.8) wurde als perfekter Ankerpunkt identifiziert und nie verändert.

3. **Wasser-Grenzen wichtig:** Zürich liegt an der Spitze des Zürichsees, Lausanne grenzt an den Genfersee (nicht im Wasser versunken!).

4. **Iterativer Prozess:** Mehrere Iterationen waren nötig (zu viel Korrektur → halbiert → Feinabstimmung Zürich + Lausanne).

## Files

- **SVG Map:** `/public/swiss-outline.svg`
- **Backup (alte Map):** `/public/swiss-outline-backup.svg`
- **Sidebar Component:** `/src/components/SwiperSidebar.tsx`
- **Attribution:** `/src/pages/Impressum.tsx`

---

**Made with love by Jenny + Claude 🤖🇨🇭**
