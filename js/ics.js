// ICS (RFC 5545) export. One weekly-recurring VEVENT per (course, period-slot),
// grouped so e.g. Mon+Thu meetings of the same course become one event with
// BYDAY=MO,TH. Events start on the first occurrence of their weekday on/after
// the semester start date (2026-08-01) and recur weekly until UNTIL_DATE.

(function () {
  "use strict";
  var A = window.APP, D = A.D;

  var BYDAY = { Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA" };
  var DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var UNTIL_DATE = "20261119T235959Z"; // final teaching day: 19 Nov 2026 (inclusive)

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // First date on/after startDate that falls on `day`
  function firstOccurrence(startDateStr, day) {
    var d = new Date(startDateStr + "T00:00:00");
    var target = DOW[day];
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    return d;
  }

  function dtstamp(d, timeStr) {
    return (
      d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      "T" + timeStr.replace(":", "") + "00"
    );
  }

  function icsEscape(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;")
      .replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function foldLine(line) {
    // RFC 5545: lines longer than 75 octets should be folded
    var out = [];
    while (line.length > 74) {
      out.push(line.slice(0, 74));
      line = " " + line.slice(74);
    }
    out.push(line);
    return out.join("\r\n");
  }

  // selection: [{code, sectionLabel}]
  function buildIcs(selection) {
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//m26-electives//timetable//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Kolkata",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0530",
      "TZOFFSETTO:+0530",
      "TZNAME:IST",
      "END:STANDARD",
      "END:VTIMEZONE"
    ];

    selection.forEach(function (sel) {
      var c = D.courses[sel.code];
      if (!c) return;
      var section = null;
      c.sections.forEach(function (s) {
        if (s.label === sel.sectionLabel || (!sel.sectionLabel && !s.label)) section = s;
      });
      if (!section && c.sections.length) section = c.sections[0];
      if (!section) return; // no grid slot (sports / honours / thesis)

      // group meetings by period so Mon+Thu p1 -> one event BYDAY=MO,TH
      var byPeriod = {};
      section.meetings.forEach(function (m) {
        (byPeriod[m.period] = byPeriod[m.period] || []).push(m.day);
      });

      Object.keys(byPeriod).forEach(function (pStr) {
        var p = parseInt(pStr, 10);
        var period = D.periods[p - 1];
        var days = byPeriod[pStr].slice().sort(function (a, b) {
          return A.DAY_ORDER.indexOf(a) - A.DAY_ORDER.indexOf(b);
        });
        // DTSTART anchors the recurrence: BYDAY instances earlier in DTSTART's
        // week are not generated (RFC 5545), so pick the earliest occurrence.
        var first = days.map(function (d) { return firstOccurrence(D.meta.startDate, d); })
          .sort(function (a, b) { return a - b; })[0];

        var summary = c.code + " " + c.name +
          (section.label ? " (Sec " + section.label + ")" : "");
        var desc = [
          "Faculty: " + (c.faculty.join(", ") || "-"),
          "L-T-P-C: " + c.ltpc,
          c.half ? "Half: " + c.half : null,
          c.note ? c.note : null
        ].filter(Boolean).join("\n");

        var uid = c.code.replace(/[^A-Za-z0-9]/g, "") +
          (section.label || "") + "p" + p + "@m26-electives";

        lines.push("BEGIN:VEVENT");
        lines.push(foldLine("UID:" + uid));
        lines.push("DTSTAMP:" + dtstamp(new Date(), "00:00").slice(0, 15) + "Z");
        lines.push("DTSTART;TZID=Asia/Kolkata:" + dtstamp(first, period.start));
        lines.push("DTEND;TZID=Asia/Kolkata:" + dtstamp(first, period.end));
        lines.push(foldLine("RRULE:FREQ=WEEKLY;WKST=MO;UNTIL=" + UNTIL_DATE + ";BYDAY=" +
          days.map(function (d) { return BYDAY[d]; }).join(",")));
        lines.push(foldLine("SUMMARY:" + icsEscape(summary)));
        lines.push(foldLine("DESCRIPTION:" + icsEscape(desc)));
        lines.push("END:VEVENT");
      });
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n") + "\r\n";
  }

  function download(selection, filename) {
    var blob = new Blob([buildIcs(selection)], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "m26-timetable.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  window.ICS = { buildIcs: buildIcs, download: download };
})();
