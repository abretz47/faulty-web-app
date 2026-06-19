# Code Audit & Repair – Practice Assessment

**Time limit: 90 minutes**

---

## Overview

You have been handed a functioning full-stack TypeScript web application. Your job is to audit the codebase, identify real problems, fix them, and document your reasoning — all within 90 minutes.

This is not a trick question. The application runs, tests pass, and the UI works. The issues are the kinds of things that quietly accumulate in real codebases over time.

---

## The Application

**Team Task Tracker** – A small project/task management tool for engineering teams.

- Users log in and see their team's projects and tasks.
- Tasks can be created, updated, and deleted.
- An admin audit log shows recent activity.

See `README.md` for setup instructions and demo credentials.

---

## Your Deliverables

1. **Fixes** committed as atomic Git commits.
   - Each commit should address one issue.
   - Commit message format: `fix(<category>): <short description>`
   - Example: `fix(security): validate task status against allowed enum values`

2. **Written justifications** in `ASSESSMENT_NOTES_TEMPLATE.md`.
   - Fill in the template for each issue you find and fix.
   - If you find an issue but cannot fix it in time, document it anyway.

---

## Ground Rules

- **Preserve existing behaviour.** Do not refactor working code unless it directly relates to a bug.
- **Prioritise root-cause fixes.** Do not apply surface-level workarounds.
- **Maintain backward compatibility.** API contracts and database schema should not break existing consumers.
- **Run the tests.** Make sure `pnpm test` passes before and after your changes.
- **Write or update tests** to cover any fix that is testable.
- **Do not read `FACILITATOR_NOTES.md`** until after you complete the exercise.

---

## Suggested Approach

| Time | Activity |
|---|---|
| 0–15 min | Read the code. Orient yourself. `pnpm install && pnpm dev`. |
| 15–30 min | Identify issues. Fill in the notes template as you go. |
| 30–75 min | Implement fixes, one commit per fix. Run tests after each. |
| 75–90 min | Write up any remaining notes. Final `pnpm test` and `pnpm typecheck`. |

---

## Scoring Criteria

When reviewing your work, the assessor will look for:

- **Correctness** – Does the fix actually address the root cause?
- **Scope** – Is the change minimal and surgical, or does it introduce drift?
- **Safety** – Does the fix introduce new problems?
- **Reasoning** – Is the written justification clear and accurate?
- **Tests** – Are changes covered by automated tests where practical?

---

## Getting Started

```bash
pnpm install
pnpm dev
# Visit http://localhost:5173
```

Good luck.
