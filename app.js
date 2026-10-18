import { checkCitation } from "./core.js";

const EXAMPLES = {
  "apa-errors": {
    style: "APA7",
    text:
      "Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001",
  },
  "apa-missing": {
    style: "APA7",
    text:
      "Smith, J. A., & Lee, K. The effects of sleep on memory. Journal of Sleep Research, 12(3), 45\u201367.",
  },
  "mla-clean": {
    style: "MLA9",
    text:
      'Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.',
  },
  "out-of-scope": {
    style: "APA7",
    text: "Write my essay about sleep and memory.",
  },
};

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

function renderResult(r) {
  if (r.status === "refused") {
    resultEl.innerHTML = `
      <span class="status bad">Refused</span>
      <p class="summary">The request is outside what this checker does.</p>
      <div class="notice bad"><p>${escapeHtml(r.refusal.message)}</p></div>
      <div class="block">
        <p class="block-title">Scope</p>
        <p class="empty-state">Supported: APA 7 and MLA 9, one citation at a time, formatting checks only.</p>
      </div>`;
    return;
  }

  const view = statusView(r.status);
  const parts = [];

  parts.push(`<span class="status ${view.cls}">${view.label}</span>`);
  parts.push(`<p class="summary">${escapeHtml(r.summary)}</p>`);

  if (r.correctedText) {
    parts.push(`
      <div class="block">
        <p class="block-title">Corrected citation · ${escapeHtml(r.styleName)}</p>
        <p class="citation">${r.correctedHtml}</p>
      </div>`);
  }

  if (r.missing.length) {
    parts.push(`
      <div class="block">
        <p class="block-title">Required fields</p>
        <div class="notice warn">
          <p>The tool will not invent or guess this information.</p>
        </div>
        <ul class="questions">
          ${r.missing.map((m) => `<li>${escapeHtml(m.question)}</li>`).join("")}
        </ul>
      </div>`);
  }

  if (r.flags.length) {
    parts.push(
      r.flags
        .map(
          (f) => `
        <div class="block">
          <p class="block-title">${f.type === "verified" ? "Source check" : "Verification"}</p>
          <div class="notice ${f.type === "verified" ? "ok" : "warn"}"><p>${escapeHtml(f.message)}</p></div>
        </div>`
        )
        .join("")
    );
  }

  parts.push(renderRules(r.rules));

  parts.push(`
    <div class="block">
      <p class="empty-state">Formatting only. Confirm the source exists and matches the metadata before submitting.</p>
    </div>`);

  resultEl.innerHTML = parts.join("");
}

async function resolveDoiLink(text) {
  const m = text.trim().match(/^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/\S+)$/i);
  if (!m) return null;
  const doi = m[1].replace(/[.,;]+$/, "");
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
    const link = await resolveDoiLink(text);
    if (link) {
      renderResult(
        checkCitation({
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
    renderResult(checkCitation({ raw: text, style: state.style }));
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

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const ex = EXAMPLES[btn.dataset.example];
    if (!ex) return;
    setStyle(ex.style);
    citationEl.value = ex.text;
    citationEl.focus();
  });
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

const demo = new URLSearchParams(location.search).get("example");
if (demo && EXAMPLES[demo]) {
  setStyle(EXAMPLES[demo].style);
  citationEl.value = EXAMPLES[demo].text;
  run();
}
