# Test evidence

Reproduce everything in this file from a clean clone:

```bash
# Option A — no installation at all:
#   double-click tests.html  → automated test results in the browser
#   double-click index.html  → the checker itself

# Option B — with Node.js:
node tests.mjs                      # automated tests (8, all passing)
```

## 1. Automated tests (`tests.html` in a browser, or `node tests.mjs`)

Actual result on 2026-10-18: **8 passed, 0 failed** (verified both in the browser via
`tests.html` and on Node 22 via `node tests.mjs`).

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

Open the app, paste each citation below (the same inputs as the automated tests), and compare
with the expected result. The result panel shows the pasted text with every changed part
highlighted in yellow, followed by the corrected citation.

| Input (paste as-is) | Expected | Evidence |
|---------|----------|----------|
| `Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001` (APA 7) | Status "Needs verification"; corrected citation shown; APA-A1, APA-T1, APA-P1, APA-DOI1 marked **fixed**; `J.A.`, title words, `45-67.`, `doi:…` highlighted in the input | Screenshot `assets/screenshot.png`; re-runnable by opening the app |
| `Smith, J. A., & Lee, K. The effects of sleep on memory. Journal of Sleep Research, 12(3), 45–67.` (APA 7) | Status "Input needed"; question "What year was the source published?"; no citation invented | Re-runnable by opening the app |
| `Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.` (MLA 9) | Status "Corrected"; pages rendered with an en dash | Re-runnable by opening the app |
| `Write my essay about sleep and memory.` (APA 7) | Status "Refused"; scope message shown | Re-runnable by opening the app |

A DOI link such as `https://doi.org/10.1109/5.771053` resolves through Crossref when online and is marked **Source check · verified**.

## 3. Known limitations

- Non-DOI web links are not extracted (browser CORS); paste the citation instead.
- APA sentence-casing is a heuristic — proper nouns may be lower-cased wrongly and need review.
- Only journal articles and books are covered; videos, datasets, and legal sources are not.
- DOI verification confirms the DOI resolves, not that the source is trustworthy.
