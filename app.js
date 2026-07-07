/* ============================================================
   app.js – Logik der Seite (Laden, Filtern, Rendern, Formular)
   nachhilfeboerse.ch
   ============================================================ */

(function () {
  "use strict";

  let alleEintraege = [];

  const grids = {
    angebot: document.getElementById("gridAngebote"),
    gesuch: document.getElementById("gridGesuche"),
    lerngruppe: document.getElementById("gridLerngruppen")
  };

  const counts = {
    angebot: document.getElementById("countAngebote"),
    gesuch: document.getElementById("countGesuche"),
    lerngruppe: document.getElementById("countLerngruppen")
  };

  const stats = {
    angebot: document.getElementById("statAngebote"),
    gesuch: document.getElementById("statGesuche"),
    lerngruppe: document.getElementById("statLerngruppen")
  };

  const typLabels = {
    angebot: "Angebot",
    gesuch: "Gesuch",
    lerngruppe: "Lerngruppe"
  };

  const leereRubrik = {
    angebot: "Noch keine Angebote, die zu deinen Filtern passen. Bist du in einem Fach stark? Erfasse das erste Inserat!",
    gesuch: "Keine passenden Gesuche gefunden. Du suchst Nachhilfe? Trag dich ein – es dauert keine zwei Minuten.",
    lerngruppe: "Noch keine Lerngruppe passt zu deinen Filtern. Gründe deine eigene – ohne Login."
  };

  /* ---------- Hilfsfunktionen ---------- */

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDatum(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return escapeHtml(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function istTausch(preis) {
    return /tausch/i.test(preis || "");
  }

  /* ---------- Rendern ---------- */

  function karteHtml(e) {
    const badges = [
      '<span class="badge">' + escapeHtml(e.fach || "Fach offen") + "</span>",
      '<span class="badge badge-alt">' + escapeHtml(e.stufe || "Stufe offen") + "</span>"
    ];
    if (e.format) badges.push('<span class="badge badge-neutral">' + escapeHtml(e.format) + "</span>");
    if (e.typ !== "lerngruppe" && istTausch(e.preis)) {
      badges.push('<span class="badge badge-neutral">🔄 Tausch</span>');
    }

    const meta = [];
    if (e.ort) meta.push("<li><strong>Ort:</strong> " + escapeHtml(e.ort) + "</li>");
    if (e.typ === "lerngruppe") {
      if (e.gruppengroesse) meta.push("<li><strong>Gesucht:</strong> " + escapeHtml(e.gruppengroesse) + " Person(en)</li>");
      if (e.zeitraum) meta.push("<li><strong>Zeitraum:</strong> " + escapeHtml(e.zeitraum) + "</li>");
    } else if (e.preis) {
      meta.push("<li><strong>Preis / Tausch:</strong> " + escapeHtml(e.preis) + "</li>");
    }

    const kontakt = [];
    if (e.email) {
      kontakt.push('<a href="mailto:' + escapeHtml(e.email) + '">✉️ ' + escapeHtml(e.email) + "</a>");
    }
    if (e.telefon) {
      kontakt.push('<a href="tel:' + escapeHtml(String(e.telefon).replace(/\s+/g, "")) + '">📞 ' + escapeHtml(e.telefon) + "</a>");
    }

    return (
      '<article class="entry-card">' +
      '<div class="entry-badges">' + badges.join("") + "</div>" +
      "<h3>" + escapeHtml(e.titel || "Ohne Titel") + "</h3>" +
      '<p class="entry-desc">' + escapeHtml(e.beschreibung || "") + "</p>" +
      '<ul class="entry-meta">' + meta.join("") + "</ul>" +
      '<div class="entry-contact">' +
      '<div class="contact-name">' + escapeHtml(e.name || "Anonym") + "</div>" +
      kontakt.join("<br>") +
      "</div>" +
      '<div class="entry-date">Inserat vom ' + formatDatum(e.erstellt) + "</div>" +
      "</article>"
    );
  }

  function renderAlle() {
    const gefiltert = filternAnwenden(alleEintraege);

    Object.keys(grids).forEach(function (typ) {
      const grid = grids[typ];
      if (!grid) return;
      const eintraege = gefiltert.filter(function (e) { return e.typ === typ; });
      if (eintraege.length === 0) {
        grid.innerHTML = '<div class="empty-state">' + leereRubrik[typ] + "</div>";
      } else {
        grid.innerHTML = eintraege
          .slice()
          .sort(function (a, b) { return String(b.erstellt).localeCompare(String(a.erstellt)); })
          .map(karteHtml)
          .join("");
      }
      if (counts[typ]) counts[typ].textContent = eintraege.length;
    });

    Object.keys(stats).forEach(function (typ) {
      if (stats[typ]) {
        stats[typ].textContent = alleEintraege.filter(function (e) { return e.typ === typ; }).length;
      }
    });

    const hint = document.getElementById("filterHint");
    if (hint) {
      hint.textContent = gefiltert.length + " von " + alleEintraege.length + " Inseraten sichtbar.";
    }
  }

  /* ---------- Filter ---------- */

  const filterFelder = {
    text: document.getElementById("filterText"),
    fach: document.getElementById("filterFach"),
    stufe: document.getElementById("filterStufe"),
    format: document.getElementById("filterFormat"),
    bezahlung: document.getElementById("filterBezahlung")
  };

  function filternAnwenden(eintraege) {
    const text = (filterFelder.text && filterFelder.text.value || "").trim().toLowerCase();
    const fach = filterFelder.fach && filterFelder.fach.value || "";
    const stufe = filterFelder.stufe && filterFelder.stufe.value || "";
    const format = filterFelder.format && filterFelder.format.value || "";
    const bezahlung = filterFelder.bezahlung && filterFelder.bezahlung.value || "";

    return eintraege.filter(function (e) {
      if (fach && e.fach !== fach) return false;
      if (stufe && e.stufe !== stufe) return false;
      if (format && e.format !== format) return false;
      if (bezahlung === "tausch" && !istTausch(e.preis)) return false;
      if (bezahlung === "geld" && istTausch(e.preis)) return false;
      if (text) {
        const suchraum = [e.titel, e.beschreibung, e.ort, e.name, e.fach]
          .join(" ")
          .toLowerCase();
        if (suchraum.indexOf(text) === -1) return false;
      }
      return true;
    });
  }

  function filterBinden() {
    Object.keys(filterFelder).forEach(function (key) {
      const feld = filterFelder[key];
      if (!feld) return;
      feld.addEventListener("input", renderAlle);
      feld.addEventListener("change", renderAlle);
    });
    const reset = document.getElementById("filterReset");
    if (reset) {
      reset.addEventListener("click", function () {
        Object.keys(filterFelder).forEach(function (key) {
          if (filterFelder[key]) filterFelder[key].value = "";
        });
        renderAlle();
      });
    }
  }

  /* ---------- Formular ---------- */

  function formularTypWechsel() {
    const gewaehlt = document.querySelector('input[name="typ"]:checked');
    const typ = gewaehlt ? gewaehlt.value : "angebot";
    document.querySelectorAll("[data-show-for]").forEach(function (feld) {
      const fuer = feld.getAttribute("data-show-for").split(" ");
      const sichtbar = fuer.indexOf(typ) !== -1;
      feld.style.display = sichtbar ? "" : "none";
      feld.querySelectorAll("input, select, textarea").forEach(function (input) {
        input.disabled = !sichtbar;
      });
    });
  }

  function meldung(text, art) {
    const box = document.getElementById("formMessage");
    if (!box) return;
    box.textContent = text;
    box.className = "form-message " + art;
  }

  function formularBinden() {
    const form = document.getElementById("entryForm");
    if (!form) return;

    document.querySelectorAll('input[name="typ"]').forEach(function (radio) {
      radio.addEventListener("change", formularTypWechsel);
    });
    formularTypWechsel();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Honeypot: Wenn das unsichtbare Feld gefüllt ist, war es ein Bot.
      const honeypot = document.getElementById("fWebsite");
      if (honeypot && honeypot.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const gewaehlt = document.querySelector('input[name="typ"]:checked');
      const eintrag = {
        typ: gewaehlt ? gewaehlt.value : "angebot",
        titel: document.getElementById("fTitel").value.trim(),
        fach: document.getElementById("fFach").value,
        stufe: document.getElementById("fStufe").value,
        ort: document.getElementById("fOrt").value.trim(),
        format: document.getElementById("fFormat").value,
        preis: document.getElementById("fPreis").disabled ? "" : document.getElementById("fPreis").value.trim(),
        gruppengroesse: document.getElementById("fGruppe").disabled ? "" : document.getElementById("fGruppe").value.trim(),
        zeitraum: document.getElementById("fZeitraum").disabled ? "" : document.getElementById("fZeitraum").value.trim(),
        beschreibung: document.getElementById("fBeschreibung").value.trim(),
        name: document.getElementById("fName").value.trim(),
        email: document.getElementById("fEmail").value.trim(),
        telefon: document.getElementById("fTelefon").value.trim(),
        erstellt: new Date().toISOString().slice(0, 10)
      };

      const submitBtn = document.getElementById("submitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gespeichert …";

      try {
        const antwort = await apiCreateEntry(eintrag);
        if (antwort && antwort.ok) {
          eintrag.id = "lokal-" + Date.now();
          alleEintraege.push(eintrag);
          renderAlle();
          form.reset();
          formularTypWechsel();
          meldung(
            antwort.demo
              ? "Demo-Modus: Das Backend ist noch nicht verbunden (API_URL in api.js). Dein Inserat wird nur lokal angezeigt."
              : "Danke! Dein Inserat wurde gespeichert und erscheint jetzt als Karte in der passenden Rubrik.",
            "success"
          );
        } else {
          meldung("Das hat leider nicht geklappt: " + (antwort && antwort.error ? antwort.error : "Unbekannter Fehler"), "error");
        }
      } catch (fehler) {
        meldung("Das Inserat konnte nicht gespeichert werden. Bitte versuche es später nochmals. (" + fehler.message + ")", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Inserat veröffentlichen";
      }
    });
  }

  /* ---------- Navigation (Mobile) ---------- */

  function navBinden() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  /* ---------- Start ---------- */

  async function init() {
    navBinden();
    filterBinden();
    formularBinden();

    Object.keys(grids).forEach(function (typ) {
      if (grids[typ]) grids[typ].innerHTML = '<div class="empty-state">Inserate werden geladen …</div>';
    });

    try {
      alleEintraege = await apiFetchEntries();
    } catch (fehler) {
      console.error(fehler);
      alleEintraege = [];
      Object.keys(grids).forEach(function (typ) {
        if (grids[typ]) {
          grids[typ].innerHTML = '<div class="empty-state">Die Inserate konnten nicht geladen werden. Bitte lade die Seite später neu.</div>';
        }
      });
      return;
    }
    renderAlle();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
