"use client";

import { ShieldCheck, UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ProjectMemberWithProfile } from "@/features/tasks/types";

interface ProjectMembersListProps {
  members?: ProjectMemberWithProfile[];
  isLoading: boolean;
}

export function ProjectMembersList({ members = [], isLoading }: ProjectMembersListProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (!members.length) {
    return <p className="text-sm text-slate-500">No teammates yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-2 rounded-2xl border border-slate-100 px-3 py-1.5">
          <AvatarLabel name={member.profiles.full_name ?? member.profiles.email} />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {member.profiles.full_name ?? member.profiles.email}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {member.role === "owner" ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Owner
                </>
              ) : (
                <>
                  <UserRound className="h-3.5 w-3.5 text-slate-400" /> Member
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AvatarLabel({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = ["bg-slate-900", "bg-indigo-600", "bg-amber-600", "bg-emerald-600"];
  const color = colors[name.length % colors.length];

  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white", color)}>
      {initials || "??"}
    </div>
  );
}
