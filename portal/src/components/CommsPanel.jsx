export function attentionLabel(state, days) {
  if (state === "awaiting-our-reply") return "Awaiting our reply";
  if (state === "stale") return `Vendor silent ${days ?? "?"}d`;
  if (state === "ok") return "Up to date";
  return "No email found";
}
function fmt(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""; }

export default function CommsPanel({ vendor }) {
  const msgs = vendor.messages || [];
  return (
    <div className="comms-panel">
      <div className={"comms-attn comms-attn--" + (vendor.attentionState || "none")}>
        {attentionLabel(vendor.attentionState, vendor.daysSinceLastMessage)} · {vendor.messageCount || 0} msg
      </div>
      {msgs.length === 0 ? (
        <p className="muted comms-empty">No email found for this vendor — they may be communicating via Alibaba chat.</p>
      ) : (
        <ul className="comms-thread">
          {msgs.map((m) => (
            <li key={m.id || m.webLink} className={"comms-msg comms-msg--" + m.direction}>
              <span className="comms-dir">{m.direction === "outbound" ? "→ us" : "← vendor"}</span>
              <a className="comms-subj" href={m.webLink} target="_blank" rel="noreferrer">{m.subject || "(no subject)"}</a>
              <span className="comms-date">{fmt(m.receivedAt)}</span>
              <span className="comms-preview">{m.preview}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="comms-coverage">Email only — Alibaba chat not shown.</p>
    </div>
  );
}
