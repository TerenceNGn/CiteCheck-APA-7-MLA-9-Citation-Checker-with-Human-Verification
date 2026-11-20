# Evidence for report section 4

This record supports section 4 of the final report. It records checks executed during preparation of the section, rather than assuming the older results in `docs/TEST_EVIDENCE.md` still describe the current implementation.

## Environment and method

- Check date: 18 November 2026, using the user's UTC+8 date context.
- Source revision: `54c0ec804d1a69c573cb14f0a58cf08d4eb0e4ed`.
- Source preparation: `git clone --no-hardlinks <local-project-path> <temporary-clone-path>`. This was a fresh **local** clone of committed HEAD; remote repository access was not tested. Existing untracked workspace files were excluded.
- Platform: Windows; Node.js `v24.22.0`.
- Browser: Brave in headless mode, reporting Chromium engine version `157.0.8103.79`.
- Browser automation: the already available Playwright installation in the workspace's untracked `demo-recording/node_modules` folder. Playwright was used only as a verification aid and is not an application dependency.
- Browser loading: `file://` pages from the temporary clone, with browser networking disabled.
- No application dependencies were installed; no application source was changed.
- No cached Crossref payloads or mocked API responses were used. Successful live Crossref resolution was **not** tested in this run. A separate live check on 2026-11-20 resolved `https://doi.org/10.1038/nature14539` through Crossref; see `docs/TEST_EVIDENCE.md`. The offline DOI case is an explicitly controlled network-failure check.

## Existing Node suite: actual console output

Command, executed against the temporary clone:

```sh
node tests.mjs
```

```text
PASS  APA: fixes author, title case, hyphen page range, doi prefix
PASS  APA: missing year asks instead of inventing
PASS  MLA: formats authors, quotes, labels and en dash
PASS  MLA: initials only triggers a request for the full first name
PASS  Refuses unsupported style
PASS  Refuses out-of-scope essay request
PASS  Refuses a full reference list
PASS  Structured fields: builds a citation without inventing

8 passed, 0 failed
```

Process exit code: `0`.

The test labelled "Refuses a full reference list" actually supplies `"A".repeat(601)` to the single-citation function. It checks the length guard, rather than the newer list-processing function. It must not be cited as evidence that the current application lacks reference-list mode.

## Existing browser suite: actual displayed result

Opened `tests.html` from the temporary clone. The page displayed:

```text
8 passed, 0 failed · 8 test cases, expected results fixed in advance
```

Observed failing table rows: `0`. These are the same eight cases as the Node suite, executed through a second environment; they are not sixteen distinct test cases.

## Additional observed application behavior

All six checks below used the actual cloned application with browser networking disabled. No JavaScript page errors were observed. The proper-noun check documented a product failure at revision `54c0ec8`; it has since been fixed and is retained here as evidence of the original behavior.

| Check | Input or condition | Expected behavior | Observed behavior |
|---|---|---|---|
| README APA example | Smith and Lee reference below | Four formatting corrections; DOI remains unverified | `Needs verification`; corrected citation matched the README |
| Missing year | Same authors and journal, without `(2020)` or the DOI | Ask for year; do not invent a citation | `Input needed`; asked "What year was the source published? Enter a four-digit year."; no corrected citation |
| Proper-noun capitalization | Synthetic title `Education in Hong Kong` | Preserve `Hong Kong` | **Failure at 54c0ec8:** changed it to `hong kong`; fixed in a later commit (the same input now keeps `Hong Kong`) |
| Non-DOI URL | `https://example.org/article` | Explain unsupported metadata extraction | `Link not supported yet`; advised pasting citation text or using a DOI link |
| Offline DOI link | `https://doi.org/10.1109/5.771053`; networking disabled | Show a network-resolution failure and a usable fallback | `Could not resolve DOI`; advised checking the network/DOI or pasting the full citation |
| Reference-list mode | README example and proper-noun example, one per line | Process two entries separately | Two result cards; overall `Needs verification`; summary began `2 citations checked` |

### README example: exact input and observed corrected text

Input, with APA 7 selected:

```text
Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001
```

Observed corrected text:

```text
Smith, J. A., & Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45–67. https://doi.org/10.1234/jsr.2020.001
```

Status: `Needs verification`. This synthetic citation demonstrates formatting, not the existence of a source. Pasting a full reference does not call Crossref to verify its DOI.

### Proper-noun failure: exact input and actual output

Input, with APA 7 selected:

```text
Smith, J. (2020). Education in Hong Kong. Education Review, 12(3), 45-67.
```

Expected title: `Education in Hong Kong`.

Observed corrected text:

```text
Smith, J. (2020). Education in hong kong. Education Review, 12(3), 45–67.
```

Observed core status: `corrected`; fixed rule IDs: `APA-T1`, `APA-P1`. This is a synthetic test entry, not a claim about a real publication. The same incorrect title was observed by invoking the core function and through the actual browser UI.

Cause: `looksTitleCase()` in `core.js` counts the capitalised words `Hong` and `Kong`, each longer than three characters. `toSentenceCase()` then lowercases those words. It preserves all-capital acronyms, but does not recognise proper nouns such as place names. The result is still classified as a correction.

**Status after the fix:** `toSentenceCase()` now also preserves acronyms, internal-capital words, and proper nouns from a built-in list (including `Hong` and `Kong`). The same input returns `Education in Hong Kong` with only APA-P1 marked as fixed. The fix was checked against both this title and the README example so that the intended sentence-casing still applies.

To reproduce from the repository root in PowerShell without extra packages:

```powershell
@'
import "./core.js";
const result = globalThis.CiteCheckCore.checkCitation({
  style: "APA7",
  raw: "Smith, J. (2020). Education in Hong Kong. Education Review, 12(3), 45-67."
});
console.log(result.correctedText);
'@ | node --input-type=module
```

Alternatively, paste the input into `index.html` and select APA 7. A further improvement — making uncertain title changes require user confirmation — is proposed but not implemented; the current fix preserves known proper nouns instead.

## Scope, setup caveats and evidence boundaries

- `README.md` documents the direct-browser route and the optional Python server. Direct-browser execution was verified; the optional Python server was not run because a working Python interpreter was unavailable in this environment. The existing Windows `python` alias failed, and the `py` launcher was not available. Python is unnecessary for the verified direct-browser route.
- PowerShell blocked `npm.ps1` under its execution policy. The documented `node tests.mjs` command worked without changing that policy or invoking npm.
- `app.js` sends a DOI to `https://api.crossref.org/works/…` only for a standalone DOI link (`https://doi.org/...`, `http://`, `dx.doi.org`, `doi:...`, or a bare `10....` DOI). Its request has an `Accept: application/json` header and no API credential. Full pasted citations, including entries in list mode, remain unverified by Crossref.
- `app.js` explicitly handles non-DOI links as unsupported; this run did not attempt arbitrary webpage extraction or establish a CORS failure for any particular website.
- `core.js` limits an individual raw citation to 600 characters. List mode splits on newlines and processes each line separately, so wrapped entries are not reliably preserved as a single reference.
- Journal articles and books are the documented intended source types. The rule set and parsing patterns cover a subset of APA 7 and MLA 9; the eight sample tests do not demonstrate full style-guide compliance or real-world accuracy.
- The fabrication heuristic treats common journal-name phrases, unverified DOIs, or missing source links as suspicious. These are not proof of AI generation, source fabrication, or source quality. No false-positive rate was measured in this check.
- At tested revision `54c0ec8`, `docs/TEST_EVIDENCE.md` incorrectly said there was no reference-list mode, whereas `core.js` and `app.js` implemented it and the browser check above observed it. Subsequent commit `50f3af1` removed that outdated limitation. This report section follows the implemented behavior.
- Useful implementation references: `core.js` (`looksTitleCase`, `toSentenceCase`, `checkCitation`, `checkReferenceList`); `app.js` (`resolveDoiLink`, `run`); `tests.mjs`; `tests.html`; `docs/STYLE_RULES.md`.

The report draft and this record were AI-assisted. Checks described here were executed by the coding assistant during preparation; this record does not attribute them to an unnamed team member or claim that the team has completed an independent review.
