/* Brasserie L'Estrouchat — navigation horizontale entre les pages */
(function () {
  "use strict";

  var viewport = document.getElementById("viewport");
  var track = document.getElementById("track");
  var pages = Array.prototype.slice.call(track.querySelectorAll(".page"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs a"));
  var prevBtn = document.querySelector(".pager-prev");
  var nextBtn = document.querySelector(".pager-next");
  var prevLabel = document.getElementById("prev-label");
  var nextLabel = document.getElementById("next-label");
  var segments = document.getElementById("segments");

  var names = tabs.map(function (t) { return t.textContent.trim(); });
  var ids = pages.map(function (p) { return p.id; });
  var current = -1;

  names.forEach(function (name, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.title = name;
    b.addEventListener("click", function () { go(i); });
    segments.appendChild(b);
  });
  var segs = Array.prototype.slice.call(segments.children);

  function go(index, fromHash) {
    index = Math.max(0, Math.min(pages.length - 1, index));
    if (index === current) return;
    current = index;

    track.style.transform = "translate3d(" + (-100 * index) + "%,0,0)";
    viewport.scrollLeft = 0;

    pages.forEach(function (p, i) {
      if (i === index) p.removeAttribute("inert"); else p.setAttribute("inert", "");
    });
    pages[index].scrollTop = 0;

    tabs.forEach(function (t, i) {
      if (i === index) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    segs.forEach(function (s, i) { s.setAttribute("aria-current", i === index ? "true" : "false"); });
    if (window.matchMedia("(max-width: 860px)").matches) {
      tabs[index].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === pages.length - 1;
    prevLabel.textContent = index > 0 ? names[index - 1] : "";
    nextLabel.textContent = index < pages.length - 1 ? names[index + 1] : "";

    document.title = (index === 0 ? "" : names[index] + " — ") + "Brasserie L'Estrouchat, bières bio à Viviers";
    if (!fromHash && location.hash !== "#" + ids[index]) {
      history.pushState(null, "", "#" + ids[index]);
    }
  }

  // Liens internes (onglets, boutons, logo)
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-goto]");
    if (!link) return;
    e.preventDefault();
    go(parseInt(link.getAttribute("data-goto"), 10));
  });

  prevBtn.addEventListener("click", function () { go(current - 1); });
  nextBtn.addEventListener("click", function () { go(current + 1); });

  // Flèches du clavier (sauf pendant la saisie dans le formulaire)
  document.addEventListener("keydown", function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") go(current + 1);
    if (e.key === "ArrowLeft") go(current - 1);
  });

  // Glisser du doigt sur mobile
  var startX = 0, startY = 0, tracking = false;
  track.addEventListener("touchstart", function (e) {
    if (e.target.closest("iframe, input, textarea, select")) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  track.addEventListener("touchend", function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Adresse de la page dans l'URL (#bieres, #contact…)
  function fromHash() {
    var i = ids.indexOf(location.hash.slice(1));
    go(i < 0 ? 0 : i, true);
  }
  window.addEventListener("popstate", fromHash);
  window.addEventListener("hashchange", fromHash);
  // Le navigateur fait défiler la zone vers l'ancre (#bieres…) : on l'en empêche,
  // c'est le déplacement du ruban qui affiche la bonne page.
  viewport.addEventListener("scroll", function () { viewport.scrollLeft = 0; });
  fromHash();

  // Ouvert / fermé en ce moment (heure de Paris)
  var HOURS = { 3: [10, 18], 4: [10, 12], 5: [10, 18], 6: [10, 18] };
  (function () {
    var now;
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      now = { day: day, h: parseInt(get("hour"), 10) + parseInt(get("minute"), 10) / 60 };
    } catch (err) {
      var d = new Date();
      now = { day: d.getDay(), h: d.getHours() + d.getMinutes() / 60 };
    }

    var row = document.querySelector('.hours tr[data-day="' + now.day + '"]');
    if (row) row.classList.add("is-today");

    var slot = HOURS[now.day];
    var status = document.getElementById("status");
    var text = document.getElementById("status-text");
    if (slot && now.h >= slot[0] && now.h < slot[1]) {
      status.classList.add("is-open");
      text.textContent = "Ouvert en ce moment, jusqu'à " + slot[1] + " h";
    } else {
      text.textContent = "Fermé en ce moment";
    }
  })();

  // Formulaire : ouvre la messagerie avec le message prérempli
  var form = document.getElementById("contact-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var subject = "Message du site — " + f.type.value;
    var body = f.message.value + "\n\n" + f.nom.value + "\n" + f.email.value;
    location.href = "mailto:brasserie.estrouchat@gmail.com?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();
