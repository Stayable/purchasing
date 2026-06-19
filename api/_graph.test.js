const test = require("node:test"); const assert = require("node:assert");
const g = require("./_graph.js");

test("graphConfigured false when env missing", () => {
  delete process.env.GRAPH_TENANT_ID; delete process.env.GRAPH_CLIENT_ID; delete process.env.GRAPH_CLIENT_SECRET;
  assert.equal(g.graphConfigured(), false);
});

test("scopedMailboxes default + CSV override", () => {
  delete process.env.GRAPH_MAILBOXES;
  assert.deepEqual(g.scopedMailboxes(), ["purchasing@rentstayable.com", "jefferson@rentstayable.com"]);
  process.env.GRAPH_MAILBOXES = "a@x.com, b@y.com";
  assert.deepEqual(g.scopedMailboxes(), ["a@x.com", "b@y.com"]);
  delete process.env.GRAPH_MAILBOXES;
});

test("normalizeGraphMessage maps Graph fields", () => {
  const raw = {
    id: "AAMk", conversationId: "AAQk", subject: "Re: Quote", bodyPreview: "hi",
    receivedDateTime: "2026-06-17T09:12:00Z", hasAttachments: true, webLink: "https://o",
    from: { emailAddress: { address: "sales@walrus.com" } },
    toRecipients: [{ emailAddress: { address: "purchasing@rentstayable.com" } }],
    ccRecipients: [],
  };
  const m = g.normalizeGraphMessage(raw);
  assert.equal(m.from, "sales@walrus.com");
  assert.deepEqual(m.to, ["purchasing@rentstayable.com"]);
  assert.equal(m.conversationId, "AAQk");
  assert.equal(m.preview, "hi");
  assert.equal(m.hasAttachments, true);
});
