/* ============================================================
   app.js – nachhilfeboerse.ch
   Laden, Filtern, Rendern (Kartenstil wie holidayjob.ch),
   Disclaimer-Gate, Filter-Popup, Formular
   ============================================================ */

(function () {
  "use strict";

  const DISCLAIMER_KEY = "nachhilfeboerse_disclaimer_ok";

  let alleEintraege = [];
  let aktiveFilter = { text: "", fach: "", stufe: "", format: "", bezahlung: "" };

  const rubriken = [
    { typ: "angebot", label: "🎓 Nachhilfe-Angebot", grid: "grid-angebot", count: "count-angebot",
      leer: "Noch keine Angebote, die zu deinen Filtern passen. Bist du in einem Fach stark? Erfasse das erste Inserat." },
    { typ: "gesuch", label: "🙋 Nachhilfe-Gesuch", grid: "grid-gesuch", count: "count-gesuch",
      leer: "Keine passenden Gesuche gefunden. Du suchst Nachhilfe? Trag dich ein – es dauert keine zwei Minuten." },
    { typ: "lerngruppe", label: "👥 Lerngruppe", grid: "grid-lerngruppe", count: "count-lerngruppe",
      leer: "Noch keine Lerngruppe passt zu deinen Filtern. Gründe deine eigene – ohne Login." }
  ];

  /* ---------- DOM-Helfer (textContent → XSS-sicher) ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function metaItem(label, value, extraClass) {
    const item = el("div", "job-meta-item");
    if (extraClass) item.classList.add(extraClass);
    item.appendChild(el("span", "job-meta-label", label));
    item.appendChild(el("span", "job-meta-value", value == null ? "" : String(value)));
    return item;
  }

  function formatDatum(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function istTausch(preis) {
    return /tausch/i.test(preis || "");
  }

  /* ---------- Karte bauen ---------- */

  function baueKarte(e, rubrik) {
    const card = el("div", "job-card public-job-card");

    const top = el("div", "job-card-top");
    const badges = el("div", "job-badges");
    if (e.fach) badges.appendChild(el("span", "job-category-badge", e.fach));
    if (e.stufe) badges.appendChild(el("span", "job-badge-soft", e.stufe));
    if (e.format) badges.appendChild(el("span", "job-badge-soft", e.format));
    if (e.typ !== "lerngruppe" && istTausch(e.preis)) badges.appendChild(el("span", "job-badge-soft", "🔄 Tausch"));
    top.appendChild(badges);
    top.appendChild(el("h3", "job-title", e.titel || "Ohne Titel"));
    top.appendChild(el("p", "job-company", rubrik.label));
    card.appendChild(top);

    const body = el("div", "job-card-body");
    const list = el("div", "job-meta-list");
    if (e.ort) list.appendChild(metaItem("Ort", e.ort, null));
    if (e.typ === "lerngruppe") {
      if (e.gruppengroesse) list.appendChild(metaItem("Gesucht", e.gruppengroesse + " Person(en)", "job-meta-highlight"));
      if (e.zeitraum) list.appendChild(metaItem("Zeitraum", e.zeitraum, null));
    } else if (e.preis) {
      list.appendChild(metaItem("Preis / Tausch", e.preis, "job-meta-highlight"));
    }
    body.appendChild(list);

    if (e.beschreibung) {
      const block = el("div", "job-description-block");
      block.appendChild(el("p", "job-description", e.beschreibung));
      body.appendChild(block);
    }
    card.appendChild(body);

    const footer = el("div", "job-card-footer");
    footer.appendChild(el("span", "job-contact-label", "Kontakt"));
    const val = el("div", "job-contact-value");
    val.appendChild(el("span", null, e.name || "Anonym"));
    if (e.email) {
      const a = el("a", null, "✉️ " + e.email);
      a.href = "mailto:" + e.email;
      val.appendChild(a);
    }
    if (e.telefon) {
      const a = el("a", null, "📞 " + e.telefon);
      a.href = "tel:" + String(e.telefon).replace(/\s+/g, "");
      val.appendChild(a);
    }
    footer.appendChild(val);
    if (e.erstellt) footer.appendChild(el("span", "job-card-date", "Inserat vom " + formatDatum(e.erstellt)));
    card.appendChild(footer);

    return card;
  }

  /* ---------- Filtern ---------- */

  function passt(e) {
    if (aktiveFilter.fach && e.fach !== aktiveFilter.fach) return false;
    if (aktiveFilter.stufe && e.stufe !== aktiveFilter.stufe) return false;
    if (aktiveFilter.format && e.format !== aktiveFilter.format) return false;
    if (aktiveFilter.bezahlung === "tausch" && !istTausch(e.preis)) return false;
    if (aktiveFilter.bezahlung === "geld" && istTausch(e.preis)) return false;
    if (aktiveFilter.text) {
      const raum = [e.titel, e.beschreibung, e.ort, e.name, e.fach].join(" ").toLowerCase();
      if (raum.indexOf(aktiveFilter.text) === -1) return false;
    }
    return true;
  }

  /* ---------- Rendern ---------- */

  function render() {
    const gefiltert = alleEintraege.filter(passt);

    rubriken.forEach(function (r) {
      const grid = document.getElementById(r.grid);
      const countEl = document.getElementById(r.count);
      if (!grid) return;
      const items = gefiltert
        .filter(function (e) { return e.typ === r.typ; })
        .sort(function (a, b) { return String(b.erstellt).localeCompare(String(a.erstellt)); });
      grid.innerHTML = "";
      if (items.length === 0) {
        grid.appendChild(el("p", "rubrik-empty", r.leer));
      } else {
        items.forEach(function (e) { grid.appendChild(baueKarte(e, r)); });
      }
      if (countEl) countEl.textContent = items.length;
    });

    const hint = document.getElementById("filter-hint");
    if (hint) {
      const total = alleEintraege.length;
      hint.textContent = gefiltert.length === total
        ? total + " Inserate insgesamt."
        : gefiltert.length + " von " + total + " Inseraten sichtbar.";
    }
  }

  /* ---------- Filter-Popup ---------- */

  function initFilter() {
    const toggle = document.getElementById("filter-toggle");
    const popup = document.getElementById("filter-popup");
    const close = document.getElementById("filter-popup-close");
    const felder = {
      text: document.getElementById("filter-text"),
      fach: document.getElementById("filter-fach"),
      stufe: document.getElementById("filter-stufe"),
      format: document.getElementById("filter-format"),
      bezahlung: document.getElementById("filter-bezahlung")
    };

    function lese() {
      aktiveFilter = {
        text: (felder.text.value || "").trim().toLowerCase(),
        fach: felder.fach.value,
        stufe: felder.stufe.value,
        format: felder.format.value,
        bezahlung: felder.bezahlung.value
      };
      render();
    }

    if (toggle && popup) {
      toggle.addEventListener("click", function (ev) {
        ev.stopPropagation();
        popup.classList.toggle("open");
      });
      if (close) close.addEventListener("click", function () { popup.classList.remove("open"); });
      document.addEventListener("click", function (ev) {
        if (popup.classList.contains("open") && !popup.contains(ev.target) && ev.target !== toggle) {
          popup.classList.remove("open");
        }
      });
    }
    Object.keys(felder).forEach(function (k) {
      if (felder[k]) { felder[k].addEventListener("input", lese); felder[k].addEventListener("change", lese); }
    });
    const apply = document.getElementById("apply-filters");
    const reset = document.getElementById("reset-filters");
    if (apply) apply.addEventListener("click", function () { lese(); if (popup) popup.classList.remove("open"); });
    if (reset) reset.addEventListener("click", function () {
      Object.keys(felder).forEach(function (k) { if (felder[k]) felder[k].value = ""; });
      lese();
    });
  }

  /* ---------- Formular ---------- */

  function initForm() {
    const toggle = document.getElementById("job-form-toggle");
    const wrapper = document.getElementById("job-form-wrapper");
    if (toggle && wrapper) {
      toggle.addEventListener("click", function () {
        toggle.classList.toggle("active");
        wrapper.classList.toggle("open");
      });
    }
    document.querySelectorAll("#header-post-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (toggle && wrapper && !wrapper.classList.contains("open")) {
          toggle.classList.add("active");
          wrapper.classList.add("open");
        }
      });
    });

    function typWechsel() {
      const gewaehlt = document.querySelector('input[name="typ"]:checked');
      const typ = gewaehlt ? gewaehlt.value : "angebot";
      document.querySelectorAll("#entry-form [data-show-for]").forEach(function (feld) {
        const sichtbar = feld.getAttribute("data-show-for").split(" ").indexOf(typ) !== -1;
        feld.style.display = sichtbar ? "" : "none";
        feld.disabled = !sichtbar;
      });
    }
    document.querySelectorAll('input[name="typ"]').forEach(function (r) {
      r.addEventListener("change", typWechsel);
    });
    typWechsel();

    const form = document.getElementById("entry-form");
    if (!form) return;

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const honeypot = document.getElementById("f-website");
      if (honeypot && honeypot.value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const gewaehlt = document.querySelector('input[name="typ"]:checked');
      const preisEl = document.getElementById("f-preis");
      const gruppeEl = document.getElementById("f-gruppe");
      const zeitraumEl = document.getElementById("f-zeitraum");
      const eintrag = {
        typ: gewaehlt ? gewaehlt.value : "angebot",
        titel: document.getElementById("f-titel").value.trim(),
        fach: document.getElementById("f-fach").value,
        stufe: document.getElementById("f-stufe").value,
        ort: document.getElementById("f-ort").value.trim(),
        format: document.getElementById("f-format").value,
        preis: preisEl.disabled ? "" : preisEl.value.trim(),
        gruppengroesse: gruppeEl.disabled ? "" : gruppeEl.value.trim(),
        zeitraum: zeitraumEl.disabled ? "" : zeitraumEl.value.trim(),
        beschreibung: document.getElementById("f-beschreibung").value.trim(),
        name: document.getElementById("f-name").value.trim(),
        email: document.getElementById("f-email").value.trim(),
        telefon: document.getElementById("f-telefon").value.trim(),
        erstellt: new Date().toISOString().slice(0, 10)
      };

      const btn = document.getElementById("submit-btn");
      btn.disabled = true;
      btn.textContent = "Wird gespeichert …";
      try {
        const antwort = await apiCreateEntry(eintrag);
        if (antwort && antwort.ok) {
          eintrag.id = "lokal-" + Date.now();
          alleEintraege.push(eintrag);
          render();
          form.reset();
          typWechsel();
          meldung(antwort.demo
            ? "Demo-Modus: Das Backend ist noch nicht verbunden (API_URL in api.js). Dein Inserat wird nur lokal angezeigt."
            : "Danke! Dein Inserat wurde gespeichert und erscheint jetzt als Karte in der passenden Rubrik.", "success");
        } else {
          meldung("Das hat leider nicht geklappt: " + (antwort && antwort.error ? antwort.error : "Unbekannter Fehler"), "error");
        }
      } catch (fehler) {
        meldung("Das Inserat konnte nicht gespeichert werden. Bitte später erneut versuchen. (" + fehler.message + ")", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Inserat veröffentlichen";
      }
    });
  }

  function meldung(text, art) {
    const box = document.getElementById("entry-message");
    if (!box) return;
    box.textContent = text;
    box.className = "message-box show " + (art === "success" ? "message-success" : "message-error");
  }

  /* ---------- Disclaimer-Gate ---------- */

  function initDisclaimer() {
    const gate = document.getElementById("disclaimer-gate");
    const btn = document.getElementById("accept-disclaimer-btn");
    if (!gate) return;
    let akzeptiert = false;
    try { akzeptiert = localStorage.getItem(DISCLAIMER_KEY) === "1"; } catch (e) {}
    if (!akzeptiert) {
      gate.classList.remove("hidden");
      document.body.classList.add("disclaimer-open");
    }
    if (btn) {
      btn.addEventListener("click", function () {
        try { localStorage.setItem(DISCLAIMER_KEY, "1"); } catch (e) {}
        gate.classList.add("hidden");
        document.body.classList.remove("disclaimer-open");
      });
    }
  }

  /* ---------- Start ---------- */

  async function init() {
    initDisclaimer();
    initFilter();
    initForm();

    try {
      alleEintraege = await apiFetchEntries();
    } catch (fehler) {
      console.error(fehler);
      alleEintraege = [];
      rubriken.forEach(function (r) {
        const grid = document.getElementById(r.grid);
        if (grid) { grid.innerHTML = ""; grid.appendChild(el("p", "rubrik-empty", "Die Inserate konnten nicht geladen werden. Bitte lade die Seite später neu.")); }
      });
      return;
    }
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
