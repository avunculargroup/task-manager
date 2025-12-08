"use client";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/features/dashboard/components/status-alert";
import { ProjectsSidebar } from "@/features/projects/components/projects-sidebar";
import { useProjectsQuery } from "@/features/projects/hooks";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { useTaskRealtime, useTasksQuery } from "@/features/tasks/hooks";
import { useLabelsQuery } from "@/features/labels/hooks";
import { useProjectMembersQuery } from "@/features/projects/hooks";
import { useProjectSelection } from "@/hooks/use-project-selection";

export function DashboardPage() {
  const { profile } = useAuth();
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data ?? [];
  const { selectedProjectId } = useProjectSelection(projects);
  const currentProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const tasksQuery = useTasksQuery(selectedProjectId);
  const labelsQuery = useLabelsQuery(selectedProjectId);
  const membersQuery = useProjectMembersQuery(selectedProjectId);
  useTaskRealtime(selectedProjectId);

  if (projectsQuery.isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTitle>Unable to load projects</AlertTitle>
        <AlertDescription>
          {projectsQuery.error instanceof Error
            ? projectsQuery.error.message
            : "Try refreshing the page."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex min-h-screen gap-6 bg-slate-50 p-6">
      <ProjectsSidebar
        profile={profile}
        projects={projects}
        isLoading={projectsQuery.isLoading}
      />

      <main className="flex-1">
        {selectedProjectId && currentProject ? (
          <TaskBoard
            project={currentProject}
            projectId={selectedProjectId}
            tasksQuery={tasksQuery}
            labelsQuery={labelsQuery}
            membersQuery={membersQuery}
          />
        ) : projectsQuery.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
      <p className="text-sm text-slate-500">
        Create your first project to start collaborating.
      </p>
    </div>
  );
}
