# Taskline — Supabase-powered task manager

Taskline is the MVP implementation of a collaborative task management app described in `PROJECT_IMPLEMENTATION.md`. It couples a Next.js 14 App Router frontend with Supabase Auth, Postgres, and real-time channels to deliver fast task editing, NLP-enabled task capture, and role-aware access controls.

## Key features

- 🔐 **Supabase Auth** with protected route groups, persistent sessions, and password reset helpers.
- 📁 **Projects & members** with owner/member RBAC, auto-membership on creation, and a sidebar navigator.
- ✅ **Tasks, subtasks, labels, and priorities** rendered inline with filtering, search, and quick metadata toggles.
- ⚡ **Real-time sync** via Supabase channels that invalidate the active project query within 200 ms.
- 🧠 **Natural language parsing** (`today`, `tomorrow at 3pm`, `next Monday`, `14/03/2025`, etc.) with unit tests powered by Vitest.
- 🧮 **State architecture** using Zustand for UI/filter state, React Query for server cache, and context-driven auth/session data.
- 🪪 **RLS-compliant Postgres schema** with migrations under `supabase/migrations` that define tables, indexes, and policies from the spec.

## Tech stack

- [Next.js 14 App Router](https://nextjs.org/) + TypeScript
- [Supabase JS & Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Tailwind CSS](https://tailwindcss.com/) with a shadcn-inspired component kit
- [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query](https://tanstack.com/query)
- [date-fns](https://date-fns.org/) for scheduling math
- [Vitest](https://vitest.dev/) + Testing Library for unit coverage

## Getting started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set environment variables**
   - Copy `.env.example` to `.env.local` and fill in:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (only required for local Supabase CLI workflows)
     - `NEXT_PUBLIC_APP_URL` (defaults to `http://localhost:3000`)
   - Optional toggles: `NEXT_PUBLIC_ENABLE_COMMENTS`, `SENTRY_DSN`.

3. **Run Supabase locally (optional but recommended)**
   ```bash
   pnpm dlx supabase start
   pnpm dlx supabase db reset --config ./supabase/config.toml
   ```
   The reset command will apply the schema + RLS policies defined in `supabase/migrations/20251208000100_init.sql`.

4. **Start the dev server**
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` — unauthenticated users land on `/login`, authenticated users on `/dashboard`.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production server |
| `pnpm lint` | Next.js lint rules |
| `pnpm typecheck` | TypeScript `--noEmit` pass |
| `pnpm test` | Run Vitest unit tests (includes NLP parser coverage) |
| `pnpm ci` | Convenience script for lint → typecheck → tests |

## Architecture notes

- **Providers** (`src/components/providers`) wire Supabase, React Query, auth context, and toasts globally.
- **State**
  - Zustand store (`src/features/tasks/store.ts`) tracks the selected project, filters, selected task, and expanded subtasks.
  - React Query handles remote caching for projects, tasks, labels, and project members.
- **Features**
  - Projects UI + mutations live under `src/features/projects`.
  - Tasks UI, API helpers, NLP integration, and drawers live under `src/features/tasks` and `src/features/nlp`.
  - Labels have a lightweight manager component plus CRUD hooks.
- **Routing**
  - `(auth)` route group renders `/login` with a dedicated layout.
  - `(app)` route group enforces Supabase session checks server-side before rendering `/dashboard`.
- **Supabase**
  - SQL migrations define tables (`projects`, `tasks`, `labels`, `task_labels`, `project_members`, `comments`, `profiles`), indexes, triggers, and the RLS matrix outlined in `PROJECT_IMPLEMENTATION.md`.
  - Channel subscriptions in `useTaskRealtime` keep the UI fresh by invalidating the active project query on `INSERT`/`UPDATE`/`DELETE` events.

## Testing & QA checklist

- `pnpm test` runs the NLP parser suite described in Appendix A.
- `pnpm lint` and `pnpm typecheck` should be clean before merging.
- For end-to-end verification, run `pnpm dev`, authenticate via Supabase email/password, and exercise:
  - Create project → auto sidebar update
  - Create tasks/subtasks, toggle completion, edit metadata in the drawer
  - Apply search/priority/label filters & reset
  - Verify label manager CRUD reflects immediately and NLP parsing populates due date/time

## Deployment

- Deploy via Vercel or any Next.js-capable host; ensure environment variables match `.env.example`.
- Apply Supabase migrations to staging/production using `supabase db push` (see Section 15 of the implementation spec for full steps).
- Observability: hook `SENTRY_DSN` when available; the fallback logger emits structured console warnings.

Happy shipping! 🎉
