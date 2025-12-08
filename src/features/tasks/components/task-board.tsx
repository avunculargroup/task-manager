"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Label, Project, TaskWithRelations } from "@/types/database";

import { LabelManager } from "@/features/labels/components/label-manager";
import { useFilteredTasks } from "@/features/tasks/selectors";
import { useTaskStore } from "@/features/tasks/store";
import type { ProjectMemberWithProfile } from "@/features/tasks/types";

import { TaskComposer } from "./task-composer";
import { TaskDetailsDrawer } from "./task-details-drawer";
import { TaskFiltersToolbar } from "./task-filters";
import { TaskList } from "./task-list";

interface TaskBoardProps {
  project: Project;
  projectId: string;
  tasksQuery: UseQueryResult<TaskWithRelations[]>;
  labelsQuery: UseQueryResult<Label[]>;
  membersQuery: UseQueryResult<ProjectMemberWithProfile[]>;
}

export function TaskBoard({ project, projectId, tasksQuery, labelsQuery, membersQuery }: TaskBoardProps) {
  const filteredTasks = useFilteredTasks();
  const filters = useTaskStore((state) => state.filters);
  const resetFilters = useTaskStore((state) => state.resetFilters);

  const openTasks = filteredTasks.filter((task) => !task.completed).length;

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
              <p className="text-xs uppercase tracking-wide text-slate-500">Active project</p>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
            {project.description ? (
              <p className="text-sm text-slate-500">{project.description}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{openTasks} open / {filteredTasks.length} total</p>
            <Badge variant="secondary" className="mt-1">
              <Sparkles className="mr-1 h-3 w-3" /> Real-time sync
            </Badge>
          </div>
        </div>
        <Separator className="my-6" />
        <TaskFiltersToolbar
          labels={labelsQuery.data ?? []}
          members={membersQuery.data ?? []}
          filters={filters}
          isLoading={labelsQuery.isLoading}
          onReset={resetFilters}
        />
      </header>

      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900">
            Create task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskComposer
            projectId={projectId}
            labels={labelsQuery.data ?? []}
            members={membersQuery.data ?? []}
          />
        </CardContent>
      </Card>

      <LabelManager projectId={projectId} labels={labelsQuery.data ?? []} />

      <section className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
        {tasksQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tasks...
          </div>
        ) : filteredTasks.length ? (
          <TaskList tasks={filteredTasks} members={membersQuery.data ?? []} />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-slate-500">
            <p>No tasks match the current filters.</p>
            <button className="text-slate-900 underline" type="button" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        )}
      </section>

      <TaskDetailsDrawer labels={labelsQuery.data ?? []} members={membersQuery.data ?? []} />
    </div>
  );
}
