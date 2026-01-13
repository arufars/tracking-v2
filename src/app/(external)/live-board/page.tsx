import { Check, Clock, Eye, Film, FolderKanban, Monitor, Tv, User } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

import { AutoRefresh } from "./_components/auto-refresh";

export const metadata: Metadata = {
  title: "DREAMLIGHT Live Production Board",
  description: "Real-time production tracking board",
};

// Revalidate every 30 seconds for real-time updates
export const revalidate = 30;

interface Episode {
  id: string;
  episode_number: number;
  episode_title: string;
  project_id: string;
  project_name: string;
  current_stage: string;
  progress_percentage: number;
  channel_tv: string | null;
  air_time: string | null;
  editor_name: string | null;
  notes: string | null;
  team_name: string | null;
}

interface ProjectGroup {
  project_id: string;
  project_name: string;
  episodes: Episode[];
}

interface StageData {
  stage: string;
  total_episodes: number;
  projects: ProjectGroup[];
}

async function getLiveProductionData() {
  const supabaseAdmin = createSupabaseAdmin();

  // Get all active episodes
  const { data: episodesData, error } = await supabaseAdmin
    .from("episodes")
    .select(`
      id,
      episode_number,
      title,
      status,
      channel_tv,
      air_time,
      editor_name,
      notes,
      project_id,
      projects!inner (
        id,
        title
      ),
      episode_stages (
        stage,
        progress_percentage,
        stage_notes
      )
    `)
    .neq("status", "delivered")
    .order("project_id", { ascending: true })
    .order("episode_number", { ascending: true });

  if (error) {
    console.error("Error fetching live episodes:", error);
    return { stageData: [] };
  }

  // Process episodes
  const episodes: Episode[] = (episodesData || []).map((episode: any) => {
    const stages = episode.episode_stages || [];

    // Calculate progress
    const stageProgress =
      stages.length > 0
        ? Math.round(stages.reduce((sum: number, s: any) => sum + (s.progress_percentage || 0), 0) / stages.length)
        : 0;

    // Get stage notes
    const currentStageData = stages.find((s: any) => s.stage === episode.status);
    const stageNotes = currentStageData?.stage_notes || episode.notes;

    return {
      id: episode.id,
      episode_number: episode.episode_number,
      episode_title: episode.title || `Episode ${episode.episode_number}`,
      project_id: episode.project_id,
      project_name: episode.projects?.title || "Unknown Project",
      current_stage: episode.status || "shooting",
      progress_percentage: stageProgress,
      channel_tv: episode.channel_tv,
      air_time: episode.air_time,
      editor_name: episode.editor_name,
      notes: stageNotes,
      team_name: "Tim Production A",
    };
  });

  // Group by stage and then by project
  const STAGE_KEYS = ["shooting", "editing", "pre_editing", "delivered"];
  const stageData: StageData[] = STAGE_KEYS.map((stage) => {
    const stageEpisodes = episodes.filter((ep) => ep.current_stage === stage);

    // Group episodes by project
    const projectMap = new Map<string, ProjectGroup>();
    stageEpisodes.forEach((episode) => {
      if (!projectMap.has(episode.project_id)) {
        projectMap.set(episode.project_id, {
          project_id: episode.project_id,
          project_name: episode.project_name,
          episodes: [],
        });
      }
      projectMap.get(episode.project_id)!.episodes.push(episode);
    });

    return {
      stage,
      total_episodes: stageEpisodes.length,
      projects: Array.from(projectMap.values()),
    };
  });

  return { stageData };
}

const STAGE_CONFIG = {
  shooting: {
    label: "SHOOTING",
    icon: Film,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
  },
  editing: {
    label: "EDITING",
    icon: Monitor,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
  },
  pre_editing: {
    label: "SELESAI",
    icon: Check,
    color: "bg-green-500",
    textColor: "text-green-600",
    bgLight: "bg-green-50 dark:bg-green-950/30",
  },
  delivered: {
    label: "KIRIM G DRIVE",
    icon: Monitor,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
  },
} as const;

// Compact Episode Card (no project name, just episode details)
function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-all">
      <CardContent className="p-3 space-y-2">
        {/* Episode Number & Title */}
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs font-bold shrink-0">
            #{episode.episode_number}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-card-foreground leading-tight line-clamp-1">
              {episode.episode_title}
            </p>
          </div>
        </div>

        {/* Channel & Time */}
        {(episode.channel_tv || episode.air_time) && (
          <div className="flex items-center gap-3 text-xs">
            {episode.channel_tv && (
              <div className="flex items-center gap-1">
                <Tv className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{episode.channel_tv}</span>
              </div>
            )}
            {episode.air_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{episode.air_time}</span>
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        {episode.editor_name && (
          <div className="flex items-center gap-1 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{episode.editor_name}</span>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{episode.progress_percentage}%</span>
          </div>
          <Progress
            value={episode.progress_percentage}
            className={cn(
              "h-1.5",
              episode.current_stage === "shooting" && "[&>div]:bg-purple-500",
              episode.current_stage === "editing" && "[&>div]:bg-blue-500",
              episode.current_stage === "pre_editing" && "[&>div]:bg-green-500",
              episode.current_stage === "delivered" && "[&>div]:bg-orange-500",
            )}
          />
        </div>

        {/* Notes */}
        {episode.notes && <p className="text-xs text-muted-foreground italic line-clamp-2">{episode.notes}</p>}
      </CardContent>
    </Card>
  );
}

// Project Group Section - shows project name and all episodes
function ProjectGroupSection({ projectGroup }: { projectGroup: ProjectGroup }) {
  return (
    <div className="space-y-2">
      {/* Project Header */}
      <div className="flex items-center gap-2 px-2">
        <FolderKanban className="h-4 w-4 text-primary" />
        <h4 className="font-bold text-sm text-card-foreground">{projectGroup.project_name}</h4>
        <Badge variant="outline" className="text-xs">
          {projectGroup.episodes.length} ep
        </Badge>
      </div>

      {/* Episode Cards */}
      <div className="space-y-2">
        {projectGroup.episodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
      </div>
    </div>
  );
}

// Stage Column - shows projects grouped by project name
function StageColumn({
  stageKey,
  config,
  stageData,
}: {
  stageKey: string;
  config: (typeof STAGE_CONFIG)[keyof typeof STAGE_CONFIG];
  stageData: StageData | undefined;
}) {
  const Icon = config.icon;

  return (
    <div className="flex flex-col space-y-3">
      {/* Column Header */}
      <div className={cn("rounded-lg border-2 p-3", config.bgLight)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className={cn("font-bold text-sm", config.textColor)}>{config.label}</h3>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {stageData?.total_episodes || 0}
          </Badge>
        </div>
      </div>

      {/* Project Groups */}
      <div className="space-y-4 min-h-50">
        {stageData?.projects.map((projectGroup) => (
          <ProjectGroupSection key={projectGroup.project_id} projectGroup={projectGroup} />
        ))}
        {(!stageData || stageData.projects.length === 0) && (
          <div className="text-center py-8 text-muted-foreground text-sm">Tidak ada episode</div>
        )}
      </div>
    </div>
  );
}

export default async function LiveBoardPage() {
  const { stageData } = await getLiveProductionData();

  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Auto Refresh Component */}
      <AutoRefresh intervalMs={30000} />

      {/* Header Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold">DREAMLIGHT Live Production Board</h1>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{currentTime}</span>
                </div>
                <Badge className="bg-green-500 text-white animate-pulse">
                  <span className="mr-1">●</span> LIVE
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Eye className="h-3 w-3" />
                  Read Only
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-4 space-y-4">
        {/* Stage Overview Bubbles - Smaller */}
        <div className="flex items-center justify-center gap-3 py-2">
          {Object.entries(STAGE_CONFIG).map(([key, config], index) => {
            const Icon = config.icon;
            const stage = stageData.find((s) => s.stage === key);
            const isLast = index === Object.entries(STAGE_CONFIG).length - 1;

            return (
              <div key={key} className="flex items-center gap-3">
                <div className="text-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 border-border mx-auto mb-1",
                      config.color,
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-bold text-xs text-card-foreground">{config.label}</div>
                  <div className="text-xs text-primary font-semibold">{stage?.total_episodes || 0}</div>
                </div>
                {!isLast && <div className="text-muted-foreground text-xl mb-4">›</div>}
              </div>
            );
          })}
        </div>

        {/* Kanban Board with Project Grouping */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STAGE_CONFIG).map(([key, config]) => (
              <StageColumn
                key={key}
                stageKey={key}
                config={config}
                stageData={stageData.find((s) => s.stage === key)}
              />
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground py-3 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <span>🔄 Auto-refresh setiap 30 detik</span>
            <span>•</span>
            <span>Update real-time tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
