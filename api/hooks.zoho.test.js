// Tests for the Zoho inbound webhook body parsing + id sanitising.
// Covers the 07/28 failure modes: multipart bodies and unresolved merge fields.

const { test } = require("node:test");
const assert = require("node:assert");

const hook = require("./hooks/zoho.js");
const { parseBodyText, cleanId } = hook;

const SECRET = "s3cr3t";

test("parses x-www-form-urlencoded", () => {
  const p = parseBodyText("secret=s3cr3t&itemId=123&stage=Submitted", "application/x-www-form-urlencoded");
  assert.deepStrictEqual(p, { secret: SECRET, itemId: "123", stage: "Submitted" });
});

test("parses JSON", () => {
  const p = parseBodyText('{"secret":"s3cr3t","itemId":"123"}', "application/json");
  assert.strictEqual(p.itemId, "123");
});

test("parses multipart/form-data (the shape Vercel does NOT pre-parse)", () => {
  const b = "X-BOUNDARY";
  const raw = [
    `--${b}`, 'Content-Disposition: form-data; name="secret"', "", SECRET,
    `--${b}`, 'Content-Disposition: form-data; name="itemId"', "", "6342912000001681001",
    `--${b}`, 'Content-Disposition: form-data; name="stage"', "", "Submitted",
    `--${b}--`, "",
  ].join("\r\n");
  const p = parseBodyText(raw, `multipart/form-data; boundary=${b}`);
  assert.strictEqual(p.secret, SECRET);
  assert.strictEqual(p.itemId, "6342912000001681001");
  assert.strictEqual(p.stage, "Submitted");
});

test("parses quoted multipart boundary", () => {
  const raw = ['--abc', 'Content-Disposition: form-data; name="itemId"', "", "9", "--abc--", ""].join("\r\n");
  assert.strictEqual(parseBodyText(raw, 'multipart/form-data; boundary="abc"').itemId, "9");
});

test("sniffs urlencoded when Content-Type is absent", () => {
  assert.strictEqual(parseBodyText("secret=s3cr3t&itemId=7", "").itemId, "7");
});

test("sniffs JSON when Content-Type is absent", () => {
  assert.strictEqual(parseBodyText('{"itemId":"7"}', "").itemId, "7");
});

test("empty / unparseable bodies yield {} rather than throwing", () => {
  assert.deepStrictEqual(parseBodyText("", "application/json"), {});
  assert.deepStrictEqual(parseBodyText("not json at all", "application/json"), {});
  assert.deepStrictEqual(parseBodyText("plain text", ""), {});
  assert.deepStrictEqual(parseBodyText("--x", "multipart/form-data"), {}); // no boundary
});

test("cleanId rejects unresolved Zoho merge fields", () => {
  assert.strictEqual(cleanId("${Procurement_Items.Id}"), null);
  assert.strictEqual(cleanId(""), null);
  assert.strictEqual(cleanId("  "), null);
  assert.strictEqual(cleanId("null"), null);
  assert.strictEqual(cleanId("undefined"), null);
});

test("cleanId keeps real ids and trims", () => {
  assert.strictEqual(cleanId(" 6342912000001681001 "), "6342912000001681001");
});
