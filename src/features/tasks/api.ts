import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Label, TaskWithRelations } from "@/types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type RawTask = TaskRow & {
  task_labels: { labels: Label }[];
  assignee: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

export interface TaskPayload {
  title: string;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: number;
  projectId: string;
  parentTaskId?: string | null;
  assignedTo?: string | null;
  position?: number;
  labelIds?: string[];
}

const TASK_SELECT = `
  *,
  task_labels:task_labels (
    labels (*)
  ),
  assignee:profiles!tasks_assigned_to_fkey (*)
`;

export async function fetchTasksForProject(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return buildHierarchy((data as RawTask[]) ?? []);
}

export async function createTask(
  supabase: SupabaseClient<Database>,
  payload: TaskPayload,
  userId: string
): Promise<TaskWithRelations> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      due_date: payload.dueDate ?? null,
      due_time: payload.dueTime ?? null,
      priority: payload.priority ?? 3,
      project_id: payload.projectId,
      parent_task_id: payload.parentTaskId ?? null,
      assigned_to: payload.assignedTo ?? null,
      created_by: userId,
      position: payload.position ?? Date.now(),
    })
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await syncLabels(supabase, data.id, payload.labelIds ?? []);

  return buildHierarchy([data as RawTask])[0];
}

export async function updateTask(
  supabase: SupabaseClient<Database>,
  taskId: string,
  payload: Partial<TaskPayload>
): Promise<TaskWithRelations> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: payload.title,
      description: payload.description,
      due_date: payload.dueDate,
      due_time: payload.dueTime,
      priority: payload.priority,
      parent_task_id: payload.parentTaskId,
      assigned_to: payload.assignedTo,
      position: payload.position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw error;
  }

  if (payload.labelIds !== undefined) {
    await syncLabels(supabase, taskId, payload.labelIds);
  }

  return buildHierarchy([data as RawTask])[0];
}

export async function deleteTask(
  supabase: SupabaseClient<Database>,
  taskId: string
) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    throw error;
  }
}

export async function toggleTaskCompletion(
  supabase: SupabaseClient<Database>,
  taskId: string,
  completed: boolean
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return buildHierarchy([data as RawTask])[0];
}

async function syncLabels(
  supabase: SupabaseClient<Database>,
  taskId: string,
  labelIds: string[]
) {
  await supabase.from("task_labels").delete().eq("task_id", taskId);

  if (!labelIds.length) {
    return;
  }

  const rows = labelIds.map((labelId) => ({ task_id: taskId, label_id: labelId }));
  const { error } = await supabase.from("task_labels").insert(rows);
  if (error) {
    throw error;
  }
}

function buildHierarchy(tasks: RawTask[]): TaskWithRelations[] {
  const map = new Map<string, TaskWithRelations>();
  const roots: TaskWithRelations[] = [];

  tasks.forEach((task) => {
    map.set(task.id, {
      ...task,
      labels: (task.task_labels ?? []).map((item) => item.labels),
      assignee: task.assignee,
      subtasks: [],
    });
  });

  map.forEach((task) => {
    if (task.parent_task_id) {
      const parent = map.get(task.parent_task_id);
      if (parent) {
        parent.subtasks = parent.subtasks ?? [];
        parent.subtasks.push(task);
      }
    } else {
      roots.push(task);
    }
  });

  const sortFn = (a: TaskWithRelations, b: TaskWithRelations) =>
    (a.position ?? 0) - (b.position ?? 0);

  map.forEach((task) => {
    if (task.subtasks) {
      task.subtasks.sort(sortFn);
    }
  });

  return roots.sort(sortFn);
}
