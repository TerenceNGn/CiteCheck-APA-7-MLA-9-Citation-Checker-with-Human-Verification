const { checkCitation: runCheck, checkReferenceList: runList } = globalThis.CiteCheckCore;

const state = { style: "APA7", busy: false };

const citationEl = document.getElementById("citation");
const resultEl = document.getElementById("result");
const checkBtn = document.getElementById("check");

function setStyle(style) {
  state.style = style;
  document.querySelectorAll(".seg").forEach((btn) => {
    const active = btn.dataset.style === style;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tokenize(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean);
}

function highlightErrors(original, corrected) {
  const a = tokenize(original);
  const b = tokenize(corrected);
  if (!a.length || !b.length) return { html: escapeHtml(original), marked: false };

  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const kept = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      kept[i] = true;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  let html = "";
  let buffer = [];
  let marked = false;
  const flush = () => {
    if (!buffer.length) return;
    html += `<mark class="hl">${buffer.map(escapeHtml).join(" ")}</mark>`;
    buffer = [];
  };

  for (let k = 0; k < n; k += 1) {
    if (kept[k]) {
      flush();
      html += `${escapeHtml(a[k])} `;
    } else {
      marked = true;
      buffer.push(a[k]);
    }
  }
  flush();

  return { html: html.trim(), marked };
}

function statusView(status) {
  switch (status) {
    case "corrected":
      return { cls: "ok", label: "Corrected" };
    case "needs_verification":
      return { cls: "warn", label: "Needs verification" };
    case "incomplete":
      return { cls: "warn", label: "Input needed" };
    default:
      return { cls: "bad", label: "Refused" };
  }
}

function renderRules(rules) {
  if (!rules.length) return "";
  const items = rules
    .map(
      (r) => `
      <li>
        <span class="rule-id">${escapeHtml(r.id)}</span>
        <span>${escapeHtml(r.label)}</span>
        <span class="tag ${r.result}">${r.result === "fixed" ? "fixed" : "ok"}</span>
      </li>`
    )
    .join("");
  return `
    <div class="block">
      <p class="block-title">Rules applied</p>
      <ul class="rules">${items}</ul>
    </div>`;
}

function renderFlags(flags) {
  if (!flags.length) return "";
  return flags
    .map(
      (f) => `
    <div class="block">
      <p class="block-title">${f.type === "verified" ? "Source check" : f.type === "ai_flag" ? "AI check" : "Verification"}</p>
      <div class="notice ${f.type === "verified" ? "ok" : "warn"}"><p>${escapeHtml(f.message)}</p></div>
      ${f.signals && f.signals.length ? `<p class="empty-state">Signals: ${escapeHtml(f.signals.join(", "))}</p>` : ""}
    </div>`
    )
    .join("");
}

function renderMissing(missing) {
  if (!missing.length) return "";
  return `
    <div class="block">
      <p class="block-title">Required fields</p>
      <div class="notice warn">
        <p>The tool will not invent or guess this information.</p>
      </div>
      <ul class="questions">
        ${missing.map((m) => `<li>${escapeHtml(m.question)}</li>`).join("")}
      </ul>
    </div>`;
}

function renderSingleResult(r, sourceText = "") {
  if (r.status === "refused") {
    return `
      <span class="status bad">Refused</span>
      <p class="summary">The request is outside what this checker does.</p>
      <div class="notice bad"><p>${escapeHtml(r.refusal.message)}</p></div>
      <div class="block">
        <p class="block-title">Scope</p>
        <p class="empty-state">Supported: APA 7 and MLA 9, one citation at a time, formatting checks only.</p>
      </div>`;
  }

  const view = statusView(r.status);
  const parts = [];

  parts.push(`<span class="status ${view.cls}">${view.label}</span>`);
  parts.push(`<p class="summary">${escapeHtml(r.summary)}</p>`);

  if (sourceText && r.correctedText) {
    const diff = highlightErrors(sourceText, r.correctedText);
    parts.push(`
      <div class="block">
        <p class="block-title">Your input · issues highlighted</p>
        <p class="citation hl-text">${diff.html}</p>
        ${
          diff.marked
            ? `<p class="hl-legend"><span class="hl-sample">wrong</span> marked text is what the checker changed</p>`
            : `<p class="hl-legend hl-clean">No formatting errors found. Every word already matches ${escapeHtml(r.styleName)}.</p>`
        }
      </div>`);
  }

  if (r.correctedText) {
    parts.push(`
      <div class="block">
        <p class="block-title">Corrected citation · ${escapeHtml(r.styleName)}</p>
        <p class="citation">${r.correctedHtml}</p>
      </div>`);
  }

  parts.push(renderMissing(r.missing));
  parts.push(renderFlags(r.flags));

  if (r.likelyAI) {
    parts.push(`
      <div class="block">
        <p class="block-title">AI-generated flag · verification checklist</p>
        <div class="notice warn">
          <p>This reference shows signs of being AI-generated or fabricated. Before submitting:</p>
          <ul class="questions">
            <li>Confirm the DOI resolves to a real source.</li>
            <li>Confirm the journal or publisher exists and matches this article.</li>
            <li>Check the authors and title against the original publication.</li>
          </ul>
        </div>
      </div>`);
  }

  parts.push(renderRules(r.rules));

  parts.push(`
    <div class="block">
      <p class="empty-state">Formatting only. Confirm the source exists and matches the metadata before submitting.</p>
    </div>`);

  return parts.join("");
}

function renderListResult(listResult) {
  const parts = [];

  const view = statusView(listResult.status);
  parts.push(`<span class="status ${view.cls}">${view.label}</span>`);
  parts.push(`<p class="summary">${escapeHtml(listResult.summary)}</p>`);

  if (listResult.likelyAI) {
    parts.push(`
      <div class="block">
        <p class="block-title">AI-generated flag · verification checklist</p>
        <div class="notice warn">
          <p>One or more references show signs of being AI-generated or fabricated. Before submitting:</p>
          <ul class="questions">
            <li>Confirm each DOI resolves to a real source.</li>
            <li>Confirm each journal or publisher exists and matches its article.</li>
            <li>Check authors and titles against the original publications.</li>
          </ul>
        </div>
      </div>`);
  }

  for (const item of listResult.items) {
    const r = item.result;
    const escapedInput = escapeHtml(item.input);
    const shortInput = escapedInput.length > 90 ? escapedInput.slice(0, 90) + "\u2026" : escapedInput;

    const view = statusView(r.status);
    parts.push(`
      <div class="card list-item">
        <div class="list-item-head">
          <span class="status ${view.cls}">${view.label}</span>
          <span class="list-input">${shortInput}</span>
        </div>
        <p class="summary">${escapeHtml(r.summary)}</p>`);

    if (r.status === "incomplete") {
      parts.push(renderMissing(r.missing));
    }

    if (r.correctedText) {
      parts.push(`
        <div class="block">
          <p class="block-title">Corrected · ${escapeHtml(r.styleName)}</p>
          <p class="citation">${r.correctedHtml}</p>
        </div>`);
    }

    if (r.flags.length) {
      parts.push(renderFlags(r.flags));
    }

    if (r.likelyAI) {
      parts.push(`
        <div class="block">
          <p class="block-title">AI-generated flag · verification checklist</p>
          <div class="notice warn">
            <p>Signs of AI generation detected. Verify before submitting:</p>
            <ul class="questions">
              <li>Confirm the DOI resolves to a real source.</li>
              <li>Confirm the journal or publisher exists.</li>
              <li>Check authors and title against the original publication.</li>
            </ul>
          </div>
        </div>`);
    }

    parts.push(renderRules(r.rules));
    parts.push(`</div>`);
  }

  return parts.join("");
}

async function resolveDoiLink(text) {
  const value = text.trim();
  const m =
    value.match(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)(10\.\d{4,9}\/\S+)$/i) ||
    value.match(/^(10\.\d{4,9}\/\S+)$/);
  if (!m) return null;
  const doi = m[1].replace(/[.,;\s]+$/, "");
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("DOI not found");
  const msg = (await res.json()).message;
  const authors = (msg.author || [])
    .map((a) => ({ family: a.family || a.name || "", given: a.given || "" }))
    .filter((a) => a.family);
  const issued = msg.issued && msg.issued["date-parts"] && msg.issued["date-parts"][0];
  return {
    doi,
    fields: {
      authors,
      year: issued && issued[0] ? String(issued[0]) : "",
      title: (msg.title && msg.title[0]) || "",
      container: (msg["container-title"] && msg["container-title"][0]) || "",
      volume: msg.volume || "",
      issue: msg.issue || "",
      pages: msg.page ? String(msg.page).replace(/\s*-\s*/, "\u2013") : "",
      doi,
    },
  };
}

async function run() {
  if (state.busy) return;
  const text = citationEl.value.trim();
  state.busy = true;
  checkBtn.disabled = true;
  checkBtn.textContent = "Checking\u2026";

  try {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const link = await resolveDoiLink(text);
    if (link) {
      resultEl.innerHTML = renderSingleResult(
        runCheck({
          raw: "",
          style: state.style,
          fields: link.fields,
          doiVerified: true,
        })
      );
      return;
    }

    if (/^https?:\/\//i.test(text)) {
      resultEl.innerHTML = `
        <span class="status warn">Link not supported yet</span>
        <p class="summary">This link is not a DOI link, so metadata cannot be extracted.</p>
        <div class="notice warn">
          <p>Paste the citation text instead, or use a <strong>https://doi.org/</strong> link. Non-DOI page extraction is the next verifiable step, not a finished feature.</p>
        </div>`;
      return;
    }

    if (lines.length > 1) {
      resultEl.innerHTML = renderListResult(runList({ raw: text, style: state.style }));
    } else {
      resultEl.innerHTML = renderSingleResult(runCheck({ raw: text, style: state.style }), text);
    }
  } catch (err) {
    resultEl.innerHTML = `
      <span class="status warn">Could not resolve DOI</span>
      <p class="summary">The DOI link could not be resolved through Crossref.</p>
      <div class="notice warn">
        <p>Check the network connection and the DOI, then try again. You can also paste the full citation text.</p>
      </div>`;
  } finally {
    state.busy = false;
    checkBtn.disabled = false;
    checkBtn.textContent = "Check citation";
  }
}

document.querySelectorAll(".seg").forEach((btn) => {
  btn.addEventListener("click", () => setStyle(btn.dataset.style));
});

checkBtn.addEventListener("click", run);

document.getElementById("clear").addEventListener("click", () => {
  citationEl.value = "";
  resultEl.innerHTML = `
    <div class="empty">
      <h2>Result</h2>
      <p>The corrected citation, the rules that were applied, and any field the tool refuses to guess will appear here.</p>
    </div>`;
  citationEl.focus();
});

citationEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    run();
  }
});
