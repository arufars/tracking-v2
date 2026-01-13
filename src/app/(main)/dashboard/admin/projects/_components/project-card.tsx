"use client";

import { useState } from "react";

import Link from "next/link";

import { Archive, Clock, DollarSign, Eye, Film, FolderKanban, MoreVertical, Pencil, Trash2, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  film: { label: "Film", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  series: {
    label: "Series",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  documentary: {
    label: "Documentary",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  variety: {
    label: "Variety",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planning: { label: "Planning", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  "in-progress": { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  "on-hold": { label: "On Hold", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

export function ProjectCard({ project, teamMembers, userRole }: ProjectCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const typeConfig = PROJECT_TYPE_CONFIG[project.type] || PROJECT_TYPE_CONFIG.series;
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;

  const daysUntilCompletion = project.target_completion_date
    ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilCompletion !== null && daysUntilCompletion < 0;
  const isUrgent = daysUntilCompletion !== null && daysUntilCompletion <= 7 && daysUntilCompletion >= 0;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(0)}M`;
    }
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Convert project to format expected by dialogs
  const projectForDialogs = {
    id: project.id,
    project_name: project.title,
    project_type: project.type,
    status: project.status,
    budget: project.total_budget,
    start_date: project.start_date,
    target_completion: project.target_completion_date,
    description: project.description,
    created_at: project.created_at,
    total_episodes: project.total_episodes,
    completed_episodes: project.completed_episodes,
    avg_progress: project.avg_progress,
  };

  return (
    <>
      <Card className="group flex h-full flex-col transition-all hover:border-primary/20 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Badges */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge className={cn(typeConfig.bgColor, typeConfig.color, "border-0 text-xs font-medium")}>
                  {typeConfig.label}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
                {isUrgent && (
                  <Badge variant="outline" className="border-orange-500 text-xs text-orange-600">
                    Urgent
                  </Badge>
                )}
              </div>
              {/* Title */}
              <CardTitle className="line-clamp-1 text-base font-semibold leading-snug">{project.title}</CardTitle>
              {project.description && (
                <CardDescription className="mt-1.5 line-clamp-2 text-xs">{project.description}</CardDescription>
              )}
            </div>
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/admin/episodes?project=${project.id}`}>
                    <Film className="mr-2 h-4 w-4" />
                    View Episodes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/live-board?project=${project.id}`}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Open Board
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  {userRole === "admin" ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Project
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 pt-0">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Progress</span>
              <span className="font-semibold">{project.avg_progress}%</span>
            </div>
            <Progress value={project.avg_progress} className="h-2" />
          </div>

          {/* Stats Grid - Compact */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Episodes */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {project.completed_episodes}/{project.total_episodes} eps
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium">{teamMembers.length} members</div>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium">{formatCurrency(project.total_budget)}</div>
              </div>
            </div>

            {/* Deadline */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-md p-2",
                isOverdue
                  ? "bg-red-100 dark:bg-red-900/30"
                  : isUrgent
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-muted/50",
              )}
            >
              <Clock
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isOverdue ? "text-red-600" : isUrgent ? "text-orange-600" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0">
                <div className={cn("truncate font-medium", isOverdue && "text-red-600", isUrgent && "text-orange-600")}>
                  {isOverdue
                    ? `${Math.abs(daysUntilCompletion!)}d late`
                    : isUrgent
                      ? `${daysUntilCompletion}d left`
                      : formatDate(project.target_completion_date)}
                </div>
              </div>
            </div>
          </div>

          {/* Team Avatars */}
          <div className="mt-auto flex items-center justify-between border-t pt-2">
            <TooltipProvider>
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 5).map((member) => (
                  <Tooltip key={member.user_id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-7 w-7 cursor-pointer border-2 border-background transition-transform hover:z-10 hover:scale-110">
                        <AvatarImage src={member.profile_picture || undefined} />
                        <AvatarFallback className="text-[10px] font-medium">
                          {member.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p className="font-medium">{member.full_name}</p>
                      <p className="capitalize text-muted-foreground">{member.role}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {teamMembers.length > 5 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted">
                    <span className="text-[10px] font-medium">+{teamMembers.length - 5}</span>
                  </div>
                )}
              </div>
            </TooltipProvider>

            {/* Quick Actions */}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowDetailDialog(true)}>
                <Eye className="mr-1 h-3.5 w-3.5" />
                Detail
              </Button>
              <Button variant="default" size="sm" className="h-7 px-2 text-xs" asChild>
                <Link href={`/live-board?project=${project.id}`}>
                  <FolderKanban className="mr-1 h-3.5 w-3.5" />
                  Board
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditProjectDialog project={projectForDialogs} open={showEditDialog} onOpenChange={setShowEditDialog} />
      <ProjectDetailDialog
        project={projectForDialogs}
        teamMembers={teamMembers}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
      <DeleteProjectDialog
        projectId={project.id}
        projectName={project.title}
        userRole={userRole as "admin" | "production"}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
