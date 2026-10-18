import assert from "node:assert/strict";
import "./core.js";

const { checkCitation } = globalThis.CiteCheckCore;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}`);
    console.log(`      ${err.message}`);
  }
}

test("APA: fixes author, title case, hyphen page range, doi prefix", () => {
  const r = checkCitation({
    style: "APA7",
    raw:
      "Smith, J.A., & Lee, K. (2020). The Effects of Sleep on Memory. Journal of Sleep Research, 12(3), 45-67. doi:10.1234/jsr.2020.001",
  });
  assert.equal(
    r.correctedText,
    "Smith, J. A., & Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45\u201367. https://doi.org/10.1234/jsr.2020.001"
  );
  assert.equal(r.status, "needs_verification");
  const ids = r.rules.filter((x) => x.result === "fixed").map((x) => x.id);
  assert.deepEqual(ids.sort(), ["APA-A1", "APA-DOI1", "APA-P1", "APA-T1"].sort());
});

test("APA: missing year asks instead of inventing", () => {
  const r = checkCitation({
    style: "APA7",
    raw:
      "Smith, J. A., & Lee, K. The effects of sleep on memory. Journal of Sleep Research, 12(3), 45\u201367.",
  });
  assert.equal(r.status, "incomplete");
  assert.deepEqual(r.missing.map((m) => m.field), ["year"]);
  assert.equal(r.correctedText, "");
});

test("MLA: formats authors, quotes, labels and en dash", () => {
  const r = checkCitation({
    style: "MLA9",
    raw:
      'Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45-67.',
  });
  assert.equal(
    r.correctedText,
    'Smith, John A., and Kate Lee. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45\u201367.'
  );
  assert.equal(r.status, "corrected");
  assert.ok(r.rules.find((x) => x.id === "MLA-N1").result === "fixed");
});

test("MLA: initials only triggers a request for the full first name", () => {
  const r = checkCitation({
    style: "MLA9",
    raw:
      'Smith, J. A. "The Effects of Sleep on Memory." Journal of Sleep Research, vol. 12, no. 3, 2020, pp. 45\u201367.',
  });
  assert.equal(r.status, "incomplete");
  assert.ok(r.missing.some((m) => m.field === "author_given"));
});

test("Refuses unsupported style", () => {
  const r = checkCitation({ style: "Chicago", raw: "Smith, J. (2020). Title. Journal, 1(2), 3-4." });
  assert.equal(r.status, "refused");
  assert.equal(r.refusal.code, "unsupported_style");
});

test("Refuses out-of-scope essay request", () => {
  const r = checkCitation({ style: "APA7", raw: "Write my essay about sleep and memory." });
  assert.equal(r.status, "refused");
  assert.equal(r.refusal.code, "out_of_scope");
});

test("Refuses a full reference list", () => {
  const r = checkCitation({ style: "APA7", raw: "A".repeat(601) });
  assert.equal(r.status, "refused");
  assert.equal(r.refusal.code, "scope_list");
});

test("Structured fields: builds a citation without inventing", () => {
  const r = checkCitation({
    style: "APA7",
    raw: "",
    fields: {
      authors: [{ family: "Smith", given: "John A." }, { family: "Lee", given: "Kate" }],
      year: "2020",
      title: "The effects of sleep on memory",
      container: "Journal of Sleep Research",
      volume: "12",
      issue: "3",
      pages: "45\u201367",
      doi: "10.1234/jsr.2020.001",
    },
  });
  assert.equal(
    r.correctedText,
    "Smith, J. A., & Lee, K. (2020). The effects of sleep on memory. Journal of Sleep Research, 12(3), 45\u201367. https://doi.org/10.1234/jsr.2020.001"
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
