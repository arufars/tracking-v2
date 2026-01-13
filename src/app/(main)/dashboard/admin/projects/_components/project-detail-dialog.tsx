"use client";

import Link from "next/link";

import { Calendar, Clock, DollarSign, Eye, Film, FolderKanban, Target, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  status: string;
  budget: number | null;
  start_date: string | null;
  target_completion: string | null;
  description: string | null;
  created_at: string;
  total_episodes: number;
  completed_episodes: number;
  avg_progress: number;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  profile_picture: string | null;
}

interface ProjectDetailDialogProps {
  project: Project;
  teamMembers: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  film: { label: "Film", color: "text-blue-700", bgColor: "bg-blue-100" },
  series: { label: "Series", color: "text-purple-700", bgColor: "bg-purple-100" },
  documentary: { label: "Documentary", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  variety: { label: "Variety Show", color: "text-orange-700", bgColor: "bg-orange-100" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planning: { label: "Planning", variant: "secondary" },
  "in-progress": { label: "In Progress", variant: "default" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  "on-hold": { label: "On Hold", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

export function ProjectDetailDialog({ project, teamMembers, open, onOpenChange }: ProjectDetailDialogProps) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type] || PROJECT_TYPE_CONFIG.series;
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG["in-progress"];

  const daysUntilCompletion = project.target_completion
    ? Math.ceil((new Date(project.target_completion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge className={cn(typeConfig.bgColor, typeConfig.color, "font-medium")}>{typeConfig.label}</Badge>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <DialogTitle className="text-xl">{project.project_name}</DialogTitle>
              <DialogDescription className="mt-2">
                {project.description || "No description provided."}
              </DialogDescription>
            </div>
            <Eye className="h-6 w-6 shrink-0 text-muted-foreground" />
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Progress Overview */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Progress Overview</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <div className="text-3xl font-bold text-primary">{project.avg_progress}%</div>
              <div className="mt-1 text-sm text-muted-foreground">Overall Progress</div>
              <Progress value={project.avg_progress} className="mt-2 h-2" />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <div className="text-3xl font-bold text-primary">{project.total_episodes}</div>
              <div className="mt-1 text-sm text-muted-foreground">Total Episodes</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{project.completed_episodes}</div>
              <div className="mt-1 text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Project Details Grid */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Start Date</div>
                <div className="font-medium">{formatDate(project.start_date)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Target Completion</div>
                <div
                  className={cn(
                    "font-medium",
                    daysUntilCompletion !== null && daysUntilCompletion < 0 && "text-red-600",
                    daysUntilCompletion !== null &&
                      daysUntilCompletion <= 7 &&
                      daysUntilCompletion >= 0 &&
                      "text-orange-600",
                  )}
                >
                  {formatDate(project.target_completion)}
                  {daysUntilCompletion !== null && daysUntilCompletion < 0 && (
                    <span className="ml-1 text-xs">({Math.abs(daysUntilCompletion)} days overdue)</span>
                  )}
                  {daysUntilCompletion !== null && daysUntilCompletion <= 7 && daysUntilCompletion >= 0 && (
                    <span className="ml-1 text-xs">({daysUntilCompletion} days left)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="font-medium">{formatCurrency(project.budget)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Created At</div>
                <div className="font-medium">{formatDate(project.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Team Members */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" />
            Team Members ({teamMembers.length})
          </h4>
          {teamMembers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {teamMembers.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile_picture || undefined} />
                    <AvatarFallback className="text-sm font-medium">
                      {member.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{member.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">No team members assigned yet.</div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href={`/dashboard/admin/episodes?project=${project.id}`}>
              <Film className="mr-2 h-4 w-4" />
              View Episodes
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/live-board?project=${project.id}`}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Open Board
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
