import { redirect } from "next/navigation";

import { CheckCircle2, Clock, Film, FolderKanban, TrendingUp, Tv } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Broadcaster Projects",
  description: "View all projects and their production status",
};

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  status: string;
  description: string | null;
  production_status: "pre-production" | "production" | "post-production";
  total_episodes: number;
  completed_episodes: number;
  delivered_episodes: number;
  avg_progress: number;
  next_delivery: string | null;
  channel_tv: string | null;
  start_date: string | null;
  target_completion: string | null;
}

async function getBroadcasterProjects(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a broadcaster
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return [];
  }

  // Get projects with episodes
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      episodes (
        id,
        status,
        progress_percentage,
        deadline,
        channel_tv,
        episode_stages (
          current_stage
        )
      )
    `,
    )
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  // Process projects
  const processedProjects: Project[] =
    projects?.map((project: any) => {
      const episodes = project.episodes || [];
      const totalEpisodes = episodes.length;
      const completedEpisodes = episodes.filter((ep: any) => ep.status === "completed").length;
      const deliveredEpisodes = episodes.filter((ep: any) => {
        const stage = ep.episode_stages?.[0]?.current_stage;
        return stage === "delivered";
      }).length;

      const avgProgress =
        totalEpisodes > 0
          ? Math.round(
              episodes.reduce((sum: number, ep: any) => sum + (ep.progress_percentage || 0), 0) / totalEpisodes,
            )
          : 0;

      // Determine production status
      let productionStatus: "pre-production" | "production" | "post-production";
      if (avgProgress < 25) {
        productionStatus = "pre-production";
      } else if (avgProgress < 75) {
        productionStatus = "production";
      } else {
        productionStatus = "post-production";
      }

      // Find next delivery
      const upcomingEpisodes = episodes.filter((ep: any) => {
        const stage = ep.episode_stages?.[0]?.current_stage;
        return ep.deadline && stage !== "delivered";
      });
      upcomingEpisodes.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      const nextDelivery = upcomingEpisodes[0]?.deadline || null;

      // Get channel from first episode
      const channelTv = episodes[0]?.channel_tv || null;

      return {
        id: project.id,
        project_name: project.project_name,
        project_type: project.project_type,
        status: project.status,
        description: project.description,
        production_status: productionStatus,
        total_episodes: totalEpisodes,
        completed_episodes: completedEpisodes,
        delivered_episodes: deliveredEpisodes,
        avg_progress: avgProgress,
        next_delivery: nextDelivery,
        channel_tv: channelTv,
        start_date: project.start_date,
        target_completion: project.target_completion,
      };
    }) || [];

  return processedProjects;
}

const PRODUCTION_STATUS_CONFIG = {
  "pre-production": {
    label: "Pre-Production",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Planning & Preparation Phase",
    progress: "0-25%",
  },
  production: {
    label: "Production",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Active Shooting & Editing",
    progress: "25-75%",
  },
  "post-production": {
    label: "Post-Production",
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Finishing & Ready for Delivery",
    progress: "75-100%",
  },
} as const;

const PROJECT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  film: { label: "Film", color: "text-blue-700", bgColor: "bg-blue-100" },
  series: { label: "Series", color: "text-purple-700", bgColor: "bg-purple-100" },
  acara: { label: "Acara", color: "text-green-700", bgColor: "bg-green-100" },
  iklan: { label: "Iklan", color: "text-orange-700", bgColor: "bg-orange-100" },
};

function ProjectCard({ project }: { project: Project }) {
  const statusConfig = PRODUCTION_STATUS_CONFIG[project.production_status];
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type] || PROJECT_TYPE_CONFIG.series;

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>{statusConfig.label}</Badge>
              <Badge className={cn(typeConfig.bgColor, typeConfig.color)}>{typeConfig.label}</Badge>
            </div>
            <CardTitle className="line-clamp-1">{project.project_name}</CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2 mt-2">{project.description}</CardDescription>
            )}
          </div>
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Production Status Info */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="text-xs text-muted-foreground mb-1">Current Phase</div>
          <div className="font-semibold">{statusConfig.description}</div>
          <div className="text-xs text-muted-foreground mt-1">Progress Range: {statusConfig.progress}</div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{project.avg_progress}%</span>
          </div>
          <Progress value={project.avg_progress} />
        </div>

        {/* Episodes Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted">
            <div className="text-xl font-bold">{project.total_episodes}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-50">
            <div className="text-xl font-bold text-green-700">{project.delivered_episodes}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-50">
            <div className="text-xl font-bold text-orange-700">
              {project.total_episodes - project.delivered_episodes}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Next Delivery */}
        {project.next_delivery && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Next delivery:</span>
            <span className="font-medium">
              {new Date(project.next_delivery).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Channel */}
        {project.channel_tv && (
          <div className="flex items-center gap-2 text-sm">
            <Tv className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Channel:</span>
            <span className="font-medium">{project.channel_tv}</span>
          </div>
        )}

        {/* Target Completion */}
        {project.target_completion && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Target:{" "}
              {new Date(project.target_completion).toLocaleDateString("id-ID", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Action */}
        <Button variant="outline" className="w-full" size="sm">
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectStats({ projects }: { projects: Project[] }) {
  const totalProjects = projects.length;
  const preProductionCount = projects.filter((p) => p.production_status === "pre-production").length;
  const productionCount = projects.filter((p) => p.production_status === "production").length;
  const postProductionCount = projects.filter((p) => p.production_status === "post-production").length;
  const avgProgress =
    totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + p.avg_progress, 0) / totalProjects) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pre-Production</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{preProductionCount}</div>
          <p className="text-xs text-muted-foreground">Planning phase</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Production</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{productionCount}</div>
          <p className="text-xs text-muted-foreground">Active shooting</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Post-Production</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{postProductionCount}</div>
          <p className="text-xs text-muted-foreground">Finishing</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          <Tv className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgProgress}%</div>
          <Progress value={avgProgress} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function BroadcasterProjectsPage() {
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

  const projects = await getBroadcasterProjects(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Status</h1>
        <p className="text-muted-foreground">View high-level production status for all projects</p>
      </div>

      {/* Stats */}
      <ProjectStats projects={projects} />

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Assigned</h3>
            <p className="text-sm text-muted-foreground text-center">You haven't been assigned to any projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
