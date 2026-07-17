"""Segment data/raw/syllabus.txt into per-course syllabus records -> js/syllabi.js.

The syllabus PDF uses two template variants:
  A (numbered):  1.Prerequisite Course / Knowledge:  2.Course Outcomes (COs)
                 3.Mapping of COs with POs (dropped)  4.Detailed Syllabus:
                 5.Teaching-Learning Strategies  6.Assessment methods
  B (labeled):   Pre-Requisites :  Course Outcomes  Course Topics
                 Reference Books  Teaching-Learning Strategies  Assessment

This script only SEGMENTS the text — it never rewrites it. The CO->PO
articulation matrices are dropped as noise. Blocks whose Course Code field is
"New"/missing are resolved through TITLE_TO_CODE below; anything still
unresolved is reported so it can be fixed by hand.

The doc's block headers themselves contain typos that must all split blocks:
  "Title of the Course : X"        (normal)
  "Title of the course : X"        (lowercase c — Data Analytics-I, SC1.440...)
  "Tile of the Course : X"         (Service Design)
  "Title of the Course Name : X"   (Embedded Systems Workshop)
  "Title of the Course Robotics:.."(colon missing — EC4.401)

Usage: python scripts/build_syllabi.py
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Course-code assignments for blocks whose "Course Code" field says "New" or is
# missing. Maintained by hand: codes come from CourseOfferings (same course
# name). New unmatched titles show up in this script's report on re-parse.
TITLE_TO_CODE = {
    "advanced memory circuits and systems": "EC2.414",
    "advanced probability theory": "MA6.501",
    "ai for product managers/management": "PD3.401",
    "autonomous software engineering": "CS6.403",
    "complex analysis": "MA4.406",
    "diffusion models for generative ai": "CS7.510",
    "earth system science and modelling": "GS3.603",
    "identity and economic development": "HS5.402",
    "language models and agents: theory and practice": "CL3.410",
    "mechanistic interpretability of language models": "CL3.412",
    "optoelectronics & integrated photonics": "EC2.415",
    "micro & nano fabrication technology for ics": "EC2.416",
    "programming ai accelerators": "CS3.406",
    "topics in ai for healthcare": "CS9.442",
    "quantum information science": "SC4.430",
    "understanding public and digital history": "HS3.402",
    "nlp for healthcare": "CL3.411",
    "physics of early universe": "SC1.415",
    "readings from hindi literature": "HS1.401",
    "service design": "PD1.402",
    "system thinking and design": "PD2.405",
    "spatial thinking and practice": "GS0.101",
    "arts 1": "OC2.101",
    "autonomous software engineering (autose)": "CS6.403",
    "basics of ethics": "HS0.203",
    "classical text readings (philosophy)": "HS0.301",
    "computer aided drug design (cadd)": "SC4.415",
    "earth system science & modelling": "GS3.603",
    "gender and society": "HS8.201",
    "information, computation, and learning": "EC5.415",
    "market research & validation": "PD2.404",
    "principles of programming languages (popl)": "CS1.402",
    "structural dynamics": "CE1.501",
    "systems thinking": "EC5.202",
}

CODE_RE = re.compile(r"[A-Z]{2}\d\.\d{3}[a-z]?")

# The syllabus doc occasionally uses a different code than the offerings doc
# (which is the registration authority). Remap to the offerings code.
CODE_REMAP = {
    "SC1.310": "SC1.410",   # Open Quantum Systems and Quantum Thermodynamics
    "HS0.203a": "HS0.203",  # Basics of Ethics (H1 & H2) — single entry in data.js
}

# Section-start markers, checked per line, in no particular order (first match
# wins). "mapping" is captured then discarded.
NUM = r"(?:\d\s*\.\s*)?"
SECTIONS = [
    ("prerequisites", re.compile(rf"^\s*{NUM}Pre-?requisites?(?:\s*Courses?\s*(?:/\s*Knowledge)?)?\s*:?\s*", re.I)),
    ("prerequisites", re.compile(rf"^\s*{NUM}Prerequisite\s*Course\s*/\s*Knowledge\s*:?\s*", re.I)),
    ("outcomes", re.compile(rf"^\s*{NUM}Course\s*(?:Outcomes?|Objectives?)\b[^:]*:?\s*", re.I)),
    ("outcomes", re.compile(r"^\s*After\s*successful\s*completion\s*of\s*this\s*course", re.I)),
    ("mapping", re.compile(rf"^\s*{NUM}Mapping\s*of\s*Course\s*Outcomes", re.I)),
    ("topics", re.compile(rf"^\s*{NUM}[Dd]?etailed\s*[Ss]yllabus\s*:?\s*")),
    ("topics", re.compile(rf"^\s*{NUM}Course\s*(?:Topics|Modules|Content)\s*:?\s*", re.I)),
    ("topics", re.compile(r"^\s*(?:A\s*list\s*of\s*representative\s*topics|List\s*of\s*topics\s*and\s*activities)", re.I)),
    ("references", re.compile(r"^\s*Reference\s*Books?\s*(?:and\s*Material)?\s*:?\s*$", re.I)),
    ("references", re.compile(r"^\s*(?:References|Textbook\s*&\s*Course\s*Materials|Textbooks?|E-book\s*Links|Preferred\s*Readings)\s*:?\s*$", re.I)),
    ("teaching", re.compile(rf"^\s*{NUM}Teaching-?Learning\s*Strategies?[^:]*:?\s*", re.I)),
    ("assessment", re.compile(rf"^\s*{NUM}Assessment\s*methods?[^:]*:?\s*", re.I)),
    ("assessment", re.compile(r"^\s*(?:Assessment\s*method\s*and\s*Grading\s*scheme|Grading\s*Polic(?:y|ies)|Grading\s*Plan|Graded\s*Course\s*Activities)\s*:?\s*", re.I)),
]

# Matches every observed "Title of the Course" header variant (see docstring).
TITLE_SPLIT = re.compile(
    r"(?=[Tt]i\w{0,3}\s+of\s+the\s+[Cc]ourse(?:\s+[Nn]ame)?\s*:"
    r"|Title\s+of\s+the\s+Course\s+[A-Z])")

# Header fields at the top of each block (before the first section marker).
HEADER_FIELDS = [
    ("title", re.compile(r"^\s*[Tt]i\w{0,3}\s+of\s+the\s+[Cc]ourse(?:\s+[Nn]ame)?\s*:?\s*(.*)")),
    ("faculty", re.compile(r"^\s*(?:Name\s*of\s*the\s*Faculty|Faculty\s*Name)\s*\(?s?\)?\s*:?\s*(.*)", re.I)),
    ("code", re.compile(r"^\s*Course\s*Code\s*:?\s*(.*)")),
    ("program", re.compile(r"^\s*Name\s*of\s*the\s*(?:Program|Academic\s*Program)\s*m?e?\s*:?\s*(.*)", re.I)),
    ("credits", re.compile(r"^\s*Credits?\s*:?\s*(.*)")),
    ("ltp", re.compile(r"^\s*L\s*-\s*T\s*-\s*P\s*:?\s*(.*)")),
    ("semester", re.compile(r"^\s*Semester,?\s*Year\s*:?\s*(.*)")),
]

DROP_LINE = re.compile(
    r"^\s*(Note:\s*Each\s*Course\s*Outcome|Write\s*.3.\s*in\s*the\s*box|"
    r"\(Please\s*write|PO\s*PO|CO\s*-?\s*\d*\s*[\d\s]*$)"
)


def clean_text(txt):
    # Replace extractor's replacement char: apostrophe between letters, dash otherwise.
    txt = re.sub(r"(?<=\w)�(?=\w)", "'", txt)
    txt = txt.replace("�", "-")
    return txt


def parse_block(block):
    rec = {k: None for k in
           ["title", "faculty", "code", "program", "credits", "ltp", "semester",
            "prerequisites", "outcomes", "topics", "references", "teaching", "assessment"]}
    section = None          # None = still in header
    buf = {}
    for line in block.splitlines():
        if not line.strip():
            continue
        matched = None
        for name, pat in SECTIONS:
            m = pat.match(line)
            if m:
                # Guard: "Course Outcomes" line inside header area is a real
                # section start; fine either way.
                matched = (name, line[m.end():].strip())
                break
        if matched:
            section, rest = matched
            if rest:
                buf.setdefault(section, []).append(rest)
            continue
        if section is None:
            for key, pat in HEADER_FIELDS:
                m = pat.match(line)
                if m:
                    val = m.group(1).strip()
                    if rec[key] is None and val:
                        rec[key] = val
                    elif rec[key] is not None and key in ("faculty", "title") and val:
                        rec[key] += " " + val
                    break
            else:
                # continuation of a wrapped header value (e.g. faculty overflow)
                if rec["title"] and not CODE_RE.search(line) and len(line.strip()) < 80:
                    pass  # ignore stray header wrap lines; fields above capture the joins we need
            continue
        if DROP_LINE.match(line):
            continue
        buf.setdefault(section, []).append(line.rstrip())
    for key in ("prerequisites", "outcomes", "topics", "references", "teaching", "assessment"):
        if key in buf:
            rec[key] = "\n".join(buf[key]).strip() or None
    # Free-form blocks that match none of the templates: keep the whole body
    # verbatim (minus the title line) rather than losing it.
    if not rec["outcomes"] and not rec["topics"]:
        body = "\n".join(l for l in block.splitlines()[1:] if l.strip())
        rec["raw"] = body.strip() or None
    else:
        rec["raw"] = None
    return rec


def resolve_code(rec):
    raw = rec.get("code") or ""
    m = CODE_RE.search(raw)
    if m:
        # e.g. "HS0.203a &HS0.203b" -> first code wins; both variants map here
        return CODE_REMAP.get(m.group(0), m.group(0))
    title_key = re.sub(r"\s*\((?:H1|H2|H|H1&H2)\)\s*", "", (rec.get("title") or "")).strip().lower()
    title_key = re.sub(r"\s+", " ", title_key)
    return TITLE_TO_CODE.get(title_key)


def main():
    raw = open(os.path.join(ROOT, "data", "raw", "syllabus.txt"), encoding="utf-8").read()
    txt = clean_text(re.sub(r"\n===== PAGE \d+ =====\n", "\n", raw))
    blocks = TITLE_SPLIT.split(txt)[1:]
    print(f"blocks found: {len(blocks)}")

    out, unresolved, dupes = {}, [], []
    for block in blocks:
        rec = parse_block(block)
        code = resolve_code(rec)
        if not code:
            unresolved.append(rec["title"])
            continue
        if code in out:
            dupes.append(code)
        out[code] = {k: rec[k] for k in
                     ["title", "prerequisites", "outcomes", "topics",
                      "references", "teaching", "assessment", "raw"]}

    empty_sections = {c: [k for k in ("outcomes", "topics") if not r[k]]
                      for c, r in out.items()}
    empty_sections = {c: ks for c, ks in empty_sections.items() if ks}

    print(f"records emitted: {len(out)}")
    if unresolved:
        print("UNRESOLVED titles (add to TITLE_TO_CODE):")
        for t in unresolved:
            print("  -", t)
    if dupes:
        print("DUPLICATE codes (later block wins):", ", ".join(dupes))
    if empty_sections:
        print("records missing outcomes/topics:")
        for c, ks in sorted(empty_sections.items()):
            print(f"  {c}: {', '.join(ks)}")

    js = "// GENERATED by scripts/build_syllabi.py from Courses-Syllabus PDF. Do not edit by hand.\n"
    js += "window.SYLLABI = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n"
    out_path = os.path.join(ROOT, "js", "syllabi.js")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"wrote js/syllabi.js ({os.path.getsize(out_path)} bytes)")


if __name__ == "__main__":
    main()
