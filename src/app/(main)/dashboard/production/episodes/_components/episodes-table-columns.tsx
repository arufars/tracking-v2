"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, CalendarClock, Info, Tv } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { EpisodeDetailDialog } from "@/components/episodes/episode-detail-dialog";

interface Episode {
  id: string;
  project_id: string;
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

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success";
    className?: string;
  }
> = {
  shooting: { label: "Shooting", variant: "default", className: "bg-blue-100 text-blue-700 border-blue-300" },
  editing: { label: "Editing", variant: "default", className: "bg-purple-100 text-purple-700 border-purple-300" },
  delivered: { label: "Delivered", variant: "success", className: "bg-green-100 text-green-700 border-green-300" },
  payment: { label: "Payment", variant: "default", className: "bg-amber-100 text-amber-700 border-amber-300" },
};

const priorityConfig: Record<string, { label: string; className?: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-700" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-700" },
  high: { label: "High", className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

function getSegmentLabel(segment: Episode["segments"][0]): string {
  const { cut_percent, audio_percent, graphics_percent, master_percent } = segment;

  if (master_percent === 100) return "Master 100%";
  if (graphics_percent >= 75) return "Grafik 75%";
  if (audio_percent >= 50) return "Audio 50%";
  if (cut_percent >= 25) return "Rafkat 25%";
  return "Belum mulai";
}

export const episodesColumns: ColumnDef<Episode>[] = [
  {
    accessorKey: "episode_title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Episode" />,
    cell: ({ row }) => {
      const episode = row.original;
      return (
        <div className="flex flex-col gap-1 max-w-[300px]">
          <div className="font-medium truncate">{episode.episode_title}</div>
          <div className="text-xs text-muted-foreground truncate">{episode.project_name}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = statusConfig[status] || statusConfig.shooting;
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const config = priorityConfig[priority] || priorityConfig.normal;
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "editing_progress",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editing Progress" />,
    cell: ({ row }) => {
      const episode = row.original;
      const segments = episode.segments || [];

      if (segments.length === 0 || episode.status !== "editing") {
        return <span className="text-xs text-muted-foreground italic">-</span>;
      }

      return (
        <div className="flex flex-wrap gap-1 max-w-[250px]">
          {segments.map((seg) => {
            const label = getSegmentLabel(seg);
            const isComplete = seg.master_percent === 100;
            return (
              <Badge
                key={seg.segment_number}
                variant="outline"
                className={`text-xs ${
                  isComplete
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }`}
              >
                Seg {seg.segment_number}: {label}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "progress_percentage",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
    cell: ({ row }) => {
      const progress = row.getValue("progress_percentage") as number;
      return (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{progress}%</div>
          <div className="w-[60px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "deadline",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Deadline" />,
    cell: ({ row }) => {
      const deadline = row.getValue("deadline") as string | null;
      if (!deadline) {
        return <span className="text-xs text-muted-foreground italic">Belum dijadwalkan</span>;
      }

      const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntil < 0;
      const isUrgent = daysUntil >= 0 && daysUntil <= 3;

      return (
        <div className="flex items-center gap-2">
          <CalendarClock
            className={`h-3.5 w-3.5 ${isOverdue ? "text-red-500" : isUrgent ? "text-orange-500" : "text-muted-foreground"}`}
          />
          <span className={`text-sm ${isOverdue ? "text-red-600 font-medium" : isUrgent ? "text-orange-600" : ""}`}>
            {format(new Date(deadline), "d MMM")}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "broadcast_info",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Broadcast" />,
    cell: ({ row }) => {
      const episode = row.original;
      const channel = episode.channel_tv;
      const airDate = episode.air_date;

      return (
        <div className="flex flex-col gap-1 text-xs">
          {channel ? (
            <div className="flex items-center gap-1.5">
              <Tv className="h-3 w-3 text-muted-foreground" />
              <span>{channel}</span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">Belum diisi</span>
          )}
          {airDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(airDate), "d MMM HH:mm")}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const episode = row.original;
      return <EpisodeDetailDialog episode={episode} />;
    },
  },
];
