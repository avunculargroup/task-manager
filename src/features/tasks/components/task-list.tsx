"use client";

import { ChevronDown, ChevronRight, PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, getPriorityColor, priorityCopy } from "@/lib/utils";
import type { TaskWithRelations } from "@/types/database";

import { useDeleteTaskMutation, useToggleTaskMutation } from "@/features/tasks/hooks";
import { useTaskStore } from "@/features/tasks/store";

interface TaskListProps {
  tasks: TaskWithRelations[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} depth={0} members={members} />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  depth,
}: {
  task: TaskWithRelations;
  depth: number;
}) {
  const toggleMutation = useToggleTaskMutation(task.project_id);
  const deleteMutation = useDeleteTaskMutation(task.project_id);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTask = useTaskStore((state) => state.setSelectedTask);
  const expandedTask = useTaskStore((state) => state.expandedTaskId);
  const setExpanded = useTaskStore((state) => state.setExpandedTask);

  const handleToggle = (checked: boolean) => {
    toggleMutation.mutate({ taskId: task.id, completed: checked });
  };

  const handleDelete = () => {
    deleteMutation.mutate(task.id);
  };

  return (
    <li className="py-2">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl px-3 py-2 text-sm",
          selectedTaskId === task.id ? "bg-slate-50" : "bg-white"
        )}
        style={{ paddingLeft: depth * 20 + 12 }}
      >
        {task.subtasks && task.subtasks.length > 0 ? (
          <button
            type="button"
            className="mt-0.5 text-slate-400"
            onClick={() => setExpanded(expandedTask === task.id ? null : task.id)}
          >
            {expandedTask === task.id ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}

        <Checkbox checked={task.completed} onCheckedChange={(checked) => handleToggle(checked === true)} />

        <div className="flex-1">
          <button
            type="button"
            className="text-left"
            onClick={() => setSelectedTask(task.id)}
          >
            <p className={cn("font-medium", task.completed && "text-slate-400 line-through")}>{task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge className={cn("border", getPriorityColor(task.priority))}>{priorityCopy[task.priority]}</Badge>
              {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
              {task.due_time && <span>{task.due_time}</span>}
              {task.labels?.map((label) => (
                <span
                  key={label.id}
                  className="rounded-full px-2 py-0.5 text-[10px] text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {task.assignee && (
            <span>{task.assignee.full_name ?? task.assignee.email}</span>
          )}
          <Button variant="ghost" size="icon" type="button" onClick={() => setSelectedTask(task.id)}>
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" type="button" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {task.subtasks && task.subtasks.length > 0 && expandedTask === task.id && (
        <ul>
          {task.subtasks.map((subtask) => (
            <TaskRow
              key={subtask.id}
              task={subtask}
              depth={depth + 1}
              members={members}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
