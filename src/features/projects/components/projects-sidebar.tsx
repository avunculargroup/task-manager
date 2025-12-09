"use client";

import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Profile, Project } from "@/types/database";
import { useAuth } from "@/components/providers/auth-provider";

import { ProjectCreateDialog } from "./project-create-dialog";
import { useTaskStore } from "@/features/tasks/store";

interface ProjectsSidebarProps {
  profile: Profile | null;
  projects: Project[];
  isLoading: boolean;
}

export function ProjectsSidebar({ profile, projects, isLoading }: ProjectsSidebarProps) {
  const selectedProjectId = useTaskStore((state) => state.selectedProjectId);
  const setSelectedProject = useTaskStore((state) => state.setSelectedProjectId);
  const { signOut } = useAuth();

  return (
    <aside className="w-72 shrink-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Workspace</p>
        <h2 className="text-lg font-semibold text-slate-900">
          {profile?.full_name ?? profile?.email ?? "Team"}
        </h2>
        <p className="text-sm text-slate-500">{projects.length} projects</p>
      </div>

      <div className="py-4">
        <ProjectCreateDialog />
      </div>

      <ScrollArea className="h-[calc(100vh-220px)] pr-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading projects...
          </div>
        ) : projects.length ? (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => setSelectedProject(project.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm",
                    selectedProjectId === project.id
                      ? "border-slate-900 bg-slate-900/5 text-slate-900"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No projects yet.</p>
        )}
      </ScrollArea>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <Button
          variant="ghost"
          type="button"
          className="w-full justify-start gap-2 text-sm text-slate-500"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
