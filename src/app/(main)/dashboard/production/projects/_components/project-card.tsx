"use client";

import Link from "next/link";

import { Calendar, Clock, DollarSign, ExternalLink, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { DeleteProjectDialog } from "./delete-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { ProjectDetailDialog } from "./project-detail-dialog";

export interface Project {
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

export interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  profile_picture: string | null;
}

interface ProjectCardProps {
  project: Project;
  teamMembers: TeamMember[];
  userRole: string;
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

const PROGRESS_COLORS = [
  { threshold: 80, className: "from-emerald-500/80 to-emerald-600" },
  { threshold: 40, className: "from-blue-500/80 to-blue-600" },
  { threshold: 0, className: "from-amber-500/80 to-amber-600" },
];

function getProgressGradient(value: number) {
  const match = PROGRESS_COLORS.find((c) => value >= c.threshold) || PROGRESS_COLORS[PROGRESS_COLORS.length - 1];
  return `bg-gradient-to-r ${match.className}`;
}

export function ProjectCard({ project, teamMembers, userRole }: ProjectCardProps) {
  const canEdit = userRole === "admin" || userRole === "production";
  const canDelete = userRole === "admin";

  const typeConfig = PROJECT_TYPE_CONFIG[project.type] || PROJECT_TYPE_CONFIG.series;
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG["in-progress"];

  const clampedProgress = Math.max(0, Math.min(100, project.avg_progress || 0));
  const daysUntilCompletion = project.target_completion_date
    ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const startDateLabel = project.start_date ? new Date(project.start_date).toLocaleDateString("id-ID") : "N/A";
  const targetDateLabel = project.target_completion_date
    ? new Date(project.target_completion_date).toLocaleDateString("id-ID")
    : "N/A";

  return (
    <Card className="group relative h-full overflow-hidden border-border/70 bg-card/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn(typeConfig.bgColor, typeConfig.color, "dark:bg-opacity-20")}>{typeConfig.label}</Badge>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <ProjectDetailDialog
                project={project}
                teamMembers={teamMembers}
                trigger={<DropdownMenuItem className="text-xs">View details</DropdownMenuItem>}
              />
              {canEdit && (
                <EditProjectDialog
                  project={project}
                  trigger={
                    <DropdownMenuItem className="text-xs">
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                  }
                />
              )}
              {canDelete && <DropdownMenuSeparator />}
              {canDelete && (
                <DeleteProjectDialog
                  projectId={project.id}
                  projectName={project.title}
                  userRole={userRole as "production" | "admin"}
                  trigger={
                    <DropdownMenuItem className="text-xs text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Archive / Delete
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              Created {new Date(project.created_at).toLocaleDateString("id-ID")}
            </span>
          </div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground">{project.title}</h3>
          {project.description && <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span className="font-semibold text-foreground">{clampedProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", getProgressGradient(clampedProgress))}
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{teamMembers.length} crew</span>
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{project.total_episodes} episodes</span>
            </div>
            <div className="flex items-center gap-1">
              <Checkmark />
              <span>{project.completed_episodes} delivered</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Start
              </span>
              <span className="text-foreground">{startDateLabel}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Target
              </span>
              <span className="text-foreground">{targetDateLabel}</span>
            </div>
            {daysUntilCompletion !== null && (
              <p
                className={cn(
                  "mt-2 text-xs font-semibold",
                  daysUntilCompletion < 0 && "text-destructive",
                  daysUntilCompletion >= 0 && daysUntilCompletion <= 7 && "text-amber-600",
                  daysUntilCompletion > 7 && "text-emerald-600",
                )}
              >
                {daysUntilCompletion < 0
                  ? `${Math.abs(daysUntilCompletion)} hari terlambat`
                  : `${daysUntilCompletion} hari tersisa`}
              </p>
            )}
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Budget
              </span>
              <span className="text-foreground font-semibold">
                {project.total_budget ? `Rp ${project.total_budget.toLocaleString("id-ID")}` : "Belum diisi"}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to delivery</span>
              <span className="text-foreground font-semibold">{clampedProgress}%</span>
            </div>
            <Progress value={clampedProgress} className="mt-2 h-2" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 4).map((member) => (
              <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.profile_picture || undefined} />
                <AvatarFallback className="text-[10px] font-semibold">
                  {member.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {teamMembers.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{teamMembers.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Open board</span>
            <Button asChild size="sm" variant="secondary" className="h-8 px-2">
              <Link href={`/dashboard/projects/${project.id}`}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Board
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <ProjectDetailDialog
            project={project}
            teamMembers={teamMembers}
            trigger={
              <Button variant="outline" size="sm" className="h-8 px-3">
                View details
              </Button>
            }
          />
          <div className="flex items-center gap-2">
            {canEdit && (
              <EditProjectDialog
                project={project}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 px-3">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                }
              />
            )}
            {canDelete && (
              <DeleteProjectDialog
                projectId={project.id}
                projectName={project.title}
                userRole={userRole as "production" | "admin"}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-destructive hover:text-destructive">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Archive/Delete
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Checkmark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-500">
      <path fill="currentColor" d="M9.75 16.5 5.5 12.25l1.75-1.75 2.5 2.5 7-7 1.75 1.75z" />
    </svg>
  );
}
