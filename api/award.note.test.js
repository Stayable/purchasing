const test = require("node:test"); const assert = require("node:assert");
const { buildRecord } = require("./award.js");
test("approve builds award record with note", () => {
  const r = buildRecord("1", "approve", "9", "why it won", "rb@x.com", "2026-06-17");
  assert.equal(r.id, "1");
  assert.equal(r.Stage, "Approved");
  assert.deepEqual(r.Awarded_Vendor, { id: "9" });
  assert.equal(r.Decision_Notes, "why it won");
  assert.equal(r.Portal_Approved_By, "rb@x.com");
  assert.equal(r.Portal_Approved_At, "2026-06-17");
});
test("decline omits award, keeps note", () => {
  const r = buildRecord("1", "decline", null, "230V no UL", "rb@x.com", "2026-06-17");
  assert.equal(r.Stage, "Declined");
  assert.equal("Awarded_Vendor" in r, false);
  assert.equal(r.Decision_Notes, "230V no UL");
});
test("note action only updates Decision_Notes", () => {
  const r = buildRecord("1", "note", null, "added later", "rb@x.com", "2026-06-17");
  assert.deepEqual(Object.keys(r).sort(), ["Decision_Notes", "id"].sort());
  assert.equal(r.Decision_Notes, "added later");
});
