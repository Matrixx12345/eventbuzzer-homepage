# Fallback: Map-Ansicht & Event-Detail-Modal

**Erstellt am:** 29. Januar 2026
**Grund:** Backup vor Umstellung auf "Hybrid-Premium"-Karten-Design

---

## 📁 Gesicherte Dateien

Die folgenden Dateien wurden als Fallback gespeichert:

**Backup-Pfad:** `/Users/jj/Development/eventbuzzer-homepage/backups/fallback-map-ansicht-20260129_002150/`

### 1. EventList1.tsx (Events-Seite mit Map)
- **Pfad:** `src/pages/EventList1.tsx`
- **Beschreibung:** Die vollständige Events-Listing-Seite mit großer, expandierbarer Karte rechts
- **Features:**
  - Split-Layout: Event-Liste (55-63%) + Karte (34-45%)
  - Expandierbare Karte mit Maximize/Minimize Button
  - Event-Karten mit Foto links, Content rechts (horizontal)
  - Nearby Events Filter (10km Umkreis)
  - Icon-Batterie unter jeder Karte: Herz, Ticket, MapPin
  - Pagination & Infinite Scroll
  - Chatbot-Widget im Sidebar
  - Filter-Bar mit Kategorien, Stadt, Datum, etc.

### 2. EventDetailModal.tsx (Event-Popup)
- **Pfad:** `src/components/EventDetailModal.tsx`
- **Beschreibung:** Das Premium-Glassmorphism-Modal, an dem heute gearbeitet wurde
- **Features:**
  - Glassmorphism-Design mit `backdrop-filter: blur(20px)`
  - Hero-Image oben (280px Höhe)
  - Tags als Pills oben links im Bild
  - Titel in Serif-Schrift unter dem Bild
  - 2-zeilige Description mit "mehr lesen" Link
  - Action-Buttons: Herz, Kalender, Teilen, Rating (als runde Buttons)
  - Dunkelblauer "Ticket kaufen" Button (rechtsbündig)
  - Kompakte Details im Footer (Datum, Ort, Preis)
  - User-Rating-System mit localStorage

### 3. EventCard.tsx (Grid-Karten)
- **Pfad:** `src/components/EventCard.tsx`
- **Beschreibung:** Die Grid-Event-Karten (für Homepage-Grid, nicht für Map-Ansicht)
- **Features:**
  - Ultra-kompaktes 2.5:1 Bild-Format
  - Premium-Filter (blur, saturate, sepia, vignette)
  - Herz-Button oben rechts
  - 2-zeilige Titel, Venue, Location mit Mini-Map
  - Footer mit Star-Rating + Buzz-Tracker

---

## 🎯 Warum das Backup?

### Problem mit der aktuellen Map-Ansicht
Die Event-Karten in der Map-Ansicht (EventList1.tsx) wirken im Vergleich zum Grid "billiger":

1. **Icon-Batterie:** Die Reihe aus Stern, Herz, Einkaufswagen und Pin wirkt wie eine Excel-Tabelle
2. **Gequetschte Inhalte:** Karte nimmt viel Platz weg, Event-Karten wirken wie "Vorschau" statt "Erlebnis"
3. **Harte Kanten:** Die Karten sind zu flach, keine Tiefe
4. **Fehlende Magazine-Ästhetik:** Kein Premium-Look wie beim Grid oder Modal

### Geplante Lösung: "Hybrid-Premium"-Karten
Wir übertragen die Logik vom perfekten Popup (EventDetailModal) auf die Liste:

1. **Icons radikal reduzieren**
   - Nur Herz-Icon als filigranes Outline-Icon direkt oben rechts auf dem Foto (wie im Grid)
   - Rest (Kalender, Teilen, Bewertung) nur im Popup zeigen

2. **Mehr Bild, weniger Datenblatt**
   - Foto größer/breiter machen
   - Adresse dezent über oder unter den Titel

3. **Glassmorphism-Light für Karten**
   - Heller, leicht transparenter Look wie beim Popup
   - Zarter Schatten für Schwebeffekt

4. **Typografie-Switch**
   - Serif-Schrift für Titel (wie im Modal)
   - Macht den Unterschied zwischen "Webseite" und "Magazin"

5. **"Buzz"-Faktor**
   - Roter Trending-Balken dezent am unteren Rand des Bildes oder der Karte

---

## 🔄 Wiederherstellen

Falls das neue Design nicht funktioniert oder zurückgerollt werden soll:

```bash
# Zum Projekt-Verzeichnis navigieren
cd /Users/jj/Development/eventbuzzer-homepage

# Backup-Ordner anzeigen
ls -la backups/fallback-map-ansicht-*/

# Dateien wiederherstellen
cp /Users/jj/Development/eventbuzzer-homepage/backups/fallback-map-ansicht-20260129_002150/EventList1.tsx src/pages/
cp /Users/jj/Development/eventbuzzer-homepage/backups/fallback-map-ansicht-20260129_002150/EventDetailModal.tsx src/components/
cp /Users/jj/Development/eventbuzzer-homepage/backups/fallback-map-ansicht-20260129_002150/EventCard.tsx src/components/

# Deployment
# Das Projekt wird automatisch über Vercel deployed
# Nach dem Wiederherstellen: git commit & push, Vercel deployed automatisch
git add .
git commit -m "Revert to fallback map-ansicht design"
git push origin main
```

---

## 📝 Design-Philosophie

### Was funktioniert (vom Grid lernen):
- ✅ Ultra-kompakte Bilder mit Premium-Filtern
- ✅ Minimalistische Icon-Platzierung (Herz auf Foto)
- ✅ Serif-Titel für Magazine-Look
- ✅ Glassmorphism für Modernität

### Was NICHT funktioniert (Map-Ansicht alt):
- ❌ Icon-Batterie unter der Karte (zu funktional, nicht sexy)
- ❌ Zu viele Informationen auf kleinem Raum
- ❌ Flache Karten ohne Tiefe
- ❌ Keine visuelle Hierarchie

### Ziel: "Vogue für Events"
Jede Karte soll wirken wie ein Editorial-Bild in einem Hochglanz-Magazin, nicht wie ein Datenbank-Eintrag.

---

## 🚀 Deployment

Das Projekt wird über **Vercel** automatisch deployed:

- **Live-URL:** eventbuzzer.ch
- **Auto-Deploy:** Jeder Push auf `main` Branch löst automatisch einen Vercel-Deploy aus
- **Preview-Deploys:** Pull Requests erhalten eigene Preview-URLs

### Deployment-Workflow
```bash
# Änderungen committen
git add .
git commit -m "Update: Hybrid-Premium-Karten für Map-Ansicht"

# Pushen (triggert automatischen Vercel-Deploy)
git push origin main

# Vercel deployed automatisch und zeigt Status in GitHub
```

---

## 🚀 Nächste Schritte

1. ✅ Backup erstellt
2. ✅ EventCard in EventList1.tsx für Hybrid-Premium angepasst
3. ✅ README dokumentiert
4. ⏳ Testen: Responsiveness, Performance, UX
5. ⏳ Feedback einholen
6. ⏳ Git commit & Vercel deployment

---

**Erstellt von:** Claude Code
**Projekt:** EventBuzzer Homepage
**Deployment:** Vercel (Auto-Deploy bei Git Push)
**Kontakt:** https://github.com/anthropics/claude-code/issues
