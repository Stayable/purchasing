---
name: resume
description: Use at session start to recover context for the Stayable overseas-procurement Zoho rollout. Reads the live Todo doc and recent git log, then surfaces open tasks and next steps. Keep output under 20 lines.
---

# /resume — Session resume for the purchasing repo

This repo is the document archive for the **RISE8 / Stayable overseas-procurement Zoho CRM rollout** (see `CLAUDE.md`). No build, no tests — context lives in the Markdown.

## Steps

1. **Read the live task list:**
   - `docs/ZohoCRM_Todo_052126.md` — the canonical Todo. Open tasks + status.
   - `docs/ZohoTaskUpdate_RISE8_052726.md` — the imported 9-task active work plan (historical doc, do not edit; mirror status into the Todo).
2. **Check recent activity:** `git log --oneline -10` to see what shipped recently.
3. **Check MCP availability:** Note whether a Zoho MCP server is connected — Tasks 2–4 (module build, fields, workflow rules) require it. If absent, the fallback is a click-by-click walkthrough for Jefferson.
4. **Cross-reference the architecture-of-record:** `specs/ZohoModuleSpec_ProcurementItems_052626.md` is the source of truth post-05/27 pivot. The big-picture map is `Zoho_Architecture.md` (root). If a question touches module structure, fields, picklists, or workflow, this is the doc to cite.

## Output format (under 20 lines)

```
## Session resume

**Current focus:** [1 line — pulled from the most recent Todo entry or decision log entry]

**Open tasks (top 5 from docs/ZohoCRM_Todo_052126.md):**
- [ ] [task] — [status]
- ...

**Recent commits:**
- [hash] [subject]
- ...

**Blockers / notes:**
- Zoho MCP: [connected / not connected] — [implication]
- [any other blocker called out in the Todo]

**Suggested next step:** [one concrete action]
```

## Rules

- Do **not** read the full body of the spec docs unless a task requires it — the file names + the section in `CLAUDE.md` are usually enough.
- Do **not** invent task status. If the Todo doesn't say, say "status unclear in Todo."
- Do **not** create a `todo.md` — the project tracker is `docs/ZohoCRM_Todo_052126.md`. Stay consistent with the file-naming convention (`DocType_Identifier_MMDDYY`).
- Smartsheet routing: procurement items are explicitly out-of-scope for the Action Items Staging Sheet. Only surface non-procurement follow-ups there.
