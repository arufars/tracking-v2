import { redirect } from "next/navigation";

import { Calendar, CheckCircle2, Clock, Film, Package, Play, Tv } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Episode Status",
  description: "View detailed status for all episodes",
};

interface Episode {
  id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  season: number | null;
  genre: string | null;
  current_stage: string;
  status: string;
  progress_percentage: number;
  deadline: string | null;
  air_time: string | null;
  channel_tv: string | null;
  days_until_deadline: number | null;
  episode_status_label: string;
}

async function getBroadcasterEpisodes(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a broadcaster
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return [];
  }

  // Get episodes with stage info
  const { data: episodes, error } = await supabase
    .from("episodes")
    .select(
      `
      id,
      episode_number,
      episode_title,
      season,
      genre,
      status,
      progress_percentage,
      deadline,
      air_time,
      channel_tv,
      projects!inner (
        project_name
      ),
      episode_stages (
        current_stage
      )
    `,
    )
    .in("project_id", projectIds)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }

  // Process episodes
  const processedEpisodes: Episode[] =
    episodes?.map((episode: any) => {
      const currentStage = episode.episode_stages?.[0]?.current_stage || "shooting";
      const progress = episode.progress_percentage || 0;

      // Calculate days until deadline
      const daysUntilDeadline = episode.deadline
        ? Math.ceil((new Date(episode.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Generate status label (sesuai foto: "Editing Selesai", "Shooting Berlangsung", "Master Siap Kirim")
      let statusLabel = "";
      if (currentStage === "delivered") {
        statusLabel = "Master Siap Kirim";
      } else if (currentStage === "review") {
        statusLabel = "Review Quality Control";
      } else if (currentStage === "editing") {
        if (progress >= 90) {
          statusLabel = "Editing Selesai";
        } else if (progress >= 50) {
          statusLabel = "Editing Berlangsung";
        } else {
          statusLabel = "Editing Dimulai";
        }
      } else if (currentStage === "shooting") {
        if (progress >= 90) {
          statusLabel = "Shooting Selesai";
        } else if (progress >= 50) {
          statusLabel = "Shooting Berlangsung";
        } else {
          statusLabel = "Shooting Dimulai";
        }
      }

      return {
        id: episode.id,
        project_name: episode.projects.project_name,
        episode_number: episode.episode_number,
        episode_title: episode.episode_title,
        season: episode.season,
        genre: episode.genre,
        current_stage: currentStage,
        status: episode.status,
        progress_percentage: progress,
        deadline: episode.deadline,
        air_time: episode.air_time,
        channel_tv: episode.channel_tv,
        days_until_deadline: daysUntilDeadline,
        episode_status_label: statusLabel,
      };
    }) || [];

  return processedEpisodes;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  shooting: {
    label: "Shooting",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Film,
  },
  editing: {
    label: "Editing",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: Film,
  },
  review: {
    label: "Review",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: CheckCircle2,
  },
  delivered: {
    label: "Delivered",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: Package,
  },
};

function EpisodeCard({ episode }: { episode: Episode }) {
  const stageConfig = STAGE_CONFIG[episode.current_stage] || STAGE_CONFIG.shooting;
  const StageIcon = stageConfig.icon;

  const isOverdue =
    episode.days_until_deadline !== null && episode.days_until_deadline < 0 && episode.status !== "completed";
  const isUrgent =
    episode.days_until_deadline !== null && episode.days_until_deadline <= 3 && episode.days_until_deadline >= 0;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isOverdue && "border-red-500 border-2",
        isUrgent && "border-orange-500",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={cn(stageConfig.bgColor, stageConfig.color)}>
                <StageIcon className="h-3 w-3 mr-1" />
                {stageConfig.label}
              </Badge>
              {episode.genre && <Badge variant="outline">{episode.genre}</Badge>}
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              {isUrgent && !isOverdue && (
                <Badge variant="outline" className="text-orange-600">
                  Urgent
                </Badge>
              )}
            </div>
            <CardTitle className="text-base line-clamp-1">
              {episode.project_name} - Episode {episode.episode_number}
              {episode.season && ` (S${episode.season})`}
            </CardTitle>
            <CardDescription className="line-clamp-1">{episode.episode_title}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Label (sesuai foto) */}
        {episode.episode_status_label && (
          <div className="p-2 rounded-lg bg-muted">
            <div className="text-sm font-semibold text-center">{episode.episode_status_label}</div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{episode.progress_percentage}%</span>
          </div>
          <Progress value={episode.progress_percentage} />
        </div>

        {/* Delivery Schedule */}
        {episode.deadline && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Jadwal Penyerahan (Delivery Schedule)</span>
            </div>
            <div className={cn("text-sm font-medium", isOverdue && "text-red-600", isUrgent && "text-orange-600")}>
              {isOverdue
                ? `Terlambat ${Math.abs(episode.days_until_deadline!)} hari`
                : isUrgent
                  ? `${episode.days_until_deadline} hari lagi`
                  : new Date(episode.deadline).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
            </div>
          </div>
        )}

        {/* Air Time */}
        {episode.air_time && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Jadwal Tayang</span>
            </div>
            <div className="text-sm font-medium">
              {new Date(episode.air_time).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        )}

        {/* Channel */}
        {episode.channel_tv && (
          <div className="flex items-center gap-2 text-sm">
            <Tv className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Channel:</span>
            <span className="font-medium">{episode.channel_tv}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EpisodeStats({ episodes }: { episodes: Episode[] }) {
  const totalEpisodes = episodes.length;
  const deliveredEpisodes = episodes.filter((e) => e.current_stage === "delivered").length;
  const inProgressEpisodes = episodes.filter(
    (e) => e.current_stage === "shooting" || e.current_stage === "editing",
  ).length;
  const reviewEpisodes = episodes.filter((e) => e.current_stage === "review").length;

  // Count by stage
  const shootingCount = episodes.filter((e) => e.current_stage === "shooting").length;
  const editingCount = episodes.filter((e) => e.current_stage === "editing").length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEpisodes}</div>
          <p className="text-xs text-muted-foreground">All episodes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Play className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressEpisodes}</div>
          <p className="text-xs text-muted-foreground">
            {shootingCount} shooting, {editingCount} editing
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Review</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reviewEpisodes}</div>
          <p className="text-xs text-muted-foreground">Quality control</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deliveredEpisodes}</div>
          <p className="text-xs text-muted-foreground">
            {totalEpisodes > 0 ? Math.round((deliveredEpisodes / totalEpisodes) * 100) : 0}% completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function groupEpisodesByProject(episodes: Episode[]) {
  const grouped: Record<string, Episode[]> = {};

  episodes.forEach((episode) => {
    if (!grouped[episode.project_name]) {
      grouped[episode.project_name] = [];
    }
    grouped[episode.project_name].push(episode);
  });

  return grouped;
}

export default async function BroadcasterEpisodesPage() {
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

  if (!userData || (userData.role !== "broadcaster" && userData.role !== "admin")) {
    redirect("/unauthorized");
  }

  const episodes = await getBroadcasterEpisodes(user.id);
  const groupedEpisodes = groupEpisodesByProject(episodes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detail Episode untuk Series</h1>
        <p className="text-muted-foreground">Status spesifik setiap episode dan jadwal penyerahan</p>
      </div>

      {/* Stats */}
      <EpisodeStats episodes={episodes} />

      {/* Episodes Grouped by Project */}
      {episodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Episodes Found</h3>
            <p className="text-sm text-muted-foreground text-center">No episodes found in your assigned projects.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEpisodes).map(([projectName, projectEpisodes]) => (
            <div key={projectName} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{projectName}</h2>
                <Badge variant="secondary">{projectEpisodes.length} episodes</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectEpisodes.map((episode) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
