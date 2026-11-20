# Style rules implemented

Each rule the checker enforces, its ID, and where the requirement comes from.
The mapping is to the official guides:

- **APA 7** — *Publication Manual of the American Psychological Association*, 7th edition (2020), Chapter 9 (reference list) and Chapter 10 (reference examples).
- **MLA 9** — *MLA Handbook*, 9th edition (2021), Part 2 (details of the works-cited list).

If any rule below conflicts with the official guides, the guides win — report it as a bug.

## APA 7

| ID | Rule | Requirement |
|----|------|-------------|
| APA-A1 | Author names | `Surname, Initials.` — each initial followed by a period and a space (e.g. `Smith, J. A.`); multiple authors separated by commas with `&` before the last |
| APA-D1 | Year | In parentheses after the authors, followed by a period: `(2020).` |
| APA-T1 | Article title | Sentence case, no quotation marks, ends with a period; acronyms, internal-capital words, and common proper nouns (for example `Hong Kong`) keep their capitalization |
| APA-J1 | Journal / volume | Journal title and volume number in *italics*, title case; issue in parentheses, not italic: *Journal of Sleep Research*, 12(3) |
| APA-P1 | Page range | En dash between first and last page: `45–67` |
| APA-DOI1 | DOI | Full URL form `https://doi.org/10.xxxx/xxxx`; never the `doi:` prefix |

## MLA 9

| ID | Rule | Requirement |
|----|------|-------------|
| MLA-A1 | Author names | First author inverted (`Surname, First Name`); later authors in natural order, joined by `and` |
| MLA-T1 | Article title | In double quotation marks, title case, with the period inside the closing quote |
| MLA-C1 | Container | Journal title in *italics*, followed by a comma |
| MLA-N1 | Volume / issue / pages | `vol. 12, no. 3, pp. 45–67` (en dash) |
| MLA-Y1 | Year | Four-digit year, placed before the page range |
| MLA-DOI1 | DOI / URL | At the end of the entry, followed by a period |

## Scope of these rules

Implemented for **journal articles** and **books**. Other source types are not validated: their
text is passed through as-is, with no rule reported as failed. The tool never invents a field it was
not given.
