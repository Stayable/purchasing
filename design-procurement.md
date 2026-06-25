# Design brief — Stayable Procurement Portal redesign

*Prompt to paste into Claude (design). Edit the **bracketed decisions** before sending — they change the output.*

---

## The ask

Redesign the visual system and layout of the **Stayable Procurement Review Portal** — an internal React SPA where the CEO reviews and approves overseas-procurement decisions and the purchasing manager tracks vendor quotes. It is now the **system of record** (the CEO committed to it over a third-party tool), so it has to look credible in an executive review *and* hold up to daily operational use.

I want a cohesive, intentional design — not a template. Surprise me on direction, but respect the constraints and content below.

## Who uses it

- **Rob (CEO) — approver / reviewer.** Opens it to see what needs his decision, compare vendor quotes side-by-side, and approve/award/decline with a note. Wants signal, not noise. He sees this in front of others.
- **Jefferson (purchasing manager) — daily operator.** Tracks items through the pipeline, watches which vendor threads have gone quiet, manages quotes. Lives in it.

[**Primary audience to optimize for: Rob's executive review. Jefferson's density second.** — adjust if you'd weight it the other way.]

## What it does (so the design reflects real content)

An **item** (e.g. "Queen Mattresses", "Bath Towels 600GSM") moves through a procurement pipeline:
`Spec → Bid → Level → FL-Validate → Recommend → Submitted → Approved / Approved-with-Conditions / Declined / Need-More-Info`.

Each item carries:
- **Property** it's for (one of 9 Florida extended-stay hotels, or portfolio-wide) and an **approver tier** driven by spend.
- **Vendor quotes** — multiple offers per item, each with unit cost, freight, tariff, and two computed **landed-cost** figures (total + per-unit). The recommended/lowest-landed quote is highlighted; awarding picks one explicitly.
- A **Florida-validation** status (humidity / salt-air / hurricane-code / electrical gates) — pass/fail matters visually.
- **Vendor communications** — per-quote email threads (inbound + our replies) with an **attention signal**: "⚠ awaiting our reply", "⏳ silent ≥7 days". This is a key at-a-glance health indicator across items.
- A **decision record** when terminal — approver, date, and a required justification note.

## Current information architecture (keep unless you have a strong reason)

Left sidebar nav, persistent KPI row across the top, then the active view:

- **Home** — dashboard/landing
- **Queue** — items awaiting approval (two-pane: list + detail), with a "≥7 days awaiting" stale filter
- **Board** — pipeline by stage (kanban-ish columns + detail pane)
- **Items** — all items (list + detail with quote-comparison table + comms panel)
- **Tracker** — pipeline grouped by stage
- **Decisions** — log of past decisions with notes
- **Spend** — pending / approved rollups, over-$100K flag
- **How it works** / **Architecture** — explainer pages (operating model, 5-stage workflow, roles, the 3-module Zoho structure behind it)

KPI row shows spend (pending/approved) and item counts.

## The core design problem to fix

The current CSS is **two clashing systems bolted together**:
- The data views (Queue / Board / Items / Decisions / Spend) are **light** — `#f1f5f9` background, white cards, `#1e293b` slate sidebar, `#2563eb` blue accent, slate-blue badges.
- The newer pages (Home / Tracker / How-it-works / Architecture / the comms panel) are **dark** — `#1c1c1e` panels, light-on-dark text, different accent (`#7aa7ff`).

**Pick one coherent direction and apply it across every view.** This is the single most important outcome. [**Default: a refined light/professional system (reads better in an exec review, matches the data tables). Open to a polished dark system if you make the whole thing consistent.**]

## Design direction (guidance, not a spec)

- **Aesthetic target:** institutional-grade, calm, dense-but-legible — closer to a Linear / Stripe-dashboard / investment-banking-tool feel than a consumer SaaS. The parent firm formats financials to a Goldman Sachs aesthetic (dark headers, clean grid, no chartjunk); the portal should feel of-a-piece with that.
- **Money and counts** are the content — tabular numerals, clear hierarchy, never decorative.
- **Status is everything** — stages, FL pass/fail, attention badges, award/recommended tags. Give the badge/chip system a deliberate, consistent color language (it's currently ad hoc). Map it to meaning: neutral / in-progress / needs-attention / approved / rejected.
- **Side-by-side quote comparison** is the marquee moment — make comparing landed costs across vendors genuinely easy to scan, with the recommended row obvious.
- **The attention signal** (awaiting-reply / silent ≥7d) should be visible at the list level, not buried.
- Restraint over flourish. No gradients-for-the-sake-of-it, no chartjunk. One accent color, used with intent.

## Hard constraints

- **Stack:** Vite + React (`.jsx`), `react-router-dom`, plain hand-written CSS in one `styles.css` (CSS custom properties welcome). **No CSS framework, no Tailwind, no component library.** `recharts` is the only chart dep in use — fine to keep, prefer not to add deps.
- It builds to a committed static `review/` dir and is served at the site root; it's a login-gated SPA. **Don't change the build/deploy model or the routing** — just the look, layout, and component styling.
- Fully **responsive** — collapses cleanly to tablet/mobile (sidebar hides under ~768px today).
- Self-contained: **no external fonts, CDNs, or remote assets** (CSP + offline-safe). System font stack or inline/embedded only.
- Keep it **accessible** — real contrast ratios, focus states, semantic markup.

## What I want back

1. A short **design rationale** — the direction you chose and why, the color/type system (tokens), and how the status/badge language maps to meaning.
2. A **rebuilt `styles.css`** (or token sheet + per-component styles) implementing one coherent system across all views.
3. Updated **component markup** where the structure needs to change to support the new design — call out which `.jsx` files change. Prioritize: **Sidebar, KPI row, Queue (two-pane), the quote-comparison table, status/badge system, comms panel.** The explainer pages (How-it-works / Architecture) are lowest priority.
4. Note anything you'd change about the IA, but **don't restructure routes** without flagging it first.

Start with the rationale and the token system, then show the highest-impact view (the Queue or the Items quote-comparison) before doing the full sweep, so I can react early.
