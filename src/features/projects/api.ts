import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Project, ProjectRole } from "@/types/database";

export type ProjectsResponse = Project[];

export interface CreateProjectPayload {
  name: string;
  color: string;
  description?: string;
}

export async function fetchProjects(
  supabase: SupabaseClient<Database>
): Promise<ProjectsResponse> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  payload: CreateProjectPayload,
  userId: string
) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      color: payload.color,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const { error: membershipError } = await supabase.from("project_members").insert({
    project_id: data.id,
    role: "owner",
    user_id: userId,
  });

  if (membershipError) {
    throw membershipError;
  }

  return data;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  payload: Partial<CreateProjectPayload>
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeProject(
  supabase: SupabaseClient<Database>,
  projectId: string
) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw error;
  }
}

export async function fetchProjectMembers(
  supabase: SupabaseClient<Database>,
  projectId: string
) {
  const { data, error } = await supabase
    .from("project_members")
    .select("*, profiles:profiles(*)")
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMemberRole(
  supabase: SupabaseClient<Database>,
  memberId: string,
  role: ProjectRole
) {
  const { data, error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
