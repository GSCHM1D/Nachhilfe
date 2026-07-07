# Backend: Google Apps Script für nachhilfeboerse.ch

Dieses Dokument beschreibt, was in das Google Apps Script Backend gehört.
Das Frontend (`api.js`) spricht mit einer Apps Script **Web-App**, welche die
Inserate in einem **Google Sheet** speichert und ausliefert.

---

## 1. Google Sheet vorbereiten

1. Neues Google Sheet erstellen, z. B. mit dem Namen `nachhilfeboerse-inserate`.
2. Das erste Tabellenblatt in **`Inserate`** umbenennen.
3. In Zeile 1 exakt diese Spaltenüberschriften eintragen (Reihenfolge wichtig):

| Spalte | Überschrift      | Inhalt                                                                 |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| A      | `id`             | Eindeutige ID (vom Script generiert, z. B. `Utilities.getUuid()`)      |
| B      | `erstellt`       | Datum der Erfassung, Format `YYYY-MM-DD`                                |
| C      | `typ`            | `angebot`, `gesuch` oder `lerngruppe`                                   |
| D      | `titel`          | Titel des Inserats                                                      |
| E      | `fach`           | Fach (z. B. Mathematik, Französisch …)                                  |
| F      | `stufe`          | Schulstufe (Primarschule, Gymnasium / Kanti …)                          |
| G      | `ort`            | Ort / Region                                                            |
| H      | `format`         | `Vor Ort`, `Online` oder `Vor Ort oder online`                          |
| I      | `preis`          | Preis oder Tauschangebot (nur Angebot/Gesuch)                           |
| J      | `gruppengroesse` | Anzahl gesuchte Personen (nur Lerngruppe)                               |
| K      | `zeitraum`       | Zeitraum/Termin (nur Lerngruppe)                                        |
| L      | `beschreibung`   | Beschreibungstext                                                       |
| M      | `name`           | Name der inserierenden Person                                           |
| N      | `email`          | Kontakt-E-Mail (öffentlich)                                             |
| O      | `telefon`        | Telefonnummer (optional, öffentlich)                                    |
| P      | `status`         | `neu`, `freigegeben` oder `gesperrt` – nur `freigegeben` wird angezeigt |

> **Moderation:** Neue Inserate landen mit Status `neu` im Sheet. Ihr prüft sie
> kurz und setzt den Status von Hand auf `freigegeben` – erst dann erscheinen
> sie auf der Website. Wer ohne Prüfung publizieren will, lässt das Script neue
> Einträge direkt mit `freigegeben` speichern (siehe Kommentar im Code).

---

## 2. Apps Script erstellen

Im Sheet: **Erweiterungen → Apps Script**. Den Inhalt von `Code.gs` durch
folgenden Code ersetzen:

```javascript
/**
 * Backend für nachhilfeboerse.ch
 * Speichert Inserate in Google Sheets und liefert sie als JSON aus.
 */

const SHEET_NAME = "Inserate";

// Spalten in der Reihenfolge des Sheets (A–P)
const COLUMNS = [
  "id", "erstellt", "typ", "titel", "fach", "stufe", "ort", "format",
  "preis", "gruppengroesse", "zeitraum", "beschreibung",
  "name", "email", "telefon", "status"
];

// Nur diese Werte akzeptiert das Backend als Inserat-Typ
const ALLOWED_TYPES = ["angebot", "gesuch", "lerngruppe"];

// Maximale Feldlängen als einfacher Spam-/Fehlerschutz
const MAX_LENGTHS = { titel: 90, beschreibung: 600 };

/**
 * GET  →  Liste aller freigegebenen Inserate
 * Aufruf durch das Frontend: {WEB_APP_URL}?action=list
 */
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const entries = [];

  for (let i = 1; i < rows.length; i++) { // Zeile 0 = Überschriften
    const row = rows[i];
    const entry = {};
    COLUMNS.forEach(function (col, idx) {
      entry[col] = row[idx] instanceof Date
        ? Utilities.formatDate(row[idx], "Europe/Zurich", "yyyy-MM-dd")
        : String(row[idx] == null ? "" : row[idx]);
    });
    if (entry.status === "freigegeben") {
      delete entry.status; // interner Wert, gehört nicht ins Frontend
      entries.push(entry);
    }
  }

  return jsonResponse({ ok: true, entries: entries });
}

/**
 * POST  →  Neues Inserat speichern
 * Das Frontend sendet: { "action": "create", "entry": { ... } }
 * Content-Type ist text/plain (CORS-Workaround), daher e.postData.contents.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== "create" || !body.entry) {
      return jsonResponse({ ok: false, error: "Ungültige Anfrage" });
    }

    const entry = body.entry;

    // Honeypot: Das Frontend sendet dieses Feld nie – Bots schon.
    if (entry.website) {
      return jsonResponse({ ok: true }); // Bot glauben lassen, es habe geklappt
    }

    // Pflichtfelder prüfen
    if (ALLOWED_TYPES.indexOf(entry.typ) === -1) {
      return jsonResponse({ ok: false, error: "Ungültiger Inserat-Typ" });
    }
    const required = ["titel", "fach", "stufe", "ort", "format", "beschreibung", "name", "email"];
    for (let i = 0; i < required.length; i++) {
      if (!String(entry[required[i]] || "").trim()) {
        return jsonResponse({ ok: false, error: "Pflichtfeld fehlt: " + required[i] });
      }
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(entry.email))) {
      return jsonResponse({ ok: false, error: "Ungültige E-Mail-Adresse" });
    }

    // Feldlängen begrenzen
    Object.keys(MAX_LENGTHS).forEach(function (field) {
      entry[field] = String(entry[field] || "").slice(0, MAX_LENGTHS[field]);
    });

    // Zeile aufbauen und anhängen
    const row = COLUMNS.map(function (col) {
      switch (col) {
        case "id": return Utilities.getUuid();
        case "erstellt": return Utilities.formatDate(new Date(), "Europe/Zurich", "yyyy-MM-dd");
        case "status": return "neu"; // auf "freigegeben" ändern, wenn ohne manuelle Prüfung publiziert werden soll
        default: return String(entry[col] == null ? "" : entry[col]).trim();
      }
    });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow(row);

    // Optional: Mail-Benachrichtigung an euch bei jedem neuen Inserat
    // MailApp.sendEmail("kontakt@nachhilfeboerse.ch",
    //   "Neues Inserat auf nachhilfeboerse.ch",
    //   entry.typ + ": " + entry.titel + "\nVon: " + entry.name + " (" + entry.email + ")");

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Server-Fehler: " + err.message });
  }
}

/** JSON-Antwort erzeugen */
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Als Web-App deployen

1. Rechts oben **Bereitstellen → Neue Bereitstellung**.
2. Typ: **Web-App**.
3. Einstellungen:
   - **Beschreibung:** z. B. `nachhilfeboerse-api v1`
   - **Ausführen als:** *Ich* (euer Google-Konto)
   - **Zugriff:** **Jeder** (nötig, damit die Website ohne Login lesen/schreiben kann)
4. **Bereitstellen** klicken und die **Web-App-URL** kopieren
   (Form: `https://script.google.com/macros/s/…/exec`).
5. Die URL im Frontend in **`api.js`** bei `API_URL` eintragen.

> **Wichtig bei Updates:** Nach jeder Code-Änderung eine **neue Bereitstellung**
> erstellen (oder die bestehende über *Bereitstellung verwalten* aktualisieren),
> sonst läuft weiterhin die alte Version.

---

## 4. Schnittstelle (Vertrag zwischen Frontend und Backend)

### GET `{API_URL}?action=list`

Antwort:

```json
{
  "ok": true,
  "entries": [
    {
      "id": "…",
      "erstellt": "2026-07-05",
      "typ": "angebot",
      "titel": "Mathe-Nachhilfe fürs Gymi",
      "fach": "Mathematik",
      "stufe": "Gymnasium / Kanti",
      "ort": "Baden AG",
      "format": "Vor Ort oder online",
      "preis": "20 CHF/h",
      "gruppengroesse": "",
      "zeitraum": "",
      "beschreibung": "…",
      "name": "Lena M.",
      "email": "lena@example.com",
      "telefon": "079 123 45 67"
    }
  ]
}
```

### POST `{API_URL}` mit Body:

```json
{ "action": "create", "entry": { "typ": "angebot", "titel": "…", "fach": "…", "stufe": "…", "ort": "…", "format": "…", "preis": "…", "gruppengroesse": "", "zeitraum": "", "beschreibung": "…", "name": "…", "email": "…", "telefon": "…" } }
```

Antwort: `{ "ok": true }` oder `{ "ok": false, "error": "…" }`

**CORS-Hinweis:** Das Frontend sendet den POST bewusst mit
`Content-Type: text/plain;charset=utf-8`. So entsteht kein CORS-Preflight
(OPTIONS-Request), den Apps Script nicht beantworten kann. Im Script kommt der
Body trotzdem normal über `e.postData.contents` an.

---

## 5. Betrieb & Moderation

- **Freigeben:** Neue Zeilen haben Status `neu`. Status-Zelle auf `freigegeben`
  setzen → Inserat erscheint beim nächsten Laden der Website.
- **Sperren/Löschen:** Status auf `gesperrt` setzen oder die Zeile löschen.
- **Löschanfragen:** Nutzer dürfen die Löschung per E-Mail verlangen
  (siehe Nutzungsbedingungen) – Zeile im Sheet entfernen, fertig.
- **Backup:** Google Sheets versioniert automatisch
  (Datei → Versionsverlauf).
