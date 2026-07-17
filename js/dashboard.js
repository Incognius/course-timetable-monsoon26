// Dashboard: filterable course tiles + detail modal.

(function () {
  "use strict";
  var A = window.APP, D = A.D, esc = A.esc;

  var $ = function (id) { return document.getElementById(id); };
  var tilesEl = $("tiles");

  document.getElementById("meta-line").textContent =
    D.meta.semester + " · Offerings " + D.meta.offeringsVersion;
  A.initThemeToggle($("theme-toggle"));

  // Honours / BTP / Thesis / Seminars are registrations, not courses — the
  // dashboard hides them (the timetable's requirements still know about them).
  var CODES = Object.keys(D.courses).filter(function (code) {
    return !D.courses[code].nonCourse;
  });

  /* ---------- filter controls ---------- */
  var catSel = $("f-category");
  var groups = {};
  Object.keys(D.categories).forEach(function (id) {
    var g = D.categories[id].group;
    (groups[g] = groups[g] || []).push(id);
  });
  Object.keys(groups).forEach(function (g) {
    var og = document.createElement("optgroup");
    og.label = g;
    groups[g].forEach(function (id) {
      var o = document.createElement("option");
      o.value = id;
      o.textContent = D.categories[id].label;
      og.appendChild(o);
    });
    catSel.appendChild(og);
  });

  var areas = {}, creditVals = {};
  CODES.forEach(function (code) {
    areas[D.courses[code].area] = true;
    if (D.courses[code].credits != null) creditVals[D.courses[code].credits] = true;
  });
  Object.keys(areas).sort().forEach(function (a) {
    var o = document.createElement("option");
    o.value = a;
    o.textContent = A.AREA_LABELS[a] ? a + " — " + A.AREA_LABELS[a] : a;
    $("f-area").appendChild(o);
  });
  Object.keys(creditVals).map(Number).sort(function (x, y) { return x - y; })
    .forEach(function (c) {
      var o = document.createElement("option");
      o.value = String(c); o.textContent = c + " credits";
      $("f-credits").appendChild(o);
    });

  ["f-search", "f-category", "f-area", "f-credits", "f-half"].forEach(function (id) {
    $(id).addEventListener("input", render);
  });
  $("f-clear").addEventListener("click", function () {
    $("f-search").value = "";
    $("f-category").value = "";
    $("f-area").value = "";
    $("f-credits").value = "";
    $("f-half").value = "";
    render();
  });

  function passes(c) {
    if (!A.matchesQuery(c, $("f-search").value)) return false;
    var cat = $("f-category").value;
    if (cat && c.categories.indexOf(cat) === -1) return false;
    var area = $("f-area").value;
    if (area && c.area !== area) return false;
    var cr = $("f-credits").value;
    if (cr && String(c.credits) !== cr) return false;
    var half = $("f-half").value;
    if (half === "full" && c.half) return false;
    if ((half === "H1" || half === "H2") && c.half !== half) return false;
    return true;
  }

  function tileHtml(c) {
    var tags = c.categories.map(function (id) {
      return '<span class="tag">' + esc(A.categoryLabel(id)) + "</span>";
    });
    if (c.half) tags.unshift('<span class="tag half">' + esc(c.half) + "</span>");
    if (c.cap) tags.push('<span class="tag cap">max ' + c.cap + "</span>");
    return (
      '<div class="tile" data-code="' + esc(c.code) + '">' +
      '<div class="code"><span>' + esc(c.code) + '</span><span class="credits">' +
        esc(c.ltpc) + "</span></div>" +
      '<div class="name">' + esc(c.name) + "</div>" +
      '<div class="fac">' + esc(c.faculty.join(", ") || "—") + "</div>" +
      '<div class="tags">' + tags.join("") + "</div>" +
      "</div>"
    );
  }

  function render() {
    var codes = CODES.filter(function (code) {
      return passes(D.courses[code]);
    });
    codes.sort();
    tilesEl.innerHTML = codes.map(function (code) { return tileHtml(D.courses[code]); }).join("");
    $("f-count").textContent = codes.length + " of " + CODES.length + " courses";
  }

  tilesEl.addEventListener("click", function (e) {
    var tile = e.target.closest(".tile");
    if (tile) openModal(tile.getAttribute("data-code"));
  });

  /* ---------- modal ---------- */
  var overlay = $("modal-overlay"), modal = $("modal");

  function sylSection(title, body) {
    if (!body) return "";
    return "<h3>" + esc(title) + '</h3><div class="syl">' + esc(body) + "</div>";
  }

  function openModal(code) {
    var c = D.courses[code];
    if (!c) return;
    var syl = A.SYLLABI[code] || A.SYLLABI[code.replace(/[ab]$/, "")] || null;
    var schedule = c.sections.map(function (s) {
      return (s.label ? "Sec " + s.label + ": " : "") + A.meetingsText(s.meetings);
    }).join("<br>") || esc(c.note || "No scheduled slot on the lecture grid");
    var reqBy = A.requiredBy(code);
    var cats = c.categories.map(A.categoryLabel).join(", ");

    var html =
      '<button class="close" id="modal-close">Close</button>' +
      "<h2>" + esc(c.name) + "</h2>" +
      '<div class="sub">' + esc(c.code) + " · " + esc(c.ltpc) +
        (c.half ? " · " + esc(c.half) : "") + "</div>" +
      '<dl class="facts">' +
      "<dt>Faculty</dt><dd>" + esc(c.faculty.join(", ") || "—") + "</dd>" +
      "<dt>Schedule</dt><dd>" + schedule + "</dd>" +
      (cats ? "<dt>Counts as</dt><dd>" + esc(cats) + "</dd>" : "") +
      (c.cap ? "<dt>Seat cap</dt><dd>" + c.cap + "</dd>" : "") +
      (reqBy.length ? "<dt>Core for</dt><dd>" + esc(reqBy.join("; ")) + "</dd>" : "") +
      (c.note ? "<dt>Note</dt><dd>" + esc(c.note) + "</dd>" : "") +
      "</dl>";

    if (syl) {
      html += sylSection("Prerequisites", syl.prerequisites);
      html += sylSection("Course outcomes", syl.outcomes);
      html += sylSection("Detailed syllabus", syl.topics);
      html += sylSection("References", syl.references);
      html += sylSection("Teaching approach", syl.teaching);
      html += sylSection("Assessment", syl.assessment);
      if (syl.raw && !syl.outcomes && !syl.topics) {
        html += sylSection("Syllabus (as published)", syl.raw);
      }
    } else {
      html += '<h3>Syllabus</h3><div class="missing">Not included in Courses-Syllabus_M26-V1.</div>';
    }

    modal.innerHTML = html;
    overlay.classList.add("open");
    modal.scrollTop = 0;
    document.getElementById("modal-close").addEventListener("click", closeModal);
  }

  function closeModal() { overlay.classList.remove("open"); }
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  render();
})();
