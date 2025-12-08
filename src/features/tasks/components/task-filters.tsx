"use client";

import { Filter, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, priorityCopy } from "@/lib/utils";
import type { Label as LabelType } from "@/types/database";

import type { ProjectMemberWithProfile } from "@/features/tasks/types";
import { useTaskStore, type TaskFilters } from "@/features/tasks/store";

interface TaskFiltersToolbarProps {
  labels: LabelType[];
  members: ProjectMemberWithProfile[];
  filters: TaskFilters;
  onReset: () => void;
  isLoading: boolean;
}

export function TaskFiltersToolbar({ labels, members, filters, onReset, isLoading }: TaskFiltersToolbarProps) {
  const setFilters = useTaskStore((state) => state.setFilters);

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[220px]">
        <Input
          placeholder="Search tasks"
          value={filters.search}
          onChange={(event) => setFilters({ search: event.target.value })}
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Labels
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2" align="end">
          <p className="text-xs uppercase text-slate-400">Labels</p>
          {isLoading && <p className="text-sm text-slate-500">Loading labels...</p>}
          {!labels.length && !isLoading && <p className="text-sm text-slate-500">No labels yet.</p>}
          {labels.map((label) => (
            <label key={label.id} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={filters.labelIds.includes(label.id)}
                onCheckedChange={(checked) => {
                  const ids = new Set(filters.labelIds);
                  if (checked === true) {
                    ids.add(label.id);
                  } else {
                    ids.delete(label.id);
                  }
                  setFilters({ labelIds: Array.from(ids) });
                }}
              />
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </span>
            </label>
          ))}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ListChecks className="h-4 w-4" /> Assignee
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2" align="end">
          <p className="text-xs uppercase text-slate-400">Members</p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!filters.assigneeId}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  setFilters({ assigneeId: null });
                }
              }}
            />
            Anyone
          </label>
          {members.map((member) => (
            <label key={member.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.assigneeId === member.user_id}
                onCheckedChange={(checked) => {
                  setFilters({ assigneeId: checked === true ? member.user_id : null });
                }}
              />
              {member.profiles.full_name ?? member.profiles.email}
            </label>
          ))}
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((priority) => (
          <button
            key={priority}
            type="button"
            onClick={() => {
              const list = new Set(filters.priorities);
              if (list.has(priority)) {
                list.delete(priority);
              } else {
                list.add(priority);
              }
              setFilters({ priorities: Array.from(list).sort() });
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              filters.priorities.includes(priority)
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600"
            )}
          >
            {priorityCopy[priority]}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <Checkbox
          checked={filters.showCompleted}
          onCheckedChange={(checked) => setFilters({ showCompleted: checked === true })}
        />
        Show completed
      </label>

      <Button variant="ghost" size="sm" type="button" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
