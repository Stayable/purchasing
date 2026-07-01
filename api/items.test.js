// api/items.test.js
const test = require("node:test");
const assert = require("node:assert");
const { buildItemRecord } = require("./items.js");

test("maps required fields and forces Stage=Spec", () => {
  const rec = buildItemRecord({
    name: "Queen Mattress 12in",
    category: "FF&E",
    property: "Lakeland (4645)",
    targetQty: 120,
    description: "Medium-firm, hotel contract grade",
  });
  assert.equal(rec.Name, "Queen Mattress 12in");
  assert.equal(rec.Category, "FF&E");
  assert.equal(rec.Property_Scope, "Lakeland (4645)");
  assert.equal(rec.Target_Quantity, 120);
  assert.equal(rec.Description, "Medium-firm, hotel contract grade");
  assert.equal(rec.Stage, "Spec");
});

test("omits optional empty fields", () => {
  const rec = buildItemRecord({ name: "X", category: "OS&E", property: "Gainesville (2900)", targetQty: 5, description: "d" });
  assert.ok(!("Target_Decision_Date" in rec));
  assert.ok(!("US_Baseline_Cost_Unit" in rec));
});

test("includes optional fields when provided", () => {
  const rec = buildItemRecord({
    name: "X", category: "OS&E", property: "Gainesville (2900)", targetQty: 5, description: "d",
    neededBy: "2026-08-01", baselineUnitCost: 42.5,
  });
  assert.equal(rec.Target_Decision_Date, "2026-08-01");
  assert.equal(rec.US_Baseline_Cost_Unit, 42.5);
});
