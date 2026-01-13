import { redirect } from "next/navigation";

import { AlertCircle, CheckCircle2, Clock, Film, Play, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { KanbanBoard } from "@/components/production/kanban-board";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Live Production Board",
  description: "Monitor production progress in real-time",
};

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

const STAGE_KEYS = ["pre_production", "shooting", "pre_editing", "editing", "delivered"];

async function getProductionData(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a team member
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return { episodes: [], stageStats: [], metrics: null };
  }

  // Get episodes with stage data
  const { data: episodesData, error } = await supabase
    .from("episodes")
    .select(`
      id,
      episode_number,
      title,
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
        title
      ),
      episode_stages (
        id,
        stage,
        status,
        progress_percentage,
        stage_notes,
        stage_tasks (
          id,
          is_completed
        )
      )
    `)
    .in("project_id", projectIds)
    .order("target_delivery_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching episodes:", error);
    return { episodes: [], stageStats: [], metrics: null };
  }

  // Process episodes
  const episodes: Episode[] = (episodesData || []).map((episode: any) => {
    const stages = episode.episode_stages || [];

    // Find current active stage
    const stageOrder = ["shooting", "editing", "review", "delivered"];
    let currentStage = "shooting";
    for (const stageName of stageOrder) {
      const stage = stages.find((s: any) => s.stage === stageName);
      if (stage) {
        if (stage.status !== "completed") {
          currentStage = stageName;
          break;
        }
        currentStage = stageName;
      }
    }

    // Calculate progress
    const stageProgress =
      stages.length > 0
        ? Math.round(stages.reduce((sum: number, s: any) => sum + (s.progress_percentage || 0), 0) / stages.length)
        : 0;

    // Calculate tasks
    const allTasks = stages.flatMap((stage: any) => stage.stage_tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task: any) => task.is_completed === true).length;

    // Calculate days until deadline
    const deadline = episode.target_delivery_date;
    const daysUntilDeadline = deadline
      ? Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Get stage notes from current stage
    const currentStageData = stages.find((s: any) => s.stage === currentStage);
    const stageNotes = currentStageData?.stage_notes || episode.notes;

    return {
      id: episode.id,
      episode_number: episode.episode_number,
      episode_title: episode.title || `Episode ${episode.episode_number}`,
      project_name: episode.projects?.title || "Unknown Project",
      current_stage: episode.status || "pre_production", // Use status directly for Kanban columns
      progress_percentage: stageProgress,
      deadline,
      status: episode.status || "pre_production",
      priority: episode.priority || "normal",
      air_time: episode.air_time,
      air_date: episode.air_date,
      channel_tv: episode.channel_tv,
      editor_name: episode.editor_name,
      days_until_deadline: daysUntilDeadline,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      notes: stageNotes,
      team_name: "Tim Production A", // TODO: Get from user_projects or project metadata
    };
  });

  // Calculate stage statistics
  const stageStats = STAGE_KEYS.map((stage) => {
    const stageEpisodes = episodes.filter((ep) => ep.current_stage === stage);
    const avgProgress =
      stageEpisodes.length > 0
        ? Math.round(stageEpisodes.reduce((sum, ep) => sum + ep.progress_percentage, 0) / stageEpisodes.length)
        : 0;

    return {
      stage,
      total_episodes: stageEpisodes.length,
      avg_progress: avgProgress,
    };
  });

  // Calculate overall metrics
  const totalEpisodes = episodes.length;
  const completedEpisodes = episodes.filter((ep) => ep.current_stage === "delivered").length;
  const activeEpisodes = episodes.filter((ep) => ep.current_stage !== "delivered").length;
  const delayedEpisodes = episodes.filter(
    (ep) => ep.days_until_deadline !== null && ep.days_until_deadline < 0 && ep.current_stage !== "delivered",
  ).length;
  const urgentEpisodes = episodes.filter(
    (ep) => ep.days_until_deadline !== null && ep.days_until_deadline <= 3 && ep.days_until_deadline >= 0,
  ).length;
  const avgProgress =
    totalEpisodes > 0 ? Math.round(episodes.reduce((sum, ep) => sum + ep.progress_percentage, 0) / totalEpisodes) : 0;

  return {
    episodes,
    stageStats,
    metrics: {
      totalEpisodes,
      completedEpisodes,
      activeEpisodes,
      delayedEpisodes,
      urgentEpisodes,
      avgProgress,
    },
  };
}

function ProductionMetrics({
  metrics,
}: {
  metrics: {
    totalEpisodes: number;
    completedEpisodes: number;
    activeEpisodes: number;
    delayedEpisodes: number;
    urgentEpisodes: number;
    avgProgress: number;
  };
}) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Total</CardTitle>
          <Film className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">{metrics.totalEpisodes}</div>
          <p className="text-[10px] text-muted-foreground">Episodes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Active</CardTitle>
          <Play className="h-3.5 w-3.5 text-blue-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-blue-600">{metrics.activeEpisodes}</div>
          <p className="text-[10px] text-muted-foreground">In progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-green-600">{metrics.completedEpisodes}</div>
          <p className="text-[10px] text-muted-foreground">
            {metrics.totalEpisodes > 0 ? Math.round((metrics.completedEpisodes / metrics.totalEpisodes) * 100) : 0}%
            done
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Due Soon</CardTitle>
          <Clock className="h-3.5 w-3.5 text-orange-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-orange-600">{metrics.urgentEpisodes}</div>
          <p className="text-[10px] text-muted-foreground">≤3 days left</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Overdue</CardTitle>
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-red-600">{metrics.delayedEpisodes}</div>
          <p className="text-[10px] text-muted-foreground">Past deadline</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-xs font-medium">Avg Progress</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-purple-600">{metrics.avgProgress}%</div>
          <Progress value={metrics.avgProgress} className="mt-1 h-1" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ProductionPage() {
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

  const { episodes, stageStats, metrics } = await getProductionData(user.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Production Board</h1>
        <p className="text-xs text-muted-foreground">Monitor and track all episodes through production stages</p>
      </div>

      {/* Metrics */}
      {metrics && <ProductionMetrics metrics={metrics} />}

      {/* Kanban Board */}
      {episodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Episodes in Production</h3>
            <p className="text-sm text-muted-foreground text-center">
              Episodes will appear here once they enter production stages.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Production Pipeline</h2>
            <p className="text-sm text-muted-foreground">Drag cards to move episodes between stages (coming soon)</p>
          </div>
          <KanbanBoard episodes={episodes} stageStats={stageStats} />
        </div>
      )}
    </div>
  );
}
