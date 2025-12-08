import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Label } from "@/types/database";

export async function fetchLabels(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<Label[]> {
  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createLabel(
  supabase: SupabaseClient<Database>,
  projectId: string,
  payload: Pick<Label, "name" | "color">,
  userId: string
) {
  const { data, error } = await supabase
    .from("labels")
    .insert({
      name: payload.name,
      color: payload.color,
      project_id: projectId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLabel(
  supabase: SupabaseClient<Database>,
  labelId: string,
  payload: Partial<Pick<Label, "name" | "color">>
) {
  const { data, error } = await supabase
    .from("labels")
    .update(payload)
    .eq("id", labelId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteLabel(
  supabase: SupabaseClient<Database>,
  labelId: string
) {
  const { error } = await supabase.from("labels").delete().eq("id", labelId);
  if (error) {
    throw error;
  }
}
