import { redirect } from "next/navigation";

import { AlertCircle, CheckCircle2, Film, Play, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { CreateEpisodeDialog } from "@/components/episodes/create-episode-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EpisodesViewToggle } from "./_components/episodes-view-toggle";

export const metadata: Metadata = {
  title: "Production Episodes",
  description: "Manage your episodes and tasks",
};

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

interface StageTask {
  id: string;
  task_name: string;
  status: string;
  stage: string;
  deadline: string | null;
  assigned_to_name: string | null;
}

async function getProductionEpisodes(userId: string, role: string) {
  const supabase = await createSupabaseServerClient();

  // Production sees all episodes; others filtered by their assigned projects
  let episodesQuery = supabase
    .from("episodes")
    .select(
      `
      id,
      episode_number,
      title,
      description,
      season,
      status,
      priority,
      channel_tv,
      air_time,
      air_date,
      editor_name,
      target_delivery_date,
      notes,
      project_id,
      projects!inner (
        id,
        title,
        genre
      ),
      episode_stage_segments (
        stage,
        segment_number,
        cut_percent,
        audio_percent,
        graphics_percent,
        master_percent
      )
    `,
    )
    .order("target_delivery_date", { ascending: true, nullsFirst: false });

  if (role !== "production") {
    const { data: userProjects } = await supabase
      .from("user_projects")
      .select("project_id")
      .eq("user_id", userId);

    const projectIds = userProjects?.map((up) => up.project_id) || [];
    if (projectIds.length === 0) {
      return [];
    }

    episodesQuery = episodesQuery.in("project_id", projectIds);
  }

  // Get episodes with aggregated task data
  const { data: episodes, error } = await episodesQuery;

  if (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }

  // Process episodes
  const processedEpisodes =
    episodes?.map((episode: any) => {
      // Build segments (3 fixed) for editing stage progress
      const segmentsRaw = episode.episode_stage_segments || [];
      const segments = [1, 2, 3].map((num) => {
        const found = segmentsRaw.find((s: any) => s.segment_number === num && s.stage === "editing");
        return {
          segment_number: num,
          cut_percent: found?.cut_percent || 0,
          audio_percent: found?.audio_percent || 0,
          graphics_percent: found?.graphics_percent || 0,
          master_percent: found?.master_percent || 0,
        };
      });

      const segmentProgress = segments.map((seg) => {
        return Math.round((seg.cut_percent + seg.audio_percent + seg.graphics_percent + seg.master_percent) / 4);
      });

      const editingProgress =
        segmentProgress.length > 0
          ? Math.round(segmentProgress.reduce((sum, val) => sum + val, 0) / segmentProgress.length)
          : 0;

      return {
        id: episode.id,
        project_id: episode.project_id,
        project_name: episode.projects?.title || "Unknown Project",
        episode_number: episode.episode_number,
        episode_title: episode.title || `Episode ${episode.episode_number}`,
        description: episode.description,
        season: episode.season,
        genre: episode.projects?.genre,
        current_stage: episode.status || "shooting",
        status: episode.status,
        priority: episode.priority || "normal",
        progress_percentage: editingProgress,
        deadline: episode.target_delivery_date,
        air_time: episode.air_time,
        air_date: episode.air_date,
        channel_tv: episode.channel_tv,
        editor_name: episode.editor_name,
        notes: episode.notes,
        segments,
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        pending_tasks: 0,
      };
    }) || [];

  return processedEpisodes;
}

function EpisodeStats({ episodes }: { episodes: Episode[] }) {
  const totalEpisodes = episodes.length;
  const completedStatuses = new Set(["delivered", "payment"]);
  const activeEpisodes = episodes.filter((e) => !completedStatuses.has(e.status)).length;
  const completedEpisodes = episodes.filter((e) => e.status === "delivered").length;
  const overdueEpisodes = episodes.filter((e) => {
    if (!e.deadline || e.status === "delivered") return false;
    const daysUntil = Math.ceil((new Date(e.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil < 0;
  }).length;

  // Calculate average progress
  const avgProgress =
    totalEpisodes > 0 ? Math.round(episodes.reduce((sum, e) => sum + e.progress_percentage, 0) / totalEpisodes) : 0;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEpisodes}</div>
          <p className="text-xs text-muted-foreground">Episodes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <Play className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{activeEpisodes}</div>
          <p className="text-xs text-muted-foreground">In production</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completedEpisodes}</div>
          <p className="text-xs text-muted-foreground">
            {totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0}% done
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueEpisodes}</div>
          <p className="text-xs text-muted-foreground">Past deadline</p>
        </CardContent>
      </Card>

      <Card className="col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{avgProgress}%</div>
          <p className="text-xs text-muted-foreground">Overall</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ProductionEpisodesPage() {
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!userData || (userData.role !== "production" && userData.role !== "admin")) {
    redirect("/unauthorized");
  }

  const episodes = await getProductionEpisodes(user.id, userData.role);
  const userRole = userData.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Episodes</h1>
          <p className="text-sm text-muted-foreground">Track and manage all episodes across your projects</p>
        </div>
        <CreateEpisodeDialog />
      </div>

      {/* Stats */}
      <EpisodeStats episodes={episodes} />

      {/* Episodes - Toggle between Card/Table */}
      {episodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Episodes Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              No episodes found in your projects.
              <br />
              Start by creating a new episode.
            </p>
            <CreateEpisodeDialog />
          </CardContent>
        </Card>
      ) : (
        <EpisodesViewToggle episodes={episodes} userRole={userRole} />
      )}
    </div>
  );
}
