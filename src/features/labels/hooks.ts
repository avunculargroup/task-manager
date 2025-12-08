"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useSupabase } from "@/hooks/use-supabase";

import { createLabel, deleteLabel, fetchLabels, updateLabel } from "./api";

export function useLabelsQuery(projectId?: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: () => {
      if (!projectId) {
        return [];
      }
      return fetchLabels(supabase, projectId);
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateLabelMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; color: string }) => {
      if (!projectId || !user) {
        throw new Error("Missing project context");
      }
      return createLabel(supabase, projectId, payload, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels", projectId] });
      toast.success("Label saved");
    },
    onError: () => toast.error("Unable to save label"),
  });
}

export function useUpdateLabelMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; color?: string };
    }) => updateLabel(supabase, id, data),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["labels", projectId] });
      }
      toast.success("Label updated");
    },
    onError: () => toast.error("Unable to update label"),
  });
}

export function useDeleteLabelMutation(projectId?: string | null) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => deleteLabel(supabase, labelId),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["labels", projectId] });
      }
      toast.success("Label deleted");
    },
    onError: () => toast.error("Unable to delete label"),
  });
}
