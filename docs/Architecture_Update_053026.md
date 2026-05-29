# Architecture Update — 05/30/26
**RISE8 Companies / Stayable · Zoho CRM**
Owner: Kyle Estocapio · Approver: Rob Beyer
Prepared: 05/30/26

> **Purpose:** capture the architecture's evolution while keeping the **initial proposal intact**. `Zoho_Architecture.md` (root) remains the **frozen baseline** — the original CEO proposal, unedited, as the reference of record. This doc layers the deltas on top. Each update cites its trigger so the audit trail is clean.

---

## Baseline
- **`Zoho_Architecture.md`** (root) = initial architecture proposal, **unchanged**. Do not edit; it is the basis.
- This doc = the running delta. Decision-of-record stays in `docs/ZohoCRM_Rollout_052126.md`; this is the architecture-specific summary.

---

## Update set 1 — Jefferson handback (05/29, processed 05/30)
**Trigger:** `JeffersonHandback_052926.md` + `IntlVendorContacts_RISE8_052926.md` + `ItemStaging_Procurement_052926.xlsx`.

### Confirmed (no change to baseline)
| Element | Status |
|---|---|
| Item-centric model (`Procurement_Items`, not Deals) | ✅ Confirmed by Jefferson |
| 10-stage flow (Spec→…→4 terminal states) | ✅ Confirmed — matches real buying |
| PO handling (fields + attached PDF; no PO module) | ✅ Confirmed — covers Alibaba/Amazon/Home Depot |
| FL-Validate criteria (humidity/salt air/hurricane/120V-UL-ETL) | ✅ Confirmed |

### Adjustments to the baseline
| # | Adjustment | Type | Status / Owner |
|---|---|---|---|
| A1 | **Stale-bid threshold 3 days (not 14)** | Parameter + design fork | 🔴 Pending Rob §13 #1 (report vs per-vendor workflow). Jefferson recommendation. |
| A2 | **`Sourcing Agent` added to `Vendor_Type`** | Picklist | 🟢 Kyle (manual Settings) — P18. Jing Sourcing, LeeLine are agents, not manufacturers. |
| A3 | **Country picklist + Thailand, Philippines** | Picklist | 🟢 Kyle — P19. Vendors now span CN/TH/VN/PH (+ existing IN/TR/PK/KH). |
| A4 | **Category value normalization** (singular→plural) | Data-quality | 🟢 Kyle/Jeff — P20. Staging uses "Appliance"/"Building Material"; picklist plural — align before load. |
| A5 | **Item-load scope: "197" → 35 top-by-spend** | Scope clarification | 🟢 Reconciled. Jefferson's actual staging is 35 (20 Home Depot + 15 Amazon). P12. |

### Data applied to live records (05/30 — hygiene, not the frozen load)
- 13 vendor-Contact rep names (9 full + 4 first-name-only).
- Guangdong Yongcheng `Vendor_Type` = Overseas Manufacturer.

### New tracked items (frozen by hold / parallel)
- ~14 new vendor Accounts (multi-country; dedupe required; sourcing agents) — P16, ⛔ hold.
- Vendor rep-data follow-ups (4 first-only, 4 no-name, ~30 no phone) — P17, Jefferson.

### Operational notes (no schema change)
- **WhatsApp/WeChat-first vendors** confirmed (Souxin, TKT, Asico, iSuperhouse) — reinforces `alibaba-chat-untracked`: off-platform comms log manually; email-connector idea (P15) wouldn't capture them.

---

## Open decisions still routing to Rob
1. Bidding design + 3-day threshold (§13 #1) — now has Jefferson's input.
2. Spend-tier confirmation vs DOA matrix (§13 #2-adjacent; tracker P7) — placeholder tiers exist.
3. PO approach confirm (§13 #2) — fields already built.
4. Production hold-lift date (Jefferson Q4).

---

## Change log
| Date | Update set |
|---|---|
| 05/30/26 | Doc created. Update set 1 (Jefferson handback): 4 confirmations, 5 adjustments (A1–A5), live data applied, P16–P20 added. Baseline `Zoho_Architecture.md` unchanged. |
