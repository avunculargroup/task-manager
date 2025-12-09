import { useMemo } from "react";

import type { TaskWithRelations } from "@/types/database";

import { useTaskStore } from "./store";

function matchesSearch(task: TaskWithRelations, search: string) {
  if (!search) {
    return true;
  }

  const normalized = search.toLowerCase();
  return (
    task.title.toLowerCase().includes(normalized) ||
    (task.description ?? "").toLowerCase().includes(normalized)
  );
}

function matchesLabels(task: TaskWithRelations, labelIds: string[]) {
  if (!labelIds.length) {
    return true;
  }

  const taskLabelIds = new Set(task.labels?.map((label) => label.id));
  return labelIds.every((id) => taskLabelIds.has(id));
}

function matchesPriority(task: TaskWithRelations, priorities: number[]) {
  if (!priorities.length) {
    return true;
  }

  return priorities.includes(task.priority);
}

function matchesAssignee(task: TaskWithRelations, assigneeId?: string | null) {
  if (!assigneeId) {
    return true;
  }

  return task.assigned_to === assigneeId;
}

export function useFilteredTasks() {
  const { tasks, filters } = useTaskStore((state) => ({
    tasks: state.tasks,
    filters: state.filters,
  }));

  return useMemo(() => {
    const result = tasks.filter((task) => {
      if (!filters.showCompleted && task.completed) {
        return false;
      }

      if (!matchesSearch(task, filters.search)) {
        return false;
      }

      if (!matchesPriority(task, filters.priorities)) {
        return false;
      }

      if (!matchesLabels(task, filters.labelIds)) {
        return false;
      }

      if (!matchesAssignee(task, filters.assigneeId)) {
        return false;
      }

      return true;
    });

    return sortTasks(result, filters.sort);
  }, [tasks, filters]);
}

function sortTasks(tasks: TaskWithRelations[], sort: "position" | "due-date" | "priority") {
  const copy = [...tasks];
  switch (sort) {
    case "due-date":
      return copy.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    case "priority":
      return copy.sort((a, b) => a.priority - b.priority);
    default:
      return copy.sort((a, b) => a.position - b.position);
  }
}
