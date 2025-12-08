import { useEffect } from "react";

import type { Project } from "@/types/database";

import { useTaskStore } from "@/features/tasks/store";

export function useProjectSelection(projects?: Project[]) {
  const selectedProjectId = useTaskStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useTaskStore((state) => state.setSelectedProjectId);

  useEffect(() => {
    if (!projects || projects.length === 0) {
      return;
    }

    const exists = projects.some((project) => project.id === selectedProjectId);
    if (!selectedProjectId || !exists) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  return { selectedProjectId, setSelectedProjectId };
}
