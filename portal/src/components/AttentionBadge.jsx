export default function AttentionBadge({ state }) {
  if (state === "awaiting-our-reply") return <span className="attn-badge attn-badge--reply" title="Vendor replied — awaiting our response">⚠ awaiting reply</span>;
  if (state === "stale") return <span className="attn-badge attn-badge--stale" title="Thread silent ≥7 days">⏳ silent</span>;
  return null;
}
