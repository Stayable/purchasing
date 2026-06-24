const STAGES = [
  { k: "Spec", d: "Define the item spec; COO signs off before bidding." },
  { k: "Bid", d: "Collect ≥3 overseas vendor quotes; chase stale quotes after 7 days." },
  { k: "Level", d: "Level quotes on landed cost (unit + freight + duty + inspection)." },
  { k: "FL-Validate", d: "Florida gates: humidity, salt air, hurricane code, 120V UL/ETL electrical." },
  { k: "Recommend", d: "Bring the leveled, FL-validated recommendation to Rob for approval." },
];
const ROLES = [
  { who: "Jefferson", what: "Day-to-day procurement operator inside Zoho." },
  { who: "Rob (CEO)", what: "Approval authority — vendor selection, PO issuance, architecture." },
  { who: "Kyle", what: "Project spearhead; Zoho super-admin + portal admin." },
];

export default function HowItWorksView() {
  return (
    <section className="view-pane content-page">
      <h2 className="view-title">How it works</h2>

      <div className="content-card">
        <h3 className="content-h">Operating model</h3>
        <p>Two tiers. <strong>Zoho CRM is the backend / system of record</strong> — Jefferson works the pipeline there. This <strong>portal is the window</strong> — a read &amp; approve surface so Rob can review and decide without living in Zoho. Decisions are recorded on the item, never in email.</p>
      </div>

      <div className="content-card">
        <h3 className="content-h">The 5-stage workflow</h3>
        <ol className="content-steps">
          {STAGES.map((s, i) => (
            <li key={s.k}><span className="content-step-n">{i + 1}</span><strong>{s.k}</strong> — {s.d}</li>
          ))}
        </ol>
      </div>

      <div className="content-card">
        <h3 className="content-h">Florida validation gates</h3>
        <p>Every item destined for a property is checked against Florida realities before it can be recommended: <strong>humidity &amp; mold resistance</strong>, <strong>salt-air corrosion</strong>, <strong>hurricane building code</strong>, and <strong>120V UL/ETL-listed electrical</strong>. Items that fail are rejected automatically.</p>
      </div>

      <div className="content-card">
        <h3 className="content-h">Who does what</h3>
        <ul className="content-roles">
          {ROLES.map((r) => (
            <li key={r.who}><strong>{r.who}</strong> — {r.what}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
