const COLORS = {
  Submitted:                ["#fef3c7", "#92400e"],
  Approved:                 ["#dcfce7", "#166534"],
  "Approved-with-Conditions": ["#dbeafe", "#1e40af"],
  Declined:                 ["#fee2e2", "#991b1b"],
  "Need-More-Info":         ["#fde8d8", "#9a3412"],
};

export default function StageBadge({ stage }) {
  const [bg, fg] = COLORS[stage] || ["#f1f5f9", "#475569"];
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {stage}
    </span>
  );
}
