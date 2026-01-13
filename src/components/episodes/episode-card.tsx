"use client";

import { useState } from "react";

import { Calendar, Clock, ListTodo, Tv } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { EpisodeDetailDialog } from "./episode-detail-dialog";

interface Episode {
  id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  description: string | null;
  season: number | null;
  genre: string | null;
  current_stage: string;
  status: string;
  priority: string;
  progress_percentage: number;
  deadline: string | null;
  air_time: string | null;
  air_date: string | null;
  channel_tv: string | null;
  editor_name: string | null;
  notes: string | null;
  segments: {
    segment_number: number;
    cut_percent: number;
    audio_percent: number;
    graphics_percent: number;
    master_percent: number;
  }[];
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
}

const SEGMENT_STEP_LABEL: Record<number, string> = {
  0: "Belum mulai",
  25: "Rafkat 25%",
  50: "Audio 50%",
  75: "Grafik 75%",
  100: "Master 100%",
};

function segmentValueFromData(seg: Episode["segments"][number]) {
  if (!seg) return 0;
  if (seg.master_percent >= 25) return 100;
  if (seg.graphics_percent >= 25) return 75;
  if (seg.audio_percent >= 25) return 50;
  if (seg.cut_percent >= 25) return 25;
  return 0;
}

interface EpisodeCardProps {
  episode: Episode;
  userRole: string;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  shooting: {
    label: "Shooting",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  editing: {
    label: "Editing",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
  },
  review: {
    label: "Review",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
  },
  delivered: {
    label: "Delivered",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/40",
  },
  g_drive: { label: "G-Drive", color: "text-teal-700 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/40" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pre_production: { label: "Pre-Prod", variant: "secondary" },
  shooting: { label: "Shooting", variant: "default" },
  pre_editing: { label: "Pre-Edit", variant: "secondary" },
  editing: { label: "Editing", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "border-l-red-500" },
  normal: { label: "Normal", color: "border-l-blue-500" },
  low: { label: "Low", color: "border-l-gray-400" },
};

export function EpisodeCard({ episode, userRole }: EpisodeCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const statusConfig = STATUS_CONFIG[episode.status] || STATUS_CONFIG.shooting;
  const priorityConfig = PRIORITY_CONFIG[episode.priority] || PRIORITY_CONFIG.normal;

  const segmentStates = (episode.segments || []).map((seg) => ({
    segment_number: seg.segment_number,
    value: segmentValueFromData(seg),
  }));

  const segmentsWithProgress = segmentStates.filter((seg) => seg.value > 0);
  const segmentsToRender = segmentsWithProgress.length > 0 ? segmentsWithProgress : segmentStates;

  const editingProgress = segmentStates.length
    ? Math.round(segmentStates.reduce((sum, seg) => sum + seg.value, 0) / segmentStates.length)
    : 0;

  const daysUntilDeadline = episode.deadline
    ? Math.ceil((new Date(episode.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0 && episode.status !== "delivered";
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

  return (
    <>
      <Card
        className={cn(
          "transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-l-4",
          priorityConfig.color,
          isOverdue && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        )}
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate mb-1">{episode.project_name}</p>
              <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                E{episode.episode_number}
                {episode.season ? ` S${episode.season}` : ""} - {episode.episode_title}
              </h3>
            </div>
            {episode.priority === "urgent" && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                Urgent
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4 px-4 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 h-5">
              {statusConfig.label}
            </Badge>
            {episode.genre && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                {episode.genre}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Editing progress</span>
              <span className="font-medium">{editingProgress}%</span>
            </div>
            {segmentsToRender && segmentsToRender.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                {segmentsToRender.map((seg) => (
                  <span key={seg.segment_number} className="rounded bg-muted px-1.5 py-0.5">
                    Seg {seg.segment_number}: {SEGMENT_STEP_LABEL[seg.value] || `${seg.value}%`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Tasks */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ListTodo className="h-3 w-3 shrink-0" />
              <span>
                {episode.completed_tasks}/{episode.total_tasks} tasks
              </span>
            </div>

            {/* Deadline */}
            <div
              className={cn(
                "flex items-center gap-1.5",
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : isUrgent
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3 shrink-0" />
              {episode.deadline ? (
                <span className="truncate">
                  {isOverdue
                    ? `${Math.abs(daysUntilDeadline!)}d overdue`
                    : isUrgent
                      ? `${daysUntilDeadline}d left`
                      : new Date(episode.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
              ) : (
                <span>No deadline</span>
              )}
            </div>

            {/* Channel */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Tv className="h-3 w-3 shrink-0" />
              <span className="truncate">{episode.channel_tv || "Belum diisi"}</span>
            </div>

            {/* Air Date */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              {episode.air_date ? (
                <span className="truncate">
                  {new Date(episode.air_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  {episode.air_time && ` ${episode.air_time.slice(0, 5)}`}
                </span>
              ) : (
                <span className="truncate italic opacity-60">Belum dijadwalkan</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EpisodeDetailDialog episode={episode} open={detailOpen} onOpenChange={setDetailOpen} userRole={userRole} />
    </>
  );
}
