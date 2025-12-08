create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#6366f1',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date timestamptz,
  due_time time,
  priority integer not null default 3 check (priority between 1 and 4),
  completed boolean not null default false,
  completed_at timestamptz,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, label_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projects_timestamp
before update on public.projects
for each row execute procedure public.handle_updated_at();

create trigger update_tasks_timestamp
before update on public.tasks
for each row execute procedure public.handle_updated_at();

create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_parent on public.tasks(parent_task_id);
create index if not exists idx_tasks_due on public.tasks(due_date);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Members can view projects" on public.projects
  for select using (
    exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid()
    )
  );

create policy "Owners manage projects" on public.projects
  for update using (
    exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid() and m.role = 'owner'
    )
  ) with check (
    exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "Owners delete projects" on public.projects
  for delete using (
    exists (
      select 1 from public.project_members m
      where m.project_id = projects.id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "Users can insert projects" on public.projects
  for insert with check (auth.uid() = created_by);

create policy "Members read project membership" on public.project_members
  for select using (
    exists (
      select 1 from public.project_members m
      where m.project_id = project_members.project_id and m.user_id = auth.uid()
    )
  );

create policy "Users join projects" on public.project_members
  for insert with check (auth.uid() = user_id);

create policy "Members manage tasks" on public.tasks
  for all using (
    exists (
      select 1 from public.project_members m
      where m.project_id = tasks.project_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.project_members m
      where m.project_id = tasks.project_id and m.user_id = auth.uid()
    )
  );

create policy "Members manage labels" on public.labels
  for all using (
    exists (
      select 1 from public.project_members m
      where m.project_id = labels.project_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.project_members m
      where m.project_id = labels.project_id and m.user_id = auth.uid()
    )
  );

create policy "Members manage task labels" on public.task_labels
  for all using (
    exists (
      select 1 from public.tasks t
      join public.project_members m on m.project_id = t.project_id
      where t.id = task_labels.task_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.project_members m on m.project_id = t.project_id
      where t.id = task_labels.task_id and m.user_id = auth.uid()
    )
  );

create policy "Members manage comments" on public.comments
  for all using (
    exists (
      select 1 from public.tasks t
      join public.project_members m on m.project_id = t.project_id
      where t.id = comments.task_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.project_members m on m.project_id = t.project_id
      where t.id = comments.task_id and m.user_id = auth.uid()
    )
  );
