"use client";

import { useState } from "react";

import { LayoutGrid, Table } from "lucide-react";

import { EpisodeFilters } from "@/components/episodes/episode-filters";
import { EpisodesTable } from "./episodes-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface EpisodesViewToggleProps {
  episodes: Episode[];
  userRole: string;
}

export function EpisodesViewToggle({ episodes, userRole }: EpisodesViewToggleProps) {
  const [view, setView] = useState<"card" | "table">("card");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Episodes</CardTitle>
          <p className="text-sm text-muted-foreground">Switch between card and table layouts.</p>
        </div>
        <div className="inline-flex rounded-md border bg-muted/50 p-1">
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setView("card")}
          >
            <LayoutGrid className="h-4 w-4" /> Card
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setView("table")}
          >
            <Table className="h-4 w-4" /> Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "card" ? (
          <EpisodeFilters episodes={episodes} userRole={userRole} />
        ) : (
          <EpisodesTable episodes={episodes} userRole={userRole} />
        )}
      </CardContent>
    </Card>
  );
}
