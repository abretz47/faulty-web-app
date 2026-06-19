# Facilitator Notes – Answer Key

> ⚠️ **DO NOT READ THIS UNTIL AFTER COMPLETING THE PRACTICE RUN.**
>
> This document contains the full list of seeded issues, their root causes, and suggested fixes. Reading it before the exercise will defeat the purpose.

---

## Seeded Issues

### Issue 1 – Authorization Bypass on Task List

| Field | Value |
|---|---|
| **Category** | Security |
| **Severity** | High |
| **Location** | `apps/api/src/routes/tasks.ts` – `GET /projects/:projectId/tasks` |

**Symptom:** Any authenticated user (from any team) can fetch the task list for any project by guessing or knowing a project ID, even if the project belongs to a different team.

**Root cause:** The `GET /` handler queries tasks by `project_id` alone without first verifying that the project's `team_id` matches `req.user.teamId`. The `/api/projects/:id` endpoint correctly enforces team ownership, but the tasks sub-route does not.

**Suggested minimal fix:**
```typescript
// Before the tasks query, check team ownership:
const project = db.prepare(
  'SELECT id FROM projects WHERE id = ? AND team_id = ?'
).get(projectId, req.user!.teamId);
if (!project) {
  res.status(404).json({ error: 'Project not found' });
  return;
}
```

**Suggested test/verification:** Create two users from different teams. Log in as user A and try `GET /api/projects/<team-B-project-id>/tasks` — it should return 404 after the fix, not an empty array.

---

### Issue 2 – Hardcoded JWT Secret

| Field | Value |
|---|---|
| **Category** | Security |
| **Severity** | High |
| **Location** | `apps/api/src/middleware/auth.ts` |

**Symptom:** The JWT signing secret is the static string `'dev-secret-key-2024'` hardcoded in source. Anyone with read access to the repository can forge valid tokens for any user.

**Root cause:** `const JWT_SECRET = 'dev-secret-key-2024'` – no environment variable fallback, no startup validation that the value is set and non-trivial.

**Suggested minimal fix:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET env var must be set to a string of at least 32 characters');
}
```
Add a `.env.example` with `JWT_SECRET=<replace-with-random-secret>` and load it via `dotenv` (or Node's `--env-file` flag) in dev.

**Suggested test/verification:** Start the API without `JWT_SECRET` set and confirm it exits with a clear error message.

---

### Issue 3 – Auth Token Stored in localStorage (XSS-Accessible)

| Field | Value |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Location** | `apps/web/src/api.ts` – `saveToken` / `getToken` |

**Symptom:** The JWT is stored in `localStorage`, making it readable by any JavaScript on the page (including injected scripts via the XSS in Issue 5).

**Root cause:** `localStorage.setItem('auth_token', token)` – `localStorage` has no `HttpOnly` protection. A more secure approach is to use a `HttpOnly` cookie set by the server so client-side scripts can never read the token.

**Suggested minimal fix (short-term):** Migrate to `sessionStorage` to at least limit exposure to the current tab. Longer-term: implement server-side `Set-Cookie: HttpOnly; Secure; SameSite=Strict`.

**Suggested test/verification:** After login, open the browser DevTools console and run `localStorage.getItem('auth_token')` – the full JWT should be readable. After the fix with `HttpOnly` cookies it should return `null`.

---

### Issue 4 – No Validation of Task `status` on Update

| Field | Value |
|---|---|
| **Category** | Security / Reliability |
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/tasks.ts` – `PUT /:taskId` |

**Symptom:** The update endpoint accepts any string for `status` and writes it directly to the database. A client can set `status: 'hacked'` or any other arbitrary value, corrupting the kanban board UI and potentially causing downstream logic errors.

**Root cause:** The task creation endpoint uses `validateCreateTask` from the shared package (which checks the status enum), but the update endpoint applies no equivalent validation.

**Suggested minimal fix:**
```typescript
import { VALID_STATUSES, VALID_PRIORITIES } from '@team-tracker/shared';

if (status && !VALID_STATUSES.includes(status as TaskStatus)) {
  res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  return;
}
```

**Suggested test/verification:** `PUT /api/projects/1/tasks/1` with `{ "status": "invalid_value" }` should return 400 after the fix.

---

### Issue 5 – Stored XSS via `dangerouslySetInnerHTML`

| Field | Value |
|---|---|
| **Category** | Security |
| **Severity** | High (in any non-local deployment) |
| **Location** | `apps/web/src/components/TaskCard.tsx` |

**Symptom:** Task descriptions are rendered as raw HTML using `dangerouslySetInnerHTML`. A user who can create or edit tasks can inject arbitrary HTML/JavaScript that executes in every other user's browser when they view the task board.

**Root cause:** `<div dangerouslySetInnerHTML={{ __html: task.description }} />` passes unsanitised user input straight to the DOM as HTML.

**Suggested minimal fix:** Remove `dangerouslySetInnerHTML` and render the description as plain text:
```tsx
<div style={{ ... }}>{task.description}</div>
```
If rich text is genuinely needed, use a sanitiser such as `DOMPurify` before passing to `dangerouslySetInnerHTML`.

**Suggested test/verification:** Create a task with description `<img src=x onerror="alert(1)">`. Before the fix the alert fires; after the fix it renders as literal text.

---

### Issue 6 – Overly Permissive CORS Configuration

| Field | Value |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Location** | `apps/api/src/index.ts` |

**Symptom:** `cors({ origin: true, credentials: true })` reflects any `Origin` header back as `Access-Control-Allow-Origin` while also setting `Access-Control-Allow-Credentials: true`. This means any website can make credentialed cross-origin requests to the API on behalf of a logged-in user (CSRF-style attack via XHR/fetch, if cookies are ever added).

**Root cause:** `origin: true` is the cors package's shorthand for "mirror whatever Origin the request sends". When combined with `credentials: true`, this is equivalent to allowing every origin to make authenticated requests.

**Suggested minimal fix:**
```typescript
cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
})
```

**Suggested test/verification:** Send a request to the API from a different origin (e.g. `http://localhost:4000`) and confirm the browser blocks it with a CORS error after the fix.

---

### Issue 7 – N+1 Query on Task List

| Field | Value |
|---|---|
| **Category** | Performance |
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/tasks.ts` – `GET /` handler |

**Symptom:** Fetching 20 tasks fires 20 additional `SELECT` queries to resolve assignee names, creating an N+1 pattern. Page load time grows linearly with task count.

**Root cause:** After fetching the task rows, the code loops with `tasks.map` and calls `db.prepare('SELECT name FROM users WHERE id = ?').get(...)` for each task that has an `assignee_id`.

**Suggested minimal fix:** Replace the loop with a single `LEFT JOIN`:
```sql
SELECT t.*, u.name as assignee_name
FROM tasks t
LEFT JOIN users u ON u.id = t.assignee_id
WHERE t.project_id = ?
ORDER BY t.created_at DESC
```

**Suggested test/verification:** Enable SQLite query logging or add a counter. A project with 10 tasks should issue 1 query (not 11) after the fix.

---

### Issue 8 – Unbounded Audit Log Response

| Field | Value |
|---|---|
| **Category** | Performance |
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/audit.ts` |

**Symptom:** `GET /api/audit` returns every row in the `audit_logs` table with no `LIMIT` or pagination. As the table grows (potentially millions of rows in production), this endpoint will time out or OOM the server.

**Root cause:** `db.prepare('SELECT ... FROM audit_logs ... ORDER BY a.created_at DESC').all()` – no limit applied.

**Suggested minimal fix:**
```typescript
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Number(req.query.limit) || 50);
const offset = (page - 1) * limit;

const logs = db.prepare(`... ORDER BY a.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
const total = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number }).count;

res.json({ logs, total, page, limit });
```

**Suggested test/verification:** Insert 1000 audit log rows and verify the endpoint responds in < 50 ms and returns at most `limit` rows.

---

### Issue 9 – `setInterval` Memory Leak in AuditPage

| Field | Value |
|---|---|
| **Category** | Performance / Reliability |
| **Severity** | Low–Medium |
| **Location** | `apps/web/src/pages/AuditPage.tsx` |

**Symptom:** Every time the user navigates to `/audit`, a new `setInterval` is registered but never cleared. After visiting the page N times, there are N concurrent polling loops. In a long-running session this wastes bandwidth and can cause unexpected state updates after the component unmounts.

**Root cause:** `setInterval(fetchLogs, 15000)` inside `useEffect` with no cleanup. The `useEffect` hook requires the cleanup function to be returned so React can call `clearInterval` on unmount.

**Suggested minimal fix:**
```typescript
useEffect(() => {
  const fetchLogs = () => { ... };
  fetchLogs();
  const intervalId = setInterval(fetchLogs, 15000);
  return () => clearInterval(intervalId); // cleanup
}, []);
```

**Suggested test/verification:** Open React DevTools or the Network tab, navigate to `/audit`, navigate away, navigate back. Confirm only one polling request fires every 15 seconds (not two, three, etc.) after the fix.

---

### Issue 10 – Silent Non-Update on `PUT /tasks/:taskId`

| Field | Value |
|---|---|
| **Category** | Reliability |
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/tasks.ts` – `PUT /:taskId` handler |

**Symptom:** If a client sends a `PUT` request for a task ID that does not exist (e.g. a race condition where another user just deleted it), the endpoint returns `{ message: 'Task updated' }` with HTTP 200, even though no row was modified.

**Root cause:** The handler does verify team ownership before the `UPDATE`, but returns `200 { message: 'Task updated' }` unconditionally. The `result.changes` property from better-sqlite3 is not checked to see whether any rows were actually affected.

**Note:** In the current code this is partially mitigated by the existence check with `existing`, but the existing-check and the update are not wrapped in a transaction, creating a TOCTOU window. If the task is deleted between the check and the update, the UPDATE silently affects 0 rows yet the response still says success.

**Suggested minimal fix:** Use a transaction to wrap the ownership check and the update, then check `result.changes`:
```typescript
const updateTask = db.transaction(() => {
  const existing = ...; // re-fetch inside transaction
  if (!existing) return null;
  const result = db.prepare('UPDATE tasks SET ... WHERE id = ?').run(..., taskId);
  return result.changes;
});
const changed = updateTask();
if (!changed) { res.status(404).json({ error: 'Task not found' }); return; }
res.json({ message: 'Task updated' });
```

**Suggested test/verification:** `PUT /api/projects/1/tasks/99999` (non-existent task) should return 404 after the fix. Currently it returns 404 from the pre-check, but deleting the task between check and update (requires concurrency) would silently succeed.

---

### Issue 11 – Task Creation + Audit Log Not Wrapped in a Transaction

| Field | Value |
|---|---|
| **Category** | Reliability |
| **Severity** | Medium |
| **Location** | `apps/api/src/routes/tasks.ts` – `POST /` handler |

**Symptom:** If the `INSERT INTO audit_logs` statement fails (e.g. due to a constraint violation or disk error), the task has already been committed to the database but has no audit trail. The two operations are not atomic.

**Root cause:** The task `INSERT` and the audit log `INSERT` are executed as two separate statements outside of a transaction. SQLite auto-commits each statement individually.

**Suggested minimal fix:**
```typescript
const createTaskWithAudit = db.transaction(() => {
  const taskResult = db.prepare('INSERT INTO tasks ...').run(...);
  db.prepare('INSERT INTO audit_logs ...').run(..., taskResult.lastInsertRowid, ...);
  return taskResult.lastInsertRowid;
});
const taskId = createTaskWithAudit();
```

**Suggested test/verification:** Temporarily break the audit log insert (e.g. pass an invalid `user_id`) and verify that no task row is created either (the transaction rolls back the task insert).

---

### Issue 12 – Date Sort Bug for Tasks Without a Due Date

| Field | Value |
|---|---|
| **Category** | Reliability |
| **Severity** | Low–Medium |
| **Location** | `apps/web/src/pages/TasksPage.tsx` |

**Symptom:** Tasks that have no due date (`dueDate: null`) sort to the very beginning of the list (appearing as if due on 1 January 1970) instead of at the end. This is confusing to users because undated tasks appear more urgent than dated ones.

**Root cause:** `new Date(null)` in JavaScript returns `new Date(0)`, which is the Unix epoch (1970-01-01T00:00:00.000Z). When used in the sort comparator `new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()`, null-due-date tasks receive the lowest possible timestamp and float to the top.

**Suggested minimal fix:**
```typescript
const sorted = [...data].sort((a, b) => {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;  // no due date → sink to bottom
  if (!b.dueDate) return -1;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
});
```

**Suggested test/verification:** Create two tasks — one with a due date of next week and one with no due date. Verify the dated task appears first after the fix.

---

### Issue 13 – Missing Loading State in ProjectsPage

| Field | Value |
|---|---|
| **Category** | Reliability (UX) |
| **Severity** | Low |
| **Location** | `apps/web/src/pages/ProjectsPage.tsx` |

**Symptom:** While the `GET /api/projects` request is in flight, the page renders the "No projects found." empty-state message, causing a flash of misleading content before the real data arrives.

**Root cause:** The component initialises `projects` as an empty array `[]` and begins the fetch asynchronously, but there is no `isLoading` state. The render path goes directly from "empty" to "populated" with no intermediate "loading" state.

**Suggested minimal fix:**
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  projectsApi.list()
    .then(setProjects)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <p>Loading projects…</p>;
```

**Suggested test/verification:** Throttle the network in DevTools to "Slow 3G" and reload the projects page. You should see "Loading projects…" instead of "No projects found." before the data arrives.

---

### Issue 14 – Tests Do Not Cover Invalid Status Values

| Field | Value |
|---|---|
| **Category** | Tooling / Testing |
| **Severity** | Low |
| **Location** | `apps/api/tests/tasks.test.ts` |

**Symptom:** The test suite passes against the current (buggy) code, giving false confidence that update validation is correct. In particular, there is no test verifying that `PUT /:taskId` with `status: 'hacked'` returns 400.

**Root cause:** The tests cover happy-path creation and a successful status update, but omit validation edge cases for the update route — specifically invalid `status` values, invalid `priority` values, and updating a non-existent task ID.

**Suggested minimal fix:** Add test cases:
```typescript
it('rejects invalid status on update', async () => {
  const res = await request(app)
    .put(`/api/projects/${projectId}/tasks/${knownTaskId}`)
    .set('Authorization', `******
    .send({ status: 'not_a_real_status' });
  expect(res.status).toBe(400);
});
```

---

### Issue 15 – Root `typecheck` Script Only Covers the Web Package

| Field | Value |
|---|---|
| **Category** | Tooling |
| **Severity** | Low |
| **Location** | `package.json` (root) |

**Symptom:** Running `pnpm typecheck` from the repository root only type-checks `apps/web`. Type errors in `apps/api` or `packages/shared` go undetected.

**Root cause:**
```json
"typecheck": "pnpm --filter './apps/web' run typecheck"
```
The `--filter` flag restricts execution to the web package. The API and shared packages each have their own `typecheck` scripts, but the root convenience command does not invoke them.

**Suggested minimal fix:**
```json
"typecheck": "pnpm -r run typecheck"
```
This runs `typecheck` in every workspace package that defines the script.

---

## Summary Table

| # | Category | File | Severity |
|---|---|---|---|
| 1 | Security – AuthZ bypass | `apps/api/src/routes/tasks.ts` | High |
| 2 | Security – Hardcoded JWT secret | `apps/api/src/middleware/auth.ts` | High |
| 3 | Security – Token in localStorage | `apps/web/src/api.ts` | Medium |
| 4 | Security – Input validation (status) | `apps/api/src/routes/tasks.ts` | Medium |
| 5 | Security – Stored XSS | `apps/web/src/components/TaskCard.tsx` | High |
| 6 | Security – Permissive CORS | `apps/api/src/index.ts` | Medium |
| 7 | Performance – N+1 query | `apps/api/src/routes/tasks.ts` | Medium |
| 8 | Performance – Unbounded list | `apps/api/src/routes/audit.ts` | Medium |
| 9 | Performance – Memory leak | `apps/web/src/pages/AuditPage.tsx` | Low–Medium |
| 10 | Reliability – Silent non-update | `apps/api/src/routes/tasks.ts` | Medium |
| 11 | Reliability – Missing transaction | `apps/api/src/routes/tasks.ts` | Medium |
| 12 | Reliability – Date sort bug | `apps/web/src/pages/TasksPage.tsx` | Low–Medium |
| 13 | Reliability – Missing loading state | `apps/web/src/pages/ProjectsPage.tsx` | Low |
| 14 | Tooling – Incomplete test coverage | `apps/api/tests/tasks.test.ts` | Low |
| 15 | Tooling – typecheck scope | `package.json` (root) | Low |
