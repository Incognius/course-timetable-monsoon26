# IIIT-H Monsoon 2026 — Course Dashboard & Timetable Builder

A static site for exploring the courses offered in **Monsoon 2026 (2026-27
Semester I)** and building a clash-free personal timetable.

- **Courses** — every offered course as a filterable tile (code, credits,
  faculty, category, seat cap). Click a course for the full details and its
  verbatim syllabus (prerequisites, outcomes, detailed topics, references,
  assessment).
- **Timetable** — pick your programme, get your fixed cores placed
  automatically, then add electives by clicking or dragging them onto the
  weekly grid. Slot clashes are highlighted, a running credit total flags
  overloading, and you can export the whole thing to `.ics`.

Everything is client-side vanilla JS — no build step, no backend.

## Running locally

Any static file server works. For example:

```bash
python -m http.server 8321
# then open http://localhost:8321
```

Opening `index.html` directly from disk (`file://`) also works, because the
data is shipped as plain `<script>` files rather than fetched.

## Where the data comes from

All data is derived from the three official PDFs (kept in the repo root):

| PDF | Used for |
| --- | --- |
| `CourseOfferings-M26-V5.pdf` | courses, credits, faculty, programme cores |
| `Consolidated Lecture Time Table_M26.pdf` | weekly slot for each course |
| `Courses-Syllabus_M26-V1.pdf` | verbatim syllabus text |

Generated / curated files:

- `js/data.js` — curated courses, categories, programmes and the timetable
  slot for each course.
- `js/syllabi.js` — generated verbatim syllabus text, keyed by course code.

## Updating when a new PDF version is published

1. Drop the new PDF(s) in the repo root and run
   `python scripts/extract_pdfs.py` to regenerate `data/raw/*.txt`. The old
   raw text is committed, so `git diff data/raw/` shows exactly what the
   university changed.
2. If the syllabus PDF changed, run `python scripts/build_syllabi.py` to
   regenerate `js/syllabi.js`. It reports any titles it could not map to a
   course code.
3. If offerings/timetable changed, apply the diff to `js/data.js` by hand
   (course names in the timetable grid often differ from the offerings names).
4. Run `node scripts/validate.js` — it must exit 0. It cross-checks every
   timetable grid cell against the curated data, so a silently moved slot is
   caught. Genuine grid anomalies live in `KNOWN_ANOMALIES` with a reason.

## Data conventions

- Meetings are stored per explicit day (`"Mon1 Thu1"`), because the official
  grid has real asymmetries (e.g. Introduction to Linguistics-1 meets
  Mon + Fri, not Mon + Thu).
- Clash rule: same day + same period + overlapping halves. Two H1/H2 courses
  sharing a slot do **not** clash.
- Programmes list only their fixed cores plus a normal credit load. Elective
  requirements (HSS / Science / Maths / Bouquet / ECE Star & Stream counts)
  are graduation-level, not per-semester, so they are intentionally not
  enforced here. **The Star / Stream elective rules in particular are
  involved — read the official documents before registering.**
- Course descriptions shown in the UI come verbatim from the syllabus PDF.

## Known document facts (not bugs)

- A handful of offered courses have no entry in the syllabus PDF; the detail
  view says so explicitly.
- The syllabus PDF contains a few courses not offered this semester
  (Causal Inference, Design for Testability, Neuroinformatics, Quantum
  Materials & Devices) — harmless.
- `Thu 08:30 "Computer Aided Drug Design"` in the grid is a duplication (CADD
  is a 10:05 course) — whitelisted in the validator.

## ICS export

Weekly recurring events from **1 Aug 2026**, `TZID=Asia/Kolkata`, through the
final teaching day **19 Nov 2026**.
