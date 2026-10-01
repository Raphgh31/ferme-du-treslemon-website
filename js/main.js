/* Ferme de Treslemont — navigation horizontale entre les pages */
(function () {
  "use strict";

  var track = document.getElementById("track");
  var viewport = document.getElementById("viewport");
  var pages = Array.prototype.slice.call(track.querySelectorAll(".page"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs a[data-goto]"));
  var ink = document.querySelector(".tab-ink");
  var prevBtn = document.querySelector(".pager-prev");
  var nextBtn = document.querySelector(".pager-next");
  var prevLabel = document.getElementById("prev-label");
  var nextLabel = document.getElementById("next-label");
  var curEl = document.getElementById("cur");
  var bar = document.getElementById("bar");

  var names = tabs.map(function (t) { return t.lastChild.textContent.trim(); });
  var ids = pages.map(function (p) { return p.id; });
  var current = -1;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function moveInk() {
    var tab = tabs[current];
    if (!ink || !tab) return;
    var navBox = tab.closest(".tabs").getBoundingClientRect();
    var box = tab.getBoundingClientRect();
    ink.style.width = box.width + "px";
    ink.style.transform = "translateX(" + (box.left - navBox.left) + "px)";
  }

  function go(index, opts) {
    opts = opts || {};
    index = Math.max(0, Math.min(pages.length - 1, index));
    if (index === current && !opts.force) return;
    current = index;

    track.style.transform = "translate3d(" + (-100 * index) + "%,0,0)";

    pages.forEach(function (p, i) {
      var active = i === index;
      p.classList.toggle("is-active", active);
      p.setAttribute("aria-hidden", active ? "false" : "true");
      if (active) p.removeAttribute("inert"); else p.setAttribute("inert", "");
    });
    pages[index].scrollTop = 0;

    tabs.forEach(function (t, i) {
      t.setAttribute("aria-selected", i === index ? "true" : "false");
      t.setAttribute("tabindex", i === index ? "0" : "-1");
    });
    if (tabs[index].scrollIntoView && window.matchMedia("(max-width: 900px)").matches) {
      tabs[index].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    moveInk();

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === pages.length - 1;
    prevLabel.textContent = index > 0 ? names[index - 1] : "";
    nextLabel.textContent = index < pages.length - 1 ? names[index + 1] : "";
    curEl.textContent = pad(index + 1);
    bar.style.transform = "scaleX(" + (index + 1) / pages.length + ")";

    document.title = (index === 0 ? "" : names[index] + " — ") + "Ferme de Treslemont" +
      (index === 0 ? " — Produits laitiers fermiers à Yssingeaux" : "");

    if (!opts.fromHash) {
      var hash = "#" + ids[index];
      if (location.hash !== hash) history.pushState(null, "", hash);
    }
  }

  function indexFromHash() {
    var i = ids.indexOf(location.hash.replace("#", ""));
    return i < 0 ? 0 : i;
  }

  /* Liens internes */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-goto]");
    if (!a) return;
    e.preventDefault();
    go(parseInt(a.getAttribute("data-goto"), 10));
  });

  prevBtn.addEventListener("click", function () { go(current - 1); });
  nextBtn.addEventListener("click", function () { go(current + 1); });

  window.addEventListener("popstate", function () { go(indexFromHash(), { fromHash: true }); });
  window.addEventListener("hashchange", function () { go(indexFromHash(), { fromHash: true }); });

  /* Clavier : flèches gauche / droite (hors champs de saisie) */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (e.key === "ArrowRight") { go(current + 1); }
    else if (e.key === "ArrowLeft") { go(current - 1); }
    else if (e.key === "Home" && e.target.closest(".tabs")) { go(0); }
    else if (e.key === "End" && e.target.closest(".tabs")) { go(pages.length - 1); }
    else return;
    if (e.target.closest(".tabs")) tabs[current].focus();
  });

  /* Glisser au doigt (et trackpad horizontal) */
  var startX = 0, startY = 0, dx = 0, dragging = false, locked = null;

  viewport.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dx = 0; locked = null; dragging = true;
  }, { passive: true });

  viewport.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    var x = e.touches[0].clientX - startX;
    var y = e.touches[0].clientY - startY;
    if (locked === null && (Math.abs(x) > 8 || Math.abs(y) > 8)) {
      locked = Math.abs(x) > Math.abs(y) ? "x" : "y";
      if (locked === "x") track.classList.add("is-dragging");
    }
    if (locked !== "x") return;
    dx = x;
    var edge = (current === 0 && dx > 0) || (current === pages.length - 1 && dx < 0);
    var offset = edge ? dx * 0.3 : dx;
    track.style.transform = "translate3d(calc(" + (-100 * current) + "% + " + offset + "px),0,0)";
  }, { passive: true });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    if (locked === "x" && Math.abs(dx) > Math.min(90, viewport.clientWidth * 0.18)) {
      go(current + (dx < 0 ? 1 : -1));
    } else {
      go(current, { force: true, fromHash: true });
    }
  }
  viewport.addEventListener("touchend", endDrag);
  viewport.addEventListener("touchcancel", endDrag);

  var wheelLock = false;
  viewport.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaX) < 40 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.5 || wheelLock) return;
    wheelLock = true;
    go(current + (e.deltaX > 0 ? 1 : -1));
    setTimeout(function () { wheelLock = false; }, 900);
  }, { passive: true });

  window.addEventListener("resize", moveInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

  /* Formulaire de contact : ouvre la messagerie avec le message pré-rempli */
  var form = document.getElementById("contact-form");
  var note = document.getElementById("form-note");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    ["nom", "message"].forEach(function (n) {
      var f = form.elements[n];
      var bad = !f.value.trim();
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = "Merci d’indiquer votre nom et votre message."; return; }
    var subject = "[Site] " + form.elements.objet.value + " — " + form.elements.nom.value.trim();
    var body = form.elements.message.value.trim() + "\n\n" + form.elements.nom.value.trim() +
      (form.elements.tel.value.trim() ? "\nTél. : " + form.elements.tel.value.trim() : "");
    location.href = "mailto:ferme-de-treslemont@orange.fr?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    note.textContent = "Votre messagerie s’ouvre… Vous pouvez aussi nous appeler au 06 08 43 77 87.";
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  go(indexFromHash(), { fromHash: true, force: true });
})();
