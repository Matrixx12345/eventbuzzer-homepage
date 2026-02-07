# 🔍 Google Analytics 4 Setup - Step by Step

**Warum wichtig:** Affiliate-Programme brauchen Traffic-Nachweis!

---

## SCHRITT 1: Google Analytics Account erstellen (10 Min)

1. **Gehe zu:** https://analytics.google.com/
2. **Einloggen** mit deinem Google-Account
3. **Klick auf "Start measuring"** oder "Messung starten"

---

## SCHRITT 2: Property erstellen (5 Min)

1. **Account Name:** "EventBuzzer"
2. **Property Name:** "EventBuzzer.ch"
3. **Zeitzone:** "Switzerland"
4. **Währung:** "CHF - Swiss Franc"
5. **Klick "Next"**

---

## SCHRITT 3: Branche & Größe (2 Min)

1. **Branche:** "Arts & Entertainment" oder "Travel"
2. **Unternehmensgröße:** "Small" (1-10 Mitarbeiter)
3. **Wie möchtest du Analytics nutzen?**
   - ✅ "Examine user behavior"
   - ✅ "Measure advertising ROI"
4. **Klick "Create"**
5. **Akzeptiere die Terms of Service**

---

## SCHRITT 4: Data Stream erstellen (3 Min)

1. **Plattform wählen:** "Web"
2. **Website URL:** `https://eventbuzzer.ch`
3. **Stream Name:** "EventBuzzer Website"
4. **Klick "Create stream"**

---

## SCHRITT 5: Tracking Code kopieren (5 Min)

Nach dem Erstellen siehst du:

```
Google tag (gtag.js)
Measurement ID: G-XXXXXXXXXX
```

**Kopiere diesen Code:**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## SCHRITT 6: Code in Website einfügen (10 Min)

**Datei öffnen:** `/src/pages/Index.tsx`

**Im Helmet-Bereich (nach dem Google Verification Tag):**

```tsx
<Helmet>
  <title>EventBuzzer - Entdecke Events in der Schweiz</title>
  <meta name="google-site-verification" content="Gy-ddUrDm4Bp3Hqs6ayDcsh-1U_PXP7ZPTBewWdSSBE" />

  {/* Google Analytics 4 */}
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    `}
  </script>

  {/* Rest vom Code... */}
</Helmet>
```

**WICHTIG:** Ersetze `G-XXXXXXXXXX` mit deiner echten Measurement ID!

---

## SCHRITT 7: Deployen (2 Min)

```bash
cd /Users/jj/Development/eventbuzzer-homepage
git add .
git commit -m "Add Google Analytics 4 tracking"
git push
```

→ Vercel deployt automatisch

---

## SCHRITT 8: Testen (5 Min)

1. **Warte 2-3 Min** bis Deployment fertig
2. **Öffne:** https://eventbuzzer.ch
3. **Gehe zurück zu Google Analytics**
4. **Klick auf "Home" oder "Reports"**
5. **Unter "Realtime"** solltest du dich selbst sehen! (1 User online)

**Falls nicht:**
- Warte 10-15 Min
- Cache leeren und Seite neu laden
- AdBlocker deaktivieren

---

## ✅ FERTIG!

Ab jetzt trackt Google Analytics:
- Anzahl Besucher
- Seitenaufrufe
- Traffic-Quellen (Google, Direct, Social)
- Beliebteste Events
- Verweildauer

**Für Affiliate-Anmeldungen (in 4 Wochen):**
1. Gehe zu Google Analytics
2. Reports > Traffic Acquisition
3. Screenshot machen
4. Bei Viator hochladen

---

## 📊 WAS DU TRACKEN SOLLTEST

**Täglich/Wöchentlich checken:**
- **Users:** Wie viele unique Besucher?
- **Sessions:** Wie viele Besuche?
- **Views:** Wie viele Seitenaufrufe?

**Ziel für Viator-Anmeldung (in 4 Wochen):**
- 2000+ Users/Monat
- 5000+ Seitenaufrufe/Monat

**Realistisch mit Pinterest + Google:**
- Nach 2 Wochen: 500 Users
- Nach 4 Wochen: 2000 Users
- Nach 8 Wochen: 5000 Users
