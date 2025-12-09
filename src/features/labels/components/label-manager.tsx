"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";

import type { Label as LabelType } from "@/types/database";
import { useCreateLabelMutation, useDeleteLabelMutation } from "@/features/labels/hooks";

const DEFAULT_COLORS = ["#0ea5e9", "#10b981", "#f97316", "#a855f7"];

interface LabelManagerProps {
  projectId: string;
  labels: LabelType[];
}

export function LabelManager({ projectId, labels }: LabelManagerProps) {
  const createMutation = useCreateLabelMutation(projectId);
  const deleteMutation = useDeleteLabelMutation(projectId);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  const handleAdd = () => {
    if (!name) return;
    createMutation.mutate({ name, color });
    setName("");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-medium text-slate-900">Labels</p>
        <p className="text-xs text-slate-500">Organize tasks by context.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label.id}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              type="button"
              className="text-white/70"
              onClick={() => deleteMutation.mutate(label.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!labels.length && <p className="text-sm text-slate-500">No labels yet.</p>}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-2">
          <UILabel>Name</UILabel>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Design" />
        </div>
        <div className="space-y-2">
          <UILabel>Color</UILabel>
          <div className="flex gap-2">
            {DEFAULT_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`h-8 w-8 rounded-full border ${color === hex ? "border-slate-900" : "border-transparent"}`}
                style={{ backgroundColor: hex }}
                onClick={() => setColor(hex)}
              />
            ))}
          </div>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleAdd}
        disabled={!name || createMutation.isPending}
      >
        <Plus className="mr-1 h-4 w-4" /> Add label
      </Button>
    </div>
  );
}
