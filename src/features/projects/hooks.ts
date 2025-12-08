"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useSupabase } from "@/hooks/use-supabase";

import {
  createProject,
  fetchProjectMembers,
  fetchProjects,
  removeProject,
  type CreateProjectPayload,
} from "./api";

const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjectsQuery() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => fetchProjects(supabase),
  });
}

export function useCreateProjectMutation() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => {
      if (!user) {
        throw new Error("You must be logged in to create a project");
      }
      return createProject(supabase, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      toast.success("Project created");
    },
    onError: (error) => {
      toast.error("Unable to create project");
      console.error(error);
    },
  });
}

export function useDeleteProjectMutation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => removeProject(supabase, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      toast.success("Project removed");
    },
    onError: () => toast.error("Unable to remove project"),
  });
}

export function useProjectMembersQuery(projectId?: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => {
      if (!projectId) {
        return [];
      }
      return fetchProjectMembers(supabase, projectId);
    },
    enabled: Boolean(projectId),
  });
}
