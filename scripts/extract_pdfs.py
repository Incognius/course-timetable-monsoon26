"""Deterministic PDF extraction for the M26 elective planner.

Dumps raw text (and the timetable's table structure) from the three official
PDFs into data/raw/. Run this whenever a new version of any PDF is dropped in
the project root, then diff data/raw/ against git to see what changed.

Usage: python scripts/extract_pdfs.py
"""

import glob
import os
import sys

import pdfplumber

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")


def find_pdf(pattern):
    matches = sorted(glob.glob(os.path.join(ROOT, pattern)))
    if not matches:
        sys.exit(f"error: no PDF matching {pattern!r} in {ROOT}")
    if len(matches) > 1:
        print(f"note: multiple matches for {pattern!r}, using {os.path.basename(matches[-1])}")
    return matches[-1]


def dump_text(pdf_path, out_name):
    out_path = os.path.join(RAW, out_name)
    with pdfplumber.open(pdf_path) as pdf, open(out_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(pdf.pages):
            f.write(f"\n===== PAGE {i + 1} =====\n")
            f.write(page.extract_text() or "")
    print(f"{os.path.basename(pdf_path)} -> data/raw/{out_name}")


def dump_timetable(pdf_path, out_name):
    """The timetable is a grid; table extraction preserves cell boundaries."""
    out_path = os.path.join(RAW, out_name)
    with pdfplumber.open(pdf_path) as pdf, open(out_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(pdf.pages):
            f.write(f"\n===== PAGE {i + 1} =====\n")
            for table in page.extract_tables():
                for row in table:
                    cells = [(c or "").replace("\n", "; ") for c in row]
                    f.write(" || ".join(cells) + "\n")
    print(f"{os.path.basename(pdf_path)} -> data/raw/{out_name}")


def main():
    os.makedirs(RAW, exist_ok=True)
    dump_text(find_pdf("CourseOfferings*.pdf"), "offerings.txt")
    dump_text(find_pdf("Courses-Syllabus*.pdf"), "syllabus.txt")
    dump_timetable(find_pdf("Consolidated Lecture Time Table*.pdf"), "timetable.txt")


if __name__ == "__main__":
    main()
