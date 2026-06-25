/* ----------------------------------------------------------------------------
   StageBadge.jsx — REDESIGN drop-in replacement for portal/src/components/StageBadge.jsx
   Maps each stage to ONE status intent (neutral / info / ok / warn / bad) via a
   CSS class, instead of inline hex colors. The colors then live in styles.css
   and stay consistent with every other badge in the app.
   ---------------------------------------------------------------------------- */

const INTENT = {
  // pipeline (in-progress)
  Spec:          "neutral",
  Bid:           "info",
  Level:         "info",
  "FL-Validate": "info",
  Recommend:     "info",
  Submitted:     "info",
  // terminal
  Approved:                   "ok",
  "Approved-with-Conditions": "ok",
  Declined:                   "bad",
  "Need-More-Info":           "warn",
};

export default function StageBadge({ stage }) {
  const intent = INTENT[stage] || "neutral";
  return <span className={"badge badge--" + intent}>{stage}</span>;
}
