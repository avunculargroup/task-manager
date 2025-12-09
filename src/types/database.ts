export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          color?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: "owner" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: "owner" | "member";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "member";
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          name: string;
          color: string;
          project_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          project_id: string;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          priority: number;
          completed: boolean;
          completed_at: string | null;
          project_id: string;
          parent_task_id: string | null;
          created_by: string;
          assigned_to: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: number;
          completed?: boolean;
          completed_at?: string | null;
          project_id: string;
          parent_task_id?: string | null;
          created_by?: string;
          assigned_to?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: number;
          completed?: boolean;
          completed_at?: string | null;
          parent_task_id?: string | null;
          assigned_to?: string | null;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_labels: {
        Row: {
          id: string;
          task_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          label_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          content: string;
          task_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          task_id: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
    };
  };
}

export type ProjectRole = Database["public"]["Tables"]["project_members"]["Row"]["role"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Label = Database["public"]["Tables"]["labels"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TaskWithRelations = Task & {
  labels: Label[];
  assignee?: Profile | null;
  parent?: Task | null;
  subtasks?: TaskWithRelations[];
};
