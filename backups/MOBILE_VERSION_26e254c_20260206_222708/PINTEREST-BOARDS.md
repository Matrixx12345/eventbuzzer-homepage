# 📌 Pinterest Board-Strategie für EventBuzzer

**Datum:** 26. Januar 2026

---

## ✅ EMPFOHLENE BOARDS (8 Stück)

Basierend auf deinen Event-Kategorien aus der Datenbank:

### 1. **Konzerte & Musik Schweiz**
- **Für:** category_main_id = ? ODER tags enthalten "konzert", "musik", "band", "live", "oper"
- **Beschreibung:** Die besten Konzerte, Live-Musik und Opern-Aufführungen in der Schweiz. Von Rock über Pop bis Klassik.
- **Keywords:** #KonzerteSchweiz #LiveMusic #MusikEvents

### 2. **Festivals Schweiz**
- **Für:** category_main_id = ? ODER tags enthalten "festival", "openair"
- **Beschreibung:** Top Festivals und Open-Airs in der Schweiz. Von Paléo bis Openair St. Gallen.
- **Keywords:** #FestivalsSchweiz #OpenAir #Sommerfestivals

### 3. **Sport & Fitness Events**
- **Für:** category_main_id = 4 ODER tags enthalten "sport", "ski", "bike", "action", "marathon"
- **Beschreibung:** Sportliche Events, Wettkämpfe und Fitness-Aktivitäten in der Schweiz.
- **Keywords:** #SportSchweiz #FitnessEvents #OutdoorSports

### 4. **Familien-Events Schweiz**
- **Für:** category_main_id = 5 ODER tags enthalten "familie", "kinder", "family"
- **Beschreibung:** Familienfreundliche Events und Aktivitäten für Groß und Klein in der Schweiz.
- **Keywords:** #FamilienEvents #KinderSchweiz #Ausflugstipps

### 5. **Kultur & Kunst Events**
- **Für:** Tags enthalten "museum", "theater", "ausstellung", "kultur", "kunst", "galerie"
- **Beschreibung:** Kulturelle Highlights: Ausstellungen, Theater, Museen und Kunstevents in der Schweiz.
- **Keywords:** #KulturSchweiz #Kunstevents #MuseenSchweiz

### 6. **Märkte & Messen Schweiz**
- **Für:** category_main_id = 6 ODER tags enthalten "markt", "messe", "weihnachtsmarkt"
- **Beschreibung:** Wochenmärkte, Weihnachtsmärkte und Messen in der Schweiz.
- **Keywords:** #MärkteSchweiz #Weihnachtsmärkte #Messen

### 7. **Wellness & Spa Events**
- **Für:** category_main_id = 2 ODER tags enthalten "wellness", "spa", "therme"
- **Beschreibung:** Entspannende Wellness-Events, Spa-Angebote und Thermalbäder in der Schweiz.
- **Keywords:** #WellnessSchweiz #SpaEvents #Entspannung

### 8. **Party & Nachtleben**
- **Für:** Tags enthalten "party", "club", "nightlife", "dj", "tanzparty"
- **Beschreibung:** Die heißesten Parties, Club-Events und Nightlife in der Schweiz.
- **Keywords:** #PartySchweiz #Nightlife #ClubEvents

### 9. **Events Schweiz** (Fallback)
- **Für:** Alle Events die in keine andere Kategorie passen
- **Beschreibung:** Alle Events, Konzerte, Festivals und Aktivitäten in der Schweiz auf einen Blick.
- **Keywords:** #EventsSchweiz #SchweizEvents #Veranstaltungen

---

## 📊 MAPPING-LOGIK

```javascript
function determineBoard(event) {
  // Elite Events (buzz_boost = 100) → Könnte eigenes Board haben, oder in Kategorien

  // Sport
  if (event.category_main_id === 4 || tags.includes('sport', 'ski', 'bike')) {
    return 'Sport & Fitness Events';
  }

  // Familie
  if (event.category_main_id === 5 || tags.includes('familie', 'kinder')) {
    return 'Familien-Events Schweiz';
  }

  // Wellness
  if (event.category_main_id === 2 || tags.includes('wellness', 'spa')) {
    return 'Wellness & Spa Events';
  }

  // Märkte
  if (event.category_main_id === 6 || tags.includes('markt', 'messe')) {
    return 'Märkte & Messen Schweiz';
  }

  // Konzerte & Musik
  if (tags.includes('konzert', 'musik', 'band', 'live', 'oper')) {
    return 'Konzerte & Musik Schweiz';
  }

  // Festivals
  if (tags.includes('festival', 'openair')) {
    return 'Festivals Schweiz';
  }

  // Kultur
  if (tags.includes('museum', 'theater', 'ausstellung', 'kultur', 'kunst')) {
    return 'Kultur & Kunst Events';
  }

  // Party
  if (tags.includes('party', 'club', 'nightlife', 'dj')) {
    return 'Party & Nachtleben';
  }

  // Fallback
  return 'Events Schweiz';
}
```

---

## 🎯 BOARD-SETUP IN PINTEREST

### ✅ ALLE BOARDS SIND EINGERICHTET (27. Januar 2026)

Die folgenden Boards sind auf Pinterest erstellt und bereit:

1. **Konzerte & Musik Schweiz** ✅
2. **Festivals Schweiz** ✅
3. **Sport & Fitness Events** ✅
4. **Familien-Events Schweiz** ✅
5. **Kultur & Kunst Events** ✅
6. **Märkte & Messen Schweiz** ✅
7. **Wellness & Spa Events** ✅
8. **Party & Nachtleben** ✅
9. **Events Schweiz** ✅ (Fallback Board)

**Status:** Alle 9 Boards sind live und bereit für CSV-Upload!

---

## 📈 ERWARTETE VERTEILUNG

Mit 1454 Events erwarten wir:
- **Konzerte & Musik:** ~200-300 Events
- **Festivals:** ~50-100 Events
- **Sport & Fitness:** ~150-250 Events
- **Familien-Events:** ~200-300 Events
- **Kultur & Kunst:** ~150-200 Events
- **Märkte & Messen:** ~50-100 Events
- **Wellness & Spa:** ~30-50 Events
- **Party & Nachtleben:** ~100-150 Events
- **Events Schweiz (Fallback):** ~200-300 Events

---

## ✅ STATUS UPDATE (27. Januar 2026)

### Erledigt:
- ✅ Alle 9 Pinterest Boards erstellt
- ✅ Script erstellt: `scripts/convert-pinterest-offline.mjs`
- ✅ CSV generiert: `pinterest-100-pins.csv`
- ✅ Board-Mapping implementiert basierend auf category_main_id + tags

### CSV Upload Statistik (100 Pins):
- **Wellness & Spa Events:** 36 Pins
- **Events Schweiz:** 25 Pins
- **Familien-Events Schweiz:** 22 Pins
- **Kultur & Kunst Events:** 6 Pins
- **Sport & Fitness Events:** 5 Pins
- **Festivals Schweiz:** 4 Pins
- **Märkte & Messen Schweiz:** 1 Pin
- **Party & Nachtleben:** 1 Pin

### Upload-Tracking System:

**Neue Spalte in Datenbank:** `pinterest_uploaded_at`
- Trackt welche Events bereits auf Pinterest hochgeladen wurden
- Verhindert Duplikate bei wiederholten Uploads
- Migration: `supabase/migrations/20260127_add_pinterest_uploaded_at.sql`

**Workflow für weitere Uploads:**

1. **Migration ausführen** (einmalig):
   ```bash
   # Über Supabase Dashboard SQL Editor:
   # Führe die Migration aus supabase/migrations/20260127_add_pinterest_uploaded_at.sql aus
   ```

2. **CSV generieren** (nur nicht-hochgeladene Events):
   ```bash
   # Exportiere Events aus Supabase (mit pinterest_uploaded_at Spalte!)
   # Speichere als supabase-events.csv

   node scripts/convert-pinterest-offline.mjs
   # → Generiert pinterest-100-pins.csv (nur Events mit pinterest_uploaded_at = NULL)
   # → Generiert pinterest-uploaded-ids.json (Event-IDs zum Markieren)
   ```

3. **CSV auf Pinterest hochladen:**
   - Gehe zu Pinterest.com → Settings → Import content
   - Upload: `pinterest-100-pins.csv`
   - Warte auf Bestätigung per E-Mail

4. **Events in Supabase markieren:**
   ```bash
   node scripts/mark-pinterest-uploaded.mjs
   # → Setzt pinterest_uploaded_at für alle hochgeladenen Events
   ```

5. **Wiederholen für nächste 100 Events:**
   - Script ausführen → CSV hochladen → Events markieren
   - Bis alle Events hochgeladen sind!

### ✅ ERSTER UPLOAD ERFOLGREICH (27. Januar 2026)

- **100 Pins hochgeladen** auf Pinterest
- **98 Events markiert** in Supabase (2 ohne external_id übersprungen)
- **Tracking funktioniert** - keine Duplikate mehr!
- **Pins gehen live** in ~2 Stunden

---

## 📅 UPLOAD-FREQUENZ & LIMITS

### Pinterest Limits:
- **Max 200 Pins pro CSV** (wir machen 100)
- **Max 1 Upload pro Tag empfohlen** (Pinterest Rate Limits)
- **Keine offiziellen monatlichen Limits**, aber zu viele Uploads = Spam-Verdacht

### Empfohlene Frequenz:

**Option A: Konservativ (empfohlen für Start)**
- **1x pro Woche:** 100 Pins
- **Bis alle ~1400 Events hochgeladen sind:** ~14 Wochen (3,5 Monate)
- **Vorteil:** Sicher, kein Spam-Risiko

**Option B: Aggressiv**
- **2x pro Woche:** 100 Pins pro Upload
- **Bis alle ~1400 Events hochgeladen sind:** ~7 Wochen (1,75 Monate)
- **Risiko:** Könnte als Spam erkannt werden

**Option C: Täglich (NICHT empfohlen!)**
- Pinterest könnte Account flaggen
- Zu viele Pins auf einmal = schlechte User Experience

**MEINE EMPFEHLUNG:** Option A - 1x pro Woche, jeden Montag oder Dienstag

---

## 🤖 SEMI-AUTOMATION

### Aktueller Workflow (manuell):
1. Supabase CSV exportieren
2. `node scripts/convert-pinterest-offline.mjs`
3. CSV auf Pinterest hochladen
4. `node scripts/mark-pinterest-uploaded.mjs`

### Mögliche Verbesserung:
**Script das ALLES macht** (außer Pinterest Upload):
```bash
node scripts/pinterest-workflow.mjs
```
- Verbindet direkt zu Supabase (kein CSV Export nötig!)
- Generiert Pinterest CSV
- Markiert Events automatisch nach Upload-Bestätigung

**Problem:** Pinterest hat keine offizielle API für Bulk-Upload!
- Nur CSV-Upload über Dashboard möglich
- Schritt 3 (Pinterest Upload) muss manuell bleiben

**Alternative:** Verwende Pinterest API für einzelne Pins
- Aber: 100 API Calls = langsamer als CSV
- CSV ist schneller und einfacher

### Beste Lösung für dich:
**Wöchentlicher Reminder + Checkliste:**
- Jeden Montag: Kalendereintrag "Pinterest Upload"
- Öffne: [PINTEREST-CHECKLIST.md](PINTEREST-CHECKLIST.md)
- Folge den Schritten (5-10 Min)
- Fertig!

---

## 📊 PROGRESS TRACKING

**Upload-Historie:**

| Datum | Pins | Total | Verbleibend | Board-Top |
|-------|------|-------|-------------|-----------|
| 27.01.2026 | 98 | 98 | ~1300 | Wellness & Spa (36) |
| __.__.2026 | ___ | ___ | ___ | ___ |
| __.__.2026 | ___ | ___ | ___ | ___ |

**Ziel:** ~1400 Pins = ~1400 Backlinks 🚀

---

**Erstellt:** 26. Januar 2026
**Zuletzt aktualisiert:** 27. Januar 2026
**Status:** ✅ Erster Upload erfolgreich! Nächster Upload: 03./04. Februar 2026
