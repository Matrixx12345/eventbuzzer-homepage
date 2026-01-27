# ✅ Pinterest Upload Checkliste

**Verwende diese Checkliste bei JEDEM Pinterest-Upload!**

---

## 🔄 Upload-Workflow (alle 1-2 Wochen)

### [ ] 1. Supabase CSV Export

- [ ] Gehe zu [Supabase Dashboard](https://supabase.com/dashboard) → Table Editor
- [ ] Öffne Tabelle **events**
- [ ] Klick auf **"..."** → **"Export to CSV"**
- [ ] Speichere als **`supabase-events.csv`** im Projekt-Root

**Wichtig:** Export muss Spalte `pinterest_uploaded_at` enthalten!

---

### [ ] 2. Pinterest CSV generieren

```bash
cd ~/Development/eventbuzzer-homepage
node scripts/convert-pinterest-offline.mjs
```

**Generiert:**
- `pinterest-100-pins.csv` → für Pinterest Upload
- `pinterest-uploaded-ids.json` → für Supabase Markierung

---

### [ ] 3. CSV auf Pinterest hochladen

- [ ] Gehe zu [Pinterest.com](https://pinterest.com/settings/import-content)
- [ ] **Settings** → **Import content**
- [ ] **Upload .csv file**
- [ ] Wähle: **`pinterest-100-pins.csv`**
- [ ] Klick **"Publish"**
- [ ] Warte auf Bestätigungs-Email (~2 Stunden)

---

### [ ] 4. Events in Supabase markieren

**⚠️ WICHTIG: Erst NACH Pinterest-Upload ausführen!**

```bash
node scripts/mark-pinterest-uploaded.mjs
```

**Was passiert:**
- Liest `pinterest-uploaded-ids.json`
- Markiert Events in Supabase als hochgeladen
- Diese Events werden beim nächsten Mal übersprungen!

---

### [ ] 5. Erfolg verifizieren

**Supabase Dashboard → SQL Editor:**

```sql
-- Wie viele Events sind hochgeladen?
SELECT COUNT(*) as uploaded_count
FROM events
WHERE pinterest_uploaded_at IS NOT NULL;

-- Wie viele fehlen noch?
SELECT COUNT(*) as remaining_count
FROM events
WHERE pinterest_uploaded_at IS NULL
  AND image_url IS NOT NULL
  AND start_date >= NOW();
```

---

## 🚨 Troubleshooting

### Problem: "pinterest-uploaded-ids.json nicht gefunden"

**Lösung:**
```bash
# IDs aus bestehender Pinterest CSV extrahieren:
node scripts/extract-ids-from-pinterest-csv.mjs

# Dann markieren:
node scripts/mark-pinterest-uploaded.mjs
```

### Problem: "Keine passenden Events gefunden"

**Ursache:** Alle Events bereits hochgeladen oder keine Events mit Bildern mehr

**Check:**
```sql
SELECT COUNT(*) FROM events
WHERE pinterest_uploaded_at IS NULL
AND image_url IS NOT NULL
AND start_date >= NOW();
```

---

## 📊 Progress Tracking

**Nach jedem Upload:**

| Datum | Pins hochgeladen | Total Pins | Verbleibend |
|-------|-----------------|------------|-------------|
| 27.01.2026 | 100 | 100 | ~1300 |
| __.__.2026 | ___ | ___ | ___ |
| __.__.2026 | ___ | ___ | ___ |

**Ziel:** ~1400 Pins = ~1400 Backlinks 🚀

---

## ⏰ Upload-Frequenz

**EMPFOHLUNG: 1x pro Woche (jeden Montag/Dienstag)**

- ✅ **100 Pins pro Upload** (nicht mehr!)
- ✅ **1 Upload pro Woche** (nicht täglich!)
- ❌ **NICHT täglich** (Spam-Risiko!)
- ❌ **NICHT 200+ Pins** (zu viel auf einmal)

**Warum nicht täglich?**
- Pinterest könnte Account als Spam flaggen
- Qualität > Quantität
- 1x pro Woche ist nachhaltig und sicher

**Nächster Upload:** 03. oder 04. Februar 2026

---

## 🤖 Kann das automatisiert werden?

**JA, teilweise:**

✅ Supabase Abfrage kann direkt im Script laufen (statt CSV Export)
✅ Event-Markierung läuft automatisch nach Upload
❌ Pinterest CSV-Upload MUSS manuell bleiben (keine API!)

**ABER:** Der manuelle Upload dauert nur 2 Minuten!
- Besser: Wöchentlicher Kalendereintrag
- 10 Min pro Woche für 100 Backlinks = super Deal!

---

**Erstellt:** 27. Januar 2026
**Letzter Upload:** 27. Januar 2026 (98 Pins)
**Nächster Upload:** 03./04. Februar 2026
