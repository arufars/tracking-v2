import { redirect } from "next/navigation";

import { AlertCircle, Calendar, CheckCircle2, Clock, Film, Package, TrendingUp, Tv } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Broadcaster Dashboard",
  description: "Monitor project status and delivery schedule",
};

interface ProjectSummary {
  id: string;
  project_name: string;
  project_type: string;
  status: string;
  production_status: "pre-production" | "production" | "post-production";
  total_episodes: number;
  completed_episodes: number;
  delivered_episodes: number;
  avg_progress: number;
  next_delivery: string | null;
  channel_tv: string | null;
}

interface UpcomingDelivery {
  id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  deadline: string;
  current_stage: string;
  progress_percentage: number;
  days_until: number;
}

async function getBroadcasterData(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a broadcaster
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return { projects: [], upcomingDeliveries: [] };
  }

  // Get projects with episodes
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      project_name,
      project_type,
      status,
      episodes (
        id,
        episode_number,
        episode_title,
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
    console.error("Error fetching broadcaster data:", error);
    return { projects: [], upcomingDeliveries: [] };
  }

  // Process projects
  const projectSummaries: ProjectSummary[] = [];
  const allDeliveries: UpcomingDelivery[] = [];

  projects?.forEach((project: any) => {
    const episodes = project.episodes || [];
    const totalEpisodes = episodes.length;
    const completedEpisodes = episodes.filter((ep: any) => ep.status === "completed").length;
    const deliveredEpisodes = episodes.filter((ep: any) => {
      const stage = ep.episode_stages?.[0]?.current_stage;
      return stage === "delivered";
    }).length;

    const avgProgress =
      totalEpisodes > 0
        ? Math.round(episodes.reduce((sum: number, ep: any) => sum + (ep.progress_percentage || 0), 0) / totalEpisodes)
        : 0;

    // Determine production status based on progress
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

    projectSummaries.push({
      id: project.id,
      project_name: project.project_name,
      project_type: project.project_type,
      status: project.status,
      production_status: productionStatus,
      total_episodes: totalEpisodes,
      completed_episodes: completedEpisodes,
      delivered_episodes: deliveredEpisodes,
      avg_progress: avgProgress,
      next_delivery: nextDelivery,
      channel_tv: channelTv,
    });

    // Collect upcoming deliveries
    upcomingEpisodes.slice(0, 5).forEach((ep: any) => {
      const today = new Date();
      const deadline = new Date(ep.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      allDeliveries.push({
        id: ep.id,
        project_name: project.project_name,
        episode_number: ep.episode_number,
        episode_title: ep.episode_title,
        deadline: ep.deadline,
        current_stage: ep.episode_stages?.[0]?.current_stage || "shooting",
        progress_percentage: ep.progress_percentage || 0,
        days_until: daysUntil,
      });
    });
  });

  // Sort deliveries by date
  allDeliveries.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return {
    projects: projectSummaries,
    upcomingDeliveries: allDeliveries.slice(0, 10),
  };
}

const PRODUCTION_STATUS_CONFIG = {
  "pre-production": {
    label: "Pre-Production",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Planning & Preparation",
  },
  production: {
    label: "Production",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Active Shooting & Editing",
  },
  "post-production": {
    label: "Post-Production",
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Finishing & Delivery",
  },
} as const;

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  shooting: { label: "Shooting", color: "text-blue-700" },
  editing: { label: "Editing", color: "text-purple-700" },
  review: { label: "Review", color: "text-orange-700" },
  delivered: { label: "Delivered", color: "text-green-700" },
};

function ProjectStatusCard({ project }: { project: ProjectSummary }) {
  const statusConfig = PRODUCTION_STATUS_CONFIG[project.production_status];

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>{statusConfig.label}</Badge>
              <Badge variant="outline">{project.project_type}</Badge>
            </div>
            <CardTitle className="line-clamp-1">{project.project_name}</CardTitle>
            <CardDescription className="text-xs mt-1">{statusConfig.description}</CardDescription>
          </div>
          <Tv className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{project.avg_progress}%</span>
          </div>
          <Progress value={project.avg_progress} />
        </div>

        {/* Episodes Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{project.total_episodes}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-2 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-700">{project.delivered_episodes}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-700">
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
      </CardContent>
    </Card>
  );
}

function UpcomingDeliveryCard({ delivery }: { delivery: UpcomingDelivery }) {
  const isUrgent = delivery.days_until <= 3 && delivery.days_until >= 0;
  const isOverdue = delivery.days_until < 0;
  const stageConfig = STAGE_CONFIG[delivery.current_stage] || STAGE_CONFIG.shooting;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isOverdue && "border-red-500 border-2",
        isUrgent && "border-orange-500",
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              {isUrgent && !isOverdue && (
                <Badge variant="outline" className="text-orange-600">
                  Urgent
                </Badge>
              )}
              <Badge variant="outline" className={stageConfig.color}>
                {stageConfig.label}
              </Badge>
            </div>
            <h3 className="font-semibold line-clamp-1">
              {delivery.project_name} - E{delivery.episode_number}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{delivery.episode_title}</p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={cn(isOverdue && "text-red-600 font-medium", isUrgent && "text-orange-600 font-medium")}>
                {isOverdue
                  ? `${Math.abs(delivery.days_until)} days overdue`
                  : isUrgent
                    ? `${delivery.days_until} days left`
                    : new Date(delivery.deadline).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{delivery.progress_percentage}%</div>
            <Progress value={delivery.progress_percentage} className="mt-2 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BroadcasterStats({
  projects,
  upcomingDeliveries,
}: {
  projects: ProjectSummary[];
  upcomingDeliveries: UpcomingDelivery[];
}) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in-progress").length;
  const totalEpisodes = projects.reduce((sum, p) => sum + p.total_episodes, 0);
  const deliveredEpisodes = projects.reduce((sum, p) => sum + p.delivered_episodes, 0);
  const urgentDeliveries = upcomingDeliveries.filter((d) => d.days_until <= 7 && d.days_until >= 0).length;
  const overdueDeliveries = upcomingDeliveries.filter((d) => d.days_until < 0).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">of {totalProjects} total projects</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Episodes Delivered</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deliveredEpisodes}</div>
          <p className="text-xs text-muted-foreground">
            of {totalEpisodes} total episodes (
            {totalEpisodes > 0 ? Math.round((deliveredEpisodes / totalEpisodes) * 100) : 0}
            %)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Deliveries</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{urgentDeliveries}</div>
          <p className="text-xs text-muted-foreground">In next 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueDeliveries}</div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function BroadcasterPage() {
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

  const { projects, upcomingDeliveries } = await getBroadcasterData(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcaster Dashboard</h1>
        <p className="text-muted-foreground">Monitor project progress and delivery schedule</p>
      </div>

      {/* Stats */}
      <BroadcasterStats projects={projects} upcomingDeliveries={upcomingDeliveries} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Status */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Project Status</h2>
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tv className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Assigned</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You haven't been assigned to any projects yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectStatusCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Deliveries</h2>
          {upcomingDeliveries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">No upcoming deliveries scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingDeliveries.map((delivery) => (
                <UpcomingDeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
