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

Last run on 2026-11-20: **8 passed, 0 failed** (verified both in the browser via `tests.html` and
on Node v22.12.0 via `node tests.mjs`).

| # | Test | Input (summary) | Expected | Actual |
|---|------|-----------------|----------|--------|
| 1 | APA error correction | `Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001` | Corrected string with spaced initials, sentence case title, en dash pages, `https://doi.org/` link; status `needs_verification` | Pass |
| 2 | APA missing year | Same citation without `(2020).` | Status `incomplete`, asks for the year, outputs no citation | Pass |
| 3 | MLA formatting | `Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.` | Corrected string with en dash; status `corrected`; rule MLA-N1 `fixed` | Pass |
| 4 | MLA initials | Author written as `Smith, J. A.` | Status `incomplete`, asks for the full first name | Pass |
| 5 | Unsupported style | `style: "Chicago"` | Status `refused`, code `unsupported_style` | Pass |
| 6 | Out of scope | `Write my essay about sleep and memory.` | Status `refused`, code `out_of_scope` | Pass |
| 7 | Oversized input | Text longer than 600 characters | Status `refused`, code `scope_list` | Pass |
| 8 | Structured fields | Authors/year/title/… as fields, no raw text | Correct APA citation assembled from fields only | Pass |

## 2. Manual browser checks (the demo path)

Open the app, paste each citation below (the same inputs as the automated tests), and compare
with the expected result. The result panel shows the pasted text with every changed part
highlighted in yellow, followed by the corrected citation.

| Input (paste as-is) | Expected | Evidence |
|---------|----------|----------|
| `Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001` (APA 7) | Status "Needs verification"; corrected citation shown; APA-A1, APA-T1, APA-P1, APA-DOI1 marked **fixed**; `J.A.`, title words, `45-67.`, `doi:…` highlighted in the input | Re-runnable by opening the app |
| `Smith, J. A., & Lee, K. The effects of sleep on memory. Journal of Sleep Research, 12(3), 45–67.` (APA 7) | Status "Input needed"; question "What year was the source published?"; no citation invented | Re-runnable by opening the app |
| `Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.` (MLA 9) | Status "Corrected"; pages rendered with an en dash | Re-runnable by opening the app |
| `Write my essay about sleep and memory.` (APA 7) | Status "Refused"; scope message shown | Re-runnable by opening the app |
| `Smith, J. (2020). Education in Hong Kong. Education Review, 12(3), 45-67.` (APA 7) | Status "Corrected"; "Hong Kong" preserved; only APA-P1 (en dash) marked **fixed** | Re-runnable by opening the app |
| `doi:10.1038/nature14539` or bare `10.1038/nature14539` (APA 7) | Status "Corrected"; "DOI resolved through Crossref"; citation rebuilt from the registry record | Re-runnable with a network connection |
| Two citations, one per line (APA 7) | Two result cards; overall status "Needs verification"; summary begins "2 citations checked" | Re-runnable by opening the app |

A whole-input DOI link in any of these forms — `https://doi.org/10.1038/nature14539`,
`http://doi.org/...`, `https://dx.doi.org/...`, `doi:10.1038/nature14539`, or bare
`10.1038/nature14539` — resolves through Crossref when online and is marked **Source check · verified**
(LeCun, Bengio & Hinton, *Deep learning*, Nature, 2015). A link whose DOI does not exist, such as
`https://doi.org/10.1109/5.771053`, shows **Could not resolve DOI** and is never marked verified.

## 3. Known limitations

- Non-DOI web links are not resolved (browser CORS); a bare web link shows "Link not supported yet" and the citation text must be pasted instead.
- One citation per check; several citations are handled by the separate reference-list mode (one per line).
- APA sentence-casing preserves acronyms, internal-capital words, and common proper nouns (for example "Hong Kong"); an unlisted proper noun may still be lower-cased wrongly.
- Only journal articles and books are covered by the rules; videos, datasets, and legal sources are passed through unchecked, not refused.
- DOI verification confirms the DOI resolves, not that the source is trustworthy.
