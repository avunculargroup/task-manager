import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { TaskWithRelations } from "@/types/database";

type SortOption = "position" | "due-date" | "priority";

export type TaskFilters = {
  search: string;
  showCompleted: boolean;
  priorities: number[];
  labelIds: string[];
  assigneeId?: string | null;
  sort: SortOption;
};

interface TaskStore {
  selectedProjectId: string | null;
  tasks: TaskWithRelations[];
  filters: TaskFilters;
  expandedTaskId: string | null;
  selectedTaskId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  setTasks: (tasks: TaskWithRelations[]) => void;
  upsertTask: (task: TaskWithRelations) => void;
  removeTask: (taskId: string) => void;
  setFilters: (updater: Partial<TaskFilters>) => void;
  setExpandedTask: (taskId: string | null) => void;
  setSelectedTask: (taskId: string | null) => void;
  resetFilters: () => void;
}

const defaultFilters: TaskFilters = {
  search: "",
  showCompleted: true,
  priorities: [],
  labelIds: [],
  assigneeId: null,
  sort: "position",
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      selectedProjectId: null,
      tasks: [],
      filters: defaultFilters,
      expandedTaskId: null,
      selectedTaskId: null,
      setSelectedProjectId: (projectId) =>
        set({
          selectedProjectId: projectId,
          selectedTaskId: null,
          expandedTaskId: null,
          tasks: [],
        }),
      setTasks: (tasks) => set({ tasks }),
      upsertTask: (task) => {
        const tasks = get().tasks;
        const existingIndex = tasks.findIndex((t) => t.id === task.id);
        if (existingIndex >= 0) {
          const clone = [...tasks];
          clone[existingIndex] = task;
          set({ tasks: clone });
        } else {
          set({ tasks: [...tasks, task] });
        }
      },
      removeTask: (taskId) =>
        set({ tasks: get().tasks.filter((task) => task.id !== taskId) }),
      setFilters: (updater) =>
        set({
          filters: {
            ...get().filters,
            ...updater,
          },
        }),
      setExpandedTask: (taskId) => set({ expandedTaskId: taskId }),
      setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: "taskline-store",
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        filters: state.filters,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === \"undefined\") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as Storage;
        }

        return window.sessionStorage;
      }),
    }
  )
);
