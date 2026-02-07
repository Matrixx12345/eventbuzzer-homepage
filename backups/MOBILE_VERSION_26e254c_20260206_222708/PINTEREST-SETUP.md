# 📌 Pinterest Setup - Komplette Anleitung

**Ziel:** 100-500 Pins = 100-500 Backlinks = Massive SEO-Power!

---

## PHASE 1: PINTEREST ACCOUNT (20 Min)

### SCHRITT 1: Business Account erstellen

1. **Gehe zu:** https://www.pinterest.com/business/create/
2. **Email:** Deine Email
3. **Passwort:** Sicheres Passwort
4. **Profil-Name:** "EventBuzzer"
5. **Klick "Create Account"**

### SCHRITT 2: Profil einrichten

**Profilbild:**
- Lade das EventBuzzer Logo hoch (oder erstelle eins mit Canva)
- Größe: 165x165 Pixel

**Display Name:** EventBuzzer

**About:**
```
Entdecke über 1400 Events, Konzerte, Festivals und Aktivitäten
in der Schweiz. Finde Events in Zürich, Basel, Bern, Genf und
mehr auf EventBuzzer.ch 🎉
```

**Website:** `https://eventbuzzer.ch`

**Standort:** Switzerland

### SCHRITT 3: Website verifizieren (WICHTIG für SEO!)

1. **Settings** → **Claim** → **Claim your website**
2. Pinterest zeigt dir einen HTML-Tag:
   ```html
   <meta name="p:domain_verify" content="XXXXXXXXX"/>
   ```
3. **Füge diesen Tag in Index.tsx ein** (wie bei Google Verification)
4. **Deploye die Änderung**
5. **Zurück zu Pinterest** → **Verify**
6. **Status: Verified ✅**

**Warum wichtig:**
- Verifizierte Websites bekommen mehr Reichweite
- Pins haben mehr Authority
- Bessere Analytics

---

## PHASE 2: BOARDS ERSTELLEN (15 Min)

**Was sind Boards?**
= Kategorien/Ordner für deine Pins

### SCHRITT 1: Ersten Board erstellen

1. **Klick auf dein Profil** (oben rechts)
2. **"Boards"** → **"Create Board"**
3. **Name:** "Konzerte Schweiz 2026"
4. **Description:**
   ```
   Die besten Konzerte in der Schweiz 2026. Von Rock über Pop bis
   Jazz - finde alle Konzerte in Zürich, Basel, Bern, Genf und mehr.
   Tickets und Infos auf EventBuzzer.ch
   ```
5. **Public** (nicht Secret!)
6. **Create**

### SCHRITT 2: Weitere Boards erstellen

Erstelle insgesamt **10-15 Boards:**

1. **Konzerte Schweiz 2026**
2. **Festivals Schweiz 2026**
3. **Events Zürich**
4. **Events Basel**
5. **Events Bern**
6. **Events Genf**
7. **Events Luzern**
8. **Familien-Events Schweiz**
9. **Romantische Events Schweiz**
10. **Party & Nachtleben Schweiz**
11. **Kultur & Kunst Events**
12. **Sport Events Schweiz**
13. **Outdoor-Aktivitäten Schweiz**
14. **Winter-Events Schweiz**
15. **Sommer-Events Schweiz**

**Pro Board:** 5 Min → Total 15 Boards = 75 Min

---

## PHASE 3: ERSTE PINS ERSTELLEN (Manual, 30 Min für 10 Pins)

### PIN-FORMAT:

**Bild:** 1000x1500 Pixel (Pinterest liebt Hochformat!)

**Wie bekommst du Bilder:**
1. **Option A:** Event-Bilder von EventBuzzer (einfach downloaden)
2. **Option B:** Mit Canva Pin-Designs erstellen (professioneller)

### SCHRITT 1: Pin erstellen

1. **Klick auf "+"** (oben rechts) → **"Create Pin"**
2. **Upload Bild** (Event-Foto)
3. **Titel:** "Konzert: Ed Sheeran in Zürich | 15. März 2026"
4. **Description:**
   ```
   Ed Sheeran Live in Zürich am 15. März 2026 im Hallenstadion.

   🎵 Datum: 15. März 2026, 20:00 Uhr
   📍 Ort: Hallenstadion Zürich
   🎫 Tickets ab CHF 89

   Alle Infos, Tickets und weitere Konzerte in der Schweiz auf
   EventBuzzer.ch

   #EdSheeran #KonzerteZürich #EventsSchweiz #Hallenstadion
   #LiveMusic #Konzerte2026
   ```
5. **Destination Link:** `https://eventbuzzer.ch/event/[event-id]`
6. **Board wählen:** "Konzerte Schweiz 2026"
7. **Publish**

### SCHRITT 2: Weitere 9 Pins erstellen

Wähle 9 verschiedene Events:
- 3 Konzerte
- 2 Festivals
- 2 Events in Zürich
- 2 Familien-Events

**Pro Pin: 3 Min** → 10 Pins = 30 Min

---

## PHASE 4: AUTOMATISIERUNG MIT TAILWIND (Optional aber empfohlen!)

### WAS IST TAILWIND?

**Pinterest Scheduler** - Upload 100 Pins, Tailwind postet automatisch über Wochen

**Kosten:** ~$15/Monat (erste 100 Pins gratis!)

### SETUP (20 Min):

1. **Gehe zu:** https://www.tailwindapp.com/
2. **Sign up with Pinterest** (verbindet deinen Pinterest-Account)
3. **Plan wählen:** Free Trial starten
4. **"Create" → "Bulk Upload"**
5. **CSV-Datei vorbereiten:**

```csv
Image URL,Title,Description,Link,Board
https://eventbuzzer.ch/event-image-1.jpg,"Konzert: Band X","Beschreibung...","https://eventbuzzer.ch/event/1","Konzerte Schweiz 2026"
https://eventbuzzer.ch/event-image-2.jpg,"Festival: Name","Beschreibung...","https://eventbuzzer.ch/event/2","Festivals Schweiz 2026"
```

6. **CSV hochladen** → Tailwind plant automatisch
7. **Publishing Schedule:** 5-10 Pins pro Tag (verteilt über Wochen)

### VORTEIL:

- **1x Arbeit:** CSV erstellen
- **100 Pins hochladen**
- **Automatisch über 2-3 Wochen verteilt**
- **Du musst NICHTS mehr machen!**

---

## PHASE 5: MASSEN-UPLOAD VORBEREITEN (für später)

### STRATEGIE: 1454 Events → 1454 Pins

**Zu viel Arbeit manuell!** → Automatisieren

**OPTION A: CSV-Generator schreiben (Programmierung nötig)**

Python-Script:
```python
# Liest Events aus Supabase
# Generiert CSV für Tailwind
# Mit Titel, Description, Link, Board
```

**OPTION B: Manuell in Batches (realistische Lösung)**

- Woche 1: 50 Pins (Konzerte)
- Woche 2: 50 Pins (Festivals)
- Woche 3: 50 Pins (Zürich Events)
- Woche 4: 50 Pins (Basel Events)
- Etc.

Nach 6 Monaten: Alle 1454 Events als Pins ✅

---

## 📊 WAS BRINGT DAS?

### NACH 1 MONAT (100 Pins):
- 100 Backlinks von Pinterest
- 50-200 Clicks/Monat von Pinterest
- Pinterest-Traffic = qualifizierte Besucher (suchen aktiv Events)

### NACH 3 MONATEN (500 Pins):
- 500 Backlinks
- 500-1000 Clicks/Monat
- Google sieht: "Diese Seite ist populär" → Rankings steigen

### NACH 6 MONATEN (1000+ Pins):
- 1000+ Backlinks
- 2000+ Clicks/Monat von Pinterest
- Pinterest = 20-30% deines gesamten Traffics

---

## 🎯 ZEITPLAN

### HEUTE/MORGEN (Setup):
- [ ] Pinterest Business Account (20 Min)
- [ ] Website verifizieren (10 Min)
- [ ] 10 Boards erstellen (60 Min)
- [ ] Erste 10 Pins manuell (30 Min)

**Total: 2 Stunden**

### DIESE WOCHE:
- [ ] Tailwind einrichten (20 Min)
- [ ] 50 Events als CSV vorbereiten (2 Stunden)
- [ ] Über Tailwind hochladen (10 Min)

**Total: 2.5 Stunden**

### NÄCHSTE 4 WOCHEN:
- [ ] Jeden Montag: 50 neue Pins vorbereiten (2 Stunden)
- [ ] Upload über Tailwind (10 Min)
- [ ] → Nach 4 Wochen: 200 Pins online!

---

## 💡 PRO-TIPPS

### 1. PIN-DESIGN OPTIMIEREN

**Tool: Canva (kostenlos)**
- Vorlage: "Pinterest Pin" (1000x1500px)
- Event-Bild + Text-Overlay
- EventBuzzer Logo unten rechts
- Professioneller Look

### 2. KEYWORDS IN DESCRIPTIONS

**Wichtige Keywords:**
- Events Schweiz
- Konzerte [Stadt]
- Festivals Schweiz
- [Event-Kategorie] [Stadt]

**Beispiel:**
```
Ed Sheeran Konzert Zürich 2026 | Hallenstadion

Erlebe Ed Sheeran live in Zürich! Das Konzert im März 2026
wird ein Highlight für alle Musik-Fans. Sichere dir jetzt Tickets.

📍 Hallenstadion Zürich
🎫 Tickets: EventBuzzer.ch

#KonzerteZürich #EventsSchweiz #EdSheeran #LiveMusic
#Konzerte2026 #ZürichEvents #Hallenstadion
```

### 3. HASHTAGS NUTZEN

**Pro Pin: 5-10 Hashtags**
- #EventsSchweiz
- #KonzerteZürich
- #FestivalsSchweiz
- #[Kategorie]Schweiz
- #[Stadt]Events

### 4. BESTE POSTING-ZEITEN

Pinterest-Algorithmus mag:
- **Abends:** 18-21 Uhr (User suchen Events fürs Wochenende)
- **Wochenende:** Samstag/Sonntag
- **Konsistenz:** Lieber täglich 5 Pins als 1x pro Woche 50 Pins

---

## ✅ ZUSAMMENFASSUNG

**Pinterest ist ein Game Changer für EventBuzzer!**

**Warum:**
- Einfachste Backlink-Strategie
- Automatisierbar mit Tailwind
- Langfristiger Traffic (Pins leben Jahre)
- User mit Purchase Intent (suchen aktiv Events)

**Investment:**
- Setup: 2 Stunden (einmalig)
- Weekly: 2 Stunden (neue Pins)
- Kosten: $15/Monat (Tailwind)

**Return:**
- 100-1000 Backlinks
- 500-2000 Besucher/Monat
- Bessere Google Rankings
- Affiliate-Kommissionen

**→ ABSOLUTE No-Brainer für dich!** 🚀

---

## 📋 PINTEREST CSV-FORMAT (WICHTIG!)

### Offizielle Anforderungen von Pinterest

**Pinterest Business Accounts können bis zu 200 Pins per CSV hochladen.**

### Erforderliche Spalten (EXAKT diese Namen!)

| Spaltenname | Pflicht | Kriterien | Beispiel |
|-------------|---------|-----------|----------|
| **Media URL** | ✅ Ja | Öffentlich verfügbarer Link zum Bild (PNG/JPEG) oder Video (MP4) | `https://example.com/image.jpg` |
| **Title** | ✅ Ja | Maximal 100 Zeichen | `Ed Sheeran Konzert Zürich` |
| **Pinterest board** | ✅ Ja | Name des Boards (wird erstellt falls nicht vorhanden). Für Board Sections: `Board/Section` | `Konzerte & Musik Schweiz` oder `Events/Zürich` |
| **Description** | ⚪ Optional | Maximal 500 Zeichen | `Die besten Events in der Schweiz...` |
| **Link** | ⚪ Optional | URL zu der der Pin verlinkt | `https://eventbuzzer.ch/event/123` |
| **Publish date** | ⚪ Optional | ISO 8601 Format. Zukünftiges Datum = geplant. Leer = sofort | `2026-03-15T08:00:00` |
| **Keywords** | ⚪ Optional | Komma-getrennte Liste | `konzerte, zürich, events` |
| **Thumbnail** | ⚪ Video only | Timestamp (mm:ss), Sekunden (ss), oder Bild-URL | `01:30` |

### CSV-Formatierung Best Practices

✅ **Header-Zeile:** Erste Zeile MUSS exakt diese Spaltennamen enthalten
✅ **Alle Werte in Quotes:** Alle Felder in doppelte Anführungszeichen setzen
✅ **Quotes escapen:** Doppelte Quotes durch Verdopplung escapen (`"` → `""`)
✅ **UTF-8 Encoding:** CSV muss UTF-8 encoded sein
✅ **Maximale Anzahl:** 200 Pins pro CSV-Upload
✅ **Board muss existieren:** ODER Pinterest erstellt es automatisch

### Beispiel CSV

```csv
"Media URL","Title","Description","Link","Pinterest board"
"https://example.com/image1.jpg","Konzert Zürich | März 2026","Ed Sheeran live im Hallenstadion Zürich...","https://eventbuzzer.ch/event/123","Konzerte & Musik Schweiz"
"https://example.com/image2.jpg","Festival Bern | Sommer 2026","Gurtenfestival 2026 - Die besten Acts...","https://eventbuzzer.ch/event/456","Festivals Schweiz"
```

### Upload-Prozess

1. **Pinterest.com öffnen** → Einloggen
2. **Settings** → **Import content**
3. **Upload .csv file** klicken
4. **CSV-Datei auswählen** (max 200 Pins)
5. **Pinterest prüft die Datei** (10-30 Sekunden)
6. **Bestätigung per E-Mail** nach erfolgreichem Upload
7. **Pins gehen live** oder werden nach Publish Date geplant

### Häufige Fehler

❌ **"Missing header column"** → Header-Namen sind falsch (muss EXAKT sein!)
❌ **"Missing Pinterest board"** → Spalte heißt `board` statt `Pinterest board`
❌ **CSV nicht erkannt** → Encoding ist nicht UTF-8
❌ **Bilder fehlen** → Media URL ist nicht öffentlich zugänglich
❌ **Falsche Quotes** → Werte sind nicht in Quotes oder falsch escaped

### Unser Script

Das Script `scripts/convert-pinterest-offline.mjs` generiert automatisch:
- ✅ Korrekte Header-Namen
- ✅ Alle Werte in Quotes
- ✅ UTF-8 Encoding
- ✅ Top 100 Events mit Bildern
- ✅ Automatisches Board-Mapping

**Verwendung:**
```bash
cd ~/Development/eventbuzzer-homepage
node scripts/convert-pinterest-offline.mjs
```

**Output:** `pinterest-100-pins.csv` bereit zum Upload!

---

**Erstellt:** 26. Januar 2026
**Aktualisiert:** 27. Januar 2026 (CSV-Format dokumentiert)
