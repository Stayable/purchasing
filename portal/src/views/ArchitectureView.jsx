const MODULES = [
  { name: "Procurement Items", role: "The item being sourced", detail: "Custom module — single “Overseas Procurement” pipeline, the 10-value Stage picklist, FF&E/OS&E/appliance specs, Florida validation, and the Decision Notes." },
  { name: "Vendors", role: "Who we buy from", detail: "Vendors module — vendor record holds the contact Email/Phone, vetting, payment terms, and country of origin." },
  { name: "Vendor Quotes", role: "What they quoted", detail: "Child module — one record per quote, linked to an Item and a Vendor, with landed-cost math (unit + freight + duty + inspection) and the awarded flag." },
];

export default function ArchitectureView() {
  return (
    <section className="view-pane content-page">
      <h2 className="view-title">Architecture</h2>

      <div className="content-card">
        <h3 className="content-h">Three modules in Zoho</h3>
        <p>The system of record is three connected Zoho modules. The portal reads from them and writes back approvals.</p>
        <div className="arch-flow">
          <span className="arch-node">Vendors</span>
          <span className="arch-arrow">→</span>
          <span className="arch-node arch-node--primary">Procurement Items</span>
          <span className="arch-arrow">←</span>
          <span className="arch-node">Vendor Quotes</span>
        </div>
      </div>

      {MODULES.map((m) => (
        <div key={m.name} className="content-card">
          <h3 className="content-h">{m.name} <span className="arch-role">{m.role}</span></h3>
          <p>{m.detail}</p>
        </div>
      ))}

      <div className="content-card">
        <h3 className="content-h">Portal role</h3>
        <p>This portal is a read &amp; approve window over those modules. Rob reviews the queue, compares quotes on landed cost, reads vendor email threads inline, and records the decision — which writes <code>Stage</code>, <code>Awarded Vendor</code>, and the approver/date back to Zoho. Vendor email is matched per quote via the vendor&apos;s Email (email-only; Alibaba chat isn&apos;t synced).</p>
      </div>
    </section>
  );
}
