# 🔄 Pinterest Upload Workflow

**Komplette Anleitung für wiederholte Pinterest-Uploads ohne Duplikate**

---

## 📋 Einmalige Setup-Schritte (NUR BEIM ERSTEN MAL!)

### 1. Database Migration ausführen

Die Migration fügt die Spalte `pinterest_uploaded_at` zur `events` Tabelle hinzu.

**Via Supabase Dashboard:**

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Öffne dein Projekt
3. Klick auf **SQL Editor** (linke Sidebar)
4. Öffne die Datei: `supabase/migrations/20260127_add_pinterest_uploaded_at.sql`
5. Kopiere den SQL-Code
6. Füge ihn in den SQL Editor ein
7. Klick auf **Run** (oder Cmd/Ctrl + Enter)

**SQL Code:**
```sql
-- Add pinterest_uploaded_at column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS pinterest_uploaded_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_pinterest_uploaded_at
ON events(pinterest_uploaded_at);

-- Comment
COMMENT ON COLUMN events.pinterest_uploaded_at IS 'Timestamp when this event was uploaded to Pinterest via CSV bulk upload';
```

✅ **Fertig!** Die Spalte ist jetzt in der Datenbank.

---

## 🔄 Wiederholbarer Upload-Workflow

### SCHRITT 1: Supabase CSV Export

1. Gehe zu **Supabase Dashboard** → **Table Editor**
2. Öffne Tabelle **events**
3. Klick oben rechts auf **"..."** (drei Punkte)
4. Wähle **"Export to CSV"**
5. Speichere als **`supabase-events.csv`** im Projekt-Root

**WICHTIG:** Der Export muss die Spalte `pinterest_uploaded_at` enthalten!

---

### SCHRITT 2: Pinterest CSV generieren

```bash
cd ~/Development/eventbuzzer-homepage
node scripts/convert-pinterest-offline.mjs
```

**Was passiert:**
- Lädt `supabase-events.csv`
- Filtert Events:
  - ✅ Mit Bild (`image_url`)
  - ✅ Zukünftig (`start_date >= heute`)
  - ✅ Noch NICHT auf Pinterest (`pinterest_uploaded_at IS NULL`)
- Nimmt Top 100 nach `buzz_score`
- Generiert:
  - `pinterest-100-pins.csv` (für Pinterest Upload)
  - `pinterest-uploaded-ids.json` (Event-IDs zum Markieren)

---

### SCHRITT 3: CSV auf Pinterest hochladen

1. Gehe zu [Pinterest.com](https://pinterest.com)
2. **Settings** → **Import content**
3. **Upload .csv file** klicken
4. Wähle: **`pinterest-100-pins.csv`**
5. Pinterest prüft die Datei (10-30 Sekunden)
6. Klick auf **"Publish"**
7. Warte auf Bestätigung per E-Mail (ca. 2 Stunden)

---

### SCHRITT 4: Events in Supabase markieren

**WICHTIG:** Erst NACH erfolgreichem Pinterest-Upload ausführen!

```bash
node scripts/mark-pinterest-uploaded.mjs
```

**Was passiert:**
- Liest `pinterest-uploaded-ids.json`
- Verbindet zu Supabase
- Setzt `pinterest_uploaded_at = NOW()` für alle hochgeladenen Events
- Diese Events werden beim nächsten Lauf automatisch übersprungen!

---

### SCHRITT 5: Wiederholen für weitere Events

Beim nächsten Mal:

1. **Neuen Supabase-Export** herunterladen (um neue Events zu bekommen)
2. **Script ausführen** → generiert CSV mit **nächsten** 100 Events
3. **CSV hochladen** auf Pinterest
4. **Events markieren** in Supabase

**Wiederhole bis alle ~1400 Events hochgeladen sind!**

---

## 📊 Tracking & Analytics

### Wie viele Events sind bereits hochgeladen?

**SQL Query (Supabase SQL Editor):**
```sql
SELECT COUNT(*) as uploaded_count
FROM events
WHERE pinterest_uploaded_at IS NOT NULL;
```

### Wie viele Events fehlen noch?

```sql
SELECT COUNT(*) as remaining_count
FROM events
WHERE pinterest_uploaded_at IS NULL
  AND image_url IS NOT NULL
  AND start_date >= NOW();
```

### Welche Events wurden zuletzt hochgeladen?

```sql
SELECT id, title, pinterest_uploaded_at
FROM events
WHERE pinterest_uploaded_at IS NOT NULL
ORDER BY pinterest_uploaded_at DESC
LIMIT 20;
```

---

## 🔧 Troubleshooting

### Problem: "pinterest-uploaded-ids.json nicht gefunden"

**Lösung:**
- Führe zuerst `convert-pinterest-offline.mjs` aus
- Es generiert die Datei automatisch

### Problem: "Supabase Credentials fehlen"

**Lösung:**
- Stelle sicher dass `.env.local` existiert
- Enthält:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Problem: "Keine passenden Events gefunden"

**Mögliche Ursachen:**
- Alle Events sind bereits hochgeladen (`pinterest_uploaded_at IS NOT NULL`)
- Keine Events mit Bildern mehr übrig
- Alle Events sind in der Vergangenheit

**Lösung:**
- Check mit SQL Query (siehe oben) wie viele Events übrig sind
- Eventuell neue Events in Supabase hinzufügen

### Problem: CSV Upload auf Pinterest schlägt fehl

**Lösung:**
- Checke ob Board-Namen auf Pinterest existieren
- Checke ob Bilder (`Media URL`) öffentlich zugänglich sind
- Siehe [PINTEREST-SETUP.md](./PINTEREST-SETUP.md) für häufige Fehler

---

## 📝 Zusammenfassung

### Pro Upload-Zyklus:

1. ⬇️ Supabase CSV Export
2. 🔄 Script ausführen (`convert-pinterest-offline.mjs`)
3. ⬆️ CSV auf Pinterest hochladen
4. ✅ Events markieren (`mark-pinterest-uploaded.mjs`)
5. 🔁 Wiederholen für nächste 100 Events

### Zeitaufwand pro Zyklus:

- Export: 2 Min
- Script: 30 Sek
- Upload: 5 Min (+ 2h Wartezeit für Pinterest)
- Markieren: 30 Sek

**Total:** ~10 Min Arbeit pro 100 Pins

### Ziel:

- **14 Upload-Zyklen** à 100 Pins
- **~1400 Pins** total
- **~1400 Backlinks** von Pinterest
- **Massive SEO-Power!** 🚀

---

**Erstellt:** 27. Januar 2026
**Status:** ✅ Bereit für Produktion
