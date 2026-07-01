// portal/src/components/NewItemModal.jsx — Rob's create-item form (Stage=Spec on save).
import { useState } from "react";
import { createItem } from "../api.js";

const CATEGORIES = ["Appliances","Building Materials","Electrical","Electronics","FF&E","Flooring & Wall Covering","Furniture","Hardware","Hardware & Tools","Kitchen & Bath","Lighting","Linens","OS&E","Outdoor / Garden","Paint & Supplies","Plumbing","Soft Goods","Other"];
const PROPERTIES = ["Portfolio-wide (all 8 properties)","Lakeland (4645)","Kissimmee East (2295)","Jacksonville West (6802)","Jacksonville North (812)","Kissimmee West (5399)","St. Augustine (2535)","Davenport (44199)","Orlando OBT (8700)","Gainesville (2900)"];

export default function NewItemModal({ onClose, onCreated }) {
  const [f, setF] = useState({ name: "", category: "", property: "", targetQty: "", neededBy: "", description: "", baselineUnitCost: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.name.trim() && f.category && f.property && String(f.targetQty).trim() && f.description.trim();

  async function submit() {
    setBusy(true); setErr("");
    try {
      await createItem(f);
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.response?.data?.error || "Create failed.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">New procurement item</div>
        <div className="modal-body">
          <label className="req" htmlFor="ni-name">Item name <span className="req-star">*</span></label>
          <input id="ni-name" className="modal-input" value={f.name} onChange={set("name")} />

          <label className="req" htmlFor="ni-cat">Category <span className="req-star">*</span></label>
          <select id="ni-cat" className="modal-input" value={f.category} onChange={set("category")}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="req" htmlFor="ni-prop">Property scope <span className="req-star">*</span></label>
          <select id="ni-prop" className="modal-input" value={f.property} onChange={set("property")}>
            <option value="">Select…</option>
            {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="req" htmlFor="ni-qty">Target quantity <span className="req-star">*</span></label>
          <input id="ni-qty" className="modal-input" type="number" min="1" value={f.targetQty} onChange={set("targetQty")} />

          <label htmlFor="ni-needed">Needed-by / target decision date</label>
          <input id="ni-needed" className="modal-input" type="date" value={f.neededBy} onChange={set("neededBy")} />

          <label className="req" htmlFor="ni-desc">Specs / description <span className="req-star">*</span></label>
          <textarea id="ni-desc" className="modal-textarea" rows={4} value={f.description} onChange={set("description")} placeholder="What Jefferson needs to source…" />

          <label htmlFor="ni-base">US baseline cost / unit</label>
          <input id="ni-base" className="modal-input" type="number" min="0" step="0.01" value={f.baselineUnitCost} onChange={set("baselineUnitCost")} />

          {err && <p className="err">{err}</p>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !ready}>
            {busy ? "Creating…" : "Create item"}
          </button>
        </div>
      </div>
    </div>
  );
}
