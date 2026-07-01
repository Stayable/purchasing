// portal/src/components/QuoteFormModal.jsx — add a Vendor_Quote to an item (Phase 4, HIDDEN).
// Vendor dropdown from /api/vendors, plus "+ New vendor" which opens VendorFormModal on top
// WITHOUT unmounting this form — so the quote draft is preserved. Landed cost is computed by
// Zoho on save.
import { useEffect, useState } from "react";
import { getVendors, createQuote } from "../api.js";
import VendorFormModal from "./VendorFormModal.jsx";

const INCOTERMS = ["FOB", "CIF", "DDP", "EXW"];
const CURRENCIES = ["USD", "CNY", "VND", "INR", "MXN"];
const SPEC_MATCH = ["Exceeds", "Meets", "Minor Deviation", "Fails"];
const STATUSES = ["Requested", "Received", "Under Review", "Sample Requested", "Awarded", "Declined"];

export default function QuoteFormModal({ item, onClose, onCreated }) {
  const [vendors, setVendors] = useState([]);
  const [f, setF] = useState({
    vendorId: "", quoteName: "", unitPrice: "", orderQty: item?.targetQty ?? "", freight: "",
    duty: "", leadDays: "", incoterm: "", currency: "USD", specMatch: "", status: "Received", dateReceived: "", notes: "",
  });
  const [showVendor, setShowVendor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function loadVendors() {
    getVendors().then((d) => setVendors(d.vendors || [])).catch(() => setVendors([]));
  }
  useEffect(() => { loadVendors(); }, []);

  function onVendorCreated(v) {
    setShowVendor(false);
    setVendors((prev) => [v, ...prev.filter((x) => x.id !== v.id)]);
    setF((prev) => ({ ...prev, vendorId: v.id })); // auto-select; quote draft untouched
  }

  async function submit() {
    setBusy(true); setErr("");
    try {
      await createQuote({ itemId: item.id, itemName: item.name, ...f });
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.response?.data?.error || "Create failed.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && !showVendor && onClose()}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">Add quote — {item?.name}</div>
        <div className="modal-body">
          <label className="req" htmlFor="q-vendor">Vendor <span className="req-star">*</span></label>
          <div className="quote-vendor-row">
            <select id="q-vendor" className="modal-input" value={f.vendorId} onChange={set("vendorId")}>
              <option value="">Select a vendor…</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setShowVendor(true)}>+ New vendor</button>
          </div>

          <label htmlFor="q-name">Quote label</label>
          <input id="q-name" className="modal-input" value={f.quoteName} onChange={set("quoteName")} placeholder="Optional — e.g. 'Spring sample run'" />

          <div className="quote-grid">
            <div>
              <label htmlFor="q-price">Unit price</label>
              <input id="q-price" className="modal-input" type="number" step="0.01" value={f.unitPrice} onChange={set("unitPrice")} />
            </div>
            <div>
              <label htmlFor="q-qty">Order quantity</label>
              <input id="q-qty" className="modal-input" type="number" value={f.orderQty} onChange={set("orderQty")} />
            </div>
            <div>
              <label htmlFor="q-freight">Freight cost</label>
              <input id="q-freight" className="modal-input" type="number" step="0.01" value={f.freight} onChange={set("freight")} />
            </div>
            <div>
              <label htmlFor="q-duty">Duty / tariff</label>
              <input id="q-duty" className="modal-input" type="number" step="0.01" value={f.duty} onChange={set("duty")} />
            </div>
            <div>
              <label htmlFor="q-lead">Lead time (days)</label>
              <input id="q-lead" className="modal-input" type="number" value={f.leadDays} onChange={set("leadDays")} />
            </div>
            <div>
              <label htmlFor="q-cur">Currency</label>
              <select id="q-cur" className="modal-input" value={f.currency} onChange={set("currency")}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-inco">Incoterm</label>
              <select id="q-inco" className="modal-input" value={f.incoterm} onChange={set("incoterm")}>
                <option value="">—</option>
                {INCOTERMS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-spec">Spec match</label>
              <select id="q-spec" className="modal-input" value={f.specMatch} onChange={set("specMatch")}>
                <option value="">—</option>
                {SPEC_MATCH.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-status">Status</label>
              <select id="q-status" className="modal-input" value={f.status} onChange={set("status")}>
                {STATUSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-date">Date received</label>
              <input id="q-date" className="modal-input" type="date" value={f.dateReceived} onChange={set("dateReceived")} />
            </div>
          </div>

          <label htmlFor="q-notes">Notes</label>
          <textarea id="q-notes" className="modal-textarea" rows={2} value={f.notes} onChange={set("notes")} />

          {err && <p className="err">{err}</p>}
          <p className="muted-note">Landed cost is calculated automatically in Zoho after saving.</p>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !f.vendorId}>
            {busy ? "Saving…" : "Add quote"}
          </button>
        </div>
      </div>

      {showVendor && (
        <VendorFormModal onClose={() => setShowVendor(false)} onCreated={onVendorCreated} />
      )}
    </div>
  );
}
