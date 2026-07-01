// portal/src/components/VendorFormModal.jsx — inline "create new vendor" (Phase 4).
// Rendered ON TOP of the quote form; the quote form stays mounted underneath so its
// draft is never lost. On save, calls onCreated(newVendor) with {id, name, email}.
import { useState } from "react";
import { createVendor } from "../api.js";

const VENDOR_TYPES = ["Overseas Manufacturer", "US Distributor", "Freight Forwarder", "Inspection Service", "Sourcing Agent", "Other"];
const COUNTRIES = ["China", "Vietnam", "India", "Mexico", "USA", "Thailand", "Philippines", "Other"];

export default function VendorFormModal({ onClose, onCreated }) {
  const [f, setF] = useState({ name: "", email: "", vendorType: "", country: "", phone: "", website: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true); setErr("");
    try {
      const r = await createVendor(f);
      onCreated({ id: r.id, name: r.name || f.name, email: r.email || f.email || null });
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.response?.data?.error || "Create failed.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop modal-backdrop--stacked" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">New vendor</div>
        <div className="modal-body">
          <label className="req" htmlFor="nv-name">Vendor name <span className="req-star">*</span></label>
          <input id="nv-name" className="modal-input" value={f.name} onChange={set("name")} />

          <label htmlFor="nv-email">Email</label>
          <input id="nv-email" className="modal-input" type="email" value={f.email} onChange={set("email")} />

          <label htmlFor="nv-type">Vendor type</label>
          <select id="nv-type" className="modal-input" value={f.vendorType} onChange={set("vendorType")}>
            <option value="">Select…</option>
            {VENDOR_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>

          <label htmlFor="nv-country">Country of origin</label>
          <select id="nv-country" className="modal-input" value={f.country} onChange={set("country")}>
            <option value="">Select…</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label htmlFor="nv-phone">Phone</label>
          <input id="nv-phone" className="modal-input" value={f.phone} onChange={set("phone")} />

          <label htmlFor="nv-web">Website</label>
          <input id="nv-web" className="modal-input" value={f.website} onChange={set("website")} />

          <label htmlFor="nv-notes">Notes</label>
          <textarea id="nv-notes" className="modal-textarea" rows={2} value={f.notes} onChange={set("notes")} />

          {err && <p className="err">{err}</p>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !f.name.trim()}>
            {busy ? "Creating…" : "Create vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}
