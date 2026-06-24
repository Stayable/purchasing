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
  const m = g.normalizeGraphMessage(raw, "purchasing@rentstayable.com");
  assert.equal(m.from, "sales@walrus.com");
  assert.deepEqual(m.to, ["purchasing@rentstayable.com"]);
  assert.equal(m.conversationId, "AAQk");
  assert.equal(m.preview, "hi");
  assert.equal(m.hasAttachments, true);
  assert.equal(m.mailbox, "purchasing@rentstayable.com");
});

test("buildMessageBodyUrl selects body and encodes mailbox + id", () => {
  const u = g.buildMessageBodyUrl("purchasing@rentstayable.com", "AAMk=Id/With+Chars");
  assert.match(u, /\/users\/purchasing%40rentstayable\.com\/messages\//);
  assert.match(u, /\$select=id,body/);
  assert.match(u, /AAMk%3DId%2FWith%2BChars/);
});
