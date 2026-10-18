# CiteCheck — APA 7 / MLA 9 citation checker

CiteCheck checks the **formatting** of one reference at a time against APA 7 or MLA 9 rules.
It corrects what it can, shows exactly which style rule it applied, asks for missing required
fields instead of inventing them, and flags unverifiable DOIs as *"needs human verification"*.
It is a checker, not a citation generator.

![CiteCheck screenshot](assets/screenshot.png)

AILT9019 · AI Literacy II · group project

## Quick start

No build step and no API key are needed. The app is plain HTML/CSS/JS.

| Option | How | Works for |
|--------|-----|-----------|
| GitHub Pages | Open the deployed URL (enable Pages in Settings → Pages → main branch) | Anyone, no install |
| Windows local | Double-click `start-server.bat`, then open <http://localhost:8000> | Offline rule checking |
| macOS/Linux local | `./start-server.sh`, then open <http://localhost:8000> | Offline rule checking |
| Manual server | `python -m http.server 8000` in this folder, then open <http://localhost:8000> | Any OS |

> Note: opening `index.html` directly with a double-click will **not** work — browsers block
> module scripts on `file://` pages. Use one of the options above.

## Example input and expected output

Paste this into the box, keep **APA 7** selected, and press **Check citation**:

```
Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001
```

Expected output — corrected citation:

```
Smith, J. A., & Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45–67. https://doi.org/10.1234/jsr.2020.001
```

with status **"Needs verification"** (the DOI format is valid but not verified) and four rules
marked **fixed**: APA-A1 (initials spacing), APA-T1 (title case), APA-P1 (en dash), APA-DOI1
(`doi:` prefix → full link).

Full demo cases, including the missing-field and refusal paths: see [`docs/TEST_EVIDENCE.md`](docs/TEST_EVIDENCE.md).

## What it does

- Parses a pasted citation and checks it against the APA 7 / MLA 9 rule set
  ([`docs/STYLE_RULES.md`](docs/STYLE_RULES.md))
- Outputs the corrected citation **plus the rule IDs** that were applied (fixed / ok per rule)
- Asks an explicit question for any missing required field — it never invents data
- Refuses clearly: unsupported styles, out-of-scope requests ("write my essay"), reference lists
- Resolves DOI links (`https://doi.org/...`) through the Crossref API and marks them verified
- Flags unverified DOIs and unchecked URLs as *"needs human verification"*

## How to check its result

1. Open the app (see Quick start).
2. Click an example chip, or paste your own citation, pick APA 7 / MLA 9, press **Check citation**.
3. Compare the corrected citation with the input; every change is explained by a rule ID in
   "Rules applied".
4. Run the automated tests: `node tests.mjs` — expected: **8 passed, 0 failed**
   ([`docs/TEST_EVIDENCE.md`](docs/TEST_EVIDENCE.md) lists every input, expected and actual result).

## Known limitations

Honest scope — see [`docs/TEST_EVIDENCE.md`](docs/TEST_EVIDENCE.md) for the full list:

- Non-DOI web links are not extracted yet (browser CORS) — the next verifiable step
- One citation at a time; no reference-list mode
- APA sentence-casing is a heuristic; proper nouns may need manual review
- Journal articles and books only; no videos, datasets, or legal sources

## Roadmap

1. Non-DOI link metadata extraction (needs a small server-side helper to bypass CORS)
2. "Likely AI-generated" flag with a verification checklist
3. Small reference-list mode (one citation per line)
4. Ship the checker as a skill file for agent environments

## Project structure

```
core.js                  parsing + rule engine (no DOM, testable)
app.js                   UI logic, Crossref DOI resolution
index.html / styles.css  single-page interface
tests.mjs                automated tests (node tests.mjs)
start-server.bat/.sh     one-click local server
docs/                    test evidence + style-rule mapping
assets/                  screenshot
```
