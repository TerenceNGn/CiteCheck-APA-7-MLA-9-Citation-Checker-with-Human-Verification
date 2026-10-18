# Test evidence

Reproduce everything in this file from a clean clone:

```bash
node tests.mjs                      # automated tests (8, all passing)
python -m http.server 8000          # or double-click start-server.bat (Windows)
# open http://localhost:8000
```

## 1. Automated tests (`node tests.mjs`)

Run on Node 18+. Actual result on 2026-10-18: **8 passed, 0 failed**.

| # | Test | Input (summary) | Expected | Actual |
|---|------|-----------------|----------|--------|
| 1 | APA error correction | `Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001` | Corrected string with spaced initials, sentence case title, en dash pages, `https://doi.org/` link; status `needs_verification` | Pass |
| 2 | APA missing year | Same citation without `(2020).` | Status `incomplete`, asks for the year, outputs no citation | Pass |
| 3 | MLA formatting | `Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.` | Corrected string with en dash; status `corrected`; rule MLA-N1 `fixed` | Pass |
| 4 | MLA initials | Author written as `Smith, J. A.` | Status `incomplete`, asks for the full first name | Pass |
| 5 | Unsupported style | `style: "Chicago"` | Status `refused`, code `unsupported_style` | Pass |
| 6 | Out of scope | `Write my essay about sleep and memory.` | Status `refused`, code `out_of_scope` | Pass |
| 7 | Reference list | Text longer than 600 characters | Status `refused`, code `scope_list` | Pass |
| 8 | Structured fields | Authors/year/title/… as fields, no raw text | Correct APA citation assembled from fields only | Pass |

## 2. Manual browser checks (the demo path)

Open the app, click each example chip, compare with the expected result.

| Example | Expected | Evidence |
|---------|----------|----------|
| APA with errors | Status "Needs verification"; corrected citation shown; APA-A1, APA-T1, APA-P1, APA-DOI1 marked **fixed**; verification notice present | Screenshot `assets/screenshot.png`; re-runnable by opening the app |
| APA missing year | Status "Input needed"; question "What year was the source published?"; no citation invented | Re-runnable by opening the app |
| MLA 9 article | Status "Corrected"; pages rendered with an en dash | Re-runnable by opening the app |
| Out of scope | Status "Refused"; scope message shown | Re-runnable by opening the app |

A DOI link such as `https://doi.org/10.1109/5.771053` resolves through Crossref when online and is marked **Source check · verified**.

## 3. Known limitations

- Non-DOI web links are not extracted (browser CORS); paste the citation instead.
- One citation at a time; no reference-list mode.
- APA sentence-casing is a heuristic — proper nouns may be lower-cased wrongly and need review.
- Only journal articles and books are covered; videos, datasets, and legal sources are not.
- DOI verification confirms the DOI resolves, not that the source is trustworthy.
