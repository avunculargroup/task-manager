"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCreateProjectMutation } from "@/features/projects/hooks";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  color: z.string().min(1),
});

const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#f43f5e",
];

export function ProjectCreateDialog() {
  const mutation = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: COLORS[0],
    },
  });

  const color = watch("color");

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="sm" type="button">
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" autoFocus {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              rows={3}
              placeholder="Optional context for teammates"
              {...register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              {COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue("color", hex)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    color === hex ? "border-slate-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {color === hex ? <Palette className="h-4 w-4 text-white" /> : null}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
