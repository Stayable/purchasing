import { useState } from "react";
import { getMessageBody } from "../api.js";

export function attentionLabel(state, days) {
  if (state === "awaiting-our-reply") return "Awaiting our reply";
  if (state === "stale") return `Vendor silent ${days ?? "?"}d`;
  if (state === "ok") return "Up to date";
  return "No email found";
}
function fmt(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""; }

// Wrap untrusted email HTML in a locked-down document. Rendered in a <iframe sandbox>
// (no allow-scripts) so JS can't run; the inner CSP blocks remote images/trackers.
export function buildEmailSrcdoc(bodyHtml) {
  return '<!doctype html><html><head><meta charset="utf-8">'
    + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; font-src data:">'
    + '<base target="_blank">'
    + '<style>body{font:13px/1.5 system-ui,-apple-system,sans-serif;color:#1a1a1a;margin:8px;overflow-wrap:break-word}img{max-width:100%}table{max-width:100%}</style>'
    + "</head><body>" + (bodyHtml || "<p>(empty message)</p>") + "</body></html>";
}

function MessageRow({ m }) {
  const [open, setOpen] = useState(false);
  const [bodyHtml, setBodyHtml] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | ready | error

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (bodyHtml != null || state === "loading") return;
    if (!m.id || !m.mailbox) { setState("error"); return; }
    setState("loading");
    try { const r = await getMessageBody(m.id, m.mailbox); setBodyHtml(r.bodyHtml || ""); setState("ready"); }
    catch { setState("error"); }
  }

  return (
    <li className={"comms-msg comms-msg--" + m.direction}>
      <div className="comms-msg-head">
        <button className="comms-expand" onClick={toggle} aria-expanded={open} title={open ? "Collapse" : "Read full message"}>
          {open ? "▾" : "▸"}
        </button>
        <span className="comms-dir">{m.direction === "outbound" ? "→ us" : "← vendor"}</span>
        <a className="comms-subj" href={m.webLink} target="_blank" rel="noreferrer">{m.subject || "(no subject)"}</a>
        <span className="comms-date">{fmt(m.receivedAt)}</span>
      </div>
      {!open && <span className="comms-preview">{m.preview}</span>}
      {open && (
        state === "loading" ? <p className="muted comms-body-status">Loading message…</p>
        : state === "error" ? (
          <p className="muted comms-body-status">
            Couldn’t load the message. <a href={m.webLink} target="_blank" rel="noreferrer">Open in Outlook</a>
          </p>
        ) : (
          <iframe
            className="comms-body"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={buildEmailSrcdoc(bodyHtml)}
            title={m.subject || "email body"}
          />
        )
      )}
    </li>
  );
}

// How many of the latest messages to show before the thread is collapsed.
export const DEFAULT_VISIBLE = 5;

export default function CommsPanel({ vendor }) {
  const msgs = vendor.messages || [];           // already newest-first from the API
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? msgs : msgs.slice(0, DEFAULT_VISIBLE);
  const hidden = msgs.length - visible.length;
  return (
    <div className="comms-panel">
      <div className={"comms-attn comms-attn--" + (vendor.attentionState || "none")}>
        {attentionLabel(vendor.attentionState, vendor.daysSinceLastMessage)} · {vendor.messageCount || 0} msg
      </div>
      {msgs.length === 0 ? (
        <p className="muted comms-empty">No email found for this vendor — they may be communicating via Alibaba chat.</p>
      ) : (
        <>
          <ul className="comms-thread">
            {visible.map((m) => (
              <MessageRow key={m.id || m.webLink} m={m} />
            ))}
          </ul>
          {msgs.length > DEFAULT_VISIBLE && (
            <button type="button" className="comms-more" onClick={() => setShowAll((s) => !s)}>
              {showAll ? `Show latest ${DEFAULT_VISIBLE}` : `Show ${hidden} older`}
            </button>
          )}
        </>
      )}
      <p className="comms-coverage">Email only — Alibaba chat not shown.</p>
    </div>
  );
}
