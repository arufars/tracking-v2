"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Film,
  GripVertical,
  MoreHorizontal,
  Tv,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  episode_number: number;
  episode_title: string;
  project_name: string;
  current_stage: string;
  progress_percentage: number;
  deadline: string | null;
  status: string;
  priority: string;
  air_time: string | null;
  air_date: string | null;
  channel_tv: string | null;
  editor_name: string | null;
  days_until_deadline: number | null;
  total_tasks: number;
  completed_tasks: number;
  notes: string | null;
  team_name: string | null;
}

interface StageStats {
  stage: string;
  total_episodes: number;
  avg_progress: number;
}

interface KanbanBoardProps {
  episodes: Episode[];
  stageStats: StageStats[];
}

const STAGE_CONFIG = {
  pre_production: {
    label: "Pre-Production",
    icon: Film,
    color: "bg-slate-500",
    borderColor: "border-t-slate-500",
    bgLight: "bg-slate-50 dark:bg-slate-950/30",
    textColor: "text-slate-600 dark:text-slate-400",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  },
  shooting: {
    label: "Shooting",
    icon: Film,
    color: "bg-blue-500",
    borderColor: "border-t-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  pre_editing: {
    label: "Pre-Editing",
    icon: Eye,
    color: "bg-orange-500",
    borderColor: "border-t-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-600 dark:text-orange-400",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  editing: {
    label: "Editing",
    icon: Film,
    color: "bg-purple-500",
    borderColor: "border-t-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-green-500",
    borderColor: "border-t-green-500",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
} as const;

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-red-600" },
  normal: { label: "Normal", color: "bg-blue-500", textColor: "text-blue-600" },
  low: { label: "Low", color: "bg-gray-400", textColor: "text-gray-500" },
};

function KanbanCard({ episode }: { episode: Episode }) {
  const isDelayed =
    episode.days_until_deadline !== null && episode.days_until_deadline < 0 && episode.current_stage !== "delivered";
  const isUrgent =
    episode.days_until_deadline !== null && episode.days_until_deadline <= 3 && episode.days_until_deadline >= 0;

  const priorityConfig = PRIORITY_CONFIG[episode.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        "bg-card border-border",
        isDelayed && "border-destructive bg-destructive/5",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Episode Number Badge & Menu */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-sm font-semibold px-2.5 py-0.5">
            #{episode.episode_number}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Episode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Project Name - Prominent */}
        <div>
          <h3 className="font-bold text-lg leading-tight text-card-foreground">{episode.project_name}</h3>
          <p className="text-sm text-primary font-medium mt-0.5">{episode.episode_title}</p>
        </div>

        {/* Description text (if available from notes) */}
        {episode.notes ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{episode.notes}</p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2">
            Program variety show {episode.project_name} yang tayang di {episode.channel_tv || "TV"} pukul{" "}
            {episode.air_time || "20:30"}
          </p>
        )}

        {/* Channel & Air Time - More Prominent */}
        {(episode.channel_tv || episode.air_time) && (
          <div className="flex items-center gap-4 text-sm text-card-foreground">
            {episode.channel_tv && (
              <div className="flex items-center gap-1.5">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{episode.channel_tv}</span>
              </div>
            )}
            {episode.air_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{episode.air_time}</span>
              </div>
            )}
          </div>
        )}

        {/* Editor Name - More Prominent */}
        {episode.editor_name && (
          <div className="flex items-center gap-1.5 text-sm text-card-foreground">
            <User className="h-4 w-4 text-destructive" />
            <span className="font-medium">{episode.editor_name}</span>
          </div>
        )}

        {/* Progress Bar with Percentage */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{episode.progress_percentage}%</span>
          </div>
          <Progress value={episode.progress_percentage} className="h-2" />
        </div>

        {/* Tim Production Info */}
        {episode.team_name && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium">{episode.team_name}</p>
          </div>
        )}

        {/* Notes in italic */}
        <p className="text-xs text-muted-foreground italic">
          Sedang dalam tahap{" "}
          {STAGE_CONFIG[episode.current_stage as keyof typeof STAGE_CONFIG]?.label.toLowerCase() || "editing"} untuk
          episode hari ini
        </p>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  stageKey,
  config,
  episodes,
  stats,
}: {
  stageKey: string;
  config: (typeof STAGE_CONFIG)[keyof typeof STAGE_CONFIG];
  episodes: Episode[];
  stats: StageStats | undefined;
}) {
  const Icon = config.icon;

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className={cn("rounded-t-lg border-t-4 p-3", config.borderColor, config.bgLight)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", config.color)}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className={cn("font-semibold text-sm", config.textColor)}>{config.label}</h3>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {episodes.length}
          </Badge>
        </div>

        {/* Stage Progress */}
        {stats && stats.total_episodes > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Avg Progress</span>
              <span className={cn("font-medium", config.textColor)}>{stats.avg_progress}%</span>
            </div>
            <Progress value={stats.avg_progress} className="h-1" />
          </div>
        )}
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 rounded-b-lg border border-t-0 bg-muted/30">
        <div className="p-2 space-y-2 min-h-52">
          {episodes.length === 0 ? (
            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">No episodes</p>
            </div>
          ) : (
            episodes.map((episode) => <KanbanCard key={episode.id} episode={episode} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function KanbanBoard({ episodes, stageStats }: KanbanBoardProps) {
  return (
    <div className="w-full">
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4 p-1 min-w-max">
          {Object.entries(STAGE_CONFIG).map(([stageKey, config]) => {
            const stageEpisodes = episodes.filter((ep) => ep.current_stage === stageKey);
            const stats = stageStats.find((s) => s.stage === stageKey);

            return (
              <KanbanColumn key={stageKey} stageKey={stageKey} config={config} episodes={stageEpisodes} stats={stats} />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
