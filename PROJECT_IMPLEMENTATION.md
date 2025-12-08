Below is a **fully rewritten, upgraded, airtight MVP Implementation Specification** for your task-management application. It incorporates every improvement identified earlier: clarified scope, detailed requirements, RLS policies, UX expectations, acceptance criteria, state-management rules, real-time sync logic, error handling, and more.

This is now a document a team could build from with minimal ambiguity.

---

# **Task Management Application — MVP Implementation Specification (v1.0)**

*(Rewritten + Expanded from original document )*

---

# **0. Build Readiness Snapshot**

This section communicates whether every prerequisite for Sprint 0 is in place. Status values: ✅ ready, ⚠️ partial / needs follow-up, 🚧 blocked.

| Item / Decision                    | Status | Owner    | Notes                                                                  |
| ---------------------------------- | ------ | -------- | ---------------------------------------------------------------------- |
| Scope + requirements               | ✅     | Product  | MVP features + acceptance criteria captured across Sections 4–16.      |
| UX mocks + component inventory     | ✅     | Design   | Figma v3 signed off; tokens queued for Tailwind config export.         |
| Supabase schema + migrations       | ✅     | Backend  | DDL, constraints, and ordering rules defined in Section 8 & Appendix B.|
| RLS policy coverage                | ✅     | Backend  | Policies drafted in Section 9; Supabase migration file ready for PR.   |
| State management architecture      | ✅     | Frontend | Zustand + Context responsibilities finalized (Section 7).              |
| Tracker story breakdown           | ⚠️     | Product  | Epics exist; sub-task pointing + dependency tagging still pending.     |
| Test harness + CI configuration    | ⚠️     | DevEx    | Vitest + Playwright runners scaffolded; pipeline dry-run outstanding.  |
| Observability + logging plan       | 🚧    | Platform | Sentry selected but DSN + staging env plumbing not yet provisioned.    |
| Environment variables verification | ⚠️     | DevEx    | `env.mjs` schema drafted; staging secrets awaiting security approval.  |
| Runbook / rollback plan            | ⚠️     | Platform | Draft outline exists; needs concrete rollback + comms steps.           |

**Go / No-Go criteria before Sprint 1 kicks off**

1. Tracker tickets mirror Sections 4–15 with estimates and dependency links.
2. Supabase migrations (schema + policies) reviewed, applied to staging, and snapshot committed.
3. CI pipeline proves lint → unit → integration → e2e on a sample PR.
4. `env.mjs` validated against real staging secrets in Vercel preview + Supabase local dev.
5. Observability decision implemented (Sentry DSN wired) or fallback console logging documented in Section 13/15.

---

# **1. Project Overview**

A lightweight, collaborative task management web application designed for small teams (2–10 users). The MVP focuses on simplicity, speed, and shared visibility across team members. The system supports Projects, Tasks, Subtasks, Labels, Priorities, Assignments, Comments, and basic Natural Language Input.

Primary device focus: **Desktop-first**, with mobile-friendly layouts included in Phase 2.

---

# **2. Non-Functional Requirements**

| Area            | Requirement                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Performance     | Dashboard loads in <300 ms after Supabase query resolves. Task list rendering under 16ms (smooth scroll). |
| Scalability     | Support up to 10 users per project, up to 5k tasks without UI degradation.                                |
| Reliability     | All changes propagate in ≤200ms via Supabase real-time.                                                   |
| Security        | Full RLS on every data table. Only project members may read/write project data.                           |
| Error Handling  | Friendly UI error states for all API operations. No raw Supabase error messages exposed.                  |
| Browser Support | Latest Chrome, Firefox, Safari, Edge.                                                                     |
| Testing         | Unit tests for parsing + utils; integration tests for task CRUD; E2E for core flows.                      |
| Observability   | Client + server errors surfaced via Sentry (or fallback) with project + user metadata.                    |

---

# **3. User Roles & Permission Model**

There are two role types within a project:

* **Owner** — full rights over the project, tasks, labels, members.
* **Member** — can read and modify all tasks in the project but cannot remove the owner or delete the entire project.

### **RBAC Matrix**

| Operation                | Owner | Member             |
| ------------------------ | ----- | ------------------ |
| Create project           | ✔     | ✖                  |
| Delete project           | ✔     | ✖                  |
| Invite/remove members    | ✔     | ✖                  |
| Create/edit/delete tasks | ✔     | ✔                  |
| Assign tasks             | ✔     | ✔                  |
| Add/edit labels          | ✔     | ✔ (within project) |
| Add comments             | ✔     | ✔                  |
| Manage subtasks          | ✔     | ✔                  |

---

# **4. MVP Scope — Functional Requirements (Phase 1)**

## **4.1 Core Features + Acceptance Criteria**

### **1. Authentication**

* Users sign up / log in via Supabase Auth.
* Logged-in users must see dashboard automatically.
* Logged-out users redirected to `/login`.

**Done when:**

* Session persisted across refresh.
* Protected routes enforce authentication.

---

### **2. Projects**

**Required screens:**

* Projects list
* Project view (tasks + sidebar)

**Users can:**

* Create a project with name + color.
* See all projects they belong to.
* Switch between projects.

**Done when:**

* Project members auto-created when the creator makes a project.
* RLS ensures only members see project data.

---

### **3. Tasks**

Users can:

* Create, edit, delete tasks.
* Set: title, description, due date, due time, priority, project, assignment.
* Mark complete / incomplete.

UI Requirements:

* Clean list view.
* Inline editing for title.
* Empty state (“No tasks yet — create one!”).
* Error + loading indicators.

---

### **4. Subtasks**

* Single-level hierarchy (no nested subtasks beyond 1 level).
* Subtasks displayed under parent with indentation.
* Completion of subtasks does not auto-complete parent.

---

### **5. Labels**

* Labels belong to a project.
* Tasks can have multiple labels.
* Label chips visible on TaskCard.

---

### **6. Priority System**

* Values P1–P4 (int 1–4).
* Constraints enforced in DB.

---

### **7. Basic Natural Language Input**

**Supported patterns:**

* `today`, `tomorrow`, `next week`
* Weekdays: `next monday`
* Date formats:

  * `DD/MM/YYYY`
  * `D/M/YYYY`
* Time formats:

  * `at 3pm`, `3:30 pm`, `14:00`

**Output:**
`{ title: string, dueDate: Date | null, dueTime: string | null }`

**Graceful fallback:**
If no match → treat entire string as title.

---

# **5. Out-of-Scope for MVP**

(Anything here cannot block Phase 1.)

* Recurring tasks
* Kanban view
* Calendar view
* File uploads
* Advanced NLP
* Tasks spanning multiple projects
* User tagging (@mentions)

---

# **6. System Architecture**

## **6.1 Tech Stack**

* **Frontend:** Next.js 14 App Router + TypeScript
* **Styling:** Tailwind CSS, shadcn/ui
* **Backend:** Supabase (Postgres, Auth, Storage, Real-time)
* **State:** Zustand for app state, Context for auth
* **Validation:** Zod
* **Date Handling:** date-fns

---

# **7. State Management Architecture**

## **Zustand holds:**

* Current project ID
* Task list (derived from server)
* Sort + filter preferences
* UI state (expanded subtasks, selected task)
* Real-time task updates

## **React Context holds:**

* User session
* Loading/auth state
* Profile data

**Rule:**
Zustand never stores derived data permanently; all persistent data lives in Supabase.

---

# **8. Database Schema (Improved)**

## **Improvements added:**

* Indexes
* Check constraints
* Required columns
* Ordering for tasks/subtasks
* Updated_at triggers

### **Key additional columns**

* `position INTEGER NOT NULL DEFAULT 0` on tasks
* `CHECK (priority BETWEEN 1 AND 4)`

### **Indexes**

```sql
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
```

---

# **9. RLS Policies (Required for MVP)**

### **profiles**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read/update themselves"
ON profiles FOR SELECT USING (auth.uid() = id);
```

### **projects**

```sql
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view projects"
ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members m
    WHERE m.project_id = projects.id AND m.user_id = auth.uid()
  )
);
```

### **tasks**

```sql
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks"
ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members m
    WHERE m.project_id = tasks.project_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can modify tasks"
ON tasks FOR INSERT, UPDATE, DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members m
    WHERE m.project_id = tasks.project_id AND m.user_id = auth.uid()
  )
);
```

(Similar policies applied to labels, task_labels, comments.)

---

# **10. Real-Time Synchronization Spec**

### **Events to listen to**

* `INSERT` for tasks
* `UPDATE` for tasks
* `DELETE` for tasks

### **Client handling rules**

* Merge updates by ID.
* Apply update only if `updated_at` is newer.
* If editing conflict occurs:

  * Show toast: “Task updated by another user — refreshing.”
  * Auto-refresh from server.

### **Subscription lifecycle**

* Subscribe when project changes.
* Unsubscribe on project exit or route change.

---

# **11. UI / UX Requirements**

## **Global UI Rules**

* Loading states for all async actions (skeleton or spinner).
* Error banners for failures.
* Empty states for lists.
* Never leave the user without visual feedback.

## **TaskCard**

* Title
* Priority badge
* Optional labels
* Checkbox to toggle completion
* Click to expand details panel

## **TaskForm**

* Should support NLP entry in title field.
* Must show extracted due date/time preview.

---

# **12. API / Service Contracts**

### **Create Task**

**Input**

```ts
{
  title: string;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority: number;
  parentTaskId?: string | null;
  assignedTo?: string | null;
}
```

**Output**

```ts
{
  id: string;
  ...taskFields
}
```

**Errors**

* `400` invalid title
* `403` user not member of project
* `500` DB error

---

# **13. Error Handling Strategy**

### **Client**

* All failed Supabase calls show toast:

  * “Couldn’t save task. Try again.”
* Form-level validation shows inline errors.
* Authentication failures redirect to login with message.

### **Logging**

* Integrate with Sentry (Phase 2) or console.warn fallback for MVP.

---

# **14. Testing Requirements**

### **Unit Tests**

* NLP parsing
* Utility functions
* Validation schemas

### **Integration Tests**

* Task CRUD flows
* Subtask ordering
* Label assignment

### **E2E Tests**

* Login → Create Project → Add Task → Complete Task
* Real-time update scenario with two browser sessions

---

# **15. Deployment Requirements**

### **Environment Variables**

* Strongly validated using Zod via `env.mjs`.

### **Supabase Setup**

* Run migrations via CLI
* Confirm RLS enabled
* Test policies manually before release

### **Next.js**

* Deploy on Vercel, using server components where possible
* Ensure streaming safe through suspense boundaries

---

# **16. Phase Plan**

### **Phase 1 (Weeks 1–3)**

* Auth
* Projects
* Tasks
* Labels
* Subtasks
* NLP (basic)
* RLS
* UI components

### **Phase 2 (Weeks 4–6)**

* Comments
* Mobile responsiveness
* Improved NLP
* Real-time conflict UI

### **Phase 3 (Weeks 7–8)**

* Project sharing workflows
* Advanced collaboration UX

---

# **17. Build Preparation Checklist**

## **17.1 Engineering & DevEx**

* ✅ Source-control hygiene: feature branches must include Supabase migration SQL + generated types.
* ⚠️ CI validation: confirm GitHub Actions (or equivalent) run lint → unit → integration → e2e within <10 min wall time; parallelize where possible.
* ⚠️ Local dev parity: document how to run Supabase locally with seed data plus how to point the Next.js app at staging for real-time tests.
* ⚠️ Feature flags: define `NEXT_PUBLIC_ENABLE_COMMENTS` flag (default false) so Phase 2 work can merge safely during Phase 1 hardening.
* ✅ Performance budgets added to PR template (TTFB < 300ms, scripting < 200ms on cold load).

## **17.2 Product & Design**

* Ensure every feature in Section 4 maps to 1+ tracker stories with acceptance criteria copy/pasted.
* Attach latest Figma links + redlines to each story; note viewport expectations (desktop first, tablet fallback).
* Provide sample content for empty states, errors, and tooltips to avoid placeholder text during implementation.
* Finalize “definition of done” checklist shared with engineers (i18n copy review, accessibility check, analytics event added).

## **17.3 Risks & Mitigations**

| Risk                                   | Impact                                  | Owner    | Mitigation                                                                 |
| -------------------------------------- | ---------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Supabase rate limits w/ real-time load | Missed <200ms propagation requirement    | Backend  | Load-test channel fan-out using script; throttle to project-specific topics|
| NLP edge cases (non AU date formats)   | Incorrect due dates                      | Frontend | Add feature flag + telemetry to log unmatched inputs for future training.  |
| Staging env secrets delay              | Blocks CI + preview validation           | DevEx    | Request approval now; fall back to per-dev `.env.local` encrypted vault.   |
| Observability tooling decision lag     | Reduced ability to triage prod issues    | Platform | Commit to Sentry + console fallback by Sprint 1 retro; add to release gate.|

---

# **18. Appendices**

# **Appendix A — Natural Language Parsing Specification (MVP)**

This appendix defines **exactly what patterns must be supported**, how they should be parsed, and how conflicts or ambiguities are handled.

---

## **A.1 Supported Date Keywords**

| Input            | Meaning                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `today`          | Current date                                                                                            |
| `tomorrow`       | Current date + 1                                                                                        |
| `next week`      | Monday of next week                                                                                     |
| `next <weekday>` | Next occurrence of weekday. If today is Monday and user types “next Monday”, return Monday *next week*. |

---

## **A.2 Supported Weekday Names**

Case-insensitive:

```
monday, tuesday, wednesday, thursday, friday, saturday, sunday
```

Regex:

```
/\b(next )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
```

---

## **A.3 Supported Date Formats**

Australian-friendly (MVP):

| Format     | Example    | Regex                                 |
| ---------- | ---------- | ------------------------------------- |
| DD/MM/YYYY | 14/02/2025 | `/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/` |
| D/M/YYYY   | 7/6/2025   | Same as above, supports single digits |

**Assumption:**
If date is ambiguous (e.g., 1/2/2025), interpret as **1st of February**.

---

## **A.4 Supported Time Formats**

| Format        | Example | Regex                               |          |
| ------------- | ------- | ----------------------------------- | -------- |
| “at 3pm”      | at 3pm  | `/\bat (\d{1,2})(?::(\d{2}))?\s*(am | pm)\b/i` |
| “3:30 pm”     | 3:30 pm | `/\b(\d{1,2}):(\d{2})\s*(am         | pm)\b/i` |
| “14:00” (24h) | 14:00   | `/\b(\d{1,2}):(\d{2})\b/`           |          |

Output time format must be:
`HH:MM` (24-hour string)

---

## **A.5 Extraction Rules**

1. Extract **date**, then **time**, then treat remainder as **title**.
2. If multiple date formats are detected → use the first detection.
3. If no date/time detected → return entire input as title.

---

## **A.6 Example Inputs & Outputs**

### Example 1

Input: `Finish report by tomorrow at 3pm`
Output:

```json
{
  "title": "Finish report by",
  "dueDate": "<ISO date for tomorrow>",
  "dueTime": "15:00"
}
```

### Example 2

Input: `Call Sarah next Thursday`
Output:

```json
{
  "title": "Call Sarah",
  "dueDate": "<ISO next Thursday>",
  "dueTime": null
}
```

### Example 3

Input: `Review budget 14/03/2025`
Output:

```json
{
  "title": "Review budget",
  "dueDate": "2025-03-14",
  "dueTime": null
}
```

---

# **Appendix B — Database ERD and Table Descriptions**

This appendix clarifies all entities, their relationships, and key constraints.

---

## **B.1 Entities & Relationships**

```
profiles       1 ────< projects (created_by)
projects       1 ────< project_members >──── 1 profiles
projects       1 ────< tasks
tasks          1 ────< tasks (subtasks via parent_task_id)
tasks          1 ────< comments
tasks          1 ────< task_labels >──── 1 labels
projects       1 ────< labels
```

---

## **B.2 Table Descriptions**

### **profiles**

Stores extended user information.

| Column     | Type      | Notes            |
| ---------- | --------- | ---------------- |
| id         | UUID      | FK to auth.users |
| email      | TEXT      | Unique           |
| full_name  | TEXT      | Optional         |
| avatar_url | TEXT      | Optional         |
| created_at | timestamp | Default now      |

---

### **projects**

Stores project metadata.

| Column      | Type      | Notes          |
| ----------- | --------- | -------------- |
| id          | UUID      | PK             |
| name        | TEXT      | Required       |
| description | TEXT      | Optional       |
| color       | TEXT      | Hex code       |
| created_by  | UUID      | FK to profiles |
| created_at  | timestamp |                |
| updated_at  | timestamp |                |

---

### **project_members**

Controls access rights.

| Column     | Type      | Notes          |
| ---------- | --------- | -------------- |
| id         | UUID      | PK             |
| project_id | UUID      | FK to projects |
| user_id    | UUID      | FK to profiles |
| role       | TEXT      | owner / member |
| created_at | timestamp |                |

Unique constraint: `(project_id, user_id)`

---

### **labels**

Labels per project.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| name       | TEXT      |
| color      | TEXT      |
| project_id | UUID      |
| created_by | UUID      |
| created_at | timestamp |

---

### **tasks**

Main task table.

| Column         | Type      | Notes         |
| -------------- | --------- | ------------- |
| id             | UUID      | PK            |
| title          | TEXT      | Required      |
| description    | TEXT      | Optional      |
| due_date       | timestamp | Optional      |
| due_time       | TIME      | Optional      |
| priority       | INTEGER   | 1–4           |
| completed      | BOOLEAN   | Default false |
| completed_at   | timestamp |               |
| project_id     | UUID      | FK            |
| parent_task_id | UUID      | FK to tasks   |
| created_by     | UUID      | FK            |
| assigned_to    | UUID      | FK            |
| position       | INTEGER   | Ordering      |
| created_at     | timestamp |               |
| updated_at     | timestamp |               |

Indexes added for performance.

---

### **task_labels**

Many-to-many link.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| task_id    | UUID      |
| label_id   | UUID      |
| created_at | timestamp |

---

### **comments**

Simple threaded comments.

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| content    | TEXT      |
| task_id    | UUID      |
| user_id    | UUID      |
| created_at | timestamp |

---

# **Appendix C — Task Ordering Specification**

This appendix defines how ordering works for tasks and subtasks using a `position` column (integer).

---

## **C.1 Rules for Parent Tasks**

* Each task in a project has a `position`.
* Lower numbers appear first.
* When a task is created:

  * Default to `position = MAX(position) + 1`.

---

## **C.2 Rules for Subtasks**

* Subtasks are ordered *relative to siblings* (other tasks sharing the same `parent_task_id`).
* Sorting is always:

  1. Parent tasks first (no parent_task_id), sorted by position
  2. Subtasks immediately below parent, sorted by position

---

## **C.3 Drag-and-Drop (Future Phase, Not MVP)**

If drag-and-drop is implemented later:

* When reordering, frontend calculates new numeric positions.
* Backend updates only changed tasks.
* Avoid floating-point hacks (use integer positions only).

---

## **C.4 Example Ordering**

### Sample Table

| id | title      | parent | position |
| -- | ---------- | ------ | -------- |
| 1  | Task A     | null   | 1        |
| 2  | Task B     | null   | 2        |
| 3  | Subtask B1 | 2      | 1        |
| 4  | Subtask B2 | 2      | 2        |
| 5  | Task C     | null   | 3        |

### Display Order

1. Task A
2. Task B
3. Subtask B1
4. Subtask B2
5. Task C

---
