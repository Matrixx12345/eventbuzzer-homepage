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

### 1. Malen wie Paul Klee
- **Event ID:** 59606
- **Status:** ✅ GELÖSCHT (2026-02-09)

### 2. Meringues selber machen
- **Event ID:** 77404
- **Status:** ✅ GELÖSCHT (2026-02-09)

### 3. Wenn Schafe geschieden werden
- **Event IDs:** 137542, 137545, 77734, 137543, 137544 (5 Duplikate)
- **Status:** ✅ GELÖSCHT (2026-02-09)

### 4. Von tisch zu tisch
- **Event ID:** (nicht in Datenbank gefunden)
- **Status:** ✅ BEREITS GELÖSCHT oder nicht vorhanden

---

## 🚫 Blocklist für Importe

Um zu verhindern, dass gelöschte Events beim nächsten Import wieder reinkommen, wurde ein Blocklist-Filter in alle Import-Funktionen integriert:

```javascript
// BLOCKLIST - Events die NICHT importiert werden dürfen
const BLOCKED_EVENT_TITLES = [
  'malen wie paul klee',
  'meringues selber machen',
  'wenn schafe geschieden werden',
  'von tisch zu tisch',
  'disc golf',  // bereits gefilter im Frontend
];

// Blocklist-Check beim Import (vor INSERT):
const titleLower = event.title.toLowerCase();
if (BLOCKED_EVENT_TITLES.some(blocked => titleLower.includes(blocked))) {
  console.log(`⏭️  Skipped BLOCKED event: "${event.title}"`);
  continue; // Skip this event
}
```

### ✅ Implementiert in (2026-02-09):
1. **`supabase/functions/myswitzerland-import/index.ts`** (Lines 9-16, 246-250)
   - Blocklist hinzugefügt nach API_BASE_URL
   - Check nach item title extraction hinzugefügt

2. **`supabase/functions/tm-import/index.ts`** (Lines 9-16, 285-290)
   - Blocklist hinzugefügt nach TM_API_URL
   - Check nach event.name extraction hinzugefügt

3. **`supabase/functions/sync-ticketmaster-events/index.ts`** (Lines 8-15, 135-142)
   - Blocklist hinzugefügt nach corsHeaders
   - Check im event processing loop hinzugefügt

**Logging:** Alle blockierten Events werden mit `⏭️  Skipped BLOCKED event: "..."` geloggt

---

**Letzte Aktualisierung:** 2026-02-09
- ✅ 7 Events gelöscht
- ✅ Blocklist in 3 Import-Funktionen implementiert (myswitzerland, tm-import, sync-ticketmaster)
