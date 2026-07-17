// Timetable builder: pick a programme (cores auto-fill, sections resolved to
// avoid clashes), then freely add electives — no per-semester slot rules, only
// a credit counter with an overload indicator. Drag a course onto the grid to
// add it. Selection persists in localStorage.

(function () {
  "use strict";
  var A = window.APP, D = A.D, esc = A.esc;
  var $ = function (id) { return document.getElementById(id); };

  var STORE_KEY = "m26-selection-v1";

  document.getElementById("meta-line").textContent =
    D.meta.semester + " · Offerings " + D.meta.offeringsVersion;
  A.initThemeToggle($("theme-toggle"));

  /* ---------- state ---------- */
  var state = load() || {};
  state.programme = state.programme || "";
  state.courses = state.courses || [];       // [{code, sectionLabel}]
  state.lastSelected = state.lastSelected || null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); }
    catch (e) { return null; }
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function selected(code) {
    return state.courses.find(function (s) { return s.code === code; }) || null;
  }

  function sectionOf(sel) {
    var c = D.courses[sel.code];
    if (!c.sections.length) return null;
    return c.sections.find(function (s) { return s.label === sel.sectionLabel; }) || c.sections[0];
  }

  /* ---------- clash computation ---------- */
  function occupancy() {
    var cells = {};
    state.courses.forEach(function (sel) {
      var sec = sectionOf(sel);
      if (!sec) return;
      sec.meetings.forEach(function (m) {
        var key = m.day + m.period;
        (cells[key] = cells[key] || []).push(sel);
      });
    });
    var clashCells = {};
    Object.keys(cells).forEach(function (key) {
      var list = cells[key];
      for (var i = 0; i < list.length; i++)
        for (var j = i + 1; j < list.length; j++) {
          var a = D.courses[list[i].code], b = D.courses[list[j].code];
          if (A.halvesOverlap(a.half, b.half)) clashCells[key] = true;
        }
    });
    return { cells: cells, clashCells: clashCells };
  }

  function sectionClashes(code, sec) {
    var c = D.courses[code];
    var occ = occupancy().cells;
    return sec.meetings.some(function (m) {
      var others = occ[m.day + m.period] || [];
      return others.some(function (o) {
        if (o.code === code) return false;
        return A.halvesOverlap(c.half, D.courses[o.code].half);
      });
    });
  }

  // First section that doesn't clash with the current selection (dual-degree
  // cohorts are split across sections A/B precisely so this works out);
  // falls back to the first section.
  function bestSection(code) {
    var c = D.courses[code];
    if (!c.sections.length) return null;
    for (var i = 0; i < c.sections.length; i++)
      if (!sectionClashes(code, c.sections[i])) return c.sections[i].label;
    return c.sections[0].label;
  }

  function wouldClash(code) {
    var c = D.courses[code];
    if (!c.sections.length) return false;
    return c.sections.every(function (s) { return sectionClashes(code, s); });
  }

  /* ---------- programme select ---------- */
  var progSel = $("prog-select");
  Object.keys(D.programmes).forEach(function (pid) {
    var o = document.createElement("option");
    o.value = pid;
    o.textContent = D.programmes[pid].label;
    progSel.appendChild(o);
  });
  progSel.value = state.programme || "";
  progSel.addEventListener("change", function () {
    // wipe the previous programme's auto-added cores before adding the new ones
    var prev = state.programme;
    if (prev && D.programmes[prev]) {
      var prevReq = D.programmes[prev].required;
      state.courses = state.courses.filter(function (s) {
        return prevReq.indexOf(s.code) === -1;
      });
      if (prevReq.indexOf(state.lastSelected) !== -1) state.lastSelected = null;
    }
    state.programme = progSel.value;
    if (state.programme) addRequired(state.programme);
    save();
    renderAll();
  });

  function addRequired(pid) {
    var req = D.programmes[pid].required
      .map(function (code) { return D.courses[code]; })
      .filter(Boolean);
    // fix single-section courses on the grid first, then resolve the
    // multi-section ones (Discrete Structures A/B etc.) around them
    req.sort(function (a, b) { return (a.sections.length > 1) - (b.sections.length > 1); });
    req.forEach(function (c) {
      if (selected(c.code)) return;
      state.courses.push({ code: c.code, sectionLabel: bestSection(c.code) });
    });
  }

  /* ---------- course picker ---------- */
  var pickSearch = $("pick-search"), pickFilter = $("pick-filter"), pickList = $("pick-list");
  pickSearch.addEventListener("input", renderPicker);
  pickFilter.addEventListener("change", renderPicker);

  // category filter options
  (function () {
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
      pickFilter.appendChild(og);
    });
  })();

  function renderPicker() {
    var q = pickSearch.value;
    var cat = pickFilter.value;
    var codes = Object.keys(D.courses).filter(function (code) {
      var c = D.courses[code];
      if (cat === "noncourse") {
        if (!c.nonCourse) return false;
      } else {
        if (c.nonCourse && !selected(code)) return false;
        if (cat && c.categories.indexOf(cat) === -1) return false;
      }
      return A.matchesQuery(c, q);
    }).sort();

    pickList.innerHTML = codes.map(function (code) {
      var c = D.courses[code];
      var sel = selected(code);
      var clash = !sel && wouldClash(code);
      var slotTxt = c.sections.length
        ? A.meetingsText(c.sections[0].meetings)
        : "No grid slot";
      var cls = "pick-row" + (sel ? " selected" : "") + (clash ? " clashing" : "");
      return (
        '<div class="' + cls + '" draggable="true" data-code="' + esc(code) + '">' +
        '<div class="top"><span class="code">' + esc(code) + "</span>" +
        '<span class="code">' + esc(c.ltpc) + "</span></div>" +
        "<div>" + esc(c.name) + "</div>" +
        '<div class="slot">' + esc(slotTxt) +
        (c.half ? " · " + esc(c.half) : "") + "</div>" +
        (clash ? '<div class="warn">Clashes with your selection</div>' : "") +
        (sel && c.sections.length > 1
          ? '<div class="sec-choice">' + sectionButtons(code, sel) + "</div>" : "") +
        "</div>"
      );
    }).join("");
  }

  function sectionButtons(code, sel) {
    return D.courses[code].sections.map(function (s) {
      var active = sel.sectionLabel === s.label;
      return '<button data-sec="' + esc(s.label) + '" data-code="' + esc(code) + '"' +
        ' class="' + (active ? "on" : "") + '">Sec ' + esc(s.label) + "</button>";
    }).join("");
  }

  pickList.addEventListener("click", function (e) {
    var secBtn = e.target.closest("button[data-sec]");
    if (secBtn) {
      var sel = selected(secBtn.getAttribute("data-code"));
      if (sel) { sel.sectionLabel = secBtn.getAttribute("data-sec"); save(); renderAll(); }
      e.stopPropagation();
      return;
    }
    var row = e.target.closest(".pick-row");
    if (!row) return;
    toggleCourse(row.getAttribute("data-code"));
  });

  function addCourse(code) {
    if (selected(code) || !D.courses[code]) return;
    state.courses.push({ code: code, sectionLabel: bestSection(code) });
    state.lastSelected = code;
    save();
    renderAll();
  }

  function removeCourse(code) {
    state.courses = state.courses.filter(function (s) { return s.code !== code; });
    if (state.lastSelected === code) state.lastSelected = null;
    save();
    renderAll();
  }

  function toggleCourse(code) {
    if (selected(code)) removeCourse(code);
    else addCourse(code);
  }

  /* ---------- drag & drop onto the grid ---------- */
  pickList.addEventListener("dragstart", function (e) {
    var row = e.target.closest(".pick-row");
    if (!row) return;
    e.dataTransfer.setData("text/plain", row.getAttribute("data-code"));
    e.dataTransfer.effectAllowed = "copy";
    row.classList.add("dragging");
  });
  pickList.addEventListener("dragend", function (e) {
    var row = e.target.closest(".pick-row");
    if (row) row.classList.remove("dragging");
  });
  var gridWrap = document.querySelector(".grid-wrap");
  gridWrap.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  gridWrap.addEventListener("drop", function (e) {
    e.preventDefault();
    var code = e.dataTransfer.getData("text/plain");
    if (code) addCourse(code);
  });

  /* ---------- weekly grid: days as rows, periods as columns ---------- */
  function renderGrid() {
    var occ = occupancy();
    var html = "<thead><tr><th class=\"day\"></th>" +
      D.periods.map(function (p) {
        return "<th>" + p.start + "–" + p.end + "</th>";
      }).join("") + "</tr></thead><tbody>";
    A.DAY_ORDER.forEach(function (day) {
      html += '<tr><th class="day">' + day + "</th>";
      D.periods.forEach(function (p) {
        var key = day + p.n;
        var evs = occ.cells[key] || [];
        var cls = "cell" + (occ.clashCells[key] ? " clash" : "");
        html += '<td class="' + cls + '">' + evs.map(function (sel) {
          var c = D.courses[sel.code];
          var sub = [];
          if (sel.sectionLabel) sub.push("Sec " + sel.sectionLabel);
          if (c.half) sub.push(c.half);
          return '<div class="ev">' + esc(shorten(c.name)) +
            (sub.length ? '<div class="sub2">' + esc(sub.join(" · ")) + "</div>" : "") +
            "</div>";
        }).join("") + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody>";
    $("tt-table").innerHTML = html;

    var nClash = Object.keys(occ.clashCells).length;
    var banner = $("clash-banner");
    if (nClash) {
      var names = {};
      Object.keys(occ.clashCells).forEach(function (key) {
        (occ.cells[key] || []).forEach(function (sel) {
          names[D.courses[sel.code].name] = true;
        });
      });
      banner.textContent = "Clash in " + nClash + " slot" + (nClash > 1 ? "s" : "") +
        ": " + Object.keys(names).sort().join(" · ");
      banner.classList.add("visible");
    } else {
      banner.classList.remove("visible");
    }
  }

  function shorten(name) {
    return name.length > 40 ? name.slice(0, 38) + "…" : name;
  }

  /* ---------- side panel: credits + selected list ---------- */
  function renderSide() {
    var prog = state.programme ? D.programmes[state.programme] : null;
    $("side-prog").textContent = prog ? prog.label : "No programme selected";
    $("grid-title").textContent = prog ? prog.label : "";

    var total = 0;
    state.courses.forEach(function (sel) {
      var c = D.courses[sel.code];
      if (c && c.credits) total += c.credits;
    });
    var line = "<strong>" + total + "</strong> credits selected";
    if (prog) {
      line += " · normal load " + esc(prog.totalCredits);
      var nums = String(prog.totalCredits).match(/\d+/g) || [];
      var max = nums.length ? Math.max.apply(null, nums.map(Number)) : null;
      if (max && total > max) {
        line += ' · <span style="color:var(--clash);font-weight:600">overloading by ' +
          (total - max) + "</span>";
      }
    }
    $("side-credits").innerHTML = line;

    $("sel-list").innerHTML = state.courses.slice().sort(function (a, b) {
      return D.courses[a.code].name < D.courses[b.code].name ? -1 : 1;
    }).map(function (sel) {
      var c = D.courses[sel.code];
      var noslot = !c.sections.length;
      var extra = [];
      if (sel.sectionLabel) extra.push("Sec " + sel.sectionLabel);
      extra.push(c.credits != null ? c.credits + " cr" : c.ltpc);
      return '<div class="sel-row' + (noslot ? " noslot" : "") + '">' +
        '<span class="nm">' + esc(c.name) +
        ' <span style="color:var(--text-dim);font-size:0.7rem">(' + esc(extra.join(", ")) + ")</span></span>" +
        '<button class="rm" data-code="' + esc(sel.code) + '" title="Remove">×</button>' +
        "</div>";
    }).join("") || '<div style="font-size:0.78rem;color:var(--text-dim)">Nothing selected yet.</div>';
  }

  $("sel-list").addEventListener("click", function (e) {
    var btn = e.target.closest("button.rm");
    if (btn) removeCourse(btn.getAttribute("data-code"));
  });

  /* ---------- course detail card (most recently selected) ---------- */
  function sylBlock(title, body) {
    if (!body) return "";
    return "<div><h3>" + esc(title) + '</h3><div class="syl">' + esc(body) + "</div></div>";
  }

  function renderDetail() {
    var card = $("detail-card");
    var code = state.lastSelected;
    if (!code || !D.courses[code]) {
      card.innerHTML = '<div class="placeholder">Select a course to see its details here.</div>';
      return;
    }
    var c = D.courses[code];
    var syl = A.SYLLABI[code] || A.SYLLABI[code.replace(/[ab]$/, "")] || null;
    var schedule = c.sections.map(function (s) {
      return (s.label ? "Sec " + s.label + ": " : "") + A.meetingsText(s.meetings);
    }).join(" · ") || "No scheduled slot on the lecture grid";
    var facts = [
      c.faculty.length ? c.faculty.join(", ") : null,
      schedule,
      c.categories.length ? "Counts as: " + c.categories.map(A.categoryLabel).join(", ") : null,
      c.cap ? "Seat cap " + c.cap : null,
      c.note
    ].filter(Boolean).join(" · ");

    var html =
      '<div class="dc-head"><h2>' + esc(c.name) + "</h2>" +
      '<span class="sub">' + esc(c.code) + " · " + esc(c.ltpc) +
      (c.half ? " · " + esc(c.half) : "") + "</span></div>" +
      '<p class="dc-facts">' + esc(facts) + "</p>";

    if (syl) {
      var left = sylBlock("Prerequisites", syl.prerequisites) +
                 sylBlock("Course outcomes", syl.outcomes) +
                 sylBlock("Assessment", syl.assessment);
      var right = sylBlock("Detailed syllabus", syl.topics) ||
                  (syl.raw ? sylBlock("Syllabus (as published)", syl.raw) : "");
      html += '<div class="dc-cols"><div>' + left + "</div><div>" + right + "</div></div>";
    } else {
      html += '<p class="missing">Not included in Courses-Syllabus_M26-V1.</p>';
    }
    card.innerHTML = html;
  }

  /* ---------- toolbar ---------- */
  $("btn-reset").addEventListener("click", function () {
    state.courses = [];
    state.lastSelected = null;
    if (state.programme) addRequired(state.programme);
    save();
    renderAll();
  });
  $("btn-ics").addEventListener("click", function () {
    if ($("btn-ics").disabled) return;
    window.ICS.download(state.courses, "m26-timetable.ics");
  });

  function renderAll() {
    renderPicker();
    renderGrid();
    renderSide();
    renderDetail();
    $("btn-ics").disabled = !state.courses.some(function (sel) {
      return D.courses[sel.code] && D.courses[sel.code].sections.length;
    });
  }

  renderAll();
})();
