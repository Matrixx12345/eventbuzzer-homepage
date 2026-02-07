# Trip Planner Timeline Spacing Fix

## Problem
Massive vertikale Lücke zwischen dem "Event hinzufügen" Plus Button (zwischen Sections) und der nächsten Event-Karte.

## Root Cause
Das Problem wurde durch übermäßige Margins an mehreren Stellen verursacht:

### 1. Section Container (Zeile 912)
- **Original**: `className="mb-16"` (64px margin-bottom)
- **Problem**: Jede Section hatte 64px Abstand nach unten, auch wenn ein Plus Button dazwischen war
- **Fix**: `className="mb-0"` (kein margin)

### 2. Section Header (Zeile 914)
- **Original**: `className="... mb-6 ..."` (24px margin-bottom)
- **Problem**: Zu viel Abstand zwischen Section Header und erster Event-Karte
- **Fix**: `className="... mb-3 ..."` (12px margin-bottom)

### 3. Between-Sections Plus Button Container (Zeile 1092)
- **Original**: `className="relative mt-6 mb-6"` (24px oben, 24px unten)
- **Problem**: Zu wenig Abstand, Plus Button war nicht mittig
- **Fix**: `className="relative mt-8 mb-5"` (32px oben, 20px unten)
  - Oben: 32px
  - Unten: 20px + Section Header mb-3 (12px) = 32px
  - **Ergebnis**: Gleicher Abstand nach oben und unten

## Gesamtrechnung

### Vorher (massive Lücke)
- Plus Button mb-6: 24px
- Section Container mb-16: 64px
- Section Header mb-6: 24px
- **Total: ~112px**

### Nachher (optimiert)
- Plus Button mt-8: 32px (oben)
- Plus Button mb-5: 20px (unten)
- Section Container mb-0: 0px
- Section Header mb-3: 12px
- **Total zwischen Event-Karten: 32px (oben) + 32px (unten) = gleichmäßig**

## Betroffene Datei
- `/Users/jj/Development/eventbuzzer-homepage/src/pages/TripPlanerNew.tsx`

## Änderungen
1. **Zeile 912**: Section Container von `mb-16` zu `mb-0`
2. **Zeile 914**: Section Header von `mb-6` zu `mb-3`
3. **Zeile 1092**: Between-Sections Plus Button von `mt-6 mb-6` zu `mt-8 mb-5`
