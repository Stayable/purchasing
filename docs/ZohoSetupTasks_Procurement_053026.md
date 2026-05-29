# Zoho Setup — Priority Task Tracker (Procurement / Backend)
**RISE8 Companies / Stayable**
Owner: Kyle Estocapio · Approver: Rob Beyer · Data: Jefferson Gomez
Prepared: 05/30/26 · Last Updated: 2026-05-30

> Single prioritized list for tracking the **backend / Zoho setup** work. Decision log of record stays in `docs/ZohoCRM_Rollout_052126.md`; this is the live action tracker. Lower P# = higher priority.

**Status key:** ✅ Done · 🟢 Do now (no blocker) · 🔴 Blocked on Rob (§ = `Zoho_Architecture.md` §13) · ⛔ Frozen by production hold · 🟡 Future backlog
**Change-risk:** 🟩 stable · 🟨 minor · 🟥 change-prone

---

## Done (this session)
| P | Task | Status |
|---|---|---|
| — | `CRM_Use_Case` firewall field + tag all 21 Accounts `Procurement` | ✅ 05/29 |
| — | `PO_Number` + `PO_Status` fields on Procurement_Items (7-value picklist) | ✅ 05/29 |

---

## Active — do now (backend, no blocker)
| P | Task | Owner | Status | Risk | Notes |
|---|---|---|---|---|---|
| **P1** | Write `WorkflowRulesSpec_ProcurementItems` — map all 5 SOP rules to correct Zoho object (validation vs workflow), exact criteria, error text, prerequisites | Kyle | 🟢 | 🟩 | Paper artifact; becomes the build checklist. Rules 1–3 = **validation rules** (manual Settings, no MCP path); rule 4 = stale-bid alert (🔴 P6); rule 5 = spend-tier (🔴 P7). |
| ~~P2~~ | Relabel `PO_Number` field → "PO Number" (drop underscore) | Kyle | ✅ 05/30 | 🟩 | Verified live: labels now "PO Number" / "PO Status". |
| ~~P3~~ | `/tracker` UI polish in demo mode (Vercel) | Kyle | ✅ 05/30 | 🟩 | Spend tiers labeled placeholder (pending DOA); stale Deal refs cleaned. UI was already well-built. |
| **P4** | Account/Contact hygiene | Kyle/Jeff | 🟡 partial | 🟩 | ✅ 05/30: **Guangdong Yongcheng** `Vendor_Type`=Overseas Manufacturer; **13 contact rep names** applied (9 full + 4 first-name-only). Remaining: (a) delete **GP Batteries Inc** + contact — **manual UI** (MCP has no delete); (b) leftover **"Batteries"** stub decision; (c) **Helen Chan** orphan — leave. |

---

## Blocked on Rob (tracked; not actionable until he rules)
| P | Task | Owner | Status | Risk | Depends on |
|---|---|---|---|---|---|
| **P5** | Contact_Tracking subform (multi-vendor bidding) | Kyle | 🔴 | 🟥 | §13 #1 bidding design. Highest rework risk — spec only until ruling. |
| **P6** | Stage-stuck workflow rule + email notification (SOP rule 4) | Kyle | 🔴 | 🟥 | §13 #1. **Jefferson recommends 3-day threshold (not 14)** — Chat-now, pending Rob; raises report-vs-per-vendor-workflow (the §13 #1 fork). Needs pre-built email notification + `Bid_Entered_Date` field. |
| **P7** | Spend-tier → auto-suggest Approver workflow (SOP rule 5) | Kyle | 🔴 | 🟨 | Spend tiers **don't exist** — Rob/process must define. |
| **P8** | PO approach confirm (fields built; doc-via-template + PDF) | Rob | 🔴 | 🟨 | §13 #2. Fields already live; just needs his confirm. |
| **P9** | Validation rules 1–3 (spec-sheet / FL-validation / winning-vendor save gates) | Kyle | 🔴 | 🟨 | Manual Settings (no MCP). Spec gates these "after module live + test batch validates" → effectively waits for hold lift. |
| **P10** | Re-enable 2FA on `admin@` + Jefferson | Rob | 🔴 | 🟩 | §13 #4. On hold per Rob since 05/20. Single point of failure. |
| **P11** | Vendor / Professional Selection module (clone of Procurement) | Kyle | 🔴 | 🟨 | §13 #3. Deferred — build after subform proven. |

---

## Frozen by production hold (go-live steps)
| P | Task | Owner | Status | Notes |
|---|---|---|---|---|
| **P12** | Load historical Procurement_Items (**35 top-by-spend**, was "197") | Kyle | ⛔ | Jefferson staged 35 (20 Home Depot + 15 Amazon) in `ItemStaging_Procurement_052926.xlsx`. **Prereqs:** normalize Category values (P20); SharePoint folder list to verify Item_Names (Q2); blank `US_Baseline_Cost_Unit` OK for null-price Amazon items (Q3 → yes). |
| **P13** | Live `/tracker` writes to Zoho | Kyle | ⛔ | Demo mode until hold lift **+** Phase 0.5 webapp decision (gate 06/21/26). |
| **P14** | Phase-2 seats: Bea + Crystal + email | Kyle | ⛔ | §13 #5 trigger. |

---

## Jefferson data track (parallel — his docs)
Owned by Jefferson via `JeffersonTasks_Procurement_052926.md`; feeds P12. Not blocking backend.
- Real vendor rep names (11 placeholder contacts) · `Vendor_Type` for Guangdong Yongcheng · 197-item staging sheet · active PO numbers/status · SharePoint folders per item.

---

## Future backlog (lowest priority)
| P | Task | Status | Notes |
|---|---|---|---|
| **P15** | **Alibaba follow-up automation via M365 email connector** | 🟡 Future | Deprioritized 05/30. **Blocked on mailbox access:** connector is bound to `bke@rise8companies.com`, which has no delegate access to `purchasing@` / `jefferson@` (`rentstayable.com`) where Alibaba mail lands. Fix later: either Jefferson/`admin@rentstayable.com` connects M365, or grant `bke@` access to the `purchasing@` shared mailbox (easy only if same M365 tenant — domains differ). ToS-safe; pairs with a one-click capture bookmarklet for chat *content*. Full Alibaba-chat sync is **not possible** (no buyer API). See memory `alibaba-chat-untracked`. |

---

## Inbound from Jefferson (05/30) — new items
| P | Task | Owner | Status | Notes |
|---|---|---|---|---|
| **P16** | Create ~14 new vendor Accounts (multi-country CN/TH/VN/PH) | Kyle | ⛔ | From `IntlVendorContacts`. **Dedupe first** (some are alt contacts of loaded accounts; sourcing agents distinct). Frozen by hold; stage. |
| **P17** | Vendor follow-ups for missing rep data | Jeff | 🟢 | 4 first-name-only (need last + phone), 4 no-name (reply for name), ~30 missing phone. WhatsApp-first: Souxin/TKT/Asico/iSuperhouse. |
| **P18** | Add `Sourcing Agent` to `Vendor_Type` picklist | Kyle | 🟢 | Jing Sourcing, LeeLine = agents, not manufacturers. Manual Settings. |
| **P19** | Add Thailand + Philippines to Country picklist(s) | Kyle | 🟢 | Vendors span beyond CN/VN/IN/TR/PK/KH. |
| **P20** | Normalize staging Category values (singular→plural) | Kyle/Jeff | 🟢 | Staging uses "Appliance"/"Building Material"; picklist is plural — align before P12 load or values won't map. |

---

## Change log
| Date | Change |
|---|---|
| 05/30/26 | Tracker created. Alibaba email-connector work deprioritized to P15 (future) pending mailbox-access fix. |
| 05/30/26 | Jefferson handback processed: §1.1 names + §1.2 Vendor_Type applied to live records; added P16–P20; P12 rescoped 197→35; P6 noted 3-day recommendation (pending Rob). |
