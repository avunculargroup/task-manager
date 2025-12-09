"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Languages } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Label as LabelType } from "@/types/database";

import { parseTaskInput } from "@/features/nlp/parser";
import type { ProjectMemberWithProfile, TaskComposerProps } from "@/features/tasks/types";
import { useCreateTaskMutation } from "@/features/tasks/hooks";
import { useTaskStore } from "@/features/tasks/store";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().nullable().optional(),
  priority: z.number().min(1).max(4),
  labelIds: z.array(z.string()).default([]),
  assignedTo: z.string().nullable().optional(),
});

export function TaskComposer({ projectId, labels, members, parentTaskId = null, onCreated }: TaskComposerProps) {
  const mutation = useCreateTaskMutation(projectId);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const setExpandedTask = useTaskStore((state) => state.setExpandedTask);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: null,
      dueTime: null,
      priority: 3,
      labelIds: [],
      assignedTo: null,
    },
  });

  const selectedLabels = watch("labelIds");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        title: values.title,
        description: values.description,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        dueTime: values.dueTime ?? null,
        priority: values.priority,
        labelIds: values.labelIds,
        assignedTo: values.assignedTo || null,
        projectId,
        parentTaskId,
      });
      reset({
        title: "",
        description: "",
        dueDate: null,
        dueTime: null,
        priority: values.priority,
        labelIds: [],
        assignedTo: values.assignedTo,
      });
      setExpandedTask(null);
      onCreated?.();
    } catch (error) {
      // errors surfaced via mutation onError
    }
  });

  const handleParseTitle = () => {
    const title = watch("title");
    if (!title) {
      toast.error("Add a title first");
      return;
    }

    const result = parseTaskInput(title);
    setValue("title", result.title);
    if (result.dueDate) {
      setValue("dueDate", result.dueDate.substring(0, 10));
    }
    if (result.dueTime) {
      setValue("dueTime", result.dueTime);
    }
    toast.success("Extracted schedule from title");
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <div className="flex gap-2">
          <Input id="task-title" placeholder="New task" {...register("title")} />
          <Button type="button" variant="secondary" onClick={handleParseTitle}>
            <Languages className="mr-2 h-4 w-4" /> Parse
          </Button>
        </div>
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {advancedOpen && (
        <div className="grid gap-4 md:grid-cols-2">
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
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} placeholder="Details" {...register("description")} />
          </div>
          <div className="md:col-span-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 pt-2">
              {labels.length === 0 && <p className="text-sm text-slate-500">No labels yet.</p>}
              {labels.map((label) => (
                <label
                  key={label.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs",
                    selectedLabels?.includes(label.id)
                      ? "border-slate-900 bg-slate-900/5"
                      : "border-slate-200"
                  )}
                >
                  <Checkbox
                    checked={selectedLabels?.includes(label.id)}
                    onCheckedChange={(checked) => {
                      const current = new Set(selectedLabels ?? []);
                      if (checked === true) {
                        current.add(label.id);
                      } else {
                        current.delete(label.id);
                      }
                      setValue("labelIds", Array.from(current));
                    }}
                  />
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <button
          type="button"
          className="flex items-center gap-1 text-slate-600 underline-offset-2 hover:underline"
          onClick={() => setAdvancedOpen((prev) => !prev)}
        >
          <Calendar className="h-4 w-4" /> {advancedOpen ? "Hide details" : "Add scheduling & metadata"}
        </button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : parentTaskId ? "Add subtask" : "Add task"}
        </Button>
      </div>
    </form>
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
