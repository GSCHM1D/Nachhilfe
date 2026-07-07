/* ============================================================
   api.js – Verbindung zum Google Apps Script Backend
   nachhilfeboerse.ch

   Das Backend ist eine Google Apps Script Web-App, welche die
   Inserate in einem Google Sheet speichert. Was genau im
   Apps Script stehen muss, ist in appscript.md beschrieben.

   1. Apps Script gemäss appscript.md erstellen und deployen
   2. Die Web-App-URL unten bei API_URL eintragen
   ============================================================ */

// TODO: Nach dem Deployment die URL der Apps Script Web-App eintragen,
// z. B. "https://script.google.com/macros/s/AKfycb.../exec"
const API_URL = "";

/**
 * Lädt alle freigegebenen Inserate vom Backend.
 * Erwartete Antwort: { ok: true, entries: [ { ... }, ... ] }
 * Solange API_URL leer ist, werden Demo-Inserate angezeigt.
 */
async function apiFetchEntries() {
  if (!API_URL) {
    console.warn("api.js: API_URL ist noch nicht gesetzt – es werden Demo-Inserate angezeigt.");
    return DEMO_EINTRAEGE;
  }
  const response = await fetch(API_URL + "?action=list");
  if (!response.ok) {
    throw new Error("Inserate konnten nicht geladen werden (HTTP " + response.status + ")");
  }
  const data = await response.json();
  if (!data.ok || !Array.isArray(data.entries)) {
    throw new Error("Unerwartete Antwort vom Backend");
  }
  return data.entries;
}

/**
 * Sendet ein neues Inserat an das Backend.
 * Wichtig: Content-Type "text/plain" verhindert den CORS-Preflight,
 * den Google Apps Script nicht beantworten kann.
 * Erwartete Antwort: { ok: true } oder { ok: false, error: "..." }
 */
async function apiCreateEntry(entry) {
  if (!API_URL) {
    console.warn("api.js: API_URL ist noch nicht gesetzt – das Inserat wird nur lokal angezeigt.");
    return { ok: true, demo: true };
  }
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "create", entry: entry })
  });
  if (!response.ok) {
    throw new Error("Inserat konnte nicht gespeichert werden (HTTP " + response.status + ")");
  }
  return response.json();
}

/* ------------------------------------------------------------
   Demo-Inserate: werden nur angezeigt, solange API_URL leer ist.
   Sobald das Backend angeschlossen ist, kommen die Karten aus
   dem Google Sheet.
   ------------------------------------------------------------ */
const DEMO_EINTRAEGE = [
  {
    id: "demo-1",
    typ: "angebot",
    titel: "Mathe-Nachhilfe fürs Gymi – geduldig und mit Beispielen",
    fach: "Mathematik",
    stufe: "Gymnasium / Kanti",
    ort: "Baden AG",
    format: "Vor Ort oder online",
    preis: "20 CHF/h",
    beschreibung: "Ich bin im letzten Kanti-Jahr (Schwerpunkt Physik & Mathe) und erkläre gerne – von Algebra bis Vektorgeometrie. Erste Lektion gratis zum Kennenlernen.",
    name: "Lena M.",
    email: "lena.demo@example.com",
    telefon: "079 000 00 01",
    erstellt: "2026-06-28"
  },
  {
    id: "demo-2",
    typ: "angebot",
    titel: "Französisch-Konversation – Tausch gegen Chemie",
    fach: "Französisch",
    stufe: "Sekundarschule / Bezirksschule",
    ort: "Online",
    format: "Online",
    preis: "Tausch: du erklärst mir Chemie",
    beschreibung: "Bilingue aufgewachsen (FR/DE). Ich helfe dir beim Sprechen und bei Aufsätzen – im Gegenzug brauche ich Unterstützung in Chemie fürs 10. Schuljahr.",
    name: "Noé B.",
    email: "noe.demo@example.com",
    telefon: "",
    erstellt: "2026-06-30"
  },
  {
    id: "demo-3",
    typ: "gesuch",
    titel: "Suche Englisch-Nachhilfe vor der Abschlussprüfung",
    fach: "Englisch",
    stufe: "Berufsschule / Lehre",
    ort: "Brugg AG",
    format: "Vor Ort",
    preis: "bis 25 CHF/h",
    beschreibung: "KV-Lernende im 3. Lehrjahr, LAP im Sommer. Ich brauche vor allem Hilfe bei Grammatik und beim Schreiben. Am liebsten 1× pro Woche.",
    name: "Aylin K.",
    email: "aylin.demo@example.com",
    telefon: "076 000 00 02",
    erstellt: "2026-07-01"
  },
  {
    id: "demo-4",
    typ: "lerngruppe",
    titel: "Lerngruppe für die Matheprüfung im Mai – 3 Leute gesucht",
    fach: "Mathematik",
    stufe: "Gymnasium / Kanti",
    ort: "Aarau AG",
    format: "Vor Ort",
    gruppengroesse: "3",
    zeitraum: "bis zur Prüfung im Mai, jeweils Mittwochnachmittag",
    beschreibung: "Wir treffen uns in der Mediathek und rechnen alte Prüfungen durch. Niveau: 3. Klasse Kanti. Motivation wichtiger als Vorwissen!",
    name: "Jonas T.",
    email: "jonas.demo@example.com",
    telefon: "",
    erstellt: "2026-07-03"
  },
  {
    id: "demo-5",
    typ: "lerngruppe",
    titel: "Vocabulaire-Duell: Franz-Wörtli gemeinsam büffeln",
    fach: "Französisch",
    stufe: "Sekundarschule / Bezirksschule",
    ort: "Online",
    format: "Online",
    gruppengroesse: "2",
    zeitraum: "laufend, 2× pro Woche am Abend",
    beschreibung: "Wir fragen uns gegenseitig Wörtli ab und machen kleine Wettbewerbe daraus. Discord oder Teams, was dir lieber ist.",
    name: "Mira S.",
    email: "mira.demo@example.com",
    telefon: "",
    erstellt: "2026-07-05"
  }
];
