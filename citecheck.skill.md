# CiteCheck Agent Skill

Skill: citecheck
Version: 1.0.0
Description: Checks APA 7 and MLA 9 citation formatting. Corrects what it can, asks for missing fields instead of inventing them, flags unverifiable DOIs, and detects likely AI-generated references.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| citation | string | Yes | One citation, or several citations separated by newlines |
| style | string | Yes | "APA7" or "MLA9" |

## Output

Returns a JSON object with:

- `status`: "corrected", "needs_verification", "incomplete", or "refused"
- `correctedText`: the corrected citation string (empty if incomplete/refused)
- `rules`: array of { id, label, result } — which style rules were applied
- `missing`: array of { field, question } — required fields the user must supply
- `flags`: array of verification/AI flags
- `likelyAI`: boolean — true if the reference shows signs of AI generation
- `summary`: human-readable summary

## Examples

### Single citation (APA 7)

Input:
```
citation: "Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001"
style: "APA7"
```

Output:
```json
{
  "status": "needs_verification",
  "correctedText": "Smith, J. A., \& Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45\u201367. https://doi.org/10.1234/jsr.2020.001",
  "rules": [
    {"id": "APA-A1", "label": "Author names: Surname, Initials...", "result": "fixed"},
    {"id": "APA-T1", "label": "Article title in sentence case...", "result": "fixed"},
    {"id": "APA-P1", "label": "Page range uses an en dash...", "result": "fixed"},
    {"id": "APA-DOI1", "label": "DOI as a full https://doi.org/ link", "result": "fixed"}
  ],
  "flags": [
    {"type": "verification", "message": "The DOI format is valid, but its existence was not verified..."}
  ],
  "likelyAI": false,
  "summary": "Corrected 4 formatting issues. The DOI still needs human verification."
}
```

### Multiple citations (reference list)

Input:
```
citation: "Smith, J. A. (2020). Title. Journal, 1(2), 3-4.\nDoe, J. (2019). Another title. Journal, 5(1), 10-20."
style: "APA7"
```

Output: A list result with `items` array, each containing `{ input, result }`.

## Behavior

- Never invents missing fields; asks the user instead
- Refuses unsupported styles (only APA 7 and MLA 9)
- Refuses out-of-scope requests (essay writing, reference lists over 600 chars)
- Flags unverifiable DOIs as "needs human verification"
- Flags likely AI-generated references with a verification checklist
- Works offline (no API key needed); DOI verification calls Crossref when online
