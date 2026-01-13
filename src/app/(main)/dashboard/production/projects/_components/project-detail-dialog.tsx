"use client";

import { useState } from "react";

import Link from "next/link";

import { Calendar, Clock, DollarSign, Eye, Film, FolderKanban, LayoutGrid, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  profile_picture: string | null;
}

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  total_budget: number | null;
  start_date: string | null;
  target_completion_date: string | null;
  description: string | null;
  created_at: string;
  total_episodes: number;
  completed_episodes: number;
  avg_progress: number;
}

const PROJECT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  film: { label: "Film", color: "text-blue-700", bgColor: "bg-blue-100" },
  series: { label: "Series", color: "text-purple-700", bgColor: "bg-purple-100" },
  documentary: { label: "Documentary", color: "text-teal-700", bgColor: "bg-teal-100" },
  variety: { label: "Variety Show", color: "text-pink-700", bgColor: "bg-pink-100" },
  acara: { label: "Acara", color: "text-green-700", bgColor: "bg-green-100" },
  iklan: { label: "Iklan", color: "text-orange-700", bgColor: "bg-orange-100" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planning: { label: "Planning", variant: "secondary" },
  "in-progress": { label: "In Progress", variant: "default" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  "on-hold": { label: "On Hold", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

interface ProjectDetailDialogProps {
  project: Project;
  teamMembers: TeamMember[];
  trigger?: React.ReactNode;
}

export function ProjectDetailDialog({ project, teamMembers, trigger }: ProjectDetailDialogProps) {
  const [open, setOpen] = useState(false);

  const typeConfig = PROJECT_TYPE_CONFIG[project.type] || PROJECT_TYPE_CONFIG.series;
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG["in-progress"];

  const daysUntilCompletion = project.target_completion_date
    ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const totalBudget = project.total_budget || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(typeConfig.bgColor, typeConfig.color, "dark:bg-opacity-20")}>{typeConfig.label}</Badge>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
          <DialogDescription>{project.description || "No description provided"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Overall Progress
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold">{project.avg_progress}%</span>
              </div>
              <Progress value={project.avg_progress} className="h-3" />
            </div>
          </div>

          <Separator />

          {/* Episode Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Film className="h-4 w-4" />
                <span>Total Episodes</span>
              </div>
              <p className="text-2xl font-bold">{project.total_episodes}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <LayoutGrid className="h-4 w-4" />
                <span>Completed</span>
              </div>
              <p className="text-2xl font-bold">
                {project.completed_episodes}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ {project.total_episodes}</span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Timeline Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <p className="font-medium">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Target Completion</span>
                <p
                  className={cn(
                    "font-medium",
                    daysUntilCompletion !== null && daysUntilCompletion < 0 && "text-red-600",
                    daysUntilCompletion !== null &&
                      daysUntilCompletion <= 7 &&
                      daysUntilCompletion >= 0 &&
                      "text-orange-600",
                  )}
                >
                  {project.target_completion_date
                    ? new Date(project.target_completion_date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
                {daysUntilCompletion !== null && project.target_completion_date && (
                  <p
                    className={cn(
                      "text-sm",
                      daysUntilCompletion < 0
                        ? "text-red-600"
                        : daysUntilCompletion <= 7
                          ? "text-orange-600"
                          : "text-muted-foreground",
                    )}
                  >
                    <Clock className="inline h-3 w-3 mr-1" />
                    {daysUntilCompletion < 0
                      ? `${Math.abs(daysUntilCompletion)} days overdue`
                      : daysUntilCompletion === 0
                        ? "Due today"
                        : `${daysUntilCompletion} days remaining`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Budget */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-2xl font-bold">Rp {totalBudget.toLocaleString("id-ID")}</p>
              <p className="text-sm text-muted-foreground">Total allocated budget</p>
            </div>
          </div>

          <Separator />

          {/* Team Members */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members ({teamMembers.length})
            </h4>
            {teamMembers.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile_picture || undefined} />
                      <AvatarFallback>
                        {member.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {member.role === "production"
                          ? "Tim Produksi"
                          : member.role === "broadcaster"
                            ? "Broadcaster"
                            : member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
            )}
          </div>

          {/* Created Info */}
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Created on{" "}
            {new Date(project.created_at).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href={`/dashboard/production/projects/${project.id}/board`}>Open Board</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
