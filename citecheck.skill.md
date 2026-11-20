# CiteCheck Agent Skill

Skill: citecheck
Version: 0.1.0
Description: Checks APA 7 and MLA 9 citation formatting. Corrects what it can, asks for missing fields instead of inventing them, flags unverifiable DOIs, and detects likely AI-generated references.

## Entry points

Two functions are exported from `core.js`:

| Function | Use for | Multi-line input |
|---|---|---|
| `checkCitation({ raw, style })` | one citation | Refused with code `multiple_entries`; use `checkReferenceList` instead |
| `checkReferenceList({ raw, style })` | several citations, one per line | Returns `{ items: [{ input, result }] }` |

## Input (`checkCitation`)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| raw | string | Yes | One citation, or a single DOI link: `https://doi.org/10.1038/nature14539`, `http://`, `dx.doi.org`, `doi:10.1038/nature14539`, or bare `10.1038/nature14539` |
| style | string | Yes | "APA7" or "MLA9" |

A DOI written inside a citation (for example `doi:10.1234/jsr.2020.001`) is formatted but not resolved. Only a whole-input DOI link in one of the forms above is resolved through Crossref.

## Output

`checkCitation` returns an object with:

- `status`: "corrected", "needs_verification", "incomplete", or "refused"
- `correctedText`: the corrected citation string (empty if incomplete/refused)
- `correctedHtml`: the same string with journal titles marked as italics (and, for APA 7, volume numbers too)
- `rules`: array of { id, label, result } — which style rules were applied ("fixed" or "passed")
- `missing`: array of { field, question } — required fields the user must supply
- `flags`: array of verification/AI flags
- `likelyAI`: boolean — true if the reference shows signs of AI generation
- `aiSignals`: array of signal codes behind `likelyAI`
- `summary`: human-readable summary
- `style`, `styleName`, `parsed`

`checkReferenceList` returns `status`, `items`, `summary`, and `likelyAI`.

## Examples

### Single citation (APA 7)

Input:
```
raw: "Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001"
style: "APA7"
```

Output (abridged; the full object also contains `style`, `styleName`, `correctedHtml`, and `parsed`):
```json
{
  "status": "needs_verification",
  "correctedText": "Smith, J. A., & Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45–67. https://doi.org/10.1234/jsr.2020.001",
  "rules": [
    {"id": "APA-A1", "label": "Author names: Surname, Initials.; use & before the last author", "result": "fixed"},
    {"id": "APA-D1", "label": "Year in parentheses, followed by a period", "result": "passed"},
    {"id": "APA-T1", "label": "Article title in sentence case, no quotation marks", "result": "fixed"},
    {"id": "APA-J1", "label": "Journal title and volume in italics; issue in parentheses", "result": "passed"},
    {"id": "APA-P1", "label": "Page range uses an en dash (–)", "result": "fixed"},
    {"id": "APA-DOI1", "label": "DOI as a full https://doi.org/ link", "result": "fixed"}
  ],
  "flags": [
    {"type": "verification", "message": "The DOI format is valid, but its existence was not verified. Treat this reference as \"needs human verification\" before submitting it."},
    {"type": "ai_flag", "message": "This reference shows signs of being AI-generated or fabricated (unverifiable DOI, generic journal name, or no source link). Treat it as \"needs human verification\" before submitting.", "signals": ["unverified_doi", "unverifiable_reference"]}
  ],
  "likelyAI": true,
  "summary": "Corrected 4 formatting issues. The DOI still needs human verification."
}
```

The `10.1234/jsr.2020.001` DOI is a documentation example and does not resolve; use it to demonstrate the `needs_verification` state.

### Multiple citations (reference list)

Call `checkReferenceList` (not `checkCitation`):

```
raw: "Smith, J. A. (2020). Title. Journal, 1(2), 3-4.\nDoe, J. (2019). Another title. Journal, 5(1), 10-20."
style: "APA7"
```

Output: a list result with an `items` array, each containing `{ input, result }`, plus an overall `status` and `summary`.

## Behavior

- Never invents missing fields; asks the user instead
- Refuses unsupported styles (only APA 7 and MLA 9)
- Refuses out-of-scope requests (essay writing), single-line input over 600 characters, and multi-line input passed to `checkCitation`
- Flags unverifiable DOIs as "needs human verification"
- Flags likely AI-generated references with a verification checklist
- Works offline (no API key needed); DOI verification calls Crossref when online, and only for a whole-input DOI link