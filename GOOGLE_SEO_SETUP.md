# Google Search Console - SEO Setup (Feb 9, 2026)

## ⚡ Quick Setup (2 Minuten)

### Step 1: Sitemap einreichen
```
1. Gehe zu: https://search.google.com/search-console
2. Wähle: eventbuzzer.ch Projekt
3. Links: "Sitemaps"
4. Klick: "Neue Sitemap hinzufügen"
5. Eingeben: https://eventbuzzer.ch/sitemap.xml
6. SUBMIT 🎉
```

**Das's es!** Google crawlt dann automatisch alle 129 URLs.

---

### Step 2: (Optional) Ein paar URLs zur Re-Crawl anmelden

Falls du's jetzt schneller haben willst:

```
1. GSC → "URL Inspection" (oben)
2. Eingeben (copy/paste):
   - https://eventbuzzer.ch/events/zurich/must-see
   - https://eventbuzzer.ch/events/geneva/natur
   - https://eventbuzzer.ch/events/basel/sport

3. Klick "Request indexing"
4. Google re-crawlt diese sofort
```

---

### Step 3: Monitoring (Wöchentlich checken)

```
GSC → "Coverage" Tab

Schaue auf:
- "Soft 404" Count (sollte sinken)
- "Valid with warnings" (neue URLs werden hier zuerst gezeigt)
- "Valid" (später verschieben sich URLs hierhin)
```

---

## 📊 Zeitplan

| Woche | Was passiert |
|-------|-----------|
| 1 | Google findet Sitemap, startet zu crawlen |
| 2-3 | Coverage zeigt neue URLs, Soft 404 Count sinkt |
| 4 | Meiste Soft 404s sollten weg sein |

---

## ⚠️ Wichtig: NICHT machen!

- ❌ Die bestehenden 340 Soft 404s einzeln überprüfen
- ❌ "Fix Submitted" Buttons drücken (nicht notwendig)
- ❌ Coverage-Fehler manuell fixen (Sitemap macht das für dich)
- ❌ Warten und testen - einfach abwarten lassen

---

## 🎯 Fertig!

Du hast:
✅ Sitemap Generator erstellt
✅ SEO-friendly Loading States hinzugefügt
✅ 129 URLs optimiert
✅ GitHub gepusht

Jetzt:
1️⃣ Sitemap einreichen (5 Minuten)
2️⃣ 2-4 Wochen abwarten
3️⃣ Soft 404s sollten verschwinden

Fragen? Schreib mich an! 🚀
