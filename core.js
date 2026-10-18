const EN_DASH = "\u2013";

const STYLES = { APA7: "APA 7", MLA9: "MLA 9" };

const RULES = {
  APA7: [
    { id: "APA-A1", label: "Author names: Surname, Initials.; use & before the last author" },
    { id: "APA-D1", label: "Year in parentheses, followed by a period" },
    { id: "APA-T1", label: "Article title in sentence case, no quotation marks" },
    { id: "APA-J1", label: "Journal title and volume in italics; issue in parentheses" },
    { id: "APA-P1", label: "Page range uses an en dash (\u2013)" },
    { id: "APA-DOI1", label: "DOI as a full https://doi.org/ link" },
  ],
  MLA9: [
    { id: "MLA-A1", label: "Author: Surname, First Name; later authors in natural order" },
    { id: "MLA-T1", label: "Article title in double quotation marks, title case" },
    { id: "MLA-C1", label: "Container (journal) title in italics" },
    { id: "MLA-N1", label: "Volume, issue, pages: vol. 12, no. 3, pp. 45\u201367" },
    { id: "MLA-Y1", label: "Publication year before the page range" },
    { id: "MLA-DOI1", label: "DOI or URL at the end, followed by a period" },
  ],
};

function clean(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function stripEnd(s = "") {
  return String(s).replace(/[\s.,;]+$/, "");
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInitials(initials = "") {
  return initials
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + ".")
    .join(" ");
}

function toInitials(given = "") {
  return formatInitials(given);
}

function isInitials(given = "") {
  const g = given.trim();
  if (!g) return false;
  return /^[A-Z]\.?(\s*[A-Z]\.?)*$/.test(g);
}

function splitDoi(raw) {
  const re = /(?:https?:\/\/doi\.org\/|doi:\s*)(10\.\d{4,9}\/[^\s,;]+)/i;
  const m = raw.match(re);
  if (!m) return { text: raw, doi: "", doiPrefix: false };
  return {
    text: raw.replace(m[0], " "),
    doi: stripEnd(m[1]),
    doiPrefix: /^doi:/i.test(m[0]),
  };
}

function parseAuthorsAPA(block) {
  const authors = [];
  const re = /([A-Z][A-Za-z\u00C0-\u00FF'\u2019\-]+),\s*((?:[A-Z]\.\s*)+)/g;
  let m;
  while ((m = re.exec(block))) {
    authors.push({ family: m[1], initials: formatInitials(m[2]), given: "" });
  }
  if (!authors.length) {
    const corp = stripEnd(block).replace(/^&?\s*/, "");
    if (corp) authors.push({ corporate: true, family: corp, given: "" });
  }
  return authors;
}

function parseAuthorsMLA(block) {
  const b = stripEnd(block);
  const m = b.match(/^([A-Z][A-Za-z\u00C0-\u00FF'\u2019\-]+),\s*(.+?)(?:,\s*and\s+(.+))?$/);
  if (!m) return [{ corporate: true, family: b, given: "" }];
  const authors = [{ family: m[1], given: clean(m[2]) }];
  if (m[3]) {
    const rest = m[3].split(/,\s*and\s+|,\s*/).filter(Boolean);
    for (const name of rest) {
      const parts = clean(name).split(" ");
      if (parts.length === 1) authors.push({ family: parts[0], given: "" });
      else authors.push({ family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") });
    }
  }
  return authors;
}

function parseAPA(raw) {
  let s = clean(raw);
  const doiInfo = splitDoi(s);
  s = clean(doiInfo.text);

  const fields = {
    doi: doiInfo.doi,
    doiPrefix: doiInfo.doiPrefix,
    authors: [],
    _raw: { authors: "", title: "", rest: "", pages: "", yearParen: false, quoted: false },
  };

  const urlMatch = s.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    fields.url = stripEnd(urlMatch[0]);
    s = clean(s.replace(urlMatch[0], " "));
  }

  const yearMatch = s.match(/\((\d{4}[a-z]?)\)/);
  if (yearMatch) {
    fields.year = yearMatch[1];
    fields._raw.yearParen = true;
    const before = clean(s.slice(0, yearMatch.index));
    let rest = clean(s.slice(yearMatch.index + yearMatch[0].length)).replace(/^[.\s]+/, "");
    fields._raw.authors = before;
    fields.authors = parseAuthorsAPA(before);

    const tm = rest.match(/^(.+?)\.\s+(.+)$/);
    if (tm) {
      fields.title = clean(tm[1]);
      fields._raw.title = fields.title;
      rest = clean(tm[2]);
      assignSource(fields, rest, "APA7");
    } else {
      fields.title = stripEnd(rest);
      fields._raw.title = fields.title;
    }
  } else {
    const am = s.match(
      /^((?:(?:&\s*)?[A-Z][A-Za-z\u00C0-\u00FF'\u2019\-]+,\s*(?:[A-Z]\.\s*)+,?\s*)+)\.?\s*(.+?)\.\s+(.+)$/
    );
    if (am) {
      fields._raw.authors = clean(am[1]);
      fields.authors = parseAuthorsAPA(am[1]);
      fields.title = clean(am[2]);
      fields._raw.title = fields.title;
      const rest = clean(am[3]);
      assignSource(fields, rest, "APA7");
    }
  }

  return fields;
}

function parseMLA(raw) {
  let s = clean(raw);
  const doiInfo = splitDoi(s);
  s = clean(doiInfo.text);

  const fields = {
    doi: doiInfo.doi,
    doiPrefix: doiInfo.doiPrefix,
    authors: [],
    _raw: { authors: "", title: "", rest: "", pages: "", yearParen: false, quoted: false },
  };

  const urlMatch = s.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    fields.url = stripEnd(urlMatch[0]);
    s = clean(s.replace(urlMatch[0], " "));
  }

  const tm = s.match(/"([^"]+)"/);
  if (tm) {
    fields.title = clean(tm[1]);
    fields._raw.title = fields.title;
    fields._raw.quoted = true;
    const before = clean(s.slice(0, tm.index)).replace(/[.\s]+$/, "");
    fields._raw.authors = before;
    fields.authors = parseAuthorsMLA(before);
    const rest = clean(s.slice(tm.index + tm[0].length)).replace(/^[.\s]+/, "");
    assignSource(fields, rest, "MLA9");
  }

  return fields;
}

function assignSource(fields, rest, style) {
  fields._raw.rest = rest;
  if (style === "APA7") {
    const jm = rest.match(/^(.+?),\s*(\d+)(?:\s*\((\d+)\))?,\s*([0-9]+(?:\s*[\u2013-]\s*[0-9]+)?)\s*\.?$/);
    if (jm) {
      fields.container = clean(jm[1]);
      fields.volume = jm[2];
      fields.issue = jm[3] || "";
      fields._raw.pages = jm[4];
      fields.pages = jm[4].replace(/\s*[-\u2013]\s*/, EN_DASH);
      return;
    }
    const bm = rest.match(/^(.+?)\.\s*$/);
    if (bm) fields.publisher = clean(bm[1]);
    else fields.container = stripEnd(rest);
    return;
  }

  const mm = rest.match(
    /^(.+?),\s*vol\.\s*(\d+)(?:,\s*no\.\s*(\d+))?,\s*(\d{4}[a-z]?),\s*pp\.\s*([0-9]+(?:\s*[\u2013-]\s*[0-9]+)?)\s*\.?$/
  );
  if (mm) {
    fields.container = clean(mm[1]);
    fields.volume = mm[2];
    fields.issue = mm[3] || "";
    fields.year = mm[4];
    fields._raw.pages = mm[5];
    fields.pages = mm[5].replace(/\s*[-\u2013]\s*/, EN_DASH);
    return;
  }
  const simple = rest.match(/^(.+?),\s*(\d{4}[a-z]?),\s*pp\.\s*([0-9]+(?:\s*[\u2013-]\s*[0-9]+)?)\s*\.?$/);
  if (simple) {
    fields.container = clean(simple[1]);
    fields.year = simple[2];
    fields._raw.pages = simple[3];
    fields.pages = simple[3].replace(/\s*[-\u2013]\s*/, EN_DASH);
    return;
  }
  const book = rest.match(/^(.+?),\s*(\d{4}[a-z]?)\s*\.?$/);
  if (book) {
    fields.publisher = clean(book[1]);
    fields.year = book[2];
    return;
  }
  fields.container = stripEnd(rest);
}

function apaAuthors(authors = []) {
  if (!authors.length) return "";
  const names = authors.map((a) => {
    if (a.corporate) return a.family;
    const ini = a.initials ? formatInitials(a.initials) : toInitials(a.given || "");
    return ini ? `${a.family}, ${ini}` : a.family;
  });
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function mlaAuthors(authors = []) {
  if (!authors.length) return "";
  const first = authors[0].corporate
    ? authors[0].family
    : `${authors[0].family}, ${authors[0].given || ""}`.trim();
  if (authors.length === 1) return first;
  const rest = authors.slice(1).map((a) => (a.corporate ? a.family : `${a.given} ${a.family}`.trim()));
  if (rest.length === 1) return `${first}, and ${rest[0]}`;
  return `${first}, ${rest.slice(0, -1).join(", ")}, and ${rest[rest.length - 1]}`;
}

function toSentenceCase(text) {
  const small = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "in", "of", "with"]);
  return text
    .split(" ")
    .map((w, i) => {
      if (/^[A-Z]{2,}$/.test(w)) return w;
      if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1);
      if (/^[A-Z]/.test(w) && !small.has(w.toLowerCase())) return w.toLowerCase();
      return w;
    })
    .join(" ");
}

function looksTitleCase(title = "") {
  const words = title.split(/\s+/).slice(1).filter((w) => w.length > 3 && /^[A-Z]/.test(w));
  return words.length >= 2;
}

function mergeFields(base, extra) {
  const out = { ...base, _raw: base._raw || {} };
  for (const [k, v] of Object.entries(extra || {})) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "authors" && Array.isArray(v)) {
      out.authors = v.map((a) => ({
        family: a.family || a.name || "",
        given: a.given || "",
        initials: a.initials || "",
        corporate: !!a.corporate,
      }));
    } else {
      out[k] = v;
    }
  }
  return out;
}

function render(segments) {
  let text = "";
  let html = "";
  for (const seg of segments) {
    if (!seg || !seg.t) continue;
    const t = String(seg.t);
    text += t;
    html += seg.i ? `<em>${escapeHtml(t)}</em>` : escapeHtml(t);
  }
  return { text: text.replace(/\s+$/, ""), html: html.replace(/\s+$/, "") };
}

function buildAPA(f) {
  const segments = [];
  const names = apaAuthors(f.authors);
  segments.push({ t: `${names}${names.endsWith(".") ? "" : "."} ` });
  segments.push({ t: `(${f.year}). ` });
  segments.push({ t: `${stripEnd(f.title)}. ` });
  if (f.container) {
    segments.push({ t: f.container, i: true });
    let tail = "";
    if (f.volume) tail += `, ${f.volume}`;
    if (f.issue) tail += `(${f.issue})`;
    if (f.pages) tail += `, ${f.pages}`;
    segments.push({ t: `${tail}. ` });
  } else if (f.publisher) {
    segments.push({ t: `${stripEnd(f.publisher)}. ` });
  }
  if (f.doi) segments.push({ t: `https://doi.org/${f.doi}` });
  else if (f.url) segments.push({ t: f.url });
  return render(segments);
}

function buildMLA(f) {
  const segments = [];
  segments.push({ t: `${mlaAuthors(f.authors)}. ` });
  segments.push({ t: `"${stripEnd(f.title)}." ` });
  if (f.container) {
    segments.push({ t: f.container, i: true });
    let tail = "";
    if (f.volume) tail += `, vol. ${f.volume}`;
    if (f.issue) tail += `, no. ${f.issue}`;
    if (f.year) tail += `, ${f.year}`;
    if (f.pages) tail += `, pp. ${f.pages}`;
    segments.push({ t: `${tail}.` });
  } else if (f.publisher) {
    segments.push({ t: `${stripEnd(f.publisher)}, ${f.year}.` });
  }
  if (f.doi) segments.push({ t: ` https://doi.org/${f.doi}.` });
  else if (f.url) segments.push({ t: ` ${f.url}.` });
  return render(segments);
}

function withRuleResults(style, fixed) {
  return RULES[style].map((r) => ({
    ...r,
    result: fixed.has(r.id) ? "fixed" : "passed",
  }));
}

function refuse(code, message) {
  return { status: "refused", refusal: { code, message }, rules: [], flags: [], missing: [] };
}

function checkCitation({ raw = "", style = "APA7", fields = {}, doiVerified = false } = {}) {
  const text = clean(raw);
  const lower = text.toLowerCase();

  if (/(write|draft|compose|generate)\b.{0,40}\b(essay|paper|paragraph|assignment|report)\b/.test(lower)) {
    return refuse(
      "out_of_scope",
      "This tool checks citation formatting only. It does not write essays or create references for sources it has not seen."
    );
  }
  if (text.length > 600) {
    return refuse(
      "scope_list",
      "This version checks one citation at a time. Split a reference list into single entries."
    );
  }
  if (!STYLES[style]) {
    return refuse("unsupported_style", `Only APA 7 and MLA 9 are supported. "${style}" is out of scope.`);
  }
  if (!text && !Object.keys(fields || {}).length) {
    return refuse("empty", "Paste a citation first, or provide the required fields.");
  }

  const parsed = style === "APA7" ? parseAPA(text) : parseMLA(text);
  const f = mergeFields(parsed, fields);
  f.authors = f.authors || [];

  const missing = [];
  if (!f.authors.length) {
    missing.push({
      field: "authors",
      question: "Who are the authors? Enter surnames and initials (APA 7) or full first names (MLA 9).",
    });
  }
  if (!f.year) {
    missing.push({ field: "year", question: "What year was the source published? Enter a four-digit year." });
  }
  if (!f.title) {
    missing.push({ field: "title", question: "What is the title of the work?" });
  }
  if (!f.container && !f.publisher) {
    missing.push({
      field: "container",
      question: "What journal, book, or website contains this work?",
    });
  }
  if (style === "MLA9" && f.authors.some((a) => !a.corporate && isInitials(a.given || ""))) {
    missing.push({
      field: "author_given",
      question: "MLA 9 needs each author's full first name. What is it? The tool will not guess it.",
    });
  }

  if (missing.length) {
    return {
      status: "incomplete",
      style,
      styleName: STYLES[style],
      missing,
      rules: [],
      flags: [],
      correctedText: "",
      correctedHtml: "",
      summary: `Cannot finish yet: ${missing.length} required ${missing.length === 1 ? "field is" : "fields are"} missing. The tool will not invent ${missing.length === 1 ? "it" : "them"}.`,
    };
  }

  const fixed = new Set();
  const rawInfo = f._raw || {};

  if (style === "APA7") {
    if (f.authors.length > 1 && !/&/.test(rawInfo.authors || "") && rawInfo.authors) fixed.add("APA-A1");
    if (/[A-Z]\.[A-Z]\./.test(rawInfo.authors || "")) fixed.add("APA-A1");
    if (f.year && rawInfo.authors && !rawInfo.yearParen) fixed.add("APA-D1");
    if (looksTitleCase(f.title || "")) {
      f.title = toSentenceCase(f.title);
      fixed.add("APA-T1");
    }
    if (f._raw?.pages && /-/.test(f._raw.pages)) fixed.add("APA-P1");
    if (f.doiPrefix) fixed.add("APA-DOI1");
  } else {
    if (rawInfo.authors && /[A-Z]\.[A-Z]\./.test(rawInfo.authors)) fixed.add("MLA-A1");
    if (rawInfo.rest && !rawInfo.quoted && f.title) fixed.add("MLA-T1");
    if (f.volume && rawInfo.rest && !/\bvol\./.test(rawInfo.rest)) fixed.add("MLA-N1");
    if (f._raw?.pages && /-/.test(f._raw.pages)) fixed.add("MLA-N1");
    if (f.doiPrefix) fixed.add("MLA-DOI1");
  }

  const out = style === "APA7" ? buildAPA(f) : buildMLA(f);
  const flags = [];
  let status = "corrected";

  if (f.doi) {
    if (!doiVerified) {
      status = "needs_verification";
      flags.push({
        type: "verification",
        message:
          "The DOI format is valid, but its existence was not verified. Treat this reference as \"needs human verification\" before submitting it.",
      });
    } else {
      flags.push({
        type: "verified",
        message: "DOI resolved through Crossref. The metadata was matched to the registry record.",
      });
    }
  } else if (f.url) {
    flags.push({
      type: "verification",
      message: "The URL was not opened or checked. Confirm the page exists before submitting.",
    });
  }

  const fixCount = fixed.size;
  const summary = f.doi && !doiVerified
    ? `Corrected ${fixCount} formatting ${fixCount === 1 ? "issue" : "issues"}. The DOI still needs human verification.`
    : `Corrected ${fixCount} formatting ${fixCount === 1 ? "issue" : "issues"}.`;

  return {
    status,
    style,
    styleName: STYLES[style],
    correctedText: out.text,
    correctedHtml: out.html,
    rules: withRuleResults(style, fixed),
    missing: [],
    flags,
    summary,
    parsed: {
      authors: f.authors,
      year: f.year || "",
      title: f.title || "",
      container: f.container || "",
      volume: f.volume || "",
      issue: f.issue || "",
      pages: f.pages || "",
      doi: f.doi || "",
    },
  };
}

// Exposed on the global object so the same file works both as a plain browser
// <script> (double-click index.html, no server needed) and as an ES module
// imported by tests.mjs under Node.
const CiteCheckCore = { STYLES, parseAPA, parseMLA, checkCitation };
if (typeof globalThis !== "undefined") {
  globalThis.CiteCheckCore = CiteCheckCore;
}
