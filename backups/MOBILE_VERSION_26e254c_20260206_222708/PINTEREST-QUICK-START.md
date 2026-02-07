# 🚀 Pinterest Upload - Quick Start

**Verwende diese Datei wenn du vergessen hast wie es geht!**

---

## ⚡ SCHNELLVERSION (5 Min)

```bash
cd ~/Development/eventbuzzer-homepage

# 1. Supabase CSV exportieren
# Gehe zu: https://supabase.com/dashboard/project/tfkiyvhfhvkejpljsnrk/editor
# Table: events → Export CSV → Speichere als "supabase-events.csv"

# 2. Pinterest CSV generieren
node scripts/convert-pinterest-offline.mjs

# 3. Auf Pinterest hochladen
# Gehe zu: https://pinterest.com/settings/import-content
# Upload: pinterest-100-pins.csv

# 4. Events markieren (nach Pinterest-Upload!)
node scripts/mark-pinterest-uploaded.mjs
```

**Fertig! 🎉**

---

## 📋 WENN WAS SCHIEF GEHT

### Problem: "pinterest-uploaded-ids.json nicht gefunden"

```bash
# IDs aus Pinterest CSV extrahieren:
node scripts/extract-ids-from-pinterest-csv.mjs

# Dann markieren:
node scripts/mark-pinterest-uploaded.mjs
```

### Problem: "supabase-events.csv nicht gefunden"

Hast du den Supabase CSV Export vergessen!
- Gehe zu Supabase Dashboard
- Table Editor → events
- Export CSV → speichere als `supabase-events.csv`

### Problem: "Keine passenden Events gefunden"

Alle Events sind schon hochgeladen! Check mit:
```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) FROM events
WHERE pinterest_uploaded_at IS NULL
AND image_url IS NOT NULL
AND start_date >= NOW();
```

---

## 📅 WANN NÄCHSTER UPLOAD?

**EMPFEHLUNG: 1x pro Woche**

- ✅ 100 Pins
- ✅ Jeden Montag oder Dienstag
- ❌ NICHT täglich!

**Nächster Upload:** 03./04. Februar 2026

**Reminder setzen:**
- Kalender: "Pinterest Upload" (wöchentlich)
- Link: Diese Datei oder [PINTEREST-CHECKLIST.md](PINTEREST-CHECKLIST.md)

---

## 🎯 ZUSAMMENFASSUNG

| Was | Befehl |
|-----|--------|
| CSV generieren | `node scripts/convert-pinterest-offline.mjs` |
| Events markieren | `node scripts/mark-pinterest-uploaded.mjs` |
| IDs extrahieren | `node scripts/extract-ids-from-pinterest-csv.mjs` |
| Supabase Export | [Dashboard Link](https://supabase.com/dashboard/project/tfkiyvhfhvkejpljsnrk/editor) |
| Pinterest Upload | [Settings Link](https://pinterest.com/settings/import-content) |

---

**Pro Woche:** 10 Min = 100 Backlinks = 🚀**

**Ziel:** ~1400 Pins in 14 Wochen!

---

**Erstellt:** 27. Januar 2026
**Nächster Upload:** 03./04. Februar 2026
