# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is (and isn't)

This is **not a code repository.** It is the working knowledge base and document archive for the **RISE8 Companies / Stayable overseas procurement rollout on Zoho CRM.** Everything here is Markdown specs, HTML tracker artifacts, Excel imports/exports, and one Windows batch launcher. There is no build, no test suite, no linter, no application to run.

### Repository structure (reorganized 05/29/26; root tidied 05/30/26)

Docs referenced below by bare filename now live in subfolders — resolve them via this map:

| Location | Contents |
|---|---|
| **root** | Deploy + entry files only: `index.html`, `vercel.json`, `ZohoProcurementTracker_052626.html` (Vercel static deploy — must stay at root), `CLAUDE.md`, `start-claude.bat`, and `Zoho_Architecture.md` (the canonical architecture + CEO proposal, single Rob-facing file) |
| **`docs/`** | Planning & process: `ZohoCRM_Rollout_052126.md`, `ZohoCRM_Todo_052126.md`, `ProjectInstructions_OverseasProc_052626.md`, `ZohoProcurementProcessGuide_RISE8_052926.md`, `ZohoBuildTracker_NonProfitSales_Kate_052926.md`, `ZohoTaskUpdate_RISE8_052726.md` |
| **`specs/`** | Module specs: `ZohoModuleSpec_ProcurementItems_052626.md`, `ZohoModuleSpec_ContactTrackingSubform_052926.md`, `ZohoModuleSpec_VendorBids_052926.md` |
| **`reference/`** | Source inputs & reference: `chart 1.jpg`, `ZohoCRM_VendorList_052626.xlsx`, `NonProfitPartners_ImportSource_053026.csv`, `ProcurementItemsModuleLayout_052826.png` |
| **`outputs/`** | Zoho import files (org `/outputs` convention) |
| **`infographics/`** | Standalone HTML visual one-pagers (internal, `noindex`, **not** Vercel deploy files): `ProcurementProcessInfographic_RISE8_053026.html`, `ArchitectureComparison_CurrentVsRob_053026.html` |

> Vercel static deploy depends on `index.html`, `vercel.json`, and `ZohoProcurementTracker_052626.html` staying at root (the `/tracker` rewrite resolves to a root file). Do not move them into subfolders.

Stayable is an extended-stay hotel brand with 8 Florida properties (IDs: 4645, 2295, 6802, 812, 5399, 2535, 44199, 8700). The procurement workflow sources FF&E, OS&E, appliances, building materials, and soft goods overseas and brings recommendations to Rob Beyer (CEO) for approval. Zoho CRM is being reintroduced as the system of record after a prior deployment was abandoned due to module sprawl.

## Project ownership

**Kyle Estocapio (`bke@rise8companies.com`)** is the project spearhead as of 05/27/26. Holds Zoho super-admin access (via `admin@rentstayable.com`) and Vercel admin. **All Phase 0/1 tasks default to Kyle as owner** unless explicitly reassigned in the Todo. Rob Beyer remains the approval authority on procurement decisions (vendor selection, PO issuance, architectural shifts); Jefferson Gomez remains the day-to-day procurement operator inside Zoho. When a task says "Owner: Kyle," it means Kyle executes; when it says "Approver: Rob," it means the decision still routes through Rob before action.

## Single-branch workflow

The remote (`github.com/Stayable/purchasing`) has **only `main`**. There are no feature branches, no PRs by default. Commit and push directly to `main`. The three `claude/*` branches that previously existed were deleted on 05/27/26 — do not recreate that pattern.

`start-claude.bat` is the local launcher: it `cd`s into `C:\Users\Kyle Estocapio\Git-Claude\purchasing`, checks out `main`, pulls, and starts Claude.

## How the documents fit together

The repo has three layers that must stay in sync. When a decision changes, update all three or the project drifts.

1. **`ProjectInstructions_OverseasProc_052626.md`** — the operational doctrine. Defines the 5-stage workflow (Spec → Bid → Level → FL-Validate → Recommend), Florida validation rules (humidity, salt air, hurricane code, 120V/UL-ETL electrical), automatic rejection criteria, and the SharePoint folder structure. This is what governs day-to-day procurement decisions. **Note the architectural contradiction:** this doc says "Item = Zoho Deal" but has been superseded by the 05/27 pivot below.

2. **`ZohoModuleSpec_ProcurementItems_052626.md`** — the load-bearing technical spec. 21 fields (19 custom + 2 system), 7 picklists, 5 workflow rules, 5 layout sections plus a related-lists section. **This is the architecture-of-record** after the 05/27/26 pivot from Deals pipeline → dedicated `Procurement_Items` custom module. When the module is actually built in Zoho, this spec is the source of truth.

3. **`ZohoCRM_Rollout_052126.md`** + **`ZohoCRM_Todo_052126.md`** — the rollout plan and the live task list. The Rollout doc contains the decision log; the Todo tracks task status. **Always update both when a decision is made or a task changes state.** The decision log entries are dated and cite the originating session — keep that pattern.

The `ZohoTaskUpdate_RISE8_052726.md` is an imported doc from a different (test-account) source chat. Its 9 tasks are the active work plan but the file itself is historical — do not edit it; update the Todo instead.

## Architecture pivot (05/27/26) — keep this straight

The original 05/21 plan used **a Procurement pipeline inside the standard Deals module** with custom fields. That was reversed on 05/27/26. The current architecture is:

- **Item = Procurement_Items custom module record** (not a Deal). 21 fields, single pipeline "Overseas Procurement", 10-value Stage picklist.
- **Vendor = Account.** Unchanged. 19 Alibaba Accounts + 20 Contacts were imported 05/26/26 and remain valid; they attach to Procurement_Items as the "Linked Vendors" related list, not as Deal parents.
- **Activity = Note/Task on the Procurement_Items record.**
- **Decision = `Decision_Notes` field on the Procurement_Items record.** Never in email.

`ProjectInstructions_OverseasProc_052626.md` still reads as if Item = Deal because it predates the pivot. Task 9 in the Todo covers updating that doc + the HTML tracker artifact once the module is live.

## Production Zoho account

| | |
|---|---|
| Tier | Professional ($35/seat/month, monthly billing) |
| Seats | 3 |
| Users | `admin@rentstayable.com` (Rob, Super Admin), `jefferson@rentstayable.com` (Jefferson, Administrator), `rb@rise8companies.com` (Rob's working account) |

The 05/27 task update doc references a separate test-account Zoho instance — do not confuse the two. Task 1 of that doc (subscription upgrade) is N/A for our production account, which is already on Professional.

## Tooling constraints to know up front

- **Zoho MCP is required to execute Tasks 2–4** (build the Procurement_Items module, deploy fields/picklists, configure workflow rules). If `/mcp` shows no Zoho server, the build cannot proceed from this session. The fallback is writing a click-by-click UI walkthrough Jefferson executes manually in Zoho Settings.
- **No Smartsheet connector** in any standard session here, despite the org-level rule about routing tasks to the Action Items Staging Sheet (1981210199805828). Document tasks in the Todo; surface them to a Smartsheet-enabled session or to the user for manual entry.
- **Procurement decisions are explicitly out-of-scope for Smartsheet.** The org-level Smartsheet rule applies only to action items / follow-ups, not procurement items. Two different objects, two different systems. Do not collapse them.

## File naming convention (mandatory)

Every artifact produced in this project: `DocType_Identifier_MMDDYY.ext`. Identifier is the property ID for property-specific files (e.g., `InvestorLetter_6802_050326.docx`), the Zoho Procurement_Items `Item_Name` for procurement files (`SpecSheet_QueenMattress_052626.xlsx`), or the entity/matter name otherwise. No spaces, no extra underscores inside segments. The Item_Name on a procurement record must match its SharePoint folder name verbatim.

## When making changes

- Update the **decision log in `ZohoCRM_Rollout_052126.md`** for any architectural shift, with the date and the reasoning (including trade-offs acknowledged). This is the audit trail.
- Update the **`Last Updated:` line** at the top of any doc you modify.
- If you make a decision that contradicts `ProjectInstructions_OverseasProc_052626.md` or the original Phase 1 Deals-based plan, **say so explicitly** in the commit and the decision log — those docs are partially superseded but still referenced.
- Don't invent procurement data (vendor names, prices, HTS codes, decisions). The Operating Instructions are strict about this: if a number is unknown, say so. If a vendor reference doesn't exist, say so.
