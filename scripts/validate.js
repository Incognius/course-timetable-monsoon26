// Cross-checks js/data.js (and js/syllabi.js) for internal consistency and
// against the raw PDF extracts. Run after every data regeneration:
//   node scripts/validate.js
// Exit code 1 on hard errors; warnings are informational.

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.dirname(__dirname);
global.window = {};
eval(fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8"));
eval(fs.readFileSync(path.join(ROOT, "js", "syllabi.js"), "utf8"));
const DATA = global.window.COURSE_DATA;
const SYLLABI = global.window.SYLLABI;

let errors = [], warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const codes = Object.keys(DATA.courses);

/* ---- per-course checks ---- */
for (const code of codes) {
  const c = DATA.courses[code];
  if (!/^[A-Z]{2}\d\.\d{3}[ab]?$/.test(code)) warn(`${code}: unusual course code format`);
  const m = /^(\d+)-(\d+)-(\d+)-(\d+)$/.exec(c.ltpc);
  if (m) {
    if (parseInt(m[4], 10) !== c.credits) err(`${code}: credits ${c.credits} != L-T-P-C ${c.ltpc}`);
  } else if (!/^\d+\s*Cr$/i.test(c.ltpc)) {
    err(`${code}: unparseable ltpc "${c.ltpc}"`);
  }
  if (c.half && !["H1", "H2", "H"].includes(c.half)) err(`${code}: bad half "${c.half}"`);
  for (const s of c.sections) {
    for (const mt of s.meetings) {
      if (!DAYS.includes(mt.day)) err(`${code}: bad day "${mt.day}"`);
      if (!(mt.period >= 1 && mt.period <= 6)) err(`${code}: bad period ${mt.period}`);
    }
    if (!s.meetings.length) err(`${code}: section "${s.label}" has no meetings`);
  }
  // Day-pair sanity: full-week courses normally meet on a slot pair
  // (Mon/Thu, Tue/Fri, Wed/Sat); single-day or cross-pair is only a warning
  // because the grid has genuine asymmetries.
  for (const s of c.sections) {
    const days = s.meetings.map((mt) => mt.day);
    const pairs = { Mon: "Thu", Thu: "Mon", Tue: "Fri", Fri: "Tue", Wed: "Sat", Sat: "Wed" };
    const unpaired = days.filter((d) => !days.includes(pairs[d]));
    if (unpaired.length) warn(`${code}: unpaired meeting day(s) ${[...new Set(unpaired)].join(",")}`);
  }
}

/* ---- categories ---- */
const catCounts = {};
for (const code of codes)
  for (const cat of DATA.courses[code].categories) {
    if (!DATA.categories[cat]) err(`${code}: unknown category "${cat}"`);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
for (const cat of Object.keys(DATA.categories))
  if (!catCounts[cat]) err(`category "${cat}" has no courses`);

/* ---- programmes ---- */
for (const [pid, p] of Object.entries(DATA.programmes)) {
  for (const code of p.required)
    if (!DATA.courses[code]) err(`${pid}: required course ${code} not found`);
  if (!p.totalCredits) err(`${pid}: missing totalCredits`);
}

/* ---- timetable grid cross-check: every grid cell course name should map to
        a course whose meetings include that cell ---- */
const raw = fs.readFileSync(path.join(ROOT, "data", "raw", "timetable.txt"), "utf8");
// Build cell -> [names]
const lines = raw.split("\n").filter((l) => l.includes("||"));
const dayRows = [];
for (const line of lines) {
  const cells = line.split("||").map((s) => s.trim());
  const dm = /^(Mon|Tue|Wed|Thu|Fri|Sat)/.exec(cells[0]);
  if (dm) dayRows.push({ day: dm[1], cells: cells.slice(1) });
}
// Column layout differs between the two pages (page 1 has an extra empty col
// before lunch). Detect lunch column by content, then periods are the
// non-lunch, non-empty columns in order.
const IGNORE = new Set(["", "L; U; N; C; H; B; R; E; A; K", "Free Slot / FSIS"]);
function normName(s) {
  return s.toLowerCase().replace(/\(h1&h2\)|\(h1 & h2\)|\(h1\)|\(h2\)|\(h\)|\(lab\)|\(lecture\)|\(2-5pm\)/g, "")
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}
// name -> set of "Day+P" the data says it meets
const dataCells = {};
for (const code of codes) {
  const c = DATA.courses[code];
  for (const s of c.sections)
    for (const mt of s.meetings) {
      const key = normName(c.name) + (s.label && c.code === "MA5.101" ? " " + s.label.toLowerCase() : "");
      (dataCells[key] = dataCells[key] || new Set()).add(mt.day + mt.period);
    }
}
// Aliases: grid names that differ from offerings names.
const ALIAS = {
  "computational linguistics ii": "computational linguistics ii comp semantics and discourse parsing",
  "information ad and extraction": "information retrieval and extraction",
  "topics in nano sciences": "topics in nanosciences",
  "thinking and knowing in the human sciences - iii": "thinking and knowing in the human sciences iii",
  "thinking and knowing in the human sciences - ii": "thinking and knowing in the human sciences ii",
  "maths for computer science 1-probability and statistics": "maths for computer science 1 probability and statistics",
  "maths for computer science 2 - linear algebra": "maths for computer science 2 linear algebra",
  "finite element methods": "finite element method",
  "behavioral research experiment design": "behavioral research and experimental design",
  "cyber gis geospatial web and geo bi": "cyber gis geospatial web and geobi",
  "intro to neuroeconomics": "introduction to neuroeconomics",
  "diffusion models for generative ai": "diffusion models for generative ai",
  "intro to cognitive science": "intro to cognitive science",
  "environmental science and technology": "environmental science and technology",
  "micro and nano fabrication technology for ic": "micro and nano fabrication technology for ics",
  "early stage funding for startup": "early stage funding for a startup",
  "service design": "service design",
  "science lab 1": "science lab i",
  "scientific visualization": "scientific visualisation",
  "market research and customer validation": "market research and validation",
  "physics of the early universe": "physics of early universe",
  "value education i": "value education 1",
  "arts 1": "arts 1",
  "systems thinking": "systems thinking",
  "embedded systems workshop": "embedded systems workshop",
  "networks signals and systems": "networks signals and systems",
  "earth system science and modeling": "earth system science and modelling",
  "statistical methods in ai section a": "statistical methods in ai",
  "statistical methods in ai section b": "statistical methods in ai",
  "advance remote sensing": "advanced remote sensing",
  "introduction to neural and cognitive modelling": "introduction to neural and cognitive modeling",
  "mechanistic interpretability of language models": "mechanistic interpretability of language models",
  "science 1 section a ug2 cse d": "science 1 section a ug2 cse csd",
  "science 1 section b ug2 ece d ug3 cld chd cgd": "science 1 section b ug2 ece ecd ug3 cld chd cgd",
  "discrete structures a": "discrete structures a",
  "discrete structures b": "discrete structures b"
};
// Cells in the official grid that contradict the rest of the document; each
// needs a reason. Checked so silent typos in future versions still surface.
const KNOWN_ANOMALIES = new Set([
  "Thu1|computer aided drug design", // CADD is a p2 course (Mon2/Thu2); Thu p1 listing is a doc duplication
  // Advanced NLP and Intro to Neural & Cognitive Modelling: doc lists both at
  // Tue2/Fri2, but per academic office correction Advanced NLP actually runs
  // Mon3/Thu3 and INCM runs Tue6/Fri6.
  "Tue2|advanced nlp",
  "Fri2|advanced nlp",
  "Tue2|introduction to neural and cognitive modeling",
  "Fri2|introduction to neural and cognitive modeling"
]);
// Which grid columns are periods: page rows have 7-8 cells; map by position of
// the lunch cell. Periods 1,2,3 before lunch; 4,5,6 after.
let unmatched = [];
for (const row of dayRows) {
  const cells = row.cells;
  let lunchIdx = cells.findIndex((c) => c.replace(/[^A-Z]/g, "").startsWith("LUNCH"));
  if (lunchIdx === -1) lunchIdx = cells.length > 7 ? 4 : 3; // empty lunch cell on some rows
  const periodOf = (i) => (i < lunchIdx ? i + 1 : i - lunchIdx + 3);
  cells.forEach((cell, i) => {
    if (IGNORE.has(cell.trim())) return;
    if (i >= lunchIdx && periodOf(i) > 6) return;
    const p = periodOf(i);
    if (p < 1 || p > 6) return;
    const cellKey = row.day + p;
    // Course names wrap across "; " fragments inside a cell. Greedily join
    // consecutive fragments until a known course matches.
    const frags = cell.split(";").map((s) => s.replace(/,\s*$/, "").trim())
      .filter((s) => s && !IGNORE.has(s));
    let idx = 0;
    while (idx < frags.length) {
      let matched = false;
      for (let take = 1; take <= 4 && idx + take <= frags.length; take++) {
        let key = normName(frags.slice(idx, idx + take).join(" "));
        key = ALIAS[key] || key;
        if (dataCells[key] && dataCells[key].has(cellKey)) { idx += take; matched = true; break; }
      }
      if (!matched) {
        if (!normName(frags[idx])) { idx++; continue; } // pure "(Lab) (2-5pm)"-style annotation fragment
        // try longest join anyway for the anomaly whitelist / report
        let best = frags[idx];
        for (let take = 2; take <= 4 && idx + take <= frags.length; take++) {
          const joinedKey = normName(frags.slice(idx, idx + take).join(" "));
          if (dataCells[ALIAS[joinedKey] || joinedKey]) { best = frags.slice(idx, idx + take).join(" "); idx += take - 1; break; }
        }
        const bestKey = ALIAS[normName(best)] || normName(best);
        if (!KNOWN_ANOMALIES.has(cellKey + "|" + bestKey)) {
          unmatched.push(`${row.day} p${p}: "${best}"`);
        }
        idx++;
      }
    }
  });
}

/* ---- syllabus coverage ---- */
const noSyllabus = codes.filter((c) => !SYLLABI[c] && !SYLLABI[c.replace(/[ab]$/, "")] &&
  !SYLLABI[c + "a"] && !/9\.\d/.test(c) && !c.startsWith("OC1"));
const orphanSyllabi = Object.keys(SYLLABI).filter((c) => !DATA.courses[c] && !DATA.courses[c + ""]);

const noSlot = codes.filter((c) => !DATA.courses[c].sections.length);

console.log(`courses: ${codes.length}, programmes: ${Object.keys(DATA.programmes).length}, syllabi: ${Object.keys(SYLLABI).length}`);
if (errors.length) { console.log("\nERRORS:"); errors.forEach((e) => console.log("  " + e)); }
if (warnings.length) { console.log("\nwarnings:"); warnings.forEach((w) => console.log("  " + w)); }
if (unmatched.length) {
  console.log(`\ntimetable cells not matched to course meetings (${unmatched.length}):`);
  unmatched.forEach((u) => console.log("  " + u));
}
if (noSyllabus.length) console.log("\ncourses without syllabus entry: " + noSyllabus.join(", "));
if (orphanSyllabi.length) console.log("\nsyllabus entries with no course: " + orphanSyllabi.join(", "));
console.log("\ncourses without grid slots (expected: sports/honours/thesis/seminars/workshops): " + noSlot.join(", "));
process.exit(errors.length ? 1 : 0);
