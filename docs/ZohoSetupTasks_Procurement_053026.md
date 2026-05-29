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
| **P2** | Relabel `PO_Number` field → "PO Number" (drop underscore) | Kyle | 🟢 | 🟩 | Cosmetic, 2 min in Settings. |
| **P3** | `/tracker` UI polish in demo mode (Vercel) | Kyle | 🟢 | 🟩 | No live writes; safe. |
| **P4** | Account/Contact hygiene | Kyle/Jeff | 🟢 | 🟩 | (a) Delete **GP Batteries Inc** + its contact — Jefferson approved; **manual UI** (MCP has no delete). (b) Decide leftover empty **"Batteries"** stub. (c) **Guangdong Yongcheng** `Vendor_Type` blank — needs Jefferson's value. (d) **Helen Chan** orphan contact — leave per Jefferson. |

---

## Blocked on Rob (tracked; not actionable until he rules)
| P | Task | Owner | Status | Risk | Depends on |
|---|---|---|---|---|---|
| **P5** | Contact_Tracking subform (multi-vendor bidding) | Kyle | 🔴 | 🟥 | §13 #1 bidding design. Highest rework risk — spec only until ruling. |
| **P6** | Stage-stuck >14d workflow rule + email notification (SOP rule 4) | Kyle | 🔴 | 🟥 | §13 #1 (tied to bidding/follow-up). Needs pre-built email notification. |
| **P7** | Spend-tier → auto-suggest Approver workflow (SOP rule 5) | Kyle | 🔴 | 🟨 | Spend tiers **don't exist** — Rob/process must define. |
| **P8** | PO approach confirm (fields built; doc-via-template + PDF) | Rob | 🔴 | 🟨 | §13 #2. Fields already live; just needs his confirm. |
| **P9** | Validation rules 1–3 (spec-sheet / FL-validation / winning-vendor save gates) | Kyle | 🔴 | 🟨 | Manual Settings (no MCP). Spec gates these "after module live + test batch validates" → effectively waits for hold lift. |
| **P10** | Re-enable 2FA on `admin@` + Jefferson | Rob | 🔴 | 🟩 | §13 #4. On hold per Rob since 05/20. Single point of failure. |
| **P11** | Vendor / Professional Selection module (clone of Procurement) | Kyle | 🔴 | 🟨 | §13 #3. Deferred — build after subform proven. |

---

## Frozen by production hold (go-live steps)
| P | Task | Owner | Status | Notes |
|---|---|---|---|---|
| **P12** | Load 197 historical Procurement_Items | Kyle | ⛔ | Staged offline by Jefferson; load when hold lifts. |
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

## Change log
| Date | Change |
|---|---|
| 05/30/26 | Tracker created. Alibaba email-connector work deprioritized to P15 (future) pending mailbox-access fix. |
