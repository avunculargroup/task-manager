import type { Database, Label, Profile, Project, TaskWithRelations } from "@/types/database";

export type ProjectMemberWithProfile = Database["public"]["Tables"]["project_members"]["Row"] & {
  profiles: Profile;
};

export type TaskFormValues = {
  title: string;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority: number;
  labelIds: string[];
  parentTaskId?: string | null;
  assignedTo?: string | null;
};

export type TaskComposerProps = {
  projectId: string;
  labels: Label[];
  members: ProjectMemberWithProfile[];
  parentTaskId?: string | null;
  onCreated?: () => void;
};
