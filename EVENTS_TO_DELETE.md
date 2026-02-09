# Events zu löschen

Diese Liste enthält Events die aus der Datenbank entfernt werden sollen.

## ❌ Zu löschende Events

### 1. Longines Chi Classics Basel
- **Event Name:** Longines Chi Classics Basel
- **Ort:** Basel
- **Kategorie:** Sport
- **Grund:** Sportevent ohne spezifische Beschreibung oder zusätzliche Informationen. Keine relevanten Details für User.
- **Status:** ⏳ Zu löschen
- **Datum hinzugefügt:** 2026-02-06

### 2. Malen wie Paul Klee
- **Event Name:** Malen wie Paul Klee
- **Beschreibung:** Ein kreativer Workshop kombiniert m... (abgeschnitten)
- **Kategorie:** Workshop/Kultur
- **Grund:** Unvollständiger Titel und Beschreibung. Event-Informationen abgeschnitten und nicht aussagekräftig.
- **Status:** ⏳ Zu löschen
- **Datum hinzugefügt:** 2026-02-06

---

## 📋 Prozess zum Löschen

1. Event in Supabase Database identifizieren
2. `external_id` oder `id` notieren
3. SQL Query ausführen:
   ```sql
   DELETE FROM events WHERE title = 'Longines Chi Classics Basel' AND address_city = 'Basel';
   ```
4. Sitemap neu generieren:
   ```bash
   node scripts/generate-sitemap-chunked.mjs
   ```
5. In Google Search Console als entfernt markieren

---

## ✅ Gelöschte Events (Archiv)

_Noch keine Events gelöscht._

---

**Letzte Aktualisierung:** 2026-02-06
