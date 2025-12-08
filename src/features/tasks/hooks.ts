"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useSupabase } from "@/hooks/use-supabase";

import {
  createTask,
  deleteTask,
  fetchTasksForProject,
  toggleTaskCompletion,
  updateTask,
  type TaskPayload,
} from "./api";
import { useTaskStore } from "./store";

const TASKS_QUERY_KEY = "tasks";

export function useTasksQuery(projectId?: string | null) {
  const supabase = useSupabase();
  const setTasks = useTaskStore((state) => state.setTasks);

  const query = useQuery({
    queryKey: [TASKS_QUERY_KEY, projectId],
    queryFn: () => {
      if (!projectId) {
        return [];
      }
      return fetchTasksForProject(supabase, projectId);
    },
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (query.data) {
      setTasks(query.data);
    }
  }, [query.data, setTasks]);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
    }
  }, [projectId, setTasks]);

  return query;
}

export function useCreateTaskMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaskPayload) => {
      if (!user) {
        throw new Error("Missing user context");
      }
      return createTask(supabase, payload, user.id);
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
      toast.success("Task created");
      return task;
    },
    onError: (error) => {
      console.error(error);
      toast.error("Unable to create task");
    },
  });
}

export function useUpdateTaskMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<TaskPayload> }) =>
      updateTask(supabase, taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
      toast.success("Task updated");
    },
    onError: () => toast.error("Unable to update task"),
  });
}

export function useDeleteTaskMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(supabase, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Unable to delete task"),
  });
}

export function useToggleTaskMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      toggleTaskCompletion(supabase, taskId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
    },
    onError: () => toast.error("Unable to update task status"),
  });
}

export function useTaskRealtime(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, projectId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase, queryClient]);
}
