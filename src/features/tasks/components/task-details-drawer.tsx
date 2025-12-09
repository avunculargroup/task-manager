"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Label as LabelType, TaskWithRelations } from "@/types/database";

import type { ProjectMemberWithProfile } from "@/features/tasks/types";
import { useDeleteTaskMutation, useToggleTaskMutation, useUpdateTaskMutation } from "@/features/tasks/hooks";
import { useTaskStore } from "@/features/tasks/store";
import { TaskComposer } from "./task-composer";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().nullable().optional(),
  priority: z.number().min(1).max(4),
  labelIds: z.array(z.string()).default([]),
  assignedTo: z.string().nullable().optional(),
});

interface TaskDetailsDrawerProps {
  labels: LabelType[];
  members: ProjectMemberWithProfile[];
}

export function TaskDetailsDrawer({ labels, members }: TaskDetailsDrawerProps) {
  const { tasks, selectedTaskId } = useTaskStore((state) => ({
    tasks: state.tasks,
    selectedTaskId: state.selectedTaskId,
  }));
  const selectedTask = findTaskById(tasks, selectedTaskId);
  const setSelectedTask = useTaskStore((state) => state.setSelectedTask);
  const setExpandedTask = useTaskStore((state) => state.setExpandedTask);
  const updateMutation = useUpdateTaskMutation(selectedTask?.project_id);
  const toggleMutation = useToggleTaskMutation(selectedTask?.project_id);
  const deleteMutation = useDeleteTaskMutation(selectedTask?.project_id);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(selectedTask),
  });

  useEffect(() => {
    reset(buildDefaults(selectedTask));
  }, [selectedTask, reset]);

  if (!selectedTask) {
    return null;
  }

  const labelIds = watch("labelIds") ?? [];

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        taskId: selectedTask.id,
        payload: {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
          dueTime: values.dueTime ?? null,
          priority: values.priority,
          labelIds: values.labelIds,
          assignedTo: values.assignedTo || null,
        },
      });
    } catch (error) {
      // handled by mutation toast
    }
  });

  const handleToggle = (checked: boolean) => {
    toggleMutation.mutate({ taskId: selectedTask.id, completed: checked });
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedTask.id, {
      onSuccess: () => setSelectedTask(null),
    });
  };

  return (
    <aside className="fixed right-6 top-6 z-40 w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">Task details</p>
        <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div className="flex items-center gap-3">
          <Checkbox checked={selectedTask.completed} onCheckedChange={(checked) => handleToggle(checked === true)} />
          <Input className="text-lg" {...register("title")} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={4} placeholder="Add more context" {...register("description")} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Due date">
            <Input type="date" {...register("dueDate")} />
          </Field>
          <Field label="Due time">
            <Input type="time" {...register("dueTime")} />
          </Field>
          <Field label="Priority">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              {...register("priority", { valueAsNumber: true })}
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  P{value}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              {...register("assignedTo")}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.user_id}>
                  {member.profiles.full_name ?? member.profiles.email}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <Label>Labels</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-xs text-white",
                  labelIds.includes(label.id) ? "opacity-100" : "opacity-40"
                )}
                style={{ backgroundColor: label.color }}
                onClick={() => {
                  const next = new Set(labelIds);
                  if (next.has(label.id)) {
                    next.delete(label.id);
                  } else {
                    next.add(label.id);
                  }
                  setValue("labelIds", Array.from(next));
                }}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete task
          </Button>
          <Button type="submit" disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <Label>Subtasks</Label>
        <div className="mt-2">
          <TaskComposer
            projectId={selectedTask.project_id}
            labels={labels}
            members={members}
            parentTaskId={selectedTask.id}
            onCreated={() => setExpandedTask(selectedTask.id)}
          />
        </div>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function buildDefaults(task?: TaskWithRelations) {
  if (!task) {
    return {
      title: "",
      description: "",
      dueDate: null,
      dueTime: null,
      priority: 3,
      labelIds: [] as string[],
      assignedTo: null,
    };
  }

  return {
    title: task.title,
    description: task.description ?? "",
    dueDate: task.due_date ? task.due_date.substring(0, 10) : null,
    dueTime: task.due_time ?? null,
    priority: task.priority,
    labelIds: task.labels?.map((label) => label.id) ?? [],
    assignedTo: task.assigned_to,
  };
}

function findTaskById(tasks: TaskWithRelations[], taskId?: string | null): TaskWithRelations | undefined {
  if (!taskId) {
    return undefined;
  }

  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }
    if (task.subtasks) {
      const nested = findTaskById(task.subtasks, taskId);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}
