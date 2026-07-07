# nachhilfeboerse.ch

Die kostenlose **Nachhilfe- und Lernpartner-Börse** für Jugendliche in der
Schweiz – von Schülern für Schüler. Eine Schwesterplattform von
[holidayjob.ch](https://www.holidayjob.ch).

## Was die Plattform kann

- **Nachhilfe anbieten** – gegen Taschengeld oder im Tausch («Ich erkläre dir Chemie, du mir Französisch»)
- **Nachhilfe suchen** – nach Fach, Schulstufe, Ort, Format und Preis/Tausch filtern
- **Lerngruppen finden/gründen** – z. B. «Lerngruppe für die Matheprüfung im Mai, 3 Leute gesucht»
- **Ohne Login:** Jede*r kann ein Inserat erfassen; es erscheint als Karte in der
  passenden Rubrik, inklusive Kontaktangaben für die direkte Kontaktaufnahme.

## Aufbau

| Datei                      | Zweck                                                        |
| -------------------------- | ------------------------------------------------------------ |
| `index.html`               | Startseite: Page-Header, So funktioniert's, Suche/Filter, drei Rubriken (Angebote, Gesuche, Lerngruppen), Formular, Disclaimer-Gate |
| `about.html`               | Über uns                                                     |
| `impressum.html`           | Impressum (Platzhalter ausfüllen)                            |
| `agb.html`                 | Allgemeine Geschäftsbedingungen                              |
| `nutzungsbedingungen.html` | Nutzungsbedingungen                                          |
| `datenschutz.html`         | Datenschutzerklärung                                         |
| `styles.css`               | Design (Struktur wie holidayjob.ch, Akzentfarbe Grün)        |
| `legal.css`                | Design der Rechtstexte (Impressum, AGB, Datenschutz, Über uns) |
| `app.js`                   | Laden, Filtern, Rendern der Karten, Formular-Logik           |
| `api.js`                   | Verbindung zum Google Apps Script Backend                    |
| `appscript.md`             | **Anleitung & Code fürs Backend** (Google Apps Script + Google Sheets) |
| `assets/`                  | Platzhalter für Logo und Favicon                             |

## Backend anschliessen

1. `appscript.md` folgen: Google Sheet anlegen, Apps Script einfügen, als Web-App deployen.
2. Die Web-App-URL in `api.js` bei `API_URL` eintragen.
3. Solange `API_URL` leer ist, zeigt die Seite Demo-Inserate an (Demo-Modus).

## Lokal testen

Einfach `index.html` im Browser öffnen – die Seite ist rein statisch.

## Vor dem Livegang

- Platzhalter in `impressum.html`, `about.html` und den Rechtsseiten ausfüllen
  (gelb markiert: `[so aussehende Stellen]`).
- Eigenes Logo/Favicon in `assets/` ersetzen.
