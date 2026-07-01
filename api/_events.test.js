// api/_events.test.js — pure-logic coverage for the events hook.
const test = require("node:test");
const assert = require("node:assert");
const { recipientsFor, renderNotification, ROB, JEFFERSON } = require("./_events.js");

test("recipientsFor routes each type correctly", () => {
  assert.deepEqual(recipientsFor("item_created"), [JEFFERSON]);
  assert.deepEqual(recipientsFor("quotes_ready"), [ROB]);
  assert.deepEqual(recipientsFor("decision_made"), [JEFFERSON]);
  assert.deepEqual(recipientsFor("unknown"), []);
});

test("renderNotification produces title/body/html and escapes the item name", () => {
  const r = renderNotification("item_created", { itemName: 'Chairs <b>"A"</b>', actorLabel: "Rob", itemId: "1" });
  assert.match(r.title, /New item to source/);
  assert.match(r.title, /Chairs/);
  assert.ok(r.body.length > 0);
  assert.match(r.html, /&lt;b&gt;/);        // escaped
  assert.doesNotMatch(r.html, /<b>"A"<\/b>/); // raw markup not present
});

test("quotes_ready + decision_made render distinct titles", () => {
  assert.match(renderNotification("quotes_ready", { itemName: "X" }).title, /ready for review/i);
  assert.match(renderNotification("decision_made", { itemName: "X", extra: "awarded" }).title, /awarded/);
});
